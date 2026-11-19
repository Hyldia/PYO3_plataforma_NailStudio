// CONTROLADOR: entrar y salir del panel, y cambiar la contraseña del salón.
import { AdminModel } from '../models/AdminModel.js';

// Después de 5 intentos fallidos se espera 5 minutos (por dirección IP)
const fallos = new Map();
const ESPERA = 5 * 60 * 1000;

export const accesoAdminController = {
  // Nombre: entrar
  // Descripción: Revisa la contraseña de la administradora y abre su sesión.
  // Entrada: La contraseña que escribió.
  // Salida: Un permiso (token) para entrar al panel o un error.
  // Objetivo: Que solo la dueña entre al panel.
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
  // Nombre: verificar
  // Descripción: Confirma que la sesión del panel sigue abierta.
  // Entrada: La petición con el permiso.
  // Salida: Un "ok" y si aún usa la contraseña inicial.
  // Objetivo: Saber si puede seguir en el panel.
  verificar: (req, res) => res.json({ ok: true, contrasenaInicial: AdminModel.usaContrasenaInicial() }),
  // Nombre: salir
  // Descripción: Cierra la sesión del panel.
  // Entrada: El permiso de la sesión.
  // Salida: Nada (respuesta vacía).
  // Objetivo: Salir del panel de forma segura.
  salir(req, res) { AdminModel.cerrarSesion(req.get('x-admin-token')); res.status(204).end(); },
  // Nombre: cambiarContrasena
  // Descripción: Cambia la contraseña de la administradora.
  // Entrada: La contraseña actual y la nueva.
  // Salida: Un "ok" o un error.
  // Objetivo: Que la dueña ponga su propia contraseña.
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
