// CONTROLADOR: registro, inicio de sesión (formulario, Google o Facebook) y "Mi cuenta" con direcciones.
import { UsuarioModel, PROVINCIAS, MAX_DIRECCIONES } from '../models/UsuarioModel.js';
import { crearEstrategia, configuracionPublica, Contrasenas } from '../patrones/estrategiaAutenticacion.js';

const sesion = (usuario) => ({ token: UsuarioModel.abrirSesion(usuario.id), usuario: UsuarioModel.publico(usuario) });

export const cuentaController = {
  config: (req, res) => res.json({ ...configuracionPublica(), provincias: PROVINCIAS, maxDirecciones: MAX_DIRECCIONES }),

  registro(req, res) {
    const d = { ...req.body, correo: String(req.body.correo || '').trim().toLowerCase() };
    const error = UsuarioModel.validarRegistro(d);
    if (error) return res.status(400).json({ error });
    if (UsuarioModel.buscarPorCorreo(d.correo)) return res.status(409).json({ error: 'Ya hay una cuenta con ese correo. Entra con tu contraseña o con Google/Facebook.' });
    const u = UsuarioModel.crear({ nombre: d.nombre, correo: d.correo, telefono: d.telefono.trim(), contrasenaHash: Contrasenas.crear(d.contrasena) });
    res.status(201).json(sesion(u));
  },

  // Una sola ruta para las tres formas de entrar (Strategy + Factory)
  async entrar(req, res, next) {
    try {
      const estrategia = crearEstrategia(req.params.proveedor || 'formulario');
      const datos = await estrategia.autenticar(req.body);
      let u;
      if (datos.proveedor === 'formulario') {
        u = UsuarioModel.buscarPorCorreo(datos.correo);
        if (!u || !u.contrasena_hash || !Contrasenas.verificar(datos.contrasena, u.contrasena_hash)) {
          return res.status(401).json({ error: u && !u.contrasena_hash ? `Esta cuenta se creó con ${u.proveedor === 'google' ? 'Google' : 'Facebook'}. Entra con ese botón.` : 'Correo o contraseña incorrectos.' });
        }
      } else {
        u = UsuarioModel.desdeProveedor(datos);
      }
      res.json(sesion(u));
    } catch (e) { next(e); }
  },

  salir(req, res) { if (req.token) UsuarioModel.cerrarSesion(req.token); res.status(204).end(); },

  yo: (req, res) => res.json({ usuario: UsuarioModel.publico(req.usuario), direcciones: UsuarioModel.direcciones(req.usuario.id) }),
  actualizar(req, res) {
    const { nombre = '', telefono = '' } = req.body;
    if (nombre.trim().length < 2) return res.status(400).json({ error: 'Escribe tu nombre.' });
    if (!/^[\d\s+-]{8,15}$/.test(telefono)) return res.status(400).json({ error: 'Escribe un teléfono de 8 dígitos.' });
    res.json(UsuarioModel.publico(UsuarioModel.actualizar(req.usuario.id, { nombre, telefono })));
  },
  historial: (req, res) => res.json({ pedidos: UsuarioModel.pedidos(req.usuario.id), citas: UsuarioModel.citas(req.usuario.id) }),

  crearDireccion(req, res) {
    const error = UsuarioModel.validarDireccion(req.body);
    if (error) return res.status(400).json({ error });
    res.status(201).json(UsuarioModel.guardarDireccion(req.usuario.id, req.body));
  },
  editarDireccion(req, res) {
    if (!UsuarioModel.direccion(req.usuario.id, req.params.id)) return res.status(404).json({ error: 'No encontramos esa dirección.' });
    const error = UsuarioModel.validarDireccion(req.body);
    if (error) return res.status(400).json({ error });
    res.json(UsuarioModel.guardarDireccion(req.usuario.id, req.body, Number(req.params.id)));
  },
  principal(req, res) {
    if (!UsuarioModel.direccion(req.usuario.id, req.params.id)) return res.status(404).json({ error: 'No encontramos esa dirección.' });
    UsuarioModel.hacerPrincipal(req.usuario.id, Number(req.params.id));
    res.json(UsuarioModel.direcciones(req.usuario.id));
  },
  borrarDireccion(req, res) {
    if (!UsuarioModel.borrarDireccion(req.usuario.id, Number(req.params.id))) return res.status(404).json({ error: 'No encontramos esa dirección.' });
    res.json(UsuarioModel.direcciones(req.usuario.id));
  }
};
