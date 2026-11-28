/* O CONTEÚDO DAS ATIVIDADES "COUNTRIES 🚩" (Drive Master › Countries 🚩), transcrito dos PowerPoints em 28/11/2026.
 * Fonte da verdade do texto; quem vira slide é scripts/build-countries.js. Erros de digitação do original foram
 * corrigidos (Skelling → Skellig, Indi → Hindi, Macchu Pichu → Machu Picchu, IRELAD → IRELAND).
 *
 * Foto com fundo: true só serve de fundo aos slides (não ganha slide próprio: o original não tinha).
 * Cada país: { chave, num, nome, oficial, cor, bandeira, capa, capaLocal, mapa, texto, fatos, fotos, video, niveis }
 * Cada nível: { id, rotulo, niveis (o filtro da lista), objetivos, intro, warmup, fotos?, vocab, tf, quiz, leitura,
 *               conversa, avaliacao }. O que o nível não traz, herda do país.
 * Perguntas: [pergunta, ...respostas-modelo]. Vocabulário: [palavra, tradução]. V/F: [frase, true|false, explicação].
 */
'use strict';

const AVALIA = (pais) => [`Did you enjoy talking about ${pais}?`, 'Which other countries would you like to learn more about?'];

module.exports = [
  /* ═════════ 01 · JAPAN ═════════ (as fotos são do Inglês do Mundo do portal: os PowerPoints passam do limite de
     download do conector; créditos em countries/img/jp/CREDITOS.md) */
  {
    chave: 'japan', num: 1, nome: 'Japan', cor: '#bc002d', bandeira: 'jp/bandeira.svg', capa: 'jp/capa.jpg', capaLocal: 'Chureito Pagoda and Mount Fuji',
    introSub: 'Japanese food, traditions and culture',
    fotos: [
      { img: 'jp/ramen.jpg', titulo: 'Food', local: 'Ramen', texto: 'Japanese food is famous all over the world: sushi, ramen, tempura… Sushi is made with rice and, many times, raw fish.' },
      { img: 'jp/kyoto.jpg', titulo: 'Origami & traditions', local: 'Kyoto', texto: 'Origami is the Japanese art of folding paper into shapes, like birds and flowers.' },
      { img: 'jp/fuji.jpg', titulo: 'Samurais', local: 'Mount Fuji', texto: 'Samurais were the warriors of old Japan, famous for their honor and discipline.' },
      { img: 'jp/shibuya.jpg', titulo: 'Anime', local: 'Shibuya, Tokyo', texto: 'Anime is the Japanese style of animation, loved all over the world.' },
      { img: 'jp/tokyo.jpg', local: 'Tokyo', fundo: true },
    ],
    niveis: [
      {
        id: 'basic', rotulo: 'Basic & Teens', niveis: ['Basic', 'Teens'],
        objetivos: ['Talking about Japanese culture.', 'Developing conversation skills.'],
        intro: 'Today, we’ll talk about Japan. We’ll take a look at Japanese food, traditions and culture.',
        warmup: [
          ['How well do you know Japanese culture?', 'I don’t know a lot about it.', 'I know it very well.', 'Actually, I only know (origami).'],
          ['Would you like to visit Japan?', 'Sure, it’d be amazing!', 'Actually, I’d like to visit…', 'I don’t think so.'],
        ],
        vocab: [['raw', 'cru'], ['to fold', 'dobrar']],
        conversa: [
          ['Do you know Japanese food?', 'Sure, I do. I love it!', 'I know it, but I don’t like it.', 'I have never tried it.'],
          ['Do you like to eat raw fish?', 'Gosh, no! It’s terrible!', 'Actually, I like it very much.', 'I have never tried it.'],
          ['Do you know how to fold origami?', 'Yeah, I know how to fold a (bird).', 'No, but I’d like to learn.', 'No, I’m not interested in it.'],
          ['Are you good at manual skills, such as drawing, painting, etc?', 'Not very much. I don’t know how to draw!', 'Not at all, but I really like (drawing).', 'Yeah, I’m very good at it.'],
          ['Would you like to be a samurai?', 'Yeah, it must be amazing!', 'Actually, I don’t think so.'],
          ['Do you know any anime?', 'Sure! I know (Dragon Ball Z).', 'Actually, I don’t think so.', 'I know a lot of them!'],
          ['Which cartoons are/were part of your childhood?', '(Powerpuff Girls) were part of my childhood.'],
        ],
        avaliacao: ['Did you enjoy talking about Japanese culture?', 'Which other countries would you like to learn more about? I’d like to know more about... (France).'],
      },
      {
        id: 'intermediate', rotulo: 'Intermediate', niveis: ['Intermediate'],
        objetivos: ['Talking about Japanese culture.', 'Developing conversation skills.'],
        intro: 'Today, we’ll talk about Japan. We’ll take a look at Japanese food, traditions and culture.',
        warmup: [['How well do you know Japanese culture?'], ['Would you like to visit Japan?']],
        vocab: [['raw', 'cru'], ['to fold', 'dobrar']],
        conversa: [
          ['Are you familiar with Japanese food?'],
          ['Do you like to eat raw fish?'],
          ['Do you know how to fold origami?', 'Yeah, I know how to fold a (bird).', 'No, but I’d like to learn.', 'No, I’m not interested in it.'],
          ['Are you good at manual skills, such as drawing, painting, etc?'],
          ['Folding origami requires a lot of patience. Are you a patient person?'],
          ['Would you like to be a samurai?'],
          ['Which skills must a samurai have?'],
          ['Do you know any anime?'],
          ['Which cartoons were part of your childhood?'],
        ],
        avaliacao: ['Did you enjoy talking about Japanese culture?', 'Which other countries would you like to learn more about? I’d like to know more about... (France).'],
      },
      {
        id: 'advanced', rotulo: 'Advanced', niveis: ['Advanced'],
        objetivos: ['Talking about Japanese culture.', 'Developing conversation skills.'],
        intro: 'Today, we’ll talk about Japan. We’ll take a look at Japanese food, traditions and culture.',
        warmup: [['How well do you know Japanese culture?'], ['Would you like to visit Japan?'], ['When you think of Japan, what comes to your mind?']],
        vocab: [['raw', 'cru'], ['to fold', 'dobrar']],
        conversa: [
          ['Are you familiar with Japanese food?'],
          ['Have you ever tried eating raw fish?'],
          ['Do you know how to fold origami?'],
          ['Folding origami requires a lot of patience. Are you a patient person?'],
          ['Do you have any manual skills?'],
          ['Would you like to be a samurai?'],
          ['Which skills must a samurai have?'],
          ['Do you know any anime?'],
          ['Which cartoons were part of your childhood?'],
          ['Japan is considered a developed country. Would you agree? Why?'],
          ['Japan is known for its culture of hard work. What’s your opinion about this?'],
        ],
        avaliacao: ['Did you enjoy talking about Japanese culture?', 'Which other countries would you like to learn more about?'],
      },
    ],
  },

  /* ═════════ 02 · USA ═════════ */
  {
    chave: 'usa', num: 2, nome: 'USA', oficial: 'United States of America', cor: '#b22234', bandeira: 'us/bandeira.svg', capa: 'us/nyc.jpg', capaLocal: 'New York',
    introSub: 'Food, Hollywood, Times Square and California',
    fotos: [
      { img: 'us/burger.jpg', titulo: 'Food', local: 'Hamburger', texto: 'Hamburgers are considered America’s traditional food.' },
      { img: 'us/hollywood.jpg', titulo: 'Hollywood', local: 'Los Angeles', texto: 'Hollywood is the American city where movies are made.' },
      { img: 'us/timessquare.jpg', titulo: 'Times Square', local: 'New York', texto: 'Times Square is New York’s biggest marketplace.' },
      { img: 'us/california.jpg', titulo: 'California', local: 'California', texto: 'California, the “Golden Coast” of America.' },
      { img: 'us/goldengate.jpg', local: 'Golden Gate Bridge, San Francisco', fundo: true },
      { img: 'us/liberty.jpg', local: 'Statue of Liberty, New York', fundo: true },
    ],
    niveis: [
      {
        id: 'basic', rotulo: 'Basic & Teens', niveis: ['Basic', 'Teens'],
        objetivos: ['Talking about American culture.', 'Developing conversation skills.'],
        intro: 'Today, we’ll talk about American culture. We’ll discuss American food, Hollywood, Times Square and California.',
        warmup: [['How well do you know American culture?', 'I actually don’t know a lot about it.', 'I know it very well.']],
        vocab: [['genre', 'gênero'], ['marketplace', 'mercado']],
        conversa: [
          ['Do you like burgers?', 'Sure, I do. I love them!', 'I don’t like burgers very much.', 'Yeah, and my favorite is...'],
          ['What is your favorite movie?', 'My favorite movie is...'],
          ['What is your favorite movie genre?', 'My favorite movie genre is...'],
          ['How often do you go shopping?', 'I go shopping (every weekend).'],
          ['What would you buy on Times Square?', 'I’d buy... on Times Square.'],
          ['Where do you like to relax?', 'I like to relax... (in my bedroom).'],
          ['Would you go on vacation to California?', 'Yeah, I’d go on vacation to California.'],
        ],
      },
      {
        id: 'interadv', rotulo: 'Intermediate & Advanced', niveis: ['Intermediate', 'Advanced'],
        objetivos: ['Talking about American culture.', 'Developing conversation skills.'],
        intro: 'Today, we’ll talk about American culture. We’ll discuss American food, Hollywood, Times Square and California.',
        warmup: [['How well do you know American culture?'], ['What are the best and the worst things about America in your opinion?']],
        vocab: [['genre', 'gênero'], ['marketplace', 'mercado']],
        conversa: [
          ['Are you into fast food?'],
          ['Do you consider your diet healthy? Why / why not?'],
          ['What had you better do to improve your health?'],
          ['Which Hollywood movies can you name?'],
          ['What is your favorite movie genre?'],
          ['How often do you go shopping?'],
          ['What items can’t you do without?'],
          ['What do you know about California?'],
          ['Which state in Brazil do you consider to be the most similar to California?'],
        ],
      },
    ],
  },

  /* ═════════ 03 · SPAIN ═════════ (vídeo: "One Day in Valencia", da youtuber Tina) */
  {
    chave: 'spain', num: 3, nome: 'Spain', cor: '#c60b1e', bandeira: 'es/bandeira.svg', capa: 'es/tossa.jpg', capaLocal: 'Tossa de Mar',
    introSub: 'One day in Valencia',
    video: { drive: '1MqpOVeioVQTNAj9mlfN6V1-DuJzFkfN8', youtube: 'qBN6bHP_kQw', nome: 'One Day in Valencia, Spain', instrucao: 'Teacher: pause the video from time to time to check comprehension.' },
    fotos: [
      { img: 'es/hola.jpg', local: 'Hola!', fundo: true },
      { img: 'es/cidade.jpg', local: 'Spain', fundo: true },
      { img: 'es/rua.jpg', local: 'Spain', fundo: true },
      { img: 'es/viagem.jpg', local: 'Spain', fundo: true },
    ],
    niveis: [
      {
        id: 'basic', rotulo: 'Basic (+18)', niveis: ['Basic'],
        objetivos: ['Talking about Spain.', 'Developing conversation skills.'],
        intro: 'Today, we’ll talk about Spain. We’ll see youtuber Tina explore the city of Valencia.',
        warmup: [
          ['How well do you know Spanish culture?', 'I actually don’t know a lot about it.', 'I know it very well.'],
          ['Did you know that more than 40% of Spanish people speak English?', 'Wow, what a surprise!', 'Yeah, I knew that.'],
        ],
        conversa: [
          ['Which words did you understand from the video?', 'I understood: (word), (word).'],
          ['What’s your opinion about the video?', 'In my opinion, it is... funny / interesting / nice / cool / curious.'],
          ['Can you speak Spanish?', 'Yes, I can. / No, I can’t.'],
          ['Would you like to visit Valencia?', 'Yes, I would.', 'No, I wouldn’t.'],
          ['Would you like to visit other Spanish speaking countries?', 'Yes, (Chile) for example. / No, I wouldn’t.'],
          ['Do you like to see the sunset?', 'Yes, I do.', 'No, I don’t.'],
          ['Have you ever rented a bike?', 'No, I have never rented a bike.', 'Yes, I have already rented a bike.'],
        ],
      },
      {
        id: 'teens', rotulo: 'Teens & Basic (-18)', niveis: ['Teens', 'Basic'],
        objetivos: ['Talking about Spain.', 'Developing conversation skills.'],
        intro: 'Today, we’ll talk about Spain. We’ll see youtuber Tina explore the city of Valencia.',
        warmup: [
          ['How well do you know Spanish culture?', 'I actually don’t know a lot about it.', 'I know it very well.'],
          ['Did you know that more than 40% of Spanish people speak English?', 'Wow, what a surprise!', 'Yeah, I knew that.'],
        ],
        conversa: [
          ['Which words did you understand from the video?', 'I understood: (word), (word).'],
          ['What’s your opinion about the video?', 'In my opinion, it is... funny / interesting / nice / cool.'],
          ['Can you speak Spanish?', 'Yes, I can. / No, I can’t.'],
          ['Would you like to visit Valencia?', 'Yes, I would.', 'No, I wouldn’t.'],
          ['Would you like to visit other Spanish speaking countries?', 'Yes, (Chile) for example. / No, I wouldn’t.'],
          ['Do you like to see the sunset?', 'Yes, I do.', 'No, I don’t.'],
          ['Have you ever rented a bike?', 'No, I have never rented a bike.', 'Yes, I have already rented a bike.'],
        ],
      },
      {
        id: 'intermediate', rotulo: 'Intermediate', niveis: ['Intermediate'],
        objetivos: ['Talking about Spain.', 'Developing conversation skills.'],
        intro: 'Today, we’ll talk about Spain. We’ll see youtuber Tina explore the city of Valencia.',
        warmup: [['How well do you know Spanish culture?'], ['Did you know that more than 40% of Spanish people speak English?']],
        conversa: [
          ['What was the most interesting part for you in the video?', 'For me, the most interesting part was... the beach / the sunset / the market / the food / other.'],
          ['What’s your opinion about the video?', 'In my opinion, it is...'],
          ['Can you speak Spanish?', 'Not at all, I can’t.', 'I can’t speak it, but I understand it.', 'Actually yeah, I can.'],
          ['Would you like to visit Valencia?'],
          ['Would you like to visit other Spanish speaking countries?'],
          ['How often do you take the time to see the sunset?'],
          ['Would you rather see the sunset from a boat or from the top of a mountain?'],
          ['Have you ever rented a bike, like the one they rented in the video?'],
        ],
      },
      {
        id: 'advanced', rotulo: 'Advanced', niveis: ['Advanced'],
        objetivos: ['Talking about Spain.', 'Developing conversation skills.'],
        intro: 'Today we’ll learn about Spain. We’ll see youtuber Tina explore the city of Valencia.',
        warmup: [['How well do you know Spanish culture?'], ['Are you aware that more than 40% of Spanish people speak English?']],
        conversa: [
          ['What was the most interesting part of the video for you?'],
          ['What’s your opinion about the itinerary that the couple created?'],
          ['Which part of the schedule did you like the most?'],
          ['Can you speak Spanish?'],
          ['Nowadays, how important is it to learn Spanish?'],
          ['Would you like to visit Valencia?'],
          ['Would you like to visit other Spanish speaking countries?'],
          ['How often do you take the time to see the sunset?'],
          ['Would you rather see the sunset from a boat or from the top of a mountain?'],
          ['Have you ever rented a bike, like the one they rented in the video?'],
          ['SPEAKING TASK: with a partner, create a travel schedule (like the one in the video) for someone who has only 1 day to see the Vale do Paraíba region.',
            'What cities are crucial to visit nearby?', 'What tourist spots are cool?', 'What food should be tried out?'],
        ],
      },
    ],
  },

  /* ═════════ 04 · NEW ZEALAND ═════════ (vídeo: "A Welcoming Journey to New Zealand") */
  {
    chave: 'new-zealand', num: 4, nome: 'New Zealand', cor: '#00247d', bandeira: 'nz/bandeira.svg', capa: 'nz/alps.jpg', capaLocal: 'Southern Alps', mapa: 'nz/mapa.png',
    introSub: 'Introduction and curiosities about New Zealand',
    texto: 'New Zealand is a country located right next to Australia. It’s a mix of natural wonders, beautiful lands and awesome people.\nNew Zealand is a small country that consists of two islands, North and South.',
    fatos: [['Capital', 'Wellington'], ['Main cities', 'Auckland, Rotorua and Christchurch'], ['Islands', 'North and South']],
    video: { drive: '1MrMhaIzaTW9HmnB_UQxjkfSl6D9SDVkY', nome: 'A Welcoming Journey to New Zealand' },
    fotos: [
      { img: 'nz/auckland.jpg', local: 'Auckland', texto: 'Let’s see some pictures!\n(Optional game: try naming the things you see in the pictures.)' },
      { img: 'nz/rotorua.jpg', local: 'Rotorua' },
      { img: 'nz/christchurch.jpg', local: 'Christchurch' },
      { img: 'nz/rugby.jpg', titulo: 'Passion for rugby', local: 'The All Blacks' },
      { img: 'nz/kiwi.jpg', titulo: 'Kiwi bird', local: 'Kiwi' },
      { img: 'nz/maori.jpg', titulo: 'Maori traditions', local: 'Maori: native New Zealanders' },
      { img: 'nz/paisagem.jpg', titulo: 'Beautiful landscapes', local: 'Aoraki / Mount Cook' },
      { img: 'nz/queenstown.jpg', local: 'Queenstown' },
      { img: 'nz/catedral.jpg', local: 'Christchurch' },
      { img: 'nz/hobbiton.jpg', local: 'Hobbiton' },
    ],
    niveis: [
      {
        id: 'basic', rotulo: 'Teens & Basic', niveis: ['Teens', 'Basic'],
        vocab: [['lands', 'terras'], ['mountains', 'montanhas'], ['place', 'lugar'], ['culture', 'cultura'], ['natural', 'natural'], ['beautiful', 'bonito']],
        conversa: [
          ['Which words did you understand from the video?', 'I understood: (word), (word).'],
          ['How does the video make you feel?', 'The video makes me feel... interested / happy / excited / curious.'],
          ['What got your attention in the video?', 'The ___ got my attention: beaches / mountains / people / other.'],
          ['Would you like to visit New Zealand?', 'Yes, I would. / No, I wouldn’t.'],
          ['Would you like to know how to play rugby?', 'Yeah, I would. It seems awesome.', 'Nah, I don’t think so.'],
        ],
      },
      {
        id: 'intermediate', rotulo: 'Intermediate', niveis: ['Intermediate'],
        vocab: [['lands', 'terras'], ['“wide open”', 'aberto, amplo'], ['countryside', 'interior, campo'], ['culture', 'cultura'], ['natural', 'natural'], ['within', 'dentro de']],
        conversa: [
          ['Which words did you understand from the video?'],
          ['How does the video make you feel?'],
          ['Have you ever thought about visiting New Zealand?', 'Yeah, I have. I think that...', 'To be honest, I...', 'Actually, ...'],
          ['What got your attention in the video? Why?', 'The ___ got my attention: beaches / mountains / people / other.'],
          ['Would you like to know how to play rugby?'],
          ['Are you into any sports?'],
          ['If you could make a video promoting Brazil, what places would it feature?'],
        ],
      },
      {
        id: 'advanced', rotulo: 'Advanced', niveis: ['Advanced'],
        vocab: [['[to] show (someone) around', 'mostrar (o lugar) para alguém'], ['[to be] thrown head-first into', 'ser jogado de cabeça em'], ['“wide open”', 'aberto, amplo'], ['countryside', 'interior, campo'], ['culture', 'cultura'], ['within', 'dentro de'], ['throughout', 'por todo, ao longo de']],
        conversa: [
          ['How does the video make you feel about visiting New Zealand?'],
          ['Have you ever thought about visiting this country?'],
          ['What are some of the challenges of traveling to New Zealand?'],
          ['New Zealand has a national passion: rugby. Their team, the All Blacks, is one of the best in the world. Do you know the rules of rugby?'],
          ['Would you like to know how to play it?'],
          ['Are you into any sports?'],
          ['If you could make a video promoting Brazil, what places would it feature?'],
        ],
      },
    ],
  },

  /* ═════════ 05 · IRELAND ═════════ */
  {
    chave: 'ireland', num: 5, nome: 'Ireland', oficial: 'Republic of Ireland', cor: '#169b62', bandeira: 'ie/bandeira.svg', capa: 'ie/dublin.jpg', capaLocal: 'Dublin', mapa: 'ie/mapa.png',
    introSub: 'Introduction and curiosities about Ireland',
    texto: 'Ireland, also known as the Republic of Ireland, is a country in north-western Europe.\nThe capital and largest city is Dublin, which is located on the eastern side of the island.',
    fatos: [['Capital', 'Dublin'], ['Official languages', 'Irish and English'], ['Currency', 'Euro'], ['Driving side', 'left']],
    video: { drive: '1N63ZhaJrmcvrrepXB8xTSjNdjzb29nH9', nome: 'Ireland', instrucao: 'Clap your hands when you recognize a word from the vocabulary!' },
    vocabTitulo: 'Important words', vocabSub: 'for the video · pay attention to pronunciation',
    jogoTitulo: 'True or False?',
    tf: [
      ['There are striking landscapes in Ireland.', true, ''],
      ['The shamrock is the Irish national symbol.', false, 'The harp is.'],
      ['There are many snakes in Ireland.', false, 'Ireland is a snake-free island.'],
      ['The oldest lighthouse dates back to the 5th century.', true, ''],
      ['The white color in the Irish flag represents peace.', true, ''],
    ],
    fotos: [
      { img: 'ie/cashel.jpg', local: 'Irish castles' },
      { img: 'ie/cobh.jpg', local: 'Cobh: seaport town' },
      { img: 'ie/skellig.jpg', local: 'Skellig Islands' },
      { img: 'ie/trinity.jpg', local: 'Trinity College Library' },
      { img: 'ie/glendalough.jpg', local: 'Glendalough Valley' },
      { img: 'ie/connemara.jpg', local: 'Connemara National Park' },
      { img: 'ie/causeway.jpg', local: 'Giant’s Causeway' },
    ],
    niveis: [
      {
        id: 'basic', rotulo: 'Basic & Teens', niveis: ['Basic', 'Teens'],
        vocab: [['amazing', 'surpreendente'], ['windswept', 'ventoso'], ['striking', 'impressionante'], ['misconception', 'equívoco'], ['shamrock', 'trevo de 3 folhas'], ['harp', 'harpa'], ['weasel', 'doninha'], ['lighthouse', 'farol']],
        conversa: [
          ['What do you think about Ireland?', 'I think Ireland is…'],
          ['Would you like to visit Ireland, or live there?', 'I’d like to…'],
          ['Would you prefer to study English in Ireland or in the USA?', 'I’d prefer to study English in…'],
          ['In your opinion, is Ireland a good tourist destination?', 'Yes, in my opinion, Ireland is…', 'No, in my opinion, Ireland isn’t…'],
          ['Is Ireland as amazing as Brazil?', 'Yes, Ireland is… / No, Ireland isn’t…'],
          ['Irish people love to chat. When do you love to chat?', 'I love to chat when I…'],
          ['Irish people love pubs. Where do you meet your friends?', 'I meet my friends at…'],
          ['In winter, the temperature is very cold in Ireland (4-6 °C). Do you prefer cold or hot temperature?', 'I prefer…'],
          ['The Irish food is very delicious. Do you like to try new food?', 'Yes, I like to try… / No, I don’t like to…'],
        ],
      },
      {
        id: 'intermediate', rotulo: 'Intermediate', niveis: ['Intermediate'],
        texto: 'Ireland, also known as the Republic of Ireland, is a country in north-western Europe. It ranks among the top ten wealthiest countries in the world.\nAround a third of the country’s population of 4.8 million people resides in the greater Dublin area.',
        fotosExtra: [{ img: 'ie/pub.jpg', local: 'Irish pub', texto: 'The Irish pub serves as a focal point for many small villages and urban neighborhoods, a place where the great Irish passion for conversation, stories, and jokes can take place.' }],
        vocab: [['amazing', 'surpreendente'], ['to gape', 'olhar boquiaberto'], ['windswept', 'ventoso'], ['striking', 'impressionante'], ['to relish', 'apreciar'], ['misconception', 'equívoco'], ['shamrock', 'trevo de 3 folhas'], ['harp', 'harpa'], ['weasel', 'doninha'], ['polecat', 'furão'], ['roe deer', 'veado'], ['lighthouse', 'farol']],
        conversa: [
          ['What do you think about Ireland?'],
          ['Would you like to visit Ireland, or live there?'],
          ['Would you go to Ireland as an exchange student to learn English? Why (not)?'],
          ['Do you think Ireland is a good tourist destination? Why do you think so?'],
          ['What does your country have in common with Ireland?'],
          ['Irish people love to chat. How hard is it for you to start a conversation with people you don’t know?'],
          ['Irish people love pubs. What’s your favorite place to meet your friends? Why?'],
          ['In Ireland, the temperature during the winter is very low (4-6 °C). What’s your opinion about cold weather?'],
          ['The Irish cuisine is the mixing of the different cultures in Ireland. How is the Brazilian cuisine?'],
        ],
      },
      {
        id: 'advanced', rotulo: 'Advanced', niveis: ['Advanced'],
        texto: 'Ireland, also known as the Republic of Ireland, is a country in north-western Europe. It ranks among the top ten wealthiest countries in the world.\nAround a third of the country’s population of 4.8 million people resides in the greater Dublin area.',
        fotosExtra: [{ img: 'ie/pub.jpg', local: 'Irish pub', texto: 'The Irish pub serves as a focal point for many small villages and urban neighborhoods, a place where the great Irish passion for conversation, stories, and jokes can take place.' }],
        vocab: [['amazing', 'surpreendente'], ['to gape', 'olhar boquiaberto'], ['windswept', 'ventoso'], ['striking', 'impressionante'], ['to relish', 'apreciar'], ['misconception', 'equívoco'], ['shamrock', 'trevo de 3 folhas'], ['harp', 'harpa'], ['weasel', 'doninha'], ['polecat', 'furão'], ['roe deer', 'veado'], ['lighthouse', 'farol']],
        conversa: [
          ['What do you think about Ireland?'],
          ['Would you like to visit Ireland, or live there?'],
          ['Would you go to Ireland as an exchange student to learn English? Why (not)?'],
          ['Do you think Ireland is a good tourist destination? Why do you think so?'],
          ['What is your idea of a typical Irish person? Why do you think so?'],
          ['What does your country have in common with Ireland?'],
          ['Irish people are very friendly. They love to chat. How easy would it be for you to start a conversation with an Irish person?'],
          ['Irish people get together in the pubs. What’s your favorite place to meet your friends? Why?'],
          ['In Ireland, the average temperature during the winter ranges between 4 and 6 °C. How do you like cold weather?'],
          ['The Irish cuisine is the mixing of the different cultures in Ireland. How is the Brazilian cuisine?'],
        ],
      },
    ],
  },

  /* ═════════ 06 · INDIA ═════════ (vídeo sobre o inglês da Índia) */
  {
    chave: 'india', num: 6, nome: 'India', oficial: 'Republic of India', cor: '#ff9933', bandeira: 'in/bandeira.svg', capa: 'in/taj.jpg', capaLocal: 'Taj Mahal', mapa: 'in/mapa.png',
    introSub: 'Introduction and curiosities about India',
    texto: 'India is a country in South Asia. It is the seventh-largest country by area and the second-most populous country, after China.\nThe Taj Mahal is a mausoleum and the best known of the country’s monuments. It is classified by UNESCO as a World Heritage Site.',
    fatos: [['Capital', 'New Delhi'], ['Official languages', 'Hindi and English'], ['Currency', 'Indian Rupee'], ['Driving side', 'left'], ['Population', '1.339 billion (2017)']],
    video: { drive: '1NbhskIStuLAfTTTOuZ3In-01yiZ-nkj1', nome: 'Indian English' },
    vocabTitulo: 'Important words', vocabSub: 'for the video · pay attention to pronunciation',
    jogoTitulo: 'True or False?',
    tf: [
      ['There are only two languages in India.', false, 'There are many languages.'],
      ['The “Indian accent” is the way English is spoken in India.', true, ''],
      ['The English vocabulary used in India is like the one used in the USA.', false, ''],
      ['There are no changes in pronunciation in “Indian English”.', false, ''],
    ],
    vocab: [['to spread', 'propagar, espalhar'], ['Christianity', 'Cristianismo'], ['press', 'imprensa'], ['syntax', 'sintaxe'], ['coinage', 'neologismo (palavra nova)'], ['feature', 'característica'], ['retroflex trilled', '(o som do /r/)'], ['merging', 'fusão']],
    fotos: [
      { img: 'in/newdelhi.jpg', local: 'New Delhi', texto: 'Officially, English is the most important language of India. After Hindi, it is the most commonly spoken language.' },
      { img: 'in/jaisalmer.jpg', local: 'Jaisalmer', texto: 'The Indians have their own unique English. The Indian accent is sometimes difficult for non-Indians to understand.' },
      { img: 'in/varanasi.jpg', local: 'Varanasi' },
      { img: 'in/rishikesh.jpg', local: 'Rishikesh' },
      { img: 'in/manali.jpg', local: 'Manali' },
      { img: 'in/goa.jpg', local: 'Goa' },
      { img: 'in/jaipur.jpg', local: 'Jaipur' },
      { img: 'in/mulheres.jpg', local: 'Indian women' },
      { img: 'in/suntemple.jpg', local: 'Sun Temple' },
      { img: 'in/tirumala.jpg', local: 'Tirumala Temple' },
      { img: 'in/mahabodhi.jpg', local: 'Mahabodhi Temple' },
    ],
    niveis: [
      {
        id: 'basic', rotulo: 'Basic & Teens', niveis: ['Basic', 'Teens'],
        conversa: [
          ['Who would you like to visit India with?', 'I’d like to visit India with my…'],
          ['What would you like to see in India?', 'I’d like to see the... (palaces / beaches / churches / monuments / temples)'],
          ['Would you like to visit or live in India?', 'I’d like to… India.'],
          ['Do you prefer to visit historical places or natural landmarks?', 'In my opinion, I prefer to visit…'],
          ['What is the most famous monument in Brazil?', '… is the most famous monument in Brazil.'],
          ['What tourist places in your country can you suggest to visit?', 'I can suggest to visit… and…'],
          ['Would you like people to speak Portuguese or English in Brazil?', 'I’d like people to speak… in Brazil.'],
          ['What would you like to have, the American accent or the Indian accent?', 'I’d like to have the… accent.'],
          ['What is more beautiful to listen to, American English or Indian English?', 'I guess… is more beautiful to listen to.'],
        ],
      },
      {
        id: 'intermediate', rotulo: 'Intermediate', niveis: ['Intermediate'],
        conversa: [
          ['Say three adjectives that best describe India.'],
          ['Why do you think tourists go to India?'],
          ['Would you like to visit or live in India? Why (not)?'],
          ['Do you prefer to visit historical places or natural landmarks? Why do you think so?'],
          ['What is the most famous monument in Brazil? Why is it famous?'],
          ['What good tourist sites in your country can you suggest to visit? Why?'],
          ['Would you like Portuguese or English to be spoken in Brazil? Why?'],
          ['Are some languages more beautiful to listen to than others? If so, which one(s)?'],
          ['Are there any languages that you really don’t like the sound of? Which one(s)? Why?'],
        ],
      },
      {
        id: 'advanced', rotulo: 'Advanced', niveis: ['Advanced'],
        conversa: [
          ['What images come to your mind when you think of India?'],
          ['Why is India one of the top tourist destinations in the world?'],
          ['Would you like to visit or live in India? Why (not)?'],
          ['Which tourist attractions do you prefer to see when traveling? Historical places or natural landmarks? Why?'],
          ['What is the most famous monument in Brazil? Why is it famous?'],
          ['What good tourist sites in your country can you suggest to visit? Why?'],
          ['Do you wish your country had another language instead of the present one? If so, which one? Why?'],
          ['What does accent or dialect tell you about someone’s education, background, or income?'],
          ['Are some languages more beautiful to listen to than others? Are there any languages that you really don’t like the sound of? Why?'],
        ],
      },
    ],
  },

  /* ═════════ 07 · PERU ═════════ (Peruvian Week; o vídeo é o "Machu Picchu 101" da National Geographic) */
  {
    chave: 'peru', num: 7, nome: 'Peru', cor: '#d91023', bandeira: 'pe/bandeira.png', capa: 'pe/machupicchu.jpg', capaLocal: 'Machu Picchu Sanctuary',
    introSub: 'Machu Picchu, one of Peru’s most famous archeological sites',
    video: { drive: '1-qhM9jvo66EpyrgL7dvwr0B-Wdu2rj-9', youtube: 'cnMa-Sm9H4k', nome: 'Machu Picchu 101 · National Geographic' },
    fotos: [{ img: 'pe/lhama.jpg', local: 'Peru', fundo: true }, { img: 'pe/machupicchu.jpg', local: 'Machu Picchu', fundo: true }],
    niveis: [
      {
        id: 'all', rotulo: 'All Levels', niveis: ['Basic', 'Teens', 'Intermediate', 'Advanced'],
        objetivos: ['Talking about Peruvian culture.', 'Practicing reading and reading comprehension.', 'Developing listening skills by watching a NatGeo video.'],
        intro: 'Today, we’ll learn about Peru. We’ll watch a real National Geographic video about Machu Picchu, one of Peru’s most famous archeological sites.',
        warmup: [['Do you know Machu Picchu?', 'I don’t know a lot about it.', 'I know it very well.', 'I only know it exists.']],
        leitura: {
          titulo: 'Reading', instrucao: 'Read the video script silently. Then, take turns reading it aloud, one sentence each.',
          paragrafos: [
            'The stone city of Machu Picchu is one of the most fascinating archeological sites on the planet. Located northwest of Cusco, Peru, Machu Picchu is a testament to the power and ingenuity of the Inca people. During its prime, the Inca civilization stretched about 2500 miles along South America’s Pacific Coastline, from modern day Ecuador down into Chile. This distance is nearly the horizontal width of the continental United States. Machu Picchu, located at the center of this once expansive empire, is one of the few well-preserved remnants of the Inca civilization. Built around the mid 15th century, Machu Picchu is a stunning example of the Inca’s engineering feats.',
            'The Inca constructed Machu Picchu’s palaces, temples, terraces, and infrastructure using stone and without the help of wheels or tools made of steel or iron. One particularly notable aspect of their construction is foregoing the use of mortar, a material often used to bind stones together. Nonetheless, the stones of Machu Picchu were cut so precisely that they snugly fit together. Located on two fault lines, Machu Picchu often experiences earthquakes, but because of the stones’ exceptional cut and fit, they bounce during tremors and then are able to easily fall back into position. These engineering marvels have preserved Machu Picchu’s remarkable condition for over 500 years.',
            'Machu Picchu’s purpose is still a mystery to many archeologists. Some theorize that it may have served as a ceremonial site, a military stronghold, or a retreat for nobility. The site’s geographic layout may be significant in another way. Many of both the manmade and natural structures appear to align with astronomical events. But in the early 16th century, only about 100 years after it was built, Machu Picchu was abandoned. And since the Inca had no written language, no records exist to explain the exact purpose of the site. Although local communities knew about Machu Picchu, the site remained largely unknown to the outside world for hundreds of years.',
            'Spanish conquistadors who invaded the Inca civilization in the 16th century never came across the site. It wasn’t until the early 20th century when Melchor Arteaga, a local farmer, debuted Machu Picchu to outsiders when he led Yale University professor Hiram Bingham to the site. Bingham and successive explorers devoted much of their academic careers to studying the archeological wonder. Despite its enigmatic nature, Machu Picchu still stands as one of the world’s most important archeological sites. In 1983, UNESCO designated Machu Picchu as a world heritage site and today visitors from around the world come to pay homage to this piece of history.',
          ],
        },
        jogoTitulo: 'Comprehension game',
        quiz: [
          ['What is the purpose of the passage?', ['Describing an ancient city.', 'Talking about human ingenuity.', 'Presenting theories about Machu Picchu’s purpose.', 'Emphasizing the lack of information about the Inca empire.'], 0],
          ['Why does Machu Picchu often experience earthquakes?', ['Because the city bounces and falls back into its position.', 'Because the stones of the city were cut precisely.', 'Because Machu Picchu is located on two fault lines.', 'Because Machu Picchu is a marvel of engineering.'], 2],
          ['How is the 20th century relevant to Machu Picchu’s history?', ['It is the century when it was invaded.', 'It is when the Spanish conquerors left the city.', 'It is the century the city was studied thoroughly.', 'It is when the city became a symbol of Peru’s independence.'], 2],
        ],
        conversa: [
          ['Did the script help you better understand the video?'],
          ['How much did you understand?'],
          ['Share one piece of information you learned in the video.'],
        ],
        avaliacao: ['Did you enjoy learning about Peru?', 'Which other countries would you like to learn more about?'],
      },
    ],
  },
];
module.exports.AVALIA = AVALIA;
