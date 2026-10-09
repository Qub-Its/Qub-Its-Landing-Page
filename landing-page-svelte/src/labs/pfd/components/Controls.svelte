<script>
  // Sidestick pad (pointer drag + arrow keys), thrust lever, flaps / gear, scenario picker, pause and reset.
  import { onMount } from 'svelte';
  import { flight, SCENARIOS, setStick, setThrust, setLever, setFlaps, toggleGearLever, togglePause, loadScenario } from '../lib/flight.svelte.js';

  let { lang = 'es' } = $props();

  const COPY = {
    es: {
      stick: 'Sidestick', pad: 'Sidestick: arrastra o usa las flechas del teclado', push: 'EMPUJAR', pull: 'TIRAR',
      padHint: 'Arriba = empujar (morro abajo). Abajo = tirar (morro arriba). Suelta para centrar.',
      thrust: 'Palancas de empuje', tla: 'Posición de palanca (%)', detents: { IDLE: 'IDLE', CL: 'CL', FLX: 'FLX', TOGA: 'TOGA' },
      flaps: 'Flaps', gear: 'Tren', gearUp: 'Arriba', gearDown: 'Abajo', gearBtn: 'Tren de aterrizaje',
      scenario: 'Escenario', pause: 'Pausa', resume: 'Reanudar', reset: 'Reiniciar'
    },
    en: {
      stick: 'Sidestick', pad: 'Sidestick: drag or use the keyboard arrows', push: 'PUSH', pull: 'PULL',
      padHint: 'Up = push (nose down). Down = pull (nose up). Release to centre.',
      thrust: 'Thrust levers', tla: 'Lever position (%)', detents: { IDLE: 'IDLE', CL: 'CL', FLX: 'FLX', TOGA: 'TOGA' },
      flaps: 'Flaps', gear: 'Gear', gearUp: 'Up', gearDown: 'Down', gearBtn: 'Landing gear',
      scenario: 'Scenario', pause: 'Pause', resume: 'Resume', reset: 'Reset'
    }
  };
  const t = $derived(COPY[lang] ?? COPY.es);
  const DETENTS = ['IDLE', 'CL', 'FLX', 'TOGA'];
  const FLAPS = ['0', '1', '2', '3', 'FULL'];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ---- stick: pad (pointer) + keys (arrows) combine
  let padEl = $state(null);
  let padP = 0; // + = pull
  let padR = 0;
  let keyP = 0;
  let keyR = 0;
  const held = { up: false, down: false, left: false, right: false };
  let raf = 0;
  let lastT = 0;
  let dragging = false;

  const push = () => setStick(clamp(padP + keyP, -1, 1), clamp(padR + keyR, -1, 1));

  function fromPointer(e) {
    if (!padEl) return;
    const r = padEl.getBoundingClientRect();
    const R = (r.width / 2) * 0.78;
    let dx = (e.clientX - (r.left + r.width / 2)) / R;
    let dy = (e.clientY - (r.top + r.height / 2)) / R;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    padR = dx;
    padP = dy;
    push();
  }
  function onDown(e) {
    dragging = true;
    padEl?.setPointerCapture?.(e.pointerId);
    fromPointer(e);
    e.preventDefault();
  }
  function onMove(e) {
    if (dragging) fromPointer(e);
  }
  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    try {
      padEl?.releasePointerCapture?.(e.pointerId);
    } catch {}
    padP = 0;
    padR = 0;
    push();
  }

  function keyLoop(now) {
    const dt = Math.min((now - lastT) / 1000, 0.1);
    lastT = now;
    const tp = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    const tr = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    const move = (v, target) => {
      const rate = target === 0 ? 8 : 2.4;
      const d = target - v;
      return Math.abs(d) <= rate * dt ? target : v + Math.sign(d) * rate * dt;
    };
    keyP = move(keyP, tp);
    keyR = move(keyR, tr);
    push();
    if (keyP !== 0 || keyR !== 0 || tp !== 0 || tr !== 0) raf = requestAnimationFrame(keyLoop);
    else raf = 0;
  }
  function kick() {
    if (!raf) {
      lastT = performance.now();
      raf = requestAnimationFrame(keyLoop);
    }
  }
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  function typing(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }
  function onKeyDown(e) {
    const k = KEYS[e.key];
    if (!k || e.ctrlKey || e.metaKey || e.altKey || typing(document.activeElement)) return;
    e.preventDefault();
    held[k] = true;
    kick();
  }
  function onKeyUp(e) {
    const k = KEYS[e.key];
    if (!k) return;
    held[k] = false;
    kick();
  }
  function releaseAll() {
    held.up = held.down = held.left = held.right = false;
    kick();
  }

  onMount(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseAll);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseAll);
      if (raf) cancelAnimationFrame(raf);
      setStick(0, 0);
    };
  });

  // knob position follows the real stick (pad or keys)
  const knobX = $derived(flight.stick.roll * 39);
  const knobY = $derived(flight.stick.pitch * 39);

  const flapsActive = (f) => flight.flaps === f || (f === '1' && flight.flaps === '1+F');
</script>

