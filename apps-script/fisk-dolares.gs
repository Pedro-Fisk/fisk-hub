/**
 * FISK DÓLARES (F$) — carteira gamificada do Portal do Aluno
 * + STREAK de dias seguidos + CONQUISTAS (badges).
 *
 * Economia aprovada pelo Pedro (28/07/2026):
 *   · F$ 2 por questão respondida (participação, mesmo errada)
 *   · F$ 8 adicionais por questão correta (acerto vale 10 no total)
 *   · F$ 30 por concluir uma atividade pela PRIMEIRA vez
 *   · Refez e MELHOROU a nota → F$ 1 por ponto percentual de melhora
 *   · Check-in diário: F$ 5 (+ bônus nos marcos da sequência)
 *   · Cada atividade paga a base uma única vez; teto diário de F$ 300
 *   · Começa do zero: nada retroativo.
 *
 * Bônus de acesso (29/07/2026):
 *   · F$ 5 só por entrar no portal, para premiar o hábito de voltar
 *   · No máximo 3 vezes por dia, com 3h de intervalo entre uma e outra
 *     (senão bastaria sair e entrar de novo para imprimir dinheiro)
 *   · Vem junto com o check-in: no 1º acesso do dia o aluno leva 5 + 5
 *
 * Bônus avulsos (fdBonus_):
 *   · F$ 30 por concluir o tour da home ('tour-portal'), uma vez por aluno
 *   · Só paga bonusId que esteja em FD.BONUS — a rota é pública
 *
 * Planilhas (criadas automaticamente na primeira execução):
 *   _carteira   → RAF | Saldo | Atualizado
 *   _extrato    → Quando | RAF | Atividade | Tipo | Detalhe | Valor | Saldo
 *   _progresso  → RAF | Atividade | MelhorPct | BasePaga
 *   _streak     → RAF | Dias | Recorde | UltimoDia
 *   _conquistas → RAF | Badge | Quando
 *   _acessos    → RAF | Dia | VezesHoje | Ultimo
 *   _bonus      → RAF | BonusId | Quando
 *
 * ── INTEGRAÇÃO (fisk-hub-backend) ────────────────────────────────────────
 * 1. Cole este arquivo no projeto do Apps Script.
 * 2. No roteador do doGet:
 *      if (action === 'wallet') return fdJson_(fdWallet_(String(p.raf || '')));
 * 3. No doPost:
 *      if (body.action === 'fdEarn')    return fdJson_(fdEarn_(String(body.raf || ''), String(body.activityId || ''), Number(body.correct || 0), Number(body.total || 0)));
 *      if (body.action === 'fdCheckin') return fdJson_(fdCheckin_(String(body.raf || '')));
 *      if (body.action === 'fdBonus')   return fdJson_(fdBonus_(String(body.raf || ''), String(body.bonusId || '')));
 *    ⚠ Esta última faltava: o portal já chamava 'fdBonus' desde o tour, e sem
 *      ela o bônus de boas-vindas nunca foi pago (o portal engole o erro).
 * 4. ONDE O RESULTADO DE QP/MET É SALVO (após validar appKey):
 *      var fd = null;
 *      if (body.data && body.data.raf && body.data.q) {
 *        fd = fdEarn_(body.data.raf, body.tool + ':' + (body.data.s || ''), Number(body.data.c || 0), Number(body.data.q || 0));
 *      }
 *      // ...inclua `fd: fd` no JSON que essa rota já devolve.
 * 5. Nova implantação do Web App (mesma URL).
 */

var FD = {
  PARTICIPACAO: 2,       // por questão respondida
  ACERTO: 8,             // adicional por questão correta
  CONCLUSAO: 30,         // primeira vez que fecha a atividade
  MELHORA_POR_PP: 1,     // por ponto percentual de melhora ao refazer
  CHECKIN: 5,            // check-in diário
  ACESSO: 5,             // só por entrar no portal
  ACESSO_INTERVALO_H: 3, // horas mínimas entre dois acessos pagos
  ACESSO_MAX_DIA: 3,     // quantas entradas pagam por dia (manhã/tarde/noite)
  // bônus avulsos, pagos uma única vez por aluno. A chave é o bonusId que o
  // portal manda; id fora desta lista não paga nada (a rota é pública).
  BONUS: { 'tour-portal': 30 },
  // bônus extra nos marcos da sequência (dias seguidos → F$)
  MARCOS: { 3: 10, 5: 15, 7: 25, 14: 40, 30: 100 },
  // 1 = dias estritamente consecutivos. Suba para 2/3 se quiser tolerar
  // fim de semana / aluno que só usa nos dias de aula.
  STREAK_TOLERANCIA_DIAS: 1,
  TETO_DIARIO: 300,
  EXTRATO_MAX: 20
};

