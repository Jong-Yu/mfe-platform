import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const integration = fileURLToPath(new URL('../', import.meta.url));
const projects = path.resolve(integration, '../projects');
const output = path.join(integration, 'artifacts/verification');
const names = ['platform-sdk', 'shell', 'service-a', 'service-c', 'service-b-v1', 'service-b-v2', 'service-d-v1', 'service-d-v2'];
const report = { startedAt: new Date().toISOString(), status: 'running', checks: [], pages: [],
  evidenceScope: 'Actual independently installed and built A 1.1, C 1.1 and B 2.1 with retry controls. A statically imports B 1.4 and uses RemoteRegion from the selected SDK 1.3 MF remote for C isolation and retries. No private RemoteRegion source is bundled in A. C imports B 2.1. Tests include real entry/chunk HTTP failures and withheld C responses. The new SDK 1.3 build is selected centrally. Existing Shell, B 1.4 and D builds are reused. D 2.0 entry/chunk failures and recovery are also exercised. Explicit retry tests restore the same failed URL without a page reload and compare direct B DOM/state and React/Context identity. This does not prove security isolation or arbitrary remote compatibility.' };
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));
const w = (page, id) => page.getByTestId(`widget-${id}`);
const txt = async (locator) => (await locator.innerText()).trim();
const originalStore = process.env.MFE_ARTIFACT_STORE;
let temporary, server, browser, currentPage, scenario, baseURL;
await mkdir(output, { recursive: true });

