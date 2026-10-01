import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {newClip,parseSubtitles} from '../packages/timeline/src/editor.mjs';
const base='http://127.0.0.1:3100/api/editor';
async function request(path,body){const response=await fetch(`${base}/${path}`,body?{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:3100'},body:JSON.stringify(body)}:{});const result=await response.json();assert.ok(response.ok,JSON.stringify(result));return result;}
let state=await request('projects',{name:'Editor acceptance · synthetic media',ratio:'16:9'});const pid=state.project.id;
const fixture=resolve('data/verification/editor-fixtures');const assets=[];
for(const filename of ['01-motion-test.mp4','02-color-test.mp4','03-image-test.png','04-audio-test.wav']){
  const bytes=await readFile(join(fixture,filename));const response=await fetch(`${base}/projects/${pid}/import`,{method:'POST',headers:{'x-file-name':encodeURIComponent(filename),'Content-Type':'application/octet-stream'},body:bytes});const asset=await response.json();assert.ok(response.ok,JSON.stringify(asset));assert.equal(asset.hash,createHash('sha256').update(bytes).digest('hex'));assets.push(asset);console.log(`Imported ${filename}: ${asset.kind}, ${asset.bytes} bytes`);
}
state=await request(`projects/${pid}`);assert.equal(state.media.length,4);
async function edit(operations,label){state=await request(`projects/${pid}/operations`,{expectedRevision:state.revision,requestKey:crypto.randomUUID(),operations,label});}
const [video,image,title,captions,music]=state.project.tracks;
await edit([{type:'AddTrack',id:'secondary-video',kind:'video',name:'Video 2'},{type:'ReorderTrack',trackId:'secondary-video',index:1}],'Add independent video track');
const a=newClip(state.project,'video',assets[0],0),b=newClip(state.project,'video',assets[1],180),photo=newClip(state.project,'image',assets[2],150),audio=newClip(state.project,'audio',assets[3],0),headline=newClip(state.project,'text',null,0);
photo.durationFrames=90;photo.transform={x:1470,y:85,width:340,height:340,rotation:0,opacity:1};audio.durationFrames=300;audio.audio.volume=.6;headline.text='Real media. One editable timeline.';headline.textStyle.backgroundOpacity=.78;headline.durationFrames=90;
await edit([{type:'AddClip',trackId:video.id,clip:a},{type:'AddClip',trackId:'secondary-video',clip:b},{type:'AddClip',trackId:image.id,clip:photo},{type:'AddClip',trackId:music.id,clip:audio},{type:'AddClip',trackId:title.id,clip:headline}],'Insert four media assets and animated title');
await edit([{type:'TrimClip',clipId:a.id,durationFrames:120,sourceInFrame:30},{type:'MoveClip',clipId:b.id,startFrame:120},{type:'TrimClip',clipId:b.id,durationFrames:150,sourceInFrame:10},{type:'SplitClip',clipId:b.id,frame:210,newId:'split-video'},{type:'MoveClip',clipId:'split-video',startFrame:240},{type:'UpdateProject',sequence:{durationFrames:300}}],'Trim, split and rearrange footage');
const cues=parseSubtitles(await readFile(join(fixture,'05-caption-test.srt'),'utf8'),30);
await edit(cues.map(cue=>({type:'AddClip',trackId:captions.id,clip:{...newClip(state.project,'captions',null,cue.startFrame),...cue,name:'Imported caption'}})),'Import timed captions');
const saved=JSON.stringify(state.project);state=await request(`projects/${pid}/undo`,{expectedRevision:state.revision});assert.equal(state.project.tracks.find(t=>t.id===captions.id).clips.length,0);state=await request(`projects/${pid}/redo`,{expectedRevision:state.revision});assert.equal(JSON.stringify(state.project),saved);
const proposal=await request(`projects/${pid}/director`,{expectedRevision:state.revision,clipIds:[headline.id],frame:35,prompt:'Change selected text to “Made to be edited.”'});const prior=state.revision;state=await request(`projects/${pid}`);assert.equal(state.revision,prior);await request(`projects/${pid}/approve`,{messageId:proposal.id,expectedRevision:state.revision});state=await request(`projects/${pid}`);assert.equal(state.project.tracks.find(t=>t.id===title.id).clips[0].text,'Made to be edited.');
const range=await fetch(`${base}/projects/${pid}/media/${assets[0].id}`,{headers:{Range:'bytes=0-255'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,256);
const denied=await fetch(`${base}/projects`,{headers:{Origin:'https://untrusted.example'}});assert.equal(denied.status,403);
const other=await request('projects',{name:'Isolation acceptance fixture'});const foreign=await fetch(`${base}/projects/${other.project.id}/media/${assets[0].id}`);assert.equal(foreign.status,404);
const {jobId}=await request(`projects/${pid}/export`,{expectedRevision:state.revision});
await mkdir('data/verification',{recursive:true});await writeFile('data/verification/editor-acceptance.json',JSON.stringify({projectId:pid,jobId,revision:state.revision,assetIds:assets.map(a=>a.id),checks:['real imports','original SHA-256','independent tracks','trim','move','split','animated title','SRT captions','undo','redo','reopen','scoped Director proposal and approval','HTTP byte-range seeking','origin enforcement','project asset isolation'],browserGesturesVerified:false},null,2));console.log(JSON.stringify({projectId:pid,jobId,revision:state.revision}));
