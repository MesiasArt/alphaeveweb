import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { getContent, handleCms, serveMedia } from '../worker/cms.js';
import { servePublicPage, serveSitemap } from '../worker/public-pages.js';
import { pageMetadata, publicRoutes, resolvePage } from '../seo-data.js';
import { comics as seedComics } from '../seo-data.js';
import { comicReadingState } from '../editorial.js';

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
    ASSETS: { async fetch() { return new Response(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), { headers: { 'content-type': 'text/html; charset=utf-8' } }); } },
    CMS_DB: db,
    CMS_ADMIN_PASSWORD: 'local-test-password',
    CMS_SESSION_SECRET: 'test-only-secret-value',
    CMS_MEDIA: {
      async put(key, body, options) { media.set(key, { body, httpEtag: '"test"', writeHttpMetadata(headers) { headers.set('content-type', options.httpMetadata.contentType); } }); },
      async get(key) { return media.get(key) || null; },
    },
  };
}

async function publicPage(env, path) {
  return servePublicPage(new Request(new URL(path, 'https://alphaeve.example')), env);
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
  assert.equal(response.status, 422);
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
  const owned = {slug:'ana-work',title:'Ana Work',cover:'/banner.jpg',status:'published',creatorSlugs:['ana-owner','luz-owner'],creatorCredits:{'ana-owner':'Autora','luz-owner':'Color'},workAuthorSlugs:['ana-owner'],editorSlugs:['ana-owner'],chapters:[]};
  const collaboratorOnly = {slug:'luz-work',title:'Luz Work',cover:'/banner.jpg',status:'published',creatorSlugs:['luz-owner','ana-owner'],creatorCredits:{'luz-owner':'Autora','ana-owner':'Color'},workAuthorSlugs:['luz-owner'],editorSlugs:['luz-owner'],chapters:[]};
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
  assert.ok(scoped.authors.some(item=>item.slug==='ana-owner'));
  assert.ok(scoped.authors.some(item=>item.slug==='luz-owner'));
  assert.ok(scoped.authors.every(item=>item.slug==='ana-owner' || !['draft','archived'].includes(item.status)));
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'comics',slug:'luz-work',payload:collaboratorOnly}})).status,403);
  const forged={...owned,title:'Updated title',creatorSlugs:['luz-owner'],creatorCredits:{},workAuthorSlugs:['luz-owner']};
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'comics',slug:'ana-work',payload:forged}})).status,403); // temporary password must be changed first
  assert.equal((await api(env,'/api/cms/password',{method:'POST',cookie:authorCookie,body:{currentPassword:'temporary-pass-123',newPassword:'permanent-pass-456'}})).status,200);
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'comics',slug:'ana-work',payload:{...owned,editorSlugs:['ana-owner','luz-owner']}}})).status,403);
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'comics',slug:'ana-work',payload:{...owned,editorSlugs:[]}}})).status,403);
  const edited = {...owned, title:'Updated title', creatorSlugs:['ana-owner'], creatorCredits:{'ana-owner':'Autor'}, workAuthorSlugs:['ana-owner']};
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'comics',slug:'ana-work',payload:edited}})).status,200);
  scoped=await (await api(env,'/api/cms/content',{cookie:authorCookie})).json();
  assert.equal(scoped.comics[0].title,'Updated title');
  assert.deepEqual(scoped.comics[0].workAuthorSlugs,['ana-owner']);
  assert.deepEqual(scoped.comics[0].creatorSlugs,['ana-owner']);
  assert.deepEqual(scoped.comics[0].editorSlugs,['ana-owner']);
  const credited = {...scoped.comics[0], creatorSlugs:['ana-owner','luz-owner'], creatorCredits:{'ana-owner':'Autor','luz-owner':'Autora'}, workAuthorSlugs:['ana-owner','luz-owner'], chapters:[{id:'chapter-2',number:2,title:'Chapter 2',status:'draft',credits:[{creatorSlug:'luz-owner',roles:['Color']}]}]};
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'comics',slug:'ana-work',payload:credited}})).status,200);
  const afterCredits=(await (await api(env,'/api/cms/content',{cookie:authorCookie})).json()).comics[0];
  assert.deepEqual(afterCredits.editorSlugs,['ana-owner']);
  assert.equal(afterCredits.chapters[0].credits[0].creatorSlug,'luz-owner');
  assert.deepEqual(afterCredits.chapters[0].credits[0].roles,['Color']);
  assert.equal((await api(env,'/api/cms/users',{method:'POST',cookie:admin,body:{action:'create',authorSlug:'luz-owner',username:'luz',password:'temporary-luz-123'}})).status,201);
  const luzLogin=await api(env,'/api/cms/login',{method:'POST',body:{username:'luz',password:'temporary-luz-123'}});
  assert.equal(luzLogin.status,200);
  const luzCookie=luzLogin.headers.get('set-cookie').split(';')[0];
  assert.deepEqual((await (await api(env,'/api/cms/content',{cookie:luzCookie})).json()).comics.map(item=>item.slug),['luz-work']);
  assert.equal((await api(env,'/api/cms/password',{method:'POST',cookie:luzCookie,body:{currentPassword:'temporary-luz-123',newPassword:'permanent-luz-456'}})).status,200);
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:luzCookie,body:{type:'comics',slug:'ana-work',payload:afterCredits}})).status,403);
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:admin,body:{type:'comics',slug:'ana-work',payload:{...afterCredits,editorSlugs:['ana-owner','luz-owner']}}})).status,200);
  const granted=(await (await api(env,'/api/cms/content',{cookie:admin})).json()).comics.find(item=>item.slug==='ana-work');
  assert.deepEqual(granted.editorSlugs,['ana-owner','luz-owner']);
  assert.deepEqual((await (await api(env,'/api/cms/content',{cookie:luzCookie})).json()).comics.map(item=>item.slug).sort(),['ana-work','luz-work']);
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:admin,body:{type:'comics',slug:'ana-work',payload:{...granted,editorSlugs:['ana-owner']}}})).status,200);
  assert.deepEqual((await (await api(env,'/api/cms/content',{cookie:luzCookie})).json()).comics.map(item=>item.slug),['luz-work']);
  const profile = {...scoped.authors.find(item=>item.slug==='ana-owner'), bio:'Updated biography', status:'draft',gallery:[{src:'/media/art.jpg',alt:'Mi ilustración'}]};
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'authors',slug:'ana-owner',payload:profile}})).status,200);
  const updatedProfile = (await (await api(env,'/api/cms/content',{cookie:authorCookie})).json()).authors.find(item=>item.slug==='ana-owner');
  assert.equal(updatedProfile.bio,'Updated biography');
  assert.equal(updatedProfile.status,'draft');
  assert.deepEqual(updatedProfile.gallery,profile.gallery);
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'authors',slug:'luz-owner',payload:{...profile,slug:'luz-owner'}}})).status,403);
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'projects',slug:'outside-project',payload:{slug:'outside-project',title:'Outside',status:'draft'}}})).status,403);
  assert.equal((await api(env,'/api/cms/users',{cookie:authorCookie})).status,403);
  await api(env,'/api/cms/users',{method:'POST',cookie:admin,body:{action:'disable',authorSlug:'ana-owner'}});
  assert.equal((await (await api(env,'/api/cms/session',{cookie:authorCookie})).json()).authenticated,false);
});

