const ipItems = [
  { title: 'Freakier Than Normal', slug: 'freakier-than-normal', initials: 'FTN', kind: 'Comic / Manga' },
  { title: 'Baka: El Mito Asesino', slug: 'baka-el-mito-asesino', initials: 'BAKA', kind: 'Comic / Manga' },
  { title: 'Sangrienta', slug: 'sangrienta', initials: 'S', kind: 'Original IP' },
  { title: 'Cuentos del Magijara', slug: 'cuentos-del-magijara', initials: 'CM', kind: 'Original IP' },
  { title: 'Yanikeke', slug: 'yanikeke', initials: 'Y', kind: 'Original IP' },
  { title: 'Fors Magika', slug: 'fors-magika', initials: 'FM', kind: 'Original IP' },
];
const authors = [
  { name: 'anderson-07', slug: 'anderson-07', image: 'anderson-07.jpg' },
  { name: 'darkereve', slug: 'darkereve', image: 'darkereve.jpg' },
  { name: 'froggynami', slug: 'froggynami', image: 'froggynami.jpg' },
  { name: 'manuel_shoo', slug: 'manuel_shoo', image: 'manuel_shoo.jpg' },
  { name: 'mesiasart', slug: 'mesiasart', image: 'mesiasart.jpg' },
  { name: 'Nattibie', slug: 'nattibie', image: 'Nattibie.jpg' },
  { name: 'Nicodomo', slug: 'nicodomo', image: 'Nicodomo.jpg' },
  { name: 'ossy_jo', slug: 'ossy_jo', image: 'ossy_jo.jpg' },
  { name: 'spencer_draw', slug: 'spencer_draw', image: 'spencer_draw.jpg' },
  { name: 'xamurai_rd', slug: 'xamurai_rd', image: 'xamurai_rd.jpg' },
  { name: 'yonsoncb', slug: 'yonsoncb', image: 'yonsoncb.jpg' },
  { name: 'Zukupow', slug: 'zukupow', image: 'zukupow.jpg' },
];

const ipGrid = document.querySelector('#ip-grid');
if (ipGrid) ipGrid.innerHTML = ipItems.map((item, index) => `
  <a class="ip-card" href="${item.kind === 'Comic / Manga' ? '/comics' : '/ip'}/${item.slug}" data-route>
    <div class="ip-art"><small>AE / IP—0${index + 1}</small><span class="ip-initial">${item.initials}</span></div>
    <div class="ip-info"><h3>${item.title}</h3><span>↗</span></div>
  </a>`).join('');

const creatorGrid = document.querySelector('#creator-grid');
if (creatorGrid) creatorGrid.innerHTML = authors.map(author => `
  <a class="creator-card" href="/authors/${author.slug}" data-route>
    <div class="creator-image"><img src="/artistas/${encodeURIComponent(author.image)}" alt="Portrait of ${esc(author.name)}" loading="lazy" /><span>VIEW PROFILE ↗</span></div>
    <div class="creator-name"><h3>${esc(author.name)}</h3><span>CREATOR</span></div>
  </a>`).join('');

const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.desktop-nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menu?.setAttribute('aria-expanded', 'false');
}));

