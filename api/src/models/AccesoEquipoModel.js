// MODELO (Experto): usuario, contraseña y sesiones del portal del equipo.
import { getDb } from '../db/conexion.js';
import { Contrasenas, hashToken, nuevoToken } from '../patrones/estrategiaAutenticacion.js';

export const AccesoEquipoModel = {
  // Salida: Nada.
  // Objetivo: Darle acceso a su portal.
  definirAcceso(id, { usuario, contrasena }) {
    const usuarioLimpio = String(usuario || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(usuarioLimpio)) throw Object.assign(new Error('El usuario debe tener de 3 a 30 letras o números, sin espacios ni tildes.'), { status: 400 });
    const otro = getDb().prepare('SELECT id FROM especialistas WHERE usuario = ? AND id != ?').get(usuarioLimpio, id);
    if (otro) throw Object.assign(new Error('Ese usuario ya lo usa otra persona del equipo.'), { status: 409 });
    if (contrasena) {
      if (contrasena.length < 8 || !/\d/.test(contrasena) || !/[a-záéíóúñ]/i.test(contrasena)) throw Object.assign(new Error('La contraseña debe tener al menos 8 caracteres, con letras y números.'), { status: 400 });
      getDb().prepare('UPDATE especialistas SET usuario = ?, contrasena_hash = ? WHERE id = ?').run(usuarioLimpio, Contrasenas.crear(contrasena), id);
      getDb().prepare('DELETE FROM sesiones_equipo WHERE especialista_id = ?').run(id);
    } else {
      const tiene = getDb().prepare('SELECT contrasena_hash FROM especialistas WHERE id = ?').get(id)?.contrasena_hash;
      if (!tiene) throw Object.assign(new Error('Escribe una contraseña para darle acceso.'), { status: 400 });
      getDb().prepare('UPDATE especialistas SET usuario = ? WHERE id = ?').run(usuarioLimpio, id);
    }
  },
  // Nombre: quitarAcceso
  // Descripción: Quita el acceso de una especialista.
  // Entrada: La especialista.
  // Salida: Nada.
  // Objetivo: Bloquear su entrada.
  quitarAcceso(id) {
    getDb().prepare('UPDATE especialistas SET usuario = NULL, contrasena_hash = NULL WHERE id = ?').run(id);
    getDb().prepare('DELETE FROM sesiones_equipo WHERE especialista_id = ?').run(id);
  },
  // Nombre: entrar
  // Descripción: Revisa usuario y contraseña de una especialista.
  // Entrada: Usuario y contraseña.
  // Salida: Su permiso o un error.
  // Objetivo: Entrar al portal.
  entrar(usuario, contrasena) {
    const especialista = getDb().prepare('SELECT * FROM especialistas WHERE usuario = ? AND activa = 1').get(String(usuario || '').trim().toLowerCase());
    if (!especialista || !Contrasenas.verificar(String(contrasena || ''), especialista.contrasena_hash || '')) return null;
    const token = nuevoToken();
    getDb().prepare("INSERT INTO sesiones_equipo (token_hash, especialista_id, vence_en) VALUES (?, ?, datetime('now', '+12 hours'))").run(hashToken(token), especialista.id);
    return token;
  },
  // Nombre: porToken
  // Descripción: Busca a la especialista por su permiso.
  // Entrada: El permiso.
  // Salida: La especialista o nada.
  // Objetivo: Saber quién está en el portal.
  porToken: (token) => (token ? getDb().prepare(`SELECT e.* FROM sesiones_equipo s JOIN especialistas e ON e.id = s.especialista_id
    WHERE s.token_hash = ? AND s.vence_en > datetime('now') AND e.activa = 1`).get(hashToken(token)) || null : null),
  // Nombre: salir
  // Descripción: Cierra la sesión del portal.
  // Entrada: El permiso.
  // Salida: Nada.
  // Objetivo: Salir del portal.
  salir: (token) => getDb().prepare('DELETE FROM sesiones_equipo WHERE token_hash = ?').run(hashToken(token || ''))
};
