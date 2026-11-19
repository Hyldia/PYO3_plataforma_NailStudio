// RUTAS del panel del salón: todas pasan primero por soloAdmin.
import { reporteAdminController as reportes } from '../controllers/reporteAdminController.js';
import { Router } from 'express';
import { soloAdmin } from '../middleware/admin.js';
import { subirImagen } from '../middleware/subidas.js';
import { fotoController } from '../controllers/fotoController.js';
import { citaController } from '../controllers/citaController.js';
import { productoAdminController } from '../controllers/productoAdminController.js';
import { agendaAdminController as agenda } from '../controllers/agendaAdminController.js';
import { especialistaAdminController as especialistas } from '../controllers/especialistaAdminController.js';
import { pedidoAdminController as pedidos } from '../controllers/pedidoAdminController.js';
import { asistenteController } from '../controllers/asistenteController.js';
import { accesoAdminController as acceso } from '../controllers/accesoAdminController.js';
import { servicioAdminController as servicios } from '../controllers/servicioAdminController.js';
import { equipoAdminController as equipo } from '../controllers/equipoAdminController.js';

const rutas = Router();
// Entrar es lo único que no pide sesión
rutas.post('/entrar', acceso.entrar);
rutas.use(soloAdmin);

rutas.get('/verificar', acceso.verificar);
rutas.post('/salir', acceso.salir);
rutas.post('/contrasena', acceso.cambiarContrasena);

rutas.post('/fotos', subirImagen.single('imagen'), fotoController.subir);
rutas.put('/fotos/:id', fotoController.editar);
rutas.delete('/fotos/:id', fotoController.eliminar);

rutas.post('/productos/:id/imagen', subirImagen.single('imagen'), productoAdminController.cambiarImagen);
rutas.post('/portadas/:clave', subirImagen.single('imagen'), productoAdminController.fotoPortada);
rutas.delete('/portadas/:clave', productoAdminController.quitarFotoPortada);
rutas.put('/circulos', productoAdminController.guardarCirculos);
rutas.post('/especialistas/:id/foto', subirImagen.single('imagen'), especialistas.fotoEspecialista);
rutas.post('/asistente/foto', subirImagen.single('imagen'), asistenteController.subirFoto);
rutas.delete('/asistente/foto', asistenteController.quitarFoto);
rutas.post('/fotos/:id/imagen', subirImagen.single('imagen'), fotoController.cambiarFotoDiseno);

// Productos: listar, crear, editar y eliminar
rutas.get('/productos', productoAdminController.productos);
rutas.post('/productos', productoAdminController.crearProducto);
rutas.put('/productos/:id', productoAdminController.editarProducto);
rutas.delete('/productos/:id', productoAdminController.eliminarProducto);

// Equipo
rutas.get('/especialistas', especialistas.equipo);
rutas.post('/especialistas', especialistas.crearEspecialista);
rutas.put('/especialistas/:id', especialistas.editarEspecialista);
rutas.delete('/especialistas/:id', especialistas.eliminarEspecialista);

// Servicios del salón
rutas.get('/servicios', servicios.listar);
rutas.post('/servicios', servicios.crear);
rutas.put('/servicios/:id', servicios.editar);
rutas.delete('/servicios/:id', servicios.eliminar);
rutas.post('/servicios/:id/imagen', subirImagen.single('imagen'), servicios.cambiarImagen);

// Equipo: estación y forma de pago, acceso al portal y días libres
rutas.put('/especialistas/:id/pago', equipo.guardarConfig);
rutas.put('/especialistas/:id/acceso', equipo.definirAcceso);
rutas.delete('/especialistas/:id/acceso', equipo.quitarAcceso);
rutas.get('/especialistas/:id/ausencias', equipo.ausencias);
rutas.post('/especialistas/:id/ausencias', equipo.agregarAusencias);
rutas.delete('/especialistas/:id/ausencias/:ausencia', equipo.borrarAusencia);
rutas.get('/avisos', equipo.avisos);
rutas.post('/solicitudes-libres/:id', equipo.resolverSolicitud);

// Pagos del equipo por quincena y gráficas
rutas.get('/nomina', equipo.nomina);
rutas.get('/nomina/excel', equipo.nominaExcel);
rutas.post('/nomina/atender-pasadas', equipo.marcarAtendidas);
rutas.post('/nomina/:id/pagado', equipo.marcarPagado);
rutas.delete('/nomina/:id/pagado', equipo.quitarPagado);
rutas.get('/reportes', reportes.reportes);
rutas.get('/reportes/cierre', reportes.cierre);

// Pedidos con filtros y estados
rutas.get('/pedidos', pedidos.pedidos);
rutas.get('/pedidos/excel', pedidos.pedidosExcel);
rutas.patch('/pedidos/:id/estado', pedidos.estadoPedido);

// Agenda: calendario del mes, cancelaciones y avisos por WhatsApp
rutas.get('/calendario', agenda.calendario);
rutas.get('/mensajes/tipos', agenda.tiposMensaje);
rutas.get('/mensajes', agenda.mensajes);
rutas.post('/mensajes/:id/enviado', agenda.mensajeEnviado);
rutas.post('/citas/emergencia', agenda.emergencia);
rutas.post('/citas/:id/cancelar', agenda.cancelar);
rutas.post('/citas/:id/no-asistio', agenda.noAsistio);
rutas.post('/citas/:id/mensaje', agenda.mensaje);

rutas.get('/citas', citaController.listarDelDia);
rutas.patch('/citas/:id/estado', citaController.cambiarEstado);


export default rutas;
