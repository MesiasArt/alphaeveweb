import { authors as seedAuthors, comics as seedComics, projects as seedProjects } from "../seo-data.js";

const TYPES = new Set(["comics", "authors", "projects"]);
const MAX_JSON_BYTES = 1_000_000;
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
// Cloudflare Workers currently rejects PBKDF2 requests above 100,000 iterations.
const PASSWORD_HASH_ITERATIONS = 100_000;
const ALLOWED_MEDIA = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"],
  ["image/gif", "gif"], ["image/avif", "avif"],
]);
const encoder = new TextEncoder();
const loginAttempts = new Map();

export async function handleCms(request, env, url) {
  if (url.pathname === "/api/content") {
    if (request.method !== "GET" && request.method !== "HEAD") return json({ error: "Método no permitido." }, 405);
    return json(await getContent(env), 200, { "cache-control": "no-store" }, request.method === "HEAD");
  }
  if (url.pathname === "/api/cms/login") return login(request, env, url);
  if (url.pathname === "/api/cms/session") {
    if (request.method !== "GET") return json({ error: "Método no permitido." }, 405);
    const user = await getSession(request, env);
    return json({ authenticated: !!user, user: user || null }, 200, { "cache-control": "no-store" });
  }
  if (url.pathname === "/api/cms/users") return manageUsers(request, env, url);
  if (url.pathname === "/api/cms/password") return changePassword(request, env, url);
  if (url.pathname === "/api/cms/logout") {
    if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
    if (!sameOrigin(request, url)) return json({ error: "Origen no permitido." }, 403);
    return json({ ok: true }, 200, { "set-cookie": cookie(url, "", 0) });
  }
  if (url.pathname === "/api/cms/content") {
    const user = await requireCms(request, env, url);
    if (!user) return json({ error: "No autorizado." }, 401);
    if (!env.CMS_DB) return json({ error: "Falta la vinculación D1 CMS_DB." }, 503);
    if (request.method === "GET") {
      await ensureCreditModel(env);
      const content = await getContent(env, { includeUnpublished: true });
      return json(user.role === 'admin' ? content : authorWorkspace(content, user.authorSlug));
    }
    if (request.method !== "PUT" && request.method !== "DELETE") return json({ error: "Método no permitido." }, 405);
    if (!sameOrigin(request, url)) return json({ error: "Origen no permitido." }, 403);
    if (user.mustChangePassword) return json({ error: "Cambia tu contraseña temporal antes de editar contenido." }, 403);
    return saveContent(request, env, user);
  }
  if (url.pathname === "/api/cms/media") {
    const user = await requireCms(request, env, url);
    if (!user) return json({ error: "No autorizado." }, 401);
    if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
    if (!sameOrigin(request, url)) return json({ error: "Origen no permitido." }, 403);
    if (user.mustChangePassword) return json({ error: "Cambia tu contraseña temporal antes de subir archivos." }, 403);
    return uploadMedia(request, env);
  }
  return json({ error: "No encontrado." }, 404);
}

