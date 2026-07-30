# Refresh da sessão: aplicar a atualização no Apps Script e publicar o painel de carteiras

Continuando o trabalho no **Fisk Hub / Portal do Aluno** (repos `Pedro-Fisk/fisk-hub` e
`Pedro-Fisk/portal-aluno-fisk`). Objetivo desta sessão: **editar e implantar o Apps Script
pelo Chrome** e depois **publicar o painel de carteiras em produção**.

Este handoff é autossuficiente: o código a colar está inteiro aqui dentro. A sessão anterior
rodou no Claude Code **na web** (container remoto, sem acesso ao Chrome do Pedro) — foi
exatamente esse o bloqueio que motivou passar para a máquina local.

> **O Pedro não quer instruções, quer a coisa feita.** Ele já pediu duas vezes para o
> Claude executar. Dirija o Chrome e execute; só peça ajuda se algo travar de verdade.

---

## Estado atual

**O que já está em produção** (`portal-aluno-fisk.vercel.app`, commit `df424aa` no `main`):
melhorias do Painel da Direção — cards quadrados no celular, Conversation Maker colapsável,
Acessos dos Alunos só com busca, e os Indicadores do Card com painéis colapsáveis e a opção
"Caçapava + Taubaté (somadas)".

**O que está pronto mas NÃO no ar** — dois repos, mesma branch `claude/portal-direcao-improvements-9gn5n5`:

| Repo | Commits fora do main | Conteúdo |
|---|---|---|
| `portal-aluno-fisk` | `2851485` | painel "💵 Fisk Dólares · Carteiras" no `diretor.html` |
| `fisk-hub` | `766435a`, `896a615`, `2387ac5` | o bloco `.gs` do painel + histórico |

O `main` do `fisk-hub` está em `1899242`. O do `portal-aluno-fisk` em `df424aa`.

**Por que o front-end ainda não foi publicado:** ele chama quatro rotas (`dirFdSaldos`,
`dirFdSet`, `dirFdReset`, `dirFdResetTudo`) que ainda não existem no Apps Script implantado.
Publicar antes do deploy faria o painel aparecer dando erro. **Ordem obrigatória: Apps Script
primeiro, front-end depois.**

**Descoberta importante da sessão anterior:** o `Code.gs` que roda em produção está **à frente**
da cópia versionada em `fisk-hub/apps-script/fisk-dolares.gs`. O arquivo real já tem
`fdDiaStr_`, `fdPurgeRaf_`, `fdAcesso_`, `fdPenalidade_`, `fdBonus_` e cinco conquistas novas —
nada disso está no repo. Por isso a mudança vai como **bloco aditivo**, nunca substituindo o arquivo.

---

## Próximos passos

### 1. Apps Script — colar o bloco e implantar (é o que trava tudo)

Abrir no Chrome, **conta `/u/1`** (é a conta em que o projeto está):

```
https://script.google.com/u/1/home/projects/1AlWF9j-indNvmh_A3Jk9k28mCC3uhF8eP_dj7C74BzX1wauT3b1VGFTm/edit
```

Alternativa, se esse link não abrir: a planilha dona do script é
`https://docs.google.com/spreadsheets/d/1mUm_7FqDbDZ0m7u_aFzulltLSYWanb1Cvv6j6QRuq24/edit`
→ menu **Extensões → Apps Script**.

⚠️ Existem **quatro** planilhas chamadas "Fisk Hub — Dados" no Drive dele. Três estão vazias
(1 KB, paradas desde 23/07). A de verdade é a do ID acima — 19 KB, abas `_carteira` e
`_extrato` preenchidas. Não procure pelo nome.

O projeto tem **um único arquivo, `Code.gs`** (~1.400 linhas). Não existe arquivo
`fisk-dolares` separado.

**1a.** Com o `Code.gs` aberto: cursor no fim do arquivo (**Ctrl+End**), Enter, e colar
o bloco inteiro da seção "Código para colar" abaixo. Ele é aditivo — não redefine nada.

**1b.** **Ctrl+F** → `fdBonus`. Existe exatamente uma linha:

