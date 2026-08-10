const VERSION="mimi-muscu-v23";
const APP_CACHE=`${VERSION}-app`;
const DATA_CACHE=`${VERSION}-data`;
const IMAGE_CACHE=`${VERSION}-images`;

const APP_SHELL=[
  "./","./index.html","./styles.css","./manifest.json",
  "./js/v23/app.js","./js/v23/helpers.js",
  "./js/v23/core/data.js","./js/v23/core/engine.js","./js/v23/core/state.js","./js/v23/core/migrations.js",
  "./js/v23/ui/workout-ui.js","./js/v23/ui/dictionary.js","./js/v23/ui/sessions.js","./js/v23/ui/dashboard.js","./js/v23/ui/profile-progress.js",
  "./js/v23/utils/backup.js","./js/v23/utils/preload.js",
  "./assets/icons/icon-192.png","./assets/icons/icon-512.png"
];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(APP_CACHE).then(cache=>cache.addAll(APP_SHELL)));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>!k.startsWith(VERSION)).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

async function networkFirst(request,cacheName){
  const cache=await caches.open(cacheName);
  try{
    const response=await fetch(request,{cache:"no-store"});
    if(response.ok)cache.put(request,response.clone());
    return response;
  }catch(_){
    return (await cache.match(request)) || Response.error();
  }
}

async function cacheFirst(request,cacheName){
  const cache=await caches.open(cacheName);
  const cached=await cache.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(response.ok)cache.put(request,response.clone());
  return response;
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);

  if(url.pathname.endsWith(".json") && url.pathname.includes("/data/")){
    event.respondWith(networkFirst(event.request,DATA_CACHE));return;
  }
  if(event.request.destination==="image"){
    event.respondWith(cacheFirst(event.request,IMAGE_CACHE));return;
  }
  if(url.origin===self.location.origin){
    event.respondWith(networkFirst(event.request,APP_CACHE));return;
  }
});
