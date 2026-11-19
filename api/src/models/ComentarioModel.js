// MODELO: comentarios con estrellas de los diseños de la galería y de los servicios.
import { getDb } from '../db/conexion.js';
import { FILTRO_ESTRELLAS } from './ResenaModel.js';

export const TIPOS_COMENTARIO = ['foto', 'servicio'];

export const ComentarioModel = {
  // Nombre: existe
  // Descripción: Revisa si existe lo que se comenta.
  // Entrada: El tipo y su número.
  // Salida: Sí o no.
  // Objetivo: Evitar comentarios sueltos.
  existe(tipo, id) {
    const tabla = tipo === 'foto' ? 'fotos' : 'servicios';
    return Boolean(getDb().prepare(`SELECT 1 FROM ${tabla} WHERE id = ?`).get(id));
  },

  // Nombre: listar
  // Descripción: Lista comentarios.
  // Entrada: Tipo, número, cuántos y filtro.
  // Salida: Los comentarios y el resumen.
  // Objetivo: Mostrar opiniones.
  listar(tipo, refId, limite = 6, filtro = '') {
    const db = getDb();
    const filas = db.prepare('SELECT estrellas, COUNT(*) AS n FROM comentarios WHERE tipo = ? AND ref_id = ? GROUP BY estrellas').all(tipo, refId);
    const distribucion = [5, 4, 3, 2, 1].map((numero) => ({ estrellas: numero, cantidad: filas.find((fila) => fila.estrellas === numero)?.n || 0 }));
    const total = distribucion.reduce((suma, fila) => suma + fila.cantidad, 0);
    const promedio = total ? Math.round(distribucion.reduce((suma, fila) => suma + fila.estrellas * fila.cantidad, 0) / total * 10) / 10 : null;
    const resenas = db.prepare(`SELECT id, nombre, estrellas, comentario, creada_en, 0 AS verificada FROM comentarios
      WHERE tipo = ? AND ref_id = ? ${FILTRO_ESTRELLAS[filtro] || ''} ORDER BY creada_en DESC, id DESC LIMIT ?`).all(tipo, refId, Math.min(Number(limite) || 6, 50));
    return { total, promedio, distribucion, resenas };
  },

  // Promedio y cantidad de cada elemento de un tipo (para mostrar estrellas en las tarjetas)
  // Nombre: resumenes
  // Descripción: Saca promedio y cantidad de estrellas.
  // Entrada: El tipo.
  // Salida: Un resumen por cada uno.
  // Objetivo: Mostrar estrellas.
  resumenes(tipo) {
    return getDb().prepare(`SELECT ref_id AS id, COUNT(*) AS total, ROUND(AVG(estrellas), 1) AS promedio FROM comentarios WHERE tipo = ? GROUP BY ref_id`).all(tipo);
  },

  // Nombre: crear
  // Descripción: Guarda un comentario.
  // Entrada: Nombre, estrellas y texto.
  // Salida: El comentario guardado.
  // Objetivo: Que opinen.
  crear(tipo, refId, { nombre, estrellas, comentario }) {
    const resultado = getDb().prepare('INSERT INTO comentarios (tipo, ref_id, nombre, estrellas, comentario) VALUES (?, ?, ?, ?, ?)')
      .run(tipo, refId, String(nombre).trim().slice(0, 60), Number(estrellas), String(comentario).trim().slice(0, 800));
    return { id: Number(resultado.lastInsertRowid) };
  }
};