/* Catálogo de conquistas (ids estáveis — o portal tem o mesmo catálogo
   com nome/emoji/descrição). As regras rodam aqui no servidor. */
var FD_BADGES = ['primeiro-filme', 'nota-100', 'seq-3', 'seq-7', 'seq-30',
                 'fs-500', 'fs-2000', 'maratona-5', 'persistente'];

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

function fdHoje_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/** Soma creditada HOJE (para o teto diário). O extrato é cronológico. */
function fdGanhoHoje_(raf) {
  var ext = fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo']);
  var evals = ext.getDataRange().getValues();
  var d0 = new Date(); d0.setHours(0, 0, 0, 0);
  var hoje = 0;
  for (var j = evals.length - 1; j >= 1; j--) {
    if (new Date(evals[j][0]) < d0) break;
    if (String(evals[j][1]).trim() === raf) hoje += Number(evals[j][5]) || 0;
  }
  return hoje;
}

/**
 * Escreve um crédito (aplica teto diário) e devolve {credito, saldo}.
 * ignoraTeto: só para bônus pagos uma vez na vida, que não dá para farmar e
 * que o aluno perderia para sempre se caíssem num dia de teto cheio.
 */
function fdCredita_(raf, atividade, tipo, detalhe, valor, ignoraTeto) {
  valor = Math.max(0, Math.round(Number(valor) || 0));
  var hoje = ignoraTeto ? 0 : fdGanhoHoje_(raf);
  if (!ignoraTeto && valor > 0 && hoje + valor > FD.TETO_DIARIO) {
    valor = Math.max(0, FD.TETO_DIARIO - hoje);
    detalhe = (detalhe ? detalhe + ' · ' : '') + 'teto diário aplicado';
  }
  var cart = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']);
  var cvals = cart.getDataRange().getValues();
  var crow = -1, saldo = 0;
  for (var k = 1; k < cvals.length; k++) {
    if (String(cvals[k][0]).trim() === raf) { crow = k + 1; saldo = Number(cvals[k][1]) || 0; break; }
  }
  saldo += valor;
  if (crow < 0) cart.appendRow([raf, saldo, new Date()]);
  else cart.getRange(crow, 2, 1, 2).setValues([[saldo, new Date()]]);
  if (valor > 0) {
    fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo'])
      .appendRow([new Date(), raf, atividade, tipo, detalhe, valor, saldo]);
  }
  return { credito: valor, saldo: saldo };
}

/** Streak atual registrada (sem alterar nada). */
function fdStreakDe_(raf) {
  var sh = fdSheet_('_streak', ['RAF', 'Dias', 'Recorde', 'UltimoDia']);
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === raf) {
      return { dias: Number(vals[i][1]) || 0, recorde: Number(vals[i][2]) || 0, ultimo: String(vals[i][3] || '') };
    }
  }
  return { dias: 0, recorde: 0, ultimo: '' };
}

/**
 * Bônus por entrar no portal — o "pouquinho" que o aluno leva só por aparecer.
 * Paga FD.ACESSO no máximo FD.ACESSO_MAX_DIA vezes ao dia, exigindo
 * FD.ACESSO_INTERVALO_H horas entre uma entrada paga e a seguinte: o que
 * queremos premiar é voltar ao portal, não clicar em sair e entrar de novo.
 * Roda dentro do lock do check-in — não chamar por fora sem lock.
 */
function fdAcesso_(raf, hoje) {
  var sh = fdSheet_('_acessos', ['RAF', 'Dia', 'VezesHoje', 'Ultimo']);
  var vals = sh.getDataRange().getValues();
  var row = -1, dia = '', vezes = 0, ultimo = 0;
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === raf) {
      row = i + 1;
      dia = String(vals[i][1] || '');
      vezes = Number(vals[i][2]) || 0;
      ultimo = vals[i][3] ? new Date(vals[i][3]).getTime() : 0;
      break;
    }
  }
  if (dia !== hoje) vezes = 0;            // virou o dia → a contagem recomeça
  if (vezes >= FD.ACESSO_MAX_DIA) return { credito: 0, vezes: vezes };
  var agora = new Date();
  if (ultimo && (agora.getTime() - ultimo) < FD.ACESSO_INTERVALO_H * 36e5) {
    return { credito: 0, vezes: vezes };  // ainda dentro do intervalo
  }
  var r = fdCredita_(raf, 'acesso:' + hoje, 'acesso',
    'entrada no portal (' + (vezes + 1) + 'ª de ' + FD.ACESSO_MAX_DIA + ' hoje)', FD.ACESSO);
  // se o teto diário comeu o crédito, não gasta a vez nem começa o intervalo
  if (r.credito <= 0) return { credito: 0, vezes: vezes };
  vezes++;
  if (row < 0) sh.appendRow([raf, hoje, vezes, agora]);
  else sh.getRange(row, 2, 1, 3).setValues([[hoje, vezes, agora]]);
  return { credito: r.credito, vezes: vezes };
}

