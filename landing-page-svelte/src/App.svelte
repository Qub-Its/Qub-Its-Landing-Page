<script>
  import { seo, siteUrl } from './seo.js';
  import { historicalPages } from './content/historical-pages.js';

  const logo = '/images/logo.png';
  const isEnglish = window.location.pathname === '/en' || window.location.pathname.startsWith('/en/');
  const locale = isEnglish ? 'en' : 'es';
  const path = window.location.pathname.replace(/^\/en(?=\/|$)/, '').split('/').pop() || '';
  const languageTarget = isEnglish ? '/' : '/en/';
  const localize = (href) => isEnglish && href.startsWith('/') ? `/en${href}` : href;
  let menuOpen = false;

  const translations = {
    es: {
      nav: ['Estudio', 'Servicios', 'Trabajo', 'Iniciar proyecto ↗', 'Labs'],
      menu: 'Abrir navegación',
      heroKicker: '[ ESTUDIO DE PRODUCTO DIGITAL / DESDE 2010 ]',
      hero: ['Software que', 'se siente', 'natural.'],
      heroDescription: 'Diseñamos productos digitales precisos, útiles y listos para crecer con tu negocio.',
      heroCta: 'Cuéntanos tu reto',
      partnerBadge: 'Seleccionado como OpenAI Select Partner',
      footerPartner: 'INTEGRADORES & RESELLERS',
      terminal: ['build cosas que importan', 'estrategia', 'diseño', 'ingeniería'],
      aboutKicker: '/ 01 — QUIÉNES SOMOS',
      about: ['No entregamos software.', 'Construimos', 'claridad.'],
      aboutDescription: 'Qub-its es un estudio de producto y desarrollo que convierte problemas complejos en herramientas que la gente quiere usar. Más de 15 años ayudando a equipos a avanzar con intención.',
      servicesKicker: '/ 02 — LO QUE HACEMOS',
      servicesTitle: ['Del primer', '“¿y si?”', 'al producto real.'],
      services: [['01', 'Estrategia de producto', 'Alineamos oportunidad, tecnología y métricas antes de escribir una línea de código.'], ['02', 'Experiencias web', 'Interfaces rápidas, accesibles y con sistemas visuales que reflejan su negocio.'], ['03', 'Plataformas a medida', 'Productos escalables que conectan operaciones, equipos y clientes.'], ['04', 'Equipos extendidos', 'Ingeniería senior que se integra con claridad, autonomía y comunicación constante.']],
      workKicker: '/ 03 — SELECCIÓN',
      workTitle: ['Trabajo que deja', 'huella.'],
      work: [['BabyGunGuin', 'Salud digital', 'Seguimiento del embarazo, ecografías y herramientas de IA informativa para Android.', '/baby_gun_guin_privacy_policy.html'], ['LocAlert', 'Movilidad', 'Alarmas de proximidad para llegar a cada destino sin perder de vista la privacidad.', '/locAlert_policy.html'], ['Telemedicina HCG', 'Healthtech', 'Consultas remotas, gestión de pacientes y servicios digitales para HCG Consulting Group.', 'https://hcgconsulting.net'], ['Chrome Site Stats', 'Extensión Chrome', 'Métricas y hábitos de navegación almacenados localmente en el navegador.', '/chrome_site_stats_policy.html'], ['Qubits Cargo', 'SaaS logística', 'Gestión de envíos, seguimiento y operaciones para empresas de courier y cargo.', '#contact'], ['Qub-its Biometric', 'Verificación + OCR', 'OCR de documentos, validación de autenticidad y lectura MRZ en tiempo real.', '/biometric-landing.html'], ['Billium', 'Fintech', 'Una aplicación móvil para mantener las suscripciones organizadas en un solo lugar.', 'https://billium-landing.vercel.app']],
      labsKicker: '/ 04 — LABS',
      labsTitle: ['Experimentos que', 'puedes usar.'],
      labs: [['MCDU Trainer', 'Simulador aeronáutico', 'Entrenador interactivo del MCDU del A320 con guía y ejercicios por niveles.', '/labs/mcdu-trainer/'], ['PFD Trainer', 'Simulador aeronáutico', 'Aprende a leer el PFD del A320: actitud, cintas, FMA e ILS, con FCU interactivo y ejercicios.', '/labs/pfd-trainer/'], ['E6B Trainer', 'Simulador aeronáutico', 'Aprende a usar la computadora de vuelo E6B: tiempo, combustible, TAS, altitud densidad y viento, con ejercicios y práctica.', '/labs/e6b-trainer/'], ['G1000 Course', 'Curso de aviónica', 'Curso guiado del Garmin G1000 de un C172 con simulador interactivo y escenas 3D.', '/labs/g1000-trainer/']],
      contactKicker: '/ 05 — HABLEMOS',
      contact: ['Tu próximo producto', 'empieza con un', 'hola.'],
      contactNote: 'Cuéntanos qué quieres construir. Respondemos con preguntas inteligentes, no con promesas genéricas.',
      privacy: 'Privacidad',
      contactLabel: 'Contacto',
      back: '← Volver a Qub-its'
    },
    en: {
      nav: ['Studio', 'Services', 'Work', 'Start a project ↗', 'Labs'],
      menu: 'Open navigation',
      heroKicker: '[ DIGITAL PRODUCT STUDIO / EST. 2010 ]',
      hero: ['Software that', 'feels', 'natural.'],
      heroDescription: 'We design precise, useful digital products that are ready to grow with your business.',
      heroCta: 'Tell us your challenge',
      partnerBadge: 'Selected as an OpenAI Select Partner',
      footerPartner: 'INTEGRATORS & RESELLERS',
      terminal: ['build meaningful things', 'strategy', 'design', 'engineering'],
      aboutKicker: '/ 01 — WHO WE ARE',
      about: ['We do not ship software.', 'We build', 'clarity.'],
      aboutDescription: 'Qub-its is a product and development studio that turns complex problems into tools people want to use. For more than 15 years, we have helped teams move forward with intention.',
      servicesKicker: '/ 02 — WHAT WE DO',
      servicesTitle: ['From the first', '“what if?”', 'to the real product.'],
      services: [['01', 'Product strategy', 'We align opportunity, technology, and metrics before writing a single line of code.'], ['02', 'Web experiences', 'Fast, accessible interfaces and visual systems that express your business clearly.'], ['03', 'Custom platforms', 'Scalable products that connect operations, teams, and customers.'], ['04', 'Embedded teams', 'Senior engineering that integrates with clarity, autonomy, and constant communication.']],
      workKicker: '/ 03 — SELECTED WORK',
      workTitle: ['Work that makes', 'an impact.'],
      work: [['BabyGunGuin', 'Digital health', 'Pregnancy tracking, ultrasounds, and informational AI tools for Android.', '/baby_gun_guin_privacy_policy.html'], ['LocAlert', 'Mobility', 'Proximity alarms that help people reach each destination while protecting privacy.', '/locAlert_policy.html'], ['HCG Telemedicine', 'Healthtech', 'Remote consultations, patient management, and digital services for HCG Consulting Group.', 'https://hcgconsulting.net'], ['Chrome Site Stats', 'Chrome extension', 'Browser activity insights and habits stored locally on the device.', '/chrome_site_stats_policy.html'], ['Qubits Cargo', 'Logistics SaaS', 'Shipment management, tracking, and operations for courier and cargo businesses.', '#contact'], ['Qub-its Biometric', 'Verification + OCR', 'Document OCR, authenticity validation, and real-time MRZ reading.', '/biometric-landing.html'], ['Billium', 'Fintech', 'A mobile app that keeps subscriptions organized in one place.', 'https://billium-landing.vercel.app']],
      labsKicker: '/ 04 — LABS',
      labsTitle: ['Experiments you', 'can use.'],
      labs: [['MCDU Trainer', 'Aviation simulator', 'Interactive A320 MCDU trainer with a guide and level-based exercises.', '/labs/mcdu-trainer/'], ['PFD Trainer', 'Aviation simulator', 'Learn to read the A320 PFD: attitude, tapes, FMA and ILS, with an interactive FCU and exercises.', '/labs/pfd-trainer/'], ['E6B Trainer', 'Aviation simulator', 'Learn the E6B flight computer: time, fuel, TAS, density altitude and wind, with exercises and practice.', '/labs/e6b-trainer/'], ['G1000 Course', 'Avionics course', 'Guided course on the Garmin G1000 of a C172 with an interactive simulator and 3D scenes.', '/labs/g1000-trainer/']],
      contactKicker: '/ 05 — LET’S TALK',
      contact: ['Your next product', 'starts with a', 'hello.'],
      contactNote: 'Tell us what you want to build. We answer with thoughtful questions, not generic promises.',
      privacy: 'Privacy',
      contactLabel: 'Contact',
      back: '← Back to Qub-its'
    }
  };

  const copy = translations[locale];
  const historicalPage = historicalPages[path];
  const historicalBlocks = historicalPage?.blocks.reduce((blocks, block) => {
    const previous = blocks[blocks.length - 1];
    if (block.tag === 'li' && previous?.tag === 'ul') previous.items.push(block.text);
    else if (block.tag === 'li') blocks.push({ tag: 'ul', items: [block.text] });
    else blocks.push(block);
    return blocks;
  }, []) || [];
  const deletionEmail = 'mailto:team@qub-its.com?subject=Account%20Deletion%20Request%20-%20BabyGunGuin';
  const historicalText = (text) => text
    .replaceAll('formulario de eliminación de cuenta', '<a href="/baby_gun_guin_delete_account.html">formulario de eliminación de cuenta</a>')
    .replaceAll('team@qub-its.com', '<a href="mailto:team@qub-its.com">team@qub-its.com</a>')
    .replaceAll('https://calendar.app.google/A4jrFp4inRSPnpa88', '<a href="https://calendar.app.google/A4jrFp4inRSPnpa88">https://calendar.app.google/A4jrFp4inRSPnpa88</a>');
  const submitDeletionRequest = (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const body = [`Email: ${values.get('email')}`, `Message: ${values.get('message') || ''}`].join('\n');
    window.location.href = `${deletionEmail}&body=${encodeURIComponent(body)}`;
  };
  const home = seo.home[locale];
  // Vercel rewrites every unknown path to the SPA, so anything that is neither home nor a policy page is a soft 404.
  const route = window.location.pathname.replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '');
  const isUnknownPath = !historicalPage && route !== '' && route !== '/index.html';
  const pageTitle = historicalPage ? historicalPage.title : home.title;
  const pageDescription = historicalPage?.description || home.description;
  const canonicalUrl = historicalPage ? `${siteUrl}${isEnglish ? '/en' : ''}/${path}` : home.url;
  const robots = historicalPage || isUnknownPath ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  const setMeta = (selector, value) => document.querySelector(selector)?.setAttribute('content', value);
  document.title = pageTitle;
  document.documentElement.lang = path === 'locAlarm_policy.html' ? 'en' : locale;
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
  setMeta('meta[name="description"]', pageDescription);
  setMeta('meta[name="robots"]', robots);
  setMeta('meta[property="og:locale"]', isEnglish ? 'en_US' : 'es_ES');
  setMeta('meta[property="og:title"]', pageTitle);
  setMeta('meta[property="og:description"]', historicalPage ? pageDescription : home.ogDescription);
  setMeta('meta[property="og:url"]', canonicalUrl);
  setMeta('meta[name="twitter:title"]', pageTitle);
  setMeta('meta[name="twitter:description"]', historicalPage ? pageDescription : home.ogDescription);
  setMeta('meta[property="og:locale:alternate"]', isEnglish ? 'es_ES' : 'en_US');
  setMeta('meta[property="og:image:alt"]', home.imageAlt);
