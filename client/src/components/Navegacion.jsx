import { NavLink } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext.jsx';

const Icono = ({ d }) => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const ENLACES = [
  { to: '/', texto: 'Inicio', icono: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  { to: '/disenar', texto: 'Diseñar', icono: <><path d="M12 3c3 0 5 3 5 7v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9c0-4 2-7 5-7z" /><path d="M9 9h6" /></> },
  { to: '/reservar', texto: 'Citas', icono: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></> },
  { to: '/tienda', texto: 'Tienda', icono: <><path d="M6 7h12l-1 13H7z" /><path d="M9 7a3 3 0 0 1 6 0" /></> }
];

export default function Navegacion() {
  const { cantidad } = useCarrito();
  return (
    <nav className="nav" aria-label="Navegación principal">
      {ENLACES.map((e) => (
        <NavLink key={e.to} to={e.to} end className="nav__enlace">
          <span className="nav__icono">
            <Icono d={e.icono} />
            {e.to === '/tienda' && cantidad > 0 && <span className="insignia" aria-hidden="true">{cantidad}</span>}
          </span>
          {e.texto}
          {e.to === '/tienda' && cantidad > 0 && <span className="solo-lector">, {cantidad} en el carrito</span>}
        </NavLink>
      ))}
    </nav>
  );
}
