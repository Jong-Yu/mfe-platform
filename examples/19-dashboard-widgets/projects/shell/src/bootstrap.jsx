import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PlatformProvider, PlatformContext, ReactIdentity, usePlatform, getRuntimeSnapshot, emitDemoEvent } from 'platform/sdk';
import { loadRemote } from './loader';
import './shell.css';
import RegisteredPages, { useServiceRoute } from './RegisteredPages';
import RegisteredDashboard from './RegisteredDashboard';

const runtime = globalThis.__MFE_RUNTIME__;
const registry = runtime.registry;
const identityRecords = new Map();
const loadedArtifacts = new Set([registry.artifacts.platform.id]);
const mountOrder = [];
const recordMount = (id) => mountOrder.push(id);
const describeChain = (role) => {
  const app = registry.applications[role];
  const b = registry.artifacts[registry.runtimeBindings[app.id].b];
  const d = registry.artifacts[registry.runtimeBindings[b.id]?.d || b.dependencies.d];
  return `${role} → B ${b.version} → D ${d.version}`;
};

window.__MFE_PROOF__ = {
  registry,
  compositionId: registry.compositionId,
  platformArtifactId: registry.artifacts.platform.id,
  getRuntimeDiagnostics: runtime.getDiagnostics,
  getSnapshot: getRuntimeSnapshot,
  mountOrder,
  get loadedArtifacts() { return [...loadedArtifacts]; },
  identities() {
    const activeIds = new Set(getRuntimeSnapshot().activeInstances.map((scope) => scope.instanceId));
    return [...identityRecords].filter(([id]) => activeIds.has(id)).map(([instanceId, identity]) => ({
      instanceId,
      reactMatches: identity.react === React && identity.consumerReact === React && ReactIdentity === React,
      contextMatches: identity.context === PlatformContext,
      artifactId: identity.artifactId,
      dependencyArtifact: identity.dependencyArtifact,
    }));
  },
};

class WidgetErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() { return this.state.error ? <div role="alert" className="error">{this.state.error.message}</div> : this.props.children; }
}

