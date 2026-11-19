// CONTROLADOR de productos del panel: crear, editar, borrar y cambiar fotos (también las de las categorías).
import { ProductoModel } from '../models/ProductoModel.js';
import { AjustesModel } from '../models/AjustesModel.js';
import { borrarSubida } from '../middleware/subidas.js';

export const productoAdminController = {
  // Nombre: productos
  // Descripción: Lista los productos para el panel.
  // Entrada: Los filtros de búsqueda.
  // Salida: La lista de productos.
  // Objetivo: Administrar la tienda.
  productos: (req, res) => res.json(ProductoModel.buscar({ ...req.query, orden: req.query.orden || 'nuevos' })),

  // Nombre: crearProducto
  // Descripción: Crea un producto nuevo.
  // Entrada: Los datos del producto.
  // Salida: El producto creado.
  // Objetivo: Agregar productos a la tienda.
  crearProducto(req, res) {
    const error = ProductoModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(ProductoModel.crear(ProductoModel.normalizar(req.body)));
  },

  // Nombre: editarProducto
  // Descripción: Edita un producto.
  // Entrada: El producto y sus nuevos datos.
  // Salida: El producto actualizado.
  // Objetivo: Corregir precios, stock o datos.
  editarProducto(req, res) {
    if (!ProductoModel.buscarPorId(req.params.id)) return res.status(404).json({ error: 'No existe ese producto.' });
    const error = ProductoModel.validar(req.body);
    if (error) return res.status(400).json({ error });
    res.json(ProductoModel.actualizar(Number(req.params.id), ProductoModel.normalizar(req.body)));
  },

  // Nombre: eliminarProducto
  // Descripción: Elimina un producto.
  // Entrada: El número del producto.
  // Salida: Nada.
  // Objetivo: Quitar productos que ya no se venden.
  eliminarProducto(req, res) {
    const p = ProductoModel.buscarPorId(req.params.id);
    if (!p) return res.status(404).json({ error: 'No existe ese producto.' });
    const resultado = ProductoModel.eliminar(p.id);
    if (resultado === 'borrado') borrarSubida(p.imagen);
    res.json({ resultado });
  },

  // Nombre: cambiarImagen
  // Descripción: Cambia la foto de un producto.
  // Entrada: El producto y la foto.
  // Salida: El producto actualizado.
  // Objetivo: Mostrar fotos reales.
  cambiarImagen(req, res) {
    const producto = ProductoModel.buscarPorId(req.params.id);
    if (!producto || !req.file) return res.status(400).json({ error: 'Producto o imagen no válidos.' });
    borrarSubida(producto.imagen);
    ProductoModel.cambiarImagen(producto.id, req.file.filename);
    res.json(ProductoModel.buscarPorId(producto.id));
  },

  // Foto del círculo de una categoría en la portada (se guarda en ajustes como «portada:<categoría>»)
  // Nombre: fotoPortada
  // Descripción: Cambia la foto de portada de una categoría.
  // Entrada: La categoría y la foto.
  // Salida: La foto guardada.
  // Objetivo: Elegir la foto de cada categoría.
  fotoPortada(req, res) {
    const clave = String(req.params.clave || '').slice(0, 60);
    if (!clave || !req.file) return res.status(400).json({ error: 'Elige una imagen.' });
    borrarSubida(AjustesModel.leer(`portada:${clave}`));
    AjustesModel.guardar(`portada:${clave}`, req.file.filename);
    res.json({ clave, imagen: req.file.filename });
  },

  // Nombre: quitarFotoPortada
  // Descripción: Quita la foto de portada de una categoría.
  // Entrada: La categoría.
  // Salida: Nada.
  // Objetivo: Volver a la foto automática.
  quitarFotoPortada(req, res) {
    const clave = `portada:${String(req.params.clave || '').slice(0, 60)}`;
    borrarSubida(AjustesModel.leer(clave));
    AjustesModel.borrar(clave);
    res.status(204).end();
  }
};
