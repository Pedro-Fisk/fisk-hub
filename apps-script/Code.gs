/* ═══════════════════════════════════════════════════════════════════════════
   ESPELHO do Code.gs que roda em produção (projeto Apps Script "Fisk Hub —
   Dados"), na versão implantada @72 — 30/07/2026.

   Existe para que a próxima sessão parta do código certo: as cópias parciais
   deste diretório (fisk-dolares.gs, salvar-no-drive.gs) ficaram para trás do
   arquivo real e já induziram erro uma vez.

   ⚠️ NÃO PUBLICAR ESTE ARQUIVO COM clasp push. Três chaves foram trocadas por
   marcadores porque este repositório é PÚBLICO — subir isto por cima do
   Apps Script derrubaria a autenticação de todas as ferramentas. O arquivo
   com os valores reais é ~/Claude/Projects/fisk-hub-backend/Code.js, que fica
   só na máquina local. Para editar o backend: clasp pull ali, nunca daqui.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════
   ARQUIVO COMPLETO DO BACKEND (Apps Script vinculado à planilha
   "Fisk Hub — Dados") — versão com a carteira Fisk Dólares integrada.
   Gerado em 28/07/2026 a partir do código enviado pelo Pedro + o módulo
   apps-script/fisk-dolares.gs. Para publicar: colar por cima do arquivo
   principal no editor do Apps Script e criar NOVA VERSÃO da implantação.
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Fisk Hub — Backend de dados (Google Apps Script + Google Sheets)
 *
 * A planilha que contém este script é o banco de dados. Publicado como Web App.
 *
 * FERRAMENTAS (cada uma grava em uma aba própria, ex.: "met"):
 *   - POST {key, tool, data}          → grava um registro (apps usam APP_KEY)
 *   - GET  ?key=TEACHER&tool=met      → lista os registros (painel do professor)
 *
 * PORTAL DO ALUNO (login pelo código RAF, validado aqui no servidor):
 *   - GET  ?action=login&raf=XXXX     → valida o RAF na lista "_alunos" e devolve nome/turma
 *   - GET  ?action=history&raf=XXXX   → devolve só os resultados daquele aluno (todas as ferramentas)
 *
 * Observação de segurança: o RAF é uma credencial de CONVENIÊNCIA (não é senha forte).
 * Serve para personalizar a experiência com dados pouco sensíveis (histórico de exercícios).
 * Para segurança forte no futuro, migrar para senha própria / Supabase (o front não muda).
 */

/* CHAVES — vivem nas Propriedades do Script, nunca no código-fonte.
   Em 28/07/2026 este arquivo foi commitado num repo PÚBLICO (fisk-hub,
   commit bd7bde5) e a TEACHER_KEY ficou exposta; por isso ela foi trocada
   em 30/07/2026 e as duas saíram daqui. Para ver/trocar: editor do Apps
   Script → Configurações do projeto → Propriedades do script.
   A TEACHER_KEY NÃO tem fallback de propósito: se a propriedade sumir, o
   servidor recusa tudo (falha fechada) em vez de voltar a uma chave velha.
   A APP_KEY mantém o valor no código porque ela é pública por desenho —
   está embutida nos simuladores, que são páginas abertas. */
const PROPS_ = PropertiesService.getScriptProperties();
const APP_KEY = PROPS_.getProperty('APP_KEY') || '<APP_KEY — valor real só no fisk-hub-backend local>';     // gravação (embutida nas ferramentas, pública por desenho)
const TEACHER_KEY = PROPS_.getProperty('TEACHER_KEY');                            // leitura total + admin (só direção/professor)

const HEADERS = ['Data', 'Aluno', 'Simulado', 'Acertos', 'Total', 'CEFR L', 'CEFR R&G', 'CEFR Geral', 'Teste', 'JSON'];
const ROSTER = '_alunos';

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    // Ferramentas do Fisk Hub: salva o PDF gerado na pasta da turma/do aluno no Drive
    if (req.fn === 'salvarPdf') return salvarPdfNoDrive(req);
    // Boletim: acha na pasta do aluno o PDF da 1ª avaliação para reabrir na ferramenta
    if (req.fn === 'buscarPdf') return buscarPdfDoAluno(req);
    // Carga da lista de matrículas (_alunos) — só professor. rows: [[RAF,Nome,Turma],...]
    if (req.action === 'seedRoster') {
      if (req.key !== TEACHER_KEY) return json({ ok: false, error: 'chave inválida' });
      return seedRoster(req.rows || [], !!req.replace);
    }
    // Portal do Professor: carga da lista, cadastro e login (senha hasheada no servidor)
    if (req.action === 'seedProfs') {
      if (req.key !== TEACHER_KEY) return json({ ok: false, error: 'chave inválida' });
      return seedProfs(req.rows || [], !!req.replace);
    }
    if (req.action === 'fdPurgeRaf') {
      if (req.key !== TEACHER_KEY) return json({ ok: false, error: 'chave inválida' });
      return fdJson_(fdPurgeRaf_(String(req.raf || '')));
    }
    if (req.action === 'removeProf') {
      if (req.key !== TEACHER_KEY) return json({ ok: false, error: 'chave inválida' });
      return removeProfAdmin(req.name);
    }
    if (req.action === 'profRegister') return profRegister(req);
    if (req.action === 'profLogin') return profLogin(req);
    if (req.action === 'profCheck') return profCheck(req);
    if (req.action === 'acessosProf') return acessosDoProf(req);   // professor: só as turmas dele
    if (req.action === 'usoFerramenta') return registrarUsoFerramenta(req);  // ferramenta avisa que abriu
    if (req.action === 'dirAcessosProf') return dirGuard(req, function () { return dirAcessosProf(); });
    if (req.action === 'dirImpersonate') return dirGuard(req, dirImpersonate); // direção: ver como o professor
    if (req.action === 'dirAcessos') return dirGuard(req, function () {
      return json({ ok: true, acessos: listarAcessos(req) });      // direção: todos
    });
    // Conversation Maker: backup do PPTX no Drive + histórico do professor
    if (req.action === 'salvarPptx') return cmSalvarPptx(req);
    if (req.action === 'cmHistory') return cmHistory(req);
    if (req.action === 'cmLogEvent') return cmLogEvent(req);
    if (req.action === 'cmStats') return dirGuard(req, cmStats);
    // Créditos do Conversation Maker: saldo do professor e débito (1 por aula).
    // O débito é server-side de propósito — na tela dava para burlar pelo console.
    if (req.action === 'cmCreditos') return cmCreditos(req);
    if (req.action === 'cmConsumir') return cmConsumir(req);
    if (req.action === 'dirSetCreditos') return dirGuard(req, dirSetCreditos);
    // Painel do Diretor: login emite token de sessão; ações admin exigem o token
    if (req.action === 'dirLogin') return dirLogin(req);
    if (req.action === 'dirCheck') return dirCheck(req);
    if (req.action === 'dirUsers') return dirGuard(req, dirUsers);
    if (req.action === 'dirResetPass') return dirGuard(req, dirResetPass);
    if (req.action === 'dirSetPass') return dirGuard(req, dirSetPass);
    if (req.action === 'dirRemoveUser') return dirGuard(req, dirRemoveUser);
    if (req.action === 'dirAddUser') return dirGuard(req, dirAddUser);
    // Fisk Dólares (Portal do Aluno): carteira gamificada — módulo no fim do arquivo
    if (req.action === 'fdEarn')    return fdJson_(fdEarn_(String(req.raf || ''), String(req.activityId || ''), Number(req.correct || 0), Number(req.total || 0)));
    if (req.action === 'fdCheckin') return fdJson_(fdCheckin_(String(req.raf || '')));
    if (req.action === 'fdBonus')   return fdJson_(fdBonus_(String(req.raf || ''), String(req.bonusId || '')));
    if (req.action && req.action.indexOf('dirFd') === 0) return dirGuard(req, fdDirRota_);
    // Treinamentos internos: leitura aberta (a página só devolve título e link,
    // os mesmos que já estavam no treinamentos-data.js público); publicar e
    // remover exigem token de diretor — módulo no fim do arquivo
    if (req.action === 'tnList') return json(tnList_());
    if (req.action && req.action.indexOf('dirTn') === 0) return dirGuard(req, tnDirRota_);
    if (req.key !== APP_KEY) return json({ ok: false, error: 'chave inválida' });
    const d = req.data || {};
    const sheet = getTab(toolName(req.tool));
    sheet.appendRow([
      new Date(d.t || Date.now()), d.n || '', d.s || '',
      d.c != null ? d.c : '', d.q != null ? d.q : '',
      d.L != null ? d.L : '', d.R != null ? d.R : '', d.O != null ? d.O : '',
      d.test || '', JSON.stringify(d)
    ]);
    // Fisk Dólares: resultado de aluno logado (tem RAF) credita a carteira.
    // Idempotente por atividade (tool + nome do simulado): a base paga uma vez,
    // refazer só paga a melhora. Falha aqui NÃO pode derrubar o salvamento.
    var fd = null;
    if (d.raf && d.q) {
      try {
        fd = fdEarn_(String(d.raf), toolName(req.tool) + ':' + String(d.s || ''), Number(d.c || 0), Number(d.q || 0));
      } catch (errFd) { fd = null; }
    }
    return json({ ok: true, fd: fd });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    const p = e.parameter || {};
    // Sessão inteira do aluno numa execução (login + F$ + situação + histórico)
    if (p.action === 'bootstrap') return studentBootstrap(p);
    if (p.action === 'login') return studentLogin(p);
    if (p.action === 'history') return studentHistory(p);
    // Fisk Dólares: saldo + extrato + streak + conquistas (dashboard da home)
    if (p.action === 'wallet') return fdJson_(fdWallet_(String(p.raf || '')));
    if (p.action === 'profList') return profList();
    // Portal do Aluno: progresso do estágio, última/próxima aula e faltas (lê o card)
    if (p.action === 'situacao') {
      const fonte = (p.teste === '1' && p.key === TEACHER_KEY) ? CARD_TESTE : null;
      return json({ ok: true, situacao: situacaoAluno_(p.raf, fonte) });
    }
    // Log de acessos dos alunos (professor/direção) — exige TEACHER_KEY
    if (p.action === 'acessos') {
      if (p.key !== TEACHER_KEY) return json({ ok: false, error: 'chave inválida' });
      return json({ ok: true, acessos: listarAcessos(p) });
    }
    // Diagnóstico do salvamento no Drive: lista o que o script enxerga.
    // Existe porque a falha "pasta não encontrada" é ambígua — pode ser nome
    // que não casa OU escopo do Drive não autorizado; aqui a diferença aparece.
    if (p.action === 'driveDebug') {
      if (p.key !== TEACHER_KEY) return json({ ok: false, error: 'chave inválida' });
      return driveDebug(p.escola, p.pasta);
    }
    // Simula o salvamento (acha as pastas, NÃO grava nada) — para validar o
    // casamento turma→pasta em massa antes de soltar para os professores.
    if (p.action === 'driveMatch') {
      if (p.key !== TEACHER_KEY) return json({ ok: false, error: 'chave inválida' });
      return driveMatch(p);
    }
    // Força a sincronização _alunos ← cards (uso administrativo)
    if (p.action === 'syncRoster') {
      if (p.key !== TEACHER_KEY) return json({ ok: false, error: 'chave inválida' });
      return json({ ok: true, sync: syncRosterFromCards() });
    }
    // Padrão: leitura do professor (uma ferramenta), exige TEACHER_KEY
    if (p.key !== TEACHER_KEY) return json({ ok: false, error: 'chave inválida' });
    const rows = getTab(toolName(p.tool)).getDataRange().getValues().slice(1);
    return json({ ok: true, results: parseRows(rows) });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ── Portal do aluno ── */
function normRaf(v) { return String(v == null ? '' : v).trim().toUpperCase(); }

// Compara RAFs tolerando a conversão automática de zeros à esquerda do Sheets
// (ex.: "0001" digitado pelo aluno x 1 guardado como número na planilha).
function rafEquals(a, b) {
  a = normRaf(a); b = normRaf(b);
  if (!a || !b) return false;
  if (a === b) return true;
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) return Number(a) === Number(b);
  return false;
}

function findStudent(raf) {
  if (!normRaf(raf)) return null;
  const rows = getRoster().getDataRange().getValues().slice(1);
  for (var i = 0; i < rows.length; i++) {
    if (rafEquals(rows[i][0], raf)) {
      return { raf: normRaf(rows[i][0]), name: String(rows[i][1] || '').trim(),
               turma: String(rows[i][2] || '').trim(), book: String(rows[i][3] || '').trim() };
    }
  }
  return null;
}

function studentLogin(p) {
  try { maybeSyncRoster_(); } catch (e) {} // mantém _alunos espelhando os cards (books atualizados)
  const st = findStudent(p.raf);
  if (!st) return json({ ok: false, error: 'RAF não encontrado' });
  st.raf = normRaf(p.raf); // devolve o RAF como o aluno digitou (preserva zeros à esquerda)
  try { registrarAcesso_(st); } catch (e) {}
  return json({ ok: true, student: st });
}

/* ── Situação do aluno no card (progresso do estágio, última/próxima aula, faltas) ──
 * Lê os cards direto (mesma fonte do syncRoster). Porta a análise do Planejador:
 * ".Lx" = placeholder (plano), texto normal = aula dada, "a" = falta, "f" = feriado.
 * Fica AQUI (e não no script do card) para o portal não depender de outro projeto. */
const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'SÁB', 'DOM'];

function lerGabaritoCard_(ss) {
  const sh = ss.getSheetByName('Gabarito Placeholder');
  const mapa = {};
  if (!sh) return mapa;
  sh.getDataRange().getValues().forEach(function (row) {
    const nome = String(row[0]).trim();
    if (!nome || nome.charAt(0) === '.') return;
    const seq = row.slice(1)
      .map(function (v) { return String(v).trim().replace(/^\./, '').toUpperCase(); })
      .filter(function (v) { return v !== ''; });
    if (seq.length) mapa[nome.toLowerCase()] = seq;
  });
  return mapa;
}

function seqDoBookCard_(gabarito, book) {
  const b = String(book || '').trim().toLowerCase();
  if (!b) return null;
  if (gabarito[b]) return gabarito[b];
  const base = b.replace(/\s+[12]$/, '');
  for (var nome in gabarito) { if (nome.indexOf(base) === 0) return gabarito[nome]; }
  return null;
}

// Card do 1º semestre: só para VALIDAR a análise (tem dados reais preenchidos).
// Nunca entra na busca normal — exige TEACHER_KEY (?teste=1&key=…).
const CARD_TESTE = { 'Caçapava (1º sem)': '1x2SC10w0G7sbY-2zo7X8eS06XMMnzzq0zvm6ovm5oPk' };

/* A situação é a parte cara da sessão: abre os cards das duas escolas e varre
   a turma do aluno (~5,4s medidos, contra ~3,2s das outras partes juntas).
   O card, porém, muda no ritmo da aula — no máximo uma vez por dia por turma.
   Guardar 3h corta esse custo de quase toda visita: só a primeira do turno
   paga. Se o professor lançar a aula agora, o aluno vê em até 3h.
   Falha no cache nunca derruba a resposta: no pior caso, calcula de novo. */
const SITU_TTL_S = 3 * 60 * 60;

