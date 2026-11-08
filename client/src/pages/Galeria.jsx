import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useDebounce, useTitulo, useUsarFoto } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import FiltroCasillas from '../components/FiltroCasillas.jsx';
import VisorFoto from '../components/VisorFoto.jsx';

const CAMPOS = [
  { clave: 'categoria', titulo: 'Tipo de servicio' },
  { clave: 'forma', titulo: 'Forma' },
  { clave: 'color', titulo: 'Color' },
  { clave: 'acabado', titulo: 'Acabado' }
];

export default function Galeria() {
  useTitulo('Galería');
  // Los filtros viven en la URL: se pueden compartir y sobreviven a recargar
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState(params.get('q') || '');
  const q = useDebounce(texto);
  const [opciones, setOpciones] = useState({});
  const [resultado, setResultado] = useState({ total: 0, fotos: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [visor, setVisor] = useState(null);
  const [panel, setPanel] = useState(false);
  const usarFoto = useUsarFoto();

  const lista = (clave) => (params.get(clave) || '').split(',').filter(Boolean);
  const orden = params.get('orden') || 'recientes';
  const activos = CAMPOS.flatMap((c) => lista(c.clave).map((v) => ({ clave: c.clave, valor: v })));

  const fijar = (clave, valor) => {
    const p = new URLSearchParams(params);
    if (!valor || (Array.isArray(valor) && !valor.length)) p.delete(clave);
    else p.set(clave, Array.isArray(valor) ? valor.join(',') : valor);
    setParams(p, { replace: true });
  };

  useEffect(() => { api.filtrosFotos().then(setOpciones).catch(() => {}); }, []);
  useEffect(() => { fijar('q', q.trim()); }, [q]);

  useEffect(() => {
    setCargando(true);
    const filtros = Object.fromEntries(CAMPOS.map((c) => [c.clave, lista(c.clave)]));
    api.fotos({ ...filtros, q: params.get('q') || '', orden, limite: 100 })
      .then((r) => { setResultado(r); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [params]);

  const limpiar = () => { setTexto(''); setParams({}, { replace: true }); };

  return (
    <div className="contenedor pagina">
      <header className="pagina__cabeza">
        <h1>Galería</h1>
        <p className="tenue">Trabajos hechos en el salón. Toca una foto para verla en grande y reservar ese diseño.</p>
      </header>

      <div className="barra-busqueda">
        <label className="buscador">
          <span className="solo-lector">Buscar en la galería</span>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Busca: francesa, nude, coffin, flores…" />
        </label>
        <button type="button" className="boton boton--contorno boton-filtros" aria-expanded={panel} aria-controls="filtros-galeria" onClick={() => setPanel(!panel)}>
          Filtros{activos.length > 0 && ` (${activos.length})`}
        </button>
        <label className="ordenar">
          <span>Ordenar por</span>
          <select value={orden} onChange={(e) => fijar('orden', e.target.value === 'recientes' ? '' : e.target.value)}>
            <option value="recientes">Más recientes</option>
            <option value="populares">Más vistos</option>
            <option value="antiguas">Más antiguos</option>
          </select>
        </label>
      </div>

      <div className="catalogo">
        <aside id="filtros-galeria" className={`catalogo__filtros ${panel ? 'catalogo__filtros--abierto' : ''}`} aria-label="Filtros">
          {CAMPOS.map((c) => (
            <FiltroCasillas key={c.clave} titulo={c.titulo} opciones={opciones[c.clave]} seleccion={lista(c.clave)} onCambio={(v) => fijar(c.clave, v)} />
          ))}
          {activos.length > 0 && <button type="button" className="enlace enlace--boton" onClick={limpiar}>Quitar todos los filtros</button>}
        </aside>

        <section className="catalogo__resultados" aria-labelledby="conteo">
          <div className="resultados__cabeza">
            <p id="conteo" aria-live="polite">{cargando ? 'Buscando…' : `${resultado.total} ${resultado.total === 1 ? 'foto' : 'fotos'}`}</p>
            {activos.length > 0 && (
              <ul className="filtros-activos" aria-label="Filtros aplicados">
                {activos.map((a) => (
                  <li key={a.clave + a.valor}>
                    <button type="button" className="filtro-activo" onClick={() => fijar(a.clave, lista(a.clave).filter((v) => v !== a.valor))}>
                      {a.valor}<span className="solo-lector">, quitar filtro</span>
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p role="alert" className="error">{error}</p>}
          {!cargando && !error && resultado.total === 0 && (
            <div className="vacio">
              <p>No encontramos fotos con esos filtros.</p>
              <button type="button" className="boton boton--contorno" onClick={limpiar}>Ver todas las fotos</button>
            </div>
          )}

          <ul className="mosaico mosaico--galeria">
            {resultado.fotos.map((f, i) => (
              <li key={f.id}>
                <button type="button" className="mosaico__boton" onClick={() => setVisor(i)}>
                  <Foto archivo={f.archivo} alt={f.titulo} />
                  <span className="mosaico__titulo">{f.titulo}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {visor !== null && (
        <VisorFoto fotos={resultado.fotos} indice={visor} onCambiar={setVisor} onCerrar={() => setVisor(null)} onReservar={usarFoto} />
      )}
    </div>
  );
}
