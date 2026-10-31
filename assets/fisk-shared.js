/* ============================================================
   FISK — helpers compartilhados
   Fonte: github.com/Pedro-Fisk/fisk-hub/assets/fisk-shared.js
   Publicado via jsDelivr (tag de versão) e consumido pelas outras
   ferramentas do Hub. Sem dependências externas.
   ============================================================ */

/* ── Resposta do servidor que NÃO é JSON ──────────────────────────────────
 * O Apps Script responde uma PÁGINA HTML (<!DOCTYPE …>) toda vez que a
 * execução não chega ao fim por conta dele: tempo estourado, cota do dia,
 * deployment fora do ar, sessão do Google pedindo login. Quem chamava
 * `resp.json()` direto recebia a exceção crua do parser —
 *
 *     Unexpected token '<', "<!DOCTYPE "... is not valid JSON
 *
 * — e ela ia parar na tela do professor, que não tem como saber que aquilo
 * quer dizer "tente de novo em alguns instantes". Aconteceu em 06/08/2026 no
 * Abridor de Planners, ao abrir a turma no card.
 *
 * A ponte no servidor (cardProxy_) já traduz o HTML que vem DO CARD, mas ela
 * não pode traduzir o HTML que o Google gera quando é a execução do próprio
 * Hub que morre — aí não sobra código nosso rodando. Por isso a última
 * defesa mora aqui, no navegador.
 *
 * Uso: fetch(url).then(fiskJson).then(...)
 */
function fiskJson(resp) {
  return resp.text().then(function (txt) {
    var limpo = String(txt || '').replace(/^\uFEFF/, '').trim();
    var inicio = limpo.charAt(0);
    if (inicio === '{' || inicio === '[') {
      try { return JSON.parse(limpo); }
      catch (e) { throw new Error(fiskMsgRespostaEstranha(resp, limpo)); }
    }
    throw new Error(fiskMsgRespostaEstranha(resp, limpo));
  });
}

/* Frase única para o professor, com a pista técnica escondida no fim para
   quem for depurar. Separada do fiskJson porque o fisk-drive.js das outras
   ferramentas usa a mesma frase por outro caminho (POST). */
function fiskMsgRespostaEstranha(resp, corpo) {
  var http = resp && resp.status ? resp.status : 0;
  var ehLogin = /accounts\.google\.com|Fa(ç|c)a login|Sign in/i.test(String(corpo || ''));
  if (ehLogin) {
    return 'O Google pediu login para responder. Abra o Fisk Hub numa aba, entre com a ' +
           'conta da escola e tente de novo.';
  }
  return 'O servidor não respondeu com dados (o Google devolveu uma página de erro' +
         (http ? ', HTTP ' + http : '') + '). Quase sempre é a leitura estourando o ' +
         'tempo do Google: espere alguns instantes e tente de novo. Se insistir, ' +
         'avise o Pedro — pode ser o backend precisando ser publicado de novo.';
}

/* ── PEDIDO COM TEMPO LIMITE (auditoria de 30/10/2026, B9) ────────────────
 * Nenhuma página do Hub tinha teto para um pedido ao Apps Script: um script
 * travado (até 6 min) deixava "Procurando…" girando para sempre. Aqui o
 * pedido ganha um AbortController com 45 s por padrão (o card lento leva até
 * 40 s, fisk-shared.js:283), a resposta passa pelo fiskJson e o tempo
 * estourado vira UM erro reconhecível:
 *
 *     { code: 'timeout', message: 'O servidor demorou mais de 45 s' }
 *
 * Quem chama decide o que fazer com ele (a Minha aula guarda a marca; as
 * telas de documento mostram a causa). O pedido abortado aqui PODE ter chegado
 * ao servidor e ser gravado lá: quem reenvia precisa ser idempotente.
 *
 * Uso:  fiskFetch(url)                      → GET
 *       fiskFetch(url, { action: 'x' })     → POST, corpo em texto puro (sem preflight)
 *       fiskFetch(url, body, { timeoutMs: 25000 })
 * Só acrescenta: fetch + fiskJson continuam valendo onde já estão.
 */
var FISK_FETCH_TIMEOUT_MS = 45000;
function fiskFetch(url, body, opts) {
  opts = opts || {};
  var ms = opts.timeoutMs > 0 ? opts.timeoutMs : FISK_FETCH_TIMEOUT_MS;
  var init = { method: opts.method || (body == null ? 'GET' : 'POST') };
  if (body != null) {
    init.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
  if (ctrl) init.signal = ctrl.signal;
  var estourou = false;
  var timer = setTimeout(function () { estourou = true; if (ctrl) ctrl.abort(); }, ms);
  return fetch(url, init)
    .then(function (r) { clearTimeout(timer); return fiskJson(r); })
    .catch(function (e) {
      clearTimeout(timer);
      if (estourou || (e && e.name === 'AbortError')) {
        var et = new Error('O servidor demorou mais de ' + Math.round(ms / 1000) + ' s');
        et.code = 'timeout';
        throw et;
      }
      throw e;
    });
}
/** O erro veio do tempo limite do fiskFetch? */
function fiskEhTimeout(e) { return !!(e && (e.code === 'timeout' || e.name === 'AbortError')); }

/** Liga um botão de alternar modo escuro/claro, com persistência em localStorage. */
function fiskInitThemeToggle(buttonId, opts) {
  opts = opts || {};
  var storageKey = opts.storageKey || 'fisk_theme';
  var darkClass = opts.darkClass || 'theme-dark';
  var btn = document.getElementById(buttonId);
  if (!btn) return;

  function apply(dark) {
    document.body.classList.toggle(darkClass, dark);
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? 'Alternar modo claro' : 'Alternar modo escuro');
    btn.setAttribute('title', dark ? 'Alternar modo claro' : 'Alternar modo escuro');
  }

  var saved = null;
  try { saved = localStorage.getItem(storageKey); } catch (e) {}
  var dark = saved ? saved === 'dark' : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  apply(dark);

  btn.addEventListener('click', function () {
    var next = !document.body.classList.contains(darkClass);
    apply(next);
    try { localStorage.setItem(storageKey, next ? 'dark' : 'light'); } catch (e) {}
  });
}

/** Liga um botão "Limpar formulário" a um modal de confirmação padrão. */
function fiskInitClearConfirm(opts) {
  opts = opts || {};
  var trigger = document.getElementById(opts.triggerId);
  var modal = document.getElementById(opts.modalId);
  var confirmBtn = document.getElementById(opts.confirmId);
  var cancelBtn = document.getElementById(opts.cancelId);
  if (!trigger || !modal || !confirmBtn || !cancelBtn) return;

  trigger.addEventListener('click', function () { modal.classList.add('open'); });
  cancelBtn.addEventListener('click', function () { modal.classList.remove('open'); });
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.classList.remove('open');
  });
  confirmBtn.addEventListener('click', function () {
    modal.classList.remove('open');
    if (typeof opts.onConfirm === 'function') opts.onConfirm();
  });
}

