<script>
  // Placeholder shell (Task 1): header, page head sync and disclaimer. Replaced by the course shell in Task 9.
  import { seo } from '../../seo.js';
  import { detectLang, UI } from './i18n.js';

  const lang = detectLang();
  const t = UI[lang];
  const meta = seo.g1000[lang];
  document.title = meta.title;
  document.documentElement.lang = meta.lang;
</script>

<header class="top">
  <div class="brand">
    <span class="plate">{t.plate}</span>
    <div>
      <h1>{t.title}</h1>
      <p>{t.subtitle}</p>
    </div>
  </div>
  <div class="top-actions">
    <a class="btn" href={t.langHref} lang={lang === 'es' ? 'en' : 'es'} aria-label={t.langLabel}>{t.langText}</a>
    <a class="btn ghost" href={t.backHref}>{t.back}</a>
  </div>
</header>
<main class="layout g1000-layout"><section class="sim"><p>{t.subtitle}</p></section></main>
<footer class="foot"><p>{t.disclaimer}</p></footer>
