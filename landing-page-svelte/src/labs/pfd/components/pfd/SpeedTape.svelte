<script module>
  let seq = 0;
</script>

<script>
  // Airspeed tape (A320 style): grey moving scale, yellow reference line + readout window, trend arrow,
  // target speed, VLS / Valpha prot / Valpha max / VMAX strips, green dot, S/F/V1 marks and the Mach readout.
  // Ticks are generated only for the visible range around a rounded base speed; the live speed only moves
  // them with a transform, so a 30 Hz state update touches a handful of attributes.
  import { REGIONS, CY, C, FONT, PX_PER_KT, clamp } from '../../lib/layout.js';

  /** @type {{ s: import('../../lib/schema.js').FlightState }} */
  let { s } = $props();

  const uid = `spd${++seq}`;
  const R = REGIONS.speed;
  const M = REGIONS.mach;
  const TAPE_L = R.x;          // 40
  const TAPE_R = 93;           // right edge of the grey tape (ticks hang from here)
  const STRIP_W = 8;           // width of VLS / barber / red strips, just right of the tape
  const SYM_X = 110;           // x of green dot / S / F / V1 symbols
  const FAR = 1200;            // strips extend "to infinity"; the clipPath trims them
  const OFF = 150;             // |dy| beyond which a target counts as off-scale

  /** Rounded speed the tick set is built around; changes only every 10 kt. */
  const base = $derived(Math.round(s.ias / 10) * 10);
  /** Pixel shift of the whole tick group relative to its base frame. */
  const shift = $derived((s.ias - base) * PX_PER_KT);
  /** @param {number} v speed (kt) @returns {number} y in the base frame */
  const yOf = (v) => CY - (v - base) * PX_PER_KT;

  const ticks = $derived.by(() => {
    /** @type {{v: number, y: number, label: boolean}[]} */
    const out = [];
    for (let v = base - 50; v <= base + 50; v += 10) {
      if (v < 30) continue;
      out.push({ v, y: yOf(v), label: v % 20 === 0 });
    }
    return out;
  });

  const sp = $derived(s.speeds);

  const vlsStrip = $derived(sp.vls == null ? null : { y: yOf(sp.vls), h: Math.max(0, yOf(sp.vaProt ?? sp.vls - 10) - yOf(sp.vls)) });
  const vaProtStrip = $derived(
    sp.vaProt == null ? null : { y: yOf(sp.vaProt), h: Math.max(0, yOf(sp.vaMax ?? sp.vaProt - 10) - yOf(sp.vaProt)) }
  );
  const vaMaxY = $derived(sp.vaMax == null ? null : yOf(sp.vaMax));
  const vmaxY = $derived(sp.vmax == null ? null : yOf(sp.vmax));
  const gdY = $derived(sp.greenDot == null ? null : yOf(sp.greenDot));
  const sY = $derived(sp.s == null ? null : yOf(sp.s));
  const fY = $derived(sp.f == null ? null : yOf(sp.f));
  const v1Y = $derived(sp.v1 == null ? null : yOf(sp.v1));

  // Target: when the FCU is in Mach, convert to IAS with the current IAS/Mach ratio (good enough locally).
  const tgt = $derived(s.fcu.spdIsMach ? (s.mach > 0.01 ? (s.ias * s.fcu.mach) / s.mach : s.ias) : s.fcu.spd);
  const tgtDy = $derived((tgt - s.ias) * PX_PER_KT);   // + = above the reference line
  const tgtOff = $derived(Math.abs(tgtDy) > OFF);
  const tgtColor = $derived(s.fcu.spdManaged ? C.magenta : C.cyan);
  const tgtText = $derived(
    s.fcu.spdIsMach ? '.' + String(Math.round(s.fcu.mach * 100)).padStart(2, '0') : String(Math.round(s.fcu.spd))
  );
  const tgtTop = $derived(tgtDy > 0);

  const trendLen = $derived(clamp(s.iasTrend * PX_PER_KT, -OFF, OFF));
  const showTrend = $derived(Math.abs(s.iasTrend) >= 2);

  const readout = $derived(s.ias < 30 ? '---' : String(Math.round(s.ias)));
  const readColor = $derived(
    (sp.vls != null && s.ias < sp.vls) || (sp.vmax != null && s.ias > sp.vmax) ? C.amber : C.green
  );

  const machText = $derived(
    s.mach < 1 ? '.' + String(Math.round(s.mach * 100)).padStart(2, '0') : s.mach.toFixed(2)
  );
</script>

<defs>
  <clipPath id="{uid}-clip"><rect x={R.x} y={R.y} width={R.w} height={R.h} /></clipPath>
  <pattern id="{uid}-red" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
    <rect width="12" height="12" fill={C.bg} />
    <rect width="6" height="12" fill={C.red} />
  </pattern>
  <pattern id="{uid}-amb" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
    <rect width="12" height="12" fill={C.bg} />
    <rect width="6" height="12" fill={C.amber} />
  </pattern>
</defs>

