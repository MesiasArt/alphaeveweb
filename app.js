const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function lightboxTrigger({ src, caption = '', alt = '' }) {
  if (!src) return '';
  return `<button type="button" class="lightbox-trigger" data-lightbox-item data-lightbox-src="${esc(src)}" data-lightbox-caption="${esc(caption)}" aria-label="Ver imagen ampliada">
    <img src="${esc(src)}" alt="${esc(alt || caption || 'Imagen de galería')}" loading="lazy">
    <span class="lightbox-zoom" aria-hidden="true">Ver</span>
  </button>`;
}

let lightboxItems = [];
let lightboxIndex = 0;

function ensureLightbox() {
  let root = document.getElementById('lightbox');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'lightbox';
  root.className = 'lightbox';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Visor de galería');
  root.innerHTML = `
    <button type="button" class="lightbox-backdrop" data-lightbox-close aria-label="Cerrar"></button>
    <div class="lightbox-panel">
      <button type="button" class="lightbox-close" data-lightbox-close aria-label="Cerrar">×</button>
      <button type="button" class="lightbox-nav lightbox-prev" data-lightbox-prev aria-label="Anterior">‹</button>
      <figure class="lightbox-frame">
        <img data-lightbox-image alt="">
        <figcaption data-lightbox-caption></figcaption>
      </figure>
      <button type="button" class="lightbox-nav lightbox-next" data-lightbox-next aria-label="Siguiente">›</button>
      <p class="lightbox-count" data-lightbox-count></p>
    </div>`;
  document.body.appendChild(root);
  return root;
}

function renderLightbox() {
  const root = ensureLightbox();
  const item = lightboxItems[lightboxIndex];
  if (!item) return;
  const img = root.querySelector('[data-lightbox-image]');
  const caption = root.querySelector('[data-lightbox-caption]');
  const count = root.querySelector('[data-lightbox-count]');
  const prev = root.querySelector('[data-lightbox-prev]');
  const next = root.querySelector('[data-lightbox-next]');
  img.src = item.src;
  img.alt = item.caption || 'Imagen ampliada';
  caption.textContent = item.caption || '';
  caption.hidden = !item.caption;
  count.textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
  const multi = lightboxItems.length > 1;
  prev.hidden = !multi;
  next.hidden = !multi;
  count.hidden = !multi;
}

function openLightbox(items, index = 0) {
  if (!items?.length) return;
  lightboxItems = items;
  lightboxIndex = Math.max(0, Math.min(index, items.length - 1));
  const root = ensureLightbox();
  root.hidden = false;
  document.body.classList.add('lightbox-open');
  renderLightbox();
}

function closeLightbox() {
  const root = document.getElementById('lightbox');
  if (!root || root.hidden) return;
  root.hidden = true;
  document.body.classList.remove('lightbox-open');
  lightboxItems = [];
  lightboxIndex = 0;
}

function stepLightbox(delta) {
  if (lightboxItems.length < 2) return;
  lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
  renderLightbox();
}

function collectLightboxItems(group) {
  return [...group.querySelectorAll('[data-lightbox-item]')].map(button => ({
    src: button.getAttribute('data-lightbox-src') || '',
    caption: button.getAttribute('data-lightbox-caption') || '',
  })).filter(item => item.src);
}

import { comics, authors, projects, originalIp, pageMetadata } from './seo-data.js';
let liveCmsContent = {};
function projectAsset(project, file) {
  if (!file) return '';
  if (/^(?:https?:)?\/\//i.test(file) || file.startsWith('/')) return file;
  if (!project?.assetDir) return '';
  return `${project.assetDir}/${encodeURIComponent(file)}`;
}
const services = [
  ['Ilustración', 'Arte de personajes, arte clave, portadas e ilustración promocional.'],
  ['Cómics y manga', 'Narrativa secuencial, producción de cómics y narración visual.'],
  ['Arte conceptual', 'Personajes, criaturas, entornos y objetos.'],
  ['Diseño', 'Identidad de marca, diseño gráfico, productos y piezas promocionales.'],
  ['Desarrollo visual', 'Personajes, creación de mundos, arte para videojuegos y desarrollo visual.'],
  ['Colaboración creativa', 'Proyectos editoriales, propiedades con licencia y alianzas creativas.'],
];

function authorPortrait(author) {
  if (author.image?.startsWith('/') || /^https?:\/\//i.test(author.image || '')) return author.image;
  return `/artistas/${encodeURIComponent(author.slug)}/perfil.jpg`;
}
function authorCard(author, options = {}) {
  const nick = author.role || author.name;
  const realName = author.name && author.name !== nick ? author.name : '';
  const credit = options.credit || '';
  return `<a class="creator-card" href="/authors/${author.slug}" data-route>
    <div class="creator-image"><img src="${authorPortrait(author)}" alt="Arte de ${esc(nick)}" loading="lazy"><span>VER PERFIL ↗</span></div>
    <div class="creator-name">${credit ? `<p class="creator-credit">${esc(credit)}</p>` : ''}<div class="creator-name-row"><h3>${esc(nick)}</h3>${realName ? `<span>${esc(realName)}</span>` : ''}</div></div>
    <p class="creator-descriptor">${esc(author.specialties.length ? author.specialties.join(' · ') : 'Portafolio creativo de Alpha Eve')}</p>
  </a>`;
}
function comicCard(comic, index = 0) {
  return `<a class="comic-card" href="/comics/${comic.slug}" data-route>
    <div class="comic-card-art"><span class="comic-edition">ORIGINAL DE ALPHA EVE · ${String(index + 1).padStart(2, '0')}</span>${comic.cover ? `<img src="${esc(comic.cover)}" alt="Portada de ${esc(comic.title)}" onload="this.parentElement.classList.add('has-cover')" onerror="this.remove()">` : ''}<strong>${esc(comic.initials)}</strong><span class="comic-art-note">PORTADA POR AGREGAR</span></div>
    <div class="comic-card-copy"><h3>${esc(comic.title)}</h3><p>${esc(comic.genres?.length ? comic.genres.join(' · ') : 'Géneros por agregar')} <span>·</span> ${esc(comicCatalogType(comic) || 'Tipo por confirmar')} <span>·</span> ${esc(comic.format === 'One-shot' ? 'Tomo único (oneshot)' : comic.format === 'Series' ? `Serie · ${comic.availableChapters || 0}${comic.chapterCount && comic.chapterCount !== comic.availableChapters ? ` de ${comic.chapterCount}` : ''} capítulos` : 'Formato por confirmar')}</p><span class="comic-card-arrow">↗</span></div>
  </a>`;
}
function ipCard(item) {
  const href = `/comics/${item.slug}`;
  return `<a class="ip-card" href="${href}" data-route><div class="ip-art"><small>ALPHA EVE ORIGINAL</small><span class="ip-initial">${esc(item.initials)}</span></div><div class="ip-info"><h3>${esc(item.title)}</h3><span>↗</span></div></a>`;
}
function creatorsFor(comic) { return comic.creatorSlugs.map(slug => authors.find(author => author.slug === slug)).filter(Boolean); }
function comicsFor(author) { return author.comicSlugs.map(slug => comics.find(comic => comic.slug === slug)).filter(Boolean); }
function projectsFor(author) { return (author.projectSlugs || []).map(slug => projects.find(project => project.slug === slug)).filter(Boolean); }

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
const genreOptions = ['Acción', 'Kaiju', 'Crimen', 'Sobrenatural', 'Histórico', 'Romance', 'Misterio', 'Ecchi +18', 'Vampiros', 'Detective', 'Thriller', 'Drama', 'Gore +18', 'Fantasía', 'Shonen', 'Zombies', 'Artes Marciales', 'Suspenso', 'Slice of Life', 'Cyberpunk', 'Aventura', 'Shojo', 'Steampunk', 'Magia', 'Psicológico', 'Comedia', 'Noir', 'Horror', 'Seinen', 'Western', 'Isekai', 'Superhéroes', 'Deportivo', 'Mecha', 'Sci-Fi', 'Josei'];
const catalogTypes = ['Comics', 'Manga', 'Cuentos Infantiles', 'Novelas', 'Artbooks', 'Otros'];
function comicCatalogType(comic) {
  if (comic.catalogType) return comic.catalogType;
  return ({ 'Manga':'Manga', 'Novela gráfica':'Novelas', 'Novelas':'Novelas', 'Artbook':'Artbooks', 'Artbooks':'Artbooks', 'Cuentos Infantiles':'Cuentos Infantiles', 'Otro':'Otros', 'Otros':'Otros' }[comic.medium] || 'Comics');
}
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
      && (!activeCatalogType || comicCatalogType(comic) === activeCatalogType)
      && (!activeComicGenres.length || activeComicGenres.some(genre => comic.genres?.includes(genre)))
      && (!query || title.includes(query));
  });
  const selectedGenresAssigned = comics.some(comic => activeComicGenres.some(genre => comic.genres?.includes(genre)));
  const selectedTypeAssigned = comics.some(comic => comicCatalogType(comic) === activeCatalogType);
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
function authorBioHtml(author) {
  if (!author.bio) return '';
  return author.bio.split(/\n{2,}/).map(part => `<p>${esc(part.trim())}</p>`).join('');
}