function situacaoCache_(raf) {
  var chave = 'situ:' + String(raf || '').toUpperCase();
  var cache = null;
  try { cache = CacheService.getScriptCache(); } catch (e) {}
  if (cache) {
    var hit = cache.get(chave);
    if (hit) { try { return JSON.parse(hit); } catch (e) {} }
  }
  var s = situacaoAluno_(raf, null);
  if (cache && s) { try { cache.put(chave, JSON.stringify(s), SITU_TTL_S); } catch (e) {} }
  return s;
}

function situacaoAluno_(raf, fonte) {
  const alvo = normRaf(raf);
  if (!alvo) return null;
  const cards = fonte || CARD_IDS;
  var achado = null;
  Object.keys(cards).some(function (escola) {
    const ss = SpreadsheetApp.openById(cards[escola]);
    const gabarito = lerGabaritoCard_(ss);
    return ss.getSheets().some(function (sh) {
      const nomeAba = sh.getName(), up = nomeAba.toUpperCase();
      if (CARD_ABAS_IGNORAR.indexOf(nomeAba) > -1 || up.indexOf('CALEND') === 0) return false;
      const lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
      if (lastRow < 4 || lastCol < 8) return false;
      const vals = sh.getRange(1, 1, lastRow, lastCol).getValues();
      for (var r = 0; r < vals.length; r++) {
        if (normRaf(vals[r][7]) !== alvo) continue;
        // acha a linha-título do bloco desta turma (subindo)
        var iTit = -1;
        for (var k = r; k >= 0; k--) {
          const num = vals[k][0], tit = vals[k][1];
          const rot = vals[k + 2] ? String(vals[k + 2][2]).trim().toUpperCase() : '';
          if (num !== '' && !isNaN(num) && tit !== '' && rot === 'ALUNOS') { iTit = k; break; }
        }
        if (iTit < 0) continue;
        // colunas do cronograma: da 1ª coluna de dia da semana até antes de "Faltas".
        // Fallback igual ao do Planejador: coluna R (18) quando a linha de dias não é legível.
        var ini = -1;
        const linhaDias = vals[iTit + 1] || [];
        for (var c = 0; c < linhaDias.length; c++) {
          if (DIAS_SEMANA.indexOf(String(linhaDias[c]).trim().toUpperCase()) > -1) { ini = c; break; }
        }
        if (ini < 0) ini = 17; // col R (0-based)
        var fim = lastCol;
        for (var c2 = vals[iTit].length - 1; c2 >= 0; c2--) {
          if (String(vals[iTit][c2]).trim() === 'Faltas') { fim = c2; break; }
        }
        const celulas = vals[r].slice(ini, fim).map(function (v) { return String(v == null ? '' : v).trim(); });
        const book = String(vals[r][5] || '').trim();
        const seq = seqDoBookCard_(gabarito, book);
        var faltas = 0, ultimaAula = null, ultimaLicao = null, licaoPrevista = null;
        celulas.forEach(function (v) {
          if (!v || /^\/+$/.test(v)) return;
          const low = v.toLowerCase();
          if (low === 'f' || v.charAt(0) === '.') return;   // feriado / plano futuro
          if (low === 'a') { faltas++; return; }            // falta
          ultimaAula = v;
          if (seq && seq.indexOf(v.toUpperCase()) > -1) ultimaLicao = v;
        });
        for (var p2 = 0; p2 < celulas.length; p2++) {
          if (celulas[p2].charAt(0) === '.') { licaoPrevista = celulas[p2].substring(1); break; }
        }
        // % do estágio = posição da última lição na sequência (sem as datas extras "DT")
        var pctEstagio = null;
        if (seq && ultimaLicao) {
          const conteudo = seq.filter(function (c3) { return !/^DT\d+$/.test(c3); });
          const idx = conteudo.lastIndexOf(ultimaLicao.toUpperCase());
          if (idx > -1 && conteudo.length) pctEstagio = Math.min(100, Math.round((idx + 1) / conteudo.length * 100));
        }
        achado = {
          escola: escola, turma: String(vals[iTit][1]).split('\n')[0].trim(), book: book,
          pctEstagio: pctEstagio, ultimaAula: ultimaAula, ultimaLicao: ultimaLicao,
          licaoPrevista: licaoPrevista, faltas: faltas
        };
        return true;
      }
      return false;
    });
  });
  return achado;
}

/* ── Log de acessos do aluno (professor/direção veem quem entrou e quando) ──
 * Aba _acessos: uma linha por aluno (RAF), com o último acesso e o total de
 * acessos. É um retrato do uso, não um rastro detalhado de navegação. */
const ACESSOS = '_acessos';

function getAcessos() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(ACESSOS);
  if (!sh) {
    sh = ss.insertSheet(ACESSOS);
    sh.getRange('A:A').setNumberFormat('@');
    sh.appendRow(['RAF', 'Nome', 'Turma', 'Book', 'UltimoAcesso', 'Acessos', 'PrimeiroAcesso']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function registrarAcesso_(st) {
  const sh = getAcessos();
  const alvo = normRaf(st.raf);
  const vals = sh.getDataRange().getValues();
  const agora = new Date();
  for (var i = 1; i < vals.length; i++) {
    if (rafEquals(vals[i][0], alvo)) {
      sh.getRange(i + 1, 2, 1, 5).setValues([[st.name || '', st.turma || '', st.book || '',
                                              agora, (Number(vals[i][5]) || 0) + 1]]);
      return;
    }
  }
  sh.appendRow([alvo, st.name || '', st.turma || '', st.book || '', agora, 1, agora]);
}

// Leitura do log (professor/direção). Inclui TODOS os alunos da _alunos —
// quem nunca entrou vem com last=null/count=0 (é a informação mais útil:
// saber quem ainda não acessou). ?turma= filtra por trecho do nome da turma.
function listarAcessos(p) {
  const log = {};
  getAcessos().getDataRange().getValues().slice(1).forEach(function (r) {
    const raf = normRaf(r[0]);
    if (!raf) return;
    log[raf] = { last: r[4] ? new Date(r[4]).getTime() : null,
                 count: Number(r[5]) || 0,
                 first: r[6] ? new Date(r[6]).getTime() : null };
  });
  const filtro = String((p && p.turma) || '').trim().toLowerCase();
  const out = [];
  getRoster().getDataRange().getValues().slice(1).forEach(function (r) {
    const raf = normRaf(r[0]);
    if (!raf) return;
    const turma = String(r[2] || '');
    if (filtro && turma.toLowerCase().indexOf(filtro) === -1) return;
    const l = log[raf] || { last: null, count: 0, first: null };
    out.push({ raf: raf, name: String(r[1] || ''), turma: turma, book: String(r[3] || ''),
               last: l.last, count: l.count, first: l.first });
  });
  out.sort(function (a, b) { return (b.last || 0) - (a.last || 0); });
  return out;
}

// Acessos dos alunos DO PROFESSOR logado (SSO por token — nenhuma chave no
// front público). Casa as turmas do professor no card com a turma da _alunos.
function acessosDoProf(req) {
  const linha = profResolveLinha_(req.token);
  if (!linha) return json({ ok: false, error: 'Sessão expirada. Entre novamente pelo Fisk Hub.' });
  const sh = getProfs();
  const nomeProf = String(sh.getRange(linha, 1).getValue() || '').trim();
  const escolas = String(sh.getRange(linha, 2).getValue() || '').split(',')
    .map(function (e) { return e.trim(); }).filter(Boolean);

  // turmas do professor = blocos da aba com o nome dele, em cada card
  const chave = function (s) {
    return String(s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ').trim();
  };
  const minhas = {};
  escolas.forEach(function (escola) {
    const id = CARD_IDS[escola];
    if (!id) return;
    const aba = SpreadsheetApp.openById(id).getSheetByName(nomeProf);
    if (!aba) return;
    const lastRow = aba.getLastRow();
    if (lastRow < 3) return;
    const vals = aba.getRange(1, 1, lastRow, 3).getValues();
    for (var r = 0; r < vals.length - 2; r++) {
      const num = vals[r][0], tit = vals[r][1];
      const rot = vals[r + 2] ? String(vals[r + 2][2]).trim().toUpperCase() : '';
      if (num !== '' && !isNaN(num) && tit !== '' && rot === 'ALUNOS') {
        minhas[chave(String(tit).split('\n')[0])] = true;
      }
    }
  });
  const todos = listarAcessos({});
  const meus = todos.filter(function (a) { return minhas[chave(a.turma)]; });
  return json({ ok: true, prof: nomeProf, turmas: Object.keys(minhas).length, acessos: meus });
}

function studentHistory(p) {
  const st = findStudent(p.raf);
  if (!st) return json({ ok: false, error: 'RAF não encontrado' });
  st.raf = normRaf(p.raf);
  return json({ ok: true, student: st, results: historyDe_(st) });
}

/* Varre as abas de ferramenta atrás dos resultados do aluno. Extraído de
   studentHistory para o bootstrap reusar sem refazer a busca na matrícula. */
function historyDe_(st) {
  const ss = SpreadsheetApp.getActive();
  const out = [];
  ss.getSheets().forEach(function (sh) {
    const name = sh.getName();
    if (name.charAt(0) === '_') return; // ignora abas de sistema (_alunos)
    parseRows(sh.getDataRange().getValues().slice(1)).forEach(function (d) {
      if (rafEquals(d.raf, st.raf)) { d.tool = name; out.push(d); }
    });
  });
  out.sort(function (a, b) { return (b.t || 0) - (a.t || 0); });
  return out;
}

/* ── bootstrap: a sessão inteira do aluno numa execução só ─────────────────
 * O portal fazia CINCO chamadas por sessão (login, fdCheckin, wallet,
 * history, situacao). Cada chamada é uma execução do Apps Script, e a medição
 * de 30/07/2026 achou o teto: 25 simultâneas já quadruplicam a latência e 50
 * derrubam 10% com "Muitos pedidos simultâneos: Planilhas". Com uma turma
 * inteira entrando junto, cinco chamadas por aluno estouravam o limite muito
 * antes dos 500 alunos da escola.
 *
 * Juntando aqui, a busca na matrícula acontece UMA vez em vez de três, e a
 * escola cabe folgada no mesmo backend.
 *
 * Cada parte tem try/catch próprio de propósito: com chamadas separadas, uma
 * falha derrubava só o bloco dela na tela (o dashboard de situação, por
 * exemplo, já se escondia sozinho). Esse comportamento tinha de sobreviver à
 * junção — o aluno entra mesmo que o card esteja fora do ar.
 */
function studentBootstrap(p) {
  try { maybeSyncRoster_(); } catch (e) {}
  const st = findStudent(p.raf);
  if (!st) return json({ ok: false, error: 'RAF não encontrado' });
  st.raf = normRaf(p.raf);
  try { registrarAcesso_(st); } catch (e) {}

  const out = { ok: true, student: st };

  // Fisk Dólares. A ORDEM importa: o check-in credita, cobra a inatividade e
  // segura a sequência; só depois o extrato é lido, para já sair com o
  // lançamento de hoje dentro.
  try {
    const chk = fdCheckin_(st.raf);
    out.fd = chk && chk.ok ? {
      ok: true, saldo: chk.saldo, streak: chk.streak, badges: chk.badges,
      credito: chk.credito, acesso: chk.acesso, penalidade: chk.penalidade,
      novasBadges: chk.novasBadges, extrato: fdExtratoDe_(st.raf)
    } : fdWallet_(st.raf);
  } catch (e) { out.fd = { ok: false, error: String(e) }; }

  try { out.situacao = situacaoCache_(st.raf); } catch (e) { out.situacao = null; }
  try { out.results = historyDe_(st); } catch (e) { out.results = []; }

  return json(out);
}

/* ── util ── */
function parseRows(rows) {
  return rows.map(function (r) { try { return JSON.parse(r[9]); } catch (err) { return null; } }).filter(Boolean);
}

function toolName(t) {
  const clean = String(t || 'met').replace(/[^a-z0-9_-]/gi, '').slice(0, 30);
  return clean || 'met';
}

function getTab(tool) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(tool);
  if (!sh) { sh = ss.insertSheet(tool); sh.appendRow(HEADERS); sh.setFrozenRows(1); }
  return sh;
}

function getRoster() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(ROSTER);
  if (!sh) {
    sh = ss.insertSheet(ROSTER);
    sh.getRange('A:A').setNumberFormat('@'); // RAF sempre como texto (preserva zeros à esquerda)
    sh.appendRow(['RAF', 'Nome', 'Turma']);
    sh.appendRow(['0001', 'Aluno Exemplo', 'MET Prep A']);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Grava a lista de matrículas na aba _alunos (RAF/Nome/Turma/Book).
// replace=true limpa o conteúdo antigo antes.
function seedRoster(rows, replace) {
  const sh = getRoster();
  sh.getRange('A:A').setNumberFormat('@'); // RAF sempre como texto
  sh.getRange(1, 1, 1, 4).setValues([['RAF', 'Nome', 'Turma', 'Book']]);
  if (replace && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 4).clearContent();
  }
  const clean = (rows || [])
    .filter(function (r) { return r && String(r[0]).trim(); })
    .map(function (r) {
      return [String(r[0]).trim(), String(r[1] || '').trim(),
              String(r[2] || '').trim(), String(r[3] || '').trim()];
    });
  if (clean.length) {
    sh.getRange(sh.getLastRow() + 1, 1, clean.length, 4).setValues(clean);
  }
  return json({ ok: true, inserted: clean.length, total: sh.getLastRow() - 1 });
}

/* ── Sincronização _alunos ← cards (RAF/Nome/Turma/Book sempre espelhando o card) ── */
const CARD_IDS = {
  'Caçapava': '1PgNpyGrQ0_LXqiNUp0g_eyzZOeuUnA6S_BLEsm-uLi4',
  'Taubaté':  '1_P50N1Sd5q7pQkPYmms9IkJBdc6Apq1ZlGZvUNzz0SU'
};
const CARD_ABAS_IGNORAR = ['Atrasados', 'Comercial', 'Gabarito Placeholder', 'Sheet36'];
const RAF_VALIDO = /^[A-Za-z]\d{2,3}-\d{2,4}$/;

// Roda no máximo 1x a cada ~20h (disparada pelo primeiro login do dia).
function maybeSyncRoster_() {
  const props = PropertiesService.getScriptProperties();
  const last = Number(props.getProperty('roster_sync_ts') || 0);
  if (Date.now() - last < 20 * 3600 * 1000) return;
  props.setProperty('roster_sync_ts', String(Date.now())); // marca antes (evita corrida)
  syncRosterFromCards();
}

// Varre os dois cards e regrava a _alunos. Mesmas regras da carga original:
// só RAF válido; RAF repetido com nomes diferentes = conflito (fica fora).
function syncRosterFromCards() {
  const seen = {}, conflito = {};
  Object.keys(CARD_IDS).forEach(function (escola) {
    const ss = SpreadsheetApp.openById(CARD_IDS[escola]);
    ss.getSheets().forEach(function (sh) {
      const nome = sh.getName();
      const up = nome.toUpperCase();
      if (CARD_ABAS_IGNORAR.indexOf(nome) > -1 || up.indexOf('CALEND') === 0) return;
      const lastRow = sh.getLastRow();
      if (lastRow < 4 || sh.getLastColumn() < 8) return;
      const vals = sh.getRange(1, 1, lastRow, 8).getValues();
      var turma = '';
      for (var r = 0; r < vals.length; r++) {
        // linha-título de turma: col A numérica + col B título + (linha+2) col C == "ALUNOS"
        const num = vals[r][0], titulo = vals[r][1];
        const rotulo = vals[r + 2] ? String(vals[r + 2][2]).trim().toUpperCase() : '';
        if (num !== '' && !isNaN(num) && titulo !== '' && rotulo === 'ALUNOS') {
          turma = String(titulo).split('\n')[0].replace(/\s+/g, ' ').trim();
          continue;
        }
        // linha de aluno DE TURMA: contador numérico na col A + checkbox ATIVO (booleano) na col B
        // (exclui listas administrativas — transferidos, comercial etc. — que não têm esse formato)
        if (num === '' || isNaN(num) || typeof vals[r][1] !== 'boolean') continue;
        const aluno = String(vals[r][2] || '').trim();   // col C
        const raf = String(vals[r][7] || '').trim();     // col H
        if (!aluno || !RAF_VALIDO.test(raf)) continue;
        const key = raf.toUpperCase();
        const book = String(vals[r][5] || '').trim();    // col F
        if (seen[key]) {
          if (seen[key].nome.toLowerCase() !== aluno.toLowerCase()) conflito[key] = true;
          continue; // mesma pessoa em 2 turmas: mantém a 1ª ocorrência
        }
        seen[key] = { nome: aluno, turma: turma, book: book };
      }
    });
  });
  const rows = [];
  Object.keys(seen).forEach(function (k) {
    if (conflito[k]) return;
    rows.push([k, seen[k].nome, seen[k].turma, seen[k].book]);
  });
  const resumo = { alunos: rows.length, conflitos: Object.keys(conflito) };
  if (!rows.length) return resumo; // proteção: nunca esvazia a lista por falha de leitura
  const sh = getRoster();
  sh.getRange('A:A').setNumberFormat('@');
  sh.getRange(1, 1, 1, 4).setValues([['RAF', 'Nome', 'Turma', 'Book']]);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 4).clearContent();
  sh.getRange(2, 1, rows.length, 4).setValues(rows);
  return resumo;
}

/* ── Portal do professor/funcionário (login por nome + senha; senha só como hash+salt) ── */
const PROFS = '_profs';
// Colunas: A Nome | B Escolas (lista separada por vírgula) | C SenhaHash | D Salt
//          | E NomeCompleto | F Criado | G ÚltimoLogin | H Cargo
//          | I TokenHash (sessão SSO durável — ver profLogin/profCheck)
// Cada linha = uma PESSOA (professor, secretária etc. — o cadastro NÃO depende de
// ter turmas no card). Um professor que dá aula em 2 escolas tem UMA linha com
// "Caçapava,Taubaté" em Escolas. Nomes iguais de pessoas diferentes (ex.: dois
// "Carlos") entram como linhas separadas com nomes distintos (Carlos Alberto / Carlos Galvão).
// DECISÃO (Pedro, 24/07/2026): só a DIREÇÃO cria contas e define senhas (dirAddUser/
// dirSetPass); o auto-cadastro (profRegister) foi desativado.

function getProfs() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(PROFS);
  if (!sh) {
    sh = ss.insertSheet(PROFS);
    sh.appendRow(['Nome', 'Escolas', 'SenhaHash', 'Salt', 'NomeCompleto', 'Criado', 'UltimoLogin', 'Cargo']);
    sh.setFrozenRows(1);
  }
  // garante cabeçalhos de colunas adicionadas depois da criação da aba
  if (!String(sh.getRange(1, 8).getValue() || '').trim()) sh.getRange(1, 8).setValue('Cargo');
  if (!String(sh.getRange(1, 9).getValue() || '').trim()) sh.getRange(1, 9).setValue('TokenHash');
  if (!String(sh.getRange(1, 10).getValue() || '').trim()) sh.getRange(1, 10).setValue('CMCreditos');
  if (!String(sh.getRange(1, 11).getValue() || '').trim()) sh.getRange(1, 11).setValue('CMCotaMes');
  return sh;
}

