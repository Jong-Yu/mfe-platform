import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { appendFile, cp, mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Each copied project is built without a neighboring service checkout or root node_modules.
// This checks standalone source builds, not an OS-level sandbox or source hermeticity.
const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const projectsDirectory = path.join(repositoryRoot, 'projects');
const outputDirectory = fileURLToPath(new URL('../artifacts/verification/', import.meta.url));
const npmCache = process.env.NPM_CACHE || '/private/tmp/mfe-npm-cache';
const selectedProjects = [
  { directory: 'service-a', service: 'a', version: '1.0.0' },
  { directory: 'service-b-v1', service: 'b', version: '1.4.0' },
];
const report = {
  startedAt: new Date().toISOString(),
  status: 'running',
  evidenceScope: 'Two source checkouts copied separately, installed offline and built without sibling project directories; complete release metadata and artifact bytes compared across checkout paths. Isolated negative builds check JavaScript/CSS source boundaries, dependency symlink escapes and global CSS rejection. Original projects are compared before and after.',
  checks: [],
  projects: [],
};
const temporaryDirectories = [];
const excludedDirectories = new Set(['node_modules', 'dist', '.git', '.mfe-dev']);

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

async function exists(filename) {
  try { await stat(filename); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

async function filesUnder(directory, ignored = new Set()) {
  if (!(await exists(directory))) return [];
  const paths = [];
  async function visit(current) {
    const entries = (await readdir(current, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (ignored.has(entry.name)) continue;
      const filename = path.join(current, entry.name);
      assert(!entry.isSymbolicLink(), `Unexpected symlink in source or output: ${filename}`);
      if (entry.isDirectory()) await visit(filename);
      else if (entry.isFile()) paths.push(filename);
    }
  }
  await visit(directory);
  return paths;
}

async function fingerprint(directory, ignored = new Set()) {
  if (!(await exists(directory))) return { present: false, fileCount: 0, sha256: null };
  const files = await filesUnder(directory, ignored);
  const hash = createHash('sha256');
  for (const filename of files) {
    hash.update(path.relative(directory, filename)).update('\0');
    hash.update(await readFile(filename)).update('\0');
  }
  return { present: true, fileCount: files.length, sha256: hash.digest('hex') };
}

async function allOriginalProjectFingerprints() {
  const result = {};
  for (const entry of (await readdir(projectsDirectory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(projectsDirectory, entry.name);
    if (!(await exists(path.join(directory, 'package.json')))) continue;
    result[entry.name] = {
      sourcesAndManifests: await fingerprint(directory, excludedDirectories),
      outputs: await fingerprint(path.join(directory, 'dist')),
    };
  }
  return result;
}

async function validatePackageReferences(directory) {
  const filenames = ['package.json', 'package-lock.json'];
  for (const filename of filenames) {
    const manifest = await readJSON(path.join(directory, filename));
    if (filename === 'package.json') assert(!manifest.workspaces, 'An independent project must not declare workspace members');
    const references = [];
    function visit(value) {
      if (typeof value === 'string') references.push(value);
      else if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') Object.values(value).forEach(visit);
    }
    visit(manifest);
    for (const reference of references) {
      assert(!reference.startsWith('workspace:'), `${filename} cannot depend on a workspace: ${reference}`);
      assert(!reference.startsWith('link:'), `${filename} cannot link to another checkout: ${reference}`);
      if (!reference.startsWith('file:')) continue;
      assert.match(reference, /^file:vendor\/[a-z\d._-]+\.tgz$/i, `${filename} only permits self-contained vendor tarballs`);
      assert(await exists(path.join(directory, reference.slice('file:'.length))), `Missing vendored tarball ${reference}`);
    }
  }
}

function command(commandName, args, directory, timeoutMs = 180_000) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.NODE_PATH;
    delete env.npm_config_workspace;
    delete env.npm_config_workspaces;
    const child = spawn(commandName, args, { cwd: directory, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    const started = Date.now();
    const capture = (chunk) => { output = (output + chunk.toString()).slice(-20_000); };
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`${commandName} ${args.join(' ')} timed out after ${timeoutMs}ms\n${output}`));
    }, timeoutMs);
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`${commandName} ${args.join(' ')} failed (${signal || code})\n${output}`));
      } else resolve({ exitCode: code, durationMs: Date.now() - started });
    });
  });
}

