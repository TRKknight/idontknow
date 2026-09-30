const CACHE = "biochem-v20";

const APP_SHELL = [
  ".",
  "index.html",
  "root_app.js",
  "manifest.json",
  "data/disorders.json",
  "data/clinical.json",
  "data/pathways.json",
  "data/vitamins.json",
  "data/minerals.json",
  "data/normal_values.json",
  "data/cases.json",
  "data/vignettes.json",
  "data/muhs_pyq.json",
  "visibility.json",
  "feed/index.html",
  "physio/index.html",
  "physio/notes.json",
  "physio/clinical.json",
  "physio/hormones.json",
  "physio/muhs_pyq.json",
  "physio/viva.json",
  "physio/reflex_details.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js",
  "https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"
];

self.addEventListener("install", e => {
  // Cache each entry independently. addAll is atomic, so one unreachable URL
  // would reject the whole install and leave the app with no shell at all.
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(APP_SHELL.map(url => cacheOne(c, url)))
        .then(() => cachePhysioBundle(c))
    )
  );
  self.skipWaiting();
});

async function cacheOne(c, url) {
  try {
    await c.add(new Request(url, { cache: "reload" }));
  } catch (err) {
    // A single bad entry must not abort the rest of the precache.
  }
}

// The physiology bundle is content-hashed, so its filename changes with every
// vite build. Read physio/index.html and cache whatever it points at right now
// rather than hardcoding a hash, which would silently 404 after the next build
// and leave physiology broken offline with no error to explain why.
async function cachePhysioBundle(c) {
  try {
    // Match through a Request so both sides resolve the relative path against
    // the same base URL. Passing a bare string relies on the spec's implicit
    // conversion and risks a key that never matches what cache.add stored.
    const res = await c.match(new Request("physio/index.html"));
    if (!res) return;
    const html = await res.text();
    const refs = [...html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)].map(m => "physio/" + m[1]);
    await Promise.all(refs.map(url => cacheOne(c, url)));
  } catch (err) {
    // Without the bundle physiology still works online, just not offline.
  }
}

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

// matchIgnoringQuery: the feed and physiology frames are requested as
// "index.html?dark=0" or "?dark=1" to pick up the active theme, but they are
// precached without a query string. caches.match compares the full URL by
// default, so an offline load would miss the entry we just stored and 503.
async function matchIgnoringQuery(cache, req) {
  return (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.status === 200) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cache = await caches.open(CACHE);
    const match = await matchIgnoringQuery(cache, req);
    return match || new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await matchIgnoringQuery(cache, req);
  const fetchPromise = fetch(req).then(res => {
    if (res.status === 200) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}
