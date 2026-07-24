/**
 * FISK Hub — Salvar PDF na pasta da turma / do aluno (drive compartilhado)
 * =========================================================================
 * ✅ JÁ ESTÁ NO AR — este arquivo virou REFERÊNCIA/documentação.
 * O código roda no projeto Apps Script "fisk-hub-backend"
 * (script `1AlWF9j-indNvmh_A3Jk9k28mCC3uhF8eP_dj7C74BzX1wauT3b1VGFTm`, o mesmo
 * backend do Portal do Aluno, versionado em ../fisk-hub-backend via clasp).
 * Como aquele projeto já tinha um doPost — e um projeto só pode ter UM —, o
 * conteúdo daqui foi MESCLADO no `Code.js` de lá como `salvarPdfNoDrive(req)`,
 * despachado por `req.fn === 'salvarPdf'`. NÃO existe um projeto novo só disso,
 * e NADA foi colado no CardTools.gs do card (regra do próprio card).
 *
 * ENDPOINT em uso (já colado em assets/fisk-shared.js → FISK_SAVE_URL):
 *   https://script.google.com/macros/s/AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1/exec
 *
 * PARA ALTERAR: edite ../fisk-hub-backend/Code.js e publique com
 *   clasp push -f && clasp deploy -i AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1 -d "vN"
 * Mantenha este arquivo em sincronia com o de lá (é a cópia legível).
 * ⚠️ DriveApp é escopo novo naquele projeto: depois do push, rode `setupDrive()`
 * uma vez no editor para o dono da implantação autorizar o acesso ao Drive.
 *
 * As ferramentas fazem POST (JSON) com o corpo:
 *   { fn:'salvarPdf', key, tipo:'turma'|'aluno',
 *     escola, professor, turma, aluno, filename, mime, dados(base64) }
 * e esperam de volta:
 *   { ok:true, url, pasta }                           // salvo
 *   { ok:false, code:'pasta_nao_encontrada', erro }   // avisa o professor
 *   { ok:false, erro }                                // outro erro
 *
 * ESTRUTURA de pastas — CONFERIDA no drive real (24/07/2026), e diferente da
 * que este arquivo supunha antes:
 *   Planners <Escola> → pasta do professor → pasta da turma → pastas de aluno.
 *   - Professor: Caçapava usa só o primeiro nome ("Alex"); Taubaté usa
 *     "<n> - Nome" ("8 - Tamires"). Casa por nome exato/"contém".
 *   - Turma: o nome NÃO casa entre card e pasta (o nível chega a se contradizer),
 *     então casa por DIA DA SEMANA + HORÁRIO. Empate = recusa.
 *   - Plano da TURMA → pasta da turma.
 *   - Doc do ALUNO  → pasta do aluno, localizada pelo NOME COMPLETO em qualquer
 *     turma do professor (chave mais forte que dia+horário).
 */

/* ══════════════════════════════════════════════════════════════════════
   SALVAR PDF NA PASTA DA TURMA / DO ALUNO (drive compartilhado)
   Usado pelas ferramentas do Fisk Hub (planejador, 2nd-chance, termo de
   atraso, boletim). Ficam AQUI, e não no CardTools do card, porque um
   projeto Apps Script só pode ter UM doPost — e o CardTools não se mexe.
   Fonte original/documentada: fisk-hub/apps-script/salvar-no-drive.gs

   POST { fn:'salvarPdf', key, tipo:'turma'|'aluno',
          escola, professor, turma, aluno, filename, mime, dados(base64) }
   →    { ok:true, url, pasta }
        { ok:false, code:'pasta_nao_encontrada', erro }  // avisa o professor
        { ok:false, erro }

   Estrutura no drive compartilhado:
     Planners <Escola> → "<n> - <Professor>" → "<n> - <dia/horário> - <NÍVEL>"
     (turma) → [pastas de aluno por nome completo].
   ══════════════════════════════════════════════════════════════════════ */

const FISK_CHAVE = 'fisk-cards-2026-vX7q3nT';  // mesma API_KEY das ferramentas do Hub
const RAIZ_ESCOLA = {                          // pastas "Planners ..." no drive compartilhado
  taubate:  '1c7vuwrRpINGx-ITgvhr65yD4cwbHodt2',
  cacapava: '1FJ8Fs677pq0tENiJ1PHLtZp8A0lmw-Gs'
};

