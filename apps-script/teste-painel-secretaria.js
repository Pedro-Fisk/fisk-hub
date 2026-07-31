/* Exercita o leitor do card do painel-secretaria.gs com uma planilha
   sintética montada no formato REAL (conferido no card de Caçapava em
   31/07/2026): 28 colunas administrativas, coluna de modalidade, cronograma
   com dias da semana, Final P.H. e Faltas no fim. */
const fs = require('fs');

/* ── stubs do Apps Script ─────────────────────────────────────────────── */
global.DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'SÁB', 'DOM'];
global.CARD_ABAS_IGNORAR = ['Atrasados', 'Comercial', 'Gabarito Placeholder', 'Sheet36'];
global.CARD_IDS = { 'Caçapava': 'fake-cpv' };
global.RAF_VALIDO = /^[A-Za-z]\d{2,3}-\d{2,4}$/;
global.normRaf = v => String(v == null ? '' : v).trim().toUpperCase();
global.Session = { getScriptTimeZone: () => 'America/Sao_Paulo' };
global.Utilities = { formatDate: (d) => d.toISOString().slice(0, 10) };
global.lerGabaritoCard_ = () => ({ 'Teens Connect 2': ['L1', 'L2', 'L3', 'L4', 'DT1', 'L5', 'L6'] });
global.seqDoBookCard_ = (gab, book) => gab[book] || null;
global.CacheService = { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {} }) };

const HDR_ADM = ['', 'ATIVO', 'ALUNOS', 'STATUS', 'OBSERVAÇÕES', 'BOOK ', 'BOOK COMPRADO', 'RAF',
  '1ª AVALIAÇÃO', '2ª AVALIAÇÃO', 'DATA', 'NOTA', 'DATA', 'NOTA', 'DATA', 'NOTA', 'DATA', 'NOTA',
  'APROVADO?', 'APROVADO?', 'Data de Nascimento (MM/DD/AAAA)', 'Idade  (não editar)', 'Ano Escolar',
  'Email Aluno/Cliente', 'Telefone', 'Nome', 'Telefone', 'WhatsApp (não editar)'];
const GRP_ADM = ['', 'PRESENCIAL', 'PRESENCIAL', 'ALUNO', 'ALUNO', 'ALUNO', 'ALUNO', 'ALUNO',
  'via BOLETIM', 'via BOLETIM', 'TEST 1', 'TEST 1', 'TEST 2', 'TEST 2', 'TEST 3', 'TEST 3',
  'TEST 4', 'TEST 4', 'FPA', 'INSCRIÇÃO', 'ALUNO', 'ALUNO', 'ALUNO', 'ALUNO', 'ALUNO',
  'RESPONSÁVEL', 'RESPONSÁVEL', 'RESPONSÁVEL'];
const NAULAS = 8;                                    // 8 datas de aula
const DIAS = ['SEG', 'QUA', 'SEG', 'QUA', 'SEG', 'QUA', 'SEG', 'QUA'];

function bloco(n, titulo, alunos, vagas) {
  const linhas = [];
  // iTit: número + título + grupos largos + Final P.H./Faltas no fim
  linhas.push([n, titulo, titulo, ...Array(25).fill('PEDAGÓGICO'), '2026',
               ...Array(NAULAS).fill('Agosto'), 'Final P.H.', 'Faltas']);
  linhas.push([n, ...GRP_ADM.slice(1), '2026', ...DIAS, 'Final P.H.', 'Faltas']);
  linhas.push([n, ...HDR_ADM.slice(1), '2026', 3, 5, 10, 12, 17, 19, 24, 26, 'Final P.H.', 'Faltas']);
  alunos.forEach((a, i) => {
    linhas.push([i + 1, a.ativo === true, a.nome, a.status || 'Matriculado', a.obs || '',
      a.book || 'Teens Connect 2', a.comprado === true, a.raf || '',
      '', '', '', '', '', '', '', '', '', '', '', '',
      a.nasc || '', a.idade || '', a.ano || '', a.email || '', a.tel || '',
      a.respNome || '', a.respTel || '', a.whats || '',
      'ACAD', ...a.grade, '0%', a.faltasCard || 0]);
  });
  for (let v = 0; v < vagas; v++) {
    linhas.push([alunos.length + v + 1, false, '', '', '', '', false, '',
      ...Array(20).fill(''), '', ...Array(NAULAS).fill(''), '0%', 0]);
  }
  return linhas;
}

