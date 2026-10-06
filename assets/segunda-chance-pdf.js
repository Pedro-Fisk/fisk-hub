/* ══ O MOTOR DO COMUNICADO DE 2ND CHANCE (separado em 06/10/2026) ══════════
 * O desenho do PDF e as regras (qual prova refazer, como ler as notas do card,
 * como montar os itens de recuperação), tirados do 2nd-chance.html para servir
 * ao gerador e ao Buddy com o MESMO código.
 *
 * fisk2ndPDF(d) → Promise<{ bytes, filename }>
 *   d = { nome, estagio, prof, turma, escrita, auditiva, itens:[frases], logo? }
 * Precisa do pdf-lib (PDFLib) carregado antes.
 * ═══════════════════════════════════════════════════════════════════════════ */
var FISK_2ND_MIN = 6;   /* nota mínima exigida pela Fundação Fisk */
var FISK_2ND_SUGESTOES = [
  { k: 'refazer',   t: 'Refazer a(s) prova(s) abaixo de 6,0, buscando alcançar pelo menos 6,0.', on: true },
  { k: 'tutoria',   t: 'Participar das tutorias (aulas extras, sem custo) para revisar o conteúdo.', on: true },
  { k: 'duvidas',   t: 'Tirar as dúvidas com o professor durante as aulas.', on: true },
  { k: 'audio',     t: 'Revisar o conteúdo em casa com o áudio.', on: false },
  { k: 'tarefas',   t: 'Fazer as tarefas de casa para aproveitar melhor o tempo de aula.', on: false },
  { k: 'plataforma',t: 'Praticar na plataforma online.', on: false },
  { k: 'faltas',    t: 'Evitar faltas para acompanhar melhor o conteúdo.', on: false }
];
function fisk2ndNum(v) { return (typeof v === 'number' && !isNaN(v)); }
function fisk2ndFmt(v) { return fisk2ndNum(v) ? v.toFixed(1).replace('.', ',') : '-'; }
function fisk2ndPrimeiroNome(n) { return String(n || '').trim().split(/\s+/)[0] || 'o(a) aluno(a)'; }
function fisk2ndRotulo(k) { return k === 'escrita' ? 'Prova Escrita' : 'Prova Auditiva'; }
/* a célula de notas do card: "prova de escuta: 5,5 … prova de escrita: 7" ou o formato antigo "A5 B7" */
function fisk2ndParseProvas(cellText) {
  if (!cellText || !String(cellText).trim()) return null;
  var txt = String(cellText), auditiva, escrita;
  var mE = txt.match(/prova de escuta:\s*([0-9]+(?:[.,][0-9]+)?)/i);
  var mW = txt.match(/prova de escrita:\s*([0-9]+(?:[.,][0-9]+)?)/i);
  if (mE) auditiva = parseFloat(mE[1].replace(',', '.'));
  if (mW) escrita = parseFloat(mW[1].replace(',', '.'));
  if (auditiva === undefined && escrita === undefined) {
    var lines = txt.split('\n'), noteLine = lines[lines.length - 1], res = {};
    var re = /(?:^|\s)([AB])\s*([0-9]+(?:[.,][0-9]+)?)/g, m;
    while ((m = re.exec(noteLine))) { res[m[1]] = parseFloat(m[2].replace(',', '.')); }
    auditiva = res.A; escrita = res.B;
  }
  if (auditiva === undefined && escrita === undefined) return null;
  return { auditiva: auditiva, escrita: escrita };
}
function fisk2ndAbaixo(p) {
  var out = [];
  if (p && fisk2ndNum(p.escrita) && p.escrita < FISK_2ND_MIN) out.push('escrita');
  if (p && fisk2ndNum(p.auditiva) && p.auditiva < FISK_2ND_MIN) out.push('auditiva');
  return out;
}
function fisk2ndPolir(s) {
  s = String(s == null ? '' : s).trim().replace(/\s+/g, ' ');
  if (!s) return '';
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (/[,;:]$/.test(s)) s = s.slice(0, -1) + '.';
  else if (!/[.!?…]$/.test(s)) s += '.';
  return s;
}
/* os itens de "Para a recuperação": lições + sugestões marcadas (pela chave) + texto livre, uma ideia por linha */
function fisk2ndItens(o) {
  o = o || {};
  var itens = [], lic = String(o.licoes || '').trim(), marcadas = o.marcadas || [];
  if (lic) itens.push('Revisar e estudar as lições ' + lic + '.');
  FISK_2ND_SUGESTOES.forEach(function (s) {
    if (marcadas.indexOf(s.k) < 0) return;
    if (s.k === 'refazer') {
      var ab = fisk2ndAbaixo(o).map(fisk2ndRotulo);
      itens.push(ab.length
        ? ('Refazer ' + (ab.length === 2 ? 'a prova escrita e a prova auditiva' : ('a ' + ab[0].toLowerCase())) + ', buscando alcançar pelo menos 6,0.')
        : s.t);
    } else itens.push(s.t);
  });
  String(o.livres || '').split('\n').forEach(function (l) { l = fisk2ndPolir(l); if (l) itens.push(l); });
  return itens;
}
async function fisk2ndPDF(d) {
  d = d || {};
  d.nome = String(d.nome || '').trim();
  var abaixo = fisk2ndAbaixo(d);
  var PDF = PDFLib;
  var doc = await PDF.PDFDocument.create();
  var W = 595.28, H = 841.89, M = 42;
  var page = doc.addPage([W, H]);
  var helv = await doc.embedFont(PDF.StandardFonts.Helvetica);
  var bold = await doc.embedFont(PDF.StandardFonts.HelveticaBold);
  var italic = await doc.embedFont(PDF.StandardFonts.HelveticaOblique);

  /* paleta azul — sheet-adults do boletim de jovens e adultos */
  var BLUE = PDF.rgb(0.169, 0.302, 0.439);   // #2b4d70
  var PILL = PDF.rgb(0.133, 0.243, 0.353);   // #223e5a
  var SOFT = PDF.rgb(0.914, 0.937, 0.961);   // #e9eff5
  var SOFT2 = PDF.rgb(0.949, 0.965, 0.98);   // #f2f6fa
  var INK  = PDF.rgb(0.114, 0.200, 0.286);   // #1d3349
  var SUB  = PDF.rgb(0.42, 0.47, 0.52);
  var TEXT = PDF.rgb(0.16, 0.18, 0.20);
  var LINE = PDF.rgb(0.66, 0.74, 0.82);      // #a9bccd
  var WHITE = PDF.rgb(1, 1, 1);

  /* rrect(x, TOP_y, w, h): canto arredondado com o TOPO em TOP_y, crescendo p/ baixo */
  function rrect(x, yTop, w, h, r, opts) {
    var p = 'M ' + r + ',0 H ' + (w - r) + ' A ' + r + ' ' + r + ' 0 0 1 ' + w + ' ' + r +
      ' V ' + (h - r) + ' A ' + r + ' ' + r + ' 0 0 1 ' + (w - r) + ' ' + h +
      ' H ' + r + ' A ' + r + ' ' + r + ' 0 0 1 0 ' + (h - r) +
      ' V ' + r + ' A ' + r + ' ' + r + ' 0 0 1 ' + r + ' 0 Z';
    page.drawSvgPath(p, Object.assign({ x: x, y: yTop }, opts));
  }
  function centro(t, y, size, font, color) { page.drawText(t, { x: (W - font.widthOfTextAtSize(t, size)) / 2, y: y, size: size, font: font, color: color }); }
  function quebra(t, font, size, larg) {
    var out = [];
    String(t).split('\n').forEach(function (par) {
      var cur = '';
      par.split(' ').forEach(function (w) {
        var s = cur ? cur + ' ' + w : w;
        if (font.widthOfTextAtSize(s, size) > larg && cur) { out.push(cur); cur = w; } else cur = s;
      });
      out.push(cur);
    });
    return out;
  }
  /* parágrafo JUSTIFICADO (última linha do parágrafo alinhada à esquerda) */
  function paragrafo(t, x, y, larg, size, font, color, lh) {
    String(t).split('\n').forEach(function (par) {
      var ls = quebra(par, font, size, larg);
      ls.forEach(function (ln, i) {
        var ws = ln.split(' ');
        if (i === ls.length - 1 || ws.length === 1) {
          page.drawText(ln, { x: x, y: y, size: size, font: font, color: color });
        } else {
          var wordsW = ws.reduce(function (s, w) { return s + font.widthOfTextAtSize(w, size); }, 0);
          var extra = (larg - wordsW) / (ws.length - 1);
          var cx = x;
          ws.forEach(function (w, j) {
            page.drawText(w, { x: cx, y: y, size: size, font: font, color: color });
            cx += font.widthOfTextAtSize(w, size) + (j < ws.length - 1 ? extra : 0);
          });
        }
        y -= lh;
      });
    });
    return y;
  }

  var logoPng = null;
  try { logoPng = await doc.embedPng(await fetch(d.logo || 'assets/fisk-logo.png').then(function (r) { return r.arrayBuffer(); })); } catch (e) {}

  var y = H - 42;

  /* topo: logo (proporção preservada) à esquerda + pílula de data à direita */
  if (logoPng) { var lh0 = 32, lw0 = logoPng.width * (lh0 / logoPng.height); page.drawImage(logoPng, { x: M, y: y - lh0, width: lw0, height: lh0 }); }
  else page.drawText('FISK', { x: M, y: y - 24, size: 22, font: bold, color: PDF.rgb(0.847, 0.122, 0.149) });
  var hoje = new Date();
  var dataStr = ('0' + hoje.getDate()).slice(-2) + '/' + ('0' + (hoje.getMonth() + 1)).slice(-2) + '/' + hoje.getFullYear();
  rrect(W - M - 132, y - 6, 132, 21, 10.5, { color: SOFT, borderColor: LINE, borderWidth: 1 });
  page.drawText('Data: ' + dataStr, { x: W - M - 118, y: y - 20, size: 9.5, font: bold, color: PILL });
  y -= 52;

  /* título centralizado */
  centro('COMUNICADO DE SEGUNDA CHANCE', y, 16.5, bold, INK);
  y -= 19;
  centro('Second Chance Test  ·  Comunicado aos pais ou responsáveis', y, 10, italic, SUB);
  y -= 24;

  /* moldura de identificação (fundo suave); TOPO em y */
  var idH = 66, halfW = (W - 2 * M) / 2;
  rrect(M, y, W - 2 * M, idH, 14, { color: SOFT2, borderColor: BLUE, borderWidth: 1.5 });
  function idCampo(rot, val, x, yy, larg) {
    page.drawText(rot, { x: x, y: yy, size: 9, font: bold, color: PILL });
    var lx = x + bold.widthOfTextAtSize(rot, 9) + 6;
    page.drawLine({ start: { x: lx, y: yy - 2.5 }, end: { x: x + larg, y: yy - 2.5 }, thickness: 0.8, color: LINE });
    page.drawText(String(val || ''), { x: lx + 3, y: yy, size: 9.5, font: helv, color: TEXT });
  }
  var colL = M + 22, colR = M + halfW + 6;
  idCampo('Aluno(a):', d.nome, colL, y - 24, halfW - 34);
  idCampo('Estágio:', (d.estagio || ''), colR, y - 24, halfW - 44);
  idCampo('Professor(a):', (d.prof || ''), colL, y - 48, halfW - 34);
  idCampo('Turma:', (d.turma || ''), colR, y - 48, halfW - 44);
  y -= idH + 22;

  /* carta acolhedora, justificada, sem travessão */
  var nome = (d.nome || '').trim(), pr = fisk2ndPrimeiroNome(nome);
  var abaixoRot = abaixo.map(fisk2ndRotulo);
  var fraseProvas = abaixoRot.length === 2 ? 'nas provas escrita e auditiva'
    : abaixoRot.length === 1 ? ('na ' + abaixoRot[0].toLowerCase())
    : 'na avaliação';
  var carta =
    'Prezada família,\n' +
    'Escrevemos para compartilhar como foi o desempenho de ' + nome + ' nas avaliações deste período e, ' +
    'principalmente, para reforçar que estamos juntos nessa caminhada. ' + pr + ' não atingiu a nota mínima ' +
    '(6,0) ' + fraseProvas + ', e queremos dizer com tranquilidade que isso faz parte do aprendizado e ' +
    'acontece com muitos alunos. O mais importante é o próximo passo: a Fisk oferece tutorias (aulas extras, ' +
    'sem custo), revisão do conteúdo e espaço para tirar todas as dúvidas, para que ' + pr + ' possa refazer a ' +
    'avaliação e alcançar um resultado ainda melhor. Contamos com a parceria de vocês para incentivar ' + pr +
    ' nesse reforço.';
  y = paragrafo(carta, M + 2, y, W - 2 * M - 4, 10.5, helv, TEXT, 15.5) - 12;

  /* seção helper (pílula PILL + caixa de fundo suave, TOPO em y) */
  function secao(titulo, alturaCaixa) {
    var pw = bold.widthOfTextAtSize(titulo, 10) + 32;
    rrect(M, y, pw, 21, 10.5, { color: PILL });
    page.drawText(titulo, { x: M + 16, y: y - 15, size: 10, font: bold, color: WHITE });
    y -= 28;
    rrect(M, y, W - 2 * M, alturaCaixa, 14, { color: SOFT2, borderColor: BLUE, borderWidth: 1.5 });
  }

  /* 1 · avaliações — 2 caixas brancas, notas "X,0" azuis (sem vermelho) */
  var avH = 92;
  secao('AVALIAÇÕES', avH);
  var provas = [ { rot: 'PROVA ESCRITA', v: d.escrita }, { rot: 'PROVA AUDITIVA', v: d.auditiva } ];
  var pad = 24, gap = 20, boxW = (W - 2 * M - 2 * pad - gap) / 2, boxH = 68;
  var byTop = y - (avH - boxH) / 2;
  provas.forEach(function (p, i) {
    var bx = M + pad + i * (boxW + gap);
    var refazer = fisk2ndNum(p.v) && p.v < FISK_2ND_MIN;
    rrect(bx, byTop, boxW, boxH, 12, { color: WHITE, borderColor: BLUE, borderWidth: refazer ? 2 : 1.2 });
    var lw1 = bold.widthOfTextAtSize(p.rot, 9);
    page.drawText(p.rot, { x: bx + (boxW - lw1) / 2, y: byTop - 20, size: 9, font: bold, color: PILL });
    var val = fisk2ndFmt(p.v), vw = bold.widthOfTextAtSize(val, 24);
    page.drawText(val, { x: bx + (boxW - vw) / 2, y: byTop - 46, size: 24, font: bold, color: INK });
    if (refazer) { var t = 'refazer esta prova', tw = italic.widthOfTextAtSize(t, 7.5); page.drawText(t, { x: bx + (boxW - tw) / 2, y: byTop - 60, size: 7.5, font: italic, color: SUB }); }
  });
  y -= avH + 24;

  /* 2 · para a recuperação — itens do formulário (checkboxes + lições + texto livre) */
  var itens = (d.itens || []).slice();
  if (!itens.length) itens = ['Revisar o conteúdo trabalhado no período e refazer a avaliação com o apoio da escola.'];
  var contentH = itens.reduce(function (acc, it) { return acc + 13 * quebra(it, helv, 10, W - 2 * M - 60).length + 8; }, 0);
  var recH = Math.max(84, contentH + 24);
  secao('PARA A RECUPERAÇÃO', recH);
  var yy = y - 22;
  itens.forEach(function (it) {
    page.drawCircle({ x: M + 26, y: yy + 3.2, size: 2.4, color: BLUE });
    var wrapped = quebra(it, helv, 10, W - 2 * M - 60);
    wrapped.forEach(function (ln, li) { page.drawText(ln, { x: M + 38, y: yy - li * 13, size: 10, font: helv, color: TEXT }); });
    yy -= 13 * wrapped.length + 8;
  });

  /* assinatura ancorada perto do rodapé (documento ocupa a página) */
  var ySig = 108;
  page.drawText('Atenciosamente,', { x: W - M - 200, y: ySig + 22, size: 10, font: italic, color: SUB });
  page.drawLine({ start: { x: W - M - 210, y: ySig }, end: { x: W - M, y: ySig }, thickness: 1, color: BLUE });
  var prof = ((d.prof || '') || '').trim();
  page.drawText(prof ? ('Prof(a). ' + prof) : 'Professor(a) responsável', { x: W - M - 206, y: ySig - 13, size: 9, font: bold, color: PILL });
  page.drawText('Fisk Taubaté · Caçapava', { x: W - M - 206, y: ySig - 25, size: 8.5, font: helv, color: SUB });

  /* rodapé */
  centro('Fisk · Comprometidos com o seu aprendizado', 40, 8.5, italic, SUB);

  var bytes = await doc.save();
  var dataFile = ('0' + hoje.getDate()).slice(-2) + '-' + ('0' + (hoje.getMonth() + 1)).slice(-2) + '-' + hoje.getFullYear();
  var nomeArq = (nome || 'aluno').replace(/[\\/:*?"<>|]+/g, '').trim();
  return { bytes: bytes, filename: '2nd Chance - ' + nomeArq + ' - ' + dataFile + '.pdf' };
}
