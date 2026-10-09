<script>
  // PFD HSI: rotating compass rose (AHRS heading), heading bug, course arrow + deviation bar of the selected CDI
  // source (magenta GPS / green VOR), TO/FROM, source label, BRG1/BRG2 pointers, HDG and CRS/DTK readouts.
  import { C, FONT } from './layout.js';
  import { guidance, gpsTarget } from '../../lib/guidance.js';
  import { brgDeg } from '../../lib/nav.js';
  import { vorByFreq } from '../../lib/world.js';

  /** @type {{ s: any, valid: boolean, onpart: (id: string) => void }} */
  let { s, valid, onpart } = $props();

  const CX = 512, CY = 610, R = 128;
  const gd = $derived(guidance(s));
  const hdg = $derived(s.ac.hdg);
  const color = $derived(gd.source === 'GPS' ? C.magenta : C.green);
  const crs = $derived(gd.source === 'GPS' ? (s.pfd.obs ? s.sel.obsCrs : gd.dtk) : gd.source === 'VOR1' ? s.sel.crs1 : s.sel.crs2);
  const d3 = (v) => String(Math.round(((v % 360) + 360) % 360) || 360).padStart(3, '0');
  /** Bearing pointer target: NAV station or GPS waypoint. */
  function brgTo(src, i) {
    if (src === 'gps') { const tg = gpsTarget(s); return tg ? brgDeg(s.ac, tg.to) : null; }
    if (src === `nav${i}`) { const st = vorByFreq(s.nav[i - 1].act); return st ? brgDeg(s.ac, st) : null; }
    return null;
  }
  const b1 = $derived(brgTo(s.pfd.brg1, 1));
  const b2 = $derived(brgTo(s.pfd.brg2, 2));
</script>

<g data-part="pfd.hsi" role="button" tabindex="-1" onclick={() => onpart('pfd.hsi')} onkeydown={() => {}}>
  <circle cx={CX} cy={CY} r={R + 12} fill="#0b0f12" fill-opacity="0.85" stroke="#56606a" />
  {#if valid}
    <g transform={`rotate(${-hdg} ${CX} ${CY})`}>
      {#each Array(72) as _, i}
        {@const a = i * 5}
        <line x1={CX} y1={CY - R} x2={CX} y2={CY - R + (a % 10 === 0 ? 14 : 8)} stroke={C.white} stroke-width="2" transform={`rotate(${a} ${CX} ${CY})`} />
        {#if a % 30 === 0}
          <text x={CX} y={CY - R + 32} fill={C.white} font-family={FONT} font-size="18" text-anchor="middle" transform={`rotate(${a} ${CX} ${CY})`}>
            {({ 0: 'N', 90: 'E', 180: 'S', 270: 'W' })[a] ?? String(a / 10)}</text>
        {/if}
      {/each}
      <!-- heading bug -->
      <path d={`M ${CX - 10} ${CY - R - 10} h 20 v 10 l -6 0 l -4 6 l -4 -6 h -6 z`} fill={C.cyan} transform={`rotate(${s.sel.hdg} ${CX} ${CY})`} />
      {#if b1 != null}<line x1={CX} y1={CY + R - 6} x2={CX} y2={CY - R + 6} stroke={C.cyan} stroke-width="3" transform={`rotate(${b1} ${CX} ${CY})`} />
        <path d={`M ${CX} ${CY - R + 6} l -8 14 h 16 z`} fill={C.cyan} transform={`rotate(${b1} ${CX} ${CY})`} />{/if}
      {#if b2 != null}<g transform={`rotate(${b2} ${CX} ${CY})`} stroke={C.cyan} stroke-width="2" fill="none">
          <line x1={CX - 4} y1={CY + R - 6} x2={CX - 4} y2={CY - R + 20} /><line x1={CX + 4} y1={CY + R - 6} x2={CX + 4} y2={CY - R + 20} />
          <path d={`M ${CX - 10} ${CY - R + 22} L ${CX} ${CY - R + 6} L ${CX + 10} ${CY - R + 22}`} /></g>{/if}
      <!-- course arrow, deviation dots and bar -->
      <g transform={`rotate(${crs} ${CX} ${CY})`}>
        {#each [-2, -1, 1, 2] as dot}<circle cx={CX + dot * 28} cy={CY} r="5" fill="none" stroke={C.white} stroke-width="2" />{/each}
        <path d={`M ${CX} ${CY - R + 8} l -12 22 h 8 v 40 h 8 v -40 h 8 z`} fill={color} />
        <rect x={CX - 4} y={CY + 50} width="8" height={R - 58} fill={color} />
        {#if gd.valid}
          <rect x={CX - 4 + gd.defl * 56} y={CY - 46} width="8" height="92" fill={color} />
          {#if gd.toFrom}<path d={gd.toFrom === 'TO' ? `M ${CX + 30} ${CY - 34} l 12 18 h -24 z` : `M ${CX + 30} ${CY + 34} l 12 -18 h -24 z`} fill={C.white} />{/if}
        {/if}
      </g>
    </g>
    <path d={`M ${CX} ${CY - 18} l 10 26 l -10 -6 l -10 6 z`} fill={C.white} />
    <rect x={CX - 34} y={CY - R - 46} width="68" height="28" fill={C.bg} stroke={C.white} />
    <text x={CX} y={CY - R - 25} fill={C.white} font-family={FONT} font-size="20" text-anchor="middle">{d3(hdg)}°</text>
    <text x={CX - 60} y={CY - 20} fill={color} font-family={FONT} font-size="16" text-anchor="end">{gd.source}{gd.source === 'GPS' && s.pfd.obs ? ' OBS' : ''}</text>
    {#if gd.source === 'GPS' && gd.valid}<text x={CX + 60} y={CY - 20} fill={C.magenta} font-family={FONT} font-size="14">ENR</text>{/if}
  {:else}
    <line x1={CX - R} y1={CY - R} x2={CX + R} y2={CY + R} stroke={C.red} stroke-width="6" />
    <line x1={CX + R} y1={CY - R} x2={CX - R} y2={CY + R} stroke={C.red} stroke-width="6" />
  {/if}
</g>
<g font-family={FONT} font-size="17">
  <rect x="330" y="466" width="110" height="28" fill={C.boxBg} stroke="#3c4650" />
  <text x="338" y="487" fill={C.white}>HDG</text><text x="432" y="487" fill={C.cyan} text-anchor="end">{d3(s.sel.hdg)}°</text>
  <rect x="584" y="466" width="110" height="28" fill={C.boxBg} stroke="#3c4650" />
  {#if gd.source === 'GPS' && !s.pfd.obs}
    <text x="592" y="487" fill={C.white}>DTK</text><text x="686" y="487" fill={C.magenta} text-anchor="end">{gd.valid ? `${d3(gd.dtk)}°` : '___°'}</text>
  {:else}
    <text x="592" y="487" fill={C.white}>CRS</text><text x="686" y="487" fill={color} text-anchor="end">{d3(crs)}°</text>
  {/if}
</g>
