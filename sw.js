const V = 'kv-v35';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const same = new URL(req.url).origin === location.origin;
  if (req.mode === 'navigate') {
    // az oldalt előbb a hálózatról kéri (így az új verzió megjelenik), offline a mentettet adja
    e.respondWith(
      fetch(req).then(res => {
        const cp = res.clone();
        caches.open(V).then(c => c.put('index.html', cp));
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok && same) { const cp = res.clone(); caches.open(V).then(c => c.put(req, cp)); }
      return res;
    }))
  );
});