/** Confirma antes de fechar a aba se hasUnsavedChangesFn() retornar true. */
function fiskInitBeforeUnloadGuard(hasUnsavedChangesFn) {
  window.addEventListener('beforeunload', function (e) {
    var dirty = typeof hasUnsavedChangesFn === 'function' ? hasUnsavedChangesFn() : true;
    if (dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

/* ============================================================
   SALVAR PDF NO DRIVE (pasta da turma / do aluno)
   Faz POST do PDF (base64) para o mesmo App da Web do card (API_URL).
   O Apps Script (ver apps-script/Code.gs, em `salvarPdfNoDrive`) localiza a pasta
   por NOME no drive compartilhado e grava o arquivo; se não achar,
   devolve code:'pasta_nao_encontrada' e o professor é avisado.
   ============================================================ */

/* URL do App da Web do endpoint de salvamento — projeto Apps Script SEPARADO
   "fisk-hub-backend" (script 1AlWF9j-…, o mesmo backend do Portal do Aluno),
   NÃO é o API_URL do card. O handler mora no doPost de lá, em `salvarPdfNoDrive`
   (fonte documentada: apps-script/Code.gs). */
var FISK_SAVE_URL = 'https://script.google.com/macros/s/AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1/exec';

/** Converte um Uint8Array em base64 (em blocos, evita estourar a pilha). */
function fiskBytesToBase64(bytes) {
  var bin = '', chunk = 0x8000;
  for (var i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/**
 * Envia um PDF para o App da Web salvar na pasta certa.
 * opts: { endpoint, key, tipo:'turma'|'aluno', escola, professor, turma,
 *         aluno, filename, bytes(Uint8Array) }
 * Resolve com { ok:true, url, pasta }. Rejeita com Error cujo .code pode
 * ser 'pasta_nao_encontrada'.
 */
/* ── A PASTA DO HOMÔNIMO (contrato novo do backend, achado 20 da auditoria de 30/10/2026) ──
 * Quando a pasta do aluno não existe na turma do card, o backend achava UMA pasta com o mesmo nome em qualquer
 * turma/professor da escola e gravava lá só com um aviso: aluno novo sem pasta + homônimo em outra turma = termo,
 * 2nd chance e counseling na pasta do outro. Pelo contrato novo ele responde
 *     { ok:false, cod:'pasta_fora_da_turma', aviso, pastaNome, pastaCaminho }
 * e só grava ali se o pedido voltar com confirmaPasta:true. Aqui o professor vê o caminho e decide num confirm;
 * recusou, o erro sai com code 'pasta_recusada'. Enquanto o backend não mandar esse cod, nada muda. */
function fiskEhPastaFora(j) { return !!(j && j.ok === false && (j.cod || j.code) === 'pasta_fora_da_turma'); }
function fiskConfirmarPastaFora(j, pergunta) {
  var txt = '⚠️ ' + (j.aviso || 'A pasta do aluno não foi encontrada na turma; existe uma com o mesmo nome em outro lugar.') +
    '\n\nPasta: ' + (j.pastaNome || '?') + (j.pastaCaminho ? '\n' + j.pastaCaminho : '') +
    '\n\n' + (pergunta || 'Salvar mesmo assim nessa pasta?');
  return window.confirm(txt);
}
function fiskErroPastaRecusada(j, recusa) {
  var e = new Error(recusa || 'não salvou: pasta do aluno não encontrada na turma');
  e.code = 'pasta_recusada'; e.resposta = j;
  return e;
}
/* fazer(extra) faz o pedido com os campos extra; se a resposta pedir confirmação, pergunta e repete com
   { confirmaPasta: true }. Devolve a resposta final; recusa rejeita com code 'pasta_recusada'. */
function fiskComPastaConfirmada(fazer, pergunta, recusa) {
  return Promise.resolve().then(function () { return fazer({}); }).then(function (j) {
    if (!fiskEhPastaFora(j)) return j;
    if (!fiskConfirmarPastaFora(j, pergunta)) throw fiskErroPastaRecusada(j, recusa);
    return fazer({ confirmaPasta: true });
  });
}

async function fiskSalvarNoDrive(opts) {
  var endpoint = opts.endpoint || FISK_SAVE_URL;
  if (!endpoint) { var ec = new Error('URL de salvamento não configurada (defina FISK_SAVE_URL em fisk-shared.js após publicar o endpoint)'); ec.code = 'sem_endpoint'; throw ec; }
  var payload = {
    fn: 'salvarPdf', key: opts.key, token: opts.token || '', tipo: opts.tipo,
    escola: opts.escola || '', professor: opts.professor || '',
    turma: opts.turma || '', aluno: opts.aluno || '',
    filename: opts.filename || 'documento.pdf', mime: 'application/pdf',
    dados: fiskBytesToBase64(opts.bytes)
  };
  /* Substituição por padrão: usada quando o nome do arquivo muda a cada versão
     (o plano de aula leva a data no nome). Sem isso, o servidor só troca
     arquivos de nome IDÊNTICO e os antigos se acumulam na pasta. */
  if (opts.substituiPrefixo) payload.substituiPrefixo = opts.substituiPrefixo;
  if (opts.substituiSufixo) payload.substituiSufixo = opts.substituiSufixo;
  // corpo como string simples (text/plain) evita preflight CORS no Apps Script; teto de 90 s porque o PDF
  // vai em base64 e o Drive ainda escreve (auditoria de 30/10/2026, B9/M3)
  var j = await fiskFetch(endpoint, JSON.stringify(payload), { timeoutMs: opts.timeoutMs || 90000 });
  /* pasta só achada em outra turma/professor: o professor confirma pelo caminho, ou não salva */
  if (fiskEhPastaFora(j) && !payload.confirmaPasta) {
    if (!fiskConfirmarPastaFora(j)) throw fiskErroPastaRecusada(j);
    payload.confirmaPasta = true;
    j = await fiskFetch(endpoint, JSON.stringify(payload), { timeoutMs: opts.timeoutMs || 90000 });
  }
  if (!j || j.ok !== true) {
    var err = new Error((j && j.erro) || 'falha ao salvar no Drive');
    err.code = (j && j.code) || '';
    throw err;
  }
  return j;
}

/**
 * Liga um botão ao envio para o Drive, com feedback padrão e — o mais
 * importante — NOTIFICA o professor de forma clara quando a pasta não é
 * encontrada (para ele não achar que salvou sem ter salvo).
 * getOpts() deve devolver as opts de fiskSalvarNoDrive (inclui bytes já
 * gerados). Retorna Promise.
 */
async function fiskEnviarParaPasta(buttonEl, getOpts) {
  if (!buttonEl) return;
  var old = buttonEl.textContent;
  buttonEl.disabled = true; buttonEl.textContent = '⏳ Enviando ao Drive…';
  var opts;
  try {
    opts = (typeof getOpts === 'function') ? await getOpts() : getOpts;
    if (!opts) { buttonEl.disabled = false; buttonEl.textContent = old; return; }
    var r = await fiskSalvarNoDrive(opts);
    // mostra ONDE salvou: a pasta é escolhida por aproximação (dia+horário no
    // caso da turma), então o professor tem de conseguir conferir num relance
    buttonEl.textContent = r && r.pasta ? '✓ Salvo em "' + r.pasta + '"' : '✓ Salvo na pasta';
    setTimeout(function () { buttonEl.textContent = old; buttonEl.disabled = false; }, 4000);
    /* Salvou, MAS fora do lugar previsto pelo card (aluno que trocou de turma
       ou de professor e a pasta não acompanhou). O documento chegou ao aluno —
       por isso é aviso e não erro —, e quem organiza as pastas precisa saber. */
    if (r && r.aviso) fiskAvisoDePasta(buttonEl, r.aviso);
    return r;
  } catch (e) {
    buttonEl.textContent = old; buttonEl.disabled = false;
    /* Sem alert (auditoria de 30/10/2026, M3): o pop-up genérico igualava pasta inexistente (secretaria) a
       escrita negada (Pedro), e ao fechá-lo sobrava "não salvou". A causa e a porta ficam na página, ao lado do
       botão, e viajam em e.motivo para a linha de status de quem chamou. */
    e.motivo = fiskMotivoDePasta(e, opts && opts.tipo);
    fiskAvisoDePasta(buttonEl, 'NÃO salvou: ' + e.motivo + '. O PDF continua no botão de baixar.');
    throw e;
  }
}

/* A CAUSA DE NÃO TER SALVO, com a porta (quem resolve): pasta inexistente é a secretaria; escrita recusada é o
   Pedro (setupDriveEscrita); tempo estourado é esperar. Serve às linhas de status do 2nd Chance e do Termo. */
function fiskMotivoDePasta(e, tipo) {
  var code = (e && e.code) || '', msg = String((e && e.message) || e || '');
  var quem = tipo === 'turma' ? 'da turma' : 'do aluno';
  if (code === 'pasta_nao_encontrada') return 'pasta ' + quem + ' não encontrada: peça à secretaria para criar';
  if (code === 'pasta_recusada') return 'não salvou: pasta do aluno não encontrada na turma';
  if (code === 'timeout') return 'o servidor demorou (' + msg + '): confira a pasta antes de tentar de novo';
  if (code === 'sem_endpoint') return 'o salvamento no Drive não está configurado: avise o Pedro';
  if (/permiss|autoriza|negad|denied|insufficient|escrita|setupDrive/i.test(msg)) return 'o Drive recusou a escrita: avise o Pedro';
  if (/sess[ãa]o/i.test(msg)) return 'sua sessão expirou: entre de novo no Hub';
  if (/não respondeu com dados|página de erro|pediu login/i.test(msg)) return 'o servidor não respondeu: tente de novo em instantes';
  return msg || 'não salvou';
}

/**
 * Desabilita o botão, troca o conteúdo por um spinner + rótulo enquanto
 * asyncFn roda, e restaura o botão ao final (sucesso ou erro).
 */
async function fiskWithSpinner(buttonEl, asyncFn, opts) {
  opts = opts || {};
  var originalHtml = buttonEl.innerHTML;
  buttonEl.disabled = true;
  buttonEl.innerHTML = '';

  var spinner = document.createElement('span');
  spinner.className = 'spinner';
  buttonEl.appendChild(spinner);

  var label = document.createElement('span');
  label.textContent = opts.label || 'Gerando...';
  buttonEl.appendChild(label);

  try {
    return await asyncFn();
  } finally {
    buttonEl.disabled = false;
    buttonEl.innerHTML = originalHtml;
  }
}

/* ============================================================================
   MENU DO PROFESSOR — mesmo canto, mesma cara, em toda ferramenta.
   Mostra quem está logado e reúne os atalhos e o "Sair". Antes, só a home do
   Hub tinha isso: quem entrava numa ferramenta perdia a identidade de vista e
   não tinha como sair sem voltar.
   Chame fiskInitUserMenu() no fim do script da página (o CSS vem deste kit).
   ============================================================================ */

/* ── O QUE O HUB GUARDOU NO APARELHO SAI JUNTO COM A SESSÃO (auditoria de 30/10/2026, M12) ──
 * O "Sair" apagava só fisk_prof, fisk_actas e fisk_minidash; ficavam no computador da sala as listas de alunos
 * com RAF (cal:turmas:*, th:lista:*), os atendimentos (th:atend:*), o que a Minha aula deixa para o plano de
 * curso (pc:*), o uso (hub:*) e a grade da tutoria (tut:*). Aqui varre tudo isso, no localStorage e no
 * sessionStorage. A fila de marcas não enviadas (th:fila:v1) é a exceção: com itens pendentes ela FICA, porque
 * são presenças que ainda não chegaram ao servidor e vão sozinhas quando a pessoa entrar de novo.
 * Devolve quantas marcas ficaram guardadas. */
var FISK_PREFIXOS_LOCAIS = ['pc:', 'cal:', 'th:', 'hub:', 'tut:', 'fisk_buddy_fab', 'fisk_buddy_mini', 'fisk_buddy_aberto', 'fisk_aniv_lista'];
var FISK_FILA_MARCAS = 'th:fila:v1';
function fiskMarcasPendentes() {
  try { var f = JSON.parse(localStorage.getItem(FISK_FILA_MARCAS) || '[]'); return Array.isArray(f) ? f.length : 0; } catch (e) { return 0; }
}
function fiskLimparAoSair() {
  var pendentes = fiskMarcasPendentes();
  ['fisk_prof', 'fisk_actas', 'fisk_minidash'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
  [localStorage, sessionStorage].forEach(function (st) {
    var tirar = [];
    try {
      for (var i = 0; i < st.length; i++) {
        var k = st.key(i);
        if (!k) continue;
        if (k === FISK_FILA_MARCAS && pendentes) continue;
        for (var p = 0; p < FISK_PREFIXOS_LOCAIS.length; p++) if (k.indexOf(FISK_PREFIXOS_LOCAIS[p]) === 0) { tirar.push(k); break; }
      }
      tirar.forEach(function (k) { st.removeItem(k); });
    } catch (e) {}
  });
  return pendentes;
}
/* ══ CACHES COM VALIDADE E DONO (auditoria de 30/10/2026, A4 e A5) ═══════════════════════════════════════════════
 * O Hub abre toda ferramenta em outra aba, e o sessionStorage é por aba: o que uma página guardava ali a próxima
 * refazia. Tudo o que é resposta do servidor que pode ser reaproveitada mora no localStorage, no formato
 * {t, dono, v}: `t` é quando foi guardado, `dono` são os 12 primeiros caracteres do token (outra conta no mesmo
 * aparelho não lê o que não é dela) e `v` é o valor. `fiskCacheLe` devolve null quando venceu ou é de outro dono.
 * As chaves entram em FISK_PREFIXOS_LOCAIS, e o "Sair" apaga. */
function fiskDono() { var s = fiskSessao(); return s && s.token ? String(s.token).slice(0, 12) : ''; }
function fiskCacheLe(chave, maxMs) {
  try {
    var g = JSON.parse(localStorage.getItem(chave) || 'null');
    if (!g || typeof g !== 'object' || !('v' in g) || g.dono !== fiskDono()) return null;
    if (maxMs != null && Date.now() - (g.t || 0) > maxMs) return null;
    return g.v;
  } catch (e) { return null; }
}
function fiskCacheGuarda(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify({ t: Date.now(), dono: fiskDono(), v: valor })); } catch (e) {}   /* sem espaço: só não guarda */
  return valor;
}
function fiskCacheApaga(chave) { try { localStorage.removeItem(chave); } catch (e) {} }
var FISK_CACHE_30MIN = 30 * 60000, FISK_CACHE_DIA = 24 * 3600000;

/* ══ POLLING SÓ NA ABA VISÍVEL (auditoria de 30/10/2026) ════════════════════════════════════════════════════════
 * Troca o setInterval que fala com o backend: a aba escondida não pede nada, e ao voltar a aparecer o próximo
 * pedido sai quando o prazo vencer (na hora, se já venceu). `fn` devolve uma promessa (ou false): rejeitada ou
 * false, o intervalo dobra até `max` (8× por padrão); resolvida, volta ao de sempre. Devolve {parar, agora}. */
function fiskPollVisivel(fn, ms, opts) {
  opts = opts || {};
  var base = ms, atual = ms, max = opts.max || ms * 8, timer = null, ultimo = Date.now(), rodando = false;
  function agenda(d) { clearTimeout(timer); timer = setTimeout(roda, Math.max(0, d)); }
  function roda() {
    timer = null;
    if (document.hidden) return;   /* escondida: dorme; o visibilitychange acorda */
    if (rodando) { agenda(atual); return; }
    var r; rodando = true; ultimo = Date.now();
    try { r = fn(); } catch (e) { r = Promise.reject(e); }
    Promise.resolve(r).then(function (ok) { atual = ok === false ? Math.min(atual * 2, max) : base; }, function () { atual = Math.min(atual * 2, max); })
      .then(function () { rodando = false; if (!document.hidden) agenda(atual); });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { clearTimeout(timer); timer = null; return; }
    if (!timer && !rodando) agenda(atual - (Date.now() - ultimo));
  });
  agenda(atual);
  return { parar: function () { clearTimeout(timer); timer = null; }, agora: function () { agenda(0); } };
}

/* A pergunta do "Sair", com o aviso das marcas guardadas quando há alguma. */
function fiskPerguntaDeSaida() {
  var n = fiskMarcasPendentes();
  return 'Sair da sua conta neste computador?' + (n ? '\n\n⏳ ' + n + ' marca' + (n === 1 ? '' : 's') + ' de presença ainda não ' + (n === 1 ? 'chegou' : 'chegaram') + ' ao servidor. ' +
    (n === 1 ? 'Ela fica guardada' : 'Elas ficam guardadas') + ' neste aparelho e ' + (n === 1 ? 'vai sozinha' : 'vão sozinhas') + ' quando você entrar de novo na Minha aula.' : '');
}

/* ── SESSÃO EXIGIDA, SESSÃO VENCIDA: uma rotina para as quatro telas (auditoria de 30/10/2026, M4) ──
 * Termo, 2nd Chance e Minha aula tinham cada uma a sua; o E-counseling montava a cascata, chamava o backend sem
 * sessão e escrevia "sessão expirada" sem link. Dois usos:
 *   fiskExigirSessao(el)        → devolve a sessão; sem ela, escreve "🔒 Entre no Fisk Hub…" com o link e devolve null
 *   fiskExigirSessao(el, msg)   → o servidor recusou a sessão: escreve msg com "Entrar de novo →", apaga a sessão
 *                                 velha (senão o link voltava à home logada e a tela falhava de novo) e avisa a home
 * `el` é a linha de status da página (innerHTML). */
function fiskEhErroDeSessao(e) { return /sess[ãa]o/i.test(String((e && e.message) || e || '')); }
function fiskExigirSessao(el, msg) {
  var s = fiskSessao();
  if (s && s.token && !msg) return s;
  var base = fiskHubBase();
  if (el) {
    el.innerHTML = msg
      ? '⚠️ ' + fiskEsc(msg) + ' <a href="' + base + 'index.html" style="font-weight:800">Entrar de novo →</a>'
      : '🔒 Entre no Fisk Hub para abrir esta ferramenta. <a href="' + base + 'index.html" style="font-weight:800">Entrar →</a>';
    el.hidden = false;
  }
  if (msg) { try { localStorage.removeItem('fisk_prof'); sessionStorage.setItem('fisk_sessao_caiu', '1'); } catch (e) {} }
  return null;
}

/** Sessão do professor gravada pelo login do Hub. */
function fiskSessao() {
  try { return JSON.parse(localStorage.getItem('fisk_prof') || 'null'); } catch (e) { return null; }
}

/* ── O AVATAR COMEMORA (Pedro, 27/10/2026: "leva também para o Hub dos professores") ──────────────────────────────
 * fiskFesta('📚') no momento GRANDE (sobe sempre); fiskFesta('📄', true) no PEQUENO (sobe na 3ª, 6ª, 9ª… do dia, com a
 * fitinha "3 hoje!"). É o mesmo avatar 3D do portal, com a roupa que o professor montou no My Avatar (sem avatar, o Buddy),
 * e a mesma fanfarra curta. O módulo mora no portal (assets/avatar-festa.js) e só baixa na primeira comemoração da
 * visita; a roupa vem da rota avVisual, e a primeira vez espera por ela (até 4 s) para não mostrar o Buddy por engano.
 * Sem sessão do Hub, não faz nada. Quem pediu "menos movimento" no sistema vê o avatar parado.
 * ============================================================================ */
var _fiskFesta = null;
function fiskFesta(selo, pequena) {
  try {
    var s = fiskSessao();
    if (!s || !s.name || !s.token) return;
    if (!_fiskFesta) {
      _fiskFesta = new Promise(function (ok, nao) {
        if (window.FiskAvatarFesta) return ok();
        var sc = document.createElement('script');
        sc.src = 'https://portalfisk.com.br/assets/avatar-festa.js?v=2026-10-27';
        sc.onload = ok; sc.onerror = nao; document.head.appendChild(sc);
      }).then(function () {
        var p = window.FiskAvatarFesta.prepara({ raf: 'PROF:' + s.name, profToken: s.token, endpoint: FISK_HUB_EP,
          appKey: 'fisk_0719bacbecc857f61d1e', base: 'https://portalfisk.com.br/' });
        return Promise.race([p, new Promise(function (ok) { setTimeout(ok, 4000); })]);
      });
      _fiskFesta.catch(function () { _fiskFesta = null; });
    }
    _fiskFesta.then(function () { window.FiskAvatarFesta.viva({ selo: selo || '🏅', pequena: !!pequena }); }).catch(function () {});
  } catch (e) {}
}

/* ── ESPERA COM SINAL DE VIDA ───────────────────────────────────────────────
 * Ler o card leva de 5 a 40 segundos, e a tela parada nesse tempo parece
 * travada — foi a queixa depois que a Visão Geral passou a fazer uma leitura
 * única, sem o "3/11" para mostrar. O texto conta os segundos e muda conforme
 * a espera passa; `escrever` é quem sabe pintar o status daquela página.
 * Devolve a função que encerra: chame-a no sucesso E no erro.
 */
function fiskEsperando(escrever, frases) {
  var t0 = Date.now();
  function pinta() {
    var seg = Math.round((Date.now() - t0) / 1000);
    var i = seg < 8 ? 0 : (seg < 20 ? 1 : 2);
    escrever('🔄 ' + frases[Math.min(i, frases.length - 1)] + (seg >= 3 ? ' (' + seg + 's)' : ''));
  }
  pinta();
  var timer = setInterval(pinta, 1000);
  return function () { clearInterval(timer); };
}

/* O HORÁRIO DA TURMA, lido do título do card (Pedro, 15/09/2026: abrir sozinho a turma da aula de agora).
   Os títulos são escritos à mão e variam: "ADVANCED - 2ª/4ª 17h30 às 18h45", "Básico (+18) - 4ª 18h45/21h15",
   "Teens Connect 2 - Sáb - 10:30 ás 13:00", "Acadêmico Essentials 1- 2/4ª 17h30 as 18h45", "INTER/ADV - 5º 8h30 às 11h",
   "Basic (+18) - Sábado 08h/10h30", "Teens Elementary 2 Acad - 5ª 08h30 às 11". Usado pela Turma de hoje e pelo calendário do professor. Devolve {dias:[0-6], ini, fim} em minutos, ou null. */
function fiskHorarioDaTurma(titulo) {
  var t = String(titulo || '').split(/\n/)[0].replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  var mT = /(\d{1,2})\s*(?:[h:]|hr)\s*(\d{2})?/i.exec(t);
  if (!mT) return null;
  var antes = t.slice(0, mT.index), depois = t.slice(mT.index);
  var PAL = { 'dom': 0, 'seg': 1, 'segunda': 1, 'ter': 2, 'terca': 2, 'qua': 3, 'quarta': 3, 'qui': 4, 'quinta': 4, 'sex': 5, 'sexta': 5, 'sab': 6, 'sabado': 6 };
  var pedacos = antes.split(/\s[-–]\s?|[-–]\s|\s[-–]/).map(function (p) { return p.trim(); }).filter(Boolean);
  var dias = [];
  for (var i = pedacos.length - 1; i >= 0 && !dias.length; i--) {
    var p = pedacos[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    (p.match(/[a-z]+/g) || []).forEach(function (w) { if (w in PAL && dias.indexOf(PAL[w]) < 0) dias.push(PAL[w]); });
    if (/[ªº°]|\d[aA]?\s*(\/|e\s)\s*\d/.test(pedacos[i])) (pedacos[i].match(/[2-7](?=\s*(?:[ªº°aA]|\/|e\s|$))/g) || []).forEach(function (d) { var n = (+d) - 1; if (dias.indexOf(n) < 0) dias.push(n); });
  }
  if (!dias.length) return null;
  var horas = [], re = /(\d{1,2})\s*(?:(?:[h:]|hr)\s*(\d{2})?h?|(?=\s*$))/gi, m;
  while ((m = re.exec(depois)) && horas.length < 2) { var h = +m[1], mi = +(m[2] || 0); if (h <= 23 && mi < 60) horas.push(h * 60 + mi); }
  if (!horas.length) return null;
  var ini = horas[0], fim = horas[1] && horas[1] > ini ? horas[1] : ini + (dias.length > 1 ? 75 : 150);
  return { dias: dias.sort(), ini: ini, fim: fim };
}

/* ── A ÚLTIMA TURMA ─────────────────────────────────────────────────────────
 * Toda ferramenta que lê o card começa pela mesma cascata: escola →
 * professor(a) → turma. Quem dá dez aulas repetia as três escolhas a cada
 * troca de ferramenta, e ainda esperava uma leitura do card em cada passo.
 * A escolha fica guardada aqui, COMPARTILHADA entre as ferramentas: sair do
 * planejador e abrir o termo cai na mesma turma, que é o caminho real de uso.
 *
 * Guarda também DE QUEM é a memória: a direção atua como vários professores, e
 * repor a turma de outro seria pior do que não repor nada. E tem prazo — 45
 * dias cobrem o semestre em andamento; passado isso, o card já é outro. */
var FISK_TURMA_CHAVE = 'fisk_ultima_turma';
var FISK_TURMA_VALIDADE_MS = 45 * 24 * 60 * 60 * 1000;

function fiskLembrarTurma(escola, prof, linha, titulo) {
  if (!escola || !prof || linha == null || linha === '') return;
  var s = fiskSessao();
  try {
    localStorage.setItem(FISK_TURMA_CHAVE, JSON.stringify({
      escola: String(escola), prof: String(prof), linha: String(linha),
      titulo: String(titulo || ''), quem: (s && s.name) || '', quando: Date.now()
    }));
  } catch (e) {}
}

/** A última turma, ou null se não houver, se venceu, ou se é de outra pessoa. */
function fiskUltimaTurma() {
  var m = null;
  try { m = JSON.parse(localStorage.getItem(FISK_TURMA_CHAVE) || 'null'); } catch (e) {}
  if (!m || !m.escola || !m.prof) return null;
  if (!m.quando || Date.now() - m.quando > FISK_TURMA_VALIDADE_MS) return null;
  var s = fiskSessao();
  if (m.quem && s && s.name && m.quem !== s.name) return null;
  return m;
}

/**
 * Repõe um degrau da cascata. Chame depois de MONTAR cada select, com o campo
 * correspondente ('escola', 'prof' ou 'linha'): se o valor guardado estiver
 * entre as opções, ele é escolhido e o `change` dispara — é o próprio change
 * que carrega o degrau seguinte, então a cascata se remonta sozinha.
 * Devolve true quando repôs, para a ferramenta poder ajustar o texto da tela.
 */
function fiskReporTurma(sel, campo) {
  var m = fiskUltimaTurma();
  if (!sel || !m || !m[campo]) return false;
  var alvo = String(m[campo]);
  var existe = Array.prototype.some.call(sel.options, function (o) { return String(o.value) === alvo; });
  if (!existe) return false;   // turma que saiu do card, professor que mudou de escola
  sel.value = alvo;
  sel.dispatchEvent(new Event('change'));
  return true;
}

/**
 * Raiz do Fisk Hub a partir de QUALQUER ferramenta. As páginas do próprio
 * repo carregam o kit por caminho relativo ('assets/…'); as de fora (boletim,
 * planner, conversation maker) pegam do CDN. É esse detalhe que diz se os
 * atalhos podem ser relativos ou precisam da URL de produção.
 */
function fiskHubBase() {
  var link = document.querySelector('link[href*="fisk-shared.css"]');
  var href = link ? link.getAttribute('href') || '' : '';
  var externo = /^https?:/i.test(href);
  return externo ? 'https://pedro-fisk.github.io/fisk-hub/' : '';
}

/* ---------- O logo do cabeçalho leva à CASA de quem está logado ----------
 * Um ponto só para todas as páginas que usam o kit: o `.hero-logo` ganha um
 * link em volta. As páginas de fora (boletim, planner, conversation maker)
 * recebem a URL de produção pelo fiskHubBase().
 * A CASA (Pedro, 30/10/2026: "o logo tem que apontar para a home de onde a
 * pessoa pertence"): o professor volta à home do Hub; a DIREÇÃO (acesso master,
 * vinda do Painel da Direção) volta ao Painel da Direção, inclusive da própria
 * home do Hub. O "Ver como professor" é visita, não master: segue como o
 * professor. Os logos escritos à mão (.hub-home, .inicio, .tn-home) seguem a
 * mesma regra. A home chama window.fiskLigaLogo() depois do login. */
(function () {
  var PAINEL_DIRECAO = 'https://portalfisk.com.br/diretor.html';
  function liga() {
    var base = fiskHubBase(), s = fiskSessao(), dir = !!(s && s.master);
    var naHome = !base && /(^|\/)(index\.html)?$/.test(location.pathname);
    var alvo = dir ? PAINEL_DIRECAO : base + 'index.html', rot = dir ? 'Painel da Direção' : 'Fisk Hub';
    var marca = function (a) { a.href = alvo; a.title = rot; a.setAttribute('aria-label', 'Voltar ao ' + rot); };
    var logos = document.querySelectorAll('.hero .hero-logo');
    for (var i = 0; i < logos.length; i++) {
      var img = logos[i], ja = img.closest('a');
      if (ja) { if (ja.classList.contains('hero-home')) { if (naHome && !dir) { ja.parentNode.insertBefore(img, ja); ja.remove(); } else marca(ja); } continue; }
      if (naHome && !dir) continue;   /* na home do Hub, o professor já está em casa */
      var a = document.createElement('a');
      a.className = 'hero-home'; marca(a);
      img.parentNode.insertBefore(a, img);
      a.appendChild(img);
    }
    var maos = document.querySelectorAll('a.hub-home, a.inicio, a.tn-home');
    for (var j = 0; j < maos.length; j++) if (dir) { if (!maos[j].dataset.casaHub) maos[j].dataset.casaHub = maos[j].getAttribute('href'); marca(maos[j]); }
      else if (maos[j].dataset.casaHub) maos[j].setAttribute('href', maos[j].dataset.casaHub);
  }
  window.fiskLigaLogo = liga;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', liga);
  else liga();
})();

var FISK_IDIOMAS = [
  { id: 'pt', rot: 'PT' },
  { id: 'en', rot: 'EN' },
  { id: 'es', rot: 'ES' }
];

/* ---------- Idioma do professor: UMA chave só (09/10/2026) ----------
 * Havia duas: `fisk-lang` (a home, padrão `en`) e `fisk_lang` (este kit,
 * padrão `pt`). Ficou `fisk_lang`, e todo mundo lê e grava por aqui.
 *
 * MIGRAÇÃO: quem tem a chave antiga `fisk-lang` tem o valor dela copiado e a
 * antiga apagada. Ela ganha da nova de propósito: era a da home, ou seja, a
 * língua que o professor de fato via na tela.
 *
 * O PADRÃO VOLTOU A SER `pt` em 31/10/2026 (auditoria de 30/10, tema 8: o login
 * estava em inglês e todas as ferramentas em português). O Hub inteiro fala
 * português; `en` e `es` continuam no seletor do menu, e quem já escolheu
 * mantém a escolha (a chave `fisk_lang` gravada vale antes do padrão). */
var FISK_LANG_PADRAO = 'pt';
function fiskIdiomaValido(l) { return l === 'pt' || l === 'en' || l === 'es'; }

/** Idioma escolhido pelo professor: vale para todas as páginas. */
function fiskIdioma() {
  try {
    var antiga = localStorage.getItem('fisk-lang');
    if (antiga !== null) {
      if (fiskIdiomaValido(antiga)) localStorage.setItem('fisk_lang', antiga);
      localStorage.removeItem('fisk-lang');
    }
    var l = localStorage.getItem('fisk_lang');
    return fiskIdiomaValido(l) ? l : FISK_LANG_PADRAO;
  } catch (e) { return FISK_LANG_PADRAO; }
}

/** Guarda o idioma escolhido. Devolve o que ficou valendo. */
function fiskDefinirIdioma(lang) {
  if (!fiskIdiomaValido(lang)) return fiskIdioma();
  try { localStorage.setItem('fisk_lang', lang); localStorage.removeItem('fisk-lang'); } catch (e) {}
  return lang;
}

/**
 * Monta o menu do professor no cabeçalho.
 * opts.onIdioma(lang) — chamado quando o professor troca de idioma; se a
 * página não passa nada, a escolha é só guardada e vale na próxima que souber
 * traduzir (o idioma é do PROFESSOR, não da página). O seletor aparece em
 * TODA página desde 09/10/2026 (pedido do Pedro: o idioma volta ao menu).
 * opts.onSair() — substitui o "sair" padrão. O Hub usa para tratar o modo
 * visita da direção, que volta ao painel do diretor em vez do login.
 */
function fiskInitUserMenu(opts) {
  opts = opts || {};
  var hero = document.querySelector('.hero');
  var s = fiskSessao();
  if (!hero || !s || !s.name || document.querySelector('.fisk-user')) return null;

  var base = fiskHubBase();
  var primeiro = String(s.fullName || s.name).trim().split(/\s+/)[0];
  var escolas = String(s.escolas || s.escola || '');

  var wrap = document.createElement('div');
  wrap.className = 'fisk-user';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'fisk-user-btn';
  btn.setAttribute('aria-haspopup', 'true');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Menu de ' + primeiro);
  /* o nome vai num span próprio: no celular ele some e fica só 👤▾ */
  btn.innerHTML = '<span class="fu-ico">👤</span><span class="fu-nome">' + fiskEsc(primeiro) +
    '</span><span class="fu-seta">▾</span>';

  var menu = document.createElement('div');
  menu.className = 'fisk-user-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML =
    '<div class="fu-head"><b>' + fiskEsc(s.fullName || s.name) + '</b>' +
      (escolas ? '<span>' + fiskEsc(escolas.split(',').join(' + ')) + '</span>' : '') + '</div>' +
    '<a class="fu-item" href="' + base + 'index.html">🏠 Fisk Hub</a>' +
    '<a class="fu-item" href="' + base + 'visao-geral.html">📊 Radar da Turma</a>' +
    /* O E-COUNSELING DE QUALQUER TELA (Pedro, 20/09/2026). Não é mais um
       atalho para uma página: é a busca pelo nome do aluno aqui dentro, e a
       gaveta abre por cima do que o professor estava fazendo. Vive no menu
       porque o menu é a única coisa que existe nas vinte telas. */
    '<button type="button" class="fu-item fu-csl">💬 E-counseling de um aluno</button>' +
    '<a class="fu-item" href="' + base + 'treinamentos.html">🎓 Treinamentos</a>' +
    /* O IDIOMA VOLTOU AO MENU (Pedro, 09/10/2026), em toda página. Onde a
       página sabe traduzir (a home), troca na hora; nas outras a escolha
       fica guardada e vale quando ele voltar à home. */
    '<div class="fu-sep"></div><div class="fu-lang-rot">🌐 Idioma</div>' +
    '<div class="fu-langs" role="group" aria-label="Idioma">' + FISK_IDIOMAS.map(function (l) {
      return '<button type="button" class="fu-lang" data-lang="' + l.id + '">' + l.rot + '</button>';
    }).join('') + '</div>' +
    '<div class="fu-sep"></div>' +
    '<button type="button" class="fu-item fu-sair">🚪 Sair desta conta</button>';

  wrap.appendChild(btn); wrap.appendChild(menu);
  hero.appendChild(wrap);

  function marcarIdioma() {
    var atual = fiskIdioma();
    menu.querySelectorAll('.fu-lang').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-lang') === atual);
    });
  }
  marcarIdioma();

  function fechar() { wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var abrindo = !wrap.classList.contains('is-open');
    wrap.classList.toggle('is-open', abrindo);
    btn.setAttribute('aria-expanded', abrindo ? 'true' : 'false');
  });
  document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) fechar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });

  menu.querySelectorAll('.fu-lang').forEach(function (b) {
    b.addEventListener('click', function () {
      var lang = b.getAttribute('data-lang');
      fiskDefinirIdioma(lang);
      marcarIdioma();
      if (typeof opts.onIdioma === 'function') opts.onIdioma(lang);
      fechar();
    });
  });

  menu.querySelector('.fu-csl').addEventListener('click', function () {
    fechar();
    fiskCounselingBusca();
  });

  menu.querySelector('.fu-sair').addEventListener('click', function () {
    if (typeof opts.onSair === 'function') { fechar(); opts.onSair(); return; }
    if (!window.confirm(fiskPerguntaDeSaida())) return;
    fiskLimparAoSair();   /* sessão E o que o Hub guardou sobre os alunos neste aparelho */
    location.href = base + 'index.html';
  });

  return wrap;
}

function fiskEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


/* ============================================================================
   REGISTRO DE USO DA FERRAMENTA (log do professor, visão da direção)
   Cada página avisa o backend que foi aberta. Vira duas coisas: o retrato da
   sessão atual (_acessos_prof, uma linha por professor) e o histórico que
   alimenta o painel de uso da direção (_uso_ferramentas, uma linha por
   abertura). Silencioso de propósito: se falhar, a ferramenta segue
   funcionando.

   O PULSO mede o tempo logado. Ele só sai quando a aba está VISÍVEL e houve
   atividade de verdade nos últimos FISK_PULSO_OCIO minutos — uma aba
   esquecida aberta a tarde inteira não pode virar "cinco horas de uso", nem
   consumir a cota diária do Apps Script batendo no servidor à toa.
   ============================================================================ */
var FISK_HUB_EP = 'https://script.google.com/macros/s/AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1/exec';
var FISK_PULSO_MIN = 5;    // de quanto em quanto tempo o pulso sai
var FISK_PULSO_OCIO = 10;  // sem toque nenhum por este tempo, o pulso para

/* UM ID ESTÁVEL POR FERRAMENTA (auditoria de 30/10/2026, B7): o painel de uso da direção agrupa pelo texto, e a
   ferramenta que muda de nome ("Turma de hoje" → "Minha aula") virava duas linhas. O `id` é um slug fixo que não muda
   com o rótulo; o nome continua indo junto, legível. O backend que ainda não conhece o campo ignora e nada quebra.
   A tabela está documentada no CLAUDE.md: id novo entra aqui E lá. */
