/* Cellvoyant offline cache: pages network-first, everything else cache-first with background refresh. */
const CACHE = 'cellvoyant-42aa9f6ca5';
const CORE = ["./", "index.html", "eand.html", "cellvoyant.js", "landscape.js", "positioning.js", "manifest.webmanifest", "eand.webmanifest", "assets/icon-192.png", "assets/icon-512.png", "assets/apple-touch-icon.png"];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url), font = /^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== location.origin && !font) return;
  const keep = res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; };
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(keep).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: !font }).then(m => { const net = fetch(r).then(keep).catch(() => m); return m || net; }));
});
