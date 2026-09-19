/* Leitor de bolinhas da folha do MET (verso, questões 1-100).
   Sem dependências: roda no navegador (canvas) e no node (testes).
   Imagem = {w, h, d: Float32Array} em cinza 0..1 (1 = branco).
   Coordenadas do molde em pontos do PDF (A4 595.276 x 841.89). */
(function (root) {
'use strict';

var PAGE_W = 595.276, PAGE_H = 841.89;
var R_RING = 4.8;     // raio do anel impresso (pt)
var R_IN = 3.3;       // disco medido por dentro do anel (pt)

/* ---------- imagem ---------- */
function img(w, h, d) { return { w: w, h: h, d: d || new Float32Array(w * h) }; }

function downscale(im, maxSide) {
  var f = Math.max(im.w, im.h) / maxSide;
  if (f <= 1) return im;
  var w = Math.round(im.w / f), h = Math.round(im.h / f), o = img(w, h);
  for (var y = 0; y < h; y++) {
    var y0 = Math.floor(y * f), y1 = Math.min(im.h, Math.floor((y + 1) * f));
    for (var x = 0; x < w; x++) {
      var x0 = Math.floor(x * f), x1 = Math.min(im.w, Math.floor((x + 1) * f)), s = 0, n = 0;
      for (var yy = y0; yy < y1; yy++) for (var xx = x0; xx < x1; xx++) { s += im.d[yy * im.w + xx]; n++; }
      o.d[y * w + x] = n ? s / n : 1;
    }
  }
  return o;
}

function boxBlur(im, r) {
  var w = im.w, h = im.h, t = new Float32Array(w * h), o = img(w, h), x, y, s, i;
  for (y = 0; y < h; y++) {
    s = 0; var row = y * w;
    for (x = -r; x <= r; x++) s += im.d[row + Math.min(w - 1, Math.max(0, x))];
    for (x = 0; x < w; x++) {
      t[row + x] = s / (2 * r + 1);
      s += im.d[row + Math.min(w - 1, x + r + 1)] - im.d[row + Math.max(0, x - r)];
    }
  }
  for (x = 0; x < w; x++) {
    s = 0;
    for (y = -r; y <= r; y++) s += t[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (y = 0; y < h; y++) {
      o.d[y * w + x] = s / (2 * r + 1);
      s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x];
    }
  }
  return o;
}

function maxFilter(im, r) {
  var w = im.w, h = im.h, t = new Float32Array(w * h), o = img(w, h), x, y, k, m;
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    m = 0;
    for (k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) if (im.d[y * w + k] > m) m = im.d[y * w + k];
    t[y * w + x] = m;
  }
  for (x = 0; x < w; x++) for (y = 0; y < h; y++) {
    m = 0;
    for (k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) if (t[k * w + x] > m) m = t[k * w + x];
    o.d[y * w + x] = m;
  }
  return o;
}

function sample(im, x, y) {
  if (x < 0 || y < 0 || x > im.w - 1 || y > im.h - 1) return 1;
  var x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  var x1 = Math.min(im.w - 1, x0 + 1), y1 = Math.min(im.h - 1, y0 + 1), d = im.d, w = im.w;
  return d[y0 * w + x0] * (1 - fx) * (1 - fy) + d[y0 * w + x1] * fx * (1 - fy) +
         d[y1 * w + x0] * (1 - fx) * fy + d[y1 * w + x1] * fx * fy;
}

/* ---------- homografia (molde pt -> foto px) ---------- */
function solve(A, b) {
  var n = b.length, i, j, k;
  for (i = 0; i < n; i++) {
    var p = i;
    for (j = i + 1; j < n; j++) if (Math.abs(A[j][i]) > Math.abs(A[p][i])) p = j;
    var tA = A[i]; A[i] = A[p]; A[p] = tA; var tb = b[i]; b[i] = b[p]; b[p] = tb;
    if (Math.abs(A[i][i]) < 1e-12) return null;
    for (j = i + 1; j < n; j++) {
      var f = A[j][i] / A[i][i];
      for (k = i; k < n; k++) A[j][k] -= f * A[i][k];
      b[j] -= f * b[i];
    }
  }
  var x = new Array(n);
  for (i = n - 1; i >= 0; i--) {
    var s = b[i];
    for (j = i + 1; j < n; j++) s -= A[i][j] * x[j];
    x[i] = s / A[i][i];
  }
  return x;
}

// mínimos quadrados com >= 4 pares [[x,y],[X,Y]]; normaliza para estabilidade
function homography(pairs) {
  function norm(pts) {
    var mx = 0, my = 0, s = 0, i;
    for (i = 0; i < pts.length; i++) { mx += pts[i][0]; my += pts[i][1]; }
    mx /= pts.length; my /= pts.length;
    for (i = 0; i < pts.length; i++) s += Math.hypot(pts[i][0] - mx, pts[i][1] - my);
    s = Math.SQRT2 / (s / pts.length);
    return { mx: mx, my: my, s: s };
  }
  var P = pairs.map(function (p) { return p[0]; }), Q = pairs.map(function (p) { return p[1]; });
  var a = norm(P), c = norm(Q);
  var AtA = [], Atb = [], i, j, k;
  for (i = 0; i < 8; i++) { AtA.push([0, 0, 0, 0, 0, 0, 0, 0]); Atb.push(0); }
  for (k = 0; k < pairs.length; k++) {
    var x = (P[k][0] - a.mx) * a.s, y = (P[k][1] - a.my) * a.s;
    var X = (Q[k][0] - c.mx) * c.s, Y = (Q[k][1] - c.my) * c.s;
    var rows = [[x, y, 1, 0, 0, 0, -x * X, -y * X, X], [0, 0, 0, x, y, 1, -x * Y, -y * Y, Y]];
    rows.forEach(function (r) {
      for (i = 0; i < 8; i++) { Atb[i] += r[i] * r[8]; for (j = 0; j < 8; j++) AtA[i][j] += r[i] * r[j]; }
    });
  }
  var h = solve(AtA, Atb);
  if (!h) return null;
  var Hn = [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1]];
  var Ta = [[a.s, 0, -a.s * a.mx], [0, a.s, -a.s * a.my], [0, 0, 1]];
  var Tci = [[1 / c.s, 0, c.mx], [0, 1 / c.s, c.my], [0, 0, 1]];
  return mul(Tci, mul(Hn, Ta));
}
function mul(A, B) {
  var C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j];
  return C;
}
function apply(H, x, y) {
  var z = H[2][0] * x + H[2][1] * y + H[2][2];
  return [(H[0][0] * x + H[0][1] * y + H[0][2]) / z, (H[1][0] * x + H[1][1] * y + H[1][2]) / z];
}

