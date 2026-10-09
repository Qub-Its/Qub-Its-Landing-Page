<script module>
  import { theta, norm360, angleDiff, outerAt, MARKERS, SPEED_INDEX, SECONDS_INDEX, logTicks, hoursLabels, paAngle, oatAngle, DA_INDEX, daAngle, cToF } from '../lib/scales.js';
  import { pt, seg, sector, label, f, svgPoint, vecAngle } from './geom.js';

  // ---- Static geometry: computed once, never re-rendered (only transforms depend on the state) ----------
  const CX = 200, CY = 200;
  const R_BASE = 196, R_DISC = 166;
  const LEN = { major: 10, mid: 7, minor: 4.5 };
  const ticks = logTicks().map((t) => ({ ...t, a: theta(t.v) }));

  /** Tick paths grouped by size: outwards = true draws from r0 outwards, otherwise from r0 inwards. */
  function tickPaths(r0, dir) {
    const out = { major: '', mid: '', minor: '' };
    for (const t of ticks) out[t.size] += seg(CX, CY, r0, r0 + dir * LEN[t.size], t.a);
    return out;
  }
  const OUTER = tickPaths(187, -1); // outer scale: ticks hang from r 187 inwards
  const INNER = tickPaths(R_DISC, -1); // inner scale: ticks hang from the disc edge inwards
  const outerLabels = ticks.filter((t) => t.label).map((t) => label(CX, CY, 172, t.a, t.label));
  const innerLabels = ticks.filter((t) => t.label).map((t) => label(CX, CY, 149, t.a, t.label));
  const hours = hoursLabels().map((h) => label(CX, CY, 138, theta(h.min), h.label));

  // Conversion arrows (cyan triangles on the rim, tip pointing inwards) with their labels along the rim.
  const CONV_GROUP = { naut: 'convNaut', stat: 'convNaut', km: 'convNaut', gal: 'convFuel', liters: 'convFuel', lbs: 'convFuel', meters: 'convLength', feet: 'convLength' };
  // Label side keeps neighbours (24° / 31°, 295° / 306° / 316°) from colliding.
  const CONV_ANCHOR = { naut: 'end', stat: 'start', km: 'start', gal: 'end', liters: 'end', lbs: 'end', meters: 'start', feet: 'start' };
  const conv = MARKERS.map((m) => {
    const a = theta(m.v);
    const [x1, y1] = pt(CX, CY, 188, a);
    const [x2, y2] = pt(CX, CY, 195.2, a - 1.5);
    const [x3, y3] = pt(CX, CY, 195.2, a + 1.5);
    const anchor = CONV_ANCHOR[m.id];
    const lab = label(CX, CY, 191.6, a + (anchor === 'end' ? -2.4 : 2.4), m.label);
    return { id: m.id, group: CONV_GROUP[m.id], tri: `M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}Z`, anchor, lab };
  });
  const convGroups = ['convNaut', 'convFuel', 'convLength'].map((g) => ({ g, items: conv.filter((c) => c.group === g) }));

  // TAS window (r 100-132) and DA window (r 62-92). In the TAS window the PA scale (disc, ticks hang inwards from
  // r 118) and the OAT scale (base, ticks grow outwards from r 118) touch at r 118, where the alignment is read.
  const TAS_A1 = paAngle(20000) - 12, TAS_A2 = paAngle(0) + 8; // the extra 8 deg at the PA 20 end hold the OAT caption
  const DA_A1 = daAngle(20000) - 4, DA_A2 = daAngle(-2000) + 4;
  const R_TAS = 118;
  const tasHole = sector(CX, CY, 100, 132, TAS_A1, TAS_A2);
  const daHole = sector(CX, CY, 62, 92, DA_A1, DA_A2);
  const { paTicks, paLabels } = (() => {
    let d = '';
    const labels = [];
    for (let pa = 0; pa <= 20000; pa += 1000) {
      d += seg(CX, CY, R_TAS, pa % 2000 ? R_TAS - 4.5 : R_TAS - 8, paAngle(pa));
      if (pa % 2000 === 0) labels.push(label(CX, CY, 106, paAngle(pa), pa / 1000));
    }
    return { paTicks: d, paLabels: labels };
  })();
  const { daTicks, daLabels } = (() => {
    let d = '';
    const labels = [];
    for (let h = -2000; h <= 20000; h += 1000) {
      d += seg(CX, CY, 92, h % 5000 === 0 ? 98 : 95.5, daAngle(h));
      if (h % 5000 === 0 && h >= 0) labels.push(label(CX, CY, 104, daAngle(h), h / 1000));
    }
    return { daTicks: d, daLabels: labels };
  })();
  const paCap = label(CX, CY, 94, (paAngle(20000) + paAngle(0)) / 2, 'PRESS ALT ×1000');
  const oatCap = label(CX, CY, 125, TAS_A1 + 4.5, 'OAT °C');
  const daCap = label(CX, CY, 111, (DA_A1 + DA_A2) / 2, 'DENS ALT x1000');

  // Base layers seen through the windows: OAT arc (-40..+40 C, ticks and labels every 20 C) and the fixed DA index.
  const { oatTicks, oatLabels } = (() => {
    let d = '';
    const labels = [];
    for (let c = -40; c <= 40; c += 5) {
      d += seg(CX, CY, R_TAS, c % 20 === 0 ? R_TAS + 8 : c % 10 === 0 ? R_TAS + 5.5 : R_TAS + 3.5, oatAngle(c));
      if (c % 20 === 0) labels.push(label(CX, CY, 128, oatAngle(c), c));
    }
    return { oatTicks: d, oatLabels: labels };
  })();
  const [dix1, diy1] = pt(CX, CY, 92, DA_INDEX);
  const [dix2, diy2] = pt(CX, CY, 80, DA_INDEX - 3);
  const [dix3, diy3] = pt(CX, CY, 80, DA_INDEX + 3);
  const daIndexTri = `M${dix1} ${diy1}L${dix2} ${diy2}L${dix3} ${diy3}Z`;
  const daIndexLine = seg(CX, CY, 62, 80, DA_INDEX);

  // Speed index 60, seconds index 36, index 10 (both scales).
  const triAt = (r0, r1, half, a) => {
    const [x1, y1] = pt(CX, CY, r0, a);
    const [x2, y2] = pt(CX, CY, r1, a - half);
    const [x3, y3] = pt(CX, CY, r1, a + half);
    return `M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}Z`;
  };
  const speedTri = triAt(167.5, 154, 3.8, theta(SPEED_INDEX));
  const secTri = triAt(167.5, 158, 2.6, theta(SECONDS_INDEX));
  const index10Outer = seg(CX, CY, 177, 190, 0);
  const index10Inner = seg(CX, CY, 155, R_DISC, 0);

  // Temperature strip (y 410-460): linear C over F aligned through cToF.
  const SX0 = 24, SX1 = 376, C0 = -40, C1 = 50;
  const sx = (c) => f(SX0 + ((c - C0) / (C1 - C0)) * (SX1 - SX0));
  const { cTicks, cLabels } = (() => {
    let d = '';
    const labels = [];
    for (let c = C0; c <= C1; c += 5) {
      d += `M${sx(c)} 434V${c % 10 === 0 ? 424 : 428.5}`;
      if (c % 10 === 0) labels.push({ x: sx(c), y: 420, t: c });
    }
    return { cTicks: d, cLabels: labels };
  })();
  const { fTicks, fLabels } = (() => {
    let d = '';
    const labels = [];
    for (let F = -40; F <= cToF(C1); F += 10) {
      const c = ((F - 32) * 5) / 9;
      d += `M${sx(c)} 434V${F % 20 === 0 ? 444 : 440}`;
      if (F % 20 === 0) labels.push({ x: sx(c), y: 454, t: F });
    }
    return { fTicks: d, fLabels: labels };
  })();

  const I18N = {
    es: {
      disc: 'Disco interior, gira el cálculo',
      cursor: 'Cursor',
      discText: (o) => `10 interior bajo ${o} exterior`,
      cursorText: (v) => `cursor en ${v}`
    },
    en: {
      disc: 'Inner disc, turns the calculation',
      cursor: 'Cursor',
      discText: (o) => `10 inner under ${o} outer`,
      cursorText: (v) => `cursor at ${v}`
    }
  };
  /** Outer-scale mantissa at screen angle a. */
  const readAt = (a) => Math.pow(10, 1 + norm360(a) / 360);
