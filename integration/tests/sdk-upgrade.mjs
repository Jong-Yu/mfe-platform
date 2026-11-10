import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const integrationRoot = fileURLToPath(new URL('../', import.meta.url));
const projectsDirectory = path.join(repositoryRoot, 'projects');
const outputDirectory = path.join(integrationRoot, 'artifacts/verification');
const npmCache = process.env.NPM_CACHE || '/private/tmp/mfe-npm-cache';
const projectNames = ['platform-sdk', 'service-d-v1', 'service-d-v2', 'service-b-v1', 'service-b-v2', 'service-a', 'service-c', 'shell'];
const excluded = new Set(['node_modules', '.git']);
const report = {
  startedAt: new Date().toISOString(),
  status: 'running',
  evidenceScope: 'Only a temporary SDK checkout is installed and rebuilt at the next minor version. Existing consumer sources, configurations and dist bytes are fingerprinted. Browser tabs execute the actual baseline and upgraded SDK files; incompatible-release probes are explicitly metadata-only.',
  checks: [],
  pages: [],
};
const originalStoreEnvironment = process.env.MFE_ARTIFACT_STORE;
const sourceStorePaths = [...new Set([path.join(repositoryRoot, 'artifact-store'), ...(originalStoreEnvironment ? [path.resolve(originalStoreEnvironment)] : [])])];
let temporaryDirectory;
let sdkTemporaryDirectory;
let browser;
let server;
let currentPage;

await mkdir(outputDirectory, { recursive: true });

async function check(name, action) {
  const started = Date.now();
  try {
    const result = await action();
    report.checks.push({ name, status: 'passed', durationMs: Date.now() - started });
    console.log(`PASS ${name}`);
    return result;
  } catch (error) {
    report.checks.push({ name, status: 'failed', durationMs: Date.now() - started, error: error.message });
    throw error;
  }
}

async function readJSON(filename) {
  return JSON.parse(await readFile(filename, 'utf8'));
}

async function fingerprint(directory) {
  const hash = createHash('sha256');
  let files = 0;
  async function visit(current) {
    const entries = (await readdir(current, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (excluded.has(entry.name)) continue;
      const filename = path.join(current, entry.name);
      assert(!entry.isSymbolicLink(), `Unexpected project symlink ${filename}`);
      if (entry.isDirectory()) await visit(filename);
      else if (entry.isFile()) {
        hash.update(path.relative(directory, filename)).update('\0').update(await readFile(filename)).update('\0');
        files += 1;
      }
    }
  }
  await visit(directory);
  return { files, sha256: hash.digest('hex') };
}

async function originalFingerprints() {
  return Object.fromEntries(await Promise.all(projectNames.map(async (name) => [name, await fingerprint(path.join(projectsDirectory, name))])));
}

function run(command, args, cwd, timeoutMs = 180_000) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.NODE_PATH;
    delete env.npm_config_workspace;
    delete env.npm_config_workspaces;
    const started = Date.now();
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    const capture = (chunk) => { output = (output + chunk).slice(-20_000); };
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`${command} ${args.join(' ')} timed out\n${output}`));
    }, timeoutMs);
    child.on('error', (error) => { clearTimeout(timeout); reject(error); });
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      if (code !== 0) reject(new Error(`${command} ${args.join(' ')} failed (${signal || code})\n${output}`));
      else resolve({ exitCode: code, durationMs: Date.now() - started });
    });
  });
}

async function startServer(storeDirectory) {
  server = spawn(process.execPath, ['tools/serve.cjs'], {
    cwd: integrationRoot,
    env: { ...process.env, MFE_ARTIFACT_STORE: storeDirectory, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`SDK verification server did not start\n${output}`)), 10_000);
    const fail = (error) => { clearTimeout(timeout); reject(error); };
    server.on('error', fail);
    server.once('exit', (code) => fail(new Error(`SDK verification server exited before readiness (${code})\n${output}`)));
    server.stderr.on('data', (chunk) => { output = (output + chunk).slice(-8_000); });
    server.stdout.on('data', (chunk) => {
      output = (output + chunk).slice(-8_000);
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timeout); resolve(match[0]); }
    });
  });
}

async function stopServer() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => { server.kill('SIGKILL'); resolve(); }, 5_000);
    server.once('exit', () => { clearTimeout(timeout); resolve(); });
    server.kill('SIGTERM');
  });
}

