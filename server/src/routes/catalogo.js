import { Router } from 'express';
import { catalogoRepo } from '../repositories/catalogoRepo.js';

const r = Router();
r.get('/servicios', (req, res) => res.json(catalogoRepo.servicios()));
r.get('/especialistas', (req, res) => res.json(catalogoRepo.especialistas()));
r.get('/productos', (req, res) => res.json(catalogoRepo.productos(req.query)));
r.get('/productos/categorias', (req, res) => res.json(catalogoRepo.categoriasProductos()));
export default r;
