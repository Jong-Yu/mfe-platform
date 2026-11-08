import React, { useEffect, useRef, useState } from 'react';
import { shortId } from './model';
import RetirementActions from './RetirementActions';
import SessionActions from './SessionActions';
import LegacyControls from './LegacyControls';

const names = { platform: 'SDK', shell: 'Shell', a: 'A', b: 'B', c: 'C', d: 'D' };
const supportNames = { unscheduled: '종료일 미정', scheduled: '종료 예정', ended: '지원 종료' };
const registrationNames = { unregistered: '등록 해제 · 파일 보관', deleting: '삭제 미완료', deleted: '파일 삭제 완료' };
const stamp = (value) => value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '기록 없음';
function pathLabel(path, catalog) {
  return path.map((id) => { const a = catalog[id]; return a ? `${names[a.service] || a.service} ${a.version}` : id; }).join(' → ');
}
function SupportEditor({ release, request, csrfToken, onSaved }) {
  const [form, setForm] = useState(release.lifecycle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = await request('lifecycle', { artifactId: release.artifact.id, expectedRevision: form.revision, supportEndsOn: form.supportEndsOn || null, noticeReference: form.noticeReference }, csrfToken);
      setForm(result.lifecycle); setNotice('지원 정책을 저장했습니다. 서비스 조합과 배포 파일은 유지됩니다.');
      await onSaved();
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }
  return <form className="support-editor" onSubmit={save}>
    <h3>지원 종료 계획</h3>
    <label htmlFor="support-end">지원 종료 예정일 <span>한국 시간 · 해당 날짜까지 지원</span></label>
    <input id="support-end" type="date" value={form.supportEndsOn || ''} disabled={busy} onChange={(event) => { setForm({ ...form, supportEndsOn: event.target.value }); setNotice(''); }} />
    <label htmlFor="notice-reference">공지 기록 <span>공지 링크 또는 내부 기록 식별자</span></label>
    <textarea id="notice-reference" rows="2" maxLength="1000" value={form.noticeReference} disabled={busy} placeholder="예: 릴리스 공지 URL 또는 공지 기록 번호" onChange={(event) => { setForm({ ...form, noticeReference: event.target.value }); setNotice(''); }} />
    <p className="field-hint">이 화면은 공지를 전송하지 않습니다. 종료일·공지 내용을 변경하면 공지 유예 기간을 저장 시점부터 다시 계산합니다.</p>
    <p className="small muted">공지 기록 시각 {stamp(release.lifecycle.noticeRecordedAt)}</p>
    {form.revision !== release.lifecycle.revision ? <p className="history-reason">다른 곳에서 정책을 변경했습니다. 최신 정책을 불러온 뒤 다시 입력하세요.</p> : null}
    {error ? <p role="alert" className="form-error" data-testid="lifecycle-error">{error}</p> : null}
    {notice ? <p role="status" className="form-success" data-testid="lifecycle-saved">{notice}</p> : null}
    <div className="support-actions"><button type="button" className="text-button" disabled={busy} onClick={() => { setForm(release.lifecycle); setError(''); setNotice(''); }}>최신 정책 불러오기</button><button type="submit" className="button primary" disabled={busy}>{busy ? '저장 중…' : '지원 정책 저장'}</button></div>
  </form>;
}
function ReleaseDetail({ release, catalog, request, csrfToken, onSaved, compositionId }) {
  const a = release.artifact;
  const open = release.sessions.filter((item) => !['closed', 'released'].includes(item.status));
  return <section className="surface release-detail" aria-label="선택한 배포물 상세" data-testid="release-detail">
    <div className="eyebrow">RELEASE DETAIL</div><h2>{names[a.service] || a.service} {a.version}</h2><code className="full-artifact-id">{a.id}</code>
    <div className="detail-section"><h3>현재 사용하는 서비스</h3>{release.currentPaths.length ? <ul className="usage-paths">{release.currentPaths.map((item, index) => <li key={index}>{pathLabel(item.path, catalog)}</li>)}</ul> : <p className="muted small">현재 조합에서는 사용하지 않습니다.</p>}</div>
    <div className="detail-section" data-testid="saved-subscription-references"><h3>저장된 사용자 구독</h3><p className="small muted">로그인·접속 여부와 관계없이 구독을 해제하거나 다른 버전으로 전환할 때까지 보호합니다.</p>{release.subscriptions?.length ? <ul>{release.subscriptions.map(sub => <li key={sub.userId}><strong>{sub.userName}</strong> · 변경 번호 {sub.revision}<p>{sub.paths.map(item => pathLabel(item.path,catalog)).join(' / ')}</p></li>)}</ul> : <p>이 배포물을 사용하는 저장된 구독이 없습니다.</p>}</div>
    <div className="detail-section"><h3>열린 탭에서 필요한 버전</h3><p className="small muted">최근 응답 {release.recentTabs} · 응답 끊김 {release.unknownTabs} · 최근 탭 중 코드 로드 확인 {release.loadedTabs}</p>
      {open.length ? <ul className="session-list">{open.map((session) => <li key={session.id}><div><span className={`pill ${session.status === 'recent' ? 'blue' : 'amber'}`}>{session.status === 'recent' ? '최근 응답' : '종료 여부 확인 불가'}</span><span className="small muted">{session.loaded ? '코드 로드 확인' : '아직 로드되지 않음 · 지연 로딩 보호'}</span></div><p>{session.paths.map((item) => pathLabel(item.path, catalog)).join(' / ')}</p><code>{shortId(session.compositionId)}</code><span className="small muted"> · 마지막 응답 {stamp(session.lastSeenAt)}</span></li>)}</ul> : <p className="small muted">관측된 열린 탭이 없습니다. 추적 도입 전 탭과 외부 호스트는 확인 범위 밖입니다.</p>}
    </div>
    <div className="detail-section deletion-assessment"><div className="review-title"><h3>삭제 가능 여부</h3><span className={`pill ${release.deletion.eligibleForReview ? 'green' : 'amber'}`} data-testid="deletion-state">{release.registrationState === 'deleted' ? '파일 삭제 완료' : release.deletion.eligibleForReview ? '삭제 검토 가능' : '삭제 보류'}</span></div>
      <ul className="blocker-list">{release.deletion.blockers.map((item) => <li key={item.code} data-blocker={item.code}>{item.message}</li>)}</ul>
      {release.deletion.earliestReviewAt ? <p className="small muted">기간 조건 충족 예상: {stamp(release.deletion.earliestReviewAt)}<br />사용·참조 조건도 모두 해소되어야 합니다.</p> : null}
      <p className="field-hint">삭제 검토 가능은 관측 범위의 후보 판정입니다. 실행 직전에 참조를 다시 확인하며, 관측 범위 밖의 사용 확인도 필요합니다.</p>
    </div>
    <SessionActions sessions={release.sessions} request={request} csrfToken={csrfToken} onSaved={onSaved} />
    <LegacyControls release={release} compositionId={compositionId} request={request} csrfToken={csrfToken} onSaved={onSaved} />
    <RetirementActions release={release} compositionId={compositionId} request={request} csrfToken={csrfToken} onSaved={onSaved} />
    {release.registrationState === 'registered' ? <SupportEditor release={release} request={request} csrfToken={csrfToken} onSaved={onSaved} /> : <p className="small muted">지원 종료일 {release.lifecycle.supportEndsOn} · 등록 해제 후에는 지원 정책을 수정할 수 없습니다.</p>}
  </section>;
}
export default function LifecyclePanel({ request, csrfToken, onChanged }) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(''), [service, setService] = useState('all'), [filter, setFilter] = useState('all'), [selected, setSelected] = useState(null);
  const detail = useRef(null);
  async function reload(signal) {
    try { const next = await request('lifecycle', null, null, signal); setData(next); setError(''); }
    catch (cause) { if (cause.name !== 'AbortError') setError(`사용 현황을 갱신하지 못했습니다. ${cause.message}`); }
  }
  async function afterMutation() { await reload(); await onChanged?.(); }
  useEffect(() => {
    const controller = new AbortController(); let timer;
    async function poll() { await reload(controller.signal); if (!controller.signal.aborted) timer = setTimeout(poll, 10000); }
    poll(); return () => { controller.abort(); clearTimeout(timer); };
  }, []);
  useEffect(() => { if (detail.current) detail.current.scrollTop = 0; if (selected && matchMedia('(max-width: 1200px)').matches) detail.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [selected]);
  const catalog = Object.fromEntries((data?.releases || []).map((item) => [item.artifact.id, item.artifact]));
  const releases = [...(data?.releases || [])].sort((a, b) => Number(Boolean(b.currentPaths.length)) - Number(Boolean(a.currentPaths.length)) || a.artifact.service.localeCompare(b.artifact.service) || b.artifact.version.localeCompare(a.artifact.version, undefined, { numeric: true }) || a.artifact.id.localeCompare(b.artifact.id));
  const visible = releases.filter((item) => (service === 'all' || item.artifact.service === service) && `${names[item.artifact.service]} ${item.artifact.version} ${item.artifact.id}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || (filter === 'current' && item.currentPaths.length) || (filter === 'tabs' && item.recentTabs + item.unknownTabs > 0) || (filter === 'ended' && item.supportStatus === 'ended') || (filter === 'candidate' && item.deletion.eligibleForReview) || (['unregistered', 'deleting', 'deleted'].includes(filter) && item.registrationState === filter)));
  const focused = releases.find((item) => item.artifact.id === selected);
  return <div className="lifecycle-panel" data-testid="lifecycle-panel">
    <section className="surface lifecycle-intro"><div className="section-heading"><div><div className="eyebrow">USAGE & SUPPORT</div><h2>버전별 사용 현황과 지원 종료</h2><p className="muted">현재 선택, 사용자 구독, 열린 탭, 롤백 참조를 함께 확인합니다.</p></div><button className="button secondary" disabled={busy} onClick={async () => { setBusy(true); await reload(); setBusy(false); }}>사용 현황 새로고침</button></div>
      <div className="lifecycle-stats"><div><strong>{releases.filter((item) => item.currentPaths.length).length}</strong><span>현재 조합의 배포물</span></div><div><strong>{releases.filter((item) => item.recentTabs + item.unknownTabs > 0).length}</strong><span>열린 탭에서 필요한 배포물</span></div><div><strong>{releases.filter((item) => item.supportStatus === 'scheduled').length}</strong><span>지원 종료 예정</span></div><div><strong>{releases.filter((item) => item.deletion.eligibleForReview).length}</strong><span>삭제 검토 후보</span></div></div>
      {data ? <p className="footnote">관측 시작 {stamp(data.observationStartedAt)} · 갱신 {stamp(data.generatedAt)} · 10초마다 갱신<br />공지 기록 후 최소 {data.policy.noticeDays}일 유예 · 등록 해제 후에도 최소 {data.policy.retentionDays}일 보존 · 관측 시작 후 최소 {data.policy.observationDays}일. 응답이 {data.policy.staleSeconds}초 넘게 끊겨도 바로 보호를 해제하지 않습니다. 재개 보호 탭은 사용 기한 {data.policy.leaseSeconds / 60}분 만료 후 {data.policy.sessionGraceHours}시간이 지나면 별도로 정리할 수 있으며, 정리 후에도 {data.policy.retentionDays}일 보존합니다.<br />이 서버에서 추적 도입 후 새로 연 서비스 화면을 관측합니다. 이전부터 열린 탭·외부 호스트의 사용 여부는 별도 확인이 필요합니다.</p> : null}
      {error ? <p role="alert" className="form-error">{error} {data ? '아래는 마지막으로 받은 정보입니다.' : ''}</p> : null}
    </section>
    <div className="lifecycle-filters"><label><span className="sr-only">배포물 검색</span><input type="search" placeholder="서비스·버전·배포 ID 검색" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div><label htmlFor="usage-service" className="sr-only">서비스 필터</label><select id="usage-service" value={service} onChange={(event) => setService(event.target.value)}><option value="all">모든 서비스</option>{Object.entries(names).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><label htmlFor="usage-status" className="sr-only">사용 상태 필터</label><select id="usage-status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">모든 상태</option><option value="current">현재 조합에서 사용</option><option value="tabs">열린 탭에서 필요</option><option value="ended">지원 종료</option><option value="candidate">삭제 검토 가능</option><option value="unregistered">등록 해제 · 파일 보관</option><option value="deleting">삭제 미완료</option><option value="deleted">파일 삭제 완료</option></select></div></div>
    <div className="lifecycle-workspace"><section className="surface release-list" aria-label="버전별 배포물 목록"><p className="small muted">{visible.length}개 배포물 · 선택하면 사용 경로와 보류 사유를 표시합니다.</p>
      {visible.map((item) => <button type="button" className={`release-row ${selected === item.artifact.id ? 'selected' : ''}`} key={item.artifact.id} data-testid={`release-${item.artifact.id}`} aria-pressed={selected === item.artifact.id} onClick={() => setSelected(item.artifact.id)}>
        <span className="release-name"><strong>{names[item.artifact.service] || item.artifact.service} {item.artifact.version}</strong><code>{shortId(item.artifact.id)}</code></span>
        <span className="release-usage"><strong>{item.currentPaths.length ? `현재 ${item.currentPaths.length}개 경로` : '현재 조합 미사용'}</strong><span>최근 탭 {item.recentTabs} · 확인 불가 {item.unknownTabs}</span><span>저장 구독 {item.subscriptions?.length || 0} · 롤백 참조 {item.history.length}</span></span>
        <span className="release-status"><span className={`pill ${item.supportStatus === 'ended' ? 'amber' : item.supportStatus === 'scheduled' ? 'blue' : ''}`}>{supportNames[item.supportStatus]}</span><span>{item.lifecycle.supportEndsOn || '날짜 미지정'}</span>{registrationNames[item.registrationState] ? <span>{registrationNames[item.registrationState]}</span> : null}<span className={item.deletion.eligibleForReview ? 'eligible' : 'muted'}>{item.registrationState === 'deleted' ? '작업 기록 보존' : item.deletion.eligibleForReview ? '삭제 검토 가능' : '삭제 보류'}</span></span>
      </button>)}{!data ? <p className="empty">사용 현황을 불러오고 있습니다…</p> : !visible.length ? <p className="empty">조건에 맞는 배포물이 없습니다.</p> : null}
    </section><div className="release-detail-wrap" ref={detail}>{focused ? <ReleaseDetail key={focused.artifact.id} release={focused} catalog={catalog} request={request} csrfToken={csrfToken} onSaved={afterMutation} compositionId={data.compositionId} /> : <section className="surface empty detail-placeholder"><span>◈</span><h3>배포물을 선택하세요</h3><p>사용 경로, 열린 탭, 지원 종료 계획과<br />삭제 보류 사유를 확인할 수 있습니다.</p></section>}</div></div>
  </div>;
}
