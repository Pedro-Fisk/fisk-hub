/* ═══════════════════════════════════════════════════════════════════════════
   FISK HUB — BLOCO ÚNICO PARA COLAR NO FIM DO Code.gs
   Gerado em 31/07/2026. Junta padronizacao-cards.gs + painel-secretaria.gs
   num arquivo só, para ser UM Ctrl+V em vez de dois.

   ── O que fazer, na ordem ──────────────────────────────────────────────────

   1. Abrir o projeto (conta /u/1):
      https://script.google.com/u/1/home/projects/1AlWF9j-indNvmh_A3Jk9k28mCC3uhF8eP_dj7C74BzX1wauT3b1VGFTm/edit

   2. Com o Code.gs aberto: Ctrl+End, Enter, e colar TUDO que vem depois desta
      caixa de comentário. É aditivo: a única coisa que ele redefine de
      propósito é o syncRosterFromCards (ver item 5).

   3. Ctrl+F por  dirLogin  e acrescentar UMA linha logo abaixo de
          if (req.action === 'dirLogin') return dirLogin(req);
      esta:
          if (/^sec[A-Z]/.test(String(req.action || ''))) return secRota_(req);

   4. Ctrl+F por  DIRETORES  e incluir o Davi (o nome tem de ser idêntico ao
      cadastrado no _profs):
          const DIRETORES = ['PEDRO (DIREÇÃO)', 'DAVI (DIREÇÃO)'];

   5. Ctrl+S. Depois: Implantar → Gerenciar implantações → ícone de lápis →
      Versão: Nova versão → Implantar.
      NUNCA "Nova implantação": isso troca a URL do Web App e derruba Hub,
      Portal e Painel de uma vez. A URL tem de continuar sendo
      https://script.google.com/macros/s/AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1/exec

   ── Por que isso também corrige um bug que já está no ar ───────────────────
   O Code.gs lê o livro do aluno por posição fixa (coluna F). Em Caçapava isso
   é o BOOK; em Taubaté é a Observação. Resultado medido na aba _alunos em
   31/07/2026: de 630 alunos, 142 estavam sem Book, e alguns com texto de
   observação no lugar. Sem Book o aluno não casa com a escada de estágios —
   o Portal do Aluno não mostra progresso e as ferramentas travadas por
   estágio não liberam. Por isso o syncRosterFromCards é redefinido aqui, para
   ler as colunas pelo NOME. Em JavaScript a última declaração vence, então
   basta colar: não é preciso caçar e apagar a versão antiga lá em cima.
   ═══════════════════════════════════════════════════════════════════════════ */



/* ─────────── padronizacao-cards.gs ─────────── */

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


/* ─────────── painel-secretaria.gs ─────────── */

/* ═══════════════════════════════════════════════════════════════════════════
   PORTAL DA SECRETARIA — bloco aditivo do Code.gs (fisk-hub-backend)

   COLAR NO FIM do Code.gs, o arquivo único do backend. Este bloco NÃO
   redefine nada: só usa o que já existe lá (json, getProfs, acharProfLinha_,
   hashSenha_, profPublico_, normNome, ehDiretor_, normRaf, CARD_IDS,
   CARD_ABAS_IGNORAR, RAF_VALIDO, DIAS_SEMANA, lerGabaritoCard_,
   seqDoBookCard_, getRoster, getAcessos, fdWallet_, rootDaEscola,
   acharPasta, acharTurmaPasta_, acharPastaDoAluno_, listarSubpastas_,
   ehPastaAdministrativa_, normPasta_, limpa_).

   Falta UMA linha no doPost, junto das outras rotas de painel:

       if (/^sec[A-Z]/.test(String(req.action || ''))) return secRota_(req);

   Uma linha só porque todas as rotas do portal começam com "sec" e o
   secGuard cuida da sessão. O secLogin é a única que passa sem token.

   ── Por que este bloco lê o card direto, e não pela API do card ───────────
   O backend já abre as duas planilhas do card por ID (situacaoAluno_ e
   syncRosterFromCards fazem isso desde sempre), então não precisa de chave
   nem da ponte. E precisa MAIS do que a ponte devolve: para transferir um
   aluno é necessário saber a LINHA exata dele e a linha vaga de destino —
   coordenadas que nenhum resumo carrega.

   ── O que é uma "vaga" ───────────────────────────────────────────────────
   Cada bloco de turma no card já vem com linhas numeradas a mais, vazias.
   São elas as vagas: matricular ou receber um transferido é preencher uma
   dessas linhas, nunca inserir linha nova. Inserir linha deslocaria os
   blocos de baixo e quebraria as células mescladas da coluna A — por isso,
   se a turma de destino estiver lotada, a transferência RECUSA e pede que
   alguém abra linhas no card. Recusar é melhor do que arriscar o card.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Cargos que entram no portal. A direção entra sempre (ehDiretor_). */
var SEC_CARGOS = ['secretaria', 'coordenacao', 'direcao'];

/** Teto do CacheService é 6h — a sessão da secretária dura um turno. */
var SEC_TTL = 21600;

/** Índice do card em cache: a leitura completa das duas planilhas leva
 *  segundos, e o portal relê a cada tela. 5 min é curto o bastante para
 *  ninguém trabalhar em cima de dado velho e longo o bastante para a
 *  navegação ficar instantânea. Toda ESCRITA invalida o cache da escola. */
var SEC_CACHE_TTL = 300;

/** Rótulos que a secretaria grava na coluna STATUS. Ficam aqui em cima
 *  porque são convenção da escola, não do código: se um dia a escola passar
 *  a escrever "Cancelado" em vez de "Desistente", muda-se só esta linha. */
var SEC_STATUS = {
  transferido: 'Transferido',
  desistente:  'Desistente',
  trancado:    'Trancado',
  novo:        'Aluno novo'
};

var SEC_LOG_ABA = '_secLog';
var SEC_LOG_CAB = ['Quando', 'Quem', 'Ação', 'Escola', 'RAF', 'Aluno',
                   'De', 'Para', 'Detalhe', 'Snapshot'];

var SEC_CONTATOS_ABA = '_secContatos';
var SEC_CONTATOS_CAB = ['Quando', 'Quem', 'RAF', 'Aluno', 'Motivo',
                        'Resultado', 'Retornar em', 'Observação'];

/* ══════════════════════════════════════════════════════════════════════
   SESSÃO
   Mesma ideia do painel da direção: a página não carrega chave nenhuma.
   O login devolve um token guardado no CacheService e toda rota exige ele.
   A diferença é quem pode entrar: aqui vale o CARGO da pessoa no _profs.
   ══════════════════════════════════════════════════════════════════════ */

