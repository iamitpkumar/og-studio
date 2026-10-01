// Shared, deterministic presentation contract for preview and export.
export const captionPresets=[
  {id:'signal',name:'Signal',description:'A clean sentence with a precise active-word highlight.',accent:'#d8ff52'},
  {id:'punch',name:'Punch',description:'Bold outlined words with a compact spring entrance.',accent:'#ffdc58'},
  {id:'marker',name:'Marker',description:'A filled highlight follows the spoken word.',accent:'#baff83'},
  {id:'glow',name:'Glow',description:'A restrained luminous accent over dark footage.',accent:'#fe8ae2'},
  {id:'editorial',name:'Editorial',description:'Calm serif typography with selective emphasis.',accent:'#f3d5a3'},
  {id:'typewriter',name:'Typewriter',description:'Words reveal as they are spoken.',accent:'#d3ece4'}
];
export const titlePresets=[
  {id:'hero',name:'Hero',text:'Make your next move.',description:'A clear central headline.'},
  {id:'lower-third',name:'Lower third',text:'Your name\nYour role or product',description:'A compact identity card.'},
  {id:'chapter',name:'Chapter',text:'01 / A new perspective',description:'A full-frame chapter break.'},
  {id:'glass',name:'Glass',text:'Built for what comes next.',description:'A translucent presentation card.'},
  {id:'kinetic',name:'Kinetic',text:'Ideas into motion.',description:'A staggered word reveal.'},
  {id:'stat',name:'Proof point',text:'One clear advantage.',description:'A bold statement with an accent rule.'}
];
export const transitionPresets=[{id:'none',name:'Cut'},{id:'dissolve',name:'Dissolve'},{id:'push-left',name:'Push left'},{id:'push-right',name:'Push right'},{id:'wipe',name:'Wipe'},{id:'iris',name:'Iris'}];
const ramp=(t)=>1-(1-Math.max(0,Math.min(1,t)))**3;
const spring=t=>t>=1?1:1-Math.exp(-8*Math.max(0,t))*Math.cos(10*Math.max(0,t));
const tokens=text=>text.trim().split(/\s+/u).filter(Boolean);
export function estimatedWords(text,durationFrames){const words=tokens(text);return words.map((text,i)=>({text,startFrame:Math.floor(i*durationFrames/words.length),endFrame:Math.min(durationFrames,Math.max(Math.floor(i*durationFrames/words.length)+1,Math.floor((i+1)*durationFrames/words.length))),emphasis:false}));}
export function captionSettings(preset='signal',accent){const selected=captionPresets.find(p=>p.id===preset)||captionPresets[0];return {preset:selected.id,accent:accent||selected.accent,timing:'estimated',maxWords:6};}
export function captionLayout(sequence){const {width,height}=sequence;const portrait=height>width;return {x:width*.08,y:height*(portrait?.64:.74),width:width*.82,height:height*(portrait?.16:.2),rotation:0,opacity:1};}
export function titleLayout(preset,sequence){const {width:w,height:h}=sequence;if(preset==='chapter')return {x:0,y:0,width:w,height:h,rotation:0,opacity:1};if(preset==='lower-third')return {x:w*.06,y:h*.73,width:w*.55,height:h*.18,rotation:0,opacity:1};return {x:w*.08,y:h*.29,width:w*.84,height:h*.4,rotation:0,opacity:1};}
export function transitionAtFrame(clip,frame){
  const t=clip.transition||{preset:'none',inFrames:0,outFrames:0};const local=frame-clip.startFrame;
  const incoming=t.inFrames?ramp(local/t.inFrames):1,outgoing=t.outFrames?ramp((clip.durationFrames-1-local)/t.outFrames):1,amount=Math.min(incoming,outgoing);
  const state={opacity:1,offsetX:0,clipPath:'inset(0% 0% 0% 0%)'};
  if(t.preset==='dissolve')state.opacity=amount;
  if(t.preset==='push-left'||t.preset==='push-right'){state.offsetX=(1-amount)*clip.transform.width*(t.preset==='push-left'?1:-1);state.opacity=Math.min(1,amount*3);}
  if(t.preset==='wipe')state.clipPath=`inset(0% ${(1-amount)*100}% 0% 0%)`;
  if(t.preset==='iris')state.clipPath=`circle(${amount*75}% at 50% 50%)`;
  return state;
}
export function textBoxStyle(clip){
  const s=clip.textStyle,caption=clip.kind==='captions',preset=caption?clip.caption?.preset:clip.design?.preset;
  const accent=clip.caption?.accent||clip.design?.accent||'#d8ff52';
  const result={display:'flex',alignItems:'center',justifyContent:{left:'flex-start',center:'center',right:'flex-end'}[s.align],flexWrap:'wrap',alignContent:'center',columnGap:`${s.fontSize*.16}px`,rowGap:'0px',width:'100%',height:'100%',padding:'12px',whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:1.16,fontFamily:preset==='editorial'?'Georgia,serif':'Manrope,sans-serif',fontSize:`${s.fontSize}px`,fontWeight:s.weight,color:s.color,textAlign:s.align,background:`${s.background}${Math.round(s.backgroundOpacity*255).toString(16).padStart(2,'0')}`,borderRadius:'0px',letterSpacing:'-0.02em',boxSizing:'border-box'};
  if(caption){result.fontWeight=['punch','marker'].includes(preset)?800:s.weight;result.textShadow=preset==='punch'?'2px 2px 0 #101010,-2px -2px 0 #101010,2px -2px 0 #101010,-2px 2px 0 #101010,0 3px 12px #000000':preset==='glow'?`0 0 18px ${accent}88`:'0 2px 6px #00000088';result.borderRadius='14px';}
  if(preset==='lower-third'){result.justifyContent='flex-start';result.padding='20px 28px';result.borderLeft=`6px solid ${accent}`;result.background='#101c20dd';result.textAlign='left';}
  if(preset==='chapter'){result.background='#101c20';result.padding='60px';result.borderTop=`12px solid ${accent}`;}
  if(preset==='glass'){result.background='#142527c9';result.border='1px solid #ffffff55';result.borderRadius='28px';result.boxShadow='0 18px 70px #00000035';}
  if(preset==='stat'){result.borderBottom=`8px solid ${accent}`;result.fontWeight=800;}
  return result;
}
export function textAtFrame(clip,frame){
  const local=frame-clip.startFrame,preset=clip.caption?.preset||'signal',accent=clip.caption?.accent||'#d8ff52',caption=clip.kind==='captions'&&!!clip.caption;
  const words=caption?(clip.words?.length?clip.words:estimatedWords(clip.text,clip.durationFrames)):clip.design?.preset==='kinetic'?estimatedWords(clip.text,Math.min(clip.durationFrames,30)):null;
  if(!words)return null;
  return words.map((word,index)=>{
    const active=local>=word.startFrame&&local<word.endFrame,spoken=local>=word.endFrame;
    const style={display:'inline-block',color:clip.textStyle.color,backgroundColor:'transparent',textShadow:'inherit',padding:'0px 2px',borderRadius:'5px',opacity:1,transform:'translateY(0px) scale(1)',fontWeight:clip.textStyle.weight};
    if(caption){
      if(active)style.color=accent;
      if(preset==='marker'&&active){style.backgroundColor=accent;style.color='#10221d';style.padding='0px 6px';}
      if(preset==='punch'){style.fontWeight=800;if(active){const value=spring((local-word.startFrame)/6);style.transform=`scale(${.88+.18*value})`;}}
      if(preset==='glow'&&active)style.textShadow=`0 0 14px ${accent},0 0 30px ${accent}99`;
      if(preset==='typewriter'){style.opacity=local>=word.startFrame?1:0;style.color=active?accent:clip.textStyle.color;}
      if(preset==='signal'&&!active&&!spoken)style.opacity=.8;
      if(preset==='editorial'&&word.emphasis)style.fontWeight=800;
    }else{const reveal=ramp((local-index*3)/10);style.opacity=reveal;style.transform=`translateY(${(1-reveal)*25}px)`;}
    return {text:word.text,style,active,spoken};
  });
}
export function captionsFromWords(words,sequence,startFrame=0,preset='signal',maxWords=6){
  if(!Array.isArray(words)||!words.length)throw new Error('No timed speech words were returned.');
  const cleaned=words.map(w=>({text:String(w.word??w.text??'').trim(),startFrame:Math.max(0,Math.round(Number(w.start)*sequence.fps)),endFrame:Math.max(1,Math.round(Number(w.end)*sequence.fps)),emphasis:false})).filter(w=>w.text&&Number.isFinite(w.startFrame)&&Number.isFinite(w.endFrame)&&w.endFrame>w.startFrame).sort((a,b)=>a.startFrame-b.startFrame);
  if(!cleaned.length)throw new Error('The transcription has no valid word timestamps.');
  const groups=[];let group=[];
  const flush=()=>{if(group.length){const first=group[0].startFrame,end=Math.max(...group.map(w=>w.endFrame));groups.push({startFrame:startFrame+first,durationFrames:end-first,text:group.map(w=>w.text).join(' '),words:group.map(w=>({...w,startFrame:w.startFrame-first,endFrame:w.endFrame-first})),caption:{...captionSettings(preset),timing:'transcribed'}});group=[];}};
  for(const w of cleaned){if(group.length&&(group.length>=maxWords||w.startFrame-group.at(-1).endFrame>sequence.fps*.45))flush();group.push(w);if(/[.!?。！？]$/u.test(w.text))flush();}flush();
  if(groups.length>480)throw new Error('This transcript needs more than 480 caption groups. Split the source into shorter sections.');
  return groups;
}

export function volumeAtFrame(clip,frame){const local=frame-clip.startFrame,duration=clip.durationFrames,a=clip.audio;const incoming=a.fadeInFrames?Math.max(0,Math.min(1,local/a.fadeInFrames)):1,outgoing=a.fadeOutFrames?Math.max(0,Math.min(1,(duration-local)/a.fadeOutFrames)):1;return a.muted?0:a.volume*Math.min(incoming,outgoing);}
export function audioAutomation(clip,fps){const a=clip.audio;if(!a.fadeInFrames&&!a.fadeOutFrames)return null;const frames=[...new Set([0,a.fadeInFrames||0,clip.durationFrames-(a.fadeOutFrames||0),clip.durationFrames])].sort((a,b)=>a-b);return {version:1,lanes:[{target:'volume',points:frames.map(f=>({t:f/fps,v:volumeAtFrame(clip,clip.startFrame+f)}))}]};}
