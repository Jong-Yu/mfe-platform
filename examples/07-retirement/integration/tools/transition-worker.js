// This bridge deliberately has no cache, polling loop or message-based command
// endpoint. Only an explicit server decision can navigate the requesting tab.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const usage = url.pathname === '/api/runtime/usage' && event.request.method === 'POST';
  const artifact = url.pathname.startsWith('/artifacts/');
  if (!usage && !artifact) return;
  let navigate;
  const response = (async () => {
    let request = event.request, payload;
    if (usage) {
      payload = await request.clone().json().catch(() => null);
      const headers = new Headers(request.headers);
      headers.set('X-MFE-Transition-Bridge', '1'); headers.set('X-MFE-Bridge-Client', event.clientId);
      request = new Request(request, { headers });
    }
    const result = await fetch(request);
    let destination;
    if (usage && payload?.protocol !== 'lease-v1' && payload?.event === 'heartbeat') destination = (await result.clone().json().catch(() => ({}))).transitionURL;
    if (artifact && result.status === 410 && result.headers.get('X-MFE-Transition') === 'required') destination = '/legacy-transition';
    if (typeof destination === 'string' && /^\/legacy-transition(?:\/[a-f0-9]{64})?$/.test(destination) && event.clientId) {
      navigate = async () => {
        const client = await self.clients.get(event.clientId);
        if (client?.type === 'window') await client.navigate(destination);
      };
    }
    return result;
  })();
  event.respondWith(response);
  event.waitUntil(response.then(() => navigate?.()).catch(() => {}));
});
