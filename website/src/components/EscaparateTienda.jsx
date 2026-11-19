// Escaparate animado de la tienda (vista sin filtros): carrusel de campañas, categorías en círculo
// y una fila de ofertas relámpago con barras de "vendido".
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import ProductoImagen from './ProductoImagen.jsx';
import CuentaRegresiva from './CuentaRegresiva.jsx';
import BotonFavorito from './BotonFavorito.jsx';
import { useVistaRapida } from '../context/VistaRapidaContext.jsx';

const conFotoPrimero = (l) => [...l].sort((a, b) => Boolean(b.imagen) - Boolean(a.imagen));
const pct = (p) => (p.precio_anterior ? Math.round((1 - p.precio / p.precio_anterior) * 100) : 0);
const lista = (r) => r.productos || r;

function Flecha({ dir = 1 }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={dir > 0 ? 'm9 5 7 7-7 7' : 'm15 5-7 7 7 7'} /></svg>;
}

function Carrusel({ ofertas, vendidos, kits }) {
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const maximo = Math.max(0, ...ofertas.map(pct));
  const slides = [
    { clase: 'oferta', ante: 'Ofertas relámpago', titulo: <>Hasta <em>-{maximo}%</em> en lo que más usas</>, texto: 'Esmaltes, geles, limas y cuidado de manos con descuento solo por hoy.', boton: 'Ver ofertas', to: '/tienda?ofertas=1&orden=descuento', productos: ofertas, reloj: true },
    { clase: 'vendidos', ante: 'Top ventas', titulo: <>Lo que <em>todas</em> están comprando</>, texto: 'Los favoritos de nuestras clientas, probados en el salón.', boton: 'Ver más vendidos', to: '/tienda?orden=vendidos', productos: vendidos },
    { clase: 'kits', ante: 'Kits y equipos', titulo: <>Arma tu <em>estudio</em> en casa</>, texto: 'Lámparas, kits de manicure y todo para empezar. Retiro gratis en el salón.', boton: 'Ver kits', to: `/tienda?categoria=${encodeURIComponent('Kits')}`, productos: kits }
  ].filter((s) => s.productos.length >= 3);

  useEffect(() => {
    if (pausa || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setTimeout(() => setI((n) => (n + 1) % slides.length), 8000);
    return () => clearTimeout(t);
  }, [i, pausa, slides.length]);
  if (!slides.length) return null;
  const s = slides[i % slides.length];

  return (
    <section className={`vitrina vitrina--${s.clase}`} aria-roledescription="carrusel" aria-label="Campañas de la tienda"
             onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)} onFocus={() => setPausa(true)} onBlur={() => setPausa(false)}>
      <span className="vitrina__burbujas" aria-hidden="true">{Array.from({ length: 8 }, (_, n) => <i key={n} style={{ '--n': n }} />)}</span>
      <div className="vitrina__texto" key={`t${i}`}>
        <p className="vitrina__ante">{s.ante}</p>
        <h2><Link to={s.to} className="enlace-titulo">{s.titulo}</Link></h2>
        <p>{s.texto}</p>
        {s.reloj && <CuentaRegresiva claro />}
        <Link to={s.to} className="vitrina__boton">{s.boton} <Flecha /></Link>
      </div>
      <ul className="vitrina__productos" key={`p${i}`}>
        {s.productos.slice(0, 4).map((p, n) => (
          <li key={p.id} style={{ '--n': n }}>
            <Link to={`/tienda/${p.id}`} className="vitrina__producto">
              <ProductoImagen producto={p} />
              {pct(p) > 0 && <span className="vitrina__pct">-{pct(p)}%</span>}
              <span className="vitrina__precio">{dinero(p.precio)}</span>
              <span className="solo-lector">{p.nombre}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="vitrina__puntos" role="group" aria-label="Elegir campaña">
        {slides.map((x, n) => (
          <button key={x.clase} type="button" aria-label={`Campaña ${n + 1}: ${x.ante}`} aria-current={n === i % slides.length}
                  className={pausa ? 'pausa' : ''} onClick={() => setI(n)}><span key={i} /></button>
        ))}
      </div>
    </section>
  );
}

function Categorias({ categorias, muestras }) {
  return (
    <section className="cat-circulos" aria-labelledby="t-cat-circ">
      <h2 id="t-cat-circ" className="fila-titulo">Compra por categoría</h2>
      <ul>
        {categorias.map((c, n) => (
          <li key={c.valor} style={{ '--n': n }}>
            <Link to={`/tienda?categoria=${encodeURIComponent(c.valor)}`} className="cat-circulos__enlace">
              <span className="cat-circulos__aro"><span className="cat-circulos__foto">{muestras[c.valor] ? <ProductoImagen producto={muestras[c.valor]} /> : null}</span></span>
              <span className="cat-circulos__nombre">{c.valor}</span>
              <span className="cat-circulos__cant">{c.cantidad} productos</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FilaRelampago({ productos }) {
  const ref = useRef(null);
  const vista = useVistaRapida();
  return (
    <section className="fila-flash" aria-labelledby="t-fila-flash">
      <div className="fila-flash__cabeza">
        <h2 id="t-fila-flash"><Link to="/tienda?ofertas=1&orden=descuento" className="enlace-titulo"><span className="fila-flash__rayo" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg></span>Ofertas relámpago</Link></h2>
        <CuentaRegresiva claro />
        <Link to="/tienda?ofertas=1&orden=descuento" className="fila-flash__todo">Ver todo <Flecha /></Link>
      </div>
      <div className="fila-flash__marco">
        <ul ref={ref}>
          {productos.slice(0, 6).map((p, n) => {
            const vendido = 55 + ((p.id * 13) % 40);
            return (
              <li key={p.id} style={{ '--n': n }}>
                <div className="flash-tarjeta">
                  <button type="button" className="flash-tarjeta__foto" onClick={() => vista({ tipo: 'producto', id: p.id })} aria-label={`Vista previa de ${p.nombre}`}>
                    <ProductoImagen producto={p} />
                    <span className="flash-tarjeta__pct">-{pct(p)}%</span>
                  </button>
                  <BotonFavorito tipo="producto" nombre={p.nombre}
                                 datos={{ id: p.id, nombre: p.nombre, precio: p.precio, precio_anterior: p.precio_anterior, imagen: p.imagen, color: p.color, tipo_producto: p.tipo, stock: p.stock, calificacion: p.calificacion, resenas: p.resenas, vendidos: p.vendidos, categoria: p.categoria }} />
                  <Link to={`/tienda/${p.id}`} className="flash-tarjeta__nombre">{p.nombre}</Link>
                  <p className="flash-tarjeta__precio"><b>{dinero(p.precio)}</b><s>{dinero(p.precio_anterior)}</s></p>
                  <Link to={`/tienda/${p.id}`} className="flash-tarjeta__barra" aria-label={`${vendido} % vendido`}><span style={{ '--v': `${vendido}%` }} /><em>{vendido >= 85 ? '¡Casi agotado!' : `${vendido} % vendido`}</em></Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default function EscaparateTienda({ categorias, children }) {
  const [datos, setDatos] = useState(null);
  useEffect(() => {
    Promise.all([
      api.productos({ ofertas: 1, orden: 'descuento', disponibles: 1, limite: 16 }),
      api.productos({ orden: 'vendidos', disponibles: 1, limite: 8 }),
      api.productos({ categoria: 'Kits', limite: 8 }).catch(() => []),
      api.productos({ categoria: 'Equipos', limite: 8 }).catch(() => [])
    ]).then(([o, v, k, e]) => {
      const ofertas = lista(o).filter((p) => p.precio_anterior);
      setDatos({ ofertas, vendidos: lista(v), kits: conFotoPrimero([...lista(k), ...lista(e)]) });
    }).catch(() => setDatos(null));
  }, []);
  const [muestras, setMuestras] = useState({});
  useEffect(() => {
    if (!categorias.length) return;
    Promise.all(categorias.map((c) => api.productos({ categoria: c.valor, orden: 'vendidos', limite: 6 }).then((r) => [c.valor, conFotoPrimero(lista(r))[0]]).catch(() => [c.valor, null])))
      .then((pares) => setMuestras(Object.fromEntries(pares)));
  }, [categorias]);

  if (!datos) return <><div className="vitrina vitrina--cargando" aria-hidden="true" />{children}</>;
  return (
    <>
      <Carrusel ofertas={conFotoPrimero(datos.ofertas)} vendidos={conFotoPrimero(datos.vendidos)} kits={datos.kits} />
      {children}
      {categorias.length > 0 && <Categorias categorias={categorias} muestras={muestras} />}
      {datos.ofertas.length > 3 && <FilaRelampago productos={datos.ofertas} />}
    </>
  );
}
