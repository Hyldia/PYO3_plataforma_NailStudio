// Foto de la asistente del chat: la sube el salón desde el panel (Equipo) y se guarda en la tabla ajustes.
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { getDb, UPLOADS_DIR } from '../db/connection.js';

const leer = () => getDb().prepare("SELECT valor FROM ajustes WHERE clave = 'asistente_foto'").get()?.valor || null;

export const asistenteController = {
  ver: (req, res) => res.json({ foto: leer() }),
  subirFoto(req, res) {
    if (!req.file) return res.status(400).json({ error: 'Elige una imagen.' });
    const anterior = leer();
    getDb().prepare("INSERT INTO ajustes (clave, valor) VALUES ('asistente_foto', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor").run(req.file.filename);
    if (anterior) unlink(join(UPLOADS_DIR, anterior)).catch(() => {});
    res.json({ foto: req.file.filename });
  },
  quitarFoto(req, res) {
    const anterior = leer();
    getDb().prepare("DELETE FROM ajustes WHERE clave = 'asistente_foto'").run();
    if (anterior) unlink(join(UPLOADS_DIR, anterior)).catch(() => {});
    res.json({ foto: null });
  }
};
