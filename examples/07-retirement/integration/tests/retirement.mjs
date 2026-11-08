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
const report = { status: 'running', checks: [], startedAt: new Date().toISOString(), consumerBuildsExecuted: 0, pageErrors: [], scope: 'Real browser/API and CLI in a fresh disposable store. Actual file removal, unchanged consumers, lifetime references and commit-time guards. Past timestamps are seeded only in test metadata; no production clock override.' };
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
  temporary = await mkdtemp(path.join(os.tmpdir(), 'mfe-retirement-proof-'));
  process.env.MFE_ARTIFACT_STORE = path.join(temporary, 'store');
  const require = createRequire(import.meta.url);
  const { publish, activate, rollback, preview, selectAdmin, read, current, updateMetadata } = require('../tools/store.cjs');
  const { lifecycleState } = require('../tools/lifecycle.cjs');
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
  page = await context.newPage(); const old = await context.newPage(); let oldSession;
  async function openTarget(id = target.id) { await page.goto(`${baseURL}/admin#lifecycle`, { waitUntil: 'networkidle' }); await page.getByTestId(`release-${id}`).click(); }
  async function fillConfirmation(id, external = false) { await page.getByLabel('작업 대상 전체 ID', { exact: true }).fill(id); await page.getByLabel('작업 사유', { exact: true }).fill('임시 저장소의 수명 종료 검증'); if (external) await page.locator('.external-confirm input').check(); }

  await check('a real existing tab uses the target release before its support period ends', async () => {
    await old.goto(baseURL, { waitUntil: 'networkidle' }); await old.getByTestId('widget-A').getByTestId('dependency').waitFor();
    await old.getByTestId('widget-A').getByTestId('increment').click();
    await eventually(async () => { const r = await item(); assert.equal(r.loadedTabs, 1); oldSession = r.sessions[0]; });
  });
  await check('ending support disables selection but preserves unchanged current paths and the existing tab', async () => {
    const result = await post('lifecycle', { artifactId: target.id, expectedRevision: 0, supportEndsOn: pastDate, noticeReference: '지원 종료 공지' }); assert.equal(result.status, 200);
    await page.goto(`${baseURL}/admin`, { waitUntil: 'networkidle' });
    assert(await page.locator(`[data-testid="select-d-A"] option[value="${target.id}"]`).isDisabled());
    assert.equal((await post('preview', selection())).status, 200);
    assert.equal(preview().compositionId, initial.compositionId);
    assert.equal(await old.getByTestId('widget-A').getByTestId('count').innerText(), '1');
    assert.equal((await post('releases/unregister', await releaseBody())).status, 409);
  });
  await check('expired SDK/B selections and new indirect paths to expired D are rejected', async () => {
    agedPolicy(newSDK.id); agedPolicy(newB.id);
    assert.equal((await post('preview', selection(target.id, bA, newSDK.id))).status, 422);
    assert.equal((await post('preview', selection(target.id, newB.id))).status, 422);
    seedPolicy(newB.id, { supportEndsOn: null, noticeReference: '', noticeRecordedAt: null });
    const result = await post('preview', selection(target.id, newB.id)); assert.equal(result.status, 422); assert.match(result.body.error, /D.*지원 종료/);
    assert.equal(current().compositionId, initial.compositionId);
  });
  await check('switching away blocks reselection through stale apply, CLI and rollback while the old tab still runs', async () => {
    const stale = selection();
    await select(selection(alternate.id));
    const back = selection();
    assert.equal((await post('preview', back)).status, 422);
    assert.equal((await post('apply', { ...back, previewedCompositionId: initial.compositionId })).status, 422);
    assert.equal((await post('apply', { ...stale, previewedCompositionId: initial.compositionId })).status, 409);
    const cli = spawnSync(process.execPath, ['tools/activate.cjs', '--bind', `${bA}:d=${target.id}`], { cwd: integration, env: process.env, encoding: 'utf8' }); assert.notEqual(cli.status, 0); assert.match(cli.stderr, /지원 종료/);
    assert.throws(() => rollback(initial.compositionId), /지원 종료/);
    assert.equal(await old.getByTestId('widget-A').getByTestId('count').innerText(), '1');
    assert.equal((await fetch(`${baseURL}${target.entry}`)).status, 200);
  });
  await check('notice grace, request confirmation and same-origin controls are enforced before unregistration', async () => {
    const body = await releaseBody(); assert.equal((await post('releases/unregister', body)).status, 409);
    agedPolicy(target.id);
    const eligible = await releaseBody();
    assert.equal((await post('releases/unregister', { ...eligible, confirmationId: 'wrong' })).status, 422);
    assert.equal((await post('releases/unregister', eligible, { Origin: 'https://example.invalid' })).status, 403);
    assert.equal((await post('releases/unregister', eligible, { 'X-MFE-CSRF': '' })).status, 403);
    assert.equal((await item()).registrationState, 'registered');
  });
  await check('UI unregistration removes the choice while leaving all artifact files and tab/rollback references intact', async () => {
    await openTarget(); await page.getByTestId('prepare-unregister').click();
    assert(await page.getByTestId('confirm-retirement').isDisabled());
    await fillConfirmation(target.id); await page.getByTestId('confirm-retirement').click();
    await page.getByTestId('retirement-saved').waitFor();
    assert.equal((await item()).registrationState, 'unregistered');
    assert.equal(await fingerprint(targetPath), targetHash); assert.equal((await fetch(`${baseURL}${target.entry}`)).status, 200);
    await page.getByRole('link', { name: '조합 관리', exact: true }).click();
    assert.equal(await page.locator(`[data-testid="select-d-A"] option[value="${target.id}"]`).count(), 0);
    assert.throws(() => publish(targetDirectory), /재발행/);
    assert.equal((await post('lifecycle', { artifactId: target.id, expectedRevision: (await item()).lifecycle.revision, supportEndsOn: null, noticeReference: '' })).status, 422);
  });
  await check('immediate deletion is blocked by post-unregistration retention, a live tab and rollback references', async () => {
    const response = await post('releases/delete', await releaseBody()); assert.equal(response.status, 409);
    const codes = response.body.blockers.map((b) => b.code);
    for (const code of ['RETENTION', 'OPEN_TABS', 'ROLLBACK']) assert(codes.includes(code));
    assert.equal(await fingerprint(targetPath), targetHash); report.blockedDeletionReasons = codes;
  });
  await check('explicit rollback-retention release preserves snapshot evidence but blocks rollback and direct HTML boot', async () => {
    const activeBody = { compositionId: current().compositionId, expectedCompositionId: current().compositionId, expectedRevision: 0, confirmationId: current().compositionId, reason: '검증' };
    assert.equal((await post('compositions/retire', activeBody)).status, 409);
    await openTarget(); await page.locator('.retirement-references summary').click();
    await page.getByTestId(`prepare-retire-${initial.compositionId}`).click(); await fillConfirmation(initial.compositionId); await page.getByTestId('confirm-retirement').click();
    await page.getByTestId('retirement-saved').waitFor();
    assert.deepEqual((await item()).history, []);
    assert(fs.existsSync(path.join(process.env.MFE_ARTIFACT_STORE, 'compositions', `${initial.compositionId}.json`)));
    assert.equal((await fetch(`${baseURL}/compositions/${initial.compositionId}.html`)).status, 410);
    assert.throws(() => rollback(initial.compositionId), /보관이 해제/);
    const response = await post('releases/delete', await releaseBody()); assert.equal(response.status, 409); assert(response.body.blockers.some((b) => b.code === 'OPEN_TABS'));
  });
  await check('missing heartbeat remains a deletion blocker even after rollback retention and date conditions are cleared', async () => {
    await old.close();
    seedPolicy(target.id, { unregisteredAt: aged });
    updateMetadata('usage.json', (data) => { data.startedAt = aged; data.sessions[oldSession.id] = { ...data.sessions[oldSession.id], lastSeenAt: aged, closedAt: null }; return data; });
    const response = await post('releases/delete', await releaseBody()); assert.equal(response.status, 409);
    assert(response.body.blockers.some((b) => b.code === 'UNKNOWN_TABS')); assert(fs.existsSync(targetPath));
  });
  const runtimeConfig = await (await fetch(`${baseURL}/api/runtime/config`)).json();
  async function heartbeat(body) { const response = await fetch(`${baseURL}/api/runtime/usage`, { method: 'POST', headers: { Origin: baseURL, 'Content-Type': 'application/json' }, body: JSON.stringify({ token: runtimeConfig.token, loadedArtifactIds: [], ...body }) }); assert.equal(response.status, 200); }
  await check('confirmed tab closure releases its reference but restarts the quiet retention period', async () => {
    const session = read('usage.json').sessions[oldSession.id];
    await heartbeat({ sessionId: oldSession.id, compositionId: initial.compositionId, sequence: session.sequence + 1, event: 'close' });
    const response = await post('releases/delete', await releaseBody()); assert.equal(response.status, 409);
    assert(response.body.blockers.some((b) => b.code === 'RETENTION'));
    assert(!response.body.blockers.some((b) => ['UNKNOWN_TABS', 'OPEN_TABS', 'ROLLBACK'].includes(b.code)));
  });
  async function metadataFixture(sourceProject, id, dependencies = {}) {
    const directory = path.join(temporary, id); await cp(path.join(sourceProject, 'dist'), path.join(directory, 'dist'), { recursive: true });
    const meta = JSON.parse(await readFile(path.join(directory, 'dist/release.json'), 'utf8'));
    Object.assign(meta, { id, name: `mf_${id}`, entry: `/artifacts/${id}/remoteEntry.js`, dependencies, runtimeDependencies: {} });
    await writeFile(path.join(directory, 'dist/release.json'), JSON.stringify(meta, null, 2) + '\n'); return publish(directory);
  }
  await check('a published fixed consumer prevents deletion until its own stored files have been removed', async () => {
    ageEvidence();
    const pin = await metadataFixture(path.join(root, 'projects/service-b-v1'), 'b_pin_guard_000001', { d: target.id });
    const blocked = await post('releases/delete', await releaseBody()); assert.equal(blocked.status, 409); assert(blocked.body.blockers.some((b) => b.code === 'PINNED'));
    agedPolicy(pin.id); assert.equal((await post('releases/unregister', await releaseBody(pin.id))).status, 200);
    seedPolicy(pin.id, { unregisteredAt: aged });
    assert.equal((await post('releases/delete', await releaseBody(pin.id))).status, 200);
    assert.equal((await item()).pinnedConsumers.length, 0);
    report.fixedReferenceProbe = 'Metadata-only consumer fixture; guard and file deletion tested, fixture code not executed.';
  });
  await check('deletion requires the exact release confirmation, external-use acknowledgement and current revision', async () => {
    const body = await releaseBody(); assert((await item()).deletion.eligibleForReview);
    assert.equal((await post('releases/delete', { ...body, externalUsageChecked: false })).status, 422);
    assert.equal((await post('releases/delete', { ...body, confirmationId: 'wrong' })).status, 422);
    assert.equal((await post('releases/delete', { ...body, expectedRevision: body.expectedRevision - 1 })).status, 409);
    assert(fs.existsSync(targetPath));
  });
  let lateSession;
  await check('a newly reported old tab after preparing deletion is caught by the server at commit time', async () => {
    await openTarget(); await page.getByTestId('prepare-delete').click(); await fillConfirmation(target.id);
    assert(await page.getByTestId('confirm-retirement').isDisabled());
    await page.locator('.external-confirm input').check();
    lateSession = randomUUID(); await heartbeat({ sessionId: lateSession, compositionId: initial.compositionId, sequence: 1, event: 'heartbeat' });
    await page.getByTestId('confirm-retirement').click(); await page.getByTestId('retirement-error').waitFor();
    assert.match(await page.getByTestId('retirement-error').innerText(), /탭/); assert(fs.existsSync(targetPath));
    await page.locator('.release-detail').screenshot({ path: path.join(output, 'retirement-blocked.png') });
  });
  await check('explicit UI file deletion removes bytes only after all references and retention conditions clear', async () => {
    await heartbeat({ sessionId: lateSession, compositionId: initial.compositionId, sequence: 2, event: 'close' }); ageEvidence();
    assert((await item()).deletion.eligibleForReview);
    await page.getByTestId('confirm-retirement').click(); await page.getByTestId('retirement-saved').waitFor();
    assert.equal(await page.getByTestId('registration-state').innerText(), '파일 삭제 완료');
    assert.equal(fs.existsSync(targetPath), false); assert.equal((await fetch(`${baseURL}${target.entry}`)).status, 404);
    assert.equal((await item()).registrationState, 'deleted'); assert(read('catalog.json')[target.id], 'Inventory metadata is retained');
    assert.throws(() => publish(targetDirectory), /재발행/);
    const fresh = await context.newPage(); await fresh.goto(baseURL, { waitUntil: 'networkidle' }); await fresh.getByTestId('widget-A').getByTestId('dependency').waitFor();
    assert.match(await fresh.getByTestId('widget-A').getByTestId('dependency').innerText(), new RegExp(`D ${alternate.version.replaceAll('.', '\\.')}`));
    await fresh.close(); report.deletedArtifact = target.id;
    await page.locator('.release-detail').screenshot({ path: path.join(output, 'retirement-deleted.png') });
  });
  await check('a symlink substitution cannot redirect file deletion outside the selected artifact directory', async () => {
    const probe = await metadataFixture(targetDirectory, 'd_symlink_guard_000001'); agedPolicy(probe.id);
    assert.equal((await post('releases/unregister', await releaseBody(probe.id))).status, 200); seedPolicy(probe.id, { unregisteredAt: aged });
    const artifactPath = path.join(process.env.MFE_ARTIFACT_STORE, 'artifacts', probe.id), saved = path.join(temporary, 'symlink-original');
    const outside = path.join(temporary, 'outside-guard'); await mkdir(outside); await writeFile(path.join(outside, 'sentinel'), 'preserve');
    fs.renameSync(artifactPath, saved); fs.symlinkSync(outside, artifactPath, 'dir');
    try { const response = await post('releases/delete', await releaseBody(probe.id)); assert.equal(response.status, 422); assert.equal(response.body.code, 'UNSAFE_STORAGE_PATH'); assert.equal(await readFile(path.join(outside, 'sentinel'), 'utf8'), 'preserve'); assert.equal((await item(probe.id)).registrationState, 'unregistered'); }
    finally { fs.unlinkSync(artifactPath); fs.renameSync(saved, artifactPath); }
  });
  await check('an interrupted deletion is recorded as incomplete and can resume without falsely reporting success', async () => {
    const probe = await metadataFixture(targetDirectory, 'd_delete_retry_000001'); agedPolicy(probe.id);
    assert.equal((await post('releases/unregister', await releaseBody(probe.id))).status, 200); seedPolicy(probe.id, { unregisteredAt: aged });
    const body = await releaseBody(probe.id), originalRemove = fs.rmSync;
    const work = path.join(process.env.MFE_ARTIFACT_STORE, '.deletion-work', probe.id);
    try { fs.rmSync = (filename, options) => { if (filename === work) throw new Error('Simulated cleanup interruption'); return originalRemove(filename, options); }; assert.throws(() => deleteReleaseFiles(body), /완료되지/); }
    finally { fs.rmSync = originalRemove; }
    assert.equal((await item(probe.id)).registrationState, 'deleting'); assert(fs.existsSync(work));
    assert.equal((await fetch(`${baseURL}/.deletion-work/${probe.id}/remoteEntry.js`)).status, 404);
    assert.equal((await post('releases/delete', await releaseBody(probe.id))).status, 200);
    assert.equal(fs.existsSync(work), false); assert.equal((await item(probe.id)).registrationState, 'deleted');
  });
  await check('retirement and deletion records survive restart and render on mobile without overflow', async () => {
    await context.close(); await stopServer(); baseURL = await startServer(); await refreshToken();
    assert.equal((await item()).registrationState, 'deleted'); assert(read('composition-retirement.json')[initial.compositionId].retiredAt);
    page = await browser.newPage({ viewport: { width: 390, height: 844 } }); page.on('pageerror', (e) => report.pageErrors.push(e.message));
    await openTarget(); assert.equal(await page.getByTestId('registration-state').innerText(), '파일 삭제 완료');
    assert(await page.getByTestId('prepare-delete').isDisabled());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(output, 'retirement-mobile.png'), fullPage: true });
    assert.deepEqual(report.pageErrors, []);
  });
  await check('all original projects and the live artifact repository remain unchanged', async () => {
    assert.equal(await fingerprint(path.join(root, 'projects')), projectHash); assert.equal(await fingerprint(sourceStore), liveHash);
    report.projectFingerprint = projectHash; report.liveStoreUnchanged = true;
  });
  report.status = 'passed';
} catch (error) { report.status = 'failed'; report.error = { message: error.message, stack: error.stack }; process.exitCode = 1; console.error(error); await page?.screenshot({ path: path.join(output, 'retirement-failure.png'), fullPage: true }).catch(() => {}); }
finally {
  await browser?.close(); await stopServer(); if (temporary) await rm(temporary, { recursive: true, force: true });
  if (originalStore === undefined) delete process.env.MFE_ARTIFACT_STORE; else process.env.MFE_ARTIFACT_STORE = originalStore;
  report.finishedAt = new Date().toISOString(); report.passedChecks = report.checks.filter((c) => c.status === 'passed').length;
  await writeFile(path.join(output, 'retirement.json'), JSON.stringify(report, null, 2) + '\n'); console.log(`Retirement verification ${report.status}: ${report.passedChecks}/${report.checks.length}`);
}
