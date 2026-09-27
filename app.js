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
    title: `Chapter ${String(index + 1).padStart(2, '0')}`,
    status: comic.availableChapters < comic.chapterCount && index + 1 === comic.availableChapters ? 'Available · more chapters planned' : 'Available',
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
const projects = [];
const services = [
  ['Illustration', 'Character art, key art, covers and promotional illustration.'],
  ['Comics & manga', 'Sequential art, comic production and visual storytelling.'],
  ['Concept art', 'Characters, creatures, environments and props.'],
  ['Design', 'Branding, graphic design, merchandise and promotional design.'],
  ['Visual development', 'Characters, worldbuilding, game art and visual development.'],
  ['Creative collaboration', 'Editorial projects, licensed properties and creative partnerships.'],
];

function authorCard(author) {
  return `<a class="creator-card" href="/authors/${author.slug}" data-route>
    <div class="creator-image"><img src="/artistas/${encodeURIComponent(author.image)}" alt="${esc(author.name)}" loading="lazy"><span>VIEW PROFILE ↗</span></div>
    <div class="creator-name"><h3>${esc(author.name)}</h3><span>${esc(author.role || 'CREATOR')}</span></div>
    <p class="creator-descriptor">${esc(author.specialties.length ? author.specialties.join(' · ') : 'Alpha Eve creator portfolio')}</p>
  </a>`;
}
function comicCard(comic, index = 0) {
  return `<a class="comic-card" href="/comics/${comic.slug}" data-route>
    <div class="comic-card-art"><span class="comic-edition">ALPHA EVE ORIGINAL · ${String(index + 1).padStart(2, '0')}</span>${comic.cover ? `<img src="${esc(comic.cover)}" alt="${esc(comic.title)} cover" onload="this.parentElement.classList.add('has-cover')" onerror="this.remove()">` : ''}<strong>${esc(comic.initials)}</strong><span class="comic-art-note">COVER ART TO BE ADDED</span></div>
    <div class="comic-card-copy"><h3>${esc(comic.title)}</h3><p>${esc(comic.genres?.length ? comic.genres.join(' · ') : 'Genres to be added')} <span>·</span> ${esc(comic.format === 'One-shot' ? 'One-shot' : comic.format === 'Series' ? `Series · ${comic.availableChapters || 0}${comic.chapterCount && comic.chapterCount !== comic.availableChapters ? ` of ${comic.chapterCount}` : ''} chapters` : 'Format to be confirmed')}</p><span class="comic-card-arrow">↗</span></div>
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
  return `<section class="directory-page authors-directory"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Home</a><p class="eyebrow">ALPHA EVE STUDIOS · CREATIVE ROSTER</p><h1>AUTHORS<span class="red">.</span></h1><p>Meet the artists and creative minds behind Alpha Eve's worlds. Select a profile to view their portfolio.</p><div class="directory-count">${authors.length} CREATOR PROFILES</div></div><div class="creator-grid directory-creators">${authors.map(authorCard).join('')}</div></section>`;
}
function normalizedTitle(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}
const genreOptions = ['Acción', 'Misterio', 'Gore +18', 'Slice of Life', 'Psicológico', 'Isekai', 'Kaiju', 'Ecchi +18', 'Fantasía', 'Cyberpunk', 'Comedia', 'Superhéroes', 'Crimen', 'Vampiros', 'Shonen', 'Aventura', 'Noir', 'Deportivo', 'Sobrenatural', 'Detective', 'Zombies', 'Shojo', 'Horror', 'Mecha', 'Histórico', 'Thriller', 'Artes Marciales', 'Steampunk', 'Seinen', 'Sci-Fi', 'Romance', 'Drama', 'Suspenso', 'Magia', 'Western', 'Josei'];
function comicDirectory() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return `<section class="directory-page comics-directory"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Home</a><p class="eyebrow">ALPHA EVE STUDIOS · COMICS &amp; MANGA</p><h1>THE COMICS<br>CATALOG<span class="red">.</span></h1><p>Original stories and worlds published by Alpha Eve. Select a series to explore its creators, chapters and artwork.</p><div class="directory-count">${comics.length} SERIES</div></div><div class="catalog-filters"><label class="catalog-search"><span>SEARCH TITLES</span><input id="comic-search" type="search" placeholder="Search comics…" autocomplete="off"></label><fieldset class="catalog-genres"><legend>FILTER BY GENRE</legend><p class="genre-filter-note">Select one or more genres. Genre assignments for each series can be added later.</p><div class="genre-filter-grid">${genreOptions.map(genre => `<label><input type="checkbox" data-comic-genre value="${esc(genre)}"><span>${esc(genre)}</span></label>`).join('')}</div></fieldset></div><nav class="catalog-letters" aria-label="Filter comics by first letter"><button type="button" class="active" data-comic-letter="">ALL</button>${letters.map(letter => `<button type="button" data-comic-letter="${letter}" ${comics.some(comic => normalizedTitle(comic.title).startsWith(letter)) ? '' : 'disabled'}>${letter}</button>`).join('')}</nav><p id="catalog-results-line" class="catalog-results-line" aria-live="polite"></p><div class="comic-directory-grid" id="comic-directory-grid"></div><div class="directory-subsection"><p class="eyebrow">MORE ORIGINAL WORLDS</p><div class="ip-grid">${originalIp.map(ipCard).join('')}</div></div></section>`;
}
let activeComicLetter = '';
let activeComicGenres = [];
let comicSearchTerm = '';
function renderComicCatalog() {
  const grid = document.querySelector('#comic-directory-grid');
  if (!grid) return;
  const query = normalizedTitle(comicSearchTerm.trim());
  const filtered = comics.filter(comic => {
    const title = normalizedTitle(comic.title);
    return (!activeComicLetter || title.startsWith(activeComicLetter))
      && (!activeComicGenres.length || activeComicGenres.some(genre => comic.genres?.includes(genre)))
      && (!query || title.includes(query));
  });
  const selectedGenresAssigned = comics.some(comic => activeComicGenres.some(genre => comic.genres?.includes(genre)));
  grid.innerHTML = filtered.length
    ? filtered.map(comic => comicCard(comic, comics.indexOf(comic))).join('')
    : `<p class="catalog-empty">${activeComicGenres.length && !selectedGenresAssigned ? 'No series have been assigned to the selected genres yet.' : 'No comics match these filters.'}</p>`;
  const resultCount = document.querySelector('#catalog-results-line');
  if (resultCount) resultCount.textContent = `SHOWING ${filtered.length} OF ${comics.length} SERIES`;
  document.querySelectorAll('[data-comic-letter]').forEach(button => {
    const active = button.getAttribute('data-comic-letter') === activeComicLetter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
let featuredComicIndex = -1;
function renderFeaturedComic(direction = 'random') {
  const container = document.querySelector('#ip-grid');
  if (!container || !comics.length) return;
  if (typeof direction === 'number' && featuredComicIndex >= 0) {
    featuredComicIndex = (featuredComicIndex + direction + comics.length) % comics.length;
  } else if (featuredComicIndex < 0 || direction === 'random') {
    let nextIndex = Math.floor(Math.random() * comics.length);
    if (comics.length > 1 && nextIndex === featuredComicIndex) nextIndex = (nextIndex + 1) % comics.length;
    featuredComicIndex = nextIndex;
  }
  const comic = comics[featuredComicIndex];
  const format = comic.format === 'One-shot' ? 'ONE-SHOT' : comic.format === 'Series' ? `${comic.availableChapters} CHAPTER${comic.availableChapters === 1 ? '' : 'S'}` : 'FORMAT TO BE CONFIRMED';
  container.innerHTML = `<div class="featured-comic-carousel"><a class="featured-comic-link" href="/comics/${comic.slug}" data-route><div class="featured-comic-cover"><img src="${esc(comic.cover)}" alt="${esc(comic.title)} cover" onload="this.parentElement.classList.add('has-cover')" onerror="this.remove()"><strong>${esc(comic.initials)}</strong><span>ALPHA EVE ORIGINAL · ${String(featuredComicIndex + 1).padStart(2, '0')}</span></div><div class="featured-comic-copy"><p class="eyebrow">FEATURED FROM THE CATALOG</p><h3>${esc(comic.title)}</h3><span>${format} · EXPLORE COMIC ↗</span></div></a><div class="featured-comic-controls"><span>${String(featuredComicIndex + 1).padStart(2, '0')} / ${String(comics.length).padStart(2, '0')}</span><button type="button" data-featured-step="-1" aria-label="Previous featured comic">←</button><button type="button" data-featured-step="1" aria-label="Next featured comic">→</button></div></div>`;
}
function authorPage(author) {
  const related = comicsFor(author);
  return `<section class="detail-shell author-profile">
    <a class="detail-back" href="/authors" data-route>← All authors</a>
    <div class="detail-hero author-hero"><div class="author-portrait"><img src="/artistas/${encodeURIComponent(author.image)}" alt="${esc(author.name)}" /></div>
      <div class="detail-copy"><p class="eyebrow">ALPHA EVE · CREATOR PORTFOLIO</p><h1>${esc(author.name)}<span class="red">.</span></h1><div class="detail-meta">${esc(author.role || 'CREATOR PROFILE')}</div><p>${esc(author.bio || 'Artist portfolio and creative profile. Biography and specialties will be added as verified information becomes available.')}</p><a class="button button-dark" href="#contact">Work with ${esc(author.name)} <span>↗</span></a></div></div>
    <section class="detail-block"><p class="eyebrow">ABOUT</p><h2>Biography &amp; specialties</h2>${author.bio || author.specialties.length ? `<p>${esc(author.bio || author.specialties.join(' · '))}</p>` : '<div class="detail-empty">Biography and creative specialties will be added here.</div>'}</section>
    <section class="detail-block"><p class="eyebrow">SELECTED WORK</p><h2>Portfolio</h2><div class="portfolio-feature"><img src="/artistas/${encodeURIComponent(author.image)}" alt="Artwork by ${esc(author.name)}" loading="lazy"><div><span>ALPHA EVE CREATOR</span><h3>${esc(author.name)}</h3><p>Portfolio artwork will be added as approved work is available.</p></div></div></section>
    <section class="detail-block"><p class="eyebrow">COMICS</p><h2>Stories &amp; series</h2>${related.length ? `<div class="comic-directory-grid">${related.map(comicCard).join('')}</div>` : '<div class="detail-empty">No comic credits are linked to this profile yet.</div>'}</section>
    <section class="detail-block"><p class="eyebrow">PROJECTS &amp; COLLABORATIONS</p><h2>Selected projects</h2><div class="detail-empty">Project credits will appear here when confirmed.</div></section>
    <section class="detail-block"><p class="eyebrow">GALLERY</p><h2>Artwork &amp; process</h2><div class="author-gallery"><img src="/artistas/${encodeURIComponent(author.image)}" alt="${esc(author.name)} profile artwork" loading="lazy"><div class="detail-empty">Additional illustrations, sketches and covers will be added here.</div></div></section>
    <section class="detail-block"><p class="eyebrow">CONTACT</p><h2>Work with ${esc(author.name)}</h2><p>For professional inquiries, contact Alpha Eve Studios.</p><a class="button button-dark" href="#contact">Contact Alpha Eve <span>↗</span></a></section>
  </section>`;
}
function comicPage(comic) {
  const linkedAuthors = creatorsFor(comic);
  const chapterSection = comic.chapters.length ? `<div class="chapter-grid">${comic.chapters.map(chapter => `<article class="chapter-card"><div class="chapter-art"><img src="${esc(chapter.cover)}" alt="${esc(comic.title)} — ${esc(chapter.title)} cover" onerror="this.remove()"><span>CHAPTER COVER TO BE ADDED</span></div><div><b>CHAPTER ${String(chapter.number).padStart(2, '0')}</b><h3>${esc(chapter.title)}</h3><p>${esc(chapter.status || 'Details to be confirmed')}</p>${chapter.digitalUrl ? `<a href="${esc(chapter.digitalUrl)}">BUY DIGITAL ↗</a>` : ''}${chapter.physicalUrl ? `<a href="${esc(chapter.physicalUrl)}">BUY PHYSICAL ↗</a>` : '<span class="purchase-unavailable">Purchase link to be added</span>'}</div></article>`).join('')}</div>` : comic.format === 'One-shot' ? '<div class="detail-empty">This one-shot is presented as a single work. Reading and purchase links will be added when available.</div>' : '<div class="detail-empty">Chapter information has not been added yet.</div>';
  const charSection = comic.characters.length ? `<div class="character-grid">${comic.characters.map(character => `<article class="character-card"><div class="character-art">${character.image ? `<img src="${esc(character.image)}" alt="${esc(character.name)}">` : 'ARTWORK TO BE ADDED'}</div><h3>${esc(character.name)}</h3></article>`).join('')}</div>` : '<div class="detail-empty">Character artwork and names will be added here.</div>';
  const gallery = comic.gallery.length ? `<div class="comic-gallery">${comic.gallery.map(image => `<img src="${esc(image.src)}" alt="${esc(image.alt || comic.title)}" loading="lazy">`).join('')}</div>` : '<div class="detail-empty">Promotional art, sketches and interior pages will be added here.</div>';
  const cover = `<div class="comic-key-art"><img src="${esc(comic.cover)}" alt="${esc(comic.title)} cover" onload="this.parentElement.classList.add('has-cover')" onerror="this.remove()"><small>ALPHA EVE ORIGINAL</small><strong>${esc(comic.initials)}</strong><span>KEY ART TO BE ADDED</span></div>`;
  const coverGallery = `<figure class="cover-image"><img src="${esc(comic.cover)}" alt="${esc(comic.title)} main cover" onerror="this.remove();this.parentElement.classList.add('missing')"><figcaption>MAIN COVER</figcaption></figure>`;
  const formatBadge = comic.format === 'One-shot' ? '<span class="series-badge oneshot-badge">ONE-SHOT</span>' : comic.format === 'Series' ? `<span class="series-badge">SERIES · ${comic.availableChapters} CHAPTER${comic.availableChapters === 1 ? '' : 'S'}${comic.chapterCount !== comic.availableChapters ? ` · ${comic.availableChapters} OF ${comic.chapterCount}` : ''}</span>` : '<span class="series-badge">FORMAT TO BE CONFIRMED</span>';
  const genreText = comic.genres?.length ? comic.genres.map(esc).join(' · ') : 'Genres to be added';
  return `<section class="detail-shell comic-detail">
    <a class="detail-back" href="/comics" data-route>← All comics</a>
    <div class="series-hero-banner">${cover}<div class="series-hero-shade"></div><div class="series-hero-copy"><p class="eyebrow">ALPHA EVE ORIGINAL · COMIC / MANGA</p><h1>${esc(comic.title)}<span class="red">.</span></h1><div class="series-badges">${formatBadge}<span class="series-badge">GENRE · ${genreText}</span></div><p class="series-hero-synopsis">${esc(comic.synopsis || 'Story synopsis coming soon.')}</p><a class="button button-light" href="#chapters">Read / buy <span>↘</span></a></div></div>
    <section class="detail-block synopsis-block"><p class="eyebrow">THE STORY</p><h2>Synopsis</h2><p class="series-synopsis">${esc(comic.synopsis || 'The synopsis for this story will be added here.')}</p></section>
    <section class="detail-block" id="chapters"><p class="eyebrow">READ THE SERIES</p><h2>Chapters</h2>${chapterSection}</section>
    <section class="detail-block"><p class="eyebrow">COVERS</p><h2>Cover gallery</h2><div class="cover-gallery">${coverGallery}${comic.variants?.length ? comic.variants.map(image => `<figure class="cover-image"><img src="${esc(image)}" alt="${esc(comic.title)} variant cover"><figcaption>VARIANT COVER</figcaption></figure>`).join('') : '<div class="detail-empty">Variant and special covers will appear here when available.</div>'}</div></section>
    <section class="detail-block"><p class="eyebrow">CHARACTERS</p><h2>Meet the cast</h2>${charSection}</section>
    <section class="detail-block"><p class="eyebrow">ART &amp; PROCESS</p><h2>Gallery</h2>${gallery}</section>
    <section class="detail-block"><p class="eyebrow">CREATED BY</p><h2>The creators</h2>${linkedAuthors.length ? `<div class="creator-grid comic-creators">${linkedAuthors.map(authorCard).join('')}</div>` : '<div class="detail-empty">Creator credits will be linked here when confirmed.</div>'}</section>
    <section class="detail-block"><p class="eyebrow">DISCOVER MORE</p><h2>More from Alpha Eve</h2><div class="comic-directory-grid">${comics.filter(entry => entry.slug !== comic.slug).map(comicCard).join('')}</div></section>
  </section>`;
}
function simpleDirectory(path) {
  if (path === '/services') return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Home</a><p class="eyebrow">CREATIVE STUDIO · DOMINICAN REPUBLIC</p><h1>OUR<br>SERVICES<span class="red">.</span></h1><p>Creative services for publishers, brands, studios, creators and partners.</p></div><div class="services-grid">${services.map(([title, desc], index) => `<article class="service-item"><span class="service-no">0${index + 1}</span><h3>${esc(title)}</h3><p>${esc(desc)}</p></article>`).join('')}</div><a class="button button-dark" href="/#contact">Work with us <span>↗</span></a></section>`;
  if (path === '/projects') return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Home</a><p class="eyebrow">ALPHA EVE · SELECTED WORK</p><h1>PROJECTS<span class="red">.</span></h1><p>Client work, collaborations, games, illustration and design.</p></div><div class="project-categories">${['OUR IP', 'CLIENT WORK', 'COLLABORATIONS', 'GAMES', 'ILLUSTRATION / DESIGN'].map((category, index) => `<article><span>0${index + 1}</span><h2>${category}</h2><p>${projects.length ? 'Explore selected work.' : 'Project details and artwork will appear here when available.'}</p></article>`).join('')}</div></section>`;
  if (path === '/about') return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Home</a><p class="eyebrow">ABOUT ALPHA EVE STUDIOS</p><h1>INDEPENDENT<br>SPIRIT. <span class="red">BOUNDLESS</span><br>IMAGINATION.</h1></div><div class="about-page-copy"><p>Alpha Eve Studios is a creative studio and publisher from the Dominican Republic. We develop original intellectual property and provide creative services across comics, manga, illustration, design and visual development.</p><p>We build worlds of our own and collaborate with creative partners around the world.</p><a class="button button-dark" href="/authors" data-route>Meet our creators <span>↗</span></a><a class="text-link" href="/#anniversary">Our story · 2007—2027 ↗</a></div></section>`;
  if (path === '/packito') return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Home</a><p class="eyebrow">A PLATFORM BY ALPHA EVE</p><h1>PACKITO<span class="red">.</span></h1><p>Digital comics &amp; manga. A digital home for comics, creators and original stories.</p></div><div class="detail-empty">Packito's external URL has not been provided yet.</div><a class="text-link" href="#contact">For creators ↗</a></section>`;
  if (path === '/shop') return `<section class="directory-page"><div class="directory-heading"><a class="detail-back" href="/" data-route>← Home</a><p class="eyebrow">ALPHA EVE STUDIOS</p><h1>THE SHOP<span class="red">.</span></h1><p>Physical comics, digital editions, prints and merchandise.</p></div><div class="detail-empty">The official store destination will be added when available.</div></section>`;
  return null;
}

function renderRoute() {
  if (!app) return;
  const path = decodeURI(location.pathname).replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/index.html') {
    app.innerHTML = home;
    renderFeaturedComic();
    document.title = 'Alpha Eve Studios — Stories. Art. Worlds.';
    return;
  }
  if (path === '/authors') { app.innerHTML = authorDirectory(); document.title = 'Authors — Alpha Eve Studios'; return; }
  if (path === '/comics') {
    activeComicLetter = '';
    activeComicGenres = [];
    comicSearchTerm = '';
    app.innerHTML = comicDirectory();
    renderComicCatalog();
    document.title = 'Comics — Alpha Eve Studios';
    return;
  }
  const slug = path.split('/').pop();
  if (path.startsWith('/authors/')) {
    const author = authors.find(entry => entry.slug === slug);
    app.innerHTML = author ? authorPage(author) : notFound();
    document.title = author ? `${author.name} — Alpha Eve Studios` : 'Author not found — Alpha Eve Studios';
    return;
  }
  if (path.startsWith('/comics/')) {
    const comic = comics.find(entry => entry.slug === slug);
    app.innerHTML = comic ? comicPage(comic) : notFound();
    document.title = comic ? `${comic.title} — Alpha Eve Studios` : 'Comic not found — Alpha Eve Studios';
    return;
  }
  if (path.startsWith('/ip/')) {
    const item = originalIp.find(entry => entry.slug === slug);
    app.innerHTML = item ? `<section class="detail-shell"><a class="detail-back" href="/comics" data-route>← Comics &amp; original IP</a><div class="detail-hero"><div class="detail-art"><strong>${esc(item.initials)}</strong></div><div class="detail-copy"><p class="eyebrow">ALPHA EVE ORIGINAL</p><h1>${esc(item.title)}<span class="red">.</span></h1><div class="detail-meta">ORIGINAL IP · DETAILS TO BE CONFIRMED</div><p>Project description and artwork will be added when available.</p></div></div></section>` : notFound();
    document.title = item ? `${item.title} — Alpha Eve Studios` : 'Page not found — Alpha Eve Studios';
    return;
  }
  const directory = simpleDirectory(path);
  app.innerHTML = directory || notFound();
  document.title = directory ? `${path.slice(1).replace(/^./, letter => letter.toUpperCase())} — Alpha Eve Studios` : 'Page not found — Alpha Eve Studios';
}
function notFound() { return `<section class="directory-page"><a class="detail-back" href="/" data-route>← Alpha Eve Studios</a><h1>PAGE NOT<br>FOUND<span class="red">.</span></h1><a class="button button-dark" href="/" data-route>Return home <span>↗</span></a></section>`; }

// The homepage is a preview; full creator and comic catalogs live on their own routes.
document.querySelector('#ip-grid')?.replaceChildren();
const homeIp = document.querySelector('#ip-grid');
if (homeIp) homeIp.innerHTML = '';
const homeCreators = document.querySelector('#creator-grid');
if (homeCreators) homeCreators.innerHTML = authors.slice(0, 4).map(authorCard).join('');
const home = app?.innerHTML ?? '';

document.addEventListener('click', event => {
  const featuredStep = event.target.closest('[data-featured-step]');
  if (featuredStep) {
    renderFeaturedComic(Number(featuredStep.getAttribute('data-featured-step')));
    return;
  }
  const letterButton = event.target.closest('[data-comic-letter]');
  if (letterButton) {
    activeComicLetter = letterButton.getAttribute('data-comic-letter') || '';
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
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.setInterval(() => renderFeaturedComic('random'), 8000);
}
