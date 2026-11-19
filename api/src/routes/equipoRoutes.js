// RUTAS del portal del equipo: cada especialista entra con su usuario y contraseña.
import { Router } from 'express';
import { soloEquipo } from '../middleware/equipo.js';
import { portalEquipoController as portal } from '../controllers/portalEquipoController.js';

const rutas = Router();
rutas.post('/entrar', portal.entrar);
rutas.use(soloEquipo);
rutas.get('/yo', portal.yo);
rutas.post('/salir', portal.salir);
rutas.post('/citas/:id/cancelar', portal.cancelar);
rutas.post('/citas/:id/no-asistio', portal.noAsistio);
rutas.post('/solicitudes', portal.pedirLibre);
rutas.delete('/solicitudes/:id', portal.quitarSolicitud);
export default rutas;
