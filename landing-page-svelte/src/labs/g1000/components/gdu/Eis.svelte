<script>
  // Engine indication system strip of the MFD (C172): ENGINE (RPM dial + bar gauges), LEAN (EGT) or SYSTEM
  // (electrical and fuel). Values derived from the sim; pointers coloured on green/yellow/red bands.
  import { C, FONT } from './layout.js';

  /** @type {{ s: any, onpart: (id: string) => void }} */
  let { s, onpart } = $props();

  const on = $derived(s.power.engine);
  const rpm = $derived(s.ac.rpm);
  const ff = $derived(on ? (s.ac.onGround ? 2.5 : (8.5 * rpm) / 2400) : 0);
  const oilP = $derived(on ? 58 : 0), oilT = $derived(on ? 175 : 70), egt = $derived(on ? 1250 + rpm / 10 : 0);
  const volts = $derived(on ? 28.1 : s.power.master ? 24.2 : 0), amps = $derived(on ? 2 : s.power.master ? -6 : 0);
  /** Horizontal bar gauge: [lo, hi] scale, green band, value. */
  const bars = $derived(
    s.mfd.eis === 'SYSTEM'
      ? [['BUS V', 0, 32, [24, 30], volts, volts.toFixed(1)], ['BATT A', -20, 20, [0, 20], amps, `${amps > 0 ? '+' : ''}${amps}`],
         ['FUEL L', 0, 28, [5, 28], s.ac.fuel / 2, (s.ac.fuel / 2).toFixed(0)], ['FUEL R', 0, 28, [5, 28], s.ac.fuel / 2, (s.ac.fuel / 2).toFixed(0)]]
      : s.mfd.eis === 'LEAN'
        ? [1, 2, 3, 4].map((c) => [`EGT ${c}`, 1000, 1600, [1100, 1500], egt - c * 8, on ? `${Math.round(egt - c * 8)}` : '---'])
        : [['FFLOW GPH', 0, 20, [0, 12], ff, ff.toFixed(1)], ['OIL PRES', 0, 115, [50, 90], oilP, `${oilP}`],
           ['OIL TEMP', 75, 250, [100, 245], oilT, `${oilT}`], ['EGT', 1000, 1600, [1100, 1500], egt, on ? `${Math.round(egt)}` : '---'],
           ['FUEL QTY', 0, 56, [10, 56], s.ac.fuel, s.ac.fuel.toFixed(0)]]
  );
  const ang = (v) => -120 + (Math.max(0, Math.min(2700, v)) / 2700) * 240;
</script>

<g data-part="mfd.eis" role="button" tabindex="-1" onclick={() => onpart('mfd.eis')} onkeydown={() => {}} font-family={FONT}>
  <rect x="0" y="56" width="180" height="686" fill="#05080a" stroke="#3c4650" />
  <text x="90" y="80" fill={C.white} font-size="14" text-anchor="middle">{s.mfd.eis}</text>
  {#if s.mfd.eis === 'ENGINE'}
    <g transform="translate(90 160)">
      <path d="M -62 36 A 72 72 0 1 1 62 36" fill="none" stroke="#3c4650" stroke-width="10" />
      <path d={`M ${72 * Math.sin((ang(2100) * Math.PI) / 180)} ${-72 * Math.cos((ang(2100) * Math.PI) / 180)} A 72 72 0 0 1 ${72 * Math.sin((ang(2700) * Math.PI) / 180)} ${-72 * Math.cos((ang(2700) * Math.PI) / 180)}`} fill="none" stroke={C.green} stroke-width="10" />
      <line x1="0" y1="0" x2="0" y2="-64" stroke={C.white} stroke-width="4" transform={`rotate(${ang(rpm)})`} />
      <text x="0" y="34" fill={C.white} font-size="22" text-anchor="middle">{Math.round(rpm / 10) * 10}</text>
      <text x="0" y="56" fill={C.grey} font-size="12" text-anchor="middle">RPM</text>
    </g>
  {/if}
  {#each bars as [label, lo, hi, [gLo, gHi], v, txt], i}
    {@const y0 = (s.mfd.eis === 'ENGINE' ? 250 : 110) + i * 82}
    {@const sx = (val) => 14 + ((Math.max(lo, Math.min(hi, val)) - lo) / (hi - lo)) * 152}
    <text x="14" y={y0} fill={C.white} font-size="13">{label}</text>
    <text x="166" y={y0} fill={C.white} font-size="15" text-anchor="end">{txt}</text>
    <rect x="14" y={y0 + 14} width="152" height="8" fill="#3c4650" />
    <rect x={sx(gLo)} y={y0 + 14} width={sx(gHi) - sx(gLo)} height="8" fill={C.green} />
    <path d={`M ${sx(v)} ${y0 + 12} l -6 -10 h 12 z`} fill={C.white} />
  {/each}
</g>
