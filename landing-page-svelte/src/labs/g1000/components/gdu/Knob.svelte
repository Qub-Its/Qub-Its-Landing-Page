<script>
  // One bezel knob (single or dual concentric) in bezel SVG coordinates. Drag up/down or wheel over a ring to
  // turn it (outer ring = outside the inner radius); tap the centre to push; tap the outer ring to open the touch
  // pad. Keyboard when focused: ↑/↓ inner ring, Shift+↑/↓ outer, Enter/Space push.
  import { C, FONT } from './layout.js';

  /**
   * @type {{ x: number, y: number, dual: boolean, label: string, part: string, flash?: boolean, highlight?: boolean,
   *   onturn: (ring: 'outer'|'inner', d: number) => void, onpush: () => void, onselect: () => void, onexplain?: () => boolean }}
   */
  let { x, y, dual, label, part, flash = false, highlight = false, onturn, onpush, onselect, onexplain = () => false } = $props();

  const R_OUT = 36, STEP_PX = 14;
  const R_IN = $derived(dual ? 22 : 36);
  let drag = /** @type {null|{ring: 'outer'|'inner', y0: number, moved: boolean, id: number}} */ (null);
  let spin = $state(0);

  /** @param {PointerEvent} e */
  function ringAt(e) {
    const svg = /** @type {SVGGraphicsElement} */ (e.currentTarget);
    const pt = svg.ownerSVGElement?.createSVGPoint();
    if (!pt) return 'inner';
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.ownerSVGElement?.getScreenCTM();
    const p = m ? pt.matrixTransform(m.inverse()) : pt;
    return dual && Math.hypot(p.x - x, p.y - y) > R_IN ? 'outer' : 'inner';
  }

  function turn(ring, d) { spin += d * 15; onturn(ring, d); }

  /** @param {PointerEvent} e */
  function down(e) {
    if (onexplain()) return;
    const el = /** @type {Element} */ (e.currentTarget);
    el.setPointerCapture?.(e.pointerId);
    drag = { ring: ringAt(e), y0: e.clientY, moved: false, id: e.pointerId };
  }
  /** @param {PointerEvent} e */
  function move(e) {
    if (!drag || drag.id !== e.pointerId) return;
    const dy = drag.y0 - e.clientY;
    if (Math.abs(dy) >= STEP_PX) {
      const n = Math.trunc(dy / STEP_PX);
      turn(drag.ring, n);
      drag.y0 -= n * STEP_PX;
      drag.moved = true;
    }
  }
  function up() {
    if (!drag) return;
    if (!drag.moved) { if (drag.ring === 'inner') onpush(); else onselect(); }
    drag = null;
  }
  /** @param {WheelEvent} e */
  function wheel(e) {
    if (onexplain()) return;
    e.preventDefault();
    turn(ringAt(/** @type {any} */ (e)), e.deltaY < 0 ? 1 : -1);
  }
  /** @param {KeyboardEvent} e */
  function key(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (onexplain()) return;
      turn(e.shiftKey && dual ? 'outer' : 'inner', e.key === 'ArrowUp' ? 1 : -1);
    } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!onexplain()) onpush(); }
  }
</script>

<g class="knob" data-part={part} role="button" tabindex="0" aria-label={label}
  onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={() => (drag = null)} onwheel={wheel} onkeydown={key}
  style="cursor:ns-resize;touch-action:none">
  {#if highlight}<circle cx={x} cy={y} r={R_OUT + 8} fill="none" stroke={C.cyan} stroke-width="4" class="hl" />{/if}
  <circle cx={x} cy={y} r={R_OUT} fill={flash ? C.cyan : C.key} stroke={C.bezelEdge} stroke-width="3" />
  <g transform={`rotate(${spin} ${x} ${y})`}>
    {#each Array(12) as _, i}
      <line x1={x} y1={y - R_OUT + 2} x2={x} y2={y - R_OUT + 8} stroke="#555c63" stroke-width="2" transform={`rotate(${i * 30} ${x} ${y})`} />
    {/each}
  </g>
  {#if dual}<circle cx={x} cy={y} r={R_IN} fill={C.bezel} stroke={C.bezelEdge} stroke-width="3" />{/if}
  <circle cx={x} cy={y} r="6" fill="#5b636b" />
  <text x={x} y={y + R_OUT + 20} fill={C.keyText} font-family={FONT} font-size="15" text-anchor="middle">{label}</text>
</g>
