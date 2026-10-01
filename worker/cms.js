import { authors as seedAuthors, comics as seedComics, projects as seedProjects } from "../seo-data.js";

const TYPES = new Set(["comics", "authors", "projects"]);
const MAX_JSON_BYTES = 1_000_000;
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
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
    return json({ authenticated: await isAuthenticated(request, env) }, 200, { "cache-control": "no-store" });
  }
  if (url.pathname === "/api/cms/logout") {
    if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
    if (!sameOrigin(request, url)) return json({ error: "Origen no permitido." }, 403);
    return json({ ok: true }, 200, { "set-cookie": cookie(url, "", 0) });
  }
  if (url.pathname === "/api/cms/content") {
    if (!await requireCms(request, env, url)) return json({ error: "No autorizado." }, 401);
    if (!env.CMS_DB) return json({ error: "Falta la vinculación D1 CMS_DB." }, 503);
    if (request.method === "GET") return json(await listOverrides(env));
    if (request.method !== "PUT" && request.method !== "DELETE") return json({ error: "Método no permitido." }, 405);
    if (!sameOrigin(request, url)) return json({ error: "Origen no permitido." }, 403);
    return saveContent(request, env);
  }
  if (url.pathname === "/api/cms/media") {
    if (!await requireCms(request, env, url)) return json({ error: "No autorizado." }, 401);
    if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
    if (!sameOrigin(request, url)) return json({ error: "Origen no permitido." }, 403);
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

export async function getContent(env) {
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
  return data;
}

export async function listOverrides(env) {
  if (!env.CMS_DB) throw new Error("Falta la vinculación D1 CMS_DB.");
  const { results = [] } = await env.CMS_DB.prepare("SELECT entity_type, slug, payload, is_deleted, updated_at FROM cms_content ORDER BY entity_type, slug").all();
  return results.map(row => ({ ...row, payload: row.is_deleted ? null : safeParse(row.payload) }));
}

async function saveContent(request, env) {
  if (!env.CMS_DB) return json({ error: "Falta la vinculación D1 CMS_DB." }, 503);
  if (request.method === "DELETE") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON inválido." }, 400); }
    const { type, slug } = body || {};
    if (!TYPES.has(type) || !validSlug(slug)) return json({ error: "Tipo o slug inválido." }, 400);
    await env.CMS_DB.prepare("DELETE FROM cms_content WHERE entity_type = ? AND slug = ?").bind(type, slug).run();
    return json({ ok: true, reset: seedList(type).some(item => item.slug === slug) });
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_JSON_BYTES) return json({ error: "El registro supera el límite de tamaño." }, 413);
  let body;
  try { body = await request.json(); } catch { return json({ error: "JSON inválido." }, 400); }
  const { type, slug, payload } = body || {};
  if (!TYPES.has(type) || !validSlug(slug) || !payload || typeof payload !== "object" || Array.isArray(payload)) return json({ error: "Tipo, slug o registro inválido." }, 400);
  if (payload.slug !== slug) return json({ error: "El slug del registro debe coincidir con la clave y no puede cambiarse." }, 400);
  const jsonPayload = JSON.stringify(payload);
  if (encoder.encode(jsonPayload).byteLength > MAX_JSON_BYTES) return json({ error: "El registro supera el límite de tamaño." }, 413);
  await env.CMS_DB.prepare("INSERT INTO cms_content (entity_type, slug, payload, is_deleted, updated_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP) ON CONFLICT(entity_type, slug) DO UPDATE SET payload=excluded.payload, is_deleted=0, updated_at=CURRENT_TIMESTAMP").bind(type, slug, jsonPayload).run();
  return json({ ok: true, type, slug });
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
  if (!body || typeof body.password !== "string" || body.password.length > 200 || !constantTimeEqual(body.password, env.CMS_ADMIN_PASSWORD)) {
    recordLoginFailure(ip);
    return json({ error: "Contraseña incorrecta." }, 401);
  }
  loginAttempts.delete(ip);
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 12;
  const token = await sign(`${expires}`, env.CMS_SESSION_SECRET);
  return json({ ok: true }, 200, { "set-cookie": cookie(url, `${expires}.${token}`, 60 * 60 * 12) });
}

async function requireCms(request, env, url) {
  if (!sameOrigin(request, url)) return false;
  return isAuthenticated(request, env);
}

async function isAuthenticated(request, env) {
  if (!env.CMS_SESSION_SECRET) return false;
  const token = parseCookies(request.headers.get("cookie") || "").ae_cms;
  if (!token) return false;
  const [expiry, signature, extra] = token.split(".");
  const expires = Number(expiry);
  if (extra || !Number.isInteger(expires) || expires < Date.now() / 1000) return false;
  return constantTimeEqual(signature || "", await sign(expiry, env.CMS_SESSION_SECRET));
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
