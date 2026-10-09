<script>
  // "Lecciones" tab: the 8 MVP1 lessons with progress, the coming-soon ones, and progress reset.
  import { LESSONS, COMING } from '../../content/lessons.js';
  import { lessonProgress } from '../../lib/course.js';
  import { UI, tr } from '../../i18n.js';

  /** @type {{ lang: 'es'|'en', done: Record<string, true>, current: number, onopen: (i: number) => void, onreset: () => void }} */
  let { lang, done, current, onopen, onreset } = $props();
  const t = $derived(UI[lang]);
</script>

<ol class="lessons">
  {#each LESSONS as l, i}
    {@const p = lessonProgress(l, done)}
    <li>
      <button type="button" class="lv" class:on={i === current} aria-current={i === current ? 'step' : undefined} onclick={() => onopen(i)}>
        <span class="lv-n">{t.lessonN(l.n)}</span>
        <span class="lv-title">{tr(l.title, lang)}</span>
        <span class="lv-bar" aria-hidden="true"><span style:width={`${(p.done / p.total) * 100}%`}></span></span>
        <span class="lv-meta">{p.done}/{p.total} · {p.done === 0 ? t.start : p.done === p.total ? t.review : t.resume}</span>
      </button>
    </li>
  {/each}
  {#each COMING as c}
    <li><div class="lv soon"><span class="lv-n">{t.lessonN(c.n)}</span><span class="lv-title">{tr(c.title, lang)}</span><span class="lv-meta">{t.coming}</span></div></li>
  {/each}
</ol>
<p class="note">{t.progressNote}</p>
<button type="button" class="linkbtn" onclick={onreset}>{t.resetProgress}</button>
