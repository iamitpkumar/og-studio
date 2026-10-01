import {workProductionJob} from './production-worker.mjs';
import {runtimeHeartbeat} from '../apps/web/src/server/production-store.mjs';
import { claimJob, cancelled, db, updateStage, project, saveRevision, now, dataDir, root, preferences } from '../apps/web/src/server/store.mjs';
import { localPlan, aiPlan } from '../apps/web/src/server/planner.mjs';
import { compileComposition } from '../apps/web/src/server/renderer.mjs';
import { mkdir, writeFile, copyFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import { dirname, delimiter } from 'node:path';
import { workEditorJob } from './editor-worker.mjs';

async function execute(job) {
  const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),90000);
  const heartbeat=setInterval(()=>{if(cancelled(job.id))abort.abort();else db().prepare('UPDATE jobs SET lease_until=? WHERE id=? AND status=\'running\'').run(Date.now()+120000,job.id);},3000);
  try {
    if(job.kind==='plan') {
      updateStage(job.id,job.input.mode==='ai'?'Writing your story':'Arranging your supplied copy');
      const existing=project(job.project_id);
      if(!existing.composition) {
        if(job.input.mode==='ai'){
          if(!preferences().externalAllowed)throw new Error('External processing permission was withdrawn.');
          if(job.input.providerSubmitted)throw new Error('An earlier provider request was interrupted. Check provider usage before explicitly retrying.');
          db().prepare('UPDATE jobs SET input=? WHERE id=?').run(JSON.stringify({...job.input,providerSubmitted:true}),job.id);
        }
        const comp=job.input.mode==='ai'?await aiPlan(job.input,abort.signal):localPlan(job.input);if(cancelled(job.id))return;updateStage(job.id,'Checking scene timing and preparing preview');saveRevision(job.project_id,comp,0);
      }
    } else if(job.kind==='export') {
      clearTimeout(timeout);
      const current=project(job.project_id);const revision=current.revisions.find(r=>r.number===job.input.revision);if(!revision)throw new Error('Export revision not found.');
      const dir=join(dataDir,'exports',job.id);await mkdir(dir,{recursive:true});
      const comp=revision.body; const html=compileComposition(comp,'./');await writeFile(join(dir,'index.html'),html);
      await copyFile(join(root,'node_modules/gsap/dist/gsap.min.js'),join(dir,'gsap.min.js'));
      await copyFile(join(root,'apps/web/public/fonts/manrope-latin.woff2'),join(dir,'font.woff2'));
      for(const scene of comp.scenes)if(scene.assetId){const asset=db().prepare('SELECT filename FROM assets WHERE id=?').get(scene.assetId);if(asset)await copyFile(join(dataDir,'assets',asset.filename),join(dir,scene.assetId));}
      updateStage(job.id,'Checking layout, motion and contrast');
      const check=await run(process.execPath,[join(root,'node_modules/hyperframes/bin/hyperframes.mjs'),'check',dir,'--json'],abort.signal,dir);
      await writeFile(join(dir,'quality-report.txt'),check);
      updateStage(job.id,'Rendering the saved revision');
      await run(process.execPath,[join(root,'node_modules/hyperframes/bin/hyperframes.mjs'),'render',dir,'--output',join(dir,'video.mp4'),'--quality','draft'],abort.signal,dir);
      const file=await stat(join(dir,'video.mp4'));if(file.size<1000)throw new Error('Render output is empty.');
      updateStage(job.id,'Verifying video dimensions and duration');
      const probe=JSON.parse(await run(ffprobe.path,['-v','error','-show_format','-show_streams','-of','json',join(dir,'video.mp4')],abort.signal,dir));
      const video=probe.streams.find(s=>s.codec_type==='video');if(!video||video.width!==comp.width||video.height!==comp.height||Math.abs(Number(probe.format.duration)-comp.durationFrames/30)>.15)throw new Error('The encoded video did not match the saved composition.');
      await writeFile(join(dir,'probe.json'),JSON.stringify(probe,null,2));
      await writeFile(join(dir,'manifest.json'),JSON.stringify({projectId:current.id,revision:revision.number,composition:comp,createdAt:now(),bytes:file.size},null,2));
    }
    if(!cancelled(job.id))db().prepare("UPDATE jobs SET status='completed',stage=?,updated_at=?,lease_until=NULL WHERE id=?").run(job.kind==='export'?'Export ready':'Ready to review',now(),job.id);
  } catch(error) {if(!cancelled(job.id))db().prepare("UPDATE jobs SET status='failed',stage='Needs attention',error=?,updated_at=?,lease_until=NULL WHERE id=?").run(error.message.slice(0,600),now(),job.id);}
  finally{clearTimeout(timeout);clearInterval(heartbeat);}
}
function run(command,args,signal,cwd){return new Promise((resolve,reject)=>{const child=spawn(command,args,{cwd,windowsHide:true,signal,env:{...process.env,PATH:[dirname(ffmpeg),dirname(ffprobe.path),process.env.PATH].join(delimiter),HYPERFRAMES_EXTRACT_CACHE_DIR:join(dataDir,'frame-cache'),HYPERFRAMES_TELEMETRY_DISABLED:'1'}});let output='',errors='';const timer=setTimeout(()=>child.kill(),20*60*1000);child.stdout.on('data',d=>{output=(output+d).slice(-200000);});child.stderr.on('data',d=>{errors=(errors+d).slice(-3000);});child.on('error',error=>{clearTimeout(timer);reject(error);});child.on('close',code=>{clearTimeout(timer);code===0?resolve(output):reject(new Error(`Media check or render failed (${code}). ${(errors||output).slice(-500)}`));});});}
runtimeHeartbeat();setInterval(runtimeHeartbeat,5000);let productionTask=null;
console.log('Motion OS worker started. Local jobs only; Ctrl+C to stop.');
while(true){if(!productionTask)productionTask=workProductionJob().catch(e=>console.error('Production worker:',e.message)).finally(()=>{productionTask=null;});const job=claimJob();if(job)await execute(job);else if(!await workEditorJob())await new Promise(r=>setTimeout(r,750));}