const abaCarlos = [
  ...bloco(1, 'Acadêmico Teens Connect 2 - 2ª/4ª 9h45 às 11h Sala 1', [
    { nome: 'Marina Petrucelli', raf: 'B004-722', ativo: true, comprado: true,
      nasc: '01/07/2016', idade: 10, ano: '4º EF', email: 'mae@ex.com', tel: '(12) 91111-1111',
      respNome: 'Mabel', respTel: '(12) 97403-4793', whats: '(12) 97403-4793',
      grade: ['L1', 'L2', 'a', 'L3', 'f', 'L4', '.L5', '.L6'] },
    { nome: 'Catharina Pereira', raf: 'C005-633', ativo: true,
      grade: ['L1', 'a', 'a', 'a', 'f', 'L2', '.L3', '.L4'] },
  ], 3),
  ...bloco(2, 'Acad Essentials 1 - 2ª 15h às 17h30 (-18)', [
    { nome: 'Miguel Fragoso', raf: '', ativo: false, book: 'Essentials 1', grade: Array(NAULAS).fill('') },
  ], 5),
];

/* ── planilha falsa ───────────────────────────────────────────────────── */
function fakeSheet(nome, linhas) {
  const largura = Math.max(...linhas.map(l => l.length));
  const mat = linhas.map(l => { const c = l.slice(); while (c.length < largura) c.push(''); return c; });
  const escritas = [];
  return {
    getName: () => nome,
    getLastRow: () => mat.length,
    getLastColumn: () => largura,
    getRange: (r, c, nr, nc) => ({
      getValues: () => mat.slice(r - 1, r - 1 + (nr || 1)).map(x => x.slice(c - 1, c - 1 + (nc || 1))),
      setValues: (v) => { escritas.push({ r, c, v }); v[0].forEach((x, i) => mat[r - 1][c - 1 + i] = x); },
      setValue: (v) => { escritas.push({ r, c, v }); mat[r - 1][c - 1] = v; }
    }),
    __mat: mat, __escritas: escritas
  };
}
const shCarlos = fakeSheet('CARLOS ALBERTO', abaCarlos);
global.SpreadsheetApp = {
  openById: () => ({ getSheets: () => [shCarlos], getSheetByName: (n) => (n === 'CARLOS ALBERTO' ? shCarlos : null) })
};

/* ── carrega o bloco e roda ───────────────────────────────────────────── */
const src = fs.readFileSync(require('path').join(__dirname, 'painel-secretaria.gs'), 'utf8');
eval(src);

