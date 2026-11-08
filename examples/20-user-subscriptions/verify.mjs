import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url)),require=createRequire(import.meta.url);
const {chromium}=createRequire(path.join(root,'integration/package.json'))('playwright');
const output=path.join(root,'verification');fs.mkdirSync(output,{recursive:true});
const report={example:'20-user-subscriptions',status:'running',startedAt:new Date().toISOString(),checks:[],consumerBuildsExecuted:0,
  scope:'Real Chrome contexts and MF requests. Persistent subscriptions and actual file deletion in a disposable store; past metadata simulates notice/retention periods.'};
const before=require('./pins.cjs').inventory(),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'mfe-subscriptions-'));
process.env.MFE_ARTIFACT_STORE=path.join(temporary,'store');fs.cpSync(path.join(root,'seed-store'),process.env.MFE_ARTIFACT_STORE,{recursive:true});
const store=require('./integration/tools/store.cjs'),{release,select}=require('./run.cjs');
const b14=release('service-b-v1'),b15=release('service-b-v1-next'),b21=release('service-b-v2'),d10=release('service-d-v1');
const targets=[b14.id,d10.id],options=store.read('subscription-options.json').bases,modern=options[0].compositionId,previous=options[1].compositionId;
let browser,server,url,lastPage,adminToken;const products=[],errors=[];
async function check(name,work){try{await work();report.checks.push({name,status:'passed'});console.log('PASS '+name);}catch(e){report.checks.push({name,status:'failed',error:e.message});throw e;}}
async function start(port=0){server=spawn(process.execPath,['tools/serve.cjs'],{cwd:path.join(root,'integration'),env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error(log||'Server timeout')),10000);server.on('error',reject);server.stderr.on('data',c=>log+=c);server.stdout.on('data',c=>{log+=c;const m=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});});}
async function stop(){if(server?.exitCode===null)await new Promise(resolve=>{const t=setTimeout(()=>{server.kill('SIGKILL');resolve();},3000);server.once('exit',()=>{clearTimeout(t);resolve();});server.kill('SIGTERM');});}
async function eventually(action){const end=Date.now()+10000;while(true){try{return await action();}catch(e){if(Date.now()>end)throw e;await new Promise(r=>setTimeout(r,80));}}}
async function context(){const c=await browser.newContext({viewport:{width:1440,height:1000}});c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));return c;}
async function open(c,pathname='/subscriptions'){const p=await c.newPage();lastPage=p;await p.goto(url+pathname);return p;}
async function login(c,id){const p=await open(c);await p.getByTestId('demo-user').selectOption(id);await p.getByTestId('login').click();await p.getByTestId('saved-user').filter({hasText:id[0].toUpperCase()+id.slice(1)}).waitFor();return p;}
async function state(c){const r=await c.request.get(url+'/api/subscriptions/state');assert.equal(r.status(),200);return r.json();}
async function post(c,endpoint,input,token){const s=token===undefined?await state(c):null;const r=await c.request.post(url+'/api/subscriptions/'+endpoint,{headers:{Origin:url,'Content-Type':'application/json','X-MFE-CSRF':token??s.csrfToken},data:input});return{status:r.status(),body:await r.json()};}
async function saveUI(p,ids,base=modern){
 const loaded=p.waitForResponse(r=>r.url().endsWith('/api/subscriptions/state'));await p.getByTestId('reload-subscription').click();await loaded;
 await p.waitForFunction(()=>!document.querySelector('[data-testid=reload-subscription]').disabled);await p.getByTestId('subscription-base').selectOption(base);
 while(await p.locator('[data-testid^="subscription-row-"]').count())await p.getByTestId('remove-subscription-widget-0').click();
 for(const [i,a] of ids.entries()){await p.getByTestId('add-subscription-widget').click();await p.getByTestId('subscription-widget-'+i).selectOption(a.id+'|car-picker');}
 await p.getByTestId('preview-subscription').click();await p.getByTestId('subscription-preview').waitFor();await p.getByTestId('save-subscription').click();await p.getByTestId('subscription-notice').filter({hasText:'저장했습니다'}).waitFor();return(await state(p.context())).subscription;
}
const widget=(p,index=1)=>p.getByTestId('widget-dashboard-widget-'+index);
async function product(c,version){const p=await open(c,'/');products.push(p);await widget(p).waitFor();assert.equal(await widget(p).getByTestId('version').innerText(),version);return p;}
async function exercise(p,text){await widget(p).getByTestId('increment').click();await widget(p).getByTestId('input').fill(text);await widget(p).getByTestId('cache-write').click();}
async function kept(p,text){assert.equal(await widget(p).getByTestId('count').innerText(),'1');assert.equal(await widget(p).getByTestId('input').inputValue(),text);assert.equal(await widget(p).getByTestId('cache-value').innerText(),text);}
async function adminPost(endpoint,input){adminToken=(await(await fetch(url+'/api/admin/state')).json()).csrfToken;const r=await fetch(url+'/api/admin/'+endpoint,{method:'POST',headers:{Origin:url,'Content-Type':'application/json','X-MFE-CSRF':adminToken},body:JSON.stringify(input)});return{status:r.status,body:await r.json()};}
async function item(id=b14.id){return(await(await fetch(url+'/api/admin/lifecycle')).json()).releases.find(r=>r.artifact.id===id);}
async function releaseBody(id){return{artifactId:id,expectedCompositionId:store.current().compositionId,expectedRevision:(await item(id)).lifecycle.revision,confirmationId:id,reason:'독립 구독 예제 검증',externalUsageChecked:true};}
function choice(a,id='widget-1'){return{id,title:a.service.toUpperCase()+' '+a.version,artifactId:a.id,widgetId:'car-picker',span:1};}
try{
 url=await start();browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE_PATH||(fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined)});
 const alice=await context(),bob=await context(),carol=await context(),manager=await context();
 let aUI,bUI,cUI,aOld,bOld,aNew,carolSub,staleDraft,stalePreview;const globalId=store.current().compositionId;
 await check('로그인 전 안내·사용자별 서버 세션',async()=>{
  const p=await open(alice,'/');assert(p.url().endsWith('/subscriptions'));assert.equal((await alice.request.get(url+'/api/subscriptions/state')).status(),401);await p.close();
  aUI=await login(alice,'alice');bUI=await login(bob,'bob');cUI=await login(carol,'carol');assert.equal((await state(alice)).user.id,'alice');assert.equal((await state(bob)).user.id,'bob');
 });
 await check('서로 다른 배포 조합·위젯 버전을 UI로 선택·저장',async()=>{
  const shared=await saveUI(aUI,[b14]),b=await saveUI(bUI,[b21],previous);carolSub=await saveUI(cUI,[b14]);assert.equal(shared.compositionId,carolSub.compositionId);const a=await saveUI(aUI,[b14,b21]);assert.equal(store.read('subscriptions.json').users.carol.compositionId,shared.compositionId);assert.notEqual(a.compositionId,b.compositionId);assert.equal(a.baseCompositionId,modern);assert.equal(b.baseCompositionId,previous);assert.equal(store.read('subscriptions.json').users.carol.compositionId,carolSub.compositionId);assert.equal(store.current().compositionId,globalId);
 });
 await check('두 사용자·두 B 버전 동시 실행·Context·상태·CSS·포털 격리',async()=>{
  aOld=await product(alice,'1.4.0');bOld=await product(bob,'2.1.0');await widget(aOld,2).waitFor();assert.equal(await widget(aOld,2).getByTestId('version').innerText(),'2.1.0');
  assert.equal(await widget(aOld).getByTestId('platform-user').innerText(),'Alice');assert.equal(await widget(bOld).getByTestId('platform-user').innerText(),'Bob');
  await exercise(aOld,'Alice의 이전 탭');await exercise(bOld,'Bob의 이전 탭');assert.equal(await widget(aOld,2).getByTestId('count').innerText(),'0');assert.notEqual(await widget(aOld).getAttribute('class'),await widget(aOld,2).getAttribute('class'));
  await widget(aOld).getByTestId('open-popup').click();assert.equal(await aOld.locator('[data-portal-scope="dashboard-widget-1"] [role=dialog]').count(),1);await aOld.getByTestId('popup-dashboard-widget-1').getByTestId('close-popup').click();
  const loaded=await aOld.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name));assert(loaded.some(x=>x.endsWith(b14.entry)));assert(loaded.some(x=>x.endsWith(b21.entry)));
  assert.equal(await aOld.evaluate(()=>__MFE_RUNTIME__.registry.runtimeBindings[__MFE_RUNTIME__.registry.applications.A.id].b),b15.id);assert.equal(await bOld.evaluate(()=>__MFE_RUNTIME__.registry.runtimeBindings[__MFE_RUNTIME__.registry.applications.A.id].b),b14.id);
  await aOld.screenshot({path:path.join(output,'alice-dashboard.png'),fullPage:true});await bOld.screenshot({path:path.join(output,'bob-dashboard.png'),fullPage:true});
 });
 await check('한 번도 대시보드를 열지 않은 Carol의 B와 전이 D 참조 보호',async()=>{
  await carol.close();for(const id of [...targets,release('platform-sdk').id,release('shell').id]){const r=await item(id);assert(r.subscriptions.some(s=>s.userId==='carol'));assert(r.deletion.blockers.some(b=>b.code==='SUBSCRIPTIONS'));if(targets.includes(id))assert(r.subscriptions.find(s=>s.userId==='carol').paths.some(p=>p.path.includes(b14.id)));}assert(!Object.values(store.read('usage.json').sessions).some(s=>s.userId==='carol'));
 });
 await check('전역 조합 변경·서버 재시작 후에도 구독과 기존 탭 유지',async()=>{
  const savedBefore=store.read('subscriptions.json');require('./integration/tools/publish-subscription-options.cjs').publishOptions();assert.deepEqual(store.read('subscriptions.json'),savedBefore);assert.equal(store.current().compositionId,globalId);
  select('previous');await kept(aOld,'Alice의 이전 탭');assert.equal((await state(alice)).subscription.baseCompositionId,modern);select('baseline');const port=Number(new URL(url).port);await stop();url=await start(port);
  assert.equal((await state(alice)).subscription.dashboard[0].artifactId,b14.id);assert.equal(store.read('subscriptions.json').users.carol.compositionId,carolSub.compositionId);const p=await product(alice,'1.4.0');assert.equal(await widget(p).getByTestId('platform-user').innerText(),'Alice');await kept(aOld,'Alice의 이전 탭');
 });
 await check('다른 사용자 지정·타 세션 CSRF·조합 URL 직접 열기 거부',async()=>{
  const a=await state(alice),b=await state(bob),input={expectedRevision:b.subscription.revision,baseCompositionId:modern,dashboard:[choice(b21)]};assert.equal((await post(bob,'preview',{...input,userId:'alice'})).status,422);assert.equal((await post(bob,'preview',input,a.csrfToken)).status,403);assert.equal((await bob.request.get(url+'/compositions/'+a.subscription.compositionId+'.html')).status(),404);
  const token=await aOld.evaluate(()=>window.__MFE_LAUNCH_TOKEN__);assert.equal((await bob.request.get(url+'/api/subscriptions/boot/'+token)).status(),410);assert.equal((await state(alice)).subscription.revision,a.subscription.revision);
 });
 await check('미공개 위젯·중복 배치 ID·검사 없는 저장 거부',async()=>{
  const a=await state(alice),input={expectedRevision:a.subscription.revision,baseCompositionId:modern,dashboard:[choice(b14)]};assert.equal((await post(alice,'preview',{...input,dashboard:[{...choice(b14),widgetId:'helper'}]})).status,422);assert.equal((await post(alice,'preview',{...input,dashboard:[choice(b14),choice(b14)]})).status,422);assert.equal((await post(alice,'save',input)).status,422);
  staleDraft=input;stalePreview=(await post(alice,'preview',input)).body.composition.compositionId;
 });
 await check('서비스 재빌드 없이 Alice 구독 교체·기존 탭과 Bob 유지·동시 수정 충돌 차단',async()=>{
  const bobBefore=(await state(bob)).subscription,oldId=await aOld.evaluate(()=>__MFE_RUNTIME__.registry.compositionId);const updated=await saveUI(aUI,[b15,b21]);assert.notEqual(updated.compositionId,oldId);aNew=await product(alice,'1.5.0');assert.equal(await aOld.evaluate(()=>__MFE_RUNTIME__.registry.compositionId),oldId);await kept(aOld,'Alice의 이전 탭');await kept(bOld,'Bob의 이전 탭');assert.deepEqual((await state(bob)).subscription,bobBefore);assert.equal(await widget(aNew).getByTestId('count').innerText(),'0');
  const late=await post(alice,'save',{...staleDraft,previewedCompositionId:stalePreview});assert.equal(late.status,409);assert.equal(late.body.code,'STALE_SUBSCRIPTION');assert.equal((await state(alice)).subscription.compositionId,updated.compositionId);
 });
 await check('배포 조합 변경은 새 탭에만 적용·아직 로드하지 않은 의존성도 보호',async()=>{
  await saveUI(bUI,[b21],modern);await product(bob,'2.1.0');await kept(bOld,'Bob의 이전 탭');const loaded=await bOld.evaluate(()=>__MFE_RUNTIME__.getDiagnostics().loadedContainerIds);assert(!loaded.includes(b14.id));assert((await item()).sessions.some(s=>s.userId==='bob'&&!s.loaded&&s.status==='recent'));
 });
 await check('활성 구독의 조합 보관 해제 금지·개인 과거 기록과 롤백 참조 구분',async()=>{
  const id=(await state(alice)).subscription.compositionId;assert.equal((await adminPost('compositions/retire',{compositionId:id,expectedCompositionId:store.current().compositionId,expectedRevision:0,confirmationId:id,reason:'구독 보호 검사'})).status,409);
  assert.equal((await adminPost('compositions/retire',{compositionId:previous,expectedCompositionId:store.current().compositionId,expectedRevision:0,confirmationId:previous,reason:'이전 공용 조합 보관 해제'})).status,200);for(const id of targets)assert.deepEqual((await item(id)).history,[]);
 });
 const aged=new Date(Date.now()-150*86400000).toISOString(),past=aged.slice(0,10);
 function agePolicy(id,extra={}){store.updateMetadata('lifecycle.json',v=>{v||={releases:{}};const p=v.releases[id]||{revision:0};v.releases[id]={...p,supportEndsOn:past,noticeReference:'임시 검증의 과거 공지',noticeRecordedAt:aged,...extra,revision:p.revision+1};return v;});}
 await check('지원 종료 버전은 신규 구독 금지·기존 소유자의 동일 참조 유지',async()=>{
  targets.forEach(id=>agePolicy(id));const a=await state(alice),r=await post(alice,'preview',{expectedRevision:a.subscription.revision,baseCompositionId:modern,dashboard:[choice(b14)]});assert.equal(r.status,422);assert.equal(r.body.code,'RELEASE_UNAVAILABLE');const c=await context(),p=await login(c,'carol'),s=await state(c);assert.equal((await post(c,'preview',{expectedRevision:s.subscription.revision,baseCompositionId:modern,dashboard:s.subscription.dashboard})).status,200);await p.close();await c.close();
 });
 await check('관리 화면에 미접속 구독·차단 사유 표시·B와 D 등록 해제/삭제 차단',async()=>{
  const admin=await open(manager,'/admin#lifecycle');await admin.getByTestId('release-'+b14.id).click();await admin.getByTestId('saved-subscription-references').getByText('Carol',{exact:true}).waitFor();assert((await admin.locator('[data-blocker=SUBSCRIPTIONS]').innerText()).includes('사용자 구독'));await admin.screenshot({path:path.join(output,'subscription-protection.png'),fullPage:true});
  for(const id of targets){for(const endpoint of ['releases/unregister','releases/delete']){const r=await adminPost(endpoint,await releaseBody(id));assert.equal(r.status,409);assert(r.body.blockers.some(b=>b.code==='SUBSCRIPTIONS'));}assert(fs.existsSync(path.join(store.store,'artifacts',id)));}
 });
 let html,launchToken,returning;
 await check('화면 열기와 구독 해제 사이에도 실행 예약으로 보호',async()=>{
  returning=await context();const p=await login(returning,'carol');html=await(await returning.request.get(url+'/')).text();launchToken=/window.__MFE_LAUNCH_TOKEN__="([a-f0-9]+)"/.exec(html)[1];await p.getByTestId('cancel-subscription').click();await p.getByTestId('confirm-cancel-subscription').click();await p.getByTestId('subscription-notice').filter({hasText:'해제했습니다'}).waitFor();assert.equal((await state(returning)).subscription.active,false);
  const r=await adminPost('releases/unregister',await releaseBody(b14.id));assert.equal(r.status,409);assert(r.body.blockers.some(b=>b.code==='LAUNCHES'));
  const gate=await returning.newPage();lastPage=gate;await gate.route(url+'/',r=>r.fulfill({status:200,contentType:'text/html',body:html}));await gate.goto(url+'/');products.push(gate);await widget(gate).waitFor();assert.equal(await widget(gate).getByTestId('platform-user').innerText(),'Carol');assert((await item()).sessions.some(s=>s.userId==='carol'&&s.status==='recent'));
 });
 await check('구독 해제 후에도 기존 탭은 B와 전이 D 삭제를 막음',async()=>{
  store.updateMetadata('subscription-launches.json',v=>Object.fromEntries(Object.entries(v||{}).map(([id,l])=>[id,{...l,expiresAt:aged}])));
  for(const id of targets){const r=await item(id);assert.equal(r.subscriptions.length,0);assert.equal(r.history.length,0);assert(r.deletion.blockers.some(b=>b.code==='OPEN_TABS'));assert.equal((await adminPost('releases/unregister',await releaseBody(id))).status,200);const del=await adminPost('releases/delete',await releaseBody(id));assert.equal(del.status,409);assert(del.body.blockers.some(b=>b.code==='OPEN_TABS'));assert(fs.existsSync(path.join(store.store,'artifacts',id)));}await kept(aOld,'Alice의 이전 탭');await kept(bOld,'Bob의 이전 탭');
 });
 await check('만료 예약 재사용 차단·해제된 구독 신규 화면 차단',async()=>{
  assert.equal((await returning.request.get(url+'/api/subscriptions/boot/'+launchToken)).status(),410);assert.equal((await returning.request.get(url+'/',{maxRedirects:0})).status(),302);
  const c=await(await returning.request.get(url+'/api/runtime/config')).json(),r=await returning.request.post(url+'/api/runtime/usage',{headers:{Origin:url},data:{token:c.token,protocol:'lease-v1',launchToken,sessionId:randomUUID(),sequence:1,compositionId:carolSub.compositionId,event:'open',loadedArtifactIds:[]}});assert.equal(r.status(),410);
 });
 await check('모든 구독·탭을 정리해도 별도 보관 기간 적용',async()=>{
  for(const p of products){if(p.isClosed())continue;if(await p.evaluate(id=>Boolean(__MFE_RUNTIME__.registry.artifacts[id]),b14.id))await p.close();}
  await eventually(async()=>{for(const id of targets){const r=await item(id);assert.equal(r.recentTabs+r.unknownTabs,0);assert(r.deletion.blockers.some(b=>b.code==='RETENTION'));}});assert.equal((await adminPost('releases/delete',await releaseBody(b14.id))).status,409);
 });
 await check('참조·공지·보관 조건 해소 후 B와 D 파일 실제 삭제',async()=>{
  // Only this disposable store simulates elapsed time. Production has no clock override.
  targets.forEach(id=>agePolicy(id,{unregisteredAt:aged}));store.updateMetadata('usage.json',v=>{v.startedAt=aged;for(const s of Object.values(v.sessions))if(s.closedAt){s.closedAt=aged;s.lastSeenAt=aged;}return v;});store.updateMetadata('subscriptions.json',v=>{for(const id of targets)v.releasedArtifacts[id]=aged;return v;});
  for(const id of targets){assert.deepEqual((await item(id)).deletion.blockers,[]);assert.equal((await adminPost('releases/delete',await releaseBody(id))).status,200);assert(!fs.existsSync(path.join(store.store,'artifacts',id)));assert(store.read('catalog.json')[id]);}assert.equal((await fetch(url+b14.entry)).status,404);assert.equal((await fetch(url+d10.entry)).status,404);
 });
 await check('삭제한 버전 재구독 금지·다른 사용자 구독과 재시작 정상',async()=>{
  const s=await state(returning);assert.equal((await post(returning,'preview',{expectedRevision:s.subscription.revision,baseCompositionId:modern,dashboard:[choice(b14)]})).status,422);assert.equal((await state(returning)).subscription.active,false);const a=await product(alice,'1.5.0'),b=await product(bob,'2.1.0');await exercise(a,'새 버전 정상');await exercise(b,'Bob 정상');await kept(a,'새 버전 정상');const port=Number(new URL(url).port);await stop();url=await start(port);assert.equal((await state(alice)).subscription.dashboard[0].artifactId,b15.id);assert.equal((await item()).registrationState,'deleted');
 });
 await check('모바일 편집 화면·예상하지 않은 브라우저 예외 없음',async()=>{
  await aUI.reload();await aUI.getByTestId('saved-user').waitFor();await aUI.setViewportSize({width:390,height:844});assert(await aUI.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await aUI.screenshot({path:path.join(output,'subscriptions-mobile.png'),fullPage:true});await aUI.setViewportSize({width:1440,height:1000});await aUI.screenshot({path:path.join(output,'subscriptions-editor.png'),fullPage:true});assert.deepEqual(errors,[]);
 });
 await check('구독 작업 중 서비스·SDK·Shell 소스와 번들·초기 조합 유지',async()=>{assert.deepEqual(require('./pins.cjs').inventory(),before);report.globalComposition=globalId;assert.equal(store.current().compositionId,globalId);});
 report.status='passed';
}catch(e){report.status='failed';report.error=e.stack;process.exitCode=1;console.error(e);if(lastPage&&!lastPage.isClosed())await lastPage.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});}
finally{await browser?.close();await stop();fs.rmSync(temporary,{recursive:true,force:true});report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(`20-user-subscriptions: ${report.status} ${report.checks.filter(c=>c.status==='passed').length}/${report.checks.length}`);}