export async function serveMedia(request, env, url) {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405 });
  const key = decodeURIComponent(url.pathname.slice("/media/".length));
  if (!key || key.includes("..") || key.includes("\\")) return new Response("Not Found", { status: 404 });
  const object = await env.CMS_MEDIA?.get(key);
  if (!object) return new Response("Not Found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}

export async function getContent(env, { includeUnpublished = false } = {}) {
  const data = {
    comics: structuredClone(seedComics),
    authors: structuredClone(seedAuthors),
    projects: structuredClone(seedProjects),
  };
  if (!env.CMS_DB) return data;
  const { results = [] } = await env.CMS_DB.prepare("SELECT entity_type, slug, payload, is_deleted FROM cms_content").all();
  for (const row of results) {
    const list = data[row.entity_type];
    if (!list) continue;
    const index = list.findIndex(item => item.slug === row.slug);
    if (row.is_deleted) {
      if (index >= 0) list.splice(index, 1);
      continue;
    }
    let payload;
    try { payload = JSON.parse(row.payload); } catch { continue; }
    if (index >= 0) list[index] = payload;
    else list.push(payload);
  }
  const { results: creditRows = [] } = await env.CMS_DB.prepare("SELECT comic_slug, chapter_id, creator_slug, external_name, role, position FROM cms_credits ORDER BY comic_slug, chapter_id, position, credit_id").all();
  applyNormalizedCredits(data, creditRows);
  if (!includeUnpublished) {
    for (const type of TYPES) data[type] = data[type].filter(record => !isUnpublished(record.status));
  }
  // The record that owns a relationship is the source of truth. Derive the
  // reverse links so editors never have to maintain duplicate slug arrays.
  for (const author of data.authors) {
    author.comicSlugs = data.comics.filter(comic => (comic.creatorSlugs || []).includes(author.slug) || (comic.chapters || []).some(chapter => (chapter.credits || []).some(credit => credit.creatorSlug === author.slug))).map(comic => comic.slug);
    author.projectSlugs = data.projects.filter(project => (project.creatorSlugs || []).includes(author.slug)).map(project => project.slug);
  }
  return data;
}

function applyNormalizedCredits(data, rows) {
  if (!rows.length) return;
  for (const comic of data.comics) {
    const ownRows = rows.filter(row => row.comic_slug === comic.slug);
    const seriesRows = ownRows.filter(row => row.chapter_id == null && row.creator_slug);
    if (seriesRows.length) {
      const grouped = groupCreatorCredits(seriesRows);
      comic.creatorSlugs = grouped.map(item => item.creatorSlug);
      comic.creatorCredits = Object.fromEntries(grouped.map(item => [item.creatorSlug, item.roles.join(' · ')]));
    }
    for (const [index, chapter] of (comic.chapters || []).entries()) {
      chapter.id ||= stableChapterId(chapter, index);
      const chapterRows = ownRows.filter(row => row.chapter_id === chapter.id);
      const creatorRows = chapterRows.filter(row => row.creator_slug);
      const externalRows = chapterRows.filter(row => row.external_name);
      if (creatorRows.length) chapter.credits = groupCreatorCredits(creatorRows);
      if (externalRows.length) chapter.externalCredits = groupExternalCredits(externalRows);
    }
  }
}

function groupCreatorCredits(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const item = grouped.get(row.creator_slug) || { creatorSlug: row.creator_slug, roles: [], order: Number(row.position) || 0 };
    if (row.role && !item.roles.includes(row.role)) item.roles.push(row.role);
    item.order = Math.min(item.order, Number(row.position) || 0);
    grouped.set(row.creator_slug, item);
  }
  return [...grouped.values()].sort((a,b)=>a.order-b.order);
}

function groupExternalCredits(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const item = grouped.get(row.external_name) || { name: row.external_name, roles: [], order: Number(row.position) || 0 };
    if (row.role && !item.roles.includes(row.role)) item.roles.push(row.role);
    item.order = Math.min(item.order, Number(row.position) || 0);
    grouped.set(row.external_name, item);
  }
  return [...grouped.values()].sort((a,b)=>a.order-b.order);
}

function stableChapterId(chapter, index) {
  return String(chapter.id || `chapter-${Number(chapter.number) || index + 1}-${slugify(chapter.title) || 'untitled'}`);
}

