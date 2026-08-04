/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ESPELHO CARD → DRIVE — correções automáticas
 *  Gerado a partir da conferência de 04/08/2026 entre os cards do 2º semestre
 *  (Caçapava e Taubaté) e a árvore "Planners <escola> › professor › turma › aluno".
 *
 *  COMO USAR
 *    1. simular()  — não escreve nada. Lê cada pasta, confere se o estado atual
 *                    ainda é o esperado e imprime o que faria.
 *    2. aplicar()  — executa. Recusa qualquer operação cuja pasta já tenha sido
 *                    mexida desde a conferência (nome ou pasta-mãe diferentes).
 *
 *  SEGURANÇA
 *    · Toda operação carrega o estado esperado. Se a pasta já foi renomeada ou
 *      movida na mão, o item é PULADO com o motivo — nunca sobrescrito.
 *    · "criar" só cria se ainda não existir pasta com aquele nome no destino,
 *      então rodar duas vezes não duplica nada.
 *    · Nada é apagado. Nenhuma operação remove pasta ou arquivo.
 *
 *  O QUE NÃO ESTÁ AQUI — e por quê
 *    Ficaram de fora os casos que dependem de decisão sua: aluno que aparece em
 *    duas turmas no card, aluno com duas pastas no Drive, nome do card com
 *    anotação colada e turma cuja pasta de destino não pôde ser confirmada.
 *    A lista está em ESPELHO-CARD-DRIVE.md, no mesmo repositório.
 * ═══════════════════════════════════════════════════════════════════════════
 */