function App() {
  const platform = usePlatform();
  const route = useServiceRoute();
  const menus = registry.navigation || [];
  const proofRoute = registry.dashboard === undefined ? '/' : '/verification';
  const dashboardActive = route === '/dashboard' || (route === '/' && registry.dashboard !== undefined);
  const [dashboardVisited, setDashboardVisited] = useState(dashboardActive);
  const proofStarted = useRef(false);
  useEffect(() => { if (dashboardActive) setDashboardVisited(true); }, [dashboardActive]);
  const [widgets, setWidgets] = useState([]);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState({});
  const [eventNotifications, setEventNotifications] = useState(0);

  async function add(id) {
    const appId = id.startsWith('A') ? 'A' : 'C';
    const artifact = registry.applications[appId];
    setPending(true);
    setErrors((current) => { const next = { ...current }; delete next[id]; return next; });
    try {
      const module = await loadRemote(artifact, './Widget');
      const identity = module.getIdentity();
      identityRecords.set(id, identity);
      for (const item of [artifact.id, identity.artifactId, identity.dependencyArtifact]) loadedArtifacts.add(item);
      setWidgets((current) => current.some((widget) => widget.id === id) ? current : [...current, { id, Component: module.default }]);
      // Wait for a committed mount, not just a resolved import, before loading the next app.
      await new Promise((resolve, reject) => {
        const deadline = Date.now() + 5000;
        const check = () => {
          if (getRuntimeSnapshot().activeInstances.some((scope) => scope.instanceId === id)) return resolve();
          if (Date.now() > deadline) return reject(new Error(`${id}: widget did not mount`));
          requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      });
    } catch (cause) { setErrors((current) => ({ ...current, [id]: cause.message })); console.error(cause); }
    finally { setPending(false); }
  }

  useEffect(() => {
    if (route !== proofRoute || proofStarted.current) return;
    proofStarted.current = true;
    const params = new URLSearchParams(location.search);
    if (params.get('empty') === '1') return;
    const order = params.get('order') === 'ca' ? ['C', 'A'] : ['A', 'C'];
    (async () => { for (const id of order) await add(id); })();
  }, [route, proofRoute]);

  const has = (id) => widgets.some((widget) => widget.id === id);
  const remove = (id) => setWidgets((current) => current.filter((widget) => widget.id !== id));

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandIcon">M</span> Platform Lab</div>
        <div className="navLabel">WORKSPACE</div>
        <nav aria-label="서비스 메뉴">
          <a href="#/dashboard" className={`navItem ${dashboardActive ? 'active' : ''}`} aria-current={dashboardActive ? 'page' : undefined} data-testid="dashboard-link">▦ 대시보드</a>
          <a href={`#${proofRoute}`} className={`navItem ${route === proofRoute ? 'active' : ''}`} aria-current={route === proofRoute ? 'page' : undefined}>◫ <span>버전 공존 검증</span></a>
          {menus.map(item => <a key={item.id} href={`#${item.path}`} className={`navItem ${route === item.path ? 'active' : ''}`}
            aria-current={route === item.path ? 'page' : undefined} data-testid={`menu-link-${item.id}`}>{item.label}</a>)}
        </nav>
        <a className="navItem" href="/admin#services">▤ <span>서비스·메뉴 관리</span></a>
        <div className="sidebarFoot">PLATFORM {platform.platformVersion}<br /><span>공통 React · 공통 SDK</span></div>
      </aside>
      <div className="workspace">
        <header className="header"><span>검증 환경 <span className="headerSlash">/</span> Module Federation</span><span className="user"><span className="avatar">{platform.user.name.slice(0, 1)}</span> {platform.user.name}</span></header>
        <main className="main">
          {dashboardVisited || dashboardActive ? <div hidden={!dashboardActive}><RegisteredDashboard placements={registry.dashboard || []} artifacts={registry.artifacts} /></div> : null}
          <div hidden={route !== proofRoute}>
          <div className="pageEyebrow">EXECUTABLE PROOF</div>
          <h1>다른 버전, 하나의 플랫폼</h1>
          <p className="intro">{describeChain('A')}과 {describeChain('C')}을 실제 원격 번들로 불러옵니다.</p>
          <div className="statusStrip"><span><i /> 플랫폼 SDK {platform.platformVersion}</span><span>등록 서비스 메뉴 {menus.length}개</span><span>공통 React 인스턴스</span></div>
          <div className="toolbar">
            <div className="toolbarGroup">
              <button data-testid="add-a" disabled={pending || has('A')} onClick={() => add('A')}>A 불러오기</button>
              <button data-testid="add-c" disabled={pending || has('C')} onClick={() => add('C')}>C 불러오기</button>
              <button data-testid="add-a-copy" disabled={pending || has('A-copy')} onClick={() => add('A-copy')}>A 위젯 복제</button>
            </div>
            <button data-testid="emit-event" onClick={() => setEventNotifications(emitDemoEvent())}>공통 이벤트 보내기</button>
          </div>
          <div className="smallStatus">마운트된 위젯 {widgets.length}개 · 마지막 이벤트 수신 {eventNotifications}개 {pending && '· 불러오는 중…'}</div>
          {Object.entries(errors).map(([id, message]) => <div key={id} role="alert" className="error">{id}: {message}</div>)}
          <section className="widgetGrid" aria-label="서비스 위젯">
            {widgets.map(({ id, Component }) => <div key={id} className="widgetSlot">
              <div className="slotHead"><span>{id === 'C' ? '정비 서비스' : 'OTA 서비스'} / {id}</span><button data-testid={`remove-${id.toLowerCase()}`} onClick={() => remove(id)}>제거 ×</button></div>
              <WidgetErrorBoundary><Component instanceId={id} onMounted={recordMount} /></WidgetErrorBoundary>
            </div>)}
          </section>
          <div className="explanation"><strong>직접 확인하기</strong><p>한쪽 카운터와 메모만 변경해 보세요. 다른 위젯의 상태와 색상은 그대로 유지됩니다. 팝업을 연 채 위젯을 제거하거나, 같은 버전의 A 위젯을 복제해도 각 인스턴스가 분리됩니다.</p><a href={globalThis.__MFE_BOOT_URL__ || '/registry.json'} target="_blank" rel="noreferrer">이 페이지의 배포 구성 보기 ↗</a></div>
          </div>
          <RegisteredPages menus={menus} route={dashboardActive || route === proofRoute ? '/' : route} />
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<PlatformProvider><App /></PlatformProvider>);
