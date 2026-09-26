// Lecturas de ruta: permite abrir la app sin señal.
// La página se pide primero a internet (así llegan las actualizaciones) y, si no hay señal, se usa la copia guardada.
// Los mapas no pasan por aquí: la app los guarda aparte, zona por zona.
const CACHE = 'lecturas-app-v3';
const FILES = ['./', './index.html', './manifest.json', './icono-192.png', './icono-512.png', './icono-maskable-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('lecturas-app-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // mapas, fuentes: no se tocan
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(req)
        .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
