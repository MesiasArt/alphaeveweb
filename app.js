const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const comics = [
  { title: 'A la deriva con mi perro', slug: 'a-la-deriva-con-mi-perro', initials: 'DERIVA', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/a-la-deriva-con-mi-perro/cover/A%20LA%20DERIVA%20CON%20MI%20PERRO%20DEF_001%20cover%20copia.jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Baká: El Mito Asesino', slug: 'baka-el-mito-asesino', initials: 'BAKÁ', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/baka-el-mito-asesino/cover/Baka%20El%20mito%20Asesino%20Vol.1.jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Bazuca - La heroína olvidada', slug: 'bazuca-la-heroina-olvidada', initials: 'BAZUCA', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/bazuca-la-heroina-olvidada/cover/Bazuca%20Cover.jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Cuentos del Magijara', slug: 'cuentos-del-magijara', initials: 'MAGIJARA', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/cuentos-del-magijara/cover/magijara%20copia.jpg', chapterCount: 5, availableChapters: 5, creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Escondite', slug: 'escondite', initials: 'ESCONDITE', format: null, genres: [], status: null, synopsis: null, cover: '/series/escondite/cover/Escondite.jpg', creatorSlugs: ['nattibie'], chapters: [], characters: [], gallery: [] },
  { title: 'How to Hide a Mermaid', slug: 'how-to-hide-a-mermaid', initials: 'MERMAID', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/how-to-hide-a-mermaid/cover/Portada%20Ingles%20y%20Espa%C3%B1ol%20copia.jpg', chapterCount: 2, availableChapters: 2, creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Jagua Tales', slug: 'jagua-tales', initials: 'JAGUA', format: null, genres: [], status: null, synopsis: null, cover: '/series/jagua-tales/cover/Jagua%20Tales%20vol2%2001.jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'La Armadura de mi Hermano', slug: 'la-armadura-de-mi-hermano', initials: 'ARMADURA', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/la-armadura-de-mi-hermano/cover/La%20Armadura.jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'La Guagua Voladora', slug: 'la-guagua-voladora', initials: 'GUAGUA', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/la-guagua-voladora/cover/La%20Guagua%20Voladora(1).jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'La Lu’ Interior', slug: 'la-lu-interior', initials: 'LU’', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/la-lu-interior/cover/Portada%20y%20Contraportada%20-%20copia.jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Last Breath', slug: 'last-breath', initials: 'LAST', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/last-breath/cover/Portada%20y%20Contraportada%20-%20copia.jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Más Freak de lo Normal', slug: 'mas-freak-de-lo-normal', initials: 'MÁS FREAK', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/mas-freak-de-lo-normal/cover/Copy%20of%20Freakier%20Than%20Normal%20Cover2.jpg', chapterCount: 7, availableChapters: 7, creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Mi Angelito Defectuoso', slug: 'mi-angelito-defectuoso', initials: 'ANGELITO', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/mi-angelito-defectuoso/cover/Portada%20y%20Contraportada%20copia.jpg', chapterCount: 1, availableChapters: 1, creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Pantaleta', slug: 'pantaleta', initials: 'PANTALETA', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/pantaleta/cover/Pantaleta.jpg', chapterCount: 2, availableChapters: 2, creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Quimica al 100%', slug: 'quimica-al-100', initials: 'QUÍMICA', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/quimica-al-100/cover/Baka%20%231%20Portada%20-%20copia.jpg', chapterCount: 3, availableChapters: 3, creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Ruptura', slug: 'ruptura', initials: 'RUPTURA', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/ruptura/cover/Ruptura.jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Sangrienta', slug: 'sangrienta', initials: 'SANGRIENTA', format: 'Series', genres: [], status: null, synopsis: null, cover: '/series/sangrienta/cover/Baka%20%231%20Portada%20-%20copia.jpg', chapterCount: 3, availableChapters: 1, creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Tomorrow Girl x Freakier Than Normal', slug: 'tomorrow-girl-x-freakier-than-normal', initials: 'TOMORROW', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/tomorrow-girl-x-freakier-than-normal/cover/tomorrow%20girl%20x%20freakier%20than%20normal%20cover.jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Umbral, El reino de lo invisible', slug: 'umbral-el-reino-de-lo-invisible', initials: 'UMBRAL', format: 'One-shot', genres: [], status: null, synopsis: null, cover: '/series/umbral-el-reino-de-lo-invisible/cover/portada%20umbral%20copia.jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
  { title: 'Yanikeke', slug: 'yanikeke', initials: 'YAN', format: null, genres: [], status: null, synopsis: null, cover: '/series/yanikeke/cover/Yanikeke%2000().jpg', creatorSlugs: [], chapters: [], characters: [], gallery: [] },
];
comics.forEach(comic => {
  if (comic.chapterCount) comic.chapters = Array.from({ length: comic.availableChapters }, (_, index) => ({
    number: index + 1,
    title: `Capítulo ${String(index + 1).padStart(2, '0')}`,
    status: comic.availableChapters < comic.chapterCount && index + 1 === comic.availableChapters ? 'Disponible · habrá más capítulos' : 'Disponible',
    cover: `/series/${comic.slug}/chapters/chapter-${String(index + 1).padStart(2, '0')}/cover/cover.jpg`,
    digitalUrl: null,
    physicalUrl: null,
  }));
});
const pantaleta = comics.find(comic => comic.slug === 'pantaleta');
if (pantaleta?.chapters[1]) pantaleta.chapters[1].cover = pantaleta.cover;
const originalIp = [];
const authors = [
  { name: 'anderson-07', slug: 'anderson-07', image: 'anderson-07.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'darkereve', slug: 'darkereve', image: 'darkereve.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'froggynami', slug: 'froggynami', image: 'froggynami.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'manuel_shoo', slug: 'manuel_shoo', image: 'manuel_shoo.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'mesiasart', slug: 'mesiasart', image: 'mesiasart.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'Nattibie', slug: 'nattibie', image: 'Nattibie.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'Nicodomo', slug: 'nicodomo', image: 'Nicodomo.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'ossy_jo', slug: 'ossy_jo', image: 'ossy_jo.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'spencer_draw', slug: 'spencer_draw', image: 'spencer_draw.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'xamurai_rd', slug: 'xamurai_rd', image: 'xamurai_rd.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'yonsoncb', slug: 'yonsoncb', image: 'yonsoncb.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  { name: 'zukupow', slug: 'zukupow', image: 'zukupow.jpg', role: null, bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
];
const projects = [
  {
    title: 'Un Tesoro para Siempre',
    slug: 'un-tesoro-para-siempre',
    subtitle: 'Una historia para aprender a ahorrar.',
    client: 'Banreservas',
    type: 'Cuento infantil / Ilustración editorial',
    storyBy: 'Evelin Cáceres Castellanos',
    illustrationBy: 'Francisco Balbuena · Máximo Montero',
    themes: ['Educación financiera', 'Ahorro', 'Medio ambiente', 'Valores'],
    category: 'TRABAJOS PARA CLIENTES',
    assets: {
      hero: 'Banreservas_cuento_3-4 copia.jpg',
      story: 'Banreservas_cuento_2d5-26 copia.jpg',
      lucasJenny: 'Lucas y Jenny.jpg',
      jenny: 'Jenny la ballenita.jpg',
      lucas: 'Lucas.jpg',
      pages: '17 - 18 Un Tesoro para Siempre.jpg',
      logo: '00 - Editorial Un Tesoro para Siempre LOGO.png',
      launch: 'lanzamiento.webp',
      booth: 'montaje.webp',
    },
  },
];
const tesoroAssetDir = '/datos/proyectos/Trabajos-para-clientes/un-tesoro-para-siempre%20(banreservas)';
function projectAsset(project, file) {
  if (!file) return '';
  return `${tesoroAssetDir}/${encodeURIComponent(file)}`;
}
const services = [
  ['Ilustración', 'Arte de personajes, arte clave, portadas e ilustración promocional.'],
  ['Cómics y manga', 'Narrativa secuencial, producción de cómics y narración visual.'],
  ['Arte conceptual', 'Personajes, criaturas, entornos y objetos.'],
  ['Diseño', 'Identidad de marca, diseño gráfico, productos y piezas promocionales.'],
  ['Desarrollo visual', 'Personajes, creación de mundos, arte para videojuegos y desarrollo visual.'],
  ['Colaboración creativa', 'Proyectos editoriales, propiedades con licencia y alianzas creativas.'],
];

function authorCard(author) {
  return `<a class="creator-card" href="/authors/${author.slug}" data-route>
    <div class="creator-image"><img src="/artistas/${encodeURIComponent(author.image)}" alt="Arte de ${esc(author.name)}" loading="lazy"><span>VER PERFIL ↗</span></div>
    <div class="creator-name"><h3>${esc(author.name)}</h3><span>${esc(author.role || 'CREADOR/A')}</span></div>
    <p class="creator-descriptor">${esc(author.specialties.length ? author.specialties.join(' · ') : 'Portafolio creativo de Alpha Eve')}</p>
  </a>`;
}
function comicCard(comic, index = 0) {
  return `<a class="comic-card" href="/comics/${comic.slug}" data-route>
    <div class="comic-card-art"><span class="comic-edition">ORIGINAL DE ALPHA EVE · ${String(index + 1).padStart(2, '0')}</span>${comic.cover ? `<img src="${esc(comic.cover)}" alt="Portada de ${esc(comic.title)}" onload="this.parentElement.classList.add('has-cover')" onerror="this.remove()">` : ''}<strong>${esc(comic.initials)}</strong><span class="comic-art-note">PORTADA POR AGREGAR</span></div>
    <div class="comic-card-copy"><h3>${esc(comic.title)}</h3><p>${esc(comic.genres?.length ? comic.genres.join(' · ') : 'Géneros por agregar')} <span>·</span> ${esc(comic.format === 'One-shot' ? 'Tomo único (oneshot)' : comic.format === 'Series' ? `Serie · ${comic.availableChapters || 0}${comic.chapterCount && comic.chapterCount !== comic.availableChapters ? ` de ${comic.chapterCount}` : ''} capítulos` : 'Formato por confirmar')}</p><span class="comic-card-arrow">↗</span></div>
  </a>`;
}
function ipCard(item) {
  const href = `/comics/${item.slug}`;
  return `<a class="ip-card" href="${href}" data-route><div class="ip-art"><small>ALPHA EVE ORIGINAL</small><span class="ip-initial">${esc(item.initials)}</span></div><div class="ip-info"><h3>${esc(item.title)}</h3><span>↗</span></div></a>`;
}
function creatorsFor(comic) { return comic.creatorSlugs.map(slug => authors.find(author => author.slug === slug)).filter(Boolean); }
function comicsFor(author) { return author.comicSlugs.map(slug => comics.find(comic => comic.slug === slug)).filter(Boolean); }

const app = document.querySelector('#app');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.desktop-nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
function closeMenu() { nav?.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); }

function authorDirectory() {
  return `<section class="directory-page authors-directory"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">ALPHA EVE STUDIOS · EQUIPO CREATIVO</p><h1>CREADORES<span class="red">.</span></h1><p>Conoce a los artistas y mentes creativas detrás de los mundos de Alpha Eve. Selecciona un perfil para ver su portafolio.</p><div class="directory-count">${authors.length} PERFILES CREATIVOS</div></div><div class="creator-grid directory-creators">${authors.map(authorCard).join('')}</div></section>`;
}
function normalizedTitle(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}
const genreOptions = ['Acción', 'Misterio', 'Gore +18', 'Slice of Life', 'Psicológico', 'Isekai', 'Kaiju', 'Ecchi +18', 'Fantasía', 'Cyberpunk', 'Comedia', 'Superhéroes', 'Crimen', 'Vampiros', 'Shonen', 'Aventura', 'Noir', 'Deportivo', 'Sobrenatural', 'Detective', 'Zombies', 'Shojo', 'Horror', 'Mecha', 'Histórico', 'Thriller', 'Artes Marciales', 'Steampunk', 'Seinen', 'Sci-Fi', 'Romance', 'Drama', 'Suspenso', 'Magia', 'Western', 'Josei'];
const catalogTypes = ['Comics', 'Manga', 'Cuentos Infantiles', 'Novelas', 'Artbooks', 'Otros'];
function comicDirectory() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return `<section class="directory-page comics-directory"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">ALPHA EVE STUDIOS · PUBLICACIONES</p><h1>CATÁLOGO<span class="red">.</span></h1><p>Historias y mundos originales publicados por Alpha Eve. Selecciona un título para conocer a sus creadores y su arte.</p><div class="directory-count">${comics.length} TÍTULOS</div></div><div class="catalog-types"><p>FORMATO</p><div>${['', ...catalogTypes].map(type => `<button type="button" data-catalog-type="${esc(type)}" ${type === activeCatalogType ? 'class="active"' : ''}>${type ? esc(type) : 'TODOS'}</button>`).join('')}</div></div><div class="catalog-filters"><label class="catalog-search"><span>BUSCAR TÍTULOS</span><input id="comic-search" type="search" placeholder="Buscar títulos…" autocomplete="off"></label><fieldset class="catalog-genres"><legend>FILTRAR POR GÉNERO</legend><p class="genre-filter-note">Selecciona uno o más géneros. Puedes asignar los géneros a cada título más adelante.</p><div class="genre-filter-grid">${genreOptions.map(genre => `<label><input type="checkbox" data-comic-genre value="${esc(genre)}"><span>${esc(genre)}</span></label>`).join('')}</div></fieldset></div><nav class="catalog-letters" aria-label="Filtrar cómics por letra inicial"><button type="button" class="active" data-comic-letter="">TODOS</button>${letters.map(letter => `<button type="button" data-comic-letter="${letter}" ${comics.some(comic => normalizedTitle(comic.title).startsWith(letter)) ? '' : 'disabled'}>${letter}</button>`).join('')}</nav><p id="catalog-results-line" class="catalog-results-line" aria-live="polite"></p><div class="comic-directory-grid" id="comic-directory-grid"></div><div class="directory-subsection"><p class="eyebrow">MÁS MUNDOS ORIGINALES</p><div class="ip-grid">${originalIp.map(ipCard).join('')}</div></div></section>`;
}
let activeComicLetter = '';
let activeComicGenres = [];
let activeCatalogType = '';
let comicSearchTerm = '';
function renderComicCatalog() {
  const grid = document.querySelector('#comic-directory-grid');
  if (!grid) return;
  const query = normalizedTitle(comicSearchTerm.trim());
  const filtered = comics.filter(comic => {
    const title = normalizedTitle(comic.title);
    return (!activeComicLetter || title.startsWith(activeComicLetter))
      && (!activeCatalogType || comic.catalogType === activeCatalogType)
      && (!activeComicGenres.length || activeComicGenres.some(genre => comic.genres?.includes(genre)))
      && (!query || title.includes(query));
  });
  const selectedGenresAssigned = comics.some(comic => activeComicGenres.some(genre => comic.genres?.includes(genre)));
  const selectedTypeAssigned = comics.some(comic => comic.catalogType === activeCatalogType);
  grid.innerHTML = filtered.length
    ? filtered.map(comic => comicCard(comic, comics.indexOf(comic))).join('')
    : `<p class="catalog-empty">${activeCatalogType && !selectedTypeAssigned ? 'Todavía no hay títulos en este formato.' : activeComicGenres.length && !selectedGenresAssigned ? 'Todavía no hay títulos asignados a los géneros seleccionados.' : 'Ningún título coincide con estos filtros.'}</p>`;
  const resultCount = document.querySelector('#catalog-results-line');
  if (resultCount) resultCount.textContent = `MOSTRANDO ${filtered.length} DE ${comics.length} TÍTULOS`;
  document.querySelectorAll('[data-comic-letter]').forEach(button => {
    const active = button.getAttribute('data-comic-letter') === activeComicLetter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-catalog-type]').forEach(button => {
    const active = (button.getAttribute('data-catalog-type') || '') === activeCatalogType;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
let originalsIndex = 0;
let originalsTimer = 0;
let originalsHold = 0;
function originalsCard(comic, decorative) {
  return `<a class="originals-card" href="/comics/${comic.slug}" data-route><img src="${esc(comic.cover)}" alt="${decorative ? '' : `Portada de ${esc(comic.title)}`}"></a>`;
}
function renderOriginals() {
  const container = document.querySelector('#ip-grid');
  if (!container || !comics.length || container.dataset.ready === 'true') return;
  container.dataset.ready = 'true';
  const cards = comics.map(comic => originalsCard(comic, false)).join('') + comics.map(comic => originalsCard(comic, true)).join('');
  container.innerHTML = `<div class="originals-row"><button type="button" class="originals-arrow" data-originals-step="-1" aria-label="Propiedad anterior">‹</button><div class="originals-viewport"><div class="originals-track">${cards}</div></div><button type="button" class="originals-arrow" data-originals-step="1" aria-label="Siguiente propiedad">›</button></div>`;
  originalsIndex = 0;
  positionOriginals(false);
  const row = container.querySelector('.originals-row');
  row.addEventListener('mouseenter', () => { originalsHold = Date.now() + 600000; });
  row.addEventListener('mouseleave', () => { originalsHold = 0; });
  row.querySelector('.originals-track').addEventListener('transitionend', () => {
    if (originalsIndex < comics.length) return;
    originalsIndex %= comics.length;
    positionOriginals(false);
  });
}
function originalsStepSize() {
  const card = document.querySelector('.originals-card');
  const track = document.querySelector('.originals-track');
  if (!card || !track) return 0;
  const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
  return card.getBoundingClientRect().width + gap;
}
function positionOriginals(animate) {
  const track = document.querySelector('.originals-track');
  const step = originalsStepSize();
  if (!track || !step) return;
  track.style.transition = animate ? 'transform .55s ease' : 'none';
  track.style.transform = `translateX(${-originalsIndex * step}px)`;
}
function stepOriginals(direction) {
  if (!comics.length) return;
  if (direction < 0 && originalsIndex <= 0) {
    originalsIndex = comics.length;
    positionOriginals(false);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      originalsIndex = comics.length - 1;
      positionOriginals(true);
    }));
    return;
  }
  originalsIndex += direction;
  positionOriginals(true);
}
function startOriginals() {
  if (originalsTimer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  originalsTimer = window.setInterval(() => {
    if (Date.now() < originalsHold || document.hidden || !document.querySelector('.originals-track')) return;
    stepOriginals(1);
  }, 3200);
}
function authorPage(author) {
  const related = comicsFor(author);
  return `<section class="detail-shell author-profile">
    <a class="detail-back" href="/authors" data-route>← Todos los creadores</a>
    <div class="detail-hero author-hero"><div class="author-portrait"><img src="/artistas/${encodeURIComponent(author.image)}" alt="${esc(author.name)}" /></div>
      <div class="detail-copy"><p class="eyebrow">ALPHA EVE · PORTAFOLIO CREATIVO</p><h1>${esc(author.name)}<span class="red">.</span></h1><div class="detail-meta">${esc(author.role || 'PERFIL CREATIVO')}</div><p>${esc(author.bio || 'Portafolio y perfil creativo del artista. La biografía y sus especialidades se agregarán cuando se confirme la información.')}</p><a class="button button-dark" href="#contact">Colabora con ${esc(author.name)} <span>↗</span></a></div></div>
    <section class="detail-block"><p class="eyebrow">ACERCA DEL CREADOR</p><h2>Biografía y especialidades</h2>${author.bio || author.specialties.length ? `<p>${esc(author.bio || author.specialties.join(' · '))}</p>` : '<div class="detail-empty">La biografía y las especialidades creativas aparecerán aquí.</div>'}</section>
    <section class="detail-block"><p class="eyebrow">PROYECTOS Y COLABORACIONES</p><h2>Proyectos destacados</h2><div class="detail-empty">Los proyectos aparecerán aquí cuando se confirmen.</div></section>
    <section class="detail-block"><p class="eyebrow">CÓMICS</p><h2>Historias y series</h2>${related.length ? `<div class="comic-directory-grid">${related.map(comicCard).join('')}</div>` : '<div class="detail-empty">Todavía no hay cómics vinculados a este perfil.</div>'}</section>
    <section class="detail-block"><p class="eyebrow">GALERÍA</p><h2>Arte y proceso</h2><div class="author-gallery"><img src="/artistas/${encodeURIComponent(author.image)}" alt="Ilustración de perfil de ${esc(author.name)}" loading="lazy"><div class="detail-empty">Aquí se agregarán más ilustraciones, bocetos y portadas.</div></div></section>
    <section class="detail-block"><p class="eyebrow">CONTACTO</p><h2>Colabora con ${esc(author.name)}</h2><p>Para consultas profesionales, contacta a Alpha Eve Studios.</p><a class="button button-dark" href="#contact">Contactar a Alpha Eve <span>↗</span></a></section>
  </section>`;
}
function comicPage(comic) {
  const linkedAuthors = creatorsFor(comic);
  const chapterSection = comic.chapters.length ? `<div class="chapter-grid">${comic.chapters.map(chapter => `<article class="chapter-card"><div class="chapter-art"><img src="${esc(chapter.cover)}" alt="${esc(comic.title)} — portada del ${esc(chapter.title)}" onerror="this.remove()"><span>PORTADA DEL CAPÍTULO POR AGREGAR</span></div><div><b>CAPÍTULO ${String(chapter.number).padStart(2, '0')}</b><h3>${esc(chapter.title)}</h3><p>${esc(chapter.status || 'Detalles por confirmar')}</p>${chapter.digitalUrl ? `<a href="${esc(chapter.digitalUrl)}">COMPRAR EDICIÓN DIGITAL ↗</a>` : ''}${chapter.physicalUrl ? `<a href="${esc(chapter.physicalUrl)}">COMPRAR EDICIÓN IMPRESA ↗</a>` : '<span class="purchase-unavailable">Enlace de compra por agregar</span>'}</div></article>`).join('')}</div>` : comic.format === 'One-shot' ? '<div class="detail-empty">Este oneshot se presenta como una obra única. Los enlaces de lectura y compra se agregarán cuando estén disponibles.</div>' : '<div class="detail-empty">Todavía no se ha agregado información de los capítulos.</div>';
  const charSection = comic.characters.length ? `<div class="character-grid">${comic.characters.map(character => `<article class="character-card"><div class="character-art">${character.image ? `<img src="${esc(character.image)}" alt="${esc(character.name)}">` : 'ILUSTRACIÓN POR AGREGAR'}</div><h3>${esc(character.name)}</h3></article>`).join('')}</div>` : '<div class="detail-empty">Los nombres e ilustraciones de los personajes se agregarán aquí.</div>';
  const gallery = comic.gallery.length ? `<div class="comic-gallery">${comic.gallery.map(image => `<img src="${esc(image.src)}" alt="${esc(image.alt || comic.title)}" loading="lazy">`).join('')}</div>` : '<div class="detail-empty">Aquí se agregarán arte promocional, bocetos y páginas interiores.</div>';
  const heroBanner = `/series/hero-banners/${comic.slug}.jpg`;
  const cover = `<div class="comic-key-art"><img src="${esc(heroBanner)}" alt="Banner de ${esc(comic.title)}" onload="this.parentElement.classList.add('has-cover')" onerror="if(!this.dataset.fallback){this.dataset.fallback='true';this.src='${esc(comic.cover)}'}else{this.remove()}"><small>ORIGINAL DE ALPHA EVE</small><strong>${esc(comic.initials)}</strong><span>ARTE CLAVE POR AGREGAR</span></div>`;
  const coverGallery = `<figure class="cover-image"><img src="${esc(comic.cover)}" alt="Portada principal de ${esc(comic.title)}" onerror="this.remove();this.parentElement.classList.add('missing')"><figcaption>PORTADA PRINCIPAL</figcaption></figure>`;
  const formatBadge = comic.format === 'One-shot' ? '<span class="series-badge oneshot-badge">TOMO ÚNICO · ONESHOT</span>' : comic.format === 'Series' ? `<span class="series-badge">SERIE · ${comic.availableChapters} CAPÍTULO${comic.availableChapters === 1 ? '' : 'S'}${comic.chapterCount !== comic.availableChapters ? ` · ${comic.availableChapters} DE ${comic.chapterCount}` : ''}</span>` : '<span class="series-badge">FORMATO POR CONFIRMAR</span>';
  const genreText = comic.genres?.length ? comic.genres.map(esc).join(' · ') : 'Géneros por agregar';
  return `<section class="detail-shell comic-detail">
    <a class="detail-back" href="/comics" data-route>← Todos los cómics</a>
    <div class="series-hero-banner">${cover}<div class="series-hero-shade"></div><div class="series-hero-copy"><p class="eyebrow">ORIGINAL DE ALPHA EVE · CÓMIC / MANGA</p><h1>${esc(comic.title)}<span class="red">.</span></h1><div class="series-badges">${formatBadge}<span class="series-badge">GÉNERO · ${genreText}</span></div><p class="series-hero-synopsis">${esc(comic.synopsis || 'La sinopsis estará disponible próximamente.')}</p><a class="button button-light" href="#chapters">Leer o comprar <span>↘</span></a></div></div>
    <section class="detail-block synopsis-block"><p class="eyebrow">LA HISTORIA</p><h2>Sinopsis</h2><p class="series-synopsis">${esc(comic.synopsis || 'La sinopsis de esta historia se agregará aquí.')}</p></section>
    <section class="detail-block" id="chapters"><p class="eyebrow">LEE LA HISTORIA</p><h2>Capítulos</h2>${chapterSection}</section>
    <section class="detail-block"><p class="eyebrow">PORTADAS</p><h2>Galería de portadas</h2><div class="cover-gallery">${coverGallery}${comic.variants?.length ? comic.variants.map(image => `<figure class="cover-image"><img src="${esc(image)}" alt="Portada alternativa de ${esc(comic.title)}"><figcaption>PORTADA ALTERNATIVA</figcaption></figure>`).join('') : '<div class="detail-empty">Las portadas alternativas y especiales aparecerán aquí cuando estén disponibles.</div>'}</div></section>
    <section class="detail-block"><p class="eyebrow">PERSONAJES</p><h2>Conoce al elenco</h2>${charSection}</section>
    <section class="detail-block"><p class="eyebrow">ARTE Y PROCESO</p><h2>Galería</h2>${gallery}</section>
    <section class="detail-block"><p class="eyebrow">CREADO POR</p><h2>Sus creadores</h2>${linkedAuthors.length ? `<div class="creator-grid comic-creators">${linkedAuthors.map(authorCard).join('')}</div>` : '<div class="detail-empty">Los créditos de creación se vincularán aquí cuando se confirmen.</div>'}</section>
    <section class="detail-block"><p class="eyebrow">DESCUBRE MÁS</p><h2>Más de Alpha Eve</h2><div class="comic-directory-grid">${comics.filter(entry => entry.slug !== comic.slug).map(comicCard).join('')}</div></section>
  </section>`;
}
function projectCard(project) {
  const cover = projectAsset(project, project.assets?.hero);
  return `<a class="project-card" href="/projects/${esc(project.slug)}" data-route>
    <div class="project-card-art">${cover ? `<img src="${esc(cover)}" alt="${esc(project.title)}" loading="lazy">` : ''}<span>${esc(project.client || 'CLIENTE')}</span></div>
    <div class="project-card-copy"><p class="eyebrow">${esc(project.category || 'PROYECTO')}</p><h3>${esc(project.title)}</h3><p>${esc(project.subtitle || project.type || '')}</p><span>Ver case study ↗</span></div>
  </a>`;
}
function tesoroPage(project) {
  const a = project.assets;
  const hero = projectAsset(project, a.hero);
  const storyArt = projectAsset(project, a.story);
  const lucasJenny = projectAsset(project, a.lucasJenny);
  const jenny = projectAsset(project, a.jenny);
  const lucas = projectAsset(project, a.lucas);
  const pages = projectAsset(project, a.pages);
  const logo = projectAsset(project, a.logo);
  const launch = projectAsset(project, a.launch);
  const booth = projectAsset(project, a.booth);
  return `<article class="case-study">
    <section class="case-hero">
      <div class="case-hero-copy">
        <a class="detail-back case-back" href="/projects" data-route>← Proyectos</a>
        <p class="eyebrow">Banreservas × Alpha Eve</p>
        <h1>UN TESORO<br>PARA SIEMPRE<span class="red">.</span></h1>
        <p class="case-hero-lede">${esc(project.subtitle)}</p>
      </div>
      <figure class="case-hero-art"><img src="${esc(hero)}" alt="Lucas mira el mar y a Jenny la Ballenita"></figure>
    </section>

    <section class="case-section case-story">
      <div class="case-copy">
        <p class="eyebrow">01 — THE STORY</p>
        <h2>LA HISTORIA<span class="red">.</span></h2>
        <p>Un Tesoro para Siempre es un cuento infantil desarrollado para Banreservas, creado alrededor de Jenny la Ballenita, mascota de la institución.</p>
        <p>La historia sigue a Lucas, un niño que durante una excursión a la Bahía de Samaná conoce a Jenny, quien lo guía en una aventura donde descubre conceptos básicos sobre el manejo del dinero, el ahorro y la importancia de trabajar por sus metas.</p>
      </div>
      <figure class="case-media"><img src="${esc(storyArt)}" alt="Ilustraciones del cuento con Lucas y Jenny" loading="lazy"></figure>
    </section>

    <section class="case-section case-role">
      <div class="case-copy case-copy-wide">
        <p class="eyebrow">02 — OUR ROLE</p>
        <h2>NUESTRO ROL<span class="red">.</span></h2>
        <p>Desde Alpha Eve participamos en la creación visual del proyecto, llevando la historia a un universo colorido y atractivo para el público infantil a través de la ilustración y el desarrollo visual de los personajes y escenarios.</p>
      </div>
      <div class="case-role-grid">
        <figure><img src="${esc(lucas)}" alt="Lucas" loading="lazy"><figcaption>Lucas</figcaption></figure>
        <figure><img src="${esc(jenny)}" alt="Jenny la Ballenita" loading="lazy"><figcaption>Jenny la Ballenita</figcaption></figure>
      </div>
    </section>

    <section class="case-section case-details">
      <div>
        <p class="eyebrow">03 — PROJECT DETAILS</p>
        <h2>DETALLES<span class="red">.</span></h2>
        <dl class="case-meta">
          <div><dt>Client</dt><dd>${esc(project.client)}</dd></div>
          <div><dt>Project</dt><dd>${esc(project.title)}</dd></div>
          <div><dt>Type</dt><dd>${esc(project.type)}</dd></div>
          <div><dt>Story</dt><dd>${esc(project.storyBy)}</dd></div>
          <div><dt>Illustration</dt><dd>${esc(project.illustrationBy)}</dd></div>
          <div><dt>Themes</dt><dd>${esc(project.themes.join(' · '))}</dd></div>
        </dl>
      </div>
      <figure class="case-logo-mark"><img src="${esc(logo)}" alt="Logo editorial Un Tesoro para Siempre" loading="lazy"></figure>
    </section>

    <section class="case-section case-process">
      <div class="case-copy case-copy-wide">
        <p class="eyebrow">04 — FROM SKETCH TO STORY</p>
        <h2>DE LOS PERSONAJES<br>A LAS PÁGINAS<span class="red">.</span></h2>
        <p>El desarrollo visual pasó de los personajes principales a las páginas interiores del cuento.</p>
      </div>
      <div class="case-process-row case-process-pair">
        <figure><span>01 · Characters</span><img src="${esc(lucasJenny)}" alt="Lucas y Jenny juntos" loading="lazy"><figcaption>Personajes</figcaption></figure>
        <figure class="case-process-final"><span>02 · Pages</span><img src="${esc(pages)}" alt="Páginas interiores del cuento" loading="lazy"><figcaption>Páginas interiores</figcaption></figure>
      </div>
    </section>

    <section class="case-section case-purpose">
      <figure class="case-media case-media-photo"><img src="${esc(launch)}" alt="Lanzamiento del cuento Un Tesoro para Siempre" loading="lazy"></figure>
      <div class="case-copy">
        <p class="eyebrow">05 — A STORY WITH PURPOSE</p>
        <h2>UNA HISTORIA<br>CON PROPÓSITO<span class="red">.</span></h2>
        <p>El proyecto buscaba acercar conceptos de educación financiera a los niños de una manera sencilla y entretenida, utilizando la narrativa y la ilustración como herramientas educativas.</p>
      </div>
    </section>

    <section class="case-section case-gallery">
      <div class="case-copy case-copy-wide">
        <p class="eyebrow">06 — PROJECT GALLERY</p>
        <h2>GALERÍA<span class="red">.</span></h2>
      </div>
      <div class="case-gallery-grid case-gallery-single">
        <figure><img src="${esc(booth)}" alt="Montaje del proyecto en evento" loading="lazy"><figcaption>Montaje</figcaption></figure>
      </div>
    </section>

    <section class="case-close">
      <p class="eyebrow">BANRESERVAS × ALPHA EVE</p>
      <h2>STORIES WITH<br>PURPOSE<span class="red">.</span></h2>
      <p>Ilustración, narrativa y diseño para crear historias que conectan.</p>
      <a class="button button-light" href="/projects" data-route>View more projects <span>↗</span></a>
    </section>
  </article>`;
}
function clientStrip() {
  return `<section class="client-strip" aria-label="Clientes"><p class="client-strip-label">Clientes</p><div class="client-marquee" data-client-marquee><div class="client-track"></div></div></section>`;
}
function clientLogoItem(item, decorative) {
  if (item.empty) return '<span class="client-logo client-logo-empty" aria-hidden="true"><span>LOGO</span></span>';
  const name = item.name || String(item.file).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  return `<span class="client-logo"><img src="/clientes/${encodeURIComponent(item.file)}" alt="${decorative ? '' : esc(name)}"></span>`;
}
async function mountClientLogos() {
  const rows = [...document.querySelectorAll('[data-client-marquee]')];
  if (!rows.length) return;
  let logos = [];
  try {
    const response = await fetch('/clientes/logos.json', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) logos = data.filter(item => item && typeof item.file === 'string' && item.file && !/[\\/]/.test(item.file) && !item.file.includes('..'));
    }
  } catch { /* The row stays ready for logos. */ }
  const source = logos.length ? logos : Array.from({ length: 8 }, () => ({ empty: true }));
  let sequence = [];
  while (sequence.length < 8) sequence = sequence.concat(source);
  const markup = decorative => sequence.map(item => clientLogoItem(item, decorative)).join('');
  const html = markup(false) + markup(true);
  rows.forEach(row => {
    const track = row.querySelector('.client-track');
    if (track) track.innerHTML = html;
  });
}
function contactPage() {
  return `<section class="directory-page contact-page">
    <div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">CONSULTA DE PROYECTO</p><h1>EMPIEZA UN<br>PROYECTO<span class="red">.</span></h1><p>Cuéntanos tu proyecto y cómo Alpha Eve puede ayudar.</p></div>
    <div class="contact-page-layout">
      <aside class="studio-contact">
        <p class="eyebrow">EL ESTUDIO</p>
        <address>Calle Alberto Peguero #60<br>Ens. Miraflores, R.D.</address>
        <a href="tel:+18096889334"><span>Teléfono</span>809-688-9334</a>
        <a href="https://wa.me/18097876166" target="_blank" rel="noopener"><span>WhatsApp</span>809-787-6166</a>
        <a href="mailto:alphaeverd@gmail.com"><span>Correo</span>alphaeverd@gmail.com</a>
        <a href="https://www.alphaeve.net" target="_blank" rel="noopener"><span>Web</span>www.alphaeve.net</a>
        <a class="studio-map" href="https://maps.app.goo.gl/N6iHSij4fonyNNhC8" target="_blank" rel="noopener"><span>Oficina</span>Ver en el mapa <b>↗</b></a>
      </aside>
      <div class="contact-page-form">
        <form id="project-inquiry" class="inquiry-form" method="post" action="/api/contact" novalidate>
          <label class="inquiry-trap" aria-hidden="true">Deja este campo vacío<input type="text" name="confirm_url" tabindex="-1" autocomplete="off"></label>
          <label>Nombre *<input name="name" type="text" required maxlength="120" autocomplete="name"></label>
          <label>Correo *<input name="email" type="email" required maxlength="200" autocomplete="email"></label>
          <label class="inquiry-wide">Empresa / organización<input name="company" type="text" maxlength="160" autocomplete="organization"></label>
          <label class="inquiry-wide">Servicio *
            <select name="service" required>
              <option value="">Selecciona un servicio</option>
              <option>Ilustración</option>
              <option>Cómics y manga</option>
              <option>Diseño de personajes</option>
              <option>Arte conceptual</option>
              <option>Diseño gráfico</option>
              <option>Desarrollo visual</option>
              <option>Arte para videojuegos</option>
              <option>Otro</option>
            </select>
          </label>
          <label class="inquiry-wide">Descripción del proyecto *<textarea name="description" required minlength="10" maxlength="4000" rows="6"></textarea></label>
          <label>Presupuesto<input name="budget" type="text" maxlength="120"></label>
          <label>Plazo<input name="timeline" type="text" maxlength="120"></label>
          <label class="inquiry-wide">Sitio web / referencia<input name="reference" type="url" maxlength="300" placeholder="https://"></label>
          <p class="inquiry-error" role="alert" hidden></p>
          <button class="button button-dark" type="submit">Enviar consulta <span>↗</span></button>
        </form>
        <div class="inquiry-thanks" hidden>
          <p class="eyebrow">CONSULTA DE PROYECTO</p>
          <h2>GRACIAS<span class="red">.</span></h2>
          <p>Recibimos tu consulta de proyecto.<br>Te responderemos pronto.</p>
        </div>
      </div>
    </div>
  </section>`;
}
function historyPage() {
  return `<section class="history-page"><a class="detail-back" href="/#anniversary" data-route>← 20 años</a><p class="eyebrow">2007 — 2027 · REPÚBLICA DOMINICANA</p><h1>NUESTRA<br>HISTORIA<span class="red">.</span></h1><div class="history-timeline" id="history-list"></div></section>`;
}
function parseHistory(text) {
  const moments = [];
  let current = null;
  const blank = () => ({ fecha: '', titulo: '', texto: '', imagen: '', pie: '', logo: '', fundador: '', integrantes: '' });
  const flush = () => {
    if (current && (current.fecha || current.titulo || current.texto || current.imagen || current.logo)) {
      current.texto = current.texto.replace(/\n{3,}/g, '\n\n').trim();
      moments.push(current);
    }
    current = null;
  };
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) {
      if (!line && current?.texto) current.texto += '\n\n';
      continue;
    }
    const match = line.match(/^(Fecha|Título|Titulo|Texto|Imagen|Pie|Pie de foto|Leyenda|Logo|Fundador|Integrantes|Primeros integrantes)\s*:\s*(.*)$/i);
    if (!match) {
      if (current) current.texto = current.texto ? `${current.texto}${/\n$/.test(current.texto) ? '' : '\n'}${line}` : line;
      continue;
    }
    const key = match[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const value = match[2].trim();
    if (key === 'fecha') flush();
    if (!current) current = blank();
    if (key === 'fecha') current.fecha = value;
    else if (key === 'titulo') current.titulo = value;
    else if (key === 'texto') current.texto = value;
    else if (key === 'imagen') current.imagen = value;
    else if (key === 'pie' || key === 'pie de foto' || key === 'leyenda') current.pie = value;
    else if (key === 'logo') current.logo = value;
    else if (key === 'fundador') current.fundador = value;
    else if (key === 'integrantes' || key === 'primeros integrantes') current.integrantes = value;
  }
  flush();
  return moments;
}
function historyImage(name) {
  if (!name || /[\\/]/.test(name) || name.includes('..')) return '';
  return `/historia/imagenes/${encodeURIComponent(name)}`;
}
function historyParagraphs(text) {
  const parts = String(text || '').split(/\n{2,}/).map(part => part.trim()).filter(Boolean);
  if (!parts.length) return '<p>El texto de este momento se agregará aquí.</p>';
  return parts.map(part => `<p>${esc(part)}</p>`).join('');
}
function historyCredits(moment) {
  const rows = [];
  if (moment.fundador) rows.push(`<div><dt>Fundador</dt><dd>${esc(moment.fundador)}</dd></div>`);
  if (moment.integrantes) rows.push(`<div><dt>Primeros integrantes</dt><dd>${esc(moment.integrantes)}</dd></div>`);
  return rows.length ? `<dl class="history-credits">${rows.join('')}</dl>` : '';
}
function historyMoment(moment, index) {
  const src = historyImage(moment.imagen);
  const logo = historyImage(moment.logo);
  const chapter = String(index + 1).padStart(2, '0');
  const flip = index % 2 === 1 ? ' history-moment-flip' : '';
  const photo = src
    ? `<img src="${esc(src)}" alt="${esc(moment.pie || moment.titulo || moment.fecha || 'Momento de Alpha Eve')}" onerror="this.remove();this.parentElement.classList.add('missing')"><span>Imagen por agregar</span>`
    : '<span>Imagen por agregar</span>';
  const caption = moment.pie ? `<figcaption class="history-caption">${esc(moment.pie)}</figcaption>` : '';
  const mark = logo
    ? `<aside class="history-logo"><img src="${esc(logo)}" alt="Primera versión del logo de Alpha Eve"><span>Primer logo</span></aside>`
    : '';
  const figure = `<figure${src ? '' : ' class="missing"'}><div class="history-frame"><div class="history-photo">${photo}</div>${mark}</div>${caption}</figure>`;
  return `<article class="history-moment${flip}"><span class="history-node" aria-hidden="true"></span><div class="history-copy"><span class="history-chapter">${chapter}</span><time>${esc(moment.fecha || 'Fecha')}</time><h2>${esc(moment.titulo || 'Título por agregar')}</h2>${historyParagraphs(moment.texto)}${historyCredits(moment)}</div><div class="history-visual">${figure}</div></article>`;
}
async function mountHistory() {
  const list = document.querySelector('#history-list');
  if (!list) return;
  let moments = [];
  try {
    const response = await fetch('/historia/momentos.txt', { cache: 'no-store' });
    if (response.ok) moments = parseHistory(await response.text());
  } catch { /* The page explains how to fill the template. */ }
  list.innerHTML = moments.length
    ? moments.map(historyMoment).join('')
    : '<p class="history-note">Agrega cada momento en historia/momentos.txt y las fotos en historia/imagenes/.</p>';
}
function simpleDirectory(path) {
  if (path === '/services') return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">ESTUDIO CREATIVO · REPÚBLICA DOMINICANA</p><h1>NUESTROS<br>SERVICIOS<span class="red">.</span></h1><p>Servicios creativos para editoriales, marcas, estudios, creadores y aliados.</p></div><div class="services-grid">${services.map(([title, desc], index) => `<article class="service-item"><span class="service-no">0${index + 1}</span><h3>${esc(title)}</h3><p>${esc(desc)}</p></article>`).join('')}</div><a class="button button-dark" href="/#contact">Colabora con nosotros <span>↗</span></a></section>`;
  if (path === '/projects') {
    const clientWork = projects.filter(project => project.category === 'TRABAJOS PARA CLIENTES');
    return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">ALPHA EVE · TRABAJO DESTACADO</p><h1>PROYECTOS<span class="red">.</span></h1><p>Trabajos para clientes, colaboraciones, videojuegos, ilustración y diseño.</p></div><div class="project-categories">${['PROPIEDADES ORIGINALES', 'TRABAJOS PARA CLIENTES', 'COLABORACIONES', 'VIDEOJUEGOS Y JUEGOS DE MESA', 'ILUSTRACIÓN / DISEÑO'].map((category, index) => `<article><span>0${index + 1}</span><h2>${category}</h2><p>${category === 'TRABAJOS PARA CLIENTES' && clientWork.length ? 'Explora algunos de nuestros trabajos para clientes.' : 'Los detalles y el arte de los proyectos aparecerán aquí cuando estén disponibles.'}</p></article>`).join('')}</div>${clientWork.length ? `<section class="directory-subsection"><p class="eyebrow">TRABAJOS PARA CLIENTES</p><div class="project-feature-grid">${clientWork.map(projectCard).join('')}</div></section>` : ''}${clientStrip()}</section>`;
  }
  if (path === '/about') return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">ACERCA DE ALPHA EVE STUDIOS</p><h1>ESPÍRITU<br>INDEPENDIENTE. <span class="red">IMAGINACIÓN</span><br>SIN LÍMITES.</h1></div><div class="about-page-copy"><p>Alpha Eve Studios es un estudio creativo y editorial de República Dominicana. Desarrollamos propiedades intelectuales originales y ofrecemos servicios creativos de cómics, manga, ilustración, diseño y desarrollo visual.</p><p>Construimos mundos propios y colaboramos con aliados creativos de todo el mundo.</p><a class="button button-dark" href="/authors" data-route>Conoce a nuestros creadores <span>↗</span></a><a class="text-link" href="/historia" data-route>Nuestra historia · 2007—2027 ↗</a></div></section>`;
  if (path === '/packito') return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">UNA PLATAFORMA DE ALPHA EVE</p><h1>PACKITO<span class="red">.</span></h1><p>Cómics y manga digitales. Un espacio para cómics, creadores e historias originales.</p></div><div class="detail-empty">Todavía no se ha compartido el enlace externo de Packito.</div><a class="text-link" href="#contact">Para creadores ↗</a></section>`;
  if (path === '/shop') return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">ALPHA EVE STUDIOS</p><h1>LA TIENDA<span class="red">.</span></h1><p>Cómics impresos y digitales, láminas y productos.</p></div><div class="detail-empty">El enlace de la tienda oficial se agregará cuando esté disponible.</div></section>`;
  return null;
}

