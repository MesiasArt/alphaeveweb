import { EmailMessage } from "cloudflare:email";
import { pageMetadata, publicRoutes, resolvePage } from "../seo-data.js";

const SERVICES = [
  "Ilustración",
  "Cómics y manga",
  "Diseño de personajes",
  "Arte conceptual",
  "Diseño gráfico",
  "Desarrollo visual",
  "Arte para videojuegos",
  "Otro",
];

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const recentRequests = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") return handleContact(request, env);
    if (url.pathname === "/robots.txt") return robotsResponse(url, request.method);
    if (url.pathname === "/sitemap.xml") return sitemapResponse(url, request.method);

    const pathname = normalizePath(url.pathname);
    if (/\.[a-z\d]{2,8}$/i.test(url.pathname) && !["/index.html"].includes(url.pathname)) {
      return env.ASSETS.fetch(request);
    }
    const page = resolvePage(pathname, url.origin);
    if (!page) {
      const notFoundUrl = new URL("/index.html", url);
      const notFoundRequest = new Request(notFoundUrl, request);
      const response = await env.ASSETS.fetch(notFoundRequest);
      return withSeoHead(response, {
        title: "Página no encontrada — Alpha Eve Studios",
        description: "La página solicitada no existe.",
        canonical: "",
        image: "",
        ogType: "website",
        schema: null,
      }, 404, request.method);
    }

    const documentRequest = new Request(new URL("/index.html", url), request);
    const response = await env.ASSETS.fetch(documentRequest);
    return withSeoHead(response, pageMetadata(pathname, url.origin), response.status, request.method);
  },
};

function normalizePath(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { decoded = pathname; }
  decoded = decoded.replace(/\/+$/, "") || "/";
  return decoded === "/index.html" ? "/" : decoded;
}

