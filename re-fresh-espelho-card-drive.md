# Refresh da sessão: executar as correções de pastas do Drive pelo Chrome

Continuando o trabalho no **fisk-hub** (espelho card → drive compartilhado das turmas).
Objetivo desta sessão: **rodar o Apps Script `arrumar-pastas.gs`**, que aplica 22 correções
já conferidas nas pastas de aluno do drive, e devolver o log do que foi feito.

Este handoff é autossuficiente: o plano inteiro está reproduzido aqui dentro. Se o
repositório `fisk-hub` estiver clonado na máquina, os arquivos citados na última seção
são a fonte canônica — mas dá para conferir tudo sem abrir nenhum deles.

## Por que esta sessão existe

A sessão anterior rodou no Claude Code na web, num contêiner isolado, e **não tinha
controle do Chrome**: o acesso ao Google Drive de lá era somente leitura (listar e ler,
sem mover, renomear ou criar pasta), e a `FISK_CHAVE` do Apps Script vive nas
Propriedades do Script, não no repo. Por isso ela parou no plano em vez de executar.
Esta sessão roda na máquina do Pedro, com Chrome logado — é a que consegue apertar o botão.

## Estado atual

Ontem (03–04/08/2026) a escola espelhou o card no drive: pasta por professor, pasta por
turma, pasta por aluno. A sessão anterior conferiu esse espelho contra os **dois cards do
2º semestre**, bloco de turma por bloco de turma:

- **794 alunos já estão no lugar certo** — a arrumação funcionou no grosso.
- 6 alunos ativos sem pasta nenhuma; 6 alunos ativos que foram parar em
  `0 - Arquivo 2º sem 2026`; 16 com a pasta pendurada em outra turma ou outro professor;
  17 com o nome grafado diferente entre card e pasta; 2 pastas de turma com o horário
  divergente do card; 115 pastas de aluno sobrando; 17 pastas de turma fora do card;
  8 RAFs repetidos no próprio card.

Dessas divergências, **22 são determinísticas** e viraram o script. As outras **20 dependem
de decisão humana** e ficaram documentadas, fora do script, de propósito.

O relatório visual da conferência está publicado em
https://claude.ai/code/artifact/b83ae71c-4117-4099-82d2-dfe4954b2652

Tudo já está commitado e enviado na branch `claude/student-folder-verification-trtms8`
(commit `cee3348`). **Nada foi executado no Drive ainda.**

## Próximos passos

