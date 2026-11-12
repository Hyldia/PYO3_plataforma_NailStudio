// CONTROLADOR: diseños de uñas. Usa el patrón Builder para armar y validar el diseño.
import { DisenoModel } from '../models/DisenoModel.js';
import { DisenoBuilder, OPCIONES } from '../patterns/disenoBuilder.js';

export const disenoController = {
  opciones: (req, res) => res.json(OPCIONES),

  crear(req, res) {
    const b = req.body;
    const diseno = new DisenoBuilder()
      .forma(b.forma).largo(b.largo).color(b.color).acabado(b.acabado)
      .decoracion(b.decoracion).acento(b.acento).notas(b.notas).referencia(b.fotoRefId)
      .build();
    res.status(201).json(DisenoModel.crear(diseno));
  }
};
