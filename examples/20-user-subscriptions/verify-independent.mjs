import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url)),require=createRequire(import.meta.url);
const output=path.join(root,'verification');fs.mkdirSync(output,{recursive:true});
const report={example:'20-user-subscriptions',status:'running',checks:[],startedAt:new Date().toISOString()};
const before=require('./pins.cjs').inventory();
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'mfe-user-subscriptions-isolated-')),destination=path.join(temporary,'example');
const logfile=fs.openSync(path.join(output,'independence.log'),'w');
const env={...process.env,NODE_PATH:'',MFE_OFFLINE:'1',npm_config_cache:process.env.NPM_CACHE||process.env.npm_config_cache||path.join(os.homedir(),'.npm')};
async function run(args,cwd=destination){await new Promise((resolve,reject)=>{const child=spawn(args[0],args.slice(1),{cwd,env,stdio:['ignore',logfile,logfile]});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(args.join(' ')+' failed; see verification/independence.log')));});}
try{
  fs.cpSync(root,destination,{recursive:true,filter:file=>{
    const relative=path.relative(root,file);return !relative.split(path.sep).some(p=>['node_modules','artifact-store','verification','.mfe-dev'].includes(p))&&!relative.startsWith('integration/artifacts');
  }});
  await run(['npm','ci','--offline','--ignore-scripts','--no-audit','--no-fund'],path.join(destination,'integration'));
  await run([process.execPath,'run.cjs','pins']);report.checks.push('폴더 이동 후 자체 설치와 고정 파일 일치');
  await run([process.execPath,'run.cjs','test']);report.checks.push('다른 위치에서 사용자별 구독 전체 브라우저 검증 통과');
  await run([process.execPath,'run.cjs','setup']);
  await run([process.execPath,'run.cjs','build']);
  await run([process.execPath,'run.cjs','select','baseline']);
  const json=f=>JSON.parse(fs.readFileSync(path.join(destination,f)));
  assert.deepEqual(json('artifact-store/current.json'),json('seed-store/current.json'));
  await run([process.execPath,'run.cjs','pins']);report.checks.push('전체 서비스 소스 재빌드 후 파일 해시와 조합 ID 일치');
  assert.deepEqual(require('./pins.cjs').inventory(),before);report.checks.push('원본 예제 소스·설정·초기 배포물 유지');
  report.status='passed';
}catch(e){report.status='failed';report.error=e.stack;process.exitCode=1;console.error(e);}
finally{fs.closeSync(logfile);fs.rmSync(temporary,{recursive:true,force:true});report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(output,'independence.json'),JSON.stringify(report,null,2)+'\n');console.log('20-user-subscriptions independence: '+report.status);}
