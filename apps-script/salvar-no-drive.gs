/**
 * FISK Hub — Salvar PDF na pasta da turma / do aluno (drive compartilhado)
 * =========================================================================
 * Cole este código no MESMO projeto Apps Script que já serve o card (o do
 * API_URL das ferramentas). Depois:
 *   1) Ajuste os IDs em CONFIG abaixo (⚙️).
 *   2) Implantar → Gerenciar implantações → editar a implantação existente
 *      → Nova versão (executar como VOCÊ; quem tem acesso: "Qualquer pessoa").
 *   3) A URL do App da Web continua a MESMA (o mesmo API_URL das ferramentas).
 *
 * As ferramentas do Hub fazem POST (JSON) para essa URL com o corpo:
 *   { fn:'salvarPdf', key, tipo:'turma'|'aluno',
 *     escola, professor, turma, aluno, filename, mime, dados(base64) }
 * e esperam de volta:
 *   { ok:true, url, pasta }                     // salvo
 *   { ok:false, code:'pasta_nao_encontrada', erro } // pasta não achada → avisa o professor
 *   { ok:false, erro }                          // outro erro
 *
 * Regra de pastas (busca por NOME, conforme combinado):
 *   - tipo 'turma'  → procura a pasta cujo nome casa com o nome da turma,
 *                     dentro de RAIZ_TURMAS.
 *   - tipo 'aluno'  → procura a pasta do aluno DENTRO da pasta da turma; se
 *                     não achar, procura em RAIZ_ALUNOS (se configurada).
 *   A comparação normaliza acentos, caixa e pontuação; tenta igualdade
 *   exata e, se não houver, "contém". Ajuste acharPasta() se sua convenção
 *   de nomes for diferente.
 */

// ⚙️ ================= CONFIG — AJUSTE AQUI =================
var FISK_CHAVE = 'fisk-cards-2026-vX7q3nT'; // mesma API_KEY das ferramentas
// Pasta-raiz que contém as pastas das TURMAS (detectada no Drive do Pedro:
// contém "3ª/5ª - 17h30 às 18h45 - Basic", "5ª 15:00-17:30 - Advanced", etc.).
// ⚠️ CONFIRME que é a raiz certa; troque se usar outra conta/drive compartilhado.
var RAIZ_TURMAS = '1dwNu5aku0lgUiPGNHtXvjJB7fwWAJi5B';
// As pastas de ALUNO ficam DENTRO da pasta da turma (nome completo do aluno),
// então deixe '' — o script procura o aluno dentro da turma. Se houver uma
// raiz separada de alunos, cole o ID dela aqui:
var RAIZ_ALUNOS = '';
// =========================================================

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.key !== FISK_CHAVE) return _json({ ok: false, erro: 'chave inválida' });
    if (req.fn !== 'salvarPdf') return _json({ ok: false, erro: 'função desconhecida: ' + req.fn });
    if (!req.dados) return _json({ ok: false, erro: 'PDF vazio' });

    var pasta = (req.tipo === 'turma')
      ? acharPasta(RAIZ_TURMAS, req.turma)
      : acharPastaAluno(req);

    if (!pasta) {
      var alvo = (req.tipo === 'turma') ? 'da turma "' + _limpa(req.turma) + '"'
                                        : 'do aluno "' + _limpa(req.aluno) + '"';
      return _json({ ok: false, code: 'pasta_nao_encontrada', erro: 'pasta ' + alvo + ' não encontrada no drive compartilhado' });
    }

    var blob = Utilities.newBlob(Utilities.base64Decode(req.dados), req.mime || 'application/pdf', req.filename || 'documento.pdf');
    // substitui uma versão anterior de mesmo nome (mantém a pasta limpa)
    var antigos = pasta.getFilesByName(blob.getName());
    while (antigos.hasNext()) antigos.next().setTrashed(true);
    var arq = pasta.createFile(blob);
    return _json({ ok: true, url: arq.getUrl(), pasta: pasta.getName() });
  } catch (err) {
    return _json({ ok: false, erro: String(err) });
  }
}

/** Pasta do aluno: primeiro dentro da pasta da turma; senão, na raiz de alunos. */
function acharPastaAluno(req) {
  if (req.turma) {
    var t = acharPasta(RAIZ_TURMAS, req.turma);
    if (t) {
      var dentro = acharPasta(t.getId(), req.aluno);
      if (dentro) return dentro;
    }
  }
  if (RAIZ_ALUNOS) return acharPasta(RAIZ_ALUNOS, req.aluno);
  return null;
}

/** Procura uma subpasta por nome (normalizado): igualdade exata e depois "contém". */
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

/** normaliza: 1ª linha, sem acento, minúsculo, só letras/números/espaço. */
function _norm(s) {
  return String(s || '').split('\n')[0]
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function _limpa(s) { return String(s || '').split('\n')[0].trim(); }
function _json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