// retifica a foto para o espaço do molde, s px por pt, só na janela [x0,y0,x1,y1] pt
function warp(photo, H, s, box) {
  box = box || [0, 0, PAGE_W, PAGE_H];
  var w = Math.round((box[2] - box[0]) * s), h = Math.round((box[3] - box[1]) * s), o = img(w, h);
  for (var v = 0; v < h; v++) for (var u = 0; u < w; u++) {
    var p = apply(H, box[0] + (u + 0.5) / s, box[1] + (v + 0.5) / s);
    o.d[v * w + u] = sample(photo, p[0], p[1]);
  }
  return o;
}

/* ---------- 1. achar a folha na foto ---------- */
function otsu(im) {
  var hist = new Array(256).fill(0), i, n = im.d.length;
  for (i = 0; i < n; i++) hist[Math.max(0, Math.min(255, Math.round(im.d[i] * 255)))]++;
  var sum = 0; for (i = 0; i < 256; i++) sum += i * hist[i];
  var sB = 0, wB = 0, best = 0, t = 128;
  for (i = 0; i < 256; i++) {
    wB += hist[i]; if (!wB) continue;
    var wF = n - wB; if (!wF) break;
    sB += i * hist[i];
    var mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
    if (v > best) { best = v; t = i; }
  }
  return t / 255;
}

function otsuAbove(im, lo) {
  var sub = [];
  for (var i = 0; i < im.d.length; i++) if (im.d[i] > lo) sub.push(im.d[i]);
  return sub.length > 100 ? otsu({ d: sub }) : lo;
}

// componente clara que contém o centro da foto (o papel), para um limiar t
function paperBlob(bl, t) {
  var w = bl.w, h = bl.h, n = w * h, mask = new Uint8Array(n), lab = new Uint8Array(n), i;
  for (i = 0; i < n; i++) mask[i] = bl.d[i] > t ? 1 : 0;
  // semente: pixel claro mais perto do centro
  var seed = -1, cx = w >> 1, cy = h >> 1;
  for (var r = 0; r < Math.min(w, h) / 4 && seed < 0; r++)
    for (var dy = -r; dy <= r && seed < 0; dy++) for (var dx = -r; dx <= r; dx++) {
      var p0 = (cy + dy) * w + cx + dx;
      if (mask[p0]) { seed = p0; break; }
    }
  if (seed < 0) return null;
  var stack = [seed], cnt = 0, edge = 0; lab[seed] = 1;
  while (stack.length) {
    var p = stack.pop(); cnt++;
    var px = p % w, py = (p - px) / w;
    if (px === 0 || py === 0 || px === w - 1 || py === h - 1) edge++;
    var nb = [px > 0 ? p - 1 : -1, px < w - 1 ? p + 1 : -1, py > 0 ? p - w : -1, py < h - 1 ? p + w : -1];
    for (var k = 0; k < 4; k++) { var q = nb[k]; if (q >= 0 && mask[q] && !lab[q]) { lab[q] = 1; stack.push(q); } }
  }
  return { lab: lab, area: cnt / n, edge: edge / (2 * (w + h)) };
}

function quadArea(c) {
  var a = 0;
  for (var i = 0; i < 4; i++) { var p = c[i], q = c[(i + 1) % 4]; a += p[0] * q[1] - q[0] * p[1]; }
  return Math.abs(a) / 2;
}
function blobCorners(blob, w, h) {
  var c = [[1e9, null], [-1e9, null], [-1e9, null], [1e9, null]];
  for (var i = 0; i < w * h; i++) {
    if (!blob.lab[i]) continue;
    var x = i % w, y = (i - x) / w, a = x + y, d = x - y;
    if (a < c[0][0]) c[0] = [a, [x, y]];
    if (d > c[1][0]) c[1] = [d, [x, y]];
    if (a > c[2][0]) c[2] = [a, [x, y]];
    if (d < c[3][0]) c[3] = [d, [x, y]];
  }
  return c.map(function (e) { return e[1]; });
}

// devolve os 4 cantos do papel [TL, TR, BR, BL] em px da foto, ou null.
// Varre limiares e fica com a maior mancha clara que é de fato um quadrilátero.
function findPaper(photo) {
  var small = downscale(photo, 480), f = photo.w / small.w;
  var bl = maxFilter(boxBlur(small, 2), 3), w = small.w, h = small.h, best = null;
  var t1 = otsu(bl) * 0.8;
  for (var j = 0; j <= 24; j++) {
    var t = t1 + (0.98 - t1) * j / 24, b = paperBlob(bl, t);
    if (!b || b.area < 0.12 || b.area > 0.97 || b.edge > 0.08) continue;
    var c = blobCorners(b, w, h), fill = b.area * w * h / Math.max(1, quadArea(c));
    var sc = b.area * Math.pow(Math.min(fill, 1 / fill), 6);
    if (!best || sc > best.sc) best = { sc: sc, c: c, fill: fill, t: t };
  }
  if (!best || best.fill < 0.85) return null;
  return best.c.map(function (p) { return [(p[0] + 0.5) * f, (p[1] + 0.5) * f]; });
}

