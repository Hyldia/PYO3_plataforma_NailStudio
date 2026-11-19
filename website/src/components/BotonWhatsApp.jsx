// Botón flotante de WhatsApp: siempre visible (abajo a la izquierda) para escribirle al salón
// al +506 8532 6297 en cualquier momento, desde cualquier página.
import { useLocation } from 'react-router-dom';
import { SALON, enlaceWhatsApp } from '../config.js';

// Nombre: BotonWhatsApp
// Descripción: Muestra el botón verde de WhatsApp.
// Entrada: Nada (lee la página actual para el mensaje).
// Salida: El botón.
// Objetivo: Que las clientas puedan escribir al salón siempre.
export default function BotonWhatsApp() {
  const { pathname: paginaActual } = useLocation();
  if (paginaActual.startsWith('/admin') || paginaActual.startsWith('/equipo')) return null;
  const mensaje = `Hola ${SALON.nombre}, quisiera información.`;
  // En las páginas con barra fija abajo (reservar y carrito) el botón sube para no taparla en el celular
  const conBarraAbajo = ['/reservar', '/carrito', '/pagar'].some((ruta) => paginaActual.startsWith(ruta));
  return (
    <a className={`whatsapp-flotante ${conBarraAbajo ? 'whatsapp-flotante--alto' : ''}`} href={enlaceWhatsApp(mensaje)} target="_blank" rel="noreferrer" aria-label={`Escribir por WhatsApp al ${SALON.telefono}`}>
      <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.4.2.5.3 0 .2 0 .7-.2 1.2z" /></svg>
      <span className="whatsapp-flotante__texto">WhatsApp</span>
    </a>
  );
}
