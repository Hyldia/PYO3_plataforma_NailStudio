// CONTROLADOR: comentarios de la galería y de los servicios.
import { ComentarioModel, TIPOS_COMENTARIO } from '../models/ComentarioModel.js';
import { ResenaModel } from '../models/ResenaModel.js';

// Nombre: revisar
// Descripción: Revisa si un comentario trae lo necesario.
// Entrada: La petición.
// Salida: El tipo y el número de lo comentado.
// Objetivo: Evitar comentarios incompletos.
function revisar(req, res) {
  const { tipo } = req.params;
  const id = Number(req.params.id);
  if (!TIPOS_COMENTARIO.includes(tipo)) { res.status(404).json({ error: 'Ruta no encontrada.' }); return null; }
  if (!ComentarioModel.existe(tipo, id)) { res.status(404).json({ error: 'No encontramos eso.' }); return null; }
  return { tipo, id };
}

export const comentarioController = {
  // Nombre: listar
  // Descripción: Lista los comentarios de algo.
  // Entrada: Qué se comenta y su número.
  // Salida: Los comentarios.
  // Objetivo: Mostrar opiniones.
  listar(req, res) {
    const r = revisar(req, res); if (!r) return;
    res.json(ComentarioModel.listar(r.tipo, r.id, req.query.limite, req.query.filtro));
  },
  // Nombre: resumenes
  // Descripción: Da el promedio de estrellas de varios elementos.
  // Entrada: El tipo y sus números.
  // Salida: Promedio y cantidad de cada uno.
  // Objetivo: Mostrar estrellas en las tarjetas.
  resumenes(req, res) {
    if (!TIPOS_COMENTARIO.includes(req.params.tipo)) return res.status(404).json({ error: 'Ruta no encontrada.' });
    res.json(ComentarioModel.resumenes(req.params.tipo));
  },
  // Nombre: crear
  // Descripción: Guarda un comentario nuevo.
  // Entrada: El texto y las estrellas.
  // Salida: El comentario creado.
  // Objetivo: Que las clientas opinen.
  crear(req, res) {
    const r = revisar(req, res); if (!r) return;
    const error = ResenaModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(ComentarioModel.crear(r.tipo, r.id, req.body));
  }
};