/* ---------- 1b. achar a folha pelas barras LISTENING e READING ---------- */
// Não depende da mesa: as duas barras cinzas têm tamanho, alinhamento e distância
// únicos na página. Devolve candidatos de homografia (molde pt -> foto px).
var BAR_L = [36.0, 178.0, 54.8, 295.0], BAR_R = [36.0, 498.2, 54.8, 621.2], BAR_REG = [68.2, 88.0, 247.0, 125.0];
function minFilter(im, r) {
  var neg = img(im.w, im.h), i;
  for (i = 0; i < im.d.length; i++) neg.d[i] = 1 - im.d[i];
  var m = maxFilter(neg, r);
  for (i = 0; i < m.d.length; i++) m.d[i] = 1 - m.d[i];
  return m;
}
function findBars(photo) {
  var small = downscale(photo, 700), f = photo.w / small.w, w = small.w, h = small.h, i;
  var bg = boxBlur(maxFilter(small, 12), 12), n = img(w, h);
  for (i = 0; i < w * h; i++) n.d[i] = Math.min(1, small.d[i] / Math.max(0.05, bg.d[i]));
  var cl = maxFilter(minFilter(n, 2), 2);            // fecha as letras brancas dentro da barra
  var lab = new Int32Array(w * h), comps = [], cur = 0, stack = [];
  for (i = 0; i < w * h; i++) {
    if (lab[i] || cl.d[i] > 0.72) continue;
    cur++; stack.push(i); lab[i] = cur;
    var sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, cnt = 0;
    while (stack.length) {
      var p = stack.pop(), px = p % w, py = (p - px) / w;
      cnt++; sx += px; sy += py; sxx += px * px; syy += py * py; sxy += px * py;
      var nb = [px > 0 ? p - 1 : -1, px < w - 1 ? p + 1 : -1, py > 0 ? p - w : -1, py < h - 1 ? p + w : -1];
      for (var k = 0; k < 4; k++) { var q = nb[k]; if (q >= 0 && !lab[q] && cl.d[q] <= 0.72) { lab[q] = cur; stack.push(q); } }
    }
    if (cnt < 30 || cnt > w * h * 0.05) continue;
    var mx = sx / cnt, my = sy / cnt, a = sxx / cnt - mx * mx, c = syy / cnt - my * my, b = sxy / cnt - mx * my;
    var tr = a + c, dt = Math.sqrt(Math.max(0, (a - c) * (a - c) / 4 + b * b));
    var l1 = tr / 2 + dt, l2 = tr / 2 - dt, len = Math.sqrt(12 * l1), wid = Math.sqrt(12 * Math.max(l2, 1e-6));
    var ang = 0.5 * Math.atan2(2 * b, a - c);
    if (root.__dbg && len / wid > 2.5) root.__dbg.push({ x: Math.round(mx * f), y: Math.round(my * f), len: +(len * f).toFixed(1), wid: +(wid * f).toFixed(1), fill: +(cnt / (len * wid)).toFixed(2), ang: +(ang * 57.3).toFixed(0) });
    if (len / wid < 3.5 || cnt / (len * wid) < 0.6) continue;
    comps.push({ x: mx * f, y: my * f, len: len * f, wid: wid * f, ang: ang });
  }
  // hipóteses de uma barra só (a foto cortou a outra): cada barra pode ser
  // LISTENING, READING ou REGISTRATION NUMBER, em pé ou de cabeça para baixo
  var single = [];
  var ROLES = [[BAR_L, Math.PI / 2], [BAR_R, Math.PI / 2], [BAR_REG, 0]];
  comps.forEach(function (C) {
    ROLES.forEach(function (ro) {
      var bx = ro[0], bw = bx[2] - bx[0], bh = bx[3] - bx[1];
      var Lr = Math.max(bw, bh), Wr = Math.min(bw, bh);
      if (Math.abs(Math.log((C.len / C.wid) / (Lr / Wr))) > 0.4) return;
      var sc = C.len / Lr, ctr = [(bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2];
      [0, Math.PI].forEach(function (flip) {
        var rot = C.ang - ro[1] + flip, cs = sc * Math.cos(rot), sn = sc * Math.sin(rot);
        single.push([[cs, -sn, C.x - (cs * ctr[0] - sn * ctr[1])], [sn, cs, C.y - (sn * ctr[0] + cs * ctr[1])], [0, 0, 1]]);
      });
    });
  });
  var tl = [(BAR_L[0] + BAR_L[2]) / 2, (BAR_L[1] + BAR_L[3]) / 2], tr2 = [(BAR_R[0] + BAR_R[2]) / 2, (BAR_R[1] + BAR_R[3]) / 2];
  var Lt = BAR_L[3] - BAR_L[1], Dt = tr2[1] - tl[1], out = [];
  for (var u = 0; u < comps.length; u++) for (var v = 0; v < comps.length; v++) {
    if (u === v) continue;
    var A = comps[u], B = comps[v], d = Math.hypot(B.x - A.x, B.y - A.y), L = (A.len + B.len) / 2;
    if (Math.abs(A.len - B.len) / L > 0.25) continue;
    var da = Math.abs(Math.sin(A.ang - B.ang)), dir = Math.atan2(B.y - A.y, B.x - A.x);
    if (da > 0.15 || Math.abs(Math.sin(dir - A.ang)) > 0.15) continue;
    var ratio = d / L;
    if (Math.abs(ratio - Dt / Lt) > 0.5) continue;
    // A = LISTENING, B = READING: semelhança pelos dois centros
    var sc = d / Dt, rot = dir - Math.PI / 2, cs = sc * Math.cos(rot), sn = sc * Math.sin(rot);
    var tx = A.x - (cs * tl[0] - sn * tl[1]), ty = A.y - (sn * tl[0] + cs * tl[1]);
    out.push([[cs, -sn, tx], [sn, cs, ty], [0, 0, 1]]);
  }
  return { pares: out, unicas: single };
}

// correlação da página inteira, sem busca (só para ordenar hipóteses)
function pageScore(photo, H, r) {
  var s = r.w / PAGE_W, w = warpPx(photo, H, s, 0, 0, r.w, r.h), n = r.w * r.h, a = 0, b = 0, i;
  for (i = 0; i < n; i++) { a += w.d[i]; b += r.d[i]; }
  a /= n; b /= n;
  var sab = 0, saa = 0, sbb = 0;
  for (i = 0; i < n; i++) { var x = w.d[i] - a, y = r.d[i] - b; sab += x * y; saa += x * x; sbb += y * y; }
  return sab / Math.sqrt(saa * sbb + 1e-12);
}

/* ---------- 2. âncoras e casamento por correlação ---------- */
// regiões do molde (pt) com desenho único na página
var ANCHORS = [
  [20, 20, 125, 118],    // canto em L + barra REGISTRATION NUMBER
  [440, 22, 580, 80],    // logo MET
  [28, 160, 112, 300],   // barra LISTENING + 1..8
  [28, 488, 112, 628],   // barra READING + 51..57
  [520, 768, 582, 826],  // canto em L inferior
  [26, 780, 60, 820]     // "2"
];
// pontas de coluna: dão apoio à direita e embaixo, mas são repetitivas
// (uma linha parece a vizinha), então só entram em busca curta, depois das únicas
var ANCHORS2 = [
  [440, 340, 585, 440],  // fim da 4a coluna do listening (48-50 e o branco abaixo)
  [440, 660, 585, 826],  // fim da 4a coluna do reading (99-100) até o canto
  [330, 700, 440, 775],  // fim da 3a coluna do reading (88-89)
  [330, 380, 440, 470]   // fim da 3a coluna do listening (38-39)
];

function patchOf(ref, s, box) {
  var x0 = Math.round(box[0] * s), y0 = Math.round(box[1] * s);
  var w = Math.round((box[2] - box[0]) * s), h = Math.round((box[3] - box[1]) * s), o = img(w, h);
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) o.d[y * w + x] = ref.d[(y0 + y) * ref.w + x0 + x];
  return o;
}