/** Conquistas do aluno + avaliação de novas (grava as que desbloqueou). */
function fdAvaliaBadges_(raf) {
  var sh = fdSheet_('_conquistas', ['RAF', 'Badge', 'Quando']);
  var vals = sh.getDataRange().getValues();
  var tem = {};
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === raf) tem[String(vals[i][1])] = true;
  }
  // dados para as regras
  var prog = fdSheet_('_progresso', ['RAF', 'Atividade', 'MelhorPct', 'BasePaga']).getDataRange().getValues();
  var atividades = 0, tem100 = false, temFilme = false;
  for (var p = 1; p < prog.length; p++) {
    if (String(prog[p][0]).trim() !== raf) continue;
    atividades++;
    if (Number(prog[p][2]) >= 100) tem100 = true;
    if (String(prog[p][1]).indexOf('mp:') === 0) temFilme = true;
  }
  var ext = fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo']).getDataRange().getValues();
  var ganhoVida = 0, temMelhora = false;
  for (var e = 1; e < ext.length; e++) {
    if (String(ext[e][1]).trim() !== raf) continue;
    ganhoVida += Number(ext[e][5]) || 0;
    if (String(ext[e][3]) === 'melhora') temMelhora = true;
  }
  var streak = fdStreakDe_(raf);
  var regras = {
    'primeiro-filme': temFilme,
    'nota-100': tem100,
    'seq-3': streak.dias >= 3 || streak.recorde >= 3,
    'seq-7': streak.dias >= 7 || streak.recorde >= 7,
    'seq-30': streak.dias >= 30 || streak.recorde >= 30,
    'fs-500': ganhoVida >= 500,
    'fs-2000': ganhoVida >= 2000,
    'maratona-5': atividades >= 5,
    'persistente': temMelhora
  };
  var todas = [], novas = [];
  for (var b = 0; b < FD_BADGES.length; b++) {
    var id = FD_BADGES[b];
    if (tem[id]) { todas.push(id); continue; }
    if (regras[id]) { sh.appendRow([raf, id, new Date()]); todas.push(id); novas.push(id); }
  }
  return { todas: todas, novas: novas };
}

/** Saldo + extrato + streak + conquistas (alimenta o dashboard da home). */
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
  var streak = fdStreakDe_(raf);
  // se o último acesso ficou para trás, a sequência exibida zera
  if (streak.ultimo && streak.ultimo !== fdHoje_()) {
    var dif = Math.round((new Date(fdHoje_()) - new Date(streak.ultimo)) / 864e5);
    if (dif > FD.STREAK_TOLERANCIA_DIAS) streak.dias = 0;
  }
  var badges = fdAvaliaBadges_(raf);
  return { ok: true, saldo: saldo, extrato: linhas, streak: { dias: streak.dias, recorde: streak.recorde }, badges: badges.todas };
}

/**
 * Check-in diário: mantém a sequência e paga o bônus do dia. Idempotente.
 * Paga também o bônus de acesso, que pode cair em entradas seguintes do
 * mesmo dia — por isso o portal chama isto em TODA entrada, não só na 1ª.
 */
