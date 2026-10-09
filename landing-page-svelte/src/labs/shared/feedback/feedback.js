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
    remainingMs() {
      const last = read();
      return last ? Math.max(0, last + COOLDOWN_MS - now()) : 0;
    },
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
