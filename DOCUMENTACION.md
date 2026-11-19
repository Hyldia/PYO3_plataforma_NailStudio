# Documentación técnica · AH Nails

Sitio web de reservas y tienda del salón **AH Nails** (Limón, Limón, Costa Rica · WhatsApp 8532 6297).
Proyecto de curso del TEC de Alice Arias Salazar y Hyldia.

Este documento explica **cómo está ordenado el código**, **qué hace cada parte** y **dónde se cumplen los patrones de diseño (GoF), GRASP y SOLID**. Para instalar, correr y desplegar, ver el [README](README.md).

---

## 1. Partes del proyecto

| Carpeta | Qué tiene |
|---|---|
| `api/` | El servidor (Node.js + Express) y la base de datos SQLite. |
| `api/src/routes/` | **Rutas:** qué dirección (URL) llama a qué controlador. |
| `api/src/controllers/` | **Controladores:** reciben la petición, llaman al modelo o servicio y responden. No tienen SQL. |
| `api/src/models/` | **Modelos:** todo lo que se guarda o se lee de la base de datos, un archivo por tema. |
| `api/src/servicios/` | **Servicios:** reglas del negocio que usan varios controladores (cancelar citas, citas perdidas). |
| `api/src/patrones/` | **Patrones de diseño:** un archivo por patrón, con el nombre del patrón. |
| `api/src/middleware/` | Revisiones antes de entrar a una ruta (¿es la dueña? ¿es una especialista? ¿subió una foto?). |
| `api/src/db/` | Conexión, tablas (`schema.sql`), datos de muestra y comandos para traer fotos. |
| `api/src/lib/` | Ayudantes sin estado, por ejemplo las cuentas con fechas (`fechas.js`). |
| `website/` | El sitio (React + Vite). Es la **Vista** del MVC. |
| `website/src/pages/` | Una página por pantalla (Inicio, Servicios, Tienda, Diseña tus uñas, Reservar, Panel, Portal…). |
| `website/src/components/` | Piezas que se repiten (tarjetas, carrusel, mano del diseñador, ventanas). |
| `website/src/context/` | Datos compartidos por todas las pantallas (carrito, reserva, favoritos, cuenta). |
| `website/src/lib/` | `api.js` (única puerta al servidor), cálculos del diseño, ayudantes. |
| `website/src/estilos/` | Hojas de estilo, una por sección. |

### Cómo viaja una petición (MVC)

```
Pantalla (React) → lib/api.js → ruta (routes/) → controlador (controllers/) → modelo o servicio → base de datos
                                                       ↓
                                       respuesta en JSON → la pantalla se actualiza
```

Ejemplo: la dueña marca que una clienta **no llegó**:
`VentanaNoAsistio.jsx` → `api.admin.noAsistio()` → `POST /api/admin/citas/:id/no-asistio` → `agendaAdminController.noAsistio` → `inasistenciaServicio.registrarNoAsistio` → estrategia **Reprogramar** o **Cobrar** → `CitaModel`.

---

## 2. Reglas del salón (dónde están en el código)

| Regla | Dónde |
|---|---|
| Cancelar solo hasta **2 horas antes** (clientas y especialistas; la dueña siempre) | `api/src/servicios/citaServicio.js` → `revisarCancelacion()` |
| Clienta que **no llegó**: reprogramar o cobrar, lo decide la dueña o la especialista | `api/src/patrones/estrategiaInasistencia.js`, `api/src/servicios/inasistenciaServicio.js`, `website/src/components/VentanaNoAsistio.jsx` |
| **Cierre del día**: ingresos, pago al equipo, ganancia, pérdidas y citas perdidas | `api/src/models/ReporteModel.js` → `cierreDelDia()`, `website/src/pages/admin/CierreDia.jsx` |
| Comisión del **65 %** para las especialistas | `api/src/db/conexion.js` (valor inicial) y `api/src/patrones/estrategiaComision.js` (cálculo) |
| WhatsApp del salón en el pie de página y en Ayuda y contacto | `website/src/config.js` (`SALON.whatsapp` y `enlaceWhatsApp()`) |
| Diseño uña por uña: tocar una uña cambia **solo esa uña** | `website/src/lib/disenoUnas.js` y `website/src/pages/Disena.jsx` |
| Fotos reales parecidas al diseño | `api/src/models/FotoModel.js` → `parecidas()` y `api/src/db/enriquecerFotos.js` |

---

## 3. Patrones de diseño GoF (más de 3)

| Patrón | Archivo | Qué resuelve |
|---|---|---|
| **Singleton** | `api/src/db/conexion.js` | Una sola conexión a la base de datos para toda la aplicación. |
| **Strategy** | `estrategiaPagos.js`, `estrategiaAutenticacion.js`, `estrategiaComision.js`, `estrategiaInasistencia.js` | Varias formas de hacer lo mismo (cobrar, entrar, pagar al equipo, resolver una cita perdida) con el mismo método. |
| **Factory Method** | `crearMetodoPago()`, `crearEsquemaPago()`, `crearMensaje()` | El controlador pide la opción por nombre y recibe la clase correcta sin conocerla. |
| **Decorator** | `api/src/patrones/decoradorPrecio.js` | El precio del pedido se arma por capas: precio base → cupón (porcentaje o monto). |
| **Builder** | `constructorDiseno.js` (servidor y sitio) | El diseño de uñas se arma paso a paso y calcula su precio. |
| **State** | `estadoCita.js`, `estadoPedido.js` | Cada estado sabe a qué estados puede pasar (no se completa una cita cancelada). |
| **Observer** | `observadorEventos.js`, `website/src/context/` | Al crear o cancelar una cita se programan o borran recordatorios; el carrito avisa a todas las pantallas. |
| **Template Method** | `plantillaMensajes.js` | Todos los mensajes de WhatsApp siguen el mismo orden: saludo, motivo, detalle, opciones, despedida. |
| **Adapter** | `plantillaMensajes.js` → `CanalWhatsApp` | Convierte el teléfono de Costa Rica y el texto en un enlace `wa.me`. |
| **Chain of Responsibility** | `website/src/patrones/cadenaAsistente.js` | Cada tema del chat revisa la pregunta; si no es suya, la pasa al siguiente. |

