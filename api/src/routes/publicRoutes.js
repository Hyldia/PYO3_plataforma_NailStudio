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

const rutas = Router();

rutas.get('/servicios', catalogoController.listarServicios);
rutas.get('/especialistas', catalogoController.listarEspecialistas);
rutas.get('/productos', catalogoController.listarProductos);
rutas.get('/productos/categorias', catalogoController.listarCategoriasProductos);
rutas.get('/productos/portadas', detalleController.portadas);
rutas.get('/productos/circulos', detalleController.circulos);
rutas.get('/productos/:id', detalleController.producto);
rutas.get('/productos/:id/relacionados', detalleController.productosRelacionados);
rutas.get('/productos/:id/resenas', resenaController.listar);
rutas.post('/productos/:id/resenas', resenaController.crear);
rutas.get('/comentarios/:tipo', comentarioController.resumenes);
rutas.get('/comentarios/:tipo/:id', comentarioController.listar);
rutas.post('/comentarios/:tipo/:id', comentarioController.crear);
rutas.get('/asistente', asistenteController.ver);
rutas.get('/ruleta', ruletaController.premios);
rutas.post('/ruleta', ruletaController.girar);

rutas.get('/fotos', fotoController.buscar);
rutas.get('/fotos/filtros', fotoController.opcionesDeFiltro);
rutas.get('/fotos/parecidas', fotoController.parecidas);
rutas.post('/fotos/:id/vista', fotoController.registrarVista);
rutas.get('/fotos/:id', detalleController.foto);
rutas.get('/fotos/:id/relacionados', detalleController.fotosRelacionadas);

rutas.get('/disenos/opciones', disenoController.opciones);
rutas.post('/disenos', disenoController.crear);

rutas.get('/citas/disponibilidad', citaController.disponibilidad);
rutas.get('/citas/libres', citaController.libres);
rutas.get('/especialistas/:id/agenda', citaController.agenda);

rutas.post('/pedidos/cotizar', pedidoController.cotizar);
rutas.post('/pedidos', soloUsuario, pedidoController.crear);

// Cuentas de clientas
rutas.get('/auth/config', cuenta.config);
rutas.post('/auth/registro', cuenta.registro);
rutas.post('/auth/entrar', cuenta.entrar);
rutas.post('/auth/:proveedor(google|facebook)', cuenta.entrar);
rutas.post('/auth/salir', conUsuario, cuenta.salir);
rutas.get('/cuenta', soloUsuario, cuenta.yo);
rutas.put('/cuenta', soloUsuario, cuenta.actualizar);
rutas.get('/cuenta/historial', soloUsuario, cuenta.historial);
rutas.post('/cuenta/citas/:id/cancelar', soloUsuario, cuenta.cancelarMiCita);
rutas.post('/cuenta/direcciones', soloUsuario, cuenta.crearDireccion);
rutas.put('/cuenta/direcciones/:id', soloUsuario, cuenta.editarDireccion);
rutas.post('/cuenta/direcciones/:id/principal', soloUsuario, cuenta.principal);
rutas.delete('/cuenta/direcciones/:id', soloUsuario, cuenta.borrarDireccion);

rutas.get('/cupones', cuponController.listar);

export default rutas;
