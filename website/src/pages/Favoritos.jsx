import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useTitulo } from '../lib/hooks.js';
import { useFavoritos } from '../context/FavoritosContext.jsx';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import TarjetaDiseno from '../components/TarjetaDiseno.jsx';

// Lista de favoritos: productos y diseños guardados con el corazón
export default function Favoritos() {
  useTitulo('Mis favoritos');
  const fav = useFavoritos();
  const [vista, setVista] = useState('todo');
  const [frescos, setFrescos] = useState({});
  const productos = fav.items.filter((i) => i.tipo === 'producto');
  const disenos = fav.items.filter((i) => i.tipo === 'diseno');

  // Precio y stock actuales de los productos guardados
  useEffect(() => {
    const ids = productos.map((p) => p.id);
    if (!ids.length) return;
    api.productosPorIds(ids).then((r) => setFrescos(Object.fromEntries((r.productos || r).map((p) => [p.id, p])))).catch(() => {});
  }, [productos.length]);

  const mostrarP = vista !== 'disenos' && productos.length > 0;
  const mostrarD = vista !== 'productos' && disenos.length > 0;

  return (
    <div className="contenedor pagina favoritos-pagina">
      <nav aria-label="Ruta" className="migas"><ol><li><Link to="/">Inicio</Link></li><li aria-current="page">Favoritos</li></ol></nav>
      <header className="favoritos-cabeza">
        <span className="favoritos-cabeza__corazon" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z" /></svg>
        </span>
        <div>
          <h1>Mis favoritos</h1>
          <p className="tenue">{fav.cantidad ? `${fav.cantidad} ${fav.cantidad === 1 ? 'cosa guardada' : 'cosas guardadas'} para después.` : 'Toca el corazón de un producto o diseño para guardarlo aquí.'}</p>
        </div>
      </header>

      {fav.cantidad === 0 ? (
        <section className="carrito-vacio">
          <h2>Todavía no tienes favoritos</h2>
          <p className="tenue">Guarda lo que te guste y vuelve cuando quieras comprarlo o reservarlo.</p>
          <div className="carrito-vacio__acciones">
            <Link to="/tienda" className="boton">Ir a la tienda</Link>
            <Link to="/galeria" className="boton boton--contorno">Ver diseños</Link>
          </div>
        </section>
      ) : (
        <>
          <div className="barra-chips" role="group" aria-label="Mostrar">
            {[['todo', `Todo (${fav.cantidad})`], ['productos', `Productos (${productos.length})`], ['disenos', `Diseños (${disenos.length})`]].map(([k, t]) => (
              <button key={k} type="button" className={`chip-filtro ${vista === k ? 'chip-filtro--activo' : ''}`} aria-pressed={vista === k} onClick={() => setVista(k)}>{t}</button>
            ))}
            <button type="button" className="chip-filtro chip-filtro--limpiar" onClick={fav.vaciar}>Vaciar lista</button>
          </div>
          {mostrarP && (
            <section aria-labelledby="fav-p">
              <h2 id="fav-p" className="favoritos-titulo">Productos</h2>
              <ul className="productos-rejilla productos-rejilla--grande">{productos.map((p) => <TarjetaProducto key={p.clave} p={{ ...p, tipo: p.tipo_producto, ...frescos[p.id] }} />)}</ul>
            </section>
          )}
          {mostrarD && (
            <section aria-labelledby="fav-d">
              <h2 id="fav-d" className="favoritos-titulo">Diseños</h2>
              <ul className="disenos-rejilla">{disenos.map((f, i) => <TarjetaDiseno key={f.clave} foto={f} indice={i} />)}</ul>
            </section>
          )}
          {!mostrarP && !mostrarD && <p className="tenue">No tienes {vista === 'productos' ? 'productos' : 'diseños'} guardados.</p>}
        </>
      )}
    </div>
  );
}
