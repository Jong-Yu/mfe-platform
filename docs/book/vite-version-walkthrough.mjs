#!/usr/bin/env node
// Repeat the current Vite SDK/D version proofs in a freshly installed copy.
// Run from any directory: node docs/book/vite-version-walkthrough.mjs
// Offline default: NPM_CACHE=/private/tmp/mfe-npm-cache. Set MFE_VERSIONS_ONLINE=1
// only to allow the initial installs to fill that cache; each upgrade proof still
// requires its isolated offline install to succeed.
// MFE_VERSIONS_COLD=1 creates its own verified-empty cache and downloads from the
// official registry with empty user/global npm configs; it never uses warm input.
// MFE_WALKTHROUGH_ROOT selects the source checkout (for example, a fresh clone).
// It is still copied to a new temporary tree before install/build/test. Optional
// MFE_WALKTHROUGH_OUTPUT redirects reports; defaults stay beside this harness.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const harnessRepository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repository = path.resolve(process.env.MFE_WALKTHROUGH_ROOT || harnessRepository);
const cold = process.env.MFE_VERSIONS_COLD === '1';
const output = process.env.MFE_WALKTHROUGH_OUTPUT
  ? path.resolve(process.env.MFE_WALKTHROUGH_OUTPUT)
  : path.join(harnessRepository, cold ? 'docs/verification/vite-cold-install/versions' : 'docs/verification/vite-walkthrough/versions');
const temporaryRoot = process.platform === 'darwin' ? '/private/tmp' : os.tmpdir();
const registry = 'https://registry.npmjs.org/';
const cache = cold
  ? await mkdtemp(path.join(temporaryRoot, 'mfe-vite-versions-empty-cache-'))
  : path.resolve(process.env.NPM_CACHE || '/private/tmp/mfe-npm-cache');
const offline = !cold && process.env.MFE_VERSIONS_ONLINE !== '1';
const excluded = new Set(['node_modules', 'dist', '.mfe-dev', 'artifact-store', 'artifacts', '.git']);
const suites = [
  { name: 'SDK only replacement and rollback', script: 'test:sdk', report: 'sdk-upgrade.json', image: 'sdk-upgrade.png' },
  { name: 'D only replacement and rollback', script: 'test:dependency', report: 'dependency-upgrade.json', image: 'dependency-upgrade.png' },
];
const report = {
  startedAt: new Date().toISOString(), status: 'running',
  scope: 'Current Vite V7 SDK-only and D-only replacement, unchanged consumer bytes, old/new tabs, rollback and failed-selection behavior. This is not the historical Webpack example 17.',
  sourceRepository: repository, nodeVersion: process.version,
  sourceSelection: {
    rootOverride: Boolean(process.env.MFE_WALKTHROUGH_ROOT), harnessRepository,
    execution: 'Copy the selected source checkout into a fresh temporary tree, excluding installed dependencies, build outputs, runtime stores and prior artifacts; run install/build/tests only in that copy.',
  },
  outputDirectory: output, outputOverride: Boolean(process.env.MFE_WALKTHROUGH_OUTPUT),
  installation: { cache, cold, mode: cold ? 'verified-empty private npm cache; official-registry online initial installs; isolated upgrade installs use only this newly populated cache'
    : offline ? 'prepared npm cache, offline installs' : 'network-enabled initial cache preparation; isolated upgrade installs remain offline' },
  commands: [], suites: [],
};
await mkdir(output, { recursive: true });

