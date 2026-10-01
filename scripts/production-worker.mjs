import {readFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import ffmpeg from 'ffmpeg-static';
import {dataDir,id,now} from '../apps/web/src/server/store.mjs';
import {getProject,addMessage,validateAssets,db as editorDb} from '../apps/web/src/server/editor-store.mjs';
import {claimProduction,db,productionStage} from '../apps/web/src/server/production-store.mjs';
import {requireProviders} from '../apps/web/src/server/production-config.mjs';
import {transcribeAudio,planFilm,synthesizeSpeech,startVideo,waitVideo,fetchVideoOutput} from '../apps/web/src/server/production-providers.mjs';
import {mediaRoot,runMedia,importMedia} from '../apps/web/src/server/media.mjs';
import {newClip,applyOperations} from '../packages/timeline/src/editor.mjs';
import {captionLayout,captionsFromWords,captionSettings,titleLayout} from '../packages/timeline/src/production.mjs';

const status=jobId=>db().prepare('SELECT status FROM production_jobs WHERE id=?').get(jobId)?.status;
export function captionOperations(project,words,startFrame,preset){const trackId=id(),operations=[{type:'AddTrack',id:trackId,kind:'captions',name:'Speech captions'}];for(const cue of captionsFromWords(words,project.sequence,startFrame,preset)){const clip={...newClip(project,'captions',null,cue.startFrame),...cue,transform:captionLayout(project.sequence),animation:{preset:'none',inFrames:0,outFrames:0}};clip.name=cue.text.slice(0,80);clip.textStyle.fontSize=Math.round(Math.min(project.sequence.width,project.sequence.height)*.053);clip.textStyle.backgroundOpacity=0;operations.push({type:'AddClip',trackId,clip});}return operations;}
async function generatedAsset(projectId,response,name,source){
  if(!response.body)throw new Error('The provider returned an empty media response.');
  const request=new Request('http://127.0.0.1/generated',{method:'POST',headers:{'x-file-name':encodeURIComponent(name),'Content-Type':'application/octet-stream'},body:response.body,duplex:'half'});
  const asset=await importMedia(projectId,request);asset.source=source;asset.folder='Generated';asset.tags=[source];editorDb().prepare('UPDATE editor_media SET body=? WHERE id=? AND project_id=?').run(JSON.stringify(asset),asset.id,projectId);return asset;
}
export async function workProductionJob(){
  const job=claimProduction();if(!job)return false;const abort=new AbortController();let result={assetIds:[],tasks:[]};
  const heartbeat=setInterval(()=>{if(status(job.id)==='cancelled')abort.abort();else db().prepare("UPDATE production_jobs SET lease_until=? WHERE id=? AND status='running'").run(Date.now()+120000,job.id);},2000);
  try{
    requireProviders({video:job.kind!=='transcribe',writing:job.kind!=='broll'});
    const row=editorDb().prepare('SELECT body FROM editor_revisions WHERE project_id=? AND number=?').get(job.project_id,job.revision);if(!row)throw new Error('The production source revision is missing.');const project=JSON.parse(row.body),s=getProject(job.project_id),dir=join(dataDir,'production',job.id);await mkdir(dir,{recursive:true});
    let operations=[];
    if(job.kind==='transcribe'){
      const clip=project.tracks.flatMap(t=>t.clips).find(c=>c.id===job.input.clipId),asset=s.media.find(a=>a.id===clip.assetId),audio=join(dir,'speech.mp3');productionStage(job.id,'Extracting the selected source range');
      await runMedia(ffmpeg,['-y','-v','error','-ss',String(clip.sourceInFrame/project.sequence.fps),'-i',join(mediaRoot,asset.original),'-t',String(clip.durationFrames/project.sequence.fps),'-vn','-ac','1','-ar','16000','-b:a','64k',audio],600000);abort.signal.throwIfAborted();
      productionStage(job.id,'Recognizing speech and word timing');const transcript=await transcribeAudio(await readFile(audio),job.input.language,abort.signal);result.transcript=transcript.text;result.words=transcript.words;productionStage(job.id,'Building timed caption groups',result);
      const latest=getProject(job.project_id),currentClip=latest.project.tracks.flatMap(t=>t.clips).find(c=>c.id===clip.id);if(JSON.stringify(currentClip)!==JSON.stringify(clip)||latest.project.sequence.fps!==project.sequence.fps)throw new Error('The speech clip changed during transcription. The transcript is preserved; rerun against the current source range.');
      const inRange=transcript.words.filter(w=>Number(w.end)*project.sequence.fps<=clip.durationFrames+1).map(w=>({...w,end:Math.min(Number(w.end),clip.durationFrames/project.sequence.fps)}));operations=captionOperations(latest.project,inRange,clip.startFrame,job.input.preset);
    }else{
      const plan=job.kind==='film'?await planFilm(job.input.prompt,job.input.seconds,abort.signal):{title:'Generated B-roll',scenes:[{shot:job.input.prompt,narration:'',headline:'',seconds:job.input.seconds}]};result.plan=plan;productionStage(job.id,'Production plan prepared',result);
      const existingVideo=job.kind==='broll'?project.tracks.find(t=>t.kind==='video'&&t.name==='Generated footage'&&!t.locked):null;const videoTrack=existingVideo?.id||id(),titleTrack=id(),voiceTrack=id(),captionTrack=id();operations=existingVideo?[]:[{type:'AddTrack',id:videoTrack,kind:'video',name:'Generated footage'}];if(plan.scenes.some(s=>s.headline.trim()))operations.push({type:'AddTrack',id:titleTrack,kind:'text',name:'Production titles'});if(job.input.voice&&plan.scenes.some(s=>s.narration.trim()))operations.push({type:'AddTrack',id:voiceTrack,kind:'voiceover',name:'AI voice'},{type:'AddTrack',id:captionTrack,kind:'captions',name:'Production captions'});if(project.tracks.length+operations.length>24)throw new Error('This production needs more timeline tracks. Create a separate project before generating footage.');
      let cursor=job.input.startFrame,previousSilence=0;
      for(const [index,scene] of plan.scenes.entries()){
        abort.signal.throwIfAborted();let voice=null,words=null,seconds=scene.seconds;
        if(job.input.voice&&scene.narration.trim()){
          productionStage(job.id,`Generating narration · shot ${index+1}/${plan.scenes.length}`);voice=await generatedAsset(job.project_id,await synthesizeSpeech(scene.narration,abort.signal),`voice-${index+1}.mp3`,'ai-voice');result.assetIds.push(voice.id);seconds=Math.max(seconds,Math.ceil(voice.duration));if(seconds>10)throw new Error('The generated narration is longer than ten seconds. The audio is preserved; use a shorter spoken line.');
          const audio=join(dir,`voice-${index+1}.mp3`);await runMedia(ffmpeg,['-y','-v','error','-i',join(mediaRoot,voice.original),'-vn','-ac','1','-ar','16000','-b:a','64k',audio]);words=(await transcribeAudio(await readFile(audio),'',abort.signal)).words;
        }
        productionStage(job.id,`Requesting footage · shot ${index+1}/${plan.scenes.length}`,result);const taskId=await startVideo(scene.shot,seconds,project.sequence.height>project.sequence.width,abort.signal);result.tasks.push({index,taskId,seconds});productionStage(job.id,`Generating footage · shot ${index+1}/${plan.scenes.length}`,result);
        const output=await waitVideo(taskId,abort.signal,state=>productionStage(job.id,`Footage ${state.toLowerCase()} · shot ${index+1}/${plan.scenes.length}`));
        const asset=await generatedAsset(job.project_id,await fetchVideoOutput(output,abort.signal),`shot-${index+1}.mp4`,'ai-runway');result.assetIds.push(asset.id);productionStage(job.id,`Footage saved · shot ${index+1}/${plan.scenes.length}`,result);
        const overlap=index?Math.min(10,previousSilence):0;cursor-=overlap;const picture=newClip(project,'video',asset,cursor);picture.durationFrames=Math.min(Math.round(seconds*project.sequence.fps),Math.floor(asset.duration*project.sequence.fps));if(voice&&Math.floor(voice.duration*project.sequence.fps)>picture.durationFrames)throw new Error('The generated footage is shorter than the narration. Media is preserved for review.');picture.fit='cover';picture.audio.muted=true;picture.animation={preset:'none',inFrames:0,outFrames:0};picture.transition={preset:overlap?'dissolve':'none',inFrames:overlap,outFrames:0};operations.push({type:'AddClip',trackId:videoTrack,clip:picture});
        if(scene.headline.trim()){const title=newClip(project,'text',null,cursor);title.text=scene.headline;title.durationFrames=Math.min(picture.durationFrames,project.sequence.fps*3);title.design={preset:'kinetic',accent:'#d8ff52'};title.transform=titleLayout('hero',project.sequence);title.transform.y=project.sequence.height*.18;title.animation={preset:'fade',inFrames:8,outFrames:8};operations.push({type:'AddClip',trackId:titleTrack,clip:title});}
        if(voice){const audio=newClip(project,'audio',voice,cursor);audio.durationFrames=Math.floor(voice.duration*project.sequence.fps);operations.push({type:'AddClip',trackId:voiceTrack,clip:audio});}
        if(words){const captions=captionOperations(project,words.filter(w=>Number(w.end)*project.sequence.fps<=picture.durationFrames),cursor,job.input.preset);operations.push(...captions.slice(1).map(op=>({...op,trackId:captionTrack})));}
        previousSilence=voice?Math.max(0,picture.durationFrames-Math.ceil(voice.duration*project.sequence.fps)):picture.durationFrames;cursor+=picture.durationFrames;
      }
      if(!project.tracks.some(t=>t.clips.length))operations.push({type:'UpdateProject',sequence:{durationFrames:cursor}});
      result.durationFrames=cursor-job.input.startFrame;
    }
    abort.signal.throwIfAborted();const latest=getProject(job.project_id);
    if(job.kind!=='transcribe'&&(latest.project.sequence.fps!==project.sequence.fps||latest.project.sequence.width!==project.sequence.width||latest.project.sequence.height!==project.sequence.height))throw new Error('Sequence settings changed during generation. Generated assets remain in the library; assemble them using the current settings.');
    const validated=validateAssets(applyOperations(latest.project,operations));if(!validated.tracks.some(t=>t.clips.length))throw new Error('Production produced no usable timeline clips.');
    const proposal=addMessage(job.project_id,'assistant',{text:job.kind==='transcribe'?'Timed speech captions are ready. Review and apply them.':'Your footage, narration, titles and captions are ready as an editable production. Review, apply and export.',provider:job.kind==='transcribe'?'AI transcription':'AI production',revision:latest.revision,operations,applied:false});
    result.proposalId=proposal.id;result.revision=latest.revision;
    if(status(job.id)!=='cancelled')db().prepare("UPDATE production_jobs SET status='completed',stage='Ready to apply',result=?,lease_until=NULL,updated_at=? WHERE id=?").run(JSON.stringify(result),now(),job.id);
  }catch(error){if(status(job.id)!=='cancelled')db().prepare("UPDATE production_jobs SET status='failed',stage='Needs attention',error=?,result=?,lease_until=NULL,updated_at=? WHERE id=?").run(String(error.message).slice(0,600),JSON.stringify(result),now(),job.id);}finally{clearInterval(heartbeat);}return true;
}
