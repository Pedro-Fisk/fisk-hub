/* ============================================================
   CATÁLOGO DE TREINAMENTOS INTERNOS — FISK Taubaté · Caçapava
   Fonte: Planner de Treinamento de Equipe, aba "3. MONITORES E
   PROFESSORES", coluna LINKS.

   Para adicionar um treinamento, copie um bloco {titulo: ...} e cole
   na categoria certa (ou crie uma categoria nova no mesmo formato).

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
        titulo: "Checklist de Explicação — Procedimentos de Exploração",
        video: "",
        pdf: "https://drive.google.com/file/d/16_Xk31PJOV8ineWby2zQZhtcncsMRBj6/view",
      },
    ],
  },
  {
    categoria: "Atividade Comunicativa",
    itens: [
      {
        titulo: "Tipos de Atividades — videos, songs, trailer, speak up",
        video: "https://drive.google.com/file/d/1OMxNmOXiz8xXny-kKJ_JQYzkuMWmvlxr/view",
        pdf: "",
      },
    ],
  },
  {
    categoria: "Aula Acadêmica",
    itens: [
      {
        titulo: "Texto — About Teaching Teenagers",
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
