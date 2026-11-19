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
  direccion: process.env.SALON_DIRECCION || '[Dirección del local], Cartago, Costa Rica',
  telefono: process.env.SALON_TELEFONO || '+506 0000 0000'
};

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
export function fechaLarga(fecha) {
  const d = new Date(`${fecha}T12:00:00`);
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}
const horaBonita = (h) => {
  const [hh, mm] = h.split(':').map(Number);
  return `${hh > 12 ? hh - 12 : hh}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'p. m.' : 'a. m.'}`;
};
const primerNombre = (n = '') => n.trim().split(/\s+/)[0] || '';

// ---------- Template Method ----------
class PlantillaMensaje {
  tipo = 'general';
  titulo = 'Mensaje';
  // El "esqueleto": no se sobreescribe
  generar(datos) {
    return [this.saludo(datos), this.motivo(datos), this.detalle(datos), this.opciones(datos), this.despedida(datos)]
      .filter(Boolean).join('\n\n').replace(/m\.\./g, 'm.');
  }
  saludo(d) { return `Hola ${primerNombre(d.cliente_nombre)}, te saludamos de ${SALON.nombre} 💅`; }
  motivo() { return ''; }
  detalle(d) { return d.fecha ? `Tu cita: ${d.servicio || 'servicio'}${d.especialista ? ` con ${d.especialista}` : ''}, el ${fechaLarga(d.fecha)} a las ${horaBonita(d.hora)}.` : ''; }
  opciones() { return ''; }
  despedida() { return `Gracias por tu comprensión.\n${SALON.nombre} · ${SALON.telefono}`; }
}

class MensajeCancelacion extends PlantillaMensaje {
  tipo = 'cancelacion';
  titulo = 'Cancelación por emergencia';
  motivo(d) {
    return `Lamentamos mucho avisarte que debemos cancelar tu cita${d.motivo ? ` por ${d.motivo.toLowerCase().replace(/\.$/, '')}` : ' por una emergencia'}.`;
  }
  opciones(d) {
    const partes = [];
    if (d.anticipo > 0) partes.push(`El adelanto de ₡${Math.round(d.anticipo).toLocaleString('es-CR')} queda a tu favor para la nueva cita, o te lo devolvemos si lo prefieres.`);
    partes.push('Respóndenos este mensaje y te buscamos otro espacio con prioridad.');
    if (d.nota) partes.push(d.nota);
    return partes.join('\n');
  }
  despedida() { return `Te pedimos disculpas por el inconveniente.\n${SALON.nombre} · ${SALON.telefono}`; }
}

class MensajeReprogramacion extends MensajeCancelacion {
  tipo = 'reprogramacion';
  titulo = 'Cambio de horario';
  motivo(d) {
    return `Por ${d.motivo ? d.motivo.toLowerCase().replace(/\.$/, '') : 'una emergencia'} no podremos atenderte en el horario que tenías.`;
  }
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
  motivo() { return 'Te recordamos tu cita 😊'; }
  opciones() { return `Te esperamos en ${SALON.direccion}. Si no puedes venir, avísanos por aquí para darle el espacio a otra clienta.`; }
  despedida() { return `¡Nos vemos pronto!\n${SALON.nombre}`; }
}

class MensajeConfirmacion extends PlantillaMensaje {
  tipo = 'confirmacion';
  titulo = 'Cita confirmada';
  motivo() { return '¡Tu cita quedó confirmada! ✨'; }
  opciones() { return `Dirección: ${SALON.direccion}. Llega 5 minutos antes, por favor.`; }
  despedida() { return `¡Gracias por elegirnos!\n${SALON.nombre}`; }
}

class MensajePedidoListo extends PlantillaMensaje {
  tipo = 'pedido-listo';
  titulo = 'Pedido listo para retirar';
  motivo(d) { return `¡Tu pedido #${d.id} ya está listo para retirar! 🛍️`; }
  detalle(d) { return d.detalle ? `Incluye: ${d.detalle}.` : ''; }
  opciones(d) { return `Puedes pasar a retirarlo en ${SALON.direccion}.${d.metodo_pago === 'salon' ? ` Total a pagar: ₡${Math.round(d.total).toLocaleString('es-CR')}.` : ''}`; }
  despedida() { return `¡Gracias por tu compra!\n${SALON.nombre}`; }
}

// ---------- Factory ----------
const PLANTILLAS = { cancelacion: MensajeCancelacion, reprogramacion: MensajeReprogramacion, recordatorio: MensajeRecordatorio, confirmacion: MensajeConfirmacion, 'pedido-listo': MensajePedidoListo };
export const TIPOS_MENSAJE = Object.fromEntries(Object.entries(PLANTILLAS).map(([k, C]) => [k, new C().titulo]));
export function crearMensaje(tipo) {
  const Clase = PLANTILLAS[tipo];
  if (!Clase) throw new Error(`Tipo de mensaje desconocido: ${tipo}`);
  return new Clase();
}

// ---------- Adapter del canal ----------
export const CanalWhatsApp = {
  nombre: 'whatsapp',
  // 8888 8888 → 50688888888 (si ya trae código de país, se respeta)
  numero(telefono = '') {
    const digitos = String(telefono).replace(/\D/g, '');
    return digitos.length === 8 ? `506${digitos}` : digitos;
  },
  enlace(telefono, texto) { return `https://wa.me/${this.numero(telefono)}?text=${encodeURIComponent(texto)}`; }
};

export function prepararMensaje(tipo, datos, telefono) {
  const plantilla = crearMensaje(tipo);
  const texto = plantilla.generar(datos);
  return { tipo, titulo: plantilla.titulo, texto, telefono, enlace: CanalWhatsApp.enlace(telefono, texto) };
}
