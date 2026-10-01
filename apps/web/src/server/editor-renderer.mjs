import { validateProject,clipAtFrame,isAudible } from '../../../../packages/timeline/src/editor.mjs';
import { escapeHTML as escape } from './renderer.mjs';

export const hyperframesAdapter={id:'hyperframes',schemaVersion:3,capabilities:{video:true,audio:true,text:true,captions:true,keyframes:true},compile:compileTimeline};
export function compileTimeline(project,assets){
  validateProject(project);const q=project.sequence;const lookup=new Map(assets.map(a=>[a.id,a]));const elements=[],frames=[];let samples=0;
  for(const [index,track] of project.tracks.entries()){
    if(!track.visible)continue;
    for(const clip of track.clips){const asset=clip.assetId?lookup.get(clip.assetId):null;if(clip.assetId&&!asset)throw new Error(`Missing media for ${clip.name}`);const source=asset?`./${asset.id}${asset.exportExtension||''}`:'';
      const attrs=`data-start="${clip.startFrame/q.fps}" data-duration="${clip.durationFrames/q.fps}" data-track-index="${index}"`;
      const mediaAttrs=`${attrs} data-media-start="${clip.sourceInFrame/q.fps}"`;
      if((clip.kind==='audio'||clip.kind==='video'&&asset.hasAudio)&&isAudible(track,project.tracks)&&!clip.audio.muted&&clip.audio.volume>0)elements.push(`<audio id="sound-${clip.id}" src="${source}" ${mediaAttrs} data-volume="${clip.audio.volume}"></audio>`);
      if(clip.kind==='audio')continue;
      const tr=clipAtFrame(clip,clip.startFrame);const style=`position:absolute;left:${tr.x}px;top:${tr.y}px;width:${tr.width}px;height:${tr.height}px;opacity:${tr.opacity};transform:rotate(${tr.rotation}deg);z-index:${index};`;
      let content='';if(clip.kind==='video')content=`<video class="clip" id="visual-${clip.id}" src="${source}" ${mediaAttrs} muted playsinline style="width:100%;height:100%;object-fit:${clip.fit}"></video>`;
      else if(clip.kind==='image')content=`<img class="clip" id="visual-${clip.id}" src="${source}" ${attrs} style="width:100%;height:100%;object-fit:${clip.fit}" alt="${escape(clip.name)}">`;
      else{const s=clip.textStyle;content=`<div class="clip text" id="visual-${clip.id}" ${attrs} style="font-size:${s.fontSize}px;font-weight:${s.weight};color:${s.color};text-align:${s.align};justify-content:${{left:'flex-start',center:'center',right:'flex-end'}[s.align]};background:${s.background}${Math.round(s.backgroundOpacity*255).toString(16).padStart(2,'0')};">${escape(clip.text)}</div>`;}
      elements.push(`<div id="layer-${clip.id}" style="${style}">${content}</div>`);
      const animated=clip.animation.preset!=='none'||clip.keyframes.length>0;
      if(animated){for(let f=0;f<clip.durationFrames;f++){if(++samples>300000)throw new Error('This animation exceeds the local render budget. Shorten the sequence or reduce animated layers.');const t=clipAtFrame(clip,clip.startFrame+f);frames.push([clip.id,(clip.startFrame+f)/q.fps,{left:t.x,top:t.y,width:t.width,height:t.height,rotation:t.rotation,opacity:t.opacity}]);}}
    }
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(project.name)}</title><script src="./gsap.min.js"></script><style>@font-face{font-family:Manrope;src:url('./font.woff2') format('woff2');font-weight:200 800}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}#root{position:relative;width:100%;height:100%;overflow:hidden;background:${q.background}}.text{display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding:12px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.18;font-family:Manrope,sans-serif}video,img{display:block}</style></head><body><div id="root" data-composition-id="main" data-width="${q.width}" data-height="${q.height}" data-start="0" data-duration="${q.durationFrames/q.fps}" data-fps="${q.fps}">${elements.join('')}</div><script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});const frames=${JSON.stringify(frames)};for(const [id,time,values] of frames)tl.set('#layer-'+id,values,time);window.__timelines.main=tl;</script></body></html>`;
}
