<script>
  // Practice tab: endless random exam-style problems (lib/practice.js), typed answers with reading tolerance,
  // Show me, reveal-solution and a streak counter kept in localStorage.
  import { untrack } from 'svelte';
  import { KINDS, generate } from '../lib/practice.js';
  import { fmtHm } from '../lib/scales.js';
  import { applyState, resetState } from '../lib/e6b.svelte.js';
  import AnswerFields from './AnswerFields.svelte';
  import { UI, tr } from '../i18n.js';

  /**
   * @type {{ lang: 'es'|'en', active: boolean, onshowme: (steps: object[], setup: object) => void,
   *   onproblem: (p: ReturnType<typeof generate>) => void }}
   */
  let { lang, active, onshowme, onproblem } = $props();

  const t = $derived(UI[lang]);
  const STORE_KEY = 'qubits.e6b.practice.v1';

  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      const n = (x) => (Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
      return { streak: n(v.streak), best: n(v.best) };
    } catch { return { streak: 0, best: 0 }; }
  }
  const saved = load();

  let kind = $state(KINDS[0]);
  let problem = $state(/** @type {ReturnType<typeof generate>|null} */ (null));
  let streak = $state(saved.streak);
  let best = $state(saved.best);
  let failed = $state(false);
  let revealed = $state(false);
  let solved = $state(false);

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ streak, best })); } catch { /* storage unavailable */ }
  }

  function randomSeed() {
    try { return crypto.getRandomValues(new Uint32Array(1))[0]; } catch { return Math.floor(Math.random() * 4294967296); }
  }

  function newProblem() {
    problem = generate(kind, randomSeed());
    failed = false;
    revealed = false;
    solved = false;
    resetState();
    applyState(problem.setup);
    onproblem(problem);
  }

  function pickKind(k) { kind = k; newProblem(); }

  /** A wrong check or a revealed solution breaks the streak (once per problem). */
  function breakStreak() {
    if (failed) return;
    failed = true;
    if (streak) { streak = 0; save(); }
  }

  function onresult(all) {
    if (!all) { breakStreak(); return; }
    solved = true;
    if (!failed && !revealed) {
      streak += 1;
      best = Math.max(best, streak);
      save();
    }
  }

  function reveal() {
    if (!revealed && !solved) breakStreak();
    revealed = !revealed;
  }

  const dec = (x) => (lang === 'es' ? String(x).replace('.', ',') : String(x));
  /** Solution value with its unit. */
  function fmt(f) {
    const v = f.value;
    if (f.unit === 'min') return `${fmtHm(v)} (${dec(Math.round(v))} min)`;
    if (f.unit === '°' && f.key === 'th') return `${String(Math.round(((v % 360) + 360) % 360) || 360).padStart(3, '0')}°`;
    if (f.unit === '°') return `${dec(Number(v.toFixed(1)))}°`;
    const n = Math.abs(v) >= 100 ? Math.round(v) : Number(v.toFixed(1));
    return `${dec(n)} ${f.unit}`;
  }

  // First visit to the tab: make the first problem.
  $effect(() => {
    if (active && !problem) untrack(newProblem);
  });
</script>

<section>
  <h2>{t.practice}</h2>
  <p class="note" style="margin-bottom:10px">{t.practiceIntro}</p>
  <div class="chips" role="group" aria-label={t.practiceKinds}>
    {#each KINDS as k}
      <button type="button" class="chip" aria-pressed={kind === k} onclick={() => pickKind(k)}>{t.kinds[k]}</button>
    {/each}
  </div>
</section>

<section class="pcard">
  <div class="pstats" aria-live="polite">
    <span>{t.streak}: <b>{streak}</b></span><span>{t.best}: <b>{best}</b></span>
  </div>
  {#if problem}
    <p class="pprompt">{tr(problem.prompt, lang)}</p>
    {#key `${problem.kind}-${problem.seed}`}
      <AnswerFields {lang} fields={problem.fields} idPrefix="pr" {onresult} />
    {/key}
    <div class="aactions">
      <button type="button" class="btn" onclick={() => onshowme(problem.demo, problem.setup)}>{t.showMe}</button>
      <button type="button" class="btn" aria-expanded={revealed} onclick={reveal}>{revealed ? t.hideSolution : t.revealBtn}</button>
      <button type="button" class="btn" class:primary={solved} onclick={newProblem}>{t.newProblem}</button>
    </div>
    {#if revealed}
      <dl class="solution" aria-label={t.solution}>
        {#each problem.fields as f (f.key)}
          <dt>{tr(f.label, lang)}</dt><dd>{fmt(f)}</dd>
        {/each}
      </dl>
    {/if}
  {/if}
</section>

<p class="note">{t.practiceNote}</p>
