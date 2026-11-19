// MODELO: ajustes sueltos del sitio guardados como clave → valor (foto de la asistente,
// fotos de los círculos de categorías, versiones de los datos de ejemplo…).
// Es la única parte que escribe en la tabla «ajustes» (GRASP: Experto en información y Bajo acoplamiento).
import { getDb } from '../db/conexion.js';

export const AjustesModel = {
  // Nombre: leer
  // Descripción: Lee el valor de un ajuste.
  // Entrada: La clave.
  // Salida: El valor o nada.
  // Objetivo: Saber qué eligió la dueña.
  leer: (clave) => getDb().prepare('SELECT valor FROM ajustes WHERE clave = ?').get(clave)?.valor ?? null,

  // Nombre: guardar
  // Descripción: Guarda o cambia un ajuste.
  // Entrada: La clave y el valor.
  // Salida: Nada.
  // Objetivo: Recordar lo que eligió la dueña.
  guardar: (clave, valor) => getDb().prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor').run(clave, String(valor)),

  // Nombre: borrar
  // Descripción: Quita un ajuste.
  // Entrada: La clave.
  // Salida: Nada.
  // Objetivo: Volver a lo automático.
  borrar: (clave) => getDb().prepare('DELETE FROM ajustes WHERE clave = ?').run(clave),

  // Nombre: conPrefijo
  // Descripción: Lista los ajustes cuya clave empieza igual.
  // Entrada: El inicio de la clave (por ejemplo «portada:»).
  // Salida: Un objeto clave → valor (sin el prefijo).
  // Objetivo: Leer todas las fotos de categorías de una vez.
  conPrefijo(prefijo) {
    const filas = getDb().prepare('SELECT clave, valor FROM ajustes WHERE clave LIKE ?').all(`${prefijo}%`);
    return Object.fromEntries(filas.map((f) => [f.clave.slice(prefijo.length), f.valor]));
  }
};
