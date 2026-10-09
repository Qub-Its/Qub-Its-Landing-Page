<script>
  // Top-bar NAV (left) and COM (right) boxes shared by PFD and MFD: active/standby, cyan tuning box, green
  // active COM = transmitter, decoded VOR identifier when NAV audio is on and the station is in range.
  import { C, FONT } from './layout.js';
  import { vorByFreq, VOR_RANGE_NM } from '../../lib/world.js';
  import { distNm } from '../../lib/nav.js';

  /** @type {{ s: any, onpart: (id: string) => void, prefix: 'pfd'|'mfd' }} */
  let { s, onpart, prefix } = $props();

  const f2 = (f) => f.toFixed(2), f3 = (f) => f.toFixed(3);
  const ident = (i) => {
    const st = vorByFreq(s.nav[i].act);
    return st && distNm(s.ac, st) <= VOR_RANGE_NM ? st.id : '';
  };
</script>

<g data-part="pfd.navBox" role="button" tabindex="-1" onclick={() => onpart('pfd.navBox')} onkeydown={() => {}}>
  <rect x="0" y="0" width="230" height="56" fill={C.boxBg} stroke="#3c4650" />
  {#each [0, 1] as i}
    {@const y = 22 + i * 26}
    <text x="6" y={y} fill={C.white} font-family={FONT} font-size="13">NAV{i + 1}</text>
    {#if s.navTune === i}<rect x="50" y={y - 17} width="72" height="22" fill="none" stroke={C.cyan} stroke-width="2" />{/if}
    <text x="86" y={y} fill={C.cyan} font-family={FONT} font-size="16" text-anchor="middle">{f2(s.nav[i].stby)}</text>
    <text x="126" y={y} fill={C.white} font-family={FONT} font-size="13">↔</text>
    <text x="142" y={y} fill={s.pfd.cdi === `VOR${i + 1}` ? C.green : C.white} font-family={FONT} font-size="16">{f2(s.nav[i].act)}</text>
    {#if prefix === 'pfd' && s.audio[`nav${i + 1}`] && ident(i)}<text x="226" y={y} fill={C.green} font-family={FONT} font-size="12" text-anchor="end">{ident(i)}</text>{/if}
  {/each}
</g>
<g data-part="pfd.comBox" role="button" tabindex="-1" onclick={() => onpart('pfd.comBox')} onkeydown={() => {}}>
  <rect x="794" y="0" width="230" height="56" fill={C.boxBg} stroke="#3c4650" />
  {#each [0, 1] as i}
    {@const y = 22 + i * 26}
    <text x="798" y={y} fill={s.audio.mic === i ? C.green : C.white} font-family={FONT} font-size="16">{f3(s.com[i].act)}</text>
    <text x="868" y={y} fill={C.white} font-family={FONT} font-size="13">↔</text>
    {#if s.comTune === i}<rect x="884" y={y - 17} width="80" height="22" fill="none" stroke={C.cyan} stroke-width="2" />{/if}
    <text x="924" y={y} fill={C.cyan} font-family={FONT} font-size="16" text-anchor="middle">{f3(s.com[i].stby)}</text>
    <text x="1020" y={y} fill={C.white} font-family={FONT} font-size="12" text-anchor="end">COM{i + 1}</text>
  {/each}
</g>
