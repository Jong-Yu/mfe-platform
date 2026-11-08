const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const semver = require('semver');
const { inside, readJson } = require('./project.cjs');
const validId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.+-]*$/.test(value);
function safeFile(base, relative) {
  const file = path.resolve(base, relative);
  if (!inside(base, file) || !fs.existsSync(file) || !fs.statSync(file).isFile() || !inside(fs.realpathSync(base), fs.realpathSync(file))) throw new Error(`Invalid development file: ${relative}`);
  return file;
}
function readDevKit(root) {
  const settings = readJson(safeFile(root, 'mf.dev.json'));
  const manifestPath = safeFile(root, settings.manifest || 'dev/manifest.json');
  const manifest = readJson(manifestPath);
  if (manifest.schemaVersion !== 1 || !validId(manifest.platform) || !manifest.artifacts || !manifest.files) throw new Error('Invalid development manifest schema.');
  const remoteRoot = path.join(path.dirname(manifestPath), 'remotes');
  const fileMap = new Map();
  const names = new Set();
  for (const [id, artifact] of Object.entries(manifest.artifacts)) {
    if (!validId(id) || artifact.id !== id || artifact.kind !== 'remote' || !semver.valid(artifact.version) || typeof artifact.name !== 'string' || !/^[$A-Z_a-z][$\w]*$/.test(artifact.name) || names.has(artifact.name)) throw new Error(`Invalid development artifact: ${id}`);
    names.add(artifact.name);
    if (artifact.entry !== `/artifacts/${id}/remoteEntry.js`) throw new Error(`Unexpected artifact entry: ${id}`);
    const files = manifest.files[id];
    if (!files || !Object.hasOwn(files, 'remoteEntry.js') || !Object.hasOwn(files, 'release.json')) throw new Error(`Missing development artifact files: ${id}`);
    for (const [relative, digest] of Object.entries(files)) {
      if (relative.includes('\\') || relative.includes('\0') || relative.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Invalid development asset path.');
      const file = safeFile(remoteRoot, `${id}/${relative}`);
      if (typeof digest !== 'string' || crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== digest) throw new Error(`Development asset checksum mismatch: ${id}/${relative}`);
      fileMap.set(`/artifacts/${id}/${relative}`, file);
    }
    if (JSON.stringify(readJson(fileMap.get(`/artifacts/${id}/release.json`))) !== JSON.stringify(artifact)) throw new Error(`Development release metadata mismatch: ${id}`);
  }
  if (typeof settings.module !== 'string' || !settings.module.startsWith('./')) throw new Error('mf.dev.json requires a module such as ./Widget.');
  if (typeof settings.title !== 'string' || (settings.theme && !['light', 'dark'].includes(settings.theme))) throw new Error('Invalid development title/theme.');
  if (settings.user && (typeof settings.user.id !== 'string' || typeof settings.user.name !== 'string')) throw new Error('Development user requires id and name.');
  return { settings, manifest, fileMap };
}
function createDevSnapshot(kit, local) {
  const { manifest, settings } = kit;
  const artifacts = { ...manifest.artifacts, [local.id]: local };
  const platform = artifacts[manifest.platform];
  if (platform?.service !== 'platform' || !semver.satisfies(platform.version, '>=1.2.0 <2.0.0')) throw new Error('Dev Host requires platform SDK >=1.2.0 <2.0.0.');
  const bindings = { ...manifest.runtimeBindings, [local.id]: manifest.localBindings || {} };
  const visited = new Set(), visiting = new Set();
  const selectedArtifacts = {}, selectedBindings = {};
  function visit(id) {
    if (visiting.has(id)) throw new Error(`Development dependency cycle: ${id}`);
    if (visited.has(id)) return;
    const artifact = artifacts[id];
    if (!artifact) throw new Error(`Development artifact not found: ${id}`);
    if (artifact.service === 'platform' && id !== platform.id) throw new Error('Multiple development SDKs.');
    const requirements = artifact.runtimeRequirements || {};
    if (requirements.platform && !semver.satisfies(platform.version, requirements.platform)) throw new Error(`Incompatible development SDK: ${id}`);
    for (const name of ['react', 'react-dom']) if (requirements[name] && requirements[name] !== platform.runtimeRequirements[name]) throw new Error(`Incompatible development ${name}: ${id}`);
    visiting.add(id);
    for (const dep of Object.values(artifact.dependencies || {})) visit(dep);
    for (const [alias, requirement] of Object.entries(artifact.runtimeDependencies || {})) {
      const target = artifacts[bindings[id]?.[alias]];
      if (!target || target.service !== requirement.service || !semver.satisfies(target.version, requirement.requires)) throw new Error(`Unresolved/incompatible development dependency: ${id}:${alias}`);
      (selectedBindings[id] ||= {})[alias] = target.id;
      visit(target.id);
    }
    visiting.delete(id); visited.add(id); selectedArtifacts[id] = artifact;
  }
  visit(platform.id); visit(local.id);
  for (const name of ['react', 'react-dom']) if (!local.runtimeRequirements?.[name] || local.runtimeRequirements[name] !== platform.runtimeRequirements?.[name]) throw new Error(`UI development requires the SDK's exact ${name} version.`);
  return {
    compositionId: `dev_${local.id}`, platformVersion: platform.version,
    selected: { platform: platform.id }, shell: { id: 'development-host' },
    artifacts: { ...selectedArtifacts, platform }, runtimeBindings: selectedBindings,
    local, dev: settings,
  };
}
module.exports = { readDevKit, createDevSnapshot, safeFile };
