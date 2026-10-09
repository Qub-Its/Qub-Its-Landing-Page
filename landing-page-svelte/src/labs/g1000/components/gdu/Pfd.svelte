<script>
  // PFD screen (1024 × 768): top bar radios and navigation status, attitude, airspeed and altitude tapes, VSI,
  // HSI, inset map, NRST / TMR-REF windows, transponder and OAT boxes. Red X's when the AHRS/ADC are not valid,
  // black when off, an initialising banner while booting. Every region is a data-part.
  import { C, FONT, REGIONS } from './layout.js';
  import Radios from './Radios.svelte';
  import Hsi from './Hsi.svelte';
  import NavMap from './NavMap.svelte';
  import Windows from './Windows.svelte';
  import { gduPhase, adcValid, ahrsValid, indicatedAlt } from '../../lib/sim.js';
  import { guidance } from '../../lib/guidance.js';
  import { nearest } from '../../lib/world.js';

  /** @type {{ s: any, highlight: string|null, onpart: (id: string) => void, menuLabels: Record<string, string> }} */
  let { s, highlight, onpart, menuLabels } = $props();

  const phase = $derived(gduPhase(s, 'pfd'));
  const adc = $derived(adcValid(s));
  const ahrs = $derived(ahrsValid(s));
  const alt = $derived(indicatedAlt(s));
  const gd = $derived(guidance(s));
  const nrst = $derived(s.pfd.win === 'nrst' ? nearest(s.ac) : []);

  // Airspeed trend: IAS change over the last second, projected 6 s ahead.
  let trend = $state(0);
  let lastIas = 0, lastT = 0;
  $effect(() => {
    const ias = s.ac.ias, t = s.t;
    if (t < lastT) { trend = 0; lastIas = ias; lastT = t; }
    else if (t - lastT >= 0.5) { trend = t > lastT ? ((ias - lastIas) / (t - lastT)) * 6 : 0; lastIas = ias; lastT = t; }
  });

  const ATT_C = { x: 512, y: 290 };
  const PITCH_PX = 8;
  const IAS_PX = 4, ALT_PX = 0.5;
  const tap = (id) => () => onpart(id);
  const X = (r) => `M ${r[0]} ${r[1]} L ${r[0] + r[2]} ${r[1] + r[3]} M ${r[0] + r[2]} ${r[1]} L ${r[0]} ${r[1] + r[3]}`;
  const hl = $derived(highlight?.startsWith('pfd.') && REGIONS[highlight] ? REGIONS[highlight] : null);
  const d3 = (v) => String(Math.round(v)).padStart(3, '0');
</script>

