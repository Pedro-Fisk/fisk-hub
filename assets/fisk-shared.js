/* ============================================================
   FISK — helpers compartilhados
   Fonte: github.com/Pedro-Fisk/fisk-hub/assets/fisk-shared.js
   Publicado via jsDelivr (tag de versão) e consumido pelas outras
   ferramentas do Hub. Sem dependências externas.
   ============================================================ */

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
  // corpo como string simples (text/plain) evita preflight CORS no Apps Script
  var resp = await fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
  var j;
  try { j = await resp.json(); }
  catch (e) { throw new Error('resposta inválida do servidor (o doPost já foi publicado no Apps Script?)'); }
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
    var ondeAlvo = (opts && opts.tipo === 'turma') ? 'da turma' : 'do aluno';
    if (e.code === 'sem_endpoint') {
      alert('⚙️ O salvamento no Drive ainda não foi configurado.\n\nPublique o endpoint (apps-script/Code.gs) e cole a URL em FISK_SAVE_URL (assets/fisk-shared.js).');
    } else if (e.code === 'pasta_nao_encontrada') {
      alert('⚠️ ATENÇÃO: a pasta ' + ondeAlvo + ' NÃO foi encontrada no drive compartilhado.\n\n' +
            'O documento NÃO foi salvo. Baixe o PDF manualmente (botão de gerar/baixar) ou ' +
            'confira/crie a pasta no Drive e tente de novo.' + (e.message ? '\n\n(' + e.message + ')' : ''));
    } else {
      alert('Não deu para salvar no Drive: ' + (e.message || e));
    }
    throw e;
  }
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

/** Sessão do professor gravada pelo login do Hub. */
function fiskSessao() {
  try { return JSON.parse(localStorage.getItem('fisk_prof') || 'null'); } catch (e) { return null; }
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

var FISK_IDIOMAS = [
  { id: 'pt', rot: 'PT' },
  { id: 'en', rot: 'EN' },
  { id: 'es', rot: 'ES' }
];

/** Idioma escolhido no Hub — vale para todas as páginas. */
function fiskIdioma() {
  try { return localStorage.getItem('fisk_lang') || 'pt'; } catch (e) { return 'pt'; }
}

/**
 * Monta o menu do professor no cabeçalho.
 * opts.onIdioma(lang) — chamado quando o professor troca de idioma; se a
 * página não passa nada, a escolha é só guardada e vale na próxima que souber
 * traduzir (o idioma é do PROFESSOR, não da página).
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
  btn.innerHTML = '<span>👤 ' + fiskEsc(primeiro) + '</span><span class="fu-seta">▾</span>';

  var menu = document.createElement('div');
  menu.className = 'fisk-user-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML =
    '<div class="fu-head"><b>' + fiskEsc(s.fullName || s.name) + '</b>' +
      (escolas ? '<span>' + fiskEsc(escolas.split(',').join(' + ')) + '</span>' : '') + '</div>' +
    '<a class="fu-item" href="' + base + 'index.html">🏠 Fisk Hub</a>' +
    '<a class="fu-item" href="' + base + 'visao-geral.html">📊 Minhas turmas</a>' +
    '<a class="fu-item" href="' + base + 'treinamentos.html">🎓 Treinamentos</a>' +
    /* o seletor de idioma só aparece onde a página SABE traduzir: um botão
       que não muda nada na tela é pior do que não ter botão */
    (typeof opts.onIdioma === 'function'
      ? '<div class="fu-sep"></div><div class="fu-langs">' + FISK_IDIOMAS.map(function (l) {
          return '<button type="button" class="fu-lang" data-lang="' + l.id + '">' + l.rot + '</button>';
        }).join('') + '</div>'
      : '') +
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
      try { localStorage.setItem('fisk_lang', lang); } catch (x) {}
      marcarIdioma();
      if (typeof opts.onIdioma === 'function') opts.onIdioma(lang);
      fechar();
    });
  });

  menu.querySelector('.fu-sair').addEventListener('click', function () {
    if (typeof opts.onSair === 'function') { fechar(); opts.onSair(); return; }
    if (!window.confirm('Sair da sua conta neste computador?')) return;
    try {
      localStorage.removeItem('fisk_prof');
      localStorage.removeItem('fisk_actas');
      localStorage.removeItem('fisk_minidash');
    } catch (x) {}
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

function fiskRegistrarUso(ferramenta) {
  try {
    var s = fiskSessao();
    if (!s || !s.token || !ferramenta) return;
    fetch(FISK_HUB_EP, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'usoFerramenta', token: s.token, ferramenta: ferramenta })
    }).catch(function () {});
    fiskPulso(ferramenta);
  } catch (e) {}
}

function fiskPulso(ferramenta) {
  if (window.__fiskPulso) return;          // uma página, um pulso
  window.__fiskPulso = true;
  var ultimoToque = Date.now();
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function () { ultimoToque = Date.now(); }, { passive: true });
  });
  setInterval(function () {
    try {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - ultimoToque > FISK_PULSO_OCIO * 60000) return;
      var s = fiskSessao();
      if (!s || !s.token) return;
      fetch(FISK_HUB_EP, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'usoPulso', token: s.token, ferramenta: ferramenta || '' })
      }).catch(function () {});
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
  }).then(function (r) { return r.json(); }).then(function (j) {
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
        }).then(function (r) { return r.json(); }).then(function (j) {
          if (!j || !j.ok) { ok.disabled = false; conta.textContent = (j && j.error) || 'não deu para enviar'; return; }
          try { localStorage.setItem('fisk_camp_' + c.id, '1'); } catch (e) {}
          fab.textContent = '📣 Resposta enviada';
          desenhar();
        }).catch(function () { ok.disabled = false; conta.textContent = 'erro de conexão'; });
      });
    }
  }
}
