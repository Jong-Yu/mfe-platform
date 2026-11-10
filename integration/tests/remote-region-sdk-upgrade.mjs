import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { exposeChunkPath } from './expose-chunk.mjs';

const integration = fileURLToPath(new URL('../', import.meta.url));
const projects = path.resolve(integration, '../projects');
const output = path.join(integration, 'artifacts/verification');
const replayRoot = path.join(integration, 'artifacts/remote-region-sdk-upgrade');
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));
const save = async (file, value) => writeFile(file, JSON.stringify(value, null, 2) + '\n');
const widget = (page, id = 'A') => page.getByTestId(`widget-${id}`);
const textOf = async (locator) => (await locator.innerText()).trim();
const consumerNames = ['shell', 'service-a', 'service-c', 'service-b-v1', 'service-b-v2', 'service-d-v1', 'service-d-v2'];
const report = { startedAt: new Date().toISOString(), status: 'running', checks: [], pages: [], buildCommands: [],
  evidenceScope: 'Reuses the retained SDK 1.3.0 nested scenario and its already-built A/C/B/D/Shell bytes. Only platform-sdk is built and published as 1.3.1. Real HTTP entry/chunk outages distinguish one manual attempt from one manual attempt plus one delayed automatic attempt. Existing tabs are kept open across activation and rollback. Original consumer files, timestamps, IDs and bindings are checked.' };
let temporary, server, browser, context, currentPage, baseURL, baseline, upgraded, scenario, store;
const priorStore = process.env.MFE_ARTIFACT_STORE;
await mkdir(output, { recursive: true });

async function check(name, action) {
  const start = Date.now();
  try { await action(); report.checks.push({ name, status: 'passed', durationMs: Date.now() - start }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, status: 'failed', error: error.message }); throw error; }
}

async function fingerprint(directory, timestamps = false) {
  const hash = createHash('sha256'), timeHash = createHash('sha256');
  let files = 0;
  async function visit(current) {
    for (const entry of (await readdir(current, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (['node_modules', '.git', '.mfe-dev'].includes(entry.name)) continue;
      const file = path.join(current, entry.name);
      assert(!entry.isSymbolicLink(), file);
      if (entry.isDirectory()) await visit(file);
      else {
        const relative = path.relative(directory, file);
        hash.update(relative).update('\0').update(await readFile(file)).update('\0');
        if (timestamps) timeHash.update(relative).update(String((await stat(file, { bigint: true })).mtimeNs));
        files++;
      }
    }
  }
  await visit(directory);
  return { files, sha256: hash.digest('hex'), ...(timestamps ? { modifiedTimes: timeHash.digest('hex') } : {}) };
}

async function startServer() {
  server = spawn(process.execPath, ['tools/serve.cjs'], { cwd: integration, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let log = '';
    const timer = setTimeout(() => reject(new Error(`Server not ready: ${log}`)), 10000);
    server.on('error', (error) => { clearTimeout(timer); reject(error); });
    server.stderr.on('data', (data) => { log += data; });
    server.stdout.on('data', (data) => { log += data; const match = log.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
  });
}

async function buildSDK() {
  const cwd = path.join(projects, 'platform-sdk');
  report.buildCommands.push({ command: 'npm run build', project: 'platform-sdk' });
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd, env: { ...process.env, NPM_CONFIG_UPDATE_NOTIFIER: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    child.stdout.on('data', (data) => { log += data; }); child.stderr.on('data', (data) => { log += data; });
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error('SDK build timed out')); }, 120000);
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('exit', (code) => { clearTimeout(timer); report.buildLog = log; code === 0 ? resolve() : reject(new Error(log)); });
  });
}

async function failureURL(name) {
  const [service, kind] = name.split('-');
  const release = scenario.releases[{ C: 'service-c', B2: 'service-b-v2', D2: 'service-d-v2' }[service]];
  if (kind === 'entry') return new URL(release.entry, baseURL).href;
  const requestPath = await exposeChunkPath(path.join(temporary, 'store'), release, service === 'D2' ? './data' : './Widget');
  return new URL(requestPath, baseURL).href;
}

