// Ayuda y contacto: portada con accesos rápidos, tarjetas con los datos del salón,
// preguntas frecuentes y un formulario que abre WhatsApp.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SALON, enlaceWhatsApp } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import Migas from '../components/Migas.jsx';

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const ICONOS = {
  ubicacion: <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" {...trazo}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  reloj: <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" {...trazo}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  telefono: <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" {...trazo}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>,
  whatsapp: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" /></svg>,
  calendario: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" {...trazo}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
};

const PREGUNTAS = [
  ['¿Cómo reservo una cita?', <>Entra a <Link to="/reservar" className="enlace">Reservar</Link>, elige el servicio, la especialista, el día y la hora. Te llega la confirmación al instante.</>],
  ['¿Puedo cambiar o cancelar mi cita?', 'Sí, hasta 2 horas antes de tu cita: desde «Mi cuenta» o por WhatsApp al 8532 6297. Tu adelanto queda a tu favor para la nueva cita.'],
  ['¿Qué pasa si no llego a mi cita?', 'Te escribimos por WhatsApp. Según el caso, la dueña o tu especialista te la reprograma o se cobra la cita (normalmente el adelanto).'],
  ['¿Qué formas de pago aceptan?', 'SINPE Móvil, tarjeta de débito o crédito, y efectivo en el salón.'],
  ['¿Cómo recojo lo que compro en la tienda?', 'Los productos se retiran gratis en el salón. Te avisamos cuando tu pedido esté listo.'],
  ['¿Qué es un press-on?', 'Son uñas hechas a tu medida con el diseño que elijas, listas para ponértelas en casa. Las encuentras en la Galería.'],
  ['¿Y si se me levanta una uña?', 'Si pasa en los primeros 5 días después de tu cita, la arreglamos sin costo. Solo escríbenos.']
];
const TEMAS = ['Reservas', 'Un pedido', 'Precios', 'Otra cosa'];

// ¿Está abierto ahora? Lee el horario del salón (por ejemplo "9:00 a. m. – 7:00 p. m.")
// Nombre: abiertoAhora
// Descripción: Revisa si el salón está abierto ahora.
// Entrada: Nada.
// Salida: Sí o no.
// Objetivo: Avisar en Ayuda.
function abiertoAhora() {
  const ahora = new Date();
  const dia = ahora.getDay(); // 0 domingo
  const fila = SALON.horario.find((h) => (dia === 0 ? /domingo/i.test(h.dias) : dia === 6 ? /s[áa]bado/i.test(h.dias) : /lunes/i.test(h.dias)));
  const horas = [...String(fila?.horas || '').matchAll(/(\d{1,2}):(\d{2})\s*([ap])/gi)].map(([, h, m, ap]) => ((Number(h) % 12) + (ap.toLowerCase() === 'p' ? 12 : 0)) * 60 + Number(m));
  if (horas.length < 2) return false;
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  return min >= horas[0] && min < horas[1];
}

