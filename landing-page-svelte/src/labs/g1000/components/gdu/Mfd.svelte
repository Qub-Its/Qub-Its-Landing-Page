<script>
  // MFD screen: top bar (radios + navigation data bar), EIS strip, the page of the selected group (MAP navigation
  // map, WPT airport information, AUX system setup / GPS status, NRST airports), the flight plan window, the
  // page-group indicator, Direct-To / MENU windows and the database page during power-up.
  import { C, FONT, REGIONS } from './layout.js';
  import Radios from './Radios.svelte';
  import Eis from './Eis.svelte';
  import NavMap from './NavMap.svelte';
  import Windows from './Windows.svelte';
  import { gduPhase } from '../../lib/sim.js';
  import { guidance } from '../../lib/guidance.js';
  import { GROUPS, PAGES, pageId, mfdField, wptAirport, nrstAirport } from '../../lib/pages.js';
  import { nearest, byId } from '../../lib/world.js';
  import { editValue } from '../../lib/avionics.js';
  import { distNm, brgDeg } from '../../lib/nav.js';

  /** @type {{ s: any, highlight: string|null, onpart: (id: string) => void, menuLabels: Record<string, string> }} */
  let { s, highlight, onpart, menuLabels } = $props();

  const phase = $derived(gduPhase(s, 'mfd'));
  const page = $derived(pageId(s));
  const field = $derived(mfdField(s));
  const gd = $derived(guidance(s));
  const TITLES = { MAP_NAV: 'MAP - NAVIGATION MAP', WPT_APT: 'WPT - AIRPORT INFORMATION', AUX_SETUP: 'AUX - SYSTEM SETUP', AUX_GPS: 'AUX - GPS STATUS', NRST_APT: 'NRST - NEAREST AIRPORTS' };
  const d3 = (v) => String(Math.round(((v % 360) + 360) % 360)).padStart(3, '0');
  const sel = (f) => field === f;
  const ete = $derived(gd.valid && s.ac.gs > 30 ? gd.dis / s.ac.gs : null);
  const fmtEte = (h) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  const tap = (id) => () => onpart(id);
  const hl = $derived(highlight && REGIONS[highlight] ? REGIONS[highlight] : null);
  const wptEdit = $derived(s.edit?.target === 'wpt' ? editValue(s.edit) : null);
  const fplEdit = $derived(s.edit?.target === 'fpl' ? editValue(s.edit) : null);
  const apt = $derived(wptAirport(s));
  const nrst = $derived(nearest(s.ac));
  const nApt = $derived(nrstAirport(s));
  const legs = $derived(s.gps.fpl.legs);
</script>

