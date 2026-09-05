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
*/
window.FISK_APPS = {
  atualizado: '05/09/2026',
  blocos: [
    { id: 'kids',     nome: 'Kids',              hint: 'Magic Way, Playground e Fun' },
    { id: 'teens',    nome: 'Teens',             hint: 'Teens Connect e Elementary' },
    { id: 'adultos',  nome: 'Jovens e adultos',  hint: 'Essentials a In Focus' },
    { id: 'espanhol', nome: 'Espanhol',          hint: 'Inmediato 1, 2 e 3' },
    { id: 'pbf',      nome: 'Bilíngue (PBF)',    hint: 'Programa Bilíngue Fisk' },
    { id: 'escola',   nome: 'Só da escola',      hint: 'Não são para o aluno' }
  ],
  apps: [
    /* ── Cyber Fisk: o oficial, um por bloco ─────────────────────────────── */
    { nome: 'Cyber Fisk Kids Magic Way', tipo: 'cyber', blocos: ['kids'],
      onde: 'Magic Way — Yellow, Blue, Red e Green',
      desc: 'O Cyber Adventure do bloco Magic Way, com o Buddy. Um app para os quatro livros.',
      android: 'com.mbr.kidsadvmw', ios: '1454792618' },
    { nome: 'Cyber Fisk Kids Playground XP', tipo: 'cyber', blocos: ['kids'],
      onde: 'Playground — Hello A, Hello B, Slide, See-Saw, Merry-go-round e Maze',
      desc: 'A aventura do playground, com o menino e o cão Max. Um app para todo o bloco.',
      android: 'com.mbr.cyberplaygroundxp', ios: '1551331541' },
    { nome: 'Cyber Fisk Kids Fun XP', tipo: 'cyber', blocos: ['kids'],
      onde: 'Série Fun — At Home, At School e Around Town',
      desc: 'Objetos escondidos e tarefas para ajudar o personagem. Prática leve do inglês.',
      android: 'com.fisk.cyberkidsfunxp', ios: '6474543564' },
    { nome: 'Cyber Fisk Teens', tipo: 'cyber', blocos: ['teens'],
      onde: 'séries Teens e Teenstation, todos os estágios',
      desc: 'O Cyber Adventure da versão Teens: desafios de memória, concentração e conteúdo.',
      android: 'com.mbr.cyberfiskteens', ios: '1496598511' },
    { nome: 'Cyber Fisk 3.0', tipo: 'cyber', blocos: ['adultos', 'espanhol'],
      onde: 'Essentials 1 a In Focus, e o espanhol — um app para todos',
      desc: 'A plataforma oficial do aluno de jovens e adultos. É um só para todos os estágios.',
      android: 'com.mbr.cyber30', ios: '1491785193' },
    { nome: 'Cyber PBF 4.0', tipo: 'cyber', blocos: ['pbf'],
      onde: 'Programa Bilíngue Fisk',
      desc: 'A plataforma do Programa Bilíngue. Não é usada nos cursos livres.',
      android: 'com.FISK.CyberPBF4', ios: '1576558734' },

    /* ── Cyber Fun: o joguinho, um por livro ─────────────────────────────── */
    { nome: 'Cyber Fun Magic Way', tipo: 'fun', blocos: ['kids'],
      onde: 'toda a série Magic Way — um app para os quatro livros',
      desc: 'Jogos e atividades em 3D ligados ao que o aluno está estudando.',
      android: 'com.fisk.funmagicway', ios: '6470053886' },
    { nome: 'Cyber Fun Essentials 1', tipo: 'fun', blocos: ['adultos'],
      onde: 'Essentials 1', desc: 'Jogos e atividades interativas do estágio.',
      android: 'com.mbr.funessentials1', ios: '1371568379' },
    { nome: 'Fun Transition 1', tipo: 'fun', blocos: ['adultos'],
      onde: 'Transitions 1', desc: 'Jogos e atividades interativas do estágio.',
      android: null, ios: '1340344275' },
    { nome: 'Fun Fluency 1', tipo: 'fun', blocos: ['adultos'],
      onde: 'Fluency 1', desc: 'Jogos e atividades interativas do estágio.',
      android: null, ios: '1410751205' },
    { nome: 'Fun Fluency 2', tipo: 'fun', blocos: ['adultos'],
      onde: 'Fluency 2', desc: 'Jogos e atividades interativas do estágio.',
      android: null, ios: '1463042362' },
    { nome: 'Cyber Fun Speed 1', tipo: 'fun', blocos: ['adultos'],
      onde: 'série Speed', desc: 'Jogos e atividades da série Speed.',
      android: 'com.fisk.Speed1', ios: '1340297627' },
    { nome: 'Cyber Fun TE1', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Elementary 1', desc: 'Jogos e atividades em 3D do estágio.',
      android: 'com.mbr.te1', ios: '1425899564' },
    { nome: 'Cyber Fun TE2', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Elementary 2 (= Teens Connect 3)', desc: 'Jogos e atividades em 3D do estágio.',
      android: 'com.fisk.te2', ios: '1425962079' },
    { nome: 'Cyber Fun TPI', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Pre Intermediate', desc: 'Jogos e atividades em 3D do estágio.',
      android: 'com.mbr.fisktpi', ios: '1483209536' },
    { nome: 'Cyber Fun TI', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Intermediate', desc: 'Jogos e atividades em 3D do estágio.',
      android: 'com.mbr.funteensintermediate', ios: '1492087588' },
    { nome: 'Cyber Fun TUI', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Upper Intermediate', desc: 'Jogos e atividades em 3D do estágio.',
      android: 'com.mbr.tui', ios: '1531354626' },
    { nome: 'Cyber Fun Teens Advanced', tipo: 'fun', blocos: ['teens'],
      onde: 'Teens Advanced', desc: 'Jogos e atividades exclusivas do estágio.',
      android: 'com.mbr.FISKFunTeensAdvanced', ios: '1599096355' },
    { nome: 'Cyber Diversión Inmediato 1', tipo: 'fun', blocos: ['espanhol'],
      onde: 'Inmediato 1', desc: 'Juegos y actividades interactivas del nivel.',
      android: 'com.mbr.funinmediato1', ios: '1446744336' },
    { nome: 'Cyber Diversión Inmediato 2', tipo: 'fun', blocos: ['espanhol'],
      onde: 'Inmediato 2', desc: 'Juegos y actividades interactivas del nivel.',
      android: 'com.mbr.funinmediato2', ios: '1447231275' },
    { nome: 'Cyber Diversión Inmediato 3', tipo: 'fun', blocos: ['espanhol'],
      onde: 'Inmediato 3', desc: 'Juegos y actividades interactivas del nivel.',
      android: 'com.mbrgames.inmediato3', ios: '1505417881' },
    { nome: 'Cyber Fun NS1', tipo: 'fun', blocos: ['pbf'], onde: 'New Station 1',
      desc: 'Atividades interativas e jogos em 3D do Programa Bilíngue.',
      android: 'com.mbr.PBFFunNewStation1', ios: '1615387760' },
    { nome: 'Cyber Fun NS2', tipo: 'fun', blocos: ['pbf'], onde: 'New Station 2',
      desc: 'Atividades interativas e jogos em 3D do Programa Bilíngue.',
      android: null, ios: '1615392672' },
    { nome: 'Cyber Fun MT1', tipo: 'fun', blocos: ['pbf'], onde: 'My Team 1',
      desc: 'Jogos do Programa Bilíngue.',
      android: 'com.mbr.pbfmyteam1', ios: '1617618048' },
    { nome: 'Cyber Fun MT2', tipo: 'fun', blocos: ['pbf'], onde: 'My Team 2',
      desc: 'Jogos do Programa Bilíngue.',
      android: 'com.mbr.projetobilinguefiskmyteam2', ios: '1617622104' },
    { nome: 'Cyber Fun GT', tipo: 'fun', blocos: ['pbf'], onde: 'Great Time',
      desc: 'Jogos do Programa Bilíngue.',
      android: 'com.mbr.PBFFunGreatTime', ios: '1633651764' },

    /* ── Realidade aumentada: presos a um livro ──────────────────────────── */
    { nome: 'Fisk RA Hello A', tipo: 'ra', blocos: ['kids'], onde: 'Playground Hello A',
      desc: 'Aponta a câmera para a página e a atividade ganha vida, com o Buddy.',
      android: 'com.Mirage.FiskHelloAAR', ios: '1551687036' },
    { nome: 'Fisk RA Hello B', tipo: 'ra', blocos: ['kids'], onde: 'Playground Hello B',
      desc: 'Aponta a câmera para a página e a atividade ganha vida, com o Buddy.',
      android: 'com.Mirage.FiskRAHelloB', ios: '1577350854' },

    /* ── Genéricos: valem para qualquer estágio ──────────────────────────── */
    { nome: 'My Buddy Fisk', tipo: 'geral', blocos: ['kids'],
      onde: 'público infantil em geral, sem estágio certo',
      desc: 'Conversa com o Buddy em realidade aumentada, mini-games e medalhas.',
      android: 'com.manifesto.mybuddyfisk', ios: '1266673805' },
    { nome: 'List of Verbs', tipo: 'geral', blocos: ['teens', 'adultos'],
      onde: 'público em geral, sem estágio certo', desc: 'Verbos regulares e irregulares com pronúncia, tradução, exemplo e jogos.',
      android: 'com.mbr.listOfVerbs', ios: '1276545843' },
    /* ⚠️ O QR NÃO É DE TODO ESTÁGIO. A circular lista onde ele vale, e o Magic
       Way, o Hello A/B, a série Fun e os Teens ficam de fora — indicar o app a
       quem não tem QR no livro é mandar a família baixar um leitor que não
       serve para nada. */
    { nome: 'Fisk QR Code', tipo: 'geral', blocos: ['kids', 'adultos', 'espanhol'],
      onde: 'Playground (Slide, See-saw, Merry-go-round, Maze), Speed 1/2/3, Essentials 1/2, Transitions 1/2, Fluency 1/2, In Focus e Inmediato 1/2/3',
      desc: 'Lê o QR impresso no livro e leva direto à atividade daquela lição.',
      android: 'com.mbr.fiskqrcode', ios: '1031702838' },
    { nome: 'Fisk e-book Speed', tipo: 'geral', blocos: ['adultos'],
      onde: 'Speed 1, 2 e 3', desc: 'O leitor dos livros da série Speed.',
      android: 'com.mbr.NewFiskeBook', ios: '1585643280' },

    /* ── Da escola: nunca vão para o aluno ───────────────────────────────── */
    { nome: 'Fisk Helper', tipo: 'escola', blocos: ['escola'],
      onde: 'na sala de aula, no seu aparelho',
      desc: 'O livro digital para a aula: escolhe o livro, a lição e a PÁGINA, e abre a arte da página com o áudio no lugar certo, mais os jogos e o guia da atividade. A loja diz "de uso exclusivo nas escolas Fisk".',
      android: 'com.slidehelper.fisk', ios: null },
    { nome: 'New Fisk Player', tipo: 'escola', blocos: ['escola'],
      onde: 'curso personalizado, uso da unidade',
      desc: 'Tocador dos áudios dos livros. A própria loja avisa: "uso exclusivo para unidades, não destinado a alunos".',
      android: 'com.mbr.playerfisk', ios: null }
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
