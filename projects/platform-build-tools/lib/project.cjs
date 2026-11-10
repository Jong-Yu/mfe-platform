const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const semver = require('semver');
const toolPackage = require('../package.json');
const { validateWidgets } = require('./widgets.cjs');

function inside(directory, file) {
  const relative = path.relative(directory, file);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function readJson(filename) {
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read ${filename}: ${error.message}`);
  }
}

function semanticVersion(version) {
  if (typeof version !== 'string') return false;
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(version);
  return Boolean(match) && (!match[4] || match[4].split('.').every((part) => !/^\d+$/.test(part) || part === '0' || !part.startsWith('0')));
}

function sourceFiles(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Source symlinks are not supported: ${filename}`);
    if (entry.isDirectory()) result.push(...sourceFiles(filename));
    else if (entry.isFile()) result.push(filename);
    else throw new Error(`Unsupported source file: ${filename}`);
  }
  return result;
}

function sourcePath(root, src, request, label) {
  if (typeof request !== 'string' || !request || request.includes('!') || request.includes('?') || request.includes('#')) {
    throw new Error(`${label} must be a file path inside this project's src directory.`);
  }
  const filename = path.resolve(root, request);
  if (!inside(src, filename) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    throw new Error(`${label} must resolve to a file inside ${src}.`);
  }
  if (!inside(src, fs.realpathSync(filename))) throw new Error(`${label} points outside this project's src directory.`);
  return filename;
}

