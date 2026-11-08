const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const semver = require('semver');
const { validateNavigation, aliasFor } = require('./navigation.cjs');
const { validateDashboard, aliasFor: dashboardAlias } = require('./dashboard.cjs');
const { validateWidgets } = require('../../projects/platform-build-tools/lib/widgets.cjs');

const store = path.resolve(process.env.MFE_ARTIFACT_STORE || path.join(__dirname, '../../artifact-store'));
const validId = (id) => typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.+-]*$/.test(id);
function diskRead(name, fallback) {
  const file = path.join(store, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}
function current() {
  const pointer = diskRead('current.json', null);
  if (!pointer) return null;
  if (!validId(pointer.compositionId)) throw new Error('Invalid composition pointer');
  return diskRead(`compositions/${pointer.compositionId}.json`, null);
}
function read(name, fallback) {
  if (name === 'registry.json') return current() || fallback;
  if (name === 'selected.json') return current()?.selected || fallback;
  return diskRead(name, fallback);
}
function write(name, value) {
  const file = path.join(store, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n');
    fs.renameSync(temp, file);
  } finally { fs.rmSync(temp, { force: true }); }
}
function withLock(action) {
  fs.mkdirSync(store, { recursive: true });
  const filename = path.join(store, '.write-lock');
  let descriptor;
  try { descriptor = fs.openSync(filename, 'wx'); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('Another publish or activation is running; retry after it finishes.'); throw error; }
  try { return action(); }
  finally { fs.closeSync(descriptor); fs.unlinkSync(filename); }
}
function treeHash(directory) {
  const hash = crypto.createHash('sha256');
  function visit(relative) {
    for (const item of fs.readdirSync(path.join(directory, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = path.join(relative, item.name);
      if (item.isSymbolicLink()) throw new Error('Artifact symlinks are not supported');
      if (item.isDirectory()) visit(name);
      else if (item.isFile()) hash.update(name).update('\0').update(fs.readFileSync(path.join(directory, name))).update('\0');
    }
  }
  visit('');
  return hash.digest('hex');
}
function validateArtifact(artifact) {
  if (!validId(artifact.id)) throw new Error('Invalid artifact id');
  validateWidgets(artifact.widgets, artifact);
  if (artifact.dashboardProtocol !== undefined && (artifact.kind !== 'shell' || artifact.dashboardProtocol !== 'registered-dashboard-v1')) throw new Error('Invalid dashboard protocol');
  if (artifact.exposedModules !== undefined && (!Array.isArray(artifact.exposedModules) || artifact.exposedModules.some(name => typeof name !== 'string' || !/^\.\/[A-Za-z][A-Za-z0-9_/-]{0,79}$/.test(name)))) throw new Error('Invalid exposed modules');
  if (artifact.navigationProtocol !== undefined && (artifact.kind !== 'shell' || artifact.navigationProtocol !== 'registered-menu-v1')) throw new Error('Invalid navigation protocol');
  if (!semver.valid(artifact.version) || !['remote', 'shell'].includes(artifact.kind)) throw new Error('Invalid release version or kind');
  if (!artifact.dependencies || Object.values(artifact.dependencies).some((id) => !validId(id))) throw new Error('Invalid dependencies');
  for (const [name, range] of Object.entries(artifact.runtimeRequirements || {})) {
    if (!['platform', 'react', 'react-dom'].includes(name) || typeof range !== 'string' || !semver.validRange(range)) throw new Error(`Invalid runtime requirement: ${name}`);
  }
  const runtimeDependencies = artifact.runtimeDependencies || {};
  if (typeof runtimeDependencies !== 'object' || Array.isArray(runtimeDependencies)) throw new Error('Invalid runtime dependencies');
  for (const [alias, requirement] of Object.entries(runtimeDependencies)) {
    if (!/^[A-Za-z][A-Za-z0-9_/-]*$/.test(alias) || alias === 'platform' || Object.hasOwn(artifact.dependencies, alias)) throw new Error(`Invalid runtime alias: ${alias}`);
    if (!requirement || typeof requirement.service !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(requirement.service) || requirement.service === 'platform' || typeof requirement.requires !== 'string' || !semver.validRange(requirement.requires)) throw new Error(`Invalid runtime dependency: ${alias}`);
  }
}
function publish(project) {
  return withLock(() => {
    const directory = path.join(path.resolve(project), 'dist');
    const artifact = JSON.parse(fs.readFileSync(path.join(directory, 'release.json'), 'utf8'));
    validateArtifact(artifact);
    const catalog = diskRead('catalog.json', {});
    const registration = diskRead('lifecycle.json', { releases: {} }).releases[artifact.id]?.registrationState;
    if (registration && registration !== 'registered') throw new Error('등록 해제된 배포 ID는 재발행할 수 없습니다. 새 배포 ID를 사용해 주세요.');
    if (catalog[artifact.id] && JSON.stringify(catalog[artifact.id]) !== JSON.stringify(artifact)) throw new Error('Immutable release metadata changed');
    const target = path.join(store, 'artifacts', artifact.id);
    if (fs.existsSync(target)) {
      if (treeHash(target) !== treeHash(directory)) throw new Error(`Immutable artifact bytes changed: ${artifact.id}`);
    } else {
      const staging = path.join(store, 'artifacts', `.staging-${crypto.randomUUID()}`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      try { fs.cpSync(directory, staging, { recursive: true }); treeHash(staging); fs.renameSync(staging, target); }
      finally { fs.rmSync(staging, { recursive: true, force: true }); }
    }
    catalog[artifact.id] = artifact;
    write('catalog.json', catalog);
    return artifact;
  });
}
function validateSelection(selected, catalog, bindings, menuInput = [], dashboardInput) {
  for (const key of Object.keys(selected)) if (!['platform', 'shell', 'A', 'C'].includes(key)) throw new Error(`Unknown selection: ${key}`);
  const requireArtifact = (id) => {
    if (!validId(id) || !catalog[id] || !fs.existsSync(path.join(store, 'artifacts', id, 'release.json'))) throw new Error(`Artifact is not published: ${id}`);
    validateArtifact(catalog[id]);
    return catalog[id];
  };
  for (const role of ['platform', 'shell', 'A', 'C']) if (!selected[role]) throw new Error(`Select ${role} before activating`);
  const platform = requireArtifact(selected.platform);
  const shell = requireArtifact(selected.shell);
  const applications = { A: requireArtifact(selected.A), C: requireArtifact(selected.C) };
  if (platform.service !== 'platform' || platform.kind !== 'remote') throw new Error('platform must select an SDK remote');
  if (platform.runtimeRequirements?.platform) throw new Error('The platform SDK cannot require itself');
  if (shell.kind !== 'shell') throw new Error('shell must select a Shell build');
  if (Object.values(applications).some((app) => app.kind !== 'remote')) throw new Error('Applications must select remotes');
  const navigation = validateNavigation(menuInput, shell, requireArtifact);
  const dashboard = validateDashboard(dashboardInput, shell, requireArtifact);
  const visited = new Map();
  const visiting = new Set();
  const resolvedBindings = {};
  function visit(id) {
    if (visiting.has(id)) throw new Error(`Dependency cycle: ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    const artifact = requireArtifact(id);
    for (const dep of Object.values(artifact.dependencies)) {
      const target = requireArtifact(dep);
      if (target.kind !== 'remote') throw new Error(`Pinned dependency must select a remote: ${artifact.id}`);
      if (target.service === 'platform') throw new Error(`Pinned platform dependency must migrate to runtime selection: ${artifact.id}`);
      visit(dep);
    }
    for (const [alias, requirement] of Object.entries(artifact.runtimeDependencies || {}).sort(([a], [b]) => a.localeCompare(b))) {
      const targetId = bindings[id]?.[alias];
      if (!targetId) throw new Error(`Missing runtime binding: ${id}:${alias}`);
      const target = requireArtifact(targetId);
      if (target.kind !== 'remote' || target.service !== requirement.service) throw new Error(`Wrong runtime service: ${id}:${alias} requires ${requirement.service}`);
      if (!semver.satisfies(target.version, requirement.requires)) throw new Error(`Incompatible runtime dependency: ${id}:${alias} requires ${requirement.requires}, selected ${target.version}`);
      (resolvedBindings[id] ||= {})[alias] = targetId;
      visit(targetId);
    }
    visiting.delete(id);
    visited.set(id, artifact);
  }
  visit(platform.id); visit(shell.id); visit(applications.A.id); visit(applications.C.id);
  for (const menu of navigation) {
    visit(menu.artifactId);
    (resolvedBindings[shell.id] ||= {})[aliasFor(menu.id)] = menu.artifactId;
  }
  for (const item of dashboard || []) {
    visit(item.artifactId);
    (resolvedBindings[shell.id] ||= {})[dashboardAlias(item.id)] = item.artifactId;
  }
  for (const name of ['react', 'react-dom']) {
    if (!semver.valid(platform.runtimeRequirements?.[name])) throw new Error(`Selected SDK must declare an exact ${name} runtime version`);
  }
  for (const artifact of visited.values()) {
    const requirements = artifact.runtimeRequirements || {};
    if (artifact.service === 'platform' && artifact.id !== platform.id) throw new Error('Multiple platform SDKs in one composition');
    if (requirements.platform && !semver.satisfies(platform.version, requirements.platform)) {
      throw new Error(`Incompatible platform SDK: ${artifact.id} requires ${requirements.platform}, selected ${platform.version}`);
    }
    for (const name of ['react', 'react-dom']) {
      if (requirements[name] && (!semver.valid(requirements[name]) || requirements[name] !== platform.runtimeRequirements[name])) {
        throw new Error(`Incompatible ${name}: ${artifact.id} requires ${requirements[name]}, SDK requires ${platform.runtimeRequirements[name]}`);
      }
    }
  }
  if (!shell.runtimeRequirements?.platform) throw new Error('Shell must declare its runtime platform requirement');
  // The Shell is a host entry, not one of the seven remote containers in artifacts.
  visited.delete(shell.id);
  const runtimeBindings = Object.fromEntries(Object.entries(resolvedBindings).sort(([a], [b]) => a.localeCompare(b)));
  return { platformVersion: platform.version, shell, applications, artifacts: { ...Object.fromEntries(visited), platform }, selected, runtimeBindings,
    ...(navigation.length ? { navigation } : {}), ...(dashboard !== undefined ? { dashboard } : {}) };
}
function resolveComposition(changes = {}, bindingChanges = {}, { replaceBindings = false, navigation: menuInput, dashboard: dashboardInput } = {}, previous = current()) {
  const merged = { ...(previous?.selected || {}), ...changes };
  for (const key of Object.keys(merged)) if (!['platform', 'shell', 'A', 'C'].includes(key)) throw new Error(`Unknown selection: ${key}`);
  const selected = Object.fromEntries(['platform', 'shell', 'A', 'C'].map((role) => [role, merged[role]]));
  const catalog = diskRead('catalog.json', {});
  const navigation = menuInput === undefined ? previous?.navigation || [] : menuInput;
  const dashboard = dashboardInput === undefined ? previous?.dashboard : dashboardInput === null ? undefined : dashboardInput;
  // Only matching server-derived menu edges may appear in a stored snapshot.
  // Arbitrary undeclared consumer aliases remain forbidden.
  const menuTargets = new Map(Array.isArray(navigation) ? navigation.map(item => [aliasFor(item?.id), item?.artifactId]) : []);
  const dashboardTargets = new Map(Array.isArray(dashboard) ? dashboard.map(item => [dashboardAlias(item?.id), item?.artifactId]) : []);
  const bindings = replaceBindings ? {} : { ...(previous?.runtimeBindings || {}) };
  if (!bindingChanges || typeof bindingChanges !== 'object' || Array.isArray(bindingChanges)) throw new Error('Invalid binding changes');
  for (const [owner, aliases] of Object.entries(bindingChanges)) {
    if (!validId(owner) || !catalog[owner] || !aliases || typeof aliases !== 'object' || Array.isArray(aliases)) throw new Error(`Invalid binding owner: ${owner}`);
    for (const [alias, target] of Object.entries(aliases)) {
      const menuEdge = owner === selected.shell && (menuTargets.get(alias) === target || dashboardTargets.get(alias) === target);
      if ((!Object.hasOwn(catalog[owner].runtimeDependencies || {}, alias) && !menuEdge) || !validId(target)) throw new Error(`Undeclared runtime binding: ${owner}:${alias}`);
    }
    bindings[owner] = { ...bindings[owner], ...aliases };
  }
  const registry = validateSelection(selected, catalog, bindings, navigation, dashboard);
  for (const owner of Object.keys(bindingChanges)) {
    if (!Object.hasOwn(registry.runtimeBindings, owner)) throw new Error(`Binding owner is not in the selected composition: ${owner}`);
  }
  const compositionId = `composition_${crypto.createHash('sha256').update(JSON.stringify(registry)).digest('hex').slice(0, 24)}`;
  const composition = { compositionId, ...registry };
  if (diskRead('composition-retirement.json', {})[compositionId]?.retiredAt) throw new Error('롤백 보관이 해제된 조합은 다시 선택할 수 없습니다.');
  require('./lifecycle.cjs').assertSelectable(composition, previous);
  return composition;
}
function assertExpected(previous, expectedCompositionId) {
  if (expectedCompositionId !== undefined && previous?.compositionId !== expectedCompositionId) {
    const error = new Error('The active composition changed. Refresh before applying your selection.');
    error.code = 'STALE_COMPOSITION';
    throw error;
  }
}
function preview(changes = {}, bindingChanges = {}, options = {}) {
  return withLock(() => {
    const previous = current();
    assertExpected(previous, options.expectedCompositionId);
    return resolveComposition(changes, bindingChanges, options, previous);
  });
}
function activate(changes = {}, bindingChanges = {}, options = {}) {
  return withLock(() => {
    const previous = current();
    assertExpected(previous, options.expectedCompositionId);
    const composition = resolveComposition(changes, bindingChanges, options, previous);
    const { compositionId } = composition;
    if (options.expectedTargetId !== undefined && options.expectedTargetId !== compositionId) {
      throw new Error('The requested composition differs from the reviewed preview.');
    }
    persistComposition(composition, 'public');
    // This single atomic pointer makes both HTML and registry refer to one prepared snapshot.
    write('current.json', { compositionId });
    return composition;
  });
}
// Caller holds the same writer lock as subscription updates and deletion.
function persistComposition(composition, origin = 'subscription') {
  const { compositionId, selected } = composition;
  const file = `compositions/${compositionId}.json`;
  const existing = diskRead(file, null);
  if (existing && JSON.stringify(existing) !== JSON.stringify(composition)) throw new Error('Immutable composition changed');
  if (!existing) write(file, composition);
  const sourceHtml = fs.readFileSync(path.join(store, 'artifacts', selected.shell, 'index.html'), 'utf8');
  const bootScript = `<script>window.__MFE_BOOT_URL__=${JSON.stringify(`/${file}`)};</script>`;
  if (!sourceHtml.includes('</head>')) throw new Error('Shell HTML needs a head element');
  const html = sourceHtml.replace('</head>', `${bootScript}</head>`);
  const htmlPath = path.join(store, 'compositions', `${compositionId}.html`);
  if (!fs.existsSync(htmlPath)) fs.writeFileSync(htmlPath, html);
  else if (fs.readFileSync(htmlPath, 'utf8') !== html) throw new Error('Immutable composition HTML changed');
  const origins = diskRead('composition-origins.json', {});
  if (!existing || origin === 'public') {
    origins[compositionId] = origin;
    writeMetadata('composition-origins.json', origins);
  }
  return composition;
}
function rollback(compositionId, options = {}) {
  if (!validId(compositionId)) throw new Error('Invalid composition id');
  const composition = diskRead(`compositions/${compositionId}.json`, null);
  if (!composition) throw new Error(`Unknown composition: ${compositionId}`);
  return activate(composition.selected, composition.runtimeBindings || {}, { ...options, replaceBindings: true, navigation: composition.navigation || [], dashboard: composition.dashboard ?? null });
}
function compositions() {
  const directory = path.join(store, 'compositions');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => /^composition_[a-f0-9]+\.json$/.test(name)).map((name) => ({
    composition: diskRead(`compositions/${name}`),
    createdAt: fs.statSync(path.join(directory, name)).mtime.toISOString(),
  })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
function selectAdmin(artifactId) {
  return withLock(() => {
    const artifact = diskRead('catalog.json', {})[artifactId];
    if (!validId(artifactId) || artifact?.service !== 'admin' || artifact.kind !== 'shell' || !fs.existsSync(path.join(store, 'artifacts', artifactId, 'index.html'))) throw new Error('Publish an admin build first.');
    write('admin.json', { artifactId });
    return artifact;
  });
}
function updateMetadata(name, update) {
  return withLock(() => {
    const value = update(diskRead(name, null));
    writeMetadata(name, value);
    return value;
  });
}
// Internal multi-step retirement writes must hold the same lock as activation,
// publication, policy edits and heartbeat reports.
function writeMetadata(name, value) {
  if (!['lifecycle.json', 'usage.json', 'composition-retirement.json', 'composition-origins.json', 'subscriptions.json', 'subscription-options.json', 'subscription-launches.json', 'demo-auth.json', 'subscription-console.json'].includes(name)) throw new Error('Unsupported management metadata');
  write(name, value);
}
module.exports = { store, read, current, publish, activate, rollback, preview, compositions, selectAdmin, updateMetadata, withStoreLock: withLock, writeMetadata, resolveComposition, persistComposition };
