import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext.jsx';
import { dinero } from '../config.js';
import ProductoImagen from './ProductoImagen.jsx';

// Carrito fijo a la derecha en pantallas anchas (como en las tiendas en línea grandes).
// En celular y tablet se llega al carrito desde el ícono del encabezado.
export const enlaceArticulo = (i) => (i.tipo === 'cita' ? (i.fotoRefId ? `/galeria/${i.fotoRefId}` : '/servicios') : i.fotoId ? `/galeria/${i.fotoId}` : `/tienda/${i.productoId ?? i.id}`);

export default function CarritoLateral() {
  const carrito = useCarrito();
  const { pathname } = useLocation();
  const irA = useNavigate();
  // En la página del carrito no hace falta repetirlo al lado
  const visible = carrito.items.length > 0 && !['/carrito', '/finalizar-compra'].includes(pathname);

  useEffect(() => {
    document.body.classList.toggle('con-carrito-lateral', visible);
    return () => document.body.classList.remove('con-carrito-lateral');
  }, [visible]);

  if (!visible) return null;
  const pocos = carrito.elegidos.filter((i) => i.stock > 0 && i.stock < 10).length;
  const todos = carrito.items.every((i) => i.seleccionado !== false);

  return (
    <aside className="carrito-lateral" aria-labelledby="cl-titulo">
      <Link to="/carrito" className="carrito-lateral__cabeza">
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><circle cx="10" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></svg>
        <h2 id="cl-titulo">Subtotal</h2>
        <span className="carrito-lateral__cuenta">{carrito.cantidad}</span>
      </Link>
      <p className="carrito-lateral__total">{dinero(carrito.totalElegido)}</p>
      <p className="carrito-lateral__envio">✓ Retiro gratis en el salón</p>
      <button type="button" className="carrito-lateral__pedido" onClick={() => irA('/finalizar-compra')} disabled={!carrito.cantidadElegida}>
        {pocos > 0 && <strong>{pocos} casi {pocos === 1 ? 'agotado' : 'agotados'}</strong>}
        <span>Hacer pedido ({carrito.cantidadElegida})</span>
      </button>
      <button type="button" className="carrito-lateral__ir" onClick={() => irA('/carrito')}>Ir al carrito</button>
      <label className="carrito-lateral__todos">
        <input type="checkbox" className="marca" checked={todos} onChange={(e) => carrito.seleccionarTodo(e.target.checked)} />
        Seleccionar todo ({carrito.items.length})
      </label>
      <ul className="carrito-lateral__lista">
        {carrito.items.map((i) => (
          <li key={i.clave}>
            <div className="carrito-lateral__foto">
              <Link to={enlaceArticulo(i)} tabIndex={-1} aria-hidden="true"><ProductoImagen producto={i} /></Link>
              <input type="checkbox" className="marca carrito-lateral__marca" checked={i.seleccionado !== false}
                     onChange={(e) => carrito.seleccionar(i.clave, e.target.checked)} aria-label={`Incluir ${i.nombre} en el pedido`} />
              {i.stock > 0 && i.stock < 10 && <span>Casi agotado</span>}
              {i.stock === 0 && <span>Agotado</span>}
            </div>
            <p className="carrito-lateral__precio">{dinero(i.precio)}</p>
            {i.tipo === 'cita' && <p className="carrito-lateral__cita">{i.fechaTexto}, {i.hora}</p>}
            {i.unico ? (
              <button type="button" className="carrito-lateral__quitar" onClick={() => carrito.quitar(i.clave)}>Quitar</button>
            ) : (
              <>
                <label className="solo-lector" htmlFor={`cant-${i.clave}`}>Cantidad de {i.nombre}</label>
                <select id={`cant-${i.clave}`} value={i.cantidad} onChange={(e) => carrito.fijar(i.clave, e.target.value)}>
                  <option value="0">Quitar</option>
                  {Array.from({ length: Math.max(10, i.cantidad) }, (_, n) => <option key={n + 1} value={n + 1}>{n + 1}</option>)}
                </select>
              </>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