function slugify(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

async function ensureCreditModel(env) {
  const { results = [] } = await env.CMS_DB.prepare("SELECT state_key FROM cms_migration_state WHERE state_key = 'credit_relationships_v1'").all();
  if (results.length) return;
  const data = await getContent(env, { includeUnpublished: true });
  const statements = data.authors.map(author => env.CMS_DB.prepare("INSERT INTO cms_creators (slug, name) VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET name=excluded.name, updated_at=CURRENT_TIMESTAMP").bind(author.slug, author.name || author.role || author.slug));
  for (const comic of data.comics) statements.push(...comicCreditStatements(env, comic, data.authors, { ignore: true }));
  statements.push(env.CMS_DB.prepare("INSERT OR IGNORE INTO cms_migration_state (state_key) VALUES ('credit_relationships_v1')"));
  await env.CMS_DB.batch(statements);
}

function comicCreditStatements(env, comic, authors, { ignore = false } = {}) {
  const insert = ignore ? 'INSERT OR IGNORE' : 'INSERT';
  const statements = [
    env.CMS_DB.prepare("INSERT INTO cms_comics (slug, title) VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title, updated_at=CURRENT_TIMESTAMP").bind(comic.slug, comic.title || ''),
    ...authors.filter(author => (comic.creatorSlugs || []).includes(author.slug) || (comic.chapters || []).some(chapter => (chapter.credits || []).some(credit => credit.creatorSlug === author.slug))).map(author => env.CMS_DB.prepare("INSERT INTO cms_creators (slug, name) VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET name=excluded.name, updated_at=CURRENT_TIMESTAMP").bind(author.slug, author.name || author.role || author.slug)),
  ];
  if (!ignore) {
    statements.push(env.CMS_DB.prepare("DELETE FROM cms_credits WHERE comic_slug = ?").bind(comic.slug));
    statements.push(env.CMS_DB.prepare("DELETE FROM cms_chapters WHERE comic_slug = ?").bind(comic.slug));
  }
  const chapters = comic.chapters || [];
  chapters.forEach((chapter, index) => {
    const chapterId = stableChapterId(chapter, index);
    statements.push(env.CMS_DB.prepare(`${insert} INTO cms_chapters (comic_slug, chapter_id, chapter_number, title, position) VALUES (?, ?, ?, ?, ?)`).bind(comic.slug, chapterId, Number(chapter.number) || index + 1, chapter.title || '', index));
  });
  (comic.creatorSlugs || []).forEach((creatorSlug, index) => {
    statements.push(env.CMS_DB.prepare(`${insert} INTO cms_credits (comic_slug, chapter_id, creator_slug, external_name, role, position) VALUES (?, NULL, ?, NULL, ?, ?)`).bind(comic.slug, creatorSlug, String(comic.creatorCredits?.[creatorSlug] || '').trim(), index));
  });
  chapters.forEach((chapter, chapterIndex) => {
    const chapterId = stableChapterId(chapter, chapterIndex);
    (chapter.credits || []).forEach((credit, position) => {
      for (const role of credit.roles || []) statements.push(env.CMS_DB.prepare(`${insert} INTO cms_credits (comic_slug, chapter_id, creator_slug, external_name, role, position) VALUES (?, ?, ?, NULL, ?, ?)`).bind(comic.slug, chapterId, credit.creatorSlug, role, position));
    });
    (chapter.externalCredits || []).forEach((credit, position) => {
      for (const role of credit.roles || []) statements.push(env.CMS_DB.prepare(`${insert} INTO cms_credits (comic_slug, chapter_id, creator_slug, external_name, role, position) VALUES (?, ?, NULL, ?, ?, ?)`).bind(comic.slug, chapterId, credit.name, role, position));
    });
  });
  return statements;
}

function isUnpublished(status) {
  const value = String(status || "published").trim().toLowerCase();
  return ["draft", "borrador", "archived", "archivado"].includes(value);
}

export async function listOverrides(env) {
  if (!env.CMS_DB) throw new Error("Falta la vinculación D1 CMS_DB.");
  const { results = [] } = await env.CMS_DB.prepare("SELECT entity_type, slug, payload, is_deleted, updated_at FROM cms_content ORDER BY entity_type, slug").all();
  return results.map(row => ({ ...row, payload: row.is_deleted ? null : safeParse(row.payload) }));
}

async function saveContent(request, env, user) {
  if (!env.CMS_DB) return json({ error: "Falta la vinculación D1 CMS_DB." }, 503);
  await ensureCreditModel(env);
  if (request.method === "DELETE") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON inválido." }, 400); }
    const { type, slug } = body || {};
    if (!TYPES.has(type) || !validSlug(slug)) return json({ error: "Tipo o slug inválido." }, 400);
    if (user.role !== 'admin') return json({ error: 'Solo administración puede eliminar o restablecer contenido.' }, 403);
    if (type === 'authors') {
      const { results = [] } = await env.CMS_DB.prepare("SELECT comic_slug FROM cms_credits WHERE creator_slug = ? LIMIT 1").bind(slug).all();
      if (results.length) return json({ error: 'Este creador tiene créditos asociados. Retira primero sus créditos antes de eliminar su perfil.' }, 409);
    }
    if (type === 'comics') {
      await env.CMS_DB.batch([
        env.CMS_DB.prepare("DELETE FROM cms_content WHERE entity_type = 'comics' AND slug = ?").bind(slug),
        env.CMS_DB.prepare("DELETE FROM cms_credits WHERE comic_slug = ?").bind(slug),
        env.CMS_DB.prepare("DELETE FROM cms_chapters WHERE comic_slug = ?").bind(slug),
        env.CMS_DB.prepare("DELETE FROM cms_comics WHERE slug = ?").bind(slug),
      ]);
      const seedComic = seedComics.find(item => item.slug === slug);
      if (seedComic) {
        const data = await getContent(env, { includeUnpublished: true });
        await env.CMS_DB.batch(comicCreditStatements(env, seedComic, data.authors));
      }
    } else {
      await env.CMS_DB.prepare("DELETE FROM cms_content WHERE entity_type = ? AND slug = ?").bind(type, slug).run();
    }
    return json({ ok: true, reset: seedList(type).some(item => item.slug === slug) });
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_JSON_BYTES) return json({ error: "El registro supera el límite de tamaño." }, 413);
  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON inválido." }, 400); }
  const { type, slug, payload } = body || {};
  if (!TYPES.has(type) || !validSlug(slug) || !payload || typeof payload !== "object" || Array.isArray(payload)) return json({ error: "Tipo, slug o registro inválido." }, 400);
  if (payload.slug !== slug) return json({ error: "El slug del registro debe coincidir con la clave y no puede cambiarse." }, 400);
  if (user.role !== 'admin') {
    if (type === 'projects' || !['authors','comics'].includes(type)) return json({ error: 'Tu cuenta solo puede editar tu perfil y los cómics con permiso editorial.' }, 403);
    if (type === 'authors' && slug !== user.authorSlug) return json({ error: 'Solo puedes editar tu propio perfil.' }, 403);
    if (type === 'authors') {
      const current = await getContent(env, { includeUnpublished: true });
      const ownProfile = current.authors.find(author => author.slug === user.authorSlug);
      if (!ownProfile) return json({ error: 'No se encontró tu perfil.' }, 404);
      payload.slug = ownProfile.slug;
    }
    if (type === 'comics') {
      const current = await getContent(env, { includeUnpublished: true });
      const oldComic = current.comics.find(item => item.slug === slug);
      if (!oldComic || !workAuthors(oldComic).includes(user.authorSlug)) return json({ error: 'Solo puedes editar los cómics para los que tienes permiso editorial.' }, 403);
    }
  }
  const currentContent = type === 'comics' ? await getContent(env, { includeUnpublished: true }) : null;
  if (type === 'comics') {
    const oldComic = currentContent.comics.find(item => item.slug === slug);
    const previousEditors = oldComic ? workAuthors(oldComic) : [];
    if (user.role !== 'admin' && payload.editorSlugs !== undefined && !sameSlugs(payload.editorSlugs, previousEditors)) return json({ error: 'Solo administración puede cambiar los permisos editoriales.' }, 403);
    if (payload.editorSlugs === undefined) payload.editorSlugs = previousEditors;
    if (!Array.isArray(payload.editorSlugs) || new Set(payload.editorSlugs).size !== payload.editorSlugs.length || payload.editorSlugs.some(editor => typeof editor !== 'string' || !currentContent.authors.some(author => author.slug === editor))) return json({ error: 'Selecciona creadores válidos y sin repetir para los permisos editoriales.' }, 400);
    const creditError = validateComicCredits(payload, currentContent.authors);
    if (creditError) return json({ error: creditError }, 400);
  }
  const visibility = String(payload.status || "draft").trim().toLowerCase();
  if (!isUnpublished(visibility)) {
    if (type === "comics" && (!String(payload.title || "").trim() || !String(payload.cover || "").trim())) return json({ error: "Para publicar un cómic, completa el título y agrega una portada." }, 400);
    if (type === "authors" && !String(payload.name || "").trim()) return json({ error: "Para publicar un perfil, escribe el nombre del creador." }, 400);
    if (type === "projects" && (!String(payload.title || "").trim() || !String(payload.category || "").trim())) return json({ error: "Para publicar un proyecto, completa el título y la categoría." }, 400);
  }
  const arrayFields = type === "comics" ? ["genres", "creatorSlugs", "chapters", "gallery"] : type === "authors" ? ["specialties", "gallery"] : ["categories", "creatorSlugs"];
  if (arrayFields.some(key => payload[key] !== undefined && !Array.isArray(payload[key]))) return json({ error: "Hay una lista de contenido con un formato incorrecto." }, 400);
  const jsonPayload = JSON.stringify(payload);
  if (encoder.encode(jsonPayload).byteLength > MAX_JSON_BYTES) return json({ error: "El registro supera el límite de tamaño." }, 413);
  const contentStatement = env.CMS_DB.prepare("INSERT INTO cms_content (entity_type, slug, payload, is_deleted, updated_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP) ON CONFLICT(entity_type, slug) DO UPDATE SET payload=excluded.payload, is_deleted=0, updated_at=CURRENT_TIMESTAMP").bind(type, slug, jsonPayload);
  if (type === 'comics') {
    await env.CMS_DB.batch([contentStatement, ...comicCreditStatements(env, payload, currentContent.authors)]);
  } else if (type === 'authors') {
    await env.CMS_DB.batch([contentStatement, env.CMS_DB.prepare("INSERT INTO cms_creators (slug, name) VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET name=excluded.name, updated_at=CURRENT_TIMESTAMP").bind(slug, payload.name || payload.role || slug)]);
  } else await contentStatement.run();
  return json({ ok: true, type, slug });
}

