// Mensajes a las clientas por WhatsApp. Usa tres patrones:
//
// · Template Method: PlantillaMensaje.generar() fija el orden de todo mensaje
//   (saludo → motivo → detalle → opciones → despedida) y cada subclase cambia solo las partes que necesita.
// · Factory: crearMensaje('cancelacion') devuelve la plantilla correcta sin que el controlador conozca las clases.
// · Adapter: CanalWhatsApp convierte el teléfono de Costa Rica y el texto en un enlace wa.me que abre
//   WhatsApp con el mensaje listo para enviar (sin pagar la API de WhatsApp Business).
//   Si algún día se contrata la API, solo se cambia el canal; las plantillas siguen igual.

export const SALON = {
  nombre: process.env.SALON_NOMBRE || 'AH Nails',
  direccion: process.env.SALON_DIRECCION || 'Limón, Limón, Costa Rica',
  telefono: process.env.SALON_TELEFONO || '+506 8532 6297'
};

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
// Nombre: fechaLarga
// Descripción: Escribe una fecha en palabras.
// Entrada: La fecha.
// Salida: El texto (lunes 5 de mayo).
// Objetivo: Mensajes fáciles de leer.
export function fechaLarga(fecha) {
  const d = new Date(`${fecha}T12:00:00`);
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}
// Nombre: horaBonita
// Descripción: Escribe la hora bonita.
// Entrada: La hora.
// Salida: El texto (3:00 p. m.).
// Objetivo: Mensajes fáciles de leer.
const horaBonita = (h) => {
  const [hh, mm] = h.split(':').map(Number);
  return `${hh > 12 ? hh - 12 : hh}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'p. m.' : 'a. m.'}`;
};
// Nombre: primerNombre
// Descripción: Saca el primer nombre.
// Entrada: El nombre completo.
// Salida: El primer nombre.
// Objetivo: Saludar con cariño.
const primerNombre = (n = '') => n.trim().split(/\s+/)[0] || '';

// ---------- Template Method ----------
class PlantillaMensaje {
  tipo = 'general';
  titulo = 'Mensaje';
  // El "esqueleto": no se sobreescribe
  // Nombre: generar
  // Descripción: Arma el mensaje completo en orden.
  // Entrada: Los datos.
  // Salida: El texto del mensaje.
  // Objetivo: Que todos los mensajes sigan el mismo molde.
  generar(datos) {
    return [this.saludo(datos), this.motivo(datos), this.detalle(datos), this.opciones(datos), this.despedida(datos)]
      .filter(Boolean).join('\n\n').replace(/m\.\./g, 'm.');
  }
  // Nombre: saludo
  // Descripción: Escribe el saludo.
  // Entrada: Los datos.
  // Salida: El saludo.
  // Objetivo: Empezar el mensaje.
  saludo(d) { return `Hola ${primerNombre(d.cliente_nombre)}, te saludamos de ${SALON.nombre} 💅`; }
  // Nombre: motivo
  // Descripción: Escribe el motivo (vacío por defecto).
  // Entrada: Nada.
  // Salida: Texto vacío.
  // Objetivo: Base del mensaje.
  motivo() { return ''; }
  // Nombre: detalle
  // Descripción: Escribe los datos de la cita.
  // Entrada: Los datos.
  // Salida: El texto.
  // Objetivo: Recordar la cita.
  detalle(d) { return d.fecha ? `Tu cita: ${d.servicio || 'servicio'}${d.especialista ? ` con ${d.especialista}` : ''}, el ${fechaLarga(d.fecha)} a las ${horaBonita(d.hora)}.` : ''; }
  // Nombre: opciones
  // Descripción: Escribe las opciones (vacío por defecto).
  // Entrada: Nada.
  // Salida: Texto vacío.
  // Objetivo: Base del mensaje.
  opciones() { return ''; }
  // Nombre: despedida
  // Descripción: Escribe la despedida.
  // Entrada: Nada.
  // Salida: La despedida.
  // Objetivo: Cerrar el mensaje.
  despedida() { return `Gracias por tu comprensión.\n${SALON.nombre} · ${SALON.telefono}`; }
}

