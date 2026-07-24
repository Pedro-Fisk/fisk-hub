# Refresh da sessão: continuar o fisk-hub (salvar-no-Drive + boletim)

Continuando o trabalho no repositório **pedro-fisk/fisk-hub**, branch de feature
**`claude/lesson-plan-finalizer-ntot4n`** (já com vários commits pushados).
Objetivo desta sessão: **ativar o salvamento no Drive nas ferramentas** (falta só
a URL do endpoint) e **estender o botão de salvar ao gerador de boletim** (repo
separado). Trabalho anterior foi feito numa sessão Claude Code na web; tudo que
importa está **commitado** — a próxima sessão só precisa do repo em disco.

## Como entrar
```
git fetch origin claude/lesson-plan-finalizer-ntot4n
git checkout claude/lesson-plan-finalizer-ntot4n
```
Trabalhe e faça push sempre nessa branch. Rodapé de commit exigido:
`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` (+ linha `Claude-Session:`).

## Estado atual (o que já está feito e commitado)
Ferramentas são páginas HTML estáticas (GitHub Pages) que falam com um Google
Apps Script (o "card") via `API_URL` + `API_KEY`.

1. **`planejador.html`** — PDF do plano de aula **remontado do zero** (pdf-lib, 540×780,
   estilo azul FISK): cabeçalho Professor/Turma/Data · bloco **"Conversação do dia"**
   (1ª+2ª aula) · **escala de prioridade** (nº colorido por prioridade). Removidos os
   blocos Transição/Fechamento/Materiais. Botões no fim: Copiar roteiro · Gerar PDF ·
   **Enviar para pasta da turma**. Função reutilizável `montarPDFplano(dp)` → bytes.
2. **Conversação do dia** auto-preenchida pelo calendário (aba **agosto/2026**): dados
   embutidos em `CONV_CAL` dentro de `planejador.html`; lookup por data → semana
   (`conversaDaData` / `aplicarConversaAuto`). Em agosto todos os níveis compartilham a
   mesma atividade, então não precisa mapear nível. Campo editável (não sobrescreve
   edição manual).
3. **Salvar no Drive** — helpers em `assets/fisk-shared.js`
   (`fiskSalvarNoDrive`, `fiskEnviarParaPasta`, `fiskBytesToBase64`, const `FISK_SAVE_URL`).
   Botão **"Salvar na pasta do aluno"** já ligado em **`2nd-chance.html`** e
   **`termo-atraso.html`** (capturam os bytes do PDF gerado em `ultimoPDF`).
   `termo-atraso.html` passou a carregar `assets/fisk-shared.js`.
4. **`apps-script/salvar-no-drive.gs`** — endpoint `doPost` que navega
   Planners <Escola> → "N - Professor" → turma → [aluno] e grava o PDF; se não achar a
   pasta, responde `code:'pasta_nao_encontrada'` e a ferramenta **avisa o professor**
   (nada de falso "salvo").

## Próximos passos
1. **Ativar o endpoint** (bloqueado só nisto): o Pedro vai publicar o
   `apps-script/salvar-no-drive.gs` num projeto Apps Script **SEPARADO** (`fisk-hub-backend`,
   **não** o CardTools) como App da Web e mandar a **URL `/exec`**. Cole essa URL em
   **`assets/fisk-shared.js` → `var FISK_SAVE_URL = '...'`**, commit e push. Aí os 3 botões
   funcionam.
2. **Validar a correspondência de nomes** turma→pasta e aluno→pasta com um teste real.
   `acharPasta()` normaliza acento/caixa/pontuação e tenta igualdade e depois "contém".
   Se um título do card (ex.: `turma.turma`) não casar com o nome da pasta
   (ex.: `01 - 4° 18:45/21:15 - Basic`), ajuste `acharPasta`/normalização. O alerta de
   "pasta não encontrada" cobre a falha sem risco de falso positivo.
3. **Boletim** — o botão de salvar ainda **não** existe no gerador de boletim, que fica
   em **outro repositório: `pedro-fisk/boletim-fisk`** (a `boletins.html` daqui é só um
   menu que aponta para `pedro-fisk.github.io/boletim-fisk/`). Para implementar: trazer
   esse repo para a sessão (`add_repo` / clonar), adicionar o mesmo botão
   "Salvar na pasta do aluno" (tipo `aluno`) reusando o padrão do 2nd-chance/termo
   (gerar PDF → `ultimoPDF` → `fiskEnviarParaPasta`). Precisa do `fisk-shared.js` lá
   (ou embutir os helpers) e do `FISK_SAVE_URL`.

