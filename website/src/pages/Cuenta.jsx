// Mi cuenta: datos, direcciones (hasta 3) y el historial de pedidos y citas.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { SALON, dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import { useUsuario } from '../context/UsuarioContext.jsx';
import Acceso from '../components/Acceso.jsx';
import { ListaDirecciones } from '../components/Direcciones.jsx';
import Migas from '../components/Migas.jsx';

const ESTADO = { recibido: 'Recibido', listo: 'Listo', completado: 'Completado', cancelado: 'Cancelado', pendiente: 'Pendiente', confirmada: 'Confirmada', completada: 'Atendida', cancelada: 'Cancelada', no_asistio: 'No llegó' };
const PROVEEDOR = { google: 'Google', facebook: 'Facebook', formulario: 'correo y contraseña' };

// Nombre: Cuenta
// Descripción: Muestra la página "Mi cuenta".
// Entrada: Nada.
// Salida: La página.
// Objetivo: Ver datos e historial.
export default function Cuenta() {
  useTitulo('Mi cuenta');
  const sesion = useUsuario();
  const [params] = useSearchParams();
  const irA = useNavigate();
  const volver = params.get('volver');
  const [datos, setDatos] = useState(null);
  const [aviso, setAviso] = useState({ texto: '', error: false });
  const [historial, setHistorial] = useState({ pedidos: [], citas: [] });
  const [confirmarCancelar, setConfirmarCancelar] = useState(null);
  const [avisoCita, setAvisoCita] = useState('');
  // Nombre: cancelarCita
  // Descripción: Cancela una cita de la clienta (el servidor revisa que falten al menos 2 horas).
  // Entrada: El número de cita.
  // Salida: Nada.
  // Objetivo: Liberar el espacio a tiempo.
  const cancelarCita = async (idCita) => {
    try {
      await api.cuenta.cancelarMiCita(idCita);
      setAvisoCita('Tu cita quedó cancelada. ¡Gracias por avisar a tiempo!');
      setHistorial(await api.cuenta.historial());
    } catch (error) { setAvisoCita(error.message); }
    setConfirmarCancelar(null);
  };

  useEffect(() => { if (sesion.usuario) { setDatos({ nombre: sesion.usuario.nombre, telefono: sesion.usuario.telefono || '' }); api.cuenta.historial().then(setHistorial).catch(() => {}); } }, [sesion.usuario?.id]);

  if (sesion.cargando) return <div className="contenedor pagina"><p className="tenue">Cargando…</p></div>;
  if (!sesion.usuario) {
    return (
      <div className="contenedor pagina cuenta-entrar">
        <div className="compra-acceso">
          <Acceso titulo="Entra a tu cuenta" bajada="Guarda tus direcciones, sigue tus pedidos y reserva más rápido." onListo={() => volver && irA(volver)} />
          <aside className="compra-acceso__lado">
            <p className="compra-acceso__titulo">Con tu cuenta de {SALON.nombre}</p>
            <ul>
              <li>Guardas hasta 3 direcciones de envío</li>
              <li>Ves el estado de tus pedidos y citas</li>
              <li>Te avisamos por WhatsApp cuando esté listo</li>
              <li>Pagas más rápido la próxima vez</li>
            </ul>
            <div className="compra-acceso__cta">
              <Link to="/galeria" className="compra-acceso__enlace">Ver diseños</Link>
              <Link to="/tienda" className="compra-acceso__enlace">Ir a la tienda</Link>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Nombre: guardar
  // Descripción: Guarda los datos de la cuenta.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Editar perfil.
  const guardar = async (evento) => {
    evento.preventDefault();
    try { sesion.actualizarUsuario(await api.cuenta.actualizar(datos)); setAviso({ texto: 'Datos guardados.' }); } catch (err) { setAviso({ texto: err.message, error: true }); }
  };
  const u = sesion.usuario;

  return (
    <div className="contenedor pagina cuenta">
      <Migas pasos={[['Mi cuenta']]} />
      <header className="cuenta__hero">
        <span className="cuenta__avatar" aria-hidden="true">{u.foto ? <img src={u.foto} alt="" referrerPolicy="no-referrer" /> : u.nombre[0]}</span>
        <div>
          <p className="cuenta__ante">Hola,</p>
          <h1>{u.nombre.split(' ')[0]}</h1>
          <p className="tenue">{u.correo} · entras con {PROVEEDOR[u.proveedor]}</p>
        </div>
        <button type="button" className="boton boton--contorno boton--chico" onClick={() => sesion.salir()}>Salir</button>
      </header>
      {volver && <p className="aviso-ok">¡Listo! Ya puedes <Link to={volver} className="enlace">continuar con tu compra ›</Link></p>}

      <div className="cuenta__grid">
        <section className="cuenta__caja" aria-labelledby="t-mis-datos">
          <h2 id="t-mis-datos">Mis datos</h2>
          <form onSubmit={guardar} className="form-cancelar">
            <div className="campo"><label htmlFor="cu-nombre">Nombre</label><input id="cu-nombre" value={datos?.nombre || ''} onChange={(evento) => setDatos({ ...datos, nombre: evento.target.value })} /></div>
            <div className="campo"><label htmlFor="cu-tel">Teléfono (WhatsApp)</label><input id="cu-tel" type="tel" value={datos?.telefono || ''} onChange={(evento) => setDatos({ ...datos, telefono: evento.target.value })} placeholder="8888 8888" /></div>
            {aviso.texto && <p role={aviso.error ? 'alert' : 'status'} className={aviso.error ? 'error' : 'aviso-ok'}>{aviso.texto}</p>}
            <button type="submit" className="boton">Guardar</button>
          </form>
        </section>
        <section className="cuenta__caja cuenta__caja--ancha" aria-labelledby="t-mis-dir">
          <h2 id="t-mis-dir">Mis direcciones <span className="tenue">({sesion.direcciones.length} de 3)</span></h2>
          <ListaDirecciones />
        </section>
      </div>

      <section className="cuenta__caja" aria-labelledby="t-mis-ped">
        <h2 id="t-mis-ped">Mis pedidos y citas</h2>
        {!historial.pedidos.length && !historial.citas.length ? <p className="tenue">Todavía no tienes pedidos. <Link to="/tienda" className="enlace">Ir a la tienda</Link></p> : (
          <ul className="historial">
            {historial.pedidos.map((p) => (
              <li key={`p${p.id}`}><span className="historial__tipo">Pedido #{p.id}</span><span>{p.detalle}<br /><small className="tenue">{p.fecha.slice(0, 16)} · {p.entrega === 'envio' ? `Envío a ${p.direccion?.split(':')[0]}` : 'Retiro en el salón'}</small></span><strong>{dinero(p.total)}</strong><span className={`estado-pedido estado-pedido--${p.estado}`}>{ESTADO[p.estado] || p.estado}</span></li>
            ))}
            {historial.citas.map((c) => {
              const minutosQueFaltan = (new Date(`${c.fecha}T${c.hora}:00-06:00`).getTime() - Date.now()) / 60000;
              const activa = ['pendiente', 'confirmada'].includes(c.estado) && minutosQueFaltan > 0;
              return (
                <li key={`c${c.id}`}><span className="historial__tipo historial__tipo--cita">Cita</span><span>{c.servicio} con {c.especialista}<br /><small className="tenue">{c.fecha} · {c.hora}{c.cliente_nombre !== u.nombre ? ` · para ${c.cliente_nombre}` : ''}</small>
                  {activa && (minutosQueFaltan >= 120
                    ? (confirmarCancelar === c.id
                      ? <span className="historial__cancelar">¿Seguro? <button type="button" className="enlace enlace--boton" onClick={() => cancelarCita(c.id)}>Sí, cancelar</button> · <button type="button" className="enlace enlace--boton" onClick={() => setConfirmarCancelar(null)}>No</button></span>
                      : <button type="button" className="enlace enlace--boton historial__cancelar" onClick={() => setConfirmarCancelar(c.id)}>Cancelar cita</button>)
                    : <small className="historial__cancelar tenue">Faltan menos de 2 horas: para cancelar escríbenos por WhatsApp.</small>)}
                </span><strong>{dinero(c.total)}</strong><span className={`estado estado--${c.estado}`}>{ESTADO[c.estado] || c.estado}</span></li>
              );
            })}
            {avisoCita && <li className="historial__aviso" role="status">{avisoCita}</li>}
          </ul>
        )}
      </section>
    </div>
  );
}
