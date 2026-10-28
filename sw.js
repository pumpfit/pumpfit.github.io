// Modo sem internet: guarda os arquivos do app. Online, busca sempre a versão nova; offline, usa a guardada.
const CACHE = 'pump-v10';
const ARQUIVOS = ['./', 'index.html', 'css/app.css', 'css/landing.css', 'js/landing.js', 'js/cadastro.js', 'js/app.js', 'js/store.js', 'js/ui.js', 'js/personal.js', 'js/aluno.js', 'icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(req, copia));
      return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
  } else if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copia = res.clone();
      caches.open(CACHE).then(c => c.put(req, copia));
      return res;
    })));
  }
});
