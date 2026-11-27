/* O DESENHISTA DE SLIDES DO CONVERSATION MAKER (Pedro, 27/11/2026: "a parte mais importante é o visual criado por
 * atividade"). Transforma o conteúdo de uma aula (o mesmo `lesson` do Conversation Maker) e a RECEITA DO VISUAL que a
 * IA devolve junto (`design`) em slides 1920×1080 com os cliques da sala: a tradução do vocabulário aparece num clique
 * separado, as perguntas entram uma a uma, o jogo é clicável (o professor toca na opção e a tela diz se acertou).
 * Serve à prévia do Conversation Maker e à conversação do Hub. Sem dependências; ícones Fluent Emoji (Microsoft, MIT)
 * guardados no próprio Hub (assets/icones/fluent/<nome>.svg), para não depender de serviço de fora.
 *
 *   var deck = FiskTema.montar(lesson, design, { base: 'https://pedro-fisk.github.io/fisk-hub/' })
 *   deck.slides  → [{ tipo, etapas, el }]   (el = <div class="ft-s"> de 1920×1080; etapas = quantos cliques ele tem)
 *   FiskTema.mostrar(deck, i, etapa)          → aplica a etapa no slide i (o que tem data-e <= etapa aparece)
 *   FiskTema.encaixar(el, caixa)              → escala o slide para caber na caixa
 *
 * design (a receita; tudo opcional, com reserva):
 *   { modelo: 'tema'|'classico', escuro, paleta:{fundo,fundo2,prim,sec,dest,txt}, fontes:{titulo,corpo},
 *     fundo: 'bolhas'|'pontos'|'faixas'|'gradiente'|'estrelas', heroi: '<ícone>', icones: ['<ícone>', ... 6 a 10] }
 * O MODELO CLÁSSICO (o template do Canva de hoje) continua sendo o .pptx do Conversation Maker; aqui ele é só a paleta
 * vermelha da FISK, até ganhar desenho próprio.
 */
