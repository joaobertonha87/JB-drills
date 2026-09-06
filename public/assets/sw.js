const CACHE="jb-tactics-v1-33";
self.addEventListener("install",e=>{self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  const icon=u.pathname.includes("apple-touch-icon")||u.pathname.includes("favicon")||u.pathname.includes("manifest")||u.pathname.includes("icon-");
  if(icon){e.respondWith(fetch(e.request,{cache:"reload"}));return;}
});
