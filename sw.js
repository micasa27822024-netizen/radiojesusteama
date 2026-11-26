/* Versión automática al exportar. Datos actualizados primero desde internet. */
const VERSION = 'radio-editable-2.1.0';
const CACHE_NAME = 'plantilla-' + VERSION;
const BASE = ['./','./index.html','./config.js','./app.js','./template-core.js','./versiculos.js','./manifest.json','./assets/fondo-movil.jpg','./assets/fondo-escritorio.jpg','./assets/icono.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE_NAME).then(c=>Promise.all(BASE.map(p=>c.add(p).catch(()=>null)))));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('plantilla-') && k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);if(u.origin!==self.location.origin || u.pathname.includes('/api/'))return;
  if(/(?:editor\.(?:html|js|css)|export-files\.json|radio-config\.json)$/.test(u.pathname))return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)));}return r;}).catch(()=>caches.match(e.request).then(r=>r || (e.request.mode==='navigate' ? caches.match('./index.html'):Response.error()))));
});
