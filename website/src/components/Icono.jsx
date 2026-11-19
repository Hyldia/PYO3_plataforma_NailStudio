// Íconos dibujados (en vez de emojis): se ven iguales en todos los teléfonos y toman el color del texto.
const TRAZOS = {
  bolsa: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  candado: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  pincel: <><path d="M14.5 4.5 19.5 9.5 11 18l-5 1 1-5z" /><path d="M13 6l5 5" /></>,
  regalo: <><rect x="4" y="10" width="16" height="10" rx="1.5" /><path d="M3 7h18v3H3zM12 7v13" /><path d="M12 7C10 3 6.5 3.5 7 6c.3 1.2 3 1 5 1zm0 0c2-4 5.5-3.5 5-1-.3 1.2-3 1-5 1z" /></>,
  trofeo: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" /></>,
  fuego: <path d="M12 21c-4 0-6.5-2.6-6.5-6 0-3.5 2.6-5.3 3.5-8.5 2 1.2 3 3 3 5 .8-.6 1.5-1.8 1.6-3.2 2.4 1.8 4.9 4.1 4.9 7 0 3.4-2.5 5.7-6.5 5.7z" />,
  alerta: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.2v.3" /></>
};

// Nombre: Icono
// Descripción: Dibuja un ícono por nombre.
// Entrada: Nombre y tamaño.
// Salida: El ícono.
// Objetivo: Usar íconos en vez de emojis.
export default function Icono({ nombre, tam = 18, className = '' }) {
  return (
    <svg aria-hidden="true" width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={`icono ${className}`}>
      {TRAZOS[nombre]}
    </svg>
  );
}