async function loadPlaywright() {
  try { return await import('playwright'); }
  catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    return import(pathToFileURL('/Users/jong-yu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js').href);
  }
}

async function trackedPage(context, name) {
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  currentPage = page;
  const record = { name, requests: [], bootRequests: [], remoteEntries: [], consoleErrors: [], pageErrors: [], failedRequests: [] };
  report.pages.push(record);
  page.on('request', (request) => {
    if (/\/remoteEntry\.js(?:\?|$)/.test(request.url())) record.requests.push(request.url());
    if (/\/compositions\/[^/]+\.json(?:\?|$)/.test(request.url())) record.bootRequests.push(request.url());
  });
  page.on('response', (response) => {
    if (/\/remoteEntry\.js(?:\?|$)/.test(response.url())) record.remoteEntries.push({ url: response.url(), status: response.status() });
  });
  page.on('pageerror', (error) => record.pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const entry = { text: message.text(), location: message.location() };
    if (!/favicon\.ico/.test(`${entry.text} ${entry.location.url}`)) record.consoleErrors.push(entry);
  });
  page.on('requestfailed', (request) => {
    if (!/favicon\.ico/.test(request.url())) record.failedRequests.push({ url: request.url(), error: request.failure()?.errorText });
  });
  return { page, record };
}

function widget(page, id) {
  return page.getByTestId(`widget-${id}`);
}

async function text(locator) {
  return (await locator.innerText()).trim();
}

async function assertRuntime(page, registry, expectedIds, expectedUser) {
  for (const id of expectedIds) await widget(page, id).getByTestId('platform-version').waitFor({ state: 'visible' });
  const proof = await page.evaluate(() => ({
    compositionId: window.__MFE_PROOF__.compositionId,
    platformArtifactId: window.__MFE_PROOF__.platformArtifactId,
    registry: window.__MFE_PROOF__.registry,
    identities: window.__MFE_PROOF__.identities(),
    runtimeDiagnostics: window.__MFE_PROOF__.getRuntimeDiagnostics(),
    snapshot: window.__MFE_PROOF__.getSnapshot(),
    loadedArtifacts: window.__MFE_PROOF__.loadedArtifacts,
  }));
  assert.equal(proof.compositionId, registry.compositionId);
  assert.equal(proof.platformArtifactId, registry.artifacts.platform.id);
  assert.equal(proof.registry.compositionId, registry.compositionId);
  assert.equal(proof.registry.selected.platform, registry.artifacts.platform.id);
  assert.equal(proof.snapshot.platformVersion, registry.platformVersion);
  assert.equal(proof.runtimeDiagnostics.compositionId, registry.compositionId);
  assert.equal(proof.runtimeDiagnostics.platformArtifactId, registry.artifacts.platform.id);
  assert.equal(proof.runtimeDiagnostics.bootURL, `/compositions/${registry.compositionId}.json`);
  const sdkContainer = proof.runtimeDiagnostics.containers.find((item) => item.id === registry.artifacts.platform.id);
  assert(sdkContainer, 'Runtime diagnostics must contain the selected SDK container');
  assert.equal(sdkContainer.loadCount, 1, 'The selected SDK script must be loaded once per browser document');
  assert.equal(sdkContainer.initCount, 1, 'The selected SDK container must be initialized once per browser document');
  assert.deepEqual(proof.identities.map((item) => item.instanceId).sort(), [...expectedIds].sort());
  for (const identity of proof.identities) {
    assert.equal(identity.reactMatches, true, `${identity.instanceId} must share the React identity`);
    assert.equal(identity.contextMatches, true, `${identity.instanceId} must share the selected SDK Context identity`);
  }
  for (const id of expectedIds) {
    assert.equal(await text(widget(page, id).getByTestId('platform-version')), registry.platformVersion);
    assert.equal(await text(widget(page, id).getByTestId('platform-user')), expectedUser);
  }
  return proof;
}

function assertClean(record) {
  assert.deepEqual(record.pageErrors, [], `${record.name}: uncaught browser errors`);
  assert.deepEqual(record.consoleErrors, [], `${record.name}: unexpected console errors`);
  assert.deepEqual(record.failedRequests, [], `${record.name}: unexpected request failures`);
}

function businessVersions(proof) {
  return Object.fromEntries(proof.identities.map((item) => [item.instanceId, { b: item.artifactId, d: item.dependencyArtifact }]));
}

