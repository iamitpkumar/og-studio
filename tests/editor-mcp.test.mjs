import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {newClip} from '../packages/timeline/src/editor.mjs';

mkdirSync('data/test-runs',{recursive:true});
process.env.MOTION_DATA_DIR=mkdtempSync(join(process.cwd(),'data/test-runs/mcp-'));
const store=await import('../apps/web/src/server/editor-store.mjs');
const {approve}=await import('../apps/web/src/server/editor-director.mjs');

test('real stdio MCP handshake, selected editing, stale rejection, proposal approval and scope enforcement',async()=>{
  let state=store.createProject({name:'MCP test'});
  const selected=newClip(state.project,'text'),manual=newClip(state.project,'text',null,150);
  manual.text='Preserve this manual title.';
  state=store.edit(state.project.id,{expectedRevision:state.revision,requestKey:'seed',operations:[selected,manual].map(clip=>({type:'AddClip',trackId:state.project.tracks[2].id,clip}))});
  store.selection(state.project.id,{clipIds:[selected.id],frame:15});
  const client=new Client({name:'motion-os-acceptance-client',version:'1.0.0'});
  const transport=new StdioClientTransport({command:process.execPath,args:[resolve('scripts/editor-mcp.mjs'),'--project',state.project.id],env:{...process.env,MOTION_DATA_DIR:process.env.MOTION_DATA_DIR},stderr:'pipe'});
  try{
    await client.connect(transport);
    assert.equal(client.getServerVersion().name,'motion-os');
    const catalog=await client.listTools();assert.equal(catalog.tools.length,7);
    assert.ok(!catalog.tools.some(t=>/approve|shell|execute|read_file/.test(t.name)));
    const call=async(name,args={})=>{const result=await client.callTool({name,arguments:args});assert.ok(!result.isError,result.content[0].text);return JSON.parse(result.content[0].text);};
    const initial=await call('inspect_project');assert.equal(initial.project.id,state.project.id);assert.equal(initial.revision,state.revision);
    const result=await call('edit_timeline',{expectedRevision:state.revision,requestKey:'selected-edit',label:'Revise selected title',operations:[{type:'UpdateText',clipId:selected.id,text:'A connected title.'}]});
    assert.equal(result.status,'applied');assert.equal(result.revision,state.revision+1);
    const saved=store.getProject(state.project.id);assert.equal(saved.project.tracks[2].clips[1].text,manual.text);assert.equal(saved.history[0].actor,'mcp');
    const stale=await client.callTool({name:'edit_timeline',arguments:{expectedRevision:state.revision,requestKey:'stale',label:'Stale request',operations:[{type:'UpdateText',clipId:selected.id,text:'Wrong'}]}});assert.equal(stale.isError,true);
    const proposal=await call('edit_timeline',{expectedRevision:saved.revision,requestKey:'unselected-edit',label:'Propose unselected edit',operations:[{type:'UpdateText',clipId:manual.id,text:'Approved later'}]});
    assert.equal(proposal.status,'approval_required');assert.equal(store.getProject(state.project.id).revision,saved.revision);
    // Simulate the explicit human approval endpoint, which is deliberately absent from MCP.
    approve(state.project.id,{expectedRevision:saved.revision,messageId:proposal.proposalId});
    const approved=await call('inspect_project');assert.equal(approved.project.tracks[2].clips[1].text,'Approved later');
    const destructive=await call('edit_timeline',{expectedRevision:approved.revision,requestKey:'delete',label:'Propose deletion',operations:[{type:'RemoveClip',clipId:selected.id}]});assert.equal(destructive.status,'approval_required');
    const exportJob=await call('render_preview',{expectedRevision:approved.revision});assert.equal((await call('export_status',{jobId:exportJob.jobId})).status,'queued');
    const premature=await client.callTool({name:'inspect_export_frames',arguments:{jobId:exportJob.jobId}});assert.equal(premature.isError,true);
    const foreign=await client.callTool({name:'export_status',arguments:{jobId:'another-project'}});assert.equal(foreign.isError,true);
    const escape=await client.callTool({name:'inspect_project',arguments:{projectId:'another-project'}});assert.equal(escape.isError,true);
    const malicious=await client.callTool({name:'edit_timeline',arguments:{expectedRevision:approved.revision,requestKey:'code',label:'Rejected code',operations:[{type:'ExecuteCode',clipId:selected.id,code:'process.exit()'}]}});assert.equal(malicious.isError,true);
    assert.equal(store.getProject(state.project.id).revision,approved.revision);
  }finally{await client.close();}
});
