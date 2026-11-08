import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const integration = fileURLToPath(new URL('../', import.meta.url));
const root = path.resolve(integration, '..'), output = path.join(integration, 'artifacts/verification');
const originalStore = process.env.MFE_ARTIFACT_STORE;
const report = { status: 'running', checks: [], startedAt: new Date().toISOString(), consumerBuildsExecuted: 0, pageErrors: [], scope: 'Historical pre-lease Shell and frozen original telemetry in real browsers; retrofit transition bridge, navigation acknowledgement, per-artifact access fence and reference cleanup. Disposable storage only; elapsed dates are seeded in metadata.' };
let temporary, server, browser, page;
async function check(name, action) { try { await action(); report.checks.push({ name, status: 'passed' }); console.log(`PASS ${name}`); } catch (error) { report.checks.push({ name, status: 'failed', error: error.message }); throw error; } }
async function fingerprint(directory) {
  const hash = createHash('sha256');
  async function walk(dir) { for (const item of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (['node_modules', '.git', 'usage.json', '.write-lock'].includes(item.name)) continue;
    const filename = path.join(dir, item.name); if (item.isDirectory()) await walk(filename); else hash.update(path.relative(directory, filename)).update('\0').update(await readFile(filename)).update('\0');
  } }
  await walk(directory); return hash.digest('hex');
}
async function startServer() {
  server = spawn(process.execPath, ['tools/serve.cjs'], { cwd: integration, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => { let log = ''; const timer = setTimeout(() => reject(new Error(log || 'Server not ready')), 10000);
    server.on('error', (e) => { clearTimeout(timer); reject(e); }); server.stderr.on('data', (c) => { log += c; });
    server.stdout.on('data', (c) => { log += c; const m = log.match(/http:\/\/127\.0\.0\.1:\d+/); if (m) { clearTimeout(timer); resolve(m[0]); } });
  });
}
async function stopServer() {
  if (server?.exitCode === null && server.signalCode === null) await new Promise((resolve) => {
    // A paused legacy browser can retain an unfinished HTTP connection. The
    // restart proof needs a stopped process, not an unbounded graceful drain.
    const timeout = setTimeout(() => {
      report.forcedTestServerStops = (report.forcedTestServerStops || 0) + 1;
      server.kill('SIGKILL');
    }, 3000);
    server.once('exit', () => { clearTimeout(timeout); resolve(); });
    server.kill('SIGTERM');
  });
}
async function eventually(action) { const end = Date.now() + 10000; while (true) { try { return await action(); } catch (error) { if (Date.now() > end) throw error; await new Promise((r) => setTimeout(r, 100)); } } }
await mkdir(output, { recursive: true });
try {
  const sourceStore = originalStore || path.join(root, 'artifact-store');
  const projectHash = await fingerprint(path.join(root, 'projects')), liveHash = await fingerprint(sourceStore);
  temporary = await mkdtemp(path.join(os.tmpdir(), 'mfe-legacy-transition-proof-'));
  process.env.MFE_ARTIFACT_STORE = path.join(temporary, 'store');
  const require = createRequire(import.meta.url);
  const { publish, activate, rollback, preview, selectAdmin, read, current, updateMetadata } = require('../tools/store.cjs');
  const { lifecycleState, recordUsage, POLICY } = require('../tools/lifecycle.cjs');
  const { deleteReleaseFiles } = require('../tools/retirement.cjs');
  const releases = {};
  for (const name of ['platform-sdk', 'shell', 'service-a', 'service-c', 'service-b-v1', 'service-b-v2', 'service-d-v1', 'service-d-v2']) releases[name] = publish(path.join(root, 'projects', name));
  const dProof = JSON.parse(await readFile(path.join(output, 'dependency-upgrade.json'), 'utf8'));
  const bProof = JSON.parse(await readFile(path.join(output, 'business-upgrade.json'), 'utf8'));
  const sdkProof = JSON.parse(await readFile(path.join(output, 'sdk-upgrade.json'), 'utf8'));
  const targetDirectory = dProof.retainedReleases['service-d-v1'];
  const target = publish(targetDirectory), alternate = releases['service-d-v1'];
  const newB = publish(bProof.retainedReleases['service-b-v1']), newSDK = publish(sdkProof.retainedRelease);
  const bA = releases['service-b-v1'].id, bC = releases['service-b-v2'].id;
  const legacyProject=path.join(temporary,'historical-shell');
  await cp(path.join(sourceStore,'artifacts','shell_1_0_0_a79c427e3f86'),path.join(legacyProject,'dist'),{recursive:true});
  const legacyShell=publish(legacyProject);
  const initial = activate({ platform: releases['platform-sdk'].id, shell: legacyShell.id, A: releases['service-a'].id, C: releases['service-c'].id }, {
    [releases['service-a'].id]: { b: bA }, [releases['service-c'].id]: { b: bC }, [bA]: { d: target.id }, [bC]: { d: releases['service-d-v2'].id },
  });
  selectAdmin(publish(path.join(root, 'projects/platform-admin')).id);
  const targetPath = path.join(process.env.MFE_ARTIFACT_STORE, 'artifacts', target.id);
  const targetHash = await fingerprint(targetPath);
  const aged = new Date(Date.now() - 100 * 86400000).toISOString();
  const pastDate = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
  function seedPolicy(id, changes) { updateMetadata('lifecycle.json', (data) => { data ||= { releases: {} }; const old = data.releases[id] || { revision: 0 }; data.releases[id] = { ...old, ...changes, revision: old.revision + 1 }; return data; }); }
  function agedPolicy(id) { seedPolicy(id, { supportEndsOn: pastDate, noticeReference: '임시 검증 저장소의 과거 공지', noticeRecordedAt: aged }); }
  function ageEvidence() { updateMetadata('usage.json', (data) => { data.startedAt = aged; for (const session of Object.values(data.sessions)) { session.lastSeenAt = aged; if (session.closedAt) session.closedAt = aged; } return data; }); }
  let baseURL = await startServer(), token;
  async function refreshToken() { token = (await (await fetch(`${baseURL}/api/admin/state`)).json()).csrfToken; }
  await refreshToken();
  async function post(endpoint, body, headers = {}) { const response = await fetch(`${baseURL}/api/admin/${endpoint}`, { method: 'POST', headers: { Origin: baseURL, 'Content-Type': 'application/json', 'X-MFE-CSRF': token, ...headers }, body: JSON.stringify(body) }); return { status: response.status, body: await response.json() }; }
  async function state() { return (await fetch(`${baseURL}/api/admin/lifecycle`)).json(); }
  async function item(id = target.id) { return (await state()).releases.find((r) => r.artifact.id === id); }
  function selection(d = target.id, b = bA, platform = current().selected.platform) { const snapshot = current(), bindings = structuredClone(snapshot.runtimeBindings); const oldB = bindings[snapshot.selected.A].b; if (oldB !== b) delete bindings[oldB]; bindings[snapshot.selected.A].b = b; bindings[b] = { d }; return { expectedCompositionId: snapshot.compositionId, selected: { ...snapshot.selected, platform }, runtimeBindings: bindings }; }
  async function select(body) { const inspected = await post('preview', body); assert.equal(inspected.status, 200, inspected.body.error); const applied = await post('apply', { ...body, previewedCompositionId: inspected.body.composition.compositionId }); assert.equal(applied.status, 200, applied.body.error); return applied.body.composition; }
  async function releaseBody(id = target.id) { const release = await item(id); return { artifactId: id, expectedCompositionId: current().compositionId, expectedRevision: release.lifecycle.revision, confirmationId: id, reason: '독립된 임시 저장소에서 검증', externalUsageChecked: true }; }
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE_PATH || (fs.existsSync(chrome) ? chrome : undefined) });
  report.browserVersion = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  context.on('page', (p) => p.on('pageerror', (e) => report.pageErrors.push(e.message)));
  page = await context.newPage();
  // Playwright's clock is context-wide; keep the offline clock isolated so the
  // healthy control tab continues to run on real time.
  const old = await context.newPage();
  async function openTarget(id = target.id) { await page.goto(`${baseURL}/admin?check=${Date.now()}#lifecycle`, { waitUntil: 'networkidle' }); await page.getByTestId(`release-${id}`).click(); }
  async function fillConfirmation(id, external = false) { await page.getByLabel('작업 대상 전체 ID', { exact: true }).fill(id); await page.getByLabel('작업 사유', { exact: true }).fill('임시 저장소의 수명 종료 검증'); if (external) await page.locator('.external-confirm input').check(); }

  async function openLegacy(){const section=page.locator('.legacy-controls');if(!await section.evaluate(el=>el.open))await section.locator('summary').click();}
  const disconnected=await context.newPage(), failed=await context.newPage();
  const isolatedContext=await browser.newContext();const isolated=await isolatedContext.newPage();
  let oldId,lostId,failedId,isolatedId,healthy,healthyId,middle;
  const oldTracker=await readFile(path.join(integration,'tests/fixtures/pre-lease-usage.js'),'utf8');
  async function oldPage(tab){
    await tab.route('**/runtime-usage.js',route=>route.fulfill({contentType:'text/javascript',body:oldTracker}));
    await tab.route('**/runtime-lease.js',route=>route.fulfill({contentType:'text/javascript',body:'/* pre-lease host: no guard */'}));
    let id;
    tab.on('request',req=>{if(req.url().endsWith('/api/runtime/usage')){try{id=JSON.parse(req.postData()).sessionId;}catch{}}});
    await tab.goto(baseURL+'/?empty=1',{waitUntil:'networkidle'});await tab.getByTestId('add-a').waitFor();
    await eventually(async()=>assert(id&&read('usage.json').sessions[id]));
    // The old document keeps its already-loaded code; later navigations must
    // receive the real current host scripts, not the historical fixture.
    await tab.unroute('**/runtime-usage.js');await tab.unroute('**/runtime-lease.js');return id;
  }
  const session=id=>read('usage.json').sessions[id];
  const editSession=(id,changes)=>updateMetadata('usage.json',data=>{Object.assign(data.sessions[id],changes);return data;});
  const transitionBody=id=>({sessionId:id,expectedSequence:session(id).sequence,confirmationId:id,reason:'임시 저장소의 구형 탭 전환',unsavedInputAcknowledged:true});
  async function legacyBody(id,artifactId=target.id){const r=await item(artifactId);return{sessionId:id,artifactId,expectedSequence:session(id).sequence,expectedAccessRevokedAt:r.lifecycle.accessRevokedAt,confirmationId:id,reason:'파일 접근 종료 후 이 버전 참조만 정리'};}
  async function fenceBody(){return{...await releaseBody(),serviceInterruptionAcknowledged:true};}
  async function pulse(id,event='heartbeat'){
    const config=await(await fetch(baseURL+'/api/runtime/config')).json();
    const response=await fetch(baseURL+'/api/runtime/usage',{method:'POST',headers:{Origin:baseURL,'Content-Type':'application/json'},body:JSON.stringify({token:config.token,sessionId:id,compositionId:initial.compositionId,sequence:session(id).sequence+1,event,loadedArtifactIds:[]})});return{status:response.status,body:await response.json()};
  }
  async function confirmForm(id,ackCount=0){await page.getByLabel('구형 탭 작업 대상 전체 ID').fill(id);await page.getByLabel('구형 탭 작업 사유').fill('독립 검증 저장소의 전환 작업');const checks=page.locator('.legacy-controls .external-confirm input');for(let i=0;i<ackCount;i++)await checks.nth(i).check();await page.getByTestId('confirm-legacy-action').click();await page.locator('[data-testid=legacy-saved],[data-testid=legacy-error]').waitFor();assert.equal(await page.getByTestId('legacy-error').count(),0,await page.locator('.legacy-controls').innerText());}

  await check('real historical Shell and original response-ignoring telemetry run before any bridge exists',async()=>{
    oldId=await oldPage(old);lostId=await oldPage(disconnected);failedId=await oldPage(failed);isolatedId=await oldPage(isolated);
    assert.equal(await old.evaluate(()=>typeof __MFE_TAB_GUARD__),'undefined');assert.equal(session(oldId).protocol,undefined);
    assert.equal(await old.evaluate(()=>__MFE_RUNTIME__.registry.shell.id),legacyShell.id);
    await old.getByTestId('add-a').click();await old.getByTestId('widget-A').getByTestId('dependency').waitFor();
    report.historicalShell=legacyShell.id;report.telemetryHash=createHash('sha256').update(oldTracker).digest('hex');
  });
  await check('UI installs a same-origin bridge that controls an already-open unchanged legacy tab',async()=>{
    middle=activate({shell:releases.shell.id});
    await openTarget();await openLegacy();
    await page.getByTestId('install-transition-bridge').click();await page.getByTestId('transition-bridge-status').waitFor();
    await old.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/transition-worker.js'));
    const before=session(oldId).sequence;
    await old.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
    await eventually(async()=>assert(session(oldId).sequence>before&&session(oldId).bridge?.clientId));
    assert.equal(await old.evaluate(()=>__MFE_RUNTIME__.registry.shell.id),legacyShell.id);
    assert.equal(await old.evaluate(()=>typeof __MFE_TAB_GUARD__),'undefined');
    assert.equal(await isolated.evaluate(()=>navigator.serviceWorker.controller),null);
  });
  await check('transition commands require confirmation, current evidence and a same-origin administrator request',async()=>{
    const body=transitionBody(oldId);
    assert.equal((await post('sessions/transition',{...body,unsavedInputAcknowledged:false})).status,422);
    assert.equal((await post('sessions/transition',{...body,confirmationId:'wrong'})).status,422);
    assert.equal((await post('sessions/transition',{...body,expectedSequence:0})).status,409);
    assert.equal((await post('sessions/transition',body,{'X-MFE-CSRF':''})).status,403);
    assert.equal((await post('sessions/transition',body,{Origin:'https://example.invalid'})).status,403);
    assert.equal((await post('sessions/transition',{...body,sessionId:'constructor',confirmationId:'constructor'})).status,422);
  });
  await check('UI transition navigates the original tab and releases references only after a new document confirms',async()=>{
    // Drop the old page's close beacon; confirmation must prove the navigation.
    await old.evaluate(()=>{navigator.sendBeacon=()=>true;});
    await openTarget();await openLegacy();
    await page.getByTestId(`prepare-transition-${oldId}`).click();await confirmForm(oldId,1);
    assert(session(oldId).transition);assert.equal(session(oldId).releasedAt,undefined);
    await old.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
    await eventually(async()=>assert(session(oldId).transition.confirmedAt));
    await old.waitForFunction(()=>window.__MFE_TAB_GUARD__?.isManaged() && Boolean(window.__MFE_RUNTIME__));
    assert.equal(await old.evaluate(()=>__MFE_RUNTIME__.registry.shell.id),releases.shell.id);
    assert(session(oldId).releasedAt);assert.equal(session(oldId).closedAt,null);
    assert.equal((await item()).sessions.find(s=>s.id===oldId).transition.ticket,undefined,'No transition ticket leaks through the management API');
    await old.close();
  });
  await check('failed confirmation never pretends a transition completed; retry is idempotent',async()=>{
    await failed.evaluate(()=>{navigator.sendBeacon=()=>true;});
    await failed.route('**/api/runtime/transition-confirm',route=>route.abort());
    assert.equal((await post('sessions/transition',transitionBody(failedId))).status,200);
    await failed.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
    await failed.waitForURL('**/legacy-transition/*');
    await eventually(async()=>assert.match(await failed.locator('#transition-status').innerText(),/확인|fetch/i));
    assert.equal(session(failedId).releasedAt,undefined);assert.equal(session(failedId).closedAt,null);
    assert((await item()).sessions.some(s=>s.id===failedId&&s.status==='recent'));
    await failed.unroute('**/api/runtime/transition-confirm');await failed.getByRole('button',{name:'전환 확인 다시 시도'}).click();
    await eventually(async()=>assert(session(failedId).transition.confirmedAt));
    const ticket=session(failedId).transition.ticket, confirmed=session(failedId).transition.confirmedAt;
    const config=await(await fetch(baseURL+'/api/runtime/config')).json();
    const response=await fetch(baseURL+'/api/runtime/transition-confirm',{method:'POST',headers:{Origin:baseURL,'Content-Type':'application/json'},body:JSON.stringify({token:config.token,ticket})});
    assert.equal(response.status,200);assert.equal(session(failedId).transition.confirmedAt,confirmed);
    await failed.waitForFunction(()=>window.__MFE_TAB_GUARD__?.isManaged() && Boolean(window.__MFE_RUNTIME__));await failed.close();
  });
  await check('a browser without the bridge remains pending and no acknowledgement means no release',async()=>{
    assert.equal((await post('sessions/transition',transitionBody(isolatedId))).status,200);
    const before=session(isolatedId).sequence;
    await isolated.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
    await eventually(async()=>assert(session(isolatedId).sequence>before));
    assert.equal(await isolated.evaluate(()=>__MFE_RUNTIME__.registry.shell.id),legacyShell.id);
    assert.equal(session(isolatedId).releasedAt,undefined);
    assert.equal((await post('sessions/transition',transitionBody(isolatedId))).status,409);
  });
  await check('current usage, protected tabs, recent legacy tabs and rollback references prevent access termination',async()=>{
    healthy=await context.newPage();await healthy.goto(baseURL+'/?empty=1',{waitUntil:'networkidle'});healthyId=await healthy.evaluate(()=>__MFE_TAB_GUARD__.diagnostics().sessionId);
    assert.equal((await post('releases/revoke-access',await fenceBody())).status,409);
    activate({}, {[bA]:{d:alternate.id}});agedPolicy(target.id);
    assert.equal((await post('releases/unregister',await releaseBody())).status,200);seedPolicy(target.id,{unregisteredAt:aged});
    const blocked=await post('releases/revoke-access',await fenceBody());assert.equal(blocked.status,409);assert.match(blocked.body.error,/보호 탭/);assert.match(blocked.body.error,/구형 탭/);assert.match(blocked.body.error,/롤백/);
    assert.equal((await fetch(baseURL+target.entry)).status,200);
  });
  await check('access termination rechecks new heartbeats and retains protection for fixed consumers',async()=>{
    await healthy.close();await eventually(async()=>assert(session(healthyId).closedAt));
    for(const snapshot of [initial,middle])assert.equal((await post('compositions/retire',{compositionId:snapshot.compositionId,expectedCompositionId:current().compositionId,expectedRevision:0,confirmationId:snapshot.compositionId,reason:'임시 검증'})).status,200);
    // Freeze the actual surviving legacy contexts without close delivery.
    const cdp=await context.newCDPSession(disconnected);await cdp.send('Page.setWebLifecycleState',{state:'frozen'});report.frozenClient='Chrome Page.setWebLifecycleState';
    await isolatedContext.setOffline(true);
    editSession(lostId,{lastSeenAt:aged});editSession(isolatedId,{lastSeenAt:aged});
    // A late old heartbeat after preview must block the action at commit time.
    assert((await item()).accessFence.eligible);await pulse(isolatedId);
    assert.equal((await post('releases/revoke-access',await fenceBody())).status,409);
    editSession(isolatedId,{lastSeenAt:aged});
    const pinProject=path.join(temporary,'pin');await cp(path.join(root,'projects/service-b-v1/dist'),path.join(pinProject,'dist'),{recursive:true});
    const meta=JSON.parse(await readFile(path.join(pinProject,'dist/release.json'),'utf8'));Object.assign(meta,{id:'b_legacy_pin_00001',name:'b_legacy_pin_00001',dependencies:{d:target.id},runtimeDependencies:{}});await writeFile(path.join(pinProject,'dist/release.json'),JSON.stringify(meta));const pin=publish(pinProject);
    assert.equal((await post('releases/revoke-access',await fenceBody())).status,409);
    // This is a metadata-only storage guard fixture, never executed as code.
    agedPolicy(pin.id);assert.equal((await post('releases/unregister',await releaseBody(pin.id))).status,200);seedPolicy(pin.id,{unregisteredAt:aged});
    updateMetadata('usage.json',data=>{data.startedAt=aged;return data;});assert.equal((await post('releases/delete',await releaseBody(pin.id))).status,200);
  });
  await check('UI access termination preserves bytes but consistently denies all paths to this artifact',async()=>{
    const missingAck=await fenceBody();assert.equal((await post('releases/revoke-access',{...missingAck,serviceInterruptionAcknowledged:false})).status,422);
    assert.equal((await post('releases/revoke-access',{...missingAck,externalUsageChecked:false})).status,422);
    await openTarget();await openLegacy();await page.getByTestId('prepare-access-fence').click();await confirmForm(target.id,2);
    await page.getByTestId('access-revoked').waitFor();assert.equal(await fingerprint(targetPath),targetHash);
    for(const route of [target.entry,`/artifacts/${target.id}/release.json`,`/artifacts/${target.id}/missing-chunk.js`,`/artifacts/${target.id}/x/../remoteEntry.js`]){const result=await fetch(baseURL+route);assert.equal(result.status,410);assert.equal(result.headers.get('x-mfe-transition'),'required');}
    assert.equal((await fetch(baseURL+alternate.entry)).status,200);
    assert.equal((await post('releases/delete',await releaseBody())).status,409);
    await page.locator('.legacy-controls').screenshot({path:path.join(output,'legacy-access-ended.png')});
  });
  await check('legacy reference cleanup requires a fence and grace period and only releases the selected artifact',async()=>{
    assert.equal((await post('sessions/release-legacy',await legacyBody(lostId))).status,409);
    assert.equal((await post('sessions/release-legacy',await legacyBody(lostId,releases['platform-sdk'].id))).status,409);
    seedPolicy(target.id,{accessRevokedAt:aged});
    await openTarget();await openLegacy();await page.getByTestId(`prepare-legacy-release-${lostId}`).click();await confirmForm(lostId);
    assert(session(lostId).legacyReleases[target.id]);assert.equal(session(lostId).releasedAt,undefined);
    assert.equal((await item()).sessions.find(s=>s.id===lostId).status,'released');
    assert.equal((await item(releases['platform-sdk'].id)).sessions.find(s=>s.id===lostId).status,'unknown');
    assert((await item()).deletion.blockers.some(b=>b.code==='UNKNOWN_TABS'),'Second old tab still protects target');
    const stale=await legacyBody(isolatedId);await pulse(isolatedId);assert.equal((await post('sessions/release-legacy',stale)).status,409);
    assert.equal((await post('sessions/release-legacy',await legacyBody(isolatedId))).status,200);
    assert((await item()).deletion.blockers.some(b=>b.code==='RETENTION'));
  });
  await check('late legacy responses preserve tombstones and do not restart the selected artifact retention forever',async()=>{
    const released=session(lostId).legacyReleases[target.id].releasedAt;
    const response=await pulse(lostId);assert.equal(response.status,200);assert.equal(response.body.transitionURL,'/legacy-transition');
    assert.equal(session(lostId).legacyReleases[target.id].releasedAt,released);
    assert.equal((await item()).sessions.find(s=>s.id===lostId).status,'released');
    assert.equal((await item(releases['platform-sdk'].id)).sessions.find(s=>s.id===lostId).status,'recent');
  });
  await check('after explicit reference cleanup and retention, actual removal keeps the access fence',async()=>{
    updateMetadata('usage.json',data=>{data.startedAt=aged;for(const s of Object.values(data.sessions)){s.lastSeenAt=aged;if(s.releasedAt)s.releasedAt=aged;if(s.closedAt)s.closedAt=aged;for(const r of Object.values(s.legacyReleases||{}))r.releasedAt=aged;}return data;});
    assert((await item()).deletion.eligibleForReview);assert.equal((await post('releases/delete',await releaseBody())).status,200);
    assert(!fs.existsSync(targetPath));assert.equal((await fetch(baseURL+target.entry)).status,410);
    assert(read('catalog.json')[target.id]);report.deletedArtifact=target.id;
  });
  await check('a denied script request independently triggers bridge navigation without a telemetry heartbeat',async()=>{
    const consumer=await context.newPage();await consumer.goto(baseURL+'/guide',{waitUntil:'networkidle'});
    assert(await consumer.evaluate(()=>Boolean(navigator.serviceWorker.controller)));
    await consumer.evaluate(url=>{const script=document.createElement('script');script.src=url;document.head.append(script);},target.entry);
    await consumer.waitForURL('**/legacy-transition');assert.match(await consumer.locator('h1').innerText(),/최신 화면/);await consumer.close();
  });
  await check('a returning unchanged legacy tab is moved out of old code by the bridge after cleanup',async()=>{
    const cdp=await context.newCDPSession(disconnected);await cdp.send('Page.setWebLifecycleState',{state:'active'});
    await disconnected.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))).catch(()=>{});
    await disconnected.waitForURL('**/legacy-transition');assert.match(await disconnected.locator('h1').innerText(),/최신 화면/);
    await disconnected.getByRole('link',{name:'최신 화면 열기'}).click();await disconnected.waitForFunction(()=>window.__MFE_TAB_GUARD__?.isManaged() && Boolean(window.__MFE_RUNTIME__));
    assert.equal(await disconnected.evaluate(()=>__MFE_RUNTIME__.registry.compositionId),current().compositionId);
    await disconnected.close();
  });
  await check('a bridge-free returning browser is denied retired files and can manually reload to the latest composition',async()=>{
    await isolatedContext.setOffline(false);
    assert.equal(await isolated.evaluate(()=>navigator.serviceWorker.controller),null);
    assert.equal(await isolated.evaluate(async url=>(await fetch(url)).status,target.entry),410);
    // Existing downloaded code is not remotely erased. Navigation is explicit.
    assert.equal(await isolated.evaluate(()=>typeof __MFE_RUNTIME__),'object');
    await isolated.unroute('**/runtime-usage.js');await isolated.unroute('**/runtime-lease.js');await isolated.goto(baseURL,{waitUntil:'networkidle'});
    await isolated.waitForFunction(()=>window.__MFE_TAB_GUARD__?.isManaged() && Boolean(window.__MFE_RUNTIME__));assert.equal(await isolated.evaluate(()=>__MFE_RUNTIME__.registry.compositionId),current().compositionId);await isolated.close();
  });
  await check('transition and per-artifact retirement records persist across restart and remain usable on mobile',async()=>{
    const before=session(lostId).legacyReleases[target.id];await page.close();await stopServer();baseURL=await startServer();await refreshToken();
    assert.deepEqual(session(lostId).legacyReleases[target.id],before);assert(session(oldId).transition.confirmedAt);
    assert.equal((await fetch(baseURL+target.entry)).status,410);
    page=await browser.newPage({viewport:{width:390,height:844}});await openTarget();await openLegacy();
    assert.match(await page.getByTestId('access-revoked').innerText(),/접근 종료/);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(output,'legacy-mobile.png'),fullPage:true});
  });
  await check('all original service projects and the live store remain unchanged',async()=>{
    assert.equal(await fingerprint(path.join(root,'projects')),projectHash);assert.equal(await fingerprint(sourceStore),liveHash);assert.deepEqual(report.pageErrors,[]);report.liveStoreUnchanged=true;
  });
  report.status='passed';report.passedChecks=report.checks.length;console.log(`Legacy transition verification passed: ${report.passedChecks}/${report.checks.length}`);
}catch(error){report.status='failed';report.error=error.stack;console.error(error);if(page)await page.screenshot({path:path.join(output,'legacy-failure.png'),fullPage:true}).catch(()=>{});process.exitCode=1;
}finally{report.finishedAt=new Date().toISOString();await writeFile(path.join(output,'legacy.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();await stopServer();if(temporary)await rm(temporary,{recursive:true,force:true});if(originalStore===undefined)delete process.env.MFE_ARTIFACT_STORE;else process.env.MFE_ARTIFACT_STORE=originalStore;}