1. Abrir o Chrome no projeto do Apps Script do **fisk-hub-backend** (o mesmo projeto que
   hospeda o `Code.gs`; é o script vinculado à planilha de dados, alcançável em
   https://script.google.com). Confirmar com o Pedro qual é o projeto antes de criar arquivo.
2. Criar um arquivo `.gs` novo chamado `arrumar-pastas` e colar o conteúdo de
   `apps-script/arrumar-pastas.gs` (reproduzido em resumo abaixo; o arquivo é a fonte).
3. Rodar **`simular()`** e ler o log (Ver → Registros / `Ctrl+Enter`). Esperado: 22 linhas
   `✓ …` dizendo o que faria, `feitos: 22 · pulados: 0 · erros: 0` e a marca
   `(simulação — nada foi gravado)`.
   - Na primeira execução o Google pede autorização do escopo do Drive. É esperado:
     aceitar na tela de consentimento.
   - Se aparecer `– pulado`, **não force**: significa que a pasta mudou de nome ou de lugar
     desde a conferência de 04/08. Anotar quais e reportar ao Pedro.
4. Se a simulação vier limpa, rodar **`aplicar()`** e guardar o log.
5. Reportar ao Pedro: quantas foram, quais foram puladas e por quê.
6. Só então, se ele quiser, atacar a lista de decisão humana (`ESPELHO-CARD-DRIVE.md`).

## O que o script faz (as 22 operações)

Todas foram filtradas por cinco travas: o aluno aparece em **uma única** turma ativa do
card; essa turma tem **uma** pasta correspondente; a pasta de destino está **confirmada**
(a maioria dos alunos daquele bloco do card já está dentro dela — protege contra
casamento por horário ambíguo); o aluno tem **no máximo uma** pasta no Drive; e o nome no
card **não tem anotação colada**.

### Renomear pasta de aluno — 14

O nome da pasta não bate com o card, e é isso que hoje faz boletim e termo de atraso não
acharem a pasta. O card é a fonte da verdade.

| ID da pasta | De | Para | Onde |
|---|---|---|---|
| `1W-Z5qneTUkDtVR8U--u2vNJU_aXlv2-0` | Otavio Luis Campanelli Agostinho | Otavio Luis Campanilli Agostinho | Taubaté › Carlos › 04 - Sáb - 10:30/13:00 |
| `18n2C7djRgDikh5I5DoxOVK0yyyMeWS3F` | Lucas Montovani Faria | Lucas Mantovani Faria | Taubaté › Carlos › 04 - Sáb - 10:30/13:00 |
| `18dPA8h4Bxku_85Q-gzXXyqwjHJta3IfC` | Kailan Ferreira Landin dos Santos | Kailan Ferreira Landim dos Santos | Taubaté › Leonardo › 3ª - 08h30/11h00 |
| `1c83O9G2KY6G40x4uy6cyujew2tX3RaY3` | Raquel Faria de Melo | Raquel Faria de Mello | Taubaté › Maria Paula › Sáb - 10:30/13:00 |
| `1gQ0RLpkCkhnBvlsZWsEDmsNxnT_VLgHW` | Giovanna de Silva Cusin | Giovanna da Silva Cusin | Taubaté › Mariana › 3ª - 15:00/17:30 |
| `1D1eDXUNcajsuhf4fh8-5dXEWv8lv7F0Q` | Leticia Rayani Gonçalves Cesar | Leticia Rayane Gonçalves César | Taubaté › Mariana › Sáb - 08:00/10:30 - ADV |
| `1qyR3VR5DQD6UtaAgs99KyjAAI3o9NeV3` | Davi Eiji Okamura Passarelli | Davi Eiji Okumura Passarelli | Taubaté › Tamires › Sab - 8:00/10:30 |
| `1wrO1lsRZUI7b--b02d3wx2XrBlnNtLlz` | Bruna Naomi Sonada Santos | Bruna Naomi Sonoda Santos | Caçapava › Alex › 3ª 15h às 17h30 |
| `1XubxeniFS6Q_zsLOiOlyYchWSMRtzmCd` | Lucas Audebert Delage Miacchi | Lucas Audebert Delage Miacci | Caçapava › Carlos Alberto › 4) Sáb 08h00-10h30 |
| `1-Hxl44guM0ZbdhgArkkxsaPIkSrixjjs` | Kauã Victor de Paulo Carlota | Kauã Victor de Paula Carlota | Caçapava › Claudinei › 6ª 16h15-18h45 |
| `1g2gCXElTl9Z99wRTJhUVWnh5y0xoUalr` | Ana Alice Santos Leme | Ana Alice dos Santos Lemes | Caçapava › Erick › Sábado 8h-10h30 |
| `1DkgatsI8picQ8QvH5e4qTC7TKfanK-0t` | Alicia Porto Lima Da Rocha | Alice Porto Lima Da Rocha | Caçapava › Maria Fernanda › 3ª/5ª 17h30 |
| `1LDMoxp--JjAvevZl2PIplFzc-jXG4tt_` | Antonio Da silva Camargo Pires | Antonio Silva de Camargo Pires | Caçapava › Maria Fernanda › 4ª 15h Kids |
| `1wFnSI0_A4ZfF5YsHzoEI-YYqSeFi-Ln7` | Giovanna Oliveira Bittencuort Moura | Giovanna Oliveira Bittencourt Moura | Caçapava › Nicole › 3ª 8h30-11h Kids |

### Mover pasta de aluno para a turma do card — 5

| ID da pasta | Aluno | De | Para (ID do destino) |
|---|---|---|---|
| `1iyR1rQc2_PcETJcE1bdOQ4lANZ5OmS5f` | Luiza Mattos Ferreira | Taubaté › Carlos › 04 - Sáb 10:30/13:00 | Mariana › Sáb 10:30/13h00 INT/ADV (`1CQhADFQGZzVn1uGtm7Jw6Baw7TF17H44`) |
| `16nh0svYl_U6kZIq4Y4gAcgwyrUfRtp_4` | Davi Venancio dos Santos | Caçapava › Claudinei › 6ª 16h15-18h45 | Alex › 6ª 16:15-18:45 All levels (`18HvXf_NsPR7iTvf9YN4JDrxoTRY7a1YR`) |
| `1Qs6JMHdtHzUz4p1DbJoyTSgctx5eKe9a` | Gustavo Peretta dos Santos Abreu | Caçapava › Nicolas › Basic Sáb 8h | Carlos Alberto › 5) Sáb 10h30-13h Basic (`1JmIm_2mGIzjSuF0AjPLImnHEtYWZ2nyd`) |
| `10a4p0ytY-pbmd9NV_dufYCjYLnSnPlWD` | João Gabriel Ricardo Dos Santos | Caçapava › Carlos Alberto › 2) Quinta 15h | Claudinei › 3ª/5ª 17h30-18h45 Basic (`1BlwqEdHqN3fB0rRPhi40eGO7iJ8qbPyQ`) |
| `1XXECenFWdyRC8g-uh_ykCjUHvQmJtbHw` | Antônio De Paiva | Caçapava › Alex › Sáb 10h30 Acad ESS1 | Maria Luiza › 3ª/5ª 17H30 ACAD ESS1 (`117OjK2z8Uq9m7LMKxjSvYp21uT7mq-2n`) |

