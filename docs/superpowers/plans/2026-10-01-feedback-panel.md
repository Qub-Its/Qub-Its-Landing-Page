# Feedback Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Feedback" button to the landing's top navigation. It opens a dialog with subject, comment and optional email, and submits to Web3Forms behind hCaptcha plus client-side anti-spam layers.

**Architecture:** Pure, Node-testable logic lives in `src/lib/feedback.js`: validation, bot guards, cooldown, payload and submit. `src/lib/FeedbackPanel.svelte` (Svelte 5 runes) renders a native `<dialog>`, loads hCaptcha's explicit-render API on first open and wires the logic. `App.svelte` shows the nav button and mounts the panel only when `VITE_WEB3FORMS_FEEDBACK_KEY` is set at build time.

**Tech Stack:** Svelte 5 + Vite 8 (`landing-page-svelte/`), Web3Forms JSON API, hCaptcha JS API, Node 22 for build, `node:assert` for checks, headless Chrome via CDP for the browser check.

**Spec:** `docs/superpowers/specs/2026-10-01-feedback-panel-design.md`

## Global Constraints

- All commands run from `landing-page-svelte/` unless stated otherwise.
- Vite needs Node ≥ 20.19. The machine default is Node 18, so prefix build commands with `PATH=~/.nvm/versions/node/v22.22.1/bin:$PATH`.
- Do not add dependencies or a test framework.
- Never commit a real Web3Forms key. The env var name is exactly `VITE_WEB3FORMS_FEEDBACK_KEY`.
- Web3Forms endpoint: `https://api.web3forms.com/submit`. Free-plan hCaptcha sitekey: `50b2fe65-b00b-4b9e-ad62-3ba471098be2`.
- Limits: subject ≤ 120, comment 10–2000, email ≤ 254, more than 3 URLs in the comment is rejected. Minimum fill time 3000 ms. Cooldown 60000 ms.
- The email subject sent is `[Feedback] <subject>`, and `from_name` is `Qub-its feedback`.
- Copy: Spanish on `/`, English on `/en/`. The nav label is "Feedback" in both.
- Visual language: background `#0c2420`, border `#29403d`/`#34524b`, accent `#d7ff57`, labels in `'DM Mono'`. Mobile breakpoint is `max-width:760px`.
- Match the surrounding code: `app.css` is written as dense single-line rules, and `App.svelte` uses legacy (non-runes) syntax. New components may use runes.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Whitespace-only subject or comment → treated as empty and rejected with the "required"/"too short" message, not sent.
- A comment with exactly 3 links is accepted, 4 is rejected; `https://www.example.com` counts as one link, not two.
- An email with surrounding spaces is trimmed and accepted; a malformed one is rejected, and an empty one is allowed.
- `localStorage` throws (Safari private mode, blocked storage) → the cooldown still works in memory and nothing crashes.
- Web3Forms answers HTTP 200 with `success:false` (e.g. an invalid captcha), a non-JSON body, or the network fails → the panel shows an error (Web3Forms' message when present) and keeps the typed text.

(Each of these is pinned by an assertion in Task 1's check script.)

---

### Task 1: Feedback logic module

**Files:**
- Create: `landing-page-svelte/src/lib/feedback.js`
- Test: `landing-page-svelte/scripts/check-feedback.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces (all named exports of `src/lib/feedback.js`):
  - `LIMITS = { subject: 120, messageMin: 10, messageMax: 2000, email: 254, maxLinks: 3 }`
  - `MIN_FILL_MS = 3000`, `COOLDOWN_MS = 60000`, `HCAPTCHA_SITEKEY = '50b2fe65-b00b-4b9e-ad62-3ba471098be2'`
  - `countLinks(text: string): number`
  - `validate(fields: {subject: string, message: string, email: string}, locale: 'es'|'en'): { values: {subject, message, email} (trimmed), errors: {subject?: string, message?: string, email?: string} }`
  - `isBot({ honeypot: boolean, openedAt: number, now: number }): boolean`
  - `createCooldown(storage: Storage|null, now?: () => number): { remainingMs(): number, start(): void }`
  - `buildPayload(values: {subject, message, email}, ctx: {accessKey: string, locale: string, page: string, captchaToken: string, honeypot: boolean}): object`
  - `submit(payload: object, fetchImpl?: typeof fetch): Promise<{ ok: boolean, message: string|null }>`
  - `loadHcaptcha(lang: string): Promise<HCaptcha>` (browser only; not covered by the Node checks)

- [ ] **Step 1: Write the failing check script**

Create `landing-page-svelte/scripts/check-feedback.mjs`:

```js
// Assertions for src/lib/feedback.js. Run: node scripts/check-feedback.mjs
import assert from 'node:assert/strict';
import {
  LIMITS, MIN_FILL_MS, COOLDOWN_MS, countLinks, validate, isBot, createCooldown, buildPayload, submit
} from '../src/lib/feedback.js';

const ok = { subject: 'Hola', message: 'Un comentario útil.', email: '' };

// validate: happy path and trimming
{
  const r = validate({ subject: '  Hola  ', message: '  Un comentario útil.  ', email: '  ana@example.com ' }, 'es');
  assert.deepEqual(r.errors, {});
  assert.deepEqual(r.values, { subject: 'Hola', message: 'Un comentario útil.', email: 'ana@example.com' });
}
// validate: whitespace-only is empty
{
  const r = validate({ subject: '   ', message: '          ', email: '' }, 'es');
  assert.ok(r.errors.subject);
  assert.ok(r.errors.message);
}
// validate: length limits
assert.ok(validate({ ...ok, subject: 'x'.repeat(LIMITS.subject + 1) }, 'es').errors.subject);
assert.equal(validate({ ...ok, subject: 'x'.repeat(LIMITS.subject) }, 'es').errors.subject, undefined);
assert.ok(validate({ ...ok, message: 'x'.repeat(LIMITS.messageMin - 1) }, 'es').errors.message);
assert.equal(validate({ ...ok, message: 'x'.repeat(LIMITS.messageMin) }, 'es').errors.message, undefined);
assert.ok(validate({ ...ok, message: 'x'.repeat(LIMITS.messageMax + 1) }, 'es').errors.message);
// validate: email optional, malformed rejected, too long rejected
assert.equal(validate({ ...ok, email: '' }, 'es').errors.email, undefined);
assert.ok(validate({ ...ok, email: 'not-an-email' }, 'es').errors.email);
assert.ok(validate({ ...ok, email: `${'a'.repeat(250)}@x.co` }, 'es').errors.email);
// validate: links
assert.equal(countLinks('see https://www.example.com now'), 1);
assert.equal(countLinks('a http://a.com b www.b.com c https://c.com'), 3);
const threeLinks = 'links: https://a.com https://b.com https://c.com';
assert.equal(validate({ ...ok, message: threeLinks }, 'es').errors.message, undefined);
assert.ok(validate({ ...ok, message: `${threeLinks} https://d.com` }, 'es').errors.message);
// validate: copy follows locale
assert.notEqual(validate({ ...ok, subject: '' }, 'es').errors.subject, validate({ ...ok, subject: '' }, 'en').errors.subject);

// isBot
assert.equal(isBot({ honeypot: true, openedAt: 0, now: 60000 }), true);
assert.equal(isBot({ honeypot: false, openedAt: 1000, now: 1000 + MIN_FILL_MS - 1 }), true);
assert.equal(isBot({ honeypot: false, openedAt: 1000, now: 1000 + MIN_FILL_MS }), false);

// cooldown with working storage
{
  let t = 1_000_000;
  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const c = createCooldown(storage, () => t);
  assert.equal(c.remainingMs(), 0);
  c.start();
  assert.equal(c.remainingMs(), COOLDOWN_MS);
  t += COOLDOWN_MS - 1;
  assert.equal(c.remainingMs(), 1);
  t += 1;
  assert.equal(c.remainingMs(), 0);
  // persisted: a fresh instance sees the same start time
  t = 1_000_000 + 10;
  assert.equal(createCooldown(storage, () => t).remainingMs(), COOLDOWN_MS - 10);
}
// cooldown when storage throws or is missing
for (const storage of [{ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }, null]) {
  let t = 5000;
  const c = createCooldown(storage, () => t);
  assert.equal(c.remainingMs(), 0);
  c.start();
  assert.equal(c.remainingMs(), COOLDOWN_MS);
}

// buildPayload
{
  const ctx = { accessKey: 'key-123', locale: 'en', page: 'https://www.qub-its.com/en/', captchaToken: 'tok', honeypot: false };
  const p = buildPayload({ subject: 'Bug', message: 'Something broke here.', email: '' }, ctx);
  assert.deepEqual(p, {
    access_key: 'key-123', subject: '[Feedback] Bug', from_name: 'Qub-its feedback', message: 'Something broke here.',
    language: 'en', page: 'https://www.qub-its.com/en/', botcheck: false, 'h-captcha-response': 'tok'
  });
  const withEmail = buildPayload({ subject: 'Bug', message: 'Something broke here.', email: 'ana@example.com' }, ctx);
  assert.equal(withEmail.email, 'ana@example.com');
  assert.equal(withEmail.replyto, 'ana@example.com');
}

// submit
{
  const calls = [];
  const fake = (body, status = 200) => async (url, init) => { calls.push({ url, init }); return { ok: status < 400, json: async () => body }; };
  assert.deepEqual(await submit({ a: 1 }, fake({ success: true })), { ok: true, message: null });
  assert.equal(calls[0].url, 'https://api.web3forms.com/submit');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].init.body), { a: 1 });
  assert.deepEqual(await submit({}, fake({ success: false, message: 'Captcha invalid' })), { ok: false, message: 'Captcha invalid' });
  assert.deepEqual(await submit({}, fake({ success: false, message: 'Too many' }, 429)), { ok: false, message: 'Too many' });
  const notJson = async () => ({ ok: true, json: async () => { throw new SyntaxError('bad'); } });
  assert.deepEqual(await submit({}, notJson), { ok: false, message: null });
  const offline = async () => { throw new TypeError('Failed to fetch'); };
  assert.deepEqual(await submit({}, offline), { ok: false, message: null });
}

