// RUTAS del panel del salón: todas pasan primero por soloAdmin.
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

const r = Router();
// Entrar es lo único que no pide sesión
r.post('/entrar', acceso.entrar);
r.use(soloAdmin);

r.get('/verificar', acceso.verificar);
r.post('/salir', acceso.salir);
r.post('/contrasena', acceso.cambiarContrasena);

r.post('/fotos', subirImagen.single('imagen'), fotoController.subir);
r.put('/fotos/:id', fotoController.editar);
r.delete('/fotos/:id', fotoController.eliminar);

r.post('/productos/:id/imagen', subirImagen.single('imagen'), productoAdminController.cambiarImagen);
r.post('/portadas/:clave', subirImagen.single('imagen'), productoAdminController.fotoPortada);
r.delete('/portadas/:clave', productoAdminController.quitarFotoPortada);
r.post('/especialistas/:id/foto', subirImagen.single('imagen'), especialistas.fotoEspecialista);
r.post('/asistente/foto', subirImagen.single('imagen'), asistenteController.subirFoto);
r.delete('/asistente/foto', asistenteController.quitarFoto);
r.post('/fotos/:id/imagen', subirImagen.single('imagen'), fotoController.cambiarFotoDiseno);

// Productos: listar, crear, editar y eliminar
r.get('/productos', productoAdminController.productos);
r.post('/productos', productoAdminController.crearProducto);
r.put('/productos/:id', productoAdminController.editarProducto);
r.delete('/productos/:id', productoAdminController.eliminarProducto);

// Equipo
r.get('/especialistas', especialistas.equipo);
r.post('/especialistas', especialistas.crearEspecialista);
r.put('/especialistas/:id', especialistas.editarEspecialista);
r.delete('/especialistas/:id', especialistas.eliminarEspecialista);

// Servicios del salón
r.get('/servicios', servicios.listar);
r.post('/servicios', servicios.crear);
r.put('/servicios/:id', servicios.editar);
r.delete('/servicios/:id', servicios.eliminar);
r.post('/servicios/:id/imagen', subirImagen.single('imagen'), servicios.cambiarImagen);

// Equipo: estación y forma de pago, acceso al portal y días libres
r.put('/especialistas/:id/pago', equipo.guardarConfig);
r.put('/especialistas/:id/acceso', equipo.definirAcceso);
r.delete('/especialistas/:id/acceso', equipo.quitarAcceso);
r.get('/especialistas/:id/ausencias', equipo.ausencias);
r.post('/especialistas/:id/ausencias', equipo.agregarAusencias);
r.delete('/especialistas/:id/ausencias/:ausencia', equipo.borrarAusencia);
r.get('/avisos', equipo.avisos);
r.post('/solicitudes-libres/:id', equipo.resolverSolicitud);

// Pagos del equipo por quincena y gráficas
r.get('/nomina', equipo.nomina);
r.get('/nomina/excel', equipo.nominaExcel);
r.post('/nomina/atender-pasadas', equipo.marcarAtendidas);
r.post('/nomina/:id/pagado', equipo.marcarPagado);
r.delete('/nomina/:id/pagado', equipo.quitarPagado);
r.get('/reportes', equipo.reportes);

// Pedidos con filtros y estados
r.get('/pedidos', pedidos.pedidos);
r.get('/pedidos/excel', pedidos.pedidosExcel);
r.patch('/pedidos/:id/estado', pedidos.estadoPedido);

// Agenda: calendario del mes, cancelaciones y avisos por WhatsApp
r.get('/calendario', agenda.calendario);
r.get('/mensajes/tipos', agenda.tiposMensaje);
r.get('/mensajes', agenda.mensajes);
r.post('/mensajes/:id/enviado', agenda.mensajeEnviado);
r.post('/citas/emergencia', agenda.emergencia);
r.post('/citas/:id/cancelar', agenda.cancelar);
r.post('/citas/:id/mensaje', agenda.mensaje);

r.get('/citas', citaController.listarDelDia);
r.patch('/citas/:id/estado', citaController.cambiarEstado);


export default r;
