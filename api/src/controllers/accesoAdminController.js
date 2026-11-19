// CONTROLADOR: entrar y salir del panel, y cambiar la contraseña del salón.
import { AdminModel } from '../models/AdminModel.js';

// Después de 5 intentos fallidos se espera 5 minutos (por dirección IP)
const fallos = new Map();
const ESPERA = 5 * 60 * 1000;

export const accesoAdminController = {
  entrar(req, res) {
    const ip = req.ip || 'x';
    const f = fallos.get(ip);
    if (f && f.n >= 5 && Date.now() - f.desde < ESPERA) return res.status(429).json({ error: 'Demasiados intentos. Espera 5 minutos y vuelve a intentarlo.' });
    if (!AdminModel.verificar(req.body.contrasena)) {
      fallos.set(ip, { n: (f && Date.now() - f.desde < ESPERA ? f.n : 0) + 1, desde: f && Date.now() - f.desde < ESPERA ? f.desde : Date.now() });
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }
    fallos.delete(ip);
    res.json({ token: AdminModel.abrirSesion(), contrasenaInicial: AdminModel.usaContrasenaInicial() });
  },
  verificar: (req, res) => res.json({ ok: true, contrasenaInicial: AdminModel.usaContrasenaInicial() }),
  salir(req, res) { AdminModel.cerrarSesion(req.get('x-admin-token')); res.status(204).end(); },
  cambiarContrasena(req, res) {
    const { actual, nueva, confirmar } = req.body;
    if (!AdminModel.verificar(actual)) return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
    if (nueva !== confirmar) return res.status(400).json({ error: 'La contraseña nueva y la confirmación no coinciden.' });
    const error = AdminModel.validarNueva(nueva);
    if (error) return res.status(400).json({ error });
    AdminModel.cambiar(nueva, req.get('x-admin-token'));
    res.json({ ok: true });
  }
};