console.log('check-feedback: all assertions passed');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/check-feedback.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/lib/feedback.js`.

- [ ] **Step 3: Implement `src/lib/feedback.js`**

```js
// Feedback form logic, kept free of DOM/Svelte so scripts/check-feedback.mjs can test it in Node.
// Spam protection that actually holds is hCaptcha, enforced by Web3Forms; the guards here only stop generic bots.
export const LIMITS = { subject: 120, messageMin: 10, messageMax: 2000, email: 254, maxLinks: 3 };
export const MIN_FILL_MS = 3000;
export const COOLDOWN_MS = 60000;
export const HCAPTCHA_SITEKEY = '50b2fe65-b00b-4b9e-ad62-3ba471098be2';

const ENDPOINT = 'https://api.web3forms.com/submit';
const COOLDOWN_KEY = 'qubits-feedback-sent-at';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorCopy = {
  es: {
    subjectRequired: 'Escribe un asunto.',
    subjectLong: `El asunto admite hasta ${LIMITS.subject} caracteres.`,
    messageShort: `El comentario necesita al menos ${LIMITS.messageMin} caracteres.`,
    messageLong: `El comentario admite hasta ${LIMITS.messageMax} caracteres.`,
    tooManyLinks: `Demasiados enlaces: máximo ${LIMITS.maxLinks}.`,
    emailInvalid: 'Revisa el email.'
  },
  en: {
    subjectRequired: 'Add a subject.',
    subjectLong: `The subject allows up to ${LIMITS.subject} characters.`,
    messageShort: `The comment needs at least ${LIMITS.messageMin} characters.`,
    messageLong: `The comment allows up to ${LIMITS.messageMax} characters.`,
    tooManyLinks: `Too many links: ${LIMITS.maxLinks} at most.`,
    emailInvalid: 'Check the email address.'
  }
};

