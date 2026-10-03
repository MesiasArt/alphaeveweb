import test from 'node:test';
import assert from 'node:assert/strict';
import { getContent, handleCms, serveMedia } from '../worker/cms.js';
import { pageMetadata, publicRoutes, resolvePage } from '../seo-data.js';
import { comics as seedComics } from '../seo-data.js';

function makeEnv() {
  const rows = new Map();
  const media = new Map();
  const chapters = new Map();
  const credits = [];
  const creators = new Map();
  const comics = new Map();
  const migrationState = new Set();
  const users = new Map();
  const db = {
    prepare(sql) {
      let values = [];
      const statement = {
        sql,
        bind(...args) { values = args; return this; },
        async all() {
          if (sql.includes('FROM cms_content')) return { results: [...rows.values()] };
          if (sql.includes('FROM cms_users')) return { results: [...users.values()] };
          if (sql.includes('FROM cms_migration_state')) return { results: migrationState.has(values[0] || 'credit_relationships_v1') ? [{ state_key: 'credit_relationships_v1' }] : [] };
          if (sql.includes('FROM cms_credits')) return { results: values.length ? credits.filter(row => row.creator_slug === values[0]).slice(0,1) : [...credits] };
          return { results: [] };
        },
        async first() {
          if (sql.includes('FROM cms_users') && sql.includes('WHERE username')) return [...users.values()].find(row => row.username.toLowerCase() === String(values[0]).toLowerCase()) || null;
          if (sql.includes('FROM cms_users') && sql.includes('user_id')) return [...users.values()].find(row => row.user_id === values[0]) || null;
          if (sql.includes('FROM cms_users') && sql.includes('author_slug')) return [...users.values()].find(row => row.author_slug === values[0]) || null;
          return null;
        },
        async run() {
          if (sql.includes('INSERT INTO cms_users')) { const [user_id,username,author_slug,password_salt,password_hash]=values; if([...users.values()].some(row=>row.author_slug===author_slug||row.username.toLowerCase()===username.toLowerCase()))throw new Error('duplicate');users.set(user_id,{user_id,username,author_slug,password_salt,password_hash,is_active:1,must_change_password:1}); }
          else if (sql.includes('UPDATE cms_users SET is_active')) { const row=[...users.values()].find(item=>item.author_slug===values[1]);if(row)row.is_active=values[0];return {success:true,meta:{changes:row?1:0}}; }
          else if (sql.includes('UPDATE cms_users SET password_salt') && sql.includes('WHERE author_slug')) { const row=[...users.values()].find(item=>item.author_slug===values.at(-1));if(row){row.password_salt=values[0];row.password_hash=values[1];row.is_active=1;row.must_change_password=1;}return {success:true,meta:{changes:row?1:0}}; }
          else if (sql.includes('UPDATE cms_users SET password_salt')) { const row=users.get(values.at(-1));if(row){row.password_salt=values[0];row.password_hash=values[1];row.must_change_password=0;}return {success:true,meta:{changes:row?1:0}}; }
          else if (sql.includes('INSERT INTO cms_content')) {
            const [entity_type, slug, payload] = values;
            rows.set(`${entity_type}:${slug}`, { entity_type, slug, payload, is_deleted: 0 });
          } else if (sql.includes('DELETE FROM cms_content')) rows.delete(`${values.length === 1 ? 'comics' : values[0]}:${values.at(-1)}`);
          else if (sql.includes('INSERT INTO cms_comics')) comics.set(values[0], { slug: values[0], title: values[1] });
          else if (sql.includes('INSERT INTO cms_creators')) creators.set(values[0], { slug: values[0], name: values[1] });
          else if (sql.includes('DELETE FROM cms_credits')) { for (let index=credits.length-1;index>=0;index--) if(credits[index].comic_slug===values[0])credits.splice(index,1); }
          else if (sql.includes('DELETE FROM cms_chapters')) { for (const [key,chapter] of chapters) if(chapter.comic_slug===values[0])chapters.delete(key); }
          else if (sql.includes('DELETE FROM cms_comics')) comics.delete(values[0]);
          else if (sql.includes('INSERT INTO cms_chapters')) { const [comic_slug,chapter_id,chapter_number,title,position]=values;chapters.set(`${comic_slug}:${chapter_id}`,{comic_slug,chapter_id,chapter_number,title,position}); }
          else if (sql.includes('INSERT') && sql.includes('INTO cms_credits')) {
            let row;
            if (sql.includes('VALUES (?, NULL, ?, NULL, ?, ?)')) { const [comic_slug,creator_slug,role,position]=values;row={comic_slug,chapter_id:null,creator_slug,external_name:null,role,position}; }
            else if (sql.includes('VALUES (?, ?, ?, NULL, ?, ?)')) { const [comic_slug,chapter_id,creator_slug,role,position]=values;row={comic_slug,chapter_id,creator_slug,external_name:null,role,position}; }
            else { const [comic_slug,chapter_id,external_name,role,position]=values;row={comic_slug,chapter_id,creator_slug:null,external_name,role,position}; }
            if (row.chapter_id && !chapters.has(`${row.comic_slug}:${row.chapter_id}`)) throw new Error('Missing chapter FK');
            if (row.creator_slug && !creators.has(row.creator_slug)) throw new Error('Missing creator FK');
            if (!credits.some(existing=>existing.comic_slug===row.comic_slug&&existing.chapter_id===row.chapter_id&&existing.creator_slug===row.creator_slug&&existing.external_name===row.external_name&&existing.role===row.role)) credits.push(row);
          } else if (sql.includes('cms_migration_state')) migrationState.add(values[0] || 'credit_relationships_v1');
          return { success: true };
        },
      };
      return statement;
    },
    async batch(statements) { for (const statement of statements) await statement.run(); return []; },
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

test('author accounts can edit only their profile and comics they own, with forced password change', async () => {
  const env = makeEnv();
  const admin = await signedIn(env);
  for (const person of [{slug:'ana-owner',name:'Ana Owner',status:'published'},{slug:'luz-owner',name:'Luz Owner',status:'published'}]) {
    assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:admin,body:{type:'authors',slug:person.slug,payload:person}})).status,200);
  }
  const owned = {slug:'ana-work',title:'Ana Work',cover:'/banner.jpg',status:'published',creatorSlugs:['ana-owner','luz-owner'],creatorCredits:{'ana-owner':'Autora','luz-owner':'Color'},workAuthorSlugs:['ana-owner'],chapters:[]};
  const collaboratorOnly = {slug:'luz-work',title:'Luz Work',cover:'/banner.jpg',status:'published',creatorSlugs:['luz-owner','ana-owner'],creatorCredits:{'luz-owner':'Autora','ana-owner':'Color'},workAuthorSlugs:['luz-owner'],chapters:[]};
  for (const comic of [owned,collaboratorOnly]) assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:admin,body:{type:'comics',slug:comic.slug,payload:comic}})).status,200);
  const created = await api(env,'/api/cms/users',{method:'POST',cookie:admin,body:{action:'create',authorSlug:'ana-owner',username:'ana',password:'temporary-pass-123'}});
  assert.equal(created.status,201);
  const login = await api(env,'/api/cms/login',{method:'POST',body:{username:'ana',password:'temporary-pass-123'}});
  assert.equal(login.status,200);
  const authorCookie=login.headers.get('set-cookie').split(';')[0];
  const session=await (await api(env,'/api/cms/session',{cookie:authorCookie})).json();
  assert.equal(session.authenticated,true,JSON.stringify({login:await login.clone().json(),session}));
  assert.equal(session.user.role,'author');
  assert.equal(session.user.mustChangePassword,true);
  let scoped=await (await api(env,'/api/cms/content',{cookie:authorCookie})).json();
  assert.deepEqual(scoped.comics.map(item=>item.slug),['ana-work']);
  assert.deepEqual(scoped.authors.map(item=>item.slug),['ana-owner']);
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'comics',slug:'luz-work',payload:collaboratorOnly}})).status,403);
  const forged={...owned,title:'Updated title',creatorSlugs:['luz-owner'],creatorCredits:{},workAuthorSlugs:['luz-owner']};
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'comics',slug:'ana-work',payload:forged}})).status,403); // temporary password must be changed first
  assert.equal((await api(env,'/api/cms/password',{method:'POST',cookie:authorCookie,body:{currentPassword:'temporary-pass-123',newPassword:'permanent-pass-456'}})).status,200);
  const edited = {...owned, title:'Updated title', creatorSlugs:['ana-owner'], creatorCredits:{'ana-owner':'Autor'}, workAuthorSlugs:['ana-owner']};
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'comics',slug:'ana-work',payload:edited}})).status,200);
  scoped=await (await api(env,'/api/cms/content',{cookie:authorCookie})).json();
  assert.equal(scoped.comics[0].title,'Updated title');
  assert.deepEqual(scoped.comics[0].workAuthorSlugs,['ana-owner']);
  assert.deepEqual(scoped.comics[0].creatorSlugs,['ana-owner']);
  const profile = {...scoped.authors[0], bio:'Updated biography', status:'draft'};
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'authors',slug:'ana-owner',payload:profile}})).status,200);
  const updatedProfile = (await (await api(env,'/api/cms/content',{cookie:authorCookie})).json()).authors[0];
  assert.equal(updatedProfile.bio,'Updated biography');
  assert.equal(updatedProfile.status,'draft');
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'authors',slug:'luz-owner',payload:{...profile,slug:'luz-owner'}}})).status,403);
  assert.equal((await api(env,'/api/cms/users',{cookie:authorCookie})).status,403);
  await api(env,'/api/cms/users',{method:'POST',cookie:admin,body:{action:'disable',authorSlug:'ana-owner'}});
  assert.equal((await (await api(env,'/api/cms/session',{cookie:authorCookie})).json()).authenticated,false);
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
  assert.deepEqual(await (await api(env, '/api/cms/session', { cookie })).json(), { authenticated: true, user: { role:'admin', username:'admin', mustChangePassword:false } });
  const logout = await api(env, '/api/cms/logout', { method: 'POST', cookie });
  assert.equal(logout.status, 200);
  const session = await (await api(env, '/api/cms/session')).json();
  assert.deepEqual(session, { authenticated: false, user: null });
  assert.equal((await api(env, '/api/cms/content')).status, 401);
});