/* ══════════════════════════════════════════════════════════════════════
   CRÉDITOS DO CONVERSATION MAKER
   Cada aula gerada custa 1 crédito. Recriar NÃO custa (decisão do Pedro,
   27/07/2026) — mas continua registrado em cm_eventos, que é onde se vê
   se alguém está recriando em excesso, já que por ali o custo não tem teto.

   Colunas na _profs: J CMCreditos (saldo) | K CMCotaMes ("2026-07", último
   mês já creditado). Guardar o mês na própria linha evita precisar de um
   gatilho mensal: a reposição acontece na primeira vez que o professor
   aparece no mês novo (lazy).

   SALDO INICIAL 6; a partir do 1º de cada mês a cota REPÕE para 4 (a sobra
   não acumula — acumular derrubaria o teto de custo, que é o motivo da
   feature).
   ══════════════════════════════════════════════════════════════════════ */

const CM_CREDITOS_INICIAIS = 6;
const CM_COTA_MENSAL = 4;

function cmMesAtual_() {
  const d = new Date();
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
}

/**
 * Devolve o saldo do professor na linha dada, repondo a cota do mês se ainda
 * não foi reposta. Escreve na planilha só quando há reposição.
 */
function cmSaldo_(sh, linha) {
  const mes = cmMesAtual_();
  const gravado = String(sh.getRange(linha, 11).getValue() || '').trim();
  let saldo = Number(sh.getRange(linha, 10).getValue());

  if (!gravado) {
    // primeiro contato: ganha o saldo inicial e já marca o mês corrente
    saldo = CM_CREDITOS_INICIAIS;
    sh.getRange(linha, 10).setValue(saldo);
    sh.getRange(linha, 11).setValue(mes);
    return saldo;
  }
  if (gravado !== mes) {
    saldo = CM_COTA_MENSAL;               // repõe, não soma
    sh.getRange(linha, 10).setValue(saldo);
    sh.getRange(linha, 11).setValue(mes);
    return saldo;
  }
  return isNaN(saldo) ? 0 : saldo;
}

/** Saldo do professor dono do token, sem debitar. */
function cmCreditos(req) {
  const linha = profResolveLinha_(req.token);
  if (!linha) return json({ ok: false, error: 'Sessão expirada. Entre novamente pelo Fisk Hub.' });
  const sh = getProfs();
  return json({ ok: true, creditos: cmSaldo_(sh, linha), cota: CM_COTA_MENSAL });
}

/**
 * Debita `n` créditos (1 por aula do lote). É a ÚNICA porta de saída de
 * crédito e roda sob LockService: sem o lock, duas gerações simultâneas do
 * mesmo professor leriam o mesmo saldo e debitariam uma vez só.
 * Não debita parcial: ou tem saldo para todas as aulas pedidas, ou recusa.
 */
function cmConsumir(req) {
  const linha = profResolveLinha_(req.token);
  if (!linha) return json({ ok: false, error: 'Sessão expirada. Entre novamente pelo Fisk Hub.' });
  const pedidos = Math.max(1, Math.min(20, Number(req.quantidade) || 1));

  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (e) {
    return json({ ok: false, error: 'Servidor ocupado, tente de novo em instantes.' });
  }
  try {
    const sh = getProfs();
    const saldo = cmSaldo_(sh, linha);
    if (saldo < pedidos) {
      return json({ ok: false, code: 'sem_creditos', creditos: saldo, pedidos: pedidos,
        error: saldo === 0
          ? 'Seus créditos do Conversation Maker acabaram. Eles voltam no dia 1º; se precisar antes, fale com a direção.'
          : 'Você tem ' + saldo + ' crédito(s) e esta geração precisa de ' + pedidos + '. Marque menos combinações ou fale com a direção.' });
    }
    const novo = saldo - pedidos;
    sh.getRange(linha, 10).setValue(novo);
    return json({ ok: true, creditos: novo, gastos: pedidos });
  } finally {
    lock.releaseLock();
  }
}

/** Painel do Diretor: define o saldo de um professor (recarga manual). */
function dirSetCreditos(req) {
  const alvo = normNome(req.nome);
  if (!alvo) return json({ ok: false, error: 'informe o professor' });
  const valor = Math.max(0, Math.min(999, Number(req.creditos)));
  if (isNaN(valor)) return json({ ok: false, error: 'valor inválido' });
  const sh = getProfs();
  const vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (normNome(vals[i][0]) === alvo) {
      sh.getRange(i + 1, 10).setValue(valor);
      // marca o mês corrente para a reposição não sobrescrever a recarga hoje
      sh.getRange(i + 1, 11).setValue(cmMesAtual_());
      return json({ ok: true, nome: String(vals[i][0]).trim(), creditos: valor });
    }
  }
  return json({ ok: false, error: 'professor não encontrado' });
}

// Normaliza o nome p/ comparação (maiúsculas, sem acento, espaços colapsados).
function normNome(v) {
  return String(v == null ? '' : v).trim().toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
}

function novoSalt_() { return Utilities.getUuid(); }

function hashSenha_(senha, salt) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, salt + '::' + String(senha), Utilities.Charset.UTF_8);
  return raw.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

// Acha a linha (1-based) do professor pelo nome normalizado. 0 = não encontrado.
function acharProfLinha_(nome) {
  const alvo = normNome(nome);
  if (!alvo) return 0;
  const vals = getProfs().getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (normNome(vals[i][0]) === alvo) return i + 1;
  }
  return 0;
}

// Upsert da lista de professores autorizados. replace=true reinicia a aba
// (apaga inclusive senhas — use só antes de qualquer cadastro real).
function seedProfs(rows, replace) {
  const sh = getProfs();
  if (replace && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 7).clearContent();
  }
  var add = 0;
  (rows || []).forEach(function (r) {
    const nome = String((r && r[0]) || '').trim();
    if (!nome) return;
    if (acharProfLinha_(nome)) return; // já existe: preserva
    sh.appendRow([nome, String((r && r[1]) || '').trim(), '', '', '', '', '']);
    add++;
  });
  return json({ ok: true, added: add, total: sh.getLastRow() - 1 });
}

// Remove uma conta de professor (contraparte administrativa do seedProfs;
// o painel do diretor tem a versão com token). Exige TEACHER_KEY.
function removeProfAdmin(nome) {
  const linha = acharProfLinha_(nome);
  if (!linha) return json({ ok: false, error: 'Professor não encontrado.' });
  if (ehDiretor_(nome)) return json({ ok: false, error: 'Não é possível remover a direção.' });
  getProfs().deleteRow(linha);
  return json({ ok: true, removed: String(nome) });
}

function profList() {
  const vals = getProfs().getDataRange().getValues().slice(1);
  const profs = vals.filter(function (r) { return String(r[0]).trim(); })
    .map(function (r) {
      return { name: String(r[0]).trim(), escolas: String(r[1] || '').trim(),
               registered: !!String(r[2] || '').trim(), director: ehDiretor_(r[0]) };
    });
  return json({ ok: true, profs: profs });
}

// DESATIVADO (decisão do Pedro): as contas agora são criadas pela direção,
// com a senha já definida. Mantido só para responder com orientação clara.
function profRegister(p) {
  return json({ ok: false, error: 'O cadastro agora é feito pela direção. Peça seu usuário e senha ao Pedro.' });
}


/* ══════════════════════════════════════════════════════════════════════
   LOG DE ACESSO DO PROFESSOR (visão da direção)
   Espelha o log do aluno, mas com uma informação a mais que o Pedro pediu:
   QUAIS FERRAMENTAS ele usou na última sessão. Uma linha por professor —
   retrato de uso, não rastro de navegação.

   Aba _acessos_prof: Nome | Escolas | UltimoAcesso | Acessos | PrimeiroAcesso
                      | FerramentasDaSessao | InicioDaSessao
   "Sessão" = janela de 8h a partir do primeiro registro; passou disso, a
   lista de ferramentas recomeça. Sem isso a coluna viraria o histórico
   inteiro e não responderia "o que ele fez da última vez".
   ══════════════════════════════════════════════════════════════════════ */
const ACESSOS_PROF = '_acessos_prof';
const SESSAO_PROF_MS = 8 * 60 * 60 * 1000;

function getAcessosProf() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(ACESSOS_PROF);
  if (!sh) {
    sh = ss.insertSheet(ACESSOS_PROF);
    sh.appendRow(['Nome', 'Escolas', 'UltimoAcesso', 'Acessos', 'PrimeiroAcesso',
                  'FerramentasDaSessao', 'InicioDaSessao']);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Registra acesso e, opcionalmente, a ferramenta aberta. */
function registrarAcessoProf_(nome, escolas, ferramenta) {
  const sh = getAcessosProf();
  const alvo = normNome(nome);
  const vals = sh.getDataRange().getValues();
  const agora = new Date();
  for (var i = 1; i < vals.length; i++) {
    if (normNome(vals[i][0]) === alvo) {
      const inicio = vals[i][6] ? new Date(vals[i][6]).getTime() : 0;
      const mesmaSessao = inicio && (agora.getTime() - inicio) < SESSAO_PROF_MS;
      let ferrs = mesmaSessao ? String(vals[i][5] || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean) : [];
      if (ferramenta && ferrs.indexOf(ferramenta) === -1) ferrs.push(ferramenta);
      sh.getRange(i + 1, 2, 1, 6).setValues([[
        escolas || vals[i][1] || '', agora, (Number(vals[i][3]) || 0) + (ferramenta ? 0 : 1),
        vals[i][4] || agora, ferrs.join(', '), mesmaSessao ? vals[i][6] : agora
      ]]);
      return;
    }
  }
  sh.appendRow([String(nome || ''), escolas || '', agora, 1, agora, ferramenta || '', agora]);
}

/** Visão da direção: todos os professores da _profs, com o log ao lado. */
function dirAcessosProf() {
  const log = {};
  getAcessosProf().getDataRange().getValues().slice(1).forEach(function (r) {
    const k = normNome(r[0]);
    if (!k) return;
    log[k] = {
      last: r[2] ? new Date(r[2]).getTime() : null,
      count: Number(r[3]) || 0,
      first: r[4] ? new Date(r[4]).getTime() : null,
      tools: String(r[5] || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean),
      sessionStart: r[6] ? new Date(r[6]).getTime() : null
    };
  });
  const sh = getProfs();
  const vals = sh.getDataRange().getValues();
  const out = [];
  for (var i = 1; i < vals.length; i++) {
    const nome = String(vals[i][0] || '').trim();
    if (!nome) continue;
    const l = log[normNome(nome)] || { last: null, count: 0, first: null, tools: [], sessionStart: null };
    out.push({
      name: nome, escolas: String(vals[i][1] || ''), cargo: String(vals[i][7] || ''),
      registered: !!String(vals[i][2] || '').trim(),
      last: l.last, count: l.count, first: l.first, tools: l.tools, sessionStart: l.sessionStart
    });
  }
  out.sort(function (a, b) { return (b.last || 0) - (a.last || 0); });
  return json({ ok: true, profs: out });
}

/** A ferramenta avisa que foi aberta (o Hub manda o token da sessão). */
function registrarUsoFerramenta(p) {
  const linha = profResolveLinha_(p.token);
  if (!linha) return json({ ok: false, error: 'Sessão expirada.' });
  const sh = getProfs();
  const nome = String(sh.getRange(linha, 1).getValue() || '');
  const escolas = String(sh.getRange(linha, 2).getValue() || '');
  const ferramenta = String(p.ferramenta || '').trim().slice(0, 40);
  if (!ferramenta) return json({ ok: false, error: 'ferramenta não informada' });
  try { registrarAcessoProf_(nome, escolas, ferramenta); } catch (e) {}
  return json({ ok: true });
}

function profLogin(p) {
  const nome = String(p.name || '').trim();
  const senha = String(p.password || '');
  const linha = acharProfLinha_(nome);
  if (!linha) return json({ ok: false, error: 'Professor não encontrado.' });
  const sh = getProfs();
  const hash = String(sh.getRange(linha, 3).getValue() || '').trim();
  const salt = String(sh.getRange(linha, 4).getValue() || '');
  if (!hash) return json({ ok: false, error: 'Sua conta ainda não tem senha. Peça à direção.' });
  if (hashSenha_(senha, salt) !== hash) return json({ ok: false, error: 'Senha incorreta.' });
  sh.getRange(linha, 7).setValue(new Date());
  // Sessão única do professor (SSO do Hub): o login emite um token que as
  // ferramentas em outros domínios (ex.: Conversation Maker no Vercel)
  // validam server-side via profCheck. O token é DURÁVEL — o hash fica na
  // coluna I da _profs — para o professor logar UMA vez no Hub e continuar
  // valendo dia após dia; um novo login rotaciona o token (o anterior morre).
  // O CacheService entra só como atalho de leitura (6h, renovado a cada uso).
  try { registrarAcessoProf_(sh.getRange(linha, 1).getValue(), sh.getRange(linha, 2).getValue(), ''); } catch (e) {}
  const token = Utilities.getUuid();
  sh.getRange(linha, 9).setValue(hashSenha_(token, salt));
  CacheService.getScriptCache().put('proftok_' + token, normNome(sh.getRange(linha, 1).getValue()), 21600);
  return json({ ok: true, token: token, prof: profPublico_(sh, linha) });
}

// Resolve um token de sessão de professor para a linha da _profs (0 = token
// inválido). Fast path no cache; se o cache expirou, confere o hash durável
// na planilha e re-aquece o cache. Compartilhado por profCheck e pelas
// ações do Conversation Maker (salvarPptx/cmHistory).
function profResolveLinha_(token) {
  token = String(token || '');
  if (!token) return 0;
  const cache = CacheService.getScriptCache();
  const quem = cache.get('proftok_' + token);
  let linha = quem ? acharProfLinha_(quem) : 0;
  if (!linha) {
    const vals = getProfs().getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      const salt = String(vals[i][3] || '');
      const tokenHash = String(vals[i][8] || '').trim();
      if (salt && tokenHash && hashSenha_(token, salt) === tokenHash) { linha = i + 1; break; }
    }
  }
  // Acesso master: um token de DIRETOR (dirLogin) também vale como sessão
  // de professor nas ferramentas — o diretor entra pelo painel e usa o
  // Conversation Maker sem novo login.
  if (!linha) {
    const dq = cache.get('dirtok_' + token);
    if (dq) linha = acharProfLinha_(dq);
  }
  if (linha) cache.put('proftok_' + token, normNome(getProfs().getRange(linha, 1).getValue()), 21600);
  return linha;
}

