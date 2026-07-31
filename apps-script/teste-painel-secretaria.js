/* Exercita o leitor do card e a camada de padronização com DUAS planilhas
   sintéticas montadas nos formatos REAIS medidos em 31/07/2026:

     Caçapava  28 colunas administrativas, cronograma a partir da 29
     Taubaté   16 colunas administrativas, cronograma a partir da 17, com o
               BOOK chamado "Livro" e na coluna 6 (não na 5), a "Observação"
               ocupando a coluna 5 e um "Aditamento" que só existe lá.

   O teste que mais importa é o do livro em Taubaté: era essa diferença que
   estava deixando 142 dos 630 alunos da _alunos sem estágio.

   rodar:  node apps-script/teste-painel-secretaria.js
*/
const fs = require('fs');
const path = require('path');

/* ── stubs do Apps Script ─────────────────────────────────────────────── */
global.DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'SÁB', 'DOM'];
global.CARD_ABAS_IGNORAR = ['Atrasados', 'Comercial', 'Gabarito Placeholder', 'Sheet36'];
global.CARD_IDS = { 'Caçapava': 'fake-cpv', 'Taubaté': 'fake-tbt' };
global.RAF_VALIDO = /^[A-Za-z]\d{2,3}-\d{2,4}$/;
global.normRaf = v => String(v == null ? '' : v).trim().toUpperCase();
global.Session = { getScriptTimeZone: () => 'America/Sao_Paulo' };
global.Utilities = { formatDate: (d) => d.toISOString().slice(0, 10) };
global.CacheService = { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {} }) };
global.PropertiesService = { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) };
const GABARITO = { 'Teens Connect 2': ['L1', 'L2', 'L3', 'L4', 'DT1', 'L5', 'L6'],
                   'Essentials 1': ['E1', 'E2', 'E3', 'E4'] };
global.lerGabaritoCard_ = () => GABARITO;
global.seqDoBookCard_ = (gab, book) => gab[book] || null;

/* ── planilhas sintéticas ─────────────────────────────────────────────── */
const NAULAS = 8;
const DIAS = ['SEG', 'QUA', 'SEG', 'QUA', 'SEG', 'QUA', 'SEG', 'QUA'];

const CPV_ROT = ['', 'ATIVO', 'ALUNOS', 'STATUS', 'OBSERVAÇÕES', 'BOOK ', 'BOOK COMPRADO', 'RAF',
  '1ª AVALIAÇÃO', '2ª AVALIAÇÃO', 'DATA', 'NOTA', 'DATA', 'NOTA', 'DATA', 'NOTA', 'DATA', 'NOTA',
  'APROVADO?', 'APROVADO?', 'Data de Nascimento (MM/DD/AAAA)', 'Idade  (não editar)', 'Ano Escolar',
  'Email Aluno/Cliente', 'Telefone', 'Nome', 'Telefone', 'WhatsApp (não editar)'];
const CPV_GRP = ['', 'PRESENCIAL', 'PRESENCIAL', 'ALUNO', 'ALUNO', 'ALUNO', 'ALUNO', 'ALUNO',
  'via BOLETIM', 'via BOLETIM', 'TEST 1', 'TEST 1', 'TEST 2', 'TEST 2', 'TEST 3', 'TEST 3',
  'TEST 4', 'TEST 4', 'FPA', 'INSCRIÇÃO', 'ALUNO', 'ALUNO', 'ALUNO', 'ALUNO', 'ALUNO',
  'RESPONSÁVEL', 'RESPONSÁVEL', 'RESPONSÁVEL'];

const TBT_ROT = ['', 'ATIVO', 'ALUNOS', 'Aditamento', 'Status', 'Observação', 'Livro', 'RAF',
  '1ª AVALIAÇÃO', '2ª AVALIAÇÃO', 'Data de Nascimento (MM/DD/AAAA)', 'Idade', 'Ano Escolar',
  'Email Aluno/Cliente', 'Nome', 'Telefone'];
