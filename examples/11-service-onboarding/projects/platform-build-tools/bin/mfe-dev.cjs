#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const webpack = require('webpack');
const { readProject, inside } = require('../lib/project.cjs');
const { buildProject, sharedDependencies } = require('../lib/build.cjs');
const { readDevKit, createDevSnapshot } = require('../lib/dev-manifest.cjs');

async function buildHost(project, directory) {
  const browser = path.resolve(__dirname, '../browser');
  const { shared } = sharedDependencies(project);
  const compiler = webpack({
    mode: 'development', devtool: 'source-map', context: project.root,
    entry: path.join(browser, 'index.js'),
    output: { path: directory, filename: 'host.js', chunkFilename: '[name].[contenthash].js', publicPath: '/__dev/host/', uniqueName: 'mfe_development_host' },
    resolve: { extensions: ['.js', '.jsx'], modules: [path.join(project.root, 'node_modules'), 'node_modules'] },
    module: { rules: [{ test: /\.jsx?$/, include: browser, use: { loader: require.resolve('babel-loader'), options: { babelrc: false, configFile: false, presets: [[require.resolve('@babel/preset-react'), { runtime: 'classic' }]] } } }] },
    plugins: [new webpack.container.ModuleFederationPlugin({ name: 'mfe_development_host', remotes: { platform: 'promise globalThis.__MFE_RUNTIME__.getContainer("platform")' }, shared })],
    performance: { hints: false }, stats: 'errors-warnings',
  });
  await new Promise((resolve, reject) => compiler.run((error, stats) => compiler.close(closeError => {
    if (error || closeError || stats?.hasErrors()) reject(error || closeError || new Error(stats.toString({ all: false, errors: true })));
    else resolve();
  })));
}
async function main() {
  const root = fs.realpathSync(process.cwd());
  const initial = readProject(root);
  if (initial.config.kind !== 'remote' || initial.config.service === 'platform') throw new Error('mfe-dev is for UI service remotes.');
  const work = path.join(root, '.mfe-dev');
  if (fs.existsSync(work) && fs.lstatSync(work).isSymbolicLink()) throw new Error('Refusing a symlinked .mfe-dev directory.');
  fs.mkdirSync(work, { recursive: true });
  const port = Number(process.env.PORT || initial.config.port || 4200);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid development PORT.');
  const builds = new Map(), snapshots = new Map(), remoteFiles = new Map(), clients = new Set();
  let current, lastEvent, watcher, timer, stopped = false, running = false, queued = false;
  function broadcast(event) { lastEvent = event; for (const client of clients) client.write(`data: ${JSON.stringify(event)}\n\n`); }
  async function rebuild() {
    const kit = readDevKit(root);
    const input = readProject(root);
    if (!input.exposes[kit.settings.module]) throw new Error(`Local module is not exposed: ${kit.settings.module}`);
    const { runtimeRequirements } = sharedDependencies(input);
    Object.assign(input.release.runtimeRequirements, runtimeRequirements);
    createDevSnapshot(kit, input.release); // Reject incompatible kits before compiling.
    let project = builds.get(input.release.id)?.project;
    if (!project) {
      project = await buildProject({ root, outputDirectory: release => path.join(work, 'builds', release.id) });
      builds.set(project.release.id, { directory: project.dist, project });
    }
    const snapshot = createDevSnapshot(kit, project.release);
    snapshot.compositionId = `dev_${crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex').slice(0, 24)}`;
    snapshots.set(snapshot.compositionId, snapshot);
    for (const [url, file] of kit.fileMap) remoteFiles.set(url, file);
    current = snapshot;
    broadcast({ type: 'ready', id: current.compositionId });
    console.log(`Dev ready: ${project.release.id} / SDK ${snapshot.platformVersion}`);
  }
  async function schedule() {
    if (stopped) return;
    queued = true;
    if (running) return;
    running = true;
    try {
      while (queued && !stopped) {
        queued = false;
        try { await rebuild(); }
        catch (error) { console.error(`Development build failed: ${error.message}`); broadcast({ type: 'error', message: error.message }); }
      }
    } finally { running = false; }
  }
  await rebuild();
  const hostDirectory = path.join(work, 'host');
  await buildHost(initial, hostDirectory);
  const types = { '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.map': 'application/json; charset=utf-8' };
  function reply(req, res, code, body, type='text/plain; charset=utf-8') {
    res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  }
  function sendFile(req, res, base, file) {
    if (!inside(base, file) || !fs.existsSync(file) || !fs.statSync(file).isFile() || !inside(fs.realpathSync(base), fs.realpathSync(file))) return reply(req, res, 404, 'Not found');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  }
  const server = http.createServer((req, res) => {
    // This development server is deliberately local-only and has no mutation API.
    if (!['127.0.0.1', 'localhost'].includes((req.headers.host || '').split(':')[0])) return reply(req, res, 403, 'Local host required');
    if (!['GET', 'HEAD'].includes(req.method)) return reply(req, res, 405, 'GET/HEAD only');
    let url;
    try { url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); if (url.includes('\0') || url.includes('\\')) throw new Error(); }
    catch { return reply(req, res, 400, 'Invalid path'); }
    if (url === '/') {
      const boot = JSON.stringify(`/__dev/snapshots/${current.compositionId}.json`).replaceAll('<', '\\u003c');
      return reply(req, res, 200, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>서비스 개발 Host</title><link rel="icon" href="data:,"><style>body{margin:0}button,select{font:inherit}button{cursor:pointer}#build-status{position:fixed;inset:auto 16px 16px;z-index:1000;max-height:45vh;overflow:auto;background:#4f1522;color:white;padding:20px;white-space:pre-wrap;font:13px/1.6 monospace;border-radius:8px}</style></head><body><div id="root">개발 화면을 준비하고 있습니다…</div><pre id="build-status" role="alert" hidden></pre><script>globalThis.__MFE_DEV_BOOT__=${boot};</script><script src="/__dev/host/host.js"></script></body></html>`, 'text/html; charset=utf-8');
    }
    if (url === '/__dev/events' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      clients.add(res); if (lastEvent) res.write(`data: ${JSON.stringify(lastEvent)}\n\n`);
      req.on('close', () => clients.delete(res)); return;
    }
    const match = /^\/__dev\/snapshots\/(dev_[a-f0-9]+)\.json$/.exec(url);
    if (match) return snapshots.has(match[1]) ? reply(req, res, 200, JSON.stringify(snapshots.get(match[1])), types['.json']) : reply(req, res, 404, 'Snapshot not found');
    if (url.startsWith('/__dev/host/')) return sendFile(req, res, hostDirectory, path.resolve(hostDirectory, url.slice('/__dev/host/'.length)));
    if (remoteFiles.has(url)) return sendFile(req, res, root, remoteFiles.get(url));
    const artifact = /^\/artifacts\/([A-Za-z0-9_.+-]+)\/(.+)$/.exec(url);
    if (artifact && builds.has(artifact[1])) { const base = builds.get(artifact[1]).directory; return sendFile(req, res, base, path.resolve(base, artifact[2])); }
    return reply(req, res, 404, 'Not found');
  });
  const heartbeat = setInterval(() => { for (const client of clients) client.write(': keepalive\n\n'); }, 15000);
  function stop(code = 0) { stopped = true; clearInterval(heartbeat); clearTimeout(timer); watcher?.close(); for (const client of clients) client.end(); server.close(() => process.exit(code)); }
  process.once('SIGINT', () => stop()); process.once('SIGTERM', () => stop());
  server.on('error', error => { console.error(error.message); stop(1); });
  server.listen(port, '127.0.0.1', () => console.log(`Service Dev Host: http://127.0.0.1:${server.address().port}/`));
  watcher = fs.watch(root, { recursive: true }, (_, filename) => {
    const relative = String(filename || '').split(path.sep).join('/');
    if (!(relative.startsWith('src/') || ['mf.config.cjs', 'mf.dependencies.json', 'mf.dev.json', 'dev/manifest.json'].includes(relative))) return;
    clearTimeout(timer); timer = setTimeout(schedule, 180);
  });
}
main().catch(error => { console.error(`mfe-dev: ${error.message}`); process.exitCode = 1; });
