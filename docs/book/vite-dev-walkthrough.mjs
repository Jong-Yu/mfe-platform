// Follow the current Vite guide against one copied service, without modifying the product.
// Run: node docs/book/vite-dev-walkthrough.mjs
// Uses a prepared npm cache by default. Set MFE_WALKTHROUGH_INSTALL_MODE=online
// to permit registry access, and NPM_CACHE / CHROME_EXECUTABLE_PATH as needed.
// First-install proof with a new empty cache and isolated npm settings:
// MFE_WALKTHROUGH_COLD=1 node docs/book/vite-dev-walkthrough.mjs
// MFE_WALKTHROUGH_ROOT selects the source checkout; B still runs in its own copy.
// MFE_WALKTHROUGH_OUTPUT redirects reports. The observing Playwright installation
// continues to come from this harness repository, not from the selected source.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const harnessRepository = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const root = path.resolve(process.env.MFE_WALKTHROUGH_ROOT || harnessRepository);
const original = path.join(root, 'projects/service-b-v1');
const coldInstall = process.env.MFE_WALKTHROUGH_COLD === '1';
const output = process.env.MFE_WALKTHROUGH_OUTPUT
  ? path.resolve(process.env.MFE_WALKTHROUGH_OUTPUT)
  : path.join(harnessRepository, coldInstall ? 'docs/verification/vite-cold-install/development' : 'docs/verification/vite-walkthrough/development');