function secCargoOk_(cargo, nome) {
  if (ehDiretor_(nome)) return true;   // a direção enxerga tudo, sempre
  var c = String(cargo || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim();
  for (var i = 0; i < SEC_CARGOS.length; i++) {
    if (c.indexOf(SEC_CARGOS[i]) === 0) return true;
  }
  return false;
}

function secLogin(p) {
  var nome = String(p.name || '').trim();
  var linha = acharProfLinha_(nome);
  if (!linha) return json({ ok: false, error: 'Usuário não encontrado.' });

  var sh = getProfs();
  var cargo = String(sh.getRange(linha, 8).getValue() || '').trim();
  if (!secCargoOk_(cargo, nome)) {
    return json({ ok: false, error: 'Este portal é da secretaria. Sua conta está como "' +
                                    (cargo || 'sem cargo') + '".' });
  }
  var hash = String(sh.getRange(linha, 3).getValue() || '').trim();
  var salt = String(sh.getRange(linha, 4).getValue() || '');
  if (!hash) return json({ ok: false, error: 'Sua conta ainda não tem senha. Peça à direção.' });
  if (hashSenha_(String(p.password || ''), salt) !== hash) {
    return json({ ok: false, error: 'Senha incorreta.' });
  }

  var token = Utilities.getUuid();
  CacheService.getScriptCache().put('sectok_' + token, normNome(nome), SEC_TTL);
  sh.getRange(linha, 7).setValue(new Date());   // último login
  var pub = profPublico_(sh, linha);
  pub.cargo = cargo;
  pub.direcao = ehDiretor_(nome);
  return json({ ok: true, token: token, quem: pub });
}

/** Nome de quem está na sessão, ou '' se o token morreu. */
function secQuem_(req) {
  return CacheService.getScriptCache().get('sectok_' + String((req && req.token) || '')) || '';
}

function secGuard(req, fn) {
  var quem = secQuem_(req);
  if (!quem) return json({ ok: false, error: 'Sessão expirada. Entre de novo.' });
  return fn(req, quem);
}

function secCheck(req) {
  var quem = secQuem_(req);
  if (!quem) return json({ ok: false, error: 'Sessão expirada.' });
  var linha = acharProfLinha_(quem);
  var sh = getProfs();
  var pub = linha ? profPublico_(sh, linha) : { name: quem, escolas: '', fullName: '' };
  pub.direcao = ehDiretor_(quem);
  return json({ ok: true, quem: pub });
}

/** Roteador único do portal. O login fica fora do guarda; o resto, dentro. */
function secRota_(req) {
  var acao = String((req && req.action) || '');
  if (acao === 'secLogin') return secLogin(req);
  if (acao === 'secCheck') return secCheck(req);

  return secGuard(req, function (r, quem) {
    /* Padronização dos cards: só a direção. São as únicas ações que MOVEM
       coluna na planilha da escola — não é trabalho de balcão. */
    if (acao.indexOf('secPadroniza') === 0 || acao === 'secCardBackup' || acao === 'secNormalizarCard') {
      if (!ehDiretor_(quem)) return json({ ok: false, error: 'Só a direção mexe na estrutura do card.' });
      var resp = cardRota_(r, quem);
      return json(resp || { ok: false, error: 'ação desconhecida: ' + acao });
    }
    switch (acao) {
      /* leitura */
      case 'secBusca':      return json(secBusca_(r));
      case 'secFicha':      return json(secFicha_(r));
      case 'secTurmas':     return json(secTurmas_(r));
      case 'secFila':       return json(secFila_(r));
      case 'secProntidao':  return json(secProntidao_(r));
      case 'secProntidaoDrive': return json(secProntidaoDrive_(r));
      case 'secAniversarios':   return json(secAniversarios_(r));
      case 'secValidar':    return json(secValidarCadastro_(r));
      case 'secBoletins':   return json(secBoletins_(r));
      case 'secAlertas':    return json(secAlertas_(r));
      case 'secNomesSujos': return json(secNomesSujos_(r));
      case 'secFusoes':     return json(secFusoes_(r));
      case 'secAgenda':     return json(secAgenda_(r));
      case 'secSemAcesso':  return json(secSemAcesso_(r));
      case 'secAuditoria':  return json(secAuditoria_(r));
      case 'secContatos':   return json(secContatos_(r));
      /* escrita */
      case 'secTransferir': return json(secTransferir_(r, quem));
      case 'secBaixa':      return json(secBaixa_(r, quem));
      case 'secMatricular': return json(secMatricular_(r, quem));
      case 'secAtualizarAluno': return json(secAtualizarAluno_(r, quem));
      case 'secSalvarAlerta':  return json(secSalvarAlerta_(r, quem));
      case 'secLimparNome':    return json(secLimparNome_(r, quem));
      case 'secAgendar':       return json(secAgendar_(r, quem));
      case 'secAgendaSituacao': return json(secAgendaSituacao_(r, quem));
      case 'secFdResgate':     return json(secFdResgate_(r, quem));
      case 'secContato':    return json(secRegistrarContato_(r, quem));
      case 'secSalvarPdf':  return json(secSalvarPdf_(r, quem));
      case 'secDesfazer':   return json(secDesfazer_(r, quem));
    }
    return json({ ok: false, error: 'ação desconhecida: ' + acao });
  });
}

/* ══════════════════════════════════════════════════════════════════════
   LEITURA DO CARD
   Uma passada por planilha devolve tudo: professores (abas), turmas
   (blocos), alunos (linhas preenchidas) e vagas (linhas numeradas vazias),
   com as COORDENADAS de cada linha — é o que permite escrever depois.
   ══════════════════════════════════════════════════════════════════════ */

function secEscolas_() {
  var nomes = [];
  for (var k in CARD_IDS) if (CARD_IDS.hasOwnProperty(k)) nomes.push(k);
  return nomes;
}

function secNorm_(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Mapeia as colunas do bloco. Quem faz o trabalho é o `cardMapa_` do
 * padronizacao-cards.gs — o mesmo mapeador que a auditoria e o
 * syncRosterFromCards usam, para que os três enxerguem o card do mesmo jeito.
 *
 * Aqui só se traduz o resultado para o formato que o resto deste arquivo
 * espera, com -1 no lugar de "não existe". É por isso que o portal funciona
 * nas duas escolas apesar de Taubaté chamar BOOK de "Livro" e ter a coluna
 * numa posição diferente.
 */
function secColunas_(rotulos, grupos) {
  var m = cardMapa_(rotulos, grupos).mapa;
  function em(campo, padrao) { return m[campo] == null ? padrao : m[campo]; }

  var c = {
    ativo: em('ativo', 1), nome: em('nome', 2), status: em('status', 3),
    obs: em('obs', 4), book: em('book', -1), bookComprado: em('bookComprado', -1),
    raf: em('raf', 7), nascimento: em('nascimento', -1), idade: em('idade', -1),
    anoEscolar: em('anoEscolar', -1), email: em('email', -1),
    telAluno: em('telAluno', -1), respNome: em('respNome', -1),
    respTel: em('respTel', -1), respWhats: em('respWhats', -1),
    aditamento: em('aditamento', -1), ultimaAdm: 7
  };
  /* Última coluna "administrativa": é até ela que a transferência copia a
     linha. Depois dela começa o cronograma, que é da TURMA (as datas de
     uma turma não valem para outra) e por isso nunca acompanha o aluno. */
  var fim = c.raf;
  for (var k in c) {
    if (c.hasOwnProperty(k) && k !== 'ultimaAdm' && c[k] > fim) fim = c[k];
  }
  c.ultimaAdm = fim;
  return c;
}

/**
 * Onde começa e onde termina o cronograma de aulas do bloco.
 *
 * Começo: a primeira coluna com dia da semana na linha de grupos (SEG, QUA…).
 * Entre o fim dos dados do aluno e essa coluna ainda existe a coluna de
 * MODALIDADE (ACAD/PERS), que é do aluno e por isso acompanha ele numa
 * transferência — daí o `iniDados`, usado para saber o que copiar.
 *
 * Fim: "Faltas" fecha a faixa, mas antes dela vem "Final P.H." com um
 * percentual ("0%"). Sem cortar nessa coluna, o percentual entraria na
 * conta como se fosse mais uma aula dada, e todo aluno apareceria com uma
 * aula a mais do que teve.
 */
function secGradeLimites_(vals, iTit, cols, lastCol) {
  var ini = -1;
  var linhaDias = vals[iTit + 1] || [];
  for (var i = 0; i < linhaDias.length; i++) {
    if (DIAS_SEMANA.indexOf(String(linhaDias[i]).trim().toUpperCase()) > -1) { ini = i; break; }
  }
  if (ini < 0) ini = cols.ultimaAdm + 2;   // administrativo + modalidade

  var fim = lastCol;
  var tit = vals[iTit] || [];
  for (var j = ini; j < tit.length; j++) {
    var t = secNorm_(tit[j]).replace(/\./g, '');
    if (t === 'faltas' || t === 'final p h' || t === 'final ph') { fim = j; break; }
  }
  return { ini: ini, fim: fim, iniDados: cols.ativo, fimDados: ini - 1 };
}

/**
 * Lê o card de uma escola inteiro.
 * Devolve { escola, turmas:[...], alunos:[...] } com coordenadas de linha
 * (1-based, prontas para getRange) em cada aluno e em cada vaga.
 */
function secLerEscola_(escola) {
  var ssId = CARD_IDS[escola];
  if (!ssId) return { erro: 'escola "' + escola + '" não existe no card' };
  var ss = SpreadsheetApp.openById(ssId);
  var gabarito = lerGabaritoCard_(ss);
  var turmas = [], alunos = [];

  ss.getSheets().forEach(function (sh) {
    var aba = sh.getName(), up = aba.toUpperCase();
    if (CARD_ABAS_IGNORAR.indexOf(aba) > -1 || up.indexOf('CALEND') === 0) return;
    if (aba.charAt(0) === '_') return;             // abas de log do próprio card
    var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
    if (lastRow < 4 || lastCol < 8) return;
    var vals = sh.getRange(1, 1, lastRow, lastCol).getValues();

    for (var r = 0; r < vals.length; r++) {
      /* linha-título do bloco: número na coluna A, título na B e "ALUNOS"
         duas linhas abaixo, na coluna C. Mesma regra do syncRosterFromCards. */
      var num = vals[r][0], titulo = vals[r][1];
      var rotulo = vals[r + 2] ? String(vals[r + 2][2]).trim().toUpperCase() : '';
      if (num === '' || isNaN(num) || titulo === '' || rotulo !== 'ALUNOS') continue;

      var iTit = r;
      var cols = secColunas_(vals[iTit + 2], vals[iTit + 1]);
      var grade = secGradeLimites_(vals, iTit, cols, lastCol);
      var nomeTurma = String(titulo).split('\n')[0].replace(/\s+/g, ' ').trim();
      /* Quais campos canônicos ESTA turma tem. É o que permite ao portal
         oferecer "marcar livro comprado" só onde a coluna existe — em
         Taubaté ela não existe, e prometer um botão que não grava seria
         pior do que não ter o botão. */
      var campos = [];
      ['bookComprado', 'aditamento', 'telAluno', 'respTel', 'respNome',
       'email', 'nascimento', 'anoEscolar', 'raf', 'book'].forEach(function (k) {
        if (cols[k] >= 0) campos.push(k);
      });
      var turma = { escola: escola, professor: aba, turma: nomeTurma,
                    linhaTitulo: iTit + 1, ocupadas: 0, vagas: [], books: {},
                    colunas: cols, grade: grade, campos: campos };

      for (var k = iTit + 3; k < vals.length; k++) {
        var cnt = vals[k][0];
        // fim do bloco: acabou a numeração das linhas de aluno
        if (cnt === '' || isNaN(cnt) || typeof vals[k][cols.ativo] !== 'boolean') break;
        var nome = String(vals[k][cols.nome] || '').trim();
        if (!nome) { turma.vagas.push(k + 1); continue; }

        var book = cols.book < 0 ? '' : String(vals[k][cols.book] || '').trim();
        /* Turma que só tem "Livro a ser comprado para o 2º sem" no lugar do
           BOOK: é esse o livro que vale. Sem isso o aluno fica sem estágio,
           e sem estágio ele some da escada de níveis do Portal do Aluno. */
        if (!book && cols.bookComprado >= 0) {
          var alt = String(vals[k][cols.bookComprado] || '').trim();
          if (alt && alt.toLowerCase() !== 'true' && alt.toLowerCase() !== 'false') book = alt;
        }
        var raf  = cols.raf < 0 ? '' : String(vals[k][cols.raf] || '').trim();
        var celulas = vals[k].slice(grade.ini, grade.fim).map(function (v) {
          return String(v == null ? '' : v).trim();
        });
        var frq = secFrequencia_(celulas, seqDoBookCard_(gabarito, book));

        alunos.push({
          escola: escola, professor: aba, turma: nomeTurma, linha: k + 1,
          nome: nome, raf: raf, book: book,
          status: String(vals[k][cols.status] || '').trim(),
          obs: String(vals[k][cols.obs] || '').trim(),
          ativo: vals[k][cols.ativo] === true,
          bookComprado: vals[k][cols.bookComprado] === true,
          nascimento: secData_(cols.nascimento >= 0 ? vals[k][cols.nascimento] : ''),
          idade: cols.idade >= 0 ? String(vals[k][cols.idade] || '').trim() : '',
          anoEscolar: cols.anoEscolar >= 0 ? String(vals[k][cols.anoEscolar] || '').trim() : '',
          email: cols.email >= 0 ? String(vals[k][cols.email] || '').trim() : '',
          telefone: cols.telAluno >= 0 ? String(vals[k][cols.telAluno] || '').trim() : '',
          respNome: cols.respNome >= 0 ? String(vals[k][cols.respNome] || '').trim() : '',
          respTel: cols.respTel >= 0 ? String(vals[k][cols.respTel] || '').trim() : '',
          respWhats: cols.respWhats >= 0 ? String(vals[k][cols.respWhats] || '').trim() : '',
          /* Aditamento é caixa de seleção em Taubaté e não existe em
             Caçapava: null significa "esta escola não controla isso aqui",
             que é diferente de false ("falta aditar"). */
          aditamento: cols.aditamento >= 0 ? (vals[k][cols.aditamento] === true) : null,
          aulas: frq.aulas, faltas: frq.faltas, pctFaltas: frq.pctFaltas,
          ultimaLicao: frq.ultimaLicao, licaoPrevista: frq.licaoPrevista,
          pctEstagio: frq.pctEstagio, atraso: frq.atraso
        });
        turma.ocupadas++;
        if (book) turma.books[book] = (turma.books[book] || 0) + 1;
      }
      turma.capacidade = turma.ocupadas + turma.vagas.length;
      turma.livres = turma.vagas.length;
      turmas.push(turma);
      r = iTit + 2;   // continua a varredura logo depois do cabeçalho do bloco
    }
  });

  return { escola: escola, turmas: turmas, alunos: alunos };
}

/**
 * Frequência e atraso de conteúdo a partir das células do cronograma.
 * As convenções do card (as mesmas que o situacaoAluno_ já usava):
 *   'a'      → falta            'f' → feriado
 *   '/'      → sem aula         '.XXX' → lição PLANEJADA (futuro)
 *   'XXX'    → lição realmente dada
 *
 * O "atraso" é quantas aulas já aconteceram sem o conteúdo andar: aulas
 * consumidas menos a posição da última lição na sequência do book. É o
 * mesmo conceito da aba "Atrasados" do card ("Aulas em atraso"), calculado
 * aqui para poder olhar a escola inteira de uma vez. Sem gabarito do book
 * não dá para afirmar nada, e aí o atraso vem null em vez de zero.
 */
function secFrequencia_(celulas, seq) {
  var aulas = 0, faltas = 0, ultimaLicao = null, licaoPrevista = null, dadas = 0;
  var conteudo = seq ? seq.filter(function (c) { return !/^DT\d+$/.test(c); }) : null;

  for (var i = 0; i < celulas.length; i++) {
    var v = celulas[i];
    if (!v || /^\/+$/.test(v)) continue;
    if (v.charAt(0) === '.') { if (!licaoPrevista) licaoPrevista = v.substring(1); continue; }
    var low = v.toLowerCase();
    if (low === 'f') continue;                    // feriado não é aula dada
    aulas++;
    if (low === 'a') { faltas++; continue; }
    ultimaLicao = v;
    if (conteudo && conteudo.indexOf(v.toUpperCase()) > -1) dadas++;
  }

  var pctEstagio = null, atraso = null;
  if (conteudo && conteudo.length && ultimaLicao) {
    var idx = conteudo.lastIndexOf(String(ultimaLicao).toUpperCase());
    if (idx > -1) {
      pctEstagio = Math.min(100, Math.round((idx + 1) / conteudo.length * 100));
      atraso = Math.max(0, aulas - (idx + 1));
    }
  }
  return { aulas: aulas, faltas: faltas,
           pctFaltas: aulas ? Math.round(faltas / aulas * 100) : 0,
           ultimaLicao: ultimaLicao, licaoPrevista: licaoPrevista,
           pctEstagio: pctEstagio, atraso: atraso };
}

function secData_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }
  return String(v).trim();
}

/** Índice das duas escolas, com cache curto. Escrita chama secInvalida_. */
function secIndice_(escolas) {
  var alvos = escolas && escolas.length ? escolas : secEscolas_();
  var cache = CacheService.getScriptCache();
  var turmas = [], alunos = [], erros = [];

  alvos.forEach(function (e) {
    var bruto = cache.get('seccard_' + e);
    var dado = null;
    if (bruto) { try { dado = JSON.parse(bruto); } catch (err) { dado = null; } }
    if (!dado) {
      dado = secLerEscola_(e);
      if (dado.erro) { erros.push(e + ': ' + dado.erro); return; }
      /* O cache do Apps Script recusa valores acima de ~100 KB. Card grande
         simplesmente não entra — e aí a tela fica mais lenta, não quebrada. */
      try {
        var txt = JSON.stringify(dado);
        if (txt.length < 95000) cache.put('seccard_' + e, txt, SEC_CACHE_TTL);
      } catch (err2) {}
    }
    turmas = turmas.concat(dado.turmas || []);
    alunos = alunos.concat(dado.alunos || []);
  });
  return { turmas: turmas, alunos: alunos, erros: erros };
}

