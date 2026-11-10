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
const replay=path.join(integration,'artifacts/dashboard-demo');
for(const dir of [output,replay])fs.mkdirSync(dir,{recursive:true});
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'mfe-dashboard-'));
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
  scope:'Real Chrome UI → API → immutable composition → MF dashboard. Initial Shell/Admin built once beforehand. Independently build B widget declarations and later E; no Shell/SDK/A/C/B/D rebuild to change layout. Local store only; production S3/auth/DB not exercised.'};
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
});}try{
  fs.cpSync(path.join(root,'artifact-store'),path.join(temporary,'store'),{recursive:true,filter:file=>path.basename(file)!=='.write-lock'});
  process.env.MFE_ARTIFACT_STORE=path.join(temporary,'store');
  const require=createRequire(import.meta.url),store=require('../tools/store.cjs'),life=require('../tools/lifecycle.cjs');
  const baseline=store.current();
  const sdk=store.publish(path.join(root,'projects/platform-sdk')),shell=store.publish(path.join(root,'projects/shell'));
  const adminRelease=store.publish(path.join(root,'projects/platform-admin'));
  store.selectAdmin(adminRelease.id);
  const toolFile=`mfe-platform-build-tools-${json(path.join(root,'projects/platform-build-tools/package.json')).version}.tgz`;
  const paths=Object.fromEntries(['A','C'].map(role=>{const b=baseline.runtimeBindings[baseline.selected[role]].b;return[role,baseline.artifacts[baseline.runtimeBindings[b].d]];}));
  async function prepare(name,source){
    const dir=path.join(temporary,name);fs.cpSync(source,dir,{recursive:true,filter:file=>!['node_modules','dist','.mfe-dev'].includes(path.basename(file))});
    const pkg=json(path.join(dir,'package.json'));pkg.devDependencies['@mfe/platform-build-tools']='file:vendor/'+toolFile;write(path.join(dir,'package.json'),pkg);
    fs.mkdirSync(path.join(dir,'vendor'),{recursive:true});fs.copyFileSync(path.join(root,'projects/shell/vendor',toolFile),path.join(dir,'vendor',toolFile));
    await run(['npm','install','--ignore-scripts','--no-audit','--no-fund'],dir);return dir;
  }
  let b1,b2;
  await check('independent B 1.4 and B 2.1 builds explicitly publish widget catalogs; helpers stay excluded',async()=>{
    for(const [name,version]of [['service-b-v1','1.4.0'],['service-b-v2','2.1.0']]){
      const dir=await prepare(name,path.join(root,'projects',name));
      const config={service:'b',kind:'remote',exposes:{'./Widget':'./src/Widget.jsx','./helper':'./src/helper.js'},widgets:[{id:'car-picker',title:'차량 선택',exposedModule:'./Widget',contract:'platform-widget-v1'}]};
      fs.writeFileSync(path.join(dir,'src/helper.js'),'export const helper = true;\n');
      if(version==='2.1.0'){
        config.exposes['./Summary']='./src/Summary.jsx';config.widgets.push({id:'summary',title:'차량 요약',exposedModule:'./Summary',contract:'platform-widget-v1'});
        fs.writeFileSync(path.join(dir,'src/Summary.jsx'),"import React from 'react';\nimport {WidgetBoundary,useWidgetScope,usePlatform} from 'platform/sdk';\nimport {describe} from 'd/data';\nfunction Content(){const scope=useWidgetScope(),platform=usePlatform();return <div data-testid={`summary-${scope.instanceId}`}><p>차량 요약 · {describe()} · {platform.user.name}</p><button data-testid=\"summary-increment\" onClick={()=>scope.setCount(n=>n+1)}>요약 확인 <span data-testid=\"summary-count\">{scope.count}</span></button></div>;}\nexport default function Summary({instanceId}){return <WidgetBoundary instanceId={instanceId} artifactId={__ARTIFACT_ID__}><Content/></WidgetBoundary>;}\n");
      }
      fs.writeFileSync(path.join(dir,'mf.config.cjs'),'module.exports = '+JSON.stringify(config,null,2)+';\n');
      await run(['npm','run','build'],dir);const release=store.publish(dir);assert.equal(release.version,version);assert(release.exposedModules.includes('./helper'));assert(!release.widgets.some(w=>w.exposedModule==='./helper'));if(version==='1.4.0')b1=release;else b2=release;
    }
    report.widgets={b1,b2};
  });
  await check('widget declarations reject invalid contracts, undeclared modules and duplicate public IDs',async()=>{
    const {validateWidgets}=require('../../projects/platform-build-tools/lib/widgets.cjs');const widget=b1.widgets[0];
    for(const widgets of [[{...widget,contract:'unknown'}],[{...widget,exposedModule:'./missing'}],[widget,widget]])assert.throws(()=>validateWidgets(widgets,b1));
    assert.throws(()=>validateWidgets([widget],{...b1,kind:'shell'}));
    assert.throws(()=>store.preview({}, {}, {dashboard:[]}),/Shell/);
  });
  const menu={id:'vehicles',label:'차량 페이지',path:'/services/vehicles',artifactId:b1.id,exposedModule:'./Widget'};
  const legacy=store.activate({platform:sdk.id,shell:shell.id},{[b1.id]:{d:paths.A.id}},{navigation:[menu],dashboard:null});
  const empty=store.activate({}, {}, {dashboard:[]});assert.notEqual(empty.compositionId,legacy.compositionId);
  const shellBytes=fingerprint(path.join(temporary,'store/artifacts',shell.id),true);
  report.initialMigration={shell:shell.id,sdk:sdk.id};
  const url=await startServer();
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context=await browser.newContext({viewport:{width:1600,height:1100}});context.on('page',p=>p.on('pageerror',e=>report.pageErrors.push(e.message)));
  async function open(suffix='/'){const page=await context.newPage();currentPage=page;await page.goto(url+suffix);await page.getByTestId('dashboard-link').waitFor();return page;}
  const oldEmpty=await open();await oldEmpty.getByTestId('registered-dashboard').waitFor();
  const admin=await context.newPage();currentPage=admin;const adminRequests=[];admin.on('request',r=>adminRequests.push(r.url()));await admin.goto(url+'/admin#dashboard');await admin.getByTestId('add-dashboard-widget').waitFor();
  async function refresh(){const loaded=admin.waitForResponse(r=>r.url().endsWith('/api/admin/state'));await admin.getByRole('button',{name:'↻ 최신 조합 불러오기',exact:true}).click();await loaded;await admin.waitForFunction(()=>!document.querySelector('[data-testid=add-dashboard-widget]')?.disabled);}
  async function fill(index,item){await admin.getByTestId(`dashboard-artifact-${index}`).selectOption(item.artifactId);await admin.getByTestId(`dashboard-widget-${index}`).selectOption(item.widgetId);await admin.getByTestId(`dashboard-id-${index}`).fill(item.id);await admin.getByTestId(`dashboard-title-${index}`).fill(item.title);await admin.getByTestId(`dashboard-span-${index}`).selectOption(String(item.span));}
  async function add(index,item){await admin.getByTestId('add-dashboard-widget').click();await fill(index,item);}
  async function preview(){currentPage=admin;await admin.getByTestId('preview').click();await admin.getByTestId('preview-valid').waitFor();}
  async function apply(){const done=admin.waitForResponse(r=>r.url().endsWith('/api/admin/state'));await admin.getByTestId('apply').click();await done;await admin.getByTestId('admin-notice').filter({hasText:'조합을 적용했습니다'}).waitFor();return store.current();}
  const oldItem={id:'car-old',title:'기존 차량',artifactId:b1.id,widgetId:'car-picker',span:1};
  const copyItem={...oldItem,id:'car-copy',title:'두 번째 차량'};
  const newItem={id:'car-new',title:'신규 차량',artifactId:b2.id,widgetId:'car-picker',span:1};
  const summaryItem={...newItem,id:'totals',title:'차량 요약',widgetId:'summary',span:2};
  let single,multiple,arranged,finalLayout;
  await check('management UI lists opt-in widgets only and activates the first placement after review',async()=>{
    await add(0,oldItem);const options=await admin.getByTestId('dashboard-widget-0').locator('option').allTextContents();assert(!options.some(s=>s.includes('helper')));
    const catalogIds=await admin.getByTestId('dashboard-artifact-0').locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));assert(!catalogIds.includes(baseline.runtimeBindings[baseline.selected.A].b));assert(await admin.getByTestId('apply').isDisabled());await preview();single=await apply();
    assert.deepEqual(single.dashboard,[oldItem]);assert.equal(single.runtimeBindings[shell.id]['dashboard/car-old'],b1.id);
    const adminEntries=adminRequests.map(request=>new URL(request)).filter(request=>request.pathname.endsWith('/remoteEntry.js'));
    if(adminRelease.format==='esm')assert(adminEntries.length>0,'Vite Admin initializes its own federation container');
    assert(adminEntries.every(request=>request.origin===url&&request.pathname===`/artifacts/${adminRelease.id}/remoteEntry.js`),'Admin must load only its own bootstrap and no SDK/business containers');
    assert.equal(await oldEmpty.getByTestId('dashboard-tile-car-old').count(),0);
  });
  const oldSingle=await open();const widget=(page,id)=>page.getByTestId(`widget-dashboard-${id}`);
  await widget(oldSingle,'car-old').getByTestId('input').fill('이전 탭 입력');await widget(oldSingle,'car-old').getByTestId('increment').click();
  await check('duplicate widgets and another major version require complete transitive bindings',async()=>{
    await add(1,copyItem);await add(2,newItem);await admin.getByTestId('preview').click();await admin.getByTestId('admin-error').filter({hasText:'하위 버전'}).waitFor();assert(await admin.getByTestId('apply').isDisabled());assert.equal(store.current().compositionId,single.compositionId);
    await admin.getByTestId('dashboard-row-2').locator('.menu-dependency select').selectOption(paths.C.id);await add(3,summaryItem);assert.equal(await admin.getByTestId('dashboard-row-3').locator('.menu-dependency select').inputValue(),paths.C.id);await preview();multiple=await apply();assert.equal(multiple.selected.shell,shell.id);
  });
  const product=await open();
  await check('real B versions, duplicate instances and distinct modules share one SDK without state/style/cache/portal collisions',async()=>{
    currentPage=product;for(const[id,version]of [['car-old','1.4.0'],['car-copy','1.4.0'],['car-new','2.1.0']]){await widget(product,id).waitFor();assert.equal(await widget(product,id).getByTestId('version').innerText(),version);assert.equal(await widget(product,id).getByTestId('platform-version').innerText(),'1.3.1');}
    await product.getByTestId('summary-dashboard-totals').waitFor();
    await widget(product,'car-old').getByTestId('input').fill('대시보드 유지');await widget(product,'car-old').getByTestId('cache-write').click();await widget(product,'car-old').getByTestId('increment').click();
    for(const id of ['car-copy','car-new']){assert.equal(await widget(product,id).getByTestId('count').innerText(),'0');assert.equal(await widget(product,id).getByTestId('input').inputValue(),'');await widget(product,id).getByTestId('cache-read').click();assert.equal(await widget(product,id).getByTestId('cache-value').innerText(),'');}
    assert.notEqual(await widget(product,'car-old').getByTestId('increment').evaluate(e=>getComputedStyle(e).backgroundColor),await widget(product,'car-new').getByTestId('increment').evaluate(e=>getComputedStyle(e).backgroundColor));
    for(const id of ['car-old','car-copy','car-new']){await widget(product,id).getByTestId('open-popup').click();assert.equal(await product.locator(`[data-portal-scope="dashboard-${id}"] [role=dialog]`).count(),1);}
    await product.getByTestId('summary-dashboard-totals').getByTestId('summary-increment').click();assert.equal(await product.getByTestId('summary-count').innerText(),'1');
    const proof=await product.evaluate(async ids=>{const r=window.__MFE_RUNTIME__,sdk=(await(await r.getContainer('platform')).get('./sdk'))(),identities=[];for(const id of ids){const identity=(await(await r.getArtifactContainer(r.registry.artifacts[id])).get('./Widget'))().getIdentity();identities.push({id,react:identity.react===sdk.ReactIdentity,context:identity.context===sdk.PlatformContext});}return{identities,diagnostics:r.getDiagnostics()};},[b1.id,b2.id]);assert(proof.identities.every(i=>i.react&&i.context));report.runtime=proof;
  });
  await check('moving between a menu page and dashboard preserves separate state and hides dashboard portals',async()=>{
    await product.getByTestId('menu-link-vehicles').click();await product.getByTestId('widget-menu-vehicles').waitFor();assert.equal(await product.getByTestId('widget-menu-vehicles').getByTestId('count').innerText(),'0');assert(!(await product.getByTestId('popup-dashboard-car-old').isVisible()));
    await product.getByTestId('dashboard-link').click();assert.equal(await widget(product,'car-old').getByTestId('input').inputValue(),'대시보드 유지');await product.getByTestId('popup-dashboard-car-old').waitFor({state:'visible'});
    for(const id of ['car-old','car-copy','car-new'])await product.getByTestId(`popup-dashboard-${id}`).getByTestId('close-popup').click();
  });
  await check('order, width and titles update through preview; old tabs retain the previous placement snapshot',async()=>{
    for(const index of [3,2,1])await admin.getByTestId(`dashboard-up-${index}`).click();await preview();await admin.getByTestId('dashboard-title-0').fill('전체 차량 요약');assert(await admin.getByTestId('apply').isDisabled());await admin.getByTestId('dashboard-span-3').selectOption('2');await preview();arranged=await apply();
    assert.deepEqual(arranged.dashboard.map(i=>i.id),['totals','car-old','car-copy','car-new']);
    const tab=await open();await widget(tab,'car-new').waitFor();const box=async id=>await tab.getByTestId(`dashboard-tile-${id}`).boundingBox();const top=await box('totals'),left=await box('car-old'),right=await box('car-copy'),bottom=await box('car-new');assert(top.width>left.width*1.8);assert(Math.abs(left.y-right.y)<2);assert(right.x>left.x);assert(bottom.y>left.y);assert(bottom.width>left.width*1.8);await tab.close();
    assert.equal(await oldSingle.getByTestId('dashboard-tile-car-new').count(),0);assert.equal(await widget(oldSingle,'car-old').getByTestId('input').inputValue(),'이전 탭 입력');
    assert.deepEqual(await product.locator('[data-testid^="dashboard-tile-"]').evaluateAll(nodes=>nodes.map(n=>n.dataset.testid)),['dashboard-tile-car-old','dashboard-tile-car-copy','dashboard-tile-car-new','dashboard-tile-totals']);
  });
  let e;
  await check('a new E service/widget is built and published after dashboard deployment, then selected without a Shell build',async()=>{
    const dir=await prepare('service-e',path.join(integration,'templates/service-e'));await run(['npm','run','build'],dir);e=store.publish(dir);report.widgets.e=e;
    await refresh();await add(4,{id:'notifications',title:'서비스 E 알림',artifactId:e.id,widgetId:'notifications',span:2});await preview();finalLayout=await apply();assert.equal(finalLayout.selected.shell,shell.id);assert.deepEqual(fingerprint(path.join(root,'projects/shell'),true),protectedProjects.shell);
  });
  const currentProduct=await open();
  await check('newly published E runs beside both B versions; desktop/mobile layout and shared user context work',async()=>{
    await currentProduct.getByTestId('service-e-dashboard-notifications').waitFor();await widget(currentProduct,'car-new').waitFor();assert.equal(await currentProduct.getByTestId('e-user').innerText(),'김개발');assert.equal(await currentProduct.getByTestId('e-sdk').innerText(),'1.3.1');
    assert.equal(await product.getByTestId('service-e-dashboard-notifications').count(),0);
    await currentProduct.screenshot({path:path.join(output,'dashboard-desktop.png'),fullPage:true});
    for(const width of [390,320]){await currentProduct.setViewportSize({width,height:844});assert(await currentProduct.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));const tiles=await currentProduct.locator('[data-testid^="dashboard-tile-"]').evaluateAll(nodes=>nodes.map(n=>({x:n.getBoundingClientRect().x,w:n.getBoundingClientRect().width})));assert(tiles.every(t=>Math.abs(t.x-tiles[0].x)<1&&Math.abs(t.w-tiles[0].w)<1));}
    await currentProduct.screenshot({path:path.join(output,'dashboard-mobile.png'),fullPage:true});
  });
  for(const failure of ['B entry','D entry'])await check(`${failure} failure is isolated; retry recovers B 2.1 widgets without resetting B 1.4`,async()=>{
    const tab=await context.newPage();currentPage=tab;const failed=url+(failure==='B entry'?b2.entry:paths.C.entry);
    const matchesFailedFile=candidate=>{const normalized=new URL(candidate);normalized.searchParams.delete('mfe_retry');return normalized.href===failed;};
    await tab.route(matchesFailedFile,r=>r.fulfill({status:503,contentType:'text/javascript',body:'unavailable'}));await tab.goto(url+'/');
    await tab.getByTestId('remote-error-dashboard-car-new').waitFor();await tab.getByTestId('remote-error-dashboard-totals').waitFor();await widget(tab,'car-old').getByTestId('input').fill('실패 중 보존');await widget(tab,'car-old').getByTestId('increment').click();
    const marker=await tab.evaluate(()=>window.__dashboardProof=crypto.randomUUID());await tab.getByTestId('retry-dashboard-car-new').click();await tab.getByTestId('remote-error-dashboard-car-new').waitFor();
    await tab.unroute(matchesFailedFile);await tab.getByTestId('retry-dashboard-car-new').click();await widget(tab,'car-new').waitFor();await tab.getByTestId('retry-dashboard-totals').click();await tab.getByTestId('summary-dashboard-totals').waitFor();
    assert.equal(await tab.evaluate(()=>window.__dashboardProof),marker);assert.equal(await widget(tab,'car-old').getByTestId('count').innerText(),'1');assert.equal(await widget(tab,'car-old').getByTestId('input').inputValue(),'실패 중 보존');await tab.close();
  });
  async function state(){return await(await fetch(url+'/api/admin/state')).json();}
  async function post(action,body){const s=await state(),r=await fetch(url+'/api/admin/'+action,{method:'POST',headers:{'Content-Type':'application/json',Origin:url,'X-MFE-CSRF':s.csrfToken},body:JSON.stringify(body)});return{status:r.status,body:await r.json()};}
  function payload(items=store.current().dashboard){const c=store.current(),bindings=structuredClone(c.runtimeBindings);delete bindings[shell.id];return{expectedCompositionId:c.compositionId,selected:c.selected,runtimeBindings:bindings,navigation:c.navigation,dashboard:items};}
  await check('API rejects unpublished widgets, arbitrary props/modules, invalid sizes, duplicates, bad dependencies and stale/tampered review',async()=>{
    const current=store.current();for(const items of [[{...oldItem,widgetId:'helper'}],[{...oldItem,artifactId:sdk.id}],[oldItem,oldItem],[{...oldItem,span:3}],[{...oldItem,props:{token:'not-allowed'}}],[{...oldItem,exposedModule:'./helper'}]])assert.equal((await post('preview',payload(items))).status,422);
    const bad=payload();bad.runtimeBindings[b2.id].d=paths.A.id;assert.equal((await post('preview',bad)).status,422);
    // A fixed reference back to the entry Shell must never bypass graph checks.
    // This intentionally corrupts only the disposable catalog, then restores it.
    const savedCatalog=store.read('catalog.json',{});
    const replaceTestCatalog=catalog=>store.withStoreLock(()=>{const filename=path.join(temporary,'store/catalog.json');write(filename+'.dashboard-test',catalog);fs.renameSync(filename+'.dashboard-test',filename);});
    try {
      replaceTestCatalog({...savedCatalog,[b1.id]:{...savedCatalog[b1.id],dependencies:{...savedCatalog[b1.id].dependencies,invalidHost:shell.id}}});
      const invalidHost=await post('preview',payload());assert.equal(invalidHost.status,422);assert.match(invalidHost.body.error,/must select a remote/);
    } finally { replaceTestCatalog(savedCatalog); }

    assert.equal((await post('preview',{...payload(),expectedCompositionId:single.compositionId})).status,409);
    const proposed=current.dashboard.map((i,index)=>index?i:{...i,title:'제안 제목'}),review=await post('preview',payload(proposed));assert.equal(review.status,200);
    assert.equal((await post('apply',{...payload(proposed.map((i,index)=>index?i:{...i,title:'다른 제목'})),previewedCompositionId:review.body.composition.compositionId})).status,422);assert.equal(store.current().compositionId,current.compositionId);
  });
  await check('support-ended widgets may keep existing placements but cannot add a copy or change the chosen public widget',async()=>{
    const policy=life.saveLifecycle({artifactId:b2.id,expectedRevision:0,supportEndsOn:'2000-01-01',noticeReference:'dashboard proof'});
    assert.equal((await post('preview',payload([...finalLayout.dashboard].reverse()))).status,200);
    assert.equal((await post('preview',payload([...finalLayout.dashboard,{...newItem,id:'extra'}]))).status,422);
    assert.equal((await post('preview',payload(finalLayout.dashboard.map(item=>item.id==='car-new'?{...item,widgetId:'summary'}:item)))).status,422);
    await refresh();await admin.getByTestId('dashboard-artifact-3').locator(`option[value="${b2.id}"][disabled]`).waitFor({state:'attached'});
    life.saveLifecycle({artifactId:b2.id,expectedRevision:policy.revision,supportEndsOn:null,noticeReference:''});await refresh();
  });
  await check('usage tracking contains each placement and transitive dependency',async()=>{
    const paths=life.usagePaths(finalLayout);assert(paths.some(p=>p.artifactId===e.id&&p.aliases.includes('dashboard/notifications:notifications:./Widget')));assert(paths.some(p=>p.artifactId===b2.id&&p.aliases.includes('dashboard/totals:summary:./Summary')));assert(paths.some(p=>p.artifactId===report.widgets.b2.id&&p.aliases.includes('dashboard/car-new:car-picker:./Widget')));
    assert(paths.some(p=>p.artifactId===finalLayout.runtimeBindings[b2.id].d&&p.path.includes(b2.id)&&p.aliases.includes('dashboard/totals:summary:./Summary')));
  });
  await check('clearing all widgets persists an empty dashboard; old tabs and rollback references still protect files',async()=>{
    await admin.getByTestId('clear-dashboard').click();await preview();const cleared=await apply();assert.deepEqual(cleared.dashboard,[]);const tab=await open();await tab.getByTestId('registered-dashboard').waitFor();assert.equal(await tab.locator('[data-testid^="dashboard-tile-"]').count(),0);
    assert.deepEqual(await tab.evaluate(()=>window.__MFE_RUNTIME__.getDiagnostics().loadedContainerIds),[sdk.id]);await tab.close();
    assert.equal(await currentProduct.getByTestId('service-e-dashboard-notifications').count(),1);assert.equal(await widget(product,'car-old').getByTestId('input').inputValue(),'대시보드 유지');
    const usage=life.lifecycleState().releases.find(r=>r.artifact.id===e.id);assert.equal(usage.currentPaths.length,0);assert(usage.deletion.blockers.some(b=>b.code==='OPEN_TABS'));assert(usage.deletion.blockers.some(b=>b.code==='ROLLBACK'));
    assert.equal((await post('releases/delete',{artifactId:e.id,expectedRevision:usage.lifecycle.revision,reason:'대시보드 삭제 보호 검증'})).status,409);assert(fs.existsSync(path.join(temporary,'store/artifacts',e.id,'remoteEntry.js')));
  });
  await check('UI rollback restores exact widget order/width/version, keeps pages and preserves existing tab state',async()=>{
    await admin.getByPlaceholder('버전 또는 조합 검색').fill(finalLayout.compositionId);await admin.getByTestId(`history-${finalLayout.compositionId}`).getByRole('button',{name:'불러오기'}).click();await preview();const restored=await apply();assert.equal(restored.compositionId,finalLayout.compositionId);
    const tab=await open();await tab.getByTestId('service-e-dashboard-notifications').waitFor();assert.deepEqual(await tab.locator('[data-testid^="dashboard-tile-"]').evaluateAll(nodes=>nodes.map(n=>n.dataset.testid)),finalLayout.dashboard.map(i=>'dashboard-tile-'+i.id));assert.equal(await tab.getByTestId('menu-link-vehicles').count(),1);await tab.close();
    assert.equal(await widget(oldSingle,'car-old').getByTestId('input').inputValue(),'이전 탭 입력');
    const pinned=await open(`/compositions/${empty.compositionId}.html`);await pinned.getByTestId('registered-dashboard').waitFor();assert.equal(await pinned.locator('[data-testid^="dashboard-tile-"]').count(),0);await pinned.close();
    store.rollback(legacy.compositionId);assert(!Object.hasOwn(store.current(),'dashboard'));store.rollback(finalLayout.compositionId);await refresh();
  });
  await check('Shell and SDK/business originals remain byte-and-mtime identical throughout all layout changes',async()=>{
    assert.deepEqual(fingerprint(path.join(temporary,'store/artifacts',shell.id),true),shellBytes);for(const[name,value]of Object.entries(protectedProjects))assert.deepEqual(fingerprint(path.join(root,'projects',name),true),value,name);
    assert.equal(fs.readFileSync(path.join(root,'artifact-store/current.json'),'utf8'),originalPointer);assert.deepEqual(report.pageErrors,[]);report.protectedProjects=protectedProjects;report.shellFiles=shellBytes;report.shellBuildsDuringPlacement=0;
  });
  await admin.getByPlaceholder('버전 또는 조합 검색').fill('');await admin.getByTestId('dashboard-preview').evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));await admin.screenshot({path:path.join(output,'dashboard-admin.png')});
  await admin.setViewportSize({width:390,height:844});assert(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await admin.getByTestId('dashboard-row-0').evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));await admin.screenshot({path:path.join(output,'dashboard-admin-mobile.png')});
  const retained=fs.mkdtempSync(path.join(replay,'verified-'));fs.cpSync(temporary,retained,{recursive:true,filter:file=>!['node_modules','.mfe-dev'].includes(path.basename(file))});fs.rmSync(path.join(retained,'store/usage.json'),{force:true});
  write(path.join(retained,'scenario.json'),{composition:finalLayout,shell,sdk,widgets:report.widgets,builtForWidgetPublication:['service-b-v1','service-b-v2','service-e'],shellBuildsDuringPlacement:0});write(path.join(replay,'latest.json'),{directory:retained});report.retained=retained;report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;console.error(error);await currentPage?.screenshot({path:path.join(output,'dashboard-failure.png'),fullPage:true}).catch(()=>{});
}finally{
  await browser?.close();for(const child of processes)if(child.exitCode===null&&child.signalCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');});
  fs.rmSync(temporary,{recursive:true,force:true});report.finishedAt=new Date().toISOString();report.passedChecks=report.checks.filter(x=>x.status==='passed').length;
  write(path.join(output,'dashboard.json'),report);console.log(`Dashboard ${report.status}: ${report.passedChecks}/${report.checks.length}`);
}
