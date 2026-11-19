// Foto de la asistente del chat: la sube el salón desde el panel (Equipo) y se guarda en la tabla ajustes.
import { AjustesModel } from '../models/AjustesModel.js';
import { borrarSubida } from '../middleware/subidas.js';

const CLAVE = 'asistente_foto';

// Nombre: leer
// Descripción: Lee la foto guardada de la asistente virtual.
// Entrada: Nada.
// Salida: El nombre de la foto o nada.
// Objetivo: Mostrar la cara de la asistente.
const leer = () => AjustesModel.leer(CLAVE);

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
    AjustesModel.guardar(CLAVE, req.file.filename);
    borrarSubida(anterior);
    res.json({ foto: req.file.filename });
  },
  // Nombre: quitarFoto
  // Descripción: Quita la foto de la asistente.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Volver al dibujo de siempre.
  quitarFoto(req, res) {
    const anterior = leer();
    AjustesModel.borrar(CLAVE);
    borrarSubida(anterior);
    res.json({ foto: null });
  }
};
