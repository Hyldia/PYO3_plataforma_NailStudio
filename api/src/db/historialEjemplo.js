// Historial de muestra de los últimos 60 días, con tantas citas por día como la agenda de muestra.
// Antes los días pasados tenían 2 o 3 citas y los días nuevos unas 45, y la gráfica de ventas
// mostraba una sola barra gigante. Se borra con `npm run limpiar` (que borra todas las citas de ejemplo).
import { CitaModel, PORCENTAJE_ADELANTO } from '../models/CitaModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { AusenciaModel } from '../models/AusenciaModel.js';
import { iso } from '../lib/fechas.js';

const NOMBRES = ['María', 'Ana', 'Valeria', 'Daniela', 'Sofía', 'Camila', 'Fernanda', 'Gabriela', 'Andrea', 'Paola', 'Natalia', 'Carolina', 'Mariana', 'Laura', 'Melissa', 'Karla', 'Tatiana', 'Priscilla', 'Rebeca', 'Jimena'];
const APELLIDOS = ['Rodríguez', 'Jiménez', 'Mora', 'Vargas', 'Rojas', 'Solís', 'Araya', 'Castro', 'Quesada', 'Chaves', 'Alfaro', 'Ramírez', 'Brenes', 'Monge'];

// Nombre: cargarHistorialEjemplo
// Descripción: Llena los días pasados con citas atendidas de ejemplo.
// Entrada: La base de datos.
// Salida: true si agregó citas.
// Objetivo: Que la gráfica de ventas se vea pareja y realista.
export function cargarHistorialEjemplo(db) {
  const hecho = db.prepare("SELECT valor FROM ajustes WHERE clave = 'historial_ejemplo'").get();
  if (hecho || !db.prepare("SELECT valor FROM ajustes WHERE clave = 'datos_ejemplo'").get()) return false;
  if (!db.prepare('SELECT COUNT(*) AS n FROM citas').get().n) return false; // ya limpiaron los datos de ejemplo

  let estado = 7331;
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
  if (!servicios.length || !especialistas.length) return false;
  const ocupadas = db.prepare("SELECT especialista_id || '|' || hora AS k FROM citas WHERE fecha = ? AND estado != 'cancelada'");
  const ins = db.prepare(`INSERT INTO citas (servicio_id, especialista_id, cliente_nombre, cliente_telefono, fecha, hora, estado, total, anticipo, metodo_pago, ejemplo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`);

  db.transaction(() => {
    const dia = new Date(); dia.setHours(12, 0, 0, 0);
    for (let i = 1; i <= 60; i++) {
      dia.setDate(dia.getDate() - 1);
      if (dia.getDay() === 0) continue; // domingo cerrado
      const fecha = iso(dia);
      const usadas = new Set(ocupadas.all(fecha).map((fila) => fila.k));
      const libres = especialistas
        .filter((especialista) => !AusenciaModel.tieneAusencia(especialista.id, fecha))
        .flatMap((especialista) => CitaModel.horasDe(especialista, fecha).filter((hora) => !usadas.has(`${especialista.id}|${hora}`)).map((hora) => [especialista, hora]));
      const total = especialistas.reduce((suma, especialista) => suma + CitaModel.horasDe(especialista, fecha).length, 0);
      // Viernes y sábados más llenos, igual que la agenda de muestra
      const meta = [5, 6].includes(dia.getDay()) ? 0.8 + aleatorio() * 0.15 : 0.6 + aleatorio() * 0.25;
      const faltan = Math.max(0, Math.round(total * meta) - usadas.size);
      libres.sort(() => aleatorio() - 0.5).slice(0, faltan).forEach(([e, hora]) => {
        const sv = elegir(servicios);
        const precio = sv.precio_oferta ?? sv.precio;
        const metodo = elegir(['SINPE Móvil', 'SINPE Móvil', 'Tarjeta', 'Pago en el salón']);
        ins.run(sv.id, e.id, `${elegir(NOMBRES)} ${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`, `${elegir(['6', '7', '8'])}${100 + Math.floor(aleatorio() * 900)} ${1000 + Math.floor(aleatorio() * 9000)}`,
          fecha, hora, aleatorio() < 0.06 ? 'cancelada' : 'completada', precio, metodo === 'Pago en el salón' ? 0 : Math.round(precio * PORCENTAJE_ADELANTO), metodo);
      });
    }
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('historial_ejemplo', '1') ON CONFLICT(clave) DO UPDATE SET valor = '1'").run();
  })();
  return true;
}
