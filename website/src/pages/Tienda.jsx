import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import { useDebounce, useTitulo } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import { Link } from 'react-router-dom';

export default function Tienda() {
  useTitulo('Tienda');
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState(params.get('q') || '');
  const q = useDebounce(texto);
  const [precio, setPrecio] = useState({ min: params.get('min') || '', max: params.get('max') || '' });
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const [panel, setPanel] = useState(false);
  const carrito = useCarrito();

  const categoria = params.get('categoria') || 'Todas';
  const orden = params.get('orden') || 'relevancia';
  const disponibles = params.get('disponibles') === '1';

  const fijar = (cambios) => {
    const p = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
  };

  useEffect(() => { api.categoriasProductos().then(setCategorias).catch(() => {}); }, []);
  useEffect(() => { fijar({ q: q.trim() }); }, [q]);
  useEffect(() => {
    setCargando(true);
    api.productos(Object.fromEntries(params))
      .then((p) => { setProductos(p); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [params]);

  const aplicarPrecio = (e) => { e.preventDefault(); fijar({ min: precio.min, max: precio.max }); };
  const agregar = (p) => { carrito.agregar(p); setAviso(`${p.nombre} se agregó al carrito.`); };
  const limpiar = () => { setTexto(''); setPrecio({ min: '', max: '' }); setParams({}, { replace: true }); };

  return (
    <div className="contenedor pagina">
      <header className="pagina__cabeza">
        <h1>Tienda</h1>
        <p className="tenue">Productos que usamos en el salón, para mantener tus uñas en casa. Se retiran en el local.</p>
      </header>

      <div className="barra-busqueda">
        <label className="buscador">
          <span className="solo-lector">Buscar productos</span>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Busca un producto o una marca" />
        </label>
        <button type="button" className="boton boton--contorno boton-filtros" aria-expanded={panel} aria-controls="filtros-tienda" onClick={() => setPanel(!panel)}>Filtros</button>
        <label className="ordenar">
          <span>Ordenar por</span>
          <select value={orden} onChange={(e) => fijar({ orden: e.target.value === 'relevancia' ? '' : e.target.value })}>
            <option value="relevancia">Destacados</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="nuevos">Más nuevos</option>
          </select>
        </label>
      </div>

      <div className="catalogo">
        <aside id="filtros-tienda" className={`catalogo__filtros ${panel ? 'catalogo__filtros--abierto' : ''}`} aria-label="Filtros">
          <fieldset className="filtro">
            <legend className="filtro__titulo">Categoría</legend>
            {[{ valor: 'Todas', cantidad: categorias.reduce((s, c) => s + c.cantidad, 0) }, ...categorias].map((c) => (
              <label key={c.valor} className="casilla">
                <input type="radio" name="categoria" checked={categoria === c.valor} onChange={() => fijar({ categoria: c.valor === 'Todas' ? '' : c.valor })} />
                <span>{c.valor}</span><span className="casilla__cantidad">{c.cantidad}</span>
              </label>
            ))}
          </fieldset>
          <form className="filtro" onSubmit={aplicarPrecio}>
            <fieldset className="filtro">
              <legend className="filtro__titulo">Precio (₡)</legend>
              <div className="rango">
                <label><span className="solo-lector">Precio mínimo</span><input type="number" min="0" step="500" placeholder="Mín." value={precio.min} onChange={(e) => setPrecio({ ...precio, min: e.target.value })} /></label>
                <span aria-hidden="true">–</span>
                <label><span className="solo-lector">Precio máximo</span><input type="number" min="0" step="500" placeholder="Máx." value={precio.max} onChange={(e) => setPrecio({ ...precio, max: e.target.value })} /></label>
              </div>
              <button type="submit" className="boton boton--contorno boton--chico">Aplicar</button>
            </fieldset>
          </form>
          <label className="casilla">
            <input type="checkbox" checked={disponibles} onChange={(e) => fijar({ disponibles: e.target.checked ? '1' : '' })} />
            <span>Solo disponibles</span>
          </label>
          <button type="button" className="enlace enlace--boton" onClick={limpiar}>Quitar filtros</button>
        </aside>

        <section className="catalogo__resultados" aria-labelledby="conteo-productos">
          <div className="resultados__cabeza">
            <p id="conteo-productos" aria-live="polite">{cargando ? 'Buscando…' : `${productos.length} ${productos.length === 1 ? 'producto' : 'productos'}`}</p>
            <p role="status" className="aviso">{aviso}</p>
          </div>
          {error && <p role="alert" className="error">{error}</p>}
          {!cargando && productos.length === 0 && (
            <div className="vacio"><p>No hay productos con esos filtros.</p><button type="button" className="boton boton--contorno" onClick={limpiar}>Ver todos</button></div>
          )}
          <ul className="productos">
            {productos.map((p) => (
              <li key={p.id} className="producto">
                <Link to={`/tienda/${p.id}`} aria-label={`Ver detalles de ${p.nombre}`}>
                  <Foto archivo={p.imagen} alt={p.nombre} className="producto__foto" />
                </Link>
                <p className="producto__marca">{p.marca}</p>
                <Link to={`/tienda/${p.id}`}>
                  <h2 className="producto__nombre">{p.nombre}</h2>
                </Link>
                <p className="tenue">{p.descripcion}</p>
                <div className="producto__pie">
                  <span className="producto__precio">{dinero(p.precio)}</span>
                  {p.stock > 0 ? (
                    <button type="button" className="boton boton--chico" onClick={() => agregar(p)}>Agregar<span className="solo-lector"> {p.nombre} al carrito</span></button>
                  ) : <span className="agotado">Agotado</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
