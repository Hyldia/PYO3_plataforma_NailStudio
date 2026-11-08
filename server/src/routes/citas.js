import { Router } from 'express';
import { citasRepo, HORARIOS } from '../repositories/citasRepo.js';
import { catalogoRepo } from '../repositories/catalogoRepo.js';
import { disenosRepo } from '../repositories/disenosRepo.js';
import { recordatoriosRepo } from '../repositories/recordatoriosRepo.js';
import { crearMetodoPago } from '../patterns/pagos.js';
import { eventos } from '../patterns/eventos.js';

const r = Router();
const ANTICIPO = 0.3;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

r.get('/disponibilidad', (req, res) => {
  const { especialistaId, fecha } = req.query;
  if (!especialistaId || !FECHA.test(fecha || '')) return res.status(400).json({ error: 'Indica especialista y fecha.' });
  const ocupadas = citasRepo.horasOcupadas(Number(especialistaId), fecha);
  res.json(HORARIOS.map((hora) => ({ hora, disponible: !ocupadas.includes(hora) })));
});

r.post('/', (req, res) => {
  const { servicioId, especialistaId, disenoId, fotoRefId, fecha, hora, cliente = {}, notas, metodoPago, pago, recordatorios = {} } = req.body;

  const servicio = catalogoRepo.servicio(servicioId);
  if (!servicio) return res.status(400).json({ error: 'Elige un servicio.' });
  if (!catalogoRepo.especialista(especialistaId)) return res.status(400).json({ error: 'Elige una especialista.' });
  if (!FECHA.test(fecha || '') || !HORARIOS.includes(hora)) return res.status(400).json({ error: 'Elige una fecha y una hora.' });
  if (!cliente.nombre || cliente.nombre.trim().length < 2) return res.status(400).json({ error: 'Escribe tu nombre.' });
  if (!/^[\d\s+-]{8,15}$/.test(cliente.telefono || '')) return res.status(400).json({ error: 'Escribe un teléfono válido, por ejemplo 8888 8888.' });
  if (cliente.email && !/^\S+@\S+\.\S+$/.test(cliente.email)) return res.status(400).json({ error: 'Revisa el correo electrónico.' });
  if (citasRepo.horasOcupadas(especialistaId, fecha).includes(hora)) {
    return res.status(409).json({ error: 'Esa hora se acaba de ocupar. Elige otra, por favor.' });
  }

  const diseno = disenoId ? disenosRepo.porId(disenoId) : null;
  const total = servicio.precio + (diseno?.precio ?? 0);
  const metodo = crearMetodoPago(metodoPago);
  const anticipo = metodoPago === 'salon' ? 0 : Math.round(total * ANTICIPO);
  const cobro = metodo.cobrar(anticipo, pago);
  if (!cobro.ok) return res.status(402).json({ error: cobro.mensaje });

  const cita = citasRepo.crear({
    servicioId, especialistaId, disenoId: diseno?.id ?? null, fotoRefId: fotoRefId || null,
    nombre: cliente.nombre.trim(), telefono: cliente.telefono.trim(), email: cliente.email?.trim() || null,
    notas: notas?.slice(0, 500) || null, fecha, hora,
    estado: cobro.requiereVerificacion ? 'pendiente' : 'confirmada',
    total, anticipo, metodoPago: metodo.nombre
  });

  eventos.emit('cita:creada', { cita, recordatorios });
  res.status(201).json({ ...cita, recordatorios: recordatoriosRepo.deCita(cita.id), referenciaPago: cobro.referencia });
});

export default r;