class MensajeCancelacion extends PlantillaMensaje {
  tipo = 'cancelacion';
  titulo = 'Cancelación por emergencia';
  // Nombre: motivo
  // Descripción: Escribe por qué se canceló.
  // Entrada: Los datos.
  // Salida: El texto.
  // Objetivo: Explicar la cancelación.
  motivo(d) {
    return `Lamentamos mucho avisarte que debemos cancelar tu cita${d.motivo ? ` por ${d.motivo.toLowerCase().replace(/\.$/, '')}` : ' por una emergencia'}.`;
  }
  // Nombre: opciones
  // Descripción: Ofrece opciones para reponer la cita.
  // Entrada: Los datos.
  // Salida: El texto.
  // Objetivo: Ayudar a reprogramar.
  opciones(d) {
    const partes = [];
    if (d.anticipo > 0) partes.push(`El adelanto de ₡${Math.round(d.anticipo).toLocaleString('es-CR')} queda a tu favor para la nueva cita, o te lo devolvemos si lo prefieres.`);
    partes.push('Respóndenos este mensaje y te buscamos otro espacio con prioridad.');
    if (d.nota) partes.push(d.nota);
    return partes.join('\n');
  }
  // Nombre: despedida
  // Descripción: Escribe la despedida con disculpas.
  // Entrada: Nada.
  // Salida: La despedida.
  // Objetivo: Cerrar con amabilidad.
  despedida() { return `Te pedimos disculpas por el inconveniente.\n${SALON.nombre} · ${SALON.telefono}`; }
}

class MensajeReprogramacion extends MensajeCancelacion {
  tipo = 'reprogramacion';
  titulo = 'Cambio de horario';
  // Nombre: motivo
  // Descripción: Escribe el motivo del cambio.
  // Entrada: Los datos.
  // Salida: El texto.
  // Objetivo: Explicar el cambio.
  motivo(d) {
    return `Por ${d.motivo ? d.motivo.toLowerCase().replace(/\.$/, '') : 'una emergencia'} no podremos atenderte en el horario que tenías.`;
  }
  // Nombre: opciones
  // Descripción: Escribe la nueva fecha.
  // Entrada: Los datos.
  // Salida: El texto.
  // Objetivo: Avisar la fecha nueva.
  opciones(d) {
    const propuesta = d.nuevaFecha && d.nuevaHora
      ? `Te proponemos el ${fechaLarga(d.nuevaFecha)} a las ${horaBonita(d.nuevaHora)}. ¿Te sirve? Respóndenos SÍ para confirmarla o dinos otro horario.`
      : 'Respóndenos con el día y la hora que mejor te sirvan y te la reprogramamos sin costo.';
    return [propuesta, d.anticipo > 0 ? 'Tu adelanto se mantiene para la nueva cita.' : '', d.nota || ''].filter(Boolean).join('\n');
  }
}

class MensajeRecordatorio extends PlantillaMensaje {
  tipo = 'recordatorio';
  titulo = 'Recordatorio';
  // Nombre: motivo
  // Descripción: Escribe el motivo del recordatorio.
  // Entrada: Nada.
  // Salida: El texto.
  // Objetivo: Recordar la cita.
  motivo() { return 'Te recordamos tu cita 😊'; }
  // Nombre: opciones
  // Descripción: Escribe la dirección y cómo avisar.
  // Entrada: Nada.
  // Salida: El texto.
  // Objetivo: Ayudar a llegar.
  opciones() { return `Te esperamos en ${SALON.direccion}. Si no puedes venir, avísanos por aquí al menos 2 horas antes para darle el espacio a otra clienta.`; }
  // Nombre: despedida
  // Descripción: Escribe la despedida.
  // Entrada: Nada.
  // Salida: La despedida.
  // Objetivo: Cerrar el mensaje.
  despedida() { return `¡Nos vemos pronto!\n${SALON.nombre}`; }
}

