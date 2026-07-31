# Refresh da sessão: implantar o backend do Portal da Secretaria e validar contra o card real

Continuando o trabalho no **Fisk Hub / Portal do Aluno** (repos `Pedro-Fisk/fisk-hub`
e `Pedro-Fisk/portal-aluno-fisk`, ambos já com tudo mergeado no `main`).
Objetivo desta sessão: **colar e implantar o backend no Apps Script pelo Chrome**,
depois **validar contra o card real**.

> A sessão anterior rodou no Claude Code **na nuvem** — contêiner sem navegador e
> sem a sessão do Google do Pedro. Foi exatamente esse o bloqueio. Aqui há Chrome:
> **dirija o Chrome e execute.** O Pedro não quer instruções, quer a coisa feita.

---

## Estado atual

**Já está no ar** (verificado no domínio de produção, não no painel da Vercel):

| | estado |
|---|---|
| `portalfisk.com.br/secretaria.html` | **publicado**, 11 painéis, HTTP 200 |
| `portalfisk.com.br/diretor.html` | com o atalho novo para o Portal da Secretaria |
| `main` do `fisk-hub` | `a93a4f8` |
| `main` do `portal-aluno-fisk` | `c119351` |
| branch `claude/secretaria-portal-t3bebd` | mergeada nos dois; **não há nada pendente nela** |

**NÃO está no ar:** o backend. Nenhuma rota `sec*` existe no Apps Script implantado.
Enquanto isso, toda chamada cai no ramo final do `doPost` e volta `chave inválida` —
e a página reconhece esse caso e mostra *"o backend ainda não foi implantado"*.
**É esse aviso que diz se o deploy funcionou.**

**O que o deploy carrega junto, e é mais urgente que o portal:** a correção do
livro do aluno em Taubaté. O `Code.gs` lê o livro por posição fixa (coluna F);
em Caçapava isso é o `BOOK`, em Taubaté é a `Observação`. Medido na aba `_alunos`
em 31/07/2026: **142 dos 630 alunos sem Book**, alguns com texto de observação no
lugar (`"Início em: 05/08/26"`, `"Bolsa 50% 2º sem/26"`, `"vencimento 15"`).
Sem Book o aluno não casa com a escada de estágios: o Portal do Aluno não mostra
progresso e as ferramentas travadas por estágio (MET a partir de Fluency 2, SIELE
a partir de Inmediato 2) não liberam.

---

## Próximos passos

### 1. Apps Script — colar e implantar

Abrir no Chrome, **conta `/u/1`** (é a conta dona do projeto):

```
https://script.google.com/u/1/home/projects/1AlWF9j-indNvmh_A3Jk9k28mCC3uhF8eP_dj7C74BzX1wauT3b1VGFTm/edit
```

**1a.** Com o `Code.gs` aberto: **Ctrl+End**, Enter, e colar o conteúdo inteiro de
`fisk-hub/apps-script/COLAR-NO-CODE-GS.gs` (é a junção dos dois blocos, sintaxe já
validada como unidade — um Ctrl+V, não dois).

**1b.** **Ctrl+F** → `dirLogin`. Abaixo de
`if (req.action === 'dirLogin') return dirLogin(req);` acrescentar:

```js
    if (/^sec[A-Z]/.test(String(req.action || ''))) return secRota_(req);
```

**1c.** **Ctrl+F** → `DIRETORES`. Incluir o Davi (o nome tem de ser idêntico ao
que for cadastrado no `_profs`):

```js
const DIRETORES = ['PEDRO (DIREÇÃO)', 'DAVI (DIREÇÃO)'];
```

É `const` no `Code.gs`: tem de ser editado ali mesmo, não pode vir em bloco
aditivo (redeclarar `const` no mesmo escopo derruba o backend inteiro).

**1d.** **Ctrl+S** → **Implantar → Gerenciar implantações → ícone de lápis →
Versão: Nova versão → Implantar**.
**NUNCA "Nova implantação"** — troca a URL do Web App e derruba Hub, Portal e
Painel de uma vez. A URL tem de continuar sendo:
`https://script.google.com/macros/s/AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1/exec`

### 2. Confirmar que entrou

Abrir `https://portalfisk.com.br/secretaria.html` e tentar entrar:

- ainda diz *"o backend ainda não foi implantado"* → **não entrou**
- diz *"senha incorreta"* ou *"usuário não encontrado"* → **entrou**

