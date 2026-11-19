// MODELO (Experto): lo que se le paga a cada especialista por quincena y su historial de pagos.
import { getDb } from '../db/conexion.js';
import { crearEsquemaPago, NOMBRES_ESQUEMA } from '../patrones/estrategiaComision.js';
import { hoyIso, diasEntre, trabajaPorHorario } from '../lib/fechas.js';
import { AusenciaModel } from './AusenciaModel.js';

export const NominaModel = {
  // Nombre: calcularPago
  // Descripción: Calcula el pago de una especialista.
  // Entrada: La especialista y el periodo.
  // Salida: Detalle y total a pagar.
  // Objetivo: Pagar lo justo.
  calcularPago(especialista, { desde, hasta }) {
    const db = getDb();
    // Cuentan las citas atendidas y lo que se cobró de las citas a las que la clienta no llegó
    const citas = db.prepare(`SELECT fecha, CASE WHEN estado = 'completada' THEN total ELSE monto_cobrado END AS total FROM citas
      WHERE especialista_id = ? AND fecha BETWEEN ? AND ? AND (estado = 'completada' OR (estado = 'no_asistio' AND monto_cobrado > 0))`).all(especialista.id, desde, hasta);
    const vendido = citas.reduce((suma, cita) => suma + cita.total, 0);
    const ausencias = AusenciaModel.ausencias(especialista.id, desde, hasta);
    const fechasAusencia = new Set(ausencias.map((ausencia) => ausencia.fecha));
    const dias = diasEntre(desde, hasta);
    const programados = dias.filter((dia) => trabajaPorHorario(especialista, dia) && !fechasAusencia.has(dia));
    const libresPorHorario = dias.filter((dia) => !trabajaPorHorario(especialista, dia));
    const trabajados = new Set(citas.map((cita) => cita.fecha)).size;
    const esquema = crearEsquemaPago(especialista.esquema_pago);
    const pago = esquema.calcular({ vendido, comision: especialista.comision, salarioBase: especialista.esquema_pago === 'base_comision' ? especialista.salario_base : 0 });
    // Citas de días que ya pasaron y nadie marcó como atendidas (no cuentan para el pago)
    const porMarcar = db.prepare(`SELECT COUNT(*) AS n FROM citas WHERE especialista_id = ? AND estado IN ('pendiente', 'confirmada')
      AND fecha BETWEEN ? AND ? AND fecha < ?`).get(especialista.id, desde, hasta, hoyIso()).n;
    const pagado = db.prepare('SELECT * FROM pagos_equipo WHERE especialista_id = ? AND desde = ? AND hasta = ?').get(especialista.id, desde, hasta) || null;
    return {
      citas: citas.length, vendido, ...pago, esquema: esquema.nombre,
      diasProgramados: programados.length, diasTrabajados: trabajados, diasLibres: libresPorHorario.length,
      ausencias: ausencias.length, detalleAusencias: ausencias, porMarcar, pagado
    };
  },
  // Nombre: nomina
  // Descripción: Calcula la planilla de todo el equipo.
  // Entrada: El periodo.
  // Salida: El pago de cada una.
  // Objetivo: Hacer la planilla.
  nomina(periodo) {
    const lista = getDb().prepare('SELECT * FROM especialistas ORDER BY activa DESC, id').all();
    return lista.map((elemento) => ({
      id: elemento.id, nombre: elemento.nombre, especialidad: elemento.especialidad, foto: elemento.foto, estacion: elemento.estacion, activa: elemento.activa,
      dias: elemento.dias, hora_inicio: elemento.hora_inicio, hora_fin: elemento.hora_fin, comision: elemento.comision, esquema_pago: elemento.esquema_pago, salario_base: elemento.salario_base,
      ...this.calcularPago(elemento, periodo)
    })).filter((fila) => fila.activa || fila.citas > 0);
  },
  // Nombre: registrarPago
  // Descripción: Guarda que ya se pagó.
  // Entrada: La especialista y el periodo.
  // Salida: El pago guardado.
  // Objetivo: Llevar control de pagos.
  registrarPago(especialistaId, periodo) {
    const especialista = getDb().prepare('SELECT * FROM especialistas WHERE id = ?').get(especialistaId);
    if (!especialista) throw Object.assign(new Error('No encontramos a esa especialista.'), { status: 404 });
    const calculo = this.calcularPago(especialista, periodo);
    getDb().prepare(`INSERT INTO pagos_equipo (especialista_id, desde, hasta, citas, vendido, monto) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(especialista_id, desde, hasta) DO UPDATE SET citas = excluded.citas, vendido = excluded.vendido, monto = excluded.monto, pagado_en = datetime('now')`)
      .run(especialista.id, periodo.desde, periodo.hasta, calculo.citas, calculo.vendido, calculo.total);
    return this.calcularPago(especialista, periodo);
  },
  // Marca como atendidas las citas de días pasados (de una especialista o de todo el equipo)
  // Nombre: marcarPasadasAtendidas
  // Descripción: Marca como atendidas las citas pasadas.
  // Entrada: El periodo y la especialista.
  // Salida: Cuántas se marcaron.
  // Objetivo: Que cuenten para el pago.
  marcarPasadasAtendidas: ({ desde, hasta }, especialistaId = null) => getDb().prepare(`UPDATE citas SET estado = 'completada'
    WHERE estado IN ('pendiente', 'confirmada') AND fecha BETWEEN ? AND ? AND fecha < ? ${especialistaId ? 'AND especialista_id = ?' : ''}`)
    .run(...[desde, hasta, hoyIso(), ...(especialistaId ? [especialistaId] : [])]).changes,
  // Nombre: quitarPago
  // Descripción: Borra un pago marcado.
  // Entrada: La especialista y el periodo.
  // Salida: Nada.
  // Objetivo: Corregir errores.
  quitarPago: (especialistaId, periodo) => getDb().prepare('DELETE FROM pagos_equipo WHERE especialista_id = ? AND desde = ? AND hasta = ?').run(especialistaId, periodo.desde, periodo.hasta),
  // Nombre: historialPagos
  // Descripción: Lista los pagos de una especialista.
  // Entrada: La especialista.
  // Salida: Sus pagos.
  // Objetivo: Ver su historial.
  historialPagos: (especialistaId) => getDb().prepare("SELECT *, datetime(pagado_en, 'localtime') AS pagado_local FROM pagos_equipo WHERE especialista_id = ? ORDER BY desde DESC LIMIT 24").all(especialistaId),

  // ----- Datos de configuración (los guarda el panel) -----
  // Nombre: validarConfig
  // Descripción: Revisa la forma de pago de una especialista.
  // Entrada: Los datos.
  // Salida: Un error o nada.
  // Objetivo: Evitar datos inválidos.
  validarConfig(datos) {
    if (!['comision', 'base_comision'].includes(datos.esquema_pago)) return 'Elige cómo se le paga.';
    const porcentaje = Number(datos.comision);
    if (!(porcentaje >= 0 && porcentaje <= 100)) return 'La comisión debe estar entre 0 y 100 %.';
    if (datos.esquema_pago === 'base_comision' && !(Number(datos.salario_base) > 0)) return 'Escribe el monto base por quincena.';
    return null;
  },
  // Nombre: guardarConfig
  // Descripción: Guarda la forma de pago.
  // Entrada: La especialista y los datos.
  // Salida: Nada.
  // Objetivo: Calcular su pago.
  guardarConfig: (id, datos) => getDb().prepare('UPDATE especialistas SET estacion = ?, esquema_pago = ?, comision = ?, salario_base = ? WHERE id = ?')
    .run(String(datos.estacion || '').trim().slice(0, 60) || null, datos.esquema_pago, Number(datos.comision), datos.esquema_pago === 'base_comision' ? Number(datos.salario_base) : 0, id),


  // Nombres para mostrar de cada forma de pago (comisión o base + comisión)
  NOMBRES_ESQUEMA
};
