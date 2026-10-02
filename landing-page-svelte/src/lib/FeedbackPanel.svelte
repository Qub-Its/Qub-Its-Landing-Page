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
  let isOpen = $state(false);
  let openedAt = 0;
  let returnFocus = null;
  let widgetId = null;
  let closeTimer;
  let cooldownTimer;

  let storage = null;
  try { storage = window.localStorage; } catch { storage = null; }
  const cooldown = createCooldown(storage);

  export function open() {
    clearTimeout(closeTimer);
    if (status === 'success') resetForm();
    // Keep the bot timer from the first open while the user still has text typed, so reopening and sending
    // right away is not mistaken for a bot.
    if (!subject && !message && !email) openedAt = Date.now();
    returnFocus = document.activeElement;
    // Non-modal on purpose: showModal() makes everything outside the dialog inert, including the hCaptcha
    // challenge popup that hCaptcha appends to <body>. The backdrop, Esc and the focus trap are handled here.
    dialog.show();
    isOpen = true;
    dialog.querySelector('#fb-subject')?.focus();
    refreshCooldown();
    renderCaptcha();
  }

  function close() {
    dialog.close();
  }

  function handleClose() {
    isOpen = false;
    clearTimeout(closeTimer);
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  // On window, not the dialog: focus can sit outside it (e.g. inside the hCaptcha challenge).
  function handleWindowKeydown(event) {
    if (isOpen && event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button, input, textarea, iframe')].filter(
      (el) => !el.disabled && el.tabIndex >= 0 && el.offsetParent !== null
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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
    dialog.querySelector('.feedback-close')?.focus();
    closeTimer = setTimeout(close, 3000);
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

<svelte:window onkeydown={handleWindowKeydown} />
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="feedback-backdrop" hidden={!isOpen} onclick={close}></div>
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} class="feedback-dialog" aria-modal="true" aria-labelledby="feedback-title" onkeydown={trapFocus} onclose={handleClose}>
  <form class="feedback-form" novalidate onsubmit={handleSubmit}>
    <div class="feedback-head">
      <h2 id="feedback-title">{t.title}</h2>
      <button type="button" class="feedback-close" aria-label={t.close} onclick={close}>×</button>
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
