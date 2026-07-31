# Entrada do Davi na plataforma — o que precisa ser liberado

O GitHub é a menor parte. A plataforma vive em quatro lugares (GitHub, Apps
Script, Google Drive e Vercel) e o código sozinho não roda em nenhum deles.
Esta é a lista completa, para nada escapar.

Usuário do GitHub: **`davifisk-design`** (confirmado em 31/07/2026).

---

## 1. GitHub — os 8 repositórios

`Pedro-Fisk` é uma **conta pessoal**, não uma organização, e conta pessoal não
tem permissão que valha para todos os repositórios de uma vez: é um a um.

```bash
for r in fisk-hub portal-aluno-fisk met-siele-simulador fisk-simulador \
         boletim-fisk planner-fisk conversation-maker conversation-maker-logs; do
  gh api -X PUT "repos/Pedro-Fisk/$r/collaborators/davifisk-design" -f permission=push
done
```

| repositório | o que é | visibilidade |
|---|---|---|
| `fisk-hub` | ferramentas do professor + o espelho do backend `.gs` | público |
| `portal-aluno-fisk` | Portal do Aluno, Painel da Direção e Portal da Secretaria | privado |
| `met-siele-simulador` | simulador MET e SIELE | público |
| `fisk-simulador` | Quick Practice | público |
| `boletim-fisk` | gerador de boletim | público |
| `planner-fisk` | planner | público |
| `conversation-maker` | Conversation Maker | público |
| `conversation-maker-logs` | logs do Conversation Maker | privado |

`push` basta para programar. `maintain` administra sem poder apagar o repo.
`admin` é acesso total, inclusive apagar. O convite expira em 7 dias.

> **Não transferir os repositórios para uma organização sem antes resolver os
> links.** Não há domínio próprio configurado no GitHub Pages, então o Hub e as
> ferramentas são servidos em `pedro-fisk.github.io/…`, e esse endereço está
> escrito na mão em vários arquivos (`assets/fisk-shared.js`, `met.html`,
> `siele.html`, `quick-practice.html`, `boletins.html`, `index.html`). Mover para
> uma organização muda a URL e quebra todos eles. A hora de fazer a organização
> é junto com colocar o Hub num domínio próprio.

## 2. Google — onde o sistema realmente roda

| o quê | ID / onde | acesso |
|---|---|---|
| Planilha **Fisk Hub — Dados** | `1mUm_7FqDbDZ0m7u_aFzulltLSYWanb1Cvv6j6QRuq24` | **editor** |
| Projeto **Apps Script** (o backend inteiro) | `1AlWF9j-indNvmh_A3Jk9k28mCC3uhF8eP_dj7C74BzX1wauT3b1VGFTm` | vem junto com a planilha acima |
| Card **Caçapava** | `1PgNpyGrQ0_LXqiNUp0g_eyzZOeuUnA6S_BLEsm-uLi4` | editor |
| Card **Taubaté** | `1_P50N1Sd5q7pQkPYmms9IkJBdc6Apq1ZlGZvUNzz0SU` | editor |
| Drive **Planners Caçapava** | `1FJ8Fs677pq0tENiJ1PHLtZp8A0lmw-Gs` | editor |
| Drive **Planners Taubaté** | `1c7vuwrRpINGx-ITgvhr65yD4cwbHodt2` | editor |

O Apps Script não se compartilha sozinho: ele pertence à planilha
`Fisk Hub — Dados`. Dar **editor** nessa planilha é o que abre o editor de
script. E o projeto está na conta **`/u/1`** — vale conferir com qual conta o
Davi vai entrar, porque abrir com a conta errada dá "sem permissão" sem
explicar o motivo.

Sem os dois drives de Planners, nada que envolve pasta de aluno funciona para
ele: boletim, termo de atraso, transferência, declaração.

## 3. Vercel

O `portal-aluno-fisk` é publicado pela Vercel (é o `portalfisk.com.br`).
Convidar o Davi como membro do time/projeto — senão ele enxerga o código mas
não enxerga deploy, log de erro nem variável de ambiente.

## 4. Conta de direção dentro da própria plataforma

São **duas** coisas, e a segunda é a que costuma ser esquecida.

**4a.** No Painel da Direção → 👥 Equipe → **+ Criar usuário**, com **Cargo:
Direção** e as duas escolas marcadas. Isso já o deixa entrar no Portal da
Secretaria (o `secCargoOk_` aceita cargo Direção).

**4b.** Para ter o **Painel da Direção** e a **Padronização dos cards**, o nome
dele precisa entrar na lista de diretores do `Code.gs`. Hoje ela é:

```js
const DIRETORES = ['PEDRO (DIREÇÃO)'];
```

e precisa virar (usando exatamente o mesmo nome cadastrado no passo 4a):

```js
const DIRETORES = ['PEDRO (DIREÇÃO)', 'DAVI (DIREÇÃO)'];
```

Essa linha tem de ser editada **no próprio `Code.gs`**, não pode vir num bloco
aditivo colado no fim: redeclarar um `const` no mesmo escopo é erro de sintaxe e
derruba o backend inteiro. Como o deploy do Portal da Secretaria já vai exigir
abrir o editor, o melhor é fazer as duas coisas na mesma visita — ver
`re-fresh-portal-secretaria.md`, passo 1.

## 5. Por onde ele começa a ler

1. `re-fresh-portal-secretaria.md` — o que é o Portal da Secretaria e o que falta
   para entrar no ar.
2. `padronizacao-dos-cards.md` — por que as duas escolas não montam o card igual,
   qual é o padrão canônico e o bug que isso causava.
3. `re-fresh-fisk-hub.md` — a estrutura de pastas do Drive e as regras de
   casamento turma→pasta, que são a parte menos óbvia do sistema.
4. `apps-script/teste-painel-secretaria.js` — roda em Node, sem tocar em nada:
   é a forma mais rápida de entender como o card é lido.

## Regras da casa que valem desde o primeiro dia

- **Apps Script: sempre editar a implantação existente → Nova versão.** Criar
  implantação nova troca a URL do Web App e derruba Hub, Portal e Painel de uma
  vez.
- **O `Code.gs` de produção está à frente do que está versionado aqui.** Nunca
  colar o repo por cima do editor; mudanças vão como bloco aditivo no fim.
- **Não editar o `CardTools.gs` do card** — endpoints novos vão no
  `fisk-hub-backend`, que é este projeto. Um projeto Apps Script só pode ter um
  `doPost`.
- **Chave nenhuma no front-end.** As páginas falam com o backend por token de
  sessão. Até 31/07/2026 o `config.js` e o `indicadores-card.html` traziam a
  chave do card em texto, num domínio público — foi corrigido e não volta.
- Commits, comentários e interface em português.