async function metadataFixture(directory, originalRelease, changes) {
  await mkdir(path.join(directory, 'dist'), { recursive: true });
  const artifact = {
    ...originalRelease,
    ...changes,
    name: `mf_${changes.id}`,
    entry: `/artifacts/${changes.id}/remoteEntry.js`,
  };
  await writeFile(path.join(directory, 'dist/release.json'), `${JSON.stringify(artifact, null, 2)}\n`);
  await writeFile(path.join(directory, 'dist/remoteEntry.js'), '// Metadata-only activation rejection probe. Never load this as executable SDK code.\n');
  return artifact;
}

try {
  const sourceFingerprints = await originalFingerprints();
  const sourceStorePointers = Object.fromEntries(await Promise.all(sourceStorePaths.map(async (directory) => [directory, await readFile(path.join(directory, 'current.json'), 'utf8')])));
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'mfe-sdk-upgrade-store-'));
  const storeDirectory = path.join(temporaryDirectory, 'store');
  process.env.MFE_ARTIFACT_STORE = storeDirectory;
  const require = createRequire(import.meta.url);
  const { publish, activate, read } = require('../tools/store.cjs');
  let baselineRegistry;
  let baselineVersion;
  let upgradedVersion;
  let unsupportedVersion;
  let baselineUserName;
  let upgradedUserName;
  const releases = {};

  await check('publish the existing eight builds into a separate store with their baseline SDK', async () => {
    for (const name of projectNames) {
      releases[name] = publish(path.join(projectsDirectory, name));
      assert.equal(releases[name].format, 'esm', `${name} must use the current Vite build`);
      assert.equal(releases[name].federation, 'vite');
    }
    baselineVersion = releases['platform-sdk'].version;
    assert.match(baselineVersion, /^\d+\.\d+\.\d+$/, 'The upgrade proof uses stable SDK releases');
    const [major, minor] = baselineVersion.split('.').map(Number);
    upgradedVersion = `${major}.${minor + 1}.0`;
    unsupportedVersion = `${major + 1}.0.0`;
    report.versionTransition = { from: baselineVersion, to: upgradedVersion, unsupported: unsupportedVersion };
    baselineRegistry = activate({
      platform: releases['platform-sdk'].id,
      shell: releases.shell.id,
      A: releases['service-a'].id,
      C: releases['service-c'].id,
    }, {
      [releases['service-a'].id]: { b: releases['service-b-v1'].id },
      [releases['service-c'].id]: { b: releases['service-b-v2'].id },
      [releases['service-b-v1'].id]: { d: releases['service-d-v1'].id },
      [releases['service-b-v2'].id]: { d: releases['service-d-v2'].id },
    });
    assert.equal(baselineRegistry.platformVersion, baselineVersion);
    assert.equal(baselineRegistry.artifacts.platform.id, releases['platform-sdk'].id);
    assert.equal(typeof baselineRegistry.compositionId, 'string');
    report.baselineComposition = baselineRegistry;
    report.consumerBuildsExecuted = 0;
  });

  const baseURL = await startServer(storeDirectory);
  report.baseURL = baseURL;
  const { chromium } = await loadPlaywright();
  const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (existsSync(localChrome) ? localChrome : undefined);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browserVersion = browser.version();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  const old = await trackedPage(context, `existing-sdk-${baselineVersion}-session`);

  await check(`an existing tab starts on SDK ${baselineVersion} and mounts only A`, async () => {
    await old.page.goto(`${baseURL}/?empty=1`, { waitUntil: 'networkidle' });
    await old.page.getByTestId('add-a').click();
    await widget(old.page, 'A').getByTestId('platform-user').waitFor({ state: 'visible' });
    baselineUserName = await text(widget(old.page, 'A').getByTestId('platform-user'));
    assert(baselineUserName.length > 0);
    upgradedUserName = `${baselineUserName} · SDK ${upgradedVersion}`;
    await assertRuntime(old.page, baselineRegistry, ['A'], baselineUserName);
    await widget(old.page, 'A').getByTestId('increment').click();
    await widget(old.page, 'A').getByTestId('input').fill('old-session-value');
    await widget(old.page, 'A').getByTestId('cache-write').click();
    assert.equal(await widget(old.page, 'C').count(), 0);
    assertClean(old.record);
  });

  let upgradedRelease;
  await check(`only an isolated SDK checkout is installed and rebuilt as ${upgradedVersion} with a visible behavior change`, async () => {
    sdkTemporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'mfe-sdk-upgrade-project-'));
    const sdkDirectory = path.join(sdkTemporaryDirectory, 'project');
    const sourceDirectory = path.join(projectsDirectory, 'platform-sdk');
    await cp(sourceDirectory, sdkDirectory, {
      recursive: true,
      filter: (filename) => !path.relative(sourceDirectory, filename).split(path.sep).some((part) => ['node_modules', 'dist', '.git'].includes(part)),
    });
    assert.deepEqual(await readdir(sdkTemporaryDirectory), ['project']);
    report.sdkInstall = await run('npm', ['ci', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', npmCache], sdkDirectory);
    await run('npm', ['version', upgradedVersion, '--no-git-tag-version', '--ignore-scripts'], sdkDirectory);
    const sourceFile = path.join(sdkDirectory, 'src/sdk.jsx');
    const source = await readFile(sourceFile, 'utf8');
    assert.match(source, /__SERVICE_VERSION__/, 'SDK runtime version must come from its own build version');
    const escapedUserName = baselineUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const userNameLiteral = new RegExp(`name:\\s*(['"])${escapedUserName}\\1`);
    assert.match(source, userNameLiteral, 'The SDK source should provide the baseline demo user');
    await writeFile(sourceFile, source.replace(userNameLiteral, `name: ${JSON.stringify(upgradedUserName)}`));
    report.sdkBuild = await run('npm', ['run', 'build'], sdkDirectory);
    upgradedRelease = await readJSON(path.join(sdkDirectory, 'dist/release.json'));
    assert.equal(upgradedRelease.version, upgradedVersion);
    assert.equal(upgradedRelease.format, 'esm');
    assert.equal(upgradedRelease.federation, 'vite');
    assert.notEqual(upgradedRelease.id, releases['platform-sdk'].id);
    assert.equal(upgradedRelease.runtimeRequirements.platform, undefined, 'The SDK does not require another SDK artifact');
    assert.deepEqual(upgradedRelease.dependencies, releases['platform-sdk'].dependencies);
    assert.equal((await readJSON(path.join(sdkDirectory, 'package-lock.json'))).version, upgradedVersion);
    publish(sdkDirectory);
    report.upgradedSDK = upgradedRelease;
    report.behaviorChange = { field: 'PlatformProvider user.name', from: baselineUserName, to: upgradedUserName };
    assert.deepEqual(await originalFingerprints(), sourceFingerprints, 'Building the copied SDK must not change any original project, including consumer dist bytes');
  });

  let upgradedRegistry;
  await check('activate only the SDK selection without rebuilding or republishing consumers', async () => {
    upgradedRegistry = activate({ platform: upgradedRelease.id });
    assert.equal(upgradedRegistry.platformVersion, upgradedVersion);
    assert.notEqual(upgradedRegistry.compositionId, baselineRegistry.compositionId);
    assert.deepEqual(upgradedRegistry.applications, baselineRegistry.applications);
    assert.deepEqual(upgradedRegistry.shell, baselineRegistry.shell);
    assert.deepEqual(upgradedRegistry.runtimeBindings, baselineRegistry.runtimeBindings);
    assert.deepEqual(upgradedRegistry.selected, { ...baselineRegistry.selected, platform: upgradedRelease.id });
    report.upgradedComposition = upgradedRegistry;
  });

  let oldProof;
  await check(`a previously opened tab keeps SDK ${baselineVersion} even when it mounts C after the upgrade`, async () => {
    await old.page.getByTestId('add-c').click();
    oldProof = await assertRuntime(old.page, baselineRegistry, ['A', 'C'], baselineUserName);
    assert.deepEqual(old.record.bootRequests, [new URL(oldProof.runtimeDiagnostics.bootURL, baseURL).href], 'An existing tab must fetch one immutable boot snapshot');
    const oldSnapshotResponse = await fetch(new URL(oldProof.runtimeDiagnostics.bootURL, baseURL));
    assert.equal(oldSnapshotResponse.status, 200);
    const oldSnapshot = await oldSnapshotResponse.json();
    assert.equal(oldSnapshot.compositionId, baselineRegistry.compositionId);
    assert.equal(oldSnapshot.artifacts.platform.id, releases['platform-sdk'].id, 'The immutable old snapshot must retain its SDK after current selection changes');
    report.retrievedOldSnapshotAfterUpgrade = { compositionId: oldSnapshot.compositionId, platformArtifactId: oldSnapshot.artifacts.platform.id };
    assert.equal(await text(widget(old.page, 'A').getByTestId('count')), '1');
    await widget(old.page, 'A').getByTestId('cache-read').click();
    assert.equal(await text(widget(old.page, 'A').getByTestId('cache-value')), 'old-session-value');
    assert(!old.record.requests.some((url) => new URL(url).pathname === upgradedRelease.entry), 'Old sessions must never request the newly selected SDK');
    assertClean(old.record);
    old.record.runtimeProof = oldProof;
  });

  const upgraded = await trackedPage(context, `new-sdk-${upgradedVersion}-session`);
  await check(`a new tab loads the actual SDK ${upgradedVersion} remote while B/D artifacts and React/Context sharing remain unchanged`, async () => {
    await upgraded.page.goto(`${baseURL}/?order=ac`, { waitUntil: 'networkidle' });
    const proof = await assertRuntime(upgraded.page, upgradedRegistry, ['A', 'C'], upgradedUserName);
    assert.deepEqual(upgraded.record.bootRequests, [new URL(proof.runtimeDiagnostics.bootURL, baseURL).href], 'A new tab must fetch one immutable boot snapshot');
    assert.deepEqual(businessVersions(proof), businessVersions(oldProof));
    assert(upgraded.record.remoteEntries.some((entry) => new URL(entry.url).pathname === upgradedRelease.entry && entry.status === 200), 'The upgraded SDK must be served over HTTP and executed');
    assert(!upgraded.record.requests.some((url) => new URL(url).pathname === releases['platform-sdk'].entry), 'New sessions must not load the old SDK');
    assertClean(upgraded.record);
    upgraded.record.runtimeProof = proof;
    await upgraded.page.evaluate(() => window.scrollTo(0, 0));
    await upgraded.page.screenshot({ path: path.join(outputDirectory, 'sdk-upgrade.png'), fullPage: true });
  });

  await check('rollback selects the baseline SDK for new tabs without replacing the SDK in existing tabs', async () => {
    const rollbackRegistry = activate({ platform: releases['platform-sdk'].id });
    assert.equal(rollbackRegistry.artifacts.platform.id, releases['platform-sdk'].id);
    report.rollbackComposition = rollbackRegistry;
    const rollback = await trackedPage(context, 'new-session-after-rollback');
    await rollback.page.goto(`${baseURL}/?order=ca`, { waitUntil: 'networkidle' });
    rollback.record.runtimeProof = await assertRuntime(rollback.page, rollbackRegistry, ['A', 'C'], baselineUserName);
    await assertRuntime(upgraded.page, upgradedRegistry, ['A', 'C'], upgradedUserName);
    await assertRuntime(old.page, baselineRegistry, ['A', 'C'], baselineUserName);
    assertClean(rollback.record);
    assertClean(upgraded.record);
  });

  await check('metadata-only next-major SDK and React-incompatible probes are rejected without changing the current selection', async () => {
    const currentSelection = read('selected.json');
    const currentRegistry = read('registry.json');
    const probes = [
      {
        label: 'SDK at the next major version, outside the declared supported range',
        changes: { id: `platform_${unsupportedVersion.replaceAll('.', '_')}_metadata_range_probe`, version: unsupportedVersion },
        expectedError: /platform|sdk|range|satisf|compatib|version|require/i,
      },
      {
        label: 'SDK metadata requiring a different React runtime version',
        changes: {
          id: `platform_${upgradedVersion.replaceAll('.', '_')}_metadata_react_probe`,
          version: upgradedVersion,
          runtimeRequirements: {
            ...upgradedRelease.runtimeRequirements,
            react: upgradedRelease.runtimeRequirements.react === '18.3.1' ? '17.0.2' : '18.3.1',
            'react-dom': upgradedRelease.runtimeRequirements['react-dom'] === '18.3.1' ? '17.0.2' : '18.3.1',
          },
        },
        expectedError: /react|runtime|compatib|require/i,
      },
    ];
    report.metadataOnlyRejections = [];
    for (const [index, probe] of probes.entries()) {
      const directory = path.join(temporaryDirectory, `metadata-only-probe-${index}`);
      const artifact = await metadataFixture(directory, upgradedRelease, probe.changes);
      publish(directory);
      let rejection;
      assert.throws(() => {
        try { activate({ platform: artifact.id }); }
        catch (error) { rejection = error.message; throw error; }
      }, probe.expectedError);
      assert.deepEqual(read('selected.json'), currentSelection);
      assert.deepEqual(read('registry.json'), currentRegistry);
      report.metadataOnlyRejections.push({ label: probe.label, artifactId: artifact.id, executedInBrowser: false, rejection });
    }
  });

  await check('a failed selected SDK load stops a new boot without silently falling back to an older SDK', async () => {
    activate({ platform: upgradedRelease.id });
    const failed = await trackedPage(context, 'selected-sdk-load-failure');
    const sdkURL = new URL(upgradedRelease.entry, baseURL).href;
    await failed.page.route(sdkURL, (route) => route.abort('failed'));
    await failed.page.goto(`${baseURL}/?order=ac`, { waitUntil: 'networkidle' });
    const alert = failed.page.getByRole('alert');
    await alert.waitFor({ state: 'visible' });
    assert.match(await text(alert), /SDK|platform|Remote|initializ|실패|초기화/i);
    assert.equal(await failed.page.locator('[data-testid^="widget-"]').count(), 0);
    assert(failed.record.requests.includes(sdkURL));
    assert(!failed.record.requests.some((url) => new URL(url).pathname === releases['platform-sdk'].entry), 'No implicit old-SDK fallback may occur');
    assert.equal(failed.record.failedRequests.length, 1);
    assert.equal(failed.record.failedRequests[0].url, sdkURL);
    assert.deepEqual(failed.record.pageErrors, [], 'The SDK boot failure should be handled');
    for (const error of failed.record.consoleErrors) {
      const resourceFailure = error.location.url === sdkURL && /Failed to load resource/.test(error.text);
      const sdkFailure = error.text.includes(upgradedRelease.entry) || error.text.includes(upgradedRelease.id);
      assert(resourceFailure || sdkFailure, `Unexpected console error during SDK failure: ${error.text}`);
    }
    failed.record.expectedFailure = true;
    await assertRuntime(upgraded.page, upgradedRegistry, ['A', 'C'], upgradedUserName);
    await assertRuntime(old.page, baselineRegistry, ['A', 'C'], baselineUserName);
  });

  await check('all original Shell/A/B/C/D sources, configurations and built bytes remain unchanged', async () => {
    const after = await originalFingerprints();
    assert.deepEqual(after, sourceFingerprints);
    for (const [directory, pointer] of Object.entries(sourceStorePointers)) {
      assert.equal(await readFile(path.join(directory, 'current.json'), 'utf8'), pointer, `Original composition pointer changed: ${directory}`);
    }
    report.originalStorePointersUnchanged = Object.keys(sourceStorePointers);
    report.originalProjectFingerprints = after;
    report.originalProjectCount = projectNames.length;
    report.consumerBuildsExecuted = 0;
  });
  // Preserve the tested SDK build for management-UI fixtures and local demos.
  report.retainedRelease = path.join(integrationRoot, 'artifacts/runtime-sdk-releases', upgradedRelease.id);
  await mkdir(report.retainedRelease, { recursive: true });
  await cp(path.join(sdkTemporaryDirectory, 'project/dist'), path.join(report.retainedRelease, 'dist'), { recursive: true });
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = { message: error.message, stack: error.stack };
  if (currentPage && !currentPage.isClosed()) {
    await currentPage.screenshot({ path: path.join(outputDirectory, 'sdk-upgrade-failure.png'), fullPage: true }).catch(() => {});
  }
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await stopServer();
  const directories = [temporaryDirectory, sdkTemporaryDirectory].filter(Boolean);
  const cleanup = await Promise.allSettled(directories.map((directory) => rm(directory, { recursive: true, force: true })));
  report.temporaryCopiesRemoved = cleanup.every((result) => result.status === 'fulfilled');
  if (!report.temporaryCopiesRemoved) {
    report.status = 'failed';
    report.cleanupErrors = cleanup.filter((result) => result.status === 'rejected').map((result) => result.reason.message);
    process.exitCode = 1;
  }
  if (originalStoreEnvironment === undefined) delete process.env.MFE_ARTIFACT_STORE;
  else process.env.MFE_ARTIFACT_STORE = originalStoreEnvironment;
  report.finishedAt = new Date().toISOString();
  report.passedChecks = report.checks.filter((entry) => entry.status === 'passed').length;
  await writeFile(path.join(outputDirectory, 'sdk-upgrade.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`SDK upgrade verification ${report.status}: ${report.passedChecks}/${report.checks.length} checks. Report: ${path.join(outputDirectory, 'sdk-upgrade.json')}`);
}
