// Real photographic fixture acceptance, not a live AI-provider test.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import {runMedia} from '../apps/web/src/server/media.mjs';
import {verifyProductionOutput} from './check-production-output.mjs';
import {newClip} from '../packages/timeline/src/editor.mjs';
import {captionPresets,captionSettings,captionLayout,estimatedWords,titleLayout} from '../packages/timeline/src/production.mjs';
const dir=resolve('data/test-runs/production-acceptance'),base='http://127.0.0.1:3100/api/editor';
await mkdir(dir,{recursive:true});
await runMedia(ffmpeg,['-y','-v','error','-stream_loop','-1','-i',join(dir,'flower-source.mp4'),'-i',join(dir,'offline-test-voice.wav'),'-t','20','-map','0:v:0','-map','1:a:0','-vf','scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-af','apad','-movflags','+faststart',join(dir,'photographic-test-with-speech.mp4')],600000);
async function api(path,body){const response=await fetch(base+'/'+path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await response.json();assert.ok(response.ok,JSON.stringify(value));return value;}
let state=await api('projects',{name:'Production proof · photographic test footage'});const pid=state.project.id;
const bytes=await readFile(join(dir,'photographic-test-with-speech.mp4'));
const imported=await fetch(`${base}/projects/${pid}/import`,{method:'POST',headers:{'x-file-name':'photographic-test-with-speech.mp4','Content-Type':'application/octet-stream'},body:bytes});const asset=await imported.json();assert.ok(imported.ok,JSON.stringify(asset));assert.equal(asset.hash,createHash('sha256').update(bytes).digest('hex'));assert.ok(asset.duration>19.9);assert.ok(asset.hasAudio);state=await api(`projects/${pid}`);
async function edit(operations,label){state=await api(`projects/${pid}/operations`,{expectedRevision:state.revision,requestKey:crypto.randomUUID(),operations,label});}
await edit([{type:'UpdateProject',sequence:{width:1280,height:720}}],'Set photographic proof canvas');
const picture=newClip(state.project,'video',asset);assert.equal(picture.durationFrames,600);
await edit([{type:'AddClip',trackId:state.project.tracks[0].id,clip:picture},{type:'UpdateProject',sequence:{durationFrames:600}}],'Full twenty-second source import');
assert.equal(state.project.tracks[0].clips[0].durationFrames,600);
await edit([{type:'SplitClip',clipId:picture.id,frame:300,newId:'second-photographic-shot'},{type:'UpdateFit',clipId:'second-photographic-shot',fit:'cover'},{type:'CrossfadeClip',clipId:'second-photographic-shot',durationFrames:12}],'Real overlapping dissolve');
const title=newClip(state.project,'text');title.text='A closer look.';title.design={preset:'kinetic',accent:'#d8ff52'};title.transform=titleLayout('hero',state.project.sequence);title.transform.y=105;title.transform.height=180;title.textStyle.fontSize=80;title.textStyle.weight=800;title.animation={preset:'none',inFrames:0,outFrames:0};title.durationFrames=90;
const lower=newClip(state.project,'text',null,480);lower.text='MOTION OS\nA real exported sequence';lower.design={preset:'lower-third',accent:'#d8ff52'};lower.transform=titleLayout('lower-third',state.project.sequence);lower.transform.y=60;lower.textStyle.fontSize=28;lower.durationFrames=108;lower.animation={preset:'fade',inFrames:10,outFrames:8};
const operations=[{type:'AddClip',trackId:state.project.tracks[2].id,clip:title},{type:'AddClip',trackId:state.project.tracks[2].id,clip:lower}];
const copy=['A closer look changes everything.','Real footage, carefully framed.','Clear words, timed to the story.','Titles that feel intentional.','Motion that connects each moment.','One real finished video.'];
for(const [i,preset] of captionPresets.entries()){const c=newClip(state.project,'captions',null,i*90+9);c.durationFrames=80;c.text=copy[i];c.name=preset.name+' · estimated test timing';c.caption=captionSettings(preset.id);c.words=estimatedWords(c.text,c.durationFrames);c.words[1].emphasis=true;c.transform=captionLayout(state.project.sequence);c.textStyle.fontSize=48;c.textStyle.weight=750;c.textStyle.backgroundOpacity=0;c.animation={preset:'none',inFrames:0,outFrames:0};operations.push({type:'AddClip',trackId:state.project.tracks[3].id,clip:c});}
await edit(operations,'Six burned-in caption treatments and editable title designs');
const original=await api(`projects/${pid}`);assert.equal(original.revision,state.revision);
const available=await api('production-config');assert.ok(available.worker.online,'The worker must be online');
const {jobId}=await api(`projects/${pid}/export`,{expectedRevision:state.revision});
const evidence={projectId:pid,revision:state.revision,jobId,assetId:asset.id,originalHash:asset.hash,source:'MDN photographic flower sample, looped to twenty seconds for full-duration import testing',sourceURL:'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video',voice:'Offline Windows SAPI engineering-test speech; not AI-generated',captionTiming:'Estimated manual cues; real-provider ASR requires credentials',checks:['actual source import','original checksum','full twenty-second duration','source split offsets','overlapping dissolve','six burned-in caption styles','kinetic and lower-third titles','worker online'],liveAIProviderVerified:false,browserGesturesVerified:false};
await writeFile(join(dir,'evidence.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
let last='';const deadline=Date.now()+20*60*1000;
while(Date.now()<deadline){const snapshot=await api(`projects/${pid}`),job=snapshot.jobs.find(j=>j.id===jobId);if(job.stage!==last){console.log(job.stage);last=job.stage;}if(job.status==='failed')throw new Error(job.error);if(job.status==='completed'){
  await verifyProductionOutput(evidence,dir,base);break;
}await new Promise(r=>setTimeout(r,5000));}
if(!evidence.output)throw new Error('Export did not finish within twenty minutes.');
