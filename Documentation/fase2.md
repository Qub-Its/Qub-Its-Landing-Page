# Fase 2: Configuración del Entorno de Svelte con TailwindCSS

## Objetivo
Establecer el proyecto base utilizando **Svelte**, definir **TailwindCSS** como framework de estilos principal y garantizar un entorno limpio para el desarrollo modular.

## Pasos

### 1. Crear el Proyecto Base
1. Ejecutar el comando para crear el boilerplate con Vite:
   ```bash
   npm create vite@latest my-landing-page --template svelte
   ```
   - `my-landing-page`: Nombre del proyecto actual.
2. Cambiar al directorio raíz del proyecto:
   ```bash
   cd my-landing-page
   ```
3. Instalar dependencias del proyecto:
   ```bash
   npm install
   ```

### 2. Agregar TailwindCSS
1. Instalar TailwindCSS junto con PostCSS y autoprefixer:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init
   ```
2. Configurar el archivo `tailwind.config.js`:
   - Asegurarse de incluir todas las rutas relevantes en `content` para purga:
     ```javascript
     content: [
       './src/**/*.{html,js,svelte,ts}',
     ],
     theme: {
       extend: {}, // Espacio para configuraciones personalizadas
     },
     plugins: [],
     ```
3. Crear un archivo CSS global:
   - En `src/app.css` (o similar), incluir las utilidades base de Tailwind:
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```
4. Asegurarse de importar el archivo CSS en `src/main.js`:
   ```javascript
   import './app.css';
   ```

### 3. Verificar Configuración
1. Ejecutar el servidor de desarrollo para confirmar que TailwindCSS funciona correctamente:
   ```bash
   npm run dev
   ```
   Verificar que las estructuras responsivas y utilidades CSS estén aplicándose.

### 4. Configurar Dark Mode
1. Habilitar dark mode en `tailwind.config.js`:
   ```javascript
   darkMode: 'class', // Theme switch por clase
   ```
2. Crear lógica en Svelte para cambiar entre temas claro y oscuro:
   - Implementar un store en `src/store/theme.js`:
     ```javascript
     import { writable } from 'svelte/store';

     const storedTheme = localStorage.getItem('theme') || 'light';
     export const theme = writable(storedTheme);

     theme.subscribe((value) => {
       localStorage.setItem('theme', value);
       document.documentElement.classList.toggle('dark', value === 'dark');
     });
     ```
3. Agregar el toggle al componente `Header.svelte`:
   ```svelte
   <script>
     import { theme } from '../store/theme';
   </script>

   <button
     on:click={() => theme.set(theme === 'light' ? 'dark' : 'light')}
     class="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700"
   >
     Toggle Theme
   </button>
   ```

### 5. Documentar Entorno e Instrucciones
- Escribir el documento `/docs/fase2.md` detallando:
  - Pasos de configuración del proyecto (boilerplate de Svelte).
  - Instalación y configuración de TailwindCSS.
  - Agregar compatibilidad con dark mode.