async function check(name, action) {
  const start = Date.now();
  try { await action(); report.checks.push({ name, status: 'passed', durationMs: Date.now() - start }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, status: 'failed', error: error.message }); throw error; }
}
async function fingerprint(directory) {
  const hash = createHash('sha256');
  let files = 0;
  async function visit(dir) {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (['node_modules', '.git', '.mfe-dev'].includes(entry.name)) continue;
      const file = path.join(dir, entry.name);
      assert(!entry.isSymbolicLink(), `Unexpected symlink: ${file}`);
      if (entry.isDirectory()) await visit(file);
      else { hash.update(path.relative(directory, file)).update('\0').update(await readFile(file)).update('\0'); files++; }
    }
  }
  await visit(directory);
  return { files, sha256: hash.digest('hex') };
}
async function fingerprints() {
  return Object.fromEntries(await Promise.all(names.map(async (name) => [name, await fingerprint(path.join(projects, name))])));
}
function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: integration, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    const capture = (chunk) => { log = (log + chunk).slice(-18000); };
    child.stdout.on('data', capture); child.stderr.on('data', capture);
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`Timed out: ${args.join(' ')}\n${log}`)); }, 300000);
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('exit', (code) => { clearTimeout(timer); code === 0 ? resolve(log) : reject(new Error(`Failed (${code}): ${log}`)); });
  });
}
async function startServer() {
  server = spawn(process.execPath, ['tools/serve.cjs'], { cwd: integration, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let log = '';
    const timer = setTimeout(() => reject(new Error(`Server not ready: ${log}`)), 10000);
    server.on('error', (error) => { clearTimeout(timer); reject(error); });
    server.stderr.on('data', (data) => { log += data; });
    server.stdout.on('data', (data) => {
      log += data;
      const match = log.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
    server.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Server exited (${code}): ${log}`)); });
  });
}
async function session(name, { navigate = true, mobile = false } = {}) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1200 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  currentPage = page;
  const record = { name, requests: [], remoteEntries: [], httpErrors: [], pageErrors: [], consoleErrors: [], failedRequests: [] };
  report.pages.push(record);
  page.on('request', (request) => record.requests.push(request.url()));
  page.on('response', (response) => {
    if (response.url().endsWith('/remoteEntry.js')) record.remoteEntries.push({ url: response.url(), status: response.status() });
    if (response.status() >= 400) record.httpErrors.push({ url: response.url(), status: response.status() });
  });
  page.on('pageerror', (error) => record.pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') record.consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => record.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  if (navigate) await page.goto(`${baseURL}/?empty=1`, { waitUntil: 'networkidle' });
  return { page, record, context };
}
function clean(record) {
  assert.deepEqual(record.pageErrors, [], record.name);
  assert.deepEqual(record.consoleErrors, [], record.name);
  assert.deepEqual(record.failedRequests, [], record.name);
  assert.deepEqual(record.httpErrors, [], record.name);
}
async function proof(page, expected) {
  for (const [id, version] of Object.entries(expected)) {
    await w(page, id).waitFor();
    assert.equal(await txt(w(page, id).getByTestId('version')), version);
    assert.equal(await txt(w(page, id).getByTestId('platform-version')), scenario.composition.platformVersion);
    const dependency = version === '1.4.0' ? scenario.releases['service-d-v1'] : scenario.releases['service-d-v2'];
    assert((await txt(w(page, id).getByTestId('dependency'))).includes(dependency.version));
  }
  await page.waitForFunction((ids) => {
    const snapshot = window.__MFE_PROOF__.getSnapshot();
    return snapshot.activeSubscriptions === ids.length && snapshot.activeInstances.length === ids.length;
  }, Object.keys(expected));
  const result = await page.evaluate(async () => {
    const runtime = window.__MFE_RUNTIME__;
    const registry = runtime.registry;
    const aContainer = await runtime.getArtifactContainer(registry.applications.A);
    const sdkContainer = await runtime.getContainer('platform');
    // Read the already-initialized real MF modules; no mocked exports or globals.
    const a = (await aContainer.get('./Widget'))().getIdentity();
    const cId = registry.runtimeBindings[registry.applications.A.id].c;
    const cContainer = await runtime.getArtifactContainer(registry.artifacts[cId]);
    const c = (await cContainer.get('./Widget'))().getIdentity();
    const sdk = (await sdkContainer.get('./sdk'))();
    return {
      compositionId: registry.compositionId,
      a: { id: a.consumerArtifact, version: a.consumerVersion, b: a.artifactId, d: a.dependencyArtifact },
      c: { id: c.consumerArtifact, version: c.consumerVersion, b: c.artifactId, d: c.dependencyArtifact },
      sameReact: [a.react, a.consumerReact, c.react, c.consumerReact].every((value) => value === sdk.ReactIdentity),
      sameContext: a.context === sdk.PlatformContext && c.context === sdk.PlatformContext,
      sameRemoteRegion: a.remoteRegion === sdk.RemoteRegion,
      diagnostics: runtime.getDiagnostics(),
      snapshot: window.__MFE_PROOF__.getSnapshot(),
      frozenBindings: Object.isFrozen(registry.runtimeBindings) && Object.values(registry.runtimeBindings).every(Object.isFrozen),
    };
  });
  const r = scenario.releases;
  assert.deepEqual(result.a, { id: r['service-a'].id, version: '1.1.0', b: r['service-b-v1'].id, d: r['service-d-v1'].id });
  assert.deepEqual(result.c, { id: r['service-c'].id, version: '1.1.0', b: r['service-b-v2'].id, d: r['service-d-v2'].id });
  assert(result.sameReact && result.sameContext && result.sameRemoteRegion && result.frozenBindings);
  assert.equal(result.compositionId, scenario.composition.compositionId);
  assert.deepEqual(result.diagnostics.runtimeBindings, scenario.composition.runtimeBindings);
  assert.deepEqual(result.snapshot.activeInstances.map((x) => x.instanceId).sort(), Object.keys(expected).sort());
  const ids = new Set(result.diagnostics.containers.map((x) => x.id));
  const containerNames = new Set(result.diagnostics.containers.map((x) => x.name));
  assert.equal(ids.size, 7); // SDK, A, C, two B builds and two D builds.
  assert.equal(containerNames.size, 7);
  for (const container of result.diagnostics.containers) {
    assert.equal(container.loadCount, 1, container.id);
    assert.equal(container.initCount, 1, container.id);
  }
  return result;
}
async function style(page, id) {
  return w(page, id).evaluate((element) => ({ classes: [...element.classList], background: getComputedStyle(element).backgroundColor }));
}
async function state(page, id) {
  return { count: await txt(w(page, id).getByTestId('count')), cache: await txt(w(page, id).getByTestId('cache-value')) };
}

async function directProof(page, ids = ['A']) {
  for (const id of ids) {
    await w(page, id).waitFor();
    assert.equal(await txt(w(page, id).getByTestId('version')), '1.4.0');
    assert.equal(await w(page, `${id}--c`).count(), 0);
  }
  await page.waitForFunction((expected) => {
    const s = window.__MFE_PROOF__.getSnapshot();
    return s.activeSubscriptions === expected.length && s.activeInstances.length === expected.length;
  }, ids);
  const value = await page.evaluate(() => ({
    snapshot: window.__MFE_PROOF__.getSnapshot(),
    identities: window.__MFE_PROOF__.identities(),
    diagnostics: window.__MFE_PROOF__.getRuntimeDiagnostics(),
    mounts: window.__MFE_PROOF__.mountOrder,
  }));
  assert.deepEqual(value.snapshot.activeInstances.map((x) => x.instanceId).sort(), [...ids].sort());
  for (const identity of value.identities) {
    assert(identity.reactMatches && identity.contextMatches);
    assert.equal(identity.artifactId, scenario.releases['service-b-v1'].id);
  }
  assert.equal(value.identities.length, ids.length);
  for (const name of ['platform-sdk', 'service-a', 'service-b-v1', 'service-d-v1']) {
    const record = value.diagnostics.containers.find((x) => x.id === scenario.releases[name].id);
    assert.equal(record.loadCount, 1, name);
    assert.equal(record.initCount, 1, name);
  }
  return value;
}

async function exerciseDirect(page, value) {
  await w(page, 'A').getByTestId('increment').click();
  await w(page, 'A').getByTestId('input').fill(value);
  await w(page, 'A').getByTestId('cache-write').click();
  await w(page, 'A').getByTestId('open-popup').click();
  await page.getByTestId('emit-event').click();
}

async function assertDirectPreserved(page, value, originalElement) {
  assert(await originalElement.evaluate((element) => element.isConnected));
  await w(page, 'A').getByTestId('cache-read').click();
  assert.deepEqual(await state(page, 'A'), { count: '1', cache: value });
  assert.equal(await w(page, 'A').getByTestId('input').inputValue(), value);
  assert.equal(await page.getByTestId('popup-A').count(), 1);
  await w(page, 'A').getByTestId('increment').click();
  await page.getByTestId('emit-event').click();
  assert.equal(await txt(w(page, 'A').getByTestId('count')), '2');
  assert.equal(await txt(w(page, 'A').getByTestId('event-count')), '2');
  assert.equal(await page.getByTestId('popup-A').evaluate((element) => element.closest('[data-portal-scope]').dataset.portalScope), 'A');
}

try {
  const before = await fingerprints();
  const livePointerFile = path.resolve(integration, '../artifact-store/current.json');
  const livePointer = existsSync(livePointerFile) ? await readFile(livePointerFile, 'utf8') : null;
  temporary = await mkdtemp(path.join(os.tmpdir(), 'mfe-nested-graph-'));
  const prepared = path.join(temporary, 'scenario');
  await check('build independent A 1.1, C 1.1 and B 2.1 with retry controls and preserve D artifacts', async () => {
    report.buildLog = await run(['tools/prepare-nested.cjs', '--output', prepared]);
    scenario = await json(path.join(prepared, 'scenario.json'));
    report.scenario = scenario;
    assert.equal(scenario.toolVersion, '1.5.0');
    assert.equal(scenario.releases['service-c'].retryProtocol, 'failed-modules-v2');
    assert.equal(scenario.releases['service-b-v2'].retryProtocol, 'failed-modules-v2');
    assert.equal(scenario.builds.length, 3);
    assert.equal(scenario.releases['platform-sdk'].version, (await json(path.join(projects, 'platform-sdk/package.json'))).version);
    assert.equal(scenario.releases['service-a'].runtimeRequirements.platform, '>=1.3.0 <2.0.0');
    for (const build of scenario.builds) {
      assert.deepEqual(await readdir(path.dirname(build.directory)), ['project']);
      assert(existsSync(path.join(build.directory, 'node_modules')));
      assert(existsSync(path.join(build.directory, 'package-lock.json')));
    }
    const r = scenario.releases;
    assert.equal(r['service-d-v2'].id, (await json(path.join(projects, 'service-d-v2/dist/release.json'))).id);
    assert.equal(r['service-d-v2'].version, '2.0.0');
    const aBuild = scenario.builds.find((build) => build.project === 'service-a');
    assert(!existsSync(path.join(aBuild.directory, 'src/RemoteRegion.jsx')));
    assert(!existsSync(path.join(aBuild.directory, 'src/remote-loader.js')));
    assert.match(await readFile(path.join(aBuild.directory, 'src/index.jsx'), 'utf8'), /import \{ RemoteRegion \} from 'platform\/sdk'/);
    const bBuild = scenario.builds.find((build) => build.project === 'service-b-v2');
    assert.deepEqual(await fingerprint(path.join(bBuild.directory, 'src')), await fingerprint(path.join(projects, 'service-b-v2/src')));
    assert.deepEqual(scenario.composition.runtimeBindings[r['service-a'].id], { b: r['service-b-v1'].id, c: r['service-c'].id });
    assert.deepEqual(scenario.composition.runtimeBindings[r['service-c'].id], { b: r['service-b-v2'].id });
    assert.deepEqual(r['service-a'].dependencies, {});
    report.beforeFingerprints = before;
  });
  process.env.MFE_ARTIFACT_STORE = scenario.storeDirectory;
  const store = createRequire(import.meta.url)('../tools/store.cjs');
  baseURL = await startServer();
  const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (existsSync(localChrome) ? localChrome : undefined);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browserVersion = browser.version();
  const only = await session('only-A-with-nested-C');
  await check('mounting only A executes both B versions through real HTTP remotes without a standalone C', async () => {
    await only.page.getByTestId('add-a').click();
    only.record.proof = await proof(only.page, { A: '1.4.0', 'A--c': '2.1.0' });
    assert.equal(await txt(only.page.getByTestId('c-version-A--c')), '1.1.0');
    assert.equal(await only.page.getByTestId('remove-c').count(), 0);
    assert.equal(await w(only.page, 'C').count(), 0);
    for (const name of names.filter((name) => name !== 'shell')) {
      const release = scenario.releases[name];
      assert.equal(only.record.remoteEntries.filter((entry) => new URL(entry.url).pathname === release.entry && entry.status === 200).length, 1, name);
    }
    clean(only.record);
    await only.page.screenshot({ path: path.join(output, 'nested-graph.png'), fullPage: true });
  });
  for (const order of [['C', 'A'], ['A', 'C']]) {
    await check(`shared C and B 2.1 containers work in ${order.join(' then ')} mount order`, async () => {
      const s = await session(`order-${order.join('-')}`);
      for (const id of order) await s.page.getByTestId(`add-${id.toLowerCase()}`).click();
      s.record.proof = await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0', C: '2.1.0' });
      await w(s.page, 'A--c').getByTestId('increment').click();
      assert.equal(await txt(w(s.page, 'C').getByTestId('count')), '0');
      assert.deepEqual(await style(s.page, 'A--c'), await style(s.page, 'C'));
      await s.page.getByTestId('remove-a').click();
      await proof(s.page, { C: '2.1.0' });
      await s.page.getByTestId('emit-event').click();
      assert.equal(await txt(w(s.page, 'C').getByTestId('event-count')), '1');
      clean(s.record);
    });
  }
  await check('direct and nested B isolate computed CSS, state, cache and portal roots', async () => {
    const page = only.page;
    const styles = { A: await style(page, 'A'), 'A--c': await style(page, 'A--c') };
    assert(styles.A.classes.every((name) => !styles['A--c'].classes.includes(name)));
    assert.notEqual(styles.A.background, styles['A--c'].background);
    assert.notEqual(styles.A.background, 'rgba(0, 0, 0, 0)');
    assert.notEqual(styles['A--c'].background, 'rgba(0, 0, 0, 0)');
    await w(page, 'A').getByTestId('increment').click();
    assert.equal(await txt(w(page, 'A--c').getByTestId('count')), '0');
    for (const id of ['A', 'A--c']) {
      await w(page, id).getByTestId('input').fill(`${id}-private-cache`);
      await w(page, id).getByTestId('cache-write').click();
      await w(page, id).getByTestId('open-popup').click();
      assert.equal(await page.getByTestId(`popup-${id}`).evaluate((element) => element.closest('[data-portal-scope]').dataset.portalScope), id);
    }
    // Read after BOTH writes so a mistakenly shared cache cannot pass via stale UI text.
    for (const id of ['A', 'A--c']) {
      await w(page, id).getByTestId('cache-read').click();
      assert.equal(await txt(w(page, id).getByTestId('cache-value')), `${id}-private-cache`);
    }
    assert.deepEqual(await style(page, 'A'), styles.A);
    assert.deepEqual(await style(page, 'A--c'), styles['A--c']);
    report.computedStyles = styles;
    clean(only.record);
  });
  await check('duplicating A creates four isolated widget instances while reusing all remote containers', async () => {
    const page = only.page;
    await page.getByTestId('add-a-copy').click();
    await proof(page, { A: '1.4.0', 'A--c': '2.1.0', 'A-copy': '1.4.0', 'A-copy--c': '2.1.0' });
    for (const id of ['A-copy', 'A-copy--c']) {
      assert.deepEqual(await state(page, id), { count: '0', cache: '' });
      await w(page, id).getByTestId('cache-read').click();
      assert.equal(await txt(w(page, id).getByTestId('cache-value')), '');
    }
    assert.deepEqual(await style(page, 'A'), await style(page, 'A-copy'));
    assert.deepEqual(await style(page, 'A--c'), await style(page, 'A-copy--c'));
    const ids = await page.locator('[id]').evaluateAll((elements) => elements.map((element) => element.id));
    assert.equal(new Set(ids).size, ids.length, 'DOM IDs are unique across the nested copies');
    await page.getByTestId('emit-event').click();
    for (const id of ['A', 'A--c', 'A-copy', 'A-copy--c']) assert.equal(await txt(w(page, id).getByTestId('event-count')), '1');
  });
  await check('removing and remounting C inside A cleans only its state, subscriptions and portal', async () => {
    const page = only.page;
    await page.getByTestId('toggle-c-A').click();
    await proof(page, { A: '1.4.0', 'A-copy': '1.4.0', 'A-copy--c': '2.1.0' });
    assert.equal(await page.getByTestId('popup-A--c').count(), 0);
    assert.equal(await page.getByTestId('popup-A').count(), 1);
    assert.deepEqual(await state(page, 'A'), { count: '1', cache: 'A-private-cache' });
    await page.getByTestId('emit-event').click();
    for (const id of ['A', 'A-copy', 'A-copy--c']) assert.equal(await txt(w(page, id).getByTestId('event-count')), '2');
    await page.getByTestId('toggle-c-A').click();
    await proof(page, { A: '1.4.0', 'A--c': '2.1.0', 'A-copy': '1.4.0', 'A-copy--c': '2.1.0' });
    await w(page, 'A--c').getByTestId('cache-read').click();
    assert.deepEqual(await state(page, 'A--c'), { count: '0', cache: '' });
    assert.equal(await txt(w(page, 'A--c').getByTestId('event-count')), '0');
    assert.deepEqual(await state(page, 'A'), { count: '1', cache: 'A-private-cache' });
  });
  await check('removing A cleans both of its branches and leaves the duplicated A functional', async () => {
    const page = only.page;
    await w(page, 'A--c').getByTestId('open-popup').click();
    await page.getByTestId('remove-a').click();
    await proof(page, { 'A-copy': '1.4.0', 'A-copy--c': '2.1.0' });
    assert.equal(await page.getByRole('dialog').count(), 0);
    await page.getByTestId('emit-event').click();
    for (const id of ['A-copy', 'A-copy--c']) assert.equal(await txt(w(page, id).getByTestId('event-count')), '3');
    await page.getByTestId('add-a').click();
    await proof(page, { A: '1.4.0', 'A--c': '2.1.0', 'A-copy': '1.4.0', 'A-copy--c': '2.1.0' });
    assert.deepEqual(await state(page, 'A'), { count: '0', cache: '' });
    clean(only.record);
  });
  await check('missing A.c and incompatible B bindings are rejected without inheriting the parent selection', async () => {
    const saved = store.read('registry.json');
    const r = scenario.releases;
    const missing = structuredClone(saved.runtimeBindings);
    delete missing[r['service-a'].id].c;
    report.rejections = [];
    const reject = (label, action, pattern) => {
      let message;
      assert.throws(() => { try { action(); } catch (error) { message = error.message; throw error; } }, pattern);
      assert.deepEqual(store.read('registry.json'), saved);
      report.rejections.push({ label, message });
    };
    reject('A.c missing', () => store.activate({}, missing, { replaceBindings: true }), /Missing runtime binding/);
    reject('A.b incorrectly set to C.b', () => store.activate({}, { [r['service-a'].id]: { b: r['service-b-v2'].id } }), /Incompatible runtime dependency/);
    reject('C.b incorrectly inherits A.b', () => store.activate({}, { [r['service-c'].id]: { b: r['service-b-v1'].id } }), /Incompatible runtime dependency/);
    reject('A.c is not a C release', () => store.activate({}, { [r['service-a'].id]: { c: r['service-b-v2'].id } }), /Wrong runtime service/);
  });
  const failures = [
    { name: 'C-entry', project: 'service-c', status: 404 },
    { name: 'B2-entry', project: 'service-b-v2', status: 503 },
    { name: 'C-chunk', project: 'service-c', status: 503, chunk: true },
    { name: 'B2-chunk', project: 'service-b-v2', status: 503, chunk: true },
    { name: 'D2-entry', project: 'service-d-v2', status: 404 },
    { name: 'D2-chunk', project: 'service-d-v2', status: 503, chunk: true },
  ];
  for (const failure of failures) {
    await check(`${failure.name} HTTP failure stays inside C while direct B retains state and remains interactive`, async () => {
      const s = await session(`isolated-${failure.name}`, { navigate: false });
      const release = scenario.releases[failure.project];
      let requestPath = release.entry;
      if (failure.chunk) {
        const files = await readdir(path.join(scenario.storeDirectory, 'artifacts', release.id));
        const chunks = files.filter((name) => name.startsWith('src_') && name.endsWith('.js'));
        assert.equal(chunks.length, 1);
        requestPath = `/artifacts/${release.id}/${chunks[0]}`;
      }
      const failedURL = new URL(requestPath, baseURL).href;
      let releaseRequest;
      const gate = new Promise((resolve) => { releaseRequest = resolve; });
      const reached = s.page.waitForRequest(failedURL);
      await s.page.route(failedURL, async (route) => {
        await gate;
        await route.fulfill({ status: failure.status, contentType: 'text/plain', body: 'Deliberate remote outage for isolation verification' });
      });
      try {
        await s.page.goto(`${baseURL}/?empty=1`, { waitUntil: 'networkidle' });
        await s.page.getByTestId('add-a').click();
        await reached;
        // C has not responded yet. A must already be usable, not waiting for failure.
        await s.page.getByTestId('remote-loading-A--c').waitFor();
        await directProof(s.page);
        const directElement = await w(s.page, 'A').elementHandle();
        const priorStyle = await style(s.page, 'A');
        const value = `${failure.name}-preserved`;
        await exerciseDirect(s.page, value);
        releaseRequest();
        await s.page.getByTestId('remote-error-A--c').waitFor();
        assert.equal(await s.page.getByRole('alert').count(), 1);
        await assertDirectPreserved(s.page, value, directElement);
        assert.deepEqual(await style(s.page, 'A'), priorStyle);
        s.record.proof = await directProof(s.page);
        assert.deepEqual(s.record.proof.mounts, ['A']);
        assert(s.record.httpErrors.length >= 1);
        assert(s.record.httpErrors.every((entry) => entry.url === failedURL && entry.status === failure.status));
        assert(s.record.failedRequests.every((entry) => entry.url === failedURL));
        assert.deepEqual(s.record.pageErrors, []);
        assert(s.record.consoleErrors.every((error) => /RemoteRegion load failed|Failed to load resource/.test(error)));
        s.record.expectedFailure = { url: failedURL, status: failure.status, boundary: 'A--c only' };
        await s.page.screenshot({ path: path.join(output, `nested-isolation-${failure.name}.png`), fullPage: true });
        if (failure.name === 'C-entry') {
          await s.page.getByTestId('add-a-copy').click();
          await s.page.getByTestId('remote-error-A-copy--c').waitFor();
          await directProof(s.page, ['A', 'A-copy']);
          assert.deepEqual(await state(s.page, 'A-copy'), { count: '0', cache: '' });
          await s.page.getByTestId('toggle-c-A').click();
          assert.equal(await s.page.getByTestId('remote-error-A--c').count(), 0);
          assert.equal(await s.page.getByTestId('remote-error-A-copy--c').count(), 1);
          await directProof(s.page, ['A', 'A-copy']);
          await s.page.setViewportSize({ width: 390, height: 844 });
          assert(await s.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          await s.page.screenshot({ path: path.join(output, 'nested-isolation-mobile.png'), fullPage: true });
          assert.deepEqual(s.record.pageErrors, []);
        }
      } finally { releaseRequest(); }
    });
  }
  for (const failure of failures) {
    await check(`${failure.name} recovers by retrying only C after the same file becomes available`, async () => {
      const s = await session(`recovered-${failure.name}`, { navigate: false });
      const release = scenario.releases[failure.project];
      const files = failure.chunk ? await readdir(path.join(scenario.storeDirectory, 'artifacts', release.id)) : [];
      const requestPath = failure.chunk ? `/artifacts/${release.id}/${files.find((name) => name.startsWith('src_') && name.endsWith('.js'))}` : release.entry;
      const failedURL = new URL(requestPath, baseURL).href;
      let broken = true;
      let navigationCount = 0;
      s.page.on('framenavigated', (frame) => { if (frame === s.page.mainFrame()) navigationCount++; });
      await s.page.route(failedURL, (route) => broken
        ? route.fulfill({ status: failure.status, contentType: 'text/plain', body: 'Temporary outage for recovery verification' })
        : route.continue());
      await s.page.goto(`${baseURL}/?empty=1`, { waitUntil: 'networkidle' });
      await s.page.getByTestId('add-a').click();
      await s.page.getByTestId('remote-error-A--c').waitFor();
      await directProof(s.page);
      const directElement = await w(s.page, 'A').elementHandle();
      const priorStyle = await style(s.page, 'A');
      const value = `${failure.name}-survives-retry`;
      await exerciseDirect(s.page, value);
      const beforeRetry = await s.page.evaluate(() => ({
        compositionId: window.__MFE_RUNTIME__.registry.compositionId,
        snapshot: window.__MFE_PROOF__.getSnapshot(),
        requests: performance.getEntriesByType('navigation').length,
      }));
      // A retry during the outage must fail locally again, not fall back or reset A.
      if (['B2-entry', 'D2-entry', 'D2-chunk'].includes(failure.name)) {
        const nextError = s.page.waitForResponse((response) => response.url() === failedURL && response.status() === failure.status);
        await s.page.getByTestId('retry-A--c').click();
        await nextError;
        await s.page.getByTestId('remote-error-A--c').waitFor();
        await directProof(s.page);
        assert.deepEqual(await state(s.page, 'A'), { count: '1', cache: value });
        assert.equal(await s.page.getByTestId('popup-A').count(), 1);
      }
      const failedAttempts = s.record.httpErrors.filter((entry) => entry.url === failedURL).length;
      assert(failedAttempts >= 1);
      broken = false;
      const restoredResponse = s.page.waitForResponse((response) => response.url() === failedURL && response.status() === 200);
      await s.page.getByTestId('retry-A--c').click();
      await restoredResponse;
      s.record.proof = await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0' });
      await assertDirectPreserved(s.page, value, directElement);
      assert.deepEqual(await style(s.page, 'A'), priorStyle);
      assert.equal(await s.page.getByRole('alert').count(), 0);
      assert.equal(await txt(s.page.getByTestId('c-version-A--c')), '1.1.0');
      assert.equal(navigationCount, 1);
      assert.equal(await s.page.evaluate(() => performance.getEntriesByType('navigation').length), beforeRetry.requests);
      assert.equal(s.record.proof.compositionId, beforeRetry.compositionId);
      assert.deepEqual(await s.page.evaluate(() => window.__MFE_PROOF__.mountOrder), ['A', 'A--c']);
      for (const name of ['platform-sdk', 'service-a', 'service-b-v1', 'service-d-v1']) {
        assert.equal(s.record.requests.filter((url) => new URL(url).pathname === scenario.releases[name].entry).length, 1, name);
      }
      const recoveryLog = await s.page.evaluate(async () => {
        const runtime = window.__MFE_RUNTIME__;
        const container = await runtime.getContainer('platform');
        return (await container.get('./sdk'))().getRemoteRecoveryLog();
      });
      assert(recoveryLog.some((entry) => entry.artifactId === scenario.releases['service-c'].id));
      assert(recoveryLog.every((entry) => entry.consumerId === scenario.releases['service-a'].id && entry.alias === 'c'));
      if (failure.project === 'service-b-v2') assert(recoveryLog.some((entry) => entry.removed.some((id) => id.includes('src/index.jsx'))), 'C module evaluation failures were actually evicted');
      if (failure.project === 'service-d-v2') {
        const bRecoveries = recoveryLog.filter((entry) => entry.artifactId === scenario.releases['service-b-v2'].id);
        assert(bRecoveries.some((entry) => entry.removed.includes('./src/Widget.jsx')));
        assert(bRecoveries.some((entry) => entry.removed.includes('webpack/container/remote/d/data')));
        assert(bRecoveries.some((entry) => entry.prepared.includes('./Widget')), 'B dependency loading is re-entered before C evaluation');
        const bIndex = recoveryLog.findIndex((entry) => entry.artifactId === scenario.releases['service-b-v2'].id);
        const cIndex = recoveryLog.findIndex((entry) => entry.artifactId === scenario.releases['service-c'].id);
        assert(bIndex < cIndex, 'recover the child before its parent');
        assert.equal(await txt(w(s.page, 'A--c').getByTestId('dependency')), 'D 2.0.0');
        assert.equal(await txt(w(s.page, 'A').getByTestId('dependency')), 'D 1.0.0');
      }
      assert(recoveryLog.every((entry) => !['service-b-v1', 'service-d-v1', 'platform-sdk'].some((name) => entry.artifactId === scenario.releases[name].id)));
      s.record.recovery = { failedURL, failedAttempts, restoredStatus: 200, navigationCount, recoveryLog };
      assert(s.record.httpErrors.every((entry) => entry.url === failedURL && entry.status === failure.status));
      assert.deepEqual(s.record.pageErrors, []);
      assert(s.record.consoleErrors.every((error) => /RemoteRegion load failed|Failed to load resource/.test(error)));
      await s.page.screenshot({ path: path.join(output, `nested-recovered-${failure.name}.png`), fullPage: true });
      if (failure.name === 'D2-entry') {
        await s.page.setViewportSize({ width: 390, height: 844 });
        assert(await s.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await s.page.screenshot({ path: path.join(output, 'nested-recovered-D2-mobile.png'), fullPage: true });
      }
    });
  }
  for (const retryProject of ['service-c', 'service-d-v2']) {
  await check(`${retryProject}: two C regions share one pending retry while retaining separate UI state`, async () => {
    const s = await session(`concurrent-retry-${retryProject}`, { navigate: false });
    const url = new URL(scenario.releases[retryProject].entry, baseURL).href;
    let broken = true, successfulRequests = 0, releaseRequest;
    const gate = new Promise((resolve) => { releaseRequest = resolve; });
    await s.page.route(url, async (route) => {
      if (broken) return route.fulfill({ status: 503, body: 'Unavailable' });
      successfulRequests++;
      await gate;
      await route.continue();
    });
    try {
      await s.page.goto(`${baseURL}/?empty=1`, { waitUntil: 'networkidle' });
      await s.page.getByTestId('add-a').click();
      await s.page.getByTestId('remote-error-A--c').waitFor();
      await s.page.getByTestId('add-a-copy').click();
      await s.page.getByTestId('remote-error-A-copy--c').waitFor();
      await directProof(s.page, ['A', 'A-copy']);
      const element = await w(s.page, 'A').elementHandle();
      await exerciseDirect(s.page, 'concurrent-retry-kept');
      broken = false;
      const requested = s.page.waitForRequest(url);
      await s.page.getByTestId('retry-A--c').click();
      await requested;
      await s.page.getByTestId('retry-A-copy--c').click();
      await s.page.getByTestId('remote-loading-A-copy--c').waitFor();
      assert.equal(await s.page.getByTestId('retry-A--c').count(), 0);
      assert.equal(await s.page.getByTestId('retry-A-copy--c').count(), 0);
      releaseRequest();
      await proof(s.page, { A: '1.4.0', 'A-copy': '1.4.0', 'A--c': '2.1.0', 'A-copy--c': '2.1.0' });
      assert.equal(successfulRequests, 1);
      await assertDirectPreserved(s.page, 'concurrent-retry-kept', element);
      await w(s.page, 'A--c').getByTestId('increment').click();
      assert.equal(await txt(w(s.page, 'A-copy--c').getByTestId('count')), '0');
      assert.deepEqual(await state(s.page, 'A-copy'), { count: '0', cache: '' });
      assert.deepEqual(s.record.pageErrors, []);
    } finally { releaseRequest(); }
  });
  await check(`${retryProject}: removing C during retry ignores late recovery and preserves direct B`, async () => {
    const s = await session(`hide-pending-retry-${retryProject}`, { navigate: false });
    const url = new URL(scenario.releases[retryProject].entry, baseURL).href;
    let broken = true, releaseRequest;
    const gate = new Promise((resolve) => { releaseRequest = resolve; });
    await s.page.route(url, async (route) => {
      if (broken) return route.fulfill({ status: 503, body: 'Unavailable' });
      await gate;
      await route.continue();
    });
    try {
      await s.page.goto(`${baseURL}/?empty=1`, { waitUntil: 'networkidle' });
      await s.page.getByTestId('add-a').click();
      await s.page.getByTestId('remote-error-A--c').waitFor();
      const element = await w(s.page, 'A').elementHandle();
      await exerciseDirect(s.page, 'hidden-retry-kept');
      broken = false;
      const requested = s.page.waitForRequest(url);
      await s.page.getByTestId('retry-A--c').click();
      await requested;
      await s.page.getByTestId('remote-loading-A--c').waitFor();
      await s.page.getByTestId('toggle-c-A').click();
      releaseRequest();
      await s.page.waitForFunction((id) => window.__MFE_RUNTIME__.getDiagnostics().containers.some((x) => x.id === id && x.initCount === 1), scenario.releases['service-b-v2'].id);
      await s.page.waitForLoadState('networkidle');
      await directProof(s.page);
      assert.equal(await s.page.getByRole('alert').count(), 0);
      assert.equal(await s.page.getByTestId('remote-loading-A--c').count(), 0);
      await assertDirectPreserved(s.page, 'hidden-retry-kept', element);
      await s.page.getByTestId('toggle-c-A').click();
      await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0' });
      assert.equal(await txt(w(s.page, 'A').getByTestId('count')), '2');
      assert.deepEqual(await s.page.evaluate(() => window.__MFE_PROOF__.mountOrder), ['A', 'A--c']);
      assert.deepEqual(s.record.pageErrors, []);
    } finally { releaseRequest(); }
  });
  }
  await check('slow C keeps its loading region local and later mounts without resetting direct B', async () => {
    const s = await session('slow-C-success', { navigate: false });
    const url = new URL(scenario.releases['service-c'].entry, baseURL).href;
    let releaseRequest;
    const gate = new Promise((resolve) => { releaseRequest = resolve; });
    const reached = s.page.waitForRequest(url);
    await s.page.route(url, async (route) => { await gate; await route.continue(); });
    try {
      await s.page.goto(`${baseURL}/?empty=1`, { waitUntil: 'networkidle' });
      await s.page.getByTestId('add-a').click();
      await reached;
      await s.page.getByTestId('remote-loading-A--c').waitFor();
      await directProof(s.page);
      const element = await w(s.page, 'A').elementHandle();
      await exerciseDirect(s.page, 'slow-C-kept');
      releaseRequest();
      await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0' });
      await assertDirectPreserved(s.page, 'slow-C-kept', element);
      assert.equal(await txt(w(s.page, 'A--c').getByTestId('count')), '0');
      assert.equal(await txt(w(s.page, 'A--c').getByTestId('event-count')), '1');
      assert.equal(await s.page.getByRole('alert').count(), 0);
      clean(s.record);
    } finally { releaseRequest(); }
  });
  await check('hiding C while it loads ignores late completion and does not leak a scope or subscription', async () => {
    const s = await session('hide-pending-C', { navigate: false });
    const url = new URL(scenario.releases['service-c'].entry, baseURL).href;
    let releaseRequest;
    const gate = new Promise((resolve) => { releaseRequest = resolve; });
    const reached = s.page.waitForRequest(url);
    await s.page.route(url, async (route) => { await gate; await route.continue(); });
    try {
      await s.page.goto(`${baseURL}/?empty=1`, { waitUntil: 'networkidle' });
      await s.page.getByTestId('add-a').click();
      await reached;
      await directProof(s.page);
      await s.page.getByTestId('toggle-c-A').click();
      await exerciseDirect(s.page, 'hidden-C-kept');
      releaseRequest();
      await s.page.waitForFunction((id) => window.__MFE_RUNTIME__.getDiagnostics().containers.some((x) => x.id === id && x.initCount === 1), scenario.releases['service-b-v2'].id);
      await s.page.waitForLoadState('networkidle');
      await directProof(s.page);
      assert.equal(await s.page.getByTestId('remote-loading-A--c').count(), 0);
      assert.equal(await s.page.getByRole('alert').count(), 0);
      await s.page.getByTestId('toggle-c-A').click();
      await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0' });
      assert.deepEqual(await state(s.page, 'A'), { count: '1', cache: 'hidden-C-kept' });
      clean(s.record);
    } finally { releaseRequest(); }
  });
  await check('nested layout renders and remains interactive at a 390px viewport', async () => {
    const s = await session('nested-mobile', { mobile: true });
    await s.page.getByTestId('add-a').click();
    await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0' });
    assert(await s.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await w(s.page, 'A--c').getByTestId('increment').click();
    assert.equal(await txt(w(s.page, 'A--c').getByTestId('count')), '1');
    await s.page.screenshot({ path: path.join(output, 'nested-graph-mobile.png'), fullPage: true });
    clean(s.record);
  });
  await check('SDK RemoteRegion separates identical aliases by consumer and forwards component props', async () => {
    const s = await session('sdk-consumer-aliases');
    await s.page.getByTestId('add-a').click();
    await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0' });
    await s.page.evaluate(async () => {
      const runtime = window.__MFE_RUNTIME__;
      const container = await runtime.getArtifactContainer(runtime.registry.applications.A);
      const probe = (await container.get('./RemoteRegionProbe'))();
      const element = document.createElement('section'); document.body.appendChild(element);
      window.__SDK_PROBE_MOUNTS__ = [];
      window.__SDK_PROBE__ = probe.mount(element, ['A', 'C'].map((consumer) => ({
        consumerId: runtime.registry.applications[consumer].id, alias: 'b', instanceId: `probe-${consumer}`, label: `${consumer} 차량`,
        componentProps: { instanceId: `probe-${consumer}`, onMounted: (id) => window.__SDK_PROBE_MOUNTS__.push(id) },
      })));
    });
    s.record.proof = await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0', 'probe-A': '1.4.0', 'probe-C': '2.1.0' });
    assert.deepEqual(await s.page.evaluate(() => [...window.__SDK_PROBE_MOUNTS__].sort()), ['probe-A', 'probe-C']);
    await w(s.page, 'probe-A').getByTestId('increment').click();
    assert.equal(await txt(w(s.page, 'probe-C').getByTestId('count')), '0');
    await s.page.evaluate(() => window.__SDK_PROBE__.unmount());
    await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0' });
    clean(s.record);
  });
  await check('SDK RemoteRegion resets only its region on consumer/module changes and rejects invalid consumers', async () => {
    const s = await session('sdk-region-reconfiguration');
    await s.page.getByTestId('add-a').click();
    await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0' });
    const element = await w(s.page, 'A').elementHandle();
    await exerciseDirect(s.page, 'sdk-component-kept');
    await s.page.evaluate(async () => {
      const runtime = window.__MFE_RUNTIME__;
      const container = await runtime.getArtifactContainer(runtime.registry.applications.A);
      const probe = (await container.get('./RemoteRegionProbe'))();
      const host = document.createElement('section'); document.body.appendChild(host);
      window.__SDK_PROBE__ = probe.mount(host, []);
      window.__UPDATE_SDK_PROBE__ = (consumer, exposedModule = './Widget') => window.__SDK_PROBE__.render([{
        consumerId: runtime.registry.applications[consumer]?.id || 'unknown-consumer', alias: 'b', exposedModule,
        instanceId: 'probe', label: '차량 목록', componentProps: { instanceId: 'probe' },
      }]);
      window.__UPDATE_SDK_PROBE__('A');
    });
    await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0', probe: '1.4.0' });
    await w(s.page, 'probe').getByTestId('increment').click();
    await s.page.evaluate(() => window.__UPDATE_SDK_PROBE__('C'));
    // root.render schedules React work; the old region may still be visible
    // immediately after evaluate returns, even though its props have changed.
    await s.page.waitForFunction(() => document.querySelector('[data-testid="widget-probe"] [data-testid="version"]')?.textContent.trim() === '2.1.0');
    await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0', probe: '2.1.0' });
    assert.equal(await txt(w(s.page, 'probe').getByTestId('count')), '0');
    for (const [consumer, exposed] of [['unknown', './Widget'], ['C', './Missing']]) {
      await s.page.evaluate(([c, m]) => window.__UPDATE_SDK_PROBE__(c, m), [consumer, exposed]);
      await s.page.getByTestId('remote-error-probe').waitFor();
      assert.equal(await txt(s.page.getByTestId('retry-probe')), '차량 목록 영역 다시 시도');
      await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0' });
      await s.page.evaluate(() => window.__UPDATE_SDK_PROBE__('C'));
      await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0', probe: '2.1.0' });
    }
    await assertDirectPreserved(s.page, 'sdk-component-kept', element);
    await s.page.evaluate(() => window.__SDK_PROBE__.unmount());
    await proof(s.page, { A: '1.4.0', 'A--c': '2.1.0' });
    assert.equal(s.record.consoleErrors.filter((error) => error.startsWith('RemoteRegion load failed:')).length, 2);
    assert.deepEqual(s.record.pageErrors, []);
    assert.deepEqual(s.record.httpErrors, []);
  });
  await check('original projects and active composition stay unchanged; retain the tested scenario for manual replay', async () => {
    const after = await fingerprints();
    assert.deepEqual(after, before);
    assert.equal(existsSync(livePointerFile) ? await readFile(livePointerFile, 'utf8') : null, livePointer);
    report.afterFingerprints = after;
    const demoRoot = path.join(integration, 'artifacts/nested-demo');
    await mkdir(demoRoot, { recursive: true });
    const retained = await mkdtemp(path.join(demoRoot, 'verified-'));
    await cp(prepared, retained, { recursive: true, filter: (file) => !path.relative(prepared, file).split(path.sep).includes('node_modules') });
    // Test tab leases do not belong in the interactive demo's usage history.
    await rm(path.join(retained, 'store/usage.json'), { force: true });
    const replay = structuredClone(scenario);
    replay.directory = retained;
    replay.storeDirectory = path.join(retained, 'store');
    replay.builds = replay.builds.map((build) => ({ ...build, directory: path.join(retained, path.relative(prepared, build.directory)) }));
    await writeFile(path.join(retained, 'scenario.json'), JSON.stringify(replay, null, 2) + '\n');
    await writeFile(path.join(demoRoot, 'latest.json'), JSON.stringify({ directory: retained }, null, 2) + '\n');
    report.retainedScenario = retained;
  });
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = { message: error.message, stack: error.stack }; process.exitCode = 1; console.error(error);
  await currentPage?.screenshot({ path: path.join(output, 'nested-graph-failure.png'), fullPage: true }).catch(() => {});
} finally {
  await browser?.close();
  if (server && server.exitCode === null && server.signalCode === null) await new Promise((resolve) => {
    const timer = setTimeout(() => { server.kill('SIGKILL'); resolve(); }, 5000);
    server.once('exit', () => { clearTimeout(timer); resolve(); }); server.kill('SIGTERM');
  });
  if (temporary) await rm(temporary, { recursive: true, force: true });
  if (originalStore === undefined) delete process.env.MFE_ARTIFACT_STORE; else process.env.MFE_ARTIFACT_STORE = originalStore;
  report.finishedAt = new Date().toISOString();
  report.passedChecks = report.checks.filter((item) => item.status === 'passed').length;
  await writeFile(path.join(output, 'nested-graph.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Nested graph verification ${report.status}: ${report.passedChecks}/${report.checks.length}. Report: ${path.join(output, 'nested-graph.json')}`);
}
