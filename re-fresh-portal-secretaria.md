# Portal da Secretaria — o que foi feito e o que falta para entrar no ar

Sessão de 31/07/2026, branch `claude/secretaria-portal-t3bebd` nos dois repos
(`Pedro-Fisk/fisk-hub` e `Pedro-Fisk/portal-aluno-fisk`).

> **Nada disso está no ar ainda.** O front-end chama rotas que ainda não existem
> no Apps Script implantado. **Ordem obrigatória: Apps Script primeiro, publicar
> o front-end depois** — igual ao painel de carteiras.

---

## O que é

Um portal próprio para a secretaria, no mesmo endereço do Portal do Aluno
(`secretaria.html`), com login individual pela conta que a pessoa já tem no
`_profs`. Entra quem tem cargo **Secretária**, **Coordenação** ou **Direção**.
A página não carrega chave nenhuma: tudo passa por um token de sessão de 6h,
como no Painel da Direção.

Cinco blocos:

| Bloco | O que resolve |
|---|---|
| 🔎 **Ficha do aluno** | Busca por nome ou RAF e mostra numa tela só: turma, professor, livro (e se foi comprado), % do estágio, última lição e a prevista, faltas, atraso de conteúdo, nascimento/idade, ano escolar, e-mail, telefone do aluno e do responsável, último acesso ao Portal do Aluno, saldo de Fisk Dólares, link da pasta no Drive e os boletins já gerados. |
| 🪑 **Turmas e vagas** | Todas as turmas das duas escolas com quantos alunos e quantas vagas, filtrando por escola, dia da semana, período (manhã/tarde/noite), livro ou professor. Responde "tem vaga na 3ª à noite?" sem abrir o card. |
| 🔁 **Transferência** | Sai da ficha do aluno. Simula → mostra exatamente o que vai mudar → confirma. Mexe no card **e** move a pasta do aluno no Drive, do professor antigo para o novo. Tem desfazer. |
| 📞 **Fila de atendimento** | Quem está com faltas altas (padrão ≥ 30%) ou atraso de conteúdo (padrão ≥ 4 aulas, o gatilho do termo de atraso), com telefone, botão de WhatsApp e registro de "liguei / não atendeu / retornar em". |
| ➕ **Matrícula e ⛔ baixa** | Matrícula preenche a primeira linha livre da turma no card e cria a pasta do aluno no Drive. Baixa (desistência, trancamento, transferência para fora) desmarca o ATIVO, grava o motivo e leva a pasta para "Alunos transferidos". |
| 🧾 **Movimentações** | Log de tudo, com quem fez e quando. Transferência tem botão de desfazer. |
| ✅ **Prontidão do semestre** | O que falta em cada aluno para a turma começar redonda: livro comprado, RAF, contrato aditado, contato e cadastro — com edição direto no portal, gravando no card. Nasceu do que os cards mostraram: 89 alunos com livro não comprado, 36 sem RAF, 38 sem telefone nenhum, 43 sem responsável (numa base 85% menor de 18) e 33 contratos não aditados em Taubaté. |
| 🎂 **Aniversariantes** | Do mês, com o contato do responsável — que é quem de fato recebe a mensagem. |
| 🩺 **Conferência do cadastro** | Data de nascimento escrita ao contrário (10 casos; a coluna Idade é fórmula, então a idade fica errada), anotação enfiada dentro do nome do aluno (52 casos), RAF repetido, aluno em duas turmas e status fora da lista. |
| ⚠️ **Alerta do aluno** | Saúde, restrição alimentar, acordo com a família. Aparece em vermelho no topo da ficha. Existe porque o card não tinha onde guardar isso — e a escola guardou assim mesmo: "Aluno celíaco - intolerância a farinha" estava escrito dentro do nome de uma criança. Fica numa aba do portal, sem mexer na estrutura de nenhum dos dois cards. |
| 🧹 **Limpeza dos nomes** | Os 52 alunos com anotação embutida no nome, com o nome limpo proposto e a anotação indo para alerta ou para OBSERVAÇÕES. Conferido no Drive: as pastas dos alunos usam o nome limpo, então limpar **melhora** o casamento com a pasta. |
| 🧷 **Turmas pequenas e fusão** | As turmas com 4 alunos ou menos e para onde esses alunos caberiam: mesma escola, vaga para todos, mesmo livro, dia em comum, horário próximo. Uma turma do card já se chama "FECHAR TURMA". |
| 🎒 **Reposição e experimental** | Agenda com data, professor e baixa. Hoje isso vive como texto solto ("faltando a 1ª aula para compensar no LC", "fará uma aula experimental" dentro do nome). |
| 🔗 **Acesso ao Portal do Aluno** | Quem nunca entrou e quem sumiu, com o contato de quem avisar. É a secretaria que entrega o RAF no balcão. |
| 🎁 **Balcão do Fisk Dólares** | Resgate de prêmio na ficha: debita o saldo e lança no extrato com o nome de quem entregou. |
| 🧩 **Padronização dos cards** | Só direção. Mostra, aba por aba, onde cada escola foge do padrão canônico de colunas, e alinha a planilha pelo Apps Script — com backup obrigatório e simulação antes. Ver `padronizacao-dos-cards.md`. |

