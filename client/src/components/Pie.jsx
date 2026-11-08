import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { SALON, enlaceWhatsApp } from '../config.js';

export default function Pie() {
  return (
    <footer className="pie">
      <div className="contenedor pie__rejilla">
        <div className="pie__marca">
          <Logo claro />
          <p>{SALON.lema}</p>
        </div>
        <div>
          <h2 className="pie__titulo">Horario</h2>
          <dl className="horario">
            {SALON.horario.map((h) => (<div key={h.dias}><dt>{h.dias}</dt><dd>{h.horas}</dd></div>))}
          </dl>
        </div>
        <div>
          <h2 className="pie__titulo">Visítanos</h2>
          <address>
            {SALON.direccion}<br />
            <a href={`tel:${SALON.telefono.replace(/\s/g, '')}`}>{SALON.telefono}</a><br />
            <a href={`mailto:${SALON.correo}`}>{SALON.correo}</a>
          </address>
        </div>
        <div>
          <h2 className="pie__titulo">Síguenos</h2>
          <ul className="pie__enlaces">
            {SALON.redes.instagram && <li><a href={SALON.redes.instagram} target="_blank" rel="noreferrer">Instagram</a></li>}
            {SALON.redes.facebook && <li><a href={SALON.redes.facebook} target="_blank" rel="noreferrer">Facebook</a></li>}
            {SALON.redes.tiktok && <li><a href={SALON.redes.tiktok} target="_blank" rel="noreferrer">TikTok</a></li>}
            <li><a href={enlaceWhatsApp('Hola, quisiera información sobre sus servicios.')} target="_blank" rel="noreferrer">WhatsApp</a></li>
          </ul>
        </div>
      </div>
      <div className="contenedor pie__legal">
        <span>© {new Date().getFullYear()} {SALON.nombre}. Todos los derechos reservados.</span>
        <Link to="/admin">Acceso del salón</Link>
      </div>
    </footer>
  );
}