function authorSocialsHtml(author) {
  const legacyHandle = (author.social || author.role || author.slug || '').replace(/\s+/g, '').replace(/^@/, '');
  const socialHref = (value, base) => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return `${base}/${encodeURIComponent(String(value).replace(/^@/, '').replace(/\s+/g, ''))}`;
  };
  const instagram = author.instagram || legacyHandle;
  const twitter = author.twitter || legacyHandle;
  const website = /^https?:\/\//i.test(author.website || '') ? author.website : (author.website ? `https://${author.website}` : '');
  if (!instagram && !twitter && !website) return '';
  const igIcon = '<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>';
  const xIcon = '<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h3.4l4.3 5.8L16.8 4H20l-6.1 7.1L20.4 20h-3.4l-4.7-6.3L7.2 20H4l6.5-7.6L4 4z"/></svg>';
  const links = [instagram ? `<a class="author-social" href="${esc(socialHref(instagram,'https://instagram.com'))}" target="_blank" rel="noopener noreferrer" aria-label="Instagram de ${esc(author.name)}">${igIcon}<span>Instagram</span></a>` : '', twitter ? `<a class="author-social" href="${esc(socialHref(twitter,'https://x.com'))}" target="_blank" rel="noopener noreferrer" aria-label="X de ${esc(author.name)}">${xIcon}<span>X</span></a>` : '', website ? `<a class="author-social" href="${esc(website)}" target="_blank" rel="noopener noreferrer">Sitio web ↗</a>` : ''].filter(Boolean).join('');
  return `<div class="author-socials"><p class="eyebrow">REDES</p><div class="author-social-links">${links}</div></div>`;
}

