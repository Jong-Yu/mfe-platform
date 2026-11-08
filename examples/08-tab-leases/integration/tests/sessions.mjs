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
const report = { status: 'running', checks: [], startedAt: new Date().toISOString(), consumerBuildsExecuted: 0, pageErrors: [], scope: 'Real browser/API in a disposable store: lease renewal, offline and frozen resume gates, explicit stale session release, deletion guards and actual removal. Browser clocks and past metadata simulate elapsed time; production has no clock override.' };
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
async function stopServer() { if (server?.exitCode === null && server.signalCode === null) await new Promise((resolve) => { server.once('exit', resolve); server.kill('SIGTERM'); }); }
async function eventually(action) { const end = Date.now() + 10000; while (true) { try { return await action(); } catch (error) { if (Date.now() > end) throw error; await new Promise((r) => setTimeout(r, 100)); } } }
await mkdir(output, { recursive: true });
try {
  const sourceStore = originalStore || path.join(root, 'artifact-store');
  const projectHash = await fingerprint(path.join(root, 'projects')), liveHash = await fingerprint(sourceStore);
  temporary = await mkdtemp(path.join(os.tmpdir(), 'mfe-session-lease-proof-'));
  process.env.MFE_ARTIFACT_STORE = path.join(temporary, 'store');
  const require = createRequire(import.meta.url);
  const { publish, activate, rollback, preview, selectAdmin, read, current, updateMetadata } = require('../tools/store.cjs');
  const { lifecycleState, recordUsage, POLICY } = require('../tools/lifecycle.cjs');
  const { deleteReleaseFiles } = require('../tools/retirement.cjs');
  const releases = {};
  for (const name of ['platform-sdk', 'shell', 'service-a', 'service-c', 'service-b-v1', 'service-b-v2', 'service-d-v1', 'service-d-v2']) releases[name] = publish(path.join(root, 'projects', name));
  const dProof = {retainedReleases:{'service-d-v1':path.join(root,'projects/service-d-v1-next'),'service-d-v2':path.join(root,'projects/service-d-v2-next')}};
  const bProof = {retainedReleases:{'service-b-v1':path.join(root,'projects/service-b-v1-next')}};
  const sdkProof = {retainedRelease:path.join(root,'projects/platform-sdk-next')};
  const targetDirectory = dProof.retainedReleases['service-d-v1'];
  const target = publish(targetDirectory), alternate = releases['service-d-v1'];
  const newB = publish(bProof.retainedReleases['service-b-v1']), newSDK = publish(sdkProof.retainedRelease);
  const bA = releases['service-b-v1'].id, bC = releases['service-b-v2'].id;
  const initial = activate({ platform: releases['platform-sdk'].id, shell: releases.shell.id, A: releases['service-a'].id, C: releases['service-c'].id }, {
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
  const oldContext = await browser.newContext({ viewport: { width:1440, height:1050 } });
  oldContext.on('page', p => p.on('pageerror', e => report.pageErrors.push(e.message)));
  const old = await oldContext.newPage();
  async function openTarget(id = target.id) { await page.goto(`${baseURL}/admin#lifecycle`, { waitUntil: 'networkidle' }); await page.getByTestId(`release-${id}`).click(); }
  async function fillConfirmation(id, external = false) { await page.getByLabel('작업 대상 전체 ID', { exact: true }).fill(id); await page.getByLabel('작업 사유', { exact: true }).fill('임시 저장소의 수명 종료 검증'); if (external) await page.locator('.external-confirm input').check(); }

  const healthy = await context.newPage();
  let staleId, healthyId, legacyId, savedFactory;
  async function runtimePost(body) {
    const config = await (await fetch(`${baseURL}/api/runtime/config`)).json();
    const response = await fetch(`${baseURL}/api/runtime/usage`, { method:'POST', headers:{Origin:baseURL,'Content-Type':'application/json'}, body:JSON.stringify({token:config.token, loadedArtifactIds:[], ...body}) });
    return {status:response.status, body:await response.json()};
  }
  const session = (id) => read('usage.json').sessions[id];
  const cleanupBody = (id) => ({sessionId:id, expectedSequence:session(id).sequence, expectedLeaseExpiresAt:session(id).leaseExpiresAt, confirmationId:id, reason:'임시 저장소에서 만료된 탭 정리 검증'});
  const editSession = (id, changes) => updateMetadata('usage.json', data => { Object.assign(data.sessions[id], changes); return data; });
  const oldTime = new Date(Date.now() - 26 * 3600000).toISOString();

  await check('Shell acquires a renewable lease before requesting SDK or service remotes', async () => {
    const events = [];
    old.on('request', req => {if (req.url().endsWith('/api/runtime/usage')) events.push(JSON.parse(req.postData()).event); else if (req.url().endsWith('/remoteEntry.js')) events.push('remote');});
    await old.goto(baseURL + '/?empty=1', {waitUntil:'networkidle'});
    await old.getByTestId('add-a').click(); await old.getByTestId('widget-A').getByTestId('dependency').waitFor();
    assert(events.indexOf('open') < events.indexOf('remote'));
    staleId = await old.evaluate(() => __MFE_TAB_GUARD__.diagnostics().sessionId);
    assert.equal(session(staleId).protocol, 'lease-v1');
    assert(Date.parse(session(staleId).leaseExpiresAt) > Date.now());
    await healthy.goto(baseURL + '/?empty=1', {waitUntil:'networkidle'});
    healthyId = await healthy.evaluate(() => __MFE_TAB_GUARD__.diagnostics().sessionId);
    assert.equal(Object.keys(read('usage.json').sessions).length, 2, 'No duplicate legacy telemetry session');
  });
  await check('a failed initial lease never boots service remotes', async () => {
    const offline = await context.newPage(); let remotes = 0;
    offline.on('request', req => {if(req.url().endsWith('/remoteEntry.js')) remotes++;});
    await offline.route('**/api/runtime/usage', route => route.abort());
    await offline.goto(baseURL, {waitUntil:'networkidle'});
    await offline.getByTestId('lease-notice').waitFor(); assert.equal(remotes, 0);
    await offline.close();
  });
  await check('live renewals extend protection and stale cleanup requests cannot override new responses', async () => {
    const request = cleanupBody(healthyId), expires = session(healthyId).leaseExpiresAt;
    await healthy.evaluate(() => dispatchEvent(new Event('online')));
    await eventually(async () => assert(session(healthyId).sequence > request.expectedSequence));
    assert(Date.parse(session(healthyId).leaseExpiresAt) >= Date.parse(expires));
    assert.equal((await post('sessions/release', request)).status, 409);
    const blocked = await post('sessions/release', cleanupBody(healthyId)); assert.equal(blocked.body.code, 'SESSION_PROTECTED');
    assert.equal(session(healthyId).releasedAt, undefined);
  });
  await check('short network loss preserves input and recovery renews the same tab', async () => {
    await old.clock.install();
    await old.getByTestId('widget-A').getByTestId('increment').click();
    const before = session(staleId).sequence;
    await old.route('**/api/runtime/usage', route => route.abort());
    await old.clock.runFor(16000);
    await old.getByTestId('widget-A').getByTestId('increment').click();
    assert.equal(await old.getByTestId('widget-A').getByTestId('count').innerText(), '2');
    assert.equal(await old.getByTestId('lease-notice').count(), 0);
    await old.unroute('**/api/runtime/usage'); await old.evaluate(() => dispatchEvent(new Event('online')));
    await eventually(async () => assert(session(staleId).sequence > before));
    assert.equal(await old.getByTestId('widget-A').getByTestId('count').innerText(), '2');
  });
  await check('an expired offline tab cannot interact, fetch, load another remote or execute a cached factory', async () => {
    await old.evaluate(async () => {
      const runtime = __MFE_RUNTIME__; const container = await runtime.getArtifactContainer(runtime.registry.applications.A);
      window.savedLeaseFactory = await container.get('./Widget');
    });
    await old.route('**/api/runtime/usage', route => route.abort());
    await old.clock.fastForward(301000);
    await old.getByTestId('lease-notice').waitFor();
    const checks = await old.evaluate(async () => {
      document.querySelector('[data-testid="widget-A"] [data-testid="increment"]').click();
      const r = __MFE_RUNTIME__, errors = [];
      for (const call of [() => r.getArtifactContainer(r.registry.applications.C), () => savedLeaseFactory(), () => fetch('/catalog.json'), () => {const x = new XMLHttpRequest(); x.open('GET','/catalog.json'); x.send();}]) {
        try {await call(); errors.push(null);} catch(error) {errors.push(error.message);}
      }
      return {errors, count:document.querySelector('[data-testid="widget-A"] [data-testid="count"]').textContent, loaded:r.getDiagnostics().loadedContainerIds, c:r.registry.applications.C.id};
    });
    assert(checks.errors.every(message => /사용 기한/.test(message))); assert.equal(checks.count, '2'); assert(!checks.loaded.includes(checks.c));
    await old.screenshot({path:path.join(output,'sessions-expired.png')});
  });
  await check('real browser freeze and resume validates the server lease before further use', async () => {
    const frozen = await context.newPage(); await frozen.goto(baseURL + '/?empty=1', {waitUntil:'networkidle'});
    const id = await frozen.evaluate(() => __MFE_TAB_GUARD__.diagnostics().sessionId);
    const cdp = await context.newCDPSession(frozen);
    await cdp.send('Page.setWebLifecycleState', {state:'frozen'});
    editSession(id, {leaseExpiresAt:oldTime, lastSeenAt:oldTime});
    await cdp.send('Page.setWebLifecycleState', {state:'active'});
    await frozen.getByTestId('lease-notice').waitFor();
    await eventually(async () => assert(await frozen.evaluate(() => __MFE_TAB_GUARD__.diagnostics().expired)));
    assert.equal(await frozen.getByTestId('widget-A').count(), 0);
    await frozen.close();
    await eventually(async () => assert(session(id).closedAt));
  });
  await check('expiry is irreversible but still protects files until explicit cleanup after the grace period', async () => {
    editSession(staleId, {leaseExpiresAt:new Date(Date.now()-3600000).toISOString(), lastSeenAt:oldTime});
    const renewal = await runtimePost({protocol:'lease-v1',sessionId:staleId,compositionId:initial.compositionId,sequence:session(staleId).sequence+1,event:'heartbeat'});
    assert.equal(renewal.status, 410); assert.equal(renewal.body.code, 'LEASE_EXPIRED');
    assert.equal((await post('sessions/release',cleanupBody(staleId))).body.code,'SESSION_PROTECTED');
    assert((await item()).deletion.blockers.some(b => b.code === 'UNKNOWN_TABS'));
    editSession(staleId, {leaseExpiresAt:oldTime});
    assert((await item()).sessions.find(s=>s.id===staleId).cleanup.eligible);
  });
  await check('legacy unknown tabs cannot be classified as protected or released by timeout', async () => {
    legacyId = randomUUID();
    recordUsage({sessionId:legacyId,compositionId:initial.compositionId,sequence:1,event:'heartbeat',loadedArtifactIds:[]}, Date.now()-100*86400000);
    const result = await post('sessions/release',cleanupBody(legacyId)); assert.equal(result.body.code,'SESSION_PROTECTED');
    assert.equal(session(legacyId).releasedAt,undefined);
    assert.equal((await runtimePost({protocol:'lease-v1',sessionId:legacyId,compositionId:initial.compositionId,sequence:2,event:'open'})).status,410);
  });
  await check('cleanup enforces confirmation and same-origin controls', async () => {
    const body = cleanupBody(staleId);
    assert.equal((await post('sessions/release',{...body,confirmationId:'wrong'})).status,422);
    assert.equal((await post('sessions/release',{...body,reason:''})).status,422);
    assert.equal((await post('sessions/release',body,{Origin:'https://example.invalid'})).status,403);
    assert.equal((await post('sessions/release',body,{'X-MFE-CSRF':''})).status,403);
    assert.equal(session(staleId).releasedAt,undefined);
  });
  await check('UI releases only the expired tab and keeps its tombstone and a new retention period', async () => {
    await select(selection(alternate.id));
    agedPolicy(target.id); assert.equal((await post('releases/unregister',await releaseBody())).status,200);
    seedPolicy(target.id,{unregisteredAt:aged});
    await openTarget(); await page.locator('.session-cleanup summary').click();
    assert(await page.getByTestId(`prepare-session-${healthyId}`).isDisabled());
    assert(await page.getByTestId(`prepare-session-${legacyId}`).isDisabled());
    await page.getByTestId(`prepare-session-${staleId}`).click();
    await page.getByLabel('정리할 전체 탭 ID').fill(staleId); await page.getByLabel('탭 정리 사유').fill('보호 기한과 유예 기간 경과 검증');
    await page.getByTestId('confirm-session-release').click();
    await eventually(async () => assert(session(staleId).releasedAt));
    assert.equal(await fingerprint(targetPath),targetHash);
    assert((await item()).deletion.blockers.some(b=>b.code==='RETENTION'));
    assert.equal((await item()).sessions.find(s=>s.id===staleId).status,'released');
    await page.locator('.session-cleanup').screenshot({path:path.join(output,'sessions-cleanup.png')});
  });
  await check('active tabs and rollback references still prevent deletion after stale-tab cleanup', async () => {
    const sequence = session(healthyId).sequence;
    await healthy.evaluate(() => dispatchEvent(new Event('online')));
    await eventually(async () => assert(session(healthyId).sequence > sequence));
    await healthy.getByTestId('add-c').click(); await healthy.getByTestId('widget-C').getByTestId('dependency').waitFor();
    const response = await post('releases/delete',await releaseBody()); assert.equal(response.status,409);
    for (const code of ['OPEN_TABS','UNKNOWN_TABS','ROLLBACK']) assert(response.body.blockers.some(b=>b.code===code));
    assert.equal(await fingerprint(targetPath),targetHash);
  });
  await check('late heartbeat and open requests cannot revive released records or enter a retired composition', async () => {
    const before = JSON.stringify(session(staleId));
    for (const event of ['heartbeat','open']) {
      const result = await runtimePost({protocol:'lease-v1',sessionId:staleId,compositionId:initial.compositionId,sequence:session(staleId).sequence+100,event});
      assert.equal(result.status,410); assert.equal(result.body.code,'SESSION_RELEASED');
    }
    assert.equal(JSON.stringify(session(staleId)),before);
    assert.equal((await runtimePost({protocol:'lease-v1',sessionId:randomUUID(),compositionId:initial.compositionId,sequence:1,event:'open'})).status,410);
  });
  await check('only after other references clear and post-cleanup retention passes are files actually deleted', async () => {
    await healthy.close(); await eventually(async()=>assert(session(healthyId).closedAt));
    await runtimePost({sessionId:legacyId,compositionId:initial.compositionId,sequence:2,event:'close'});
    assert.equal((await post('compositions/retire',{compositionId:initial.compositionId,expectedCompositionId:current().compositionId,expectedRevision:0,confirmationId:initial.compositionId,reason:'임시 검증'})).status,200);
    const before = await post('releases/delete',await releaseBody()); assert.equal(before.status,409); assert(before.body.blockers.some(b=>b.code==='RETENTION'));
    updateMetadata('usage.json', data => {data.startedAt=aged;for(const s of Object.values(data.sessions)){s.lastSeenAt=aged;if(s.closedAt)s.closedAt=aged;if(s.releasedAt)s.releasedAt=aged;}return data;});
    assert((await item()).deletion.eligibleForReview);
    assert.equal((await post('releases/delete',await releaseBody())).status,200);
    assert(!fs.existsSync(targetPath)); assert.equal((await fetch(baseURL+target.entry)).status,404);
    report.deletedArtifact=target.id;
  });
  await check('the returning stale browser stays blocked and its explicit reload opens the latest composition', async () => {
    await old.unroute('**/api/runtime/usage');
    await old.evaluate(() => {dispatchEvent(new Event('online'));dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
    assert(await old.evaluate(() => __MFE_TAB_GUARD__.diagnostics().expired));
    assert.equal(await old.getByTestId('widget-A').getByTestId('count').innerText(),'2');
    await old.getByTestId('lease-reload').click();
    await old.getByTestId('widget-A').getByTestId('dependency').waitFor();
    assert.equal(await old.evaluate(()=>__MFE_RUNTIME__.registry.compositionId),current().compositionId);
    assert.notEqual(await old.evaluate(()=>__MFE_TAB_GUARD__.diagnostics().sessionId),staleId);
    assert.equal(await old.getByTestId('lease-notice').count(),0);
    assert.match(await old.getByTestId('widget-A').getByTestId('dependency').innerText(),/D 1\.0\.0/);
  });
  await check('released evidence survives restart and remains reviewable on mobile', async () => {
    await old.close(); await page.close(); const persisted=JSON.stringify(session(staleId));
    await stopServer(); baseURL=await startServer(); await refreshToken();
    assert.equal(JSON.stringify(session(staleId)),persisted);
    page = await context.newPage(); await page.setViewportSize({width:390,height:844});
    await openTarget(); await page.locator('.session-cleanup summary').click();
    assert.match(await page.getByTestId(`session-${staleId}`).innerText(),/참조 정리 완료/);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(output,'sessions-mobile.png'),fullPage:true});
  });
  await check('original service files and the live repository remain unchanged', async () => {
    assert.equal(await fingerprint(path.join(root,'projects')),projectHash);
    assert.equal(await fingerprint(sourceStore),liveHash); assert.deepEqual(report.pageErrors,[]);
    report.liveStoreUnchanged=true; report.projectFingerprint=projectHash;
  });
  report.status='passed'; report.passedChecks=report.checks.length;
  console.log(`Session lease verification passed: ${report.passedChecks}/${report.checks.length}`);
} catch (error) {
  report.status='failed'; report.error=error.stack; console.error(error);
  if(page) await page.screenshot({path:path.join(output,'sessions-failure.png'),fullPage:true}).catch(()=>{});
  process.exitCode=1;
} finally {
  report.finishedAt=new Date().toISOString();
  await writeFile(path.join(output,'sessions.json'),JSON.stringify(report,null,2)+'\n');
  await browser?.close(); await stopServer();
  if(temporary) await rm(temporary,{recursive:true,force:true});
  if(originalStore === undefined) delete process.env.MFE_ARTIFACT_STORE; else process.env.MFE_ARTIFACT_STORE=originalStore;
}