// melhor deslocamento (px) de pat dentro de win; win = pat + 2*R em cada eixo
function ncc(win, pat, R, step) {
  step = step || 1;
  var n = pat.w * pat.h, mp = 0, i, x, y;
  for (i = 0; i < n; i++) mp += pat.d[i];
  mp /= n;
  var pz = new Float32Array(n), sp = 0;
  for (i = 0; i < n; i++) { pz[i] = pat.d[i] - mp; sp += pz[i] * pz[i]; }
  var best = -2, bx = 0, by = 0;
  for (var dy = -R; dy <= R; dy += step) for (var dx = -R; dx <= R; dx += step) {
    var s = 0, s2 = 0, sxy = 0;
    for (y = 0; y < pat.h; y++) {
      var row = (y + dy + R) * win.w + dx + R, prow = y * pat.w;
      for (x = 0; x < pat.w; x++) { var v = win.d[row + x]; s += v; s2 += v * v; sxy += v * pz[prow + x]; }
    }
    var varw = s2 - s * s / n;
    var c = varw > 1e-9 ? sxy / Math.sqrt(varw * sp) : -1;
    if (c > best) { best = c; bx = dx; by = dy; }
  }
  return { dx: bx, dy: by, score: best };
}

// acha o deslocamento de uma região do molde na foto retificada por H
function warpPx(photo, H, s, px0, py0, w, h) {
  var o = img(w, h);
  for (var v = 0; v < h; v++) for (var u = 0; u < w; u++) {
    var p = apply(H, (px0 + u + 0.5) / s, (py0 + v + 0.5) / s);
    o.d[v * w + u] = sample(photo, p[0], p[1]);
  }
  return o;
}
function locate(photo, H, ref, s, box, Rpt, step) {
  var R = Math.round(Rpt * s), pat = patchOf(ref, s, box);
  var px0 = Math.round(box[0] * s), py0 = Math.round(box[1] * s);
  var win = warpPx(photo, H, s, px0 - R, py0 - R, pat.w + 2 * R, pat.h + 2 * R);
  var r = ncc(win, pat, R, step);
  if (step > 1) r = nccAround(win, pat, R, r.dx, r.dy, step);
  return { dx: r.dx / s, dy: r.dy / s, score: r.score,
           cx: (px0 + pat.w / 2) / s, cy: (py0 + pat.h / 2) / s };
}
function nccAround(win, pat, R, cx, cy, rad) {
  var n = pat.w * pat.h, mp = 0, i, x, y;
  for (i = 0; i < n; i++) mp += pat.d[i];
  mp /= n;
  var pz = new Float32Array(n), sp = 0;
  for (i = 0; i < n; i++) { pz[i] = pat.d[i] - mp; sp += pz[i] * pz[i]; }
  var best = -2, bx = cx, by = cy;
  for (var dy = Math.max(-R, cy - rad); dy <= Math.min(R, cy + rad); dy++)
    for (var dx = Math.max(-R, cx - rad); dx <= Math.min(R, cx + rad); dx++) {
      var s = 0, s2 = 0, sxy = 0;
      for (y = 0; y < pat.h; y++) {
        var row = (y + dy + R) * win.w + dx + R, prow = y * pat.w;
        for (x = 0; x < pat.w; x++) { var v = win.d[row + x]; s += v; s2 += v * v; sxy += v * pz[prow + x]; }
      }
      var varw = s2 - s * s / n, c = varw > 1e-9 ? sxy / Math.sqrt(varw * sp) : -1;
      if (c > best) { best = c; bx = dx; by = dy; }
    }
  return { dx: bx, dy: by, score: best };
}

