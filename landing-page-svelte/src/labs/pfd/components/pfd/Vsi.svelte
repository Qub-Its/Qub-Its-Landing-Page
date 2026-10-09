<script module>
  let seq = 0;
</script>

<script>
  // Vertical speed indicator: grey scale with Airbus non-linear spacing, labels 1 2 6 (thousands of fpm),
  // a green needle pivoting off the right edge and a digital readout (hundreds) when |vs| >= 200 fpm.
  import { REGIONS, CY, C, FONT, clamp } from '../../lib/layout.js';

  /** @type {{ s: import('../../lib/schema.js').FlightState }} */
  let { s } = $props();

  const uid = `vsi${++seq}`;
  const R = REGIONS.vsi;
  const X0 = R.x;              // left edge of the scale
  const X1 = R.x + R.w;        // right edge
  const PIVOT_X = X1 + 28;     // needle pivot, just beyond the right edge
  const HALF = 145;            // px from zero to +-6000 fpm
  const T1 = 55, T2 = 100;     // px at 1000 and 2000 fpm

  /** Non-linear scale: 0-1000 | 1000-2000 | 2000-6000. @param {number} v fpm @returns {number} px above zero (signed) */
  function off(v) {
    const a = Math.min(Math.abs(v), 6000);
    const px = a <= 1000 ? (a / 1000) * T1 : a <= 2000 ? T1 + ((a - 1000) / 1000) * (T2 - T1) : T2 + ((a - 2000) / 4000) * (HALF - T2);
    return v < 0 ? -px : px;
  }
  /** @param {number} v fpm @returns {number} screen y */
  const yOf = (v) => CY - off(v);

  const marks = [
    { v: 500, label: '', len: 6 }, { v: 1000, label: '1', len: 10 }, { v: 1500, label: '', len: 6 },
    { v: 2000, label: '2', len: 10 }, { v: 4000, label: '', len: 6 }, { v: 6000, label: '6', len: 10 }
  ].flatMap((m) => [m, { ...m, v: -m.v }]);

  const over = $derived(Math.abs(s.vs) > 6000);
  const lowDescent = $derived(s.radioAlt !== null && s.vs < -2000);
  const color = $derived(over || lowDescent ? C.amber : C.green);
  const tipY = $derived(yOf(clamp(s.vs, -6000, 6000)));
  const showDigits = $derived(Math.abs(s.vs) >= 200);
  const digits = $derived(String(Math.round(Math.abs(s.vs) / 100)).padStart(2, '0'));
  const boxY = $derived(clamp(tipY + (s.vs >= 0 ? -26 : 10), R.y + 8, R.y + R.h - 26));
</script>

<defs>
  <clipPath id="{uid}-clip"><rect x={R.x} y={R.y} width={R.w} height={R.h} /></clipPath>
</defs>

<g data-part="vsi">
  <g clip-path="url(#{uid}-clip)">
    <path d="M{X0} {CY - HALF - 12} H{X0 + 33} L{X1} {CY - HALF + 8} V{CY + HALF - 8} L{X0 + 33} {CY + HALF + 12} H{X0} Z" fill={C.tape} />
    <line x1={X0} x2={X1} y1={CY} y2={CY} stroke={C.white} stroke-width="2" />
    {#each marks as m (m.v)}
      <line x1={X0} x2={X0 + m.len} y1={yOf(m.v)} y2={yOf(m.v)} stroke={C.white} stroke-width="2" />
      {#if m.label}
        <text x={X0 + 15} y={yOf(m.v)} dominant-baseline="central" fill={C.white} font-size={FONT.normal}>{m.label}</text>
      {/if}
    {/each}
    <line x1={X0 + 4} x2={PIVOT_X} y1={tipY} y2={CY} stroke={color} stroke-width="3.5" stroke-linecap="butt" />
    {#if showDigits}
      <rect x={X0 + 4} y={boxY} width="30" height="18" fill={C.bg} />
      <text x={X0 + 19} y={boxY + 9.5} text-anchor="middle" dominant-baseline="central" fill={color} font-size={FONT.normal} font-weight="bold">{digits}</text>
    {/if}
  </g>
</g>
