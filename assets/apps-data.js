/* Os aplicativos que a franqueadora publica nas duas lojas.

   DUAS FONTES, e as duas importam:
   · a CIRCULAR 29/25 da Fundação Fisk ("Tabela atualizada dos recursos
     tecnológicos", jan/2025) — é ela que diz QUAL APP SERVE A QUAL SÉRIE, e
     nenhum levantamento de loja substitui isso;
   · o levantamento das lojas em 05/09/2026 — é ele que diz o que existe HOJE,
     com o endereço de cada um (ver portal-aluno-fisk/docs/apps-da-franqueadora.md
     para o método: a página de desenvolvedor do Play mostra só 20 apps e não
     pagina, então a lista completa saiu da App Store cruzada com sondagem de
     cada pacote no Play).

   As duas discordam em alguns pontos, e a circular já avisa por quê: "apps
   sendo renovados, alguns podem estar indisponíveis temporariamente". O campo
   `pendentes`, no fim, guarda essa diferença — é o que a franqueadora promete e
   a loja não entrega.

   ESTE ARQUIVO É A FONTE ÚNICA. O Portal do Aluno vai ler daqui, pela URL do
   GitHub Pages, em vez de ganhar uma cópia — duas listas de app viram, um dia,
   duas verdades sobre qual app o aluno deve baixar.

   Campos:
     tipo     'cyber'    o oficial da franqueadora, um por BLOCO de curso
              'fun'      o joguinho, um por LIVRO
              'geral'    vale para qualquer estágio
              'ra'       realidade aumentada, preso a um livro
              'escola'   NÃO é do aluno: uso interno da escola/professor
     blocos   em que parte do curso ele aparece (para o filtro da página)
     onde     texto curto que responde "em que estágio eu uso isto?"
     android  pacote no Google Play (null = não existe para Android)
     ios      id numérico na App Store (null = não existe para iPhone)
     web      quando o app TAMBÉM roda no navegador, o endereço. Só o Cyber
              Fisk 3.0 tem: é a mesma plataforma, e o aluno que não pode
              instalar (aparelho cheio, celular emprestado) entra por ali.
     icone    o ícone do app, baixado das lojas e servido POR ESTE REPOSITÓRIO
              (assets/apps/). A URL é absoluta de propósito: o Portal do Aluno
              lê este arquivo de outro domínio, e caminho relativo quebraria lá.
              Guardar o arquivo em vez de apontar para o CDN do Google evita
              tanto o ícone sumir quando a loja troca a URL quanto a família ser
              rastreada por um domínio de terceiro só para ver um logo.
     rx       EXPRESSÕES que casam com o estágio do aluno (o `book` do card).
              São strings, e não literais /.../, porque este arquivo é lido por
              dois consumidores — a página do Hub e o Portal do Aluno — e cada
              um compila com `new RegExp(src, 'i')`. Lista vazia = o app não
              pertence a estágio nenhum do portal (os de uso em sala).
              A régua de quem casa com o quê é a Circular 29/25, não o nome.
*/
window.FISK_APPS = {
  atualizado: '05/09/2026',
  /* Os blocos e, dentro de cada um, OS ESTÁGIOS QUE A ESCOLA DÁ. A pergunta
     que o professor faz não é "quais apps existem para Kids", é "o que o meu
     aluno do Teens Connect 2 precisa baixar" — então o estágio é o filtro que
     importa, e o bloco só agrupa (decisão do Pedro, 05/09/2026).

     Cada estágio é `{ n, ic }`: o NOME é o do CARD, porque é contra ele que as
     expressões `rx` de cada app são testadas — a mesma comparação que o Portal do Aluno faz com o
     `book` do aluno. Escrever aqui um nome que o card não usa quebra o filtro
     em silêncio.

     Estágio SEM app alguém tem: aparece assim mesmo, com a tela dizendo que não
     há. Esconder o estágio faria o professor procurar de novo achando que
     errou o clique. */
  blocos: [
    { id: 'kids', nome: 'Kids', hint: 'Magic Way, Playground e Fun', estagios: [
      { n: 'Magic Way - Yellow Book', ic: '🟡' }, { n: 'Magic Way - Blue Book',  ic: '🔵' },
      { n: 'Magic Way - Red Book',    ic: '🔴' }, { n: 'Magic Way - Green Book', ic: '🟢' },
      { n: 'Playground Hello A', ic: '👋' }, { n: 'Playground Hello B', ic: '🎈' },
      { n: 'Playground Slide',   ic: '🛝' }, { n: 'Playground See-Saw', ic: '⚖️' },
      { n: 'Playground Merry-go-round', ic: '🎠' }, { n: 'Playground Maze', ic: '🌀' },
      { n: 'Fun At Home', ic: '🏠' }, { n: 'Fun At School', ic: '🏫' },
      { n: 'Fun Around Town', ic: '🏙️' } ] },
    /* Teenstation e Teens Elementary 1 saíram em 05/09/2026: a escola não abre
       mais turma neles. O Elementary 2 fica porque é o Teens Connect 3. */
    { id: 'teens', nome: 'Teens', hint: 'Teens Connect e Elementary 2', estagios: [
      { n: 'Teens Connect 1', ic: '🔗' }, { n: 'Teens Connect 2', ic: '🔗' },
      { n: 'Teens Connect 3', ic: '🔗' }, { n: 'Teens Connect 4', ic: '🔗' },
      { n: 'Teens Elementary 2', ic: '🎒' } ] },
    { id: 'adultos', nome: 'Jovens e adultos', hint: 'Essentials a In Focus', estagios: [
      { n: 'Essentials 1', ic: '🌱' }, { n: 'Essentials 2', ic: '🌿' },
      { n: 'Transitions 1', ic: '🌤️' }, { n: 'Transitions 2', ic: '⛅' },
      { n: 'Fluency 1', ic: '🚀' }, { n: 'Fluency 2', ic: '🛰️' },
      { n: 'In Focus', ic: '🎯' }, { n: 'Pathways 3', ic: '🌐' } ] },
    /* Só os Inmediato (05/09/2026, decisão do Pedro): Chiquiteens, Español con
       Ñ e Conéctate saíram da lista de estágios. Os apps deles, quando houver,
       continuam aparecendo no bloco e na busca. */
    { id: 'espanhol', nome: 'Espanhol', hint: 'Inmediato 1, 2 e 3', estagios: [
      { n: 'Inmediato 1', ic: '🇪🇸' }, { n: 'Inmediato 2', ic: '🇪🇸' }, { n: 'Inmediato 3', ic: '🇪🇸' } ] },
    { id: 'escola', nome: 'Uso do professor em sala', hint: 'Não são para o aluno', estagios: [] }
  ],

  apps: [
    /* ── Cyber Fisk: o oficial, um por bloco ─────────────────────────────── */
    { nome: 'Cyber Fisk Kids Magic Way', tipo: 'cyber', blocos: ['kids'],
      onde: 'Magic Way — Yellow, Blue, Red e Green',
      desc: 'O Cyber Adventure do bloco Magic Way, com o Buddy. Um app para os quatro livros.',
      android: 'com.mbr.kidsadvmw', ios: '1454792618', rx: ['magic\\s*way'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fisk-kids-magic-way.png' },
    { nome: 'Cyber Fisk Kids Playground XP', tipo: 'cyber', blocos: ['kids'],
      onde: 'Playground — Hello A, Hello B, Slide, See-Saw, Merry-go-round e Maze',
      desc: 'A aventura do playground, com o menino e o cão Max. Um app para todo o bloco.',
      android: 'com.mbr.cyberplaygroundxp', ios: '1551331541', rx: ['playground'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fisk-kids-playground-xp.png' },
    { nome: 'Cyber Fisk Kids Fun XP', tipo: 'cyber', blocos: ['kids'],
      onde: 'Série Fun — At Home, At School e Around Town',
      desc: 'Objetos escondidos e tarefas para ajudar o personagem. Prática leve do inglês.',
      android: 'com.fisk.cyberkidsfunxp', ios: '6474543564', rx: ['fun\\s*at\\s*(home|school)', 'fun\\s*around\\s*town'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fisk-kids-fun-xp.png' },
    { nome: 'Cyber Fisk Teens', tipo: 'cyber', blocos: ['teens'],
      onde: 'séries Teens e Teenstation, todos os estágios',
      desc: 'O Cyber Adventure da versão Teens: desafios de memória, concentração e conteúdo.',
      android: 'com.mbr.cyberfiskteens', ios: '1496598511', rx: ['teens?\\s*connect', 'teens?\\s*elementary', 'elementary\\s*[12]', 'teen\\s*station|teenstation'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fisk-teens.png' },
    { nome: 'Cyber Fisk 3.0', tipo: 'cyber', blocos: ['adultos', 'espanhol'],
      onde: 'Essentials 1 a In Focus, e o espanhol — um app para todos',
      desc: 'A plataforma oficial do aluno de jovens e adultos. É um só para todos os estágios.',
      android: 'com.mbr.cyber30', ios: '1491785193', web: 'https://cyber.fisk.com.br:175/cyberfisknew/', rx: ['essentials', 'transitions?', 'fluency', 'in\\s*focus', 'speed\\s*[123]', 'inmediato'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fisk-3-0.png' },

    /* ── Cyber Fun: o joguinho, um por livro ─────────────────────────────── */
    { nome: 'Cyber Fun Magic Way', tipo: 'fun', blocos: ['kids'],
      onde: 'toda a série Magic Way — um app para os quatro livros',
      desc: 'Jogos e atividades em 3D ligados ao que o aluno está estudando.',
      android: 'com.fisk.funmagicway', ios: '6470053886', rx: ['magic\\s*way'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fun-magic-way.png' },
    { nome: 'Cyber Fun Essentials 1', tipo: 'fun', blocos: ['adultos'],
      onde: 'Essentials 1', desc: 'Jogos e atividades interativas do estágio.',
      android: 'com.mbr.funessentials1', ios: '1371568379', rx: ['essentials\\s*1'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fun-essentials-1.png' },
    { nome: 'Fun Transition 1', tipo: 'fun', blocos: ['adultos'],
      onde: 'Transitions 1', desc: 'Jogos e atividades interativas do estágio.',
      android: null, ios: '1340344275', rx: ['transitions?\\s*1'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/fun-transition-1.png' },
    { nome: 'Fun Fluency 1', tipo: 'fun', blocos: ['adultos'],
      onde: 'Fluency 1', desc: 'Jogos e atividades interativas do estágio.',
      android: null, ios: '1410751205', rx: ['fluency\\s*1'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/fun-fluency-1.png' },
    { nome: 'Fun Fluency 2', tipo: 'fun', blocos: ['adultos'],
      onde: 'Fluency 2', desc: 'Jogos e atividades interativas do estágio.',
      android: null, ios: '1463042362', rx: ['fluency\\s*2'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/fun-fluency-2.png' },
    { nome: 'Cyber Fun Speed 1', tipo: 'fun', blocos: ['adultos'],
      onde: 'série Speed', desc: 'Jogos e atividades da série Speed.',
      android: 'com.fisk.Speed1', ios: '1340297627', rx: ['speed\\s*1'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fun-speed-1.png' },
    { nome: 'Cyber Fun TE1', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Elementary 1', desc: 'Jogos e atividades em 3D do estágio.',
      android: 'com.mbr.te1', ios: '1425899564', rx: ['teens?\\s*elementary\\s*1', 'elementary\\s*1'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fun-te1.png' },
    { nome: 'Cyber Fun TE2', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Elementary 2 (= Teens Connect 3)', desc: 'Jogos e atividades em 3D do estágio.',
      android: 'com.fisk.te2', ios: '1425962079', rx: ['teens?\\s*elementary\\s*2', 'elementary\\s*2', 'teens?\\s*connect\\s*3'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fun-te2.png' },
    { nome: 'Cyber Fun TPI', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Pre Intermediate', desc: 'Jogos e atividades em 3D do estágio.',
      android: 'com.mbr.fisktpi', ios: '1483209536', rx: ['teens?\\s*pre[\\s-]*inter'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fun-tpi.png' },
    { nome: 'Cyber Fun TI', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Intermediate', desc: 'Jogos e atividades em 3D do estágio.',
      android: 'com.mbr.funteensintermediate', ios: '1492087588', rx: ['teens?\\s*intermediate'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fun-ti.png' },
    { nome: 'Cyber Fun TUI', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Upper Intermediate', desc: 'Jogos e atividades em 3D do estágio.',
      android: 'com.mbr.tui', ios: '1531354626', rx: ['teens?\\s*upper'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fun-tui.png' },
    { nome: 'Cyber Fun Teens Advanced', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Advanced', desc: 'Jogos e atividades exclusivas do estágio.',
      android: 'com.mbr.FISKFunTeensAdvanced', ios: '1599096355', rx: ['teens?\\s*advanced'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-fun-teens-advanced.png' },
    { nome: 'Cyber Diversión Inmediato 1', tipo: 'fun', blocos: ['espanhol'],
      onde: 'Inmediato 1', desc: 'Juegos y actividades interactivas del nivel.',
      android: 'com.mbr.funinmediato1', ios: '1446744336', rx: ['inmediato\\s*1'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-diversion-inmediato-1.png' },
    { nome: 'Cyber Diversión Inmediato 2', tipo: 'fun', blocos: ['espanhol'],
      onde: 'Inmediato 2', desc: 'Juegos y actividades interactivas del nivel.',
      android: 'com.mbr.funinmediato2', ios: '1447231275', rx: ['inmediato\\s*2'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-diversion-inmediato-2.png' },
    { nome: 'Cyber Diversión Inmediato 3', tipo: 'fun', blocos: ['espanhol'],
      onde: 'Inmediato 3', desc: 'Juegos y actividades interactivas del nivel.',
      android: 'com.mbrgames.inmediato3', ios: '1505417881', rx: ['inmediato\\s*3'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/cyber-diversion-inmediato-3.png' },

    /* ── Realidade aumentada: presos a um livro ──────────────────────────── */
    { nome: 'Fisk RA Hello A', tipo: 'ra', blocos: ['kids'], onde: 'Playground Hello A',
      desc: 'Aponta a câmera para a página e a atividade ganha vida, com o Buddy.',
      android: 'com.Mirage.FiskHelloAAR', ios: '1551687036', rx: ['playground\\s*hello\\s*a', 'hello\\s*a'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/fisk-ra-hello-a.png' },
    { nome: 'Fisk RA Hello B', tipo: 'ra', blocos: ['kids'], onde: 'Playground Hello B',
      desc: 'Aponta a câmera para a página e a atividade ganha vida, com o Buddy.',
      android: 'com.Mirage.FiskRAHelloB', ios: '1577350854', rx: ['playground\\s*hello\\s*b', 'hello\\s*b'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/fisk-ra-hello-b.png' },

    /* ── Genéricos: valem para qualquer estágio ──────────────────────────── */
    { nome: 'My Buddy Fisk', tipo: 'geral', blocos: ['kids'],
      onde: 'público infantil em geral, sem estágio certo',
      desc: 'Conversa com o Buddy em realidade aumentada, mini-games e medalhas.',
      android: 'com.manifesto.mybuddyfisk', ios: '1266673805', rx: ['magic\\s*way', 'playground', 'fun\\s*at', 'chiquiteens', 'con[eé]ctate'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/my-buddy-fisk.png' },
    { nome: 'List of Verbs', tipo: 'geral', blocos: ['teens', 'adultos'],
      onde: 'público em geral, sem estágio certo', desc: 'Verbos regulares e irregulares com pronúncia, tradução, exemplo e jogos.',
      android: 'com.mbr.listOfVerbs', ios: '1276545843', rx: ['teens?\\s*connect', 'elementary', 'teen\\s*station|teenstation', 'essentials', 'transitions?', 'fluency', 'in\\s*focus', 'speed'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/list-of-verbs.png' },
    /* ⚠️ O QR NÃO É DE TODO ESTÁGIO. A circular lista onde ele vale, e o Magic
       Way, o Hello A/B, a série Fun e os Teens ficam de fora — indicar o app a
       quem não tem QR no livro é mandar a família baixar um leitor que não
       serve para nada. */
    { nome: 'Fisk QR Code', tipo: 'geral', blocos: ['kids', 'adultos', 'espanhol'],
      onde: 'Playground (Slide, See-saw, Merry-go-round, Maze), Speed 1/2/3, Essentials 1/2, Transitions 1/2, Fluency 1/2, In Focus e Inmediato 1/2/3',
      desc: 'Lê o QR impresso no livro e leva direto à atividade daquela lição.',
      android: 'com.mbr.fiskqrcode', ios: '1031702838', rx: ['playground\\s*(slide|see|merry|maze)', 'slide', 'see.?saw', 'merry', 'maze', 'speed', 'essentials', 'transitions?', 'fluency', 'in\\s*focus', 'inmediato'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/fisk-qr-code.png' },
    { nome: 'Fisk e-book Speed', tipo: 'geral', blocos: ['adultos'],
      onde: 'Speed 1, 2 e 3', desc: 'O leitor dos livros da série Speed.',
      android: 'com.mbr.NewFiskeBook', ios: '1585643280', rx: ['speed'], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/fisk-e-book-speed.png' },

    /* ── Da escola: nunca vão para o aluno ───────────────────────────────── */
    { nome: 'Fisk Helper', tipo: 'escola', blocos: ['escola'],
      onde: 'na sala de aula, no seu aparelho',
      desc: 'O livro digital para a aula: escolhe o livro, a lição e a PÁGINA, e abre a arte da página com o áudio no lugar certo, mais os jogos e o guia da atividade. A loja diz "de uso exclusivo nas escolas Fisk".',
      android: 'com.slidehelper.fisk', ios: null, rx: [], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/fisk-helper.png' },
    { nome: 'New Fisk Player', tipo: 'escola', blocos: ['escola'],
      onde: 'curso personalizado, uso da unidade',
      desc: 'Tocador dos áudios dos livros. A própria loja avisa: "uso exclusivo para unidades, não destinado a alunos".',
      android: 'com.mbr.playerfisk', ios: null, rx: [], icone: 'https://pedro-fisk.github.io/fisk-hub/assets/apps/new-fisk-player.png' }
  ],

  /* O QUE A CIRCULAR PROMETE E A LOJA NÃO TEM (conferido em 05/09/2026).
     Fica registrado para ninguém refazer a busca achando que passou batido, e
     para a escola poder cobrar da franqueadora. A própria circular explica:
     "apps sendo renovados, alguns podem estar indisponíveis temporariamente". */
  pendentes: [
    { nome: 'Cyber Fisk Kids Have Fun', onde: 'série Have Fun (3 e 4)',
      nota: 'não está em nenhuma das duas lojas. A série não é usada por nós.' },
    { nome: 'Cyber Fun Essentials 2', onde: 'Essentials 2', nota: 'a circular prevê, a loja não tem.' },
    { nome: 'Cyber Fun Transitions 2', onde: 'Transitions 2', nota: 'a circular prevê, a loja não tem.' },
    { nome: 'Cyber Fun In Focus', onde: 'In Focus', nota: 'a circular prevê, a loja não tem.' },
    { nome: 'Cyber Fun Teens Higher 1 / 2', onde: 'Teens Higher 1 e 2', nota: 'a circular prevê, a loja não tem.' }
  ]
};
