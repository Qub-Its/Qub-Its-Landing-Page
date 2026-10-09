<script>
  // No-WebGL stand-in for the 3D scenes. Explode: a clickable SVG block diagram of the LRUs with the data flows.
  // Cockpit: a flat sketch of the panel with the cue target outlined. Lessons never block on 3D.
  import { LRUS, FLOWS } from '../content/lru.js';
  import { tr } from '../i18n.js';

  /** @type {{ lang: 'es'|'en', scene: 'cockpit'|'explode', cue: string, pickable: boolean, onpick: (part: string) => void }} */
  let { lang, scene, cue, pickable, onpick } = $props();

  const X = (x) => 400 + x * 190, Y = (y) => 250 - y * 130;
  const pos = (id) => LRUS.find((l) => l.id === id)?.pos ?? [0, 0, 0];
  const PANEL = { panel: [40, 60, 720, 300], pfd: [150, 100, 220, 170], mfd: [430, 100, 220, 170], audio: [375, 100, 50, 170],
    standby: [60, 110, 70, 170], master: [60, 300, 30, 30], avionics: [100, 300, 30, 30], softkeysPfd: [150, 260, 220, 14],
    softkeysMfd: [430, 260, 220, 14], fmsPfd: [350, 240, 24, 24], fmsMfd: [630, 240, 24, 24], comKnob: [350, 110, 24, 24],
    navKnob: [150, 110, 24, 24], hdgKnob: [150, 170, 24, 24], altKnob: [150, 220, 24, 24], crsKnob: [350, 160, 24, 24],
    dtoKey: [340, 200, 22, 16], yoke: [180, 330, 160, 30] };
</script>

<svg viewBox="0 0 800 420" class="fallback3d" role="img" aria-label={scene}>
  {#if scene === 'explode'}
    {#each FLOWS as f}
      <polyline points={f.path.map((id) => `${X(pos(id)[0])},${Y(pos(id)[1])}`).join(' ')} fill="none"
        stroke="#3ccbe8" stroke-opacity={cue === f.id ? 1 : 0.3} stroke-width={cue === f.id ? 4 : 2} />
    {/each}
    {#each LRUS as l}
      <g role="button" tabindex="0" data-part={l.part} style:cursor={pickable ? 'pointer' : 'default'}
        onclick={() => pickable && onpick(l.part)} onkeydown={(e) => { if (pickable && e.key === 'Enter') onpick(l.part); }}>
        <rect x={X(l.pos[0]) - 52} y={Y(l.pos[1]) - 20} width="104" height="40" rx="6" fill="#253039"
          stroke={cue === l.id ? '#3ccbe8' : '#5b6b78'} stroke-width={cue === l.id ? 3 : 1.5} />
        <text x={X(l.pos[0])} y={Y(l.pos[1]) - 2} fill="#e4eaef" font-size="12" text-anchor="middle">{l.model}</text>
        <text x={X(l.pos[0])} y={Y(l.pos[1]) + 13} fill="#97a5b1" font-size="9" text-anchor="middle">{tr(l.name, lang).slice(0, 24)}</text>
      </g>
    {/each}
  {:else}
    {#each Object.entries(PANEL) as [id, [x, y, w, h]]}
      <rect {x} {y} width={w} height={h} rx="6" fill={id === 'panel' ? '#2b3036' : '#1b1e22'}
        stroke={cue === id ? '#3ccbe8' : '#4a525a'} stroke-width={cue === id ? 4 : 1.5} />
    {/each}
  {/if}
</svg>
