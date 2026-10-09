<script module>
  import { norm360, angleDiff } from '../lib/scales.js';
  import { WIND, dotScreen } from '../lib/wind.js';
  import { pt, seg, label, f, svgPoint, vecAngle } from './geom.js';

  // ---- Static geometry: computed once (only transforms / dot positions depend on the state) --------------
  const { cx: CX, cy: CY, rDisc: RD, unit: U } = WIND;
  const WIN = { x: 30, y: 10, w: 340, h: 450 };
  const SP_MIN = 30, SP_MAX = 270, SP_HALF = 50; // speed arcs 30..270 kt, within +-50 deg
  const DR_HALF = 45;

  // Slide card, drawn around its own origin (0,0) = the card centre of the arcs; up is -y.
  let arcThin = '', arcThick = '', arcHit = '';
  const arcLabels = [];
  for (let v = SP_MIN; v <= SP_MAX; v += 2) {
    const r = f(v * U);
    const [x1, y1] = pt(0, 0, r, -SP_HALF);
    const [x2, y2] = pt(0, 0, r, SP_HALF);
    const d = `M${x1} ${y1}A${r} ${r} 0 0 1 ${x2} ${y2}`;
    if (v % 10 === 0) {
      arcThick += d;
      arcHit += d;
      for (const a of [0, -30, 30]) {
        const [x, y] = pt(0, 0, r, a);
        arcLabels.push({ x, y: a === 0 ? y + 0 : y, t: v, tr: `rotate(${a} ${x} ${y})`, c: a === 0 });
      }
    } else arcThin += d;
  }
  let drThin = '', drThick = '', drHit = '';
  for (let a = -DR_HALF; a <= DR_HALF; a++) {
    if (a === 0) continue;
    const s = seg(0, 0, SP_MIN * U, SP_MAX * U, a);
    if (a % 5 === 0) {
      drThick += s;
      drHit += s;
    } else drThin += s;
  }
  const drCentre = seg(0, 0, SP_MIN * U, SP_MAX * U, 0);
  const driftLabelAngles = [];
  for (let a = -DR_HALF; a <= DR_HALF; a += 5) if (a !== 0) driftLabelAngles.push(a);

  // Frame: dark plate with the window cut out; TRUE INDEX above the disc; drift scale +-45 along its rim.
  const framePath = `M0 0H400V470H0Z M${WIN.x + 10} ${WIN.y}H${WIN.x + WIN.w - 10}Q${WIN.x + WIN.w} ${WIN.y} ${WIN.x + WIN.w} ${WIN.y + 10}V${WIN.y + WIN.h - 10}Q${WIN.x + WIN.w} ${WIN.y + WIN.h} ${WIN.x + WIN.w - 10} ${WIN.y + WIN.h}H${WIN.x + 10}Q${WIN.x} ${WIN.y + WIN.h} ${WIN.x} ${WIN.y + WIN.h - 10}V${WIN.y + 10}Q${WIN.x} ${WIN.y} ${WIN.x + 10} ${WIN.y}Z`;
  const [ti1x, ti1y] = pt(CX, CY, RD + 1, 0);
  const trueIndex = `M${ti1x} ${ti1y}L${ti1x - 6} ${ti1y - 13}L${ti1x + 6} ${ti1y - 13}Z`;
  let dsTicks = '';
  const dsLabels = [];
  for (let a = -DR_HALF; a <= DR_HALF; a++) {
    if (a === 0) continue;
    if (a % 5 === 0) dsTicks += seg(CX, CY, RD + 3, RD + (a % 15 === 0 ? 11 : 8), a);
    else dsTicks += seg(CX, CY, RD + 3, RD + 6, a);
    if (a % 15 === 0) dsLabels.push(label(CX, CY, RD + 19, a, `${Math.abs(a)}${a < 0 ? 'L' : 'R'}`));
  }

  // Azimuth rose: a tick every degree, longer every 5 / 10, a label every 10 (value / 10) and N E S W.
  let roseMinor = '', roseMid = '', roseMajor = '';
  const roseLabels = [];
  for (let a = 0; a < 360; a++) {
    if (a % 10 === 0) roseMajor += seg(CX, CY, RD, RD - 11, a);
    else if (a % 5 === 0) roseMid += seg(CX, CY, RD, RD - 7.5, a);
    else roseMinor += seg(CX, CY, RD, RD - 4.5, a);
  }
  for (let a = 0; a < 360; a += 10) {
    const card = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }[a];
    const [x, y] = pt(CX, CY, RD - 22, a);
    roseLabels.push({ x, y, t: card ?? a / 10, tr: `rotate(${a} ${x} ${y})`, big: a % 30 === 0, card: !!card });
  }

  const I18N = {
    es: {
      azimuth: 'Rosa de azimut',
      azText: (v) => `rumbo ${v} grados bajo el índice`,
      slide: 'Tarjeta de velocidad',
      slText: (v) => `${v} nudos bajo el ojal`,
      trueIndex: 'INDICE',
      mark: 'Marca de viento'
    },
    en: {
      azimuth: 'Azimuth rose',
      azText: (v) => `heading ${v} degrees under the index`,
      slide: 'Speed slide',
      slText: (v) => `${v} knots under the grommet`,
      trueIndex: 'TRUE INDEX',
      mark: 'Wind mark'
    }
  };
