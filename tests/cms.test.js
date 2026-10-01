import test from 'node:test';
import assert from 'node:assert/strict';
import { getContent, handleCms, serveMedia } from '../worker/cms.js';
import { pageMetadata, publicRoutes, resolvePage } from '../seo-data.js';

function makeEnv() {
  const rows = new Map();
  const media = new Map();
  const db = {
    prepare(sql) {
      let values = [];
      return {
        bind(...args) { values = args; return this; },
        async all() {
          if (sql.includes('FROM cms_content')) return { results: [...rows.values()] };
          return { results: [] };
        },
        async run() {
          if (sql.includes('INSERT INTO cms_content')) {
            const [entity_type, slug, payload] = values;
            rows.set(`${entity_type}:${slug}`, { entity_type, slug, payload, is_deleted: 0 });
          } else if (sql.includes('DELETE FROM cms_content')) rows.delete(`${values[0]}:${values[1]}`);
          return { success: true };
        },
      };
    },
  };
  return {
    CMS_DB: db,
    CMS_ADMIN_PASSWORD: 'local-test-password',
    CMS_SESSION_SECRET: 'test-only-secret-value',
    CMS_MEDIA: {
      async put(key, body, options) { media.set(key, { body, httpEtag: '"test"', writeHttpMetadata(headers) { headers.set('content-type', options.httpMetadata.contentType); } }); },
      async get(key) { return media.get(key) || null; },
    },
  };
}

async function api(env, path, { method = 'GET', body, cookie } = {}) {
  const url = new URL(path, 'http://localhost');
  const headers = new Headers({ Origin: url.origin });
  if (body instanceof FormData) { /* Request sets multipart headers and boundary. */ }
  else if (body !== undefined) headers.set('content-type', 'application/json');
  if (cookie) headers.set('cookie', cookie);
  const request = new Request(url, { method, headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) });
  return handleCms(request, env, url);
}

async function signedIn(env) {
  const response = await api(env, '/api/cms/login', { method: 'POST', body: { password: env.CMS_ADMIN_PASSWORD } });
  assert.equal(response.status, 200);
  return response.headers.get('set-cookie').split(';')[0];
}

test('admin authentication, draft visibility, publication validation, and relationship derivation', async () => {
  const env = makeEnv();
  assert.equal((await api(env, '/api/cms/content')).status, 401);
  const cookie = await signedIn(env);
  const author = { slug: 'ana-audit', name: 'Ana Audit', status: 'published' };
  assert.equal((await api(env, '/api/cms/content', { method: 'PUT', cookie, body: { type: 'authors', slug: author.slug, payload: author } })).status, 200);
  const draft = { slug: 'cms-audit-draft', title: 'Draft from audit', status: 'draft', creatorSlugs: ['ana-audit'] };
  let response = await api(env, '/api/cms/content', { method: 'PUT', cookie, body: { type: 'comics', slug: draft.slug, payload: draft } });
  assert.equal(response.status, 200);
  let publicData = await (await api(env, '/api/content')).json();
  assert.equal(publicData.comics.some(item => item.slug === draft.slug), false);
  const privateData = await (await api(env, '/api/cms/content', { cookie })).json();
  assert.equal(privateData.comics.some(item => item.slug === draft.slug), true);
  assert.equal(privateData.authors.find(item => item.slug === 'ana-audit')?.comicSlugs.includes(draft.slug), true);
  assert.equal(publicData.authors.find(item => item.slug === 'ana-audit')?.comicSlugs.includes(draft.slug), false);

  response = await api(env, '/api/cms/content', { method: 'PUT', cookie, body: { type: 'comics', slug: draft.slug, payload: { ...draft, status: 'archived' } } });
  assert.equal(response.status, 200);
  publicData = await (await api(env, '/api/content')).json();
  assert.equal(publicData.comics.some(item => item.slug === draft.slug), false);

  response = await api(env, '/api/cms/content', { method: 'PUT', cookie, body: { type: 'comics', slug: draft.slug, payload: { ...draft, status: 'published' } } });
  assert.equal(response.status, 400);
  const published = { ...draft, title: 'Published from audit', cover: '/media/audit-cover.jpg', status: 'published' };
  response = await api(env, '/api/cms/content', { method: 'PUT', cookie, body: { type: 'comics', slug: draft.slug, payload: published } });
  assert.equal(response.status, 200);
  publicData = await (await api(env, '/api/content')).json();
  assert.equal(publicData.comics.some(item => item.slug === draft.slug), true);
  assert.equal(publicData.authors.find(item => item.slug === 'ana-audit')?.comicSlugs.includes(draft.slug), true);
  response = await api(env, '/api/cms/content', { method: 'DELETE', cookie, body: { type: 'comics', slug: draft.slug } });
  assert.equal(response.status, 200);
  publicData = await (await api(env, '/api/content')).json();
  assert.equal(publicData.comics.some(item => item.slug === draft.slug), false);
});

