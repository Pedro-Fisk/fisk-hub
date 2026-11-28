/* ══ AS ATIVIDADES "COUNTRIES 🚩" NA CONVERSAÇÃO (Pedro, 28/11/2026: "pode seguir para a produção das atividades de
 * countries") ═════════════════════════════════════════════════════════════════════════════════════════════════════
 *
 *   node scripts/build-countries.js
 *
 * Lê scripts/countries/conteudo.js (o texto dos 19 PowerPoints da pasta "Countries 🚩" do Drive Master, transcrito)
 * e escreve, para a conversação da semana tocar com o desenhista do Hub (assets/tema-slides.js, pele 'countries'):
 *   countries/<id>.json    { lesson, design } de uma atividade (o mesmo formato do .cmjson do Conversation Maker)
 *   countries/index.json   a lista, para a categoria "🌍 Countries" da conversacao.html
 *
 * Arquivo GERADO: não edite os .json à mão; mude o conteúdo e rode de novo.
 *
 * Como o PowerPoint vira slide (a ordem é a do original):
 *   capa (a foto do país, a bandeira, COUNTRIES #05) → objetivos → Introduction (o texto e as perguntas de aquecimento)
 *   → o quadro do país (capital, línguas, moeda) → as fotos com a legenda 📍 → Important Words (com 🔊 e a tradução no
 *   clique) → a leitura do roteiro (Peru) → o vídeo → True or False / Comprehension game (clicável nos celulares)
 *   → Pair Work → Do You Remember? → Activity Evaluation (no celular) → fim.
 *
 * ⚠️ OS VÍDEOS NÃO MORAM AQUI: o JSON leva só o id do mp4 no Drive Master (compartilhado com o link) e, quando há, o
 * do YouTube. O player do Drive só abre quando o professor toca no slide.
 * As fotos são as dos PowerPoints, comprimidas (countries/img/<país>/); as do Japão vêm do Inglês do Mundo do portal,
 * com os créditos em countries/img/jp/CREDITOS.md.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PAISES = require('./countries/conteudo.js');
const SAIDA = path.join(__dirname, '../countries');

const ORDEM = ['Basic', 'Teens', 'Intermediate', 'Advanced'];
const perg = (lista) => (lista || []).map((q) => ({ question: q[0], modelAnswers: q.slice(1) }));

function design(pais) {
  /* claro: os slides de conteúdo do original são brancos com o texto azul-marinho (as fotos ficam nos grandes) */
  return { modelo: 'tema', pele: 'countries', imgs: 'countries/img/', escuro: false,
    paleta: { fundo: '#ffffff', fundo2: '#eef3f8', prim: '#16365c', sec: pais.cor, dest: pais.cor, txt: '#16365c' },
    fontes: { titulo: 'Montserrat', corpo: 'Nunito' }, fundo: 'gradiente', heroi: 'globe-showing-americas', icones: ['globe-showing-americas'] };
}

function aula(pais, nv) {
  const de = (k) => (nv[k] !== undefined ? nv[k] : pais[k]);
  const jogo = (de('tf') || []).map((t) => ({ question: t[0], options: ['True', 'False'], correctIndex: t[1] ? 0 : 1, explanation: t[2] || '' }))
    .concat((de('quiz') || []).map((q) => ({ question: q[0], options: q[1], correctIndex: q[2] })));
  return {
    coverTitle: 'Countries · ' + pais.nome, coverLevel: nv.rotulo, ageLabel: '', language: 'english',
    topic: pais.nome, objectives: de('objetivos') || ['Talking about ' + pais.nome + '.', 'Developing conversation skills.'],
    pais: { nome: pais.nome, oficial: pais.oficial || '', num: pais.num, cor: pais.cor, bandeira: pais.bandeira, capa: pais.capa,
      capaLocal: pais.capaLocal || '', mapa: pais.mapa || '', texto: de('texto') || '', fatos: pais.fatos || [] },
    introText: de('intro') || '', introSub: de('introSub') || '',
    warmup: perg(de('warmup')),
    fotos: (de('fotos') || []).concat(nv.fotosExtra || []),
    vocabulary: (de('vocab') || []).map((v) => ({ word: v[0], translation: v[1] || '' })),
    vocabTitulo: de('vocabTitulo') || '', vocabSub: de('vocabSub') || '',
    video: de('video') || null, leitura: de('leitura') || null,
    languageGame: jogo, jogoTitulo: de('jogoTitulo') || (jogo.length ? 'Comprehension' : ''),
    conversation: perg(de('conversa')),
    evaluation: (de('avaliacao') || PAISES.AVALIA(pais.nome)).map((q) => ({ question: q })),
    serie: 'countries',
  };
}

fs.mkdirSync(SAIDA, { recursive: true });
for (const f of fs.readdirSync(SAIDA)) if (/^ct-.*\.json$/.test(f)) fs.unlinkSync(path.join(SAIDA, f));
const indice = [];
for (const pais of PAISES) {
  for (const nv of pais.niveis) {
    const id = 'ct-' + pais.chave + '-' + nv.id, lesson = aula(pais, nv);
    for (const ft of lesson.fotos.concat([{ img: pais.capa }, { img: pais.bandeira }, { img: pais.mapa }]))
      if (ft.img && !fs.existsSync(path.join(SAIDA, 'img', ft.img))) throw new Error(id + ': falta a imagem ' + ft.img);
    fs.writeFileSync(path.join(SAIDA, id + '.json'), JSON.stringify({ lesson, design: design(pais) }, null, 1) + '\n');
    indice.push({ id, num: pais.num, pais: pais.nome, nome: String(pais.num).padStart(2, '0') + ' - ' + pais.nome + ' - ' + nv.rotulo,
      niveis: nv.niveis, rotulo: nv.rotulo, jogo: lesson.languageGame.length, video: !!lesson.video });
  }
}
indice.sort((a, b) => a.num - b.num || ORDEM.indexOf(a.niveis[0]) - ORDEM.indexOf(b.niveis[0]));
fs.writeFileSync(path.join(SAIDA, 'index.json'), JSON.stringify(indice, null, 1) + '\n');
console.log(indice.length + ' atividades em countries/ (' + new Set(indice.map((x) => x.pais)).size + ' países, ' +
  indice.filter((x) => x.video).length + ' com vídeo, ' + indice.filter((x) => x.jogo).length + ' com jogo)');
