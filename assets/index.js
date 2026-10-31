/* index.html: o JavaScript que morava inline no fim do <body>, na mesma ordem dos blocos <script> de antes;
   extraído em 31/10/2026 (auditoria de 30/10, M6). Cada bloco virou uma seção marcada com "═══ bloco N". As declarações de topo
   (var, let, const, function) continuam globais, como eram entre blocos inline. O ?v= vem do md5 do arquivo (scripts/bump-version.js). */

/* ═══ bloco 1 ═══ */
    /* no idioma do Hub (Pedro, 27/10/2026): o acervo tem professor (pt), professor_en e professor_es, na mesma ordem.
       Sem a lista do idioma (arquivo antigo em cache), fica a de português. Trocar o idioma no menu sorteia de novo. */
    window.hubFrase = function () {
      var el = document.getElementById('heroFrase'); if (!el || !window.FISK_FRASES) return;
      var l = 'pt'; try { l = typeof fiskIdioma === 'function' ? fiskIdioma() : (localStorage.getItem('fisk_lang') || 'pt'); } catch (e) {}
      var chave = l === 'pt' || !FISK_FRASES['professor_' + l] ? 'professor' : 'professor_' + l;
      el.textContent = '✨ ' + FISK_FRASES.sorteia(chave); el.hidden = false;
    };
    window.hubFrase();
    (function () {
      var el = document.getElementById('heroFrase'); if (!el) return;
      el.addEventListener('click', function () { el.style.opacity = '0'; setTimeout(function () { window.hubFrase(); el.style.opacity = ''; }, 300); });
    })();

