import { createWriteStream, createReadStream } from 'node:fs';
import { mkdir, stat, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import { dataDir,id,fail } from './store.mjs';
import { attachMedia,getProject,media } from './editor-store.mjs';
export const mediaRoot=join(dataDir,'editor-media');
export function runMedia(command,args,timeout=120000){return new Promise((resolve,reject)=>{const child=spawn(command,args,{windowsHide:true});let stdout='',stderr='';const timer=setTimeout(()=>child.kill(),timeout);child.stdout.on('data',data=>{stdout=(stdout+data).slice(-1000000);});child.stderr.on('data',data=>{stderr=(stderr+data).slice(-4000);});child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);code===0?resolve(stdout):reject(new Error(`Media processing failed (${code}): ${stderr.slice(-900)}`));});});}
export async function importMedia(projectId,request){
  getProject(projectId);const name=decodeURIComponent(request.headers.get('x-file-name')||'');if(!name||name.length>200)fail('Provide a filename.');
  const ext=extname(name).toLowerCase();if(!['.mp4','.mov','.webm','.mkv','.mp3','.wav','.m4a','.aac','.ogg','.flac','.png','.jpg','.jpeg','.webp'].includes(ext))fail('Import video, audio, PNG, JPEG or WebP media.');
  const limit=512*1024*1024;if(Number(request.headers.get('content-length'))>limit)fail('The local import limit is 512 MB per file.',413);
  await mkdir(mediaRoot,{recursive:true});const temp=join(mediaRoot,`${id()}.upload`);const output=createWriteStream(temp);const hash=createHash('sha256');const reader=request.body?.getReader();if(!reader)fail('No file received.');let bytes=0;let streamError;output.on('error',e=>{streamError=e;});
  try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>limit){await reader.cancel();fail('The local import limit is 512 MB per file.',413);}if(streamError)throw streamError;hash.update(value);if(!output.write(value))await once(output,'drain');}output.end();await once(output,'close');if(streamError)throw streamError;}catch(e){output.destroy();throw e;}finally{reader.releaseLock();}
  if(!bytes)fail('The file is empty.');const digest=hash.digest('hex');const duplicate=media(projectId).find(a=>a.hash===digest);if(duplicate)return duplicate;
  let probe;try{probe=JSON.parse(await runMedia(ffprobe.path,['-v','error','-show_streams','-show_format','-of','json',temp]));}catch(error){console.error('Media probe:',error.message);fail('This file could not be decoded. Try MP4/H.264, WAV, PNG or JPEG.');}
  const image=['.png','.jpg','.jpeg','.webp'].includes(ext);const visual=probe.streams.find(s=>s.codec_type==='video');const sound=probe.streams.find(s=>s.codec_type==='audio');const kind=image?'image':visual?'video':sound?'audio':null;if(!kind||(image&&!visual))fail('No readable media stream found.');
  const duration=image?null:Number(probe.format.duration||visual?.duration||sound?.duration);if(!image&&(!Number.isFinite(duration)||duration<=0||duration>3600))fail('Import media up to one hour long.');
  const assetId=id();const dir=join(mediaRoot,digest);await mkdir(dir,{recursive:true});const original=join(dir,`original${ext}`);await rename(temp,original).catch(async e=>{if(e.code!=='EEXIST'&&e.code!=='EPERM')throw e;if(!(await stat(original).catch(()=>null)))throw e;});
  const proxyName=kind==='video'?'proxy.mp4':kind==='audio'?'proxy.m4a':'proxy.png';const proxy=join(dir,proxyName);const thumbnail=join(dir,'thumbnail.jpg');
  if(kind==='video'){await runMedia(ffmpeg,['-y','-v','error','-i',original,'-map','0:v:0','-map','0:a?','-vf','scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',proxy],600000);await runMedia(ffmpeg,['-y','-v','error','-ss',String(Math.min(.5,duration/2)),'-i',proxy,'-frames:v','1','-vf','scale=320:-2',thumbnail]);}
  else if(kind==='audio'){await runMedia(ffmpeg,['-y','-v','error','-i',original,'-vn','-c:a','aac','-b:a','192k',proxy],600000);await runMedia(ffmpeg,['-y','-v','error','-i',proxy,'-filter_complex','showwavespic=s=400x120:colors=63a89c','-frames:v','1',thumbnail]);}
  else{await runMedia(ffmpeg,['-y','-v','error','-i',original,'-frames:v','1',proxy]);await runMedia(ffmpeg,['-y','-v','error','-i',proxy,'-frames:v','1','-vf','scale=320:-2',thumbnail]);}
  const asset={id:assetId,name,kind,mime:kind==='video'?'video/mp4':kind==='audio'?'audio/mp4':'image/png',hash:digest,bytes,duration,width:visual?.width||null,height:visual?.height||null,hasAudio:Boolean(sound),original:join(digest,`original${ext}`),proxy:join(digest,proxyName),thumbnail:join(digest,'thumbnail.jpg'),folder:'Unsorted',tags:[],source:'user-import'};
  return attachMedia(projectId,asset);
}
/** @param {string|null} downloadName */
export async function fileResponse(path,mime,request,downloadName=null){const info=await stat(path);const range=request.headers.get('range');let start=0,end=info.size-1,status=200;const headers={'Content-Type':mime,'Accept-Ranges':'bytes','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'};
  if(downloadName)headers['Content-Disposition']=`attachment; filename="${downloadName}"`;
  if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${info.size}`}});if(!match[1])start=Math.max(0,info.size-Number(match[2]));else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}if(start>end||start>=info.size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${info.size}`}});status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;}
  headers['Content-Length']=String(end-start+1);const stream=createReadStream(path,{start,end});const body=new ReadableStream({start(controller){stream.on('data',chunk=>controller.enqueue(new Uint8Array(chunk)));stream.on('end',()=>controller.close());stream.on('error',error=>controller.error(error));},cancel(){stream.destroy();}});return new Response(body,{status,headers});}
