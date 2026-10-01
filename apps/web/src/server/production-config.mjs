import {readFileSync,existsSync} from 'node:fs';
import {writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {root,fail,savePreferences,preferences} from './store.mjs';
const names=['MOTION_AI_KEY','MOTION_AI_MODEL','MOTION_AI_BASE_URL','MOTION_RUNWAY_KEY'];
const path=()=>process.env.MOTION_ENV_FILE||join(root,'.env.local');
export function providerConfig(){
  const values={};
  if(existsSync(path()))for(const line of readFileSync(path(),'utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_]+)\s*=\s*(.*)$/);if(!m||!names.includes(m[1]))continue;let value=m[2].trim();if(value.startsWith('"')){try{value=JSON.parse(value);}catch{continue;}}values[m[1]]=value;}
  return {key:values.MOTION_AI_KEY||process.env.MOTION_AI_KEY||'',model:values.MOTION_AI_MODEL||process.env.MOTION_AI_MODEL||'gpt-4.1-mini',base:values.MOTION_AI_BASE_URL||process.env.MOTION_AI_BASE_URL||'https://api.openai.com/v1',runwayKey:values.MOTION_RUNWAY_KEY||process.env.MOTION_RUNWAY_KEY||''};
}
export function productionAvailability(){const c=providerConfig();return {transcription:Boolean(c.key),writing:Boolean(c.key),voice:Boolean(c.key),video:Boolean(c.runwayKey),externalAllowed:Boolean(preferences().externalAllowed),model:c.model,base:c.base,videoProvider:'Runway Gen-4.5'};}
export async function saveProductionConfig(input){
  const updates={};for(const [field,env] of [['openaiKey','MOTION_AI_KEY'],['model','MOTION_AI_MODEL'],['base','MOTION_AI_BASE_URL'],['runwayKey','MOTION_RUNWAY_KEY']]){if(input[field]===undefined||input[field]==='')continue;const value=input[field];if(typeof value!=='string'||value.length>500||/[\r\n\0]/.test(value))fail('Invalid provider setting.');updates[env]=value.trim();}
  if(updates.MOTION_AI_BASE_URL){const u=new URL(updates.MOTION_AI_BASE_URL);if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname)||u.username||u.password||u.search)fail('Choose an HTTPS API base URL or a loopback endpoint.');}
  const previous=existsSync(path())?readFileSync(path(),'utf8'):'';
  const lines=previous.split(/\r?\n/).filter(line=>!Object.keys(updates).some(name=>line.startsWith(name+'=')));
  for(const [key,value] of Object.entries(updates))lines.push(`${key}=${JSON.stringify(value)}`);
  await writeFile(path()+'.tmp',lines.join('\n')+'\n',{mode:0o600});await rename(path()+'.tmp',path());
  savePreferences({mode:input.externalAllowed?'ai':'local',externalAllowed:input.externalAllowed===true});return productionAvailability();
}
export function requireProviders({video=false,writing=true}={}){const c=providerConfig();if(!preferences().externalAllowed)fail('Enable external AI processing in Production settings first.');if(writing&&!c.key)fail('Add an OpenAI-compatible API key in Production settings.');if(video&&!c.runwayKey)fail('Add a Runway API key to generate video footage.');return c;}
