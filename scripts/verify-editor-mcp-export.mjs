import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const record=JSON.parse(await readFile('data/test-runs/mcp-acceptance.json','utf8'));
const client=new Client({name:'motion-os-export-acceptance',version:'1.0.0'});
try{
  await client.connect(new StdioClientTransport({command:process.execPath,args:[resolve('scripts/editor-mcp.mjs'),'--project',record.projectId],stderr:'pipe'}));
  const status=await client.callTool({name:'export_status',arguments:{jobId:record.jobId}});assert.ok(!status.isError);const job=JSON.parse(status.content[0].text);assert.equal(job.status,'completed',`Export is ${job.status}: ${job.error||job.stage}`);assert.equal(job.revision,record.revision);
  const frames=await client.callTool({name:'inspect_export_frames',arguments:{jobId:record.jobId}});assert.ok(!frames.isError);const image=frames.content.find(c=>c.type==='image');assert.equal(image?.mimeType,'image/jpeg');assert.ok(image.data.length>1000);
  await writeFile('data/test-runs/mcp-contact-sheet.jpg',Buffer.from(image.data,'base64'));
  const probe=JSON.parse(await readFile(`data/motion-os/editor-exports/${record.jobId}/probe.json`,'utf8'));const video=probe.streams.find(s=>s.codec_type==='video');assert.equal(video.width,1920);assert.equal(video.height,1080);assert.equal(Number(video.nb_frames),300);assert.ok(probe.streams.some(s=>s.codec_type==='audio'));
  await writeFile('data/test-runs/mcp-acceptance.json',JSON.stringify({...record,status:'completed',framesRetrievedViaMcp:true,video:{width:video.width,height:video.height,frames:Number(video.nb_frames),duration:probe.format.duration,hasAudio:true}},null,2));
  console.log(JSON.stringify({jobId:record.jobId,status:'completed',framesRetrievedViaMcp:true,width:video.width,height:video.height,frames:video.nb_frames,hasAudio:true}));
}finally{await client.close();}