// Valida um token de sessão do professor (SSO).
/* Direção "entra como" um professor para ver o Hub na perspectiva dele.
 * Emite um token de VISITA (só no cache, 2h): NÃO mexe na senha nem rotaciona
 * o token durável do professor — a sessão dele nos aparelhos segue valendo.
 * Só sai daqui com token de diretor válido (dirGuard). */
function dirImpersonate(req) {
  const nome = String(req.name || '').trim();
  const linha = acharProfLinha_(nome);
  if (!linha) return json({ ok: false, error: 'Professor não encontrado.' });
  const sh = getProfs();
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('proftok_' + token,
    normNome(sh.getRange(linha, 1).getValue()), 7200);
  return json({ ok: true, token: token, prof: profPublico_(sh, linha) });
}

function profCheck(req) {
  const linha = profResolveLinha_(req.token);
  if (!linha) return json({ ok: false, error: 'Sessão expirada. Entre novamente pelo Fisk Hub.' });
  return json({ ok: true, prof: profPublico_(getProfs(), linha) });
}

/* ── Conversation Maker: backup no Drive + histórico do professor ──
 * A pasta abaixo (do Drive da organização) é o banco central de atividades
 * geradas. O backend do Conversation Maker (Vercel) manda o PPTX aqui em
 * base64 logo após o professor baixar; cada aula (professor+tópico+nível+
 * faixa) mantém SÓ a versão final — um novo download da mesma aula
 * substitui o arquivo anterior no Drive em vez de acumular cópias. */
const CM_FOLDER_ID = '1_AvVttlFDgs69JmezrqMp8MT2C2JfIBW';
const CM_TAB = 'cm_atividades';
const CM_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