export const countLinks = (text) => (text.match(/\b(?:https?:\/\/|www\.)\S+/gi) || []).length;

export function validate({ subject, message, email }, locale) {
  const t = errorCopy[locale] || errorCopy.es;
  const values = { subject: subject.trim(), message: message.trim(), email: email.trim() };
  const errors = {};
  if (!values.subject) errors.subject = t.subjectRequired;
  else if (values.subject.length > LIMITS.subject) errors.subject = t.subjectLong;
  if (values.message.length < LIMITS.messageMin) errors.message = t.messageShort;
  else if (values.message.length > LIMITS.messageMax) errors.message = t.messageLong;
  else if (countLinks(values.message) > LIMITS.maxLinks) errors.message = t.tooManyLinks;
  if (values.email && (values.email.length > LIMITS.email || !EMAIL_RE.test(values.email))) errors.email = t.emailInvalid;
  return { values, errors };
}

export const isBot = ({ honeypot, openedAt, now }) => honeypot || now - openedAt < MIN_FILL_MS;

export function createCooldown(storage, now = () => Date.now()) {
  let sentAt = 0;
  const read = () => {
    try {
      return Number(storage?.getItem(COOLDOWN_KEY)) || sentAt;
    } catch {
      return sentAt;
    }
  };
  return {
    remainingMs: () => Math.max(0, read() + COOLDOWN_MS - now()),
    start() {
      sentAt = now();
      try {
        storage?.setItem(COOLDOWN_KEY, String(sentAt));
      } catch {
        // Storage blocked (e.g. private mode): the in-memory value still applies for this page.
      }
    }
  };
}

