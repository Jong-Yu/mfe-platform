const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { store, current, read } = require('./store.cjs');
const { handleAdminAPI } = require('./admin-api.cjs');
const { handleRuntimeAPI } = require('./runtime-api.cjs');
const { startObservation } = require('./lifecycle.cjs');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.map': 'application/json', '.png': 'image/png', '.md': 'text/plain; charset=utf-8' };
function send(req, res, file, base, contentType) {
  const artifactRoot = path.join(store, 'artifacts');
  if (file.startsWith(artifactRoot + path.sep)) {
    const id = path.relative(artifactRoot, file).split(path.sep)[0];
    if (read('lifecycle.json', {releases:{}}).releases[id]?.accessRevokedAt) {
      res.writeHead(410, {'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-MFE-Transition':'required'});
      res.end(req.method === 'HEAD' ? undefined : '이 버전은 제공이 종료되었습니다. 최신 화면을 열어 주세요.'); return;
    }
  }
  if (!file.startsWith(`${base}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile() || !fs.realpathSync(file).startsWith(`${fs.realpathSync(base)}${path.sep}`)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  if (path.dirname(file) === path.join(store, 'compositions') && path.extname(file) === '.html') {
    const id = path.basename(file, '.html');
    if (read('composition-retirement.json', {})[id]?.retiredAt) { res.writeHead(410); res.end('This composition is retired.'); return; }
    if (id !== current()?.compositionId) {
      try { const snapshot = read(`compositions/${id}.json`); require('./store.cjs').preview(snapshot.selected, snapshot.runtimeBindings || {}, { replaceBindings: true, navigation: snapshot.navigation || [], dashboard: snapshot.dashboard ?? null }); }
      catch { res.writeHead(410); res.end('This composition can no longer be selected.'); return; }
    }
  }
  res.writeHead(200, { 'Content-Type': contentType || types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  if (req.method === 'HEAD') res.end();
  else if (path.dirname(file) === path.join(store, 'compositions') && path.extname(file) === '.html') {
    const html = fs.readFileSync(file, 'utf8').replace('</head>', '<script>window.__MFE_LEASE_REQUIRED__=true;</script><script src="/runtime-lease.js"></script><script defer src="/runtime-usage.js"></script></head>');
    res.end(html);
  } else fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
}
const server = http.createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); if (pathname.includes('\0') || pathname.includes('\\')) throw new Error('Invalid path'); }
  catch { res.writeHead(400); res.end(); return; }
  try {
    if (await handleAdminAPI(req, res, pathname)) return;
    if (await handleRuntimeAPI(req, res, pathname)) return;
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    if (pathname === '/runtime-usage.js') { send(req, res, path.join(__dirname, 'usage-client.js'), __dirname); return; }
    if (pathname === '/runtime-lease.js') { send(req, res, path.join(__dirname, 'lease-client.js'), __dirname); return; }
    if (pathname === '/transition-worker.js' || pathname === '/transition-page.js') { send(req, res, path.join(__dirname, pathname.slice(1)), __dirname); return; }
    if (/^\/legacy-transition(?:\/[a-f0-9]{64})?$/.test(pathname)) {
      res.writeHead(200, {'Content-Type':types['.html'],'Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'"});
      res.end(req.method === 'HEAD' ? undefined : '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>최신 화면으로 전환</title><link rel="icon" href="data:,"><style>body{margin:0;background:#f4f7fc;color:#18243b;font:16px/1.8 system-ui;min-height:100vh;display:grid;place-items:center}main{max-width:560px;padding:32px}a{display:inline-block;padding:12px 24px;background:#3454dc;color:white;border-radius:10px;text-decoration:none}</style></head><body><main><h1>최신 화면에서 계속해 주세요</h1><p id="transition-status">이전 버전의 제공이 종료되어 구형 화면을 닫았습니다. 최신 화면을 열어 다시 시작해 주세요.</p><p>이전 화면의 저장하지 않은 입력은 복원되지 않습니다.</p><a href="/">최신 화면 열기</a></main><script src="/transition-page.js"></script></body></html>'); return;
    }
    if (['/usage.json', '/lifecycle.json'].includes(pathname)) { res.writeHead(404); res.end(); return; }
    if (pathname === '/admin' || pathname === '/admin/') {
      const admin = read('admin.json', null);
      if (!admin) { res.writeHead(503); res.end('Build the admin app: npm run build:admin'); return; }
      res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
      send(req, res, path.join(store, 'artifacts', admin.artifactId, 'index.html'), store); return;
    }
    if (pathname === '/registry.json') {
      const snapshot = current();
      if (!snapshot) { res.writeHead(503); res.end('No active composition'); return; }
      res.writeHead(200, { 'Content-Type': types['.json'], 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify(snapshot)); return;
    }
    if (pathname === '/') {
      const snapshot = current();
      if (!snapshot) { res.writeHead(503); res.end('No active composition'); return; }
      send(req, res, path.join(store, 'compositions', `${snapshot.compositionId}.html`), store); return;
    }
    const documentationPages = {
      '/guide': 'mfe-platform-versioning-guide.html',
      '/guide/': 'mfe-platform-versioning-guide.html',
      '/docs/mfe-platform-versioning-guide.html': 'mfe-platform-versioning-guide.html',
      '/handbook': 'mfe-project-handbook.html',
      '/operations': 'mfe-runtime-operations.html',
      '/operations/': 'mfe-runtime-operations.html',
      '/docs/mfe-runtime-operations.html': 'mfe-runtime-operations.html',
      '/registry-design': 'mfe-registry-db-design.html',
      '/registry-design/': 'mfe-registry-db-design.html',
      '/docs/mfe-registry-db-design.html': 'mfe-registry-db-design.html',
      '/handbook/': 'mfe-project-handbook.html',
      '/docs/mfe-project-handbook.html': 'mfe-project-handbook.html',
    };
    if (Object.hasOwn(documentationPages, pathname)) {
      const docs = path.resolve(__dirname, '../../docs');
      send(req, res, path.join(docs, documentationPages[pathname]), docs); return;
    }
    if (pathname.startsWith('/reports/') || pathname.startsWith('/integration/artifacts/verification/')) {
      const reports = path.resolve(__dirname, '../artifacts/verification');
      const prefix = pathname.startsWith('/reports/') ? '/reports/' : '/integration/artifacts/verification/';
      send(req, res, path.resolve(reports, pathname.slice(prefix.length)), reports); return;
    }
    const documentationSources = new Set([
      '/integration/tools/dashboard.cjs',
      '/integration/tests/dashboard.mjs',
      '/projects/platform-build-tools/lib/widgets.cjs',
      '/projects/platform-admin/src/DashboardEditor.jsx',
      '/projects/shell/src/RegisteredDashboard.jsx',
      '/integration/tools/navigation.cjs',
      '/integration/tools/navigation-demo.cjs',
      '/integration/tests/navigation.mjs',
      '/projects/platform-admin/src/ServiceMenus.jsx',
      '/projects/shell/src/RegisteredPages.jsx',
      '/integration/scenarios/nested/AWidget.jsx',
      '/integration/scenarios/nested/RemoteRegionProbe.jsx',
      '/projects/platform-sdk/src/RemoteRegion.jsx',
      '/projects/platform-sdk/src/remote-loader.js',
      '/projects/platform-sdk/src/RemoteRegion.module.css',
      '/integration/scenarios/nested/CWidget.jsx',
      '/integration/scenarios/nested/Nested.module.css',
      '/integration/tools/prepare-nested.cjs',
      '/integration/tools/nested-demo.cjs',
      '/integration/tests/nested-graph.mjs',
      '/integration/tests/remote-region-sdk-upgrade.mjs',
      '/integration/tools/remote-region-sdk-demo.cjs',
      '/integration/tools/prepare-onboarding.cjs',
      '/integration/tools/onboarding-demo.cjs',
      '/integration/tests/onboarding.mjs',
      '/integration/scenarios/onboarding/ServiceSlot.jsx',
      '/integration/templates/service-e/src/Widget.jsx',
      '/integration/artifacts/remote-region-sdk-upgrade/baseline.json',
      '/projects/platform-build-tools/bin/mfe-dev.cjs',
      '/projects/platform-build-tools/lib/build.cjs',
      '/projects/platform-build-tools/runtime/retry.cjs',
      '/projects/platform-build-tools/lib/retry-loader.cjs',
      '/projects/platform-build-tools/lib/dev-manifest.cjs',
      '/projects/platform-sdk/src/Layout.module.css',
      '/integration/tools/prepare-dev.cjs',
      '/projects/platform-admin/README.md',
      '/projects/platform-admin/src/LegacyControls.jsx',
      '/projects/platform-admin/src/LifecyclePanel.jsx',
      '/projects/platform-admin/src/RetirementActions.jsx',
      '/projects/platform-admin/src/SessionActions.jsx',
      '/projects/platform-admin/src/admin.css',
      '/projects/platform-admin/src/bootstrap.jsx',
      '/projects/platform-admin/src/index.html',
      '/projects/platform-admin/src/index.js',
      '/projects/platform-admin/src/model.js',
      '/projects/platform-build-tools/README.md',
      '/projects/platform-build-tools/bin/mfe-serve.cjs',
      '/projects/platform-sdk/README.md',
      '/projects/service-a/README.md',
      '/projects/service-a/src/index.jsx',
      '/projects/service-b-v1/README.md',
      '/projects/service-b-v1/src/Widget.jsx',
      '/projects/service-b-v1/src/Widget.module.css',
      '/projects/service-b-v2/README.md',
      '/projects/service-b-v2/src/Widget.jsx',
      '/projects/service-b-v2/src/Widget.module.css',
      '/projects/service-c/README.md',
      '/projects/service-c/src/index.jsx',
      '/projects/service-d-v1/README.md',
      '/projects/service-d-v1/src/index.js',
      '/projects/service-d-v2/README.md',
      '/projects/service-d-v2/src/index.js',
      '/projects/shell/README.md',
      '/projects/shell/src/bootstrap.jsx',
      '/projects/shell/src/index.html',
      '/projects/shell/src/loader.js',
      '/projects/shell/src/shell.css',

      '/projects/platform-build-tools/lib/project.cjs',
      '/projects/platform-build-tools/bin/mfe-build.cjs',
      '/projects/shell/src/index.js',
      '/projects/shell/src/runtime.js',
      '/projects/platform-sdk/src/sdk.jsx',
      '/integration/tools/store.cjs',
      '/integration/tools/admin-api.cjs',
      '/integration/tools/lifecycle.cjs',
      '/integration/tools/retirement.cjs',
      '/integration/tools/lease-client.js',
      '/integration/tools/legacy.cjs',
      '/integration/tools/transition-worker.js',
      '/projects/platform-admin/src/AdminApp.jsx',
      '/integration/README.md',
    ]);
    if (documentationSources.has(pathname)) {
      const repository = path.resolve(__dirname, '../..');
      send(req, res, path.resolve(repository, `.${pathname}`), repository, 'text/plain; charset=utf-8'); return;
    }
    const subtree = pathname.startsWith('/artifacts/') ? 'artifacts' : pathname.startsWith('/compositions/') ? 'compositions' : null;
    if (subtree) {
      const base = path.join(store, subtree);
      send(req, res, path.resolve(base, pathname.slice(subtree.length + 2)), base);
    } else if (['/catalog.json', '/current.json', '/admin.json'].includes(pathname)) {
      send(req, res, path.resolve(store, `.${pathname}`), store);
    } else { res.writeHead(404); res.end('Not found'); }
  } catch (error) { res.writeHead(500); res.end(error.message); }
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => { startObservation(); console.log(`MF proof: http://127.0.0.1:${server.address().port}`); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