// H seguido de um deslocamento (dx,dy) em pt no espaço do molde
function shift(H, dx, dy) { return mul(H, [[1, 0, dx], [0, 1, dy], [0, 0, 1]]); }

// tira, um por vez, o par que mais discorda do ajuste (resíduo em pt do molde)
function robust(pairs, Hbase, tol) {
  while (pairs.length > 4) {
    var H = homography(pairs), Hi = inv(H), worst = -1, wi = -1;
    pairs.forEach(function (p, i) {
      var b = apply(Hi, p[1][0], p[1][1]), e = Math.hypot(b[0] - p[0][0], b[1] - p[0][1]);
      if (e > worst) { worst = e; wi = i; }
    });
    if (worst <= tol) break;
    pairs = pairs.filter(function (_, i) { return i !== wi; });
  }
  return pairs;
}
function inv(m) {
  var a = m[0][0], b = m[0][1], c = m[0][2], d = m[1][0], e = m[1][1], f = m[1][2], g = m[2][0], h = m[2][1], i = m[2][2];
  var A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
  return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
          [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
          [C / det, -(a * h - b * g) / det, (a * e - b * d) / det]];
}

// polinômio (grau 1 ou 2) por mínimos quadrados: dx e dy em função da linha
function polyfit(rows, g) {
  function one(key) {
    var n = g + 1, A = [], b = [], i, j;
    for (i = 0; i < n; i++) { A.push(new Array(n).fill(0)); b.push(0); }
    rows.forEach(function (r) {
      var p = []; for (i = 0; i < n; i++) p.push(Math.pow(r.i, i));
      for (i = 0; i < n; i++) { b[i] += p[i] * r[key]; for (j = 0; j < n; j++) A[i][j] += p[i] * p[j]; }
    });
    var c = solve(A, b) || [0, 0, 0];
    return function (t) { var v = 0; for (var k = 0; k < c.length; k++) v += c[k] * Math.pow(t, k); return v; };
  }
  return { x: one('dx'), y: one('dy') };
}
// reta por mínimos quadrados: dx e dy em função do índice da linha
function linfit(rows) {
  var n = rows.length, si = 0, sii = 0, sx = 0, sy = 0, six = 0, siy = 0;
  rows.forEach(function (r) { si += r.i; sii += r.i * r.i; sx += r.dx; sy += r.dy; six += r.i * r.dx; siy += r.i * r.dy; });
  var den = n * sii - si * si;
  var bx = den ? (n * six - si * sx) / den : 0, by = den ? (n * siy - si * sy) / den : 0;
  return { ax: (sx - bx * si) / n, bx: bx, ay: (sy - by * si) / n, by: by };
}

/* ---------- 3. blocos de bolinhas ---------- */
function blocks(tpl) {
  // 8 blocos: 4 colunas x (listening, reading)
  var groups = [[1, 13], [14, 26], [27, 39], [40, 50], [51, 63], [64, 76], [77, 89], [90, 100]];
  return groups.map(function (g) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var q = g[0]; q <= g[1]; q++) tpl.bubbles[q].forEach(function (b) {
      x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[0]); y1 = Math.max(y1, b[1]);
    });
    var m = 8; // margem: inclui o número da questão à esquerda e borda branca
    return { q0: g[0], q1: g[1], box: [x0 - m - 22, y0 - m, x1 + m, y1 + m] };
  });
}

/* ---------- tirar sombra e luz irregular da foto inteira ---------- */
function flatten(photo) {
  var small = downscale(photo, 500), fx = small.w / photo.w, fy = small.h / photo.h;
  var bg = boxBlur(maxFilter(small, 5), 3), o = img(photo.w, photo.h);
  for (var y = 0; y < photo.h; y++) for (var x = 0; x < photo.w; x++) {
    var b = sample(bg, (x + 0.5) * fx - 0.5, (y + 0.5) * fy - 0.5);
    o.d[y * photo.w + x] = Math.min(1, photo.d[y * photo.w + x] / Math.max(0.05, b));
  }
  return o;
}

