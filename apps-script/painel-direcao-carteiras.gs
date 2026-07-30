/* ═══════════════════════════════════════════════════════════════════════════
   PAINEL DA DIREÇÃO — carteiras de Fisk Dólares
   COLAR NO FIM DO Code.gs (o arquivo principal do backend do Fisk Hub).

   Este bloco é ADITIVO: não redefine nada que já existe no Code.gs. Ele usa
   fdSheet_, fdJson_, json e fdPurgeRaf_, que já estão lá.

   Falta só UMA linha no doPost, logo depois da linha do 'fdBonus':

       if (req.action && req.action.indexOf('dirFd') === 0) return dirGuard(req, fdDirRota_);

   Uma linha só porque as quatro rotas começam com "dirFd" e o dirGuard
   (token de diretor, 6h) é o mesmo guarda das outras ações do painel.

   ── Por que "zerar" apaga tudo e não só o saldo ────────────────────────────
   A aba _progresso guarda "BasePaga = sim" por atividade, e é ela que impede
   pagar a mesma atividade duas vezes. Zerando só o saldo, a atividade que a
   direção rodou testando na conta do aluno continua marcada como paga — e o
   aluno não recebe nada ao fazê-la de verdade no primeiro dia de aula. Por
   isso o reset de um aluno reaproveita o fdPurgeRaf_, que já limpa as cinco
   abas (carteira, extrato, progresso, streak e conquistas).
   ═══════════════════════════════════════════════════════════════════════════ */

var FD_ABAS_DIR = [
  { nome: '_carteira',   cab: ['RAF', 'Saldo', 'Atualizado'],                                      col: 0 },
  { nome: '_extrato',    cab: ['Quando', 'RAF', 'Atividade', 'Tipo', 'Detalhe', 'Valor', 'Saldo'], col: 1 },
  { nome: '_progresso',  cab: ['RAF', 'Atividade', 'MelhorPct', 'BasePaga'],                       col: 0 },
  { nome: '_streak',     cab: ['RAF', 'Dias', 'Recorde', 'UltimoDia'],                             col: 0 },
  { nome: '_conquistas', cab: ['RAF', 'Badge', 'Quando'],                                          col: 0 }
];

/** Uma linha por aluno com carteira: saldo + o tamanho do rastro deixado. */
function fdDirSaldos_() {
  var mapa = {}, ordem = [];
  function garante(raf) {
    if (!mapa[raf]) {
      mapa[raf] = { raf: raf, saldo: 0, atualizado: null, eventos: 0,
                    atividades: 0, badges: 0, dias: 0, recorde: 0 };
      ordem.push(raf);
    }
    return mapa[raf];
  }
  var carteira = fdSheet_('_carteira', FD_ABAS_DIR[0].cab).getDataRange().getValues();
  for (var i = 1; i < carteira.length; i++) {
    var raf = String(carteira[i][0]).trim();
    if (!raf) continue;
    var c = garante(raf);
    c.saldo = Number(carteira[i][1]) || 0;
    c.atualizado = carteira[i][2] ? new Date(carteira[i][2]).getTime() : null;
  }
  function conta(aba, campo) {
    var vals = fdSheet_(aba.nome, aba.cab).getDataRange().getValues();
    for (var j = 1; j < vals.length; j++) {
      var r = String(vals[j][aba.col]).trim();
      if (r) garante(r)[campo]++;
    }
  }
  conta(FD_ABAS_DIR[1], 'eventos');
  conta(FD_ABAS_DIR[2], 'atividades');
  conta(FD_ABAS_DIR[4], 'badges');

  var streak = fdSheet_('_streak', FD_ABAS_DIR[3].cab).getDataRange().getValues();
  for (var s = 1; s < streak.length; s++) {
    var rs = String(streak[s][0]).trim();
    if (mapa[rs]) { mapa[rs].dias = Number(streak[s][1]) || 0; mapa[rs].recorde = Number(streak[s][2]) || 0; }
  }
  var lista = ordem.map(function (r) { return mapa[r]; })
                   .sort(function (a, b) { return b.saldo - a.saldo; });
  return { ok: true, carteiras: lista, total: lista.length };
}

/**
 * Define o saldo exato de um aluno e deixa o ajuste registrado no extrato.
 * O lançamento vai com o valor da DIFERENÇA (pode ser negativo) e tipo
 * 'ajuste' — o fdGanhoHoje_ e o fdAvaliaBadges_ já ignoram valores negativos,
 * então tirar F$ não abre espaço no teto diário nem mexe nas conquistas.
 */
function fdDirSet_(raf, saldo, motivo) {
  raf = String(raf || '').trim();
  var novo = Math.round(Number(saldo));
  if (!raf) return { ok: false, error: 'Informe o RAF do aluno.' };
  if (!isFinite(novo) || novo < 0) return { ok: false, error: 'Saldo inválido — use um número igual ou maior que zero.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var cart = fdSheet_('_carteira', FD_ABAS_DIR[0].cab);
    var vals = cart.getDataRange().getValues();
    var row = -1, antes = 0;
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0]).trim() === raf) { row = i + 1; antes = Number(vals[i][1]) || 0; break; }
    }
    if (row < 0) cart.appendRow([raf, novo, new Date()]);
    else cart.getRange(row, 2, 1, 2).setValues([[novo, new Date()]]);

    var delta = novo - antes;
    if (delta !== 0) {
      fdSheet_('_extrato', FD_ABAS_DIR[1].cab)
        .appendRow([new Date(), raf, 'ajuste-direcao', 'ajuste',
                    (motivo || 'ajuste manual da direção') + ' · de F$ ' + antes + ' para F$ ' + novo,
                    delta, novo]);
    }
    return { ok: true, raf: raf, antes: antes, saldo: novo, delta: delta };
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
    for (var i = 0; i < FD_ABAS_DIR.length; i++) {
      var aba = FD_ABAS_DIR[i];
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

/**
 * Roteador das quatro ações do painel. Chamado pelo dirGuard, ou seja, só
 * roda com token de diretor válido — o painel nunca carrega chave nenhuma.
 * O reset de um aluno reaproveita o fdPurgeRaf_ que já existia.
 */
function fdDirRota_(req) {
  var acao = String((req && req.action) || '');
  if (acao === 'dirFdSaldos')    return fdJson_(fdDirSaldos_());
  if (acao === 'dirFdSet')       return fdJson_(fdDirSet_(String(req.raf || ''), req.saldo, String(req.motivo || '')));
  if (acao === 'dirFdReset')     return fdJson_(fdPurgeRaf_(String(req.raf || '')));
  if (acao === 'dirFdResetTudo') return fdJson_(fdDirResetTudo_());
  return json({ ok: false, error: 'ação desconhecida: ' + acao });
}
