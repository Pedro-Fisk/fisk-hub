/* A MINHA AULA PRÉ-CARREGADA (Pedro, 30/10/2026): "geralmente eles já usam o Minha Aula, então já poderia ir carregando os
   dados da próxima turma". Da home do Hub, um pedido por vez: a próxima turma, depois as outras de HOJE, e de novo 20 min
   antes da aula se o Hub seguir aberto. As de outros dias ficam de fora: o planner muda todo dia, e o dado chegaria velho.
   · Mora no localStorage porque o Hub abre a Minha aula com noopener (a aba nova não herda o sessionStorage). A chave leva a
     conta e o dia: vira o dia, não vale mais. O prefixo th: entra no fiskLimparAoSair, então o Sair apaga junto.
   · Telefone e aniversário NÃO entram (card fn=turma): vêm na hora, não seguram a tela e não precisam ficar guardados.
   · Só leitura: panoramaProf, plannerTurma e planejamentoLe. */
window.FiskPreAula = (function () {
  var PRE = 'th:pre:', ANTES_MIN = 20, RENOVA_MIN = 15, rodando = false;
  function sess() { try { return JSON.parse(localStorage.getItem('fisk_prof') || 'null'); } catch (e) { return null; } }
  function nP(v) { return String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase(); }
  function hoje() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function chave(escola, prof, linha) { var s = sess(); return PRE + nP(s && s.name) + ':' + hoje() + ':' + escola + '|' + prof + '|' + linha; }
  function le(escola, prof, linha) { if (!sess()) return null; try { return JSON.parse(localStorage.getItem(chave(escola, prof, linha)) || 'null'); } catch (e) { return null; } }
  function guarda(escola, prof, linha, d) {
    d.t = Date.now();
    try { localStorage.setItem(chave(escola, prof, linha), JSON.stringify(d)); } catch (e) {}   /* sem espaço: a tela só abre como antes */
  }
  function limpaSe(deve) { try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(PRE) === 0 && deve(k)) localStorage.removeItem(k); }); } catch (e) {} }
  function limpa() { limpaSe(function () { return true; }); }
  function idadeMin(t) { var g = le(t.escola, t.prof, t.linha); return g ? (Date.now() - g.t) / 60000 : Infinity; }
  function deHoje() {
    var s = sess(), g = null, sem = []; if (!s) return [];
    try { g = JSON.parse(localStorage.getItem('cal:turmas:' + nP(s.name)) || 'null'); sem = JSON.parse(localStorage.getItem('cal:semaula') || '[]'); } catch (e) {}
    var d = new Date(), wd = d.getDay(), min = d.getHours() * 60 + d.getMinutes(), dia = hoje(), esc = String(s.escolas || '').split(/[,;]/).map(function (x) { return x.trim(); });
    if (sem.some(function (x) { return x.i <= dia && dia <= x.f && (!x.u || !x.u.length || x.u.some(function (u) { return esc.indexOf(u) > -1; })); })) return [];
    return ((g && g.t) || []).filter(function (t) { return t.h && t.h.dias.indexOf(wd) > -1 && t.h.fim > min; }).sort(function (a, b) { return a.h.ini - b.h.ini; });
  }
  function url(p) { return FISK_HUB_EP + '?' + Object.keys(p).map(function (k) { return k + '=' + encodeURIComponent(p[k]); }).join('&'); }
  function post(b) { return fetch(FISK_HUB_EP, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(b) }).then(function (r) { return r.json(); }); }
  function umaTurma(t, pan, tok) {
    var tp = (pan.turmas || []).filter(function (x) { return String(x.linhaTitulo) === String(t.linha); })[0], nome = tp ? tp.turma : t.titulo;
    var alunos = (pan.alunos || []).filter(function (a) { return !a.saiu && (a.turma === nome || a.turma === t.titulo); });
    var comRaf = alunos.filter(function (a) { return a.raf; });
    if (!comRaf.length) return Promise.resolve();
    return Promise.all([
      post({ action: 'plannerTurma', token: tok, alunos: comRaf.map(function (a) { return { raf: a.raf, book: a.book, turma: nome }; }) }),
      post({ action: 'planejamentoLe', token: tok, escola: t.escola, prof: t.prof, turma: nome }).catch(function () { return { plano: null }; })
    ]).then(function (rs) {
      if (!rs[0] || rs[0].ok === false || !rs[0].alunos) return;
      guarda(t.escola, t.prof, t.linha, { nomeTurma: nome, alunos: comRaf, semRaf: alunos.length - comRaf.length, dados: rs[0].alunos, recursos: rs[0].recursos || [], plano: rs[1] && rs[1].plano || null });
    });
  }
  function roda(lista) {
    var s = sess(); if (rodando || !lista.length || !s || !s.token) return;
    rodando = true;
    var pans = {}, fim = function () { rodando = false; };
    (function proximo(i) {
      var t = lista[i], agora = sess(); if (!t || !agora || agora.token !== s.token) return fim();
      var k = t.escola + '|' + t.prof;
      pans[k] = pans[k] || fetch(url({ action: 'panoramaProf', escola: t.escola, prof: t.prof, token: s.token })).then(function (r) { return r.json(); });
      pans[k].then(function (j) { if (!j || !j.ok) throw new Error('sem panorama'); return umaTurma(t, j, s.token); }).catch(function () {}).then(function () { setTimeout(function () { proximo(i + 1); }, 1500); });
    })(0);
  }
  /* roda a cada minuto na home: a primeira passada acha o que falta; depois, só a aula que vem aí */
  function tique() {
    var s = sess(); if (!s || !s.token) { limpa(); return; }
    if (s.master || s.viewingAs) return;
    var dia = ':' + hoje() + ':'; limpaSe(function (k) { return k.indexOf(dia) < 0; });
    var l = deHoje(), d = new Date(), min = d.getHours() * 60 + d.getMinutes();
    roda(l.filter(function (t) { var i = idadeMin(t), falta = t.h.ini - min; return i === Infinity || (falta <= ANTES_MIN && i > RENOVA_MIN); }));
  }
  function comecar() {
    setTimeout(tique, 3000); setInterval(tique, 60000);
    window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('cal:turmas:') === 0) tique(); });   /* a Minha semana grava as turmas num iframe */
  }
  return { le: le, guarda: guarda, limpa: limpa, comecar: comecar, tique: tique, deHoje: deHoje };
})();
