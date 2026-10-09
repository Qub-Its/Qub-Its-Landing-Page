<script>
  // Heading tape: moving scale, yellow reference line, green track diamond, cyan selected-heading bug.
  import { REGIONS, CX, PX_PER_DEG_HDG as K, C, FONT, clamp, angleDiff, wrap360 } from '../../lib/layout.js';

  /** @type {{ s: import('../../lib/schema.js').FlightState }} */
  let { s } = $props();

  const CLIP_ID = 'pfd-heading-clip';
  const { x: X0, y: Y0, w: W, h: H } = REGIONS.heading;
  const LINE_Y = Y0 + 14;          // scale line
  const HALF = W / 2;              // 140 px = 28°
  const SPAN = HALF / K;

  // Ticks every 5° around the heading: recompute only when the nearest 5° step changes.
  const centre5 = $derived(Math.round(s.hdg / 5));
  const ticks = $derived.by(() => {
    let d = '';
    /** @type {{h: number, label: string}[]} */
    const labels = [];
    const n = Math.ceil(SPAN / 5) + 1;
    for (let i = -n; i <= n; i++) {
      const h5 = (centre5 + i) * 5; // unwrapped heading in the frame of the nearest 5° step
      const major = ((h5 % 10) + 10) % 10 === 0;
      d += `M${h5 * K} ${LINE_Y}v${major ? 9 : 5}`;
      if (major) labels.push({ h: h5, label: String(Math.round(wrap360(h5) / 10) % 36).padStart(2, '0') });
    }
    return { d, labels };
  });
  // Tape frame: x = CX + (h5 - hdg) * K → translate so unwrapped values line up.
  const tapeT = $derived(`translate(${CX - s.hdg * K} 0)`);

  const trackDx = $derived(clamp(angleDiff(s.track, s.hdg), -SPAN + 1, SPAN - 1) * K);
  const selDiff = $derived(angleDiff(s.fcu.hdg, s.hdg));
  const selOff = $derived(Math.abs(selDiff) > SPAN - 1);
  const selLabel = $derived(String(Math.round(s.fcu.hdg) % 360).padStart(3, '0'));
</script>

<defs>
  <clipPath id={CLIP_ID}><rect x={X0} y={Y0} width={W} height={H} /></clipPath>
</defs>

<g data-part="headingTape">
  <rect x={X0} y={Y0} width={W} height={H} fill={C.bg} />
  <g clip-path="url(#{CLIP_ID})">
    <rect x={X0} y={LINE_Y - 14} width={W} height={H} fill={C.tape} fill-opacity="0.35" />
    <line x1={X0} y1={LINE_Y} x2={X0 + W} y2={LINE_Y} stroke={C.white} stroke-width="2" />
    <g transform={tapeT} stroke={C.white} stroke-width="2" fill="none">
      <path d={ticks.d} />
      {#each ticks.labels as l (l.h)}
        <text x={l.h * K} y={LINE_Y + 30} fill={C.white} stroke="none" font-size={FONT.normal} font-family={C.font} text-anchor="middle">{l.label}</text>
      {/each}
    </g>

    {#if !s.fcu.hdgManaged}
      <g data-part="hdgSelected" fill="none" stroke={C.cyan} stroke-width="2.5">
        {#if selOff}
          <text x={selDiff > 0 ? X0 + W - 4 : X0 + 4} y={Y0 + 11} fill={C.cyan} stroke="none" font-size={FONT.normal} font-family={C.font}
            text-anchor={selDiff > 0 ? 'end' : 'start'}>{selLabel}</text>
        {:else}
          <polygon points="{CX + selDiff * K - 8},{LINE_Y - 12} {CX + selDiff * K + 8},{LINE_Y - 12} {CX + selDiff * K},{LINE_Y}" />
        {/if}
      </g>
    {/if}

    <g data-part="trackDiamond">
      <polygon points="{CX + trackDx},{LINE_Y - 7} {CX + trackDx + 7},{LINE_Y} {CX + trackDx},{LINE_Y + 7} {CX + trackDx - 7},{LINE_Y}" fill="none" stroke={C.green} stroke-width="2.5" />
    </g>

    <line x1={CX} y1={Y0} x2={CX} y2={LINE_Y + 12} stroke={C.yellow} stroke-width="3" />
  </g>
</g>
