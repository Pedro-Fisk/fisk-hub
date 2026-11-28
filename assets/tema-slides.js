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
    if (design && design.pele === 'youtuber') {   /* a série YouTubers tem montador próprio (montaYt, abaixo) */
      var sy = montaYt(L, design, base, T, B);
      sy.forEach(function (s0) { s0.es = false; ligar(s0); });
      return { slides: sy, receita: r };
    }
    /* A PELE DAS BUDDY TALKS (Pedro, 28/11/2026: "mais parecido com a arte original, com a imagem original do urso"):
       fundo preto nos slides grandes e vinho nos de conteúdo, a faixa listrada vermelha e branca, o Buddy de busto nos
       slides grandes e a cabeça dele no canto dos de conteúdo (para não cobrir o texto), a introdução em balões de fala.
       As imagens são as do PowerPoint original, em buddy-talks/img/. design.pele = 'buddy' liga; o resto não muda. */
    var pele = design && design.pele === 'buddy' ? { img: base + (design.imgs || 'buddy-talks/img/') } : null;
    /* A PELE DO EVERYDAY LIFE (Pedro, 28/11/2026: refazer a série sem descaracterizar a arte): slides pretos com as faixas
       da série no topo e no rodapé (azul-marinho e amarelo no Basic, verde-água no Advanced), a foto do tema no painel
       da direita e os títulos em imagem do PowerPoint (logo, IMPORTANT WORDS, Conversation), em everyday-life/img/. */
    var vida = design && design.pele === 'everyday' ? { img: base + (design.imgs || 'everyday-life/img/'), c1: design.faixa1 || '#002060', c2: design.faixa2 || '#FFC000', dest: design.destaque || '#FFC000', f: L.fotosSerie || {} } : null;
    function vUrl(n) { return /^https?:|^\//.test(String(n)) ? String(n) : vida.img + n; }
    function vFoto(k) { var f = vida.f[k] || vida.f.conv || vida.f.iw || vida.f.capa; return f ? vUrl(f) : ''; }
    function vFaixas() { return '<div style="position:absolute;left:0;right:0;top:0;height:30px;background:' + vida.c1 + '"></div><div style="position:absolute;left:0;right:0;top:30px;height:8px;background:' + vida.c2 + '"></div>' +
      '<div style="position:absolute;left:0;right:0;bottom:30px;height:8px;background:' + vida.c2 + '"></div><div style="position:absolute;left:0;right:0;bottom:0;height:30px;background:' + vida.c1 + '"></div>'; }
    function vPainel(foto) { return foto ? '<div style="position:absolute;right:0;top:0;bottom:0;width:640px;background:#222 url(&quot;' + esc(foto) + '&quot;) center/cover no-repeat"></div>' : ''; }
    /* A PELE DE COUNTRIES (Pedro, 28/11/2026: as atividades de países do Drive Master): como o PowerPoint original,
       fotos do país em tela cheia e painéis brancos com o título azul-marinho; nos slides de conteúdo, a foto escurecida
       por trás. design.pele = 'countries'; as fotos vêm de L.fotos e de L.pais (countries/img/, ao lado da página). */
    var cp = design && design.pele === 'countries' ? { img: base + (design.imgs || 'countries/img/'), cor: (L.pais && L.pais.cor) || '#c8102e' } : null;
    var CP_AZUL = '#16365c', cpFotos = cp ? (L.fotos || []).filter(function (f) { return f.img; }) : [];
    function cpUrl(n) { return /^https?:|^\//.test(String(n)) ? String(n) : cp.img + n; }
    function cpFotoDe(i) { return cpFotos.length ? cpFotos[i % cpFotos.length] : (L.pais && L.pais.capa ? { img: L.pais.capa, local: L.pais.capaLocal || '' } : null); }
    function cpPino(t) { return t ? '<div style="position:absolute;right:46px;bottom:46px;background:#fff;color:' + CP_AZUL + ';border-radius:16px;padding:12px 26px;font:800 38px \'' + B + '\';box-shadow:0 8px 24px rgba(0,0,0,.3)">📍 ' + esc(t) + '</div>' : ''; }
    function cpPainel(html, larg, extra) { return '<div style="position:absolute;left:0;top:0;bottom:0;width:' + (larg || 860) + 'px;background:rgba(255,255,255,.96);color:' + CP_AZUL + ';display:flex;flex-direction:column;justify-content:center;padding:0 80px;' + (extra || '') + '">' + html + '</div>'; }
    function buddyFundo(tipo, capa) {
      /* fiel ao PowerPoint (Pedro, 28/11/2026: "não queria a estética descaracterizada"): os slides grandes são pretos com
         a faixa e o Buddy; os de conteúdo, vinho e limpos (sem a cabeça no canto); o de áudio tem o Buddy à esquerda */
      var grande = capa || /^(introducao|fechamento|objetivos|avaliacao|material)$/.test(tipo);
      var faixa = function (larg) { return '<div style="position:absolute;right:0;top:0;bottom:0;width:' + larg + 'px;background:#c1121f"><div style="position:absolute;left:' + Math.round(larg * .28) + 'px;top:0;bottom:0;width:' + Math.round(larg * .1) + 'px;background:#f3f4f6"></div><div style="position:absolute;left:' + Math.round(larg * .46) + 'px;top:0;bottom:0;width:' + Math.round(larg * .05) + 'px;background:#f3f4f6"></div></div>'; };
      if (tipo === 'audio') return { css: 'background:#0b0b0b;', html: faixa(150) };
      return { css: 'background:' + (grande ? '#0b0b0b' : 'linear-gradient(160deg,#5b1616 0%,#3a0d0d 100%)') + ';',
        html: grande ? faixa(capa ? 760 : 470) + (capa ? '' : '<img alt="" src="' + pele.img + 'urso.png" style="position:absolute;right:10px;bottom:0;height:640px;pointer-events:none">')
          : faixa(46) };
    }
    function novo(tipo, corpo, capa, foto) {
      var el = document.createElement('div'); el.className = 'ft-s';
      if (vida) {
        el.style.cssText = 'background:' + (tipo === 'capa' || tipo === 'fechamento' ? '#ffffff;color:#002060' : '#000000;color:#ffffff') + ';font-family:"' + B + '",sans-serif';
        el.innerHTML = (tipo === 'capa' || tipo === 'fechamento' ? '' : vFaixas()) + corpo;
        var et2 = 0; [].forEach.call(el.querySelectorAll('[data-e]'), function (x) { et2 = Math.max(et2, +x.getAttribute('data-e')); });
        slides.push({ tipo: tipo, etapas: et2, el: el });
        return el;
      }
      if (cp) {
        var fd = foto ? cpUrl(foto) : (cpFotoDe(slides.length) ? cpUrl(cpFotoDe(slides.length).img) : '');
        /* os de conteúdo são brancos com o texto azul-marinho e uma faixa da foto à direita, como o Pair Work do original */
        el.style.cssText = (foto ? 'background:#0b1a2e url("' + fd + '") center/cover no-repeat;color:#ffffff;' : 'background:#ffffff;color:' + CP_AZUL + ';') + 'font-family:"' + B + '",sans-serif';
        el.innerHTML = (foto ? '' : '<div style="position:absolute;left:0;top:0;right:0;height:18px;background:' + cp.cor + '"></div>' +
          (fd ? '<div style="position:absolute;right:0;top:18px;bottom:0;width:200px;background:url(&quot;' + esc(fd) + '&quot;) center/cover no-repeat"></div>' : '')) + corpo;
        var et1 = 0; [].forEach.call(el.querySelectorAll('[data-e]'), function (x) { et1 = Math.max(et1, +x.getAttribute('data-e')); });
        slides.push({ tipo: tipo, etapas: et1, el: el });
        return el;
      }
      if (pele) {
        var bf = buddyFundo(tipo, capa && tipo === 'capa');
        el.style.cssText = bf.css + 'font-family:"' + B + '",sans-serif;color:#ffffff';
        el.innerHTML = bf.html + corpo;
        var et0 = 0; [].forEach.call(el.querySelectorAll('[data-e]'), function (x) { et0 = Math.max(et0, +x.getAttribute('data-e')); });
        slides.push({ tipo: tipo, etapas: et0, el: el });
        return el;
      }
      el.style.cssText = fundoCss(r) + 'font-family:"' + B + '",sans-serif;color:' + p.txt;
      el.innerHTML = enfeites(r, base, capa ? POS_CAPA : POS, desl++) + '<div style="position:absolute;left:0;top:0;right:0;height:24px;background:linear-gradient(90deg,' + p.prim + ',' + p.sec + ',' + p.dest + ')"></div>' + corpo;
      var etapas = 0; [].forEach.call(el.querySelectorAll('[data-e]'), function (x) { etapas = Math.max(etapas, +x.getAttribute('data-e')); });
      slides.push({ tipo: tipo, etapas: etapas, el: el });
      return el;
    }
    var h2 = function (t) { return '<h2 style="position:absolute;left:' + (pele ? 120 : 250) + 'px;top:60px;margin:0;font:800 ' + (pele ? '86px' : '100px') + '/1.1 \'' + T + '\';color:' + p.prim + (pele ? ';text-transform:uppercase' : '') + '">' + esc(t) + '</h2>'; };
    var balao = '<div style="position:absolute;left:70px;bottom:60px;background:#fff;border:6px solid #111;border-radius:40px;padding:26px 40px;transform:rotate(-4deg);box-shadow:8px 8px 0 rgba(0,0,0,.15)"><img alt="FISK" src="' + base + 'assets/fisk-marca.png" style="height:110px;display:block"></div>';
    var chip = function (t, bg, cor) { return '<span style="display:inline-block;font-weight:800;font-size:34px;padding:10px 26px;border-radius:99px;letter-spacing:.06em;background:' + bg + ';color:' + cor + ';margin-right:12px">' + esc(t) + '</span>'; };

    /* 1. capa */
    var PA = L.pais || {};
    var vCapa = function () {
      var ic = vida.f.icone ? '<img alt="" src="' + vUrl(vida.f.icone) + '" style="position:absolute;left:1160px;top:250px;width:560px">' : '';
      return '<img alt="EVERYDAY LIFE" src="' + vida.img + 'logo.png" style="position:absolute;left:90px;top:60px;width:560px">' +
        '<img alt="" src="' + vida.img + 'selo.jpg" style="position:absolute;left:140px;top:560px;width:330px;height:330px;border-radius:50%;border:22px solid #e11d2a;box-sizing:content-box">' +
        '<div style="position:absolute;left:560px;top:640px;width:560px;color:#002060;text-align:center"><div style="font:800 64px/1.15 \'' + B + '\'">' + esc(L.coverTitle || '') + '</div>' +
        '<div style="font:800 56px/1.2 \'' + B + '\';margin-top:14px">' + esc(String(L.coverLevel || '').toUpperCase()) + '</div></div>' +
        (ic || (vida.f.capa ? '<div style="position:absolute;right:0;top:0;bottom:0;width:780px;background:url(&quot;' + esc(vUrl(vida.f.capa)) + '&quot;) center/cover no-repeat"></div>' : '')) +
        '<div style="position:absolute;left:0;right:0;bottom:0;height:40px;background:' + vida.c1 + '"></div>';
    };
    if (vida) novo('capa', vCapa(), true);
    else if (cp) novo('capa', cpPainel((PA.bandeira ? '<img alt="" src="' + cpUrl(PA.bandeira) + '" style="width:210px;border-radius:12px;box-shadow:0 8px 22px rgba(0,0,0,.25);margin-bottom:46px;align-self:flex-start">' : '') +
      '<div style="font:800 40px/1 \'' + B + '\';letter-spacing:.14em;color:' + cp.cor + '">COUNTRIES' + (PA.num ? ' #' + String(PA.num).padStart(2, '0') : '') + '</div>' +
      '<div style="font:900 ' + (String(PA.nome || '').length > 11 ? 112 : 150) + 'px/1 \'' + T + '\';margin:20px 0 40px">' + esc(PA.nome || L.coverTitle || '') + '</div>' +
      '<div>' + (L.coverLevel ? chip(String(L.coverLevel).toUpperCase(), cp.cor, '#ffffff') : '') + '</div>' +
      '<img alt="FISK" src="' + base + 'assets/fisk-marca.png" style="position:absolute;left:80px;bottom:60px;height:84px">') + cpPino(PA.capaLocal), true, PA.capa);
    else if (pele) novo('capa', '<img alt="BUDDY TALKS" src="' + pele.img + 'logo.png" style="position:absolute;left:150px;top:110px;width:620px">' +
      '<div style="position:absolute;left:150px;top:470px;width:900px">' +
      (L.topic ? '<div style="font:800 64px/1.1 \'' + T + '\';color:#38bdf8">' + esc(L.topic) + '</div>' : '') +
      '<div style="font:800 104px/1.05 \'' + T + '\';margin:22px 0 30px;color:#fff">' + esc(String(L.coverTitle || '').replace(/^Buddy Talks\s*·\s*/i, '')) + '</div>' +
      (L.coverLevel ? chip(String(L.coverLevel).toUpperCase(), '#38bdf8', '#0b0b0b') : '') + '</div>' +
      '<div style="position:absolute;right:40px;top:40px;background:#fff;border-radius:18px;padding:14px 22px"><img alt="FISK" src="' + base + 'assets/fisk-marca.png" style="height:90px;display:block"></div>' +
      '<img alt="" src="' + pele.img + 'urso.png" style="position:absolute;right:20px;bottom:0;height:900px">', true);
    else novo('capa', '<div style="position:absolute;left:200px;top:220px;width:900px">' + chip(es ? 'CONVERSACIÓN' : 'CONVERSATION', p.dest, sobreDest) +
      '<div style="font:800 132px/1.04 \'' + T + '\';margin:36px 0 34px;color:' + p.prim + '">' + esc(L.coverTitle || L.topic || '') + '</div>' +
      (L.coverLevel ? chip(String(L.coverLevel).toUpperCase(), p.prim, sobrePrim) : '') + (L.perfil ? chip(L.perfil, p.sec, legivel('#111827', p.sec, '#ffffff')) : '') + '</div>' +
      '<img alt="" src="' + ico(base, r.heroi) + '" onerror="this.remove()" style="position:absolute;right:170px;top:290px;width:480px;filter:drop-shadow(0 30px 40px rgba(0,0,0,.28))">' + balao, true);
    /* 2. objetivos, um por clique (na pele das Buddy Talks, antes deles o Material Needed, como no PowerPoint) */
    if (vida) {
      novo('material', '<div style="position:absolute;left:0;top:120px;width:1280px;height:130px;background:' + vida.c1 + ';display:flex;align-items:center;justify-content:center;font:800 76px \'' + B + '\'">MATERIAL NEEDED</div>' +
        '<div style="position:absolute;left:90px;top:330px;width:1100px;font:600 54px/1.4 \'' + B + '\'">' + (L.material || ['PowerPoint activity']).map(function (m, i) { return '<div>' + (i + 1) + '. ' + esc(m) + '</div>'; }).join('') +
        '<div style="margin-top:50px;font-size:64px;font-weight:800"><span style="color:#f97316">LENGTH</span> : ' + esc(String(L.duracao || '20 minutes').toUpperCase()) + '</div></div>' + vPainel(vFoto('material')));
      if ((L.objectives || []).length) novo('objetivos', '<div style="position:absolute;left:90px;top:110px;font:900 96px \'' + B + '\'">OBJECTIVES</div><div style="position:absolute;left:90px;top:290px;width:1120px">' + L.objectives.map(function (o, i) {
        return '<div data-e="' + (i + 1) + '" class="ft-off" style="font:600 62px/1.3 \'' + B + '\';margin-bottom:30px">' + (i + 1) + '. ' + esc(o) + '</div>'; }).join('') + '</div>' + vPainel(vFoto('objetivos')));
    } else if (pele) {
      if ((L.material || []).length) novo('material', h2('Material needed') + '<div style="position:absolute;left:120px;right:820px;top:250px;color:#fff;font:600 60px/1.35 \'' + B + '\'">' +
        L.material.map(function (m, i) { return '<div style="margin-bottom:18px">' + (i + 1) + '. ' + esc(m) + '</div>'; }).join('') +
        (L.duracao ? '<div style="margin-top:60px;color:#38bdf8;font-weight:800">LENGTH: <span style="color:#fff">' + esc(L.duracao) + '</span></div>' : '') + '</div>');
      if ((L.objectives || []).length) novo('objetivos', h2('Objective of the activity') + '<div style="position:absolute;left:120px;right:820px;top:270px">' + L.objectives.map(function (o, i) {
        return '<div data-e="' + (i + 1) + '" class="ft-off" style="font:600 68px/1.25 \'' + B + '\';color:#fff;margin-bottom:34px">' + (i + 1) + '. ' + esc(o) + '</div>'; }).join('') + '</div>');
    } else if ((L.objectives || []).length) novo('objetivos', h2(rot.obj) + '<div style="position:absolute;left:250px;right:250px;top:270px">' + L.objectives.map(function (o, i) {
      return '<div data-e="' + (i + 1) + '" class="ft-off" style="display:flex;gap:28px;align-items:center;margin-bottom:46px"><span style="flex:none;width:90px;height:90px;border-radius:28px;background:' + p.dest + ';color:' + sobreDest + ';font:800 54px \'' + T + '\';display:flex;align-items:center;justify-content:center">' + (i + 1) + '</span><span style="font-size:64px;font-weight:800;line-height:1.2">' + esc(o) + '</span></div>'; }).join('') + '</div>');
    /* 3. abertura do capítulo e vocabulário (a tradução num clique separado, palavra por palavra) */
    var divisor = function (t, n, sub) {
      if (pele) return null;   /* o PowerPoint das Buddy Talks não tem slide de abertura de seção */
      if (vida) {
        var tImg = t === rot.iw ? 'iw.png' : t === rot.pw ? 'conv.png' : '', chave = t === rot.iw ? 'iw' : t === rot.pw ? 'conv' : 'jogo';
        return novo('divisor', '<div style="position:absolute;left:0;top:38px;bottom:38px;width:1280px;display:flex;flex-direction:column;align-items:center;justify-content:center">' +
          (tImg ? '<img alt="' + esc(t) + '" src="' + vida.img + tImg + '" style="width:' + (tImg === 'conv.png' ? 1000 : 720) + 'px">'
            : '<div style="font:500 110px/1 \'' + B + '\';color:#1d6fd1">LANGUAGE</div><div style="font:500 230px/1 \'' + B + '\';color:#1d6fd1">GAME</div>' +
              '<div style="font:600 52px/1.3 \'' + B + '\';margin-top:26px;text-align:center">' + esc(sub || 'Choose the correct alternative.') + '</div>') + '</div>' + vPainel(vFoto(chave)));
      }
      if (cp) { var fdv = cpFotoDe(n + 1);
        return novo('divisor', cpPainel('<div style="font:900 ' + Math.min(116, Math.floor(640 / (0.78 * Math.max.apply(null, String(t).split(/\s+/).map(function (w) { return w.length; }))))) + 'px/1.05 \'' + T + '\';text-align:center;text-transform:uppercase">' + esc(t) + '</div>' +
          (sub ? '<div style="font:800 40px/1.3 \'' + B + '\';margin-top:30px;text-align:center;color:' + cp.cor + '">' + esc(sub) + '</div>' : ''), 820, 'align-items:center') + cpPino(fdv && fdv.local), false, fdv && fdv.img); }
      return novo('divisor', '<div style="position:absolute;inset:0;' + (pele ? 'right:760px;left:80px;' : '') + 'display:flex;align-items:center;justify-content:center;flex-direction:column;gap:30px">' + (pele ? '' : '<img alt="" src="' + ico(base, r.icones[n % r.icones.length]) + '" onerror="this.remove()" style="width:260px">') + '<div style="font:800 ' + (pele ? 124 : 150) + 'px/1.05 \'' + T + '\';color:' + p.prim + ';text-align:center">' + esc(t) + '</div></div>'); };
    /* COUNTRIES: a introdução, o aquecimento, o quadro do país e as fotos vêm ANTES das palavras, como no original */
    if (cp) {
      divisor(rot.intro, 0, L.introSub || '');
      if (L.introText) novo('introducao', cpPainel('<div style="font:700 ' + (String(L.introText).length > 260 ? 52 : 62) + 'px/1.4 \'' + B + '\';text-align:center">' + esc(L.introText).replace(/\n\n/g, '<br><br>') + '</div>', 1000) + cpPino(cpFotoDe(1) && cpFotoDe(1).local), false, cpFotoDe(1) && cpFotoDe(1).img);
      fazConversa(L.warmup || [], null);
      if (PA.fatos && PA.fatos.length) novo('fatos', cpPainel('<div style="font:700 ' + (String(PA.texto || '').length > 230 ? 46 : 54) + 'px/1.4 \'' + B + '\'">' + esc(PA.texto || '').replace(/\n/g, '<br><br>') + '</div>', 1000) +
        '<div style="position:absolute;right:90px;top:0;bottom:0;margin:auto 0;height:fit-content;width:640px;background:#fff;color:' + CP_AZUL + ';border-radius:28px;padding:40px 46px;border:6px solid ' + cp.cor + ';box-shadow:0 14px 40px rgba(0,0,0,.35)">' +
        (PA.mapa ? '<img alt="" src="' + cpUrl(PA.mapa) + '" style="display:block;max-width:100%;max-height:300px;margin:0 auto 26px;border-radius:12px">' : '') +
        '<div style="font:900 40px/1.2 \'' + T + '\';margin-bottom:18px;color:' + cp.cor + '">' + esc(PA.oficial || PA.nome || '') + '</div>' +
        PA.fatos.map(function (f) { return '<div style="font:700 36px/1.35 \'' + B + '\';margin-top:8px"><b style="font-weight:900">' + esc(f[0]) + ':</b> ' + esc(f[1]) + '</div>'; }).join('') + '</div>', false, cpFotoDe(0) && cpFotoDe(0).img);
      (L.fotos || []).forEach(function (f, fi) {
        if (!f.img || f.fundo) return;   /* fundo: a foto só veste os outros slides */
        novo('foto', (f.texto ? cpPainel('<div style="font:700 ' + (String(f.texto).length > 200 ? 46 : 56) + 'px/1.4 \'' + B + '\';text-align:center">' + esc(f.texto).replace(/\n/g, '<br><br>') + '</div>', 820) : '') +
          (f.titulo ? '<div style="position:absolute;left:' + (f.texto ? 880 : 60) + 'px;top:50px;background:' + cp.cor + ';color:#fff;border-radius:18px;padding:14px 34px;font:900 56px \'' + T + '\';text-transform:uppercase;box-shadow:0 8px 24px rgba(0,0,0,.3)">' + esc(f.titulo) + '</div>' : '') + cpPino(f.local), false, f.img);
      });
    }
    var voc = L.vocabulary || [];
    function fazVocab() {
    if (voc.length && vida) {
      divisor(rot.iw, 0);
      for (var vi = 0; vi < voc.length; vi += 3) novo('vocabulario', '<div style="position:absolute;left:120px;right:120px;top:80px;bottom:80px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">' +
        voc.slice(vi, vi + 3).map(function (v) {
          return '<div style="margin:22px 0"><div style="display:flex;align-items:center;justify-content:center;gap:24px"><span style="font:italic 600 78px/1.15 \'' + B + '\';color:' + vida.dest + '">' + esc(v.word) + '</span>' +
            '<button type="button" class="ft-ouvir" data-ouvir="' + esc(v.word) + '" title="Ouvir" style="flex:none;width:64px;height:64px;border-radius:50%;border:0;cursor:pointer;background:' + vida.c1 + ';color:#fff;font-size:30px;line-height:1">🔊</button></div>' +
            (v.translation ? '<div style="font:italic 500 66px/1.2 \'' + B + '\'">= ' + esc(v.translation) + '</div>' : '') + '</div>'; }).join('') + '</div>');
      slides[slides.length - 1].vocab = voc.map(function (v) { return String(v.word || '').trim(); }).filter(Boolean);
      (L.notas || []).forEach(function (nt) {
        novo('nota', '<div style="position:absolute;left:140px;right:140px;top:80px;bottom:80px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">' +
          '<div style="font:800 96px/1.1 \'' + B + '\';color:' + vida.dest + '">' + esc(nt.titulo || '') + '</div>' +
          '<div style="font:600 58px/1.4 \'' + B + '\';margin-top:40px">' + esc(nt.texto || '').replace(/ · /g, '<br>') + '</div></div>');
      });
    } else if (voc.length && pele) {
      /* a lista do PowerPoint: duas colunas, a palavra em branco e o som em azul; o 🔊 toca a palavra */
      var metade = Math.ceil(voc.length / 2), colV = function (lst) { return '<div>' + lst.map(function (v) {
        return '<div style="display:flex;align-items:center;gap:22px;margin-bottom:' + (voc.length > 10 ? 18 : 30) + 'px"><button type="button" class="ft-ouvir" data-ouvir="' + esc(v.word) + '" title="Ouvir" style="flex:none;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;background:#c1121f;color:#fff;font-size:28px;line-height:1">🔊</button>' +
          '<span style="font:700 ' + (voc.length > 10 ? 54 : 64) + 'px/1.1 \'' + B + '\';color:#fff">' + esc(v.word) + '</span>' + (v.translation ? '<span style="font:700 ' + (voc.length > 10 ? 50 : 58) + 'px \'' + B + '\';color:#38bdf8">' + esc(v.translation) + '</span>' : '') + '</div>'; }).join('') + '</div>'; };
      novo('vocabulario', '<div style="position:absolute;left:120px;right:200px;top:90px;bottom:60px;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-content:center">' + colV(voc.slice(0, metade)) + colV(voc.slice(metade)) + '</div>');
      slides[slides.length - 1].vocab = voc.map(function (v) { return String(v.word || '').trim(); }).filter(Boolean);
    } else if (voc.length) {
      divisor(cp ? (L.vocabTitulo || rot.iw) : rot.iw, cp ? 2 : 0, cp ? (L.vocabSub || '') : '');
      var longa = voc.some(function (v) { return String(v.word).length > 14 || Math.max.apply(null, String(v.word).split(/\s+/).map(function (x) { return x.length; })) > 8; }), cols = longa ? 3 : 4;
      novo('vocabulario', h2(rot.iw) + '<div style="position:absolute;left:250px;right:250px;top:240px;display:grid;grid-template-columns:repeat(' + cols + ',minmax(0,1fr));gap:24px">' + voc.map(function (v, i) {
        var maior = Math.max.apply(null, String(v.word).split(/\s+/).map(function (x) { return x.length; }));
        /* PRONÚNCIA (27/11/2026): o 🔊 do canto toca a palavra em voz neural (FiskTema.aoOuvir, como no ouça e escolha) */
        return '<div data-carta="' + (i + 1) + '" style="position:relative;background:' + cartao + ';border-radius:26px;padding:24px 28px;border:4px solid ' + p.sec + ';cursor:pointer;min-height:' + (voc.length > 8 ? 150 : 190) + 'px">' +
          '<button type="button" class="ft-ouvir" data-ouvir="' + esc(v.word) + '" title="Ouvir" style="position:absolute;right:14px;top:14px;width:62px;height:62px;border-radius:50%;border:0;cursor:pointer;background:' + p.dest + ';color:' + sobreDest + ';font-size:30px;line-height:1">🔊</button>' +
          /* a largura útil do cartão (coluna menos o respiro e o 🔊) sobre a largura média da letra grossa (0,72 em): com 0,6 e
             270 px a Montserrat real passava da borda (o PDF de 28/11/2026 mostrou) */
          '<div style="padding-right:66px;overflow-wrap:anywhere;font:800 ' + Math.max(30, Math.min(58, Math.floor((longa ? 335 : 215) / (0.72 * maior)))) + 'px/1.1 \'' + T + '\';color:' + p.prim + '">' + esc(v.word) + '</div>' +   /* 66 px: o 🔊 do canto não cobre a palavra */
          /* sem tradução (as listas de pronúncia das Buddy Talks), sem o clique de revelar: seria um clique para nada */
          (String(v.translation || '').trim() ? '<div data-e="' + (i + 1) + '" class="ft-trad ft-off" style="font-size:42px;font-weight:700;margin-top:10px;color:' + legivel(p.dest, r.escuro ? p.fundo : '#ffffff') + '">' + esc(v.translation) + '</div>' : '') + '</div>'; }).join('') + '</div>');
      slides[slides.length - 1].vocab = voc.map(function (v) { return String(v.word || '').trim(); }).filter(Boolean);
    }
    }
    if (!pele) fazVocab();   /* (no Everyday Life também é aqui: logo depois dos objetivos) */

    /* 4. introdução (na pele das Buddy Talks: cada fala do Buddy num balão, como no PowerPoint original) */
    if (pele && (L.buddyBaloes || []).length) {
      L.buddyBaloes.forEach(function (fala) {
        var tam = String(fala).length > 150 ? 54 : String(fala).length > 90 ? 62 : 72;
        novo('introducao', '<img alt="" src="' + pele.img + 'balao.png" style="position:absolute;left:110px;top:120px;width:1200px;height:763px;transform:scaleX(-1)">' +
          '<div style="position:absolute;left:210px;top:190px;width:1000px;height:470px;display:flex;align-items:center;justify-content:center;text-align:center;color:#12306b;font:700 ' + tam + 'px/1.35 \'' + B + '\'">' + esc(fala).replace(/\n/g, '<br>') + '</div>');
      });
    } else if (L.introText && !cp) { divisor(rot.intro, 1); novo('introducao', h2(rot.intro) + '<div style="position:absolute;left:250px;right:250px;top:250px;font-size:' + (String(L.introText).length > 420 ? 48 : 58) + 'px;font-weight:700;line-height:1.35">' + esc(L.introText).replace(/\n\n/g, '<br><br>') + '</div>'); }
    /* 4b. O ÁUDIO DO LIVRO (Buddy Talks, 28/11/2026): um slide por faixa, "🎧 Let's practice!", com o botão grande e de
       onde vem a faixa. Quem toca é a conversacao.html (FiskTema.aoAudio): o áudio fica no Drive, nunca neste código. */
    (L.audios || []).forEach(function (a, ai) {
      /* na pele das Buddy Talks, o slide do PowerPoint: o Buddy à esquerda com o balão "LET'S PRACTICE! (1)", à direita
         "LISTEN TO THE AUDIO FILE", a página do livro e o "(2x) Listen and repeat." em vermelho; o ▶ toca a faixa */
      if (pele) novo('audio', '<img alt="" src="' + pele.img + 'urso.png" style="position:absolute;left:-30px;bottom:0;height:700px;transform:scaleX(-1)">' +
        '<img alt="" src="' + pele.img + 'balao.png" style="position:absolute;left:330px;top:30px;width:820px;height:522px">' +
        '<div style="position:absolute;left:400px;top:90px;width:690px;height:300px;display:flex;align-items:center;justify-content:center;text-align:center;font:800 96px/1.15 \'' + B + '\';color:#12306b">LET’S PRACTICE!' + (L.audios.length > 1 ? ' (' + (ai + 1) + ')' : '') + '</div>' +
        '<div style="position:absolute;right:200px;top:560px;width:900px;text-align:right;color:#fff">' +
        '<div style="font:700 56px \'' + B + '\';border-bottom:3px solid #fff;padding-bottom:16px">LISTEN TO THE AUDIO FILE</div>' +
        (a.ref ? '<div style="font:italic 600 44px \'' + B + '\';margin-top:18px">' + esc(a.ref) + (a.nome ? ' · ' + esc(a.nome) : '') + '</div>' : '') +
        '<div style="display:inline-block;margin-top:26px;background:#c1121f;font:700 50px \'' + B + '\';padding:8px 22px">(2x) Listen and repeat.</div>' +
        '<div class="ft-leia-audio" style="margin-top:20px;font-size:38px;font-weight:700;line-height:1.25;color:#fca5a5"></div></div>' +
        '<button type="button" class="ft-audio" data-audio="' + ai + '" style="position:absolute;right:230px;top:150px;width:230px;height:230px;border-radius:50%;border:0;cursor:pointer;background:#c1121f;color:#fff;font-size:110px;box-shadow:0 16px 40px rgba(0,0,0,.35)">▶</button>');
      else novo('audio', h2((es ? '🎧 ¡A practicar!' : "🎧 Let's practice!") + ((L.audios.length > 1) ? ' (' + (ai + 1) + ')' : '')) +
        '<div style="position:absolute;left:250px;right:250px;top:300px;display:flex;align-items:center;gap:60px">' +
        '<button type="button" class="ft-audio" data-audio="' + ai + '" style="flex:none;width:280px;height:280px;border-radius:50%;border:0;cursor:pointer;background:' + p.dest + ';color:' + sobreDest + ';font-size:130px;box-shadow:0 16px 40px rgba(0,0,0,.2)">▶</button>' +
        '<div style="max-width:' + (pele ? 760 : 1000) + 'px"><div style="font:800 84px/1.1 \'' + T + '\';color:' + p.prim + '">' + esc(a.nome || '') + '</div>' +
        (a.ref ? '<div style="margin-top:24px;font-size:48px;font-weight:700;opacity:.75">📖 ' + esc(a.ref) + '</div>' : '') +
        '<div class="ft-leia-audio" style="margin-top:24px;font-size:40px;font-weight:700;line-height:1.25;color:' + (pele || r.escuro ? '#fca5a5' : '#b91c1c') + '"></div></div></div>');
      slides[slides.length - 1].audio = { i: ai, nome: String(a.nome || ''), ref: String(a.ref || ''), id: String(a.id || '') };
      if (pele && ai === 0) fazVocab();   /* no PowerPoint, a lista vem entre a faixa A e a B */
    });
    if (pele && !(L.audios || []).length) fazVocab();
    /* COUNTRIES: a leitura (o roteiro do vídeo, um parágrafo por slide), o vídeo, a compreensão e o pair work */
    if (cp) {
      var LE = L.leitura;
      if (LE && (LE.paragrafos || []).length) {
        divisor(LE.titulo || 'Reading', 3, LE.instrucao || '');
        LE.paragrafos.forEach(function (par, pi) {
          novo('leitura', h2((LE.titulo || 'Reading') + ' · ' + (pi + 1) + '/' + LE.paragrafos.length) + '<div style="position:absolute;left:200px;right:200px;top:220px;bottom:70px;background:#fff;color:' + CP_AZUL + ';border:4px solid ' + cp.cor + ';border-radius:30px;padding:50px 60px;font:600 ' + (String(par).length > 640 ? 40 : 46) + 'px/1.5 \'' + B + '\';overflow:hidden">' + esc(par) + '</div>');
        });
      }
      var VD = L.video;
      if (VD && (VD.drive || VD.youtube)) {
        divisor(VD.titulo || 'Watch the video', 4, VD.instrucao || '');
        var fv = cpFotoDe(5);
        novo('video', '<div class="ft-video" data-drive="' + esc(VD.drive || '') + '" data-youtube="' + esc(VD.youtube || '') + '" style="position:absolute;left:180px;top:90px;width:1560px;height:878px;border-radius:26px;overflow:hidden;background:#000 ' + (fv ? 'url(&quot;' + esc(cpUrl(fv.img)) + '&quot;) center/cover' : '') + ';box-shadow:0 20px 50px rgba(0,0,0,.5);cursor:pointer">' +
          '<div class="ft-video-capa" style="position:absolute;inset:0;background:rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px">' +
          '<div style="width:230px;height:230px;border-radius:50%;background:' + cp.cor + ';color:#fff;font-size:120px;display:flex;align-items:center;justify-content:center;padding-left:18px;box-shadow:0 16px 40px rgba(0,0,0,.4)">▶</div>' +
          '<div style="font:900 64px \'' + T + '\';text-shadow:0 4px 14px rgba(0,0,0,.6)">' + esc(VD.nome || 'Watch the video') + '</div></div></div>');
        slides[slides.length - 1].video = { drive: String(VD.drive || ''), youtube: String(VD.youtube || '') };
      }
      fazJogo(L.languageGame || [], L.jogoTitulo || rot.jogo);
      fazConversa(L.conversation || [], rot.pw);
    }
    /* 5. pair work: 3 perguntas por slide, uma por clique; o começo de resposta aparece com a pergunta.
       Sem o título "Pair Work" em cada slide (Pedro 27/11/2026): um divisor anuncia uma vez, e as perguntas ganham a tela, centradas */
    function fazConversa(conv, titDiv) {
    if (conv.length) {
      var porSlide = 3, n0 = 0;
      if (titDiv) divisor(titDiv, 3);
      for (var k = 0; k < conv.length; k += porSlide) (function (grupo) {
        /* respostas-modelo uma por linha, com marcador (Pedro 27/11/2026), maiores que antes (40px); a carga do slide
           (linhas de pergunta + linhas de resposta) decide se cabe no tamanho cheio ou um degrau abaixo */
        var carga = 0; grupo.forEach(function (q) { carga += Math.ceil(String(q.question).length / 42) * 76 + (q.modelAnswers || []).reduce(function (s, r) { return s + Math.ceil(String(r).length / 58) * 60 + 6; }, 0) + 44; });
        var cheio = carga > 840, tamQ = cheio ? 56 : 64, tamR = cheio ? 42 : 48;
        /* cada pergunta num card que aparece com ela (Pedro 27/11/2026: mesmo clareando, o fundo atrapalhava a leitura) */
        var fundoCard = r.escuro ? alfa(p.fundo, 0.92) : 'rgba(255,255,255,.96)';
        if (vida) {   /* o Everyday Life: numeradas, a pergunta em branco e as respostas-modelo em amarelo */
          novo('conversa', '<div style="position:absolute;left:110px;right:160px;top:60px;bottom:60px;display:flex;flex-direction:column;justify-content:center">' + grupo.map(function (q, j) {
            return '<div data-e="' + (j + 1) + '" class="ft-off" style="margin-bottom:' + (cheio ? 34 : 48) + 'px;display:flex;gap:26px"><span style="flex:none;font:600 ' + (tamQ + 2) + 'px/1.2 \'' + B + '\'">' + (n0 + j + 1) + '.</span><div><div style="font:600 ' + (tamQ + 2) + 'px/1.2 \'' + B + '\'">' + esc(q.question) + '</div>' +
              (q.modelAnswers || []).map(function (r) { return '<div style="font:500 ' + tamR + 'px/1.3 \'' + B + '\';margin-top:8px;color:' + vida.dest + '">' + esc(r) + '</div>'; }).join('') + '</div></div>'; }).join('') + '</div>');
          n0 += grupo.length; return;
        }
        if (pele) {   /* as Buddy Talks: a pergunta em branco e a resposta embaixo, sem cartão nem número, como no PowerPoint */
          novo('conversa', '<div style="position:absolute;left:120px;right:260px;top:70px;bottom:60px;display:flex;flex-direction:column;justify-content:center">' + grupo.map(function (q, j) {
            return '<div data-e="' + (j + 1) + '" class="ft-off" style="margin-bottom:' + (cheio ? 40 : 56) + 'px;color:#fff"><div style="font:600 ' + (tamQ + 4) + 'px/1.2 \'' + B + '\'">' + esc(q.question) + '</div>' +
              (q.modelAnswers || []).map(function (r) { return '<div style="font:500 ' + tamR + 'px/1.3 \'' + B + '\';margin-top:10px;opacity:.9">' + esc(r) + '</div>'; }).join('') + '</div>'; }).join('') + '</div>');
          n0 += grupo.length; return;
        }
        novo('conversa', '<div style="position:absolute;left:220px;right:220px;top:60px;bottom:50px;display:flex;flex-direction:column;justify-content:center">' + grupo.map(function (q, j) {
          var num = n0 + j + 1;
          return '<div data-e="' + (j + 1) + '" class="ft-off" style="display:flex;gap:28px;align-items:flex-start;margin-bottom:' + (cheio ? 20 : 30) + 'px;background:' + fundoCard + ';border-radius:32px;padding:' + (cheio ? 20 : 28) + 'px 36px;box-shadow:0 10px 30px rgba(0,0,0,.10)' + (r.escuro ? ';border:2px solid rgba(255,255,255,.10)' : '') + '"><span style="flex:none;width:96px;height:96px;border-radius:30px;background:' + p.dest + ';color:' + sobreDest + ';font:800 56px \'' + T + '\';display:flex;align-items:center;justify-content:center">' + num + '</span><div><div style="font-size:' + tamQ + 'px;font-weight:800;line-height:1.18">' + esc(q.question) + '</div>' +
            ((q.modelAnswers || []).length ? '<ul style="list-style:none;margin:10px 0 0;padding:0;font-size:' + tamR + 'px;font-weight:600;line-height:1.25">' + q.modelAnswers.map(function (r) { return '<li style="display:flex;gap:16px;margin-top:6px"><span style="color:' + p.dest + ';flex:none">•</span><span style="opacity:.85">' + esc(r) + '</span></li>'; }).join('') + '</ul>' : '') + '</div></div>'; }).join('') + '</div>');
        n0 += grupo.length;
      })(conv.slice(k, k + porSlide));
    }
    }
    if (!cp && !vida) fazConversa(L.conversation || [], rot.pw);
    /* 6. o jogo: um item por slide, opções clicáveis (o professor toca e a tela diz); o clique seguinte revela a certa */
    function fazJogo(jogo, titJogo) {
    if (jogo.length) {
      divisor(titJogo, 2);
      jogo.forEach(function (g, gi) {
        var titJ = vida ? '' : h2(titJogo + ' · ' + (gi + 1) + '/' + jogo.length);
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
          '<div data-jogo="' + g.correctIndex + '" style="position:absolute;left:250px;right:250px;top:' + ((g.options || []).length > 3 ? 500 : 600) + 'px;' + ((g.options || []).length > 3 ? 'display:grid;grid-template-columns:1fr 1fr' : 'display:flex') + ';gap:' + ((g.options || []).length > 3 ? 28 : 40) + 'px">' + (g.options || []).map(function (o, i) {
            /* a letra encolhe com a alternativa mais longa: duas linhas de 64 px empurravam o "Correct!" para cima dos botões */
            var maior = Math.max.apply(null, (g.options || []).map(function (x) { return String(x).length; }).concat([1])), fsOp = maior > 22 ? 46 : maior > 14 ? 54 : 64;
            return '<button type="button" class="ft-op" data-op="' + i + '" style="flex:1;font:800 ' + fsOp + 'px \'' + B + '\';border-radius:30px;padding:34px 20px;background:' + cartao + ';color:' + p.txt + ';border:5px solid ' + p.sec + '">' + 'abcdef'[i] + ') ' + esc(o) + '</button>'; }).join('') + '</div>' +
          '<div class="ft-msg" style="position:absolute;left:250px;right:250px;top:' + ((g.options || []).length > 3 ? 905 : (g.options || []).some(function (x) { return String(x).length > 22; }) ? 880 : 830) + 'px;text-align:center;font-size:56px;font-weight:900"></div>' +
          '<span data-e="1" class="ft-off ft-revela" hidden></span>' +
          /* a explicação da resposta (o "False – the harp is" do Countries) aparece com a revelação */
          (g.explanation ? '<div data-e="1" class="ft-off" style="position:absolute;left:250px;right:250px;bottom:40px;text-align:center;font:800 46px/1.25 \'' + B + '\'"><span style="background:#fff;color:#16365c;border:3px solid #16365c;border-radius:18px;padding:12px 28px;display:inline-block">💡 ' + esc(g.explanation) + '</span></div>' : '') +
          (g.source ? '<div style="position:absolute;left:250px;bottom:40px;font-size:26px;font-weight:700;opacity:.55">' + esc(g.source) + '</div>' : ''));
        /* o item cru, para o jogo clicável no celular dos alunos (conversacao.html → portal api/aula.js) */
        slides[slides.length - 1].jogo = { pergunta: String(g.question || ''), opcoes: (g.options || []).map(String), certa: +g.correctIndex };
        if (ouve) slides[slides.length - 1].jogo.ouvir = String(g.audio);
      });
    }
    }
    if (!cp && !vida) fazJogo(L.languageGame || [], rot.jogo);
    /* o Everyday Life: o jogo vem antes da conversa, como no PowerPoint */
    if (vida) { fazJogo(L.languageGame || [], rot.jogo); fazConversa(L.conversation || [], rot.pw); }
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
    /* 7. revisão: o português primeiro, o inglês no clique (fora quando a lista não é de tradução: as Buddy Talks
       treinam pronúncia, e "/t/ → walked" não é revisão) */
    if (voc.length && !L.semRevisao) {
      var longaR = voc.some(function (v) { return String(v.word).length > 14 || String(v.translation).length > 16; }), colsR = longaR ? 3 : 4;
      var tam = function (t, larg, max) { var m = Math.max.apply(null, String(t).split(/\s+/).map(function (x) { return x.length; })); return Math.max(26, Math.min(max, Math.floor(larg / (0.72 * m)))); };
      novo('revisao', h2(rot.rev) + '<div style="position:absolute;left:250px;right:250px;top:240px;display:grid;grid-template-columns:repeat(' + colsR + ',minmax(0,1fr));gap:24px">' + voc.map(function (v, i) {
        var larg = longaR ? 400 : 280;
        return '<div data-carta="' + (i + 1) + '" style="background:' + cartao + ';border-radius:26px;padding:24px 28px;border:4px solid ' + p.sec + ';cursor:pointer;min-height:170px"><div style="font-size:' + tam(v.translation, larg, 44) + 'px;font-weight:700;color:' + legivel(p.dest, r.escuro ? p.fundo : '#ffffff') + '">' + esc(v.translation) + '</div><div data-e="' + (i + 1) + '" class="ft-trad ft-off" style="font:800 ' + tam(v.word, larg, 54) + 'px/1.1 \'' + T + '\';color:' + p.prim + ';margin-top:10px">' + esc(v.word) + '</div></div>'; }).join('') + '</div>');
    }
    /* 8. avaliação e fechamento (com o balão da FISK) */
    if ((L.evaluation || []).length) novo('avaliacao', h2(rot.av) + '<div style="position:absolute;left:' + (pele ? 120 : 250) + 'px;right:' + (pele ? 820 : 250) + 'px;top:260px">' + L.evaluation.map(function (q, j) {
      return '<div data-e="' + (j + 1) + '" class="ft-off" style="font-size:64px;font-weight:800;line-height:1.2;margin-bottom:50px">' + esc(q.question) + '</div>'; }).join('') + '</div>');
    /* a avaliação no celular dos alunos (27/11/2026): as perguntas cruas, a nota e o comentário saem de lá */
    if ((L.evaluation || []).length) slides[slides.length - 1].aval = L.evaluation.map(function (q) { return String(q.question || ''); });
    if (vida) novo('fechamento', vCapa(), true);
    else if (cp) novo('fechamento', cpPainel('<div style="font:900 120px/1.05 \'' + T + '\';text-align:center">' + esc(rot.fim) + '</div>' +
      '<img alt="FISK" src="' + base + 'assets/fisk-marca.png" style="height:96px;margin-top:60px;align-self:center">', 860, 'align-items:center') + cpPino(PA.capaLocal), true, PA.capa);
    else if (pele && false) novo('fechamento', '<div style="position:absolute;left:100px;top:0;bottom:0;width:1100px;display:flex;align-items:center;justify-content:center"><div style="font:800 130px/1.05 \'' + T + '\';color:#38bdf8;text-align:center">' + esc(rot.fim) + '</div></div>' +
      '<div style="position:absolute;left:70px;bottom:60px;background:#fff;border-radius:18px;padding:14px 22px"><img alt="FISK" src="' + base + 'assets/fisk-marca.png" style="height:90px;display:block"></div>');
    else if (!pele) novo('fechamento', '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="font:800 150px/1.05 \'' + T + '\';color:' + p.prim + ';text-align:center;max-width:1300px">' + esc(rot.fim) + '</div></div>' + balao, true);

    slides.forEach(function (s) { s.es = es; ligar(s); });   /* es: o "Correct!" do jogo sai na língua da aula */
    return { slides: slides, receita: r };
  }

  /* ══ A SÉRIE "YOUTUBERS" (Pedro, 28/11/2026: refazer sem descaracterizar a arte) ═══════════════════════════════════
     Montador próprio, porque a série tem blocos que as outras não têm (Group Discussion, Pronunciation Practice com o
     "REPEAT THESE WORDS!", diálogos para completar, frases para desembaralhar, cartões de vocabulário português →
     inglês). A cara é a do PowerPoint: fundos vermelho YouTube, cinza-escuro, preto e vinho; a faixa do cabeçalho do
     YouTube no topo, o logo FISK no canto e a barra vermelha embaixo; títulos de seção em branco, caixa alta. As imagens
     da série ficam em youtubers/img/. design.pele = 'youtuber'. */
  function montaYt(L, design, base, T, B) {
    var Y = L.yt || {}, img = base + (design.imgs || 'youtubers/img/'), F = Y.fotos || {}, slides = [];
    var COR = { vermelho: '#DC0505', cinza: '#404040', preto: '#0D0D0D', vinho: '#580000' }, AMAR = '#FFC000', AZUL = '#00B0F0';
    var u = function (n) { return /^https?:|^\//.test(String(n)) ? String(n) : img + n; };
    function novoY(tipo, cor, corpo) {
      var el = document.createElement('div'); el.className = 'ft-s';
      el.style.cssText = 'background:' + (COR[cor] || cor) + ';color:#ffffff;font-family:"' + B + '",sans-serif';
      el.innerHTML = '<div style="position:absolute;left:0;right:0;top:0;height:52px;background:#fff url(&quot;' + img + 'topo.jpg&quot;) left center/auto 100% no-repeat"></div>' +
        '<img alt="FISK" src="' + img + 'fisk.jpg" style="position:absolute;right:18px;top:6px;height:40px">' +
        '<div style="position:absolute;left:0;right:0;bottom:0;height:26px;background:#C00000"></div>' + corpo;
      var et = 0; [].forEach.call(el.querySelectorAll('[data-e]'), function (x) { et = Math.max(et, +x.getAttribute('data-e')); });
      slides.push({ tipo: tipo, etapas: et, el: el });
      return slides[slides.length - 1];
    }
    var tit = function (t, sub, tam) { return '<div style="position:absolute;left:80px;right:80px;top:52px;bottom:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">' +
      '<div style="font:900 ' + (tam || 150) + 'px/1.08 \'' + T + '\';text-transform:uppercase">' + esc(t) + '</div>' + (sub ? '<div style="font:500 52px/1.3 \'' + B + '\';margin-top:30px">' + esc(sub) + '</div>' : '') + '</div>'; };
    var ouvir = function (w, cor) { return '<button type="button" class="ft-ouvir" data-ouvir="' + esc(w) + '" title="Ouvir" style="flex:none;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:' + (cor || '#C00000') + ';color:#fff;font-size:28px;line-height:1;vertical-align:middle">🔊</button>'; };
    /* perguntas numeradas, uma por clique, com as respostas-modelo embaixo (em amarelo no vinho, como no original) */
    function perguntas(tipo, cor, lista, corResp, porSlide) {
      for (var k = 0; k < lista.length; k += porSlide) (function (grupo, n0) {
        novoY(tipo, cor, '<div style="position:absolute;left:90px;right:90px;top:90px;bottom:60px;display:flex;flex-direction:column;justify-content:center">' + grupo.map(function (q, j) {
          return '<div data-e="' + (j + 1) + '" class="ft-off" style="display:flex;gap:22px;margin-bottom:34px"><span style="flex:none;font:600 60px/1.2 \'' + B + '\'">' + (n0 + j + 1) + '.</span><div><div style="font:600 60px/1.2 \'' + B + '\'">' + esc(q[0]) + '</div>' +
            q.slice(1).map(function (r) { return '<div style="font:italic 500 50px/1.3 \'' + B + '\';color:' + corResp + ';margin-top:6px">' + esc(r) + '</div>'; }).join('') + '</div></div>'; }).join('') + '</div>');
      })(lista.slice(k, k + porSlide), k);
    }

    /* 1. capa: a tela do vídeo, com o painel preto do logo "YouTuber" e o título */
    var capa = '<div style="position:absolute;inset:0;background:#fff url(&quot;' + esc(u(F.capa || F.video || 'topo.jpg')) + '&quot;) center/cover no-repeat"></div>' +
      '<div style="position:absolute;left:0;top:0;width:1080px;height:760px;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center">' +
      '<img alt="YouTuber" src="' + img + 'logo.png" style="width:820px">' +
      '<div style="font:600 70px/1.15 \'' + B + '\';margin-top:30px;text-align:center;padding:0 40px">' + esc(Y.capaTitulo || L.coverTitle || '') + '</div></div>';
    novoY('capa', '#ffffff', capa);
    /* 2. material, objetivos e introdução */
    novoY('material', 'vermelho', '<div style="position:absolute;left:90px;right:90px;top:100px;text-align:center"><div style="font:500 110px/1.1 \'' + B + '\'">MATERIAL NEEDED</div>' +
      '<div style="text-align:left;display:inline-block;margin-top:50px;font:500 60px/1.5 \'' + B + '\'">' + (Y.material || ['PowerPoint activity']).map(function (m, i) { return (i + 1) + '. ' + esc(m); }).join('<br>') + '</div>' +
      '<div style="margin-top:70px;font:500 60px \'' + B + '\'">LENGTH: ' + esc(String(Y.duracao || '20 minutes').toUpperCase()) + '</div></div>');
    if ((Y.objetivos || []).length) novoY('objetivos', 'cinza', '<div style="position:absolute;left:90px;right:90px;top:100px;text-align:center"><div style="font:500 110px/1.1 \'' + B + '\'">AIMS OF THE <span style="color:#ff2a2a">ACTIVITY</span></div>' +
      '<div style="text-align:left;display:inline-block;margin-top:60px">' + Y.objetivos.map(function (o, i) { return '<div data-e="' + (i + 1) + '" class="ft-off" style="font:500 70px/1.4 \'' + B + '\'">• ' + esc(o) + '</div>'; }).join('') + '</div></div>');
    if (Y.intro) {
      novoY('divisor', 'vermelho', tit('Introduction', '', 190));
      var fotosIntro = [F.intro].concat((F.outras || []).filter(function (x) { return !/capa|topo/.test(x); }).slice(0, 2)).filter(Boolean);
      novoY('introducao', 'vermelho', '<div style="position:absolute;left:80px;right:80px;top:80px;height:420px;display:flex;gap:40px;align-items:center;justify-content:center">' +
        fotosIntro.map(function (f) { return '<img alt="" src="' + esc(u(f)) + '" style="max-height:400px;max-width:620px;border:6px solid #fff;border-radius:8px">'; }).join('') + '</div>' +
        '<div style="position:absolute;left:100px;right:100px;top:530px;bottom:50px;display:flex;align-items:center;justify-content:center;text-align:center;font:500 ' + (String(Y.intro).length > 300 ? 50 : 58) + 'px/1.35 \'' + B + '\'">' + esc(Y.intro) + '</div>');
    }
    /* 3. o vídeo (o player do Drive nasce no toque do professor, como no Countries) */
    var VD = Y.video || {};
    if (VD.drive || VD.youtube) {
      var sv = novoY('video', 'preto', '<div style="position:absolute;left:70px;top:90px;width:560px;bottom:60px;display:flex;flex-direction:column;justify-content:center;text-align:center"><div style="font:900 96px/1.05 \'' + T + '\'">WATCH THE VIDEO</div>' +
        (VD.instrucao ? '<div style="font:500 44px/1.35 \'' + B + '\';margin-top:30px">' + esc(VD.instrucao) + '</div>' : '') + '</div>' +
        '<div class="ft-video" data-drive="' + esc(VD.drive || '') + '" data-youtube="' + esc(VD.youtube || '') + '" style="position:absolute;left:680px;top:110px;width:1180px;height:664px;border-radius:12px;overflow:hidden;background:#000 url(&quot;' + esc(u(F.video || F.capa || 'topo.jpg')) + '&quot;) center/cover;cursor:pointer">' +
        '<div class="ft-video-capa" style="position:absolute;inset:0;background:rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px">' +
        '<div style="width:210px;height:150px;border-radius:40px;background:#FF0000;color:#fff;font-size:96px;display:flex;align-items:center;justify-content:center;padding-left:12px">▶</div>' +
        '<div style="font:800 54px \'' + B + '\';text-shadow:0 4px 14px rgba(0,0,0,.7);padding:0 30px;text-align:center">' + esc(VD.nome || '') + '</div></div></div>' +
        (VD.inicio ? '<div style="position:absolute;left:680px;top:800px;font:600 40px \'' + B + '\'">⏱ ' + esc(VD.inicio) + '</div>' : ''));
      sv.video = { drive: String(VD.drive || ''), youtube: String(VD.youtube || '') };
    }
    /* 4. depois do vídeo: Group Discussion */
    if ((Y.discussao || []).length) { novoY('divisor', 'cinza', tit('Group Discussion', '', 170)); perguntas('conversa', 'vermelho', Y.discussao, '#ffffff', 2); }

    var feitoJogo = false, feitoVocab = false;
    function blocoJogo() {
      if (feitoJogo || !(Y.jogo || []).length) return; feitoJogo = true;
      novoY('divisor', 'cinza', tit('Language Practice', 'Choose the best alternative.', 140));
      Y.jogo.forEach(function (g) {
        var linhas = String(g.q).split(/\s*\|\s*/);
        var s = novoY('jogo', 'preto', '<div style="position:absolute;left:90px;right:90px;top:100px;font:500 66px/1.4 \'' + B + '\'">' + linhas.map(esc).join('<br>') + '</div>' +
          '<div style="position:absolute;left:90px;right:90px;top:' + (linhas.length > 1 ? 330 : 260) + 'px;border-top:3px solid #fff"></div>' +
          '<div data-jogo="' + g.correct + '" style="position:absolute;left:90px;top:' + (linhas.length > 1 ? 370 : 300) + 'px;width:1000px;display:flex;flex-direction:column;gap:18px">' + (g.options || []).map(function (o, i) {
            return '<button type="button" class="ft-op" data-op="' + i + '" style="text-align:left;font:500 62px \'' + B + '\';border-radius:60px;padding:12px 34px;background:transparent;color:#fff;border:4px solid rgba(255,255,255,.35)">' + (i + 1) + '. ' + esc(o) + '</button>'; }).join('') + '</div>' +
          '<div class="ft-msg" style="position:absolute;left:90px;top:900px;font-size:54px;font-weight:900"></div>' +
          '<span data-e="1" class="ft-off ft-revela" hidden></span>' +
          (g.dica ? '<div data-e="1" class="ft-off" style="position:absolute;right:120px;top:560px;background:#009A00;color:#fff;border-radius:90px;padding:26px 60px;font:500 50px/1.2 \'' + B + '\';transform:rotate(-8deg);max-width:620px;text-align:center">' + esc(g.dica) + '</div>' : ''));
        s.jogo = { pergunta: linhas.join(' '), opcoes: (g.options || []).map(String), certa: +g.correct };
      });
    }
    function blocoVocab() {
      if (feitoVocab || !(Y.vocab || []).length) return; feitoVocab = true;
      novoY('divisor', 'preto', tit('Vocabulary Practice', 'Guess the word in English and repeat.', 140));
      Y.vocab.forEach(function (v, i) {
        var s = novoY('vocabulario', 'vinho', '<div style="position:absolute;left:80px;right:80px;top:110px;text-align:center;font:500 110px/1.1 \'' + B + '\'">' + esc(v[1] || '') + '</div>' +
          '<div data-e="1" class="ft-off" style="position:absolute;left:80px;right:80px;top:620px;display:flex;gap:30px;align-items:center;justify-content:center"><span style="font:500 120px/1.1 \'' + B + '\';color:' + AMAR + '">' + esc(v[0]) + '</span>' + ouvir(v[0]) + '</div>');
        if (i === Y.vocab.length - 1) s.vocab = Y.vocab.map(function (x) { return String(x[0]); });
      });
    }
    function repetir(p, pares) {
      novoY('divisor', 'preto', tit(p.titulo || 'Pronunciation Practice', p.instrucao || 'Repeat the words after the teacher', 130));
      var itens = p.itens || [];
      for (var k = 0; k < itens.length; k += 6) novoY('pratica', 'preto', '<div style="position:absolute;left:80px;width:1100px;top:90px;bottom:60px;display:flex;flex-direction:column;justify-content:center;gap:26px">' +
        itens.slice(k, k + 6).map(function (it) { var w = pares ? it[0] : it, n = pares ? it[1] : '';
          return '<div style="display:flex;align-items:center;gap:24px">' + ouvir(w) + '<div><div style="font:500 64px/1.1 \'' + B + '\'">' + esc(w) + '</div>' + (n ? '<div style="font:italic 500 40px/1.25 \'' + B + '\';color:' + AZUL + '">' + esc(n) + '</div>' : '') + '</div></div>'; }).join('') + '</div>' +
        '<div style="position:absolute;right:90px;top:200px;width:560px;height:640px;background:#C00000;display:flex;align-items:center;justify-content:center;text-align:center;font:500 96px/1.25 \'' + B + '\'">REPEAT<br>THESE<br>WORDS!</div>');
    }
    function bloco(p) {
      var t = p.tipo;
      if (t === 'repetir') return repetir(p, false);
      if (t === 'pronuncia' || t === 'expressoes') return repetir(p, true);
      if (t === 'nota') {
        if (/jogo/.test(p.instrucao || '')) return blocoJogo();
        if (/vocab/.test(p.instrucao || '')) return blocoVocab();
        return novoY('nota', 'cinza', tit(p.titulo || '', p.instrucao || '', 110));
      }
      if (t === 'revisao') {
        novoY('divisor', 'preto', tit(p.titulo || 'Do you remember?', p.instrucao || '', 140));
        return (p.itens || []).forEach(function (it) { novoY('revisao', 'vinho', '<div style="position:absolute;left:80px;right:80px;top:110px;text-align:center;font:500 96px/1.15 \'' + B + '\'">' + esc(it[0]) + '</div>' +
          '<div data-e="1" class="ft-off" style="position:absolute;left:80px;right:80px;top:620px;display:flex;gap:30px;align-items:center;justify-content:center"><span style="font:500 110px/1.1 \'' + B + '\';color:' + AMAR + '">' + esc(it[1]) + '</span>' + ouvir(it[1]) + '</div>'); });
      }
      novoY('divisor', 'cinza', tit(p.titulo || 'Language Practice', p.instrucao || '', 130));
      var itens = p.itens || [];
      if (t === 'dialogos') for (var k = 0; k < itens.length; k += 2) novoY('pratica', 'preto', '<div style="position:absolute;left:100px;right:100px;top:90px;bottom:60px;display:flex;flex-direction:column;justify-content:center">' +
        itens.slice(k, k + 2).map(function (d, j) { return '<div data-e="' + (j + 1) + '" class="ft-off" style="margin-bottom:70px;font:500 64px/1.45 \'' + B + '\'">' + d.map(esc).join('<br>') + '</div>'; }).join('') + '</div>');
      else if (t === 'desembaralhar') itens.forEach(function (d) { novoY('pratica', 'preto', '<div style="position:absolute;left:100px;right:100px;top:200px;text-align:center;font:500 80px/1.3 \'' + B + '\'">' + esc(d[0]) + '</div>' +
        '<div data-e="1" class="ft-off" style="position:absolute;left:100px;right:100px;top:560px;text-align:center;font:italic 600 80px/1.3 \'' + B + '\';color:' + AMAR + '">' + esc(d[1]) + '</div>'); });
      else if (t === 'completar') for (var c = 0; c < itens.length; c += 2) novoY('pratica', 'vinho', '<div style="position:absolute;left:100px;right:100px;top:90px;bottom:60px;display:flex;flex-direction:column;justify-content:center;gap:90px">' +
        itens.slice(c, c + 2).map(function (f, j) { return '<div data-e="' + (j + 1) + '" class="ft-off" style="font:500 78px/1.3 \'' + B + '\'">' + esc(f) + '</div>'; }).join('') + '</div>');
      else if (t === 'figuras') for (var g2 = 0; g2 < itens.length; g2 += 4) novoY('pratica', 'preto', '<div style="position:absolute;left:80px;right:80px;top:90px;bottom:60px;display:grid;grid-template-columns:repeat(4,1fr);gap:30px;align-items:center">' +
        itens.slice(g2, g2 + 4).map(function (f, j) { return '<div style="text-align:center"><img alt="" src="' + esc(u(f[1])) + '" style="width:100%;height:440px;object-fit:contain;background:#fff;border-radius:12px">' +
          '<div data-e="' + (j + 1) + '" class="ft-off" style="margin-top:24px;font:600 52px \'' + B + '\';color:' + AMAR + '">' + esc(f[0]) + '</div></div>'; }).join('') + '</div>');
    }
    var prat = Y.pratica || [], pron = prat.filter(function (p) { return /^(repetir|pronuncia|expressoes)$/.test(p.tipo); }), resto = prat.filter(function (p) { return pron.indexOf(p) < 0; });
    pron.forEach(bloco);
    /* 5. Pair Conversation (no vinho, respostas em amarelo) */
    if ((Y.conversa || []).length) { novoY('divisor', 'preto', tit('Pair', '', 220).replace('</div></div>', '</div><div style="font:500 80px \'' + B + '\'">CONVERSATION</div></div>')); perguntas('conversa', 'vinho', Y.conversa, AMAR, 2); }
    (Y.warmup || []).length && perguntas('conversa', 'vinho', Y.warmup, AMAR, 2);
    resto.forEach(bloco);
    blocoJogo(); blocoVocab();
    /* 6. Activity Evaluation (no celular também, com nota e comentário) */
    if ((Y.avaliacao || []).length) {
      novoY('divisor', 'preto', tit('Activity Evaluation', '', 150));
      perguntas('avaliacao', 'vermelho', Y.avaliacao, '#ffffff', 2);
      slides[slides.length - 1].aval = Y.avaliacao.map(function (q) { return String(q[0]); });
    }
    return slides;
  }

  /* o que é clicável dentro do slide: as cartas do vocabulário e as opções do jogo */
  function ligar(s) {
    var el = s.el;
    [].forEach.call(el.querySelectorAll('[data-carta]'), function (c) {
      c.addEventListener('click', function (ev) { ev.stopPropagation(); var t = c.querySelector('.ft-trad'); if (t) t.classList.remove('ft-off'); });
    });
    [].forEach.call(el.querySelectorAll('.ft-audio'), function (b) {
      b.addEventListener('click', function (ev) { ev.stopPropagation(); if (raiz.FiskTema && raiz.FiskTema.aoAudio) raiz.FiskTema.aoAudio(+b.getAttribute('data-audio'), b, el); });
    });
    [].forEach.call(el.querySelectorAll('.ft-ouvir'), function (b) {
      b.addEventListener('click', function (ev) { ev.stopPropagation(); if (raiz.FiskTema && raiz.FiskTema.aoOuvir) raiz.FiskTema.aoOuvir(b.getAttribute('data-ouvir'), b); });
    });
    /* O VÍDEO (Countries): o player só nasce no toque do professor, para a foto dos celulares e o deck guardado não
       abrirem o vídeo do Drive à toa. A cópia do Drive (da escola, sem anúncio) vem antes do YouTube. */
    [].forEach.call(el.querySelectorAll('.ft-video'), function (v) {
      v.addEventListener('click', function (ev) {
        ev.stopPropagation(); if (v.querySelector('iframe')) return;
        var d = v.getAttribute('data-drive'), y = v.getAttribute('data-youtube'), f = document.createElement('iframe');
        f.src = d ? 'https://drive.google.com/file/d/' + encodeURIComponent(d) + '/preview' : 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(y) + '?autoplay=1&rel=0';
        f.allow = 'autoplay; fullscreen; encrypted-media'; f.setAttribute('allowfullscreen', '');
        f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#000';
        v.appendChild(f); var c = v.querySelector('.ft-video-capa'); if (c) c.remove();
      });
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