function validateComicCredits(comic, authors) {
  if (comic.creatorSlugs !== undefined && (!Array.isArray(comic.creatorSlugs) || new Set(comic.creatorSlugs).size !== comic.creatorSlugs.length)) return 'Revisa la lista de creadores generales: no puede haber personas repetidas.';
  const known = new Set(authors.map(author => author.slug));
  if ((comic.creatorSlugs || []).some(slug => typeof slug !== 'string' || !known.has(slug))) return 'Selecciona creadores que existan en el catálogo.';
  if (comic.workAuthorSlugs !== undefined && (!Array.isArray(comic.workAuthorSlugs) || new Set(comic.workAuthorSlugs).size !== comic.workAuthorSlugs.length || comic.workAuthorSlugs.some(slug => !known.has(slug) || !(comic.creatorSlugs || []).includes(slug)))) return 'Los autores de la obra deben ser creadores vinculados y no repetirse.';
  if (!Array.isArray(comic.chapters || [])) return 'La lista de capítulos no tiene un formato válido.';
  const ids = new Set();
  for (const chapter of comic.chapters || []) {
    if (!chapter || typeof chapter !== 'object' || Array.isArray(chapter)) return 'Hay un capítulo con un formato incorrecto.';
    const id = String(chapter.id || '');
    if ((chapter.credits?.length || chapter.externalCredits?.length) && !id) return 'Cada capítulo con créditos necesita un identificador.';
    if (id && (ids.has(id) || id.length > 120)) return 'Hay capítulos con identificadores repetidos o inválidos.';
    if (id) ids.add(id);
    if (chapter.credits !== undefined && !Array.isArray(chapter.credits)) return 'La lista de creadores del capítulo no tiene un formato válido.';
    const seenCreators = new Set();
    for (const credit of chapter.credits || []) {
      if (!credit || typeof credit !== 'object' || !known.has(credit.creatorSlug) || seenCreators.has(credit.creatorSlug) || !Array.isArray(credit.roles) || !credit.roles.length || new Set(credit.roles).size !== credit.roles.length || credit.roles.some(role => typeof role !== 'string' || !role.trim() || role.length > 100)) return 'Cada creador del capítulo debe existir una sola vez en la lista y tener roles válidos.';
      seenCreators.add(credit.creatorSlug);
    }
    if (chapter.externalCredits !== undefined && !Array.isArray(chapter.externalCredits)) return 'La lista de colaboradores externos no tiene un formato válido.';
    const seenExternal = new Set();
    for (const credit of chapter.externalCredits || []) {
      if (typeof credit === 'string') continue; // Preserve legacy values until edited in the structured editor.
      const externalName = String(credit?.name || '').trim().toLocaleLowerCase();
      if (!credit || typeof credit !== 'object' || !externalName || seenExternal.has(externalName) || !Array.isArray(credit.roles) || !credit.roles.length || new Set(credit.roles).size !== credit.roles.length || credit.roles.some(role => typeof role !== 'string' || !role.trim() || role.length > 100)) return 'Cada colaborador externo necesita un nombre único y roles válidos.';
      seenExternal.add(externalName);
    }
  }
  return '';
}