var FISK_FERRAMENTAS = {
  'hub-inicio': 'Fisk Hub (início)', 'minha-aula': 'Minha aula', 'radar-turma': 'Radar da Turma', 'radar-aluno': 'Radar do Aluno',
  'centro-estudos': 'Centro de Estudos', 'centro-estudos-frequencia': 'Centro de Estudos: frequência', 'centro-estudos-horarios': 'Centro de Estudos: horários',
  'answer-keys': 'Answer Keys', '2nd-chance': '2nd Chance', 'termo-atraso': 'Termo de Atraso', 'buddy': 'Buddy auxiliar', 'buddy-ajustes': 'Ajustes do Buddy',
  'calendario': 'Minha semana', 'counseling': 'E-counseling', 'treinamentos': 'Treinamentos', 'apps': 'Apps', 'avatar': 'My Avatar',
  'personagem': 'Meu personagem', 'personagem-salvou': 'Meu personagem (salvou)', 'hogwarts': 'Cerimônia de Seleção', 'noticias': 'Notícias da turma',
  'plano-curso': 'Plano de curso', 'checking-guia': 'Guia do Checking', 'raf-temporario': 'RAF temporário', 'corretor-met': 'Corretor do MET',
  'central-pedidos': 'Central de Pedidos', 'boletins': 'Boletins', 'quick-practice': 'Quick Practice', 'treino-met': 'Treino MET', 'treino-siele': 'Treino SIELE'
};
/* O GLOSSÁRIO DO CENTRO DE ESTUDOS (auditoria de 30/10/2026, M8): o mesmo lugar tinha quatro nomes (Centro de Estudos,
   Learning Center, plantão de dúvidas, tutoria). Fica UM nome nos rótulos, Centro de Estudos, e estas três linhas
   aparecem na primeira abertura (uma vez por aparelho, chave fisk_glos_centro) para quem conhecia pelos outros. */
function fiskGlossarioCentro(onde) {
  try { if (localStorage.getItem('fisk_glos_centro') === '1') return null; } catch (e) {}
  if (!onde) return null;
  var box = document.createElement('div');
  box.className = 'fk-glossario';
  box.style.cssText = 'margin:.8rem auto;max-width:860px;padding:.7rem 1rem;border-radius:12px;border:1.5px solid #cddcf5;background:#eef4ff;color:#1f2d57;font-size:.9rem;line-height:1.5;position:relative';
  box.innerHTML = '<b>Centro de Estudos = Learning Center = plantão de dúvidas.</b><br>' +
    'É o mesmo lugar: o horário em que o aluno vem tirar dúvidas com um monitor, fora da aula.<br>' +
    'A Frequência mostra quem veio; os Horários, o quadro; a Minha aula atende quem chega.' +
    '<button type="button" aria-label="Entendi" style="position:absolute;top:.3rem;right:.4rem;border:0;background:none;font-size:1rem;cursor:pointer;color:inherit;min-width:44px;min-height:44px">✕</button>';
  box.querySelector('button').addEventListener('click', function () { box.remove(); try { localStorage.setItem('fisk_glos_centro', '1'); } catch (e) {} });
  if (document.body.classList.contains('theme-dark')) { box.style.background = '#16233a'; box.style.borderColor = '#2e4560'; box.style.color = '#dbe6f3'; }
  onde.insertBefore(box, onde.firstChild);
  return box;
}
function fiskIdDaFerramenta(nome) {
  for (var k in FISK_FERRAMENTAS) if (FISK_FERRAMENTAS[k] === nome) return k;
  return String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function fiskRegistrarUso(ferramenta, id) {
  try {
    var s = fiskSessao();
    if (!s || !s.token || !ferramenta) return;
    fetch(FISK_HUB_EP, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'usoFerramenta', token: s.token, ferramenta: ferramenta, id: id || fiskIdDaFerramenta(ferramenta) })
    }).catch(function () {});
    fiskPulso(ferramenta);
  } catch (e) {}
}

/* ============================================================================
   E-COUNSELING — a linha que a ferramenta escreve sozinha (20/09/2026)

   O documento de counseling do aluno vive na pasta dele no Drive, e até aqui
   o professor copiava à mão o que o sistema já sabia: as notas do simulado, o
   termo enviado, a nota lançada. No documento do Nicolas dava para ver três
   simulados do MET digitados um a um.

   Daqui em diante quem escreve é a própria ferramenta, logo depois de fazer o
   que já fazia. Três regras:

   1. É SILENCIOSO E NÃO ATRAPALHA. O termo já foi gerado e registrado no card
      quando esta chamada sai; se ela falhar, o professor não perde nada e não
      leva um susto por causa de um registro secundário. Quem quiser mostrar o
      resultado passa um `aoTerminar`.
   2. A FORMA DO TEXTO É DO SERVIDOR. Aqui só viajam os campos crus
      (`origem` + `campos`); quem monta a linha é o Counseling.js. São cinco
      ferramentas escrevendo no mesmo documento, e cinco formatos diferentes
      seriam cinco dialetos no documento do aluno.
   3. NÃO DUPLICA. O servidor recusa linha idêntica, então clicar duas vezes,
      ou gerar o mesmo termo de novo, não repete o registro.
   ============================================================================ */
function fiskCounseling(opts) {
  try {
    var s = fiskSessao();
    if (!s || !s.token) return Promise.resolve(null);
    if (!opts || !opts.aluno || !opts.escola) return Promise.resolve(null);
    return fiskComPastaConfirmada(function (mais) {
        var corpo = {
          action: 'counselingEscrever', token: s.token,
          escola: opts.escola, professor: opts.professor || '',
          turma: String(opts.turma || '').split('\n')[0],
          aluno: opts.aluno, origem: opts.origem || 'manual', campos: opts.campos || {}
        };
        Object.keys(mais).forEach(function (k) { corpo[k] = mais[k]; });
        return fiskFetch(FISK_HUB_EP, corpo);
      }, 'Registrar mesmo assim no counseling dessa pasta?')
      .catch(function (e) { return (e && e.code === 'pasta_recusada') ? { ok: false, code: 'pasta_recusada', erro: e.message } : null; })
      .then(function (j) { if (typeof opts.aoTerminar === 'function') opts.aoTerminar(j); return j; })
      .catch(function () { return null; });
  } catch (e) { return Promise.resolve(null); }
}

function fiskPulso(ferramenta) {
  if (window.__fiskPulso) return;          // uma página, um pulso
  window.__fiskPulso = true;
  var ultimoToque = Date.now();
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function () { ultimoToque = Date.now(); }, { passive: true });
  });
  fiskPollVisivel(function () {
    try {
      if (Date.now() - ultimoToque > FISK_PULSO_OCIO * 60000) return;
      var s = fiskSessao();
      if (!s || !s.token) return;
      return fetch(FISK_HUB_EP, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'usoPulso', token: s.token, ferramenta: ferramenta || '' })
      });
    } catch (e) {}
  }, FISK_PULSO_MIN * 60000);
}

/**
 * Aviso de pasta fora do lugar, mostrado ao lado do botão que salvou.
 * NÃO usa alert de propósito: o salvamento deu certo, e um pop-up depois do
 * sucesso treina o professor a fechar sem ler. Fica visível na página, some
 * sozinho na próxima tentativa e serve a todas as ferramentas, porque todas
 * salvam por aqui.
 */
function fiskAvisoDePasta(buttonEl, texto) {
  try {
    var id = 'fisk-aviso-pasta';
    var box = document.getElementById(id);
    if (!box) {
      box = document.createElement('div');
      box.id = id;
      box.style.cssText = 'margin-top:.6rem;padding:.6rem .75rem;border-radius:8px;' +
        'border:1px solid #e3c07a;background:#fdf6e6;color:#7a5a12;' +
        'font-size:12.5px;line-height:1.45;font-weight:600;max-width:52ch';
      (buttonEl.parentNode || document.body).insertBefore(box, buttonEl.nextSibling);
    }
    box.textContent = '⚠️ ' + texto;
    box.hidden = false;
  } catch (e) { /* aviso nunca pode derrubar o salvamento */ }
}


/* ============================================================================
   CAMPANHAS DA DIREÇÃO (equipe)

   A direção cria a pergunta no painel dela e ela aparece aqui — sem publicar
   código. Mesmo desenho do pop-up do Portal do Aluno: um botão discreto no
   canto e o card só quando o professor clica. Card fixo empurraria a
   ferramenta para baixo todo dia, e a pergunta é de um minuto.

   O voto vai autenticado pelo token da sessão do Hub. Não há bônus em F$ do
   lado da equipe: carteira é coisa de aluno.
   ============================================================================ */
var FISK_CAMP_CACHE_MS = 30 * 60 * 1000;

function fiskCampanha() {
  var s = fiskSessao();
  if (!s || !s.token || s.viewingAs) return;      // visita da direção não responde pela equipe

  var cache = null;
  try { cache = JSON.parse(localStorage.getItem('fisk_camps_equipe') || 'null'); } catch (e) {}
  if (cache && Date.now() - cache.t < FISK_CAMP_CACHE_MS) return montar(cache.v || []);

  fetch(FISK_HUB_EP, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'campAtivas', publico: 'equipe' })
  }).then(fiskJson).then(function (j) {
    var lista = (j && j.ok && j.campanhas) ? j.campanhas : [];
    try { localStorage.setItem('fisk_camps_equipe', JSON.stringify({ t: Date.now(), v: lista })); } catch (e) {}
    montar(lista);
  }).catch(function () {});

  function jaRespondeu(c) {
    try { return !!localStorage.getItem('fisk_camp_' + c.id); } catch (e) { return false; }
  }

  function montar(lista) {
    if (!lista.length) return;
    /* mais de uma no ar: a que fecha primeiro, para não perder o prazo */
    var ordenada = lista.slice().sort(function (a, b) {
      return String(a.ate || '9999').localeCompare(String(b.ate || '9999'));
    });
    var c = ordenada.filter(function (x) { return !jaRespondeu(x); })[0] || ordenada[0];

    var estilo = document.createElement('style');
    estilo.textContent =
      '.fk-camp-fab{position:fixed;right:1rem;bottom:1rem;z-index:9990;border:none;border-radius:999px;' +
      'background:#0EA5A0;color:#fff;font:inherit;font-weight:800;font-size:.88rem;padding:.65rem 1.1rem;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer}' +
      '.fk-camp-modal{position:fixed;inset:0;z-index:9991;background:rgba(15,12,12,.6);display:flex;' +
      'align-items:center;justify-content:center;padding:1rem}' +
      '.fk-camp-card{position:relative;background:var(--surface,#fff);color:var(--text,#161414);' +
      'border-radius:16px;border-left:5px solid #0EA5A0;padding:1.2rem 1.3rem;max-width:32rem;width:100%;' +
      'box-shadow:0 16px 44px rgba(0,0,0,.32);max-height:85vh;overflow:auto}' +
      '.fk-camp-card h3{font-size:1.05rem;line-height:1.3;margin:0 0 .3rem}' +
      '.fk-camp-card .d{font-size:.88rem;color:var(--text-soft,#6f6a6a);line-height:1.5}' +
      '.fk-camp-opts{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.9rem}' +
      '.fk-camp-opt{border:2px solid var(--border,#ececec);background:var(--surface-2,#f7f6f6);color:inherit;' +
      'border-radius:999px;padding:.5rem .9rem;font:inherit;font-size:.88rem;font-weight:700;cursor:pointer}' +
      '.fk-camp-opt.on{border-color:#0EA5A0;background:rgba(14,165,160,.14)}' +
      '.fk-camp-txt{width:100%;margin-top:.7rem;border:2px solid var(--border,#ececec);border-radius:12px;' +
      'padding:.6rem .8rem;font:inherit;font-size:.9rem;background:var(--surface-2,#f7f6f6);color:inherit}' +
      '.fk-camp-foot{display:flex;justify-content:space-between;align-items:center;gap:.8rem;margin-top:.9rem}' +
      '.fk-camp-ok{background:#0EA5A0;color:#fff;border:none;border-radius:12px;padding:.6rem 1.4rem;' +
      'font:inherit;font-weight:800;cursor:pointer}.fk-camp-ok:disabled{opacity:.45;cursor:not-allowed}' +
      '.fk-camp-x{position:absolute;top:.5rem;right:.7rem;background:none;border:none;font-size:1rem;' +
      'color:var(--text-soft,#6f6a6a);cursor:pointer}';
    document.head.appendChild(estilo);

    var fab = document.createElement('button');
    fab.className = 'fk-camp-fab';
    fab.textContent = jaRespondeu(c) ? '📣 Resposta enviada' : '📣 ' + (c.titulo.length > 34 ? 'Responder à direção' : c.titulo);
    document.body.appendChild(fab);

    var modal = document.createElement('div');
    modal.className = 'fk-camp-modal';
    modal.hidden = true;
    modal.innerHTML = '<div class="fk-camp-card"><button class="fk-camp-x" aria-label="Fechar">✕</button><div class="fk-camp-corpo"></div></div>';
    document.body.appendChild(modal);
    var corpo = modal.querySelector('.fk-camp-corpo');

    function fechar() { modal.hidden = true; }
    fab.addEventListener('click', function () { modal.hidden = false; desenhar(); });
    modal.querySelector('.fk-camp-x').addEventListener('click', fechar);
    modal.addEventListener('click', function (e) { if (e.target === modal) fechar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });

    var sel = [];
    function desenhar() {
      corpo.innerHTML = '';
      if (jaRespondeu(c)) {
        corpo.innerHTML = '<h3>' + fiskEsc(c.titulo) + '</h3>' +
          '<p class="d" style="margin-top:.5rem">✅ Sua resposta foi registrada. Obrigado!</p>';
        var trocar = document.createElement('button');
        trocar.className = 'fk-camp-opt'; trocar.style.marginTop = '.8rem';
        trocar.textContent = 'Mudar minha resposta';
        trocar.addEventListener('click', function () {
          try { localStorage.removeItem('fisk_camp_' + c.id); } catch (e) {}
          sel = []; desenhar();
        });
        corpo.appendChild(trocar);
        return;
      }
      corpo.innerHTML = '<h3>' + fiskEsc(c.titulo) + '</h3>' +
        (c.texto ? '<div class="d">' + fiskEsc(c.texto) + '</div>' : '');
      var opts = document.createElement('div');
      opts.className = 'fk-camp-opts';
      (c.opcoes || []).forEach(function (o) {
        var b = document.createElement('button');
        b.className = 'fk-camp-opt'; b.type = 'button';
        b.textContent = (o.ic ? o.ic + ' ' : '') + o.t;
        b.addEventListener('click', function () {
          var i = sel.indexOf(o.id);
          if (i >= 0) sel.splice(i, 1);
          else if (sel.length < (c.max || 1)) sel.push(o.id);
          else if ((c.max || 1) === 1) sel = [o.id];      // escolha única troca em vez de travar
          else return;
          pintar();
        });
        opts.appendChild(b);
      });
      corpo.appendChild(opts);
      var txt = null;
      if (c.outro !== false) {
        txt = document.createElement('input');
        txt.className = 'fk-camp-txt'; txt.type = 'text'; txt.maxLength = 300;
        txt.placeholder = 'Quer escrever algo? (opcional)';
        txt.addEventListener('input', pintar);
        corpo.appendChild(txt);
      }
      var foot = document.createElement('div');
      foot.className = 'fk-camp-foot';
      var conta = document.createElement('span');
      conta.className = 'd';
      var ok = document.createElement('button');
      ok.className = 'fk-camp-ok'; ok.type = 'button'; ok.textContent = 'Enviar';
      foot.append(conta, ok); corpo.appendChild(foot);

      function pintar() {
        [].forEach.call(opts.children, function (b, i) {
          b.classList.toggle('on', sel.indexOf((c.opcoes[i] || {}).id) >= 0);
        });
        conta.textContent = (c.opcoes || []).length ? sel.length + '/' + (c.max || 1) : '';
        ok.disabled = !sel.length && !(txt && txt.value.trim());
      }
      pintar();

      ok.addEventListener('click', function () {
        ok.disabled = true; conta.textContent = 'enviando…';
        fetch(FISK_HUB_EP, {
          method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'campVotar', token: s.token, campanha: c.id,
                                 opcoes: sel, outro: (txt && txt.value.trim()) || '' })
        }).then(fiskJson).then(function (j) {
          if (!j || !j.ok) { ok.disabled = false; conta.textContent = (j && j.error) || 'não deu para enviar'; return; }
          try { localStorage.setItem('fisk_camp_' + c.id, '1'); } catch (e) {}
          fab.textContent = '📣 Resposta enviada';
          desenhar();
        }).catch(function () { ok.disabled = false; conta.textContent = 'erro de conexão'; });
      });
    }
  }
}

