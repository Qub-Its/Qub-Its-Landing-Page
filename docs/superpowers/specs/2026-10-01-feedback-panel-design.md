# Feedback panel — design

Date: 2026-10-01
Status: approved in conversation, pending written-spec review

## Goal

Let visitors of the Qub-its landing send feedback from the top navigation: a small panel with
subject, comment and an optional email. Submissions reach the team by email. The form must resist
spam and abuse without adding backend infrastructure to the static site.

## Decisions

| Topic | Decision | Reason |
|---|---|---|
| Delivery | Web3Forms, submitted from the browser | No backend; the previous HTML site already used it. The free plan only accepts browser-side submissions, which rules out a proxy function. |
| Access key | New key dedicated to feedback | Can be rotated if abused without affecting other forms; separate inbox filtering and quota. |
| Key storage | `VITE_WEB3FORMS_FEEDBACK_KEY` env var (Vercel + `.env.local`) | Never committed. It still ships in the JS bundle — Web3Forms keys are public by design. |
| Spam protection | hCaptcha (enforced by Web3Forms) + client-side layers | hCaptcha is the only layer an attacker who calls the API directly cannot skip; free plan supports it. |
| Fields | Subject (required), comment (required), email (optional) | Optional email allows a reply without forcing it. |
| Scope | Landing (`/` and `/en/`) only | MCDU trainer is out of scope. |

## User interface

- **Nav item:** "Feedback" (same word in ES and EN) in the site header, placed before the ES/EN
  switch. It appears in the mobile hamburger menu too. It is a `<button>`, not a link.
- **Hidden without key:** if `VITE_WEB3FORMS_FEEDBACK_KEY` is empty at build time, the nav item and
  panel are not rendered.
- **Panel:** native `<dialog>` opened with `showModal()` (focus trap, Esc to close, backdrop).
  Desktop: a panel anchored to the right edge. ≤760px: a bottom sheet. Visual language of the
  landing: background `#0c2420`, border `#29403d`, accent `#d7ff57`, labels in DM Mono.
  Closing: Esc, a close button, or a click on the backdrop.
- **Fields:**
  - Subject — `required`, `maxlength=120`.
  - Comment — `required`, 10–2000 characters, `maxlength=2000`, live character counter.
  - Email — optional, `type=email`, `maxlength=254`.
  - hCaptcha widget.
  - Submit button.
- **States:**
  - `idle`
  - `sending` — button disabled, label "Enviando…" / "Sending…"
  - `success` — thank-you message; the form resets and the dialog closes after 3 s
  - `error` — inline message, form content kept, retry allowed
  - Validation errors show inline next to the field and are announced via `aria-live`.
- **Copy:** Spanish on `/`, English on `/en/`, following the existing `isEnglish` logic.

## Email sent to the team

- Web3Forms `subject`: `[Feedback] <subject>`.
- `from_name`: `Qub-its feedback`.
- Body fields: `subject`, `message`, `email` (when present, also sent as `replyto`), `language`
  (`es`/`en`), `page` (`location.href`).
- Control fields: `access_key`, `botcheck`, `h-captcha-response` (the hCaptcha token, required by
  Web3Forms once hCaptcha is enabled for the key).

## Anti-spam and abuse layers

From strongest to weakest:

1. **hCaptcha, enforced server-side.** Enabled in the Web3Forms dashboard for the feedback key, so
   Web3Forms rejects any submission without a valid token — including scripts that call the API
   directly with the public key.
   - Widget: Web3Forms' free-plan sitekey `50b2fe65-b00b-4b9e-ad62-3ba471098be2`.
   - The hCaptcha script loads lazily on first panel open, keeping it off the initial page load.
   - The submit button stays disabled until a token exists.
   - The captcha resets after every submit attempt.
2. **Web3Forms built-in spam filter:** always on, no configuration.
3. **Honeypot `botcheck`:** a checkbox moved off-screen (not `display:none`), with `tabindex=-1`,
   `aria-hidden="true"` and `autocomplete="off"`. If it is checked, nothing is sent. The field is
   also posted, so Web3Forms discards it if a bot bypasses our JS.
4. **Minimum fill time:** the timestamp is taken when the panel opens. A submit in under 3 s is
   dropped without sending, and a fake success is shown so the bot gets no signal.