function fdCheckin_(raf) {
  raf = String(raf || '').trim();
  if (!raf) return { ok: false, error: 'RAF vazio' };
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = fdSheet_('_streak', ['RAF', 'Dias', 'Recorde', 'UltimoDia']);
    var vals = sh.getDataRange().getValues();
    var row = -1, dias = 0, recorde = 0, ultimo = '';
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0]).trim() === raf) {
        row = i + 1; dias = Number(vals[i][1]) || 0; recorde = Number(vals[i][2]) || 0; ultimo = String(vals[i][3] || '');
        break;
      }
    }
    var hoje = fdHoje_();
    var credito = 0, detalhe = '';
    if (ultimo !== hoje) {
      var dif = ultimo ? Math.round((new Date(hoje) - new Date(ultimo)) / 864e5) : 999;
      dias = (dif <= FD.STREAK_TOLERANCIA_DIAS) ? dias + 1 : 1;
      recorde = Math.max(recorde, dias);
      if (row < 0) sh.appendRow([raf, dias, recorde, hoje]);
      else sh.getRange(row, 2, 1, 3).setValues([[dias, recorde, hoje]]);
      credito = FD.CHECKIN + (FD.MARCOS[dias] || 0);
      detalhe = 'check-in · sequência de ' + dias + (FD.MARCOS[dias] ? ' 🔥 marco +' + FD.MARCOS[dias] : '');
      var r = fdCredita_(raf, 'checkin:' + hoje, 'check-in', detalhe, credito);
      credito = r.credito;
    }
    var acesso = fdAcesso_(raf, hoje);
    var badges = fdAvaliaBadges_(raf);
    var cart = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']);
    var cvals = cart.getDataRange().getValues();
    var saldo = 0;
    for (var k = 1; k < cvals.length; k++) {
      if (String(cvals[k][0]).trim() === raf) { saldo = Number(cvals[k][1]) || 0; break; }
    }
    return { ok: true, credito: credito, acesso: acesso, saldo: saldo, streak: { dias: dias, recorde: recorde }, badges: badges.todas, novasBadges: badges.novas };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Bônus avulso, pago uma única vez por aluno (dedupe por RAF + bonusId).
 * Hoje só o 'tour-portal' (boas-vindas por concluir o tour da home), mas serve
 * para qualquer bônus pontual que a gente queira lançar depois.
 * Devolve {ok, credito, saldo} — credito 0 quando já havia sido pago.
 */
function fdBonus_(raf, bonusId) {
  raf = String(raf || '').trim();
  bonusId = String(bonusId || '').trim();
  if (!raf || !bonusId) return { ok: false, error: 'dados incompletos' };
  var valor = FD.BONUS[bonusId];
  // id desconhecido não paga: qualquer um pode chamar esta rota
  if (!valor) return { ok: false, error: 'bônus desconhecido' };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = fdSheet_('_bonus', ['RAF', 'BonusId', 'Quando']);
    var vals = sh.getDataRange().getValues();
    var saldo = 0, i;
    for (i = 1; i < vals.length; i++) {
      if (String(vals[i][0]).trim() === raf && String(vals[i][1]).trim() === bonusId) {
        // já pago: devolve o saldo atual, sem creditar de novo
        var cart = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']).getDataRange().getValues();
        for (var k = 1; k < cart.length; k++) {
          if (String(cart[k][0]).trim() === raf) { saldo = Number(cart[k][1]) || 0; break; }
        }
        return { ok: true, credito: 0, saldo: saldo };
      }
    }
    // fora do teto diário de propósito: é uma vez na vida, não dá para farmar,
    // e cair num dia de teto cheio faria o aluno perder o bônus para sempre
    var r = fdCredita_(raf, 'bonus:' + bonusId, 'bônus', 'bônus avulso · ' + bonusId, valor, true);
    sh.appendRow([raf, bonusId, new Date()]);
    var badges = fdAvaliaBadges_(raf);
    return { ok: true, credito: r.credito, saldo: r.saldo, novasBadges: badges.novas };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Credita uma atividade corrigida. Idempotente:
 *  · base paga só na 1ª vez; reenvio igual não paga; nota maior paga a melhora.
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
    var credito = 0, detalhe = [], tipo = 'atividade';
    if (!basePaga) {
      credito = total * FD.PARTICIPACAO + correct * FD.ACERTO + FD.CONCLUSAO;
      detalhe.push('participação ' + (total * FD.PARTICIPACAO) + ' · acertos ' + (correct * FD.ACERTO) + ' · conclusão ' + FD.CONCLUSAO);
    } else if (pct > melhorPct) {
      credito = (pct - melhorPct) * FD.MELHORA_POR_PP;
      tipo = 'melhora';
      detalhe.push('melhora de ' + melhorPct + '% para ' + pct + '%');
    }
    var novoMelhor = Math.max(melhorPct, pct);
    if (prow < 0) prog.appendRow([raf, activityId, novoMelhor, 'sim']);
    else prog.getRange(prow, 3, 1, 2).setValues([[novoMelhor, 'sim']]);

    var r = { credito: 0, saldo: 0 };
    r = fdCredita_(raf, activityId, tipo, detalhe.join(' · '), credito);
    var badges = fdAvaliaBadges_(raf);
    return { ok: true, credito: r.credito, saldo: r.saldo, detalhe: detalhe.join(' · '), novasBadges: badges.novas };
  } finally {
    lock.releaseLock();
  }
}
