// RUTAS públicas: solo conectan cada URL con su controlador, sin lógica.
import { Router } from 'express';
import { catalogoController } from '../controllers/catalogoController.js';
import { fotoController } from '../controllers/fotoController.js';
import { disenoController } from '../controllers/disenoController.js';
import { citaController } from '../controllers/citaController.js';
import { pedidoController } from '../controllers/pedidoController.js';
import { cuponController } from '../controllers/cuponController.js';
import { detalleController } from '../controllers/detalleController.js';
import { resenaController } from '../controllers/resenaController.js';

const r = Router();

r.get('/servicios', catalogoController.listarServicios);
r.get('/especialistas', catalogoController.listarEspecialistas);
r.get('/productos', catalogoController.listarProductos);
r.get('/productos/categorias', catalogoController.listarCategoriasProductos);
r.get('/productos/portadas', detalleController.portadas);
r.get('/productos/:id', detalleController.producto);
r.get('/productos/:id/relacionados', detalleController.productosRelacionados);
r.get('/productos/:id/resenas', resenaController.listar);
r.post('/productos/:id/resenas', resenaController.crear);

r.get('/fotos', fotoController.buscar);
r.get('/fotos/filtros', fotoController.opcionesDeFiltro);
r.post('/fotos/:id/vista', fotoController.registrarVista);
r.get('/fotos/:id', detalleController.foto);
r.get('/fotos/:id/relacionados', detalleController.fotosRelacionadas);

r.get('/disenos/opciones', disenoController.opciones);
r.post('/disenos', disenoController.crear);

r.get('/citas/disponibilidad', citaController.disponibilidad);
r.get('/citas/libres', citaController.libres);
r.get('/especialistas/:id/agenda', citaController.agenda);
r.post('/citas', citaController.crear);

r.post('/pedidos/cotizar', pedidoController.cotizar);
r.post('/pedidos', pedidoController.crear);

r.get('/cupones', cuponController.listar);
r.get('/cupones/validar', cuponController.validar);

export default r;