5. **Cooldown:** 60 s after a successful send, during which the button is disabled and shows the
   remaining time. Stored in `localStorage` (wrapped in try/catch) with an in-memory fallback.
6. **Validation:** fields are trimmed, lengths enforced in HTML and JS, and a comment with more than
   3 URLs is rejected ("demasiados enlaces" / "too many links").
7. **No HTML injection:** values are sent as JSON and never inserted into our DOM as HTML.

### Known limits

- Layers 3–6 stop generic bots only. A targeted attacker skips them by calling Web3Forms directly;
  hCaptcha is what stops them.
- Someone solving captchas by hand or through a paid service can still exhaust the free quota of
  250 submissions per month. Response: rotate the key, or upgrade to Web3Forms Pro (trusted
  domains + Turnstile).
- DDoS: the form adds no endpoint of ours. Requests go to Web3Forms; the static site stays behind
  Vercel's edge and Firewall, which is already active.

## Architecture

| File | Change |
|---|---|
| `landing-page-svelte/src/lib/feedback.js` | New. Pure logic with no DOM or Svelte imports: `validate(fields, locale)`, `isBot({ honeypot, openedAt, now })`, cooldown read/write with an injectable storage, `buildPayload(fields, ctx)`, `submit(payload, fetchImpl)`. Also `loadHcaptcha(lang)`, which injects hCaptcha's explicit-render API (`https://js.hcaptcha.com/1/api.js?render=explicit`) once and returns a promise. The panel calls `hcaptcha.render()` with the Web3Forms free sitekey, so it controls the token, reset and error callbacks. |
| `landing-page-svelte/src/lib/FeedbackPanel.svelte` | New. Dialog, form, states and ES/EN copy. Props: `locale`, `accessKey`. Exposes `open()`. |
| `landing-page-svelte/src/App.svelte` | Feedback nav button (only when a key is present), mounts `FeedbackPanel`, closes the mobile menu on open. |
| `landing-page-svelte/src/app.css` | Panel, nav-button and form styles, including the ≤760px bottom sheet. |
| `landing-page-svelte/.env.example` | New: `VITE_WEB3FORMS_FEEDBACK_KEY=`. |
| `AGENTS.md` | Feedback section: env var, enable hCaptcha in the dashboard, never commit the key. |
| `landing-page-svelte/scripts/check-feedback.mjs` | New. Node assertions for `feedback.js`. |

Data flow:

1. Nav click → `open()` → record `openedAt` → `showModal()` → `loadHcaptcha(locale)` → `hcaptcha.render()` (first open only).
2. Submit → `validate` → `isBot` → cooldown check → hCaptcha token check → `buildPayload` →
   `submit`.
3. `submit` makes `fetch('https://api.web3forms.com/submit')` with a JSON body. On
   `success: true` → success state and cooldown starts. Otherwise → error state with Web3Forms'
   message when available, or a generic one.

Error handling:

- Network failure or non-JSON response → generic error. The form keeps its content.
- hCaptcha script fails to load → error "No se pudo cargar la verificación" with a retry button;
  submitting is not possible.
- Missing key → feature hidden (see UI).

## Testing

There is no test framework and none is added.

- `node scripts/check-feedback.mjs` asserts:
  - validation limits and the URL count;
  - the honeypot and minimum-time guards;
  - cooldown expiry, using a fake clock and storage;
  - the payload shape (`[Feedback]` prefix, `replyto` only when an email exists);
  - `submit` handling success, an error response and a network failure, using a fake `fetch`.
- Headless Chrome against a build with a fake key:
  - the nav item renders;
  - the dialog opens and closes with Esc;
  - focus stays inside the dialog;
  - a fast submit and a honeypot submit send no request;
  - the ES and EN copy is correct.
- A build without the key renders no Feedback item.
- A real submission is verified by the user on a Vercel preview deploy, since it needs the real key
  and a human-solved captcha.

## User setup (outside the codebase)

1. Create a new access key at web3forms.com, delivering to team@qub-its.com.
2. In that key's settings, enable hCaptcha as the required captcha.
3. Add `VITE_WEB3FORMS_FEEDBACK_KEY` to Vercel (Production and Preview), then redeploy.
4. For local development, put the key in `landing-page-svelte/.env.local`.
