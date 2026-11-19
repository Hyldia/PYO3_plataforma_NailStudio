import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useDebounce, useTitulo, usePorPagina } from '../lib/hooks.js';
import VerMas, { Fantasmas } from '../components/VerMas.jsx';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import Desplegable from '../components/Desplegable.jsx';
import { BannerOfertas, PodioVendidos, PortadaCategoria } from '../components/BannersTienda.jsx';
import EscaparateTienda from '../components/EscaparateTienda.jsx';
import Migas from '../components/Migas.jsx';

const POR_PAGINA_BASE = 20; // 4 filas de 5 (o 5 de 4, o 10 de 2): las filas quedan llenas
const ORDENES = { relevancia: 'Relevancia', vendidos: 'Más vendidos', descuento: 'Mayor descuento', calificacion: 'Mejor calificados', 'precio-asc': 'Precio: menor a mayor', 'precio-desc': 'Precio: mayor a menor', nuevos: 'Más nuevos' };
const RANGOS = [['', '', 'Cualquier precio'], ['', '3000', 'Hasta ₡3 000'], ['3000', '8000', '₡3 000 a ₡8 000'], ['8000', '20000', '₡8 000 a ₡20 000'], ['20000', '', 'Más de ₡20 000']];

// Nombre: Tienda
// Descripción: Muestra la tienda.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Comprar productos.
export default function Tienda() {
  const [rejilla, POR_PAGINA] = usePorPagina(4, POR_PAGINA_BASE); // filas completas, sin huecos
  useTitulo('Tienda');
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState(params.get('q') || '');
  const q = useDebounce(texto);
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);

  const categoria = params.get('categoria') || '';
  const orden = params.get('orden') || 'relevancia';
  const ofertas = params.get('ofertas') === '1';
  const disponibles = params.get('disponibles') === '1';
  const rango = RANGOS.find(([mn, mx]) => mn === (params.get('min') || '') && mx === (params.get('max') || '')) || RANGOS[0];

  // Nombre: fijar
  // Descripción: Cambia filtros de la tienda.
  // Entrada: Los cambios.
  // Salida: Nada.
  // Objetivo: Filtrar productos.
  const fijar = (cambios) => {
    const p = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setPagina(1);
    setParams(p, { replace: true });
  };

  useEffect(() => { api.categoriasProductos().then(setCategorias).catch(() => {}); }, []);
  useEffect(() => { if ((params.get('q') || '') !== q.trim()) fijar({ q: q.trim() }); }, [q]);
  useEffect(() => {
    setCargando(true);
    api.productos(Object.fromEntries(params))
      .then((p) => { setProductos(p); setError(''); setPagina(1); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [params]);

  // Nombre: limpiar
  // Descripción: Quita los filtros.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ver todo.
  const limpiar = () => { setTexto(''); setPagina(1); setParams({}, { replace: true }); };
  const hayFiltros = categoria || ofertas || disponibles || rango !== RANGOS[0] || orden !== 'relevancia';
  const vendidos = orden === 'vendidos';
  // Nombre: verVendidos
  // Descripción: Muestra u oculta los más vendidos.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ver lo más vendido.
  const verVendidos = () => fijar({ orden: vendidos ? '' : 'vendidos', ofertas: '' });
  const titulo = categoria || (ofertas ? 'Ofertas' : vendidos ? 'Más vendidos' : 'Tienda');
  const inicio = ![...params.keys()].filter((k) => k !== 'q').length; // escribir en el buscador no cambia la portada

  const barra = (
      <div className="barra-chips barra-filtros" role="group" aria-label="Filtros y orden">
        <button type="button" className={`chip-filtro chip-filtro--fuego ${vendidos ? 'chip-filtro--activo' : ''}`} aria-pressed={vendidos} onClick={verVendidos}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 5 5.5 5 10.5A5 5 0 0 1 7 13c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z" /></svg>
          Más vendidos
        </button>
        <button type="button" className={`chip-filtro chip-filtro--rayo ${ofertas ? 'chip-filtro--activo' : ''}`} aria-pressed={ofertas}
                onClick={() => fijar({ ofertas: ofertas ? '' : '1', orden: ofertas ? '' : 'descuento' })}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
          Ofertas del día
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
        <Desplegable etiqueta={categoria || 'Categoría'} activo={Boolean(categoria)}>
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
        {hayFiltros && <button type="button" className="chip-filtro chip-filtro--limpiar" onClick={limpiar} title="Quitar todos los filtros"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>Quitar</button>}
        <label className="buscador buscador--chico barra-filtros__buscar">
          <span className="solo-lector">Buscar productos</span>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar producto…" />
        </label>
        <p className="barra-filtros__cuenta" aria-live="polite">{cargando ? 'Buscando…' : `${productos.length} ${productos.length === 1 ? 'producto' : 'productos'}`}</p>
      </div>
  );

  return (
    <div className="contenedor pagina pagina--resultados">
      <h1 className="solo-lector">{titulo}</h1>
      <Migas pasos={titulo === 'Tienda' ? [['Tienda']] : [['Tienda', '/tienda'], [titulo]]} />
      {inicio ? <EscaparateTienda categorias={categorias}>{barra}</EscaparateTienda> : (
        <>
          {cargando && !productos.length ? <div className="vitrina vitrina--cargando" aria-hidden="true" />
            : ofertas ? <BannerOfertas productos={productos} />
            : vendidos ? <PodioVendidos productos={productos} categoria={categoria} />
            : <PortadaCategoria titulo={titulo} productos={productos} />}
          {barra}
        </>
      )}
      {inicio && <h2 className="fila-titulo fila-titulo--todos">{q.trim() ? `Resultados de «${q.trim()}»` : 'Todos los productos'}</h2>}
      {error && <p role="alert" className="error">{error}</p>}
      {!cargando && productos.length === 0 && (
        <div className="vacio"><p>No hay productos con esos filtros.</p><button type="button" className="boton boton--contorno" onClick={limpiar}>Ver todos</button></div>
      )}
      <ul ref={rejilla} className={`productos-rejilla productos-rejilla--grande ${ofertas ? 'productos-rejilla--ofertas' : ''}`} key={`${orden}-${ofertas}`}>
        {productos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((p, i) => <TarjetaProducto key={p.id} p={p} puesto={vendidos && (pagina - 1) * POR_PAGINA + i < 20 ? (pagina - 1) * POR_PAGINA + i + 1 : undefined} oferta={ofertas} />)}
        {cargando && <Fantasmas n={Math.min(POR_PAGINA, productos.length)} />}
      </ul>
      <VerMas pagina={pagina} paginas={Math.ceil(productos.length / POR_PAGINA)} cargando={cargando}
              onCambiar={(n) => {
                setPagina(n);
                requestAnimationFrame(() => {
                  const rejilla = document.querySelector('.productos-rejilla');
                  const encabezado = document.querySelector('.encabezado');
                  const margen = encabezado?.offsetHeight || 76;
                  const posicion = rejilla ? rejilla.getBoundingClientRect().top + window.scrollY - margen : 0;
                  window.scrollTo({ top: Math.max(0, posicion), behavior: 'smooth' });
                });
              }} />
    </div>
  );
}
