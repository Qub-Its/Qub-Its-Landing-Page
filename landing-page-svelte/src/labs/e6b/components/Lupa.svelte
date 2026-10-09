<script module>
  import { pt } from './geom.js';
  const T = {
    es: { lupa: 'Lupa', cursor: 'cursor', grommet: 'ojal' },
    en: { lupa: 'Magnifier', cursor: 'cursor', grommet: 'grommet' }
  };
  const readAt = (a) => Math.pow(10, 1 + (((a % 360) + 360) % 360) / 360);
  const ZOOM = { calc: 3.5, wind: 2.6 };
</script>

<script>
  // Magnifier: re-uses the face that is currently shown (<use> of its root group) zoomed around the point that
  // matters: where the cursor crosses the meeting line of the two scales (turned so the scales read
  // horizontally), or the grommet on the wind face.
  import { WIND } from '../lib/wind.js';

  /** @type {{ s: import('../lib/e6b.svelte.js').e6b, lang?: string, label?: string }} */
  let { s, lang = 'es', label = '' } = $props();

  const t = $derived(T[lang] ?? T.es);
  const calc = $derived(s.face === 'calc');
  const xf = $derived.by(() => {
    if (!calc) return `scale(${ZOOM.wind}) translate(${-WIND.cx} ${-WIND.cy})`;
    const [px, py] = pt(200, 200, 168, s.cursor);
    return `scale(${ZOOM.calc}) rotate(${-s.cursor}) translate(${-px} ${-py})`;
  });
  const caption = $derived(
    calc ? `${t.lupa} · ${t.cursor} ${readAt(s.cursor).toFixed(1)}` : `${t.lupa} · ${t.grommet} ${s.slide.toFixed(0)} kt`
  );
</script>

<figure class="e6b-lupa">
  <svg viewBox="-60 -60 120 120" role="img" aria-label={label || t.lupa}>
    <defs><clipPath id="e6bLupaClip"><circle r="57" /></clipPath></defs>
    <circle r="58" fill="#1b2025" />
    <g clip-path="url(#e6bLupaClip)">
      <g transform={xf}>
        <use href={calc ? '#e6bCalcFace' : '#e6bWindFace'} />
      </g>
      <path d="M-57 0H-8M8 0H57M0 -57V-8M0 8V57" stroke="rgba(238,242,245,0.35)" stroke-width="0.4" />
    </g>
    <circle r="57.5" fill="none" stroke="#6b757d" stroke-width="2.4" />
  </svg>
  <figcaption>{caption}</figcaption>
</figure>

<style>
  .e6b-lupa { margin: 0; width: 132px; flex: none; text-align: center; }
  svg { display: block; width: 100%; height: auto; border-radius: 50%; box-shadow: 0 4px 12px #0008; }
  figcaption { margin-top: 4px; font: 11px var(--f-mono, 'B612 Mono', ui-monospace, monospace); color: var(--muted, #97a5b1); }
</style>