function secInvalida_(escola) {
  CacheService.getScriptCache().remove('seccard_' + escola);
}

/* ══════════════════════════════════════════════════════════════════════
   TELAS DE LEITURA
   ══════════════════════════════════════════════════════════════════════ */

/** Busca por nome ou RAF nas duas escolas. Devolve o essencial da linha. */
function secBusca_(req) {
  var termo = secNorm_(req.q);
  if (termo.length < 2) return { ok: false, error: 'Digite pelo menos 2 letras.' };
  var idx = secIndice_(req.escola ? [req.escola] : null);
  var alvoRaf = normRaf(req.q);

  var achados = idx.alunos.filter(function (a) {
    return secNorm_(a.nome).indexOf(termo) >= 0 || normRaf(a.raf) === alvoRaf;
  }).slice(0, 60).map(function (a) {
    return { escola: a.escola, professor: a.professor, turma: a.turma, linha: a.linha,
             nome: a.nome, raf: a.raf, book: a.book, status: a.status, ativo: a.ativo,
             faltas: a.faltas, pctFaltas: a.pctFaltas, atraso: a.atraso };
  });
  return { ok: true, alunos: achados, erros: idx.erros };
}

/**
 * Ficha 360° de um aluno: a linha do card, o que o portal do aluno sabe
 * (último acesso, saldo de Fisk Dólares) e a pasta dele no Drive.
 * É a tela que responde a ligação de pai sem abrir mais nada.
 */
function secFicha_(req) {
  var idx = secIndice_(req.escola ? [req.escola] : null);
  var raf = normRaf(req.raf);
  var linha = Number(req.linha || 0);

  var a = null;
  for (var i = 0; i < idx.alunos.length; i++) {
    var c = idx.alunos[i];
    if (raf && normRaf(c.raf) === raf) { a = c; break; }
    if (!raf && linha && c.linha === linha && c.professor === req.professor &&
        c.escola === req.escola) { a = c; break; }
  }
  if (!a) return { ok: false, error: 'Aluno não encontrado no card.' };

  var ficha = { ok: true, aluno: a };

  /* Portal do aluno: só faz sentido com RAF, que é a chave dele lá. */
  if (a.raf) {
    try {
      var ac = getAcessos().getDataRange().getValues();
      for (var j = 1; j < ac.length; j++) {
        // _acessos: RAF | Nome | Turma | Book | UltimoAcesso | Acessos | PrimeiroAcesso
        if (normRaf(ac[j][0]) === normRaf(a.raf)) {
          ficha.portal = { ultimoAcesso: ac[j][4] ? new Date(ac[j][4]).toISOString() : null,
                           total: Number(ac[j][5]) || 0 };
          break;
        }
      }
    } catch (err) {}
    if (!ficha.portal) ficha.portal = { ultimoAcesso: null, total: 0 };
    try {
      var w = fdWallet_(a.raf);
      ficha.carteira = { saldo: (w && w.saldo) || 0 };
    } catch (err2) { ficha.carteira = null; }
  }

  /* Alerta vem antes de tudo na tela: alergia e acordo com a família não
     podem depender de alguém rolar a ficha até o fim. */
  ficha.alertas = secAlertasDe_(a.raf, a.nome);

  /* Pasta no Drive: link direto poupa a secretária de caçar no Drive. */
  ficha.drive = secPastaDoAluno_(a);
  return ficha;
}

/** Localiza a pasta do aluno no Drive e devolve link + diagnóstico legível. */
function secPastaDoAluno_(a) {
  try {
    var raiz = rootDaEscola(a.escola);
    if (!raiz) return { ok: false, erro: 'escola sem raiz de Drive configurada' };
    var prof = acharPasta(raiz, a.professor);
    if (!prof) return { ok: false, erro: 'pasta do professor "' + limpa_(a.professor) + '" não existe' };
    var r = acharPastaDoAluno_(prof.getId(), a.turma, a.nome);
    if (r.erro) return { ok: false, erro: r.erro, professorUrl: prof.getUrl() };
    return { ok: true, url: r.pasta.getUrl(), pasta: r.pasta.getName(),
             turma: r.turma.getName(), turmaUrl: r.turma.getUrl(), via: r.via };
  } catch (err) {
    return { ok: false, erro: String(err) };
  }
}

/**
 * Mapa de turmas e vagas. É o que responde "tem vaga na 3ª à noite?" sem
 * abrir o card — inclusive com filtro por dia e faixa de horário, lidos do
 * nome da turma pelas mesmas funções que o salvamento no Drive já usa.
 */
function secTurmas_(req) {
  var idx = secIndice_(req.escola ? [req.escola] : null);
  var lista = idx.turmas.map(function (t) {
    var books = [];
    for (var b in t.books) if (t.books.hasOwnProperty(b)) books.push({ book: b, n: t.books[b] });
    books.sort(function (x, y) { return y.n - x.n; });
    return { escola: t.escola, professor: t.professor, turma: t.turma,
             capacidade: t.capacidade, ocupadas: t.ocupadas, livres: t.livres,
             books: books, dias: diasDe_(t.turma), horas: horasDe_(t.turma) };
  }).sort(function (x, y) {
    return x.escola === y.escola
      ? (x.professor === y.professor ? (x.turma < y.turma ? -1 : 1) : (x.professor < y.professor ? -1 : 1))
      : (x.escola < y.escola ? -1 : 1);
  });
  return { ok: true, turmas: lista, erros: idx.erros };
}

/**
 * Fila de atendimento: quem a secretária precisa procurar hoje.
 * Dois motivos, ambos calculados a partir do próprio cronograma:
 *   faltas   — % de ausência no que já foi dado (padrão: 30%)
 *   atraso   — aulas consumidas sem o conteúdo andar (padrão: 4, o mesmo
 *              gatilho do termo de atraso que a escola já usa)
 * Junto vem o último contato registrado, para ninguém ligar duas vezes.
 */
function secFila_(req) {
  var idx = secIndice_(req.escola ? [req.escola] : null);
  var minFaltas = req.minFaltas == null ? 30 : Number(req.minFaltas);
  var minAtraso = req.minAtraso == null ? 4 : Number(req.minAtraso);
  var contatos = secUltimosContatos_();

  var fila = idx.alunos.filter(function (a) {
    if (a.aulas < 2) return false;                          // turma que mal começou não acusa nada
    return a.pctFaltas >= minFaltas || (a.atraso != null && a.atraso >= minAtraso);
  }).map(function (a) {
    var motivos = [];
    if (a.pctFaltas >= minFaltas) motivos.push('faltas ' + a.pctFaltas + '%');
    if (a.atraso != null && a.atraso >= minAtraso) motivos.push('atraso de ' + a.atraso + ' aulas');
    var ult = a.raf ? contatos[normRaf(a.raf)] : null;
    return { escola: a.escola, professor: a.professor, turma: a.turma, nome: a.nome,
             raf: a.raf, book: a.book, linha: a.linha,
             /* vão junto porque a aba "Atrasados" do card pede exatamente
                isto: a lição em que o aluno deveria estar e em que está */
             ultimaLicao: a.ultimaLicao, licaoPrevista: a.licaoPrevista,
             faltas: a.faltas, aulas: a.aulas, pctFaltas: a.pctFaltas, atraso: a.atraso,
             telefone: a.telefone, respNome: a.respNome, respTel: a.respTel,
             respWhats: a.respWhats, motivos: motivos, ultimoContato: ult || null };
  }).sort(function (x, y) {
    var px = (x.atraso || 0) * 10 + x.pctFaltas;
    var py = (y.atraso || 0) * 10 + y.pctFaltas;
    return py - px;
  });
  return { ok: true, fila: fila, criterio: { minFaltas: minFaltas, minAtraso: minAtraso },
           erros: idx.erros };
}

/* ══════════════════════════════════════════════════════════════════════
   PRONTIDÃO DO SEMESTRE

   Uma linha por aluno, uma coluna por pendência. Nasceu do que os dois
   cards mostraram em 31/07/2026, faltando três semanas para as aulas
   começarem: 89 alunos com livro definido e não comprado, 36 sem RAF (e sem
   RAF o aluno não entra no Portal do Aluno), 38 sem telefone nenhum, 43 sem
   responsável — numa base em que 85% é menor de 18 —, e 33 contratos não
   aditados em Taubaté. Tudo isso já estava no card; o que não existia era
   uma tela que juntasse e deixasse resolver.
   ══════════════════════════════════════════════════════════════════════ */

/**
 * Interpreta a data de nascimento do card e diz se ela está invertida.
 * O cabeçalho da coluna manda MM/DD/AAAA, mas 10 alunos estão em DD/MM —
 * e como a coluna Idade é FÓRMULA em cima dessa data, a idade dessas
 * pessoas está errada no card. Dia acima de 12 na primeira posição é a
 * prova; quando os dois números cabem em mês, vale o que o cabeçalho diz.
 */
function secNasc_(txt) {
  var m = String(txt == null ? '' : txt).trim().match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/);
  if (!m) return null;
  var a = Number(m[1]), b = Number(m[2]), ano = Number(m[3]);
  if (ano < 100) ano += (ano > 30 ? 1900 : 2000);
  var mes, dia, invertida = false;
  if (a > 12 && b <= 12) { dia = a; mes = b; invertida = true; }
  else { mes = a; dia = b; }
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return { mes: mes, dia: dia, ano: ano, invertida: invertida };
}

/** As pendências de um aluno, considerando o que a escola dele controla. */
function secPendencias_(a, campos) {
  function tem(k) { return campos.indexOf(k) > -1; }
  var p = [];
  if (tem('raf') && !a.raf) p.push('raf');
  if (tem('book') && !a.book) p.push('livro');
  /* Só cobra livro comprado onde a coluna é caixa de seleção. Em Taubaté ela
     guarda o NOME do livro a comprar, e ali "não marcado" não quer dizer
     "não pagou". */
  if (tem('bookComprado') && a.book && a.bookComprado !== true) p.push('livroNaoComprado');
  if (a.aditamento === false) p.push('contratoNaoAditado');
  if (!a.telefone && !a.respTel) p.push('semContato');
  if (tem('respNome') && !a.respNome && a.idade && Number(a.idade) < 18) p.push('semResponsavel');
  if (tem('email') && !a.email) p.push('semEmail');
  if (tem('nascimento')) {
    var n = secNasc_(a.nascimento);
    if (!a.nascimento) p.push('semNascimento');
    else if (!n) p.push('nascimentoIlegivel');
    else if (n.invertida) p.push('nascimentoInvertido');
  }
  return p;
}

function secProntidao_(req) {
  var idx = secIndice_(req.escola ? [req.escola] : null);
  var campoDaTurma = {};
  idx.turmas.forEach(function (t) {
    campoDaTurma[t.escola + '|' + t.professor + '|' + t.turma] = t.campos || [];
  });

  var filtro = secNorm_(req.turma || '');
  var turmas = {}, ordem = [], resumo = {};

  idx.alunos.forEach(function (a) {
    var chave = a.escola + '|' + a.professor + '|' + a.turma;
    if (filtro && secNorm_(a.turma).indexOf(filtro) < 0 &&
        secNorm_(a.professor).indexOf(filtro) < 0) return;
    var campos = campoDaTurma[chave] || [];
    var pend = secPendencias_(a, campos);
    if (req.soPendentes === true && !pend.length) return;

    if (!turmas[chave]) {
      turmas[chave] = { escola: a.escola, professor: a.professor, turma: a.turma,
                        campos: campos, alunos: [], pendentes: 0 };
      ordem.push(chave);
    }
    turmas[chave].alunos.push({
      nome: a.nome, raf: a.raf, linha: a.linha, book: a.book,
      bookComprado: a.bookComprado, aditamento: a.aditamento,
      telefone: a.telefone, email: a.email, respNome: a.respNome, respTel: a.respTel,
      nascimento: a.nascimento, idade: a.idade, anoEscolar: a.anoEscolar,
      status: a.status, pendencias: pend
    });
    if (pend.length) turmas[chave].pendentes++;
    pend.forEach(function (k) { resumo[k] = (resumo[k] || 0) + 1; });
  });

  var lista = ordem.map(function (k) { return turmas[k]; })
                   .sort(function (x, y) { return y.pendentes - x.pendentes; });
  return { ok: true, turmas: lista, resumo: resumo, erros: idx.erros };
}

