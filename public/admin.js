const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const root = $('#page-content');
const loginView = $('#login-view');
const cmsView = $('#cms-view');
const state = { content: null, user: null, route: 'dashboard', filter: '', statusFilter: 'all', genreFilter: 'all', formatFilter: 'all', catalogTypeFilter: 'all', editing: null, toastTimer: null };
const genres = ['Acción', 'Kaiju', 'Crimen', 'Sobrenatural', 'Histórico', 'Romance', 'Misterio', 'Ecchi +18', 'Vampiros', 'Detective', 'Thriller', 'Drama', 'Gore +18', 'Fantasía', 'Shonen', 'Zombies', 'Artes Marciales', 'Suspenso', 'Slice of Life', 'Cyberpunk', 'Aventura', 'Shojo', 'Steampunk', 'Magia', 'Psicológico', 'Comedia', 'Noir', 'Horror', 'Seinen', 'Western', 'Isekai', 'Superhéroes', 'Deportivo', 'Mecha', 'Sci-Fi', 'Josei'];
const catalogTypes = ['Comics', 'Manga', 'Cuentos Infantiles', 'Novelas', 'Artbooks', 'Otros'];
const creditRoles = ['Obra', 'Obra completa', 'Guion', 'Historia', 'Arte', 'Dibujo', 'Tinta', 'Color', 'Portada', 'Lettering', 'Rotulación', 'Traducción', 'Edición', 'Diseño', 'Asistencia'];
const entityForRoute = { comics: 'comics', creators: 'authors', projects: 'projects' };
const labels = { comics: 'cómic', authors: 'creador', projects: 'proyecto' };

function esc(value = '') { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function slugify(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
}
function normStatus(value) {
  const key = String(value || 'published').trim().toLowerCase();
  if (['draft', 'borrador'].includes(key)) return 'draft';
  if (['archived', 'archivado'].includes(key)) return 'archived';
  return 'published';
}
function statusLabel(value) { return ({ draft: 'Borrador', published: 'Publicado', archived: 'Archivado' })[normStatus(value)]; }
function statusBadge(value) { const status = normStatus(value); return `<span class="badge ${status}">${statusLabel(status)}</span>`; }
function displayName(record) { return record?.title || record?.name || 'Sin título'; }
function allRecords(type) { return state.content?.[type] || []; }
function findRecord(type, slug) { return allRecords(type).find(item => item.slug === slug); }
function imageUrl(value, type, record) {
  if (!value) return '';
  if (value.startsWith('/') || /^https?:\/\//i.test(value)) return value;
  return type === 'authors' ? `/artistas/${encodeURIComponent(record.slug)}/perfil.jpg` : value;
}
function projectImage(project, value = project.assets?.hero) {
  if (!value) return '';
  if (value.startsWith('/') || /^https?:\/\//i.test(value)) return value;
  const dir = String(project.assetDir || '').replace(/\/$/, '');
  return dir ? `${dir}/${encodeURIComponent(value)}` : '';
}
function creatorNames(slugs = []) { return slugs.map(slug => findRecord('authors', slug)?.name).filter(Boolean); }

async function api(path, options = {}) {
  let response;
  try { response = await fetch(path, { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(15000), ...options }); }
  catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new Error('El CMS tardó demasiado en responder. Revisa tu conexión e inténtalo otra vez.');
    throw new Error('No se pudo conectar con el CMS. Revisa tu conexión e inténtalo otra vez.');
  }
  const result = await response.json().catch(() => ({}));
  if (response.status === 401) {
    logoutLocal();
    throw new Error('Tu sesión venció. Vuelve a iniciar sesión.');
  }
  if (!response.ok) {
    console.error('CMS request failed', path, response.status, result);
    throw new Error(response.status >= 500 ? 'No se pudo completar la solicitud. Inténtalo de nuevo en un momento.' : (result.error || 'Revisa la información e inténtalo de nuevo.'));
  }
  return result;
}
function toast(message, isError = false) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.toggle('error', isError);
  node.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => node.classList.remove('show'), 3600);
}
function logoutLocal() {
  cmsView.hidden = true;
  loginView.hidden = false;
  state.content = null;
  state.user = null;
  $('#session-status').textContent = 'Desconectado';
  applyRoleNavigation();
  closeEditor();
}

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $('button[type="submit"]', form);
  const message = $('#login-message');
  button.disabled = true;
  message.textContent = 'Comprobando acceso…';
  try {
    message.textContent = 'Verificando contraseña…';
    const login = await api('/api/cms/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: new FormData(form).get('username'), password: new FormData(form).get('password') }) });
    form.reset();
    await openCms(login.user);
  } catch (error) {
    message.textContent = error.message === 'Contraseña incorrecta.' ? 'La contraseña no coincide. Inténtalo otra vez.' : error.message;
  } finally { button.disabled = false; }
});
$('#logout').addEventListener('click', async () => {
  await api('/api/cms/logout', { method: 'POST' }).catch(() => {});
  logoutLocal();
  history.replaceState({}, '', '/admin');
  toast('Sesión cerrada.');
});

function applyRoleNavigation() {
  const admin = state.user?.role === 'admin';
  $$('[data-admin-only]').forEach(link => link.hidden = !admin);
  const dashboard = $('[data-route="dashboard"]');
  const projects = $('[data-route="projects"]');
  if (dashboard) dashboard.hidden = !admin;
  if (projects) projects.hidden = !admin;
}
async function openCms(user) {
  loginView.hidden = true;
  cmsView.hidden = false;
  $('#session-status').textContent = `Conectado como ${user?.role === 'admin' ? 'administrador' : (user?.username || 'autor')}`;
  try {
    state.user = user || (await api('/api/cms/session')).user;
    $('#session-status').textContent = `Conectado como ${state.user?.role === 'admin' ? 'administrador' : (state.user?.username || 'autor')}`;
    if (state.user?.mustChangePassword) { state.content = null; applyRoleNavigation(); renderPasswordChange(true); return; }
    state.content = await api('/api/cms/content');
    applyRoleNavigation();
    if (state.user?.role === 'author') {
      const requested=location.pathname.replace(/\/+$/,'').split('/')[2];
      if(!['comics','creators','password'].includes(requested)){navigate('/admin/comics',true);return;}
    }
    await routeFromLocation(false);
  } catch (error) {
    root.innerHTML = `<section class="editor-section session-error"><p class="eyebrow">SESIÓN ACTIVA</p><h2>No se pudo cargar el contenido</h2><p>${esc(error.message)}</p><button class="button primary" type="button" data-retry-content>Reintentar</button></section>`;
    $('[data-retry-content]', root).addEventListener('click', async () => {
      root.innerHTML = '<p class="loading">Cargando contenido…</p>';
      try { await refreshContent(); applyRoleNavigation(); await routeFromLocation(false); }
      catch (retryError) { root.innerHTML = `<section class="editor-section session-error"><p class="eyebrow">SESIÓN ACTIVA</p><h2>No se pudo cargar el contenido</h2><p>${esc(retryError.message)}</p><button class="button primary" type="button" data-retry-content>Reintentar</button></section>`; $('[data-retry-content]', root).addEventListener('click', () => openCms(state.user)); }
    });
  }
}
async function refreshContent() { state.content = await api('/api/cms/content'); }
function routeFromLocation(focus = true) {
  const parts = location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const next = parts[1] === 'comics' ? 'comics' : parts[1] === 'creators' ? 'creators' : parts[1] === 'projects' ? 'projects' : parts[1] === 'users' ? 'users' : parts[1] === 'password' ? 'password' : 'dashboard';
  state.route = next;
  if (parts[2]) {
    const type = entityForRoute[next];
    const record = findRecord(type, decodeURIComponent(parts[2]));
    if (record) openEditor(type, record, false);
  } else if (state.editing) closeEditor();
  renderRoute();
  if (focus) root.focus({ preventScroll: true });
}
function navigate(path, replace = false) {
  history[replace ? 'replaceState' : 'pushState']({}, '', path);
  state.filter = '';
  state.statusFilter = 'all'; state.genreFilter = 'all'; state.formatFilter = 'all'; state.catalogTypeFilter = 'all';
  routeFromLocation();
}
window.addEventListener('popstate', () => routeFromLocation());
document.addEventListener('click', event => {
  const routeLink = event.target.closest('[data-route]');
  if (routeLink) {
    event.preventDefault();
    const route = routeLink.dataset.route;
    navigate(route === 'dashboard' ? '/admin' : `/admin/${route}`);
    return;
  }
  const editButton = event.target.closest('[data-edit-type]');
  if (editButton) {
    const record = findRecord(editButton.dataset.editType, editButton.dataset.editSlug);
    if (record) openEditor(editButton.dataset.editType, record, false);
  }
});

