# O backend não mora mais aqui

Até 04/08/2026 esta pasta guardava cópias do backend: o `Code.gs`, os blocos
`painel-secretaria.gs` / `padronizacao-cards.gs`, e o `COLAR-NO-CODE-GS.gs` —
este último feito para ser **colado à mão** no editor do Apps Script.

Isso criava **duas fontes para o mesmo backend**: a daqui e a do repositório
`Pedro-Fisk/fisk-hub-backend`, que o `clasp` publica. Duas fontes significam que
uma pessoa pode publicar por cima do trabalho da outra **sem conflito e sem
aviso** — o editor do Apps Script não tem merge, e quem salva por último apaga o
resto.

## A fonte única do backend é `Pedro-Fisk/fisk-hub-backend/Code.js`

- **Publicar:** `clasp push`, depois *Implantar → Gerenciar implantações →
  lápis → Nova versão*.
- **Nunca "Nova implantação"**: isso troca a URL do Web App e derruba Hub,
  Portal do Aluno, Painel da Direção e Portal da Secretaria de uma vez.
- **Um `doPost` só** por projeto do Apps Script. Endpoint novo entra no
  `Code.js`, não no `CardTools.gs` do card.

## O teste do leitor do card

Foi para `fisk-hub-backend/scripts/testes/secretaria/`, junto do código que ele
testa:

```bash
node scripts/testes/secretaria/painel-secretaria.test.js
```

Ele roda em Node, com uma planilha sintética no formato real, e não toca em nada
que está no ar. A primeira coisa que ele faz é conferir se as suas fixtures
ainda batem com o `Code.js` — se alguém mexer num e esquecer do outro, o teste
para e avisa, em vez de ficar verde testando código morto.
