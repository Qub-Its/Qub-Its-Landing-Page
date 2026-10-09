// Per-language <head> metadata. Shared by App.svelte (runtime) and
// scripts/localize-heads.mjs (writes static English heads after the build).
export const siteUrl = 'https://www.qub-its.com';

export const seo = {
  home: {
    es: {
      lang: 'es',
      ogLocale: 'es_ES',
      url: `${siteUrl}/`,
      title: 'Desarrollo de software a medida | Qub-its',
      description: 'Qub-its crea software a medida, productos digitales y plataformas web para empresas que quieren crecer con tecnología. Estrategia, diseño e ingeniería.',
      ogDescription: 'Productos digitales, plataformas web y software a medida para empresas.',
      imageAlt: 'Logo de Qub-its'
    },
    en: {
      lang: 'en',
      ogLocale: 'en_US',
      url: `${siteUrl}/en/`,
      title: 'Custom Software Development | Qub-its',
      description: 'Qub-its builds custom software, digital products, and web platforms for businesses ready to grow with technology. Strategy, design, and engineering.',
      ogDescription: 'Digital products, web platforms, and custom software for businesses.',
      imageAlt: 'Qub-its logo'
    }
  },
  mcdu: {
    es: {
      lang: 'es',
      ogLocale: 'es_ES',
      url: `${siteUrl}/labs/mcdu-trainer/`,
      title: 'Entrenador MCDU A320 | Qub-its Labs',
      description: 'Simulador interactivo y gratuito del MCDU del Airbus A320: aprende INIT, F-PLN, PERF y RAD NAV con una guía de teclas y ejercicios por niveles.',
      ogDescription: 'Aprende a usar el MCDU del A320 con un simulador interactivo y ejercicios por niveles.',
      imageAlt: 'Logo de Qub-its'
    },
    en: {
      lang: 'en',
      ogLocale: 'en_US',
      url: `${siteUrl}/en/labs/mcdu-trainer/`,
      title: 'A320 MCDU Trainer | Qub-its Labs',
      description: 'Free interactive Airbus A320 MCDU simulator: learn INIT, F-PLN, PERF and RAD NAV with a key-by-key guide and level-based exercises.',
      ogDescription: 'Learn the A320 MCDU with an interactive simulator and level-based exercises.',
      imageAlt: 'Qub-its logo'
    }
  },
  pfd: {
    es: {
      lang: 'es',
      ogLocale: 'es_ES',
      url: `${siteUrl}/labs/pfd-trainer/`,
      title: 'Entrenador PFD A320 | Qub-its Labs',
      description: 'Simulador interactivo y gratuito del PFD del Airbus A320: aprende a leer actitud, cintas de velocidad y altitud, FMA e ILS, vuela con el FCU y practica con ejercicios por niveles.',
      ogDescription: 'Aprende a leer el Primary Flight Display del A320 con un simulador interactivo y ejercicios por niveles.',
      imageAlt: 'Logo de Qub-its'
    },
    en: {
      lang: 'en',
      ogLocale: 'en_US',
      url: `${siteUrl}/en/labs/pfd-trainer/`,
      title: 'A320 PFD Trainer | Qub-its Labs',
      description: 'Free interactive Airbus A320 PFD simulator: learn to read attitude, speed and altitude tapes, FMA and ILS, fly with the FCU and practice with level-based exercises.',
      ogDescription: 'Learn to read the A320 Primary Flight Display with an interactive simulator and level-based exercises.',
      imageAlt: 'Qub-its logo'
    }
  },
  e6b: {
    es: {
      lang: 'es',
      ogLocale: 'es_ES',
      url: `${siteUrl}/labs/e6b-trainer/`,
      title: 'Entrenador E6B · Computadora de vuelo | Qub-its Labs',
      description: 'Aprende a usar la computadora de vuelo E6B (regla circular): tiempo-velocidad-distancia, combustible, TAS, altitud densidad y triángulo de viento, con ejercicios por niveles y práctica ilimitada.',
      ogDescription: 'Aprende a usar la computadora de vuelo E6B con un simulador interactivo, ejercicios por niveles y práctica.',
      imageAlt: 'Logo de Qub-its'
    },
    en: {
      lang: 'en',
      ogLocale: 'en_US',
      url: `${siteUrl}/en/labs/e6b-trainer/`,
      title: 'E6B Flight Computer Trainer | Qub-its Labs',
      description: 'Learn to use the E6B flight computer (whiz wheel): time-speed-distance, fuel, TAS, density altitude and the wind triangle, with level-based exercises and unlimited practice.',
      ogDescription: 'Learn the E6B flight computer with an interactive simulator, level-based exercises and practice.',
      imageAlt: 'Qub-its logo'
    }
  }
};
