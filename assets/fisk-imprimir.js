/* ═══════════════════════════════════════════════════════════════════════
   BOTÃO "SOLICITAR IMPRESSÃO" DOS GERADORES (Central de Impressões, fase 2, 20/10/2026)
   ═══════════════════════════════════════════════════════════════════════
   Usado pelo Gerador de Boletins (boletim-fisk) e pelo Abridor de Planners
   (planner-fisk). Os dois moram em pedro-fisk.github.io, a mesma origem do Hub,
   então a sessão do professor (localStorage fisk_prof) é a mesma.

   Uso, depois de carregar este arquivo:
     fiskImpressao.ligar({ depoisDe: 'pdfBtn', origem: 'boletim', rotulo: 'Boletim', classe: 'btn btn-generate btn-sm' });
   `classe` (opcional) veste o botão com as classes da própria página, para ele ficar igual ao vizinho.

   O botão (verde) aparece sozinho quando a página guarda um PDF novo em
   window.ultimoPDF ({ bytes, filename, aluno }) e some quando ele é limpo.
   O clique abre uma janelinha na própria página, com o PDF já anexado:
   cópias, escola (só para quem tem as duas), "preciso até" e observação.
   RAF, escola e turma vêm de window.RAF_DO_CARD e window.FISK_VINCULO, que o
   card-sync de cada ferramenta preenche ao vincular o aluno.
   Backend: fisk-hub-backend/Impressoes.js (rota impPedir).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.fiskImpressao) return;
  var EP = 'https://script.google.com/macros/s/AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1/exec';
  var MAX = 15 * 1024 * 1024;

  function sessao() { try { return JSON.parse(localStorage.getItem('fisk_prof') || 'null') || {}; } catch (e) { return {}; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function b64(bytes) {
    var s = '', passo = 0x8000;
    for (var i = 0; i < bytes.length; i += passo) s += String.fromCharCode.apply(null, bytes.subarray(i, i + passo));
    return btoa(s);
  }
  function paginas(bytes) {
    try { var m = new TextDecoder('latin1').decode(bytes).match(/\/Type\s*\/Page(?![s\w])/g); return m ? m.length : 0; } catch (e) { return 0; }
  }

  var CSS = '' +
    '.fimp-btn{background:#32a889;color:#fff;border:0;border-radius:99px;font-weight:800;cursor:pointer;padding:.45rem .95rem;font-size:13px;font-family:inherit}' +
    '.fimp-btn:hover{background:#27866e}.fimp-btn[disabled]{opacity:.6;cursor:default}' +
    '.fimp-fundo{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px;z-index:99999}' +
    '.fimp-caixa{background:#fff;color:#161414;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.3);width:100%;max-width:440px;padding:20px 22px;font-family:inherit}' +
    '.fimp-caixa h3{margin:0 0 4px;font-size:18px}.fimp-sub{font-size:13px;color:#6f6a6a;margin:0 0 14px;line-height:1.45}' +
    '.fimp-grade{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fimp-campo label{display:block;font-size:12px;font-weight:700;color:#6f6a6a;margin-bottom:3px}' +
    '.fimp-campo input,.fimp-campo select,.fimp-campo textarea{width:100%;box-sizing:border-box;border:1.5px solid #d6d2d2;border-radius:10px;padding:8px 10px;font:inherit;font-size:14px;background:#fff;color:#161414}' +
    '.fimp-largo{grid-column:1 / -1}.fimp-acoes{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}' +
    '.fimp-ghost{background:#fff;color:#161414;border:1.5px solid #d6d2d2;border-radius:99px;font-weight:800;cursor:pointer;padding:.45rem .95rem;font-size:13px;font-family:inherit}' +
    '.fimp-msg{font-size:13px;font-weight:700;min-height:18px;margin-top:10px}.fimp-msg.erro{color:#d81f26}.fimp-msg.ok{color:#1d7a46}' +
    'body.theme-dark .fimp-caixa{background:#211e1e;color:#f2efef}body.theme-dark .fimp-campo input,body.theme-dark .fimp-campo select,body.theme-dark .fimp-campo textarea{background:#2a2727;color:#f2efef;border-color:#3a3535}' +
    'body.theme-dark .fimp-ghost{background:#2a2727;color:#f2efef;border-color:#3a3535}';

  function ligar(opts) {
    opts = opts || {};
    var ancora = document.getElementById(opts.depoisDe);
    if (!ancora) return;
    if (!document.getElementById('fimp-css')) {
      var st = document.createElement('style'); st.id = 'fimp-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = opts.classe || 'fimp-btn'; btn.hidden = true; btn.textContent = '🖨️ Solicitar impressão';
    btn.title = 'Mandar este PDF para a secretaria imprimir';
    if (opts.margem) btn.style.margin = opts.margem;
    if (opts.classe) btn.style.background = '#32a889';   /* verde de ação, mesmo que a classe da página seja de outra cor */
    ancora.parentNode.insertBefore(btn, ancora.nextSibling);

    var visto = null;
    setInterval(function () {
      var pdf = window.ultimoPDF;
      if (!pdf || !pdf.bytes) { btn.hidden = true; visto = null; return; }
      if (pdf !== visto) { visto = pdf; btn.hidden = false; btn.disabled = false; btn.textContent = '🖨️ Solicitar impressão'; }
    }, 700);
    btn.addEventListener('click', function () { abrir(opts, btn); });
  }

  function abrir(opts, btn) {
    var pdf = window.ultimoPDF;
    if (!pdf || !pdf.bytes) return;
    var s = sessao(), vinc = window.FISK_VINCULO || {};
    var aluno = String(pdf.aluno || vinc.nome || '').trim();
    var titulo = (opts.rotulo || 'Documento') + (aluno ? ' · ' + aluno : '');
    var escolas = String(s.escolas || s.escola || '').split(',').map(function (x) { return x.trim(); }).filter(String);
    var escola = vinc.escola && (!escolas.length || escolas.indexOf(vinc.escola) >= 0) ? vinc.escola : (escolas[0] || '');
    var bytes = pdf.bytes instanceof Uint8Array ? pdf.bytes : new Uint8Array(pdf.bytes);
    var fundo = document.createElement('div');
    fundo.className = 'fimp-fundo';
    fundo.innerHTML = '<div class="fimp-caixa" role="dialog" aria-modal="true" aria-labelledby="fimpTit">' +
      '<h3 id="fimpTit">Solicitar impressão à secretaria</h3>' +
      '<p class="fimp-sub">' + esc(titulo) + (vinc.turma ? ' · ' + esc(vinc.turma) : '') + (paginas(bytes) ? ' · ' + paginas(bytes) + ' página(s)' : '') + '</p>' +
      (!s.token ? '<p class="fimp-msg erro">Entre no Fisk Hub primeiro (na página inicial do Hub) e gere o PDF de novo.</p>' :
      '<div class="fimp-grade">' +
        '<div class="fimp-campo"><label for="fimpCop">Cópias</label><input id="fimpCop" type="number" min="1" max="200" value="1"></div>' +
        '<div class="fimp-campo"><label for="fimpAte">Preciso até (opcional)</label><input id="fimpAte" type="date"></div>' +
        (escolas.length > 1 ? '<div class="fimp-campo fimp-largo"><label for="fimpEsc">Escola</label><select id="fimpEsc">' +
          escolas.map(function (e) { return '<option' + (e === escola ? ' selected' : '') + '>' + esc(e) + '</option>'; }).join('') + '</select></div>' : '') +
        '<div class="fimp-campo fimp-largo"><label for="fimpObs">Observação para a secretária (opcional)</label><textarea id="fimpObs" rows="2" maxlength="500" placeholder="Ex.: frente e verso"></textarea></div>' +
      '</div>') +
      '<p class="fimp-msg" id="fimpMsg" role="status"></p>' +
      '<div class="fimp-acoes"><button type="button" class="fimp-ghost" id="fimpFechar">Fechar</button>' +
      (s.token ? '<button type="button" class="fimp-btn" id="fimpEnviar">Enviar pedido</button>' : '') + '</div></div>';
    document.body.appendChild(fundo);
    function fechar() { fundo.remove(); document.removeEventListener('keydown', tecla); }
    function tecla(e) { if (e.key === 'Escape') fechar(); }
    document.addEventListener('keydown', tecla);
    fundo.addEventListener('click', function (e) { if (e.target === fundo) fechar(); });
    fundo.querySelector('#fimpFechar').addEventListener('click', fechar);
    var enviar = fundo.querySelector('#fimpEnviar');
    if (!enviar) return;
    var msg = fundo.querySelector('#fimpMsg');
    if (bytes.length > MAX) { msg.className = 'fimp-msg erro'; msg.textContent = 'O PDF passa de 15 MB e não pode ser enviado.'; enviar.disabled = true; return; }
    enviar.addEventListener('click', function () {
      enviar.disabled = true; msg.className = 'fimp-msg'; msg.textContent = 'Enviando…';
      var corpo = { action: 'impPedir', token: s.token, origem: opts.origem || 'avulso', titulo: titulo, mime: 'application/pdf',
        dados: b64(bytes), paginas: paginas(bytes), aluno: aluno, raf: window.RAF_DO_CARD || '', turma: vinc.turma || '',
        copias: fundo.querySelector('#fimpCop').value, precisaAte: fundo.querySelector('#fimpAte').value,
        escola: (fundo.querySelector('#fimpEsc') || {}).value || escola, obs: fundo.querySelector('#fimpObs').value.trim() };
      fetch(EP, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(corpo) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.ok) { enviar.disabled = false; msg.className = 'fimp-msg erro'; msg.textContent = (j && j.error) || 'Não consegui enviar.'; return; }
          msg.className = 'fimp-msg ok';
          msg.textContent = 'Pedido enviado à secretaria de ' + j.escola + '. Você recebe o aviso no Fisk Hub quando for impresso.';
          enviar.remove();
          btn.disabled = true; btn.textContent = '✅ Impressão solicitada';
        })
        .catch(function () { enviar.disabled = false; msg.className = 'fimp-msg erro'; msg.textContent = 'Erro de conexão. O pedido não foi enviado; tente de novo.'; });
    });
  }

  window.fiskImpressao = { ligar: ligar };
})();
