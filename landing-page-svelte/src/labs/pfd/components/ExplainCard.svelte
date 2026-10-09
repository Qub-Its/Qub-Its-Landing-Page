<script>
  // Explain-mode card: what a PFD part is, how to read it and why it matters (content/parts.js).
  import { PARTS } from '../content/parts.js';
  import { glossHtml } from '../content/glossary.js';
  import { UI } from '../i18n.js';

  /** @type {{ lang: 'es'|'en', part: string|null, explain?: boolean, onclear?: () => void }} */
  let { lang, part, explain = false, onclear = () => {} } = $props();

  const t = $derived(UI[lang]);
  const c = $derived(part ? PARTS[part]?.[lang] : null);
</script>

<section class="inspector" aria-live="polite">
  {#if c}
    <h3><span class="tag">{part}</span>{c.title}
      <button type="button" class="linkbtn clear" onclick={onclear}>{t.clearPart}</button></h3>
    <dl class="parts">
      <dt>{t.what}</dt><dd>{@html glossHtml(c.what, lang)}</dd>
      <dt>{t.read}</dt><dd>{@html glossHtml(c.read, lang)}</dd>
      <dt>{t.why}</dt><dd>{@html glossHtml(c.why, lang)}</dd>
    </dl>
  {:else}
    <h3>{t.explainEmptyTitle}</h3>
    <p>{explain ? t.explainOn : t.explainEmpty}</p>
  {/if}
</section>
