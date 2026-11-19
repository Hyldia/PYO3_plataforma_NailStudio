// Protege las rutas del panel: hace falta una sesión abierta con la contraseña del salón.
import { AdminModel } from '../models/AdminModel.js';

// Nombre: soloAdmin
// Descripción: Deja pasar solo a la administradora.
// Entrada: La petición.
// Salida: Sigue o responde "no autorizado".
// Objetivo: Proteger el panel.
export function soloAdmin(req, res, next) {
  if (!AdminModel.sesionValida(req.get('x-admin-token'))) return res.status(401).json({ error: 'Tu sesión del panel terminó. Vuelve a entrar con la contraseña.' });
  next();
}
