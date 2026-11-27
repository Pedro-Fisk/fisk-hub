/* O DESENHISTA DE SLIDES DO CONVERSATION MAKER (Pedro, 27/11/2026: "a parte mais importante é o visual criado por
 * atividade"). Transforma o conteúdo de uma aula (o mesmo `lesson` do Conversation Maker) e a RECEITA DO VISUAL que a
 * IA devolve junto (`design`) em slides 1920×1080 com os cliques da sala: a tradução do vocabulário aparece num clique
 * separado, as perguntas entram uma a uma, o jogo é clicável (o professor toca na opção e a tela diz se acertou).
 * Serve à prévia do Conversation Maker e à conversação do Hub. Sem dependências; ícones Fluent Emoji (Microsoft, MIT)
 * guardados no próprio Hub (assets/icones/fluent/<nome>.svg), para não depender de serviço de fora.
 *
 *   var deck = FiskTema.montar(lesson, design, { base: 'https://pedro-fisk.github.io/fisk-hub/' })
 *   deck.slides  → [{ tipo, etapas, el, jogo? }]   (jogo = { pergunta, opcoes, certa } no slide de Language Game; nos tipos
 *                  novos também jogo.tipo = 'ordem' | 'pares' | 'digitar' e, nos pares, jogo.direita)   (el = <div class="ft-s"> de 1920×1080; etapas = quantos cliques ele tem)
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

  /* embaralha sempre igual para a mesma semente, e nunca devolve a ordem certa (senão o jogo de ordenar estaria pronto) */
  function embaralha(arr, semente) {
    var h = 2166136261; for (var i = 0; i < semente.length; i++) { h ^= semente.charCodeAt(i); h = Math.imul(h, 16777619); }
    var rnd = function () { h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    var a = arr.slice();
    for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(rnd() * (k + 1)), x = a[k]; a[k] = a[j]; a[j] = x; }
    if (a.length > 1 && a.every(function (x, i) { return x === arr[i]; })) a.push(a.shift());
    return a;
  }
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
  function alfa(hex, a) { var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '')); if (!m) return hex; var n = parseInt(m[1], 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function fundoCss(r) {
    var p = r.paleta;
    if (r.fundo === 'gradiente' || r.escuro) return 'background:linear-gradient(160deg,' + p.fundo + ' 0%,' + p.fundo2 + ' 75%);';
    if (r.fundo === 'estrelas') return 'background-color:' + p.fundo + ';background-image:radial-gradient(2px 2px at 20% 30%,#fff 50%,transparent 51%),radial-gradient(2px 2px at 70% 60%,#fff 50%,transparent 51%),radial-gradient(3px 3px at 40% 80%,#c7d2fe 50%,transparent 51%),radial-gradient(2px 2px at 85% 15%,#fff 50%,transparent 51%),linear-gradient(160deg,' + p.fundo + ',' + p.fundo2 + ');';
    if (r.fundo === 'pontos') return 'background-color:' + p.fundo + ';background-image:radial-gradient(' + p.fundo2 + ' 3px,transparent 3.5px);background-size:46px 46px;';
    /* faixas finas e claras (Pedro 27/11/2026: as listras largas atrapalhavam a leitura das perguntas) */
    if (r.fundo === 'faixas') return 'background-color:' + p.fundo + ';background-image:repeating-linear-gradient(135deg,' + alfa(p.fundo2, 0.45) + ' 0 10px,transparent 10px 120px);';
    return 'background-color:' + p.fundo + ';background-image:radial-gradient(circle at 92% 12%,' + p.fundo2 + ' 0 230px,transparent 231px),radial-gradient(circle at 6% 92%,' + p.fundo2 + ' 0 260px,transparent 261px);';
  }

  var css = null;
  function injetaCss(r, base) {
    var id = 'ft-css-' + (r.fontes.titulo + r.fontes.corpo).replace(/\W/g, '');
    if (document.getElementById(id)) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.id = id; l.crossOrigin = 'anonymous';   /* o PDF de backup precisa ler as regras da fonte para embuti-la */
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
        /* PRONÚNCIA (27/11/2026): o 🔊 do canto toca a palavra em voz neural (FiskTema.aoOuvir, como no ouça e escolha) */
        return '<div data-carta="' + (i + 1) + '" style="position:relative;background:' + cartao + ';border-radius:26px;padding:24px 28px;border:4px solid ' + p.sec + ';cursor:pointer;min-height:' + (voc.length > 8 ? 150 : 190) + 'px">' +
          '<button type="button" class="ft-ouvir" data-ouvir="' + esc(v.word) + '" title="Ouvir" style="position:absolute;right:14px;top:14px;width:62px;height:62px;border-radius:50%;border:0;cursor:pointer;background:' + p.dest + ';color:' + sobreDest + ';font-size:30px;line-height:1">🔊</button>' +
          '<div style="font:800 ' + Math.min(58, Math.floor((longa ? 440 : 330) / (0.6 * maior))) + 'px/1.1 \'' + T + '\';color:' + p.prim + '">' + esc(v.word) + '</div>' +
          '<div data-e="' + (i + 1) + '" class="ft-trad ft-off" style="font-size:42px;font-weight:700;margin-top:10px;color:' + legivel(p.dest, r.escuro ? p.fundo : '#ffffff') + '">' + esc(v.translation) + '</div></div>'; }).join('') + '</div>');
      slides[slides.length - 1].vocab = voc.map(function (v) { return String(v.word || '').trim(); }).filter(Boolean);
    }
    /* 4. introdução */
    if (L.introText) { divisor(rot.intro, 1); novo('introducao', h2(rot.intro) + '<div style="position:absolute;left:250px;right:250px;top:250px;font-size:' + (String(L.introText).length > 420 ? 48 : 58) + 'px;font-weight:700;line-height:1.35">' + esc(L.introText).replace(/\n\n/g, '<br><br>') + '</div>'); }
    /* 5. pair work: 3 perguntas por slide, uma por clique; o começo de resposta aparece com a pergunta.
       Sem o título "Pair Work" em cada slide (Pedro 27/11/2026): um divisor anuncia uma vez, e as perguntas ganham a tela, centradas */
    var conv = L.conversation || [];
    if (conv.length) {
      var porSlide = 3, n0 = 0;
      divisor(rot.pw, 3);
      for (var k = 0; k < conv.length; k += porSlide) (function (grupo) {
        /* respostas-modelo uma por linha, com marcador (Pedro 27/11/2026), maiores que antes (40px); a carga do slide
           (linhas de pergunta + linhas de resposta) decide se cabe no tamanho cheio ou um degrau abaixo */
        var carga = 0; grupo.forEach(function (q) { carga += Math.ceil(String(q.question).length / 42) * 76 + (q.modelAnswers || []).reduce(function (s, r) { return s + Math.ceil(String(r).length / 58) * 60 + 6; }, 0) + 44; });
        var cheio = carga > 840, tamQ = cheio ? 56 : 64, tamR = cheio ? 42 : 48;
        /* cada pergunta num card que aparece com ela (Pedro 27/11/2026: mesmo clareando, o fundo atrapalhava a leitura) */
        var fundoCard = r.escuro ? alfa(p.fundo, 0.92) : 'rgba(255,255,255,.96)';
        novo('conversa', '<div style="position:absolute;left:220px;right:220px;top:60px;bottom:50px;display:flex;flex-direction:column;justify-content:center">' + grupo.map(function (q, j) {
          var num = n0 + j + 1;
          return '<div data-e="' + (j + 1) + '" class="ft-off" style="display:flex;gap:28px;align-items:flex-start;margin-bottom:' + (cheio ? 20 : 30) + 'px;background:' + fundoCard + ';border-radius:32px;padding:' + (cheio ? 20 : 28) + 'px 36px;box-shadow:0 10px 30px rgba(0,0,0,.10)' + (r.escuro ? ';border:2px solid rgba(255,255,255,.10)' : '') + '"><span style="flex:none;width:96px;height:96px;border-radius:30px;background:' + p.dest + ';color:' + sobreDest + ';font:800 56px \'' + T + '\';display:flex;align-items:center;justify-content:center">' + num + '</span><div><div style="font-size:' + tamQ + 'px;font-weight:800;line-height:1.18">' + esc(q.question) + '</div>' +
            ((q.modelAnswers || []).length ? '<ul style="list-style:none;margin:10px 0 0;padding:0;font-size:' + tamR + 'px;font-weight:600;line-height:1.25">' + q.modelAnswers.map(function (r) { return '<li style="display:flex;gap:16px;margin-top:6px"><span style="color:' + p.dest + ';flex:none">•</span><span style="opacity:.85">' + esc(r) + '</span></li>'; }).join('') + '</ul>' : '') + '</div></div>'; }).join('') + '</div>');
        n0 += grupo.length;
      })(conv.slice(k, k + porSlide));
    }
    /* 6. o jogo: um item por slide, opções clicáveis (o professor toca e a tela diz); o clique seguinte revela a certa */
    var jogo = L.languageGame || [];
    if (jogo.length) {
      divisor(rot.jogo, 2);
      jogo.forEach(function (g, gi) {
        var titJ = h2(rot.jogo + ' · ' + (gi + 1) + '/' + jogo.length);
        if (g.type === 'order' || g.type === 'match' || g.type === 'type_in') { jogoNovo(g, titJ); return; }
        /* OUÇA E ESCOLHA (item 6, 27/11/2026): a pergunta é um áudio (voz neural, api/voz.js do portal, tocada pela
           conversacao.html por FiskTema.aoOuvir); o 🔊 toca de novo, e a revelação mostra o que foi dito */
        var ouve = g.type === 'listen' && g.audio;
        novo('jogo', titJ +
          (ouve ? '<div style="position:absolute;left:250px;right:250px;top:250px;display:flex;align-items:center;gap:44px">' +
              '<button type="button" class="ft-ouvir" data-ouvir="' + esc(g.audio) + '" style="flex:none;width:200px;height:200px;border-radius:50%;border:0;cursor:pointer;background:' + p.dest + ';color:' + sobreDest + ';font-size:96px;box-shadow:0 12px 30px rgba(0,0,0,.18)">🔊</button>' +
              '<div style="font:800 ' + (String(g.question).length > 50 ? 62 : 76) + 'px/1.2 \'' + T + '\'">' + esc(g.question) + '</div></div>' +
              /* ⚠️ nada de opacity no style deste elemento: a opacidade escrita no elemento vence o .ft-off e a frase (que
                 em "o que você ouviu?" É a resposta) aparecia na foto da pergunta dos celulares (bancada, 27/11/2026) */
              '<div data-e="1" class="ft-off" style="position:absolute;left:250px;right:250px;top:475px;font:700 50px/1.25 \'' + B + '\';font-style:italic"><span style="color:' + p.txt + ';filter:opacity(.85)">“' + esc(g.audio) + '”</span></div>'
            : '<div style="position:absolute;left:250px;right:250px;top:270px;font:800 ' + (String(g.question).length > 70 ? 74 : 90) + 'px/1.2 \'' + T + '\'">' + esc(g.question) + '</div>') +
          '<div data-jogo="' + g.correctIndex + '" style="position:absolute;left:250px;right:250px;top:600px;display:flex;gap:40px">' + (g.options || []).map(function (o, i) {
            /* a letra encolhe com a alternativa mais longa: duas linhas de 64 px empurravam o "Correct!" para cima dos botões */
            var maior = Math.max.apply(null, (g.options || []).map(function (x) { return String(x).length; }).concat([1])), fsOp = maior > 22 ? 46 : maior > 14 ? 54 : 64;
            return '<button type="button" class="ft-op" data-op="' + i + '" style="flex:1;font:800 ' + fsOp + 'px \'' + B + '\';border-radius:30px;padding:34px 20px;background:' + cartao + ';color:' + p.txt + ';border:5px solid ' + p.sec + '">' + 'abc'[i] + ') ' + esc(o) + '</button>'; }).join('') + '</div>' +
          '<div class="ft-msg" style="position:absolute;left:250px;right:250px;top:' + ((g.options || []).some(function (x) { return String(x).length > 22; }) ? 880 : 830) + 'px;text-align:center;font-size:56px;font-weight:900"></div>' +
          '<span data-e="1" class="ft-off ft-revela" hidden></span>' +
          (g.source ? '<div style="position:absolute;left:250px;bottom:40px;font-size:26px;font-weight:700;opacity:.55">' + esc(g.source) + '</div>' : ''));
        /* o item cru, para o jogo clicável no celular dos alunos (conversacao.html → portal api/aula.js) */
        slides[slides.length - 1].jogo = { pergunta: String(g.question || ''), opcoes: (g.options || []).map(String), certa: +g.correctIndex };
        if (ouve) slides[slides.length - 1].jogo.ouvir = String(g.audio);
      });
    }
    /* OS TIPOS NOVOS DO JOGO (item 7, Pedro 27/11/2026). No dado da aula, todos usam "options" (o editor do Conversation
       Maker só sabe editar lista): order = as palavras NA ORDEM CERTA; match = "palavra = par"; type_in = as respostas
       aceitas, a primeira é a que aparece. Na TV ninguém clica: o clique seguinte revela, como na múltipla escolha. O
       embaralhamento é DETERMINÍSTICO (pela pergunta e pelas palavras), porque a TV e a foto dos celulares saem de dois
       decks montados à parte e precisam mostrar a mesma ordem. */
    function jogoNovo(g, titJ) {
      var ops = (g.options || []).map(function (x) { return String(x == null ? '' : x).trim(); }).filter(Boolean), q = String(g.question || '');
      var caixa = 'background:' + cartao + ';border:5px solid ' + p.sec + ';border-radius:26px;color:' + p.txt;
      var verde = 'background:#31A889;color:#fff;border-radius:26px;box-shadow:0 0 0 12px rgba(49,168,137,.22)';
      var perg = '<div style="position:absolute;left:250px;right:250px;top:250px;font:800 ' + (q.length > 70 ? 64 : 78) + 'px/1.2 \'' + T + '\'">' + esc(q) + '</div>';
      var fonte = g.source ? '<div style="position:absolute;left:250px;bottom:40px;font-size:26px;font-weight:700;opacity:.55">' + esc(g.source) + '</div>' : '';
      var revela = '<span data-e="1" class="ft-off ft-revela" hidden></span>';
      if (g.type === 'order') {
        var emb = embaralha(ops.map(function (x, i) { return i; }), q + '|' + ops.join(' '));
        /* a letra encolhe com a frase, para as palavras caberem numa linha (duas, no máximo); a resposta e o gráfico
           ficam sempre EMBAIXO delas (mesma coluna), nunca por cima (achado na bancada com 6 palavras, 27/11/2026) */
        var tam = ops.join('').length + ops.length * 3, fsO = tam > 60 ? 44 : tam > 44 ? 50 : tam > 32 ? 56 : 64;
        novo('jogo', titJ + perg + '<div data-jogo2 style="position:absolute;left:250px;right:250px;top:420px;display:flex;flex-direction:column;gap:34px;align-items:center">' +
          '<div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:center">' +
          emb.map(function (i) { return '<span style="' + caixa + ';font:800 ' + fsO + 'px \'' + B + '\';padding:' + Math.round(fsO * 0.3) + 'px ' + Math.round(fsO * 0.5) + 'px">' + esc(ops[i]) + '</span>'; }).join('') + '</div>' +
          '<div data-e="1" class="ft-off" style="align-self:stretch;text-align:center;font:800 ' + Math.min(70, fsO + 6) + 'px/1.2 \'' + T + '\';padding:22px 40px;' + verde + '">✔ ' + esc(ops.join(' ')) + '</div></div>' + fonte);
        slides[slides.length - 1].jogo = { tipo: 'ordem', pergunta: q, opcoes: emb.map(function (i) { return ops[i]; }), certa: ops.slice() };
        return;
      }
      if (g.type === 'match') {
        var pares = ops.map(function (x) { var k = x.indexOf('='); return k > 0 ? [x.slice(0, k).trim(), x.slice(k + 1).trim()] : null; }).filter(function (x) { return x && x[0] && x[1]; }).slice(0, 6);
        var ord = embaralha(pares.map(function (x, i) { return i; }), q + '|' + ops.join('|'));
        var certa = pares.map(function (x, i) { return ord.indexOf(i); }), alt = pares.length > 4 ? 96 : 116, fs = pares.length > 4 ? 50 : 58;
        var linha = function (txt, extra) { return '<div style="' + caixa + ';height:' + (alt - 18) + 'px;display:flex;align-items:center;gap:20px;padding:0 30px;font:800 ' + fs + 'px \'' + B + '\'">' + extra + '<span style="flex:1">' + esc(txt) + '</span></div>'; };
        var tag = function (t, cor) { return '<b style="flex:none;width:64px;height:64px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:38px;background:' + cor + ';color:#fff">' + t + '</b>'; };
        novo('jogo', titJ + '<div style="position:absolute;left:250px;right:250px;top:200px;font:800 60px/1.2 \'' + T + '\'">' + esc(q) + '</div>' +
          '<div data-jogo2 style="position:absolute;left:250px;right:250px;top:310px;display:grid;grid-template-columns:1fr 1fr;column-gap:80px;row-gap:18px">' +
          pares.map(function (pr, i) {
            return linha(pr[0], tag(i + 1, p.dest) + '<span data-e="1" class="ft-off" style="order:3;flex:none;' + verde + ';border-radius:18px;padding:6px 18px;font-size:' + (fs - 8) + 'px">→ ' + 'ABCDEF'.charAt(certa[i]) + '</span>') +
              linha(pares[ord[i]][1], tag('ABCDEF'.charAt(i), p.prim));
          }).join('') + '</div>' + fonte);
        slides[slides.length - 1].jogo = { tipo: 'pares', pergunta: q, opcoes: pares.map(function (x) { return x[0]; }), direita: ord.map(function (i) { return pares[i][1]; }), certa: certa };
        return;
      }
      /* type_in */
      novo('jogo', titJ + perg + '<div data-jogo2 style="position:absolute;left:420px;right:420px;top:560px;height:150px;' + caixa + ';border-style:dashed;display:flex;align-items:center;justify-content:center;font:800 66px \'' + B + '\'">' +
        '<span style="opacity:.35">✍️</span></div>' +
        '<div data-e="1" class="ft-off" style="position:absolute;left:420px;right:420px;top:560px;height:150px;display:flex;align-items:center;justify-content:center;font:800 72px \'' + T + '\';' + verde + '">' + esc(ops[0] || '') + '</div>' + fonte);
      slides[slides.length - 1].jogo = { tipo: 'digitar', pergunta: q, opcoes: [], certa: ops.slice(0, 6) };
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

    slides.forEach(function (s) { s.es = es; ligar(s); });   /* es: o "Correct!" do jogo sai na língua da aula */
    return { slides: slides, receita: r };
  }

  /* o que é clicável dentro do slide: as cartas do vocabulário e as opções do jogo */
  function ligar(s) {
    var el = s.el;
    [].forEach.call(el.querySelectorAll('[data-carta]'), function (c) {
      c.addEventListener('click', function (ev) { ev.stopPropagation(); var t = c.querySelector('.ft-trad'); if (t) t.classList.remove('ft-off'); });
    });
    [].forEach.call(el.querySelectorAll('.ft-ouvir'), function (b) {
      b.addEventListener('click', function (ev) { ev.stopPropagation(); if (raiz.FiskTema && raiz.FiskTema.aoOuvir) raiz.FiskTema.aoOuvir(b.getAttribute('data-ouvir'), b); });
    });
    var j = el.querySelector('[data-jogo]');
    if (j) {
      var certa = +j.getAttribute('data-jogo'), msg = el.querySelector('.ft-msg');
      [].forEach.call(j.querySelectorAll('.ft-op'), function (b) {
        b.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var i = +b.getAttribute('data-op');
          if (i === certa) { var nova = !b.classList.contains('ft-certa'); b.classList.add('ft-certa'); msg.textContent = s.es ? '🎉 ¡Correcto!' : '🎉 Correct!'; msg.style.color = '#31A889'; if (nova && !ev.ftRevela) festa(el); }
          else { b.classList.remove('ft-errada'); void b.offsetWidth; b.classList.add('ft-errada'); msg.textContent = s.es ? '✗ ¡Inténtalo de nuevo!' : '✗ Try again!'; msg.style.color = '#dc2626'; }
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
  /* O PDF DE BACKUP (Pedro, 27/11/2026: "para mostrar futuramente no computador de novo"; o jogo "em dois slides
     separados, um só com a pergunta e o outro mostrando a resposta"). Cada slide entra com tudo revelado; cada item do
     jogo entra duas vezes. Desenha no próprio navegador (html-to-image + pdf-lib, pelo jsDelivr) e devolve os bytes. */
  function paginas(deck) {
    var out = [];
    deck.slides.forEach(function (s, i) {
      if (s.tipo === 'jogo') { out.push({ i: i, etapa: 0 }); out.push({ i: i, etapa: 1 }); }
      else out.push({ i: i, etapa: s.etapas });
    });
    return out;
  }
  function carregaScript(src, global) {
    return new Promise(function (ok, erro) {
      if (window[global]) return ok();
      var e = document.createElement('script'); e.src = src; e.onload = function () { ok(); }; e.onerror = function () { erro(new Error('não carregou ' + src)); }; document.head.appendChild(e);
    });
  }
  function gerarPdf(deck, aoAndar) {
    return carregaScript('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js', 'htmlToImage')
      .then(function () { return carregaScript('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js', 'PDFLib'); })
      .then(function () { return document.fonts && document.fonts.ready; })
      .then(function () {
        var pags = paginas(deck), palco = document.createElement('div');
        palco.style.cssText = 'position:fixed;left:-30000px;top:0;width:1920px;height:1080px;overflow:hidden';
        document.body.appendChild(palco);
        var imgs = [], cadeia = Promise.resolve();
        pags.forEach(function (pg, k) {
          cadeia = cadeia.then(function () {
            var s = deck.slides[pg.i], el = s.el, antes = el.style.cssText;
            palco.innerHTML = ''; palco.appendChild(el);
            el.style.transform = 'none'; el.style.left = '0px'; el.style.top = '0px';
            [].forEach.call(el.querySelectorAll('.ft-op'), function (b) { b.classList.remove('ft-certa', 'ft-errada'); });
            var msg = el.querySelector('.ft-msg'); if (msg) msg.classList.remove('on');
            el.querySelectorAll('[data-e]').forEach(function (x) { x.style.transition = 'none'; });
            mostrar(deck, pg.i, pg.etapa);
            return new Promise(function (r) { setTimeout(r, 80); })
              .then(function () { return window.htmlToImage.toJpeg(el, { width: 1920, height: 1080, pixelRatio: 1, quality: 0.85, cacheBust: false }); })
              .then(function (url) { imgs.push(url); el.style.cssText = antes; el.querySelectorAll('[data-e]').forEach(function (x) { x.style.transition = ''; }); if (aoAndar) aoAndar(k + 1, pags.length); });
          });
        });
        return cadeia.then(function () {
          palco.remove();
          return window.PDFLib.PDFDocument.create().then(function (pdf) {
            var c2 = Promise.resolve();
            imgs.forEach(function (url) {
              c2 = c2.then(function () { return pdf.embedJpg(url); }).then(function (img) { var page = pdf.addPage([960, 540]); page.drawImage(img, { x: 0, y: 0, width: 960, height: 540 }); });
            });
            return c2.then(function () { return pdf.save(); });
          });
        });
      });
  }
  /* A FOTO DE UM CLIQUE para o celular dos alunos (27/11/2026): o slide i na etapa dada, como JPEG de "largura" px.
     Use um deck SÓ para fotos (outro montar), porque o slide sai da tela por um instante: o da TV não pode piscar. */
  var fotoFila = Promise.resolve();
  function foto(deck, i, etapa, largura) {
    var r = fotoFila.then(function () {
      return carregaScript('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js', 'htmlToImage');
    }).then(function () { return document.fonts && document.fonts.ready; }).then(function () {
      var s = deck.slides[i]; if (!s) throw new Error('sem o slide ' + (i + 1));
      var palco = document.createElement('div'), el = s.el;
      palco.style.cssText = 'position:fixed;left:-30000px;top:0;width:1920px;height:1080px;overflow:hidden';
      document.body.appendChild(palco); palco.appendChild(el);
      el.style.transform = 'none'; el.style.position = 'absolute'; el.style.left = '0px'; el.style.top = '0px';
      el.querySelectorAll('[data-e]').forEach(function (x) { x.style.transition = 'none'; });
      [].forEach.call(el.querySelectorAll('.ft-op'), function (b) { b.classList.remove('ft-certa', 'ft-errada'); });
      var msg = el.querySelector('.ft-msg'); if (msg) msg.classList.remove('on');
      var som = raiz.FiskTema.som; raiz.FiskTema.som = false; mostrar(deck, i, etapa); raiz.FiskTema.som = som;
      return new Promise(function (ok) { setTimeout(ok, 60); })
        .then(function () {
          /* onde cada opção do jogo está desenhada (frações do slide): o celular põe a área de toque em cima dela */
          if (s.jogo) { var b0 = el.getBoundingClientRect(); s.jogo.areas = [].map.call(el.querySelectorAll('.ft-op'), function (b) {
            var r = b.getBoundingClientRect(), f = function (v, t) { return Math.round(v / t * 10000) / 10000; };
            return [f(r.left - b0.left, 1920), f(r.top - b0.top, 1080), f(r.width, 1920), f(r.height, 1080)]; }); } var k = (largura || 1280) / 1920; return window.htmlToImage.toJpeg(el, { width: 1920, height: 1080, pixelRatio: k, quality: 0.75, cacheBust: false }); })
        .then(function (url) { palco.remove(); return url; }, function (e) { palco.remove(); throw e; });
    });
    fotoFila = r.catch(function () {});
    return r;
  }
  raiz.FiskTema = { montar: montar, mostrar: mostrar, encaixar: encaixar, receita: receita, contraste: contraste, paginas: paginas, gerarPdf: gerarPdf, foto: foto, FONTES_OK: FONTES_OK };
})(typeof window !== 'undefined' ? window : this);
