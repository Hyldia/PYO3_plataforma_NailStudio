import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useDebounce, useTitulo } from '../lib/hooks.js';
import Desplegable from '../components/Desplegable.jsx';
import VerMas, { Fantasmas } from '../components/VerMas.jsx';
import TarjetaDiseno from '../components/TarjetaDiseno.jsx';
import EscaparateGaleria, { HistoriasCategorias } from '../components/EscaparateGaleria.jsx';

const CAMPOS = [
  { clave: 'categoria', titulo: 'Tipo de servicio' },
  { clave: 'forma', titulo: 'Forma' },
  { clave: 'color', titulo: 'Color' },
  { clave: 'acabado', titulo: 'Acabado' }
];
const ORDENES = { recientes: 'Más recientes', populares: 'Más populares', antiguas: 'Más antiguos' };
const POR_PAGINA = 20; // 4 filas de 5 (o 5 de 4, o 10 de 2): las filas quedan llenas

export default function Galeria() {
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

  const lista = (clave) => (params.get(clave) || '').split(',').filter(Boolean);
  const orden = params.get('orden') || 'recientes';
  const activos = CAMPOS.flatMap((c) => lista(c.clave).map((v) => ({ clave: c.clave, valor: v })));

  const fijar = (clave, valor) => {
    const p = new URLSearchParams(params);
    if (!valor || (Array.isArray(valor) && !valor.length)) p.delete(clave);
    else p.set(clave, Array.isArray(valor) ? valor.join(',') : valor);
    setPagina(1);
    setParams(p, { replace: true });
  };
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
      .then((r) => { setResultado((prev) => ({ total: r.total, fotos: pagina === 1 ? r.fotos : [...prev.fotos, ...r.fotos] })); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [params, pagina]);

  const limpiar = () => { setTexto(''); setPagina(1); setParams({}, { replace: true }); };

  return (
    <div className="contenedor pagina pagina--resultados">
      <header className="resultados-cabeza">
        <div>
          <h1>Galería de diseños</h1>
          <p className="tenue">Toca un diseño para verlo en grande, reservarlo en el salón o llevarlo en press-on.</p>
        </div>
        <label className="buscador buscador--chico">
          <span className="solo-lector">Buscar en la galería</span>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Busca: francesa, nude, coffin, flores…" />
        </label>
      </header>

      {![...params.keys()].length && <EscaparateGaleria total={resultado.total} />}
      <HistoriasCategorias opciones={opciones.categoria || []} activas={lista('categoria')}
                           onElegir={(v) => fijar('categoria', v ? (lista('categoria').includes(v) && lista('categoria').length === 1 ? [] : [v]) : [])} />

      <div className="barra-chips" role="group" aria-label="Filtros y orden">
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
        {activos.length > 0 && <button type="button" className="chip-filtro chip-filtro--limpiar" onClick={limpiar}>Quitar filtros ({activos.length})</button>}
      </div>

      <p className="tenue" aria-live="polite">{cargando && pagina === 1 ? 'Buscando…' : `${resultado.total} diseños`}</p>
      {error && <p role="alert" className="error">{error}</p>}
      {!cargando && !error && resultado.total === 0 && (
        <div className="vacio"><p>No encontramos diseños con esos filtros.</p><button type="button" className="boton boton--contorno" onClick={limpiar}>Ver todos</button></div>
      )}

      <ul className="disenos-rejilla">
        {resultado.fotos.map((f, i) => <TarjetaDiseno key={f.id} foto={f} indice={i} />)}
        {cargando && pagina > 1 && <Fantasmas n={Math.min(POR_PAGINA, resultado.total - resultado.fotos.length)} />}
      </ul>
      <VerMas vistos={resultado.fotos.length} total={resultado.total} cargando={cargando} cosa="diseños" texto="Ver más diseños" onClick={() => setPagina(pagina + 1)} />
    </div>
  );
}