async function validateRelease(directory, project) {
  const pins = await readJSON(path.join(directory, 'mf.dependencies.json'));
  const pkg = await readJSON(path.join(directory, 'package.json'));
  const release = await readJSON(path.join(directory, 'dist/release.json'));
  const expectedDependencies = {};
  const expectedRuntimeRequirements = {};
  const expectedRuntimeDependencies = {};
  for (const [alias, artifact] of Object.entries(pins)) {
    if (artifact.mode === 'runtime') {
      assert.equal(typeof artifact.requires, 'string', `${alias} must declare a runtime version requirement`);
      assert(artifact.requires.length > 0, `${alias} must not have an empty runtime version requirement`);
      if (alias === 'platform') expectedRuntimeRequirements.platform = artifact.requires;
      else expectedRuntimeDependencies[alias] = { service: artifact.service, requires: artifact.requires };
    } else {
      assert.equal(typeof artifact.id, 'string', `${alias} must pin a concrete artifact ID`);
      expectedDependencies[alias] = artifact.id;
    }
  }
  const declaredDependencies = { ...pkg.devDependencies, ...pkg.dependencies };
  for (const packageName of ['react', 'react-dom']) {
    if (!Object.prototype.hasOwnProperty.call(declaredDependencies, packageName)) continue;
    const installed = await readJSON(path.join(directory, 'node_modules', packageName, 'package.json'));
    expectedRuntimeRequirements[packageName] = installed.version;
  }
  assert.match(release.id, new RegExp(`^${project.service}_${project.version.replaceAll('.', '_')}_[a-f\\d]+$`));
  assert.equal(release.service, project.service);
  assert.equal(release.version, project.version);
  assert.equal(release.name, `mf_${release.id}`);
  assert.equal(release.entry, `/artifacts/${release.id}/remoteEntry.js`);
  assert.deepEqual(release.dependencies, expectedDependencies, 'The release must preserve the exact local dependency aliases and pinned artifact IDs');
  assert.deepEqual(release.runtimeRequirements, expectedRuntimeRequirements, 'Runtime SDK ranges and exact installed React versions must remain separate from pinned business artifacts');
  assert.deepEqual(release.runtimeDependencies, expectedRuntimeDependencies, 'Business runtime requirements must not include the selected artifact');
  const emittedEntries = (await filesUnder(path.join(directory, 'dist'))).filter((filename) => path.basename(filename) === 'remoteEntry.js');
  assert(emittedEntries.length > 0, 'The independent build must emit a real remoteEntry.js');
  return release;
}

