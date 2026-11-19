// Protege el portal del equipo: cada especialista entra con su usuario y contraseña.
import { EquipoModel } from '../models/EquipoModel.js';

// Nombre: soloEquipo
// Descripción: Deja pasar solo a una especialista conectada.
// Entrada: La petición.
// Salida: Sigue o responde "no autorizado".
// Objetivo: Proteger el portal del equipo.
export function soloEquipo(req, res, next) {
  const especialista = EquipoModel.porToken(req.get('x-equipo-token'));
  if (!especialista) return res.status(401).json({ error: 'Tu sesión terminó. Vuelve a entrar con tu usuario y contraseña.' });
  req.especialista = especialista;
  next();
}
