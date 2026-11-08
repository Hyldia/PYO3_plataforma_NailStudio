import { Router } from 'express';
import { disenosRepo } from '../repositories/disenosRepo.js';
import { DisenoBuilder, OPCIONES } from '../patterns/disenoBuilder.js';

const r = Router();
r.get('/opciones', (req, res) => res.json(OPCIONES));
r.post('/', (req, res) => {
  const b = req.body;
  const diseno = new DisenoBuilder()
    .forma(b.forma).largo(b.largo).color(b.color).acabado(b.acabado)
    .decoracion(b.decoracion).acento(b.acento).notas(b.notas).referencia(b.fotoRefId)
    .build();
  res.status(201).json(disenosRepo.crear(diseno));
});
export default r;