/** Quem já tem pasta no Drive, numa turma. Uma leitura do Drive por turma. */
function secProntidaoDrive_(req) {
  try {
    var raiz = rootDaEscola(String(req.escola || ''));
    if (!raiz) return { ok: false, error: 'escola sem raiz de Drive configurada' };
    var prof = acharPasta(raiz, String(req.professor || ''));
    if (!prof) return { ok: false, error: 'pasta do professor "' + limpa_(req.professor) + '" não existe' };
    var t = acharTurmaPasta_(prof.getId(), String(req.turma || ''));
    if (!t) return { ok: false, error: 'a turma "' + limpa_(req.turma) + '" ainda não tem pasta' };
    var nomes = (listarSubpastas_(t.pasta.getId()) || []).map(function (f) {
      return { nome: f.getName(), norm: normPasta_(f.getName()), url: f.getUrl() };
    });
    return { ok: true, turmaUrl: t.pasta.getUrl(), pastas: nomes };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Grava UM campo de UM aluno no card, direto do portal.
 *
 * Lista fechada de propósito: a secretaria resolve pendência de cadastro por
 * aqui, mas nota, faltas e cronograma continuam sendo do professor. E cada
 * escrita relê a linha antes, para nunca gravar em cima de outro aluno se o
 * card tiver mudado enquanto a tela estava aberta.
 */
var SEC_EDITAVEIS = {
  raf: 'texto', book: 'texto', bookComprado: 'sim/não', aditamento: 'sim/não',
  email: 'texto', telefone: 'texto', respNome: 'texto', respTel: 'texto',
  nascimento: 'texto', anoEscolar: 'texto', obs: 'texto', status: 'texto'
};

function secAtualizarAluno_(req, quem) {
  var campo = String(req.campo || '');
  if (!SEC_EDITAVEIS[campo]) return { ok: false, error: 'campo não editável por aqui: ' + campo };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var b = secAbrirBloco_(String(req.escola || ''), String(req.professor || ''), String(req.turma || ''));
    if (b.erro) return { ok: false, error: b.erro };
    var linha = Number(req.linha || 0);
    var erro = secConfereLinha_(b, linha, req.nome, req.raf);
    if (erro) return { ok: false, error: erro };

    /* O nome interno do campo e o da coluna coincidem, menos telefone: no
       mapeamento a do aluno se chama telAluno, para não se confundir com a
       do responsável. */
    var coluna = (campo === 'telefone') ? 'telAluno' : campo;
    var col = b.cols[coluna];
    if (col == null || col < 0) {
      return { ok: false, code: 'coluna_inexistente',
               error: 'O card de ' + req.escola + ' não tem a coluna desse campo nesta turma. ' +
                      'Dá para criá-la pelo painel de Padronização dos cards.' };
    }

    var antes = b.vals[linha - 1][col];
    var valor;
    if (SEC_EDITAVEIS[campo] === 'sim/não') valor = req.valor === true;
    else valor = String(req.valor == null ? '' : req.valor).trim();

    if (campo === 'raf' && valor && !RAF_VALIDO.test(valor)) {
      return { ok: false, error: 'RAF fora do formato esperado (ex.: B012-345).' };
    }
    if (campo === 'raf' && valor) {
      /* RAF repetido faz o Portal do Aluno mostrar a turma errada: o _alunos
         guarda a primeira ocorrência da planilha e ignora as outras. */
      var idx = secIndice_(null);
      for (var i = 0; i < idx.alunos.length; i++) {
        var o = idx.alunos[i];
        if (normRaf(o.raf) === normRaf(valor) && o.linha !== linha) {
          return { ok: false, error: 'O RAF ' + valor + ' já é de "' + o.nome + '" (' +
                                     o.professor + ' · ' + o.turma + ').' };
        }
      }
    }

    b.sh.getRange(linha, col + 1).setValue(valor);
    secInvalida_(req.escola);
    secLog_(quem, 'cadastro · ' + campo, req.escola, String(req.raf || ''), String(req.nome || ''),
            String(antes == null ? '' : antes), String(valor), req.professor + ' · ' + b.turma, null);
    return { ok: true, campo: campo, valor: valor };
  } finally {
    lock.releaseLock();
  }
}

/* ══════════════════════════════════════════════════════════════════════
   ANIVERSÁRIOS E VALIDAÇÃO DO CADASTRO
   ══════════════════════════════════════════════════════════════════════ */

var SEC_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/**
 * Aniversariantes de um mês. Com 85% da base abaixo de 18 anos, quem recebe
 * o parabéns na prática é a família — por isso vai junto o contato do
 * responsável, não só o do aluno.
 */
function secAniversarios_(req) {
  var mes = Number(req.mes || 0);
  if (!mes || mes < 1 || mes > 12) mes = new Date().getMonth() + 1;
  var idx = secIndice_(req.escola ? [req.escola] : null);
  var hoje = new Date(), anoAtual = hoje.getFullYear();

  var lista = [];
  idx.alunos.forEach(function (a) {
    var n = secNasc_(a.nascimento);
    if (!n || n.mes !== mes) return;
    lista.push({ nome: a.nome, escola: a.escola, professor: a.professor, turma: a.turma,
                 dia: n.dia, mes: n.mes, nascimento: a.nascimento,
                 invertida: n.invertida, fara: anoAtual - n.ano,
                 telefone: a.telefone, respNome: a.respNome, respTel: a.respTel,
                 respWhats: a.respWhats, raf: a.raf });
  });
  lista.sort(function (x, y) { return x.dia - y.dia; });
  return { ok: true, mes: mes, nomeMes: SEC_MESES[mes - 1], aniversariantes: lista,
           erros: idx.erros };
}

/**
 * Varredura de qualidade do cadastro. Não corrige nada — aponta, com a
 * coordenada exata (escola, professor, turma, linha) para a tela poder
 * abrir a ficha e resolver.
 */
function secValidarCadastro_(req) {
  var idx = secIndice_(req.escola ? [req.escola] : null);
  var achados = { datasInvertidas: [], datasIlegiveis: [], rafDuplicado: [],
                  alunoEmDuasTurmas: [], statusEstranho: [], nomeComAnotacao: [] };

  var porRaf = {}, porNome = {};
  var STATUS_OK = ['matriculado', 'rematriculado', 'aluno novo', 'transferido',
                   'desistente', 'trancado', 'formado'];

  idx.alunos.forEach(function (a) {
    var onde = { nome: a.nome, escola: a.escola, professor: a.professor,
                 turma: a.turma, linha: a.linha, raf: a.raf };

    if (a.nascimento) {
      var n = secNasc_(a.nascimento);
      if (!n) achados.datasIlegiveis.push(secComValor_(onde, a.nascimento));
      else if (n.invertida) {
        /* A coluna Idade é fórmula sobre esta data: invertida, a idade do
           card está errada — e é ela que separa menor de maior de idade. */
        achados.datasInvertidas.push(secComValor_(onde, a.nascimento +
          ' → deveria ser ' + secDoisDig_(n.mes) + '/' + secDoisDig_(n.dia) + '/' + n.ano));
      }
    }
    if (a.status && STATUS_OK.indexOf(secNorm_(a.status)) < 0) {
      achados.statusEstranho.push(secComValor_(onde, a.status));
    }
    /* Anotação entre parênteses no nome: além de virar dado escondido, o
       nome é a chave que casa com a pasta do aluno no Drive, e a anotação
       derruba o casamento exato. */
    if (/[\(\[]/.test(a.nome) || /\s-\s*MD\b/i.test(a.nome)) {
      achados.nomeComAnotacao.push(secComValor_(onde, secAnotacaoDoNome_(a.nome)));
    }
    if (a.raf) {
      var k = normRaf(a.raf);
      if (porRaf[k]) achados.rafDuplicado.push(secComValor_(onde, 'também em ' +
        porRaf[k].professor + ' · ' + porRaf[k].turma));
      else porRaf[k] = onde;
    }
    var chaveNome = secNorm_(secNomeLimpo_(a.nome));
    if (chaveNome.length > 5) {
      if (porNome[chaveNome] && porNome[chaveNome].turma !== a.turma) {
        achados.alunoEmDuasTurmas.push(secComValor_(onde, 'também em ' +
          porNome[chaveNome].professor + ' · ' + porNome[chaveNome].turma));
      } else if (!porNome[chaveNome]) porNome[chaveNome] = onde;
    }
  });

  var totais = {};
  for (var k2 in achados) if (achados.hasOwnProperty(k2)) totais[k2] = achados[k2].length;
  return { ok: true, achados: achados, totais: totais, alunos: idx.alunos.length,
           erros: idx.erros };
}

function secComValor_(onde, valor) {
  var o = {};
  for (var k in onde) if (onde.hasOwnProperty(k)) o[k] = onde[k];
  o.valor = valor;
  return o;
}
function secDoisDig_(n) { return (n < 10 ? '0' : '') + n; }

/**
 * O nome sem a anotação — é ele que casa com a pasta do aluno no Drive.
 *
 * Trata o que é reconhecível com segurança: o que está entre parênteses ou
 * colchetes, e o "- MD 2º sem ok". O separador que sobra ("Fulano - ") é
 * removido no fim, senão o nome limpo continuaria sem casar com a pasta.
 *
 * NÃO tenta adivinhar texto solto depois de um traço ("Fulano - Pagou ME
 * anual"): traço também aparece em nome de gente, e cortar por conta
 * própria arriscaria mutilar o nome de alguém. Esses casos a tela mostra
 * para a secretária confirmar.
 */
function secNomeLimpo_(nome) {
  return String(nome || '')
    .replace(/[\(\[][^)\]]*[)\]]/g, ' ')
    .replace(/\s-\s*MD\s*\d?º?\s*sem.*$/i, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—,;:.]+/, '')
    .replace(/[\s\-–—,;:.]+$/, '')
    .trim();
}
/** Só a anotação, para a tela mostrar o que seria movido para outro campo. */
function secAnotacaoDoNome_(nome) {
  var partes = String(nome || '').match(/[\(\[][^)\]]*[)\]]|\s-\s*MD\s*\d?º?\s*sem[^,]*/gi) || [];
  return partes.join(' ').replace(/\s+/g, ' ').trim();
}

/* ══════════════════════════════════════════════════════════════════════
   ESCRITA NO CARD
   Regra de ouro deste bloco: nada é escrito a partir do que a tela mandou
   como "estado". Toda escrita relê a planilha na hora, sob LockService,
   confere que a linha ainda é do aluno esperado e só então grava.
   ══════════════════════════════════════════════════════════════════════ */

/** Abre a aba do professor e devolve os valores crus + coordenadas do bloco. */
function secAbrirBloco_(escola, professor, turmaNome) {
  var ssId = CARD_IDS[escola];
  if (!ssId) return { erro: 'escola "' + escola + '" não existe no card' };
  var ss = SpreadsheetApp.openById(ssId);
  var sh = ss.getSheetByName(professor);
  if (!sh) return { erro: 'não existe a aba "' + professor + '" no card de ' + escola };
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  var vals = sh.getRange(1, 1, lastRow, lastCol).getValues();

  var alvo = secNorm_(turmaNome);
  for (var r = 0; r < vals.length; r++) {
    var num = vals[r][0], titulo = vals[r][1];
    var rotulo = vals[r + 2] ? String(vals[r + 2][2]).trim().toUpperCase() : '';
    if (num === '' || isNaN(num) || titulo === '' || rotulo !== 'ALUNOS') continue;
    var nome = String(titulo).split('\n')[0].replace(/\s+/g, ' ').trim();
    if (secNorm_(nome) !== alvo) continue;

    var cols = secColunas_(vals[r + 2], vals[r + 1]);
    var grade = secGradeLimites_(vals, r, cols, lastCol);
    var linhas = [], vagas = [];
    for (var k = r + 3; k < vals.length; k++) {
      var cnt = vals[k][0];
      if (cnt === '' || isNaN(cnt) || typeof vals[k][cols.ativo] !== 'boolean') break;
      linhas.push(k + 1);
      if (!String(vals[k][cols.nome] || '').trim()) vagas.push(k + 1);
    }
    /* Faixa que a transferência copia: do ATIVO até a última coluna antes do
       cronograma. Pega dados pessoais, notas e modalidade; deixa para trás as
       datas de aula, que são da turma e não do aluno. */
    return { sh: sh, vals: vals, cols: cols, turma: nome, grade: grade,
             largura: grade.ini - cols.ativo,
             linhas: linhas, vagas: vagas, linhaTitulo: r + 1 };
  }
  return { erro: 'não achei a turma "' + limpa_(turmaNome) + '" na aba de ' + professor };
}