/* ═══ bloco 2 ═══ */
    fiskInitThemeToggle('themeToggle');

    /* ════════════════════════════════════════════════
       INTERNACIONALIZAÇÃO (PT / EN / ES)
    ════════════════════════════════════════════════ */
    /* UMA chave só desde 09/10/2026: `fisk_lang`, lida e gravada pelo kit
       (fiskIdioma / fiskDefinirIdioma). A antiga `fisk-lang` desta página é
       migrada lá dentro. O padrão é português desde 31/10/2026 (auditoria de 30/10). */
    let _lang = (typeof fiskIdioma === 'function') ? fiskIdioma() : 'pt';

    const T = {
      pt: {
        subtitle:          'Ferramentas rápidas para o seu dia a dia em sala de aula',
        'pg-title':'Fisk Hub','pg-sub':'Entre com seu nome e senha',
        'pg-tab-login':'Entrar','pg-tab-register':'Criar conta','pg-name':'Seu nome',
        'pg-name-ph':'Selecione seu nome…','pg-fullname':'Nome completo (opcional)',
        'pg-fullname-ph':'Ex.: Maria Fernanda Silva','pg-pass':'Senha','pg-pass2':'Confirmar senha',
        'pg-help':'Sem usuário ou esqueceu a senha? Fale com a direção.','pg-sou-sec':'Sou da secretaria','pg-sou-aluno':'Sou aluno','pg-logout':'Sair','pg-loading':'Carregando…','pg-loading-names':'Buscando os professores no servidor…','pg-entering':'Preparando o seu Hub…',
        'pg-pick-name':'Selecione seu nome.','pg-need-pass':'Digite sua senha.','pg-wait':'Aguarde…',
        'pg-short':'Senha muito curta (mínimo 4).','pg-nomatch':'As senhas não conferem.',
        'pg-err':'Erro de conexão. Tente de novo.','pg-hello':'Olá',
        'md-title':'Radar da Turma','md-more':'ver o radar →','md-alunos':'Alunos',
        'md-emdia':'Em dia','md-atras':'Atrasados','md-crit':'Críticos',
        'md-faltas':'Faltas médias','md-nota':'Média de notas','md-turmas':'turmas',
        'md-load':'analisando suas turmas…','md-falhou':'Não consegui ler {n} de {t} escolas suas: estes números estão incompletos. Recarregue para tentar de novo.','md-pick':'Escolha um professor no seletor do topo para ver o painel dele.',
        'md-busca-t':'🎓 Acompanhamento do Aluno','md-busca-ph':'🔎 Buscar aluno por nome ou RAF…','md-busca-nada':'Nenhum aluno com esse nome ou RAF.',
        'card-planner-h2': 'Abridor de Planners físicos',
        'prat-aula': 'Em aula', 'prat-docs': 'Documentos', 'prat-outras': 'Outras ferramentas',
        'card-planner-p':  'Crie o PPT / Planner do aluno com as datas corretas',
        'card-conv-h2':    'Conversation Maker',
        'card-conv-p':     'Crie conversações completas em powerpoint, prontas para usar',
        'card-answerkeys-h2': 'Answer Keys',
        'card-answerkeys-p':  'Gabaritos das provas dos estágios, do Essentials ao In Focus e Espanhol',
        'card-turmahoje-h2': 'Minha aula',
        'card-turmahoje-p':  'Visão geral de todos os planners da turma',
        'card-corretor-h2':  'MET Practice Test Grader',
        'card-corretor-p':   'Fotografe a folha de respostas e veja a nota',
        'card-acomp-h2':     'Radar do Aluno',
        'card-acomp-p':      'Busque um aluno e veja o radar dele, onde focar e o que fez no portal',
        'card-lessonplan-h2': 'Planejador da Próxima Aula',
        'card-lessonplan-p':  'Ordem de prioridade de atendimento na próxima aula',
        'card-termo-h2':   'Gerador de Termo de Atraso',
        'card-termo-p':    'Gere termos de atraso para alunos com poucos cliques',
        'card-2ndchance-h2': 'Gerador de Notificação 2nd Chance',
        'card-2ndchance-p':  'Envie quando o aluno precisa refazer a prova',
        'card-boletim-h2': 'Gerador de Boletins',
        'card-boletim-p':  'Monte boletins dos alunos rapidamente',
        'card-imprimir-h2': 'Central de Pedidos',
        'card-imprimir-p':  'Seus documentos gerados, os pedidos à secretaria e a resposta dela',
        'card-met-h2':     'Treino MET',
        'card-met-p':      'Pratique para o exame MET com simulados interativos',
        'av-badge':        'Novo',
        'card-av-h2':      'My Avatar',
        'card-av-p':       'Monte o seu avatar e conheça a loja dos alunos. Eles veem o seu avatar na aba Turma.',
        'card-hw-h2':      'A Cerimônia de Seleção',
        'card-hw-p':       'Descubra a sua casa de Hogwarts, a mesma brincadeira que está na tela dos alunos',
        'hw-badge':        'Por tempo limitado',
        'card-apps-h2':     'Aplicativos da Fisk',
        'card-apps-p':      'Qual app serve a qual estágio, e o link para baixar no Android e no iPhone',
        'card-overview-h2': 'Radar da Turma',
        'card-overview-p':  'As cinco habilidades de cada aluno num relance, e onde focar com a turma',
        'card-portal-h2':   'Portal do Aluno (inglês)',
        'fwp-tag': 'NOVO · PARA PROFESSORES', 'fwp-t': 'Meu personagem do Fisk Worlds', 'fwp-d': 'Monte o seu mago ou a sua bruxa para entrar no jogo em 2027', 'fwp-go': 'Montar',
        'fw-tag': 'JOGO 3D · INGLÊS', 'fw-tag-es': 'JOGO 3D · ESPANHOL', 'fw-d': 'Explore o bosque, ajude os moradores e ache segredos', 'fw-jogar': 'Jogar',
        'card-portal-p':    'As ferramentas do aluno em inglês, com Teacher Mode para projetar na TV',
        'card-portal-es-h2':'Portal do Aluno (espanhol)',
        'card-portal-es-p': 'As ferramentas do aluno em espanhol, com Teacher Mode para projetar na TV',
        'card-portal-kids-h2':'Portal Kids',
        'card-portal-kids-p':'Áudios, vídeos e aplicativos dos livros infantis, do Magic Way ao Fun at School',
        'card-checking-h2': 'Checking Guide',
        'card-checking-p':  'Verifique o aproveitamento do aluno antes de avançar para a próxima lição',
        'card-ecounsel-h2': 'E-counseling',
        'card-ecounsel-p':  'Registre ocorrências e desenvolvimento do aluno',
        'card-tutoria-h2': 'Centro de Estudos',
        'card-tutoria-p':  'Atender, frequência e horários do Centro de Estudos (o Learning Center, o plantão de dúvidas) num lugar só',
        'card-calendario-h2': 'Minha semana',
        'sem-abrir': 'Abrir em tela cheia ↗',
        'card-calendario-p':  'Suas aulas, plantões, experimentais e aniversários da semana',
        'card-raftemp-h2': 'RAF temporário',
        'card-raftemp-p':  'Código para o aluno sem RAF entrar no portal',
        'soon':            'Em breve',
        'evt-reuniao':     'Reunião',
        'evt-evento':      'Evento',
        'evt-simulado':    'Simulado',
        'evt-met':         'MET / Siele',
        'evt-treinamento': 'Treinamento',
        'evt-exame':       'Exame / Simulado',
        'evt-familias':    'Alunos e famílias',
        'evt-entrega':     'Entrega',
        'evt-ferias':      'Férias',
        'evt-feriado':     'Feriado',
        'evt-letivo':      'Marco letivo',
        'links-title':     'Links Úteis',
        'link-sgf':        'Portal do Professor (SGF)',
        'link-expo':       'Treinamentos Fundação Fisk',
        'link-interno':    'Treinamentos Internos',
        'link-baamboozle': 'Plataforma Baamboozle',
        'link-cyber':      'Cyber Fisk (aluno)',
        'footer':          'Ferramenta desenvolvida exclusivamente para uso interno das escolas Fisk. A utilização deste sistema e de seu conteúdo por pessoas ou instituições não autorizadas, incluindo professores particulares, é proibida. Desenvolvido por @fiskcacapava e @taubatefisk',
      },
      en: {
        subtitle:          'Quick tools for your day-to-day in the classroom',
        'pg-title':'Fisk Hub','pg-sub':'Sign in with your name and password',
        'pg-tab-login':'Sign in','pg-tab-register':'Create account','pg-name':'Your name',
        'pg-name-ph':'Select your name…','pg-fullname':'Full name (optional)',
        'pg-fullname-ph':'e.g., Maria Fernanda Silva','pg-pass':'Password','pg-pass2':'Confirm password',
        'pg-help':"No account or forgot your password? Talk to the office.",'pg-sou-sec':'I work at the front office','pg-sou-aluno':'I am a student','pg-logout':'Log out','pg-loading':'Loading…','pg-loading-names':'Fetching the teachers from the server…','pg-entering':'Getting your Hub ready…',
        'pg-pick-name':'Select your name.','pg-need-pass':'Enter your password.','pg-wait':'Please wait…',
        'pg-short':'Password too short (min. 4).','pg-nomatch':"Passwords don't match.",
        'pg-err':'Connection error. Try again.','pg-hello':'Hi',
        'md-title':'Class Radar','md-more':'see the radar →','md-alunos':'Students',
        'md-emdia':'On track','md-atras':'Behind','md-crit':'Critical',
        'md-faltas':'Avg. absences','md-nota':'Avg. grade','md-turmas':'classes',
        'md-load':'analyzing your classes…','md-falhou':'Could not read {n} of your {t} schools: these numbers are incomplete. Reload to try again.','md-pick':'Pick a teacher in the selector above to see their panel.',
        'md-busca-t':'🎓 Student Follow-up','md-busca-ph':'🔎 Search student by name or RAF…','md-busca-nada':'No student with that name or RAF.',
        'card-planner-h2': 'Printed Planner Opener',
        'prat-aula': 'In class', 'prat-docs': 'Documents', 'prat-outras': 'Other tools',
        'card-planner-p':  'Create student planners with the correct dates',
        'card-conv-h2':    'Conversation Maker',
        'card-conv-p':     'Generate full conversation PowerPoints, ready to use',
        'card-answerkeys-h2': 'Answer Keys',
        'card-answerkeys-p':  'Test answer keys for every stage, from Essentials to In Focus and Spanish',
        'card-turmahoje-h2': 'My Class',
        'card-turmahoje-p':  'An overview of every planner in the class',
        'card-corretor-h2':  'MET Practice Test Grader',
        'card-corretor-p':   'Photograph the answer sheet and get the score',
        'card-acomp-h2':     'Student Radar',
        'card-acomp-p':      'Search a student and see their radar, where to focus and what they did on the portal',
        'card-lessonplan-h2': 'Next Class Planner',
        'card-lessonplan-p':  'Attendance priority order for the next class',
        'card-termo-h2':   'Late Notice Generator',
        'card-termo-p':    'Generate late notices for students in just a few clicks',
        'card-2ndchance-h2': '2nd Chance Notification Generator',
        'card-2ndchance-p':  'Send it when the student needs to take the test again',
        'card-boletim-h2': 'Report Card Generator',
        'card-boletim-p':  'Build student report cards quickly',
        'card-imprimir-h2': 'Requests center',
        'card-imprimir-p':  'Your generated documents, front desk requests and their replies',
        'card-met-h2':     'MET Drills',
        'card-met-p':      'Practice for the MET exam with interactive simulations',
        'av-badge':        'New',
        'card-av-h2':      'My Avatar',
        'card-av-p':       'Build your avatar and get to know your students’ shop. They see your avatar in the Class tab.',
        'card-hw-h2':      'The Sorting Ceremony',
        'card-hw-p':       'Find your Hogwarts house, the same game your students have on their screens',
        'hw-badge':        'Limited time',
        'card-apps-h2':     'Fisk apps',
        'card-apps-p':      'Which app belongs to which level, and where to download it on Android and iPhone',
        'card-overview-h2': 'Class Radar',
        'card-overview-p':  'Every student\'s five skills at a glance, and where to focus with the class',
        'card-portal-h2':   'Student Portal (English)',
        'fwp-tag': 'NEW · FOR TEACHERS', 'fwp-t': 'My Fisk Worlds character', 'fwp-d': 'Build your wizard or witch to join the game in 2027', 'fwp-go': 'Build',
        'fw-tag': '3D GAME · ENGLISH', 'fw-tag-es': '3D GAME · SPANISH', 'fw-d': 'Explore the woods, help the neighbors and find secrets', 'fw-jogar': 'Play',
        'card-portal-p':    'The student tools in English, with Teacher Mode to project on the TV',
        'card-portal-es-h2':'Student Portal (Spanish)',
        'card-portal-es-p': 'The student tools in Spanish, with Teacher Mode to project on the TV',
        'card-portal-kids-h2':'Kids Portal',
        'card-portal-kids-p':'Audio, videos and apps of the kids books, from Magic Way to Fun at School',
        'card-checking-h2': 'Checking Guide',
        'card-checking-p':  'Verify student progress before moving on to the next lesson',
        'card-ecounsel-h2': 'E-counseling',
        'card-ecounsel-p':  'Log incidents and student development',
        'card-tutoria-h2': 'Learning Center',
        'card-tutoria-p':  'Attend, attendance and schedule of the Learning Center (the tutoring sessions), all in one place',
        'card-calendario-h2': 'My week',
        'sem-abrir': 'Open full screen ↗',
        'card-calendario-p':  'Your classes, tutoring shifts, trial classes and birthdays this week',
        'card-raftemp-h2': 'Temporary RAF',
        'card-raftemp-p':  'A code so a student without a RAF can log in to the portal',
        'soon':            'Coming soon',
        'evt-reuniao':     'Meeting',
        'evt-evento':      'Event',
        'evt-simulado':    'Mock Exam',
        'evt-met':         'MET / SIELE',
        'evt-treinamento': 'Training',
        'evt-exame':       'Exam / Mock',
        'evt-familias':    'Students & families',
        'evt-entrega':     'Deadline',
        'evt-ferias':      'Time off',
        'evt-feriado':     'Holiday',
        'evt-letivo':      'School milestone',
        'links-title':     'Useful Links',
        'link-sgf':        'Teacher Portal (SGF)',
        'link-expo':       'Fisk Foundation Training',
        'link-interno':    'Internal Training',
        'link-baamboozle': 'Baamboozle Platform',
        'link-cyber':      'Cyber Fisk (student)',
        'footer':          'Tool developed exclusively for internal use at Fisk schools. Use of this system and its content by unauthorized persons or institutions, including private teachers, is prohibited. Developed by @fiskcacapava and @taubatefisk',
      },
      es: {
        subtitle:          'Herramientas rápidas para tu día a día en el aula',
        'pg-title':'Fisk Hub','pg-sub':'Entra con tu nombre y contraseña',
        'pg-tab-login':'Entrar','pg-tab-register':'Crear cuenta','pg-name':'Tu nombre',
        'pg-name-ph':'Selecciona tu nombre…','pg-fullname':'Nombre completo (opcional)',
        'pg-fullname-ph':'Ej.: María Fernanda Silva','pg-pass':'Contraseña','pg-pass2':'Confirmar contraseña',
        'pg-help':'¿Sin usuario u olvidaste tu contraseña? Habla con la dirección.','pg-sou-sec':'Soy de la secretaría','pg-sou-aluno':'Soy alumno','pg-logout':'Salir','pg-loading':'Cargando…','pg-loading-names':'Buscando a los profesores en el servidor…','pg-entering':'Preparando tu Hub…',
        'pg-pick-name':'Selecciona tu nombre.','pg-need-pass':'Escribe tu contraseña.','pg-wait':'Espera…',
        'pg-short':'Contraseña muy corta (mín. 4).','pg-nomatch':'Las contraseñas no coinciden.',
        'pg-err':'Error de conexión. Inténtalo de nuevo.','pg-hello':'Hola',
        'md-title':'Radar del Grupo','md-more':'ver el radar →','md-alunos':'Alumnos',
        'md-emdia':'Al día','md-atras':'Atrasados','md-crit':'Críticos',
        'md-faltas':'Faltas medias','md-nota':'Nota media','md-turmas':'grupos',
        'md-load':'analizando tus grupos…','md-falhou':'No pude leer {n} de {t} escuelas tuyas: estos números están incompletos. Recarga para intentarlo de nuevo.','md-pick':'Elige un profesor en el selector de arriba para ver su panel.',
        'md-busca-t':'🎓 Seguimiento del Alumno','md-busca-ph':'🔎 Buscar alumno por nombre o RAF…','md-busca-nada':'Ningún alumno con ese nombre o RAF.',
        'card-planner-h2': 'Abridor de Planners físicos',
        'prat-aula': 'En clase', 'prat-docs': 'Documentos', 'prat-outras': 'Otras herramientas',
        'card-planner-p':  'Crea planners del alumno con las fechas correctas',
        'card-conv-h2':    'Conversation Maker',
        'card-conv-p':     'Genera conversaciones completas en PowerPoint, listas para usar',
        'card-answerkeys-h2': 'Answer Keys',
        'card-answerkeys-p':  'Claves de las pruebas de cada etapa, de Essentials a In Focus y Español',
        'card-turmahoje-h2': 'Mi clase',
        'card-turmahoje-p':  'Vista general de todos los planners del grupo',
        'card-corretor-h2':  'MET Practice Test Grader',
        'card-corretor-p':   'Fotografía la hoja de respuestas y ve la nota',
        'card-acomp-h2':     'Radar del Alumno',
        'card-acomp-p':      'Busca un alumno y ve su radar, dónde enfocarse y lo que hizo en el portal',
        'card-lessonplan-h2': 'Planificador de la Próxima Clase',
        'card-lessonplan-p':  'Orden de prioridad de atención para la próxima clase',
        'card-termo-h2':   'Generador de Aviso de Atraso',
        'card-termo-p':    'Genera avisos de atraso para alumnos en pocos clics',
        'card-2ndchance-h2': 'Generador de Notificación 2nd Chance',
        'card-2ndchance-p':  'Envíalo cuando el alumno necesita repetir el examen',
        'card-boletim-h2': 'Generador de Boletines',
        'card-boletim-p':  'Genera boletines de alumnos rápidamente',
        'card-imprimir-h2': 'Central de Pedidos',
        'card-imprimir-p':  'Tus documentos generados, los pedidos a la secretaría y su respuesta',
        'card-met-h2':     'Entrenamiento MET',
        'card-met-p':      'Practica para el examen MET con simulacros interactivos',
        'av-badge':        'Nuevo',
        'card-av-h2':      'Mi Avatar',
        'card-av-p':       'Arma tu avatar y conoce la tienda de tus alumnos. Ellos ven tu avatar en la pestaña Clase.',
        'card-hw-h2':      'La Ceremonia de Selección',
        'card-hw-p':       'Descubre tu casa de Hogwarts, el mismo juego que tus alumnos tienen en pantalla',
        'hw-badge':        'Por tiempo limitado',
        'card-apps-h2':     'Aplicaciones de Fisk',
        'card-apps-p':      'Qué app sirve a cada nivel, y el enlace para descargar en Android y iPhone',
        'card-overview-h2': 'Radar del Grupo',
        'card-overview-p':  'Las cinco habilidades de cada alumno de un vistazo, y dónde enfocarse con el grupo',
        'card-portal-h2':   'Portal del Alumno (inglés)',
        'fwp-tag': 'NUEVO · PARA PROFESORES', 'fwp-t': 'Mi personaje de Fisk Mundo', 'fwp-d': 'Arma tu mago o tu bruja para entrar al juego en 2027', 'fwp-go': 'Armar',
        'fw-tag': 'JUEGO 3D · INGLÉS', 'fw-tag-es': 'JUEGO 3D · ESPAÑOL', 'fw-d': 'Explora el bosque, ayuda a los vecinos y encuentra secretos', 'fw-jogar': 'Jugar',
        'card-portal-p':    'Las herramientas del alumno en inglés, con Modo Profesor para proyectar en la TV',
        'card-portal-es-h2':'Portal del Alumno (español)',
        'card-portal-es-p': 'Las herramientas del alumno en español, con Modo Profesor para proyectar en la TV',
        'card-portal-kids-h2':'Portal Kids',
        'card-portal-kids-p':'Audios, videos y aplicaciones de los libros infantiles, de Magic Way a Fun at School',
        'card-checking-h2': 'Checking Guide',
        'card-checking-p':  'Verifica el aprovechamiento del alumno antes de avanzar a la próxima lección',
        'card-ecounsel-h2': 'E-counseling',
        'card-ecounsel-p':  'Registra incidencias y el desarrollo del alumno',
        'card-tutoria-h2': 'Centro de Estudios',
        'card-tutoria-p':  'Atender, asistencia y horarios del Centro de Estudios (el Learning Center, la tutoría) en un solo lugar',
        'card-calendario-h2': 'Mi semana',
        'sem-abrir': 'Abrir en pantalla completa ↗',
        'card-calendario-p':  'Tus clases, tutorías, clases de prueba y cumpleaños de la semana',
        'card-raftemp-h2': 'RAF temporal',
        'card-raftemp-p':  'Un código para que el alumno sin RAF entre al portal',
        'soon':            'Próximamente',
        'evt-reuniao':     'Reunión',
        'evt-evento':      'Evento',
        'evt-simulado':    'Simulacro',
        'evt-met':         'MET / SIELE',
        'evt-treinamento': 'Capacitación',
        'evt-exame':       'Examen / Simulacro',
        'evt-familias':    'Alumnos y familias',
        'evt-entrega':     'Entrega',
        'evt-ferias':      'Vacaciones',
        'evt-feriado':     'Feriado',
        'evt-letivo':      'Hito escolar',
        'links-title':     'Links Útiles',
        'link-sgf':        'Portal del Profesor (SGF)',
        'link-expo':       'Capacitación Fundación Fisk',
        'link-interno':    'Capacitación Interna',
        'link-baamboozle': 'Plataforma Baamboozle',
        'link-cyber':      'Cyber Fisk (alumno)',
        'footer':          'Herramienta desarrollada exclusivamente para uso interno de las escuelas Fisk. El uso de este sistema y su contenido por personas o instituciones no autorizadas, incluidos los profesores particulares, está prohibido. Desarrollado por @fiskcacapava y @taubatefisk',
      },
    };

    function tr(key) { return (T[_lang] || T.pt)[key] || key; }

    function applyLang(lang) {
      _lang = lang;
      if (typeof fiskDefinirIdioma === 'function') fiskDefinirIdioma(lang);
      document.getElementById('htmlRoot').lang = lang === 'pt' ? 'pt-BR' : lang;
      document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var val = tr(el.dataset.i18n);
        if (val && typeof val === 'string') el.textContent = val;
      });
      /* placeholder de campo: textContent não serve, é atributo */
      document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
        var val = tr(el.dataset.i18nPh);
        if (val && typeof val === 'string') el.placeholder = val;
      });
      document.querySelectorAll('.lang-btn').forEach(function(btn) {
        btn.classList.toggle('is-active', btn.dataset.lang === lang);
      });
    }

    /* O CALENDÁRIO ANTIGO DA HOME SAIU em 31/10/2026 (auditoria de 30/10, A4): estava fora do ar desde 03/08 e ainda
       chamava calList duas vezes por abertura. O calendário do professor é a Minha semana (calendario.html). Código no git. */
    /* O Conversation Maker fica em outro domínio (vercel.app) e não enxerga
       o localStorage daqui — o tema atual vai na URL, e o token de sessão do
       professor (SSO) vai no fragmento #proftok= (fragmento não chega a
       servidores/logs; mesmo padrão do #dirtok= do Painel da Direção). */
    (function(){
      var cm=document.querySelector('a[href^="https://conversation-maker"]');
      if(!cm) return;
      function sync(){
        var tok='';
        try{
          var s=JSON.parse(localStorage.getItem('fisk_prof')||'null');
          if(s&&s.token) tok='#proftok='+encodeURIComponent(s.token);
        }catch(e){}
        cm.href='https://conversation-maker.vercel.app/?theme='+(document.body.classList.contains('theme-dark')?'dark':'light')+tok;
      }
      sync(); window._cmSync=sync;
      var tg=document.getElementById('themeToggle');
      if(tg) tg.addEventListener('click', function(){ setTimeout(sync, 0); });
    })();

    (function initLang() {
      applyLang(_lang);
      /* o seletor do hero virou item do menu do professor; o do login (que
         aparece antes de existir sessão) continua onde estava */
    })();

    /* ════════════════════════════════════════════════
       PORTA DE ACESSO DO PROFESSOR (login por nome + senha)
       Backend: Fisk Hub — Dados (Apps Script). Senha só como hash no servidor.
    ════════════════════════════════════════════════ */
    (function profGate(){
      var EP = 'https://script.google.com/macros/s/AKfycbw13tpIVD3Ji9XhWW1VwDSw8qAZOmtMGPV0FI1rlHpEQ7HABumVpi_aMWQXfo7dwkd1/exec';
      var $ = function(id){ return document.getElementById(id); };
      var sel = $('pgNome'), msg = $('pgMsg'), sub = $('pgSubmit');
      var mode = 'login';

      function saved(){ try{ return JSON.parse(localStorage.getItem('fisk_prof')||'null'); }catch(e){ return null; } }

      function setPlaceholders(){
        $('pgFull').placeholder = tr('pg-fullname-ph');
        var first = sel.options[0];
        if (first && first.disabled) first.textContent = tr('pg-name-ph');
      }

      /* o professor trocou de idioma no menu: a home inteira acompanha, e a
         barra da direção/visita também (o "Sair" dela vem do dicionário) */
      function trocaIdioma(lang){
        applyLang(lang);
        if (window.hubFrase) window.hubFrase();
        if (window.pintaProxAula) window.pintaProxAula();
        if (window.pintaMaisUsadas) window.pintaMaisUsadas();
        fillBar(saved());
      }

      function fillBar(prof){
        if (!prof) return;
        var esc = String(prof.escolas || prof.escola || '').replace(/,/g, ' + ');
        var visita = !!prof.viewingAs;
        $('profBarName').textContent = (visita ? '👁 vendo como ' : '👤 ') + (prof.name || '') + (esc ? ' · ' + esc : '');
        var bar = $('profBar');
        if (bar) bar.classList.toggle('is-visita', visita);
        /* Identidade e "sair" agora vivem no menu do topo, igual às ferramentas.
           Esta barra só continua na tela quando tem algo que o menu não faz:
           avisar que é uma VISITA da direção, ou oferecer o "ver como". */
        if (bar) bar.classList.toggle('is-oculta', !visita && !prof.master);
        var out = $('profLogout');
        if (out) out.textContent = visita ? 'Sair da visão' : tr('pg-logout');
      }

      /* ── Acesso master: diretor "veste a camisa" de um professor sem login ──
         _actingProf() = quem os dashboards devem mostrar: o professor escolhido
         no seletor (só p/ diretor) ou a própria conta (professor comum). */
      var PROF_AWARE = ['2nd-chance.html','termo-atraso.html','visao-geral.html'];   /* planejador.html aposentado em 26/10/2026 */
      function actingSaved(){ try{ return JSON.parse(localStorage.getItem('fisk_actas')||'null'); }catch(e){ return null; } }
      window._actingProf = function(){
        var sv = saved(); if (!sv) return null;
        if (sv.master){ var a = actingSaved(); return (a && a.name) ? a : null; }
        return sv;
      };
      // aponta os atalhos das ferramentas p/ o professor efetivo (pré-seleção; nunca trava)
      /* O CORRETOR DO SIMULADO MET (19/09/2026): nasceu só para a direção; aberto para todos os professores no mesmo
         dia, depois do teste do Pedro com folhas reais. `false` volta ao piloto (a mesma chave mora na corretor-met.html) */
      var CORRETOR_ABERTO = true;
      var CORRETOR_PILOTO = ['PEDRO (DIREÇÃO)'];
      /* MY AVATAR DO PROFESSOR: aberto a todos desde 15/10/2026 (por escola, no horário dos alunos). A trava por data
         (AVATAR_ABRE_EM) saiu em 31/10/2026 (auditoria de 30/10, B8): ela escondia o card de quem está sem escola na _profs. */
      function normPiloto(v){ return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase(); }
      function updateToolLinks(){
        var sv0 = saved(), th = document.querySelector('a.card-turmahoje');
        /* A MINHA AULA É DE TODOS desde 17/09/2026; a trava do lançamento (datas por escola e o piloto) saiu em
           31/10/2026 (auditoria de 30/10, M5): ela escondia o card em silêncio de quem está sem escola na _profs.
           Agora o card aparece sempre, e quem está sem escola lê o aviso nele, com a porta (a direção). */
        if (th) {
          th.style.display = sv0 ? '' : 'none';
          var semEscola = !!(sv0 && !sv0.master && !String(sv0.escolas || sv0.escola || '').trim());
          var av = th.querySelector('.card-sem-escola');
          if (semEscola && !av) {
            av = document.createElement('small'); av.className = 'card-sem-escola';
            av.style.cssText = 'display:block;margin-top:.2rem;padding:.35rem .55rem;border-radius:8px;background:#fdf6e6;color:#7a5a12;font-size:.8rem;font-weight:700;line-height:1.35';
            av.textContent = '⚠️ Sua conta está sem escola cadastrada: peça à direção para cadastrar sua escola. Até lá, escolha a escola e o professor na cascata.';
            th.appendChild(av);
          } else if (!semEscola && av) av.remove();
        }
        var cmet = document.querySelector('a.card-corretor');
        if (cmet) cmet.style.display = (sv0 && (CORRETOR_ABERTO || sv0.master || sv0.director || CORRETOR_PILOTO.some(function(n){ return normPiloto(sv0.name) === normPiloto(n); }))) ? '' : 'none';
        var cnt = document.querySelector('a.card-noticias');
        if (cnt) cnt.style.display = (sv0 && sv0.master) ? '' : 'none';   /* fechado: só a direção (Noticias.js, NT_ABERTO) */
        var avc = document.getElementById('card-avatar');
        if (avc){
          var avAberto = !!sv0;
          avc.classList.toggle('is-soon', !avAberto);
          avc.style.display = avAberto ? '' : 'none';   /* surpresa para os professores (Pedro, 17/09/2026): nem o "Em breve" aparece */
          avc.setAttribute('href', avAberto ? 'avatar.html' : '#');
          if (avAberto){ avc.removeAttribute('aria-disabled'); avc.removeAttribute('tabindex'); }
          else { avc.setAttribute('aria-disabled', 'true'); avc.setAttribute('tabindex', '-1'); }
          var avb = avc.querySelector('.badge'); if (avb) avb.hidden = avAberto;
        }
        var p = window._actingProf();
        document.querySelectorAll('main.grid a.card, .md-cta').forEach(function(a){
          if (!a.getAttribute('data-base')){ a.setAttribute('data-base', (a.getAttribute('href')||'').split('?')[0].split('#')[0]); }
          var base = a.getAttribute('data-base') || '';
          if (PROF_AWARE.indexOf(base.split('/').pop()) === -1) return;
          if (p && p.name){
            var esc = String(p.escolas||p.escola||'').split(',')[0].trim();
            a.href = base + '?escola=' + encodeURIComponent(esc) + '&prof=' + encodeURIComponent(p.name);
          } else { a.href = base; }
        });
      }
      function setupActAs(){
        var sb = $('profActAs'); if (!sb) return;
        sb.hidden = false;
        fiskFetch(EP+'?action=profList').then(function(res){
          var ps = ((res&&res.profs)||[]).filter(function(p){ return !p.director; })
            .sort(function(a,b){ return String(a.name).localeCompare(String(b.name),'pt-BR'); });
          var cur = (actingSaved()||{}).name || '';
          sb.innerHTML = '<option value="">👥 Ver como professor…</option>' +
            ps.map(function(p){
              var nm = String(p.name).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
              return '<option value="'+nm+'" data-esc="'+String(p.escolas||'').replace(/"/g,'&quot;')+'"'+(p.name===cur?' selected':'')+'>'+nm+' · '+p.escolas+'</option>';
            }).join('');
        }).catch(function(){});
        sb.onchange = function(){
          var opt = sb.options[sb.selectedIndex];
          try{
            if (!sb.value) localStorage.removeItem('fisk_actas');
            else localStorage.setItem('fisk_actas', JSON.stringify({ name:sb.value, escolas:opt.getAttribute('data-esc')||'' }));
            localStorage.removeItem('fisk_minidash');
          }catch(e){}
          updateToolLinks();
        };
      }

      function enter(prof){
        try{ localStorage.setItem('fisk_prof', JSON.stringify(prof)); }catch(e){}
        /* o logo do topo segue quem entrou: a direção (master) volta ao Painel da Direção (fisk-shared.js) */
        try{ if (window.fiskLigaLogo) window.fiskLigaLogo(); }catch(e){}
        document.body.classList.remove('prof-out');
        document.body.classList.add('prof-in'); if (window._avisosLiga) window._avisosLiga();
        fillBar(prof);
        /* mesmo menu das ferramentas, no mesmo canto. O idioma voltou ao
           menu em 09/10/2026 (saíra em 23/09): o kit desenha o seletor em
           toda página, e só aqui ele troca na hora, pelo `onIdioma`.
           Respeita o "sair da visão" da direção. */
        if (typeof fiskInitUserMenu === 'function') {
          fiskInitUserMenu({
            onIdioma: trocaIdioma,
            onSair: function(){ $('profLogout').click(); }
          });
        }
        if (prof && prof.master) setupActAs();
        updateToolLinks();
        if (window._cmSync) window._cmSync(); // re-monta o link do Conversation Maker com o token novo
        registrarHome();
        perfilVerifica(prof);
      }
      /* a troca de perfil: pergunta ao servidor se esta conta tem a outra metade ("NOME (SEC)") */
      function perfilVerifica(prof){
        var box = $('perfilTroca'); if (!box) return; box.style.display = 'none';
        if (!prof || !prof.token || prof.viewingAs || prof.master) return;
        post({ action:'perfilTroca', de:'prof', token: prof.token, so: true }).then(function(r){
          if (r && r.ok && r.gemeo) box.style.display = 'inline-flex';
        }).catch(function(){});
      }
      $('perfilIrSec').addEventListener('click', function(){
        var s = saved(), b = this; if (!s || !s.token) return;
        b.disabled = true; b.textContent = 'Abrindo…';
        post({ action:'perfilTroca', de:'prof', token: s.token }).then(function(r){
          if (r && r.ok && r.token) { location.href = 'https://portalfisk.com.br/secretaria.html#sectok=' + encodeURIComponent(r.token); return; }
          b.disabled = false; b.textContent = '🗂️ Secretaria'; alert((r && r.error) || 'Não consegui abrir a secretaria.');
        }).catch(function(){ b.disabled = false; b.textContent = '🗂️ Secretaria'; alert('Erro de conexão.'); });
      });

      /* A home também é uma "ferramenta" no painel de uso da direção: sem ela
         o tempo logado só começaria a contar quando o professor abrisse a
         primeira ferramenta, e quem só passa para ver o mini-dash não
         apareceria em lugar nenhum. */
      /* ══ A IDENTIDADE ATRAVESSA PARA O PORTAL (23/09/2026) ═══════════════
         O card do Portal abre a chave de SALA `0000-000`, compartilhada por
         toda a equipe: o que o professor faz lá dentro não tinha dono. O `pt`
         leva o token da sessão DESTE Hub, e serve para uma coisa só — o
         registro de uso ganhar nome. A sessão de lá continua sendo a de sala,
         e nada do que ele faz vira dado de aluno.
         Vai no FRAGMENTO, nunca na query: fragmento o navegador não envia ao
         servidor nem põe no Referer, a mesma regra do RAF do aluno. */
      function levaIdentidadeAoPortal(){
        var s = (typeof fiskSessao === 'function') ? fiskSessao() : null;
        if (!s || !s.token) return;
        /* um card por curso desde 23/09/2026: o `curso` continua no endereço,
           senão o professor de espanhol cairia na visão de inglês */
        [['card-portal', 'en'], ['card-portal-es', 'es']].forEach(function (par) {
          var card = document.getElementById(par[0]);
          if (!card) return;
          card.href = 'https://portalfisk.com.br/#raf=0000-000&curso=' + par[1] +
                      '&pt=' + encodeURIComponent(s.token);
        });
        /* a faixa do Fisk Worlds / Fisk Mundo: só com a sessão, que é o que guarda o jogo do professor */
        [['fw-hub-en', 'en'], ['fw-hub-es', 'es']].forEach(function (par) {
          var f = document.getElementById(par[0]);
          if (f) f.href = 'https://portalfisk.com.br/#raf=0000-000&curso=' + par[1] + '&ir=worlds&pt=' + encodeURIComponent(s.token);
        });
        var fwHub = document.getElementById('fwHub');
        if (fwHub) fwHub.hidden = false;
      }

      function registrarHome(){
        levaIdentidadeAoPortal();
        if (typeof fiskRegistrarUso === 'function') fiskRegistrarUso('Fisk Hub (início)', 'hub-inicio');
        avisoNovidade();
        cortinaDoAvatar();
        // campanha da direção, se houver alguma no ar para a equipe
        if (typeof fiskCampanha === 'function') fiskCampanha();
      }

      /* ══ CORTINA DE AVISO AO PROFESSOR ═══════════════════════════════════
         A tela cheia que conta ao professor o que mudou na ferramenta dele.
         Aparece UMA VEZ por professor (ciência em `fisk_aviso_<id>_<nome>`,
         no aparelho) e some sozinha depois de `ate`.

         FALHA FECHADA, ao contrário da cortina do aluno: qualquer defeito
         (data torta, sessão sem nome, sem localStorage) simplesmente NÃO
         mostra o aviso e o Hub abre inteiro. Cortina que trava o professor no
         meio da aula é pior do que aviso não lido.

         NOS TRÊS IDIOMAS do Hub, e não só em português: o professor pode ter
         escolhido `en` ou `es` no menu (`fiskIdioma()`; o padrão é `pt` desde
         31/10/2026), e um aviso só em português apareceria em outra língua
         que não a da tela. Segue o `_lang` do momento em que abre.

         ⚠️ A SENHA APARECE AQUI, e por isso ela não está escrita em texto no
         fonte: o Hub é servido pelo GitHub Pages e a página é pública, então
         `Ctrl+F ksif` acharia. Os códigos abaixo são OFUSCAÇÃO, não segredo —
         quem ler o JavaScript com atenção monta a palavra em dez segundos. É
         o mesmo nível de proteção da própria trava (ver o comentário do
         `prova` no config.js do Portal do Aluno): atrito, não cofre. */
      /* ⚠️ É UMA LISTA, e não um aviso só (05/09/2026). Com um objeto único,
         publicar a novidade seguinte apagava a anterior para quem ainda não
         tinha entrado — foi exatamente o que aconteceu na cortina do aluno, e o
         conserto lá foi este. Mostra o PRIMEIRO da lista que esteja na janela
         de datas e que este professor ainda não tenha confirmado; o outro
         espera a próxima entrada, porque duas cortinas seguidas são parede.
         Ordem da lista = ordem de prioridade.

         Os campos `lista`, `senha`, `cuidado`, `p3` e `link` são OPCIONAIS: o
         desenho só escreve o que o aviso trouxer. */
      /* O MY AVATAR DO PROFESSOR (15/10/2026, pedido do Pedro: "faz uma cortina para os professores também"). Esta abre
         em CORTINA de verdade (as outras desta lista viraram recado do Buddy em 06/10), só para quem já tem o avatar
         aberto (desde 15/10/2026) e uma vez por professor. Ela também entra na lista, e o
         Buddy mostra o mesmo aviso: confirmar num lugar confirma no outro (a mesma chave do aparelho). */
      var AVISO_AVATAR = {
        id: 'my-avatar-prof-2026-10',
        desde: '2026-10-15', ate: '2026-11-15',
        link: { href: 'avatar.html' },
        pt: { selo:'Novidade ✨',
              t:'O My Avatar chegou para você e para os seus alunos 🧸',
              p1:'Monte o <b>seu avatar</b> aqui no Hub: escolha o personagem (Buddy, Angel, Jinny ou Jolly) e vista com as roupas, os acessórios e as skins da loja. O professor tem um orçamento próprio de Fisk Dólares, que não sai de nenhum aluno.',
              p2:'Os seus alunos também ganharam o My Avatar no Portal do Aluno: compram itens com os Fisk Dólares das atividades, e as atividades de filme dão itens especiais daquele filme. Na aba <b>Turma</b> do avatar deles aparece o <b>seu</b> avatar, com o seu nome, no destaque "Seu professor". Capriche! 😉',
              btnLink:'Montar o meu avatar 🧸', btn:'Entendi 👍' },
        en: { selo:'What’s new ✨',
              t:'My Avatar is here, for you and for your students 🧸',
              p1:'Build <b>your avatar</b> here in the Hub: pick a character (Buddy, Angel, Jinny or Jolly) and dress it with clothes, accessories and skins from the shop. Teachers get their own Fisk Dollar budget, which never comes from a student.',
              p2:'Your students got My Avatar in the Student Portal too: they buy items with the Fisk Dollars from their activities, and movie activities give special items from that movie. In the <b>Class</b> tab of their avatar, <b>your</b> avatar shows up with your name, under "Your teacher". Make it a good one! 😉',
              btnLink:'Build my avatar 🧸', btn:'Got it 👍' },
        es: { selo:'Novedad ✨',
              t:'Mi Avatar llegó para ti y para tus alumnos 🧸',
              p1:'Arma <b>tu avatar</b> aquí en el Hub: elige el personaje (Buddy, Angel, Jinny o Jolly) y vístelo con la ropa, los accesorios y las apariencias de la tienda. El profesor tiene su propio presupuesto de Fisk Dólares, que no sale de ningún alumno.',
              p2:'Tus alumnos también recibieron Mi Avatar en el Portal del Alumno: compran ítems con los Fisk Dólares de las actividades, y las actividades de video regalan ítems especiales de ese video. En la pestaña <b>Clase</b> de su avatar aparece <b>tu</b> avatar, con tu nombre, en el destacado "Tu profesor". ¡Esmérate! 😉',
              btnLink:'Armar mi avatar 🧸', btn:'Entendido 👍' }
      };
      var AVISOS = [
      AVISO_AVATAR,
      {
        /* MINHA SEMANA (26/10/2026): o calendário do professor */
        id: 'minha-semana-2026-10',
        desde: '2026-10-27', ate: '2026-12-15',
        link: { href: 'calendario.html' },
        pt: { selo:'Novidade',
              t:'Sua semana inteira num lugar só 📅',
              p1:'O Hub tem uma ferramenta nova, <b>Minha semana</b>: as suas aulas em ordem de dia e horário, os plantões, as aulas experimentais marcadas nas suas turmas, os aniversariantes e os feriados. No celular ela abre no dia de hoje.',
              p2:'Toque numa aula para ver os alunos e abrir a <b>Minha aula</b> já na turma certa. Se alguma turma sua não aparecer, o título dela no card precisa dizer o dia e a hora: avise a secretaria.',
              btnLink:'Abrir a Minha semana 📅', btn:'Entendi 👍' },
        en: { selo:'What’s new',
              t:'Your whole week in one place 📅',
              p1:'The Hub has a new tool, <b>My week</b>: your classes by day and time, tutoring shifts, trial classes booked in your groups, birthdays and holidays. On the phone it opens on today.',
              p2:'Tap a class to see the students and open <b>My class</b> on the right group. If a group of yours is missing, its title in the card must say the day and time: tell the front desk.',
              btnLink:'Open My week 📅', btn:'Got it 👍' },
        es: { selo:'Novedad',
              t:'Toda tu semana en un solo lugar 📅',
              p1:'El Hub tiene una herramienta nueva, <b>Mi semana</b>: tus clases por día y horario, las tutorías, las clases de prueba de tus grupos, los cumpleaños y los feriados. En el celular abre en el día de hoy.',
              p2:'Toca una clase para ver a los alumnos y abrir <b>Mi clase</b> en el grupo correcto. Si falta algún grupo, su título en el card debe decir el día y la hora: avisa a la secretaría.',
              btnLink:'Abrir Mi semana 📅', btn:'Entendido 👍' }
      },
      {
        /* A FREQUÊNCIA À TUTORIA (06/10/2026): a ferramenta nova, contada pelo Buddy */
        id: 'tutoria-frequencia-2026-10',
        desde: '2026-10-06', ate: '2026-12-15',
        link: { href: 'tutoria.html' },
        pt: { selo:'Novidade',
              t:'Agora dá para ver quem foi à tutoria 🙋',
              p1:'O Hub tem uma ferramenta nova, <b>Frequência à Tutoria</b>: os alunos seus que foram ao plantão de dúvidas nos últimos 14 dias, com o dia, o monitor e o que foi feito. É o espelho do Diário de Bordo, sem precisar abrir a planilha.',
              p2:'Eles também aparecem na prateleira <b>Em aula</b>, no card <b>Quem veio à tutoria</b>, para você bater o olho.',
              btnLink:'Abrir a Frequência à Tutoria 🙋', btn:'Entendi 👍' },
        en: { selo:'What’s new',
              t:'Now you can see who came to tutoring 🙋',
              p1:'The Hub has a new tool, <b>Tutoring Attendance</b>: your students who came to the Learning Center in the last 14 days, with the day, the monitor and what was done. It mirrors the logbook, with no spreadsheet to open.',
              p2:'They also show up on the <b>In class</b> shelf, in the <b>Who came to tutoring</b> card, for a quick look.',
              btnLink:'Open Tutoring Attendance 🙋', btn:'Got it 👍' },
        es: { selo:'Novedad',
              t:'Ya puedes ver quién fue a la tutoría 🙋',
              p1:'El Hub tiene una herramienta nueva, <b>Asistencia a la Tutoría</b>: tus alumnos que fueron a la tutoría en los últimos 14 días, con el día, el monitor y lo que se hizo. Es el espejo del Diario de a Bordo, sin abrir la planilla.',
              p2:'También aparecen en el estante <b>En clase</b>, en la tarjeta <b>Quién fue a la tutoría</b>, para verlo de un vistazo.',
              btnLink:'Abrir Asistencia a la Tutoría 🙋', btn:'Entendido 👍' }
      },
      {
        /* A CERIMÔNIA DE SELEÇÃO: a campanha de setembro, até 10/10/2026 */
        id: 'cerimonia-selecao-2026-09',
        desde: '2026-09-06', ate: '2026-10-10',
        link: { href: 'hogwarts.html' },
        pt: { selo:'Campanha',
              t:'A Cerimônia de Seleção vai até 10/10 🎩',
              p1:'O Chapéu Seletor está no Portal do Aluno e aqui no Hub: cada aluno responde às perguntas <b>uma vez só</b> e descobre a casa dele, e o portal passa a vestir as cores dela.',
              p2:'Você também pode fazer a sua. A casa aparece na faixa do topo do Hub, e os pontos das casas somam o que os alunos praticam no portal.',
              btnLink:'Fazer a minha Cerimônia 🎩', btn:'Entendi 👍' },
        en: { selo:'Campaign',
              t:'The Sorting Ceremony runs until October 10 🎩',
              p1:'The Sorting Hat is in the Student Portal and here in the Hub: each student answers the questions <b>only once</b> and finds out their house, and the portal starts wearing its colours.',
              p2:'You can do yours too. Your house shows on the Hub’s top banner, and house points add up what students practise in the portal.',
              btnLink:'Take my Sorting Ceremony 🎩', btn:'Got it 👍' },
        es: { selo:'Campaña',
              t:'La Ceremonia de Selección va hasta el 10/10 🎩',
              p1:'El Sombrero Seleccionador está en el Portal del Alumno y aquí en el Hub: cada alumno responde las preguntas <b>una sola vez</b> y descubre su casa, y el portal pasa a vestir sus colores.',
              p2:'Tú también puedes hacer la tuya. La casa aparece en la franja de arriba del Hub, y los puntos de las casas suman lo que los alumnos practican en el portal.',
              btnLink:'Hacer mi Ceremonia 🎩', btn:'Entendido 👍' }
      },
      {
        /* O ACESSO KIDS do Portal do Aluno: a chave de sala do plantão das crianças. Mesma ofuscação da senha
           das provas (a página é pública): atrito, não cofre. */
        id: 'acesso-kids-2026-09',
        desde: '2026-09-05', ate: '2026-12-15',
        senha: String.fromCharCode(75,73,68,83),
        pt: { selo:'Turmas Kids',
              t:'O Portal do Aluno tem um acesso para as turmas Kids 🧒',
              p1:'A criança das turmas infantis quase nunca sabe o RAF. Para ela ouvir os áudios e ver os vídeos do livro no computador da escola, entre no <b>Portal do Aluno</b> com o acesso abaixo, no lugar do RAF.',
              rot:'No lugar do RAF, digite',
              cuidado:'É uma chave de sala, sua: não passe para o aluno. Ela abre só os áudios, os vídeos e os aplicativos dos livros Kids, e nada do que for feito ali vira Fisk Dólar ou histórico.',
              btn:'Entendi 👍' },
        en: { selo:'Kids classes',
              t:'The Student Portal has a login for Kids classes 🧒',
              p1:'Young children hardly ever know their RAF. So they can listen to the book audio and watch the videos on the school computer, log in to the <b>Student Portal</b> with the access below, in place of the RAF.',
              rot:'In place of the RAF, type',
              cuidado:'It is a classroom key, yours: do not pass it on to students. It opens only the audio, videos and apps of the Kids books, and nothing done there earns Fisk Dollars or history.',
              btn:'Got it 👍' },
        es: { selo:'Grupos Kids',
              t:'El Portal del Alumno tiene un acceso para los grupos Kids 🧒',
              p1:'El niño de los grupos infantiles casi nunca sabe su RAF. Para que escuche los audios y vea los videos del libro en la computadora de la escuela, entra al <b>Portal del Alumno</b> con el acceso de abajo, en lugar del RAF.',
              rot:'En lugar del RAF, escribe',
              cuidado:'Es una llave de sala, tuya: no se la pases al alumno. Abre solo los audios, los videos y las aplicaciones de los libros Kids, y nada de lo que se haga ahí suma Fisk Dólares ni historial.',
              btn:'Entendido 👍' }
      },
      {
        /* SÓ PARA QUEM TEM ALUNO DE SIMULADO (pedido do Pedro, 29/09/2026): professor que só dá aula para
           criança não precisa saber disso. `publico:'met'` = tem aluno ativo de In Focus ou Fluency 2 no card
           (ver `publicoMet`). */
        id: 'fpa-e-simulados-2026-09',
        desde: '2026-09-29',
        ate: '2026-11-15',
        publico: 'met',
        link: { href: 'corretor-met.html' },
        pt: { selo:'Novidade',
              t:'As notas do Fisk Portas Abertas e dos simulados já chegam sozinhas ao aluno 🎓',
              p1:'Os alunos que já apresentaram no <b>Fisk Portas Abertas</b> agora veem a avaliação deles no <b>Portal do Aluno</b>: um card novo, uma cortina de parabéns e o <b>Evaluation Report</b> que você preencheu, em tela e em PDF. O aluno recebe só o relatório dele, nunca um link do Drive da escola.',
              p2:'E o simulado presencial corrigido pela <b>ferramenta do professor</b> (a foto da folha de respostas) segue sozinho para três lugares:',
              li1:'o <b>card</b>: a data e a nota entram nas colunas TEST do aluno, na hora;',
              li2:'o <b>Portal do Aluno</b>: o aluno vê a tabela SCORE completa e o que revisar;',
              li3:'a <b>tabela de acompanhamento</b> da secretaria, com o detalhamento das seções como anotação na célula.',
              cuidado:'Para o relatório do FPA aparecer, salve o PDF com <b>"Evaluation Report"</b> e o <b>nome completo do aluno</b> no título, como vocês já fazem. Ele chega ao portal no dia seguinte.',
              btnLink:'Abrir o corretor de simulados 📷', btn:'Entendi 👍' },
        en: { selo:'What\u2019s new',
              t:'Fisk Portas Abertas and mock test grades now reach students automatically 🎓',
              p1:'Students who have already presented at <b>Fisk Portas Abertas</b> can now see their evaluation in the <b>Student Portal</b>: a new card, a congratulations screen and the <b>Evaluation Report</b> you filled in, on screen and as a PDF. Each student gets only their own report, never a link to the school Drive.',
              p2:'And a mock test graded with the <b>teacher tool</b> (the photo of the answer sheet) now goes by itself to three places:',
              li1:'the <b>card</b>: the date and the grade go into the student\'s TEST columns right away;',
              li2:'the <b>Student Portal</b>: the student sees the full SCORE table and what to review;',
              li3:'the office\'s <b>tracking sheet</b>, with the section breakdown as a note on the cell.',
              cuidado:'For the FPA report to show up, save the PDF with <b>"Evaluation Report"</b> and the student\'s <b>full name</b> in the title, as you already do. It reaches the portal the next day.',
              btnLink:'Open the mock test grader 📷', btn:'Got it 👍' },
        es: { selo:'Novedad',
              t:'Las notas del Fisk Portas Abertas y de los simulacros ya llegan solas al alumno 🎓',
              p1:'Los alumnos que ya presentaron en el <b>Fisk Portas Abertas</b> ahora ven su evaluación en el <b>Portal del Alumno</b>: una tarjeta nueva, una pantalla de felicitación y el <b>Evaluation Report</b> que llenaste, en pantalla y en PDF. Cada alumno recibe solo su informe, nunca un enlace al Drive de la escuela.',
              p2:'Y el simulacro presencial corregido con la <b>herramienta del profesor</b> (la foto de la hoja de respuestas) va solo a tres lugares:',
              li1:'la <b>tarjeta (card)</b>: la fecha y la nota entran en las columnas TEST del alumno, al instante;',
              li2:'el <b>Portal del Alumno</b>: el alumno ve la tabla SCORE completa y qué repasar;',
              li3:'la <b>tabla de seguimiento</b> de la secretaría, con el detalle de las secciones como nota en la celda.',
              cuidado:'Para que aparezca el informe del FPA, guarda el PDF con <b>"Evaluation Report"</b> y el <b>nombre completo del alumno</b> en el título, como ya lo hacen. Llega al portal al día siguiente.',
              btnLink:'Abrir el corrector de simulacros 📷', btn:'Entendido 👍' },
      },
      {
        id: 'apps-da-fisk-2026-09',
        desde: '2026-09-10',
        ate: '2026-11-30',
        link: { href: 'apps.html' },
        pt: { selo:'Novidade',
              t:'Já dá para saber, na hora, qual app a sua turma precisa baixar 📱',
              p1:'O Hub tem uma área nova, <b>Aplicativos da Fisk</b>: os 34 aplicativos que a franqueadora publica nas lojas, com <b>qual deles serve a qual estágio</b> e o link para baixar no Android e no iPhone. A régua é a Circular 29/25 da Fundação — não é o que dá para deduzir pelo nome.',
              p2:'Ela existe para você orientar o aluno, e o mesmo card está em mais dois lugares:',
              li1:'no acesso <b>KIDS</b> do Portal do Aluno (que é seu, para o plantão das crianças): dentro de cada estágio, ao lado dos áudios e dos vídeos;',
              li2:'no <b>Portal do Aluno</b> de Teens Connect em diante, o espanhol incluído — ali o aluno vê só os apps do estágio dele.',
              cuidado:'Confira a plataforma antes de indicar: três Cyber Fun só existem para iPhone, e o Fisk Helper e o New Fisk Player só para Android. O card avisa quando falta.',
              p3:'O <b>Fisk Helper</b> e o <b>New Fisk Player</b> aparecem só para você: são de uso interno da escola e nunca chegam à tela do aluno.',
              btnLink:'Ver os aplicativos 📱', btn:'Entendi 👍' },
        en: { selo:'What\u2019s new',
              t:'Now you can tell, on the spot, which app your class needs 📱',
              p1:'The Hub has a new area, <b>Fisk apps</b>: the 34 apps the franchisor publishes in the stores, with <b>which one belongs to which level</b> and the link to download on Android and iPhone. The rule is the Foundation\u2019s Circular 29/25 — not what the name suggests.',
              p2:'It is there so you can guide your students, and the same card lives in two more places:',
              li1:'in the <b>KIDS</b> login of the Student Portal (which is yours, for the children\u2019s drop-in): inside each level, next to the audio and the videos;',
              li2:'in the <b>Student Portal</b> from Teens Connect on, Spanish included — there the student sees only the apps for their own level.',
              cuidado:'Check the platform before recommending: three Cyber Fun apps exist only for iPhone, and Fisk Helper and New Fisk Player only for Android. The card says so when one is missing.',
              p3:'<b>Fisk Helper</b> and <b>New Fisk Player</b> show up for you only: they are for school use and never reach a student\u2019s screen.',
              btnLink:'See the apps 📱', btn:'Got it 👍' },
        es: { selo:'Novedad',
              t:'Ya puedes saber, al instante, qué app necesita tu grupo 📱',
              p1:'El Hub tiene un área nueva, <b>Aplicaciones de Fisk</b>: las 34 aplicaciones que la franquicia publica en las tiendas, con <b>cuál sirve a cada nivel</b> y el enlace para descargar en Android y iPhone. La regla es la Circular 29/25 de la Fundación — no lo que sugiere el nombre.',
              p2:'Existe para que orientes al alumno, y la misma tarjeta está en dos lugares más:',
              li1:'en el acceso <b>KIDS</b> del Portal del Alumno (que es tuyo, para la tutoría de los niños): dentro de cada nivel, junto a los audios y los videos;',
              li2:'en el <b>Portal del Alumno</b> de Teens Connect en adelante, el español incluido — ahí el alumno ve solo las apps de su nivel.',
              cuidado:'Confirma la plataforma antes de indicar: tres Cyber Fun solo existen para iPhone, y Fisk Helper y New Fisk Player solo para Android. La tarjeta lo avisa.',
              p3:'El <b>Fisk Helper</b> y el <b>New Fisk Player</b> aparecen solo para ti: son de uso interno de la escuela y nunca llegan a la pantalla del alumno.',
              btnLink:'Ver las aplicaciones 📱', btn:'Entendido 👍' }
      },
      {
        id: 'provas-audio-2026-09',
        desde: '2026-09-05',
        ate: '2026-10-15',                       // AAAA-MM-DD, some sozinha depois
        /* ⚠️ A SENHA APARECE AQUI, e por isso ela não está escrita em texto no
           fonte: o Hub é servido pelo GitHub Pages e a página é pública, então
           `Ctrl+F ksif` acharia. O código abaixo é OFUSCAÇÃO, não segredo —
           quem ler o JavaScript com atenção monta a palavra em dez segundos. É
           o mesmo nível de proteção da própria trava (ver o comentário do
           `prova` no config.js do Portal do Aluno): atrito, não cofre. */
        senha: String.fromCharCode(107,115,105,102),
        pt: { selo:'Novidade',
              t:'Os áudios das provas agora estão no Portal do Aluno 🎧',
              p1:'Os áudios das provas auditivas saíram do computador da escola e estão no Portal do Aluno, em <b>Áudios do livro</b>, numa seção separada chamada <b>TESTS</b> (no espanhol, <b>TEST DE ESCUCHA</b>).',
              p2:'<b>Ela nasce trancada.</b> Para abrir, na hora da prova:',
              li1:'Abra a seção <b>TESTS</b>, no fim da lista de áudios.',
              li2:'Digite a senha abaixo no aparelho e toque em <b>Liberar</b>.',
              li3:'Os áudios ficam abertos por <b>1 hora</b> naquele aparelho.',
              rot:'A senha é',
              cuidado:'O campo esconde o que você digita, em bolinhas. A ideia é que você digite de frente para o teclado, sem ditar em voz alta — assim o aluno não ouve a prova antes.',
              p3:'Se a prova for no fone de cada aluno, digite a senha no aparelho de cada um. Ouvir esses áudios <b>não dá Fisk Dólares</b> e não fecha lição nenhuma.',
              btn:'Entendi 👍' },
        en: { selo:'What\u2019s new',
              t:'The test audio is now in the Student Portal 🎧',
              p1:'The listening test audio has moved off the school computer and into the Student Portal, under <b>Book audio</b>, in a separate section called <b>TESTS</b> (in Spanish, <b>TEST DE ESCUCHA</b>).',
              p2:'<b>It starts locked.</b> To open it at test time:',
              li1:'Open the <b>TESTS</b> section, at the end of the audio list.',
              li2:'Type the code below on the device and tap <b>Unlock</b>.',
              li3:'The audio stays open for <b>1 hour</b> on that device.',
              rot:'The code is',
              cuidado:'The field hides what you type, as dots. The idea is that you type facing the keyboard, without saying it out loud — so students do not hear the test beforehand.',
              p3:'If students take the test on their own headphones, type the code on each device. Listening to this audio <b>earns no Fisk Dollars</b> and does not complete any lesson.',
              btn:'Got it 👍' },
        es: { selo:'Novedad',
              t:'Los audios de las pruebas ya están en el Portal del Alumno 🎧',
              p1:'Los audios de las pruebas auditivas salieron de la computadora de la escuela y están en el Portal del Alumno, en <b>Audios del libro</b>, en una sección aparte llamada <b>TEST DE ESCUCHA</b> (en inglés, <b>TESTS</b>).',
              p2:'<b>Nace bloqueada.</b> Para abrirla, a la hora de la prueba:',
              li1:'Abre la sección <b>TEST DE ESCUCHA</b>, al final de la lista de audios.',
              li2:'Escribe la contraseña de abajo en el aparato y toca <b>Liberar</b>.',
              li3:'Los audios quedan abiertos por <b>1 hora</b> en ese aparato.',
              rot:'La contraseña es',
              cuidado:'El campo esconde lo que escribes, en puntos. La idea es que escribas de frente al teclado, sin decirla en voz alta — así el alumno no oye la prueba antes.',
              p3:'Si la prueba es con los auriculares de cada alumno, escribe la contraseña en cada aparato. Escuchar estos audios <b>no da Fisk Dólares</b> y no cierra ninguna lección.',
              btn:'Entendido 👍' }
      }
      ];

      function avisoVisto(id, nome){
        try { return localStorage.getItem('fisk_aviso_' + id + '_' + nome) === '1'; }
        catch(e) { return true; }                // sem localStorage: não insista
      }
      /* AS NOVIDADES VIRARAM RECADO DO BUDDY (Pedro, 06/10/2026): a lista acima não abre mais em cortina. Quem a
         desenha agora é a conversa do Buddy, na coluna da direita da home, com a caixinha "Li e estou ciente".
         O que o professor já tinha confirmado na cortina continua confirmado (a mesma chave do aparelho). */
      window._hubNoticias = { lista: AVISOS, visto: avisoVisto, publicoMet: publicoMet };
      /* a cortina do My Avatar (falha fechada, como a antiga): só com o avatar aberto para este professor */
      function cortinaDoAvatar(){
        try{
          var s = saved(); if (!s || !s.name || document.getElementById('av-mask')) return;
          var d = new Date(), hoje = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
          if (hoje < AVISO_AVATAR.desde || hoje > AVISO_AVATAR.ate || avisoVisto(AVISO_AVATAR.id, s.name)) return;
          avisoMostra(AVISO_AVATAR, s);
        }catch(e){ /* aviso nunca pode segurar o Hub */ }
      }
      function avisoNovidade(){
        return;   /* a cortina saiu; ver o comentário acima */
        try{
          var s = saved(); if (!s || !s.name) return;
          if (document.getElementById('av-mask')) return;   // já está na tela
          var d = new Date();
          var hoje = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
          /* A escolha virou assíncrona por causa do `publico`: saber se o professor tem aluno de simulado custa
             uma leitura das turmas dele. Enquanto ela não volta, nada aparece (falha fechada, como o resto). */
          (function escolhe(i){
            if (i >= AVISOS.length) return;
            var a = AVISOS[i];
            if (!a || !a.id || !/^\d{4}-\d{2}-\d{2}$/.test(a.ate) || hoje > a.ate || avisoVisto(a.id, s.name)) return escolhe(i + 1);
            if (a.publico === 'met') return publicoMet(s, function(ok){ if (ok) avisoMostra(a, s); else escolhe(i + 1); });
            avisoMostra(a, s);
          })(0);
        }catch(e){ /* aviso nunca pode segurar o Hub */ }
      }

      /* O professor tem aluno que faz simulado do MET? Aluno ATIVO de In Focus ou Fluency 2 no card, nas escolas
         dele (a mesma leitura `panoramaProf` do painel da home). Guardado por um dia no aparelho; leitura que falhou
         em todas as escolas não é guardada, para tentar de novo na próxima entrada. A direção sempre vê. */
      function publicoMet(s, cb){
        try{
          if (s.master) return cb(true);
          var k = 'fisk_pub_met_' + s.name;
          try { var c = JSON.parse(localStorage.getItem(k) || 'null'); if (c && Date.now() - c.t < 86400000) return cb(!!c.v); } catch(e){}
          var escolas = String(s.escolas || s.escola || '').split(',').map(function(x){ return x.trim(); }).filter(Boolean);
          var tem = false, ok = 0;
          (function prox(i){
            if (tem || i >= escolas.length){
              if (tem || ok) { try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), v: tem })); } catch(e){} }
              return cb(tem);
            }
            panorama(escolas[i], s.name)
              .then(function(j){ ok++; (j.alunos || []).forEach(function(a){ if (a && !a.saiu && /focus|fluency\s*2/i.test(String(a.book || ''))) tem = true; }); })
              .catch(function(){})
              .then(function(){ prox(i + 1); });
          })(0);
        }catch(e){ cb(false); }
      }

      function avisoMostra(AVISO, s){
        try{

          var st = document.createElement('style');
          st.textContent =
            '#av-mask{position:fixed;inset:0;z-index:9995;background:rgba(15,12,12,.62);display:flex;' +
            'align-items:center;justify-content:center;padding:1rem}' +
            '#av-card{background:var(--white,#fff);color:var(--black,#161414);border-radius:18px;' +
            'border-top:6px solid var(--ui,#2b4d70);max-width:34rem;width:100%;max-height:88vh;overflow:auto;' +
            'padding:1.5rem 1.6rem 1.3rem;box-shadow:0 20px 50px rgba(0,0,0,.35)}' +
            '#av-card .av-selo{display:inline-block;background:var(--ui-soft,#e9eff5);color:var(--ui-ink,#1d3349);' +
            'font-weight:800;font-size:.74rem;letter-spacing:.04em;text-transform:uppercase;' +
            'padding:.3rem .7rem;border-radius:999px}' +
            '#av-card h2{font-family:var(--font-heading);font-size:1.25rem;line-height:1.3;margin:.6rem 0 .5rem}' +
            '#av-card p{font-size:.95rem;line-height:1.55;margin:0 0 .7rem;color:var(--black,#161414)}' +
            '#av-card ol{margin:.2rem 0 .9rem 1.1rem;padding:0;font-size:.95rem;line-height:1.6}' +
            '#av-card li{margin-bottom:.3rem}' +
            '.av-senha{background:var(--ui-soft,#e9eff5);border:1.5px dashed var(--ui-bd,#9db6cb);border-radius:14px;' +
            'padding:.9rem 1rem;text-align:center;margin:.2rem 0 1rem}' +
            '.av-senha .rot{font-size:.76rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;' +
            'color:var(--ui-ink,#1d3349);display:block;margin-bottom:.25rem}' +
            '.av-senha .val{font-family:var(--font-heading);font-size:2rem;font-weight:800;letter-spacing:.35em;' +
            'color:var(--ui,#2b4d70);display:block;padding-left:.35em}' +
            '.av-cuidado{background:#fdf3e3;border-left:4px solid var(--gold,#c9922e);border-radius:10px;' +
            'padding:.7rem .9rem;font-size:.9rem;line-height:1.5;margin:0 0 1rem}' +
            '#av-ok,.av-ir{background:var(--ui,#2b4d70);color:#fff;border:none;border-radius:12px;width:100%;' +
            'padding:.8rem 1rem;font:inherit;font-weight:800;font-size:1rem;cursor:pointer;' +
            'display:block;text-align:center;text-decoration:none;box-sizing:border-box}' +
            '#av-ok.secund{background:transparent;color:var(--ui,#2b4d70);border:1.5px solid var(--ui-bd,#9db6cb);margin-top:.5rem}' +
            'body.theme-dark #av-card{background:#211e1e;color:#f2efef}' +
            'body.theme-dark #av-card p,body.theme-dark #av-card li{color:#f2efef}' +
            'body.theme-dark #av-ok.secund{color:#f2efef}' +
            'body.theme-dark .av-cuidado{background:#3a2f14;color:#f5d78e}';
          document.head.appendChild(st);

          var tx = AVISO[(typeof _lang !== 'undefined' && AVISO[_lang]) ? _lang : 'pt'];
          var mask = document.createElement('div');
          mask.id = 'av-mask';
          /* só escreve o que o aviso trouxer: senha, lista e cuidado são
             opcionais, e um aviso sem eles não pode desenhar caixa vazia */
          var lista = (tx.li1 || tx.li2 || tx.li3)
            ? '<ol>' + [tx.li1, tx.li2, tx.li3].filter(Boolean).map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ol>'
            : '';
          mask.innerHTML =
            '<div id="av-card" role="dialog" aria-modal="true" aria-labelledby="av-t">' +
              '<span class="av-selo">' + tx.selo + '</span>' +
              '<h2 id="av-t">' + tx.t + '</h2>' +
              '<p>' + tx.p1 + '</p>' +
              (tx.p2 ? '<p>' + tx.p2 + '</p>' : '') +
              lista +
              (AVISO.senha ? '<div class="av-senha"><span class="rot">' + tx.rot + '</span>' +
                '<span class="val">' + AVISO.senha + '</span></div>' : '') +
              (tx.cuidado ? '<div class="av-cuidado">' + tx.cuidado + '</div>' : '') +
              (tx.p3 ? '<p>' + tx.p3 + '</p>' : '') +
              (AVISO.link ? '<a class="av-ir" id="av-ir" href="' + AVISO.link.href + '">' + (tx.btnLink || tx.btn) + '</a>' : '') +
              '<button id="av-ok" type="button" class="' + (AVISO.link ? 'secund' : '') + '">' + tx.btn + '</button>' +
            '</div>';
          document.body.appendChild(mask);
          document.body.style.overflow = 'hidden';

          function fechar(){
            try { localStorage.setItem('fisk_aviso_' + AVISO.id + '_' + s.name, '1'); } catch(e) {}
            mask.remove();
            document.body.style.overflow = '';
          }
          document.getElementById('av-ok').addEventListener('click', fechar);
          /* quem clica em "ver" também deu ciência: ele vai PARA a novidade, e
             receber a mesma cortina ao voltar seria castigo por ter obedecido */
          var ir = document.getElementById('av-ir');
          if (ir) ir.addEventListener('click', function(){
            try { localStorage.setItem('fisk_aviso_' + AVISO.id + '_' + s.name, '1'); } catch(e) {}
          });
          /* fecha no Esc e no clique fora, e AMBOS marcam ciência: o professor
             que fechou já viu o aviso, e insistir na terceira aula seguinte é
             barulho. Para reapresentar a todos, troque o `id`. */
          mask.addEventListener('click', function(e){ if (e.target === mask) fechar(); });
          document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && document.getElementById('av-mask')) fechar(); });
        }catch(e){ /* aviso nunca pode segurar o Hub */ }
      }

      /* Este é o portal do PROFESSOR: a lista mostra só quem dá aula.
         A secretaria tem o portal dela (secretaria.html), e misturar as duas
         equipes numa lista só fazia cada um procurar o próprio nome no meio
         do time inteiro da escola. Cargo em branco é professor — os primeiros
         dezoito cadastros vieram antes de a coluna Cargo existir. A direção
         continua na lista porque também usa as ferramentas do Hub. */
      function ehProfessor(p){
        var c = String((p && p.cargo) || '')
          .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
        return c.indexOf('secretar') !== 0;
      }
      function loadProfs(){
        sel.innerHTML = '<option value="" disabled selected>' + tr('pg-loading') + '</option>';
        sel.disabled = true; sel.classList.add('carregando'); $('pgCarrega').hidden = false;
        var pronto = function(){ sel.disabled = false; sel.classList.remove('carregando'); $('pgCarrega').hidden = true; };
        fiskFetch(EP + '?action=profList').then(function(res){
          pronto();
          var ps = ((res && res.profs) || []).filter(ehProfessor);
          ps.sort(function(a, b){ return String(a.name).localeCompare(String(b.name), 'pt-BR'); });
          sel.innerHTML = '<option value="" disabled selected>' + tr('pg-name-ph') + '</option>' +
            ps.map(function(p){
              var nm = String(p.name).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
              var esc = String(p.escolas || '').replace(/,/g, ' + ');
              return '<option value="' + nm + '">' + nm + (esc ? ' · ' + esc : '') + (p.registered ? '  ✓' : '') + '</option>';
            }).join('');
        }).catch(function(){
          /* o servidor acordando devagar deixava a lista vazia e calada (auditoria de 26/10/2026): agora diz e oferece de novo */
          pronto(); sel.innerHTML = '<option value="" disabled selected></option>';
          msg.innerHTML = '⚠️ Não consegui carregar a lista de professores. <button type="button" id="pgDeNovo" style="font-weight:800;border:0;background:none;color:inherit;text-decoration:underline;cursor:pointer">Tentar de novo</button>';
          var b = $('pgDeNovo'); if (b) b.onclick = function(){ msg.textContent = ''; loadProfs(); };
        });
      }

      // Só login: o cadastro/senha agora é feito e entregue pela direção.
      function setMode(m){
        mode = 'login';
        sub.textContent = tr('pg-tab-login');
        $('pgPass').setAttribute('autocomplete', 'current-password');
        msg.textContent = '';
      }

      function post(body){
        return fiskFetch(EP, body);
      }
      /* o pedido profHome, guardando no aparelho o que as outras páginas reaproveitam (buddyInfo, aniversariantes, calendário) */
      window.fiskProfHomePede = function(token, post){
        var p = post({ action:'profHome', token: token }).then(function(r){
          if (!r || r.ok !== true || !r.perfil) return null;   /* rota desconhecida ou resposta estranha: chamadas antigas */
          try {
            if (r.buddy && typeof fiskBuddyInfoGuarda === 'function') fiskBuddyInfoGuarda(r.buddy);
            if (r.aniversariantes && r.aniversariantes.ok) fiskCacheGuarda(FISK_ANIV_LISTA_CHAVE, r.aniversariantes.aniversariantes || []);
            if (r.cal && r.cal.ok && Array.isArray(r.cal.itens)) {
              var ano = String(new Date().getFullYear());   /* só o ano corrente: a Minha semana pede o seguinte à parte */
              fiskCacheGuarda('hub:cal:pedag:' + ano, r.cal.itens.filter(function(it){ return String(it.inicio || '').indexOf(ano) === 0; }));
            }
          } catch (e) {}
          return r;
        }).catch(function(){ return null; });
        p.quando = Date.now();
        return p;
      };

      function submit(){
        if (sub.disabled) return;   /* o Enter na senha mandava um segundo login, e cada login troca o token */
        var name = sel.value, pass = $('pgPass').value;
        if (!name){ msg.textContent = tr('pg-pick-name'); return; }
        if (!pass){ msg.textContent = tr('pg-need-pass'); return; }
        var p;
        if (mode === 'register'){
          if (pass.length < 4){ msg.textContent = tr('pg-short'); return; }
          if (pass !== $('pgPass2').value){ msg.textContent = tr('pg-nomatch'); return; }
          p = post({ action:'profRegister', name:name, password:pass, fullName:$('pgFull').value });
        } else {
          p = post({ action:'profLogin', name:name, password:pass });
        }
        sub.disabled = true; msg.textContent = tr('pg-wait');
        p.then(function(res){
          sub.disabled = false;
          if (res && res.ok){
            msg.textContent = '';
            /* token de sessão SSO: viaja junto do perfil para as ferramentas
               em outros domínios (ex.: Conversation Maker) via #proftok= */
            if (res.token && res.prof) res.prof.token = res.token;
            enter(res.prof);
          }
          else { msg.textContent = (res && res.error) || tr('pg-err'); }
        }).catch(function(){ sub.disabled = false; msg.textContent = tr('pg-err'); });
      }

      sub.addEventListener('click', submit);
      $('pgPass').addEventListener('keydown', function(e){ if (e.key === 'Enter') submit(); });
      $('pgPass2').addEventListener('keydown', function(e){ if (e.key === 'Enter') submit(); });
      /* o seletor de idioma da tela de login saiu em 23/09/2026; sem o
         elemento, este ouvinte estourava e levava junto as linhas de baixo */
      $('profLogout').addEventListener('click', function(){
        var era = saved();
        /* sessão E o que o Hub guardou sobre os alunos neste aparelho (M12); a fila de marcas pendentes fica */
        if (typeof fiskLimparAoSair === 'function') fiskLimparAoSair();
        else { try{ localStorage.removeItem('fisk_prof'); localStorage.removeItem('fisk_actas'); localStorage.removeItem('fisk_minidash'); }catch(e){} }
        try{ if (window.fiskLigaLogo) window.fiskLigaLogo(); }catch(e){}
        // saindo de uma visita da direção: volta para o Painel da Direção
        if (era && era.viewingAs){ location.href = 'https://portalfisk.com.br/diretor.html'; return; }
        location.reload();
      });

      /* A TROCA DE PERFIL (27/10/2026): o Portal da Secretaria abre o Hub com #perfiltok=<sessão nova de professor>,
         emitida pelo perfilTroca a partir da sessão de secretaria da mesma pessoa. É uma sessão normal (não visita). */
      var mPerf = location.hash.match(/#perfiltok=([^&]+)/);
      if (mPerf){
        var tokP = decodeURIComponent(mPerf[1]);
        history.replaceState(null, '', location.pathname + location.search);
        msg.textContent = tr('pg-wait');
        post({ action:'profCheck', token: tokP }).then(function(res){
          if (res && res.ok && res.prof){
            try{ localStorage.removeItem('fisk_actas'); localStorage.removeItem('fisk_minidash'); }catch(e){}
            res.prof.token = tokP; enter(res.prof);
          } else { loadProfs(); setMode('login'); setPlaceholders(); msg.textContent = (res && res.error) || tr('pg-err'); }
        }).catch(function(){ loadProfs(); setMode('login'); setPlaceholders(); msg.textContent = tr('pg-err'); });
        return;
      }

      /* "Ver como professor": #proftok=<token> de VISITA, emitido pelo Painel da
         Direção (dirImpersonate, exige token de diretor). Validado no servidor
         (profCheck) — a URL sozinha não abre nada. Não usa nem altera a senha
         do professor, e a sessão dele nos aparelhos continua valendo. */
      var mVis = location.hash.match(/#proftok=([^&]+)/);
      if (mVis){
        var tokVis = decodeURIComponent(mVis[1]);
        history.replaceState(null, '', location.pathname + location.search);
        msg.textContent = tr('pg-wait');
        post({ action:'profCheck', token: tokVis }).then(function(res){
          if (res && res.ok && res.prof){
            res.prof.token = tokVis;
            res.prof.viewingAs = true;   // barra mostra "vendo como" + "Sair da visão"
            enter(res.prof);
          } else {
            loadProfs(); setMode('login'); setPlaceholders();
            msg.textContent = (res && res.error) || tr('pg-err');
          }
        }).catch(function(){
          loadProfs(); setMode('login'); setPlaceholders();
          msg.textContent = tr('pg-err');
        });
        return;
      }

      /* acesso master da direção: #dirtok=<token> emitido pelo Painel da Direção.
         O token é validado no servidor (dirCheck) — nada de bypass por URL solta. */
      var mDir = location.hash.match(/#dirtok=([^&]+)/);
      if (mDir){
        history.replaceState(null, '', location.pathname + location.search);
        msg.textContent = tr('pg-wait');
        post({ action:'dirCheck', token: decodeURIComponent(mDir[1]) }).then(function(res){
          if (res && res.ok && res.director){
            res.director.master = true;
            /* o dirtok também vale como token SSO nas ferramentas externas
               (profCheck aceita token de diretor) — sem ele o Conversation
               Maker pediria login mesmo com o master logado */
            res.director.token = decodeURIComponent(mDir[1]);
            enter(res.director);
          }
          else {
            loadProfs(); setMode('login'); setPlaceholders();
            msg.textContent = (res && res.error) || tr('pg-err');
          }
        }).catch(function(){
          loadProfs(); setMode('login'); setPlaceholders();
          msg.textContent = tr('pg-err');
        });
        return;
      }

      var s = saved();
      if (s){
        fillBar(s); if (s.master) setupActAs(); updateToolLinks();  // já logado (prof-in veio do pre-paint)
        registrarHome();
        /* A SESSÃO GUARDADA AINDA VALE? (auditoria de 26/10/2026) A home só olhava se o fisk_prof existia. Com o token
           vencido (o login em outro aparelho troca o token), a ferramenta dizia "Sessão expirada, entre de novo", o link
           trazia de volta para cá, a home abria normal e a ferramenta falhava outra vez, sem saída. Agora a home pergunta
           ao servidor por trás; só a recusa EXPLÍCITA da sessão desloga (erro de rede não tira ninguém). */
        if (s.token && !s.master && !s.viewingAs) {
          /* A ROTA DE ABERTURA ÚNICA (auditoria de 30/10/2026, A4): um pedido `profHome` traz o perfil (o que o profCheck
             devolve), os avisos, os informes, os aniversariantes, o buddyInfo e o calendário, cada seção exatamente como a
             rota isolada devolve. O mural, o atalho do Buddy e a bolinha do kit (window.__fiskProfHome) esperam por ele em
             vez de pedir de novo. Sem `ok` ou com rota desconhecida (o backend pode subir depois do Hub), vira null e cada
             um volta às chamadas antigas. */
          window.__fiskProfHome = fiskProfHomePede(s.token, post);
          window.__fiskProfHome.then(function(r){
            return (r && r.perfil) ? r.perfil : post({ action:'profCheck', token: s.token });
          }).then(function(res){
            if (res && res.ok === false && /sess[ãa]o/i.test(String(res.error || ''))) {
              try { localStorage.removeItem('fisk_prof'); localStorage.removeItem('fisk_actas'); sessionStorage.setItem('fisk_sessao_caiu', '1'); } catch (e) {}
              location.reload();
            }
          }).catch(function(){});
        }
        // quem já estava logado não passa pelo enter(): o menu é montado aqui
        // (com `onIdioma`, como no enter: o idioma voltou ao menu em 09/10/2026)
        if (typeof fiskInitUserMenu === 'function') {
          fiskInitUserMenu({
            onIdioma: trocaIdioma,
            onSair: function(){ $('profLogout').click(); }
          });
        }
      }
      else {
        loadProfs(); setMode('login'); setPlaceholders();
        try { if (sessionStorage.getItem('fisk_sessao_caiu')) { sessionStorage.removeItem('fisk_sessao_caiu'); msg.textContent = 'Sua sessão expirou (talvez você tenha entrado em outro aparelho). Entre de novo.'; } } catch (e) {}
      }
    })();

    /* O MINI-DASH DO PROFESSOR (resumo das turmas e busca de aluno no topo da home) estava DESLIGADO desde 19/09/2026
       (home só com as ferramentas) e saiu do código em 31/10/2026 (auditoria de 30/10, B8); o git guarda (commit 7a9ef94). */

/* ═══ bloco 3 ═══ */
  /* ══ O BUDDY DO PROFESSOR (06/10/2026) ════════════════════════════════════
     O mesmo Buddy do Portal do Aluno, agora auxiliar do professor. A coluna tem
     duas partes, e é de propósito que sejam duas:

     · A CONVERSA: os informes da direção e da secretaria (rota `informesLer`)
       e as novidades do Hub (a lista `AVISOS`, que antes abria em cortina).
       Cada recado tem a caixinha "Li e estou ciente", um por um; a ciência vai
       para o servidor (`informeCiente`), e quem publicou vê quem marcou.
     · QUEM VEIO À TUTORIA: os alunos do professor nas últimas 2 semanas
       (`avisosLer`), cada um com o seu "Vi". Fica fora da conversa porque é
       muita linha pequena, e afogaria o recado que precisa de ciência.

     Os três pontinhos têm o tempo do Buddy do aluno (ver `digitando` no
     radar.js do portal). Nos três idiomas do Hub. Falha de rede deixa a coluna
     como estava, calada: recado nunca pode segurar a home. */
  (function buddyDoProfessor(){
    var $$ = function(id){ return document.getElementById(id); };
    var cx = $$('avisos'), chat = $$('bdChat'), sino = $$('avSino'), sinoN = $$('avSinoN'), fundo = $$('avFundo');
    var ttCard = $$('ttCard'), ttLista = $$('ttLista'), ttN = $$('ttN');
    var anCard = $$('anCard'), anLista = $$('anLista'), anN = $$('anN'), aniv = [];
    if (!cx || !chat || typeof FISK_HUB_EP === 'undefined') return;
    var CALMO = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    var TX = {
      pt: { sub:'da direção e da secretaria',
            oi1:'Oi, {n}! Eu sou o Buddy 🐻',
            oi2:'Sou o seu auxiliar aqui no Hub. É por mim que chegam os recados da direção e da secretaria, e eu também conto quando tiver novidade nas ferramentas.',
            oi3:'Cada recado tem uma caixinha: marque quando tiver lido. E os alunos seus que forem à tutoria aparecem logo aqui embaixo.',
            ola:'Oi, {n}.', novo1:'Tem 1 recado novo para você.', novoN:'Tem {q} recados novos para você.',
            nada:'Nenhuma novidade sem ler.',
            antigos:'Ver os {q} já lidos', antigo1:'Ver o recado já lido', esconder:'Esconder os já lidos',
            ciente:'Li e estou ciente', tDir:'Direção', tSec:'Secretaria', tNov:'Novidade', nome:'Novidades', tAniv:'Aniversário', anTit:'🎂 Aniversariantes da semana', anSub:'de segunda a domingo', anVazio:'Nenhum aluno seu faz aniversário nesta semana.', anRec:'🎂 Aniversariantes desta semana', anHoje:'é hoje!', anProx:'Semana que vem', anProxVazio:'Ninguém na semana que vem.',
            ttTit:'🙋 Quem veio à tutoria', ttSub:'nas últimas 2 semanas', ttVazio:'Nenhum aluno seu por enquanto.',
            ttLink:'Ver a frequência completa →', vi:'Vi', veio:' foi à tutoria',
            falar:'Ver as novidades', saiu:'As novidades saíram da tela. Para ver de novo, clique no seu nome, lá em cima, e em "Ver as novidades".' },
      en: { sub:'from the direction and the office',
            oi1:'Hi, {n}! I’m Buddy 🐻',
            oi2:'I’m your assistant here in the Hub. Notices from the direction and the office reach you through me, and I’ll also tell you when a tool has something new.',
            oi3:'Each notice has a box: tick it once you’ve read it. And your students who come to tutoring show up right below.',
            ola:'Hi, {n}.', novo1:'You have 1 new notice.', novoN:'You have {q} new notices.',
            nada:'Nothing new to read.',
            antigos:'See the {q} already read', antigo1:'See the notice already read', esconder:'Hide the ones already read',
            ciente:'Read and acknowledged', tDir:'Direction', tSec:'Office', tNov:'What’s new', nome:'What’s new', tAniv:'Birthday', anTit:'🎂 Birthdays this week', anSub:'Monday to Sunday', anVazio:'None of your students has a birthday this week.', anRec:'🎂 Birthdays this week', anHoje:'today!', anProx:'Next week', anProxVazio:'No one next week.',
            ttTit:'🙋 Who came to tutoring', ttSub:'in the last 2 weeks', ttVazio:'None of your students so far.',
            ttLink:'See the full attendance →', vi:'Seen', veio:' foi à tutoria',
            falar:'See what’s new', saiu:'The news panel left the screen. To see it again, click your name at the top and choose "See what’s new".' },
      es: { sub:'de la dirección y la secretaría',
            oi1:'¡Hola, {n}! Soy Buddy 🐻',
            oi2:'Soy tu auxiliar aquí en el Hub. Por mí llegan los avisos de la dirección y de la secretaría, y también te cuento cuando haya novedad en las herramientas.',
            oi3:'Cada aviso tiene una casilla: márcala cuando lo hayas leído. Y tus alumnos que vayan a la tutoría aparecen aquí abajo.',
            ola:'Hola, {n}.', novo1:'Tienes 1 aviso nuevo.', novoN:'Tienes {q} avisos nuevos.',
            nada:'Ninguna novedad sin leer.',
            antigos:'Ver los {q} ya leídos', antigo1:'Ver el aviso ya leído', esconder:'Ocultar los ya leídos',
            ciente:'Leído y enterado', tDir:'Dirección', tSec:'Secretaría', tNov:'Novedad', nome:'Novedades', tAniv:'Cumpleaños', anTit:'🎂 Cumpleaños de la semana', anSub:'de lunes a domingo', anVazio:'Ningún alumno tuyo cumple años esta semana.', anRec:'🎂 Cumpleaños de esta semana', anHoje:'¡es hoy!', anProx:'La próxima semana', anProxVazio:'Nadie la próxima semana.',
            ttTit:'🙋 Quién fue a la tutoría', ttSub:'en las últimas 2 semanas', ttVazio:'Ningún alumno tuyo por ahora.',
            ttLink:'Ver la asistencia completa →', vi:'Visto', veio:' foi à tutoria',
            falar:'Ver las novedades', saiu:'Las novedades salieron de la pantalla. Para verlas de nuevo, haz clic en tu nombre, arriba, y en "Ver las novedades".' }
    };
    function lang(){ return (typeof _lang !== 'undefined' && TX[_lang]) ? _lang : 'pt'; }
    function tx(k, v){ var t = TX[lang()][k] || TX.pt[k] || ''; if (v) Object.keys(v).forEach(function(x){ t = t.replace('{' + x + '}', v[x]); }); return t; }

    function sess(){ try{ return JSON.parse(localStorage.getItem('fisk_prof')||'null'); }catch(e){ return null; } }
    function como(){ var s = sess(); if (!s || !s.master) return ''; try{ return (JSON.parse(localStorage.getItem('fisk_actas')||'null')||{}).name||''; }catch(e){ return ''; } }
    function eu(){ var s = sess() || {}; return como() || s.name || ''; }
    function prim(){ var p = String(eu()).trim().split(/\s+/)[0] || ''; return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(); }
    function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
    /* o texto de quem publica é texto puro: escapa, quebra a linha e liga só o que é endereço http(s) */
    function texto(t){
      return esc(t).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');
    }
    function post(body){
      var s = sess(); if (!s || !s.token) return Promise.reject(new Error('sem sessão'));
      body.token = s.token;
      return fiskFetch(FISK_HUB_EP, body);
    }
    function hojeIso(){ var d = new Date(); return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2); }
    function ddmm(ms){ var d = new Date(ms); return ('0'+d.getDate()).slice(-2) + '/' + ('0'+(d.getMonth()+1)).slice(-2); }

    /* ── as novidades do Hub viram recado ── */
    function daNoticia(a, cientes){
      var t = a[lang()] || a.pt, s = sess() || {};
      var lista = [t.li1, t.li2, t.li3].filter(Boolean);
      var visto = false;
      try { visto = !!(window._hubNoticias && window._hubNoticias.visto(a.id, s.name)); } catch(e) {}
      return { id: 'fixo:' + a.id, quando: new Date((a.desde || '2026-09-01') + 'T12:00:00').getTime(), tag: 'nov', selo: t.selo,
               titulo: t.t, html: '<p>' + t.p1 + '</p>' + (t.p2 ? '<p>' + t.p2 + '</p>' : '') +
                 (lista.length ? '<ol>' + lista.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ol>' : '') +
                 (a.senha ? '<div class="bd-senha"><span>' + t.rot + '</span><b>' + a.senha + '</b></div>' : '') +
                 (t.cuidado ? '<div class="bd-cuidado">' + t.cuidado + '</div>' : '') + (t.p3 ? '<p>' + t.p3 + '</p>' : ''),
               link: a.link ? { href: a.link.href, rot: t.btnLink } : null, anexos: [],
               ciente: visto || !!cientes['fixo:' + a.id] };
    }
    function noticias(cientes, cb){
      var N = window._hubNoticias, s = sess() || {}, hoje = hojeIso(), out = [], espera = 0, fim = false;
      if (!N || !N.lista) return cb([]);
      function pronto(){ if (fim && !espera) cb(out); }
      N.lista.forEach(function(a){
        if (!a || !a.id || !a.ate || hoje > a.ate || (a.desde && hoje < a.desde)) return;
        if (a.publico === 'met') {
          espera++;
          try { N.publicoMet(s, function(ok){ if (ok) out.push(daNoticia(a, cientes)); espera--; pronto(); }); }
          catch(e) { espera--; }
          return;
        }
        out.push(daNoticia(a, cientes));
      });
      fim = true; pronto();
    }
    function doInforme(i){
      return { id: i.id, quando: i.quando, tag: i.origem === 'direcao' ? 'dir' : 'sec', titulo: esc(i.titulo), html: i.texto ? '<p>' + texto(i.texto) + '</p>' : '',
               anexos: i.anexos || [], link: null, ciente: !!i.ciente, autor: i.autor };
    }

    /* ── a bolha de um recado ── */
    var ROT = { dir: 'tDir', sec: 'tSec', nov: 'tNov', aniv: 'tAniv' };
    function bolha(m){
      var d = document.createElement('div');
      d.className = 'bd-msg bd-rec' + (m.ciente ? ' lido' : '');
      d.setAttribute('data-id', m.id);
      var anexos = (m.anexos || []).map(function(a){
        return a.imagem
          ? '<a class="bd-img" href="' + esc(a.url) + '" target="_blank" rel="noopener"><img alt="' + esc(a.nome) + '" loading="lazy" src="' + esc(a.mini) + '"></a>'
          : '<a class="bd-arq" href="' + esc(a.url) + '" target="_blank" rel="noopener">📎 ' + esc(a.nome) + '</a>';
      }).join('');
      d.innerHTML =
        '<div class="bd-topo"><span class="bd-tag t-' + m.tag + '">' + esc(m.tag === 'nov' && m.selo ? m.selo : tx(ROT[m.tag])) + '</span><small>' + ddmm(m.quando) + '</small></div>' +
        (m.titulo ? '<b class="bd-t">' + m.titulo + '</b>' : '') +
        '<div class="bd-tx">' + m.html + '</div>' + anexos +
        (m.link ? '<a class="bd-ir" href="' + esc(m.link.href) + '">' + m.link.rot + '</a>' : '') +
        '<label class="bd-ck"><input type="checkbox"' + (m.ciente ? ' checked' : '') + (como() ? ' disabled' : '') + '> ' + esc(tx('ciente')) + '</label>';
      d.querySelector('input').addEventListener('change', function(ev){
        var marcou = ev.target.checked;
        m.ciente = marcou; d.classList.toggle('lido', marcou); conta();
        if (m.local) { try { if (marcou) localStorage.setItem(m.local, '1'); else localStorage.removeItem(m.local); } catch (e) {} return; }
        if (m.aviso) post({ action: 'avisosLido', ids: [m.avId], desfaz: marcou ? 0 : 1 }).catch(function(){});
        else post({ action: 'informeCiente', id: m.id, desfaz: marcou ? 0 : 1 }).catch(function(){});
      });
      return d;
    }
    function fala(t){ var d = document.createElement('div'); d.className = 'bd-msg'; d.innerHTML = t; return d; }
    function digitando(t){
      if (CALMO) return 0;
      var n = String(t || '').replace(/<[^>]*>/g, '').length, sorte = 0.75 + Math.random() * 0.6;
      return Math.max(900, Math.min(2600, Math.round((800 + n * 14) * sorte)));
    }

    var msgs = [], tut = [], vez = 0, assinatura = '', leitura = 0, naoLidos = 0;
    /* O NÚMERO AO LADO DO NOME (Pedro, 06/10/2026): quem tirou o Buddy da tela não tinha mais sinal nenhum de
       recado novo. O número fica no botão do nome do professor, lá em cima, e no item "Falar com o Buddy". */
    function noNome(){
      var bt = document.querySelector('.fisk-user-btn'); if (!bt) return;
      var b = bt.querySelector('.fu-n');
      if (!b) { b = document.createElement('span'); b.className = 'fu-n'; bt.insertBefore(b, bt.querySelector('.fu-seta')); }
      b.hidden = !naoLidos; b.textContent = naoLidos > 9 ? '9+' : String(naoLidos);
      var it = document.querySelector('.fu-buddy .fu-n2'); if (it) { it.hidden = !naoLidos; it.textContent = b.textContent; }
    }
    var abriuSozinho = false;
    function conta(){
      /* o número do Buddy conta só o que pede ciência; a tutoria é informação, não pendência */
      var n = msgs.filter(function(m){ return !m.ciente; }).length;
      sinoN.hidden = !n; sinoN.textContent = n > 9 ? '9+' : String(n);
      $$('bdN').hidden = !n; $$('bdN').textContent = sinoN.textContent;
      naoLidos = n; noNome();
      /* HÁ NOVIDADE SEM LER: O MURAL ABRE SOZINHO (Pedro, 06/10/2026). O Carlos abriu o Hub com o mural minimizado
         e não viu que ele existia. Uma vez por carregamento; quem tirou o mural da tela (✕) continua sem ele, e
         quem não tem nada por ler fica como deixou. */
      if (n && !abriuSozinho && LARGO.matches && document.body.classList.contains('bd-recolhido') && !document.body.classList.contains('bd-fora')) { abriuSozinho = true; abre(true); }
      ttN.hidden = !tut.length; ttN.textContent = String(tut.length);
    }
    /* O MURAL (Pedro, 06/10/2026). A coluna deixou de ser o Buddy: é o radar de novidades da escola, uma circular.
       Sem saudação e sem pontinhos; o que ainda não foi lido fica em cima, do mais novo para o mais antigo, e o
       que já foi lido se recolhe embaixo. O urso ficou só para o auxiliar de IA (buddy.html). */
    function conversa(){
      ++vez; chat.innerHTML = '';
      var lidos = msgs.filter(function(m){ return m.ciente; }).reverse(), novos = msgs.filter(function(m){ return !m.ciente; }).reverse();
      if (!novos.length) { var v = document.createElement('p'); v.className = 'av-vazio'; v.textContent = tx('nada'); chat.appendChild(v); }
      novos.forEach(function(m){ chat.appendChild(bolha(m)); });
      if (lidos.length) {
        var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'bd-antigos';
        var cxA = document.createElement('div'); cxA.className = 'bd-hist'; cxA.hidden = true;
        var rot = function(){ bt.textContent = cxA.hidden ? (lidos.length === 1 ? tx('antigo1') : tx('antigos', { q: lidos.length })) + ' ▾' : tx('esconder') + ' ▴'; };
        lidos.forEach(function(m){ cxA.appendChild(bolha(m)); });
        bt.addEventListener('click', function(){ cxA.hidden = !cxA.hidden; rot(); });
        rot(); chat.appendChild(bt); chat.appendChild(cxA);
      }
      chat.scrollTop = 0;
    }
    /* OS ANIVERSARIANTES (Pedro, 23/10/2026): o cartão da home e um recado no mural, uma vez por semana. O recado é
       só informação, mas pede o "ciente" como os outros, para o professor não deixar passar; o ciente fica no
       aparelho (não há o que registrar no servidor). */
    var DOW = { pt: ['dom','seg','ter','qua','qui','sex','sáb'], en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], es: ['dom','lun','mar','mié','jue','vie','sáb'] };
    function dataAniv(a){
      var h = new Date(), ano = h.getFullYear(), d = new Date(ano, a.mes - 1, a.dia);
      if (h.getMonth() === 11 && a.mes === 1) d = new Date(ano + 1, a.mes - 1, a.dia);
      if (h.getMonth() === 0 && a.mes === 12) d = new Date(ano - 1, a.mes - 1, a.dia);
      return d;
    }
    function diaAniv(a){
      var d = dataAniv(a);
      return (DOW[lang()] || DOW.pt)[d.getDay()] + ' ' + ('0' + a.dia).slice(-2) + '/' + ('0' + a.mes).slice(-2);
    }
    function anivPassou(a){ var h = new Date(); h.setHours(0, 0, 0, 0); return !a.hoje && !a.proxima && dataAniv(a) < h; }
    function segundaISO(){ var h = new Date(); h.setDate(h.getDate() - ((h.getDay() + 6) % 7)); return h.getFullYear() + '-' + ('0' + (h.getMonth() + 1)).slice(-2) + '-' + ('0' + h.getDate()).slice(-2); }
    /* a semana que vem vem junto, embaixo (Pedro, 24/10/2026: "para o professor se planejar"); o número e o recado
       do mural contam só esta semana */
    function anivDesta(){ return aniv.filter(function(a){ return !a.proxima; }); }
    function aniversarios(){
      if (!anCard) return;
      $$('anTit').innerHTML = esc(tx('anTit')) + '<small>' + esc(tx('anSub')) + '</small>';
      var esta = anivDesta(), prox = aniv.filter(function(a){ return a.proxima; });
      var item = function(a){
        return '<div class="tt-it an-it' + (a.hoje ? ' hoje' : '') + (a.proxima ? ' prox' : '') + (anivPassou(a) ? ' passou' : '') + '"><i class="an-bolo" aria-hidden="true">🎂</i><span><b>' + esc(a.nome) +
          (a.hoje ? ' <em>' + esc(tx('anHoje')) + '</em>' : '') + '</b><small>' + esc(diaAniv(a)) + ' · ' + esc(a.turma) + '</small></span></div>';
      };
      anCard.hidden = false; anN.hidden = !esta.length; anN.textContent = String(esta.length);
      anLista.innerHTML = (esta.length ? esta.map(item).join('') : '<p class="av-vazio">' + esc(tx('anVazio')) + '</p>') +
        '<p class="an-prox">' + esc(tx('anProx')) + '</p>' + (prox.length ? prox.map(item).join('') : '<p class="av-vazio">' + esc(tx('anProxVazio')) + '</p>');
    }
    function recadoAniv(){
      var aniv = anivDesta();
      if (!aniv.length) return [];
      var chave = 'fisk_aniv_ciente:' + segundaISO() + ':' + (eu() || '');
      var lido = false; try { lido = localStorage.getItem(chave) === '1'; } catch (e) {}
      var h = new Date(); h.setDate(h.getDate() - ((h.getDay() + 6) % 7)); h.setHours(8, 0, 0, 0);
      return [{ id: 'aniv|' + segundaISO(), local: chave, quando: h.getTime(), tag: 'aniv', titulo: esc(tx('anRec')),
        html: '<ul class="an-rec">' + aniv.map(function(a){ return '<li><b>' + esc(a.nome) + '</b> · ' + esc(diaAniv(a)) + (a.hoje ? ' 🎉 ' + esc(tx('anHoje')) : '') + '<br><small>' + esc(a.turma) + '</small></li>'; }).join('') + '</ul>',
        anexos: [], link: null, ciente: lido }];
    }
    function tutoria(){
      $$('ttTit').innerHTML = esc(tx('ttTit')) + '<small>' + esc(tx('ttSub')) + '</small>';
      $$('ttLink').textContent = tx('ttLink');
      ttCard.hidden = false;
      if (!tut.length) { ttLista.innerHTML = '<p class="av-vazio">' + esc(tx('ttVazio')) + '</p>'; return; }
      ttLista.innerHTML = '';
      /* SEM CAIXINHA (Pedro, 06/10/2026): é só para o professor saber quem veio. Um quadrado para clicar dava a
         entender que havia algo a fazer com a informação. O ✓ é desenho, não botão. */
      tut.forEach(function(a){
        var l = document.createElement('div'); l.className = 'tt-it';
        var nome = String(a.titulo || '').replace(/ foi à tutoria$/, '');
        l.innerHTML = '<i class="tt-ok" aria-hidden="true">✓</i><span><b>' + esc(nome) + '</b><small>' + esc(a.texto) + '</small></span>';
        ttLista.appendChild(l);
      });
    }

    function carrega(forcar){
      var s = sess(); if (!s || !s.token) return Promise.resolve(false);
      $$('bdSub').textContent = tx('sub'); $$('bdNome').textContent = '📣 ' + tx('nome');
      var pedido = ++leitura;   /* duas leituras no ar: só a mais nova desenha */
      /* A VOLTA À HOME SEM CORTINA (Pedro, 26/10/2026: "parece que ele tem que carregar tudo toda vez"). A última resposta
         do mural fica guardada no aparelho (localStorage com dono e validade de um dia, fiskCacheGuarda; até 31/10/2026 era
         sessionStorage, que a aba nova de cada ferramenta não herda): na volta de uma ferramenta o mural se desenha na hora
         com ela e a leitura nova corre por trás, redesenhando só se algo mudou (a assinatura agora inclui o "ciente"). */
      var chaveMural = 'hub:mural:' + eu();
      var guardado = fiskCacheLe(chaveMural, FISK_CACHE_DIA);
      if (guardado) desenhaMural(guardado, pedido);
      /* um pedido só (profHome) quando é o professor na própria conta; a direção "vendo como" continua pelas três rotas,
         que aceitam `como`. Se o profHome não vier (rota desconhecida, rede), caem as três chamadas antigas. */
      return profHome(forcar).then(function(r){
        if (r) return [r.informes || null, r.avisos || null, r.aniversariantes || null];
        var inf = post({ action: 'informesLer', como: como() }).catch(function(){ return null; });
        var avs = post({ action: 'avisosLer', como: como() }).catch(function(){ return null; });
        var ans = post({ action: 'aniversariantesProf', como: como() }).catch(function(){ return null; });
        return Promise.all([inf, avs, ans]);
      }).then(function(r){
        if (r[0] && r[0].ok === true) fiskCacheGuarda(chaveMural, r);
        desenhaMural(r, pedido);
        return !!(r[0] && r[0].ok === true);
      });
    }
    /* o profHome da abertura (window.__fiskProfHome, pedido antes da primeira pintura) serve uma vez; depois, um novo */
    function profHome(forcar){
      var s = sess(); if (!s || !s.token || s.master || s.viewingAs || typeof window.fiskProfHomePede !== 'function') return Promise.resolve(null);
      var p = window.__fiskProfHome;
      if (!forcar && p && p.quando && Date.now() - p.quando < 60000) return p;
      p = window.__fiskProfHome = window.fiskProfHomePede(s.token, post);
      return p;
    }
    function temMuralGuardado(){ return !!fiskCacheLe('hub:mural:' + eu(), FISK_CACHE_DIA); }
    function desenhaMural(r, pedido){
        if (r[2] && r[2].ok) aniv = r[2].aniversariantes || [];
        if (pedido !== leitura) return;
        var ji = r[0], ja = r[1], cientes = {};
        ((ji && ji.cientes) || []).forEach(function(id){ cientes[id] = true; });
        var corte = Date.now() - 14 * 86400000;
        if (ja && ja.ok) tut = (ja.avisos || []).filter(function(a){ return a.tipo === 'tutoria' && a.quando >= corte; });
        /* O RETORNO DA SECRETARIA (22/10/2026): "foi impresso", "foi enviado à família", "não será impresso". O servidor
           gravava esses avisos desde 20/10 e o mural não os mostrava (só a tutoria). Entram como recado, com o "Ciente"
           marcando o aviso como lido e o link para os pedidos. */
        var pedidos = (ja && ja.ok ? ja.avisos || [] : []).filter(function(a){ return (a.tipo === 'impressao' || a.tipo === 'transferencia' || a.tipo === 'matricula' || a.tipo === 'experimental') && a.quando >= corte; }).map(function(a){
          /* transferência de aluno entre turmas, aluno novo matriculado pelo portal e aula experimental na turma (Portal da Secretaria, 23/10/2026): recado sem link */
          return { id: 'av|' + a.id, avId: a.id, aviso: true, quando: a.quando, tag: 'sec', titulo: esc(a.titulo),
                   html: a.texto ? '<p>' + texto(a.texto) + '</p>' : '', anexos: [], link: a.tipo === 'impressao' ? { href: 'imprimir.html#meus', rot: '📬 Ver meus pedidos' } : null, ciente: !!a.lido };
        });
        tutoria(); aniversarios();
        try { document.dispatchEvent(new Event('hub-mural-pronto')); } catch (e) {}
        /* os informes não vieram (rede, sessão) e a conversa já está na tela: fica como estava */
        if ((!ji || ji.ok !== true) && assinatura) { conta(); return; }
        noticias(cientes, function(fixas){
          if (pedido !== leitura) return;
          var todas = fixas.concat(((ji && ji.informes) || []).map(doInforme), pedidos, recadoAniv());
          todas.sort(function(a, b){ return a.quando - b.quando; });
          /* só refaz a conversa quando chegou ou saiu recado: reler a cada 3 minutos não pode redigitar tudo */
          var ass = lang() + '|' + eu() + '|' + todas.map(function(m){ return m.id + (m.ciente ? '+' : ''); }).join(',');
          if (ass === assinatura) { conta(); return; }
          assinatura = ass; msgs = todas; conta(); conversa();
        });
    }

    /* MINIMIZAR VIRA A BOLINHA (Pedro, 06/10/2026, terceira volta). O "—" guarda a janela e o Buddy passa a ser a
       bolinha do canto de baixo, à direita, com o número de recados sem ler; clicar nela reabre. No computador o
       LUGAR da coluna continua reservado enquanto ele está minimizado, para as ferramentas não mudarem de lugar
       (a primeira versão tirava a coluna e os cards corriam; a segunda deixava um retângulo, que ele não quis).
       A escolha fica no aparelho. No celular a coluna nasce fora da tela e a bolinha abre o painel. */
    var LARGO = window.matchMedia ? window.matchMedia('(min-width: 1181px)') : { matches: true };
    try { if (localStorage.getItem('fisk_buddy_recolhido') === '1') document.body.classList.add('bd-recolhido'); } catch(e) {}
    function botao(){ $$('avFecha').textContent = '—'; }
    function abre(sim){
      if (LARGO.matches) {
        document.body.classList.toggle('bd-recolhido', !sim);
        try { localStorage.setItem('fisk_buddy_recolhido', sim ? '0' : '1'); } catch(e) {}
        return;
      }
      document.body.classList.toggle('av-aberto', !!sim); fundo.hidden = !sim;
    }
    sino.addEventListener('click', function(){ abre(LARGO.matches ? true : !document.body.classList.contains('av-aberto')); });
    $$('avFecha').addEventListener('click', function(ev){ ev.stopPropagation(); abre(false); });
    botao();
    /* O BUDDY SAI DA TELA (Pedro, 06/10/2026): há professor que se distrai com ele ali. O ✕ tira a coluna e o
       Buddy do canto de vez, e a escolha fica no aparelho; quem quiser de volta chama pelo menu do próprio nome,
       em "Falar com o Buddy". Os recados continuam chegando e esperando: tirar da tela não é dar ciência. */
    try { if (localStorage.getItem('fisk_buddy_fora') === '1') document.body.classList.add('bd-fora'); } catch(e) {}
    function some(sim){
      document.body.classList.toggle('bd-fora', !!sim);
      try { localStorage.setItem('fisk_buddy_fora', sim ? '1' : '0'); } catch(e) {}
      if (sim) { document.body.classList.remove('av-aberto'); fundo.hidden = true; }
    }
    function recado(t){
      var d = document.createElement('div'); d.className = 'bd-toast'; d.textContent = t; document.body.appendChild(d);
      setTimeout(function(){ d.remove(); }, 6500);
    }
    $$('avSome').addEventListener('click', function(ev){ ev.stopPropagation(); some(true); recado(tx('saiu')); });
    function chama(){ some(false); abre(true); }
    /* o item do menu do professor: o menu nasce no login, então espera por ele */
    function noMenu(){
      var menu = document.querySelector('.fisk-user-menu'); if (!menu) return false;
      var it = menu.querySelector('.fu-buddy');
      if (!it) {
        it = document.createElement('button'); it.type = 'button'; it.className = 'fu-item fu-buddy';
        var ref = menu.querySelector('.fu-csl');
        if (ref) menu.insertBefore(it, ref); else menu.appendChild(it);
        it.addEventListener('click', function(){ chama(); document.body.click(); });
      }
      it.innerHTML = '📣 ' + esc(tx('falar')) + '<span class="fu-n fu-n2" hidden></span>';
      noNome();
      return true;
    }
    fundo.addEventListener('click', function(){ abre(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !LARGO.matches) abre(false); });

    function liga(){
      var s = sess(); if (!s || !s.token) { cx.hidden = true; sino.hidden = true; return; }
      cx.hidden = false; sino.hidden = false;
      /* entra de uma vez (Pedro, 23/10/2026): a home espera o mural (recados, quem veio à tutoria, aniversariantes)
         antes de aparecer, em vez de ir montando os cards na frente do professor. Teto de 12 s. */
      var ov = $$('hubEntrando');
      if (ov && temMuralGuardado()) eqCampanha();   /* volta de uma ferramenta: o mural guardado aparece na hora, sem cortina */
      else if (ov) {
        ov.hidden = false;
        var some = function(){ if (ov.hidden) return; ov.hidden = true; document.removeEventListener('hub-mural-pronto', some); eqCampanha(); };
        document.addEventListener('hub-mural-pronto', some);
        setTimeout(some, 12000);
      }
      carrega();
      var n = 0, t = setInterval(function(){ if (noMenu() || ++n > 20) clearInterval(t); }, 300);
      /* O BUDDY AUXILIAR, em piloto (06/10/2026): só quem está no piloto ganha o atalho no menu do nome. A resposta vem
         do profHome ou do cache de 30 min da bolinha; só sem os dois é que pergunta ao servidor. */
      var bg = fiskCacheLe(FISK_BUDDY_INFO_CHAVE, FISK_CACHE_30MIN);
      (bg && bg.info ? Promise.resolve(bg.info) : profHome().then(function(r){ return (r && r.buddy) ? r.buddy : post({ action: 'buddyInfo' }); })).then(function(j){
        if (!j || !j.piloto) return;
        var k = 0, t2 = setInterval(function(){
          var menu = document.querySelector('.fisk-user-menu');
          if (!menu) { if (++k > 20) clearInterval(t2); return; }
          clearInterval(t2);
          if (menu.querySelector('.fu-buddy-ia')) return;
          var a = document.createElement('a'); a.className = 'fu-item fu-buddy-ia'; a.href = 'buddy.html';
          a.innerHTML = '<img alt="" src="https://portalfisk.com.br/assets/icons/buddy.png" style="width:20px;height:20px;border-radius:50%;vertical-align:-4px;margin-right:.35rem;object-fit:cover">Perguntar ao Buddy';
          var ref = menu.querySelector('.fu-csl'); if (ref) menu.insertBefore(a, ref); else menu.appendChild(a);
        }, 300);
      }).catch(function(){});
    }
    /* OS DADOS DA EQUIPE (Pedro, 24/10/2026): a cortina mora no portal (assets/equipe-cortina.js), a mesma da secretaria.
       É campanha: volta em toda entrada até o professor preencher. A direção vendo como alguém não é pesquisada. */
    function eqOpt(){ var s = sess() || {}; return { post: post, ler: 'equipeDadosLer', salvar: 'equipeDadosSalvar', conta: s.name || '' }; }   /* sem `festa`: a cortina solta o confete dela */
    function eqCampanha(){ var s = sess(); if (!s || !s.token || s.master || !window.FiskEquipe) return; FiskEquipe.inicia(eqOpt()); }
    (function eqMenu(){
      var k = 0, t = setInterval(function(){
        var menu = document.querySelector('.fisk-user-menu');
        if (!menu) { if (++k > 40) clearInterval(t); return; }
        clearInterval(t);
        if (menu.querySelector('.fu-eq')) return;
        var it = document.createElement('button'); it.type = 'button'; it.className = 'fu-item fu-eq'; it.textContent = '🪪 Meus dados';
        it.addEventListener('click', function(){ document.body.click(); if (window.FiskEquipe) FiskEquipe.abre(eqOpt()); });
        var ref = menu.querySelector('.fu-csl'); if (ref) menu.insertBefore(it, ref); else menu.appendChild(it);
      }, 300);
    })();
    window._avisosLiga = liga;
    if (document.body.classList.contains('prof-in')) liga();
    fiskPollVisivel(function(){ if (document.body.classList.contains('prof-in')) return carrega(true); }, 180000);
    var sel = $$('profActAs');
    if (sel) sel.addEventListener('change', function(){ setTimeout(carrega, 50); });
  })();

