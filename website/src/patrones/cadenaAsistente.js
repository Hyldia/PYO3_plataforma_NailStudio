// Cerebro del asistente virtual del chat. Patrón Chain of Responsibility (GoF):
// cada "manejador" revisa si entiende la pregunta; si no, la pasa al siguiente de la cadena.
// El último manejador siempre responde (ofrece hablar con el salón por WhatsApp).
// Las respuestas usan datos reales del sitio (servicios, precios, cupones, horario) cuando hace falta.
import { SALON, dinero, enlaceWhatsApp } from '../config.js';

// Quita tildes y mayúsculas para comparar ("¿Cuánto cuesta?" → "cuanto cuesta")
// Nombre: normalizar
// Descripción: Quita tildes y pasa a minúscula.
// Entrada: El texto.
// Salida: El texto limpio.
// Objetivo: Entender preguntas.
export const normalizar = (t = '') => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
// Nombre: tiene
// Descripción: Revisa si un texto tiene alguna palabra.
// Entrada: El texto y las palabras.
// Salida: Sí o no.
// Objetivo: Entender preguntas.
const tiene = (texto, palabras) => palabras.some((palabra) => texto.includes(palabra));

class Manejador {
  siguiente = null;
  // Nombre: enlazar
  // Descripción: Une con el siguiente que responde.
  // Entrada: El siguiente.
  // Salida: El siguiente.
  // Objetivo: Armar la cadena de respuestas.
  enlazar(m) { this.siguiente = m; return m; }
  // Nombre: atender
  // Descripción: Responde o pasa la pregunta al siguiente.
  // Entrada: La pregunta y datos.
  // Salida: La respuesta.
  // Objetivo: Que la asistente conteste (Chain of Responsibility).
  async atender(texto, ctx) {
    if (this.entiende(texto, ctx)) return this.responder(texto, ctx);
    return this.siguiente ? this.siguiente.atender(texto, ctx) : null;
  }
  // Nombre: entiende
  // Descripción: Dice si entiende la pregunta (no por defecto).
  // Entrada: Nada.
  // Salida: No.
  // Objetivo: Base de la cadena.
  entiende() { return false; }
}

// Crea un manejador a partir de palabras clave y una función que arma la respuesta
// Nombre: regla
// Descripción: Crea una regla de respuesta.
// Entrada: Palabras, respuesta y condición.
// Salida: La regla.
// Objetivo: Agregar respuestas fácil.
const regla = (palabras, responder, extra = () => true) => new (class extends Manejador {
  // Nombre: entiende
  // Descripción: Revisa si la regla entiende la pregunta.
  // Entrada: La pregunta y datos.
  // Salida: Sí o no.
  // Objetivo: Elegir la respuesta.
  entiende(texto, ctx) { return tiene(texto, palabras) && extra(texto, ctx); }
  // Nombre: responder
  // Descripción: Da la respuesta de la regla.
  // Entrada: La pregunta y datos.
  // Salida: La respuesta.
  // Objetivo: Contestar.
  responder(texto, ctx) { return responder(texto, ctx); }
})();

// Nombre: horario
// Descripción: Escribe el horario del salón.
// Entrada: Nada.
// Salida: El texto.
// Objetivo: Responder horarios.
const horario = () => SALON.horario.map((turno) => `• ${turno.dias}: ${turno.horas}`).join('\n');

// Busca un servicio por nombre dentro de la pregunta ("cuanto cuesta el acrilico")
// Nombre: servicioMencionado
// Descripción: Busca qué servicio se mencionó.
// Entrada: La pregunta y los servicios.
// Salida: El servicio o nada.
// Objetivo: Responder precios.
function servicioMencionado(texto, servicios) {
  // Se compara por raíces de las palabras ("acrilico" encuentra "Uñas acrílicas")
  // Nombre: raiz
  // Descripción: Saca la raíz de una palabra.
  // Entrada: La palabra.
  // Salida: La raíz.
  // Objetivo: Entender variaciones.
  const raiz = (palabra) => palabra.slice(0, Math.min(6, palabra.length - 1));
  const VACIAS = ['que', 'del', 'las', 'los', 'una', 'uno', 'por', 'con', 'para', 'cuanto', 'cuesta', 'precio', 'vale', 'unas'];
  // Nombre: util
  // Descripción: Revisa si una palabra sirve para buscar.
  // Entrada: La palabra.
  // Salida: Sí o no.
  // Objetivo: Ignorar palabras vacías.
  const util = (palabra) => palabra.length >= 3 && !VACIAS.includes(palabra);
  const raices = texto.split(' ').filter(util).map(raiz);
  let mejor = null;
  let puntos = 0;
  servicios.forEach((servicio) => {
    const palabras = normalizar(servicio.nombre).split(' ').filter(util);
    const coincidencias = palabras.filter((palabra) => raices.includes(raiz(palabra))).length;
    const total = coincidencias - 0.2 * (palabras.length - coincidencias); // prefiere el nombre más corto y exacto
    if (coincidencias > 0 && total > puntos) { puntos = total; mejor = servicio; }
  });
  return mejor;
}