function cmTab_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CM_TAB);
  if (!sh) {
    sh = ss.insertSheet(CM_TAB);
    sh.appendRow(['Data', 'Professor', 'Idioma', 'Nível', 'Faixa etária', 'Tópico', 'FileId', 'FileName']);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Identifica o professor da requisição: token de sessão (fluxo normal) ou
// TEACHER_KEY (QA/diagnóstico, com o nome vindo no próprio corpo).
function cmQuem_(req) {
  if (req.key && req.key === TEACHER_KEY) return String(req.teacherName || 'QA').trim();
  const linha = profResolveLinha_(req.token);
  if (!linha) return null;
  const p = profPublico_(getProfs(), linha);
  return p.fullName || p.name;
}

function cmSalvarPptx(req) {
  const quem = cmQuem_(req);
  if (!quem) return json({ ok: false, error: 'Sessão expirada. Entre novamente pelo Fisk Hub.' });
  const fileName = String(req.fileName || 'Conversation_Lesson.pptx');
  if (!req.base64) return json({ ok: false, error: 'Arquivo ausente.' });

  const blob = Utilities.newBlob(Utilities.base64Decode(String(req.base64)), CM_MIME, fileName);
  const folder = DriveApp.getFolderById(CM_FOLDER_ID);
  const file = folder.createFile(blob);
  // Link direto de download para o "Baixar novamente" do histórico: a pasta
  // (Drive compartilhado) já dá acesso por link a quem tem o link, e os
  // arquivos herdam isso. O setSharing por arquivo é só um reforço — em
  // Drive compartilhado ele costuma ser negado pela política, então falha
  // silenciosa aqui é esperada e inofensiva.
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}

  const sh = cmTab_();
  const chave = [quem, req.topic, req.level, req.ageLabel].map(normNome).join('|');
  const vals = sh.getDataRange().getValues();
  let linhaExistente = 0;
  for (var i = 1; i < vals.length; i++) {
    const k = [vals[i][1], vals[i][5], vals[i][3], vals[i][4]].map(normNome).join('|');
    if (k === chave) { linhaExistente = i + 1; break; }
  }
  const row = [new Date(), quem, String(req.language || ''), String(req.level || ''),
               String(req.ageLabel || ''), String(req.topic || ''), file.getId(), fileName];
  if (linhaExistente) {
    // Mesma aula baixada de novo: o arquivo anterior vai pro lixo e a linha
    // é atualizada — no Drive fica só a versão final (CHANGES 2.11).
    const antigoId = String(vals[linhaExistente - 1][6] || '');
    if (antigoId && antigoId !== file.getId()) {
      try { DriveApp.getFileById(antigoId).setTrashed(true); } catch (e) {}
    }
    sh.getRange(linhaExistente, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }
  // O download também entra no log de eventos do diretor (2.7b): registra
  // qual versão virou a definitiva (req.detail traz "versão final: X/Y").
  cmAppendEvent_(quem, req, 'download');
  return json({ ok: true, fileId: file.getId() });
}

/* Log estruturado de eventos do Conversation Maker (aba cm_eventos) — a
 * fonte dos indicadores e alertas do Painel da Direção (CHANGES 2.7b/2.7c):
 * cada geração, recriação (com o feedback do professor) e download vira uma
 * linha. Alimentado pelo backend do Conversation Maker (Vercel) com o token
 * de sessão do professor. Os professores não têm acesso de leitura a isso —
 * cmStats é guardado por dirGuard (token de diretor). */
const CM_EVT_TAB = 'cm_eventos';

function cmEvtTab_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CM_EVT_TAB);
  if (!sh) {
    sh = ss.insertSheet(CM_EVT_TAB);
    sh.appendRow(['Data', 'Professor', 'Idioma', 'Nível', 'Faixa etária', 'Evento', 'Tópico', 'Detalhe']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function cmAppendEvent_(quem, req, evento) {
  cmEvtTab_().appendRow([
    new Date(), quem, String(req.language || ''), String(req.level || ''),
    String(req.ageLabel || ''), String(evento || req.event || 'geração'),
    String(req.topic || '').slice(0, 200), String(req.detail || '').slice(0, 300),
  ]);
}

function cmLogEvent(req) {
  const quem = cmQuem_(req);
  if (!quem) return json({ ok: false, error: 'Sessão expirada. Entre novamente pelo Fisk Hub.' });
  cmAppendEvent_(quem, req, null);
  return json({ ok: true });
}

// Eventos dos últimos 60 dias (máx. 600), mais recentes primeiro — o painel
// da direção computa os indicadores no cliente.
function cmStats(req) {
  const vals = cmEvtTab_().getDataRange().getValues();
  const desde = Date.now() - 60 * 24 * 3600 * 1000;
  const events = [];
  for (var i = vals.length - 1; i >= 1 && events.length < 600; i--) {
    const t = vals[i][0] instanceof Date ? vals[i][0].getTime() : 0;
    if (t && t < desde) break;
    events.push({
      t: t, prof: String(vals[i][1] || ''), idioma: String(vals[i][2] || ''),
      nivel: String(vals[i][3] || ''), faixa: String(vals[i][4] || ''),
      evento: String(vals[i][5] || ''), topico: String(vals[i][6] || ''),
      detalhe: String(vals[i][7] || ''),
    });
  }
  return json({ ok: true, events: events });
}

// Histórico do professor logado: só as linhas dele, mais recentes primeiro.
// "Baixar novamente" no front usa o FileId — é um download do que já está
// no Drive, sem gerar cópia nova.
function cmHistory(req) {
  const quem = cmQuem_(req);
  if (!quem) return json({ ok: false, error: 'Sessão expirada. Entre novamente pelo Fisk Hub.' });
  const alvo = normNome(quem);
  const vals = cmTab_().getDataRange().getValues();
  const items = [];
  for (var i = 1; i < vals.length; i++) {
    if (normNome(vals[i][1]) !== alvo) continue;
    items.push({
      t: vals[i][0] instanceof Date ? vals[i][0].getTime() : 0,
      idioma: String(vals[i][2] || ''), nivel: String(vals[i][3] || ''),
      faixa: String(vals[i][4] || ''), topico: String(vals[i][5] || ''),
      fileId: String(vals[i][6] || ''), fileName: String(vals[i][7] || ''),
    });
  }
  items.sort(function (a, b) { return b.t - a.t; });
  return json({ ok: true, items: items });
}

function profPublico_(sh, linha) {
  const v = sh.getRange(linha, 1, 1, 8).getValues()[0];
  return { name: String(v[0]).trim(), escolas: String(v[1] || '').trim(),
           fullName: String(v[4] || '').trim(), cargo: String(v[7] || '').trim() };
}

/* ── Painel do Diretor ──
 * O diretor loga com a própria conta do _profs (nome na lista DIRETORES).
 * O login emite um token de sessão (CacheService, 6h) exigido em toda ação
 * admin — assim a página do painel não carrega nenhuma chave secreta. */
const DIRETORES = ['PEDRO (DIREÇÃO)'];

function ehDiretor_(nome) {
  return DIRETORES.some(function (d) { return normNome(d) === normNome(nome); });
}

function dirLogin(p) {
  if (!ehDiretor_(p.name)) return json({ ok: false, error: 'Este usuário não é da direção.' });
  const linha = acharProfLinha_(p.name);
  if (!linha) return json({ ok: false, error: 'Usuário não encontrado.' });
  const sh = getProfs();
  const hash = String(sh.getRange(linha, 3).getValue() || '').trim();
  const salt = String(sh.getRange(linha, 4).getValue() || '');
  if (!hash) return json({ ok: false, error: 'Crie sua conta primeiro (no login do Fisk Hub).' });
  if (hashSenha_(String(p.password || ''), salt) !== hash) return json({ ok: false, error: 'Senha incorreta.' });
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('dirtok_' + token, normNome(p.name), 21600); // 6h
  sh.getRange(linha, 7).setValue(new Date());
  return json({ ok: true, token: token, director: profPublico_(sh, linha) });
}

function dirGuard(req, fn) {
  const quem = CacheService.getScriptCache().get('dirtok_' + String(req.token || ''));
  if (!quem) return json({ ok: false, error: 'Sessão expirada. Entre de novo.' });
  return fn(req);
}

// Valida um token de diretor (bypass master no Fisk Hub / Portal do Aluno).
// Devolve a identidade para a página montar a sessão local sem pedir login.
function dirCheck(req) {
  const quem = CacheService.getScriptCache().get('dirtok_' + String(req.token || ''));
  if (!quem) return json({ ok: false, error: 'Sessão expirada. Entre de novo pelo Painel da Direção.' });
  const linha = acharProfLinha_(quem);
  const sh = getProfs();
  const prof = linha ? profPublico_(sh, linha) : { name: quem, escolas: 'Caçapava,Taubaté', fullName: '' };
  return json({ ok: true, director: prof });
}

function dirUsers() {
  const vals = getProfs().getDataRange().getValues().slice(1);
  const users = vals.filter(function (r) { return String(r[0]).trim(); })
    .map(function (r) {
      return {
        name: String(r[0]).trim(), escolas: String(r[1] || '').trim(),
        registered: !!String(r[2] || '').trim(),
        fullName: String(r[4] || '').trim(),
        created: r[5] ? new Date(r[5]).toISOString() : null,
        lastLogin: r[6] ? new Date(r[6]).toISOString() : null,
        cargo: String(r[7] || '').trim(),
        // saldo do Conversation Maker (coluna J) — vazio significa que o
        // professor ainda não gerou nada e receberá o saldo inicial
        creditos: String(r[9] || '').trim() === '' ? null : Number(r[9]),
        cotaMes: String(r[10] || '').trim(),
        director: ehDiretor_(r[0])
      };
    });
  return json({ ok: true, users: users });
}

// Reset: limpa hash/salt — o professor cria senha nova no próximo acesso.
function dirResetPass(p) {
  const linha = acharProfLinha_(p.name);
  if (!linha) return json({ ok: false, error: 'Usuário não encontrado.' });
  const sh = getProfs();
  sh.getRange(linha, 3, 1, 2).clearContent(); // hash + salt
  return json({ ok: true });
}

function dirRemoveUser(p) {
  if (ehDiretor_(p.name)) return json({ ok: false, error: 'Não dá para remover a conta da direção.' });
  const linha = acharProfLinha_(p.name);
  if (!linha) return json({ ok: false, error: 'Usuário não encontrado.' });
  getProfs().deleteRow(linha);
  return json({ ok: true });
}

// Cria um funcionário completo: nome de acesso, escolas, cargo e SENHA definida
// pela direção (o funcionário recebe as credenciais prontas).
function dirAddUser(p) {
  const nome = String(p.name || '').trim();
  const senha = String(p.password || '');
  if (!nome) return json({ ok: false, error: 'Informe o nome.' });
  if (senha.length < 4) return json({ ok: false, error: 'Defina uma senha (mínimo 4 caracteres).' });
  if (acharProfLinha_(nome)) return json({ ok: false, error: 'Esse nome já existe.' });
  const salt = novoSalt_();
  getProfs().appendRow([
    nome, String(p.escolas || '').trim(), hashSenha_(senha, salt), salt,
    String(p.fullName || '').trim(), new Date(), '', String(p.cargo || '').trim()
  ]);
  return json({ ok: true });
}

// Define/troca a senha de um funcionário (também serve p/ "esqueci a senha").
function dirSetPass(p) {
  const senha = String(p.password || '');
  if (senha.length < 4) return json({ ok: false, error: 'Senha muito curta (mínimo 4 caracteres).' });
  const linha = acharProfLinha_(p.name);
  if (!linha) return json({ ok: false, error: 'Usuário não encontrado.' });
  const sh = getProfs();
  const salt = novoSalt_();
  sh.getRange(linha, 3).setValue(hashSenha_(senha, salt));
  sh.getRange(linha, 4).setValue(salt);
  if (!sh.getRange(linha, 6).getValue()) sh.getRange(linha, 6).setValue(new Date());
  return json({ ok: true });
}

/* ══════════════════════════════════════════════════════════════════════
   SALVAR PDF NA PASTA DA TURMA / DO ALUNO (drive compartilhado)
   Usado pelas ferramentas do Fisk Hub (planejador, 2nd-chance, termo de
   atraso, boletim). Ficam AQUI, e não no CardTools do card, porque um
   projeto Apps Script só pode ter UM doPost — e o CardTools não se mexe.
   Fonte original/documentada: fisk-hub/apps-script/salvar-no-drive.gs

   POST { fn:'salvarPdf', key, tipo:'turma'|'aluno',
          escola, professor, turma, aluno, filename, mime, dados(base64),
          substituiPrefixo?, substituiSufixo? }   // aposenta o arquivo anterior
   →    { ok:true, url, pasta, pastaUrl, turma, turmaUrl }
        { ok:false, code:'pasta_nao_encontrada', erro }  // avisa o professor
        { ok:false, erro }

   Estrutura no drive compartilhado:
     Planners <Escola> → "<n> - <Professor>" → "<n> - <dia/horário> - <NÍVEL>"
     (turma) → [pastas de aluno por nome completo].
   ══════════════════════════════════════════════════════════════════════ */

const FISK_CHAVE = '<valor real só no fisk-hub-backend / Propriedades do Script>';  // NUNCA o valor aqui: este repo é público
const RAIZ_ESCOLA = {                          // pastas "Planners ..." no drive compartilhado
  taubate:  '1c7vuwrRpINGx-ITgvhr65yD4cwbHodt2',
  cacapava: '1FJ8Fs677pq0tENiJ1PHLtZp8A0lmw-Gs'
};

function salvarPdfNoDrive(req) {
  if (req.key !== FISK_CHAVE) return json({ ok: false, erro: 'chave inválida' });
  if (!req.dados) return json({ ok: false, erro: 'PDF vazio' });

  const raizId = rootDaEscola(req.escola);
  if (!raizId) return erroPasta_('escola "' + limpa_(req.escola) + '" não reconhecida (esperado Taubaté ou Caçapava)');

  const profF = acharPasta(raizId, req.professor);
  if (!profF) return erroPasta_('pasta do professor "' + limpa_(req.professor) + '" não encontrada em Planners ' + limpa_(req.escola));

  let destino, turmaF, via;
  if (req.tipo === 'aluno') {
    const r = acharPastaDoAluno_(profF.getId(), req.turma, req.aluno);
    /* diz DENTRO DE QUE pasta de professor a busca aconteceu: a causa mais
       comum do erro é o card estar com outro professor (aluno que trocou de
       turma no semestre), e sem esse detalhe o professor não tem como saber */
    if (r.erro) return erroPasta_(r.erro + ' — procurei só dentro de "' + profF.getName() +
                                  '" (a pasta do professor(a) selecionado no card)');
    destino = r.pasta; turmaF = r.turma; via = r.via;
  } else {
    const achado = acharTurmaPasta_(profF.getId(), req.turma);
    if (!achado) return erroPasta_('pasta da turma "' + limpa_(req.turma) + '" não encontrada na pasta de ' + limpa_(req.professor));
    destino = turmaF = achado.pasta; via = achado.via;
  }

  const blob = Utilities.newBlob(Utilities.base64Decode(req.dados), req.mime || 'application/pdf', req.filename || 'documento.pdf');
  const antigos = destino.getFilesByName(blob.getName());
  while (antigos.hasNext()) antigos.next().setTrashed(true);  // regravar substitui a versão anterior

  /* Substituição por PADRÃO (não só por nome igual). O plano de aula leva a
     data no nome, então cada plano novo teria um nome diferente e os antigos
     iriam se acumulando na pasta da turma. Com prefixo+sufixo, o novo plano
     aposenta o anterior DAQUELE professor — o sufixo é o que impede que um
     professor apague o plano do colega numa turma que os dois atendem. */
  const trocados = [];
  if (req.substituiPrefixo) {
    const pre = String(req.substituiPrefixo).toLowerCase();
    const suf = String(req.substituiSufixo || '').toLowerCase();
    const it = destino.getFiles();
    while (it.hasNext()) {
      const f = it.next();
      const nome = f.getName().toLowerCase();
      if (nome === blob.getName().toLowerCase()) continue;      // já tratado acima
      if (nome.indexOf(pre) !== 0) continue;
      if (suf && nome.indexOf(suf, nome.length - suf.length) === -1) continue;
      trocados.push(f.getName());
      f.setTrashed(true);
    }
  }

  const arq = destino.createFile(blob);
  // `pasta` volta para a ferramenta MOSTRAR ao professor onde salvou — é assim
  // que ele percebe um casamento errado sem precisar abrir o Drive.
  // `pastaUrl` alimenta o botão "Ver pasta": conferir no Drive com um clique,
  // em vez de caçar a pasta do aluno na mão.
  return json({ ok: true, url: arq.getUrl(), pasta: destino.getName(),
                pastaUrl: destino.getUrl(), turma: turmaF.getName(),
                turmaUrl: turmaF.getUrl(), via: via, substituidos: trocados });
}

/* ══════════════════════════════════════════════════════════════════════
   BUSCAR O BOLETIM DA 1ª AVALIAÇÃO NA PASTA DO ALUNO
   Contraparte de leitura do salvarPdf: o boletim é gravado como
   "Report Card - <Nome> - <RAF>.pdf" na pasta do aluno, então dá para
   reabri-lo na 2ª avaliação sem o professor procurar no Drive.

   POST { fn:'buscarPdf', key, escola, professor, turma, aluno, filename? }
   →    { ok:true, arquivos:[{nome,url,atualizado}] }        // sem filename
        { ok:true, nome, mime, dados(base64) }               // com filename
        { ok:false, code:'pasta_nao_encontrada'|'sem_arquivo', erro }

   O download é SEMPRE por NOME dentro da pasta resolvida a partir de
   escola/professor/turma/aluno — de propósito. Aceitar um id de arquivo
   viria a ser uma porta para ler qualquer arquivo que o script alcança.
   ══════════════════════════════════════════════════════════════════════ */
function buscarPdfDoAluno(req) {
  if (req.key !== FISK_CHAVE) return json({ ok: false, erro: 'chave inválida' });

  const raizId = rootDaEscola(req.escola);
  if (!raizId) return erroPasta_('escola "' + limpa_(req.escola) + '" não reconhecida (esperado Taubaté ou Caçapava)');
  const profF = acharPasta(raizId, req.professor);
  if (!profF) return erroPasta_('pasta do professor "' + limpa_(req.professor) + '" não encontrada em Planners ' + limpa_(req.escola));
  const r = acharPastaDoAluno_(profF.getId(), req.turma, req.aluno);
  if (r.erro) return erroPasta_(r.erro);

  const alvo = String(req.filename || '').trim();
  const arquivos = [];
  let outros = 0;
  const it = r.pasta.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    const nome = f.getName();
    if (alvo) {
      if (nome === alvo) {
        return json({ ok: true, nome: nome, mime: f.getMimeType(),
                      dados: Utilities.base64Encode(f.getBlob().getBytes()) });
      }
      continue;
    }
    if (String(f.getMimeType()).indexOf('pdf') < 0) continue;
    /* Só os boletins GERADOS pela ferramenta ("Report Card - Nome - RAF.pdf"):
       eles trazem os dados embutidos e reabrem na hora. Um PDF escaneado antigo
       cairia no OCR, que trava o navegador por minutos — não é para virar um
       botão de um clique. `outros` só conta, para a ferramenta explicar. */
    if (!/report\s*card/i.test(nome)) { outros++; continue; }
    arquivos.push({ nome: nome, url: f.getUrl(), atualizado: String(f.getLastUpdated()) });
  }
  if (alvo) return json({ ok: false, code: 'sem_arquivo', erro: 'arquivo "' + limpa_(alvo) + '" não está na pasta de ' + limpa_(req.aluno) });

  arquivos.sort(function (a, b) { return a.atualizado < b.atualizado ? 1 : -1; });  // mais recente primeiro
  return json({ ok: true, pasta: r.pasta.getName(), arquivos: arquivos, outros: outros });
}

/** escolhe a raiz "Planners <Escola>" a partir do nome da escola. */
function rootDaEscola(escola) {
  const e = normPasta_(escola);
  if (e.indexOf('cacapava') >= 0) return RAIZ_ESCOLA.cacapava;
  if (e.indexOf('taubate') >= 0)  return RAIZ_ESCOLA.taubate;
  return null;
}

/** procura uma subpasta por nome (normalizado): igualdade exata e depois "contém".
 *  Serve para PROFESSOR ("ALEX" → "Alex", "TAMIRES" → "8 - Tamires") e para
 *  ALUNO (o card às vezes traz sufixos, ex.: "Livia Cruz Santos (confirmar)"). */
function acharPasta(raizId, nome, soExata) {
  if (!raizId || !nome) return null;
  const subs = listarSubpastas_(raizId);
  if (!subs) return null;
  const alvo = normPasta_(nome);
  if (!alvo) return null;
  let melhorContem = null;
  for (let i = 0; i < subs.length; i++) {
    const n = normPasta_(subs[i].getName());
    if (n === alvo) return subs[i];                                                            // exata
    if (!soExata && !melhorContem && n && (n.indexOf(alvo) >= 0 || alvo.indexOf(n) >= 0)) melhorContem = subs[i];
  }
  if (melhorContem || soExata) return melhorContem;
  return acharPorPalavras_(subs, alvo);
}

/**
 * Último recurso, para nome abreviado: o card traz "MARIANA G." e a pasta é
 * "5 - Mariana". Compara só as palavras que identificam (ignora números de
 * ordem e iniciais soltas) e exige que um conjunto contenha o outro — e que o
 * vencedor seja ÚNICO, senão duas "Marianas" viravam uma escolha no escuro.
 */
function acharPorPalavras_(subs, alvo) {
  function significativas(s) {
    return String(s).split(' ').filter(function (p) { return p.length > 1 && !/^\d+$/.test(p); });
  }
  const a = significativas(alvo);
  if (!a.length) return null;
  let achado = null, quantos = 0;
  for (let i = 0; i < subs.length; i++) {
    const b = significativas(normPasta_(subs[i].getName()));
    if (!b.length) continue;
    const menor = a.length <= b.length ? a : b, maior = a.length <= b.length ? b : a;
    let contidas = 0;
    for (let j = 0; j < menor.length; j++) if (maior.indexOf(menor[j]) >= 0) contidas++;
    if (contidas === menor.length) { achado = subs[i]; quantos++; }
  }
  return quantos === 1 ? achado : null;
}

function listarSubpastas_(raizId) {
  let raiz;
  try { raiz = DriveApp.getFolderById(raizId); } catch (e) { return null; }
  const out = [], it = raiz.getFolders();
  while (it.hasNext()) out.push(it.next());
  return out;
}

/**
 * TURMA: casar por nome não funciona — os dois lados discordam do nível.
 *   card "INTERMEDIATE - 2ª/4ª 18h45 às 20h"  ↔  pasta "2ª/4ª 18h45 às 20h00 - Basic/Inter"
 *   card "Basic/Interm (+18) - 3ª 8h30 às 11h" ↔ pasta "3ª 8:30 às 11h - All levels"
 * O que os dois SEMPRE têm em comum é DIA DA SEMANA + HORÁRIO. Então: tenta nome
 * exato, depois dia+horário e só por último "contém".
 */
function acharTurmaPasta_(raizId, nome) {
  const exata = acharPasta(raizId, nome, true);
  if (exata) return { pasta: exata, via: 'nome exato' };
  const porHorario = acharPastaPorHorario_(raizId, nome);
  if (porHorario) return porHorario;
  const contem = acharPasta(raizId, nome);
  return contem ? { pasta: contem, via: 'nome parcial' } : null;
}

/**
 * Documento DE ALUNO (boletim, 2ª chance, termo de atraso): o nome completo do
 * aluno é uma chave bem mais forte que dia+horário, e as pastas de aluno são
 * únicas dentro de um professor. Então:
 *   1) caminho rápido — acha a turma e o aluno dentro dela;
 *   2) se falhar, procura o aluno em TODAS as turmas daquele professor.
 *      Achou em uma só → é ela, mesmo que o nome da turma não case com o card
 *      (resolve a turma cuja pasta tem nome que não bate com nada).
 *      Achou em mais de uma → ambíguo, recusa e diz quais são.
 */
function acharPastaDoAluno_(profId, turmaNome, aluno) {
  const achado = acharTurmaPasta_(profId, turmaNome);
  if (achado) {
    const dentro = acharPasta(achado.pasta.getId(), aluno);
    if (dentro) return { pasta: dentro, turma: achado.pasta, via: achado.via + ' + nome do aluno' };
  }
  const turmas = listarSubpastas_(profId) || [];
  const hits = [];
  for (let i = 0; i < turmas.length; i++) {
    const f = acharPasta(turmas[i].getId(), aluno);
    if (f) hits.push({ pasta: f, turma: turmas[i] });
  }
  if (hits.length === 1) {
    return { pasta: hits[0].pasta, turma: hits[0].turma, via: 'nome do aluno (turma "' + hits[0].turma.getName() + '")' };
  }
  if (hits.length > 1) {
    const nomes = hits.map(function (h) { return '"' + h.turma.getName() + '"'; }).join(', ');
    return { erro: 'o aluno "' + limpa_(aluno) + '" aparece em mais de uma turma (' + nomes + ') e o nome da turma do card não casou com nenhuma pasta — não dá para escolher com segurança' };
  }
  return { erro: 'pasta do aluno "' + limpa_(aluno) + '" não encontrada em nenhuma turma deste professor' };
}

/** dias da semana citados ("2ª/4ª", "3ª", "2°", "2a/4a", "Sáb") → [2,4] / [3] / [7].
 *  Dois enganos que já custaram caro e por isso estão tratados aqui:
 *   · "(até 2º ano)" / "(3º e 4º ano)" é SÉRIE ESCOLAR, não dia — e o dia sempre
 *     aparece fora dos parênteses, então os parênteses saem antes da leitura;
 *   · "18h45 às 21h15" NÃO pode virar dia 5: por isso o formato "2a" exige o
 *     dígito colado no "a" (sem espaço), diferente de "2ª/2º/2°". */
function diasDe_(s) {
  const t = txtBase_(s).replace(/\([^)]*\)/g, ' ');
  const dias = {};
  let m;
  const reOrdinal = /([2-6])\s*[ªº°]/g;   // 2ª · 5º · 2°
  while ((m = reOrdinal.exec(t))) dias[m[1]] = 1;
  // "2 e 4ª" / "2/4ª" / "3 e 5°": só o SEGUNDO dígito leva o ª — o primeiro
  // ficaria de fora se a gente exigisse o marcador dele também
  const rePar = /\b([2-6])\s*(?:e|\/|,)\s*([2-6])\s*[ªº°]/g;
  while ((m = rePar.exec(t))) { dias[m[1]] = 1; dias[m[2]] = 1; }
  const reLetra = /\b([2-6])a\b/g;        // 2a/4a · "3a Terça"
  while ((m = reLetra.exec(t))) dias[m[1]] = 1;
  // por extenso: tem professor que nomeia a pasta de "Quarta"/"Quinta"/"Sabado"
  // enquanto o card manda "4ª"/"5ª"/"Sáb"
  const POREXTENSO = [['domingo', '1'], ['dom', '1'], ['segunda', '2'], ['terca', '3'],
                      ['quarta', '4'], ['quinta', '5'], ['sexta', '6'],
                      ['sabado', '7'], ['sab', '7']];
  for (let i = 0; i < POREXTENSO.length; i++) {
    if (t.indexOf(POREXTENSO[i][0]) >= 0) dias[POREXTENSO[i][1]] = 1;
  }
  return Object.keys(dias).sort();
}

