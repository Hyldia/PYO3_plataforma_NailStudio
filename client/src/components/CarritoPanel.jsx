import { useEffect, useRef, useState } from 'react';
import { useCarrito } from '../context/CarritoContext.jsx';
import { api } from '../lib/api.js';
import { SALON, dinero } from '../config.js';
import Foto from './Foto.jsx';

export default function CarritoPanel() {
  const carrito = useCarrito();
  const dialogo = useRef(null);
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', email: '' });
  const [metodo, setMetodo] = useState('sinpe');
  const [comprobante, setComprobante] = useState('');
  const [estado, setEstado] = useState({ enviando: false, error: '', pedido: null });

  useEffect(() => {
    const d = dialogo.current;
    if (carrito.abierto && !d.open) d.showModal();
    if (!carrito.abierto && d.open) d.close();
  }, [carrito.abierto]);

  async function comprar(e) {
    e.preventDefault();
    setEstado({ enviando: true, error: '', pedido: null });
    try {
      const pedido = await api.crearPedido({
        items: carrito.items.map((i) => ({ productoId: i.id, cantidad: i.cantidad })),
        cliente, metodoPago: metodo, pago: { comprobante }
      });
      carrito.vaciar();
      setEstado({ enviando: false, error: '', pedido });
    } catch (err) {
      setEstado({ enviando: false, error: err.message, pedido: null });
    }
  }

  return (
    <dialog ref={dialogo} className="panel" onClose={() => { carrito.cerrar(); setEstado((s) => ({ ...s, pedido: null })); }} aria-labelledby="carrito-titulo"
            onClick={(e) => { if (e.target === dialogo.current) dialogo.current.close(); }}>
      <div className="panel__cuerpo">
        <div className="panel__cabeza">
          <h2 id="carrito-titulo">Tu carrito</h2>
          <button type="button" className="boton-icono" onClick={() => dialogo.current.close()} aria-label="Cerrar carrito">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {estado.pedido ? (
          <div className="panel__exito" role="status">
            <h3>Pedido #{estado.pedido.id} recibido</h3>
            <p>Total {dinero(estado.pedido.total)}. Te escribiremos por WhatsApp cuando esté listo para retirar en el salón.</p>
            <button type="button" className="boton" onClick={() => dialogo.current.close()}>Seguir viendo</button>
          </div>
        ) : carrito.items.length === 0 ? (
          <p className="tenue">Tu carrito está vacío. Agrega productos desde la tienda.</p>
        ) : (
          <form onSubmit={comprar} className="panel__form" noValidate>
            <ul className="carrito">
              {carrito.items.map((i) => (
                <li key={i.id} className="carrito__linea">
                  <Foto archivo={i.imagen} alt="" className="carrito__foto" />
                  <div>
                    <p className="carrito__nombre">{i.nombre}</p>
                    <p className="tenue">{dinero(i.precio)}</p>
                    <div className="cantidad">
                      <button type="button" onClick={() => carrito.cambiar(i.id, -1)} aria-label={`Quitar uno de ${i.nombre}`}>−</button>
                      <span aria-live="polite">{i.cantidad}</span>
                      <button type="button" onClick={() => carrito.cambiar(i.id, 1)} aria-label={`Agregar uno de ${i.nombre}`}>+</button>
                    </div>
                  </div>
                  <span className="carrito__subtotal">{dinero(i.cantidad * i.precio)}</span>
                </li>
              ))}
            </ul>
            <p className="panel__total"><span>Total</span><strong>{dinero(carrito.total)}</strong></p>
            <p className="tenue">Los pedidos se retiran en el salón.</p>

            <div className="campo">
              <label htmlFor="pc-nombre">Nombre</label>
              <input id="pc-nombre" autoComplete="name" required value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="pc-tel">Teléfono (WhatsApp)</label>
              <input id="pc-tel" type="tel" autoComplete="tel" required value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
            </div>
            <fieldset className="campo">
              <legend>Forma de pago</legend>
              <label className="radio"><input type="radio" name="pc-metodo" checked={metodo === 'sinpe'} onChange={() => setMetodo('sinpe')} /> SINPE Móvil</label>
              <label className="radio"><input type="radio" name="pc-metodo" checked={metodo === 'salon'} onChange={() => setMetodo('salon')} /> Pago al retirar</label>
            </fieldset>
            {metodo === 'sinpe' && (
              <div className="campo">
                <label htmlFor="pc-comp">Número de comprobante</label>
                <p className="tenue" id="pc-comp-ayuda">Envía {dinero(carrito.total)} al {SALON.sinpe.numero} ({SALON.sinpe.nombre}).</p>
                <input id="pc-comp" inputMode="numeric" aria-describedby="pc-comp-ayuda" value={comprobante} onChange={(e) => setComprobante(e.target.value)} />
              </div>
            )}
            {estado.error && <p role="alert" className="error">{estado.error}</p>}
            <button type="submit" className="boton boton--ancho" disabled={estado.enviando}>
              {estado.enviando ? 'Enviando pedido…' : 'Confirmar pedido'}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
