self.addEventListener('install', e => {
  e.waitUntil((async ()=>{
    const cache = await caches.open('bpr-v4');
    await cache.addAll(['./','./index.html','./styles.css','./app.js','./template_v8.html','./manifest.webmanifest']);
  })());
});
self.addEventListener('fetch', e => {
  e.respondWith((async ()=>{
    const cacheFirst = await caches.match(e.request, {ignoreSearch:true});
    if (cacheFirst) return cacheFirst;
    try {
      const net = await fetch(e.request);
      const putCache = await caches.open('bpr-runtime-v1');
      // clone and store successful GETs
      if (e.request.method === 'GET' && net && net.status === 200) {
        putCache.put(e.request, net.clone());
      }
      return net;
    } catch(err){
      // offline fallback for navigations
      if (e.request.mode === 'navigate') {
        const cached = await caches.match('./index.html');
        if (cached) return cached;
      }
      throw err;
    }
  })());
});
