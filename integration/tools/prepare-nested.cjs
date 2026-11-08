const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const integration = path.resolve(__dirname, '..');
const projects = path.resolve(integration, '../projects');
const scenarioSource = path.join(integration, 'scenarios/nested');
const demoRoot = path.join(integration, 'artifacts/nested-demo');
const json = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

function run(args, cwd) {
  const env = { ...process.env };
  delete env.NODE_PATH;
  delete env.npm_config_workspace;
  delete env.npm_config_workspaces;
  const result = spawnSync('npm', args, { cwd, env, stdio: 'inherit', timeout: 180000 });
  if (result.error || result.status !== 0) throw result.error || new Error(`npm ${args.join(' ')} failed in ${cwd}`);
}

function prepareNested(directory) {
  fs.mkdirSync(directory, { recursive: true });
  if (fs.readdirSync(directory).length) throw new Error('Nested scenario output must be an empty directory.');
  const storeDirectory = path.join(directory, 'store');
  // This tool runs in its own process; the production store is never selected.
  process.env.MFE_ARTIFACT_STORE = storeDirectory;
  const { publish, activate } = require('./store.cjs');
  const releases = {};
  for (const name of ['platform-sdk', 'shell', 'service-b-v1', 'service-d-v1', 'service-d-v2']) {
    const source = path.join(projects, name);
    if (!fs.existsSync(path.join(source, 'dist/release.json'))) throw new Error(`Build ${name} before preparing this scenario.`);
    releases[name] = publish(source);
  }
  const builds = [];
  const tooling = path.join(directory, 'tooling');
  fs.mkdirSync(tooling);
  const toolVersion = json(path.join(projects, 'platform-build-tools/package.json')).version;
  const tarball = `mfe-platform-build-tools-${toolVersion}.tgz`;
  run(['pack', '--offline', '--ignore-scripts', '--pack-destination', tooling, '--cache', process.env.NPM_CACHE || '/private/tmp/mfe-npm-cache'], path.join(projects, 'platform-build-tools'));
  for (const [name, template] of [['service-b-v2', null], ['service-c', 'CWidget.jsx'], ['service-a', 'AWidget.jsx']]) {
    const source = path.join(projects, name);
    // No sibling checkout exists inside this independent project's parent.
    const destination = path.join(directory, 'checkouts', name, 'project');
    fs.cpSync(source, destination, { recursive: true, filter: (file) => !path.relative(source, file).split(path.sep)
      .some((part) => ['node_modules', 'dist', 'dev', '.mfe-dev', '.git'].includes(part)) });
    if (template) fs.copyFileSync(path.join(scenarioSource, template), path.join(destination, 'src/index.jsx'));
    fs.copyFileSync(path.join(tooling, tarball), path.join(destination, 'vendor', tarball));
    const dependencies = name === 'service-b-v2' ? json(path.join(destination, 'mf.dependencies.json'))
      : { b: { mode: 'runtime', service: 'b', requires: name === 'service-a' ? '>=1.4.0 <2.0.0' : '>=2.1.0 <3.0.0' } };
    if (name === 'service-a') {
      dependencies.c = { mode: 'runtime', service: 'c', requires: '>=1.1.0 <2.0.0' };
      fs.copyFileSync(path.join(scenarioSource, 'Nested.module.css'), path.join(destination, 'src/Nested.module.css'));
      dependencies.platform = { mode: 'runtime', service: 'platform', requires: '>=1.3.0 <2.0.0' };
      fs.copyFileSync(path.join(scenarioSource, 'RemoteRegionProbe.jsx'), path.join(destination, 'src/RemoteRegionProbe.jsx'));
      const configFile = path.join(destination, 'mf.config.cjs');
      const config = require(configFile);
      config.exposes['./RemoteRegionProbe'] = './src/RemoteRegionProbe.jsx';
      fs.writeFileSync(configFile, `module.exports = ${JSON.stringify(config, null, 2)};\n`);
    }
    save(path.join(destination, 'mf.dependencies.json'), dependencies);
    for (const filename of ['package.json', 'package-lock.json']) {
      const value = json(path.join(destination, filename));
      if (name !== 'service-b-v2') value.version = '1.1.0';
      if (filename === 'package.json') value.devDependencies['@mfe/platform-build-tools'] = `file:vendor/${tarball}`;
      if (value.packages?.['']) value.packages[''].version = value.version;
      save(path.join(destination, filename), value);
    }
    run(['install', '--package-lock-only', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', process.env.NPM_CACHE || '/private/tmp/mfe-npm-cache'], destination);
    run(['ci', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', process.env.NPM_CACHE || '/private/tmp/mfe-npm-cache'], destination);
    run(['run', 'build'], destination);
    releases[name] = publish(destination);
    builds.push({ project: name, version: releases[name].version, directory: destination, artifactId: releases[name].id });
  }
  for (const [name, expected] of [['service-b-v1', '1.4.0'], ['service-b-v2', '2.1.0']]) {
    if (releases[name].version !== expected) throw new Error(`${name} must provide ${expected} for this exact scenario.`);
  }
  const id = (name) => releases[name].id;
  const composition = activate({ platform: id('platform-sdk'), shell: id('shell'), A: id('service-a'), C: id('service-c') }, {
    [id('service-a')]: { b: id('service-b-v1'), c: id('service-c') },
    [id('service-c')]: { b: id('service-b-v2') },
    [id('service-b-v1')]: { d: id('service-d-v1') },
    [id('service-b-v2')]: { d: id('service-d-v2') },
  });
  const scenario = { directory, storeDirectory, toolVersion, builds, releases, composition };
  save(path.join(directory, 'scenario.json'), scenario);
  return scenario;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 2 && args[0] === '--output')) throw new Error('Usage: prepare-nested.cjs [--output EMPTY_DIRECTORY]');
  fs.mkdirSync(demoRoot, { recursive: true });
  const directory = args.length ? path.resolve(args[1]) : fs.mkdtempSync(path.join(demoRoot, 'run-'));
  const scenario = prepareNested(directory);
  if (!args.length) save(path.join(demoRoot, 'latest.json'), { directory });
  console.log(`Nested A → B 1.4 / C 1.1 → B 2.1 prepared: ${scenario.composition.compositionId}`);
  console.log(`Scenario: ${path.join(directory, 'scenario.json')}`);
}

module.exports = { prepareNested, demoRoot };