/* ═══ bloco 4 ═══ */
  /* ══ O PAINEL "A SUA CASA" ═══════════════════════════════════════════════
     O que o professor vê da campanha na home: a casa dele, quantos colegas
     estão nela (sem nome nenhum) e o que as turmas dele renderam.

     ⚠️ A PONTUAÇÃO DELE É POR ALUNO, e o texto diz isso em voz alta: o que
     conta para a casa é a MÉDIA por aluno elegível, não o total. Sem essa
     frase, o professor de turma grande acha que está perdendo e o de turma
     pequena acha que não adianta tentar — que é exatamente o contrário do
     desenho (ver `casasProfPontos_` no Casas.js).

     ⚠️ O FATOR DA MANA VEM DO `FiskMana`, carregado do Portal. Se ele não
     estiver lá, o painel mostra os Fisk Dólares em vez de inventar um 2,25
     local — uma segunda fonte do valor de um Fisk Dólar é como as duas
     acabam discordando. */
  /* O PAINEL DA CASA no topo da home (colegas, taça, placar) estava DESLIGADO desde 19/09/2026 e saiu do código em
     31/10/2026 (auditoria de 30/10, B8); o git guarda (commit 7a9ef94). A casa continua vestindo a faixa (kit) e no menu. */

/* ═══ bloco 5 ═══ */
  /* A CERIMÔNIA DE SELEÇÃO SAI SOZINHA DA HOME quando a campanha vence.
     A data é a mesma do `CAMPANHA_ATE` no assets/hogwarts.js do Portal, e as
     duas precisam contar a mesma história: card aqui depois de a campanha
     acabar seria convite para uma festa que já terminou.
     A PÁGINA continua de pé, e é de propósito: quem já tem casa volta a ela
     pelo endereço direto, e a casa de ninguém é apagada. */
  (function(){
    var ATE = '2026-10-10';
    var hoje = new Date().toISOString().slice(0,10);
    if (hoje > ATE) {
      var c = document.getElementById('card-hogwarts');
      if (c && c.parentNode) c.parentNode.removeChild(c);
      var pn = document.getElementById('hwProf');
      if (pn && pn.parentNode) pn.parentNode.removeChild(pn);
    }
  })();