## Fatos-chave (não deduza de novo)
- **Endpoint do card (leitura):** `API_URL =
  'https://script.google.com/macros/s/AKfycbxb3s3zSUoaFO9ytEQ4W6r-5xJ3hiA9fbFhugnbd9gyX-m3KGNNM8DeyGgNWPReYEwU/exec'`
  · `API_KEY = 'fisk-cards-2026-vX7q3nT'`. O salvamento usa **outra** URL (`FISK_SAVE_URL`),
  de propósito.
- **Estrutura de pastas (drive compartilhado)** — CONFERIDA no Drive real em 24/07/2026:
  `Planners <Escola>` → pasta do professor → pasta da turma → pastas de aluno (nome completo).
  - Raiz **Taubaté** = `1c7vuwrRpINGx-ITgvhr65yD4cwbHodt2`
  - Raiz **Caçapava** = `1FJ8Fs677pq0tENiJ1PHLtZp8A0lmw-Gs`
  - **Professor:** Caçapava usa só o primeiro nome (`Alex`, `Maria Fernanda`); Taubaté usa
    `"<n> - Nome"` (`8 - Tamires`). Exato + "contém" cobre os dois.
  - **Turma: o nome NÃO casa entre card e pasta — o nível chega a se contradizer.**
    card `INTERMEDIATE - 2ª/4ª 18h45 às 20h` ↔ pasta `2ª/4ª 18h45 às 20h00 - Basic/Inter`
    card `Basic/Interm (+18) - 3ª 8h30 às 11h` ↔ pasta `3ª 8:30 às 11h - All levels`
    Único sinal confiável: **dia da semana + horário** (`acharPastaPorHorario_`). Horário
    aparece como `17h30`/`17:30`/`17 30`/`20h`/`20h00` — tudo normalizado para minutos.
    Empate entre pastas ⇒ recusa (ambiguidade não pode virar gravação no lugar errado).
  - **Aluno:** o nome bate; o card às vezes traz sufixo (`Livia Cruz Santos (confirmar)`),
    resolvido pelo "contém".
  - Dentro da pasta da turma também existem `1 - Plano de aula`, `Bilhete de atraso` etc.
  - Diagnóstico: `?action=driveDebug&key=TEACHER&escola=|pasta=<id>` lista o que o script
    enxerga; `?action=driveMatch&key=TEACHER&escola=&professor=&turma=[&aluno=]` simula o
    salvamento sem gravar nada.
- **Níveis (trilha adultos):** Essentials→básico, Transitions→intermediário,
  Fluency/Focus→avançado. Colunas do calendário: Basic, Basic+18, Advanced+Inter, Espanhol.
  Kids/Teens ficam **fora** do método personalizado (o planejador já os filtra).
- **Regra do Apps Script do card:** NÃO editar o `CardTools.gs`; endpoints novos vão no
  projeto separado `fisk-hub-backend`. Um projeto só tem **um** `doPost`.

## Preferências e convenções
- HTML estático puro, sem build; JS no estilo `var`/ES5 do repo; PDFs via **pdf-lib** (CDN).
- `assets/fisk-shared.js` é compartilhado entre as ferramentas (carregado localmente).
- Toda mudança em `.html` inline: validar sintaxe com
  `node -e "new Function(<bloco script inline>)"` antes de commitar.
- Commits em português, mensagem descritiva + rodapé Co-Authored-By/Claude-Session.
- Não abrir PR sem o usuário pedir. Desenvolver e pushar na branch designada.

## Arquivos para abrir
- `planejador.html`: PDF do plano, `montarPDFplano`, `CONV_CAL`/conversação, botão Drive.
- `assets/fisk-shared.js`: helpers de Drive + `FISK_SAVE_URL` (é aqui que entra a URL).
- `apps-script/salvar-no-drive.gs`: endpoint a publicar; navegação de pastas + matching.
- `2nd-chance.html`, `termo-atraso.html`: botão "Salvar na pasta do aluno" (padrão a repetir no boletim).
- `boletins.html`: confirma que o boletim real é o repo externo `pedro-fisk/boletim-fisk`.

## Evite repetir
- Não colar o `doPost` no CardTools.gs (regra do próprio card; e conflita com o doPost existente).
- Não usar `API_URL` como endpoint de salvamento — é `FISK_SAVE_URL` separado.
- Não tentar mapear nível da turma para a conversação de **agosto** — é uniforme entre níveis.
- Não reparsear o calendário inteiro: só a aba de agosto importa (já embutida). Se for
  estender p/ set–dez, note que as abas do arquivo NÃO estão em ordem cronológica.
