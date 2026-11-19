// Botón de accesibilidad: escala de grises, tamaño (zoom), lectura en voz alta, modo nocturno,
// pausar animaciones y "modo sencillo" para personas mayores, con una guía paso a paso.
// Las preferencias se recuerdan en este navegador.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from './Modal.jsx';

const CLAVE = 'ahnails-accesibilidad';
const INICIAL = { gris: false, oscuro: false, sencillo: false, pausa: false, lector: false, zoom: 1 };
const ZOOMS = [1, 1.1, 1.25, 1.4, 1.6];
// Nombre: leer
// Descripción: Lee las preferencias de accesibilidad guardadas.
// Entrada: Nada.
// Salida: Las preferencias.
// Objetivo: Recordar lo que eligió.
const leer = () => { try { return { ...INICIAL, ...JSON.parse(localStorage.getItem(CLAVE)) }; } catch { return INICIAL; } };

// ---------- Voz ----------
// Nombre: hayVoz
// Descripción: Revisa si el navegador puede hablar.
// Entrada: Nada.
// Salida: Sí o no.
// Objetivo: Usar la lectura en voz alta.
const hayVoz = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
// Nombre: vozEspanol
// Descripción: Busca una voz en español.
// Entrada: Nada.
// Salida: La voz o nada.
// Objetivo: Leer en español.
function vozEspanol() {
  const voces = window.speechSynthesis.getVoices();
  return ['es-CR', 'es-MX', 'es-US', 'es-419', 'es-ES'].map((l) => voces.find((v) => v.lang === l)).find(Boolean) || voces.find((v) => v.lang?.startsWith('es')) || null;
}
// Nombre: hablar
// Descripción: Lee un texto en voz alta.
// Entrada: El texto.
// Salida: Nada.
// Objetivo: Ayudar a quien no puede leer.
export function hablar(texto, { alTerminar } = {}) {
  if (!hayVoz() || !texto) return;
  window.speechSynthesis.cancel();
  // Se lee por partes cortas (algunos navegadores cortan los textos largos)
  const partes = texto.replace(/\s+/g, ' ').match(/[^.!?]{1,220}[.!?]?/g) || [];
  partes.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p.trim());
    u.lang = 'es-CR'; u.rate = 0.95;
    const v = vozEspanol(); if (v) u.voice = v;
    if (i === partes.length - 1 && alTerminar) u.onend = alTerminar;
    window.speechSynthesis.speak(u);
  });
}
// Nombre: callar
// Descripción: Detiene la lectura en voz alta.
// Entrada: Nada.
// Salida: Nada.
// Objetivo: Callar la voz.
export const callar = () => hayVoz() && window.speechSynthesis.cancel();

// ---------- Guía para el modo sencillo ----------
const GUIAS = [
  { id: 'cita', titulo: 'Reservar una cita', icono: 'M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z', ir: '/reservar',
    pasos: ['Toque el servicio que desea (por ejemplo, manicure).', 'Elija la especialista, el día y una hora que salga disponible.', 'Revise los datos y toque «Agregar al carrito».', 'En el carrito toque «Hacer pedido» y pague solo el 30 % para apartar.', 'Le confirmamos por WhatsApp y le recordamos un día antes.'] },
  { id: 'comprar', titulo: 'Comprar productos', icono: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6', ir: '/tienda',
    pasos: ['Busque el producto con la lupa o tocando una categoría.', 'Toque el producto y luego el botón grande «Agrégalo al carrito».', 'Arriba a la derecha toque el carrito y luego «Hacer pedido».', 'Entre a su cuenta (o créela con su correo).', 'Elija retirar en el salón o envío a su casa, y pague.'] },
  { id: 'disenos', titulo: 'Ver diseños de uñas', icono: 'M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4', ir: '/galeria',
    pasos: ['Mire las fotos y toque la que le guste para verla en grande.', 'Si le encanta, toque «Reservar este diseño».', 'El diseño queda guardado en su cita.'] },
  { id: 'ayuda', titulo: 'Hablar con el salón', icono: 'M4 5h16v11H8l-4 4z', ir: '/contacto',
    pasos: ['Toque el círculo de Sofi, abajo a la derecha, y escriba su pregunta.', 'O toque «Escribir por WhatsApp» para hablar con una persona del salón.', 'También puede llamarnos; el número está al final de cada página.'] }
];
const PISTAS = {
  '/': 'Está en la página principal. Use el menú de arriba o la guía para ir a donde necesite.',
  '/tienda': 'Está en la tienda. Toque un producto para verlo y agregarlo al carrito.',
  '/galeria': 'Está en la galería de diseños. Toque una foto para verla en grande.',
  '/reservar': 'Está reservando una cita. Siga los pasos numerados de arriba.',
  '/servicios': 'Está viendo los servicios y precios. Toque «Reservar» en el que desee.',
  '/carrito': 'Está en su carrito. Revise y toque «Hacer pedido» para pagar.',
  '/finalizar-compra': 'Está pagando. Revise sus datos, elija cómo pagar y toque «Finalizar compra».',
  '/cuenta': 'Está en su cuenta: aquí ve sus datos, direcciones y pedidos.',
  '/disena': 'Aquí puede diseñar sus uñas eligiendo colores, uña por uña.'
};

