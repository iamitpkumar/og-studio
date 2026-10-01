import { validateProject,clipAtFrame,isAudible } from '../../../../packages/timeline/src/editor.mjs';
import { escapeHTML as escape } from './renderer.mjs';
import {textBoxStyle,textAtFrame,transitionAtFrame,audioAutomation} from '../../../../packages/timeline/src/production.mjs';
const css=styles=>Object.entries(styles).map(([key,value])=>`${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}:${value}`).join(';');

export const hyperframesAdapter={id:'hyperframes',schemaVersion:3,capabilities:{video:true,audio:true,text:true,captions:true,keyframes:true},compile:compileTimeline};
export function compileTimeline(project,assets){
  validateProject(project);const q=project.sequence;const lookup=new Map(assets.map(a=>[a.id,a]));const elements=[],frames=[];let samples=0;
  for(const [index,track] of project.tracks.entries()){
    if(!track.visible)continue;
    for(const clip of [...track.clips].sort((a,b)=>a.startFrame-b.startFrame)){const asset=clip.assetId?lookup.get(clip.assetId):null;if(clip.assetId&&!asset)throw new Error(`Missing media for ${clip.name}`);const source=asset?`./${asset.id}${asset.exportExtension||''}`:'';
      const attrs=`data-start="${clip.startFrame/q.fps}" data-duration="${clip.durationFrames/q.fps}" data-track-index="${index}"`;
      const mediaAttrs=`${attrs} data-media-start="${clip.sourceInFrame/q.fps}"`;
      if((clip.kind==='audio'||clip.kind==='video'&&asset.hasAudio)&&isAudible(track,project.tracks)&&!clip.audio.muted&&clip.audio.volume>0)elements.push(`<audio id="sound-${clip.id}" src="${source}" ${mediaAttrs.replace(/data-track-index="\d+"/,`data-track-index="${100+elements.length}"`)} data-volume="${audioAutomation(clip,q.fps)?1:clip.audio.volume}" ${audioAutomation(clip,q.fps)?`data-automation='${escape(JSON.stringify(audioAutomation(clip,q.fps)))}'`:""}></audio>`);
      if(clip.kind==='audio')continue;
      const tr=clipAtFrame(clip,clip.startFrame),transition=transitionAtFrame(clip,clip.startFrame);const style=`position:absolute;left:${tr.x+transition.offsetX}px;top:${tr.y}px;width:${tr.width}px;height:${tr.height}px;opacity:${tr.opacity*transition.opacity};clip-path:${transition.clipPath};transform:rotate(${tr.rotation}deg);z-index:${index};`;
      let content='';if(clip.kind==='video')content=`<video class="clip" id="visual-${clip.id}" src="${source}" ${mediaAttrs} muted playsinline style="width:100%;height:100%;object-fit:${clip.fit}"></video>`;
      else if(clip.kind==='image')content=`<img class="clip" id="visual-${clip.id}" src="${source}" ${attrs} style="width:100%;height:100%;object-fit:${clip.fit}" alt="${escape(clip.name)}">`;
      else{const words=textAtFrame(clip,clip.startFrame);const copy=words?words.map((word,i)=>`<span id="word-${clip.id}-${i}" style="${css(word.style)}">${escape(word.text)}</span>`).join(' '):escape(clip.text);content=`<div class="clip text" id="visual-${clip.id}" ${attrs} style="${css(textBoxStyle(clip))}">${copy}</div>`;}
      elements.push(`<div id="layer-${clip.id}" style="${style}">${content}</div>`);
      let previousLayer=null;const previousWords=[];const changed=(next,previous)=>Object.fromEntries(Object.entries(next).filter(([key,value])=>!previous||previous[key]!==value));
      const animated=clip.animation.preset!=='none'||clip.keyframes.length>0||clip.transition?.preset&&clip.transition.preset!=='none'||!!textAtFrame(clip,clip.startFrame);
      if(animated){for(let f=0;f<clip.durationFrames;f++){if(++samples>300000)throw new Error('This animation exceeds the local render budget. Shorten the sequence or reduce animated layers.');const frame=clip.startFrame+f,t=clipAtFrame(clip,frame),v=transitionAtFrame(clip,frame),time=frame/q.fps;const layer={left:t.x+v.offsetX,top:t.y,width:t.width,height:t.height,rotation:t.rotation,opacity:t.opacity*v.opacity,clipPath:v.clipPath},delta=changed(layer,previousLayer);if(Object.keys(delta).length)frames.push([`layer-${clip.id}`,time,delta]);previousLayer=layer;const words=textAtFrame(clip,frame);if(words)for(const [i,word] of words.entries()){if(++samples>300000)throw new Error('This caption animation exceeds the local render budget.');const delta=changed(word.style,previousWords[i]);if(Object.keys(delta).length)frames.push([`word-${clip.id}-${i}`,time,delta]);previousWords[i]=word.style;}}}
    }
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(project.name)}</title><script src="./gsap.min.js"></script><style>@font-face{font-family:Manrope;src:url('./font.woff2') format('woff2');font-weight:200 800}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}#root{position:relative;width:100%;height:100%;overflow:hidden;background:${q.background}}video,img{display:block}</style></head><body><div id="root" data-composition-id="main" data-width="${q.width}" data-height="${q.height}" data-start="0" data-duration="${q.durationFrames/q.fps}" data-fps="${q.fps}">${elements.join('')}</div><script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});const frames=${JSON.stringify(frames)};for(const [id,time,values] of frames)tl.set('#'+id,values,time);window.__timelines.main=tl;</script></body></html>`;
}
