<script>
  // G1000 course page shell: header, stage (2D G1000 or 3D scene) with the step strip on the left, Lección /
  // Lecciones / Explicar panel on the right (rail when collapsed, bottom sheet ≤ 980px), course runner (steps,
  // live task checks, quizzes, Show me), free Simulator mode, explain mode, glossary, toast, feedback, head metadata.
  import { onMount, tick } from 'svelte';
  import { seo } from '../../seo.js';
  import { detectLang, UI, tr } from './i18n.js';
  import Stage from './components/Stage.svelte';
  import StepBar from './components/course/StepBar.svelte';
  import DemoBar from './components/course/DemoBar.svelte';
  import Panel from './components/course/Panel.svelte';
  import PanelRail from './components/course/PanelRail.svelte';
  import LessonView from './components/course/LessonView.svelte';
  import LessonList from './components/course/LessonList.svelte';
  import Glossary from './components/course/Glossary.svelte';
  import { LESSONS } from './content/lessons.js';
  import { PARTS } from './content/parts.js';
  import { SCENARIOS } from './lib/state.js';
  import { g, ui, send, reset, onMessage, startLoop, stopLoop } from './lib/g1000.svelte.js';
  import { loadProgress, saveProgress, loadPos, savePos } from './lib/course.js';

  const lang = detectLang();
  const t = UI[lang];
  const meta = seo.g1000[lang];

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

  // ---- shell state
  let mode = $state(/** @type {'course'|'sim'} */ ('course'));
  let sim3d = $state(false);
  let scenario = $state(/** @type {import('./lib/state.js').ScenarioId} */ ('enroute'));
  let explain = $state(false);
  let part = $state(/** @type {string|null} */ (null));
  let tab = $state(/** @type {'lesson'|'lessons'|'explain'} */ ('lesson'));
  let sheetOpen = $state(false);
  const COLLAPSED_KEY = 'qubits.g1000.panelCollapsed';
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
    try { localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0'); } catch { /* storage unavailable */ }
  }
  const isDesktop = () => window.matchMedia('(max-width: 980px)').matches === false;
  const TAB_IDS = { lesson: 'tabLesson', lessons: 'tabLessons', explain: 'tabExplain' };
  function openPanel(which) { tab = which; sheetOpen = true; setCollapsed(false); }
  function expandPanel(which) { openPanel(which); tick().then(() => document.getElementById(TAB_IDS[which])?.focus()); }
  function collapsePanel() { setCollapsed(true); tick().then(() => document.querySelector('.rail [data-tab]')?.focus()); }
  function toggleExplain() {
    explain = !explain;
    if (!explain) part = null;
    toast(explain ? t.explainOn : t.explainOff);
  }

  // ---- course runner
  const start = loadPos();
  let lessonIdx = $state(start.lesson);
  let stepIdx = $state(start.step);
  let done = $state(loadProgress());
  let cueIndex = $state(0);
  let picked = $state(/** @type {number[]} */ ([]));
  let demoTask = $state(/** @type {any} */ (null));
  let ctx = { lastPart: /** @type {string|null} */ (null) };

  const lesson = $derived(LESSONS[lessonIdx]);
  const step = $derived(lesson.steps[stepIdx]);
  const stepDone = $derived(!!(step.id && done[step.id]));

  function enterStep() {
    cueIndex = 0;
    picked = [];
    ctx = { lastPart: null };
    demoTask = null;
    part = null;
    const st = LESSONS[lessonIdx].steps[stepIdx];
    if (st.kind === 'task') reset(st.setup.scenario, st.setup.apply);
    savePos({ lesson: lessonIdx, step: stepIdx });
  }
  function goStep(i) { stepIdx = i; enterStep(); sheetOpen = false; }
  function openLesson(i) { mode = 'course'; lessonIdx = i; stepIdx = 0; enterStep(); tab = 'lesson'; sheetOpen = false; }
  function next() {
    if (stepIdx < lesson.steps.length - 1) return goStep(stepIdx + 1);
    toast(t.lessonDone(lesson.n));
    if (lessonIdx < LESSONS.length - 1) openLesson(lessonIdx + 1);
  }
  function prev() { if (stepIdx > 0) goStep(stepIdx - 1); }
  function complete(id) {
    if (done[id]) return;
    done = { ...done, [id]: true };
    saveProgress(done);
    toast(`✓ ${t.taskDone}`);
  }
  function resetProgress() { done = {}; saveProgress(done); }
  function answer(i) {
    if (step.kind !== 'quiz') return;
    if (i === step.answer) complete(step.id);
    else picked = [...picked, i];
  }

  /** Live check of the current task (not while Show me runs). */
  function evaluate() {
    if (mode !== 'course' || step.kind !== 'task' || demoTask || done[step.id]) return;
    if (step.check(g, ctx)) complete(step.id);
  }

  function onpart(id) {
    if (!PARTS[id]) return;
    ctx.lastPart = id;
    if (explain) {
      part = id;
      if (isDesktop()) { tab = 'explain'; if (collapsed) setCollapsed(false); }
    }
    evaluate();
  }

  function closeDemo() {
    demoTask = null;
    if (step.kind === 'task' && !done[step.id]) { reset(step.setup.scenario, step.setup.apply); ctx = { lastPart: null }; }
  }

  // Scene steps: advance the camera cue every 3.2 s until the last shot.
  $effect(() => {
    if (mode !== 'course' || step.kind !== 'scene' || cueIndex >= step.cues.length - 1) return;
    const id = setTimeout(() => (cueIndex += 1), 3200);
    return () => clearTimeout(id);
  });

  const view = $derived(mode === 'sim' ? (sim3d ? 'cockpit' : 'g1000')
    : step.kind === 'scene' ? step.scene : step.kind === 'task' && step.view === 'explode' ? 'explode' : 'g1000');
  const cue = $derived(mode === 'sim' ? 'panel' : step.kind === 'scene' ? step.cues[Math.min(cueIndex, step.cues.length - 1)].focus : 'all');
  const cueLabel = $derived(mode === 'course' && step.kind === 'scene' ? step.cues[Math.min(cueIndex, step.cues.length - 1)].label ?? null : null);
  const highlight = $derived(explain && part ? part : mode === 'course' && (step.kind === 'explain' || step.kind === 'task') ? step.part ?? null : null);

  function setMode(m) {
    mode = m;
    sim3d = false;
    if (m === 'sim') reset(scenario);
    else enterStep();
  }
  function pickScenario(id) { scenario = id; reset(id); }

  // ---- keyboard: identifiers, Enter = ENT, Esc/Backspace = CLR on the G1000 being used
  function onKey(e) {
    if (e.key === 'Escape' && sheetOpen && !glossaryOpen) { sheetOpen = false; return; }
    const el = /** @type {HTMLElement} */ (e.target);
    if (view !== 'g1000' || glossaryOpen || e.metaKey || e.ctrlKey || e.altKey) return;
    const inGdu = !!el.closest('.g1000 svg');
    if (!inGdu && el.closest('input, textarea, select, button, [role="button"], [role="tab"], a')) return;
    const gdu = g.edit?.gdu ?? g.dtoWin?.gdu ?? g.menu?.gdu ?? ui.gdu;
    if (/^[a-z0-9]$/i.test(e.key)) { send({ type: 'char', gdu, c: e.key }); e.preventDefault(); }
    else if (e.key === 'Enter' && !inGdu) { send({ type: 'key', gdu, id: 'ent' }); e.preventDefault(); }
    else if (e.key === 'Escape' || e.key === 'Backspace') { send({ type: 'key', gdu, id: 'clr' }); e.preventDefault(); }
  }

  // Mouse/touch clicks must not focus GDU controls (their own Enter handler would fire on the next Enter).
  function onMouseDown(e) {
    if (!e.target.closest?.('.g1000 svg')) return;
    const a = /** @type {HTMLElement|null} */ (document.activeElement);
    if (a && a !== document.body && !a.closest?.('.g1000 svg')) a.blur();
    if (e.target.closest('.g1000 svg [tabindex]')) e.preventDefault();
  }

  // ---- feedback (shared with the other trainers, same Web3Forms key; lazy chunk, only when a key is set)
  const feedbackKey = import.meta.env.VITE_WEB3FORMS_FEEDBACK_KEY;

  onMount(() => {
    onMessage((m) => toast(t.msgs[m] ?? m));
    enterStep();
    startLoop();
    const timer = setInterval(evaluate, 250);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown, true);
    if (feedbackKey) {
      tick()
        .then(() => import('../shared/feedback/feedback-panel.js'))
        .then((m) => m.mountFeedback({ key: feedbackKey }))
        .catch(() => {});
    }
    return () => { stopLoop(); clearInterval(timer); document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onMouseDown, true); clearTimeout(toastTimer); };
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
    <button class="btn" type="button" aria-pressed={mode === 'course'} onclick={() => setMode('course')}>{t.course}</button>
    <button class="btn" type="button" aria-pressed={mode === 'sim'} onclick={() => setMode('sim')}>{t.sim}</button>
    {#if mode === 'sim'}<button class="btn" type="button" aria-pressed={sim3d} onclick={() => (sim3d = !sim3d)}>{t.view3d}</button>{/if}
    <button class="btn" type="button" aria-pressed={explain} title={t.explainTitle} onclick={toggleExplain}>{t.explain}</button>
    <button class="btn mobile-only" type="button" onclick={() => openPanel('lesson')}>{t.tabLesson}</button>
    <button class="btn" type="button" aria-haspopup="dialog" onclick={() => (glossaryOpen = true)}>{t.glossary}</button>
    {#if feedbackKey}<button class="btn" type="button" id="feedbackBtn" hidden>{t.feedback}</button>{/if}
    <a class="btn" href={t.langHref} lang={lang === 'es' ? 'en' : 'es'} aria-label={t.langLabel}>{t.langText}</a>
    <a class="btn ghost" href={t.backHref}>{t.back}</a>
  </div>
</header>

<main class="layout g1000-layout" class:collapsed>
  <section class="sim" aria-label={t.stageLabel}>
    {#if mode === 'course'}
      <StepBar {lang} {lesson} index={stepIdx} done={stepDone} {cueIndex} {picked} demoOpen={!!demoTask}
        onprev={prev} onnext={next} oncue={(i) => (cueIndex = i)} onanswer={answer}
        onshowme={() => { if (step.kind === 'task') { ctx = { lastPart: null }; demoTask = step; } }} />
      {#key demoTask}
        {#if demoTask}<DemoBar {lang} task={demoTask} {onpart} onclose={closeDemo} />{/if}
      {/key}
    {:else}
      <div class="taskbar free">
        <div class="tb-head"><span class="lvl">{t.sim} · {t.scenario}</span></div>
        <div class="chips">
          {#each SCENARIOS as id}
            <button type="button" class="chip" aria-pressed={scenario === id} onclick={() => pickScenario(id)}>{t.scenarios[id]}</button>
          {/each}
        </div>
      </div>
    {/if}

    <Stage {lang} {view} {cue} {cueLabel} {explain} {highlight} {onpart} />
    <p class="kbd-note">{t.kbdNote}</p>
  </section>

  <Panel {lang} bind:tab open={sheetOpen} {part} {explain} onclearpart={() => (part = null)} onclose={() => (sheetOpen = false)}
    oncollapse={collapsePanel}>
    {#snippet lesson()}
      <LessonView {lang} lesson={LESSONS[lessonIdx]} index={stepIdx} {done} ongo={(i) => { mode = 'course'; goStep(i); }} />
    {/snippet}
    {#snippet lessons()}
      <LessonList {lang} {done} current={lessonIdx} onopen={openLesson} onreset={resetProgress} />
    {/snippet}
  </Panel>
  {#if collapsed}<PanelRail {lang} onexpand={expandPanel} />{/if}
</main>

<footer class="foot"><p>{t.disclaimer}</p></footer>

<div class="toast" class:show={toastShow} role="status">{toastMsg}</div>
