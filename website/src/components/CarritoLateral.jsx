// Panel del carrito que se abre al costado con los productos, el total y el botón para pagar.
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext.jsx';
import { dinero } from '../config.js';
import ProductoImagen from './ProductoImagen.jsx';

// Carrito que se abre a la derecha solo cuando se toca el ícono del carrito (en pantallas anchas).
// En celular y tablet el ícono lleva directo a la página del carrito.
// Nombre: abrirCarritoLateral
// Descripción: Abre o cierra el carrito lateral.
// Entrada: Nada.
// Salida: Nada.
// Objetivo: Ver el carrito desde cualquier lado.
export const abrirCarritoLateral = () => window.dispatchEvent(new Event('carrito:alternar'));
// Nombre: enlaceArticulo
// Descripción: Da el enlace de un artículo del carrito.
// Entrada: El artículo.
// Salida: La dirección.
// Objetivo: Volver a verlo.
export const enlaceArticulo = (item) => (item.tipo === 'cita' ? (item.fotoRefId ? `/galeria/${item.fotoRefId}` : '/servicios') : item.fotoId ? `/galeria/${item.fotoId}` : `/tienda/${item.productoId ?? item.id}`);

// Nombre: CarritoLateral
// Descripción: Muestra el carrito lateral.
// Entrada: Nada.
// Salida: El panel del carrito.
// Objetivo: Revisar la compra.
export default function CarritoLateral() {
  const carrito = useCarrito();
  const { pathname } = useLocation();
  const irA = useNavigate();
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    // Nombre: alternar
    // Descripción: Abre o cierra el carrito.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Mostrar u ocultar.
    const alternar = () => setAbierto((anterior) => !anterior);
    window.addEventListener('carrito:alternar', alternar);
    return () => window.removeEventListener('carrito:alternar', alternar);
  }, []);
  // Se cierra al cambiar de página o con la tecla Esc
  useEffect(() => { setAbierto(false); }, [pathname]);
  useEffect(() => {
    if (!abierto) return undefined;
    // Nombre: tecla
    // Descripción: Cierra el carrito con Escape.
    // Entrada: La tecla.
    // Salida: Nada.
    // Objetivo: Usar con teclado.
    const tecla = (evento) => { if (evento.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [abierto]);

  const visible = abierto && !['/carrito', '/finalizar-compra'].includes(pathname) && !pathname.startsWith('/admin') && !pathname.startsWith('/equipo');
  if (!visible) return null;
  if (!carrito.items.length) {
    return (
      <>
        <div className="carrito-lateral__fondo" onClick={() => setAbierto(false)} aria-hidden="true" />
        <aside className="carrito-lateral carrito-lateral--vacio" aria-label="Carrito">
          <button type="button" className="carrito-lateral__cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar el carrito">×</button>
          <p>Tu carrito está vacío.</p>
          <button type="button" className="carrito-lateral__ir" onClick={() => irA('/tienda')}>Ir a la tienda</button>
        </aside>
      </>
    );
  }
  const pocos = carrito.elegidos.filter((elegido) => elegido.stock > 0 && elegido.stock < 10).length;
  const todos = carrito.items.every((item) => item.seleccionado !== false);

  return (
    <>
      <div className="carrito-lateral__fondo" onClick={() => setAbierto(false)} aria-hidden="true" />
      <aside className="carrito-lateral" aria-labelledby="cl-titulo">
        <button type="button" className="carrito-lateral__cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar el carrito">×</button>
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
          <input type="checkbox" className="marca" checked={todos} onChange={(evento) => carrito.seleccionarTodo(evento.target.checked)} />
          Seleccionar todo ({carrito.items.length})
        </label>
        <ul className="carrito-lateral__lista">
          {carrito.items.map((item) => (
            <li key={item.clave}>
              <div className="carrito-lateral__foto">
                <Link to={enlaceArticulo(item)} tabIndex={-1} aria-hidden="true"><ProductoImagen producto={item} /></Link>
                <input type="checkbox" className="marca carrito-lateral__marca" checked={item.seleccionado !== false}
                       onChange={(evento) => carrito.seleccionar(item.clave, evento.target.checked)} aria-label={`Incluir ${item.nombre} en el pedido`} />
                {item.stock > 0 && item.stock < 10 && <span>Casi agotado</span>}
                {item.stock === 0 && <span>Agotado</span>}
              </div>
              <p className="carrito-lateral__precio">{dinero(item.precio)}</p>
              {item.tipo === 'cita' && <p className="carrito-lateral__cita">{item.fechaTexto}, {item.hora}</p>}
              {item.unico ? (
                <button type="button" className="carrito-lateral__quitar" onClick={() => carrito.quitar(item.clave)}>Quitar</button>
              ) : (
                <>
                  <label className="solo-lector" htmlFor={`cant-${item.clave}`}>Cantidad de {item.nombre}</label>
                  <select id={`cant-${item.clave}`} value={item.cantidad} onChange={(evento) => carrito.fijar(item.clave, evento.target.value)}>
                    <option value="0">Quitar</option>
                    {Array.from({ length: Math.max(10, item.cantidad) }, (_, numero) => <option key={numero + 1} value={numero + 1}>{numero + 1}</option>)}
                  </select>
                </>
              )}
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