async function uploadMedia(request, env) {
  if (!env.CMS_MEDIA || !env.CMS_DB) return json({ error: "Faltan las vinculaciones CMS_MEDIA (R2) o CMS_DB (D1)." }, 503);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_MEDIA_BYTES + 1024) return json({ error: "El archivo supera el límite de 10 MB." }, 413);
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !file.size) return json({ error: "Selecciona una imagen." }, 400);
  if (file.size > MAX_MEDIA_BYTES) return json({ error: "El archivo supera el límite de 10 MB." }, 413);
  const extension = ALLOWED_MEDIA.get(file.type);
  if (!extension) return json({ error: "Formato no permitido. Usa JPG, PNG, WebP, GIF o AVIF." }, 415);
  if (!await hasMatchingImageSignature(file, file.type)) return json({ error: "El contenido del archivo no coincide con el formato de imagen declarado." }, 415);
  const key = `${crypto.randomUUID()}.${extension}`;
  await env.CMS_MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" } });
  await env.CMS_DB.prepare("INSERT INTO cms_media (object_key, filename, content_type, size) VALUES (?, ?, ?, ?)").bind(key, cleanFilename(file.name), file.type, file.size).run();
  return json({ ok: true, key, url: `/media/${key}`, filename: file.name, size: file.size });
}