/** horários citados, em minutos: "17h30"/"17:30"/"17 30" → 1050; "20h"/"20h00" → 1200. */
function horasDe_(s) {
  let t = txtBase_(s);
  const set = {};
  function add(h, mi) {
    h = +h; mi = +mi;
    if (h >= 0 && h <= 23 && mi >= 0 && mi <= 59) set[h * 60 + mi] = 1;
  }
  // ordem importa: primeiro os formatos com separador, depois "20h", por último "18 45"
  t = t.replace(/(\d{1,2})\s*[h:]\s*(\d{2})/g, function (_, h, mi) { add(h, mi); return ' '; });
  t = t.replace(/(\d{1,2})\s*h/g, function (_, h) { add(h, 0); return ' '; });
  t = t.replace(/\b(\d{1,2})\s+(\d{2})\b/g, function (_, h, mi) { add(h, mi); return ' '; });
  return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
}

/** 1ª linha, sem acento, minúsculo — preservando ª/º/:/h, que são o sinal aqui. */
function txtBase_(s) {
  return String(s || '').split('\n')[0].toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Casa a turma por dia+horário. Exige os MESMOS dias e pelo menos um horário
 * igual, e só aceita se houver um vencedor ISOLADO — empate é ambiguidade, e
 * ambiguidade tem de virar "não encontrei" (salvar na turma errada é pior).
 */
function acharPastaPorHorario_(raizId, nome) {
  const dias = diasDe_(nome).join(','), horas = horasDe_(nome);
  if (!dias || !horas.length) return null;
  const subs = listarSubpastas_(raizId);
  if (!subs) return null;

  let melhor = null, melhorScore = 0, segundoScore = 0;
  for (let i = 0; i < subs.length; i++) {
    const nomePasta = subs[i].getName();
    if (ehPastaAdministrativa_(nomePasta)) continue;             // "REPORT CARDS - SÁB 10H30" não é turma
    if (diasDe_(nomePasta).join(',') !== dias) continue;         // dias têm de bater exatamente
    const hp = horasDe_(nomePasta);
    let comuns = 0;
    for (let j = 0; j < horas.length; j++) if (hp.indexOf(horas[j]) >= 0) comuns++;
    if (!comuns) continue;
    if (comuns > melhorScore) { segundoScore = melhorScore; melhorScore = comuns; melhor = subs[i]; }
    else if (comuns > segundoScore) { segundoScore = comuns; }
  }
  if (!melhor || melhorScore === segundoScore) return null;      // empate = ambíguo
  return { pasta: melhor, via: 'dia+horário (' + melhorScore + ' horário(s) em comum)' };
}

/**
 * Lista o que o script enxerga no Drive, para depurar o casamento de nomes.
 * ?action=driveDebug&key=TEACHER&escola=cacapava        → subpastas da raiz
 * ?action=driveDebug&key=TEACHER&pasta=<id>             → subpastas de uma pasta
 * Se o escopo do Drive não estiver autorizado, o erro aparece aqui explícito
 * (em vez de virar um "pasta não encontrada" enganoso).
 */
function driveDebug(escola, pastaId) {
  const id = pastaId || rootDaEscola(escola);
  if (!id) return json({ ok: false, error: 'informe escola (taubate/cacapava) ou pasta=<id>' });
  try {
    const raiz = DriveApp.getFolderById(id);
    const subs = [];
    const it = raiz.getFolders();
    while (it.hasNext()) { const f = it.next(); subs.push({ nome: f.getName(), id: f.getId() }); }
    subs.sort(function (a, b) { return a.nome < b.nome ? -1 : 1; });
    return json({ ok: true, pasta: raiz.getName(), id: id, total: subs.length, subpastas: subs });
  } catch (e) {
    return json({ ok: false, error: String(e), dica: 'se for erro de autorização, rode setupDrive() no editor' });
  }
}

/**
 * Ensaio do salvamento: percorre escola → professor → turma → [aluno] e diz
 * onde CAIRIA, sem gravar nada. ?action=driveMatch&key=&escola=&professor=&turma=[&aluno=]
 */
function driveMatch(p) {
  const raizId = rootDaEscola(p.escola);
  if (!raizId) return json({ ok: false, etapa: 'escola', erro: 'escola não reconhecida' });
  const profF = acharPasta(raizId, p.professor);
  if (!profF) return json({ ok: false, etapa: 'professor', erro: 'pasta do professor não encontrada' });
  // com aluno, simula o MESMO caminho de um documento de aluno (busca ampla inclusa)
  if (p.aluno) {
    const r = acharPastaDoAluno_(profF.getId(), p.turma, p.aluno);
    if (r.erro) return json({ ok: false, etapa: 'aluno', professor: profF.getName(), erro: r.erro });
    return json({ ok: true, professor: profF.getName(), turma: r.turma.getName(),
                  aluno: r.pasta.getName(), via: r.via });
  }
  const achado = acharTurmaPasta_(profF.getId(), p.turma);
  if (!achado) {
    return json({ ok: false, etapa: 'turma', professor: profF.getName(),
      erro: 'pasta da turma não encontrada',
      lidos: { dias: diasDe_(p.turma), horas: horasDe_(p.turma) } });
  }
  return json({ ok: true, professor: profF.getName(), turma: achado.pasta.getName(), via: achado.via });
}

/**
 * Pastas que convivem com as turmas dentro do professor mas NÃO são turma
 * (vistas no Drive real: "Alunos transferidos", "Bilhete de atraso",
 * "Evaluation Report FPA(Sep 2024)", "FISK CITY", "1 - Plano de aula",
 * "REPORT CARDS - SÁB 10H30"). A última é o caso perigoso: tem dia e hora no
 * nome, então venceria o casamento por dia+horário quando a pasta da turma
 * ainda não existe — e o plano de aula iria parar lá dentro.
 */
function ehPastaAdministrativa_(nome) {
  const n = normPasta_(nome);
  const PALAVRAS = ['report card', 'plano de aula', 'planner', 'transferid',
                    'bilhete', 'atraso', 'arquiv', 'evaluation', 'fisk city',
                    'desistente', 'formando', 'fantasma', 'boletim'];
  for (let i = 0; i < PALAVRAS.length; i++) if (n.indexOf(PALAVRAS[i]) >= 0) return true;
  return false;
}

function erroPasta_(msg) { return json({ ok: false, code: 'pasta_nao_encontrada', erro: msg }); }
/** normaliza: 1ª linha, sem acento, minúsculo, só letras/números/espaço. */
function normPasta_(s) {
  return String(s || '').split('\n')[0]
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function limpa_(s) { return String(s || '').split('\n')[0].trim(); }

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Rode uma vez no editor para criar/autorizar as abas. */
function setup() {
  getTab('met');
  getRoster();
}

/**
 * Rode uma vez no editor DEPOIS de adicionar o salvarPdf: o DriveApp é um
 * escopo NOVO neste projeto, e o App da Web só consegue gravar no drive
 * compartilhado depois que o dono da implantação autorizar esse escopo.
 * Deve logar os nomes das duas raízes "Planners ...".
 */
/**
 * Autoriza a ESCRITA no Drive. Rodar setupDrive() (que só lê) não basta: a tela
 * de consentimento pode conceder apenas leitura, e aí o salvamento falha só na
 * hora de criar o arquivo — depois de já ter achado a pasta certa. Esta função
 * cria um arquivo de teste e manda para a lixeira em seguida, então o Google
 * tem de pedir a permissão de escrita explicitamente.
 */
function setupDriveEscrita() {
  const pasta = DriveApp.getFolderById(RAIZ_ESCOLA.cacapava);
  const arq = pasta.createFile(
    Utilities.newBlob('teste de permissao do Fisk Hub', 'text/plain', 'FISK - teste de permissao (ja apagado).txt'));
  arq.setTrashed(true);   // não deixa lixo: nasce e vai direto para a lixeira
  const msg = 'escrita OK em "' + pasta.getName() + '" — arquivo de teste já foi para a lixeira';
  Logger.log(msg);
  return msg;
}

function setupDrive() {
  // sem try/catch de propósito: se faltar autorização, o erro TEM de estourar
  // (engolir a exceção faz o editor não abrir a tela de permissões)
  const nomes = Object.keys(RAIZ_ESCOLA).map(function (k) {
    return k + ': ' + DriveApp.getFolderById(RAIZ_ESCOLA[k]).getName();
  });
  Logger.log(nomes.join('\n'));
  return nomes;
}

/**
 * FISK DÓLARES (F$) — carteira gamificada do Portal do Aluno
 * + STREAK de dias seguidos + CONQUISTAS (badges).
 *
 * Economia aprovada pelo Pedro (28/07/2026):
 *   · F$ 2 por questão respondida (participação, mesmo errada)
 *   · F$ 8 adicionais por questão correta (acerto vale 10 no total)
 *   · F$ 30 por concluir uma atividade pela PRIMEIRA vez
 *   · Refez e MELHOROU a nota → F$ 1 por ponto percentual de melhora
 *   · Check-in diário: F$ 5 (+ bônus nos marcos da sequência)
 *   · Cada atividade paga a base uma única vez; teto diário de F$ 300
 *   · Começa do zero: nada retroativo.
 *
 * Planilhas (criadas automaticamente na primeira execução):
 *   _carteira   → RAF | Saldo | Atualizado
 *   _extrato    → Quando | RAF | Atividade | Tipo | Detalhe | Valor | Saldo
 *   _progresso  → RAF | Atividade | MelhorPct | BasePaga
 *   _streak     → RAF | Dias | Recorde | UltimoDia
 *   _conquistas → RAF | Badge | Quando
 *
 * ── INTEGRAÇÃO: JÁ APLICADA NESTE ARQUIVO ───────────────────────────────
 *   · doGet:  action=wallet
 *   · doPost: action=fdEarn / action=fdCheckin
 *   · salvamento de resultado (QP/MET) devolve `fd` na resposta
 * Depois de colar: Implantar → Gerenciar implantações → ✏️ → Nova versão.
 */

var FD = {
  PARTICIPACAO: 2,       // por questão respondida
  ACERTO: 8,             // adicional por questão correta
  CONCLUSAO: 30,         // primeira vez que fecha a atividade
  MELHORA_POR_PP: 1,     // por ponto percentual de melhora ao refazer
  CHECKIN: 5,            // check-in diário
  // bônus extra nos marcos da sequência (dias seguidos → F$)
  MARCOS: { 3: 10, 5: 15, 7: 25, 14: 40, 30: 100 },
  // 1 = dias estritamente consecutivos. Suba para 2/3 se quiser tolerar
  // fim de semana / aluno que só usa nos dias de aula.
  STREAK_TOLERANCIA_DIAS: 1,
  TETO_DIARIO: 300,
  EXTRATO_MAX: 20,
  // Multa por sumiço (ver fdPenalidade_). É de propósito pesada perto dos
  // ganhos: entrar todo dia rende ~5/dia, então uma semana fora apaga dez
  // dias de presença. Mexer aqui muda o peso da punição.
  INATIVIDADE_DIAS: 7,          // a partir de quantos dias parados começa a doer
  INATIVIDADE_POR_SEMANA: 50,   // F$ por semana completa fora
  INATIVIDADE_TETO: 200,        // não passa disso, por maior que seja o sumiço
  // Bônus por abrir o portal. O aluno pode entrar quantas vezes quiser, mas
  // só paga de novo depois de um intervalo e no máximo N vezes no dia —
  // senão bastaria sair e entrar em looping para imprimir dinheiro.
  ACESSO: 5,
  ACESSO_INTERVALO_H: 4,        // horas entre duas entradas pagas
  ACESSO_MAX_DIA: 3,
  // Bônus avulsos (fora de atividade): creditados UMA VEZ por aluno, sem
  // passar pelo _progresso — assim não contam como atividade nem liberam a
  // medalha "Nota 100!". A lista é fechada: o cliente só manda o id.
  BONUS: { 'tour-portal': 30 }
};

/* Catálogo de conquistas (ids estáveis — o portal tem o mesmo catálogo
   com nome/emoji/descrição). As regras rodam aqui no servidor. */
var FD_BADGES = ['primeira-atividade', 'primeiro-filme', 'primeira-musica',
                 'nota-100', 'nota-100-5', 'seq-3', 'seq-7', 'seq-14', 'seq-30',
                 'fs-500', 'fs-2000', 'fs-5000', 'maratona-5', 'persistente'];

function fdJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function fdSheet_(nome, cabecalho) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/**
 * A coluna UltimoDia volta da planilha como Date, não como texto: o Sheets
 * converte sozinho a string 'yyyy-MM-dd' no momento da escrita. Sem
 * normalizar, String(Date) vira "Thu Jul 30 2026 ..." e NUNCA é igual a
 * fdHoje_() — foi o que fazia o check-in pagar e a sequência subir a cada
 * entrada, em vez de uma vez por dia.
 */
function fdDiaStr_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v).trim().slice(0, 10);
}

function fdHoje_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/** Soma creditada HOJE (para o teto diário). O extrato é cronológico. */
function fdGanhoHoje_(raf) {
  var ext = fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo']);
  var evals = ext.getDataRange().getValues();
  var d0 = new Date(); d0.setHours(0, 0, 0, 0);
  var hoje = 0;
  for (var j = evals.length - 1; j >= 1; j--) {
    if (new Date(evals[j][0]) < d0) break;
    if (String(evals[j][1]).trim() === raf) {
      var v = Number(evals[j][5]) || 0;
      if (v > 0) hoje += v;          // multa não abre espaço para ganhar mais
    }
  }
  return hoje;
}

