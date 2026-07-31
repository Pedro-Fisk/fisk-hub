/* ============================================================
   CATÁLOGO DE TREINAMENTOS INTERNOS — FISK Taubaté · Caçapava
   Fonte: Planner de Treinamento de Equipe, aba "3. MONITORES E
   PROFESSORES", coluna LINKS.

   ⚠️ Este é o catálogo FIXO. Para publicar um vídeo no dia a dia, use o
   Painel da Direção (card "🎥 Treinamentos e Gravações"): lá basta colar o
   link do Drive e escolher se é uma gravação de reunião ou um treinamento —
   ele aparece nesta mesma página na hora, sem mexer no repositório. Este
   arquivo continua valendo e aparece junto; edite-o quando quiser fixar algo
   no catálogo base ou criar uma categoria nova.

   Para adicionar um treinamento aqui, copie um bloco {titulo: ...} e cole
   na categoria certa (ou crie uma categoria nova no mesmo formato).
   Ao criar uma categoria nova, acrescente o nome dela também na lista
   TN_CATEGORIAS_BASE do backend (Code.gs) — é de lá que o painel tira as
   opções de categoria na hora de publicar.

   Campos de cada item (todos os links são do Google Drive/YouTube):
   - titulo: nome exibido no card (obrigatório)
   - video:  link do vídeo — vira player embutido ("" = sem vídeo,
             o card mostra EM BREVE)
   - pdf:    link de material de apoio/leitura ("" = sem PDF)

   ⚠️ Use sempre links de ARQUIVO (vídeo ou PDF), nunca de pasta: as
   pastas do Drive são restritas — só os arquivos têm liberação
   individual de visualização para os professores.
   ============================================================ */
const TRAININGS = [
  {
    categoria: "Realidade Individual",
    itens: [
      {
        titulo: "Treinamento de Realidade Individual",
        video: "https://drive.google.com/file/d/1U9iTKuWqOZq9SGxWXFY-xCYFvUxvzjKm/view",
        pdf: "",
      },
    ],
  },
  {
    categoria: "Exploration e Checking",
    itens: [
      {
        titulo: "Treinamento de Exploration e Checking",
        video: "",
        pdf: "",
      },
      {
        titulo: "Checklist de Explicação, Procedimentos de Exploração",
        video: "",
        pdf: "https://drive.google.com/file/d/16_Xk31PJOV8ineWby2zQZhtcncsMRBj6/view",
      },
    ],
  },
  {
    categoria: "Atividade Comunicativa",
    itens: [
      {
        titulo: "Tipos de Atividades, videos, songs, trailer, speak up",
        video: "https://drive.google.com/file/d/1OMxNmOXiz8xXny-kKJ_JQYzkuMWmvlxr/view",
        pdf: "",
      },
    ],
  },
  {
    categoria: "Aula Acadêmica",
    itens: [
      {
        titulo: "Texto, About Teaching Teenagers",
        video: "",
        pdf: "https://drive.google.com/file/d/1YpqBEog0ZM4S0kTN4W4euaOjpbYMAMk2/view",
      },
    ],
  },
  {
    categoria: "Gamificação",
    itens: [
      {
        titulo: "Treinamento de Gamificação",
        video: "https://drive.google.com/file/d/1XVoPly5AXr71zEJuk-XdWmgnoYTALUbT/view",
        pdf: "",
      },
    ],
  },
];
