/* ═══════════════════════════════════════════════════════════════════════════
   PADRONIZAÇÃO DOS CARDS — bloco aditivo do Code.gs (fisk-hub-backend)

   COLAR NO FIM do Code.gs, JUNTO com o painel-secretaria.gs. A ordem entre os
   dois não importa (declarações de função sobem), mas os dois têm de estar lá:
   o painel da secretaria usa o mapeador daqui.

   Falta UMA linha no doPost (a mesma do painel da secretaria já cobre as rotas
   daqui, porque todas começam com "sec"):

       if (/^sec[A-Z]/.test(String(req.action || ''))) return secRota_(req);

   ── O problema que este arquivo resolve ────────────────────────────────────
   Os dois cards NÃO são iguais. Levantamento de 31/07/2026 sobre as duas
   planilhas inteiras:

     Caçapava  28 colunas administrativas, cronograma a partir da 29, 28 turmas
     Taubaté   16 colunas administrativas, cronograma a partir da 17, 22 turmas

     coluna 5 → Caçapava "BOOK"           · Taubaté "Observação"
     coluna 6 → Caçapava "BOOK COMPRADO"  · Taubaté "Livro"

   E o Code.gs lê o livro do aluno por POSIÇÃO FIXA (`vals[r][5]`). Em Taubaté
   isso pega a Observação. Efeito medido na aba _alunos em 31/07/2026: de 630
   alunos, 142 estavam com Book vazio e alguns com texto de observação no
   lugar ("Início em: 05/08/26", "Bolsa 50% 2º sem/26", "vencimento 15").
   Aluno sem Book não casa com a escada de estágios: o Portal do Aluno não
   mostra progresso e as ferramentas travadas por estágio não liberam.

   Por isso este bloco:
     1. define o PADRÃO CANÔNICO das colunas;
     2. lê qualquer card pelos RÓTULOS (com sinônimos), nunca por posição;
     3. substitui o syncRosterFromCards por uma versão que usa esse leitor;
     4. audita as duas planilhas e diz exatamente onde cada uma foge do padrão;
     5. normaliza uma aba do card — com simulação e backup obrigatórios.

   ── Por que o canônico é o de Caçapava ─────────────────────────────────────
   É o mais completo (tem BOOK COMPRADO, telefone do aluno, WhatsApp, o bloco
   de simulados MET/In Focus e o Final P.H.), é o que 26 das 28 turmas de lá já
   seguem, e é o que o Code.gs sempre assumiu. O único campo que só existe em
   Taubaté é o "Aditamento", que é dado real de contrato e não pode se perder —
   ele entra no canônico no fim do bloco ADMINISTRATIVO, depois do WhatsApp.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * O padrão canônico, na ordem. `col` é a posição (0-based) que a coluna deve
 * ocupar depois de normalizada; até lá, quem manda é o rótulo.
 *
 * `sin`        rótulo exato aceito (normalizado: sem acento, minúsculo)
 * `prefixo`    aceita quando o rótulo COMEÇA com isto (cobre "Idade (não
 *              editar)", "Data de Nascimento (MM/DD/AAAA)" etc.)
 * `grupo`      a linha de grupos logo acima do rótulo
 * `grupoFixo`  quando true, o grupo é OBRIGATÓRIO para casar. Existe por causa
 *              de "Telefone" e "Nome", que aparecem duas vezes no mesmo bloco e
 *              só se distinguem por ALUNO × RESPONSÁVEL. Sem isto, uma escola
 *              que só tem o telefone do responsável teria esse número lido como
 *              se fosse o do aluno.
 */
