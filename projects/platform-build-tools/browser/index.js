import { createRuntime, deepFreeze } from './runtime';

async function start() {
  const response = await fetch(globalThis.__MFE_DEV_BOOT__, { cache: 'no-store' });
  if (!response.ok) throw new Error(`개발 조합을 불러오지 못했습니다 (${response.status}).`);
  const snapshot = deepFreeze(await response.json());
  Object.defineProperty(globalThis, '__MFE_RUNTIME__', { value: createRuntime(snapshot, { bootURL: globalThis.__MFE_DEV_BOOT__ }) });
  await import('./bootstrap');
}
start().catch(error => {
  const root = document.getElementById('root');
  root.setAttribute('role', 'alert');
  root.textContent = `개발 화면 시작 실패: ${error.message}`;
  console.error(error);
});