---

## 4. Patrones GRASP

| Patrón GRASP | Cómo se cumple | Ejemplo |
|---|---|---|
| **Experto en información** | Quien tiene los datos hace el cálculo. | `ReporteModel.cierreDelDia()` calcula ganancias y pérdidas; `FotoModel.parecidas()` busca fotos; `ServicioModel.sugeridoParaDiseno()` elige el servicio de un diseño. |
| **Creador** | Crea un objeto quien tiene los datos para crearlo. | `CitaModel.crear()` crea las citas; la estrategia **Reprogramar** crea la cita nueva a partir de la original. |
| **Controlador** | Los controladores solo coordinan: reciben, llaman y responden. | `reporteAdminController.js` tiene dos funciones de una línea cada una. |
| **Bajo acoplamiento** | Ningún controlador usa la base de datos directamente; el sitio habla con el servidor solo por `lib/api.js`. | `grep getDb api/src/controllers` no encuentra nada. |
| **Alta cohesión** | Cada archivo hace una sola cosa. | El equipo está dividido en `AusenciaModel`, `NominaModel`, `AccesoEquipoModel`, `SolicitudLibreModel` y `EquipoModel`. |
| **Polimorfismo** | En vez de `if` por tipo, cada clase responde al mismo método. | `cobrar()`, `aplicar()`, `calcular()` y los estados de cita (`confirmar()`, `cancelar()`, `completar()`, `noAsistio()`). |
| **Fabricación pura** | Clases que no son del salón pero ordenan el código. | `servicios/citaServicio.js`, `servicios/inasistenciaServicio.js`, `lib/fechas.js`. |
| **Indirección** | Un intermediario evita que dos partes se conozcan. | `lib/api.js`, los middleware `soloAdmin` y `soloEquipo`, el Observer de eventos. |
| **Variaciones protegidas** | Lo que puede cambiar queda detrás de una interfaz. | Los mensajes de WhatsApp salen por `CanalWhatsApp`: si mañana se contrata la API de WhatsApp Business, solo se cambia el canal. |

---

## 5. Principios SOLID

| Principio | Qué significa | Dónde se ve |
|---|---|---|
| **S** – Responsabilidad única | Cada módulo tiene una sola razón para cambiar. | Un modelo por tabla o tema; un controlador por sección del panel; `CierreDia.jsx` solo muestra el cierre (los números vienen del servidor). |
| **O** – Abierto/Cerrado | Se agrega comportamiento sin cambiar lo que ya funciona. | Para una nueva decisión de cita perdida (por ejemplo «Perdonar») se crea otra clase en `estrategiaInasistencia.js`; el controlador no cambia. Igual con métodos de pago y mensajes. |
| **L** – Sustitución de Liskov | Cualquier estrategia se puede usar en lugar de otra. | `Reprogramar` y `Cobrar` (cita perdida) responden igual a `aplicar()`; el servicio usa cualquiera sin saber cuál es. Lo mismo SINPE, tarjeta y pago en el salón con `cobrar()`. |
| **I** – Segregación de interfaces | Nadie depende de funciones que no usa. | `api.admin`, `api.equipo` y `api.auth` están separados en `lib/api.js`; el portal de la especialista solo ve sus rutas (`equipoRoutes.js`). |
| **D** – Inversión de dependencias | Lo importante depende de abstracciones, no de detalles. | Los controladores piden la clase a una fábrica (`crearMetodoPago`, `crearEsquemaPago`, `crearMensaje`) y solo usan su método común, sin conocer la clase concreta. |

---

## 6. Convenciones del código

- **Todo en español** y con nombres que dicen qué guardan: `citasPerdidas`, `gananciaSalon`, `horasLibres`, `nuevaFecha`, `evento` (en lugar de `e`), `respuesta`, `error`.
- **Cada función** tiene cinco líneas de comentario: `Nombre`, `Descripción`, `Entrada`, `Salida`, `Objetivo`.
- **Cada archivo** empieza con un comentario que dice para qué sirve.
- Los patrones están en `patrones/` y el archivo lleva el nombre del patrón (`estrategia…`, `estado…`, `decorador…`, `constructor…`, `observador…`, `plantilla…`, `cadena…`).
- Las claves (Unsplash, contraseña del panel) **nunca** van en el código ni en GitHub: solo en variables de entorno.
- Las contraseñas se guardan con **scrypt** y las tarjetas nunca se guardan (solo marca y últimos 4).

---

## 7. Uso en celular

- Todas las páginas se adaptan al ancho del teléfono (se probaron a 390 px sin desbordes).
- En el celular el menú se abre con el botón ☰ y el carrito y la reserva tienen una barra fija abajo.
- En «Diseña tus uñas» la mano sale primero y debajo las opciones.

---

## 8. Despliegue

El proyecto se despliega en **Railway** con un solo servicio (ver pasos en el README, sección «Desplegar en Railway»).
Variables importantes: `DB_PATH=/data/naile.db`, `UPLOADS_DIR=/data/uploads`, `ADMIN_TOKEN`, `TZ=America/Costa_Rica`.
