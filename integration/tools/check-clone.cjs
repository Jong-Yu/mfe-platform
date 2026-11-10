#!/usr/bin/env node
// Runs before npm ci; reads files and Git objects without changing either.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const usage = 'node integration/tools/check-clone.cjs [--root <path>] [--git] [--json]\nRequires Node >=22.12 and tar; --git also requires Git and matching committed HEAD files.';
let root = path.resolve(__dirname, '../..'), gitMode = false, jsonMode = false;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--root' && args[i + 1] && !args[i + 1].startsWith('--')) root = path.resolve(args[++i]);
  else if (args[i] === '--git') gitMode = true;
  else if (args[i] === '--json') jsonMode = true;
  else if (args[i] === '--help') { console.log(usage); process.exit(0); }
  else { console.error(`Unknown or incomplete option: ${args[i]}\n${usage}`); process.exit(1); }
}
const errors = [], required = new Set(), counts = { projects: 0, vendorPackages: 0, developmentKits: 0, developmentFiles: 0 };
const fail = (file, reason) => errors.push({ path: file, reason });
const digest = (bytes, algorithm = 'sha256', encoding = 'hex') => crypto.createHash(algorithm).update(bytes).digest(encoding);
function finish(buildToolsVersion = null, head = null) {
  const report = { status: errors.length ? 'failed' : 'passed', root, mode: gitMode ? 'working files and committed HEAD' : 'working files', node: process.version, head, buildToolsVersion, counts: { ...counts, requiredFiles: required.size }, errors };
  if (jsonMode) console.log(JSON.stringify(report, null, 2));
  else { console.log(`${report.status.toUpperCase()}: ${counts.projects} projects, ${counts.vendorPackages} vendor packages, ${counts.developmentFiles} development files (${required.size} required inputs).`); for (const error of errors) console.log(`- ${error.path}: ${error.reason}`); console.log(usage); }
  process.exitCode = errors.length ? 1 : 0;
}
function file(relative) {
  const absolute = path.resolve(root, relative), normalized = path.relative(root, absolute);
  if (!normalized || normalized === '..' || normalized.startsWith(`..${path.sep}`) || path.isAbsolute(normalized)) { fail(relative, 'Required input must stay inside the source root.'); return null; }
  required.add(normalized.split(path.sep).join('/'));
  try {
    if (!fs.lstatSync(absolute).isFile()) throw new Error('not a regular file');
    return fs.readFileSync(absolute);
  } catch (error) { fail(relative, `Required source input is missing or unreadable: ${error.message}`); return null; }
}
function json(relative) {
  const bytes = file(relative);
  if (!bytes) return null;
  try { return JSON.parse(bytes); } catch (error) { fail(relative, `Invalid JSON: ${error.message}`); return null; }
}
function command(name, argv) {
  const result = spawnSync(name, argv, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr.trim() || `${name} exited ${result.status}`);
  return result.stdout;
}
const excluded = new Set(['node_modules', 'dist', '.mfe-dev', '.git', '.npm-cache', 'artifact-store', 'artifacts', 'vendor', 'dev', '.DS_Store']);
function sourceTree(relative) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) { fail(relative, 'Required source directory is missing.'); return; }
  for (const item of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (excluded.has(item.name) || item.name.endsWith('.log')) continue;
    const child = `${relative}/${item.name}`;
    if (item.isDirectory()) sourceTree(child); else file(child);
  }
}
const version = process.versions.node.split('.').map(Number);
if (version[0] < 22 || version[0] === 22 && version[1] < 12) {
  fail('Node.js', `Node >=22.12 is required; running ${process.version}. Select Node 24 in this shell (nvm use); .nvmrc does not select Node automatically.`);
  return finish();
}
const nvm = file('.nvmrc');
if (nvm && nvm.toString().trim() !== '24') fail('.nvmrc', 'The current learning guide requires root .nvmrc to select Node 24; run nvm use in each new shell.');
const toolPath = 'projects/platform-build-tools/package.json', tool = json(toolPath);
if (tool?.version !== '2.0.0' || !tool?.dependencies?.vite || !tool?.dependencies?.['@module-federation/vite'])
  fail(toolPath, `This guide requires Vite build-tools 2.0.0 with vite and @module-federation/vite; found ${tool?.version || 'missing'}. An older Webpack clone is not this guide's source revision.`);
