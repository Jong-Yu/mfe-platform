import React, { useState } from 'react';
import { shortId } from './model';

const labels = { unregister: '등록 해제', delete: '파일 삭제', retire: '롤백 보관 해제' };
const states = { registered: '등록됨', unregistered: '등록 해제 · 파일 보관', deleting: '삭제 미완료', deleted: '파일 삭제 완료' };
export default function RetirementActions({ release, compositionId, request, csrfToken, onSaved }) {
  const [action, setAction] = useState(null), [confirmation, setConfirmation] = useState(''), [reason, setReason] = useState(''), [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  function prepare(type, id = release.artifact.id, revision = release.lifecycle.revision) {
    setAction({ type, id, revision, compositionId }); setConfirmation(''); setReason(''); setChecked(false); setError(''); setNotice('');
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice(''); let completed = false;
    try {
      const body = { expectedCompositionId: action.compositionId, expectedRevision: action.revision, confirmationId: confirmation, reason, externalUsageChecked: checked };
      const endpoint = action.type === 'retire' ? 'compositions/retire' : `releases/${action.type}`;
      if (action.type === 'retire') body.compositionId = action.id; else body.artifactId = action.id;
      await request(endpoint, body, csrfToken); completed = true;
      setNotice(`${labels[action.type]}를 완료했습니다.${action.type === 'unregister' ? ' 배포 파일은 보관됩니다.' : action.type === 'retire' ? ' 열린 탭의 파일 보호는 계속 적용됩니다.' : ' 배포 정보와 작업 기록은 남습니다.'}`);
      setAction(null); await onSaved();
    } catch (cause) { setError(`${completed ? '작업은 완료했지만 목록을 갱신하지 못했습니다. ' : ''}${cause.message}`); }
    finally { setBusy(false); }
  }
  return <section className="retirement-actions detail-section" aria-label="등록 해제와 파일 삭제">
    <div className="review-title"><h3>등록과 파일을 따로 관리</h3><span className="pill" data-testid="registration-state">{states[release.registrationState]}</span></div>
    <p className="small muted">등록 해제는 선택 목록에서 제외하고 파일을 남깁니다. 실제 삭제는 별도로 확인한 뒤 실행합니다.</p>
    {release.lifecycle.unregisteredAt ? <p className="small muted">등록 해제: {new Date(release.lifecycle.unregisteredAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p> : null}
    <div className="retirement-buttons"><button type="button" className="button secondary" data-testid="prepare-unregister" disabled={busy || !release.unregister.eligible} onClick={() => prepare('unregister')}>등록 해제 준비</button><button type="button" className="button danger" data-testid="prepare-delete" disabled={busy || !release.deletion.eligibleForReview} onClick={() => prepare('delete')}>{release.registrationState === 'deleting' ? '남은 파일 삭제 준비' : '파일 삭제 준비'}</button></div>
    {release.registrationState === 'registered' && release.unregister.blockers.length ? <ul className="blocker-list" aria-label="등록 해제 보류 사유">{release.unregister.blockers.map((item) => <li key={item.code}>{item.message}</li>)}</ul> : null}
    {release.lifecycle.lastDeleteError ? <p className="form-error">이전 삭제가 완료되지 않았습니다. 조건을 확인한 뒤 남은 파일 삭제를 재시도할 수 있습니다.</p> : null}
    <details className="retirement-references"><summary>롤백 보관·고정 참조 ({release.history.length + release.pinnedConsumers.length})</summary>
      <p className="small muted">보관을 해제한 조합은 다시 선택할 수 없습니다. 조합 기록은 남기고, 열린 탭의 참조는 계속 보호합니다.</p>
      <ul className="reference-list">{release.historyEntries.map((item) => <li key={item.id}><code>{item.id}</code><button type="button" className="text-button" data-testid={`prepare-retire-${item.id}`} disabled={busy} onClick={() => prepare('retire', item.id, item.revision)}>조합 {shortId(item.id)} 보관 해제 준비</button></li>)}{release.pinnedConsumers.map((id) => <li key={id}>고정 참조 소비자 <code>{id}</code></li>)}</ul>
    </details>
    {action ? <form className="retirement-confirm" onSubmit={submit} data-testid="retirement-confirm"><h3>{labels[action.type]} 확인</h3><p className="small">{action.type === 'delete' ? '선택한 배포물의 저장소 파일을 실제로 삭제합니다. 이 화면에서 복원할 수 없습니다.' : action.type === 'retire' ? '이 조합으로 롤백할 수 없게 됩니다. 파일은 이 작업으로 삭제하지 않습니다.' : '신규 선택에서 제외합니다. 기존 탭을 위해 배포 파일은 그대로 둡니다.'}</p><code>{action.id}</code>
      <label htmlFor="retirement-confirm-id">작업 대상 전체 ID</label><input id="retirement-confirm-id" value={confirmation} disabled={busy} autoComplete="off" onChange={(event) => setConfirmation(event.target.value)} />
      <label htmlFor="retirement-reason">작업 사유</label><textarea id="retirement-reason" rows="2" maxLength="500" value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} />
      {action.type === 'delete' ? <label className="external-confirm"><input type="checkbox" checked={checked} disabled={busy} onChange={(event) => setChecked(event.target.checked)} /><span>추적 도입 전 탭·외부 호스트 등 관측 범위 밖에서도 미사용임을 별도로 확인했습니다.</span></label> : null}
      <div className="support-actions"><button className="text-button" type="button" disabled={busy} onClick={() => setAction(null)}>취소</button><button className={`button ${action.type === 'delete' ? 'danger' : 'primary'}`} type="submit" data-testid="confirm-retirement" disabled={busy || confirmation !== action.id || !reason.trim() || (action.type === 'delete' && !checked)}>{busy ? '처리 중…' : `${labels[action.type]} 실행`}</button></div>
    </form> : null}
    {error ? <p role="alert" className="form-error" data-testid="retirement-error">{error}</p> : null}{notice ? <p role="status" className="form-success" data-testid="retirement-saved">{notice}</p> : null}
  </section>;
}