function authorPage(author) {
  const related = comicsFor(author);
  const relatedProjects = projectsFor(author);
  const bioHtml = authorBioHtml(author);
  const specialties = author.specialties?.length ? `<p class="author-specialties">${esc(author.specialties.join(' · '))}</p>` : '';
  const nick = author.role || author.name;
  const realName = author.name && author.name !== nick ? author.name : '';
  return `<section class="detail-shell author-profile">
    <a class="detail-back" href="/authors" data-route>← Todos los creadores</a>
    <div class="detail-hero author-hero"><div class="author-portrait"><img src="${authorPortrait(author)}" alt="${esc(nick)}" /></div>
      <div class="detail-copy"><p class="eyebrow">ALPHA EVE · PORTAFOLIO CREATIVO</p><h1>${esc(nick)}<span class="red">.</span></h1>${realName ? `<div class="detail-meta">${esc(realName)}</div>` : ''}${authorSocialsHtml(author)}<a class="button button-dark" href="#contact">Colabora con ${esc(nick)} <span>↗</span></a></div></div>
    <section class="detail-block"><p class="eyebrow">ACERCA DEL CREADOR</p><h2>Biografía y especialidades</h2>${bioHtml || specialties ? `${bioHtml}${specialties}` : '<div class="detail-empty">La biografía y las especialidades creativas aparecerán aquí.</div>'}</section>
    <section class="detail-block"><p class="eyebrow">PROYECTOS Y COLABORACIONES</p><h2>Proyectos destacados</h2>${relatedProjects.length ? `<div class="project-originals-grid author-works-grid">${relatedProjects.map((project, index) => projectCard(project, index)).join('')}</div>` : '<div class="detail-empty">Los proyectos aparecerán aquí cuando se confirmen.</div>'}</section>
    <section class="detail-block"><p class="eyebrow">CÓMICS</p><h2>Historias y series</h2>${related.length ? `<div class="project-originals-grid author-works-grid">${related.map((comic, index) => comicCard(comic, index)).join('')}</div>` : '<div class="detail-empty">Todavía no hay cómics vinculados a este perfil.</div>'}</section>
    <section class="detail-block"><p class="eyebrow">GALERÍA</p><h2>Arte y proceso</h2><div class="author-gallery" id="author-gallery" data-lightbox-group></div></section>
    <section class="detail-block"><p class="eyebrow">CONTACTO</p><h2>Colabora con ${esc(nick)}</h2><p>Para consultas profesionales, contacta a Alpha Eve Studios.</p><a class="button button-dark" href="#contact">Contactar a Alpha Eve <span>↗</span></a></section>
  </section>`;
}
async function mountAuthorGallery(author) {
  const gallery = document.querySelector('#author-gallery');
  if (!gallery || !author) return;
  const nick = author.role || author.name;
  let files = [];
  try {
    const response = await fetch(`/artistas/${encodeURIComponent(author.slug)}/galeria.json`, { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) files = data.filter(name => typeof name === 'string' && name && !/[\\/]/.test(name) && !name.includes('..'));
    }
  } catch { /* Empty gallery if the list cannot be loaded. */ }
  if (!files.length) {
    gallery.innerHTML = `<div class="detail-empty">Pon ilustraciones en artistas/${esc(author.slug)}/galeria/</div>`;
    return;
  }
  gallery.innerHTML = files.map(file => {
    const src = `/artistas/${encodeURIComponent(author.slug)}/galeria/${encodeURIComponent(file)}`;
    const label = file.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
    return `<figure class="gallery-tile">${lightboxTrigger({ src, caption: label, alt: `${nick} · ${label}` })}</figure>`;
  }).join('');
}
function workAuthorSlugs(comic) {
  return comic.workAuthorSlugs || (comic.creatorSlugs || []).filter(slug => String(comic.creatorCredits?.[slug] || '').split(/\s*·\s*/).some(role=>/^(autor(?:\/a)?|obra(?: completa)?|creador(?:\/a)?)$/i.test(role.trim())));
}
function chapterCreditsHtml(chapter, comic) {
  const authorSlugs = workAuthorSlugs(comic);
  const creatorEntries=(chapter.credits||[]).map(item=>({slug:item.creatorSlug,name:authors.find(author=>author.slug===item.creatorSlug)?.name,roles:item.roles||[]})).filter(item=>item.name);
  const authorsInChapter = authorSlugs.map(slug=>({slug,name:authors.find(author=>author.slug===slug)?.name,roles:['Autor de la obra']})).filter(item=>item.name);
  for (const item of creatorEntries) {
    const author = authorsInChapter.find(entry=>entry.slug===item.slug);
    if (author) author.roles.push(...item.roles.filter(role=>!author.roles.includes(role)));
  }
  const entries=[...authorsInChapter,...creatorEntries.filter(item=>!authorSlugs.includes(item.slug)),...(chapter.externalCredits||[]).map(item=>typeof item==='string'?{name:item,roles:[]}:item).filter(item=>item.name)];
  if(!entries.length)return '';
  return `<div class="chapter-public-credits"><strong>Autor de la obra y colaboradores</strong><ul>${entries.map(item=>`<li><span>${esc(item.name)}</span>${item.roles?.length?`<small>${esc(item.roles.join(' · '))}</small>`:''}</li>`).join('')}</ul></div>`;
}
function comicPage(comic) {
  const linkedAuthors = creatorsFor(comic);
  const workAuthors = new Set(workAuthorSlugs(comic));
  const linkedWorkAuthors = linkedAuthors.filter(author=>workAuthors.has(author.slug));
  const linkedCollaborators = linkedAuthors.filter(author=>!workAuthors.has(author.slug));
  const publicChapters = (comic.chapters || []).filter(chapter => !['draft','borrador','archived','archivado'].includes(String(chapter.status || 'published').toLowerCase()));
  const hasReadingContent = publicChapters.length > 0;
  const readingSection = hasReadingContent ? `<section class="detail-block" id="reading"><p class="eyebrow">LEE LA HISTORIA</p><h2>${comic.format === 'One-shot' ? 'Tomo único' : 'Capítulos'}</h2><div class="chapter-grid">${publicChapters.map(chapter => `<article class="chapter-card"><div class="chapter-art">${chapter.cover ? `<img src="${esc(chapter.cover)}" alt="${esc(comic.title)} — portada del ${esc(chapter.title)}" onerror="this.remove()">` : ''}<span>PORTADA DEL CAPÍTULO POR AGREGAR</span></div><div><b>CAPÍTULO ${String(chapter.number).padStart(2, '0')}</b><h3>${esc(chapter.title)}</h3>${chapter.synopsis ? `<p>${esc(chapter.synopsis)}</p>` : ''}${chapterCreditsHtml(chapter, comic)}${chapter.digitalUrl ? `<a href="${esc(chapter.digitalUrl)}">COMPRAR EDICIÓN DIGITAL ↗</a>` : ''}${chapter.physicalUrl ? `<a href="${esc(chapter.physicalUrl)}">COMPRAR EDICIÓN IMPRESA ↗</a>` : ''}</div></article>`).join('')}</div></section>` : '';
  const characters = (comic.characters || []).filter(character => character && (String(character.name || '').trim() || String(character.image || '').trim()));
  const charSection = characters.length ? `<section class="detail-block"><p class="eyebrow">PERSONAJES</p><h2>Conoce al elenco</h2><div class="character-grid">${characters.map(character => `<article class="character-card"><div class="character-art">${character.image ? `<img src="${esc(character.image)}" alt="${esc(character.name)}">` : ''}</div>${character.name ? `<h3>${esc(character.name)}</h3>` : ''}</article>`).join('')}</div></section>` : '';
  const comicGallery = (comic.gallery || []).filter(image => image && String(image.src || '').trim());
  const gallery = comicGallery.length ? `<section class="detail-block"><p class="eyebrow">ARTE Y PROCESO</p><h2>Galería</h2><div class="comic-gallery" data-lightbox-group>${comicGallery.map(image => `<figure class="gallery-tile">${lightboxTrigger({ src: image.src, caption: image.alt || comic.title, alt: image.alt || comic.title })}</figure>`).join('')}</div></section>` : '';
  const heroBanner = `/series/hero-banners/${comic.slug}.jpg`;
  const cover = `<div class="comic-key-art"><img src="${esc(heroBanner)}" alt="Banner de ${esc(comic.title)}" onload="this.parentElement.classList.add('has-cover')" onerror="if(!this.dataset.fallback){this.dataset.fallback='true';this.src='${esc(comic.cover)}'}else{this.remove()}"><small>ORIGINAL DE ALPHA EVE</small><strong>${esc(comic.initials)}</strong><span>ARTE CLAVE POR AGREGAR</span></div>`;
  const coverImages = [comic.cover, comic.backCover, ...(comic.variants || [])].filter(image => typeof image === 'string' && image.trim());
  const coverGallery = coverImages.length ? `<section class="detail-block"><p class="eyebrow">PORTADAS</p><h2>Galería de portadas</h2><div class="cover-gallery" data-lightbox-group>${comic.cover ? `<figure class="cover-image">${lightboxTrigger({ src: comic.cover, caption: 'Portada principal', alt: `Portada principal de ${comic.title}` })}<figcaption>PORTADA PRINCIPAL</figcaption></figure>` : ''}${comic.backCover ? `<figure class="cover-image">${lightboxTrigger({ src: comic.backCover, caption: 'Contraportada', alt: `Contraportada de ${comic.title}` })}<figcaption>CONTRAPORTADA</figcaption></figure>` : ''}${(comic.variants || []).filter(image => typeof image === 'string' && image.trim()).map(image => `<figure class="cover-image">${lightboxTrigger({ src: image, caption: 'Portada alternativa', alt: `Portada alternativa de ${comic.title}` })}<figcaption>PORTADA ALTERNATIVA</figcaption></figure>`).join('')}</div></section>` : '';
  const formatBadge = comic.format === 'One-shot' ? '<span class="series-badge oneshot-badge">TOMO ÚNICO · ONESHOT</span>' : comic.format === 'Series' ? `<span class="series-badge">SERIE · ${comic.availableChapters} CAPÍTULO${comic.availableChapters === 1 ? '' : 'S'}${comic.chapterCount !== comic.availableChapters ? ` · ${comic.availableChapters} DE ${comic.chapterCount}` : ''}</span>` : '<span class="series-badge">FORMATO POR CONFIRMAR</span>';
  const genreText = comic.genres?.length ? comic.genres.map(esc).join(' · ') : 'Géneros por agregar';
  return `<section class="detail-shell comic-detail">
    <a class="detail-back" href="/comics" data-route>← Todos los cómics</a>
    <div class="series-hero-banner">${cover}<div class="series-hero-shade"></div><div class="series-hero-copy"><p class="eyebrow">ORIGINAL DE ALPHA EVE · ${esc(comicCatalogType(comic) || comic.medium || 'CÓMIC / MANGA')}</p><h1>${esc(comic.title)}<span class="red">.</span></h1><div class="series-badges">${formatBadge}<span class="series-badge">GÉNERO · ${genreText}</span></div><a class="button button-light" href="#reading">Leer o comprar <span>↘</span></a></div></div>
    <section class="detail-block synopsis-block"><p class="eyebrow">LA HISTORIA</p><h2>Sinopsis</h2>${String(comic.synopsis || '').trim() ? `<p class="series-synopsis">${esc(comic.synopsis)}</p>` : ''}</section>
    ${readingSection}
    ${coverGallery}
    ${charSection}
    ${gallery}
    ${linkedWorkAuthors.length || linkedCollaborators.length || comic.externalCredits?.length ? `<section class="detail-block"><p class="eyebrow">CRÉDITOS DE LA OBRA</p><h2>Autoría y colaboradores</h2>${linkedWorkAuthors.length ? `<h3 class="credit-group-title">Autoría de la obra</h3><div class="creator-grid comic-creators">${linkedWorkAuthors.map(author => authorCard(author, { credit: 'Autor' })).join('')}</div>` : ''}${linkedCollaborators.length ? `<h3 class="credit-group-title">Colaboradores</h3><div class="creator-grid comic-creators">${linkedCollaborators.map(author => authorCard(author, { credit: comic.creatorCredits?.[author.slug] || 'Colaborador' })).join('')}</div>` : ''}${comic.externalCredits?.length ? `<div class="comic-credits"><strong>Colaboradores externos</strong>${comic.externalCredits.map(line => `<p>${esc(line)}</p>`).join('')}</div>` : ''}</section>` : ''}
    ${comics.some(entry => entry.slug !== comic.slug) ? `<section class="detail-block"><p class="eyebrow">DESCUBRE MÁS</p><h2>Más de Alpha Eve</h2><div class="comic-directory-grid">${comics.filter(entry => entry.slug !== comic.slug).map(comicCard).join('')}</div></section>` : ''}
  </section>`;
}
const projectCategories = [
  'PROPIEDADES ORIGINALES',
  'TRABAJOS PARA CLIENTES',
  'COLABORACIONES',
  'VIDEOJUEGOS Y JUEGOS DE MESA',
  'ILUSTRACIÓN / DISEÑO',
];
let activeProjectCategory = '';