/** Confere que a linha continua sendo do aluno que a tela mostrou. */
function secConfereLinha_(bloco, linha, nome, raf) {
  var v = bloco.vals[linha - 1];
  if (!v) return 'a linha ' + linha + ' não existe mais nessa aba';
  var nomeLa = String(v[bloco.cols.nome] || '').trim();
  var rafLa = String(v[bloco.cols.raf] || '').trim();
  if (raf && rafLa && normRaf(rafLa) !== normRaf(raf)) {
    return 'a linha ' + linha + ' agora é de outro RAF (' + rafLa + ') — o card mudou; recarregue';
  }
  if (!raf && secNorm_(nomeLa) !== secNorm_(nome)) {
    return 'a linha ' + linha + ' agora é de "' + nomeLa + '" — o card mudou; recarregue';
  }
  return null;
}

/**
 * Transferência de aluno entre turmas (mesma escola ou entre escolas).
 * modo:'simular' mostra tudo que aconteceria e não escreve nada.
 *
 * ORDEM DELIBERADA: o Drive vai PRIMEIRO. Se a pasta não puder ser movida
 * (raiz diferente, pasta inexistente, permissão), nada foi tocado no card e
 * a secretária vê o motivo. Se o card falhar depois, a pasta volta para o
 * lugar — não pode sobrar aluno com a pasta num professor e a linha noutro.
 */
function secTransferir_(req, quem) {
  var simular = String(req.modo || '') === 'simular';
  var de = { escola: String(req.escola || ''), professor: String(req.professor || ''),
             turma: String(req.turma || ''), linha: Number(req.linha || 0) };
  var para = { escola: String(req.novaEscola || req.escola || ''),
               professor: String(req.novoProfessor || ''),
               turma: String(req.novaTurma || '') };
  var manterOrigem = req.liberarVaga !== true;   // padrão: guarda a linha como registro

  if (!de.escola || !de.professor || !de.turma || !de.linha) {
    return { ok: false, error: 'Faltou dizer de onde o aluno sai.' };
  }
  if (!para.professor || !para.turma) {
    return { ok: false, error: 'Escolha o professor e a turma de destino.' };
  }
  if (de.escola === para.escola && secNorm_(de.professor) === secNorm_(para.professor) &&
      secNorm_(de.turma) === secNorm_(para.turma)) {
    return { ok: false, error: 'Origem e destino são a mesma turma.' };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var bo = secAbrirBloco_(de.escola, de.professor, de.turma);
    if (bo.erro) return { ok: false, error: bo.erro };
    var erroLinha = secConfereLinha_(bo, de.linha, req.nome, req.raf);
    if (erroLinha) return { ok: false, error: erroLinha };

    var origem = bo.vals[de.linha - 1];
    var nome = String(origem[bo.cols.nome] || '').trim();
    var raf = String(origem[bo.cols.raf] || '').trim();

    var bd = secAbrirBloco_(para.escola, para.professor, para.turma);
    if (bd.erro) return { ok: false, error: bd.erro };
    if (!bd.vagas.length) {
      return { ok: false, code: 'sem_vaga',
               error: 'A turma "' + bd.turma + '" está lotada (' + bd.linhas.length +
                      ' linhas, nenhuma livre). Abra linhas no card antes de transferir.' };
    }
    var linhaDestino = bd.vagas[0];

    /* Copia dados pessoais, notas e modalidade. O cronograma fica para trás
       de propósito: as datas são da turma antiga. A largura é a do DESTINO,
       para nunca escrever além do bloco que vai receber. */
    var largura = Math.min(bo.largura, bd.largura);
    var dados = origem.slice(bo.cols.ativo, bo.cols.ativo + largura);

    var plano = {
      aluno: nome, raf: raf,
      de: { escola: de.escola, professor: de.professor, turma: bo.turma, linha: de.linha },
      para: { escola: para.escola, professor: para.professor,
              turma: bd.turma, linha: linhaDestino },
      origem: manterOrigem ? 'fica como "' + SEC_STATUS.transferido + '", sem RAF'
                           : 'linha limpa (vaga liberada)',
      vagasDestinoAntes: bd.vagas.length
    };

    /* O Drive é simulado sempre — é a parte que mais falha, e a secretária
       precisa saber ANTES de confirmar se a pasta vai acompanhar. */
    plano.drive = secPlanoDrive_(de.escola, de.professor, bo.turma, nome,
                                 para.escola, para.professor, bd.turma);
    if (simular) return { ok: true, simulacao: true, plano: plano };

    /* 1) Drive primeiro. */
    var driveFeito = null;
    if (plano.drive.ok) {
      driveFeito = secMoverPasta_(plano.drive);
      if (!driveFeito.ok) return { ok: false, error: 'Drive: ' + driveFeito.erro, plano: plano };
    }

    /* 2) Card. Se explodir aqui, a pasta volta para onde estava. */
    var snapshot = { origem: origem.slice(0), linhaOrigem: de.linha,
                     escolaOrigem: de.escola, professorOrigem: de.professor,
                     turmaOrigem: bo.turma, linhaDestino: linhaDestino,
                     escolaDestino: para.escola, professorDestino: para.professor,
                     turmaDestino: bd.turma,
                     destinoAntes: bd.vals[linhaDestino - 1].slice(bd.cols.ativo, bd.cols.ativo + largura),
                     manterOrigem: manterOrigem };
    try {
      bd.sh.getRange(linhaDestino, bd.cols.ativo + 1, 1, largura).setValues([dados]);

      if (manterOrigem) {
        bo.sh.getRange(de.linha, bo.cols.ativo + 1).setValue(false);
        bo.sh.getRange(de.linha, bo.cols.status + 1).setValue(SEC_STATUS.transferido);
        bo.sh.getRange(de.linha, bo.cols.obs + 1).setValue(
          secConcat_(origem[bo.cols.obs], 'transferido para ' + para.professor + ' · ' +
                     bd.turma + ' em ' + secHoje_()));
        /* O RAF sai da linha antiga porque ele é a CHAVE do aluno: o
           _alunos e o portal procuram por RAF e ficam com a primeira
           ocorrência da planilha. RAF repetido faria o aluno continuar
           aparecendo na turma velha depois de transferido. */
        bo.sh.getRange(de.linha, bo.cols.raf + 1).setValue('');
      } else {
        var vazio = [];
        for (var z = 0; z < largura; z++) vazio.push(z === 0 ? false : '');
        bo.sh.getRange(de.linha, bo.cols.ativo + 1, 1, largura).setValues([vazio]);
      }
    } catch (errCard) {
      if (driveFeito && driveFeito.ok) secMoverPastaDeVolta_(driveFeito);
      return { ok: false, error: 'Não consegui escrever no card: ' + errCard +
                                 ' (a pasta no Drive voltou para o lugar).' };
    }

    secInvalida_(de.escola);
    secInvalida_(para.escola);
    var idLog = secLog_(quem, 'transferência', de.escola, raf, nome,
                        de.professor + ' · ' + bo.turma,
                        para.professor + ' · ' + bd.turma,
                        (driveFeito && driveFeito.ok ? 'pasta movida no Drive' : 'sem pasta no Drive'),
                        snapshot);
    return { ok: true, plano: plano, drive: driveFeito, log: idLog };
  } finally {
    lock.releaseLock();
  }
}

/** Junta uma observação nova ao que já estava escrito, sem apagar nada. */
function secConcat_(antes, novo) {
  var a = String(antes || '').trim();
  return a ? (a + ' · ' + novo) : novo;
}

function secHoje_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

/* ── Drive: mover a pasta do aluno entre professores ─────────────────── */

/** Descobre origem e destino da pasta sem mexer em nada. */
function secPlanoDrive_(escolaDe, profDe, turmaDe, aluno, escolaPara, profPara, turmaPara) {
  try {
    var raizDe = rootDaEscola(escolaDe), raizPara = rootDaEscola(escolaPara);
    if (!raizDe || !raizPara) return { ok: false, erro: 'escola sem raiz de Drive configurada' };
    var pDe = acharPasta(raizDe, profDe);
    if (!pDe) return { ok: false, erro: 'pasta do professor "' + limpa_(profDe) + '" não existe' };
    var r = acharPastaDoAluno_(pDe.getId(), turmaDe, aluno);
    if (r.erro) return { ok: false, erro: r.erro, semPasta: true };

    var pPara = acharPasta(raizPara, profPara);
    if (!pPara) return { ok: false, erro: 'pasta do professor "' + limpa_(profPara) + '" não existe em Planners ' + escolaPara };
    var tPara = acharTurmaPasta_(pPara.getId(), turmaPara);
    if (!tPara) return { ok: false, erro: 'a turma "' + limpa_(turmaPara) + '" não tem pasta em "' + pPara.getName() + '"' };

    return { ok: true, pastaId: r.pasta.getId(), pastaNome: r.pasta.getName(),
             deId: r.turma.getId(), deNome: r.turma.getName(),
             paraId: tPara.pasta.getId(), paraNome: tPara.pasta.getName(),
             professorDe: pDe.getName(), professorPara: pPara.getName(), via: tPara.via };
  } catch (err) {
    return { ok: false, erro: String(err) };
  }
}

function secMoverPasta_(plano) {
  try {
    DriveApp.getFolderById(plano.pastaId).moveTo(DriveApp.getFolderById(plano.paraId));
    return { ok: true, pastaId: plano.pastaId, deId: plano.deId, paraId: plano.paraId,
             pastaNome: plano.pastaNome, deNome: plano.deNome, paraNome: plano.paraNome };
  } catch (err) {
    /* Acontece de verdade quando as duas raízes estão em drives
       compartilhados diferentes: o Drive não move entre eles. */
    return { ok: false, erro: String(err) };
  }
}

function secMoverPastaDeVolta_(feito) {
  try { DriveApp.getFolderById(feito.pastaId).moveTo(DriveApp.getFolderById(feito.deId)); }
  catch (err) {}
}

/**
 * Baixa: desistência, trancamento ou transferência para fora da escola.
 * Não apaga a linha — desmarca o ATIVO, grava o motivo e (se pedido) leva a
 * pasta do aluno para "Alunos transferidos" do próprio professor, que é a
 * pasta que a escola já usa para isso.
 */
function secBaixa_(req, quem) {
  var tipo = String(req.tipo || 'desistente');
  var rotulo = SEC_STATUS[tipo] || SEC_STATUS.desistente;
  var motivo = String(req.motivo || '').trim();

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var b = secAbrirBloco_(String(req.escola || ''), String(req.professor || ''), String(req.turma || ''));
    if (b.erro) return { ok: false, error: b.erro };
    var linha = Number(req.linha || 0);
    var erro = secConfereLinha_(b, linha, req.nome, req.raf);
    if (erro) return { ok: false, error: erro };

    var v = b.vals[linha - 1];
    var nome = String(v[b.cols.nome] || '').trim();
    var raf = String(v[b.cols.raf] || '').trim();
    var snapshot = { linha: linha, escola: req.escola, professor: req.professor,
                     turma: b.turma, antes: v.slice(b.cols.ativo, b.cols.ultimaAdm + 1) };

    b.sh.getRange(linha, b.cols.ativo + 1).setValue(false);
    b.sh.getRange(linha, b.cols.status + 1).setValue(rotulo);
    b.sh.getRange(linha, b.cols.obs + 1).setValue(
      secConcat_(v[b.cols.obs], rotulo.toLowerCase() + ' em ' + secHoje_() +
                                (motivo ? ' · ' + motivo : '')));

    var drive = null;
    if (req.arquivarPasta === true) drive = secArquivarPasta_(req.escola, req.professor, b.turma, nome);

    secInvalida_(req.escola);
    var idLog = secLog_(quem, 'baixa · ' + rotulo, req.escola, raf, nome,
                        req.professor + ' · ' + b.turma, rotulo,
                        motivo + (drive ? ' · ' + (drive.ok ? 'pasta arquivada' : 'pasta: ' + drive.erro) : ''),
                        snapshot);
    return { ok: true, status: rotulo, drive: drive, log: idLog };
  } finally {
    lock.releaseLock();
  }
}

