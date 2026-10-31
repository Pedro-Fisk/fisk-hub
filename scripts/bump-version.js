#!/usr/bin/env node
/* O ?v= DOS ASSETS LOCAIS (31/10/2026). Em toda página .html da raiz, cada referência a um arquivo local (href ou src
   sem http, que exista no disco) que já carrega ?v= ganha o md5 do arquivo (10 primeiros caracteres). O navegador
   guarda o arquivo em cache enquanto o endereço não muda; mudou o arquivo, muda o endereço, e o professor baixa a
   versão nova na hora. Antes era um carimbo de data subido à mão, e esquecer era ficar com a versão velha por tempo
   indeterminado (regra do CLAUDE.md).

   Uso:  node scripts/bump-version.js            grava os ?v= nas páginas e lista o que mudou
         node scripts/bump-version.js --ver      só mostra o que mudaria (o conferir-publicacao.js faz o mesmo e falha)
         node scripts/bump-version.js --todos    também carimba os .js/.css locais que ainda não têm ?v=
   Sem dependências: Node puro. Referências externas (portalfisk.com.br, CDNs) não são tocadas: o carimbo delas é do
   outro repositório. */
var fs = require('fs'), path = require('path'), crypto = require('crypto');
var RAIZ = path.resolve(__dirname, '..');
var SO_VER = process.argv.indexOf('--ver') > -1, TODOS = process.argv.indexOf('--todos') > -1;

function md5(arq) { return crypto.createHash('md5').update(fs.readFileSync(arq)).digest('hex').slice(0, 10); }
function paginas() { return fs.readdirSync(RAIZ).filter(function (f) { return /\.html$/.test(f); }).sort(); }

/* devolve [{pagina, ref, atual, certo}] para cada referência local; `certo` é o hash do arquivo em disco */
function varre() {
  var achados = [], RE = /\b(href|src)="([^"]+?)"/g;
  paginas().forEach(function (pg) {
    var html = fs.readFileSync(path.join(RAIZ, pg), 'utf8'), m;
    while ((m = RE.exec(html))) {
      var ref = m[2], semV = ref.split('?')[0], v = /[?&]v=([^&"]*)/.exec(ref);
      if (/^(https?:)?\/\//.test(ref) || /^(data|mailto|tel|javascript):/.test(ref) || ref.charAt(0) === '#') continue;
      if (!/\.(js|css)$/.test(semV)) continue;
      if (!v && !TODOS) continue;
      var arq = path.join(RAIZ, semV);
      if (!fs.existsSync(arq)) continue;
      achados.push({ pagina: pg, ref: ref, semV: semV, atual: v ? v[1] : '', certo: md5(arq) });
    }
  });
  return achados;
}

function aplica() {
  var mudou = 0, porPagina = {};
  varre().forEach(function (a) { if (a.atual !== a.certo) (porPagina[a.pagina] = porPagina[a.pagina] || []).push(a); });
  Object.keys(porPagina).forEach(function (pg) {
    var arq = path.join(RAIZ, pg), html = fs.readFileSync(arq, 'utf8');
    porPagina[pg].forEach(function (a) {
      var novo = a.semV + '?v=' + a.certo;
      html = html.split('"' + a.ref + '"').join('"' + novo + '"');
      console.log((SO_VER ? '  mudaria ' : '  ') + pg + ': ' + a.ref + ' -> ' + novo); mudou++;
    });
    if (!SO_VER) fs.writeFileSync(arq, html);
  });
  console.log(mudou ? (SO_VER ? mudou + ' referência(s) desatualizada(s)' : mudou + ' referência(s) atualizada(s)') : 'tudo em dia');
  return mudou;
}

if (require.main === module) aplica();
module.exports = { varre: varre, md5: md5 };
