import { NextRequest } from 'next/server';
import { join } from 'node:path';
import * as store from '../../../../server/editor-store.mjs';
import { readJSON } from '../../../../server/request.mjs';
import { fail,dataDir } from '../../../../server/store.mjs';
import { importMedia,fileResponse,mediaRoot } from '../../../../server/media.mjs';
import { serializeSubtitles } from '../../../../../../../packages/timeline/src/editor.mjs';
import { propose,approve } from '../../../../server/editor-director.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function handler(req:NextRequest,context:Context){try{
  const host=req.headers.get('host')||'';if(!['localhost','127.0.0.1'].includes(host.split(':')[0])||(req.headers.get('origin')&&req.headers.get('origin')!==`http://${host}`)||req.headers.get('sec-fetch-site')==='cross-site')fail('Use this API from the local studio.',403);
  const {path}=await context.params;const [resource,key,action,assetId]=path;
  if(req.method==='GET'){
    if(resource==='projects'&&!key)return json(store.listProjects());
    if(resource==='projects'&&key){const p=store.getProject(key);
      if(action==='media'&&assetId){const asset=p.media.find((a:any)=>a.id===assetId);if(!asset)fail('Media not found in this project.',404);const thumbnail=req.nextUrl.searchParams.has('thumbnail');return fileResponse(join(mediaRoot,thumbnail?asset.thumbnail:asset.proxy),thumbnail?'image/jpeg':asset.mime,req);}
      if(action==='json')return new Response(JSON.stringify(p.project,null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="motion-timeline.json"'}});
      if(action==='subtitles')return new Response(serializeSubtitles(p.project),{headers:{'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="captions.srt"'}});
      if(!action)return json(p);
    }
    if(resource==='exports'&&key){const job=store.db().prepare("SELECT * FROM editor_jobs WHERE id=? AND status='completed'").get(key) as any;if(!job)fail('Export not ready.',404);const sheet=action==='contact-sheet';return fileResponse(join(dataDir,'editor-exports',key,sheet?'contact-sheet.jpg':'video.mp4'),sheet?'image/jpeg':'video/mp4',req,sheet?null:'motion-edit.mp4');}
  }
  if(req.method==='POST'){
    if(resource==='projects'&&key&&action==='import')return json(await importMedia(key,req),201);
    const input=await readJSON(req);
    if(resource==='projects'&&!key)return json(store.createProject(input),201);
    if(resource==='projects'&&key){
      if(action==='director')return json(await propose(key,input));
      if(action==='approve')return json(approve(key,input));
      if(action==='operations')return json(store.edit(key,input));
      if(action==='undo'||action==='redo')return json(store.undoRedo(key,input,action));
      if(action==='selection')return json(store.selection(key,input));
      if(action==='media'&&assetId)return json(store.updateMedia(key,assetId,input));
      if(action==='export')return json({jobId:store.queueExport(key,input.expectedRevision)});
    }
    if(resource==='jobs'&&key&&action==='cancel'){store.db().prepare("UPDATE editor_jobs SET status='cancelled',stage='Cancelled' WHERE id=? AND status IN ('queued','running')").run(key);return json({ok:true});}
  }
  return json({error:'Not found.'},404);
}catch(e:any){console.error('Editor request:',e.message);return json({error:e.status?e.message:'The local editor could not complete this request. Check the worker log.'},e.status||500);}}
export const GET=handler;export const POST=handler;
