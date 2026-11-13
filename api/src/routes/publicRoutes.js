// RUTAS públicas: solo conectan cada URL con su controlador, sin lógica.
import { Router } from 'express';
import { catalogoController } from '../controllers/catalogoController.js';
import { fotoController } from '../controllers/fotoController.js';
import { disenoController } from '../controllers/disenoController.js';
import { citaController } from '../controllers/citaController.js';
import { pedidoController } from '../controllers/pedidoController.js';

const r = Router();

r.get('/servicios', catalogoController.listarServicios);
r.get('/especialistas', catalogoController.listarEspecialistas);
r.get('/productos', catalogoController.listarProductos);
r.get('/productos/:id', catalogoController.obtenerProducto);
r.get('/productos/categorias', catalogoController.listarCategoriasProductos);

r.get('/fotos', fotoController.buscar);
r.get('/fotos/filtros', fotoController.opcionesDeFiltro);
r.post('/fotos/:id/vista', fotoController.registrarVista);

r.get('/disenos/opciones', disenoController.opciones);
r.post('/disenos', disenoController.crear);

r.get('/citas/disponibilidad', citaController.disponibilidad);
r.post('/citas', citaController.crear);

r.post('/pedidos', pedidoController.crear);

export default r;
