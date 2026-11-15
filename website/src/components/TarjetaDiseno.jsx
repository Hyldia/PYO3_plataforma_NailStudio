import { Link } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext.jsx';
import { dinero } from '../config.js';
import Foto from './Foto.jsx';
import CuentaRegresiva from './CuentaRegresiva.jsx';

export const miles = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('es-CR', { maximumFractionDigits: 1 })} mil` : String(n));
// Porcentaje de opiniones positivas de ejemplo, siempre el mismo para cada foto
export const positivo = (id) => 90 + ((id * 7) % 10);

// Agrega el diseño como press-on al carrito (forma de la foto y largo medio)
export function useAgregarPresson() {
  const carrito = useCarrito();
  return (foto, { forma, largo = 'Medio', cantidad = 1, presson } = {}) => {
    const p = presson || { id: foto.presson_id, precio: foto.precio_presson, precio_anterior: foto.presson_anterior };
    if (!p?.id) return false;
    const f = forma || foto.forma || 'Almendra';
    carrito.agregar(
      { id: p.id, nombre: `Press-on «${foto.titulo}»`, precio: p.precio, precio_anterior: p.precio_anterior, stock: p.stock ?? 20, tipo: 'tips', color: '#E9A3BC' },
      { detalle: `Diseño #${foto.id}, ${f}, largo ${largo.toLowerCase()}`, imagen: foto.archivo, cantidad, fotoId: foto.id }
    );
    return true;
  };
}

// Tarjeta de diseño al estilo de resultados de una tienda en línea
export default function TarjetaDiseno({ foto, indice = 0, presson }) {
  const agregarPresson = useAgregarPresson();
  const popular = foto.puesto && foto.puesto <= 3 && foto.vistas > 0;
  return (
    <li className="tarjeta-diseno">
      <Link to={`/galeria/${foto.id}`} className="tarjeta-diseno__foto">
        <Foto archivo={foto.archivo} alt={foto.descripcion || foto.titulo} />
        {foto.destacada ? <span className="tarjeta-diseno__marca">Destacado</span> : null}
      </Link>
      <div className="tarjeta-diseno__cuerpo">
        <Link to={`/galeria/${foto.id}`} className="tarjeta-diseno__titulo">{foto.titulo}</Link>
        <div className="tarjeta-diseno__fila">
          <p className="tarjeta-diseno__precio">
            <small>Desde</small> {dinero(foto.precio_salon ?? foto.precio_presson)}
            <span className="tarjeta-diseno__vistas">{miles(foto.vistas)} vistas</span>
          </p>
          {presson && (
            <button type="button" className="tarjeta-producto__agregar" onClick={() => agregarPresson({ ...foto, presson_id: presson.id, precio_presson: presson.precio, presson_anterior: presson.precio_anterior })}
                    aria-label={`Agregar «${foto.titulo}» en press-on al carrito`} title="Agregar en press-on">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><path d="M14 2v6M11 5h6" /></svg>
            </button>
          )}
        </div>
        {popular ? (
          <p className="tarjeta-diseno__ranking"><b>#{foto.puesto} MÁS POPULAR</b> en {foto.categoria}</p>
        ) : indice % 3 === 1 ? (
          <p className="tarjeta-diseno__cupon"><span>⚡ 15 % con BIENVENIDA15</span><CuentaRegresiva compacta /></p>
        ) : (
          <p className="tarjeta-diseno__ranking tarjeta-diseno__ranking--gris">{[foto.forma, foto.acabado].filter(Boolean).join(' · ') || foto.categoria}</p>
        )}
        <p className="estrellas" aria-label={`${positivo(foto.id)} % de opiniones positivas`}>
          <span aria-hidden="true">★★★★★</span><span className="estrellas__cuenta" aria-hidden="true">{positivo(foto.id)} % positivo</span>
        </p>
      </div>
    </li>
  );
}