function robotsResponse(url, method) {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${url.origin}/sitemap.xml\n`;
  return new Response(method === "HEAD" ? null : body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}

function sitemapResponse(url, method) {
  const entries = publicRoutes().map(path => `  <url><loc>${xmlEscape(new URL(path, url.origin).href)}</loc></url>`).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  return new Response(method === "HEAD" ? null : body, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}

function xmlEscape(value) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]);
}

function htmlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function withSeoHead(response, metadata, status = response.status, method = "GET") {
  const headers = new Headers(response.headers);
  if (!headers.get("content-type")?.includes("text/html")) return response;
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  let html = response.body ? null : "";
  return response.text().then(source => {
    const canonical = metadata.canonical ? `<link rel="canonical" href="${htmlEscape(metadata.canonical)}">` : "";
    const imageTags = metadata.image ? `<meta property="og:image" content="${htmlEscape(metadata.image)}"><meta name="twitter:image" content="${htmlEscape(metadata.image)}">` : "";
    const social = metadata.canonical ? `<meta property="og:title" content="${htmlEscape(metadata.title)}"><meta property="og:description" content="${htmlEscape(metadata.description)}"><meta property="og:url" content="${htmlEscape(metadata.canonical)}"><meta property="og:type" content="${htmlEscape(metadata.ogType)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${htmlEscape(metadata.title)}"><meta name="twitter:description" content="${htmlEscape(metadata.description)}">${imageTags}` : '<meta name="robots" content="noindex,follow">';
    const schema = metadata.schema ? `<script type="application/ld+json" data-page-schema="true">${JSON.stringify(metadata.schema).replace(/</g, "\\u003c")}</script>` : "";
    const robots = metadata.indexable === false ? '<meta name="robots" content="noindex,follow">' : "";
    const head = `<title>${htmlEscape(metadata.title)}</title><meta name="description" content="${htmlEscape(metadata.description)}">${canonical}${robots}${social}${schema}`;
    html = source.replace(/<title>[^<]*<\/title>/i, "").replace(/<meta\s+name=["']description["'][^>]*>/i, "").replace(/<\/head>/i, `${head}</head>`);
    return new Response(method === "HEAD" ? null : html, { status, statusText: status === 404 ? "Not Found" : response.statusText, headers });
  });
}

async function handleContact(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return json({ ok: false, error: "Método no permitido." }, 405);
  }
  if (!sameSite(request)) {
    return json({ ok: false, error: "Este formulario solo se puede enviar desde el sitio de Alpha Eve." }, 403);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (isRateLimited(ip)) {
    return json({ ok: false, error: "Llegaron demasiadas consultas desde esta conexión. Inténtalo de nuevo más tarde." }, 429);
  }

  const length = Number(request.headers.get("content-length") || 0);
  if (length > 32000) {
    return json({ ok: false, error: "El mensaje es demasiado largo." }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "No se pudo leer la consulta." }, 400);
  }

  if (singleLine(payload?.confirm_url, 200)) {
    return json({ ok: true });
  }

  const inquiry = validate(payload);
  if (inquiry.error) return json({ ok: false, error: inquiry.error }, 400);

  const to = singleLine(env.CONTACT_TO, 200);
  const from = singleLine(env.CONTACT_FROM, 200);
  if (!to || !from || !env.EMAIL?.send) {
    return json({ ok: false, error: "El correo de contacto todavía no está configurado." }, 503);
  }

  try {
    await env.EMAIL.send(new EmailMessage(from, to, mimeMessage({ from, to, inquiry })));
  } catch (error) {
    console.error("Contact email failed", error);
    return json({ ok: false, error: "No pudimos enviar tu consulta. Inténtalo de nuevo." }, 502);
  }

  return json({ ok: true });
}

function validate(payload) {
  const name = singleLine(payload?.name, 120);
  const email = singleLine(payload?.email, 200).toLowerCase();
  const company = singleLine(payload?.company, 160);
  const service = singleLine(payload?.service, 80);
  const description = clean(payload?.description, 4000);
  const budget = singleLine(payload?.budget, 120);
  const timeline = singleLine(payload?.timeline, 120);
  const reference = singleLine(payload?.reference, 300);

  if (name.length < 2) return { error: "Escribe tu nombre." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Escribe un correo válido." };
  if (!SERVICES.includes(service)) return { error: "Selecciona un servicio." };
  if (description.length < 10) return { error: "Describe el proyecto con un poco más de detalle." };
  if (reference && !isHttpUrl(reference)) return { error: "La referencia debe ser una dirección http o https completa." };

  return { name, email, company, service, description, budget, timeline, reference };
}

function mimeMessage({ from, to, inquiry }) {
  const subject = encodeHeader(`Nueva consulta de proyecto — ${inquiry.name}`);
  const lines = [
    `Nombre: ${inquiry.name}`,
    `Correo: ${inquiry.email}`,
    `Empresa / organización: ${inquiry.company || "—"}`,
    `Servicio: ${inquiry.service}`,
    `Presupuesto: ${inquiry.budget || "—"}`,
    `Plazo: ${inquiry.timeline || "—"}`,
    `Sitio web / referencia: ${inquiry.reference || "—"}`,
    "",
    "Descripción del proyecto:",
    inquiry.description,
  ];
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Reply-To: ${inquiry.email}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    lines.join("\r\n"),
  ].join("\r\n");
}

function encodeHeader(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

function clean(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function singleLine(value, max) {
  return clean(value, max).replace(/[\r\n]+/g, " ");
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sameSite(request) {
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (recentRequests.get(ip) || []).filter(time => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    recentRequests.set(ip, recent);
    return true;
  }
  recent.push(now);
  recentRequests.set(ip, recent);
  if (recentRequests.size > 2000) {
    for (const [key, times] of recentRequests) {
      if (times.every(time => now - time >= WINDOW_MS)) recentRequests.delete(key);
    }
  }
  return false;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "Origin",
  };
}
