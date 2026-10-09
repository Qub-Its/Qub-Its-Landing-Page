// Cross-promotion tab for the PFD trainer, shown on the MCDU trainer. Self-contained: injects its own styles.
// Expands once per session (first `mcdu:task-complete` event or 45 s, whichever first), then stays as a mini tab.
// Debug/preview: add ?pfdPromo=expand to the URL to expand immediately (ignores the session flag).
const LANG = /^\/en(\/|$)/.test(location.pathname) || new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'es';
const copy = {
  es: { name: 'PFD Trainer', label: 'Nuevo · Aprende a leer el PFD →', close: 'Cerrar', href: '/labs/pfd-trainer/' },
  en: { name: 'PFD Trainer', label: 'New · Learn to read the PFD →', close: 'Close', href: '/en/labs/pfd-trainer/' }
};
const t = copy[LANG];
const KEY = 'qubits.pfdPromo.expanded';
const DELAY = 45000, SHOW = 8000;

let expandedThisLoad = false; // fallback when sessionStorage throws: at most once per page load
let storageOk = true;
function alreadyExpanded() {
  try { return sessionStorage.getItem(KEY) === '1'; } catch { storageOk = false; return expandedThisLoad; }
}
function markExpanded() {
  expandedThisLoad = true;
  try { sessionStorage.setItem(KEY, '1'); } catch { storageOk = false; }
}
function track(name) { try { window.va?.('event', { name }); } catch { /* analytics is best effort */ } }

const style = document.createElement('style');
style.textContent = `
.pfdp{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:30;display:flex;align-items:stretch;max-width:calc(100vw - 8px);
  background:var(--panel,#1d252c);border:1px solid var(--line,#34414c);border-left:0;border-radius:0 10px 10px 0;box-shadow:0 6px 20px #0008;
  font-family:var(--f-ui,inherit);color:var(--fg,#e8eef2)}
.pfdp-link{display:flex;align-items:center;gap:8px;padding:8px 8px 8px 6px;color:inherit;text-decoration:none;border-radius:0 10px 10px 0;min-width:0}
.pfdp-link svg{width:26px;height:26px;flex:none;display:block}
.pfdp-text{display:block;max-width:0;overflow:hidden;white-space:nowrap;font-size:13px;font-weight:600;color:var(--cyan,#3ccbe8);
  opacity:0;transition:max-width .35s ease,opacity .25s ease}
.pfdp.open .pfdp-text,.pfdp-link:hover .pfdp-text,.pfdp-link:focus-visible .pfdp-text{max-width:min(300px,calc(100vw - 110px));opacity:1}
.pfdp.open .pfdp-text,.pfdp-link:hover .pfdp-text,.pfdp-link:focus-visible .pfdp-text{padding-right:4px}
.pfdp-x{display:none;background:none;border:0;border-left:1px solid var(--line,#34414c);color:var(--muted,#9aa8b3);font:inherit;font-size:18px;line-height:1;
  padding:0 10px;cursor:pointer;border-radius:0 10px 10px 0}
.pfdp.open .pfdp-x{display:block}
.pfdp.open .pfdp-link{border-radius:0}
.pfdp-x:hover{color:var(--fg,#fff)}
.pfdp-link:hover,.pfdp-link:focus-visible{background:#ffffff0d}
.pfdp-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:980px){
  .pfdp{top:auto;transform:none;bottom:calc(env(safe-area-inset-bottom,0px) + 24px)}
  .pfdp-link{gap:6px;padding:5px 3px 5px 2px}
  .pfdp-link svg{width:18px;height:18px}
}
@media (prefers-reduced-motion:reduce){.pfdp-text{transition:none}}
@media print{.pfdp{display:none}}
`;

const icon = `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><defs><clipPath id="pfdpc"><rect x="1" y="1" width="30" height="30" rx="4"/></clipPath></defs>
<g clip-path="url(#pfdpc)"><g transform="rotate(-9 16 16)"><rect x="-6" y="-6" width="44" height="22" fill="#1b8fd6"/><rect x="-6" y="16" width="44" height="22" fill="#8a5a2b"/><rect x="-6" y="15.4" width="44" height="1.2" fill="#fff"/></g></g>
<rect x="1" y="1" width="30" height="30" rx="4" fill="none" stroke="#0b0f12" stroke-width="1.2"/>
<path d="M6 17h6l2 3M26 17h-6l-2 3" fill="none" stroke="#fff23c" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="square"/><rect x="14.8" y="15.8" width="2.4" height="2.4" fill="#fff23c"/></svg>`;

const root = document.createElement('div');
root.className = 'pfdp';
root.innerHTML = `<a class="pfdp-link" href="${t.href}" aria-label="${t.name}"><span class="pfdp-icon">${icon}</span><span class="pfdp-text" aria-hidden="true">${t.label}</span></a>
<button type="button" class="pfdp-x" aria-label="${t.close}">×</button><span class="pfdp-live" aria-live="polite"></span>`;
const link = root.querySelector('.pfdp-link');
const live = root.querySelector('.pfdp-live');
const closeBtn = root.querySelector('.pfdp-x');
const hideTimer = { id: 0 };
let armed = true, delayTimer = 0;

function expand(force) {
  if (root.classList.contains('open')) return;
  if (!force) {
    if (!armed || alreadyExpanded()) return;
    armed = false;
    markExpanded();
  }
  clearTimeout(delayTimer);
  root.classList.add('open');
  live.textContent = t.label;
  link.removeAttribute('aria-label'); // visible text becomes the accessible name while open
  root.querySelector('.pfdp-text').removeAttribute('aria-hidden');
  track('pfd_promo_shown');
  hideTimer.id = setTimeout(collapse, SHOW);
}
function collapse() {
  clearTimeout(hideTimer.id);
  if (!root.classList.contains('open')) return;
  root.classList.remove('open');
  live.textContent = '';
  link.setAttribute('aria-label', t.name);
  root.querySelector('.pfdp-text').setAttribute('aria-hidden', 'true');
}

function start() {
  document.head.appendChild(style);
  document.body.appendChild(root);
  link.addEventListener('click', () => track('pfd_promo_click'));
  closeBtn.addEventListener('click', collapse);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') collapse(); });
  document.addEventListener('mcdu:task-complete', () => expand(false));
  if (new URLSearchParams(location.search).get('pfdPromo') === 'expand') { expand(true); return; }
  if (!alreadyExpanded()) delayTimer = setTimeout(() => expand(false), DELAY);
}
if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
