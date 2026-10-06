/* ══ O MOTOR DO TERMO DE ATRASO (separado em 06/10/2026) ═══════════════════
 * O desenho do PDF do Comunicado de Atraso, tirado de dentro do
 * termo-atraso.html para servir a DOIS lugares com o MESMO código: o Gerador
 * de Termo e o Buddy (buddy.html), que gera o termo a pedido do professor.
 * Duas cópias do desenho um dia sairiam diferentes para a mesma família.
 *
 * fiskTermoPDF(d) → Promise<{ bytes, filename }>
 *   d = { nome, book, prof, horario, atraso, faltas, ultima, prevista,
 *         motivos:[textos de FISK_TERMO_MOTIVOS], outros,
 *         sugestoes:[textos de FISK_TERMO_SUGESTOES], livres, logo? }
 * Precisa do pdf-lib (PDFLib) carregado antes.
 * ═══════════════════════════════════════════════════════════════════════════ */
var FISK_TERMO_MOTIVOS = ['Dificuldade em acompanhar as atividades do plano de curso', 'Faltas às aulas',
                          'Conversas paralelas durante as aulas', 'Costuma fazer as tarefas de casa em sala de aula'];
var FISK_TERMO_SUGESTOES = ['Participar das tutorias semanais (aulas extras, sem custo adicional)',
                            'Revisar em casa as lições em atraso, com o áudio do livro',
                            'Fazer as tarefas de casa para melhorar o aproveitamento do tempo de aula', 'Evitar faltas'];
function fiskTermoTituloCaso(s) { s = String(s || '').toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); }
/* os dias e o horário saem do título da turma: da primeira menção a um dia da semana em diante */
function fiskTermoHorario(titulo) {
  var l = String(titulo || '').split('\n')[0];
  var m = l.match(/(2ª|3ª|4ª|5ª|6ª|s[áa]b\.?|dom\.?).*$/i);
  return m ? m[0].trim() : '';
}
/* a mensagem de WhatsApp que acompanha o termo (06/10/2026): no molde da do 2nd chance, sem números e sem gênero
   (o termo vale para aluno e aluna). O professor copia e envia; ninguém envia por ele. */
