// CONTROLADOR: diseños de uñas. Usa el patrón Builder para armar y validar el diseño.
import { DisenoModel } from '../models/DisenoModel.js';
import { DisenoBuilder, OPCIONES } from '../patrones/constructorDiseno.js';

export const disenoController = {
  // Nombre: opciones
  // Descripción: Entrega las opciones del diseñador de uñas.
  // Entrada: Nada.
  // Salida: Colores, formas y acabados.
  // Objetivo: Llenar el diseñador.
  opciones: (req, res) => res.json(OPCIONES),

  // Nombre: crear
  // Descripción: Guarda un diseño hecho por la clienta.
  // Entrada: El diseño elegido.
  // Salida: El diseño guardado con su precio.
  // Objetivo: Poder reservarlo o comprarlo.
  crear(req, res) {
    const b = req.body;
    const diseno = new DisenoBuilder()
      .forma(b.forma).largo(b.largo).color(b.color).acabado(b.acabado)
      .decoracion(OPCIONES.decoraciones.includes(b.decoracion) ? b.decoracion : 'Ninguna').acento(b.acento).notas(b.notas).referencia(b.fotoRefId).unas(b.unas).extras(b.extras)
      .build();
    res.status(201).json(DisenoModel.crear(diseno));
  }
};
