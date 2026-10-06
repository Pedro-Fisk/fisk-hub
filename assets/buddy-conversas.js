/* ══ A ÁRVORE DE CONVERSAS DO BUDDY (Pedro, 06/10/2026) ════════════════════
 * O que o professor pode perguntar sem precisar inventar a pergunta. É DADO, e
 * não código: a tela do Buddy (buddy.html) desenha o que estiver aqui.
 *
 * Cada pergunta tem
 *   rot       o rótulo curto que aparece no botão
 *   texto     o que vai de fato para o Buddy (mais completo que o rótulo, para a
 *             resposta sair no formato certo de primeira e gastar menos passos)
 *   falta     quando a pergunta precisa de um nome que só o professor sabe
 *             ('turma' ou 'aluno'): o texto vai para a caixa, com o cursor no
 *             fim, e o professor completa antes de enviar
 *   depois    os rótulos das perguntas que fazem sentido em seguida; aparecem
 *             como atalhos embaixo da resposta
 *   breve     true = ainda não dá (falta o dado no servidor). Aparece apagada,
 *             com o motivo em `porque`, para o professor saber que está a caminho
 *
 * REGRA: só entra aqui pergunta que as ferramentas do servidor (Buddy.js e Buddy-acoes.js)
 * conseguem responder com dado de verdade. Pergunta bonita sem dado atrás vira
 * resposta inventada, e é isso que o piloto existe para não deixar acontecer.
 * ═══════════════════════════════════════════════════════════════════════════ */
