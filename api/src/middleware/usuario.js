// Lee la sesión de la clienta (encabezado "Authorization: Bearer <token>").
import { UsuarioModel } from '../models/UsuarioModel.js';

// Nombre: token
// Descripción: Saca el permiso de la petición.
// Entrada: La petición.
// Salida: El permiso o nada.
// Objetivo: Saber quién está conectada.
const token = (req) => (req.get('authorization') || '').replace(/^Bearer\s+/i, '') || null;

// Nombre: conUsuario
// Descripción: Busca a la clienta conectada (si hay).
// Entrada: La petición.
// Salida: Sigue con la clienta o sin ella.
// Objetivo: Personalizar sin obligar a entrar.
export function conUsuario(req, res, next) {
  req.token = token(req);
  req.usuario = UsuarioModel.porToken(req.token);
  next();
}
// Nombre: soloUsuario
// Descripción: Deja pasar solo a clientas conectadas.
// Entrada: La petición.
// Salida: Sigue o responde "inicia sesión".
// Objetivo: Proteger "Mi cuenta".
export function soloUsuario(req, res, next) {
  conUsuario(req, res, () => (req.usuario ? next() : res.status(401).json({ error: 'Entra a tu cuenta o créala para continuar.', requiereCuenta: true })));
}
