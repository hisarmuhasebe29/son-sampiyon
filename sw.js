// Son Şampiyon — ARAÇ — v.07
// Her yeni sürümde: CACHE adı + version.json + core.js içindeki VERSION + index.html ?v= birlikte değişir.
const CACHE = 'son-sampiyon-v07';
const V = '?v=07';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './three.module.min.js' + V,
  ...['core', 'art', 'render3d', 'fight', 'match', 'foot3d', 'match3d', 'creator', 'story', 'game'].map(f => './' + f + '.js' + V),
  './menu.mp3', './dovus.mp3', './futbol.mp3', './final.mp3'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f, { cache:'reload' }).then(r => r.ok && r.status === 200 && c.put(f, r)).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('version.json')) return;
  // müzik ve sürümlü dosyalar değişmez: önce önbellek (çevrimdışı da çalışır)
  if (/\.mp3$/.test(url.pathname) || /three\.module/.test(url.pathname)){
    e.respondWith(caches.match(req, { ignoreSearch:/\.mp3$/.test(url.pathname) }).then(r => r || fetch(req))); return; }
  e.respondWith(
    fetch(req, { cache:'no-store' }).then(r => { if (r.ok && r.status === 200){ const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {}); } return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
