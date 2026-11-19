// Ruta de navegación ("Inicio › Tienda › Ofertas"): muestra dónde está la persona y la lleva de vuelta.
// pasos: lista de [texto, enlace]; el último es la página actual (sin enlace).
import { Link } from 'react-router-dom';

const Casa = () => <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11.5 12 5l8 6.5" /><path d="M6.5 10v9h11v-9" /></svg>;

export default function Migas({ pasos = [], className = '' }) {
  return (
    <nav aria-label="Ruta" className={`migas ${className}`}>
      <ol>
        <li><Link to="/"><Casa />Inicio</Link></li>
        {pasos.map(([texto, to], i) => (
          <li key={texto} aria-current={i === pasos.length - 1 ? 'page' : undefined}>
            {to && i < pasos.length - 1 ? <Link to={to}>{texto}</Link> : texto}
          </li>
        ))}
      </ol>
    </nav>
  );
}
