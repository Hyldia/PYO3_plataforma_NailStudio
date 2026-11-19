// CONTROLADOR: registro, inicio de sesión (formulario, Google o Facebook) y "Mi cuenta" con direcciones.
import { UsuarioModel, PROVINCIAS, MAX_DIRECCIONES } from '../models/UsuarioModel.js';
import { CitaModel } from '../models/CitaModel.js';
import { cancelarCita, revisarCancelacion } from '../servicios/citaServicio.js';
import { crearEstrategia, configuracionPublica, Contrasenas } from '../patrones/estrategiaAutenticacion.js';

// Nombre: sesion
// Descripción: Abre la sesión de una clienta.
// Entrada: La clienta.
// Salida: Su permiso (token) y sus datos.
// Objetivo: Mantenerla conectada.
const sesion = (usuario) => ({ token: UsuarioModel.abrirSesion(usuario.id), usuario: UsuarioModel.publico(usuario) });

export const cuentaController = {
  // Nombre: config
  // Descripción: Entrega datos básicos para los formularios de cuenta.
  // Entrada: Nada.
  // Salida: Provincias y límites.
  // Objetivo: Llenar el formulario de registro.
  config: (req, res) => res.json({ ...configuracionPublica(), provincias: PROVINCIAS, maxDirecciones: MAX_DIRECCIONES }),

  // Nombre: registro
  // Descripción: Crea una cuenta de clienta.
  // Entrada: Sus datos.
  // Salida: La sesión abierta o un error.
  // Objetivo: Que la clienta se registre.
  registro(req, res) {
    const datos = { ...req.body, correo: String(req.body.correo || '').trim().toLowerCase() };
    const error = UsuarioModel.validarRegistro(datos);
    if (error) return res.status(400).json({ error });
    if (UsuarioModel.buscarPorCorreo(datos.correo)) return res.status(409).json({ error: 'Ya hay una cuenta con ese correo. Entra con tu contraseña o con Google/Facebook.' });
    const usuario = UsuarioModel.crear({ nombre: datos.nombre, correo: datos.correo, telefono: datos.telefono.trim(), contrasenaHash: Contrasenas.crear(datos.contrasena) });
    res.status(201).json(sesion(usuario));
  },

  // Una sola ruta para las tres formas de entrar (Strategy + Factory)
  // Nombre: entrar
  // Descripción: Inicia sesión de una clienta (correo o Google).
  // Entrada: Correo y contraseña, o la cuenta de Google.
  // Salida: La sesión abierta o un error.
  // Objetivo: Que la clienta entre a su cuenta.
  async entrar(req, res, next) {
    try {
      const estrategia = crearEstrategia(req.params.proveedor || 'formulario');
      const datos = await estrategia.autenticar(req.body);
      let usuario;
      if (datos.proveedor === 'formulario') {
        usuario = UsuarioModel.buscarPorCorreo(datos.correo);
        if (!usuario || !usuario.contrasena_hash || !Contrasenas.verificar(datos.contrasena, usuario.contrasena_hash)) {
          return res.status(401).json({ error: usuario && !usuario.contrasena_hash ? `Esta cuenta se creó con ${usuario.proveedor === 'google' ? 'Google' : 'Facebook'}. Entra con ese botón.` : 'Correo o contraseña incorrectos.' });
        }
      } else {
        usuario = UsuarioModel.desdeProveedor(datos);
      }
      res.json(sesion(usuario));
    } catch (error) { next(error); }
  },

  // Nombre: salir
  // Descripción: Cierra la sesión de una clienta.
  // Entrada: Su permiso.
  // Salida: Nada.
  // Objetivo: Salir de la cuenta.
  salir(req, res) { if (req.token) UsuarioModel.cerrarSesion(req.token); res.status(204).end(); },

  // Nombre: yo
  // Descripción: Entrega los datos de la clienta conectada.
  // Entrada: Su sesión.
  // Salida: Sus datos y direcciones.
  // Objetivo: Mostrar "Mi cuenta".
  yo: (req, res) => res.json({ usuario: UsuarioModel.publico(req.usuario), direcciones: UsuarioModel.direcciones(req.usuario.id) }),
  // Nombre: actualizar
  // Descripción: Actualiza los datos de la clienta.
  // Entrada: Los datos nuevos.
  // Salida: La clienta actualizada.
  // Objetivo: Que pueda editar su perfil.
  actualizar(req, res) {
    const { nombre = '', telefono = '' } = req.body;
    if (nombre.trim().length < 2) return res.status(400).json({ error: 'Escribe tu nombre.' });
    if (!/^[\d\s+-]{8,15}$/.test(telefono)) return res.status(400).json({ error: 'Escribe un teléfono de 8 dígitos.' });
    res.json(UsuarioModel.publico(UsuarioModel.actualizar(req.usuario.id, { nombre, telefono })));
  },
  // Nombre: cancelarMiCita
  // Descripción: La clienta cancela su propia cita (solo hasta 2 horas antes).
  // Entrada: El número de cita y el motivo (opcional).
  // Salida: La cita cancelada.
  // Objetivo: Que la clienta libere su espacio a tiempo.
  cancelarMiCita(req, res) {
    const cita = CitaModel.buscarPorId(req.params.id);
    if (!cita || cita.usuario_id !== req.usuario.id) return res.status(404).json({ error: 'No encontramos esa cita en tu cuenta.' });
    const motivo = String(req.body?.motivo || 'Cancelada por la clienta').trim().slice(0, 160);
    try { revisarCancelacion(cita, { motivo, soloFuturas: true, conAnticipacion: true }); } catch (fallo) { return res.status(fallo.codigo || 400).json({ error: fallo.message }); }
    res.json(cancelarCita(cita, { motivo, quien: 'la clienta' }).cita);
  },

  // Nombre: historial
  // Descripción: Junta los pedidos y las citas de la clienta.
  // Entrada: La petición de la clienta con sesión.
  // Salida: Sus pedidos y sus citas.
  // Objetivo: Mostrar su historial en «Mi cuenta».
  historial: (req, res) => res.json({ pedidos: UsuarioModel.pedidos(req.usuario.id), citas: UsuarioModel.citas(req.usuario.id) }),

  // Nombre: crearDireccion
  // Descripción: Agrega una dirección de la clienta.
  // Entrada: La dirección.
  // Salida: La dirección guardada.
  // Objetivo: Usarla al pedir envío.
  crearDireccion(req, res) {
    const error = UsuarioModel.validarDireccion(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(UsuarioModel.guardarDireccion(req.usuario.id, req.body));
  },
  // Nombre: editarDireccion
  // Descripción: Edita una dirección.
  // Entrada: La dirección y sus cambios.
  // Salida: La dirección actualizada.
  // Objetivo: Corregir direcciones.
  editarDireccion(req, res) {
    if (!UsuarioModel.direccion(req.usuario.id, req.params.id)) return res.status(404).json({ error: 'No encontramos esa dirección.' });
    const error = UsuarioModel.validarDireccion(req.body);
    if (error) return res.status(400).json({ error });
    res.json(UsuarioModel.guardarDireccion(req.usuario.id, req.body, Number(req.params.id)));
  },
  // Nombre: principal
  // Descripción: Marca una dirección como la principal.
  // Entrada: El número de la dirección.
  // Salida: Las direcciones.
  // Objetivo: Elegir la dirección de siempre.
  principal(req, res) {
    if (!UsuarioModel.direccion(req.usuario.id, req.params.id)) return res.status(404).json({ error: 'No encontramos esa dirección.' });
    UsuarioModel.hacerPrincipal(req.usuario.id, Number(req.params.id));
    res.json(UsuarioModel.direcciones(req.usuario.id));
  },
  // Nombre: borrarDireccion
  // Descripción: Borra una dirección.
  // Entrada: El número de la dirección.
  // Salida: Nada.
  // Objetivo: Quitar direcciones viejas.
  borrarDireccion(req, res) {
    if (!UsuarioModel.borrarDireccion(req.usuario.id, Number(req.params.id))) return res.status(404).json({ error: 'No encontramos esa dirección.' });
    res.json(UsuarioModel.direcciones(req.usuario.id));
  }
};
