<script>
  // Typed numeric answers: one labelled input per field (decimal keypad, unit suffix, "1:30" for minutes) and a
  // Check button. Marks each field right/wrong; reports every check through `onresult(allRight)`.
  // The parent re-creates it with {#key} when the problem changes.
  import { grade } from '../grade.js';
  import { UI, tr } from '../i18n.js';

  /**
   * @type {{ lang: 'es'|'en', fields: {key:string, label:{es:string,en:string}, value:number, tol:object, unit:string, angle?:boolean}[],
   *   idPrefix?: string, onresult?: (all: boolean) => void }}
   */
  let { lang, fields, idPrefix = 'ans', onresult = () => {} } = $props();

  const t = $derived(UI[lang]);
  let values = $state(/** @type {Record<string, string>} */ ({}));
  let marks = $state(/** @type {Record<string, boolean|undefined>} */ ({}));
  let message = $state(/** @type {''|'fill'|'wrong'|'ok'} */ (''));
  let solved = $state(false);

  function check() {
    if (solved) return;
    const r = grade(fields, values);
    marks = r.marks;
    if (r.all) { solved = true; message = 'ok'; }
    else message = r.empty ? 'fill' : 'wrong';
    onresult(r.all);
  }

  const unitText = (u) => (u === 'min' ? 'min' : u);
</script>

<form class="answers" aria-label={t.answerFields} onsubmit={(e) => { e.preventDefault(); check(); }}>
  <div class="afields">
    {#each fields as f (f.key)}
      {@const id = `${idPrefix}-${f.key}`}
      <div class="afield" class:ok={marks[f.key] === true} class:bad={marks[f.key] === false}>
        <label for={id}>{tr(f.label, lang)}</label>
        <span class="ainput">
          <input {id} type="text" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false"
            disabled={solved} aria-invalid={marks[f.key] === false ? 'true' : undefined}
            aria-describedby="{id}-st" bind:value={values[f.key]} />
          <span class="aunit" aria-hidden="true">{unitText(f.unit)}</span>
        </span>
        <span class="ast" id="{id}-st">{marks[f.key] === true ? '✓ ' + t.fieldOk : marks[f.key] === false ? '✗ ' + t.fieldBad : ''}</span>
      </div>
    {/each}
  </div>
  <div class="aactions">
    <button type="submit" class="btn primary" disabled={solved}>{t.checkBtn}</button>
    <span class="amsg" class:good={message === 'ok'} class:bad={message === 'wrong'} role="status">{message === 'ok' ? t.allRight : message === 'wrong' ? t.someWrong : message === 'fill' ? t.fillAll : ''}</span>
  </div>
</form>