export function buildPayload({ subject, message, email }, { accessKey, locale, page, captchaToken, honeypot }) {
  const payload = {
    access_key: accessKey,
    subject: `[Feedback] ${subject}`,
    from_name: 'Qub-its feedback',
    message,
    language: locale,
    page,
    botcheck: honeypot,
    'h-captcha-response': captchaToken
  };
  if (email) Object.assign(payload, { email, replyto: email });
  return payload;
}

export async function submit(payload, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) return { ok: true, message: null };
    return { ok: false, message: typeof data?.message === 'string' ? data.message : null };
  } catch {
    return { ok: false, message: null };
  }
}

let hcaptchaLoading = null;
export function loadHcaptcha(lang) {
  if (window.hcaptcha) return Promise.resolve(window.hcaptcha);
  hcaptchaLoading ??= new Promise((resolve, reject) => {
    const callback = '__qubitsHcaptchaReady';
    window[callback] = () => resolve(window.hcaptcha);
    const script = document.createElement('script');
    script.src = `https://js.hcaptcha.com/1/api.js?render=explicit&onload=${callback}&hl=${lang}`;
    script.async = true;
    script.onerror = () => {
      hcaptchaLoading = null;
      script.remove();
      reject(new Error('hCaptcha failed to load'));
    };
    document.head.appendChild(script);
  });
  return hcaptchaLoading;
}
```

- [ ] **Step 4: Run the check to verify it passes**

Run: `node scripts/check-feedback.mjs`
Expected: `check-feedback: all assertions passed`

- [ ] **Step 5: Commit**

```bash
git add src/lib/feedback.js scripts/check-feedback.mjs
git commit -m "feat: add feedback form logic with anti-spam guards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Feedback panel component and wiring

**Files:**
- Create: `landing-page-svelte/src/lib/FeedbackPanel.svelte`
- Create: `landing-page-svelte/.env.example`
- Modify: `landing-page-svelte/src/App.svelte` (script block top; nav in the `site-header` line ~130; after the `<footer>` line ~137, before `{/if}`)
- Modify: `landing-page-svelte/src/app.css` (append at end)
- Modify: `AGENTS.md` (append a section; repo root)

**Interfaces:**
- Consumes from Task 1: `validate`, `isBot`, `createCooldown`, `buildPayload`, `submit`, `loadHcaptcha`, `LIMITS`, `HCAPTCHA_SITEKEY` from `./feedback.js`.
- Produces: `<FeedbackPanel locale="es"|"en" accessKey={string} />`, which exposes `open(): void` through `bind:this`.

- [ ] **Step 1: Create `src/lib/FeedbackPanel.svelte`**

