// CONTROLADOR de especialistas del panel: listar, crear, editar, borrar y cambiar su foto.
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { borrarSubida } from '../middleware/subidas.js';

export const especialistaAdminController = {
  // Nombre: equipo
  // Descripción: Lista todas las especialistas.
  // Entrada: Nada.
  // Salida: La lista del equipo.
  // Objetivo: Administrar el equipo.
  equipo: (req, res) => res.json(EspecialistaModel.listarTodas()),

  // Nombre: crearEspecialista
  // Descripción: Agrega una especialista.
  // Entrada: Sus datos.
  // Salida: La especialista creada.
  // Objetivo: Sumar personas al equipo.
  crearEspecialista(req, res) {
    const error = EspecialistaModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(EspecialistaModel.crear(EspecialistaModel.normalizar(req.body)));
  },

  // Nombre: editarEspecialista
  // Descripción: Edita los datos de una especialista.
  // Entrada: La especialista y sus datos nuevos.
  // Salida: La especialista actualizada.
  // Objetivo: Mantener al día el equipo.
  editarEspecialista(req, res) {
    if (!EspecialistaModel.buscarPorId(req.params.id)) return res.status(404).json({ error: 'No existe esa especialista.' });
    const error = EspecialistaModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.json(EspecialistaModel.actualizar(Number(req.params.id), EspecialistaModel.normalizar(req.body)));
  },

  // Nombre: eliminarEspecialista
  // Descripción: Quita una especialista.
  // Entrada: El número de la especialista.
  // Salida: Nada.
  // Objetivo: Sacar a quien ya no trabaja.
  eliminarEspecialista(req, res) {
    const e = EspecialistaModel.buscarPorId(req.params.id);
    if (!e) return res.status(404).json({ error: 'No existe esa especialista.' });
    const futuras = EspecialistaModel.citasFuturas(e.id);
    if (futuras) return res.status(409).json({ error: `${e.nombre} tiene ${futuras} ${futuras === 1 ? 'cita pendiente' : 'citas pendientes'}. Cancélalas o reasígnalas primero (puedes usar «Emergencia» en la agenda).` });
    const resultado = EspecialistaModel.eliminar(e.id);
    if (resultado === 'borrada') borrarSubida(e.foto);
    res.json({ resultado });
  },

  // Foto real de una especialista (subida desde el panel)
  // Nombre: fotoEspecialista
  // Descripción: Cambia la foto de una especialista.
  // Entrada: La especialista y la foto.
  // Salida: La especialista actualizada.
  // Objetivo: Poner su cara en el sitio.
  fotoEspecialista(req, res) {
    const e = EspecialistaModel.buscarPorId(req.params.id);
    if (!e || !req.file) return res.status(400).json({ error: 'Especialista o imagen no válidas.' });
    borrarSubida(e.foto);
    EspecialistaModel.cambiarFoto(e.id, req.file.filename);
    res.json(EspecialistaModel.buscarPorId(e.id));
  }
};