test('public CMS content derives creator reverse-links from comic relationships', async () => {
  const data = await getContent(makeEnv());
  const comic = data.comics.find(item => (item.creatorSlugs || []).length);
  assert.ok(comic);
  const creator = data.authors.find(item => item.slug === comic.creatorSlugs[0]);
  assert.ok(creator.comicSlugs.includes(comic.slug));
});

test('first authenticated editor load backfills existing series credits without inventing chapter credits', async () => {
  const env = makeEnv();
  const cookie = await signedIn(env);
  const before = seedComics.find(comic=>comic.slug==='baka-el-mito-asesino');
  await api(env, '/api/cms/content', { cookie });
  const credits = (await env.CMS_DB.prepare('SELECT comic_slug, chapter_id, creator_slug, role FROM cms_credits').all()).results;
  const migrated = credits.filter(credit=>credit.comic_slug===before.slug);
  assert.deepEqual(migrated.filter(credit=>credit.chapter_id===null).map(credit=>credit.creator_slug),before.creatorSlugs);
  assert.equal(migrated.some(credit=>credit.chapter_id!==null),false);
  const after = (await getContent(env)).comics.find(comic=>comic.slug===before.slug);
  assert.deepEqual(after.creatorSlugs,before.creatorSlugs);
  assert.deepEqual(after.creatorCredits,before.creatorCredits);
});

