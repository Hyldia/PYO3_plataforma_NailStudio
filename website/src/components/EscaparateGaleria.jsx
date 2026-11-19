// Escaparate animado de la galería: portada con collage de fotos que flotan, categorías tipo "historias"
// y una cinta de tendencias que se desliza sola.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import Foto from './Foto.jsx';
import Contador from './Contador.jsx';
import { miles } from './TarjetaDiseno.jsx';
import { useResumenes } from '../lib/resumenesOpiniones.js';

// Nombre: HistoriasCategorias
// Descripción: Muestra las categorías en círculos.
// Entrada: Opciones y elegidas.
// Salida: Los círculos.
// Objetivo: Filtrar la galería.
export function HistoriasCategorias({ opciones, activas, onElegir }) {
  const [portadas, setPortadas] = useState({});
  useEffect(() => {
    if (!opciones.length) return;
    Promise.all(opciones.map((o) => api.fotos({ categoria: [o.valor], orden: 'populares', limite: 1 }).then((respuesta) => [o.valor, respuesta.fotos[0]?.archivo]).catch(() => [o.valor, null])))
      .then((p) => setPortadas(Object.fromEntries(p)));
  }, [opciones.length]);
  if (!opciones.length) return null;
  const todas = !activas.length;
  return (
    <nav className="historias" aria-label="Categorías de diseños">
      <ul>
        <li style={{ '--n': 0 }}>
          <button type="button" className={`historias__boton ${todas ? 'historias__boton--activa' : ''}`} aria-pressed={todas} onClick={() => onElegir(null)}>
            <span className="historias__aro"><span className="historias__foto historias__foto--todas"><svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg></span></span>
            <span className="historias__nombre">Todos</span>
          </button>
        </li>
        {opciones.map((o, n) => {
          const activa = activas.includes(o.valor);
          return (
            <li key={o.valor} style={{ '--n': n + 1 }}>
              <button type="button" className={`historias__boton ${activa ? 'historias__boton--activa' : ''}`} aria-pressed={activa} onClick={() => onElegir(o.valor)}>
                <span className="historias__aro"><span className="historias__foto"><Foto archivo={portadas[o.valor]} alt="" /></span></span>
                <span className="historias__nombre">{o.valor}</span>
                <span className="historias__cant">{o.cantidad} diseños</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Nombre: EscaparateGaleria
// Descripción: Muestra la portada y tendencias de la galería.
// Entrada: El total de diseños.
// Salida: La portada.
// Objetivo: Inspirar a la clienta.
export default function EscaparateGaleria({ total }) {
  const [top, setTop] = useState([]);
  const resumenes = [...useResumenes('foto').values()];
  const nOpiniones = resumenes.reduce((s, r) => s + r.total, 0);
  const promedio = nOpiniones ? (resumenes.reduce((s, r) => s + r.promedio * r.total, 0) / nOpiniones).toFixed(1) : null;
  useEffect(() => { api.fotos({ orden: 'populares', limite: 14 }).then((respuesta) => setTop(respuesta.fotos)).catch(() => setTop([])); }, []);
  if (top.length < 5) return <div className="inspira inspira--cargando" aria-hidden="true" />;
  const vistas = top.reduce((s, f) => s + (f.vistas || 0), 0);
  const cinta = top.slice(0, 6);
  return (
    <>
      <section className="inspira" aria-labelledby="t-inspira">
        <span className="inspira__brillos" aria-hidden="true">{Array.from({ length: 10 }, (_, n) => <i key={n} style={{ '--n': n, '--y': `${(n * 29) % 90}%` }} />)}</span>
        <div className="inspira__texto">
          <p className="inspira__ante">Galería AH Nails</p>
          <h2 id="t-inspira"><Link to={`/galeria/${top[0].id}`} className="enlace-titulo">Encuentra tu próximo <em>set favorito</em></Link></h2>
          <p>Diseños reales hechos en el salón. Resérvalo igualito o llévalo en press-on.</p>
          <ul className="inspira__datos">
            <li><strong><Contador valor={total} /></strong> diseños</li>
            <li><strong><Contador valor={vistas} formato={(n) => n.toLocaleString('es-CR')} /></strong> vistas</li>
            {promedio && <li><strong>{promedio}★</strong> {nOpiniones} opiniones</li>}
          </ul>
          <div className="inspira__botones">
            <Link to="/disena" className="vitrina__boton">Diseña las tuyas</Link>
            <Link to="/reservar" className="inspira__secundario">Reservar cita</Link>
          </div>
        </div>
        <div className="inspira__collage">
          {top.slice(0, 5).map((f, n) => (
            <Link key={f.id} to={`/galeria/${f.id}`} className={`inspira__polaroid inspira__polaroid--${n + 1}`} aria-label={f.titulo}>
              <Foto archivo={f.archivo} alt="" prioridad={n < 2} />
              <span>{f.titulo}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="tendencias" aria-labelledby="t-tendencias">
        <h2 id="t-tendencias" className="fila-titulo"><Link to="/galeria?orden=populares" className="enlace-titulo"><span className="tendencias__punto" aria-hidden="true" />Tendencias de la semana</Link></h2>
        <div className="tendencias__rejilla">
          <ul>
            {cinta.map((f, n) => (
              <li key={f.id}>
                <Link to={`/galeria/${f.id}`} className="tendencias__item">
                  <Foto archivo={f.archivo} alt="" />
                  <span className="tendencias__rank">#{n + 1}</span>
                  <span className="tendencias__info"><b>{f.titulo}</b><small>{miles(f.vistas)} vistas</small></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
