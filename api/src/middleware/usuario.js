// Lee la sesión de la clienta (encabezado "Authorization: Bearer <token>").
import { UsuarioModel } from '../models/UsuarioModel.js';

const token = (req) => (req.get('authorization') || '').replace(/^Bearer\s+/i, '') || null;

export function conUsuario(req, res, next) {
  req.token = token(req);
  req.usuario = UsuarioModel.porToken(req.token);
  next();
}
export function soloUsuario(req, res, next) {
  conUsuario(req, res, () => (req.usuario ? next() : res.status(401).json({ error: 'Entra a tu cuenta o créala para continuar.', requiereCuenta: true })));
}
