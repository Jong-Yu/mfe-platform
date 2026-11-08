const fs = require('node:fs');
const path = require('node:path');
const { store, read, current, withStoreLock, writeMetadata } = require('./store.cjs');
const { lifecycleState } = require('./lifecycle.cjs');

function fail(code, message, blockers) { throw Object.assign(new Error(message), { code, blockers }); }
function validateRequest(body, id) {
  if (!body || typeof body.expectedCompositionId !== 'string' || body.expectedCompositionId !== current()?.compositionId) fail('STALE_COMPOSITION', '현재 조합을 다시 불러와 주세요.');
  if (!Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 0) fail('STALE_LIFECYCLE', '현재 상태를 다시 불러와 주세요.');
  if (body.confirmationId !== id) fail('CONFIRMATION_REQUIRED', '확인란에 작업 대상의 전체 ID를 입력해 주세요.');
  if (typeof body.reason !== 'string' || !body.reason.trim() || body.reason.length > 500) fail('CONFIRMATION_REQUIRED', '작업 사유를 500자 이내로 입력해 주세요.');
}
function releaseRequest(body) {
  if (typeof body?.artifactId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.+-]*$/.test(body.artifactId)) fail('INVALID_RELEASE', '올바른 배포 ID가 아닙니다.');
  validateRequest(body, body.artifactId);
  const state = lifecycleState();
  const release = state.releases.find((item) => item.artifact.id === body.artifactId);
  if (!release) fail('INVALID_RELEASE', '배포물을 찾을 수 없습니다.');
  if (release.lifecycle.revision !== body.expectedRevision) fail('STALE_LIFECYCLE', '다른 곳에서 배포물 상태를 변경했습니다. 새로고침해 주세요.');
  return release;
}
function saveRelease(id, policy) {
  const data = read('lifecycle.json', { releases: {} });
  data.releases[id] = policy; writeMetadata('lifecycle.json', data);
  return policy;
}
function unregisterRelease(body) {
  return withStoreLock(() => {
    const release = releaseRequest(body);
    if (!release.unregister.eligible) fail('RETIREMENT_BLOCKED', release.unregister.blockers.map((item) => item.message).join(' '), release.unregister.blockers);
    const now = new Date().toISOString();
    return saveRelease(release.artifact.id, { ...release.lifecycle, registrationState: 'unregistered', unregisteredAt: now, unregisterReason: body.reason.trim(), updatedAt: now, revision: release.lifecycle.revision + 1 });
  });
}
function safeDirectory(filename, parent) {
  if (fs.lstatSync(parent).isSymbolicLink()) fail('UNSAFE_STORAGE_PATH', '배포물 저장 경로는 심볼릭 링크일 수 없습니다.');
  let info;
  try { info = fs.lstatSync(filename); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  if (!info.isDirectory() || info.isSymbolicLink() || !fs.realpathSync(filename).startsWith(fs.realpathSync(parent) + path.sep)) fail('UNSAFE_STORAGE_PATH', '예상한 배포물 디렉터리가 아닙니다. 파일은 삭제하지 않았습니다.');
}
function deleteReleaseFiles(body) {
  return withStoreLock(() => {
    const release = releaseRequest(body);
    if (body.externalUsageChecked !== true) fail('CONFIRMATION_REQUIRED', '관측 범위 밖의 사용 여부를 별도로 확인한 뒤 진행해 주세요.');
    if (!release.deletion.eligibleForReview) fail('RETIREMENT_BLOCKED', release.deletion.blockers.map((item) => item.message).join(' '), release.deletion.blockers);
    const id = release.artifact.id;
    const sourceRoot = path.join(store, 'artifacts'), workRoot = path.join(store, '.deletion-work');
    const source = path.join(sourceRoot, id), work = path.join(workRoot, id);
    fs.mkdirSync(workRoot, { recursive: true });
    if (fs.lstatSync(workRoot).isSymbolicLink()) fail('UNSAFE_STORAGE_PATH', '삭제 작업 디렉터리가 올바르지 않습니다.');
    safeDirectory(source, sourceRoot); safeDirectory(work, workRoot);
    if (fs.existsSync(source) && fs.existsSync(work)) fail('UNSAFE_STORAGE_PATH', '중복 삭제 작업 파일이 있어 수동 확인이 필요합니다.');
    let policy = saveRelease(id, { ...release.lifecycle, registrationState: 'deleting', deletionStartedAt: release.lifecycle.deletionStartedAt || new Date().toISOString(), deleteReason: body.reason.trim(), externalUsageCheckedAt: new Date().toISOString(), lastDeleteError: null, revision: release.lifecycle.revision + 1 });
    try {
      // Durable intent first; an interrupted request can resume from this exact
      // ID. Renamed files are outside every public static-file route.
      if (fs.existsSync(source)) fs.renameSync(source, work);
      fs.rmSync(work, { recursive: true, force: true });
      policy = saveRelease(id, { ...policy, registrationState: 'deleted', deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revision: policy.revision + 1 });
      return policy;
    } catch (error) {
      saveRelease(id, { ...policy, lastDeleteError: error.message, revision: policy.revision + 1 });
      fail('DELETE_INCOMPLETE', '파일 삭제가 완료되지 않았습니다. 상태를 새로고침하고 남은 파일 삭제를 재시도해 주세요.');
    }
  });
}
function retireComposition(body) {
  return withStoreLock(() => {
    const id = body?.compositionId;
    if (typeof id !== 'string' || !/^composition_[a-f0-9]+$/.test(id) || !read(`compositions/${id}.json`, null)) fail('INVALID_COMPOSITION', '조합을 찾을 수 없습니다.');
    validateRequest(body, id);
    if (current()?.compositionId === id) fail('RETIREMENT_BLOCKED', '현재 적용된 조합의 롤백 보관은 해제할 수 없습니다.');
    const states = read('composition-retirement.json', {}), previous = states[id] || { revision: 0 };
    if (previous.revision !== body.expectedRevision) fail('STALE_LIFECYCLE', '조합 보관 상태가 변경됐습니다. 새로고침해 주세요.');
    if (previous.retiredAt) fail('RETIREMENT_BLOCKED', '이미 보관을 해제한 조합입니다.');
    states[id] = { revision: previous.revision + 1, retiredAt: new Date().toISOString(), reason: body.reason.trim() };
    writeMetadata('composition-retirement.json', states);
    return states[id];
  });
}
module.exports = { unregisterRelease, deleteReleaseFiles, retireComposition };
