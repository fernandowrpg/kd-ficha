// Service worker: deixa o app funcionando offline na mesa de jogo.
const CACHE = 'kd-ficha-v5';
const ASSETS = [
  './', 'index.html', 'css/style.css', 'js/data.js', 'js/tecnicas.js', 'js/app.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'vendor/dice-box-threejs.umd.js', 'fonts/ChakraPetch-Bold-latin.woff2',
  'vendor/dice/sounds/dicehit/dicehit_coin1.mp3',
  'vendor/dice/sounds/dicehit/dicehit_coin2.mp3',
  'vendor/dice/sounds/dicehit/dicehit_coin3.mp3',
  'vendor/dice/sounds/dicehit/dicehit_coin4.mp3',
  'vendor/dice/sounds/dicehit/dicehit_coin5.mp3',
  'vendor/dice/sounds/dicehit/dicehit_coin6.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic1.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic10.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic11.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic12.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic13.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic14.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic15.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic2.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic3.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic4.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic5.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic6.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic7.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic8.mp3',
  'vendor/dice/sounds/dicehit/dicehit_plastic9.mp3',
  'vendor/dice/sounds/surfaces/surface_wood_table1.mp3',
  'vendor/dice/sounds/surfaces/surface_wood_table2.mp3',
  'vendor/dice/sounds/surfaces/surface_wood_table3.mp3',
  'vendor/dice/sounds/surfaces/surface_wood_table4.mp3',
  'vendor/dice/sounds/surfaces/surface_wood_table5.mp3',
  'vendor/dice/sounds/surfaces/surface_wood_table6.mp3',
  'vendor/dice/sounds/surfaces/surface_wood_table7.mp3',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Arquivos do app: rede primeiro (pega atualizações), cache se offline.
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match('index.html'))));
    return;
  }
  // Google Fonts: cache primeiro.
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    })));
  }
});
