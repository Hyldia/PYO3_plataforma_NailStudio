// Agenda de muestra para las próximas tres semanas: algunos días llenos, otros casi llenos y otros con espacio,
// para que el calendario del panel se vea como en un salón con movimiento.
// Nombres y teléfonos inventados. Se borra con `npm run limpiar` (que borra todas las citas de ejemplo).
import { CitaModel, PORCENTAJE_ADELANTO } from '../models/CitaModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';

const NOMBRES = ['María', 'Ana', 'Valeria', 'Daniela', 'Sofía', 'Camila', 'Fernanda', 'Gabriela', 'Andrea', 'Paola', 'Natalia', 'Carolina', 'Mariana', 'Laura', 'Melissa', 'Karla', 'Tatiana', 'Priscilla', 'Rebeca', 'Jimena'];
const APELLIDOS = ['Rodríguez', 'Jiménez', 'Mora', 'Vargas', 'Rojas', 'Solís', 'Araya', 'Castro', 'Quesada', 'Chaves', 'Alfaro', 'Ramírez', 'Brenes', 'Monge'];

export function cargarAgendaEjemplo(db) {
  const hecho = db.prepare("SELECT valor FROM ajustes WHERE clave = 'agenda_ejemplo'").get();
  if (hecho || !db.prepare("SELECT valor FROM ajustes WHERE clave = 'datos_ejemplo'").get()) return false;
  if (!db.prepare('SELECT COUNT(*) AS n FROM citas').get().n) return false; // ya limpiaron los datos de ejemplo

  let s = 1511;
  const r = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const elegir = (l) => l[Math.floor(r() * l.length)];
  const servicios = db.prepare('SELECT * FROM servicios WHERE activo = 1').all();
  const especialistas = EspecialistaModel.listar();
  const ins = db.prepare(`INSERT INTO citas (servicio_id, especialista_id, cliente_nombre, cliente_telefono, fecha, hora, estado, total, anticipo, metodo_pago, ejemplo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`);

  db.transaction(() => {
    const d = new Date(); d.setHours(12, 0, 0, 0);
    for (let i = 1; i <= 21; i++) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue;
      const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      // Viernes y sábados se llenan; la primera semana va más llena que la tercera
      const meta = [5, 6].includes(d.getDay()) && i <= 14 ? 1 : i <= 7 ? 0.65 + r() * 0.25 : 0.2 + r() * 0.35;
      const libres = especialistas.flatMap((e) => CitaModel.disponibilidad(e.id, fecha).filter((h) => h.disponible).map((h) => [e, h.hora]));
      const total = especialistas.reduce((n, e) => n + CitaModel.horasDe(e, fecha).length, 0);
      const ocupar = Math.max(0, Math.round(total * meta) - (total - libres.length));
      libres.sort(() => r() - 0.5).slice(0, ocupar).forEach(([e, hora]) => {
        const sv = elegir(servicios);
        const precio = sv.precio_oferta ?? sv.precio;
        const metodo = elegir(['SINPE Móvil', 'SINPE Móvil', 'Tarjeta', 'Pago en el salón']);
        ins.run(sv.id, e.id, `${elegir(NOMBRES)} ${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`, `${elegir(['6', '7', '8'])}${100 + Math.floor(r() * 900)} ${1000 + Math.floor(r() * 9000)}`,
          fecha, hora, r() < 0.75 ? 'confirmada' : 'pendiente', precio, metodo === 'Pago en el salón' ? 0 : Math.round(precio * PORCENTAJE_ADELANTO), metodo);
      });
    }
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('agenda_ejemplo', '1') ON CONFLICT(clave) DO UPDATE SET valor = '1'").run();
  })();
  return true;
}