{#if phase === 'off'}
  <rect width="1024" height="742" fill="#000" />
{:else if phase === 'boot'}
  <rect width="1024" height="742" fill="#000" />
  <text x="512" y="360" fill={C.white} font-family={FONT} font-size="34" text-anchor="middle">G1000</text>
  <text x="512" y="400" fill={C.grey} font-family={FONT} font-size="18" text-anchor="middle">INITIALIZING SYSTEM</text>
{:else}
  <!-- attitude: sky/ground rotated by bank and shifted by pitch -->
  <g data-part="pfd.att" role="button" tabindex="-1" onclick={tap('pfd.att')} onkeydown={() => {}}>
    {#if ahrs}
      <g transform={`rotate(${-s.ac.bank} ${ATT_C.x} ${ATT_C.y}) translate(0 ${s.ac.pitch * PITCH_PX})`}>
        <rect x="-600" y={ATT_C.y - 1400} width="2224" height="1400" fill={C.sky} />
        <rect x="-600" y={ATT_C.y} width="2224" height="1400" fill={C.ground} />
        <line x1="-600" y1={ATT_C.y} x2="1624" y2={ATT_C.y} stroke={C.white} stroke-width="2" />
        {#each [-20, -15, -10, -5, 5, 10, 15, 20] as p}
          <line x1={ATT_C.x - (p % 10 === 0 ? 60 : 30)} y1={ATT_C.y - p * PITCH_PX} x2={ATT_C.x + (p % 10 === 0 ? 60 : 30)} y2={ATT_C.y - p * PITCH_PX} stroke={C.white} stroke-width="2" />
          {#if p % 10 === 0}<text x={ATT_C.x - 84} y={ATT_C.y - p * PITCH_PX + 6} fill={C.white} font-family={FONT} font-size="16">{Math.abs(p)}</text>{/if}
        {/each}
      </g>
      <!-- roll scale (fixed) and sky pointer (moves with bank) -->
      {#each [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60] as a}
        <line x1={ATT_C.x} y1={ATT_C.y - 186} x2={ATT_C.x} y2={ATT_C.y - (a % 30 === 0 ? 206 : 198)} stroke={C.white} stroke-width="3" transform={`rotate(${a} ${ATT_C.x} ${ATT_C.y})`} />
      {/each}
      <g transform={`rotate(${-s.ac.bank} ${ATT_C.x} ${ATT_C.y})`}>
        <path d={`M ${ATT_C.x} ${ATT_C.y - 184} l -12 20 h 24 z`} fill={C.white} />
        <g data-part="pfd.slip" role="button" tabindex="-1" onclick={(e) => { e.stopPropagation(); onpart('pfd.slip'); }} onkeydown={() => {}}>
          <path d={`M ${ATT_C.x - 14} ${ATT_C.y - 160} h 28 l -4 7 h -20 z`} fill={C.white} />
        </g>
      </g>
      <path d={`M ${ATT_C.x - 110} ${ATT_C.y} h 70 l 10 10 M ${ATT_C.x + 110} ${ATT_C.y} h -70 l -10 10 M ${ATT_C.x - 30} ${ATT_C.y + 20} L ${ATT_C.x} ${ATT_C.y} L ${ATT_C.x + 30} ${ATT_C.y + 20}`}
        fill="none" stroke={C.yellow} stroke-width="7" stroke-linejoin="round" />
    {:else}
      <rect x="0" y="56" width="1024" height="686" fill="#000" />
      <path d={X([380, 120, 264, 320])} stroke={C.red} stroke-width="7" />
    {/if}
  </g>

  <!-- airspeed tape -->
  <g data-part="pfd.ias" role="button" tabindex="-1" onclick={tap('pfd.ias')} onkeydown={() => {}}>
    <rect x="230" y="110" width="100" height="360" fill="#000" fill-opacity="0.55" />
    {#if adc}
      <svg x="230" y="110" width="100" height="360" overflow="hidden">
        {#each Array(40) as _, i}
          {@const v = Math.floor(s.ac.ias / 10) * 10 + (i - 20) * 5}
          {#if v >= 20}
            {@const yy = 180 - (v - s.ac.ias) * IAS_PX}
            <line x1="84" y1={yy} x2="100" y2={yy} stroke={C.white} stroke-width="2" />
            {#if v % 10 === 0}<text x="78" y={yy + 6} fill={C.white} font-family={FONT} font-size="18" text-anchor="end">{v}</text>{/if}
          {/if}
        {/each}
        {#each [[40, 85, C.white, 92], [48, 129, C.green, 96], [129, 163, C.yellow, 96]] as [lo, hi, col, xx]}
          <rect x={xx} y={180 - (hi - s.ac.ias) * IAS_PX} width="4" height={(hi - lo) * IAS_PX} fill={col} />
        {/each}
        <rect x="88" y={180 - (200 - s.ac.ias) * IAS_PX} width="12" height={(200 - 163) * IAS_PX} fill={C.red} />
        {#if Math.abs(trend) > 1}<rect x="80" y={trend > 0 ? 180 - trend * IAS_PX : 180} width="4" height={Math.abs(trend) * IAS_PX} fill={C.magenta} />{/if}
      </svg>
      <path d="M 232 272 h 76 l 14 18 l -14 18 h -76 z" fill="#000" stroke={C.white} stroke-width="2" />
      <text x="300" y="299" fill={C.white} font-family={FONT} font-size="26" text-anchor="end">{Math.round(s.ac.ias)}</text>
      <text x="280" y="500" fill={C.white} font-family={FONT} font-size="14" text-anchor="middle">TAS {Math.round(s.ac.tas)}KT</text>
    {:else}
      <path d={X([230, 110, 100, 360])} stroke={C.red} stroke-width="6" />
    {/if}
  </g>

  <!-- selected altitude, altitude tape, baro -->
  <g data-part="pfd.selAlt" role="button" tabindex="-1" onclick={tap('pfd.selAlt')} onkeydown={() => {}}>
    <rect x="694" y="76" width="100" height="32" fill={C.boxBg} stroke="#3c4650" />
    <text x="744" y="100" fill={C.cyan} font-family={FONT} font-size="22" text-anchor="middle">{s.sel.alt}</text>
  </g>
  <g data-part="pfd.alt" role="button" tabindex="-1" onclick={tap('pfd.alt')} onkeydown={() => {}}>
    <rect x="694" y="110" width="100" height="360" fill="#000" fill-opacity="0.55" />
    {#if adc}
      <svg x="694" y="110" width="100" height="360" overflow="hidden">
        {#each Array(16) as _, i}
          {@const v = Math.floor(alt / 100) * 100 + (i - 8) * 100}
          {@const yy = 180 - (v - alt) * ALT_PX}
          <line x1="0" y1={yy} x2={v % 500 === 0 ? 18 : 10} y2={yy} stroke={C.white} stroke-width="2" />
          {#if v % 200 === 0}<text x="24" y={yy + 6} fill={C.white} font-family={FONT} font-size="17">{v}</text>{/if}
        {/each}
        <path d={`M 0 ${180 - (s.sel.alt - alt) * ALT_PX - 10} h 10 v 20 h -10 z`} fill={C.cyan} />
        {#if s.sel.mins != null}<path d={`M 0 ${180 - (s.sel.mins - alt) * ALT_PX} l 14 -8 v 16 z`} fill={C.cyan} />{/if}
      </svg>
      <path d="M 694 290 l 14 -18 h 90 v 36 h -90 z" fill="#000" stroke={C.white} stroke-width="2" />
      <text x="790" y="299" fill={C.white} font-family={FONT} font-size="24" text-anchor="end">{Math.round(alt / 10) * 10}</text>
    {:else}
      <path d={X([694, 110, 100, 360])} stroke={C.red} stroke-width="6" />
    {/if}
  </g>
  <g data-part="pfd.baro" role="button" tabindex="-1" onclick={tap('pfd.baro')} onkeydown={() => {}}>
    <rect x="694" y="472" width="100" height="30" fill={C.boxBg} stroke="#3c4650" />
    <text x="744" y="494" fill={C.cyan} font-family={FONT} font-size="17" text-anchor="middle">{s.sel.baro.toFixed(2)}IN</text>
  </g>
  <g data-part="pfd.vsi" role="button" tabindex="-1" onclick={tap('pfd.vsi')} onkeydown={() => {}}>
    <rect x="798" y="130" width="44" height="320" fill="#000" fill-opacity="0.55" />
    {#if adc}
      {#each [-2, -1, 0, 1, 2] as k}<line x1="798" y1={290 - k * 75} x2="808" y2={290 - k * 75} stroke={C.white} stroke-width="2" />{/each}
      {@const vy = 290 - Math.max(-2000, Math.min(2000, s.ac.vs)) * 0.075}
      <path d={`M 800 ${vy} l 12 -10 h 30 v 20 h -30 z`} fill="#000" stroke={C.white} />
      {#if Math.abs(s.ac.vs) >= 100}<text x="840" y={vy + 5} fill={C.white} font-family={FONT} font-size="13" text-anchor="end">{Math.round(s.ac.vs / 50) * 50}</text>{/if}
    {:else}
      <path d={X([798, 130, 44, 320])} stroke={C.red} stroke-width="5" />
    {/if}
  </g>

  <Hsi {s} valid={ahrs} {onpart} />

  {#if s.pfd.inset}
    <g data-part="pfd.inset" role="button" tabindex="-1" onclick={tap('pfd.inset')} onkeydown={() => {}}>
      <NavMap {s} x={0} y={500} w={230} h={212} range={s.pfd.insetRange} orient="track" topo={s.mfd.topo} small />
    </g>
  {/if}
  {#if s.pfd.win === 'nrst'}
    <g data-part="pfd.nrst" role="button" tabindex="-1" onclick={tap('pfd.nrst')} onkeydown={() => {}} font-family={FONT}>
      <rect x="794" y="500" width="230" height="212" fill="#0d1a24" stroke={C.cyan} />
      <text x="804" y="522" fill={C.cyan} font-size="15">NEAREST AIRPORTS</text>
      {#each nrst as n, i}
        <rect x="798" y={532 + i * 34} width="222" height="30" fill={s.pfd.cursor === i ? C.cyan : 'none'} />
        <text x="806" y={553 + i * 34} fill={s.pfd.cursor === i ? '#001418' : C.cyan} font-size="16">{n.apt.id}</text>
        <text x="880" y={553 + i * 34} fill={s.pfd.cursor === i ? '#001418' : C.white} font-size="15">{d3(n.brg)}° {n.dis.toFixed(1)}NM</text>
      {/each}
    </g>
  {:else if s.pfd.win === 'tmr'}
    <g font-family={FONT}>
      <rect x="794" y="560" width="230" height="110" fill="#0d1a24" stroke={C.cyan} />
      <text x="804" y="584" fill={C.cyan} font-size="15">REFERENCES</text>
      <text x="804" y="624" fill={C.white} font-size="16">MINIMUMS BARO</text>
      <text x="1010" y="654" fill={C.cyan} font-size="20" text-anchor="end">{s.sel.mins == null ? 'OFF' : `${s.sel.mins}FT`}</text>
    </g>
  {/if}
  <Windows {s} gdu="pfd" {menuLabels} />
{/if}

{#if phase !== 'off'}
  <Radios {s} {onpart} prefix="pfd" />
  <g data-part="pfd.navStatus" role="button" tabindex="-1" onclick={tap('pfd.navStatus')} onkeydown={() => {}} font-family={FONT}>
    <rect x="230" y="0" width="564" height="56" fill="#000" stroke="#3c4650" />
    {#if gd.valid && gd.source === 'GPS'}
      <text x="250" y="36" fill={C.magenta} font-size="20">{gd.legFrom ? `${gd.legFrom} → ` : 'D→ '}{gd.id}</text>
      <text x="560" y="36" fill={C.white} font-size="17">DIS <tspan fill={C.magenta}>{gd.dis.toFixed(1)}NM</tspan>  DTK <tspan fill={C.magenta}>{d3(gd.dtk)}°</tspan></text>
    {/if}
  </g>
  <g data-part="pfd.xpdrBox" role="button" tabindex="-1" onclick={tap('pfd.xpdrBox')} onkeydown={() => {}} font-family={FONT}>
    <rect x="794" y="714" width="230" height="28" fill={C.boxBg} stroke="#3c4650" />
    <text x="802" y="734" fill={s.xpdr.mode === 'STBY' ? C.white : C.green} font-size="17">XPDR {s.xpdr.entry != null ? s.xpdr.entry.padEnd(4, '_') : s.xpdr.code} {s.xpdr.ident > 0 ? 'IDNT' : s.xpdr.mode}</text>
  </g>
  <g font-family={FONT}>
    <rect x="0" y="714" width="140" height="28" fill={C.boxBg} stroke="#3c4650" />
    <text x="8" y="734" fill={C.white} font-size="16">OAT {Math.round(15 - (s.ac.alt / 1000) * 2)}°C</text>
  </g>
{/if}

{#if hl}<rect x={hl[0]} y={hl[1]} width={hl[2]} height={hl[3]} fill="none" stroke={C.cyan} stroke-width="4" class="hl" />{/if}
