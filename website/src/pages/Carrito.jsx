import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import ProductoImagen from '../components/ProductoImagen.jsx';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import { enlaceArticulo } from '../components/CarritoLateral.jsx';

// Página del carrito: lista con casillas para elegir qué pedir y resumen a la derecha
export default function Carrito() {
  useTitulo('Carrito');
  const carrito = useCarrito();
  const irA = useNavigate();
  const [vista, setVista] = useState('todos');
  const [sugeridos, setSugeridos] = useState([]);

  // Al entrar, pedir el stock y precio actuales de lo que hay en el carrito
  useEffect(() => {
    const ids = [...new Set(carrito.items.map((i) => i.productoId ?? i.id))];
    if (ids.length) api.productosPorIds(ids).then(carrito.refrescar).catch(() => {});
  }, []);

  useEffect(() => {
    api.productos({ orden: 'vendidos', limite: 20 }).then((r) => setSugeridos(r.productos || r)).catch(() => setSugeridos([]));
  }, []);

  const { elegidos } = carrito;
  const items = carrito.items.filter((i) => i.stock !== 0);
  const agotados = carrito.items.filter((i) => i.stock === 0);
  const todos = items.length > 0 && items.every((i) => i.seleccionado !== false);
  const lista = vista === 'elegidos' ? elegidos : items;
  const ahorro = carrito.totalSinDescuento - carrito.totalElegido;
  const pocos = elegidos.filter((i) => i.stock > 0 && i.stock < 10).length;
  const enCarrito = new Set(items.map((i) => i.productoId ?? i.id));

  return (
    <div className="contenedor pagina carrito-pagina">
      <nav aria-label="Ruta" className="migas">
        <ol><li><Link to="/">Inicio</Link></li><li aria-current="page">Carrito</li></ol>
      </nav>

      {carrito.items.length === 0 ? (
        <section className="carrito-vacio">
          <svg aria-hidden="true" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><circle cx="10" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></svg>
          <h1>Tu carrito está vacío</h1>
          <p className="tenue">Agrega productos de la tienda o un diseño en press-on desde la galería.</p>
          <div className="carrito-vacio__acciones">
            <Link to="/tienda" className="boton">Ir a la tienda</Link>
            <Link to="/galeria" className="boton boton--contorno">Ver diseños</Link>
          </div>
        </section>
      ) : (
        <div className="carrito-pagina__grid">
          <section aria-labelledby="cp-titulo" className="carrito-pagina__lista">
            <h1 id="cp-titulo" className="solo-lector">Carrito</h1>
            <p className="carrito-pagina__envio"><span aria-hidden="true">✓</span> Retiro gratis en el salón <em>Oferta exclusiva</em></p>

            <div className="carrito-pagina__barra">
              <label className="carrito-pagina__todos">
                <input type="checkbox" className="marca" checked={todos} onChange={(e) => carrito.seleccionarTodo(e.target.checked)} />
                Seleccionar todo ({items.length})
              </label>
              <div className="carrito-pagina__vistas" role="group" aria-label="Mostrar">
                <button type="button" className="chip-filtro chip-filtro--borde" aria-pressed={vista === 'todos'} onClick={() => setVista('todos')}>Todos ({items.length})</button>
                <button type="button" className="chip-filtro chip-filtro--borde" aria-pressed={vista === 'elegidos'} onClick={() => setVista('elegidos')}>Seleccionado ({elegidos.length})</button>
              </div>
            </div>

            <ul className="carrito-pagina__items">
              {lista.map((i) => {
                const descuento = i.precio_anterior ? Math.round((1 - i.precio / i.precio_anterior) * 100) : 0;
                const casi = i.stock > 0 && i.stock < 10;
                return (
                  <li key={i.clave} className="linea-carrito">
                    <input type="checkbox" className="marca" checked={i.seleccionado !== false}
                           onChange={(e) => carrito.seleccionar(i.clave, e.target.checked)} aria-label={`Incluir ${i.nombre} en el pedido`} />
                    <Link to={enlaceArticulo(i)} className="linea-carrito__foto" tabIndex={-1} aria-hidden="true">
                      <ProductoImagen producto={i} />
                      {casi && <span>Casi agotado</span>}
                    </Link>
                    <div className="linea-carrito__info">
                      <div className="linea-carrito__arriba">
                        <Link to={enlaceArticulo(i)} className="linea-carrito__nombre">{i.nombre}</Link>
                        <button type="button" className="linea-carrito__borrar" onClick={() => carrito.quitar(i.clave)} aria-label={`Eliminar ${i.nombre} del carrito`}>
                          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
                        </button>
                      </div>
                      {i.detalle && <p className="linea-carrito__detalle">{i.detalle} ›</p>}
                      {descuento >= 15 && <p className="linea-carrito__venta">GRAN VENTA</p>}
                      <div className="linea-carrito__abajo">
                        <div className="linea-carrito__precios">
                          {i.precio_anterior && <s>{dinero(i.precio_anterior * i.cantidad)}</s>}
                          <p>
                            <strong className={descuento ? 'linea-carrito__oferta' : ''}>{dinero(i.precio * i.cantidad)}</strong>
                            {descuento > 0 && <span className="linea-carrito__pct">-{descuento}%</span>}
                          </p>
                        </div>
                        <label className="linea-carrito__cant">
                          <span>Cant.</span>
                          <select value={i.cantidad} onChange={(e) => carrito.fijar(i.clave, e.target.value)} aria-label={`Cantidad de ${i.nombre}`}>
                            <option value="0">Quitar</option>
                            {Array.from({ length: Math.max(10, i.cantidad) }, (_, n) => <option key={n + 1} value={n + 1}>{n + 1}</option>)}
                          </select>
                        </label>
                      </div>
                    </div>
                  </li>
                );
              })}
              {lista.length === 0 && <li className="tenue">No hay artículos seleccionados.</li>}
            </ul>

            {agotados.length > 0 && (
              <section className="no-disponibles" aria-labelledby="cp-agotados">
                <h2 id="cp-agotados">Artículos no disponibles ({agotados.length})</h2>
                <ul>
                  {agotados.map((i) => (
                    <li key={i.clave}>
                      <Link to={enlaceArticulo(i)} className="no-disponibles__foto">
                        <ProductoImagen producto={i} />
                        <span>Agotado</span>
                      </Link>
                      <p className="no-disponibles__nombre">{i.nombre}</p>
                      <div className="no-disponibles__botones">
                        <Link to={`/tienda?categoria=${encodeURIComponent(i.categoria || '')}`} className="chip-filtro chip-filtro--borde">Similares ›</Link>
                        <button type="button" className="chip-filtro chip-filtro--borde" onClick={() => carrito.quitar(i.clave)}>Quitar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>

          <aside className="resumen-pedido" aria-labelledby="rp-titulo">
            <h2 id="rp-titulo">Resumen del pedido</h2>
            <dl>
              <div><dt>Total de artículos ({carrito.cantidadElegida}):</dt><dd>{ahorro > 0 ? <s>{dinero(carrito.totalSinDescuento)}</s> : dinero(carrito.totalSinDescuento)}</dd></div>
              {ahorro > 0 && <div><dt>Descuento de artículo(s):</dt><dd className="resumen-pedido__menos">-{dinero(ahorro)}</dd></div>}
              <div><dt>Retiro en el salón:</dt><dd className="resumen-pedido__gratis">GRATIS</dd></div>
              <div className="resumen-pedido__total"><dt>Total</dt><dd>{dinero(carrito.totalElegido)}</dd></div>
            </dl>
            {ahorro > 0 && (
              <p className="resumen-pedido__aviso">
                <b>{dinero(ahorro)} de dto.</b> caduca en <CuentaRegresiva compacta />. ¡Pide ahora!
              </p>
            )}
            <button type="button" className="resumen-pedido__boton" onClick={() => irA('/finalizar-compra')} disabled={!carrito.cantidadElegida}>
              {pocos > 0 && <strong>{pocos} casi {pocos === 1 ? 'agotado' : 'agotados'}</strong>}
              <span>Hacer pedido ({carrito.cantidadElegida})</span>
            </button>
            <p className="resumen-pedido__nota">ⓘ Pagas con SINPE Móvil o al retirar en el salón.</p>
            <p className="resumen-pedido__nota resumen-pedido__nota--verde">🔒 No se te cobra nada hasta que confirmes el pedido.</p>
            <Link to="/tienda" className="enlace">← Seguir comprando</Link>
          </aside>
        </div>
      )}

      {sugeridos.length > 0 && (
        <section className="relacionados" aria-labelledby="cp-sugeridos">
          <h2 id="cp-sugeridos">{items.length ? 'Agrega también' : 'Lo más vendido'}</h2>
          <ul className="productos-rejilla productos-rejilla--grande">
            {sugeridos.filter((p) => !enCarrito.has(p.id)).slice(0, 14).map((p) => <TarjetaProducto key={p.id} p={p} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
