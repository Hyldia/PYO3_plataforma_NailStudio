// Crea el archivo .ics para guardar las citas en el calendario del teléfono.
import { SALON } from '../config.js';

// Descarga un archivo .ics con una o varias citas, para guardarlas en el calendario del teléfono
// Nombre: descargarCalendario
// Descripción: Descarga las citas para el calendario del teléfono.
// Entrada: Las citas.
// Salida: Nada.
// Objetivo: Agendarlas en el teléfono.
export function descargarCalendario(citas) {
  // Nombre: dos
  // Descripción: Pone dos dígitos.
  // Entrada: El número.
  // Salida: El texto.
  // Objetivo: Fechas parejas.
  const dos = (numero) => String(numero).padStart(2, '0');
  const eventos = citas.flatMap((cita) => {
    const [horas, minutos] = cita.hora.split(':').map(Number);
    const fin = new Date(2000, 0, 1, horas, minutos + (cita.duracion_min || 60));
    const dia = cita.fecha.replace(/-/g, '');
    return ['BEGIN:VEVENT', `UID:cita-${cita.id}@ahnails`, `DTSTART:${dia}T${dos(horas)}${dos(minutos)}00`, `DTEND:${dia}T${dos(fin.getHours())}${dos(fin.getMinutes())}00`,
      `SUMMARY:${cita.servicio} en ${SALON.nombre}`, `LOCATION:${SALON.direccion}`, `DESCRIPTION:Con ${cita.especialista}. Reserva #${cita.id}.`, 'END:VEVENT'];
  });
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AH Nails//Reservas//ES', ...eventos, 'END:VCALENDAR'].join('\r\n');
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  enlace.download = `citas-${SALON.nombre.replace(/\s/g, '-')}.ics`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}
