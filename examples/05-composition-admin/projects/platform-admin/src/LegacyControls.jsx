import React, { useState } from 'react';

const stamp = (value) => value ? new Date(value).toLocaleString('ko-KR', {timeZone:'Asia/Seoul'}) : '없음';
export default function LegacyControls({release, compositionId, request, csrfToken, onSaved}) {
  const [prepared,setPrepared]=useState(null),[confirmation,setConfirmation]=useState(''),[reason,setReason]=useState(''),[ack,setAck]=useState(false),[external,setExternal]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[bridge,setBridge]=useState('');
  async function connect() {
    setBusy(true);setError('');
    try {
      if(!('serviceWorker' in navigator))throw new Error('이 브라우저에서는 전환 중계를 사용할 수 없습니다. 수동으로 최신 화면을 열거나 버전 접근 종료 절차를 사용해 주세요.');
      const existing=await navigator.serviceWorker.getRegistration('/');
      const worker=existing?.active || existing?.waiting || existing?.installing;
      if(worker && new URL(worker.scriptURL).pathname !== '/transition-worker.js')throw new Error('이 출처에 다른 중계 기능이 등록되어 있습니다. 기존 기능을 덮어쓰지 않았습니다.');
      await navigator.serviceWorker.register('/transition-worker.js',{scope:'/',updateViaCache:'none'});
      await navigator.serviceWorker.ready;
      setBridge('이 브라우저에 연결했습니다. 구형 탭의 다음 응답부터 중계가 확인됩니다. 다른 브라우저·프로필에는 별도 연결이 필요합니다.');
    }catch(cause){setError(cause.message);}finally{setBusy(false);}
  }
  function prepare(type, session) {
    setPrepared({type,session,id:type==='fence'?release.artifact.id:session.id,revision:release.lifecycle.revision,compositionId,accessRevokedAt:release.lifecycle.accessRevokedAt});
    setConfirmation('');setReason('');setAck(false);setExternal(false);setNotice('');setError('');
  }
  async function submit(event) {
    event.preventDefault();setBusy(true);setError('');let completed=false;
    try {
      const body={confirmationId:confirmation,reason};let endpoint;
      if(prepared.type==='fence') {
        endpoint='releases/revoke-access';Object.assign(body,{artifactId:prepared.id,expectedRevision:prepared.revision,expectedCompositionId:prepared.compositionId,serviceInterruptionAcknowledged:ack,externalUsageChecked:external});
      }else {
        Object.assign(body,{sessionId:prepared.id,expectedSequence:prepared.session.sequence});
        if(prepared.type==='transition'){endpoint='sessions/transition';body.unsavedInputAcknowledged=ack;}
        else {endpoint='sessions/release-legacy';Object.assign(body,{artifactId:release.artifact.id,expectedAccessRevokedAt:prepared.accessRevokedAt});}
      }
      await request(endpoint,body,csrfToken);completed=true;
      setNotice(prepared.type==='transition'?'전환을 요청했습니다. 전환 문서의 확인 응답이 오기 전에는 참조를 해제하지 않습니다.':prepared.type==='fence'?'이 버전의 파일 접근을 종료했습니다. 파일은 보관되며 24시간 뒤 구형 탭의 이 버전 참조만 정리할 수 있습니다.':'이 버전에 대한 탭 참조만 정리했습니다. 다른 버전 참조는 유지하고 파일은 최소 30일 더 보존합니다.');
      setPrepared(null);await onSaved();
    }catch(cause){setError(`${completed?'작업은 완료했지만 목록 갱신에 실패했습니다. ':''}${cause.message}`);}finally{setBusy(false);}
  }
  const legacy=release.sessions.filter(s=>s.protocol!=='lease-v1'&&(!s.closedAt||s.transition));
  const labels={transition:'구형 탭 전환 요청',fence:'이 버전 파일 접근 종료',release:'이 버전의 구형 탭 참조 정리'};
  return <details className="legacy-controls detail-section"><summary>구형 탭 전환 · 접근 종료 ({legacy.length})</summary>
    <p className="small muted">응답하는 구형 탭은 최신 화면으로 전환합니다. 돌아오지 않는 탭은 버전 접근을 종료한 뒤 해당 버전의 참조만 정리할 수 있습니다.</p>
    <button type="button" className="button secondary" data-testid="install-transition-bridge" disabled={busy} onClick={connect}>이 브라우저의 전환 중계 연결</button>
    {bridge?<p role="status" className="form-success" data-testid="transition-bridge-status">{bridge}</p>:null}
    <p className="field-hint">동일 브라우저·프로필·출처에서만 기존 탭을 전환합니다. 다른 브라우저는 같은 관리 화면에서 중계를 연결하거나 사용자가 직접 새로고침해야 합니다. 전환하면 미저장 입력이 사라질 수 있습니다.</p>
    <ul className="session-list">{legacy.map(session=><li key={session.id} data-testid={`legacy-${session.id}`}><code className="full-artifact-id">{session.id}</code><p className="small">{session.transition?.confirmedAt?'전환 확인 완료':session.transition && Date.parse(session.transition.expiresAt)>Date.now()?'전환 응답 대기':session.releasedAt?'탭 참조 정리 완료':'구형 탭'}</p><p className="small muted">마지막 응답 {stamp(session.lastSeenAt)}<br/>전환 중계 확인 {stamp(session.bridge?.lastSeenAt)}<br/>전환 요청 {stamp(session.transition?.requestedAt)}<br/>전환 확인 {stamp(session.transition?.confirmedAt)}</p>
      <button type="button" className="button secondary" data-testid={`prepare-transition-${session.id}`} disabled={busy||Boolean(session.closedAt||session.releasedAt)||(session.transition&&!session.transition.confirmedAt&&Date.parse(session.transition.expiresAt)>Date.now())} onClick={()=>prepare('transition',session)}>구형 탭 전환 준비</button>
      {session.referenceReleasedAt?<p className="small muted">이 버전 참조 정리 {stamp(session.referenceReleasedAt)} · {session.legacyReleases[release.artifact.id].reason}</p>:<><p className="small muted">이 버전 참조 정리 가능 {stamp(session.legacyCleanup.earliestReleaseAt)}</p><button type="button" className="button secondary" data-testid={`prepare-legacy-release-${session.id}`} disabled={busy||!session.legacyCleanup.eligible} onClick={()=>prepare('release',session)}>이 버전 참조 정리 준비</button><ul className="blocker-list">{session.legacyCleanup.blockers.map(message=><li key={message}>{message}</li>)}</ul></>}
    </li>)}</ul>
    <h3>돌아오지 않는 탭의 버전 접근 종료</h3>
    <p className="small muted">등록 해제와 롤백·고정 참조 정리 후, 보호 탭 참조가 없고 구형 탭 응답도 24시간 이상 없을 때 가능합니다. 서버가 이 버전의 모든 파일 요청을 거절합니다. 이미 받은 코드·다른 호스트·업무 API까지 회수하는 기능은 아닙니다.</p>
    {release.lifecycle.accessRevokedAt?<p className="small" data-testid="access-revoked">파일 접근 종료 {stamp(release.lifecycle.accessRevokedAt)} · {release.lifecycle.accessRevocationReason}</p>:<><button type="button" className="button danger" data-testid="prepare-access-fence" disabled={busy||!release.accessFence.eligible} onClick={()=>prepare('fence')}>버전 접근 종료 준비</button><ul className="blocker-list">{release.accessFence.blockers.map(message=><li key={message}>{message}</li>)}</ul></>}
    {prepared?<form className="retirement-confirm" onSubmit={submit}><h3>{labels[prepared.type]} 확인</h3><code className="full-artifact-id">{prepared.id}</code><label htmlFor="legacy-confirm">구형 탭 작업 대상 전체 ID</label><input id="legacy-confirm" value={confirmation} disabled={busy} onChange={e=>setConfirmation(e.target.value)}/><label htmlFor="legacy-reason">구형 탭 작업 사유</label><textarea id="legacy-reason" rows="2" maxLength="500" value={reason} disabled={busy} onChange={e=>setReason(e.target.value)}/>
      {prepared.type!=='release'?<label className="external-confirm"><input type="checkbox" checked={ack} disabled={busy} onChange={e=>setAck(e.target.checked)}/><span>{prepared.type==='transition'?'대상 탭에 전환을 안내했으며 미저장 입력이 사라질 수 있음을 확인했습니다.':'복귀하는 구형 탭에서 이 버전의 이용이 중단될 수 있음을 확인했습니다.'}</span></label>:null}
      {prepared.type==='fence'?<label className="external-confirm"><input type="checkbox" checked={external} disabled={busy} onChange={e=>setExternal(e.target.checked)}/><span>외부 호스트·업무 API 등 이 서버 밖의 사용과 필요한 접근 차단을 별도로 확인했습니다.</span></label>:null}
      <div className="support-actions"><button type="button" className="text-button" disabled={busy} onClick={()=>setPrepared(null)}>취소</button><button type="submit" className="button primary" data-testid="confirm-legacy-action" disabled={busy||confirmation!==prepared.id||!reason.trim()||(prepared.type!=='release'&&!ack)||(prepared.type==='fence'&&!external)}>{busy?'처리 중…':`${labels[prepared.type]} 실행`}</button></div>
    </form>:null}
    {error?<p role="alert" className="form-error" data-testid="legacy-error">{error}</p>:null}{notice?<p role="status" className="form-success" data-testid="legacy-saved">{notice}</p>:null}
  </details>;
}
