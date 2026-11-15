import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { SALON, enlaceWhatsApp } from '../config.js';

const I = ({ children }) => <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
const REDES = [
  { clave: 'instagram', nombre: 'Instagram', icono: <I><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></I> },
  { clave: 'facebook', nombre: 'Facebook', icono: <I><circle cx="12" cy="12" r="9" /><path d="M13 21v-7h2.5l.5-3H13V9.5c0-.9.4-1.5 1.6-1.5H16V5.3c-.4 0-1.3-.1-2.3-.1C11.6 5.2 10 6.5 10 8.9V11H7.6v3H10v7" /></I> },
  { clave: 'tiktok', nombre: 'TikTok', icono: <I><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.4 2.6 2.2 4.4 5 4.6" /></I> }
];

const COLUMNAS = [
  { titulo: 'Información del salón', enlaces: [['Quiénes somos', '/contacto'], ['Contáctanos', '/contacto'], ['Ubicación y horario', '/contacto'], ['Galería de trabajos', '/galeria']] },
  { titulo: 'Atención a clientas', enlaces: [['Reservar una cita', '/reservar'], ['Servicios y precios', '/servicios'], ['Cupones y combos', '/servicios?categoria=Combos'], ['Diseña tus uñas', '/disena']] },
  { titulo: 'Tienda', enlaces: [['Ofertas', '/tienda?ofertas=1&orden=descuento'], ['Lo más vendido', '/tienda?orden=vendidos'], ['Pedicure', '/tienda?categoria=Pedicure'], ['Tu carrito', '/carrito']] }
];

const PAGOS = ['SINPE Móvil', 'Tarjeta de débito', 'Tarjeta de crédito', 'Efectivo en el salón'];

export default function Pie() {
  // Botón "Arriba" que aparece al bajar en la página
  const [arriba, setArriba] = useState(false);
  useEffect(() => {
    const ver = () => setArriba(window.scrollY > 900);
    window.addEventListener('scroll', ver, { passive: true });
    return () => window.removeEventListener('scroll', ver);
  }, []);

  return (
    <footer className="pie">
      <div className="contenedor pie__rejilla">
        {COLUMNAS.map((c) => (
          <nav key={c.titulo} aria-label={c.titulo}>
            <h2 className="pie__titulo">{c.titulo}</h2>
            <ul className="pie__enlaces">
              {c.enlaces.map(([t, to]) => <li key={t}><Link to={to}>{t}</Link></li>)}
            </ul>
          </nav>
        ))}
        <div className="pie__visita">
          <h2 className="pie__titulo">Visítanos</h2>
          <dl className="horario">
            {SALON.horario.map((h) => (<div key={h.dias}><dt>{h.dias}</dt><dd>{h.horas}</dd></div>))}
          </dl>
          <address>
            {SALON.direccion}<br />
            <a href={`tel:${SALON.telefono.replace(/\s/g, '')}`}>{SALON.telefono}</a> · <a href={`mailto:${SALON.correo}`}>{SALON.correo}</a>
          </address>
          <a className="pie__whatsapp" href={enlaceWhatsApp('Hola, quisiera información sobre sus servicios.')} target="_blank" rel="noreferrer">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.4.2.5.3 0 .2 0 .7-.2 1.2z" /></svg>
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>

      <div className="contenedor pie__fila">
        <section aria-labelledby="pie-pagos">
          <h2 id="pie-pagos" className="pie__titulo">Aceptamos</h2>
          <ul className="pie__pagos">{PAGOS.map((p) => <li key={p}>{p}</li>)}</ul>
        </section>
        <section aria-labelledby="pie-redes">
          <h2 id="pie-redes" className="pie__titulo">Conecta con {SALON.nombre}</h2>
          <ul className="pie__redes">
            {REDES.filter((r) => SALON.redes[r.clave]).map((r) => (
              <li key={r.clave}><a href={SALON.redes[r.clave]} target="_blank" rel="noreferrer" aria-label={r.nombre}>{r.icono}</a></li>
            ))}
          </ul>
        </section>
        <div className="pie__marca">
          <Logo claro />
          <p>{SALON.lema}</p>
        </div>
      </div>

      <div className="contenedor pie__legal">
        <span>© {new Date().getFullYear()} {SALON.nombre}. Todos los derechos reservados.</span>
        <span>Fotos de muestra: <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a></span>
        <Link to="/admin">Acceso del salón</Link>
      </div>

      {arriba && (
        <button type="button" className="boton-arriba" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 15 6-6 6 6" /></svg>
          Arriba
        </button>
      )}
    </footer>
  );
}