// Nombre: Guia
// Descripción: Muestra la guía de uso.
// Entrada: Qué hacer al cerrar.
// Salida: La ventana de ayuda.
// Objetivo: Explicar cómo usar el sitio.
function Guia({ onCerrar }) {
  const [elegida, setElegida] = useState(null);
  const irA = useNavigate();
  const g = GUIAS.find((x) => x.id === elegida);
  return (
    <Modal titulo={g ? g.titulo : '¿Qué quiere hacer hoy?'} onCerrar={onCerrar} ancho>
      {!g ? (
        <ul className="guia__opciones">
          {GUIAS.map((x) => (
            <li key={x.id}><button type="button" onClick={() => setElegida(x.id)}>
              <svg aria-hidden="true" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={x.icono} /></svg>
              {x.titulo}
            </button></li>
          ))}
        </ul>
      ) : (
        <div className="guia__pasos">
          <ol>{g.pasos.map((p, i) => <li key={i} style={{ '--n': i }}><span>{i + 1}</span>{p}</li>)}</ol>
          <div className="botones">
            <button type="button" className="boton-gigante" onClick={() => { onCerrar(); irA(g.ir); }}>Llévame ahí</button>
            <button type="button" className="boton boton--contorno" onClick={() => hablar(`${g.titulo}. ${g.pasos.map((p, i) => `Paso ${i + 1}: ${p}`).join(' ')}`)}>Leerme los pasos</button>
            <button type="button" className="boton boton--contorno" onClick={() => setElegida(null)}>← Otra opción</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// Nombre: Icono
// Descripción: Dibuja un ícono.
// Entrada: El trazo del dibujo.
// Salida: El ícono.
// Objetivo: Botones claros.
const Icono = ({ d }) => <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;

// Nombre: Accesibilidad
// Descripción: Muestra el menú de accesibilidad.
// Entrada: Nada.
// Salida: El botón y el menú.
// Objetivo: Que todas puedan usar el sitio.
export default function Accesibilidad() {
  const [pref, setPref] = useState(leer);
  const [abierto, setAbierto] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [guia, setGuia] = useState(false);
  const { pathname } = useLocation();
  const ultimo = useRef(null);

  // Aplica las preferencias a toda la página
  useEffect(() => {
    const h = document.documentElement;
    h.classList.toggle('a11y-gris', pref.gris);
    h.classList.toggle('a11y-oscuro', pref.oscuro);
    h.classList.toggle('a11y-sencillo', pref.sencillo);
    h.classList.toggle('a11y-pausa', pref.pausa || pref.sencillo);
    h.classList.toggle('a11y-lector', pref.lector);
    const zoom = pref.zoom * (pref.sencillo ? 1.12 : 1);
    document.body.style.zoom = zoom === 1 ? '' : String(zoom);
    try { localStorage.setItem(CLAVE, JSON.stringify(pref)); } catch { /* sin almacenamiento */ }
  }, [pref]);

  // Lectura al pasar el mouse o al moverse con el teclado
  useEffect(() => {
    if (!pref.lector) return undefined;
    let t;
    const SELECTOR = 'h1, h2, h3, h4, p, li, a, button, label, td, th, dt, dd, figcaption, [aria-label]';
    // Nombre: leerElemento
    // Descripción: Lee en voz alta lo que se toca.
    // Entrada: El evento del clic.
    // Salida: Nada.
    // Objetivo: Ayudar a personas con poca vista.
    const leerElemento = (e) => {
      const el = e.target.closest?.(SELECTOR);
      if (!el || el === ultimo.current || el.closest('.a11y')) return;
      clearTimeout(t);
      t = setTimeout(() => {
        ultimo.current?.classList.remove('a11y-leyendo');
        ultimo.current = el;
        el.classList.add('a11y-leyendo');
        hablar(el.getAttribute('aria-label') || el.innerText || el.alt || '');
      }, e.type === 'focusin' ? 50 : 450);
    };
    document.addEventListener('mouseover', leerElemento);
    document.addEventListener('focusin', leerElemento);
    return () => { clearTimeout(t); document.removeEventListener('mouseover', leerElemento); document.removeEventListener('focusin', leerElemento); ultimo.current?.classList.remove('a11y-leyendo'); callar(); };
  }, [pref.lector]);

  useEffect(() => { callar(); setLeyendo(false); }, [pathname]);
  if (pathname.startsWith('/admin')) return null;

  // Nombre: cambiar
  // Descripción: Enciende o apaga una opción.
  // Entrada: La opción.
  // Salida: Nada.
  // Objetivo: Cambiar preferencias.
  const cambiar = (k) => setPref((p) => ({ ...p, [k]: !p[k] }));
  const zoomIdx = ZOOMS.indexOf(pref.zoom) === -1 ? 0 : ZOOMS.indexOf(pref.zoom);
  // Nombre: leerPagina
  // Descripción: Lee toda la página en voz alta.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ayudar a quien no puede leer.
  const leerPagina = () => {
    if (leyendo) { callar(); setLeyendo(false); return; }
    const main = document.querySelector('main') || document.body;
    setLeyendo(true);
    // Nombre: alTerminar
    // Descripción: Avisa que terminó de leer.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Cambiar el botón a "leer".
    hablar(main.innerText, { alTerminar: () => setLeyendo(false) });
  };
  const activos = ['gris', 'oscuro', 'sencillo', 'pausa', 'lector'].filter((k) => pref[k]).length + (pref.zoom !== 1 ? 1 : 0);

  const OPCIONES = [
    { k: 'oscuro', t: 'Modo nocturno', d: 'Fondo oscuro, descansa la vista', i: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /> },
    { k: 'gris', t: 'Escala de grises', d: 'Quita los colores', i: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" /></> },
    { k: 'lector', t: 'Leer al señalar', d: 'Lee en voz alta lo que toque o señale', i: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></>, voz: true },
    { k: 'pausa', t: 'Pausar animaciones', d: 'Nada se mueve en la pantalla', i: <><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></> },
    { k: 'sencillo', t: 'Modo sencillo', d: 'Letras grandes, menos cosas y una guía paso a paso', i: <><circle cx="12" cy="7" r="3" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>, grande: true }
  ];

  return (
    <div className="a11y">
      <button type="button" className="a11y__boton" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-controls="a11y-panel" aria-label="Opciones de accesibilidad">
        <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4" r="2" /><path d="M4 7.5 12 9l8-1.5.4 1.9-5.4 1.4v3.4l2.2 6.4-1.9.7L13 15h-2l-2.3 6.3-1.9-.7L9 14.2v-3.4L3.6 9.4z" /></svg>
        {activos > 0 && <span className="a11y__cuenta">{activos}</span>}
      </button>

      {abierto && (
        <section id="a11y-panel" className="a11y__panel" role="dialog" aria-label="Accesibilidad">
          <header className="a11y__cabeza">
            <h2>Accesibilidad</h2>
            <button type="button" className="a11y__cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar">×</button>
          </header>

          <div className="a11y__zoom">
            <span className="a11y__zoom-titulo"><Icono d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M8 11h6M11 8v6" /></>} /> Tamaño</span>
            <button type="button" onClick={() => setPref({ ...pref, zoom: ZOOMS[Math.max(0, zoomIdx - 1)] })} disabled={zoomIdx === 0} aria-label="Achicar">A−</button>
            <output aria-live="polite">{Math.round(pref.zoom * 100)} %</output>
            <button type="button" onClick={() => setPref({ ...pref, zoom: ZOOMS[Math.min(ZOOMS.length - 1, zoomIdx + 1)] })} disabled={zoomIdx === ZOOMS.length - 1} aria-label="Agrandar">A+</button>
          </div>

          <button type="button" className={`a11y__leer ${leyendo ? 'a11y__leer--activo' : ''}`} onClick={leerPagina} disabled={!hayVoz()}>
            <Icono d={leyendo ? <rect x="7" y="7" width="10" height="10" rx="1" /> : <path d="M8 5v14l11-7z" />} />
            {leyendo ? 'Detener la lectura' : 'Leer esta página en voz alta'}
          </button>

          <ul className="a11y__opciones">
            {OPCIONES.map((o) => (
              <li key={o.k} className={o.grande ? 'a11y__opcion--grande' : ''}>
                <button type="button" className={`a11y__opcion ${pref[o.k] ? 'a11y__opcion--activa' : ''}`} aria-pressed={pref[o.k]} onClick={() => cambiar(o.k)} disabled={o.voz && !hayVoz()}>
                  <Icono d={o.i} />
                  <span><strong>{o.t}</strong><small>{o.d}</small></span>
                  <i className="a11y__switch" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="a11y__pie">
            <button type="button" className="boton boton--chico" onClick={() => { setGuia(true); setAbierto(false); }}>Guíame paso a paso</button>
            <button type="button" className="enlace enlace--boton" onClick={() => { setPref(INICIAL); callar(); }}>Restablecer todo</button>
          </div>
        </section>
      )}

      {pref.sencillo && (
        <div className="sencillo-barra" role="region" aria-label="Ayuda del modo sencillo">
          <p>{PISTAS[pathname] || PISTAS[`/${pathname.split('/')[1]}`] || 'Si se pierde, toque «Guíame» y le explicamos paso a paso.'}</p>
          <button type="button" onClick={() => setGuia(true)}>Guíame</button>
          <button type="button" onClick={() => hablar(PISTAS[pathname] || 'Toque Guíame para recibir ayuda paso a paso.')} aria-label="Leer esta ayuda en voz alta"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6" /></svg></button>
        </div>
      )}
      {guia && <Guia onCerrar={() => setGuia(false)} />}
    </div>
  );
}
