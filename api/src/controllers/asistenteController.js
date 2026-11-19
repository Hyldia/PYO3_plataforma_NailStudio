// Foto de la asistente del chat: la sube el salón desde el panel (Equipo) y se guarda en la tabla ajustes.
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { getDb, UPLOADS_DIR } from '../db/conexion.js';

// Nombre: leer
// Descripción: Lee la foto guardada de la asistente virtual.
// Entrada: Nada.
// Salida: El nombre de la foto o nada.
// Objetivo: Mostrar la cara de la asistente.
const leer = () => getDb().prepare("SELECT valor FROM ajustes WHERE clave = 'asistente_foto'").get()?.valor || null;

export const asistenteController = {
  // Nombre: ver
  // Descripción: Entrega la foto de la asistente virtual.
  // Entrada: Nada.
  // Salida: La foto actual.
  // Objetivo: Mostrarla en el chat.
  ver: (req, res) => res.json({ foto: leer() }),
  // Nombre: subirFoto
  // Descripción: Sube una foto nueva para la asistente.
  // Entrada: La imagen.
  // Salida: La foto guardada.
  // Objetivo: Cambiar la cara de la asistente.
  subirFoto(req, res) {
    if (!req.file) return res.status(400).json({ error: 'Elige una imagen.' });
    const anterior = leer();
    getDb().prepare("INSERT INTO ajustes (clave, valor) VALUES ('asistente_foto', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor").run(req.file.filename);
    if (anterior) unlink(join(UPLOADS_DIR, anterior)).catch(() => {});
    res.json({ foto: req.file.filename });
  },
  // Nombre: quitarFoto
  // Descripción: Quita la foto de la asistente.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Volver al dibujo de siempre.
  quitarFoto(req, res) {
    const anterior = leer();
    getDb().prepare("DELETE FROM ajustes WHERE clave = 'asistente_foto'").run();
    if (anterior) unlink(join(UPLOADS_DIR, anterior)).catch(() => {});
    res.json({ foto: null });
  }
};