function salvarPdfNoDrive(req) {
  if (req.key !== FISK_CHAVE) return json({ ok: false, erro: 'chave inválida' });
  if (!req.dados) return json({ ok: false, erro: 'PDF vazio' });

  const raizId = rootDaEscola(req.escola);
  if (!raizId) return erroPasta_('escola "' + limpa_(req.escola) + '" não reconhecida (esperado Taubaté ou Caçapava)');

  const profF = acharPasta(raizId, req.professor);
  if (!profF) return erroPasta_('pasta do professor "' + limpa_(req.professor) + '" não encontrada em Planners ' + limpa_(req.escola));

  let destino, turmaF, via;
  if (req.tipo === 'aluno') {
    const r = acharPastaDoAluno_(profF.getId(), req.turma, req.aluno);
    if (r.erro) return erroPasta_(r.erro);
    destino = r.pasta; turmaF = r.turma; via = r.via;
  } else {
    const achado = acharTurmaPasta_(profF.getId(), req.turma);
    if (!achado) return erroPasta_('pasta da turma "' + limpa_(req.turma) + '" não encontrada na pasta de ' + limpa_(req.professor));
    destino = turmaF = achado.pasta; via = achado.via;
  }

  const blob = Utilities.newBlob(Utilities.base64Decode(req.dados), req.mime || 'application/pdf', req.filename || 'documento.pdf');
  const antigos = destino.getFilesByName(blob.getName());
  while (antigos.hasNext()) antigos.next().setTrashed(true);  // regravar substitui a versão anterior
  const arq = destino.createFile(blob);
  // `pasta` volta para a ferramenta MOSTRAR ao professor onde salvou — é assim
  // que ele percebe um casamento errado sem precisar abrir o Drive.
  return json({ ok: true, url: arq.getUrl(), pasta: destino.getName(), turma: turmaF.getName(), via: via });
}

/** escolhe a raiz "Planners <Escola>" a partir do nome da escola. */
function rootDaEscola(escola) {
  const e = normPasta_(escola);
  if (e.indexOf('cacapava') >= 0) return RAIZ_ESCOLA.cacapava;
  if (e.indexOf('taubate') >= 0)  return RAIZ_ESCOLA.taubate;
  return null;
}

/** procura uma subpasta por nome (normalizado): igualdade exata e depois "contém".
 *  Serve para PROFESSOR ("ALEX" → "Alex", "TAMIRES" → "8 - Tamires") e para
 *  ALUNO (o card às vezes traz sufixos, ex.: "Livia Cruz Santos (confirmar)"). */
function acharPasta(raizId, nome, soExata) {
  if (!raizId || !nome) return null;
  const subs = listarSubpastas_(raizId);
  if (!subs) return null;
  const alvo = normPasta_(nome);
  if (!alvo) return null;
  let melhorContem = null;
  for (let i = 0; i < subs.length; i++) {
    const n = normPasta_(subs[i].getName());
    if (n === alvo) return subs[i];                                                            // exata
    if (!soExata && !melhorContem && n && (n.indexOf(alvo) >= 0 || alvo.indexOf(n) >= 0)) melhorContem = subs[i];
  }
  return soExata ? null : melhorContem;
}

function listarSubpastas_(raizId) {
  let raiz;
  try { raiz = DriveApp.getFolderById(raizId); } catch (e) { return null; }
  const out = [], it = raiz.getFolders();
  while (it.hasNext()) out.push(it.next());
  return out;
}

/**
 * TURMA: casar por nome não funciona — os dois lados discordam do nível.
 *   card "INTERMEDIATE - 2ª/4ª 18h45 às 20h"  ↔  pasta "2ª/4ª 18h45 às 20h00 - Basic/Inter"
 *   card "Basic/Interm (+18) - 3ª 8h30 às 11h" ↔ pasta "3ª 8:30 às 11h - All levels"
 * O que os dois SEMPRE têm em comum é DIA DA SEMANA + HORÁRIO. Então: tenta nome
 * exato, depois dia+horário e só por último "contém".
 */
function acharTurmaPasta_(raizId, nome) {
  const exata = acharPasta(raizId, nome, true);
  if (exata) return { pasta: exata, via: 'nome exato' };
  const porHorario = acharPastaPorHorario_(raizId, nome);
  if (porHorario) return porHorario;
  const contem = acharPasta(raizId, nome);
  return contem ? { pasta: contem, via: 'nome parcial' } : null;
}

/**
 * Documento DE ALUNO (boletim, 2ª chance, termo de atraso): o nome completo do
 * aluno é uma chave bem mais forte que dia+horário, e as pastas de aluno são
 * únicas dentro de um professor. Então:
 *   1) caminho rápido — acha a turma e o aluno dentro dela;
 *   2) se falhar, procura o aluno em TODAS as turmas daquele professor.
 *      Achou em uma só → é ela, mesmo que o nome da turma não case com o card
 *      (resolve a turma cuja pasta tem nome que não bate com nada).
 *      Achou em mais de uma → ambíguo, recusa e diz quais são.
 */
