// CONTROLADOR: servicios del salón desde el panel (ver, agregar, modificar, cambiar foto y quitar).
import { ServicioModel, CATEGORIAS_SERVICIO } from '../models/ServicioModel.js';
import { borrarSubida } from '../middleware/subidas.js';

export const servicioAdminController = {
  // Nombre: listar
  // Descripción: Lista todos los servicios para el panel.
  // Entrada: Nada.
  // Salida: La lista de servicios.
  // Objetivo: Administrar la carta.
  listar(req, res) {
    const servicios = ServicioModel.listarTodos();
    const categorias = [...new Set([...CATEGORIAS_SERVICIO, ...servicios.map((s) => s.categoria)])];
    res.json({ servicios, categorias });
  },
  // Nombre: crear
  // Descripción: Crea un servicio.
  // Entrada: Sus datos.
  // Salida: El servicio creado.
  // Objetivo: Agregar servicios.
  crear(req, res) {
    const error = ServicioModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(ServicioModel.crear(req.body));
  },
  // Nombre: editar
  // Descripción: Edita un servicio.
  // Entrada: El servicio y sus cambios.
  // Salida: El servicio actualizado.
  // Objetivo: Cambiar precios o datos.
  editar(req, res) {
    if (!ServicioModel.buscarCualquiera(req.params.id)) return res.status(404).json({ error: 'No existe ese servicio.' });
    const error = ServicioModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.json(ServicioModel.actualizar(Number(req.params.id), req.body));
  },
  // Nombre: cambiarImagen
  // Descripción: Cambia la foto de un servicio.
  // Entrada: El servicio y la foto.
  // Salida: El servicio actualizado.
  // Objetivo: Mostrar fotos reales.
  cambiarImagen(req, res) {
    const s = ServicioModel.buscarCualquiera(req.params.id);
    if (!s || !req.file) return res.status(400).json({ error: 'Servicio o imagen no válidos.' });
    borrarSubida(s.imagen);
    ServicioModel.cambiarImagen(s.id, req.file.filename);
    res.json(ServicioModel.buscarCualquiera(s.id));
  },
  // Nombre: eliminar
  // Descripción: Elimina un servicio.
  // Entrada: El número del servicio.
  // Salida: Nada.
  // Objetivo: Quitar servicios.
  eliminar(req, res) {
    if (!ServicioModel.buscarCualquiera(req.params.id)) return res.status(404).json({ error: 'No existe ese servicio.' });
    res.json({ resultado: ServicioModel.eliminar(Number(req.params.id)) });
  }
};
