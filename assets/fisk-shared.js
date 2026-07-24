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
   O Apps Script (ver apps-script/salvar-no-drive.gs) localiza a pasta
   por NOME no drive compartilhado e grava o arquivo; se não achar,
   devolve code:'pasta_nao_encontrada' e o professor é avisado.
   ============================================================ */

/* URL do App da Web do endpoint de salvamento (projeto Apps Script SEPARADO
   "fisk-hub-backend" — NÃO é o API_URL do card). Preencha depois de publicar
   o apps-script/salvar-no-drive.gs. Enquanto estiver vazio, os botões de
   salvar avisam que falta configurar. */
var FISK_SAVE_URL = '';

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
    fn: 'salvarPdf', key: opts.key, tipo: opts.tipo,
    escola: opts.escola || '', professor: opts.professor || '',
    turma: opts.turma || '', aluno: opts.aluno || '',
    filename: opts.filename || 'documento.pdf', mime: 'application/pdf',
    dados: fiskBytesToBase64(opts.bytes)
  };
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
    buttonEl.textContent = '✓ Salvo na pasta';
    setTimeout(function () { buttonEl.textContent = old; buttonEl.disabled = false; }, 2500);
    return r;
  } catch (e) {
    buttonEl.textContent = old; buttonEl.disabled = false;
    var ondeAlvo = (opts && opts.tipo === 'turma') ? 'da turma' : 'do aluno';
    if (e.code === 'sem_endpoint') {
      alert('⚙️ O salvamento no Drive ainda não foi configurado.\n\nPublique o endpoint (apps-script/salvar-no-drive.gs) e cole a URL em FISK_SAVE_URL (assets/fisk-shared.js).');
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
