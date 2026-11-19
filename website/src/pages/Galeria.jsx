import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useDebounce, useTitulo, usePorPagina } from '../lib/hooks.js';
import Desplegable from '../components/Desplegable.jsx';
import VerMas, { Fantasmas } from '../components/VerMas.jsx';
import TarjetaDiseno from '../components/TarjetaDiseno.jsx';
import EscaparateGaleria from '../components/EscaparateGaleria.jsx';
import Migas from '../components/Migas.jsx';

const CAMPOS = [
  { clave: 'categoria', titulo: 'Tipo de servicio' },
  { clave: 'forma', titulo: 'Forma' },
  { clave: 'color', titulo: 'Color' },
  { clave: 'acabado', titulo: 'Acabado' }
];
const ORDENES = { recientes: 'Más recientes', populares: 'Más populares', antiguas: 'Más antiguos' };
const POR_PAGINA_BASE = 20; // 4 filas de 5 (o 5 de 4, o 10 de 2): las filas quedan llenas

// Nombre: Galeria
// Descripción: Muestra la galería de diseños.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Inspirar a la clienta.
export default function Galeria() {
  const [rejilla, POR_PAGINA] = usePorPagina(4, POR_PAGINA_BASE); // filas completas, sin huecos
  useTitulo('Galería');
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState(params.get('q') || '');
  const q = useDebounce(texto);
  const [opciones, setOpciones] = useState({});
  const [resultado, setResultado] = useState({ total: 0, fotos: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [presson, setPresson] = useState(null);
  const [pagina, setPagina] = useState(1);

  // Nombre: lista
  // Descripción: Lee una lista de filtros.
  // Entrada: El nombre del filtro.
  // Salida: Los valores.
  // Objetivo: Filtrar diseños.
  const lista = (clave) => (params.get(clave) || '').split(',').filter(Boolean);
  const orden = params.get('orden') || 'recientes';
  const activos = CAMPOS.flatMap((c) => lista(c.clave).map((v) => ({ clave: c.clave, valor: v })));

  // Nombre: fijar
  // Descripción: Cambia un filtro.
  // Entrada: El filtro y el valor.
  // Salida: Nada.
  // Objetivo: Filtrar diseños.
  const fijar = (clave, valor) => {
    const p = new URLSearchParams(params);
    if (!valor || (Array.isArray(valor) && !valor.length)) p.delete(clave);
    else p.set(clave, Array.isArray(valor) ? valor.join(',') : valor);
    setPagina(1);
    setParams(p, { replace: true });
  };
  // Nombre: alternar
  // Descripción: Marca o desmarca un filtro.
  // Entrada: El filtro y el valor.
  // Salida: Nada.
  // Objetivo: Filtrar diseños.
  const alternar = (clave, valor) => fijar(clave, lista(clave).includes(valor) ? lista(clave).filter((v) => v !== valor) : [...lista(clave), valor]);

  useEffect(() => {
    api.filtrosFotos().then(setOpciones).catch(() => {});
    // Precio del press-on, para el botón de carrito de cada diseño
    api.productos({ q: 'Press-on personalizado' }).then((l) => setPresson(l.find((p) => p.nombre.startsWith('Press-on personalizado')) || null)).catch(() => {});
  }, []);
  useEffect(() => { fijar('q', q.trim()); }, [q]);

  useEffect(() => {
    setCargando(true);
    const filtros = Object.fromEntries(CAMPOS.map((c) => [c.clave, lista(c.clave)]));
    api.fotos({ ...filtros, q: params.get('q') || '', orden, limite: POR_PAGINA, pagina })
      .then((respuesta) => { setResultado({ total: respuesta.total, fotos: respuesta.fotos }); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [params, pagina, POR_PAGINA]);

  // La portada siempre muestra el total de la galería, no el de los filtros
  const totalGaleria = useRef(0);
  if (!activos.length && !params.get('q') && !cargando) totalGaleria.current = resultado.total;

  // Nombre: limpiar
  // Descripción: Quita los filtros.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ver todo.
  const limpiar = () => { setTexto(''); setPagina(1); setParams({}, { replace: true }); };

  return (
    <div className="contenedor pagina pagina--resultados">
      <h1 className="solo-lector">Galería de diseños</h1>
      <Migas pasos={[['Galería']]} />
      <EscaparateGaleria total={totalGaleria.current || resultado.total} />

      <div className="barra-chips barra-filtros" role="group" aria-label="Filtros y orden">
        <button type="button" className={`chip-filtro ${orden === 'populares' ? 'chip-filtro--activo' : ''}`} aria-pressed={orden === 'populares'}
                onClick={() => fijar('orden', orden === 'populares' ? '' : 'populares')}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
          Los más populares
        </button>
        <Desplegable etiqueta={<span>Ordenar por: <b>{ORDENES[orden]}</b></span>}>
          {(cerrar) => (
            <div className="desplegable__opciones" role="radiogroup" aria-label="Ordenar por">
              {Object.entries(ORDENES).map(([k, t]) => (
                <label key={k} className="casilla"><input type="radio" name="orden-galeria" checked={orden === k} onChange={() => { fijar('orden', k === 'recientes' ? '' : k); cerrar(); }} /><span>{t}</span></label>
              ))}
            </div>
          )}
        </Desplegable>
        {CAMPOS.map((c) => (opciones[c.clave]?.length ? (
          <Desplegable key={c.clave} etiqueta={`${c.titulo}${lista(c.clave).length ? ` (${lista(c.clave).length})` : ''}`} activo={lista(c.clave).length > 0}>
            <fieldset className="desplegable__opciones">
              <legend className="solo-lector">{c.titulo}</legend>
              {opciones[c.clave].map((o) => (
                <label key={o.valor} className="casilla">
                  <input type="checkbox" checked={lista(c.clave).includes(o.valor)} onChange={() => alternar(c.clave, o.valor)} />
                  <span>{o.valor}</span><span className="casilla__cantidad">{o.cantidad}</span>
                </label>
              ))}
            </fieldset>
          </Desplegable>
        ) : null))}
        {activos.length > 0 && <button type="button" className="chip-filtro chip-filtro--limpiar" onClick={limpiar} title="Quitar todos los filtros"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>Quitar</button>}
        <label className="buscador buscador--chico barra-filtros__buscar">
          <span className="solo-lector">Buscar en la galería</span>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={texto} onChange={(evento) => setTexto(evento.target.value)} placeholder="Buscar diseño…" />
        </label>
        <p className="barra-filtros__cuenta" aria-live="polite">{cargando && pagina === 1 ? 'Buscando…' : `${resultado.total} diseños`}</p>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      {!cargando && !error && resultado.total === 0 && (
        <div className="vacio"><p>No encontramos diseños con esos filtros.</p><button type="button" className="boton boton--contorno" onClick={limpiar}>Ver todos</button></div>
      )}

      <ul ref={rejilla} className="disenos-rejilla">
        {resultado.fotos.map((f, i) => <TarjetaDiseno key={f.id} foto={f} indice={i} />)}
        {cargando && pagina > 1 && <Fantasmas n={Math.min(POR_PAGINA, resultado.total - resultado.fotos.length)} />}
      </ul>
      <VerMas pagina={pagina} paginas={Math.ceil(resultado.total / POR_PAGINA)} cargando={cargando}
              onCambiar={(n) => {
                setPagina(n);
                requestAnimationFrame(() => {
                  const rejilla = document.querySelector('.disenos-rejilla');
                  const encabezado = document.querySelector('.encabezado');
                  const margen = encabezado?.offsetHeight || 76;
                  const posicion = rejilla ? rejilla.getBoundingClientRect().top + window.scrollY - margen : 0;
                  window.scrollTo({ top: Math.max(0, posicion), behavior: 'smooth' });
                });
              }} />
    </div>
  );
}
