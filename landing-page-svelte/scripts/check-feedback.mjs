// Assertions for src/labs/shared/feedback/feedback.js. Run: node scripts/check-feedback.mjs
import assert from 'node:assert/strict';
import {
  LIMITS, MIN_FILL_MS, COOLDOWN_MS, countLinks, validate, isBot, createCooldown, buildPayload, submit
} from '../src/labs/shared/feedback/feedback.js';

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
