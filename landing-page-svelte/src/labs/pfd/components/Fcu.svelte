<script>
  // Simplified Airbus FCU: SPD/MACH, HDG, ALT and V/S windows (push = managed, pull = selected) plus the
  // AP1 / AP2 / A/THR / LOC / APPR / FD pushbuttons. Reads and drives the shared flight store.
  import { flight, fcu } from '../lib/flight.svelte.js';

  let { lang = 'es' } = $props();

  const COPY = {
    es: {
      panel: 'Unidad de control de vuelo (FCU)',
      spd: 'Velocidad', hdg: 'Rumbo', alt: 'Altitud', vs: 'Régimen vertical',
      minus: 'Disminuir', plus: 'Aumentar',
      push: 'PUSH', pull: 'PULL',
      pushSpd: 'Empujar: velocidad gestionada', pullSpd: 'Tirar: velocidad seleccionada',
      pushHdg: 'Empujar: NAV gestionado', pullHdg: 'Tirar: rumbo seleccionado',
      pushAlt: 'Empujar: ascenso/descenso gestionado (CLB/DES)', pullAlt: 'Tirar: ascenso/descenso abierto (OP CLB/OP DES)',
      pushVs: 'Empujar: nivelar (V/S 0)', pullVs: 'Tirar: activar V/S seleccionado',
      toggleMach: 'Alternar velocidad / Mach', step1000: 'Paso de 1000 ft',
      managed: 'gestionado', off: 'sin seleccionar',
      pb: { ap1: 'Piloto automático 1', ap2: 'Piloto automático 2', athr: 'Autoempuje', loc: 'Localizador', appr: 'Aproximación', fd: 'Director de vuelo' },
      hint: 'Rueda del ratón sobre una ventana para girar el mando.'
    },
    en: {
      panel: 'Flight control unit (FCU)',
      spd: 'Speed', hdg: 'Heading', alt: 'Altitude', vs: 'Vertical speed',
      minus: 'Decrease', plus: 'Increase',
      push: 'PUSH', pull: 'PULL',
      pushSpd: 'Push: managed speed', pullSpd: 'Pull: selected speed',
      pushHdg: 'Push: managed NAV', pullHdg: 'Pull: selected heading',
      pushAlt: 'Push: managed climb/descent (CLB/DES)', pullAlt: 'Pull: open climb/descent (OP CLB/OP DES)',
      pushVs: 'Push: level off (V/S 0)', pullVs: 'Pull: engage selected V/S',
      toggleMach: 'Toggle speed / Mach', step1000: '1000 ft step',
      managed: 'managed', off: 'not selected',
      pb: { ap1: 'Autopilot 1', ap2: 'Autopilot 2', athr: 'Autothrust', loc: 'Localizer', appr: 'Approach', fd: 'Flight director' },
      hint: 'Mouse wheel over a window turns the knob.'
    }
  };
  const t = $derived(COPY[lang] ?? COPY.es);

  const f = $derived(flight.fcu);
  const pad = (n, w) => String(Math.round(Math.abs(n))).padStart(w, '0');

  const spdText = $derived(f.spdManaged ? '---' : f.spdIsMach ? '.' + pad(f.mach * 100, 2) : pad(f.spd, 3));
  const hdgText = $derived(f.hdgManaged ? '---' : pad(f.hdg === 0 ? 360 : f.hdg, 3));
  const altText = $derived(pad(f.alt, 5));
  const vsText = $derived(!f.vsActive && f.vs === 0 ? '-----' : (f.vs < 0 ? '-' : '+') + pad(f.vs, 4));
  const vsDim = $derived(!f.vsActive);

  let big = $state(false);

  /** Non-passive wheel listener so the page does not scroll while turning a knob. */
  function wheel(node, handler) {
    const h = (e) => {
      e.preventDefault();
      handler(e.deltaY < 0 ? 1 : -1, e);
    };
    node.addEventListener('wheel', h, { passive: false });
    return { destroy: () => node.removeEventListener('wheel', h) };
  }

  const PBS = [
    { key: 'ap1', label: 'AP1', on: () => f.ap1, act: () => fcu.ap1() },
    { key: 'ap2', label: 'AP2', on: () => f.ap2, act: () => fcu.ap2() },
    { key: 'athr', label: 'A/THR', on: () => f.athr, act: () => fcu.athr() },
    { key: 'loc', label: 'LOC', on: () => f.loc, act: () => fcu.loc() },
    { key: 'appr', label: 'APPR', on: () => f.appr, act: () => fcu.appr() },
    { key: 'fd', label: 'FD', on: () => f.fd, act: () => fcu.fd() }
  ];
</script>