/* ⚠️ MEXEU NESTE ARQUIVO? SUBA O `?v=` NAS PÁGINAS.
   Todas as páginas do Hub carregam o kit com `?v=AAAA-MM-DD`. Sem subir esse
   carimbo, o navegador do professor continua servindo a versão em cache e a
   função nova simplesmente não existe lá — sem erro visível, porque quem
   chama testa `typeof` antes. Já aconteceu com o CSS em 03/08/2026:
   regra nova, campo sem formatação, e meia hora procurando no lugar errado.
     grep -l 'fisk-shared.js?v=' *.html   → todas devem ter a MESMA data. */

/* ═══════════════════════════════════════════════════════════════════════════
   PONTE NOME → RAF (+ atividade no portal)
   ═══════════════════════════════════════════════════════════════════════════
 * O card NÃO conhece RAF: ele guarda nome, atraso, faltas e notas. Quem tem
 * a correspondência é a matrícula do backend. Sem essa ponte, nenhuma
 * ferramenta que lista alunos consegue mandar o professor para o Acompanhamento do Aluno —
 * que era exatamente o caso do Planejador, do Termo e do 2nd Chance: três
 * telas cheias de nomes e nenhuma saída.
 *
 * Fica AQUI, no kit, e não copiada em cada ferramenta: são três consumidores
 * com a mesma necessidade, e três cópias divergem — a primeira que alguém
 * corrigir deixa as outras duas para trás.
 *
 * De brinde vem a ATIVIDADE de cada aluno (última atividade concluída e
 * quantas nos últimos 7 dias), que é o mesmo `acessosProf` já usado pela
 * Visão Geral. Uma chamada serve às duas coisas.
 */
var _fiskAlunos = null;          // promessa, para várias chamadas não repetirem o pedido

function fiskChaveAluno(nome) {
  return String(nome || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ').trim();
}

/**
 * Carrega os alunos do professor logado (ou do escolhido no "ver como
 * professor") e devolve um índice por nome normalizado.
 * Falha de rede devolve índice VAZIO em vez de estourar: o nome fica em
 * texto puro e a ferramenta continua funcionando — a ponte é um bônus, não
 * um requisito para gerar documento.
 */
function fiskAlunosDoProf() {
  if (_fiskAlunos) return _fiskAlunos;
  var s = fiskSessao();
  if (!s || !s.token) return (_fiskAlunos = Promise.resolve({}));
  var prof = '';
  try { prof = (JSON.parse(localStorage.getItem('fisk_actas') || 'null') || {}).name || ''; } catch (e) {}
  _fiskAlunos = fetch(FISK_HUB_EP, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'acessosProf', token: s.token, prof: prof })
  }).then(fiskJson).then(function (res) {
    var idx = {};
    if (res && res.ok) {
      (res.acessos || []).forEach(function (a) {
        if (a && a.name && a.raf) idx[fiskChaveAluno(a.name)] = a;
      });
    }
    return idx;
  }).catch(function () { return {}; });
  return _fiskAlunos;
}

/** URL do Acompanhamento de um aluno, ou '' se ainda não sabemos o RAF dele. */
function fiskLinkDossie(idx, nome) {
  var a = idx && idx[fiskChaveAluno(nome)];
  return a ? (fiskHubBase() + 'aluno.html?raf=' + encodeURIComponent(a.raf)) : '';
}

/** Rótulo curto do estudo em casa, para as telas que listam alunos. */
function fiskEstudoEmCasa(idx, nome) {
  var a = idx && idx[fiskChaveAluno(nome)];
  if (!a) return null;
  var ua = a.ultimaAtividade || null;
  var dias = ua ? Math.floor((Date.now() - ua) / 86400000) : null;
  return {
    raf: a.raf,
    fez: !!a.totalAtividades,
    entrou: !!a.last,
    dias: dias,
    naSemana: a.atividade7d || 0,
    /* 'sumido' é o caso que interessa ao professor: o aluno que está
       atrasado E não faz nada em casa. Quem está atrasado mas estudando
       precisa de tempo, não de cobrança — são situações diferentes. */
    estado: !a.totalAtividades ? (a.last ? 'nada' : 'nunca')
          : (dias != null && dias <= 7 ? 'ativo' : 'sumido')
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAINEL LATERAL DO ACOMPANHAMENTO DO ALUNO
   ═══════════════════════════════════════════════════════════════════════════
 * POR QUE (04/08/2026, pedido do Pedro): o professor está olhando a turma
 * inteira, clica num aluno e PERDE a lista — a página do acompanhamento
 * substitui a que ele estava lendo, e voltar significa recarregar tudo. Como
 * o uso real é comparar vários alunos em sequência, isso cobra o preço da
 * navegação a cada nome. Agora o acompanhamento abre numa gaveta à direita e
 * a lista continua ali, atrás.
 *
 * POR QUE UM IFRAME, e não a tela redesenhada dentro de cada página: o
 * conteúdo do acompanhamento tem ~400 linhas de renderização (atividades,
 * tentativas, tópicos, notas, KPIs). Reescrevê-lo como componente para cinco
 * páginas criaria a quinta cópia de uma tela que muda toda semana. Com o
 * iframe existe UMA implementação — a própria `aluno.html`, no modo
 * `embed=1` —, e ela continua servindo de página cheia para quem chega por
 * link. Mesma origem, então a sessão do localStorage vale lá dentro sem
 * precisar passar token pela URL.
 *
 * O QUE ISTO CUSTA: uma carga de página por aluno aberto. É aceitável porque
 * o backend do acompanhamento já não tem cache de propósito (o caso de uso é
 * "ele acabou de fazer?"), então a consulta aconteceria de qualquer jeito.
 */
/* A MECÂNICA DA GAVETA, sem saber o que vai dentro (20/09/2026).
 * Nasceu no Acompanhamento e foi extraída quando o E-counseling passou a
 * abrir do mesmo jeito: o fundo, o painel que desliza, o Esc, o clique fora e
 * o "zerar o src ao fechar" são os mesmos nos dois, e mantê-los em duas
 * cópias garantiria que um dia só um deles ganhasse a próxima correção. */
function fiskGaveta_(cfg) {
  var g = document.getElementById(cfg.id);
  if (!g) {
    g = document.createElement('div');
    g.id = cfg.id;
    g.className = 'fk-gaveta';
    g.innerHTML =
      '<div class="fk-acomp-fundo"></div>' +
      '<aside class="fk-acomp-painel" role="dialog" aria-label="' + cfg.rotulo + '">' +
        '<div class="fk-acomp-topo">' +
          '<b class="fk-gaveta-nome">' + cfg.rotulo + '</b>' +
          '<span style="flex:1"></span>' +
          '<a class="fk-acomp-abrir fk-gaveta-full" target="_blank" rel="noopener" ' +
             'title="Abrir em página inteira">⤢</a>' +
          '<button type="button" class="fk-acomp-x" aria-label="Fechar">✕</button>' +
        '</div>' +
        '<iframe class="fk-gaveta-frame" title="' + cfg.rotulo + '"></iframe>' +
      '</aside>';
    document.body.appendChild(g);
    var fecha = function () {
      g.classList.remove('on');
      document.body.classList.remove('fk-acomp-aberto');
      /* zera o src ao fechar: sem isso o próximo aluno aparece por um instante
         com os dados do anterior, que é o erro que mais confunde numa tela de
         conferência. */
      setTimeout(function () {
        if (!g.classList.contains('on')) g.querySelector('.fk-gaveta-frame').src = 'about:blank';
      }, 250);
    };
    g.querySelector('.fk-acomp-fundo').addEventListener('click', fecha);
    g.querySelector('.fk-acomp-x').addEventListener('click', fecha);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && g.classList.contains('on')) fecha();
    });
  }
  g.querySelector('.fk-gaveta-frame').src = cfg.url;
  g.querySelector('.fk-gaveta-full').href = cfg.urlCheia || cfg.url;
  g.querySelector('.fk-gaveta-nome').textContent = cfg.titulo || cfg.rotulo;
  g.classList.add('on');
  document.body.classList.add('fk-acomp-aberto');
  return g;
}

/* ═══════════════════════════════════════════════════════════════════════════
   O E-COUNSELING ONDE O PROFESSOR JÁ ESTÁ (Pedro, 20/09/2026)
   ═══════════════════════════════════════════════════════════════════════════
 * Uma tela dedicada de counseling é quase o mesmo esforço que abrir o Doc no
 * Drive: nos dois casos o professor larga o que estava fazendo, procura o
 * aluno de novo e volta. O valor está em registrar DE ONDE ELE JÁ ESTÁ — da
 * Minha aula, do Planejador, da lista da turma.
 *
 * É a mesma `counseling.html`, em `embed=1`: uma implementação só, que
 * continua servindo de página cheia para quem chega por link. Mesma origem,
 * então a sessão do localStorage vale lá dentro sem token na URL.
 *
 * ctx: { escola, professor, turma, aluno }
 */
/* ══ DOCUMENTOS EM LOTE (27/10/2026, pedido do Pedro: "que dentro de cada página da ferramenta ele pudesse ter a
 * opção de criar em lote") ══════════════════════════════════════════════════════════════════════════════════════
 * O motor é um só e mora aqui; cada ferramenta (Termo de atraso, 2nd Chance) diz só COMO gerar o PDF de um aluno e
 * COMO salvá-lo. A lista nasce com os sinalizados já marcados, o lote anda um aluno por vez (o Apps Script tem trava
 * e fila; dez alunos em paralelo virariam erro) e cada aluno ganha a linha de resultado dele: um erro não para o resto.
 * No fim, um PDF só com todos, para imprimir de uma vez.
 *   cfg = { alunos: [{ id, nome, detalhe, marcado }], doc: 'termo' (o nome no botão), plural: 'termos',
 *           gerar: async function (id) -> { bytes, filename },
 *           salvar: async function (id, pdf) -> { linhas: ['📁 …', '📇 …'], falhou: bool },
 *           arquivoJunto: 'termos.pdf', antes: function () -> texto de erro ou '' (validação da tela) } */
