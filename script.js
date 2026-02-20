// ── PDF.js worker ─────────────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ── Books / Case-study data ───────────────────────────────────────────────────
const DEMO_PDF = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

const books = [
  {
    title:     'Digital Readiness & Feasibility Report',
    client:    'Allied Fleet Services',
    domain:    'Shipping, Freight, Customs & CBAM',
    location:  'UK',
    flag:      '🇬🇧',
    delivered: '4 weeks',
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
    cta:  'View Report',
    icon: '📘',
    url:  DEMO_PDF,
  },
  {
    title:     'JavaScript Engine Performance Analysis',
    client:    'Mozilla Research Labs',
    domain:    'Browser Engine Optimisation',
    location:  'USA',
    flag:      '🇺🇸',
    delivered: '6 weeks',
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
    cta:  'VIEW REPORT',
    icon: '📙',
    url:  DEMO_PDF,
  },
  {
    title:     'Web Standards Compliance Handbook',
    client:    'Global FinTech Consortium',
    domain:    'Financial Technology & RegTech',
    location:  'EU',
    flag:      '🇪🇺',
    delivered: '8 weeks',
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
    cta:  'READ FINDINGS',
    icon: '📗',
    url:  DEMO_PDF,
  },
  {
    title:     'Modern CSS Architecture Blueprint',
    client:    'RetailTech Solutions',
    domain:    'E-commerce & Digital Retail',
    location:  'AUS',
    flag:      '🇦🇺',
    delivered: '5 weeks',
    description:
        'A full-scale <strong>design-system architecture</strong> engagement covering token strategy, ' +
        'component library governance, and build-pipeline integration using modern CSS tooling. The ' +
        'deliverable replaced a legacy SASS monolith with a scalable, theme-able design system that ' +
        'reduced front-end build times by 60 % and enabled a distributed team of 30 engineers to ship ' +
        'consistent UI changes independently. The system is now actively maintained across four product lines.',
    cta:  'BOOK A MEETING',
    icon: '📕',
    url:  DEMO_PDF,
  },
  {
    title:     'Browser Internals Deep Dive',
    client:    'Chromium Open-Source Project',
    domain:    'Open Source & Developer Tooling',
    location:  'USA',
    flag:      '🇺🇸',
    delivered: '10 weeks',
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
    cta:  'READ RESEARCH',
    icon: '📓',
    url:  DEMO_PDF,
  },
  {
    title:     'PDF Rendering Techniques & Standards',
    client:    'DocuFlow Enterprise',
    domain:    'Document Management & Automation',
    location:  'Canada',
    flag:      '🇨🇦',
    delivered: '3 weeks',
    description:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
    cta:  'BOOK A MEETING',
    icon: '📒',
    url:  DEMO_PDF,
  },
];

// ── Slider state ──────────────────────────────────────────────────────────────
let currentSlide  = 0;
let isSlidingAnim = false;
let thumbCache    = {};   // { url: dataURL }

// ── Flipbook / modal state ────────────────────────────────────────────────────
let pdfDoc      = null;
let totalPages  = 0;
let spreadStart = 0;
let isFlipping  = false;
let zoomLevel   = 1.0;
let modalOpen   = false;

const FLIP_DURATION = 650;
const ZOOM_STEP     = 0.15;
const ZOOM_MIN      = 0.4;
const ZOOM_MAX      = 3.0;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const flipLoading  = document.getElementById('flipbook-loading');
const flipViewer   = document.getElementById('flipbook-viewer');
const modalTitleEl = document.getElementById('modal-book-title');
const pageInfoEl   = document.getElementById('page-info');
const btnPrev      = document.getElementById('btn-prev');
const btnNext      = document.getElementById('btn-next');
const pageLeftEl   = document.getElementById('page-left');
const pageRightEl  = document.getElementById('page-right');
const canvasLeft   = document.getElementById('canvas-left');
const canvasRight  = document.getElementById('canvas-right');
const spinnerLeft  = document.getElementById('spinner-left');
const spinnerRight = document.getElementById('spinner-right');
const blankLeft    = document.getElementById('blank-left');
const blankRight   = document.getElementById('blank-right');

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM MODAL  (no Bootstrap)
// ═══════════════════════════════════════════════════════════════════════════════

function showModal(onShown) {
  const overlay = document.getElementById('pdfModal');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  // Double rAF ensures the display:flex is painted before the transition starts
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    modalOpen = true;
    setTimeout(onShown, 320); // wait for CSS transition to finish
  }));
}

