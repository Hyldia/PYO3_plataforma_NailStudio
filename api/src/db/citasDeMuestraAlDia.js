// Mantiene "vivas" las citas de muestra (las marcadas con ejemplo = 1) para que el sitio se vea funcionando:
// cuando pasa la hora de una cita de muestra, queda como atendida (y algunas como "no llegó" con su adelanto cobrado).
// NUNCA toca las citas reales de clientas (ejemplo = 0). Al correr `npm run limpiar` ya no hay citas de muestra.
import { getDb } from './conexion.js';

// Nombre: ahoraEnCostaRica
// Descripción: Da la fecha y la hora actuales en Costa Rica.
// Entrada: Nada.
// Salida: { fecha: 'AAAA-MM-DD', hora: 'HH:MM' }.
// Objetivo: Comparar con la hora de las citas aunque el servidor esté en otro país.
function ahoraEnCostaRica() {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).reduce((obj, parte) => ({ ...obj, [parte.type]: parte.value }), {});
  return { fecha: `${partes.year}-${partes.month}-${partes.day}`, hora: `${partes.hour}:${partes.minute}` };
}

// Nombre: marcarCitasDeMuestraPasadas
// Descripción: Marca como atendidas (o "no llegó", 1 de cada 15) las citas de muestra cuya hora ya pasó.
// Entrada: Nada.
// Salida: Cuántas citas se marcaron.
// Objetivo: Que la agenda, el cierre del día y las gráficas se vean como en un salón que ya está funcionando.
export function marcarCitasDeMuestraPasadas() {
  const { fecha, hora } = ahoraEnCostaRica();
  const db = getDb();
  const pasadas = `ejemplo = 1 AND estado IN ('pendiente', 'confirmada') AND (fecha < @fecha OR (fecha = @fecha AND hora <= @hora))`;
  return db.transaction(() => {
    const noLlegaron = db.prepare(`UPDATE citas SET estado = 'no_asistio', decision_inasistencia = 'cobrada', monto_cobrado = anticipo, decidido_por = 'la dueña'
      WHERE ${pasadas} AND anticipo > 0 AND id % 15 = 0`).run({ fecha, hora }).changes;
    const atendidas = db.prepare(`UPDATE citas SET estado = 'completada' WHERE ${pasadas}`).run({ fecha, hora }).changes;
    return noLlegaron + atendidas;
  })();
}
