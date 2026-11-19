import { Link, useNavigate } from 'react-router-dom';
import { useReserva } from '../context/ReservaContext.jsx';
import { useVistaRapida } from '../context/VistaRapidaContext.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import { dinero } from '../config.js';
import Foto from './Foto.jsx';
import CuentaRegresiva from './CuentaRegresiva.jsx';
import BotonFavorito from './BotonFavorito.jsx';
import { useResumenes } from '../lib/resumenesOpiniones.js';

export const miles = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('es-CR', { maximumFractionDigits: 1 })} mil` : String(n));
// Porcentaje de opiniones positivas de ejemplo, siempre el mismo para cada foto
export const positivo = (id) => 90 + ((id * 7) % 10);

// Agrega el diseño como press-on al carrito (forma de la foto y largo medio)
export function useAgregarPresson() {
  const carrito = useCarrito();
  return (foto, { forma, largo = 'Medio', presson } = {}) => {
    const p = presson || { id: foto.presson_id, precio: foto.precio_presson, precio_anterior: foto.presson_anterior };
    if (!p?.id) return false;
    const f = forma || foto.forma || 'Almendra';
    carrito.agregar(
      { id: p.id, nombre: `Press-on «${foto.titulo}»`, precio: p.precio, precio_anterior: p.precio_anterior, stock: p.stock ?? 20, tipo: 'tips', color: '#E9A3BC' },
      { detalle: `Diseño #${foto.id}, ${f}, largo ${largo.toLowerCase()}`, imagen: foto.archivo, cantidad: 1, fotoId: foto.id, unico: true }
    );
    return true;
  };
}

// Tarjeta de diseño al estilo de resultados de una tienda en línea.
// "Reservar" lleva a la reserva con este diseño (un diseño por persona).
export default function TarjetaDiseno({ foto, indice = 0 }) {
  const { actualizar } = useReserva();
  const irA = useNavigate();
  const vistaRapida = useVistaRapida();
  const popular = foto.puesto && foto.puesto <= 3 && foto.vistas > 0;
  const reservar = () => { actualizar({ fotoRef: foto, diseno: null }); irA(foto.servicio_id ? `/reservar?servicio=${foto.servicio_id}` : '/reservar'); };
  const datos = [foto.forma, foto.color, foto.acabado].filter(Boolean);
  const opinion = useResumenes('foto').get(foto.id);
  const llenas = Math.round(opinion?.promedio || 5);
  return (
    <li className="tarjeta-diseno">
      <Link to={`/galeria/${foto.id}`} className="tarjeta-diseno__foto">
        <Foto archivo={foto.archivo} alt={foto.descripcion || foto.titulo} />
        {foto.destacada ? <span className="tarjeta-diseno__marca">Destacado</span> : null}
        <span className="tarjeta-diseno__cat">{foto.categoria}</span>
      </Link>
      <BotonFavorito tipo="diseno" nombre={foto.titulo}
                     datos={{ id: foto.id, titulo: foto.titulo, archivo: foto.archivo, descripcion: foto.descripcion, categoria: foto.categoria, forma: foto.forma, color: foto.color, acabado: foto.acabado, vistas: foto.vistas, precio_salon: foto.precio_salon ?? foto.servicio?.precio, precio_presson: foto.precio_presson, servicio_id: foto.servicio_id ?? foto.servicio?.id, presson_id: foto.presson_id }} />
      <button type="button" className="boton-vista" onClick={() => vistaRapida({ tipo: 'diseno', id: foto.id })}>Vista previa<span className="solo-lector"> de {foto.titulo}</span></button>
      <div className="tarjeta-diseno__cuerpo">
        <Link to={`/galeria/${foto.id}`} className="tarjeta-diseno__titulo">{foto.titulo}</Link>
        {datos.length > 0 && <p className="tarjeta-diseno__datos">{datos.map((d) => <span key={d}>{d}</span>)}</p>}
        <p className="tarjeta-diseno__precio">
          {(foto.precio_salon ?? foto.precio_presson) != null && <><small>Desde</small> {dinero(foto.precio_salon ?? foto.precio_presson)}</>}
          {foto.vistas != null && <span className="tarjeta-diseno__vistas">{miles(foto.vistas)} vistas</span>}
        </p>
        {popular ? (
          <p className="tarjeta-diseno__ranking"><b>#{foto.puesto} MÁS POPULAR</b> en {foto.categoria}</p>
        ) : indice % 3 === 1 ? (
          <p className="tarjeta-diseno__cupon"><span>15 % con BIENVENIDA15</span><CuentaRegresiva compacta /></p>
        ) : (
          <p className="tarjeta-diseno__ranking tarjeta-diseno__ranking--gris">En el salón o en press-on</p>
        )}
        {opinion ? (
          <p className="estrellas" aria-label={`${opinion.promedio} de 5 estrellas, ${opinion.total} opiniones`}>
            <span aria-hidden="true">{'★'.repeat(llenas)}<span className="estrellas__vacias">{'★'.repeat(5 - llenas)}</span></span>
            <span className="estrellas__cuenta" aria-hidden="true">{opinion.promedio} ({opinion.total})</span>
          </p>
        ) : (
          <p className="estrellas" aria-label={`${positivo(foto.id)} % de opiniones positivas`}>
            <span aria-hidden="true">★★★★★</span><span className="estrellas__cuenta" aria-hidden="true">{positivo(foto.id)} % positivo</span>
          </p>
        )}
        <button type="button" className="tarjeta-diseno__reservar" onClick={reservar}>Reservar este diseño</button>
      </div>
    </li>
  );
}
