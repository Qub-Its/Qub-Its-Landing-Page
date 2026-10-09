<script>
  // The A320 PFD: one SVG, instruments composed by region (lib/layout.js). Explain mode: a click on any
  // element marked data-part="<id>" calls onpart(id); `highlight` outlines that part (exercises, explain card).
  import { VIEW, C } from '../../lib/layout.js';
  import Attitude from './Attitude.svelte';
  import HeadingTape from './HeadingTape.svelte';
  import Fma from './Fma.svelte';
  import Ils from './Ils.svelte';
  import SpeedTape from './SpeedTape.svelte';
  import AltitudeTape from './AltitudeTape.svelte';
  import Vsi from './Vsi.svelte';

  /** @type {{ s: import('../../lib/schema.js').FlightState, explain?: boolean, highlight?: string|null, onpart?: (id: string) => void, label?: string }} */
  let { s, explain = false, highlight = null, onpart = () => {}, label = 'PFD' } = $props();

  /** @type {SVGSVGElement} */
  let svg;

  function pick(event) {
    if (!explain) return;
    const part = /** @type {Element} */ (event.target).closest?.('[data-part]');
    if (part) onpart(part.getAttribute('data-part'));
  }

  $effect(() => {
    if (!svg) return;
    for (const el of svg.querySelectorAll('[data-part].hl')) el.classList.remove('hl');
    if (highlight) for (const el of svg.querySelectorAll(`[data-part="${highlight}"]`)) el.classList.add('hl');
  });
</script>

<div class="bezel">
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <svg bind:this={svg} class:explain viewBox="0 0 {VIEW.w} {VIEW.h}" role="img" aria-label={label} onclick={pick} style="font-family:{C.font}">
    <rect width={VIEW.w} height={VIEW.h} fill={C.bg} />
    <Attitude {s} />
    <Ils {s} />
    <SpeedTape {s} />
    <AltitudeTape {s} />
    <Vsi {s} />
    <HeadingTape {s} />
    <Fma {s} />
  </svg>
</div>

<style>
  .bezel {
    background: linear-gradient(180deg, var(--bezel-a, #3a3f45), var(--bezel-b, #25292d));
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 1px 0 #555c63 inset, 0 -2px 0 #15181b inset, 0 18px 40px #0008;
    position: relative;
  }
  .bezel::before, .bezel::after {
    content: ""; position: absolute; top: 5px; width: 6px; height: 6px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #8a9096, #3b4045);
  }
  .bezel::before { left: 5px; }
  .bezel::after { right: 5px; }
  svg { display: block; width: 100%; height: auto; border-radius: 4px; border: 3px solid #0f1214; user-select: none; -webkit-user-select: none; }
  svg.explain :global([data-part]) { cursor: help; }
  svg.explain :global([data-part]:hover) { filter: drop-shadow(0 0 3px #30d3f2); }
  svg :global([data-part].hl) { filter: drop-shadow(0 0 4px #ffa31a) drop-shadow(0 0 2px #ffa31a); }
</style>
