#!/usr/bin/env node
/* ANTES DE PUBLICAR (31/10/2026): acusa todo ?v= de asset local que não bate com o md5 do arquivo em disco, e sai com
   código 1 se houver algum. É o mesmo varredor do bump-version.js, sem gravar nada. Rode depois de mexer em qualquer
   .js/.css local (fisk-shared.js, index.js, turma-de-hoje.js...) e antes do push; se acusar, `node scripts/bump-version.js`.

   A TRAVA DAS VOZES DAS SÉRIES (28/11/2026): Buddy Talks, Countries, Everyday Life e YouTubers tocam mp3 gerados
   offline (scripts/series-vozes.py). Se uma atividade mudou depois das vozes (rodou um build-*.js e esqueceu o
   gerador), a palavra nova fica muda na TV e no celular. O gerador grava em <pasta>/voz/fonte.json o sha1 de cada
   <id>.json; aqui, sem Chromium, conferimos que nenhum mudou e que todo mp3 do índice existe.
   Uso: node scripts/conferir-publicacao.js */
var fs = require('fs'), path = require('path'), crypto = require('crypto');
var b = require('./bump-version.js');
var falhou = false;

var erros = b.varre().filter(function (a) { return a.atual !== a.certo; });
if (!erros.length) console.log('✓ todos os ?v= batem com os arquivos');
else {
  falhou = true;
  erros.forEach(function (a) { console.error('✗ ' + a.pagina + ': ' + a.ref + ' (arquivo = ' + a.certo + ')'); });
  console.error(erros.length + ' referência(s) com ?v= divergente. Rode: node scripts/bump-version.js');
}

var RAIZ = path.join(__dirname, '..'), SERIES = ['buddy-talks', 'countries', 'everyday-life', 'youtubers'];
function le(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } }
function conferirVozes() {
  var mudaram = [], semMp3 = [];
  SERIES.forEach(function (pasta) {
    var lista = le(path.join(RAIZ, pasta, 'index.json'));
    if (!lista) return;
    var fonte = le(path.join(RAIZ, pasta, 'voz', 'fonte.json')) || {}, indice = le(path.join(RAIZ, pasta, 'voz', 'index.json')) || {};
    lista.forEach(function (it) {
      var arq = path.join(RAIZ, pasta, it.id + '.json');
      if (!fs.existsSync(arq)) return;
      var sha = crypto.createHash('sha1').update(fs.readFileSync(arq)).digest('hex').slice(0, 16);
      if (fonte[it.id] !== sha) mudaram.push(pasta + '/' + it.id);
      var a = (indice[it.id] || {}).a || {};
      Object.keys(a).forEach(function (t) { if (!fs.existsSync(path.join(RAIZ, pasta, 'voz', a[t]))) semMp3.push(pasta + '/voz/' + a[t]); });
    });
  });
  if (!mudaram.length && !semMp3.length) { console.log('✓ as vozes das séries estão em dia com as atividades'); return; }
  falhou = true;
  if (mudaram.length) console.error('✗ ' + mudaram.length + ' atividade(s) das séries mudaram depois das vozes (ou nunca tiveram): ' + mudaram.slice(0, 8).join(', ') + (mudaram.length > 8 ? '…' : ''));
  if (semMp3.length) console.error('✗ ' + semMp3.length + ' mp3 do índice não existem: ' + semMp3.slice(0, 8).join(', '));
  console.error('  Rode: python3 scripts/series-vozes.py (gera o que falta; depois o --listar deve dizer "faltam 0") e commite as pastas voz/');
}
conferirVozes();

process.exit(falhou ? 1 : 0);
