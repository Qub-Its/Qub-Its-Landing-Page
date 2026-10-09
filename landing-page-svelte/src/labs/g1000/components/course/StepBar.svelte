<script>
  // Strip above the stage with the current step: scene caption and shot controls, explanation text, task (hint,
  // why, Show me, done) or quiz (options). Prev / Next always available; Next on the last step finishes the lesson.
  import { glossHtml } from '../../content/glossary.js';
  import { UI, tr } from '../../i18n.js';
  import { quizOrder } from '../../lib/course.js';

  /**
   * @type {{ lang: 'es'|'en', lesson: any, index: number, done: boolean, cueIndex: number, picked: number[], demoOpen: boolean,
   *   onprev: () => void, onnext: () => void, oncue: (i: number) => void, onanswer: (i: number) => void, onshowme: () => void }}
   */
  let { lang, lesson, index, done, cueIndex, picked, demoOpen, onprev, onnext, oncue, onanswer, onshowme } = $props();

  const t = $derived(UI[lang]);
  const st = $derived(lesson.steps[index]);
  const last = $derived(index === lesson.steps.length - 1);
  let hintOpen = $state(false), whyOpen = $state(false);
  $effect(() => { void (st.id ?? `${lesson.id}:${index}`); hintOpen = false; whyOpen = false; });
  const KIND = { scene: 'scene', explain: 'explainStep', task: 'task', quiz: 'quiz' };
</script>

<div class="taskbar stepbar" class:done>
  <div class="tb-head">
    <span class="lvl">{t.lessonN(lesson.n)} · {t[KIND[st.kind]]} · {t.stepOf(index + 1, lesson.steps.length)}</span>
    <span class="tb-links">
      <button type="button" class="btn" disabled={index === 0} onclick={onprev}>{t.prev}</button>
      <button type="button" class="btn primary" onclick={onnext}>{last ? t.finish : t.next}</button>
    </span>
  </div>

  {#if st.kind === 'scene'}
    <p class="task">{@html glossHtml(tr(st.caption, lang), lang)}</p>
    <div class="tb-links">
      <button type="button" class="linkbtn" onclick={() => oncue((cueIndex + 1) % st.cues.length)}>{t.cueNext} ({cueIndex + 1}/{st.cues.length})</button>
      <button type="button" class="linkbtn" onclick={() => oncue(0)}>{t.cueReplay}</button>
    </div>
  {:else if st.kind === 'explain'}
    <p class="task"><b>{tr(st.title, lang)}.</b> {@html glossHtml(tr(st.text, lang), lang)}</p>
  {:else if st.kind === 'task'}
    <p class="task">{#if done}<span class="ok">✓ {t.taskDone}</span> {/if}{@html glossHtml(tr(st.task, lang), lang)}</p>
    {#if hintOpen}<p class="hint">{@html glossHtml(tr(st.hint, lang), lang)}</p>{/if}
    {#if whyOpen}<p class="hint why">{@html glossHtml(tr(st.why, lang), lang)}</p>{/if}
    <div class="tb-links">
      <button type="button" class="linkbtn" aria-expanded={hintOpen} onclick={() => (hintOpen = !hintOpen)}>{t.hint}</button>
      <button type="button" class="linkbtn" aria-expanded={whyOpen} onclick={() => (whyOpen = !whyOpen)}>{t.why}</button>
      <button type="button" class="linkbtn" disabled={demoOpen} onclick={onshowme}>{t.showMe}</button>
    </div>
  {:else if st.kind === 'quiz'}
    <p class="task">{tr(st.q, lang)}</p>
    <div class="choices">
      {#each quizOrder(st.id, st.options.length) as i}
        <button type="button" class="choice" class:bad={picked.includes(i)} class:good={done && i === st.answer}
          disabled={done || picked.includes(i)} onclick={() => onanswer(i)}>{tr(st.options[i], lang)}</button>
      {/each}
    </div>
    {#if done}<p class="hint why"><span class="ok">✓ {t.correct}</span> {@html glossHtml(tr(st.why, lang), lang)}</p>
    {:else if picked.length}<p class="note wrong">{t.wrong}</p>{/if}
  {/if}
</div>
