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
    const cuerpo = req.body;
    const diseno = new DisenoBuilder()
      .forma(cuerpo.forma).largo(cuerpo.largo).color(cuerpo.color).acabado(cuerpo.acabado)
      .decoracion(OPCIONES.decoraciones.includes(cuerpo.decoracion) ? cuerpo.decoracion : 'Ninguna').acento(cuerpo.acento).notas(cuerpo.notas).referencia(cuerpo.fotoRefId).unas(cuerpo.unas).extras(cuerpo.extras)
      .build();
    res.status(201).json(DisenoModel.crear(diseno));
  }
};
