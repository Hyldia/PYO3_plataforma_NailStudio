// CONTROLADOR: portal del equipo. Cada especialista entra con su usuario y ve sus citas,
// sus clientas, sus días libres, dónde trabaja (estación) y cuánto lleva ganado en la quincena.
import { EquipoModel, quincenaDe, quincenaAnterior, hoyIso, TIPOS_AUSENCIA } from '../models/EquipoModel.js';
import { CitaModel } from '../models/CitaModel.js';
import { cancelarCita } from './adminController.js';

const fallos = new Map();
const ESPERA = 5 * 60 * 1000;
const sumarDias = (f, n) => { const d = new Date(`${f}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export const portalEquipoController = {
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
  pedirLibre(req, res) { res.status(201).json(EquipoModel.pedirLibre(req.especialista.id, req.body)); },
  quitarSolicitud(req, res) {
    if (!EquipoModel.quitarSolicitud(req.especialista.id, Number(req.params.id))) return res.status(404).json({ error: 'Esa solicitud ya no se puede quitar.' });
    res.status(204).end();
  },
  salir(req, res) { EquipoModel.salir(req.get('x-equipo-token')); res.status(204).end(); },

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