try {
  const originalsBefore = await check('capture original project source, manifest and output fingerprints', async () => {
    const fingerprints = await allOriginalProjectFingerprints();
    for (const selected of selectedProjects) assert(fingerprints[selected.directory], `Missing project ${selected.directory}`);
    assert(Object.keys(fingerprints).length > selectedProjects.length, 'Other independent projects must exist for the no-change check');
    assert(Object.values(fingerprints).some((item) => item.outputs.fileCount > 0), 'Build original projects first so output preservation can be verified');
    return fingerprints;
  });

  const isolatedProjects = [];
  for (const project of selectedProjects) {
    const sourceDirectory = path.join(projectsDirectory, project.directory);
    const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), `mfe-independent-${project.directory}-`));
    temporaryDirectories.push(temporaryDirectory);
    const isolatedDirectory = path.join(temporaryDirectory, 'project');
    const projectReport = { project: `projects/${project.directory}`, nodePathUnset: true, installMode: 'offline', copiedWithoutSiblingProjects: true };
    report.projects.push(projectReport);
    await check(`${project.directory}: copy only its own checkout and validate standalone package references`, async () => {
      // Validate symlinks before copying so no source can point back into a neighboring checkout.
      await filesUnder(sourceDirectory, excludedDirectories);
      await cp(sourceDirectory, isolatedDirectory, {
        recursive: true,
        filter: (filename) => !path.relative(sourceDirectory, filename).split(path.sep).some((part) => excludedDirectories.has(part)),
      });
      assert.deepEqual(await readdir(temporaryDirectory), ['project']);
      assert.equal(await exists(path.join(isolatedDirectory, 'node_modules')), false);
      assert.equal(await exists(path.join(isolatedDirectory, 'dist')), false);
      await validatePackageReferences(isolatedDirectory);
      projectReport.copiedSources = await fingerprint(isolatedDirectory, excludedDirectories);
    });

    await check(`${project.directory}: offline npm ci and build in the isolated checkout`, async () => {
      projectReport.install = await command('npm', ['ci', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', npmCache], isolatedDirectory);
      const installedTool = await readJSON(path.join(isolatedDirectory, 'node_modules/@mfe/platform-build-tools/package.json'));
      projectReport.buildTool = { name: installedTool.name, version: installedTool.version };
      assert.equal(installedTool.name, '@mfe/platform-build-tools');
      projectReport.build = await command('npm', ['run', 'build'], isolatedDirectory);
      const release = await validateRelease(isolatedDirectory, project);
      projectReport.release = release;
      const originalReleasePath = path.join(sourceDirectory, 'dist/release.json');
      if (await exists(originalReleasePath)) {
        const originalRelease = await readJSON(originalReleasePath);
        assert.equal(release.id, originalRelease.id, 'An unchanged checkout copied to another absolute path must retain its artifact identity');
        assert.deepEqual(release, originalRelease, 'An unchanged checkout must retain all release metadata, including emitted chunk names');
        assert.deepEqual(await fingerprint(path.join(isolatedDirectory, 'dist')), originalsBefore[project.directory].outputs,
          'An unchanged checkout copied to another absolute path must emit identical artifact bytes, including source maps');
        projectReport.matchesOriginalRelease = true;
        projectReport.matchesOriginalArtifactBytes = true;
      }
      isolatedProjects.push({ project, directory: isolatedDirectory, release, projectReport });
    });
  }

  const boundaryProject = isolatedProjects.find((item) => item.project.service === 'b');
  const boundarySource = path.join(boundaryProject.directory, 'src/Widget.jsx');
  const boundaryCSS = path.join(boundaryProject.directory, 'src/Widget.module.css');
  const boundaryParent = path.dirname(boundaryProject.directory);
  const savedSource = await readFile(boundarySource, 'utf8');
  const savedCSS = await readFile(boundaryCSS, 'utf8');

  await check('JavaScript imports cannot include source outside the service checkout', async () => {
    const outside = path.join(boundaryParent, 'outside.js');
    await writeFile(outside, 'globalThis.__MFE_OUTSIDE_SOURCE_PROBE__ = true;\n');
    try {
      await writeFile(boundarySource, `import '../../outside.js';\n${savedSource}`);
      await assert.rejects(command('npm', ['run', 'build'], boundaryProject.directory), /Cross-project source imports are not allowed/);
    } finally {
      await writeFile(boundarySource, savedSource);
      await rm(outside, { force: true });
    }
  });

  await check('a node_modules symlink cannot bypass the service source boundary', async () => {
    const outside = path.join(boundaryParent, 'outside-package');
    const link = path.join(boundaryProject.directory, 'node_modules/mfe-boundary-probe');
    await mkdir(outside);
    await writeFile(path.join(outside, 'package.json'), JSON.stringify({ name: 'mfe-boundary-probe', version: '1.0.0', type: 'module', main: 'index.js' }));
    await writeFile(path.join(outside, 'index.js'), 'globalThis.__MFE_SYMLINK_SOURCE_PROBE__ = true;\n');
    await symlink(outside, link, 'dir');
    try {
      await writeFile(boundarySource, `import 'mfe-boundary-probe';\n${savedSource}`);
      await assert.rejects(command('npm', ['run', 'build'], boundaryProject.directory), /Cross-project source imports are not allowed/);
    } finally {
      await writeFile(boundarySource, savedSource);
      await rm(link, { force: true });
      await rm(outside, { recursive: true, force: true });
    }
  });

  await check('remote CSS Modules reject global-only selectors', async () => {
    try {
      await writeFile(boundaryCSS, `${savedCSS}\nbody { --mfe-global-selector-probe: 1; }\n`);
      await assert.rejects(command('npm', ['run', 'build'], boundaryProject.directory), /not pure|local class or id/i);
    } finally {
      await writeFile(boundaryCSS, savedCSS);
    }
  });

  await check('CSS imports cannot inline source outside the service checkout', async () => {
    const outside = path.join(boundaryParent, 'outside.css');
    await writeFile(outside, '.outside { --mfe-outside-css-probe: 1; }\n');
    try {
      await writeFile(boundaryCSS, `@import '../../outside.css';\n${savedCSS}`);
      await assert.rejects(command('npm', ['run', 'build'], boundaryProject.directory), /Cross-project source imports are not allowed/);
    } finally {
      await writeFile(boundaryCSS, savedCSS);
      await rm(outside, { force: true });
    }
  });

  await check('editing and rebuilding only the B checkout creates a new artifact without changing A or dependency pins', async () => {
    const a = isolatedProjects.find((item) => item.project.service === 'a');
    const b = isolatedProjects.find((item) => item.project.service === 'b');
    const aBefore = await fingerprint(a.directory, new Set(['node_modules', '.git']));
    const pinsBefore = await readFile(path.join(b.directory, 'mf.dependencies.json'), 'utf8');
    const sourceFiles = await filesUnder(path.join(b.directory, 'src'));
    const sourceFile = sourceFiles.find((filename) => /Widget\.[jt]sx?$/.test(filename)) || sourceFiles.find((filename) => /\.[jt]sx?$/.test(filename));
    assert(sourceFile, 'B must contain its own JavaScript/TypeScript source');
    await appendFile(sourceFile, '\n// Independent checkout rebuild probe: only this B source changes.\n');
    b.projectReport.changedSource = path.relative(b.directory, sourceFile);
    b.projectReport.rebuild = await command('npm', ['run', 'build'], b.directory);
    const rebuiltRelease = await validateRelease(b.directory, b.project);
    assert.notEqual(rebuiltRelease.id, b.release.id, 'A changed local source must produce a new B artifact ID');
    assert.deepEqual(rebuiltRelease.dependencies, b.release.dependencies, 'Rebuilding B must preserve its pinned dependencies');
    assert.deepEqual(rebuiltRelease.runtimeRequirements, b.release.runtimeRequirements, 'Rebuilding B must preserve its runtime SDK and React requirements');
    assert.equal(await readFile(path.join(b.directory, 'mf.dependencies.json'), 'utf8'), pinsBefore);
    assert.deepEqual(await fingerprint(a.directory, new Set(['node_modules', '.git'])), aBefore, 'B rebuild must not change A source, manifest or output');
    b.projectReport.rebuiltRelease = rebuiltRelease;
    report.isolatedAUnchangedAfterBRebuild = true;
  });

  await check('all original project sources, manifests and output hashes remain unchanged', async () => {
    const originalsAfter = await allOriginalProjectFingerprints();
    assert.deepEqual(originalsAfter, originalsBefore);
    report.originalProjectCount = Object.keys(originalsBefore).length;
    report.originalProjectFingerprints = originalsAfter;
  });
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = { message: error.message, stack: error.stack };
  console.error(error);
  process.exitCode = 1;
} finally {
  const cleanup = await Promise.allSettled(temporaryDirectories.map((directory) => rm(directory, { recursive: true, force: true })));
  report.temporaryCopiesRemoved = cleanup.every((result) => result.status === 'fulfilled');
  if (!report.temporaryCopiesRemoved) {
    report.status = 'failed';
    report.cleanupErrors = cleanup.filter((result) => result.status === 'rejected').map((result) => result.reason.message);
    process.exitCode = 1;
  }
  report.finishedAt = new Date().toISOString();
  report.passedChecks = report.checks.filter((entry) => entry.status === 'passed').length;
  await writeFile(path.join(outputDirectory, 'independence.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Independence verification ${report.status}: ${report.passedChecks}/${report.checks.length} checks. Report: ${path.join(outputDirectory, 'independence.json')}`);
}