### Criar pasta de aluno — 1

**Maria Fernanda Sampaio Campanilli Agostinho** em
Taubaté › Leonardo › `Sáb - 10:30/13:00 - ESSENTIALS 1 (ACAD)` (`12MAEEqoaAZ-Wgqzl6UwhI3Gem53IR00E`).
O rótulo do nível na pasta está desatualizado, mas é a turma certa: 7 dos 9 alunos daquele
bloco do card já estão dentro dela.

### Renomear pasta de turma — 2

Estas duas são as de maior efeito prático: com o nome atual, o casamento por dia+horário
do `Code.gs` **empata** com outra turma do mesmo professor, e empate vira recusa — o
professor recebe "pasta não encontrada" ao salvar boletim ou plano.

| ID | De | Para |
|---|---|---|
| `1F3w983g0dpH8yhRVRbsTZ2tSXEzUq-Zc` | `03 - Sáb - 08:00/10h:30 - BÁSICO` | `03 - Sáb - 08:00/10:30 - BÁSICO` |
| `1W7Z7yVngeUaGZzcd46l3AamuQC4UDjRM` | `6ª 13:45-15:00 - Advanced` | `6ª 13:45-16:15 - Advanced` |

## O que NÃO fazer nesta sessão

- **Não mexer nos 20 casos de decisão humana.** Estão em `ESPELHO-CARD-DRIVE.md`: 9 alunos
  que o card coloca em duas turmas, 5 com duas pastas no Drive, 4 com anotação colada no
  nome do card, 2 com pasta de turma não confirmada. Todos precisam de uma informação que
  só o Pedro tem.
- **Não arquivar as 115 pastas sobrando** nem apagar as 17 pastas de turma fora do card.
  São movimentações em massa num drive vivo — chamada da direção, não de script.
- **Não corrigir os 8 RAFs repetidos** pelo Drive: a correção é no card.
- **Não editar `Code.gs`, `COLAR-NO-CODE-GS.gs` nem `painel-secretaria.gs`.** O script novo
  é um arquivo separado e não toca em nada que está no ar.

## Preferências e convenções do projeto

- Toda ferramenta de escrita no Drive tem **ensaio antes de valer**: `simular()` → `aplicar()`.
  O mesmo padrão do painel de padronização dos cards (backup → simular → aplicar).
- **Nada de segredo no repo.** `fisk-hub` é público; `FISK_CHAVE` e afins vivem só nas
  Propriedades do Script. Não colar chave em arquivo nem em commit.
- O **card é a fonte da verdade** sobre quem é aluno e de qual turma. O Drive espelha o card,
  nunca o contrário.
- Estrutura canônica no drive compartilhado:
  `Planners <Escola>` → `<n> - <Professor>` → `<n> - <dia/horário> - <NÍVEL>` → pasta por aluno.
  Raízes: Caçapava `1FJ8Fs677pq0tENiJ1PHLtZp8A0lmw-Gs`, Taubaté `1c7vuwrRpINGx-ITgvhr65yD4cwbHodt2`.
- Cards do 2º semestre: Caçapava `1PgNpyGrQ0_LXqiNUp0g_eyzZOeuUnA6S_BLEsm-uLi4`,
  Taubaté `1_P50N1Sd5q7pQkPYmms9IkJBdc6Apq1ZlGZvUNzz0SU`.
- Commits em português, sem acento na mensagem, escopo entre parênteses
  (`chore(drive): …`). Branch de trabalho: `claude/student-folder-verification-trtms8`.
- Não abrir pull request sem o Pedro pedir.

## Arquivos para abrir (se o fisk-hub estiver clonado na máquina)

Estão na branch `claude/student-folder-verification-trtms8`:

- `apps-script/arrumar-pastas.gs` — o script a colar e rodar. Fonte canônica das 22 operações.
- `ESPELHO-CARD-DRIVE.md` — os 20 casos de decisão humana, com o motivo de cada um.
- `apps-script/Code.gs` — só para consulta: `acharPasta`, `acharTurmaPasta_`,
  `acharPastaDoAluno_`, `normPasta_` são as funções cujo comportamento o plano reproduz.
  Explica por que as duas pastas de turma com horário errado quebram o casamento.
- `padronizacao-dos-cards.md` — contexto de como os dois cards divergem entre si.
