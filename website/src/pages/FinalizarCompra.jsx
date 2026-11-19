import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { premioGuardado } from '../components/Ruleta.jsx';
import { SALON, dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import ProductoImagen from '../components/ProductoImagen.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import { enlaceArticulo } from '../components/CarritoLateral.jsx';
import { descargarCalendario } from '../lib/calendario.js';
import { useUsuario } from '../context/UsuarioContext.jsx';
import Acceso from '../components/Acceso.jsx';
import { ListaDirecciones } from '../components/Direcciones.jsx';
import Icono from '../components/Icono.jsx';


// Tarjeta: formato, marca y validación (Luhn) en el navegador; el servidor vuelve a validar
// Nombre: soloNumeros
// Descripción: Deja solo números.
// Entrada: El texto.
// Salida: Los números.
// Objetivo: Limpiar datos.
const soloNumeros = (v) => v.replace(/\D/g, '');
// Nombre: formatoTarjeta
// Descripción: Separa el número de tarjeta en grupos.
// Entrada: El texto.
// Salida: El número ordenado.
// Objetivo: Leer fácil.
const formatoTarjeta = (v) => soloNumeros(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
// Nombre: marca
// Descripción: Dice la marca de la tarjeta.
// Entrada: El número.
// Salida: La marca.
// Objetivo: Mostrar el logo.
const marca = (n) => (/^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'American Express' : '');
// Nombre: luhn
// Descripción: Revisa si la tarjeta es válida.
// Entrada: El número.
// Salida: Sí o no.
// Objetivo: Evitar errores.
function luhn(n) {
  let suma = 0;
  [...n].reverse().forEach((c, i) => { let d = Number(c); if (i % 2) { d *= 2; if (d > 9) d -= 9; } suma += d; });
  return n.length >= 13 && suma % 10 === 0;
}

const METODOS = [
  { id: 'sinpe', nombre: 'SINPE Móvil', logo: <span className="logo-pago logo-pago--sinpe">SINPE<small>Móvil</small></span> },
  { id: 'tarjeta', nombre: 'Tarjeta de débito o crédito', logo: <span className="logo-pago logo-pago--tarjeta" aria-hidden="true"><span /></span>, marcas: ['VISA', 'Mastercard', 'AMEX'] },
  { id: 'salon', nombre: 'Pagar al retirar en el salón', logo: <span className="logo-pago logo-pago--salon" aria-hidden="true">₡</span> }
];

// Nombre: FinalizarCompra
// Descripción: Muestra la página de pago.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Terminar la compra.
export default function FinalizarCompra() {
  useTitulo('Finalizar compra');
  const carrito = useCarrito();
  const articulos = carrito.elegidos;
  const sesion = useUsuario();
  const u = sesion.usuario;

  // Los datos vienen de la cuenta; "Cambiar datos" los actualiza en la cuenta
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', email: '' });
  const [editando, setEditando] = useState(false);
  const [entrega, setEntrega] = useState('retiro');
  const [direccionId, setDireccionId] = useState(null);
  useEffect(() => {
    if (!u) return;
    setCliente({ nombre: u.nombre, telefono: u.telefono || '', email: u.correo || '' });
    setEditando(!u.telefono);
  }, [u?.id]);
  useEffect(() => {
    if (!sesion.direcciones.some((d) => d.id === direccionId)) setDireccionId(sesion.direcciones.find((d) => d.principal)?.id ?? sesion.direcciones[0]?.id ?? null);
  }, [sesion.direcciones]);
  const envio = entrega === 'envio';
  const [metodo, setMetodo] = useState('sinpe');
  const [tarjeta, setTarjeta] = useState({ numero: '', mes: '', anio: '', cvv: '' });
  const [comprobante, setComprobante] = useState('');
  const [regalo, setRegalo] = useState({ abierto: false, texto: '' });
  const [cuponTexto, setCuponTexto] = useState('');
  const [cupon, setCupon] = useState('');
  const [verCupones, setVerCupones] = useState(false);
  const [cupones, setCupones] = useState([]);
  const [cotizacion, setCotizacion] = useState(null);
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState({ enviando: false, error: '', pedido: null });

  // Productos de la tienda y citas (una por persona) viajan por separado
  const items = useMemo(() => articulos.filter((i) => i.tipo !== 'cita').map((i) => ({ productoId: i.productoId ?? i.id, cantidad: i.cantidad, detalle: i.detalle })), [articulos]);
  const citas = useMemo(() => articulos.filter((i) => i.tipo === 'cita').map((i) => ({
    servicioId: i.servicioId, especialistaId: i.especialistaId, fecha: i.fecha, hora: i.hora,
    disenoId: i.disenoId, fotoRefId: i.fotoRefId, persona: i.persona, notas: i.notas
  })), [articulos]);
  const claveItems = JSON.stringify([items, citas]);

  useEffect(() => { api.cupones().then(setCupones).catch(() => setCupones([])); }, []);

  // El resumen lo calcula el servidor (precios reales y cupón con el patrón Decorator)
  useEffect(() => {
    if (!items.length && !citas.length) { setCotizacion(null); return; }
    api.cotizarPedido({ items, citas, cupon, metodoPago: metodo, entrega })
      .then((c) => { setCotizacion(c); setErrores((e) => ({ ...e, cupon: '' })); })
      .catch((err) => {
        setErrores((e) => ({ ...e, cupon: err.message }));
        if (cupon) setCupon('');
      });
  }, [claveItems, cupon, metodo, entrega]);
  useEffect(() => { if (envio && metodo === 'salon') setMetodo('sinpe'); }, [envio]);

  const numero = soloNumeros(tarjeta.numero);
  const anioActual = new Date().getFullYear();
  const pocos = articulos.filter((i) => i.stock > 0 && i.stock < 10).length;
  const cantidad = articulos.reduce((s, i) => s + i.cantidad, 0);

  // Nombre: aplicarCupon
  // Descripción: Aplica un cupón.
  // Entrada: El código.
  // Salida: Nada.
  // Objetivo: Dar el descuento.
  function aplicarCupon(codigo) {
    const c = String(codigo || cuponTexto).trim().toUpperCase();
    if (!c) { setErrores((e) => ({ ...e, cupon: 'Escribe el código del cupón.' })); return; }
    setCuponTexto(c);
    setCupon(c);
    setVerCupones(false);
  }

  // Nombre: confirmarDatos
  // Descripción: Confirma los datos de la clienta.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Pasar al pago.
  async function confirmarDatos() {
    const e = {};
    if (!cliente.nombre.trim()) e.nombre = 'Escribe tu nombre.';
    if (!/^[\d\s+-]{8,15}$/.test(cliente.telefono)) e.telefono = 'Escribe un teléfono de 8 dígitos.';
    setErrores((x) => ({ ...x, nombre: e.nombre, telefono: e.telefono }));
    if (e.nombre || e.telefono) return;
    try { sesion.actualizarUsuario(await api.cuenta.actualizar({ nombre: cliente.nombre, telefono: cliente.telefono })); setEditando(false); }
    catch (error) { setErrores((x) => ({ ...x, telefono: error.message })); }
  }

  // Nombre: validar
  // Descripción: Revisa el formulario de pago.
  // Entrada: Nada.
  // Salida: Sí o no.
  // Objetivo: Evitar errores.
  function validar() {
    const e = {};
    if (!cliente.nombre.trim()) e.nombre = 'Escribe tu nombre.';
    if (!/^[\d\s+-]{8,15}$/.test(cliente.telefono)) e.telefono = 'Escribe un teléfono de 8 dígitos.';
    if (cliente.email && !/^\S+@\S+\.\S+$/.test(cliente.email)) e.email = 'Revisa el correo.';
    if (metodo === 'tarjeta') {
      if (!luhn(numero)) e.numero = numero ? 'El número de tarjeta no es válido.' : 'Ingresa el número de tarjeta.';
      if (!tarjeta.mes || !tarjeta.anio) e.vence = 'Elige mes y año de vencimiento.';
      else if (Number(tarjeta.anio) === anioActual && Number(tarjeta.mes) < new Date().getMonth() + 1) e.vence = 'La tarjeta está vencida.';
      if (!/^\d{3,4}$/.test(tarjeta.cvv)) e.cvv = 'El CVV tiene 3 o 4 dígitos.';
    }
    if (envio && items.length && !direccionId) e.direccion = 'Elige o agrega la dirección de envío.';
    if (metodo === 'sinpe' && !/^\d{6,25}$/.test(comprobante)) e.comprobante = 'Escribe el número de comprobante de SINPE Móvil.';
    setErrores(e);
    if (e.nombre || e.telefono || e.email) setEditando(true);
    return Object.keys(e).length === 0;
  }

  // Nombre: finalizar
  // Descripción: Termina la compra.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Crear el pedido.
  async function finalizar() {
    if (!validar()) {
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    setEstado({ enviando: true, error: '', pedido: null });
    try {
      // Al servidor solo va lo que la pasarela simulada necesita; el CVV no sale del navegador
      const pago = metodo === 'tarjeta' ? { numero, mes: tarjeta.mes, anio: tarjeta.anio } : { comprobante };
      const pedido = await api.crearPedido({ items, citas, cliente, metodoPago: metodo, pago, cupon, notas: regalo.abierto ? regalo.texto : '', entrega: envio ? 'envio' : 'retiro', direccionId });
      carrito.quitarSeleccionados();
      setEstado({ enviando: false, error: '', pedido });
      window.scrollTo(0, 0);
    } catch (err) {
      if (err.requiereCuenta) sesion.recargar();
      setEstado({ enviando: false, error: err.message, pedido: null });
    }
  }

  // Pedido listo
  if (estado.pedido) {
    const p = estado.pedido;
    return (
      <div className="contenedor pagina compra-lista">
        <div className="compra-lista__caja" role="status">
          <span className="compra-lista__check" aria-hidden="true">✓</span>
          <h1>{p.id ? `¡Pedido #${p.id} recibido!` : p.citas.length > 1 ? '¡Tus citas están reservadas!' : '¡Tu cita está reservada!'}</h1>
          <p>Total: <strong>{dinero(p.total)}</strong>{p.descuento > 0 && <> · ahorraste {dinero(p.descuento)} con tu cupón</>}</p>
          <p className="tenue">Pagaste hoy {dinero(p.pagado)}{p.enSalon > 0 ? ` · pagas ${dinero(p.enSalon)} en el salón` : ''} · {p.metodo}{p.referenciaPago && p.referenciaPago !== 'EN-SALON' ? ` (${p.referenciaPago})` : ''}</p>
          {p.citas.length > 0 && (
            <ul className="cita-lista__citas">
              {p.citas.map((c) => (
                <li key={c.id} className="cita-lista__tarjeta">
                  <p className="cita-lista__fecha">{new Date(`${c.fecha}T12:00:00`).toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <p className="cita-lista__hora">{c.hora}</p>
                  <p>{c.servicio} con {c.especialista} · para {c.cliente_nombre}</p>
                  <p className="tenue">Reserva #{c.id} · {c.estado === 'confirmada' ? 'Confirmada' : 'Pendiente de confirmar'}</p>
                </li>
              ))}
            </ul>
          )}
          <ol className="compra-lista__pasos">
            {p.requiereVerificacion && metodo === 'sinpe' && <li>Revisamos tu comprobante de SINPE Móvil.</li>}
            {p.id && (p.direccion
              ? <li>Preparamos tu pedido y lo enviamos a: {p.direccion}. Te escribimos por WhatsApp al {cliente.telefono} cuando salga.</li>
              : <li>Preparamos tu pedido y te escribimos por WhatsApp al {cliente.telefono} cuando esté listo para retirar.</li>)}
            {p.citas.length > 0 && <li>Te recordamos tu cita por WhatsApp un día antes.</li>}
            {(!p.direccion || p.citas.length > 0) && <li>Te esperamos en {SALON.direccion}{p.enSalon > 0 ? ` (ahí pagas lo que falta)` : ''}.</li>}
          </ol>
          <div className="compra-lista__botones">
            {p.citas.length > 0 && <button type="button" className="boton" onClick={() => descargarCalendario(p.citas)}>Agregar a mi calendario</button>}
            <Link to="/tienda" className={p.citas.length ? 'boton boton--contorno' : 'boton'}>Seguir comprando</Link>
            {!p.citas.length && <Link to="/reservar" className="boton boton--contorno">Reservar una cita</Link>}
          </div>
        </div>
      </div>
    );
  }

  if (!articulos.length) {
    return (
      <div className="contenedor pagina carrito-vacio">
        <h1>No hay artículos para pagar</h1>
        <p className="tenue">Marca en el carrito los artículos que quieres pedir.</p>
        <Link to="/carrito" className="boton">Ir al carrito</Link>
      </div>
    );
  }

  // Para comprar hay que tener cuenta: así sabemos quién compra y a dónde va el pedido
  if (!u) {
    return (
      <div className="contenedor pagina compra compra--acceso">
        <nav aria-label="Ruta" className="migas">
          <ol><li><Link to="/">Inicio</Link></li><li><Link to="/carrito">Carrito</Link></li><li aria-current="page">Finalizar compra</li></ol>
        </nav>
        {sesion.cargando ? <p className="tenue">Cargando…</p> : (
          <div className="compra-acceso">
            <Acceso titulo="Entra para finalizar tu compra" bajada={`Tu carrito te espera: ${cantidad} ${cantidad === 1 ? 'artículo' : 'artículos'}. Con tu cuenta guardas tus direcciones y sigues tus pedidos.`} />
            <aside className="compra-acceso__lado">
              <p className="compra-acceso__titulo">Al crear tu cuenta</p>
              <ul>
                <li>Guardas hasta 3 direcciones de envío</li>
                <li>Ves el estado de tus pedidos y citas</li>
                <li>Te avisamos por WhatsApp cuando esté listo</li>
                <li>Pagas más rápido la próxima vez</li>
              </ul>
              <ul className="compra-acceso__fotos" aria-hidden="true">
                {articulos.slice(0, 4).map((i) => <li key={i.clave}><ProductoImagen producto={i} /></li>)}
              </ul>
            </aside>
          </div>
        )}
      </div>
    );
  }

  const ahorro = (cotizacion?.ahorroOfertas || 0) + (cotizacion?.descuento || 0);
  // Nombre: campo
  // Descripción: Muestra un campo del formulario.
  // Entrada: Id, etiqueta y opciones.
  // Salida: El campo.
  // Objetivo: Formularios ordenados.
  const campo = (id, etiqueta, props = {}) => (
    <div className="campo">
      <label htmlFor={`fc-${id}`}>{etiqueta}</label>
      <input id={`fc-${id}`} value={cliente[id]} aria-invalid={Boolean(errores[id])} aria-describedby={errores[id] ? `fc-${id}-error` : undefined}
             onChange={(evento) => setCliente({ ...cliente, [id]: evento.target.value })} {...props} />
      {errores[id] && <p id={`fc-${id}-error`} className="error-campo">{errores[id]}</p>}
    </div>
  );

  return (
    <div className="contenedor pagina compra">
      <nav aria-label="Ruta" className="migas">
        <ol><li><Link to="/">Inicio</Link></li><li><Link to="/carrito">Carrito</Link></li><li aria-current="page">Finalizar compra</li></ol>
      </nav>
      <h1 className="solo-lector">Finalizar compra</h1>

      <div className="compra__grid">
        <div className="compra__principal">
          <p className="carrito-pagina__envio"><span aria-hidden="true">✓</span> {envio ? `Envío a domicilio por ${dinero(cotizacion?.costoEnvio ?? 2500)}` : 'Retiro gratis especial para ti'} <em>Oferta exclusiva</em></p>
          {ahorro > 0 && (
            <p className="carrito-pagina__envio compra__ahorro">
              <span aria-hidden="true">✓</span> Estás ahorrando {dinero(ahorro)} en este pedido
              <em className="compra__reloj">Termina en <CuentaRegresiva compacta /></em>
            </p>
          )}

          <div className="compra__dos">
            <section aria-labelledby="t-datos">
              <div className="compra__cabeza">
                <h2 id="t-datos">Tus datos</h2>
                {!editando && <button type="button" className="enlace-boton" onClick={() => setEditando(true)}>Cambiar datos ›</button>}
              </div>
              {editando ? (
                <div className="tarjeta-datos tarjeta-datos--form">
                  {campo('nombre', 'Nombre completo', { autoComplete: 'name', required: true })}
                  {campo('telefono', 'Teléfono (WhatsApp)', { autoComplete: 'tel', inputMode: 'tel', required: true })}
                  <p className="tenue">Correo de la cuenta: {cliente.email}</p>
                  <button type="button" className="boton boton--contorno" onClick={confirmarDatos}>Guardar en mi cuenta</button>
                </div>
              ) : (
                <div className="tarjeta-datos">
                  <p><strong>{cliente.nombre}</strong> <span>{cliente.telefono}</span></p>
                  {cliente.email && <p className="tenue">{cliente.email}</p>}
                  <p className="tarjeta-datos__lugar">{envio && items.length ? `Envío a: ${sesion.direcciones.find((d) => d.id === direccionId)?.etiqueta || 'elige una dirección'}` : `Retiro en: ${SALON.direccion}`}</p>
                </div>
              )}
            </section>
            <section aria-labelledby="t-retiro" className="compra__retiro">
              {items.length > 0 && (
                <>
                  <h2 id="t-retiro">¿Cómo recibes tus productos?</h2>
                  <div className="entrega" role="radiogroup" aria-labelledby="t-retiro">
                    <label className={`entrega__opcion ${!envio ? 'entrega__opcion--activa' : ''}`}>
                      <input type="radio" name="entrega" className="marca" checked={!envio} onChange={() => setEntrega('retiro')} />
                      <span><strong>Retiro en el salón</strong><small>Te avisamos por WhatsApp cuando esté listo</small></span>
                      <b className="gratis">GRATIS</b>
                    </label>
                    <label className={`entrega__opcion ${envio ? 'entrega__opcion--activa' : ''}`}>
                      <input type="radio" name="entrega" className="marca" checked={envio} onChange={() => setEntrega('envio')} />
                      <span><strong>Envío a domicilio</strong><small>A una de tus direcciones guardadas</small></span>
                      <b>{dinero(cotizacion?.costoEnvio ?? 2500)}</b>
                    </label>
                  </div>
                </>
              )}
              {citas.length > 0 && (
                <>
                  <h2 id={items.length ? undefined : 't-retiro'} className="compra__citas-titulo">{citas.length > 1 ? `Tus ${citas.length} citas` : 'Tu cita'}</h2>
                  <ul className="compra__citas">
                    {articulos.filter((i) => i.tipo === 'cita').map((i) => (
                      <li key={i.clave}><strong>{i.fechaTexto}, {i.hora}</strong> · {i.nombre} con {i.especialistaNombre}{i.persona ? ` (para ${i.persona})` : ''}</li>
                    ))}
                  </ul>
                  <p className="tenue">Hoy pagas el 30 % de las citas para apartar el espacio; el resto, en el salón.</p>
                </>
              )}
            </section>
          </div>

          {envio && items.length > 0 && (
            <section aria-labelledby="t-dir" className="compra__direcciones">
              <div className="compra__cabeza"><h2 id="t-dir">¿A dónde lo enviamos?</h2><Link to="/cuenta" className="enlace-flecha">Mis direcciones ›</Link></div>
              <ListaDirecciones elegida={direccionId} onElegir={(id) => { setDireccionId(id); setErrores((x) => ({ ...x, direccion: '' })); }} />
              {errores.direccion && <p role="alert" className="error">{errores.direccion}</p>}
            </section>
          )}

          <section aria-labelledby="t-art" className="compra__articulos">
            <div className="compra__cabeza">
              <h2 id="t-art">Detalles del artículo ({cantidad})</h2>
              <Link to="/carrito" className="enlace-flecha">Ver todo ›</Link>
            </div>
            <ul className="compra__carrusel">
              {articulos.map((i) => (
                <li key={i.clave}>
                  <Link to={enlaceArticulo(i)} className="compra__foto">
                    <ProductoImagen producto={i} />
                    {i.tipo === 'cita' ? <span>{i.fechaTexto} · {i.hora}</span> : i.stock > 0 && i.stock < 10 && <span>Casi agotado</span>}
                    {i.cantidad > 1 && <b>×{i.cantidad}</b>}
                  </Link>
                  <p className="compra__precio">
                    <strong className={i.precio_anterior ? 'linea-carrito__oferta' : ''}>{dinero(i.precio)}</strong>
                    {i.precio_anterior && <s>{dinero(i.precio_anterior)}</s>}
                  </p>
                  <span className="solo-lector">{i.nombre}{i.detalle ? `, ${i.detalle}` : ''}, cantidad {i.cantidad}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="enlace-boton compra__regalo" aria-expanded={regalo.abierto} onClick={() => setRegalo({ ...regalo, abierto: !regalo.abierto })}>
              <Icono nombre="regalo" tam={18} /> Agregar gratis una tarjeta de mensaje de regalo ›
            </button>
            {regalo.abierto && (
              <div className="campo">
                <label htmlFor="fc-regalo">Mensaje para la tarjeta (lo escribimos a mano)</label>
                <textarea id="fc-regalo" rows={3} maxLength={300} value={regalo.texto} onChange={(evento) => setRegalo({ ...regalo, texto: evento.target.value })} />
              </div>
            )}
          </section>

          <section aria-labelledby="t-pago" className="compra__pago">
            <h2 id="t-pago">Métodos de pago</h2>
            <div role="radiogroup" aria-labelledby="t-pago" className="metodos">
              {METODOS.filter((m) => !(envio && items.length && m.id === 'salon')).map((m) => (
                <div key={m.id} className={`metodo ${metodo === m.id ? 'metodo--activo' : ''}`}>
                  <label className="metodo__fila">
                    <input type="radio" className="marca" name="metodo" value={m.id} checked={metodo === m.id} onChange={() => setMetodo(m.id)} />
                    {m.logo}
                    <span className="metodo__nombre">{m.nombre}</span>
                    {m.marcas && <span className="metodo__marcas" aria-hidden="true">{m.marcas.map((x) => <span key={x}>{x}</span>)}</span>}
                  </label>

                  {metodo === m.id && m.id === 'tarjeta' && (
                    <div className="metodo__panel">
                      <p className="seguro"><Icono nombre="candado" tam={16} /> Todas las transacciones son seguras y cifradas</p>
                      <div className="campo">
                        <label htmlFor="fc-numero">* Número de tarjeta</label>
                        <div className={`entrada-tarjeta ${errores.numero ? 'entrada-tarjeta--error' : ''}`}>
                          <span className="logo-pago logo-pago--tarjeta" aria-hidden="true"><span /></span>
                          <input id="fc-numero" inputMode="numeric" autoComplete="cc-number" placeholder="Número de tarjeta" value={tarjeta.numero}
                                 aria-invalid={Boolean(errores.numero)} aria-describedby="fc-numero-error"
                                 onChange={(evento) => setTarjeta({ ...tarjeta, numero: formatoTarjeta(evento.target.value) })} />
                          {marca(numero) && <span className="entrada-tarjeta__marca">{marca(numero)}</span>}
                          {luhn(numero) && <span className="entrada-tarjeta__ok" aria-label="Número válido">✓</span>}
                        </div>
                        {errores.numero && <p id="fc-numero-error" className="error-campo"><Icono nombre="alerta" tam={15} /> {errores.numero}</p>}
                      </div>
                      <div className="metodo__vence">
                        <fieldset className="campo">
                          <legend>* Fecha de vencimiento</legend>
                          <div className="metodo__selects">
                            <select aria-label="Mes" autoComplete="cc-exp-month" value={tarjeta.mes} aria-invalid={Boolean(errores.vence)} onChange={(evento) => setTarjeta({ ...tarjeta, mes: evento.target.value })}>
                              <option value="">Mes</option>
                              {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>)}
                            </select>
                            <select aria-label="Año" autoComplete="cc-exp-year" value={tarjeta.anio} aria-invalid={Boolean(errores.vence)} onChange={(evento) => setTarjeta({ ...tarjeta, anio: evento.target.value })}>
                              <option value="">Año</option>
                              {Array.from({ length: 12 }, (_, i) => <option key={i} value={anioActual + i}>{anioActual + i}</option>)}
                            </select>
                          </div>
                          {errores.vence && <p className="error-campo"><Icono nombre="alerta" tam={15} /> {errores.vence}</p>}
                        </fieldset>
                        <div className="campo">
                          <label htmlFor="fc-cvv">* CVV</label>
                          <input id="fc-cvv" inputMode="numeric" autoComplete="cc-csc" placeholder="Código de 3 a 4 dígitos" maxLength={4} value={tarjeta.cvv}
                                 aria-invalid={Boolean(errores.cvv)} onChange={(evento) => setTarjeta({ ...tarjeta, cvv: soloNumeros(evento.target.value) })} />
                          {errores.cvv && <p className="error-campo"><Icono nombre="alerta" tam={15} /> {errores.cvv}</p>}
                        </div>
                      </div>
                      <p className="aviso-prueba">Modo de prueba: no se hace ningún cobro real y la página no guarda tu tarjeta. Para probar usa 4242 4242 4242 4242 con cualquier fecha futura.</p>
                    </div>
                  )}
                  {metodo === m.id && m.id === 'sinpe' && (
                    <div className="metodo__panel">
                      <ol className="ficha__pasos">
                        <li>Abre la app de tu banco y elige SINPE Móvil.</li>
                        <li><span>Envía <strong>{dinero(cotizacion?.pagasHoy ?? carrito.totalElegido)}</strong> al <strong>{SALON.sinpe.numero}</strong> ({SALON.sinpe.nombre}).</span></li>
                        <li>Copia aquí el número de comprobante.</li>
                      </ol>
                      <div className="campo">
                        <label htmlFor="fc-comprobante">* Número de comprobante</label>
                        <input id="fc-comprobante" inputMode="numeric" value={comprobante} aria-invalid={Boolean(errores.comprobante)}
                               onChange={(evento) => setComprobante(soloNumeros(evento.target.value))} />
                        {errores.comprobante && <p className="error-campo"><Icono nombre="alerta" tam={15} /> {errores.comprobante}</p>}
                      </div>
                    </div>
                  )}
                  {metodo === m.id && m.id === 'salon' && (
                    <div className="metodo__panel">
                      <p>Apartamos tu pedido{citas.length ? ' y tus citas' : ''} y pagas todo en el salón, en efectivo, tarjeta o SINPE.{citas.length ? ' Las citas quedan pendientes hasta que te confirmemos por WhatsApp.' : ''}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="resumen-pedido compra__resumen" aria-labelledby="t-resumen">
          <h2 id="t-resumen">Resumen del pedido</h2>
          <form className="cupon-fila" onSubmit={(evento) => { evento.preventDefault(); aplicarCupon(); }}>
            <label htmlFor="fc-cupon" className="solo-lector">Código del cupón</label>
            <input id="fc-cupon" placeholder="Ingresa el código del cupón" value={cuponTexto} aria-invalid={Boolean(errores.cupon)}
                   onChange={(evento) => setCuponTexto(evento.target.value.toUpperCase())} />
            <button type="submit" className="chip-filtro chip-filtro--borde">Aplicar</button>
          </form>
          {errores.cupon && <p className="error-campo" role="alert">{errores.cupon}</p>}
          {premioGuardado()?.codigo && cotizacion?.cupon?.codigo !== premioGuardado().codigo && (
            <button type="button" className="premio-aviso" onClick={() => aplicarCupon(premioGuardado().codigo)}>
              <span aria-hidden="true" className="premio-aviso__regalo" />
              <span>Ganaste <b>{premioGuardado().etiqueta}</b> en la ruleta</span>
              <strong>Usar {premioGuardado().codigo}</strong>
            </button>
          )}
          {cotizacion?.cupon && (
            <p className="cupon-aplicado">✓ {cotizacion.cupon.codigo}: {cotizacion.cupon.descripcion}
              <button type="button" className="enlace-boton" onClick={() => { setCupon(''); setCuponTexto(''); }}>Quitar</button>
            </p>
          )}
          <button type="button" className="cupon-lista__abrir" aria-expanded={verCupones} onClick={() => setVerCupones(!verCupones)}>
            Aplicar el código de cupón <span aria-hidden="true">{verCupones ? '⌃' : '›'}</span>
          </button>
          {verCupones && (
            <ul className="cupon-lista">
              {cupones.map((c) => (
                <li key={c.codigo}>
                  <button type="button" onClick={() => aplicarCupon(c.codigo)} disabled={Boolean(c.solo_combos)}>
                    <strong>{c.codigo}</strong>
                    <span>{c.descripcion}{c.solo_combos ? ' (solo citas)' : ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {cotizacion ? (
            <dl>
              <div><dt>Total de los artículos:</dt><dd>{cotizacion.ahorroOfertas > 0 ? <s>{dinero(cotizacion.sinOfertas)}</s> : dinero(cotizacion.sinOfertas)}</dd></div>
              {cotizacion.ahorroOfertas > 0 && <div><dt>✓ Descuento de artículo(s):</dt><dd className="resumen-pedido__menos">-{dinero(cotizacion.ahorroOfertas)}</dd></div>}
              {cotizacion.descuento > 0 && <div><dt>✓ Cupón {cotizacion.cupon.codigo}:</dt><dd className="resumen-pedido__menos">-{dinero(cotizacion.descuento)}</dd></div>}
              {items.length > 0 && (cotizacion.envio > 0
                ? <div><dt>Envío a domicilio:</dt><dd>{dinero(cotizacion.envio)}</dd></div>
                : <div><dt>✓ Retiro en el salón:</dt><dd className="resumen-pedido__gratis">GRATIS</dd></div>)}
              <div className="resumen-pedido__total"><dt>Total del pedido:</dt><dd>{dinero(cotizacion.total)}</dd></div>
              {cotizacion.enSalon > 0 && <div><dt>Pagas hoy:</dt><dd><strong>{dinero(cotizacion.pagasHoy)}</strong></dd></div>}
              {cotizacion.enSalon > 0 && <div><dt>Pagas en el salón:</dt><dd>{dinero(cotizacion.enSalon)}</dd></div>}
            </dl>
          ) : <p className="tenue" role="status">Calculando…</p>}
          <p className="resumen-pedido__nota">Al finalizar la compra aceptas que te contactemos por WhatsApp para coordinar el retiro.</p>
          {estado.error && <p role="alert" className="error">{estado.error}</p>}
          <button type="button" className="resumen-pedido__boton compra__boton" onClick={finalizar} disabled={estado.enviando || !cotizacion}>
            <strong>{estado.enviando ? 'Procesando…' : `Finalizar compra (${cantidad})`}</strong>
            {pocos > 0 && !estado.enviando && <span>⏳ {pocos} casi {pocos === 1 ? 'agotado' : 'agotados'}</span>}
          </button>

          <section className="garantia" aria-labelledby="t-g1">
            <h3 id="t-g1"><Icono nombre="bolsa" tam={20} /> Compra garantizada</h3>
            <ul>
              <li>Retiro gratis en el salón</li>
              <li>Productos profesionales que usamos en el salón</li>
              <li>Te avisamos por WhatsApp cuando esté listo</li>
            </ul>
          </section>
          <section className="garantia" aria-labelledby="t-g2">
            <h3 id="t-g2"><Icono nombre="candado" tam={20} /> {SALON.nombre} protege tu información</h3>
            <ul>
              <li>No guardamos los datos de tu tarjeta</li>
              <li>Tus datos solo se usan para tu pedido</li>
              <li>Nunca vendemos tu información</li>
            </ul>
          </section>
        </aside>
      </div>

      {/* En celular: total y botón siempre a la vista */}
      <div className="compra__barra-movil">
        <p><span className="tenue">Total</span><strong>{cotizacion ? dinero(cotizacion.total) : '…'}</strong></p>
        <button type="button" className="resumen-pedido__boton" onClick={finalizar} disabled={estado.enviando || !cotizacion}>
          <strong>{estado.enviando ? 'Procesando…' : `Finalizar compra (${cantidad})`}</strong>
        </button>
      </div>
    </div>
  );
}