function renderRoute() {
  root.onclick = null;
  if (state.user?.role === 'author' && !['comics','creators','password'].includes(state.route)) { navigate('/admin/comics', true); return; }
  $$('.main-nav a').forEach(link => link.classList.toggle('active', link.dataset.route === state.route));
  if (state.route === 'users' && state.user?.role === 'admin') renderUserAccounts();
  else if (state.route === 'password') renderPasswordChange(false);
  else if (state.route === 'dashboard' && state.user?.role === 'admin') renderDashboard();
  else renderCatalog(entityForRoute[state.route]);
}
function renderPasswordChange(required = false) {
  root.innerHTML = `<div class="page-heading"><div><p class="eyebrow">SEGURIDAD DE LA CUENTA</p><h1>${required ? 'Cambia tu contraseña temporal' : 'Cambiar contraseña'}</h1><p>${required ? 'Antes de editar tu perfil o tus cómics, establece una contraseña privada.' : 'Usa una contraseña de al menos 12 caracteres.'}</p></div></div><section class="editor-section"><form id="password-change-form"><label class="field">Contraseña actual<input name="currentPassword" type="password" required autocomplete="current-password"></label><label class="field">Nueva contraseña<input name="newPassword" type="password" required minlength="12" autocomplete="new-password"></label><label class="field">Repite la nueva contraseña<input name="confirmPassword" type="password" required minlength="12" autocomplete="new-password"></label><p class="form-message" id="password-change-message" role="status"></p><button class="button primary" type="submit">Guardar contraseña</button>${required ? '' : ' <button class="button secondary" type="button" data-password-cancel>Cancelar</button>'}</form></section>`;
  $('#password-change-form', root).addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); const message = $('#password-change-message', root);
    const newPassword = String(values.get('newPassword') || '');
    if (newPassword !== values.get('confirmPassword')) { message.textContent = 'Las contraseñas nuevas no coinciden.'; return; }
    const button = $('button[type="submit"]', form); button.disabled = true; message.textContent = 'Guardando…';
    try { await api('/api/cms/password', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({currentPassword:values.get('currentPassword'),newPassword}) }); const session=await api('/api/cms/session'); await openCms(session.user); toast('Contraseña actualizada.'); }
    catch (error) { message.textContent = error.message; button.disabled = false; }
  });
  $('[data-password-cancel]', root)?.addEventListener('click', () => { navigate('/admin/comics', true); });
}

function generatedPassword() {
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let output='';
  while(output.length<20){const bytes=crypto.getRandomValues(new Uint8Array(32));for(const value of bytes){if(value<Math.floor(256/alphabet.length)*alphabet.length)output+=alphabet[value%alphabet.length];if(output.length===20)break;}}
  return output;
}
async function renderUserAccounts(reveal = null) {
  root.innerHTML='<div class="loading">Cargando cuentas…</div>';
  try {
    const data=await api('/api/cms/users');
    root.innerHTML=`<div class="page-heading"><div><p class="eyebrow">ACCESOS INDIVIDUALES</p><h1>Cuentas de autores</h1><p>Cada cuenta accede al perfil propio y a los cómics donde esa persona figura como autora de la obra. Las colaboraciones por sí solas no dan acceso.</p></div></div>${reveal?`<section class="editor-section"><h3>Contraseña temporal de ${esc(reveal.username)}</h3><p class="section-help">Cópiala y entrégala por un canal privado. Esta es la única vez que se muestra.</p><div class="inline-add"><input data-revealed-password readonly value="${esc(reveal.password)}"><button class="button secondary" type="button" data-copy-temp-password>Copiar</button></div></section>`:''}<section class="editor-section"><h3>Crear cuenta</h3><form id="account-create-form" class="form-grid"><label class="field">Autor<select name="authorSlug" required><option value="">Selecciona un autor</option>${data.availableAuthors.map(author=>`<option value="${esc(author.slug)}">${esc(author.name)}</option>`).join('')}</select></label><label class="field">Usuario<input name="username" required minlength="3" maxlength="50" autocomplete="off"></label><label class="field full">Contraseña temporal <span class="field-hint">Se mostrará una sola vez. Entrégala al autor por un canal privado; deberá cambiarla al entrar.</span><div class="inline-add"><input name="password" type="text" required minlength="12" autocomplete="new-password"><button class="button secondary" type="button" data-generate-account-password>Generar</button></div></label><div class="field full"><button class="button primary" type="submit"${data.availableAuthors.length?'':' disabled'}>Crear acceso</button><p class="form-message" data-account-message role="status"></p></div></form></section><div class="section-heading"><div><h2>${data.users.length} cuentas</h2><p>Las contraseñas nunca se muestran ni se guardan en texto plano.</p></div></div><div class="catalog-grid">${data.users.map(user=>`<section class="editor-section account-card"><div><h3>${esc(user.authorName)}</h3><p class="muted">Usuario: <strong>${esc(user.username)}</strong> · ${user.comicCount} cómics propios · ${user.active?'Activa':'Desactivada'}${user.mustChangePassword?' · Cambio de contraseña pendiente':''}</p></div><form class="account-reset-form" data-account-author="${esc(user.author_slug)}" data-account-username="${esc(user.username)}"><label class="field">Nueva contraseña temporal<input name="password" type="text" required minlength="12" autocomplete="new-password"></label><div class="button-row"><button class="button secondary" type="button" data-generate-account-password>Generar</button><button class="button secondary" type="submit">Restablecer contraseña</button><button class="button ${user.active?'danger':'secondary'}" type="button" data-toggle-account="${user.active?'disable':'enable'}" data-account-author="${esc(user.author_slug)}">${user.active?'Desactivar':'Activar'}</button></div></form></section>`).join('')||'<div class="empty-state"><h3>Aún no hay cuentas</h3><p>Selecciona cualquier perfil para crearle un acceso. Si no es autora de cómics, podrá administrar solo su perfil.</p></div>'}</div>`;
    const createForm=$('#account-create-form',root);const authorSelect=$('[name="authorSlug"]',createForm);const usernameInput=$('[name="username"]',createForm);
    authorSelect.addEventListener('change',()=>{usernameInput.value=authorSelect.value||'';});
    root.onclick = async event=>{
      if(event.target.closest('[data-generate-account-password]')){const form=event.target.closest('form');$('[name="password"]',form).value=generatedPassword();$('[name="password"]',form).select();}
      if(event.target.closest('[data-copy-temp-password]')){const input=$('[data-revealed-password]',root);input.select();await navigator.clipboard?.writeText(input.value);toast('Contraseña copiada.');}
      const toggle=event.target.closest('[data-toggle-account]'); if(toggle){toggle.disabled=true;try{await api('/api/cms/users',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:toggle.dataset.toggleAccount,authorSlug:toggle.dataset.accountAuthor})});toast('Cuenta actualizada.');await renderUserAccounts();}catch(error){toast(error.message,true);toggle.disabled=false;}}
    };
    createForm.addEventListener('submit',async event=>{event.preventDefault();const values=new FormData(createForm);const message=$('[data-account-message]',createForm);try{await api('/api/cms/users',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'create',authorSlug:values.get('authorSlug'),username:values.get('username'),password:values.get('password')})});await renderUserAccounts({username:values.get('username'),password:values.get('password')});}catch(error){message.textContent=error.message;}});
    $$('.account-reset-form',root).forEach(form=>form.addEventListener('submit',async event=>{event.preventDefault();const password=new FormData(form).get('password');try{await api('/api/cms/users',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'reset',authorSlug:form.dataset.accountAuthor,password})});await renderUserAccounts({username:form.dataset.accountUsername,password});toast('Contraseña restablecida; se cambiará al próximo ingreso.');}catch(error){toast(error.message,true);}}));
  } catch(error) { root.innerHTML=`<div class="empty-state"><h3>No se pudieron cargar las cuentas</h3><p>${esc(error.message)}</p></div>`; }
}
function countState() {
  const records = Object.entries(entityForRoute).flatMap(([route, type]) => allRecords(type).map(record => ({ ...record, _type: type, _route: route })));
  return {
    comics: allRecords('comics').length, authors: allRecords('authors').length, projects: allRecords('projects').length,
    drafts: records.filter(item => normStatus(item.status) === 'draft').length,
    published: records.filter(item => normStatus(item.status) === 'published').length,
  };
}
function issueGroups() {
  const comics = allRecords('comics'); const authors = allRecords('authors'); const projects = allRecords('projects');
  return [
    { title: 'Cómics sin sinopsis', type: 'comics', items: comics.filter(item => !String(item.synopsis || '').trim()) },
    { title: 'Cómics sin género', type: 'comics', items: comics.filter(item => !item.genres?.length) },
    { title: 'Creadores sin foto', type: 'authors', items: authors.filter(item => !item.image) },
    { title: 'Proyectos sin descripción', type: 'projects', items: projects.filter(item => !projectDescription(item).trim()) },
  ].filter(group => group.items.length);
}
function projectDescription(project) {
  const value = project.storyCopy || project.purposeCopy || project.roleCopy || project.subtitle || '';
  return Array.isArray(value) ? value.join('\n') : String(value);
}
function renderDashboard() {
  const stats = countState(); const issues = issueGroups();
  root.innerHTML = `
    <div class="page-heading"><div><p class="eyebrow">TU ESPACIO EDITORIAL</p><h1>Resumen</h1><p>Una vista rápida del contenido del estudio.</p></div><button class="button accent" data-create="comics" type="button">+ Nuevo cómic</button></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">Cómics</div><div class="stat-value">${stats.comics}</div></div>
      <div class="stat-card"><div class="stat-label">Creadores</div><div class="stat-value">${stats.authors}</div></div>
      <div class="stat-card"><div class="stat-label">Proyectos</div><div class="stat-value">${stats.projects}</div></div>
      <div class="stat-card draft"><div class="stat-label">Borradores</div><div class="stat-value">${stats.drafts}</div></div>
      <div class="stat-card published"><div class="stat-label">Publicaciones</div><div class="stat-value">${stats.published}</div></div>
    </div>
    <div class="dashboard-grid">
      <section><div class="section-heading"><div><h2>Contenido pendiente</h2><p>Completa estos detalles cuando tengas la información.</p></div></div>
        <div class="surface">${issues.length ? `<div class="pending-list">${issues.map(group => `<div class="pending-item"><div><strong>${esc(group.title)}</strong><small>${group.items.slice(0,3).map(item => esc(displayName(item))).join(' · ')}${group.items.length > 3 ? ` · y ${group.items.length - 3} más` : ''}</small></div><span class="pending-count">${group.items.length}</span><button class="button quiet small" type="button" data-open-group="${group.type}" data-open-slug="${esc(group.items[0].slug)}">Revisar</button></div>`).join('')}</div>` : '<div class="surface-pad muted">Todo el contenido tiene la información mínima registrada.</div>'}</div>
      </section>
      <section><div class="section-heading"><div><h2>Accesos rápidos</h2><p>Ve directo a lo que necesitas gestionar.</p></div></div>
        <div class="quick-links"><a class="quick-link" href="/admin/comics" data-route="comics">Administrar cómics <span>↗</span></a><a class="quick-link" href="/admin/creators" data-route="creators">Administrar creadores <span>↗</span></a><a class="quick-link" href="/admin/projects" data-route="projects">Administrar proyectos <span>↗</span></a></div>
      </section>
    </div>`;
  $('[data-create]', root).addEventListener('click', () => createRecord('comics'));
  $$('[data-open-group]', root).forEach(button => button.addEventListener('click', () => {
    const record = findRecord(button.dataset.openGroup, button.dataset.openSlug);
    if (record) { navigate(`/admin/${button.dataset.openGroup === 'authors' ? 'creators' : button.dataset.openGroup}`); openEditor(button.dataset.openGroup, record, false); }
  }));
}

