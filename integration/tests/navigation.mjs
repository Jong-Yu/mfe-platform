import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root=fileURLToPath(new URL('../../',import.meta.url));
const integration=path.join(root,'integration'), output=path.join(integration,'artifacts/verification');
const replay=path.join(integration,'artifacts/navigation-demo');
for(const dir of [output,replay])fs.mkdirSync(dir,{recursive:true});
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'mfe-navigation-'));
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');
function fingerprint(dir, includeTime=false){
  const hash=createHash('sha256');let files=0;
  function visit(current){for(const entry of fs.readdirSync(current,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    if(['node_modules','.mfe-dev','.git'].includes(entry.name))continue;
    const file=path.join(current,entry.name);if(entry.isDirectory())visit(file);
    else{hash.update(path.relative(dir,file)).update(fs.readFileSync(file));if(includeTime)hash.update(String(fs.statSync(file).mtimeMs));files++;}
  }}visit(dir);return{files,sha256:hash.digest('hex')};
}
const originalPointer=fs.readFileSync(path.join(root,'artifact-store/current.json'),'utf8');
const protectedProjects=Object.fromEntries(fs.readdirSync(path.join(root,'projects')).map(name=>[name,fingerprint(path.join(root,'projects',name),true)]));
const report={status:'running',startedAt:new Date().toISOString(),checks:[],commands:[],pageErrors:[],
  scope:'Real Chrome, management UI, local HTTP API and actual MF artifacts. Shell/Admin migrated once before this test. E is published, then F is newly created/built/published after E registration. No Shell, SDK, A, B, C or D builds during registration. S3, production authorization and production routing are not tested.'};
const processes=[];let browser,currentPage;
async function check(name,action){try{const detail=await action();report.checks.push({name,status:'passed',detail});console.log('PASS',name);}catch(error){report.checks.push({name,status:'failed',error:error.message});throw error;}}
function launch(args,cwd,extra={}){
  const child=spawn(args[0],args.slice(1),{cwd,env:{...process.env,npm_config_cache:'/private/tmp/mfe-npm-cache',npm_config_offline:'true',npm_config_update_notifier:'false',...extra},stdio:['ignore','pipe','pipe']});
  child.log='';child.stdout.on('data',d=>child.log+=d);child.stderr.on('data',d=>child.log+=d);processes.push(child);return child;
}
async function run(args,cwd){const child=launch(args,cwd);report.commands.push({args,cwd});await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{child.kill();reject(new Error(child.log));},90000);
  child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('exit',code=>{clearTimeout(timer);code===0?resolve():reject(new Error(child.log));});
});report.commands.at(-1).output=child.log;}
async function startServer(){const child=launch([process.execPath,'tools/serve.cjs'],integration,{PORT:'0'});return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(child.log)),15000);child.on('error',e=>{clearTimeout(timer);reject(e);});
  child.stdout.on('data',()=>{const match=child.log.match(/MF proof: (http:\/\/127\.0\.0\.1:\d+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
});}
try{
  fs.cpSync(path.join(root,'artifact-store'),path.join(temporary,'store'),{recursive:true,filter:file=>path.basename(file)!=='.write-lock'});
  process.env.MFE_ARTIFACT_STORE=path.join(temporary,'store');
  const require=createRequire(import.meta.url),store=require('../tools/store.cjs'),life=require('../tools/lifecycle.cjs');
  const onboarding=json(path.join(integration,'artifacts/onboarding-demo/latest.json')).directory;
  const baseline=store.current();
  const e=store.publish(path.join(onboarding,'team-e/service-e'));
  const sdk=store.publish(path.join(root,'projects/platform-sdk'));
  const shell=store.publish(path.join(root,'projects/shell'));
  store.selectAdmin(store.publish(path.join(root,'projects/platform-admin')).id);
  const emenu={id:'alerts',label:'알림',path:'/services/alerts',artifactId:e.id,exposedModule:'./Widget'};
  report.initialMigration={sdk:sdk.id,shell:shell.id};report.e=e;
  await check('legacy Shell rejects menus; one initial capable Shell is selected',async()=>{
    assert.throws(()=>store.preview({}, {}, {navigation:[emenu]}),/Shell/);
    const composition=store.activate({platform:sdk.id,shell:shell.id},{},{navigation:[]});
    assert(!composition.navigation);assert.equal(composition.selected.shell,shell.id);
  });
  const shellBytes=fingerprint(path.join(temporary,'store/artifacts',shell.id),true);
  const url=await startServer();
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:1100}});
  context.on('page',page=>page.on('pageerror',error=>report.pageErrors.push(error.message)));
  async function open(suffix='/?empty=1'){const page=await context.newPage();currentPage=page;await page.goto(url+suffix);await page.getByTestId('add-a').waitFor({state:'attached'});return page;}
  const old=await open();
  await old.getByTestId('add-a').click();await old.getByTestId('widget-A').getByTestId('input').fill('최초 탭 입력');
  const admin=await context.newPage();currentPage=admin;await admin.goto(url+'/admin#services');await admin.getByTestId('add-service-menu').waitFor();
  async function refresh(){const loaded=admin.waitForResponse(r=>r.url().endsWith('/api/admin/state'));await admin.getByRole('button',{name:'↻ 최신 조합 불러오기',exact:true}).click();await loaded;await admin.waitForFunction(()=>!document.querySelector('[data-testid=add-service-menu]')?.disabled);}
  async function fillMenu(index,item){for(const [field,value]of Object.entries({id:item.id,label:item.label,path:item.path,module:item.exposedModule}))await admin.getByTestId(`menu-${field}-${index}`).fill(value);await admin.getByTestId(`menu-artifact-${index}`).selectOption(item.artifactId);}
  async function preview(){await admin.getByTestId('preview').click();await admin.getByTestId('preview-valid').waitFor();}
  async function apply(){const changed=admin.waitForResponse(r=>r.url().endsWith('/api/admin/state')&&r.request().method()==='GET');await admin.getByTestId('apply').click();await changed;await admin.getByTestId('admin-notice').filter({hasText:'조합을 적용했습니다'}).waitFor();return store.current();}
  let eOnly,both;
  await check('register E in the management UI and apply only after successful preview',async()=>{
    await admin.getByTestId('add-service-menu').click();await fillMenu(0,emenu);assert(await admin.getByTestId('apply').isDisabled());await preview();eOnly=await apply();
    assert.deepEqual(eOnly.navigation,[emenu]);assert.equal(eOnly.runtimeBindings[shell.id]['menu/alerts'],e.id);
  });
  await check('tabs opened before registration retain the old menu and existing state',async()=>{
    assert.equal(await old.getByTestId('menu-link-alerts').count(),0);assert.equal(await old.getByTestId('widget-A').getByTestId('input').inputValue(),'최초 탭 입력');
    await old.evaluate(()=>location.hash='/services/alerts');await old.getByTestId('menu-not-found').waitFor();
  });
  const product=await context.newPage();currentPage=product;const requests=[];product.on('request',r=>requests.push(r.url()));
  await check('new tabs discover E; the real MF module loads only on menu selection',async()=>{
    await product.goto(url+'/?empty=1');await product.getByTestId('menu-link-alerts').waitFor();assert(!requests.includes(url+e.entry));
    await product.getByTestId('menu-link-alerts').click();await product.getByTestId('service-e-menu-alerts').waitFor();assert(requests.includes(url+e.entry));
    assert.equal(await product.getByTestId('e-user').innerText(),'김개발');assert.equal(await product.getByTestId('e-sdk').innerText(),'1.3.1');
    assert.equal(await product.locator('header.header').count(),1);assert.equal(await product.locator('[data-dev-layout]').count(),0);
  });
  await check('switching menus preserves E input/state and direct hash links work',async()=>{
    await product.getByTestId('e-input').fill('E 유지');await product.getByTestId('e-increment').click();
    await product.locator('a[href="#/"]').click();await product.getByTestId('menu-link-alerts').click();
    assert.equal(await product.getByTestId('e-input').inputValue(),'E 유지');assert.equal(await product.getByTestId('e-count').innerText(),'1');
    const direct=await open('/?empty=1#/services/alerts');await direct.getByTestId('service-e-menu-alerts').waitFor();await direct.close();
  });
  let f;const fproject=path.join(temporary,'service-f');
  await check('create and build independent F after E registration without touching Shell',async()=>{
    fs.cpSync(path.join(integration,'templates/service-e'),fproject,{recursive:true});
    const pkg=json(path.join(fproject,'package.json'));pkg.name='@mfe/service-f';write(path.join(fproject,'package.json'),pkg);
    fs.mkdirSync(path.join(fproject,'vendor'));fs.copyFileSync(path.join(root,'projects/shell/vendor/mfe-platform-build-tools-1.7.0.tgz'),path.join(fproject,'vendor/mfe-platform-build-tools-1.7.0.tgz'));
    fs.writeFileSync(path.join(fproject,'mf.config.cjs'),"module.exports={service:'f',kind:'remote',port:4208,exposes:{'./Widget':'./src/Widget.jsx'}};\n");
    const dependencies=json(path.join(fproject,'mf.dependencies.json'));dependencies.d={mode:'runtime',service:'d',requires:'>=2.0.0 <3.0.0'};write(path.join(fproject,'mf.dependencies.json'),dependencies);
    const file=path.join(fproject,'src/Widget.jsx');let source=fs.readFileSync(file,'utf8').replaceAll('service-e-','service-f-').replaceAll('"e-','"f-').replace('알림 서비스 E','리포트 서비스 F');
    source="import { describe } from 'd/data';\n"+source.replace('<p data-testid="f-message">','<p data-testid="f-dependency">{describe()}</p><p data-testid="f-message">');fs.writeFileSync(file,source);
    await run(['npm','install','--ignore-scripts','--no-audit','--no-fund'],fproject);await run(['npm','run','build'],fproject);f=store.publish(fproject);report.f=f;
    assert.deepEqual(f.exposedModules,['./Widget']);assert.deepEqual(fingerprint(path.join(root,'projects/shell'),true),protectedProjects.shell);
  });
  const cB=baseline.runtimeBindings[baseline.selected.C].b,d=baseline.artifacts[baseline.runtimeBindings[cB].d];
  const fmenu={id:'reports',label:'리포트',path:'/services/reports',artifactId:f.id,exposedModule:'./Widget'};
  await check('F dependency is required, then F and its chosen D are registered from the UI',async()=>{
    await refresh();await admin.getByTestId('add-service-menu').click();await fillMenu(1,fmenu);
    await admin.getByTestId('preview').click();await admin.getByTestId('admin-error').filter({hasText:'하위 버전'}).waitFor();assert(await admin.getByTestId('apply').isDisabled());assert.equal(store.current().compositionId,eOnly.compositionId);
    await admin.getByTestId('menu-row-1').locator('.menu-dependency select').selectOption(d.id);await preview();both=await apply();
    assert.equal(both.runtimeBindings[f.id].d,d.id);assert.equal(both.selected.shell,shell.id);
  });
  const fresh=await open();
  await check('both new menus run with shared SDK/React/Context and selected transitive D',async()=>{
    await fresh.getByTestId('menu-link-reports').click();await fresh.getByTestId('service-f-menu-reports').waitFor();assert((await fresh.getByTestId('f-dependency').innerText()).startsWith(`D ${d.version}`));
    await fresh.getByTestId('f-input').fill('F 유지');await fresh.getByTestId('f-increment').click();await fresh.getByTestId('menu-link-alerts').click();await fresh.getByTestId('service-e-menu-alerts').waitFor();
    const proof=await fresh.evaluate(async ids=>{const r=window.__MFE_RUNTIME__,sdk=(await(await r.getContainer('platform')).get('./sdk'))();const identities=[];for(const id of ids){const widget=(await(await r.getArtifactContainer(r.registry.artifacts[id])).get('./Widget'))().getIdentity();identities.push({id,react:widget.react===sdk.ReactIdentity,context:widget.context===sdk.PlatformContext});}return{identities,diagnostics:r.getDiagnostics()};},[e.id,f.id]);
    assert(proof.identities.every(i=>i.react&&i.context));report.runtime=proof;
    assert.equal(await product.getByTestId('menu-link-reports').count(),0);assert.equal(await product.getByTestId('e-input').inputValue(),'E 유지');
    await fresh.screenshot({path:path.join(output,'navigation-shell.png'),fullPage:true});
    await fresh.setViewportSize({width:390,height:844});assert(await fresh.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await fresh.screenshot({path:path.join(output,'navigation-shell-mobile.png'),fullPage:true});
  });
  await check('menu order/title/path edits invalidate preview and require no Shell rebuild',async()=>{
    await admin.getByTestId('menu-up-1').click();await preview();await admin.getByTestId('menu-label-0').fill('리포트 F');assert(await admin.getByTestId('apply').isDisabled());
    await admin.getByTestId('menu-path-0').fill('/services/report-center');await preview();const changed=await apply();assert.equal(changed.navigation[0].id,'reports');
    const tab=await open();assert.deepEqual(await tab.locator('[data-testid^="menu-link-"]').allTextContents(),['리포트 F','알림']);await tab.getByTestId('menu-link-reports').click();await tab.getByTestId('service-f-menu-reports').waitFor();assert(tab.url().endsWith('#/services/report-center'));await tab.close();
    store.rollback(both.compositionId);await refresh();
  });
  const state=async()=>await(await fetch(url+'/api/admin/state')).json();
  async function post(action,body){const s=await state(),response=await fetch(url+'/api/admin/'+action,{method:'POST',headers:{'Content-Type':'application/json',Origin:url,'X-MFE-CSRF':s.csrfToken},body:JSON.stringify(body)});return{status:response.status,body:await response.json()};}
  function payload(navigation=both.navigation){const current=store.current();const bindings=structuredClone(current.runtimeBindings);delete bindings[shell.id];return{selected:current.selected,runtimeBindings:bindings,navigation,expectedCompositionId:current.compositionId};}
  await check('server rejects invalid menus/modules/targets and duplicate IDs or paths before activation',async()=>{
    const cases=[{menus:[emenu,{...fmenu,id:'alerts'}]},{menus:[emenu,{...fmenu,path:emenu.path}]},{menus:[{...emenu,path:'https://example.com'}]},{menus:[{...emenu,artifactId:sdk.id}]},{menus:[{...fmenu,exposedModule:'./Missing'}]},{menus:[{...fmenu,exposedModule:'../Widget'}]}];
    for(const item of cases){const res=await post('preview',payload(item.menus));assert.equal(res.status,422,JSON.stringify(res));}assert.equal(store.current().compositionId,both.compositionId);
    const stale=await post('preview',{...payload(),expectedCompositionId:eOnly.compositionId});assert.equal(stale.status,409);
    const valid=await post('preview',payload([{...emenu,label:'변경 이름'},fmenu]));assert.equal(valid.status,200);
    const changed=await post('apply',{...payload([{...emenu,label:'다른 이름'},fmenu]),previewedCompositionId:valid.body.composition.compositionId});assert.equal(changed.status,422);assert.equal(store.current().compositionId,both.compositionId);
  });
  await check('an E entry failure stays in its page; retry recovers without reload or loss of A/F state',async()=>{
    const tab=await open();let navigationCount=0;tab.on('framenavigated',frame=>{if(frame===tab.mainFrame()&&!frame.url().includes('#'))navigationCount++;});
    await tab.getByTestId('add-a').click();await tab.getByTestId('widget-A').getByTestId('input').fill('A 보호');await tab.getByTestId('widget-A').getByTestId('increment').click();
    await tab.route(url+e.entry,route=>route.fulfill({status:503,contentType:'text/javascript',body:'unavailable'}));
    await tab.getByTestId('menu-link-alerts').click();await tab.getByTestId('remote-error-menu-alerts').waitFor();
    await tab.getByTestId('menu-link-reports').click();await tab.getByTestId('f-input').fill('F 보호');await tab.getByTestId('f-increment').click();
    const marker=await tab.evaluate(()=>window.__navigationTestMarker=crypto.randomUUID());await tab.unroute(url+e.entry);
    await tab.getByTestId('menu-link-alerts').click();await tab.getByTestId('retry-menu-alerts').click();await tab.getByTestId('service-e-menu-alerts').waitFor();
    assert.equal(await tab.evaluate(()=>window.__navigationTestMarker),marker);assert.equal(navigationCount,0);
    await tab.getByTestId('menu-link-reports').click();assert.equal(await tab.getByTestId('f-input').inputValue(),'F 보호');assert.equal(await tab.getByTestId('f-count').innerText(),'1');
    await tab.locator('a[href="#/"]').click();assert.equal(await tab.getByTestId('widget-A').getByTestId('input').inputValue(),'A 보호');assert.equal(await tab.getByTestId('widget-A').getByTestId('count').innerText(),'1');await tab.close();
  });
  await check('registered menu roots and transitive D are included in usage tracking',async()=>{
    const paths=life.usagePaths(both);assert(paths.some(p=>p.artifactId===e.id&&p.aliases.includes('menu/alerts:./Widget')));
    assert(paths.some(p=>p.artifactId===d.id&&p.path.includes(f.id)&&p.aliases.includes('menu/reports:./Widget')));
    const usage=life.lifecycleState().releases.find(r=>r.artifact.id===e.id);assert(usage.currentPaths.length>0);assert(usage.recentTabs>0);return{paths:usage.currentPaths,recentTabs:usage.recentTabs};
  });
  await check('support-ended E can keep its current menu but cannot gain another menu reference',async()=>{
    const policy=life.saveLifecycle({artifactId:e.id,expectedRevision:0,supportEndsOn:'2000-01-01',noticeReference:'navigation verification'});
    const retained=await post('preview',payload([{...emenu,label:'이름만 변경'},fmenu]));assert.equal(retained.status,200);
    const extra=await post('preview',payload([emenu,fmenu,{...emenu,id:'alerts-new',path:'/services/alerts-new'}]));assert.equal(extra.status,422);assert.match(extra.body.error,/지원 종료/);
    assert.equal((await state()).catalog.find(item=>item.id===e.id).selectionState,'ended');
    await refresh();await admin.getByTestId('menu-artifact-0').locator(`option[value="${e.id}"][disabled]`).waitFor({state:'attached'});
    life.saveLifecycle({artifactId:e.id,expectedRevision:policy.revision,supportEndsOn:null,noticeReference:''});await refresh();
  });
  await check('removing a menu preserves old tabs/files; old tabs and rollback references block deletion',async()=>{
    await admin.getByTestId('menu-remove-0').click();await preview();await apply();
    const tab=await open();assert.equal(await tab.getByTestId('menu-link-alerts').count(),0);await tab.close();
    assert.equal(await product.getByTestId('e-input').inputValue(),'E 유지');assert.equal(await product.getByTestId('e-count').innerText(),'1');
    const usage=life.lifecycleState().releases.find(r=>r.artifact.id===e.id);assert.equal(usage.currentPaths.length,0);
    assert(usage.deletion.blockers.some(b=>b.code==='OPEN_TABS'));assert(usage.deletion.blockers.some(b=>b.code==='ROLLBACK'));
    const deletion=await post('releases/delete',{artifactId:e.id,expectedRevision:usage.lifecycle.revision,reason:'검증 삭제 시도'});assert.equal(deletion.status,409);
    assert(fs.existsSync(path.join(temporary,'store/artifacts',e.id,'remoteEntry.js')));return usage.deletion;
  });
  await check('UI rollback restores menu snapshot while existing F remains usable',async()=>{
    await admin.getByTestId(`history-${eOnly.compositionId}`).getByRole('button',{name:'불러오기'}).click();await preview();const restored=await apply();assert.equal(restored.compositionId,eOnly.compositionId);
    const tab=await open();await tab.getByTestId('menu-link-alerts').waitFor();assert.equal(await tab.getByTestId('menu-link-reports').count(),0);await tab.close();
    await fresh.getByTestId('menu-link-reports').click();assert.equal(await fresh.getByTestId('f-input').inputValue(),'F 유지');assert.equal(await fresh.getByTestId('f-count').innerText(),'1');
    const pinned=await open(`/compositions/${both.compositionId}.html?empty=1`);assert.equal(await pinned.getByTestId('menu-link-reports').count(),1);await pinned.close();
  });
  await check('Shell source/dist/published file hashes AND mtimes remain unchanged; original projects/store untouched',async()=>{
    assert.deepEqual(fingerprint(path.join(temporary,'store/artifacts',shell.id),true),shellBytes);
    for(const[name,value]of Object.entries(protectedProjects))assert.deepEqual(fingerprint(path.join(root,'projects',name),true),value,name);
    assert.equal(fs.readFileSync(path.join(root,'artifact-store/current.json'),'utf8'),originalPointer);assert.deepEqual(report.pageErrors,[]);
    report.protectedProjects=protectedProjects;report.shellFiles=shellBytes;report.shellBuildsDuringRegistration=0;
  });
  store.rollback(both.compositionId);await refresh();await admin.screenshot({path:path.join(output,'navigation-admin.png'),fullPage:true});
  await admin.setViewportSize({width:390,height:844});assert(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await admin.screenshot({path:path.join(output,'navigation-admin-mobile.png'),fullPage:true});
  const retained=fs.mkdtempSync(path.join(replay,'verified-'));
  fs.cpSync(temporary,retained,{recursive:true,filter:file=>!['node_modules','.mfe-dev'].includes(path.basename(file))});fs.rmSync(path.join(retained,'store/usage.json'),{force:true});
  write(path.join(retained,'scenario.json'),{composition:both,e,f,shell,initialMigration:report.initialMigration,builtDuringRegistration:['service-f']});write(path.join(replay,'latest.json'),{directory:retained});
  report.retained=retained;report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;console.error(error);await currentPage?.screenshot({path:path.join(output,'navigation-failure.png'),fullPage:true}).catch(()=>{});
}finally{
  await browser?.close();for(const child of processes)if(child.exitCode===null&&child.signalCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');});
  fs.rmSync(temporary,{recursive:true,force:true});report.finishedAt=new Date().toISOString();report.passedChecks=report.checks.filter(x=>x.status==='passed').length;
  write(path.join(output,'navigation.json'),report);console.log(`Navigation ${report.status}: ${report.passedChecks}/${report.checks.length}`);
}
