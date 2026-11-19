// Encabezado del sitio: logo, menú, buscador, cuenta y carrito (en el celular el menú se abre con ☰).
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { abrirCarritoLateral } from './CarritoLateral.jsx';
import BuscadorEnVivo from './BuscadorEnVivo.jsx';
import { SALON } from '../config.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import { useFavoritos } from '../context/FavoritosContext.jsx';
import { useUsuario } from '../context/UsuarioContext.jsx';

const ENLACES = [
  { to: '/tienda?orden=vendidos', texto: 'Más vendidos', icono: 'pulgar' },
  { to: '/tienda?ofertas=1&orden=descuento', texto: 'Ofertas', icono: 'rayo' },
  { to: '/servicios', texto: 'Servicios' },
  { to: '/galeria', texto: 'Galería' },
  { to: '/disena', texto: 'Diseña tus uñas' },
  { to: '/tienda', texto: 'Tienda' }
];

const ICONOS = {
  pulgar: <path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 3 2l-1 4h6a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7" />,
  rayo: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
};
// Nombre: Icono
// Descripción: Dibuja un ícono del encabezado.
// Entrada: El trazo y si va relleno.
// Salida: El ícono.
// Objetivo: Botones claros.
const Icono = ({ d, relleno }) => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill={relleno ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

// Nombre: Lupa
// Descripción: Dibuja la lupa.
// Entrada: Nada.
// Salida: El ícono.
// Objetivo: Botón de buscar.
const Lupa = () => <Icono d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />;

// Nombre: Encabezado
// Descripción: Muestra el encabezado con el menú.
// Entrada: Nada.
// Salida: El encabezado.
// Objetivo: Navegar por el sitio.
export default function Encabezado() {
  const [menu, setMenu] = useState(false);
  const { cantidad } = useCarrito();
  const favoritos = useFavoritos();
  const { usuario } = useUsuario();
  const { pathname, search } = useLocation();
  const navegar = useNavigate();
  useEffect(() => setMenu(false), [pathname, search]);


  const Carrito = (
    <button type="button" className="encabezado__carrito" onClick={() => (window.innerWidth >= 1280 && !['/carrito', '/finalizar-compra'].includes(pathname) && !pathname.startsWith('/admin') ? abrirCarritoLateral() : navegar('/carrito'))} aria-label={`Carrito, ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`}>
      <Icono d={<><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><circle cx="10" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></>} />
      <span aria-hidden="true" className="encabezado__cuenta" key={cantidad}>{cantidad}</span>
    </button>
  );

  return (
    <>
      <header className="encabezado">
        <div className="contenedor encabezado__fila">
          <Link to="/" className="encabezado__logo" aria-label={`${SALON.nombre}, ir al inicio`}><Logo claro /></Link>

          <nav id="menu-principal" className={`menu ${menu ? 'menu--abierto' : ''}`} aria-label="Principal">
            <ul>
              {ENLACES.map((enlaz) => (
                <li key={enlaz.to}>
                  {enlaz.to.includes('?')
                    ? <Link to={enlaz.to}>{enlaz.icono && <Icono d={ICONOS[enlaz.icono]} relleno={enlaz.icono === 'rayo'} />}{enlaz.texto}</Link>
                    : <NavLink to={enlaz.to} end>{enlaz.texto}</NavLink>}
                </li>
              ))}
              <li className="menu__solo-movil"><NavLink to="/contacto">Contacto</NavLink></li>
              <li className="menu__solo-movil"><NavLink to="/reservar">Reservar cita</NavLink></li>
            </ul>
          </nav>

          <BuscadorEnVivo Lupa={Lupa} />

          <div className="encabezado__acciones">
            <Link to="/reservar" className="encabezado__reservar">
              <Icono d={<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>} />
              <span>Reservar<small>tu cita</small></span>
            </Link>
            <Link to="/contacto" className="encabezado__ayuda">
              <Icono d={<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01" /></>} />
              <span>Ayuda</span>
            </Link>
            <Link to="/cuenta" className="encabezado__cuenta-link" aria-label={usuario ? `Mi cuenta, ${usuario.nombre}` : 'Entrar o crear cuenta'}>
              {usuario?.foto ? <img src={usuario.foto} alt="" referrerPolicy="no-referrer" className="encabezado__avatar" /> : usuario ? <span className="encabezado__avatar">{usuario.nombre[0]}</span>
                : <Icono d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>} />}
              <span className="encabezado__cuenta-texto">{usuario ? usuario.nombre.split(' ')[0] : 'Entrar'}</span>
            </Link>
            <Link to="/favoritos" className="encabezado__favoritos" aria-label={`Favoritos, ${favoritos.cantidad} guardados`}>
              <Icono d={<path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z" />} />
              {favoritos.cantidad > 0 && <span aria-hidden="true" className="encabezado__cuenta encabezado__cuenta--fav" key={favoritos.ultimo}>{favoritos.cantidad}</span>}
            </Link>
            {Carrito}
            <button type="button" className="boton-menu" aria-expanded={menu} aria-controls="menu-principal" onClick={() => setMenu(!menu)}>
              <Icono d={menu ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />} />
              <span className="solo-lector">{menu ? 'Cerrar menú' : 'Abrir menú'}</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
