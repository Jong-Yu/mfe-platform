const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const destination = process.argv[2] && path.resolve(process.argv[2]);
if (!destination || fs.existsSync(destination)) throw new Error('Provide a NEW directory: npm run prepare:onboarding -- /absolute/path/new-folder');
const sourceStore = process.env.MFE_ARTIFACT_STORE || path.join(root, 'artifact-store');
if (!fs.existsSync(path.join(sourceStore, 'current.json'))) throw new Error('Prepare the base published composition first.');
const sdkDist = path.join(root, 'projects/platform-sdk/dist');
const sdk = JSON.parse(fs.readFileSync(path.join(sdkDist, 'release.json')));
if (sdk.service !== 'platform' || sdk.version !== '1.3.1') throw new Error('This walkthrough requires the already-built SDK 1.3.1 dist.');
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(sourceStore, path.join(destination, 'store'), { recursive: true });
fs.rmSync(path.join(destination, 'store/usage.json'), { force: true });
process.env.MFE_ARTIFACT_STORE = path.join(destination, 'store');
const store = require('./store.cjs');
const baseline = store.current();
store.publish(path.join(root, 'projects/platform-sdk'));
const starter = path.join(destination, 'starter');
fs.cpSync(path.join(root, 'integration/templates/service-e'), starter, { recursive: true });
fs.mkdirSync(path.join(starter, 'vendor'));
const pack = spawnSync('npm', ['pack', '--ignore-scripts', '--pack-destination', path.join(starter, 'vendor')], {
  cwd: path.join(root, 'projects/platform-build-tools'), env: process.env, encoding: 'utf8',
});
if (pack.status !== 0) throw new Error(pack.stderr || pack.error?.message || 'Build tools packaging failed');
const manifest = { schemaVersion: 1, platform: sdk.id, artifacts: { [sdk.id]: sdk }, runtimeBindings: {}, localBindings: {}, files: { [sdk.id]: {} } };
function copySDK(relative = '') {
  for (const entry of fs.readdirSync(path.join(sdkDist, relative), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('SDK files must not be symlinks');
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) copySDK(name);
    else {
      const bytes = fs.readFileSync(path.join(sdkDist, name));
      manifest.files[sdk.id][name.split(path.sep).join('/')] = crypto.createHash('sha256').update(bytes).digest('hex');
      const target = path.join(starter, 'dev/remotes', sdk.id, name);
      fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
    }
  }
}
copySDK();
fs.writeFileSync(path.join(starter, 'dev/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const lock = spawnSync('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], {
  cwd: starter, env: process.env, encoding: 'utf8',
});
if (lock.status !== 0) throw new Error(lock.stderr || lock.error?.message || 'Starter lock generation failed');
fs.cpSync(path.join(root, 'projects/shell'), path.join(destination, 'shell'), {
  recursive: true, filter: file => !['node_modules', 'dist', '.mfe-dev'].includes(path.basename(file)),
});
fs.writeFileSync(path.join(destination, 'baseline.json'), JSON.stringify({ compositionId: baseline.compositionId, sdk: sdk.id }, null, 2) + '\n');
console.log(`Prepared starter, Shell copy and isolated store at ${destination}. Existing projects and product selection unchanged.`);