test('SEO metadata is generated from page content and keeps published routes while omitting drafts', async () => {
  const env = makeEnv();
  const cookie = await signedIn(env);
  const payload = { slug: 'seo-audit-comic', title: 'SEO audit comic', cover: '/banner.jpg', synopsis: 'Descripción editorial.', seoTitle: 'Título SEO de prueba', seoDescription: 'Descripción SEO de prueba.', status: 'published' };
  await api(env, '/api/cms/content', { method: 'PUT', cookie, body: { type: 'comics', slug: payload.slug, payload } });
  const content = await getContent(env);
  const metadata = pageMetadata(`/comics/${payload.slug}`, 'https://alphaeve.example', content);
  assert.equal(metadata.title, 'SEO audit comic — Alpha Eve Studios');
  assert.equal(metadata.description, payload.synopsis);
  assert.ok(metadata.title.length <= 70);
  assert.ok(metadata.description.length <= 160);
  assert.ok(publicRoutes(content).includes(`/comics/${payload.slug}`));
  assert.equal(resolvePage('/comics/nonexistent-audit-slug', 'https://alphaeve.example', content), null);
});

test('series creators and chapter credits stay separate in D1, API, and chapter JSON-LD', async () => {
  const env = makeEnv();
  const cookie = await signedIn(env);
  const people = [
    { slug: 'francisco-test', name: 'Francisco', status: 'published' },
    { slug: 'darwin-test', name: 'Darwin', status: 'published' },
    { slug: 'carlos-test', name: 'Carlos', status: 'published' },
    { slug: 'gisell-test', name: 'Gisell', status: 'published' },
  ];
  for (const person of people) assert.equal((await api(env, '/api/cms/content', { method: 'PUT', cookie, body: { type: 'authors', slug: person.slug, payload: person } })).status, 200);
  const series = {
    slug: 'credits-test-series', title: 'Test Series', cover: '/banner.jpg', status: 'published',
    creatorSlugs: ['francisco-test','darwin-test'],
    workAuthorSlugs: ['francisco-test'],
    creatorCredits: { 'francisco-test': 'Guion', 'darwin-test': 'Portada' },
    chapters: [
      { id:'chapter-1', number:1, title:'Capítulo 1', status:'published', credits:[{creatorSlug:'francisco-test',roles:['Guion']},{creatorSlug:'darwin-test',roles:['Portada']}] },
      { id:'chapter-2', number:2, title:'Capítulo 2', status:'published', credits:[{creatorSlug:'francisco-test',roles:['Guion']},{creatorSlug:'carlos-test',roles:['Arte']}], externalCredits:[{name:'Luz externa',roles:['Lettering']}] },
    ],
  };
  let response = await api(env, '/api/cms/content', { method: 'PUT', cookie, body: { type: 'comics', slug: series.slug, payload: series } });
  assert.equal(response.status, 200);
  let content = await getContent(env);
  let stored = content.comics.find(comic=>comic.slug===series.slug);
  assert.deepEqual(stored.creatorSlugs,['francisco-test','darwin-test']);
  assert.deepEqual(stored.workAuthorSlugs,['francisco-test']);
  assert.deepEqual(stored.chapters[0].credits.map(credit=>credit.creatorSlug),['francisco-test','darwin-test']);
  assert.deepEqual(stored.chapters[1].credits.map(credit=>credit.creatorSlug),['francisco-test','carlos-test']);
  assert.deepEqual(stored.chapters[1].externalCredits,[{name:'Luz externa',roles:['Lettering'],order:0}]);
  assert.equal(stored.chapters[1].credits.some(credit=>credit.creatorSlug==='darwin-test'),false);
  assert.equal(content.authors.filter(author=>author.slug==='francisco-test').length,1);
  assert.ok(content.authors.find(author=>author.slug==='carlos-test').comicSlugs.includes(series.slug));

  const chapterEdit = { ...stored, chapters: stored.chapters.map((chapter,index)=>index===0?{...chapter,credits:[{creatorSlug:'francisco-test',roles:['Guion','Arte']},{creatorSlug:'darwin-test',roles:['Portada']}]}:chapter) };
  response = await api(env, '/api/cms/content', { method: 'PUT', cookie, body: { type: 'comics', slug: series.slug, payload: chapterEdit } });
  assert.equal(response.status, 200);
  content = await getContent(env);
  stored = content.comics.find(comic=>comic.slug===series.slug);
  assert.deepEqual(stored.creatorSlugs,['francisco-test','darwin-test']);
  assert.deepEqual(stored.chapters[0].credits[0].roles,['Guion','Arte']);

  const seriesEdit = { ...stored, creatorSlugs:['francisco-test','darwin-test','gisell-test'], creatorCredits:{...stored.creatorCredits,'gisell-test':'Color'} };
  response = await api(env, '/api/cms/content', { method: 'PUT', cookie, body: { type: 'comics', slug: series.slug, payload: seriesEdit } });
  assert.equal(response.status, 200);
  content = await getContent(env);
  stored = content.comics.find(comic=>comic.slug===series.slug);
  assert.deepEqual(stored.creatorSlugs,['francisco-test','darwin-test','gisell-test']);
  assert.deepEqual(stored.chapters[0].credits[0].roles,['Guion','Arte']);
  assert.deepEqual(stored.chapters[1].credits.map(credit=>credit.creatorSlug),['francisco-test','carlos-test']);
  const metadata = pageMetadata(`/comics/${series.slug}`,'https://alphaeve.example',content);
  const work = metadata.schema['@graph'].find(node=>node['@type']==='CreativeWork');
  assert.deepEqual(work.hasPart[1].creator.map(person=>person.name),['Francisco','Carlos','Luz externa']);
  assert.equal(work.hasPart[1].creator.some(person=>person.name==='Darwin'),false);
});
