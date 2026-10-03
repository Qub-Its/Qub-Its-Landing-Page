// The MCDU trainer is a static page in public/ that Vite copies without processing, so import.meta.env does not
// exist there. Write the Web3Forms feedback key (public by design, kept out of git) into its <meta> after the build.
// Runs before localize-heads.mjs so the English copy inherits the key.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'dist/labs/mcdu-trainer/index.html');
// loadEnv merges .env* files with process.env (Vercel env vars).
const key = (loadEnv('production', root, 'VITE_').VITE_WEB3FORMS_FEEDBACK_KEY || '').trim();
const tag = '<meta name="feedback-key" content="">';
const html = readFileSync(file, 'utf8');
if (html.split(tag).length !== 2) throw new Error('inject-feedback-key: expected exactly one empty feedback-key <meta> in the trainer');
const value = key.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
writeFileSync(file, html.replace(tag, `<meta name="feedback-key" content="${value}">`));
console.log(`inject-feedback-key: ${key ? 'key injected into the MCDU trainer' : 'no VITE_WEB3FORMS_FEEDBACK_KEY, feedback button stays hidden'}`);