var CARD_CANON = [
  { campo: 'ativo',        col: 1,  rotulo: 'ATIVO',           grupo: 'PRESENCIAL',  tipo: 'checkbox', sin: ['ativo'] },
  { campo: 'nome',         col: 2,  rotulo: 'ALUNOS',          grupo: 'PRESENCIAL',  sin: ['alunos', 'aluno'] },
  { campo: 'status',       col: 3,  rotulo: 'STATUS',          grupo: 'ALUNO',       sin: ['status'] },
  { campo: 'obs',          col: 4,  rotulo: 'OBSERVAÇÕES',     grupo: 'ALUNO',       sin: ['observacoes', 'observacao', 'obs'] },
  { campo: 'book',         col: 5,  rotulo: 'BOOK',            grupo: 'ALUNO',       sin: ['book', 'livro', 'estagio'] },
  { campo: 'bookComprado', col: 6,  rotulo: 'BOOK COMPRADO',   grupo: 'ALUNO',       tipo: 'checkbox',
    sin: ['book comprado', 'livro comprado'], prefixo: ['livro a ser comprado', 'book a ser comprado'] },
  { campo: 'raf',          col: 7,  rotulo: 'RAF',             grupo: 'ALUNO',       sin: ['raf'] },
  { campo: 'aval1',        col: 8,  rotulo: '1ª AVALIAÇÃO',    grupo: 'via BOLETIM', sin: ['1ª avaliacao', '1a avaliacao'] },
  { campo: 'aval2',        col: 9,  rotulo: '2ª AVALIAÇÃO',    grupo: 'via BOLETIM', sin: ['2ª avaliacao', '2a avaliacao'] },
  { campo: 't1data',       col: 10, rotulo: 'DATA',            grupo: 'TEST 1',  grupoFixo: true, sin: ['data'] },
  { campo: 't1nota',       col: 11, rotulo: 'NOTA',            grupo: 'TEST 1',  grupoFixo: true, sin: ['nota'] },
  { campo: 't2data',       col: 12, rotulo: 'DATA',            grupo: 'TEST 2',  grupoFixo: true, sin: ['data'] },
  { campo: 't2nota',       col: 13, rotulo: 'NOTA',            grupo: 'TEST 2',  grupoFixo: true, sin: ['nota'] },
  { campo: 't3data',       col: 14, rotulo: 'DATA',            grupo: 'TEST 3',  grupoFixo: true, sin: ['data'] },
  { campo: 't3nota',       col: 15, rotulo: 'NOTA',            grupo: 'TEST 3',  grupoFixo: true, sin: ['nota'] },
  { campo: 't4data',       col: 16, rotulo: 'DATA',            grupo: 'TEST 4',  grupoFixo: true, sin: ['data'] },
  { campo: 't4nota',       col: 17, rotulo: 'NOTA',            grupo: 'TEST 4',  grupoFixo: true, sin: ['nota'] },
  { campo: 'fpa',          col: 18, rotulo: 'APROVADO?',       grupo: 'FPA',       grupoFixo: true, sin: ['aprovado?', 'aprovado'] },
  { campo: 'inscricao',    col: 19, rotulo: 'APROVADO?',       grupo: 'INSCRIÇÃO', grupoFixo: true, sin: ['aprovado?', 'aprovado'] },
  { campo: 'nascimento',   col: 20, rotulo: 'Data de Nascimento (MM/DD/AAAA)', grupo: 'ALUNO', prefixo: ['data de nascimento', 'nascimento'] },
  { campo: 'idade',        col: 21, rotulo: 'Idade  (não editar)', grupo: 'ALUNO', prefixo: ['idade'] },
  { campo: 'anoEscolar',   col: 22, rotulo: 'Ano Escolar',     grupo: 'ALUNO',       prefixo: ['ano escolar'] },
  { campo: 'email',        col: 23, rotulo: 'Email Aluno/Cliente', grupo: 'ALUNO',   prefixo: ['email', 'e-mail'] },
  { campo: 'telAluno',     col: 24, rotulo: 'Telefone',        grupo: 'ALUNO',       grupoFixo: true, prefixo: ['telefone', 'celular'] },
  { campo: 'respNome',     col: 25, rotulo: 'Nome',            grupo: 'RESPONSÁVEL', grupoFixo: true, sin: ['nome'] },
  { campo: 'respTel',      col: 26, rotulo: 'Telefone',        grupo: 'RESPONSÁVEL', grupoFixo: true, prefixo: ['telefone', 'celular'] },
  { campo: 'respWhats',    col: 27, rotulo: 'WhatsApp (não editar)', grupo: 'RESPONSÁVEL', prefixo: ['whatsapp'] },
  { campo: 'aditamento',   col: 28, rotulo: 'Aditamento',      grupo: 'ALUNO',       sin: ['aditamento'] }
];

/** Campos sem os quais o portal e o Portal do Aluno não funcionam. */
var CARD_ESSENCIAIS = ['ativo', 'nome', 'status', 'obs', 'book', 'raf'];