window.BUDDY_ARVORE = [
  { id: 'saude', ic: '🩺', tit: 'Saúde das turmas', sub: 'o retrato geral, para começar',
    perguntas: [
      { rot: 'Como está a saúde pedagógica das minhas turmas?',
        texto: 'Como está a saúde pedagógica das minhas turmas? Olhe atraso de conteúdo e faltas, diga qual turma preocupa mais e por quê, e termine com o que eu faço primeiro.',
        depois: ['Detalhe a turma que mais preocupa', 'Quem está em atraso crítico?', 'Monte minhas prioridades da semana'] },
      { rot: 'Compare as minhas turmas',
        texto: 'Compare as minhas turmas lado a lado: alunos ativos, atraso médio, quantos críticos e falta média de cada uma. Ordene da que mais preocupa para a que está melhor.',
        depois: ['Detalhe a turma que mais preocupa', 'Qual turma está melhor, e o que ela tem de diferente?'] },
      { rot: 'Detalhe a turma que mais preocupa',
        texto: 'Abra a turma que mais preocupa: liste os alunos com atraso e faltas, da situação mais grave para a mais leve, e diga com quem eu falo primeiro.',
        depois: ['Quem dessa turma foi à tutoria?', 'Quem dessa turma usa o portal?', 'Quem precisa de termo de atraso?'] },
      { rot: 'Raio X de uma turma…', falta: 'turma',
        texto: 'Faça um raio X da turma ',
        depois: ['Quem dessa turma foi à tutoria?', 'Quem dessa turma usa o portal?'] },
      { rot: 'Qual turma está melhor, e o que ela tem de diferente?',
        texto: 'Qual das minhas turmas está melhor em atraso e faltas? Compare com a que está pior e aponte o que os números mostram de diferente entre as duas.' },
      { rot: 'Onde eu posso melhorar?',
        texto: 'Olhando minhas turmas, onde eu posso melhorar? Me dê três ações concretas para esta semana, cada uma com a turma e os alunos a que se refere.',
        depois: ['Monte minhas prioridades da semana'] }
    ] },

  { id: 'atraso', ic: '📉', tit: 'Atraso de conteúdo', sub: 'quem está atrás do previsto no card',
    perguntas: [
      { rot: 'Quem está em atraso crítico?',
        texto: 'Quais alunos meus estão com 4 aulas ou mais de atraso? Agrupe por turma e, para cada um, diga quantas aulas, a última lição dada e a prevista.',
        depois: ['Quem precisa de termo de atraso?', 'Quem está atrasado e não foi à tutoria?', 'Quem está atrasado e não usa o portal?'] },
      { rot: 'Quem está começando a atrasar?',
        texto: 'Quais alunos meus estão com 1 a 3 aulas de atraso? São os que ainda dá para recuperar sem termo. Agrupe por turma.',
        depois: ['Quem está atrasado e não foi à tutoria?'] },
      { rot: 'Em que lição cada aluno parou…', falta: 'turma',
        texto: 'Mostre em que lição cada aluno está e qual era a prevista, na turma ' },
      { rot: 'Quem está em dia?',
        texto: 'Quais alunos meus estão em dia com o conteúdo e com menos de 10% de faltas? Quero saber quem elogiar. Agrupe por turma.' },
      { rot: 'Quem precisa de termo de atraso?',
        texto: 'Quem dos meus alunos está em situação de termo de atraso (4 aulas ou mais)? Liste por turma, do mais atrasado para o menos, com as faltas de cada um.',
        depois: ['Gerar o termo de atraso de um aluno…'] },
      { rot: 'Quem está atrasado e também falta muito?',
        texto: 'Cruze atraso e faltas: quais alunos meus têm 3 aulas ou mais de atraso E mais de 20% de faltas? São os de maior risco. Liste com a turma.',
        depois: ['Quem precisa de termo de atraso?', 'Preparar a conversa com a família…'] }
    ] },

  { id: 'faltas', ic: '🚪', tit: 'Faltas', sub: 'frequência às aulas',
    perguntas: [
      { rot: 'Quais alunos estão faltando mais?',
        texto: 'Quais alunos meus estão faltando mais? Liste os dez piores, com a turma, o número de faltas e o percentual.',
        depois: ['Quem está atrasado e também falta muito?', 'Faltas por turma'] },
      { rot: 'Faltas por turma',
        texto: 'Qual a falta média de cada turma minha? Ordene da turma que mais falta para a que menos falta.',
        depois: ['Detalhe a turma que mais preocupa'] },
      { rot: 'Quem passou de 25% de faltas?',
        texto: 'Quais alunos meus já passaram de 25% de faltas? Liste por turma, com o número de faltas.' },
      { rot: 'Quem não faltou nenhuma vez?',
        texto: 'Quais alunos meus não têm nenhuma falta? Agrupe por turma.' }
    ] },

  { id: 'tutoria', ic: '🙋', tit: 'Tutoria', sub: 'o plantão de dúvidas',
    perguntas: [
      { rot: 'Quem foi à tutoria?',
        texto: 'Quais alunos meus foram à tutoria nas últimas duas semanas? Para cada um: o dia, o monitor e o que foi feito.',
        depois: ['Quem está atrasado e não foi à tutoria?'] },
      { rot: 'Quem está atrasado e não foi à tutoria?',
        texto: 'Cruze os dois: quais alunos meus têm aula atrasada e NÃO apareceram na tutoria nas últimas duas semanas? Liste por turma, do mais atrasado para o menos.',
        depois: ['Quem precisa de termo de atraso?'] },
      { rot: 'O que um aluno fez na tutoria…', falta: 'aluno',
        texto: 'O que foi feito na tutoria, nas últimas duas semanas, com o aluno ' }
    ] },

  { id: 'portal', ic: '💻', tit: 'Portal do Aluno', sub: 'quem pratica fora da aula',
    perguntas: [
      { rot: 'Quem não está usando o portal?',
        texto: 'Quais alunos meus nunca entraram no Portal do Aluno ou não fizeram nenhuma atividade? Agrupe por turma.',
        depois: ['Quem está atrasado e não usa o portal?'] },
      { rot: 'Quem mais praticou nesta semana?',
        texto: 'Quais alunos meus mais fizeram atividades no Portal do Aluno nos últimos 7 dias? Liste os dez primeiros, com a turma.' },
      { rot: 'Quem está atrasado e não usa o portal?',
        texto: 'Cruze os dois: quais alunos meus têm aula atrasada e não fizeram nenhuma atividade no Portal do Aluno nos últimos 7 dias?' },
      { rot: 'Uso do portal numa turma…', falta: 'turma',
        texto: 'Como está o uso do Portal do Aluno (entradas e atividades) na turma ' }
    ] },

  { id: 'radar', ic: '🎯', tit: 'Habilidades (radar)', sub: 'o quanto cada um sabe, pelo que fez no portal',
    perguntas: [
      { rot: 'Em que habilidade uma turma está mais fraca…', falta: 'turma',
        texto: 'Abra o radar e diga em qual dos cinco eixos (Listening, Reading, Speaking, Writing, gramática e vocabulário) a turma está mais fraca, com a média de cada eixo e os alunos que puxam para baixo. Turma: ',
        depois: ['Quem caiu nos últimos 30 dias?', 'Quem não estuda em casa?'] },
      { rot: 'Quem caiu nos últimos 30 dias…', falta: 'turma',
        texto: 'Pelo radar, quais alunos caíram 5 pontos ou mais em algum eixo nos últimos 30 dias, e em qual eixo? Turma: ' },
      { rot: 'Quem não estuda em casa…', falta: 'turma',
        texto: 'Pelo radar, quais alunos têm menos de 4 dias de estudo no portal nos últimos 30 dias? Liste com a última atividade de cada um. Turma: ' },
      { rot: 'Quem está sem dado no radar…', falta: 'turma',
        texto: 'Quais alunos não têm nenhum eixo medido no radar (não fizeram atividade suficiente)? Turma: ' },
      { rot: 'O radar de um aluno…', falta: 'aluno',
        texto: 'Mostre o radar (os cinco eixos, com a variação em 30 dias), a constância e os últimos checkings do aluno ' }
    ] },

  { id: 'notas', ic: '📝', tit: 'Notas e simulados', sub: 'avaliações e MET',
    perguntas: [
      { rot: 'Quem ainda está sem nota?',
        texto: 'Quais alunos meus ainda estão sem a nota da 1ª avaliação lançada no card? Agrupe por turma. Se a turma inteira estiver sem nota, diga só isso.' },
      { rot: 'Quais são as notas mais baixas?',
        texto: 'Entre os alunos meus que já têm nota lançada, quais são as dez mais baixas? Diga a turma e a nota.',
        depois: ['Preparar a conversa com a família…'] },
      { rot: 'Como foram os simulados do MET?',
        texto: 'Como foram os simulados do MET dos meus alunos? Para cada aluno: o simulado, Listening, Grammar + Reading, o nível de cada parte e o resultado.',
        depois: ['Quem não passou no simulado?'] },
      { rot: 'Quem não passou no simulado?',
        texto: 'Quais alunos meus tiveram resultado NO PASS no último simulado do MET, e em qual parte (Listening ou Grammar + Reading) ficaram abaixo?' },
      { rot: 'Ditar as notas do boletim de um aluno…', falta: 'aluno',
        texto: 'Prepare o boletim. Vou dizer o aluno e as notas (escuta, escrita, fluência, pronúncia, vocabulário, participação, dedicação, socialização): ' }
    ] },

  { id: 'aluno', ic: '👤', tit: 'Um aluno', sub: 'a ficha de uma pessoa',
    perguntas: [
      { rot: 'Ficha rápida de um aluno…', falta: 'aluno',
        texto: 'Me dê a ficha rápida (turma, livro, atraso, faltas, notas, radar, checkings e tutoria) do aluno ',
        depois: ['Preparar a conversa com a família…', 'Gerar o termo de atraso de um aluno…'] },
      { rot: 'Como ele está comparado à turma…', falta: 'aluno',
        texto: 'Compare com a média da própria turma, em atraso e em faltas, o aluno ' },
      { rot: 'Preparar a conversa com a família…', falta: 'aluno',
        texto: 'Vou conversar com a família. Monte um roteiro curto, só com dados (o que está bem, o que preocupa e um combinado possível), sobre o aluno ' },
      { rot: 'O que já foi registrado no counseling…', falta: 'aluno',
        texto: 'Abra o e-counseling e resuma o que já foi registrado (acompanhamento e termos, com as datas) do aluno ' },
      { rot: 'Como ele estava no semestre passado…', falta: 'aluno',
        texto: 'Olhe o card do semestre passado e compare com este (livro, turma, faltas) para o aluno ' }
    ] },

  { id: 'docs', ic: '📄', tit: 'Documentos', sub: 'o Buddy prepara, você confirma e ele gera',
    perguntas: [
      { rot: 'Gerar o termo de atraso de um aluno…', falta: 'aluno',
        texto: 'Crie o termo de atraso do aluno ' },
      { rot: 'Gerar os termos de uma turma…', falta: 'turma',
        texto: 'Crie o termo de atraso de todos os alunos com 4 aulas ou mais de atraso que ainda não têm termo marcado no card, na turma ' },
      { rot: 'Lista para os termos de uma turma…', falta: 'turma',
        texto: 'Liste quem precisa de termo de atraso (4 aulas ou mais), com as faltas e as aulas atrasadas de cada um, na turma ' },
      { rot: 'Gerar o comunicado de 2nd chance de um aluno…', falta: 'aluno',
        texto: 'Crie o comunicado de 2nd chance do aluno ' },
      { rot: 'Gerar os comunicados de 2nd chance de uma turma…', falta: 'turma',
        texto: 'Crie o comunicado de 2nd chance de todos os alunos com prova escrita ou auditiva abaixo de 6,0 na avaliação mais recente, na turma ' },
      { rot: 'Preparar o boletim de um aluno…', falta: 'aluno',
        texto: 'Prepare o boletim. Vou dizer o aluno e as notas (escuta, escrita, fluência, pronúncia, vocabulário, participação, dedicação, socialização): ' }
    ] },

  { id: 'registrar', ic: '✍️', tit: 'Registrar', sub: 'o Buddy escreve, você confirma',
    perguntas: [
      { rot: 'Anotar na célula da aula que o aluno vai faltar…', falta: 'aluno',
        texto: 'Ponha uma anotação na célula da próxima aula no card avisando que vai faltar (ele me avisou) o aluno ' },
      { rot: 'Pôr uma anotação na célula da próxima aula…', falta: 'aluno',
        texto: 'Ponha uma anotação na célula da próxima aula no card. Aluno e recado: ' },
      { rot: 'Conhecer um aluno novo ou transferido…', falta: 'aluno',
        texto: 'Recebi este aluno na turma. Resuma quem é: a ficha de hoje, como estava no semestre anterior e o que já foi registrado no counseling. Aluno: ' },
      { rot: 'O que falta nas pastas de uma turma…', falta: 'turma',
        texto: 'Olhe as pastas dos alunos no Drive e diga quem está sem o PDF do planner, sem documento de counseling ou com o counseling ainda em Word, com o link de cada pasta. Turma: ' },
      { rot: 'Abrir a pasta de um aluno no Drive…', falta: 'aluno',
        texto: 'Me dê o link da pasta no Drive e diga o que tem nela (planner e counseling) do aluno ' },
      { rot: 'Registrar uma orientação no counseling…', falta: 'aluno',
        texto: 'Registre no counseling que hoje eu conversei e orientei o aluno. Aluno e o que foi combinado: ' },
      { rot: 'Quem precisa de termo e ainda não tem…', falta: 'turma',
        texto: 'Cruze o atraso com os documentos já gerados no card e liste quem tem 4 aulas ou mais de atraso e ainda não tem termo. Turma: ' }
    ] },

  { id: 'semana', ic: '🗓️', tit: 'Minha semana', sub: 'o que fazer com tudo isso',
    perguntas: [
      { rot: 'Monte minhas prioridades da semana',
        texto: 'Monte minha lista de prioridades da semana: no máximo sete itens, do mais urgente para o menos, cada um com o aluno ou a turma e o motivo em números.',
        depois: ['Quem precisa de termo de atraso?', 'Com quem eu falo antes da próxima aula?'] },
      { rot: 'Com quem eu falo antes da próxima aula?',
        texto: 'Com quais alunos eu preciso falar antes da próxima aula, e sobre o quê? Considere atraso crítico e faltas altas. No máximo oito nomes, com a turma.' },
      { rot: 'Rascunhar um recado para a secretaria…', falta: 'aluno',
        texto: 'Rascunhe um recado curto para a secretaria, só com os dados do card, pedindo contato com a família do aluno ' }
    ] }
];

/* quando a pergunta foi escrita à mão, estes atalhos servem para qualquer resposta */
window.BUDDY_DEPOIS_PADRAO = ['Quem são os alunos, com os números?', 'O que eu faço primeiro?', 'Resuma em três linhas'];
