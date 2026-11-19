// MODELO: cuentas de clientas, sus sesiones y sus direcciones (máximo 3).
import { getDb } from '../db/conexion.js';
import { hashToken, nuevoToken } from '../patrones/estrategiaAutenticacion.js';

export const MAX_DIRECCIONES = 3;
const DIAS_SESION = 60;
export const PROVINCIAS = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
const publico = (u) => u && { id: u.id, nombre: u.nombre, correo: u.correo, telefono: u.telefono, proveedor: u.proveedor, foto: u.foto, creado_en: u.creado_en };

export const UsuarioModel = {
  publico,
  buscarPorId: (id) => getDb().prepare('SELECT * FROM usuarios WHERE id = ?').get(id),
  buscarPorCorreo: (correo) => getDb().prepare('SELECT * FROM usuarios WHERE correo = ?').get(String(correo || '').toLowerCase()),
  buscarPorProveedor: (p, id) => getDb().prepare('SELECT * FROM usuarios WHERE proveedor = ? AND proveedor_id = ?').get(p, id),

  validarRegistro(d) {
    if (!d.nombre || d.nombre.trim().length < 2) return 'Escribe tu nombre.';
    if (!/^\S+@\S+\.\S+$/.test(d.correo || '')) return 'Escribe un correo válido.';
    if (!/^[\d\s+-]{8,15}$/.test(d.telefono || '')) return 'Escribe un teléfono de 8 dígitos (para avisarte por WhatsApp).';
    if (!d.contrasena || d.contrasena.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/\d/.test(d.contrasena) || !/[a-záéíóúñ]/i.test(d.contrasena)) return 'La contraseña debe tener letras y números.';
    return null;
  },
  crear({ nombre, correo, telefono = null, contrasenaHash = null, proveedor = 'formulario', proveedorId = null, foto = null }) {
    const r = getDb().prepare(`INSERT INTO usuarios (nombre, correo, telefono, contrasena_hash, proveedor, proveedor_id, foto)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(nombre.trim().slice(0, 80), correo ? correo.toLowerCase() : null, telefono, contrasenaHash, proveedor, proveedorId, foto);
    return this.buscarPorId(r.lastInsertRowid);
  },
  // Google o Facebook: si ya existe por proveedor se usa; si el correo ya tiene cuenta, se vincula
  desdeProveedor(p) {
    const existente = this.buscarPorProveedor(p.proveedor, p.proveedorId) || (p.correo && this.buscarPorCorreo(p.correo));
    if (existente) {
      getDb().prepare('UPDATE usuarios SET proveedor_id = COALESCE(proveedor_id, ?), foto = COALESCE(foto, ?) WHERE id = ?').run(p.proveedorId, p.foto, existente.id);
      return this.buscarPorId(existente.id);
    }
    return this.crear(p);
  },
  actualizar(id, { nombre, telefono }) {
    getDb().prepare('UPDATE usuarios SET nombre = ?, telefono = ? WHERE id = ?').run(nombre.trim().slice(0, 80), telefono.trim(), id);
    return this.buscarPorId(id);
  },

  // ----- Sesiones -----
  abrirSesion(usuarioId) {
    const token = nuevoToken();
    getDb().prepare(`INSERT INTO sesiones (token_hash, usuario_id, vence_en) VALUES (?, ?, datetime('now', '+${DIAS_SESION} days'))`).run(hashToken(token), usuarioId);
    return token;
  },
  porToken(token) {
    if (!token) return null;
    return getDb().prepare(`SELECT u.* FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token_hash = ? AND s.vence_en > datetime('now')`).get(hashToken(token)) || null;
  },
  cerrarSesion: (token) => getDb().prepare('DELETE FROM sesiones WHERE token_hash = ?').run(hashToken(token)),

  // ----- Direcciones -----
  direcciones: (usuarioId) => getDb().prepare('SELECT * FROM direcciones WHERE usuario_id = ? ORDER BY principal DESC, id').all(usuarioId),
  direccion: (usuarioId, id) => getDb().prepare('SELECT * FROM direcciones WHERE usuario_id = ? AND id = ?').get(usuarioId, id),
  validarDireccion(d) {
    if (!d.etiqueta || !d.etiqueta.trim()) return 'Ponle un nombre a la dirección (por ejemplo, Casa).';
    if (!d.destinatario || d.destinatario.trim().length < 2) return 'Escribe quién recibe.';
    if (!/^[\d\s+-]{8,15}$/.test(d.telefono || '')) return 'Escribe un teléfono de 8 dígitos.';
    if (!PROVINCIAS.includes(d.provincia)) return 'Elige la provincia.';
    if (!d.canton?.trim() || !d.distrito?.trim()) return 'Escribe el cantón y el distrito.';
    if (!d.senas || d.senas.trim().length < 10) return 'Escribe las otras señas (por ejemplo, 100 m norte de la iglesia, casa blanca).';
    return null;
  },
  guardarDireccion(usuarioId, d, id = null) {
    const db = getDb();
    const datos = { usuarioId, etiqueta: d.etiqueta.trim().slice(0, 30), destinatario: d.destinatario.trim().slice(0, 80), telefono: d.telefono.trim(),
      provincia: d.provincia, canton: d.canton.trim().slice(0, 60), distrito: d.distrito.trim().slice(0, 60), senas: d.senas.trim().slice(0, 300) };
    return db.transaction(() => {
      if (id) {
        db.prepare(`UPDATE direcciones SET etiqueta = @etiqueta, destinatario = @destinatario, telefono = @telefono, provincia = @provincia,
          canton = @canton, distrito = @distrito, senas = @senas WHERE id = @id AND usuario_id = @usuarioId`).run({ ...datos, id });
      } else {
        const n = db.prepare('SELECT COUNT(*) AS n FROM direcciones WHERE usuario_id = ?').get(usuarioId).n;
        if (n >= MAX_DIRECCIONES) throw Object.assign(new Error(`Puedes guardar hasta ${MAX_DIRECCIONES} direcciones. Edita o borra una.`), { status: 409 });
        id = db.prepare(`INSERT INTO direcciones (usuario_id, etiqueta, destinatario, telefono, provincia, canton, distrito, senas, principal)
          VALUES (@usuarioId, @etiqueta, @destinatario, @telefono, @provincia, @canton, @distrito, @senas, @principal)`).run({ ...datos, principal: n === 0 ? 1 : 0 }).lastInsertRowid;
      }
      if (d.principal) this.hacerPrincipal(usuarioId, id);
      return this.direccion(usuarioId, id);
    })();
  },
  hacerPrincipal(usuarioId, id) {
    getDb().prepare('UPDATE direcciones SET principal = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE usuario_id = ?').run(id, usuarioId);
  },
  borrarDireccion(usuarioId, id) {
    const db = getDb();
    const d = this.direccion(usuarioId, id);
    if (!d) return false;
    db.prepare('DELETE FROM direcciones WHERE id = ?').run(id);
    if (d.principal) db.prepare('UPDATE direcciones SET principal = 1 WHERE id = (SELECT id FROM direcciones WHERE usuario_id = ? ORDER BY id LIMIT 1)').run(usuarioId);
    return true;
  },
  textoDireccion: (d) => `${d.etiqueta}: ${d.destinatario} (${d.telefono}) · ${d.provincia}, ${d.canton}, ${d.distrito} · ${d.senas}`,

  // Historial de la clienta
  pedidos: (usuarioId) => getDb().prepare(`SELECT p.id, p.total, p.estado, p.metodo_pago, p.entrega, p.direccion, p.costo_envio, datetime(p.creado_en, 'localtime') AS fecha,
      (SELECT GROUP_CONCAT(pi.cantidad || ' × ' || pr.nombre, ', ') FROM pedido_items pi JOIN productos pr ON pr.id = pi.producto_id WHERE pi.pedido_id = p.id) AS detalle
    FROM pedidos p WHERE p.usuario_id = ? ORDER BY p.creado_en DESC LIMIT 50`).all(usuarioId),
  citas: (usuarioId) => getDb().prepare(`SELECT c.id, c.fecha, c.hora, c.estado, c.total, c.cliente_nombre, s.nombre AS servicio, e.nombre AS especialista
    FROM citas c JOIN servicios s ON s.id = c.servicio_id JOIN especialistas e ON e.id = c.especialista_id
    WHERE c.usuario_id = ? ORDER BY c.fecha DESC, c.hora DESC LIMIT 50`).all(usuarioId)
};
