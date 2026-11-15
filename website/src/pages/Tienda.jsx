import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useDebounce, useTitulo } from '../lib/hooks.js';
import VerMas, { Fantasmas } from '../components/VerMas.jsx';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import Desplegable from '../components/Desplegable.jsx';

const POR_PAGINA = 20; // 4 filas de 5 (o 5 de 4, o 10 de 2): las filas quedan llenas
const ORDENES = { relevancia: 'Relevancia', vendidos: 'Más vendidos', descuento: 'Mayor descuento', calificacion: 'Mejor calificados', 'precio-asc': 'Precio: menor a mayor', 'precio-desc': 'Precio: mayor a menor', nuevos: 'Más nuevos' };
const RANGOS = [['', '', 'Cualquier precio'], ['', '3000', 'Hasta ₡3 000'], ['3000', '8000', '₡3 000 a ₡8 000'], ['8000', '20000', '₡8 000 a ₡20 000'], ['20000', '', 'Más de ₡20 000']];

export default function Tienda() {
  useTitulo('Tienda');
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState(params.get('q') || '');
  const q = useDebounce(texto);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [cargandoMas, setCargandoMas] = useState(false);

  const categoria = params.get('categoria') || '';
  const orden = params.get('orden') || 'relevancia';
  const ofertas = params.get('ofertas') === '1';
  const disponibles = params.get('disponibles') === '1';
  const rango = RANGOS.find(([mn, mx]) => mn === (params.get('min') || '') && mx === (params.get('max') || '')) || RANGOS[0];

  const fijar = (cambios) => {
    const p = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
  };

  useEffect(() => { api.categoriasProductos().then(setCategorias).catch(() => {}); }, []);
  useEffect(() => { if ((params.get('q') || '') !== q.trim()) fijar({ q: q.trim() }); }, [q]);
  useEffect(() => {
    setCargando(true);
    api.productos(Object.fromEntries(params))
      .then((p) => { setProductos(p); setError(''); setVisibles(POR_PAGINA); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [params]);

  const limpiar = () => { setTexto(''); setParams({}, { replace: true }); };
  const hayFiltros = categoria || ofertas || disponibles || rango !== RANGOS[0];

  return (
    <div className="contenedor pagina pagina--resultados">
      <header className="resultados-cabeza">
        <div>
          <h1>{categoria || (ofertas ? 'Ofertas' : 'Tienda')}</h1>
          <p className="tenue">Productos profesionales para tus uñas y tus manos. Se retiran gratis en el salón.</p>
        </div>
        <label className="buscador buscador--chico">
          <span className="solo-lector">Buscar productos</span>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Busca: rubber base, lámpara, lima…" />
        </label>
      </header>

      <div className="barra-chips" role="group" aria-label="Filtros y orden">
        <button type="button" className={`chip-filtro ${ofertas ? 'chip-filtro--activo' : ''}`} aria-pressed={ofertas}
                onClick={() => fijar({ ofertas: ofertas ? '' : '1', orden: ofertas ? '' : 'descuento' })}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
          Ofertas que terminan hoy
        </button>
        <Desplegable etiqueta={<span>Ordenar por: <b>{ORDENES[orden]}</b></span>}>
          {(cerrar) => (
            <div className="desplegable__opciones" role="radiogroup" aria-label="Ordenar por">
              {Object.entries(ORDENES).map(([k, t]) => (
                <label key={k} className="casilla"><input type="radio" name="orden-tienda" checked={orden === k} onChange={() => { fijar({ orden: k === 'relevancia' ? '' : k }); cerrar(); }} /><span>{t}</span></label>
              ))}
            </div>
          )}
        </Desplegable>
        <Desplegable etiqueta={categoria ? `Categoría: ${categoria}` : 'Categoría'} activo={Boolean(categoria)}>
          {(cerrar) => (
            <div className="desplegable__opciones" role="radiogroup" aria-label="Categoría">
              <label className="casilla"><input type="radio" name="cat-tienda" checked={!categoria} onChange={() => { fijar({ categoria: '' }); cerrar(); }} /><span>Todas</span></label>
              {categorias.map((c) => (
                <label key={c.valor} className="casilla">
                  <input type="radio" name="cat-tienda" checked={categoria === c.valor} onChange={() => { fijar({ categoria: c.valor }); cerrar(); }} />
                  <span>{c.valor}</span><span className="casilla__cantidad">{c.cantidad}</span>
                </label>
              ))}
            </div>
          )}
        </Desplegable>
        <Desplegable etiqueta={rango === RANGOS[0] ? 'Precio' : rango[2]} activo={rango !== RANGOS[0]}>
          {(cerrar) => (
            <div className="desplegable__opciones" role="radiogroup" aria-label="Precio">
              {RANGOS.map((r) => (
                <label key={r[2]} className="casilla"><input type="radio" name="precio-tienda" checked={rango === r} onChange={() => { fijar({ min: r[0], max: r[1] }); cerrar(); }} /><span>{r[2]}</span></label>
              ))}
            </div>
          )}
        </Desplegable>
        <button type="button" className={`chip-filtro ${disponibles ? 'chip-filtro--activo' : ''}`} aria-pressed={disponibles} onClick={() => fijar({ disponibles: disponibles ? '' : '1' })}>
          Solo disponibles
        </button>
        {hayFiltros && <button type="button" className="chip-filtro chip-filtro--limpiar" onClick={limpiar}>Quitar filtros</button>}
      </div>

      <p className="tenue" aria-live="polite">{cargando ? 'Buscando…' : `${productos.length} ${productos.length === 1 ? 'producto' : 'productos'}`}</p>
      {error && <p role="alert" className="error">{error}</p>}
      {!cargando && productos.length === 0 && (
        <div className="vacio"><p>No hay productos con esos filtros.</p><button type="button" className="boton boton--contorno" onClick={limpiar}>Ver todos</button></div>
      )}
      <ul className="productos-rejilla productos-rejilla--grande">
        {productos.slice(0, visibles).map((p) => <TarjetaProducto key={p.id} p={p} />)}
        {cargandoMas && <Fantasmas n={Math.min(POR_PAGINA, productos.length - visibles)} />}
      </ul>
      <VerMas vistos={Math.min(visibles, productos.length)} total={productos.length} cargando={cargandoMas} cosa="productos" texto="Ver más productos"
              onClick={() => { setCargandoMas(true); setTimeout(() => { setVisibles((v) => v + POR_PAGINA); setCargandoMas(false); }, 450); }} />
    </div>
  );
}
