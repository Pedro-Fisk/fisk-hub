/**
 * FISK Hub — Salvar PDF na pasta da turma / do aluno (drive compartilhado)
 * =========================================================================
 * ⚠️ ONDE COLAR: este é um endpoint NOVO. Conforme a regra do próprio card
 * ("endpoints novos vão no projeto SEPARADO fisk-hub-backend"), NÃO cole
 * dentro do CardTools.gs — um projeto só pode ter UM doPost, e você já foi
 * avisado que editar o CardTools por outra sessão apaga trabalho.
 *
 * PASSO A PASSO:
 *   1) Abra (ou crie) o projeto Apps Script SEPARADO "fisk-hub-backend"
 *      (script.google.com → Novo projeto). NÃO é o CardTools.
 *   2) Cole TODO este conteúdo num arquivo .gs desse projeto (pode ser o
 *      Code.gs padrão — substitua o conteúdo dele).
 *   3) Implantar → Nova implantação → tipo "App da Web":
 *        - Executar como: Eu
 *        - Quem tem acesso: Qualquer pessoa
 *   4) Copie a URL do App da Web (termina em /exec) e cole em
 *      assets/fisk-shared.js na constante FISK_SAVE_URL. (As ferramentas
 *      fazem POST para ESSA url, separada do API_URL do card.)
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
