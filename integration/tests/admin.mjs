import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const integration = fileURLToPath(new URL('../', import.meta.url));
const repository = path.resolve(integration, '..');
const output = path.join(integration, 'artifacts/verification');
const originalStore = process.env.MFE_ARTIFACT_STORE;
const report = { status: 'running', startedAt: new Date().toISOString(), checks: [], consumerBuildsExecuted: 0, pageErrors: [], evidenceScope: 'Real management UI and HTTP API against a temporary copy of the published repository. SDK/B/D selections, preflight, apply, stale edits, full rollback and independent admin availability. All project source and dist bytes remain unchanged.' };
let temporary, browser, server, page;
await mkdir(output, { recursive: true });
async function check(name, action) {
  try { await action(); report.checks.push({ name, status: 'passed' }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, status: 'failed', error: error.message }); throw error; }
}
async function fingerprint(directory) {
  const hash = createHash('sha256'); let files = 0;
  async function walk(dir) {
    for (const item of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (['node_modules', '.git', 'usage.json', '.write-lock'].includes(item.name)) continue;
      const file = path.join(dir, item.name);
      assert(!item.isSymbolicLink());
      if (item.isDirectory()) await walk(file);
      else { hash.update(path.relative(directory, file)).update('\0').update(await readFile(file)).update('\0'); files++; }
    }
  }
  await walk(directory); return { files, sha256: hash.digest('hex') };
}
async function projectFingerprints() {
  return Object.fromEntries(await Promise.all((await readdir(path.join(repository, 'projects'))).map(async (name) => [name, await fingerprint(path.join(repository, 'projects', name))])));
}
async function startServer() {
  server = spawn(process.execPath, ['tools/serve.cjs'], { cwd: integration, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let log = '';
    const timer = setTimeout(() => reject(new Error(`Server not ready: ${log}`)), 10000);
    server.on('error', (error) => { clearTimeout(timer); reject(error); });
    server.stderr.on('data', (chunk) => { log += chunk; });
    server.stdout.on('data', (chunk) => { log += chunk; const match = log.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
  });
}
function selectedPath(snapshot, role) {
  const app = snapshot.applications[role];
  const b = snapshot.artifacts[snapshot.runtimeBindings?.[app.id]?.b || app.dependencies.b];
  const d = snapshot.artifacts[snapshot.runtimeBindings?.[b.id]?.d || b.dependencies.d];
  return { b, d };
}
const widget = (page, role) => page.getByTestId(`widget-${role}`);
async function assertService(page, snapshot) {
  for (const role of ['A', 'C']) {
    await widget(page, role).getByTestId('dependency').waitFor();
    const expected = selectedPath(snapshot, role);
    assert.equal(await widget(page, role).getByTestId('version').innerText(), expected.b.version);
    assert((await widget(page, role).getByTestId('dependency').innerText()).startsWith(`D ${expected.d.version}`));
    assert.equal(await widget(page, role).getByTestId('platform-version').innerText(), snapshot.platformVersion);
  }
  const identity = await page.evaluate(() => window.__MFE_PROOF__.identities());
  assert(identity.every((item) => item.contextMatches && item.reactMatches));
}

try {
  const before = await projectFingerprints();
  temporary = await mkdtemp(path.join(os.tmpdir(), 'mfe-admin-proof-'));
  const sourceStore = originalStore || path.join(repository, 'artifact-store');
  await cp(sourceStore, path.join(temporary, 'store'), { recursive: true, filter: (file) => path.basename(file) !== '.write-lock' });
  process.env.MFE_ARTIFACT_STORE = path.join(temporary, 'store');
  const { current, read, publish, selectAdmin, activate } = createRequire(import.meta.url)('../tools/store.cjs');
  // Earlier upgrade proofs retain real built releases. Seed only this disposable
  // repository so a clean checkout does not need a manually populated history.
  report.seededReleases = [];
  for (const name of ['sdk-upgrade', 'business-upgrade', 'dependency-upgrade']) {
    const filename = path.join(output, `${name}.json`);
    if (!existsSync(filename)) continue;
    const proof = JSON.parse(await readFile(filename, 'utf8'));
    if (proof.status !== 'passed') continue;
    const releases = proof.retainedRelease ? [proof.retainedRelease] : Object.values(proof.retainedReleases || {});
    for (const directory of releases) {
      if (existsSync(path.join(directory, 'dist/release.json'))) report.seededReleases.push(publish(directory).id);
    }
  }
  const adminRelease = publish(path.join(repository, 'projects/platform-admin'));
  selectAdmin(adminRelease.id);
  const artifactsBefore = await fingerprint(path.join(temporary, 'store/artifacts'));
  const liveStoreBefore = await fingerprint(sourceStore);
  const initial = current();
  report.initialComposition = initial;
  const baseURL = await startServer();
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (existsSync(chrome) ? chrome : undefined);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browserVersion = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => report.pageErrors.push(error.message));
  const adminRequests = [];
  page.on('request', (request) => adminRequests.push(request.url()));
  const adminEntryPath = `/artifacts/${adminRelease.id}/remoteEntry.js`;
  function assertAdminRemoteIndependence() {
    const entries = adminRequests.map((url) => new URL(url)).filter((url) => url.pathname.endsWith('/remoteEntry.js'));
    if (adminRelease.format === 'esm') assert(entries.length > 0, 'Vite Admin initializes its own federation container');
    assert(entries.every((url) => url.origin === baseURL && url.pathname === adminEntryPath), 'Admin must load only its own bootstrap and no SDK/business containers');
  }
  const old = await context.newPage();
  old.on('pageerror', (error) => report.pageErrors.push(error.message));
  await old.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
  await assertService(old, initial);
  await widget(old, 'A').getByTestId('increment').click();
  await widget(old, 'A').getByTestId('input').fill('existing-tab-cache');
  await widget(old, 'A').getByTestId('cache-write').click();
  const state = await (await fetch(`${baseURL}/api/admin/state`)).json();
  async function post(endpoint, body, headers = {}) {
    const response = await fetch(`${baseURL}/api/admin/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: baseURL, 'X-MFE-CSRF': state.csrfToken, ...headers }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  const catalog = state.catalog;
  const aB = catalog.find((a) => a.service === 'b' && a.version.startsWith('1.') && a.runtimeDependencies?.d && a.id !== selectedPath(initial, 'A').b.id);
  const cB = catalog.find((a) => a.service === 'b' && a.version.startsWith('2.') && a.runtimeDependencies?.d && a.id !== selectedPath(initial, 'C').b.id);
  const aD = catalog.find((a) => a.service === 'd' && a.version.startsWith('1.') && a.version !== selectedPath(initial, 'A').d.version);
  const cD = catalog.find((a) => a.service === 'd' && a.version.startsWith('2.') && a.version !== selectedPath(initial, 'C').d.version);
  const sdk = catalog.find((a) => a.service === 'platform' && a.version !== initial.platformVersion && a.runtimeRequirements?.react === initial.artifacts.platform.runtimeRequirements.react);
  assert(aB && cB && aD && cD && sdk, 'Publish baseline and alternate SDK/B/D releases before running the management proof');

  await check('management UI displays the real SDK and A/C-to-B-to-D graph without loading service remotes', async () => {
    await page.goto(`${baseURL}/admin`, { waitUntil: 'networkidle' });
    await page.getByTestId('current-sdk').waitFor();
    assert.equal(await page.getByTestId('current-sdk').innerText(), initial.platformVersion);
    for (const role of ['A', 'C']) {
      assert.equal(await page.getByTestId(`current-b-${role}`).innerText(), selectedPath(initial, role).b.version);
      assert.equal(await page.getByTestId(`current-d-${role}`).innerText(), selectedPath(initial, role).d.version);
    }
    assertAdminRemoteIndependence();
    assert(await page.getByTestId('apply').isDisabled());
    await page.screenshot({ path: path.join(output, 'admin-overview.png'), fullPage: true });
  });
  await check('SDK/B/D choices require complete nested bindings and a fresh preview before apply', async () => {
    await page.getByTestId('select-sdk').selectOption(sdk.id);
    await page.getByTestId('select-b-A').selectOption(aB.id);
    assert.equal(await page.getByTestId('select-d-A').inputValue(), '');
    await page.getByTestId('preview').click();
    await page.getByTestId('admin-error').waitFor();
    assert.match(await page.getByTestId('admin-error').innerText(), /하위 버전/);
    assert.equal(current().compositionId, initial.compositionId);
    assert(await page.getByTestId('apply').isDisabled());
    await page.getByTestId('select-d-A').selectOption(aD.id);
    await page.getByTestId('select-b-C').selectOption(cB.id);
    await page.getByTestId('select-d-C').selectOption(cD.id);
    assert(await page.getByTestId('apply').isDisabled());
  });
  let applied;
  await check('preview validates the full draft but does not change the live pointer', async () => {
    await page.getByTestId('preview').click();
    await page.getByTestId('preview-valid').waitFor();
    assert.equal(current().compositionId, initial.compositionId);
    assert(!(await page.getByTestId('apply').isDisabled()));
    await page.locator('.editor-surface').screenshot({ path: path.join(output, 'admin-preview.png') });
  });
  await check('apply changes the actual composition atomically without any service build', async () => {
    await page.getByTestId('apply').click();
    await page.getByTestId('admin-notice').filter({ hasText: '조합을 적용했습니다' }).waitFor();
    applied = current();
    assert.equal(applied.selected.platform, sdk.id);
    assert.equal(applied.selected.A, initial.selected.A); assert.equal(applied.selected.C, initial.selected.C); assert.equal(applied.selected.shell, initial.selected.shell);
    for (const [role, b, d] of [['A', aB, aD], ['C', cB, cD]]) { assert.equal(selectedPath(applied, role).b.id, b.id); assert.equal(selectedPath(applied, role).d.id, d.id); }
    assert.deepEqual(await projectFingerprints(), before);
    report.appliedComposition = applied;
  });
  await check('new tabs execute the chosen versions while already opened tabs preserve state and their original graph', async () => {
    const fresh = await context.newPage(); fresh.on('pageerror', (error) => report.pageErrors.push(error.message));
    await fresh.goto(`${baseURL}/?order=ca`, { waitUntil: 'networkidle' }); await assertService(fresh, applied);
    await assertService(old, initial);
    assert.equal(await widget(old, 'A').getByTestId('count').innerText(), '1');
    await widget(old, 'A').getByTestId('cache-read').click(); assert.equal(await widget(old, 'A').getByTestId('cache-value').innerText(), 'existing-tab-cache');
  });
  await check('incompatible D selection is rejected in the UI and cannot be applied', async () => {
    await page.getByTestId('select-d-A').selectOption(cD.id);
    await page.getByTestId('preview').click(); await page.getByTestId('admin-error').waitFor();
    assert.match(await page.getByTestId('admin-error').innerText(), /지원 범위/);
    assert(await page.getByTestId('apply').isDisabled()); assert.equal(current().compositionId, applied.compositionId);
    await page.getByRole('button', { name: '선택 초기화', exact: true }).click();
  });
  await check('an intervening update from another manager rejects the stale UI apply without overwriting it', async () => {
    const nextD = selectedPath(initial, 'A').d;
    await page.getByTestId('select-d-A').selectOption(nextD.id);
    await page.getByTestId('preview').click(); await page.getByTestId('preview-valid').waitFor();
    const other = structuredClone(applied.runtimeBindings);
    other[cB.id].d = selectedPath(initial, 'C').d.id;
    const body = { expectedCompositionId: applied.compositionId, selected: applied.selected, runtimeBindings: other };
    const inspected = await post('preview', body); assert.equal(inspected.status, 200);
    const result = await post('apply', { ...body, previewedCompositionId: inspected.body.composition.compositionId }); assert.equal(result.status, 200);
    const newerId = current().compositionId;
    await page.getByTestId('apply').click(); await page.getByTestId('admin-error').waitFor();
    assert.match(await page.getByTestId('admin-error').innerText(), /다른 곳에서/);
    assert.equal(current().compositionId, newerId);
    assert(await page.getByTestId('apply').isDisabled());
    await page.getByRole('button', { name: /최신 조합 불러오기/ }).click();
    await page.waitForFunction((id) => document.querySelector('[data-testid="active-composition"]')?.textContent === id, newerId);
  });
  await check('history selection is a preview and explicit rollback restores the complete earlier composition', async () => {
    const more = page.getByRole('button', { name: /저장된 조합.*모두 보기/ }); if (await more.count()) await more.click();
    await page.getByTestId(`history-${initial.compositionId}`).getByRole('button', { name: '불러오기' }).click();
    await page.getByRole('heading', { name: '이전 조합 검토' }).waitFor();
    assert.notEqual(current().compositionId, initial.compositionId);
    assert(await page.getByTestId('apply').isDisabled());
    await page.getByTestId('preview').click(); await page.getByTestId('preview-valid').waitFor();
    assert.equal(await page.getByTestId('apply').innerText(), '이 조합으로 롤백');
    await page.getByTestId('apply').click(); await page.getByTestId('admin-notice').filter({ hasText: '조합을 적용했습니다' }).waitFor();
    assert.deepEqual(current(), initial);
    await old.reload({ waitUntil: 'networkidle' }); await assertService(old, initial);
  });
  await check('admin stays independent of service remotes and of a historical Shell rollback when one is available', async () => {
    const now = await (await fetch(`${baseURL}/api/admin/state`)).json();
    const historical = now.history.find((item) => item.valid && item.selected.shell !== initial.selected.shell);
    if (historical) {
      const body = { expectedCompositionId: initial.compositionId, rollbackTo: historical.id };
      const inspected = await post('preview', body); assert.equal(inspected.status, 200);
      const result = await post('apply', { ...body, previewedCompositionId: inspected.body.composition.compositionId }); assert.equal(result.status, 200);
      assert.equal(current().selected.shell, historical.selected.shell);
      report.historicalShellRollback = historical.id;
    } else report.historicalShellRollback = 'No historical Shell in this repository; remote independence still checked.';
    await page.route('**/remoteEntry.js', (route) => new URL(route.request().url()).pathname === adminEntryPath ? route.continue() : route.abort());
    await page.reload({ waitUntil: 'networkidle' }); await page.getByTestId('current-sdk').waitFor();
    assert.equal(await page.locator('h1').innerText(), '버전과 의존 관계');
    assert.equal(read('admin.json').artifactId, adminRelease.id);
    assertAdminRemoteIndependence();
    await page.unroute('**/remoteEntry.js');
    activate(initial.selected, initial.runtimeBindings, { replaceBindings: true });
    await page.reload({ waitUntil: 'networkidle' }); await page.getByTestId('current-sdk').waitFor();
  });
  await check('API rejects cross-origin writes, missing tokens, unreviewed apply and a tampered reviewed target', async () => {
    const bindings = structuredClone(initial.runtimeBindings);
    bindings[selectedPath(initial, 'A').b.id].d = aD.id;
    const body = { expectedCompositionId: initial.compositionId, selected: initial.selected, runtimeBindings: bindings };
    assert.equal((await post('preview', body, { Origin: 'https://example.invalid' })).status, 403);
    assert.equal((await post('preview', body, { 'X-MFE-CSRF': '' })).status, 403);
    assert.equal((await post('apply', body)).status, 422);
    assert.equal((await post('apply', { ...body, previewedCompositionId: initial.compositionId })).status, 422);
    assert.deepEqual(current(), initial);
    // Fetch normalizes Host; use a raw HTTP request to exercise Host validation.
    const status = await new Promise((resolve, reject) => {
      http.get(`${baseURL}/api/admin/state`, { headers: { Host: 'example.invalid' } }, (response) => { response.resume(); resolve(response.statusCode); }).on('error', reject);
    });
    assert.equal(status, 403);
  });
  await check('version controls, history and mobile layout remain usable without horizontal page overflow', async () => {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: path.join(output, 'admin-mobile.png'), fullPage: true });
    const selects = await page.locator('select').evaluateAll((elements) => elements.every((element) => document.querySelector(`label[for="${element.id}"]`)));
    assert(selects, 'Every version selector has an associated label');
    assert.deepEqual(report.pageErrors, []);
  });
  await check('original projects and published service bytes are unchanged after all management operations', async () => {
    assert.deepEqual(await projectFingerprints(), before);
    report.originalFingerprints = before;
    report.consumerBuildsExecuted = 0;
    const tested = await fingerprint(path.join(temporary, 'store/artifacts'));
    assert.deepEqual(tested, artifactsBefore);
    assert.deepEqual(await fingerprint(sourceStore), liveStoreBefore);
    report.publishedArtifactsFingerprint = artifactsBefore;
    report.liveStoreUnchanged = true;
  });
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = { message: error.message, stack: error.stack }; process.exitCode = 1; console.error(error);
  await page?.screenshot({ path: path.join(output, 'admin-failure.png'), fullPage: true }).catch(() => {});
} finally {
  await browser?.close();
  if (server && server.exitCode === null && server.signalCode === null) await new Promise((resolve) => {
    const timer = setTimeout(() => { server.kill('SIGKILL'); resolve(); }, 5000);
    server.once('exit', () => { clearTimeout(timer); resolve(); }); server.kill('SIGTERM');
  });
  if (temporary) await rm(temporary, { recursive: true, force: true });
  if (originalStore === undefined) delete process.env.MFE_ARTIFACT_STORE; else process.env.MFE_ARTIFACT_STORE = originalStore;
  report.finishedAt = new Date().toISOString(); report.passedChecks = report.checks.filter((item) => item.status === 'passed').length;
  await writeFile(path.join(output, 'admin.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Management verification ${report.status}: ${report.passedChecks}/${report.checks.length}. Report: ${path.join(output, 'admin.json')}`);
}
