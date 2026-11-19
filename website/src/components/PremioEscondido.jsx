// Premio escondido: los cupones no están en ninguna lista. De vez en cuando aparece un regalito
// pequeño escondido en una tarjeta cualquiera de la página (un producto, un servicio, un diseño…).
// Quien lo encuentra y lo toca se gana el cupón que trae adentro.
// · Sale en casi todas las páginas (4 de cada 5) y nunca en el panel, el carrito ni al pagar.
// · Prefiere cupones que la persona aún no ha encontrado; si ya los encontró todos, repite alguno.
// · Máximo 6 premios por visita (pestaña), para que no aburra.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import Icono from './Icono.jsx';
import Modal from './Modal.jsx';

const CLAVE = 'ahnails-premios';
const SESION = 'ahnails-premios-sesion';
const SIN_PREMIO = ['/admin', '/equipo', '/finalizar-compra', '/carrito'];
// Dónde se puede esconder (la primera que exista en la página)
const ESCONDITES = ['.vitrina__producto', '.inspira__polaroid', '.tarjeta-producto', '.servicio', '.disenos-rejilla > li', '.flash-tarjeta', '.tendencias__item', '.cat-circulos li', '.categoria-circulo', '.ayuda-tarjeta', '.campana__producto', '.podio__producto'];

// Nombre: leer
// Descripción: Lee los premios encontrados.
// Entrada: Nada.
// Salida: Los premios.
// Objetivo: No repetirlos.
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { return {}; } };
// Nombre: enSesion
// Descripción: Cuenta los premios de esta visita.
// Entrada: Nada.
// Salida: La cantidad.
// Objetivo: No mostrar demasiados.
const enSesion = () => { try { return Number(sessionStorage.getItem(SESION)) || 0; } catch { return 0; } };
// Nombre: guardar
// Descripción: Guarda un premio encontrado.
// Entrada: El código.
// Salida: Nada.
// Objetivo: Recordarlo.
function guardar(codigo) {
  try {
    const guardado = leer(); guardado[codigo] = Date.now(); localStorage.setItem(CLAVE, JSON.stringify(guardado));
    sessionStorage.setItem(SESION, String(enSesion() + 1));
  } catch { /* sin almacenamiento */ }
}
// Nombre: libre
// Descripción: Revisa si un cupón se puede esconder.
// Entrada: El cupón.
// Salida: Sí o no.
// Objetivo: Preferir cupones nuevos.
const libre = (cupon) => !leer()[cupon.codigo] || Date.now() - leer()[cupon.codigo] > 3 * 86400000;
// Nombre: azar
// Descripción: Elige uno al azar.
// Entrada: La lista.
// Salida: Un elemento.
// Objetivo: Sorprender.
const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
// Nombre: valor
// Descripción: Escribe el valor del cupón.
// Entrada: El cupón.
// Salida: El texto.
// Objetivo: Mostrar el descuento.
const valor = (c) => (c.tipo === 'porcentaje' ? `${c.valor} %` : dinero(c.valor));