</script>

<!-- Metadata base tags in index.html are updated above to avoid duplicate head tags. -->
<!--
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="robots" content={robots} />
  <link rel="canonical" href={canonicalUrl} />
  <link rel="alternate" hreflang="es" href={`${siteUrl}/`} />
  <link rel="alternate" hreflang="en" href={`${siteUrl}/en/`} />
  <link rel="alternate" hreflang="x-default" href={`${siteUrl}/`} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Qub-its" />
  <meta property="og:locale" content={isEnglish ? 'en_US' : 'es_ES'} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={`${siteUrl}/images/logo.png`} />
  <meta property="og:image:alt" content="Qub-its logo" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />
  <meta name="twitter:image" content={`${siteUrl}/images/logo.png`} />
-->

{#if historicalPage}
  <main class="legal-shell historical-page" lang={path === 'locAlarm_policy.html' ? 'en' : 'es'}>
    <a class="brand" href={isEnglish ? '/en/' : '/'}><img src={logo} alt="Qub-its" width="116" height="48" /></a>
    <a class="back" href={isEnglish ? '/en/' : '/'}>{copy.back}</a>
    <a class="language-switch legal-language" href={languageTarget} lang={isEnglish ? 'es' : 'en'} aria-label={isEnglish ? 'Cambiar a español' : 'Switch to English'}>{isEnglish ? 'ES' : 'EN'}</a>
    <h1>{historicalBlocks.find((block) => block.tag === 'h1')?.text || historicalPage.title}</h1>
    {#if historicalPage.date}<p class="legal-intro historical-date">{historicalPage.date}</p>{/if}
    <div class="historical-content">
      {#each historicalBlocks as block, index}
        {#if block.tag === 'h1'}
          <!-- The page title is already rendered as the single h1 above. -->
        {:else if block.tag === 'label' || block.tag === 'button'}
          <!-- Form labels and action are rendered in the functional form below. -->
        {:else if block.tag === 'h2'}
          <h2>{block.text}</h2>
        {:else if block.tag === 'h3'}
          <h3>{block.text}</h3>
        {:else if block.tag === 'h4'}
          <h4>{block.text}</h4>
        {:else if block.tag === 'ul'}
          <ul>{#each block.items as item}<li>{@html historicalText(item)}</li>{/each}</ul>
        {:else if block.text === '← Volver a la Política de Privacidad'}
          <p><a href="/baby_gun_guin_privacy_policy.html">{block.text}</a></p>
        {:else if block.text.startsWith('O responda directamente a este correo')}
          <p>{block.text}</p>
        {:else if block.text.startsWith('Agendar Demo Gratuita')}
          <p><a class="button historical-cta" href="https://calendar.app.google/A4jrFp4inRSPnpa88">{block.text}</a></p>
        {:else if block.text.startsWith('https://calendar.app.google/')}
          <p><a href={block.text}>{block.text}</a></p>
        {:else if block.text.includes('Darse de baja')}
          <p>{block.text.replace('Darse de baja', '')}<a href="#">Darse de baja</a></p>
        {:else if block.text.includes('formulario de eliminación de cuenta')}
          <p>{@html historicalText(block.text)}</p>
        {:else}
          <p>{@html historicalText(block.text)}</p>
        {/if}
      {/each}
    </div>
    {#if path === 'baby_gun_guin_delete_account.html'}
      <form class="delete-request" onsubmit={submitDeletionRequest}>
        <label for="delete-email">Correo electrónico de la cuenta *</label>
        <input id="delete-email" type="email" name="email" required autocomplete="email" />
        <label for="delete-message">Mensaje adicional (opcional)</label>
        <textarea id="delete-message" name="message" rows="3"></textarea>
        <label class="delete-confirm"><input type="checkbox" required /> <span>Entiendo que esta acción es irreversible y que todos mis datos serán eliminados permanentemente. *</span></label>
        <button type="submit">Enviar solicitud de eliminación</button>
      </form>
    {/if}
    {#if historicalPage.closing}<p class="legal-contact">{historicalPage.closing}</p>{/if}
    {#if historicalPage.reply}<p class="legal-contact">{historicalPage.reply} <a href={historicalPage.demoUrl}>{historicalPage.demoUrl}</a></p>{/if}
    {#if path === 'biometric-landing.html'}<p class="legal-contact">Qub-its Inc. · Miami, Florida · <a href="https://www.qub-its.com">www.qub-its.com</a> · <a href="mailto:support@qub-its.com">support@qub-its.com</a></p>{/if}
    {#if historicalPage.footer}<p class="legal-contact">© 2026 Qub-its Inc. Todos los derechos reservados. · {historicalPage.footer} <a href="mailto:team@qub-its.com?subject=Unsubscribe">Darse de baja</a></p>{/if}
  </main>
{:else}
  <header class="site-header"><a class="brand" href={isEnglish ? '/en/' : '/'} aria-label="Qub-its home"><img src={logo} alt="Qub-its" width="116" height="48" /></a><button class="menu-button" aria-label={copy.menu} aria-expanded={menuOpen} onclick={() => menuOpen = !menuOpen}>menu</button><nav class:open={menuOpen} aria-label="Primary navigation"><a href="#studio" onclick={() => menuOpen = false}>{copy.nav[0]}</a><a href="#services" onclick={() => menuOpen = false}>{copy.nav[1]}</a><a href="#work" onclick={() => menuOpen = false}>{copy.nav[2]}</a><a href="#labs" onclick={() => menuOpen = false}>{copy.nav[4]}</a><a class="language-switch" href={languageTarget} lang={isEnglish ? 'es' : 'en'} aria-label={isEnglish ? 'Cambiar a español' : 'Switch to English'}>{isEnglish ? 'ES' : 'EN'}</a><a class="nav-cta" href="#contact" onclick={() => menuOpen = false}>{copy.nav[3]}</a></nav></header>
  <main><section class="hero"><div class="hero-glow"></div><p class="eyebrow">{copy.heroKicker}</p><div class="partner-badge" aria-label={isEnglish ? 'Qub-its was selected as an OpenAI Select Partner' : 'Qub-its fue seleccionado como OpenAI Select Partner'}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5 14.5 9.5 21.5 12 14.5 14.5 12 21.5 9.5 14.5 2.5 12 9.5 9.5 12 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="19" cy="5" r="1" fill="currentColor"/><circle cx="5" cy="19" r="1" fill="currentColor"/></svg><span>{copy.partnerBadge}</span></div><h1>{copy.hero[0]}<br /><em>{copy.hero[1]}</em> {copy.hero[2]}</h1><div class="hero-bottom"><p>{copy.heroDescription}</p><a class="button" href="#contact">{copy.heroCta} <span>↘</span></a></div><div class="terminal" aria-hidden="true"><div class="terminal-top"><i></i><i></i><i></i><span>qubits.system</span></div><p><b>›</b> {copy.terminal[0]}</p><p><b>✓</b> {copy.terminal[1]}</p><p><b>✓</b> {copy.terminal[2]}</p><p><b>✓</b> {copy.terminal[3]}<span class="cursor">_</span></p></div></section>
  <section class="intro section" id="studio"><p class="eyebrow">{copy.aboutKicker}</p><div><h2>{copy.about[0]}<br />{copy.about[1]} <em>{copy.about[2]}</em></h2><p class="lead">{copy.aboutDescription}</p></div></section>
  <section class="services section" id="services"><div class="section-heading"><p class="eyebrow">{copy.servicesKicker}</p><h2>{copy.servicesTitle[0]} <em>{copy.servicesTitle[1]}</em><br />{copy.servicesTitle[2]}</h2></div><div class="service-grid">{#each copy.services as service}<article><div class="service-number">{service[0]} <span>↗</span></div><h3>{service[1]}</h3><p>{service[2]}</p></article>{/each}</div></section>
  <section class="work section" id="work"><div class="section-heading"><p class="eyebrow">{copy.workKicker}</p><h2>{copy.workTitle[0]}<br /><em>{copy.workTitle[1]}</em></h2></div><div class="work-list">{#each copy.work as project, i}<a href={localize(project[3])} target={project[3].startsWith('http') ? '_blank' : undefined} rel={project[3].startsWith('http') ? 'noreferrer' : undefined}><span class="work-index">0{i + 1}</span><div><p>{project[1]}</p><h3>{project[0]}</h3></div><p class="work-description">{project[2]}</p><span class="arrow">↗</span></a>{/each}</div></section>
  <section class="labs section" id="labs"><div class="section-heading"><p class="eyebrow">{copy.labsKicker}</p><h2>{copy.labsTitle[0]}<br /><em>{copy.labsTitle[1]}</em></h2></div><div class="work-list">{#each copy.labs as lab, i}<a href={localize(lab[3])}><span class="work-index">0{i + 1}</span><div><p>{lab[1]}</p><h3>{lab[0]}</h3></div><p class="work-description">{lab[2]}</p><span class="arrow">↗</span></a>{/each}</div></section>
  <section class="contact section" id="contact"><p class="eyebrow">{copy.contactKicker}</p><h2>{copy.contact[0]}<br />{copy.contact[1]} <em>{copy.contact[2]}</em></h2><a class="contact-email" href="mailto:team@qub-its.com?subject=New%20project%20with%20Qub-its">team@qub-its.com <span>↗</span></a><p class="contact-note">{copy.contactNote}</p></section></main>
  <footer><a class="brand footer-brand" href={isEnglish ? '/en/' : '/'}><img src={logo} alt="Qub-its" width="116" height="48" /></a><div class="footer-partner" role="group" aria-label={isEnglish ? 'Qub-its selected as an OpenAI Select Partner' : 'Qub-its fue seleccionado como OpenAI Select Partner'}><div class="footer-partner-badge" role="img" aria-label="OpenAI Select Partner badge"><img src="/images/openai-select-partner-badge.png" alt="" /></div><span>{copy.footerPartner}</span></div><p>© {new Date().getFullYear()} Qub-its Inc.</p><div class="footer-links"><a href={localize('/locAlert_policy.html')}>{copy.privacy}</a><a href="mailto:team@qub-its.com">{copy.contactLabel}</a></div></footer>
{/if}
