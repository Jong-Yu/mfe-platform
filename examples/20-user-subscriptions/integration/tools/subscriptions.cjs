const crypto = require('node:crypto');
const { read, withStoreLock, writeMetadata, resolveComposition, persistComposition } = require('./store.cjs');
const USERS = Object.freeze([{ id: 'alice', name: 'Alice' }, { id: 'bob', name: 'Bob' }, { id: 'carol', name: 'Carol' }]);
const LAUNCH_MS = 30000;
const empty = () => ({ schemaVersion: 1, users: {}, releasedArtifacts: {} });
function data() { return read('subscriptions.json', null) || empty(); }
function snapshot(id) { return read(`compositions/${id}.json`, null); }
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function user(id) { const result = USERS.find(item => item.id === id); if (!result) fail('INVALID_USER', '데모 사용자를 선택해 주세요.'); return result; }
function currentSubscription(id) { return data().users[id] || { userId: id, revision: 0, active: false }; }
function refs(id) {
  return Object.values(data().users).filter(s => s.active && [s.compositionId, s.baseCompositionId].includes(id));
}
function assertRevision(body, old) {
  if (!Number.isSafeInteger(body?.expectedRevision) || body.expectedRevision !== old.revision)
    fail('STALE_SUBSCRIPTION', '다른 화면에서 구독을 변경했습니다. 저장된 구독을 다시 불러와 주세요.');
}
function resolve(id, body) {
  user(id);
  if (!body || Object.keys(body).some(key => !['expectedRevision','baseCompositionId','dashboard','previewedCompositionId'].includes(key)))
    fail('INVALID_SUBSCRIPTION', '사용자와 의존 관계는 서버에서 결정합니다.');
  const old = currentSubscription(id); assertRevision(body, old);
  const options = read('subscription-options.json', { bases: [], widgetBindings: {} });
  if (!options.bases.some(item => item.compositionId === body.baseCompositionId)) fail('INVALID_BASE', '공개된 배포 조합을 선택해 주세요.');
  const base = snapshot(body.baseCompositionId);
  if (!base || read('composition-retirement.json', {})[body.baseCompositionId]?.retiredAt) fail('INVALID_BASE', '보관이 종료된 배포 조합입니다.');
  if (!Array.isArray(body.dashboard)) fail('INVALID_SUBSCRIPTION', '구독할 위젯 목록이 필요합니다.');
  const catalog = read('catalog.json', {}), bindings = {}, visited = new Set();
  function visit(artifactId) {
    if (visited.has(artifactId)) return;
    visited.add(artifactId);
    const artifact = catalog[artifactId]; if (!artifact) fail('INVALID_SUBSCRIPTION', '발행된 위젯을 선택해 주세요.');
    for (const target of Object.values(artifact.dependencies || {})) visit(target);
    for (const alias of Object.keys(artifact.runtimeDependencies || {})) {
      // A base combination owns its existing edges. Newly added widget branches
      // use explicit publisher defaults; no latest/semver-max resolution.
      const target = base.runtimeBindings?.[artifactId]?.[alias] || options.widgetBindings[artifactId]?.[alias];
      if (!target) fail('MISSING_WIDGET_BINDING', '이 위젯의 하위 버전이 공개되지 않았습니다.');
      (bindings[artifactId] ||= {})[alias] = target; visit(target);
    }
  }
  Object.values(base.selected).forEach(visit);
  for (const item of body.dashboard) visit(item?.artifactId);
  for (const item of base.navigation || []) visit(item.artifactId);
  // Grandfather only this user's unchanged references, never global references
  // or another user's choices. A new subscriber cannot adopt an ended release.
  const previous = old.active ? snapshot(old.compositionId) : null;
  const composition = resolveComposition(base.selected, bindings, {
    replaceBindings: true, navigation: base.navigation || [], dashboard: body.dashboard,
  }, previous);
  return { old, composition, baseCompositionId: base.compositionId };
}
function previewSubscription(id, body) { return withStoreLock(() => resolve(id, body).composition); }
function commit(id, body, cancel = false) {
  return withStoreLock(() => {
    user(id);
    const old = currentSubscription(id); assertRevision(body, old);
    if (cancel && Object.keys(body).some(key => !['expectedRevision'].includes(key))) fail('INVALID_SUBSCRIPTION', '올바른 해제 요청이 아닙니다.');
    const next = cancel ? null : resolve(id, body);
    if (next && body.previewedCompositionId !== next.composition.compositionId) fail('PREVIEW_REQUIRED', '현재 선택을 먼저 검사해 주세요.');
    if (next) persistComposition(next.composition);
    const state = data(), now = new Date().toISOString();
    const ids = value => new Set(value ? require('./lifecycle.cjs').usagePaths(value).map(item => item.artifactId) : []);
    const previousIds = ids(old.active ? snapshot(old.compositionId) : null), nextIds = ids(next?.composition);
    for (const artifactId of previousIds) if (!nextIds.has(artifactId)) state.releasedArtifacts[artifactId] = now;
    const saved = cancel
      ? { userId: id, revision: old.revision + 1, active: false, updatedAt: now }
      : { userId: id, revision: old.revision + 1, active: true, baseCompositionId: next.baseCompositionId,
          compositionId: next.composition.compositionId, dashboard: next.composition.dashboard, updatedAt: now };
    state.users[id] = saved;
    writeMetadata('subscriptions.json', state);
    return saved;
  });
}
function referenceState(now = Date.now()) {
  const state = data(), { usagePaths } = require('./lifecycle.cjs');
  const subscriptions = Object.values(state.users).filter(s => s.active).map(s => ({ ...s,
    userName: user(s.userId).name, paths: usagePaths(snapshot(s.compositionId)) }));
  const launches = Object.values(read('subscription-launches.json', {})).filter(l => Date.parse(l.expiresAt) > now)
    .map(l => ({ userId: l.userId, compositionId: l.compositionId, expiresAt: l.expiresAt, paths: usagePaths(snapshot(l.compositionId)) }));
  return { subscriptions, launches, releasedArtifacts: state.releasedArtifacts };
}
function issueLaunch(id) {
  return withStoreLock(() => {
    const sub = currentSubscription(id);
    if (!sub.active) return null;
    const composition = snapshot(sub.compositionId);
    require('./lifecycle.cjs').assertSelectable(composition, composition);
    const now = Date.now(), token = crypto.randomBytes(24).toString('hex');
    const launches = Object.fromEntries(Object.entries(read('subscription-launches.json', {})).filter(([,l]) => Date.parse(l.expiresAt) > now));
    launches[token] = { userId: id, compositionId: sub.compositionId, expiresAt: new Date(now + LAUNCH_MS).toISOString() };
    writeMetadata('subscription-launches.json', launches);
    return { token, composition, user: user(id) };
  });
}
function authorizeLaunch(id, token, compositionId, now = Date.now()) {
  const l = typeof token === 'string' && read('subscription-launches.json', {})[token];
  if (!l || l.userId !== id || Date.parse(l.expiresAt) <= now || (compositionId && l.compositionId !== compositionId))
    fail('LAUNCH_EXPIRED', '구독 화면을 다시 열어 주세요.');
  return snapshot(l.compositionId);
}
function consoleState(id) {
  const own = currentSubscription(id), { selectionState } = require('./lifecycle.cjs');
  const options = read('subscription-options.json', { bases: [] }), policies = read('lifecycle.json', { releases: {} }).releases;
  return { user: user(id), subscription: own, bases: options.bases.map(item => ({ ...item,
    retired: Boolean(read('composition-retirement.json', {})[item.compositionId]?.retiredAt),
    platformVersion: snapshot(item.compositionId)?.platformVersion })),
    widgets: Object.values(read('catalog.json', {})).flatMap(a => (a.widgets || []).map(w => ({
      artifactId: a.id, service: a.service, version: a.version, ...w, selectionState: selectionState(policies[a.id]),
    }))) };
}
module.exports = { USERS, LAUNCH_MS, user, currentSubscription, previewSubscription, saveSubscription: (id, body) => commit(id, body),
  cancelSubscription: (id, body) => commit(id, body, true), referenceState, refs, issueLaunch, authorizeLaunch, consoleState };
