<script module>
  let seq = 0;
</script>

<script>
  // Altitude tape (A320 style): grey moving scale (labels in hundreds every 500 ft), drum readout with a
  // rolling last-two-digits drum in 20 ft steps, cyan selected altitude, landing elevation bar and the
  // baro reference box under the tape. Ticks exist only for the visible range around a rounded base altitude.
  import { REGIONS, CY, C, FONT, PX_PER_FT } from '../../lib/layout.js';

  /** @type {{ s: import('../../lib/schema.js').FlightState }} */
  let { s } = $props();

  const uid = `alt${++seq}`;
  const R = REGIONS.altitude;
  const B = REGIONS.baro;
  const LEFT = R.x;            // ticks hang from the left edge
  const RIGHT = R.x + R.w;
  const OFF = 150;             // |dy| beyond which the selected altitude counts as off-scale
  const ROW = 24;              // drum row height per 20 ft
  const WIN_H = 19;            // half height of the drum window

  const base = $derived(Math.round(s.alt / 100) * 100);
  const shift = $derived((s.alt - base) * PX_PER_FT);
  /** @param {number} ft @returns {number} y in the base frame */
  const yOf = (ft) => CY - (ft - base) * PX_PER_FT;

  const ticks = $derived.by(() => {
    /** @type {{v: number, y: number, label: string, big: boolean}[]} */
    const out = [];
    const span = Math.ceil(((R.h / 2) / PX_PER_FT + 100) / 100) * 100;
    for (let v = base - span; v <= base + span; v += 100) {
      const big = v % 500 === 0;
      out.push({ v, y: yOf(v), big, label: big ? String(Math.abs(v) / 100) : '' });
    }
    return out;
  });

  // Landing elevation / terrain bar while the radio altimeter is showing.
  const elevY = $derived(s.radioAlt !== null ? yOf(s.groundElev) : null);

  // Selected altitude
  const selDy = $derived((s.fcu.alt - s.alt) * PX_PER_FT);   // + = above
  const selOff = $derived(Math.abs(selDy) > OFF);
  const selTop = $derived(selDy > 0);
  const selText = $derived(
    s.baro.std ? 'FL' + String(Math.round(s.fcu.alt / 100)).padStart(3, '0') : String(Math.round(s.fcu.alt))
  );

  // Drum: static digits (hundreds and up) + rolling last two digits
  const neg = $derived(s.alt < 0);
  const abs = $derived(Math.abs(s.alt));
  const staticDigits = $derived((neg ? '-' : '') + (Math.floor(abs / 100) > 0 ? String(Math.floor(abs / 100)) : ''));
  const drum = $derived.by(() => {
    const a0 = Math.floor(abs / 20) * 20;
    /** @type {{k: number, y: number, t: string}[]} */
    const rows = [];
    for (let j = -2; j <= 2; j++) {
      const v = a0 + j * 20;
      if (v < 0) continue;
      rows.push({ k: j, y: CY - ((v - abs) * ROW) / 20, t: String(v % 100).padStart(2, '0') });
    }
    return rows;
  });

  const baroText = $derived(String(Math.round(s.baro.hpa)));
</script>

<defs>
  <clipPath id="{uid}-clip"><rect x={R.x} y={R.y} width={R.w} height={R.h} /></clipPath>
  <clipPath id="{uid}-drum"><rect x={LEFT + 4} y={CY - WIN_H + 2} width={R.w - 4} height={2 * WIN_H - 4} /></clipPath>
</defs>

<g data-part="altTape">
  <g clip-path="url(#{uid}-clip)">
    <rect x={R.x} y={R.y} width={R.w} height={R.h} fill={C.tape} />

    <g transform="translate(0 {shift})">
      {#if elevY != null}
        <g data-part="landingElev">
          <rect x={LEFT} y={elevY} width="9" height={R.h * 3} fill={C.sky} />
          <line x1={LEFT} x2={RIGHT} y1={elevY} y2={elevY} stroke={C.sky} stroke-width="3" />
        </g>
      {/if}
      {#each ticks as t (t.v)}
        <line x1={LEFT} x2={LEFT + (t.big ? 14 : 8)} y1={t.y} y2={t.y} stroke={C.white} stroke-width="2" />
        {#if t.big}
          <text x={LEFT + 20} y={t.y} dominant-baseline="central" fill={C.white} font-size={FONT.normal}>{t.label}</text>
        {/if}
      {/each}
    </g>

    <!-- selected altitude: bracket on the tape, or number above / below when off-scale -->
    <g data-part="altSelected">
      {#if !selOff}
        <rect x={RIGHT - 28} y={CY - selDy - 12} width="26" height="24" fill="none" stroke={C.cyan} stroke-width="3" />
      {:else}
        <rect x={R.x} y={selTop ? R.y : R.y + R.h - 22} width={R.w} height="22" fill={C.bg} />
        <text x={R.x + 6} y={selTop ? R.y + 11 : R.y + R.h - 11} dominant-baseline="central" fill={C.cyan} font-size={FONT.normal}>{selText}</text>
        <polygon
          points={selTop
            ? `${RIGHT - 18},${R.y + 15} ${RIGHT - 12},${R.y + 6} ${RIGHT - 6},${R.y + 15}`
            : `${RIGHT - 18},${R.y + R.h - 15} ${RIGHT - 12},${R.y + R.h - 6} ${RIGHT - 6},${R.y + R.h - 15}`}
          fill={C.cyan}
        />
      {/if}
    </g>

    <!-- readout window with the rolling drum -->
    <g data-part="altReadout">
      <rect x={LEFT + 4} y={CY - WIN_H} width={R.w - 6} height={2 * WIN_H} fill={C.bg} stroke={C.yellow} stroke-width="2.5" />
      <text x={RIGHT - 31} y={CY + 1} text-anchor="end" dominant-baseline="central" fill={C.green} font-size={FONT.large} font-weight="bold">{staticDigits}</text>
      <g clip-path="url(#{uid}-drum)">
        {#each drum as r (r.k)}
          <text x={RIGHT - 29} y={r.y + 1} dominant-baseline="central" fill={C.green} font-size={FONT.large} font-weight="bold">{r.t}</text>
        {/each}
      </g>
      <polygon points="{LEFT - 1},{CY - 7} {LEFT + 8},{CY} {LEFT - 1},{CY + 7}" fill={C.yellow} />
    </g>
  </g>
</g>

<g data-part="baro">
  {#if s.baro.std}
    <text x={B.x + B.w / 2} y={B.y + B.h / 2} text-anchor="middle" dominant-baseline="central" fill={C.cyan} font-size={FONT.large} font-weight="bold">STD</text>
  {:else}
    <text x={B.x + B.w / 2} y={B.y + B.h / 2} text-anchor="middle" dominant-baseline="central" fill={C.cyan} font-size={FONT.normal} font-weight="bold">
      <tspan fill={C.white} font-size={FONT.small} font-weight="normal">QNH </tspan>{baroText}
    </text>
  {/if}
</g>
