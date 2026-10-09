<script>
  // E6B trainer page shell: header, E6B + task strip + Show me bar on the left, Guía / Ejercicios / Práctica panel
  // on the right (collapsible to a rail on desktop, bottom sheet ≤ 980px), explain mode, exercise runner,
  // glossary, feedback and head metadata.
  import { onMount, tick } from 'svelte';
  import { seo } from '../../seo.js';
  import { detectLang, UI } from './i18n.js';
  import E6b from './components/E6b.svelte';
  import Panel from './components/Panel.svelte';
  import PanelRail from './components/PanelRail.svelte';
  import ExplainCard from './components/ExplainCard.svelte';
  import Exercises from './components/Exercises.svelte';
  import Practice from './components/Practice.svelte';
  import TaskBar from './components/TaskBar.svelte';
  import DemoBar from './components/DemoBar.svelte';
  import Glossary from './components/Glossary.svelte';
  import { PARTS } from './content/parts.js';
  import { EXERCISES, tasksOf, loadProgress, saveProgress, newCtx } from './content/exercises.js';
  import { e6b, applyState, resetState } from './lib/e6b.svelte.js';

  const lang = detectLang();
  const t = UI[lang];
  const meta = seo.e6b[lang];

  // ---- <head>: the static index.html is Spanish; localize-heads.mjs writes the English build, this keeps dev/runtime in sync.
  const setMeta = (selector, value) => document.querySelector(selector)?.setAttribute('content', value);
  document.title = meta.title;
  document.documentElement.lang = meta.lang;
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', meta.url);
  setMeta('meta[name="description"]', meta.description);
  setMeta('meta[property="og:locale"]', meta.ogLocale);
  setMeta('meta[property="og:title"]', meta.title);
  setMeta('meta[property="og:description"]', meta.ogDescription);
  setMeta('meta[property="og:url"]', meta.url);
  setMeta('meta[name="twitter:title"]', meta.title);
  setMeta('meta[name="twitter:description"]', meta.ogDescription);
  setMeta('meta[property="og:image:alt"]', meta.imageAlt);

  // ---- UI state
  let explain = $state(false);
  let part = $state(/** @type {string|null} */ (null));
  let tab = $state(/** @type {'guide'|'ex'|'practice'} */ ('guide'));
  let sheetOpen = $state(false);
  // Desktop only: the panel folded into a rail.
  const COLLAPSED_KEY = 'qubits.e6b.panelCollapsed';
  let collapsed = $state(readCollapsed());
  let glossaryOpen = $state(false);
  let toastMsg = $state('');
  let toastShow = $state(false);
  let toastTimer;

  function toast(msg) {
    toastMsg = msg;
    toastShow = true;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastShow = false), 1800);
  }

  function readCollapsed() {
    try { return localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { return false; }
  }

  function setCollapsed(value) {
    collapsed = value;
    try { localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0'); } catch { /* storage unavailable: state lives for this load */ }
  }

  const isDesktop = () => window.matchMedia('(max-width: 980px)').matches === false;
  const TAB_IDS = { guide: 'tabGuide', ex: 'tabEx', practice: 'tabPractice' };

  function openPanel(which) { tab = which; sheetOpen = true; setCollapsed(false); }

  /** Rail button: expand on a tab and move focus into the panel. */
  function expandPanel(which) {
    openPanel(which);
    tick().then(() => document.getElementById(TAB_IDS[which])?.focus());
  }

  /** » button: fold the panel and keep focus on the rail. */
  function collapsePanel() {
    setCollapsed(true);
    tick().then(() => document.querySelector('.rail [data-tab]')?.focus());
  }

  function toggleExplain() {
    explain = !explain;
    if (!explain) part = null;
    toast(explain ? t.explainOn : t.explainOff);
  }

  // ---- Show me (shared by exercises and practice)
  let demo = $state(/** @type {{ id: number, steps: object[], setup: object }|null} */ (null));
  let demoSeq = 0;

  function showMe(steps, setup) {
    if (!steps?.length) return;
    demo = { id: ++demoSeq, steps, setup: setup ?? {} };
    sheetOpen = false;
  }

  // ---- practice (the problem itself lives in Practice.svelte; here only its prompt for the task strip)
  let practicePrompt = $state('');

  function onproblem(p) {
    // A new practice problem takes over the instrument: leave any exercise and close the demo.
    status = 'free';
    taskId = null;
    level = null;
    demo = null;
    practicePrompt = p.prompt[lang];
  }

  // ---- exercises
  let done = $state(loadProgress());
  let level = $state(/** @type {number|null} */ (null));
  let taskId = $state(/** @type {string|null} */ (null));
  let status = $state(/** @type {'free'|'active'|'done'|'levelDone'} */ ('free'));
  let hintOpen = $state(false);
  let whyOpen = $state(false);
  let picked = $state(/** @type {number[]} */ ([]));
  let wrong = $state(false);

  const task = $derived(taskId ? EXERCISES.find((e) => e.id === taskId) ?? null : null);
  const levelTasks = $derived(level == null ? [] : tasksOf(level));
  const index = $derived(task ? levelTasks.findIndex((e) => e.id === task.id) : 0);

  let ctx = newCtx();

  function startTask(ex) {
    taskId = ex.id;
    status = 'active';
    hintOpen = false;
    whyOpen = false;
    picked = [];
    wrong = false;
    ctx = newCtx();
    part = null;
    demo = null;
    practicePrompt = '';
    if (ex.explain) explain = true;
    resetState();
    applyState(ex.setup ?? {});
  }

  function startLevel(l) {
    level = l;
    const next = tasksOf(l).find((e) => !done[e.id]);
    if (!next) return;
    startTask(next);
    sheetOpen = false;
  }

  function restartLevel(l) {
    const rest = { ...done };
    for (const e of tasksOf(l)) delete rest[e.id];
    done = rest;
    saveProgress(done);
    startLevel(l);
  }

  function resetProgress() {
    done = {};
    saveProgress(done);
    level = null;
    taskId = null;
    status = 'free';
    demo = null;
  }

  function complete() {
    if (!task || status !== 'active') return;
    done = { ...done, [task.id]: true };
    saveProgress(done);
    status = 'done';
    toast(`✓ ${t.taskDone}`);
  }

  function next() {
    const rest = levelTasks.slice(index + 1).find((e) => !done[e.id]) ?? levelTasks.find((e) => !done[e.id]);
    if (rest) startTask(rest);
    else { status = 'levelDone'; taskId = null; demo = null; }
  }

  function skip() {
    const after = levelTasks.slice(index + 1).find((e) => !done[e.id]);
    if (after) startTask(after);
    else {
      const before = levelTasks.find((e) => !done[e.id] && e.id !== task?.id);
      if (before) startTask(before);
    }
  }

  function answer(i) {
    if (!task?.quiz || status !== 'active') return;
    if (i === task.quiz.answer) complete();
    else { picked = [...picked, i]; wrong = true; }
  }

  /** Live check of the current exercise against the instrument (not while a Show me demo is running). */
  function evaluate() {
    if (!task || status !== 'active' || !task.check || demo) return;
    if (task.check(e6b, ctx)) complete();
  }

  // Re-check whenever the instrument settles: reads every state key a check can depend on, skips while dragging.
  $effect(() => {
    void [e6b.rot, e6b.cursor, e6b.dir, e6b.slide, e6b.face, JSON.stringify(e6b.dots), demo];
    if (!e6b.dragging) evaluate();
  });

  function onpart(id) {
    if (!PARTS[id]) return;
    part = id;
    ctx.lastPart = id;
    if (isDesktop()) { tab = 'guide'; if (collapsed) setCollapsed(false); }
    evaluate();
  }

  const highlight = $derived(explain && part ? part : hintOpen && status === 'active' && task?.part ? task.part : null);

  // ---- feedback (shared with the other trainers, same Web3Forms key; lazy chunk, only when a key is set)
  const feedbackKey = import.meta.env.VITE_WEB3FORMS_FEEDBACK_KEY;

  onMount(() => {
    const onKey = (e) => { if (e.key === 'Escape' && sheetOpen && !glossaryOpen) sheetOpen = false; };
    document.addEventListener('keydown', onKey);

    if (feedbackKey) {
      tick()
        .then(() => import('../shared/feedback/feedback-panel.js'))
        .then((m) => m.mountFeedback({ key: feedbackKey }))
        .catch(() => {});
    }
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(toastTimer); };
  });
</script>

<Glossary {lang} bind:open={glossaryOpen} />

<header class="top">
  <div class="brand">
    <span class="plate">{t.plate}</span>
    <div>
      <h1>{t.title}</h1>
      <p>{t.subtitle}</p>
    </div>
  </div>
  <div class="top-actions">
    <button class="btn" type="button" aria-pressed={explain} title={t.explainTitle} onclick={toggleExplain}>{t.explain}</button>
    <button class="btn mobile-only" type="button" onclick={() => openPanel('guide')}>{t.guide}</button>
    <button class="btn mobile-only" type="button" onclick={() => openPanel('ex')}>{t.exercises}</button>
    <button class="btn mobile-only" type="button" onclick={() => openPanel('practice')}>{t.practice}</button>
    <button class="btn" type="button" aria-haspopup="dialog" onclick={() => (glossaryOpen = true)}>{t.glossary}</button>
    {#if feedbackKey}<button class="btn" type="button" id="feedbackBtn" hidden>{t.feedback}</button>{/if}
    <a class="btn" href={t.pfdHref}>{t.pfdLink}</a>
    <a class="btn" href={t.langHref} lang={lang === 'es' ? 'en' : 'es'} aria-label={t.langLabel}>{t.langText}</a>
    <a class="btn ghost" href={t.backHref}>{t.back}</a>
  </div>
</header>

<main class="layout" class:collapsed>
  <section class="sim" aria-label={t.simLabel}>
    <TaskBar {lang} {status} {level} {index} count={levelTasks.length} {task} {hintOpen} {whyOpen}
      {picked} {wrong} {explain} {practicePrompt}
      onhint={() => (hintOpen = !hintOpen)} onwhy={() => (whyOpen = !whyOpen)}
      onopen={(which = 'ex') => openPanel(which)} onnext={next} onskip={skip} onanswer={answer}
      onsolved={complete} onshowme={() => task && showMe(task.demo, task.setup)} />

    {#key demo?.id}
      {#if demo}<DemoBar {lang} steps={demo.steps} setup={demo.setup} onclose={() => (demo = null)} />{/if}
    {/key}

    <E6b s={e6b} {explain} {highlight} {onpart} {lang} />

    {#if explain}<div class="mobile-explain"><ExplainCard {lang} {part} {explain} onclear={() => (part = null)} /></div>{/if}
    <p class="kbd-note">{t.kbdNote}</p>
    <p class="kbd-note"><a class="pfd-link" href={t.pfdHref}>{t.pfdFooter}</a></p>
  </section>

  <Panel {lang} bind:tab open={sheetOpen} {part} {explain} onclearpart={() => (part = null)} onclose={() => (sheetOpen = false)}
    oncollapse={collapsePanel}>
    {#snippet exercises()}
      <Exercises {lang} {done} activeLevel={level} {taskId} onstart={startLevel} onrestart={restartLevel} onreset={resetProgress} />
    {/snippet}
    {#snippet practice()}
      <Practice {lang} active={tab === 'practice'} onshowme={showMe} {onproblem} />
    {/snippet}
  </Panel>
  {#if collapsed}<PanelRail {lang} onexpand={expandPanel} />{/if}
</main>

<footer class="foot"><p>{t.disclaimer}</p></footer>

<div class="toast" class:show={toastShow} role="status">{toastMsg}</div>
