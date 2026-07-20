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
