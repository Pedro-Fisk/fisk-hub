/* A CONVERSAÇÃO SEM INTERNET (27/11/2026). Só controla as páginas sob ./conversacao (o resto do Hub segue como sempre).
 * Rede primeiro, com 4 s de paciência; sem rede, o que "Deixar a semana offline" guardou no cache 'fisk-conversa-v1'
 * (a página, o kit, o logo e o leitor de PDF do jsDelivr). Os PDFs das atividades a página lê direto do cache. */
var CACHE = 'fisk-conversa-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

function doCache(req) {
  return caches.open(CACHE).then(function (c) { return c.match(req).then(function (r) { return r || c.match(req, { ignoreSearch: true }); }); });
}
function comPrazo(p, ms) { return new Promise(function (ok, erro) { var t = setTimeout(function () { erro(new Error('lento')); }, ms); p.then(function (r) { clearTimeout(t); ok(r); }, function (e) { clearTimeout(t); erro(e); }); }); }

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin && url.hostname !== 'cdn.jsdelivr.net') return;
  e.respondWith(comPrazo(fetch(req), 4000).catch(function () {
    return doCache(req).then(function (r) { return r || Response.error(); });
  }));
});
