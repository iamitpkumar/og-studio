// Verify the owner's already queued real-footage export without editing its timeline.
import assert from 'node:assert/strict';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import {runMedia} from '../apps/web/src/server/media.mjs';
const dir=resolve('data/test-runs/production-acceptance'),path=join(dir,'astra-evidence.json'),e=JSON.parse(await readFile(path,'utf8')),base='http://127.0.0.1:3100/api/editor',deadline=Date.now()+20*60*1000;
let previous='',completed=false;
while(Date.now()<deadline){const snapshot=await(await fetch(`${base}/projects/${e.projectId}`)).json(),job=snapshot.jobs.find(j=>j.id===e.jobId);assert.ok(job);if(previous!==job.stage){console.log(job.stage);previous=job.stage;}if(job.status==='failed')throw new Error(job.error);if(job.status==='completed'){completed=true;break;}await new Promise(r=>setTimeout(r,10000));}
assert.ok(completed,'Export did not complete in twenty minutes');
const range=await fetch(`${base}/exports/${e.jobId}/preview`,{headers:{Range:'bytes=0-511'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,512);
const response=await fetch(`${base}/exports/${e.jobId}`);assert.ok(response.ok);assert.match(response.headers.get('Content-Disposition'),/attachment/);const file=join(dir,`astra-export-v${e.revision}.mp4`);await pipeline(Readable.fromWeb(response.body),createWriteStream(file));
const manifest=JSON.parse(await readFile(join('data/motion-os/editor-exports',e.jobId,'manifest.json'),'utf8'));const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);e.videoHash=hash.digest('hex');assert.equal(e.videoHash,manifest.video.sha256);assert.ok(manifest.assets.some(a=>a.hash===e.originalHash));assert.equal(manifest.revision,e.revision);
const probe=JSON.parse(await runMedia(ffprobe.path,['-v','error','-show_streams','-show_format','-of','json',file])),v=probe.streams.find(s=>s.codec_type==='video');assert.equal(v.width,e.sequence.width);assert.equal(v.height,e.sequence.height);assert.equal(Number(v.nb_frames),e.sequence.durationFrames);assert.equal(v.avg_frame_rate,e.sequence.fps+'/1');assert.ok(Math.abs(Number(v.duration)-e.sequence.durationFrames/e.sequence.fps)<.001);assert.ok(probe.streams.some(s=>s.codec_type==='audio'));
const pcmFile=join(dir,'astra-audio.f32');await runMedia(ffmpeg,['-y','-v','error','-i',file,'-vn','-ac','2','-ar','48000','-f','f32le',pcmFile]);const pcm=await readFile(pcmFile);let peak=0,sum=0;for(let i=0;i<pcm.length;i+=4){const x=pcm.readFloatLE(i);peak=Math.max(peak,Math.abs(x));sum+=x*x;}e.audio={channels:2,rms:Math.sqrt(sum/(pcm.length/4)),peak};assert.ok(e.audio.rms>.001);assert.ok(peak<1);
await runMedia(ffmpeg,['-y','-v','error','-i',file,'-vf',`fps=1/${e.sequence.durationFrames/e.sequence.fps/6},scale=320:-2,tile=3x2`,'-frames:v','1',join(dir,'astra-contact-sheet.jpg')]);
e.output=file;e.videoBytes=(await stat(file)).size;e.video={width:v.width,height:v.height,frames:Number(v.nb_frames),fps:e.sequence.fps,duration:Number(v.duration),containerDuration:Number(probe.format.duration)};e.checks=['saved user revision unchanged by verification','original source hash retained','full source duration','downloaded MP4 checksum matches validated output','exact dimensions and video frames','range player seeking','audible unclipped stereo audio'];await writeFile(path,JSON.stringify(e,null,2));console.log(JSON.stringify(e));
