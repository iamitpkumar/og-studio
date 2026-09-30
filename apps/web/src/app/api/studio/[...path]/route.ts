import { NextRequest } from 'next/server';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import * as store from '../../../../server/store.mjs';
import { compileComposition } from '../../../../server/renderer.mjs';
import { readBody, readJSON } from '../../../../server/request.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store'}});}
function guard(req:NextRequest){const host=(req.headers.get('host')||'').split(':')[0];if(!['localhost','127.0.0.1'].includes(host))store.fail('This studio is available on localhost only.',403);const origin=req.headers.get('origin');if(origin&&origin!==`http://${req.headers.get('host')}`)store.fail('This request must come from your local studio.',403);if(req.headers.get('sec-fetch-site')==='cross-site')store.fail('Cross-site requests are not allowed.',403);}
async function handler(req:NextRequest,context:Context){
  try {
    guard(req);const {path}=await context.params;const [resource,key,action]=path;
    if(req.method==='GET'){
      if(resource==='state')return json({products:store.products(),projects:store.projects(),jobs:store.jobs(),settings:store.preferences(),capabilities:{aiConfigured:Boolean(process.env.MOTION_AI_KEY&&process.env.MOTION_AI_MODEL),model:process.env.MOTION_AI_MODEL||null}});
      if(resource==='projects'&&key&&action==='preview'){const p=store.project(key);const requested=Number(req.nextUrl.searchParams.get('revision')||p.revision);const comp=p.revisions.find((r:any)=>r.number===requested)?.body;if(!comp)store.fail('Preview is not ready.',404);return new Response(compileComposition(comp),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self'; font-src 'self'; frame-ancestors 'self'",'X-Content-Type-Options':'nosniff'}});}
      if(resource==='runtime'&&key==='gsap')return new Response(await readFile(join(store.root,'node_modules/gsap/dist/gsap.min.js'),'utf8'),{headers:{'Content-Type':'application/javascript'}});
      if(resource==='assets'&&key){const asset=store.db().prepare('SELECT * FROM assets WHERE id=?').get(key) as any;if(!asset)store.fail('Asset not found.',404);return new Response(new Uint8Array(await readFile(join(store.dataDir,'assets',asset.filename))),{headers:{'Content-Type':asset.mime,'X-Content-Type-Options':'nosniff','Cache-Control':'private, max-age=3600'}});}
      if(resource==='projects'&&key&&action==='bundle'){const p=store.project(key);return new Response(JSON.stringify({version:2,project:p},null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="motion-project.json"'}});}
      if(resource==='exports'&&key){const job=store.db().prepare('SELECT * FROM jobs WHERE id=? AND kind=\'export\' AND status=\'completed\'').get(key);if(!job)store.fail('Export is not ready.',404);return new Response(new Uint8Array(await readFile(join(store.dataDir,'exports',key,'video.mp4'))),{headers:{'Content-Type':'video/mp4','Content-Disposition':'attachment; filename="motion-video.mp4"'}});}
    }
    if(req.method==='POST'&&resource==='products'&&key&&action==='assets'){
      store.product(key);const length=Number(req.headers.get('content-length'));if(length>25*1024*1024)store.fail('Choose an image smaller than 25 MB.',413);
      const body=await readBody(req,26*1024*1024);const form=await new Response(new Uint8Array(body),{headers:{'Content-Type':req.headers.get('content-type')||''}}).formData();const file=form.get('file');if(!(file instanceof File)||file.size>25*1024*1024||!file.size)store.fail('Choose an image smaller than 25 MB.');
      const bytes=Buffer.from(await file.arrayBuffer());let mime='';if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))mime='image/png';else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)mime='image/jpeg';else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')mime='image/webp';else store.fail('Use a PNG, JPEG or WebP image.');
      const hash=createHash('sha256').update(bytes).digest('hex');const assetId=store.id();await mkdir(join(store.dataDir,'assets'),{recursive:true});await writeFile(join(store.dataDir,'assets',hash),bytes);store.db().prepare('INSERT INTO assets VALUES(?,?,?,?,?,?,?,?)').run(assetId,key,file.name.slice(0,200),mime,hash,bytes.length,hash,store.now());return json(store.product(key));
    }
    if(req.method==='POST'||req.method==='PATCH'){
      if(Number(req.headers.get('content-length'))>100000)store.fail('Request is too large.',413);
      const input=await readJSON(req);
      if(resource==='products')return json(store.saveProduct(input,key));
      if(resource==='settings')return json(store.savePreferences(input));
      if(resource==='projects'&&!key)return json(store.createProject(input),201);
      if(resource==='projects'&&key&&action==='revision'){
        store.reviseProject(key,input.composition,Number(input.expectedRevision));return json(store.project(key));
      }
      if(resource==='projects'&&key&&action==='restore'){const p=store.project(key);const revision=p.revisions.find((r:any)=>r.number===Number(input.number));if(!revision)store.fail('Revision not found.',404);store.saveRevision(key,revision.body,Number(input.expectedRevision));return json(store.project(key));}
      if(resource==='projects'&&key&&action==='export'){const p=store.project(key);if(!p.composition)store.fail('Wait for a preview first.');const jobId=store.enqueue(key,'export',{revision:p.revision},`${key}:export:${p.revision}`);return json({jobId});}
      if(resource==='jobs'&&key&&action==='cancel'){store.db().prepare("UPDATE jobs SET status='cancelled',stage='Cancelled',updated_at=? WHERE id=? AND status IN ('queued','running')").run(store.now(),key);return json({ok:true});}
      if(resource==='jobs'&&key&&action==='retry'){const job=store.db().prepare('SELECT input FROM jobs WHERE id=?').get(key) as any;if(!job)store.fail('Job not found.',404);const jobInput=JSON.parse(job.input);delete jobInput.providerSubmitted;store.db().prepare("UPDATE jobs SET status='queued',stage='Waiting for local worker',error=NULL,attempts=0,input=?,updated_at=? WHERE id=? AND status IN ('failed','cancelled')").run(JSON.stringify(jobInput),store.now(),key);return json({ok:true});}
    }
    return json({error:'Not found.'},404);
  }catch(error:any){return json({error:error.status?error.message:'The local studio could not complete this request. Please retry.'},error.status||500);}
}
export const GET=handler;export const POST=handler;export const PATCH=handler;

