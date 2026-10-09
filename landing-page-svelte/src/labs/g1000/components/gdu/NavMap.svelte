<script>
  // Moving map (MFD navigation map and PFD inset): airports, VORs, fixes, flight plan (white) with the active leg
  // and Direct-To in magenta, aircraft symbol, range ring. North Up or Track Up; centred on the aircraft or on the
  // pan point. Local flat projection around the centre (fine at these ranges).
  import { C, FONT } from './layout.js';
  import { AIRPORTS, VORS, FIXES, byId } from '../../lib/world.js';
  import { gpsTarget } from '../../lib/guidance.js';

  /** @type {{ s: any, x: number, y: number, w: number, h: number, range: number, orient: 'north'|'track', topo?: boolean, dcltr?: number, small?: boolean }} */
  let { s, x, y, w, h, range, orient, topo = true, dcltr = 0, small = false } = $props();

  const center = $derived(!small && s.mfd.pan ? s.mfd.pan : s.ac);
  const ppn = $derived(h / 2 / range); // pixels per NM
  const rot = $derived(orient === 'track' ? s.ac.trk : 0);
  /** Position → screen point (y down), rotated for Track Up. */
  function proj(p) {
    const dx = (p.lon - center.lon) * 60 * Math.cos((center.lat * Math.PI) / 180) * ppn;
    const dy = (p.lat - center.lat) * 60 * ppn;
    const a = (-rot * Math.PI) / 180;
    return [x + w / 2 + dx * Math.cos(a) - dy * Math.sin(a), y + h / 2 - (dx * Math.sin(a) + dy * Math.cos(a))];
  }
  const acPt = $derived(proj(s.ac));
  const legs = $derived(s.gps.fpl.legs.map(byId).filter(Boolean));
  const tg = $derived(gpsTarget(s));
  const fs = $derived(small ? 11 : 14);
  const clipId = `clip-${Math.random().toString(36).slice(2)}`;
</script>

<defs><clipPath id={clipId}><rect {x} {y} width={w} height={h} /></clipPath></defs>
<g clip-path={`url(#${clipId})`}>
  <rect {x} {y} width={w} height={h} fill={topo ? '#08243d' : '#000'} />
  {#if topo}
    {#each AIRPORTS as a}{@const [px, py] = proj(a)}<circle cx={px} cy={py} r={Math.max(6, 5 * ppn)} fill="#3a4a26" />{/each}
  {/if}
  <circle cx={x + w / 2} cy={y + h / 2} r={h / 4} fill="none" stroke={C.grey} stroke-dasharray="4 6" />
  <text x={x + w / 2 + h / 4 * 0.7} y={y + h / 2 - h / 4 * 0.7} fill={C.grey} font-family={FONT} font-size={fs}>{range / 2}</text>
  {#each legs as l, i}
    {#if i > 0}
      {@const [ax, ay] = proj(legs[i - 1])}{@const [bx, by] = proj(l)}
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={i === s.gps.fpl.active && !s.gps.dto ? C.magenta : C.white} stroke-width={small ? 2 : 3} />
    {/if}
  {/each}
  {#if s.gps.dto && tg}
    {@const [ax, ay] = proj(s.gps.dto.from)}{@const [bx, by] = proj(tg.to)}
    <line x1={ax} y1={ay} x2={bx} y2={by} stroke={C.magenta} stroke-width={small ? 2 : 3} />
  {/if}
  {#if dcltr < 3}
    {#each VORS as v}{@const [px, py] = proj(v)}
      <path d={`M ${px - 7} ${py} l 3.5 -6 h 7 l 3.5 6 l -3.5 6 h -7 z`} fill="none" stroke={C.cyan} stroke-width="2" />
      {#if dcltr < 1}<text x={px + 10} y={py - 8} fill={C.cyan} font-family={FONT} font-size={fs}>{v.id}</text>{/if}
    {/each}
  {/if}
  {#if dcltr < 2}
    {#each FIXES as f}{@const [px, py] = proj(f)}
      <path d={`M ${px} ${py - 6} l 6 10 h -12 z`} fill="none" stroke={C.white} stroke-width="1.5" />
      {#if dcltr < 1}<text x={px + 8} y={py - 6} fill={C.white} font-family={FONT} font-size={fs - 2}>{f.id}</text>{/if}
    {/each}
  {/if}
  {#each AIRPORTS as a}{@const [px, py] = proj(a)}
    <circle cx={px} cy={py} r="7" fill="none" stroke={C.white} stroke-width="2" />
    <line x1={px - 5} y1={py + 5} x2={px + 5} y2={py - 5} stroke={C.white} stroke-width="2" />
    <text x={px + 10} y={py + 5} fill={C.white} font-family={FONT} font-size={fs}>{a.id}</text>
  {/each}
  <g transform={`translate(${acPt[0]} ${acPt[1]}) rotate(${s.ac.hdg - rot})`}>
    <path d="M 0 -14 L 3 -4 L 14 2 L 14 5 L 3 2 L 2 10 L 6 13 L 6 15 L 0 13 L -6 15 L -6 13 L -2 10 L -3 2 L -14 5 L -14 2 L -3 -4 Z" fill={C.white} stroke="#000" />
  </g>
  {#if !small}<text x={x + 8} y={y + 20} fill={C.white} font-family={FONT} font-size="14">{orient === 'north' ? 'NORTH UP' : 'TRACK UP'}{s.mfd.pan ? '  PAN' : ''}</text>{/if}
  <rect x={x + w - (small ? 52 : 76)} y={y + h - (small ? 22 : 30)} width={small ? 48 : 70} height={small ? 18 : 24} fill="#000" stroke={C.white} />
  <text x={x + w - (small ? 28 : 41)} y={y + h - (small ? 8 : 12)} fill={C.white} font-family={FONT} font-size={fs} text-anchor="middle">{range}NM</text>
</g>