/** Escreve um crédito (aplica teto diário) e devolve {credito, saldo}. */
function fdCredita_(raf, atividade, tipo, detalhe, valor) {
  valor = Math.max(0, Math.round(Number(valor) || 0));
  var hoje = fdGanhoHoje_(raf);
  if (valor > 0 && hoje + valor > FD.TETO_DIARIO) {
    valor = Math.max(0, FD.TETO_DIARIO - hoje);
    detalhe = (detalhe ? detalhe + ' · ' : '') + 'teto diário aplicado';
  }
  var cart = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']);
  var cvals = cart.getDataRange().getValues();
  var crow = -1, saldo = 0;
  for (var k = 1; k < cvals.length; k++) {
    if (String(cvals[k][0]).trim() === raf) { crow = k + 1; saldo = Number(cvals[k][1]) || 0; break; }
  }
  saldo += valor;
  if (crow < 0) cart.appendRow([raf, saldo, new Date()]);
  else cart.getRange(crow, 2, 1, 2).setValues([[saldo, new Date()]]);
  if (valor > 0) {
    fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo'])
      .appendRow([new Date(), raf, atividade, tipo, detalhe, valor, saldo]);
  }
  return { credito: valor, saldo: saldo };
}

/** Streak atual registrada (sem alterar nada). */
function fdStreakDe_(raf) {
  var sh = fdSheet_('_streak', ['RAF', 'Dias', 'Recorde', 'UltimoDia']);
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === raf) {
      return { dias: Number(vals[i][1]) || 0, recorde: Number(vals[i][2]) || 0, ultimo: fdDiaStr_(vals[i][3]) };
    }
  }
  return { dias: 0, recorde: 0, ultimo: '' };
}

/** Conquistas do aluno + avaliação de novas (grava as que desbloqueou). */
function fdAvaliaBadges_(raf) {
  var sh = fdSheet_('_conquistas', ['RAF', 'Badge', 'Quando']);
  var vals = sh.getDataRange().getValues();
  var tem = {};
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === raf) tem[String(vals[i][1])] = true;
  }
  // dados para as regras
  var prog = fdSheet_('_progresso', ['RAF', 'Atividade', 'MelhorPct', 'BasePaga']).getDataRange().getValues();
  var atividades = 0, cem = 0, temFilme = false, temMusica = false;
  for (var p = 1; p < prog.length; p++) {
    if (String(prog[p][0]).trim() !== raf) continue;
    atividades++;
    if (Number(prog[p][2]) >= 100) cem++;
    if (String(prog[p][1]).indexOf('mp:') === 0) temFilme = true;   // Movie Program
    if (String(prog[p][1]).indexOf('sp:') === 0) temMusica = true;  // Song Program
  }
  var ext = fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo']).getDataRange().getValues();
  var ganhoVida = 0, temMelhora = false;
  for (var e = 1; e < ext.length; e++) {
    if (String(ext[e][1]).trim() !== raf) continue;
    var v = Number(ext[e][5]) || 0;
    if (v > 0) ganhoVida += v;       // "quanto já ganhou na vida", não o saldo
    if (String(ext[e][3]) === 'melhora') temMelhora = true;
  }
  var streak = fdStreakDe_(raf);
  var regras = {
    'primeira-atividade': atividades >= 1,
    'primeiro-filme': temFilme,
    'primeira-musica': temMusica,
    'nota-100': cem >= 1,
    'nota-100-5': cem >= 5,
    'seq-3': streak.dias >= 3 || streak.recorde >= 3,
    'seq-7': streak.dias >= 7 || streak.recorde >= 7,
    'seq-14': streak.dias >= 14 || streak.recorde >= 14,
    'seq-30': streak.dias >= 30 || streak.recorde >= 30,
    'fs-500': ganhoVida >= 500,
    'fs-2000': ganhoVida >= 2000,
    'fs-5000': ganhoVida >= 5000,
    'maratona-5': atividades >= 5,
    'persistente': temMelhora
  };
  var todas = [], novas = [];
  for (var b = 0; b < FD_BADGES.length; b++) {
    var id = FD_BADGES[b];
    if (tem[id]) { todas.push(id); continue; }
    if (regras[id]) { sh.appendRow([raf, id, new Date()]); todas.push(id); novas.push(id); }
  }
  return { todas: todas, novas: novas };
}

/** Saldo + extrato + streak + conquistas (alimenta o dashboard da home). */
/* Últimos lançamentos do aluno, do mais novo para o mais velho. Separado do
   fdWallet_ para o bootstrap pegar só o extrato: lá o saldo, a sequência e as
   medalhas já vêm frescos do check-in, e reavaliá-los custaria leituras de
   planilha à toa — que é justamente o recurso escasso. */
function fdExtratoDe_(raf) {
  var ext = fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo']);
  var evals = ext.getDataRange().getValues();
  var linhas = [];
  for (var j = evals.length - 1; j >= 1 && linhas.length < FD.EXTRATO_MAX; j--) {
    if (String(evals[j][1]).trim() === raf) {
      linhas.push({ t: new Date(evals[j][0]).getTime(), atividade: evals[j][2], tipo: evals[j][3], detalhe: evals[j][4], valor: Number(evals[j][5]) || 0 });
    }
  }
  return linhas;
}

function fdWallet_(raf) {
  raf = String(raf || '').trim();
  if (!raf) return { ok: false, error: 'RAF vazio' };
  var cart = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']);
  var saldo = 0;
  var vals = cart.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === raf) { saldo = Number(vals[i][1]) || 0; break; }
  }
  var linhas = fdExtratoDe_(raf);
  var streak = fdStreakDe_(raf);
  // se o último acesso ficou para trás, a sequência exibida zera
  if (streak.ultimo && streak.ultimo !== fdHoje_()) {
    var dif = Math.round((new Date(fdHoje_()) - new Date(streak.ultimo)) / 864e5);
    if (dif > FD.STREAK_TOLERANCIA_DIAS) streak.dias = 0;
  }
  var badges = fdAvaliaBadges_(raf);
  return { ok: true, saldo: saldo, extrato: linhas, streak: { dias: streak.dias, recorde: streak.recorde }, badges: badges.todas };
}

/**
 * Bônus por abrir o portal, pago mais de uma vez ao dia — mas com freio:
 * no máximo FD.ACESSO_MAX_DIA vezes e nunca antes de FD.ACESSO_INTERVALO_H
 * horas da última entrada paga. Sem esse freio, sair e entrar repetidamente
 * viraria uma máquina de F$. Varre o extrato de trás para frente e para no
 * começo do dia — as entradas pagas de ontem não interessam.
 */
function fdAcesso_(raf, hoje) {
  var ext = fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo']);
  var evals = ext.getDataRange().getValues();
  var d0 = new Date(); d0.setHours(0, 0, 0, 0);
  var id = 'acesso:' + hoje;
  var quantas = 0, ultima = null;
  for (var j = evals.length - 1; j >= 1; j--) {
    var quando = new Date(evals[j][0]);
    if (quando < d0) break;
    if (String(evals[j][1]).trim() !== raf) continue;
    if (String(evals[j][2]).trim() === id) {
      quantas++;
      if (!ultima) ultima = quando;      // de trás para frente, a 1ª é a mais recente
    }
  }
  if (quantas >= FD.ACESSO_MAX_DIA) return { credito: 0, motivo: 'limite do dia' };
  if (ultima && (new Date() - ultima) < FD.ACESSO_INTERVALO_H * 36e5) {
    return { credito: 0, motivo: 'intervalo' };
  }
  var r = fdCredita_(raf, id, 'acesso', 'entrada no portal', FD.ACESSO);
  return { credito: r.credito, saldo: r.saldo };
}

/**
 * Multa por sumiço: quem passa mais de uma semana sem entrar perde F$.
 * Cobrada uma única vez, na volta — o check-in grava a data de hoje logo em
 * seguida, então a entrada seguinte já tem lacuna zero. Nunca deixa o saldo
 * negativo: se a multa é maior que o saldo, leva o que tem. Quem entra pela
 * primeira vez na vida não é punido.
 */
function fdPenalidade_(raf, ultimo, hoje) {
  if (!ultimo) return null;
  var dias = Math.round((new Date(hoje) - new Date(ultimo)) / 864e5);
  if (dias < FD.INATIVIDADE_DIAS) return null;

  var semanas = Math.floor(dias / 7);
  var valor = Math.min(semanas * FD.INATIVIDADE_POR_SEMANA, FD.INATIVIDADE_TETO);
  var saldo = fdSaldoDe_(raf);
  valor = Math.min(valor, saldo);
  if (valor <= 0) return { dias: dias, semanas: semanas, valor: 0, saldo: saldo };

  var novo = saldo - valor;
  var cart = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']);
  var cvals = cart.getDataRange().getValues();
  for (var k = 1; k < cvals.length; k++) {
    if (String(cvals[k][0]).trim() === raf) {
      cart.getRange(k + 1, 2, 1, 2).setValues([[novo, new Date()]]);
      break;
    }
  }
  fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo'])
    .appendRow([new Date(), raf, 'inatividade:' + hoje, 'penalidade',
                dias + ' dias sem entrar', -valor, novo]);
  return { dias: dias, semanas: semanas, valor: valor, saldo: novo };
}

/** Check-in diário: mantém a sequência e paga o bônus do dia. Idempotente. */
function fdCheckin_(raf) {
  raf = String(raf || '').trim();
  if (!raf) return { ok: false, error: 'RAF vazio' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = fdSheet_('_streak', ['RAF', 'Dias', 'Recorde', 'UltimoDia']);
    var vals = sh.getDataRange().getValues();
    var row = -1, dias = 0, recorde = 0, ultimo = '';
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0]).trim() === raf) {
        row = i + 1; dias = Number(vals[i][1]) || 0; recorde = Number(vals[i][2]) || 0; ultimo = fdDiaStr_(vals[i][3]);
        break;
      }
    }
    var hoje = fdHoje_();
    // cobra ANTES de gravar a data de hoje, senão a lacuna já viria zerada
    var penal = fdPenalidade_(raf, ultimo, hoje);
    var credito = 0, detalhe = '';
    if (ultimo !== hoje) {
      var dif = ultimo ? Math.round((new Date(hoje) - new Date(ultimo)) / 864e5) : 999;
      dias = (dif <= FD.STREAK_TOLERANCIA_DIAS) ? dias + 1 : 1;
      recorde = Math.max(recorde, dias);
      if (row < 0) sh.appendRow([raf, dias, recorde, hoje]);
      else sh.getRange(row, 2, 1, 3).setValues([[dias, recorde, hoje]]);
      credito = FD.CHECKIN + (FD.MARCOS[dias] || 0);
      detalhe = 'check-in · sequência de ' + dias + (FD.MARCOS[dias] ? ' 🔥 marco +' + FD.MARCOS[dias] : '');
      var r = fdCredita_(raf, 'checkin:' + hoje, 'check-in', detalhe, credito);
      credito = r.credito;
    }
    var acesso = fdAcesso_(raf, hoje);
    var badges = fdAvaliaBadges_(raf);
    var cart = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']);
    var cvals = cart.getDataRange().getValues();
    var saldo = 0;
    for (var k = 1; k < cvals.length; k++) {
      if (String(cvals[k][0]).trim() === raf) { saldo = Number(cvals[k][1]) || 0; break; }
    }
    return { ok: true, credito: credito, acesso: acesso, saldo: saldo, penalidade: penal, streak: { dias: dias, recorde: recorde }, badges: badges.todas, novasBadges: badges.novas };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Credita uma atividade corrigida. Idempotente:
 *  · base paga só na 1ª vez; reenvio igual não paga; nota maior paga a melhora.
 */
/**
 * Bônus avulso e único (ex.: concluir o tour de boas-vindas do portal).
 * Idempotente: se já existe lançamento dessa atividade para o RAF no
 * _extrato, devolve credito 0 e o saldo atual. NÃO grava em _progresso.
 */
/**
 * ADMIN (exige TEACHER_KEY): apaga toda a pegada de um RAF na carteira —
 * saldo, extrato, progresso, sequência e conquistas. Serve para limpar RAF
 * de teste ou um cadastro errado. Devolve quantas linhas saíram de cada aba.
 */
function fdPurgeRaf_(raf) {
  raf = String(raf || '').trim();
  if (!raf) return { ok: false, error: 'RAF vazio' };
  // aba → índice (0-based) da coluna que guarda o RAF
  var ABAS = [
    ['_carteira',   0, ['RAF', 'Saldo', 'Atualizado']],
    ['_extrato',    1, ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo']],
    ['_progresso',  0, ['RAF', 'Atividade', 'MelhorPct', 'BasePaga']],
    ['_streak',     0, ['RAF', 'Dias', 'Recorde', 'UltimoDia']],
    ['_conquistas', 0, ['RAF', 'Badge', 'Quando']]
  ];
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var apagadas = {};
    for (var a = 0; a < ABAS.length; a++) {
      var sh = fdSheet_(ABAS[a][0], ABAS[a][2]);
      var col = ABAS[a][1];
      var vals = sh.getDataRange().getValues();
      var n = 0;
      // de baixo para cima: apagar linha não desloca as que ainda faltam olhar
      for (var i = vals.length - 1; i >= 1; i--) {
        if (String(vals[i][col]).trim() === raf) { sh.deleteRow(i + 1); n++; }
      }
      apagadas[ABAS[a][0]] = n;
    }
    return { ok: true, raf: raf, apagadas: apagadas };
  } finally {
    lock.releaseLock();
  }
}

function fdBonus_(raf, bonusId) {
  raf = String(raf || '').trim();
  bonusId = String(bonusId || '').trim();
  var valor = FD.BONUS[bonusId];
  if (!raf || !valor) return { ok: false, error: 'bônus desconhecido' };
  var atividade = 'bonus:' + bonusId;

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ext = fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo']);
    var evals = ext.getDataRange().getValues();
    for (var i = 1; i < evals.length; i++) {
      if (String(evals[i][1]).trim() === raf && String(evals[i][2]).trim() === atividade) {
        return { ok: true, credito: 0, saldo: fdSaldoDe_(raf), jaPago: true };
      }
    }
    var r = fdCredita_(raf, atividade, 'bonus', bonusId, valor);
    var badges = fdAvaliaBadges_(raf);
    return { ok: true, credito: r.credito, saldo: r.saldo, novasBadges: badges.novas };
  } finally {
    lock.releaseLock();
  }
}

/** Saldo atual da carteira (0 se o aluno ainda não tem linha). */
function fdSaldoDe_(raf) {
  var vals = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']).getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === raf) return Number(vals[i][1]) || 0;
  }
  return 0;
}

