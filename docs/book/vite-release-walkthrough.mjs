import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root=path.resolve(process.env.MFE_WALKTHROUGH_ROOT||path.join(path.dirname(fileURLToPath(import.meta.url)),'../..'));
const cold=process.env.MFE_RELEASE_COLD==='1';
const out=path.resolve(process.env.MFE_WALKTHROUGH_OUTPUT||path.join(root,cold?'docs/verification/vite-cold-install/release':'docs/verification/vite-walkthrough/release'));
fs.mkdirSync(out,{recursive:true});
const work=fs.mkdtempSync('/private/tmp/mfe-vite-release-');
const integration=path.join(work,'integration');
const cache=cold?fs.mkdtempSync('/private/tmp/mfe-vite-release-empty-cache-'):process.env.NPM_CACHE||'/private/tmp/mfe-npm-cache';
const cacheBefore=cold?fs.readdirSync(cache):null;
if(cold)assert.deepEqual(cacheBefore,[]);
const online=cold||process.env.READER_ONLINE==='1';
const env={...process.env,npm_config_cache:cache,npm_config_offline:online?'false':'true',npm_config_audit:'false',npm_config_fund:'false',MFE_NPM_CACHE:cache,MFE_OFFLINE:online?'':'1'};
for(const key of ['NODE_PATH','MFE_ARTIFACT_STORE','PORT','npm_config_workspace','npm_config_workspaces'])delete env[key];
if(cold){
 for(const key of Object.keys(env))if(/^npm_config_/i.test(key)||['NPM_TOKEN','NODE_AUTH_TOKEN'].includes(key))delete env[key];
 delete env.NODE_ENV;
 const userconfig=path.join(work,'empty-user.npmrc'),globalconfig=path.join(work,'empty-global.npmrc');
 fs.writeFileSync(userconfig,'');fs.writeFileSync(globalconfig,'');
 Object.assign(env,{npm_config_cache:cache,npm_config_offline:'false',npm_config_audit:'false',npm_config_fund:'false',npm_config_registry:'https://registry.npmjs.org/',npm_config_userconfig:userconfig,npm_config_globalconfig:globalconfig,npm_config_loglevel:'http',npm_config_fetch_retries:'1',npm_config_fetch_timeout:'30000'});
}
const report={status:'running',startedAt:new Date().toISOString(),work,node:process.version,installMode:online?'online':'offline with prepared npm cache',npmCache:cache,scope:'Current working-tree copy, without node_modules, dist, artifact-store or old reports. Documented V6 commands and browser/CLI/admin flows; not a fresh Git clone or the entire product test suite.',commands:[],checks:[],pages:[],findings:[]};
if(cold){report.cacheBefore={path:cache,entries:cacheBefore,verifiedEmpty:true};report.scope='First installation from a new empty npm cache using registry.npmjs.org, fresh project installs and a fresh product store; then B development, build, publication, CLI/UI replacement and rollback. Current source/vendor/dev-kit snapshot, not a fresh Git clone or a Node/Chrome installation test.';}
report.input={sourceRepository:root,sourceRootOverridden:Boolean(process.env.MFE_WALKTHROUGH_ROOT),copiedBeforeExecution:true,outputDirectory:out};
if(process.env.MFE_WALKTHROUGH_ROOT)report.scope='Configured source repository copied without prior installations or outputs, then actual development, publication, CLI/UI activation and rollback. Clone provenance, when applicable, is recorded by the caller; this script preserves the source repository.';
const reportFile=path.join(out,'report.json');
const logFile=path.join(out,'commands.log');fs.writeFileSync(logFile,'');
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function save(){fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');}
function fingerprint(dir){
 const hash=createHash('sha256');let files=0;
 function visit(p){for(const e of fs.readdirSync(p,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  if(['node_modules','.git','.mfe-dev','.DS_Store'].includes(e.name))continue;
  const f=path.join(p,e.name);assert(!e.isSymbolicLink(),f);
  if(e.isDirectory())visit(f);else{hash.update(path.relative(dir,f)).update('\0').update(fs.readFileSync(f)).update('\0');files++;}
 }}visit(dir);return{files,sha256:hash.digest('hex')};
}
const originalProjects=fingerprint(path.join(root,'projects'));
const originalStore=fs.existsSync(path.join(root,'artifact-store'))?fingerprint(path.join(root,'artifact-store')):null;
report.bookSHA256=sha(path.join(root,'docs/mfe-self-study.html'));
report.instructionsSHA256=sha(path.join(root,'docs/book/vite-workflow.html'));
const source=fs.readFileSync(path.join(root,'docs/book/vite-workflow.html'),'utf8');
const releaseSection=source.split('id="vite-release"')[1].split('<section class="chapter current-vite"')[0];
const decode=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
const blocks=[...releaseSection.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)].map(m=>decode(m[1]));
const bindingBlock=blocks.find(x=>x.includes('MFE_DEMO_PREVIOUS='));
const rollbackBlock=blocks.find(x=>x.includes('npm run activate -- --composition'));
assert(bindingBlock&&rollbackBlock,'Documented shell blocks must exist');
report.documentedBlocks={binding:bindingBlock,rollback:rollbackBlock};
async function check(name,fn){const start=Date.now();try{await fn();report.checks.push({name,status:'passed',durationMs:Date.now()-start});console.log('PASS',name);save();}catch(e){report.checks.push({name,status:'failed',error:e.message});save();throw e;}}
function run(command,args,cwd=integration,extra={},expected=0){
 const entry={command,args,cwd,startedAt:new Date().toISOString()};report.commands.push(entry);save();
 console.log('RUN',path.relative(work,cwd),command,args.join(' '));
 fs.appendFileSync(logFile,`\n$ (${cwd}) ${command} ${args.join(' ')}\n`);
 return new Promise((resolve,reject)=>{let output='';const child=spawn(command,args,{cwd,env:{...env,...extra},stdio:['ignore','pipe','pipe'],detached:true});
 const timer=setTimeout(()=>{try{process.kill(-child.pid,'SIGTERM');}catch{}reject(Error('Command timed out: '+command));},600000);
 const append=d=>{output+=d;fs.appendFileSync(logFile,d);};child.stdout.on('data',append);child.stderr.on('data',append);
 child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);entry.exitCode=code;entry.finishedAt=new Date().toISOString();save();code===expected?resolve(output):reject(Error(`${command} exited ${code}: ${output.slice(-5000)}`));});
 });
}
async function stop(child){if(!child||child.exitCode!==null)return;await new Promise(resolve=>{const timer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}resolve();},4000);child.once('exit',()=>{clearTimeout(timer);resolve();});try{process.kill(-child.pid,'SIGTERM');}catch{clearTimeout(timer);resolve();}});}
async function free(port){return new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(port,'127.0.0.1',()=>s.close(()=>resolve(true)));});}
const current=()=>{const pointer=json(path.join(work,'artifact-store/current.json'));return json(path.join(work,'artifact-store/compositions',pointer.compositionId+'.json'));};
const w=(p,id='A')=>p.getByTestId('widget-'+id);
const bFor=(c,id='A')=>c.artifacts[c.runtimeBindings[c.selected[id]].b];
let server,browser,lastPage,devServer;
async function trackedPage(name,url){
 const p=await browser.newPage({viewport:{width:1440,height:1000}});lastPage=p;p.setDefaultTimeout(20000);
 const rec={name,url,remoteEntries:[],compositionRequests:[],apiResponses:[],consoleErrors:[],pageErrors:[],failedRequests:[]};report.pages.push(rec);
 p.on('response',r=>{if(r.url().includes('remoteEntry.js'))rec.remoteEntries.push({url:r.url(),status:r.status()});if(/\/compositions\/.*\.json/.test(r.url()))rec.compositionRequests.push({url:r.url(),status:r.status()});if(r.url().includes('/api/'))rec.apiResponses.push({url:r.url(),status:r.status()});});
 p.on('pageerror',e=>rec.pageErrors.push(e.message));p.on('console',m=>{if(m.type()==='error')rec.consoleErrors.push(m.text());});p.on('requestfailed',r=>rec.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
 await p.goto(url);return{page:p,record:rec};
}
function clean(rec){assert.deepEqual(rec.pageErrors,[],rec.name);assert.deepEqual(rec.consoleErrors,[],rec.name);assert.deepEqual(rec.failedRequests,[],rec.name);}
async function prove(p,c){
 for(const id of ['A','C']){await w(p,id).getByTestId('version').waitFor();assert.equal((await w(p,id).getByTestId('version').innerText()).trim(),bFor(c,id).version);assert.equal((await w(p,id).getByTestId('platform-version').innerText()).trim(),c.platformVersion);}
 const proof=await p.evaluate(()=>({compositionId:window.__MFE_PROOF__.compositionId,identities:window.__MFE_PROOF__.identities(),frozen:Object.isFrozen(window.__MFE_RUNTIME__.registry.runtimeBindings)}));
 assert.equal(proof.compositionId,c.compositionId);assert(proof.frozen);
 for(const identity of proof.identities){assert(identity.reactMatches&&identity.contextMatches);assert.equal(identity.artifactId,bFor(c,identity.instanceId).id);assert.equal(identity.dependencyArtifact,c.runtimeBindings[identity.artifactId].d);}
 return proof;
}
async function state(p,memo,count=2){for(let i=0;i<count;i++)await w(p).getByTestId('increment').click();await w(p).getByTestId('input').fill(memo);await w(p).getByTestId('cache-write').click();}
async function kept(p,memo,count=2){assert.equal(await w(p).getByTestId('count').innerText(),String(count));assert.equal(await w(p).getByTestId('input').inputValue(),memo);await w(p).getByTestId('cache-read').click();assert.equal(await w(p).getByTestId('cache-value').innerText(),memo);}
try{
 await check('현재 소스·vendor·개발 키트를 복사하고 설치·빌드·저장소 결과는 제외',async()=>{
  for(const dir of ['projects','integration']){const base=path.join(root,dir);fs.cpSync(base,path.join(work,dir),{recursive:true,filter:p=>!path.relative(base,p).split(path.sep).some(x=>['node_modules','dist','.mfe-dev','artifact-store','artifacts','.git'].includes(x))});}
  assert(!fs.existsSync(path.join(work,'artifact-store')));assert(!fs.existsSync(path.join(work,'projects/service-b-v1/dist')));
 });
 await check(cold?'빈 npm 캐시에서 integration npm ci → setup 온라인 최초 설치':'학습서 그대로 integration npm ci → setup → build로 빈 저장소 구성',async()=>{
  await run('npm',['ci']);await run('npm',['run','setup']);
  if(cold){
   const log=fs.readFileSync(logFile,'utf8');
   report.networkDownloads=log.split('\n').filter(line=>/http fetch GET 200/.test(line)&&/cache miss/.test(line));
   assert(report.networkDownloads.length>0,'Cold install must show real npm HTTP cache misses');
   report.installedVersions=Object.fromEntries(['vite','@module-federation/vite','react','react-dom'].map(name=>[name,json(path.join(work,'projects/service-b-v1/node_modules',name,'package.json')).version]));
  }
  const require=createRequire(path.join(integration,'package.json'));
  const {chromium}=require('playwright');
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});report.browser=browser.version();
  if(!cold)await run('npm',['run','build']);
  if(!cold){report.baseline=current();assert.equal(report.baseline.dashboard,undefined);assert.deepEqual(report.baseline.navigation||[],[]);}
 });
 if(cold){
  await check('첫 설치한 같은 복사본에서 B 단독 개발·수정·원문 복원',async()=>{
   const b=path.join(work,'projects/service-b-v1');const widget=path.join(b,'src/Widget.jsx');const original=fs.readFileSync(widget,'utf8');
   const devPort=await free(4203)?4203:0;
   devServer=spawn('npm',['run','dev'],{cwd:b,env:{...env,PORT:String(devPort)},stdio:['ignore','pipe','pipe'],detached:true});
   const devURL=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Dev start timed out: '+text)),60000);const capture=d=>{text+=d;fs.appendFileSync(logFile,d);const match=text.match(/Service Dev Host: (http:\/\/127\.0\.0\.1:\d+)\//);if(match){clearTimeout(timer);resolve(match[1]);}};devServer.stdout.on('data',capture);devServer.stderr.on('data',capture);devServer.on('error',reject);});
   report.commands.push({command:'npm',args:['run','dev'],cwd:b,url:devURL});
   const dev=await trackedPage('빈 캐시 설치 후 B 단독 개발',devURL+'/');
   const widgetUI=dev.page.getByTestId('widget-dev-1');await widgetUI.waitFor();
   await widgetUI.getByTestId('increment').click();await widgetUI.getByTestId('input').fill('첫 설치 개발 메모');
   assert(original.includes('<h2>Car Picker</h2>'));fs.writeFileSync(widget,original.replace('<h2>Car Picker</h2>','<h2>Car Picker · Vite 실습</h2>'));
   await widgetUI.getByRole('heading',{name:'Car Picker · Vite 실습',exact:true}).waitFor();
   assert.equal(await widgetUI.getByTestId('count').innerText(),'0');assert.equal(await widgetUI.getByTestId('input').inputValue(),'');
   await dev.page.screenshot({path:path.join(out,'00-cold-development.png')});
   fs.writeFileSync(widget,original);await widgetUI.getByRole('heading',{name:'Car Picker',exact:true}).waitFor();assert.equal(fs.readFileSync(widget,'utf8'),original);clean(dev.record);
   await dev.page.close();await stop(devServer);devServer=null;
  });
  await check('개발 원문 복원 뒤 첫 Vite 전체 빌드·발행·기본 조합 생성',async()=>{
   await run('npm',['run','build']);
   report.baseline=current();assert.equal(report.baseline.dashboard,undefined);assert.deepEqual(report.baseline.navigation||[],[]);
  });
 }
 const baseline=report.baseline;
 const consumerNames=['shell','platform-sdk','service-a','service-c','service-b-v2','service-d-v1','service-d-v2'];
 const consumers=()=>Object.fromEntries(consumerNames.map(name=>[name,fingerprint(path.join(work,'projects',name))]));
 const beforeConsumers=consumers();const baselineArtifacts=fingerprint(path.join(work,'artifact-store/artifacts'));
 const artifactHashes=Object.fromEntries(fs.readdirSync(path.join(work,'artifact-store/artifacts')).map(id=>[id,fingerprint(path.join(work,'artifact-store/artifacts',id))]));
 const port=await free(4173)?4173:0;report.portChoice=port;report.findings.push({kind:'setup',text:'일반 build가 빈 저장소의 기본 A/C 조합을 구성하며 bootstrap은 필요하지 않음'});
 await check('학습서 npm start와 실제 브라우저의 기본 A/C 화면',async()=>{
  server=spawn('npm',['start'],{cwd:integration,env:{...env,PORT:String(port)},stdio:['ignore','pipe','pipe'],detached:true});
  report.baseURL=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Server start timed out: '+output)),60000);const append=d=>{output+=d;fs.appendFileSync(logFile,d);const m=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}};server.stdout.on('data',append);server.stderr.on('data',append);server.on('error',reject);});
  report.commands.push({command:'npm',args:['start'],cwd:integration,port,url:report.baseURL});
 });
 const old=await trackedPage('기존 1.4.0 탭',report.baseURL+'/');
 await check('기본 화면의 SDK·B·D 실제 MF 요청과 공유 React/Context',async()=>{old.record.proof=await prove(old.page,baseline);await state(old.page,'실습 이전 메모');await old.page.screenshot({path:path.join(out,'01-baseline.png')});clean(old.record);});
 let newB;
 await check('B만 제목 수정 → patch 버전 → 빌드 → 발행, 적용 전 조합 유지',async()=>{
  const b=path.join(work,'projects/service-b-v1');const widget=path.join(b,'src/Widget.jsx');let code=fs.readFileSync(widget,'utf8');assert(code.includes('<h2>Car Picker</h2>'));fs.writeFileSync(widget,code.replace('<h2>Car Picker</h2>','<h2>Car Picker · Vite 실습</h2>'));
  await run('npm',['version','patch','--no-git-tag-version'],b);await run('npm',['run','build'],b);await run('npm',['run','publish','--','../projects/service-b-v1']);
  newB=json(path.join(b,'dist/release.json'));report.upgradedB=newB;
  assert.equal(current().compositionId,baseline.compositionId);assert.deepEqual(consumers(),beforeConsumers);
  for(const[id,fp]of Object.entries(artifactHashes))assert.deepEqual(fingerprint(path.join(work,'artifact-store/artifacts',id)),fp);
  await kept(old.page,'실습 이전 메모');
  const unpublishedSelection=await trackedPage('발행 후 적용 전 새 탭',report.baseURL+'/');await prove(unpublishedSelection.page,baseline);clean(unpublishedSelection.record);
 });
 let upgraded;
 await check('학습서 MFE_DEMO 변수와 --bind 두 줄 연결로 실제 활성화',async()=>{
  const output=await run('zsh',['-f','-c',bindingBlock+'\nprintf "\\nWALKTHROUGH_PREVIOUS=%s\\n" "$MFE_DEMO_PREVIOUS"']);
  report.previousCompositionVariable=output.match(/WALKTHROUGH_PREVIOUS=(\S+)/)?.[1];assert.equal(report.previousCompositionVariable,baseline.compositionId);
  upgraded=current();report.upgradedComposition=upgraded;
  assert.equal(bFor(upgraded).id,newB.id);assert.equal(bFor(upgraded,'C').id,bFor(baseline,'C').id);assert.deepEqual(upgraded.selected,baseline.selected);
  assert.equal(upgraded.runtimeBindings[newB.id].d,baseline.runtimeBindings[bFor(baseline).id].d);assert.deepEqual(consumers(),beforeConsumers);
 });
 const fresh=await trackedPage('B 교체 후 새 탭',report.baseURL+'/');
 await check('새 탭만 새 B 제목·버전·실제 URL, 기존 탭 입력과 캐시 유지',async()=>{
  await fresh.page.getByRole('link',{name:'버전 공존 검증'}).click();fresh.record.proof=await prove(fresh.page,upgraded);await w(fresh.page).getByRole('heading',{name:'Car Picker · Vite 실습',exact:true}).waitFor();
  assert(fresh.record.remoteEntries.some(x=>x.url.includes('/'+newB.id+'/')&&x.status===200));await prove(old.page,baseline);await kept(old.page,'실습 이전 메모');await state(fresh.page,'새 버전 메모');
  clean(old.record);clean(fresh.record);await fresh.page.screenshot({path:path.join(out,'02-upgraded.png')});
 });
 await check('허용 범위 밖 B 2.x 선택을 거절하고 현재 조합 보존',async()=>{
  const before=current().compositionId;const output=await run('npm',['run','activate','--','--bind',baseline.selected.A+':b='+bFor(baseline,'C').id],integration,{},1);assert.match(output,/Incompatible runtime dependency/);assert.equal(current().compositionId,before);
 });
 await check('학습서 --composition 롤백 후 새 탭 복원·이미 열린 신버전 탭 유지',async()=>{
  await run('zsh',['-f','-c',rollbackBlock],integration,{MFE_DEMO_PREVIOUS:report.previousCompositionVariable});assert.equal(current().compositionId,baseline.compositionId);
  const rolled=await trackedPage('CLI 롤백 후 새 탭',report.baseURL+'/');rolled.record.proof=await prove(rolled.page,baseline);await w(rolled.page).getByRole('heading',{name:'Car Picker',exact:true}).waitFor();await prove(fresh.page,upgraded);await kept(fresh.page,'새 버전 메모');await kept(old.page,'실습 이전 메모');clean(rolled.record);await rolled.page.screenshot({path:path.join(out,'03-cli-rollback.png')});
 });
 await check('관리 UI에서 A의 B·D 선택 → 검사 → 변경 적용 → 이력 재검사·롤백',async()=>{
  const admin=await trackedPage('관리 UI 변경과 롤백',report.baseURL+'/admin');
  await admin.page.getByTestId('select-b-A').selectOption(newB.id);await admin.page.getByTestId('select-d-A').selectOption(baseline.runtimeBindings[bFor(baseline).id].d);
  await admin.page.getByRole('button',{name:'조합 검사',exact:true}).click();await admin.page.getByTestId('preview-valid').waitFor();assert.equal(current().compositionId,baseline.compositionId);
  await admin.page.getByRole('button',{name:'변경 적용',exact:true}).click();await admin.page.getByTestId('current-b-A').filter({hasText:newB.version}).waitFor();assert.equal(bFor(current()).id,newB.id);
  await admin.page.screenshot({path:path.join(out,'04-admin-applied.png')});
  await admin.page.getByTestId('history-'+baseline.compositionId).getByRole('button',{name:'불러오기',exact:true}).click();await admin.page.getByRole('button',{name:'조합 검사',exact:true}).click();await admin.page.getByTestId('preview-valid').waitFor();
  await admin.page.getByRole('button',{name:'이 조합으로 롤백',exact:true}).click();await admin.page.getByTestId('current-b-A').filter({hasText:bFor(baseline).version}).waitFor();assert.equal(current().compositionId,baseline.compositionId);clean(admin.record);
  report.adminApiEvidence=admin.record.apiResponses;
 });
 await check('다른 서비스 소스·산출물과 발행한 구버전 파일 보존',async()=>{assert.deepEqual(consumers(),beforeConsumers);for(const[id,fp]of Object.entries(artifactHashes))assert.deepEqual(fingerprint(path.join(work,'artifact-store/artifacts',id)),fp);report.consumerFingerprints=beforeConsumers;report.baselineArtifactFingerprint=baselineArtifacts;});
 report.status='passed';
}catch(e){report.status='failed';report.error=e.stack;console.error(e);process.exitCode=1;if(lastPage&&!lastPage.isClosed())await lastPage.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}
finally{
 await browser?.close();await stop(devServer);await stop(server);
 try{assert.deepEqual(fingerprint(path.join(root,'projects')),originalProjects);const after=fs.existsSync(path.join(root,'artifact-store'))?fingerprint(path.join(root,'artifact-store')):null;assert.deepEqual(after,originalStore);report.originalPreserved=true;}catch(e){report.status='failed';report.originalPreserved=false;report.preservationError=e.message;process.exitCode=1;}
 if(cold){report.cacheAfterEntries=fs.readdirSync(cache);report.cacheWasReusedFromPriorRun=false;}
 report.originalProjects=originalProjects;report.finishedAt=new Date().toISOString();save();console.log('RESULT',report.status,report.checks.length,reportFile);
}
