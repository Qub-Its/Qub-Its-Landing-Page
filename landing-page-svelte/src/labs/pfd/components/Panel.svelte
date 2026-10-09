<script>
  // Right-hand panel (bottom sheet at ≤ 980px): Guía tab (explain card, colour legend, reading concepts)
  // and Ejercicios tab (rendered by the `exercises` snippet from App).
  import ExplainCard from './ExplainCard.svelte';
  import { LEGEND, GUIDE } from '../content/guide.js';
  import { glossHtml } from '../content/glossary.js';
  import { UI } from '../i18n.js';

  /**
   * @type {{ lang: 'es'|'en', tab: 'guide'|'ex', open: boolean, part: string|null, explain: boolean,
   *   onclearpart: () => void, onclose: () => void, exercises: import('svelte').Snippet }}
   */
  let { lang, tab = $bindable(), open, part, explain, onclearpart, onclose, exercises } = $props();

  const t = $derived(UI[lang]);
  const sections = $derived(GUIDE[lang]);
</script>

<aside class="panel" class:open id="panel" aria-label={t.panelLabel}>
  <div class="tabs" role="tablist">
    <button class="tab" role="tab" id="tabGuide" aria-selected={tab === 'guide'} aria-controls="guideBody" onclick={() => (tab = 'guide')}>{t.guide}</button>
    <button class="tab" role="tab" id="tabEx" aria-selected={tab === 'ex'} aria-controls="exBody" onclick={() => (tab = 'ex')}>{t.exercises}</button>
    <button class="close-sheet" aria-label={t.closePanel} onclick={onclose}>×</button>
  </div>

  <div class="tabbody" id="guideBody" role="tabpanel" aria-labelledby="tabGuide" hidden={tab !== 'guide'}>
    <div class="desk-explain"><ExplainCard {lang} {part} {explain} onclear={onclearpart} /></div>

    <section>
      <h2>{t.colorsTitle}</h2>
      <div class="legend">
        {#each LEGEND as l}
          <div><b style="color:var({l.c})">{l.sample}</b><span>{lang === 'en' ? l.en : l.es}</span></div>
        {/each}
      </div>
    </section>

    <section class="concepts">
      <h2>{t.howTitle}</h2>
      {#each sections as sec (sec.id)}
        <details open={sec.open}>
          <summary>{sec.title}</summary>
          <div>
            {#each sec.blocks as b}
              {#if b.p}<p>{@html glossHtml(b.p, lang)}</p>{/if}
              {#if b.ul}<ul>{#each b.ul as li}<li>{@html glossHtml(li, lang)}</li>{/each}</ul>{/if}
            {/each}
          </div>
        </details>
      {/each}
    </section>

    <a class="panel-link" href={t.mcduHref}>{t.mcduFooter}</a>
  </div>

  <div class="tabbody" id="exBody" role="tabpanel" aria-labelledby="tabEx" hidden={tab !== 'ex'}>
    {@render exercises()}
  </div>
</aside>