const app = document.querySelector('#app');
const landing = app?.innerHTML ?? '';
const originalTitle = 'Alpha Eve Studios — Stories. Art. Worlds.';
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function renderRoute() {
  if (!app) return;
  const path = decodeURI(location.pathname).replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/index.html') {
    app.innerHTML = landing;
    document.title = originalTitle;
    return;
  }
  const slug = path.split('/').pop();
  const author = path.startsWith('/authors/') ? authors.find(entry => entry.slug === slug) : null;
  if (author) {
    document.title = `${author.name} — Alpha Eve Studios`;
    app.innerHTML = `
      <section class="detail-shell author-profile">
        <a class="detail-back" href="/#creators">← Back to our creators</a>
        <div class="detail-hero author-hero">
          <div class="author-portrait"><img src="/artistas/${encodeURIComponent(author.image)}" alt="Portrait of ${esc(author.name)}" /></div>
          <div class="detail-copy"><p class="eyebrow">ALPHA EVE · CREATOR PROFILE</p><h1>${esc(author.name)}<span class="red">.</span></h1><div class="detail-meta">ARTIST PROFILE</div><p>Creator profile and professional portfolio. Biography and role details will be added when available.</p><div class="detail-links"><a href="/#projects">SELECTED WORK ↗</a><a href="#contact">PROFESSIONAL INQUIRY ↗</a></div></div>
        </div>
        <section class="detail-block"><p class="eyebrow">ABOUT</p><h2>Biography</h2><div class="detail-empty">Biography will be added here.</div></section>
        <section class="detail-block"><p class="eyebrow">PORTFOLIO</p><h2>Selected work</h2><div class="detail-empty">Portfolio work and project credits will be added here.</div></section>
        <section class="detail-block"><p class="eyebrow">SPECIALTIES &amp; CONTACT</p><h2>Work together</h2><div class="detail-empty">Skills, social links and professional contact details will be added here.</div></section>
        <section class="detail-block"><p class="eyebrow">MORE CREATORS</p><div class="detail-list">${authors.filter(entry => entry.slug !== author.slug).slice(0, 3).map(entry => `<a href="/authors/${entry.slug}" data-route><article><b>ALPHA EVE CREATOR</b>${esc(entry.name)} ↗</article></a>`).join('')}</div></section>
      </section>`;
    return;
  }
  const item = ipItems.find(entry => entry.slug === slug);
  const type = path.startsWith('/comics/') ? 'Comic / manga' : 'Original IP';
  if (item) {
    document.title = `${item.title} — Alpha Eve Studios`;
    app.innerHTML = `
      <section class="detail-shell">
        <a class="detail-back" href="/#ip">← Back to Alpha Eve</a>
        <div class="detail-hero">
          <div class="detail-art"><strong>${esc(item.initials)}</strong></div>
          <div class="detail-copy"><p class="eyebrow">ALPHA EVE ORIGINAL · ${esc(type)}</p><h1>${esc(item.title)}<span class="red">.</span></h1><div class="detail-meta">${esc(item.kind)} · Dominican Republic</div><p>An original Alpha Eve property. More details, reading options and artwork will be added as they are published.</p><div class="detail-links"><a href="#contact">PROJECT INQUIRY ↗</a><a href="/#ip">MORE FROM ALPHA EVE ↗</a></div></div>
        </div>
        <section class="detail-block"><p class="eyebrow">SERIES INFORMATION</p><h2>About the work</h2><div class="detail-empty">Official series details will be added here.</div></section>
        <section class="detail-block"><p class="eyebrow">CHAPTERS</p><h2>Read the series</h2><div class="detail-empty">No chapter information or purchase links are currently available.</div></section>
        <section class="detail-block"><p class="eyebrow">COVERS &amp; ARTWORK</p><h2>Gallery</h2><div class="detail-empty">Artwork will be added here.</div></section>
        <section class="detail-block"><p class="eyebrow">CHARACTERS &amp; CREDITS</p><h2>Creators behind the story</h2><div class="detail-empty">Creator and character information will be added here.</div></section>
          <section class="detail-block"><p class="eyebrow">DISCOVER MORE</p><h2>More from Alpha Eve</h2><div class="detail-list">${ipItems.filter(entry => entry.slug !== item.slug).slice(0, 3).map(entry => `<a href="${entry.kind === 'Comic / Manga' ? '/comics' : '/ip'}/${entry.slug}" data-route><article><b>ALPHA EVE ORIGINAL</b>${esc(entry.title)} ↗</article></a>`).join('')}</div></section>
      </section>`;
  } else {
    document.title = 'Page not found — Alpha Eve Studios';
    app.innerHTML = `<section class="detail-shell"><a class="detail-back" href="/">← Alpha Eve Studios</a><h1 class="detail-copy" style="margin-top:70px">THIS WORLD<br>ISN'T HERE<span class="red">.</span></h1><p>That page isn't available yet.</p><a class="button button-dark" href="/">Return home <span>↗</span></a></section>`;
  }
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[data-route]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.pushState({}, '', link.getAttribute('href'));
  renderRoute();
  window.scrollTo(0, 0);
});
window.addEventListener('popstate', renderRoute);