function acharPastaDoAluno_(profId, turmaNome, aluno) {
  const achado = acharTurmaPasta_(profId, turmaNome);
  if (achado) {
    const dentro = acharPasta(achado.pasta.getId(), aluno);
    if (dentro) return { pasta: dentro, turma: achado.pasta, via: achado.via + ' + nome do aluno' };
  }
  const turmas = listarSubpastas_(profId) || [];
  const hits = [];
  for (let i = 0; i < turmas.length; i++) {
    const f = acharPasta(turmas[i].getId(), aluno);
    if (f) hits.push({ pasta: f, turma: turmas[i] });
  }
  if (hits.length === 1) {
    return { pasta: hits[0].pasta, turma: hits[0].turma, via: 'nome do aluno (turma "' + hits[0].turma.getName() + '")' };
  }
  if (hits.length > 1) {
    const nomes = hits.map(function (h) { return '"' + h.turma.getName() + '"'; }).join(', ');
    return { erro: 'o aluno "' + limpa_(aluno) + '" aparece em mais de uma turma (' + nomes + ') e o nome da turma do card não casou com nenhuma pasta — não dá para escolher com segurança' };
  }
  return { erro: 'pasta do aluno "' + limpa_(aluno) + '" não encontrada em nenhuma turma deste professor' };
}

/** dias da semana citados ("2ª/4ª", "3ª", "2°", "2a/4a", "Sáb") → [2,4] / [3] / [7].
 *  Dois enganos que já custaram caro e por isso estão tratados aqui:
 *   · "(até 2º ano)" / "(3º e 4º ano)" é SÉRIE ESCOLAR, não dia — e o dia sempre
 *     aparece fora dos parênteses, então os parênteses saem antes da leitura;
 *   · "18h45 às 21h15" NÃO pode virar dia 5: por isso o formato "2a" exige o
 *     dígito colado no "a" (sem espaço), diferente de "2ª/2º/2°". */
function diasDe_(s) {
  const t = txtBase_(s).replace(/\([^)]*\)/g, ' ');
  const dias = {};
  let m;
  const reOrdinal = /([2-6])\s*[ªº°]/g;   // 2ª · 5º · 2°
  while ((m = reOrdinal.exec(t))) dias[m[1]] = 1;
  // "2 e 4ª" / "2/4ª" / "3 e 5°": só o SEGUNDO dígito leva o ª — o primeiro
  // ficaria de fora se a gente exigisse o marcador dele também
  const rePar = /\b([2-6])\s*(?:e|\/|,)\s*([2-6])\s*[ªº°]/g;
  while ((m = rePar.exec(t))) { dias[m[1]] = 1; dias[m[2]] = 1; }
  const reLetra = /\b([2-6])a\b/g;        // 2a/4a · "3a Terça"
  while ((m = reLetra.exec(t))) dias[m[1]] = 1;
  // por extenso: tem professor que nomeia a pasta de "Quarta"/"Quinta"/"Sabado"
  // enquanto o card manda "4ª"/"5ª"/"Sáb"
  const POREXTENSO = [['domingo', '1'], ['dom', '1'], ['segunda', '2'], ['terca', '3'],
                      ['quarta', '4'], ['quinta', '5'], ['sexta', '6'],
                      ['sabado', '7'], ['sab', '7']];
  for (let i = 0; i < POREXTENSO.length; i++) {
    if (t.indexOf(POREXTENSO[i][0]) >= 0) dias[POREXTENSO[i][1]] = 1;
  }
  return Object.keys(dias).sort();
}

/** horários citados, em minutos: "17h30"/"17:30"/"17 30" → 1050; "20h"/"20h00" → 1200. */
function horasDe_(s) {
  let t = txtBase_(s);
  const set = {};
  function add(h, mi) {
    h = +h; mi = +mi;
    if (h >= 0 && h <= 23 && mi >= 0 && mi <= 59) set[h * 60 + mi] = 1;
  }
  // ordem importa: primeiro os formatos com separador, depois "20h", por último "18 45"
  t = t.replace(/(\d{1,2})\s*[h:]\s*(\d{2})/g, function (_, h, mi) { add(h, mi); return ' '; });
  t = t.replace(/(\d{1,2})\s*h/g, function (_, h) { add(h, 0); return ' '; });
  t = t.replace(/\b(\d{1,2})\s+(\d{2})\b/g, function (_, h, mi) { add(h, mi); return ' '; });
  return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
}