```svelte
<script>
  import { validate, isBot, createCooldown, buildPayload, submit, loadHcaptcha, LIMITS, HCAPTCHA_SITEKEY } from './feedback.js';

  let { locale = 'es', accessKey } = $props();

  const copy = {
    es: {
      title: 'Envíanos tu feedback', intro: 'Ideas, errores o comentarios: todo nos ayuda a mejorar.', close: 'Cerrar',
      subject: 'Asunto', message: 'Comentario', email: 'Email (opcional)', emailHint: 'Solo si quieres que te respondamos.',
      send: 'Enviar', sending: 'Enviando…', success: '¡Gracias! Recibimos tu feedback.',
      genericError: 'No pudimos enviar tu mensaje. Inténtalo de nuevo.', captchaRequired: 'Completa la verificación.',
      captchaFailed: 'No se pudo cargar la verificación.', retry: 'Reintentar',
      cooldown: (s) => `Podrás enviar otro mensaje en ${s} s.`
    },
    en: {
      title: 'Send us your feedback', intro: 'Ideas, bugs or comments: it all helps us improve.', close: 'Close',
      subject: 'Subject', message: 'Comment', email: 'Email (optional)', emailHint: 'Only if you want a reply.',
      send: 'Send', sending: 'Sending…', success: 'Thank you! We got your feedback.',
      genericError: 'We could not send your message. Please try again.', captchaRequired: 'Complete the verification.',
      captchaFailed: 'The verification could not load.', retry: 'Retry',
      cooldown: (s) => `You can send another message in ${s} s.`
    }
  };
  const t = $derived(copy[locale] || copy.es);

  let dialog;
  let captchaEl;
  let subject = $state('');
  let message = $state('');
  let email = $state('');
  let honeypot = $state(false);
  let errors = $state({});
  let status = $state('idle'); // idle | sending | success | error
  let errorMessage = $state('');
  let captchaToken = $state('');
  let captchaFailed = $state(false);
  let cooldownLeft = $state(0);
  let openedAt = 0;
  let widgetId = null;
  let closeTimer;
  let cooldownTimer;

  let storage = null;
  try { storage = window.localStorage; } catch { storage = null; }
  const cooldown = createCooldown(storage);

  export function open() {
    clearTimeout(closeTimer);
    if (status === 'success') resetForm();
    openedAt = Date.now();
    dialog.showModal();
    refreshCooldown();
    renderCaptcha();
  }

  async function renderCaptcha() {
    if (widgetId !== null) return;
    captchaFailed = false;
    try {
      const hcaptcha = await loadHcaptcha(locale);
      if (widgetId !== null) return;
      widgetId = hcaptcha.render(captchaEl, {
        sitekey: HCAPTCHA_SITEKEY,
        theme: 'dark',
        callback: (token) => { captchaToken = token; if (errors.captcha) errors = { ...errors, captcha: undefined }; },
        'expired-callback': () => { captchaToken = ''; },
        'error-callback': () => { captchaToken = ''; }
      });
    } catch {
      captchaFailed = true;
    }
  }

  function resetCaptcha() {
    captchaToken = '';
    if (widgetId !== null) window.hcaptcha?.reset(widgetId);
  }

  function refreshCooldown() {
    clearInterval(cooldownTimer);
    const tickCooldown = () => {
      cooldownLeft = Math.ceil(cooldown.remainingMs() / 1000);
      if (!cooldownLeft) clearInterval(cooldownTimer);
    };
    tickCooldown();
    if (cooldownLeft) cooldownTimer = setInterval(tickCooldown, 1000);
  }

  function resetForm() {
    subject = ''; message = ''; email = ''; honeypot = false;
    errors = {}; status = 'idle'; errorMessage = '';
  }

  function showSuccess() {
    status = 'success';
    closeTimer = setTimeout(() => dialog.close(), 3000);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (status === 'sending' || cooldownLeft > 0) return;
    const result = validate({ subject, message, email }, locale);
    errors = result.errors;
    if (Object.keys(errors).length) return;
    // Bots get a fake success and no request, so they learn nothing.
    if (isBot({ honeypot, openedAt, now: Date.now() })) return showSuccess();
    if (!captchaToken) { errors = { captcha: t.captchaRequired }; return; }
    status = 'sending';
    errorMessage = '';
    const res = await submit(buildPayload(result.values, { accessKey, locale, page: window.location.href, captchaToken, honeypot }));
    resetCaptcha();
    if (res.ok) {
      cooldown.start();
      refreshCooldown();
      showSuccess();
    } else {
      status = 'error';
      errorMessage = res.message || t.genericError;
    }
  }
</script>

<!-- Backdrop click closes; Esc is handled natively by <dialog>. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} class="feedback-dialog" aria-labelledby="feedback-title" onclick={(e) => { if (e.target === dialog) dialog.close(); }} onclose={() => clearTimeout(closeTimer)}>
  <form class="feedback-form" novalidate onsubmit={handleSubmit}>
    <div class="feedback-head">
      <h2 id="feedback-title">{t.title}</h2>
      <button type="button" class="feedback-close" aria-label={t.close} onclick={() => dialog.close()}>×</button>
    </div>
    {#if status === 'success'}<p class="feedback-success" role="status">{t.success}</p>{/if}
    <div class="feedback-fields" hidden={status === 'success'}>
      <p class="feedback-intro">{t.intro}</p>
      <label for="fb-subject">{t.subject}</label>
      <input id="fb-subject" name="subject" autocomplete="off" maxlength={LIMITS.subject} bind:value={subject} aria-invalid={!!errors.subject} aria-describedby={errors.subject ? 'fb-subject-error' : undefined} />
      {#if errors.subject}<p class="feedback-error" id="fb-subject-error" role="alert">{errors.subject}</p>{/if}
      <label for="fb-message">{t.message}</label>
      <textarea id="fb-message" name="message" rows="6" maxlength={LIMITS.messageMax} bind:value={message} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'fb-message-error fb-message-count' : 'fb-message-count'}></textarea>
      <p class="feedback-count" id="fb-message-count">{message.length}/{LIMITS.messageMax}</p>
      {#if errors.message}<p class="feedback-error" id="fb-message-error" role="alert">{errors.message}</p>{/if}
      <label for="fb-email">{t.email}</label>
      <input id="fb-email" name="email" type="email" autocomplete="email" maxlength={LIMITS.email} bind:value={email} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'fb-email-error fb-email-hint' : 'fb-email-hint'} />
      <p class="feedback-hint" id="fb-email-hint">{t.emailHint}</p>
      {#if errors.email}<p class="feedback-error" id="fb-email-error" role="alert">{errors.email}</p>{/if}
      <label class="feedback-hp" aria-hidden="true">Do not check<input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" bind:checked={honeypot} /></label>
      <div class="feedback-captcha" bind:this={captchaEl}></div>
      {#if captchaFailed}<p class="feedback-error" role="alert">{t.captchaFailed} <button type="button" class="feedback-link" onclick={renderCaptcha}>{t.retry}</button></p>{/if}
      {#if errors.captcha}<p class="feedback-error" role="alert">{errors.captcha}</p>{/if}
      <p class="feedback-status" aria-live="polite">{status === 'error' ? errorMessage : cooldownLeft ? t.cooldown(cooldownLeft) : ''}</p>
      <button type="submit" class="button feedback-submit" disabled={status === 'sending' || !captchaToken || cooldownLeft > 0}>{status === 'sending' ? t.sending : t.send}</button>
    </div>
  </form>
</dialog>
```

