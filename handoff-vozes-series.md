# Handoff: gerar as vozes das séries da conversação (sessão local)

Escrito em 28/11/2026 pela sessão de nuvem, para o Pedro abrir uma sessão do Claude Code **no computador dele**.
O que falta aqui só roda aí: o `edge-tts` usa WebSocket, e o proxy do ambiente de nuvem não deixa passar.

## O pedido

Pedro, 28/11/2026: os botões 🔊 das atividades comunicativas (Buddy Talks, Countries, Everyday Life e YouTubers)
não tocavam e mostravam "Read aloud" para o professor ler. "Pode gerar pelo TTS e já deixar embutido dentro da
atividade mesmo, não precisa passar pela chave da Azure."

## O que já está pronto (ramo `claude/handoff-jogo-clicavel-x3xura`, fisk-hub e portal-aluno-fisk)

- `fisk-hub/scripts/series-vozes-textos.js`: monta cada atividade com o `assets/tema-slides.js` num Chromium e lista
  tudo o que tem 🔊 (os botões `data-ouvir`, as palavras do Important Words e a frase do "ouça e escolha").
  São **877 frases**, 853 arquivos distintos.
- `fisk-hub/scripts/series-vozes.py`: gera os mp3 com o edge-tts em `<série>/voz/<hash>.mp3` e escreve
  `<série>/voz/index.json`. Ele segue a regra da voz do CLAUDE.md do portal:
  - uma voz americana por atividade, alternando homens e mulheres;
  - nunca muda de voz dentro da atividade;
  - as setas de entonação ("isn't it? ↓") não são lidas.
  O script também apaga os mp3 que nenhuma atividade usa mais.
- `fisk-hub/conversacao.html`: ao abrir uma atividade das séries, lê o `voz/index.json` e toca o arquivo. Só cai
  na API da Azure (que hoje não tem chave na Vercel) quando falta o arquivo; sem os dois, mostra um aviso único no
  rodapé, que some sozinho.
- O celular do aluno recebe o endereço do mp3 de cada palavra (`vocabArq`, validado no `portal-aluno-fisk/api/aula.js`).
- Testado na bancada com um TTS de mentira: 853 arquivos e os quatro índices; a TV tocou o arquivo, sem aviso.
  `node scripts/aula.test.js` no portal: 88 testes ok.

Também no mesmo ramo, prontos e **não publicados**:
- as 22 faixas do livro dos Buddy Talks em `fisk-hub/buddy-talks/livro/`, tocando antes do Drive;
- o cronômetro do Pair Work nascendo desligado;
- o aviso de voz que não empilha mais.

## Passos da sessão local

1. Atualizar o ramo nos dois repositórios:
   `git fetch origin && git checkout claude/handoff-jogo-clicavel-x3xura && git pull`
2. No `fisk-hub`:
   ```
   pip install edge-tts
   python3 scripts/series-vozes.py --listar   # deve dizer "faltam 853 mp3"
   python3 scripts/series-vozes.py            # ~13 MB; precisa de Node com o playwright instalado
   python3 scripts/series-vozes.py --listar   # deve dizer "faltam 0 mp3"
   ```
   Se alguma frase falhar ("falharam N"), rode de novo: ele só gera o que falta.
3. **Ouça três ou quatro arquivos** de séries diferentes antes de commitar. Confira que é voz neural americana, que
   muda entre atividades e que a frase está certa. As duas reprovações da voz nesta casa foram descobertas
   ouvindo, não por teste.
4. Commitar as quatro pastas `buddy-talks/voz/`, `countries/voz/`, `everyday-life/voz/` e `youtubers/voz/`
   (`feat(conversacao): mp3 das vozes das series`), rodar `node scripts/conferir-publicacao.js` e dar push no ramo.
5. Publicar só se o Pedro disser "publica". A ordem é **portal primeiro**: os PRs dos dois ramos para o main. O
   portal precisa estar no ar antes do Hub, senão o `vocabArq` e a faixa do livro chegam a um servidor que os
   ignora. Isso não quebra nada, mas o celular fica sem o som.
6. Conferir no Chrome, num Buddy Talks:
   - o 🔊 do vocabulário fala;
   - o ▶ do "Let's practice" toca a faixa do livro;
   - "👥 Alunos" abre a aula, e no celular a palavra e a faixa tocam.

## Cuidados

- **Rode o `series-vozes.py` depois de qualquer `build-buddy-talks/countries/everyday/youtubers.js`.** Palavra nova sem
  mp3 cai na API e, sem ela, no aviso. Vale propor uma trava, como a do `sidequests.test.js` do portal: o
  `--listar` com saída diferente de zero quando faltar arquivo.
- As faixas do livro são material da editora e estão no repositório **público** do Hub, por decisão do Pedro
  (28/11/2026), com a ideia de tornar o repositório privado depois. ⚠️ O GitHub Pages num repositório privado só
  funciona em plano pago do GitHub. Tornar privado sem o plano tira o Hub do ar.
- As atividades do Conversation Maker continuam dependendo da Azure (`AZURE_SPEECH_KEY` e `AZURE_SPEECH_REGION` nas
  variáveis da Vercel do portal, que hoje não existem). Para ligar, coloque as duas pelo painel da Vercel e reimplante.
