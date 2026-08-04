# Portal da Secretaria — handoff para o Davi

Escrito em **04/08/2026**. Tudo que está marcado com ✅ foi conferido contra o
sistema **no ar** nesta data. O que está marcado com ⚠️ vem de documentos mais
antigos e **não foi verificado** — trate como pista, não como fato.

> **Leia a seção "Erros conhecidos na documentação antiga" antes de seguir
> qualquer outro `.md` deste repositório.** Dois handoffs existentes contêm
> instruções que não funcionam, e um deles descreve um bug que não existe.

---

## 1. O que é, e quem entra

Portal próprio para a secretaria, servido no mesmo endereço do Portal do Aluno.
A pessoa entra com a conta que já tem na aba `_profs` — a página **não carrega
chave nenhuma**, tudo passa por um token de sessão.

✅ Quem entra é decidido por `secCargoOk_`: o cargo (normalizado, sem acento,
minúsculo) tem de **começar** com um destes — `secretaria`, `coordenacao`,
`direcao`. Além disso, quem é da direção entra sempre, independente do cargo.

✅ A sessão dura **6 horas** (`SEC_TTL = 21600`, que é o teto do `CacheService`).

---

## 2. Onde cada peça mora

**Não existe um repositório só do Portal da Secretaria**, e isso é de propósito:
os repositórios são separados por **onde cada coisa é publicada**, não por
funcionalidade. ✅

- `portal-aluno-fisk` (privado) → **Vercel** — a tela, `secretaria.html`
- **`fisk-hub-backend`** (privado) → **Apps Script via `clasp`** — o `Code.js`,
  onde as rotas `sec*` de fato rodam
- `fisk-hub` (público) → **GitHub Pages** — as ferramentas do professor

Um repositório dedicado à secretaria não funcionaria: a tela precisa ser servida
do projeto da Vercel para manter o domínio, e o backend **não pode ser dividido**
(um projeto Apps Script aceita um único `doPost`, então as rotas `sec*` moram no
mesmo arquivo que o Portal do Aluno e o Painel). Seria uma terceira cópia de
coisas publicadas de outro lugar.

> **Consolidação feita em 04/08/2026.** Antes disso o backend tinha **duas**
> fontes: o `Code.js` e cópias em `fisk-hub/apps-script/` (incluindo um
> `COLAR-NO-CODE-GS.gs` feito para colar à mão no editor). As cópias foram
> removidas. **A fonte única do backend é `fisk-hub-backend/Code.js`.**

| peça | onde | observação |
|---|---|---|
| Front-end | `portal-aluno-fisk/secretaria.html` | ✅ no ar, e o `diretor.html` já tem o link |
| Backend (código-fonte) | `fisk-hub-backend/Code.js` | ✅ repo `Pedro-Fisk/fisk-hub-backend`, publicado por `clasp` |
| Backend (onde roda) | projeto Apps Script `1AlWF9j-indNvmh_A3Jk9k28mCC3uhF8eP_dj7C74BzX1wauT3b1VGFTm` | ✅ conta **`/u/1`** — abrir com a conta errada dá "sem permissão" sem explicar |
| URL do backend | `.../macros/s/AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1/exec` | ✅ **fixa**, embutida em todas as ferramentas |
| Banco de dados | planilha `1mUm_7FqDbDZ0m7u_aFzulltLSYWanb1Cvv6j6QRuq24` ("Fisk Hub — Dados") | ✅ o Apps Script pertence a ela |
| Card Caçapava | `1PgNpyGrQ0_LXqiNUp0g_eyzZOeuUnA6S_BLEsm-uLi4` | ✅ |
| Card Taubaté | `1_P50N1Sd5q7pQkPYmms9IkJBdc6Apq1ZlGZvUNzz0SU` | ✅ |
| Drives de Planners | `1FJ8Fs677pq0tENiJ1PHLtZp8A0lmw-Gs` (Caçapava) e `1c7vuwrRpINGx-ITgvhr65yD4cwbHodt2` (Taubaté) | ⚠️ IDs não conferidos por mim |

✅ A planilha "Fisk Hub — Dados" está com acesso **Restrito** (fechado em
04/08/2026). Isso não afeta nada: o Apps Script roda como o dono, então as telas
não dependem de o usuário final ter acesso à planilha.

---

## 3. Como uma chamada funciona

Só existe **um** `doPost` no projeto (limitação do Apps Script: um projeto, um
`doPost`). O despacho é assim:

✅ No `doPost`, logo abaixo da rota do `dirLogin`, existe **uma linha** que manda
tudo que começa com `sec` + letra maiúscula para o roteador do portal:

