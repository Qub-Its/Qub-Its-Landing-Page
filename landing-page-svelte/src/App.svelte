<script>
  const logo = '/images/logo.png';
  const siteUrl = 'https://www.qub-its.com';
  const isEnglish = window.location.pathname === '/en' || window.location.pathname.startsWith('/en/');
  const locale = isEnglish ? 'en' : 'es';
  const path = window.location.pathname.replace(/^\/en(?=\/|$)/, '').split('/').pop() || '';
  const languageTarget = isEnglish ? '/' : '/en/';
  const localize = (href) => isEnglish && href.startsWith('/') ? `/en${href}` : href;
  let menuOpen = false;

  const policies = {
    'locAlert_policy.html': ['LocAlert', 'PRIVACIDAD / LOCALIZACIÓN', 'Tu ubicación se queda contigo.', 'LocAlert utiliza la ubicación del dispositivo para activar alarmas de proximidad. Esa información se procesa localmente y no se almacena en servidores de Qub-its.', [['Información que no recopilamos', 'No recopilamos ni almacenamos historial de ubicaciones, perfiles personales ni datos de uso identificables.'], ['Permisos', 'Puedes administrar los permisos de ubicación y notificaciones desde los ajustes de tu dispositivo.'], ['Terceros', 'Los servicios de mapas pueden aplicar sus propias políticas. Qub-its no conserva los datos procesados por ellos.']]],
    'locAlarm_policy.html': ['LocAlarm', 'PRIVACIDAD / LOCALIZACIÓN', 'Alarmas cercanas, datos privados.', 'LocAlarm procesa temporalmente la ubicación en tu dispositivo para avisarte al llegar a un destino. No transmite ni guarda esa información en servidores externos.', [['Procesamiento local', 'La ubicación se usa exclusivamente para calcular alarmas de proximidad en tu dispositivo.'], ['Tus controles', 'Puedes revocar permisos de ubicación o notificaciones desde la configuración del sistema.'], ['Contacto', 'Para consultas sobre privacidad, escríbenos a team@qub-its.com.']]],
    'baby_gun_guin_privacy_policy.html': ['BabyGunGuin', 'PRIVACIDAD / SALUD', 'Privacidad para cada etapa.', 'BabyGunGuin es una herramienta informativa y de organización; no ofrece diagnóstico ni consejo médico. Trataremos la información necesaria para proporcionar las funciones que elijas usar.', [['Información tratada', 'Según las funciones utilizadas, pueden incluirse datos de cuenta, seguimiento, imágenes y datos técnicos de diagnóstico.'], ['Uso y proveedores', 'Usamos la información para operar y proteger el servicio. Algunos proveedores, como Firebase e IA solicitada por ti, pueden procesar datos para esas funciones.'], ['Conservación y derechos', 'Puedes solicitar acceso, corrección o eliminación escribiendo a team@qub-its.com.']]],
    'baby_gun_guin_delete_account.html': ['BabyGunGuin', 'CUENTA / ELIMINACIÓN', 'Solicita la eliminación de tu cuenta.', 'Puedes pedir la eliminación de tu cuenta y los datos asociados. Revisaremos la solicitud y responderemos conforme a los requisitos aplicables.', [['Cómo solicitarla', 'Envía un correo desde la dirección asociada a tu cuenta a team@qub-its.com con el asunto “Eliminar cuenta BabyGunGuin”.'], ['Qué puede eliminarse', 'La solicitud puede abarcar datos de cuenta, seguimiento, imágenes y otra información asociada. Algunas copias pueden conservarse temporalmente por razones legales o de seguridad.']]],
    'chrome_site_stats_policy.html': ['Chrome Site Stats', 'PRIVACIDAD / EXTENSIÓN', 'Métricas útiles. Control local.', 'Chrome Site Stats fue diseñada con privacidad por defecto. La información que necesita para sus funciones se procesa localmente en tu navegador.', [['Datos personales', 'La extensión no requiere credenciales, información financiera ni datos personales identificables para sus funciones principales.'], ['Tus decisiones', 'Tú controlas los datos guardados localmente y puedes eliminarlos desde la extensión o el navegador.'], ['Seguridad', 'Aplicamos medidas razonables para proteger el funcionamiento local de la extensión.']]],
    'biometric-landing.html': ['Qub-its Biometric', 'PRODUCTO / BIOMETRÍA', 'Identidad digital, diseñada para personas.', 'Una experiencia digital segura para simplificar la gestión biométrica y reducir la fricción operativa.', [['Diseño centrado en confianza', 'Flujos claros, interfaces accesibles y decisiones basadas en privacidad desde el inicio.'], ['Hablemos', 'Cuéntanos sobre tu operación y diseñaremos el producto adecuado para tu equipo.']]]
  };

  const translations = {
    es: {
      title: 'Desarrollo de software a medida | Qub-its',
      description: 'Qub-its crea software a medida, productos digitales y plataformas web para empresas que quieren crecer con tecnología.',
      nav: ['Estudio', 'Servicios', 'Trabajo', 'Iniciar proyecto ↗'],
      menu: 'Abrir navegación',
      heroKicker: '[ ESTUDIO DE PRODUCTO DIGITAL / DESDE 2010 ]',
      hero: ['Software que', 'se siente', 'natural.'],
      heroDescription: 'Diseñamos productos digitales precisos, útiles y listos para crecer con tu negocio.',
      heroCta: 'Cuéntanos tu reto',
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
      contactKicker: '/ 04 — HABLEMOS',
      contact: ['Tu próximo producto', 'empieza con un', 'hola.'],
      contactNote: 'Cuéntanos qué quieres construir. Respondemos con preguntas inteligentes, no con promesas genéricas.',
      privacy: 'Privacidad',
      contactLabel: 'Contacto',
      back: '← Volver a Qub-its'
    },
    en: {
      title: 'Custom Software Development | Qub-its',
      description: 'Qub-its builds custom software, digital products, and web platforms for businesses ready to grow with technology.',
      nav: ['Studio', 'Services', 'Work', 'Start a project ↗'],
      menu: 'Open navigation',
      heroKicker: '[ DIGITAL PRODUCT STUDIO / EST. 2010 ]',
      hero: ['Software that', 'feels', 'natural.'],
      heroDescription: 'We design precise, useful digital products that are ready to grow with your business.',
      heroCta: 'Tell us your challenge',
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
      contactKicker: '/ 04 — LET’S TALK',
      contact: ['Your next product', 'starts with a', 'hello.'],
      contactNote: 'Tell us what you want to build. We answer with thoughtful questions, not generic promises.',
      privacy: 'Privacy',
      contactLabel: 'Contact',
      back: '← Back to Qub-its'
    }
  };

  const copy = translations[locale];
  const policy = policies[path];
  const pageTitle = policy ? `${policy[0]} | Qub-its` : copy.title;
  const pageDescription = policy ? policy[3] : copy.description;
  const canonicalUrl = `${siteUrl}${policy ? `${isEnglish ? '/en' : ''}/${path}` : isEnglish ? '/en/' : '/'}`;
  const robots = policy ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  const setMeta = (selector, value) => document.querySelector(selector)?.setAttribute('content', value);
  document.title = pageTitle;
  document.documentElement.lang = locale;
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
  setMeta('meta[name="description"]', pageDescription);
  setMeta('meta[name="robots"]', robots);
  setMeta('meta[property="og:locale"]', isEnglish ? 'en_US' : 'es_ES');
  setMeta('meta[property="og:title"]', pageTitle);
  setMeta('meta[property="og:description"]', pageDescription);
  setMeta('meta[property="og:url"]', canonicalUrl);
  setMeta('meta[name="twitter:title"]', pageTitle);
  setMeta('meta[name="twitter:description"]', pageDescription);
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

