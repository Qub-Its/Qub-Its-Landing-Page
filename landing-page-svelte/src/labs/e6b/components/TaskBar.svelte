<script>
  // Strip above the instrument showing the current exercise: level, task, quiz choices or typed answers,
  // Show me, hint and "why". In free mode it shows the open practice problem, if any.
  import { LEVELS } from '../content/exercises.js';
  import { glossHtml } from '../content/glossary.js';
  import AnswerFields from './AnswerFields.svelte';
  import { UI, tr } from '../i18n.js';

  /**
   * @type {{
   *   lang: 'es'|'en', status: 'free'|'active'|'done'|'levelDone', level: number|null, index: number, count: number,
   *   task: import('../content/exercises.js').Exercise|null, hintOpen: boolean, whyOpen: boolean,
   *   picked: number[], wrong: boolean, explain: boolean, practicePrompt: string,
   *   onhint: () => void, onwhy: () => void, onopen: (tab?: 'guide'|'ex'|'practice') => void, onnext: () => void,
   *   onskip: () => void, onanswer: (i: number) => void, onsolved: () => void, onshowme: () => void
   * }}
   */
  let { lang, status, level, index, count, task, hintOpen, whyOpen, picked, wrong, explain, practicePrompt,
    onhint, onwhy, onopen, onnext, onskip, onanswer, onsolved, onshowme } = $props();

  const t = $derived(UI[lang]);
  const lvName = $derived(level == null ? '' : tr(LEVELS[level].name, lang));
</script>

<div class="taskbar" class:free={status === 'free'} role="region" aria-label={t.exercises}>
  {#if status === 'free' && practicePrompt}
    <div class="tb-head"><span class="lvl">{t.practice}</span><button type="button" class="linkbtn" onclick={() => onopen('practice')}>{t.answerPractice}</button></div>
    <div class="task">{practicePrompt}</div>
  {:else if status === 'free'}
    <div class="tb-head"><span class="lvl">{t.free}</span><button type="button" class="linkbtn" onclick={() => onopen('ex')}>{t.pickEx}</button></div>
    <div class="task">{t.freeTask}</div>
  {:else if status === 'levelDone'}
    <div class="tb-head"><span class="lvl">{t.level(level + 1)} · {lvName} · {t.completed}</span><button type="button" class="linkbtn" onclick={() => onopen('ex')}>{t.viewLevels}</button></div>
    <div class="task">{t.levelDone} {t.levelDoneText}</div>
  {:else if task}
    <div class="tb-head">
      <span class="lvl">{t.level(level + 1)} · {lvName} · {t.taskOf(index + 1, count)}</span>
      <span class="tb-links">
        {#if status === 'active' && task.demo}<button type="button" class="linkbtn" onclick={onshowme}>{t.showMe}</button>{/if}
        <button type="button" class="linkbtn" aria-expanded={hintOpen} onclick={onhint}>{hintOpen ? t.hideHint : t.hint}</button>
        <button type="button" class="linkbtn" aria-expanded={whyOpen} onclick={onwhy}>{whyOpen ? t.hideWhy : t.whyBtn}</button>
        {#if status === 'active'}<button type="button" class="linkbtn" onclick={onskip}>{t.skip}</button>{/if}
      </span>
    </div>
    <div class="task">{@html glossHtml(tr(task.task, lang), lang)}</div>

    {#if status === 'active' && task.quiz}
      <div class="choices" role="group" aria-label={t.pickAnswer}>
        {#each task.quiz.choices as c, i}
          <button type="button" class="choice" class:bad={picked.includes(i)} disabled={picked.includes(i)} onclick={() => onanswer(i)}>{tr(c, lang)}</button>
        {/each}
      </div>
      {#if wrong}<div class="note wrong" role="status">{t.wrong}</div>{/if}
    {:else if status === 'active' && task.answers}
      {#key task.id}
        <AnswerFields {lang} fields={task.answers} idPrefix="tb" onresult={(all) => { if (all) onsolved(); }} />
      {/key}
    {:else if status === 'active' && task.check}
      {#if task.explain && !explain}<div class="note">{t.clickPart}</div>{/if}
    {/if}

    {#if status === 'done'}
      <div class="complete" role="status">{t.taskDone}
        <button type="button" class="linkbtn" onclick={onnext}>{index + 1 < count ? t.next : t.viewLevels}</button></div>
    {/if}
    {#if hintOpen}<div class="hint">{@html glossHtml(tr(task.hint, lang), lang)}</div>{/if}
    {#if whyOpen}<div class="why">{@html glossHtml(tr(task.why, lang), lang)}</div>{/if}
  {/if}
</div>
