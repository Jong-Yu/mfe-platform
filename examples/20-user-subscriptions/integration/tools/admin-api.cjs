const crypto = require('node:crypto');
const semver = require('semver');
const { current, read, preview, activate, rollback, compositions } = require('./store.cjs');
const { lifecycleState, saveLifecycle, selectionState, releaseSession } = require('./lifecycle.cjs');
const { unregisterRelease, deleteReleaseFiles, retireComposition } = require('./retirement.cjs');
const { requestTransition, revokeArtifactAccess, releaseLegacyReference } = require('./legacy.cjs');
const csrfToken = crypto.randomBytes(32).toString('hex');

function send(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(value));
}
function message(error) {
  if (error.code === 'STALE_COMPOSITION') return '다른 곳에서 현재 조합을 변경했습니다. 최신 조합을 다시 불러온 뒤 검사해 주세요.';
  const incompatible = /Incompatible runtime dependency: (.+):(.+) requires (.+), selected (.+)/.exec(error.message);
  if (incompatible) {
    const artifact = read('catalog.json', {})[incompatible[1]];
    return `${artifact?.service.toUpperCase() || '서비스'} ${artifact?.version || ''}의 ${incompatible[2].toUpperCase()} 지원 범위는 ${incompatible[3]}입니다. 선택한 ${incompatible[4]} 버전을 사용할 수 없습니다.`;
  }
  if (/Missing runtime binding/.test(error.message)) return '새로 선택한 서비스의 하위 버전도 선택해 주세요. 모든 의존 관계가 연결되어야 적용할 수 있습니다.';
  if (/Dependency cycle/.test(error.message)) return '서로를 다시 참조하는 순환 의존성이 있어 이 조합을 적용할 수 없습니다.';
  if (/Incompatible platform/.test(error.message)) return '선택한 SDK가 서비스의 지원 버전 범위를 벗어납니다.';
  if (/Incompatible react/.test(error.message)) return 'SDK와 서비스의 React 실행 버전이 서로 다릅니다.';
  if (/not published/.test(error.message)) return '선택한 배포 파일을 저장소에서 찾을 수 없습니다.';
  if (/Pinned platform|Shell must declare/.test(error.message)) return '런타임 SDK 선택으로 전환하기 전의 배포물입니다. 전환된 버전을 선택해 주세요.';
  if (/Another publish/.test(error.message)) return '다른 변경을 처리하고 있습니다. 잠시 후 다시 시도해 주세요.';
  if (/differs from the reviewed preview/.test(error.message)) return '검사한 조합과 적용할 조합이 다릅니다. 다시 검사해 주세요.';
  return error.message;
}
function compositionById(id) {
  if (typeof id !== 'string' || !/^composition_[a-f0-9]+$/.test(id)) throw new Error('올바른 조합 ID가 아닙니다.');
  const composition = read(`compositions/${id}.json`, null);
  if (!composition) throw new Error('저장된 조합을 찾을 수 없습니다.');
  return composition;
}
function resolveRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.expectedCompositionId !== 'string') throw new Error('현재 조합 정보가 필요합니다. 화면을 다시 불러와 주세요.');
  if (body.rollbackTo) {
    const snapshot = compositionById(body.rollbackTo);
    return { selected: snapshot.selected, runtimeBindings: snapshot.runtimeBindings || {}, navigation: snapshot.navigation || [], dashboard: snapshot.dashboard ?? null };
  }
  const { selected, runtimeBindings } = body;
  if (!selected || typeof selected !== 'object' || Array.isArray(selected) || Object.keys(selected).length !== 4 || !['platform', 'shell', 'A', 'C'].every((key) => typeof selected[key] === 'string')) throw new Error('SDK·Shell·A·C 선택을 모두 지정해야 합니다.');
  if (!runtimeBindings || typeof runtimeBindings !== 'object' || Array.isArray(runtimeBindings)) throw new Error('서비스 의존 관계를 지정해야 합니다.');
  return { selected, runtimeBindings, navigation: body.navigation, dashboard: body.dashboard };
}
async function readBody(req) {
  let length = 0;
  const chunks = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 65536) throw new Error('요청이 너무 큽니다.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('요청 형식을 읽을 수 없습니다.'); }
}
function state() {
  const snapshot = current();
  const policies = read('lifecycle.json', { releases: {} }).releases;
  const catalog = Object.values(read('catalog.json', {})).filter((artifact) => !['admin','subscriptions'].includes(artifact.service)).map((artifact) => ({ ...artifact, selectionState: selectionState(policies[artifact.id]) })).sort((a, b) => a.service.localeCompare(b.service) || semver.rcompare(a.version, b.version) || a.id.localeCompare(b.id));
  const compositionPolicies = read('composition-retirement.json', {});
  const history = compositions().filter(({composition}) => read('composition-origins.json', {})[composition.compositionId] !== 'subscription').map(({ composition, createdAt }) => {
    let reason = null;
    try { preview(composition.selected, composition.runtimeBindings || {}, { replaceBindings: true, navigation: composition.navigation || [], dashboard: composition.dashboard ?? null }); }
    catch (error) { reason = message(error); }
    return { id: composition.compositionId, createdAt, retiredAt: compositionPolicies[composition.compositionId]?.retiredAt || null, active: composition.compositionId === snapshot?.compositionId, valid: !reason, reason,
      selected: composition.selected, platformVersion: composition.platformVersion, menuCount: composition.navigation?.length || 0, widgetCount: composition.dashboard?.length || 0,
      paths: ['A', 'C'].map((role) => {
        const app = composition.applications[role];
        const bId = composition.runtimeBindings?.[app.id]?.b || app.dependencies.b;
        const b = composition.artifacts[bId];
        const dId = composition.runtimeBindings?.[bId]?.d || b?.dependencies.d;
        return { role, b: b?.version || '—', d: composition.artifacts[dId]?.version || '—' };
      }),
    };
  });
  history.sort((a, b) => Number(b.active) - Number(a.active) || b.createdAt.localeCompare(a.createdAt));
  return { current: snapshot, catalog, history, csrfToken };
}

