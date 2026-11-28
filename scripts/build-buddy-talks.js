/* ══ AS BUDDY TALKS NO PORTAL (Pedro, 28/11/2026: "faz as atividades do Buddy Talks; algumas têm áudios junto") ══════
 *
 *   node scripts/build-buddy-talks.js
 *
 * Lê o conteúdo das Buddy Talks que já existe no Conversation Maker (repositório irmão, lado a lado no disco, como o
 * gerador de gabarito do backend faz):
 *   ../conversation-maker/scripts/buddy-talks/conteudo/*.js   o texto de cada tópico, em Basic, Intermediate e Advanced
 *   ../conversation-maker/buddy-catalog.js                    de que livro, lição e página vem o áudio
 * e escreve, para a conversação da semana tocar com o desenhista do Hub (assets/tema-slides.js):
 *   buddy-talks/<id>.json    { lesson, design } de uma atividade (o mesmo formato do .cmjson do Conversation Maker)
 *   buddy-talks/index.json   a lista, para a categoria "🐻 Buddy Talks" da conversacao.html
 *
 * Arquivo GERADO: não edite os .json à mão; mude o conteúdo no Conversation Maker e rode de novo.
 *
 * Como cada parte vira slide:
 *   o Buddy apresentando o som, o "por quê" e o "se errar"  → Introdução
 *   a lista de prática                                       → Important Words, com 🔊 em cada palavra (voz neural)
 *   o áudio do livro (SAYING IT RIGHT A e B)                 → "🎧 Let's practice", um slide por faixa (a TV toca)
 *   tópico de contraste de som (-ed, the, ʌ/ɝ, æ/eɪ, aʊ/oʊ) → Language Game "ouça e escolha", com a própria lista
 *   os diálogos e as 9 perguntas                             → Pair Work, com a resposta-modelo
 *   a avaliação                                              → Activity Evaluation (no celular, com nota e comentário)
 *
 * ⚠️ OS ÁUDIOS DO LIVRO NÃO MORAM AQUI: são material da editora, e este repositório é público. O JSON leva só o id do
 * arquivo no Drive (a pasta Class Audio dos Transitions, em "Recursos do Aluno Fisk - Estágios"); a TV pede o áudio ao
 * backend (rota cmAudio, que só entrega os ids da lista CM_AUDIOS_OK do CmPortal.js). Mudou um id aqui? Mude lá.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const CM = path.join(__dirname, '../../conversation-maker');
const SAIDA = path.join(__dirname, '../buddy-talks');
const C = require(path.join(CM, 'buddy-catalog.js'));

/* o número da atividade na pasta "Buddy talks 🐻" do Drive (a ordem em que a série foi feita) */
const NUM = { 'tag-questions': 13, 'him-her-them': 14, 'and-of': 15, the: 16, mispronounced: 17, 'word-endings': 18,
  'final-ed': 19, 'uh-er': 20, 's-sound': 21, 'ae-ei': 22, 'au-ou': 23 };

/* os áudios do livro no Drive (a cópia da pasta Class Audio do estágio certo; conferido em 28/11/2026: o "LESSON 4" do
   Transitions 1 e o "LESSON 04" do Transitions 2 têm faixas de mesmo nome) */
const AUDIOS = {
  'ae-ei': ['1dR26ZtLoSK3C0vpGowv7IWB6V8AlBwN2', '1RD4XKFa0ex_4dx-O4BizlXNg1acYhETz'],
  'and-of': ['1y612hkl243MfeLCuY9THWzic5AWxqbm4', '10PbcEN035qB-9qjfdDFmo4Iuzu8k1Xmz'],
  'au-ou': ['1DsqqDqJkZOvyQ3zzyXZMAplAK5PDSav4', '1WiwKAtOeSUjYsEvGhiAXDFLn5JB4niwI'],
  'final-ed': ['1KGHqL0cICaoc5Y3peCyTwKsZ4mwf7Gh_', '1y5QPVJNWvdIFa2oNRdYOOsPhTCxo6aL3'],
  'him-her-them': ['1jcEuJ9-Y-6sXkaLM4esgp72B18aB2b2I', '12WgplHIe15LWB1HgKGm1m62H5sFHOGw8'],
  mispronounced: ['1Eu58CCufrFZrLshtpGx1JvCE2lj5DIFe', '1pdE8prAg_Pcv0fCanZZVa9ckJ8vYCEZg'],
  's-sound': ['1zF3FADzYkMu4y24ewa8rrFHgW_GxyzqG', '1sdWS5G-g3vcHmlzcalAUkDA3RIDdzcf3'],
  'tag-questions': ['1pKUxLKtJSzM85kb2Hz1cgOKoAadpe1D-', '1wvT1-2r55pnUkLGDnhp0PodyYiWs3tQ5'],
  the: ['1ylHMum7nDnTGufcW2q1az52APzeCMfQP', '1BawBRoZqva97ic_CN4mQV3cjypVXzMh-'],
  'uh-er': ['1wbvVr-yXXtPQHFu4pEpQaGHPVFUsjTSY', '10Ip23XKVVY3jivzrRcdYVX9aVsnNsafe'],
  'word-endings': ['1HgUpi67ato5Wpa7gbvIQ4JhqXCBl1TmS', '10fWjkYEMOZ4rm0pXLyFbuGap2_HNcSEU'],
};

