const CACHE = "biochem-v12";

const APP_SHELL = [
  ".",
  "index.html",
  "root_app.js",
  "manifest.json",
  "data/disorders.json",
  "data/pathways.json",
  "data/vitamins.json",
  "data/minerals.json",
  "data/normal_values.json",
  "data/cases.json",
  "data/vignettes.json",
  "data/muhs_pyq.json",
  "physio/notes.json",
  "physio/clinical.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js",
  "https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"
];

self.addEventListener("install", e => {
  // addAll is atomic: a single bad URL rejects the whole install. Cache each
  // entry independently so one failure cannot leave the app with no shell.
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(APP_SHELL.map(url =>
        c.add(new Request(url, { cache: "reload" })).catch(() => {})
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const { method, destination } = e.request;
  if (method !== "GET") return;

  if (destination === "document" || destination === "") {
    e.respondWith(networkFirst(e.request));
  } else if (e.request.url.endsWith("/root_app.js")) {
    e.respondWith(networkFirst(e.request));
  } else {
    e.respondWith(staleWhileRevalidate(e.request));
  }
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.status === 200) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    return caches.match(req).then(match => match || new Response("Offline", { status: 503 }));
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then(res => {
    if (res.status === 200) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}
