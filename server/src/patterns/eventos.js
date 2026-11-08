// Patrón Observer: los módulos publican eventos y otros se suscriben
// sin conocerse entre sí. Al crear una cita se programan sus recordatorios.
import { EventEmitter } from 'node:events';
import { recordatoriosRepo } from '../repositories/recordatoriosRepo.js';

export const eventos = new EventEmitter();

function restarHoras(fecha, hora, horas) {
  const d = new Date(`${fecha}T${hora}:00`);
  d.setHours(d.getHours() - horas);
  return d.toISOString();
}

eventos.on('cita:creada', ({ cita, recordatorios }) => {
  // Aquí se conectaría el envío real (correo o WhatsApp Business API)
  if (recordatorios.correo && cita.cliente_email) {
    recordatoriosRepo.crear(cita.id, 'correo', restarHoras(cita.fecha, cita.hora, 24));
  }
  if (recordatorios.whatsapp) {
    recordatoriosRepo.crear(cita.id, 'whatsapp', restarHoras(cita.fecha, cita.hora, 24));
    recordatoriosRepo.crear(cita.id, 'whatsapp', restarHoras(cita.fecha, cita.hora, 2));
  }
});

eventos.on('cita:cancelada', ({ citaId }) => {
  recordatoriosRepo.eliminarDeCita(citaId);
});
