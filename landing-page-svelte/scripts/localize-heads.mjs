// Runs after `vite build`. Both pages are single HTML files whose <head> is written in Spanish;
// crawlers and link previews that do not run JavaScript would otherwise see Spanish metadata on
// the /en/ URLs. This writes English copies with a static English <head> into dist/en/.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seo } from '../src/seo.js';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const attr = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

function replaceOnce(html, pattern, replacement, label) {
  const matches = html.match(new RegExp(pattern.source, 'g')) || [];
  if (matches.length !== 1) throw new Error(`localize-heads: expected one ${label}, found ${matches.length}`);
  return html.replace(pattern, replacement);
}

const setMeta = (html, key, value) =>
  replaceOnce(html, new RegExp(`(<meta (?:name|property)="${key}" content=")[^"]*(")`), `$1${attr(value)}$2`, key);

function localizeHead(html, meta, editJsonLd) {
  html = replaceOnce(html, /<html lang="[a-z]+"/, `<html lang="${meta.lang}"`, 'html lang');
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${attr(meta.title)}</title>`, 'title');
  html = replaceOnce(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${meta.url}$2`, 'canonical');
  html = setMeta(html, 'description', meta.description);
  html = setMeta(html, 'og:locale', meta.ogLocale);
  html = setMeta(html, 'og:locale:alternate', 'es_ES');
  html = setMeta(html, 'og:title', meta.title);
  html = setMeta(html, 'og:description', meta.ogDescription);
  html = setMeta(html, 'og:url', meta.url);
  html = setMeta(html, 'og:image:alt', meta.imageAlt);
  html = setMeta(html, 'twitter:title', meta.title);
  html = setMeta(html, 'twitter:description', meta.ogDescription);
  return replaceOnce(html, /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_, open, json, close) => {
    const data = JSON.parse(json);
    editJsonLd(data['@graph']);
    return `${open}\n${JSON.stringify(data)}\n${close}`;
  }, 'JSON-LD');
}

// The Spanish head lives in the HTML files; fail the build if it drifts from src/seo.js.
function readSpanish(relativePath, meta) {
  const html = readFileSync(join(dist, relativePath), 'utf8');
  for (const value of [`<title>${attr(meta.title)}</title>`, `content="${attr(meta.description)}"`, `href="${meta.url}"`]) {
    if (!html.includes(value)) throw new Error(`localize-heads: dist/${relativePath} is out of sync with src/seo.js (${value})`);
  }
  return html;
}

function write(relativePath, html) {
  const file = join(dist, relativePath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log(`localize-heads: wrote dist/${relativePath}`);
}

const byType = (graph, type) => graph.find((node) => node['@type'] === type);

const home = seo.home.en;
write('en/index.html', localizeHead(readSpanish('index.html', seo.home.es), home, (graph) => {
  byType(graph, 'Organization').description = 'Digital product studio and custom software development.';
  byType(graph, 'ProfessionalService').description = 'Custom software development, web platforms, and digital products.';
}));

const mcdu = seo.mcdu.en;
write('en/labs/mcdu-trainer/index.html', localizeHead(readSpanish('labs/mcdu-trainer/index.html', seo.mcdu.es), mcdu, (graph) => {
  const app = byType(graph, 'WebApplication');
  Object.assign(app, { '@id': `${mcdu.url}#app`, name: 'A320 MCDU Trainer', url: mcdu.url, description: mcdu.description, inLanguage: 'en' });
  const [site, labs, page] = byType(graph, 'BreadcrumbList').itemListElement;
  site.item = seo.home.en.url;
  labs.item = `${seo.home.en.url}#labs`;
  Object.assign(page, { name: 'A320 MCDU Trainer', item: mcdu.url });
}));

const pfd = seo.pfd.en;
write('en/labs/pfd-trainer/index.html', localizeHead(readSpanish('labs/pfd-trainer/index.html', seo.pfd.es), pfd, (graph) => {
  const app = byType(graph, 'WebApplication');
  Object.assign(app, { '@id': `${pfd.url}#app`, name: 'A320 PFD Trainer', url: pfd.url, description: pfd.description, inLanguage: 'en' });
  const [site, labs, page] = byType(graph, 'BreadcrumbList').itemListElement;
  site.item = seo.home.en.url;
  labs.item = `${seo.home.en.url}#labs`;
  Object.assign(page, { name: 'A320 PFD Trainer', item: pfd.url });
}));
