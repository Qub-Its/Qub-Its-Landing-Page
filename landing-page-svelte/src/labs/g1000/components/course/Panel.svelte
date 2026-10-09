<script>
  // Right-hand panel (bottom sheet ≤ 980px): Lección (current lesson), Lecciones (list) and Explicar (explain card).
  import ExplainCard from './ExplainCard.svelte';
  import { UI } from '../../i18n.js';

  /**
   * @type {{ lang: 'es'|'en', tab: 'lesson'|'lessons'|'explain', open: boolean, part: string|null, explain: boolean,
   *   onclearpart: () => void, onclose: () => void, oncollapse: () => void, lesson: import('svelte').Snippet, lessons: import('svelte').Snippet }}
   */
  let { lang, tab = $bindable(), open, part, explain, onclearpart, onclose, oncollapse, lesson, lessons } = $props();
  const t = $derived(UI[lang]);
</script>

<aside class="panel" class:open id="panel" aria-label={t.panelLabel}>
  <div class="tabs" role="tablist">
    <button class="tab" role="tab" id="tabLesson" aria-selected={tab === 'lesson'} aria-controls="lessonBody" onclick={() => (tab = 'lesson')}>{t.tabLesson}</button>
    <button class="tab" role="tab" id="tabLessons" aria-selected={tab === 'lessons'} aria-controls="lessonsBody" onclick={() => (tab = 'lessons')}>{t.tabLessons}</button>
    <button class="tab" role="tab" id="tabExplain" aria-selected={tab === 'explain'} aria-controls="explainBody" onclick={() => (tab = 'explain')}>{t.tabExplain}</button>
    <button class="collapse-panel" type="button" data-collapse aria-controls="panel" aria-expanded="true" aria-label={t.collapsePanel}
      title={t.collapsePanel} onclick={oncollapse}>»</button>
    <button class="close-sheet" aria-label={t.closePanel} onclick={onclose}>×</button>
  </div>
  <div class="tabbody" id="lessonBody" role="tabpanel" aria-labelledby="tabLesson" hidden={tab !== 'lesson'}>{@render lesson()}</div>
  <div class="tabbody" id="lessonsBody" role="tabpanel" aria-labelledby="tabLessons" hidden={tab !== 'lessons'}>{@render lessons()}</div>
  <div class="tabbody" id="explainBody" role="tabpanel" aria-labelledby="tabExplain" hidden={tab !== 'explain'}>
    <ExplainCard {lang} {part} {explain} onclear={onclearpart} />
    <p class="kbd-note">{t.kbdNote}</p>
  </div>
</aside>
