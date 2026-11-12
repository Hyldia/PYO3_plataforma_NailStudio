// MODELO: especialistas que atienden a las clientas.
import { getDb } from '../db/connection.js';

export const EspecialistaModel = {
  listar: () => getDb().prepare('SELECT * FROM especialistas ORDER BY id').all(),
  buscarPorId: (id) => getDb().prepare('SELECT * FROM especialistas WHERE id = ?').get(id)
};