const TBT_GRP = ['', 'PRESENCIAL - SGF PERS.', 'PRESENCIAL - SGF PERS.', '', 'ALUNO', 'ALUNO',
  'ALUNO', 'ALUNO', 'via BOLETIM', 'via BOLETIM', 'ALUNO', 'ALUNO', 'ALUNO', 'ALUNO',
  'RESPONSÁVEL', 'RESPONSÁVEL'];

function bloco(n, titulo, rot, grp, marcador, alunos, vagas, comFinalPH) {
  const fecho = comFinalPH ? ['Final P.H.', 'Faltas'] : ['Faltas'];
  const nAdm = rot.length;
  const linhas = [];
  linhas.push([n, titulo, titulo, ...Array(nAdm - 3).fill('PEDAGÓGICO'), marcador,
               ...Array(NAULAS).fill('Agosto'), ...fecho]);
  linhas.push([n, ...grp.slice(1), marcador, ...DIAS, ...fecho]);
  linhas.push([n, ...rot.slice(1), marcador, 3, 5, 10, 12, 17, 19, 24, 26, ...fecho]);
  alunos.forEach((a, i) => {
    const dados = new Array(nAdm).fill('');
    dados[0] = i + 1; dados[1] = false;
    Object.keys(a.cols).forEach(k => { dados[Number(k)] = a.cols[k]; });
    linhas.push([...dados, 'ACAD', ...a.grade, ...(comFinalPH ? ['0%'] : []), 0]);
  });
  for (let v = 0; v < vagas; v++) {
    const vazio = new Array(nAdm).fill('');
    vazio[0] = alunos.length + v + 1; vazio[1] = false;
    linhas.push([...vazio, '', ...Array(NAULAS).fill(''), ...(comFinalPH ? ['0%'] : []), 0]);
  }
  return linhas;
}

const abaCpv = bloco(1, 'Acadêmico Teens Connect 2 - 2ª/4ª 9h45 às 11h', CPV_ROT, CPV_GRP, '2026', [
  { cols: { 1: true, 2: 'Marina Petrucelli', 3: 'Rematriculado', 5: 'Teens Connect 2', 6: true,
            7: 'B004-722', 20: '01/07/2016', 21: 10, 22: '4º EF', 23: 'mae@ex.com',
            24: '(12) 91111-1111', 25: 'Mabel', 26: '(12) 97403-4793', 27: '(12) 97403-4793' },
    grade: ['L1', 'L2', 'a', 'L3', 'f', 'L4', '.L5', '.L6'] },
  { cols: { 1: true, 2: 'Catharina Pereira', 3: 'Matriculado', 5: 'Teens Connect 2', 6: false, 7: 'C005-633' },
    grade: ['L1', 'a', 'a', 'a', 'f', 'L2', '.L3', '.L4'] },
], 3, true);

const abaTbt = bloco(1, 'Básico (+18) - 4ª 18h45/21h15', TBT_ROT, TBT_GRP, '2º sem', [
  { cols: { 1: true, 2: 'Laís de Jesus Oliveira', 3: 'ok', 4: 'Rematriculado',
            5: 'Início em: 17/08', 6: 'Essentials 1', 7: 'Z012-935',
            10: '03/04/2001', 11: 25, 13: 'lais@ex.com', 14: 'Laís', 15: '(12) 98888-7777' },
    grade: ['E1', 'E2', 'a', 'E3', 'f', '', '', ''] },
  { cols: { 1: true, 2: 'Alice Rodrigues', 4: 'Aluno novo',
            5: 'Bolsa 50% 2º sem/26', 6: 'Essentials 1', 7: 'C025-270' },
    grade: ['E1', 'a', 'a', '', '', '', '', ''] },
], 2, false);