(function (raiz) {
  var FONTES_OK = ['Fredoka', 'Poppins', 'Montserrat', 'Nunito', 'Rubik', 'Barlow Condensed', 'Barlow', 'Playfair Display', 'Lato',
    'Exo 2', 'Baloo 2', 'Quicksand', 'Raleway', 'Oswald', 'Merriweather', 'Source Sans 3', 'Work Sans', 'Josefin Sans', 'Lora', 'Comfortaa'];
  var CLASSICO = { escuro: false, paleta: { fundo: '#ffffff', fundo2: '#fde2e2', prim: '#c8102e', sec: '#111827', dest: '#c8102e', txt: '#111827' },
    fontes: { titulo: 'Poppins', corpo: 'Nunito' }, fundo: 'pontos', heroi: 'megaphone', icones: ['speech-balloon', 'megaphone', 'light-bulb', 'star', 'thought-balloon', 'speaking-head'] };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hexRgb(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return isNaN(n) ? [255, 255, 255] : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function lum(h) { return hexRgb(h).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce(function (a, v, i) { return a + v * [.2126, .7152, .0722][i]; }, 0); }
  function contraste(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  /* a regra de legibilidade: texto contra o fundo com contraste de pelo menos 4,5 (o da TV de 55" pede folga) */
  function legivel(cor, fundo, reserva) { return contraste(cor, fundo) >= 4.5 ? cor : (reserva || (lum(fundo) > .4 ? '#111827' : '#ffffff')); }

  function receita(d) {
    d = d || {};
    if (d.modelo === 'classico') return JSON.parse(JSON.stringify(CLASSICO));
    var p = Object.assign({}, CLASSICO.paleta, d.paleta || {});
    var f = d.fontes || {};
    var r = { escuro: !!d.escuro, paleta: p,
      fontes: { titulo: FONTES_OK.indexOf(f.titulo) > -1 ? f.titulo : 'Poppins', corpo: FONTES_OK.indexOf(f.corpo) > -1 ? f.corpo : 'Nunito' },
      fundo: ['bolhas', 'pontos', 'faixas', 'gradiente', 'estrelas'].indexOf(d.fundo) > -1 ? d.fundo : 'bolhas',
      heroi: d.heroi || 'speech-balloon', icones: (d.icones && d.icones.length ? d.icones : CLASSICO.icones).slice(0, 10) };
    p.txt = legivel(p.txt, p.fundo);
    p.prim = legivel(p.prim, p.fundo, p.txt);
    return r;
  }
  function fundoCss(r) {
    var p = r.paleta;
    if (r.fundo === 'gradiente' || r.escuro) return 'background:linear-gradient(160deg,' + p.fundo + ' 0%,' + p.fundo2 + ' 75%);';
    if (r.fundo === 'estrelas') return 'background-color:' + p.fundo + ';background-image:radial-gradient(2px 2px at 20% 30%,#fff 50%,transparent 51%),radial-gradient(2px 2px at 70% 60%,#fff 50%,transparent 51%),radial-gradient(3px 3px at 40% 80%,#c7d2fe 50%,transparent 51%),radial-gradient(2px 2px at 85% 15%,#fff 50%,transparent 51%),linear-gradient(160deg,' + p.fundo + ',' + p.fundo2 + ');';
    if (r.fundo === 'pontos') return 'background-color:' + p.fundo + ';background-image:radial-gradient(' + p.fundo2 + ' 3px,transparent 3.5px);background-size:46px 46px;';
    if (r.fundo === 'faixas') return 'background-color:' + p.fundo + ';background-image:repeating-linear-gradient(135deg,' + p.fundo2 + ' 0 26px,transparent 26px 90px);';
    return 'background-color:' + p.fundo + ';background-image:radial-gradient(circle at 92% 12%,' + p.fundo2 + ' 0 230px,transparent 231px),radial-gradient(circle at 6% 92%,' + p.fundo2 + ' 0 260px,transparent 261px);';
  }

  var css = null;
  function injetaCss(r, base) {
    var id = 'ft-css-' + (r.fontes.titulo + r.fontes.corpo).replace(/\W/g, '');
    if (document.getElementById(id)) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.id = id;
    l.href = 'https://fonts.googleapis.com/css2?family=' + [r.fontes.titulo, r.fontes.corpo].filter(function (x, i, a) { return a.indexOf(x) === i; }).map(function (f) { return f.replace(/ /g, '+') + ':wght@500;600;700;800;900'; }).join('&family=') + '&display=swap';
    document.head.appendChild(l);
    if (css) return;
    css = document.createElement('style');
    css.textContent = '.ft-s{width:1920px;height:1080px;position:relative;overflow:hidden;box-sizing:border-box;transform-origin:0 0}' +
      '.ft-s *{box-sizing:border-box}.ft-s [data-e]{transition:opacity .45s ease,transform .45s ease}.ft-s [data-e].ft-off{opacity:0;transform:translateY(14px)}' +
      '.ft-s .ft-trad.ft-off{opacity:0;transform:none}.ft-s .ft-ico{position:absolute;filter:drop-shadow(0 10px 16px rgba(0,0,0,.18));pointer-events:none}' +
      '.ft-s .ft-op{cursor:pointer;transition:transform .15s,background .25s,border-color .25s}.ft-s .ft-op:hover{transform:translateY(-4px)}' +
      '.ft-s .ft-op.ft-certa{background:#31A889 !important;color:#fff !important;border-color:#31A889 !important;box-shadow:0 0 0 12px rgba(49,168,137,.25)}' +
      '.ft-s .ft-op.ft-errada{background:#fde8e8 !important;color:#b91c1c !important;border-color:#ef4444 !important;animation:ftTreme .4s}' +
      '@keyframes ftTreme{0%,100%{transform:translateX(0)}25%{transform:translateX(-12px)}75%{transform:translateX(12px)}}' +
      '.ft-s .ft-msg{opacity:0;transition:opacity .3s}.ft-s .ft-msg.on{opacity:1}';
    document.head.appendChild(css);
  }

  /* os ícones de enfeite: poucos e grandes, só nas bordas, nunca sobre título ou conteúdo (zona livre: 250 a 1670 px) */
  var POS_CAPA = [[40, 40, 170, -12], [1480, 50, 170, 10], [1710, 330, 190, -8], [1700, 800, 220, 12], [720, 860, 180, -10]];
  var POS = [[30, 30, 190, -10], [1700, 40, 200, 10], [1720, 470, 180, -8], [1700, 830, 210, 12], [30, 840, 200, 8]];
  function ico(base, n) { return base + 'assets/icones/fluent/' + encodeURIComponent(n) + '.svg'; }
  function enfeites(r, base, pos, desl) {
    return pos.map(function (q, i) { var n = r.icones[(i + desl) % r.icones.length]; return '<img class="ft-ico" alt="" src="' + ico(base, n) + '" onerror="this.remove()" style="left:' + q[0] + 'px;top:' + q[1] + 'px;width:' + q[2] + 'px;transform:rotate(' + q[3] + 'deg)">'; }).join('');
  }

  function montar(lesson, design, opts) {
    opts = opts || {};
    var base = opts.base || '', L = lesson || {}, r = receita(design), p = r.paleta, T = r.fontes.titulo, B = r.fontes.corpo;
    injetaCss(r, base);
    var cartao = r.escuro ? 'rgba(255,255,255,.08)' : '#ffffff', sobreDest = legivel('#ffffff', p.dest, '#111827'), sobrePrim = legivel('#ffffff', p.prim, '#111827');
    var es = L.language === 'spanish';
    var rot = es ? { iw: 'Palabras Importantes', intro: 'Introducción', pw: 'Conversación en Parejas', jogo: 'Juego de Lengua', rev: '¿Te acuerdas?', av: 'Evaluación', fim: '¡Hasta la próxima clase!', mat: 'Material', obj: 'Objetivos', clique: 'clic para la traducción' }
      : { iw: 'Important Words', intro: 'Introduction', pw: 'Pair Work', jogo: 'Language Game', rev: 'Do You Remember?', av: 'Activity Evaluation', fim: 'See you next class!', mat: 'Material Needed', obj: 'Objectives', clique: 'clique para a tradução' };
    var slides = [], desl = 0;
    function novo(tipo, corpo, capa) {
      var el = document.createElement('div'); el.className = 'ft-s';
      el.style.cssText = fundoCss(r) + 'font-family:"' + B + '",sans-serif;color:' + p.txt;
      el.innerHTML = enfeites(r, base, capa ? POS_CAPA : POS, desl++) + '<div style="position:absolute;left:0;top:0;right:0;height:24px;background:linear-gradient(90deg,' + p.prim + ',' + p.sec + ',' + p.dest + ')"></div>' + corpo;
      var etapas = 0; [].forEach.call(el.querySelectorAll('[data-e]'), function (x) { etapas = Math.max(etapas, +x.getAttribute('data-e')); });
      slides.push({ tipo: tipo, etapas: etapas, el: el });
      return el;
    }
    var h2 = function (t) { return '<h2 style="position:absolute;left:250px;top:60px;margin:0;font:800 100px/1.1 \'' + T + '\';color:' + p.prim + '">' + esc(t) + '</h2>'; };
    var balao = '<div style="position:absolute;left:70px;bottom:60px;background:#fff;border:6px solid #111;border-radius:40px;padding:26px 40px;transform:rotate(-4deg);box-shadow:8px 8px 0 rgba(0,0,0,.15)"><img alt="FISK" src="' + base + 'assets/fisk-marca.png" style="height:110px;display:block"></div>';
    var chip = function (t, bg, cor) { return '<span style="display:inline-block;font-weight:800;font-size:34px;padding:10px 26px;border-radius:99px;letter-spacing:.06em;background:' + bg + ';color:' + cor + ';margin-right:12px">' + esc(t) + '</span>'; };

    /* 1. capa */
    novo('capa', '<div style="position:absolute;left:200px;top:220px;width:900px">' + chip(es ? 'CONVERSACIÓN' : 'CONVERSATION', p.dest, sobreDest) +
      '<div style="font:800 132px/1.04 \'' + T + '\';margin:36px 0 34px;color:' + p.prim + '">' + esc(L.coverTitle || L.topic || '') + '</div>' +
      (L.coverLevel ? chip(String(L.coverLevel).toUpperCase(), p.prim, sobrePrim) : '') + (L.perfil ? chip(L.perfil, p.sec, legivel('#111827', p.sec, '#ffffff')) : '') + '</div>' +
      '<img alt="" src="' + ico(base, r.heroi) + '" onerror="this.remove()" style="position:absolute;right:170px;top:290px;width:480px;filter:drop-shadow(0 30px 40px rgba(0,0,0,.28))">' + balao, true);
    /* 2. objetivos, um por clique */
    if ((L.objectives || []).length) novo('objetivos', h2(rot.obj) + '<div style="position:absolute;left:250px;right:250px;top:270px">' + L.objectives.map(function (o, i) {
      return '<div data-e="' + (i + 1) + '" class="ft-off" style="display:flex;gap:28px;align-items:center;margin-bottom:46px"><span style="flex:none;width:90px;height:90px;border-radius:28px;background:' + p.dest + ';color:' + sobreDest + ';font:800 54px \'' + T + '\';display:flex;align-items:center;justify-content:center">' + (i + 1) + '</span><span style="font-size:64px;font-weight:800;line-height:1.2">' + esc(o) + '</span></div>'; }).join('') + '</div>');
    /* 3. abertura do capítulo e vocabulário (a tradução num clique separado, palavra por palavra) */
    var divisor = function (t, n) { return novo('divisor', '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:30px"><img alt="" src="' + ico(base, r.icones[n % r.icones.length]) + '" onerror="this.remove()" style="width:260px"><div style="font:800 150px/1 \'' + T + '\';color:' + p.prim + ';text-align:center">' + esc(t) + '</div></div>'); };
    var voc = L.vocabulary || [];
    if (voc.length) {
      divisor(rot.iw, 0);
      var longa = voc.some(function (v) { return String(v.word).length > 14; }), cols = longa ? 3 : 4;
      novo('vocabulario', h2(rot.iw) + '<div style="position:absolute;left:250px;right:250px;top:240px;display:grid;grid-template-columns:repeat(' + cols + ',minmax(0,1fr));gap:24px">' + voc.map(function (v, i) {
        var maior = Math.max.apply(null, String(v.word).split(/\s+/).map(function (x) { return x.length; }));
        return '<div data-carta="' + (i + 1) + '" style="background:' + cartao + ';border-radius:26px;padding:24px 28px;border:4px solid ' + p.sec + ';cursor:pointer;min-height:' + (voc.length > 8 ? 150 : 190) + 'px">' +
          '<div style="font:800 ' + Math.min(58, Math.floor((longa ? 440 : 330) / (0.6 * maior))) + 'px/1.1 \'' + T + '\';color:' + p.prim + '">' + esc(v.word) + '</div>' +
          '<div data-e="' + (i + 1) + '" class="ft-trad ft-off" style="font-size:42px;font-weight:700;margin-top:10px;color:' + legivel(p.dest, r.escuro ? p.fundo : '#ffffff') + '">' + esc(v.translation) + '</div></div>'; }).join('') + '</div>');
    }
    /* 4. introdução */
    if (L.introText) { divisor(rot.intro, 1); novo('introducao', h2(rot.intro) + '<div style="position:absolute;left:250px;right:250px;top:250px;font-size:' + (String(L.introText).length > 420 ? 48 : 58) + 'px;font-weight:700;line-height:1.35">' + esc(L.introText).replace(/\n\n/g, '<br><br>') + '</div>'); }
    /* 5. pair work: 3 ou 4 perguntas por slide, uma por clique; o começo de resposta aparece com a pergunta */
    var conv = L.conversation || [];
    if (conv.length) {
      var porSlide = conv.length % 4 === 0 && conv.length >= 8 ? 4 : 3, n0 = 0;
      for (var k = 0; k < conv.length; k += porSlide) (function (grupo) {
        novo('conversa', h2(rot.pw) + '<div style="position:absolute;left:250px;right:250px;top:240px">' + grupo.map(function (q, j) {
          var num = n0 + j + 1;
          return '<div data-e="' + (j + 1) + '" class="ft-off" style="display:flex;gap:28px;align-items:flex-start;margin-bottom:' + (porSlide === 4 ? 30 : 44) + 'px"><span style="flex:none;width:96px;height:96px;border-radius:30px;background:' + p.dest + ';color:' + sobreDest + ';font:800 56px \'' + T + '\';display:flex;align-items:center;justify-content:center">' + num + '</span><div><div style="font-size:' + (porSlide === 4 ? 56 : 64) + 'px;font-weight:800;line-height:1.18">' + esc(q.question) + '</div>' +
            ((q.modelAnswers || []).length ? '<div style="font-size:40px;font-weight:600;opacity:.75;margin-top:8px">' + q.modelAnswers.map(esc).join(' · ') + '</div>' : '') + '</div></div>'; }).join('') + '</div>');
        n0 += grupo.length;
      })(conv.slice(k, k + porSlide));
    }
    /* 6. o jogo: um item por slide, opções clicáveis (o professor toca e a tela diz); o clique seguinte revela a certa */
    var jogo = L.languageGame || [];
    if (jogo.length) {
      divisor(rot.jogo, 2);
      jogo.forEach(function (g, gi) {
        novo('jogo', h2(rot.jogo + ' · ' + (gi + 1) + '/' + jogo.length) +
          '<div style="position:absolute;left:250px;right:250px;top:270px;font:800 ' + (String(g.question).length > 70 ? 74 : 90) + 'px/1.2 \'' + T + '\'">' + esc(g.question) + '</div>' +
          '<div data-jogo="' + g.correctIndex + '" style="position:absolute;left:250px;right:250px;top:600px;display:flex;gap:40px">' + (g.options || []).map(function (o, i) {
            return '<button type="button" class="ft-op" data-op="' + i + '" style="flex:1;font:800 64px \'' + B + '\';border-radius:30px;padding:34px 20px;background:' + cartao + ';color:' + p.txt + ';border:5px solid ' + p.sec + '">' + 'abc'[i] + ') ' + esc(o) + '</button>'; }).join('') + '</div>' +
          '<div class="ft-msg" style="position:absolute;left:250px;right:250px;top:830px;text-align:center;font-size:56px;font-weight:900"></div>' +
          '<span data-e="1" class="ft-off ft-revela" hidden></span>' +
          (g.source ? '<div style="position:absolute;left:250px;bottom:40px;font-size:26px;font-weight:700;opacity:.55">' + esc(g.source) + '</div>' : ''));
      });
    }
    /* 7. revisão: o português primeiro, o inglês no clique */
    if (voc.length) {
      var longaR = voc.some(function (v) { return String(v.word).length > 14 || String(v.translation).length > 16; }), colsR = longaR ? 3 : 4;
      var tam = function (t, larg, max) { var m = Math.max.apply(null, String(t).split(/\s+/).map(function (x) { return x.length; })); return Math.min(max, Math.floor(larg / (0.6 * m))); };
      novo('revisao', h2(rot.rev) + '<div style="position:absolute;left:250px;right:250px;top:240px;display:grid;grid-template-columns:repeat(' + colsR + ',minmax(0,1fr));gap:24px">' + voc.map(function (v, i) {
        var larg = longaR ? 440 : 330;
        return '<div data-carta="' + (i + 1) + '" style="background:' + cartao + ';border-radius:26px;padding:24px 28px;border:4px solid ' + p.sec + ';cursor:pointer;min-height:170px"><div style="font-size:' + tam(v.translation, larg, 44) + 'px;font-weight:700;color:' + legivel(p.dest, r.escuro ? p.fundo : '#ffffff') + '">' + esc(v.translation) + '</div><div data-e="' + (i + 1) + '" class="ft-trad ft-off" style="font:800 ' + tam(v.word, larg, 54) + 'px/1.1 \'' + T + '\';color:' + p.prim + ';margin-top:10px">' + esc(v.word) + '</div></div>'; }).join('') + '</div>');
    }
    /* 8. avaliação e fechamento (com o balão da FISK) */
    if ((L.evaluation || []).length) novo('avaliacao', h2(rot.av) + '<div style="position:absolute;left:250px;right:250px;top:260px">' + L.evaluation.map(function (q, j) {
      return '<div data-e="' + (j + 1) + '" class="ft-off" style="font-size:64px;font-weight:800;line-height:1.2;margin-bottom:50px">' + esc(q.question) + '</div>'; }).join('') + '</div>');
    novo('fechamento', '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="font:800 150px/1.05 \'' + T + '\';color:' + p.prim + ';text-align:center;max-width:1300px">' + esc(rot.fim) + '</div></div>' + balao, true);

    slides.forEach(function (s) { ligar(s); });
    return { slides: slides, receita: r };
  }

  /* o que é clicável dentro do slide: as cartas do vocabulário e as opções do jogo */
  function ligar(s) {
    var el = s.el;
    [].forEach.call(el.querySelectorAll('[data-carta]'), function (c) {
      c.addEventListener('click', function (ev) { ev.stopPropagation(); var t = c.querySelector('.ft-trad'); if (t) t.classList.remove('ft-off'); });
    });
    var j = el.querySelector('[data-jogo]');
    if (j) {
      var certa = +j.getAttribute('data-jogo'), msg = el.querySelector('.ft-msg');
      [].forEach.call(j.querySelectorAll('.ft-op'), function (b) {
        b.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var i = +b.getAttribute('data-op');
          if (i === certa) { var nova = !b.classList.contains('ft-certa'); b.classList.add('ft-certa'); msg.textContent = '🎉 Correct!'; msg.style.color = '#31A889'; if (nova && !ev.ftRevela) festa(el); }
          else { b.classList.remove('ft-errada'); void b.offsetWidth; b.classList.add('ft-errada'); msg.textContent = '✗ Try again!'; msg.style.color = '#dc2626'; }
          msg.classList.add('on');
        });
      });
    }
  }
  /* O ACERTO COMEMORA (Pedro, 27/11/2026: "tocar um sino de conquista e estourar confetes"): um sino curto feito na hora
     pelo próprio navegador (sem arquivo de som) e confete por cima do slide. FiskTema.som = false desliga o sino
     (testes, reunião); quem prefere menos movimento no sistema não recebe o confete. */
  var ctxSom = null;
  function sino() {
    if (raiz.FiskTema && raiz.FiskTema.som === false) return;
    try {
      ctxSom = ctxSom || new (window.AudioContext || window.webkitAudioContext)();
      var t = ctxSom.currentTime;
      [[880, 0], [1318.5, .12], [1760, .24]].forEach(function (n) {
        var o = ctxSom.createOscillator(), g = ctxSom.createGain();
        o.type = 'sine'; o.frequency.value = n[0];
        g.gain.setValueAtTime(0, t + n[1]); g.gain.linearRampToValueAtTime(.22, t + n[1] + .02); g.gain.exponentialRampToValueAtTime(.001, t + n[1] + .9);
        o.connect(g); g.connect(ctxSom.destination); o.start(t + n[1]); o.stop(t + n[1] + 1);
      });
    } catch (e) {}
  }
  function confete(el) {
    try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    var c = document.createElement('canvas'); c.width = 1920; c.height = 1080;
    c.style.cssText = 'position:absolute;inset:0;width:1920px;height:1080px;pointer-events:none;z-index:20';
    el.appendChild(c);
    var g = c.getContext('2d'), cores = ['#31A889', '#facc15', '#ec4899', '#3b82f6', '#f97316', '#a855f7'], ps = [];
    for (var k = 0; k < 180; k++) ps.push({ x: 960 + (Math.random() - .5) * 400, y: 640, vx: (Math.random() - .5) * 34, vy: -Math.random() * 34 - 12, r: Math.random() * 6.3, vr: (Math.random() - .5) * .4, w: 14 + Math.random() * 14, h: 8 + Math.random() * 10, cor: cores[k % cores.length] });
    var t0 = performance.now();
    (function passo(t) {
      g.clearRect(0, 0, 1920, 1080);
      ps.forEach(function (q) { q.vy += .9; q.vx *= .99; q.x += q.vx; q.y += q.vy; q.r += q.vr; g.save(); g.translate(q.x, q.y); g.rotate(q.r); g.fillStyle = q.cor; g.fillRect(-q.w / 2, -q.h / 2, q.w, q.h); g.restore(); });
      if (t - t0 < 2600) requestAnimationFrame(passo); else c.remove();
    })(t0);
  }
  function festa(el) { sino(); confete(el); }
  /* aplica a etapa: tudo com data-e <= etapa aparece; no jogo, a etapa 1 revela a opção certa (sem festa: quem
     comemora é o acerto clicado, não a resposta revelada) */
  function mostrar(deck, i, etapa) {
    var s = deck.slides[i]; if (!s) return;
    [].forEach.call(s.el.querySelectorAll('[data-e]'), function (x) { x.classList.toggle('ft-off', +x.getAttribute('data-e') > etapa); });
    var j = s.el.querySelector('[data-jogo]');
    if (j && etapa >= 1) { var b = j.querySelector('[data-op="' + j.getAttribute('data-jogo') + '"]'); if (b) b.dispatchEvent(Object.assign(new MouseEvent('click', { bubbles: true }), { ftRevela: true })); }
  }
  function encaixar(el, caixa) {
    var w = caixa.clientWidth, h = caixa.clientHeight, k = Math.min(w / 1920, h / 1080);
    el.style.transform = 'scale(' + k + ')'; el.style.position = 'absolute'; el.style.left = ((w - 1920 * k) / 2) + 'px'; el.style.top = ((h - 1080 * k) / 2) + 'px';
  }
  raiz.FiskTema = { montar: montar, mostrar: mostrar, encaixar: encaixar, receita: receita, contraste: contraste, FONTES_OK: FONTES_OK };
})(typeof window !== 'undefined' ? window : this);
