const crypto = require('node:crypto');
const { read, current, updateMetadata, withStoreLock, writeMetadata } = require('./store.cjs');
const { lifecycleState, POLICY } = require('./lifecycle.cjs');
const iso = (time) => new Date(time).toISOString();
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
function confirmation(body, id) {
  if (!body || typeof id !== 'string' || body.confirmationId !== id || typeof body.reason !== 'string' || !body.reason.trim() || body.reason.length > 500) fail('CONFIRMATION_REQUIRED', '전체 대상 ID와 500자 이내 작업 사유를 입력해 주세요.');
}
function requestTransition(body, now = Date.now()) {
  const plan = updateMetadata('usage.json', (data) => {
    const session = typeof body?.sessionId === 'string' && Object.hasOwn(data?.sessions || {}, body.sessionId) ? data.sessions[body.sessionId] : null;
    if (!session) fail('INVALID_SESSION', '탭 기록을 찾을 수 없습니다.');
    confirmation(body, body.sessionId);
    if (body.expectedSequence !== session.sequence) fail('STALE_SESSION', '탭 응답 기록이 변경됐습니다. 다시 확인해 주세요.');
    if (body.unsavedInputAcknowledged !== true) fail('CONFIRMATION_REQUIRED', '전환 시 미저장 입력이 사라질 수 있음을 확인해 주세요.');
    if (session.protocol === 'lease-v1' || session.closedAt || session.releasedAt) fail('SESSION_PROTECTED', '열려 있는 구형 탭만 전환 요청할 수 있습니다.');
    if (session.transition && !session.transition.confirmedAt && now < Date.parse(session.transition.expiresAt)) fail('SESSION_PROTECTED', '이미 전환 요청을 기다리고 있습니다.');
    session.transition = { ticket: crypto.randomBytes(32).toString('hex'), requestedAt: iso(now), expiresAt: iso(now + 24 * 3600000), reason: body.reason.trim() };
    return data;
  }).sessions[body.sessionId].transition;
  return { requestedAt: plan.requestedAt, expiresAt: plan.expiresAt };
}
function transitionURL(session, now = Date.now()) {
  const plan = session?.transition;
  return plan && !plan.confirmedAt && !session.releasedAt && now < Date.parse(plan.expiresAt) ? `/legacy-transition/${plan.ticket}` : null;
}
function confirmTransition(ticket, now = Date.now()) {
  if (typeof ticket !== 'string' || !/^[a-f0-9]{64}$/.test(ticket)) fail('INVALID_TRANSITION', '유효한 전환 요청이 아닙니다.');
  let receipt;
  updateMetadata('usage.json', (data) => {
    const found = Object.entries(data?.sessions || {}).find(([, session]) => session.transition?.ticket === ticket);
    if (!found) fail('INVALID_TRANSITION', '전환 요청을 찾을 수 없습니다.');
    const [id, session] = found;
    if (session.transition.confirmedAt) { receipt = { sessionId: id, confirmedAt: session.transition.confirmedAt }; return data; }
    if (now >= Date.parse(session.transition.expiresAt)) fail('INVALID_TRANSITION', '전환 요청 기한이 지났습니다. 최신 화면을 열어 주세요.');
    session.transition.confirmedAt = iso(now);
    session.releasedAt = iso(now); session.releaseReason = '전환 문서에서 구형 화면 종료 확인';
    receipt = { sessionId: id, confirmedAt: iso(now) };
    return data;
  });
  return receipt;
}
function assessFence(release, now = Date.now()) {
  const blockers = [];
  const p = release.lifecycle;
  if (p.accessRevokedAt) blockers.push('이미 이 버전의 파일 접근을 종료했습니다.');
  if (p.registrationState !== 'unregistered') blockers.push('먼저 지원 종료와 공지 유예를 거쳐 등록을 해제해 주세요.');
  if (release.currentPaths.length) blockers.push('현재 조합에서 사용합니다.');
  if (release.history.length) blockers.push('롤백 보관 참조를 먼저 해제해 주세요.');
  if (release.pinnedConsumers.length) blockers.push('파일이 남아 있는 고정 참조 소비자가 있습니다.');
  const open = release.sessions.filter(s => !['closed', 'released'].includes(s.status));
  if (open.some(s => s.protocol === 'lease-v1')) blockers.push('보호 탭이 참조합니다. 종료 또는 기한 만료 후 탭 정리를 먼저 진행해 주세요.');
  if (open.some(s => s.protocol !== 'lease-v1' && now - Date.parse(s.lastSeenAt) < POLICY.sessionGraceHours * 3600000)) blockers.push(`최근 ${POLICY.sessionGraceHours}시간 이내 응답한 구형 탭이 있습니다. 전환을 먼저 진행해 주세요.`);
  return { eligible: blockers.length === 0, blockers };
}
function revokeArtifactAccess(body, now = Date.now()) {
  return withStoreLock(() => {
    confirmation(body, body?.artifactId);
    if (body.expectedCompositionId !== current()?.compositionId) fail('STALE_COMPOSITION', '현재 조합이 변경됐습니다. 다시 확인해 주세요.');
    const release = lifecycleState(now).releases.find(r => r.artifact.id === body.artifactId);
    if (!release) fail('INVALID_RELEASE', '배포물을 찾을 수 없습니다.');
    if (body.expectedRevision !== release.lifecycle.revision) fail('STALE_LIFECYCLE', '배포물 정책이 변경됐습니다. 다시 확인해 주세요.');
    if (body.serviceInterruptionAcknowledged !== true || body.externalUsageChecked !== true) fail('CONFIRMATION_REQUIRED', '복귀하는 구형 탭의 이용 중단과 외부 사용 범위 확인이 필요합니다.');
    const assessment = assessFence(release, now);
    if (!assessment.eligible) fail('RETIREMENT_BLOCKED', assessment.blockers.join(' '));
    const data = read('lifecycle.json', { releases: {} });
    data.releases[body.artifactId] = { ...release.lifecycle, accessRevokedAt: iso(now), accessRevocationReason: body.reason.trim(), revision: release.lifecycle.revision + 1, updatedAt: iso(now) };
    writeMetadata('lifecycle.json', data);
    return data.releases[body.artifactId];
  });
}
function assessLegacyRelease(session, policy, artifactId, now = Date.now()) {
  const blockers = [];
  if (session.protocol === 'lease-v1') blockers.push('보호 탭에는 기존 사용 기한 정리 절차를 사용해 주세요.');
  if (session.closedAt || session.releasedAt || session.legacyReleases?.[artifactId]) blockers.push('이미 종료 또는 정리한 참조입니다.');
  const earliestReleaseAt = policy.accessRevokedAt ? iso(Date.parse(policy.accessRevokedAt) + POLICY.sessionGraceHours * 3600000) : null;
  if (!earliestReleaseAt) blockers.push('먼저 이 버전의 파일 접근을 종료해야 합니다.');
  else if (now < Date.parse(earliestReleaseAt)) blockers.push(`접근 종료 후 ${POLICY.sessionGraceHours}시간을 기다려야 합니다.`);
  return { eligible: blockers.length === 0, blockers, earliestReleaseAt };
}
function releaseLegacyReference(body, now = Date.now()) {
  return withStoreLock(() => {
    confirmation(body, body?.sessionId);
    const release = lifecycleState(now).releases.find(r => r.artifact.id === body.artifactId);
    const session = release?.sessions.find(s => s.id === body.sessionId);
    if (!session) fail('INVALID_SESSION', '이 버전을 참조하는 탭이 아닙니다.');
    if (session.sequence !== body.expectedSequence || body.expectedAccessRevokedAt !== release.lifecycle.accessRevokedAt) fail('STALE_SESSION', '응답 또는 접근 종료 기록이 변경됐습니다. 다시 확인해 주세요.');
    const assessment = assessLegacyRelease(session, release.lifecycle, body.artifactId, now);
    if (!assessment.eligible) fail('SESSION_PROTECTED', assessment.blockers.join(' '));
    const data = read('usage.json');
    (data.sessions[body.sessionId].legacyReleases ||= {})[body.artifactId] = { releasedAt: iso(now), reason: body.reason.trim(), accessRevokedAt: release.lifecycle.accessRevokedAt };
    writeMetadata('usage.json', data);
    return data.sessions[body.sessionId].legacyReleases[body.artifactId];
  });
}
module.exports = { requestTransition, confirmTransition, transitionURL, assessFence, assessLegacyRelease, revokeArtifactAccess, releaseLegacyReference };
