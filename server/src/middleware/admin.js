// Protege las rutas del panel. La clave se define en la variable ADMIN_TOKEN.
// Para una versión final conviene cambiarlo por usuarios con contraseña (bcrypt + JWT).
const TOKEN = process.env.ADMIN_TOKEN || 'cambia-esta-clave';
if (!process.env.ADMIN_TOKEN) console.warn('Aviso: define ADMIN_TOKEN; se usa la clave de desarrollo "cambia-esta-clave".');

export function soloAdmin(req, res, next) {
  if (req.get('x-admin-token') !== TOKEN) return res.status(401).json({ error: 'Clave de administración incorrecta.' });
  next();
}
