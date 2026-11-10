const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Update only the active projects. The examples are frozen deployment snapshots.
const args = new Set(process.argv.slice(2));
for (const arg of args) {
  if (!['--install', '--offline'].includes(arg)) throw new Error('Usage: update-build-tools.cjs [--install] [--offline]');
}
const projects = path.resolve(__dirname, '../../projects');
const tooling = path.join(projects, 'platform-build-tools');
const json = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const toolPackage = json(path.join(tooling, 'package.json'));
const packageName = toolPackage.name;
const cache = process.env.MFE_NPM_CACHE || process.env.NPM_CACHE;
const common = [
  '--ignore-scripts',
  ...(args.has('--offline') || process.env.MFE_OFFLINE === '1' ? ['--offline'] : []),
  ...(cache ? ['--cache', cache] : []),
];
function npm(command, cwd, capture = false) {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', command, {
    cwd,
    env: process.env,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.error || result.status !== 0) throw result.error || new Error(result.stderr || `npm ${command.join(' ')} failed in ${cwd}`);
  return result.stdout;
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'mfe-build-tools-package-'));
try {
  const [packed] = JSON.parse(npm(['pack', '--json', '--pack-destination', temporary, ...common], tooling, true));
  if (!packed?.filename || path.basename(packed.filename) !== packed.filename) throw new Error('npm pack returned an invalid package filename.');
  for (const entry of fs.readdirSync(projects, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name === 'platform-build-tools') continue;
    const directory = path.join(projects, entry.name);
    const packageFile = path.join(directory, 'package.json');
    if (!fs.existsSync(packageFile)) continue;
    const pkg = json(packageFile);
    const dependencyGroup = ['devDependencies', 'dependencies'].find((group) => Object.hasOwn(pkg[group] || {}, packageName));
    if (!dependencyGroup) continue;
    fs.mkdirSync(path.join(directory, 'vendor'), { recursive: true });
    fs.copyFileSync(path.join(temporary, packed.filename), path.join(directory, 'vendor', packed.filename));
    pkg[dependencyGroup][packageName] = `file:vendor/${packed.filename}`;
    pkg.engines = { ...pkg.engines, node: toolPackage.engines.node };
    save(packageFile, pkg);
    const lockFile = path.join(directory, 'package-lock.json');
    if (fs.existsSync(lockFile)) {
      const lock = json(lockFile);
      // Re-read the local tarball even if a development run repacks the same
      // tool version; retaining its previous integrity would install stale code.
      if (lock.packages) delete lock.packages[`node_modules/${packageName}`];
      if (lock.dependencies) delete lock.dependencies[packageName];
      save(lockFile, lock);
    }
    npm(['install', '--package-lock-only', '--no-audit', '--no-fund', ...common], directory);
    if (args.has('--install')) npm(['ci', '--no-audit', '--no-fund', ...common], directory);
    console.log(`Updated ${entry.name} to ${packageName}@${toolPackage.version}`);
  }
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
