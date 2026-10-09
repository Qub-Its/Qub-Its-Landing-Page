<script>
  // Exercises tab: level cards, the current level's task list with progress, start/restart actions.
  import { LEVELS, EXERCISES, tasksOf } from '../content/exercises.js';
  import { glossHtml } from '../content/glossary.js';
  import { UI, tr } from '../i18n.js';

  /**
   * @type {{ lang: 'es'|'en', done: Record<string, true>, activeLevel: number|null, taskId: string|null,
   *   onstart: (level: number) => void, onrestart: (level: number) => void, onreset: () => void }}
   */
  let { lang, done, activeLevel, taskId, onstart, onrestart, onreset } = $props();

  const t = $derived(UI[lang]);
  // Level shown in the card: the one in progress, else the first with pending tasks.
  let picked = $state(/** @type {number|null} */ (null));
  const firstPending = $derived(LEVELS.find((l) => tasksOf(l.id).some((e) => !done[e.id]))?.id ?? 0);
  const viewing = $derived(picked ?? activeLevel ?? firstPending);
  const count = (lv) => tasksOf(lv).filter((e) => done[e.id]).length;
  const tasks = $derived(tasksOf(viewing));
  const doneCount = $derived(count(viewing));
  const anyDone = $derived(EXERCISES.some((e) => done[e.id]));
</script>

<section>
  <h2>{t.levels}</h2>
  <p class="note" style="margin-bottom:10px">{t.levelsNote}</p>
  <div class="levels">
    {#each LEVELS as l}
      {@const n = tasksOf(l.id).length}
      <button type="button" class="lv" class:active={activeLevel === l.id} aria-current={viewing === l.id} onclick={() => (picked = l.id)}>
        <span class="n"><span>{t.level(l.id + 1)}</span><span>{count(l.id)}/{n}</span></span>
        <span class="t">{tr(l.name, lang)}</span>
        <span class="bar"><i style="width:{(count(l.id) / n) * 100}%"></i></span>
      </button>
    {/each}
  </div>
</section>

<section class="lvcard">
  <h3>{t.level(viewing + 1)} · {tr(LEVELS[viewing].name, lang)}</h3>
  <p class="intro">{tr(LEVELS[viewing].intro, lang)}</p>
  <div class="actions">
    {#if doneCount < tasks.length}
      <button type="button" class="btn primary" onclick={() => onstart(viewing)}>{doneCount ? t.cont : t.start}</button>
    {/if}
    {#if doneCount > 0}
      <button type="button" class="btn ghost" onclick={() => onrestart(viewing)}>{t.restart}</button>
    {/if}
  </div>
  {#if doneCount === tasks.length}<div class="complete">{t.levelDone} {t.levelDoneText}</div>{/if}
  <ul class="tasks">
    {#each tasks as e, j}
      {@const isDone = !!done[e.id]}
      {@const cur = activeLevel === viewing && taskId === e.id}
      <li class:done={isDone} class:cur>
        <span class="st" aria-hidden="true">{isDone ? '✓' : cur ? '▸' : j + 1}</span>
        <div><span class="sr-only">{isDone ? t.completed + ': ' : ''}</span>{@html glossHtml(tr(e.task, lang), lang)}</div>
      </li>
    {/each}
  </ul>
</section>

<p class="note">{t.progressNote}
  {#if anyDone}<button type="button" class="linkbtn" onclick={onreset}>{t.resetProgress}</button>{/if}</p>