async function tab(name, composition, failure, mount = true) {
  const page = await context.newPage(); currentPage = page; page.setDefaultTimeout(15000);
  const record = { name, requests: [], responses: [], errors: [], consoleErrors: [], navigations: 0, attempts: [] };
  report.pages.push(record);
  page.on('request', (r) => record.requests.push(r.url()));
  page.on('response', (r) => { if (r.status() >= 400 || r.url().endsWith('/remoteEntry.js')) record.responses.push({ url: r.url(), status: r.status() }); });
  page.on('pageerror', (e) => record.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') record.consoleErrors.push(m.text()); });
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) record.navigations++; });
  const s = { page, record, composition, mode: failure ? 'broken' : 'healthy', phase: 0, gate: null };
  if (failure) {
    s.failedURL = await failureURL(failure);
    await page.route(s.failedURL, async (route) => {
      const phase = ++s.phase;
      const fail = s.mode === 'broken' || (s.mode === 'flaky' && phase === 1);
      record.attempts.push({ mode: s.mode, phase, at: Date.now(), status: fail ? 503 : 200 });
      if (s.gate && phase === 1) await s.gate;
      if (fail) await route.fulfill({ status: 503, contentType: 'text/plain', body: 'Temporary file outage for SDK upgrade verification' });
      else await route.continue();
    });
  }
  s.setMode = (mode) => { s.mode = mode; s.phase = 0; };
  await page.goto(`${baseURL}/?empty=1`, { waitUntil: 'networkidle' });
  if (mount) {
    await page.getByTestId('add-a').click();
    if (failure) await page.getByTestId('remote-error-A--c').waitFor();
    else await widget(page, 'A--c').waitFor();
  }
  return s;
}

async function runtimeProof(s, ids = ['A', 'A--c']) {
  for (const id of ids) {
    await widget(s.page, id).waitFor();
    assert.equal(await textOf(widget(s.page, id).getByTestId('version')), id.endsWith('--c') ? '2.1.0' : '1.4.0');
    assert.equal(await textOf(widget(s.page, id).getByTestId('platform-version')), s.composition.platformVersion);
  }
  await s.page.waitForFunction((expected) => {
    const snapshot = window.__MFE_PROOF__.getSnapshot();
    return snapshot.activeInstances.length === expected && snapshot.activeSubscriptions === expected;
  }, ids.length);
  const proof = await s.page.evaluate(async () => {
    const runtime = window.__MFE_RUNTIME__;
    const sdk = (await (await runtime.getContainer('platform')).get('./sdk'))();
    const a = (await (await runtime.getArtifactContainer(runtime.registry.applications.A)).get('./Widget'))().getIdentity();
    return { compositionId: runtime.registry.compositionId, sdkId: runtime.registry.selected.platform,
      bindings: runtime.registry.runtimeBindings, diagnostics: runtime.getDiagnostics(), snapshot: sdk.getRuntimeSnapshot(),
      sameReact: a.react === sdk.ReactIdentity && a.consumerReact === sdk.ReactIdentity,
      sameContext: a.context === sdk.PlatformContext, sameRemoteRegion: a.remoteRegion === sdk.RemoteRegion,
      recovery: sdk.getRemoteRecoveryLog() };
  });
  assert.equal(proof.compositionId, s.composition.compositionId);
  assert.equal(proof.sdkId, s.composition.selected.platform);
  assert.deepEqual(proof.bindings, baseline.runtimeBindings);
  assert(proof.sameReact && proof.sameContext && proof.sameRemoteRegion);
  assert.deepEqual(proof.snapshot.activeInstances.map((x) => x.instanceId).sort(), [...ids].sort());
  const sdkRecords = proof.diagnostics.containers.filter((x) => x.id.startsWith('platform_'));
  assert.equal(sdkRecords.length, 1); assert.equal(sdkRecords[0].loadCount, 1); assert.equal(sdkRecords[0].initCount, 1);
  const expectedSDK = s.composition.artifacts.platform.entry;
  const sdkRequests = s.record.requests.filter((url) => /\/artifacts\/platform_[^/]+\/remoteEntry.js$/.test(url));
  assert.deepEqual(sdkRequests, [new URL(expectedSDK, baseURL).href]);
  assert.equal(s.record.navigations, 1);
  assert.deepEqual(s.record.errors, []);
  s.record.proof = proof;
  return proof;
}

async function remember(s) {
  s.element = await widget(s.page).elementHandle(); s.value = `${s.record.name}-kept`; s.count = 1;
  await widget(s.page).getByTestId('increment').click();
  await widget(s.page).getByTestId('input').fill(s.value);
  await widget(s.page).getByTestId('cache-write').click();
  await widget(s.page).getByTestId('open-popup').click();
  await s.page.getByTestId('emit-event').click();
}