/** 1ª linha, sem acento, minúsculo — preservando ª/º/:/h, que são o sinal aqui. */
function txtBase_(s) {
  return String(s || '').split('\n')[0].toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Casa a turma por dia+horário. Exige os MESMOS dias e pelo menos um horário
 * igual, e só aceita se houver um vencedor ISOLADO — empate é ambiguidade, e
 * ambiguidade tem de virar "não encontrei" (salvar na turma errada é pior).
 */
function acharPastaPorHorario_(raizId, nome) {
  const dias = diasDe_(nome).join(','), horas = horasDe_(nome);
  if (!dias || !horas.length) return null;
  const subs = listarSubpastas_(raizId);
  if (!subs) return null;

  let melhor = null, melhorScore = 0, segundoScore = 0;
  for (let i = 0; i < subs.length; i++) {
    const nomePasta = subs[i].getName();
    if (diasDe_(nomePasta).join(',') !== dias) continue;         // dias têm de bater exatamente
    const hp = horasDe_(nomePasta);
    let comuns = 0;
    for (let j = 0; j < horas.length; j++) if (hp.indexOf(horas[j]) >= 0) comuns++;
    if (!comuns) continue;
    if (comuns > melhorScore) { segundoScore = melhorScore; melhorScore = comuns; melhor = subs[i]; }
    else if (comuns > segundoScore) { segundoScore = comuns; }
  }
  if (!melhor || melhorScore === segundoScore) return null;      // empate = ambíguo
  return { pasta: melhor, via: 'dia+horário (' + melhorScore + ' horário(s) em comum)' };
}

/**
 * Lista o que o script enxerga no Drive, para depurar o casamento de nomes.
 * ?action=driveDebug&key=TEACHER&escola=cacapava        → subpastas da raiz
 * ?action=driveDebug&key=TEACHER&pasta=<id>             → subpastas de uma pasta
 * Se o escopo do Drive não estiver autorizado, o erro aparece aqui explícito
 * (em vez de virar um "pasta não encontrada" enganoso).
 */
function driveDebug(escola, pastaId) {
  const id = pastaId || rootDaEscola(escola);
  if (!id) return json({ ok: false, error: 'informe escola (taubate/cacapava) ou pasta=<id>' });
  try {
    const raiz = DriveApp.getFolderById(id);
    const subs = [];
    const it = raiz.getFolders();
    while (it.hasNext()) { const f = it.next(); subs.push({ nome: f.getName(), id: f.getId() }); }
    subs.sort(function (a, b) { return a.nome < b.nome ? -1 : 1; });
    return json({ ok: true, pasta: raiz.getName(), id: id, total: subs.length, subpastas: subs });
  } catch (e) {
    return json({ ok: false, error: String(e), dica: 'se for erro de autorização, rode setupDrive() no editor' });
  }
}

/**
 * Ensaio do salvamento: percorre escola → professor → turma → [aluno] e diz
 * onde CAIRIA, sem gravar nada. ?action=driveMatch&key=&escola=&professor=&turma=[&aluno=]
 */
function driveMatch(p) {
  const raizId = rootDaEscola(p.escola);
  if (!raizId) return json({ ok: false, etapa: 'escola', erro: 'escola não reconhecida' });
  const profF = acharPasta(raizId, p.professor);
  if (!profF) return json({ ok: false, etapa: 'professor', erro: 'pasta do professor não encontrada' });
  // com aluno, simula o MESMO caminho de um documento de aluno (busca ampla inclusa)
  if (p.aluno) {
    const r = acharPastaDoAluno_(profF.getId(), p.turma, p.aluno);
    if (r.erro) return json({ ok: false, etapa: 'aluno', professor: profF.getName(), erro: r.erro });
    return json({ ok: true, professor: profF.getName(), turma: r.turma.getName(),
                  aluno: r.pasta.getName(), via: r.via });
  }
  const achado = acharTurmaPasta_(profF.getId(), p.turma);
  if (!achado) {
    return json({ ok: false, etapa: 'turma', professor: profF.getName(),
      erro: 'pasta da turma não encontrada',
      lidos: { dias: diasDe_(p.turma), horas: horasDe_(p.turma) } });
  }
  return json({ ok: true, professor: profF.getName(), turma: achado.pasta.getName(), via: achado.via });
}

function erroPasta_(msg) { return json({ ok: false, code: 'pasta_nao_encontrada', erro: msg }); }
/** normaliza: 1ª linha, sem acento, minúsculo, só letras/números/espaço. */
function normPasta_(s) {
  return String(s || '').split('\n')[0]
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function limpa_(s) { return String(s || '').split('\n')[0].trim(); }
