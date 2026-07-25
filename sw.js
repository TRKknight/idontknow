const CACHE = "biochem-v11";

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
  "icons/icon-192.png",
  "icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js",
  "https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js",
  "https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL))
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