### 3. Corrigir a `_alunos` (o bug dos 142 alunos)

No editor do Apps Script, rodar **`syncRosterFromCards`** manualmente. Depois abrir
a planilha `Fisk Hub — Dados` → aba `_alunos` e conferir a coluna **Book**:

- antes: 142 vazias de 630
- esperado depois: quase nenhuma vazia, e **nenhuma** com texto de observação
  (procure por `Início`, `Bolsa`, `vencimento` na coluna Book — tem de dar zero)

Se ainda houver muitas vazias, o bloco não foi colado ou a versão não foi implantada.

### 4. Teste de aceitação, nesta ordem, olhando o card e o Drive

1. Entrar no portal com a conta da direção. O topo tem de mostrar alunos, turmas e
   vagas. Se aparecer 0, o card não foi lido.
2. **Ficha:** buscar um aluno conhecido; conferir turma, faltas e telefone contra o
   card. O link "Pasta no Drive" tem de abrir a pasta certa.
3. **Prontidão do semestre:** conferir que em Taubaté **não** aparece a pendência
   "livro não comprado" (lá a coluna não é caixa de seleção) e que em Caçapava
   aparece.
4. **Transferência, em modo simulação:** escolher um aluno de teste e clicar
   **Simular**. Ele mostra a linha de origem, a linha de destino e o caminho da
   pasta no Drive, sem escrever nada. Conferir e só então **Transferir agora**.
   Depois: no card, a linha nova preenchida e a antiga como "Transferido" sem RAF;
   no Drive, a pasta dentro do professor novo. Por fim testar o **Desfazer** em
   Movimentações e confirmar que tudo voltou.
5. **Padronização dos cards:** rodar a auditoria. Esperado: Caçapava conforme
   exceto `aditamento`; Taubaté fora do padrão, sem faltar nada essencial.
   **Não aplicar a normalização ainda** — ver "Decisões em aberto".
6. **Declaração:** gerar uma na ficha; ela baixa e é gravada na pasta do aluno.

### 5. Criar as contas

Painel da Direção → 👥 Equipe → **+ Criar usuário**: as secretárias com cargo
**Secretária**, e o **Davi** com cargo **Direção** e as duas escolas.

---

## Contexto que só existe na conversa anterior

### Os dois cards não são iguais (levantamento sobre as duas planilhas inteiras)

| | Caçapava | Taubaté |
|---|---|---|
| turmas | 28 | 22 |
| colunas de aluno | 28 | 16 |
| cronograma começa na coluna | 29 | 17 |
| `Final P.H.` | tem | não tem |

| coluna | Caçapava | Taubaté |
|---|---|---|
| 3 | STATUS | **Aditamento** |
| 4 | OBSERVAÇÕES | Status |
| **5** | **BOOK** | **Observação** |
| **6** | **BOOK COMPRADO** | **Livro** |
| 7 | RAF | RAF |
| 10–19 | simulados MET/FPA | não existem |
| 24 / 27 | Telefone do aluno / WhatsApp | não existem |

O código novo lê tudo **por rótulo**, com sinônimos, então funciona nas duas do
jeito que elas estão. Padronizar é opcional. Detalhes em
`fisk-hub/padronizacao-dos-cards.md`.

### O que a mineração dos cards mostrou (310 alunos, 50 turmas)

Números que motivaram os painéis e servem de referência para conferir se as telas
estão lendo certo:

- **89** alunos com livro definido e **não comprado**
- **36** sem RAF (sem RAF o aluno não existe para o Portal do Aluno)
- **38** sem telefone nenhum · **43** sem responsável (base 85% menor de 18)
- **33** contratos não aditados em Taubaté
- **52** alunos com anotação dentro do próprio nome (`MD 2º sem ok` em 39 deles,
  `Bolsista`, `Pagou ME anual`, e um `Aluno celíaco - intolerância a farinha`)
- **10** datas de nascimento escritas em DD/MM num campo MM/DD — e a coluna `Idade`
  é fórmula em cima delas, então essas idades estão erradas no card
- **11** turmas com 4 alunos ou menos; uma se chama literalmente `FECHAR TURMA`
- só **2** de 310 têm cronograma preenchido: o semestre começa **17/08**

### Achado do Drive (importante para a limpeza de nomes)

