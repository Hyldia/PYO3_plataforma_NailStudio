// MODELO: cupones de descuento y sus reglas (vigencia, compra mínima, solo combos).
import { getDb } from '../db/conexion.js';

// Nombre: hoy
// Descripción: Da la fecha de hoy.
// Entrada: Nada.
// Salida: La fecha en texto.
// Objetivo: Revisar si un cupón venció.
const hoy = () => new Date().toISOString().slice(0, 10);

export const CuponModel = {
  // Nombre: listarPublicos
  // Descripción: Lista los cupones vigentes.
  // Entrada: Nada.
  // Salida: Los cupones.
  // Objetivo: Usarlos como premios.
  listarPublicos: () => getDb().prepare(`
    SELECT codigo, descripcion, tipo, valor, minimo, vence, solo_combos FROM cupones
    WHERE activo = 1 AND publico = 1 AND (vence IS NULL OR vence >= ?) ORDER BY valor DESC`).all(hoy()),

  // Nombre: buscar
  // Descripción: Busca un cupón activo.
  // Entrada: El código.
  // Salida: El cupón o nada.
  // Objetivo: Aplicar descuentos.
  buscar: (codigo) => getDb().prepare('SELECT * FROM cupones WHERE codigo = ? AND activo = 1').get(String(codigo || '').trim().toUpperCase()),

  // Devuelve { cupon } si se puede usar, o { error } con el motivo en palabras simples
  // Nombre: validar
  // Descripción: Revisa si un cupón se puede usar.
  // Entrada: El código, el monto y si es combo.
  // Salida: El descuento o un error.
  // Objetivo: Aplicar bien los cupones.
  validar(codigo, { subtotal, esCombo }) {
    const cupon = this.buscar(codigo);
    if (!cupon) return { error: 'Ese cupón no existe o ya no está activo.' };
    if (cupon.vence && cupon.vence < hoy()) return { error: 'Ese cupón ya venció.' };
    if (cupon.solo_combos && !esCombo) return { error: 'Ese cupón solo aplica a combos.' };
    if (subtotal < cupon.minimo) return { error: `Ese cupón aplica en compras desde ₡${cupon.minimo.toLocaleString('es-CR')}.` };
    return { cupon };
  },

  // Nombre: registrarUso
  // Descripción: Suma un uso al cupón.
  // Entrada: El código.
  // Salida: Nada.
  // Objetivo: Saber cuántas veces se usó.
  registrarUso: (codigo) => getDb().prepare('UPDATE cupones SET usos = usos + 1 WHERE codigo = ?').run(codigo)
};