---

## Passo 1 — Apps Script (é o que trava tudo)

Abrir no Chrome, **conta `/u/1`**:

```
https://script.google.com/u/1/home/projects/1AlWF9j-indNvmh_A3Jk9k28mCC3uhF8eP_dj7C74BzX1wauT3b1VGFTm/edit
```

**1a.** Com o `Code.gs` aberto: **Ctrl+End**, Enter, e colar **os dois** blocos,
um depois do outro (a ordem entre eles não importa):

1. `fisk-hub/apps-script/padronizacao-cards.gs` — a camada canônica de leitura
   dos cards, a auditoria e o normalizador. **Este bloco também corrige um bug
   que já está no ar**: o livro do aluno de Taubaté era lido da coluna errada,
   e 142 dos 630 alunos da `_alunos` estavam sem estágio por causa disso. Ver
   `padronizacao-dos-cards.md`. Ele redefine `syncRosterFromCards` de propósito
   (em JavaScript a última declaração vence), então basta colar — não precisa
   caçar e editar a versão antiga lá em cima.
2. `fisk-hub/apps-script/painel-secretaria.gs` — o portal em si. Este é
   **aditivo**: não redefine nada. Ele reaproveita o que já está lá (`json`, `getProfs`, `acharProfLinha_`,
`hashSenha_`, `profPublico_`, `normNome`, `ehDiretor_`, `normRaf`, `CARD_IDS`,
`lerGabaritoCard_`, `seqDoBookCard_`, `getAcessos`, `fdWallet_`, `rootDaEscola`,
`acharPasta`, `acharTurmaPasta_`, `acharPastaDoAluno_`, `listarSubpastas_`,
`diasDe_`, `horasDe_`, `normPasta_`, `limpa_`).

**1b.** **Ctrl+F** → `dirLogin`. Logo abaixo da linha

```js
    if (req.action === 'dirLogin') return dirLogin(req);
```

acrescentar **uma** linha:

```js
    if (/^sec[A-Z]/.test(String(req.action || ''))) return secRota_(req);
```

Uma linha só porque todas as rotas do portal começam com `sec` e o `secGuard`
cuida da sessão. Nenhuma ação existente começa com `sec`, então não há conflito.

**1b-bis.** Aproveite que o editor está aberto: **Ctrl+F** → `DIRETORES`. Para o
Davi ter Painel da Direção e Padronização dos cards, o nome dele precisa entrar
nessa lista — e ela é um `const`, então tem de ser editada aqui mesmo, não dá
para vir num bloco aditivo (redeclarar `const` no mesmo escopo derruba o backend
inteiro). Use exatamente o mesmo nome cadastrado no `_profs`:

```js
const DIRETORES = ['PEDRO (DIREÇÃO)', 'DAVI (DIREÇÃO)'];
```

Ver `onboarding-davi.md` para o resto dos acessos que ele precisa.

**1c.** **Ctrl+S** → **Implantar → Gerenciar implantações → lápis → Versão: Nova
versão → Implantar**. **Nunca** "Nova implantação" (troca a URL e derruba Hub,
Portal e Painel). A URL tem de continuar sendo
`https://script.google.com/macros/s/AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1/exec`.

