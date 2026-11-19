// Aviso pequeño que aparece un momento (por ejemplo «Agregado al carrito»).
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext.jsx';

// Mensaje flotante cuando se agrega algo al carrito (también lo anuncia el lector de pantalla)
// Nombre: Aviso
// Descripción: Muestra mensajes cortos de aviso.
// Entrada: Nada.
// Salida: El aviso.
// Objetivo: Confirmar acciones.
export default function Aviso() {
  const { ultimo } = useCarrito();
  const irA = useNavigate();
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  // Al entrar al carrito el aviso ya no hace falta
  useEffect(() => { if (pathname === '/carrito') setVisible(false); }, [pathname]);
  useEffect(() => {
    if (!ultimo) return undefined;
    setVisible(true);
    const temporizador = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(temporizador);
  }, [ultimo?.marca]);

  return (
    <div className={`aviso-flotante ${visible ? 'aviso-flotante--visible' : ''}`} role="status" aria-live="polite">
      {ultimo && visible && (
        <>
          <span className="aviso-flotante__check" aria-hidden="true">✓</span>
          <span><strong>Agregado al carrito</strong><br />{ultimo.nombre}</span>
          {pathname !== '/carrito' && <button type="button" className="aviso-flotante__boton" onClick={() => irA('/carrito')}>Ver carrito</button>}
        </>
      )}
    </div>
  );
}
