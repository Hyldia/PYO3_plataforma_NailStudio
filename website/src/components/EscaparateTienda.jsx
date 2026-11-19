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

// Nombre: conFotoPrimero
// Descripción: Pone primero los productos con foto.
// Entrada: La lista.
// Salida: La lista ordenada.
// Objetivo: Que se vea más bonito.
const conFotoPrimero = (lista) => [...lista].sort((a, b) => Boolean(b.imagen) - Boolean(a.imagen));
// Nombre: pct
// Descripción: Calcula el porcentaje de descuento.
// Entrada: El producto.
// Salida: El porcentaje.
// Objetivo: Mostrar cuánto ahorra.
const pct = (producto) => (producto.precio_anterior ? Math.round((1 - producto.precio / producto.precio_anterior) * 100) : 0);
// Nombre: lista
// Descripción: Saca la lista de productos de la respuesta.
// Entrada: La respuesta.
// Salida: La lista.
// Objetivo: Trabajar con la lista.
const lista = (respuesta) => respuesta.productos || respuesta;

// Nombre: Flecha
// Descripción: Dibuja una flecha.
// Entrada: La dirección.
// Salida: La flecha.
// Objetivo: Botones de mover.
function Flecha({ dir = 1 }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={dir > 0 ? 'm9 5 7 7-7 7' : 'm15 5-7 7 7 7'} /></svg>;
}