- [ ] **Step 2: Wire it into `src/App.svelte`**

At the top of the `<script>` block, after `import { seo, siteUrl } from './seo.js';`, add:

```js
  import FeedbackPanel from './lib/FeedbackPanel.svelte';
```

After `let menuOpen = false;`, add:

```js
  // Web3Forms keys are public by design, but keep it out of git: set it in Vercel / .env.local.
  const feedbackKey = import.meta.env.VITE_WEB3FORMS_FEEDBACK_KEY;
  let feedbackPanel;
```

In the `site-header` line, insert the button right before `<a class="language-switch" href={languageTarget}`:

```svelte
{#if feedbackKey}<button class="nav-feedback" type="button" onclick={() => { menuOpen = false; feedbackPanel.open(); }}>Feedback</button>{/if}
```

After the `<footer>…</footer>` line and before the final `{/if}`, add:

```svelte
  {#if feedbackKey}<FeedbackPanel bind:this={feedbackPanel} {locale} accessKey={feedbackKey} />{/if}
```

- [ ] **Step 3: Append the styles to `src/app.css`**

Append as one new line at the end of the file:

```css
.nav-feedback{background:none;border:0;padding:0;color:inherit;font:inherit;cursor:pointer}.nav-feedback:hover{color:#d7ff57}.feedback-dialog{margin:0 0 0 auto;height:100%;max-height:none;width:min(440px,100%);max-width:none;border:0;border-left:1px solid #29403d;background:#0c2420;color:#eff4f4;padding:28px;overflow-y:auto}.feedback-dialog::backdrop{background:#081413b3}.feedback-head{display:flex;align-items:center;justify-content:space-between;gap:16px}.feedback-head h2{margin:0;font-size:24px;letter-spacing:-.04em}.feedback-close{background:none;border:1px solid #34524b;color:#eff4f4;width:36px;height:36px;font-size:20px;cursor:pointer}.feedback-close:hover{border-color:#d7ff57;color:#d7ff57}.feedback-intro,.feedback-hint,.feedback-count{color:#a8c3ba;font-size:13px;line-height:1.5;margin:6px 0 0}.feedback-intro{margin:12px 0 22px}.feedback-count{text-align:right}.feedback-form label{display:block;margin-top:18px;font:500 11px 'DM Mono';letter-spacing:.08em;text-transform:uppercase;color:#a8c3ba}.feedback-form input:not([type=checkbox]),.feedback-form textarea{display:block;width:100%;margin-top:8px;background:#081413;border:1px solid #34524b;color:#eff4f4;padding:12px;font:15px/1.5 Manrope,Arial,sans-serif;resize:vertical}.feedback-form input:focus-visible,.feedback-form textarea:focus-visible,.feedback-dialog button:focus-visible{outline:2px solid #d7ff57;outline-offset:2px}.feedback-form [aria-invalid=true]{border-color:#ff8a7a}.feedback-error{color:#ff8a7a;font-size:13px;margin:6px 0 0}.feedback-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}.feedback-captcha{margin-top:22px;min-height:78px}.feedback-status{min-height:20px;color:#a8c3ba;font-size:13px;margin:12px 0}.feedback-submit{border:0;cursor:pointer;font-family:inherit}.feedback-submit:disabled{opacity:.45;cursor:not-allowed}.feedback-success{color:#d7ff57;font-size:18px;margin:28px 0}.feedback-link{background:none;border:0;padding:0;color:#d7ff57;text-decoration:underline;cursor:pointer;font:inherit}@media(max-width:760px){.feedback-dialog{margin:auto 0 0;width:100%;height:auto;max-height:90vh;border-left:0;border-top:1px solid #29403d;padding:22px 20px}}
```

