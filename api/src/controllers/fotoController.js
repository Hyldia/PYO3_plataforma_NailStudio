// CONTROLADOR: galería pública y administración de fotos.
import { FotoModel } from '../models/FotoModel.js';
import { borrarSubida } from '../middleware/subidas.js';


export const fotoController = {
  // Nombre: buscar
  // Descripción: Busca diseños de la galería.
  // Entrada: Los filtros.
  // Salida: Los diseños y el total.
  // Objetivo: Mostrar la galería.
  buscar(req, res) {
    const r = FotoModel.buscar(req.query);
    res.json({ ...r, fotos: FotoModel.conPrecios(r.fotos) });
  },
  // Nombre: opcionesDeFiltro
  // Descripción: Entrega las opciones de filtro de la galería.
  // Entrada: Nada.
  // Salida: Tipos, formas, colores y acabados.
  // Objetivo: Llenar los filtros.
  // Nombre: parecidas
  // Descripción: Devuelve fotos reales parecidas a un diseño.
  // Entrada: Las palabras del diseño en ?palabras=rosa,almendra,perlas
  // Salida: La lista de fotos.
  // Objetivo: Que la clienta vea su idea en uñas reales.
  parecidas: (req, res) => res.json(FotoModel.parecidas(String(req.query.palabras || '').split(','), req.query.limite)),
  opcionesDeFiltro: (req, res) => res.json(FotoModel.opcionesDeFiltro()),

  // Nombre: registrarVista
  // Descripción: Suma una vista a un diseño.
  // Entrada: El número del diseño.
  // Salida: Nada.
  // Objetivo: Saber qué diseños gustan más.
  registrarVista(req, res) {
    FotoModel.sumarVista(req.params.id);
    res.status(204).end();
  },

  // Nombre: subir
  // Descripción: Sube un diseño nuevo a la galería.
  // Entrada: La foto y sus datos.
  // Salida: El diseño creado.
  // Objetivo: Agregar trabajos del salón.
  subir(req, res) {
    if (!req.file) return res.status(400).json({ error: 'Elige una imagen.' });
    res.status(201).json(FotoModel.crear({ archivo: req.file.filename, ...FotoModel.normalizar(req.body) }));
  },

  // Nombre: editar
  // Descripción: Edita un diseño de la galería.
  // Entrada: El diseño y sus cambios.
  // Salida: El diseño actualizado.
  // Objetivo: Corregir datos o precio.
  editar(req, res) {
    if (!FotoModel.buscarPorId(req.params.id)) return res.status(404).json({ error: 'No existe esa foto.' });
    res.json(FotoModel.actualizar(Number(req.params.id), FotoModel.normalizar(req.body)));
  },

  // Nombre: eliminar
  // Descripción: Elimina un diseño de la galería.
  // Entrada: El número del diseño.
  // Salida: Nada.
  // Objetivo: Quitar fotos.
  eliminar(req, res) {
    const foto = FotoModel.buscarPorId(req.params.id);
    if (!foto) return res.status(404).json({ error: 'No existe esa foto.' });
    FotoModel.eliminar(foto.id);
    borrarSubida(foto.archivo);
    res.status(204).end();
  },

  // Nombre: cambiarFotoDiseno
  // Descripción: Cambia la foto de un diseño de la galería.
  // Entrada: El diseño y la foto nueva.
  // Salida: El diseño actualizado.
  // Objetivo: Mantener la galería al día.
  cambiarFotoDiseno(req, res) {
    const foto = FotoModel.buscarPorId(req.params.id);
    if (!foto || !req.file) return res.status(400).json({ error: 'Diseño o imagen no válidos.' });
    FotoModel.cambiarArchivo(foto.id, req.file.filename);
    borrarSubida(foto.archivo);
    res.json(FotoModel.buscarPorId(foto.id));
  }
};
