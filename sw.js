/**
 * Cache PWA V34
 * Navigation + code : network-first pour recevoir les mises à jour immédiatement.
 */
const VERSION = "mimi-muscu-v34.0";
const APP_CACHE = `${VERSION}-app`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./theme.css",
  "./workout.css",
  "./manifest.json",
  "./js/app.js",
  "./js/config.js",

  "./js/core/catalog.js",
  "./js/core/program.js",
  "./js/core/state.js",
  "./js/core/migrations.js",
  "./js/core/workout-engine.js",
  "./js/core/progression.js",
  "./js/core/calendar.js",

  "./js/ui/navigation.js",
  "./js/ui/home.js",
  "./js/ui/workout.js",
  "./js/ui/exercise-library.js",
  "./js/ui/session-planner.js",
  "./js/ui/profile.js",
  "./js/ui/progress.js",
  "./js/ui/calendar.js",

  "./js/utils/dom.js",
  "./js/utils/dates.js",
  "./js/utils/backup.js",
  "./js/utils/preload.js",

  "./data/exercises.json",
  "./data/exercise_families.json",
  "./data/programs.json",
  "./data/milestones.json",

  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== APP_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (_) {
    return (await cache.match(request)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (/\.(?:js|css|json)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