function projectBelongsToCategory(project, category) {
  if (!project || !category) return false;
  if (Array.isArray(project.categories) && project.categories.includes(category)) return true;
  return project.category === category;
}

function projectsForCategory(category) {
  return projects.filter(project => projectBelongsToCategory(project, category));
}

function projectCategoryBlurb(category) {
  if (category === 'PROPIEDADES ORIGINALES') {
    const originalProjects = projectsForCategory(category).length;
    const parts = [];
    if (comics.length) parts.push(`${comics.length} cómic${comics.length === 1 ? '' : 's'}`);
    if (originalProjects) parts.push(`${originalProjects} proyecto${originalProjects === 1 ? '' : 's'}`);
    if (parts.length) return `Mundos propios · ${parts.join(' · ')}.`;
    return 'Cómics, juegos y mundos propios de Alpha Eve.';
  }
  const count = projectsForCategory(category).length;
  if (category === 'TRABAJOS PARA CLIENTES' && count) return 'Explora algunos de nuestros trabajos para clientes.';
  if (category === 'COLABORACIONES' && count) return 'Alianzas creativas y proyectos en conjunto.';
  if (count) return `${count} proyecto${count === 1 ? '' : 's'} en esta categoría.`;
  return 'Los detalles y el arte de los proyectos aparecerán aquí cuando estén disponibles.';
}

function projectResultsMarkup() {
  if (!activeProjectCategory) {
    return `<section class="directory-subsection" id="project-results"><p class="catalog-empty project-pick-hint">Elige una categoría para ver los proyectos.</p></section>`;
  }
  if (activeProjectCategory === 'PROPIEDADES ORIGINALES') {
    const originals = projectsForCategory('PROPIEDADES ORIGINALES');
    const comicsBlock = comics.length
      ? `<div class="project-originals-block"><p class="project-originals-label">Cómics</p><div class="project-originals-grid">${comics.map((comic, index) => comicCard(comic, index)).join('')}</div></div>`
      : '';
    const projectsBlock = originals.length
      ? `<div class="project-originals-block"><p class="project-originals-label">Juegos y propiedades</p><div class="project-originals-grid">${originals.map((project, index) => projectCard(project, index)).join('')}</div></div>`
      : '';
    const body = comicsBlock || projectsBlock
      ? `${projectsBlock}${comicsBlock}`
      : '<p class="catalog-empty">Todavía no hay propiedades originales en esta categoría.</p>';
    return `<section class="directory-subsection" id="project-results"><p class="eyebrow">PROPIEDADES ORIGINALES</p>${body}</section>`;
  }
  const filtered = projectsForCategory(activeProjectCategory);
  const body = filtered.length
    ? `<div class="project-originals-grid">${filtered.map((project, index) => projectCard(project, index)).join('')}</div>`
    : '<p class="catalog-empty">Todavía no hay proyectos en esta categoría.</p>';
  return `<section class="directory-subsection" id="project-results"><p class="eyebrow">${esc(activeProjectCategory)}</p>${body}</section>`;
}

