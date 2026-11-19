// MODELO: cuentas de clientas, sus sesiones y sus direcciones (máximo 3).
import { getDb } from '../db/conexion.js';
import { hashToken, nuevoToken } from '../patrones/estrategiaAutenticacion.js';

export const MAX_DIRECCIONES = 3;
const DIAS_SESION = 60;
export const PROVINCIAS = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
// Nombre: publico
// Descripción: Deja solo los datos públicos de una clienta.
// Entrada: La clienta.
// Salida: Sus datos sin contraseña.
// Objetivo: Cuidar su privacidad.
const publico = (usuario) => usuario && { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, telefono: usuario.telefono, proveedor: usuario.proveedor, foto: usuario.foto, creado_en: usuario.creado_en };

export const UsuarioModel = {
  publico,
  // Nombre: buscarPorId
  // Descripción: Busca una clienta.
  // Entrada: El número.
  // Salida: La clienta o nada.
  // Objetivo: Ver sus datos.
  buscarPorId: (id) => getDb().prepare('SELECT * FROM usuarios WHERE id = ?').get(id),
  // Nombre: buscarPorCorreo
  // Descripción: Busca una clienta por correo.
  // Entrada: El correo.
  // Salida: La clienta o nada.
  // Objetivo: Iniciar sesión.
  buscarPorCorreo: (correo) => getDb().prepare('SELECT * FROM usuarios WHERE correo = ?').get(String(correo || '').toLowerCase()),
  // Nombre: buscarPorProveedor
  // Descripción: Busca una clienta por su cuenta de Google o Facebook.
  // Entrada: El servicio y su número.
  // Salida: La clienta o nada.
  // Objetivo: Entrar con Google.
  buscarPorProveedor: (p, id) => getDb().prepare('SELECT * FROM usuarios WHERE proveedor = ? AND proveedor_id = ?').get(p, id),

  // Nombre: validarRegistro
  // Descripción: Revisa los datos del registro.
  // Entrada: Los datos.
  // Salida: Un error o nada.
  // Objetivo: Evitar cuentas incompletas.
  validarRegistro(datos) {
    if (!datos.nombre || datos.nombre.trim().length < 2) return 'Escribe tu nombre.';
    if (!/^\S+@\S+\.\S+$/.test(datos.correo || '')) return 'Escribe un correo válido.';
    if (!/^[\d\s+-]{8,15}$/.test(datos.telefono || '')) return 'Escribe un teléfono de 8 dígitos (para avisarte por WhatsApp).';
    if (!datos.contrasena || datos.contrasena.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/\d/.test(datos.contrasena) || !/[a-záéíóúñ]/i.test(datos.contrasena)) return 'La contraseña debe tener letras y números.';
    return null;
  },
  // Nombre: crear
  // Descripción: Crea una cuenta de clienta.
  // Entrada: Nombre, correo, teléfono y contraseña.
  // Salida: La clienta.
  // Objetivo: Registrar clientas.
  crear({ nombre, correo, telefono = null, contrasenaHash = null, proveedor = 'formulario', proveedorId = null, foto = null }) {
    const resultado = getDb().prepare(`INSERT INTO usuarios (nombre, correo, telefono, contrasena_hash, proveedor, proveedor_id, foto)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(nombre.trim().slice(0, 80), correo ? correo.toLowerCase() : null, telefono, contrasenaHash, proveedor, proveedorId, foto);
    return this.buscarPorId(resultado.lastInsertRowid);
  },
  // Google o Facebook: si ya existe por proveedor se usa; si el correo ya tiene cuenta, se vincula
  // Nombre: desdeProveedor
  // Descripción: Crea o busca la cuenta desde Google o Facebook.
  // Entrada: Los datos del proveedor.
  // Salida: La clienta.
  // Objetivo: Entrar sin contraseña.
  desdeProveedor(p) {
    const existente = this.buscarPorProveedor(p.proveedor, p.proveedorId) || (p.correo && this.buscarPorCorreo(p.correo));
    if (existente) {
      getDb().prepare('UPDATE usuarios SET proveedor_id = COALESCE(proveedor_id, ?), foto = COALESCE(foto, ?) WHERE id = ?').run(p.proveedorId, p.foto, existente.id);
      return this.buscarPorId(existente.id);
    }
    return this.crear(p);
  },
  // Nombre: actualizar
  // Descripción: Actualiza nombre y teléfono.
  // Entrada: La clienta y sus datos.
  // Salida: La clienta.
  // Objetivo: Editar el perfil.
  actualizar(id, { nombre, telefono }) {
    getDb().prepare('UPDATE usuarios SET nombre = ?, telefono = ? WHERE id = ?').run(nombre.trim().slice(0, 80), telefono.trim(), id);
    return this.buscarPorId(id);
  },

  // ----- Sesiones -----
  // Nombre: abrirSesion
  // Descripción: Abre la sesión de una clienta.
  // Entrada: La clienta.
  // Salida: El permiso.
  // Objetivo: Mantenerla conectada.
  abrirSesion(usuarioId) {
    const token = nuevoToken();
    getDb().prepare(`INSERT INTO sesiones (token_hash, usuario_id, vence_en) VALUES (?, ?, datetime('now', '+${DIAS_SESION} days'))`).run(hashToken(token), usuarioId);
    return token;
  },
  // Nombre: porToken
  // Descripción: Busca la clienta por su permiso.
  // Entrada: El permiso.
  // Salida: La clienta o nada.
  // Objetivo: Saber quién está conectada.
  porToken(token) {
    if (!token) return null;
    return getDb().prepare(`SELECT u.* FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token_hash = ? AND s.vence_en > datetime('now')`).get(hashToken(token)) || null;
  },
  // Nombre: cerrarSesion
  // Descripción: Cierra la sesión.
  // Entrada: El permiso.
  // Salida: Nada.
  // Objetivo: Salir de la cuenta.
  cerrarSesion: (token) => getDb().prepare('DELETE FROM sesiones WHERE token_hash = ?').run(hashToken(token)),

  // ----- Direcciones -----
  // Nombre: direcciones
  // Descripción: Lista las direcciones de la clienta.
  // Entrada: La clienta.
  // Salida: Sus direcciones.
  // Objetivo: Usarlas al comprar.
  direcciones: (usuarioId) => getDb().prepare('SELECT * FROM direcciones WHERE usuario_id = ? ORDER BY principal DESC, id').all(usuarioId),
  // Nombre: direccion
  // Descripción: Busca una dirección.
  // Entrada: La clienta y la dirección.
  // Salida: La dirección o nada.
  // Objetivo: Editarla.
  direccion: (usuarioId, id) => getDb().prepare('SELECT * FROM direcciones WHERE usuario_id = ? AND id = ?').get(usuarioId, id),
  // Nombre: validarDireccion
  // Descripción: Revisa una dirección.
  // Entrada: Los datos.
  // Salida: Un error o nada.
  // Objetivo: Evitar direcciones incompletas.
  validarDireccion(datos) {
    if (!datos.etiqueta || !datos.etiqueta.trim()) return 'Ponle un nombre a la dirección (por ejemplo, Casa).';
    if (!datos.destinatario || datos.destinatario.trim().length < 2) return 'Escribe quién recibe.';
    if (!/^[\d\s+-]{8,15}$/.test(datos.telefono || '')) return 'Escribe un teléfono de 8 dígitos.';
    if (!PROVINCIAS.includes(datos.provincia)) return 'Elige la provincia.';
    if (!datos.canton?.trim() || !datos.distrito?.trim()) return 'Escribe el cantón y el distrito.';
    if (!datos.senas || datos.senas.trim().length < 10) return 'Escribe las otras señas (por ejemplo, 100 m norte de la iglesia, casa blanca).';
    return null;
  },
  // Nombre: guardarDireccion
  // Descripción: Guarda una dirección nueva o editada.
  // Entrada: La clienta, datos y número.
  // Salida: La dirección.
  // Objetivo: Guardar direcciones.
  guardarDireccion(usuarioId, d, id = null) {
    const db = getDb();
    const datos = { usuarioId, etiqueta: d.etiqueta.trim().slice(0, 30), destinatario: d.destinatario.trim().slice(0, 80), telefono: d.telefono.trim(),
      provincia: d.provincia, canton: d.canton.trim().slice(0, 60), distrito: d.distrito.trim().slice(0, 60), senas: d.senas.trim().slice(0, 300) };
    return db.transaction(() => {
      if (id) {
        db.prepare(`UPDATE direcciones SET etiqueta = @etiqueta, destinatario = @destinatario, telefono = @telefono, provincia = @provincia,
          canton = @canton, distrito = @distrito, senas = @senas WHERE id = @id AND usuario_id = @usuarioId`).run({ ...datos, id });
      } else {
        const cantidad = db.prepare('SELECT COUNT(*) AS n FROM direcciones WHERE usuario_id = ?').get(usuarioId).n;
        if (cantidad >= MAX_DIRECCIONES) throw Object.assign(new Error(`Puedes guardar hasta ${MAX_DIRECCIONES} direcciones. Edita o borra una.`), { status: 409 });
        id = db.prepare(`INSERT INTO direcciones (usuario_id, etiqueta, destinatario, telefono, provincia, canton, distrito, senas, principal)
          VALUES (@usuarioId, @etiqueta, @destinatario, @telefono, @provincia, @canton, @distrito, @senas, @principal)`).run({ ...datos, principal: cantidad === 0 ? 1 : 0 }).lastInsertRowid;
      }
      if (d.principal) this.hacerPrincipal(usuarioId, id);
      return this.direccion(usuarioId, id);
    })();
  },
  // Nombre: hacerPrincipal
  // Descripción: Marca la dirección principal.
  // Entrada: La clienta y la dirección.
  // Salida: Nada.
  // Objetivo: Usarla por defecto.
  hacerPrincipal(usuarioId, id) {
    getDb().prepare('UPDATE direcciones SET principal = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE usuario_id = ?').run(id, usuarioId);
  },
  // Nombre: borrarDireccion
  // Descripción: Borra una dirección.
  // Entrada: La clienta y la dirección.
  // Salida: Nada.
  // Objetivo: Quitar direcciones.
  borrarDireccion(usuarioId, id) {
    const db = getDb();
    const direccion = this.direccion(usuarioId, id);
    if (!direccion) return false;
    db.prepare('DELETE FROM direcciones WHERE id = ?').run(id);
    if (direccion.principal) db.prepare('UPDATE direcciones SET principal = 1 WHERE id = (SELECT id FROM direcciones WHERE usuario_id = ? ORDER BY id LIMIT 1)').run(usuarioId);
    return true;
  },
  // Nombre: textoDireccion
  // Descripción: Convierte una dirección en texto.
  // Entrada: La dirección.
  // Salida: El texto.
  // Objetivo: Ponerla en el pedido.
  textoDireccion: (datos) => `${datos.etiqueta}: ${datos.destinatario} (${datos.telefono}) · ${datos.provincia}, ${datos.canton}, ${datos.distrito} · ${datos.senas}`,

  // Historial de la clienta
  // Nombre: pedidos
  // Descripción: Lista los pedidos de la clienta.
  // Entrada: La clienta.
  // Salida: Sus pedidos.
  // Objetivo: Mostrar su historial.
  pedidos: (usuarioId) => getDb().prepare(`SELECT p.id, p.total, p.estado, p.metodo_pago, p.entrega, p.direccion, p.costo_envio, datetime(p.creado_en, 'localtime') AS fecha,
      (SELECT GROUP_CONCAT(pi.cantidad || ' × ' || pr.nombre, ', ') FROM pedido_items pi JOIN productos pr ON pr.id = pi.producto_id WHERE pi.pedido_id = p.id) AS detalle
    FROM pedidos p WHERE p.usuario_id = ? ORDER BY p.creado_en DESC LIMIT 50`).all(usuarioId),
  // Nombre: citas
  // Descripción: Lista las citas de la clienta.
  // Entrada: La clienta.
  // Salida: Sus citas.
  // Objetivo: Mostrar su historial.
  citas: (usuarioId) => getDb().prepare(`SELECT c.id, c.fecha, c.hora, c.estado, c.total, c.cliente_nombre, s.nombre AS servicio, e.nombre AS especialista
    FROM citas c JOIN servicios s ON s.id = c.servicio_id JOIN especialistas e ON e.id = c.especialista_id
    WHERE c.usuario_id = ? ORDER BY c.fecha DESC, c.hora DESC LIMIT 50`).all(usuarioId)
};