/* ---------- leitura completa ---------- */
// refs: {r1: molde a 1 px/pt, r2: molde a 2 px/pt}; tpl: posições das bolinhas
function read(photo0, tpl, refs, opts) {
  opts = opts || {};
  var photo = opts.semAplainar ? photo0 : flatten(photo0);
  var log = [];
  var cands = [], dst = [[0, 0], [PAGE_W, 0], [PAGE_W, PAGE_H], [0, PAGE_H]];
  var corners = opts.corners || findPaper(photo);
  if (corners) {
    // folha deitada na foto: o lado mais longo tem de ser a altura
    var e01 = Math.hypot(corners[1][0] - corners[0][0], corners[1][1] - corners[0][1]);
    var e12 = Math.hypot(corners[2][0] - corners[1][0], corners[2][1] - corners[1][1]);
    var base = e01 > e12 ? [corners[3], corners[0], corners[1], corners[2]] : corners.slice();
    [0, 2].forEach(function (rot) {
      var c = base.slice(rot).concat(base.slice(0, rot));
      cands.push({ H: homography(dst.map(function (p, i) { return [p, c[i]]; })), de: 'papel' });
    });
  }
  if (!opts.corners) {
    var fb = findBars(photo);
    fb.pares.forEach(function (H) { cands.push({ H: H, de: 'barras' }); });
    // barra única: pré-seleciona pela semelhança da página inteira em baixa resolução
    var r025 = refs.r025 || (refs.r025 = downscale(refs.r1, Math.max(refs.r1.w, refs.r1.h) / 4));
    fb.unicas.map(function (H) { return { H: H, sc: pageScore(photo, H, r025) }; })
      .sort(function (a, b) { return b.sc - a.sc; }).slice(0, 4)
      .forEach(function (c) { cands.push({ H: c.H, de: 'barra' }); });
  }
  if (!cands.length) return recusa(['bordas'], log);
  var r05 = refs.r05 || (refs.r05 = downscale(refs.r1, Math.max(refs.r1.w, refs.r1.h) / 2));
  var best = null;
  cands.forEach(function (cd) {
    var H = cd.H;
    // grosso: 0,5 px/pt, janela de 90 pt; fino: 1 px/pt, 4 pt em volta do grosso
    var found = ANCHORS.map(function (a) {
      var g = locate(photo, H, r05, 0.5, a, 90, 1);
      var f = locate(photo, shift(H, g.dx, g.dy), refs.r1, 1, a, 4, 1);
      f.dx += g.dx; f.dy += g.dy; return f;
    });
    var sc = found.reduce(function (s, f) { return s + f.score; }, 0) / found.length;
    if (!best || sc > best.sc) best = { H: H, found: found, sc: sc, de: cd.de };
  });
  log.push('candidatos ' + cands.length + ', venceu ' + best.de);
  log.push('ancoras ' + best.found.map(function (f) { return f.score.toFixed(2); }).join(' '));
  // H1: âncoras boas, descartando a que discordar das demais
  var pairs = best.found.filter(function (f) { return f.score > 0.5; }).map(function (f) {
    return [[f.cx, f.cy], apply(best.H, f.cx + f.dx, f.cy + f.dy)];
  });
  pairs = robust(pairs, best.H, 3);
  if (pairs.length < 4) return recusa(['bordas', 'nitidez', 'verso'], log);
  var H1 = homography(pairs);
  // H2: encaixa a grade coluna por coluna, da esquerda para a direita; cada coluna
  // encaixada corrige a estimativa da próxima (janela de 8 pt < meio passo de 19,5)
  var bl = blocks(tpl), pairs2 = [], Hc = H1;
  for (var col = 0; col < 4; col++) {
    [bl[col], bl[col + 4]].forEach(function (b) {
      var f = locate(photo, Hc, refs.r2, 2, b.box, 8, 1);
      b.score = f.score;
      if (f.score > 0.3) pairs2.push([[f.cx, f.cy], apply(Hc, f.cx + f.dx, f.cy + f.dy)]);
    });
    if (pairs2.length >= 2) Hc = homography(pairs2.concat(pairs));
  }
  log.push('blocos ' + bl.map(function (b) { return b.score.toFixed(2); }).join(' '));
  var H2 = Hc;
  // ajuste fino linha a linha (a folha pode estar curvada: nenhuma homografia serve
  // para a página inteira). Cada linha (número + 4 bolinhas) casa numa janela de 4 pt;
  // o deslocamento tem de variar suave ao longo do bloco (reta em função da linha).
  var off = {}, ruins = 0;
  bl.forEach(function (b) {
    var rows = [];
    for (var q = b.q0; q <= b.q1; q++) {
      var bb = tpl.bubbles[q], box = [bb[0][0] - 30, bb[0][1] - 7, bb[3][0] + 7, bb[0][1] + 7];
      var f = locate(photo, H2, refs.r2, 2, box, 7, 1);
      rows.push({ q: q, i: q - b.q0, dx: f.dx, dy: f.dy, sc: f.score, bom: f.score > 0.3 });
    }
    var fit = null;
    for (var it = 0; it < 4; it++) {
      var ok = rows.filter(function (r) { return r.bom; });
      if (ok.length < Math.min(6, rows.length - 2)) { fit = null; break; }
      fit = polyfit(ok, ok.length >= 8 ? 2 : 1);
      var pior = null;
      ok.forEach(function (r) {
        r.res = Math.hypot(r.dx - fit.x(r.i), r.dy - fit.y(r.i));
        if (!pior || r.res > pior.res) pior = r;
      });
      if (pior.res <= 1.2) break;
      pior.bom = false;
    }
    var nbons = rows.filter(function (r) { return r.bom; }).length;
    b.check = { bons: nbons, de: rows.length, fit: fit };
    var n1 = rows.length - 1;
    if (!fit || nbons < Math.max(5, rows.length * 0.6) ||
        Math.abs(fit.x(n1) - fit.x(0)) > 10 || Math.abs(fit.y(n1) - fit.y(0)) > 10) { ruins++; return; }
    rows.forEach(function (r) { off[r.q] = [fit.x(r.i), fit.y(r.i)]; });
  });
  log.push('linhas ' + bl.map(function (b) { return b.check.bons + '/' + b.check.de; }).join(' '));
  if (ruins) return recusa(['verso', 'curva', 'nitidez', 'angulo'], log);

  // 4. medir: retifica a 3 px/pt e normaliza a luz
  var s = 3, W = warp(photo, H2, s);
  var small = downscale(W, Math.max(W.w, W.h) / 4), fx = small.w / W.w, fy = small.h / W.h;
  var bg = boxBlur(maxFilter(small, 5), 2);  // fundo de papel, em ~0,75 px/pt (escala de uma bolinha: a borda de sombra não vaza)
  var N = img(W.w, W.h);
  for (var y = 0; y < W.h; y++) for (var x = 0; x < W.w; x++) {
    var b = sample(bg, (x + 0.5) * fx - 0.5, (y + 0.5) * fy - 0.5);
    N.d[y * W.w + x] = Math.min(1, W.d[y * W.w + x] / Math.max(0.05, b));
  }
  var raw = {};
  for (var q = 1; q <= 100; q++) raw[q] = tpl.bubbles[q].map(function (c) { return darkness(N, s, [c[0] + off[q][0], c[1] + off[q][1]]); });

  // métricas de qualidade da foto
  var q = { pxPorPt: Math.hypot(apply(H2, 300, 420)[0] - apply(H2, 301, 420)[0], apply(H2, 300, 420)[1] - apply(H2, 301, 420)[1]),
            ancoras: best.found.map(function (f) { return +f.score.toFixed(2); }),
            curva: Math.max.apply(null, bl.map(function (b) { var f = b.check.fit, n1 = b.check.de - 1; return Math.max(Math.abs(f.x(n1) - f.x(0)), Math.abs(f.y(n1) - f.y(0))); })),
            linhas: Math.min.apply(null, bl.map(function (b) { return b.check.bons / b.check.de; })) };
  // luz: brilho do papel (antes de aplainar) dentro da página
  var lum = [];
  for (var yy = 60; yy < 800; yy += 20) for (var xx = 40; xx < 560; xx += 20) { var pp = apply(H2, xx, yy); lum.push(sample(bgPhoto(photo0), pp[0] * bgPhoto.f - 0.5, pp[1] * bgPhoto.f - 0.5)); }
  lum.sort(function (a, b) { return a - b; });
  q.luz = +(lum[Math.floor(lum.length * 0.05)] / lum[Math.floor(lum.length * 0.95)]).toFixed(2);
  q.brilho = +lum[Math.floor(lum.length * 0.5)].toFixed(2);
  // nitidez: contraste do anel impresso nas bolinhas vazias
  var anel = [];
  for (var qq = 1; qq <= 100; qq++) for (var kk = 0; kk < 4; kk++) {
    var c0 = tpl.bubbles[qq][kk]; anel.push(ringContrast(N, s, [c0[0] + off[qq][0], c0[1] + off[qq][1]]));
  }
  anel.sort(function (a, b) { return a - b; });
  q.nitidez = +anel[Math.floor(anel.length * 0.5)].toFixed(2);
  var res = decide(raw, bl);
  var outros = [];
  // ruído da foto: só as duas bolinhas mais claras de cada questão (sempre vazias;
  // dupla marcação e borracha são do aluno e vão para a conferência, não recusam a foto)
  res.questoes.forEach(function (x) { var f = x.fill.slice().sort(function (a, b) { return b - a; }); outros.push(f[2], f[3]); });
  outros.sort(function (a, b) { return a - b; });
  q.ruido = +outros[Math.floor(outros.length * 0.98)].toFixed(3);
  res.qualidade = q;
  var probs = conferirFoto(q, opts);
  if (probs.length) return recusa(probs, log, q);
  res.baixaResolucao = q.pxPorPt < Object.assign({}, PADRAO, opts.padrao || {}).pxPorPtIdeal;
  res.ok = true; res.log = log; res.off = off; res.H = H2; res.corners = corners; res.norm = N; res.s = s;
  return res;
}

