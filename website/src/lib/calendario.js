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
  const dos = (n) => String(n).padStart(2, '0');
  const eventos = citas.flatMap((c) => {
    const [h, m] = c.hora.split(':').map(Number);
    const fin = new Date(2000, 0, 1, h, m + (c.duracion_min || 60));
    const dia = c.fecha.replace(/-/g, '');
    return ['BEGIN:VEVENT', `UID:cita-${c.id}@ahnails`, `DTSTART:${dia}T${dos(h)}${dos(m)}00`, `DTEND:${dia}T${dos(fin.getHours())}${dos(fin.getMinutes())}00`,
      `SUMMARY:${c.servicio} en ${SALON.nombre}`, `LOCATION:${SALON.direccion}`, `DESCRIPTION:Con ${c.especialista}. Reserva #${c.id}.`, 'END:VEVENT'];
  });
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AH Nails//Reservas//ES', ...eventos, 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `citas-${SALON.nombre.replace(/\s/g, '-')}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