/* ═══ bloco 6 ═══ */
/* conta os cliques nos cards neste aparelho e mostra os três mais usados no topo */
(function () {
  var K = 'hub:uso:v1', BOX = document.getElementById('maisUsadas');
  function le() { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } }
  function grava(u) { try { localStorage.setItem(K, JSON.stringify(u)); } catch (e) {} }
  document.addEventListener('click', function (ev) {
    var c = ev.target.closest && ev.target.closest('main.grid a.card');
    if (!c) return;
    var h = c.getAttribute('href'), t = (c.querySelector('h2') || {}).textContent;
    if (!h || !t) return;
    var u = le(); u[h] = { n: ((u[h] || {}).n || 0) + 1, t: t.trim(), q: Date.now() }; grava(u);
  });
  /* SEMPRE TRÊS (Pedro, 06/10/2026). Entram as mais clicadas neste aparelho; enquanto o professor não tiver três,
     a faixa completa com as de sala de aula, nesta ordem. O nome do atalho é o do card de AGORA (o guardado
     envelhece quando o card muda de nome), e card escondido para este professor não entra. */
  var PADRAO = ['a.card-turmahoje', 'a.card-conversation', '#card-portal', 'a.card-termo', 'a.card-boletim'];
  function pinta() {
    if (!BOX) return;
    var u = le(), vistos = {}, lista = [];
    function entra(card) {
      if (!card || card.offsetParent === null || lista.length >= 3) return;
      var h = card.getAttribute('href'), t = ((card.querySelector('h2') || {}).textContent || '').trim();
      if (!h || !t || vistos[h]) return;
      vistos[h] = true; lista.push({ h: h, t: t });
    }
    Object.keys(u).map(function (h) { return { h: h, n: u[h].n || 0, q: u[h].q || 0 }; })
      .filter(function (x) { return x.n >= 1; })
      .sort(function (a, b) { return b.n - a.n || b.q - a.q; })
      .forEach(function (x) { entra(document.querySelector('main.grid a.card[href="' + x.h.replace(/"/g, '\\"') + '"]')); });
    PADRAO.forEach(function (sel) { entra(document.querySelector('main.grid ' + sel)); });
    if (!lista.length) { BOX.hidden = true; return; }
    BOX.hidden = false;
    var l = typeof fiskIdioma === 'function' ? fiskIdioma() : 'pt';
    var rot = { pt: 'Ferramentas mais usadas por você', en: 'Your most used tools', es: 'Tus herramientas más usadas' }[l] || 'Your most used tools';
    BOX.innerHTML = '<span class="mu-rot">' + rot + '</span>' + lista.map(function (x) {
      return '<a class="mu-chip" href="' + x.h.replace(/"/g, '&quot;') + '">' + x.t.replace(/[<>&]/g, '') + '</a>';
    }).join('');
  }
  window.pintaMaisUsadas = pinta;
  setTimeout(pinta, 400);   /* depois de a sessão decidir quais cards aparecem */
})();

/* ═══ bloco 7 ═══ */
/* MINHA SEMANA NA HOME (26/10/2026): abre e fecha; o calendário (calendario.html?embed=1) só carrega quando a seção
   abre, e a escolha fica no aparelho. Nasce aberta na primeira vez. */
(function () {
  var sec = document.getElementById('semHome'), bt = document.getElementById('semHomeBtn'), corpo = document.getElementById('semHomeCorpo');
  if (!sec) return;
  var s = null; try { s = JSON.parse(localStorage.getItem('fisk_prof') || 'null'); } catch (e) {}
  if (!s || !s.token) return;
  sec.hidden = false;
  /* A CHAVE TEM DONO (auditoria de 30/10/2026, M7): `hub_semana_aberta` era de todo mundo que entrasse no aparelho,
     então o professor que fechou a seção ontem a via aberta de novo se outro tivesse entrado. Fica por conta
     (hub:semana:<conta>), e o prefixo hub: some no "Sair". */
  var CH_SEMANA = 'hub:semana:' + String(s.name || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  /* abrir e fechar DESLIZANDO (Pedro, 27/10/2026): a altura vai de 0 à do conteúdo (e volta), com um esmaecer. O
     calendário tem altura fixa, então a altura final já é conhecida antes de ele carregar. Na abertura da página
     não anima. Ao fechar, os cantos do botão só se arredondam quando a seção terminou de subir. */
  var _anima = null;
  function abre(sim, animar) {
    try { localStorage.setItem(CH_SEMANA, sim ? '1' : '0'); localStorage.removeItem('hub_semana_aberta'); } catch (e) {}
    if (sim && !corpo.querySelector('iframe')) {
      var f = document.createElement('iframe');
      f.src = 'calendario.html?embed=1'; f.title = 'Minha semana'; f.loading = jaViu ? 'lazy' : 'eager';   /* no dia do tour ele tem de carregar já */
      corpo.insertBefore(f, corpo.firstChild);
    }
    clearTimeout(_anima); corpo.classList.remove('anima'); corpo.style.height = ''; corpo.style.opacity = '';
    if (!animar) { bt.setAttribute('aria-expanded', sim ? 'true' : 'false'); corpo.hidden = !sim; return; }
    if (sim) {
      bt.setAttribute('aria-expanded', 'true'); corpo.hidden = false;
      var h = corpo.scrollHeight;
      corpo.style.height = '0px'; corpo.style.opacity = '0'; void corpo.offsetHeight;
      corpo.classList.add('anima'); corpo.style.height = h + 'px'; corpo.style.opacity = '1';
      _anima = setTimeout(function () { corpo.classList.remove('anima'); corpo.style.height = ''; corpo.style.opacity = ''; }, 400);
    } else {
      corpo.style.height = corpo.offsetHeight + 'px'; void corpo.offsetHeight;
      corpo.classList.add('anima'); corpo.style.height = '0px'; corpo.style.opacity = '0';
      _anima = setTimeout(function () { corpo.hidden = true; corpo.classList.remove('anima'); corpo.style.height = ''; corpo.style.opacity = ''; bt.setAttribute('aria-expanded', 'false'); }, 400);
    }
  }
  bt.addEventListener('click', function () { abre(corpo.hidden || corpo.style.height === '0px' ? true : false, true); });
  var guardado = null; try { guardado = localStorage.getItem(CH_SEMANA); if (guardado === null) guardado = localStorage.getItem('hub_semana_aberta'); } catch (e) {}   /* a chave antiga vale até a primeira gravação */
  /* O TOUR DA MINHA SEMANA (26/10/2026, Pedro: "na próxima vez que o professor entra, já carregue mostrando o Minha
     Semana aberto, com aquele tour do portal do aluno"). Uma vez por aparelho (chave fisk_tour_hub_semana_v1): nessa
     vez a seção abre mesmo que tenha sido fechada. O motor é o tour.js do PORTAL, lido de lá (dado e código de outro
     repositório se leem, não se copiam). O tour espera a tela livre (a cortina de carregamento e a do My Avatar) e o
     calendário carregado; os passos apontam para dentro do calendário por "sombras" posicionadas sobre ele, porque o
     motor só enxerga a página de fora. */
  var TOUR_KEY = 'hub_semana_v1', jaViu = false;
  try { jaViu = localStorage.getItem('fisk_tour_' + TOUR_KEY) === '1'; } catch (e) {}
  abre(!jaViu || guardado !== '0');
  if (jaViu) return;
  /* o ?v= é o md5 (10 primeiros caracteres) do assets/tour.js do portal-aluno-fisk, o mesmo que o index.html do portal
     carrega; conferido em 31/10/2026 (md5 -q assets/tour.js). Mudou lá, muda aqui. */
  var TOUR_JS = 'https://portalfisk.com.br/assets/tour.js?v=e563524203';
  var T = {
    pt: [['📅 Novidade: Minha semana', 'A sua semana agora fica aqui na página inicial: <b>aulas, plantões, aniversários e feriados</b>. Toque aqui para abrir ou fechar quando quiser.'],
         ['👆 Toque na turma', 'Cada aula aparece no dia e no horário do card. Ao tocar, você vê <b>os alunos</b>, quem faz <b>aniversário</b> e o botão para abrir a <b>Minha aula</b> já na turma certa.'],
         ['🧪 Aula experimental', 'Quando a secretaria marcar uma <b>aula experimental</b> numa turma sua, ela aparece aqui, na aula do dia, com o nome e a idade de quem vem.'],
         ['↗ Em tela cheia', 'Quer ver maior? Abra a <b>Minha semana</b> em tela cheia por aqui.']],
    en: [['📅 New: My week', 'Your week now lives here on the home page: <b>classes, tutoring shifts, birthdays and holidays</b>. Tap here to open or close it anytime.'],
         ['👆 Tap a class', 'Each class shows up on the day and time from the card. Tap it to see <b>the students</b>, <b>birthdays</b> and the button that opens <b>My class</b> on the right group.'],
         ['🧪 Trial class', 'When the front desk books a <b>trial class</b> in one of your groups, it shows up here, on that day’s class, with the visitor’s name and age.'],
         ['↗ Full screen', 'Want it bigger? Open <b>My week</b> in full screen here.']],
    es: [['📅 Novedad: Mi semana', 'Tu semana ahora está aquí en la página inicial: <b>clases, tutorías, cumpleaños y feriados</b>. Toca aquí para abrirla o cerrarla cuando quieras.'],
         ['👆 Toca la clase', 'Cada clase aparece en el día y horario del card. Al tocarla ves <b>los alumnos</b>, los <b>cumpleaños</b> y el botón para abrir <b>Mi clase</b> en el grupo correcto.'],
         ['🧪 Clase de prueba', 'Cuando la secretaría agende una <b>clase de prueba</b> en uno de tus grupos, aparece aquí, en la clase del día, con el nombre y la edad de quien viene.'],
         ['↗ Pantalla completa', '¿Lo quieres más grande? Abre <b>Mi semana</b> en pantalla completa aquí.']]
  };
  function lingua() { var l = 'pt'; try { l = (typeof fiskIdioma === 'function' ? fiskIdioma() : localStorage.getItem('fisk_lang')) || 'pt'; } catch (e) {} return T[l] ? l : 'pt'; }
  /* uma "sombra" na página de fora, por cima de um elemento de dentro do calendário */
  function sombra(id, alvo) {
    var f = corpo.querySelector('iframe'), velho = document.getElementById(id); if (velho) velho.remove();
    if (!f || !alvo) return false;
    var r = alvo.getBoundingClientRect(), fr = f.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var d = document.createElement('div'); d.id = id;
    d.style.cssText = 'position:absolute;pointer-events:none;border-radius:10px;left:' + (fr.left + r.left + window.scrollX) + 'px;top:' + (fr.top + r.top + window.scrollY) +
      'px;width:' + r.width + 'px;height:' + r.height + 'px';
    document.body.appendChild(d); return true;
  }
  function telaLivre() {
    var ov = document.getElementById('hubEntrando');
    return (!ov || ov.hidden) && !document.getElementById('av-mask') && !document.querySelector('.ftour-card');
  }
  function calendarioPronto() {
    var f = corpo.querySelector('iframe'), d = null; try { d = f && f.contentDocument; } catch (e) {}
    if (!d || !d.body) return null;
    var st = d.getElementById('st');
    var temAula = d.querySelector('.grade .ev:not(.semaula), .dia-lista .cartao:not(.semaula)');
    return (temAula || (st && !/Lendo|Reading|Leyendo/.test(st.textContent) && d.getElementById('painelCal') && !d.getElementById('painelCal').hidden)) ? d : null;
  }
  function carregaMotor(cb) {
    if (window.FiskTour) return cb();
    var sc = document.createElement('script'); sc.src = TOUR_JS; sc.onload = cb; sc.onerror = function () {}; document.head.appendChild(sc);
  }
  var t0 = Date.now();
  (function espera() {
    var d = calendarioPronto();
    if (!(telaLivre() && (d || Date.now() - t0 > 25000))) { if (Date.now() - t0 < 60000) setTimeout(espera, 600); return; }
    carregaMotor(function () {
      if (!window.FiskTour || !telaLivre()) return;
      var aula = d && d.querySelector('.grade .ev:not(.semaula), .dia-lista .cartao:not(.semaula)');
      var exp = d && d.querySelector('.ev.exp, .cartao.exp');
      if (!exp && d) { var sl = d.querySelector('.grade .selo.exp, .dia-lista .selo.exp'); exp = sl && sl.closest('.ev, .cartao'); }   /* a etiqueta 🧪 fica escondida no bloco baixo: destaca a aula inteira */
      /* a aula escolhida precisa estar à vista DENTRO do calendário, que rola por dentro */
      if (aula) { try { var w = d.defaultView, y = aula.getBoundingClientRect().top + w.scrollY - 140; w.scrollTo(0, Math.max(0, y)); } catch (e) {} }
      corpo.scrollIntoView({ block: 'center' });
      setTimeout(function () {
        var temAula = sombra('semTourAula', aula), temExp = sombra('semTourExp', exp);
        var x = T[lingua()];
        window.FISK_LANG = lingua();
        window.FiskTour.start([
          { el: '#semHomeBtn', title: x[0][0], html: x[0][1] },
          { el: temAula ? '#semTourAula' : '#semHomeCorpo', title: x[1][0], html: x[1][1] },
          { el: temExp ? '#semTourExp' : '#semHomeCorpo', title: x[2][0], html: x[2][1] },
          { el: '#semHomeCorpo .abrir', title: x[3][0], html: x[3][1] }
        ], { key: TOUR_KEY, onDone: function () { ['semTourAula', 'semTourExp'].forEach(function (id) { var e = document.getElementById(id); if (e) e.remove(); }); } });
      }, 700);
    });
  })();
})();

/* ═══ bloco 8 ═══ */
/* SUA PRÓXIMA AULA (26/10/2026): ver o comentário no HTML. Redesenha a cada minuto e quando a Minha semana (que mora
   num iframe desta mesma página) grava as turmas de novo. */
(function () {
  var el = document.getElementById('proxAula'); if (!el) return;
  /* no idioma do Hub (Pedro, 27/10/2026); o nome da ferramenta é o mesmo do card: Minha aula, My Class, Mi clase */
  var TXT = { pt: { prox: 'Sua próxima aula', agora: 'Em aula agora', ate: 'até', as: 'às', em: 'em', alunos: 'alunos', depois: 'depois mais N hoje', abrir: 'Abrir na Minha aula' },
              en: { prox: 'Your next class', agora: 'In class now', ate: 'until', as: 'at', em: 'in', alunos: 'students', depois: 'N more later today', abrir: 'Open in My Class' },
              es: { prox: 'Tu próxima clase', agora: 'En clase ahora', ate: 'hasta las', as: 'a las', em: 'en', alunos: 'alumnos', depois: 'después N más hoy', abrir: 'Abrir en Mi clase' } };
  function idioma() { try { return typeof fiskIdioma === 'function' ? fiskIdioma() : 'pt'; } catch (e) { return 'pt'; } }
  function sess() { try { return JSON.parse(localStorage.getItem('fisk_prof') || 'null'); } catch (e) { return null; } }
  function nP(v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase(); }
  function eu(s) { if (s.master) { try { var a = JSON.parse(localStorage.getItem('fisk_actas') || 'null'); if (a && a.name) return a.name; } catch (e) {} } return s.name || ''; }
  function hm(m) { return Math.floor(m / 60) + 'h' + (m % 60 ? ('0' + (m % 60)).slice(-2) : ''); }
  function curto(t) {
    var p = String(t || '').split('\n')[0].split(/\s+[-–]\s+|\s+[-–]|[-–]\s+/).filter(function (x) {
      return x && !/\d{1,2}\s*[h:]\d{0,2}|\d[ªº°]|^\s*\d+\s*$|\b(seg|ter|qua|qui|sex|s[aá]b|dom)[a-z]*\b/i.test(x.replace(/\([^)]*\)/g, ''));
    });
    return p.join(' - ') || String(t || '').split('\n')[0];
  }
  function semAulaHoje(escolas) {
    var c = []; try { c = JSON.parse(localStorage.getItem('cal:semaula') || '[]'); } catch (e) {}
    var d = new Date(), hoje = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    return c.some(function (x) { return x.i <= hoje && hoje <= x.f && (!x.u || !x.u.length || x.u.some(function (u) { return escolas.indexOf(u) > -1; })); });
  }
  function pinta() {
    var s = sess(); if (!s || !s.token) { el.hidden = true; return; }
    var g = null; try { g = JSON.parse(localStorage.getItem('cal:turmas:' + nP(eu(s))) || 'null'); } catch (e) {}
    var turmas = (g && g.t) || [], escolas = String(s.escolas || '').split(/[,;]/).map(function (x) { return x.trim(); });
    if (!turmas.length || semAulaHoje(escolas)) { el.hidden = true; return; }
    var d = new Date(), wd = d.getDay(), min = d.getHours() * 60 + d.getMinutes();
    var hoje = turmas.filter(function (t) { return t.h && t.h.dias.indexOf(wd) > -1 && t.h.fim > min; }).sort(function (a, b) { return a.h.ini - b.h.ini; });
    var t = hoje[0]; if (!t) { el.hidden = true; return; }
    var agora = t.h.ini <= min, falta = t.h.ini - min, T = TXT[idioma()] || TXT.pt;
    var quando = agora ? T.ate + ' ' + hm(t.h.fim) : T.as + ' ' + hm(t.h.ini) + (falta <= 180 ? ' (' + T.em + ' ' + (falta >= 60 ? Math.floor(falta / 60) + 'h' + (falta % 60 ? ('0' + (falta % 60)).slice(-2) : '') : falta + ' min') + ')' : '');
    el.className = 'prox-aula' + (agora ? ' agora' : '');
    el.href = 'turma-de-hoje.html#t=' + encodeURIComponent(t.escola + '|' + t.prof + '|' + t.linha);
    el.innerHTML = '<span class="ic" aria-hidden="true">' + (agora ? '🟢' : '🕒') + '</span><span class="tx"><small>' + (agora ? T.agora : T.prox) + '</small>' +
      '<b>' + fiskEsc(curto(t.titulo)) + ' ' + quando + '</b><span>' + (t.alunos || []).length + ' ' + T.alunos + (hoje.length > 1 ? ' · ' + T.depois.replace('N', hoje.length - 1) : '') + '</span></span>' +
      '<span class="go"><span>' + T.abrir + '</span> →</span>';
    el.hidden = false;
  }
  window.pintaProxAula = pinta;
  pinta();
  setInterval(pinta, 60000);
  if (window.FiskPreAula) FiskPreAula.comecar();
  window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('cal:') === 0) pinta(); });
})();

/* ═══ bloco 9 ═══ */
/* BOLETINS (27/10/2026): o card abre um menu com os três geradores, sem a página intermediária (boletins.html segue no
   ar para quem guardou o endereço). Ctrl/cmd/meio-clique continuam abrindo a página, como qualquer link. */
(function () {
  var card = document.querySelector('a.card-boletim'); if (!card) return;
  var OPCOES = [['👶', 'Kids e Teens', 'https://pedro-fisk.github.io/boletim-fisk/kids.html'], ['🎓', 'Jovens e Adultos', 'https://pedro-fisk.github.io/boletim-fisk/'],
                ['🇪🇸', 'Espanhol', 'https://pedro-fisk.github.io/boletim-fisk/espanhol.html']];
  function fecha() { var m = card.querySelector('.bol-menu'); if (m) m.remove(); }
  card.addEventListener('click', function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
    if (ev.target.closest('.bol-menu a')) { if (typeof fiskRegistrarUso === 'function') fiskRegistrarUso('Boletins', 'boletins'); setTimeout(fecha, 50); return; }
    ev.preventDefault();
    if (card.querySelector('.bol-menu')) { fecha(); return; }
    var m = document.createElement('div'); m.className = 'bol-menu'; m.setAttribute('role', 'menu');
    m.innerHTML = OPCOES.map(function (o) { return '<a role="menuitem" href="' + o[2] + '" target="_blank" rel="noopener"><span aria-hidden="true">' + o[0] + '</span>Boletim ' + o[1] + '</a>'; }).join('');
    card.appendChild(m);
  });
  document.addEventListener('click', function (ev) { if (!ev.target.closest('a.card-boletim')) fecha(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') fecha(); });
})();

/* ═══ bloco 10 ═══ */
/* TODA FERRAMENTA EM OUTRA ABA (Pedro, 27/10/2026): os cards, as "mais usadas", a próxima aula, os jogos e o menu dos
   boletins abrem numa aba nova, e o Hub fica na de trás. Quem decide é este bloco, e não cada link: card novo, link que
   o script reescreve (o do Portal leva a identidade) e o que nasce depois (as mais usadas) entram sozinhos. Links para
   dentro da própria home (#) e os botões continuam onde estão. */
(function () {
  var SEL = 'main.grid a.card[href], #maisUsadas a[href], a#proxAula[href], #fwHub a[href], .bol-menu a[href]';
  function marca() {
    [].forEach.call(document.querySelectorAll(SEL), function (a) {
      var h = a.getAttribute('href') || '';
      if (!h || h.charAt(0) === '#' || /^javascript:/i.test(h) || a.target === '_blank') return;
      a.target = '_blank'; if (!/noopener/.test(a.rel || '')) a.rel = ((a.rel || '') + ' noopener').trim();
    });
  }
  marca();
  new MutationObserver(marca).observe(document.body, { childList: true, subtree: true });
})();
