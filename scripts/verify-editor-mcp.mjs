// Integration acceptance against the synthetic project created by verify-editor.mjs.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const fixture=JSON.parse(await readFile('data/test-runs/editor-acceptance/editor-acceptance.json','utf8'));
const base='http://127.0.0.1:3100/api/editor';
const current=await (await fetch(`${base}/projects/${fixture.projectId}`)).json();
assert.equal(current.project.name,'Editor acceptance · synthetic media','Use only the synthetic acceptance project.');
const title=current.project.tracks.flatMap(t=>t.clips).find(c=>c.kind==='text');
assert.ok(title);
const selection=await fetch(`${base}/projects/${fixture.projectId}/selection`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clipIds:[title.id],frame:30})});assert.ok(selection.ok);
const client=new Client({name:'motion-os-live-acceptance',version:'1.0.0'});
const transport=new StdioClientTransport({command:process.execPath,args:[resolve('scripts/editor-mcp.mjs'),'--project',fixture.projectId],stderr:'pipe'});
try{
  await client.connect(transport);
  const call=async(name,args={})=>{const result=await client.callTool({name,arguments:args});assert.ok(!result.isError,result.content[0].text);return JSON.parse(result.content[0].text);};
  const initial=await call('inspect_project');assert.equal(initial.revision,current.revision);
  const edited=await call('edit_timeline',{expectedRevision:initial.revision,requestKey:crypto.randomUUID(),label:'MCP acceptance: selected title',operations:[{type:'UpdateText',clipId:title.id,text:'One timeline. Human + agent.'}]});
  const expected=structuredClone(initial.project);expected.tracks.flatMap(t=>t.clips).find(c=>c.id===title.id).text='One timeline. Human + agent.';assert.deepEqual(edited.project,expected);
  const reopened=await (await fetch(`${base}/projects/${fixture.projectId}`)).json();assert.deepEqual(reopened.project,expected);assert.equal(reopened.revision,edited.revision);
  const job=await call('render_preview',{expectedRevision:edited.revision});
  await mkdir('data/test-runs',{recursive:true});
  await writeFile('data/test-runs/mcp-acceptance.json',JSON.stringify({projectId:fixture.projectId,...job,client:client.getServerVersion(),sdkVersion:'1.31.0',manualEditsPreserved:true,status:'queued'},null,2));
  console.log(JSON.stringify({projectId:fixture.projectId,revision:edited.revision,jobId:job.jobId,manualEditsPreserved:true}));
}finally{await client.close();}
