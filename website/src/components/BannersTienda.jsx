// Portadas animadas de la tienda: un podio para "Más vendidos" y una franja relámpago para "Ofertas"
import { Link } from 'react-router-dom';
import { dinero } from '../config.js';
import ProductoImagen from './ProductoImagen.jsx';
import CuentaRegresiva from './CuentaRegresiva.jsx';
import Contador from './Contador.jsx';
import Decoracion from './Decoracion.jsx';

// Nombre: Rayo
// Descripción: Dibuja un rayo.
// Entrada: El tamaño.
// Salida: El dibujo.
// Objetivo: Decorar ofertas.
const Rayo = ({ tam = 22 }) => <svg aria-hidden="true" width={tam} height={tam} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>;
// Nombre: Corona
// Descripción: Dibuja una corona.
// Entrada: Nada.
// Salida: El dibujo.
// Objetivo: Decorar el primer lugar.
const Corona = () => <svg aria-hidden="true" width="38" height="28" viewBox="0 0 38 28"><path d="M3 24 1 6l10 8 8-13 8 13 10-8-2 18z" fill="#E8B04B" stroke="#B7832A" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="19" cy="17" r="3" fill="#C2185B" /></svg>;

// Nombre: PodioVendidos
// Descripción: Muestra el podio de los más vendidos.
// Entrada: Productos y categoría.
// Salida: El podio.
// Objetivo: Destacar lo más vendido.
export function PodioVendidos({ productos, categoria }) {
  const top = productos.slice(0, 3);
  if (top.length < 3) return null;
  const orden = [top[1], top[0], top[2]];
  const total = productos.slice(0, 20).reduce((s, p) => s + (p.vendidos || 0), 0);
  return (
    <section className="podio" aria-labelledby="t-podio">
      <span className="podio__chispas" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i, '--y': `${10 + ((i * 37) % 70)}%` }} />)}</span>
      <div className="podio__texto">
        <p className="podio__ante"><Rayo tam={16} /> Ranking en vivo</p>
        <h2 id="t-podio"><Link to={`/tienda/${top[0].id}`} className="enlace-titulo">Lo más vendido {categoria ? `en ${categoria}` : 'de AH Nails'}</Link></h2>
        <p>Lo que más compran nuestras clientas, actualizado con cada pedido.</p>
        <p className="podio__total"><strong><Contador valor={total} formato={(n) => n.toLocaleString('es-CR')} /></strong> unidades vendidas del top 20</p>
      </div>
      <ol className="podio__escalones">
        {orden.map((p) => {
          const puesto = top.indexOf(p) + 1;
          return (
            <li key={p.id} className={`podio__lugar podio__lugar--${puesto}`}>
              <Link to={`/tienda/${p.id}`} className="podio__producto">
                {puesto === 1 && <span className="podio__corona"><Corona /></span>}
                <span className="podio__foto"><ProductoImagen producto={p} /></span>
                <span className="podio__nombre">{p.nombre}</span>
                <span className="podio__precio">{dinero(p.precio)}</span>
              </Link>
              <span className="podio__bloque" aria-hidden="true"><b>{puesto}</b><small>{p.vendidos.toLocaleString('es-CR')} vendidos</small></span>
              <span className="solo-lector">Puesto {puesto}, {p.vendidos} vendidos</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// Nombre: BannerOfertas
// Descripción: Muestra la franja de ofertas relámpago.
// Entrada: Los productos.
// Salida: La franja.
// Objetivo: Destacar las ofertas.
export function BannerOfertas({ productos }) {
  const conDescuento = productos.filter((p) => p.precio_anterior);
  if (!conDescuento.length) return null;
  // Nombre: pct
  // Descripción: Calcula el porcentaje de descuento.
  // Entrada: El producto.
  // Salida: El porcentaje.
  // Objetivo: Mostrar cuánto ahorra.
  const pct = (p) => Math.round((1 - p.precio / p.precio_anterior) * 100);
  const maximo = Math.max(...conDescuento.map(pct));
  const cinta = conDescuento.slice(0, 12);
  return (
    <section className="relampago" aria-labelledby="t-relampago">
      <div className="relampago__fila">
        <div className="relampago__titulo">
          <span className="relampago__rayo"><Rayo tam={40} /></span>
          <div>
            <h2 id="t-relampago">Ofertas relámpago</h2>
            <p>{conDescuento.length} productos rebajados · solo por hoy</p>
          </div>
        </div>
        <Link to={`/tienda/${conDescuento.find((p) => pct(p) === maximo).id}`} className="relampago__hasta" aria-label={`Ver el producto con ${maximo} % de descuento`}><small>hasta</small><strong>-{maximo}<span>%</span></strong></Link>
        <div className="relampago__reloj"><CuentaRegresiva claro /></div>
      </div>
      <div className="relampago__cinta">
        <ul aria-label="Productos en oferta">
          {[...cinta, ...cinta].map((p, i) => (
            <li key={`${p.id}-${i}`} aria-hidden={i >= cinta.length || undefined}>
              <Link to={`/tienda/${p.id}`} tabIndex={i >= cinta.length ? -1 : undefined}>
                <span className="relampago__mini"><ProductoImagen producto={p} /></span>
                <span><b>-{pct(p)} %</b>{dinero(p.precio)}</span>
                <span className="solo-lector">{p.nombre}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="relampago__barra" aria-hidden="true"><span style={{ width: '78%' }} /><em>78 % vendido · ¡se acaban!</em></div>
    </section>
  );
}

// Portada para una categoría (o la tienda filtrada): texto con datos y botones a la izquierda
// y 4 productos que flotan a la derecha, con adornos.
// Nombre: PortadaCategoria
// Descripción: Muestra la portada de una categoría.
// Entrada: El nombre y sus productos.
// Salida: La portada.
// Objetivo: Presentar la categoría.
export function PortadaCategoria({ titulo, productos }) {
  const muestra = [...productos].sort((a, b) => Boolean(b.imagen) - Boolean(a.imagen)).slice(0, 4);
  const enOferta = productos.filter((p) => p.precio_anterior).length;
  const desde = productos.length ? Math.min(...productos.map((p) => p.precio)) : 0;
  const vendidos = productos.reduce((s, p) => s + (p.vendidos || 0), 0);
  const base = `/tienda?categoria=${encodeURIComponent(titulo)}`;
  return (
    <section className="vitrina vitrina--categoria" aria-labelledby="t-portada-cat">
      <Decoracion />
      <span className="vitrina__burbujas" aria-hidden="true">{Array.from({ length: 8 }, (_, n) => <i key={n} style={{ '--n': n }} />)}</span>
      <div className="vitrina__texto">
        <p className="vitrina__ante">Tienda AH Nails · categoría</p>
        <h2 id="t-portada-cat" className="portada-cat__titulo">{titulo}</h2>
        <p>Productos profesionales, los mismos que usamos en el salón. Se retiran gratis.</p>
        <ul className="portada-cat__datos">
          <li><strong><Contador valor={productos.length} /></strong> productos</li>
          {desde > 0 && <li>desde <strong>{dinero(desde)}</strong></li>}
          {enOferta > 0 && <li><strong><Contador valor={enOferta} /></strong> en oferta</li>}
          {vendidos > 0 && <li><strong><Contador valor={vendidos} formato={(n) => n.toLocaleString('es-CR')} /></strong> vendidos</li>}
        </ul>
        <div className="portada-cat__botones">
          {enOferta > 0 && <Link to={`${base}&ofertas=1&orden=descuento`} className="vitrina__boton"><Rayo tam={16} /> Ver ofertas</Link>}
          <Link to={`${base}&orden=vendidos`} className="portada-cat__secundario">Lo más vendido</Link>
        </div>
      </div>
      <ul className="vitrina__productos portada-cat__productos">
        {muestra.map((p, n) => (
          <li key={p.id} style={{ '--n': n }}>
            <Link to={`/tienda/${p.id}`} className="vitrina__producto">
              <ProductoImagen producto={p} />
              {p.precio_anterior && <span className="vitrina__pct">-{Math.round((1 - p.precio / p.precio_anterior) * 100)}%</span>}
              <span className="vitrina__precio">{dinero(p.precio)}</span>
              <span className="portada-cat__nombre">{p.nombre}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