function renderRoute() {
  if (!app) return;
  const path = decodeURI(location.pathname).replace(/\/+$/, '') || '/';
  const contactBand = document.querySelector('.contact-section');
  if (contactBand) contactBand.hidden = path === '/contacto';
  if (path === '/' || path === '/index.html') {
    app.innerHTML = home;
    renderOriginals();
    document.title = 'Alpha Eve Studios — Historias. Arte. Mundos.';
    mountClientLogos();
    return;
  }
  if (path === '/authors') { app.innerHTML = authorDirectory(); document.title = 'Creadores — Alpha Eve Studios'; return; }
  if (path === '/comics') {
    activeComicLetter = '';
    activeComicGenres = [];
    activeCatalogType = '';
    comicSearchTerm = '';
    app.innerHTML = comicDirectory();
    renderComicCatalog();
    document.title = 'Catálogo — Alpha Eve Studios';
    return;
  }
  const slug = path.split('/').pop();
  if (path.startsWith('/authors/')) {
    const author = authors.find(entry => entry.slug === slug);
    app.innerHTML = author ? authorPage(author) : notFound();
    document.title = author ? `${author.name} — Alpha Eve Studios` : 'Creador no encontrado — Alpha Eve Studios';
    return;
  }
  if (path.startsWith('/comics/')) {
    const comic = comics.find(entry => entry.slug === slug);
    app.innerHTML = comic ? comicPage(comic) : notFound();
    document.title = comic ? `${comic.title} — Alpha Eve Studios` : 'Cómic no encontrado — Alpha Eve Studios';
    return;
  }
  if (path.startsWith('/ip/')) {
    const item = originalIp.find(entry => entry.slug === slug);
    app.innerHTML = item ? `<section class="detail-shell"><a class="detail-back" href="/comics" data-route>← Cómics y mundos originales</a><div class="detail-hero"><div class="detail-art"><strong>${esc(item.initials)}</strong></div><div class="detail-copy"><p class="eyebrow">ORIGINAL DE ALPHA EVE</p><h1>${esc(item.title)}<span class="red">.</span></h1><div class="detail-meta">PROPIEDAD ORIGINAL · DETALLES POR CONFIRMAR</div><p>La descripción y el arte del proyecto se agregarán cuando estén disponibles.</p></div></div></section>` : notFound();
    document.title = item ? `${item.title} — Alpha Eve Studios` : 'Página no encontrada — Alpha Eve Studios';
    return;
  }
  if (path.startsWith('/projects/')) {
    const project = projects.find(entry => entry.slug === slug);
    if (project?.slug === 'un-tesoro-para-siempre') {
      app.innerHTML = tesoroPage(project);
      document.title = `${project.title} — Alpha Eve Studios`;
      return;
    }
    app.innerHTML = notFound();
    document.title = 'Proyecto no encontrado — Alpha Eve Studios';
    return;
  }
  if (path === '/historia') {
    app.innerHTML = historyPage();
    document.title = 'Nuestra historia — Alpha Eve Studios';
    mountHistory();
    return;
  }
  if (path === '/contacto') {
    app.innerHTML = contactPage();
    document.title = 'Contacto — Alpha Eve Studios';
    return;
  }
  const directory = simpleDirectory(path);
  app.innerHTML = directory || notFound();
  document.title = directory ? `${path === '/services' ? 'Servicios' : path === '/projects' ? 'Proyectos' : path === '/about' ? 'Nosotros' : path === '/packito' ? 'Packito' : 'Tienda'} — Alpha Eve Studios` : 'Página no encontrada — Alpha Eve Studios';
  mountClientLogos();
}
function notFound() { return `<section class="directory-page"><a class="detail-back" href="/" data-route>← Alpha Eve Studios</a><h1>PÁGINA NO<br>ENCONTRADA<span class="red">.</span></h1><a class="button button-dark" href="/" data-route>Volver al inicio <span>↗</span></a></section>`; }

