<script>
  // Attitude sphere, pitch ladder, fixed bank scale with roll pointer + sideslip index, protection marks,
  // aircraft symbol and flight director bars. Region: REGIONS.attitude; aircraft symbol at (CX, CY).
  import { REGIONS, CX, CY, PX_PER_DEG_PITCH as K, C, FONT, clamp } from '../../lib/layout.js';

  /** @type {{ s: import('../../lib/schema.js').FlightState }} */
  let { s } = $props();

  const CLIP_ID = 'pfd-attitude-clip';
  const R = 148; // radius of the bank scale arc, centred on the aircraft symbol

  // Sphere window: rectangle with chamfered corners (Airbus shape).
  const { x: X0, y: Y0, w: W, h: H } = REGIONS.attitude;
  const X1 = X0 + W, Y1 = Y0 + H, CT = 30, CB = 62;
  const clipPoints = [
    [X0 + CT, Y0], [X1 - CT, Y0], [X1, Y0 + CT], [X1, Y1 - CB],
    [X1 - CB, Y1], [X0 + CB, Y1], [X0, Y1 - CB], [X0, Y0 + CT]
  ].map((p) => p.join(',')).join(' ');

  /** Point on the bank arc at `deg` from the top, radius r. */
  const arcPt = (deg, r) => {
    const a = (deg * Math.PI) / 180;
    return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
  };
  const f = (n) => n.toFixed(1);

  // Static bank scale: arc ±60°, ticks outward at 10/20/30/45/60 (long at 0).
  const arcPath = (() => {
    const [x0, y0] = arcPt(-60, R), [x1, y1] = arcPt(60, R);
    return `M${f(x0)} ${f(y0)}A${R} ${R} 0 0 1 ${f(x1)} ${f(y1)}`;
  })();
  const ticksPath = (() => {
    let d = '';
    for (const [deg, len] of [[0, 12], [10, 8], [20, 8], [30, 12], [45, 12], [60, 12]]) {
      for (const sg of deg === 0 ? [1] : [1, -1]) {
        const [x0, y0] = arcPt(sg * deg, R), [x1, y1] = arcPt(sg * deg, R + len);
        d += `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
      }
    }
    return d;
  })();

  // Sphere transform: the horizon turns against the bank and slides down with pitch up.
  const sphereT = $derived(`rotate(${-s.bank} ${CX} ${CY}) translate(0 ${s.pitch * K})`);
  const pointerT = $derived(`rotate(${-s.bank} ${CX} ${CY})`);

  // Ladder is drawn in the sphere frame; it only needs rebuilding when the pitch crosses a 2.5° step.
  const centreIdx = $derived(Math.round(s.pitch / 2.5));
  const ladder = $derived.by(() => {
    let d10 = '', d5 = '', d25 = '';
    /** @type {{p: number, y: number}[]} */
    const labels = [];
    const lo = Math.max(-36, centreIdx - 14), hi = Math.min(36, centreIdx + 14);
    for (let k = lo; k <= hi; k++) {
      if (k === 0) continue;
      const y = CY - k * 2.5 * K;
      if (k % 4 === 0) { d10 += `M${CX - 40} ${y}H${CX + 40}`; labels.push({ p: Math.abs(k * 2.5), y }); }
      else if (k % 2 === 0) d5 += `M${CX - 20} ${y}H${CX + 20}`;
      else d25 += `M${CX - 10} ${y}H${CX + 10}`;
    }
    const marks = [30, -15].filter((p) => Math.abs(p / 2.5 - centreIdx) <= 14).map((p) => CY - p * K);
    return { d10, d5, d25, labels, marks };
  });

  // Flight director bars (deviation from the aircraft symbol).
  const fdY = $derived(CY - clamp(s.fd.pitch * K, -110, 110));
  const fdX = $derived(CX + clamp(s.fd.roll * 4, -100, 100));
</script>

<defs>
  <clipPath id={CLIP_ID}><polygon points={clipPoints} /></clipPath>
</defs>

<g data-part="attitude">
  <g clip-path="url(#{CLIP_ID})">
    <g transform={sphereT}>
      <rect x={CX - 520} y={CY - 700} width="1040" height="700" fill={C.sky} />
      <rect x={CX - 520} y={CY} width="1040" height="700" fill={C.ground} />
      <line x1={CX - 520} y1={CY} x2={CX + 520} y2={CY} stroke={C.white} stroke-width="2" />

      <g data-part="pitchLadder" stroke={C.white} stroke-width="2" fill="none">
        <path d={ladder.d10 + ladder.d5 + ladder.d25} stroke="transparent" stroke-width="10" />
        <path d={ladder.d10} />
        <path d={ladder.d5} />
        <path d={ladder.d25} />
        {#each ladder.labels as l (l.y)}
          <g fill={C.white} stroke="none" font-size={FONT.small} font-family={C.font}>
            <text x={CX - 46} y={l.y + 4.5} text-anchor="end">{l.p}</text>
            <text x={CX + 46} y={l.y + 4.5} text-anchor="start">{l.p}</text>
          </g>
        {/each}
      </g>

      <g data-part="protections" stroke={C.green} stroke-width="2.5" fill="none">
        {#each ladder.marks as y (y)}
          <path d="M{CX - 92} {y - 2.5}h22M{CX - 92} {y + 2.5}h22M{CX + 70} {y - 2.5}h22M{CX + 70} {y + 2.5}h22" />
        {/each}
      </g>
    </g>
  </g>

  <!-- Bank scale turns with the horizon; roll index + sideslip trapezoid are fixed (aircraft-referenced) -->
  <g data-part="bankScale">
   <g clip-path="url(#{CLIP_ID})"><g transform={pointerT}>
    <path d={arcPath} fill="none" stroke="transparent" stroke-width="16" />
    <path d={arcPath} fill="none" stroke={C.white} stroke-width="2" />
    <path d={ticksPath} fill="none" stroke={C.white} stroke-width="2" />
    <g stroke={C.green} stroke-width="2.5" fill="none" data-part="protections">
      {#each [-67, 67] as b (b)}
        <path transform="rotate({b} {CX} {CY})" d="M{CX - 7} {CY - R - 3.5}h14M{CX - 7} {CY - R + 1.5}h14" />
      {/each}
    </g>
   </g></g>
    <g>
      <polygon points="{CX},{CY - R + 1} {CX - 8},{CY - R + 15} {CX + 8},{CY - R + 15}" fill={C.yellow} stroke={C.bg} stroke-width="1" />
      <g data-part="sideslip">
        <polygon points="{CX - 7},{CY - R + 18} {CX + 7},{CY - R + 18} {CX + 10},{CY - R + 25} {CX - 10},{CY - R + 25}" fill={C.yellow} stroke={C.bg} stroke-width="1" />
      </g>
    </g>
  </g>

  <!-- Flight director bars -->
  {#if s.fd.show}
    <g data-part="fdBars" fill={C.green} stroke={C.bg} stroke-width="1.2">
      <rect x={CX - 62} y={fdY - 2.5} width="124" height="5" rx="1" />
      <rect x={fdX - 2.5} y={CY - 56} width="5" height="112" rx="1" />
    </g>
  {/if}

  <!-- Aircraft symbol: yellow with black outline -->
  <g data-part="aircraftSymbol" fill={C.yellow} stroke={C.bg} stroke-width="2.5" stroke-linejoin="miter" paint-order="stroke">
    <polygon points="{CX - 98},{CY - 4.5} {CX - 46},{CY - 4.5} {CX - 46},{CY + 14} {CX - 55},{CY + 14} {CX - 55},{CY + 4.5} {CX - 98},{CY + 4.5}" />
    <polygon points="{CX + 98},{CY - 4.5} {CX + 46},{CY - 4.5} {CX + 46},{CY + 14} {CX + 55},{CY + 14} {CX + 55},{CY + 4.5} {CX + 98},{CY + 4.5}" />
    <rect x={CX - 4.5} y={CY - 4.5} width="9" height="9" />
  </g>
</g>