> **Permissão do Drive:** mover e criar pasta usa o mesmo escopo de escrita que o
> `salvarPdfNoDrive` já usa. Se algum dia aparecer "não tem permissão para chamar
> DriveApp…", rodar `setupDriveEscrita()` no editor resolve — é o mesmo problema
> das duas etapas de autorização documentado no `re-fresh-fisk-hub.md`.

## Passo 2 — publicar o front-end

```bash
git checkout main && git pull
git merge --ff-only origin/claude/secretaria-portal-t3bebd
git push origin main
```

Nos dois repos. O que importa para o site é o `portal-aluno-fisk` (Vercel, ~1 min).

Conferir de verdade:

```bash
curl -s https://portal-aluno-fisk.vercel.app/secretaria.html | grep -c "Portal da Secretaria"
curl -s https://portal-aluno-fisk.vercel.app/diretor.html   | grep -c "Portal da Secretaria"
```

## Passo 3 — criar as contas das secretárias

No Painel da Direção → 👥 Equipe → **+ Criar usuário**, com **Cargo: Secretária**
e as escolas certas. A senha você define e entrega pronta. Contas que já existem
só precisam ter o cargo ajustado.

---

## Primeiro teste (fazer nesta ordem, e olhando o card e o Drive)

1. Entrar no portal com a própria conta da direção. O topo tem de mostrar o
   número de alunos, turmas e vagas — se aparecer 0, o card não foi lido.
2. **Ficha:** buscar um aluno conhecido e conferir turma, faltas e telefone
   contra o card. O link "Pasta no Drive" tem de abrir a pasta certa.
3. **Vagas:** filtrar por um dia e um período e comparar com o card.
4. **Transferência, em modo simulação:** escolher um aluno de teste e clicar em
   **Simular**. Ele mostra a linha de origem, a linha de destino e o caminho da
   pasta no Drive — e não escreve nada. Confira e só então **Transferir agora**.
   Depois, no card, veja a linha nova preenchida e a antiga como "Transferido"; no
   Drive, a pasta dentro do professor novo. Por fim teste o **Desfazer** em
   Movimentações e confirme que tudo voltou.
5. **Declaração:** gerar uma na ficha. Ela baixa no computador e é gravada na
   pasta do aluno.

---

## Decisões que valem confirmar com a escola

1. **O que acontece com a linha antiga na transferência.** O padrão é *manter* a
   linha como "Transferido", preservando o histórico de presença do semestre, e
   **tirar o RAF dela** — porque o RAF é a chave do aluno, e RAF repetido no card
   faria o Portal do Aluno continuar mostrando a turma velha (o `_alunos` fica com
   a primeira ocorrência da planilha). Quem quiser liberar a vaga marca a caixinha
   na hora de transferir, e aí a linha é limpa.
2. **As palavras da coluna STATUS.** O portal escreve `Transferido`, `Desistente`,
   `Trancado` e `Aluno novo`. Se a escola usa outras (`Cancelado`, por exemplo),
   é a constante `SEC_STATUS` no começo do bloco — uma linha.
3. **Turma lotada não recebe transferência nem matrícula.** O portal recusa em vez
   de inserir linha, porque inserir deslocaria os blocos de baixo e quebraria as
   células mescladas da coluna A do card. Abrir linhas no card continua sendo
   trabalho manual, de propósito.

## A aba `Atrasados` do card agora é alimentada pelo portal

Ela já existia nas duas escolas, preenchida à mão, com exatamente as perguntas
da fila de atendimento — inclusive "Aluno/responsável comunicado?". Ao registrar
um contato, o portal passa a gravar lá também: data de verificação, quem
verificou, a lição em que o aluno deveria estar, a em que está, as aulas em
atraso e o resultado do contato. Se o aluno já tem linha na aba, a linha é
atualizada em vez de duplicada — a aba é o retrato do estado de cada aluno; o
histórico completo continua na `_secContatos`.

A coluna `CH atual SGF (X/60)` fica em branco: essa carga horária vem do sistema
da franqueadora, que o portal não lê.

## Limites conhecidos

- **Transferência entre escolas depende do Drive.** Se `Planners Caçapava` e
  `Planners Taubaté` estiverem em drives compartilhados diferentes, o Google não
  move a pasta entre eles. Nesse caso o portal **para antes de tocar no card** e
  diz o motivo — nunca deixa o aluno com a linha num lugar e a pasta noutro.
