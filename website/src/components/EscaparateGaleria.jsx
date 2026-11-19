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
    Promise.all(opciones.map((opcion) => api.fotos({ categoria: [opcion.valor], orden: 'populares', limite: 1 }).then((respuesta) => [opcion.valor, respuesta.fotos[0]?.archivo]).catch(() => [opcion.valor, null])))
      .then((respuesta) => setPortadas(Object.fromEntries(respuesta)));
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
        {opciones.map((opcion, numero) => {
          const activa = activas.includes(opcion.valor);
          return (
            <li key={opcion.valor} style={{ '--n': numero + 1 }}>
              <button type="button" className={`historias__boton ${activa ? 'historias__boton--activa' : ''}`} aria-pressed={activa} onClick={() => onElegir(opcion.valor)}>
                <span className="historias__aro"><span className="historias__foto"><Foto archivo={portadas[opcion.valor]} alt="" /></span></span>
                <span className="historias__nombre">{opcion.valor}</span>
                <span className="historias__cant">{opcion.cantidad} diseños</span>
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
  const nOpiniones = resumenes.reduce((suma, resumen) => suma + resumen.total, 0);
  const promedio = nOpiniones ? (resumenes.reduce((suma, resumen) => suma + resumen.promedio * resumen.total, 0) / nOpiniones).toFixed(1) : null;
  useEffect(() => { api.fotos({ orden: 'populares', limite: 14 }).then((respuesta) => setTop(respuesta.fotos)).catch(() => setTop([])); }, []);
  if (top.length < 5) return <div className="inspira inspira--cargando" aria-hidden="true" />;
  const vistas = top.reduce((suma, foto) => suma + (foto.vistas || 0), 0);
  const cinta = top.slice(0, 6);
  return (
    <>
      <section className="inspira" aria-labelledby="t-inspira">
        <span className="inspira__brillos" aria-hidden="true">{Array.from({ length: 10 }, (_, numero) => <i key={numero} style={{ '--n': numero, '--y': `${(numero * 29) % 90}%` }} />)}</span>
        <div className="inspira__texto">
          <p className="inspira__ante">Galería AH Nails</p>
          <h2 id="t-inspira"><Link to={`/galeria/${top[0].id}`} className="enlace-titulo">Encuentra tu próximo <em>set favorito</em></Link></h2>
          <p>Diseños reales hechos en el salón. Resérvalo igualito o llévalo en press-on.</p>
          <ul className="inspira__datos">
            <li><strong><Contador valor={total} /></strong> diseños</li>
            <li><strong><Contador valor={vistas} formato={(numero) => numero.toLocaleString('es-CR')} /></strong> vistas</li>
            {promedio && <li><strong>{promedio}★</strong> {nOpiniones} opiniones</li>}
          </ul>
          <div className="inspira__botones">
            <Link to="/disena" className="vitrina__boton">Diseña las tuyas</Link>
            <Link to="/reservar" className="inspira__secundario">Reservar cita</Link>
          </div>
        </div>
        <div className="inspira__collage">
          {top.slice(0, 5).map((foto, numero) => (
            <Link key={foto.id} to={`/galeria/${foto.id}`} className={`inspira__polaroid inspira__polaroid--${numero + 1}`} aria-label={foto.titulo}>
              <Foto archivo={foto.archivo} alt="" prioridad={numero < 2} />
              <span>{foto.titulo}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="tendencias" aria-labelledby="t-tendencias">
        <h2 id="t-tendencias" className="fila-titulo"><Link to="/galeria?orden=populares" className="enlace-titulo"><span className="tendencias__punto" aria-hidden="true" />Tendencias de la semana</Link></h2>
        <div className="tendencias__rejilla">
          <ul>
            {cinta.map((foto, numero) => (
              <li key={foto.id}>
                <Link to={`/galeria/${foto.id}`} className="tendencias__item">
                  <Foto archivo={foto.archivo} alt="" />
                  <span className="tendencias__rank">#{numero + 1}</span>
                  <span className="tendencias__info"><b>{foto.titulo}</b><small>{miles(foto.vistas)} vistas</small></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
