// MODELO: especialistas que atienden a las clientas, con sus días y horas de trabajo.
import { getDb } from '../db/conexion.js';

const SELECT = `SELECT e.id, e.nombre, e.especialidad, e.foto, e.foto_autor, e.foto_autor_url, e.bio, e.experiencia, e.dias, e.hora_inicio, e.hora_fin, e.activa, e.estacion, e.esquema_pago, e.comision, e.salario_base, e.usuario, (SELECT COUNT(*) FROM citas c WHERE c.especialista_id = e.id AND c.estado != 'cancelada') AS citas FROM especialistas e`;

export const EspecialistaModel = {
  // Lo que ven las clientas: sin usuario ni datos de pago
  // Nombre: listar
  // Descripción: Lista las especialistas activas.
  // Entrada: Nada.
  // Salida: La lista.
  // Objetivo: Mostrar el equipo.
  listar: () => getDb().prepare(`${SELECT} WHERE e.activa = 1 ORDER BY e.id`).all()
    .map(({ usuario, esquema_pago, comision, salario_base, ...publico }) => publico),
  // Nombre: listarTodas
  // Descripción: Lista todas las especialistas.
  // Entrada: Nada.
  // Salida: La lista.
  // Objetivo: Administrar el equipo.
  listarTodas: () => getDb().prepare(`${SELECT} ORDER BY e.activa DESC, e.id`).all().map((e) => ({
    ...e, tiene_acceso: Boolean(e.usuario),
    ausencias_proximas: getDb().prepare("SELECT COUNT(*) AS n FROM ausencias WHERE especialista_id = ? AND fecha >= date('now', 'localtime')").get(e.id).n
  })),
  // Nombre: buscarPorId
  // Descripción: Busca una especialista.
  // Entrada: El número.
  // Salida: La especialista o nada.
  // Objetivo: Ver sus datos.
  buscarPorId: (id) => getDb().prepare(`${SELECT} WHERE e.id = ?`).get(id),

  // Nombre: validar
  // Descripción: Revisa los datos de una especialista.
  // Entrada: Los datos.
  // Salida: Un error o nada.
  // Objetivo: Evitar datos inválidos.
  validar(d) {
    if (!d.nombre || String(d.nombre).trim().length < 2) return 'Escribe el nombre.';
    if (!d.especialidad || String(d.especialidad).trim().length < 3) return 'Escribe la especialidad.';
    const dias = String(d.dias || '').split(',').filter(Boolean);
    if (!dias.length || dias.some((x) => !/^[1-7]$/.test(x))) return 'Elige al menos un día de trabajo.';
    if (!/^\d{2}:\d{2}$/.test(d.hora_inicio || '') || !/^\d{2}:\d{2}$/.test(d.hora_fin || '')) return 'Revisa las horas de entrada y salida.';
    if (d.hora_inicio >= d.hora_fin) return 'La hora de salida debe ser después de la de entrada.';
    return null;
  },
  // Nombre: normalizar
  // Descripción: Ordena los datos de una especialista.
  // Entrada: Los datos.
  // Salida: Los datos limpios.
  // Objetivo: Guardar siempre igual.
  normalizar: (d) => ({
    nombre: String(d.nombre).trim().slice(0, 60), especialidad: String(d.especialidad).trim().slice(0, 80),
    bio: d.bio ? String(d.bio).trim().slice(0, 300) : null, experiencia: d.experiencia === '' || d.experiencia == null ? null : Math.max(0, Math.floor(Number(d.experiencia))),
    dias: [...new Set(String(d.dias).split(',').filter(Boolean))].sort().join(','), hora_inicio: d.hora_inicio, hora_fin: d.hora_fin,
    activa: d.activa === false || d.activa === 0 || d.activa === '0' ? 0 : 1
  }),
  // Nombre: crear
  // Descripción: Crea una especialista.
  // Entrada: Los datos.
  // Salida: La especialista.
  // Objetivo: Sumar al equipo.
  crear(d) {
    const r = getDb().prepare(`INSERT INTO especialistas (nombre, especialidad, bio, experiencia, dias, hora_inicio, hora_fin, activa)
      VALUES (@nombre, @especialidad, @bio, @experiencia, @dias, @hora_inicio, @hora_fin, @activa)`).run(d);
    return this.buscarPorId(r.lastInsertRowid);
  },
  // Nombre: actualizar
  // Descripción: Actualiza una especialista.
  // Entrada: El número y los datos.
  // Salida: La especialista.
  // Objetivo: Editar el equipo.
  actualizar(id, d) {
    getDb().prepare(`UPDATE especialistas SET nombre = @nombre, especialidad = @especialidad, bio = @bio, experiencia = @experiencia,
      dias = @dias, hora_inicio = @hora_inicio, hora_fin = @hora_fin, activa = @activa WHERE id = @id`).run({ ...d, id });
    return this.buscarPorId(id);
  },
  // Nombre: citasFuturas
  // Descripción: Cuenta las citas futuras de una especialista.
  // Entrada: El número.
  // Salida: La cantidad.
  // Objetivo: No borrar a quien tiene citas.
  citasFuturas: (id) => getDb().prepare(`SELECT COUNT(*) AS n FROM citas WHERE especialista_id = ? AND fecha >= date('now', 'localtime') AND estado IN ('pendiente', 'confirmada')`).get(id).n,
  // Si tiene citas en el historial se desactiva (deja de aparecer al reservar); si no, se borra
  // Nombre: eliminar
  // Descripción: Elimina o desactiva una especialista.
  // Entrada: El número.
  // Salida: Nada.
  // Objetivo: Quitar del equipo.
  eliminar(id) {
    const db = getDb();
    if (db.prepare('SELECT 1 FROM citas WHERE especialista_id = ? LIMIT 1').get(id)) { db.prepare('UPDATE especialistas SET activa = 0 WHERE id = ?').run(id); return 'desactivada'; }
    db.prepare('DELETE FROM especialistas WHERE id = ?').run(id);
    return 'borrada';
  },

  // ¿Trabaja ese día? (1 = lunes … 7 = domingo). No trabaja si ese día tiene una ausencia (libre, vacaciones…)
  // Nombre: trabajaEl
  // Descripción: Revisa si trabaja en una fecha.
  // Entrada: La especialista y la fecha.
  // Salida: Sí o no.
  // Objetivo: Mostrar solo días de trabajo.
  trabajaEl(especialista, fecha) {
    const dia = new Date(`${fecha}T12:00:00`).getDay() || 7;
    if (!String(especialista.dias || '').split(',').map(Number).includes(dia)) return false;
    return !getDb().prepare('SELECT 1 FROM ausencias WHERE especialista_id = ? AND fecha = ?').get(especialista.id, fecha);
  }
};