function readProject(root = process.cwd()) {
  root = fs.realpathSync(root);
  const packageFile = path.join(root, 'package.json');
  const lockFile = path.join(root, 'package-lock.json');
  const configFile = path.join(root, 'mf.config.cjs');
  const dependenciesFile = path.join(root, 'mf.dependencies.json');
  for (const file of [packageFile, lockFile, configFile, dependenciesFile]) {
    if (!fs.existsSync(file)) throw new Error(`Missing ${path.basename(file)} in ${root}. Run npm install and provide the MF configuration.`);
    if (!inside(root, fs.realpathSync(file))) throw new Error(`Project input points outside this project: ${file}`);
  }
  const pkg = readJson(packageFile);
  if (!semanticVersion(pkg.version)) throw new Error('package.json version must be a valid semantic version.');
  delete require.cache[require.resolve(configFile)];
  const config = require(configFile);
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('mf.config.cjs must export a configuration object.');
  if (typeof config.service !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(config.service)) throw new Error('config.service must be a simple service identifier.');
  if (!['remote', 'shell'].includes(config.kind)) throw new Error('config.kind must be remote or shell.');
  if (config.port !== undefined && (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)) throw new Error('config.port must be an integer between 1 and 65535.');
  const src = path.join(root, 'src');
  if (!fs.existsSync(src) || !fs.statSync(src).isDirectory() || fs.lstatSync(src).isSymbolicLink()) throw new Error('This project must have its own src directory.');
  const files = sourceFiles(src);
  const exposes = {};
  if (config.exposes !== undefined && (!config.exposes || typeof config.exposes !== 'object' || Array.isArray(config.exposes))) throw new Error('config.exposes must be an object.');
  for (const [key, request] of Object.entries(config.exposes || {})) {
    if (key === './__mfe_retry__') throw new Error('./__mfe_retry__ is reserved for the platform retry protocol.');
    if (!(key === '.' || key.startsWith('./'))) throw new Error(`Invalid exposed module key: ${key}`);
    exposes[key] = sourcePath(root, src, request, `exposes[${JSON.stringify(key)}]`);
  }
  if (config.kind === 'remote' && Object.keys(exposes).length === 0) throw new Error('A remote must expose at least one module.');
  const entryFile = config.entry === undefined ? undefined : sourcePath(root, src, config.entry, 'entry');
  const htmlFile = config.html === undefined ? undefined : sourcePath(root, src, config.html, 'html');
  if (config.kind === 'shell' && (!entryFile || !htmlFile)) throw new Error('A shell requires entry and html files inside src.');
  if (config.kind === 'shell' && !fs.readFileSync(htmlFile, 'utf8').includes('__SHELL_SCRIPT__')) throw new Error('Shell HTML must contain the __SHELL_SCRIPT__ placeholder.');
  const remoteArtifacts = readJson(dependenciesFile);
  if (!remoteArtifacts || typeof remoteArtifacts !== 'object' || Array.isArray(remoteArtifacts)) throw new Error('mf.dependencies.json must be an alias-to-artifact object.');
  const dependencies = {};
  const runtimeRequirements = {};
  const runtimeDependencies = {};
  const remotes = {};
  for (const [alias, artifact] of Object.entries(remoteArtifacts)) {
    if (!/^[A-Za-z][A-Za-z0-9_/-]*$/.test(alias)) throw new Error(`Invalid remote alias: ${alias}`);
    if (artifact?.mode === 'runtime') {
      if (typeof artifact.service !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(artifact.service)) throw new Error(`Invalid runtime service: ${alias}`);
      if (typeof artifact.requires !== 'string' || !artifact.requires.trim() || !semver.validRange(artifact.requires)) throw new Error(`Runtime dependency ${alias} requires a valid version range.`);
      if (['id', 'name', 'entry'].some((key) => Object.prototype.hasOwnProperty.call(artifact, key))) throw new Error('A runtime requirement must not pin an artifact id, name, or entry.');
      if (alias === 'platform' || artifact.service === 'platform') {
        if (alias !== 'platform' || artifact.service !== 'platform') throw new Error('The platform SDK must use the platform alias.');
        runtimeRequirements.platform = artifact.requires;
        remotes.platform = true;
      } else {
        runtimeDependencies[alias] = { service: artifact.service, requires: artifact.requires };
      }
      continue;
    }
    if (alias === 'platform' || artifact?.service === 'platform') throw new Error('Platform SDK dependencies must use mode: runtime and declare a supported SDK version range.');
    if (!artifact || typeof artifact !== 'object' || typeof artifact.id !== 'string' || !/^[A-Za-z0-9_.+-]+$/.test(artifact.id)) throw new Error(`Invalid artifact id for remote ${alias}.`);
    if (typeof artifact.name !== 'string' || !/^[$A-Z_a-z][$\w]*$/.test(artifact.name)) throw new Error(`Remote ${alias} needs its real container name.`);
    if (typeof artifact.entry !== 'string' || !/^(?:\/(?!\/)|https?:\/\/)/.test(artifact.entry)) throw new Error(`Remote ${alias} entry must be an absolute URL or root-relative path.`);
    if (typeof artifact.service !== 'string' || !artifact.service || !semanticVersion(artifact.version)) throw new Error(`Remote ${alias} needs a service and semantic version.`);
    if (!artifact.dependencies || typeof artifact.dependencies !== 'object' || Array.isArray(artifact.dependencies) || Object.values(artifact.dependencies).some((id) => typeof id !== 'string')) throw new Error(`Remote ${alias} needs a dependencies object.`);
    dependencies[alias] = artifact.id;
    remotes[alias] = true;
  }
  const hash = crypto.createHash('sha256');
  function hashPart(label, bytes) {
    hash.update(`${Buffer.byteLength(label)}:${label}:${bytes.length}:`);
    hash.update(bytes);
  }
  hashPart('platform-build-tools-version', Buffer.from(toolPackage.version));
  for (const filename of [packageFile, lockFile, configFile, dependenciesFile, ...files]) {
    hashPart(path.relative(root, filename).split(path.sep).join('/'), fs.readFileSync(filename));
  }
  const id = `${config.service}_${pkg.version.replaceAll('.', '_')}_${hash.digest('hex').slice(0, 12)}`;
  const name = `mf_${id.replace(/[^A-Za-z0-9_$]/g, '_')}`;
  for (const alias of Object.keys(runtimeDependencies)) remotes[alias] = true;
  const release = {
    id,
    name,
    service: config.service,
    version: pkg.version,
    entry: `/artifacts/${id}/${config.kind === 'shell' ? 'shell.js' : 'remoteEntry.js'}`,
    dependencies,
    runtimeRequirements,
    runtimeDependencies,
    kind: config.kind,
    format: 'esm',
    federation: 'vite',
    retryProtocol: 'vite-preflight-v1',
    exposedModules: Object.keys(exposes).sort(),
  };
  if (config.navigationProtocol !== undefined) {
    if (config.kind !== 'shell' || config.navigationProtocol !== 'registered-menu-v1') throw new Error('Unsupported Shell navigation protocol');
    release.navigationProtocol = config.navigationProtocol;
  }
  validateWidgets(config.widgets, release);
  if (config.widgets !== undefined) release.widgets = config.widgets;
  if (config.dashboardProtocol !== undefined) {
    if (config.kind !== 'shell' || config.dashboardProtocol !== 'registered-dashboard-v1') throw new Error('Unsupported Shell dashboard protocol');
    release.dashboardProtocol = config.dashboardProtocol;
  }
  return { root, src, pkg, config, exposes, entryFile, htmlFile, remotes, remoteDescriptors: remoteArtifacts, release, dist: path.join(root, 'dist') };
}

module.exports = { inside, readJson, readProject };
