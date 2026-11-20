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
import VerMas from '../components/VerMas.jsx';

const ESTADO = { recibido: 'Recibido', listo: 'Listo', completado: 'Completado', cancelado: 'Cancelado', pendiente: 'Pendiente', confirmada: 'Confirmada', completada: 'Atendida', cancelada: 'Cancelada', no_asistio: 'No llegó' };
const PROVEEDOR = { google: 'Google', facebook: 'Facebook', formulario: 'correo y contraseña' };
const POR_PAGINA_HISTORIAL = 3;
const FORMATO_FECHA_CITA = new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fechaCita = (fecha) => {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const texto = FORMATO_FECHA_CITA.format(new Date(anio, mes - 1, dia));
  return texto.charAt(0).toLocaleUpperCase('es-CR') + texto.slice(1);
};
const fechaPedido = (fecha) => {
  const [dia, hora] = fecha.split(' ');
  return `${fechaCita(dia)}${hora ? ` · ${hora.slice(0, 5)}` : ''}`;
};

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
  const [paginaCitas, setPaginaCitas] = useState(1);
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [confirmarCancelar, setConfirmarCancelar] = useState(null);
  const [avisoCita, setAvisoCita] = useState('');
  const paginasCitas = Math.ceil(historial.citas.length / POR_PAGINA_HISTORIAL);
  const paginasPedidos = Math.ceil(historial.pedidos.length / POR_PAGINA_HISTORIAL);
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
  useEffect(() => { if (paginaCitas > paginasCitas) setPaginaCitas(Math.max(1, paginasCitas)); }, [paginaCitas, paginasCitas]);
  useEffect(() => { if (paginaPedidos > paginasPedidos) setPaginaPedidos(Math.max(1, paginasPedidos)); }, [paginaPedidos, paginasPedidos]);

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
  const usuario = sesion.usuario;
  const ahora = Date.now();
  const fechaHora = (cita) => new Date(`${cita.fecha}T${cita.hora}:00-06:00`).getTime();
  const citasOrdenadas = [...historial.citas].sort((a, b) => {
    const tiempoA = fechaHora(a);
    const tiempoB = fechaHora(b);
    const pasadaA = tiempoA < ahora;
    const pasadaB = tiempoB < ahora;
    if (pasadaA !== pasadaB) return pasadaA ? 1 : -1;
    return pasadaA ? tiempoB - tiempoA : tiempoA - tiempoB;
  });
  const citasVisibles = citasOrdenadas.slice((paginaCitas - 1) * POR_PAGINA_HISTORIAL, paginaCitas * POR_PAGINA_HISTORIAL);
  const pedidosVisibles = historial.pedidos.slice((paginaPedidos - 1) * POR_PAGINA_HISTORIAL, paginaPedidos * POR_PAGINA_HISTORIAL);

  return (
    <div className="contenedor pagina cuenta">
      <Migas pasos={[['Mi cuenta']]} />
      <header className="cuenta__hero">
        <span className="cuenta__avatar" aria-hidden="true">{usuario.foto ? <img src={usuario.foto} alt="" referrerPolicy="no-referrer" /> : usuario.nombre[0]}</span>
        <div>
          <p className="cuenta__ante">Hola,</p>
          <h1>{usuario.nombre.split(' ')[0]}</h1>
          <p className="tenue">{usuario.correo} · entras con {PROVEEDOR[usuario.proveedor]}</p>
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

      <section className="cuenta__caja" aria-labelledby="t-mis-citas">
        <h2 id="t-mis-citas">Mis citas</h2>
        {!citasOrdenadas.length ? <p className="tenue">Todavía no tienes citas reservadas. <Link to="/reservar" className="enlace">Reservar una cita</Link></p> : (
          <ul className="historial historial--citas">
            {citasVisibles.map((cita) => {
              const minutosQueFaltan = (new Date(`${cita.fecha}T${cita.hora}:00-06:00`).getTime() - Date.now()) / 60000;
              const activa = ['pendiente', 'confirmada'].includes(cita.estado) && minutosQueFaltan > 0;
              return (
                <li className="cuenta-cita" key={`c${cita.id}`}>
                  <header className="cuenta-cita__cabecera">
                    <div>
                      <span className="cuenta-cita__etiqueta">Servicio reservado</span>
                      <h3>{cita.servicio}</h3>
                      <p>Manicurista: <strong>{cita.especialista}</strong></p>
                    </div>
                    <span className={`estado estado--${cita.estado}`}>{ESTADO[cita.estado] || cita.estado}</span>
                  </header>
                  <div className="cuenta-cita__datos">
                    <div><small>Fecha</small><strong>{fechaCita(cita.fecha)}</strong></div>
                    <div><small>Hora</small><strong>{cita.hora}</strong></div>
                    <div><small>Total</small><strong>{dinero(cita.total)}</strong></div>
                    {cita.cliente_nombre !== usuario.nombre && <div><small>Reservada para</small><strong>{cita.cliente_nombre}</strong></div>}
                  </div>
                  {activa && (
                    <p className="cuenta-cita__recordatorio">
                      <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                      <span>Recuerda llegar <strong>5 minutos antes</strong> de la hora de tu cita.</span>
                    </p>
                  )}
                  {activa && (
                    <div className="cuenta-cita__acciones">
                      {minutosQueFaltan >= 120
                        ? (confirmarCancelar === cita.id
                          ? <span>¿Seguro que deseas cancelar? <button type="button" className="enlace enlace--boton" onClick={() => cancelarCita(cita.id)}>Sí, cancelar</button> · <button type="button" className="enlace enlace--boton" onClick={() => setConfirmarCancelar(null)}>No</button></span>
                          : <button type="button" className="enlace enlace--boton historial__cancelar" onClick={() => setConfirmarCancelar(cita.id)}>Cancelar cita</button>)
                        : <small className="tenue">Faltan menos de 2 horas. Para cancelar, escríbenos por WhatsApp.</small>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <VerMas pagina={paginaCitas} paginas={paginasCitas} onCambiar={(numero) => {
          setPaginaCitas(numero);
          document.getElementById('t-mis-citas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }} />
        {avisoCita && <p className="historial__aviso" role="status">{avisoCita}</p>}
      </section>

      <section className="cuenta__caja" aria-labelledby="t-mis-ped">
        <h2 id="t-mis-ped">Mis pedidos</h2>
        {!historial.pedidos.length ? <p className="tenue">Todavía no tienes pedidos. <Link to="/tienda" className="enlace">Ir a la tienda</Link></p> : (
          <ul className="historial historial--pedidos">
            {pedidosVisibles.map((pedido) => (
              <li className="cuenta-pedido" key={`p${pedido.id}`}>
                <header className="cuenta-pedido__cabecera">
                  <div><span className="cuenta-pedido__etiqueta">Compra</span><strong>Pedido #{pedido.id}</strong></div>
                  <span className={`estado-pedido estado-pedido--${pedido.estado}`}>{ESTADO[pedido.estado] || pedido.estado}</span>
                </header>
                <p className="cuenta-pedido__productos">{pedido.detalle || 'Productos de la tienda'}</p>
                <div className="cuenta-pedido__datos">
                  <div><small>Fecha</small><strong>{fechaPedido(pedido.fecha)}</strong></div>
                  <div><small>Entrega</small><strong>{pedido.entrega === 'envio' ? `Envío a ${pedido.direccion?.split(':')[0] || 'domicilio'}` : 'Retiro en el salón'}</strong></div>
                  <div><small>Pago</small><strong>{pedido.metodo_pago}</strong></div>
                  <div className="cuenta-pedido__total"><small>Total</small><strong>{dinero(pedido.total)}</strong></div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <VerMas pagina={paginaPedidos} paginas={paginasPedidos} onCambiar={(numero) => {
          setPaginaPedidos(numero);
          document.getElementById('t-mis-ped')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }} />
      </section>
    </div>
  );
}
