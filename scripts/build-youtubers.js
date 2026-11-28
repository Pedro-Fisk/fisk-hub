/* ══ AS ATIVIDADES "YOUTUBERS 🔺" NA CONVERSAÇÃO (Pedro, 28/11/2026: "a atividade de YouTubers pode ser a próxima
 * categoria a ser repaginada") ═════════════════════════════════════════════════════════════════════════════════════
 *
 *   node scripts/build-youtubers.js
 *
 * Lê scripts/youtubers/conteudo.js (os PowerPoints da pasta "Youtubers 🔺" do Drive Master, transcritos; cópias
 * idênticas entre as pastas de nível viraram uma entrada só, com as cópias em `drives`) e escreve:
 *   youtubers/<id>.json   { lesson, design } de uma atividade
 *   youtubers/index.json  a lista, para a categoria "▶️ YouTubers" da conversacao.html
 *
 * Arquivo GERADO: não edite os .json à mão; mude o conteúdo e rode de novo.
 *
 * A série tem montador próprio no assets/tema-slides.js (montaYt, pele 'youtuber'): a cara e a ordem do PowerPoint, o
 * vídeo do youtuber tocando do Drive dentro do slide, o Language Practice clicável no celular dos alunos.
 * ⚠️ O deck 04 (Amigo Gringo) é um .ppt de 14 MB que o conector do Drive não baixou: fica de fora (pendente) até
 * alguém converter para .pptx ou o texto ser digitado.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DECKS = require('./youtubers/conteudo.js');
const SAIDA = path.join(__dirname, '../youtubers');
const NIVEIS = { basic: ['Basic', 'Teens'], teens: ['Teens'], intermediate: ['Intermediate'], advanced: ['Advanced'], all: ['Basic', 'Teens', 'Intermediate', 'Advanced'] };

fs.mkdirSync(SAIDA, { recursive: true });
for (const f of fs.readdirSync(SAIDA)) if (/^yt-.*\.json$/.test(f)) fs.unlinkSync(path.join(SAIDA, f));
const indice = [], fora = [];
for (const d of DECKS) {
  if (d.pendente) { fora.push(d.num + '-' + d.id); continue; }
  const id = 'yt-' + String(d.num).padStart(2, '0') + '-' + d.chave + '-' + d.id;
  const fotos = d.fotos || {};
  for (const f of [fotos.capa, fotos.video, fotos.intro].concat(fotos.outras || []).filter(Boolean))
    if (!fs.existsSync(path.join(SAIDA, 'img', f))) throw new Error(id + ': falta ' + f);
  const lesson = {
    coverTitle: d.titulo, coverLevel: d.nivel, ageLabel: '', language: 'english', topic: d.titulo,
    yt: { capaTitulo: d.capaTitulo, material: d.material, duracao: d.duracao, objetivos: d.objetivos || [], intro: d.intro || '',
      video: d.video || {}, warmup: d.warmup || [], discussao: d.discussao || [], conversa: d.conversa || [], pratica: d.pratica || [],
      jogo: d.jogo || [], vocab: d.vocab || [], avaliacao: d.avaliacao || [], fotos },
    serie: 'youtubers',
  };
  let niveis = NIVEIS[d.id] || [d.nivel];
  if (/Advanced/.test(d.nivel) && !niveis.includes('Advanced')) niveis = niveis.concat('Advanced');
  const design = { modelo: 'tema', pele: 'youtuber', imgs: 'youtubers/img/', escuro: true,
    paleta: { fundo: '#0D0D0D', fundo2: '#404040', prim: '#ffffff', sec: '#DC0505', dest: '#DC0505', txt: '#ffffff' },
    fontes: { titulo: 'Montserrat', corpo: 'Nunito' }, fundo: 'gradiente', heroi: 'television', icones: ['television'] };
  fs.writeFileSync(path.join(SAIDA, id + '.json'), JSON.stringify({ lesson, design }, null, 1) + '\n');
  indice.push({ id, num: d.num, nome: String(d.num).padStart(2, '0') + ' - ' + d.titulo + ' - ' + d.nivel, niveis, jogo: (d.jogo || []).length, video: !!(d.video && (d.video.drive || d.video.youtube)) });
}
fs.writeFileSync(path.join(SAIDA, 'index.json'), JSON.stringify(indice, null, 1) + '\n');
console.log(indice.length + ' atividades em youtubers/ (' + new Set(indice.map((x) => x.num)).size + ' temas)' + (fora.length ? '; fora (não lidos): ' + fora.join(', ') : ''));
