const CACHE = 'kairix-layout-v2';
const SHELL = ['/manifest.webmanifest', '/favicon.svg', '/icons/icon.svg', '/icons/icon-maskable.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const indexResponse = await fetch('/');
      const html = await indexResponse.clone().text();
      await cache.put('/', indexResponse.clone());
      await cache.put('/index.html', indexResponse);
      const buildAssets = Array.from(html.matchAll(/(?:src|href)="([^"#]+)"/g), (match) => match[1])
        .filter((url) => url.startsWith('/') && !url.startsWith('//'));
      await cache.addAll([...new Set([...SHELL, ...buildAssets])]);
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html'))),
  );
});