test('media upload validates image signature and serves uploaded bytes', async () => {
  const env = makeEnv();
  const cookie = await signedIn(env);
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0])], { type: 'image/png' }), 'cover.png');
  let response = await api(env, '/api/cms/media', { method: 'POST', cookie, body: form });
  assert.equal(response.status, 200);
  const uploaded = await response.json();
  assert.match(uploaded.url, /^\/media\/[\w-]+\.png$/);
  const mediaUrl = new URL(`http://localhost${uploaded.url}`);
  const mediaResponse = await serveMedia(new Request(mediaUrl), env, mediaUrl);
  assert.equal(mediaResponse.status, 200);
  const object = await env.CMS_MEDIA.get(uploaded.key);
  assert.ok(object);
});

test('login, same-origin checks, logout, and session invalidation', async () => {
  const env = makeEnv();
  const wrongLogin = await api(env, '/api/cms/login', { method: 'POST', body: { password: 'incorrecta' } });
  assert.equal(wrongLogin.status, 401);
  const crossOriginUrl = new URL('http://localhost/api/cms/login');
  const crossOrigin = await handleCms(new Request(crossOriginUrl, {
    method: 'POST', headers: { Origin: 'https://attacker.example', 'content-type': 'application/json' },
    body: JSON.stringify({ password: env.CMS_ADMIN_PASSWORD }),
  }), env, crossOriginUrl);
  assert.equal(crossOrigin.status, 403);
  const cookie = await signedIn(env);
  assert.deepEqual(await (await api(env, '/api/cms/session', { cookie })).json(), { authenticated: true });
  const logout = await api(env, '/api/cms/logout', { method: 'POST', cookie });
  assert.equal(logout.status, 200);
  const session = await (await api(env, '/api/cms/session')).json();
  assert.deepEqual(session, { authenticated: false });
  assert.equal((await api(env, '/api/cms/content')).status, 401);
});

test('public CMS content derives creator reverse-links from comic relationships', async () => {
  const data = await getContent(makeEnv());
  const comic = data.comics.find(item => (item.creatorSlugs || []).length);
  assert.ok(comic);
  const creator = data.authors.find(item => item.slug === comic.creatorSlugs[0]);
  assert.ok(creator.comicSlugs.includes(comic.slug));
});

test('SEO uses editor overrides and keeps published routes while omitting drafts', async () => {
  const env = makeEnv();
  const cookie = await signedIn(env);
  const payload = { slug: 'seo-audit-comic', title: 'SEO audit comic', cover: '/banner.jpg', synopsis: 'Descripción editorial.', seoTitle: 'Título SEO de prueba', seoDescription: 'Descripción SEO de prueba.', status: 'published' };
  await api(env, '/api/cms/content', { method: 'PUT', cookie, body: { type: 'comics', slug: payload.slug, payload } });
  const content = await getContent(env);
  const metadata = pageMetadata(`/comics/${payload.slug}`, 'https://alphaeve.example', content);
  assert.equal(metadata.title, payload.seoTitle);
  assert.equal(metadata.description, payload.seoDescription);
  assert.ok(publicRoutes(content).includes(`/comics/${payload.slug}`));
  assert.equal(resolvePage('/comics/nonexistent-audit-slug', 'https://alphaeve.example', content), null);
});
