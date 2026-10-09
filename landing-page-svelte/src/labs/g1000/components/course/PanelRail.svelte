<script>
  // Collapsed form of the course panel on desktop: a slim rail on the right edge; each button expands on its tab.
  import { UI } from '../../i18n.js';

  /** @type {{ lang: 'es'|'en', onexpand: (tab: 'lesson'|'lessons'|'explain') => void }} */
  let { lang, onexpand } = $props();
  const t = $derived(UI[lang]);
</script>

<nav class="rail" aria-label={t.railLabel}>
  <button type="button" class="rail-btn rail-chevron" aria-controls="panel" aria-expanded="false" title={t.railLabel}
    onclick={() => onexpand('lesson')}><span aria-hidden="true">«</span><span class="sr-only">{t.railLabel}</span></button>
  <button type="button" class="rail-btn" data-tab="lesson" aria-controls="panel" aria-expanded="false" onclick={() => onexpand('lesson')}>{t.tabLesson}</button>
  <button type="button" class="rail-btn" data-tab="lessons" aria-controls="panel" aria-expanded="false" onclick={() => onexpand('lessons')}>{t.tabLessons}</button>
  <button type="button" class="rail-btn" data-tab="explain" aria-controls="panel" aria-expanded="false" onclick={() => onexpand('explain')}>{t.tabExplain}</button>
</nav>
