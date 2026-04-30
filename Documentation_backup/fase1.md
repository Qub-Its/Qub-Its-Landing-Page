# Fase 1 - Análisis y Preparación para Migrar Landing Page a Svelte

## Auditoría del Código Actual
- **Archivo principal**: `index.html`.
- **Dependencias**:
  - Framework: usa `Bootstrap`.
  - Librerías de íconos: Remix Icon (`css/remixicon.css`).
  - CSS personalizado: `style.min.css`.
  - Scripts personalizados: `app.js`, entre otros.
- **Estructura General**:
  - 9 secciones clave: Header, Hero, About, Services, Portfolio, Projects, Contact, Footer y ajustes complementarios.
  - Diseño actual es estático, usando un modelo basado en Bootstrap con clases específicas para responsividad.

## Consideraciones Clave
- **Accesibilidad**:
  - Añadir atributos ARIA en íconos y botones.
  - No se detectaron mejoras de navegación de teclado ni diseño accesible óptimo.
- **Diseño Oscuro/Claro**:
  - Carece de soporte para dark mode.
  - Configurar variantes modernas con `TailwindCSS` sería recomendable.
- **Interactividad**:
  - Los scripts parecen diseñados de forma monolítica (en `app.js`) y pueden optimizarse dividiéndolos en componentes dinámicos.

## Plan de Migración por Componentes
- La aplicación será dividida en los siguientes componentes Svelte:
  - **Header**: La barra de navegación con toggles móviles.
  - **Hero**: Sección inicial con el mensaje central y CTA.
  - **About**: Información sobre la empresa y misión.
  - **Services**: Tarjetas que muestran los servicios disponibles.
  - **Portfolio**: Showcase de proyectos pasados.
  - **Projects**: Descripción de proyectos destacados.
  - **Contact**: Un formulario funcional construido con accesibilidad.
  - **Footer**: Información de contacto y derechos reservados.

## Prototipo y Diseño
- Wireframes básicos para cada sección con TailwindCSS.
- Estilos provisionales para implementar dark mode en todas las variantes.

## Siguientes Pasos
- Definir el entorno de desarrollo basado en Vite + Svelte y preparar el archivo `/docs/fase2.md`.