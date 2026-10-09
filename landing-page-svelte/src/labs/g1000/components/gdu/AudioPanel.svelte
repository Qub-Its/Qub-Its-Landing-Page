<script>
  // GMA 1347 audio panel (simplified): COM1 MIC, COM1, COM2 MIC, COM2, NAV1, NAV2 and the red DISPLAY BACKUP.
  // Lit keys = selected. Powered by MASTER.
  import { C, FONT } from './layout.js';
  import { g, send, ui } from '../../lib/g1000.svelte.js';

  /** @type {{ explain: boolean, highlight: string|null, onpart: (id: string) => void }} */
  let { explain, highlight, onpart } = $props();

  const KEYS = [['com1mic', 'COM1 MIC'], ['com1', 'COM1'], ['com2mic', 'COM2 MIC'], ['com2', 'COM2'], ['nav1', 'NAV1'], ['nav2', 'NAV2']];
  const lit = (id) => g.power.master && (id === 'com1mic' ? g.audio.mic === 0 : id === 'com2mic' ? g.audio.mic === 1 : g.audio[id]);
  function press(id) {
    const part = id === 'backup' ? 'audio.backup' : 'audio.panel';
    if (explain) { onpart(part); return; }
    send({ type: 'audio', id });
  }
</script>

<svg viewBox="0 0 160 900" class="audio" role="group" aria-label="Audio" data-part="audio.panel">
  <rect x="2" y="2" width="156" height="896" rx="18" fill={C.bezel} stroke={C.bezelEdge} stroke-width="4" />
  {#if highlight === 'audio.panel'}<rect x="6" y="6" width="148" height="888" rx="16" fill="none" stroke={C.cyan} stroke-width="4" class="hl" />{/if}
  {#each KEYS as [id, label], i}
    <g role="button" tabindex="0" aria-label={label} aria-pressed={lit(id)} style="cursor:pointer"
      onclick={() => press(id)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(id); } }}>
      <rect x="22" y={70 + i * 90} width="116" height="56" rx="8" fill={ui.flash === `audio:${id}` ? C.cyan : C.key} stroke={C.bezelEdge} />
      <rect x="62" y={78 + i * 90} width="36" height="6" rx="3" fill={lit(id) ? C.green : '#111'} />
      <text x="80" y={112 + i * 90} fill={C.keyText} font-family={FONT} font-size="16" text-anchor="middle">{label}</text>
    </g>
  {/each}
  <g role="button" tabindex="0" aria-label="DISPLAY BACKUP" data-part="audio.backup" style="cursor:pointer"
    onclick={() => press('backup')} onkeydown={(e) => { if (e.key === 'Enter') press('backup'); }}>
    <rect x="22" y="700" width="116" height="80" rx="10" fill="#b3261e" stroke="#7a1a14" />
    <text x="80" y="734" fill={C.white} font-family={FONT} font-size="14" text-anchor="middle">DISPLAY</text>
    <text x="80" y="756" fill={C.white} font-family={FONT} font-size="14" text-anchor="middle">BACKUP</text>
  </g>
</svg>
