// Son Şampiyon — ARAÇ — v.04
// Her yeni sürümde: CACHE adı + version.json + core.js içindeki VERSION birlikte değişir.
const CACHE = 'son-sampiyon-v04';
const FILES = ['./', './index.html', './core.js?v=04', './art.js?v=04', './fight.js?v=04', './match.js?v=04', './story.js?v=04', './game.js?v=04', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f, { cache:'reload' }).then(r => r.ok && c.put(f, r)).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.url.includes('version.json')) return;
  e.respondWith(
    fetch(req, { cache:'no-store' }).then(r => { if (r.ok){ const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