const screenshots = path.join(output, 'screenshots');
const cache = coldInstall ? fs.mkdtempSync('/private/tmp/mfe-vite-dev-empty-cache-') : process.env.NPM_CACHE || '/private/tmp/mfe-npm-cache';
// This snapshot deliberately happens before any npm process is started.
const emptyCacheSnapshot = coldInstall ? { recordedAt: new Date().toISOString(), path: cache, entries: fs.readdirSync(cache) } : null;
const privateNpmSettings = coldInstall ? fs.mkdtempSync('/private/tmp/mfe-vite-dev-npm-settings-') : null;
const installMode = coldInstall ? 'online' : process.env.MFE_WALKTHROUGH_INSTALL_MODE || 'offline';
assert(['offline', 'online'].includes(installMode), 'Install mode must be offline or online');
const commandEnv = { ...process.env };
if (coldInstall) {
  assert.deepEqual(emptyCacheSnapshot.entries, []);
  // Do not inherit cached/offline/registry/auth settings from the caller. HOME
  // stays untouched; only these child processes receive the private npm config.
  for (const key of Object.keys(commandEnv)) {
    if (/^npm_/i.test(key) || /^corepack_npm_/i.test(key) || ['NODE_ENV', 'NODE_OPTIONS', 'NODE_PATH', 'MFE_OFFLINE', 'MFE_NPM_CACHE'].includes(key)) delete commandEnv[key];
  }
  const userconfig = path.join(privateNpmSettings, 'user.npmrc');
  const globalconfig = path.join(privateNpmSettings, 'global.npmrc');
  fs.writeFileSync(userconfig, '', { mode: 0o600 });
  fs.writeFileSync(globalconfig, '', { mode: 0o600 });
  Object.assign(commandEnv, {
    npm_config_userconfig: userconfig,
    npm_config_globalconfig: globalconfig,
    npm_config_cache: cache,
    npm_config_registry: 'https://registry.npmjs.org/',
    npm_config_offline: 'false',
    npm_config_prefer_online: 'true',
    npm_config_loglevel: 'http',
  });
}
const require = createRequire(path.join(harnessRepository, 'integration/package.json'));
const { chromium } = require('playwright');
const playwrightModulePath = require.resolve('playwright');
const executablePath = process.env.CHROME_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
fs.mkdirSync(screenshots, { recursive: true });
const transcript = path.join(output, 'walkthrough.log');
fs.writeFileSync(transcript, '');
const report = {
  status: 'running', startedAt: new Date().toISOString(),
  scope: 'Current Vite guide V5: isolated B source copy, actual npm installation, service development server and fresh Chrome UI. Product sources, dist, dev kits and active composition are not changed.',
  sourceRepository: root, harnessRepository,
  sourceSelection: {
    rootOverride: Boolean(process.env.MFE_WALKTHROUGH_ROOT), sourceService: original,
    execution: 'Copy only B from the selected source checkout into a new temporary directory, excluding node_modules, dist and .mfe-dev; install and run the service only in that copy.',
  },
  outputDirectory: output, outputOverride: Boolean(process.env.MFE_WALKTHROUGH_OUTPUT),
  observer: { playwrightModulePath, installationSource: path.join(harnessRepository, 'integration'), serviceDependency: false },
  limitations: [
    coldInstall ? 'This run starts with a newly created empty npm cache and downloads from the public npm registry. The bundled build-tool tarball and published SDK/D dev kit are intentionally supplied with the service project.' : 'This run uses a prepared npm cache unless online mode is explicitly selected; it does not prove a first-ever network installation.',
    'The observing Playwright comes from the harness repository integration installation, which is separate from the selected source checkout when ROOT is overridden; the copied service has no sibling source or server dependency.',
    'This script checks development only. Build/publication/activation/rollback are covered by the separate release walkthrough.',
  ],
  environment: { node: process.version, platform: process.platform, coldInstall, installMode, cache, browserExecutable: executablePath },
  ...(coldInstall ? { coldInstall: {
    emptyCacheBeforeAnyNpm: emptyCacheSnapshot,
    registry: 'https://registry.npmjs.org/',
    settings: { userconfig: commandEnv.npm_config_userconfig, globalconfig: commandEnv.npm_config_globalconfig, bothEmpty: true, inheritedNpmSettingsRemoved: true, homeChanged: false },
    warmReportPath: path.join(root, 'docs/verification/vite-walkthrough/development/report.json'),
  } } : {}),
  checks: [], commands: [], screenshots: [], requests: [], responses: [], failedRequests: [], browserErrors: [], externalRequests: [], findings: [],
};
let temporary, project, browser, context, page, server;
let navigations = 0;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function metadataFingerprint(directory) {
  if (!fs.existsSync(directory)) return { exists: false };
  const hash = createHash('sha256');
  let files = 0, bytes = 0;
  const visit = (relative = '') => {
    for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const filename = path.join(relative, entry.name);
      const stat = fs.lstatSync(path.join(directory, filename), { bigint: true });
      hash.update(filename).update('\0').update(String(stat.size)).update('\0').update(String(stat.mtimeNs)).update('\0').update(String(stat.ctimeNs)).update('\0');
      if (entry.isDirectory()) visit(filename);
      else { files += 1; bytes += Number(stat.size); }
    }
  };
  visit();
  return { exists: true, metadataSHA256: hash.digest('hex'), files, bytes };
}
function npmFetchEvidence() {
  const filename = path.join(output, 'npm-install.log');
  if (!fs.existsSync(filename)) return { fetches: [], cacheMissDownloads: [], log: 'npm-install.log' };
  const lines = fs.readFileSync(filename, 'utf8').split('\n');
  const fetches = lines.filter(line => /npm http (fetch|cache)/.test(line));
  const cacheMissDownloads = fetches.filter(line => /\(cache miss\)/.test(line) && /\.tgz(?:\s|$)/.test(line));
  return { fetches, cacheMissDownloads, cacheMissDownloadCount: cacheMissDownloads.length, log: 'npm-install.log' };
}
function log(message) {
  const line = `${new Date().toISOString()} ${message}\n`;
  fs.appendFileSync(transcript, line);
  process.stdout.write(line);
}
function fingerprint(directory) {
  const hash = createHash('sha256');
  const files = [];
  const visit = (relative = '') => {
    for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      if (['node_modules', '.mfe-dev'].includes(entry.name)) continue;
      assert(!entry.isSymbolicLink(), `Unexpected project symlink: ${entry.name}`);
      const filename = path.join(relative, entry.name);
      if (entry.isDirectory()) visit(filename);
      else if (entry.isFile()) {
        const bytes = fs.readFileSync(path.join(directory, filename));
        hash.update(filename).update('\0').update(bytes).update('\0');
        files.push({ path: filename, sha256: sha(bytes) });
      }
    }
  };
  visit();
  return { sha256: hash.digest('hex'), count: files.length, files };
}
function currentPointer() {
  const filename = path.join(root, 'artifact-store/current.json');
  return fs.existsSync(filename) ? fs.readFileSync(filename, 'utf8') : null;
}
async function check(name, action) {
  const started = Date.now();
  try {
    const evidence = await action();
    report.checks.push({ name, status: 'passed', durationMs: Date.now() - started, evidence });
    log(`PASS ${name}`);
  } catch (error) {
    report.checks.push({ name, status: 'failed', durationMs: Date.now() - started, error: error.stack });
    throw error;
  }
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
async function run(command, args, cwd, filename, timeoutMs = 180000) {
  const record = { command, args, cwd, startedAt: new Date().toISOString(), log: filename };
  report.commands.push(record);
  const stream = fs.createWriteStream(path.join(output, filename));
  log(`RUN ${command} ${args.join(' ')} (cwd ${cwd})`);
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: commandEnv, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error(`Command timed out; see ${filename}`)); }, timeoutMs);
    const capture = bytes => stream.write(bytes);
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => {
      clearTimeout(timer); record.exitCode = code; record.finishedAt = new Date().toISOString();
      record.elapsedMs = Date.parse(record.finishedAt) - Date.parse(record.startedAt);
      stream.end(() => code === 0 ? resolve() : reject(new Error(`Command exited ${code}; see ${filename}`)));
    });
  });
}
async function selectPort() {
  // A documented PORT override is used only if the default B port is occupied.
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', error => {
      if (error.code === 'EADDRINUSE') resolve({ requested: '0', reason: 'Port 4203 was already occupied; used the documented PORT override with an OS-assigned free port.' });
      else reject(error);
    });
    probe.listen(4203, '127.0.0.1', () => probe.close(() => resolve({ requested: null, reason: 'Default B development port 4203 was available.' })));
  });
}
async function startServer() {
  const port = await selectPort();
  report.port = port;
  const env = { ...commandEnv };
  delete env.PORT;
  if (port.requested !== null) env.PORT = port.requested;
  const record = { command: 'npm', args: ['run', 'dev'], cwd: project, env: port.requested === null ? {} : { PORT: port.requested }, startedAt: new Date().toISOString(), log: 'dev-server.log' };
  report.commands.push(record);
  fs.writeFileSync(path.join(output, record.log), '');
  server = spawn('npm', ['run', 'dev'], { cwd: project, env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  let captured = '';
  const capture = bytes => { captured += bytes; fs.appendFileSync(path.join(output, record.log), bytes); };
  server.stdout.on('data', capture); server.stderr.on('data', capture);
  server.once('exit', (code, signal) => { record.exitCode = code; record.signal = signal; record.finishedAt = new Date().toISOString(); });
  log(`RUN ${port.requested === null ? '' : `PORT=${port.requested} `}npm run dev (cwd ${project})`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Development server start timed out; see dev-server.log')), 60000);
    const ready = () => {
      const match = captured.match(/Service Dev Host: (http:\/\/127\.0\.0\.1:\d+)\//);
      if (match) { clearTimeout(timer); server.stdout.off('data', ready); resolve(match[1]); }
    };
    server.stdout.on('data', ready);
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Development server exited ${code}; see dev-server.log`)); });
  });
}
async function stopServer() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  await new Promise(resolve => {
    const timer = setTimeout(() => { try { process.kill(-server.pid, 'SIGKILL'); } catch {} resolve(); }, 6000);
    server.once('exit', () => { clearTimeout(timer); resolve(); });
    try { process.kill(-server.pid, 'SIGTERM'); }
    catch (error) { clearTimeout(timer); if (error.code === 'ESRCH') resolve(); else throw error; }
  });
}
async function screenshot(filename) {
  await page.screenshot({ path: path.join(screenshots, filename), fullPage: true });
  report.screenshots.push(`screenshots/${filename}`);
}
async function uiState() {
  const widget = page.getByTestId('widget-dev-1');
  return {
    heading: await widget.getByRole('heading').innerText(),
    count: await widget.getByTestId('count').innerText(),
    input: await widget.getByTestId('input').inputValue(),
    cache: await widget.getByTestId('cache-value').innerText(),
    localId: await page.evaluate(() => globalThis.__MFE_DEV__.registry.local.id),
    navigations,
  };
}

report.originalBefore = fingerprint(original);
report.productPointerBefore = currentPointer();
const preparedCache = '/private/tmp/mfe-npm-cache';
const warmReport = path.join(root, 'docs/verification/vite-walkthrough/development/report.json');
if (coldInstall) {
  report.coldInstall.preparedCacheBefore = metadataFingerprint(preparedCache);
  report.coldInstall.warmReportBeforeSHA256 = fs.existsSync(warmReport) ? sha(fs.readFileSync(warmReport)) : null;
}
try {
  await check('copy one B service with its published dev kit and no sibling sources', async () => {
    temporary = fs.mkdtempSync('/private/tmp/mfe-vite-dev-');
    project = path.join(temporary, 'service-b-v1');
    fs.cpSync(original, project, { recursive: true, filter: filename => !['node_modules', 'dist', '.mfe-dev'].includes(path.basename(filename)) });
    report.temporaryProject = project;
    assert.deepEqual(fs.readdirSync(temporary), ['service-b-v1']);
    assert(!fs.existsSync(path.join(project, 'node_modules')));
    assert(!fs.existsSync(path.join(project, 'dist')));
    if (coldInstall) {
      assert(!fs.existsSync(path.join(project, '.npmrc')), 'The cold-install copy must not contain project-specific npm configuration');
      const lock = JSON.parse(fs.readFileSync(path.join(project, 'package-lock.json'), 'utf8'));
      const remoteSources = [...new Set(Object.values(lock.packages || {}).map(item => item.resolved).filter(value => /^https?:/.test(value)))];
      assert(remoteSources.every(value => new URL(value).origin === 'https://registry.npmjs.org'));
      report.coldInstall.lockfileRemoteHosts = [...new Set(remoteSources.map(value => new URL(value).hostname))];
      report.coldInstall.projectConfigAbsent = true;
      report.coldInstall.lockfileSHA256 = sha(fs.readFileSync(path.join(project, 'package-lock.json')));
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(project, 'dev/manifest.json'), 'utf8'));
    assert.equal(manifest.artifacts[manifest.platform].format, 'esm');
    return { isolatedParentEntries: fs.readdirSync(temporary), kitPlatform: manifest.platform, copiedFingerprint: fingerprint(project).sha256 };
  });
  await check('npm ci installs the isolated Vite project from the declared cache mode', async () => {
    const args = ['ci', '--cache', cache, '--no-audit', '--no-fund'];
    if (installMode === 'offline') args.push('--offline');
    if (coldInstall) args.push('--registry=https://registry.npmjs.org/', '--offline=false', '--prefer-online', '--loglevel=http');
    if (coldInstall) {
      report.coldInstall.immediatelyBeforeFirstNpm = { recordedAt: new Date().toISOString(), entries: fs.readdirSync(cache) };
      assert.deepEqual(report.coldInstall.immediatelyBeforeFirstNpm.entries, []);
      fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    }
    try { await run('npm', args, project, 'npm-install.log'); }
    finally {
      if (coldInstall) {
        report.coldInstall.downloadEvidence = npmFetchEvidence();
        report.coldInstall.cacheAfterInstall = metadataFingerprint(cache);
      }
    }
    const packageInfo = JSON.parse(fs.readFileSync(path.join(project, 'node_modules/@mfe/platform-build-tools/package.json')));
    assert.equal(packageInfo.version, '2.0.0');
    const installedVersions = Object.fromEntries(['@mfe/platform-build-tools', '@module-federation/vite', 'vite', 'react', 'react-dom', 'rolldown'].map(name => [name, JSON.parse(fs.readFileSync(path.join(project, 'node_modules', name, 'package.json'))).version]));
    if (coldInstall) {
      assert(report.coldInstall.downloadEvidence.cacheMissDownloadCount > 0, 'No actual npm package download with cache miss was recorded');
      report.coldInstall.installedVersions = installedVersions;
    }
    return { buildTools: packageInfo.version, npmCache: cache, networkMode: installMode, installedVersions, ...(coldInstall ? { cacheMissDownloads: report.coldInstall.downloadEvidence.cacheMissDownloadCount } : {}) };
  });
  const baseURL = await startServer();
  report.baseURL = baseURL;
  browser = await chromium.launch({ headless: true, executablePath });
  report.environment.browserVersion = browser.version();
  context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations += 1; });
  page.on('pageerror', error => report.browserErrors.push(error.message));
  page.on('request', request => report.requests.push({ at: new Date().toISOString(), url: request.url(), type: request.resourceType(), method: request.method() }));
  page.on('response', response => report.responses.push({ at: new Date().toISOString(), url: response.url(), status: response.status() }));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), failure: request.failure(), type: request.resourceType() }));
  await page.route('**/*', route => {
    const url = route.request().url();
    if (!url.startsWith(baseURL + '/') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      report.externalRequests.push(url); return route.abort();
    }
    return route.continue();
  });
  await check('the standalone development page loads SDK 1.3.1, B 1.4.0 and D 1.0.0 through actual MF requests', async () => {
    await page.goto(baseURL + '/');
    const widget = page.getByTestId('widget-dev-1');
    await widget.waitFor();
    assert.equal(await page.locator('[data-dev-layout]').count(), 1);
    assert.equal(await page.locator('[data-page-container]').count(), 1);
    assert.equal(await page.getByRole('heading', { name: '차량 선택 B 1.x', exact: true }).count(), 1);
    assert.equal(await widget.getByTestId('platform-user').innerText(), '서비스 개발자');
    assert.equal(await widget.getByTestId('platform-version').innerText(), '1.3.1');
    assert.equal(await widget.getByTestId('version').innerText(), '1.4.0');
    assert.equal(await widget.getByTestId('dependency').innerText(), 'D 1.0.0');
    const proof = await page.evaluate(async () => {
      const dev = globalThis.__MFE_DEV__, runtime = globalThis.__MFE_RUNTIME__;
      const sdkContainer = await runtime.getContainer('platform');
      await sdkContainer.init(await runtime.initializeSharing());
      const sdk = (await sdkContainer.get('./sdk'))();
      const identity = dev.getIdentity();
      return {
        local: dev.registry.local, platform: dev.registry.artifacts.platform,
        d: dev.registry.runtimeBindings[dev.registry.local.id].d,
        sdkReactMatchesHost: dev.sdkReactMatches,
        serviceReactMatchesSDK: identity.react === sdk.ReactIdentity,
        serviceContextMatchesSDK: identity.context === sdk.PlatformContext,
        identity: { version: identity.version, artifactId: identity.artifactId, dependencyVersion: identity.dependencyVersion, dependencyArtifact: identity.dependencyArtifact },
        diagnostics: dev.getDiagnostics(),
      };
    });
    assert(proof.sdkReactMatchesHost && proof.serviceReactMatchesSDK && proof.serviceContextMatchesSDK);
    for (const id of [proof.local.id, proof.platform.id, proof.d]) {
      assert(report.requests.some(request => request.url === `${baseURL}/artifacts/${id}/remoteEntry.js`), `Missing actual MF entry request: ${id}`);
      assert(proof.diagnostics.loadedContainerIds.includes(id));
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(project, 'dev/manifest.json'), 'utf8'));
    const sdkResponse = await context.request.get(baseURL + proof.platform.entry);
    assert.equal(sha(await sdkResponse.body()), manifest.files[manifest.platform]['remoteEntry.js']);
    assert(!fs.existsSync(path.join(project, 'dist')));
    await screenshot('01-initial-sdk-service-dependency.png');
    report.initialProof = proof;
    return proof;
  });
  const originalSource = fs.readFileSync(path.join(project, 'src/Widget.jsx'), 'utf8');
  const sourceFile = path.join(project, 'src/Widget.jsx');
  const kitBefore = fingerprint(path.join(project, 'dev')).sha256;
  await check('counter, input and cache can be used on the rendered service', async () => {
    const widget = page.getByTestId('widget-dev-1');
    await widget.getByTestId('increment').click();
    await widget.getByTestId('increment').click();
    await widget.getByTestId('input').fill('저장 전 상태 확인');
    await widget.getByTestId('cache-write').click();
    await widget.getByTestId('input').fill('화면 입력은 별도');
    await widget.getByTestId('cache-read').click();
    const state = await uiState();
    assert.equal(state.count, '2');
    assert.equal(state.input, '화면 입력은 별도');
    assert.equal(state.cache, '저장 전 상태 확인');
    report.beforeSourceEdit = state;
    await screenshot('02-counter-input-cache.png');
    return state;
  });
  const editedSource = originalSource.replace('<h2>Car Picker</h2>', '<h2>Car Picker · Vite 실습</h2>');
  assert.notEqual(editedSource, originalSource);
  await check('saving the copied source rebuilds B and performs a full reload that resets state', async () => {
    fs.writeFileSync(sourceFile, editedSource);
    await page.getByRole('heading', { name: 'Car Picker · Vite 실습', exact: true }).waitFor();
    const state = await uiState();
    assert.notEqual(state.localId, report.beforeSourceEdit.localId);
    assert(state.navigations > report.beforeSourceEdit.navigations);
    assert.equal(state.count, '0'); assert.equal(state.input, ''); assert.equal(state.cache, '');
    assert.equal(fingerprint(path.join(project, 'dev')).sha256, kitBefore);
    assert(!fs.existsSync(path.join(project, 'dist')));
    await screenshot('03-saved-source-full-reload.png');
    report.afterSourceEdit = state;
    return { ...state, kitUnchanged: true, productDistCreated: false };
  });
  let beforeError;
  await check('a syntax error keeps the previous successful screen, counter, input and cache', async () => {
    const widget = page.getByTestId('widget-dev-1');
    await widget.getByTestId('increment').click();
    await widget.getByTestId('input').fill('오류 중에도 유지할 메모');
    await widget.getByTestId('cache-write').click();
    beforeError = await uiState();
    fs.writeFileSync(sourceFile, editedSource + '\nexport !!! invalid syntax\n');
    await page.locator('#build-status').waitFor({ state: 'visible' });
    assert.match(await page.locator('#build-status').innerText(), /빌드 오류/);
    const state = await uiState();
    assert.deepEqual(state, beforeError);
    await screenshot('04-syntax-error-preserves-screen.png');
    report.expectedBuildError = await page.locator('#build-status').innerText();
    return { ...state, overlay: report.expectedBuildError };
  });
  await check('removing only the invalid line restores the successful source and clears the overlay without discarding state', async () => {
    fs.writeFileSync(sourceFile, editedSource);
    await page.locator('#build-status').waitFor({ state: 'hidden' });
    await page.getByRole('heading', { name: 'Car Picker · Vite 실습', exact: true }).waitFor();
    const state = await uiState();
    assert.deepEqual(state, beforeError);
    assert.equal(fingerprint(path.join(project, 'dev')).sha256, kitBefore);
    await screenshot('05-repaired-source.png');
    report.findings.push({
      type: 'documentation-detail',
      observation: 'Removing only the deliberately invalid line restores exactly the previous successful source, so the development build ID is unchanged; the error overlay clears without a reload and the previous input/counter/cache remain. A real successful source change creates a new ID and reloads, as checked earlier.',
      evidence: { beforeError, afterRepair: state },
      suggestedGuideText: '잘못 넣은 줄만 삭제해 직전 성공 소스로 돌아오면 오류 안내만 사라지고 입력이 유지됩니다. 다른 유효한 코드까지 바꿔 새 빌드가 생기면 전체 새로고침으로 입력이 초기화됩니다.',
    });
    return state;
  });
  await check('restore the original Car Picker source and confirm the original development build before stopping', async () => {
    const beforeRestore = await uiState();
    fs.writeFileSync(sourceFile, originalSource);
    await page.getByRole('heading', { name: 'Car Picker', exact: true }).waitFor();
    const state = await uiState();
    assert.equal(fs.readFileSync(sourceFile, 'utf8'), originalSource);
    assert.equal(state.localId, report.initialProof.local.id);
    assert(state.navigations > beforeRestore.navigations);
    assert.equal(state.count, '0'); assert.equal(state.input, ''); assert.equal(state.cache, '');
    await screenshot('06-original-source-restored.png');
    report.restoredSourceSHA256 = sha(fs.readFileSync(sourceFile));
    return { ...state, sourceMatchesOriginal: true, sourceSHA256: report.restoredSourceSHA256 };
  });
  await check('the walkthrough needs no other service server and reports no browser runtime exception', async () => {
    assert.deepEqual(report.externalRequests, []);
    assert.deepEqual(report.browserErrors, []);
    assert.deepEqual(report.responses.filter(response => response.status >= 400), []);
    return { pageRequests: report.requests.length, httpOrigins: [...new Set(report.requests.filter(request => /^https?:/.test(request.url)).map(request => new URL(request.url).origin))], expectedFailure: 'One deliberately invalid copied JSX build; UI remained available.' };
  });
  await context.close(); context = undefined;
  await browser.close(); browser = undefined;
  await stopServer();
  await check('the development server stops and the original service and product pointer are unchanged', async () => {
    assert(server.exitCode !== null || server.signalCode !== null, 'Development process still running');
    report.originalAfter = fingerprint(original);
    report.productPointerAfter = currentPointer();
    assert.equal(report.originalAfter.sha256, report.originalBefore.sha256);
    assert.equal(report.productPointerAfter, report.productPointerBefore);
    return { originalSHA256: report.originalAfter.sha256, originalFiles: report.originalAfter.count, serverExitCode: server.exitCode, serverSignal: server.signalCode, productPointerUnchanged: true };
  });
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = error.stack; process.exitCode = 1;
  log(`FAIL ${error.stack}`);
  if (page && !page.isClosed()) { try { await screenshot('failure.png'); } catch {} }
} finally {
  await context?.close();
  await browser?.close();
  await stopServer();
  report.originalAfter ||= fingerprint(original);
  report.productPointerAfter = currentPointer();
  report.originalUnchanged = report.originalBefore.sha256 === report.originalAfter.sha256;
  report.productPointerUnchanged = report.productPointerBefore === report.productPointerAfter;
  if (temporary && (!coldInstall || report.status === 'passed')) { fs.rmSync(temporary, { recursive: true, force: true }); report.temporaryProjectRemoved = true; }
  if (coldInstall) {
    report.coldInstall.preparedCacheAfter = metadataFingerprint(preparedCache);
    report.coldInstall.preparedCacheUnchanged = JSON.stringify(report.coldInstall.preparedCacheBefore) === JSON.stringify(report.coldInstall.preparedCacheAfter);
    report.coldInstall.warmReportAfterSHA256 = fs.existsSync(warmReport) ? sha(fs.readFileSync(warmReport)) : null;
    report.coldInstall.warmReportUnchanged = report.coldInstall.warmReportBeforeSHA256 === report.coldInstall.warmReportAfterSHA256;
    report.coldInstall.createdCacheRetained = true;
    report.coldInstall.privateSettingsRetained = true;
    if (!report.coldInstall.preparedCacheUnchanged || !report.coldInstall.warmReportUnchanged) {
      report.status = 'failed'; process.exitCode = 1;
      report.error = `${report.error || ''}\nThe prepared cache or previous warm report changed during the cold run.`;
    }
  }
  report.finishedAt = new Date().toISOString();
  report.elapsedMs = Date.parse(report.finishedAt) - Date.parse(report.startedAt);
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  log(`RESULT ${report.status}: ${report.checks.filter(check => check.status === 'passed').length}/${report.checks.length} checks; original unchanged=${report.originalUnchanged}`);
}
