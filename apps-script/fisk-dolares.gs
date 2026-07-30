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
 * Planilhas (criadas automaticamente na primeira execução):
 *   _carteira   → RAF | Saldo | Atualizado
 *   _extrato    → Quando | RAF | Atividade | Tipo | Detalhe | Valor | Saldo
 *   _progresso  → RAF | Atividade | MelhorPct | BasePaga
 *   _streak     → RAF | Dias | Recorde | UltimoDia
 *   _conquistas → RAF | Badge | Quando
 *
 * ── INTEGRAÇÃO (fisk-hub-backend) ────────────────────────────────────────
 * 1. Cole este arquivo no projeto do Apps Script.
 * 2. No roteador do doGet:
 *      if (action === 'wallet') return fdJson_(fdWallet_(String(p.raf || '')));
 * 3. No doPost:
 *      if (body.action === 'fdEarn')    return fdJson_(fdEarn_(String(body.raf || ''), String(body.activityId || ''), Number(body.correct || 0), Number(body.total || 0)));
 *      if (body.action === 'fdCheckin') return fdJson_(fdCheckin_(String(body.raf || '')));
 * 4. ONDE O RESULTADO DE QP/MET É SALVO (após validar appKey):
 *      var fd = null;
 *      if (body.data && body.data.raf && body.data.q) {
 *        fd = fdEarn_(body.data.raf, body.tool + ':' + (body.data.s || ''), Number(body.data.c || 0), Number(body.data.q || 0));
 *      }
 *      // ...inclua `fd: fd` no JSON que essa rota já devolve.
 * 5. PAINEL DA DIREÇÃO (carteiras): as três rotas abaixo mexem no saldo dos
 *    alunos, então TÊM de ficar atrás da sessão de diretor. Cole no doPost,
 *    trocando `dirCheck_` pelo validador de sessão que este backend já usa
 *    na rota 'dirCheck' — o texto "Sessão" no erro é o que faz o painel
 *    deslogar sozinho quando o token vence:
 *
 *      if (body.action === 'dirFdSaldos' || body.action === 'dirFdSet' ||
 *          body.action === 'dirFdReset'  || body.action === 'dirFdResetTudo') {
 *        var dir = dirCheck_(String(body.token || ''));
 *        if (!dir || !dir.ok) return fdJson_({ ok: false, error: 'Sessão expirada — entre de novo.' });
 *        if (body.action === 'dirFdSaldos')    return fdJson_(fdDirSaldos_());
 *        if (body.action === 'dirFdSet')       return fdJson_(fdDirSet_(String(body.raf || ''), body.saldo, String(body.motivo || '')));
 *        if (body.action === 'dirFdReset')     return fdJson_(fdDirReset_(String(body.raf || '')));
 *        if (body.action === 'dirFdResetTudo') return fdJson_(fdDirResetTudo_());
 *      }
 *
 * 6. Nova implantação do Web App (EDITAR a implantação existente, para a URL
 *    não mudar — nunca criar outra).
 */

