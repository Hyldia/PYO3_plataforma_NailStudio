// Agenda de muestra para las próximas tres semanas: algunos días llenos, otros casi llenos y otros con espacio,
// para que el calendario del panel se vea como en un salón con movimiento.
// Nombres y teléfonos inventados. Se borra con `npm run limpiar` (que borra todas las citas de ejemplo).
import { CitaModel, PORCENTAJE_ADELANTO } from '../models/CitaModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';

const NOMBRES = ['María', 'Ana', 'Valeria', 'Daniela', 'Sofía', 'Camila', 'Fernanda', 'Gabriela', 'Andrea', 'Paola', 'Natalia', 'Carolina', 'Mariana', 'Laura', 'Melissa', 'Karla', 'Tatiana', 'Priscilla', 'Rebeca', 'Jimena'];
const APELLIDOS = ['Rodríguez', 'Jiménez', 'Mora', 'Vargas', 'Rojas', 'Solís', 'Araya', 'Castro', 'Quesada', 'Chaves', 'Alfaro', 'Ramírez', 'Brenes', 'Monge'];

// Nombre: cargarAgendaEjemplo
// Descripción: Llena la agenda con citas de ejemplo.
// Entrada: La base de datos.
// Salida: Nada.
// Objetivo: Que el panel tenga datos para probar.
export function cargarAgendaEjemplo(db) {
  const hecho = db.prepare("SELECT valor FROM ajustes WHERE clave = 'agenda_ejemplo'").get();
  if (hecho || !db.prepare("SELECT valor FROM ajustes WHERE clave = 'datos_ejemplo'").get()) return false;
  if (!db.prepare('SELECT COUNT(*) AS n FROM citas').get().n) return false; // ya limpiaron los datos de ejemplo

  let estado = 1511;
  // Nombre: r
  // Descripción: Da un número al azar (siempre la misma serie).
  // Entrada: Nada.
  // Salida: Un número entre 0 y 1.
  // Objetivo: Crear datos de ejemplo iguales cada vez.
  const aleatorio = () => ((estado = (estado * 1664525 + 1013904223) % 4294967296) / 4294967296);
  // Nombre: elegir
  // Descripción: Elige un elemento al azar de una lista.
  // Entrada: La lista.
  // Salida: Un elemento.
  // Objetivo: Variar los datos de ejemplo.
  const elegir = (lista) => lista[Math.floor(aleatorio() * lista.length)];
  const servicios = db.prepare('SELECT * FROM servicios WHERE activo = 1').all();
  const especialistas = EspecialistaModel.listar();
  const ins = db.prepare(`INSERT INTO citas (servicio_id, especialista_id, cliente_nombre, cliente_telefono, fecha, hora, estado, total, anticipo, metodo_pago, ejemplo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`);

  db.transaction(() => {
    const dia = new Date(); dia.setHours(12, 0, 0, 0);
    for (let i = 1; i <= 21; i++) {
      dia.setDate(dia.getDate() + 1);
      if (dia.getDay() === 0) continue;
      const fecha = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
      // Viernes y sábados se llenan; la primera semana va más llena que la tercera
      const meta = [5, 6].includes(dia.getDay()) && i <= 14 ? 1 : i <= 7 ? 0.65 + aleatorio() * 0.25 : 0.2 + aleatorio() * 0.35;
      const libres = especialistas.flatMap((especialista) => CitaModel.disponibilidad(especialista.id, fecha).filter((hora) => hora.disponible).map((hora) => [especialista, hora.hora]));
      const total = especialistas.reduce((suma, especialista) => suma + CitaModel.horasDe(especialista, fecha).length, 0);
      const ocupar = Math.max(0, Math.round(total * meta) - (total - libres.length));
      libres.sort(() => aleatorio() - 0.5).slice(0, ocupar).forEach(([e, hora]) => {
        const sv = elegir(servicios);
        const precio = sv.precio_oferta ?? sv.precio;
        const metodo = elegir(['SINPE Móvil', 'SINPE Móvil', 'Tarjeta', 'Pago en el salón']);
        ins.run(sv.id, e.id, `${elegir(NOMBRES)} ${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`, `${elegir(['6', '7', '8'])}${100 + Math.floor(aleatorio() * 900)} ${1000 + Math.floor(aleatorio() * 9000)}`,
          fecha, hora, aleatorio() < 0.75 ? 'confirmada' : 'pendiente', precio, metodo === 'Pago en el salón' ? 0 : Math.round(precio * PORCENTAJE_ADELANTO), metodo);
      });
    }
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('agenda_ejemplo', '1') ON CONFLICT(clave) DO UPDATE SET valor = '1'").run();
  })();
  return true;
}
