// Feedback panel shared by the MCDU and PFD trainers (Web3Forms). Call mountFeedback({ key }) once the page has a
// hidden #feedbackBtn; without a key (VITE_WEB3FORMS_FEEDBACK_KEY unset) it does nothing and the button stays hidden.
import { validate, isBot, createCooldown, buildPayload, submit, loadHcaptcha, LIMITS, HCAPTCHA_SITEKEY } from './feedback.js';

const LANG = /^\/en(\/|$)/.test(location.pathname) || new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'es';
const copy = {
  es: {
    title: 'Envíanos tu feedback', intro: 'Ideas, errores o comentarios sobre el entrenador: todo nos ayuda a mejorar.', close: 'Cerrar',
    subject: 'Asunto', message: 'Comentario', email: 'Email (opcional)', emailHint: 'Solo si quieres que te respondamos.',
    send: 'Enviar', sending: 'Enviando…', success: '¡Gracias! Recibimos tu feedback.',
    genericError: 'No pudimos enviar tu mensaje. Inténtalo de nuevo.', captchaRequired: 'Completa la verificación.',
    captchaFailed: 'No se pudo cargar la verificación.', retry: 'Reintentar',
    cooldown: (s) => `Podrás enviar otro mensaje en ${s} s.`
  },
  en: {
    title: 'Send us your feedback', intro: 'Ideas, bugs or comments about the trainer: it all helps us improve.', close: 'Close',
    subject: 'Subject', message: 'Comment', email: 'Email (optional)', emailHint: 'Only if you want a reply.',
    send: 'Send', sending: 'Sending…', success: 'Thank you! We got your feedback.',
    genericError: 'We could not send your message. Please try again.', captchaRequired: 'Complete the verification.',
    captchaFailed: 'The verification could not load.', retry: 'Retry',
    cooldown: (s) => `You can send another message in ${s} s.`
  }
};
const t = copy[LANG];

/** Wires #feedbackBtn to the feedback dialog. No-op without a key or without the button. */
export function mountFeedback({ key } = {}) {
  const accessKey = (key || '').trim();
  const openButton = document.getElementById('feedbackBtn');
  if (accessKey && openButton) init(accessKey, openButton);
}