As pastas dos alunos usam o **nome limpo** (`Miguel Machado Da Silva Fleckenstein`,
` Ana Clara Gonçalves Andrade de Assis`, com espaço à esquerda). Ou seja, tirar a
anotação do nome no card **melhora** o casamento com a pasta, não piora. Foi isso
que liberou a funcionalidade de limpeza.

### Achado da Vercel

Todos os deploys aparecem com `creator: pedro-fisk`, inclusive os escritos pelo
Claude — a Vercel atribui ao dono da integração do GitHub, não a quem fez o commit.
Então compartilhar o login da Vercel com o Davi **não custa histórico**: a autoria
vive no Git, e lá o Davi entra com a conta dele.

### Estado do acesso do Davi

Usuário do GitHub: **`davifisk-design`** (confirmado). Caminho escolhido: colaborador
repo a repo (conta pessoal não permite liberar tudo de uma vez). O comando está em
`fisk-hub/onboarding-davi.md`, junto com os acessos de Google Drive, planilhas e
cards que ele também precisa. Vercel: sem plano pago, vai entrar com o login do Pedro.

### Não perca tempo com isto

- **Sondar o Web App por `curl` de fora não funciona** a partir de datacenter: o
  Google devolve uma página de interstício em vez de JSON. A verificação é pela
  própria página do portal (passo 2).
- O `Code.gs` de produção está **à frente** do que está versionado no repo. Nunca
  cole o repo por cima do editor.

---

## Decisões em aberto (não decida sozinho)

1. **Aplicar ou não a padronização dos cards.** O sistema funciona sem. Aplicar
   custa 1 coluna nova em Caçapava e 13 em Taubaté, e as fórmulas de `Idade` e
   `WhatsApp` nascem vazias nas colunas novas de Taubaté e precisam ser recriadas.
   O normalizador exige backup e simulação antes — mas a decisão é do Pedro.
2. **As palavras da coluna STATUS.** O portal escreve `Transferido`, `Desistente`,
   `Trancado`, `Aluno novo`. O card hoje usa `Matriculado`, `Rematriculado`,
   `Aluno novo` (e, em algumas linhas, no plural). Constante `SEC_STATUS`.
3. **A aba `Atrasados`.** O portal já passou a alimentá-la ao registrar contato.
   Falta decidir se ela continua sendo preenchida à mão em paralelo.

---

## Preferências e convenções

- **Idioma:** português do Brasil em tudo — conversa, commits, comentários, interface.
- **Comentários no código explicam *por quê*,** não *o quê*: registram a decisão e o
  que daria errado sem ela. É o padrão do projeto inteiro.
- **Sem travessão** em texto que o usuário lê (aluno ou professor).
- **Commits** em português, corpo explicando a motivação, rodapé
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **Não abrir PR** sem o Pedro pedir; ele prefere merge direto no `main`.
- **Verificar de verdade:** baixar a página publicada e procurar a marca, rodar o
  teste, olhar o card. Nunca "deve estar funcionando".
- **Apps Script:** sempre *editar a implantação existente* → Nova versão.
- **Não editar o `CardTools.gs`** do card: endpoints novos vão no `fisk-hub-backend`.
  Um projeto Apps Script só tem um `doPost`.
- **Chave nenhuma no front-end.** As páginas falam com o backend por token de sessão.
- O Pedro **não é programador**: explique em português claro e prefira **fazer** a instruir.

---

## Arquivos para abrir

- `fisk-hub/apps-script/COLAR-NO-CODE-GS.gs` — **o que colar**, com o passo a passo no cabeçalho
- `fisk-hub/apps-script/painel-secretaria.gs` — o portal (fonte versionada)
- `fisk-hub/apps-script/padronizacao-cards.gs` — camada canônica, auditoria, normalizador
- `fisk-hub/apps-script/teste-painel-secretaria.js` — `node` puro, sem tocar em nada;
  99 verificações sobre duas planilhas sintéticas nos formatos reais das duas escolas.
  **Rode antes de qualquer mudança no backend.**
- `fisk-hub/re-fresh-portal-secretaria.md` — o que é o portal, painel por painel
- `fisk-hub/padronizacao-dos-cards.md` — o padrão canônico e o bug do Book
- `fisk-hub/onboarding-davi.md` — todos os acessos do Davi, com os IDs
- `portal-aluno-fisk/secretaria.html` — a página (1.671 linhas, sem build)