{#if phase === 'off'}
  <rect width="1024" height="742" fill="#000" />
{:else if phase === 'boot'}
  <rect width="1024" height="742" fill="#000" />
  <text x="512" y="380" fill={C.grey} font-family={FONT} font-size="18" text-anchor="middle">INITIALIZING SYSTEM</text>
{:else if phase === 'db'}
  <g font-family={FONT}>
    <rect width="1024" height="742" fill="#000" />
    <text x="512" y="240" fill={C.white} font-size="30" text-anchor="middle">G1000</text>
    <text x="512" y="320" fill={C.white} font-size="18" text-anchor="middle">NAVIGATION DATABASE  CYCLE 2610</text>
    <text x="512" y="350" fill={C.green} font-size="18" text-anchor="middle">EFFECTIVE 01-OCT-26   EXPIRES 29-OCT-26</text>
    <text x="512" y="380" fill={C.white} font-size="16" text-anchor="middle">TERRAIN · OBSTACLE · SAFETAXI — DEMO DATA</text>
    <text x="512" y="460" fill={C.cyan} font-size="22" text-anchor="middle">PRESS ENT TO CONTINUE</text>
  </g>
{:else}
  <Eis {s} {onpart} />
  <g data-part="mfd.page" role="button" tabindex="-1" onclick={tap('mfd.page')} onkeydown={() => {}} font-family={FONT}>
    <rect x="180" y="56" width="844" height="28" fill="#0b1720" stroke="#3c4650" />
    <text x="602" y="76" fill={C.white} font-size="16" text-anchor="middle">{TITLES[page]}</text>
  </g>

  {#if page === 'MAP_NAV'}
    <g data-part="mfd.map" role="button" tabindex="-1" onclick={tap('mfd.map')} onkeydown={() => {}}>
      <NavMap {s} x={180} y={84} w={844} h={606} range={s.mfd.range} orient={s.mfd.orient} topo={s.mfd.topo} dcltr={s.mfd.dcltr} />
    </g>
  {:else if page === 'WPT_APT'}
    <g font-family={FONT} font-size="18">
      <rect x={200} y={100} width={150} height={34} fill={sel('ident') ? C.cyan : 'none'} stroke={C.cyan} />
      <text x={212} y={124} fill={sel('ident') ? '#001418' : C.cyan} font-size="22">{wptEdit ?? apt.id}</text>
      <text x={370} y={124} fill={C.white}>{apt.name}</text>
      <text x={212} y={170} fill={C.grey}>ELEVATION</text><text x={420} y={170} fill={C.white}>{apt.elev}FT</text>
      <text x={212} y={200} fill={C.grey}>RUNWAY</text><text x={420} y={200} fill={C.white}>{apt.rwys.map((r) => `${r.id}  ${r.len}FT`).join('   ')}</text>
      <text x={212} y={230} fill={C.grey}>BRG / DIS</text><text x={420} y={230} fill={C.white}>{d3(brgDeg(s.ac, apt))}°  {distNm(s.ac, apt).toFixed(1)}NM</text>
      <text x={212} y={280} fill={C.cyan} font-size="16">FREQUENCIES</text>
      {#each apt.freqs as f, i}
        <rect x={206} y={292 + i * 34} width={300} height={30} fill={sel(`f${i}`) ? C.cyan : 'none'} />
        <text x={214} y={313 + i * 34} fill={sel(`f${i}`) ? '#001418' : C.white}>{f.type}</text>
        <text x={420} y={313 + i * 34} fill={sel(`f${i}`) ? '#001418' : C.cyan}>{f.f.toFixed(3)}</text>
      {/each}
    </g>
  {:else if page === 'AUX_SETUP'}
    <g font-family={FONT} font-size="18" fill={C.white}>
      <text x={212} y={130}>DATE / TIME   LOCAL 24HR</text>
      <text x={212} y={170}>DISPLAY UNITS   NM · KT · FT · IN</text>
      <text x={212} y={210}>MFD DATA BAR   GS · DTK · TRK · ETE</text>
      <text x={212} y={250} fill={C.grey}>(read-only in this course)</text>
    </g>
  {:else if page === 'AUX_GPS'}
    <g font-family={FONT} font-size="18">
      <text x={212} y={130} fill={C.white}>GPS 1   <tspan fill={C.green}>3D DIFF NAV</tspan>   SBAS WAAS</text>
      <text x={212} y={165} fill={C.white}>EPU 0.01NM   HFOM 9FT   VFOM 14FT</text>
      {#each Array(12) as _, i}
        <rect x={220 + i * 60} y={480 - (40 + ((i * 37) % 60)) * 3} width="36" height={(40 + ((i * 37) % 60)) * 3} fill={i < 10 ? C.cyan : C.grey} />
        <text x={238 + i * 60} y={504} fill={C.white} font-size="13" text-anchor="middle">{[2, 5, 6, 9, 12, 15, 17, 19, 24, 25, 46, 48][i]}</text>
      {/each}
    </g>
  {:else if page === 'NRST_APT'}
    <g font-family={FONT} font-size="18">
      {#each nrst as n, i}
        <rect x={200} y={96 + i * 36} width={560} height={32} fill={sel(`a${i}`) ? C.cyan : s.mfd.nrstSel === i ? '#163042' : 'none'} />
        <text x={210} y={118 + i * 36} fill={sel(`a${i}`) ? '#001418' : C.cyan}>{n.apt.id}</text>
        <text x={300} y={118 + i * 36} fill={sel(`a${i}`) ? '#001418' : C.white}>{d3(n.brg)}°  {n.dis.toFixed(1)}NM  {n.apt.rwys[0].len}FT</text>
      {/each}
      <text x={210} y={310} fill={C.cyan} font-size="16">{nApt.id} {nApt.name} — FREQUENCIES</text>
      {#each nApt.freqs as f, i}
        <rect x={204} y={322 + i * 34} width={300} height={30} fill={sel(`f${i}`) ? C.cyan : 'none'} />
        <text x={212} y={343 + i * 34} fill={sel(`f${i}`) ? '#001418' : C.white}>{f.type}</text>
        <text x={420} y={343 + i * 34} fill={sel(`f${i}`) ? '#001418' : C.cyan}>{f.f.toFixed(3)}</text>
      {/each}
    </g>
  {/if}

  {#if s.mfd.win === 'fpl'}
    <g data-part="mfd.fpl" role="button" tabindex="-1" onclick={tap('mfd.fpl')} onkeydown={() => {}} font-family={FONT} font-size="17">
      <rect x="664" y="84" width="360" height="386" fill="#0d1a24" stroke={C.cyan} />
      <text x="844" y="106" fill={C.cyan} text-anchor="middle">ACTIVE FLIGHT PLAN</text>
      <text x="676" y="132" fill={C.grey} font-size="14">WAYPOINT</text><text x="860" y="132" fill={C.grey} font-size="14">DTK</text><text x="1010" y="132" fill={C.grey} font-size="14" text-anchor="end">DIS</text>
      {#each [...legs, null] as id, i}
        {@const yy = 160 + i * 32}
        {@const prev = i > 0 && id ? byId(legs[i - 1]) : null}
        {@const cur = id ? byId(id) : null}
        {@const editing = sel(`r${i}`) && !!fplEdit}
        {@const hot = sel(`r${i}`) && !fplEdit}
        <rect x="670" y={yy - 22} width="348" height="28" fill={hot ? C.cyan : 'none'} stroke={editing ? C.cyan : 'none'} />
        {#if editing}
          <text x="690" y={yy} fill={C.cyan}>{fplEdit}_</text>
        {:else if id}
          {#if i === s.gps.fpl.active}<text x="672" y={yy} fill={C.magenta}>➜</text>{/if}
          <text x="690" y={yy} fill={hot ? '#001418' : C.white}>{id}</text>
          {#if prev && cur}
            <text x="860" y={yy} fill={hot ? '#001418' : C.white}>{d3(brgDeg(prev, cur))}°</text>
            <text x="1010" y={yy} fill={hot ? '#001418' : C.white} text-anchor="end">{distNm(prev, cur).toFixed(1)}</text>
          {/if}
        {:else}
          <text x="690" y={yy} fill={hot ? '#001418' : C.grey}>_____</text>
        {/if}
      {/each}
      {#if s.confirm}
        <rect x="690" y="410" width="310" height="44" fill="#000" stroke={C.amber} />
        <text x="845" y="438" fill={C.amber} text-anchor="middle">DELETE {legs[s.confirm.idx]}? ENT</text>
      {/if}
    </g>
  {/if}

  <g data-part="mfd.pageGroup" role="button" tabindex="-1" onclick={tap('mfd.pageGroup')} onkeydown={() => {}} font-family={FONT}>
    <rect x="864" y="690" width="160" height="52" fill="#05080a" stroke="#3c4650" />
    {#each GROUPS as grp, i}
      <text x={874 + i * 38} y="710" fill={grp === s.mfd.group ? C.cyan : C.grey} font-size="12">{grp}</text>
    {/each}
    {#each PAGES[s.mfd.group] as _, i}
      <rect x={874 + i * 18} y="720" width="12" height="12" fill={i === s.mfd.page ? C.cyan : 'none'} stroke={C.cyan} />
    {/each}
  </g>
  <Windows {s} gdu="mfd" {menuLabels} />
{/if}

{#if phase !== 'off'}
  <Radios {s} {onpart} prefix="mfd" />
  <g font-family={FONT} font-size="16">
    <rect x="230" y="0" width="564" height="56" fill="#000" stroke="#3c4650" />
    <text x="246" y="34" fill={C.white}>GS <tspan fill={C.magenta}>{Math.round(s.ac.gs)}KT</tspan></text>
    <text x="376" y="34" fill={C.white}>DTK <tspan fill={C.magenta}>{gd.valid ? `${d3(gd.dtk)}°` : '___°'}</tspan></text>
    <text x="516" y="34" fill={C.white}>TRK <tspan fill={C.magenta}>{d3(s.ac.trk)}°</tspan></text>
    <text x="656" y="34" fill={C.white}>ETE <tspan fill={C.magenta}>{ete != null ? fmtEte(ete) : '__:__'}</tspan></text>
  </g>
{/if}

{#if hl}<rect x={hl[0]} y={hl[1]} width={hl[2]} height={hl[3]} fill="none" stroke={C.cyan} stroke-width="4" class="hl" />{/if}
