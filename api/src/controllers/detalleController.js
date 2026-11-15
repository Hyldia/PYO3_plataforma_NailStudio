// CONTROLADOR: páginas de detalle (diseño de la galería y producto de la tienda) con relacionados.
import { FotoModel } from '../models/FotoModel.js';
import { ProductoModel } from '../models/ProductoModel.js';
import { ServicioModel } from '../models/ServicioModel.js';
import { getDb } from '../db/connection.js';

// Servicio con el que se hace cada tipo de diseño, y recargo por acabado especial
const SERVICIO_POR_CATEGORIA = {
  Manicure: 'Manicure semipermanente', Gel: 'Manicure semipermanente', 'Nail art': 'Manicure semipermanente',
  'Acrílicas': 'Uñas acrílicas', Polygel: 'Polygel', Pedicure: 'Pedicure semipermanente'
};
const RECARGO_ACABADO = { Chrome: 3000, Glitter: 2000, Mate: 1000 };
const PRESSON = 'Press-on personalizado con tu diseño';

function servicioSugerido(foto) {
  const nombre = SERVICIO_POR_CATEGORIA[foto.categoria] || 'Manicure semipermanente';
  const s = getDb().prepare('SELECT * FROM servicios WHERE nombre = ? AND activo = 1').get(nombre);
  if (!s) return null;
  const recargo = (RECARGO_ACABADO[foto.acabado] || 0) + (foto.categoria === 'Nail art' ? 4500 : 0);
  // El precio es el del servicio: es lo que se cobra al reservar con esta foto de referencia
  return { id: s.id, nombre: s.nombre, duracion_min: s.duracion_min, precio: s.precio_oferta ?? s.precio, recargo };
}

// Precios de cada diseño para mostrarlos en las tarjetas de la galería
export function conPrecios(fotos) {
  const presson = ProductoModel.buscarPorNombre(PRESSON);
  return fotos.map((f) => { const sv = servicioSugerido(f); return { ...f, servicio_id: sv?.id ?? null, precio_salon: sv?.precio ?? null, precio_presson: presson?.precio ?? null, presson_anterior: presson?.precio_anterior ?? null }; });
}

export const detalleController = {
  foto(req, res) {
    const foto = FotoModel.conPuesto(req.params.id);
    if (!foto) return res.status(404).json({ error: 'Ese diseño ya no está en la galería.' });
    const presson = ProductoModel.buscarPorNombre(PRESSON);
    res.json({ ...foto, servicio: servicioSugerido(foto), presson: presson && { id: presson.id, precio: presson.precio, precio_anterior: presson.precio_anterior, stock: presson.stock } });
  },
  fotosRelacionadas: (req, res) => res.json(conPrecios(FotoModel.relacionados(req.params.id, req.query.limite))),

  producto(req, res) {
    const p = ProductoModel.buscarPorId(req.params.id);
    if (!p) return res.status(404).json({ error: 'Ese producto ya no está disponible.' });
    const puesto = getDb().prepare('SELECT COUNT(*) + 1 AS n FROM productos WHERE categoria = ? AND vendidos > ?').get(p.categoria, p.vendidos).n;
    res.json({ ...p, puesto, variantes: ProductoModel.variantes(p.id) });
  },
  // GET /api/productos/portadas: una foto real por categoría (la del más vendido con foto)
  portadas(req, res) {
    const db = getDb();
    const foto = (where, ...p) => db.prepare(`SELECT imagen FROM productos WHERE imagen LIKE 'http%' AND ${where} ORDER BY stock > 0 DESC, vendidos DESC LIMIT 1`).get(...p)?.imagen ?? null;
    const mapa = {};
    db.prepare('SELECT DISTINCT categoria FROM productos').all().forEach(({ categoria }) => { mapa[categoria] = foto('categoria = ?', categoria); });
    mapa.rubber = foto("nombre LIKE '%rubber%'");
    mapa.aceite = foto("nombre LIKE 'Aceite%'");
    res.json(mapa);
  },
  productosRelacionados: (req, res) => res.json(ProductoModel.relacionados(req.params.id, req.query.limite))
};
