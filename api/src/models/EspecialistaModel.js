// MODELO: especialistas que atienden a las clientas, con sus días y horas de trabajo.
import { getDb } from '../db/connection.js';

const SELECT = `SELECT e.*, (SELECT COUNT(*) FROM citas c WHERE c.especialista_id = e.id AND c.estado != 'cancelada') AS citas FROM especialistas e`;

export const EspecialistaModel = {
  listar: () => getDb().prepare(`${SELECT} ORDER BY e.id`).all(),
  buscarPorId: (id) => getDb().prepare(`${SELECT} WHERE e.id = ?`).get(id),

  // ¿Trabaja ese día? (1 = lunes … 7 = domingo)
  trabajaEl(especialista, fecha) {
    const dia = new Date(`${fecha}T12:00:00`).getDay() || 7;
    return String(especialista.dias || '').split(',').map(Number).includes(dia);
  }
};