function fakeSheet(nome, linhas) {
  const largura = Math.max(...linhas.map(l => l.length));
  const mat = linhas.map(l => { const c = l.slice(); while (c.length < largura) c.push(''); return c; });
  return {
    getName: () => nome,
    getLastRow: () => mat.length,
    getLastColumn: () => largura,
    getMaxRows: () => mat.length,
    getRange: (r, c, nr, nc) => ({
      getValues: () => mat.slice(r - 1, r - 1 + (nr || 1)).map(x => x.slice(c - 1, c - 1 + (nc || 1))),
      setValues: (v) => { v[0].forEach((x, i) => mat[r - 1][c - 1 + i] = x); },
      setValue: (v) => { mat[r - 1][c - 1] = v; }
    }),
    __mat: mat
  };
}
const shCpv = fakeSheet('CARLOS ALBERTO', abaCpv);
const shTbt = fakeSheet('CARLOS', abaTbt);
const PLANILHAS = { 'fake-cpv': [shCpv], 'fake-tbt': [shTbt] };
global.SpreadsheetApp = {
  openById: (id) => ({
    getSheets: () => PLANILHAS[id],
    getSheetByName: (n) => PLANILHAS[id].find(s => s.getName() === n) || null
  })
};
let ROSTER = [];
global.getRoster = () => ({
  getRange: (r) => ({
    setValues: (v) => { if (r >= 2) ROSTER = v.slice(); },
    setNumberFormat: () => {}, clearContent: () => {}
  }),
  getLastRow: () => 1
});

/* ── carrega os dois blocos do backend ────────────────────────────────── */
for (const arq of ['padronizacao-cards.gs', 'painel-secretaria.gs']) {
  eval(fs.readFileSync(path.join(__dirname, arq), 'utf8'));
}