const runtimePaths = ['runtime/federation-plugin.mjs', 'runtime/import-module.mjs'];
const runtimeBytes = runtimePaths.map(p => file(`projects/platform-build-tools/${p}`));
const projectNames = new Set(['platform-admin', 'platform-build-tools', 'platform-sdk', 'service-a', 'service-b-v1', 'service-b-v2', 'service-c', 'service-d-v1', 'service-d-v2', 'shell']);
if (fs.existsSync(path.join(root, 'projects'))) for (const entry of fs.readdirSync(path.join(root, 'projects'), { withFileTypes: true }))
  if (entry.isDirectory() && fs.existsSync(path.join(root, 'projects', entry.name, 'package.json'))) projectNames.add(entry.name);
for (const name of projectNames) {
  const base = `projects/${name}`, pkg = json(`${base}/package.json`), lock = json(`${base}/package-lock.json`);
  sourceTree(base);
  if (!pkg || !lock) continue;
  counts.projects++;
  if (name !== 'platform-build-tools' && !String(pkg.devDependencies?.['@mfe/platform-build-tools'] || pkg.dependencies?.['@mfe/platform-build-tools'] || '').startsWith('file:vendor/')) fail(`${base}/package.json`, 'Each active consumer must include its local vendor build-tool package.');
  if (name === 'platform-build-tools') for (const dependency of ['vite', '@module-federation/vite'])
    if (lock.packages?.['']?.dependencies?.[dependency] !== pkg.dependencies?.[dependency] || lock.packages?.[`node_modules/${dependency}`]?.version !== pkg.dependencies?.[dependency]) fail(`${base}/package-lock.json`, `The ${dependency} lock entry must match the declared current build dependency.`);
  for (const group of ['dependencies', 'devDependencies']) for (const [dependency, spec] of Object.entries(pkg[group] || {})) {
    if (!spec.startsWith('file:')) continue;
    const target = `${base}/${spec.slice(5)}`, bytes = file(target), entry = lock.packages?.[`node_modules/${dependency}`];
    if (!bytes) continue;
    counts.vendorPackages++;
    if (lock.packages?.['']?.[group]?.[dependency] !== spec || entry?.resolved !== spec) fail(`${base}/package-lock.json`, `Local dependency ${dependency} must resolve to ${spec} in both package and lock declarations.`);
    if (entry?.integrity !== `sha512-${digest(bytes, 'sha512', 'base64')}`) fail(target, 'Tarball bytes do not match the lockfile SHA-512 integrity.');
    try {
      const absolute = path.resolve(root, target), members = command('tar', ['-tzf', absolute]).trim().split('\n');
      const packed = JSON.parse(command('tar', ['-xOf', absolute, 'package/package.json']));
      if (packed.name !== dependency || packed.version !== entry?.version) fail(target, 'Tarball package name/version does not match its lock entry.');
      if (dependency === '@mfe/platform-build-tools') {
        if (packed.version !== '2.0.0' || packed.dependencies?.vite !== tool?.dependencies?.vite || packed.dependencies?.['@module-federation/vite'] !== tool?.dependencies?.['@module-federation/vite']) fail(target, 'Bundled build tools must match the current Vite 2.0.0 source and dependency versions.');
        runtimePaths.forEach((runtime, i) => {
          if (!members.includes(`package/${runtime}`)) fail(target, `Tarball is missing ${runtime}; Vite builds cannot load it.`);
          else if (runtimeBytes[i] && command('tar', ['-xOf', absolute, `package/${runtime}`]) !== runtimeBytes[i].toString()) fail(target, `Bundled ${runtime} differs from current build-tool source.`);
        });
      }
    } catch (error) { fail(target, `Cannot inspect the vendor package using tar: ${error.message}`); }
  }
  if (!fs.existsSync(path.join(root, base, 'mf.dev.json'))) { if (['service-a', 'service-b-v1', 'service-b-v2', 'service-c'].includes(name)) file(`${base}/mf.dev.json`); continue; }
  const settings = json(`${base}/mf.dev.json`), manifestPath = `${base}/${settings?.manifest || 'dev/manifest.json'}`, manifest = json(manifestPath);
  if (!manifest) continue;
  counts.developmentKits++;
  if (manifest.schemaVersion !== 1 || !manifest.artifacts?.[manifest.platform] || !manifest.files) { fail(manifestPath, 'Development manifest must declare schema 1, its SDK artifact and file hashes.'); continue; }
  for (const [id, artifact] of Object.entries(manifest.artifacts)) {
    const files = manifest.files[id] || {};
    if (artifact.id !== id || artifact.format !== 'esm' || artifact.federation !== 'vite' || artifact.entry !== `/artifacts/${id}/remoteEntry.js`) fail(manifestPath, `${id} must describe the current Vite ESM remote entry.`);
    if (!files['remoteEntry.js'] || !files['release.json']) fail(manifestPath, `${id} is missing remoteEntry.js or release.json hashes.`);
    for (const [relative, hash] of Object.entries(files)) {
      if (relative.includes('\\') || relative.split('/').some(part => !part || part === '..' || part === '.') || !/^[A-Za-z0-9_.-]+$/.test(id)) { fail(manifestPath, `Invalid development file path: ${id}/${relative}`); continue; }
      const target = `${path.dirname(manifestPath)}/remotes/${id}/${relative}`, bytes = file(target);
      counts.developmentFiles++;
      if (bytes && digest(bytes) !== hash) fail(target, 'Development file SHA-256 differs from the manifest; copy the complete published kit.');
      if (relative === 'release.json' && bytes) {
        try { if (!isDeepStrictEqual(JSON.parse(bytes), artifact)) fail(target, 'Release metadata differs from the development manifest.'); }
        catch (error) { fail(target, `Invalid release metadata: ${error.message}`); }
      }
    }
  }
}
for (const p of ['integration/package.json', 'integration/package-lock.json', 'integration/fixtures.json', 'integration/tools/setup.cjs', 'integration/tools/update-build-tools.cjs', 'integration/tools/check-clone.cjs', 'integration/tests/expose-chunk.mjs']) file(p);
for (const p of ['integration/tools', 'integration/tests', 'integration/templates', 'integration/scenarios']) sourceTree(p);
for (const name of ['README.md', 'chapters.html', 'vite-runtime.html', 'vite-workflow.html', 'build.py', 'style.css', 'reader.js', 'lessons.json', 'lab-guidance.json', 'sources.json', 'verify.mjs', 'vite-dev-walkthrough.mjs', 'vite-release-walkthrough.mjs', 'vite-version-walkthrough.mjs', 'summarize-vite-walkthrough.py']) file(`docs/book/${name}`);
file('README.md');
const chapterIds = ['vite-overview', 'vite-contracts', 'vite-loading', 'vite-isolation', 'vite-development', 'vite-release', 'vite-versioning', 'vite-reading-map'];
for (const [target, ids] of [['docs/mfe-self-study.html', chapterIds], ['docs/book/vite-runtime.html', chapterIds.slice(0, 4)], ['docs/book/vite-workflow.html', chapterIds.slice(4)]]) {
  const bytes = file(target);
  if (bytes) for (const id of ids) if (!bytes.toString().includes(`id="${id}"`)) fail(target, `Current Vite chapter #${id} is missing; regenerate the guide from its complete current sources.`);
}
let head = null;
if (gitMode) {
  try {
    if (fs.realpathSync(command('git', ['-C', root, 'rev-parse', '--show-toplevel']).trim()) !== fs.realpathSync(root)) throw new Error('--root must be the Git repository root.');
    head = command('git', ['-C', root, 'rev-parse', 'HEAD']).trim();
    const algorithm = command('git', ['-C', root, 'rev-parse', '--show-object-format']).trim();
    const committed = new Map(command('git', ['-C', root, 'ls-tree', '-r', '-z', 'HEAD']).split('\0').filter(Boolean).map(line => { const [header, name] = line.split('\t'); return [name, header.split(' ')[2]]; }));
    for (const relative of [...required].sort()) {
      if (!committed.has(relative)) { fail(relative, 'Required input is absent from HEAD; untracked or staged-only files do not reach a new clone.'); continue; }
      const absolute = path.join(root, relative);
      if (!fs.existsSync(absolute) || !fs.lstatSync(absolute).isFile()) continue;
      const bytes = fs.readFileSync(absolute), blob = Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes]);
      if (digest(blob, algorithm) !== committed.get(relative)) fail(relative, 'Working file differs from HEAD; commit the matching source revision before claiming clone reproducibility.');
    }
  } catch (error) { fail('.git/HEAD', `Cannot verify committed clone inputs: ${error.message}`); }
}
finish(tool?.version || null, head);
