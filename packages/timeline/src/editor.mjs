import {captionPresets,titlePresets,transitionPresets,estimatedWords} from './production.mjs';
// Renderer-neutral, frame-based editing model. No filesystem or provider access.
export const trackKinds = ['video','image','graphics','text','captions','voiceover','music','sfx'];
export const mediaKinds = ['video','image','audio'];
const uuid = () => crypto.randomUUID();
const error = message => { throw Object.assign(new Error(message),{status:400}); };
const number = (n,min,max,label,integer=false) => {if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))error(`Invalid ${label}.`);};
const string = (s,max,label) => {if(typeof s!=='string'||!s.trim()||s.length>max)error(`Invalid ${label}.`);};
const identifier = s => {if(typeof s!=='string'||!/^[\w-]{1,80}$/.test(s))error('Invalid identifier.');};
const color = s => {if(typeof s!=='string'||!/^#[\da-f]{6}$/i.test(s))error('Use a six-digit hex color.');};
export const defaults = {x:0,y:0,width:1920,height:1080,rotation:0,opacity:1};
export function emptyProject(name='Untitled film',ratio='16:9') {
  const sizes={'16:9':[1920,1080],'9:16':[1080,1920],'1:1':[1080,1080],'4:5':[1080,1350]};
  if(!sizes[ratio])error('Unsupported aspect ratio.');
  const [width,height]=sizes[ratio];
  return {schemaVersion:3,id:uuid(),name,assetIds:[],sequence:{width,height,fps:30,durationFrames:450,background:'#101c20'},renderer:'hyperframes',
    tracks:[['video','Video 1'],['image','Overlays'],['text','Titles'],['captions','Captions'],['music','Audio']].map(([kind,name])=>({id:uuid(),kind,name,visible:true,locked:false,muted:false,solo:false,clips:[]})),instructions:[],brandId:null};
}
export function newClip(project,kind,asset=null,startFrame=0) {
  const {width,height,fps}=project.sequence;
  const text=kind==='text'||kind==='captions';
  const durationFrames=asset?.duration?Math.max(1,Math.floor(asset.duration*fps)):fps*4;
  return {id:uuid(),kind,name:asset?.name||(kind==='captions'?'Caption':'New title'),assetId:asset?.id||null,startFrame,durationFrames,sourceInFrame:0,
    transform:{x:text?width*.08:0,y:kind==='captions'?height*.78:text?height*.38:0,width:text?width*.84:width,height:text?height*.2:height,rotation:0,opacity:1},
    text:text?'Make something worth watching.':'',textStyle:{fontSize:kind==='captions'?48:Math.round(width*.05),color:'#ffffff',background:kind==='captions'?'#101c20':'#000000',backgroundOpacity:kind==='captions'?.8:0,align:'center',weight:600},
    animation:{preset:text?'rise':'none',inFrames:18,outFrames:8},audio:{volume:1,muted:false},keyframes:[],fit:'contain'};
}
export function validateProject(p) {
  if(!p||p.schemaVersion!==3||!p.sequence||!Array.isArray(p.tracks)||p.tracks.length>24||!Array.isArray(p.assetIds)||p.assetIds.length>500)error('Invalid editor project.');
  identifier(p.id);string(p.name,120,'project name');p.assetIds.forEach(identifier);
  const q=p.sequence;number(q.width,256,3840,'width',true);number(q.height,256,3840,'height',true);if(q.width%2||q.height%2)error('Use even dimensions for H.264 output.');if(![24,25,30,60].includes(q.fps))error('Unsupported frame rate.');number(q.durationFrames,1,q.fps*3600,'duration',true);color(q.background);
  const ids=new Set();let count=0;
  for(const t of p.tracks){identifier(t.id);if(ids.has(t.id))error('Duplicate track ID.');ids.add(t.id);string(t.name,80,'track name');if(!trackKinds.includes(t.kind)||!Array.isArray(t.clips))error('Invalid track.');for(const key of ['visible','locked','muted','solo'])if(typeof t[key]!=='boolean')error('Invalid track state.');
    for(const c of t.clips){count++;identifier(c.id);if(ids.has(c.id))error('Duplicate clip ID.');ids.add(c.id);if(!['video','image','audio','text','captions','graphics'].includes(c.kind))error('Invalid clip kind.');string(c.name,200,'clip name');
      if(mediaKinds.includes(c.kind)){identifier(c.assetId);if(!p.assetIds.includes(c.assetId))error('Media is not attached to this project.');}else if(c.assetId!==null)error('Text and graphics must not reference media.');
      number(c.startFrame,0,q.durationFrames-1,'clip start',true);number(c.durationFrames,1,q.durationFrames,'clip duration',true);number(c.sourceInFrame,0,q.fps*86400,'source in',true);if(c.startFrame+c.durationFrames>q.durationFrames)error('Clip extends past sequence duration.');
      const tr=c.transform;if(!tr)error('Missing transform.');for(const key of ['x','y'])number(tr[key],-8000,8000,key);for(const key of ['width','height'])number(tr[key],1,8000,key);number(tr.rotation,-3600,3600,'rotation');number(tr.opacity,0,1,'opacity');
      if(typeof c.text!=='string'||c.text.length>2000)error('Invalid text.');if(!c.textStyle)error('Missing text style.');number(c.textStyle.fontSize,8,600,'font size');number(c.textStyle.weight,100,900,'font weight',true);color(c.textStyle.color);color(c.textStyle.background);number(c.textStyle.backgroundOpacity,0,1,'background opacity');if(!['left','center','right'].includes(c.textStyle.align))error('Invalid text alignment.');
      if(!c.animation||!['none','fade','rise','zoom'].includes(c.animation.preset))error('Unsupported animation.');number(c.animation.inFrames,0,600,'entrance duration',true);number(c.animation.outFrames,0,600,'exit duration',true);
      if(!c.audio||typeof c.audio.muted!=='boolean')error('Missing audio settings.');number(c.audio.volume,0,1,'volume');for(const key of ['fadeInFrames','fadeOutFrames'])if(c.audio[key]!==undefined)number(c.audio[key],0,Math.min(300,c.durationFrames),'audio fade',true);if((c.audio.fadeInFrames||0)+(c.audio.fadeOutFrames||0)>c.durationFrames)error('Audio fades must fit inside the clip.');if(!['contain','cover'].includes(c.fit))error('Invalid media fit.');
      if(c.caption){if(c.kind!=='captions'||!captionPresets.some(p=>p.id===c.caption.preset))error('Invalid caption preset.');color(c.caption.accent);if(!['estimated','transcribed','manual'].includes(c.caption.timing))error('Invalid caption timing.');}
      if(c.design){if(!titlePresets.some(p=>p.id===c.design.preset))error('Invalid title preset.');color(c.design.accent);}
      if(c.transition){if(!transitionPresets.some(p=>p.id===c.transition.preset))error('Invalid transition.');number(c.transition.inFrames,0,300,'transition entrance',true);number(c.transition.outFrames,0,300,'transition exit',true);}
      if(c.words!==undefined){if(c.kind!=='captions'||!Array.isArray(c.words)||c.words.length>100)error('Invalid caption words.');let previous=-1;for(const word of c.words){string(word.text,200,'caption word');number(word.startFrame,0,c.durationFrames-1,'word start',true);number(word.endFrame,word.startFrame+1,c.durationFrames,'word end',true);if(word.startFrame<previous)error('Caption words must be in time order.');previous=word.startFrame;if(word.emphasis!==undefined&&typeof word.emphasis!=='boolean')error('Invalid word emphasis.');}}
      if(!Array.isArray(c.keyframes)||c.keyframes.length>100)error('Too many keyframes.');const keys=new Set();for(const k of c.keyframes){identifier(k.id);if(keys.has(k.id))error('Duplicate keyframe ID.');keys.add(k.id);if(!['x','y','width','height','rotation','opacity'].includes(k.property))error('Unsupported keyframe property.');number(k.frame,0,c.durationFrames-1,'keyframe',true);number(k.value,k.property==='opacity'?0:k.property==='width'||k.property==='height'?1:-8000,k.property==='opacity'?1:8000,'keyframe value');if(!['linear','easeOut','spring'].includes(k.easing))error('Invalid easing.');}
    }
  }
  if(count>500)error('This local editor supports up to 500 clips.');return p;
}
function find(p,id){for(const track of p.tracks){const clip=track.clips.find(c=>c.id===id);if(clip)return {track,clip};}error('Clip not found.');}
export function applyOperations(project,operations) {
  if(!Array.isArray(operations)||!operations.length||operations.length>500)error('Use between 1 and 500 operations.');
  const p=structuredClone(project);
  for(const op of operations){if(!op||typeof op.type!=='string')error('Invalid operation.');
    if(op.type==='AddTrack'){if(!trackKinds.includes(op.kind))error('Invalid track kind.');p.tracks.push({id:op.id||uuid(),kind:op.kind,name:op.name||op.kind,visible:true,locked:false,muted:false,solo:false,clips:[]});continue;}
    if(op.type==='UpdateProject'){if(op.name!==undefined)p.name=op.name;if(op.sequence){if(op.sequence.fps!==undefined&&op.sequence.fps!==p.sequence.fps&&p.tracks.some(t=>t.clips.length))error('Set frame rate before adding clips.');p.sequence={...p.sequence,...op.sequence};}continue;}
    if(op.type==='UpdateTrack'){const t=p.tracks.find(t=>t.id===op.trackId);if(!t)error('Track not found.');for(const key of ['name','visible','locked','muted','solo'])if(op[key]!==undefined)t[key]=op[key];continue;}
    if(op.type==='ReorderTrack'){const i=p.tracks.findIndex(t=>t.id===op.trackId);if(i<0)error('Track not found.');number(op.index,0,p.tracks.length-1,'track order',true);if(p.tracks[i].locked)error('Unlock this track first.');const [t]=p.tracks.splice(i,1);p.tracks.splice(op.index,0,t);continue;}
    if(op.type==='AddClip'){const t=p.tracks.find(t=>t.id===op.trackId);if(!t)error('Track not found.');if(t.locked)error('Unlock this track first.');t.clips.push(structuredClone(op.clip));p.sequence.durationFrames=Math.max(p.sequence.durationFrames,op.clip.startFrame+op.clip.durationFrames);continue;}
    const {track,clip}=find(p,op.clipId);if(track.locked)error('Unlock this track first.');
    if(op.type==='RemoveClip'){track.clips=track.clips.filter(c=>c.id!==clip.id);}
    else if(op.type==='MoveClip'){const target=p.tracks.find(t=>t.id===(op.trackId||track.id));if(!target||target.locked)error('Destination track is locked or missing.');track.clips=track.clips.filter(c=>c.id!==clip.id);clip.startFrame=op.startFrame;target.clips.push(clip);}
    else if(op.type==='TrimClip'){const shift=(op.sourceInFrame??clip.sourceInFrame)-clip.sourceInFrame;clip.startFrame=op.startFrame??clip.startFrame;clip.sourceInFrame=op.sourceInFrame??clip.sourceInFrame;clip.durationFrames=op.durationFrames;clip.keyframes=clip.keyframes.filter(k=>k.frame<clip.durationFrames);clip.audio.fadeInFrames=Math.min(clip.audio.fadeInFrames||0,Math.floor(clip.durationFrames/2));clip.audio.fadeOutFrames=Math.min(clip.audio.fadeOutFrames||0,clip.durationFrames-clip.audio.fadeInFrames);if(clip.words){clip.words=clip.words.filter(w=>w.endFrame>shift&&w.startFrame-shift<clip.durationFrames).map(w=>({...w,startFrame:Math.max(0,w.startFrame-shift),endFrame:Math.min(w.endFrame-shift,clip.durationFrames)}));clip.text=clip.words.map(w=>w.text).join(' ');}}
    else if(op.type==='SplitClip'){number(op.frame,clip.startFrame+1,clip.startFrame+clip.durationFrames-1,'split frame',true);const left=op.frame-clip.startFrame;const right={...structuredClone(clip),id:op.newId||uuid(),startFrame:op.frame,durationFrames:clip.durationFrames-left,sourceInFrame:clip.sourceInFrame+left,keyframes:clip.keyframes.filter(k=>k.frame>=left).map(k=>({...k,id:uuid(),frame:k.frame-left}))};right.audio.fadeInFrames=0;clip.audio.fadeOutFrames=0;right.audio.fadeOutFrames=Math.min(right.audio.fadeOutFrames||0,right.durationFrames);clip.audio.fadeInFrames=Math.min(clip.audio.fadeInFrames||0,left);if(clip.words){right.words=clip.words.filter(w=>w.endFrame>left).map(w=>({...w,startFrame:Math.max(0,w.startFrame-left),endFrame:w.endFrame-left}));clip.words=clip.words.filter(w=>w.startFrame<left).map(w=>({...w,endFrame:Math.min(left,w.endFrame)}));clip.text=clip.words.map(w=>w.text).join(' ');right.text=right.words.map(w=>w.text).join(' ');}clip.durationFrames=left;clip.keyframes=clip.keyframes.filter(k=>k.frame<left);track.clips.push(right);}
    else if(op.type==='DuplicateClip'){const duplicate={...structuredClone(clip),id:op.newId||uuid(),startFrame:op.startFrame??clip.startFrame+clip.durationFrames};track.clips.push(duplicate);p.sequence.durationFrames=Math.max(p.sequence.durationFrames,duplicate.startFrame+duplicate.durationFrames);}
    else if(op.type==='CrossfadeClip'){
      if(!['video','image'].includes(clip.kind))error('Select a footage clip.');number(op.durationFrames,1,300,'crossfade duration',true);
      const previous=track.clips.filter(c=>c.id!==clip.id&&['video','image'].includes(c.kind)&&c.startFrame<clip.startFrame).sort((a,b)=>b.startFrame-a.startFrame)[0];
      if(!previous)error('There is no previous shot on this track.');const end=previous.startFrame+previous.durationFrames;
      if(op.durationFrames>=Math.min(previous.durationFrames,clip.durationFrames))error('The overlap must be shorter than both shots.');
      if(Math.abs(clip.startFrame-end)>op.durationFrames)error('Move this shot next to the previous shot before blending.');
      const oldEnd=Math.max(...p.tracks.flatMap(t=>t.clips.map(c=>c.startFrame+c.durationFrames)));clip.startFrame=end-op.durationFrames;
      clip.audio.fadeInFrames=op.durationFrames;previous.audio.fadeOutFrames=op.durationFrames;clip.transition={preset:'dissolve',inFrames:op.durationFrames,outFrames:0};previous.transition={preset:'none',inFrames:0,outFrames:0};
      if(p.sequence.durationFrames===oldEnd)p.sequence.durationFrames=Math.max(...p.tracks.flatMap(t=>t.clips.map(c=>c.startFrame+c.durationFrames)));
    }
    else if(op.type==='UpdateTransform'){for(const key of Object.keys(defaults))if(op.values?.[key]!==undefined)clip.transform[key]=op.values[key];}
    else if(op.type==='UpdateText'){if(!['text','captions','graphics'].includes(clip.kind))error('Select a text layer.');if(op.text!==undefined){clip.text=op.text;if(clip.words){const values=typeof op.text==='string'?op.text.trim().split(/\s+/u):[];if(values.length===clip.words.length)clip.words=clip.words.map((w,i)=>({...w,text:values[i]}));else{clip.words=estimatedWords(op.text,clip.durationFrames);if(clip.caption)clip.caption.timing='estimated';}}}if(op.style)clip.textStyle={...clip.textStyle,...op.style};}
    else if(op.type==='UpdateCaption'){if(clip.kind!=='captions')error('Select a caption.');clip.caption={...clip.caption,...op.values};if(op.words!==undefined){clip.words=structuredClone(op.words);clip.text=clip.words.map(w=>w.text).join(' ');}}
    else if(op.type==='UpdateDesign'){if(!['text','graphics'].includes(clip.kind))error('Select a title.');clip.design={...clip.design,...op.values};}
    else if(op.type==='UpdateTransition'){clip.transition={...clip.transition,...op.values};}
    else if(op.type==='UpdateAnimation'){clip.animation={...clip.animation,...op.values};}
    else if(op.type==='UpdateAudio'){clip.audio={...clip.audio,...op.values};}
    else if(op.type==='UpdateFit'){clip.fit=op.fit;}
    else if(op.type==='AddKeyframe'){const k={...op.keyframe,id:op.keyframe.id||uuid()};clip.keyframes=clip.keyframes.filter(v=>!(v.property===k.property&&v.frame===k.frame));clip.keyframes.push(k);}
    else if(op.type==='RemoveKeyframe'){clip.keyframes=clip.keyframes.filter(k=>k.id!==op.keyframeId);}
    else error(`Unsupported operation: ${op.type}`);
    p.sequence.durationFrames=Math.max(p.sequence.durationFrames,clip.startFrame+clip.durationFrames);
  }
  return validateProject(p);
}
export function ease(t,type='linear'){t=Math.max(0,Math.min(1,t));return type==='easeOut'?1-(1-t)**3:type==='spring'?(t===1?1:1-Math.exp(-7*t)*Math.cos(9*t)):t;}
export function clipAtFrame(clip,frame){
  const local=frame-clip.startFrame;const tr={...clip.transform};
  for(const property of Object.keys(defaults)){
    const keys=clip.keyframes.filter(k=>k.property===property).sort((a,b)=>a.frame-b.frame);if(!keys.length)continue;
    let left={frame:0,value:tr[property],easing:'linear'},right=keys[0];for(const k of keys){if(k.frame<=local)left=k;if(k.frame>=local){right=k;break;}right=k;}
    tr[property]=local>=right.frame?right.value:left.value+(right.value-left.value)*ease((local-left.frame)/(right.frame-left.frame||1),right.easing);
  }
  const a=clip.animation;const entrance=a.inFrames?ease(local/a.inFrames,'easeOut'):1;const exit=a.outFrames?Math.min(1,(clip.durationFrames-local)/a.outFrames):1;
  if(a.preset!=='none'){tr.opacity*=Math.max(0,entrance*exit);if(a.preset==='rise')tr.y+=60*(1-entrance);if(a.preset==='zoom'){const scale=.85+.15*entrance;tr.x+=tr.width*(1-scale)/2;tr.y+=tr.height*(1-scale)/2;tr.width*=scale;tr.height*=scale;}}
  tr.opacity=Math.max(0,Math.min(1,tr.opacity));tr.width=Math.max(1,tr.width);tr.height=Math.max(1,tr.height);return tr;
}
export function isAudible(track,tracks){return track.visible&&!track.muted&&(!tracks.some(t=>t.solo)||track.solo);}
export function parseSubtitles(source,fps=30){
  const time=value=>{const match=value.match(/(?:(\d+):)?(\d{2}):(\d{2})[,.](\d{3})/);if(!match)error('Invalid subtitle timestamp.');return Math.round((Number(match[1]||0)*3600+Number(match[2])*60+Number(match[3])+Number(match[4])/1000)*fps);};
  const blocks=source.replace(/^\uFEFF/,'').replace(/\r/g,'').split(/\n\s*\n/);const cues=[];
  for(const block of blocks){const lines=block.trim().split('\n');const i=lines.findIndex(l=>l.includes('-->'));if(i<0)continue;const [a,b]=lines[i].split('-->').map(v=>v.trim());const startFrame=time(a),endFrame=time(b);if(endFrame<=startFrame)error('Subtitle ends before it starts.');const text=lines.slice(i+1).join('\n').replace(/<[^>]*>/g,'');if(text.trim())cues.push({startFrame,durationFrames:endFrame-startFrame,text});}
  if(!cues.length||cues.length>500)error('Import 1–500 valid subtitle cues.');return cues;
}
export function serializeSubtitles(project){const fps=project.sequence.fps;const clock=f=>{const ms=Math.round(f/fps*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};return project.tracks.flatMap(t=>t.clips).filter(c=>c.kind==='captions').sort((a,b)=>a.startFrame-b.startFrame).map((c,i)=>`${i+1}\n${clock(c.startFrame)} --> ${clock(c.startFrame+c.durationFrames)}\n${c.text}`).join('\n\n');}
