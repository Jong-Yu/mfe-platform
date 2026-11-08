import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url)),require=createRequire(import.meta.url);
const {chromium}=createRequire(path.join(root,'integration/package.json'))('playwright');
const config=require('./example.json'),n=config.number,report={example:config.id,checks:[],status:'running',startedAt:new Date().toISOString(),scope:'실제 Chrome·HTTP·MF. 임시 저장소만 변경. 소스/배포 고정은 별도의 pins 명령으로 확인.'};
const output=path.join(root,'verification');fs.mkdirSync(output,{recursive:true});
const before=require('./pins.cjs').inventory();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mfe-'+config.id+'-'));
process.env.MFE_ARTIFACT_STORE=path.join(temp,'store');fs.cpSync(path.join(root,'seed-store'),process.env.MFE_ARTIFACT_STORE,{recursive:true});
const {select,plan,release}=require('./run.cjs'),store=require('./integration/tools/store.cjs');
let server,browser,lastPage;const errors=[];
async function check(name,action){try{await action();report.checks.push({name,status:'passed'});console.log('PASS '+name);}catch(e){report.checks.push({name,status:'failed',error:e.message});throw e;}}
async function start(){server=spawn(process.execPath,['tools/serve.cjs'],{cwd:path.join(root,'integration'),env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error(log||'start timeout')),15000);server.on('error',reject);server.stderr.on('data',x=>log+=x);server.stdout.on('data',x=>{log+=x;const m=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});});}
const w=(p,id='A')=>p.getByTestId('widget-'+id);
async function waitText(locator,expected){await locator.waitFor();await locator.page().waitForFunction(({id,text})=>Array.from(document.querySelectorAll('[data-testid]')).some(e=>e.dataset.testid===id&&e.textContent.trim()===text),{id:await locator.getAttribute('data-testid'),text:expected});assert.equal((await locator.innerText()).trim(),expected);}
async function alive(p,id='A'){await w(p,id).waitFor();assert.equal(await w(p,id).getByTestId('count').innerText(),'0');}
async function exercise(p,id='A'){await w(p,id).getByTestId('increment').click();await w(p,id).getByTestId('input').fill('keep-'+id);await w(p,id).getByTestId('cache-write').click();}
async function kept(p,id='A'){assert.equal(await w(p,id).getByTestId('count').innerText(),'1');assert.equal(await w(p,id).getByTestId('input').inputValue(),'keep-'+id);assert.equal(await w(p,id).getByTestId('cache-value').innerText(),'keep-'+id);}
try{
 const baseline=select('baseline'),url=await start();
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE_PATH||(fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined)});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 async function open(suffix='/?empty=1'){const p=await context.newPage();lastPage=p;p.on('pageerror',e=>errors.push(e.message));await p.goto(url+suffix);return p;}
 const initial=await open();
 await check('자체 저장소에서 Shell·SDK를 MF로 로드',async()=>{await initial.waitForFunction(()=>window.__MFE_PROOF__);assert.equal(await initial.evaluate(()=>__MFE_RUNTIME__.registry.compositionId),baseline.compositionId);});
 if(n!==19){
 await check('B 1.4와 B 2.1의 상태·CSS·공통 React 격리',async()=>{
  await initial.getByTestId('add-a').click();await alive(initial);
  if(n>=12&&n<=17)await alive(initial,'A--c');else{await initial.getByTestId('add-c').click();await alive(initial,'C');}
  const other=n>=12&&n<=17?'A--c':'C';
  assert.equal(await w(initial).getByTestId('version').innerText(),'1.4.0');assert.equal(await w(initial,other).getByTestId('version').innerText(),'2.1.0');
  await exercise(initial);assert.equal(await w(initial,other).getByTestId('count').innerText(),'0');assert.equal(await w(initial,other).getByTestId('input').inputValue(),'');
  assert.notEqual(await w(initial).getAttribute('class'),await w(initial,other).getAttribute('class'));
  const identities=await initial.evaluate(()=>__MFE_PROOF__.identities());assert(identities.length>0&&identities.every(x=>x.reactMatches&&x.contextMatches));
  await initial.getByTestId('add-a-copy').click();await alive(initial,'A-copy');await kept(initial);
  await initial.getByTestId('emit-event').click();assert.equal(await w(initial).getByTestId('event-count').innerText(),'1');
  await w(initial).getByTestId('open-popup').click();await initial.getByTestId('popup-A').waitFor();assert.equal(await initial.locator('[data-portal-scope="A"] [role="dialog"]').count(),1);await initial.getByTestId('popup-A').getByTestId('close-popup').click();
 });
 }
 if([2,3,4].includes(n))await check('소비자 재빌드 없이 버전 교체·기존 탭 유지·롤백',async()=>{
  const next=select('upgraded'),fresh=await open();await fresh.getByTestId('add-a').click();await alive(fresh);await fresh.getByTestId('add-c').click();await alive(fresh,'C');
  const expected=n===2?'1.4.0':n===3?'1.5.0':'D 1.1.0';const field=n===2?'platform-version':n===3?'version':'dependency';assert((await w(fresh).getByTestId(field).innerText()).includes(expected));
  assert.equal(await initial.evaluate(()=>__MFE_RUNTIME__.registry.compositionId),baseline.compositionId);await kept(initial);assert.notEqual(next.compositionId,baseline.compositionId);
  assert.equal(select('baseline').compositionId,baseline.compositionId);
  const rolled=await open();await rolled.getByTestId('add-a').click();await alive(rolled);assert.equal(await w(rolled).getByTestId('version').innerText(),'1.4.0');
 });
 if(n>=13&&n<=17){
  const targets=n===13||n===14?['service-c','service-b-v2']:['service-c','service-b-v2','service-d-v2'];
  for(const target of targets)await check(target+' 실제 503 오류 격리'+(n===13?'':'·새로고침 없는 복구'),async()=>{
   const p=await context.newPage();lastPage=p;p.on('pageerror',e=>errors.push(e.message));const fail=url+release(target).entry;
   await p.route(fail,r=>r.fulfill({status:503,body:'deliberate outage'}));await p.goto(url+'/?empty=1');await p.getByTestId('add-a').click();await p.getByTestId('remote-error-A--c').waitFor();await alive(p);await exercise(p);const element=await w(p).elementHandle();await p.evaluate(()=>window.__stay='same-document');
   if(n===13){assert.equal(await p.getByTestId('retry-A--c').count(),0);await kept(p);await p.close();return;}
   await p.unroute(fail);await p.getByTestId('retry-A--c').click();await alive(p,'A--c');await kept(p);assert(await element.evaluate(e=>e.isConnected));assert.equal(await p.evaluate(()=>window.__stay),'same-document');await p.close();
  });
 }
 if(n===17)await check('SDK 1.3.0과 1.3.1의 재시도 횟수 차이·기존 탭 유지',async()=>{
  async function failing(){const p=await context.newPage();lastPage=p;let attempts=0;const endpoint=url+release('service-c').entry;await p.route(endpoint,r=>{attempts++;return r.fulfill({status:503,body:'temporary failure'});});await p.goto(url+'/?empty=1');await p.getByTestId('add-a').click();await p.getByTestId('remote-error-A--c').waitFor();return{p,get:()=>attempts,endpoint};}
  select('baseline');const old=await failing();select('upgraded');const fresh=await failing();
  for(const [s,count] of [[old,1],[fresh,2]]){const before=s.get();await s.p.getByTestId('retry-A--c').click();await s.p.getByTestId('remote-loading-A--c').waitFor();await s.p.getByTestId('remote-error-A--c').waitFor();assert.equal(s.get()-before,count);await s.p.unroute(s.endpoint);await s.p.getByTestId('retry-A--c').click();await alive(s.p,'A--c');}
  assert.equal(await w(old.p).getByTestId('platform-version').innerText(),'1.3.0');assert.equal(await w(fresh.p).getByTestId('platform-version').innerText(),'1.3.1');select('baseline');
 });
 if(n===11)await check('독립 E 프로젝트 배포가 고정 Shell 슬롯에서 동작',async()=>{await initial.getByTestId('service-e-E').waitFor();await initial.getByTestId('e-increment').click();assert.equal(await initial.getByTestId('e-count').innerText(),'1');});
 if(n===18||n===19){
  await check('관리 화면 등록·검사·적용 후 Shell 재빌드 없이 반영',async()=>{
   const admin=await open('/admin'),profile=plan(n===18?'registered':'dashboard');
   if(n===18){
    await admin.getByTestId('add-service-menu').click();const menu=profile.navigation[0];
    for(const [field,value] of Object.entries({id:menu.id,label:menu.label,path:menu.path,module:menu.exposedModule}))await admin.getByTestId('menu-'+field+'-0').fill(value);
    await admin.getByTestId('menu-artifact-0').selectOption(menu.artifactId);
   }else{
    for(const [i,item] of profile.dashboard.entries()){
     await admin.getByTestId('add-dashboard-widget').click();for(const [field,value] of Object.entries({artifact:item.artifactId,widget:item.widgetId,span:String(item.span)}))await admin.getByTestId(`dashboard-${field}-${i}`).selectOption(value);
     await admin.getByTestId(`dashboard-id-${i}`).fill(item.id);await admin.getByTestId(`dashboard-title-${i}`).fill(item.title);
     const deps=admin.getByTestId(`dashboard-row-${i}`).locator('.menu-dependency select');if(await deps.count()){const owner=store.read('catalog.json')[item.artifactId];for(let j=0;j<await deps.count();j++)await deps.nth(j).selectOption(release(owner.version.startsWith('1')?'service-d-v1':'service-d-v2').id);}
    }
   }
   await admin.getByTestId('preview').click();await admin.getByTestId('preview-valid').waitFor();await admin.getByTestId('apply').click();await admin.getByTestId('admin-notice').filter({hasText:'조합을 적용했습니다'}).waitFor();assert.equal(store.current().selected.shell,baseline.selected.shell);
   const p=await open(n===18?'/?empty=1':'/');
   if(n===18){await p.getByTestId('menu-link-notifications').click();await p.getByTestId('service-e-menu-notifications').waitFor();await p.getByTestId('e-input').fill('keep-E');await p.locator('a[href="#/"]').click();await p.getByTestId('menu-link-notifications').click();assert.equal(await p.getByTestId('e-input').inputValue(),'keep-E');assert.equal(await initial.getByTestId('menu-link-notifications').count(),0);}
   else{
    for(const id of ['b14','b14-copy','b21'])await alive(p,'dashboard-'+id);await exercise(p,'dashboard-b14');assert.equal(await w(p,'dashboard-b14-copy').getByTestId('count').innerText(),'0');await p.getByTestId('service-e-dashboard-notifications').waitFor();assert.equal(await p.locator('[data-testid^="dashboard-tile-"]').count(),5);assert.equal(await initial.locator('[data-testid^="dashboard-tile-"]').count(),0);
    await admin.getByTestId('dashboard-up-1').click();await admin.getByTestId('preview').click();await admin.getByTestId('preview-valid').waitFor();await admin.getByTestId('apply').click();await admin.getByTestId('admin-notice').filter({hasText:'조합を適用しました|조합을 적용했습니다'}).waitFor();
    const reordered=await open('/');await reordered.getByTestId('dashboard-tile-b14-copy').waitFor();assert.equal(await reordered.locator('[data-testid^="dashboard-tile-"]').first().getAttribute('data-testid'),'dashboard-tile-b14-copy');await kept(p,'dashboard-b14');
   }
   await admin.screenshot({path:path.join(output,'admin.png'),fullPage:true});await p.screenshot({path:path.join(output,'screen.png'),fullPage:true});
  });
 }
 if(n!==19)await initial.screenshot({path:path.join(output,'screen.png'),fullPage:true});
 await check('예제 밖 요청·예상하지 않은 브라우저 예외 없음',async()=>{assert.deepEqual(errors,[]);for(const p of context.pages()){const external=await p.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(u=>/^https?:/.test(u)&&new URL(u).origin!==location.origin));assert.deepEqual(external,[]);}});
 await check('서비스 소스·번들·초기 설정을 변경하지 않음',async()=>assert.deepEqual(require('./pins.cjs').inventory(),before));
 report.status='passed';
}catch(e){report.status='failed';report.error=e.stack;process.exitCode=1;console.error(e);await lastPage?.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});}
finally{await browser?.close();if(server&&server.exitCode===null)await new Promise(resolve=>{const t=setTimeout(()=>{server.kill('SIGKILL');resolve();},3000);server.once('exit',()=>{clearTimeout(t);resolve();});server.kill('SIGTERM');});fs.rmSync(temp,{recursive:true,force:true});report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(config.id+': '+report.status+' '+report.checks.filter(x=>x.status==='passed').length+'/'+report.checks.length);}