/* a cara da série é a do PowerPoint ORIGINAL (Pedro, 28/11/2026: "mais parecido com a arte original, com a imagem
   original do urso"): a pele 'buddy' do assets/tema-slides.js, com as imagens tiradas do .pptx em buddy-talks/img/
   (o Buddy de busto, a cabeça, o logo BUDDY TALKS e o balão de fala), fundo preto e vinho, títulos azul-claros */
const DESIGN = { modelo: 'tema', pele: 'buddy', imgs: 'buddy-talks/img/', escuro: true,
  paleta: { fundo: '#3a0d0d', fundo2: '#5b1616', prim: '#38bdf8', sec: '#f87171', dest: '#dc2626', txt: '#ffffff' },
  fontes: { titulo: 'Montserrat', corpo: 'Nunito' }, fundo: 'gradiente', heroi: 'bear', icones: ['bear'] };

const NIVEL = { BASIC: 'Basic', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };
const junta = (linhas) => (linhas || []).map((x) => String(x)).join('').replace(/\s+/g, ' ').trim();
/* "THE FINAL -ED" → "The Final -ed"; o símbolo fonético entre barras fica como está ("/æ/ vs. /eɪ/", "The /s/ Sound") */
const titulo = (t) => String(t).split(' ').map((w) => (/^\/.+\/$/.test(w) || w === '/' ? w : w.toLowerCase() === 'vs.' ? 'vs.'
  : w.toLowerCase().replace(/^([a-z])/, (m, a) => a.toUpperCase()))).join(' ');

/** "walked  /t/" → { w: 'walked', tag: '/t/' }; "man x main" → { par: ['man', 'main'] }; o resto → { w } */
function lerItem(x) {
  const s = String(x).trim();
  let m = s.match(/^(.*?)\s+(\/[^/]+\/)$/);
  if (m) return { w: m[1].trim(), tag: m[2] };
  m = s.match(/^(.+?)\s+x\s+(.+)$/i);
  if (m) return { par: [m[1].trim(), m[2].trim()] };
  return { w: s };
}

/** O "ouça e escolha" quando a lista é contraste de som. Determinístico: rodar de novo dá o mesmo jogo. */
function jogoDe(itens) {
  const comTag = itens.filter((i) => i.tag), pares = itens.filter((i) => i.par);
  const sons = [...new Set(comTag.map((i) => i.tag))];
  if (comTag.length >= 3 && sons.length >= 2) {
    const opcoes = sons.slice(0, 3);
    return comTag.filter((i) => opcoes.includes(i.tag)).slice(0, 6).map((i) => ({ type: 'listen', question: 'Listen. Which sound do you hear?', audio: i.w, options: opcoes, correctIndex: opcoes.indexOf(i.tag) }));
  }
  if (pares.length >= 3) {
    return pares.slice(0, 6).map((p, k) => {
      const certa = k % 2;   /* alterna: a voz diz ora a primeira palavra, ora a segunda */
      return { type: 'listen', question: 'Listen. Which word do you hear?', audio: p.par[certa], options: p.par.slice(), correctIndex: certa };
    });
  }
  return [];
}

