import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import Foto from '../components/Foto.jsx';

// Búsqueda general: servicios, productos y fotos de la galería
export default function Buscar() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  useTitulo(`Resultados para «${q}»`);
  const [r, setR] = useState({ servicios: [], productos: [], fotos: [], cargando: true });

  useEffect(() => {
    setR((x) => ({ ...x, cargando: true }));
    const t = q.toLowerCase();
    Promise.all([api.servicios(), api.productos({ q }), api.fotos({ q, limite: 12 })])
      .then(([s, p, f]) => setR({
        servicios: s.filter((x) => `${x.nombre} ${x.descripcion} ${x.incluye} ${x.categoria}`.toLowerCase().includes(t)),
        productos: p, fotos: f.fotos, cargando: false
      }))
      .catch(() => setR({ servicios: [], productos: [], fotos: [], cargando: false }));
  }, [q]);

  const total = r.servicios.length + r.productos.length + r.fotos.length;
  return (
    <div className="contenedor pagina">
      <header className="pagina__cabeza">
        <h1>Resultados para «{q}»</h1>
        <p className="tenue" aria-live="polite">{r.cargando ? 'Buscando…' : `${total} resultados`}</p>
      </header>
      {!r.cargando && total === 0 && (
        <div className="vacio"><p>No encontramos nada con esa palabra. Prueba con «gel», «pedicure» o «lima».</p><Link to="/tienda" className="boton boton--contorno">Ver la tienda</Link></div>
      )}
      {r.servicios.length > 0 && (
        <section aria-labelledby="b-serv" className="resultado-bloque">
          <h2 id="b-serv">Servicios ({r.servicios.length})</h2>
          <ul className="servicios-lista">
            {r.servicios.map((s) => (
              <li key={s.id}>
                <div><h3>{s.nombre}</h3><p className="tenue">{s.descripcion}</p></div>
                <div className="servicios-lista__accion">
                  <p className="servicios-lista__precio">{dinero(s.precio_oferta ?? s.precio)}<span className="tenue">{s.duracion_min} min</span></p>
                  <Link to={`/reservar?servicio=${s.id}`} className="boton boton--chico">Reservar</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {r.productos.length > 0 && (
        <section aria-labelledby="b-prod" className="resultado-bloque">
          <h2 id="b-prod">Productos ({r.productos.length})</h2>
          <ul className="productos-rejilla">{r.productos.slice(0, 24).map((p) => <TarjetaProducto key={p.id} p={p} />)}</ul>
          {r.productos.length > 24 && <Link to={`/tienda?q=${encodeURIComponent(q)}`} className="enlace">Ver los {r.productos.length} productos en la tienda</Link>}
        </section>
      )}
      {r.fotos.length > 0 && (
        <section aria-labelledby="b-fotos" className="resultado-bloque">
          <h2 id="b-fotos">Diseños en la galería</h2>
          <ul className="mosaico">
            {r.fotos.map((f) => (
              <li key={f.id}><Link to={`/galeria?q=${encodeURIComponent(q)}`} className="mosaico__boton"><Foto archivo={f.archivo} alt={f.titulo} /><span className="mosaico__titulo">{f.titulo}</span></Link></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
