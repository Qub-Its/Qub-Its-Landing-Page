<script>
  // ILS deviation scales (LOC under the sphere, G/S to its right), ILS ident/freq, radio altitude readout.
  import { REGIONS, CX, CY, PX_PER_DOT as DOT, C, FONT, clamp } from '../../lib/layout.js';

  /** @type {{ s: import('../../lib/schema.js').FlightState }} */
  let { s } = $props();

  const LOC_Y = REGIONS.ils.y + REGIONS.ils.h / 2;  // 455
  const GS_X = 446;
  const info = REGIONS.ilsInfo;
  const dots = [-2, -1, 1, 2];

  const locX = $derived(CX + clamp(s.ils.loc, -2.3, 2.3) * DOT);
  const gsY = $derived(CY - clamp(s.ils.gs, -2.3, 2.3) * DOT);
  const locLimit = $derived(Math.abs(s.ils.loc) > 2);
  const gsLimit = $derived(Math.abs(s.ils.gs) > 2);

  const ra = $derived(s.radioAlt === null ? null : Math.max(0, Math.round(s.radioAlt / (s.radioAlt < 100 ? 5 : 10)) * (s.radioAlt < 100 ? 5 : 10)));
  const course = $derived(String(Math.round(s.ils.course) % 360).padStart(3, '0'));
</script>

{#if s.ils.visible}
  <g data-part="locScale">
    <rect x={CX - 70} y={LOC_Y - 10} width="140" height="20" fill="transparent" />
    {#each dots as d (d)}
      <circle cx={CX + d * DOT} cy={LOC_Y} r="4" fill="none" stroke={C.white} stroke-width="1.8" />
    {/each}
    <line x1={CX} y1={LOC_Y - 8} x2={CX} y2={LOC_Y + 8} stroke={C.yellow} stroke-width="2.5" />
    <polygon points="{locX - 10},{LOC_Y} {locX},{LOC_Y - 6} {locX + 10},{LOC_Y} {locX},{LOC_Y + 6}"
      fill={locLimit ? 'none' : C.magenta} stroke={C.magenta} stroke-width="2" />
  </g>
  <g data-part="gsScale">
    <rect x={GS_X - 8} y={CY - 70} width="16" height="140" fill="transparent" />
    {#each dots as d (d)}
      <circle cx={GS_X} cy={CY + d * DOT} r="4" fill="none" stroke={C.white} stroke-width="1.8" />
    {/each}
    <line x1={GS_X - 7} y1={CY} x2={GS_X + 7} y2={CY} stroke={C.yellow} stroke-width="2.5" />
    <polygon points="{GS_X - 6},{gsY} {GS_X},{gsY - 10} {GS_X + 6},{gsY} {GS_X},{gsY + 10}"
      fill={gsLimit ? 'none' : C.magenta} stroke={C.magenta} stroke-width="2" />
  </g>
  <g data-part="ilsInfo" font-family={C.font} font-size={FONT.normal} fill={C.magenta}>
    <text x={info.x + 2} y={info.y + 15}>ILS {s.ils.ident}</text>
    <text x={info.x + 2} y={info.y + 34}>{s.ils.freq}/{course}°</text>
  </g>
{/if}

{#if ra !== null}
  <g data-part="radioAlt">
    <text x={CX} y={CY + 108} text-anchor="middle" font-family={C.font} font-size={FONT.large + 4} font-weight="bold"
      fill={C.green} stroke={C.bg} stroke-width="3" paint-order="stroke">{ra}</text>
  </g>
{/if}
