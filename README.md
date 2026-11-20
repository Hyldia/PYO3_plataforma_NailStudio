# AH Nails · Sitio web del salón de uñas

Sitio web completo para un salón de uñas: reservas en línea, galería de trabajos, diseñador de uñas, tienda, portal para el equipo y panel para la dueña.

**Autoras:** Hyldia Thomas y Alice Arias
**Curso:** Diseño de Software

## Accesos del equipo en otros dispositivos

Los usuarios y contraseñas de las manicuristas se guardan en la base SQLite del servidor; la contraseña se almacena como hash con sal. Para usar los accesos desde otros dispositivos, todos deben abrir el mismo sitio conectado a la misma API. En Railway, monta un volumen persistente en `/data` y configura `DB_PATH=/data/naile.db` para que los accesos sobrevivan reinicios y despliegues. Cada manicurista debe iniciar sesión una vez en cada dispositivo con el usuario y la contraseña asignados; no es necesario volver a darle acceso.
