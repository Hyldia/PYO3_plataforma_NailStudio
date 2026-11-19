// Cupón sorpresa: los cupones ya no están a la vista en una lista; aparecen como regalo en ciertos momentos:
// · al poner un combo en el carrito → el cupón de combos,
// · cuando el carrito pasa el monto mínimo de algún cupón → uno de esos, al azar,
// · un rato después de entrar al sitio (entre 40 y 90 segundos) → uno al azar.
// Máximo dos por visita y nunca el mismo dos veces en 3 días.
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import { dinero } from '../config.js';

const CLAVE = 'ahnails-cupones-vistos';
const SESION = 'ahnails-cupones-sesion';
const SIN_CUPON = ['/admin', '/equipo', '/finalizar-compra'];
const vistos = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { return {}; } };
const enSesion = () => { try { return Number(sessionStorage.getItem(SESION)) || 0; } catch { return 0; } };
function marcar(codigo) {
  try {
    const v = vistos(); v[codigo] = Date.now(); localStorage.setItem(CLAVE, JSON.stringify(v));
    sessionStorage.setItem(SESION, String(enSesion() + 1));
  } catch { /* sin almacenamiento */ }
}
const disponible = (c) => !vistos()[c.codigo] || Date.now() - vistos()[c.codigo] > 3 * 86400000;
const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
const valor = (c) => (c.tipo === 'porcentaje' ? `${c.valor} %` : dinero(c.valor));

export default function CuponSorpresa() {
  const { pathname } = useLocation();
  const carrito = useCarrito();
  const [cupones, setCupones] = useState([]);
  const [combos, setCombos] = useState(new Set());
  const [cupon, setCupon] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const antes = useRef(null);
  const oculto = SIN_CUPON.some((p) => pathname.startsWith(p));

  useEffect(() => {
    api.cupones().then(setCupones).catch(() => {});
    api.servicios().then((r) => setCombos(new Set((r.servicios || r).filter((s) => s.es_combo).map((s) => s.id)))).catch(() => {});
  }, []);

  // Muestra un cupón si se puede (no en el panel, no encima de otra ventana, máximo dos por visita)
  const mostrar = (c, intento = 0) => {
    if (!c || cupon || oculto || enSesion() >= 2 || !disponible(c)) return false;
    // Si hay una ventana abierta, espera a que se cierre (lo intenta unas veces)
    if (document.querySelector('dialog[open]')) { if (intento < 10) setTimeout(() => mostrar(c, intento + 1), 2000); return true; }
    marcar(c.codigo); setCopiado(false); setCupon(c);
    return true;
  };

  // Un rato después de entrar, un cupón al azar
  useEffect(() => {
    if (!cupones.length || oculto) return undefined;
    const t = setTimeout(() => mostrar(azar(cupones.filter((c) => !c.solo_combos && disponible(c)))), 40000 + Math.random() * 50000);
    return () => clearTimeout(t);
  }, [cupones, oculto]);

  // Según lo que se pone en el carrito
  useEffect(() => {
    const items = carrito.items;
    const previos = antes.current;
    antes.current = items.map((i) => i.clave);
    if (!previos || !cupones.length) return;
    const nuevos = items.filter((i) => !previos.includes(i.clave));
    if (!nuevos.length) return;
    if (nuevos.some((i) => i.tipo === 'cita' && combos.has(Number(i.servicioId)))) {
      if (mostrar(azar(cupones.filter((c) => c.solo_combos && disponible(c))))) return;
    }
    const total = carrito.totalElegido;
    mostrar(azar(cupones.filter((c) => !c.solo_combos && c.minimo > 0 && total >= c.minimo && disponible(c))));
  }, [carrito.items, cupones, combos]);

  // Se va sola a los 25 segundos
  useEffect(() => {
    if (!cupon) return undefined;
    const t = setTimeout(() => setCupon(null), 25000);
    return () => clearTimeout(t);
  }, [cupon]);

  if (!cupon || oculto) return null;
  const copiar = async () => { try { await navigator.clipboard.writeText(cupon.codigo); setCopiado(true); } catch { /* sin portapapeles */ } };
  return (
    <aside className="cupon-sorpresa" role="status" aria-live="polite" aria-label="Cupón de regalo">
      <div className="cupon-sorpresa__talon"><strong>{valor(cupon)}</strong><span>de descuento</span></div>
      <div className="cupon-sorpresa__cuerpo">
        <p className="cupon-sorpresa__ante">¡Un regalo para ti!</p>
        <p className="cupon-sorpresa__desc">{cupon.descripcion}</p>
        {cupon.minimo > 0 && <p className="cupon-sorpresa__nota">Desde {dinero(cupon.minimo)}{cupon.solo_combos ? ' · solo combos' : ''}</p>}
        <div className="cupon-sorpresa__fila">
          <code>{cupon.codigo}</code>
          <button type="button" onClick={copiar}>{copiado ? '¡Copiado!' : 'Copiar'}</button>
          <Link to={carrito.items.length ? '/carrito' : '/servicios'} onClick={() => setCupon(null)}>Usar ahora</Link>
        </div>
      </div>
      <button type="button" className="cupon-sorpresa__cerrar" onClick={() => setCupon(null)} aria-label="Cerrar el cupón">×</button>
    </aside>
  );
}