function renderCatalog(type) {
  const route = type === 'authors' ? 'creators' : type;
  const isComic = type === 'comics'; const isCreator = type === 'authors';
  const title = isComic ? 'Cómics' : isCreator ? 'Creadores' : 'Proyectos';
  const subtitle = isComic ? 'Organiza tus historias, portadas y capítulos.' : isCreator ? 'Gestiona perfiles y relaciones creativas.' : 'Mantén al día el trabajo del estudio.';
  let records = allRecords(type).filter(record => {
    const text = [displayName(record), record.client, record.category, ...(record.creatorSlugs || []).map(slug => findRecord('authors', slug)?.name || '')].join(' ').toLocaleLowerCase();
    return text.includes(state.filter.toLocaleLowerCase())
      && (state.statusFilter === 'all' || normStatus(record.status) === state.statusFilter)
      && (!isComic || state.genreFilter === 'all' || (record.genres || []).includes(state.genreFilter))
      && (!isComic || state.formatFilter === 'all' || record.format === state.formatFilter)
      && (!isComic || state.catalogTypeFilter === 'all' || (record.catalogType || '') === state.catalogTypeFilter);
  });
  const sortRecords = [...records].sort((a,b) => displayName(a).localeCompare(displayName(b), 'es'));
  const genreOptions = [...new Set([...genres, ...allRecords('comics').flatMap(item => item.genres || [])])].sort((a,b) => a.localeCompare(b, 'es'));
  const canCreate = state.user?.role === 'admin';
  root.innerHTML = `
    <div class="page-heading"><div><p class="eyebrow">${state.user?.role==='author'?'TU ESPACIO DE AUTOR':'CATÁLOGO EDITORIAL'}</p><h1>${title}</h1><p>${state.user?.role==='author'&&isComic?'Aquí aparecen únicamente los cómics donde eres autor de la obra.':subtitle}</p></div>${canCreate?`<button class="button accent" data-create="${type}" type="button">+ Nuevo ${isComic ? 'cómic' : isCreator ? 'creador' : 'proyecto'}</button>`:''}</div>
    <div class="catalog-toolbar">
      <label class="field search-field"><span class="screen-reader">Buscar ${title.toLowerCase()}</span><input type="search" id="catalog-search" placeholder="Buscar por nombre o cliente" value="${esc(state.filter)}"></label>
      <label class="field"><span class="screen-reader">Filtrar por estado</span><select id="status-filter"><option value="all">Todos los estados</option><option value="published">Publicados</option><option value="draft">Borradores</option><option value="archived">Archivados</option></select></label>
      ${isComic ? `<label class="field"><span class="screen-reader">Filtrar por género</span><select id="genre-filter"><option value="all">Todos los géneros</option>${genreOptions.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join('')}</select></label><label class="field"><span class="screen-reader">Filtrar por formato de lectura</span><select id="format-filter"><option value="all">Todos los formatos de lectura</option>${['One-shot','Series'].map(item => `<option value="${item}">${item === 'One-shot' ? 'Tomo único' : 'Serie'}</option>`).join('')}</select></label><label class="field"><span class="screen-reader">Filtrar por tipo de publicación</span><select id="catalog-type-filter"><option value="all">Todos los tipos de publicación</option>${catalogTypes.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join('')}</select></label>` : ''}
    </div>
    <div class="section-heading"><div><h2>${sortRecords.length} ${title.toLocaleLowerCase()}</h2><p>Selecciona una tarjeta para editar su información.</p></div></div>
    ${sortRecords.length ? `<div class="catalog-grid">${sortRecords.map(record => catalogCard(type, record)).join('')}</div>` : `<div class="empty-state"><h3>${state.user?.role==='author'?'No hay cómics asignados a tu autoría.':'No encontramos contenido con esos filtros.'}</h3><p>${canCreate?'Prueba con otra búsqueda o crea un registro nuevo.':'Contacta con administración para revisar la asignación de autoría.'}</p>${canCreate?`<button class="button secondary" data-create="${type}" type="button">Crear ${isComic ? 'cómic' : isCreator ? 'creador' : 'proyecto'}</button>`:''}</div>`}`;
  $('#catalog-search', root).addEventListener('input', event => { state.filter = event.target.value; renderCatalog(type); const input = $('#catalog-search', root); input.focus(); input.setSelectionRange(input.value.length, input.value.length); });
  $('#status-filter', root).value = state.statusFilter;
  $('#status-filter', root).addEventListener('change', event => { state.statusFilter = event.target.value; renderCatalog(type); });
  if (isComic) {
    $('#genre-filter', root).value = state.genreFilter;
    $('#genre-filter', root).addEventListener('change', event => { state.genreFilter = event.target.value; renderCatalog(type); });
    $('#format-filter', root).value = state.formatFilter;
    $('#format-filter', root).addEventListener('change', event => { state.formatFilter = event.target.value; renderCatalog(type); });
    $('#catalog-type-filter', root).value = state.catalogTypeFilter;
    $('#catalog-type-filter', root).addEventListener('change', event => { state.catalogTypeFilter = event.target.value; renderCatalog(type); });
  }
  $('[data-create]', root)?.addEventListener('click', event => createRecord(event.currentTarget.dataset.create));
  $$('.record-card', root).forEach(card => card.addEventListener('click', () => {
    const record = findRecord(type, card.dataset.slug);
    if (record) openEditor(type, record, false);
  }));
}
function catalogCard(type, record) {
  const isCreator = type === 'authors'; const isComic = type === 'comics';
  const photo = isComic ? record.cover : isCreator ? imageUrl(record.image, 'authors', record) : projectImage(record);
  const personNames = creatorNames(record.creatorSlugs || []);
  const chapterCount = (record.chapters || []).length;
  const meta = isComic ? [record.catalogType || record.medium || 'Tipo por agregar', ...(record.format === 'One-shot' ? ['Tomo único'] : [record.format === 'Series' ? 'Serie' : 'Formato por agregar', `${chapterCount} capítulos`])] : isCreator ? [record.role || 'Rol por agregar', `${(record.comicSlugs || []).length} cómics`, `${(record.projectSlugs || []).length} proyectos`] : [record.category || 'Categoría por agregar', record.client || 'Proyecto del estudio'];
  return `<button class="record-card" type="button" data-slug="${esc(record.slug)}">
    <span class="record-image">${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" onerror="this.remove()">` : 'AE'}</span>
    <span class="record-info"><span>${statusBadge(record.status)}</span><h3>${esc(displayName(record))}</h3><span class="record-meta">${meta.map(esc).join(' · ')}</span>${personNames.length ? `<span class="record-creators">${esc(personNames.join(' · '))}</span>` : ''}</span>
  </button>`;
}

function createRecord(type) {
  const template = type === 'comics'
    ? { title: '', slug: '', initials: '', catalogType: 'Comics', medium: 'Cómic', format: 'Series', language: 'Español', status: 'draft', genres: [], synopsis: '', cover: '', backCover: '', creatorSlugs: [], creatorCredits: {}, externalCredits: [], chapters: [], characters: [], gallery: [] }
    : type === 'authors'
      ? { name: '', slug: '', role: '', image: '', bio: '', specialties: [], social: '', instagram: '', twitter: '', website: '', comicSlugs: [], projectSlugs: [] }
      : { title: '', slug: '', category: '', categories: [], client: '', type: '', subtitle: '', storyCopy: [], assetDir: '', creatorSlugs: [], creatorCredits: {}, externalCredits: [], assets: { gallery: [] } };
  openEditor(type, template, true);
}
function openEditor(type, record, isNew) {
  state.editing = { type, original: structuredClone(record), isNew, autoSlug: isNew, tempStatus: normStatus(record.status) };
  const route = type === 'authors' ? 'creators' : type;
  history.pushState({}, '', `/admin/${route}/${encodeURIComponent(record.slug || 'nuevo')}`);
  renderEditor();
}
function closeEditor() {
  $('.modal-backdrop')?.remove();
  state.editing = null;
  if (cmsView.hidden) return;
  history.replaceState({}, '', state.route === 'dashboard' ? '/admin' : `/admin/${state.route}`);
}

function field(label, name, value = '', options = {}) {
  const { type = 'text', placeholder = '', hint = '', full = false, required = false, rows = 4, step = '', maxlength = '' } = options;
  const cls = `field${full ? ' full' : ''}`;
  const req = required ? ' required' : '';
  const hints = hint ? `<span class="field-hint">${esc(hint)}</span>` : '';
  if (type === 'textarea') return `<label class="${cls}">${esc(label)}${hints}<textarea name="${esc(name)}" rows="${rows}" placeholder="${esc(placeholder)}"${maxlength ? ` maxlength="${maxlength}"` : ''}${req}>${esc(value)}</textarea></label>`;
  return `<label class="${cls}">${esc(label)}${hints}<input name="${esc(name)}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}"${step ? ` step="${step}"` : ''}${maxlength ? ` maxlength="${maxlength}"` : ''}${req}></label>`;
}
function selectField(label, name, value, choices, options = {}) {
  return `<label class="field${options.full ? ' full' : ''}">${esc(label)}${options.hint ? `<span class="field-hint">${esc(options.hint)}</span>` : ''}<select name="${esc(name)}">${choices.map(item => `<option value="${esc(item.value)}"${String(item.value) === String(value ?? '') ? ' selected' : ''}>${esc(item.label)}</option>`).join('')}</select></label>`;
}
function mediaField(label, key, value, options = {}) {
  const ratio = options.ratio === 'landscape' ? ' landscape' : '';
  const url = value || '';
  const preview = options.preview || url;
  return `<div class="cover-upload" data-media-container="${esc(key)}">
    <div class="cover-preview${ratio}">${preview ? `<img src="${esc(preview)}" alt="Vista previa de ${esc(label)}">` : '<span>Sin imagen</span>'}</div>
    <div class="cover-info"><strong>${esc(label)}</strong><small>${url ? 'Imagen lista' : 'Puedes agregarla ahora o más tarde.'}</small>
      <input type="hidden" data-media-value value="${esc(url)}">
      <div class="cover-actions"><label class="button secondary" for="${esc(keyId(key))}">${url ? 'Cambiar imagen' : 'Subir imagen'}<input id="${esc(keyId(key))}" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" data-media-input></label><button class="button quiet small" type="button" data-clear-media${url ? '' : ' disabled'}>Quitar</button></div>
    </div>
  </div>`;
}
function keyId(key) { return `media-${key.replace(/[^a-z0-9]+/gi, '-')}`; }
function section(title, help, body) { return `<section class="editor-section"><h3>${title}</h3>${help ? `<p class="section-help">${help}</p>` : ''}${body}</section>`; }
function workAuthorSlugsFor(record) {
  return record.workAuthorSlugs || (record.creatorSlugs || []).filter(slug => String(record.creatorCredits?.[slug] || '').split(/\s*·\s*/).some(role=>/^(autor(?:\/a)?|obra(?: completa)?|creador(?:\/a)?)$/i.test(role.trim())));
}
function creatorSection(record, type) {
  const chosen = Array.isArray(record.creatorSlugs) ? record.creatorSlugs : [];
  const roles = record.creatorCredits || {};
  const workAuthors = new Set(workAuthorSlugsFor(record));
  const people = chosen.map(slug => findRecord('authors', slug)).filter(Boolean);
  const choices = allRecords('authors').filter(author => !chosen.includes(author.slug)).sort((a,b) => a.name.localeCompare(b.name, 'es'));
  return section('Autoría y colaboradores', record.format==='One-shot'?'Marca quién es autor. Los demás aparecerán como colaboradores de este tomo único.':'Marca quién es autor. En una serie aparecerá automáticamente en todos los capítulos; los demás son colaboradores.', `
    <div class="inline-add"><label class="field">Buscar creador<input type="search" data-creator-search placeholder="Escribe un nombre"></label>
      <label class="field">Seleccionar<select data-creator-choice><option value="">Elige una persona</option>${choices.map(author => `<option value="${esc(author.slug)}">${esc(author.name)}</option>`).join('')}</select></label>
      <button class="button secondary" type="button" data-add-creator>Agregar</button></div>
    <div class="selected-list" data-creators-list>${people.length ? people.map(person => `<div class="selected-person" data-person="${esc(person.slug)}"><div><strong>${esc(person.name)}</strong><small>${esc(person.role || 'Creador')}</small></div><label class="field">Tipo<select data-person-type${state.user?.role==='author'?' disabled':''}><option value="collaborator"${workAuthors.has(person.slug)?'':' selected'}>Colaborador</option><option value="author"${workAuthors.has(person.slug)?' selected':''}>Autor</option></select></label><input data-person-credit value="${esc(roles[person.slug] || '')}" aria-label="Rol de ${esc(person.name)}" placeholder="Rol o crédito"${workAuthors.has(person.slug)?' hidden':''}${state.user?.role==='author'?' disabled':''}><button class="button quiet small" type="button" data-remove-person="${esc(person.slug)}" aria-label="Quitar a ${esc(person.name)}"${state.user?.role==='author'?' disabled':''}>Quitar</button></div>`).join('') : '<p class="muted">Aún no hay creadores vinculados.</p>'}</div>`);
}
function externalCreditsSection(record) {
  const credits = (record.externalCredits || []).map(value => typeof value === 'string' ? parseExternalCredit(value) : value);
  return section('Colaboradores externos', 'Añade créditos de personas que no tienen perfil en el catálogo.', `<div data-external-list>${credits.map((item,index) => externalCreditRow(item, index)).join('')}</div><div class="button-row"><button class="button secondary small" type="button" data-add-external>+ Agregar colaborador</button></div>`);
}
function parseExternalCredit(value) {
  const match = String(value || '').match(/^\s*([^:]+):\s*(.*)$/);
  return match ? { role: match[1].trim(), name: match[2].trim() } : { role: '', name: String(value || '').trim() };
}
function externalCreditRow(item = {}, index = 0) {
  return `<div class="credit-card form-grid" data-external-credit="${index}">${field('Nombre', 'external-name', item.name || '', { placeholder: 'Nombre de la persona' })}${field('Trabajo', 'external-role', item.role || '', { placeholder: 'Portada, color, traducción…' })}<div class="field full button-row"><button class="button quiet small" type="button" data-remove-external>Quitar colaborador</button></div></div>`;
}
function genreSection(selected = []) {
  const all = [...new Set([...genres, ...selected])];
  return section('Géneros', 'Selecciona uno o varios. Puedes añadir otro si hace falta.', `<div class="choice-list" data-genre-list>${all.map(value => `<label class="choice-chip"><input type="checkbox" value="${esc(value)}"${selected.includes(value) ? ' checked' : ''}><span>${esc(value)}</span></label>`).join('')}</div>
    <div class="custom-choice"><input type="text" data-new-genre placeholder="Añadir otro género" aria-label="Nuevo género"><button class="button secondary small" type="button" data-add-genre>Agregar</button></div>`);
}
function statusField(record) {
  const current = normStatus(record.status);
  return selectField('Estado', 'status', current, [
    { value: 'draft', label: 'Borrador' }, { value: 'published', label: 'Publicado' }, { value: 'archived', label: 'Archivado' },
  ], { hint: 'Los borradores y archivados no aparecen en el sitio público.' });
}
function slugField(record, isNew, entityName) {
  const slug = record.slug || '';
  return `<details class="advanced"><summary>Enlace del contenido</summary><label class="field">Dirección automática<span class="field-hint">Se crea a partir del título; cambiarla puede alterar la URL pública.</span><div class="slug-row"><input name="slug" value="${esc(slug)}"${isNew ? '' : ' readonly'}></div><span class="slug-value">/${entityName}/<span data-slug-preview>${esc(slug || 'se-genera-al-escribir')}</span></span></label></details>`;
}
function chapterSection(record) {
  const chapters = record.chapters || [];
  const workAuthors = workAuthorSlugsFor(record);
  const help = chapters.length ? 'El autor de la obra aparecerá en todos los capítulos. Asigna aquí los colaboradores que participaron en cada uno.' : 'Este cómic todavía no tiene capítulos.';
  return `<section class="editor-section" data-chapter-section><h3>Capítulos</h3><p class="section-help">${help}</p><div data-chapter-list>${chapters.length ? chapters.map((chapter,index) => chapterEditor(chapter,index,index,workAuthors)).join('') : '<p class="muted">Este cómic todavía no tiene capítulos.</p>'}</div><button class="button secondary small" type="button" data-add-chapter>+ Agregar capítulo</button></section>`;
}
function chapterEditor(chapter, index, originalIndex = index, seriesCreators = []) {
  const knownCreators = allRecords('authors').slice().sort((a,b)=>a.name.localeCompare(b.name,'es'));
  const seriesNames = seriesCreators.map(slug=>findRecord('authors',slug)?.name).filter(Boolean);
  const selectedSlugs = (chapter.credits || []).map(credit=>credit.creatorSlug);
  const availableCreators = knownCreators.filter(author=>!selectedSlugs.includes(author.slug) && !seriesCreators.includes(author.slug));
  const team = (chapter.credits || []).map((credit,creditIndex)=>chapterCreatorCredit(credit,creditIndex)).join('');
  const externalTeam = (chapter.externalCredits || []).map((credit,creditIndex)=>chapterExternalCredit(typeof credit === 'string' ? parseExternalCredit(credit) : credit,creditIndex)).join('');
  const chapterId = chapter.id || `chapter-${Number(chapter.number)||index+1}-${slugify(chapter.title)||'untitled'}`;
  return `<article class="chapter-card" data-chapter-index="${index}" data-original-index="${originalIndex ?? ''}" data-chapter-id="${esc(chapterId)}"><div class="chapter-head"><strong>Capítulo ${String(chapter.number ?? index + 1).padStart(2,'0')}</strong><button class="button quiet small" type="button" data-remove-chapter>Quitar</button></div>
    <div class="form-grid">${field('Número', 'chapter-number', chapter.number ?? index + 1, { type:'number', step:'1' })}${field('Título', 'chapter-title', chapter.title || '', { placeholder:'Título del capítulo' })}${field('Sinopsis', 'chapter-synopsis', chapter.synopsis || '', { type:'textarea', full:true, rows:3 })}
    ${selectField('Estado del capítulo', 'chapter-status', normStatus(chapter.status || 'published'), [{value:'draft',label:'Borrador'},{value:'published',label:'Publicado'},{value:'archived',label:'Archivado'}])}
    ${field('Enlace de lectura (opcional)', 'chapter-digital', chapter.digitalUrl || '', { placeholder:'https://…' })}${field('Enlace de compra (opcional)', 'chapter-physical', chapter.physicalUrl || '', { placeholder:'https://…' })}</div>
    ${mediaField('Portada del capítulo', `chapter-${index}-cover`, chapter.cover || '', { ratio:'landscape' })}
    <section class="chapter-credit-editor"><h4>Equipo y créditos del capítulo</h4><p class="field-hint">El autor de la obra se incluye automáticamente en todos los capítulos. Agrega aquí solo a los colaboradores de este capítulo.</p><div class="series-creator-reference"><strong>Autor de la obra · incluido siempre</strong><span>${seriesNames.length ? esc(seriesNames.join(' · ')) : 'Marca al autor en “Autoría y colaboradores” para incluirlo automáticamente.'}</span></div>
      <strong class="chapter-team-label">Colaboradores de este capítulo</strong><div class="chapter-credit-list" data-chapter-credit-list>${team || '<p class="muted">Todavía no hay colaboradores específicos.</p>'}</div>
      <div class="inline-add chapter-credit-add"><label class="field">Buscar creador<input type="search" data-chapter-creator-search placeholder="Buscar creador…"></label><label class="field">Creador<select data-chapter-creator-choice><option value="">Selecciona un creador</option>${availableCreators.map(person=>`<option value="${esc(person.slug)}" data-search="${esc(person.name.toLocaleLowerCase())}">${esc(person.name)}</option>`).join('')}</select></label><button class="button secondary small" type="button" data-add-chapter-creator>+ Agregar creador</button></div>
      <strong class="chapter-team-label">Colaboradores externos de este capítulo</strong><div class="chapter-credit-list" data-chapter-external-list>${externalTeam || '<p class="muted">Todavía no hay colaboradores externos.</p>'}</div><button class="button secondary small" type="button" data-add-chapter-external>+ Agregar colaborador externo</button>
    </section></article>`;
}
function chapterRoleChoices(selected = [], kind = 'creator') {
  return `<div class="choice-list chapter-role-list" data-credit-role-list>${creditRoles.map(role=>`<label class="choice-chip"><input type="checkbox" value="${esc(role)}"${selected.includes(role)?' checked':''}><span>${esc(role)}</span></label>`).join('')}</div><div class="custom-choice"><input type="text" data-new-credit-role placeholder="Añadir otro rol"><button class="button quiet small" type="button" data-add-credit-role>Agregar rol</button></div>`;
}
function chapterCreatorCredit(credit = {}, index = 0) {
  const person = findRecord('authors',credit.creatorSlug);
  return `<div class="chapter-credit-person" data-chapter-credit data-credit-slug="${esc(credit.creatorSlug || '')}"><div class="chapter-credit-person-head"><strong>${esc(person?.name || 'Creador no encontrado')}</strong><button class="button quiet small" type="button" data-remove-chapter-credit>Eliminar del capítulo</button></div>${chapterRoleChoices(credit.roles || [])}</div>`;
}
function chapterExternalCredit(credit = {}, index = 0) {
  return `<div class="chapter-credit-person external-credit-person" data-chapter-external-credit><div class="chapter-credit-person-head"><strong>Colaborador externo</strong><button class="button quiet small" type="button" data-remove-chapter-external>Quitar colaborador</button></div>${field('Nombre', 'chapter-external-name', credit.name || '', { placeholder:'Nombre de la persona' })}${chapterRoleChoices(credit.roles || [],'external')}</div>`;
}
function gallerySection(record, type) {
  const images = type === 'comics' ? (record.gallery || []) : (record.assets?.gallery || []);
  const list = images.map((image,index) => typeof image === 'string' ? { src:image, alt:'' } : image);
  return section('Galería', 'Agrega imágenes complementarias para mostrar el proceso y otras vistas.', `<div class="gallery-grid" data-gallery-list data-gallery-type="${type}">${list.length ? list.map((image,index) => galleryCard(image,index,type)).join('') : '<p class="muted">Todavía no hay imágenes en la galería.</p>'}</div><div class="button-row"><label class="button secondary small">+ Subir imágenes<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" data-add-gallery-files multiple hidden></label></div>`);
}
function galleryCard(image,index,type) {
  const value = type === 'comics' ? image.src || '' : image.file || image.src || '';
  const caption = type === 'comics' ? image.alt || '' : image.caption || '';
  return `<article class="gallery-card" data-gallery-card data-gallery-index="${index}"><div class="gallery-preview">${value ? `<img src="${esc(type === 'projects' ? projectImage(state.editing.original, value) : value)}" alt="">` : 'Sin imagen'}</div><input type="hidden" data-gallery-url value="${esc(value)}">${field('Descripción', 'gallery-caption', caption, { placeholder:'Texto corto para la imagen' })}<button class="button quiet small" type="button" data-remove-gallery>Quitar de la galería</button></article>`;
}
function renderEditor() {
  $('.modal-backdrop')?.remove();
  const editing = state.editing;
  if (!editing) return;
  const { type, original, isNew } = editing;
  const isComic = type === 'comics'; const isCreator = type === 'authors';
  const title = displayName(original);
  const entityName = isComic ? 'comics' : isCreator ? 'authors' : 'projects';
  const inferredCatalogType = original.catalogType || ({ 'Manga':'Manga', 'Novela gráfica':'Novelas', 'Novelas':'Novelas', 'Artbook':'Artbooks', 'Artbooks':'Artbooks', 'Cuentos Infantiles':'Cuentos Infantiles', 'Otro':'Otros', 'Otros':'Otros' }[original.medium] || 'Comics');
  const basic = isComic
    ? section('Información básica', 'Elige el tipo de publicación y si se publica como serie o tomo único.', `<div class="form-grid">${field('Título', 'title', original.title, { placeholder:'Ej. La Armadura de mi Hermano', full:true })}${selectField('Formato de catálogo', 'catalogType', inferredCatalogType, [{value:'',label:'Seleccionar formato'}, ...catalogTypes.map(value=>({value,label:value}))], { hint:'Cómics, manga, cuentos, novelas, artbooks u otros.' })}${selectField('Presentación', 'format', original.format || '', [{value:'',label:'Seleccionar presentación'},{value:'One-shot',label:'Tomo único'},{value:'Series',label:'Serie'},...(original.format && !['One-shot','Series'].includes(original.format) ? [{value:original.format,label:`${original.format} (actual)`}] : [])], { hint:'Indica si es una obra completa o una serie por capítulos.' })}${selectField('Idioma', 'language', original.language || 'Español', ['Español','Inglés','Bilingüe','Otro'].map(value=>({value,label:value})))}${field('Iniciales para portada', 'initials', original.initials || '', { placeholder:'Ej. ARMADURA', hint:'Se usan si todavía no hay portada.' })}${statusField(original)}</div>${slugField(original,isNew,'comics')}`)
    : isCreator
      ? section('Información básica', 'Nombre, perfil y formas de contacto del creador.', `<div class="form-grid">${field('Nombre', 'name', original.name, { placeholder:'Nombre y apellido', full:true })}${field('Nombre público o seudónimo', 'role', original.role || '', { placeholder:'Nombre artístico' })}${field('Rol principal', 'primaryRole', original.primaryRole || '', { placeholder:'Ilustrador, guionista…' })}${field('Instagram', 'instagram', original.instagram || original.social || '', { placeholder:'@usuario o enlace' })}${field('X / Twitter', 'twitter', original.twitter || original.social || '', { placeholder:'@usuario o enlace' })}${field('Sitio web', 'website', original.website || '', { placeholder:'https://…' })}${field('Biografía', 'bio', original.bio || '', { type:'textarea', full:true, rows:5 })}${statusField(original)}</div>${slugField(original,isNew,'authors')}`)
      : section('Información del proyecto', 'Conserva la categoría y los datos existentes; completa solo lo que tengas.', `<div class="form-grid">${field('Título', 'title', original.title, { placeholder:'Nombre del proyecto', full:true })}${selectField('Categoría', 'category', original.category || '', projectCategoryChoices(original.category))}${field('Cliente', 'client', original.client || '', { placeholder:'Nombre del cliente (opcional)' })}${field('Tipo de trabajo', 'type', original.type || '', { placeholder:'Ilustración editorial, cómic…' })}${field('Subtítulo', 'subtitle', original.subtitle || '', { full:true, placeholder:'Frase corta para presentar el proyecto' })}${field('Descripción', 'description', projectDescription(original), { type:'textarea', full:true, rows:6, hint:'Separa cada párrafo con una línea en blanco.' })}${field('Sitio web', 'website', original.externalUrl || '', { placeholder:'https://…' })}${statusField(original)}</div>${slugField(original,isNew,'projects')}`);

  let sections = basic;
  if (isComic) {
    sections += section('Sinopsis', 'Cuenta de qué trata la historia.', field('Sinopsis', 'synopsis', original.synopsis || '', { type:'textarea', full:true, rows:6, placeholder:'Escribe aquí la sinopsis…' }));
    sections += section('Portadas', 'Sube imágenes desde tu equipo. El CMS guarda y coloca los enlaces por ti.', mediaField('Portada principal','comic-cover',original.cover || '') + mediaField('Contraportada','comic-back-cover',original.backCover || '',{ratio:'landscape'}));
    sections += genreSection(original.genres || []);
    sections += creatorSection(original,type) + externalCreditsSection(original) + (original.format==='One-shot'?'':chapterSection(original)) + gallerySection(original,type);
  } else if (isCreator) {
    sections += section('Foto de perfil', 'Usa una imagen clara del creador. Puedes dejarla pendiente.', mediaField('Foto del creador','creator-image',original.image || '',{preview:imageUrl(original.image,'authors',original)}));
    sections += section('Especialidades', 'Selecciona o agrega las áreas en las que trabaja.', chipSection(original.specialties || [], ['Ilustración','Cómic','Diseño','Color','Guion','Lettering','Concept art','Animación'], 'specialties'));
  } else {
    sections += section('Imagen principal', 'La imagen que aparecerá en el catálogo del sitio.', mediaField('Imagen del proyecto','project-hero',original.assets?.hero || '',{ratio:'landscape',preview:projectImage(original)}));
    sections += creatorSection(original,type) + externalCreditsSection(original) + gallerySection(original,type);
    sections += section('Créditos editoriales', 'Agrega aquí la descripción de créditos que ya utiliza la página del proyecto.', `<div class="form-grid">${field('Créditos', 'roleCopy', original.roleCopy || '', { type:'textarea', full:true, rows:4, placeholder:'Ilustración: … · Color: …' })}${field('Quién escribió la historia', 'storyBy', original.storyBy || '', { placeholder:'Nombre (opcional)' })}${field('Quién hizo la ilustración', 'illustrationBy', original.illustrationBy || '', { placeholder:'Nombre o créditos' })}</div>`);
  }
  const overlay = document.createElement('div');
  overlay.className = 'modal-backdrop'; overlay.innerHTML = `<section class="editor-drawer" role="dialog" aria-modal="true" aria-labelledby="editor-title"><header class="drawer-header"><div><p class="eyebrow">${isNew ? 'NUEVO CONTENIDO' : 'EDITAR CONTENIDO'}</p><h2 id="editor-title">${esc(isNew ? `Nuevo ${labels[type]}` : title)}</h2></div><div class="button-row"><button class="button secondary small" type="button" data-preview>Vista previa</button><button class="button quiet" type="button" data-close-editor aria-label="Cerrar editor">Cerrar</button></div></header><form data-editor-form novalidate><div class="drawer-body">${sections}<p class="muted">Las direcciones actuales del sitio se conservan. Los campos que dejes vacíos pueden completarse después.</p></div><footer class="drawer-footer"><button class="button quiet" type="button" data-close-editor>Cancelar</button><div class="button-row"><button class="button secondary save-draft" type="button" data-save-status="draft">Guardar borrador</button><button class="button primary" type="button" data-save-status="current">Guardar cambios</button><button class="button accent" type="button" data-save-status="published">Publicar</button></div></footer></form></section>`;
  document.body.append(overlay);
  bindEditor(overlay);
  $('.editor-drawer', overlay).scrollTop = 0;
}
function projectCategoryChoices(current) {
  const known = [...new Set(['PROPIEDADES ORIGINALES','TRABAJOS PARA CLIENTES','COLABORACIONES','VIDEOJUEGOS Y JUEGOS DE MESA','ILUSTRACIÓN / DISEÑO', ...allRecords('projects').flatMap(item => [item.category, ...(item.categories || [])]).filter(Boolean)])];
  if (current && !known.includes(current)) known.unshift(current);
  return [{value:'',label:'Seleccionar categoría'}, ...known.map(value=>({value,label:value}))];
}
function chipSection(selected, options, name) {
  const choices = [...new Set([...options, ...selected])];
  return `<div class="choice-list" data-chip-list="${name}">${choices.map(value=>`<label class="choice-chip"><input type="checkbox" value="${esc(value)}"${selected.includes(value)?' checked':''}><span>${esc(value)}</span></label>`).join('')}</div><div class="custom-choice"><input type="text" data-new-chip="${name}" placeholder="Añadir especialidad"><button class="button secondary small" type="button" data-add-chip="${name}">Agregar</button></div>`;
}