async function fingerprint(directory) {
  const hash = createHash('sha256');
  let files = 0;
  async function visit(dir) {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (excluded.has(entry.name)) continue;
      const filename = path.join(dir, entry.name);
      assert(!entry.isSymbolicLink(), `Unexpected source symlink: ${filename}`);
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
async function fingerprints(root) {
  const result = {};
  for (const name of ['projects', 'integration']) result[name] = await fingerprint(path.join(root, name));
  return result;
}
async function saveReport() {
  await writeFile(path.join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
}
async function run(label, args, cwd, env) {
  const filename = `${String(report.commands.length + 1).padStart(2, '0')}-${label}.log`;
  const record = { label, command: 'npm', args, cwd, log: filename, startedAt: new Date().toISOString(), status: 'running' };
  report.commands.push(record);
  await saveReport();
  console.log(`START ${label}`);
  const log = createWriteStream(path.join(output, filename));
  let tail = '';
  const started = Date.now();
  try {
    await new Promise((resolve, reject) => {
      const child = spawn('npm', args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
      const capture = (chunk) => { log.write(chunk); tail = (tail + chunk).slice(-16000); };
      child.stdout.on('data', capture);
      child.stderr.on('data', capture);
      const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error(`${label} exceeded 15 minutes\n${tail}`)); }, 900000);
      child.on('error', (error) => { clearTimeout(timer); reject(error); });
      child.on('close', (code, signal) => {
        clearTimeout(timer); record.exitCode = code; record.signal = signal;
        code === 0 ? resolve() : reject(new Error(`${label} failed (${signal || code})\n${tail}`));
      });
    });
    record.status = 'passed';
    console.log(`PASS ${label}`);
  } catch (error) {
    record.status = 'failed'; record.error = error.message; throw error;
  } finally {
    record.durationMs = Date.now() - started;
    record.finishedAt = new Date().toISOString();
    await new Promise(resolve => log.end(resolve));
    if (cold) {
      const body = await readFile(path.join(output, filename), 'utf8');
      const httpLines = body.split('\n').filter(line => /^npm http /.test(line));
      const misses = httpLines.filter(line => /\(cache miss\)/.test(line));
      const networkFetches = httpLines.filter(line => /\bfetch GET (?:200|304) https:\/\/registry\.npmjs\.org\//.test(line));
      record.httpEvidence = {
        httpLineCount: httpLines.length, cacheMisses: misses.length,
        successfulOfficialRegistryFetches: networkFetches.length,
        fetchedURLs: [...new Set(networkFetches.map(line => line.match(/https:\/\/[^\s]+/)?.[0]).filter(Boolean))],
        sample: misses.slice(0, 8),
      };
    }
    await saveReport();
  }
}

let isolated;
let originals;
try {
  assert(existsSync(cache) || !offline, `Prepared npm cache does not exist: ${cache}`);
  if (cold) {
    report.installation.cacheEntriesBeforeInstall = await readdir(cache);
    assert.deepEqual(report.installation.cacheEntriesBeforeInstall, [], 'Cold cache must be empty before npm starts.');
    report.installation.emptyCacheVerifiedAt = new Date().toISOString();
    report.installation.registry = registry;
  }
  originals = await fingerprints(repository);
  report.originalSourceFingerprints = originals;
  isolated = await mkdtemp(path.join(temporaryRoot, 'mfe-vite-versions-'));
  report.isolatedRepository = isolated;
  report.copyExclusions = [...excluded];
  for (const name of ['projects', 'integration']) {
    await cp(path.join(repository, name), path.join(isolated, name), {
      recursive: true,
      filter: file => !path.relative(repository, file).split(path.sep).some(part => excluded.has(part)),
    });
  }
  report.copiedSourceFingerprints = await fingerprints(isolated);
  assert.deepEqual(report.copiedSourceFingerprints, originals, 'The isolated input must match the current sources before installation.');
  const env = { ...process.env, NPM_CACHE: cache, MFE_NPM_CACHE: cache, MFE_OFFLINE: offline ? '1' : '0' };
  for (const key of ['MFE_ARTIFACT_STORE', 'NODE_PATH', 'npm_config_workspace', 'npm_config_workspaces']) delete env[key];
  if (cold) {
    for (const key of Object.keys(env)) {
      if (/^npm_config_/i.test(key) || /^(NPM_TOKEN|NODE_AUTH_TOKEN|YARN_NPM_AUTH_TOKEN)$/i.test(key)) delete env[key];
    }
    // A caller's production mode must not omit the build/test devDependencies.
    delete env.NODE_ENV;
    const configDirectory = await mkdtemp(path.join(temporaryRoot, 'mfe-vite-versions-npm-config-'));
    const userconfig = path.join(configDirectory, 'user.npmrc');
    const globalconfig = path.join(configDirectory, 'global.npmrc');
    await writeFile(userconfig, '', { mode: 0o600 });
    await writeFile(globalconfig, '', { mode: 0o600 });
    Object.assign(env, {
      NPM_CONFIG_USERCONFIG: userconfig, NPM_CONFIG_GLOBALCONFIG: globalconfig,
      NPM_CONFIG_REGISTRY: registry, NPM_CONFIG_CACHE: cache,
      NPM_CONFIG_OFFLINE: 'false', NPM_CONFIG_PREFER_OFFLINE: 'false',
      NPM_CONFIG_LOGLEVEL: 'http', NPM_CONFIG_AUDIT: 'false', NPM_CONFIG_FUND: 'false',
      NPM_CONFIG_FETCH_RETRIES: '1', NPM_CONFIG_FETCH_TIMEOUT: '30000',
    });
    report.installation.privateEmptyConfigs = { userconfig, globalconfig };
    report.installation.inheritedNpmConfigurationRemoved = true;
    const localConfigs = [];
    for (const folder of ['integration', ...(await readdir(path.join(isolated, 'projects'))).map(name => `projects/${name}`)]) {
      if (existsSync(path.join(isolated, folder, '.npmrc'))) localConfigs.push(`${folder}/.npmrc`);
      assert(!existsSync(path.join(isolated, folder, 'node_modules')), `${folder}: copied node_modules would invalidate cold proof`);
      assert(!existsSync(path.join(isolated, folder, 'dist')), `${folder}: copied dist would invalidate cold proof`);
    }
    assert.deepEqual(localConfigs, [], 'A project .npmrc needs explicit review before the private-config cold proof.');
    report.installation.localNpmConfigs = localConfigs;
    report.installation.noCopiedInstallOrBuildOutputs = true;
  }
  const integration = path.join(isolated, 'integration');
  const ci = ['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', cache];
  if (offline) ci.push('--offline');
  await run('integration-install', ci, integration, env);
  await run('project-install', ['run', 'setup'], integration, env);
  if (cold) {
    const installs = report.commands.filter(command => ['integration-install', 'project-install'].includes(command.label));
    report.installation.successfulOfficialRegistryFetches = installs.reduce((sum, command) => sum + command.httpEvidence.successfulOfficialRegistryFetches, 0);
    report.installation.cacheMisses = installs.reduce((sum, command) => sum + command.httpEvidence.cacheMisses, 0);
    assert(report.installation.successfulOfficialRegistryFetches > 0 && report.installation.cacheMisses > 0,
      'Cold installation must retain actual official-registry download/cache-miss evidence.');
    report.installation.cacheEntriesAfterInstall = await readdir(cache);
    report.installation.initialDownloadsCompletedAt = new Date().toISOString();
  }
  await run('baseline-build', ['run', 'build'], integration, env);
  report.baselineCurrent = JSON.parse(await readFile(path.join(isolated, 'artifact-store/current.json'), 'utf8'));
  report.baselineReleases = {};
  for (const name of ['platform-sdk', 'service-d-v1', 'service-d-v2', 'service-b-v1', 'service-b-v2', 'service-a', 'service-c', 'shell']) {
    const release = JSON.parse(await readFile(path.join(isolated, 'projects', name, 'dist/release.json'), 'utf8'));
    assert.equal(release.format, 'esm', `${name} must be a current ES-module build`);
    assert.equal(release.federation, 'vite', `${name} must be a current Vite build`);
    report.baselineReleases[name] = { id: release.id, version: release.version, format: release.format, federation: release.federation };
  }
  for (const suite of suites) {
    let commandError;
    try { await run(suite.script.replace(':', '-'), ['run', suite.script], integration, env); }
    catch (error) { commandError = error; }
    const source = path.join(integration, 'artifacts/verification', suite.report);
    if (existsSync(source)) {
      await cp(source, path.join(output, suite.report));
      const result = JSON.parse(await readFile(source, 'utf8'));
      report.suites.push({ name: suite.name, command: `npm run ${suite.script}`, status: result.status,
        passedChecks: result.passedChecks, checks: result.checks.length,
        consumerBuildsExecuted: result.consumerBuildsExecuted, browserVersion: result.browserVersion,
        report: suite.report, transition: result.versionTransition || result.versionTransitions,
        evidenceScope: result.evidenceScope, error: result.error });
      for (const image of [suite.image, suite.image.replace('.png', '-failure.png')]) {
        const sourceImage = path.join(integration, 'artifacts/verification', image);
        if (existsSync(sourceImage)) await cp(sourceImage, path.join(output, image));
      }
      assert.equal(result.status, 'passed', `${suite.script}: ${result.error?.message || 'suite did not pass'}`);
      assert.equal(result.consumerBuildsExecuted, 0, 'Replacement must not rebuild consumers');
    } else if (!commandError) throw new Error(`Missing suite report: ${source}`);
    if (commandError) throw commandError;
    await saveReport();
  }
  report.passedChecks = report.suites.reduce((sum, suite) => sum + suite.passedChecks, 0);
  report.totalChecks = report.suites.reduce((sum, suite) => sum + suite.checks, 0);
  assert.deepEqual(JSON.parse(await readFile(path.join(isolated, 'artifact-store/current.json'), 'utf8')), report.baselineCurrent, 'Version proofs must preserve their source baseline store pointer.');
  report.baselineStorePointerUnchanged = true;
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = { message: error.message, stack: error.stack };
  if (cold) report.failureClassification = /E404|404 Not Found|ETARGET|No matching version/i.test(error.message)
    ? 'public package/version unavailable; no warm-cache fallback attempted'
    : /EAI_AGAIN|ENOTFOUND|ECONN|ETIMEDOUT|FETCH_ERROR|CERT_|certificate/i.test(error.message)
      ? 'registry/network access failure; no warm-cache fallback attempted'
      : 'installation, build, or feature proof failed; inspect command log and suite report';
  process.exitCode = 1;
  console.error(error.message);
} finally {
  if (originals) {
    report.originalSourceFingerprintsAfter = await fingerprints(repository);
    report.originalSourcesUnchanged = JSON.stringify(report.originalSourceFingerprintsAfter) === JSON.stringify(originals);
    if (!report.originalSourcesUnchanged) {
      report.status = 'failed'; report.originalSourceChange = 'Original source inputs changed during the isolated run; inspect concurrent edits.'; process.exitCode = 1;
    }
  }
  report.retainedIsolatedCopy = isolated || null;
  report.finishedAt = new Date().toISOString();
  await saveReport();
  console.log(`Vite version walkthrough ${report.status}: ${report.passedChecks ?? 0}/${report.totalChecks ?? 0} feature checks. ${path.join(output, 'report.json')}`);
}
