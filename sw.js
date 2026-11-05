/* Terço Comigo: guarda a casca do app para abrir rápido e funcionar com internet fraca.
   Os áudios ficam com o cache normal do navegador (o iPhone precisa de respostas parciais para tocar áudio). */
const V="tc-v4";
const CORE=["./","index.html","fb.js","audio-data.js","boas-vindas.js","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin||u.pathname.includes("/audio/"))return;
  /* Sempre tenta a versão mais nova primeiro; sem internet, usa a guardada */
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))))});