let falhas = 0;
function ok(cond, msg, extra) {
  if (cond) { console.log('  ok  ' + msg); }
  else { falhas++; console.log('  FALHOU  ' + msg + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
}

console.log('\n== leitura do card ==');
const r = secLerEscola_('Caçapava');
ok(r.turmas.length === 2, 'achou as 2 turmas', r.turmas.map(t => t.turma));
ok(r.alunos.length === 3, 'achou os 3 alunos', r.alunos.map(a => a.nome));

const t1 = r.turmas[0];
ok(t1.ocupadas === 2 && t1.livres === 3 && t1.capacidade === 5,
   'turma 1: 2 ocupadas, 3 vagas, capacidade 5', { o: t1.ocupadas, l: t1.livres, c: t1.capacidade });
ok(t1.vagas.join(',') === '6,7,8', 'as vagas são as linhas 6,7,8 (alunos em 4 e 5)', t1.vagas);
ok(r.turmas[1].livres === 5, 'turma 2: 5 vagas', r.turmas[1].livres);

console.log('\n== colunas mapeadas por rótulo ==');
const c = t1.colunas;
ok(c.ativo === 1 && c.nome === 2 && c.status === 3 && c.obs === 4, 'ativo/nome/status/obs');
ok(c.book === 5 && c.bookComprado === 6 && c.raf === 7, 'book/book comprado/raf');
ok(c.nascimento === 20 && c.idade === 21 && c.anoEscolar === 22 && c.email === 23,
   'nascimento/idade/ano escolar/email', c);
ok(c.telAluno === 24, 'telefone DO ALUNO (grupo ALUNO)', c.telAluno);
ok(c.respNome === 25 && c.respTel === 26 && c.respWhats === 27,
   'responsável: nome/telefone/whatsapp (grupo RESPONSÁVEL)', c);
ok(c.ultimaAdm === 27, 'última coluna administrativa', c.ultimaAdm);

console.log('\n== limites do cronograma ==');
ok(t1.grade.ini === 29, 'cronograma começa na 1ª coluna com dia da semana', t1.grade);
ok(t1.grade.fim === 37, 'cronograma para ANTES do Final P.H.', t1.grade);

console.log('\n== frequência e atraso ==');
const marina = r.alunos[0], cath = r.alunos[1];
// Marina: L1 L2 a L3 f L4 .L5 .L6 → 5 aulas (f e '.' não contam), 1 falta
ok(marina.aulas === 5 && marina.faltas === 1 && marina.pctFaltas === 20,
   'Marina: 5 aulas, 1 falta, 20%', { a: marina.aulas, f: marina.faltas, p: marina.pctFaltas });
ok(marina.ultimaLicao === 'L4' && marina.licaoPrevista === 'L5',
   'Marina: última lição L4, prevista L5', { u: marina.ultimaLicao, p: marina.licaoPrevista });
// sequência sem DT: L1 L2 L3 L4 L5 L6 → L4 é o índice 3, então 4/6 = 67%
ok(marina.pctEstagio === 67, 'Marina: 67% do estágio', marina.pctEstagio);
ok(marina.atraso === 1, 'Marina: 5 aulas − 4 lições = 1 aula de atraso', marina.atraso);
// Catharina: L1 a a a f L2 → 5 aulas, 3 faltas, última lição L2 (índice 1)
ok(cath.aulas === 5 && cath.faltas === 3 && cath.pctFaltas === 60,
   'Catharina: 5 aulas, 3 faltas, 60%', { a: cath.aulas, f: cath.faltas, p: cath.pctFaltas });
ok(cath.atraso === 3, 'Catharina: 5 aulas − 2 lições = 3 de atraso', cath.atraso);
ok(marina.telefone === '(12) 91111-1111' && marina.respWhats === '(12) 97403-4793',
   'telefones separados corretamente', { t: marina.telefone, w: marina.respWhats });
ok(marina.bookComprado === true && cath.bookComprado === false, 'book comprado lido como booleano');

console.log('\n== abrir bloco para escrita ==');
const b = secAbrirBloco_('Caçapava', 'CARLOS ALBERTO', 'Acadêmico Teens Connect 2 - 2ª/4ª 9h45 às 11h Sala 1');
ok(!b.erro, 'abriu o bloco', b.erro);
ok(b.vagas.join(',') === '6,7,8', 'as mesmas vagas', b.vagas);
ok(b.largura === 28, 'copia 28 colunas (ATIVO..modalidade)', b.largura);
ok(secConfereLinha_(b, 4, 'Marina Petrucelli', 'B004-722') === null, 'linha 4 confere com a Marina');
ok(secConfereLinha_(b, 4, 'Outro', 'Z999-999') !== null, 'linha 4 recusa outro RAF');

console.log('\n== fila de atendimento ==');
const fila = secFila_({ escola: 'Caçapava', minFaltas: 30, minAtraso: 4 }).fila;
ok(fila.length === 1 && fila[0].nome === 'Catharina Pereira',
   'só a Catharina entra na fila (60% de faltas)', fila.map(f => f.nome));
ok(fila[0].motivos.join(' / ') === 'faltas 60%', 'motivo correto', fila[0].motivos);

console.log('\n== busca ==');
ok(secBusca_({ q: 'marina' }).alunos.length === 1, 'busca por nome parcial');
ok(secBusca_({ q: 'b004-722' }).alunos.length === 1, 'busca por RAF');
ok(secBusca_({ q: 'x' }).ok === false, 'recusa termo de 1 letra');

console.log(falhas ? '\n>>> ' + falhas + ' FALHA(S)\n' : '\n>>> tudo passou\n');
process.exit(falhas ? 1 : 0);
