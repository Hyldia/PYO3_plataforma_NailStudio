// Portadas animadas de la tienda: un podio para "Más vendidos" y una franja relámpago para "Ofertas"
import { Link } from 'react-router-dom';
import { dinero } from '../config.js';
import ProductoImagen from './ProductoImagen.jsx';
import CuentaRegresiva from './CuentaRegresiva.jsx';
import Contador from './Contador.jsx';

const Rayo = ({ tam = 22 }) => <svg aria-hidden="true" width={tam} height={tam} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>;
const Corona = () => <svg aria-hidden="true" width="38" height="28" viewBox="0 0 38 28"><path d="M3 24 1 6l10 8 8-13 8 13 10-8-2 18z" fill="#E8B04B" stroke="#B7832A" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="19" cy="17" r="3" fill="#C2185B" /></svg>;

export function PodioVendidos({ productos, categoria }) {
  const top = productos.slice(0, 3);
  if (top.length < 3) return null;
  const orden = [top[1], top[0], top[2]];
  const total = productos.slice(0, 20).reduce((s, p) => s + (p.vendidos || 0), 0);
  return (
    <section className="podio" aria-labelledby="t-podio">
      <span className="podio__chispas" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>
      <div className="podio__texto">
        <p className="podio__ante"><Rayo tam={16} /> Ranking en vivo</p>
        <h2 id="t-podio">Lo más vendido {categoria ? `en ${categoria}` : 'de AH Nails'}</h2>
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

export function BannerOfertas({ productos }) {
  const conDescuento = productos.filter((p) => p.precio_anterior);
  if (!conDescuento.length) return null;
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
        <p className="relampago__hasta"><small>hasta</small><strong>-{maximo}<span>%</span></strong></p>
        <div className="relampago__reloj"><CuentaRegresiva claro /></div>
      </div>
      <div className="relampago__cinta" aria-hidden="true">
        <ul>
          {[...cinta, ...cinta].map((p, i) => (
            <li key={`${p.id}-${i}`}>
              <span className="relampago__mini"><ProductoImagen producto={p} /></span>
              <span><b>-{pct(p)} %</b>{dinero(p.precio)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relampago__barra" aria-hidden="true"><span style={{ width: '78%' }} /><em>78 % vendido · ¡se acaban!</em></div>
    </section>
  );
}