<g data-part="speedTape">
  <g clip-path="url(#{uid}-clip)">
    <rect x={TAPE_L} y={R.y} width={TAPE_R - TAPE_L} height={R.h} fill={C.tape} />

    <!-- everything that scrolls with the speed lives in one translated group -->
    <g transform="translate(0 {shift})">
      {#each ticks as t (t.v)}
        <line x1={TAPE_R} x2={t.label ? TAPE_R - 14 : TAPE_R - 8} y1={t.y} y2={t.y} stroke={C.white} stroke-width="2" />
        {#if t.label}
          <text x={TAPE_R - 20} y={t.y} text-anchor="end" dominant-baseline="central" fill={C.white} font-size={FONT.normal}>{t.v}</text>
        {/if}
      {/each}

      {#if vlsStrip}
        <g data-part="vls">
          <rect x={TAPE_R} y={vlsStrip.y} width={STRIP_W} height={vlsStrip.h} fill={C.amber} />
        </g>
      {/if}
      {#if vaProtStrip}
        <g data-part="vaProt">
          <rect x={TAPE_R} y={vaProtStrip.y} width={STRIP_W} height={vaProtStrip.h} fill="url(#{uid}-amb)" />
        </g>
      {/if}
      {#if vaMaxY != null}
        <g data-part="vaMax">
          <rect x={TAPE_R} y={vaMaxY} width={STRIP_W} height={FAR} fill={C.red} />
        </g>
      {/if}
      {#if vmaxY != null}
        <g data-part="vmax">
          <rect x={TAPE_R} y={vmaxY - FAR} width={STRIP_W} height={FAR} fill="url(#{uid}-red)" />
          <line x1={TAPE_R} x2={TAPE_R + STRIP_W} y1={vmaxY} y2={vmaxY} stroke={C.red} stroke-width="2" />
        </g>
      {/if}

      {#if gdY != null}
        <g data-part="greenDot">
          <circle cx={SYM_X} cy={gdY} r="5" fill="none" stroke={C.green} stroke-width="2.5" />
        </g>
      {/if}
      {#if sY != null || fY != null}
        <g data-part="sfSpeeds">
          {#if sY != null}
            <text x={SYM_X} y={sY} text-anchor="middle" dominant-baseline="central" fill={C.green} font-size={FONT.normal} font-weight="bold">S</text>
          {/if}
          {#if fY != null}
            <text x={SYM_X} y={fY} text-anchor="middle" dominant-baseline="central" fill={C.green} font-size={FONT.normal} font-weight="bold">F</text>
          {/if}
        </g>
      {/if}
      {#if v1Y != null}
        <g data-part="v1">
          <text x={SYM_X} y={v1Y} text-anchor="middle" dominant-baseline="central" fill={C.cyan} font-size={FONT.normal} font-weight="bold">1</text>
        </g>
      {/if}
    </g>

    <!-- trend arrow (absolute frame: tip = predicted speed in 10 s) -->
    {#if showTrend}
      <g data-part="speedTrend">
        <rect x={TAPE_R - 12} y={Math.min(CY, CY - trendLen)} width="14" height={Math.abs(trendLen)} fill="transparent" />
        <line x1="88" x2="88" y1={CY} y2={CY - trendLen + (trendLen > 0 ? 5 : -5)} stroke={C.yellow} stroke-width="3" />
        <polygon
          points={trendLen > 0
            ? `88,${CY - trendLen} 82,${CY - trendLen + 10} 94,${CY - trendLen + 10}`
            : `88,${CY - trendLen} 82,${CY - trendLen - 10} 94,${CY - trendLen - 10}`}
          fill={C.yellow}
        />
      </g>
    {/if}

    <!-- target speed -->
    <g data-part="speedTarget">
      {#if !tgtOff}
        <polygon
          points="{TAPE_R + STRIP_W + 1},{CY - tgtDy} {TAPE_R + STRIP_W + 13},{CY - tgtDy - 7} {TAPE_R + STRIP_W + 13},{CY - tgtDy + 7}"
          fill={C.bg} stroke={tgtColor} stroke-width="2.5" stroke-linejoin="round"
        />
      {:else}
        <rect x={TAPE_L} y={tgtTop ? R.y : R.y + R.h - 22} width={TAPE_R - TAPE_L + STRIP_W} height="22" fill={C.bg} />
        <text x="62" y={tgtTop ? R.y + 11 : R.y + R.h - 11} text-anchor="middle" dominant-baseline="central" fill={tgtColor} font-size={FONT.normal}>{tgtText}</text>
        <polygon
          points={tgtTop
            ? `${TAPE_R + 4},${R.y + 15} ${TAPE_R + 10},${R.y + 6} ${TAPE_R + 16},${R.y + 15}`
            : `${TAPE_R + 4},${R.y + R.h - 15} ${TAPE_R + 10},${R.y + R.h - 6} ${TAPE_R + 16},${R.y + R.h - 15}`}
          fill={tgtColor}
        />
      {/if}
    </g>

    <!-- readout window + yellow reference line pointing to the sphere -->
    <g data-part="speedReadout">
      <rect x={TAPE_L} y={CY - 16} width={TAPE_R + STRIP_W - TAPE_L + 2} height="32" fill={C.bg} stroke={C.yellow} stroke-width="2.5" />
      <text x={TAPE_R + STRIP_W - 6} y={CY + 1} text-anchor="end" dominant-baseline="central" fill={readColor} font-size={FONT.large} font-weight="bold">{readout}</text>
      <line x1={TAPE_R + STRIP_W + 2} x2={R.x + R.w} y1={CY} y2={CY} stroke={C.yellow} stroke-width="3.5" />
      <polygon points="{R.x + R.w - 12},{CY - 7} {R.x + R.w},{CY} {R.x + R.w - 12},{CY + 7}" fill={C.yellow} />
    </g>
  </g>
</g>

{#if s.mach >= 0.5}
  <g data-part="mach">
    <text x={TAPE_L + (TAPE_R - TAPE_L) / 2} y={M.y + M.h / 2} text-anchor="middle" dominant-baseline="central" fill={C.green} font-size={FONT.large} font-weight="bold">{machText}</text>
  </g>
{/if}
