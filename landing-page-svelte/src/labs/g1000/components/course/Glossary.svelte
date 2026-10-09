<script>
  // Glossary dialog (searchable, alphabetical) + the floating tooltip shared by every .term button in the page
  // (hover/focus on desktop, tap on touch), same behaviour as the MCDU trainer.
  import { onMount, tick } from 'svelte';
  import { GLOSSARY, TERM_BY_ID } from '../../content/glossary.js';
  import { UI, tr, fold } from '../../i18n.js';

  /** @type {{ lang: 'es'|'en', open?: boolean }} */
  let { lang, open = $bindable(false) } = $props();

  const t = $derived(UI[lang]);
  let query = $state('');
  /** @type {HTMLDialogElement} */
  let dialog;
  /** @type {HTMLInputElement} */
  let search;

  const items = $derived(
    GLOSSARY.map((g) => {
      const name = tr(g.n, lang);
      const [head, ...rest] = name.split(' — ');
      return {
        id: g.id,
        head: rest.length ? head : name,
        sub: rest.join(' — '),
        def: tr(g.d, lang),
        key: fold([...g.a, g.n.es, g.n.en, g.d[lang]].join(' ')),
        sort: fold(head)
      };
    }).sort((a, b) => a.sort.localeCompare(b.sort))
  );
  const shown = $derived(items.filter((i) => !query.trim() || i.key.includes(fold(query.trim()))));

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      hideTip();
      dialog.showModal();
      search?.focus();
    } else if (!open && dialog.open) dialog.close();
  });

  // ---- tooltip ----
  /** @type {HTMLDivElement} */
  let tip;
  let tipFor = null;
  let tipAt = 0;
  let tipTerm = $state(null);

  async function showTip(btn) {
    const g = TERM_BY_ID.get(btn.dataset.term);
    if (!g || !tip) return;
    if (tipFor && tipFor !== btn) tipFor.removeAttribute('aria-describedby');
    tipFor = btn;
    tipAt = Date.now();
    btn.setAttribute('aria-describedby', 'glossTip');
    tipTerm = g;
    tip.hidden = false;
    await tick();
    if (tipFor !== btn) return;
    const r = btn.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight, vw = document.documentElement.clientWidth;
    tip.style.left = Math.max(16, Math.min(r.left + r.width / 2 - w / 2, vw - 16 - w)) + 'px';
    tip.style.top = (r.bottom + 8 + h > innerHeight && r.top - 8 - h > 0 ? r.top - 8 - h : r.bottom + 8) + 'px';
  }
  function hideTip() {
    if (tipFor) tipFor.removeAttribute('aria-describedby');
    tipFor = null;
    if (tip) tip.hidden = true;
  }

  onMount(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const on = (type, fn, opts) => { document.addEventListener(type, fn, opts); return () => document.removeEventListener(type, fn, opts); };
    const offs = [
      on('mouseover', (e) => { if (!fine.matches) return; const b = e.target.closest?.('.term'); if (b) showTip(b); }),
      on('mouseout', (e) => { if (!fine.matches) return; const b = e.target.closest?.('.term'); if (b && b === tipFor && document.activeElement !== b) hideTip(); }),
      on('focusin', (e) => { const b = e.target.closest?.('.term'); if (b) showTip(b); }),
      on('focusout', (e) => { if (e.target === tipFor) hideTip(); }),
      on('click', (e) => {
        const b = e.target.closest?.('.term');
        if (b) { if (b === tipFor && !fine.matches && Date.now() - tipAt > 400) hideTip(); else showTip(b); return; }
        if (tipFor) hideTip();
      }),
      on('keydown', (e) => { if (e.key === 'Escape' && tipFor) hideTip(); }),
      on('scroll', () => { if (tipFor) hideTip(); }, true)
    ];
    const onResize = () => { if (tipFor) hideTip(); };
    addEventListener('resize', onResize);
    return () => { offs.forEach((f) => f()); removeEventListener('resize', onResize); };
  });
</script>

<dialog class="fb-dialog gl-dialog" bind:this={dialog} aria-labelledby="glTitle"
  onclose={() => (open = false)}
  onclick={(e) => { if (e.target === dialog) open = false; }}>
  <div class="gl-body">
    <div class="gl-top">
      <div class="fb-head">
        <h2 id="glTitle">{t.glossary}</h2>
        <button type="button" class="fb-close" aria-label={t.close} onclick={() => (open = false)}>×</button>
      </div>
      <label class="sr-only" for="glSearch">{t.glSearch}</label>
      <input class="gl-search" id="glSearch" type="search" autocomplete="off" spellcheck="false"
        placeholder={t.glSearch} bind:value={query} bind:this={search} aria-controls="glList" />
      <p class="gl-count" aria-live="polite">{t.terms(shown.length, items.length)}</p>
    </div>
    <dl class="gl-list" id="glList">
      {#each shown as it (it.id)}
        <div class="gl-item">
          <dt>{it.head}{#if it.sub} <span>{it.sub}</span>{/if}</dt>
          <dd>{it.def}</dd>
        </div>
      {/each}
    </dl>
    {#if !shown.length}<p class="gl-empty">{t.glEmpty}</p>{/if}
  </div>
</dialog>

<div class="gloss-tip" id="glossTip" role="tooltip" bind:this={tip} hidden>
  {#if tipTerm}<b>{tr(tipTerm.n, lang)}</b><span>{tr(tipTerm.d, lang)}</span>{/if}
</div>
