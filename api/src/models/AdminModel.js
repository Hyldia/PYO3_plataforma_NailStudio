// MODELO: contraseña del panel del salón y sus sesiones.
// La contraseña se guarda cifrada (scrypt + sal) en la tabla ajustes y se cambia desde el panel.
// Mientras nadie la cambie, la contraseña inicial es la variable ADMIN_TOKEN (o "cambia-esta-clave" en desarrollo).
import { getDb } from '../db/conexion.js';
import { Contrasenas, hashToken, nuevoToken } from '../patrones/estrategiaAutenticacion.js';

const INICIAL = process.env.ADMIN_TOKEN || 'cambia-esta-clave';
const HORAS_SESION = 12;
// Nombre: guardada
// Descripción: Lee la contraseña guardada del panel.
// Entrada: Nada.
// Salida: La contraseña cifrada o nada.
// Objetivo: Revisar la contraseña.
const guardada = () => getDb().prepare("SELECT valor FROM ajustes WHERE clave = 'admin_contrasena'").get()?.valor || null;

export const AdminModel = {
  // Nombre: usaContrasenaInicial
  // Descripción: Dice si aún se usa la contraseña inicial.
  // Entrada: Nada.
  // Salida: Sí o no.
  // Objetivo: Pedir que la cambien.
  usaContrasenaInicial: () => !guardada(),
  // Nombre: verificar
  // Descripción: Revisa si la contraseña es correcta.
  // Entrada: El texto escrito.
  // Salida: Sí o no.
  // Objetivo: Dejar entrar al panel.
  verificar(texto) {
    const hash = guardada();
    return hash ? Contrasenas.verificar(String(texto || ''), hash) : String(texto || '') === INICIAL;
  },
  // Nombre: validarNueva
  // Descripción: Revisa que la contraseña nueva sea segura.
  // Entrada: La contraseña nueva.
  // Salida: Un error o nada.
  // Objetivo: Evitar contraseñas débiles.
  validarNueva(nueva) {
    if (!nueva || nueva.length < 8) return 'La contraseña nueva debe tener al menos 8 caracteres.';
    if (!/\d/.test(nueva) || !/[a-záéíóúñ]/i.test(nueva)) return 'La contraseña nueva debe tener letras y números.';
    if (nueva === INICIAL) return 'Elige una contraseña diferente a la inicial.';
    return null;
  },
  // Cambia la contraseña y cierra todas las demás sesiones abiertas
  // Nombre: cambiar
  // Descripción: Guarda la contraseña nueva.
  // Entrada: La contraseña nueva y la sesión actual.
  // Salida: Nada.
  // Objetivo: Cambiar la contraseña.
  cambiar(nueva, tokenActual) {
    const db = getDb();
    db.transaction(() => {
      db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('admin_contrasena', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor").run(Contrasenas.crear(nueva));
      db.prepare('DELETE FROM sesiones_admin WHERE token_hash != ?').run(hashToken(tokenActual || ''));
    })();
  },
  // Nombre: abrirSesion
  // Descripción: Abre una sesión del panel.
  // Entrada: Nada.
  // Salida: El permiso (token).
  // Objetivo: Mantener la sesión abierta.
  abrirSesion() {
    const token = nuevoToken();
    getDb().prepare(`INSERT INTO sesiones_admin (token_hash, vence_en) VALUES (?, datetime('now', '+${HORAS_SESION} hours'))`).run(hashToken(token));
    getDb().prepare("DELETE FROM sesiones_admin WHERE vence_en < datetime('now')").run();
    return token;
  },
  // Nombre: sesionValida
  // Descripción: Revisa si una sesión del panel sirve.
  // Entrada: El permiso.
  // Salida: Sí o no.
  // Objetivo: Proteger el panel.
  sesionValida: (token) => Boolean(token) && Boolean(getDb().prepare("SELECT 1 FROM sesiones_admin WHERE token_hash = ? AND vence_en > datetime('now')").get(hashToken(token))),
  // Nombre: cerrarSesion
  // Descripción: Cierra una sesión del panel.
  // Entrada: El permiso.
  // Salida: Nada.
  // Objetivo: Salir del panel.
  cerrarSesion: (token) => getDb().prepare('DELETE FROM sesiones_admin WHERE token_hash = ?').run(hashToken(token || ''))
};
