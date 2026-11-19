// CONTROLADOR: galería pública y administración de fotos.
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { UPLOADS_DIR } from '../db/conexion.js';
import { FotoModel } from '../models/FotoModel.js';
import { conPrecios } from './detalleController.js';

// Nombre: borrarArchivo
// Descripción: Borra del disco una foto subida.
// Entrada: El nombre del archivo.
// Salida: Nada.
// Objetivo: No dejar fotos viejas guardadas.
const borrarArchivo = (nombre) => nombre && !nombre.startsWith('http') && unlink(join(UPLOADS_DIR, nombre)).catch(() => {});

export const fotoController = {
  // Nombre: buscar
  // Descripción: Busca diseños de la galería.
  // Entrada: Los filtros.
  // Salida: Los diseños y el total.
  // Objetivo: Mostrar la galería.
  buscar(req, res) {
    const r = FotoModel.buscar(req.query);
    res.json({ ...r, fotos: conPrecios(r.fotos) });
  },
  // Nombre: opcionesDeFiltro
  // Descripción: Entrega las opciones de filtro de la galería.
  // Entrada: Nada.
  // Salida: Tipos, formas, colores y acabados.
  // Objetivo: Llenar los filtros.
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
    borrarArchivo(foto.archivo);
    res.status(204).end();
  }
};
