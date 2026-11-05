// Project-scoped adapter using the same repository and reducer as manual edits.
import {getProject,edit,addMessage,validateAssets,queueExport} from './editor-store.mjs';
import {fail,text} from './store.mjs';
import {applyOperations,newClip} from '../../../../packages/timeline/src/editor.mjs';
import {captionSettings,estimatedWords,captionLayout,titleLayout} from '../../../../packages/timeline/src/production.mjs';

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
  if(!asset&&!['text','captions','graphics'].includes(input.kind))fail('Choose attached media, text or captions.');
  const clip=newClip(s.project,asset?.kind||input.kind,asset,input.startFrame??s.selection.frame??0);
  if(input.text!==undefined)clip.text=input.text;
  if(input.durationFrames!==undefined)clip.durationFrames=input.durationFrames;
  if(input.preset){
    if(input.kind==='captions'){
      clip.caption=captionSettings(input.preset,input.accent);
      clip.words=estimatedWords(clip.text,clip.durationFrames);
      clip.transform=captionLayout(s.project.sequence);
    }else{
      clip.design={preset:input.preset,accent:input.accent||'#ffd700'};
      clip.transform=titleLayout(input.preset,s.project.sequence);
    }
  }
  return agentEdit(projectId,{...input,proposeOnly:true,operations:[{type:'AddClip',trackId:input.trackId,clip}]});
}
export function agentSocialCaptions(projectId,input){
  const s=getProject(projectId);
  const track=s.project.tracks.find(t=>t.id===input.trackId);
  if(!track)fail('Track not found.');
  const preset=input.preset||'hormozi';
  const accent=input.accent||(preset==='hormozi'?'#ffd700':preset==='neon'?'#00e5ff':'#baff83');
  const duration=input.durationFrames||s.project.sequence.fps*5;
  const start=input.startFrame??s.selection.frame??0;
  const clip=newClip(s.project,'captions',null,start);
  clip.durationFrames=duration;
  clip.text=input.text||'Make every word punch.';
  clip.caption=captionSettings(preset,accent);
  clip.words=estimatedWords(clip.text,clip.durationFrames);
  clip.transform=captionLayout(s.project.sequence);
  clip.textStyle.fontSize=Math.round(Math.min(s.project.sequence.width,s.project.sequence.height)*0.055);
  clip.textStyle.backgroundOpacity=0;
  return agentEdit(projectId,{...input,label:input.label||`Add ${preset} captions`,proposeOnly:true,operations:[{type:'AddClip',trackId:input.trackId,clip}]});
}
export function agentMotionGraphic(projectId,input){
  const s=getProject(projectId);
  const track=s.project.tracks.find(t=>t.id===input.trackId);
  if(!track)fail('Track not found.');
  const template=input.template||'hook-badge';
  const accent=input.accent||'#ffd700';
  const start=input.startFrame??s.selection.frame??0;
  const duration=input.durationFrames||(template==='hook-badge'?s.project.sequence.fps*3:s.project.sequence.fps*4);
  const clip=newClip(s.project,'text',null,start);
  clip.durationFrames=duration;
  clip.text=input.text||(template==='hook-badge'?'STOP SCROLLING':template==='top-banner'?'THE KEY LESSON':'+300% IMPACT');
  clip.name=template;
  clip.design={preset:template,accent};
  clip.transform=titleLayout(template,s.project.sequence);
  clip.animation={preset:template==='hook-badge'?'rise':template==='top-banner'?'fade':'none',inFrames:10,outFrames:8};
  return agentEdit(projectId,{...input,label:input.label||`Add ${template} motion graphic`,proposeOnly:true,operations:[{type:'AddClip',trackId:input.trackId,clip}]});
}
export function agentTightenSilences(projectId,input){
  const s=getProject(projectId);
  const clip=s.project.tracks.flatMap(t=>t.clips).find(c=>c.id===input.clipId);
  if(!clip)fail('Clip not found.');
  const cuts=input.silenceCuts||[];
  const operations=[];
  if(!cuts.length){
    operations.push({type:'UpdateAudio',clipId:clip.id,values:{fadeInFrames:6,fadeOutFrames:6}});
  }else{
    for(const cut of cuts){
      if(cut>clip.startFrame&&cut<clip.startFrame+clip.durationFrames){
        operations.push({type:'SplitClip',clipId:clip.id,frame:cut});
      }
    }
  }
  return agentEdit(projectId,{...input,label:input.label||`Tighten silences on ${clip.name}`,proposeOnly:true,operations});
}
export function agentExport(projectId,expectedRevision){
  const jobId=queueExport(projectId,expectedRevision);
  return {jobId,revision:expectedRevision,instruction:'Export queued or reused for this revision. Poll export_status; only completed means the MP4 has passed validation. The local worker must be running.'};
}