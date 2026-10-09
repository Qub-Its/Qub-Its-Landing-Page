<script>
  // Flight Mode Annunciator: 5 columns x 3 rows. Row 1 active (green), row 2 armed (cyan), row 3 messages.
  // A white box surrounds a column's row-1 value for 10 s after it changed.
  import { REGIONS, C } from '../../lib/layout.js';

  /** @type {{ s: import('../../lib/schema.js').FlightState }} */
  let { s } = $props();

  const { w: W, h: H } = REGIONS.fma;
  const COL = W / 5;
  const FS = 18;
  const ROW_Y = [19, 43, 67];     // text baselines
  const BOX = { y: 2, h: 22 };
  const mid = (i) => COL * i + COL / 2;

  const fma = $derived(s.fma);
  const boxed = (/** @type {'athr'|'vertical'|'lateral'|'approach'|'engagement'} */ col) =>
    s.simTime - s.fma.changedAt[col] < 10 && s.simTime >= s.fma.changedAt[col];
  const boxW = (/** @type {string} */ t) => t.length * FS * 0.6 + 10;
</script>

{#snippet box(/** @type {number} */ i, /** @type {string} */ text, /** @type {boolean} */ on)}
  {#if on && text}
    <rect x={mid(i) - boxW(text) / 2} y={BOX.y} width={boxW(text)} height={BOX.h} fill="none" stroke={C.white} stroke-width="2" />
  {/if}
{/snippet}

<g data-part="fma" font-family={C.font} font-size={FS} text-anchor="middle">
  <rect width={W} height={H} fill={C.bg} />
  <g stroke={C.tape} stroke-width="2">
    {#each [1, 2, 3, 4] as i (i)}<line x1={COL * i} y1="0" x2={COL * i} y2={H} />{/each}
    <line x1="0" y1={H - 1} x2={W} y2={H - 1} />
  </g>

  <g data-part="fmaAthr">
    <rect x="0" y="0" width={COL} height={H} fill="transparent" />
    {@render box(0, fma.athr, boxed('athr'))}
    <text x={mid(0)} y={ROW_Y[0]} fill={C.green}>{fma.athr}</text>
  </g>

  <g data-part="fmaVertical">
    <rect x={COL} y="0" width={COL} height={H} fill="transparent" />
    {@render box(1, fma.vertical, boxed('vertical'))}
    <text x={mid(1)} y={ROW_Y[0]} fill={C.green}>{fma.vertical}</text>
    <text x={mid(1)} y={ROW_Y[1]} fill={C.cyan}>{fma.verticalArmed}</text>
  </g>

  <g data-part="fmaLateral">
    <rect x={COL * 2} y="0" width={COL} height={H} fill="transparent" />
    {@render box(2, fma.lateral, boxed('lateral'))}
    <text x={mid(2)} y={ROW_Y[0]} fill={C.green}>{fma.lateral}</text>
    <text x={mid(2)} y={ROW_Y[1]} fill={C.cyan}>{fma.lateralArmed}</text>
  </g>

  {#if fma.message}
    <text x={COL * 1.5} y={ROW_Y[2]} fill={C.amber}>{fma.message}</text>
  {/if}

  <g data-part="fmaApproach">
    <rect x={COL * 3} y="0" width={COL} height={H} fill="transparent" />
    {@render box(3, fma.approach, boxed('approach'))}
    <text x={mid(3)} y={ROW_Y[0]} fill={C.white} font-size="16">{fma.approach}</text>
  </g>

  <g data-part="fmaEngagement">
    <rect x={COL * 4} y="0" width={COL} height={H} fill="transparent" />
    {@render box(4, fma.engagement.ap || fma.engagement.fd, boxed('engagement'))}
    <text x={mid(4)} y={ROW_Y[0]} fill={C.white}>{fma.engagement.ap}</text>
    <text x={mid(4)} y={ROW_Y[1]} fill={C.white}>{fma.engagement.fd}</text>
    <text x={mid(4)} y={ROW_Y[2]} fill={fma.engagement.athrArmed ? C.cyan : C.white}>{fma.engagement.athr}</text>
  </g>
</g>
