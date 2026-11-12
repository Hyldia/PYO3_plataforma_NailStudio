import { useState } from 'react';
import { SALON, enlaceWhatsApp } from '../config.js';
import { useTitulo } from '../lib/hooks.js';

export default function Contacto() {
  useTitulo('Contacto');
  const [msj, setMsj] = useState({ nombre: '', mensaje: '' });
  const enviar = (e) => {
    e.preventDefault();
    window.open(enlaceWhatsApp(`Hola, soy ${msj.nombre}. ${msj.mensaje}`), '_blank', 'noopener');
  };

  return (
    <div className="contenedor pagina">
      <header className="pagina__cabeza"><h1>Contacto</h1></header>
      <div className="contacto">
        <div className="contacto__datos">
          <h2>Dónde estamos</h2>
          <address>{SALON.direccion}</address>
          <h2>Horario</h2>
          <dl className="horario">{SALON.horario.map((h) => (<div key={h.dias}><dt>{h.dias}</dt><dd>{h.horas}</dd></div>))}</dl>
          <h2>Teléfono y correo</h2>
          <p><a className="enlace" href={`tel:${SALON.telefono.replace(/\s/g, '')}`}>{SALON.telefono}</a></p>
          <p><a className="enlace" href={`mailto:${SALON.correo}`}>{SALON.correo}</a></p>
        </div>
        <form className="caja" onSubmit={enviar}>
          <h2>Escríbenos</h2>
          <p className="tenue">Tu mensaje se abre en WhatsApp para que lo envíes desde tu teléfono.</p>
          <div className="campo"><label htmlFor="c-nombre">Nombre</label><input id="c-nombre" required autoComplete="name" value={msj.nombre} onChange={(e) => setMsj({ ...msj, nombre: e.target.value })} /></div>
          <div className="campo"><label htmlFor="c-msj">Mensaje</label><textarea id="c-msj" rows="5" required value={msj.mensaje} onChange={(e) => setMsj({ ...msj, mensaje: e.target.value })} /></div>
          <button type="submit" className="boton">Enviar por WhatsApp</button>
        </form>
      </div>
      {SALON.mapaEmbed && <iframe className="mapa mapa--ancho" title={`Mapa de ubicación de ${SALON.nombre}`} src={SALON.mapaEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
    </div>
  );
}
