<script>
  // PFD trainer page shell: header, PFD + FCU + controls on the left, Guía / Ejercicios panel on the right
  // (bottom sheet ≤ 980px), explain mode, exercise runner, glossary, feedback and head metadata.
  import { onMount, tick } from 'svelte';
  import { seo } from '../../seo.js';
  import { detectLang, UI } from './i18n.js';
  import Pfd from './components/pfd/Pfd.svelte';
  import Fcu from './components/Fcu.svelte';
  import Controls from './components/Controls.svelte';
  import Panel from './components/Panel.svelte';
  import ExplainCard from './components/ExplainCard.svelte';
  import Exercises from './components/Exercises.svelte';
  import TaskBar from './components/TaskBar.svelte';
  import Glossary from './components/Glossary.svelte';
  import { PARTS } from './content/parts.js';
  import { EXERCISES, tasksOf, loadProgress, saveProgress, newCtx, createRunner } from './content/exercises.js';
  import { flight, start, stop, loadScenario, onTick } from './lib/flight.svelte.js';

  const lang = detectLang();
  const t = UI[lang];
  const meta = seo.pfd[lang];

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
  let tab = $state(/** @type {'guide'|'ex'} */ ('guide'));
  let sheetOpen = $state(false);
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

  function openPanel(which) { tab = which; sheetOpen = true; }

  function toggleExplain() {
    explain = !explain;
    if (!explain) part = null;
    toast(explain ? t.explainOn : t.explainOff);
  }

  // ---- exercises
  let done = $state(loadProgress());
  let level = $state(/** @type {number|null} */ (null));
  let taskId = $state(/** @type {string|null} */ (null));
  let status = $state(/** @type {'free'|'active'|'done'|'levelDone'} */ ('free'));
  let hintOpen = $state(false);
  let whyOpen = $state(false);
  let held = $state(0);
  let picked = $state(/** @type {number[]} */ ([]));
  let wrong = $state(false);

  const task = $derived(taskId ? EXERCISES.find((e) => e.id === taskId) ?? null : null);
  const levelTasks = $derived(level == null ? [] : tasksOf(level));
  const index = $derived(task ? levelTasks.findIndex((e) => e.id === task.id) : 0);

  let ctx = newCtx();
  const runner = createRunner();

  function startTask(ex) {
    taskId = ex.id;
    status = 'active';
    hintOpen = false;
    whyOpen = false;
    held = 0;
    picked = [];
    wrong = false;
    ctx = newCtx();
    runner.reset();
    part = null;
    if (ex.explain) explain = true;
    loadScenario(ex.scenario);
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
    else { status = 'levelDone'; taskId = null; }
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

  function evaluate(dt) {
    if (!task || status !== 'active' || !task.check) return;
    const r = runner.tick(task, flight, dt, ctx);
    const h = Math.round(r.held * 10) / 10;
    if (h !== held) held = h;
    if (r.done) complete();
  }

  function onpart(id) {
    if (!PARTS[id]) return;
    part = id;
    ctx.lastPart = id;
    if (window.matchMedia('(max-width: 980px)').matches === false) tab = 'guide';
    evaluate(0);
  }

  const highlight = $derived(explain && part ? part : hintOpen && status === 'active' && task?.part ? task.part : null);

  // ---- feedback (shared module of the MCDU trainer, same Web3Forms key)
  const feedbackKey = import.meta.env.VITE_WEB3FORMS_FEEDBACK_KEY;

  onMount(() => {
    start();
    const off = onTick((_s, dt) => {
      evaluate(dt);
    });
    const onKey = (e) => { if (e.key === 'Escape' && sheetOpen && !glossaryOpen) sheetOpen = false; };
    document.addEventListener('keydown', onKey);

    if (feedbackKey) {
      document.querySelector('meta[name="feedback-key"]')?.setAttribute('content', feedbackKey);
      // Path in a variable: it is a public/ file, so Vite must not try to analyse (dev) or bundle (build) the import.
      const panelUrl = '/labs/mcdu-trainer/feedback-panel.js';
      tick().then(() => import(/* @vite-ignore */ panelUrl)).catch(() => {});
    }
    return () => { off?.(); stop?.(); document.removeEventListener('keydown', onKey); clearTimeout(toastTimer); };
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
    <button class="btn" type="button" aria-haspopup="dialog" onclick={() => (glossaryOpen = true)}>{t.glossary}</button>
    {#if feedbackKey}<button class="btn" type="button" id="feedbackBtn" hidden>{t.feedback}</button>{/if}
    <a class="btn" href={t.mcduHref}>{t.mcduLink}</a>
    <a class="btn" href={t.langHref} lang={lang === 'es' ? 'en' : 'es'} aria-label={t.langLabel}>{t.langText}</a>
    <a class="btn ghost" href={t.backHref}>{t.back}</a>
  </div>
</header>

<main class="layout">
  <section class="sim" aria-label={t.simLabel}>
    <TaskBar {lang} {status} {level} {index} count={levelTasks.length} {task} {hintOpen} {whyOpen} {held}
      need={task?.hold ?? 0} {picked} {wrong} {explain}
      onhint={() => (hintOpen = !hintOpen)} onwhy={() => (whyOpen = !whyOpen)}
      onopen={() => openPanel('ex')} onnext={next} onskip={skip} onanswer={answer} />

    <Pfd s={flight} {explain} {highlight} {onpart} label={t.pfdLabel} />
    <Fcu {lang} />
    <Controls {lang} />

    {#if explain}<div class="mobile-explain"><ExplainCard {lang} {part} {explain} onclear={() => (part = null)} /></div>{/if}
    <p class="kbd-note">{t.kbdNote}</p>
    <p class="kbd-note"><a class="mcdu-link" href={t.mcduHref}>{t.mcduFooter}</a></p>
  </section>

  <Panel {lang} bind:tab open={sheetOpen} {part} {explain} onclearpart={() => (part = null)} onclose={() => (sheetOpen = false)}>
    {#snippet exercises()}
      <Exercises {lang} {done} activeLevel={level} {taskId} onstart={startLevel} onrestart={restartLevel} onreset={resetProgress} />
    {/snippet}
  </Panel>
</main>

<footer class="foot"><p>{t.disclaimer}</p></footer>

<div class="toast" class:show={toastShow} role="status">{toastMsg}</div>
