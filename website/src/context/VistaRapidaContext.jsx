// Vista previa rápida (como en las tiendas en línea): al tocar el carrito o "Vista previa"
// en una tarjeta se abre una ventana con la foto, el precio, las opciones y el botón para agregar,
// sin salir de la página.
import { createContext, useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useCarrito } from './CarritoContext.jsx';
import { useReserva } from './ReservaContext.jsx';
import Modal from '../components/Modal.jsx';
import Foto from '../components/Foto.jsx';
import ProductoImagen from '../components/ProductoImagen.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import { useAgregarPresson, miles, positivo } from '../components/TarjetaDiseno.jsx';
import { etiquetaVariante } from '../lib/fichaProducto.js';
import BotonFavorito from '../components/BotonFavorito.jsx';
import { Estrellas } from '../components/Resenas.jsx';

const Contexto = createContext(() => {});
// Nombre: useVistaRapida
// Descripción: Usa la vista rápida en una página.
// Entrada: Nada.
// Salida: La función para abrirla.
// Objetivo: Ver sin salir de la página.
export const useVistaRapida = () => useContext(Contexto);

// Nombre: VistaProducto
// Descripción: Muestra un producto en ventana.
// Entrada: El producto y cómo cerrar.
// Salida: La ventana.
// Objetivo: Agregar rápido.
function VistaProducto({ id, cerrar }) {
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [actual, setActual] = useState(id);
  const carrito = useCarrito();
  const irA = useNavigate();
  useEffect(() => { setProducto(null); api.producto(actual).then(setProducto).catch(() => cerrar()); }, [actual]);
  if (!producto) return <div className="vista-rapida vista-rapida--cargando" role="status"><span className="girando girando--oscuro" /> Cargando…</div>;

  const descuento = producto.precio_anterior ? Math.round((1 - producto.precio / producto.precio_anterior) * 100) : 0;
  const agotado = producto.stock === 0;
  const variante = producto.variantes.find((variante) => variante.id === producto.id)?.variante;
  const enCarrito = carrito.items.find((item) => item.clave === `${producto.id}|`);

  const ahorro = producto.precio_anterior ? producto.precio_anterior - producto.precio : 0;
  const maximo = Math.max(1, Math.min(10, producto.stock));
  const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

  return (
    <div className="vista-rapida vista-pro">
      <div className="vista-pro__foto">
        <ProductoImagen producto={producto} />
        {descuento > 0 && <span className="vista-pro__pct">-{descuento}%</span>}
        {agotado && <span className="sello-agotado">Agotado</span>}
        <BotonFavorito tipo="producto" datos={producto} nombre={producto.nombre} clase="vista-pro__fav" />
      </div>
      <div className="vista-pro__info">
        <p className="vista-pro__ante">{producto.categoria} · {producto.marca}</p>
        <h2 className="vista-pro__nombre">{producto.nombre}</h2>
        {producto.descripcion && <p className="vista-pro__desc">{producto.descripcion}</p>}
        <div className="vista-pro__fila">
          {producto.calificacion ? <span className="vista-pro__estrellas"><Estrellas valor={producto.calificacion} /> <b>{producto.calificacion}</b> <span className="tenue">({producto.resenas} opiniones)</span></span> : <span className="tenue">Sin opiniones aún</span>}
          {producto.vendidos > 0 && <span className="tenue">· {miles(producto.vendidos)} vendidos</span>}
        </div>
        {producto.puesto <= 20 && <p className="vista-pro__ranking">#{producto.puesto} más vendido en {producto.categoria}</p>}

        <div className="vista-pro__precio">
          <strong>{dinero(producto.precio)}</strong>
          {producto.precio_anterior && <s>{dinero(producto.precio_anterior)}</s>}
          {ahorro > 0 && <span className="vista-pro__ahorro">Ahorras {dinero(ahorro)}</span>}
        </div>
        {descuento > 0 && !agotado && <p className="vista-pro__reloj">Oferta por tiempo limitado · termina en <b className="vista-pro__horas"><CuentaRegresiva compacta /></b></p>}

        {producto.variantes.length > 1 && (
          <fieldset className="vista-pro__grupo">
            <legend>{etiquetaVariante(producto)}: <b>{variante}</b></legend>
            <div className="vista-rapida__variantes">
              {producto.variantes.map((variante) => (
                <button key={variante.id} type="button" className={`vista-rapida__variante ${variante.id === producto.id ? 'activa' : ''}`} disabled={variante.stock === 0} onClick={() => setActual(variante.id)}>
                  {variante.variante}{variante.stock === 0 && <em> · agotado</em>}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {!agotado && (
          <div className="vista-pro__comprar">
            <div className="vista-pro__cantidad" role="group" aria-label="Cantidad">
              <button type="button" onClick={() => setCantidad((anterior) => Math.max(1, anterior - 1))} disabled={cantidad <= 1} aria-label="Quitar uno">−</button>
              <output aria-live="polite">{cantidad}</output>
              <button type="button" onClick={() => setCantidad((anterior) => Math.min(maximo, anterior + 1))} disabled={cantidad >= maximo} aria-label="Agregar uno">+</button>
            </div>
            <button type="button" className="boton vista-pro__agregar" onClick={() => { carrito.agregar(producto, { cantidad }); cerrar(); }}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" {...trazo}><path d="M3 4h2l2.4 11h10.8L21 7H6.2" /><circle cx="9" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" /></svg>
              Agregar al carrito · {dinero(producto.precio * cantidad)}
            </button>
          </div>
        )}
        {agotado && <button type="button" className="boton vista-pro__agregar" onClick={() => { cerrar(); irA(`/tienda?categoria=${encodeURIComponent(producto.categoria)}`); }}>Ver artículos parecidos</button>}
        <p className={`vista-pro__stock ${producto.stock > 0 && producto.stock < 10 ? 'vista-pro__stock--poco' : ''}`}>
          {agotado ? 'Sin existencias por ahora' : producto.stock < 10 ? `Solo quedan ${producto.stock}` : 'Disponible para retirar'}
          {enCarrito && ` · ya tienes ${enCarrito.cantidad} en el carrito`}
        </p>

        <ul className="vista-pro__confianza">
          <li><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" {...trazo}><path d="M4 10.5 12 4l8 6.5V20H4z" /><path d="M10 20v-5h4v5" /></svg>Retiro gratis en el salón</li>
          <li><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" {...trazo}><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>Producto profesional</li>
          <li><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" {...trazo}><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10.5h18" /></svg>SINPE, tarjeta o efectivo</li>
        </ul>
        <Link to={`/tienda/${producto.id}`} className="vista-pro__detalles" onClick={cerrar}>Ver todos los detalles y opiniones ›</Link>
      </div>
    </div>
  );
}

// Nombre: VistaDiseno
// Descripción: Muestra un diseño en ventana.
// Entrada: El diseño y cómo cerrar.
// Salida: La ventana.
// Objetivo: Reservar rápido.
function VistaDiseno({ id, cerrar }) {
  const [foto, setFoto] = useState(null);
  const { actualizar } = useReserva();
  const agregarPresson = useAgregarPresson();
  const irA = useNavigate();
  useEffect(() => { api.foto(id).then(setFoto).catch(() => cerrar()); }, [id]);
  if (!foto) return <div className="vista-rapida vista-rapida--cargando" role="status"><span className="girando girando--oscuro" /> Cargando…</div>;

  // Nombre: reservar
  // Descripción: Reserva el diseño.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ir a reservar.
  const reservar = () => { actualizar({ fotoRef: foto, diseno: null }); cerrar(); irA(foto.servicio ? `/reservar?servicio=${foto.servicio.id}` : '/reservar'); };
  const precio = foto.precio ?? foto.servicio?.precio;
  return (
    <div className="vista-rapida vista-pro">
      <div className="vista-pro__foto">
        <Foto archivo={foto.archivo} alt={foto.descripcion || foto.titulo} />
        {foto.puesto <= 10 && <span className="vista-pro__pct vista-pro__pct--vino">#{foto.puesto} en {foto.categoria}</span>}
        <BotonFavorito tipo="diseno" datos={foto} nombre={foto.titulo} clase="vista-pro__fav" />
      </div>
      <div className="vista-pro__info">
        <p className="vista-pro__ante">Diseño de la galería · {foto.categoria}</p>
        <h2 className="vista-pro__nombre">{foto.titulo}</h2>
        {foto.descripcion && <p className="vista-pro__desc">{foto.descripcion}</p>}
        <p className="vista-rapida__chips">{[foto.forma, foto.color, foto.acabado].filter(Boolean).map((dato) => <span key={dato}>{dato}</span>)}</p>
        <div className="vista-pro__fila"><span className="tenue">{miles(foto.vistas)} vistas · a {positivo(foto.id)} % le encantó</span></div>
        {precio != null && (
          <div className="vista-pro__precio">
            <strong>{dinero(precio)}</strong>
            {foto.servicio && <span className="tenue">{foto.servicio.nombre} · {foto.servicio.duracion_min} min en el salón</span>}
          </div>
        )}
        <div className="vista-pro__comprar">
          <button type="button" className="boton vista-pro__agregar" onClick={reservar}>Reservar este diseño</button>
        </div>
        {foto.presson && (
          <button type="button" className="boton boton--contorno boton--ancho" onClick={() => { agregarPresson(foto, { presson: foto.presson }); cerrar(); }}>
            Llevarlo en press-on para casa · {dinero(foto.presson.precio)}
          </button>
        )}
        <ul className="vista-pro__confianza">
          <li><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>Eliges día y hora</li>
          <li><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-4 4-6 7-6s6 2 7 6" /></svg>Especialistas certificadas</li>
          <li><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" /></svg>Garantía de 5 días</li>
        </ul>
        <Link to={`/galeria/${foto.id}`} className="vista-pro__detalles" onClick={cerrar}>Ver el diseño en grande ›</Link>
      </div>
    </div>
  );
}

// Nombre: VistaRapidaProvider
// Descripción: Comparte la vista rápida con el sitio.
// Entrada: Las páginas.
// Salida: El proveedor.
// Objetivo: Usarla en todas partes.
export function VistaRapidaProvider({ children }) {
  const [abierto, setAbierto] = useState(null);
  const { pathname } = useLocation();
  useEffect(() => setAbierto(null), [pathname]);
  // Nombre: cerrar
  // Descripción: Cierra la vista rápida.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Volver a la página.
  const cerrar = () => setAbierto(null);
  return (
    <Contexto.Provider value={setAbierto}>
      {children}
      {abierto && (
        <Modal titulo={abierto.tipo === 'producto' ? 'Vista previa del producto' : 'Vista previa del diseño'} onCerrar={cerrar} ancho ocultarTitulo>
          {abierto.tipo === 'producto' ? <VistaProducto id={abierto.id} cerrar={cerrar} /> : <VistaDiseno id={abierto.id} cerrar={cerrar} />}
        </Modal>
      )}
    </Contexto.Provider>
  );
}
