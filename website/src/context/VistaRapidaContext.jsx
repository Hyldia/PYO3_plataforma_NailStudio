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

const Contexto = createContext(() => {});
export const useVistaRapida = () => useContext(Contexto);

function VistaProducto({ id, cerrar }) {
  const [p, setP] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [actual, setActual] = useState(id);
  const carrito = useCarrito();
  const irA = useNavigate();
  useEffect(() => { setP(null); api.producto(actual).then(setP).catch(() => cerrar()); }, [actual]);
  if (!p) return <div className="vista-rapida vista-rapida--cargando" role="status"><span className="girando girando--oscuro" /> Cargando…</div>;

  const descuento = p.precio_anterior ? Math.round((1 - p.precio / p.precio_anterior) * 100) : 0;
  const agotado = p.stock === 0;
  const variante = p.variantes.find((v) => v.id === p.id)?.variante;
  const enCarrito = carrito.items.find((i) => i.clave === `${p.id}|`);

  return (
    <div className="vista-rapida">
      <div className="vista-rapida__foto"><ProductoImagen producto={p} />{agotado && <span className="sello-agotado">Agotado</span>}</div>
      <div className="vista-rapida__info">
        <p className="vista-rapida__titulo">{p.nombre}{p.descripcion ? ` · ${p.descripcion.replace(/\.$/, '')}` : ''}</p>
        <p className="franja-promo"><b>Marca {p.marca}</b> Producto profesional · Retiro gratis</p>
        <p className="tenue">{miles(p.vendidos)} ventas{p.calificacion ? ` · ${p.calificacion} ★ (${p.resenas})` : ''}</p>
        {p.puesto <= 20 && <p className="insignia-ranking">#{p.puesto} MÁS VENDIDO <span>en {p.categoria}</span></p>}
        <p className="vista-rapida__precio">
          {p.precio_anterior && <s>{dinero(p.precio_anterior)}</s>}
          <strong>{dinero(p.precio)}</strong>
          {descuento > 0 && <span className="detalle__pct">{descuento} % DE DESCUENTO tiempo limitado</span>}
        </p>
        {!agotado && (
          <section className="caja-venta">
            <div className="caja-venta__cabeza"><span>OFERTA RELÁMPAGO</span><CuentaRegresiva claro /></div>
            <div className="caja-venta__cuerpo">
              {p.variantes.length > 1 && (
                <fieldset className="grupo">
                  <legend className="grupo__titulo grupo__titulo--chico">{etiquetaVariante(p)}: <span className="tenue">{variante}</span></legend>
                  <div className="vista-rapida__variantes">
                    {p.variantes.map((v) => (
                      <button key={v.id} type="button" className={`vista-rapida__variante ${v.id === p.id ? 'activa' : ''}`} disabled={v.stock === 0} onClick={() => setActual(v.id)}>
                        {v.variante}{v.stock > 0 && v.stock < 10 && <em> | CASI AGOTADO</em>}{v.stock === 0 && <em> | AGOTADO</em>}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <div className="campo campo--linea">
                <label htmlFor="vr-cant">Cantidad</label>
                <select id="vr-cant" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}>
                  {Array.from({ length: Math.min(10, p.stock) }, (_, n) => <option key={n + 1}>{n + 1}</option>)}
                </select>
              </div>
            </div>
          </section>
        )}
        {agotado ? (
          <button type="button" className="boton-gigante" onClick={() => { cerrar(); irA(`/tienda?categoria=${encodeURIComponent(p.categoria)}`); }}>Ver artículos similares</button>
        ) : (
          <button type="button" className="boton-gigante boton-gigante--naranja" onClick={() => { carrito.agregar(p, { cantidad }); cerrar(); }}>
            {p.stock < 10 ? '¡AGRÉGALO AHORA! ¡LOS ÚLTIMOS!' : '¡AGRÉGALO AL CARRITO!'}
          </button>
        )}
        {enCarrito && <p className="anadido__ok">✓ Ya tienes {enCarrito.cantidad} en el carrito</p>}
        <Link to={`/tienda/${p.id}`} className="enlace-flecha" onClick={cerrar}>Todos los detalles ›</Link>
      </div>
    </div>
  );
}

function VistaDiseno({ id, cerrar }) {
  const [f, setF] = useState(null);
  const { actualizar } = useReserva();
  const agregarPresson = useAgregarPresson();
  const irA = useNavigate();
  useEffect(() => { api.foto(id).then(setF).catch(() => cerrar()); }, [id]);
  if (!f) return <div className="vista-rapida vista-rapida--cargando" role="status"><span className="girando girando--oscuro" /> Cargando…</div>;

  const reservar = () => { actualizar({ fotoRef: f, diseno: null }); cerrar(); irA(f.servicio ? `/reservar?servicio=${f.servicio.id}` : '/reservar'); };
  return (
    <div className="vista-rapida">
      <div className="vista-rapida__foto"><Foto archivo={f.archivo} alt={f.descripcion || f.titulo} /></div>
      <div className="vista-rapida__info">
        <p className="vista-rapida__titulo">{f.titulo}{f.descripcion ? ` · ${f.descripcion}` : ''}</p>
        <p className="vista-rapida__chips">{[f.categoria, f.forma, f.color, f.acabado].filter(Boolean).map((x) => <span key={x}>{x}</span>)}</p>
        <p className="tenue">{miles(f.vistas)} vistas · {positivo(f.id)} % positivo</p>
        {f.puesto <= 10 && <p className="insignia-ranking">#{f.puesto} MÁS POPULAR <span>en {f.categoria}</span></p>}
        {f.servicio && (
          <p className="vista-rapida__precio"><span className="tenue">En el salón desde</span><strong>{dinero(f.servicio.precio)}</strong><span className="tenue">· {f.servicio.nombre}, {f.servicio.duracion_min} min</span></p>
        )}
        <button type="button" className="boton-gigante" onClick={reservar}>Reservar este diseño</button>
        {f.presson && (
          <button type="button" className="boton boton--contorno boton--ancho" onClick={() => { agregarPresson(f, { presson: f.presson }); cerrar(); }}>
            Llevarlo en press-on · {dinero(f.presson.precio)}
          </button>
        )}
        <p className="tenue">Un diseño por persona. Si vas con alguien, agrégala al reservar.</p>
        <Link to={`/galeria/${f.id}`} className="enlace-flecha" onClick={cerrar}>Todos los detalles ›</Link>
      </div>
    </div>
  );
}

export function VistaRapidaProvider({ children }) {
  const [abierto, setAbierto] = useState(null);
  const { pathname } = useLocation();
  useEffect(() => setAbierto(null), [pathname]);
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