- **A primeira tela do dia demora.** Ler os dois cards inteiros leva alguns
  segundos; depois disso fica em cache por 5 minutos, e toda escrita invalida o
  cache da escola.
- **O "atraso de conteúdo" é calculado pelo portal**, não lido da aba `Atrasados`:
  é o número de aulas já consumidas menos a posição da última lição na sequência
  do book. Bate com o conceito de "Aulas em atraso" que a escola já usa, mas se
  alguém comparar as duas listas e achar diferença, é por isso.
- Aluno sem RAF aparece no card e no portal, mas fica sem saldo de Fisk Dólares e
  sem histórico de acesso — ele ainda não existe para o Portal do Aluno.

## As duas escolas não montam o card igual

Isso mereceu documento próprio: **`padronizacao-dos-cards.md`**. O resumo é que
Caçapava usa 28 colunas de aluno e Taubaté 16, com `BOOK` e `Observação`
trocadas de lugar entre as duas — e que o portal contorna isso lendo as colunas
pelo NOME, com dicionário de sinônimos, em vez de por posição. Padronizar as
planilhas é opcional: nada no sistema depende disso para funcionar.

## Como conferir o leitor do card sem subir nada

O leitor do card (blocos, colunas, vagas, faltas, atraso) tem teste em Node com
uma planilha sintética montada no formato real:

```bash
node fisk-hub/apps-script/teste-painel-secretaria.js
```

Ele cobre as duas armadilhas que custaram tempo aqui: a coluna **"Telefone"
aparece duas vezes** (aluno e responsável, e só a linha de grupo acima distingue)
e a coluna **"Final P.H."** fica *dentro* da faixa que vai até "Faltas" — sem
cortar nela, o `0%` seria contado como mais uma aula dada por todo aluno.

## Estrutura real do card (conferida em 31/07/2026)

Uma aba por professor; dentro dela, blocos de turma empilhados. Um bloco é:

```
linha  iTit    | nº | título da turma | ... grupos largos ... | Final P.H. | Faltas |
linha  iTit+1  | ALUNO / RESPONSÁVEL / TEST 1… | ... | SEG | QUA | SEG | ...
linha  iTit+2  | ATIVO | ALUNOS | STATUS | OBSERVAÇÕES | BOOK | BOOK COMPRADO | RAF |
                 1ª/2ª AVALIAÇÃO | DATA/NOTA ×4 | APROVADO? ×2 | Data de Nascimento |
                 Idade | Ano Escolar | Email | Telefone | Nome | Telefone | WhatsApp |
                 modalidade | dias do mês…
linha  iTit+3+ | uma por aluno — e as numeradas com o nome VAZIO são as VAGAS
```

Colunas fixas úteis (0-based): ATIVO 1 · ALUNOS 2 · STATUS 3 · OBSERVAÇÕES 4 ·
BOOK 5 · BOOK COMPRADO 6 · RAF 7. Daí em diante o bloco lê **pelos rótulos**, não
por posição, para sobreviver a uma coluna nova no meio.

Cronograma: `a` = falta · `f` = feriado · `/` = sem aula · `.LIÇÃO` = plano futuro
· `LIÇÃO` = aula dada. Em 31/07/2026 o card do 2º semestre tinha 28 turmas, 185
alunos e 39 vagas em Caçapava, com STATUS em `Rematriculado`, `Aluno novo` e
`Matriculado` (as aulas ainda não tinham começado, então o ATIVO estava todo
desmarcado — não confunda ATIVO desmarcado com aluno inativo neste momento).

## Ideias que ficaram de fora (para uma próxima)

- **Balcão do Fisk Dólares**: lançar o resgate de prêmio (débito) na hora em que a
  secretária entrega. Hoje a ficha só *mostra* o saldo.
- **Aniversariantes do mês** — a data de nascimento já está sendo lida.
- **Livro não comprado**: a coluna BOOK COMPRADO já é lida e aparece na ficha; dá
  para virar uma lista de cobrança, como a fila de atendimento.
- **Aba `Atrasados` do card**: hoje é preenchida à mão e tem as colunas
  "Aluno/responsável comunicado?" e "Link da pasta do aluno" — dá para a fila de
  atendimento alimentar essa aba em vez de manter registro só no `_secContatos`.
- **Aba `Comercial`**: leads e aulas experimentais viram um funil até a matrícula,
  que o portal já sabe fazer.
