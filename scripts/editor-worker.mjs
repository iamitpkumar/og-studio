import { mkdir,writeFile,copyFile,stat } from 'node:fs/promises';
import { join,extname,dirname,delimiter } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import { dataDir,root,now } from '../apps/web/src/server/store.mjs';
import { db,claimExport,jobStage,media } from '../apps/web/src/server/editor-store.mjs';
import { mediaRoot,runMedia } from '../apps/web/src/server/media.mjs';
import { compileTimeline } from '../apps/web/src/server/editor-renderer.mjs';
const cancelled=id=>db().prepare('SELECT status FROM editor_jobs WHERE id=?').get(id)?.status==='cancelled';
export async function workEditorJob(){const job=claimExport();if(!job)return false;const abort=new AbortController();const heartbeat=setInterval(()=>{if(cancelled(job.id))abort.abort();else db().prepare('UPDATE editor_jobs SET lease_until=? WHERE id=?').run(Date.now()+120000,job.id);},2000);
  const dir=join(dataDir,'editor-exports',job.id);try{
    const row=db().prepare('SELECT body FROM editor_revisions WHERE project_id=? AND number=?').get(job.project_id,job.revision);if(!row)throw new Error('Saved revision not found.');const project=JSON.parse(row.body);const assets=media(job.project_id);await mkdir(dir,{recursive:true});
    const used=new Set(project.tracks.flatMap(t=>t.clips.map(c=>c.assetId)).filter(Boolean));const renderAssets=assets.filter(a=>used.has(a.id)).map(a=>({...a,exportExtension:extname(a.kind==='image'?a.proxy:a.original)}));
    jobStage(job.id,'Preparing saved timeline and original media');
    for(const asset of renderAssets)await copyFile(join(mediaRoot,asset.kind==='image'?asset.proxy:asset.original),join(dir,`${asset.id}${asset.exportExtension}`));
    await writeFile(join(dir,'index.html'),compileTimeline(project,renderAssets));await copyFile(join(root,'node_modules/gsap/dist/gsap.min.js'),join(dir,'gsap.min.js'));await copyFile(join(root,'apps/web/public/fonts/manrope-latin.woff2'),join(dir,'font.woff2'));
    const cli=join(root,'node_modules/hyperframes/bin/hyperframes.mjs');jobStage(job.id,'Checking timeline and media');
    const lint=await command([cli,'lint',dir,'--json'],dir,abort.signal);await writeFile(join(dir,'lint-report.json'),lint);
    jobStage(job.id,'Rendering video and mixing audio');const log=await command([cli,'render',dir,'--output',join(dir,'video.mp4'),'--quality','standard'],dir,abort.signal);await writeFile(join(dir,'render.log'),log);
    jobStage(job.id,'Verifying encoded output');const probe=JSON.parse(await runMedia(ffprobe.path,['-v','error','-show_streams','-show_format','-of','json',join(dir,'video.mp4')]));const video=probe.streams.find(s=>s.codec_type==='video');const q=project.sequence;
    if(!video||video.width!==q.width||video.height!==q.height||Math.abs(Number(probe.format.duration)-q.durationFrames/q.fps)>.15)throw new Error('Export dimensions or timing do not match the saved timeline.');
    await runMedia(ffmpeg,['-v','error','-i',join(dir,'video.mp4'),'-f','null','-'],600000);
    await writeFile(join(dir,'probe.json'),JSON.stringify(probe,null,2));
    await runMedia(ffmpeg,['-y','-v','error','-i',join(dir,'video.mp4'),'-vf',`fps=1/${Math.max(.1,q.durationFrames/q.fps/6)},scale=320:-2,tile=3x2`,'-frames:v','1',join(dir,'contact-sheet.jpg')]);
    const hash=createHash('sha256');for await(const chunk of createReadStream(join(dir,'video.mp4')))hash.update(chunk);const info=await stat(join(dir,'video.mp4'));
    await writeFile(join(dir,'manifest.json'),JSON.stringify({schemaVersion:3,projectId:project.id,revision:job.revision,renderer:'hyperframes',createdAt:now(),project,assets:renderAssets.map(a=>({id:a.id,hash:a.hash})),video:{bytes:info.size,sha256:hash.digest('hex')}},null,2));
    if(!cancelled(job.id))db().prepare("UPDATE editor_jobs SET status='completed',stage='Export ready',error=NULL,updated_at=?,lease_until=NULL WHERE id=?").run(now(),job.id);
  }catch(e){if(!cancelled(job.id))db().prepare("UPDATE editor_jobs SET status='failed',stage='Needs attention',error=?,updated_at=?,lease_until=NULL WHERE id=?").run(e.message.slice(-1000),now(),job.id);}finally{clearInterval(heartbeat);}return true;
}
function command(args,cwd,signal){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{cwd,signal,windowsHide:true,env:{...process.env,PATH:[dirname(ffmpeg),dirname(ffprobe.path),process.env.PATH].join(delimiter),HYPERFRAMES_EXTRACT_CACHE_DIR:join(dataDir,'frame-cache'),HYPERFRAMES_TELEMETRY_DISABLED:'1'}});let output='';const timer=setTimeout(()=>child.kill(),20*60*1000);for(const s of [child.stdout,child.stderr])s.on('data',d=>output=(output+d).slice(-200000));child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);code===0?resolve(output):reject(new Error(`Render failed (${code}): ${output.slice(-900)}`));});});}