async function login(request, env, url) {
  if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
  if (!sameOrigin(request, url)) return json({ error: "Origen no permitido." }, 403);
  if (!env.CMS_ADMIN_PASSWORD || !env.CMS_SESSION_SECRET) return json({ error: "Configura los secretos CMS_ADMIN_PASSWORD y CMS_SESSION_SECRET en Cloudflare." }, 503);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (isLoginLimited(ip)) return json({ error: "Demasiados intentos. Inténtalo de nuevo en 15 minutos." }, 429);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.password !== "string" || body.password.length > 200) {
    recordLoginFailure(ip);
    return json({ error: "Contraseña incorrecta." }, 401);
  }
  const username = String(body.username || '').trim().toLowerCase();
  let user;
  if (!username || username === 'admin') {
    if (constantTimeEqual(body.password, env.CMS_ADMIN_PASSWORD)) user = { role: 'admin', username: 'admin', mustChangePassword: false };
  } else if (env.CMS_DB && /^[a-z0-9][a-z0-9._-]{2,49}$/.test(username)) {
    const row = await env.CMS_DB.prepare("SELECT user_id, username, author_slug, password_salt, password_hash, is_active, must_change_password FROM cms_users WHERE username = ? COLLATE NOCASE LIMIT 1").bind(username).first();
    if (row?.is_active && constantTimeEqual(await hashPassword(body.password, row.password_salt), row.password_hash)) user = { role: 'author', username: row.username, userId: row.user_id, authorSlug: row.author_slug, mustChangePassword: !!row.must_change_password };
  }
  if (!user) {
    recordLoginFailure(ip);
    return json({ error: "Usuario o contraseña incorrectos." }, 401);
  }
  loginAttempts.delete(ip);
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 12;
  const token = await signSession({ ...user, exp: expires }, env.CMS_SESSION_SECRET);
  return json({ ok: true, user }, 200, { "set-cookie": cookie(url, token, 60 * 60 * 12) });
}

async function requireCms(request, env, url) {
  if (!sameOrigin(request, url)) return false;
  return getSession(request, env);
}

async function getSession(request, env) {
  if (!env.CMS_SESSION_SECRET) return false;
  const token = parseCookies(request.headers.get("cookie") || "").ae_cms;
  if (!token) return false;
  const [encoded, signature, extra] = token.split(".");
  if (extra || !encoded || !constantTimeEqual(signature || "", await sign(encoded, env.CMS_SESSION_SECRET))) return false;
  let session;
  try { const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/'); session = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))); } catch {
    // Accept pre-migration administrator sessions until they expire.
    const expires = Number(encoded);
    if (signature && Number.isInteger(expires) && expires >= Date.now() / 1000 && constantTimeEqual(signature, await sign(encoded, env.CMS_SESSION_SECRET))) return { role: 'admin', username: 'admin', mustChangePassword: false };
    return false;
  }
  if (!Number.isInteger(session.exp) || session.exp < Date.now() / 1000) return false;
  if (session.role === 'admin') return { role: 'admin', username: 'admin', mustChangePassword: false };
  if (session.role !== 'author' || !env.CMS_DB || !session.userId || !session.authorSlug) return false;
  const row = await env.CMS_DB.prepare("SELECT user_id, username, author_slug, is_active, must_change_password FROM cms_users WHERE user_id = ? LIMIT 1").bind(session.userId).first();
  if (!row?.is_active || row.author_slug !== session.authorSlug) return false;
  return { role: 'author', username: row.username, userId: row.user_id, authorSlug: row.author_slug, mustChangePassword: !!row.must_change_password };
}

