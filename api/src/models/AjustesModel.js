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

  // Nombre: circulos
  // Descripción: Lee qué círculos de categorías están ocultos y cuáles se agregaron al Inicio.
  // Entrada: Nada.
  // Salida: { ocultos: [...], inicioExtra: [...] }.
  // Objetivo: Que la dueña decida qué círculos se ven en el Inicio y en la Tienda.
  circulos() {
    const lista = (clave) => { try { const valor = JSON.parse(this.leer(clave) || '[]'); return Array.isArray(valor) ? valor : []; } catch { return []; } };
    return { ocultos: lista('circulos_ocultos'), inicioExtra: lista('circulos_inicio_extra') };
  },

  // Nombre: guardarCirculos
  // Descripción: Guarda los círculos ocultos y los agregados al Inicio.
  // Entrada: { ocultos, inicioExtra } (listas de nombres de categoría).
  // Salida: Lo guardado.
  // Objetivo: Agregar o quitar círculos sin tocar el código.
  guardarCirculos({ ocultos = [], inicioExtra = [] } = {}) {
    const limpiar = (lista) => [...new Set((Array.isArray(lista) ? lista : []).map((nombre) => String(nombre).trim().slice(0, 60)).filter(Boolean))].slice(0, 40);
    this.guardar('circulos_ocultos', JSON.stringify(limpiar(ocultos)));
    this.guardar('circulos_inicio_extra', JSON.stringify(limpiar(inicioExtra)));
    return this.circulos();
  },

  // Nombre: conPrefijo
  // Descripción: Lista los ajustes cuya clave empieza igual.
  // Entrada: El inicio de la clave (por ejemplo «portada:»).
  // Salida: Un objeto clave → valor (sin el prefijo).
  // Objetivo: Leer todas las fotos de categorías de una vez.
  conPrefijo(prefijo) {
    const filas = getDb().prepare('SELECT clave, valor FROM ajustes WHERE clave LIKE ?').all(`${prefijo}%`);
    return Object.fromEntries(filas.map((fila) => [fila.clave.slice(prefijo.length), fila.valor]));
  }
};
