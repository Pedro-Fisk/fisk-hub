/* A VERSÃO LEVE DO INFORMATIVO (Pedro, 26/11/2026: "tem como deixar o carregamento mais rápido?").
 * O PDF do Canva de novembro tinha 10 páginas e 23 MB (220 imagens, várias com 4.000 px), e a TV desenha a 1.920 de
 * qualquer jeito. Aqui cada página vira uma foto de 2.560 px de largura, JPEG 90%, e as fotos viram um PDF de imagens:
 * ~4 MB, igual na tela (comparação ampliada aprovada pelo Pedro). O original fica intacto na pasta do Drive.
 *
 * Quem usa: o informativo-tv.html (a direção completa a leve que faltar) e o Portal da Secretaria (gera junto do envio),
 * que carrega este arquivo pelo endereço do Hub. Precisa do pdf.js (pdfjsLib) já carregado na página.
 *
 *   fiskInfvLeveDoDoc(doc, aoAndar?)    doc do pdf.js  → Promise<Uint8Array> (o PDF leve)
 *   fiskInfvLeveDeBytes(bytes, aoAndar?) bytes do PDF  → idem (abre uma CÓPIA: o pdf.js toma posse do buffer)
 *   aoAndar(feitas, total) a cada página.
 */
(function () {
  var LARGURA = 2560, QUALIDADE = 0.9;

  function jpegDaPagina(pg) {
    var v1 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: LARGURA / v1.width });
    var c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);   /* JPEG não tem transparência */
    return pg.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
      return new Promise(function (ok, erro) {
        c.toBlob(function (b) {
          if (!b) return erro(new Error('não consegui gerar a imagem da página'));
          var cw = c.width, ch = c.height;
          c.width = c.height = 0;   /* solta a memória do canvas grande */
          b.arrayBuffer().then(function (ab) {
            ok({ jpg: new Uint8Array(ab), w: cw, h: ch, pw: v1.width, ph: v1.height });
          }, erro);
        }, 'image/jpeg', QUALIDADE);
      });
    });
  }

  /* Um PDF mínimo: catálogo, árvore de páginas e, por página, a página, o conteúdo e a imagem (DCTDecode = o JPEG cru). */
  function montaPdf(pags) {
    var partes = [], tam = 0, offs = [], enc = new TextEncoder();
    function poe(x) { var u = typeof x === 'string' ? enc.encode(x) : x; partes.push(u); tam += u.length; }
    function obj(n, corpo, stream) {
      offs[n] = tam; poe(n + ' 0 obj\n' + corpo + '\n');
      if (stream) { poe('stream\n'); poe(stream); poe('\nendstream\n'); }
      poe('endobj\n');
    }
    var n = pags.length, total = 2 + n * 3;
    poe('%PDF-1.4\n%âãÏÓ\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    var kids = []; for (var i = 0; i < n; i++) kids.push((3 + i * 3) + ' 0 R');
    obj(2, '<< /Type /Pages /Count ' + n + ' /Kids [' + kids.join(' ') + '] >>');
    pags.forEach(function (p, i) {
      var pg = 3 + i * 3, ct = pg + 1, im = pg + 2, W = p.pw.toFixed(2), H = p.ph.toFixed(2);
      var conteudo = enc.encode('q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q');
      obj(pg, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + ct + ' 0 R >>');
      obj(ct, '<< /Length ' + conteudo.length + ' >>', conteudo);
      obj(im, '<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.jpg.length + ' >>', p.jpg);
    });
    var xref = tam, linhas = ['xref', '0 ' + (total + 1), '0000000000 65535 f '];
    for (var k = 1; k <= total; k++) linhas.push(String(offs[k]).padStart(10, '0') + ' 00000 n ');
    poe(linhas.join('\n') + '\ntrailer\n<< /Size ' + (total + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    var out = new Uint8Array(tam), p0 = 0;
    partes.forEach(function (u) { out.set(u, p0); p0 += u.length; });
    return out;
  }

  window.fiskInfvLeveDoDoc = function (doc, aoAndar) {
    var pags = [], cadeia = Promise.resolve();
    for (var i = 1; i <= doc.numPages; i++) (function (k) {
      cadeia = cadeia.then(function () { return doc.getPage(k); }).then(jpegDaPagina).then(function (p) {
        pags.push(p); if (aoAndar) try { aoAndar(pags.length, doc.numPages); } catch (e) {}
        return new Promise(function (r) { setTimeout(r, 30); });   /* respira entre as páginas: a TV segue passando */
      });
    })(i);
    return cadeia.then(function () { return montaPdf(pags); });
  };
  window.fiskInfvLeveDeBytes = function (bytes, aoAndar) {
    if (!window.pdfjsLib) return Promise.reject(new Error('o leitor de PDF não carregou'));
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js';
    return pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise.then(function (doc) {
      return window.fiskInfvLeveDoDoc(doc, aoAndar).then(function (u) { try { doc.destroy(); } catch (e) {} return u; });
    });
  };
  /* base64 de bytes grandes sem estourar a pilha */
  window.fiskInfvB64 = function (u) {
    var s = '', P = 0x8000;
    for (var i = 0; i < u.length; i += P) s += String.fromCharCode.apply(null, u.subarray(i, i + P));
    return btoa(s);
  };
})();
