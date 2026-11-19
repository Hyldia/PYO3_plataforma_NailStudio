// Página de resultados del buscador: diseños, productos y servicios que coinciden con lo escrito.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import Foto from '../components/Foto.jsx';
import Migas from '../components/Migas.jsx';

// Búsqueda general: servicios, productos y fotos de la galería
// Nombre: Buscar
// Descripción: Muestra los resultados de búsqueda.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Encontrar de todo.
export default function Buscar() {
  const [params] = useSearchParams();
  const busqueda = params.get('q') || '';
  useTitulo(`Resultados para «${busqueda}»`);
  const [resultados, setResultados] = useState({ servicios: [], productos: [], fotos: [], cargando: true });

  useEffect(() => {
    setResultados((anterior) => ({ ...anterior, cargando: true }));
    const buscado = busqueda.toLowerCase();
    Promise.all([api.servicios(), api.productos({ q: busqueda }), api.fotos({ q: busqueda, limite: 12 })])
      .then(([s, p, f]) => setResultados({
        servicios: s.filter((servicio) => `${servicio.nombre} ${servicio.descripcion} ${servicio.incluye} ${servicio.categoria}`.toLowerCase().includes(buscado)),
        productos: p, fotos: f.fotos, cargando: false
      }))
      .catch(() => setResultados({ servicios: [], productos: [], fotos: [], cargando: false }));
  }, [busqueda]);

  const total = resultados.servicios.length + resultados.productos.length + resultados.fotos.length;
  return (
    <div className="contenedor pagina">
      <Migas pasos={[['Resultados de búsqueda']]} />
      <header className="pagina__cabeza">
        <h1>Resultados para «{busqueda}»</h1>
        <p className="tenue" aria-live="polite">{resultados.cargando ? 'Buscando…' : `${total} resultados`}</p>
      </header>
      {!resultados.cargando && total === 0 && (
        <div className="vacio"><p>No encontramos nada con esa palabra. Prueba con «gel», «pedicure» o «lima».</p><Link to="/tienda" className="boton boton--contorno">Ver la tienda</Link></div>
      )}
      {resultados.servicios.length > 0 && (
        <section aria-labelledby="b-serv" className="resultado-bloque">
          <h2 id="b-serv">Servicios ({resultados.servicios.length})</h2>
          <ul className="servicios-lista">
            {resultados.servicios.map((servicio) => (
              <li key={servicio.id}>
                <div><h3>{servicio.nombre}</h3><p className="tenue">{servicio.descripcion}</p></div>
                <div className="servicios-lista__accion">
                  <p className="servicios-lista__precio">{dinero(servicio.precio_oferta ?? servicio.precio)}<span className="tenue">{servicio.duracion_min} min</span></p>
                  <Link to={`/reservar?servicio=${servicio.id}`} className="boton boton--chico">Reservar</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {resultados.productos.length > 0 && (
        <section aria-labelledby="b-prod" className="resultado-bloque">
          <h2 id="b-prod">Productos ({resultados.productos.length})</h2>
          <ul className="productos-rejilla">{resultados.productos.slice(0, 24).map((producto) => <TarjetaProducto key={producto.id} p={producto} />)}</ul>
          {resultados.productos.length > 24 && <Link to={`/tienda?q=${encodeURIComponent(busqueda)}`} className="enlace">Ver los {resultados.productos.length} productos en la tienda</Link>}
        </section>
      )}
      {resultados.fotos.length > 0 && (
        <section aria-labelledby="b-fotos" className="resultado-bloque">
          <h2 id="b-fotos">Diseños en la galería</h2>
          <ul className="mosaico">
            {resultados.fotos.map((foto) => (
              <li key={foto.id}><Link to={`/galeria?q=${encodeURIComponent(busqueda)}`} className="mosaico__boton"><Foto archivo={foto.archivo} alt={foto.titulo} /><span className="mosaico__titulo">{foto.titulo}</span></Link></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
