<script>
  // "Lección" tab: title, objectives and the step list of the current lesson (click a step to jump there).
  import { UI, tr } from '../../i18n.js';

  /** @type {{ lang: 'es'|'en', lesson: any, index: number, done: Record<string, true>, ongo: (i: number) => void }} */
  let { lang, lesson, index, done, ongo } = $props();
  const t = $derived(UI[lang]);
  const KIND = { scene: 'scene', explain: 'explainStep', task: 'task', quiz: 'quiz' };
  const label = (st) => tr(st.kind === 'scene' ? st.caption : st.kind === 'explain' ? st.title : st.kind === 'task' ? st.task : st.q, lang);
</script>

<section>
  <h2>{t.lessonN(lesson.n)} · {tr(lesson.title, lang)}</h2>
  <h3 class="sub">{t.objectives}</h3>
  <ul class="objectives">{#each lesson.objectives[lang] as o}<li>{o}</li>{/each}</ul>
</section>
<ol class="steps">
  {#each lesson.steps as st, i}
    <li>
      <button type="button" class="step" class:on={i === index} class:ok={st.id && done[st.id]} aria-current={i === index ? 'step' : undefined} onclick={() => ongo(i)}>
        <span class="step-kind">{st.id && done[st.id] ? '✓' : i + 1}</span>
        <span><b>{t[KIND[st.kind]]}</b> — {label(st).slice(0, 90)}{label(st).length > 90 ? '…' : ''}</span>
      </button>
    </li>
  {/each}
</ol>