{#if policy}
  <main class="legal-shell"><a class="brand" href={isEnglish ? '/en/' : '/'}><img src={logo} alt="Qub-its" /></a><a class="back" href={isEnglish ? '/en/' : '/'}>{copy.back}</a><a class="language-switch legal-language" href={languageTarget} lang={isEnglish ? 'es' : 'en'} aria-label={isEnglish ? 'Cambiar a español' : 'Switch to English'}>{isEnglish ? 'ES' : 'EN'}</a><p class="eyebrow">{policy[1]}</p><h1>{policy[2]}</h1><p class="legal-intro">{policy[3]}</p><div class="legal-grid">{#each policy[4] as section}<article><span>/{section[0].toLowerCase().replaceAll(' ', '_')}</span><h2>{section[0]}</h2><p>{section[1]}</p></article>{/each}</div><p class="legal-contact">{isEnglish ? 'Questions?' : '¿Preguntas?'} <a href="mailto:team@qub-its.com">team@qub-its.com</a></p></main>
{:else}
  <header class="site-header"><a class="brand" href={isEnglish ? '/en/' : '/'} aria-label="Qub-its home"><img src={logo} alt="Qub-its" /></a><button class="menu-button" aria-label={copy.menu} aria-expanded={menuOpen} onclick={() => menuOpen = !menuOpen}>menu</button><nav class:open={menuOpen} aria-label="Primary navigation"><a href="#studio" onclick={() => menuOpen = false}>{copy.nav[0]}</a><a href="#services" onclick={() => menuOpen = false}>{copy.nav[1]}</a><a href="#work" onclick={() => menuOpen = false}>{copy.nav[2]}</a><a class="language-switch" href={languageTarget} lang={isEnglish ? 'es' : 'en'} aria-label={isEnglish ? 'Cambiar a español' : 'Switch to English'}>{isEnglish ? 'ES' : 'EN'}</a><a class="nav-cta" href="#contact" onclick={() => menuOpen = false}>{copy.nav[3]}</a></nav></header>
  <main><section class="hero"><div class="hero-glow"></div><p class="eyebrow">{copy.heroKicker}</p><h1>{copy.hero[0]}<br /><em>{copy.hero[1]}</em> {copy.hero[2]}</h1><div class="hero-bottom"><p>{copy.heroDescription}</p><a class="button" href="#contact">{copy.heroCta} <span>↘</span></a></div><div class="terminal" aria-hidden="true"><div class="terminal-top"><i></i><i></i><i></i><span>qubits.system</span></div><p><b>›</b> {copy.terminal[0]}</p><p><b>✓</b> {copy.terminal[1]}</p><p><b>✓</b> {copy.terminal[2]}</p><p><b>✓</b> {copy.terminal[3]}<span class="cursor">_</span></p></div></section>
  <section class="intro section" id="studio"><p class="eyebrow">{copy.aboutKicker}</p><div><h2>{copy.about[0]}<br />{copy.about[1]} <em>{copy.about[2]}</em></h2><p class="lead">{copy.aboutDescription}</p></div></section>
  <section class="services section" id="services"><div class="section-heading"><p class="eyebrow">{copy.servicesKicker}</p><h2>{copy.servicesTitle[0]} <em>{copy.servicesTitle[1]}</em><br />{copy.servicesTitle[2]}</h2></div><div class="service-grid">{#each copy.services as service}<article><div class="service-number">{service[0]} <span>↗</span></div><h3>{service[1]}</h3><p>{service[2]}</p></article>{/each}</div></section>
  <section class="work section" id="work"><div class="section-heading"><p class="eyebrow">{copy.workKicker}</p><h2>{copy.workTitle[0]}<br /><em>{copy.workTitle[1]}</em></h2></div><div class="work-list">{#each copy.work as project, i}<a href={localize(project[3])} target={project[3].startsWith('http') ? '_blank' : undefined} rel={project[3].startsWith('http') ? 'noreferrer' : undefined}><span class="work-index">0{i + 1}</span><div><p>{project[1]}</p><h3>{project[0]}</h3></div><p class="work-description">{project[2]}</p><span class="arrow">↗</span></a>{/each}</div></section>
  <section class="contact section" id="contact"><p class="eyebrow">{copy.contactKicker}</p><h2>{copy.contact[0]}<br />{copy.contact[1]} <em>{copy.contact[2]}</em></h2><a class="contact-email" href="mailto:team@qub-its.com?subject=New%20project%20with%20Qub-its">team@qub-its.com <span>↗</span></a><p class="contact-note">{copy.contactNote}</p></section></main>
  <footer><a class="brand" href={isEnglish ? '/en/' : '/'}><img src={logo} alt="Qub-its" /></a><p>© {new Date().getFullYear()} Qub-its Inc.</p><div><a href={localize('/locAlert_policy.html')}>{copy.privacy}</a><a href="mailto:team@qub-its.com">{copy.contactLabel}</a></div></footer>
{/if}
