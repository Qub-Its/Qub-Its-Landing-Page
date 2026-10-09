<script>
  // GDU 1040 bezel: frame, knob columns, keys, 12 softkeys (labels drawn on the screen's bottom edge) and the
  // screen slot (children snippet, drawn in 1024 × 768 screen coordinates). Controls send events; in explain
  // mode they explain themselves instead.
  import Knob from './Knob.svelte';
  import { BEZEL, C, FONT, KNOBS, KEYS, SOFTKEY, SOFTKEY_W, softkeyX } from './layout.js';
  import { softkeys } from '../../lib/softkeys.js';
  import { g, ui, send } from '../../lib/g1000.svelte.js';

  /**
   * @type {{ gdu: 'pfd'|'mfd', explain: boolean, highlight: string|null, onpart: (id: string) => void,
   *   onknob: (k: {gdu: 'pfd'|'mfd', id: string}) => void, children: import('svelte').Snippet }}
   */
  let { gdu, explain, highlight, onpart, onknob, children } = $props();

  const keys = $derived(softkeys(g, gdu));
  const explained = (part) => { if (!explain) return false; onpart(part); return true; };
  const flash = $derived(ui.flash);

  function pressKey(id, part, long = false) {
    if (explained(part)) return;
    send({ type: 'key', gdu, id, long });
  }

  let clrTimer = 0, clrLong = false;
  function clrDown() {
    clrLong = false;
    clearTimeout(clrTimer);
    clrTimer = setTimeout(() => { clrLong = true; pressKey('clr', 'key.clr', true); }, 900);
  }
  function clrCancel() { clearTimeout(clrTimer); clrLong = true; }
  function clrUp() {
    clearTimeout(clrTimer);
    if (!clrLong) pressKey('clr', 'key.clr');
  }
</script>

<svg viewBox={`0 0 ${BEZEL.w} ${BEZEL.h}`} class="gdu" id={`gdu-${gdu}`} role="group" aria-label={gdu.toUpperCase()}
  xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width={BEZEL.w - 4} height={BEZEL.h - 4} rx="26" fill={C.bezel} stroke={C.bezelEdge} stroke-width="4" />
  <svg x={BEZEL.screen.x} y={BEZEL.screen.y} width={BEZEL.screen.w} height={BEZEL.screen.h} viewBox="0 0 1024 768" overflow="hidden">
    <rect width="1024" height="768" fill={C.bg} />
    {@render children()}
    <g data-part={`${gdu}.softkeys`}>
      {#each keys as k, i}
        <rect x={(i * 1024) / 12 + 2} y={SOFTKEY.labelY} width={1024 / 12 - 4} height={SOFTKEY.labelH}
          fill={k.on ? C.cyan : '#1c2329'} stroke="#3c4650" />
        {#if k.label}
          <text x={(i + 0.5) * (1024 / 12)} y={SOFTKEY.labelY + 18} fill={k.on ? '#001418' : C.white} font-family={FONT}
            font-size="15" text-anchor="middle">{k.label}</text>
        {/if}
      {/each}
    </g>
  </svg>

  {#each Array(12) as _, i}
    <rect x={softkeyX(i) + 10} y={SOFTKEY.y} width={SOFTKEY_W - 20} height={SOFTKEY.h} rx="6" role="button" tabindex="0"
      aria-label={keys[i].label ?? `softkey ${i + 1}`} data-part={`${gdu}.softkeys`}
      fill={flash === `soft:${gdu}:${i}` ? C.cyan : C.key} stroke={C.bezelEdge} style="cursor:pointer"
      onclick={() => { if (!explained(`${gdu}.softkeys`)) send({ type: 'soft', gdu, n: i }); }}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!explained(`${gdu}.softkeys`)) send({ type: 'soft', gdu, n: i }); } }} />
  {/each}

  {#each Object.entries(KNOBS) as [id, k]}
    <Knob x={k.x} y={k.y} dual={k.dual} label={k.label} part={k.part} highlight={highlight === k.part}
      flash={flash === `knob:${gdu}:${id}`}
      onexplain={() => explained(k.part)}
      onturn={(ring, d) => send({ type: 'knob', gdu, id, ring, d })}
      onpush={() => send({ type: 'push', gdu, id })}
      onselect={() => onknob({ gdu, id })} />
  {/each}

  {#each Object.entries(KEYS) as [id, k]}
    <g role="button" tabindex="0" aria-label={k.label} data-part={k.part} style="cursor:pointer"
      onpointerdown={id === 'clr' ? clrDown : undefined}
      onpointerup={id === 'clr' ? clrUp : undefined}
      onpointercancel={id === 'clr' ? clrCancel : undefined}
      onpointerleave={id === 'clr' ? clrCancel : undefined}
      onclick={id === 'clr' ? undefined : () => pressKey(id, k.part)}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pressKey(id, k.part); } }}>
      {#if highlight === k.part}<rect x={k.x - 5} y={k.y - 5} width={k.w + 10} height={k.h + 10} rx="8" fill="none" stroke={C.cyan} stroke-width="4" class="hl" />{/if}
      <rect x={k.x} y={k.y} width={k.w} height={k.h} rx="6" fill={flash === `key:${gdu}:${id}` ? C.cyan : C.key} stroke={C.bezelEdge} />
      <text x={k.x + k.w / 2} y={k.y + k.h / 2 + 5} fill={C.keyText} font-family={FONT} font-size={k.label.length > 3 ? 11 : 15} text-anchor="middle">{k.label}</text>
    </g>
  {/each}
</svg>
