const CACHE = 'bitd-sheet-v1';
const FILES = ['./index.html', './css/style.css', './js/layout.js', './js/script.js', './crew.html', './heist.html'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(FILES))
));

self.addEventListener('fetch', e => e.respondWith(
  caches.match(e.request).then(r => r || fetch(e.request))
));