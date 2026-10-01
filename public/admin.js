const $ = selector => document.querySelector(selector);
const loginPanel = $('#login-panel');
const cmsPanel = $('#cms-panel');
const typeSelect = $('#type');
const entriesRoot = $('#entries');
const editor = $('#editor');
const state = { content: {}, selected: null, filter: '' };
const labels = { comics: 'Cómic', authors: 'Autor', projects: 'Proyecto' };
const templates = {
  comics: { title: 'Nuevo cómic', slug: 'nuevo-comic', initials: 'NUEVO', format: null, genres: [], status: null, synopsis: null, cover: '', creatorSlugs: [], creatorCredits: {}, chapters: [], characters: [], gallery: [] },
  authors: { name: 'Nuevo autor', slug: 'nuevo-autor', image: '', role: '', social: '', bio: null, specialties: [], comicSlugs: [], projectSlugs: [] },
  projects: { title: 'Nuevo proyecto', slug: 'nuevo-proyecto', category: '', categories: [], client: '', type: '', creatorSlugs: [], assetDir: '', assets: { gallery: [] } },
};

async function api(path, options = {}) {
  const response = await fetch(path, { cache: 'no-store', ...options });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Error ${response.status}`);
  return result;
}
function status(message, isError = false) {
  const node = $('#cms-status');
  node.textContent = message;
  node.style.color = isError ? '#9d2328' : '#365f42';
}
function keyOf(record) { return `${typeSelect.value}:${record.slug}`; }
function displayName(record) { return record.title || record.name || record.slug; }
function isNew(record) { return record.__new === true; }

async function loadContent() {
  state.content = await api('/api/content');
  renderEntries();
  if (state.selected) {
    const [, slug] = state.selected.split(':');
    const record = (state.content[typeSelect.value] || []).find(item => item.slug === slug);
    if (record) selectRecord(record);
    else clearEditor();
  }
}
function renderEntries() {
  const list = state.content[typeSelect.value] || [];
  const query = state.filter.trim().toLocaleLowerCase();
  const visible = list.filter(item => `${displayName(item)} ${item.slug}`.toLocaleLowerCase().includes(query));
  entriesRoot.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'muted'; empty.textContent = 'No hay registros que coincidan.';
    entriesRoot.append(empty); return;
  }
  for (const record of visible) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = `entry${state.selected === keyOf(record) ? ' active' : ''}`;
    const title = document.createElement('span'); title.textContent = displayName(record);
    const slug = document.createElement('small'); slug.textContent = record.slug;
    button.append(title, slug); button.addEventListener('click', () => selectRecord(record));
    entriesRoot.append(button);
  }
}
function selectRecord(record) {
  state.selected = keyOf(record);
  $('#record-title').textContent = displayName(record);
  $('#record-slug').textContent = `/${typeSelect.value}/${record.slug} · slug fijo`;
  editor.value = JSON.stringify(Object.fromEntries(Object.entries(record).filter(([key]) => key !== '__new')), null, 2);
  editor.disabled = false; $('#save').disabled = false; $('#reset').disabled = false;
  $('#reset').textContent = isNew(record) ? 'Eliminar registro nuevo' : 'Restaurar datos originales';
  $('#media-url').textContent = ''; $('#copy-url').classList.add('hidden');
  status(''); renderEntries();
}
function clearEditor() {
  state.selected = null;
  $('#record-title').textContent = 'Selecciona un registro'; $('#record-slug').textContent = '';
  editor.value = ''; editor.disabled = true; $('#save').disabled = true; $('#reset').disabled = true;
  renderEntries();
}

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button'); button.disabled = true;
  $('#login-status').textContent = 'Verificando…';
  try {
    await api('/api/cms/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: new FormData(event.currentTarget).get('password') }) });
    await openCms();
  } catch (error) { $('#login-status').textContent = error.message; }
  finally { button.disabled = false; }
});

async function openCms() {
  const session = await api('/api/cms/session');
  if (!session.authenticated) return;
  loginPanel.classList.add('hidden'); cmsPanel.classList.remove('hidden');
  await loadContent();
}

typeSelect.addEventListener('change', () => { state.selected = null; clearEditor(); loadContent().catch(error => status(error.message, true)); });
$('#search').addEventListener('input', event => { state.filter = event.target.value; renderEntries(); });
$('#new').addEventListener('click', () => {
  const type = typeSelect.value;
  let index = 1;
  let slug = templates[type].slug;
  const known = new Set((state.content[type] || []).map(record => record.slug));
  while (known.has(slug)) { index++; slug = `${templates[type].slug}-${index}`; }
  const record = { ...structuredClone(templates[type]), slug, ...(type === 'comics' ? { title: `Nuevo cómic ${index}` } : type === 'authors' ? { name: `Nuevo autor ${index}` } : { title: `Nuevo proyecto ${index}` }), __new: true };
  (state.content[type] ||= []).unshift(record); selectRecord(record);
});
$('#save').addEventListener('click', async () => {
  try {
    const payload = JSON.parse(editor.value);
    const selectedSlug = state.selected?.split(':').slice(1).join(':');
    if (payload.slug !== selectedSlug) throw new Error('El slug debe conservarse y coincidir con el registro seleccionado.');
    if (typeSelect.value === 'authors' ? !payload.name : !payload.title) throw new Error('Completa el nombre o título antes de guardar.');
    const button = $('#save'); button.disabled = true; status('Guardando…');
    await api('/api/cms/content', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: typeSelect.value, slug: payload.slug, payload }) });
    await loadContent(); status('Guardado en D1. El sitio público ya puede leer los cambios.');
  } catch (error) { status(error.message, true); }
  finally { $('#save').disabled = !state.selected; }
});
$('#reset').addEventListener('click', async () => {
  const selectedSlug = state.selected?.split(':').slice(1).join(':');
  if (!selectedSlug) return;
  const existing = (state.content[typeSelect.value] || []).find(item => item.slug === selectedSlug);
  const prompt = isNew(existing) ? `¿Eliminar el registro nuevo “${displayName(existing)}”?` : `¿Restaurar “${displayName(existing)}” a su versión original?`;
  if (!confirm(prompt)) return;
  try {
    await api('/api/cms/content', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: typeSelect.value, slug: selectedSlug }) });
    clearEditor(); await loadContent(); status('Listo.');
  } catch (error) { status(error.message, true); }
});
$('#logout').addEventListener('click', async () => {
  await api('/api/cms/logout', { method: 'POST' }).catch(() => {});
  location.reload();
});
$('#upload').addEventListener('click', async () => {
  const file = $('#media-file').files?.[0];
  if (!file) { status('Selecciona primero una imagen.', true); return; }
  const button = $('#upload'); button.disabled = true; status('Subiendo imagen a R2…');
  try {
    const form = new FormData(); form.append('file', file);
    const result = await api('/api/cms/media', { method: 'POST', body: form });
    $('#media-url').textContent = result.url; $('#copy-url').classList.remove('hidden');
    status(`Imagen guardada en R2 (${Math.ceil(result.size / 1024)} KB). Pega ${result.url} en el campo de imagen del JSON.`);
  } catch (error) { status(error.message, true); }
  finally { button.disabled = false; }
});
$('#copy-url').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#media-url').textContent); status('URL copiada. Pégala en el campo de imagen correspondiente.'); }
  catch { status('Copia manualmente la URL mostrada.', true); }
});

api('/api/cms/session').then(session => session.authenticated ? openCms() : null).catch(() => {});