// escuridão média no disco interno (0 = branco, 1 = preto). Cada ponto de dentro é
// comparado com o papel logo fora do anel NA MESMA DIREÇÃO (8 setores): uma borda de
// sombra que corta a bolinha escurece o papel daquele lado também, e se cancela.
var SET = 8, R_OUT0 = 8.5, R_OUT1 = 10.5;
function darkness(N, s, c) {
  var st = 1 / s, k, papel = new Array(SET).fill(0), cnt, dx, dy, vals = [];
  for (k = 0; k < SET; k++) vals.push([]);
  for (dy = -R_OUT1; dy <= R_OUT1; dy += st) for (dx = -R_OUT1; dx <= R_OUT1; dx += st) {
    var r2 = dx * dx + dy * dy;
    if (r2 < R_OUT0 * R_OUT0 || r2 > R_OUT1 * R_OUT1) continue;
    k = setor(dx, dy);
    vals[k].push(sample(N, (c[0] + dx) * s - 0.5, (c[1] + dy) * s - 0.5));
  }
  for (k = 0; k < SET; k++) {
    // o papel é o mais claro do setor (marca que vazou para fora não conta)
    var v = vals[k].sort(function (a, b) { return b - a; });
    papel[k] = v.length ? v[Math.floor(v.length * 0.25)] : 1;
  }
  var sum = 0, n = 0;
  for (dy = -R_IN; dy <= R_IN; dy += st) for (dx = -R_IN; dx <= R_IN; dx += st) {
    if (dx * dx + dy * dy > R_IN * R_IN) continue;
    var p = Math.max(0.05, papel[setor(dx, dy)]);
    sum += Math.max(0, 1 - sample(N, (c[0] + dx) * s - 0.5, (c[1] + dy) * s - 0.5) / p);
    n++;
  }
  return sum / n;
}
function setor(dx, dy) {
  var a = Math.atan2(dy, dx);
  return ((Math.floor((a + Math.PI) / (2 * Math.PI) * SET) % SET) + SET) % SET;
}

// anel impresso: quão mais escuro que o papel logo fora (foto borrada apaga o anel)
function ringContrast(N, s, c) {
  var st = 1 / s, ring = [], out = [];
  for (var dy = -7; dy <= 7; dy += st) for (var dx = -7; dx <= 7; dx += st) {
    var r = Math.hypot(dx, dy), v = sample(N, (c[0] + dx) * s - 0.5, (c[1] + dy) * s - 0.5);
    if (r >= 4.3 && r <= 5.3) ring.push(v); else if (r >= 6 && r <= 7) out.push(v);
  }
  ring.sort(function (a, b) { return a - b; }); out.sort(function (a, b) { return b - a; });
  return 1 - ring[Math.floor(ring.length * 0.2)] / Math.max(0.05, out[Math.floor(out.length * 0.3)]);
}
// fundo de papel da foto crua (para medir sombra), memorizado por foto
function bgPhoto(photo) {
  if (bgPhoto.src === photo) return bgPhoto.bg;
  var small = downscale(photo, 400);
  bgPhoto.src = photo; bgPhoto.f = small.w / photo.w; bgPhoto.bg = boxBlur(maxFilter(small, 4), 2);
  return bgPhoto.bg;
}

