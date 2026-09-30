import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
try {process.loadEnvFile('.env.local');} catch(error) {if(error.code!=='ENOENT')throw error;}
const commands=[['web',[resolve('apps/web/node_modules/next/dist/bin/next'),'dev','-H','127.0.0.1','-p',process.env.PORT||'3100'],resolve('apps/web')],['worker',['scripts/worker.mjs'],process.cwd()]];
const children=commands.map(([name,args,cwd])=>{const child=spawn(process.execPath,args,{cwd,windowsHide:true,env:{...process.env,MOTION_DATA_DIR:process.env.MOTION_DATA_DIR||resolve('data/motion-os'),NEXT_TELEMETRY_DISABLED:'1'}});for(const stream of [child.stdout,child.stderr])stream.on('data',data=>process.stdout.write(`[${name}] ${data}`));child.on('error',error=>console.error(`${name}: ${error.message}`));return child;});
function stop(){for(const child of children)child.kill();}
process.on('SIGINT',()=>{stop();process.exit(0);});process.on('SIGTERM',()=>{stop();process.exit(0);});
children.forEach(child=>child.on('exit',code=>{if(code){stop();process.exitCode=code;}}));