```js
if (/^sec[A-Z]/.test(String(req.action || ''))) return secRota_(req);
```

✅ Dentro do `secRota_`:
- `secLogin` e `secCheck` passam direto (são o próprio login);
- **todo o resto** passa pelo `secGuard`, que valida o token e devolve
  `"Sessão expirada. Entre de novo."` se não houver sessão;
- ações que começam com `secPadroniza`, mais `secCardBackup` e
  `secNormalizarCard`, exigem **direção** — são as únicas que movem coluna na
  planilha da escola.

**Como testar se o backend está no ar sem ter senha de ninguém:** mande
`{action:'secTurmas', token:'qualquer'}`. Se responder *"Sessão expirada. Entre
de novo."*, o roteador está vivo. Se responder outra coisa (chave inválida, ação
desconhecida), o bloco não está implantado.

---

## 4. Rotas que existem hoje ✅

Levantadas do `secRota_`, não de documentação.

**Leitura:** `secBusca` · `secFicha` · `secTurmas` · `secFila` · `secProntidao` ·
`secProntidaoDrive` · `secAniversarios` · `secValidar` · `secBoletins` ·
`secAlertas` · `secNomesSujos` · `secFusoes` · `secAgenda` · `secSemAcesso` ·
`secAuditoria` · `secContatos`

**Escrita:** `secTransferir` · `secBaixa` · `secMatricular` ·
`secAtualizarAluno` · `secSalvarAlerta` · `secLimparNome` · `secAgendar` ·
`secAgendaSituacao` · `secFdResgate` · `secContato` · `secSalvarPdf` ·
`secDesfazer`

**Só direção:** `secPadroniza*` · `secCardBackup` · `secNormalizarCard`

### Abas próprias do portal ✅
`_secContatos` · `_secLog` · `_secAlertas` · `_secAgenda`

O `_secLog` é o log de movimentações — é o que dá suporte ao `secDesfazer`.

✅ O registro de contato também **espelha na aba `Atrasados`** do card da escola,
que já existia preenchida à mão. Se o aluno já tem linha lá, a linha é
atualizada em vez de duplicada.

---

## 5. O card, que é a parte menos óbvia

As duas escolas **não montam o card igual**. O portal contorna isso lendo as
colunas **pelo rótulo**, com dicionário de sinônimos, em vez de por posição.

✅ Estrutura real de uma aba de professor (conferida na aba `NICOLE` de Taubaté):
uma aba por professor, com blocos de turma empilhados. Num bloco, a coluna A tem
o número da turma (célula mesclada), B = `ATIVO`, C = `ALUNOS`, e daí para a
direita vêm `Status`, `Observação`, o livro e `RAF`. **Pode haver coluna
escondida no meio** — por isso a leitura é por rótulo.

✅ A coluna do livro **nem sempre se chama BOOK**: em Taubaté ela aparece como
`"Livro a ser comprado para 2º sem/26"`. O leitor cobre isso com uma regra de
prefixo (`livro a ser comprado`), e existe um fallback que usa esse valor como
estágio quando não há coluna `BOOK`.

✅ Abas que o leitor ignora: `Atrasados`, `Comercial`, `Gabarito Placeholder`,
`Sheet36`, qualquer uma que comece com `_`, e qualquer uma começando com
`CALEND`. **Atenção:** a aba `Chamada` de Taubaté **não** está nessa lista e tem
layout próprio. Eu cheguei a suspeitar que isso causava um bug — **não causa**
(ver seção 8) — mas é bom saber que ela existe.

✅ `syncRosterFromCards()` reconstrói a aba `_alunos` (RAF · Nome · Turma · Book)
lendo os dois cards. É seguro rodar: só reescreve dado derivado, o RAF vem do
card, e há uma guarda que **nunca esvazia a lista** se a leitura falhar. Leva
~14 segundos. Em 04/08/2026 devolveu **758 alunos, todos com estágio**.

---

## 6. Regras da casa — quebrar qualquer uma derruba tudo

1. **Nunca "Nova implantação".** Sempre *Implantar → Gerenciar implantações →
   lápis → Nova versão*. "Nova implantação" troca a URL do Web App e derruba
   Hub, Portal, Painel e Secretaria de uma vez.
2. **Chave nenhuma no front-end.** As páginas falam com o backend por token de
   sessão. Em 28/07/2026 uma chave vazou num repositório público; foi trocada e
   hoje vive nas Propriedades do Script.