function init(accessKey, openButton) {
  document.body.insertAdjacentHTML('beforeend', `
<div class="fb-backdrop" id="fbBackdrop" hidden></div>
<dialog class="fb-dialog" id="fbDialog" aria-modal="true" aria-labelledby="fbTitle">
  <form class="fb-form" novalidate>
    <div class="fb-head"><h2 id="fbTitle">${t.title}</h2><button type="button" class="fb-close" aria-label="${t.close}">×</button></div>
    <p class="fb-success" role="status" hidden>${t.success}</p>
    <div class="fb-fields">
      <p class="fb-intro">${t.intro}</p>
      <label for="fb-subject">${t.subject}</label>
      <input id="fb-subject" name="subject" autocomplete="off" maxlength="${LIMITS.subject}">
      <p class="fb-error" id="fb-subject-error" role="alert" hidden></p>
      <label for="fb-message">${t.message}</label>
      <textarea id="fb-message" name="message" rows="6" maxlength="${LIMITS.messageMax}" aria-describedby="fb-message-count"></textarea>
      <p class="fb-count" id="fb-message-count">0/${LIMITS.messageMax}</p>
      <p class="fb-error" id="fb-message-error" role="alert" hidden></p>
      <label for="fb-email">${t.email}</label>
      <input id="fb-email" name="email" type="email" autocomplete="email" maxlength="${LIMITS.email}" aria-describedby="fb-email-hint">
      <p class="fb-hint" id="fb-email-hint">${t.emailHint}</p>
      <p class="fb-error" id="fb-email-error" role="alert" hidden></p>
      <label class="fb-hp" aria-hidden="true">Do not check<input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off"></label>
      <div class="fb-captcha"></div>
      <p class="fb-error" id="fb-captcha-error" role="alert" hidden></p>
      <p class="fb-status" aria-live="polite"></p>
      <button type="submit" class="btn primary fb-submit" disabled>${t.send}</button>
    </div>
  </form>
</dialog>`);

  const backdrop = document.getElementById('fbBackdrop');
  const dialog = document.getElementById('fbDialog');
  const form = dialog.querySelector('form');
  const fields = dialog.querySelector('.fb-fields');
  const success = dialog.querySelector('.fb-success');
  const closeButton = dialog.querySelector('.fb-close');
  const subject = form.elements.subject;
  const message = form.elements.message;
  const email = form.elements.email;
  const honeypot = form.elements.botcheck;
  const count = document.getElementById('fb-message-count');
  const captchaEl = dialog.querySelector('.fb-captcha');
  const captchaError = document.getElementById('fb-captcha-error');
  const statusEl = dialog.querySelector('.fb-status');
  const submitButton = dialog.querySelector('.fb-submit');

  let storage = null;
  try { storage = window.localStorage; } catch { storage = null; }
  const cooldown = createCooldown(storage);

  let status = 'idle'; // idle | sending | success | error
  let errorMessage = '';
  let captchaToken = '';
  let widgetId = null;
  let openedAt = 0;
  let returnFocus = null;
  let closeTimer;
  let cooldownTimer;
  let cooldownLeft = 0;

  function render() {
    submitButton.disabled = status === 'sending' || !captchaToken || cooldownLeft > 0;
    submitButton.textContent = status === 'sending' ? t.sending : t.send;
    statusEl.textContent = status === 'error' ? errorMessage : cooldownLeft ? t.cooldown(cooldownLeft) : '';
    success.hidden = status !== 'success';
    fields.hidden = status === 'success';
  }

  function setError(input, errorEl, text) {
    errorEl.hidden = !text;
    errorEl.textContent = text || '';
    if (!input) return;
    input.setAttribute('aria-invalid', String(!!text));
    const base = input === message ? 'fb-message-count' : input === email ? 'fb-email-hint' : '';
    const describedBy = [text ? errorEl.id : '', base].filter(Boolean).join(' ');
    if (describedBy) input.setAttribute('aria-describedby', describedBy);
    else input.removeAttribute('aria-describedby');
  }

  function showErrors(errors) {
    setError(subject, document.getElementById('fb-subject-error'), errors.subject);
    setError(message, document.getElementById('fb-message-error'), errors.message);
    setError(email, document.getElementById('fb-email-error'), errors.email);
    setError(null, captchaError, errors.captcha);
  }

  function resetForm() {
    form.reset();
    count.textContent = `0/${LIMITS.messageMax}`;
    showErrors({});
    status = 'idle';
    errorMessage = '';
  }

  function open() {
    clearTimeout(closeTimer);
    if (status === 'success') resetForm();
    // Keep the bot timer from the first open while the user still has text typed, so reopening and sending
    // right away is not mistaken for a bot.
    if (!subject.value && !message.value && !email.value) openedAt = Date.now();
    returnFocus = document.activeElement;
    // Non-modal on purpose: showModal() makes everything outside the dialog inert, including the hCaptcha
    // challenge popup that hCaptcha appends to <body>. The backdrop, Esc and the focus trap are handled here.
    dialog.show();
    backdrop.hidden = false;
    subject.focus();
    refreshCooldown();
    render();
    renderCaptcha();
  }

  function close() {
    dialog.close();
  }

  dialog.addEventListener('close', () => {
    backdrop.hidden = true;
    clearTimeout(closeTimer);
    if (returnFocus?.isConnected) returnFocus.focus();
  });

  async function renderCaptcha() {
    if (widgetId !== null) return;
    setError(null, captchaError, '');
    try {
      const hcaptcha = await loadHcaptcha(LANG);
      if (widgetId !== null) return;
      widgetId = hcaptcha.render(captchaEl, {
        sitekey: HCAPTCHA_SITEKEY,
        theme: 'dark',
        callback: (token) => { captchaToken = token; setError(null, captchaError, ''); render(); },
        'expired-callback': () => { captchaToken = ''; render(); },
        'error-callback': () => { captchaToken = ''; render(); }
      });
    } catch {
      captchaError.hidden = false;
      captchaError.textContent = `${t.captchaFailed} `;
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'fb-link';
      retry.textContent = t.retry;
      retry.addEventListener('click', renderCaptcha);
      captchaError.append(retry);
    }
  }

  function resetCaptcha() {
    captchaToken = '';
    if (widgetId !== null) window.hcaptcha?.reset(widgetId);
  }

  function refreshCooldown() {
    clearInterval(cooldownTimer);
    const tick = () => {
      cooldownLeft = Math.ceil(cooldown.remainingMs() / 1000);
      if (!cooldownLeft) clearInterval(cooldownTimer);
      render();
    };
    tick();
    if (cooldownLeft) cooldownTimer = setInterval(tick, 1000);
  }

  function showSuccess() {
    status = 'success';
    render();
    closeButton.focus();
    closeTimer = setTimeout(close, 3000);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (status === 'sending' || cooldownLeft > 0) return;
    const result = validate({ subject: subject.value, message: message.value, email: email.value }, LANG);
    showErrors(result.errors);
    if (Object.keys(result.errors).length) return;
    // Bots get a fake success and no request, so they learn nothing.
    if (isBot({ honeypot: honeypot.checked, openedAt, now: Date.now() })) return showSuccess();
    if (!captchaToken) return showErrors({ captcha: t.captchaRequired });
    status = 'sending';
    errorMessage = '';
    render();
    const res = await submit(buildPayload(result.values, { accessKey, locale: LANG, page: location.href, captchaToken, honeypot: honeypot.checked }));
    resetCaptcha();
    if (res.ok) {
      cooldown.start();
      showSuccess();
      refreshCooldown();
    } else {
      status = 'error';
      errorMessage = res.message || t.genericError;
      render();
    }
  });

  message.addEventListener('input', () => { count.textContent = `${message.value.length}/${LIMITS.messageMax}`; });
  closeButton.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  openButton.addEventListener('click', open);

  // On window, not the dialog: focus can sit outside it (e.g. inside the hCaptcha challenge).
  window.addEventListener('keydown', (event) => {
    if (dialog.open && event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  dialog.addEventListener('keydown', (event) => {
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
  });

  openButton.hidden = false;
}
