// Botón de corazón para guardar o quitar un diseño o producto de favoritos.
import { useState } from 'react';
import { useFavoritos } from '../context/FavoritosContext.jsx';

// Corazón para guardar en favoritos, con un pequeño estallido al marcarlo
// Nombre: BotonFavorito
// Descripción: Muestra el corazón de favoritos.
// Entrada: Tipo, datos y nombre.
// Salida: El botón.
// Objetivo: Guardar lo que gusta.
export default function BotonFavorito({ tipo, datos, nombre, clase = '' }) {
  const favoritos = useFavoritos();
  const [pop, setPop] = useState(0);
  const activo = favoritos.tiene(tipo, datos.id);
  // Nombre: tocar
  // Descripción: Guarda o quita de favoritos.
  // Entrada: El clic.
  // Salida: Nada.
  // Objetivo: Marcar favoritos.
  const tocar = (evento) => {
    evento.preventDefault(); evento.stopPropagation();
    if (!activo) setPop((anterior) => anterior + 1);
    favoritos.alternar(tipo, datos);
  };
  return (
    <button type="button" className={`corazon ${activo ? 'corazon--activo' : ''} ${clase}`} onClick={tocar} aria-pressed={activo}
            aria-label={activo ? `Quitar ${nombre} de favoritos` : `Guardar ${nombre} en favoritos`}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z" /></svg>
      {pop > 0 && <span key={pop} className="corazon__estallido" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ '--a': `${i * 60}deg` }} />)}</span>}
    </button>
  );
}