<section class="controls" aria-label="Controls">
  <div class="row top">
    <label class="sel">
      <span class="lbl">{t.scenario}</span>
      <select value={flight.scenario} onchange={(e) => loadScenario(e.currentTarget.value)}>
        {#each SCENARIOS as sc (sc.id)}<option value={sc.id}>{sc.name[lang] ?? sc.name.es}</option>{/each}
      </select>
    </label>
    <div class="btns">
      <button type="button" class="btn" aria-pressed={flight.paused} onclick={togglePause}>{flight.paused ? t.resume : t.pause}</button>
      <button type="button" class="btn" onclick={() => loadScenario(flight.scenario)}>{t.reset}</button>
    </div>
  </div>

  <div class="row mid">
    <div class="stick">
      <span class="lbl">{t.stick}</span>
      <div
        class="pad"
        bind:this={padEl}
        role="group"
        aria-label={t.pad}
        title={t.padHint}
        onpointerdown={onDown}
        onpointermove={onMove}
        onpointerup={onUp}
        onpointercancel={onUp}
        onlostpointercapture={onUp}
      >
        <span class="ax top" aria-hidden="true">{t.push}</span>
        <span class="ax bottom" aria-hidden="true">{t.pull}</span>
        <span class="ax left" aria-hidden="true">L</span>
        <span class="ax right" aria-hidden="true">R</span>
        <i class="cross h" aria-hidden="true"></i><i class="cross v" aria-hidden="true"></i>
        <i class="knob" style={`left: ${50 + knobX}%; top: ${50 + knobY}%`} aria-hidden="true"></i>
      </div>
      <span class="small">{t.padHint}</span>
    </div>

    <div class="thr">
      <span class="lbl" id="thr-lbl">{t.thrust}</span>
      <div class="seg" role="group" aria-labelledby="thr-lbl">
        {#each DETENTS as d}
          <button type="button" class="segbtn" class:on={flight.thrust === d} aria-pressed={flight.thrust === d} onclick={() => setThrust(d)}>{t.detents[d]}</button>
        {/each}
      </div>
      <label class="tla">
        <span class="small">{t.tla}</span>
        <input type="range" min="0" max="100" step="1" value={Math.round((flight.lever ?? 0) * 100)} oninput={(e) => setLever(+e.currentTarget.value / 100)} />
        <output>{Math.round((flight.lever ?? 0) * 100)}</output>
      </label>

      <span class="lbl" id="flp-lbl">{t.flaps}</span>
      <div class="seg" role="group" aria-labelledby="flp-lbl">
        {#each FLAPS as f}
          <button type="button" class="segbtn" class:on={flapsActive(f)} aria-pressed={flapsActive(f)} onclick={() => setFlaps(f)}>{f}</button>
        {/each}
      </div>
      <button type="button" class="btn gear" aria-pressed={flight.gearDown} aria-label={t.gearBtn} onclick={toggleGearLever}>
        {t.gear}: {flight.gearDown ? t.gearDown : t.gearUp}
      </button>
    </div>
  </div>
</section>

<style>
  .controls {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .row { display: flex; gap: 14px; flex-wrap: wrap; }
  .top { align-items: flex-end; justify-content: space-between; }
  .mid { align-items: flex-start; }
  .lbl {
    font-family: var(--f-ui);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .small { font-size: 12px; color: var(--muted); }
  .sel { display: flex; flex-direction: column; gap: 4px; flex: 1 1 200px; min-width: 0; }
  select {
    font-family: var(--f-ui);
    font-size: 13px;
    color: var(--fg);
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 4px;
    min-height: 40px;
    padding: 6px 8px;
    max-width: 100%;
  }
  .btns { display: flex; gap: 8px; }
  .btn {
    font-family: var(--f-ui);
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border: 1px solid var(--line);
    background: var(--panel-2);
    padding: 8px 12px;
    min-height: 40px;
    border-radius: 4px;
    cursor: pointer;
  }
  .btn:hover { border-color: var(--muted); }
  .btn[aria-pressed='true'] { background: var(--cyan); color: #06222a; border-color: var(--cyan); }

  .stick { display: flex; flex-direction: column; gap: 6px; flex: 0 1 190px; }
  .pad {
    position: relative;
    width: min(100%, 180px);
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 50%, #2b353d 0%, #1a2127 70%);
    border: 2px solid var(--line);
    touch-action: none;
    cursor: grab;
    user-select: none;
  }
  .pad:active { cursor: grabbing; }
  .cross { position: absolute; background: rgba(255, 255, 255, 0.1); pointer-events: none; }
  .cross.h { left: 8%; right: 8%; top: 50%; height: 1px; }
  .cross.v { top: 8%; bottom: 8%; left: 50%; width: 1px; }
  .ax {
    position: absolute;
    font-family: var(--f-ui);
    font-size: 9px;
    letter-spacing: 0.1em;
    color: var(--muted);
    pointer-events: none;
  }
  .ax.top { top: 5px; left: 50%; transform: translateX(-50%); }
  .ax.bottom { bottom: 5px; left: 50%; transform: translateX(-50%); }
  .ax.left { left: 7px; top: 50%; transform: translateY(-50%); }
  .ax.right { right: 7px; top: 50%; transform: translateY(-50%); }
  .knob {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 34%;
    height: 34%;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #6c747c, #343a40);
    border: 1px solid #14181b;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }

  .thr { display: flex; flex-direction: column; gap: 8px; flex: 1 1 220px; min-width: 0; }
  .seg { display: flex; border: 1px solid var(--line); border-radius: 4px; overflow: hidden; }
  .segbtn {
    flex: 1 1 0;
    min-height: 40px;
    min-width: 0;
    font-family: var(--f-ui);
    font-size: 12px;
    letter-spacing: 0.06em;
    color: var(--fg);
    background: var(--panel-2);
    border: 0;
    border-right: 1px solid var(--line);
    cursor: pointer;
  }
  .segbtn:last-child { border-right: 0; }
  .segbtn:hover { background: #2d3943; }
  .segbtn.on { background: var(--cyan); color: #06222a; }
  .tla { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; align-items: center; }
  .tla .small { grid-column: 1 / -1; }
  .tla input { width: 100%; min-height: 28px; accent-color: var(--cyan); }
  .tla output { font-family: var(--f-mono); font-size: 12px; min-width: 2.5ch; text-align: right; }
  .gear { align-self: flex-start; }
</style>
