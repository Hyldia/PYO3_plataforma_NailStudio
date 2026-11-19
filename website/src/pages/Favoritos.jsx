import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import { useFavoritos } from '../context/FavoritosContext.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import TarjetaDiseno from '../components/TarjetaDiseno.jsx';
import ProductoImagen from '../components/ProductoImagen.jsx';
import Foto from '../components/Foto.jsx';
import Contador from '../components/Contador.jsx';
import Migas from '../components/Migas.jsx';

const CORAZON = 'M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z';
// Nombre: Corazones
// Descripción: Dibuja corazones flotando.
// Entrada: Nada.
// Salida: Los corazones.
// Objetivo: Decorar favoritos.
const Corazones = () => (
  <span className="fav-hero__corazones" aria-hidden="true">
    {Array.from({ length: 14 }, (_, n) => <svg key={n} viewBox="0 0 24 24" style={{ '--n': n, '--t': `${14 + ((n * 7) % 5) * 6}px`, '--d': `${6 + ((n * 3) % 5)}s` }}><path d={CORAZON} /></svg>)}
  </span>
);
// Nombre: lista
// Descripción: Saca la lista de productos.
// Entrada: La respuesta.
// Salida: La lista.
// Objetivo: Trabajar con la lista.
const lista = (r) => r.productos || r;

