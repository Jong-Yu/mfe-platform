const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const store = require('./store.cjs');
const subscriptions = require('./subscriptions.cjs');
function key() {
  let secret = store.read('demo-auth.json', null)?.secret;
  if (!secret) secret = store.withStoreLock(() => {
    const value = store.read('demo-auth.json', null) || { secret: crypto.randomBytes(32).toString('hex') };
    store.writeMetadata('demo-auth.json', value); return value.secret;
  });
  return secret;
}
const mac = value => crypto.createHmac('sha256', key()).update(value).digest('hex');
function session(req) {
  const value = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('mfe_demo='))?.slice(9);
  if (!value || !/^(alice|bob|carol)\.[a-f0-9]{24}\.[a-f0-9]{64}$/.test(value)) return null;
  const [id, nonce, signature] = value.split('.');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(mac(`${id}.${nonce}`)))) return null;
  return { user: subscriptions.user(id), csrfToken: mac(`csrf:${value}`) };
}
function sameOrigin(req) {
  const host = req.headers.host;
  return ['127.0.0.1','localhost'].some(name => host === `${name}:${req.socket.localPort}`)
    && req.headers.origin === `http://${host}`;
}
function json(res, status, body) { res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' }); res.end(JSON.stringify(body)); }
async function body(req) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > 65536) throw Error('요청이 너무 큽니다.'); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function redirect(res) { res.writeHead(302, { Location: '/subscriptions', 'Cache-Control':'no-store' }).end(); }
async function handleSubscriptionAPI(req, res, pathname) {
  if (!pathname.startsWith('/api/subscriptions/') && !['/','/subscriptions','/subscriptions/'].includes(pathname)) return false;
  if (!['127.0.0.1','localhost'].some(name => req.headers.host === `${name}:${req.socket.localPort}`)) { json(res,403,{error:'로컬 주소에서 실행해 주세요.'}); return true; }
  try {
    const own = session(req);
    if (['/subscriptions','/subscriptions/'].includes(pathname)) {
      if (req.method !== 'GET') { res.writeHead(405).end(); return true; }
      const consoleId = store.read('subscription-console.json', {})?.artifactId;
      const html = fs.readFileSync(path.join(store.store, 'artifacts', consoleId, 'index.html'));
      res.writeHead(200, { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store', 'Content-Security-Policy':"frame-ancestors 'none'" }).end(html); return true;
    }
    if (pathname === '/') {
      if (req.method !== 'GET') { res.writeHead(405).end(); return true; }
      if (!own) { redirect(res); return true; }
      const launch = subscriptions.issueLaunch(own.user.id);
      if (!launch) { redirect(res); return true; }
      const html = fs.readFileSync(path.join(store.store,'artifacts',launch.composition.selected.shell,'index.html'),'utf8');
      const safe = x => JSON.stringify(x).replaceAll('<','\\u003c');
      const scripts = `<script>window.__MFE_USER__=${safe(launch.user)};window.__MFE_LAUNCH_TOKEN__=${safe(launch.token)};window.__MFE_BOOT_URL__=${safe('/api/subscriptions/boot/'+launch.token)};window.__MFE_LEASE_REQUIRED__=true;</script><script src="/runtime-lease.js"></script><script defer src="/runtime-usage.js"></script>`;
      res.writeHead(200, { 'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Vary':'Cookie' }).end(html.replace('</head>',scripts+'</head>')); return true;
    }
    if (req.method === 'GET' && pathname === '/api/subscriptions/session') { json(res,200,{ users:subscriptions.USERS, user:own?.user || null }); return true; }
    if (req.method === 'POST' && pathname === '/api/subscriptions/login') {
      if (!sameOrigin(req) || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) { json(res,403,{error:'같은 화면에서 시작해 주세요.'}); return true; }
      const login = await body(req), person = subscriptions.user(login.userId);
      const unsigned = `${person.id}.${crypto.randomBytes(12).toString('hex')}`;
      res.setHeader('Set-Cookie',`mfe_demo=${unsigned}.${mac(unsigned)}; HttpOnly; SameSite=Strict; Path=/`);
      json(res,200,{user:person}); return true;
    }
    if (!own) { json(res,401,{error:'데모 사용자를 선택해 주세요.'}); return true; }
    if (req.method === 'GET' && pathname === '/api/subscriptions/state') { json(res,200,{...subscriptions.consoleState(own.user.id),csrfToken:own.csrfToken}); return true; }
    if (req.method === 'GET' && /^\/api\/subscriptions\/boot\/[a-f0-9]{48}$/.test(pathname)) {
      json(res,200,subscriptions.authorizeLaunch(own.user.id,pathname.split('/').at(-1))); return true;
    }
    if (req.method !== 'POST') { json(res,405,{error:'POST 요청이 필요합니다.'}); return true; }
    if (!sameOrigin(req) || req.headers['x-mfe-csrf'] !== own.csrfToken || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
      json(res,403,{error:'현재 사용자 화면에서 다시 요청해 주세요.'}); return true;
    }
    const input = await body(req), id = own.user.id;
    if (pathname === '/api/subscriptions/preview') json(res,200,{composition:subscriptions.previewSubscription(id,input)});
    else if (pathname === '/api/subscriptions/save') json(res,200,{subscription:subscriptions.saveSubscription(id,input)});
    else if (pathname === '/api/subscriptions/cancel') json(res,200,{subscription:subscriptions.cancelSubscription(id,input)});
    else json(res,404,{error:'구독 기능을 찾을 수 없습니다.'});
  } catch (error) { json(res, error.code === 'STALE_SUBSCRIPTION' ? 409 : error.code === 'LAUNCH_EXPIRED' ? 410 : 422, { error:error.message, code:error.code }); }
  return true;
}
module.exports = { handleSubscriptionAPI, session };
