import { Router } from 'express';
import { fotosRepo } from '../repositories/fotosRepo.js';

const r = Router();
r.get('/', (req, res) => res.json(fotosRepo.buscar(req.query)));
r.get('/filtros', (req, res) => res.json(fotosRepo.opcionesDeFiltro()));
r.post('/:id/vista', (req, res) => { fotosRepo.sumarVista(req.params.id); res.status(204).end(); });
export default r;
