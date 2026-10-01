// Project-scoped adapter using the same repository and reducer as manual edits.
import {getProject,edit,addMessage,validateAssets,queueExport} from './editor-store.mjs';
import {fail,text} from './store.mjs';
import {applyOperations,newClip} from '../../../../packages/timeline/src/editor.mjs';

const directOperations=new Set(['UpdateText','UpdateTransform','UpdateAnimation','UpdateAudio','UpdateFit','UpdateCaption','UpdateDesign','UpdateTransition','AddKeyframe','RemoveKeyframe']);
export function agentSnapshot(projectId){
  const s=getProject(projectId);
  return {project:s.project,revision:s.revision,selection:s.selection,canUndo:s.canUndo,canRedo:s.canRedo,
    media:s.media.map(({id,name,kind,duration,width,height,hasAudio,hash,folder,tags})=>({id,name,kind,duration,width,height,hasAudio,hash,folder,tags})),
    history:s.history,jobs:s.jobs.map(({id,revision,status,stage,error})=>({id,revision,status,stage,error}))};
}
export function agentEdit(projectId,input){
  const current=getProject(projectId);
  if(input.expectedRevision!==current.revision)fail('Project changed. Inspect the latest revision before editing.',409);
  const label=text(input.label,'Edit summary',150);
  const requestKey=text(input.requestKey,'Request key',100);
  const operations=input.operations;
  const next=validateAssets(applyOperations(current.project,operations));
  const selected=new Set(current.selection.clipIds||[]);
  const smallSelectedEdit=operations.length<=5&&operations.every(op=>directOperations.has(op.type)&&selected.has(op.clipId));
  if(!smallSelectedEdit||input.proposeOnly){
    const message=addMessage(projectId,'assistant',{text:label,provider:'External agent · MCP',revision:current.revision,operations,applied:false});
    return {status:'approval_required',proposalId:message.id,revision:current.revision,summary:label,
      affectedClipCount:new Set(operations.map(op=>op.clipId||op.clip?.id).filter(Boolean)).size,
      resultingDurationFrames:next.sequence.durationFrames,instruction:'Review Apply edit in the Director panel. The timeline has not changed. This server cannot approve its own proposal.'};
  }
  const saved=edit(projectId,{expectedRevision:input.expectedRevision,requestKey,label,operations},'mcp');
  return {status:'applied',revision:saved.revision,project:saved.project};
}
export function agentAddClip(projectId,input){
  const s=getProject(projectId);const asset=input.assetId?s.media.find(a=>a.id===input.assetId):null;
  if(input.assetId&&!asset)fail('Media is not attached to this project.');
  if(!asset&&!['text','captions'].includes(input.kind))fail('Choose attached media, text or captions.');
  const clip=newClip(s.project,asset?.kind||input.kind,asset,input.startFrame??s.selection.frame??0);
  if(input.text!==undefined)clip.text=input.text;
  if(input.durationFrames!==undefined)clip.durationFrames=input.durationFrames;
  return agentEdit(projectId,{...input,proposeOnly:true,operations:[{type:'AddClip',trackId:input.trackId,clip}]});
}
export function agentExport(projectId,expectedRevision){
  const jobId=queueExport(projectId,expectedRevision);
  return {jobId,revision:expectedRevision,instruction:'Export queued or reused for this revision. Poll export_status; only completed means the MP4 has passed validation. The local worker must be running.'};
}
