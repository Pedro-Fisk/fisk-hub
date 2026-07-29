/* Visualizador de Answer Keys — compartilhado entre answer-keys-livro.html e
   answer-keys-provas.html. Monta a tela cheia, o zoom e a saída para o Drive.

   Uso:
     akViewerInit();                                  // uma vez, no fim da página
     akAbrir('<driveId>', 'Título mostrado na barra'); // abre um PDF
     document.querySelectorAll('.ak-card')             // links com data-ak/data-titulo
       já são interceptados por akViewerInit.
*/

var akViewer, akFrame, akTitulo, akLinkDrive, akPalco, akPct, akBtnMais, akBtnMenos;

/* Em vez de esticar a imagem (transform), o iframe fica maior e o Drive redesenha
   o PDF nesse tamanho — o texto cresce nítido. O palco vira a área de rolagem. */
var AK_ZOOMS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];
var akZi = 0, akBaseW = 0, akBaseH = 0;
var akAoFechar = null;   /* callback opcional: devolve o foco a quem abriu */

function akViewerInit() {
  var d = document.createElement('div');
  d.className = 'ak-viewer';
  d.id = 'akViewer';
  d.hidden = true;
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-modal', 'true');
  d.setAttribute('aria-label', 'Answer Key');
  d.innerHTML =
    '<div class="ak-bar">' +
      '<strong id="akTitulo"></strong>' +
      '<div class="ak-zoomctrl" role="group" aria-label="Zoom">' +
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.8"/>' +
          '<path d="M15.4 15.4L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
        '</svg>' +
        '<button type="button" id="akZoomOut" title="Diminuir zoom (tecla −)" aria-label="Diminuir zoom">−</button>' +
        '<span id="akZoomPct">100%</span>' +
        '<button type="button" id="akZoomIn" title="Aumentar zoom (tecla +)" aria-label="Aumentar zoom">+</button>' +
      '</div>' +
      '<a id="akDrive" href="#" target="_blank" rel="noopener"><span class="ak-lbl">Abrir no Drive </span>↗</a>' +
      '<button type="button" id="akFechar" aria-label="Fechar">✕<span class="ak-lbl"> Fechar</span></button>' +
    '</div>' +
    '<div class="ak-palco" id="akPalco">' +
      /* sandbox sem allow-top-navigation: sem ele, quando o professor não está
         logado no Google, a tela de login do Drive sequestra a aba inteira e o
         Hub some. Presa no quadro, essa tela de login não funciona (o Google
         recusa renderizá-la dentro de um iframe) — por isso o aviso abaixo
         oferece a saída que funciona: abrir no Drive, em outra aba. */
      '<iframe id="akFrame" title="Answer Key" allowfullscreen ' +
      'sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox ' +
      'allow-forms allow-downloads"></iframe>' +
    '</div>' +
    '<p class="ak-aviso">Use a lupa para aproximar · pedindo login, entre com a sua conta Google ' +
    'da Fisk (a mesma do drive pedagógico) ou ' +
    '<a id="akAvisoLink" href="#" target="_blank" rel="noopener">abra este gabarito no Drive ↗</a></p>';
  document.body.appendChild(d);

  akViewer = d;
  akFrame = document.getElementById('akFrame');
  akTitulo = document.getElementById('akTitulo');
  akLinkDrive = document.getElementById('akDrive');
  akPalco = document.getElementById('akPalco');
  akPct = document.getElementById('akZoomPct');
  akBtnMais = document.getElementById('akZoomIn');
  akBtnMenos = document.getElementById('akZoomOut');

  akBtnMais.addEventListener('click', function () { akZoom(1); });
  akBtnMenos.addEventListener('click', function () { akZoom(-1); });
  document.getElementById('akFechar').addEventListener('click', akFecharViewer);

  window.addEventListener('resize', function () {
    if (akViewer.hidden) return;
    akMedirBase();
    akAplicarZoom();
  });

  document.addEventListener('keydown', function (ev) {
    if (akViewer.hidden) return;
    if (ev.key === 'Escape') { akFecharViewer(); return; }
    /* atalhos valem enquanto o foco está no Hub; depois de clicar dentro do PDF
       o teclado passa a ser do Drive — por isso os botões da lupa existem */
    if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); akZoom(1); }
    else if (ev.key === '-' || ev.key === '_') { ev.preventDefault(); akZoom(-1); }
    else if (ev.key === '0') { ev.preventDefault(); akZi = 0; akAplicarZoom(); }
  });

  /* ctrl/⌘ + roda sobre as bordas do palco também aproxima */
  akPalco.addEventListener('wheel', function (ev) {
    if (!ev.ctrlKey && !ev.metaKey) return;
    ev.preventDefault();
    akZoom(ev.deltaY < 0 ? 1 : -1);
  }, { passive: false });

  akLigarCards(document);
}