function bindEditor(overlay) {
  $('[data-editor-form]',overlay).addEventListener('submit',event=>event.preventDefault());
  overlay.addEventListener('click', async event => {
    if (event.target === overlay || event.target.closest('[data-close-editor]')) { closeEditor(); return; }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (event.target.closest('[data-add-creator]')) addCreator(overlay);
    if (event.target.closest('[data-remove-person]')) { event.target.closest('.selected-person').remove(); }
    if (event.target.closest('[data-add-external]')) { $('[data-external-list]', overlay).insertAdjacentHTML('beforeend', externalCreditRow({}, $$('[data-external-credit]',overlay).length)); }
    if (event.target.closest('[data-remove-external]')) event.target.closest('[data-external-credit]').remove();
    if (event.target.closest('[data-add-genre]')) addChip(overlay,'genre');
    if (event.target.closest('[data-add-chip]')) addChip(overlay,event.target.closest('[data-add-chip]').dataset.addChip);
  if (event.target.closest('[data-add-chapter]')) { const list = $('[data-chapter-list]',overlay); list.querySelector('.muted')?.remove(); const workAuthors=$$('[data-person]',overlay).filter(item=>$('[data-person-type]',item).value==='author').map(item=>item.dataset.person); list.insertAdjacentHTML('beforeend',chapterEditor({},$$('[data-chapter-index]',list).length,null,workAuthors)); renumberChapters(list); }
    if (event.target.closest('[data-remove-chapter]')) { event.target.closest('[data-chapter-index]').remove(); renumberChapters($('[data-chapter-list]',overlay)); }
    if (event.target.closest('[data-add-chapter-creator]')) addChapterCreator(event.target.closest('[data-chapter-index]'));
    if (event.target.closest('[data-remove-chapter-credit]')) { const card=event.target.closest('[data-chapter-index]');event.target.closest('[data-chapter-credit]').remove();syncChapterCreatorOptions(card); }
    if (event.target.closest('[data-add-credit-role]')) addChapterRole(event.target.closest('.chapter-credit-person'));
    if (event.target.closest('[data-remove-chapter-external]')) event.target.closest('[data-chapter-external-credit]').remove();
    if (event.target.closest('[data-add-chapter-external]')) { const list=event.target.closest('.chapter-credit-editor').querySelector('[data-chapter-external-list]');list.querySelector('.muted')?.remove();list.insertAdjacentHTML('beforeend',chapterExternalCredit()); }
    if (event.target.closest('[data-remove-gallery]')) event.target.closest('[data-gallery-card]').remove();
    if (event.target.closest('[data-clear-media]')) clearMedia(event.target.closest('[data-media-container]'));
    const saveButton = event.target.closest('[data-save-status]');
    if (saveButton) await saveEditor(saveButton.dataset.saveStatus, overlay, saveButton);
    const previewButton = event.target.closest('[data-preview]');
    if (previewButton) showPreview(overlay);
  });
  overlay.addEventListener('input', event => {
    if (event.target.matches('[data-creator-search]')) filterCreatorChoices(overlay,event.target.value);
    if (event.target.matches('[data-chapter-creator-search]')) filterChapterCreatorChoices(event.target.closest('[data-chapter-index]'),event.target.value);
    if (event.target.name === 'title' || event.target.name === 'name') updateSlugPreview(overlay,event.target.value);
    if (event.target.matches('[data-new-genre]') && event.key === 'Enter') { event.preventDefault(); addChip(overlay,'genre'); }
  });
  overlay.addEventListener('keydown',event=>{
    if(event.key==='Escape'){if($('.preview-layer'))$('.preview-layer').remove();else closeEditor();}
    if(event.key==='Enter' && event.target.matches('[data-new-genre],[data-new-chip]')){event.preventDefault();addChip(overlay,event.target.matches('[data-new-genre]')?'genre':event.target.dataset.newChip);}
    if(event.key==='Enter' && event.target.matches('[data-new-credit-role]')){event.preventDefault();addChapterRole(event.target.closest('.chapter-credit-person'));}
  });
  overlay.addEventListener('change', async event => {
    if (event.target.matches('[data-media-input]') && event.target.files?.[0]) await uploadMedia(event.target.files[0],event.target.closest('[data-media-container]'));
    if (event.target.matches('[data-add-gallery-files]') && event.target.files?.length) await uploadGalleryFiles(event.target.files,overlay);
    if (event.target.matches('[data-person-type]')) $('[data-person-credit]',event.target.closest('[data-person]')).hidden=event.target.value==='author';
    if (event.target.name==='format' && type==='comics') syncChapterSection(overlay,event.target.value);
    if (event.target.name === 'status') state.editing.tempStatus = event.target.value;
  });
  overlay.addEventListener('dragover', event => { if (event.target.closest('[data-media-container]')) { event.preventDefault(); event.target.closest('[data-media-container]').classList.add('dragging'); } });
  overlay.addEventListener('dragleave', event => event.target.closest('[data-media-container]')?.classList.remove('dragging'));
  overlay.addEventListener('drop', async event => {
    const container = event.target.closest('[data-media-container]');
    if (!container || !event.dataTransfer.files?.length) return;
    event.preventDefault(); container.classList.remove('dragging'); await uploadMedia(event.dataTransfer.files[0],container);
  });
}
function syncChapterSection(overlay,format) {
  const current=$('[data-chapter-section]',overlay);
  if(format==='One-shot'){if(current)state.editing.temporaryChapters=serializeChapters(overlay,state.editing.original.chapters||[]);current?.remove();return;}
  if(current)return;
  const sectionHtml=chapterSection({...state.editing.original,chapters:state.editing.temporaryChapters||state.editing.original.chapters||[]});
  const creditsSection=$$('.editor-section',overlay).find(item=>item.querySelector('h3')?.textContent==='Colaboradores externos');
  const gallerySection=$$('.editor-section',overlay).find(item=>item.querySelector('h3')?.textContent==='Galería');
  if(creditsSection)creditsSection.insertAdjacentHTML('afterend',sectionHtml);else if(gallerySection)gallerySection.insertAdjacentHTML('beforebegin',sectionHtml);
}
function filterCreatorChoices(overlay,query) {
  const select = $('[data-creator-choice]',overlay); const needle = query.toLocaleLowerCase();
  for (const option of [...select.options].slice(1)) option.hidden = !option.text.toLocaleLowerCase().includes(needle);
  if (select.selectedOptions[0]?.hidden) select.value = '';
}
function filterChapterCreatorChoices(chapter,query) {
  const select=$('[data-chapter-creator-choice]',chapter);const needle=query.trim().toLocaleLowerCase();
  for(const option of [...select.options].slice(1)) option.hidden=!option.text.toLocaleLowerCase().includes(needle);
  if(select.selectedOptions[0]?.hidden)select.value='';
}
function addChapterCreator(chapter) {
  const select=$('[data-chapter-creator-choice]',chapter);const slug=select.value;const author=findRecord('authors',slug);
  if(!author||$(`[data-credit-slug="${CSS.escape(slug)}"]`,chapter))return;
  const list=$('[data-chapter-credit-list]',chapter);list.querySelector('.muted')?.remove();
  list.insertAdjacentHTML('beforeend',chapterCreatorCredit({creatorSlug:slug,roles:[]}));
  select.querySelector(`option[value="${CSS.escape(slug)}"]`)?.remove();select.value='';$('[data-chapter-creator-search]',chapter).value='';filterChapterCreatorChoices(chapter,'');
}
function syncChapterCreatorOptions(chapter) {
  if(!chapter)return;const select=$('[data-chapter-creator-choice]',chapter);const selected=new Set($$('[data-chapter-credit]',chapter).map(item=>item.dataset.creditSlug));
  for(const author of allRecords('authors')){let option=select.querySelector(`option[value="${CSS.escape(author.slug)}"]`);if(selected.has(author.slug)){option?.remove();continue;}if(!option){option=new Option(author.name,author.slug);option.dataset.search=author.name.toLocaleLowerCase();select.add(option);}}
}
function addChapterRole(person) {
  const input=$('[data-new-credit-role]',person);const role=input?.value.trim();if(!role)return;
  const list=$('[data-credit-role-list]',person);if($$('input',list).some(item=>item.value.toLocaleLowerCase()===role.toLocaleLowerCase())){input.value='';return;}
  list.insertAdjacentHTML('beforeend',`<label class="choice-chip"><input type="checkbox" value="${esc(role)}" checked><span>${esc(role)}</span></label>`);input.value='';
}
function addCreator(overlay) {
  const select = $('[data-creator-choice]',overlay); const slug = select.value; if (!slug) return;
  const author = findRecord('authors',slug); if (!author || $(`[data-person="${CSS.escape(slug)}"]`,overlay)) return;
  const node = $('[data-creators-list]',overlay); node.querySelector('.muted')?.remove();
  node.insertAdjacentHTML('beforeend',`<div class="selected-person" data-person="${esc(slug)}"><div><strong>${esc(author.name)}</strong><small>${esc(author.role || 'Creador')}</small></div><label class="field">Tipo<select data-person-type><option value="collaborator" selected>Colaborador</option><option value="author">Autor</option></select></label><input data-person-credit value="" aria-label="Rol de ${esc(author.name)}" placeholder="Rol o crédito"><button class="button quiet small" type="button" data-remove-person="${esc(slug)}">Quitar</button></div>`);
  select.querySelector(`option[value="${CSS.escape(slug)}"]`)?.remove(); select.value=''; $('[data-creator-search]',overlay).value=''; filterCreatorChoices(overlay,'');
}
function addChip(overlay,name) {
  const input = $(`[data-new-${name === 'genre' ? 'genre' : 'chip'}="${name}"]`,overlay); if (!input) return;
  const value = input.value.trim(); if (!value) return;
  const list = name === 'genre' ? $('[data-genre-list]',overlay) : $(`[data-chip-list="${name}"]`,overlay);
  if ([...list.querySelectorAll('input')].some(item=>item.value.toLocaleLowerCase()===value.toLocaleLowerCase())) { input.value=''; return; }
  list.insertAdjacentHTML('beforeend',`<label class="choice-chip"><input type="checkbox" value="${esc(value)}" checked><span>${esc(value)}</span></label>`); input.value='';
}
function updateSlugPreview(overlay,title) {
  if (!state.editing?.isNew || !state.editing.autoSlug) return;
  const input = $('[name="slug"]',overlay); const type = state.editing.type;
  const base = slugify(title) || `borrador-${type === 'authors' ? 'creador' : type === 'comics' ? 'comic' : 'proyecto'}`;
  const slug = uniqueSlug(type,base);
  input.value = slug;
  $('[data-slug-preview]',overlay).textContent = slug;
  $('#editor-title',overlay).textContent=title.trim() || `Nuevo ${labels[state.editing.type]}`;
  if (type === 'comics' && !$('[name="initials"]',overlay).value) $('[name="initials"]',overlay).value = String(title).trim().split(/\s+/).slice(0,2).join(' ').toLocaleUpperCase();
}
function uniqueSlug(type,base) {
  const known = new Set(allRecords(type).map(item=>item.slug));
  const originalSlug = state.editing?.original?.slug;
  if (originalSlug) known.delete(originalSlug);
  let candidate=base, suffix=2;
  while (known.has(candidate)) candidate=`${base}-${suffix++}`;
  return candidate;
}
function renumberChapters(list) {
  if (!list) return;
  $$('.chapter-card',list).forEach((card,index)=>{card.dataset.chapterIndex=index; $('.chapter-head strong',card).textContent=`Capítulo ${String(card.querySelector('[name="chapter-number"]')?.value || index+1).padStart(2,'0')}`;});
}
function clearMedia(container) {
  if (!container) return;
  $('[data-media-value]',container).value='';
  $('.cover-preview',container).innerHTML='<span>Sin imagen</span>';
  $('.cover-info small',container).textContent='Puedes agregarla ahora o más tarde.';
  $('[data-clear-media]',container).disabled=true;
}
async function uploadMedia(file,container) {
  if (!container) return;
  if (!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(file.type) || file.size > 10*1024*1024) { toast('Elige una imagen JPG, PNG, WebP, GIF o AVIF de hasta 10 MB.',true); return; }
  const button = $('[data-media-input]',container)?.closest('label'); if (button) button.classList.add('uploading');
  try {
    const form = new FormData(); form.append('file',file);
    const result = await api('/api/cms/media',{method:'POST',body:form});
    $('[data-media-value]',container).value=result.url;
    $('.cover-preview',container).innerHTML=`<img src="${esc(result.url)}" alt="Vista previa">`;
    $('.cover-info small',container).textContent='Imagen lista para guardar.';
    $('[data-clear-media]',container).disabled=false;
    toast('Imagen subida. Guarda el contenido para aplicar el cambio.');
  } catch (error) { toast(error.message,true); }
  finally { if (button) button.classList.remove('uploading'); const input=$('[data-media-input]',container); if(input) input.value=''; }
}
async function uploadGalleryFiles(files,overlay) {
  const list=$('[data-gallery-list]',overlay); if (!list) return;
  for (const file of files) {
    const temp=document.createElement('div');
    temp.innerHTML=galleryCard({file:'',src:'',caption:''},$$('[data-gallery-card]',list).length,state.editing.type);
    const card=temp.firstElementChild; list.append(card);
    const hidden=$('[data-gallery-url]',card); const preview=$('.gallery-preview',card);
    try {
      if (!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(file.type) || file.size>10*1024*1024) throw new Error('Elige una imagen compatible de hasta 10 MB.');
      const form=new FormData();form.append('file',file);const result=await api('/api/cms/media',{method:'POST',body:form});
      hidden.value=result.url; preview.innerHTML=`<img src="${esc(result.url)}" alt="">`;
      toast('Imagen subida. Guarda el contenido para aplicar el cambio.');
    } catch(error) { card.remove(); toast(error.message,true); }
  }
}
function formValue(form,name) { return $('[name="'+name+'"]',form)?.value?.trim() || ''; }
function collectChips(rootNode,selector) { return $$(selector,rootNode).filter(input=>input.checked).map(input=>input.value); }
function serializeChapters(overlay,originalChapters=[]) {
  return $$('[data-chapter-index]',overlay).map((card,index)=>{
    const originalIndex=card.dataset.originalIndex;
    const prior=originalIndex === '' ? {} : (originalChapters[Number(originalIndex)] || {});
    const credits=$$('[data-chapter-credit]',card).map(person=>({creatorSlug:person.dataset.creditSlug,roles:collectChips(person,'[data-credit-role-list] input'),order:$$('[data-chapter-credit]',card).indexOf(person)})).filter(credit=>credit.creatorSlug&&credit.roles.length);
    const externalCredits=$$('[data-chapter-external-credit]',card).map((person,order)=>({name:formValue(person,'chapter-external-name'),roles:collectChips(person,'[data-credit-role-list] input'),order})).filter(credit=>credit.name&&credit.roles.length);
    return {...prior,id:card.dataset.chapterId||crypto.randomUUID(),number:Number($('[name="chapter-number"]',card).value)||index+1,title:formValue(card,'chapter-title'),synopsis:formValue(card,'chapter-synopsis'),cover:$('[data-media-value]',card)?.value||'',status:formValue(card,'chapter-status')||'draft',digitalUrl:formValue(card,'chapter-digital'),physicalUrl:formValue(card,'chapter-physical'),credits,externalCredits};
  }).filter(item=>item.title || item.cover || item.synopsis).sort((a,b)=>a.number-b.number);
}
function serializeExternalCredits(overlay) {
  return $$('[data-external-credit]',overlay).map(card=>({name:formValue(card,'external-name'),role:formValue(card,'external-role')})).filter(item=>item.name||item.role).map(item=>item.role?`${item.role}: ${item.name}`:item.name);
}
function serializeCreators(overlay) {
  const creatorSlugs=[];const creatorCredits={};const workAuthorSlugs=[];
  $$('[data-person]',overlay).forEach(item=>{const slug=item.dataset.person;creatorSlugs.push(slug);const isAuthor=$('[data-person-type]',item).value==='author';if(isAuthor)workAuthorSlugs.push(slug);const credit=isAuthor?'Autor':$('[data-person-credit]',item).value.trim();if(credit)creatorCredits[slug]=credit;});
  return {creatorSlugs,creatorCredits,workAuthorSlugs};
}
function serializeGallery(overlay,type) {
  return $$('[data-gallery-card]',overlay).map(card=>{
    const src=$('[data-gallery-url]',card)?.value || '';const caption=card.querySelector('[name="gallery-caption"]')?.value.trim() || '';
    return type==='comics'?{src,alt:caption}:{file:src,caption};
  }).filter(item=>type==='comics'?item.src:item.file);
}
function buildPayload(overlay,status) {
  const editing=state.editing; const {type,original,isNew}=editing; const form=$('[data-editor-form]',overlay);
  const payload=structuredClone(original); const normalizedStatus=status==='current'?formValue(form,'status'):status;
  payload.status=normalizedStatus || 'draft';
  if(type==='comics') {
    payload.title=formValue(form,'title');payload.slug=formValue(form,'slug')||uniqueSlug(type,slugify(payload.title)||'borrador-comic');payload.initials=formValue(form,'initials')||payload.title.slice(0,18).toLocaleUpperCase();
    payload.catalogType=formValue(form,'catalogType');payload.format=formValue(form,'format');payload.language=formValue(form,'language');payload.synopsis=formValue(form,'synopsis');payload.cover=$('[data-media-container="comic-cover"] [data-media-value]',overlay)?.value||'';payload.backCover=$('[data-media-container="comic-back-cover"] [data-media-value]',overlay)?.value||'';
    payload.genres=collectChips(overlay,'[data-genre-list] input');Object.assign(payload,serializeCreators(overlay));payload.externalCredits=serializeExternalCredits(overlay);payload.chapters=serializeChapters(overlay,original.chapters||[]);payload.gallery=serializeGallery(overlay,'comics');
    if(payload.chapters.length){payload.chapterCount=Math.max(...payload.chapters.map(ch=>ch.number));payload.availableChapters=payload.chapters.filter(ch=>normStatus(ch.status)==='published').length;}
  } else if(type==='authors') {
    payload.name=formValue(form,'name');payload.slug=formValue(form,'slug')||uniqueSlug(type,slugify(payload.name)||'borrador-creador');payload.role=formValue(form,'role');payload.primaryRole=formValue(form,'primaryRole');payload.image=$('[data-media-container="creator-image"] [data-media-value]',overlay)?.value||'';payload.bio=formValue(form,'bio');payload.specialties=collectChips(overlay,'[data-chip-list="specialties"] input');payload.social=formValue(form,'instagram')||formValue(form,'twitter')||'';payload.instagram=formValue(form,'instagram');payload.twitter=formValue(form,'twitter');payload.website=formValue(form,'website');
  } else {
    payload.title=formValue(form,'title');payload.slug=formValue(form,'slug')||uniqueSlug(type,slugify(payload.title)||'borrador-proyecto');payload.category=formValue(form,'category');payload.categories=[...new Set([...(original.categories||[]).filter(value=>value!==original.category),payload.category].filter(Boolean))];payload.client=formValue(form,'client');payload.type=formValue(form,'type');payload.subtitle=formValue(form,'subtitle');payload.storyCopy=formValue(form,'description').split(/\n\s*\n/).map(part=>part.trim()).filter(Boolean);payload.externalUrl=formValue(form,'website');payload.roleCopy=formValue(form,'roleCopy');payload.storyBy=formValue(form,'storyBy');payload.illustrationBy=formValue(form,'illustrationBy');
    Object.assign(payload,serializeCreators(overlay));payload.externalCredits=serializeExternalCredits(overlay);payload.assets={...(payload.assets||{}),hero:$('[data-media-container="project-hero"] [data-media-value]',overlay)?.value||'',gallery:serializeGallery(overlay,'projects')};
  }
  if(isNew && !payload.slug) payload.slug=`borrador-${type}-${Date.now()}`;
  if(type==='comics' && payload.format==='One-shot'){payload.chapters=[];payload.chapterCount=0;payload.availableChapters=0;}
  return payload;
}
function publishRequirements(type,payload) {
  if(type==='comics' && (!payload.title || !payload.cover)) return 'Para publicar un cómic, completa el título y agrega una portada.';
  if(type==='authors' && !payload.name) return 'Para publicar un perfil, escribe el nombre del creador.';
  if(type==='projects' && (!payload.title || !payload.category)) return 'Para publicar un proyecto, completa el título y la categoría.';
  return '';
}
async function saveEditor(intent,overlay,button) {
  const status=intent==='current'?'current':intent;
  const payload=buildPayload(overlay,status);
  const realStatus=status==='current'?(formValue($('[data-editor-form]',overlay),'status')||'draft'):status;
  if(realStatus==='published') { const problem=publishRequirements(state.editing.type,payload);if(problem){toast(problem,true);return;} }
  const form=$('[data-editor-form]',overlay);const titleInput=form.querySelector('[name="title"], [name="name"]');
  if(!payload.slug) payload.slug=uniqueSlug(state.editing.type,slugify(titleInput?.value)||`borrador-${Date.now()}`);
  const buttons=$$('[data-save-status]',overlay);buttons.forEach(item=>item.disabled=true);
  const oldLabel=button.textContent;button.textContent='Guardando…';
  try {
    await api('/api/cms/content',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({type:state.editing.type,slug:payload.slug,payload})});
    await refreshContent();
    const wasNew=state.editing.isNew;state.editing={type:state.editing.type,original:payload,isNew:false,autoSlug:false};
    if(wasNew) history.replaceState({},'',`/admin/${state.editing.type==='authors'?'creators':state.editing.type}/${encodeURIComponent(payload.slug)}`);
    const route=state.route;renderRoute();renderEditor();
    toast(payload.status==='published'?'Contenido publicado correctamente.':payload.status==='archived'?'Contenido archivado.':'Borrador guardado correctamente.');
  } catch(error) { console.error(error);toast(error.message||'No se pudo guardar el contenido. Revisa los campos e inténtalo de nuevo.',true); }
  finally { if(document.body.contains(button)){buttons.forEach(item=>item.disabled=false);button.textContent=oldLabel;} }
}

