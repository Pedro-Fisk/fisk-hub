# Padronização dos cards — Caçapava × Taubaté

Levantamento feito em 31/07/2026 lendo as **duas planilhas inteiras**
(`NOVO CAÇAPAVA 2º SEMESTRE 2026 - CARD ONLINE` e `NOVO TAUBATÉ 2º SEMESTRE 2026
- CARD ONLINE`), bloco de turma por bloco de turma.

---

## 1. O que foi medido

| | Caçapava | Taubaté |
|---|---|---|
| turmas (blocos) | 28 | 22 |
| colunas de aluno | **28** | **16** |
| cronograma começa na coluna | 29 | 17 (e 15 em 4 turmas) |
| layouts diferentes dentro da própria escola | 6 | 6 |
| coluna `Final P.H.` | sim | **não** |

**Os dois cards não são parametrizados igual — e nem cada um consigo mesmo.**
As divergências internas são pequenas (`Idade` × `Idade (não editar)`, o ano no
cabeçalho da grade), mas as divergências entre as escolas são estruturais:

| coluna | Caçapava | Taubaté |
|---|---|---|
| 3 | STATUS | **Aditamento** |
| 4 | OBSERVAÇÕES | Status |
| **5** | **BOOK** | **Observação** |
| **6** | **BOOK COMPRADO** | **Livro** |
| 7 | RAF | RAF |
| 10–19 | 4 pares DATA/NOTA + 2 APROVADO? (simulados MET/FPA) | **não existem** |
| 24 | Telefone **do aluno** | **não existe** |
| 27 | WhatsApp | **não existe** |

Taubaté ainda tem uma variação própria: em 9 das 22 turmas a coluna do livro se
chama `Livro a ser comprado para 2º sem/26` em vez de `Livro`.

## 2. O problema que isso já estava causando

O `Code.gs` lê o livro do aluno por **posição fixa** (`vals[r][5]`, "coluna F").
Em Caçapava isso é o BOOK. **Em Taubaté isso é a Observação.**

Medido na aba `_alunos` da planilha de dados, em 31/07/2026:

- **630 alunos** na base;
- **142 com o campo `Book` vazio** — praticamente todos de Taubaté;
- e alguns com texto de observação no lugar do livro:
  `"Início em: 05/08/26"`, `"Início: 05/08/26"`, `"Bolsa 50% 2º sem/26"`,
  `"vencimento 15"`.

Aluno sem `Book` não casa com a escada de estágios. Consequências no ar hoje:

- o **Portal do Aluno não mostra progresso de estágio** para esses alunos
  (`seqDoBookCard_` não acha a sequência do livro);
- as **ferramentas travadas por estágio** (`desdeBook` no `config.js` — Treino
  MET a partir de Fluency 2, Treino SIELE a partir de Inmediato 2) não liberam
  para quem deveria ter acesso;
- qualquer relatório por estágio subconta Taubaté.

**Isso está corrigido** no `apps-script/padronizacao-cards.gs`: o
`syncRosterFromCards` foi reescrito para ler as colunas pelo NOME, não pela
posição. A correção entra no ar junto com o Portal da Secretaria e vale para
todo o sistema, não só para o portal.

## 3. O padrão canônico

**Base: o card de Caçapava, como está hoje, mais o `Aditamento` de Taubaté.**

Por quê: Caçapava é o mais completo (tem BOOK COMPRADO, telefone do aluno,
WhatsApp, o bloco de simulados e o Final P.H.), 26 das 28 turmas de lá já o
seguem, e é o que o `Code.gs` sempre assumiu — adotá-lo significa que **nenhuma
coluna de Caçapava muda de lugar**. O único campo que só existe em Taubaté é o
`Aditamento`, que é dado real de contrato: ele entra no canônico no fim do bloco
ADMINISTRATIVO, depois do WhatsApp.

O preço dessa escolha é **uma** coluna nova em Caçapava (`Aditamento`, na 28) e
**treze** em Taubaté. É o menor total possível sem perder informação.

| # | Rótulo | Grupo | Observação |
|---|---|---|---|
| 1 | ATIVO | PRESENCIAL | caixa de seleção |
| 2 | ALUNOS | PRESENCIAL | nome do aluno |
| 3 | STATUS | ALUNO | Matriculado · Rematriculado · Aluno novo · Transferido · Desistente · Trancado |
| 4 | OBSERVAÇÕES | ALUNO | |
| 5 | BOOK | ALUNO | **é a chave do estágio no Portal do Aluno** |
| 6 | BOOK COMPRADO | ALUNO | caixa de seleção |
| 7 | RAF | ALUNO | **é a chave do aluno em todo o sistema** |
| 8 | 1ª AVALIAÇÃO | via BOLETIM | |
| 9 | 2ª AVALIAÇÃO | via BOLETIM | |
| 10–17 | DATA / NOTA | TEST 1 … TEST 4 | simulados |
| 18 | APROVADO? | FPA | |
| 19 | APROVADO? | INSCRIÇÃO | |
| 20 | Data de Nascimento (MM/DD/AAAA) | ALUNO | |
| 21 | Idade  (não editar) | ALUNO | fórmula |
| 22 | Ano Escolar | ALUNO | |
| 23 | Email Aluno/Cliente | ALUNO | |
| 24 | Telefone | **ALUNO** | |
| 25 | Nome | **RESPONSÁVEL** | |
| 26 | Telefone | **RESPONSÁVEL** | |
| 27 | WhatsApp (não editar) | RESPONSÁVEL | fórmula |
| 28 | Aditamento | ALUNO | vindo de Taubaté |
| 29 | *(modalidade)* | — | ACAD/PERS; o cabeçalho é o ano/semestre |
| 30+ | cronograma | dia da semana | `a` falta · `f` feriado · `/` sem aula · `.LIÇÃO` planejada · `LIÇÃO` dada |
| fim | Final P.H. · Faltas | | |

