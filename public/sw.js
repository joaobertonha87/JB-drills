const CACHE="jb-tactics-v1-54-3-clean";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))))
 .then(()=>self.clients.claim())
));
self.addEventListener("fetch",e=>{
 if(e.request.method==="GET") e.respondWith(fetch(e.request,{cache:"no-store"}));
});
