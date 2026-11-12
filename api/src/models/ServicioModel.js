// MODELO: servicios del salón (manicure, acrílicas, pedicure...).
// Los modelos son la única capa que habla con la base de datos.
import { getDb } from '../db/connection.js';

export const ServicioModel = {
  listarActivos: () => getDb().prepare('SELECT * FROM servicios WHERE activo = 1 ORDER BY id').all(),
  buscarPorId: (id) => getDb().prepare('SELECT * FROM servicios WHERE id = ? AND activo = 1').get(id)
};
