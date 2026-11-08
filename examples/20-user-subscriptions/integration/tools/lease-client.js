// The host installs this before Shell. Only a Shell with loader guards opts in.
(() => {
  if (window.__MFE_TAB_GUARD__) return;
  const rawFetch = window.fetch.bind(window);
  const sessionId = crypto.randomUUID();
  let compositionId, config, sequence = 0, managed = false, stopped = false;
  let expired = false, checking = false, wallDeadline = 0, monotonicDeadline = 0;
  let renewal, interval, watchdog, panel;
  const expiredError = () => new Error('이 탭의 사용 기한이 끝났습니다. 최신 화면을 열어 주세요.');
  function show(message) {
    if (!document.body) return;
    document.getElementById('root')?.setAttribute('inert', '');
    if (!panel) {
      panel = document.createElement('section');
      panel.dataset.testid = 'lease-notice'; panel.setAttribute('role', 'alertdialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', '화면 연결 확인');
      panel.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;padding:32px;background:rgba(244,247,252,.97);color:#18243b;font:16px/1.7 system-ui';
      const title = document.createElement('h2'); title.textContent = '화면을 다시 연결해야 합니다';
      const text = document.createElement('p'); text.dataset.message = ''; text.style.maxWidth = '540px';
      const button = document.createElement('button'); button.textContent = '최신 화면 열기'; button.dataset.testid = 'lease-reload';
      button.style.cssText = 'padding:14px 24px;border:0;border-radius:10px;background:#3454dc;color:white;font:inherit;cursor:pointer';
      button.onclick = () => location.replace('/');
      const hint = document.createElement('p'); hint.textContent = '현재 화면은 남겨 두었습니다. 새 화면을 열면 저장하지 않은 입력은 사라질 수 있습니다.'; hint.style.cssText = 'max-width:540px;font-size:13px';
      panel.append(title, text, button, hint); document.body.append(panel);
    }
    panel.querySelector('[data-message]').textContent = message;
  }
  function expire() {
    expired = true; checking = false; clearInterval(interval); clearInterval(watchdog);
    show('오랫동안 연결이 확인되지 않아 이 화면의 조작과 추가 서비스 로딩을 중단했습니다. 최신 화면에서 계속해 주세요.');
  }
  function ensureActive() {
    if (!managed) return;
    if (expired || (wallDeadline && (Date.now() >= wallDeadline || performance.now() >= monotonicDeadline))) { expire(); throw expiredError(); }
    if (checking || !wallDeadline || stopped) throw new Error('화면 연결을 확인하고 있습니다.');
  }
  async function refreshConfig() {
    const response = await rawFetch('/api/runtime/config', {cache: 'no-store', signal: AbortSignal.timeout(10000)});
    if (!response.ok) throw new Error('사용 기한 설정을 읽을 수 없습니다.');
    config = await response.json();
  }
  function payload(event) {
    return { token: config.token, protocol: 'lease-v1', launchToken: window.__MFE_LAUNCH_TOKEN__, sessionId, sequence: ++sequence, compositionId, event,
      loadedArtifactIds: window.__MFE_RUNTIME__?.getDiagnostics().loadedContainerIds || [] };
  }
  async function exchange(event, retry = true) {
    const sentWall = Date.now(), sentMono = performance.now();
    const response = await rawFetch('/api/runtime/usage', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload(event)), cache:'no-store', signal:AbortSignal.timeout(10000)});
    const result = await response.json();
    if (response.status === 403 && retry) { await refreshConfig(); return exchange(event, false); }
    if (response.status === 410 || result.closed) { expire(); throw expiredError(); }
    if (!response.ok) throw new Error(result.error || '연결 확인에 실패했습니다.');
    // Start at request dispatch, not receipt. A delayed response cannot extend
    // the browser's deadline beyond the server's. Wall time covers OS sleep.
    const budget = Date.parse(result.leaseExpiresAt) - Date.parse(result.serverTime) - 5000;
    if (!Number.isFinite(budget) || budget <= 0 || expired) { expire(); throw expiredError(); }
    wallDeadline = sentWall + budget; monotonicDeadline = sentMono + budget;
    if (Date.now() >= wallDeadline || performance.now() >= monotonicDeadline) { expire(); throw expiredError(); }
    checking = false; panel?.remove(); panel = null; document.getElementById('root')?.removeAttribute('inert');
  }
  function renew(validate = false) {
    if (!managed || stopped || expired) return Promise.resolve();
    try {
      if (wallDeadline && (Date.now() >= wallDeadline || performance.now() >= monotonicDeadline)) { expire(); return Promise.resolve(); }
      if (validate) { checking = true; show('서버에 연결하여 이 화면을 계속 사용할 수 있는지 확인하고 있습니다.'); }
      if (!renewal) renewal = exchange('heartbeat').catch(() => {
        if (checking) show('연결을 확인할 수 없습니다. 연결이 복구되면 다시 확인합니다.');
      }).finally(() => { renewal = null; });
      return renewal;
    } catch { expire(); return Promise.resolve(); }
  }
  async function start(id) {
    if (managed) throw new Error('A tab lease is already installed.');
    managed = true; checking = true; compositionId = id;
    try {
      await refreshConfig(); await exchange('open');
      interval = setInterval(() => renew(), config.heartbeatMs);
      watchdog = setInterval(() => { try { ensureActive(); } catch {} }, 1000);
      setTimeout(() => renew(), 1200);
    } catch (error) { expire(); throw error; }
  }
  // Capture before React handlers. Cached containers and module factories also
  // call ensureActive in Shell; UI blocking alone is not the loading boundary.
  for (const type of ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown', 'beforeinput', 'submit']) {
    addEventListener(type, (event) => {
      if (!managed || panel?.contains(event.target)) return;
      try { ensureActive(); } catch { event.preventDefault(); event.stopImmediatePropagation(); }
    }, {capture:true, passive:false});
  }
  window.fetch = (...args) => { try { ensureActive(); return rawFetch(...args); } catch (error) { return Promise.reject(error); } };
  const rawSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) { ensureActive(); return rawSend.apply(this, args); };
  document.addEventListener('freeze', () => { if (managed) checking = true; });
  document.addEventListener('resume', () => renew(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') renew(true); });
  addEventListener('online', () => renew(true));
  addEventListener('pageshow', (event) => { if (event.persisted) renew(true); });
  addEventListener('pagehide', (event) => {
    if (!managed || !config) return;
    if (event.persisted) { checking = true; renew(); return; }
    stopped = true; clearInterval(interval); clearInterval(watchdog);
    navigator.sendBeacon('/api/runtime/usage', new Blob([JSON.stringify(payload('close'))], {type:'application/json'}));
  });
  Object.defineProperty(window, '__MFE_TAB_GUARD__', {value:Object.freeze({start, ensureActive, isManaged:() => managed,
    diagnostics:() => ({sessionId, compositionId, managed, expired, checking, wallDeadline, monotonicDeadline})}), writable:false, configurable:false});
})();