- [ ] **Step 4: Add `.env.example` and the AGENTS.md section**

Create `landing-page-svelte/.env.example`:

```
# Web3Forms access key for the feedback panel (feedback-only key with hCaptcha enabled).
# Copy to .env.local (gitignored) for local dev; set it in Vercel for Preview and Production.
VITE_WEB3FORMS_FEEDBACK_KEY=
```

Append to `AGENTS.md` (repo root):

```markdown

## Feedback Panel

The Svelte landing has a "Feedback" button in the header (`src/lib/FeedbackPanel.svelte`, logic in `src/lib/feedback.js`) that submits to Web3Forms.

- Key: `VITE_WEB3FORMS_FEEDBACK_KEY` (Vercel env vars, or `landing-page-svelte/.env.local`). Without it, the button is not rendered. Never commit the key.
- Use a dedicated feedback key with **hCaptcha enabled** in the Web3Forms dashboard — it is the only anti-spam layer a direct API caller cannot skip. Rotate the key if it gets abused.
- Logic checks: `node scripts/check-feedback.mjs` (from `landing-page-svelte/`).
```

- [ ] **Step 5: Build with and without a key**

Run:
```bash
PATH=~/.nvm/versions/node/v22.22.1/bin:$PATH npm run build 2>&1 | grep -iE "warn|error|built"
```
Expected: `✓ built`, with no Svelte warnings about `FeedbackPanel`. The hidden-without-key behavior is checked in Task 3.

Then:
```bash
PATH=~/.nvm/versions/node/v22.22.1/bin:$PATH VITE_WEB3FORMS_FEEDBACK_KEY=test-key npm run build 2>&1 | grep -iE "warn|error|built"; grep -c "test-key" dist/assets/*.js
```
Expected: `✓ built`, and the grep count is ≥ 1.

- [ ] **Step 6: Commit**

```bash
git add src/lib/FeedbackPanel.svelte src/App.svelte src/app.css .env.example ../AGENTS.md
git commit -m "feat: add feedback panel to landing navigation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Browser verification

**Files:**
- Create (throwaway, NOT committed): `$TMPDIR/feedback-e2e.mjs`

**Interfaces:**
- Consumes: the built `dist/` from Task 2, plus the DOM contract from Task 2: `.nav-feedback`, `dialog.feedback-dialog`, `#fb-subject`, `#fb-message`, `#fb-email`, `input[name=botcheck]`, `form.feedback-form`, `.feedback-success`.
- Produces: nothing (verification only).

- [ ] **Step 1: Build with a fake key and serve `dist/`**

```bash
PATH=~/.nvm/versions/node/v22.22.1/bin:$PATH VITE_WEB3FORMS_FEEDBACK_KEY=test-key npm run build >/dev/null
(cd dist && python3 -m http.server 8766 >/dev/null 2>&1 &)
```

- [ ] **Step 2: Write the CDP driver**

Create `$TMPDIR/feedback-e2e.mjs` (Node 22 has a global `WebSocket`):

```js
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--disable-gpu', '--remote-debugging-port=9333', '--user-data-dir=' + process.env.TMPDIR + '/fb-chrome', 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch('http://127.0.0.1:9333/json')).json()).find((t) => t.type === 'page'); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); pending.get(m.id)?.(m); pending.delete(m.id); });
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.result.value;
const load = async (url) => { await send('Page.navigate', { url }); await sleep(1500); };

// Count requests to Web3Forms by wrapping fetch before the app runs.
await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__w3f=0;const f=window.fetch;window.fetch=(u,...a)=>{if(String(u).includes('web3forms'))window.__w3f++;return f(u,...a)};` });
const fill = `(() => { const set = (sel, v) => { const el = document.querySelector(sel); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  set('#fb-subject', 'Prueba'); set('#fb-message', 'Un comentario de prueba suficiente.'); })()`;