function showPreview(overlay) {
  const payload=buildPayload(overlay,'current');const type=state.editing.type;
  const image=type==='comics'?payload.cover:type==='authors'?payload.image:payload.assets?.hero;
  const description=type==='comics'?payload.synopsis:type==='authors'?payload.bio:projectDescription(payload);
  const detail=type==='comics'?`${payload.format||'Formato por agregar'} · ${(payload.genres||[]).join(' · ')||'Géneros por agregar'}`:type==='authors'?(payload.role||'Perfil creativo'):([payload.client,payload.category].filter(Boolean).join(' · '));
  const preview=document.createElement('div');preview.className='preview-layer';preview.innerHTML=`<div class="preview-card" role="dialog" aria-modal="true"><div class="preview-header"><strong>Vista previa</strong><button class="button quiet small" type="button" data-close-preview>Cerrar</button></div>${image?`<img class="preview-image" src="${esc(type==='projects'?projectImage(payload,image):image)}" alt="">`:''}<div class="preview-copy"><p class="eyebrow">${esc(detail)}</p><h2>${esc(displayName(payload)||'Borrador sin título')}</h2><p>${esc(description||'La descripción aparecerá aquí cuando la agregues.')}</p>${payload.creatorSlugs?.length?`<p class="muted">Creado por ${esc(creatorNames(payload.creatorSlugs).join(' · '))}</p>`:''}</div></div>`;
  document.body.append(preview);preview.addEventListener('click',event=>{if(event.target===preview||event.target.closest('[data-close-preview]'))preview.remove();});
}

async function checkSession() {
  try { const session=await api('/api/cms/session'); if(session.authenticated) await openCms(session.user); }
  catch { /* Keep the sign-in form available if the session endpoint is temporarily unavailable. */ }
}
checkSession();
