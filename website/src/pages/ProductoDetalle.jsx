import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import ProductoImagen from '../components/ProductoImagen.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import { miles } from '../components/TarjetaDiseno.jsx';

export default function ProductoDetalle() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [error, setError] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const carrito = useCarrito();
  useTitulo(p?.nombre || 'Producto');

  useEffect(() => {
    setP(null); setError(''); setCantidad(1); window.scrollTo(0, 0);
    api.producto(id).then(setP).catch((e) => setError(e.message));
    api.productosRelacionados(id, 15).then(setRelacionados).catch(() => setRelacionados([]));
  }, [id]);

  if (error) return <div className="contenedor pagina"><p role="alert" className="error">{error}</p><Link to="/tienda" className="enlace">Volver a la tienda</Link></div>;
  if (!p) return <div className="contenedor pagina"><p className="tenue" role="status">Cargando producto…</p></div>;

  const descuento = p.precio_anterior ? Math.round((1 - p.precio / p.precio_anterior) * 100) : 0;
  const pocos = p.stock > 0 && p.stock < 10;

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
          <div className="detalle__imagen"><ProductoImagen producto={p} /></div>
          {p.imagen_autor && <p className="tenue detalle__credito">Foto de <a className="enlace" href={p.imagen_autor_url} target="_blank" rel="noreferrer">{p.imagen_autor}</a> en Unsplash</p>}
        </div>

        <div className="detalle__info">
          <div className="franja-promo">
            {descuento > 0 && <b>OFERTA</b>}
            <span>✓ Retiro gratis en el salón</span>
            <span>✓ Pago con SINPE o tarjeta</span>
          </div>
          <h1 className="detalle__titulo">{p.nombre}</h1>
          <p className="detalle__descripcion">{p.descripcion}</p>
          <p className="detalle__datos">
            <span>{miles(p.vendidos)} vendidos</span>
            <span aria-hidden="true">|</span>
            <span>Marca {p.marca}</span>
            {p.calificacion && <span className="detalle__estrellas" aria-label={`${p.calificacion} de 5 estrellas, ${p.resenas} reseñas`}><span aria-hidden="true">{p.calificacion} ★★★★★</span></span>}
          </p>
          {p.puesto <= 20 && <p className="insignia-ranking">🏆 #{p.puesto} MÁS VENDIDO <span>en {p.categoria}</span></p>}

          <div className="detalle__precio">
            <p>
              {p.precio_anterior && <s className="detalle__antes">{dinero(p.precio_anterior)}</s>}
              <span className="detalle__precio-grande">{dinero(p.precio)}</span>
            </p>
            {(descuento > 0 || pocos) && (
              <p className="etiquetas-oferta">
                {descuento > 0 && <span>{descuento} % DE DESCUENTO por tiempo limitado</span>}
                {pocos && <span>CASI AGOTADO: quedan {p.stock}</span>}
              </p>
            )}
          </div>

          <section className="caja-venta" aria-labelledby="t-opciones-p">
            <div className="caja-venta__cabeza">
              <span id="t-opciones-p">GRAN VENTA</span>
              <CuentaRegresiva claro />
            </div>
            <div className="caja-venta__cuerpo">
              {p.variantes.length > 1 && (
                <fieldset className="grupo">
                  <legend className="grupo__titulo grupo__titulo--chico">Tono: <span className="tenue">{p.variantes.find((v) => v.id === p.id)?.variante}</span></legend>
                  <ul className="variantes">
                    {p.variantes.map((v) => (
                      <li key={v.id}>
                        <Link to={`/tienda/${v.id}`} className="variante" aria-current={v.id === p.id ? 'true' : undefined} title={v.variante}>
                          <ProductoImagen producto={v} />
                          <span>{v.variante}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              )}
              <div className="campo campo--linea">
                <label htmlFor="cantidad-p">Cantidad</label>
                <select id="cantidad-p" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} disabled={p.stock === 0}>
                  {Array.from({ length: Math.min(10, Math.max(1, p.stock)) }, (_, n) => <option key={n + 1}>{n + 1}</option>)}
                </select>
              </div>
            </div>
          </section>

          <button type="button" className="boton-gigante" disabled={p.stock === 0} onClick={() => carrito.agregar(p, { cantidad })}>
            {p.stock === 0 ? 'Agotado' : pocos ? '¡Agrégalo ahora! ¡Los últimos!' : '¡Agrégalo al carrito!'}
          </button>
          <ul className="detalle__garantias">
            <li>✓ Productos que usamos en el salón</li>
            <li>✓ Te avisamos por WhatsApp cuando esté listo</li>
            <li>✓ Retiro gratis en el local</li>
          </ul>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="relacionados" aria-labelledby="t-rel-p">
          <h2 id="t-rel-p">También te puede gustar</h2>
          <ul className="productos-rejilla">{relacionados.map((r) => <TarjetaProducto key={r.id} p={r} />)}</ul>
        </section>
      )}
    </div>
  );
}