class MensajeConfirmacion extends PlantillaMensaje {
  tipo = 'confirmacion';
  titulo = 'Cita confirmada';
  // Nombre: motivo
  // Descripción: Escribe el aviso de confirmación.
  // Entrada: Nada.
  // Salida: El texto.
  // Objetivo: Confirmar la cita.
  motivo() { return '¡Tu cita quedó confirmada! ✨'; }
  // Nombre: opciones
  // Descripción: Escribe la dirección.
  // Entrada: Nada.
  // Salida: El texto.
  // Objetivo: Ayudar a llegar.
  opciones() { return `Dirección: ${SALON.direccion}. Llega 5 minutos antes, por favor.`; }
  // Nombre: despedida
  // Descripción: Escribe la despedida.
  // Entrada: Nada.
  // Salida: La despedida.
  // Objetivo: Cerrar el mensaje.
  despedida() { return `¡Gracias por elegirnos!\n${SALON.nombre}`; }
}

class MensajePedidoListo extends PlantillaMensaje {
  tipo = 'pedido-listo';
  titulo = 'Pedido listo para retirar';
  // Nombre: motivo
  // Descripción: Avisa que el pedido está listo.
  // Entrada: Los datos del pedido.
  // Salida: El texto.
  // Objetivo: Avisar a la clienta.
  motivo(d) { return `¡Tu pedido #${d.id} ya está listo para retirar! 🛍️`; }
  // Nombre: detalle
  // Descripción: Escribe qué incluye el pedido.
  // Entrada: Los datos.
  // Salida: El texto.
  // Objetivo: Recordar lo que compró.
  detalle(d) { return d.detalle ? `Incluye: ${d.detalle}.` : ''; }
  // Nombre: opciones
  // Descripción: Escribe dónde retirar y cómo pagar.
  // Entrada: Los datos.
  // Salida: El texto.
  // Objetivo: Ayudar a retirar.
  opciones(d) { return `Puedes pasar a retirarlo en ${SALON.direccion}.${d.metodo_pago === 'salon' ? ` Total a pagar: ₡${Math.round(d.total).toLocaleString('es-CR')}.` : ''}`; }
  // Nombre: despedida
  // Descripción: Escribe la despedida.
  // Entrada: Nada.
  // Salida: La despedida.
  // Objetivo: Cerrar el mensaje.
  despedida() { return `¡Gracias por tu compra!\n${SALON.nombre}`; }
}

// ---------- Factory ----------
// Mensajes cuando la clienta no llegó a su cita: la dueña o la especialista decide reprogramar o cobrar
class MensajeInasistenciaReprogramada extends PlantillaMensaje {
  tipo = 'no-asistio-reprogramada';
  titulo = 'No llegó: cita reprogramada';
  // Nombre: motivo
  // Descripción: Explica que se reprogramó la cita a la que no llegó.
  // Entrada: Los datos de la cita.
  // Salida: El texto.
  // Objetivo: Avisarle a la clienta su nueva cita.
  motivo() { return 'Te esperamos en tu cita y no pudiste llegar. No te preocupes: te la reprogramamos.'; }
  // Nombre: opciones
  // Descripción: Da la nueva fecha y hora.
  // Entrada: Los datos con la nueva fecha y hora.
  // Salida: El texto.
  // Objetivo: Que sepa cuándo venir.
  opciones(d) {
    return [`Tu nueva cita: ${fechaLarga(d.nuevaFecha)} a las ${horaBonita(d.nuevaHora)}.`, d.anticipo > 0 ? 'Tu adelanto se mantiene para la nueva cita.' : '',
      'Si ese horario no te sirve, respóndenos por aquí. Recuerda que las citas se pueden cancelar hasta 2 horas antes.'].filter(Boolean).join('\n');
  }
  // Nombre: despedida
  // Descripción: Cierra el mensaje.
  // Entrada: Nada.
  // Salida: El texto.
  // Objetivo: Despedirse con amabilidad.
  despedida() { return `¡Te esperamos!\n${SALON.nombre} · ${SALON.telefono}`; }
}

