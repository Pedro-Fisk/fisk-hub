# Segurança do ecossistema Fisk Hub / Portal do Aluno

Guia prático, em ordem de prioridade. Última revisão: 27/07/2026.

## O que já está certo (para tranquilizar)

- **Nenhum dado de aluno mora no código.** Nomes, RAFs, notas, faltas e turmas
  ficam nas planilhas do Google e só saem de lá via Apps Script, na hora, para
  quem faz a consulta. Auditei os arquivos e o histórico do git dos dois
  repositórios: não há dados pessoais gravados neles.
- **O repositório `portal-aluno-fisk` já é privado** no GitHub.
- Senhas de professores e da direção ficam **com hash no servidor**, e o painel
  da direção usa token de sessão que expira em 6 horas. Bom desenho.

## O problema real, em uma frase

O risco não é o aluno "ver a página no GitHub" — é que **a chave da API do
card (`API_KEY`) está num repositório público e no código-fonte que chega a
qualquer navegador**, e que **o login do aluno é só o código RAF, sem senha**.
Quem tiver a chave consulta boletins de qualquer RAF; quem souber um RAF vê
nome, turma, notas e faltas daquele aluno.

## Checklist do que SÓ VOCÊ pode fazer (em ordem)

### 1. Tornar os repositórios privados (10 min) — o mais urgente

Em cada repositório: **Settings → General → Danger Zone → Change visibility →
Make private**. Repositórios que hoje estão públicos:

- `fisk-hub` ← contém a API_KEY, prioridade máxima
- `boletim-fisk`
- `planner-fisk`
- `fisk-simulador`
- `met-siele-simulador`
- `conversation-maker`

**Atenção:** os sites servidos pelo **GitHub Pages param de funcionar** quando
o repositório vira privado (no plano gratuito). Por isso, faça o passo 2 antes
(ou logo em seguida, aceitando alguns minutos fora do ar).

### 2. Migrar os sites do GitHub Pages para a Vercel (15 min por site)

A Vercel **hospeda repositório privado de graça** — o Portal do Aluno já
funciona exatamente assim. Não muda nada no código; só o endereço.

Para cada site (fisk-hub, fisk-simulador, met-siele-simulador…):

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório
   (Framework preset: **Other**, sem build — é site estático). Deploy.
2. Anote a nova URL (ex.: `fisk-hub.vercel.app`).
3. Atualize os links que apontavam para `pedro-fisk.github.io/...`:
   - **fisk-hub**: `met.html` e `quick-practice.html` (links dos simuladores);
   - **portal-aluno-fisk**: `config.js` (bloco `tools`) e `diretor.html`
     (dois links `pedro-fisk.github.io/fisk-hub/...`).
4. Só então torne o repositório privado (passo 1).

### 3. Trocar (rotacionar) a API_KEY do card

A chave `fisk-cards-2026-…` ficou exposta enquanto o `fisk-hub` era público —
considere que ela está queimada. Depois que os repositórios estiverem
privados:

1. Invente uma chave nova (longa, aleatória — ex. gerada em bitwarden.com/password-generator).
2. No projeto Apps Script do card, troque o valor da chave
   (Propriedades do script / constante `FISK_CHAVE` no `Code.js`).
3. Atualize a chave nos arquivos que a usam e publique:
   - `fisk-hub`: `termo-atraso.html`, `planejador.html`, `visao-geral.html`,
     `2nd-chance.html` (linha `var API_KEY = ...` em cada um);
   - `portal-aluno-fisk`: defina a variável de ambiente `BOLETIM_KEY` na
     Vercel (Settings → Environment Variables) **ou** edite `api/boletins.js`.
4. Teste um boletim no portal e um "salvar PDF" numa ferramenta do Hub.

> Enquanto o `fisk-hub` for servido como site estático, a chave continua
> visível no código-fonte das páginas para quem abrir o "ver código-fonte" —
> igual ao que o portal fazia antes do proxy. O passo 3 reduz o dano (chave
> antiga morta); a solução definitiva é o passo 5.

### 4. Domínio próprio (não precisa migrar nada)

Você NÃO precisa tirar o site da Vercel para ter domínio próprio — a Vercel
foi feita para isso:

1. Registre um domínio (ex. `portalfisk.com.br` no registro.br, ~R$ 40/ano).
2. No projeto da Vercel: **Settings → Domains → Add** e siga as instruções
   de DNS. Pronto: `portal.seudominio.com.br` passa a servir o portal.
3. O endereço `*.vercel.app` continua existindo; dá para configurá-lo como
   redirecionamento para o domínio novo na mesma tela.

### 5. (Próxima etapa, com ajuda do Claude) Endurecer o backend

O que mais protege os dados dos alunos daqui em diante — tudo no Apps Script
e no proxy da Vercel, sem mudar a experiência de ninguém:

- **Login do aluno:** hoje `?action=login&raf=` devolve nome/turma/book para
  qualquer um que chute um RAF. Melhorias: limitar tentativas por IP/minuto
  (CacheService), mensagens de erro genéricas, e considerar pedir RAF **+
  data de nascimento** (continua simples para o aluno, quase impossível de
  enumerar).
- **Ferramentas do Hub:** trocar a API_KEY fixa por validação do token de
  sessão do professor no card (o token SSO já existe no Hub — é estender ao
  card), ou servir o Hub na Vercel e chamar o card via proxy serverless,
  como o portal já faz com os boletins.

## O que este branch já mudou

- `<meta name="robots" content="noindex, nofollow">` em todas as páginas —
  Google e outros buscadores não indexam as ferramentas nem o portal.
- `robots.txt` (passa a valer quando o site estiver na Vercel).
- A API_KEY foi removida da documentação (`re-fresh-fisk-hub.md`) e da cópia
  de referência `apps-script/salvar-no-drive.gs` — ela só precisa existir nos
  HTML que a usam e no servidor.
- No portal: a chave saiu do navegador (proxy `/api/boletins`), cabeçalhos de
  segurança e bloqueio de indexação (`vercel.json`, `robots.txt`, metas).

## Por que "esconder o front-end" não é o caminho

Todo site que o aluno abre entrega HTML/JS ao navegador — "ver código-fonte"
sempre vai existir, em qualquer hospedagem ou domínio. A proteção de verdade
é garantir que **o código visível não contenha nada secreto** (chaves, dados)
e que **o servidor só responda o que aquele usuário pode ver**. É exatamente
o que este plano constrói, na ordem: repositórios privados → chave nova fora
do alcance → backend que valida quem pergunta.
