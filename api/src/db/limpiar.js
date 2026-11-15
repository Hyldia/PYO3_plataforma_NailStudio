// Borra las citas, diseños y pedidos de ejemplo para empezar con datos reales.
// Uso: npm run limpiar   (no toca servicios, especialistas, productos ni fotos)
import { getDb } from './connection.js';

const db = getDb();
db.exec(`
  DELETE FROM recordatorios; DELETE FROM citas; DELETE FROM disenos;
  DELETE FROM pedido_items; DELETE FROM pedidos;
  INSERT INTO ajustes (clave, valor) VALUES ('datos_ejemplo', '1')
    ON CONFLICT(clave) DO UPDATE SET valor = '1';
`);
console.log('Listo: se borraron las citas y pedidos de ejemplo.');
