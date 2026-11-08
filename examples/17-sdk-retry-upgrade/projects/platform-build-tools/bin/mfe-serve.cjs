#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const { inside, readJson } = require('../lib/project.cjs');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function main() {
  const root = fs.realpathSync(process.cwd());
  const config = require(path.join(root, 'mf.config.cjs'));
  const dist = path.join(root, 'dist');
  const release = readJson(path.join(dist, 'release.json'));
  const port = Number(process.env.PORT || config.port || 4200);
  const host = process.env.HOST || '127.0.0.1';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT/config.port must be an integer between 1 and 65535.');
  if (typeof release.id !== 'string' || !/^[A-Za-z0-9_.+-]+$/.test(release.id)) throw new Error('dist/release.json has an invalid artifact id.');
  const upstreamOrigin = new URL(process.env.MF_REMOTE_ORIGIN || 'http://127.0.0.1:4173');
  if (!['http:', 'https:'].includes(upstreamOrigin.protocol)) throw new Error('MF_REMOTE_ORIGIN must use http or https.');
  const localPrefix = `/artifacts/${release.id}/`;
  const baseHeaders = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };

  function message(req, res, status, text) {
    res.writeHead(status, { ...baseHeaders, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : text);
  }

  function sendFile(req, res, filename) {
    if (!inside(dist, filename) || !fs.existsSync(filename) || !fs.statSync(filename).isFile() || !inside(dist, fs.realpathSync(filename))) {
      message(req, res, 404, 'File not found.');
      return;
    }
    const stat = fs.statSync(filename);
    res.writeHead(200, {
      ...baseHeaders,
      'Content-Type': contentTypes[path.extname(filename)] || 'application/octet-stream',
      'Content-Length': stat.size,
    });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(filename).on('error', () => res.destroy()).pipe(res);
  }

  function proxy(req, res) {
    const incoming = new URL(req.url, 'http://preview.local');
    const target = new URL(`${incoming.pathname}${incoming.search}`, upstreamOrigin);
    const targetPort = Number(target.port || (target.protocol === 'https:' ? 443 : 80));
    const requestHost = new URL(`http://${req.headers.host || `${host}:${port}`}`).hostname;
    const sameHostname = target.hostname === requestHost || target.hostname === host || (['localhost', '127.0.0.1', '[::1]', '::1'].includes(target.hostname) && ['localhost', '127.0.0.1', '[::1]', '::1', '0.0.0.0', '::'].includes(host));
    if (targetPort === port && sameHostname) {
      message(req, res, 502, 'MF_REMOTE_ORIGIN points to this preview server; proxying would loop.');
      return;
    }
    const transport = target.protocol === 'https:' ? https : http;
    const upstream = transport.request(target, { method: req.method, headers: { accept: req.headers.accept || '*/*' } }, (response) => {
      res.writeHead(response.statusCode || 502, { ...response.headers, ...baseHeaders });
      response.on('error', () => res.destroy());
      response.pipe(res);
    });
    upstream.setTimeout(10000, () => upstream.destroy(new Error('Artifact server timed out.')));
    upstream.on('error', (error) => {
      if (!res.headersSent) message(req, res, 502, `Cannot reach artifact server: ${error.message}`);
      else res.destroy();
    });
    res.on('close', () => { if (!res.writableEnded) upstream.destroy(); });
    upstream.end();
  }

  const server = http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      message(req, res, 405, 'Only GET and HEAD are supported.');
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://preview.local').pathname);
      if (pathname.includes('\0') || pathname.includes('\\')) throw new Error('Invalid path.');
    } catch {
      message(req, res, 400, 'Invalid request path.');
      return;
    }
    if (pathname === '/') {
      sendFile(req, res, path.join(dist, release.kind === 'shell' ? 'index.html' : 'release.json'));
    } else if (pathname === '/release.json') {
      sendFile(req, res, path.join(dist, 'release.json'));
    } else if (pathname.startsWith(localPrefix)) {
      sendFile(req, res, path.resolve(dist, pathname.slice(localPrefix.length)));
    } else if (release.kind === 'shell' && (pathname.startsWith('/artifacts/') || pathname === '/registry.json' || pathname.startsWith('/registry/') || pathname.startsWith('/compositions/'))) {
      proxy(req, res);
    } else if (release.kind === 'shell' && !path.extname(pathname) && (req.headers.accept || '').includes('text/html')) {
      sendFile(req, res, path.join(dist, 'index.html'));
    } else {
      message(req, res, 404, 'File not found.');
    }
  });
  server.on('error', (error) => {
    console.error(`mfe-serve: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    console.log(`${release.service}@${release.version}: http://${host}:${port}/`);
    console.log(`Local artifact: ${localPrefix}`);
    if (release.kind === 'shell') console.log(`Remote artifacts and registry: ${upstreamOrigin.origin}`);
  });
}

try { main(); }
catch (error) {
  console.error(`mfe-serve: ${error.message}`);
  process.exitCode = 1;
}