test('legacy seed editorial access is preserved and frozen separately from credits on save', async () => {
  const env=makeEnv();
  const admin=await signedIn(env);
  assert.equal((await api(env,'/api/cms/users',{method:'POST',cookie:admin,body:{action:'create',authorSlug:'tonypan',username:'tonypan-test',password:'temporary-tonypan-123'}})).status,201);
  const login=await api(env,'/api/cms/login',{method:'POST',body:{username:'tonypan-test',password:'temporary-tonypan-123'}});
  const authorCookie=login.headers.get('set-cookie').split(';')[0];
  const workspace=await (await api(env,'/api/cms/content',{cookie:authorCookie})).json();
  const seedComic=workspace.comics.find(item=>item.slug==='a-la-deriva-con-mi-perro');
  assert.ok(seedComic);
  assert.equal(seedComic.editorSlugs,undefined);
  assert.equal((await api(env,'/api/cms/password',{method:'POST',cookie:authorCookie,body:{currentPassword:'temporary-tonypan-123',newPassword:'permanent-tonypan-456'}})).status,200);
  const updated={...seedComic,creatorCredits:{...seedComic.creatorCredits,tonypan:'Color'},workAuthorSlugs:[]};
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:authorCookie,body:{type:'comics',slug:seedComic.slug,payload:updated}})).status,200);
  const after=(await (await api(env,'/api/cms/content',{cookie:authorCookie})).json()).comics.find(item=>item.slug===seedComic.slug);
  assert.deepEqual(after.editorSlugs,['tonypan']);
  assert.deepEqual(after.workAuthorSlugs,[]);
});

