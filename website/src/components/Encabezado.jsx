import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';

const ENLACES = [
  { to: '/servicios', texto: 'Servicios' },
  { to: '/galeria', texto: 'Galería' },
  { to: '/disena', texto: 'Diseña tus uñas' },
  { to: '/tienda', texto: 'Tienda' },
  { to: '/contacto', texto: 'Contacto' }
];

export default function Encabezado() {
  const [menu, setMenu] = useState(false);
  const { cantidad, abrir } = useCarrito();
  const { pathname } = useLocation();
  useEffect(() => setMenu(false), [pathname]);

  return (
    <header className="encabezado">
      <div className="contenedor encabezado__fila">
        <Link to="/" className="encabezado__logo" aria-label="Nailé, ir al inicio"><Logo /></Link>

        <button type="button" className="boton-menu" aria-expanded={menu} aria-controls="menu-principal" onClick={() => setMenu(!menu)}>
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {menu ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          <span className="solo-lector">{menu ? 'Cerrar menú' : 'Abrir menú'}</span>
        </button>

        <nav id="menu-principal" className={`menu ${menu ? 'menu--abierto' : ''}`} aria-label="Principal">
          <ul>
            {ENLACES.map((e) => <li key={e.to}><NavLink to={e.to}>{e.texto}</NavLink></li>)}
          </ul>
        </nav>

        <div className="encabezado__acciones">
          <button type="button" className="boton-icono" onClick={abrir} aria-label={`Carrito, ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1.2 12H6.2z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
            {cantidad > 0 && <span className="insignia" aria-hidden="true">{cantidad}</span>}
          </button>
          <Link to="/reservar" className="boton boton--chico">Reservar cita</Link>
        </div>
      </div>
    </header>
  );
}
