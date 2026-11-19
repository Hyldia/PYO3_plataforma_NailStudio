// MODELO: citas. Incluye las reglas de negocio de una reserva
// (horarios del salón, validación de datos y cálculo del total y el adelanto).
import { getDb } from '../db/conexion.js';
import { calcularPrecio } from '../patrones/decoradorPrecio.js';
import { EspecialistaModel } from './EspecialistaModel.js';

export const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '13:30', '14:30', '15:30', '16:30', '17:30'];
export const PORCENTAJE_ADELANTO = 0.3;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const SELECT = `
  SELECT c.*, s.nombre AS servicio, s.duracion_min, e.nombre AS especialista,
         d.forma, d.largo, d.color, d.acabado, d.decoracion, f.archivo AS foto_ref
  FROM citas c
  JOIN servicios s ON s.id = c.servicio_id
  JOIN especialistas e ON e.id = c.especialista_id
  LEFT JOIN disenos d ON d.id = c.diseno_id
  LEFT JOIN fotos f ON f.id = COALESCE(c.foto_ref_id, d.foto_ref_id)`;

export const CitaModel = {
  // Nombre: esFechaValida
  // Descripción: Revisa que una fecha esté bien escrita.
  // Entrada: La fecha.
  // Salida: Sí o no.
  // Objetivo: Evitar fechas inválidas.
  esFechaValida: (fecha) => FECHA.test(fecha || ''),
  // Nombre: esHoraValida
  // Descripción: Revisa que una hora sea del horario.
  // Entrada: La hora.
  // Salida: Sí o no.
  // Objetivo: Evitar horas inválidas.
  esHoraValida: (hora) => HORARIOS.includes(hora),

  // Devuelve un mensaje de error o null si los datos de la clienta están bien
  // Nombre: validarCliente
  // Descripción: Revisa los datos de la clienta.
  // Entrada: Nombre, teléfono y correo.
  // Salida: Un error o nada.
  // Objetivo: No guardar citas incompletas.
  validarCliente(cliente = {}) {
    if (!cliente.nombre || cliente.nombre.trim().length < 2) return 'Escribe tu nombre.';
    if (!/^[\d\s+-]{8,15}$/.test(cliente.telefono || '')) return 'Escribe un teléfono válido, por ejemplo 8888 8888.';
    if (cliente.email && !/^\S+@\S+\.\S+$/.test(cliente.email)) return 'Revisa el correo electrónico.';
    return null;
  },

  // Usa el patrón Decorator (patrones/decoradorPrecio.js): servicio → recargo de diseño → cupón
  // Nombre: calcularMontos
  // Descripción: Calcula el precio de una cita.
  // Entrada: Servicio, recargo, pago y cupón.
  // Salida: Subtotal, descuento y total.
  // Objetivo: Cobrar lo justo.
  calcularMontos(servicio, recargoDiseno, metodoPago, cupon = null) {
    const { total, descuento, detalle } = calcularPrecio(servicio, recargoDiseno, cupon);
    const anticipo = metodoPago === 'salon' ? 0 : Math.round(total * PORCENTAJE_ADELANTO);
    return { total, descuento, anticipo, detalle };
  },

  // Nombre: horasOcupadas
  // Descripción: Busca las horas ya ocupadas.
  // Entrada: La especialista y la fecha.
  // Salida: Las horas ocupadas.
  // Objetivo: No reservar dos veces la misma hora.
  horasOcupadas: (especialistaId, fecha) => getDb().prepare(`
    SELECT hora FROM citas WHERE especialista_id = ? AND fecha = ? AND estado != 'cancelada'
  `).all(especialistaId, fecha).map((f) => f.hora),

  // Horas del salón dentro del horario de la especialista; vacío si ese día no trabaja
  // Nombre: horasDe
  // Descripción: Calcula el horario de una especialista en un día.
  // Entrada: La especialista y la fecha.
  // Salida: Sus horas de trabajo.
  // Objetivo: Saber cuándo atiende.
  horasDe(especialista, fecha) {
    if (!especialista || !EspecialistaModel.trabajaEl(especialista, fecha)) return [];
    return HORARIOS.filter((h) => h >= especialista.hora_inicio && h <= especialista.hora_fin);
  },

  // Nombre: disponibilidad
  // Descripción: Busca las horas libres de una especialista.
  // Entrada: La especialista y la fecha.
  // Salida: Las horas libres.
  // Objetivo: Mostrar horas para reservar.
  disponibilidad(especialistaId, fecha) {
    const especialista = EspecialistaModel.buscarPorId(especialistaId);
    const ocupadas = this.horasOcupadas(especialistaId, fecha);
    const hoy = new Date();
    const esHoy = fecha === `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const ahora = `${String(hoy.getHours()).padStart(2, '0')}:${String(hoy.getMinutes()).padStart(2, '0')}`;
    return this.horasDe(especialista, fecha).map((hora) => ({ hora, disponible: !ocupadas.includes(hora) && (!esHoy || hora > ahora) }));
  },

  // Próximos días con sus horas libres (para la ficha de la especialista)
  // Nombre: agenda
  // Descripción: Muestra los próximos días con espacio.
  // Entrada: La especialista y cuántos días.
  // Salida: Días con horas libres.
  // Objetivo: Ayudar a elegir fecha.
  agenda(especialistaId, dias = 10) {
    const lista = [];
    const d = new Date();
    while (lista.length < dias) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue;
      const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const horas = this.disponibilidad(especialistaId, fecha);
      lista.push({ fecha, trabaja: horas.length > 0, libres: horas.filter((h) => h.disponible).map((h) => h.hora) });
    }
    return lista;
  },

  // ¿Se puede reservar esa hora con esa especialista?
  // Nombre: horaDisponible
  // Descripción: Revisa si una hora sigue libre.
  // Entrada: Especialista, fecha y hora.
  // Salida: Sí o no.
  // Objetivo: Evitar choques de citas.
  horaDisponible(especialistaId, fecha, hora) {
    return this.disponibilidad(especialistaId, fecha).some((h) => h.hora === hora && h.disponible);
  },

  // Nombre: buscarPorId
  // Descripción: Busca una cita por su número.
  // Entrada: El número.
  // Salida: La cita o nada.
  // Objetivo: Ver una cita.
  buscarPorId: (id) => getDb().prepare(`${SELECT} WHERE c.id = ?`).get(id),
  // Nombre: listarDelDia
  // Descripción: Lista las citas de un día.
  // Entrada: La fecha.
  // Salida: Las citas.
  // Objetivo: Ver la agenda.
  listarDelDia: (fecha) => getDb().prepare(`${SELECT} WHERE c.fecha = ? ORDER BY c.hora, e.nombre`).all(fecha),

  // Nombre: crear
  // Descripción: Guarda una cita.
  // Entrada: Los datos de la cita.
  // Salida: La cita guardada.
  // Objetivo: Reservar.
  crear(c) {
    const r = getDb().prepare(`
      INSERT INTO citas (servicio_id, especialista_id, diseno_id, foto_ref_id, cliente_nombre, cliente_telefono, cliente_email,
                         notas, fecha, hora, estado, total, anticipo, cupon_codigo, descuento, metodo_pago, pedido_id, usuario_id)
      VALUES (@servicioId, @especialistaId, @disenoId, @fotoRefId, @nombre, @telefono, @email,
              @notas, @fecha, @hora, @estado, @total, @anticipo, @cuponCodigo, @descuento, @metodoPago, @pedidoId, @usuarioId)
    `).run({ pedidoId: null, usuarioId: null, ...c });
    return this.buscarPorId(r.lastInsertRowid);
  },

  // Calendario del panel: por cada día del mes, cuántas citas hay y cuántos espacios tiene el salón
  // Nombre: resumenMes
  // Descripción: Resume las citas de un mes.
  // Entrada: El mes.
  // Salida: Cuántas citas hay por día.
  // Objetivo: Pintar el calendario.
  resumenMes(mes) {
    const [a, m] = mes.split('-').map(Number);
    const dias = new Date(a, m, 0).getDate();
    const especialistas = EspecialistaModel.listar();
    const filas = getDb().prepare(`SELECT fecha, estado, COUNT(*) AS n FROM citas WHERE fecha LIKE ? GROUP BY fecha, estado`).all(`${mes}-%`);
    return Array.from({ length: dias }, (_, i) => {
      const fecha = `${mes}-${String(i + 1).padStart(2, '0')}`;
      const capacidad = especialistas.reduce((s, e) => s + this.horasDe(e, fecha).length, 0);
      const de = filas.filter((f) => f.fecha === fecha);
      // Nombre: n
      // Descripción: Cuenta citas con ciertos estados.
      // Entrada: Los estados.
      // Salida: La cantidad.
      // Objetivo: Hacer el resumen del mes.
      const n = (est) => de.filter((f) => est.includes(f.estado)).reduce((s, f) => s + f.n, 0);
      const ocupadas = n(['pendiente', 'confirmada', 'completada']);
      return { fecha, capacidad, ocupadas, pendientes: n(['pendiente']), canceladas: n(['cancelada']), completadas: n(['completada']),
        nivel: !capacidad ? 'cerrado' : ocupadas >= capacidad ? 'lleno' : ocupadas / capacidad >= 0.6 ? 'casi' : ocupadas > 0 ? 'medio' : 'libre' };
    });
  },
  // Nombre: activasDelDia
  // Descripción: Lista las citas activas de un día.
  // Entrada: La fecha y la especialista.
  // Salida: Las citas.
  // Objetivo: Cancelar por emergencia.
  activasDelDia: (fecha, especialistaId) => getDb().prepare(`${SELECT} WHERE c.fecha = ? AND c.estado IN ('pendiente', 'confirmada')
    ${especialistaId ? 'AND c.especialista_id = ?' : ''} ORDER BY c.hora`).all(...[fecha, especialistaId].filter(Boolean)),
  // Nombre: guardarMotivo
  // Descripción: Guarda por qué se canceló una cita.
  // Entrada: La cita y el motivo.
  // Salida: Nada.
  // Objetivo: Dejar registro del motivo.
  guardarMotivo: (id, motivo) => getDb().prepare('UPDATE citas SET motivo_cancelacion = ? WHERE id = ?').run(motivo, id),

  // Nombre: cambiarEstado
  // Descripción: Cambia el estado de una cita.
  // Entrada: La cita y el estado.
  // Salida: La cita actualizada.
  // Objetivo: Seguir el avance de la cita.
  cambiarEstado(id, estado) {
    getDb().prepare('UPDATE citas SET estado = ? WHERE id = ?').run(estado, id);
    return this.buscarPorId(id);
  }
};