function hideModal() {
  const overlay = document.getElementById('pdfModal');
  overlay.classList.remove('is-open');
  modalOpen = false;
  document.body.style.overflow = '';
  setTimeout(() => {
    overlay.style.display = 'none';
    onModalClosed();
  }, 320);
}

function onModalClosed() {
  pdfDoc = null;
  flipViewer.classList.add('hidden');
  flipLoading.classList.remove('hidden');
  flipLoading.innerHTML = '<div class="spinner"></div><p>Loading PDF\u2026</p>';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDER
// ═══════════════════════════════════════════════════════════════════════════════

function initSlider() {
  document.getElementById('btn-slide-prev').addEventListener('click', slidePrev);
  document.getElementById('btn-slide-next').addEventListener('click', slideNext);
  document.getElementById('cover-panel').addEventListener('click', () => openBook(currentSlide));
  document.getElementById('btn-cta').addEventListener('click',      () => openBook(currentSlide));

  // Close modal: button + backdrop click + Escape key
  document.getElementById('modal-close-btn').addEventListener('click', hideModal);
  document.getElementById('pdfModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideModal();
  });

  renderSlide(0);
}

async function renderSlide(idx) {
  const book = books[idx];

  document.getElementById('card-flag').textContent       = book.flag || '';
  document.getElementById('case-desc').innerHTML         = book.description;
  document.getElementById('cta-label').textContent       = book.cta;
  document.getElementById('cta-icon-inner').textContent  = book.icon;
  document.getElementById('slide-counter').textContent   = `${idx + 1} of ${books.length}`;

  document.getElementById('meta-table').innerHTML = [
    ['Client Domain',   book.domain],
    ['Client Location', book.location],
    ['Delivered in',    book.delivered],
  ].map(([k, v]) =>
    `<span class="meta-key">${k}</span><span class="meta-sep">:</span><span class="meta-val">${v}</span>`
  ).join('');

  document.getElementById('btn-slide-prev').disabled = idx === 0;
  document.getElementById('btn-slide-next').disabled = idx === books.length - 1;

  await renderCoverThumb(book.url);
}

async function renderCoverThumb(url) {
  const canvas  = document.getElementById('cover-canvas');
  const spinner = document.getElementById('cover-spinner');

  if (thumbCache[url]) {
    const img = new Image();
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
    };
    img.src = thumbCache[url];
    spinner.style.display = 'none';
    canvas.style.display  = 'block';
    return;
  }

  spinner.style.display = 'flex';
  canvas.style.display  = 'none';

  try {
    const doc      = await pdfjsLib.getDocument(url).promise;
    const page     = await doc.getPage(1);
    const base     = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 260 / base.width });
    canvas.width   = viewport.width;
    canvas.height  = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    thumbCache[url]      = canvas.toDataURL();
    canvas.style.display = 'block';
  } catch (e) {
    console.warn('Thumbnail failed:', e);
  } finally {
    spinner.style.display = 'none';
  }
}

function slidePrev() {
  if (isSlidingAnim || currentSlide === 0) return;
  animateSlide(() => { currentSlide--; renderSlide(currentSlide); });
}

function slideNext() {
  if (isSlidingAnim || currentSlide === books.length - 1) return;
  animateSlide(() => { currentSlide++; renderSlide(currentSlide); });
}

