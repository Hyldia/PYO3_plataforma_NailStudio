// CONTROLADOR: páginas de detalle (diseño de la galería y producto de la tienda) con relacionados.
import { AjustesModel } from '../models/AjustesModel.js';
import { FotoModel } from '../models/FotoModel.js';
import { ProductoModel } from '../models/ProductoModel.js';

export const detalleController = {
  // Nombre: foto
  // Descripción: Trae el detalle de un diseño de la galería.
  // Entrada: El número del diseño.
  // Salida: El diseño con sus datos.
  // Objetivo: Mostrar su página.
  foto(req, res) {
    const foto = FotoModel.detalleConPrecios(req.params.id);
    if (!foto) return res.status(404).json({ error: 'Ese diseño ya no está en la galería.' });
    res.json(foto);
  },
  // Nombre: fotosRelacionadas
  // Descripción: Trae diseños parecidos.
  // Entrada: El número del diseño.
  // Salida: Una lista de diseños.
  // Objetivo: Sugerir más ideas.
  fotosRelacionadas: (req, res) => res.json(FotoModel.conPrecios(FotoModel.relacionados(req.params.id, req.query.limite))),

  // Nombre: producto
  // Descripción: Trae el detalle de un producto.
  // Entrada: El número del producto.
  // Salida: El producto con sus datos.
  // Objetivo: Mostrar su página.
  producto(req, res) {
    const p = ProductoModel.buscarPorId(req.params.id);
    if (!p) return res.status(404).json({ error: 'Ese producto ya no está disponible.' });
    res.json({ ...p, puesto: ProductoModel.puestoEnCategoria(p), variantes: ProductoModel.variantes(p.id) });
  },
  // GET /api/productos/portadas: una foto real por categoría (la del más vendido con foto)
  // Nombre: portadas
  // Descripción: Entrega la foto de portada de cada categoría.
  // Entrada: Nada.
  // Salida: Una foto por categoría.
  // Objetivo: Decorar "Compra por categoría".
  portadas: (req, res) => res.json(ProductoModel.portadas()),
  // Nombre: circulos
  // Descripción: Entrega qué círculos de categorías se ocultan y cuáles se agregaron al Inicio.
  // Entrada: Nada.
  // Salida: { ocultos, inicioExtra }.
  // Objetivo: Mostrar solo los círculos que eligió la dueña.
  circulos: (req, res) => res.json(AjustesModel.circulos()),
  // Nombre: productosRelacionados
  // Descripción: Trae productos parecidos.
  // Entrada: El número del producto.
  // Salida: Una lista de productos.
  // Objetivo: Sugerir más compras.
  productosRelacionados: (req, res) => res.json(ProductoModel.relacionados(req.params.id, req.query.limite))
};
