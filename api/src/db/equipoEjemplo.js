// Datos de muestra del equipo: citas de días pasados marcadas como atendidas, algunos días libres
// y los pagos de las quincenas anteriores, para que «Pagos al equipo» y el portal no salgan en cero.
// Se hace una sola vez. Se borra con `npm run limpiar`.
import { AusenciaModel } from '../models/AusenciaModel.js';
import { NominaModel } from '../models/NominaModel.js';
import { quincenaAnterior, quincenaDe, hoyIso } from '../lib/fechas.js';

// Nombre: sumar
// Descripción: Suma días a una fecha.
// Entrada: La fecha y cuántos días.
// Salida: La fecha nueva.
// Objetivo: Calcular días libres de ejemplo.
const sumar = (f, n) => { const d = new Date(`${f}T12:00:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// Nombre: cargarEquipoEjemplo
// Descripción: Llena datos de ejemplo del equipo (libres y pagos).
// Entrada: La base de datos.
// Salida: Nada.
// Objetivo: Que el portal tenga datos para probar.
export function cargarEquipoEjemplo(db) {
  const hecho = db.prepare("SELECT valor FROM ajustes WHERE clave = 'equipo_ejemplo'").get();
  if (hecho || !db.prepare("SELECT valor FROM ajustes WHERE clave = 'datos_ejemplo'").get()) return false;
  if (!db.prepare('SELECT COUNT(*) AS n FROM citas').get().n) return false; // ya limpiaron los datos de ejemplo
  const hoy = hoyIso();
  const equipo = db.prepare('SELECT * FROM especialistas WHERE activa = 1 ORDER BY id').all();

  db.transaction(() => {
    // 1. Las citas de días que ya pasaron quedan como atendidas (1 de cada 12, cancelada)
    db.prepare(`UPDATE citas SET estado = CASE WHEN id % 12 = 0 THEN 'cancelada' ELSE 'completada' END
      WHERE fecha < ? AND estado IN ('pendiente', 'confirmada')`).run(hoy);

    // 2. Días libres de muestra
    const muestras = [[0, 9, 2, 'vacaciones', 'Vacaciones de fin de año'], [1, 4, 1, 'permiso', 'Cita médica'], [2, 12, 1, 'libre', ''], [3, 6, 1, 'libre', 'Cumpleaños'], [4, -5, 1, 'incapacidad', 'Gripe']];
    muestras.forEach(([i, desde, dias, tipo, motivo]) => {
      const e = equipo[i];
      if (!e) return;
      const ini = sumar(hoy, desde);
      db.prepare('DELETE FROM citas WHERE especialista_id = ? AND fecha BETWEEN ? AND ?').run(e.id, ini, sumar(ini, dias - 1));
      AusenciaModel.agregarAusencias(e.id, { desde: ini, hasta: sumar(ini, dias - 1), tipo, motivo });
    });

    // 3. Las dos quincenas anteriores ya están pagadas
    const pasada = quincenaAnterior();
    [quincenaDe(sumar(pasada.desde, -1)), pasada].forEach((p) => equipo.forEach((e) => NominaModel.registrarPago(e.id, p)));

    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('equipo_ejemplo', '1') ON CONFLICT(clave) DO UPDATE SET valor = '1'").run();
  })();
  return true;
}

// Solicitudes de días libres de muestra (dos por responder y una ya aprobada), una sola vez
// Nombre: cargarSolicitudesEjemplo
// Descripción: Crea solicitudes de días libres de ejemplo.
// Entrada: La base de datos.
// Salida: Nada.
// Objetivo: Que la campanita tenga avisos al probar.
export function cargarSolicitudesEjemplo(db) {
  if (db.prepare("SELECT valor FROM ajustes WHERE clave = 'solicitudes_ejemplo'").get()) return false;
  if (!db.prepare("SELECT valor FROM ajustes WHERE clave = 'equipo_ejemplo'").get() || !db.prepare('SELECT COUNT(*) AS n FROM citas').get().n) return false;
  const hoy = hoyIso();
  const equipo = db.prepare('SELECT id FROM especialistas WHERE activa = 1 ORDER BY id').all();
  const ins = db.prepare('INSERT INTO solicitudes_libres (especialista_id, desde, hasta, tipo, motivo, estado, respuesta, resuelta_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  db.transaction(() => {
    if (equipo[1]) ins.run(equipo[1].id, sumar(hoy, 16), sumar(hoy, 16), 'permiso', 'Graduación de mi hermana', 'pendiente', null, null);
    if (equipo[2]) ins.run(equipo[2].id, sumar(hoy, 22), sumar(hoy, 24), 'vacaciones', 'Viaje familiar', 'pendiente', null, null);
    if (equipo[0]) ins.run(equipo[0].id, sumar(hoy, 9), sumar(hoy, 10), 'vacaciones', 'Vacaciones de fin de año', 'aprobada', '¡Disfrútalas!', new Date().toISOString().slice(0, 19).replace('T', ' '));
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('solicitudes_ejemplo', '1') ON CONFLICT(clave) DO UPDATE SET valor = '1'").run();
  })();
  return true;
}
