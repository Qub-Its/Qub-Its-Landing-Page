<script>
  // Interim shell (Task 7): the live 2D G1000 with the sim running and toasts, to try the instrument by hand.
  // Replaced by the course shell in Task 9.
  import { onMount } from 'svelte';
  import { seo } from '../../seo.js';
  import { detectLang, UI } from './i18n.js';
  import G1000 from './components/gdu/G1000.svelte';
  import { onMessage, startLoop, stopLoop } from './lib/g1000.svelte.js';

  const lang = detectLang();
  const t = UI[lang];
  document.title = seo.g1000[lang].title;
  let toastMsg = $state('');
  let toastShow = $state(false);
  let timer;

  onMount(() => {
    onMessage((m) => {
      toastMsg = t.msgs[m] ?? m;
      toastShow = true;
      clearTimeout(timer);
      timer = setTimeout(() => (toastShow = false), 1800);
    });
    startLoop();
    return () => { stopLoop(); clearTimeout(timer); };
  });
</script>

<header class="top">
  <div class="brand">
    <span class="plate">{t.plate}</span>
    <div><h1>{t.title}</h1><p>{t.subtitle}</p></div>
  </div>
</header>
<main class="layout g1000-layout">
  <section class="sim"><G1000 {lang} explain={false} highlight={null} onpart={() => {}} /></section>
</main>
<div class="toast" class:show={toastShow} role="status">{toastMsg}</div>