function projectCard(project, index = 0) {
  const cover = projectAsset(project, project.assets?.hero);
  const initials = (project.title || 'AE').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const badge = projectIsOriginal(project) ? 'PROPIEDAD ORIGINAL' : (project.client || 'CLIENTE');
  return `<a class="comic-card" href="/projects/${esc(project.slug)}" data-route>
    <div class="comic-card-art"><span class="comic-edition">${esc(badge)} · ${String(index + 1).padStart(2, '0')}</span>${cover ? `<img src="${esc(cover)}" alt="${esc(project.title)}" loading="lazy" onload="this.parentElement.classList.add('has-cover')" onerror="this.remove()">` : ''}<strong>${esc(initials)}</strong><span class="comic-art-note">IMAGEN POR AGREGAR</span></div>
    <div class="comic-card-copy"><h3>${esc(project.title)}</h3><p>${esc(project.type || project.category || 'Proyecto')} <span>·</span> ${esc(project.subtitle || project.client || 'Case study')}</p><span class="comic-card-arrow">↗</span></div>
  </a>`;
}

function caseMetaRow(label, value) {
  if (!value) return '';
  return `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
}

function projectIsOriginal(project) {
  if (!project) return false;
  if (project.original === true) return true;
  if (Array.isArray(project.categories) && project.categories.includes('PROPIEDADES ORIGINALES')) return true;
  return project.category === 'PROPIEDADES ORIGINALES';
}

function clientCasePage(project) {
  const a = project.assets || {};
  const hero = projectAsset(project, a.hero);
  const storyArt = projectAsset(project, a.story);
  const logo = a.logo ? projectAsset(project, a.logo) : (project.clientLogo || '');
  const gallery = Array.isArray(a.gallery) ? a.gallery.filter(item => item?.file) : [];
  const storyHtml = (project.storyCopy || []).map(paragraph => `<p>${esc(paragraph)}</p>`).join('');
  const partner = project.partner || `${project.client} × Alpha Eve`;
  const titleHtml = project.headline || esc(project.title);
  const original = projectIsOriginal(project);
  return `<article class="case-study">
    <section class="case-hero${hero ? '' : ' case-hero-text'}">
      <div class="case-hero-copy">
        <a class="detail-back case-back" href="/projects" data-route>← Proyectos</a>
        <p class="eyebrow">${esc(partner)}</p>
        <h1>${titleHtml}<span class="red">.</span></h1>
        <p class="case-hero-lede">${esc(project.subtitle || '')}</p>
        ${project.externalUrl ? `<a class="button button-light" href="${esc(project.externalUrl)}" target="_blank" rel="noopener noreferrer">${esc(project.externalLabel || 'Visitar sitio')} <span>↗</span></a>` : ''}
      </div>
      ${hero ? `<figure class="case-hero-art"><img src="${esc(hero)}" alt="${esc(project.title)}"></figure>` : ''}
    </section>

    <section class="case-section case-story${storyArt ? '' : ' case-story-text'}">
      <div class="case-copy">
        <p class="eyebrow">01 — THE STORY</p>
        <h2>LA HISTORIA<span class="red">.</span></h2>
        ${storyHtml}
      </div>
      ${storyArt ? `<figure class="case-media"><img src="${esc(storyArt)}" alt="Arte de ${esc(project.title)}" loading="lazy"></figure>` : ''}
    </section>

    ${project.roleCopy ? `<section class="case-section case-role">
      <div class="case-copy case-copy-wide">
        <p class="eyebrow">02 — OUR ROLE</p>
        <h2>NUESTRO ROL<span class="red">.</span></h2>
        <p>${esc(project.roleCopy)}</p>
      </div>
    </section>` : ''}

    <section class="case-section case-details">
      <div class="case-details-head">
        <p class="eyebrow">03 — PROJECT DETAILS</p>
        <h2>DETALLES<span class="red">.</span></h2>
      </div>
      <div class="case-details-body${logo ? '' : ' case-details-body-solo'}">
        <dl class="case-meta">
          ${original ? caseMetaRow('Origen', 'Propiedad original') : caseMetaRow('Client', project.client)}
          ${caseMetaRow('Project', project.title)}
          ${caseMetaRow('Type', project.type)}
          ${caseMetaRow(project.storyLabel || 'Story', project.storyBy)}
          ${caseMetaRow(project.illustrationLabel || 'Illustration', project.illustrationBy)}
          ${caseMetaRow('Themes', Array.isArray(project.themes) ? project.themes.join(' · ') : '')}
        </dl>
        ${logo ? `<figure class="case-logo-mark"><img src="${esc(logo)}" alt="${esc(project.logoAlt || project.client || project.title)}" loading="lazy"></figure>` : ''}
      </div>
    </section>

    ${project.purposeCopy ? `<section class="case-section case-purpose case-purpose-text">
      <div class="case-copy case-copy-wide">
        <p class="eyebrow">${esc(project.purposeEyebrow || '04 — PURPOSE')}</p>
        <h2>${project.purposeTitle || 'CON PROPÓSITO'}<span class="red">.</span></h2>
        <p>${esc(project.purposeCopy)}</p>
      </div>
    </section>` : ''}

    ${gallery.length ? `<section class="case-section case-gallery">
      <div class="case-copy case-copy-wide">
        <p class="eyebrow">05 — PROJECT GALLERY</p>
        <h2>GALERÍA<span class="red">.</span></h2>
      </div>
      <div class="case-gallery-grid case-gallery-multi" data-lightbox-group>
        ${gallery.map(item => {
          const src = projectAsset(project, item.file);
          return `<figure class="case-shot">${lightboxTrigger({ src, caption: item.caption || project.title, alt: item.caption || project.title })}${item.caption ? `<figcaption>${esc(item.caption)}</figcaption>` : ''}</figure>`;
        }).join('')}
      </div>
    </section>` : ''}

    <section class="case-close">
      <p class="eyebrow">${esc(partner)}</p>
      <h2>${project.closeTitle || 'PROYECTOS CON<br>PROPÓSITO'}<span class="red">.</span></h2>
      <p>${esc(project.closeLine || 'Ilustración, narrativa y diseño para crear historias que conectan.')}</p>
      <div class="case-close-actions">
        ${project.externalUrl ? `<a class="button button-light" href="${esc(project.externalUrl)}" target="_blank" rel="noopener noreferrer">${esc(project.externalLabel || 'Visitar sitio')} <span>↗</span></a>` : ''}
        <a class="button button-light" href="/projects" data-route>Ver más proyectos <span>↗</span></a>
      </div>
    </section>
  </article>`;
}

function renderProjectCatalog() {
  document.querySelectorAll('[data-project-category]').forEach(button => {
    button.classList.toggle('active', (button.getAttribute('data-project-category') || '') === activeProjectCategory);
  });
  const results = document.querySelector('#project-results');
  if (results) results.outerHTML = projectResultsMarkup();
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
        <figure class="case-cutout"><img src="${esc(lucas)}" alt="Lucas" loading="lazy"><figcaption>Lucas</figcaption></figure>
        <figure class="case-cutout"><img src="${esc(jenny)}" alt="Jenny la Ballenita" loading="lazy"><figcaption>Jenny la Ballenita</figcaption></figure>
      </div>
    </section>

    <section class="case-section case-details">
      <div class="case-details-head">
        <p class="eyebrow">03 — PROJECT DETAILS</p>
        <h2>DETALLES<span class="red">.</span></h2>
      </div>
      <div class="case-details-body">
        <dl class="case-meta">
          <div><dt>Client</dt><dd>${esc(project.client)}</dd></div>
          <div><dt>Project</dt><dd>${esc(project.title)}</dd></div>
          <div><dt>Type</dt><dd>${esc(project.type)}</dd></div>
          <div><dt>Story</dt><dd>${esc(project.storyBy)}</dd></div>
          <div><dt>Illustration</dt><dd>${esc(project.illustrationBy)}</dd></div>
          <div><dt>Themes</dt><dd>${esc(project.themes.join(' · '))}</dd></div>
        </dl>
        <figure class="case-logo-mark"><img src="${esc(logo)}" alt="Logo editorial Un Tesoro para Siempre" loading="lazy"></figure>
      </div>
    </section>

    <section class="case-section case-process">
      <div class="case-copy case-copy-wide">
        <p class="eyebrow">04 — FROM SKETCH TO STORY</p>
        <h2>DE LOS PERSONAJES<br>A LAS PÁGINAS<span class="red">.</span></h2>
        <p>El desarrollo visual pasó de los personajes principales a las páginas interiores del cuento.</p>
      </div>
      <div class="case-process-row case-process-pair">
        <figure class="case-cutout"><span>01 · Characters</span><img src="${esc(lucasJenny)}" alt="Lucas y Jenny juntos" loading="lazy"><figcaption>Personajes</figcaption></figure>
        <figure class="case-process-final"><span>02 · Pages</span><img src="${esc(pages)}" alt="Páginas interiores del cuento" loading="lazy"><figcaption>Páginas interiores</figcaption></figure>
      </div>
    </section>

    <section class="case-section case-purpose">
      <figure class="case-photo-sm"><img src="${esc(launch)}" alt="Lanzamiento del cuento Un Tesoro para Siempre" loading="lazy"></figure>
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
      <div class="case-gallery-grid case-gallery-single" data-lightbox-group>
        <figure class="case-photo-sm case-photo-sm-center">${lightboxTrigger({ src: booth, caption: 'Montaje', alt: 'Montaje del proyecto en evento' })}<figcaption>Montaje</figcaption></figure>
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

let eventsIndex = 0;
let eventsTimer = 0;
let eventsHold = 0;
let eventsItems = [];

function stopEvents() {
  if (eventsTimer) {
    window.clearInterval(eventsTimer);
    eventsTimer = 0;
  }
}

function eventBannerSrc(file) {
  if (!file || typeof file !== 'string' || /[\\/]/.test(file) || file.includes('..')) return '';
  return `/eventos/banners/${encodeURIComponent(file)}`;
}

function parseEventStamp(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { allDay: true, day: trimmed.replace(/-/g, '') };
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  const iso = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return { allDay: false, stamp: iso };
}

function shiftAllDayEnd(dayYmd, inclusiveEndDay) {
  const raw = (inclusiveEndDay || dayYmd).replace(/-/g, '');
  const y = Number(raw.slice(0, 4));
  const m = Number(raw.slice(4, 6)) - 1;
  const d = Number(raw.slice(6, 8));
  const next = new Date(Date.UTC(y, m, d + 1));
  return next.toISOString().slice(0, 10).replace(/-/g, '');
}

function googleCalendarUrl(event) {
  const start = parseEventStamp(event.start);
  if (!start) return '';
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title || 'Evento Alpha Eve' });
  if (event.place) params.set('location', event.place);
  const details = [event.note, 'Alpha Eve Studios'].filter(Boolean).join('\n');
  if (details) params.set('details', details);
  if (start.allDay) {
    const endExclusive = shiftAllDayEnd(event.start, event.end);
    params.set('dates', `${start.day}/${endExclusive}`);
  } else {
    const end = parseEventStamp(event.end) || start;
    params.set('dates', `${start.stamp}/${end.allDay ? start.stamp : end.stamp}`);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function eventEndsAt(event) {
  const endRaw = String(event?.end || event?.start || '').trim();
  if (!endRaw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(endRaw)) {
    const [year, month, day] = endRaw.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
  }
  const date = new Date(endRaw);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function isEventUpcoming(event) {
  const ends = eventEndsAt(event);
  if (ends == null) return true;
  return Date.now() <= ends;
}

function eventCalendarControls(event, index) {
  const google = googleCalendarUrl(event);
  if (!google) return '';
  return `<a class="events-item-cal" href="${esc(google)}" target="_blank" rel="noopener noreferrer" data-add-calendar="${index}">Agregar a calendario</a>`;
}

function setActiveEvent(index, { hold = false } = {}) {
  const list = document.querySelector('#events-list');
  const stage = document.querySelector('#events-banner');
  if (!list || !stage || !eventsItems.length) return;
  eventsIndex = ((index % eventsItems.length) + eventsItems.length) % eventsItems.length;
  if (hold) eventsHold = Date.now() + 8000;
  list.querySelectorAll('.events-item').forEach((button, i) => {
    button.classList.toggle('is-active', i === eventsIndex);
    button.setAttribute('aria-current', i === eventsIndex ? 'true' : 'false');
  });
  stage.querySelectorAll('[data-event-banner]').forEach((node, i) => {
    node.classList.toggle('is-active', i === eventsIndex);
  });
}

function startEvents() {
  stopEvents();
  if (eventsItems.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  eventsTimer = window.setInterval(() => {
    if (Date.now() < eventsHold || document.hidden || !document.querySelector('#events-list')) return;
    setActiveEvent(eventsIndex + 1);
  }, 4000);
}

async function mountEvents() {
  const list = document.querySelector('#events-list');
  const stage = document.querySelector('#events-banner');
  if (!list || !stage) {
    stopEvents();
    return;
  }
  stopEvents();
  eventsItems = [];
  try {
    const response = await fetch('/eventos/eventos.json', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        eventsItems = data.filter(item => item && typeof item.title === 'string' && item.title.trim() && isEventUpcoming(item));
      }
    }
  } catch { /* Empty state below. */ }
  if (!eventsItems.length) {
    list.innerHTML = '<div class="detail-empty">Próximos eventos se anunciarán aquí.</div>';
    stage.innerHTML = '<div class="events-stage-empty">AGENDA EN PREPARACIÓN</div>';
    return;
  }
  list.innerHTML = eventsItems.map((event, index) => {
    const meta = [event.place, event.note].filter(Boolean).map(part => esc(part)).join(' · ');
    return `<div class="events-item${index === 0 ? ' is-active' : ''}" role="listitem" data-event-index="${index}" aria-current="${index === 0 ? 'true' : 'false'}"><button type="button" class="events-item-select" data-event-index="${index}"><span class="events-item-date">${esc(event.date || 'Pronto')}</span><span><span class="events-item-title">${esc(event.title)}</span>${meta ? `<p class="events-item-meta">${meta}</p>` : ''}</span></button>${eventCalendarControls(event, index)}</div>`;
  }).join('');
  stage.innerHTML = eventsItems.map((event, index) => {
    const src = eventBannerSrc(event.banner);
    if (!src) {
      return `<div class="events-stage-fallback${index === 0 ? ' is-active' : ''}" data-event-banner>${esc(event.title)}<br>${esc(event.place || '')}</div>`;
    }
    return `<img data-event-banner class="${index === 0 ? 'is-active' : ''}" src="${esc(src)}" alt="${esc(event.title)}"${index === 0 ? '' : ' loading="lazy"'}>`;
  }).join('');
  eventsIndex = 0;
  setActiveEvent(0);
  startEvents();
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
  return `<section class="history-page"><a class="detail-back" href="/#anniversary" data-route>← 20 años</a><p class="eyebrow">2006 — 2026 · REPÚBLICA DOMINICANA</p><h1>NUESTRA<br>HISTORIA<span class="red">.</span></h1><div class="history-timeline" id="history-list"></div></section>`;
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
    return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">ALPHA EVE · TRABAJO DESTACADO</p><h1>PROYECTOS<span class="red">.</span></h1><p>Trabajos para clientes, colaboraciones, videojuegos, ilustración y diseño. Elige una categoría para filtrar.</p></div><div class="project-categories">${projectCategories.map((category, index) => `<button type="button" data-project-category="${esc(category)}"${category === activeProjectCategory ? ' class="active"' : ''}><span>0${index + 1}</span><h2>${esc(category)}</h2><p>${esc(projectCategoryBlurb(category))}</p></button>`).join('')}</div>${projectResultsMarkup()}${clientStrip()}</section>`;
  }
  if (path === '/about') return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">ACERCA DE ALPHA EVE STUDIOS</p><h1>ESPÍRITU<br>INDEPENDIENTE. <span class="red">IMAGINACIÓN</span><br>SIN LÍMITES.</h1></div><div class="about-page-copy"><p>Alpha Eve Studios es un estudio creativo y editorial de República Dominicana. Desarrollamos propiedades intelectuales originales y ofrecemos servicios creativos de cómics, manga, ilustración, diseño y desarrollo visual.</p><p>Construimos mundos propios y colaboramos con aliados creativos de todo el mundo.</p><a class="button button-dark" href="/authors" data-route>Conoce a nuestros creadores <span>↗</span></a><a class="text-link" href="/historia" data-route>Nuestra historia · 2006—2026 ↗</a></div></section>`;
  if (path === '/packito') {
    const packitoComics = comics.filter(comic => comic.cover);
    for (let index = packitoComics.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [packitoComics[index], packitoComics[randomIndex]] = [packitoComics[randomIndex], packitoComics[index]];
    }
    const packitoGallery = packitoComics.slice(0, 4).map(comic => `<a class="packito-cover" href="/comics/${comic.slug}" data-route><img src="${esc(comic.cover)}" alt="Portada de ${esc(comic.title)}" loading="lazy"><span>${esc(comic.title)}</span></a>`).join('');
    return `<section class="directory-page packito-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">UNA PLATAFORMA DE ALPHA EVE</p><h1>PACK<span class="red">ITO.</span></h1></div><div class="packito-description"><p>Packito es una biblioteca digital de cómics y manga donde los lectores pueden descubrir, comprar y coleccionar historias independientes de todo el mundo. Trabajamos directamente con creadores para ofrecer un catálogo seleccionado de obras originales, ayudando a que nuevas voces encuentren su audiencia.</p><p>Los creadores conservan la propiedad de sus obras. Nuestro objetivo es proporcionar visibilidad, herramientas y oportunidades que permitan a autores independientes crecer, llegar a nuevos lectores y desarrollar sus proyectos a largo plazo.</p><p>Packito es más que una tienda digital. Estamos construyendo un espacio donde las historias puedan crecer a través de publicaciones digitales, ediciones físicas, campañas de crowdfunding, proyectos editoriales colaborativos y programas dedicados a descubrir y apoyar nuevos talentos.</p><a class="button button-dark" href="https://packito.net/" target="_blank" rel="noopener noreferrer">Visita Packito.net <span>↗</span></a></div><p class="packito-gallery-label">DISPONIBLES EN PACKITO.NET</p><div class="packito-gallery" aria-label="Cuatro portadas de cómics del catálogo">${packitoGallery}</div></section>`;
  }
  if (path === '/shop') return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Inicio</a><p class="eyebrow">ALPHA EVE STUDIOS</p><h1>LA TIENDA<span class="red">.</span></h1><p>Cómics impresos y digitales, láminas y productos.</p></div><div class="detail-empty">El enlace de la tienda oficial se agregará cuando esté disponible.</div></section>`;
  return null;
}

function renderRouteContent() {
  if (!app) return;
  const path = decodeURI(location.pathname).replace(/\/+$/, '') || '/';
  const contactBand = document.querySelector('.contact-section');
  if (contactBand) contactBand.hidden = path === '/contacto';
  if (path === '/' || path === '/index.html') {
    app.innerHTML = home;
    renderOriginals();
    document.title = 'Alpha Eve Studios — Historias. Arte. Mundos.';
    mountClientLogos();
    mountEvents();
    return;
  }
  stopEvents();
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
    document.title = author ? `${author.role || author.name} — Alpha Eve Studios` : 'Creador no encontrado — Alpha Eve Studios';
    if (author) mountAuthorGallery(author);
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
    if (project) {
      app.innerHTML = clientCasePage(project);
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
  if (path === '/projects') activeProjectCategory = '';
  const directory = simpleDirectory(path);
  app.innerHTML = directory || notFound();
  document.title = directory ? `${path === '/services' ? 'Servicios' : path === '/projects' ? 'Proyectos' : path === '/about' ? 'Nosotros' : path === '/packito' ? 'Packito' : 'Tienda'} — Alpha Eve Studios` : 'Página no encontrada — Alpha Eve Studios';
  mountClientLogos();
}
function setHeadMeta(selector, attribute, key, value) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}
function applySeoMetadata() {
  const metadata = pageMetadata(location.pathname, location.origin, liveCmsContent);
  const existingRobots = document.head.querySelector('meta[name="robots"]');
  if (!metadata) {
    if (existingRobots) existingRobots.remove();
    const noindex = document.createElement('meta');
    noindex.name = 'robots';
    noindex.content = 'noindex,follow';
    document.head.appendChild(noindex);
    return;
  }
  existingRobots?.remove();
  if (!metadata.indexable) setHeadMeta('meta[name="robots"]', 'name', 'robots', 'noindex,follow');
  document.title = metadata.title;
  setHeadMeta('meta[name="description"]', 'name', 'description', metadata.description);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = metadata.canonical;
  setHeadMeta('meta[property="og:title"]', 'property', 'og:title', metadata.title);
  setHeadMeta('meta[property="og:description"]', 'property', 'og:description', metadata.description);
  setHeadMeta('meta[property="og:url"]', 'property', 'og:url', metadata.canonical);
  setHeadMeta('meta[property="og:type"]', 'property', 'og:type', metadata.ogType);
  setHeadMeta('meta[property="og:image"]', 'property', 'og:image', metadata.image);
  setHeadMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setHeadMeta('meta[name="twitter:title"]', 'name', 'twitter:title', metadata.title);
  setHeadMeta('meta[name="twitter:description"]', 'name', 'twitter:description', metadata.description);
  setHeadMeta('meta[name="twitter:image"]', 'name', 'twitter:image', metadata.image);
  document.head.querySelector('script[data-page-schema]')?.remove();
  const schema = document.createElement('script');
  schema.type = 'application/ld+json';
  schema.dataset.pageSchema = 'true';
  schema.textContent = JSON.stringify(metadata.schema);
  document.head.appendChild(schema);
}
function renderRoute() {
  renderRouteContent();
  applySeoMetadata();
}
function notFound() { return `<section class="directory-page"><a class="detail-back" href="/" data-route>← Alpha Eve Studios</a><h1>PÁGINA NO<br>ENCONTRADA<span class="red">.</span></h1><a class="button button-dark" href="/" data-route>Volver al inicio <span>↗</span></a></section>`; }

// The homepage is a preview; full creator and comic catalogs live on their own routes.
document.querySelector('#ip-grid')?.replaceChildren();
const homeIp = document.querySelector('#ip-grid');
if (homeIp) homeIp.innerHTML = '';
const featuredCreatorSlugs = ['yonsoncb', 'nicodomo', 'xamurai_rd', 'nattibie', 'darkereve', 'zukupow'];
const homeCreators = document.querySelector('#creator-grid');
if (homeCreators) {
  homeCreators.innerHTML = featuredCreatorSlugs
    .map(slug => authors.find(author => author.slug === slug))
    .filter(Boolean)
    .map(authorCard)
    .join('');
}
document.querySelector('.creator-section')?.insertAdjacentHTML('beforebegin', clientStrip());
const home = app?.innerHTML ?? '';

document.addEventListener('click', event => {
  if (event.target.closest('[data-lightbox-close]')) {
    closeLightbox();
    return;
  }
  if (event.target.closest('[data-lightbox-prev]')) {
    stepLightbox(-1);
    return;
  }
  if (event.target.closest('[data-lightbox-next]')) {
    stepLightbox(1);
    return;
  }
  const lightboxItem = event.target.closest('[data-lightbox-item]');
  if (lightboxItem) {
    event.preventDefault();
    const group = lightboxItem.closest('[data-lightbox-group]') || lightboxItem.parentElement;
    const items = collectLightboxItems(group);
    const index = items.findIndex(item => item.src === lightboxItem.getAttribute('data-lightbox-src'));
    openLightbox(items, index < 0 ? 0 : index);
    return;
  }
  const originalsStep = event.target.closest('[data-originals-step]');
  if (originalsStep) {
    originalsHold = Date.now() + 7000;
    stepOriginals(Number(originalsStep.getAttribute('data-originals-step')));
    return;
  }
  const eventItem = event.target.closest('[data-event-index]');
  if (eventItem) {
    setActiveEvent(Number(eventItem.getAttribute('data-event-index')), { hold: true });
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
  const projectCategory = event.target.closest('[data-project-category]');
  if (projectCategory) {
    const next = projectCategory.getAttribute('data-project-category') || '';
    activeProjectCategory = activeProjectCategory === next ? '' : next;
    renderProjectCatalog();
    if (activeProjectCategory) {
      document.querySelector('#project-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }
  const link = event.target.closest('a[data-route]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  closeLightbox();
  history.pushState({}, '', link.getAttribute('href'));
  closeMenu();
  renderRoute();
  window.scrollTo(0, 0);
});
document.addEventListener('mouseover', event => {
  const eventItem = event.target.closest('.events-item[data-event-index]');
  if (!eventItem || !eventItem.closest('#events-list')) return;
  if (event.target.closest('[data-add-calendar]')) return;
  setActiveEvent(Number(eventItem.getAttribute('data-event-index')), { hold: true });
});
document.addEventListener('keydown', event => {
  const root = document.getElementById('lightbox');
  if (!root || root.hidden) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') stepLightbox(-1);
  if (event.key === 'ArrowRight') stepLightbox(1);
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
async function hydrateCmsContent() {
  try {
    const response = await fetch('/api/content', { cache: 'no-store' });
    if (!response.ok) return;
    const content = await response.json();
    liveCmsContent = content;
    for (const [key, target] of [['comics', comics], ['authors', authors], ['projects', projects]]) {
      if (Array.isArray(content[key])) target.splice(0, target.length, ...content[key]);
    }
    renderRoute();
    if ((location.pathname === '/' || location.pathname === '/index.html') && homeCreators) {
      homeCreators.innerHTML = featuredCreatorSlugs.map(slug => authors.find(author => author.slug === slug)).filter(Boolean).map(authorCard).join('');
      renderOriginals();
    }
  } catch { /* Keep the bundled content available when CMS is unreachable. */ }
}
hydrateCmsContent();
window.addEventListener('popstate', () => {
  closeLightbox();
  renderRoute();
});
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