/** Move a pasta do aluno para "Alunos transferidos" dentro do professor. */
function secArquivarPasta_(escola, professor, turma, aluno) {
  try {
    var raiz = rootDaEscola(escola);
    var prof = acharPasta(raiz, professor);
    if (!prof) return { ok: false, erro: 'pasta do professor não existe' };
    var r = acharPastaDoAluno_(prof.getId(), turma, aluno);
    if (r.erro) return { ok: false, erro: r.erro };

    var destino = null;
    var subs = listarSubpastas_(prof.getId()) || [];
    for (var i = 0; i < subs.length; i++) {
      if (normPasta_(subs[i].getName()).indexOf('transferid') >= 0) { destino = subs[i]; break; }
    }
    if (!destino) destino = prof.createFolder('Alunos transferidos');
    r.pasta.moveTo(destino);
    return { ok: true, para: destino.getName(), url: r.pasta.getUrl() };
  } catch (err) {
    return { ok: false, erro: String(err) };
  }
}

/**
 * Matrícula: preenche a primeira vaga da turma e cria a pasta do aluno.
 * Não inventa RAF — ele vem do sistema da franqueadora e pode chegar depois;
 * sem RAF o aluno existe no card mas ainda não entra no Portal do Aluno.
 */
function secMatricular_(req, quem) {
  var nome = String(req.nome || '').trim();
  if (!nome) return { ok: false, error: 'Informe o nome do aluno.' };
  var raf = String(req.raf || '').trim();
  if (raf && !RAF_VALIDO.test(raf)) {
    return { ok: false, error: 'RAF fora do formato esperado (ex.: B012-345).' };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var b = secAbrirBloco_(String(req.escola || ''), String(req.professor || ''), String(req.turma || ''));
    if (b.erro) return { ok: false, error: b.erro };
    if (!b.vagas.length) {
      return { ok: false, code: 'sem_vaga',
               error: 'A turma "' + b.turma + '" está lotada. Abra linhas no card antes de matricular.' };
    }
    /* RAF repetido no card faria o portal do aluno mostrar a turma errada
       (o _alunos fica com a primeira ocorrência). Melhor barrar aqui. */
    if (raf) {
      var idx = secIndice_(null);
      for (var i = 0; i < idx.alunos.length; i++) {
        if (normRaf(idx.alunos[i].raf) === normRaf(raf)) {
          return { ok: false, error: 'O RAF ' + raf + ' já está em "' + idx.alunos[i].nome +
                                     '" (' + idx.alunos[i].professor + ' · ' + idx.alunos[i].turma + ').' };
        }
      }
    }

    var linha = b.vagas[0], c = b.cols;
    function grava(col, valor) { if (col >= 0) b.sh.getRange(linha, col + 1).setValue(valor); }
    grava(c.ativo, true);
    grava(c.nome, nome);
    grava(c.status, SEC_STATUS.novo);
    grava(c.book, String(req.book || '').trim());
    grava(c.bookComprado, req.bookComprado === true);
    grava(c.raf, raf);
    grava(c.nascimento, String(req.nascimento || '').trim());
    grava(c.anoEscolar, String(req.anoEscolar || '').trim());
    grava(c.email, String(req.email || '').trim());
    grava(c.telAluno, String(req.telefone || '').trim());
    grava(c.respNome, String(req.respNome || '').trim());
    grava(c.respTel, String(req.respTel || '').trim());
    if (String(req.obs || '').trim()) grava(c.obs, String(req.obs).trim());

    var drive = secCriarPastaAluno_(req.escola, req.professor, b.turma, nome);
    secInvalida_(req.escola);
    var idLog = secLog_(quem, 'matrícula', req.escola, raf, nome, '',
                        req.professor + ' · ' + b.turma,
                        drive.ok ? 'pasta criada no Drive' : 'pasta: ' + drive.erro,
                        { linha: linha, escola: req.escola, professor: req.professor, turma: b.turma });
    return { ok: true, linha: linha, turma: b.turma, drive: drive, log: idLog };
  } finally {
    lock.releaseLock();
  }
}

function secCriarPastaAluno_(escola, professor, turma, aluno) {
  try {
    var raiz = rootDaEscola(escola);
    var prof = acharPasta(raiz, professor);
    if (!prof) return { ok: false, erro: 'pasta do professor "' + limpa_(professor) + '" não existe' };
    var t = acharTurmaPasta_(prof.getId(), turma);
    if (!t) return { ok: false, erro: 'a turma "' + limpa_(turma) + '" ainda não tem pasta' };
    var ja = acharPasta(t.pasta.getId(), aluno);
    if (ja) return { ok: true, url: ja.getUrl(), pasta: ja.getName(), jaExistia: true };
    var nova = t.pasta.createFolder(aluno);
    return { ok: true, url: nova.getUrl(), pasta: nova.getName(), turma: t.pasta.getName() };
  } catch (err) {
    return { ok: false, erro: String(err) };
  }
}

/* ══════════════════════════════════════════════════════════════════════
   DOCUMENTOS
   ══════════════════════════════════════════════════════════════════════ */

/** Boletins (Report Cards) já gerados na pasta do aluno. */
function secBoletins_(req) {
  var a = { escola: String(req.escola || ''), professor: String(req.professor || ''),
            turma: String(req.turma || ''), nome: String(req.nome || '') };
  var p = secPastaDoAluno_(a);
  if (!p.ok) return { ok: false, error: p.erro };
  try {
    var arquivos = [], outros = 0;
    var it = secPastaPorUrl_(p.url).getFiles();
    while (it.hasNext()) {
      var f = it.next();
      var n = f.getName();
      if (String(f.getMimeType()).indexOf('pdf') < 0) continue;
      if (!/report\s*card/i.test(n)) { outros++; continue; }
      arquivos.push({ nome: n, url: f.getUrl(), atualizado: String(f.getLastUpdated()) });
    }
    arquivos.sort(function (x, y) { return x.atualizado < y.atualizado ? 1 : -1; });
    return { ok: true, pasta: p.pasta, pastaUrl: p.url, arquivos: arquivos, outros: outros };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/** O id da pasta sai da própria URL devolvida pelo Drive. */
function secPastaPorUrl_(url) {
  var m = String(url || '').match(/folders\/([A-Za-z0-9_-]+)/);
  if (!m) throw new Error('não consegui identificar a pasta a partir da URL');
  return DriveApp.getFolderById(m[1]);
}

/**
 * Grava um PDF montado no navegador (declaração, recibo) na pasta do aluno.
 * É o mesmo caminho do salvarPdfNoDrive das ferramentas, mas autenticado
 * pela SESSÃO da secretária em vez da chave — a página do portal não tem
 * chave nenhuma, e não vai passar a ter.
 */
function secSalvarPdf_(req, quem) {
  var a = { escola: String(req.escola || ''), professor: String(req.professor || ''),
            turma: String(req.turma || ''), nome: String(req.aluno || '') };
  var p = secPastaDoAluno_(a);
  if (!p.ok) return { ok: false, code: 'pasta_nao_encontrada', error: p.erro };
  try {
    var pasta = secPastaPorUrl_(p.url);
    var blob = Utilities.newBlob(Utilities.base64Decode(String(req.dados || '')),
                                 String(req.mime || 'application/pdf'),
                                 String(req.filename || 'documento.pdf'));
    var arq = pasta.createFile(blob);
    secLog_(quem, 'documento', a.escola, String(req.raf || ''), a.nome,
            '', p.pasta, arq.getName(), null);
    return { ok: true, url: arq.getUrl(), pasta: p.pasta, pastaUrl: p.url };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/* ══════════════════════════════════════════════════════════════════════
   ALERTAS DO ALUNO

   Existem porque o card não tem onde guardar isso, e a escola precisou
   guardar assim mesmo: "Aluno celíaco - intolerância a farinha" estava
   escrito DENTRO do nome de uma criança. Alergia, acordo com a família e
   restrição não podem depender de alguém ler o nome inteiro até o fim.

   Ficam numa aba do portal, não numa coluna nova do card, porque assim
   funcionam hoje nas duas escolas sem mexer na estrutura de nenhuma.
   ══════════════════════════════════════════════════════════════════════ */

var SEC_ALERTAS_ABA = '_secAlertas';
var SEC_ALERTAS_CAB = ['Quando', 'Quem', 'RAF', 'Aluno', 'Escola', 'Tipo', 'Alerta', 'Ativo'];
var SEC_ALERTA_TIPOS = ['saúde', 'restrição alimentar', 'acordo com a família',
                        'pedagógico', 'financeiro', 'material didático', 'outro'];

/** Chave do aluno nos alertas: o RAF quando existe, senão o nome limpo. */
function secChaveAluno_(raf, nome) {
  var r = normRaf(raf);
  return r || secNorm_(secNomeLimpo_(nome));
}

function secAlertasDe_(raf, nome) {
  var alvo = secChaveAluno_(raf, nome);
  if (!alvo) return [];
  var out = [];
  try {
    var vals = secAba_(SEC_ALERTAS_ABA, SEC_ALERTAS_CAB).getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][7]).toLowerCase() === 'não') continue;
      if (secChaveAluno_(vals[i][2], vals[i][3]) !== alvo) continue;
      out.push({ linha: i + 1, quando: vals[i][0] ? new Date(vals[i][0]).toISOString() : null,
                 quem: String(vals[i][1] || ''), tipo: String(vals[i][5] || ''),
                 alerta: String(vals[i][6] || '') });
    }
  } catch (err) {}
  return out;
}

function secAlertas_(req) {
  if (req.raf || req.nome) {
    return { ok: true, alertas: secAlertasDe_(req.raf, req.nome), tipos: SEC_ALERTA_TIPOS };
  }
  var vals = secAba_(SEC_ALERTAS_ABA, SEC_ALERTAS_CAB).getDataRange().getValues();
  var lista = [];
  for (var i = 1; i < vals.length; i++) {
    if (!vals[i][3] || String(vals[i][7]).toLowerCase() === 'não') continue;
    lista.push({ linha: i + 1, quando: vals[i][0] ? new Date(vals[i][0]).toISOString() : null,
                 quem: String(vals[i][1] || ''), raf: String(vals[i][2] || ''),
                 aluno: String(vals[i][3] || ''), escola: String(vals[i][4] || ''),
                 tipo: String(vals[i][5] || ''), alerta: String(vals[i][6] || '') });
  }
  return { ok: true, alertas: lista, tipos: SEC_ALERTA_TIPOS };
}

function secSalvarAlerta_(req, quem) {
  var sh = secAba_(SEC_ALERTAS_ABA, SEC_ALERTAS_CAB);
  /* Remover não apaga a linha: marca "Ativo = não". Alerta de saúde que
     alguém tirou por engano precisa poder ser reencontrado. */
  if (req.remover === true) {
    var linha = Number(req.linha || 0);
    if (linha < 2 || linha > sh.getLastRow()) return { ok: false, error: 'Alerta não encontrado.' };
    sh.getRange(linha, 8).setValue('não');
    return { ok: true, removido: true };
  }
  var texto = String(req.alerta || '').trim();
  if (!texto) return { ok: false, error: 'Escreva o alerta.' };
  sh.appendRow([new Date(), quem, String(req.raf || ''), String(req.nome || ''),
                String(req.escola || ''), String(req.tipo || 'outro'), texto, 'sim']);
  secLog_(quem, 'alerta · ' + String(req.tipo || 'outro'), String(req.escola || ''),
          String(req.raf || ''), String(req.nome || ''), '', texto, '', null);
  return { ok: true };
}

/* ── Limpeza dos nomes ────────────────────────────────────────────────
   Confirmado no Drive em 31/07/2026: as pastas dos alunos usam o nome
   LIMPO ("Miguel Machado Da Silva Fleckenstein"), então tirar a anotação
   do card melhora o casamento com a pasta em vez de piorar. */