function fiskLote(caixa, cfg) {
  if (!caixa || !cfg) return;
  var e = fiskEsc, rodando = false, gerados = [];
  caixa.innerHTML =
    '<div class="fl-barra"><b class="fl-n"></b><span class="fl-sp"></span>' +
    '<button type="button" class="fl-mini" data-fl="todos">Marcar todos</button><button type="button" class="fl-mini" data-fl="nenhum">Desmarcar</button></div>' +
    '<div class="fl-lista">' + cfg.alunos.map(function (a, i) {
      return '<label class="fl-al"><input type="checkbox" data-i="' + i + '"' + (a.marcado ? ' checked' : '') + '>' +
        '<span class="fl-nm">' + e(a.nome) + '</span><span class="fl-det">' + e(a.detalhe || '') + '</span><span class="fl-res" id="flr' + i + '"></span></label>';
    }).join('') + '</div>' +
    '<div class="fl-acoes"><button type="button" class="btn-generate fl-ir"></button><button type="button" class="btn-sec fl-junto" hidden>⬇ Baixar todos num PDF só (para imprimir)</button></div>' +
    '<p class="fl-st"></p>';
  if (!document.getElementById('fl-css')) {
    var st = document.createElement('style'); st.id = 'fl-css';
    st.textContent = '.fl-barra{display:flex;align-items:center;gap:.5rem;margin:.2rem 0 .5rem}.fl-sp{flex:1}' +
      '.fl-mini{font:inherit;font-size:.78rem;font-weight:700;border:1px solid var(--blue-bd,#9db6cb);background:var(--white,#fff);color:inherit;border-radius:99px;padding:.25rem .7rem;cursor:pointer}' +
      '.fl-lista{border:1px solid var(--surface-border-color,#dfe6ef);border-radius:12px;overflow:hidden}' +
      '.fl-al{display:flex;align-items:center;gap:.6rem;padding:.6rem .8rem;border-bottom:1px solid var(--surface-border-color,#dfe6ef);cursor:pointer;flex-wrap:wrap}' +
      '.fl-al:last-child{border-bottom:0}.fl-al input{width:18px;height:18px;flex:none}.fl-nm{font-weight:700}' +
      '.fl-det{font-size:.8rem;color:var(--gray)}.fl-res{margin-left:auto;font-size:.8rem;font-weight:700}' +
      '.fl-res.ok{color:#1e8f4e}.fl-res.err{color:#b8860b}.fl-res.vai{color:var(--gray)}' +
      '.fl-acoes{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.8rem}.fl-st{font-size:.86rem;font-weight:700;margin:.5rem 0 0}' +
      '@media (max-width:560px){.fl-res{margin-left:1.6rem;width:100%}}';
    document.head.appendChild(st);
  }
  var ir = caixa.querySelector('.fl-ir'), junto = caixa.querySelector('.fl-junto'), stx = caixa.querySelector('.fl-st');
  function marcados() { return Array.prototype.filter.call(caixa.querySelectorAll('.fl-lista input'), function (c) { return c.checked; }).map(function (c) { return +c.dataset.i; }); }
  function conta() {
    var n = marcados().length;
    caixa.querySelector('.fl-n').textContent = n + ' de ' + cfg.alunos.length + ' marcados';
    ir.textContent = '📦 Gerar ' + n + ' ' + (n === 1 ? cfg.doc : cfg.plural) + ' e salvar';
    ir.disabled = rodando || !n;
  }
  caixa.addEventListener('change', conta);
  caixa.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-fl]'); if (!b || rodando) return;
    caixa.querySelectorAll('.fl-lista input').forEach(function (c) { c.checked = b.dataset.fl === 'todos'; }); conta();
  });
  ir.addEventListener('click', async function () {
    var lista = marcados(); if (!lista.length || rodando) return;
    var erro = cfg.antes ? cfg.antes() : ''; if (erro) { alert(erro); return; }
    if (!confirm('Gerar ' + lista.length + ' ' + (lista.length === 1 ? cfg.doc : cfg.plural) + ' e salvar cada um na pasta do aluno, no card e no E-counseling?')) return;
    rodando = true; gerados = []; junto.hidden = true; conta();
    caixa.querySelectorAll('.fl-lista input').forEach(function (c) { c.disabled = true; });
    var ok = 0, comAviso = 0;
    for (var k = 0; k < lista.length; k++) {
      var i = lista[k], a = cfg.alunos[i], res = document.getElementById('flr' + i);
      stx.textContent = '⏳ ' + (k + 1) + ' de ' + lista.length + ': ' + a.nome;
      res.className = 'fl-res vai'; res.textContent = '⏳ gerando…';
      try {
        var pdf = await cfg.gerar(a.id);
        gerados.push(pdf);
        res.textContent = '⏳ salvando…';
        var r = await cfg.salvar(a.id, pdf);
        res.className = 'fl-res ' + (r && r.falhou ? 'err' : 'ok');
        res.textContent = (r && r.linhas || ['✓']).join('  ·  ');
        if (r && r.falhou) comAviso++; else ok++;
      } catch (err) {
        res.className = 'fl-res err'; res.textContent = '⚠️ ' + ((err && err.message) || 'não gerou'); comAviso++;
      }
    }
    rodando = false;
    caixa.querySelectorAll('.fl-lista input').forEach(function (c) { c.disabled = false; });
    if (ok && !comAviso) fiskFesta('📚', ok < 3);   /* lote inteiro sem aviso: o avatar comemora (grande a partir de 3 alunos) */
    stx.textContent = '✓ Pronto: ' + ok + ' completo' + (ok === 1 ? '' : 's') + (comAviso ? ', ' + comAviso + ' com aviso (veja a linha do aluno)' : '') + '.';
    junto.hidden = !gerados.length; conta();
  });
  junto.addEventListener('click', async function () {
    if (!gerados.length || typeof PDFLib === 'undefined') return;
    var doc = await PDFLib.PDFDocument.create();
    for (var i = 0; i < gerados.length; i++) {
      var src = await PDFLib.PDFDocument.load(gerados[i].bytes);
      (await doc.copyPages(src, src.getPageIndices())).forEach(function (pg) { doc.addPage(pg); });
    }
    var url = URL.createObjectURL(new Blob([await doc.save()], { type: 'application/pdf' }));
    var l = document.createElement('a'); l.href = url; l.download = cfg.arquivoJunto || 'documentos.pdf'; document.body.appendChild(l); l.click();
    setTimeout(function () { URL.revokeObjectURL(url); l.remove(); }, 2000);
  });
  conta();
}

/* O DOCUMENTO DO COUNSELING DIRETO NO DOCS (Pedro, 26/10/2026, sobre a Minha semana: "que esse fosse o próprio botão
 * do counseling, sem passar pela ferramenta dentro do portal e sem passar pela pasta do aluno"). A aba nova abre NO
 * TOQUE (aberta depois da resposta, o navegador a bloquearia como pop-up) com "Abrindo…", e vai para o Google Docs
 * quando o servidor devolve o endereço (counselingLer, que acha a pasta do aluno e o documento dentro dela). Aluno
 * ainda sem documento, ou pasta não achada: a mesma aba cai na ferramenta do counseling, que sabe criar e explicar. */
function fiskCounselingAbrirDoc(ctx) {
  if (!ctx || !ctx.aluno) return;
  var s = fiskSessao() || {};
  var turma = String(ctx.turma || '').split('\n')[0];
  var ferramenta = fiskHubBase() + 'counseling.html?escola=' + encodeURIComponent(ctx.escola || '') + '&prof=' + encodeURIComponent(ctx.professor || '') +
    '&turma=' + encodeURIComponent(turma) + '&aluno=' + encodeURIComponent(ctx.aluno) + (ctx.estagio ? '&estagio=' + encodeURIComponent(ctx.estagio) : '');
  var w = window.open('', '_blank');
  if (!w) { location.href = ferramenta; return; }   /* pop-up bloqueado: abre na própria aba */
  try {
    w.document.write('<!doctype html><meta charset="utf-8"><title>E-counseling</title><body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;margin:0;color:#223e5a;background:#f4f6fb">' +
      '<p style="font-size:1.05rem;text-align:center;padding:16px">💬 Abrindo o counseling de <b>' + fiskEsc(ctx.aluno) + '</b>…<br><small style="color:#6b7a8c">procurando o documento na pasta do aluno</small></p></body>');
    w.document.close();
  } catch (e) {}
  fiskComPastaConfirmada(function (mais) {
      var corpo = { action: 'counselingLer', token: s.token || '', escola: ctx.escola || '', professor: ctx.professor || '', turma: turma, aluno: ctx.aluno };
      Object.keys(mais).forEach(function (k) { corpo[k] = mais[k]; });
      return fiskFetch(FISK_HUB_EP, corpo);
    }, 'Abrir mesmo assim o documento dessa pasta?')
    .then(function (j) { w.location.href = (j && j.ok && j.docUrl) ? j.docUrl : ferramenta; })
    .catch(function () { w.location.href = ferramenta; });
}

function fiskCounselingGaveta(ctx) {
  if (!ctx || !ctx.aluno) return;
  var q = 'embed=1' +
    '&escola=' + encodeURIComponent(ctx.escola || '') +
    '&prof=' + encodeURIComponent(ctx.professor || '') +
    '&turma=' + encodeURIComponent(String(ctx.turma || '').split('\n')[0]) +
    '&aluno=' + encodeURIComponent(ctx.aluno) +
    (ctx.estagio ? '&estagio=' + encodeURIComponent(ctx.estagio) : '') +
    (ctx.texto ? '&texto=' + encodeURIComponent(ctx.texto) : '');
  var base = fiskHubBase() + 'counseling.html?';
  return fiskGaveta_({
    id: 'fiskCounselingGaveta', rotulo: 'E-counseling',
    titulo: '💬 ' + ctx.aluno,
    url: base + q,
    urlCheia: base + q.replace('embed=1&', '')
  });
}

/* A BUSCA QUE ABRE O COUNSELING, de qualquer tela do Hub (20/09/2026).
 *
 * Um campo, os alunos do professor logado e um clique. A lista vem do
 * `fiskAlunosDoProf`, que a própria página já costuma ter carregado para a
 * ponte nome→RAF, então digitar não custa ida à rede.
 *
 * ⚠️ A UNIDADE NÃO VIAJA daqui: a lista de acessos traz nome, turma e livro,
 * mas não a escola. Quem resolve isso é o servidor, que procura nas duas e
 * recusa quando o nome aparece nas duas (homônimo em unidades diferentes
 * existe, e escrever no documento errado é pior do que pedir a escola).
 */
function fiskCounselingBusca() {
  var cx = document.getElementById('fiskCslBusca');
  if (!cx) {
    cx = document.createElement('div');
    cx.id = 'fiskCslBusca';
    cx.className = 'fk-busca';
    cx.innerHTML =
      '<div class="fk-busca-fundo"></div>' +
      '<div class="fk-busca-cx" role="dialog" aria-label="Abrir o E-counseling de um aluno">' +
        '<label for="fkCslQ">💬 E-counseling · qual aluno?</label>' +
        '<input id="fkCslQ" type="search" autocomplete="off" placeholder="Nome ou RAF do aluno…">' +
        '<div class="fk-busca-lista" id="fkCslLista"></div>' +
      '</div>';
    document.body.appendChild(cx);
    var fechaB = function () { cx.classList.remove('on'); };
    cx.querySelector('.fk-busca-fundo').addEventListener('click', fechaB);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cx.classList.contains('on')) fechaB();
    });
    var campo = cx.querySelector('#fkCslQ'), lista = cx.querySelector('#fkCslLista'), t = null;
    campo.addEventListener('input', function () {
      clearTimeout(t);
      var q = campo.value.trim();
      if (q.length < 2) { lista.innerHTML = ''; return; }
      lista.innerHTML = '<p class="fk-busca-vazio">procurando…</p>';
      t = setTimeout(function () {
        fiskBuscaMeusAlunos(q).then(function (achados) {
          if (!achados.length) {
            lista.innerHTML = '<p class="fk-busca-vazio">Nenhum aluno seu com esse nome. ' +
              'Pela turma, use a Minha aula ou a Visão Geral.</p>';
            return;
          }
          lista.innerHTML = achados.map(function (a) {
            return '<button type="button" class="fk-busca-item" data-nome="' + fiskEsc(a.name) +
              '" data-turma="' + fiskEsc(a.turma || '') + '" data-book="' + fiskEsc(a.book || '') + '">' +
              '<b>' + fiskEsc(a.name) + '</b><span>' + fiskEsc(a.turma || '') +
              (a.book ? ' · ' + fiskEsc(a.book) : '') + '</span></button>';
          }).join('');
        });
      }, 180);
    });
    lista.addEventListener('click', function (ev) {
      var b = ev.target.closest('.fk-busca-item');
      if (!b) return;
      fechaB();
      fiskCounselingGaveta({ escola: '', professor: '', turma: b.dataset.turma,
                             aluno: b.dataset.nome, estagio: b.dataset.book });
    });
  }
  cx.classList.add('on');
  var inp = cx.querySelector('#fkCslQ');
  inp.value = ''; cx.querySelector('#fkCslLista').innerHTML = '';
  setTimeout(function () { inp.focus(); }, 30);
}

function fiskAcompanhamento(raf, opts) {
  if (!raf) return;
  opts = opts || {};
  var url = fiskHubBase() + 'aluno.html?raf=' + encodeURIComponent(raf) + '&embed=1' +
            (opts.turma ? '&turma=' + encodeURIComponent(opts.turma) : '');
  return fiskGaveta_({
    id: 'fiskAcompGaveta', rotulo: 'Radar do Aluno',   /* o mesmo nome da página e do card (auditoria de 30/10/2026, M9) */
    titulo: opts.nome || 'Radar do Aluno',
    url: url, urlCheia: url.replace('&embed=1', '')
  });
}

/** Liga a gaveta a uma lista: todo clique em `seletor` dentro de `raiz` abre o
 *  painel em vez de navegar. Usa data-raf / data-nome / data-turma do próprio
 *  elemento. Devolve false quando não há RAF, para o link seguir seu caminho. */
function fiskLigarAcompanhamento(raiz, seletor) {
  (raiz || document).addEventListener('click', function (ev) {
    var el = ev.target.closest(seletor);
    if (!el) return;
    var raf = el.dataset.raf || (el.getAttribute('href') || '').split('raf=')[1];
    if (!raf) return;
    raf = decodeURIComponent(String(raf).split('&')[0]);
    /* ctrl/cmd/meio = o professor QUER outra aba; não sequestrar isso. */
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1) return;
    ev.preventDefault();
    fiskAcompanhamento(raf, { nome: el.dataset.nome || el.textContent.trim(), turma: el.dataset.turma || '' });
  });
}

/* Busca INSTANTÂNEA entre os alunos do professor logado.
 * A busca do servidor varre a escola inteira (regra do Pedro: substituição é
 * frequente), e isso é uma ida à rede a cada tecla. Mas em 9 de 10 consultas
 * o aluno é de uma turma DELE — e essa lista já está na memória, porque o
 * `acessosProf` foi carregado para a ponte nome→RAF. Então respondemos daqui
 * na hora e deixamos o servidor completar depois com o resto da escola.
 * Casa por trecho, sem acento e sem caixa, no nome ou no RAF. */
function fiskBuscaMeusAlunos(q) {
  var t = fiskChaveAluno(q);
  if (t.length < 2) return Promise.resolve([]);
  return fiskAlunosDoProf().then(function (idx) {
    var out = [];
    Object.keys(idx).forEach(function (k) {
      var a = idx[k];
      if (!a || !a.raf) return;
      if (k.indexOf(t) > -1 || String(a.raf).toUpperCase().indexOf(t) > -1) out.push(a);
    });
    out.sort(function (x, y) { return String(x.name||'').localeCompare(String(y.name||''), 'pt'); });
    return out.slice(0, 12);
  }).catch(function () { return []; });
}

/* ══ A CASA DO PROFESSOR VESTE O HUB ═══════════════════════════════════════
 * A Cerimônia de Seleção (campanha de 09/2026) dá uma casa de Hogwarts ao
 * professor, e a faixa preta do topo passa a usar as cores dela, igual ao que
 * acontece no Portal do Aluno. O desenho mora em `assets/casa-tema.css`.
 *
 * ⚠️ ISTO VIVE NO FISK-SHARED PORQUE SÃO DEZESSETE PÁGINAS. A casa é do
 * professor, não de uma tela: pendurar o bloco em cada HTML seria dezessete
 * lugares para esquecer um.
 *
 * ⚠️ A IDENTIDADE É `PROF:<nome>`, e não um RAF: professor não tem matrícula.
 * A chave do cache passa pela MESMA régua do Portal e do backend (letra e
 * número, maiúsculas), senão o Hub procuraria a casa numa chave que o quiz
 * nunca escreveu.
 *
 * ⚠️ O CACHE VEM PRIMEIRO E O SERVIDOR CONFIRMA. Quem respondeu neste
 * computador pinta a tela sem esperar rede; quem respondeu no celular e abriu
 * o Hub na escola descobre a casa numa chamada só, que fica guardada. Falha de
 * rede não faz nada aparecer nem desaparecer: sem casa, a faixa é a preta de
 * sempre.
 *
 * O interruptor é o botão na barra do professor, e ele guarda `hw_tema`, a
 * MESMA chave do Portal — quem desligou a pintura lá não a encontra ligada
 * aqui, e isso é o certo: é uma preferência da pessoa, não da página. */
