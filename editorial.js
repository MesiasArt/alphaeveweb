const missingText = /^(?:undefined|null|nan|\[object object\])$/i;

export function editorialText(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const text = String(value).trim();
  return missingText.test(text) ? '' : text;
}

export function validEditorialLink(value) {
  const link = editorialText(value);
  if (!link || /[\u0000-\u001f\s]/.test(link)) return false;
  if (link.startsWith('/') && !link.startsWith('//')) return true;
  try { const url = new URL(link); return ['https:', 'http:'].includes(url.protocol) && !!url.hostname; }
  catch { return false; }
}

export function publishedChapters(comic) {
  return (Array.isArray(comic?.chapters) ? comic.chapters : []).filter(chapter => chapter && typeof chapter === 'object' && !['draft','borrador','archived','archivado'].includes(String(chapter.status || 'published').toLowerCase()));
}

export function chapterNumber(chapter) {
  const number = Number(chapter?.number);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export function comicReadingState(comic) {
  const chapters = publishedChapters(comic);
  const chapterCount = Number(comic?.chapterCount);
  const total = Number.isInteger(chapterCount) && chapterCount > chapters.length ? chapterCount : null;
  const badge = comic?.format === 'Series' ? `SERIE${chapters.length ? ` · ${chapters.length} CAPÍTULO${chapters.length === 1 ? '' : 'S'}${total ? ` · ${chapters.length} DE ${total}` : ''}` : ''}` : '';
  return { chapters, hasReadingContent: chapters.length > 0, badge };
}

export function comicPreflight(comic) {
  const errors = [], warnings = [];
  const title = editorialText(comic?.title), slug = editorialText(comic?.slug);
  const type = editorialText(comic?.catalogType || comic?.medium);
  const format = editorialText(comic?.format);
  const status = editorialText(comic?.status).toLowerCase();
  const chapters = publishedChapters(comic);
  if (!title) errors.push('Falta el título.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push('Falta un slug válido.');
  if (!editorialText(comic?.cover)) errors.push('Falta la portada principal.');
  else if (!validEditorialLink(comic.cover)) errors.push('La ruta de la portada principal no es válida.');
  if (!type) warnings.push('Falta el tipo de publicación.');
  if (!format) warnings.push('Falta indicar si es serie o tomo único.');
  if (!status) warnings.push('Falta un estado editorial explícito.');
  else if (!['draft','published','archived','borrador','publicado','archivado'].includes(status)) warnings.push('Revisa el estado editorial de la obra.');
  if (title.length > 70) warnings.push('El título es largo para los resultados de búsqueda y puede recortarse.');
  if (!editorialText(comic?.synopsis)) warnings.push('Falta la sinopsis; la ficha y la descripción SEO usarán solo la información disponible.');
  if (!Array.isArray(comic?.creatorSlugs) || !comic.creatorSlugs.length) warnings.push('Faltan creadores acreditados en la obra.');
  if (!Array.isArray(comic?.workAuthorSlugs) || !comic.workAuthorSlugs.length) warnings.push('Falta identificar la autoría principal de la obra.');
  if (format === 'Series' && !chapters.length) warnings.push('La serie no tiene capítulos públicos; no se mostrará una sección de lectura.');
  if (format === 'One-shot' && chapters.length) warnings.push('El tomo único tiene capítulos; revisa si la presentación es correcta.');
  for (const chapter of Array.isArray(comic?.chapters) ? comic.chapters : []) {
    if (!chapter || typeof chapter !== 'object') continue;
    const label = editorialText(chapter.title) || `Capítulo ${chapterNumber(chapter) || ''}`.trim();
    if (publishedChapters({ chapters: [chapter] }).length && !editorialText(chapter.title)) warnings.push(`${label}: falta el título.`);
    if (publishedChapters({ chapters: [chapter] }).length && !editorialText(chapter.cover)) warnings.push(`${label}: falta la portada.`);
    for (const [key, name] of [['readUrl','lectura'],['digitalUrl','compra digital'],['physicalUrl','compra física']]) {
      if (chapter[key] != null && String(chapter[key]).trim() && !validEditorialLink(chapter[key])) errors.push(`${label}: el enlace de ${name} no es válido.`);
    }
  }
  return { errors, warnings, ready: errors.length === 0 };
}