// Nombre: Carrusel
// Descripción: Muestra el anuncio que cambia solo.
// Entrada: Ofertas, vendidos y kits.
// Salida: El carrusel.
// Objetivo: Destacar lo mejor arriba.
function Carrusel({ ofertas, vendidos, kits }) {
  const [actual, setActual] = useState(0);
  const [pausa, setPausa] = useState(false);
  const maximo = Math.max(0, ...ofertas.map(pct));
  const slides = [
    { clase: 'oferta', ante: 'Ofertas relámpago', titulo: <>Hasta <em>-{maximo}%</em> en lo que más usas</>, texto: 'Esmaltes, geles, limas y cuidado de manos con descuento solo por hoy.', boton: 'Ver ofertas', to: '/tienda?ofertas=1&orden=descuento', productos: ofertas, reloj: true },
    { clase: 'vendidos', ante: 'Top ventas', titulo: <>Lo que <em>todas</em> están comprando</>, texto: 'Los favoritos de nuestras clientas, probados en el salón.', boton: 'Ver más vendidos', to: '/tienda?orden=vendidos', productos: vendidos },
    { clase: 'kits', ante: 'Kits y equipos', titulo: <>Arma tu <em>estudio</em> en casa</>, texto: 'Lámparas, kits de manicure y todo para empezar. Retiro gratis en el salón.', boton: 'Ver kits', to: `/tienda?categoria=${encodeURIComponent('Kits')}`, productos: kits }
  ].filter((diapositiva) => diapositiva.productos.length >= 3);

  useEffect(() => {
    if (pausa || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const temporizador = setTimeout(() => setActual((anterior) => (anterior + 1) % slides.length), 8000);
    return () => clearTimeout(temporizador);
  }, [actual, pausa, slides.length]);
  if (!slides.length) return null;
  const diapositiva = slides[actual % slides.length];

  return (
    <section className={`vitrina vitrina--${diapositiva.clase}`} aria-roledescription="carrusel" aria-label="Campañas de la tienda"
             onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)} onFocus={() => setPausa(true)} onBlur={() => setPausa(false)}>
      <span className="vitrina__burbujas" aria-hidden="true">{Array.from({ length: 8 }, (_, numero) => <i key={numero} style={{ '--n': numero }} />)}</span>
      <div className="vitrina__texto" key={`t${actual}`}>
        <p className="vitrina__ante">{diapositiva.ante}</p>
        <h2><Link to={diapositiva.to} className="enlace-titulo">{diapositiva.titulo}</Link></h2>
        <p>{diapositiva.texto}</p>
        {diapositiva.reloj && <CuentaRegresiva claro />}
        <Link to={diapositiva.to} className="vitrina__boton">{diapositiva.boton} <Flecha /></Link>
      </div>
      <ul className="vitrina__productos" key={`p${actual}`}>
        {diapositiva.productos.slice(0, 4).map((producto, numero) => (
          <li key={producto.id} style={{ '--n': numero }}>
            <Link to={`/tienda/${producto.id}`} className="vitrina__producto">
              <ProductoImagen producto={producto} />
              {pct(producto) > 0 && <span className="vitrina__pct">-{pct(producto)}%</span>}
              <span className="vitrina__precio">{dinero(producto.precio)}</span>
              <span className="solo-lector">{producto.nombre}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="vitrina__puntos" role="group" aria-label="Elegir campaña">
        {slides.map((diapositiva, numero) => (
          <button key={diapositiva.clase} type="button" aria-label={`Campaña ${numero + 1}: ${diapositiva.ante}`} aria-current={numero === actual % slides.length}
                  className={pausa ? 'pausa' : ''} onClick={() => setActual(numero)}><span key={actual} /></button>
        ))}
      </div>
    </section>
  );
}

// Nombre: Categorias
// Descripción: Muestra las categorías de la tienda.
// Entrada: Categorías y fotos.
// Salida: Los círculos.
// Objetivo: Comprar por categoría.
function Categorias({ categorias, muestras }) {
  return (
    <section className="cat-circulos" aria-labelledby="t-cat-circ">
      <h2 id="t-cat-circ" className="fila-titulo">Compra por categoría</h2>
      <ul style={{ '--columnas': categorias.length <= 10 ? categorias.length : Math.ceil(categorias.length / 2), '--columnas-movil': [4, 3, 5].find((columnas) => categorias.length % columnas === 0) || 4 }}>
        {categorias.map((categoria, numero) => (
          <li key={categoria.valor} style={{ '--n': numero }}>
            <Link to={`/tienda?categoria=${encodeURIComponent(categoria.valor)}`} className="cat-circulos__enlace">
              <span className="cat-circulos__aro"><span className="cat-circulos__foto">{muestras[categoria.valor] ? <ProductoImagen producto={muestras[categoria.valor]} /> : null}</span></span>
              <span className="cat-circulos__nombre">{categoria.valor}</span>
              <span className="cat-circulos__cant">{categoria.cantidad} productos</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Nombre: FilaRelampago
// Descripción: Muestra las ofertas relámpago.
// Entrada: Los productos.
// Salida: La fila.
// Objetivo: Destacar ofertas.
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
          {productos.slice(0, 6).map((producto, numero) => {
            const vendido = 55 + ((producto.id * 13) % 40);
            return (
              <li key={producto.id} style={{ '--n': numero }}>
                <div className="flash-tarjeta">
                  <button type="button" className="flash-tarjeta__foto" onClick={() => vista({ tipo: 'producto', id: producto.id })} aria-label={`Vista previa de ${producto.nombre}`}>
                    <ProductoImagen producto={producto} />
                    <span className="flash-tarjeta__pct">-{pct(producto)}%</span>
                  </button>
                  <BotonFavorito tipo="producto" nombre={producto.nombre}
                                 datos={{ id: producto.id, nombre: producto.nombre, precio: producto.precio, precio_anterior: producto.precio_anterior, imagen: producto.imagen, color: producto.color, tipo_producto: producto.tipo, stock: producto.stock, calificacion: producto.calificacion, resenas: producto.resenas, vendidos: producto.vendidos, categoria: producto.categoria }} />
                  <Link to={`/tienda/${producto.id}`} className="flash-tarjeta__nombre">{producto.nombre}</Link>
                  <p className="flash-tarjeta__precio"><b>{dinero(producto.precio)}</b><s>{dinero(producto.precio_anterior)}</s></p>
                  <Link to={`/tienda/${producto.id}`} className="flash-tarjeta__barra" aria-label={`${vendido} % vendido`}><span style={{ '--v': `${vendido}%` }} /><em>{vendido >= 85 ? '¡Casi agotado!' : `${vendido} % vendido`}</em></Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// Nombre: EscaparateTienda
// Descripción: Muestra la portada de la tienda.
// Entrada: Las categorías y los filtros.
// Salida: La portada.
// Objetivo: Presentar la tienda.
export default function EscaparateTienda({ categorias, children }) {
  const [datos, setDatos] = useState(null);
  useEffect(() => {
    Promise.all([
      api.productos({ ofertas: 1, orden: 'descuento', disponibles: 1, limite: 16 }),
      api.productos({ orden: 'vendidos', disponibles: 1, limite: 8 }),
      api.productos({ categoria: 'Kits', limite: 8 }).catch(() => []),
      api.productos({ categoria: 'Equipos', limite: 8 }).catch(() => [])
    ]).then(([o, v, k, e]) => {
      const ofertas = lista(o).filter((valor) => valor.precio_anterior);
      setDatos({ ofertas, vendidos: lista(v), kits: conFotoPrimero([...lista(k), ...lista(e)]) });
    }).catch(() => setDatos(null));
  }, []);
  const [muestras, setMuestras] = useState({});
  const [ocultos, setOcultos] = useState([]);
  // Círculos que la dueña ocultó en el panel (Productos → Fotos de los círculos)
  useEffect(() => { api.circulos().then((config) => setOcultos(config.ocultos || [])).catch(() => {}); }, []);
  const visibles = categorias.filter((categoria) => !ocultos.includes(categoria.valor));
  useEffect(() => {
    if (!categorias.length) return;
    // Primero la foto que la dueña eligió en el panel; si no hay, la del producto más vendido
    Promise.all([
      api.portadas().catch(() => ({})),
      ...categorias.map((categoria) => api.productos({ categoria: categoria.valor, orden: 'vendidos', limite: 6 }).then((respuesta) => [categoria.valor, conFotoPrimero(lista(respuesta))[0]]).catch(() => [categoria.valor, null]))
    ]).then(([portadas, ...pares]) => setMuestras(Object.fromEntries(pares.map(([k, p]) => [k, portadas[k] ? { ...(p || {}), nombre: k, imagen: portadas[k] } : p]))));
  }, [categorias]);

  if (!datos) return <><div className="vitrina vitrina--cargando" aria-hidden="true" />{children}</>;
  return (
    <>
      <Carrusel ofertas={conFotoPrimero(datos.ofertas)} vendidos={conFotoPrimero(datos.vendidos)} kits={datos.kits} />
      {children}
      {visibles.length > 0 && <Categorias categorias={visibles} muestras={muestras} />}
      {datos.ofertas.length > 3 && <FilaRelampago productos={datos.ofertas} />}
    </>
  );
}
