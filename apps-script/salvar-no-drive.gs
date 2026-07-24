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
 * ESTRUTURA de pastas (detectada no drive compartilhado):
 *   Planners <Escola> → "<n> - <Professor>" → "<n> - <dia/horário> - <NÍVEL>"
 *   (turma) → [pastas de aluno por nome completo].
 *   - Plano da TURMA  → salvo na pasta da turma.
 *   - Doc do ALUNO    → salvo na pasta do aluno (dentro da turma).
 *   A busca por nome normaliza acento/caixa/pontuação (exata e depois "contém").
 */

// ⚙️ ================= CONFIG =================
var FISK_CHAVE = 'fisk-cards-2026-vX7q3nT'; // mesma API_KEY das ferramentas
// Raízes por escola (pastas "Planners ..." no drive compartilhado):
var RAIZ_ESCOLA = {
  taubate:  '1c7vuwrRpINGx-ITgvhr65yD4cwbHodt2', // Planners Taubaté
  cacapava: '1FJ8Fs677pq0tENiJ1PHLtZp8A0lmw-Gs'  // Planners Caçapava
};
// ===========================================

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.key !== FISK_CHAVE) return _json({ ok: false, erro: 'chave inválida' });
    if (req.fn !== 'salvarPdf') return _json({ ok: false, erro: 'função desconhecida: ' + req.fn });
    if (!req.dados) return _json({ ok: false, erro: 'PDF vazio' });

    var raizId = rootDaEscola(req.escola);
    if (!raizId) return _erroPasta('escola "' + _limpa(req.escola) + '" não reconhecida (esperado Taubaté ou Caçapava)');

    var profF = acharPasta(raizId, req.professor);
    if (!profF) return _erroPasta('pasta do professor "' + _limpa(req.professor) + '" não encontrada em Planners ' + _limpa(req.escola));

    var turmaF = acharPasta(profF.getId(), req.turma);
    if (!turmaF) return _erroPasta('pasta da turma "' + _limpa(req.turma) + '" não encontrada na pasta de ' + _limpa(req.professor));

    var destino = turmaF;
    if (req.tipo === 'aluno') {
      destino = acharPasta(turmaF.getId(), req.aluno);
      if (!destino) return _erroPasta('pasta do aluno "' + _limpa(req.aluno) + '" não encontrada na turma ' + _limpa(req.turma));
    }

    var blob = Utilities.newBlob(Utilities.base64Decode(req.dados), req.mime || 'application/pdf', req.filename || 'documento.pdf');
    var antigos = destino.getFilesByName(blob.getName());
    while (antigos.hasNext()) antigos.next().setTrashed(true);
    var arq = destino.createFile(blob);
    return _json({ ok: true, url: arq.getUrl(), pasta: destino.getName() });
  } catch (err) {
    return _json({ ok: false, erro: String(err) });
  }
}

/** escolhe a raiz "Planners <Escola>" a partir do nome da escola. */
function rootDaEscola(escola) {
  var e = _norm(escola);
  if (e.indexOf('cacapava') >= 0) return RAIZ_ESCOLA.cacapava;
  if (e.indexOf('taubate') >= 0)  return RAIZ_ESCOLA.taubate;
  return null;
}

/** procura uma subpasta por nome (normalizado): igualdade exata e depois "contém". */
function acharPasta(raizId, nome) {
  if (!raizId || !nome) return null;
  var raiz;
  try { raiz = DriveApp.getFolderById(raizId); } catch (e) { return null; }
  var alvo = _norm(nome);
  if (!alvo) return null;
  var melhorContem = null;
  var it = raiz.getFolders();
  while (it.hasNext()) {
    var f = it.next(), n = _norm(f.getName());
    if (n === alvo) return f;                                   // exata
    if (!melhorContem && (n.indexOf(alvo) >= 0 || alvo.indexOf(n) >= 0)) melhorContem = f; // contém
  }
  return melhorContem;
}

function _erroPasta(msg) { return _json({ ok: false, code: 'pasta_nao_encontrada', erro: msg }); }
/** normaliza: 1ª linha, sem acento, minúsculo, só letras/números/espaço. */
function _norm(s) {
  return String(s || '').split('\n')[0]
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function _limpa(s) { return String(s || '').split('\n')[0].trim(); }
function _json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