let falhas = 0;
function ok(cond, msg, extra) {
  if (cond) console.log('  ok  ' + msg);
  else { falhas++; console.log('  FALHOU  ' + msg + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
}

console.log('\n══ mapeamento canônico · CAÇAPAVA ══');
const m = cardMapa_(abaCpv[2], abaCpv[1]).mapa;
ok(m.ativo === 1 && m.nome === 2 && m.status === 3 && m.obs === 4, 'ativo/nome/status/obs', m);
ok(m.book === 5 && m.bookComprado === 6 && m.raf === 7, 'BOOK 5 · BOOK COMPRADO 6 · RAF 7', m);
ok(m.t1data === 10 && m.t4nota === 17, 'os 4 pares DATA/NOTA saem pelo grupo TEST 1..4', m);
ok(m.fpa === 18 && m.inscricao === 19, 'os dois APROVADO? separados por FPA × INSCRIÇÃO', m);
ok(m.telAluno === 24 && m.respTel === 26, 'os dois Telefone separados por ALUNO × RESPONSÁVEL', m);
ok(m.respNome === 25 && m.respWhats === 27, 'Nome e WhatsApp do responsável', m);
ok(m.modalidade === 28, 'modalidade reconhecida pela posição (o rótulo dela é "2026")', m.modalidade);

console.log('\n══ mapeamento canônico · TAUBATÉ (o card diferente) ══');
const t = cardMapa_(abaTbt[2], abaTbt[1]);
ok(t.mapa.book === 6, 'BOOK vem da coluna 6, que lá se chama "Livro"', t.mapa.book);
ok(t.mapa.obs === 5, 'Observação é a coluna 5 — a que o código antigo lia como BOOK', t.mapa.obs);
ok(t.mapa.status === 4 && t.mapa.raf === 7, 'Status 4 e RAF 7', t.mapa);
ok(t.mapa.aditamento === 3, 'Aditamento (só existe em Taubaté) reconhecido', t.mapa.aditamento);
ok(t.mapa.telAluno == null, 'NÃO inventa telefone do aluno: lá só existe o do responsável', t.mapa.telAluno);
ok(t.mapa.respTel === 15 && t.mapa.respNome === 14, 'contato do responsável no lugar certo', t.mapa);
ok(t.mapa.modalidade === 16, 'modalidade na 16 (rótulo "2º sem")', t.mapa.modalidade);
ok(t.faltando.indexOf('bookComprado') > -1 && t.faltando.indexOf('respWhats') > -1,
   'acusa BOOK COMPRADO e WhatsApp como faltando', t.faltando);
ok(t.faltando.indexOf('t1data') > -1, 'acusa o bloco de simulados como faltando');
ok(t.sobrando.length === 0, 'nenhuma coluna estranha (a modalidade não conta)', t.sobrando);
ok(t.renomeados.some(x => x.campo === 'book' && x.encontrado === 'Livro'),
   'registra o renome BOOK → "Livro"', t.renomeados.map(x => x.campo + ':' + x.encontrado));
ok(t.iniGrade === 17, 'cronograma de Taubaté começa na 17', t.iniGrade);

console.log('\n══ O BUG: o livro do aluno de Taubaté ══');
const rTbt = secLerEscola_('Taubaté');
const lais = rTbt.alunos[0];
ok(lais.book === 'Essentials 1', 'livro certo (a posição fixa daria "Início em: 17/08")', lais.book);
ok(lais.obs === 'Início em: 17/08', 'e a observação continua sendo observação', lais.obs);
ok(rTbt.alunos[1].book === 'Essentials 1', 'idem no 2º aluno (daria "Bolsa 50% 2º sem/26")', rTbt.alunos[1].book);
ok(lais.pctEstagio !== null, 'com o livro certo, o estágio volta a ser calculado', lais.pctEstagio);
ok(lais.respTel === '(12) 98888-7777' && lais.telefone === '',
   'contatos sem troca de dono', { resp: lais.respTel, aluno: lais.telefone });

syncRosterFromCards();
const porRaf = Object.fromEntries(ROSTER.map(r => [r[0], r]));
ok(ROSTER.length === 4, 'a _alunos recebeu os 4 alunos das duas escolas', ROSTER.length);
ok(porRaf['Z012-935'] && porRaf['Z012-935'][3] === 'Essentials 1',
   'syncRosterFromCards grava o Book certo para Taubaté', porRaf['Z012-935']);
ok(porRaf['B004-722'] && porRaf['B004-722'][3] === 'Teens Connect 2',
   'e continua certo para Caçapava', porRaf['B004-722']);

console.log('\n══ leitura do card (Caçapava) ══');
const r = secLerEscola_('Caçapava');
ok(r.turmas.length === 1 && r.alunos.length === 2, '1 turma, 2 alunos', { t: r.turmas.length, a: r.alunos.length });
ok(r.turmas[0].livres === 3 && r.turmas[0].capacidade === 5, '3 vagas, capacidade 5', r.turmas[0].livres);
const marina = r.alunos[0];
ok(marina.aulas === 5 && marina.faltas === 1 && marina.pctFaltas === 20, 'Marina: 5 aulas, 1 falta, 20%', marina.aulas);
ok(marina.ultimaLicao === 'L4' && marina.licaoPrevista === 'L5', 'última lição L4, prevista L5');
ok(marina.pctEstagio === 67 && marina.atraso === 1, '67% do estágio e 1 aula de atraso',
   { p: marina.pctEstagio, a: marina.atraso });
ok(marina.telefone === '(12) 91111-1111' && marina.respWhats === '(12) 97403-4793', 'telefones separados');
ok(marina.bookComprado === true && r.alunos[1].bookComprado === false, 'book comprado como booleano');

console.log('\n══ escrita: abrir bloco ══');
const b = secAbrirBloco_('Caçapava', 'CARLOS ALBERTO', 'Acadêmico Teens Connect 2 - 2ª/4ª 9h45 às 11h');
ok(!b.erro, 'abriu o bloco de Caçapava', b.erro);
ok(b.largura === 28, 'copia 28 colunas (ATIVO até a modalidade)', b.largura);
ok(secConfereLinha_(b, 4, 'Marina Petrucelli', 'B004-722') === null, 'a linha 4 confere com a Marina');
ok(secConfereLinha_(b, 4, 'Outro', 'Z999-999') !== null, 'e recusa outro RAF');
const bt = secAbrirBloco_('Taubaté', 'CARLOS', 'Básico (+18) - 4ª 18h45/21h15');
ok(!bt.erro && bt.largura === 16, 'abre o bloco de Taubaté com a largura dele (16)', bt.largura || bt.erro);

console.log('\n══ auditoria de padronização ══');
const a = cardAuditar_({});
ok(a.escolas.length === 2, 'auditou as duas escolas', a.escolas.map(e => e.escola));
const eCpv = a.escolas.find(e => e.escola === 'Caçapava');
const eTbt = a.escolas.find(e => e.escola === 'Taubaté');
ok(eCpv.abas[0].faltando.join(',') === 'aditamento',
   'Caçapava só não tem o Aditamento — é o preço de trazer esse campo de Taubaté para o canônico',
   eCpv.abas[0].faltando);
ok(eCpv.abas[0].renomeados.length === 0 && eCpv.abas[0].sobrando.length === 0,
   'e no resto Caçapava já é o canônico: nenhum renome, nenhuma coluna estranha', eCpv.abas[0]);
ok(eTbt.abas[0].conforme === false, 'Taubaté fora do canônico', eTbt.abas[0].faltando);
ok(eTbt.abas[0].essenciaisFaltando.length === 0,
   'mas sem faltar nada ESSENCIAL — o portal funciona lá hoje', eTbt.abas[0].essenciaisFaltando);
ok(a.problemas.length === 0, 'nenhum problema grave', a.problemas);
ok(a.canonico.length === 28, 'o padrão canônico tem 28 colunas', a.canonico.length);

console.log('\n══ plano de normalização (simulação, nada escrito) ══');
const p = cardNormalizarAba_('Taubaté', 'CARLOS', false);
ok(p.ok && p.simulacao, 'simulou sem escrever', p.error);
const mover = p.passos.filter(x => x.tipo === 'mover');
const inserir = p.passos.filter(x => x.tipo === 'inserir');
const rotular = p.passos.filter(x => x.tipo === 'rotular');
ok(inserir.some(x => x.campo === 'bookComprado'), 'planeja inserir BOOK COMPRADO', inserir.map(x => x.campo));
ok(inserir.some(x => x.campo === 'telAluno') && inserir.some(x => x.campo === 'respWhats'),
   'planeja inserir telefone do aluno e WhatsApp');
ok(mover.every(x => x.campo === 'aditamento'),
   'só o Aditamento se move — as outras 12 chegam no lugar pelas inserções',
   mover.map(x => x.campo + ':' + x.de + '→' + x.para));
ok(mover.length === 2 && mover[1].para === 28,
   'Aditamento sai da frente e volta na 28 (2 movimentos, não 12)',
   mover.map(x => x.de + '→' + x.para));
ok(inserir.length === 13, 'e 13 inserções: BOOK COMPRADO, os 8 simulados, os 2 APROVADO?, telefone do aluno e WhatsApp',
   inserir.map(x => x.campo));
ok(rotular.some(x => x.campo === 'book' && x.para === 'BOOK'), 'planeja renomear "Livro" para "BOOK"',
   rotular.map(x => x.campo));
ok(shTbt.__mat[2][6] === 'Livro', 'a planilha NÃO foi tocada pela simulação', shTbt.__mat[2][6]);
const aplicado = cardNormalizarAba_('Taubaté', 'CARLOS', true);
ok(aplicado.ok === false && aplicado.code === 'sem_backup',
   'aplicar sem backup recente é recusado', aplicado.code);

console.log('\n══ fila e busca ══');
const fila = secFila_({ minFaltas: 30, minAtraso: 4 }).fila;
ok(fila.some(f => f.nome === 'Catharina Pereira'), 'Catharina (60% de faltas) entra na fila',
   fila.map(f => f.nome + ' ' + f.pctFaltas + '%'));
ok(secBusca_({ q: 'lais' }).alunos.length === 1, 'busca acha aluno de Taubaté por nome');
ok(secBusca_({ q: 'z012-935' }).alunos.length === 1, 'busca por RAF');
ok(secBusca_({ q: 'x' }).ok === false, 'recusa termo de 1 letra');

console.log(falhas ? '\n>>> ' + falhas + ' FALHA(S)\n' : '\n>>> tudo passou\n');
process.exit(falhas ? 1 : 0);