test('preflight blocks new invalid publication but permits incomplete drafts and published legacy edits', async () => {
  const env=makeEnv();
  const admin=await signedIn(env);
  const draft={slug:'preflight-draft',title:'Preflight draft',status:'draft',cover:'',format:'Series',chapters:[{id:'one',number:1,title:'One',status:'draft',readUrl:'javascript:alert(1)'}]};
  assert.equal((await api(env,'/api/cms/content',{method:'PUT',cookie:admin,body:{type:'comics',slug:draft.slug,payload:draft}})).status,200);
  const publishing=await api(env,'/api/cms/content',{method:'PUT',cookie:admin,body:{type:'comics',slug:draft.slug,payload:{...draft,status:'published',cover:'/media/cover.jpg'}}});
  assert.equal(publishing.status,422);
  assert.ok((await publishing.json()).preflight.errors.some(message=>message.includes('lectura')));
  const legacy=(await getContent(env,{includeUnpublished:true})).comics.find(item=>item.slug==='baka-el-mito-asesino');
  assert.equal(legacy.status,null);
  const saved=await api(env,'/api/cms/content',{method:'PUT',cookie:admin,body:{type:'comics',slug:legacy.slug,payload:{...legacy,status:'published'}}});
  assert.equal(saved.status,200);
  assert.ok((await saved.json()).preflight.warnings.some(message=>message.includes('sinopsis')));
  assert.equal((await getContent(env)).comics.some(item=>item.slug===legacy.slug),true);
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

test('cold public response uses published CMS content for route, HTML, SEO, and sitemap', async () => {
  const routing = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')).assets.run_worker_first;
  for (const path of ['/', '/comics', '/comics/*', '/authors/*', '/projects/*', '/sitemap.xml']) assert.ok(routing.includes(path));
  const env = makeEnv();
  const admin = await signedIn(env);
  const published = { slug: 'hooligans-our-first-adventure', title: 'HOOLIGANS - Our first adventure', synopsis: 'Historia de prueba para verificar la ruta publicada.', cover: '/media/hooligans.jpg', status: 'published', creatorSlugs: [], chapters: [] };
  assert.equal(comicReadingState(published).hasReadingContent,false);
  assert.doesNotMatch(comicReadingState(published).badge,/undefined capítulos/i);
  const draft = { slug: 'fase-uno-draft', title: 'Borrador privado', cover: '/media/draft.jpg', status: 'draft', creatorSlugs: [], chapters: [] };
  const archived = { slug: 'fase-uno-archived', title: 'Archivado privado', cover: '/media/archived.jpg', status: 'archived', creatorSlugs: [], chapters: [] };
  for (const record of [published, draft, archived]) {
    const response = await api(env, '/api/cms/content', { method: 'PUT', cookie: admin, body: { type: 'comics', slug: record.slug, payload: record } });
    assert.equal(response.status, 200);
  }
  for (const entry of [
    { type: 'authors', payload: { slug: 'autor-cms-fase-uno', name: 'Autor CMS Fase Uno', bio: 'Perfil publicado.', status: 'published' } },
    { type: 'projects', payload: { slug: 'proyecto-cms-fase-uno', title: 'Proyecto CMS Fase Uno', category: 'TRABAJOS PARA CLIENTES', description: 'Proyecto publicado.', status: 'published' } },
  ]) {
    assert.equal((await api(env, '/api/cms/content', { method: 'PUT', cookie: admin, body: { type: entry.type, slug: entry.payload.slug, payload: entry.payload } })).status, 200);
  }

  const seedResponse = await publicPage(env, '/comics/baka-el-mito-asesino');
  const seedHtml = await seedResponse.text();
  assert.equal(seedResponse.status, 200);
  assert.match(seedHtml, /<main id="app">[\s\S]*Baká: El Mito Asesino/);
  assert.match(seedHtml, /<link rel="canonical" href="https:\/\/alphaeve\.example\/comics\/baka-el-mito-asesino">/);
  for (const [path, title] of [
    ['/authors/darkereve', 'Darwin Núñez'],
    ['/projects/a-great-and-terrible', 'A Great and Terrible #1'],
    ['/authors/autor-cms-fase-uno', 'Autor CMS Fase Uno'],
    ['/projects/proyecto-cms-fase-uno', 'Proyecto CMS Fase Uno'],
  ]) {
    const sample = await publicPage(env, path);
    assert.equal(sample.status, 200);
    const sampleHtml = await sample.text();
    assert.ok(sampleHtml.includes(`<h1>${title}</h1>`));
    assert.ok(sampleHtml.includes(`<link rel="canonical" href="https://alphaeve.example${path}">`));
  }

  const response = await publicPage(env, '/comics/hooligans-our-first-adventure');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<main id="app">[\s\S]*HOOLIGANS - Our first adventure/);
  assert.doesNotMatch(html, /Cómic no encontrado|PÁGINA NO ENCONTRADA/);
  assert.match(html, /<title>HOOLIGANS - Our first adventure — Alpha Eve Studios<\/title>/);
  assert.match(html, /<meta name="description" content="Historia de prueba para verificar la ruta publicada\.">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/alphaeve\.example\/comics\/hooligans-our-first-adventure">/);
  assert.match(html, /<meta property="og:title" content="HOOLIGANS - Our first adventure — Alpha Eve Studios">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/alphaeve\.example\/comics\/hooligans-our-first-adventure">/);
  assert.match(html, /<script type="application\/ld\+json" data-page-schema="true">[\s\S]*HOOLIGANS - Our first adventure/);
  const embedded = html.match(/<script type="application\/json" id="initial-public-content">([^<]+)<\/script>/);
  assert.ok(embedded);
  const hydrated = JSON.parse(embedded[1]);
  assert.deepEqual(hydrated, await (await api(env, '/api/content')).json());
  assert.equal(hydrated.comics.find(comic => comic.slug === published.slug)?.title, published.title);
  assert.equal(hydrated.comics.some(comic => comic.slug === draft.slug || comic.slug === archived.slug), false);

  const server = createServer(async (incoming, outgoing) => {
    try {
      const page = await servePublicPage(new Request(`http://127.0.0.1${incoming.url}`), env);
      outgoing.writeHead(page.status, Object.fromEntries(page.headers));
      outgoing.end(await page.text());
    } catch (error) { outgoing.writeHead(500); outgoing.end(String(error)); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const direct = await fetch(`http://127.0.0.1:${server.address().port}/comics/hooligans-our-first-adventure`);
    assert.equal(direct.status, 200);
    const directHtml = await direct.text();
    assert.match(directHtml, /<main id="app">[\s\S]*HOOLIGANS - Our first adventure/);
    assert.match(directHtml, /<meta property="og:title" content="HOOLIGANS - Our first adventure — Alpha Eve Studios">/);
  } finally { await new Promise(resolve => server.close(resolve)); }

  for (const slug of [draft.slug, archived.slug, 'no-existe-audit']) {
    const missing = await publicPage(env, `/comics/${slug}`);
    const missingHtml = await missing.text();
    assert.equal(missing.status, 404);
    assert.match(missingHtml, /<meta name="robots" content="noindex,follow">/);
    assert.doesNotMatch(missingHtml, /<link rel="canonical"/);
  }

  const sitemap = await serveSitemap(new Request('https://alphaeve.example/sitemap.xml'), env);
  const xml = await sitemap.text();
  assert.equal(sitemap.status, 200);
  assert.match(xml, /\/comics\/baka-el-mito-asesino<\/loc>/);
  assert.match(xml, /\/comics\/hooligans-our-first-adventure<\/loc>/);
  assert.match(xml, /\/authors\/autor-cms-fase-uno<\/loc>/);
  assert.match(xml, /\/projects\/proyecto-cms-fase-uno<\/loc>/);
  assert.doesNotMatch(xml, /fase-uno-draft|fase-uno-archived|no-existe-audit/);

  const hiddenSeed = { ...seedComics.find(comic => comic.slug === 'baka-el-mito-asesino'), status: 'draft' };
  assert.equal((await api(env, '/api/cms/content', { method: 'PUT', cookie: admin, body: { type: 'comics', slug: hiddenSeed.slug, payload: hiddenSeed } })).status, 200);
  assert.equal((await publicPage(env, '/comics/baka-el-mito-asesino')).status, 404);
  assert.doesNotMatch(await (await serveSitemap(new Request('https://alphaeve.example/sitemap.xml'), env)).text(), /\/comics\/baka-el-mito-asesino<\/loc>/);
});
