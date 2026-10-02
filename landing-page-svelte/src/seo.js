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
  }
};
