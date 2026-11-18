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
import { comentarioController } from '../controllers/comentarioController.js';
import { ruletaController } from '../controllers/ruletaController.js';
import { asistenteController } from '../controllers/asistenteController.js';
import { cuentaController as cuenta } from '../controllers/cuentaController.js';
import { conUsuario, soloUsuario } from '../middleware/usuario.js';

const r = Router();

r.get('/servicios', catalogoController.listarServicios);
r.get('/especialistas', catalogoController.listarEspecialistas);
r.get('/productos', catalogoController.listarProductos);
r.get('/productos/:id', catalogoController.obtenerProducto);
r.get('/productos/categorias', catalogoController.listarCategoriasProductos);
r.get('/productos/portadas', detalleController.portadas);
r.get('/productos/:id', detalleController.producto);
r.get('/productos/:id/relacionados', detalleController.productosRelacionados);
r.get('/productos/:id/resenas', resenaController.listar);
r.post('/productos/:id/resenas', resenaController.crear);
r.get('/comentarios/:tipo', comentarioController.resumenes);
r.get('/comentarios/:tipo/:id', comentarioController.listar);
r.post('/comentarios/:tipo/:id', comentarioController.crear);
r.get('/asistente', asistenteController.ver);
r.get('/ruleta', ruletaController.premios);
r.post('/ruleta', ruletaController.girar);

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
r.post('/pedidos', soloUsuario, pedidoController.crear);

// Cuentas de clientas
r.get('/auth/config', cuenta.config);
r.post('/auth/registro', cuenta.registro);
r.post('/auth/entrar', cuenta.entrar);
r.post('/auth/:proveedor(google|facebook)', cuenta.entrar);
r.post('/auth/salir', conUsuario, cuenta.salir);
r.get('/cuenta', soloUsuario, cuenta.yo);
r.put('/cuenta', soloUsuario, cuenta.actualizar);
r.get('/cuenta/historial', soloUsuario, cuenta.historial);
r.post('/cuenta/direcciones', soloUsuario, cuenta.crearDireccion);
r.put('/cuenta/direcciones/:id', soloUsuario, cuenta.editarDireccion);
r.post('/cuenta/direcciones/:id/principal', soloUsuario, cuenta.principal);
r.delete('/cuenta/direcciones/:id', soloUsuario, cuenta.borrarDireccion);

r.get('/cupones', cuponController.listar);
r.get('/cupones/validar', cuponController.validar);

export default r;
