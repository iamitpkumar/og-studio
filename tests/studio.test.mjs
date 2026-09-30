import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
mkdirSync('data/test-runs',{recursive:true});
process.env.MOTION_DATA_DIR=mkdtempSync(join(process.cwd(),'data/test-runs/motion-os-'));
const store=await import('../apps/web/src/server/store.mjs');
const {localPlan}=await import('../apps/web/src/server/planner.mjs');
const {compileComposition}=await import('../apps/web/src/server/renderer.mjs');
const product=store.saveProduct({name:'Test product',description:'Verified description.',facts:['Fact one','Fact two'],cta:'See more'});
const input={productId:product.id,prompt:'Create a launch film',duration:30,ratio:'9:16',style:'studio',requestKey:'unique-test-request'};
test('projects and product snapshots persist, duplicate submissions resolve to one project',()=>{
  const first=store.createProject(input);const second=store.createProject(input);assert.equal(first.id,second.id);assert.equal(store.projects().length,1);assert.equal(store.jobs().length,1);
  store.saveProduct({...product,name:'Changed name'},product.id);assert.equal(store.project(first.id).productSnapshot.name,'Test product');
});
test('worker claims exclusively and recovers expired jobs',()=>{
  const job=store.claimJob();assert.ok(job);assert.equal(store.claimJob(),null);
  store.db().prepare('UPDATE jobs SET lease_until=0 WHERE id=?').run(job.id);assert.equal(store.claimJob().id,job.id);
  store.db().prepare('UPDATE jobs SET lease_until=0 WHERE id=?').run(job.id);assert.equal(store.claimJob(),null);assert.equal(store.jobs()[0].status,'failed');
});
test('canonical plans cover exact frame duration in every supported aspect ratio',()=>{
  for(const ratio of ['9:16','16:9','4:5','1:1'])for(const duration of [15,30,90,120,300]){const comp=localPlan({...input,ratio,duration,productSnapshot:product});assert.equal(comp.scenes.reduce((n,s)=>n+s.durationFrames,0),duration*30);assert.equal(store.validateComposition(comp),comp);}
});
test('revisions reject stale writes and preserve locked scenes',()=>{
  const p=store.projects()[0];const comp=localPlan({...input,productSnapshot:product});store.saveRevision(p.id,comp,0);
  assert.throws(()=>store.saveRevision(p.id,comp,0),/another tab/);
  comp.scenes[0].locked=true;store.reviseProject(p.id,comp,1);const changed=structuredClone(comp);changed.scenes[0].headline='Changed';assert.throws(()=>store.reviseProject(p.id,changed,2),/Unlock/);
  comp.scenes[0].locked=false;store.reviseProject(p.id,comp,2);assert.equal(store.project(p.id).revision,3);
});
test('asset isolation and composition injection are rejected',()=>{
  const p=store.projects()[0];const comp=localPlan({...input,productSnapshot:product});comp.scenes[0].assetId='12345678-1234-1234-1234-123456789abc';assert.throws(()=>store.reviseProject(p.id,comp,3),/snapshot/);
  comp.scenes[0].assetId=null;comp.width='1080"><script>alert(1)</script>';assert.throws(()=>compileComposition(comp),/dimensions/);
});
test('renderer escapes copy and contains only local media references',()=>{
  const comp=localPlan({...input,productSnapshot:product});comp.scenes[0].headline='<script>alert("test")</script>';const html=compileComposition(comp);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>alert'));assert.ok(!html.includes('https://'));assert.ok(html.includes('data-composition-id="main"'));
});
test('external processing requires explicit opt-in',()=>{assert.throws(()=>store.savePreferences({mode:'ai',externalAllowed:false}),/Allow sending/);assert.equal(store.preferences().mode,'local');});
test('invalid and discontinuous timing fails before rendering',()=>{const comp=localPlan({...input,productSnapshot:product});comp.scenes[1].startFrame++;assert.throws(()=>compileComposition(comp),/contiguous/);});

test('request limits apply to chunked bodies and malformed JSON is a client error',async()=>{
  const {readBody,readJSON}=await import('../apps/web/src/server/request.mjs');
  const request=body=>new Request('http://localhost',{method:'POST',body});
  await assert.rejects(()=>readBody(request('12345'),4),error=>error.status===413);
  await assert.rejects(()=>readJSON(request('{')),error=>error.status===400);
  await assert.rejects(()=>readJSON(request('null')),error=>error.status===400);
  assert.deepEqual(await readJSON(request('{"ok":true}')),{ok:true});
});