function fiskTermoMensagem(nome, prof) {
  nome = String(nome || '').trim(); prof = String(prof || '').trim();
  var pr = nome.split(/\s+/)[0] || 'seu/sua filho(a)', assina = prof ? ('Prof. ' + prof) : 'a professora / o professor';
  return 'Olá, família! Tudo bem? 😊\n\n' +
    'Aqui é ' + assina + ', da Fisk. Estou enviando em anexo um comunicado sobre o andamento de ' + (nome || 'seu/sua filho(a)') + ' no curso.\n\n' +
    'Notamos que o plano de curso de ' + pr + ' está com algumas aulas de atraso, e queremos ajudar a retomar o ritmo com tranquilidade. Para isso, a escola oferece as tutorias, que são aulas extras sem nenhum custo.\n\n' +
    'No comunicado explico a situação e o que podemos fazer juntos. Qualquer dúvida, estou à disposição. Conte comigo e com a escola! 🧡';
}
async function fiskTermoPDF(d) {
  d = d || {};
  d.nome = String(d.nome || '').trim();
  var atrasoTxt = (d.atraso == null || d.atraso === '') ? '' : String(d.atraso);
  var faltasTxt = (d.faltas == null || d.faltas === '') ? '' : String(d.faltas);
  var PDF = PDFLib;
  var doc = await PDF.PDFDocument.create();
  var page = doc.addPage([595.28, 841.89]); // A4
  var helv = await doc.embedFont(PDF.StandardFonts.Helvetica);
  var bold = await doc.embedFont(PDF.StandardFonts.HelveticaBold);
  var italic = await doc.embedFont(PDF.StandardFonts.HelveticaOblique);

  /* paleta azul do documento (ecoa os azuis do próprio card) */
  var BLUE = PDF.rgb(0.043, 0.325, 0.58);      // #0b5394 — molduras
  var PILL = PDF.rgb(0.027, 0.216, 0.388);     // #073763 — pílulas de seção
  var SOFT = PDF.rgb(0.91, 0.945, 0.98);       // #e8f1fa — preenchimentos suaves
  var TITLE = PDF.rgb(0.29, 0.333, 0.376);     // #4a5560 — título (boletim)
  var SUB = PDF.rgb(0.42, 0.467, 0.502);       // #6b7780 — subtítulo
  var TEXT = PDF.rgb(0.121, 0.11, 0.11);       // #1f1c1c
  var WHITE = PDF.rgb(1, 1, 1);
  var W = 595.28, M = 44;

  /* retângulo arredondado (princípio visual do boletim) */
  function rrect(x, yTop, w, h, r, opts) {
    var p = 'M ' + r + ',0 H ' + (w - r) + ' A ' + r + ' ' + r + ' 0 0 1 ' + w + ' ' + r +
      ' V ' + (h - r) + ' A ' + r + ' ' + r + ' 0 0 1 ' + (w - r) + ' ' + h +
      ' H ' + r + ' A ' + r + ' ' + r + ' 0 0 1 0 ' + (h - r) +
      ' V ' + r + ' A ' + r + ' ' + r + ' 0 0 1 ' + r + ' 0 Z';
    page.drawSvgPath(p, Object.assign({ x: x, y: yTop }, opts));
  }
  function centro(texto, y, size, font, color) {
    var w = font.widthOfTextAtSize(texto, size);
    page.drawText(texto, { x: (W - w) / 2, y: y, size: size, font: font, color: color });
  }
  function quebrar(texto, font, size, larguraMax) {
    var out = [];
    String(texto).split('\n').forEach(function (par) {
      var atual = '';
      par.split(' ').forEach(function (pp) {
        var t = atual ? atual + ' ' + pp : pp;
        if (font.widthOfTextAtSize(t, size) > larguraMax) { out.push(atual); atual = pp; }
        else atual = t;
      });
      out.push(atual);
    });
    return out;
  }

  var y = 812;

  /* cabeçalho: logo + título central + subtítulo itálico (estilo boletim) */
  try {
    var img = await fetch(d.logo || 'assets/fisk-logo.png').then(function (r) { return r.arrayBuffer(); });
    var png = await doc.embedPng(img);
    var lh = 26, lw = png.width * (lh / png.height);
    page.drawImage(png, { x: W - M - lw, y: y - lh + 6, width: lw, height: lh });
  } catch (e) {
    page.drawText('FISK', { x: W - M - 52, y: y - 12, size: 22, font: bold, color: PDF.rgb(0.847, 0.122, 0.149) });
  }
  centro('COMUNICADO DE ATRASO NO PLANO DE CURSO', y - 10, 14.5, bold, TITLE);
  centro('Comunicado aos pais ou responsáveis.', y - 27, 10.5, italic, SUB);
  y -= 44;

  /* pílula de data à direita (rc-datebox) */
  var hoje = new Date();
  var dataStr = 'Data: ' + ('0' + hoje.getDate()).slice(-2) + '/' + ('0' + (hoje.getMonth() + 1)).slice(-2) + '/' + hoje.getFullYear();
  rrect(W - M - 120, y, 120, 18, 9, { borderColor: BLUE, borderWidth: 1.2 });
  page.drawText(dataStr, { x: W - M - 104, y: y - 12.5, size: 8.5, font: helv, color: TEXT });
  y -= 26;

  /* moldura de identificação */
  rrect(M, y, W - 2 * M, 58, 12, { borderColor: BLUE, borderWidth: 2 });
  function idCampo(rotulo, valor, x, yy, larg) {
    page.drawText(rotulo, { x: x, y: yy, size: 9, font: bold, color: TEXT });
    var lx = x + bold.widthOfTextAtSize(rotulo, 9) + 5;
    page.drawLine({ start: { x: lx, y: yy - 2.5 }, end: { x: x + larg, y: yy - 2.5 }, thickness: 1, color: BLUE });
    page.drawText(String(valor || ''), { x: lx + 3, y: yy, size: 9.5, font: helv, color: TEXT });
  }
  idCampo('Aluno(a):', d.nome, M + 14, y - 22, 300);
  idCampo('Estágio:', (d.book || ''), M + 330, y - 22, 175);
  idCampo('Professor(a):', (d.prof || ''), M + 14, y - 44, 180);
  idCampo('Dias e horário:', (d.horario || ''), M + 210, y - 44, 295);
  y -= 74;

  /* carta (texto gentil, com o nome do aluno e tutorias) */
  var nome = d.nome.trim();
  var primeiro = nome.split(' ')[0];
  var nAtraso = atrasoTxt || '____';
  var carta =
    'Prezada família,\n' +
    'Queremos manter vocês próximos da jornada de ' + nome + ' aqui na Fisk. Notamos que ' + primeiro +
    ' está ' + nAtraso + ' aula(s) atrasado(a) em relação ao plano de curso, e nosso objetivo é ajudá-lo(a) a ' +
    'retomar o ritmo com tranquilidade. Para isso, convidamos ' + primeiro + ' a participar das tutorias, ' +
    'aulas extras, sem nenhum custo adicional, para que possa concluir seu livro (estágio) na data prevista. ' +
    'É nosso compromisso oferecer todas as oportunidades para que cada aluno avance no seu melhor potencial, ' +
    'e contamos com a parceria de vocês nessa caminhada.';
  quebrar(carta, helv, 9.8, W - 2 * M - 8).forEach(function (l) {
    page.drawText(l, { x: M + 4, y: y, size: 9.8, font: helv, color: TEXT });
    y -= 13.5;
  });
  y -= 10;

  /* seção: pílula azul-escura + caixa arredondada (pill-head do boletim) */
  function secao(titulo, alturaCaixa) {
    var pw = bold.widthOfTextAtSize(titulo, 9.5) + 28;
    rrect(M, y, pw, 20, 10, { color: PILL });
    page.drawText(titulo, { x: M + 14, y: y - 13.5, size: 9.5, font: bold, color: WHITE });
    y -= 26;
    rrect(M, y, W - 2 * M, alturaCaixa, 12, { borderColor: BLUE, borderWidth: 2 });
  }

  /* 1 · situação do aluno — 4 caixinhas (gradecell) */
  secao('SITUAÇÃO DO ALUNO', 52);
  var stats = [
    ['ÚLTIMA LIÇÃO FEITA', d.ultima || '–'],
    ['LIÇÃO PREVISTA', d.prevista || '–'],
    ['AULAS ATRASADAS', atrasoTxt || '–'],
    ['FALTAS', faltasTxt || '0']
  ];
  var boxW = (W - 2 * M - 5 * 12) / 4;
  stats.forEach(function (s, i) {
    var bx = M + 12 + i * (boxW + 12);
    rrect(bx, y - 8, boxW, 36, 8, { color: SOFT, borderColor: BLUE, borderWidth: 1.2 });
    var lw1 = bold.widthOfTextAtSize(s[0], 6.3);
    page.drawText(s[0], { x: bx + (boxW - lw1) / 2, y: y - 18, size: 6.3, font: bold, color: PILL });
    var vw = bold.widthOfTextAtSize(String(s[1]), 12);
    page.drawText(String(s[1]), { x: bx + (boxW - vw) / 2, y: y - 34, size: 12, font: bold, color: TEXT });
  });
  y -= 52 + 14;

  /* 2 · motivos do atraso — caixas de seleção desenhadas (fechadas) */
  var marcados = d.motivos || [];
  var motivos = FISK_TERMO_MOTIVOS.map(function (t) { return { texto: t, marcado: marcados.indexOf(t) > -1 }; });
  var outros = String(d.outros || '').trim();
  motivos.push({ texto: 'Outros: ' + (outros || '-'), marcado: !!outros });
  var altM = motivos.length * 16 + 18;
  secao('MOTIVOS DO ATRASO NO CURSO', altM);
  var my = y - 20;
  motivos.forEach(function (mo) {
    rrect(M + 14, my + 8.5, 10, 10, 2.5, mo.marcado
      ? { color: BLUE } : { borderColor: BLUE, borderWidth: 1.1 });
    if (mo.marcado) {
      page.drawLine({ start: { x: M + 16.2, y: my + 3.2 }, end: { x: M + 18.4, y: my + 1 }, thickness: 1.4, color: WHITE });
      page.drawLine({ start: { x: M + 18.4, y: my + 1 }, end: { x: M + 21.8, y: my + 6 }, thickness: 1.4, color: WHITE });
    }
    page.drawText(mo.texto, { x: M + 30, y: my, size: 9.2, font: mo.marcado ? bold : helv, color: TEXT });
    my -= 16;
  });
  y -= altM + 14;

  /* 3 · sugestões para compensação — itens escolhidos + texto livre */
  var sugestoes = FISK_TERMO_SUGESTOES.filter(function (t) { return (d.sugestoes || []).indexOf(t) > -1; });
  var livres = String(d.livres || '').trim();
  var linhasLivres = livres ? quebrar(livres, helv, 9.2, W - 2 * M - 44) : [];
  var altS = Math.max(1, sugestoes.length) * 15 + linhasLivres.length * 12.5 + 20;
  secao('SUGESTÕES PARA COMPENSAÇÃO', altS);
  var sy = y - 20;
  if (!sugestoes.length && !linhasLivres.length) {
    page.drawText('-', { x: M + 14, y: sy, size: 9.2, font: helv, color: TEXT });
  }
  sugestoes.forEach(function (s) {
    page.drawCircle({ x: M + 18, y: sy + 3, size: 1.7, color: BLUE });
    page.drawText(s, { x: M + 26, y: sy, size: 9.2, font: helv, color: TEXT });
    sy -= 15;
  });
  linhasLivres.forEach(function (l) {
    page.drawText(l, { x: M + 26, y: sy, size: 9.2, font: italic, color: TEXT });
    sy -= 12.5;
  });
  y -= altS + 26;

  /* assinaturas */
  page.drawText('Atenciosamente,', { x: W - M - 150, y: y, size: 9.5, font: helv, color: TEXT });
  y -= 40;
  [[M, 'Ciente: pais ou responsável'], [W / 2 + 24, 'Assinatura do(a) professor(a)']].forEach(function (s) {
    page.drawLine({ start: { x: s[0], y: y }, end: { x: s[0] + 205, y: y }, thickness: .9, color: BLUE });
    page.drawText(s[1], { x: s[0], y: y - 12, size: 8.5, font: helv, color: SUB });
    page.drawText('Data: ____/____/______', { x: s[0], y: y - 26, size: 8.5, font: helv, color: SUB });
  });

  var bytes = await doc.save();
  return { bytes: bytes, filename: 'Termo de Atraso - ' + d.nome + '.pdf' };
}
