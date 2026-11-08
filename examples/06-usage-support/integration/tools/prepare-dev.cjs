const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const semver = require('semver');
const { current, read, store } = require('./store.cjs');
const repository = path.resolve(__dirname, '../..');
const composition = current();
if (!composition) throw new Error('Prepare a published composition first.');
const catalog = read('catalog.json', {});
const platform = process.argv[2] || composition.selected.platform;
if (!catalog[platform] || !semver.satisfies(catalog[platform].version, '>=1.2.0 <2.0.0') || catalog[platform].service !== 'platform') throw new Error('Choose a published SDK >=1.2.0 <2.0.0: npm run prepare:dev -- SDK_ARTIFACT_ID');
const bFor = role => composition.runtimeBindings[composition.selected[role]].b;
const targets = [
  ['service-a', { b: bFor('A') }], ['service-c', { b: bFor('C') }],
  ['service-b-v1', { d: composition.runtimeBindings[bFor('A')].d }],
  ['service-b-v2', { d: composition.runtimeBindings[bFor('C')].d }],
];
for (const [name, localBindings] of targets) {
  const project = path.join(repository, 'projects', name);
  const destination = path.join(project, 'dev');
  if (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink()) throw new Error('Refusing symlinked dev kit.');
  const manifest = { schemaVersion: 1, platform, artifacts: {}, runtimeBindings: {}, localBindings, files: {} };
  function collect(id) {
    if (manifest.artifacts[id]) return;
    const artifact = catalog[id];
    if (!artifact || artifact.kind !== 'remote') throw new Error(`Missing published remote: ${id}`);
    const state = read('lifecycle.json', { releases: {} }).releases[id];
    if (state?.registrationState && state.registrationState !== 'registered' || state?.accessRevokedAt) throw new Error(`Unavailable development release: ${id}`);
    manifest.artifacts[id] = artifact;
    for (const dep of Object.values(artifact.dependencies || {})) collect(dep);
    for (const alias of Object.keys(artifact.runtimeDependencies || {})) {
      const target = composition.runtimeBindings[id]?.[alias];
      if (!target) throw new Error(`Missing published runtime binding: ${id}:${alias}`);
      (manifest.runtimeBindings[id] ||= {})[alias] = target; collect(target);
    }
  }
  collect(platform); Object.values(localBindings).forEach(collect);
  // Immutable assets are copied first; a single manifest rename publishes the kit.
  // Old asset folders are retained so a running development tab can finish loading.
  for (const id of Object.keys(manifest.artifacts)) {
    const source = path.join(store, 'artifacts', id), target = path.join(destination, 'remotes', id);
    const hashes = {};
    function copy(relative='') {
      for (const item of fs.readdirSync(path.join(source, relative), { withFileTypes: true })) {
        if (item.isSymbolicLink()) throw new Error('Published artifact must not contain symlinks.');
        const file = path.join(relative, item.name);
        if (item.isDirectory()) copy(file);
        else if (item.isFile()) {
          const bytes = fs.readFileSync(path.join(source, file));
          hashes[file.split(path.sep).join('/')] = crypto.createHash('sha256').update(bytes).digest('hex');
          const output = path.join(target, file);
          fs.mkdirSync(path.dirname(output), { recursive: true });
          if (fs.existsSync(output) && !fs.readFileSync(output).equals(bytes)) throw new Error(`Immutable development bytes changed: ${id}/${file}`);
          if (!fs.existsSync(output)) fs.writeFileSync(output, bytes);
        }
      }
    }
    copy(); manifest.files[id] = hashes;
  }
  const staging = path.join(destination, `manifest.${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(staging, JSON.stringify(manifest, null, 2)+'\n');
  fs.renameSync(staging, path.join(destination, 'manifest.json'));
  console.log(`Prepared ${name}: SDK ${catalog[platform].version}, ${Object.keys(manifest.artifacts).length} MF artifacts. No service build or production selection change.`);
}
