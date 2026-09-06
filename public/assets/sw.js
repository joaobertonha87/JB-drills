const CACHE="jb-tactics-v1-32";
const APP_SHELL=["/","/?v=132","/manifest-v132.webmanifest","/favicon-v132.png","/apple-touch-icon-v132.png","/icon-192-v132.png","/icon-512-v132.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL)).catch(()=>{}));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c)).catch(()=>{});return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match("/"))));});