```js
    if (req.action === 'fdBonus')   return fdJson_(fdBonus_(String(req.raf || ''), String(req.bonusId || '')));
```

Selecionar essa linha inteira e colar estas duas no lugar (a primeira é idêntica; a segunda é nova):

```js
    if (req.action === 'fdBonus')   return fdJson_(fdBonus_(String(req.raf || ''), String(req.bonusId || '')));
    if (req.action && req.action.indexOf('dirFd') === 0) return dirGuard(req, fdDirRota_);
```

É uma linha só porque as quatro rotas começam com `dirFd`, e o `dirGuard` (token de diretor,
6h, já existente) é o mesmo guarda das outras ações do painel.

**1c.** **Ctrl+S**. Depois: **Implantar → Gerenciar implantações → ícone de lápis →
Versão: Nova versão → Implantar**.
**Nunca** usar "Nova implantação" — isso troca a URL do Web App e derruba Hub, Portal e Painel.

A URL correta tem de continuar sendo:
`https://script.google.com/macros/s/AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1/exec`

**Efeito colateral bem-vindo:** essa implantação também ativa a correção do check-in que já
estava salva no editor mas nunca foi para o ar (ver "Contexto" abaixo).

### 2. Publicar o front-end

Nos dois repos, fazer merge da branch no `main` e push. Se os repos não estiverem clonados na
máquina local:

```bash
git clone https://github.com/Pedro-Fisk/portal-aluno-fisk.git
git clone https://github.com/Pedro-Fisk/fisk-hub.git
```

Em cada um:

```bash
git fetch origin
git checkout main && git pull
git merge --ff-only origin/claude/portal-direcao-improvements-9gn5n5
git push origin main
```

O `portal-aluno-fisk` é o que importa para o site (Vercel publica o `main` em ~1 min).
O `fisk-hub` é GitHub Pages e só carrega documentação/código-fonte do `.gs` — pode ir junto.

**Verificar de verdade** (não confiar no painel do Vercel):

```bash
curl -s https://portal-aluno-fisk.vercel.app/diretor.html | grep -c "Fisk Dólares · Carteiras"
```

Tem de devolver `1`.

### 3. Zerar os alunos dos testes

Entrar em `https://portal-aluno-fisk.vercel.app/diretor.html` (senha da direção, a mesma do
Fisk Hub), abrir o card **💵 Fisk Dólares · Carteiras** e usar **🧹 Zerar** nas quatro linhas
da tabela "Quem zerar" abaixo.

Não é preciso usar o "Zerar TODAS as carteiras" — são só quatro.

---

## Contexto: o problema que isso resolve

O Pedro testou o Portal do Aluno **entrando com o RAF de alunos reais**. O que ele ganhou
testando ficou registrado no nome desses alunos. As aulas vão começar e isso precisa sair.

**Zerar só o saldo não resolve — este é o ponto central.** A aba `_progresso` guarda
`BasePaga = sim` por atividade, e é ela que impede pagar a mesma atividade duas vezes.
Se só o número fosse zerado, o aluno faria a atividade de verdade no primeiro dia de aula e
**não receberia nada**, porque a base já consta como paga pelo teste. Por isso "Zerar" apaga
as **cinco** abas do aluno (`_carteira`, `_extrato`, `_progresso`, `_streak`, `_conquistas`) —
ele volta a ser um aluno que nunca usou o portal.

**Bug do check-in (já corrigido, mas não implantado).** O extrato mostra o mesmo aluno
recebendo check-in nove vezes em 28/07, com a sequência subindo a cada acesso — um chegou a
"sequência de 16" em três dias, levando junto os bônus de marco (+10/+15/+25/+40). Causa: o
Sheets converte a string `'2026-07-28'` gravada em `UltimoDia` numa data de verdade, e na
leitura seguinte `String(Date)` nunca é igual a `'2026-07-28'`, então `ultimo !== hoje` dava
sempre verdadeiro. O `Code.gs` **já tem** a correção (`fdDiaStr_`), ela só nunca foi
implantada — a implantação do passo 1 resolve. **Não "corrija" isso de novo.**

---

## Tabelas

### Quem zerar (estado da aba `_carteira` em 30/07/2026)

