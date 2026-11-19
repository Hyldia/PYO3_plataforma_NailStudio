// CONTROLADOR: portal del equipo. Cada especialista entra con su usuario y ve sus citas,
// sus clientas, sus días libres, dónde trabaja (estación) y cuánto lleva ganado en la quincena.
import { EquipoModel } from '../models/EquipoModel.js';
import { AusenciaModel, TIPOS_AUSENCIA } from '../models/AusenciaModel.js';
import { NominaModel } from '../models/NominaModel.js';
import { AccesoEquipoModel } from '../models/AccesoEquipoModel.js';
import { SolicitudLibreModel } from '../models/SolicitudLibreModel.js';
import { quincenaDe, quincenaAnterior, hoyIso } from '../lib/fechas.js';
import { CitaModel } from '../models/CitaModel.js';
import { cancelarCita, revisarCancelacion } from '../servicios/citaServicio.js';
import { registrarNoAsistio } from '../servicios/inasistenciaServicio.js';

const fallos = new Map();
const ESPERA = 5 * 60 * 1000;
// Nombre: sumarDias
// Descripción: Suma días a una fecha.
// Entrada: La fecha y cuántos días.
// Salida: La fecha nueva.
// Objetivo: Calcular rangos de fechas.
const sumarDias = (f, numero) => { const fecha = new Date(`${f}T12:00:00`); fecha.setDate(fecha.getDate() + numero); return fecha.toISOString().slice(0, 10); };

export const portalEquipoController = {
  // Nombre: entrar
  // Descripción: Entra al portal de una especialista.
  // Entrada: Usuario y contraseña.
  // Salida: Su permiso y datos.
  // Objetivo: Que vea solo lo suyo.
  entrar(req, res) {
    const ip = req.ip || 'x';
    const fallo = fallos.get(ip);
    if (fallo && fallo.n >= 5 && Date.now() - fallo.desde < ESPERA) return res.status(429).json({ error: 'Demasiados intentos. Espera 5 minutos y vuelve a intentarlo.' });
    const token = AccesoEquipoModel.entrar(req.body.usuario, req.body.contrasena);
    if (!token) {
      const vigente = fallo && Date.now() - fallo.desde < ESPERA;
      fallos.set(ip, { n: (vigente ? fallo.n : 0) + 1, desde: vigente ? fallo.desde : Date.now() });
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
    const motivo = String(req.body.motivo || '').trim();
    const tipo = req.body.tipo === 'reprogramacion' ? 'reprogramacion' : 'cancelacion';
    try { revisarCancelacion(cita, { motivo, tipo, soloFuturas: true, motivoObligatorio: true, conAnticipacion: true }); } catch (fallo) { return res.status(fallo.codigo || 400).json({ error: fallo.message }); }
    res.json(cancelarCita(cita, { motivo: motivo.slice(0, 160), tipo, nota: String(req.body.nota || '').slice(0, 300), quien: req.especialista.nombre }));
  },
  // Nombre: noAsistio
  // Descripción: La especialista marca que su clienta no llegó y decide si se reprograma o se cobra.
  // Entrada: El número de cita y { decision, fecha, hora, monto }.
  // Salida: La cita, la nueva (si se reprogramó) y el mensaje de WhatsApp.
  // Objetivo: Que la especialista también pueda decidir.
  noAsistio(req, res) {
    const cita = CitaModel.buscarPorId(req.params.id);
    if (!cita || cita.especialista_id !== req.especialista.id) return res.status(404).json({ error: 'No encontramos esa cita en tu agenda.' });
    try { res.json(registrarNoAsistio(cita, { ...req.body, quien: req.especialista.nombre })); } catch (fallo) { res.status(fallo.codigo || 400).json({ error: fallo.message }); }
  },

  // Nombre: pedirLibre
  // Descripción: Pide un día libre.
  // Entrada: Las fechas y el motivo.
  // Salida: La solicitud creada.
  // Objetivo: Pedir libres a la dueña.
  pedirLibre(req, res) { res.status(201).json(SolicitudLibreModel.pedirLibre(req.especialista.id, req.body)); },
  // Nombre: quitarSolicitud
  // Descripción: Retira una solicitud de día libre.
  // Entrada: La solicitud.
  // Salida: Nada.
  // Objetivo: Cancelar un pedido de libre.
  quitarSolicitud(req, res) {
    if (!SolicitudLibreModel.quitarSolicitud(req.especialista.id, Number(req.params.id))) return res.status(404).json({ error: 'Esa solicitud ya no se puede quitar.' });
    res.status(204).end();
  },
  // Nombre: salir
  // Descripción: Cierra la sesión del portal.
  // Entrada: El permiso.
  // Salida: Nada.
  // Objetivo: Salir del portal.
  salir(req, res) { AccesoEquipoModel.salir(req.get('x-equipo-token')); res.status(204).end(); },

  // Nombre: yo
  // Descripción: Entrega todo lo de la especialista conectada.
  // Entrada: Su sesión y el periodo.
  // Salida: Sus citas, clientas, pago y libres.
  // Objetivo: Llenar su portal.
  yo(req, res) {
    const especialista = req.especialista;
    const hoy = hoyIso();
    const quincena = quincenaDe();
    const anterior = quincenaAnterior();
    res.json({
      perfil: { id: especialista.id, nombre: especialista.nombre, especialidad: especialista.especialidad, foto: especialista.foto, estacion: especialista.estacion, dias: especialista.dias, hora_inicio: especialista.hora_inicio, hora_fin: especialista.hora_fin, comision: especialista.comision, esquema: NominaModel.NOMBRES_ESQUEMA[especialista.esquema_pago] || 'Comisión' },
      hoy,
      proximas: EquipoModel.citasDe(especialista.id, hoy, sumarDias(hoy, 60)).filter((cita) => cita.estado !== 'cancelada'),
      recientes: EquipoModel.citasDe(especialista.id, sumarDias(hoy, -30), sumarDias(hoy, -1)).reverse(),
      clientas: EquipoModel.clientas(especialista.id),
      ausencias: AusenciaModel.ausencias(especialista.id, hoy, sumarDias(hoy, 90)),
      tipos: TIPOS_AUSENCIA,
      quincena: { ...quincena, ...NominaModel.calcularPago(especialista, quincena) },
      anterior: { ...anterior, ...NominaModel.calcularPago(especialista, anterior) },
      pagos: NominaModel.historialPagos(especialista.id),
      solicitudes: SolicitudLibreModel.solicitudesDe(especialista.id)
    });
  }
};
