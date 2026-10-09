<script module>
  const T = {
    es: {
      flip: 'Voltear', flipTitle: 'Cambiar de cara: calculadora / viento',
      pencil: 'Lápiz', erase: 'Borrar marcas',
      face: { calc: 'Cara calculadora del E6B', wind: 'Cara de viento del E6B' },
      fineRot: 'Giro fino del disco', fineDir: 'Giro fino de la rosa', fineSlide: 'Mover la tarjeta',
      ccw: 'antihorario', cw: 'horario', up: 'subir', down: 'bajar'
    },
    en: {
      flip: 'Flip', flipTitle: 'Switch face: calculator / wind',
      pencil: 'Pencil', erase: 'Erase marks',
      face: { calc: 'E6B calculator face', wind: 'E6B wind face' },
      fineRot: 'Fine disc rotation', fineDir: 'Fine rose rotation', fineSlide: 'Move the slide',
      ccw: 'counter-clockwise', cw: 'clockwise', up: 'up', down: 'down'
    }
  };
</script>

<script>
  // The E6B instrument: bezel with the face that is showing (calculator or wind), a toolbar (flip, pencil,
  // erase, fine adjustment) and the magnifier.
  import CalcFace from './CalcFace.svelte';
  import WindFace from './WindFace.svelte';
  import Lupa from './Lupa.svelte';
  import { applyState, clearDots } from '../lib/e6b.svelte.js';

  /** @type {{ s: import('../lib/e6b.svelte.js').e6b, explain?: boolean, highlight?: string|null, onpart?: (id: string) => void, lang?: string }} */
  let { s, explain = false, highlight = null, onpart = () => {}, lang = 'es' } = $props();

  const t = $derived(T[lang] ?? T.es);
  const wind = $derived(s.face === 'wind');
  const flip = () => applyState({ face: wind ? 'calc' : 'wind' });
  const bump = (key, d) => applyState({ [key]: s[key] + d });
  const fine = (d) => (Math.abs(d) < 1 ? '0.1' : '1');
</script>

<div class="e6b-wrap">
  <div class="e6b-bezel">
    {#if wind}
      <WindFace {s} {explain} {highlight} {onpart} {lang} label={t.face.wind} />
    {:else}
      <CalcFace {s} {explain} {highlight} {onpart} {lang} label={t.face.calc} />
    {/if}
  </div>

  <div class="e6b-bar">
    <div class="e6b-tools">
      <button type="button" class="e6b-btn wide" title={t.flipTitle} onclick={flip}>&#8646; {t.flip}</button>
      {#if wind}
        <button type="button" class="e6b-btn wide" aria-pressed={s.pencil} class:on={s.pencil} onclick={() => applyState({ pencil: !s.pencil })}>&#9998; {t.pencil}</button>
        <button type="button" class="e6b-btn wide" onclick={clearDots} disabled={!s.dots.length}>{t.erase}</button>
      {/if}

      <div class="e6b-fine" role="group" aria-label={wind ? t.fineDir : t.fineRot}>
        {#each [-1, -0.1, 0.1, 1] as d}
          <button type="button" class="e6b-btn" aria-label="{d < 0 ? t.ccw : t.cw} {fine(d)}°" title="{d < 0 ? t.ccw : t.cw} {fine(d)}°"
            onclick={() => (wind ? bump('dir', -d) : bump('rot', d))}>
            {d < 0 ? '⟲' : '⟳'}<small>{fine(d)}</small>
          </button>
        {/each}
      </div>

      {#if wind}
        <div class="e6b-fine" role="group" aria-label={t.fineSlide}>
          {#each [-1, 1] as d}
            <button type="button" class="e6b-btn" aria-label="{d > 0 ? t.up : t.down} 1 kt" title="{d > 0 ? t.up : t.down} 1 kt" onclick={() => bump('slide', d)}>
              {d > 0 ? '▲' : '▼'}<small>1 kt</small>
            </button>
          {/each}
        </div>
      {/if}
    </div>
    <Lupa {s} {lang} />
  </div>
</div>

<style>
  .e6b-wrap { width: 100%; }
  .e6b-bezel {
    background: linear-gradient(180deg, var(--bezel-a, #3a3f45), var(--bezel-b, #25292d));
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 1px 0 #555c63 inset, 0 -2px 0 #15181b inset, 0 18px 40px #0008;
    position: relative;
  }
  .e6b-bezel::before, .e6b-bezel::after {
    content: ""; position: absolute; top: 5px; width: 6px; height: 6px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #8a9096, #3b4045);
  }
  .e6b-bezel::before { left: 5px; }
  .e6b-bezel::after { right: 5px; }
  .e6b-bezel :global(svg.e6b-svg) { border-radius: 4px; border: 3px solid #0f1214; }

  .e6b-bar { display: flex; gap: 12px; align-items: flex-start; justify-content: space-between; margin-top: 12px; }
  .e6b-tools { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; min-width: 0; }
  .e6b-fine { display: flex; gap: 4px; }
  .e6b-btn {
    min-width: 44px; min-height: 44px; padding: 0 10px; display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
    background: var(--panel-2, #252f37); color: var(--fg, #e4eaef); border: 1px solid var(--line, #34414c); border-radius: 8px;
    font: 600 15px/1 var(--f-ui, 'B612', system-ui, sans-serif); cursor: pointer; touch-action: manipulation;
  }
  .e6b-btn.wide { flex-direction: row; gap: 6px; font-size: 13px; }
  .e6b-btn small { font: 10px var(--f-mono, ui-monospace, monospace); color: var(--muted, #97a5b1); margin-top: 2px; }
  .e6b-btn:hover:not(:disabled) { border-color: var(--cyan, #3ccbe8); }
  .e6b-btn:focus-visible { outline: 2px solid var(--cyan, #3ccbe8); outline-offset: 2px; }
  .e6b-btn.on { background: var(--amber, #f3a533); color: #12171b; border-color: var(--amber, #f3a533); }
  .e6b-btn:disabled { opacity: 0.45; cursor: default; }
  @media (max-width: 480px) {
    .e6b-bezel { padding: 8px; }
    .e6b-bar { flex-direction: column-reverse; align-items: stretch; }
    :global(.e6b-lupa) { align-self: center; }
  }
</style>