| RAF | Aluno | Turma | Saldo F$ | Rastro |
|---|---|---|---|---|
| `QA-TESTE` | — não é aluno, RAF de teste | — | 229 | 4 lançamentos, 2 atividades pagas, 2 conquistas |
| `Z048-129` | Ana Clara Gonçalves Andrade de Assis | INTERMEDIATE 4ª 15h–17h30 · Transitions 1 | 349 | 10 lançamentos, **2 atividades pagas**, 2 conquistas |
| `Z086-450` | Joaquim Fialho Guimarães | Básico (-18) 4ª 08h30–11h | 170 | 16 lançamentos (só check-in), 3 conquistas |
| `B025-255` | Guilherme Borges De Souza Neri | INTERMEDIATE 2ª/4ª 17h30–18h45 · Transitions 1 | 10 | 2 lançamentos (check-in) |

**A Ana Clara é a mais importante:** tem `sp:transitions-1:everlong` e
`qp:Transitions 1 · Midterm` marcadas como pagas na `_progresso`. É justamente ela que
ficaria sem receber ao fazer essas duas de verdade.

### Plano B — se o Apps Script travar

O `fdPurgeRaf_` já está implantado, mas atrás da `TEACHER_KEY`, fora do alcance do painel.
Sem deploy nenhum, dá para resolver **na mão na planilha**: apagar as linhas desses quatro
RAFs nas cinco abas (`_carteira` 4 linhas, `_extrato` ~32, `_progresso` 4, `_streak` 4,
`_conquistas` 7). É literalmente o que o código faria. O passo 1 continua valendo depois,
para o Pedro ter o botão nas próximas vezes.

---

## Código para colar no fim do `Code.gs`

Também versionado em `fisk-hub/apps-script/painel-direcao-carteiras.gs`, na branch
`claude/portal-direcao-improvements-9gn5n5`.

```js
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
```

---

## Preferências e convenções

- **Idioma:** tudo em português do Brasil — conversa, commits, comentários de código, textos de interface.
- **Comentários no código** explicam *por quê*, não *o quê*. Registram a decisão e o que
  daria errado sem ela. É o padrão em todo o projeto; siga-o.
- **Commits** em português, com corpo explicando a motivação. Rodapé:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- **Branch de trabalho:** `claude/portal-direcao-improvements-9gn5n5` nos dois repos.
- **Não abrir PR** a menos que o Pedro peça. Ele prefere merge direto no `main`.
- **Verificar de verdade.** Ele valoriza checagem factual (baixar a página publicada e
  procurar a marca, rodar teste com planilha simulada) em vez de "deve estar funcionando".
- **Apps Script:** sempre **editar a implantação existente** → Nova versão. Criar implantação
  nova troca a URL e quebra tudo.
- O Pedro não é programador. Explique em português claro, sem jargão, e prefira **fazer** a
  instruir.

## Evite repetir

- **Não colar o bloco por cima do `Code.gs`.** O `Code.gs` é o backend inteiro (`doPost`,
  `login`, `dirLogin`, salvamento no Drive, Conversation Maker, créditos…). Substituí-lo pelo
  módulo da carteira derruba Hub e Portal. O bloco vai **no fim**, aditivo.
- **Não "corrigir" o check-in.** A correção (`fdDiaStr_`) já está no `Code.gs`; só falta
  implantar. A cópia em `fisk-hub/apps-script/fisk-dolares.gs` está desatualizada e induziu
  esse erro na sessão anterior.
- **Não criar `fdDirReset_`.** O `fdPurgeRaf_` já existe no `Code.gs` e faz exatamente isso;
  o roteador o reaproveita.
- **Não usar "Nova implantação"** no menu Implantar.
- **Não confiar no repo como espelho do Apps Script.** O `Code.gs` real está à frente.
  Quando terminar, vale pedir ao Pedro o `Code.gs` atualizado e commitá-lo no repo para a
  próxima sessão partir do código certo.

## Skills para rodar

- Nenhuma obrigatória. Se houver skill de controle do Chrome disponível na máquina local,
  use-a para os passos 1 e 3.
