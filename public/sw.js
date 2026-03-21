const CACHE_NAME = "pulse-v2";
const OFFLINE_URL = "/offline.html";
const SHELL_ROUTES = [
  "/",
  "/offline.html",
  "/air-quality",
  "/neighborhood",
  "/flu",
  "/chronic-disease",
  "/overdose",
  "/demographics",
  "/sources",
];

// Install: pre-cache shell routes + offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(SHELL_ROUTES).catch(() => {
        // Non-fatal: pre-caching may fail on first install if network is unavailable
        // Ensure at least the offline page is cached
        return cache.add(OFFLINE_URL).catch(() => {});
      })
    ).then(() => self.skipWaiting())
  );
});

// Activate: delete stale caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for API routes
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|woff2?|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests: network first, fall back to cache, then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) =>
            cached || caches.match(OFFLINE_URL)
          )
        )
    );
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached || networkFetch;
      })
    )
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  let data = { title: "Pulse NYC", body: "New health update available" };
  try {
    data = event.data.json();
  } catch (_) {
    // Use defaults
  }

  const url = (data && data.url) || "/";

  event.waitUntil(
    self.registration.showNotification(data.title || "Pulse NYC", {
      body: data.body || "New health update available",
      icon: "/apple-icon.png",
      badge: "/icon.png",
      tag: "pulse-nyc-alert",
      renotify: true,
      data: { url },
    })
  );
});

// Notification click: open the URL from notification data, fallback to /
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(targetUrl));
        if (existing) return existing.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});
