/* ============================================================
   SERVICE WORKER — SINTESA Dashboard Terpadu
   ------------------------------------------------------------
   - Precache shell (index.html, manifest, ikon) + semua modul
     di pages/ supaya dashboard tetap bisa dibuka saat offline.
   - Saat menambah/menghapus modul di MENU (index.html), tambah/
     hapus juga path filenya di ASSETS di bawah ini.
   - Naikkan CACHE_VERSION setiap kali isi ASSETS berubah agar
     pengguna lama mendapat versi baru (cache lama otomatis
     dibersihkan saat activate).
   ============================================================ */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `sintesa-cache-${CACHE_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './pages/page1.html',
  './pages/page2.html',
  './pages/page3.html',
  './pages/page4.html',
  './pages/page5.html'
];

// ---------- INSTALL: precache semua aset ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---------- ACTIVATE: bersihkan cache versi lama ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('sintesa-cache-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ---------- FETCH: cache-first, fallback ke network, lalu update cache ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // hanya tangani GET; biarkan request lain (POST dll) lewat apa adanya
  if (req.method !== 'GET') return;

  // abaikan request lintas origin (mis. CDN eksternal) — biarkan browser yang urus
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached); // offline & tidak ada di cache -> gagal senyap

      // cache-first: tampilkan versi tersimpan dulu (cepat), sinkron di background
      return cached || network;
    })
  );
});
