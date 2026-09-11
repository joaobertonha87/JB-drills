const CACHE='jb-tactics-v1-54-7-single-source';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method==='GET')e.respondWith(fetch(e.request,{cache:'no-store'}));});
