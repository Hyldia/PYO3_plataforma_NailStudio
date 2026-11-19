import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero, enlaceWhatsApp } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import ProductoImagen from '../components/ProductoImagen.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import Resenas from '../components/Resenas.jsx';
import BotonFavorito from '../components/BotonFavorito.jsx';
import { miles } from '../components/TarjetaDiseno.jsx';
import { fichaProducto, etiquetaVariante } from '../lib/fichaProducto.js';
import Icono from '../components/Icono.jsx';

// Nombre: ProductoDetalle
// Descripción: Muestra la página de un producto.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Ver y comprar el producto.
export default function ProductoDetalle() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [error, setError] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const carrito = useCarrito();
  const irA = useNavigate();
  useTitulo(p?.nombre || 'Producto');

  // Nombre: cargar
  // Descripción: Carga el producto.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrar sus datos.
  const cargar = () => api.producto(id).then(setP).catch((e) => setError(e.message));
  useEffect(() => {
    setP(null); setError(''); setCantidad(1); window.scrollTo(0, 0);
    cargar();
    api.productosRelacionados(id, 15).then(setRelacionados).catch(() => setRelacionados([]));
  }, [id]);

  if (error) return <div className="contenedor pagina"><p role="alert" className="error">{error}</p><Link to="/tienda" className="enlace">Volver a la tienda</Link></div>;
  if (!p) return <div className="contenedor pagina"><p className="tenue" role="status">Cargando producto…</p></div>;

  const descuento = p.precio_anterior ? Math.round((1 - p.precio / p.precio_anterior) * 100) : 0;
  const agotado = p.stock === 0;
  const pocos = p.stock > 0 && p.stock < 10;
  const variante = p.variantes.find((v) => v.id === p.id)?.variante;
  const { detalles, uso } = fichaProducto({ ...p, variante });
  const clave = `${p.id}|`;
  const enCarrito = carrito.items.find((i) => i.clave === clave);
  // Nombre: irAlCarrito
  // Descripción: Va al carrito con el producto marcado.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Pagar rápido.
  const irAlCarrito = () => { carrito.seleccionar(clave, true); irA('/carrito'); };
  // Nombre: verSimilares
  // Descripción: Baja a los productos parecidos.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ver más opciones.
  const verSimilares = () => document.getElementById('t-rel-p')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="contenedor pagina detalle-pagina">
      <nav aria-label="Ruta" className="migas">
        <ol>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/tienda">Tienda</Link></li>
          <li><Link to={`/tienda?categoria=${encodeURIComponent(p.categoria)}`}>{p.categoria}</Link></li>
          <li aria-current="page">{p.nombre}</li>
        </ol>
      </nav>

      <div className="detalle">
        <div className="detalle__galeria">
          <div className={`detalle__imagen ${agotado ? 'detalle__imagen--agotado' : ''}`}>
            <ProductoImagen producto={p} />
            {agotado && <span className="sello-agotado">Agotado</span>}
            <BotonFavorito tipo="producto" nombre={p.nombre} clase="corazon--grande"
                           datos={{ id: p.id, nombre: p.nombre, precio: p.precio, precio_anterior: p.precio_anterior, imagen: p.imagen, color: p.color, tipo_producto: p.tipo, stock: p.stock, calificacion: p.calificacion, resenas: p.resenas, vendidos: p.vendidos, categoria: p.categoria }} />
          </div>
          {p.imagen_autor && <p className="tenue detalle__credito">Foto de <a className="enlace" href={p.imagen_autor_url} target="_blank" rel="noreferrer">{p.imagen_autor}</a> en Unsplash</p>}
        </div>

        <div className="detalle__info">
          <h1 className="detalle__titulo">{p.nombre}{p.descripcion ? ` · ${p.descripcion.replace(/\.$/, '')}` : ''}</h1>
          <p className="detalle__datos">
            <span>{miles(p.vendidos)} ventas</span>
            <span aria-hidden="true">|</span>
            <span>Marca {p.marca}</span>
            {p.calificacion && (
              <a href="#resenas" className="detalle__estrellas" aria-label={`${p.calificacion} de 5 estrellas, ${p.resenas} reseñas`}>
                <span aria-hidden="true">{p.calificacion} ★★★★★ <span className="tenue">({p.resenas})</span></span>
              </a>
            )}
          </p>
          {p.puesto <= 20 && <p className="insignia-ranking"><Icono nombre="trofeo" tam={16} /> #{p.puesto} MÁS VENDIDO <span>en {p.categoria} ›</span></p>}

          <div className="detalle__precio">
            <p>
              {p.precio_anterior && <s className="detalle__antes"><span className="solo-lector">Antes </span>{dinero(p.precio_anterior)}</s>}
              <span className="detalle__precio-grande">{dinero(p.precio)}</span>
              {descuento > 0 && <span className="detalle__pct">{descuento} % DE DESCUENTO</span>}
            </p>
            {descuento > 0 && <p className="detalle__ahorro">Ahorras {dinero(p.precio_anterior - p.precio)} · Precio por tiempo limitado</p>}
          </div>

          <p className="franja-beneficios">
            <span>✓ Retiro gratis en el salón</span>
            <span aria-hidden="true">|</span>
            <span>✓ Pago con SINPE o al retirar</span>
          </p>

          {agotado ? (
            <section className="caja-agotado" aria-labelledby="t-agotado">
              <h2 id="t-agotado">Este artículo está agotado</h2>
              <p>Estamos esperando más unidades. Mientras tanto, mira opciones parecidas o pídenos que te avisemos.</p>
              <div className="caja-agotado__botones">
                <button type="button" className="boton-gigante" onClick={verSimilares}>Ver artículos similares</button>
                <a className="boton boton--contorno" href={enlaceWhatsApp(`Hola, ¿me avisan cuando vuelva a haber ${p.nombre}?`)} target="_blank" rel="noreferrer">Avisarme por WhatsApp</a>
              </div>
            </section>
          ) : (
            <section className="caja-venta" aria-labelledby="t-opciones-p">
              <div className="caja-venta__cabeza">
                <span id="t-opciones-p">GRAN VENTA</span>
                <CuentaRegresiva claro />
              </div>
              <div className="caja-venta__cuerpo">
                {p.variantes.length > 1 && (
                  <fieldset className="grupo">
                    <legend className="grupo__titulo grupo__titulo--chico">{etiquetaVariante(p)}: <span className="tenue">{variante}</span></legend>
                    <ul className="variantes">
                      {p.variantes.map((v) => (
                        <li key={v.id}>
                          <Link to={`/tienda/${v.id}`} className={`variante ${v.stock === 0 ? 'variante--agotada' : ''}`} aria-current={v.id === p.id ? 'true' : undefined}
                                title={v.stock === 0 ? `${v.variante} (agotado)` : v.variante}>
                            <ProductoImagen producto={v} />
                            <span>{v.variante}</span>
                            {v.stock === 0 && <em>Agotado</em>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                )}
                {pocos && <p className="aviso-pocos"><Icono nombre="fuego" tam={17} /> ¡Solo quedan {p.stock}! Muchas clientas lo tienen en el carrito.</p>}
                {enCarrito ? (
                  <div className="anadido" role="status">
                    <ProductoImagen producto={p} />
                    <div className="anadido__info">
                      <p className="anadido__ok">✓ Añadido{variante ? `: ${variante}` : ''}</p>
                      <label className="linea-carrito__cant">
                        <span>Cant.</span>
                        <select value={enCarrito.cantidad} onChange={(e) => carrito.fijar(clave, e.target.value)} aria-label="Cantidad en el carrito">
                          <option value="0">Quitar</option>
                          {Array.from({ length: Math.max(Math.min(10, p.stock), enCarrito.cantidad) }, (_, n) => <option key={n + 1} value={n + 1}>{n + 1}</option>)}
                        </select>
                      </label>
                    </div>
                    <button type="button" className="boton-naranja" onClick={irAlCarrito}>Ir al carrito</button>
                  </div>
                ) : (
                  <div className="campo campo--linea">
                    <label htmlFor="cantidad-p">Cantidad</label>
                    <select id="cantidad-p" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}>
                      {Array.from({ length: Math.min(10, Math.max(1, p.stock)) }, (_, n) => <option key={n + 1}>{n + 1}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </section>
          )}

          {!agotado && (enCarrito ? (
            <div className="fila-anadido">
              <div className="paso-cantidad">
                <button type="button" onClick={() => carrito.cambiar(clave, -1)} aria-label="Quitar uno">−</button>
                <span><strong>{enCarrito.cantidad} Añadido</strong><small>{dinero(enCarrito.cantidad * p.precio)}</small></span>
                <button type="button" onClick={() => carrito.cambiar(clave, 1)} disabled={enCarrito.cantidad >= p.stock} aria-label="Agregar uno">+</button>
              </div>
              <button type="button" className="boton-gigante" onClick={irAlCarrito}>Ir al carrito y seleccionar</button>
            </div>
          ) : (
            <button type="button" className="boton-gigante" onClick={() => carrito.agregar(p, { cantidad })}>
              {pocos ? '¡Agrégalo ahora! ¡Los últimos!' : '¡Agrégalo al carrito!'}
            </button>
          ))}

          <ul className="garantias">
            <li><span className="icono-caja"><Icono nombre="bolsa" tam={22} /></span><div><strong>Retiro gratis en el salón ›</strong><p className="tenue">Te escribimos por WhatsApp cuando tu pedido esté listo.</p></div></li>
            <li><span className="icono-caja"><Icono nombre="candado" tam={22} /></span><div><strong>Pago seguro · Privacidad segura ›</strong><p className="tenue">SINPE Móvil o pago al retirar. No guardamos datos de tarjetas.</p></div></li>
            <li><span className="icono-caja"><Icono nombre="pincel" tam={22} /></span><div><strong>Productos que usamos en el salón ›</strong><p className="tenue">Las especialistas te explican cómo usarlo cuando lo retiras.</p></div></li>
          </ul>
        </div>
      </div>

      <div className="ficha">
        <section aria-labelledby="t-ficha">
          <h2 id="t-ficha">Detalles del artículo</h2>
          <dl className="ficha__tabla">
            {detalles.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <p className="ficha__descripcion">{p.descripcion}</p>
        </section>
        <section aria-labelledby="t-uso">
          <h2 id="t-uso">Cómo se usa</h2>
          <ol className="ficha__pasos">{uso.map((u) => <li key={u}>{u}</li>)}</ol>
        </section>
      </div>

      <Resenas productoId={p.id} nombreProducto={p.nombre} onCambio={cargar} />

      {relacionados.length > 0 && (
        <section className="relacionados" aria-labelledby="t-rel-p">
          <h2 id="t-rel-p">{agotado ? 'Artículos similares disponibles' : 'También te puede gustar'}</h2>
          <ul className="productos-rejilla">{relacionados.map((r) => <TarjetaProducto key={r.id} p={r} />)}</ul>
        </section>
      )}
    </div>
  );
}
