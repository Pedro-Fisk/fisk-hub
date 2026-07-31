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
      case 'secBoletins':   return json(secBoletins_(r));
      case 'secAuditoria':  return json(secAuditoria_(r));
      case 'secContatos':   return json(secContatos_(r));
      /* escrita */
      case 'secTransferir': return json(secTransferir_(r, quem));
      case 'secBaixa':      return json(secBaixa_(r, quem));
      case 'secMatricular': return json(secMatricular_(r, quem));
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
      var turma = { escola: escola, professor: aba, turma: nomeTurma,
                    linhaTitulo: iTit + 1, ocupadas: 0, vagas: [], books: {},
                    colunas: cols, grade: grade };

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
  return { ok: true };
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
