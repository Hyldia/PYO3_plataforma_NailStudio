// MODELO: citas. Incluye las reglas de negocio de una reserva
// (horarios del salón, validación de datos y cálculo del total y el adelanto).
import { getDb } from '../db/connection.js';

export const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '13:30', '14:30', '15:30', '16:30', '17:30'];
export const PORCENTAJE_ADELANTO = 0.3;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const SELECT = `
  SELECT c.*, s.nombre AS servicio, s.duracion_min, e.nombre AS especialista,
         d.forma, d.largo, d.color, d.acabado, d.decoracion, f.archivo AS foto_ref
  FROM citas c
  JOIN servicios s ON s.id = c.servicio_id
  JOIN especialistas e ON e.id = c.especialista_id
  LEFT JOIN disenos d ON d.id = c.diseno_id
  LEFT JOIN fotos f ON f.id = COALESCE(c.foto_ref_id, d.foto_ref_id)`;

export const CitaModel = {
  esFechaValida: (fecha) => FECHA.test(fecha || ''),
  esHoraValida: (hora) => HORARIOS.includes(hora),

  // Devuelve un mensaje de error o null si los datos de la clienta están bien
  validarCliente(cliente = {}) {
    if (!cliente.nombre || cliente.nombre.trim().length < 2) return 'Escribe tu nombre.';
    if (!/^[\d\s+-]{8,15}$/.test(cliente.telefono || '')) return 'Escribe un teléfono válido, por ejemplo 8888 8888.';
    if (cliente.email && !/^\S+@\S+\.\S+$/.test(cliente.email)) return 'Revisa el correo electrónico.';
    return null;
  },

  calcularMontos(precioServicio, recargoDiseno, metodoPago) {
    const total = precioServicio + (recargoDiseno || 0);
    const anticipo = metodoPago === 'salon' ? 0 : Math.round(total * PORCENTAJE_ADELANTO);
    return { total, anticipo };
  },

  horasOcupadas: (especialistaId, fecha) => getDb().prepare(`
    SELECT hora FROM citas WHERE especialista_id = ? AND fecha = ? AND estado != 'cancelada'
  `).all(especialistaId, fecha).map((f) => f.hora),

  disponibilidad(especialistaId, fecha) {
    const ocupadas = this.horasOcupadas(especialistaId, fecha);
    return HORARIOS.map((hora) => ({ hora, disponible: !ocupadas.includes(hora) }));
  },

  buscarPorId: (id) => getDb().prepare(`${SELECT} WHERE c.id = ?`).get(id),
  listarDelDia: (fecha) => getDb().prepare(`${SELECT} WHERE c.fecha = ? ORDER BY c.hora, e.nombre`).all(fecha),

  crear(c) {
    const r = getDb().prepare(`
      INSERT INTO citas (servicio_id, especialista_id, diseno_id, foto_ref_id, cliente_nombre, cliente_telefono, cliente_email,
                         notas, fecha, hora, estado, total, anticipo, metodo_pago)
      VALUES (@servicioId, @especialistaId, @disenoId, @fotoRefId, @nombre, @telefono, @email,
              @notas, @fecha, @hora, @estado, @total, @anticipo, @metodoPago)
    `).run(c);
    return this.buscarPorId(r.lastInsertRowid);
  },

  cambiarEstado(id, estado) {
    getDb().prepare('UPDATE citas SET estado = ? WHERE id = ?').run(estado, id);
    return this.buscarPorId(id);
  }
};
