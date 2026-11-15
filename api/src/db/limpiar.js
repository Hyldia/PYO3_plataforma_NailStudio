// Borra las citas, diseños, pedidos y reseñas de ejemplo para empezar con datos reales.
// Uso: npm run limpiar   (no toca servicios, especialistas, productos ni fotos)
import { getDb } from './connection.js';
import { SQL_RESUMEN } from '../models/ResenaModel.js';

const db = getDb();
db.exec(`
  DELETE FROM recordatorios; DELETE FROM citas; DELETE FROM disenos;
  DELETE FROM resenas WHERE ejemplo = 1;
  DELETE FROM comentarios WHERE ejemplo = 1;
  DELETE FROM pedido_items; DELETE FROM pedidos;
  INSERT INTO ajustes (clave, valor) VALUES ('datos_ejemplo', '1')
    ON CONFLICT(clave) DO UPDATE SET valor = '1';
  INSERT INTO ajustes (clave, valor) VALUES ('comentarios_ejemplo', '1')
    ON CONFLICT(clave) DO UPDATE SET valor = '1';
  INSERT INTO ajustes (clave, valor) VALUES ('resenas_ejemplo', '1')
    ON CONFLICT(clave) DO UPDATE SET valor = '1';
`);
getDb().exec(SQL_RESUMEN);
console.log('Listo: se borraron las citas, pedidos y reseñas de ejemplo.');
