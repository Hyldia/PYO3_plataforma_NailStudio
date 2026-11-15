import { SALON } from '../config.js';

// Logo: monograma «AH» en letra cursiva y la palabra NAILS en mayúsculas espaciadas,
// separados por una línea fina. Si el salón tiene un logo en imagen, reemplacen este componente
// por <img src="/logo.svg" alt={SALON.nombre} />.
export default function Logo({ claro = false }) {
  return (
    <span className={`logo ${claro ? 'logo--claro' : ''}`} aria-label={SALON.nombre} role="img">
      <span className="logo__monograma" aria-hidden="true">AH</span>
      <span className="logo__separador" aria-hidden="true" />
      <span className="logo__palabra" aria-hidden="true">
        <span className="logo__nails">Nails</span>
        <span className="logo__studio">studio</span>
      </span>
    </span>
  );
}
