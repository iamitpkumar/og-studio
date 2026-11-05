// Shared, deterministic presentation contract for preview and export.
export const captionPresets=[
  {id:'signal',name:'Signal',description:'A clean sentence with a precise active-word highlight.',accent:'#d8ff52'},
  {id:'punch',name:'Punch',description:'Bold outlined words with a compact spring entrance.',accent:'#ffdc58'},
  {id:'marker',name:'Marker',description:'A filled highlight follows the spoken word.',accent:'#baff83'},
  {id:'glow',name:'Glow',description:'A restrained luminous accent over dark footage.',accent:'#fe8ae2'},
  {id:'editorial',name:'Editorial',description:'Calm serif typography with selective emphasis.',accent:'#f3d5a3'},
  {id:'typewriter',name:'Typewriter',description:'Words reveal as they are spoken.',accent:'#d3ece4'},
  {id:'hormozi',name:'Hormozi Gold',description:'Punchy uppercase words with gold active highlight and bold stroke.',accent:'#ffd700'},
  {id:'vox',name:'Vox Marker',description:'Editorial serif with vibrant marker fill behind the spoken word.',accent:'#baff83'},
  {id:'neon',name:'Neon Pop',description:'Electric luminous cyan and magenta glow with spring bounce.',accent:'#00e5ff'},
  {id:'minimal',name:'Minimal Luxury',description:'Restrained clean sans with sleek slate active contrast.',accent:'#ffffff'},
  {id:'karaoke',name:'Karaoke Wave',description:'Fluid continuous syllable illumination across spoken text.',accent:'#ff4081'},
  {id:'liquid-glass',name:'Liquid Glass',description:'Translucent frosted glass capsule with specular refraction and glowing active word.',accent:'#64f4d2'},
  {id:'behind-subject',name:'Behind Subject',description:'Giant cinematic depth typography placed behind talking subject with depth separation.',accent:'#ffd700'},
  {id:'glass-card',name:'Glass Card',description:'Floating frosted HUD pill with specular rim light and emerald illumination.',accent:'#52c792'},
  {id:'cyber-neon',name:'Cyber Neon Glass',description:'Prismatic glass card with electric magenta & cyan chromatic glow.',accent:'#00f0ff'}
];
export const titlePresets=[
  {id:'hero',name:'Hero',text:'Make your next move.',description:'A clear central headline.'},
  {id:'lower-third',name:'Lower third',text:'Your name\nYour role or product',description:'A compact identity card.'},
  {id:'chapter',name:'Chapter',text:'01 / A new perspective',description:'A full-frame chapter break.'},
  {id:'glass',name:'Glass',text:'Built for what comes next.',description:'A translucent presentation card.'},
  {id:'kinetic',name:'Kinetic',text:'Ideas into motion.',description:'A staggered word reveal.'},
  {id:'stat',name:'Proof point',text:'One clear advantage.',description:'A bold statement with an accent rule.'},
  {id:'hook-badge',name:'Hook badge',text:'STOP SCROLLING',description:'High-impact 0-3s hook badge with spring entrance.'},
  {id:'top-banner',name:'Top banner',text:'THE BRUTAL TRUTH ABOUT AI',description:'Persistent top framing banner for social shorts.'},
  {id:'progress-bar',name:'Progress bar',text:'—',description:'Dynamic retention bar spanning the video duration.'},
  {id:'callout',name:'Data callout',text:'+340% GROWTH\nVerified Case Study',description:'Translucent stat card with accent badge.'},
  {id:'liquid-glass',name:'Liquid Glass Capsule',text:'SPATIAL VISION 2026\nLiquid Glassmorphic UI',description:'Trending fluid glassmorphic capsule with specular refraction and blurred backdrop.'},
  {id:'frost-hud',name:'Frosted Glass HUD',text:'SYSTEM STATUS: OPTIMAL\nNeural latency: 12ms',description:'Cyber frosted glass card with telemetry corner accents and cyan glow.'},
  {id:'prismatic-glass',name:'Prismatic Glass Pill',text:'PREMIUM RELEASE · VOL 04',description:'Iridescent liquid glass with chromatic dispersion rim light.'},
  {id:'neon-glass',name:'Neon Glass Callout',text:'+10M ACTIVE CREATORS\nVerified Social Reach',description:'Smoky glass badge with electric neon border glow.'},
  {id:'behind-title',name:'Behind Subject Title',text:'DEPTH VISION',description:'Cinematic giant typography designed to sit directly behind the speaker.'}
];
export const transitionPresets=[{id:'none',name:'Cut'},{id:'dissolve',name:'Dissolve'},{id:'push-left',name:'Push left'},{id:'push-right',name:'Push right'},{id:'wipe',name:'Wipe'},{id:'iris',name:'Iris'}];
const ramp=(t)=>1-(1-Math.max(0,Math.min(1,t)))**3;
const spring=t=>t>=1?1:1-Math.exp(-8*Math.max(0,t))*Math.cos(10*Math.max(0,t));
const tokens=text=>text.trim().split(/\s+/u).filter(Boolean);
export function estimatedWords(text,durationFrames){const words=tokens(text);return words.map((text,i)=>({text,startFrame:Math.floor(i*durationFrames/words.length),endFrame:Math.min(durationFrames,Math.max(Math.floor(i*durationFrames/words.length)+1,Math.floor((i+1)*durationFrames/words.length))),emphasis:false}));}
export function captionSettings(preset='signal',accent){const selected=captionPresets.find(p=>p.id===preset)||captionPresets[0];return {preset:selected.id,accent:accent||selected.accent,timing:'estimated',maxWords:['hormozi','punch','behind-subject'].includes(preset)?3:['vox','minimal','liquid-glass'].includes(preset)?4:6};}
export function captionLayout(sequence,preset='signal'){
  const {width,height}=sequence;const portrait=height>width;
  if(preset==='behind-subject')return {x:width*.05,y:height*(portrait?.32:.26),width:width*.9,height:height*(portrait?.28:.34),rotation:0,opacity:1};
  if(preset==='liquid-glass')return {x:width*.06,y:height*(portrait?.68:.74),width:width*.88,height:height*(portrait?.15:.18),rotation:0,opacity:1};
  return {x:width*.08,y:height*(portrait?.64:.74),width:width*.82,height:height*(portrait?.16:.2),rotation:0,opacity:1};
}
export function titleLayout(preset,sequence){
  const {width:w,height:h}=sequence;const portrait=h>w;
  if(preset==='chapter')return {x:0,y:0,width:w,height:h,rotation:0,opacity:1};
  if(preset==='lower-third')return {x:w*.06,y:h*.73,width:w*.55,height:h*.18,rotation:0,opacity:1};
  if(preset==='top-banner')return {x:0,y:0,width:w,height:h*(portrait?.08:.1),rotation:0,opacity:1};
  if(preset==='hook-badge')return {x:w*.08,y:h*(portrait?.12:.14),width:w*.84,height:h*(portrait?.11:.14),rotation:0,opacity:1};
  if(preset==='progress-bar')return {x:0,y:h-6,width:w,height:6,rotation:0,opacity:1};
  if(preset==='callout'||preset==='neon-glass')return {x:w*.08,y:h*(portrait?.66:.7),width:w*(portrait?.84:.48),height:h*(portrait?.14:.18),rotation:0,opacity:1};
  if(preset==='liquid-glass'||preset==='prismatic-glass')return {x:w*.08,y:h*(portrait?.18:.22),width:w*.84,height:h*(portrait?.14:.18),rotation:0,opacity:1};
  if(preset==='frost-hud')return {x:w*.08,y:h*(portrait?.65:.68),width:w*.84,height:h*(portrait?.16:.2),rotation:0,opacity:1};
  if(preset==='behind-title')return {x:w*.05,y:h*(portrait?.28:.25),width:w*.9,height:h*(portrait?.22:.28),rotation:0,opacity:1};
  return {x:w*.08,y:h*.29,width:w*.84,height:h*.4,rotation:0,opacity:1};
}
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
  const result={display:'flex',alignItems:'center',justifyContent:{left:'flex-start',center:'center',right:'flex-end'}[s.align],flexWrap:'wrap',alignContent:'center',columnGap:`${s.fontSize*.16}px`,rowGap:'0px',width:'100%',height:'100%',padding:'12px',whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:1.16,fontFamily:['editorial','vox'].includes(preset)?'Georgia,serif':'Manrope,sans-serif',fontSize:`${s.fontSize}px`,fontWeight:s.weight,color:s.color,textAlign:s.align,background:`${s.background}${Math.round(s.backgroundOpacity*255).toString(16).padStart(2,'0')}`,borderRadius:'0px',letterSpacing:'-0.02em',boxSizing:'border-box'};
  if(caption){
    result.fontWeight=['punch','marker','hormozi','neon','behind-subject','liquid-glass','cyber-neon'].includes(preset)?800:preset==='minimal'?600:s.weight;
    if(preset==='hormozi'){result.fontWeight=900;result.textTransform='uppercase';result.textShadow='3px 3px 0 #101010,-3px -3px 0 #101010,3px -3px 0 #101010,-3px 3px 0 #101010,0 4px 14px #000000';result.borderRadius='12px';}
    else if(preset==='punch'){result.textShadow='2px 2px 0 #101010,-2px -2px 0 #101010,2px -2px 0 #101010,-2px 2px 0 #101010,0 3px 12px #000000';result.borderRadius='14px';}
    else if(preset==='neon'){result.textShadow=`0 0 16px ${accent}aa, 0 2px 8px #000000`;result.borderRadius='14px';}
    else if(preset==='glow'){result.textShadow=`0 0 18px ${accent}88`;result.borderRadius='14px';}
    else if(preset==='liquid-glass'){result.background='linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(18, 36, 38, 0.65) 100%)';result.backdropFilter='blur(24px)';result.webkitBackdropFilter='blur(24px)';result.border='1px solid rgba(255, 255, 255, 0.36)';result.boxShadow='0 18px 45px rgba(0,0,0,0.5), inset 0 1.5px 1px rgba(255,255,255,0.7), inset 0 -1px 2px rgba(0,0,0,0.3)';result.borderRadius='36px';result.padding='14px 28px';result.textShadow='0 2px 10px rgba(0,0,0,0.7)';}
    else if(preset==='glass-card'){result.background='linear-gradient(180deg, rgba(20, 36, 40, 0.75) 0%, rgba(12, 22, 25, 0.85) 100%)';result.backdropFilter='blur(20px)';result.webkitBackdropFilter='blur(20px)';result.border='1px solid rgba(255,255,255,0.22)';result.boxShadow=`0 14px 40px rgba(0,0,0,0.5), 0 0 18px ${accent}22`;result.borderRadius='18px';result.padding='12px 22px';}
    else if(preset==='cyber-neon'){result.background='rgba(10, 18, 24, 0.82)';result.backdropFilter='blur(16px)';result.webkitBackdropFilter='blur(16px)';result.border=`2px solid ${accent}`;result.boxShadow=`0 12px 35px rgba(0,0,0,0.5), 0 0 22px ${accent}66, inset 0 0 14px ${accent}22`;result.borderRadius='20px';result.padding='14px 24px';}
    else if(preset==='behind-subject'){result.fontWeight=900;result.textTransform='uppercase';result.fontSize=`${s.fontSize*1.4}px`;result.letterSpacing='-0.03em';result.textShadow='0 4px 24px rgba(0,0,0,0.95), 0 2px 4px #000000';result.borderRadius='0px';result.background='transparent';}
    else{result.textShadow='0 2px 6px #00000088';result.borderRadius='12px';}
  }
  if(preset==='lower-third'){result.justifyContent='flex-start';result.padding='20px 28px';result.borderLeft=`6px solid ${accent}`;result.background='#101c20dd';result.textAlign='left';}
  if(preset==='chapter'){result.background='#101c20';result.padding='60px';result.borderTop=`12px solid ${accent}`;}
  if(preset==='glass'||preset==='liquid-glass'){result.background='linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(14, 28, 30, 0.72) 100%)';result.backdropFilter='blur(24px)';result.webkitBackdropFilter='blur(24px)';result.border='1px solid rgba(255, 255, 255, 0.38)';result.boxShadow='0 20px 50px rgba(0,0,0,0.5), inset 0 1.5px 1.5px rgba(255,255,255,0.8), inset 0 -1.5px 3px rgba(0,0,0,0.35)';result.borderRadius='36px';result.padding='22px 34px';result.fontWeight=800;}
  if(preset==='frost-hud'){result.background='linear-gradient(180deg, rgba(16, 32, 38, 0.8) 0%, rgba(10, 20, 24, 0.9) 100%)';result.backdropFilter='blur(18px)';result.webkitBackdropFilter='blur(18px)';result.border=`1px solid ${accent}66`;result.boxShadow=`0 14px 40px rgba(0,0,0,0.5), 0 0 20px ${accent}22`;result.borderRadius='14px';result.padding='18px 24px';result.fontFamily='monospace, sans-serif';result.letterSpacing='0.04em';}
  if(preset==='prismatic-glass'){result.background='linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(20, 25, 40, 0.7) 100%)';result.backdropFilter='blur(22px)';result.webkitBackdropFilter='blur(22px)';result.border='1px solid rgba(255, 255, 255, 0.45)';result.boxShadow='0 18px 50px rgba(0,0,0,0.4), inset 0 1px 2px rgba(0, 229, 255, 0.6), inset 0 -1px 2px rgba(255, 64, 129, 0.5)';result.borderRadius='40px';result.padding='18px 30px';result.fontWeight=800;}
  if(preset==='neon-glass'){result.background='rgba(12, 22, 28, 0.82)';result.backdropFilter='blur(16px)';result.webkitBackdropFilter='blur(16px)';result.border=`2px solid ${accent}`;result.boxShadow=`0 12px 35px rgba(0,0,0,0.5), 0 0 24px ${accent}66, inset 0 0 14px ${accent}33`;result.borderRadius='18px';result.padding='16px 24px';result.fontWeight=800;}
  if(preset==='behind-title'){result.fontWeight=900;result.textTransform='uppercase';result.fontSize=`${s.fontSize*1.6}px`;result.letterSpacing='-0.04em';result.color='#ffffff';result.textShadow='0 6px 30px rgba(0,0,0,0.95), 0 2px 4px #000000';result.borderRadius='0px';result.background='transparent';}
  if(preset==='stat'){result.borderBottom=`8px solid ${accent}`;result.fontWeight=800;}
  if(preset==='hook-badge'){result.background='#12121ae6';result.border=`2px solid ${accent}`;result.borderRadius='16px';result.padding='14px 22px';result.boxShadow='0 12px 40px #00000088';result.textTransform='uppercase';result.fontWeight=900;}
  if(preset==='top-banner'){result.background='linear-gradient(180deg, #101c20f2 0%, #101c20aa 100%)';result.borderBottom=`2px solid ${accent}`;result.padding='12px 18px';result.fontWeight=800;}
  if(preset==='progress-bar'){result.background=accent;result.height='6px';result.padding='0px';result.borderRadius='2px';}
  if(preset==='callout'){result.background='#101c20eb';result.borderLeft=`5px solid ${accent}`;result.borderRadius='8px';result.padding='14px 18px';result.fontWeight=700;}
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
      if((preset==='marker'||preset==='vox')&&active){style.backgroundColor=accent;style.color='#10221d';style.padding='0px 6px';}
      if(preset==='punch'&&active){style.fontWeight=800;const value=spring((local-word.startFrame)/6);style.transform=`scale(${.88+.18*value})`;}
      if(preset==='hormozi'&&active){style.fontWeight=900;const value=spring((local-word.startFrame)/5);style.transform=`scale(${.94+.16*value})`;}
      if(preset==='neon'&&active){style.fontWeight=800;style.textShadow=`0 0 14px ${accent},0 0 28px ${accent}aa`;style.transform='scale(1.08)';}
      if(preset==='glow'&&active)style.textShadow=`0 0 14px ${accent},0 0 30px ${accent}99`;
      if(preset==='karaoke'&&active){style.fontWeight=800;style.color=accent;style.textShadow=`0 0 12px ${accent}cc`;style.transform='scale(1.06)';}
      if(preset==='liquid-glass'&&active){style.fontWeight=800;style.color=accent;style.textShadow=`0 0 16px ${accent}cc, 0 2px 4px rgba(0,0,0,0.8)`;style.transform='scale(1.08)';}
      if(preset==='behind-subject'){style.fontWeight=900;style.textTransform='uppercase';if(active){style.color=accent;style.textShadow=`0 0 24px ${accent}ee, 0 4px 18px rgba(0,0,0,0.9)`;style.transform='scale(1.12)';}else if(!spoken){style.opacity=.85;}}
      if(preset==='glass-card'&&active){style.fontWeight=800;style.color=accent;style.backgroundColor=`${accent}28`;style.borderRadius='6px';style.padding='1px 6px';}
      if(preset==='cyber-neon'&&active){style.fontWeight=900;style.color='#ffffff';style.textShadow=`0 0 16px #00f0ff, 0 0 32px #ff0077`;style.transform='scale(1.1)';}
      if(preset==='typewriter'){style.opacity=local>=word.startFrame?1:0;style.color=active?accent:clip.textStyle.color;}
      if(preset==='signal'&&!active&&!spoken)style.opacity=.8;
      if(preset==='minimal'&&!active&&!spoken)style.opacity=.65;
      if(preset==='editorial'&&word.emphasis)style.fontWeight=800;
    }else{const reveal=ramp((local-index*3)/10);style.opacity=reveal;style.transform=`translateY(${(1-reveal)*25}px)`;}
    return {text:word.text,style,active,spoken};
  });
}
export function captionsFromWords(words,sequence,startFrame=0,preset='signal',maxWords=6){
  if(!Array.isArray(words)||!words.length)throw new Error('No timed speech words were returned.');
  const cleaned=words.map(w=>({text:String(w.word??w.text??'').trim(),startFrame:Math.max(0,Math.round(Number(w.start)*sequence.fps)),endFrame:Math.max(1,Math.round(Number(w.end)*sequence.fps)),emphasis:false})).filter(w=>w.text&&Number.isFinite(w.startFrame)&&Number.isFinite(w.endFrame)&&w.endFrame>w.startFrame).sort((a,b)=>a.startFrame-b.startFrame);
  if(!cleaned.length)throw new Error('The transcription has no valid word timestamps.');
  const effectiveMaxWords=maxWords||(['hormozi','punch'].includes(preset)?3:['vox','minimal'].includes(preset)?4:6);
  const groups=[];let group=[];
  const flush=()=>{if(group.length){const first=group[0].startFrame,end=Math.max(...group.map(w=>w.endFrame));groups.push({startFrame:startFrame+first,durationFrames:end-first,text:group.map(w=>w.text).join(' '),words:group.map(w=>({...w,startFrame:w.startFrame-first,endFrame:w.endFrame-first})),caption:{...captionSettings(preset),timing:'transcribed'}});group=[];}};
  for(const w of cleaned){if(group.length&&(group.length>=effectiveMaxWords||w.startFrame-group.at(-1).endFrame>sequence.fps*.45))flush();group.push(w);if(/[.!?。！？]$/u.test(w.text))flush();}flush();
  if(groups.length>480)throw new Error('This transcript needs more than 480 caption groups. Split the source into shorter sections.');
  return groups;
}

export function volumeAtFrame(clip,frame){const local=frame-clip.startFrame,duration=clip.durationFrames,a=clip.audio;const incoming=a.fadeInFrames?Math.max(0,Math.min(1,local/a.fadeInFrames)):1,outgoing=a.fadeOutFrames?Math.max(0,Math.min(1,(duration-local)/a.fadeOutFrames)):1;return a.muted?0:a.volume*Math.min(incoming,outgoing);}
export function audioAutomation(clip,fps){const a=clip.audio;if(!a.fadeInFrames&&!a.fadeOutFrames)return null;const frames=[...new Set([0,a.fadeInFrames||0,clip.durationFrames-(a.fadeOutFrames||0),clip.durationFrames])].sort((a,b)=>a-b);return {version:1,lanes:[{target:'volume',points:frames.map(f=>({t:f/fps,v:volumeAtFrame(clip,clip.startFrame+f)}))}]};}