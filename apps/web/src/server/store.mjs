import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const root = resolve(process.cwd(), existsSync(resolve(process.cwd(), 'apps/web')) ? '.' : '../..');
export const dataDir = resolve(process.env.MOTION_DATA_DIR || join(root, 'data/motion-os'));
let connection;
export function db() {
  if (connection) return connection;
  mkdirSync(dataDir, { recursive: true });
  connection = new DatabaseSync(join(dataDir, 'studio.sqlite'));
  connection.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY, body TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id), body TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS revisions(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), number INTEGER NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(project_id,number));
    CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), kind TEXT NOT NULL, status TEXT NOT NULL, stage TEXT NOT NULL, error TEXT, request_key TEXT NOT NULL UNIQUE, input TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, lease_until INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id), name TEXT NOT NULL, mime TEXT NOT NULL, filename TEXT NOT NULL, bytes INTEGER NOT NULL, hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT, job_id TEXT NOT NULL, stage TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS jobs_status ON jobs(status,created_at);`);
  return connection;
}
export const now = () => new Date().toISOString();
/** @returns {string} */
export const id = () => randomUUID();
/** @returns {never} */
export function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
export function text(value, name, max = 2000, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail(`${name} must be ${required ? '1' : '0'}–${max} characters.`);
  return value.trim();
}
export function productInput(input) {
  const color = input.color || '#176c6b';
  if (!/^#[0-9a-f]{6}$/i.test(color)) fail('Choose a valid brand color.');
  const facts = Array.isArray(input.facts) ? input.facts.map(f => text(f, 'Fact', 300)).slice(0, 12) : [];
  return { name: text(input.name, 'Product name', 80), description: text(input.description, 'Description', 800), facts,
    tone: text(input.tone || 'Clear, confident and human', 'Tone', 200), audience: text(input.audience || 'People discovering this product', 'Audience', 200),
    cta: text(input.cta || 'Discover more', 'Call to action', 100), color, sample: Boolean(input.sample) };
}
export function products() { return db().prepare('SELECT * FROM products ORDER BY created_at DESC').all().map(row => ({...JSON.parse(row.body), id: row.id, assets: assets(row.id)})); }
export function product(productId) { const row = db().prepare('SELECT * FROM products WHERE id=?').get(productId); if (!row) fail('Product not found.', 404); return {...JSON.parse(row.body), id: row.id, assets: assets(row.id)}; }
export function saveProduct(input, productId) {
  const body = productInput(input); if (productId) product(productId);
  const key = productId || id();
  db().prepare('INSERT INTO products VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(key, JSON.stringify(body), now());
  return product(key);
}
export function assets(productId) { return db().prepare('SELECT id,name,mime,bytes,created_at FROM assets WHERE product_id=? ORDER BY created_at DESC').all(productId); }
export function project(projectId) {
  const row = db().prepare('SELECT * FROM projects WHERE id=?').get(projectId); if (!row) fail('Project not found.', 404);
  const revisions = db().prepare('SELECT number,body,created_at FROM revisions WHERE project_id=? ORDER BY number DESC').all(projectId).map(r=>({...r,body:JSON.parse(r.body)}));
  return { ...JSON.parse(row.body), id: row.id, productId: row.product_id, revision: row.revision, createdAt: row.created_at,
    composition: revisions[0]?.body || null, revisions, jobs: jobs(projectId) };
}
export function projects() { return db().prepare('SELECT id FROM projects ORDER BY created_at DESC').all().map(r=>project(r.id)); }
export function jobs(projectId) { return projectId ? db().prepare('SELECT id,project_id,kind,status,stage,error,attempts,created_at,updated_at FROM jobs WHERE project_id=? ORDER BY created_at DESC').all(projectId) : db().prepare('SELECT id,project_id,kind,status,stage,error,attempts,created_at,updated_at FROM jobs ORDER BY created_at DESC LIMIT 100').all(); }
export function preferences() { const row=db().prepare('SELECT body FROM settings WHERE id=1').get();return row?JSON.parse(row.body):{mode:'local',externalAllowed:false}; }
export function savePreferences(input) {
  const settings={mode:input.mode==='ai'?'ai':'local',externalAllowed:input.externalAllowed===true};
  if(settings.mode==='ai' && !settings.externalAllowed) fail('Allow sending your prompt and product facts to the configured AI provider first.');
  db().prepare('INSERT INTO settings VALUES(1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(JSON.stringify(settings));return settings;
}
export function enqueue(projectId, kind, input, requestKey = id()) {
  const existing=db().prepare('SELECT * FROM jobs WHERE request_key=?').get(requestKey);
  if(existing) return existing.id;
  const jobId=id(); const date=now();
  db().prepare('INSERT INTO jobs(id,project_id,kind,status,stage,request_key,input,created_at,updated_at) VALUES(?,?,?,\'queued\',\'Waiting for local worker\',?,?,?,?)').run(jobId,projectId,kind,requestKey,JSON.stringify(input),date,date);
  return jobId;
}
export function createProject(input) {
  const key=text(input.requestKey,'Request key',100); const existing=db().prepare('SELECT project_id FROM jobs WHERE request_key=?').get(key);if(existing)return project(existing.project_id);
  const selected=product(input.productId); const prompt=text(input.prompt,'Video brief',3000);
  const duration=Number(input.duration);if(![15,30,60,90,120,300].includes(duration))fail('Choose a supported duration.');
  if(!['9:16','16:9','1:1','4:5'].includes(input.ratio))fail('Choose a supported aspect ratio.');
  const style=['editorial','studio','bold'].includes(input.style)?input.style:'studio';
  const body={title:prompt.slice(0,65),prompt,duration,ratio:input.ratio,style,language:text(input.language||'English','Language',60),productSnapshot:selected,mode:preferences().mode};
  const projectId=id();db().exec('BEGIN IMMEDIATE');
  try {db().prepare('INSERT INTO projects VALUES(?,?,?,0,?)').run(projectId,selected.id,JSON.stringify(body),now());enqueue(projectId,'plan',body,key);db().exec('COMMIT');} catch(e){db().exec('ROLLBACK');throw e;}
  return project(projectId);
}
export function validateComposition(comp) {
  if(!comp || comp.schemaVersion!==2 || comp.fps!==30 || !Array.isArray(comp.scenes) || !comp.scenes.length || comp.scenes.length>60)fail('Invalid composition.');
  if(![[1080,1920],[1920,1080],[1080,1080],[1080,1350]].some(([w,h])=>comp.width===w&&comp.height===h))fail('Invalid output dimensions.');
  if(!['studio','editorial','bold'].includes(comp.style)||!/^#[a-f\d]{6}$/i.test(comp.color))fail('Invalid visual style.');
  text(comp.brand,'Brand',80);if(!['local','ai'].includes(comp.source))fail('Invalid plan source.');
  if(!Array.isArray(comp.notes)||comp.notes.length>10||comp.notes.some(n=>typeof n!=='string'||n.length>600))fail('Invalid composition notes.');
  let cursor=0;const seen=new Set();
  for(const scene of comp.scenes) {
    if(typeof scene.id!=='string'||!/^[\w-]{1,64}$/.test(scene.id)||seen.has(scene.id))fail('Scene IDs must be unique.');seen.add(scene.id);
    if(scene.assetId!==null&&scene.assetId!==undefined&&(typeof scene.assetId!=='string'||!/^[a-f\d-]{36}$/i.test(scene.assetId)))fail('Invalid asset ID.');
    text(scene.headline,'Headline',180);text(scene.body,'Scene text',600,false);
    if(!Number.isInteger(scene.durationFrames)||scene.durationFrames<30||scene.durationFrames>1800||scene.startFrame!==cursor)fail('Scene timing must be contiguous whole frames.');
    if(!['title','feature','product','proof','cta','chapter'].includes(scene.type))fail('Unsupported scene type.');
    cursor+=scene.durationFrames;
  }
  if(cursor!==comp.durationFrames||cursor>9000)fail('Invalid total duration.');return comp;
}
export function saveRevision(projectId, comp, expectedRevision) {
  validateComposition(comp);db().exec('BEGIN IMMEDIATE');
  try { const current=db().prepare('SELECT revision FROM projects WHERE id=?').get(projectId);if(!current)fail('Project not found.',404);if(current.revision!==expectedRevision)fail('This project changed in another tab. Reload before saving.',409);
    const number=current.revision+1;db().prepare('INSERT INTO revisions VALUES(?,?,?,?,?)').run(id(),projectId,number,JSON.stringify(comp),now());db().prepare('UPDATE projects SET revision=? WHERE id=?').run(number,projectId);db().exec('COMMIT');return number;
  }catch(e){db().exec('ROLLBACK');throw e;}
}
export function reviseProject(projectId,comp,expectedRevision) {
  validateComposition(comp);const current=project(projectId);const allowed=new Set(current.productSnapshot.assets.map(a=>a.id));
  for(const scene of comp.scenes)if(scene.assetId&&!allowed.has(scene.assetId))fail('Select an asset from this project’s product snapshot.');
  for(const previous of current.composition?.scenes||[])if(previous.locked){const next=comp.scenes.find(s=>s.id===previous.id);if(!next||JSON.stringify({...previous,locked:false})!==JSON.stringify({...next,locked:false}))fail('Unlock this scene before changing or removing it.');}
  return saveRevision(projectId,comp,expectedRevision);
}
export function updateStage(jobId,stage) {db().prepare('UPDATE jobs SET stage=?,updated_at=?,lease_until=? WHERE id=? AND status=\'running\'').run(stage,now(),Date.now()+120000,jobId);db().prepare('INSERT INTO events(job_id,stage,created_at) VALUES(?,?,?)').run(jobId,stage,now());}
export function claimJob() {
  db().exec('BEGIN IMMEDIATE');try {
    db().prepare("UPDATE jobs SET status=CASE WHEN attempts<2 THEN 'queued' ELSE 'failed' END,stage='Worker interrupted; recovery',error=CASE WHEN attempts>=2 THEN 'Worker stopped twice. Retry this job.' ELSE NULL END WHERE status='running' AND lease_until<?").run(Date.now());
    const job=db().prepare("SELECT * FROM jobs WHERE status='queued' ORDER BY created_at LIMIT 1").get();
    if(job)db().prepare("UPDATE jobs SET status='running',attempts=attempts+1,lease_until=?,updated_at=? WHERE id=?").run(Date.now()+120000,now(),job.id);
    db().exec('COMMIT');return job?{...job,input:JSON.parse(job.input)}:null;
  }catch(e){db().exec('ROLLBACK');throw e;}
}
export function cancelled(jobId) {return db().prepare('SELECT status FROM jobs WHERE id=?').get(jobId)?.status==='cancelled';}
