const { read, current, compositions, updateMetadata } = require('./store.cjs');
const DAY = 86400000;
const POLICY = Object.freeze({ noticeDays: 30, retentionDays: 30, observationDays: 30, heartbeatSeconds: 15, staleSeconds: 120, leaseSeconds: 300, sessionGraceHours: 24, timezone: 'Asia/Seoul' });
const iso = (time) => new Date(time).toISOString();
const dateEnd = (value) => Date.parse(`${value}T23:59:59.999+09:00`);
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(dateEnd(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
function compositionArtifacts(snapshot) {
  return { ...snapshot.artifacts, [snapshot.shell.id]: snapshot.shell };
}
function selectionState(policy = {}, now = Date.now()) {
  if (policy.registrationState && policy.registrationState !== 'registered') return policy.registrationState;
  return policy.supportEndsOn && now > dateEnd(policy.supportEndsOn) ? 'ended' : 'available';
}
function assertSelectable(next, previous, now = Date.now()) {
  const policies = read('lifecycle.json', { releases: {} }).releases;
  const usageKey = item => JSON.stringify([item.path, item.aliases]);
  const previousPaths = new Set(previous ? usagePaths(previous).map(usageKey) : []);
  for (const item of usagePaths(next)) {
    const state = selectionState(policies[item.artifactId], now);
    if (state === 'available') continue;
    // Only exactly unchanged paths may keep using a supported-until-now release.
    // A new consumer or indirect ancestry cannot reuse this exception.
    if (state === 'ended' && previousPaths.has(usageKey(item))) continue;
    const artifact = compositionArtifacts(next)[item.artifactId];
    const reason = state === 'ended' ? '지원 종료' : state === 'deleted' ? '파일 삭제' : '등록 해제';
    const error = new Error(`${artifact.service.toUpperCase()} ${artifact.version}은 ${reason}된 배포물입니다. 신규 선택과 참조를 추가할 수 없습니다.`);
    error.code = 'RELEASE_UNAVAILABLE'; throw error;
  }
}
// Enumerate exact edges, including implicit shared-SDK edges; ranges alone are
// not usage. Keeping every ancestry path makes A -> B -> D visible for D too.
function usagePaths(snapshot) {
  const artifacts = compositionArtifacts(snapshot);
  const paths = [];
  function visit(id, path, aliases) {
    if (!artifacts[id] || path.includes(id)) return;
    const next = [...path, id];
    paths.push({ artifactId: id, path: next, aliases });
    const artifact = artifacts[id];
    const edges = { ...artifact.dependencies, ...snapshot.runtimeBindings?.[id] };
    if (artifact.runtimeRequirements?.platform) edges.platform = snapshot.selected.platform;
    for (const [alias, target] of Object.entries(edges)) {
      const menu = id === snapshot.shell.id && snapshot.navigation?.find(item => `menu/${item.id}` === alias);
      const placement = id === snapshot.shell.id && snapshot.dashboard?.find(item => `dashboard/${item.id}` === alias);
      const widget = placement && artifacts[placement.artifactId]?.widgets?.find(item => item.id === placement.widgetId);
      const edge = menu ? `${alias}:${menu.exposedModule}` : widget ? `${alias}:${widget.id}:${widget.exposedModule}` : alias;
      visit(target, next, [...aliases, edge]);
    }
  }
  for (const role of ['shell', 'A', 'C']) visit(snapshot.selected[role], [], []);
  if (!paths.some((item) => item.artifactId === snapshot.selected.platform)) visit(snapshot.selected.platform, [], []);
  return paths;
}
function usageStore(now = Date.now()) {
  return read('usage.json', null) || { startedAt: iso(now), sessions: {} };
}
function startObservation() {
  return updateMetadata('usage.json', (previous) => previous || { startedAt: iso(Date.now()), sessions: {} });
}
function recordUsage(body, now = Date.now(), transport = {}) {
  const leased = body?.protocol === 'lease-v1';
  if (!leased || !transport.userId) throw new Error('사용자 구독 탭은 인증된 lease-v1 보고가 필요합니다.');
  if (!body || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(body.sessionId || '') || !/^composition_[a-f0-9]+$/.test(body.compositionId || '') || !Number.isSafeInteger(body.sequence) || body.sequence < 1 || !(leased ? ['open', 'heartbeat', 'close'] : ['heartbeat', 'close']).includes(body.event)) throw new Error('Invalid usage report');
  const snapshot = read(`compositions/${body.compositionId}.json`, null);
  if (!snapshot) throw new Error('Unknown usage composition');
  const allowed = new Set(usagePaths(snapshot).map((item) => item.artifactId));
  if (!Array.isArray(body.loadedArtifactIds) || body.loadedArtifactIds.length > allowed.size || body.loadedArtifactIds.some((id) => !allowed.has(id))) throw new Error('Usage report contains an artifact outside its composition');
  return updateMetadata('usage.json', (previous) => {
    const value = previous || { startedAt: iso(now), sessions: {} };
    const session = value.sessions[body.sessionId];
    if (session && session.compositionId !== body.compositionId) throw new Error('A tab cannot change its composition');
    const refuse = (code) => { throw Object.assign(new Error('이 탭의 사용 기한이 끝났습니다. 최신 화면을 열어 주세요.'), { code }); };
    if (session?.userId && session.userId !== transport.userId) refuse('USER_CHANGED');
    if (session?.releasedAt) refuse('SESSION_RELEASED');
    if (leased && !session) {
      if (body.event !== 'open') refuse('LEASE_REQUIRED');
      if (read('composition-retirement.json', {})[body.compositionId]?.retiredAt) refuse('COMPOSITION_RETIRED');
      require('./subscriptions.cjs').authorizeLaunch(transport.userId, transport.launchToken, body.compositionId, now);
      assertSelectable(snapshot, snapshot, now);
    }
    if (leased && session && session.protocol !== 'lease-v1') refuse('LEASE_REQUIRED');
    if (session?.protocol === 'lease-v1' && body.event !== 'close') {
      if (!leased || session.closedAt || now >= Date.parse(session.leaseExpiresAt)) refuse('LEASE_EXPIRED');
    }
    if (session && (body.sequence <= session.sequence || session.closedAt)) return value;
    value.sessions[body.sessionId] = {
      ...session,
      userId: transport.userId, compositionId: body.compositionId, firstSeenAt: session?.firstSeenAt || iso(now), lastSeenAt: iso(now), sequence: body.sequence,
      loadedArtifactIds: [...new Set([...(session?.loadedArtifactIds || []), ...body.loadedArtifactIds])],
      closedAt: body.event === 'close' ? iso(now) : null,
      ...(transport.bridgeClientId ? { bridge: { clientId: transport.bridgeClientId, lastSeenAt: iso(now) } } : {}),
      ...(leased && body.event !== 'close' ? { protocol: 'lease-v1', leaseExpiresAt: iso(now + POLICY.leaseSeconds * 1000) } : {}),
    };
    return value;
  });
}
function assessSessionRelease(session, now = Date.now()) {
  const blockers = [];
  if (session.protocol !== 'lease-v1') blockers.push('재개 보호 기능이 없는 기존 탭입니다. 아래 구형 탭 전환·접근 종료 절차를 사용해 주세요.');
  if (session.closedAt || session.releasedAt) blockers.push('이미 종료 또는 정리된 기록입니다.');
  const expires = Date.parse(session.leaseExpiresAt);
  const earliestReleaseAt = Number.isFinite(expires) ? iso(expires + POLICY.sessionGraceHours * 3600000) : null;
  if (!earliestReleaseAt || now < Date.parse(earliestReleaseAt)) blockers.push(`사용 기한 만료 후 ${POLICY.sessionGraceHours}시간을 기다려야 합니다.`);
  return { eligible: blockers.length === 0, blockers, earliestReleaseAt };
}
function releaseSession(body, now = Date.now()) {
  return updateMetadata('usage.json', (previous) => {
    const session = typeof body?.sessionId === 'string' && Object.hasOwn(previous?.sessions || {}, body.sessionId) ? previous.sessions[body.sessionId] : null;
    if (!session) throw new Error('탭 기록을 찾을 수 없습니다.');
    if (body.confirmationId !== body.sessionId || typeof body.reason !== 'string' || !body.reason.trim() || body.reason.length > 500) throw new Error('전체 탭 ID와 500자 이내 작업 사유를 입력해 주세요.');
    if (body.expectedSequence !== session.sequence || body.expectedLeaseExpiresAt !== session.leaseExpiresAt) throw Object.assign(new Error('탭의 응답 기록이 바뀌었습니다. 다시 확인해 주세요.'), { code: 'STALE_SESSION' });
    const assessment = assessSessionRelease(session, now);
    if (!assessment.eligible) throw Object.assign(new Error(assessment.blockers.join(' ')), { code: 'SESSION_PROTECTED' });
    previous.sessions[body.sessionId] = { ...session, releasedAt: iso(now), releaseReason: body.reason.trim() };
    return previous;
  }).sessions[body.sessionId];
}
function saveLifecycle(body, now = Date.now()) {
  const catalog = read('catalog.json', {});
  const artifact = typeof body?.artifactId === 'string' && Object.hasOwn(catalog, body.artifactId) ? catalog[body.artifactId] : null;
  if (!artifact || artifact.service === 'admin') throw new Error('관리할 배포물을 찾을 수 없습니다.');
  if (!Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 0) throw new Error('현재 지원 정책 정보를 다시 불러와 주세요.');
  const supportEndsOn = body.supportEndsOn || null;
  if (supportEndsOn !== null && !validDate(supportEndsOn)) throw new Error('지원 종료일을 올바른 날짜로 지정해 주세요.');
  if (typeof body.noticeReference !== 'string' || body.noticeReference.length > 1000) throw new Error('공지 기록은 1,000자 이내로 입력해 주세요.');
  const noticeReference = body.noticeReference.trim();
  if (noticeReference && !supportEndsOn) throw new Error('공지 기록을 남기려면 지원 종료일도 지정해 주세요.');
  const result = updateMetadata('lifecycle.json', (previous) => {
    const value = previous || { releases: {} };
    const old = value.releases[artifact.id] || { revision: 0 };
    if (old.revision !== body.expectedRevision) {
      const error = new Error('다른 곳에서 지원 정책을 변경했습니다. 사용 현황을 새로고침한 뒤 다시 저장해 주세요.');
      error.code = 'STALE_LIFECYCLE'; throw error;
    }
    if (old.registrationState && old.registrationState !== 'registered') throw new Error('등록 해제 후에는 지원 정책을 변경할 수 없습니다.');
    const changed = old.supportEndsOn !== supportEndsOn || old.noticeReference !== noticeReference;
    value.releases[artifact.id] = {
      ...old,
      revision: old.revision + 1, supportEndsOn, noticeReference,
      noticeRecordedAt: noticeReference ? (changed ? iso(now) : old.noticeRecordedAt) : null,
      updatedAt: iso(now),
    };
    return value;
  });
  return result.releases[artifact.id];
}
// Both UI and destructive actions use this assessment. Actions re-read it under
// the writer lock; a previous green badge is never permission to skip checks.
function assessDeletion({ lifecycle, currentPaths, sessions, history, pinnedConsumers, observationStartedAt, subscriptions = [], launches = [], subscriptionReleasedAt }, now = Date.now()) {
  const blockers = [];
  const add = (code, message) => blockers.push({ code, message });
  const supportEnd = lifecycle.supportEndsOn ? dateEnd(lifecycle.supportEndsOn) : null;
  const noticeEnd = lifecycle.noticeRecordedAt ? Date.parse(lifecycle.noticeRecordedAt) + POLICY.noticeDays * DAY : null;
  const lastSeen = Math.max(0, subscriptionReleasedAt ? Date.parse(subscriptionReleasedAt) : 0, ...sessions.map((session) => session.referenceReleasedAt ? Date.parse(session.referenceReleasedAt) : Math.max(Date.parse(session.lastSeenAt), session.releasedAt ? Date.parse(session.releasedAt) : 0)));
  const unregisteredAt = lifecycle.unregisteredAt ? Date.parse(lifecycle.unregisteredAt) : null;
  const retentionEnd = supportEnd !== null && noticeEnd !== null && unregisteredAt !== null ? Math.max(supportEnd, noticeEnd, lastSeen, unregisteredAt, lifecycle.accessRevokedAt ? Date.parse(lifecycle.accessRevokedAt) : 0) + POLICY.retentionDays * DAY : null;
  const observationEnd = Date.parse(observationStartedAt) + POLICY.observationDays * DAY;
  if (subscriptions.length) add('SUBSCRIPTIONS', `저장된 사용자 구독 ${subscriptions.length}개가 이 버전을 사용합니다. 미접속 사용자도 보호합니다.`);
  if (launches.length) add('LAUNCHES', `화면을 여는 중인 ${launches.length}개 요청이 이 버전을 예약했습니다.`);
  if (currentPaths.length) add('CURRENT', `현재 서비스 조합에서 ${currentPaths.length}개 경로가 사용합니다.`);
  const recent = sessions.filter((session) => session.status === 'recent').length;
  const unknown = sessions.filter((session) => session.status === 'unknown').length;
  if (recent) add('OPEN_TABS', `최근 응답한 ${recent}개 탭에서 이 버전이 필요합니다. 지연 로딩도 포함합니다.`);
  if (unknown) add('UNKNOWN_TABS', `${unknown}개 탭의 응답이 끊겨 종료 여부를 확인할 수 없습니다.`);
  if (history.length) add('ROLLBACK', `저장된 조합 ${history.length}개가 롤백을 위해 이 파일을 참조합니다.`);
  if (pinnedConsumers.length) add('PINNED', `발행된 소비자 ${pinnedConsumers.length}개가 이 배포 ID를 고정 참조합니다.`);
  if (!['unregistered', 'deleting'].includes(lifecycle.registrationState) || unregisteredAt === null) add('REGISTERED', '파일 삭제 전에 먼저 등록을 해제해야 합니다.');
  if (lifecycle.registrationState === 'deleted') add('DELETED', '이미 파일을 삭제한 배포물입니다.');
  if (supportEnd === null) add('NO_END_DATE', '지원 종료일을 지정하지 않았습니다.');
  else if (now <= supportEnd) add('SUPPORTED', `${lifecycle.supportEndsOn}까지 지원합니다. (한국 시간)`);
  if (noticeEnd === null) add('NO_NOTICE', '공지 기록이 없습니다.');
  else if (now < noticeEnd) add('NOTICE_PERIOD', `공지 기록 후 최소 ${POLICY.noticeDays}일이 지나야 합니다.`);
  if (retentionEnd === null) add('NO_RETENTION_START', '지원 종료·공지 기록·등록 해제 후 보존 기간을 계산합니다.');
  else if (now < retentionEnd) add('RETENTION', `등록 해제·지원 종료·공지 유예 종료·접근 종료·마지막 관측·탭 정리 중 가장 늦은 시점부터 ${POLICY.retentionDays}일을 보존합니다.`);
  if (now < observationEnd) add('OBSERVATION', `이 저장소의 관측 기록이 아직 ${POLICY.observationDays}일 미만입니다.`);
  return { eligibleForReview: blockers.length === 0, blockers, earliestReviewAt: retentionEnd === null ? null : iso(Math.max(retentionEnd, observationEnd)), automaticDeletion: false };
}
function assessUnregister({ lifecycle, currentPaths, subscriptions = [], launches = [] }, now = Date.now()) {
  const blockers = [];
  if (lifecycle.registrationState && lifecycle.registrationState !== 'registered') blockers.push({ code: 'NOT_REGISTERED', message: '이미 등록 해제한 배포물입니다.' });
  if (!lifecycle.supportEndsOn || now <= dateEnd(lifecycle.supportEndsOn)) blockers.push({ code: 'SUPPORTED', message: '지원 종료일이 지난 뒤 등록 해제할 수 있습니다.' });
  if (!lifecycle.noticeRecordedAt || now < Date.parse(lifecycle.noticeRecordedAt) + POLICY.noticeDays * DAY) blockers.push({ code: 'NOTICE_PERIOD', message: `공지 기록 후 ${POLICY.noticeDays}일이 지나야 합니다.` });
  if (subscriptions.length) blockers.push({ code: 'SUBSCRIPTIONS', message: '저장된 사용자 구독을 먼저 전환하거나 해제해 주세요.' });
  if (launches.length) blockers.push({ code: 'LAUNCHES', message: '화면을 여는 중인 요청이 있습니다.' });
  if (currentPaths.length) blockers.push({ code: 'CURRENT', message: '현재 조합에서 먼저 다른 버전으로 전환해 주세요.' });
  return { eligible: blockers.length === 0, blockers };
}
function lifecycleState(now = Date.now()) {
  const snapshot = current();
  const catalog = read('catalog.json', {});
  const lifecycle = read('lifecycle.json', { releases: {} });
  const observation = usageStore(now);
  const history = compositions().map(({ composition }) => composition);
  const subscriptionState = require('./subscriptions.cjs').referenceState(now);
  const origins = read('composition-origins.json', {});
  const compositionPolicies = read('composition-retirement.json', {});
  const pathsByComposition = new Map(history.map((item) => [item.compositionId, usagePaths(item)]));
  const livePaths = snapshot ? (pathsByComposition.get(snapshot.compositionId) || usagePaths(snapshot)) : [];
  const sessions = Object.entries(observation.sessions).map(([id, item]) => ({
    id, ...item, status: item.releasedAt ? 'released' : item.closedAt ? 'closed' : now - Date.parse(item.lastSeenAt) > POLICY.staleSeconds * 1000 ? 'unknown' : 'recent',
    transition: item.transition ? { requestedAt: item.transition.requestedAt, expiresAt: item.transition.expiresAt, reason: item.transition.reason, confirmedAt: item.transition.confirmedAt } : null,
    cleanup: assessSessionRelease(item, now),
  }));
  const releases = Object.values(catalog).filter((item) => !['admin','subscriptions'].includes(item.service)).map((artifact) => {
    const id = artifact.id;
    const currentPaths = livePaths.filter((item) => item.artifactId === id);
    const referencingHistory = history.filter((item) => item.compositionId !== snapshot?.compositionId && origins[item.compositionId] !== 'subscription' && !compositionPolicies[item.compositionId]?.retiredAt && pathsByComposition.get(item.compositionId).some((entry) => entry.artifactId === id)).map((item) => item.compositionId);
    const referencingSessions = sessions.filter((session) => pathsByComposition.get(session.compositionId)?.some((item) => item.artifactId === id)).map((session) => ({ ...session,
      status: session.legacyReleases?.[id] ? 'released' : session.status,
      referenceReleasedAt: session.legacyReleases?.[id]?.releasedAt,
      loaded: session.loadedArtifactIds.includes(id), paths: pathsByComposition.get(session.compositionId).filter((item) => item.artifactId === id) }));
    const pinnedConsumers = Object.values(catalog).filter((item) => item.id !== id && lifecycle.releases[item.id]?.registrationState !== 'deleted' && Object.values(item.dependencies).includes(id)).map((item) => item.id);
    const policy = lifecycle.releases[id] || { revision: 0, supportEndsOn: null, noticeReference: '', noticeRecordedAt: null };
    const subscriptions = subscriptionState.subscriptions.filter(s => s.paths.some(p => p.artifactId === id)).map(s => ({ userId:s.userId, userName:s.userName, revision:s.revision, compositionId:s.compositionId, paths:s.paths.filter(p => p.artifactId === id) }));
    const launches = subscriptionState.launches.filter(l => l.paths.some(p => p.artifactId === id));
    const subscriptionReleasedAt = subscriptionState.releasedArtifacts[id];
    const deletion = assessDeletion({ lifecycle: policy, currentPaths, sessions: referencingSessions, history: referencingHistory, pinnedConsumers, observationStartedAt: observation.startedAt, subscriptions, launches, subscriptionReleasedAt }, now);
    const { assessFence, assessLegacyRelease } = require('./legacy.cjs');
    return { artifact, lifecycle: policy, registrationState: policy.registrationState || 'registered', selectionState: selectionState(policy, now), unregister: assessUnregister({ lifecycle: policy, currentPaths, subscriptions, launches }, now), currentPaths, subscriptions, launches, subscriptionReleasedAt,
      accessFence: assessFence({ lifecycle: policy, currentPaths, sessions: referencingSessions, history: referencingHistory, pinnedConsumers, subscriptions, launches }, now),
      sessions: referencingSessions.map(session => ({ ...session, legacyCleanup: assessLegacyRelease(session, policy, id, now) })), history: referencingHistory, historyEntries: referencingHistory.map((id) => ({ id, revision: compositionPolicies[id]?.revision || 0 })), pinnedConsumers, deletion,
      supportStatus: !policy.supportEndsOn ? 'unscheduled' : now <= dateEnd(policy.supportEndsOn) ? 'scheduled' : 'ended',
      recentTabs: referencingSessions.filter((session) => session.status === 'recent').length,
      unknownTabs: referencingSessions.filter((session) => session.status === 'unknown').length,
      loadedTabs: referencingSessions.filter((session) => session.status === 'recent' && session.loaded).length,
    };
  });
  return { generatedAt: iso(now), compositionId: snapshot?.compositionId, observationStartedAt: observation.startedAt, policy: POLICY, releases, scope: 'local-repository', automaticDeletion: false };
}
module.exports = { POLICY, usagePaths, assessDeletion, assessUnregister, assessSessionRelease, releaseSession, selectionState, assertSelectable, lifecycleState, saveLifecycle, recordUsage, startObservation };