3. **Um `doPost` só.** Endpoint novo entra neste projeto, não no `CardTools.gs`
   do card.
4. **O `Code.gs` de produção pode estar à frente do que está versionado.** Nunca
   cole o repositório por cima do editor sem conferir.
5. Commits, comentários e interface em **português**.

---

## 7. Trabalhar em paralelo sem se atropelar ⚠️ **leia isto**

O **Git não é o risco.** Ele se recusa a sobrescrever: se você publicar e o outro
tentar publicar por cima sem ter puxado, o push é rejeitado. O pior caso é um
conflito, que nunca perde trabalho.

**O risco real é o Apps Script.** É um arquivo único editado num editor web, sem
merge. Se duas pessoas estiverem com o editor aberto, quem salvar por último
apaga o trabalho do outro — **sem conflito, sem aviso, sem histórico para
recuperar**.

Combinado mínimo:

- **O backend tem dono por vez.** Uma mensagem antes de abrir o editor
  ("vou mexer no Apps Script") e outra ao terminar. Só isso elimina o risco
  principal.
- **Cada um na sua branch**, juntando na `main` por Pull Request.
- `git fetch` e `git status -sb` **antes de editar**, não só antes de publicar.
- Se a pasta local estiver na branch de outra sessão, **não troque de branch** —
  crie uma worktree (`git worktree add <tmp> origin/main -b minha-branch`).

✅ **Resolvido em 04/08/2026:** existiam dois caminhos para publicar o backend
(`clasp` a partir do `Code.js`, **e** blocos colados à mão no editor). As cópias
saíram do `fisk-hub`. Hoje há um caminho só.

---

## 7-A. ⚠️ `clasp push` apaga arquivo que só existe no ar

✅ Reconciliação feita em 04/08/2026 com `clasp pull` para uma pasta temporária.
Resultado: `Code.js`, `Gabarito.js` e `appsscript.json` são **idênticos** entre
repositório e projeto no ar (431.892 caracteres, 9.307 linhas).

**Mas o projeto no ar tinha 10 arquivos que o repositório não tinha** — o
`arrumar-pastas.js` e 9 `migracao-cacapava-*.js`, gerados por outra frente de
trabalho no mesmo dia. **`clasp push` sincroniza o projeto inteiro**: um push
teria apagado os 10, sem conflito e sem aviso. Eles foram versionados; o
repositório agora é superconjunto do que está no ar.

**A regra que fica:** antes de um `clasp push`, confira se alguém criou arquivo
direto no editor. É barato e não destrutivo:

```bash
mkdir /tmp/live && cd /tmp/live
echo '{"scriptId":"1AlWF9j-indNvmh_A3Jk9k28mCC3uhF8eP_dj7C74BzX1wauT3b1VGFTm","rootDir":""}' > .clasp.json
clasp pull
diff -rq /tmp/live <pasta-do-repo> | grep "Only in /tmp/live"
```

Se aparecer qualquer arquivo, **traga para o repositório antes de publicar**.

> **Não confie no editor do Apps Script para medir o arquivo.** Ao ler o
> conteúdo pelo editor eu obtive 5.742 linhas para um arquivo que tem 9.307 — o
> modelo estava incompleto e a leitura levou a um diagnóstico errado. Para
> comparar, use `clasp pull`.

---

## 7-B. Como o seu Claude publica

Você pode trabalhar pelo Claude e publicar sozinho. O fluxo é este:

**Front-end e qualquer coisa em Git** — nunca commitar direto na `main`:

```bash
git fetch && git status -sb          # SEMPRE antes de editar, não só antes de publicar
git checkout -b davi/nome-da-mudanca
# ... edições ...
git push -u origin davi/nome-da-mudanca
```

Depois abre um Pull Request. O Pedro vê o que mudou antes de entrar na `main`. A
Vercel publica sozinha quando a `main` recebe (leva ~1 min).

**Backend** — dois passos, e o segundo é manual de propósito:

```bash
cd fisk-hub-backend
node scripts/testes/secretaria/painel-secretaria.test.js   # antes de qualquer coisa
clasp push
```

Depois, no editor: *Implantar → Gerenciar implantações → lápis → Versão: Nova
versão → Implantar*. **Nunca "Nova implantação".**

**A regra que evita o acidente:** o backend tem **dono por vez**. Avise antes de
abrir o editor ou rodar `clasp push`, e avise ao terminar. O Git protege vocês
em tudo menos aqui — o Apps Script não tem merge, e quem salva por último apaga
o trabalho do outro sem deixar rastro.

---