class MensajeInasistenciaCobro extends PlantillaMensaje {
  tipo = 'no-asistio-cobro';
  titulo = 'No llegó: cobro de la cita';
  // Nombre: motivo
  // Descripción: Explica que no llegó y que se cobra la cita.
  // Entrada: Los datos con el monto.
  // Salida: El texto.
  // Objetivo: Avisar el cobro con claridad y respeto.
  motivo(d) { return `Te esperamos en tu cita y no llegaste. Según nuestra política de citas, se cobra ₡${Math.round(d.monto || 0).toLocaleString('es-CR')} por la cita no asistida.`; }
  // Nombre: opciones
  // Descripción: Explica cómo pagar.
  // Entrada: Los datos de la cita.
  // Salida: El texto.
  // Objetivo: Que pueda pagar fácil.
  opciones(d) {
    const colones = (monto) => `₡${Math.round(monto).toLocaleString('es-CR')}`;
    const pago = !(d.anticipo > 0) ? 'Puedes pagarlo por SINPE Móvil o en tu próxima visita.'
      : d.anticipo >= d.monto ? `Se descuenta de tu adelanto de ${colones(d.anticipo)}${d.anticipo > d.monto ? `; los ${colones(d.anticipo - d.monto)} que sobran quedan a tu favor para tu próxima cita` : ''}.`
        : `Se toma tu adelanto de ${colones(d.anticipo)} y los ${colones(d.monto - d.anticipo)} que faltan los puedes pagar por SINPE Móvil o en tu próxima visita.`;
    return [pago,
      'Si fue una emergencia, escríbenos por aquí y lo conversamos.'].join('\n');
  }
}

const PLANTILLAS = { cancelacion: MensajeCancelacion, reprogramacion: MensajeReprogramacion, recordatorio: MensajeRecordatorio, confirmacion: MensajeConfirmacion, 'pedido-listo': MensajePedidoListo,
  'no-asistio-reprogramada': MensajeInasistenciaReprogramada, 'no-asistio-cobro': MensajeInasistenciaCobro };
// Los mensajes que la dueña puede escribir a mano desde la agenda (los de "no llegó" se mandan solos al decidir)
const TIPOS_MANUALES = ['cancelacion', 'reprogramacion', 'recordatorio', 'confirmacion', 'pedido-listo'];
export const TIPOS_MENSAJE = Object.fromEntries(TIPOS_MANUALES.map((tipo) => [tipo, new PLANTILLAS[tipo]().titulo]));
// Nombre: crearMensaje
// Descripción: Elige el molde de mensaje.
// Entrada: El tipo de mensaje.
// Salida: El molde correcto.
// Objetivo: Crear mensajes (Template Method).
export function crearMensaje(tipo) {
  const Clase = PLANTILLAS[tipo];
  if (!Clase) throw new Error(`Tipo de mensaje desconocido: ${tipo}`);
  return new Clase();
}

// ---------- Adapter del canal ----------
export const CanalWhatsApp = {
  nombre: 'whatsapp',
  // 8888 8888 → 50688888888 (si ya trae código de país, se respeta)
  // Nombre: numero
  // Descripción: Limpia el número de teléfono.
  // Entrada: El teléfono.
  // Salida: Solo números con código de país.
  // Objetivo: Abrir WhatsApp bien.
  numero(telefono = '') {
    const digitos = String(telefono).replace(/\D/g, '');
    return digitos.length === 8 ? `506${digitos}` : digitos;
  },
  // Nombre: enlace
  // Descripción: Arma el enlace de WhatsApp.
  // Entrada: El teléfono y el texto.
  // Salida: El enlace.
  // Objetivo: Abrir el chat listo.
  enlace(telefono, texto) { return `https://wa.me/${this.numero(telefono)}?text=${encodeURIComponent(texto)}`; }
};

// Nombre: prepararMensaje
// Descripción: Prepara un mensaje de WhatsApp.
// Entrada: Tipo, datos y teléfono.
// Salida: El texto y su enlace.
// Objetivo: Avisar a la clienta.
export function prepararMensaje(tipo, datos, telefono) {
  const plantilla = crearMensaje(tipo);
  const texto = plantilla.generar(datos);
  return { tipo, titulo: plantilla.titulo, texto, telefono, enlace: CanalWhatsApp.enlace(telefono, texto) };
}
