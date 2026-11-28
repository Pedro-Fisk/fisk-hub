/* ══ O QUE CADA ATIVIDADE DAS SÉRIES FALA (Pedro, 28/11/2026) ═══════════════════════════════════════════════════════
 *
 *   node scripts/series-vozes-textos.js            → JSON { "<pasta>": { "<id>": ["texto", ...] } } na saída padrão
 *
 * Quem chama é o scripts/series-vozes.py, que gera os mp3. A lista sai do PRÓPRIO desenhista (assets/tema-slides.js),
 * montando cada atividade num Chromium: todo botão 🔊 (data-ouvir), as palavras do Important Words que vão ao celular
 * (slide.vocab) e a frase do "ouça e escolha" (slide.jogo.ouvir). Assim, palavra nova num conteúdo entra sozinha, sem
 * uma segunda lista para esquecer de atualizar.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.join(__dirname, '..');
const PASTAS = ['buddy-talks', 'countries', 'everyday-life', 'youtubers'];

(async () => {
  const br = await chromium.launch();
  const p = await br.newPage();
  await p.route('**/*', (r) => (r.request().url().startsWith('http://series/')
    ? r.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }) : r.abort()));
  await p.goto('http://series/');
  await p.addScriptTag({ path: path.join(RAIZ, 'assets/tema-slides.js') });
  const saida = {};
  for (const pasta of PASTAS) {
    const ind = path.join(RAIZ, pasta, 'index.json');
    if (!fs.existsSync(ind)) continue;
    saida[pasta] = {};
    for (const it of JSON.parse(fs.readFileSync(ind, 'utf8'))) {
      const o = JSON.parse(fs.readFileSync(path.join(RAIZ, pasta, it.id + '.json'), 'utf8'));
      saida[pasta][it.id] = await p.evaluate((o) => {
        const d = FiskTema.montar(o.lesson, o.design || {}, { base: '' }), t = new Set();
        d.slides.forEach((s) => {
          [].forEach.call(s.el.querySelectorAll('[data-ouvir]'), (b) => t.add(b.getAttribute('data-ouvir')));
          (s.vocab || []).forEach((w) => t.add(w));
          if (s.jogo && s.jogo.ouvir) t.add(s.jogo.ouvir);
        });
        return [...t].map((x) => String(x || '').trim()).filter(Boolean);
      }, o);
    }
  }
  await br.close();
  process.stdout.write(JSON.stringify(saida));
})().catch((e) => { console.error(e); process.exit(1); });
