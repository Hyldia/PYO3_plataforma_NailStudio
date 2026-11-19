// Subida de fotos (multer): solo acepta JPG, PNG o WEBP, les pone un nombre único y permite borrarlas.
import multer from 'multer';
import { extname, join } from 'node:path';
import { unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { UPLOADS_DIR } from '../db/conexion.js';

const TIPOS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export const subirImagen = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    // Nombre: filename
    // Descripción: Da un nombre único a cada foto subida.
    // Entrada: La foto subida.
    // Salida: El nombre del archivo.
    // Objetivo: Que no se repitan nombres.
    filename: (req, file, cb) => cb(null, `${randomUUID()}${TIPOS[file.mimetype] || extname(file.originalname)}`)
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  // Nombre: fileFilter
  // Descripción: Acepta solo imágenes.
  // Entrada: La foto subida.
  // Salida: Sí o no.
  // Objetivo: No guardar archivos peligrosos.
  fileFilter: (req, file, cb) => {
    if (TIPOS[file.mimetype]) cb(null, true);
    else cb(new Error('Solo se aceptan imágenes JPG, PNG o WebP.'));
  }
});

// Nombre: borrarSubida
// Descripción: Borra del disco una foto que se había subido (las de internet no se tocan).
// Entrada: El nombre del archivo.
// Salida: Nada.
// Objetivo: No dejar fotos viejas ocupando espacio (una sola función para todo el sitio).
export const borrarSubida = (nombre) => nombre && !String(nombre).startsWith('http') && unlink(join(UPLOADS_DIR, nombre)).catch(() => {});
