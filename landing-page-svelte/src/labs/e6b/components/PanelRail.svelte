<script>
  // Collapsed form of the Guía / Ejercicios / Práctica panel on desktop: a slim rail on the right edge.
  // Each button expands the panel on its tab. Hidden at ≤ 980px, where the panel is a bottom sheet.
  import { UI } from '../i18n.js';

  /** @type {{ lang: 'es'|'en', onexpand: (tab: 'guide'|'ex'|'practice') => void }} */
  let { lang, onexpand } = $props();

  const t = $derived(UI[lang]);
</script>

<nav class="rail" aria-label={t.railLabel}>
  <button type="button" class="rail-btn rail-chevron" aria-controls="panel" aria-expanded="false" title={t.railLabel}
    onclick={() => onexpand('guide')}><span aria-hidden="true">«</span><span class="sr-only">{t.railLabel}</span></button>
  <button type="button" class="rail-btn" data-tab="guide" aria-controls="panel" aria-expanded="false"
    onclick={() => onexpand('guide')}>{t.guide}</button>
  <button type="button" class="rail-btn" data-tab="ex" aria-controls="panel" aria-expanded="false"
    onclick={() => onexpand('ex')}>{t.exercises}</button>
  <button type="button" class="rail-btn" data-tab="practice" aria-controls="panel" aria-expanded="false"
    onclick={() => onexpand('practice')}>{t.practice}</button>
</nav>