for (const [url, label] of [['http://localhost:8766/', 'Feedback'], ['http://localhost:8766/en/', 'Feedback']]) {
  await load(url);
  assert.equal(await evaluate(`document.querySelector('.nav-feedback')?.textContent`), label, 'nav button renders');
  await evaluate(`document.querySelector('.nav-feedback').click()`);
  assert.equal(await evaluate(`document.querySelector('dialog.feedback-dialog').open`), true, 'dialog opens');
  assert.equal(await evaluate(`document.querySelector('dialog.feedback-dialog').contains(document.activeElement)`), true, 'focus inside dialog');
  const title = await evaluate(`document.querySelector('#feedback-title').textContent`);
  assert.equal(title, url.includes('/en/') ? 'Send us your feedback' : 'Envíanos tu feedback', 'copy matches locale');
  // Validation: empty submit shows errors and sends nothing
  await evaluate(`document.querySelector('form.feedback-form').requestSubmit()`);
  assert.ok(await evaluate(`document.querySelectorAll('.feedback-error').length`) >= 2, 'validation errors shown');
  // Fast submit (< 3 s after open) → fake success, no request
  await evaluate(fill);
  await evaluate(`document.querySelector('form.feedback-form').requestSubmit()`);
  await sleep(200);
  assert.ok(await evaluate(`!!document.querySelector('.feedback-success')`), 'fake success shown to fast bot');
  assert.equal(await evaluate('window.__w3f'), 0, 'no request for fast submit');
  // Esc closes
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(200);
  assert.equal(await evaluate(`document.querySelector('dialog.feedback-dialog').open`), false, 'Esc closes dialog');
  // Honeypot after the minimum time → fake success, no request
  await evaluate(`document.querySelector('.nav-feedback').click()`);
  await sleep(3200);
  await evaluate(fill);
  await evaluate(`(() => { const hp = document.querySelector('input[name=botcheck]'); hp.checked = true; hp.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await evaluate(`document.querySelector('form.feedback-form').requestSubmit()`);
  await sleep(200);
  assert.ok(await evaluate(`!!document.querySelector('.feedback-success')`), 'fake success shown to honeypot bot');
  assert.equal(await evaluate('window.__w3f'), 0, 'no request for honeypot submit');
  console.log('ok', url);
}
// Screenshots: desktop right panel and mobile bottom sheet
for (const [w, h, mobile, name] of [[1400, 900, false, 'desktop'], [390, 844, true, 'mobile']]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await load('http://localhost:8766/');
  if (mobile) await evaluate(`document.querySelector('.menu-button').click()`);
  await evaluate(`document.querySelector('.nav-feedback').click()`);
  await sleep(1500);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  (await import('node:fs')).writeFileSync(`${process.env.TMPDIR}/feedback-${name}.png`, Buffer.from(shot.result.data, 'base64'));
}
ws.close(); chrome.kill();
console.log('feedback-e2e: all checks passed');
```

- [ ] **Step 3: Run it**

Run: `PATH=~/.nvm/versions/node/v22.22.1/bin:$PATH node $TMPDIR/feedback-e2e.mjs`
Expected: `ok http://localhost:8766/`, `ok http://localhost:8766/en/`, `feedback-e2e: all checks passed`.

- [ ] **Step 4: Verify the button is hidden without a key, and take screenshots**

```bash
PATH=~/.nvm/versions/node/v22.22.1/bin:$PATH npm run build >/dev/null
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --virtual-time-budget=3000 --dump-dom http://localhost:8766/ 2>/dev/null | grep -c 'nav-feedback'
```
Expected: `0`.

Open `$TMPDIR/feedback-desktop.png` and `$TMPDIR/feedback-mobile.png`, written by Step 3, with the Read tool. Visually confirm the right-side panel on desktop and the bottom sheet on mobile: the landing's colors, readable labels, the captcha area, and no horizontal overflow.

- [ ] **Step 5: Clean up**

```bash
pkill -f "http.server 8766"; PATH=~/.nvm/versions/node/v22.22.1/bin:$PATH npm run build >/dev/null; node scripts/check-feedback.mjs
```
Expected: the final `dist/` is built without the fake key, and the check passes. No commit is needed for this task. If a check failed and code changed, commit that fix with a `fix:` message.

---

## Manual follow-up (user)

1. Create a feedback-only key at web3forms.com that delivers to team@qub-its.com, and enable hCaptcha for it.
2. Add `VITE_WEB3FORMS_FEEDBACK_KEY` in Vercel (Preview + Production), then redeploy.
3. On the preview deploy, send one real feedback with the captcha solved and confirm the email arrives.