// Lista de favoritos: productos y diseños guardados con el corazón
// Nombre: Favoritos
// Descripción: Muestra la página de favoritos.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Ver lo guardado.
export default function Favoritos() {
  useTitulo('Mis favoritos');
  const fav = useFavoritos();
  const carrito = useCarrito();
  const [vista, setVista] = useState('todo');
  const [frescos, setFrescos] = useState({});
  const [sugeridos, setSugeridos] = useState([]);
  const [disenosSug, setDisenosSug] = useState([]);
  const [agregados, setAgregados] = useState(0);
  const productos = fav.items.filter((i) => i.tipo === 'producto').map((p) => ({ ...p, tipo: p.tipo_producto, guardadoA: p.precio, ...frescos[p.id] }));
  const [fotosFrescas, setFotosFrescas] = useState({});
  const disenos = fav.items.filter((i) => i.tipo === 'diseno').map((f) => ({ ...f, ...fotosFrescas[f.id] }));
  const idsD = disenos.map((f) => f.id).join(',');
  useEffect(() => {
    if (!idsD) return;
    Promise.all(idsD.split(',').map((id) => api.foto(id).then((f) => [id, { ...f, precio_salon: f.servicio?.precio, servicio_id: f.servicio?.id, presson_id: f.presson?.id, precio_presson: f.presson?.precio }]).catch(() => null)))
      .then((l) => setFotosFrescas(Object.fromEntries(l.filter(Boolean))));
  }, [idsD]);
  const ids = productos.map((p) => p.id).join(',');

  // Precio y stock actuales de los productos guardados
  useEffect(() => {
    if (!ids) return;
    api.productosPorIds(ids.split(',')).then((r) => setFrescos(Object.fromEntries(lista(r).map((p) => [p.id, p])))).catch(() => {});
  }, [ids]);

  // Sugerencias parecidas a lo guardado (o lo más vendido si no hay nada)
  useEffect(() => {
    const guardados = new Set(fav.items.map((i) => i.clave));
    const base = fav.items.find((i) => i.tipo === 'producto');
    (base ? api.productosRelacionados(base.id, 12) : api.productos({ orden: 'vendidos', limite: 12 }))
      .then((r) => setSugeridos(lista(r).filter((p) => !guardados.has(`producto-${p.id}`)).slice(0, 10))).catch(() => setSugeridos([]));
    const baseD = fav.items.find((i) => i.tipo === 'diseno');
    (baseD ? api.fotosRelacionadas(baseD.id, 10).then((r) => r.fotos || r) : api.fotos({ orden: 'populares', limite: 10 }).then((r) => r.fotos))
      .then((l) => setDisenosSug(l.filter((f) => !guardados.has(`diseno-${f.id}`)).slice(0, 5))).catch(() => setDisenosSug([]));
  }, [fav.cantidad]);

  const disponibles = productos.filter((p) => p.stock !== 0);
  const total = disponibles.reduce((s, p) => s + p.precio, 0);
  const ahorro = disponibles.reduce((s, p) => s + (p.precio_anterior ? p.precio_anterior - p.precio : 0), 0);
  const bajaron = productos.filter((p) => p.guardadoA && p.precio < p.guardadoA).length;
  const collage = useMemo(() => fav.items.slice(0, 5), [fav.items]);

  // Nombre: agregarTodo
  // Descripción: Agrega todos los favoritos al carrito.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Comprar de una vez.
  const agregarTodo = () => {
    disponibles.forEach((p) => carrito.agregar(p, { cantidad: 1 }));
    setAgregados(disponibles.length);
    carrito.abrir?.();
  };

  const mostrarP = vista !== 'disenos' && productos.length > 0;
  const mostrarD = vista !== 'productos' && disenos.length > 0;
  const pestanas = [['todo', 'Todo', fav.cantidad], ['productos', 'Productos', productos.length], ['disenos', 'Diseños', disenos.length]];
  const activa = pestanas.findIndex(([k]) => k === vista);

  return (
    <div className="contenedor pagina favoritos-pagina">
      <Migas pasos={[['Favoritos']]} />

      <section className="fav-hero" aria-labelledby="t-fav">
        <Corazones />
        <div className="fav-hero__texto">
          <span className="fav-hero__icono" aria-hidden="true"><svg width="34" height="34" viewBox="0 0 24 24"><path d={CORAZON} /></svg></span>
          <div>
            <p className="fav-hero__ante">Tu lista de deseos</p>
            <h1 id="t-fav">Mis favoritos</h1>
            <p>{fav.cantidad ? `${fav.cantidad} ${fav.cantidad === 1 ? 'cosa guardada' : 'cosas guardadas'} para después.` : 'Toca el corazón de un producto o diseño para guardarlo aquí.'}</p>
            {fav.cantidad > 0 && (
              <ul className="fav-hero__datos">
                <li><strong><Contador valor={productos.length} /></strong> {productos.length === 1 ? 'producto' : 'productos'}</li>
                <li><strong><Contador valor={disenos.length} /></strong> {disenos.length === 1 ? 'diseño' : 'diseños'}</li>
                {productos.some((p) => p.precio_anterior) && <li><strong><Contador valor={productos.filter((p) => p.precio_anterior).length} /></strong> en oferta</li>}
              </ul>
            )}
            <div className="fav-hero__botones">
              <Link to="/tienda" className="fav-hero__enlace">Seguir comprando</Link>
              <Link to="/galeria" className="fav-hero__enlace fav-hero__enlace--borde">Ver diseños</Link>
            </div>
          </div>
        </div>
        {fav.cantidad > 0 && (
          <div className="fav-hero__resumen">
            <ul className="fav-hero__collage">
              {collage.map((i, n) => (
                <li key={i.clave} style={{ '--n': n }}>
                  <Link to={i.tipo === 'producto' ? `/tienda/${i.id}` : `/galeria/${i.id}`} tabIndex={-1}>
                    {i.tipo === 'producto' ? <ProductoImagen producto={{ ...i, tipo: i.tipo_producto }} /> : <Foto archivo={i.archivo} alt="" />}
                  </Link>
                </li>
              ))}
            </ul>
            {disponibles.length > 0 && (
              <div className="fav-hero__caja">
                <p><span>Todo tu carrito de deseos</span><strong><Contador valor={total} formato={dinero} /></strong></p>
                {ahorro > 0 && <p className="fav-hero__ahorro">Ahorras {dinero(ahorro)} si lo pides hoy</p>}
                <button type="button" className="fav-hero__boton" onClick={agregarTodo}>
                  {agregados ? `Listo: ${agregados} en el carrito` : `Agregar todo al carrito (${disponibles.length})`}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {bajaron > 0 && (
        <p className="fav-aviso" role="status"><span aria-hidden="true">↓</span> ¡Buenas noticias! {bajaron === 1 ? '1 producto que guardaste bajó' : `${bajaron} productos que guardaste bajaron`} de precio.</p>
      )}

      {fav.cantidad === 0 ? (
        <section className="fav-vacio">
          <span className="fav-vacio__corazon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={CORAZON} /></svg><i /><i /><i /></span>
          <h2>Todavía no tienes favoritos</h2>
          <p className="tenue">Guarda lo que te guste con el corazón y vuelve cuando quieras comprarlo o reservarlo.</p>
          <div className="carrito-vacio__acciones">
            <Link to="/tienda" className="boton">Ir a la tienda</Link>
            <Link to="/galeria" className="boton boton--contorno">Ver diseños</Link>
          </div>
        </section>
      ) : (
        <>
          <div className="fav-barra">
          <div className="fav-pestanas" role="group" aria-label="Mostrar" style={{ '--i': activa }}>
            <span className="fav-pestanas__pildora" aria-hidden="true" />
            {pestanas.map(([k, t, n]) => (
              <button key={k} type="button" aria-pressed={vista === k} onClick={() => setVista(k)}>{t} <span>{n}</span></button>
            ))}
          </div>
          <button type="button" className="fav-vaciar" onClick={fav.vaciar}>Vaciar lista</button>
          </div>

          <div key={vista}>
            {mostrarP && (
              <section aria-labelledby="fav-p">
                <h2 id="fav-p" className="fila-titulo">Productos guardados</h2>
                <ul className="productos-rejilla productos-rejilla--grande">
                  {productos.map((p) => (
                    <TarjetaProducto key={p.id} p={p} />
                  ))}
                </ul>
              </section>
            )}
            {mostrarD && (
              <section aria-labelledby="fav-d">
                <h2 id="fav-d" className="fila-titulo">Diseños guardados</h2>
                <ul className="disenos-rejilla">{disenos.map((f, i) => <TarjetaDiseno key={f.clave} foto={f} indice={i} />)}</ul>
              </section>
            )}
            {!mostrarP && !mostrarD && <p className="tenue">No tienes {vista === 'productos' ? 'productos' : 'diseños'} guardados.</p>}
          </div>
        </>
      )}

      {sugeridos.length > 0 && (
        <section className="fav-sugeridos" aria-labelledby="fav-sug">
          <h2 id="fav-sug" className="fila-titulo"><span className="tendencias__punto" aria-hidden="true" />{fav.cantidad ? 'Porque te gustó lo que guardaste' : 'Lo más vendido'}</h2>
          <ul className="productos-rejilla productos-rejilla--grande">{sugeridos.map((p) => <TarjetaProducto key={p.id} p={p} />)}</ul>
        </section>
      )}
      {disenosSug.length > 0 && (
        <section className="fav-sugeridos" aria-labelledby="fav-sug-d">
          <h2 id="fav-sug-d" className="fila-titulo"><span className="tendencias__punto" aria-hidden="true" />Diseños que te pueden encantar</h2>
          <ul className="disenos-rejilla">{disenosSug.map((f, i) => <TarjetaDiseno key={f.id} foto={f} indice={i} />)}</ul>
        </section>
      )}
    </div>
  );
}