// Nombre: Contacto
// Descripción: Muestra la página de ayuda y contacto.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Resolver dudas.
export default function Contacto() {
  useTitulo('Ayuda y contacto');
  const [msj, setMsj] = useState({ nombre: '', tema: TEMAS[0], mensaje: '' });
  const abierto = abiertoAhora();
  // Nombre: enviar
  // Descripción: Abre WhatsApp con el mensaje.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Escribir al salón.
  const enviar = (evento) => {
    evento.preventDefault();
    window.open(enlaceWhatsApp(`Hola, soy ${msj.nombre}. Les escribo por: ${msj.tema}. ${msj.mensaje}`), '_blank', 'noopener');
  };
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SALON.direccion)}`;

  return (
    <div className="contenedor pagina pagina--resultados ayuda">
      <Migas pasos={[['Ayuda y contacto']]} />
      <section className="vitrina vitrina--vendidos ayuda-portada" aria-labelledby="t-ayuda">
        <span className="vitrina__burbujas" aria-hidden="true">{Array.from({ length: 8 }, (_, n) => <i key={n} style={{ '--n': n }} />)}</span>
        <div className="vitrina__texto">
          <p className="vitrina__ante">Centro de ayuda</p>
          <h1 id="t-ayuda">¿En qué te <em>ayudamos</em>?</h1>
          <p>Escríbenos, llámanos o busca tu respuesta en las preguntas frecuentes. Te contestamos rapidito.</p>
          <div className="ayuda-portada__botones">
            <a href={enlaceWhatsApp('Hola, necesito ayuda.')} target="_blank" rel="noreferrer" className="vitrina__boton">{ICONOS.whatsapp} WhatsApp</a>
            <Link to="/reservar" className="ayuda-portada__secundario">{ICONOS.calendario} Reservar cita</Link>
          </div>
        </div>
        <p className={`ayuda-estado ${abierto ? 'ayuda-estado--abierto' : ''}`}><span aria-hidden="true" />{abierto ? 'Abierto ahora' : 'Cerrado en este momento'}</p>
      </section>

      <ul className="ayuda-tarjetas">
        <li className="ayuda-tarjeta">
          <span className="ayuda-tarjeta__icono">{ICONOS.ubicacion}</span>
          <h2>Dónde estamos</h2>
          <address>{SALON.direccion}</address>
          <a href={mapa} target="_blank" rel="noreferrer" className="ayuda-tarjeta__accion">Cómo llegar ›</a>
        </li>
        <li className="ayuda-tarjeta">
          <span className="ayuda-tarjeta__icono">{ICONOS.reloj}</span>
          <h2>Horario</h2>
          <dl className="ayuda-horario">{SALON.horario.map((h) => (<div key={h.dias}><dt>{h.dias}</dt><dd>{h.horas}</dd></div>))}</dl>
        </li>
        <li className="ayuda-tarjeta">
          <span className="ayuda-tarjeta__icono">{ICONOS.telefono}</span>
          <h2>Teléfono y WhatsApp</h2>
          <p><a className="enlace" href={`tel:${SALON.telefono.replace(/\s/g, '')}`}>{SALON.telefono}</a></p>
          <p><a className="enlace" href={enlaceWhatsApp('Hola, quisiera información.')} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a></p>
          <p className="tenue">Recibimos mensajes a cualquier hora; te respondemos en horario del salón.</p>
        </li>
      </ul>

      <div className="ayuda-cuerpo">
        <section className="ayuda-preguntas" aria-labelledby="t-preguntas">
          <h2 id="t-preguntas">Preguntas frecuentes</h2>
          {PREGUNTAS.map(([p, r], i) => (
            <details key={p} className="ayuda-pregunta" open={i === 0}>
              <summary>{p}<span aria-hidden="true" className="ayuda-pregunta__mas" /></summary>
              <p>{r}</p>
            </details>
          ))}
        </section>

        <form className="ayuda-form" onSubmit={enviar}>
          <h2>Escríbenos</h2>
          <p className="tenue">Tu mensaje se abre en WhatsApp para que lo envíes desde tu teléfono.</p>
          <fieldset className="ayuda-temas">
            <legend>¿Sobre qué nos escribes?</legend>
            {TEMAS.map((t) => (
              <label key={t} className={`ayuda-tema ${msj.tema === t ? 'ayuda-tema--activo' : ''}`}>
                <input type="radio" name="tema" value={t} checked={msj.tema === t} onChange={() => setMsj({ ...msj, tema: t })} />{t}
              </label>
            ))}
          </fieldset>
          <div className="campo"><label htmlFor="c-nombre">Tu nombre</label><input id="c-nombre" required autoComplete="name" placeholder="Ej.: María" value={msj.nombre} onChange={(evento) => setMsj({ ...msj, nombre: evento.target.value })} /></div>
          <div className="campo"><label htmlFor="c-msj">Mensaje</label><textarea id="c-msj" rows="4" required placeholder="Cuéntanos en qué te ayudamos…" value={msj.mensaje} onChange={(evento) => setMsj({ ...msj, mensaje: evento.target.value })} /></div>
          <button type="submit" className="boton ayuda-form__enviar">{ICONOS.whatsapp} Enviar por WhatsApp</button>
        </form>
      </div>
    </div>
  );
}