var FD = {
  PARTICIPACAO: 2,       // por questão respondida
  ACERTO: 8,             // adicional por questão correta
  CONCLUSAO: 30,         // primeira vez que fecha a atividade
  MELHORA_POR_PP: 1,     // por ponto percentual de melhora ao refazer
  CHECKIN: 5,            // check-in diário
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

/** Soma creditada HOJE (para o teto diário). O extrato é cronológico.
 *  Ajustes da direção ficam de fora: o teto mede o que o ALUNO ganhou no dia,
 *  e um ajuste negativo não pode virar "crédito sobrando" para ele. */
function fdGanhoHoje_(raf) {
  var ext = fdSheet_('_extrato', ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo']);
  var evals = ext.getDataRange().getValues();
  var d0 = new Date(); d0.setHours(0, 0, 0, 0);
  var hoje = 0;
  for (var j = evals.length - 1; j >= 1; j--) {
    if (new Date(evals[j][0]) < d0) break;
    if (String(evals[j][3]) === 'ajuste') continue;
    if (String(evals[j][1]).trim() === raf) hoje += Number(evals[j][5]) || 0;
  }
  return hoje;
}

/** Escreve um crédito (aplica teto diário) e devolve {credito, saldo}. */
function fdCredita_(raf, atividade, tipo, detalhe, valor) {
  valor = Math.max(0, Math.round(Number(valor) || 0));
  var hoje = fdGanhoHoje_(raf);
  if (valor > 0 && hoje + valor > FD.TETO_DIARIO) {
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

/** Check-in diário: mantém a sequência e paga o bônus do dia. Idempotente. */
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
    var badges = fdAvaliaBadges_(raf);
    var cart = fdSheet_('_carteira', ['RAF', 'Saldo', 'Atualizado']);
    var cvals = cart.getDataRange().getValues();
    var saldo = 0;
    for (var k = 1; k < cvals.length; k++) {
      if (String(cvals[k][0]).trim() === raf) { saldo = Number(cvals[k][1]) || 0; break; }
    }
    return { ok: true, credito: credito, saldo: saldo, streak: { dias: dias, recorde: recorde }, badges: badges.todas, novasBadges: badges.novas };
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

/* ═══════════════════════════════════════════════════════════════════════════
   PAINEL DA DIREÇÃO — manutenção das carteiras

   Para que serve: durante os testes do portal a direção entra com o RAF de
   alunos reais, e o que ela ganha testando fica no nome do aluno. Antes de
   começar o semestre isso precisa sair.

   Zerar o SALDO não basta. A aba _progresso guarda "BasePaga = sim" por
   atividade, e é ela que impede pagar a mesma atividade duas vezes. Se só o
   saldo for zerado, o aluno faz a atividade de verdade no primeiro dia de
   aula e não recebe nada — a base já consta como paga pelo teste. Por isso
   fdDirReset_ apaga as CINCO abas do aluno (carteira, extrato, progresso,
   streak e conquistas): ele volta a ser um aluno que nunca usou o portal.

   Ajuste de saldo (fdDirSet_) é outra coisa: mexe só no número, mantém o
   histórico e deixa a linha do ajuste no extrato, para a conta fechar depois.
   ═══════════════════════════════════════════════════════════════════════════ */

var FD_ABAS = [
  { nome: '_carteira',   cab: ['RAF', 'Saldo', 'Atualizado'],                                        col: 0 },
  { nome: '_extrato',    cab: ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo'],   col: 1 },
  { nome: '_progresso',  cab: ['RAF', 'Atividade', 'MelhorPct', 'BasePaga'],                         col: 0 },
  { nome: '_streak',     cab: ['RAF', 'Dias', 'Recorde', 'UltimoDia'],                               col: 0 },
  { nome: '_conquistas', cab: ['RAF', 'Badge', 'Quando'],                                            col: 0 }
];

/** Apaga, de baixo para cima, as linhas de um RAF numa aba. Devolve quantas. */
function fdApagaLinhas_(aba, raf) {
  var sh = fdSheet_(aba.nome, aba.cab);
  var vals = sh.getDataRange().getValues();
  var n = 0;
  for (var i = vals.length - 1; i >= 1; i--) {
    if (String(vals[i][aba.col]).trim() === raf) { sh.deleteRow(i + 1); n++; }
  }
  return n;
}

/** Uma linha por aluno com carteira: saldo + o tamanho do rastro dos testes. */
function fdDirSaldos_() {
  var carteira = fdSheet_('_carteira', FD_ABAS[0].cab).getDataRange().getValues();
  var mapa = {}, ordem = [];
  for (var i = 1; i < carteira.length; i++) {
    var raf = String(carteira[i][0]).trim();
    if (!raf) continue;
    if (!mapa[raf]) { mapa[raf] = { raf: raf, saldo: 0, atualizado: null, eventos: 0, atividades: 0, badges: 0, dias: 0, recorde: 0 }; ordem.push(raf); }
    mapa[raf].saldo = Number(carteira[i][1]) || 0;
    mapa[raf].atualizado = carteira[i][2] ? new Date(carteira[i][2]).getTime() : null;
  }
  function conta(aba, campo) {
    var vals = fdSheet_(aba.nome, aba.cab).getDataRange().getValues();
    for (var j = 1; j < vals.length; j++) {
      var r = String(vals[j][aba.col]).trim();
      if (!r) continue;
      if (!mapa[r]) { mapa[r] = { raf: r, saldo: 0, atualizado: null, eventos: 0, atividades: 0, badges: 0, dias: 0, recorde: 0 }; ordem.push(r); }
      mapa[r][campo]++;
    }
  }
  conta(FD_ABAS[1], 'eventos');
  conta(FD_ABAS[2], 'atividades');
  conta(FD_ABAS[4], 'badges');

  var streak = fdSheet_('_streak', FD_ABAS[3].cab).getDataRange().getValues();
  for (var s = 1; s < streak.length; s++) {
    var rs = String(streak[s][0]).trim();
    if (mapa[rs]) { mapa[rs].dias = Number(streak[s][1]) || 0; mapa[rs].recorde = Number(streak[s][2]) || 0; }
  }
  var lista = ordem.map(function (r) { return mapa[r]; })
                   .sort(function (a, b) { return b.saldo - a.saldo; });
  return { ok: true, carteiras: lista, total: lista.length };
}

/** Define o saldo exato de um aluno, deixando o ajuste registrado no extrato. */
function fdDirSet_(raf, saldo, motivo) {
  raf = String(raf || '').trim();
  var novo = Math.round(Number(saldo));
  if (!raf) return { ok: false, error: 'Informe o RAF do aluno.' };
  if (!isFinite(novo) || novo < 0) return { ok: false, error: 'Saldo inválido — use um número igual ou maior que zero.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var cart = fdSheet_('_carteira', FD_ABAS[0].cab);
    var vals = cart.getDataRange().getValues();
    var row = -1, antes = 0;
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0]).trim() === raf) { row = i + 1; antes = Number(vals[i][1]) || 0; break; }
    }
    if (row < 0) cart.appendRow([raf, novo, new Date()]);
    else cart.getRange(row, 2, 1, 2).setValues([[novo, new Date()]]);

    var delta = novo - antes;
    if (delta !== 0) {
      fdSheet_('_extrato', FD_ABAS[1].cab)
        .appendRow([new Date(), raf, 'ajuste-direcao', 'ajuste',
                    (motivo || 'ajuste manual da direção') + ' · de F$ ' + antes + ' para F$ ' + novo,
                    delta, novo]);
    }
    return { ok: true, raf: raf, antes: antes, saldo: novo, delta: delta };
  } finally {
    lock.releaseLock();
  }
}

/** Apaga TUDO de um aluno nas cinco abas — ele volta a nunca ter usado. */
function fdDirReset_(raf) {
  raf = String(raf || '').trim();
  if (!raf) return { ok: false, error: 'Informe o RAF do aluno.' };
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var apagadas = {};
    for (var i = 0; i < FD_ABAS.length; i++) {
      apagadas[FD_ABAS[i].nome] = fdApagaLinhas_(FD_ABAS[i], raf);
    }
    return { ok: true, raf: raf, apagadas: apagadas };
  } finally {
    lock.releaseLock();
  }
}

/** Zera a economia inteira: esvazia as cinco abas, preservando o cabeçalho. */
function fdDirResetTudo_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var apagadas = {}, alunos = {};
    for (var i = 0; i < FD_ABAS.length; i++) {
      var aba = FD_ABAS[i];
      var sh = fdSheet_(aba.nome, aba.cab);
      var vals = sh.getDataRange().getValues();
      for (var j = 1; j < vals.length; j++) {
        var r = String(vals[j][aba.col]).trim();
        if (r) alunos[r] = 1;
      }
      var n = sh.getLastRow() - 1;
      if (n > 0) sh.deleteRows(2, n);
      apagadas[aba.nome] = Math.max(0, n);
    }
    return { ok: true, apagadas: apagadas, alunos: Object.keys(alunos).length };
  } finally {
    lock.releaseLock();
  }
}
