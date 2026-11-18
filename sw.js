// Service worker de Nivel
// - Primero intenta descargar de internet (así siempre ves la última versión);
//   solo si no hay conexión usa la copia guardada.
// - Si cambias este archivo, sube antes el número de CACHE.
const CACHE = "nivel-v3";
const FILES = ["./", "index.html", "app.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith("nivel-") && k !== CACHE).map(k => caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Archivos de la app: primero internet; sin conexión, la copia guardada.
  e.respondWith(
    fetch(req, { cache: "no-store" })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
  );
});
