#!/usr/bin/env node
/* ANTES DE PUBLICAR (31/10/2026): acusa todo ?v= de asset local que não bate com o md5 do arquivo em disco, e sai com
   código 1 se houver algum. É o mesmo varredor do bump-version.js, sem gravar nada. Rode depois de mexer em qualquer
   .js/.css local (fisk-shared.js, index.js, turma-de-hoje.js...) e antes do push; se acusar, `node scripts/bump-version.js`.
   Uso: node scripts/conferir-publicacao.js */
var b = require('./bump-version.js');
var erros = b.varre().filter(function (a) { return a.atual !== a.certo; });
if (!erros.length) { console.log('✓ todos os ?v= batem com os arquivos'); process.exit(0); }
erros.forEach(function (a) { console.error('✗ ' + a.pagina + ': ' + a.ref + ' (arquivo = ' + a.certo + ')'); });
console.error(erros.length + ' referência(s) com ?v= divergente. Rode: node scripts/bump-version.js');
process.exit(1);