// Nombre: crearCadena
// Descripción: Arma la cadena de respuestas.
// Entrada: Nada.
// Salida: El primer eslabón.
// Objetivo: Que la asistente responda.
export function crearCadena() {
  const saludo = regla(['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'saludos'], () => ({
    texto: `¡Hola! Qué gusto saludarte. Soy Sofi, la asistente virtual de ${SALON.nombre}. ¿En qué te ayudo hoy?`,
    opciones: ['Quiero reservar una cita', 'Precios de servicios', 'Horario y ubicación', 'Cómo pagar']
  }), (texto) => texto.split(' ').length <= 4);

  const gracias = regla(['gracias', 'muchas gracias', 'mil gracias', 'genial', 'perfecto', 'excelente'], () => ({
    texto: '¡Con muchísimo gusto! Si te surge otra duda, aquí estoy.',
    opciones: ['Reservar una cita', 'Ver diseños']
  }), (texto) => texto.split(' ').length <= 5);

  const humano = regla(['persona', 'humano', 'asesora', 'hablar con alguien', 'whatsapp', 'llamar', 'telefono', 'numero', 'contacto'], () => ({
    texto: `Claro, te paso con el equipo del salón. Puedes escribirnos por WhatsApp o llamarnos al ${SALON.telefono}. Respondemos en horario de atención.`,
    enlaces: [{ texto: 'Escribir por WhatsApp', href: enlaceWhatsApp('Hola, tengo una consulta.') }, { texto: 'Página de contacto', to: '/contacto' }]
  }));

  const ubicacion = regla(['donde', 'ubicacion', 'direccion', 'quedan', 'mapa', 'como llego', 'parqueo', 'parqueadero'], () => ({
    texto: `Estamos en ${SALON.direccion}. En la página de contacto tienes el mapa para llegar.\n\nNuestro horario:\n${horario()}`,
    enlaces: [{ texto: 'Ver el mapa', to: '/contacto' }]
  }));

  const horarioM = regla(['horario', 'hora abren', 'abren', 'cierran', 'abierto', 'domingo', 'sabado', 'feriado', 'a que hora'], () => ({
    texto: `Nuestro horario es:\n${horario()}\n\nPara asegurar tu espacio, lo mejor es reservar en línea.`,
    opciones: ['Quiero reservar una cita', 'Dónde están']
  }));

  const cancelar = regla(['cancelar', 'cambiar mi cita', 'reprogramar', 'mover mi cita', 'no puedo ir', 'cambiar la hora', 'cambiar la fecha'], () => ({
    texto: 'Puedes cancelar o cambiar tu cita hasta 2 horas antes, desde «Mi cuenta» o por WhatsApp al 8532 6297. Tu adelanto queda a tu favor para la nueva cita. Si no llegas, la dueña o tu especialista decide si se reprograma o se cobra.',
    enlaces: [{ texto: 'Avisar por WhatsApp', href: enlaceWhatsApp('Hola, necesito cambiar mi cita.') }]
  }));

  const reservar = regla(['reservar', 'reserva', 'cita', 'agendar', 'turno', 'espacio', 'disponible', 'disponibilidad'], () => ({
    texto: 'Reservar es muy fácil, en 3 pasos:\n1. Eliges el servicio.\n2. Escoges especialista, día y hora libre.\n3. La agregas al carrito y apartas con solo el 30 %.\n\nTe confirmamos por WhatsApp y te recordamos un día antes.',
    enlaces: [{ texto: 'Reservar ahora', to: '/reservar' }],
    opciones: ['Precios de servicios', 'Quiénes son las especialistas']
  }));

  const precio = regla(['precio', 'cuesta', 'cuanto', 'vale', 'costo', 'tarifa', 'cobran'], (texto, ctx) => {
    const servicio = servicioMencionado(texto, ctx.servicios);
    if (servicio) {
      const oferta = servicio.precio_oferta != null;
      return {
        texto: `${servicio.nombre}: ${oferta ? `${dinero(servicio.precio_oferta)} (antes ${dinero(servicio.precio)})` : dinero(servicio.precio)} · dura unos ${servicio.duracion_min} minutos.${servicio.descripcion ? `\n${servicio.descripcion}` : ''}`,
        enlaces: [{ texto: `Reservar ${servicio.nombre}`, to: `/reservar?servicio=${servicio.id}` }]
      };
    }
    const lista = ctx.servicios.slice(0, 8).map((servicio) => `• ${servicio.nombre}: ${dinero(servicio.precio_oferta ?? servicio.precio)}`).join('\n');
    return {
      texto: lista ? `Estos son algunos de nuestros precios:\n${lista}\n\n¿Te interesa alguno en particular? Pregúntame por su nombre.` : 'Puedes ver todos los precios en la página de servicios.',
      enlaces: [{ texto: 'Ver todos los servicios', to: '/servicios' }]
    };
  });

  const pagos = regla(['pagar', 'pago', 'sinpe', 'tarjeta', 'efectivo', 'adelanto', 'deposito', 'transferencia', 'metodo'], () => ({
    texto: `Aceptamos SINPE Móvil, tarjeta de débito o crédito y efectivo en el salón.\n\nPara las citas apartas con el 30 % y el resto lo pagas en el salón. Los productos de la tienda los pagas al comprar (o al retirar, si eliges pagar en el salón).`,
    opciones: ['Hacen envíos', 'Hay cupones']
  }));

  const envios = regla(['envio', 'envian', 'domicilio', 'entrega', 'correos', 'retiro', 'retirar', 'mandan'], () => ({
    texto: 'Puedes retirar tu pedido gratis en el salón, o pedir envío a domicilio a una de tus direcciones guardadas (puedes tener hasta 3). Te avisamos por WhatsApp cuando esté listo o cuando salga.',
    enlaces: [{ texto: 'Ir a la tienda', to: '/tienda' }, { texto: 'Mis direcciones', to: '/cuenta' }]
  }));

  const cupones = regla(['cupon', 'descuento', 'promo', 'oferta', 'rebaja', 'codigo', 'ruleta', 'black friday'], (texto, ctx) => {
    const lista = ctx.cupones.slice(0, 4).map((cupon) => `• ${cupon.codigo}: ${cupon.descripcion}`).join('\n');
    return {
      texto: `¡Sí hay!${lista ? `\n${lista}` : ''}\n\nTambién puedes girar la ruleta de premios (el regalito de la esquina) y ganar un cupón. Se aplican al finalizar la compra.`,
      enlaces: [{ texto: 'Ver ofertas', to: '/tienda?ofertas=1&orden=descuento' }]
    };
  });

  const cuenta = regla(['cuenta', 'registr', 'contrasena', 'iniciar sesion', 'entrar', 'login', 'usuario', 'olvide'], () => ({
    texto: 'Para comprar necesitas una cuenta (así guardamos tus pedidos y direcciones). Entra en "Mi cuenta" → "Soy nueva" y llenas nombre, correo, teléfono y una contraseña. ¡Toma un minuto!\n\nSi olvidaste tu contraseña, escríbenos por WhatsApp y te ayudamos.',
    enlaces: [{ texto: 'Mi cuenta', to: '/cuenta' }]
  }));

  const especialistas = regla(['especialista', 'manicurista', 'quien me atiende', 'quienes', 'equipo', 'chicas', 'profesional'], (texto, ctx) => ({
    texto: ctx.especialistas.length
      ? `Nuestro equipo:\n${ctx.especialistas.slice(0, 10).map((especialista) => `• ${especialista.nombre}: ${especialista.especialidad}`).join('\n')}\n\nAl reservar puedes ver el horario libre de cada una.`
      : 'Tenemos un equipo de especialistas certificadas. Al reservar ves a cada una con su horario.',
    enlaces: [{ texto: 'Reservar con mi favorita', to: '/reservar' }]
  }));

  const duracion = regla(['dura', 'duracion', 'cuanto tiempo', 'semanas', 'aguanta', 'se levanta', 'se despega'], () => ({
    texto: 'En general:\n• Esmalte tradicional: 5 a 7 días.\n• Gel semipermanente: 2 a 3 semanas.\n• Acrílico o polygel: 3 a 4 semanas, con relleno.\n\nSi algo se levanta en los primeros 5 días, te lo reparamos sin costo.',
    opciones: ['Diferencia entre gel y acrílico', 'Precios de servicios']
  }));

  const diferencia = regla(['diferencia', 'gel o acrilico', 'acrilico o gel', 'cual es mejor', 'que me recomiendas', 'polygel'], () => ({
    texto: '• Gel semipermanente: va sobre tu uña natural, se ve brillante y dura 2-3 semanas.\n• Acrílico: alarga la uña, es muy resistente; ideal si quieres largo.\n• Polygel: alarga como el acrílico pero es más liviano y flexible.\n\nSi tienes uñas débiles, te recomendamos rubber base o builder gel. ¿Quieres reservar una valoración?',
    enlaces: [{ texto: 'Ver servicios', to: '/servicios' }]
  }));

  const disenos = regla(['diseno', 'disenos', 'galeria', 'fotos', 'ideas', 'inspiracion', 'nail art', 'decoracion', 'francesa'], () => ({
    texto: 'En la galería tienes cientos de diseños reales para inspirarte. Si uno te encanta, tocas "Reservar este diseño" y queda en tu cita. También puedes diseñar las tuyas uña por uña.',
    enlaces: [{ texto: 'Ver galería', to: '/galeria' }, { texto: 'Diseñar mis uñas', to: '/disena' }]
  }));

  const higiene = regla(['higiene', 'esteril', 'limpio', 'hongos', 'alergia', 'embarazada', 'diabetes', 'dolor'], () => ({
    texto: 'Tu salud es lo primero: esterilizamos todas las herramientas metálicas y usamos limas nuevas para cada clienta. Si tienes alguna alergia, condición de salud o estás embarazada, cuéntanos en las notas de la cita para adaptar los productos.'
  }));

  const ninos = regla(['nina', 'ninos', 'hija', 'menor', 'quince', 'boda', 'novia', 'grupo', 'amigas', 'evento'], () => ({
    texto: '¡Nos encantan los grupos! Al reservar, en el paso 3 puedes tocar "Agregar cita para otra persona": cada una con su servicio y su diseño, y si quieren, a la misma hora con diferentes especialistas. Para bodas o grupos grandes, escríbenos y les preparamos algo especial.',
    enlaces: [{ texto: 'Reservar para varias', to: '/reservar' }, { texto: 'Escribir por WhatsApp', href: enlaceWhatsApp('Hola, quiero reservar para un grupo.') }]
  }));

  const tienda = regla(['tienda', 'producto', 'comprar', 'esmalte', 'lampara', 'kit', 'aceite', 'lima'], () => ({
    texto: 'En la tienda tenemos los mismos productos profesionales que usamos en el salón: esmaltes, geles, lámparas, kits y cuidado de manos. Retiro gratis o envío a domicilio.',
    enlaces: [{ texto: 'Ir a la tienda', to: '/tienda' }, { texto: 'Más vendidos', to: '/tienda?orden=vendidos' }]
  }));

  // Siempre responde: no entendí, pero ofrezco ayuda real
  const respaldo = new (class extends Manejador {
    // Nombre: entiende
    // Descripción: Siempre entiende (último recurso).
    // Entrada: Nada.
    // Salida: Sí.
    // Objetivo: Nunca quedarse sin respuesta.
    entiende() { return true; }
    // Nombre: responder
    // Descripción: Responde cuando nadie más entendió.
    // Entrada: Nada.
    // Salida: La respuesta.
    // Objetivo: Ofrecer ayuda.
    responder() {
      return {
        texto: 'Mmm, no estoy segura de haber entendido. Puedo ayudarte con citas, precios, horario, pagos, envíos y cupones. Si prefieres, te comunico con una persona del salón por WhatsApp.',
        opciones: ['Quiero reservar una cita', 'Precios de servicios', 'Horario y ubicación'],
        enlaces: [{ texto: 'Hablar con una persona', href: enlaceWhatsApp('Hola, tengo una consulta.') }]
      };
    }
  })();

  // El orden importa: de lo más específico a lo más general
  const inicio = saludo;
  [gracias, humano, cancelar, diferencia, duracion, higiene, ninos, precio, cupones, pagos, envios, cuenta, especialistas, ubicacion, horarioM, reservar, disenos, tienda, respaldo]
    .reduce((anterior, eslabon) => anterior.enlazar(eslabon), inicio);
  return inicio;
}

// Respuestas para los botones rápidos (se envían como si la clienta las escribiera)
export const PREGUNTAS_RAPIDAS = ['Quiero reservar una cita', 'Precios de servicios', 'Horario y ubicación', 'Cómo pagar', 'Hacen envíos', 'Hay cupones'];