/* ---------- padrão de envio: na dúvida, recusa ---------- */
/* pxPorPt: abaixo de 0,8 recusa; entre 0,8 e 1,5 (a foto que passou pelo WhatsApp) ACEITA, mas marca
   `baixaResolucao` e a tela obriga o professor a conferir a folha endireitada (pedido do Pedro, 19/09/2026:
   "o prof consegue confirmar antes de corrigir oficialmente"). As outras travas não mudaram. */
var PADRAO = { pxPorPt: 0.8, pxPorPtIdeal: 1.5, ancora: 0.6, curva: 4, linhas: 0.95, luz: 0.7, brilho: 0.45, nitidez: 0.2, ruido: 0.05 };
var AVISOS = {
  bordas: 'A folha precisa aparecer inteira, com os quatro cantos dentro da foto.',
  verso: 'Confira se é o lado das bolinhas (página 2), e não a frente com o nome.',
  resolucao: 'A foto está com resolução muito baixa para ler as bolinhas. Aproxime o celular até a folha ocupar quase toda a tela.',
  curva: 'A folha está dobrada ou curvada. Apoie numa mesa, bem lisa.',
  angulo: 'Fotografe de cima, com o celular paralelo à folha.',
  sombra: 'Há sombra ou luz desigual sobre a folha. Cuidado com a sombra do celular e da mão.',
  escura: 'A foto está escura. Procure um lugar mais claro.',
  nitidez: 'A foto está tremida ou fora de foco. Segure firme e espere a câmera focar.',
  ruido: 'Há reflexo ou mancha atrapalhando a leitura das bolinhas.'
};
function conferirFoto(q, opts) {
  var P = Object.assign({}, PADRAO, opts.padrao || {}), p = [];
  if (q.pxPorPt < P.pxPorPt) p.push('resolucao');
  if (Math.min.apply(null, q.ancoras) < P.ancora) p.push('bordas');
  if (q.curva > P.curva || q.linhas < P.linhas) p.push('curva');
  if (q.luz < P.luz) p.push('sombra');
  if (q.brilho < P.brilho) p.push('escura');
  if (q.nitidez < P.nitidez) p.push('nitidez');
  if (q.ruido > P.ruido) p.push('ruido');
  return p;
}
function recusa(probs, log, q) {
  return { ok: false, motivo: probs[0], problemas: probs,
           erro: 'Sua foto não está no padrão de envio.', avisos: probs.map(function (k) { return AVISOS[k]; }),
           log: log, qualidade: q };
}

/* ---------- 5. decidir cada questão ---------- */
var T = { marca: 0.15, fraca: 0.07, segunda: 0.55 };

function decide(raw, bl) {
  // linha de base: bolinha vazia daquela letra naquele bloco (mediana; a maioria está vazia)
  var excess = {}, qs = [], L = 'ABCD';
  bl.forEach(function (b) {
    for (var k = 0; k < 4; k++) {
      var vals = [];
      for (var q = b.q0; q <= b.q1; q++) vals.push(raw[q][k]);
      vals.sort(function (a, c) { return a - c; });
      var base = vals[Math.floor(vals.length * 0.3)];
      for (q = b.q0; q <= b.q1; q++) { (excess[q] = excess[q] || [])[k] = raw[q][k] - base; }
    }
  });
  for (var q = 1; q <= 100; q++) {
    var e = excess[q], ord = [0, 1, 2, 3].sort(function (a, b) { return e[b] - e[a]; });
    var top = e[ord[0]], sec = e[ord[1]], st, resp = null;
    if (top < T.fraca) st = 'branco';
    else if (top < T.marca) { st = 'fraca'; resp = L[ord[0]]; }
    else if (sec >= T.marca || sec > top * T.segunda) { st = 'dupla'; resp = L[ord[0]]; }
    else { st = 'ok'; resp = L[ord[0]]; }
    qs.push({ q: q, resp: resp, status: st, fill: e.map(function (v) { return Math.round(v * 100) / 100; }) });
  }
  return { questoes: qs };
}

/* ---------- 6. nota ---------- */
var CEFR = {
  L: [[44, 'C1'], [32, 'B2'], [17, 'B1'], [11, 'A2'], [0, 'abaixo de A2']],
  R: [[45, 'C1'], [37, 'B2'], [22, 'B1'], [15, 'A2'], [0, 'abaixo de A2']]
};
function nivel(tab, n) { for (var i = 0; i < tab.length; i++) if (n >= tab[i][0]) return tab[i][1]; }
function score(respostas, key) {
  var L = 0, R = 0, erros = [];
  for (var q = 1; q <= 100; q++) {
    var ok = respostas[q] && respostas[q] === key[q - 1];
    if (ok) { if (q <= 50) L++; else R++; } else erros.push(q);
  }
  var nl = nivel(CEFR.L, L), nr = nivel(CEFR.R, R);
  var passa = ['B1', 'B2', 'C1'];
  return { listening: L, reading: R, cefrL: nl, cefrR: nr,
           pass: passa.indexOf(nl) >= 0 && passa.indexOf(nr) >= 0, erros: erros };
}

var api = { read: read, findPaper: findPaper, findBars: findBars, homography: homography, apply: apply, warp: warp,
            downscale: downscale, score: score, nivel: nivel, CEFR: CEFR, T: T, ANCHORS: ANCHORS,
            PAGE_W: PAGE_W, PAGE_H: PAGE_H, img: img, PADRAO: PADRAO, AVISOS: AVISOS };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OMRMET = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