function animateSlide(changeFn) {
  isSlidingAnim = true;
  const card = document.getElementById('case-card');
  card.classList.add('fading');
  setTimeout(() => {
    changeFn();
    card.classList.remove('fading');
    isSlidingAnim = false;
  }, 260);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLIPBOOK MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function openBook(idx) {
  const book = books[idx];

  modalTitleEl.textContent = book.title;
  spreadStart = 0;
  isFlipping  = false;
  pdfDoc      = null;
  zoomLevel   = 1.0;
  applyZoom();

  flipLoading.innerHTML = '<div class="spinner"></div><p>Loading PDF\u2026</p>';
  flipLoading.classList.remove('hidden');
  flipViewer.classList.add('hidden');

  showModal(async () => {
    try {
      pdfDoc     = await pdfjsLib.getDocument(book.url).promise;
      totalPages = pdfDoc.numPages;

      flipLoading.classList.add('hidden');
      flipViewer.classList.remove('hidden');

      // Opening zoom-in animation
      const spread = document.getElementById('book-spread');
      spread.classList.remove('zoom-open-anim');
      void spread.offsetWidth;   // force reflow to restart animation
      spread.classList.add('zoom-open-anim');

      await renderSpread(0);
    } catch (err) {
      console.error('PDF load error:', err);
      flipLoading.innerHTML = `
        <div class="err-state">
          <span class="err-icon">&#9888;</span>
          <p class="err-text">Failed to load PDF.</p>
          <p class="err-hint">Check the URL or CORS settings.</p>
        </div>`;
    }
  });
}

// ── Spread rendering ──────────────────────────────────────────────────────────
async function renderSpread(startIdx) {
  spreadStart = startIdx;
  updateControls();
  await Promise.all([
    renderPage(startIdx + 1, canvasLeft,  spinnerLeft,  blankLeft),
    renderPage(startIdx + 2, canvasRight, spinnerRight, blankRight),
  ]);
}

async function renderPage(pageNum, canvas, spinner, blank) {
  if (pageNum < 1 || pageNum > totalPages) {
    canvas.style.display = 'none';
    blank.classList.remove('hidden');
    blank.textContent = pageNum < 1 ? 'Cover' : '';
    return;
  }
  canvas.style.display = 'block';
  blank.classList.add('hidden');
  spinner.classList.remove('hidden');
  try {
    const page         = await pdfDoc.getPage(pageNum);
    const TARGET_WIDTH = canvas.parentElement.offsetWidth || 360;
    const base         = page.getViewport({ scale: 1 });
    const viewport     = page.getViewport({ scale: TARGET_WIDTH / base.width });
    canvas.width  = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  } finally {
    spinner.classList.add('hidden');
  }
}

// ── Page flip ─────────────────────────────────────────────────────────────────
async function goNext() {
  if (isFlipping || spreadStart + 2 >= totalPages) return;
  isFlipping = true;
  pageRightEl.classList.add('anim-forward');
  setTimeout(async () => { await renderSpread(spreadStart + 2); }, FLIP_DURATION / 2);
  setTimeout(() => { pageRightEl.classList.remove('anim-forward'); isFlipping = false; }, FLIP_DURATION);
}

async function goPrev() {
  if (isFlipping || spreadStart <= 0) return;
  isFlipping = true;
  pageLeftEl.classList.add('anim-backward');
  setTimeout(async () => { await renderSpread(Math.max(0, spreadStart - 2)); }, FLIP_DURATION / 2);
  setTimeout(() => { pageLeftEl.classList.remove('anim-backward'); isFlipping = false; }, FLIP_DURATION);
}

function updateControls() {
  btnPrev.disabled = spreadStart <= 0;
  btnNext.disabled = spreadStart + 2 >= totalPages;
  const left  = spreadStart + 1;
  const right = Math.min(spreadStart + 2, totalPages);
  pageInfoEl.textContent =
    left === right ? `Page ${left} of ${totalPages}` : `Pages ${left} \u2013 ${right} of ${totalPages}`;
}

// ── Zoom ──────────────────────────────────────────────────────────────────────
function applyZoom() {
  document.getElementById('book-spread').style.zoom = zoomLevel;
  document.getElementById('zoom-label').textContent  = Math.round(zoomLevel * 100) + '%';
  document.getElementById('btn-zoom-out').disabled   = zoomLevel <= ZOOM_MIN;
  document.getElementById('btn-zoom-in').disabled    = zoomLevel >= ZOOM_MAX;
}
function zoomIn()    { zoomLevel = Math.min(ZOOM_MAX, +(zoomLevel + ZOOM_STEP).toFixed(2)); applyZoom(); }
function zoomOut()   { zoomLevel = Math.max(ZOOM_MIN, +(zoomLevel - ZOOM_STEP).toFixed(2)); applyZoom(); }
function resetZoom() { zoomLevel = 1.0; applyZoom(); }

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOpen)         { hideModal(); return; }
  if (!modalOpen) return;
  if (e.key === 'ArrowRight')                  goNext();
  if (e.key === 'ArrowLeft')                   goPrev();
  if (e.key === '+' || e.key === '=')          zoomIn();
  if (e.key === '-')                           zoomOut();
  if (e.key === '0')                           resetZoom();
});

// Ctrl + scroll wheel = zoom
document.getElementById('zoom-viewport').addEventListener('wheel', (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  e.deltaY < 0 ? zoomIn() : zoomOut();
}, { passive: false });

// ── Button wiring ─────────────────────────────────────────────────────────────
btnNext.addEventListener('click', goNext);
btnPrev.addEventListener('click', goPrev);
document.getElementById('btn-zoom-in').addEventListener('click',    zoomIn);
document.getElementById('btn-zoom-out').addEventListener('click',   zoomOut);
document.getElementById('btn-zoom-reset').addEventListener('click', resetZoom);

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initSlider);
