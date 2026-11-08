import React, { useEffect, useRef, useState } from 'react';
import { changesBetween, makeDraft, pathFor, payloadFor, shortId } from './model';
import LifecyclePanel from './LifecyclePanel';
import ServiceMenus from './ServiceMenus';
import DashboardEditor from './DashboardEditor';
const currentView = () => location.hash === '#lifecycle' ? 'lifecycle' : location.hash === '#dashboard' ? 'dashboard' : location.hash === '#services' ? 'services' : 'composition';

async function request(path, body, csrfToken, signal) {
  const response = await fetch(`/api/admin/${path}`, {
    signal, cache: 'no-store',
    ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MFE-CSRF': csrfToken }, body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || '요청을 처리하지 못했습니다.'), { code: data.code });
  return data;
}
const serviceNames = { A: 'OTA 서비스', C: '정비 서비스' };
function ArtifactLabel({ artifact }) {
  return artifact ? <span className="artifact-label"><strong>{artifact.version}</strong><code title={artifact.id}>{shortId(artifact.id)}</code></span> : <span className="muted">선택 필요</span>;
}
function CurrentGraph({ composition, catalog }) {
  return <section className="surface current-surface" aria-labelledby="current-heading">
    <div className="section-heading"><div><div className="eyebrow">LIVE COMPOSITION</div><h2 id="current-heading">현재 적용된 조합</h2></div><span className="pill green"><i /> 적용 중</span></div>
    <div className="sdk-rail"><span className="node-symbol">◈</span><div><span className="muted small">모든 경로의 공통 기반</span><strong>플랫폼 SDK <span data-testid="current-sdk">{composition.platformVersion}</span></strong></div><code title={composition.selected.platform}>{shortId(composition.selected.platform)}</code></div>
    <div className="current-paths">{['A', 'C'].map((role) => {
      const { app, b, d } = pathFor(composition, catalog, role);
      return <div key={role} className={`current-path path-${role.toLowerCase()}`} data-testid={`current-path-${role}`}>
        <div className="path-service"><span className="service-letter">{role}</span><div><strong>{serviceNames[role]}</strong><span>{app?.version}</span></div></div><span className="connector" aria-hidden="true">→</span>
        <div className="path-node"><span>서비스 B</span><strong data-testid={`current-b-${role}`}>{b?.version || '—'}</strong><code title={b?.id}>{shortId(b?.id)}</code></div><span className="connector" aria-hidden="true">→</span>
        <div className="path-node"><span>의존 서비스 D</span><strong data-testid={`current-d-${role}`}>{d?.version || '—'}</strong><code title={d?.id}>{shortId(d?.id)}</code></div>
      </div>;
    })}</div>
    <details className="metadata"><summary>조합 식별자와 배포 정보</summary><dl><dt>조합</dt><dd data-testid="active-composition">{composition.compositionId}</dd><dt>Shell</dt><dd>{composition.selected.shell}</dd><dt>A / C</dt><dd>{composition.selected.A}<br />{composition.selected.C}</dd></dl></details>
  </section>;
}
function VersionSelect({ id, label, service, value, catalog, disabled, onChange, requirement }) {
  const candidates = Object.values(catalog).filter((artifact) => artifact.service === service && artifact.kind === 'remote' && (!['unregistered', 'deleting', 'deleted'].includes(artifact.selectionState) || artifact.id === value));
  return <div className="version-field"><label htmlFor={id}>{label}</label><select id={id} data-testid={id} value={value || ''} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
    <option value="">버전을 선택하세요</option>{candidates.map((artifact) => <option value={artifact.id} key={artifact.id} disabled={artifact.selectionState && artifact.selectionState !== 'available'}>{artifact.version} · {shortId(artifact.id)}{artifact.selectionState === 'ended' ? ' · 지원 종료' : ['unregistered', 'deleting', 'deleted'].includes(artifact.selectionState) ? ' · 등록 해제' : service === 'b' ? (artifact.runtimeDependencies?.d ? ' · D 선택 가능' : ' · D 고정') : ''}</option>)}
  </select><p className="field-hint">{requirement ? `지원 범위 ${requirement}` : '선택 후 전체 조합의 호환성을 검사합니다.'}</p></div>;
}
function PathEditor({ role, draft, catalog, disabled, onBinding }) {
  const { app, b, d } = pathFor(draft, catalog, role);
  const canSelectB = Boolean(app?.runtimeDependencies?.b);
  const canSelectD = Boolean(b?.runtimeDependencies?.d);
  return <section className={`path-editor path-${role.toLowerCase()}`} aria-label={`${role} 경로 버전 선택`}>
    <div className="path-editor-heading"><span className="service-letter">{role}</span><div><h3>{serviceNames[role]}</h3><p>{role} → B → D</p></div></div>
    {canSelectB ? <VersionSelect id={`select-b-${role}`} label="사용할 B 버전" service="b" value={b?.id} catalog={catalog} disabled={disabled} requirement={app.runtimeDependencies.b.requires} onChange={(value) => onBinding(app.id, 'b', value)} /> : <div className="fixed-version">B <ArtifactLabel artifact={b} /><p>이 배포물의 B 연결은 빌드에 고정되어 있습니다.</p></div>}
    <div className="dependency-line" aria-hidden="true">↓ <span>선택한 B가 사용</span></div>
    {canSelectD ? <VersionSelect id={`select-d-${role}`} label="B가 사용할 D 버전" service="d" value={d?.id} catalog={catalog} disabled={disabled} requirement={b.runtimeDependencies.d.requires} onChange={(value) => onBinding(b.id, 'd', value)} /> : <div className="fixed-version">D <ArtifactLabel artifact={d} /><p>{b ? '이 B의 D 연결은 빌드에 고정되어 있습니다.' : 'B를 선택하면 D를 지정할 수 있습니다.'}</p></div>}
  </section>;
}
function History({ items, busy, rollbackTo, onSelect }) {
  const [query, setQuery] = useState('');
  const [all, setAll] = useState(false);
  const filtered = items.filter((item) => `${item.id} ${item.platformVersion} ${item.paths.map((p) => `${p.b} ${p.d}`).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const shown = all || query ? filtered : filtered.slice(0, 6);
  return <section id="history" className="surface history-surface" aria-labelledby="history-heading">
    <div className="section-heading"><div><div className="eyebrow">SAVED COMPOSITIONS</div><h2 id="history-heading">이전 조합으로 돌아가기</h2><p className="muted">조합을 불러온 뒤 변경 내역을 확인하고 롤백합니다.</p></div><label className="search"><span className="sr-only">조합 이력 검색</span><input type="search" placeholder="버전 또는 조합 검색" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    <div className="history-list">{shown.map((item) => <article key={item.id} className={`history-row ${item.active ? 'is-current' : ''}`} data-testid={`history-${item.id}`}>
      <div className="history-marker" aria-hidden="true">{item.active ? '●' : '◷'}</div><div className="history-info"><div className="history-title"><strong>SDK {item.platformVersion}</strong>{item.active ? <span className="pill green">현재 조합</span> : null}{rollbackTo === item.id ? <span className="pill blue">롤백 준비</span> : null}</div><p>{item.paths.map((p) => `${p.role} → B ${p.b} → D ${p.d}`).join('　 /　 ')} · 등록 메뉴 {item.menuCount || 0}개 · 위젯 {item.widgetCount || 0}개</p><span className="history-date">최초 저장 {new Date(item.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} · <code title={item.id}>{shortId(item.id)}</code></span>{!item.valid ? <p className="history-reason">{item.reason}</p> : null}</div>
      <button className="button secondary compact" disabled={busy || item.active || !item.valid} onClick={() => onSelect(item.id)}>{item.active ? '적용 중' : item.valid ? '불러오기' : '적용 불가'}</button>
    </article>)}</div>
    {!shown.length ? <p className="empty">일치하는 조합이 없습니다.</p> : null}
    {!all && !query && filtered.length > 6 ? <button className="text-button" onClick={() => setAll(true)}>저장된 조합 {filtered.length}개 모두 보기 ↓</button> : null}
    <p className="footnote">표시된 시간은 조합 파일의 최초 저장 시각입니다. 구버전 배포 파일은 롤백 후에도 보존됩니다.</p>
  </section>;
}

export default function AdminApp() {
  const [view, setView] = useState(currentView);
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [review, setReview] = useState(null);
  const [rollbackTo, setRollbackTo] = useState(null);
  const [busy, setBusy] = useState('load');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const editor = useRef(null);
  useEffect(() => {
    const change = () => setView(currentView());
    addEventListener('hashchange', change); return () => removeEventListener('hashchange', change);
  }, []);
  function acceptState(next) { setData(next); setDraft(next.current ? makeDraft(next.current) : null); setReview(null); setRollbackTo(null); }
  useEffect(() => {
    const controller = new AbortController();
    request('state', null, null, controller.signal).then(acceptState).catch((cause) => { if (cause.name !== 'AbortError') setError(cause.message); }).finally(() => { if (!controller.signal.aborted) setBusy(''); });
    return () => controller.abort();
  }, []);
  const catalog = Object.fromEntries((data?.catalog || []).map((artifact) => [artifact.id, artifact]));
  const changes = data?.current && draft ? changesBetween(data.current, draft, catalog) : [];
  async function refreshManagementMetadata() {
    const next = await request('state');
    setData((previous) => ({ ...previous, catalog: next.catalog, history: next.history }));
    setReview(null);
  }
  async function reload() {
    setBusy('load'); setError(''); setNotice('');
    try { acceptState(await request('state')); }
    catch (cause) { setError(cause.message); }
    finally { setBusy(''); }
  }
  function edit(change) { setDraft(change); setReview(null); setError(''); setNotice(''); }
  function bind(owner, alias, target) {
    edit({ ...draft, runtimeBindings: { ...draft.runtimeBindings, [owner]: { ...draft.runtimeBindings[owner], [alias]: target } } });
  }
  async function inspect() {
    setBusy('preview'); setError(''); setNotice(''); setReview(null);
    try {
      const payload = payloadFor(data.current, draft, catalog, rollbackTo);
      const result = await request('preview', payload, data.csrfToken);
      setReview({ ...result, payload });
      setNotice(result.unchanged ? '현재 적용된 조합과 같습니다.' : '선언된 버전 범위와 모든 의존 관계를 확인했습니다. 아래 변경 내역을 적용할 수 있습니다.');
    } catch (cause) { setError(cause.message); }
    finally { setBusy(''); }
  }
  async function apply() {
    if (!review || review.unchanged) return;
    setBusy('apply'); setError(''); setNotice('');
    let applied = false;
    try {
      const result = await request('apply', { ...review.payload, previewedCompositionId: review.composition.compositionId }, data.csrfToken);
      applied = true;
      setData((previous) => ({ ...previous, current: result.composition }));
      setDraft(makeDraft(result.composition)); setReview(null); setRollbackTo(null);
      acceptState(await request('state'));
      setNotice('조합을 적용했습니다. 새로 열린 화면부터 사용하며, 이미 열린 화면은 기존 조합을 유지합니다.');
    } catch (cause) { setReview(null); setError(`${applied ? '조합은 적용됐지만 목록을 갱신하지 못했습니다. ' : ''}${cause.message}`); }
    finally { setBusy(''); }
  }
  async function chooseHistory(id) {
    setBusy('history'); setError(''); setNotice(''); setReview(null);
    try { const snapshot = await request(`compositions/${id}`); setDraft(makeDraft(snapshot)); setRollbackTo(id); editor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    catch (cause) { setError(cause.message); }
    finally { setBusy(''); }
  }
  const locked = Boolean(busy || rollbackTo);
  return <div className="admin-shell">
    <aside className="sidebar"><a className="brand" href="/admin"><span className="brand-icon">M</span>Platform Lab</a><div className="nav-label">WORKSPACE</div><nav aria-label="주 메뉴"><a href="/subscriptions" className="nav-item">사용자별 구독</a><a href="/" className="nav-item"><span aria-hidden="true">◫</span>서비스 화면</a><a href="/admin" className="nav-item active" aria-current="page"><span aria-hidden="true">▤</span>배포 조합 관리</a><a href="/guide" className="nav-item"><span aria-hidden="true">▧</span>구조와 사용 설명서</a></nav><div className="sidebar-foot"><span className="live-dot" /> LOCAL ENVIRONMENT<br /><span>독립 배포 · 런타임 선택</span></div></aside>
    <div className="workspace"><header className="topbar"><span>플랫폼 <span className="slash">/</span> 배포 관리</span><span className="environment"><i /> 로컬 저장소</span></header>
      <main>
        <div className="page-heading"><div><div className="eyebrow">RELEASE CONTROL</div><h1>버전과 의존 관계</h1><p>배포된 버전을 조합하고, 서비스 재빌드 없이 적용하세요.</p></div><div className="heading-actions"><button className="button secondary" onClick={reload} disabled={Boolean(busy)}>↻ 최신 조합 불러오기</button><a className="button secondary" href="/" target="_blank" rel="noreferrer">서비스 화면 ↗</a></div></div>
        <nav className="management-tabs" aria-label="관리 기능"><a href="#composition" aria-current={view === 'composition' ? 'page' : undefined}>조합 관리</a><a href="#services" aria-current={view === 'services' ? 'page' : undefined}>서비스 · 메뉴</a><a href="#dashboard" aria-current={view === 'dashboard' ? 'page' : undefined}>대시보드 위젯</a><a href="#lifecycle" aria-current={view === 'lifecycle' ? 'page' : undefined}>사용 현황 · 지원 종료</a></nav>
        {error && !data?.current ? <div className="alert error" role="alert" data-testid="admin-error"><strong>정보를 확인해 주세요</strong><p>{error}</p></div> : null}
        {!data ? <div className="surface loading" role="status">{busy ? '배포 정보를 불러오고 있습니다…' : '배포 정보를 불러오지 못했습니다. 최신 조합 불러오기를 눌러 주세요.'}</div> : !data.current ? <div className="surface empty">활성화된 서비스 조합이 없습니다. 초기 조합을 먼저 준비해 주세요.</div> : <>
          {view === 'lifecycle' ? <LifecyclePanel request={request} csrfToken={data.csrfToken} onChanged={refreshManagementMetadata} /> : <><CurrentGraph composition={data.current} catalog={catalog} />
          <section className="surface editor-surface" ref={editor} aria-labelledby="editor-heading">
            <div className="section-heading"><div><div className="eyebrow">{rollbackTo ? 'RESTORE COMPOSITION' : 'EDIT COMPOSITION'}</div><h2 id="editor-heading">{rollbackTo ? '이전 조합 검토' : '사용할 버전 선택'}</h2><p className="muted">{rollbackTo ? '저장된 SDK·서비스·의존 관계를 함께 복원합니다.' : '아직 서비스에 적용되지 않았습니다. 선택 후 조합을 검사하세요.'}</p></div><span className={`pill ${changes.length ? 'amber' : ''}`}>{changes.length ? `변경 ${changes.length}개` : '현재 조합과 동일'}</span></div>
            {view === 'composition' ? <><div className="sdk-editor"><div><span className="node-symbol">◈</span><h3>공통 플랫폼 SDK</h3><p>두 경로가 동일한 SDK를 공유합니다.</p></div><VersionSelect id="select-sdk" label="사용할 SDK 버전" service="platform" catalog={catalog} value={draft.selected.platform} disabled={locked} onChange={(value) => edit({ ...draft, selected: { ...draft.selected, platform: value } })} /></div>
            <div className="edit-paths">{['A', 'C'].map((role) => <PathEditor key={role} role={role} draft={draft} catalog={catalog} disabled={locked} onBinding={bind} />)}</div>
            <p className="footnote">같은 B 배포물을 사용하는 경로는 D 선택도 공유합니다. 같은 버전의 배포물은 뒤의 식별자로 구분합니다.</p></> : view === 'dashboard' ? <DashboardEditor draft={draft} current={data.current} catalog={catalog} disabled={locked} onBinding={bind} onChange={dashboard => edit({ ...draft, dashboard })} /> : <ServiceMenus draft={draft} current={data.current} catalog={catalog} disabled={locked} onBinding={bind} onChange={navigation => edit({ ...draft, navigation })} />}
            <div className="review-panel"><div className="review-title"><h3>적용할 변경 내역</h3>{review && !review.unchanged ? <span className="pill green" data-testid="preview-valid">검사 통과</span> : null}</div>
              {changes.length ? <ul className="changes">{changes.map((change) => <li key={change.label}><span>{change.label}</span><div>{change.textFrom ? <span>{change.textFrom}</span> : <ArtifactLabel artifact={change.from} />}<span className="change-arrow" aria-hidden="true">→</span>{change.textTo ? <span>{change.textTo}</span> : <ArtifactLabel artifact={change.to} />}</div></li>)}</ul> : <p className="muted">버전을 선택하면 현재 조합과의 차이를 보여줍니다.</p>}
              {rollbackTo ? <p className="footnote">복원 대상 <code>{rollbackTo}</code></p> : null}
              {error ? <div className="alert error" role="alert" data-testid="admin-error"><strong>변경을 확인해 주세요</strong><p>{error}</p></div> : null}
              {notice ? <div className="alert success" role="status" data-testid="admin-notice">{notice}</div> : null}
            </div>
            <div className="apply-bar"><div><strong>새로 열린 화면부터 적용</strong><p>열려 있는 화면은 처음 받은 조합을 계속 사용합니다.</p></div><div className="apply-actions"><button className="text-button" disabled={Boolean(busy)} onClick={() => { setDraft(makeDraft(data.current)); setRollbackTo(null); setReview(null); setError(''); setNotice(''); }}>선택 초기화</button><button className="button secondary" data-testid="preview" disabled={Boolean(busy) || changes.length === 0} onClick={inspect}>{busy === 'preview' ? '검사 중…' : '조합 검사'}</button><button className="button primary" data-testid="apply" disabled={Boolean(busy) || !review || review.unchanged} onClick={apply}>{busy === 'apply' ? '적용 중…' : rollbackTo ? '이 조합으로 롤백' : '변경 적용'}</button></div></div>
            <p className="footnote">검사는 선언된 지원 범위·의존성·React 조건을 확인합니다. 공개 API 동작의 호환성은 배포 전 검증이 필요합니다.</p>
          </section>
          <History items={data.history} busy={Boolean(busy)} rollbackTo={rollbackTo} onSelect={chooseHistory} /></>}
        </>}
        <footer>Platform Lab · 로컬 배포 조합 관리 <a href="/guide">사용 방법과 검증 범위 ↗</a></footer>
      </main>
    </div>
  </div>;
}