(function () {
  var LS = 'hw_casa_', TEMA = 'hw_tema';
  var EP  = 'https://script.google.com/macros/s/AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1/exec';
  var KEY = 'fisk_0719bacbecc857f61d1e';   // pública por desenho: só autoriza gravar
  var CASAS = { g:'Gryffindor', r:'Ravenclaw', h:'Hufflepuff', s:'Slytherin' };

  function nomeDoProf() {
    try {
      var s = (typeof fiskSessao === 'function') ? fiskSessao() : null;
      return s && (s.name || s.nome) ? String(s.name || s.nome) : '';
    } catch (e) { return ''; }
  }
  function chave(nome) {
    return LS + ('PROF:' + nome).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
  function ligado() {
    try { return localStorage.getItem(TEMA) !== 'off'; } catch (e) { return true; }
  }
  function pinta(casa) {
    if (!CASAS[casa]) return;
    document.body.setAttribute('data-casa', casa);
    document.body.classList.toggle('hw-sem-casa', !ligado());
    interruptor(casa);
  }

  /* O interruptor mora no MENU DO PROFESSOR (o `fiskInitUserMenu`), ao lado
     do idioma e do "Sair desta conta", que é exatamente onde ele fica no
     Portal do Aluno. A barra fixa do canto não serve: ela é escondida para
     professor comum e só reaparece na visita da direção.
     ⚠️ O MENU NASCE DEPOIS DAQUI em várias páginas (cada uma chama o
     `fiskInitUserMenu` no seu próprio tempo), então isto espera por ele em vez
     de desistir na primeira tentativa. Dez tentativas, e para. */
  function interruptor(casa) {
    var tentativas = 0;
    var t = setInterval(function () {
      var menu = document.querySelector('.fisk-user-menu');
      if (!menu) { if (++tentativas > 10) clearInterval(t); return; }
      clearInterval(t);
      if (document.getElementById('hwTema')) return;
      var b = document.createElement('button');
      b.type = 'button'; b.id = 'hwTema'; b.className = 'fu-item hw-tema-item';
      function rotulo() {
        b.textContent = '🎨 ' + (ligado() ? 'Cores da minha casa' : 'Cores da casa desligadas');
        b.setAttribute('aria-pressed', ligado() ? 'true' : 'false');
      }
      rotulo();
      b.title = CASAS[casa];
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();          // o menu não fecha: quem clica quer VER a mudança
        try { localStorage.setItem(TEMA, ligado() ? 'off' : 'on'); } catch (e) {}
        document.body.classList.toggle('hw-sem-casa', !ligado());
        rotulo();
      });
      var sep = menu.querySelector('.fu-sep');
      if (sep) menu.insertBefore(b, sep); else menu.appendChild(b);
    }, 300);
  }

  function comeca() {
    var nome = nomeDoProf();
    if (!nome) return;                       // ninguém logado: nada a vestir
    var k = chave(nome), reg = null;
    try { reg = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) {}
    if (reg && CASAS[reg.casa]) { pinta(reg.casa); return; }

    /* POST, e não GET: as rotas das casas moram no `doPost` do Code.js. Pelo
       GET o servidor responde "chave inválida", que é a mensagem mais
       enganosa possível, porque a chave está certa. */
    fetch(EP, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'hwGet', key: KEY, raf: 'PROF:' + nome }) })
      .then(fiskJson)
      .then(function (j) {
        if (!j || !j.ok || !CASAS[j.casa]) return;
        try { localStorage.setItem(k, JSON.stringify({ casa: j.casa, em: j.em || null })); } catch (e) {}
        pinta(j.casa);
      })
      .catch(function () {});                // sem rede a faixa fica preta, e tudo bem
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', comeca);
  else comeca();
})();

/* ══ O BUDDY EM QUALQUER TELA (Pedro, 06/10/2026) ══════════════════════════
 * A bolinha do urso no canto de baixo, à direita, em toda página do Hub que
 * carrega este kit. Clicar abre uma janelinha com a conversa (buddy.html em
 * modo `mini`, dentro de um iframe). A CONVERSA ACOMPANHA O PROFESSOR de página
 * em página (a janelinha guarda o que foi dito nesta aba e redesenha ao abrir;
 * se ela estava aberta, reabre sozinha). Só recomeça em "Nova conversa". O
 * histórico de conversas antigas e as perguntas frequentes moram na página do
 * Buddy, que a janelinha oferece em "⤢ Página do Buddy".
 *
 * Só aparece para quem o servidor diz que pode usar o Buddy (`buddyInfo`), e a
 * resposta fica 30 minutos no aparelho (localStorage, com dono: fiskCacheLe) para
 * as outras páginas e as outras abas não perguntarem de novo; a página do Buddy
 * lê o mesmo cache. Na home a resposta vem dentro do `profHome` (window.__fiskProfHome):
 * se esse pedido está no ar, espera por ele em vez de perguntar de novo. Não aparece
 * na própria página do Buddy, dentro de iframe (gavetas), nem para quem não tem sessão.
 * ═══════════════════════════════════════════════════════════════════════════ */
var FISK_BUDDY_INFO_CHAVE = 'fisk_buddy_fab', FISK_ANIV_LISTA_CHAVE = 'fisk_aniv_lista';
/* guarda a resposta do buddyInfo (a mesma para a bolinha e para a página do Buddy) e devolve {ok, q, info} */
function fiskBuddyInfoGuarda(j) {
  var g = { ok: !!(j && j.ok === true && j.piloto && j.chave), q: Date.now(), info: (j && j.ok === true) ? j : null };
  fiskCacheGuarda(FISK_BUDDY_INFO_CHAVE, g);   /* o "não pode" também fica, por 5 min (quem lê decide) */
  return g;
}
(function () {
  if (window.parent !== window) return;
  if (/buddy(-ajustes)?\.html/.test(location.pathname)) return;
  var s = (typeof fiskSessao === 'function') ? fiskSessao() : null;
  if (!s || !s.token) return;
  function pode() {
    /* o "pode" vale 30 min; o "não pode" só 5, para a abertura com hora marcada chegar logo a quem já estava no Hub */
    var g = fiskCacheLe(FISK_BUDDY_INFO_CHAVE, FISK_CACHE_30MIN);
    if (g && (g.ok || Date.now() - g.q < 5 * 60000)) return Promise.resolve(!!g.ok);
    var pedido = window.__fiskProfHome
      ? window.__fiskProfHome.then(function (r) { if (r && r.buddy && r.buddy.ok === true) return r.buddy; throw new Error('sem buddy no profHome'); })
      : Promise.reject();
    return pedido.catch(function () {
      return fetch(FISK_HUB_EP, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'buddyInfo', token: s.token }) }).then(fiskJson);
    }).then(function (j) { return fiskBuddyInfoGuarda(j).ok; }).catch(function () { return false; });
  }
  function monta() {
    if (document.getElementById('fkBuddyFab')) return;
    var base = (typeof fiskHubBase === 'function') ? fiskHubBase() : '';
    var st = document.createElement('style');
    st.textContent =
      '#fkBuddyFab{position:fixed;z-index:9990;right:16px;bottom:16px;width:60px;height:60px;border-radius:50%;border:0;padding:0;cursor:pointer;background:#fff;' +
        'box-shadow:0 6px 20px rgba(37,99,235,.45),0 0 0 3px #2563eb;transition:transform .15s ease}' +
      '#fkBuddyFab:hover{transform:scale(1.07)}#fkBuddyFab span{display:block;width:100%;height:100%;border-radius:50%;overflow:hidden}' +
      '#fkBuddyFab img{display:block;width:100%;height:100%;transform:scale(1.35);transform-origin:50% 45%}' +
      '#fkBuddyJan{position:fixed;z-index:9991;right:16px;bottom:88px;width:420px;height:min(640px,calc(100vh - 110px));border-radius:18px;overflow:hidden;background:#fff;' +
        'box-shadow:0 18px 50px rgba(15,23,42,.38),0 0 0 1px rgba(37,99,235,.35);display:none}' +
      '#fkBuddyJan iframe{width:100%;height:100%;border:0;display:block}' +
      'body.fk-buddy-aberto #fkBuddyJan{display:block}' +
      /* na home o mural minimizado também mora nesse canto: ele sobe um degrau */
      'body.fk-buddy .av-sino{bottom:88px}' +
      '@media (max-width:560px){#fkBuddyJan{right:0;bottom:0;left:0;top:0;width:auto;height:auto;border-radius:0}body.fk-buddy-aberto #fkBuddyFab{display:none}}' +
      '@media print{#fkBuddyFab,#fkBuddyJan{display:none !important}}';
    document.head.appendChild(st);
    var bt = document.createElement('button');
    bt.id = 'fkBuddyFab'; bt.type = 'button'; bt.title = 'Perguntar ao Buddy'; bt.setAttribute('aria-label', 'Perguntar ao Buddy');
    bt.innerHTML = '<span><img alt="" src="https://portalfisk.com.br/assets/icons/buddy.png"></span>';
    var jan = document.createElement('div'); jan.id = 'fkBuddyJan';
    document.body.appendChild(jan); document.body.appendChild(bt);
    document.body.classList.add('fk-buddy');
    var fr = null;
    function abre(sim) {
      document.body.classList.toggle('fk-buddy-aberto', !!sim);
      /* aberta numa página, aberta na próxima: quem está conversando não precisa reabrir a cada tela */
      if (sim) fiskCacheGuarda('fisk_buddy_aberto', 1); else fiskCacheApaga('fisk_buddy_aberto');
      if (!sim || fr) return;
      fr = document.createElement('iframe'); fr.title = 'Buddy, auxiliar do professor'; fr.allow = 'microphone';
      fr.src = base + 'buddy.html?mini=1'; jan.appendChild(fr);
    }
    bt.addEventListener('click', function () { abre(!document.body.classList.contains('fk-buddy-aberto')); });
    window.addEventListener('message', function (e) { if (e.data && e.data.fiskBuddy === 'fecha') abre(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('fk-buddy-aberto')) abre(false); });
    if (fiskCacheLe('fisk_buddy_aberto', 6 * 3600000)) abre(true);   /* aberta numa ferramenta, aberta na próxima (6 h, o fio da conversa no servidor) */
    balaoAniversario(bt, abre);
  }
  /* O URSO AVISA DOS ANIVERSÁRIOS (Pedro, 23/10/2026): um balão saindo da bolinha, uma vez por dia, com os alunos do
     professor que fazem aniversário nesta semana (rota aniversariantesProf; a lista fica 30 min no aparelho). O ✕
     guarda o dia; clicar no balão leva à home, onde o cartão "Aniversariantes da semana" tem a lista inteira. */
  function balaoAniversario(bt) {
    var hoje = new Date(), dia = hoje.getFullYear() + '-' + (hoje.getMonth() + 1) + '-' + hoje.getDate();
    var CH = 'fisk_aniv_balao:' + dia + ':' + String(s.token).slice(0, 12);
    try { if (localStorage.getItem(CH) === '1') return; } catch (e) {}
    var lista = fiskCacheLe(FISK_ANIV_LISTA_CHAVE, FISK_CACHE_30MIN);
    var doHome = window.__fiskProfHome
      ? window.__fiskProfHome.then(function (r) { if (r && r.aniversariantes && r.aniversariantes.ok) return r.aniversariantes; throw new Error('sem aniversariantes no profHome'); })
      : Promise.reject();
    var pega = lista ? Promise.resolve(lista) : doHome.catch(function () {
      return fetch(FISK_HUB_EP, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'aniversariantesProf', token: s.token }) }).then(fiskJson);
    }).then(function (j) { var l = (j && j.ok && j.aniversariantes) || []; if (j && j.ok) fiskCacheGuarda(FISK_ANIV_LISTA_CHAVE, l); return l; }).catch(function () { return []; });
    pega.then(function (l) {
      if (!l || !l.length || document.getElementById('fkAnivBalao')) return;
      var dd = function (a) { return ('0' + a.dia).slice(-2) + '/' + ('0' + a.mes).slice(-2); };
      var prim = function (n) { return String(n || '').trim().split(/\s+/)[0]; };
      var hojeL = l.filter(function (a) { return a.hoje; });
      var txt = hojeL.length
        ? '🎂 Hoje é aniversário de <b>' + hojeL.map(function (a) { return fiskEsc(prim(a.nome)); }).join(', ') + '</b>!' + (l.length > hojeL.length ? ' E mais ' + (l.length - hojeL.length) + ' nesta semana.' : '')
        : '🎂 Aniversário nesta semana: ' + l.slice(0, 3).map(function (a) { return '<b>' + fiskEsc(prim(a.nome)) + '</b> (' + dd(a) + ')'; }).join(', ') + (l.length > 3 ? ' e mais ' + (l.length - 3) : '') + '.';
      var st = document.createElement('style');
      st.textContent = '#fkAnivBalao{position:fixed;z-index:9989;right:16px;bottom:88px;max-width:290px;background:#fff;border:2px solid #f5c542;border-radius:16px 16px 4px 16px;' +
        'padding:.7rem 2rem .7rem .85rem;font:inherit;font-size:.92rem;line-height:1.4;color:#3b2a00;box-shadow:0 10px 26px rgba(146,64,14,.22);cursor:pointer;animation:fkAniv .4s ease}' +
        '#fkAnivBalao button{position:absolute;top:.35rem;right:.4rem;border:0;background:none;font-size:1rem;cursor:pointer;color:#92400e}' +
        'body.fk-buddy-aberto #fkAnivBalao{display:none}@keyframes fkAniv{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
        'body.theme-dark #fkAnivBalao{background:#2b2513;color:#fde68a;border-color:#6d5a23}@media print{#fkAnivBalao{display:none}}';
      document.head.appendChild(st);
      var b = document.createElement('div'); b.id = 'fkAnivBalao'; b.setAttribute('role', 'status');
      b.innerHTML = '<span>' + txt + '</span><button type="button" aria-label="Fechar">✕</button>';
      document.body.appendChild(b);
      var fecha = function () { b.remove(); try { localStorage.setItem(CH, '1'); } catch (e) {} };
      b.querySelector('button').addEventListener('click', function (e) { e.stopPropagation(); fecha(); });
      b.addEventListener('click', function () {
        fecha();
        var card = document.getElementById('anCard');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else location.href = ((typeof fiskHubBase === 'function') ? fiskHubBase() : '') + 'index.html';
      });
    });
  }
  function vai() { pode().then(function (ok) { if (ok) monta(); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vai); else vai();
})();

/* ══ A SEMANA DE ANIVERSÁRIO DO PROFESSOR (Pedro, 28/10/2026) ═══════════════════════════════════════════════════════
 * "O Hub inteiro dele colorido e animado na semana", como o Portal do Aluno já faz na semana do aluno. Na semana
 * (segunda a domingo, a régua do Portal) toda página do Hub ganha a faixa de festa, balões subindo pelas bordas e um
 * confete por dia; NO DIA (ou no primeiro acesso depois dele, dentro da semana) abre a cortina de parabéns em nome da
 * escola, e ao fechar o avatar do professor comemora (fiskFesta).
 * Quem decide é o SERVIDOR (rota profAniversario, Equipe.js no backend), pela data que a pessoa preencheu na cortina
 * dos dados da equipe. A resposta vale o dia inteiro no aparelho: uma chamada por dia, não por página. Sem data
 * preenchida, sem rede ou com qualquer defeito: nada aparece, e o Hub segue igual (falha fechada).
 * Prévia da direção: entre com a conta de direção e abra qualquer página com #ver-aniversario (não grava nada).
 * Quem pediu "menos movimento" no sistema vê a festa parada: a faixa sem movimento, sem balões e sem confete.
 * ============================================================================ */