var PLANO = [
  { op: 'criar', nome: "Maria Fernanda Sampaio Campanilli Agostinho", destino: "12MAEEqoaAZ-Wgqzl6UwhI3Gem53IR00E", destinoTxt: "Taubaté › LEONARDO › Sáb - 10:30/13:00 - ESSENTIALS 1 (ACAD)" },
  { op: 'renomear', id: "1W-Z5qneTUkDtVR8U--u2vNJU_aXlv2-0", de: "Otavio Luis Campanelli Agostinho", para: "Otavio Luis Campanilli Agostinho", onde: "Taubaté › CARLOS › 04 - Sáb - 10:30/13:00 - INTERMEDIÁRIO" },
  { op: 'renomear', id: "18n2C7djRgDikh5I5DoxOVK0yyyMeWS3F", de: "Lucas Montovani Faria", para: "Lucas Mantovani Faria", onde: "Taubaté › CARLOS › 04 - Sáb - 10:30/13:00 - INTERMEDIÁRIO" },
  { op: 'renomear', id: "18dPA8h4Bxku_85Q-gzXXyqwjHJta3IfC", de: "Kailan Ferreira Landin dos Santos", para: "Kailan Ferreira Landim dos Santos", onde: "Taubaté › LEONARDO › 3ª - 08h30 / 11h00 - Teens Connect /Teens Elementary 1" },
  { op: 'renomear', id: "1c83O9G2KY6G40x4uy6cyujew2tX3RaY3", de: "Raquel Faria de Melo", para: "Raquel Faria de Mello", onde: "Taubaté › MARIA PAULA › Sáb - 10:30/13:00 - Teens Elementary 1" },
  { op: 'renomear', id: "1gQ0RLpkCkhnBvlsZWsEDmsNxnT_VLgHW", de: "Giovanna de Silva Cusin", para: "Giovanna da Silva Cusin", onde: "Taubaté › MARIANA G. › 3ª - 15:00/17:30 - INTERM/ADV" },
  { op: 'renomear', id: "1D1eDXUNcajsuhf4fh8-5dXEWv8lv7F0Q", de: "Leticia Rayani Gonçalves Cesar", para: "Leticia Rayane Gonçalves César", onde: "Taubaté › MARIANA G. › Sáb - 08:00/10:30 - ADV" },
  { op: 'renomear', id: "1qyR3VR5DQD6UtaAgs99KyjAAI3o9NeV3", de: "Davi Eiji Okamura Passarelli", para: "Davi Eiji Okumura Passarelli", onde: "Taubaté › TAMIRES › Sab - 8:00/10:30 - Kids até 2°ano" },
  { op: 'renomear', id: "1wrO1lsRZUI7b--b02d3wx2XrBlnNtLlz", de: "Bruna Naomi Sonada Santos", para: "Bruna Naomi Sonoda Santos", onde: "Caçapava › ALEX › 3ª 15h às 17 30 Inter/Adv" },
  { op: 'renomear', id: "1XubxeniFS6Q_zsLOiOlyYchWSMRtzmCd", de: "Lucas Audebert Delage Miacchi", para: "Lucas Audebert Delage Miacci", onde: "Caçapava › CARLOS ALBERTO › 4) Sabado - 08h00 - 10h30" },
  { op: 'renomear', id: "1-Hxl44guM0ZbdhgArkkxsaPIkSrixjjs", de: "Kauã Victor de Paulo Carlota", para: "Kauã Victor de Paula Carlota", onde: "Caçapava › CLAUDINEI › 6° das 16h15 as 18h45. Acâdemico Essentials 2" },
  { op: 'renomear', id: "1g2gCXElTl9Z99wRTJhUVWnh5y0xoUalr", de: "Ana Alice Santos Leme", para: "Ana Alice dos Santos Lemes", onde: "Caçapava › ERICK › Sábado - 8 00-10 30" },
  { op: 'renomear', id: "1DkgatsI8picQ8QvH5e4qTC7TKfanK-0t", de: "Alicia Porto Lima Da Rocha", para: "Alice Porto Lima Da Rocha", onde: "Caçapava › MARIA FERNANDA › 3ª/5ª 17h30 às 18h45 - Acadêmico Teens Elementary" },
  { op: 'renomear', id: "1LDMoxp--JjAvevZl2PIplFzc-jXG4tt_", de: "Antonio Da silva Camargo Pires", para: "Antonio Silva de Camargo Pires", onde: "Caçapava › MARIA FERNANDA › 4ª 15H - KIDS MULTILEVEL" },
  { op: 'renomear', id: "1wFnSI0_A4ZfF5YsHzoEI-YYqSeFi-Ln7", de: "Giovanna Oliveira Bittencuort Moura", para: "Giovanna Oliveira Bittencourt Moura", onde: "Caçapava › NICOLE › 3ª 8h30 às 11h - KIDS" },
  { op: 'mover', id: "1iyR1rQc2_PcETJcE1bdOQ4lANZ5OmS5f", nome: "Luiza Mattos Ferreira", de: "Taubaté › 2 - Carlos › 04 - Sáb - 10:30/13:00 - INTERMEDIÁRIO", destino: "1CQhADFQGZzVn1uGtm7Jw6Baw7TF17H44", destinoTxt: "Taubaté › MARIANA G. › Sáb - 10:30/13h00 - INT/ADV" },
  { op: 'mover', id: "16nh0svYl_U6kZIq4Y4gAcgwyrUfRtp_4", nome: "Davi Venancio dos Santos", de: "Caçapava › Claudinei › 6° das 16h15 as 18h45. Acâdemico Essentials 2", destino: "18HvXf_NsPR7iTvf9YN4JDrxoTRY7a1YR", destinoTxt: "Caçapava › ALEX › 6ª 16:15-18 45 - All levels" },
  { op: 'mover', id: "1Qs6JMHdtHzUz4p1DbJoyTSgctx5eKe9a", nome: "Gustavo Peretta dos Santos Abreu", de: "Caçapava › Nicolas › Basic (-18) - Sáb 8h às 10h30 -18", destino: "1JmIm_2mGIzjSuF0AjPLImnHEtYWZ2nyd", destinoTxt: "Caçapava › CARLOS ALBERTO › 5) Sabado - 10h30- 13hrs - Basic" },
  { op: 'mover', id: "10a4p0ytY-pbmd9NV_dufYCjYLnSnPlWD", nome: "João Gabriel Ricardo Dos Santos", de: "Caçapava › Carlos Alberto › 2) Quinta - 15hr - 17:30h - ADV", destino: "1BlwqEdHqN3fB0rRPhi40eGO7iJ8qbPyQ", destinoTxt: "Caçapava › CLAUDINEI › 3ª/5ª - 17h30 às 18h45 - Basic" },
  { op: 'mover', id: "1XXECenFWdyRC8g-uh_ykCjUHvQmJtbHw", nome: "Antônio De Paiva", de: "Caçapava › Alex › Sáb 10h30 às 13h - Acad ESS1", destino: "117OjK2z8Uq9m7LMKxjSvYp21uT7mq-2n", destinoTxt: "Caçapava › MARIA LUIZA › 3ª/5ª - 17H30 - ACAD ESS1" },
  { op: 'renomearTurma', id: "1F3w983g0dpH8yhRVRbsTZ2tSXEzUq-Zc", de: "03 - Sáb - 08:00/10h:30 - BÁSICO", para: "03 - Sáb - 08:00/10:30 - BÁSICO", motivo: "o \"10h:30\" empata o casamento por dia+horário com a turma das 10h30 e faz o sistema recusar" },
  { op: 'renomearTurma', id: "1W7Z7yVngeUaGZzcd46l3AamuQC4UDjRM", de: "6ª 13:45-15:00 - Advanced", para: "6ª 13:45-16:15 - Advanced", motivo: "o card diz 13h45 às 16h15; com 15:00 a pasta empata com a das 16h15 e é recusada" }
];