## 8. Erros conhecidos na documentação antiga

Os arquivos `re-fresh-portal-secretaria.md` e `onboarding-davi.md` são úteis,
mas contêm **duas instruções erradas**, ambas confirmadas em 04/08/2026:

**8.1 — O nome do diretor.** Os dois mandam escrever
`const DIRETORES = ['PEDRO (DIREÇÃO)', 'DAVI (DIREÇÃO)']`. ✅ Isso **não
funciona**: `ehDiretor_` faz comparação **exata** (`normNome(d) ===
normNome(nome)`), e o nome cadastrado na `_profs` é simplesmente **`Davi`**. A
forma correta é:

```js
const DIRETORES = ['PEDRO (DIREÇÃO)', 'Davi'];
```

✅ Publicado em 04/08/2026 na versão **@124** (mesma URL). O Davi tem Painel da
Direção e Padronização dos cards.

> **Não dá para descobrir isso pelo login.** O `dirLogin` devolve **a mesma
> mensagem** para "não é da direção", "não existe" e "senha errada" — é proteção
> deliberada, porque a conta da direção é o alvo mais valioso. Eu interpretei
> essa mensagem como confirmação de acesso e errei. A única forma confiável é
> **ler a constante no `Code.js`**.

**8.2 — O bug do livro que não existe.** O handoff afirma que a coluna do livro
de Taubaté era lida errada e que **142 de 630 alunos** estavam sem estágio, e que
o bloco de padronização corrige isso. ✅ **Não há esse problema.** Em 04/08/2026
a `_alunos` tinha 758 alunos e **758 com estágio** — zero sem. O card está
correto e a lista gerada também. Não mexa no `CARD_ABAS_IGNORAR` por causa disso:
ignorar uma aba pode **sumir com alunos da lista** e tirar o acesso deles ao
Portal do Aluno.

---

## 9. Como entender o leitor do card sem tocar em nada

Existe um teste que roda em Node, com uma planilha sintética no formato real:

```bash
cd fisk-hub-backend
node scripts/testes/secretaria/painel-secretaria.test.js
```

✅ Em 04/08/2026: **99 asserções, todas passando**. É a forma mais rápida de
entender como o card é lido, e não toca em nada que está no ar. Rode antes de
qualquer `clasp push`.

Ele começa conferindo se as suas fixtures `.gs` ainda batem com o `Code.js`. Se
alguém mexer num e esquecer do outro, o teste **para e avisa**, em vez de ficar
verde testando código que não está mais no ar.

---

## 10. Os 10 repositórios

A conta `Pedro-Fisk` é **pessoal**, não uma organização — então permissão é uma
a uma, e o convite vence em **7 dias**. ✅ Levantado direto do GitHub em
04/08/2026 (o `onboarding-davi.md` lista 8 e esqueceu 2, ambos privados):

| repositório | | o que é |
|---|---|---|
| `fisk-hub` | público | ferramentas do professor |
| `portal-aluno-fisk` | privado | Portal do Aluno, Painel da Direção e **a tela da Secretaria** |
| `fisk-hub-backend` | privado | **o backend inteiro** — é aqui que a secretaria roda |
| `fisk-dashboard` | privado | Dashboard Executivo (TypeScript) |
| `met-siele-simulador` | público | simulador MET e SIELE |
| `fisk-simulador` | público | Quick Practice |
| `boletim-fisk` | público | gerador de boletim |
| `planner-fisk` | público | planner |
| `conversation-maker` | público | Conversation Maker |
| `conversation-maker-logs` | privado | logs do Conversation Maker |

Os **públicos** dá para ler e clonar sem convite — mas **não dá para publicar**
sem ser colaborador. Os **privados** não aparecem nem na busca sem o convite
aceito.

## 11. Estado em 04/08/2026 ✅

- Backend implantado e funcionando; rotas `sec*` respondendo.
- `secretaria.html` no ar; `diretor.html` com o link.
- `_alunos` com 758 alunos, **todos com estágio** (não há o bug da seção 8.2).
- Planilha de dados fechada para Restrito, sem impacto no sistema.
- Davi com cargo **Direção** na `_profs` **e** na constante `DIRETORES` (@124).
- Fonte única do backend consolidada; teste com trava de desatualização.
- Repositório reconciliado com o projeto no ar e `main` publicada (seção 7-A).
- Backend na **@124**, mesma URL. Conferido depois de publicar: os 13 arquivos
  continuam lá, o backend responde e as quatro telas devolvem 200.

**Pendência:** a área Financeira do Painel da Direção está vazia.
