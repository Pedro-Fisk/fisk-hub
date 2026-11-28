/* ══ AS ATIVIDADES "EVERYDAY LIFE 🏡" NA CONVERSAÇÃO (Pedro, 28/11/2026: "converter os 30 PowerPoints, menos os de Kids
 * e Teens") ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
 *
 *   node scripts/build-everyday.js
 *
 * Lê scripts/everyday/conteudo.js (o texto dos PowerPoints de Basic & Teens, Intermediate e Advanced da pasta
 * "Everyday Life 🏡" do Drive Master, transcrito; os temas 08 e 09 não existem em nenhum nível, então são 27) e escreve:
 *   everyday-life/<id>.json   { lesson, design } de uma atividade (o formato do .cmjson do Conversation Maker)
 *   everyday-life/index.json  a lista, para a categoria "🏡 Everyday Life" da conversacao.html
 *
 * Arquivo GERADO: não edite os .json à mão; mude o conteúdo e rode de novo.
 *
 * A cara é a do PowerPoint (pele 'everyday' do assets/tema-slides.js): slides pretos com as faixas do tema, a foto no
 * painel da direita e os títulos em imagem, em everyday-life/img/. A ordem também: capa, Material Needed, Objectives,
 * Important Words (+ as notas do professor), Language Game, Conversation. O jogo é clicável no celular dos alunos.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ATIVIDADES = require('./everyday/conteudo.js');
const SAIDA = path.join(__dirname, '../everyday-life');

/* as faixas de cada tema, como no PowerPoint (o esquema de cores é do tema, não do nível) */
const FAIXAS = {
  amarelo: ['#002060', '#FFC000'], rosa: ['#002060', '#FF3399'], turquesa: ['#65BBBF', '#002060'],
  terracota: ['#9D3D23', '#65BBBF'], chocolate: ['#990000', '#9D3D23'], 'verde-agua': ['#00ACA0', '#00B0F0'],
};
const NIVEIS = { basic: ['Basic', 'Teens'], intermediate: ['Intermediate'], advanced: ['Advanced'] };
/* nota do PowerPoint que não é slide para a turma (caixa escondida, descrição de agrupamento) */
const SO_REGISTRO = /^(Tradução de apoio|Kinds of chocolate)/i;

function aula(a) {
  const f = a.fotos || {};
  return {
    coverTitle: a.capaTitulo || ('#' + String(a.num).padStart(2, '0')), coverLevel: a.nivel, ageLabel: '', language: 'english',
    topic: a.titulo, objectives: a.objetivos || [], material: a.material || ['PowerPoint activity'], duracao: a.duracao || '20 minutes',
    fotosSerie: { capa: f.capa || '', iw: f.iw || '', jogo: f.jogo || '', conv: f.conv || '', icone: a.icone || '' },
    vocabulary: (a.vocab || []).map((v) => ({ word: v[0], translation: v[1] || '' })),
    notas: (a.extras || []).filter((x) => !SO_REGISTRO.test(x.titulo || '')),
    languageGame: (a.jogo || []).map((g) => ({ question: g.q, options: g.options, correctIndex: g.correct })),
    conversation: (a.conversa || []).map((q) => ({ question: q[0], modelAnswers: q.slice(1) })),
    evaluation: [{ question: 'Did you enjoy talking about ' + a.titulo.toLowerCase().replace(/[?!.]+$/, '') + '?' }],
    semRevisao: true,   /* o PowerPoint não tem o "Do You Remember?" */
    serie: 'everyday-life',
  };
}

fs.mkdirSync(SAIDA, { recursive: true });
for (const f of fs.readdirSync(SAIDA)) if (/^el-.*\.json$/.test(f)) fs.unlinkSync(path.join(SAIDA, f));
const indice = [];
for (const a of ATIVIDADES) {
  const id = 'el-' + String(a.num).padStart(2, '0') + '-' + a.chave + '-' + a.id, lesson = aula(a);
  for (const im of Object.values(lesson.fotosSerie).filter(Boolean)) if (!fs.existsSync(path.join(SAIDA, 'img', im))) throw new Error(id + ': falta ' + im);
  const fx = FAIXAS[a.faixa] || FAIXAS.amarelo;
  const design = { modelo: 'tema', pele: 'everyday', imgs: 'everyday-life/img/', faixa1: fx[0], faixa2: fx[1], destaque: '#FFC000', escuro: true,
    paleta: { fundo: '#000000', fundo2: '#111111', prim: '#FFC000', sec: fx[0], dest: '#FFC000', txt: '#ffffff' },
    fontes: { titulo: 'Montserrat', corpo: 'Nunito' }, fundo: 'gradiente', heroi: 'house', icones: ['house'] };
  fs.writeFileSync(path.join(SAIDA, id + '.json'), JSON.stringify({ lesson, design }, null, 1) + '\n');
  indice.push({ id, num: a.num, nome: String(a.num).padStart(2, '0') + ' - ' + a.titulo + ' - ' + a.nivel, niveis: NIVEIS[a.id] || [a.nivel], jogo: lesson.languageGame.length });
}
fs.writeFileSync(path.join(SAIDA, 'index.json'), JSON.stringify(indice, null, 1) + '\n');
console.log(indice.length + ' atividades em everyday-life/ (' + new Set(indice.map((x) => x.num)).size + ' temas, ' + indice.filter((x) => x.jogo).length + ' com jogo)');
