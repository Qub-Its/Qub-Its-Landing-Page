# Fase 4: Optimización y Despliegue de la Landing Page

## Objetivo
Optimizar el rendimiento, mejorar accesibilidad y SEO de la landing page, y desplegar el proyecto en **Vercel** con configuración de integración continua (CI/CD).

## Pasos Detallados

### 1. Optimización del Bundle
- **Eliminar estilos no usados**:
  Configurar purgado de TailwindCSS en `tailwind.config.js`:
  ```javascript
  content: [
    './src/**/*.{html,js,svelte,ts}',
  ],
  ```
- **Lazy Loading**:
  Aplicar en imágenes de gran tamaño:
  ```html
  <img loading="lazy" src="images/imagen.jpg" alt="Ejemplo Lazy Loading">
  ```

### 2. Mejores Prácticas de Accesibilidad
- Atributos ARIA añadidos en botones e inputs:
  ```html
  <button aria-label="Cambiar tema a oscuro">Toggle</button>
  ```
- Verificar contraste de color en dark mode con la guía WCAG 2.1.
- Auditar accesibilidad con Lighthouse.

### 3. SEO y Metatags
- Meta-etiquetas en `<head>`:
  ```html
  <meta name="description" content="Landing page para servicios tecnológicos.">
  <meta property="og:title" content="Qub-its Inc. - Innovación tecnológica">
  <meta property="og:image" content="/images/meta-image.png">
  <meta property="og:description" content="Soluciones tecnológicas profesionales.">
  ```
- Generar un `sitemap.xml` dinámico de la landing page.

### 4. Despliegue
#### Configuración Inicial:
1. Crear cuenta en **Vercel** e iniciar sesión.
2. Conectar el repositorio actual de GitHub.
3. Configurar scripts de build:
   ```bash
   npm run build
   ```
4. Variables de Entorno:
   - Si se requieren claves API, configurarlas en el dashboard de Vercel.

#### Validación de Dominio:
- Verificar el dominio temporal asignado por Vercel antes de publicarlo.

### 5. Documentar
- Crear `/docs/fase4.md` detallando:
  - Configuración en Vercel.
  - Pruebas realizadas antes y después del despliegue.