</script>

<script>
  // Calculator face of the E6B: a dark anodized base with the outer log scale and conversion arrows, an inner
  // disc (rotates with `s.rot`) with the inner scale, hours ring, indices and the TAS / DA windows, a hairline
  // cursor and the temperature strip. Explain mode: a click on any [data-part] calls onpart(id); `highlight`
  // outlines that part. Drag the disc to turn it, drag the rim / cursor knob to move the cursor.
  import { applyState } from '../lib/e6b.svelte.js';
  import { keyStep } from './geom.js';

  /** @type {{ s: import('../lib/e6b.svelte.js').e6b, explain?: boolean, highlight?: string|null, onpart?: (id: string) => void, label?: string, lang?: string }} */
  let { s, explain = false, highlight = null, onpart = () => {}, label: ariaLabel = 'E6B', lang = 'es' } = $props();

  const tx = $derived(I18N[lang] ?? I18N.es);
  /** @type {SVGSVGElement} */
  let svg;
  /** @type {{ mode: 'rot'|'cursor', last: number, id: number }|null} */
  let drag = null;

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
    if (p.y > 402) return;
    const dx = p.x - CX, dy = p.y - CY;
    const r = Math.hypot(dx, dy);
    const [kx, ky] = pt(CX, CY, 190, s.cursor);
    let mode = null;
    if (Math.hypot(p.x - kx, p.y - ky) < 16 || (r >= 168 && r <= 202)) mode = 'cursor';
    else if (r < 168) mode = 'rot';
    if (!mode) return;
    const a = vecAngle(dx, dy);
    drag = { mode, last: a, id: e.pointerId };
    try { svg.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    s.dragging = true;
    if (mode === 'cursor') applyState({ cursor: a });
    e.preventDefault();
  }
  function move(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const p = svgPoint(svg, e);
    const a = vecAngle(p.x - CX, p.y - CY);
    if (drag.mode === 'rot') applyState({ rot: s.rot + angleDiff(a, drag.last) });
    else applyState({ cursor: a });
    drag.last = a;
  }
  function up(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    s.dragging = false;
    try { svg.releasePointerCapture(e.pointerId); } catch { /* already released */ }
  }
  function discKey(e) {
    const d = keyStep(e, 0.1, 1, 5);
    if (!d) return;
    e.preventDefault();
    applyState({ rot: s.rot + d });
  }
  function cursorKey(e) {
    const d = keyStep(e, 0.1, 1, 5);
    if (!d) return;
    e.preventDefault();
    applyState({ cursor: s.cursor + d });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<svg bind:this={svg} class="e6b-svg" class:explain viewBox="0 0 400 470" role="group" aria-label={ariaLabel}
  onclick={pick} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
  <defs>
    <clipPath id="e6bTasClip">
      <path d={tasHole} transform="rotate({s.rot} {CX} {CY})" />
      <path d={daHole} transform="rotate({s.rot} {CX} {CY})" />
    </clipPath>
  </defs>

  <g id="e6bCalcFace" class="e6b-face">
    <rect width="400" height="470" fill="#1b2025" />
    <circle cx={CX} cy={CY} r={R_BASE} fill="#2a3137" stroke="#0f1316" stroke-width="2" />

    <!-- outer scale -->
    <g data-part="outerScale">
      <circle class="hit" cx={CX} cy={CY} r="178" stroke-width="20" />
      <path d={OUTER.minor} class="tk" stroke-width="0.7" />
      <path d={OUTER.mid} class="tk" stroke-width="0.9" />
      <path d={OUTER.major} class="tk" stroke-width="1.2" />
      {#each outerLabels as l}<text x={l.x} y={l.y} transform={l.tr} class="sc">{l.t}</text>{/each}
    </g>

    <!-- conversion arrows -->
    {#each convGroups as g (g.g)}
      <g data-part={g.g}>
        {#each g.items as c (c.id)}
          <path d={c.tri} fill="#3ccbe8" />
          <text x={c.lab.x} y={c.lab.y} transform={c.lab.tr} class="cv" style:text-anchor={c.anchor}>{c.lab.t}</text>
        {/each}
      </g>
    {/each}
    <g data-part="index10"><path d={index10Outer} stroke="#f3a533" stroke-width="2.2" fill="none" /></g>

    <!-- inner disc -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <g class="disc" transform="rotate({s.rot} {CX} {CY})" tabindex="0" role="slider" aria-label={tx.disc}
      aria-valuemin="0" aria-valuemax="360" aria-valuenow={Math.round(s.rot)} aria-valuetext={tx.discText(outerAt(s.rot, 10).toFixed(1))}
      onkeydown={discKey}>
      <circle cx={CX} cy={CY} r={R_DISC} fill="#353e46" stroke="#12171b" stroke-width="1.5" />
      <g data-part="innerScale">
        <circle class="hit" cx={CX} cy={CY} r="155" stroke-width="22" />
        <path d={INNER.minor} class="tk" stroke-width="0.7" />
        <path d={INNER.mid} class="tk" stroke-width="0.9" />
        <path d={INNER.major} class="tk" stroke-width="1.2" />
        {#each innerLabels as l}<text x={l.x} y={l.y} transform={l.tr} class="sc">{l.t}</text>{/each}
      </g>
      <g data-part="hoursRing">
        <circle class="hit" cx={CX} cy={CY} r="138" stroke-width="12" />
        <circle cx={CX} cy={CY} r="144" fill="none" stroke="#f3a533" stroke-opacity="0.35" stroke-width="0.6" />
        {#each hours as l}<text x={l.x} y={l.y} transform={l.tr} class="hr">{l.t}</text>{/each}
      </g>
      <g data-part="speedIndex">
        <path d={speedTri} fill="#f3a533" stroke="#12171b" stroke-width="0.8" />
      </g>
      <g data-part="secondsIndex">
        <path d={secTri} fill="none" stroke="#f3a533" stroke-width="1.3" />
      </g>
      <g data-part="index10"><path d={index10Inner} stroke="#f3a533" stroke-width="2.2" fill="none" /></g>

      <g data-part="tasWindow">
        <path d={tasHole} fill="#2a3137" stroke="#0f1316" stroke-width="1.2" />
        <path d={paTicks} class="tk" stroke-width="0.9" />
        {#each paLabels as l}<text x={l.x} y={l.y} transform={l.tr} class="sc">{l.t}</text>{/each}
        <text x={paCap.x} y={paCap.y} transform={paCap.tr} class="cap">{paCap.t}</text>
        <text x={oatCap.x} y={oatCap.y} transform={oatCap.tr} class="cap">{oatCap.t}</text>
      </g>
      <g data-part="daWindow">
        <path d={daHole} fill="#2a3137" stroke="#0f1316" stroke-width="1.2" />
        <path d={daTicks} class="tk" stroke-width="0.9" />
        {#each daLabels as l}<text x={l.x} y={l.y} transform={l.tr} class="sc">{l.t}</text>{/each}
        <text x={daCap.x} y={daCap.y} transform={daCap.tr} class="cap">{daCap.t}</text>
      </g>
    </g>

    <!-- base layers seen only through the windows -->
    <g clip-path="url(#e6bTasClip)" pointer-events="none">
      <path d={oatTicks} class="tk" stroke-width="0.9" />
      {#each oatLabels as l}<text x={l.x} y={l.y} transform={l.tr} class="sc oat">{l.t}</text>{/each}
      <path d={daIndexLine} stroke="#f3a533" stroke-width="1.6" fill="none" />
      <path d={daIndexTri} fill="#f3a533" />
    </g>

    <text x={CX} y="192" class="logo" text-anchor="middle">E6B</text>
    <text x={CX} y="206" class="logo2" text-anchor="middle">Qub-its Labs</text>

    <!-- cursor -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <g class="cursor" transform="rotate({s.cursor} {CX} {CY})" tabindex="0" role="slider" aria-label={tx.cursor}
      aria-valuemin="0" aria-valuemax="360" aria-valuenow={Math.round(s.cursor)} aria-valuetext={tx.cursorText(readAt(s.cursor).toFixed(1))}
      onkeydown={cursorKey}>
      <g data-part="cursor">
        <line x1={CX} y1={CY} x2={CX} y2={CY - R_BASE} stroke="transparent" stroke-width="9" />
        <line x1={CX} y1={CY} x2={CX} y2={CY - R_BASE} stroke="#45df80" stroke-width="1.1" />
        <circle cx={CX} cy={CY - 190} r="4.2" fill="#45df80" fill-opacity="0.35" stroke="#45df80" stroke-width="1.2" />
      </g>
    </g>

    <!-- temperature strip -->
    <g data-part="tempStrip">
      <rect x="10" y="408" width="380" height="54" rx="6" fill="#2a3137" stroke="#0f1316" />
      <path d="M{SX0} 434H{SX1}" stroke="#eef2f5" stroke-width="0.9" />
      <path d={cTicks} class="tk" stroke-width="0.9" />
      <path d={fTicks} class="tk" stroke-width="0.9" />
      {#each cLabels as l}<text x={l.x} y={l.y} class="sc" text-anchor="middle">{l.t}</text>{/each}
      {#each fLabels as l}<text x={l.x} y={l.y} class="sc" text-anchor="middle">{l.t}</text>{/each}
      <text x="12" y="418" class="cap">C</text>
      <text x="12" y="454" class="cap">F</text>
    </g>
  </g>
</svg>

<style>
  .e6b-svg { display: block; width: 100%; height: auto; touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; }
  /* Drawing rules hang on the root group (not .e6b-svg) so the magnifier's <use> copy gets them too. */
  .e6b-face text { font-family: var(--f-mono, 'B612 Mono', ui-monospace, Menlo, Consolas, monospace); fill: #eef2f5; text-anchor: middle; dominant-baseline: central; }
  .e6b-face text.sc { font-size: 7.6px; }
  .e6b-face text.sc.oat { font-size: 5.6px; }
  .e6b-face text.hr { font-size: 6px; fill: #f3a533; fill-opacity: 0.9; }
  .e6b-face text.cv { font-size: 5.4px; fill: #3ccbe8; }
  .e6b-face text.ix { font-size: 5px; fill: #f3a533; }
  .e6b-face text.cap { font-size: 4.8px; fill: #97a5b1; letter-spacing: 0.04em; }
  .e6b-face text.logo { font-size: 15px; font-weight: 700; fill: #eef2f5; letter-spacing: 0.08em; }
  .e6b-face text.logo2 { font-size: 5.5px; fill: #97a5b1; }
  .e6b-face .tk { stroke: #eef2f5; fill: none; }
  .e6b-face .hit { fill: none; stroke: transparent; }
  .e6b-svg.explain { cursor: help; }
  .e6b-svg.explain :global([data-part]:hover) { filter: drop-shadow(0 0 3px #3ccbe8); }
  .e6b-svg :global([data-part].hl) { filter: drop-shadow(0 0 3px #3ccbe8) drop-shadow(0 0 5px #3ccbe8); }
  .e6b-svg :global([data-part].hl .hit) { stroke: rgba(60, 203, 232, 0.28); }
  .e6b-svg g:focus { outline: none; }
  .e6b-svg g:focus-visible { outline: 2px solid #3ccbe8; outline-offset: 2px; }
</style>