async function handleAdminAPI(req, res, pathname) {
  if (!pathname.startsWith('/api/admin/')) return false;
  const origin = `http://${req.headers.host}`;
  if (!['127.0.0.1', 'localhost'].some((host) => req.headers.host === `${host}:${req.socket.localPort}`)) { send(res, 403, { error: '로컬 관리 주소에서 접속해 주세요.' }); return true; }
  try {
    if (req.method === 'GET' && pathname === '/api/admin/state') { send(res, 200, state()); return true; }
    if (req.method === 'GET' && pathname === '/api/admin/lifecycle') { send(res, 200, lifecycleState()); return true; }
    if (req.method === 'GET' && pathname.startsWith('/api/admin/compositions/')) { send(res, 200, compositionById(pathname.slice('/api/admin/compositions/'.length))); return true; }
    const actions = { '/api/admin/releases/unregister': unregisterRelease, '/api/admin/releases/delete': deleteReleaseFiles, '/api/admin/compositions/retire': retireComposition, '/api/admin/sessions/release': releaseSession,
      '/api/admin/sessions/transition': requestTransition, '/api/admin/releases/revoke-access': revokeArtifactAccess, '/api/admin/sessions/release-legacy': releaseLegacyReference };
    if (!['/api/admin/preview', '/api/admin/apply', '/api/admin/lifecycle', ...Object.keys(actions)].includes(pathname)) { send(res, 404, { error: '관리 기능을 찾을 수 없습니다.' }); return true; }
    if (req.method !== 'POST') { send(res, 405, { error: 'POST 요청이 필요합니다.' }); return true; }
    if (req.headers.origin !== origin || req.headers['x-mfe-csrf'] !== csrfToken || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
      send(res, 403, { error: '관리 화면에서 시작한 요청만 허용됩니다. 화면을 새로고침해 주세요.' }); return true;
    }
    const body = await readBody(req);
    if (actions[pathname]) { send(res, 200, { result: actions[pathname](body) }); return true; }
    if (pathname === '/api/admin/lifecycle') { send(res, 200, { lifecycle: saveLifecycle(body) }); return true; }
    const request = resolveRequest(body);
    const options = { replaceBindings: true, expectedCompositionId: body.expectedCompositionId, navigation: request.navigation, dashboard: request.dashboard };
    if (pathname === '/api/admin/preview') {
      const composition = preview(request.selected, request.runtimeBindings, options);
      send(res, 200, { composition, unchanged: composition.compositionId === current()?.compositionId });
    } else {
      if (typeof body.previewedCompositionId !== 'string' || !/^composition_[a-f0-9]+$/.test(body.previewedCompositionId)) throw new Error('적용 전에 조합 검사를 완료해 주세요.');
      options.expectedTargetId = body.previewedCompositionId;
      const composition = body.rollbackTo ? rollback(body.rollbackTo, options) : activate(request.selected, request.runtimeBindings, options);
      send(res, 200, { composition });
    }
  } catch (error) { send(res, ['STALE_COMPOSITION', 'STALE_LIFECYCLE', 'STALE_SESSION', 'SESSION_PROTECTED', 'RETIREMENT_BLOCKED', 'DELETE_INCOMPLETE'].includes(error.code) ? 409 : 422, { error: message(error), code: error.code || 'INVALID_COMPOSITION', blockers: error.blockers }); }
  return true;
}
module.exports = { handleAdminAPI };
