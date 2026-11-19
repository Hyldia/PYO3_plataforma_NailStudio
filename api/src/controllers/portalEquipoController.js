// CONTROLADOR: portal del equipo. Cada especialista entra con su usuario y ve sus citas,
// sus clientas, sus días libres, dónde trabaja (estación) y cuánto lleva ganado en la quincena.
import { EquipoModel, quincenaDe, quincenaAnterior, hoyIso, TIPOS_AUSENCIA } from '../models/EquipoModel.js';
import { CitaModel } from '../models/CitaModel.js';
import { cancelarCita } from './adminController.js';

const fallos = new Map();
const ESPERA = 5 * 60 * 1000;
// Nombre: sumarDias
// Descripción: Suma días a una fecha.
// Entrada: La fecha y cuántos días.
// Salida: La fecha nueva.
// Objetivo: Calcular rangos de fechas.
const sumarDias = (f, n) => { const d = new Date(`${f}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export const portalEquipoController = {
  // Nombre: entrar
  // Descripción: Entra al portal de una especialista.
  // Entrada: Usuario y contraseña.
  // Salida: Su permiso y datos.
  // Objetivo: Que vea solo lo suyo.
  entrar(req, res) {
    const ip = req.ip || 'x';
    const f = fallos.get(ip);
    if (f && f.n >= 5 && Date.now() - f.desde < ESPERA) return res.status(429).json({ error: 'Demasiados intentos. Espera 5 minutos y vuelve a intentarlo.' });
    const token = EquipoModel.entrar(req.body.usuario, req.body.contrasena);
    if (!token) {
      const vigente = f && Date.now() - f.desde < ESPERA;
      fallos.set(ip, { n: (vigente ? f.n : 0) + 1, desde: vigente ? f.desde : Date.now() });
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
    fallos.delete(ip);
    res.json({ token });
  },
  // La especialista cancela una de SUS citas: se cancela (patrón State) y se prepara el aviso
  // de WhatsApp para la clienta (Template Method). El aviso queda también en el historial del panel.
  // Nombre: cancelar
  // Descripción: Cancela una cita desde el portal de la especialista.
  // Entrada: La cita y el motivo.
  // Salida: La cita cancelada y el aviso.
  // Objetivo: Que pueda cancelar sus citas.
  cancelar(req, res) {
    const cita = CitaModel.buscarPorId(req.params.id);
    if (!cita || cita.especialista_id !== req.especialista.id) return res.status(404).json({ error: 'No encontramos esa cita en tu agenda.' });
    if (!['pendiente', 'confirmada'].includes(cita.estado)) return res.status(400).json({ error: 'Esa cita ya no se puede cancelar.' });
    if (cita.fecha < hoyIso()) return res.status(400).json({ error: 'Esa cita ya pasó.' });
    const motivo = String(req.body.motivo || '').trim();
    if (motivo.length < 3) return res.status(400).json({ error: 'Escribe el motivo para avisarle a la clienta.' });
    const tipo = req.body.tipo === 'reprogramacion' ? 'reprogramacion' : 'cancelacion';
    res.json(cancelarCita(cita, { motivo: motivo.slice(0, 160), tipo, nota: String(req.body.nota || '').slice(0, 300), quien: req.especialista.nombre }));
  },
  // Nombre: pedirLibre
  // Descripción: Pide un día libre.
  // Entrada: Las fechas y el motivo.
  // Salida: La solicitud creada.
  // Objetivo: Pedir libres a la dueña.
  pedirLibre(req, res) { res.status(201).json(EquipoModel.pedirLibre(req.especialista.id, req.body)); },
  // Nombre: quitarSolicitud
  // Descripción: Retira una solicitud de día libre.
  // Entrada: La solicitud.
  // Salida: Nada.
  // Objetivo: Cancelar un pedido de libre.
  quitarSolicitud(req, res) {
    if (!EquipoModel.quitarSolicitud(req.especialista.id, Number(req.params.id))) return res.status(404).json({ error: 'Esa solicitud ya no se puede quitar.' });
    res.status(204).end();
  },
  // Nombre: salir
  // Descripción: Cierra la sesión del portal.
  // Entrada: El permiso.
  // Salida: Nada.
  // Objetivo: Salir del portal.
  salir(req, res) { EquipoModel.salir(req.get('x-equipo-token')); res.status(204).end(); },

  // Nombre: yo
  // Descripción: Entrega todo lo de la especialista conectada.
  // Entrada: Su sesión y el periodo.
  // Salida: Sus citas, clientas, pago y libres.
  // Objetivo: Llenar su portal.
  yo(req, res) {
    const e = req.especialista;
    const hoy = hoyIso();
    const quincena = quincenaDe();
    const anterior = quincenaAnterior();
    res.json({
      perfil: { id: e.id, nombre: e.nombre, especialidad: e.especialidad, foto: e.foto, estacion: e.estacion, dias: e.dias, hora_inicio: e.hora_inicio, hora_fin: e.hora_fin, comision: e.comision, esquema: EquipoModel.NOMBRES_ESQUEMA[e.esquema_pago] || 'Comisión' },
      hoy,
      proximas: EquipoModel.citasDe(e.id, hoy, sumarDias(hoy, 30)).filter((c) => c.estado !== 'cancelada'),
      recientes: EquipoModel.citasDe(e.id, sumarDias(hoy, -30), sumarDias(hoy, -1)).reverse(),
      clientas: EquipoModel.clientas(e.id),
      ausencias: EquipoModel.ausencias(e.id, hoy, sumarDias(hoy, 90)),
      tipos: TIPOS_AUSENCIA,
      quincena: { ...quincena, ...EquipoModel.calcularPago(e, quincena) },
      anterior: { ...anterior, ...EquipoModel.calcularPago(e, anterior) },
      pagos: EquipoModel.historialPagos(e.id),
      solicitudes: EquipoModel.solicitudesDe(e.id)
    });
  }
};
