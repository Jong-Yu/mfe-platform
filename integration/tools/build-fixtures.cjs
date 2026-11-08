const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { publish, activate, read } = require('./store.cjs');
const fixtures = require('../fixtures.json');
const bootstrap = process.argv.includes('--bootstrap');
const projectsRoot = path.resolve(__dirname, '../../projects');
const built = {};
const previous = read('registry.json', {});
const bindings = {};

for (const fixture of fixtures) {
  const project = path.join(projectsRoot, fixture.project);
  if (bootstrap) {
    // This explicit first-time setup selects releases. Ordinary builds never rewrite these pins.
    const dependencies = Object.fromEntries(Object.entries(fixture.dependencies).map(([alias, dependencyProject]) => [alias, alias === 'platform'
      ? { mode: 'runtime', service: 'platform', requires: fixture.project === 'shell' ? '>=1.3.0 <2.0.0' : '>=1.0.0 <2.0.0' }
      : fixture.runtime?.[alias]
        ? { mode: 'runtime', service: built[dependencyProject].service, requires: fixture.runtime[alias] }
        : built[dependencyProject]]));
    fs.writeFileSync(path.join(project, 'mf.dependencies.json'), JSON.stringify(dependencies, null, 2) + '\n');
  }
  const result = spawnSync('npm', ['run', 'build'], { cwd: project, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
  built[fixture.project] = publish(project);
  const release = built[fixture.project];
  for (const alias of Object.keys(release.runtimeDependencies || {})) {
    const oldOwner = previous.applications?.[release.service.toUpperCase()]?.id;
    const retained = !bootstrap && (previous.runtimeBindings?.[release.id]?.[alias] || previous.runtimeBindings?.[oldOwner]?.[alias]);
    (bindings[release.id] ||= {})[alias] = retained || built[fixture.dependencies[alias]].id;
  }
}

const platform = (!bootstrap && read('selected.json', {}).platform) || built['platform-sdk'].id;
const selected = { platform, shell: built.shell.id, A: built['service-a'].id, C: built['service-c'].id };
// Newly built B releases may not be selected by A/C. Submit bindings only for
// reachable owners, retaining the selected B's own D binding from the snapshot.
const candidates = { ...previous.runtimeBindings, ...bindings };
const catalog = read('catalog.json', {});
const reachable = {};
const visited = new Set();
function visit(id) {
  if (visited.has(id)) return;
  visited.add(id);
  const artifact = catalog[id];
  if (!artifact) throw new Error(`Unpublished fixture dependency: ${id}`);
  for (const dep of Object.values(artifact.dependencies)) visit(dep);
  for (const alias of Object.keys(artifact.runtimeDependencies || {})) {
    const target = candidates[id]?.[alias];
    if (!target) throw new Error(`Missing fixture binding: ${id}:${alias}`);
    (reachable[id] ||= {})[alias] = target;
    visit(target);
  }
}
Object.values(selected).forEach(visit);
activate(selected, reachable);
console.log(bootstrap ? 'Initial dependency selections and local artifact store prepared.' : 'Published independent builds. Existing consumer dependency selections were preserved.');
