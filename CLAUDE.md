# fisk-hub

Ferramentas do professor da Fisk (Caçapava e Taubaté), servidas pelo GitHub Pages
em `pedro-fisk.github.io/fisk-hub`. **HTML estático puro, sem build, sem
dependências instaladas.** Cada ferramenta é uma página que fala com um backend
Google Apps Script.

## Como está organizado

| | |
|---|---|
| `index.html` | home do Hub: login do professor, cards das ferramentas |
| `planejador.html` | plano de aula + PDF (pdf-lib) + "Conversação do dia" |
| `2nd-chance.html`, `termo-atraso.html` | documentos em PDF do aluno, com "Salvar na pasta do aluno" |
| `boletins.html`, `met.html`, `siele.html`, `quick-practice.html` | atalhos para ferramentas que vivem em **outros repositórios** |
| `answer-keys*.html`, `treinamentos.html`, `visao-geral.html`, `acessos.html` | consulta e material do professor |
| `assets/fisk-shared.js` / `.css` | helpers compartilhados (tema, menu de usuário, idioma, Drive, pulso de uso) |
| `apps-script/` | só um README: o backend **não mora aqui**, mora em `fisk-hub-backend` |
| `conversation_maker/` | protótipo Python de geração de conteúdo (único código com dependências) |

Documentos de contexto que valem mais que o código para entender o sistema:
`handoff-portal-secretaria-davi.md` (**comece por ele** — o que foi conferido
contra o sistema no ar está marcado como tal), `re-fresh-fisk-hub.md` (Drive e
casamento turma→pasta), `padronizacao-dos-cards.md` (por que as duas escolas
montam o card diferente), `onboarding-davi.md` (acessos que a plataforma exige),
`re-fresh-portal-secretaria.md`.

> ⚠️ **Os handoffs antigos contêm instruções erradas, confirmadas em
> 04/08/2026.** `onboarding-davi.md` e `re-fresh-portal-secretaria.md` mandam
> cadastrar o diretor como `'DAVI (DIREÇÃO)'` — não funciona, porque
> `ehDiretor_` compara por igualdade e o nome na `_profs` é `Davi`. E
> `re-fresh-portal-secretaria.md` descreve um bug do livro dos alunos que **não
> existe** (os 758 alunos têm estágio); seguir aquilo levaria a mexer no
> `CARD_ABAS_IGNORAR` e **sumir com aluno da lista**, tirando o acesso dele ao
> Portal do Aluno. A seção 8 do handoff do Davi detalha as duas.

## Onde o sistema realmente roda

Quatro lugares, e o código sozinho não roda em nenhum: **GitHub** (este repo),
**Apps Script** (o backend `fisk-hub-backend`, dono da planilha `Fisk Hub — Dados`),
**Google Drive** (pastas `Planners <Escola>`) e **Vercel** (só o portal do aluno,
outro repo). Ver `onboarding-davi.md` para IDs e permissões.

Duas URLs de Apps Script, de propósito diferentes:

- `API_URL` — leitura do card, via ponte `action=card` do backend.
- `FISK_SAVE_URL` / `FISK_HUB_EP` (`assets/fisk-shared.js`) — gravação no Drive e
  registro de uso. **Nunca usar uma no lugar da outra.**

## Regras que não se negociam

- **Nenhuma chave no front-end.** As páginas se autenticam por token de sessão.
  Até 31/07/2026 a chave do card viajava em texto num domínio público; foi
  corrigido e não volta.
- **Apps Script: sempre "editar a implantação existente → Nova versão".** Criar
  implantação nova troca a URL do Web App e derruba Hub, Portal e Painel de uma vez.
  **Quem publica sou eu, não o Pedro** (instrução dele, 10/08/2026): reautorizo o
  `clasp` pelo Chrome dele quando a credencial expira e rodo push, versão e
  deploy daqui. O procedimento inteiro, com o ID da implantação de produção e a
  conferência pós-deploy, está em `fisk-hub-backend/CLAUDE.md`.
- **O backend tem UMA fonte: `Pedro-Fisk/fisk-hub-backend/Code.js`**, publicado
  por `clasp push`. Não existe mais cópia do backend neste repositório, e
  **nunca** volte a colar bloco à mão no editor do Apps Script: eram duas fontes
  para um arquivo que não tem merge, e quem salvava por último apagava o
  trabalho do outro sem aviso. Consolidado em 04/08/2026.
- **Antes de um `clasp push`, veja se alguém criou arquivo direto no editor.**
  O push sincroniza o projeto inteiro e apaga o que só existe lá. Confira com um
  `clasp pull` para pasta temporária e `diff -rq`, comparando também a *lista*
  de arquivos, não só o conteúdo.
- **Não editar o `CardTools.gs`** do card — endpoints novos vão no
  `fisk-hub-backend`. Um projeto Apps Script só pode ter **um** `doPost`.
- **Não transferir os repositórios para uma organização** antes de resolver os
  links: o endereço `pedro-fisk.github.io/…` está escrito na mão em
  `assets/fisk-shared.js`, `met.html`, `siele.html`, `quick-practice.html`,
  `boletins.html` e `index.html`.

## Convenções de código

- JS no estilo `var`/ES5 do repo, inline no `.html`; sem framework, sem bundler.
- PDFs sempre via **pdf-lib** pelo CDN.
- `assets/fisk-shared.js` é carregado localmente aqui, mas outros repos o
  consomem pelo jsDelivr numa **tag fixa** — mudar a assinatura de um helper
  não chega neles sozinho.
- Commits, comentários, nomes e interface em **português**.

## Antes de commitar

```bash
# sintaxe de bloco <script> inline alterado
node -e "new Function(require('fs').readFileSync('/dev/stdin','utf8'))" < bloco.js

# leitura do card nas duas escolas (roda em Node, não toca em nada remoto)
# mora no outro repositório, junto do código que ele testa
node ../fisk-hub-backend/scripts/testes/secretaria/painel-secretaria.test.js
```

O `conversation_maker/` é a exceção: Python, com `requirements.txt` próprio.

## O que é fácil errar

- **Turma do card ≠ nome da pasta no Drive**, e o nível chega a se contradizer.
  O único sinal confiável é **dia da semana + horário**; empate ⇒ recusa. Nome de
  nível é ruído (em Kids/Teens o número marca o semestre, não o livro).
- **Coluna do card por posição fixa quebra em Taubaté** (`vals[r][5]` é BOOK em
  Caçapava e Observação em Taubaté). Ler sempre pelo **nome** do cabeçalho, com os
  sinônimos do `cardMapa_`, e considerando a linha de grupo (`ALUNO` × `RESPONSÁVEL`
  separam dois campos chamados `Telefone`).
- **Autorização do Drive tem duas etapas**: `setupDrive()` libera só leitura;
  a escrita exige `setupDriveEscrita()`. O sintoma é falhar ao criar o arquivo com
  a pasta já localizada.