// The homepage is a preview; full creator and comic catalogs live on their own routes.
document.querySelector('#ip-grid')?.replaceChildren();
const homeIp = document.querySelector('#ip-grid');
if (homeIp) homeIp.innerHTML = '';
const homeCreators = document.querySelector('#creator-grid');
if (homeCreators) homeCreators.innerHTML = authors.slice(0, 6).map(authorCard).join('');
document.querySelector('.creator-section')?.insertAdjacentHTML('beforebegin', clientStrip());
const home = app?.innerHTML ?? '';

document.addEventListener('click', event => {
  const originalsStep = event.target.closest('[data-originals-step]');
  if (originalsStep) {
    originalsHold = Date.now() + 7000;
    stepOriginals(Number(originalsStep.getAttribute('data-originals-step')));
    return;
  }
  const letterButton = event.target.closest('[data-comic-letter]');
  if (letterButton) {
    activeComicLetter = letterButton.getAttribute('data-comic-letter') || '';
    renderComicCatalog();
    return;
  }
  const typeButton = event.target.closest('[data-catalog-type]');
  if (typeButton) {
    activeCatalogType = typeButton.getAttribute('data-catalog-type') || '';
    renderComicCatalog();
    return;
  }
  const link = event.target.closest('a[data-route]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.pushState({}, '', link.getAttribute('href'));
  closeMenu();
  renderRoute();
  window.scrollTo(0, 0);
});
document.addEventListener('input', event => {
  if (event.target.id !== 'comic-search') return;
  comicSearchTerm = event.target.value;
  renderComicCatalog();
});
document.addEventListener('change', event => {
  if (!event.target.matches('[data-comic-genre]')) return;
  activeComicGenres = [...document.querySelectorAll('[data-comic-genre]:checked')].map(input => input.value);
  renderComicCatalog();
});
window.addEventListener('popstate', renderRoute);
renderRoute();
startOriginals();
window.addEventListener('resize', () => positionOriginals(false));

document.addEventListener('submit', async event => {
  const projectInquiry = event.target.closest('#project-inquiry');
  if (!projectInquiry) return;
  event.preventDefault();
  const error = projectInquiry.querySelector('.inquiry-error');
  const button = projectInquiry.querySelector('button[type="submit"]');
  const showError = message => {
    error.hidden = false;
    error.textContent = message;
  };
  error.hidden = true;
  if (!projectInquiry.reportValidity()) return;
  const body = Object.fromEntries(new FormData(projectInquiry));
  button.disabled = true;
  const label = button.innerHTML;
  button.textContent = 'Enviando…';
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const isJson = (response.headers.get('content-type') || '').includes('application/json');
    const result = isJson ? await response.json().catch(() => ({})) : {};
    if (!response.ok || !result.ok) {
      showError(result.error || 'No pudimos enviar tu consulta. Inténtalo de nuevo.');
      button.disabled = false;
      button.innerHTML = label;
      return;
    }
    projectInquiry.hidden = true;
    projectInquiry.parentElement.querySelector('.inquiry-thanks').hidden = false;
  } catch {
    showError('No pudimos enviar tu consulta. Inténtalo de nuevo.');
    button.disabled = false;
    button.innerHTML = label;
  }
});
