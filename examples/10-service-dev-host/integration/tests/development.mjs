import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(root, 'integration/artifacts/verification');
fs.mkdirSync(output, { recursive: true });
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'mfe-development-'));
const report = { status: 'running', startedAt: new Date().toISOString(), scope: 'Isolated UI service copies with offline npm installs and published MF dev kits; no product host or remote service processes required.', checks: [] };
const processes = [];
let browser;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function tree(directory) {
  const hash = createHash('sha256');
  function visit(relative='') { for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name))) {
    if (['node_modules','.mfe-dev'].includes(entry.name)) continue;
    const file = path.join(relative, entry.name);
    if (entry.isDirectory()) visit(file); else hash.update(file).update(fs.readFileSync(path.join(directory, file)));
  }} visit(); return hash.digest('hex');
}
const original = Object.fromEntries(['service-a','service-c','service-b-v1','service-b-v2'].map(name=>[name,tree(path.join(root,'projects',name))]));
const pointer = fs.readFileSync(path.join(root,'artifact-store/current.json'),'utf8');
async function check(name, action) { const start=Date.now(); try { const detail=await action(); report.checks.push({name,status:'passed',durationMs:Date.now()-start,detail}); console.log('PASS',name); } catch(error) { report.checks.push({name,status:'failed',error:error.message}); throw error; } }
async function run(command,args,cwd) { await new Promise((resolve,reject)=>{let log='';const child=spawn(command,args,{cwd,env:process.env,stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(log)));}); }
async function start(directory,port) { const process=spawn('npm',['run','dev'],{cwd:directory,env:{...globalThis.process.env,PORT:String(port)},stdio:['ignore','pipe','pipe'],detached:true}); processes.push(process);let log=''; await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(log||'Dev start timed out')),45000);process.on('error',e=>{clearTimeout(timer);reject(e)});process.on('exit',code=>{clearTimeout(timer);reject(new Error(`Dev exit ${code}: ${log}`))});const collect=bytes=>{log+=bytes;if(log.includes('Service Dev Host:')){clearTimeout(timer);resolve();}};process.stdout.on('data',collect);process.stderr.on('data',collect);}); return log.match(/Service Dev Host: (http:\/\/127\.0\.0\.1:\d+)/)[1]; }
async function stop(child) { if(child.exitCode!==null || child.signalCode!==null)return;await new Promise(resolve=>{child.once('exit',resolve);try { process.kill(-child.pid,'SIGTERM'); } catch(error) { if(error.code==='ESRCH')resolve();else throw error; }}); }
const copies={};
try {
 await check('four service repositories install offline without sibling sources',async()=>{
  for(const name of Object.keys(original)) { const dir=path.join(temporary,name,'only-project'); fs.cpSync(path.join(root,'projects',name),dir,{recursive:true,filter:file=>!['node_modules','dist','.mfe-dev'].includes(path.basename(file))});copies[name]=dir;await run('npm',['ci','--offline','--ignore-scripts','--no-audit','--no-fund','--cache',process.env.NPM_CACHE||process.env.npm_config_cache||path.join(os.homedir(),'.npm')],dir);assert.deepEqual(fs.readdirSync(path.dirname(dir)),['only-project']); }
 });
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 let bPage,bContext,bURL;
 await check('A, C, B 1.x and B 2.x each boot alone with actual MF SDK and dependencies',async()=>{
  const results=[];let port=4301;
  for(const [name,dir] of Object.entries(copies)){
   const url=await start(dir,0);const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const requests=[],errors=[];
   await page.route('**/*',route=>{const request=route.request();requests.push(request.url());if(!request.url().startsWith(url+'/'))return route.abort();return route.continue();});page.on('pageerror',error=>errors.push(error.message));
   await page.goto(url);await page.getByTestId('widget-dev-1').waitFor({timeout:20000});
   const proof=await page.evaluate(()=>({registry:__MFE_DEV__.registry,react:__MFE_DEV__.sdkReactMatches,diagnostics:__MFE_DEV__.getDiagnostics()}));
   assert.ok(proof.react);assert.equal(proof.registry.platformVersion, JSON.parse(fs.readFileSync(path.join(root,'projects/platform-sdk/dist/release.json'),'utf8')).version);assert.equal(await page.locator('[data-dev-layout]').count(),1);assert.equal(await page.locator('[data-page-container]').count(),1);
   assert.equal(await page.getByTestId('platform-user').textContent(),'서비스 개발자');
   const sdk=proof.registry.artifacts.platform;assert.ok(requests.some(u=>u===url+sdk.entry));
   const service=new URL(sdk.entry,url);const response=await context.request.get(service.href);assert.equal(sha(await response.body()),JSON.parse(fs.readFileSync(path.join(dir,'dev/manifest.json'),'utf8')).files[sdk.id]['remoteEntry.js']);
   assert.ok(proof.diagnostics.loadedContainerIds.includes(sdk.id));
   assert.ok(requests.every(u=>u.startsWith(url+'/')));assert.deepEqual(errors,[]);
   const hostFiles=fs.readdirSync(path.join(dir,'.mfe-dev/host')).filter(f=>f.endsWith('.js'));assert.ok(hostFiles.every(f=>!fs.readFileSync(path.join(dir,'.mfe-dev/host',f),'utf8').includes('function DevLayout')));
   results.push({name,local:proof.registry.local.id,sdk:sdk.id,containers:proof.diagnostics.loadedContainerIds});
   if(name==='service-b-v1'){bPage=page;bContext=context;bURL=url;}else{await context.close();await stop(processes.at(-1));}
  }return results;
 });
 await check('SDK mock user/theme, duplicated state/cache/portal and unmount cleanup',async()=>{
  await bPage.getByLabel('개발 테마').selectOption('dark');assert.equal(await bPage.locator('[data-dev-layout]').getAttribute('data-theme'),'dark');
  await bPage.getByRole('button',{name:'인스턴스 복제',exact:true}).click();const first=bPage.getByTestId('widget-dev-1'),second=bPage.getByTestId('widget-dev-2');await second.waitFor();await first.getByTestId('increment').click();assert.equal(await first.getByTestId('count').textContent(),'1');assert.equal(await second.getByTestId('count').textContent(),'0');
  await first.getByTestId('input').fill('local-only');await first.getByTestId('cache-write').click();await second.getByTestId('cache-read').click();assert.equal(await second.getByTestId('cache-value').textContent(),'');
  await second.getByTestId('open-popup').click();await bPage.getByTestId('popup-dev-2').waitFor();await bPage.getByRole('button',{name:'복제 제거',exact:true}).click();assert.equal(await bPage.getByTestId('popup-dev-2').count(),0);await bPage.waitForFunction(()=>__MFE_DEV__.getSnapshot().activeSubscriptions===1);
  await bPage.getByRole('button',{name:'다시 마운트',exact:true}).click();assert.equal(await first.getByTestId('count').textContent(),'0');assert.equal(await first.getByTestId('cache-value').textContent(),'');
  await bPage.getByLabel('개발 테마').selectOption('light');await bPage.screenshot({path:path.join(output,'development-desktop.png')});
 });
 await check('source saving rebuilds only the local service and reloads the browser',async()=>{
  const dir=copies['service-b-v1'],file=path.join(dir,'src/Widget.jsx');const source=fs.readFileSync(file,'utf8');const previous=await bPage.evaluate(()=>__MFE_DEV__.registry.local.id);const remoteBefore=tree(path.join(dir,'dev'));
  fs.writeFileSync(file,source.replace('Car Picker','Car Picker — 저장 반영'));await bPage.getByRole('heading',{name:'Car Picker — 저장 반영',exact:true}).waitFor({timeout:20000});assert.notEqual(await bPage.evaluate(()=>__MFE_DEV__.registry.local.id),previous);assert.equal(tree(path.join(dir,'dev')),remoteBefore);assert.ok(!fs.existsSync(path.join(dir,'dist')));
 });
 await check('compile errors preserve the last working screen and recover on the next save',async()=>{
  const file=path.join(copies['service-b-v1'],'src/Widget.jsx');const source=fs.readFileSync(file,'utf8');const id=await bPage.evaluate(()=>__MFE_DEV__.registry.local.id);
  await bPage.getByTestId('widget-dev-1').getByTestId('input').fill('유지되는 입력');fs.writeFileSync(file,source+'\nexport !!! invalid syntax');await bPage.locator('#build-status').waitFor({state:'visible',timeout:15000});assert.equal(await bPage.evaluate(()=>__MFE_DEV__.registry.local.id),id);assert.equal(await bPage.getByTestId('input').inputValue(),'유지되는 입력');
  fs.writeFileSync(file,source.replace('저장 반영','오류 복구'));await bPage.getByRole('heading',{name:'Car Picker — 오류 복구',exact:true}).waitFor({timeout:20000});assert.equal(await bPage.locator('#build-status').isVisible(),false);
 });
 await check('service code can import PageContainer from the same MF SDK',async()=>{
  const dir=copies['service-b-v1'],file=path.join(dir,'src/Widget.jsx');let source=fs.readFileSync(file,'utf8');source=source.replace('PlatformContext, WidgetBoundary','PageContainer, PlatformContext, WidgetBoundary').replace('return <WidgetBoundary instanceId=', 'return <PageContainer title="서비스가 사용하는 PageContainer"><WidgetBoundary instanceId=').replace('</WidgetBoundary>;','</WidgetBoundary></PageContainer>;');
  const config=JSON.parse(fs.readFileSync(path.join(dir,'mf.dev.json'),'utf8'));config.pageContainer=false;fs.writeFileSync(path.join(dir,'mf.dev.json'),JSON.stringify(config));
  const deps=JSON.parse(fs.readFileSync(path.join(dir,'mf.dependencies.json'),'utf8'));deps.platform.requires='>=1.2.0 <2.0.0';fs.writeFileSync(path.join(dir,'mf.dependencies.json'),JSON.stringify(deps));fs.writeFileSync(file,source);
  await bPage.getByRole('heading',{name:'서비스가 사용하는 PageContainer',exact:true}).waitFor({timeout:20000});assert.equal(await bPage.locator('[data-page-container]').count(),1);assert.ok(await bPage.evaluate(()=>__MFE_DEV__.sdkReactMatches));
 });
 await check('development manifest rejects incompatible SDK/React, missing targets and cycles',async()=>{
  const dir=copies['service-b-v1'];const {readDevKit,createDevSnapshot}=require(path.join(dir,'node_modules/@mfe/platform-build-tools/lib/dev-manifest.cjs'));const kit=readDevKit(dir);const local=await bPage.evaluate(()=>__MFE_DEV__.registry.local);
  const invalidSdk=structuredClone(kit);invalidSdk.manifest.artifacts[kit.manifest.platform].version='1.1.0';assert.throws(()=>createDevSnapshot(invalidSdk,local),/SDK/);
  const invalidReact=structuredClone(local);invalidReact.runtimeRequirements.react='18.0.0';assert.throws(()=>createDevSnapshot(kit,invalidReact),/react/);
  const missing=structuredClone(kit);missing.manifest.localBindings={};assert.throws(()=>createDevSnapshot(missing,local),/dependency/);
  const cyclic=structuredClone(kit);cyclic.manifest.artifacts[kit.manifest.localBindings.d].dependencies={loop:local.id};assert.throws(()=>createDevSnapshot(cyclic,local),/cycle/);
  const outOfRange=structuredClone(local);outOfRange.runtimeDependencies.d.requires='>=9.0.0';assert.throws(()=>createDevSnapshot(kit,outOfRange),/dependency/);
 });
 await check('missing or tampered remote bytes are rejected; private project files are not served',async()=>{
  const dir=copies['service-a'];const manifest=JSON.parse(fs.readFileSync(path.join(dir,'dev/manifest.json'),'utf8'));const file=path.join(dir,'dev/remotes',manifest.platform,'remoteEntry.js');const saved=fs.readFileSync(file);const {readDevKit}=require(path.join(dir,'node_modules/@mfe/platform-build-tools/lib/dev-manifest.cjs'));
  fs.appendFileSync(file,'\n// tampered');assert.throws(()=>readDevKit(dir),/checksum/);fs.unlinkSync(file);assert.throws(()=>readDevKit(dir),/Invalid development file/);fs.writeFileSync(file,saved);
  for(const pathname of ['/src/Widget.jsx','/package.json','/mf.dev.json','/.mfe-dev/host/host.js'])assert.equal((await bContext.request.get(bURL+pathname)).status(),404);
 });
 await check('mobile layout, page landmarks and production output exclusion',async()=>{
  await bPage.setViewportSize({width:390,height:844});assert.ok(await bPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await bPage.getByRole('main').count(),1);await bPage.screenshot({path:path.join(output,'development-mobile.png')});
  const dir=copies['service-b-v1'];await run('npm',['run','build'],dir);for(const file of fs.readdirSync(path.join(dir,'dist')).filter(f=>f.endsWith('.js'))){const text=fs.readFileSync(path.join(dir,'dist',file),'utf8');assert.ok(!text.includes('LOCAL WORKSPACE'));assert.ok(!text.includes('new EventSource'));}
 });
 await check('original service projects and active production composition remain unchanged',async()=>{for(const [name,hash]of Object.entries(original))assert.equal(tree(path.join(root,'projects',name)),hash);assert.equal(fs.readFileSync(path.join(root,'artifact-store/current.json'),'utf8'),pointer);});
 report.status='passed';
} catch(error) { report.status='failed';report.error=error.stack;console.error(error);process.exitCode=1; }
finally { if(browser)await browser.close();for(const child of processes)await stop(child);fs.writeFileSync(path.join(output,'development.json'),JSON.stringify(report,null,2)+'\n');fs.rmSync(temporary,{recursive:true,force:true}); }
