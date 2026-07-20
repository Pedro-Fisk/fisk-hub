/* ============================================================
   CATÁLOGO DE TREINAMENTOS INTERNOS — FISK Taubaté · Caçapava
   Fonte: Planner de Treinamento de Equipe, aba "3. MONITORES E
   PROFESSORES", coluna LINKS.

   Para adicionar um treinamento, copie um bloco {titulo: ...} e cole
   na categoria certa (ou crie uma categoria nova no mesmo formato).

   Campos de cada item (todos os links são do Google Drive/YouTube):
   - titulo: nome exibido no card (obrigatório)
   - video:  link do vídeo — vira player embutido ("" = sem vídeo)
   - pdf:    link de material de apoio/leitura ("" = sem PDF)
   - pasta:  link de pasta no Drive com o material ("" = sem pasta)

   Os vídeos são do Drive interno: o professor precisa estar logado na
   conta Google da escola para assistir.
   ============================================================ */
const TRAININGS = [
  {
    categoria: "Realidade Individual",
    itens: [
      {
        titulo: "Treinamento de Realidade Individual",
        video: "https://drive.google.com/file/d/1U9iTKuWqOZq9SGxWXFY-xCYFvUxvzjKm/view",
        pdf: "",
        pasta: "",
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
        pasta: "https://drive.google.com/drive/u/1/folders/1SGOASNenPbD1uJSepuxzpZ0RyV9-77io",
      },
      {
        titulo: "Checklist de Explicação — Procedimentos de Exploração",
        video: "",
        pdf: "https://drive.google.com/file/d/16_Xk31PJOV8ineWby2zQZhtcncsMRBj6/view",
        pasta: "",
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
        pasta: "",
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
        pasta: "",
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
        pasta: "",
      },
    ],
  },
];
