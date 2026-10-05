import { pageMetadata, publicRoutes, resolvePage } from '../seo-data.js';
import { getContent } from './cms.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function normalizePath(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { decoded = pathname; }
  decoded = decoded.replace(/\/+$/, '') || '/';
  return decoded === '/index.html' ? '/' : decoded;
}

function initialPage(page, content) {
  if (page.path === '/') return '';
  const title = page.comic?.title || page.author?.name || page.project?.title || page.title.replace(/ — Alpha Eve Studios$/, '');
  const image = (page.comic || page.author || page.project) && page.image
    ? `<img src="${escapeHtml(page.image)}" alt="${escapeHtml(title)}" width="320" style="display:block;max-width:100%;height:auto">`
    : '';
  const intro = `<div class="directory-heading"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(page.description)}</p></div>`;
  let links = '';
  if (page.path === '/comics') links = content.comics.map(comic => `<li><a href="/comics/${encodeURIComponent(comic.slug)}">${escapeHtml(comic.title)}</a></li>`).join('');
  if (page.path === '/authors') links = content.authors.map(author => `<li><a href="/authors/${encodeURIComponent(author.slug)}">${escapeHtml(author.name)}</a></li>`).join('');
  if (page.path === '/projects') links = content.projects.map(project => `<li><a href="/projects/${encodeURIComponent(project.slug)}">${escapeHtml(project.title)}</a></li>`).join('');
  return `<section class="directory-page" data-initial-page>${intro}${image}${links ? `<ul>${links}</ul>` : ''}</section>`;
}

function initialContentScript(content) {
  // A JSON script is inert, and escaping '<' prevents CMS text from closing it.
  return `<script type="application/json" id="initial-public-content">${JSON.stringify(content).replace(/</g, '\\u003c')}</script>`;
}

function withSeoHead(response, metadata, status, method, content, page) {
  const headers = new Headers(response.headers);
  if (!headers.get('content-type')?.includes('text/html')) return response;
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');
  headers.set('cache-control', 'no-store');
  return response.text().then(source => {
    const canonical = metadata.canonical ? `<link rel="canonical" href="${escapeHtml(metadata.canonical)}">` : '';
    const imageTags = metadata.image ? `<meta property="og:image" content="${escapeHtml(metadata.image)}"><meta name="twitter:image" content="${escapeHtml(metadata.image)}">` : '';
    const social = metadata.canonical ? `<meta property="og:title" content="${escapeHtml(metadata.title)}"><meta property="og:description" content="${escapeHtml(metadata.description)}"><meta property="og:url" content="${escapeHtml(metadata.canonical)}"><meta property="og:type" content="${escapeHtml(metadata.ogType)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(metadata.title)}"><meta name="twitter:description" content="${escapeHtml(metadata.description)}">${imageTags}` : '<meta name="robots" content="noindex,follow">';
    const schema = metadata.schema ? `<script type="application/ld+json" data-page-schema="true">${JSON.stringify(metadata.schema).replace(/</g, '\\u003c')}</script>` : '';
    const robots = metadata.indexable === false ? '<meta name="robots" content="noindex,follow">' : '';
    const head = `<title>${escapeHtml(metadata.title)}</title><meta name="description" content="${escapeHtml(metadata.description)}">${canonical}${robots}${social}${schema}`;
    let html = source.replace(/<title>[^<]*<\/title>/i, '').replace(/<meta\s+name=["']description["'][^>]*>/i, '');
    html = html.replace(/<\/head>/i, () => `${head}${initialContentScript(content)}</head>`);
    if (page?.path !== '/') {
      const markup = page ? initialPage(page, content) : '<section class="directory-page"><h1>Página no encontrada</h1></section>';
      html = html.replace(/(<main id="app">)[\s\S]*?(<\/main>)/i, (_, open, close) => `${open}${markup}${close}`);
    }
    return new Response(method === 'HEAD' ? null : html, { status, statusText: status === 404 ? 'Not Found' : response.statusText, headers });
  });
}

export async function servePublicPage(request, env, url = new URL(request.url)) {
  const content = await getContent(env);
  const pathname = normalizePath(url.pathname);
  const page = resolvePage(pathname, url.origin, content);
  const assetRequest = new Request(new URL('/index.html', url), request);
  const response = await env.ASSETS.fetch(assetRequest);
  if (!page) {
    return withSeoHead(response, {
      title: 'Página no encontrada — Alpha Eve Studios',
      description: 'La página solicitada no existe.',
      canonical: '', image: '', ogType: 'website', schema: null,
    }, 404, request.method, content, null);
  }
  return withSeoHead(response, pageMetadata(pathname, url.origin, content), response.status, request.method, content, page);
}

export async function serveSitemap(request, env, url = new URL(request.url)) {
  const content = await getContent(env);
  const entries = publicRoutes(content).map(path => `  <url><loc>${escapeHtml(new URL(path, url.origin).href)}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  return new Response(request.method === 'HEAD' ? null : body, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}

export function serveRobots(request, url = new URL(request.url)) {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${url.origin}/sitemap.xml\n`;
  return new Response(request.method === 'HEAD' ? null : body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
