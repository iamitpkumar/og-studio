import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const result=spawnSync(process.execPath,[resolve('apps/web/node_modules/next/dist/bin/next'),'build'],{cwd:resolve('apps/web'),stdio:'inherit',windowsHide:true,env:{...process.env,MOTION_BUILD_OUTPUT:'.next-production',NEXT_TELEMETRY_DISABLED:'1'}});process.exit(result.status??1);
