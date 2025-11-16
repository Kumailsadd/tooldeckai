const CACHE_NAME = "tooldeckai-v4";
const ASSETS = [
  new URL("./", self.registration.scope).href,
  new URL("./manifest.webmanifest", self.registration.scope).href,
  new URL("./favicon.svg", self.registration.scope).href,
  new URL("./tools/pdf/merge/", self.registration.scope).href,
  new URL("./tools/pdf/split/", self.registration.scope).href,
  new URL("./tools/image/resize/", self.registration.scope).href,
  new URL("./tools/image/convert/", self.registration.scope).href,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((k) =>
            k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()
          )
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return networkRes;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