function aula(conteudo, nivelChave, topico) {
  const n = conteudo.niveis[nivelChave], livro = C.LIVROS[topico.livro];
  const ref = n.referenciaLivro || `${livro.label.toUpperCase()} - L ${topico.licao} - pg ${topico.paginaAudio}`;
  const itens = (n.pratica || []).map(lerItem);
  const rv = n.revelacao || {};
  const intro = [junta(n.buddy), rv.titulo, rv.explicacao, rv.exemplo].filter(Boolean).join(' ') + '\n\n' + [junta(n.porQue), junta(n.seErrar)].filter(Boolean).join(' ');
  const vocabulary = itens.map((i) => (i.par ? { word: i.par.join(' · '), translation: '' } : { word: i.w, translation: i.tag || '' }));
  const conversation = (n.dialogos || []).map((d) => ({ question: d[0], modelAnswers: d.slice(1) }))
    .concat((n.conversacao || []).map((q) => ({ question: q[0], modelAnswers: q[1] ? [q[1]] : [] })));
  const ids = AUDIOS[conteudo.chave] || [];
  return {
    coverTitle: 'Buddy Talks · ' + titulo(n.titulo),
    coverLevel: NIVEL[nivelChave], ageLabel: '', language: 'english',
    topic: n.subtitulo || '', objectives: n.objetivos || [],
    /* o Material Needed do PowerPoint (o original diz 10 minutos em toda a série) */
    material: ['PowerPoint activity', n.nomeDoAudio || ('Buddy Talks AUDIO FILE - ' + titulo(n.titulo))], duracao: '10 minutes',
    vocabulary, introText: intro.trim(),
    /* as falas do Buddy, uma por balão, na ordem do PowerPoint: a apresentação, o som revelado, por que importa, se errar */
    buddyBaloes: [junta(n.buddy), [rv.titulo, rv.explicacao, rv.exemplo].filter(Boolean).join('\n'), junta(n.porQue), junta(n.seErrar)].filter(Boolean),
    audios: ids.map((id, k) => ({ nome: 'Saying it right ' + 'AB'[k], ref, id })),
    conversation, languageGame: jogoDe(itens),
    evaluation: n.avaliacao ? [{ question: n.avaliacao }] : [],
    temaDaConversa: n.temaDaConversa || '', serie: 'buddy-talks',
    semRevisao: true,   /* a lista é de pronúncia, não de tradução: o "Do You Remember?" não serve */
  };
}

const arquivos = fs.readdirSync(path.join(CM, 'scripts/buddy-talks/conteudo')).filter((f) => /\.js$/.test(f));
fs.mkdirSync(SAIDA, { recursive: true });
const indice = [];
for (const f of arquivos) {
  const conteudo = require(path.join(CM, 'scripts/buddy-talks/conteudo', f));
  const t = C.TOPICOS.find((x) => x.livro === conteudo.topicoCatalogo.livro && x.licao === conteudo.topicoCatalogo.licao);
  if (!t) throw new Error('tópico sem catálogo: ' + conteudo.chave);
  for (const nv of ['BASIC', 'INTERMEDIATE', 'ADVANCED']) {
    if (!conteudo.niveis[nv]) continue;
    const id = 'bt-' + conteudo.chave + '-' + nv.toLowerCase(), lesson = aula(conteudo, nv, t);
    fs.writeFileSync(path.join(SAIDA, id + '.json'), JSON.stringify({ lesson, design: DESIGN }, null, 1) + '\n');
    indice.push({ id, num: NUM[conteudo.chave] || 0, nome: String(NUM[conteudo.chave] || '').padStart(2, '0') + ' - ' + lesson.coverTitle.replace('Buddy Talks · ', '') + ' - ' + NIVEL[nv],
      nivel: NIVEL[nv], jogo: lesson.languageGame.length, audios: lesson.audios.length, livro: C.LIVROS[t.livro].label + ' L' + t.licao });
  }
}
indice.sort((a, b) => a.num - b.num || ['Basic', 'Intermediate', 'Advanced'].indexOf(a.nivel) - ['Basic', 'Intermediate', 'Advanced'].indexOf(b.nivel));
fs.writeFileSync(path.join(SAIDA, 'index.json'), JSON.stringify(indice, null, 1) + '\n');
console.log(indice.length + ' atividades em buddy-talks/ (' + indice.filter((x) => x.jogo).length + ' com ouça e escolha, ' + indice.filter((x) => x.audios).length + ' com o áudio do livro)');