function isWorkAuthorRole(role) {
  return /^(autor(?:\/a)?|autor(?:es)?(?: de la obra)?|obra(?: completa)?|creador(?:\/a)?|creador(?:a)? de la obra)$/i.test(String(role || '').trim());
}
function workAuthors(comic) {
  if (Array.isArray(comic.editorSlugs)) return comic.editorSlugs;
  const authors = new Set(Array.isArray(comic.workAuthorSlugs) ? comic.workAuthorSlugs : []);
  for (const slug of comic.creatorSlugs || []) {
    const roles = String(comic.creatorCredits?.[slug] || '').split(/\s*[·,]\s*/);
    if (roles.some(isWorkAuthorRole)) authors.add(slug);
  }
  return [...authors].filter(Boolean);
}
function sameSlugs(left, right) {
  return Array.isArray(left) && left.length === right.length && left.every(slug => right.includes(slug));
}
function authorWorkspace(data, authorSlug) {
  const comics = data.comics.filter(comic => workAuthors(comic).includes(authorSlug));
  return {
    comics,
    authors: data.authors.filter(author => author.slug === authorSlug || !isUnpublished(author.status)).map(author => author.slug === authorSlug ? ({ ...author, comicSlugs: comics.map(comic => comic.slug), projectSlugs: [] }) : author),
    projects: [],
  };
}