/** Que tipo de alerta a anotação parece ser. Sugestão, não decisão. */
function secTipoDaAnotacao_(txt) {
  var t = secNorm_(txt);
  if (/celiac|alerg|intoleran|diabet|asma|remedio|laudo|tdah|autis/.test(t)) return 'saúde';
  if (/farinha|gluten|lactose|alimenta/.test(t)) return 'restrição alimentar';
  if (/bolsis|bolsa|pagou|mensalidade|anual|desconto/.test(t)) return 'financeiro';
  /* "MD 2º sem ok" é o mais comum de todos (39 alunos): é controle de
     material entregue, não alerta — a tela manda esse para OBSERVAÇÕES. */
  if (/\bmd\b|material|livro|book/.test(t)) return 'material didático';
  if (/pular|revisao|nivel|met|exame|estagio/.test(t)) return 'pedagógico';
  return 'outro';
}

/**
 * Alunos com anotação embutida no nome, com o nome limpo proposto e o
 * destino sugerido para a anotação. Não escreve nada.
 */
function secNomesSujos_(req) {
  var idx = secIndice_(req.escola ? [req.escola] : null);
  var lista = [];
  idx.alunos.forEach(function (a) {
    var anot = secAnotacaoDoNome_(a.nome);
    if (!anot) return;
    var limpo = secNomeLimpo_(a.nome);
    lista.push({
      escola: a.escola, professor: a.professor, turma: a.turma, linha: a.linha,
      nome: a.nome, raf: a.raf, limpo: limpo, anotacao: anot,
      tipo: secTipoDaAnotacao_(anot),
      /* Quando o traço sobra com texto que o limpador não reconhece, o nome
         proposto ainda tem "coisa" — a tela avisa que ali é preciso decidir. */
      precisaOlhar: /\s-\s/.test(limpo)
    });
  });
  return { ok: true, nomes: lista, tipos: SEC_ALERTA_TIPOS, erros: idx.erros };
}

/**
 * Grava o nome limpo no card e leva a anotação para onde ela deveria estar:
 * um alerta do aluno, a coluna OBSERVAÇÕES, ou as duas. O nome que a tela
 * mandou é reconferido contra a linha antes de gravar.
 */
function secLimparNome_(req, quem) {
  var novo = String(req.limpo || '').trim();
  if (!novo) return { ok: false, error: 'O nome limpo não pode ficar vazio.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var b = secAbrirBloco_(String(req.escola || ''), String(req.professor || ''), String(req.turma || ''));
    if (b.erro) return { ok: false, error: b.erro };
    var linha = Number(req.linha || 0);
    var erro = secConfereLinha_(b, linha, req.nome, req.raf);
    if (erro) return { ok: false, error: erro };

    var antes = String(b.vals[linha - 1][b.cols.nome] || '');
    b.sh.getRange(linha, b.cols.nome + 1).setValue(novo);

    var anot = String(req.anotacao || '').trim();
    if (anot && req.paraAlerta === true) {
      secSalvarAlerta_({ raf: req.raf, nome: novo, escola: req.escola,
                         tipo: String(req.tipo || 'outro'), alerta: anot }, quem);
    }
    if (anot && req.paraObs === true && b.cols.obs >= 0) {
      b.sh.getRange(linha, b.cols.obs + 1)
        .setValue(secConcat_(b.vals[linha - 1][b.cols.obs], anot));
    }

    secInvalida_(req.escola);
    secLog_(quem, 'limpeza de nome', req.escola, String(req.raf || ''), novo,
            antes, novo, anot, { linha: linha, antes: antes,
                                 escola: req.escola, professor: req.professor, turma: b.turma });
    return { ok: true, nome: novo };
  } finally {
    lock.releaseLock();
  }
}

/* ══════════════════════════════════════════════════════════════════════
   TURMAS PEQUENAS E SUGESTÃO DE FUSÃO

   O card já traz a decisão escrita no nome de duas turmas ("FECHAR TURMA",
   "KIDS (Multilevel?)"). Aqui ela vira número: quem está pequena, e para
   onde esses alunos caberiam sem perder dia, horário nem estágio.
   ══════════════════════════════════════════════════════════════════════ */

function secBookPrincipal_(t) {
  var melhor = '', n = 0;
  for (var b in t.books) if (t.books.hasOwnProperty(b) && t.books[b] > n) { melhor = b; n = t.books[b]; }
  return melhor;
}

function secFusoes_(req) {
  var limite = req.limite == null ? 4 : Number(req.limite);
  var idx = secIndice_(req.escola ? [req.escola] : null);

  var pequenas = idx.turmas.filter(function (t) { return t.ocupadas > 0 && t.ocupadas <= limite; });
  var lista = pequenas.map(function (t) {
    var bookT = secBookPrincipal_(t);
    var diasT = diasDe_(t.turma).map(String), horasT = horasDe_(t.turma);

    var candidatas = idx.turmas.filter(function (c) {
      if (c === t || c.escola !== t.escola) return false;
      if (c.turma === t.turma && c.professor === t.professor) return false;
      return c.livres >= t.ocupadas;      // sem vaga para todos, não é fusão
    }).map(function (c) {
      var pontos = 0, porques = [];
      if (bookT && c.books[bookT]) { pontos += 3; porques.push('mesmo livro (' + bookT + ')'); }
      var diasC = diasDe_(c.turma).map(String);
      var comum = diasT.filter(function (d) { return diasC.indexOf(d) >= 0; });
      if (comum.length) { pontos += 2; porques.push('dia em comum'); }
      var horasC = horasDe_(c.turma);
      var perto = null;
      horasT.forEach(function (h1) {
        horasC.forEach(function (h2) {
          var d = Math.abs(h1 - h2);
          if (perto == null || d < perto) perto = d;
        });
      });
      if (perto != null && perto <= 90) { pontos += 2; porques.push('horário a ' + perto + ' min'); }
      if (c.professor === t.professor) { pontos += 1; porques.push('mesmo professor'); }
      return { escola: c.escola, professor: c.professor, turma: c.turma,
               ocupadas: c.ocupadas, livres: c.livres, book: secBookPrincipal_(c),
               pontos: pontos, porques: porques };
    }).filter(function (c) { return c.pontos >= 3; })
      .sort(function (x, y) { return y.pontos - x.pontos; })
      .slice(0, 4);

    return { escola: t.escola, professor: t.professor, turma: t.turma,
             ocupadas: t.ocupadas, livres: t.livres, book: bookT,
             /* o próprio nome da turma às vezes já traz a decisão */
             marcada: /fechar|encerrar|cancelad/i.test(t.turma),
             candidatas: candidatas };
  }).sort(function (x, y) { return x.ocupadas - y.ocupadas; });

  return { ok: true, limite: limite, turmas: lista, erros: idx.erros };
}

/* ══════════════════════════════════════════════════════════════════════
   AGENDA DE REPOSIÇÃO E AULA EXPERIMENTAL

   Hoje isso vive como texto solto: "Está faltando a 1a aula para compensar
   no LC" na observação, e "Aluna de 2a 18h45 Mari, fará uma aula ex..."
   dentro do nome. É atendimento de secretaria e merece lugar próprio.
   ══════════════════════════════════════════════════════════════════════ */

var SEC_AGENDA_ABA = '_secAgenda';
var SEC_AGENDA_CAB = ['Criado', 'Quem', 'Tipo', 'Aluno', 'RAF', 'Escola', 'Professor',
                      'Turma', 'Data', 'Hora', 'Situação', 'Observação'];
var SEC_AGENDA_TIPOS = ['reposição', 'aula experimental', 'aula avulsa', 'prova de nivelamento'];

function secAgendar_(req, quem) {
  var aluno = String(req.aluno || '').trim();
  var data = String(req.data || '').trim();
  if (!aluno) return { ok: false, error: 'Informe o aluno.' };
  if (!data) return { ok: false, error: 'Informe a data.' };
  secAba_(SEC_AGENDA_ABA, SEC_AGENDA_CAB).appendRow([
    new Date(), quem, String(req.tipo || SEC_AGENDA_TIPOS[0]), aluno, String(req.raf || ''),
    String(req.escola || ''), String(req.professor || ''), String(req.turma || ''),
    data, String(req.hora || ''), 'marcada', String(req.obs || '')
  ]);
  secLog_(quem, 'agenda · ' + String(req.tipo || ''), String(req.escola || ''),
          String(req.raf || ''), aluno, '', data + ' ' + String(req.hora || ''),
          String(req.professor || ''), null);
  return { ok: true };
}

function secAgenda_(req) {
  var vals = secAba_(SEC_AGENDA_ABA, SEC_AGENDA_CAB).getDataRange().getValues();
  var hoje = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var lista = [];
  for (var i = 1; i < vals.length; i++) {
    if (!vals[i][3]) continue;
    var data = vals[i][8];
    var dataTxt = Object.prototype.toString.call(data) === '[object Date]'
      ? Utilities.formatDate(data, Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : String(data || '').trim();
    var situacao = String(vals[i][10] || 'marcada');
    /* O padrão é mostrar o que ainda vai acontecer e o que ficou para trás
       sem baixa — que é justamente o que a secretaria precisa perseguir. */
    if (req.todas !== true && situacao !== 'marcada') continue;
    lista.push({ linha: i + 1, tipo: String(vals[i][2] || ''), aluno: String(vals[i][3] || ''),
                 raf: String(vals[i][4] || ''), escola: String(vals[i][5] || ''),
                 professor: String(vals[i][6] || ''), turma: String(vals[i][7] || ''),
                 data: dataTxt, hora: String(vals[i][9] || ''), situacao: situacao,
                 obs: String(vals[i][11] || ''), atrasada: dataTxt && dataTxt < hoje });
  }
  lista.sort(function (a, b) { return a.data < b.data ? -1 : (a.data > b.data ? 1 : 0); });
  return { ok: true, agenda: lista, tipos: SEC_AGENDA_TIPOS };
}

function secAgendaSituacao_(req, quem) {
  var sh = secAba_(SEC_AGENDA_ABA, SEC_AGENDA_CAB);
  var linha = Number(req.linha || 0);
  if (linha < 2 || linha > sh.getLastRow()) return { ok: false, error: 'Agendamento não encontrado.' };
  var nova = String(req.situacao || '').trim() || 'realizada';
  sh.getRange(linha, 11).setValue(nova);
  sh.getRange(linha, 12).setValue(secConcat_(sh.getRange(linha, 12).getValue(),
                                             nova + ' por ' + quem + ' em ' + secHoje_()));
  return { ok: true, situacao: nova };
}

/* ══════════════════════════════════════════════════════════════════════
   ACESSO AO PORTAL DO ALUNO

   Quem nunca entrou. É a secretaria que entrega o RAF no balcão, então é
   ela que precisa da lista — com o contato de quem avisar junto.
   ══════════════════════════════════════════════════════════════════════ */

function secSemAcesso_(req) {
  var acessos = {};
  try {
    var av = getAcessos().getDataRange().getValues();
    for (var i = 1; i < av.length; i++) {
      var r = normRaf(av[i][0]);
      if (r) acessos[r] = { total: Number(av[i][5]) || 0,
                            ultimo: av[i][4] ? new Date(av[i][4]).getTime() : null };
    }
  } catch (err) {}

  var idx = secIndice_(req.escola ? [req.escola] : null);
  var dias = req.dias == null ? 30 : Number(req.dias);
  var corte = Date.now() - dias * 864e5;
  var nunca = [], sumidos = [];

  idx.alunos.forEach(function (a) {
    if (!a.raf) return;                       // sem RAF nem existe para o portal
    var ac = acessos[normRaf(a.raf)];
    var base = { nome: a.nome, raf: a.raf, escola: a.escola, professor: a.professor,
                 turma: a.turma, book: a.book, telefone: a.telefone,
                 respNome: a.respNome, respTel: a.respTel, respWhats: a.respWhats };
    if (!ac || !ac.total) { nunca.push(base); return; }
    if (ac.ultimo && ac.ultimo < corte) {
      base.ultimo = new Date(ac.ultimo).toISOString();
      base.total = ac.total;
      sumidos.push(base);
    }
  });
  sumidos.sort(function (x, y) { return x.ultimo < y.ultimo ? -1 : 1; });
  var semRaf = idx.alunos.filter(function (a) { return !a.raf; }).length;
  return { ok: true, nunca: nunca, sumidos: sumidos, dias: dias,
           semRaf: semRaf, total: idx.alunos.length, erros: idx.erros };
}

/* ══════════════════════════════════════════════════════════════════════
   BALCÃO DO FISK DÓLARES

   Quem entrega o prêmio é a secretária; o débito precisava sair do mesmo
   lugar. Lança valor NEGATIVO no extrato, que é o formato que o teto
   diário e as conquistas já ignoram.
   ══════════════════════════════════════════════════════════════════════ */

function secFdResgate_(req, quem) {
  var raf = normRaf(req.raf);
  var valor = Math.round(Number(req.valor));
  var item = String(req.item || '').trim();
  if (!raf) return { ok: false, error: 'Informe o RAF do aluno.' };
  if (!isFinite(valor) || valor <= 0) return { ok: false, error: 'Informe quantos Fisk Dólares ele está gastando.' };
  if (!item) return { ok: false, error: 'Diga o que o aluno está levando.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var cart = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']);
    var vals = cart.getDataRange().getValues();
    var row = -1, saldo = 0;
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0]).trim() === raf) { row = i + 1; saldo = Number(vals[i][1]) || 0; break; }
    }
    if (row < 0) return { ok: false, error: 'Esse aluno ainda não tem carteira de Fisk Dólares.' };
    if (saldo < valor) {
      return { ok: false, error: 'Saldo insuficiente: o aluno tem F$ ' + saldo + ' e o item custa F$ ' + valor + '.' };
    }
    var novo = saldo - valor;
    cart.getRange(row, 2, 1, 2).setValues([[novo, new Date()]]);
    fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo'])
      .appendRow([new Date(), raf, 'resgate-balcao', 'resgate',
                  item + ' · entregue por ' + quem, -valor, novo]);
    secLog_(quem, 'resgate F$', String(req.escola || ''), raf, String(req.nome || ''),
            'F$ ' + saldo, 'F$ ' + novo, item, null);
    return { ok: true, antes: saldo, saldo: novo, item: item };
  } finally {
    lock.releaseLock();
  }
}