/* Intercepta os <a class="ak-card"> de um trecho da página (usado também depois
   de renderizar cards novos). */
function akLigarCards(raiz) {
  var cards = raiz.querySelectorAll('.ak-card');
  for (var i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute('data-ak-ligado')) continue;
    cards[i].setAttribute('data-ak-ligado', '1');
    cards[i].addEventListener('click', function (ev) {
      /* deixa passar ctrl/cmd/meio-clique: quem quer outra aba, tem outra aba */
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
      ev.preventDefault();
      var alvo = this;
      akAbrir(alvo.getAttribute('data-ak'), alvo.getAttribute('data-titulo'), function () {
        alvo.focus();
      });
    });
  }
}

function akAbrir(driveId, titulo, aoFechar) {
  akAoFechar = aoFechar || null;
  akTitulo.textContent = titulo || 'Answer Key';
  akLinkDrive.href = 'https://drive.google.com/file/d/' + driveId + '/view';
  document.getElementById('akAvisoLink').href = akLinkDrive.href;
  akFrame.src = 'https://drive.google.com/file/d/' + driveId + '/preview';
  akViewer.hidden = false;
  document.body.style.overflow = 'hidden';
  akZi = 0;
  akMedirBase();
  akAplicarZoom();
  document.getElementById('akFechar').focus();
}

function akFecharViewer() {
  akViewer.hidden = true;
  akFrame.src = 'about:blank';   /* solta o PDF da memória e para o carregamento */
  document.body.style.overflow = '';
  if (akAoFechar) { akAoFechar(); akAoFechar = null; }
}

function akMedirBase() {
  akFrame.style.width = '100%';
  akFrame.style.height = '100%';
  akBaseW = akPalco.clientWidth;
  akBaseH = akPalco.clientHeight;
}

function akAplicarZoom() {
  var z = AK_ZOOMS[akZi];
  if (z === 1) {
    akFrame.style.width = '100%';
    akFrame.style.height = '100%';
  } else {
    akFrame.style.width = Math.round(akBaseW * z) + 'px';
    akFrame.style.height = Math.round(akBaseH * z) + 'px';
  }
  akPct.textContent = Math.round(z * 100) + '%';
  akBtnMenos.disabled = (akZi === 0);
  akBtnMais.disabled = (akZi === AK_ZOOMS.length - 1);
  /* documento centralizado: ao aproximar, o interesse está no meio da página */
  akPalco.scrollLeft = Math.max(0, (akPalco.scrollWidth - akPalco.clientWidth) / 2);
}

function akZoom(passo) {
  var novo = akZi + passo;
  if (novo < 0 || novo >= AK_ZOOMS.length) return;
  akZi = novo;
  akAplicarZoom();
}

/* Ícone de documento com visto, usado nos cards das duas páginas. */
function akIconeDoc() {
  return '<div class="icon"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M5 4.5A1.5 1.5 0 016.5 3H14l5 5v11.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19.5v-15z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M13.8 3.2V8.2h5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M8.5 14.2l2 2 4.2-4.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg></div>';
}

function akEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