function fdEarn_(raf, activityId, correct, total) {
  raf = String(raf || '').trim();
  activityId = String(activityId || '').trim();
  correct = Math.max(0, Math.round(Number(correct) || 0));
  total = Math.max(0, Math.round(Number(total) || 0));
  if (!raf || !activityId || !total) return { ok: false, error: 'dados incompletos' };
  if (correct > total) correct = total;
  var pct = Math.round(correct / total * 100);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var prog = fdSheet_('_progresso', ['RAF', 'Atividade', 'MelhorPct', 'BasePaga']);
    var pvals = prog.getDataRange().getValues();
    var prow = -1, melhorPct = -1, basePaga = false;
    for (var i = 1; i < pvals.length; i++) {
      if (String(pvals[i][0]).trim() === raf && String(pvals[i][1]).trim() === activityId) {
        prow = i + 1; melhorPct = Number(pvals[i][2]) || 0; basePaga = String(pvals[i][3]) === 'sim';
        break;
      }
    }
    var credito = 0, detalhe = [], tipo = 'atividade';
    if (!basePaga) {
      credito = total * FD.PARTICIPACAO + correct * FD.ACERTO + FD.CONCLUSAO;
      detalhe.push('participação ' + (total * FD.PARTICIPACAO) + ' · acertos ' + (correct * FD.ACERTO) + ' · conclusão ' + FD.CONCLUSAO);
    } else if (pct > melhorPct) {
      credito = (pct - melhorPct) * FD.MELHORA_POR_PP;
      tipo = 'melhora';
      detalhe.push('melhora de ' + melhorPct + '% para ' + pct + '%');
    }
    var novoMelhor = Math.max(melhorPct, pct);
    if (prow < 0) prog.appendRow([raf, activityId, novoMelhor, 'sim']);
    else prog.getRange(prow, 3, 1, 2).setValues([[novoMelhor, 'sim']]);

    var r = { credito: 0, saldo: 0 };
    r = fdCredita_(raf, activityId, tipo, detalhe.join(' · '), credito);
    var badges = fdAvaliaBadges_(raf);
    return { ok: true, credito: r.credito, saldo: r.saldo, detalhe: detalhe.join(' · '), novasBadges: badges.novas };
  } finally {
    lock.releaseLock();
  }
}
/* ═══════════════════════════════════════════════════════════════════════════
   PAINEL DA DIREÇÃO — carteiras de Fisk Dólares
   COLAR NO FIM DO Code.gs (o arquivo principal do backend do Fisk Hub).

   Este bloco é ADITIVO: não redefine nada que já existe no Code.gs. Ele usa
   fdSheet_, fdJson_, json e fdPurgeRaf_, que já estão lá.

   Falta só UMA linha no doPost, logo depois da linha do 'fdBonus':

       if (req.action && req.action.indexOf('dirFd') === 0) return dirGuard(req, fdDirRota_);

   Uma linha só porque as quatro rotas começam com "dirFd" e o dirGuard
   (token de diretor, 6h) é o mesmo guarda das outras ações do painel.

   ── Por que "zerar" apaga tudo e não só o saldo ────────────────────────────
   A aba _progresso guarda "BasePaga = sim" por atividade, e é ela que impede
   pagar a mesma atividade duas vezes. Zerando só o saldo, a atividade que a
   direção rodou testando na conta do aluno continua marcada como paga — e o
   aluno não recebe nada ao fazê-la de verdade no primeiro dia de aula. Por
   isso o reset de um aluno reaproveita o fdPurgeRaf_, que já limpa as cinco
   abas (carteira, extrato, progresso, streak e conquistas).
   ═══════════════════════════════════════════════════════════════════════════ */

var FD_ABAS_DIR = [
  { nome: '_carteira',   cab: ['RAF', 'Saldo', 'Atualizado'],                                      col: 0 },
  { nome: '_extrato',    cab: ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo'], col: 1 },
  { nome: '_progresso',  cab: ['RAF', 'Atividade', 'MelhorPct', 'BasePaga'],                       col: 0 },
  { nome: '_streak',     cab: ['RAF', 'Dias', 'Recorde', 'UltimoDia'],                             col: 0 },
  { nome: '_conquistas', cab: ['RAF', 'Badge', 'Quando'],                                          col: 0 }
];

/** Uma linha por aluno com carteira: saldo + o tamanho do rastro deixado. */
function fdDirSaldos_() {
  var mapa = {}, ordem = [];
  function garante(raf) {
    if (!mapa[raf]) {
      mapa[raf] = { raf: raf, saldo: 0, atualizado: null, eventos: 0,
                    atividades: 0, badges: 0, dias: 0, recorde: 0 };
      ordem.push(raf);
    }
    return mapa[raf];
  }
  var carteira = fdSheet_('_carteira', FD_ABAS_DIR[0].cab).getDataRange().getValues();
  for (var i = 1; i < carteira.length; i++) {
    var raf = String(carteira[i][0]).trim();
    if (!raf) continue;
    var c = garante(raf);
    c.saldo = Number(carteira[i][1]) || 0;
    c.atualizado = carteira[i][2] ? new Date(carteira[i][2]).getTime() : null;
  }
  function conta(aba, campo) {
    var vals = fdSheet_(aba.nome, aba.cab).getDataRange().getValues();
    for (var j = 1; j < vals.length; j++) {
      var r = String(vals[j][aba.col]).trim();
      if (r) garante(r)[campo]++;
    }
  }
  conta(FD_ABAS_DIR[1], 'eventos');
  conta(FD_ABAS_DIR[2], 'atividades');
  conta(FD_ABAS_DIR[4], 'badges');

  var streak = fdSheet_('_streak', FD_ABAS_DIR[3].cab).getDataRange().getValues();
  for (var s = 1; s < streak.length; s++) {
    var rs = String(streak[s][0]).trim();
    if (mapa[rs]) { mapa[rs].dias = Number(streak[s][1]) || 0; mapa[rs].recorde = Number(streak[s][2]) || 0; }
  }
  var lista = ordem.map(function (r) { return mapa[r]; })
                   .sort(function (a, b) { return b.saldo - a.saldo; });
  return { ok: true, carteiras: lista, total: lista.length };
}

/**
 * Define o saldo exato de um aluno e deixa o ajuste registrado no extrato.
 * O lançamento vai com o valor da DIFERENÇA (pode ser negativo) e tipo
 * 'ajuste' — o fdGanhoHoje_ e o fdAvaliaBadges_ já ignoram valores negativos,
 * então tirar F$ não abre espaço no teto diário nem mexe nas conquistas.
 */
function fdDirSet_(raf, saldo, motivo) {
  raf = String(raf || '').trim();
  var novo = Math.round(Number(saldo));
  if (!raf) return { ok: false, error: 'Informe o RAF do aluno.' };
  if (!isFinite(novo) || novo < 0) return { ok: false, error: 'Saldo inválido — use um número igual ou maior que zero.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var cart = fdSheet_('_carteira', FD_ABAS_DIR[0].cab);
    var vals = cart.getDataRange().getValues();
    var row = -1, antes = 0;
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0]).trim() === raf) { row = i + 1; antes = Number(vals[i][1]) || 0; break; }
    }
    if (row < 0) cart.appendRow([raf, novo, new Date()]);
    else cart.getRange(row, 2, 1, 2).setValues([[novo, new Date()]]);

    var delta = novo - antes;
    if (delta !== 0) {
      fdSheet_('_extrato', FD_ABAS_DIR[1].cab)
        .appendRow([new Date(), raf, 'ajuste-direcao', 'ajuste',
                    (motivo || 'ajuste manual da direção') + ' · de F$ ' + antes + ' para F$ ' + novo,
                    delta, novo]);
    }
    return { ok: true, raf: raf, antes: antes, saldo: novo, delta: delta };
  } finally {
    lock.releaseLock();
  }
}

/** Zera a economia inteira: esvazia as cinco abas, preservando o cabeçalho. */
function fdDirResetTudo_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var apagadas = {}, alunos = {};
    for (var i = 0; i < FD_ABAS_DIR.length; i++) {
      var aba = FD_ABAS_DIR[i];
      var sh = fdSheet_(aba.nome, aba.cab);
      var vals = sh.getDataRange().getValues();
      for (var j = 1; j < vals.length; j++) {
        var r = String(vals[j][aba.col]).trim();
        if (r) alunos[r] = 1;
      }
      var n = sh.getLastRow() - 1;
      if (n > 0) sh.deleteRows(2, n);
      apagadas[aba.nome] = Math.max(0, n);
    }
    return { ok: true, apagadas: apagadas, alunos: Object.keys(alunos).length };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Roteador das quatro ações do painel. Chamado pelo dirGuard, ou seja, só
 * roda com token de diretor válido — o painel nunca carrega chave nenhuma.
 * O reset de um aluno reaproveita o fdPurgeRaf_ que já existia.
 */
function fdDirRota_(req) {
  var acao = String((req && req.action) || '');
  if (acao === 'dirFdSaldos')    return fdJson_(fdDirSaldos_());
  if (acao === 'dirFdSet')       return fdJson_(fdDirSet_(String(req.raf || ''), req.saldo, String(req.motivo || '')));
  if (acao === 'dirFdReset')     return fdJson_(fdPurgeRaf_(String(req.raf || '')));
  if (acao === 'dirFdResetTudo') return fdJson_(fdDirResetTudo_());
  return json({ ok: false, error: 'ação desconhecida: ' + acao });
}

/* ═══════════════════════════════════════════════════════════════════════════
   TREINAMENTOS INTERNOS — catálogo alimentado pelo Painel da Direção

   Antes deste bloco, a página treinamentos.html do Fisk Hub lia SÓ o arquivo
   estático treinamentos-data.js: para publicar um vídeo novo era preciso
   editar o repositório. Agora a direção cola o link da gravação no painel e
   ele aparece para os professores na hora.

   Dois TIPOS de vídeo, que é a distinção pedida:
   - 'reuniao'      → gravação de reunião de professores. Vai para uma faixa
                      própria ("Gravações de Reuniões"), ordenada da mais
                      recente para a mais antiga.
   - 'treinamento'  → treinamento de verdade. Vai para uma das categorias
                      temáticas do catálogo (ou uma categoria nova).

   O catálogo estático continua valendo: a página junta os dois. Nada do que
   já existe em treinamentos-data.js precisa ser migrado.

   Rotas:
   - tnList      (aberta)  → o que a página de treinamentos lê
   - dirTnList / dirTnAdd / dirTnRemove (token de diretor, via dirGuard)

   Bloco ADITIVO: usa fdSheet_, fdDiaStr_, fdHoje_ e json, que já existem.
   ═══════════════════════════════════════════════════════════════════════════ */

var TN_ABA = '_treinamentos';
var TN_CAB = ['ID', 'Tipo', 'Categoria', 'Titulo', 'Video', 'PDF', 'Quando', 'Criado', 'Por', 'Ativo'];

/* As categorias do catálogo estático (treinamentos-data.js). Ficam aqui só
   para o painel sugerir os mesmos nomes na hora de publicar — assim um
   treinamento novo cai DENTRO da faixa que já existe, em vez de criar uma
   faixa quase igual. Se uma categoria for criada só no repositório, basta
   acrescentá-la nesta lista para ela voltar a aparecer na sugestão. */
var TN_CATEGORIAS_BASE = [
  'Realidade Individual', 'Exploration e Checking', 'Atividade Comunicativa',
  'Aula Acadêmica', 'Gamificação'
];

function tnSheet_() { return fdSheet_(TN_ABA, TN_CAB); }

/** Quem está logado no painel (o dirGuard já validou o token antes). */
function tnQuem_(req) {
  return CacheService.getScriptCache().get('dirtok_' + String((req && req.token) || '')) || 'direção';
}

/**
 * Aceita link de arquivo do Drive ou de vídeo do YouTube.
 * Devolve '' para vazio e null para link que não serve — pasta do Drive é o
 * caso clássico: as pastas são restritas, só os arquivos têm liberação
 * individual de visualização para os professores.
 */
function tnLink_(u) {
  u = String(u == null ? '' : u).trim();
  if (!u) return '';
  if (!/^https:\/\//i.test(u)) return null;
  if (/drive\.google\.com\/drive\/folders/i.test(u)) return null;
  return u;
}

/** Uma linha da aba vira o objeto que o front-end consome. */
function tnItem_(linha) {
  return {
    id: String(linha[0] || ''),
    tipo: String(linha[1] || 'treinamento'),
    categoria: String(linha[2] || ''),
    titulo: String(linha[3] || ''),
    video: String(linha[4] || ''),
    pdf: String(linha[5] || ''),
    quando: fdDiaStr_(linha[6]),
    criado: linha[7] ? new Date(linha[7]).getTime() : null,
    por: String(linha[8] || '')
  };
}

/**
 * Lê a aba inteira. Só devolve o que está ativo — remover no painel marca
 * 'nao' na coluna Ativo em vez de apagar a linha, para o histórico de quem
 * publicou o quê não sumir.
 */
function tnLer_() {
  var vals = tnSheet_().getDataRange().getValues();
  var itens = [];
  for (var i = 1; i < vals.length; i++) {
    if (!String(vals[i][0] || '').trim()) continue;
    if (String(vals[i][9] || 'sim').toLowerCase() === 'nao') continue;
    itens.push(tnItem_(vals[i]));
  }
  /* reuniões: da mais recente para a mais antiga (é o que a direção espera
     ver no topo). Sem data, cai para a hora da publicação. */
  itens.sort(function (a, b) {
    var da = a.quando || '', db = b.quando || '';
    if (da !== db) return db.localeCompare(da);
    return (b.criado || 0) - (a.criado || 0);
  });
  return itens;
}

/** Rota aberta: é o que a página de treinamentos do Hub lê ao abrir. */
function tnList_() {
  return { ok: true, itens: tnLer_() };
}

function tnAdd_(req) {
  var tipo = String(req.tipo || '').trim().toLowerCase();
  if (tipo !== 'reuniao' && tipo !== 'treinamento') {
    return { ok: false, error: 'Escolha se é gravação de reunião ou treinamento.' };
  }
  var titulo = String(req.titulo || '').trim();
  if (!titulo) return { ok: false, error: 'Dê um título ao vídeo.' };

  var video = tnLink_(req.video);
  var pdf = tnLink_(req.pdf);
  if (video === null) return { ok: false, error: 'O link do vídeo precisa ser de um ARQUIVO do Drive (ou do YouTube) — link de pasta não abre para os professores.' };
  if (pdf === null) return { ok: false, error: 'O link do material precisa ser de um ARQUIVO do Drive — link de pasta não abre para os professores.' };
  if (!video && !pdf) return { ok: false, error: 'Cole pelo menos o link do vídeo.' };

  var categoria = tipo === 'reuniao' ? '' : String(req.categoria || '').trim();
  if (tipo === 'treinamento' && !categoria) {
    return { ok: false, error: 'Escolha a categoria do treinamento.' };
  }

  var quando = String(req.quando || '').trim().slice(0, 10);
  if (quando && !/^\d{4}-\d{2}-\d{2}$/.test(quando)) quando = '';
  if (tipo === 'reuniao' && !quando) quando = fdHoje_();

  var id = 'tn' + Utilities.getUuid().slice(0, 8);
  tnSheet_().appendRow([
    id, tipo, categoria, titulo, video, pdf, quando,
    new Date(), tnQuem_(req), 'sim'
  ]);
  return { ok: true, id: id };
}

/** Remoção é lógica: a linha fica, a coluna Ativo vira 'nao'. */
function tnRemove_(req) {
  var id = String(req.id || '').trim();
  if (!id) return { ok: false, error: 'Informe qual vídeo remover.' };
  var sh = tnSheet_();
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === id) {
      sh.getRange(i + 1, 10).setValue('nao');
      return { ok: true };
    }
  }
  return { ok: false, error: 'Vídeo não encontrado (talvez já tenha sido removido).' };
}

/**
 * Roteador do painel. Chamado pelo dirGuard, ou seja, só roda com token de
 * diretor válido — o painel não carrega chave nenhuma.
 */
function tnDirRota_(req) {
  var acao = String((req && req.action) || '');
  if (acao === 'dirTnList') {
    var itens = tnLer_();
    var cats = {}, lista = [];
    TN_CATEGORIAS_BASE.forEach(function (c) { cats[c] = 1; lista.push(c); });
    itens.forEach(function (it) {
      if (it.tipo === 'treinamento' && it.categoria && !cats[it.categoria]) {
        cats[it.categoria] = 1; lista.push(it.categoria);
      }
    });
    return json({ ok: true, itens: itens, categorias: lista });
  }
  if (acao === 'dirTnAdd')    return json(tnAdd_(req));
  if (acao === 'dirTnRemove') return json(tnRemove_(req));
  return json({ ok: false, error: 'ação desconhecida: ' + acao });
}
