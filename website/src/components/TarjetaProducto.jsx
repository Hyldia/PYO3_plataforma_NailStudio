import { Link } from 'react-router-dom';
import { useVistaRapida } from '../context/VistaRapidaContext.jsx';
import { dinero } from '../config.js';
import ProductoImagen from './ProductoImagen.jsx';
import BotonFavorito from './BotonFavorito.jsx';

const miles = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('es-CR', { maximumFractionDigits: 1 })} mil` : String(n));

function Estrellas({ valor, resenas }) {
  const llenas = Math.round(valor);
  return (
    <p className="estrellas" aria-label={`${valor} de 5 estrellas, ${resenas} reseñas`}>
      <span aria-hidden="true">{'★'.repeat(llenas)}<span className="estrellas__vacias">{'★'.repeat(5 - llenas)}</span></span>
      <span className="estrellas__cuenta" aria-hidden="true">{resenas}</span>
    </p>
  );
}

// Tarjeta de producto al estilo de las tiendas en línea: foto, descuento, precio, estrellas y vendidos
export default function TarjetaProducto({ p, puesto, oferta = false }) {
  const vistaRapida = useVistaRapida();
  const descuento = p.precio_anterior ? Math.round((1 - p.precio / p.precio_anterior) * 100) : 0;
  const pocos = p.stock > 0 && p.stock < 10;
  // Como en las tiendas grandes: el carrito abre la vista previa para elegir tono y cantidad
  const agregar = () => vistaRapida({ tipo: 'producto', id: p.id });

  return (
    <li className={`tarjeta-producto ${p.stock === 0 ? 'tarjeta-producto--agotado' : ''} ${puesto ? 'tarjeta-producto--ranking' : ''} ${oferta && descuento ? 'tarjeta-producto--oferta' : ''}`}>
      <Link to={`/tienda/${p.id}`} className="tarjeta-producto__foto">
        <ProductoImagen producto={p} />
        {descuento > 0 && <span className="tarjeta-producto__descuento">-{descuento}{' '}%</span>}
        {pocos && <span className="tarjeta-producto__pocos">Solo quedan {p.stock}</span>}
        {p.stock === 0 && <span className="sello-agotado">Agotado</span>}
        {puesto && <span className={`medalla medalla--${puesto <= 3 ? ['oro', 'plata', 'bronce'][puesto - 1] : 'top'}`}><small>TOP</small>{puesto}</span>}
      </Link>
      <BotonFavorito tipo="producto" nombre={p.nombre}
                     datos={{ id: p.id, nombre: p.nombre, precio: p.precio, precio_anterior: p.precio_anterior, imagen: p.imagen, color: p.color, tipo_producto: p.tipo, stock: p.stock, calificacion: p.calificacion, resenas: p.resenas, vendidos: p.vendidos, categoria: p.categoria }} />
      <button type="button" className="boton-vista" onClick={agregar}>Vista previa<span className="solo-lector"> de {p.nombre}</span></button>
      <div className="tarjeta-producto__cuerpo">
        <h3 className="tarjeta-producto__nombre"><Link to={`/tienda/${p.id}`}>{p.nombre}</Link></h3>
        <p className="tarjeta-producto__precios">
          <span className="tarjeta-producto__precio">{dinero(p.precio)}</span>
          {p.precio_anterior && <s className="tarjeta-producto__antes"><span className="solo-lector">Antes </span>{dinero(p.precio_anterior)}</s>}
        </p>
        {puesto ? <p className="tarjeta-producto__nota tarjeta-producto__nota--fuego"><svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 5 5.5 5 10.5A5 5 0 0 1 7 13c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z" /></svg> {miles(p.vendidos)} vendidos</p>
          : descuento > 0 ? <p className="tarjeta-producto__nota">-{descuento}{' '}% por tiempo limitado</p>
          : p.vendidos > 0 && <p className="tarjeta-producto__nota tarjeta-producto__nota--gris">{miles(p.vendidos)} vendidos</p>}
        {p.imagen_autor && <p className="tarjeta-producto__credito">Foto: <a href={p.imagen_autor_url} target="_blank" rel="noreferrer">{p.imagen_autor}</a> / Unsplash</p>}
        <div className="tarjeta-producto__pie">
          {p.calificacion ? <Estrellas valor={p.calificacion} resenas={p.resenas} /> : <span className="tenue">Sin reseñas aún</span>}
          <button type="button" className="tarjeta-producto__agregar" onClick={agregar}
                  aria-label={p.stock === 0 ? `${p.nombre} agotado` : `Agregar ${p.nombre} al carrito`}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><path d="M14 2v6M11 5h6" /></svg>
          </button>
        </div>
      </div>
    </li>
  );
}
