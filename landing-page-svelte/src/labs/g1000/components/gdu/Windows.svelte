<script>
  // Pop-up windows shared by both GDUs: Direct-To (identifier, name, Activate?), MENU options and the identifier
  // entry being edited. Drawn at fixed spots of the GDU that owns them.
  import { C, FONT } from './layout.js';
  import { byId } from '../../lib/world.js';
  import { editValue } from '../../lib/avionics.js';

  /** @type {{ s: any, gdu: 'pfd'|'mfd', menuLabels: Record<string, string> }} */
  let { s, gdu, menuLabels } = $props();

  const box = $derived(gdu === 'pfd' ? { x: 794, y: 290, w: 230, h: 200 } : { x: 560, y: 200, w: 420, h: 190 });
  const menuBox = $derived(gdu === 'pfd' ? { x: 794, y: 200, w: 230 } : { x: 380, y: 240, w: 360 });
  const dtoId = $derived(s.edit?.target === 'dto' && s.edit.gdu === gdu ? editValue(s.edit) : (s.dtoWin?.id ?? ''));
  const typedLen = $derived(s.edit?.target === 'dto' && s.edit.gdu === gdu ? s.edit.pos : -1);
</script>

{#if s.dtoWin?.gdu === gdu}
  <g font-family={FONT}>
    <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#0d1a24" stroke={C.cyan} stroke-width="2" />
    <text x={box.x + box.w / 2} y={box.y + 24} fill={C.cyan} font-size="16" text-anchor="middle">DIRECT TO</text>
    <rect x={box.x + 14} y={box.y + 40} width="110" height="30" fill={s.dtoWin.field === 0 ? C.cyan : 'none'} stroke={C.cyan} />
    {#each [...(dtoId || '____')] as ch, i}
      <text x={box.x + 22 + i * 18} y={box.y + 62} fill={s.dtoWin.field === 0 ? '#001418' : C.cyan} font-size="20"
        text-decoration={i === typedLen ? 'underline' : 'none'}>{ch}</text>
    {/each}
    <text x={box.x + 14} y={box.y + 96} fill={C.white} font-size="14">{byId(dtoId)?.name ?? ''}</text>
    <rect x={box.x + 14} y={box.y + box.h - 48} width={box.w - 28} height="30" fill={s.dtoWin.field === 1 ? C.cyan : 'none'} stroke={C.cyan} />
    <text x={box.x + box.w / 2} y={box.y + box.h - 27} fill={s.dtoWin.field === 1 ? '#001418' : C.cyan} font-size="16" text-anchor="middle">ACTIVATE?</text>
  </g>
{/if}
{#if s.menu?.gdu === gdu}
  <g font-family={FONT}>
    <rect x={menuBox.x} y={menuBox.y} width={menuBox.w} height={30 + s.menu.items.length * 30} fill="#0d1a24" stroke={C.cyan} stroke-width="2" />
    <text x={menuBox.x + 10} y={menuBox.y + 20} fill={C.cyan} font-size="15">MENU</text>
    {#each s.menu.items as item, i}
      <rect x={menuBox.x + 6} y={menuBox.y + 28 + i * 30} width={menuBox.w - 12} height="26" fill={i === s.menu.sel ? C.cyan : 'none'} />
      <text x={menuBox.x + 14} y={menuBox.y + 47 + i * 30} fill={i === s.menu.sel ? '#001418' : C.white} font-size="15">{menuLabels[item] ?? item}</text>
    {/each}
  </g>
{/if}
