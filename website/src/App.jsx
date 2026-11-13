import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Encabezado from './components/Encabezado.jsx';
import Pie from './components/Pie.jsx';
import CarritoPanel from './components/CarritoPanel.jsx';
import Inicio from './pages/Inicio.jsx';
import Servicios from './pages/Servicios.jsx';
import Galeria from './pages/Galeria.jsx';
import Disena from './pages/Disena.jsx';
import Reservar from './pages/Reservar.jsx';
import Tienda from './pages/Tienda.jsx';
import Contacto from './pages/Contacto.jsx';
import Admin from './pages/Admin.jsx';
import NoEncontrada from './pages/NoEncontrada.jsx';
import ProductoDetalle from './pages/ProductoDetalle.jsx';

export default function App() {
  const { pathname } = useLocation();
  const main = useRef(null);
  const primera = useRef(true);

  // Accesibilidad: al cambiar de página, el foco pasa al contenido nuevo
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <Encabezado />
      <main id="contenido" ref={main} tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/galeria" element={<Galeria />} />
          <Route path="/disena" element={<Disena />} />
          <Route path="/reservar" element={<Reservar />} />
          <Route path="/tienda" element={<Tienda />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NoEncontrada />} />
          <Route path="/tienda/:id" element={<ProductoDetalle/>}/>
        </Routes>
      </main>
      <Pie />
      <CarritoPanel />
    </>
  );
}
