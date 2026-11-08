import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PlatformProvider, DevLayout, PageContainer, ReactIdentity, getRuntimeSnapshot } from 'platform/sdk';

const runtime = globalThis.__MFE_RUNTIME__;
const registry = runtime.registry;
await __webpack_init_sharing__('default');
const container = await runtime.getArtifactContainer(registry.local);
await container.init(__webpack_share_scopes__.default);
const module = (await container.get(registry.dev.module))();
const Component = module.default;
if (typeof Component !== 'function' && typeof Component !== 'object') throw new Error('개발 모듈에는 React default export가 필요합니다.');
globalThis.__MFE_DEV__ = {
  registry, getSnapshot: getRuntimeSnapshot, getDiagnostics: runtime.getDiagnostics,
  sdkReactMatches: React === ReactIdentity,
  getIdentity: typeof module.getIdentity === 'function' ? module.getIdentity : undefined,
};
class PreviewBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() { return this.state.error ? <p role="alert">서비스 화면 오류: {this.state.error.message}</p> : this.props.children; }
}
function App() {
  const [theme, setTheme] = useState(registry.dev.theme || 'light');
  const [copies, setCopies] = useState(1);
  const [generation, setGeneration] = useState(0);
  const tools = <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontSize: 13 }}>
    <label>테마 <select aria-label="개발 테마" value={theme} onChange={e => setTheme(e.target.value)}><option value="light">밝게</option><option value="dark">어둡게</option></select></label>
    <button type="button" onClick={() => setCopies(n => n === 1 ? 2 : 1)}>{copies === 1 ? '인스턴스 복제' : '복제 제거'}</button>
    <button type="button" onClick={() => setGeneration(n => n + 1)}>다시 마운트</button>
    <span>저장하면 자동 새로고침 · 입력은 초기화됩니다</span>
  </div>;
  const preview = <div style={{ display: 'grid', gap: 20 }}>{Array.from({ length: copies }, (_, i) =>
    <PreviewBoundary key={`${generation}:${i}`}><Component instanceId={`dev-${i + 1}`} /></PreviewBoundary>)}</div>;
  return <PlatformProvider user={registry.dev.user} theme={theme}>
    <DevLayout serviceName={registry.dev.title} tools={tools}>
      {registry.dev.pageContainer === false ? preview : <PageContainer title={registry.dev.title} description={registry.dev.description}>{preview}</PageContainer>}
    </DevLayout>
  </PlatformProvider>;
}
createRoot(document.getElementById('root')).render(<App />);

const events = new EventSource('/__dev/events');
const status = document.getElementById('build-status');
events.onmessage = event => {
  const next = JSON.parse(event.data);
  if (next.type === 'error') { status.hidden = false; status.textContent = `빌드 오류 — 마지막 성공 화면을 유지합니다.\n${next.message}`; }
  else if (next.type === 'ready' && next.id !== registry.compositionId) location.reload();
  else if (next.type === 'ready') status.hidden = true;
};
window.addEventListener('pagehide', () => events.close(), { once: true });