async function preserved(s, exercise = false) {
  assert(await s.element.evaluate((element) => element.isConnected));
  assert.equal(await widget(s.page).getByTestId('input').inputValue(), s.value);
  await widget(s.page).getByTestId('cache-read').click();
  assert.equal(await textOf(widget(s.page).getByTestId('cache-value')), s.value);
  assert.equal(await textOf(widget(s.page).getByTestId('count')), String(s.count));
  assert.equal(await s.page.getByTestId('popup-A').count(), 1);
  if (exercise) {
    await widget(s.page).getByTestId('increment').click(); s.count++;
    await s.page.getByTestId('emit-event').click();
    assert.equal(await textOf(widget(s.page).getByTestId('count')), String(s.count));
    assert.equal(await textOf(widget(s.page).getByTestId('event-count')), '2');
  }
}

async function retryResponse(s, status) {
  const response = s.page.waitForResponse((r) => r.url() === s.failedURL && r.status() === status);
  await s.page.getByTestId('retry-A--c').click();
  await response;
}

try {
  let baselineDirectory, protectedDirectories, protectedBefore, artifactBefore, productPointer;
  await check('reuse retained SDK 1.3.0 and existing consumers without running any consumer build', async () => {
    const pointer = await json(path.join(replayRoot, 'baseline.json'));
    baselineDirectory = path.resolve(replayRoot, pointer.directory);
    assert(existsSync(path.join(baselineDirectory, 'scenario.json')), 'Restore the retained SDK 1.3.0 scenario referenced by baseline.json; this test never rebuilds its consumers.');
    scenario = await json(path.join(baselineDirectory, 'scenario.json'));
    baseline = scenario.composition;
    assert.equal(baseline.platformVersion, '1.3.0');
    assert.equal(scenario.releases['service-a'].runtimeRequirements.platform, '>=1.3.0 <2.0.0');
    protectedDirectories = Object.fromEntries(consumerNames.map((name) => [`original/${name}`, path.join(projects, name)]));
    for (const build of scenario.builds) protectedDirectories[`retained/${build.project}`] = path.join(baselineDirectory, 'checkouts', build.project, 'project');
    protectedBefore = Object.fromEntries(await Promise.all(Object.entries(protectedDirectories).map(async ([name, directory]) => [name, await fingerprint(directory, true)])));
    artifactBefore = Object.fromEntries(await Promise.all(Object.values(scenario.releases).map(async (release) => [release.id, await fingerprint(path.join(baselineDirectory, 'store/artifacts', release.id))])));
    productPointer = await readFile(path.resolve(integration, '../artifact-store/current.json'), 'utf8');
    temporary = await mkdtemp(path.join(os.tmpdir(), 'mfe-region-sdk-'));
    await cp(path.join(baselineDirectory, 'store'), path.join(temporary, 'store'), { recursive: true });
    await rm(path.join(temporary, 'store/usage.json'), { force: true });
    process.env.MFE_ARTIFACT_STORE = path.join(temporary, 'store');
    store = createRequire(import.meta.url)('../tools/store.cjs');
    assert.equal(store.current().compositionId, baseline.compositionId);
    report.baseline = baseline; report.consumerFingerprintsBefore = protectedBefore; report.artifactFingerprintsBefore = artifactBefore;
  });
  baseURL = await startServer();
  const chrome = process.env.CHROME_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
  context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  let old, late, newRecovered;
  await check('open existing tabs before publishing the new SDK and preserve direct B state during a D outage', async () => {
    old = await tab('existing-tab-1.3.0', baseline, 'D2-entry'); await runtimeProof(old, ['A']); await remember(old);
    late = await tab('existing-tab-late-A', baseline, null, false);
    assert.equal(await late.page.evaluate(() => window.__MFE_RUNTIME__.registry.platformVersion), '1.3.0');
  });
  await check('build and publish only SDK 1.3.1 while leaving the active composition unchanged', async () => {
    assert.equal((await json(path.join(projects, 'platform-sdk/package.json'))).version, '1.3.1');
    await buildSDK();
    const release = store.publish(path.join(projects, 'platform-sdk'));
    assert.equal(release.version, '1.3.1'); assert.notEqual(release.id, baseline.selected.platform);
    assert.deepEqual(release.runtimeRequirements, baseline.artifacts.platform.runtimeRequirements);
    assert.equal(store.current().compositionId, baseline.compositionId);
    report.newSDK = release;
  });
  await check('activate only the new SDK with the exact same A/C/B/D/Shell IDs and bindings', async () => {
    upgraded = store.activate({ platform: report.newSDK.id });
    for (const role of ['shell', 'A', 'C']) assert.equal(upgraded.selected[role], baseline.selected[role]);
    assert.deepEqual(upgraded.runtimeBindings, baseline.runtimeBindings);
    const services = (composition) => Object.keys(composition.artifacts).filter((id) => id !== 'platform' && !id.startsWith('platform_')).sort();
    assert.deepEqual(services(upgraded), services(baseline));
    report.upgraded = upgraded;
  });
  await check('existing tab keeps SDK 1.3.0 and still needs a second click after a transient manual failure', async () => {
    old.setMode('flaky');
    await retryResponse(old, 503); await old.page.getByTestId('remote-error-A--c').waitFor();
    await old.page.waitForTimeout(650); // Prove there is no 500ms automatic follow-up in the old SDK.
    assert.equal(old.phase, 1); await preserved(old); await runtimeProof(old, ['A']);
    await old.page.screenshot({ path: path.join(output, 'region-sdk-old-still-error.png'), fullPage: true });
    await retryResponse(old, 200); await runtimeProof(old); await preserved(old, true);
    assert.equal(old.phase, 2);
    old.record.manualClicksToRecover = 2;
  });
  for (const failure of ['C-entry', 'C-chunk', 'B2-entry', 'B2-chunk', 'D2-entry', 'D2-chunk']) {
    await check(`new SDK: ${failure} recovers after one click with one delayed follow-up and preserves A`, async () => {
      const s = await tab(`new-sdk-${failure}`, upgraded, failure);
      await runtimeProof(s, ['A']); await remember(s); s.setMode('flaky');
      await retryResponse(s, 200); const proof = await runtimeProof(s); await preserved(s, true);
      const attempts = s.record.attempts.filter((x) => x.mode === 'flaky');
      assert.equal(attempts.length, 2); assert.deepEqual(attempts.map((x) => x.status), [503, 200]);
      assert(attempts[1].at - attempts[0].at >= 450, 'The SDK follow-up waits for the configured delay');
      assert(proof.recovery.some((x) => x.attempt === 2));
      assert.equal(await s.page.getByRole('alert').count(), 0);
      s.record.manualClicksToRecover = 1; s.record.automaticFollowUps = 1;
      await s.page.screenshot({ path: path.join(output, `region-sdk-recovered-${failure}.png`), fullPage: true });
      if (failure === 'D2-entry') newRecovered = s;
    });
  }
  await check('persistent outage stops after two attempts and exposes the manual retry button again', async () => {
    const s = await tab('new-sdk-persistent-outage', upgraded, 'D2-entry'); await remember(s); s.setMode('broken');
    await retryResponse(s, 503); await s.page.getByTestId('remote-error-A--c').waitFor();
    await s.page.waitForTimeout(650);
    assert.equal(s.phase, 2); await preserved(s); await runtimeProof(s, ['A']);
    assert.equal(await s.page.getByTestId('retry-A--c').count(), 1);
  });
  await check('duplicate C regions share the complete automatic retry operation', async () => {
    const s = await tab('new-sdk-shared-retry', upgraded, 'D2-entry'); await remember(s);
    await s.page.getByTestId('add-a-copy').click(); await s.page.getByTestId('remote-error-A-copy--c').waitFor();
    s.setMode('flaky'); let release;
    s.gate = new Promise((resolve) => { release = resolve; });
    try {
      const request = s.page.waitForRequest(s.failedURL);
      await s.page.getByTestId('retry-A--c').click(); await request;
      await s.page.getByTestId('retry-A-copy--c').click();
      await s.page.getByTestId('remote-loading-A-copy--c').waitFor(); release();
      await runtimeProof(s, ['A', 'A--c', 'A-copy', 'A-copy--c']);
      assert.equal(s.phase, 2); await preserved(s);
      assert.equal(await textOf(widget(s.page, 'A-copy').getByTestId('count')), '0');
    } finally { release(); }
  });
  await check('removing C during the automatic retry delay ignores late completion', async () => {
    const s = await tab('new-sdk-remove-during-delay', upgraded, 'D2-entry'); await remember(s); s.setMode('flaky');
    const success = s.page.waitForResponse((r) => r.url() === s.failedURL && r.status() === 200);
    await retryResponse(s, 503); await s.page.getByTestId('toggle-c-A').click(); await success;
    await s.page.waitForLoadState('networkidle');
    await runtimeProof(s, ['A']); await preserved(s);
    assert.deepEqual(await s.page.evaluate(() => window.__MFE_PROOF__.mountOrder), ['A']);
    assert.equal(await s.page.getByTestId('remote-loading-A--c').count(), 0);
    await s.page.getByTestId('toggle-c-A').click(); await runtimeProof(s); assert.equal(s.phase, 2);
  });
  await check('missing exposed module is not treated as a transient file-loading failure', async () => {
    const s = await tab('new-sdk-contract-error', upgraded);
    await s.page.evaluate(async () => {
      const runtime = window.__MFE_RUNTIME__;
      const probe = (await (await runtime.getArtifactContainer(runtime.registry.applications.A)).get('./RemoteRegionProbe'))();
      const host = document.createElement('section');
      host.style.cssText = 'margin-left:280px;padding:24px';
      document.body.appendChild(host);
      window.__REGION_SDK_PROBE__ = probe.mount(host, [{ consumerId: runtime.registry.applications.C.id,
        alias: 'b', exposedModule: './Missing', instanceId: 'probe', label: '계약 검사' }]);
    });
    await s.page.getByTestId('remote-error-probe').waitFor();
    const before = (await runtimeProof(s)).recovery.length;
    await s.page.getByTestId('retry-probe').click(); await s.page.getByTestId('remote-error-probe').waitFor();
    await s.page.waitForTimeout(650);
    const added = (await runtimeProof(s)).recovery.slice(before);
    assert.equal(added.length, 1); assert.equal(added[0].attempt, 1);
    await s.page.evaluate(() => window.__REGION_SDK_PROBE__.unmount());
  });
  await check('a tab opened before activation loads A and C later with its original SDK', async () => {
    await late.page.getByTestId('add-a').click(); await runtimeProof(late);
    assert(!late.record.requests.some((url) => url.includes(report.newSDK.id)));
  });
  await check('rollback affects new tabs while already-open new-SDK tabs keep SDK 1.3.1', async () => {
    store.rollback(baseline.compositionId);
    const rollback = await tab('rollback-new-tab', baseline); await runtimeProof(rollback);
    await runtimeProof(newRecovered); await preserved(newRecovered);
    await runtimeProof(old); await preserved(old);
    store.activate({ platform: report.newSDK.id });
  });
  await check('consumer bytes and timestamps remain unchanged and retain both SDK combinations for replay', async () => {
    const after = Object.fromEntries(await Promise.all(Object.entries(protectedDirectories).map(async ([name, directory]) => [name, await fingerprint(directory, true)])));
    assert.deepEqual(after, protectedBefore); report.consumerFingerprintsAfter = after;
    for (const [id, before] of Object.entries(artifactBefore)) {
      assert.deepEqual(await fingerprint(path.join(baselineDirectory, 'store/artifacts', id)), before);
      assert.deepEqual(await fingerprint(path.join(temporary, 'store/artifacts', id)), before);
    }
    assert.equal(await readFile(path.resolve(integration, '../artifact-store/current.json'), 'utf8'), productPointer);
    assert.deepEqual(report.buildCommands, [{ command: 'npm run build', project: 'platform-sdk' }]);
    for (const page of report.pages) {
      assert.deepEqual(page.errors, []);
      assert(page.consoleErrors.every((error) => /RemoteRegion load failed|Failed to load resource/.test(error)));
    }
    const directory = await mkdtemp(path.join(replayRoot, 'verified-'));
    await cp(path.join(temporary, 'store'), path.join(directory, 'store'), { recursive: true });
    await rm(path.join(directory, 'store/usage.json'), { force: true });
    await save(path.join(directory, 'scenario.json'), { baseline, upgraded, baselineDirectory, builtOnly: ['platform-sdk'] });
    await save(path.join(replayRoot, 'latest.json'), { directory });
    report.retainedScenario = directory;
  });
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = { message: error.message, stack: error.stack }; process.exitCode = 1; console.error(error);
  await currentPage?.screenshot({ path: path.join(output, 'region-sdk-upgrade-failure.png'), fullPage: true }).catch(() => {});
} finally {
  await browser?.close();
  if (server && server.exitCode === null && server.signalCode === null) await new Promise((resolve) => {
    const timer = setTimeout(() => { server.kill('SIGKILL'); resolve(); }, 5000);
    server.once('exit', () => { clearTimeout(timer); resolve(); }); server.kill('SIGTERM');
  });
  if (temporary) await rm(temporary, { recursive: true, force: true });
  if (priorStore === undefined) delete process.env.MFE_ARTIFACT_STORE; else process.env.MFE_ARTIFACT_STORE = priorStore;
  report.finishedAt = new Date().toISOString(); report.passedChecks = report.checks.filter((x) => x.status === 'passed').length;
  await save(path.join(output, 'remote-region-sdk-upgrade.json'), report);
  console.log(`RemoteRegion SDK upgrade ${report.status}: ${report.passedChecks}/${report.checks.length}`);
}
