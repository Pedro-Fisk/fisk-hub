/**
 * FISK DÓLARES (F$) — carteira gamificada do Portal do Aluno.
 *
 * Economia aprovada pelo Pedro (28/07/2026):
 *   · F$ 2 por questão respondida (participação, mesmo errada)
 *   · F$ 8 adicionais por questão correta (acerto vale 10 no total)
 *   · F$ 30 por concluir uma atividade pela PRIMEIRA vez
 *   · Refez e MELHOROU a nota → F$ 1 por ponto percentual de melhora
 *   · Cada atividade paga a base uma única vez; teto diário de F$ 300
 *   · Começa do zero: nada retroativo.
 *
 * Planilhas (criadas automaticamente na primeira execução, na mesma
 * spreadsheet do backend):
 *   _carteira  → RAF | Saldo | Atualizado
 *   _extrato   → Quando | RAF | Atividade | Tipo | Detalhe | Valor | Saldo
 *   _progresso → RAF | Atividade | MelhorPct | BasePaga
 *
 * ── INTEGRAÇÃO (3 passos no fisk-hub-backend) ────────────────────────────
 * 1. Cole este arquivo no projeto do Apps Script.
 * 2. No roteador do doGet, adicione:
 *      if (action === 'wallet') return fdJson_(fdWallet_(String(p.raf || '')));
 * 3. No doPost, ONDE O RESULTADO DE QP/MET É SALVO (após validar appKey),
 *    adicione — o crédito é calculado aqui no servidor e devolvido na
 *    resposta (o Quick Practice e o MET mostram um aviso "+F$" se o campo
 *    fd vier preenchido):
 *      var fd = null;
 *      if (body.data && body.data.raf && body.data.q) {
 *        fd = fdEarn_(body.data.raf, body.tool + ':' + (body.data.s || ''), Number(body.data.c || 0), Number(body.data.q || 0));
 *      }
 *      // ... e inclua `fd: fd` no objeto JSON que essa rota já devolve.
 *    E adicione a ação de crédito direto (Movie Program):
 *      if (body.action === 'fdEarn') return fdJson_(fdEarn_(String(body.raf || ''), String(body.activityId || ''), Number(body.correct || 0), Number(body.total || 0)));
 * 4. Nova implantação do Web App (mesma URL).
 */

var FD = {
  PARTICIPACAO: 2,     // por questão respondida
  ACERTO: 8,           // adicional por questão correta
  CONCLUSAO: 30,       // primeira vez que fecha a atividade
  MELHORA_POR_PP: 1,   // por ponto percentual de melhora ao refazer
  TETO_DIARIO: 300,
  EXTRATO_MAX: 20      // linhas devolvidas ao portal
};

function fdJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function fdSheet_(nome, cabecalho) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Saldo + últimas transações de um aluno. */
function fdWallet_(raf) {
  raf = String(raf || '').trim();
  if (!raf) return { ok: false, error: 'RAF vazio' };
  var cart = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']);
  var saldo = 0;
  var vals = cart.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === raf) { saldo = Number(vals[i][1]) || 0; break; }
  }
  var ext = fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo']);
  var evals = ext.getDataRange().getValues();
  var linhas = [];
  for (var j = evals.length - 1; j >= 1 && linhas.length < FD.EXTRATO_MAX; j--) {
    if (String(evals[j][1]).trim() === raf) {
      linhas.push({ t: new Date(evals[j][0]).getTime(), atividade: evals[j][2], tipo: evals[j][3], detalhe: evals[j][4], valor: Number(evals[j][5]) || 0 });
    }
  }
  return { ok: true, saldo: saldo, extrato: linhas };
}

/**
 * Credita uma atividade corrigida. Idempotente:
 *  · base (participação+acertos+conclusão) paga só na 1ª vez da atividade;
 *  · reenvio idêntico não paga nada;
 *  · reenvio com nota MAIOR paga só a melhora (1 F$ por p.p.).
 * Devolve { ok, credito, saldo, detalhe }.
 */
function fdEarn_(raf, activityId, correct, total) {
  raf = String(raf || '').trim();
  activityId = String(activityId || '').trim();
  correct = Math.max(0, Math.round(Number(correct) || 0));
  total = Math.max(0, Math.round(Number(total) || 0));
  if (!raf || !activityId || !total) return { ok: false, error: 'dados incompletos' };
  if (correct > total) correct = total;
  var pct = Math.round(correct / total * 100);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var prog = fdSheet_('_progresso', ['RAF', 'Atividade', 'MelhorPct', 'BasePaga']);
    var pvals = prog.getDataRange().getValues();
    var prow = -1, melhorPct = -1, basePaga = false;
    for (var i = 1; i < pvals.length; i++) {
      if (String(pvals[i][0]).trim() === raf && String(pvals[i][1]).trim() === activityId) {
        prow = i + 1; melhorPct = Number(pvals[i][2]) || 0; basePaga = String(pvals[i][3]) === 'sim';
        break;
      }
    }

    var credito = 0, detalhe = [];
    if (!basePaga) {
      var base = total * FD.PARTICIPACAO + correct * FD.ACERTO + FD.CONCLUSAO;
      credito += base;
      detalhe.push('participação ' + (total * FD.PARTICIPACAO) + ' · acertos ' + (correct * FD.ACERTO) + ' · conclusão ' + FD.CONCLUSAO);
    } else if (pct > melhorPct) {
      var bonus = (pct - melhorPct) * FD.MELHORA_POR_PP;
      credito += bonus;
      detalhe.push('melhora de ' + melhorPct + '% para ' + pct + '%');
    }

    // teto diário
    var hoje = 0;
    var ext = fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo']);
    var evals = ext.getDataRange().getValues();
    var d0 = new Date(); d0.setHours(0, 0, 0, 0);
    for (var j = evals.length - 1; j >= 1; j--) {
      var quando = new Date(evals[j][0]);
      if (quando < d0) break; // extrato é cronológico
      if (String(evals[j][1]).trim() === raf) hoje += Number(evals[j][5]) || 0;
    }
    if (credito > 0 && hoje + credito > FD.TETO_DIARIO) {
      credito = Math.max(0, FD.TETO_DIARIO - hoje);
      detalhe.push('teto diário aplicado');
    }

    // grava progresso (mesmo com crédito 0, atualiza a melhor nota)
    var novoMelhor = Math.max(melhorPct, pct);
    if (prow < 0) prog.appendRow([raf, activityId, novoMelhor, 'sim']);
    else prog.getRange(prow, 3, 1, 2).setValues([[novoMelhor, 'sim']]);

    // atualiza carteira + extrato
    var cart = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']);
    var cvals = cart.getDataRange().getValues();
    var crow = -1, saldo = 0;
    for (var k = 1; k < cvals.length; k++) {
      if (String(cvals[k][0]).trim() === raf) { crow = k + 1; saldo = Number(cvals[k][1]) || 0; break; }
    }
    saldo += credito;
    if (crow < 0) cart.appendRow([raf, saldo, new Date()]);
    else cart.getRange(crow, 2, 1, 2).setValues([[saldo, new Date()]]);
    if (credito > 0) {
      ext.appendRow([new Date(), raf, activityId, basePaga ? 'melhora' : 'atividade', detalhe.join(' · '), credito, saldo]);
    }
    return { ok: true, credito: credito, saldo: saldo, detalhe: detalhe.join(' · ') };
  } finally {
    lock.releaseLock();
  }
}
