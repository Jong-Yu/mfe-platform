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
const projectNames = ['platform-sdk', 'service-d-v1', 'service-d-v2', 'service-b-v1', 'service-b-v2', 'service-a', 'service-c', 'shell'];
const report = { startedAt: new Date().toISOString(), status: 'running', checks: [], pages: [], consumerBuildsExecuted: 0,
  evidenceScope: 'After the one-time runtime migration, only two isolated D checkouts are built. All original project source/configuration/output bytes are compared. Real browser tabs keep A/C and B identities unchanged while B 1.x and B 2.x select different D releases using one SDK. Invalid graph probes are metadata-only.' };
const originalStore = process.env.MFE_ARTIFACT_STORE;
let temporary, server, browser, currentPage;
await mkdir(output, { recursive: true });
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));
const widget = (page, id) => page.getByTestId(`widget-${id}`);
const text = async (locator) => (await locator.innerText()).trim();

async function check(name, action) {
  const started = Date.now();
  try { await action(); report.checks.push({ name, status: 'passed', durationMs: Date.now() - started }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, status: 'failed', error: error.message }); throw error; }
}
async function fingerprint(directory) {
  const hash = createHash('sha256');
  let files = 0;
  async function visit(dir) {
    for (const item of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (['node_modules', '.git'].includes(item.name)) continue;
      const file = path.join(dir, item.name);
      assert(!item.isSymbolicLink(), `Unexpected symlink: ${file}`);
      if (item.isDirectory()) await visit(file);
      else { hash.update(path.relative(directory, file)).update('\0').update(await readFile(file)).update('\0'); files++; }
    }
  }
  await visit(directory);
  return { files, sha256: hash.digest('hex') };
}
async function fingerprints() {
  return Object.fromEntries(await Promise.all(projectNames.map(async (name) => [name, await fingerprint(path.join(projects, name))])));
}
function run(command, args, cwd = integration) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.NODE_PATH;
    delete env.npm_config_workspace;
    delete env.npm_config_workspaces;
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    const capture = (chunk) => { log = (log + chunk).slice(-16000); };
    child.stdout.on('data', capture); child.stderr.on('data', capture);
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error(`Command timed out: ${command}\n${log}`)); }, 180000);
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('exit', (code) => { clearTimeout(timer); code === 0 ? resolve({ command, args, exitCode: code }) : reject(new Error(`Command failed: ${command}\n${log}`)); });
  });
}
async function startServer() {
  server = spawn(process.execPath, ['tools/serve.cjs'], { cwd: integration, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let log = '';
    const timer = setTimeout(() => reject(new Error(`Server not ready: ${log}`)), 10000);
    server.on('error', (error) => { clearTimeout(timer); reject(error); });
    server.stderr.on('data', (chunk) => { log += chunk; });
    server.stdout.on('data', (chunk) => {
      log += chunk;
      const match = log.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
    server.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Server exited (${code}): ${log}`)); });
  });
}
async function trackedPage(name, url) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  currentPage = page;
  const record = { name, remoteEntries: [], requests: [], bootRequests: [], consoleErrors: [], pageErrors: [], failedRequests: [] };
  report.pages.push(record);
  page.on('request', (request) => {
    record.requests.push(request.url());
    if (/\/compositions\/[^/]+\.json$/.test(request.url())) record.bootRequests.push(request.url());
  });
  page.on('response', (response) => { if (response.url().endsWith('/remoteEntry.js')) record.remoteEntries.push({ url: response.url(), status: response.status() }); });
  page.on('pageerror', (error) => record.pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') record.consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => record.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  if (url) await page.goto(url, { waitUntil: 'networkidle' });
  return { page, record };
}
function clean(record) {
  assert.deepEqual(record.pageErrors, [], record.name);
  assert.deepEqual(record.consoleErrors, [], record.name);
  assert.deepEqual(record.failedRequests, [], record.name);
}
function target(registry, role) { return registry.artifacts[registry.runtimeBindings[registry.applications[role].id].b]; }
async function proof(page, registry, ids = ['A', 'C']) {
  for (const id of ids) {
    const b = target(registry, id === 'C' ? 'C' : 'A');
    await widget(page, id).getByTestId('version').waitFor();
    assert.equal(await text(widget(page, id).getByTestId('version')), b.version);
    assert.equal(await text(widget(page, id).getByTestId('platform-version')), registry.platformVersion);
    const d = registry.artifacts[registry.runtimeBindings[b.id].d];
    assert((await text(widget(page, id).getByTestId('dependency'))).startsWith(`D ${d.version}`));
  }
  await page.waitForFunction((count) => window.__MFE_PROOF__.getSnapshot().activeSubscriptions === count, ids.length);
  const actual = await page.evaluate(() => ({ identities: window.__MFE_PROOF__.identities(), snapshot: window.__MFE_PROOF__.getSnapshot(), diagnostics: window.__MFE_PROOF__.getRuntimeDiagnostics(),
    frozen: Object.isFrozen(window.__MFE_RUNTIME__.registry.runtimeBindings) && Object.values(window.__MFE_RUNTIME__.registry.runtimeBindings).every(Object.isFrozen) }));
  assert(actual.frozen);
  assert.equal(actual.diagnostics.compositionId, registry.compositionId);
  assert.deepEqual(actual.diagnostics.runtimeBindings, registry.runtimeBindings);
  assert.equal(actual.snapshot.activeSubscriptions, ids.length);
  assert.deepEqual(actual.identities.map((x) => x.instanceId).sort(), [...ids].sort());
  for (const identity of actual.identities) {
    const b = target(registry, identity.instanceId === 'C' ? 'C' : 'A');
    assert.equal(identity.artifactId, b.id);
    assert.equal(identity.dependencyArtifact, registry.runtimeBindings[b.id].d);
    assert(identity.reactMatches && identity.contextMatches, `${identity.instanceId}: shared React and SDK Context`);
    const container = actual.diagnostics.containers.find((c) => c.id === b.id);
    assert.equal(container.loadCount, 1);
    assert.equal(container.initCount, 1);
    const d = actual.diagnostics.containers.find((c) => c.id === registry.runtimeBindings[b.id].d);
    assert.equal(d.loadCount, 1);
    assert.equal(d.initCount, 1);
  }
  const sdk = actual.diagnostics.containers.filter((c) => c.id.startsWith('platform_'));
  assert.equal(sdk.length, 1);
  assert.equal(sdk[0].id, registry.selected.platform);
  assert.equal(sdk[0].initCount, 1);
  return actual;
}
async function panelStyle(page, id) {
  return widget(page, id).evaluate((element) => ({ classes: [...element.classList], color: getComputedStyle(element).backgroundColor }));
}

function selectedD(registry, role) { return registry.artifacts[registry.runtimeBindings[target(registry, role).id].d]; }
function assertConsumersUnchanged(registry, baseline) {
  assert.deepEqual(registry.selected, baseline.selected);
  for (const role of ['A', 'C']) {
    assert.deepEqual(registry.applications[role], baseline.applications[role]);
    assert.deepEqual(target(registry, role), target(baseline, role));
    assert.equal(registry.runtimeBindings[registry.applications[role].id].b, baseline.runtimeBindings[baseline.applications[role].id].b);
  }
}
async function assertExecutedD(session, registry, roles) {
  for (const role of roles) {
    const d = selectedD(registry, role);
    assert(session.record.remoteEntries.some((entry) => new URL(entry.url).pathname === d.entry && entry.status === 200), `${role}: D entry served over HTTP`);
    const executed = await session.page.evaluate(async (artifact) => {
      const container = await globalThis.__MFE_RUNTIME__.getArtifactContainer(artifact);
      const module = (await container.get('./data'))();
      return { id: module.artifactId, version: module.version, description: module.describe() };
    }, d);
    assert.equal(executed.id, d.id);
    assert.equal(executed.version, d.version);
    assert.equal(await text(widget(session.page, role).getByTestId('dependency')), executed.description);
  }
}

try {
  const before = await fingerprints();
  temporary = await mkdtemp(path.join(os.tmpdir(), 'mfe-nested-runtime-'));
  process.env.MFE_ARTIFACT_STORE = path.join(temporary, 'store');
  const { publish, activate, read, rollback } = createRequire(import.meta.url)('../tools/store.cjs');
  const releases = {};
  let baseline, firstChange, upgraded;
  await check('prepare existing builds with two levels of runtime bindings and no D pins in B', async () => {
    for (const name of projectNames) releases[name] = publish(path.join(projects, name));
    baseline = activate({ platform: releases['platform-sdk'].id, shell: releases.shell.id, A: releases['service-a'].id, C: releases['service-c'].id }, {
      [releases['service-a'].id]: { b: releases['service-b-v1'].id },
      [releases['service-c'].id]: { b: releases['service-b-v2'].id },
      [releases['service-b-v1'].id]: { d: releases['service-d-v1'].id },
      [releases['service-b-v2'].id]: { d: releases['service-d-v2'].id },
    });
    for (const name of ['service-b-v1', 'service-b-v2']) {
      assert.deepEqual(releases[name].dependencies, {});
      assert.equal(releases[name].runtimeDependencies.d.service, 'd');
    }
    report.baselineComposition = baseline;
    report.beforeFingerprints = before;
  });
  const baseURL = await startServer();
  const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (existsSync(localChrome) ? localChrome : undefined);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browserVersion = browser.version();
  const old = await trackedPage('existing-tab-before-D-change', `${baseURL}/?empty=1`);
  await check('an existing tab mounts only A with original B and D before any selection change', async () => {
    await old.page.getByTestId('add-a').click();
    old.record.proof = await proof(old.page, baseline, ['A']);
    await assertExecutedD(old, baseline, ['A']);
    await widget(old.page, 'A').getByTestId('increment').click();
    await widget(old.page, 'A').getByTestId('input').fill('old-A-cache');
    await widget(old.page, 'A').getByTestId('cache-write').click();
    assert(!old.record.requests.some((url) => new URL(url).pathname === selectedD(baseline, 'C').entry));
    clean(old.record);
  });
  const next = {}, copies = {};
  await check('install and build only isolated D 1.x and D 2.x copies with visible behavior changes', async () => {
    report.builds = [];
    for (const name of ['service-d-v1', 'service-d-v2']) {
      const source = path.join(projects, name);
      const destination = path.join(temporary, name, 'project');
      copies[name] = destination;
      await cp(source, destination, { recursive: true, filter: (file) => !path.relative(source, file).split(path.sep).some((part) => ['node_modules', 'dist', '.git'].includes(part)) });
      assert.deepEqual(await readdir(path.dirname(destination)), ['project']);
      await run('npm', ['ci', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', process.env.NPM_CACHE || '/private/tmp/mfe-npm-cache'], destination);
      const [major, minor] = releases[name].version.split('.').map(Number);
      const version = `${major}.${minor + 1}.0`;
      await run('npm', ['version', version, '--no-git-tag-version', '--ignore-scripts'], destination);
      const file = path.join(destination, 'src/index.js');
      const sourceCode = await readFile(file, 'utf8');
      assert(sourceCode.includes('return `D ${version}`'));
      await writeFile(file, sourceCode.replace('return `D ${version}`', 'return `D ${version} · 런타임 교체 확인`'));
      report.builds.push(await run('npm', ['run', 'build'], destination));
      next[name] = publish(destination);
      assert.notEqual(next[name].id, releases[name].id);
      assert.deepEqual(next[name].dependencies, {});
      assert.deepEqual(next[name].runtimeDependencies, {});
    }
    assert.deepEqual(await fingerprints(), before, 'B and all other original source/config/dist bytes remain unchanged');
    report.upgradedD = next;
    report.versionTransitions = Object.fromEntries(Object.keys(next).map((name) => [name, { from: releases[name].version, to: next[name].version }]));
  });
  await check('change only the A-path B-to-D binding through the public CLI without changing A/C/B/Shell/SDK', async () => {
    report.activationCommand = await run(process.execPath, ['tools/activate.cjs', '--bind', `${target(baseline, 'A').id}:d=${next['service-d-v1'].id}`]);
    firstChange = read('registry.json');
    assertConsumersUnchanged(firstChange, baseline);
    assert.equal(selectedD(firstChange, 'A').id, next['service-d-v1'].id);
    assert.equal(selectedD(firstChange, 'C').id, releases['service-d-v2'].id);
    report.firstChangeComposition = firstChange;
  });
  const first = await trackedPage('new-tab-one-D-updated', `${baseURL}/?order=ac`);
  await check('new tabs execute the new D result through unchanged B while the other D remains original', async () => {
    first.record.proof = await proof(first.page, firstChange);
    await assertExecutedD(first, firstChange, ['A', 'C']);
    assert.match(await text(widget(first.page, 'A').getByTestId('dependency')), /런타임 교체 확인/);
    assert.equal(await text(widget(first.page, 'C').getByTestId('dependency')), `D ${selectedD(baseline, 'C').version}`);
    assert(!first.record.requests.some((url) => new URL(url).pathname === releases['service-d-v1'].entry));
    clean(first.record);
  });
  let both;
  await check('change the C-path D independently and execute both new D containers in both loading orders', async () => {
    await run(process.execPath, ['tools/activate.cjs', '--bind', `${target(baseline, 'C').id}:d=${next['service-d-v2'].id}`]);
    upgraded = read('registry.json');
    assertConsumersUnchanged(upgraded, baseline);
    assert.equal(selectedD(upgraded, 'A').id, next['service-d-v1'].id);
    assert.equal(selectedD(upgraded, 'C').id, next['service-d-v2'].id);
    for (const order of ['ac', 'ca']) {
      const session = await trackedPage(`both-new-D-${order}`, `${baseURL}/?order=${order}`);
      session.record.proof = await proof(session.page, upgraded);
      await assertExecutedD(session, upgraded, ['A', 'C']);
      for (const role of ['A', 'C']) assert.match(await text(widget(session.page, role).getByTestId('dependency')), /런타임 교체 확인/);
      for (const name of ['service-d-v1', 'service-d-v2']) assert(!session.record.requests.some((url) => new URL(url).pathname === releases[name].entry));
      clean(session.record);
      if (order === 'ac') both = session;
    }
    report.upgradedComposition = upgraded;
  });
  await check('an older tab lazily mounts C after both changes but still loads its original D snapshot', async () => {
    await old.page.getByTestId('add-c').click();
    old.record.proof = await proof(old.page, baseline);
    await assertExecutedD(old, baseline, ['A', 'C']);
    assert.equal(await text(widget(old.page, 'A').getByTestId('count')), '1');
    await widget(old.page, 'A').getByTestId('cache-read').click();
    assert.equal(await text(widget(old.page, 'A').getByTestId('cache-value')), 'old-A-cache');
    assert.equal(old.record.bootRequests.length, 1);
    assert.deepEqual(await (await fetch(old.record.bootRequests[0])).json(), baseline);
    for (const release of Object.values(next)) assert(!old.record.requests.some((url) => new URL(url).pathname === release.entry));
    clean(old.record);
  });
  await check('D swaps preserve B state/cache/CSS/portal isolation and duplicate mount cleanup', async () => {
    const page = both.page;
    const aStyle = await panelStyle(page, 'A'), cStyle = await panelStyle(page, 'C');
    assert.deepEqual(aStyle, await panelStyle(old.page, 'A'));
    assert.deepEqual(cStyle, await panelStyle(old.page, 'C'));
    assert(aStyle.classes.every((name) => !cStyle.classes.includes(name)));
    assert.notEqual(aStyle.color, cStyle.color);
    await widget(page, 'A').getByTestId('increment').click();
    assert.equal(await text(widget(page, 'C').getByTestId('count')), '0');
    for (const id of ['A', 'C']) {
      await widget(page, id).getByTestId('input').fill(`${id}-new-D-cache`);
      await widget(page, id).getByTestId('cache-write').click();
    }
    await page.getByTestId('add-a-copy').click();
    await proof(page, upgraded, ['A', 'C', 'A-copy']);
    assert.equal(await text(widget(page, 'A-copy').getByTestId('count')), '0');
    assert.equal(await text(widget(page, 'A-copy').getByTestId('cache-value')), '');
    for (const id of ['A', 'C']) {
      await widget(page, id).getByTestId('cache-read').click();
      assert.equal(await text(widget(page, id).getByTestId('cache-value')), `${id}-new-D-cache`);
      await widget(page, id).getByTestId('open-popup').click();
      await page.getByTestId(`popup-${id}`).waitFor();
      assert.equal(await page.getByTestId(`popup-${id}`).evaluate((element) => element.closest('[data-portal-scope]').dataset.portalScope), id);
    }
    await page.getByTestId('emit-event').click();
    for (const id of ['A', 'C', 'A-copy']) assert.equal(await text(widget(page, id).getByTestId('event-count')), '1');
    await page.screenshot({ path: path.join(output, 'dependency-upgrade.png'), fullPage: true });
    await page.getByTestId('remove-a').click();
    assert.equal(await page.getByTestId('popup-A').count(), 0);
    assert.equal(await page.getByTestId('popup-C').count(), 1);
    await proof(page, upgraded, ['C', 'A-copy']);
    await page.getByTestId('emit-event').click();
    assert.equal(await text(widget(page, 'C').getByTestId('event-count')), '2');
    assert.equal(await text(widget(page, 'A-copy').getByTestId('event-count')), '2');
    assert.deepEqual(await panelStyle(page, 'C'), cStyle);
    clean(both.record);
  });
  await check('rollback restores nested D bindings for new tabs while all existing tabs keep their full graphs', async () => {
    assert.deepEqual(rollback(baseline.compositionId), baseline);
    const session = await trackedPage('new-tab-after-D-rollback', `${baseURL}/?order=ca`);
    session.record.proof = await proof(session.page, baseline);
    await assertExecutedD(session, baseline, ['A', 'C']);
    await proof(first.page, firstChange);
    await proof(both.page, upgraded, ['C', 'A-copy']);
    await proof(old.page, baseline);
    clean(session.record);
    assert.deepEqual(await (await fetch(`${baseURL}/compositions/${upgraded.compositionId}.json`)).json(), upgraded);
  });
  await check('missing, wrong-service, unsupported-major, SDK/React-incompatible and cyclic D graphs cannot be activated', async () => {
    const saved = read('registry.json');
    const owner = target(baseline, 'A').id;
    report.rejections = [];
    const reject = (label, action, pattern) => {
      let message;
      assert.throws(() => { try { action(); } catch (error) { message = error.message; throw error; } }, pattern);
      assert.deepEqual(read('registry.json'), saved);
      report.rejections.push({ label, message, executedInBrowser: false });
    };
    const missing = structuredClone(baseline.runtimeBindings); delete missing[owner];
    reject('missing nested binding', () => activate({}, missing, { replaceBindings: true }), /Missing runtime binding/);
    reject('unknown alias', () => activate({}, { [owner]: { absent: next['service-d-v1'].id } }), /Undeclared/);
    reject('unpublished D', () => activate({}, { [owner]: { d: 'd_unpublished' } }), /not published/);
    reject('wrong service', () => activate({}, { [owner]: { d: releases['service-b-v2'].id } }), /Wrong runtime service/);
    reject('D 2.x outside B 1.x supported range', () => activate({}, { [owner]: { d: next['service-d-v2'].id } }), /Incompatible runtime dependency/);
    for (const [label, changes, pattern] of [
      ['sdk', { runtimeRequirements: { platform: '>=9.0.0' } }, /Incompatible platform/],
      ['react', { runtimeRequirements: { react: '18.3.1' } }, /Incompatible react/],
      ['cycle', { runtimeDependencies: { back: { service: 'b', requires: '>=1.0.0 <2.0.0' } } }, /Dependency cycle/],
    ]) {
      const id = `d_runtime_metadata_${label}`;
      const probe = { ...next['service-d-v1'], ...changes, id, name: `mf_${id}`, entry: `/artifacts/${id}/remoteEntry.js` };
      const directory = path.join(temporary, id);
      await mkdir(path.join(directory, 'dist'), { recursive: true });
      await writeFile(path.join(directory, 'dist/release.json'), JSON.stringify(probe));
      await writeFile(path.join(directory, 'dist/remoteEntry.js'), '// Metadata-only rejection probe; never execute.');
      publish(directory);
      reject(`metadata ${label}`, () => activate({}, { [owner]: { d: id }, ...(label === 'cycle' ? { [id]: { back: owner } } : {}) }), pattern);
    }
  });
  await check('a missing selected D fails only its consuming path without falling back or preventing the other B/D from running', async () => {
    activate({}, upgraded.runtimeBindings);
    const session = await trackedPage('selected-D-request-failure');
    const failedURL = new URL(next['service-d-v1'].entry, baseURL).href;
    await session.page.route(failedURL, (route) => route.abort('failed'));
    await session.page.goto(`${baseURL}/?order=ac`, { waitUntil: 'networkidle' });
    await session.page.getByRole('alert').waitFor();
    assert.match(await session.page.getByRole('alert').innerText(), /A:/);
    await proof(session.page, upgraded, ['C']);
    await assertExecutedD(session, upgraded, ['C']);
    assert.equal(await widget(session.page, 'A').count(), 0);
    assert(session.record.requests.includes(failedURL));
    assert(!session.record.requests.some((url) => new URL(url).pathname === releases['service-d-v1'].entry));
    assert.deepEqual(session.record.pageErrors, []);
    assert.equal(session.record.failedRequests.length, 1);
    assert.equal(session.record.failedRequests[0].url, failedURL);
    for (const error of session.record.consoleErrors) assert(/Remote unavailable|Failed to load resource/.test(error)
      || (/Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(error) && error.includes(failedURL)), error);
    session.record.expectedFailure = true;
  });
  await check('all original project bytes remain unchanged with zero B/A/C/Shell/SDK builds; retain only tested D outputs', async () => {
    const after = await fingerprints();
    assert.deepEqual(after, before);
    report.afterFingerprints = after;
    report.consumerBuildsExecuted = 0;
    report.retainedReleases = {};
    for (const [name, directory] of Object.entries(copies)) {
      const destination = path.join(integration, 'artifacts/runtime-d-releases', next[name].id);
      await mkdir(destination, { recursive: true });
      await cp(path.join(directory, 'dist'), path.join(destination, 'dist'), { recursive: true });
      report.retainedReleases[name] = destination;
    }
  });
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = { message: error.message, stack: error.stack }; process.exitCode = 1; console.error(error);
  await currentPage?.screenshot({ path: path.join(output, 'dependency-upgrade-failure.png'), fullPage: true }).catch(() => {});
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
  await writeFile(path.join(output, 'dependency-upgrade.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Nested D runtime verification ${report.status}: ${report.passedChecks}/${report.checks.length}. Report: ${path.join(output, 'dependency-upgrade.json')}`);
}