**A linha de grupo importa tanto quanto o rótulo.** `Telefone` e `Nome`
aparecem duas vezes no mesmo bloco, e a única coisa que separa o contato do
aluno do contato do responsável é o `ALUNO` / `RESPONSÁVEL` escrito na linha de
cima. Por isso esses campos só casam com o grupo certo — numa escola que só tem
o telefone do responsável, o sistema prefere deixar o telefone do aluno vazio a
arriscar atribuir o número à pessoa errada.

## 4. Como o código lida com a divergência hoje

Nada no sistema depende mais de posição fixa. O `cardMapa_` casa cada coluna do
canônico com o que a escola realmente escreveu, aceitando sinônimos:

| campo | rótulos aceitos |
|---|---|
| `book` | BOOK · Livro · Estágio |
| `bookComprado` | BOOK COMPRADO · Livro comprado · *(começa com)* "Livro a ser comprado…" |
| `obs` | OBSERVAÇÕES · Observação · Obs |
| `idade` | *(começa com)* Idade |
| `nascimento` | *(começa com)* Data de Nascimento |

A coluna de **modalidade** é reconhecida pela posição, não pelo nome: o
cabeçalho dela é um ano ou semestre (`2026`, `maio 2026`, `1º sem`), que muda
todo semestre e nunca casaria por rótulo. Ela é sempre a última antes do
cronograma, nas duas escolas.

Consequência prática: **a padronização das planilhas não é pré-requisito para
nada.** O Portal da Secretaria e o Portal do Aluno já funcionam nas duas
escolas do jeito que elas estão. Padronizar é para simplificar a vida de quem
usa a planilha e para acabar com a fonte de erro, não para destravar software.

## 5. Como padronizar de fato (pelo Apps Script)

No Portal da Secretaria, painel **🧩 Padronização dos cards** (só direção).
Trabalha **uma aba de professor por vez**, porque coluna é da aba inteira: todos
os blocos de turma empilhados numa aba dividem a mesma grade.

Três passos, nesta ordem, e o botão de aplicar só existe depois dos dois primeiros:

1. **Backup** — copia a planilha inteira para a mesma pasta do Drive, com data e
   hora no nome. Aplicar sem um backup das últimas 24h é recusado pelo servidor.
2. **Simular** — devolve o plano e não escreve nada.
3. **Aplicar**.

O plano mexe o mínimo possível. Ele descobre quais colunas estão fora da **ordem
relativa** canônica (pela maior subsequência crescente) e move só essas; as
demais chegam ao lugar certo sozinhas, empurradas pelas inserções. Para uma aba
típica de Taubaté o plano é:

- **mover 1 coluna** — o `Aditamento`, da 3 para a 28 (sai da frente e volta);
- **inserir 13** — BOOK COMPRADO, os 8 de simulados, os 2 APROVADO?, o telefone
  do aluno e o WhatsApp;
- **renomear os cabeçalhos** — `Livro`→`BOOK`, `Status`→`STATUS`,
  `Observação`→`OBSERVAÇÕES`, `Idade`→`Idade  (não editar)`.

Mover a mesma coisa com o algoritmo ingênuo daria **12 movimentos** de coluna em
vez de 1. Num card ao vivo, cada operação estrutural a menos é risco a menos.

**O normalizador recusa** — e é para recusar mesmo — em dois casos:

- **blocos divergentes**: os blocos de turma da mesma aba discordam sobre onde
  cada coluna está. Não existe um plano de colunas que sirva para a aba toda;
- **coluna estranha**: há coluna dentro da faixa do aluno que não é do padrão e
  ninguém disse o que ela é. Mover coluna com dado não identificado é a receita
  para perder informação.

Nos dois casos a mensagem diz exatamente qual bloco e qual coluna.

## 6. O que ainda depende de decisão sua

1. **Aplicar ou não.** O sistema funciona sem padronizar. Padronizar tem custo
   (uma coluna nova em Caçapava, treze em Taubaté, e as fórmulas de `Idade` e
   `WhatsApp` a recriar nas colunas novas de Taubaté, porque elas nascem vazias).
2. **Onde o `Aditamento` deve ficar.** Coloquei na 28 (fim do administrativo).
   Se a secretaria de Taubaté usa muito essa coluna e quer ela perto do nome,
   dá para mudar — é uma linha no `CARD_CANON`. Mas aí é Caçapava que ganha uma
   coluna no meio, em vez de no fim.
3. **As palavras da coluna STATUS.** Hoje o card usa `Matriculado`,
   `Rematriculado` e `Aluno novo`. O portal escreve `Transferido`, `Desistente`
   e `Trancado` nas baixas. Se a escola usa outras, é a constante `SEC_STATUS`.
4. **A aba `Atrasados`** (que existe nos dois cards e é preenchida à mão) tem
   exatamente as colunas da fila de atendimento do portal, inclusive
   "Aluno/responsável comunicado?". Vale decidir se ela passa a ser alimentada
   pelo portal ou se é aposentada.

## 7. Como conferir sem subir nada

```bash
node fisk-hub/apps-script/teste-painel-secretaria.js
```

O teste monta duas planilhas sintéticas nos formatos reais das duas escolas e
verifica, entre outras coisas, que o livro do aluno de Taubaté sai `Essentials 1`
e não `"Início em: 17/08"`.