function cardNorm_(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Um rótulo casa com um campo canônico? (sem olhar o grupo) */
function cardCasaRotulo_(spec, rotulo) {
  var r = cardNorm_(rotulo);
  if (!r) return false;
  var sin = spec.sin || [];
  for (var i = 0; i < sin.length; i++) if (r === cardNorm_(sin[i])) return true;
  var pre = spec.prefixo || [];
  for (var j = 0; j < pre.length; j++) if (r.indexOf(cardNorm_(pre[j])) === 0) return true;
  return false;
}

function cardCasaGrupo_(spec, grupo) {
  if (!spec.grupo) return true;
  return cardNorm_(grupo).indexOf(cardNorm_(spec.grupo)) >= 0;
}

/**
 * Mapeia as colunas de um bloco: { campo → índice }, mais o que sobrou.
 *
 * Duas passadas de propósito. Na primeira, campo e grupo têm de bater — é o
 * que separa o "Telefone" do aluno do "Telefone" do responsável. Só na
 * segunda, e apenas para campos SEM grupoFixo, o grupo é ignorado; assim uma
 * escola que escreveu "PEDAGÓGICO" onde a outra escreveu "ALUNO" continua
 * sendo lida, mas nenhum telefone troca de dono.
 */
function cardMapa_(rotulos, grupos) {
  rotulos = rotulos || []; grupos = grupos || [];
  var mapa = {}, usada = {}, faltando = [], renomeados = [];

  function tenta(exigirGrupo) {
    CARD_CANON.forEach(function (spec) {
      if (mapa[spec.campo] != null) return;
      if (!exigirGrupo && spec.grupoFixo) return;
      for (var c = 1; c < rotulos.length; c++) {
        if (usada[c]) continue;
        if (!cardCasaRotulo_(spec, rotulos[c])) continue;
        if (exigirGrupo && !cardCasaGrupo_(spec, grupos[c])) continue;
        mapa[spec.campo] = c;
        usada[c] = spec.campo;
        if (cardNorm_(rotulos[c]) !== cardNorm_(spec.rotulo)) {
          renomeados.push({ campo: spec.campo, canonico: spec.rotulo,
                            encontrado: String(rotulos[c]).trim(), col: c });
        }
        return;
      }
    });
  }
  tenta(true);
  tenta(false);

  CARD_CANON.forEach(function (spec) {
    if (mapa[spec.campo] == null) faltando.push(spec.campo);
  });

  var fimAdm = cardInicioGrade_(rotulos, grupos, mapa);

  /* A coluna de MODALIDADE (ACAD/PERS) é reconhecida pela POSIÇÃO, não pelo
     rótulo: o cabeçalho dela é um ano ou um semestre ("2026", "maio 2026",
     "1º sem"), que muda todo semestre e nunca casaria por nome. Ela é sempre
     a última antes do cronograma, nas duas escolas. Sem tratá-la assim, ela
     apareceria para sempre como "coluna estranha" e travaria a normalização. */
  if (fimAdm > 1 && !usada[fimAdm - 1]) {
    mapa.modalidade = fimAdm - 1;
    usada[fimAdm - 1] = 'modalidade';
  }

  /* Sobra: rótulo escrito que não é de nenhum campo canônico. Não é erro por
     si — pode ser coluna nova que a escola criou — mas é o que precisa de
     decisão humana antes de normalizar, porque normalizar move colunas. */
  var sobrando = [];
  for (var c = 1; c < fimAdm; c++) {
    if (usada[c]) continue;
    var t = String(rotulos[c] == null ? '' : rotulos[c]).trim();
    if (t) sobrando.push({ col: c, rotulo: t, grupo: String(grupos[c] || '').trim() });
  }
  return { mapa: mapa, faltando: faltando, renomeados: renomeados,
           sobrando: sobrando, iniGrade: fimAdm };
}

/**
 * Primeira coluna do cronograma: a primeira com dia da semana na linha de
 * grupos. Sem isso (bloco ainda sem datas), cai para a última coluna canônica
 * reconhecida + 2 — o +2 é a coluna de modalidade (ACAD/PERS), que fica entre
 * o bloco administrativo e o cronograma.
 */
function cardInicioGrade_(rotulos, grupos, mapa) {
  for (var i = 0; i < grupos.length; i++) {
    if (DIAS_SEMANA.indexOf(String(grupos[i]).trim().toUpperCase()) > -1) return i;
  }
  var ultima = 1;
  for (var k in mapa) if (mapa.hasOwnProperty(k) && mapa[k] > ultima) ultima = mapa[k];
  return Math.min(ultima + 2, rotulos.length);
}

/**
 * Varre um card e devolve todos os blocos de turma com o mapeamento de
 * colunas de cada um. É a base tanto da auditoria quanto do leitor do painel
 * da secretaria — os dois enxergam o card do mesmo jeito, de propósito.
 */
function cardBlocos_(escola) {
  var ssId = CARD_IDS[escola];
  if (!ssId) return { erro: 'escola "' + escola + '" não existe no card' };
  var ss = SpreadsheetApp.openById(ssId);
  var blocos = [];

  ss.getSheets().forEach(function (sh) {
    var aba = sh.getName(), up = aba.toUpperCase();
    if (CARD_ABAS_IGNORAR.indexOf(aba) > -1 || up.indexOf('CALEND') === 0) return;
    if (aba.charAt(0) === '_') return;
    var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
    if (lastRow < 4 || lastCol < 8) return;
    var vals = sh.getRange(1, 1, lastRow, lastCol).getValues();

    for (var r = 0; r < vals.length; r++) {
      var num = vals[r][0], titulo = vals[r][1];
      var rotulo = vals[r + 2] ? String(vals[r + 2][2]).trim().toUpperCase() : '';
      if (num === '' || isNaN(num) || titulo === '' || rotulo !== 'ALUNOS') continue;
      var m = cardMapa_(vals[r + 2], vals[r + 1]);
      blocos.push({
        escola: escola, aba: aba, linhaTitulo: r + 1,
        turma: String(titulo).split('\n')[0].replace(/\s+/g, ' ').trim(),
        mapa: m.mapa, faltando: m.faltando, renomeados: m.renomeados,
        sobrando: m.sobrando, iniGrade: m.iniGrade, lastCol: lastCol
      });
      r = r + 2;
    }
  });
  return { escola: escola, blocos: blocos };
}

/* ══════════════════════════════════════════════════════════════════════
   AUDITORIA
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Compara as duas escolas com o padrão canônico e devolve um retrato pronto
 * para a tela: um resumo por escola, um por aba e a lista de problemas.
 */
function cardAuditar_(req) {
  var alvos = (req && req.escola) ? [String(req.escola)] : [];
  if (!alvos.length) for (var k in CARD_IDS) if (CARD_IDS.hasOwnProperty(k)) alvos.push(k);

  var escolas = [], problemas = [];
  alvos.forEach(function (e) {
    var r = cardBlocos_(e);
    if (r.erro) { problemas.push({ escola: e, gravidade: 'erro', texto: r.erro }); return; }

    var abas = {}, ordem = [];
    r.blocos.forEach(function (b) {
      if (!abas[b.aba]) { abas[b.aba] = { aba: b.aba, turmas: 0, faltando: {}, renomeados: {}, sobrando: {}, iniGrade: {} }; ordem.push(b.aba); }
      var a = abas[b.aba];
      a.turmas++;
      a.iniGrade[b.iniGrade] = (a.iniGrade[b.iniGrade] || 0) + 1;
      b.faltando.forEach(function (f) { a.faltando[f] = (a.faltando[f] || 0) + 1; });
      b.renomeados.forEach(function (x) { a.renomeados[x.campo + ' → "' + x.encontrado + '"'] = 1; });
      b.sobrando.forEach(function (x) { a.sobrando['"' + x.rotulo + '" (col ' + x.col + ')'] = 1; });
    });

    var lista = ordem.map(function (nome) {
      var a = abas[nome];
      var falt = Object.keys(a.faltando);
      var essenciais = falt.filter(function (f) { return CARD_ESSENCIAIS.indexOf(f) > -1; });
      if (essenciais.length) {
        problemas.push({ escola: e, aba: nome, gravidade: 'grave',
          texto: 'faltam colunas essenciais: ' + essenciais.join(', ') });
      }
      return { aba: nome, turmas: a.turmas, faltando: falt,
               essenciaisFaltando: essenciais,
               renomeados: Object.keys(a.renomeados),
               sobrando: Object.keys(a.sobrando),
               iniGrade: Object.keys(a.iniGrade).map(Number),
               conforme: !falt.length && !Object.keys(a.renomeados).length && !Object.keys(a.sobrando).length };
    });

    escolas.push({
      escola: e, abas: lista, turmas: r.blocos.length,
      conformes: lista.filter(function (x) { return x.conforme; }).length,
      total: lista.length
    });
  });

  return { ok: true, canonico: CARD_CANON.map(function (c) {
             return { campo: c.campo, col: c.col, rotulo: c.rotulo, grupo: c.grupo };
           }), escolas: escolas, problemas: problemas };
}

/** Escreve a auditoria numa aba `_padronizacao` da planilha de dados. */
function cardRelatorioNaPlanilha_() {
  var a = cardAuditar_({});
  var cab = ['Escola', 'Aba (professor)', 'Turmas', 'Conforme?', 'Colunas faltando',
             'Renomeadas', 'Colunas estranhas', 'Cronograma começa em'];
  var sh = secAba_('_padronizacao', cab);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  var linhas = [];
  a.escolas.forEach(function (e) {
    e.abas.forEach(function (x) {
      linhas.push([e.escola, x.aba, x.turmas, x.conforme ? 'sim' : 'NÃO',
                   x.faltando.join(', '), x.renomeados.join(' · '),
                   x.sobrando.join(' · '), x.iniGrade.join('/')]);
    });
  });
  if (linhas.length) sh.getRange(2, 1, linhas.length, cab.length).setValues(linhas);
  return { ok: true, abas: linhas.length };
}

/* ══════════════════════════════════════════════════════════════════════
   LEITURA CORRIGIDA DA _alunos

   ⚠️ A função abaixo TEM O MESMO NOME de uma que já existe mais acima no
   Code.gs, e isso é de propósito: em JavaScript a última declaração vence,
   então colar este bloco no fim do arquivo substitui a versão antiga sem
   precisar caçá-la e editá-la à mão. Se um dia você quiser limpar, pode
   apagar a versão de cima — esta é a boa.

   O que muda: livro, nome, RAF e o "é linha de aluno?" passam a sair do
   MAPEAMENTO POR RÓTULO, não de posições fixas. Em Taubaté, a posição fixa
   pegava a Observação no lugar do livro.
   ══════════════════════════════════════════════════════════════════════ */
function syncRosterFromCards() {
  var seen = {}, conflito = {}, semBook = 0;
  Object.keys(CARD_IDS).forEach(function (escola) {
    var ss = SpreadsheetApp.openById(CARD_IDS[escola]);
    ss.getSheets().forEach(function (sh) {
      var nome = sh.getName(), up = nome.toUpperCase();
      if (CARD_ABAS_IGNORAR.indexOf(nome) > -1 || up.indexOf('CALEND') === 0) return;
      if (nome.charAt(0) === '_') return;
      var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
      if (lastRow < 4 || lastCol < 8) return;
      var vals = sh.getRange(1, 1, lastRow, lastCol).getValues();
      var turma = '', cols = null;

      for (var r = 0; r < vals.length; r++) {
        var num = vals[r][0], titulo = vals[r][1];
        var rot = vals[r + 2] ? String(vals[r + 2][2]).trim().toUpperCase() : '';
        if (num !== '' && !isNaN(num) && titulo !== '' && rot === 'ALUNOS') {
          turma = String(titulo).split('\n')[0].replace(/\s+/g, ' ').trim();
          cols = cardMapa_(vals[r + 2], vals[r + 1]).mapa;
          continue;
        }
        if (!cols || cols.nome == null) continue;
        var iAtivo = cols.ativo == null ? 1 : cols.ativo;
        if (num === '' || isNaN(num) || typeof vals[r][iAtivo] !== 'boolean') continue;

        var aluno = String(vals[r][cols.nome] || '').trim();
        var raf = cols.raf == null ? '' : String(vals[r][cols.raf] || '').trim();
        if (!aluno || !RAF_VALIDO.test(raf)) continue;
        var book = cols.book == null ? '' : String(vals[r][cols.book] || '').trim();
        /* Turma que só tem "Livro a ser comprado para o semestre que vem":
           esse é o livro que vale, e é melhor do que deixar o aluno sem
           estágio nenhum — sem Book ele some da escada de níveis. */
        if (!book && cols.bookComprado != null) {
          var alt = String(vals[r][cols.bookComprado] || '').trim();
          if (alt && alt.toLowerCase() !== 'true' && alt.toLowerCase() !== 'false') book = alt;
        }
        if (!book) semBook++;

        var key = raf.toUpperCase();
        if (seen[key]) {
          if (seen[key].nome.toLowerCase() !== aluno.toLowerCase()) conflito[key] = true;
          continue;
        }
        seen[key] = { nome: aluno, turma: turma, book: book };
      }
    });
  });

  var rows = [];
  Object.keys(seen).forEach(function (k) {
    if (conflito[k]) return;
    rows.push([k, seen[k].nome, seen[k].turma, seen[k].book]);
  });
  var resumo = { alunos: rows.length, conflitos: Object.keys(conflito), semBook: semBook };
  if (!rows.length) return resumo;   // proteção: nunca esvazia a lista por falha de leitura

  var sh2 = getRoster();
  sh2.getRange('A:A').setNumberFormat('@');
  sh2.getRange(1, 1, 1, 4).setValues([['RAF', 'Nome', 'Turma', 'Book']]);
  if (sh2.getLastRow() > 1) sh2.getRange(2, 1, sh2.getLastRow() - 1, 4).clearContent();
  sh2.getRange(2, 1, rows.length, 4).setValues(rows);
  return resumo;
}

/* ══════════════════════════════════════════════════════════════════════
   NORMALIZAÇÃO — atualizar a planilha pelo Apps Script

   Trabalha numa ABA por vez, porque coluna é da aba inteira: todos os blocos
   de turma empilhados numa aba dividem a mesma grade de colunas.

   Sempre em duas etapas: `simular` devolve o plano e não escreve nada;
   `aplicar` exige que exista um backup recente da planilha (cardBackup_).
   O plano é uma sequência de três tipos de passo, nesta ordem:
     mover    — a coluna existe, mas no lugar errado (ex.: Aditamento em
                Taubaté, que está na 3 e no canônico é a 28)
     inserir  — a coluna não existe (ex.: BOOK COMPRADO em Taubaté)
     rotular  — reescreve rótulo e grupo no cabeçalho de cada bloco da aba
   ══════════════════════════════════════════════════════════════════════ */

/** Cópia de segurança da planilha inteira, na mesma pasta do card. */
function cardBackup_(escola) {
  var ssId = CARD_IDS[escola];
  if (!ssId) return { ok: false, error: 'escola desconhecida' };
  var arq = DriveApp.getFileById(ssId);
  var carimbo = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  var pais = arq.getParents();
  var copia = pais.hasNext()
    ? arq.makeCopy('BACKUP ' + carimbo + ' — ' + arq.getName(), pais.next())
    : arq.makeCopy('BACKUP ' + carimbo + ' — ' + arq.getName());
  PropertiesService.getScriptProperties()
    .setProperty('card_backup_' + escola, JSON.stringify({ id: copia.getId(), quando: Date.now() }));
  return { ok: true, id: copia.getId(), nome: copia.getName(), url: copia.getUrl() };
}

/** Backup feito nas últimas 24h? É o que libera o `aplicar`. */
function cardBackupRecente_(escola) {
  var bruto = PropertiesService.getScriptProperties().getProperty('card_backup_' + escola);
  if (!bruto) return null;
  try {
    var b = JSON.parse(bruto);
    if (Date.now() - Number(b.quando) > 24 * 3600 * 1000) return null;
    return b;
  } catch (err) { return null; }
}

/**
 * Monta (e opcionalmente executa) o plano de padronização de uma aba.
 * Recusa quando há coluna estranha dentro da faixa administrativa: mover
 * colunas com dado que ninguém reconheceu é a receita para perder informação.
 */
function cardNormalizarAba_(escola, aba, aplicar) {
  var ssId = CARD_IDS[escola];
  if (!ssId) return { ok: false, error: 'escola "' + escola + '" não existe no card' };
  var ss = SpreadsheetApp.openById(ssId);
  var sh = ss.getSheetByName(aba);
  if (!sh) return { ok: false, error: 'não existe a aba "' + aba + '" em ' + escola };

  var blocos = cardLerBlocosDaAba_(sh);
  if (!blocos.length) return { ok: false, error: 'a aba "' + aba + '" não tem bloco de turma' };

  /* Todos os blocos da aba precisam concordar sobre onde cada coluna está —
     senão não existe UM plano de colunas que sirva para a aba toda. */
  var ref = blocos[0], divergentes = [];
  blocos.forEach(function (b) {
    CARD_CANON.forEach(function (spec) {
      if (b.mapa[spec.campo] !== ref.mapa[spec.campo]) {
        divergentes.push(b.turma + ': ' + spec.campo);
      }
    });
  });
  if (divergentes.length) {
    return { ok: false, code: 'blocos_divergentes',
             error: 'os blocos desta aba não concordam sobre a posição das colunas (' +
                    divergentes.slice(0, 4).join(', ') + (divergentes.length > 4 ? '…' : '') +
                    '). Isso precisa de olho humano antes de mover coluna.' };
  }
  var estranhas = ref.sobrando;
  if (estranhas.length) {
    return { ok: false, code: 'coluna_estranha',
             error: 'há coluna que não é do padrão dentro da faixa do aluno: ' +
                    estranhas.map(function (x) { return '"' + x.rotulo + '" (col ' + x.col + ')'; }).join(', ') +
                    '. Diga o que fazer com ela antes de normalizar.' };
  }

  /* O plano é montado sobre uma cópia em memória da ordem das colunas, para
     que cada passo já enxergue o efeito do anterior.

     A ideia central: se as colunas que EXISTEM já estão na ordem relativa
     certa, basta inserir as que faltam nas posições canônicas — cada inserção
     empurra as de trás para o lugar exato, sem mover nada. Então só precisa
     mudar de lugar quem está fora da ordem relativa. Em Taubaté isso é UMA
     coluna (o Aditamento, que está na 3 e no canônico é a última); mover as
     doze que "estão na posição errada" seria doze operações estruturais
     desnecessárias num card ao vivo. */
  var ordem = [];
  for (var c = 0; c < ref.iniGrade; c++) ordem.push(null);
  CARD_CANON.forEach(function (spec) {
    if (ref.mapa[spec.campo] != null) ordem[ref.mapa[spec.campo]] = spec.campo;
  });

  var foraDeOrdem = cardForaDeOrdem_(ordem);
  var passos = [];

  /* 1) tira da frente quem está fora de ordem, mandando para o fim da faixa */
  foraDeOrdem.forEach(function (campo) {
    var de = ordem.indexOf(campo);
    ordem.splice(de, 1);
    ordem.push(campo);
    passos.push({ tipo: 'mover', campo: campo, de: de, para: ordem.length - 1,
                  motivo: 'sai da frente para as inserções acertarem as posições' });
  });

  /* 2) insere as que faltam — agora cada inserção acerta a posição das de trás */
  CARD_CANON.forEach(function (spec) {
    if (ordem.indexOf(spec.campo) >= 0) return;
    passos.push({ tipo: 'inserir', campo: spec.campo, col: spec.col,
                  rotulo: spec.rotulo, grupo: spec.grupo });
    ordem.splice(spec.col, 0, spec.campo);
  });

  /* 3) traz de volta quem foi parqueado, agora para a posição canônica */
  foraDeOrdem.forEach(function (campo) {
    var spec = null;
    for (var i = 0; i < CARD_CANON.length; i++) if (CARD_CANON[i].campo === campo) spec = CARD_CANON[i];
    var de = ordem.indexOf(campo);
    if (!spec || de === spec.col) return;
    passos.push({ tipo: 'mover', campo: campo, de: de, para: spec.col, rotulo: spec.rotulo });
    ordem.splice(de, 1);
    ordem.splice(spec.col, 0, campo);
  });
  blocos.forEach(function (b) {
    b.renomeados.forEach(function (x) {
      passos.push({ tipo: 'rotular', turma: b.turma, campo: x.campo,
                    de: x.encontrado, para: x.canonico, linha: b.linhaRotulos });
    });
  });

  if (!aplicar) {
    return { ok: true, simulacao: true, escola: escola, aba: aba, turmas: blocos.length,
             passos: passos, backup: cardBackupRecente_(escola) };
  }

  var bkp = cardBackupRecente_(escola);
  if (!bkp) {
    return { ok: false, code: 'sem_backup',
             error: 'Faça o backup da planilha de ' + escola + ' antes de aplicar (o botão ao lado). ' +
                    'Mover coluna em card ao vivo sem cópia de segurança não se faz.' };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(60000);
  try {
    var feitos = [];
    passos.forEach(function (p) {
      if (p.tipo === 'mover') {
        /* moveColumns leva formatação, fórmula e validação junto — por isso
           mover é preferível a copiar-e-apagar. O destino é 1-based e é
           calculado ANTES da remoção, que é como a API do Sheets espera. */
        sh.moveColumns(sh.getRange(1, p.de + 1, sh.getMaxRows(), 1), p.para + 1 + (p.para > p.de ? 1 : 0));
        feitos.push(p);
      } else if (p.tipo === 'inserir') {
        sh.insertColumnBefore(p.col + 1);
        feitos.push(p);
      }
    });
    /* Os cabeçalhos são reescritos no fim, quando as colunas já estão no
       lugar: assim o rótulo canônico cai sempre na coluna canônica. */
    var depois = cardLerBlocosDaAba_(sh);
    depois.forEach(function (b) {
      CARD_CANON.forEach(function (spec) {
        sh.getRange(b.linhaRotulos, spec.col + 1).setValue(spec.rotulo);
        if (spec.grupo) sh.getRange(b.linhaRotulos - 1, spec.col + 1).setValue(spec.grupo);
      });
    });
    secInvalida_(escola);
    return { ok: true, escola: escola, aba: aba, passos: feitos.length,
             rotulados: depois.length, backup: bkp };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Quais colunas estão fora da ORDEM RELATIVA canônica.
 *
 * Usa a maior subsequência crescente: o maior conjunto de colunas que já está
 * na ordem certa fica parado, e só o resto se mexe. Sem isso, uma única coluna
 * no lugar errado faria todas as outras "parecerem" deslocadas — em Taubaté,
 * o Aditamento na coluna 3 empurra doze colunas para uma posição diferente da
 * canônica, mas a ordem RELATIVA delas está certa: quem precisa sair do lugar
 * é só o Aditamento.
 */
function cardForaDeOrdem_(ordem) {
  var seq = [];
  for (var i = 0; i < ordem.length; i++) {
    if (!ordem[i]) continue;
    for (var k = 0; k < CARD_CANON.length; k++) {
      if (CARD_CANON[k].campo === ordem[i]) { seq.push({ campo: ordem[i], canon: CARD_CANON[k].col }); break; }
    }
  }
  var n = seq.length;
  if (n < 2) return [];
  var melhor = [], anterior = [];
  for (var a = 0; a < n; a++) {
    melhor[a] = 1; anterior[a] = -1;
    for (var b = 0; b < a; b++) {
      if (seq[b].canon < seq[a].canon && melhor[b] + 1 > melhor[a]) {
        melhor[a] = melhor[b] + 1; anterior[a] = b;
      }
    }
  }
  var fim = 0;
  for (var c = 1; c < n; c++) if (melhor[c] > melhor[fim]) fim = c;
  var manter = {};
  for (var j = fim; j >= 0; j = anterior[j]) manter[seq[j].campo] = 1;

  var fora = [];
  seq.forEach(function (s) { if (!manter[s.campo]) fora.push(s.campo); });
  return fora;
}

/** Blocos de UMA aba, já com o mapeamento e as coordenadas das 3 linhas. */
function cardLerBlocosDaAba_(sh) {
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 4 || lastCol < 8) return [];
  var vals = sh.getRange(1, 1, lastRow, lastCol).getValues();
  var out = [];
  for (var r = 0; r < vals.length; r++) {
    var num = vals[r][0], titulo = vals[r][1];
    var rot = vals[r + 2] ? String(vals[r + 2][2]).trim().toUpperCase() : '';
    if (num === '' || isNaN(num) || titulo === '' || rot !== 'ALUNOS') continue;
    var m = cardMapa_(vals[r + 2], vals[r + 1]);
    out.push({ turma: String(titulo).split('\n')[0].replace(/\s+/g, ' ').trim(),
               linhaTitulo: r + 1, linhaGrupos: r + 2, linhaRotulos: r + 3,
               mapa: m.mapa, faltando: m.faltando, renomeados: m.renomeados,
               sobrando: m.sobrando, iniGrade: m.iniGrade });
    r = r + 2;
  }
  return out;
}

/* ── rotas expostas ao portal (entram pelo secRota_ do painel-secretaria) ── */
function cardRota_(req, quem) {
  var acao = String((req && req.action) || '');
  if (acao === 'secPadronizacao') return cardAuditar_(req);
  if (acao === 'secPadronizaRelatorio') return cardRelatorioNaPlanilha_();
  if (acao === 'secCardBackup') {
    var r = cardBackup_(String(req.escola || ''));
    if (r.ok) secLog_(quem, 'backup do card', String(req.escola || ''), '', '', '', r.nome, r.url, null);
    return r;
  }
  if (acao === 'secNormalizarCard') {
    var aplicar = String(req.modo || '') === 'aplicar';
    var r2 = cardNormalizarAba_(String(req.escola || ''), String(req.aba || ''), aplicar);
    if (aplicar && r2.ok) {
      secLog_(quem, 'padronização do card', String(req.escola || ''), '', '',
              String(req.aba || ''), 'padrão canônico', r2.passos + ' passo(s)', null);
    }
    return r2;
  }
  return null;
}
