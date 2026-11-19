// RUTAS del portal del equipo: cada especialista entra con su usuario y contraseña.
import { Router } from 'express';
import { soloEquipo } from '../middleware/equipo.js';
import { portalEquipoController as portal } from '../controllers/portalEquipoController.js';

const r = Router();
r.post('/entrar', portal.entrar);
r.use(soloEquipo);
r.get('/yo', portal.yo);
r.post('/salir', portal.salir);
r.post('/citas/:id/cancelar', portal.cancelar);
r.post('/citas/:id/no-asistio', portal.noAsistio);
r.post('/solicitudes', portal.pedirLibre);
r.delete('/solicitudes/:id', portal.quitarSolicitud);
export default r;
