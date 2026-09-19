# Landing Svelte con lenguaje TUI

## Dirección

Una landing de producto digital, sobria y editorial: fondo verde profundo, acento lima tomado del contraste del logo, tipografía de interfaz y detalles de terminal. El tono visual comunica precisión técnica sin parecer una consola utilitaria.

## Estructura

- Hero con propuesta de valor, CTA y bloque terminal decorativo.
- Estudio, servicios, trabajo seleccionado y contacto por correo.
- Vistas Svelte para todas las URLs públicas históricas de políticas y producto.

## Decisiones

Se elimina el sitio Bootstrap/jQuery y la migración Svelte incompleta. La aplicación queda autocontenida, conserva el logo y `app-ads.txt`, y usa una regla de fallback de Vercel para que las subrutas funcionen con acceso directo.