</script>

<script>
  // Wind face of the E6B: a speed slide with arcs (kt) and drift lines (deg) moving behind a frosted azimuth
  // disc with a grommet; pencil dots mark the wind. Same props as the calculator face. Drag the disc to rotate
  // the rose, drag outside the disc to slide the card, tap the disc to mark a dot when the pencil is on.
  import { applyState, addDot } from '../lib/e6b.svelte.js';
  import { keyStep } from './geom.js';

  /** @type {{ s: import('../lib/e6b.svelte.js').e6b, explain?: boolean, highlight?: string|null, onpart?: (id: string) => void, label?: string, lang?: string }} */
  let { s, explain = false, highlight = null, onpart = () => {}, label: ariaLabel = 'E6B', lang = 'es' } = $props();

  const tx = $derived(I18N[lang] ?? I18N.es);
  /** @type {SVGSVGElement} */
  let svg;
  /** @type {{ mode: 'rose'|'slide', last: number, id: number }|null} */
  let drag = null;

  const originY = $derived(CY + s.slide * U);
  const dots = $derived(s.dots.map((d) => dotScreen(d, s.dir)));
  // Drift labels sit at a fixed screen height (below the disc, or above it when the card is low) along each line, wherever the card is.
  const driftLabels = $derived(
    driftLabelAngles.map((a) => {
      const y = originY - 352 >= SP_MIN * U + 4 ? 352 : 24;
      const dist = (originY - y) / Math.cos((a * Math.PI) / 180);
      const x = f(CX + Math.tan((a * Math.PI) / 180) * (originY - y));
      return { a, x, y, t: Math.abs(a), show: dist >= SP_MIN * U && dist <= SP_MAX * U && x > WIN.x + 14 && x < WIN.x + WIN.w - 14 };
    })
  );

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

  function down(e) {
    if (explain || e.button > 0) return;
    const p = svgPoint(svg, e);
    const dx = p.x - CX, dy = p.y - CY;
    const r = Math.hypot(dx, dy);
    if (r < RD) {
      if (s.pencil) {
        // Inverse of dotScreen: bearing on the rose and distance in knots from the grommet.
        e.preventDefault();
        addDot({ b: norm360(s.dir + vecAngle(dx, dy)), d: r / U });
        return;
      }
      drag = { mode: 'rose', last: vecAngle(dx, dy), id: e.pointerId };
    } else if (p.x > WIN.x && p.x < WIN.x + WIN.w && p.y > WIN.y && p.y < WIN.y + WIN.h) {
      drag = { mode: 'slide', last: p.y, id: e.pointerId };
    } else return;
    try { svg.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    s.dragging = true;
    e.preventDefault();
  }
  function move(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const p = svgPoint(svg, e);
    if (drag.mode === 'rose') {
      const a = vecAngle(p.x - CX, p.y - CY);
      applyState({ dir: s.dir - angleDiff(a, drag.last) }); // the rose follows the finger
      drag.last = a;
    } else {
      applyState({ slide: s.slide + (p.y - drag.last) / U }); // the card follows the finger
      drag.last = p.y;
    }
  }
  function up(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    s.dragging = false;
    try { svg.releasePointerCapture(e.pointerId); } catch { /* already released */ }
  }
  function roseKey(e) {
    const d = keyStep(e, 1, 5, 10);
    if (!d || e.key === 'ArrowUp' || e.key === 'ArrowDown') return;
    e.preventDefault();
    applyState({ dir: s.dir + d });
  }
  function slideKey(e) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'PageUp' && e.key !== 'PageDown') return;
    const d = keyStep(e, 1, 5, 10);
    e.preventDefault();
    applyState({ slide: s.slide + d });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<svg bind:this={svg} class="e6b-svg" class:explain viewBox="0 0 400 470" role="group" aria-label={ariaLabel}
  onclick={pick} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
  <defs>
    <clipPath id="e6bWindClip"><rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx="10" /></clipPath>
  </defs>

  <g id="e6bWindFace">
    <rect width="400" height="470" fill="#1b2025" />
    <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx="10" fill="#2a3137" />

    <!-- slide card -->
    <g clip-path="url(#e6bWindClip)">
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <g class="card" data-part="slideCard" transform="translate({CX} {originY})" tabindex="0" role="slider" aria-label={tx.slide}
        aria-orientation="vertical" aria-valuemin={WIND.slideMin} aria-valuemax={WIND.slideMax} aria-valuenow={Math.round(s.slide)}
        aria-valuetext={tx.slText(s.slide.toFixed(0))} onkeydown={slideKey}>
        <rect x="-400" y="-900" width="800" height="1000" fill="transparent" />
        <g data-part="speedArcs">
          <path d={arcHit} fill="none" stroke="transparent" stroke-width="5" />
          <path d={arcThin} class="arc" stroke-width="0.5" stroke-opacity="0.4" />
          <path d={arcThick} class="arc" stroke-width="0.9" stroke-opacity="0.85" />
          {#each arcLabels as l}<text x={l.x} y={l.y} transform={l.tr} class="sc halo">{l.t}</text>{/each}
        </g>
        <g data-part="driftLines">
          <path d={drHit} fill="none" stroke="transparent" stroke-width="5" />
          <path d={drThin} class="drift" stroke-width="0.4" stroke-opacity="0.3" />
          <path d={drThick} class="drift" stroke-width="0.8" stroke-opacity="0.7" />
          <path d={drCentre} stroke="#f3a533" stroke-width="1.6" fill="none" />
        </g>
      </g>
      <!-- drift labels (screen-fixed height) -->
      <g data-part="driftLines" pointer-events="none">
        {#each driftLabels as l (l.a)}
          {#if l.show}<text x={l.x} y={l.y} transform="rotate({l.a} {l.x} {l.y})" class="dl halo">{l.t}</text>{/if}
        {/each}
      </g>
    </g>

    <!-- azimuth disc -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <g class="rose" transform="rotate({-s.dir} {CX} {CY})" tabindex="0" role="slider" aria-label={tx.azimuth}
      aria-valuemin="0" aria-valuemax="360" aria-valuenow={Math.round(s.dir)} aria-valuetext={tx.azText(s.dir.toFixed(0))} onkeydown={roseKey}>
      <g data-part="azimuth">
        <circle cx={CX} cy={CY} r={RD} fill="rgba(255,255,255,0.13)" stroke="rgba(238,242,245,0.55)" stroke-width="1.2" />
        <path d={roseMinor} class="tk" stroke-width="0.5" />
        <path d={roseMid} class="tk" stroke-width="0.8" />
        <path d={roseMajor} class="tk" stroke-width="1.1" />
        {#each roseLabels as l}
          <text x={l.x} y={l.y} transform={l.tr} class="sc rose-l" class:big={l.big} class:card={l.card}>{l.t}</text>
        {/each}
      </g>
    </g>

    <!-- frame -->
    <path d={framePath} fill="#232a30" fill-rule="evenodd" pointer-events="none" />
    <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx="10" fill="none" stroke="#0f1316" stroke-width="2" pointer-events="none" />
    <g data-part="driftScale">
      <path d={dsTicks} class="tk" stroke-width="0.8" />
      {#each dsLabels as l}<text x={l.x} y={l.y} transform={l.tr} class="sc">{l.t}</text>{/each}
    </g>
    <g data-part="trueIndex">
      <path d={trueIndex} fill="#f3a533" stroke="#12171b" stroke-width="0.8" />
      <text x={CX} y={ti1y - 20} class="ix">{tx.trueIndex}</text>
    </g>

    <!-- grommet and pencil dots -->
    <g data-part="grommet">
      <circle cx={CX} cy={CY} r="7" fill="#8b949b" stroke="#12171b" stroke-width="1" />
      <circle cx={CX} cy={CY} r="3" fill="#12171b" />
      <circle cx={CX} cy={CY} r="7" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" />
    </g>
    {#each dots as d, i (i)}
      <circle data-part="windDot" cx={d.x} cy={d.y} r="3.5" fill="#f3a533" stroke="#12171b" stroke-width="1" />
    {/each}
  </g>
</svg>

<style>
  .e6b-svg { display: block; width: 100%; height: auto; touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; }
  .e6b-svg text { font-family: var(--f-mono, 'B612 Mono', ui-monospace, Menlo, Consolas, monospace); fill: #eef2f5; text-anchor: middle; dominant-baseline: central; }
  .e6b-svg text.sc { font-size: 7.4px; fill: #fff6df; }
  .e6b-svg .card text.sc, .e6b-svg text.sc.halo { fill: #c9d3da; font-size: 6.4px; }
  .e6b-svg text.sc.rose-l { paint-order: stroke; stroke: rgba(20,26,31,0.7); stroke-width: 2px; stroke-linejoin: round; }
  .e6b-svg text.sc.big { font-size: 9.5px; font-weight: 700; }
  .e6b-svg text.sc.card { fill: #f3a533; }
  .e6b-svg text.dl { font-size: 7px; fill: #3ccbe8; }
  .e6b-svg text.ix { font-size: 5.6px; fill: #f3a533; letter-spacing: 0.05em; }
  .e6b-svg text.halo { paint-order: stroke; stroke: #2a3137; stroke-width: 2.4px; stroke-linejoin: round; }
  .e6b-svg .tk { stroke: #eef2f5; fill: none; }
  .e6b-svg .arc { stroke: #d5dde3; fill: none; }
  .e6b-svg .drift { stroke: #3ccbe8; fill: none; }
  .e6b-svg.explain { cursor: help; }
  .e6b-svg.explain :global([data-part]:hover) { filter: drop-shadow(0 0 3px #3ccbe8); }
  .e6b-svg :global([data-part].hl) { filter: drop-shadow(0 0 3px #3ccbe8) drop-shadow(0 0 5px #3ccbe8); }
  .e6b-svg g:focus { outline: none; }
  .e6b-svg g:focus-visible { outline: 2px solid #3ccbe8; outline-offset: 2px; }
</style>
