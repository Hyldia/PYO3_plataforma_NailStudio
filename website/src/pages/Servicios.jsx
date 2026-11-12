import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';

export default function Servicios() {
  useTitulo('Servicios y precios');
  const [servicios, setServicios] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api.servicios().then(setServicios).catch((e) => setError(e.message)); }, []);

  const grupos = servicios.reduce((acc, s) => ({ ...acc, [s.categoria]: [...(acc[s.categoria] || []), s] }), {});

  return (
    <div className="contenedor pagina">
      <header className="pagina__cabeza">
        <h1>Servicios y precios</h1>
        <p className="tenue">Los diseños especiales (francesa, pedrería, chrome) tienen un recargo que ves al personalizar tu diseño.</p>
      </header>
      {error && <p role="alert" className="error">{error}</p>}
      {Object.entries(grupos).map(([categoria, lista]) => (
        <section key={categoria} className="carta" aria-labelledby={`cat-${categoria}`}>
          <h2 id={`cat-${categoria}`}>{categoria}</h2>
          <ul className="servicios-lista">
            {lista.map((s) => (
              <li key={s.id}>
                <div>
                  <h3>{s.nombre}</h3>
                  <p className="tenue">{s.descripcion}</p>
                </div>
                <div className="servicios-lista__accion">
                  <p className="servicios-lista__precio">{dinero(s.precio)}<span className="tenue">{s.duracion_min} min</span></p>
                  <Link to={`/reservar?servicio=${s.id}`} className="boton boton--contorno boton--chico">Reservar<span className="solo-lector"> {s.nombre}</span></Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