async function signSession(session, secret) {
  const encoded = btoa(JSON.stringify(session)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encoded}.${await sign(encoded, secret)}`;
}

function randomToken(bytes = 16) {
  const value = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const encodedSalt = salt.replace(/-/g, '+').replace(/_/g, '/');
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: Uint8Array.from(atob(encodedSalt.padEnd(Math.ceil(encodedSalt.length / 4) * 4, '=')), c => c.charCodeAt(0)), iterations: PASSWORD_HASH_ITERATIONS }, key, 256);
  return btoa(String.fromCharCode(...new Uint8Array(bits))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function changePassword(request, env, url) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  if (!sameOrigin(request, url)) return json({ error: 'Origen no permitido.' }, 403);
  const user = await requireCms(request, env, url);
  if (!user || user.role !== 'author') return json({ error: 'No autorizado.' }, 401);
  const body = await request.json().catch(() => null);
  const oldPassword = String(body?.currentPassword || ''), newPassword = String(body?.newPassword || '');
  if (new TextEncoder().encode(newPassword).length < 12 || new TextEncoder().encode(newPassword).length > 256) return json({ error: 'La nueva contraseña debe tener entre 12 y 256 bytes.' }, 400);
  const row = await env.CMS_DB.prepare('SELECT password_salt, password_hash FROM cms_users WHERE user_id = ?').bind(user.userId).first();
  if (!row || !constantTimeEqual(await hashPassword(oldPassword, row.password_salt), row.password_hash)) return json({ error: 'La contraseña actual no coincide.' }, 401);
  const salt = randomToken();
  const hash = await hashPassword(newPassword, salt);
  await env.CMS_DB.prepare('UPDATE cms_users SET password_salt = ?, password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').bind(salt, hash, user.userId).run();
  return json({ ok: true });
}

async function manageUsers(request, env, url) {
  if (!env.CMS_DB) return json({ error: 'Falta la vinculación D1 CMS_DB.' }, 503);
  const actor = await requireCms(request, env, url);
  if (!actor || actor.role !== 'admin') return json({ error: 'Solo administración puede gestionar cuentas.' }, 403);
  if (request.method === 'GET') {
    const [{ results: rows = [] }, content] = await Promise.all([
      env.CMS_DB.prepare('SELECT user_id, username, author_slug, is_active, must_change_password, created_at FROM cms_users ORDER BY username').all(),
      getContent(env, { includeUnpublished: true }),
    ]);
    const users = rows.map(row => ({ ...row, active: !!row.is_active, mustChangePassword: !!row.must_change_password, authorName: content.authors.find(item => item.slug === row.author_slug)?.name || row.author_slug, comicCount: content.comics.filter(comic => workAuthors(comic).includes(row.author_slug)).length }));
    return json({ users, availableAuthors: content.authors.filter(author => !rows.some(row => row.author_slug === author.slug)).map(author => ({ slug: author.slug, name: author.name })) });
  }
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  if (!sameOrigin(request, url)) return json({ error: 'Origen no permitido.' }, 403);
  const body = await request.json().catch(() => null);
  const action = String(body?.action || '');
  const authorSlug = String(body?.authorSlug || '');
  if (!validSlug(authorSlug)) return json({ error: 'Selecciona un autor válido.' }, 400);
  const content = await getContent(env, { includeUnpublished: true });
  if (!content.authors.some(author => author.slug === authorSlug)) return json({ error: 'No existe un perfil para ese autor.' }, 400);
  if (action === 'disable' || action === 'enable') {
    const result = await env.CMS_DB.prepare('UPDATE cms_users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE author_slug = ?').bind(action === 'enable' ? 1 : 0, authorSlug).run();
    if (!result.meta?.changes) return json({ error: 'No existe una cuenta para ese autor.' }, 404);
    return json({ ok: true });
  }
  const password = String(body?.password || '');
  if (new TextEncoder().encode(password).length < 12 || new TextEncoder().encode(password).length > 256) return json({ error: 'La contraseña temporal debe tener entre 12 y 256 bytes.' }, 400);
  const username = String(body?.username || authorSlug).trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(username)) return json({ error: 'El usuario debe tener entre 3 y 50 caracteres: letras, números, punto, guion o guion bajo.' }, 400);
  const salt = randomToken();
  const hash = await hashPassword(password, salt);
  if (action === 'create') {
    try {
      await env.CMS_DB.prepare('INSERT INTO cms_users (user_id, username, author_slug, password_salt, password_hash, is_active, must_change_password) VALUES (?, ?, ?, ?, ?, 1, 1)').bind(crypto.randomUUID(), username, authorSlug, salt, hash).run();
    } catch {
      return json({ error: 'Ya existe una cuenta con ese usuario o autor.' }, 409);
    }
    return json({ ok: true, username, mustChangePassword: true }, 201);
  }
  if (action === 'reset') {
    const result = await env.CMS_DB.prepare('UPDATE cms_users SET password_salt = ?, password_hash = ?, is_active = 1, must_change_password = 1, updated_at = CURRENT_TIMESTAMP WHERE author_slug = ?').bind(salt, hash, authorSlug).run();
    if (!result.meta?.changes) return json({ error: 'No existe una cuenta para ese autor.' }, 404);
    return json({ ok: true, mustChangePassword: true });
  }
  return json({ error: 'Acción de cuenta inválida.' }, 400);
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
  return btoa(String.fromCharCode(...signature)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function cookie(url, value, maxAge) {
  return `ae_cms=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${url.protocol === "https:" ? "; Secure" : ""}`;
}
function parseCookies(header) { return Object.fromEntries(header.split(";").map(item => item.trim().split(/=(.*)/s)).filter(([key, value]) => key && value !== undefined)); }
function sameOrigin(request, url) {
  const origin = request.headers.get("Origin");
  const site = request.headers.get("Sec-Fetch-Site");
  return (!origin || origin === url.origin) && (!site || site === "same-origin" || site === "none");
}
function validSlug(slug) { return typeof slug === "string" && /^[a-z0-9][a-z0-9_-]{0,99}$/.test(slug); }
function seedList(type) { return type === "comics" ? seedComics : type === "authors" ? seedAuthors : seedProjects; }
function safeParse(value) { try { return JSON.parse(value); } catch { return null; } }
function cleanFilename(value) { return String(value || "image").replace(/[\u0000-\u001f\\/]/g, "_").slice(0, 180); }
async function hasMatchingImageSignature(file, mime) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mime === "image/gif") return String.fromCharCode(...bytes.slice(0, 3)) === "GIF";
  if (mime === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (mime === "image/avif") return String.fromCharCode(...bytes.slice(4, 12)).includes("ftypavif") || String.fromCharCode(...bytes.slice(4, 12)).includes("ftypavis");
  return false;
}
function constantTimeEqual(left, right) {
  const a = encoder.encode(left), b = encoder.encode(right);
  let diff = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index++) diff |= (a[index] || 0) ^ (b[index] || 0);
  return diff === 0;
}
function isLoginLimited(ip) {
  const attempts = (loginAttempts.get(ip) || []).filter(time => Date.now() - time < 15 * 60 * 1000);
  loginAttempts.set(ip, attempts);
  return attempts.length >= 10;
}
function recordLoginFailure(ip) {
  const attempts = (loginAttempts.get(ip) || []).filter(time => Date.now() - time < 15 * 60 * 1000);
  attempts.push(Date.now()); loginAttempts.set(ip, attempts);
}
function json(body, status = 200, extraHeaders = {}, head = false) {
  return new Response(head ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extraHeaders } });
}
