// Served by the local composition host. No service bundle or SDK rebuild.
(() => {
  if (window.__MFE_USAGE_TRACKER__) return;
  window.__MFE_USAGE_TRACKER__ = true;
  const sessionId = crypto.randomUUID();
  let config, sequence = 0, timer, stopped = false;
  async function refreshConfig() {
    const response = await fetch('/api/runtime/config', { cache: 'no-store' });
    if (response.ok) config = await response.json();
  }
  function report(event = 'heartbeat', beacon = false) {
    const runtime = window.__MFE_RUNTIME__;
    if (!config || typeof runtime?.getDiagnostics !== 'function') return;
    const diagnostic = runtime.getDiagnostics();
    const payload = JSON.stringify({ token: config.token, sessionId, sequence: ++sequence, compositionId: diagnostic.compositionId, loadedArtifactIds: diagnostic.loadedContainerIds, event });
    if (beacon && navigator.sendBeacon('/api/runtime/usage', new Blob([payload], { type: 'application/json' }))) return;
    fetch('/api/runtime/usage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
      .then(async (response) => { await response.arrayBuffer(); if (response.status === 403 && !stopped) { await refreshConfig(); report(); } })
      .catch(() => {}); // Missing telemetry must not stop the service.
  }
  async function start() {
    if (stopped) return;
    try {
      if (!config) await refreshConfig();
      if (!config || !window.__MFE_RUNTIME__) { timer = setTimeout(start, 1000); return; }
      report();
      timer = setInterval(report, config.heartbeatMs);
      setTimeout(() => { if (!stopped) report(); }, 1200);
    } catch { timer = setTimeout(start, 3000); }
  }
  addEventListener('pagehide', (event) => {
    if (event.persisted) report('heartbeat', true); // A BFCache page can return.
    else { stopped = true; clearTimeout(timer); clearInterval(timer); report('close', true); }
  });
  addEventListener('pageshow', (event) => { if (event.persisted) report(); });
  document.addEventListener('visibilitychange', () => report('heartbeat', document.visibilityState === 'hidden'));
  start();
})();