(function () {
  if (window.parent !== window) return;
  var s = (typeof fiskSessao === 'function') ? fiskSessao() : null;
  if (!s || !s.token || !s.name) return;
  var previa = /ver-aniversario/.test(location.hash) && !!s.master;
  if (s.viewingAs && !previa) return;   /* a direção "vendo como" um professor não herda a festa de ninguém */
  var agora = new Date(), DIA = agora.getFullYear() + '-' + ('0' + (agora.getMonth() + 1)).slice(-2) + '-' + ('0' + agora.getDate()).slice(-2);
  var QUEM = String(s.name).toUpperCase().replace(/[^A-Z0-9]/g, '');
  var CH = 'fisk_aniv_prof:' + QUEM;
  var parado = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TX = {
    pt: { fita: '🎂 É a semana do seu aniversário, {n}! O Hub está em festa com você.', fitaDia: '🎉 Hoje é o seu dia, {n}! Feliz aniversário!',
          titulo: 'Feliz aniversário, {n}!', sub: 'Hoje o dia é todo seu.', titPassou: 'Parabéns pelo seu dia, {n}!',
          subPassou: 'O seu aniversário foi nesta semana, e a festa continua até domingo.',
          carta: 'Toda a equipe da <b>{e}</b> deseja um feliz aniversário! Obrigado por cada aula, por cada aluno acolhido e por cada conquista que passa pelas suas mãos. Que o seu novo ano venha com muita saúde, alegria e realizações.',
          assina: 'Com carinho, a equipe {e}', fechar: 'Obrigado! 🎉', abrir: 'Abrir a mensagem de parabéns' },
    en: { fita: '🎂 It\'s your birthday week, {n}! The Hub is celebrating with you.', fitaDia: '🎉 Today is your day, {n}! Happy birthday!',
          titulo: 'Happy birthday, {n}!', sub: 'Today is all about you.', titPassou: 'Happy birthday, {n}!',
          subPassou: 'Your birthday was this week, and the party goes on until Sunday.',
          carta: 'Everyone at <b>{e}</b> wishes you a very happy birthday! Thank you for every class, every student you welcome and every achievement that goes through your hands. May your new year bring health, joy and many accomplishments.',
          assina: 'With love, the {e} team', fechar: 'Thank you! 🎉', abrir: 'Open the birthday message' },
    es: { fita: '🎂 ¡Es la semana de tu cumpleaños, {n}! El Hub está de fiesta contigo.', fitaDia: '🎉 ¡Hoy es tu día, {n}! ¡Feliz cumpleaños!',
          titulo: '¡Feliz cumpleaños, {n}!', sub: 'Hoy el día es todo tuyo.', titPassou: '¡Felicidades por tu día, {n}!',
          subPassou: 'Tu cumpleaños fue esta semana, y la fiesta sigue hasta el domingo.',
          carta: '¡Todo el equipo de <b>{e}</b> te desea un feliz cumpleaños! Gracias por cada clase, por cada alumno que recibes y por cada logro que pasa por tus manos. Que tu nuevo año venga con mucha salud, alegría y realizaciones.',
          assina: 'Con cariño, el equipo {e}', fechar: '¡Gracias! 🎉', abrir: 'Abrir el mensaje de cumpleaños' }
  };
  function tx() { var l = (typeof fiskIdioma === 'function') ? fiskIdioma() : 'pt'; return TX[l] || TX.pt; }
  function ler() { try { var g = JSON.parse(localStorage.getItem(CH) || 'null'); if (g && g.d === DIA && g.r) return g.r; } catch (e) {} return null; }
  function pega() {
    if (previa) return Promise.resolve({ ok: true, semana: true, hoje: true, nome: String(s.fullName || s.name).replace(/\s*\(.*?\)/g, '').trim().split(/\s+/)[0], escola: 'Caçapava' });
    var r = ler(); if (r) return Promise.resolve(r);
    return fetch(FISK_HUB_EP, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'profAniversario', token: s.token }) })
      .then(fiskJson).then(function (j) {
        if (!j || j.ok !== true) return null;
        try { localStorage.setItem(CH, JSON.stringify({ d: DIA, r: j })); } catch (e) {}
        return j;
      }).catch(function () { return null; });
  }

  function estilo() {
    if (document.getElementById('fkAnivProfCss')) return;
    var st = document.createElement('style'); st.id = 'fkAnivProfCss';
    st.textContent =
      '#fkAnivFita{position:relative;z-index:50;display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.55rem max(16px,env(safe-area-inset-right,0px)) .55rem max(16px,env(safe-area-inset-left,0px));' +
        'font:inherit;font-weight:700;font-size:.95rem;line-height:1.35;text-align:center;color:#3b1d00;border:0;width:100%;cursor:default;' +
        'background:linear-gradient(90deg,#ffd6e8,#ffe9a8,#c9f2d7,#cfe3ff,#e6d4ff,#ffd6e8);background-size:300% 100%;animation:fkAnivFita 14s linear infinite;' +
        'box-shadow:inset 0 -3px 0 rgba(0,0,0,.06)}' +
      '#fkAnivFita.dia{cursor:pointer}#fkAnivFita.dia:hover{filter:saturate(1.2)}' +
      '@keyframes fkAnivFita{from{background-position:0 0}to{background-position:300% 0}}' +
      /* o fundo: confete parado, bem leve, atrás do conteúdo */
      '#fkAnivFundo{position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.55;' +
        'background-image:radial-gradient(circle at 12% 18%,#f472b6 0 3px,transparent 4px),radial-gradient(circle at 78% 12%,#facc15 0 3px,transparent 4px),' +
        'radial-gradient(circle at 40% 70%,#34d399 0 3px,transparent 4px),radial-gradient(circle at 88% 64%,#60a5fa 0 3px,transparent 4px),' +
        'radial-gradient(circle at 24% 92%,#a78bfa 0 3px,transparent 4px),radial-gradient(circle at 62% 40%,#fb923c 0 2px,transparent 3px);background-size:260px 260px}' +
      /* os balões sobem pelas bordas, por cima de tudo mas sem pegar clique */
      '.fkBalao{position:fixed;bottom:-140px;z-index:9000;pointer-events:none;width:46px;height:58px;border-radius:50% 50% 48% 52%/58% 58% 42% 42%;opacity:.88;' +
        'box-shadow:inset -7px -9px 0 rgba(0,0,0,.12),inset 6px 6px 0 rgba(255,255,255,.35);animation:fkAnivSobe linear infinite}' +
      '.fkBalao:before{content:"";position:absolute;left:50%;bottom:-5px;margin-left:-4px;border:4px solid transparent;border-bottom-color:inherit;border-top:0;filter:brightness(.9)}' +
      '.fkBalao:after{content:"";position:absolute;left:50%;top:100%;width:1px;height:62px;background:rgba(100,100,100,.45)}' +
      '@keyframes fkAnivSobe{0%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-62vh) rotate(4deg)}100%{transform:translateY(-130vh) rotate(-3deg)}}' +
      '@media (max-width:640px){.fkBalao.b4,.fkBalao.b5,.fkBalao.b6{display:none}.fkBalao{width:36px;height:46px}}' +
      /* a cortina do dia */
      '#fkAnivCort{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(30,16,48,.55);backdrop-filter:blur(3px);animation:fkAnivAbre .35s ease}' +
      '#fkAnivCort .c{position:relative;width:min(460px,100%);max-height:calc(100vh - 32px);overflow:auto;border-radius:22px;padding:2rem 1.6rem 1.5rem;text-align:center;color:#2a1838;' +
        'background:linear-gradient(160deg,#fff7fb 0%,#fffaf0 55%,#f3fbff 100%);box-shadow:0 24px 60px rgba(30,16,48,.4),0 0 0 3px #f9c4dd}' +
      '#fkAnivCort .bolo{font-size:3.6rem;line-height:1;margin-bottom:.4rem;animation:fkAnivPula 1.6s ease-in-out infinite}' +
      '#fkAnivCort h2{margin:.2rem 0 .25rem;font-size:1.65rem;line-height:1.2;text-wrap:balance;color:#9d174d}' +
      '#fkAnivCort .sub{margin:0 0 1rem;font-size:1rem;color:#6b4a7a}' +
      '#fkAnivCort .carta{margin:0 0 .9rem;font-size:1rem;line-height:1.55;text-align:left;background:#fff;border:1px dashed #f3a8c9;border-radius:14px;padding:.9rem 1rem}' +
      '#fkAnivCort .assina{margin:0 0 1.2rem;font-style:italic;color:#7c5a8c;font-size:.92rem}' +
      '#fkAnivCort button{font:inherit;font-weight:700;font-size:1rem;border:0;border-radius:999px;padding:.75rem 1.6rem;cursor:pointer;color:#fff;' +
        'background:linear-gradient(90deg,#db2777,#f59e0b);box-shadow:0 6px 16px rgba(219,39,119,.35)}' +
      '@keyframes fkAnivAbre{from{opacity:0}to{opacity:1}}@keyframes fkAnivPula{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}' +
      'body.theme-dark #fkAnivFita{color:#2a1400}body.theme-dark #fkAnivFundo{opacity:.3}' +
      'body.theme-dark #fkAnivCort .c{background:linear-gradient(160deg,#2a1d33,#2b2417 60%,#18242e);color:#f5e9ff;box-shadow:0 24px 60px rgba(0,0,0,.6),0 0 0 3px #7a2e57}' +
      'body.theme-dark #fkAnivCort h2{color:#f9a8d4}body.theme-dark #fkAnivCort .sub,body.theme-dark #fkAnivCort .assina{color:#d8c2e6}' +
      'body.theme-dark #fkAnivCort .carta{background:rgba(255,255,255,.05);border-color:#7a2e57}' +
      '@media (prefers-reduced-motion:reduce){#fkAnivFita,.fkBalao,#fkAnivCort .bolo{animation:none}.fkBalao{display:none}}' +
      '@media print{#fkAnivFita,#fkAnivFundo,.fkBalao,#fkAnivCort,#fkAnivConf{display:none !important}}';
    document.head.appendChild(st);
  }

  function baloes() {
    var cores = ['#f472b6', '#facc15', '#34d399', '#60a5fa', '#a78bfa', '#fb923c'];
    var lados = [3, 94, 8, 89, 1.5, 96.5];   /* % da largura: só nas bordas, longe do texto */
    cores.forEach(function (c, i) {
      var b = document.createElement('div'); b.className = 'fkBalao b' + (i + 1); b.setAttribute('aria-hidden', 'true');
      b.style.left = lados[i] + '%'; b.style.background = c; b.style.borderBottomColor = c;
      b.style.animationDuration = (19 + i * 3) + 's'; b.style.animationDelay = (-i * 4.3) + 's';
      document.body.appendChild(b);
    });
  }

  function confete() {
    if (parado || document.getElementById('fkAnivConf')) return;
    var cv = document.createElement('canvas'); cv.id = 'fkAnivConf';
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:10060;pointer-events:none';
    document.body.appendChild(cv);
    var W = cv.width = innerWidth, H = cv.height = innerHeight, ctx = cv.getContext('2d');
    var cores = ['#f472b6', '#facc15', '#34d399', '#60a5fa', '#a78bfa', '#fb923c', '#ef4444'], P = [];
    for (var i = 0; i < 160; i++) P.push({ x: Math.random() * W, y: -20 - Math.random() * H * .5, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4,
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: cores[i % cores.length] });
    var t0 = performance.now();
    (function passo(t) {
      var dt = t - t0; ctx.clearRect(0, 0, W, H);
      P.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += .04; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, dt - 2600) / 900); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * .6); ctx.restore(); });
      if (dt < 3500) requestAnimationFrame(passo); else cv.remove();
    })(t0);
  }

  function cortina(r) {
    if (document.getElementById('fkAnivCort')) return;
    var T = tx(), nome = fiskEsc(r.nome || ''), esc = 'Fisk' + (r.escola ? ' ' + fiskEsc(r.escola) : '');
    var passou = r.passou && !r.hoje;
    var d = document.createElement('div'); d.id = 'fkAnivCort'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'fkAnivTit');
    d.innerHTML = '<div class="c"><div class="bolo" aria-hidden="true">🎂</div>' +
      '<h2 id="fkAnivTit">' + (passou ? T.titPassou : T.titulo).replace('{n}', nome) + '</h2>' +
      '<p class="sub">' + (passou ? T.subPassou : T.sub) + '</p>' +
      '<p class="carta">' + T.carta.replace('{e}', esc) + '</p>' +
      '<p class="assina">' + T.assina.replace('{e}', esc) + '</p>' +
      '<button type="button">' + T.fechar + '</button></div>';
    document.body.appendChild(d);
    confete();
    var bt = d.querySelector('button'); try { bt.focus(); } catch (e) {}
    function fecha() {
      d.remove(); document.removeEventListener('keydown', esc_);
      try { if (!previa) localStorage.setItem(CH + ':cortina', String(new Date().getFullYear())); } catch (e) {}
      try { if (typeof fiskFesta === 'function') fiskFesta('🎂'); } catch (e) {}
    }
    function esc_(e) { if (e.key === 'Escape') fecha(); }
    bt.addEventListener('click', fecha);
    d.addEventListener('click', function (e) { if (e.target === d) fecha(); });
    document.addEventListener('keydown', esc_);
  }

  function festa(r) {
    if (!r || !r.semana || document.getElementById('fkAnivFita')) return;
    estilo();
    document.body.classList.add('fk-aniv');
    var T = tx(), nome = fiskEsc(r.nome || ''), noDia = r.hoje || r.passou;
    var f = document.createElement(noDia ? 'button' : 'div'); f.id = 'fkAnivFita';
    if (noDia) { f.type = 'button'; f.className = 'dia'; f.title = T.abrir; f.addEventListener('click', function () { cortina(r); }); }
    f.innerHTML = (r.hoje ? T.fitaDia : T.fita).replace('{n}', nome);
    document.body.insertBefore(f, document.body.firstChild);
    var fundo = document.createElement('div'); fundo.id = 'fkAnivFundo'; fundo.setAttribute('aria-hidden', 'true'); document.body.appendChild(fundo);
    baloes();
    var ano = String(new Date().getFullYear()), viu = '';
    try { viu = localStorage.getItem(CH + ':cortina') || ''; } catch (e) {}
    if (noDia && (viu !== ano || previa)) { setTimeout(function () { cortina(r); }, 700); return; }
    /* um confete por dia, na primeira página que abrir */
    var CC = CH + ':confete:' + DIA, ja = '';
    try { ja = localStorage.getItem(CC) || ''; } catch (e) {}
    if (!ja || previa) { setTimeout(confete, 600); try { localStorage.setItem(CC, '1'); } catch (e) {} }
  }

  function vai() { pega().then(festa).catch(function () {}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vai); else vai();
})();