// Nombre: PremioEscondido
// Descripción: Esconde regalitos con cupones en la página.
// Entrada: Nada.
// Salida: El regalito y su ventana.
// Objetivo: Que los cupones sean premios.
export default function PremioEscondido() {
  const { pathname, search } = useLocation();
  const [cupones, setCupones] = useState([]);
  const [premio, setPremio] = useState(null); // { cupon, el }
  const [pos, setPos] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const objetivo = useRef(null);

  useEffect(() => { api.cupones().then(setCupones).catch(() => {}); }, []);

  // Al cambiar de página: a veces esconde un premio en una tarjeta al azar
  useEffect(() => {
    setPremio(null); setPos(null); objetivo.current = null;
    if (!cupones.length || SIN_PREMIO.some((ruta) => pathname.startsWith(ruta)) || enSesion() >= 6 || Math.random() > 0.8) return undefined;
    let temporizador;
    // Nombre: esconder
    // Descripción: Elige dónde esconder el regalito.
    // Entrada: El intento.
    // Salida: Nada.
    // Objetivo: Ponerlo en una tarjeta visible.
    const esconder = (intento = 0) => {
      const nuevos = cupones.filter(libre);
      const posibles = nuevos.length ? nuevos : cupones;
      const tarjetas = ESCONDITES.flatMap((sel) => [...document.querySelectorAll(sel)]).filter((el) => el.offsetWidth > 60);
      // Si la página aún está cargando sus tarjetas, lo intenta otra vez en un ratito
      if (!tarjetas.length) { if (intento < 6) temporizador = setTimeout(() => esconder(intento + 1), 1500); return; }
      // Lo esconde en una tarjeta que se vea en la pantalla en ese momento (así sí se puede encontrar)
      const enPantalla = tarjetas.filter((el) => { const caja = el.getBoundingClientRect(); return caja.top > 60 && caja.top < window.innerHeight - 80; });
      const lista = enPantalla.length ? enPantalla : tarjetas;
      const elemento = azar(lista.length > 2 ? lista.slice(1) : lista);
      objetivo.current = elemento;
      setPremio({ cupon: azar(posibles), giro: Math.round(Math.random() * 30 - 15), x: 0.3 + Math.random() * 0.4 });
    };
    temporizador = setTimeout(esconder, 2500 + Math.random() * 3500);
    return () => clearTimeout(temporizador);
  }, [pathname, search, cupones]);

  // Sigue a la tarjeta aunque la página cambie de tamaño
  useEffect(() => {
    if (!premio) return undefined;
    // Nombre: medir
    // Descripción: Mide dónde está la tarjeta.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Que el regalito la siga.
    const medir = () => {
      const elemento = objetivo.current;
      if (!elemento || !elemento.isConnected) { setPremio(null); return; }
      const caja = elemento.getBoundingClientRect();
      setPos({ top: caja.top + window.scrollY + 12, left: caja.left + window.scrollX + caja.width * premio.x - 18 }); // arriba, cerca del centro: no tapa el corazón ni el descuento
    };
    medir();
    const i = setInterval(medir, 700);
    window.addEventListener('resize', medir);
    return () => { clearInterval(i); window.removeEventListener('resize', medir); };
  }, [premio]);

  // Nombre: abrir
  // Descripción: Abre el regalito.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrar el premio.
  const abrir = () => { guardar(premio.cupon.codigo); setAbierto(premio.cupon); setCopiado(false); setPremio(null); };
  // Nombre: copiar
  // Descripción: Copia el código del premio.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Pegarlo al pagar.
  const copiar = async () => { try { await navigator.clipboard.writeText(abierto.codigo); setCopiado(true); } catch { /* sin portapapeles */ } };

  return (
    <>
      {premio && pos && createPortal(
        <button type="button" className="premio-escondido" style={{ top: pos.top, left: pos.left, '--giro': `${premio.giro}deg` }} onClick={abrir} aria-label="¡Encontraste un regalo escondido! Tócalo para abrirlo">
          <Icono nombre="regalo" tam={22} />
        </button>, document.body)}
      {abierto && (
        <Modal titulo="¡Encontraste un premio!" onCerrar={() => setAbierto(null)}>
          <div className="premio-abierto">
            <span className="premio-abierto__caja" aria-hidden="true"><Icono nombre="regalo" tam={40} /></span>
            <p className="premio-abierto__ante">Lo encontraste escondido, es tuyo</p>
            <p className="premio-abierto__valor">{valor(abierto)} <small>de descuento</small></p>
            <p className="premio-abierto__desc">{abierto.descripcion}</p>
            {(abierto.minimo > 0 || abierto.solo_combos) && <p className="tenue">{abierto.minimo > 0 ? `En compras desde ${dinero(abierto.minimo)}` : ''}{abierto.solo_combos ? ' · solo combos' : ''}</p>}
            <div className="premio-abierto__codigo"><code>{abierto.codigo}</code><button type="button" className="boton" onClick={copiar}>{copiado ? '¡Copiado!' : 'Copiar código'}</button></div>
            <p className="tenue premio-abierto__nota">Pégalo al pagar, en «Código de cupón». Sigue explorando: hay más premios escondidos.</p>
            <Link to={abierto.solo_combos ? '/servicios?categoria=Combos' : '/servicios'} className="boton boton--contorno" onClick={() => setAbierto(null)}>Usarlo ahora</Link>
          </div>
        </Modal>
      )}
    </>
  );
}