{#snippet knob(id, title, labels, text, dot, dim, onturn, onpush, onpull, pushLabel, pullLabel, extra)}
  <div class="mod" role="group" aria-label={title}>
    <div class="labels" aria-hidden="true">
      {#each labels as l}<span class:lit={l.lit}>{l.text}</span>{/each}
    </div>
    <div class="win" class:dim use:wheel={onturn} role="status" aria-label={`${title}: ${dot ? t.managed : text}`}>
      <span class="digits">{text}</span>{#if dot}<i class="dot" aria-hidden="true"></i>{/if}
    </div>
    <div class="turn">
      <button type="button" class="k" aria-label={`${title}: ${t.minus}`} onclick={() => onturn(-1, {})}>−</button>
      <button type="button" class="k" aria-label={`${title}: ${t.plus}`} onclick={() => onturn(1, {})}>+</button>
    </div>
    <div class="pp">
      <button type="button" class="k small" aria-label={pushLabel} title={pushLabel} onclick={onpush}>{t.push}</button>
      <button type="button" class="k small" aria-label={pullLabel} title={pullLabel} onclick={onpull}>{t.pull}</button>
    </div>
    {#if extra}{@render extra()}{/if}
  </div>
{/snippet}

{#snippet spdExtra()}
  <button type="button" class="k tiny" aria-pressed={f.spdIsMach} onclick={() => fcu.spdMachToggle()} title={t.toggleMach} aria-label={t.toggleMach}>SPD⇄MACH</button>
{/snippet}
{#snippet altExtra()}
  <button type="button" class="k tiny" aria-pressed={big} onclick={() => (big = !big)} title={t.step1000} aria-label={t.step1000}>×1000</button>
{/snippet}

<section class="fcu" aria-label={t.panel}>
  <div class="mods">
    {@render knob('spd', t.spd, [{ text: 'SPD', lit: !f.spdIsMach }, { text: 'MACH', lit: f.spdIsMach }], spdText, f.spdManaged, false, (d) => fcu.spdTurn(d), () => fcu.spdPush(), () => fcu.spdPull(), t.pushSpd, t.pullSpd, spdExtra)}
    {@render knob('hdg', t.hdg, [{ text: 'HDG', lit: true }], hdgText, f.hdgManaged, false, (d) => fcu.hdgTurn(d), () => fcu.hdgPush(), () => fcu.hdgPull(), t.pushHdg, t.pullHdg, null)}
    {@render knob('alt', t.alt, [{ text: 'ALT', lit: true }], altText, false, false, (d, e) => fcu.altTurn(d, big || !!e.shiftKey), () => fcu.altPush(), () => fcu.altPull(), t.pushAlt, t.pullAlt, altExtra)}
    {@render knob('vs', t.vs, [{ text: 'V/S', lit: true }, { text: 'FPM', lit: f.vsActive }], vsText, false, vsDim, (d) => fcu.vsTurn(d), () => fcu.vsPush(), () => fcu.vsPull(), t.pushVs, t.pullVs, null)}
  </div>
  <div class="pbs">
    {#each PBS as p (p.key)}
      <button type="button" class="pb" class:on={p.on()} aria-pressed={p.on()} aria-label={t.pb[p.key]} title={t.pb[p.key]} onclick={p.act}>
        <i class="bar" aria-hidden="true"></i>
        <span>{p.label}</span>
      </button>
    {/each}
  </div>
  <p class="hint">{t.hint}</p>
</section>

<style>
  .fcu {
    background: linear-gradient(180deg, #3b4047, #2a2e33);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 2px 6px rgba(0, 0, 0, 0.35);
  }
  .mods {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .mod {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    min-width: 0;
  }
  .labels {
    display: flex;
    justify-content: center;
    gap: 8px;
    font-family: var(--f-ui);
    font-size: 11px;
    letter-spacing: 0.1em;
    color: #8b949c;
    min-height: 15px;
  }
  .labels .lit { color: #f4f6f7; }
  .win {
    background: #050505;
    border: 1px solid #14181b;
    border-radius: 4px;
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.9);
    padding: 6px 4px;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    font-family: var(--f-mono);
    font-weight: 700;
    font-size: clamp(17px, 4.4vw, 24px);
    letter-spacing: 0.04em;
    color: #ff9f2e;
    text-shadow: 0 0 7px rgba(255, 140, 20, 0.55);
    font-variant-numeric: tabular-nums;
    cursor: ns-resize;
    user-select: none;
  }
  .win.dim { color: #8a5518; text-shadow: none; }
  .digits { white-space: nowrap; }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; box-shadow: 0 0 5px #fff; flex: none; align-self: center; }
  .turn, .pp { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .k {
    min-height: 40px;
    min-width: 36px;
    font-family: var(--f-ui);
    font-size: 18px;
    line-height: 1;
    color: var(--key-fg, #f4f6f7);
    background: linear-gradient(180deg, var(--key-a, #4b5158), var(--key-b, #33383d));
    border: 1px solid #1c2024;
    border-radius: 4px;
    cursor: pointer;
    padding: 0 4px;
    touch-action: manipulation;
  }
  .k.small { min-height: 36px; font-size: 11px; letter-spacing: 0.08em; }
  .k.tiny { min-height: 28px; font-size: 10px; letter-spacing: 0.06em; }
  .k:hover { border-color: var(--muted); }
  .k:active { transform: translateY(1px); }
  .k[aria-pressed='true'] { background: var(--cyan); color: #06222a; border-color: var(--cyan); }
  .pbs {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
  }
  .pb {
    position: relative;
    min-height: 48px;
    padding: 12px 2px 6px;
    font-family: var(--f-ui);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--key-fg, #f4f6f7);
    background: linear-gradient(180deg, var(--key-a, #4b5158), var(--key-b, #33383d));
    border: 1px solid #1c2024;
    border-radius: 4px;
    cursor: pointer;
    touch-action: manipulation;
  }
  .pb:hover { border-color: var(--muted); }
  .bar {
    position: absolute;
    left: 14%;
    right: 14%;
    top: 5px;
    height: 4px;
    border-radius: 2px;
    background: #1b2a20;
  }
  .pb.on .bar { background: var(--s-g, #3ff27c); box-shadow: 0 0 7px var(--s-g, #3ff27c); }
  .hint { margin: 0; font-size: 11px; color: #8b949c; }
  @media (max-width: 520px) {
    .mods { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pbs { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
</style>
