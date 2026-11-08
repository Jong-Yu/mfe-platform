import React, { useState } from 'react';

const stamp = (value) => value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '없음';
export default function SessionActions({ sessions, request, csrfToken, onSaved }) {
  const [prepared, setPrepared] = useState(null), [confirmation, setConfirmation] = useState(''), [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice(''); let completed = false;
    try {
      await request('sessions/release', { sessionId: prepared.id, expectedSequence: prepared.sequence, expectedLeaseExpiresAt: prepared.leaseExpiresAt, confirmationId: confirmation, reason }, csrfToken);
      completed = true; setPrepared(null); setNotice('탭의 파일 보호 참조를 정리했습니다. 작업 기록은 남고, 파일은 삭제하지 않습니다. 이 시점부터 최소 30일을 더 보존합니다.');
      await onSaved();
    } catch (cause) { setError(`${completed ? '작업은 완료했지만 목록 갱신에 실패했습니다. ' : ''}${cause.message}`); }
    finally { setBusy(false); }
  }
  const targets = sessions.filter((session) => !session.closedAt);
  return <details className="session-cleanup detail-section"><summary>응답 없는 탭 정리 ({targets.length})</summary>
    <p className="small muted">재개 보호가 있는 탭만 사용 기한 만료 후 24시간이 지나면 정리할 수 있습니다. 응답 중인 탭은 갱신됩니다. 기존 탭은 아래 ‘구형 탭 전환 · 접근 종료’를 사용해 주세요.</p>
    <ul className="session-list">{targets.map((session) => <li key={session.id} data-testid={`session-${session.id}`}>
      <code className="full-artifact-id">{session.id}</code><p className="small">{session.releasedAt ? '참조 정리 완료' : session.protocol === 'lease-v1' ? '재개 보호 적용' : '기존 탭 · 재개 보호 없음'}</p>
      <p className="small muted">마지막 응답 {stamp(session.lastSeenAt)}<br />사용 기한 {stamp(session.leaseExpiresAt)}<br />정리 가능 시점 {stamp(session.cleanup.earliestReleaseAt)}</p>
      {session.releasedAt ? <p className="small muted">정리 {stamp(session.releasedAt)} · 사유: {session.releaseReason}</p> : <><button type="button" className="button secondary" data-testid={`prepare-session-${session.id}`} disabled={busy || !session.cleanup.eligible} onClick={() => { setPrepared(session); setConfirmation(''); setReason(''); setError(''); setNotice(''); }}>탭 참조 정리 준비</button><ul className="blocker-list">{session.cleanup.blockers.map((message) => <li key={message}>{message}</li>)}</ul></>}
    </li>)}</ul>
    {prepared ? <form className="retirement-confirm" onSubmit={submit}><h3>탭 참조 정리 확인</h3><p className="small">이 탭은 이후 구버전 사용을 재개할 수 없습니다. 이 탭이 참조한 모든 버전의 보호 참조를 함께 정리하며 파일은 남깁니다.</p><code className="full-artifact-id">{prepared.id}</code>
      <label htmlFor="session-confirm">정리할 전체 탭 ID</label><input id="session-confirm" value={confirmation} disabled={busy} autoComplete="off" onChange={(event) => setConfirmation(event.target.value)} />
      <label htmlFor="session-reason">탭 정리 사유</label><textarea id="session-reason" rows="2" maxLength="500" value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} />
      <div className="support-actions"><button type="button" className="text-button" disabled={busy} onClick={() => setPrepared(null)}>취소</button><button type="submit" className="button primary" data-testid="confirm-session-release" disabled={busy || confirmation !== prepared.id || !reason.trim()}>{busy ? '처리 중…' : '탭 참조 정리 실행'}</button></div>
    </form> : null}
    {error ? <p role="alert" className="form-error">{error}</p> : null}{notice ? <p role="status" className="form-success">{notice}</p> : null}
  </details>;
}