/** Ensaio: não escreve nada. */
function simular() { executar_(false); }

/** Vale valendo. */
function aplicar() { executar_(true); }

function executar_(gravar) {
  var feitos = 0, pulados = 0, erros = 0;
  var log = ['=== ESPELHO CARD → DRIVE — ' + (gravar ? 'APLICANDO' : 'SIMULAÇÃO') + ' ===', ''];

  for (var i = 0; i < PLANO.length; i++) {
    var o = PLANO[i], r;
    try {
      r = (o.op === 'criar')  ? criar_(o, gravar)
        : (o.op === 'mover')  ? mover_(o, gravar)
        : (o.op === 'renomear' || o.op === 'renomearTurma') ? renomear_(o, gravar)
        : { ok: false, msg: 'operação desconhecida: ' + o.op };
    } catch (e) {
      r = { ok: false, msg: 'erro: ' + e };
    }
    if (r.ok) { feitos++; log.push('  ✓ ' + r.msg); }
    else if (r.pulado) { pulados++; log.push('  – ' + r.msg); }
    else { erros++; log.push('  ✗ ' + r.msg); }
  }

  log.push('', 'feitos: ' + feitos + ' · pulados: ' + pulados + ' · erros: ' + erros);
  if (!gravar) log.push('(simulação — nada foi gravado)');
  var txt = log.join('\n');
  Logger.log(txt);
  return txt;
}

/* ── operações ─────────────────────────────────────────────────────────── */

function criar_(o, gravar) {
  var destino = DriveApp.getFolderById(o.destino);
  var jaTem = destino.getFoldersByName(o.nome);
  if (jaTem.hasNext()) {
    return { pulado: true, msg: 'criar "' + o.nome + '": já existe em ' + o.destinoTxt };
  }
  if (!gravar) return { ok: true, msg: 'criaria "' + o.nome + '" em ' + o.destinoTxt };
  destino.createFolder(o.nome);
  return { ok: true, msg: 'criada "' + o.nome + '" em ' + o.destinoTxt };
}

function mover_(o, gravar) {
  var pasta = DriveApp.getFolderById(o.id);
  var atual = pasta.getName().trim();
  if (atual !== o.nome) {
    return { pulado: true, msg: 'mover "' + o.nome + '": a pasta agora se chama "' + atual + '" — confira antes' };
  }
  var paiAtual = paiDe_(pasta);
  if (paiAtual && paiAtual.getId() === o.destino) {
    return { pulado: true, msg: 'mover "' + o.nome + '": já está em ' + o.destinoTxt };
  }
  if (!gravar) return { ok: true, msg: 'moveria "' + o.nome + '" de ' + o.de + ' para ' + o.destinoTxt };
  pasta.moveTo(DriveApp.getFolderById(o.destino));
  return { ok: true, msg: 'movida "' + o.nome + '" para ' + o.destinoTxt };
}

function renomear_(o, gravar) {
  var pasta = DriveApp.getFolderById(o.id);
  var atual = pasta.getName().trim();
  if (atual === o.para.trim()) {
    return { pulado: true, msg: 'renomear "' + o.de + '": já está como "' + o.para + '"' };
  }
  if (atual !== o.de.trim()) {
    return { pulado: true, msg: 'renomear "' + o.de + '": a pasta agora se chama "' + atual + '" — confira antes' };
  }
  if (!gravar) return { ok: true, msg: 'renomearia "' + o.de + '" → "' + o.para + '"' };
  pasta.setName(o.para);
  return { ok: true, msg: 'renomeada "' + o.de + '" → "' + o.para + '"' };
}

/** Pasta-mãe (no drive compartilhado a pasta tem exatamente uma). */
function paiDe_(pasta) {
  var it = pasta.getParents();
  return it.hasNext() ? it.next() : null;
}