/* ══════════════════════════════════════════════════════════════════════
   REGISTRO: contatos da fila e auditoria com desfazer
   ══════════════════════════════════════════════════════════════════════ */

function secAba_(nome, cabecalho) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.appendRow(cabecalho);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Uma linha por ação que mexeu em card ou Drive. Devolve o nº da linha. */
function secLog_(quem, acao, escola, raf, aluno, de, para, detalhe, snapshot) {
  var sh = secAba_(SEC_LOG_ABA, SEC_LOG_CAB);
  sh.appendRow([new Date(), quem, acao, escola, raf, aluno, de, para, detalhe,
                snapshot ? JSON.stringify(snapshot) : '']);
  return sh.getLastRow();
}

function secAuditoria_(req) {
  var sh = secAba_(SEC_LOG_ABA, SEC_LOG_CAB);
  var vals = sh.getDataRange().getValues();
  var lista = [];
  for (var i = vals.length - 1; i >= 1 && lista.length < 200; i--) {
    if (!vals[i][0]) continue;
    lista.push({ linha: i + 1, quando: new Date(vals[i][0]).toISOString(),
                 quem: String(vals[i][1] || ''), acao: String(vals[i][2] || ''),
                 escola: String(vals[i][3] || ''), raf: String(vals[i][4] || ''),
                 aluno: String(vals[i][5] || ''), de: String(vals[i][6] || ''),
                 para: String(vals[i][7] || ''), detalhe: String(vals[i][8] || ''),
                 reversivel: !!String(vals[i][9] || '') });
  }
  return { ok: true, log: lista };
}

/**
 * Desfaz uma transferência: devolve a linha de origem ao que era, limpa a
 * linha de destino e traz a pasta de volta. Só a transferência é reversível
 * — baixa e matrícula ficam registradas, mas são corrigidas na mão, porque
 * "desfazer" nelas significaria adivinhar o que a escola quis dizer.
 */
function secDesfazer_(req, quem) {
  var sh = secAba_(SEC_LOG_ABA, SEC_LOG_CAB);
  var linhaLog = Number(req.linhaLog || 0);
  if (linhaLog < 2 || linhaLog > sh.getLastRow()) return { ok: false, error: 'Registro não encontrado.' };
  var reg = sh.getRange(linhaLog, 1, 1, SEC_LOG_CAB.length).getValues()[0];
  if (String(reg[2]) !== 'transferência') {
    return { ok: false, error: 'Só transferência tem desfazer automático. Corrija esta no card.' };
  }
  var snap;
  try { snap = JSON.parse(String(reg[9] || '')); } catch (err) { snap = null; }
  if (!snap) return { ok: false, error: 'Este registro não guardou o estado anterior.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var bo = secAbrirBloco_(snap.escolaOrigem, snap.professorOrigem, snap.turmaOrigem);
    if (bo.erro) return { ok: false, error: bo.erro };
    var bd = secAbrirBloco_(snap.escolaDestino, snap.professorDestino, snap.turmaDestino);
    if (bd.erro) return { ok: false, error: bd.erro };

    /* A largura é a mesma que a transferência usou — está implícita no
       tamanho do trecho de destino que ela guardou antes de sobrescrever. */
    var largura = snap.destinoAntes.length;
    bo.sh.getRange(snap.linhaOrigem, bo.cols.ativo + 1, 1, largura)
      .setValues([snap.origem.slice(bo.cols.ativo, bo.cols.ativo + largura)]);
    bd.sh.getRange(snap.linhaDestino, bd.cols.ativo + 1, 1, largura)
      .setValues([snap.destinoAntes]);

    var drive = null;
    var p = secPlanoDrive_(snap.escolaDestino, snap.professorDestino, snap.turmaDestino,
                           String(reg[5] || ''),
                           snap.escolaOrigem, snap.professorOrigem, snap.turmaOrigem);
    if (p.ok) drive = secMoverPasta_(p);

    secInvalida_(snap.escolaOrigem);
    secInvalida_(snap.escolaDestino);
    sh.getRange(linhaLog, 9).setValue(String(reg[8] || '') + ' · DESFEITO por ' + quem + ' em ' + secHoje_());
    sh.getRange(linhaLog, 10).setValue('');   // não dá para desfazer duas vezes
    secLog_(quem, 'desfazer', snap.escolaOrigem, String(reg[4] || ''), String(reg[5] || ''),
            String(reg[7] || ''), String(reg[6] || ''), 'reverteu o registro da linha ' + linhaLog, null);
    return { ok: true, drive: drive };
  } finally {
    lock.releaseLock();
  }
}

function secRegistrarContato_(req, quem) {
  var raf = String(req.raf || '').trim();
  var nome = String(req.nome || '').trim();
  if (!raf && !nome) return { ok: false, error: 'Sem aluno não dá para registrar o contato.' };
  secAba_(SEC_CONTATOS_ABA, SEC_CONTATOS_CAB).appendRow([
    new Date(), quem, raf, nome, String(req.motivo || ''), String(req.resultado || ''),
    String(req.retornarEm || ''), String(req.obs || '')
  ]);
  /* A aba "Atrasados" do card já existia, preenchida à mão nas duas escolas,
     com exatamente estas perguntas — inclusive "Aluno/responsável
     comunicado?". Continuar mantendo as duas coisas em paralelo seria pedir
     para elas divergirem, então o portal passa a escrever lá também. */
  var espelho = null;
  if (req.escola) espelho = secAtrasadosGravar_(String(req.escola), req, quem);
  return { ok: true, atrasados: espelho };
}

/**
 * Espelha o contato na aba "Atrasados" da planilha da escola.
 * Lê o cabeçalho pelos rótulos, como todo o resto — as duas escolas têm a
 * aba, mas não garantidamente na mesma ordem. Se o aluno já tem linha lá, a
 * linha é atualizada em vez de duplicada: a aba é um retrato do estado de
 * cada aluno, não um histórico (o histórico fica na _secContatos).
 */
function secAtrasadosGravar_(escola, req, quem) {
  try {
    var ssId = CARD_IDS[escola];
    if (!ssId) return { ok: false, erro: 'escola desconhecida' };
    var sh = SpreadsheetApp.openById(ssId).getSheetByName('Atrasados');
    if (!sh) return { ok: false, erro: 'a planilha de ' + escola + ' não tem a aba "Atrasados"' };

    var lastRow = Math.max(sh.getLastRow(), 1), lastCol = Math.max(sh.getLastColumn(), 1);
    var vals = sh.getRange(1, 1, lastRow, lastCol).getValues();

    var cab = -1;
    for (var r = 0; r < vals.length && cab < 0; r++) {
      for (var c = 0; c < vals[r].length; c++) {
        if (secNorm_(vals[r][c]) === 'aluno') { cab = r; break; }
      }
    }
    if (cab < 0) return { ok: false, erro: 'não achei o cabeçalho da aba Atrasados' };

    var col = {};
    for (var c2 = 0; c2 < vals[cab].length; c2++) {
      var n = secNorm_(vals[cab][c2]);
      if (n === 'aluno') col.aluno = c2;
      else if (n === 'professor') col.professor = c2;
      else if (n.indexOf('data de verifica') === 0) col.data = c2;
      else if (n.indexOf('verificado por') === 0) col.quem = c2;
      else if (n.indexOf('licao que deveria') === 0) col.deveria = c2;
      else if (n.indexOf('licao no planner') === 0) col.planner = c2;
      else if (n.indexOf('aulas em atraso') === 0) col.atraso = c2;
      else if (n.indexOf('link da pasta') === 0) col.pasta = c2;
      else if (n.indexOf('comunicado') >= 0) col.comunicado = c2;
    }
    if (col.aluno == null) return { ok: false, erro: 'a aba Atrasados não tem coluna "Aluno"' };

    var alvo = secNorm_(String(req.nome || ''));
    var linha = -1, primeiraVazia = -1;
    for (var i = cab + 1; i < vals.length; i++) {
      var v = secNorm_(vals[i][col.aluno]);
      if (v === alvo) { linha = i + 1; break; }
      if (!v && primeiraVazia < 0) primeiraVazia = i + 1;
    }
    if (linha < 0) linha = primeiraVazia > 0 ? primeiraVazia : sh.getLastRow() + 1;

    function grava(c, valor) {
      if (c == null || valor === '' || valor == null) return;
      sh.getRange(linha, c + 1).setValue(valor);
    }
    grava(col.aluno, String(req.nome || ''));
    grava(col.professor, String(req.professor || ''));
    grava(col.data, new Date());
    grava(col.quem, quem);
    grava(col.deveria, String(req.licaoPrevista || ''));
    grava(col.planner, String(req.ultimaLicao || ''));
    grava(col.atraso, req.atraso == null ? '' : Number(req.atraso));
    grava(col.pasta, String(req.pastaUrl || ''));
    grava(col.comunicado, String(req.resultado || ''));
    return { ok: true, linha: linha, aba: 'Atrasados' };
  } catch (err) {
    return { ok: false, erro: String(err) };
  }
}

/** Último contato de cada RAF, para a fila não mandar ligar de novo. */
function secUltimosContatos_() {
  var mapa = {};
  try {
    var vals = secAba_(SEC_CONTATOS_ABA, SEC_CONTATOS_CAB).getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      var raf = normRaf(vals[i][2]);
      if (!raf) continue;
      mapa[raf] = { quando: vals[i][0] ? new Date(vals[i][0]).toISOString() : null,
                    quem: String(vals[i][1] || ''), resultado: String(vals[i][5] || ''),
                    retornarEm: String(vals[i][6] || '') };
    }
  } catch (err) {}
  return mapa;
}

function secContatos_(req) {
  var vals = secAba_(SEC_CONTATOS_ABA, SEC_CONTATOS_CAB).getDataRange().getValues();
  var raf = normRaf(req.raf);
  var lista = [];
  for (var i = vals.length - 1; i >= 1 && lista.length < 100; i--) {
    if (raf && normRaf(vals[i][2]) !== raf) continue;
    if (!vals[i][0]) continue;
    lista.push({ quando: new Date(vals[i][0]).toISOString(), quem: String(vals[i][1] || ''),
                 raf: String(vals[i][2] || ''), aluno: String(vals[i][3] || ''),
                 motivo: String(vals[i][4] || ''), resultado: String(vals[i][5] || ''),
                 retornarEm: String(vals[i][6] || ''), obs: String(vals[i][7] || '') });
  }
  return { ok: true, contatos: lista };
}
