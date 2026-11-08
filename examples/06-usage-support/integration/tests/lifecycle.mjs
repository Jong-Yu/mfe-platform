import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const integration = fileURLToPath(new URL('../', import.meta.url));
const root = path.resolve(integration, '..');
const output = path.join(integration, 'artifacts/verification');
const originalStore = process.env.MFE_ARTIFACT_STORE;
const report = { status: 'running', checks: [], startedAt: new Date().toISOString(), consumerBuildsExecuted: 0, pageErrors: [], scope: 'Local usage graph and actual browser heartbeats, lifecycle UI/API, deterministic policy clock checks; no file deletion or production-wide absence proof.' };
let temporary, server, browser, page;
async function check(name, action) {
  try { await action(); report.checks.push({ name, status: 'passed' }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, status: 'failed', error: error.message }); throw error; }
}
async function fingerprint(directory) {
  const hash = createHash('sha256');
  async function walk(dir) {
    for (const item of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (['node_modules', '.git', 'usage.json', '.write-lock'].includes(item.name)) continue;
      const file = path.join(dir, item.name);
      if (item.isDirectory()) await walk(file);
      else hash.update(path.relative(directory, file)).update('\0').update(await readFile(file)).update('\0');
    }
  }
  await walk(directory); return hash.digest('hex');
}
async function startServer() {
  server = spawn(process.execPath, ['tools/serve.cjs'], { cwd: integration, env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let log = ''; const timer = setTimeout(() => reject(new Error(`Server did not start: ${log}`)), 10000);
    server.on('error', (error) => { clearTimeout(timer); reject(error); });
    server.stderr.on('data', (chunk) => { log += chunk; });
    server.stdout.on('data', (chunk) => { log += chunk; const match = log.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
  });
}
async function stopServer() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  await new Promise((resolve) => { server.once('exit', resolve); server.kill('SIGTERM'); });
}
async function eventually(action, timeout = 10000) {
  const end = Date.now() + timeout;
  while (true) { try { return await action(); } catch (error) { if (Date.now() >= end) throw error; await new Promise((resolve) => setTimeout(resolve, 100)); } }
}
await mkdir(output, { recursive: true });
try {
  const projectsBefore = await fingerprint(path.join(root, 'projects'));
  const sourceStore = originalStore || path.join(root, 'artifact-store');
  const liveBefore = await fingerprint(sourceStore);
  temporary = await mkdtemp(path.join(os.tmpdir(), 'mfe-lifecycle-proof-'));
  process.env.MFE_ARTIFACT_STORE = path.join(temporary, 'store');
  await cp(sourceStore, process.env.MFE_ARTIFACT_STORE, { recursive: true, filter: (file) => !['.write-lock', 'usage.json', 'lifecycle.json'].includes(path.basename(file)) });
  const require = createRequire(import.meta.url);
  const { current, read, publish, selectAdmin, activate } = require('../tools/store.cjs');
  const { usagePaths, lifecycleState, assessDeletion, recordUsage, POLICY } = require('../tools/lifecycle.cjs');
  selectAdmin(publish(path.join(root, 'projects/platform-admin')).id);
  const filesBefore = await fingerprint(path.join(process.env.MFE_ARTIFACT_STORE, 'artifacts'));
  const initial = current(); report.initialComposition = initial.compositionId;
  const bA = initial.runtimeBindings[initial.selected.A].b, bC = initial.runtimeBindings[initial.selected.C].b;
  const dA = initial.runtimeBindings[bA].d, dC = initial.runtimeBindings[bC].d;
  const alternateD = Object.values(read('catalog.json', {})).find((a) => a.service === 'd' && a.version.startsWith('1.') && a.id !== dA);
  assert(alternateD, 'Publish two compatible D releases before running this proof');
  let baseURL = await startServer();
  async function getState() { const response = await fetch(`${baseURL}/api/admin/lifecycle`); assert.equal(response.status, 200); return response.json(); }
  let token = (await (await fetch(`${baseURL}/api/admin/state`)).json()).csrfToken;
  async function post(body, headers = {}) {
    const response = await fetch(`${baseURL}/api/admin/lifecycle`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: baseURL, 'X-MFE-CSRF': token, ...headers }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (existsSync(chrome) ? chrome : undefined);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browserVersion = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  context.on('page', (p) => p.on('pageerror', (error) => report.pageErrors.push(error.message)));
  page = await context.newPage();
  const old = await context.newPage();
  let oldSession;

  await check('reverse usage includes SDK sharing and exact A/C -> B -> D paths, not every compatible range', async () => {
    const state = await getState();
    assert(state.releases.find((item) => item.artifact.id === dA).currentPaths.some((item) => JSON.stringify(item.path) === JSON.stringify([initial.selected.A, bA, dA])));
    assert(state.releases.find((item) => item.artifact.id === initial.selected.platform).currentPaths.some((item) => item.path.includes(bA)));
    assert(!state.releases.find((item) => item.artifact.id === alternateD.id).currentPaths.length);
    assert(!state.releases.find((item) => item.artifact.id === dA).pinnedConsumers.includes(bA), 'A runtime range is not a fixed pin');
    assert.equal(usagePaths(initial).filter((item) => item.artifactId === dC).length, 1);
  });
  await check('a real browser reports its immutable composition and protects not-yet-loaded C dependencies', async () => {
    await old.goto(`${baseURL}/?empty=1`, { waitUntil: 'networkidle' });
    await old.getByTestId('add-a').click(); await old.getByTestId('widget-A').getByTestId('dependency').waitFor();
    await eventually(async () => {
      const state = await getState();
      const a = state.releases.find((item) => item.artifact.id === dA), c = state.releases.find((item) => item.artifact.id === dC);
      assert.equal(a.loadedTabs, 1); assert.equal(c.recentTabs, 1); assert.equal(c.loadedTabs, 0);
      oldSession = c.sessions[0];
    });
  });
  await check('switching D leaves the older tab and rollback snapshot visible as blockers for the old version', async () => {
    activate({}, { [bA]: { d: alternateD.id } });
    const fresh = await context.newPage();
    await fresh.route('**/remoteEntry.js', async (route) => { await new Promise((resolve) => setTimeout(resolve, 150)); await route.continue(); });
    await fresh.goto(baseURL, { waitUntil: 'networkidle' });
    await fresh.getByTestId('widget-A').getByTestId('dependency').waitFor();
    assert.match(await fresh.getByTestId('widget-A').getByTestId('dependency').innerText(), new RegExp(`D ${alternateD.version.replaceAll('.', '\\.')}`));
    await old.getByTestId('add-c').click(); await old.getByTestId('widget-C').getByTestId('dependency').waitFor();
    const state = await getState(), previous = state.releases.find((item) => item.artifact.id === dA);
    assert.equal(previous.currentPaths.length, 0); assert.equal(previous.recentTabs, 1);
    assert(previous.history.includes(initial.compositionId));
    assert(previous.deletion.blockers.some((item) => item.code === 'OPEN_TABS'));
    assert(previous.deletion.blockers.some((item) => item.code === 'ROLLBACK'));
    report.oldVersionAfterSwitch = { id: dA, currentPaths: previous.currentPaths, recentTabs: previous.recentTabs, blockers: previous.deletion.blockers };
  });
  await check('an expired heartbeat becomes unknown and still prevents deletion instead of being counted unused', async () => {
    const state = lifecycleState(Date.now() + (POLICY.staleSeconds + 1) * 1000);
    const previous = state.releases.find((item) => item.artifact.id === dA);
    assert.equal(previous.recentTabs, 0); assert.equal(previous.unknownTabs, 1);
    assert(previous.deletion.blockers.some((item) => item.code === 'UNKNOWN_TABS'));
    assert.equal(previous.deletion.eligibleForReview, false);
  });
  await check('management UI shows the old version consumers, tab evidence and concrete deletion blockers', async () => {
    await page.goto(`${baseURL}/admin#lifecycle`, { waitUntil: 'networkidle' });
    await page.getByTestId(`release-${dA}`).click();
    const detail = page.getByTestId('release-detail');
    assert.match(await detail.innerText(), /A 1\.0\.0 → B/);
    assert.equal(await detail.getByTestId('deletion-state').innerText(), '삭제 보류');
    assert(await detail.locator('[data-blocker="OPEN_TABS"]').count());
    assert(await detail.locator('[data-blocker="ROLLBACK"]').count());
    await page.screenshot({ path: path.join(output, 'lifecycle-desktop.png'), fullPage: false });
  });
  const futureDate = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
  await check('saving a support end date and notice reference persists metadata without changing service selection', async () => {
    const before = current().compositionId;
    await page.getByLabel('지원 종료 예정일', { exact: false }).fill(futureDate);
    await page.getByLabel('공지 기록 공지 링크 또는 내부 기록 식별자').fill('검증용 공지 기록 #42');
    await page.getByRole('button', { name: '지원 정책 저장', exact: true }).click();
    await page.getByTestId('lifecycle-saved').waitFor();
    const item = (await getState()).releases.find((item) => item.artifact.id === dA);
    assert.equal(item.lifecycle.supportEndsOn, futureDate); assert.equal(item.supportStatus, 'scheduled');
    assert(item.lifecycle.noticeRecordedAt); assert.equal(item.lifecycle.revision, 1);
    assert.equal(current().compositionId, before);
    assert.equal(await fingerprint(path.join(root, 'projects')), projectsBefore);
  });
  await check('concurrent support-policy edits are rejected and cannot silently overwrite another manager', async () => {
    const update = await post({ artifactId: dA, expectedRevision: 1, supportEndsOn: futureDate, noticeReference: '다른 관리자의 공지 기록' }); assert.equal(update.status, 200);
    await page.getByLabel('공지 기록 공지 링크 또는 내부 기록 식별자').fill('오래된 화면의 변경');
    await page.getByRole('button', { name: '지원 정책 저장', exact: true }).click();
    await page.getByTestId('lifecycle-error').waitFor();
    assert.match(await page.getByTestId('lifecycle-error').innerText(), /다른 곳에서/);
    assert.equal(read('lifecycle.json').releases[dA].noticeReference, '다른 관리자의 공지 기록');
  });
  await check('invalid dates, unknown artifacts, cross-origin writes and missing tokens cannot alter policy', async () => {
    const before = JSON.stringify(read('lifecycle.json'));
    const body = { artifactId: dA, expectedRevision: 2, supportEndsOn: futureDate, noticeReference: '공지 기록' };
    assert.equal((await post({ ...body, supportEndsOn: '2026-02-30' })).status, 422);
    assert.equal((await post({ ...body, artifactId: 'constructor' })).status, 422);
    assert.equal((await post(body, { Origin: 'https://example.invalid' })).status, 403);
    assert.equal((await post(body, { 'X-MFE-CSRF': '' })).status, 403);
    assert.equal(JSON.stringify(read('lifecycle.json')), before);
    for (const route of ['/usage.json', '/lifecycle.json', '/%2Fusage.json', '/artifacts/..%2Fusage.json']) assert.equal((await fetch(baseURL + route)).status, 404);
  });
  await check('usage reports reject foreign artifacts, replayed reports cannot reopen a closed session, and BFCache stays reserved', async () => {
    const config = await (await fetch(`${baseURL}/api/runtime/config`)).json();
    async function usage(body) { return fetch(`${baseURL}/api/runtime/usage`, { method: 'POST', headers: { Origin: baseURL, 'Content-Type': 'application/json' }, body: JSON.stringify({ token: config.token, ...body }) }); }
    const sessionId = randomUUID(), body = { sessionId, compositionId: current().compositionId, sequence: 1, event: 'heartbeat', loadedArtifactIds: [] };
    assert.equal((await usage({ ...body, loadedArtifactIds: [dA] })).status, 422);
    assert.equal((await usage({ ...body, token: 'wrong' })).status, 403);
    assert.equal((await usage(body)).status, 200);
    assert.equal((await usage({ ...body, sequence: 3, event: 'close' })).status, 200);
    assert.equal((await usage({ ...body, sequence: 2 })).status, 200);
    assert(read('usage.json').sessions[sessionId].closedAt);
    const oldSequence = read('usage.json').sessions[oldSession.id].sequence;
    await old.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await eventually(async () => { const observed = read('usage.json').sessions[oldSession.id]; assert(observed.sequence > oldSequence); assert.equal(observed.closedAt, null); });
    // Simulate confirmed close delivery; absence of this delivery must stay unknown.
    const session = read('usage.json').sessions[oldSession.id];
    recordUsage({ sessionId: oldSession.id, compositionId: session.compositionId, sequence: session.sequence + 1, event: 'close', loadedArtifactIds: session.loadedArtifactIds });
    assert.equal(lifecycleState().releases.find((item) => item.artifact.id === dA).recentTabs, 0);
  });
  await check('retirement assessment enforces Korean date boundaries, notice, observation, retention and every reference type', async () => {
    const base = { lifecycle: { registrationState: 'unregistered', unregisteredAt: '2025-12-01T00:00:00.000Z', supportEndsOn: '2026-01-01', noticeRecordedAt: '2025-11-01T00:00:00.000Z' }, currentPaths: [], sessions: [], history: [], pinnedConsumers: [], observationStartedAt: '2025-11-01T00:00:00.000Z' };
    const now = Date.parse('2026-03-01T00:00:00.000Z');
    assert.equal(assessDeletion(base, now).eligibleForReview, true);
    assert.equal(assessDeletion(base, now).automaticDeletion, false);
    assert(assessDeletion(base, Date.parse('2026-01-01T14:59:59.999Z')).blockers.some((item) => item.code === 'SUPPORTED'));
    assert(!assessDeletion(base, Date.parse('2026-01-01T15:00:00Z')).blockers.some((item) => item.code === 'SUPPORTED'));
    for (const [key, value, code] of [['currentPaths', [{}], 'CURRENT'], ['history', ['saved'], 'ROLLBACK'], ['pinnedConsumers', ['consumer'], 'PINNED'], ['sessions', [{ status: 'unknown', lastSeenAt: '2025-12-01T00:00:00Z' }], 'UNKNOWN_TABS'], ['sessions', [{ status: 'recent', lastSeenAt: '2026-02-28T00:00:00Z' }], 'OPEN_TABS']]) assert(assessDeletion({ ...base, [key]: value }, now).blockers.some((item) => item.code === code));
    assert(assessDeletion({ ...base, lifecycle: {} }, now).blockers.some((item) => item.code === 'NO_NOTICE'));
    assert(assessDeletion({ ...base, sessions: [{ status: 'closed', lastSeenAt: '2026-02-28T00:00:00Z' }] }, now).blockers.some((item) => item.code === 'RETENTION'));
    assert(assessDeletion({ ...base, observationStartedAt: '2026-02-28T00:00:00Z' }, now).blockers.some((item) => item.code === 'OBSERVATION'));
  });
  await check('support metadata and usage evidence survive a server restart', async () => {
    const before = read('lifecycle.json'), startedAt = read('usage.json').startedAt;
    await old.close(); await page.close(); await context.close(); await stopServer();
    baseURL = await startServer(); token = (await (await fetch(`${baseURL}/api/admin/state`)).json()).csrfToken;
    assert.deepEqual(read('lifecycle.json'), before);
    const state = await getState(); assert.equal(state.observationStartedAt, startedAt);
    assert.equal(state.releases.find((item) => item.artifact.id === dA).lifecycle.revision, 2);
    page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (error) => report.pageErrors.push(error.message));
    await page.goto(`${baseURL}/admin#lifecycle`, { waitUntil: 'networkidle' });
  });
  await check('search and filters work on mobile with labeled controls and no page overflow', async () => {
    await page.getByLabel('서비스 필터', { exact: true }).selectOption('d');
    await page.getByLabel('배포물 검색', { exact: true }).fill(shortId(dA));
    assert.equal(await page.locator('.release-row').count(), 1);
    await page.getByTestId(`release-${dA}`).click();
    await page.getByTestId('release-detail').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.getByLabel('지원 종료 예정일', { exact: false }).inputValue(), futureDate);
    await page.screenshot({ path: path.join(output, 'lifecycle-mobile.png'), fullPage: true });
    assert.deepEqual(report.pageErrors, []);
  });
  await check('support ending preserves files but blocks reintroducing the release through rollback', async () => {
    const result = await post({ artifactId: dA, expectedRevision: 2, supportEndsOn: '2020-01-01', noticeReference: '지원 종료 기록' }); assert.equal(result.status, 200);
    const previous = current().compositionId;
    assert.throws(() => activate(initial.selected, initial.runtimeBindings, { replaceBindings: true }), /지원 종료/);
    assert.equal(current().compositionId, previous);
    const item = (await getState()).releases.find((item) => item.artifact.id === dA);
    assert.equal(item.supportStatus, 'ended'); assert.equal(item.deletion.eligibleForReview, false);
    assert.equal(await fingerprint(path.join(process.env.MFE_ARTIFACT_STORE, 'artifacts')), filesBefore);
  });
  await check('all original service builds, published bytes and the live composition remain unchanged', async () => {
    assert.equal(await fingerprint(path.join(root, 'projects')), projectsBefore);
    assert.equal(await fingerprint(sourceStore), liveBefore);
    report.projectsFingerprint = projectsBefore; report.artifactsFingerprint = filesBefore;
    report.liveStoreUnchanged = true;
  });
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = { message: error.message, stack: error.stack }; process.exitCode = 1; console.error(error);
  await page?.screenshot({ path: path.join(output, 'lifecycle-failure.png'), fullPage: true }).catch(() => {});
} finally {
  await browser?.close(); await stopServer();
  if (temporary) await rm(temporary, { recursive: true, force: true });
  if (originalStore === undefined) delete process.env.MFE_ARTIFACT_STORE; else process.env.MFE_ARTIFACT_STORE = originalStore;
  report.finishedAt = new Date().toISOString(); report.passedChecks = report.checks.filter((item) => item.status === 'passed').length;
  await writeFile(path.join(output, 'lifecycle.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Lifecycle verification ${report.status}: ${report.passedChecks}/${report.checks.length}`);
}
function shortId(id) { return id.split('_').at(-1).slice(0, 8); }
