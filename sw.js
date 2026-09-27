// Only bundled app files are cached. Personal entries stay in localStorage.
const scope = self.registration.scope;
const PREFIX = `kindly-shell-${encodeURIComponent(new URL(scope).pathname)}:`;
const CACHE = `${PREFIX}v2.0.0`;
const FILES = ['./','./index.html','./styles.css','./app.js','./core.js',
  './content.js','./streak.js','./pwa.js','./flame.svg','./manifest.webmanifest',
  './icon-192.png','./icon-512.png','./maskable-512.png','./apple-touch-icon.png'];
const assets = new Set(FILES.map(file => new URL(file, scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  // Do not force an update into a running session. Existing tabs can finish.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(new URL('./index.html', scope).href)));
  } else if (assets.has(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
  }
});
