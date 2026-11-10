import { createRuntime, deepFreeze } from './runtime';

async function start() {
  const bootURL = globalThis.__MFE_BOOT_URL__ || '/registry.json';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let registry;
  try {
    const response = await fetch(bootURL, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`Registry unavailable: ${bootURL} (${response.status})`);
    registry = await response.json();
  } finally {
    clearTimeout(timeout);
  }
  if (registry?.shell?.id !== __ARTIFACT_ID__) {
    throw new Error(`Shell snapshot mismatch: expected ${__ARTIFACT_ID__}, received ${registry?.shell?.id || 'none'}`);
  }
  if (globalThis.__MFE_RUNTIME__) throw new Error('A runtime snapshot is already installed for this page.');
  if (globalThis.__MFE_LEASE_REQUIRED__ && !globalThis.__MFE_TAB_GUARD__) throw new Error('탭 보호 기능을 불러오지 못했습니다. 새로고침해 주세요.');
  await globalThis.__MFE_TAB_GUARD__?.start(registry.compositionId);
  const runtime = createRuntime(deepFreeze(registry), { bootURL });
  Object.defineProperty(globalThis, '__MFE_RUNTIME__', {
    value: runtime,
    writable: false,
    configurable: false,
  });
  // Resolve the host's deferred SDK proxy before bootstrap performs its first
  // React render with named imports from that proxy.
  await import('platform/sdk');
  await import('./bootstrap');
}

start().catch((error) => {
  const root = document.getElementById('root');
  root.setAttribute('role', 'alert');
  root.textContent = `초기화 실패: ${error.message}`;
  console.error(error);
});
