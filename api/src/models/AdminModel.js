// MODELO: contraseña del panel del salón y sus sesiones.
// La contraseña se guarda cifrada (scrypt + sal) en la tabla ajustes y se cambia desde el panel.
// Mientras nadie la cambie, la contraseña inicial es la variable ADMIN_TOKEN (o "cambia-esta-clave" en desarrollo).
import { getDb } from '../db/conexion.js';
import { Contrasenas, hashToken, nuevoToken } from '../patrones/estrategiaAutenticacion.js';

const INICIAL = process.env.ADMIN_TOKEN || 'cambia-esta-clave';
const HORAS_SESION = 12;
const guardada = () => getDb().prepare("SELECT valor FROM ajustes WHERE clave = 'admin_contrasena'").get()?.valor || null;

export const AdminModel = {
  usaContrasenaInicial: () => !guardada(),
  verificar(texto) {
    const hash = guardada();
    return hash ? Contrasenas.verificar(String(texto || ''), hash) : String(texto || '') === INICIAL;
  },
  validarNueva(nueva) {
    if (!nueva || nueva.length < 8) return 'La contraseña nueva debe tener al menos 8 caracteres.';
    if (!/\d/.test(nueva) || !/[a-záéíóúñ]/i.test(nueva)) return 'La contraseña nueva debe tener letras y números.';
    if (nueva === INICIAL) return 'Elige una contraseña diferente a la inicial.';
    return null;
  },
  // Cambia la contraseña y cierra todas las demás sesiones abiertas
  cambiar(nueva, tokenActual) {
    const db = getDb();
    db.transaction(() => {
      db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('admin_contrasena', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor").run(Contrasenas.crear(nueva));
      db.prepare('DELETE FROM sesiones_admin WHERE token_hash != ?').run(hashToken(tokenActual || ''));
    })();
  },
  abrirSesion() {
    const token = nuevoToken();
    getDb().prepare(`INSERT INTO sesiones_admin (token_hash, vence_en) VALUES (?, datetime('now', '+${HORAS_SESION} hours'))`).run(hashToken(token));
    getDb().prepare("DELETE FROM sesiones_admin WHERE vence_en < datetime('now')").run();
    return token;
  },
  sesionValida: (token) => Boolean(token) && Boolean(getDb().prepare("SELECT 1 FROM sesiones_admin WHERE token_hash = ? AND vence_en > datetime('now')").get(hashToken(token))),
  cerrarSesion: (token) => getDb().prepare('DELETE FROM sesiones_admin WHERE token_hash = ?').run(hashToken(token || ''))
};
