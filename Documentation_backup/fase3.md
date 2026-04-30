# Fase 3: Migración a Componentes en Svelte

## Objetivo
Migrar el contenido del landing page dividiéndolo en componentes **Svelte** reutilizables y dinámicos, mientras se asegura compatibilidad con dark mode y estilos modernos usando TailwindCSS.

## Pasos

### 1. División de Componentes
- **`Header.svelte`**: Barra de navegación fija con enlaces.
- **`Hero.svelte`**: Mensaje principal y CTA (call-to-action).
- **`About.svelte`**: Visión/misión de la empresa.
- **`Services.svelte`**: Tarjetas de servicios creadas desde props.
- **`Portfolio.svelte`**: Proyectos pasados dinámicos cargados desde JSON.
- **`Projects.svelte`**: Sección para proyectos destacados.
- **`Contact.svelte`**: Formulario accesible con soporte ARIA.
- **`Footer.svelte`**: Información de contacto básica.

### 2. Migración del HTML a Svelte
1. **Extraer HTML de cada sección desde `index.html`** y dividirlo en archivos individuales de componente Svelte.
2. **Añadir dinamismo**:
   - Reemplazar textos estáticos con **props**.
   - Ejemplo para `Hero.svelte`:
     ```svelte
     <script>
       export let title = "We are Qub-its";
       export let subtitle = "Tech help you need in a single place.";
       export let cta = "#contact";
     </script>

     <section id="home" class="bg-cover">
       <div class="container">
         <h1 class="text-4xl font-bold">{title}</h1>
         <p>{subtitle}</p>
         <a href="{cta}" class="btn-primary">Get Help!</a>
       </div>
     </section>
     ```
3. **Soporte Dark Mode**: Utilizar clases dinámicas de Tailwind.
   - Ejemplo en `Card.svelte`:
     ```svelte
     <div class="bg-white dark:bg-gray-900 p-4">
       <h3 class="dark:text-white">Título</h3>
       <p>Contenido...</p>
     </div>
     ```

### 3. Pruebas
1. Validar el diseño en dispositivos de escritorio y móvil.
2. Cambiar entre modo claro/oscurso y verificar consistencia visual.
3. Garantizar que el diseño mantenga accesibilidad.

### 4. Documentar y Preparar
- Guardar documentación en `/docs/fase3.md` explicando cómo los componentes y props interactúan entre sí.