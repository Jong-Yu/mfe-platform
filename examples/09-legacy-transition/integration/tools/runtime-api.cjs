const crypto = require('node:crypto');
const { POLICY, recordUsage } = require('./lifecycle.cjs');
const { read } = require('./store.cjs');
const { confirmTransition, transitionURL } = require('./legacy.cjs');
const token = crypto.randomBytes(32).toString('hex');
async function handleRuntimeAPI(req, res, pathname) {
  if (!pathname.startsWith('/api/runtime/')) return false;
  function send(status, value) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
  }
  const host = req.headers.host;
  if (![ `127.0.0.1:${req.socket.localPort}`, `localhost:${req.socket.localPort}` ].includes(host)) { send(403, { error: 'Local origin required' }); return true; }
  if (req.method === 'GET' && pathname === '/api/runtime/config') { send(200, { token, heartbeatMs: POLICY.heartbeatSeconds * 1000 }); return true; }
  if (!['/api/runtime/usage', '/api/runtime/transition-confirm'].includes(pathname)) { send(404, { error: 'Not found' }); return true; }
  if (req.method !== 'POST') { send(405, { error: 'POST required' }); return true; }
  if (req.headers.origin !== `http://${host}` || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) { send(403, { error: 'Same-origin JSON required' }); return true; }
  try {
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 16384) throw new Error('Report too large'); chunks.push(chunk); }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (body.token !== token) { send(403, { error: 'Refresh usage token' }); return true; }
    if (pathname === '/api/runtime/transition-confirm') { send(200, confirmTransition(body.ticket)); return true; }
    const bridgeClientId = req.headers['x-mfe-transition-bridge'] === '1' && /^[a-zA-Z0-9-]{1,100}$/.test(req.headers['x-mfe-bridge-client'] || '') ? req.headers['x-mfe-bridge-client'] : null;
    const usage = recordUsage(body, Date.now(), { bridgeClientId });
    const session = usage.sessions[body.sessionId];
    let destination = body.protocol !== 'lease-v1' && body.event === 'heartbeat' ? transitionURL(session) : null;
    if (!destination && body.protocol !== 'lease-v1' && body.event === 'heartbeat') {
      const snapshot = read(`compositions/${body.compositionId}.json`), policies = read('lifecycle.json', { releases:{} }).releases;
      if (require('./lifecycle.cjs').usagePaths(snapshot).some(item => policies[item.artifactId]?.accessRevokedAt)) destination = '/legacy-transition';
    }
    send(200, { received: true, leaseExpiresAt: session.leaseExpiresAt, serverTime: new Date().toISOString(), closed: Boolean(session.closedAt), transitionURL: destination });
  } catch (error) { send(['LEASE_EXPIRED', 'LEASE_REQUIRED', 'SESSION_RELEASED', 'COMPOSITION_RETIRED', 'RELEASE_UNAVAILABLE'].includes(error.code) ? 410 : 422, { error: error.message, code: error.code, ...(error.code === 'SESSION_RELEASED' ? { transitionURL:'/legacy-transition' } : {}) }); }
  return true;
}
module.exports = { handleRuntimeAPI };
