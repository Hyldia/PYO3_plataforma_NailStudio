// Página de inicio: portada, círculos de categorías, servicios, diseños destacados, tienda y reseñas.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { SALON, campanaActual, dinero } from '../config.js';
import { useTitulo, usePorPagina } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import VerMas from '../components/VerMas.jsx';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import ProductoImagen from '../components/ProductoImagen.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import Decoracion from '../components/Decoracion.jsx';
import { circulosDelInicio, claveCategoria } from '../lib/categoriasPortada.js';
import CarruselAuto from '../components/CarruselAuto.jsx';


// Nombre: Flecha
// Descripción: Dibuja una flecha.
// Entrada: Nada.
// Salida: La flecha.
// Objetivo: Botones.
const Flecha = () => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>;
const PRODUCTOS_POR_PAGINA_BASE = 10;

// Nombre: TarjetaServicioMini
// Descripción: Muestra un servicio pequeño.
// Entrada: El servicio.
// Salida: La tarjeta.
// Objetivo: Destacar servicios.
function TarjetaServicioMini({ s }) {
  const descuento = s.precio_oferta != null ? Math.round((1 - s.precio_oferta / s.precio) * 100) : 0;
  return (
    <li className="tarjeta-producto">
      <Link to={`/reservar?servicio=${s.id}`} className="tarjeta-producto__enlace">
        <div className="tarjeta-producto__foto">
          <Foto archivo={s.imagen} alt="" />
          {descuento > 0 && <span className="tarjeta-producto__descuento">-{descuento}{' '}%</span>}
          {s.etiqueta && <span className="tarjeta-producto__pocos">{s.etiqueta}</span>}
        </div>
        <div className="tarjeta-producto__cuerpo">
          <h3 className="tarjeta-producto__nombre">{s.nombre}</h3>
          <p className="tarjeta-producto__precios">
            <span className="tarjeta-producto__precio">{dinero(s.precio_oferta ?? s.precio)}</span>
            {s.precio_oferta != null && <s className="tarjeta-producto__antes">{dinero(s.precio)}</s>}
          </p>
          <p className="tarjeta-producto__nota tarjeta-producto__nota--gris">{s.duracion_min} min · Reservar</p>
        </div>
      </Link>
    </li>
  );
}

// Nombre: Inicio
// Descripción: Muestra la página de inicio.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Presentar el salón.
export default function Inicio() {
  const [rejilla, PRODUCTOS_POR_PAGINA] = usePorPagina(2, PRODUCTOS_POR_PAGINA_BASE); // filas completas, sin huecos
  useTitulo('');
  const [ofertas, setOfertas] = useState([]);
  const [portadas, setPortadas] = useState({});
  const [circulos, setCirculos] = useState(() => circulosDelInicio());
  const [vendidosTodos, setVendidos] = useState([]);
  const [paginaVendidos, setPaginaVendidos] = useState(1);
  const vendidos = vendidosTodos.slice((paginaVendidos - 1) * PRODUCTOS_POR_PAGINA, paginaVendidos * PRODUCTOS_POR_PAGINA);
  const [servicios, setServicios] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [aviso, setAviso] = useState('');

  useEffect(() => { api.portadas().then(setPortadas).catch(() => {}); }, []);
  // Círculos que la dueña eligió en el panel (Productos → Fotos de los círculos)
  useEffect(() => { api.circulos().then((config) => setCirculos(circulosDelInicio(config))).catch(() => {}); }, []);

  useEffect(() => {
    api.productos({ ofertas: '1', orden: 'descuento', limite: 12 }).then(setOfertas).catch(() => {});
    api.productos({ orden: 'vendidos', limite: 100 }).then(setVendidos).catch(() => {});
    api.servicios().then(setServicios).catch(() => {});
    api.fotos({ limite: 10, orden: 'populares' }).then((respuesta) => setFotos(respuesta.fotos)).catch(() => {});
  }, []);

  const serviciosOferta = servicios.filter((servicio) => servicio.precio_oferta != null);
  const combos = servicios.filter((servicio) => servicio.es_combo);
  const paraHombres = servicios.filter((servicio) => servicio.categoria === 'Hombres');
  // Nombre: agregado
  // Descripción: Avisa que se agregó al carrito.
  // Entrada: El producto.
  // Salida: Nada.
  // Objetivo: Confirmar la acción.
  const agregado = (producto) => setAviso(`${producto.nombre} se agregó al carrito.`);
  const maxDescuento = Math.max(0, ...ofertas.map((oferta) => Math.round((1 - oferta.precio / oferta.precio_anterior) * 100)));
  const campana = campanaActual();
  // En el banner, primero las ofertas que tienen foto real
  const destacados = [...ofertas].filter((oferta) => oferta.stock > 0).sort((a, b) => Boolean(b.imagen) - Boolean(a.imagen)).slice(0, 3);
  const liquidacion = vendidosTodos.filter((vendido) => vendido.stock > 0 && vendido.stock < 10).slice(0, 3);

  return (
    <>
      <p role="status" className="solo-lector">{aviso}</p>

      {/* Banner principal: campaña del mes */}
      <section className={`campana campana--${campana.tema}`} aria-labelledby="t-banner">
        <Decoracion />
        <span className="campana__cupon campana__cupon--1" aria-hidden="true" />
        <span className="campana__cupon campana__cupon--2" aria-hidden="true" />
        <div className="contenedor campana__rejilla">
          <Link to="/tienda?ofertas=1&orden=descuento" className="campana__oferta">
            <span className="regalo" aria-hidden="true">
              <span className="regalo__mono" />
              <span className="regalo__tapa" />
              <span className="regalo__caja">
                <span className="regalo__marca">{SALON.nombre}</span>
                <span className="regalo__hasta">HASTA</span>
                <span className="regalo__pct">{maxDescuento || 40}%<small>OFF</small></span>
              </span>
            </span>
            <span className="campana__texto">
              <span className="campana__antes">{campana.antes}</span>
              <span id="t-banner" className="campana__titulo">{campana.titulo}</span>
              <span className="campana__boton">COMPRA YA <Flecha /></span>
            </span>
            <span className="solo-lector">: hasta {maxDescuento || 40} % de descuento en productos para uñas</span>
          </Link>
          <div className="campana__lado">
            <ul className="campana__productos" aria-label="Ofertas destacadas">
              {destacados.map((destacado) => (
                <li key={destacado.id}>
                  <Link to={`/tienda/${destacado.id}`} className="campana__producto">
                    <span className="campana__etiqueta">-{Math.round((1 - destacado.precio / destacado.precio_anterior) * 100)}%</span>
                    <ProductoImagen producto={destacado} />
                    <span className="campana__precio">{dinero(destacado.precio)}</span>
                    <span className="solo-lector">{destacado.nombre}, antes {dinero(destacado.precio_anterior)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="campana__reloj"><CuentaRegresiva claro /></p>
          </div>
        </div>
      </section>

      {/* Compra por categoría */}
      <section className="contenedor categorias" aria-labelledby="t-categorias">
        <h2 id="t-categorias" className="solo-lector">Compra por categoría</h2>
        <ul className="categorias__lista" style={{ '--circulos': circulos.length > 10 ? Math.ceil(circulos.length / 2) : circulos.length, '--circulos-movil': [5, 4, 3].find((columnas) => circulos.length % columnas === 0) || 5 }}>
          {circulos.map((circulo, numero) => (
            <li key={circulo.nombre} className="categoria-circulo" style={{ '--n': numero }}>
              <Link to={circulo.to}>
                <span className="categoria-circulo__aro" aria-hidden="true">
                  <span className="categoria-circulo__imagen">
                    {/* Foto real del producto más vendido de la categoría; el dibujo solo si aún no hay foto */}
                    <ProductoImagen producto={{ nombre: '', tipo: circulo.tipo, color: circulo.color, imagen: portadas[claveCategoria(circulo)] || null }} />
                  </span>
                </span>
                <span className="categoria-circulo__nombre">{circulo.nombre}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Ofertas relámpago + servicios en oferta, lado a lado en computadora */}
      <div className="contenedor dos-columnas">
        <section className="bloque-ofertas" aria-labelledby="t-relampago">
          <div className="bloque-ofertas__cabeza">
            <h2 id="t-relampago" className="titulo-oferta">
              <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
              Ofertas relámpago
            </h2>
            <Link to="/tienda?ofertas=1&orden=descuento" className="enlace-flecha">Por tiempo limitado <Flecha /></Link>
          </div>
          <ul className="productos-rejilla productos-rejilla--tres">
            {ofertas.slice(3, 6).map((oferta) => <TarjetaProducto key={oferta.id} p={oferta} onAgregar={agregado} />)}
          </ul>
        </section>
        <section className="bloque-ofertas" aria-labelledby="t-liquidacion">
          <div className="bloque-ofertas__cabeza">
            <h2 id="t-liquidacion" className="titulo-oferta titulo-oferta--rojo">
              <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h6v6H8V7.4l-3.3 3.3-1.4-1.4L6.6 6H4zm16 16h-6v-2h2.6l-5.3-5.3 1.4-1.4 5.3 5.3V14h2z" /></svg>
              Ofertas de liquidación
            </h2>
            <Link to="/tienda?orden=vendidos&disponibles=1" className="enlace-flecha">Inventario limitado <Flecha /></Link>
          </div>
          <ul className="productos-rejilla productos-rejilla--tres">
            {liquidacion.map((producto) => <TarjetaProducto key={producto.id} p={producto} onAgregar={agregado} />)}
          </ul>
        </section>
      </div>

      {/* Servicios en oferta */}
      {serviciosOferta.length > 0 && (
        <section className="contenedor seccion-tienda" aria-labelledby="t-serv-oferta">
          <div className="bloque-ofertas__cabeza">
            <h2 id="t-serv-oferta" className="titulo-oferta">
              <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a4 4 0 0 0-4 4v9a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" /></svg>
              Servicios en oferta
            </h2>
            <Link to="/servicios?ofertas=1" className="enlace-flecha">Ver todos <Flecha /></Link>
          </div>
          <ul className="productos-rejilla inicio-rejilla" aria-label="Servicios en oferta">
            {serviciosOferta.slice(0, 5).map((servicio) => <TarjetaServicioMini key={servicio.id} s={servicio} />)}
          </ul>
        </section>
      )}

      {/* Combos */}
      {/* Para hombres */}
      {paraHombres.length > 0 && (
        <section className="contenedor seccion-tienda hombres" aria-labelledby="t-hombres">
          <div className="hombres__texto">
            <p className="hombres__ante">Para él</p>
            <h2 id="t-hombres">Cuidado de uñas y manos para hombres</h2>
            <p>Uñas limpias y parejas, manos suaves y pies cómodos. Acabado natural, sin brillo, en un espacio tranquilo.</p>
            <div className="hombres__botones">
              <Link to="/servicios?categoria=Hombres" className="boton">Ver servicios</Link>
              <Link to="/tienda?categoria=Para hombres" className="hombres__secundario">Productos para hombres ›</Link>
            </div>
          </div>
          <CarruselAuto className="inicio-carrusel" etiqueta="Servicios para hombres">
            {paraHombres.map((hombre) => <TarjetaServicioMini key={hombre.id} s={hombre} />)}
          </CarruselAuto>
        </section>
      )}

      {combos.length > 0 && (
        <section className="contenedor seccion-tienda" aria-labelledby="t-combos">
          <div className="bloque-ofertas__cabeza">
            <h2 id="t-combos">Combos para consentirte</h2>
            <Link to="/servicios?categoria=Combos" className="enlace-flecha">Ver combos <Flecha /></Link>
          </div>
          <ul className="productos-rejilla inicio-rejilla" aria-label="Combos">
            {combos.slice(0, 5).map((combo) => <TarjetaServicioMini key={combo.id} s={combo} />)}
          </ul>
        </section>
      )}

      {/* Más vendidos */}
      <section className="contenedor seccion-tienda" aria-labelledby="t-vendidos">
        <div className="bloque-ofertas__cabeza">
          <h2 id="t-vendidos">Lo más vendido en la tienda</h2>
          <Link to="/tienda?orden=vendidos" className="enlace-flecha">Ver la tienda <Flecha /></Link>
        </div>
        <ul ref={rejilla} className="productos-rejilla productos-rejilla--grande">
          {vendidos.map((vendido) => <TarjetaProducto key={vendido.id} p={vendido} onAgregar={agregado} />)}
        </ul>
        <VerMas pagina={paginaVendidos} paginas={Math.ceil(vendidosTodos.length / PRODUCTOS_POR_PAGINA)}
                onCambiar={(numero) => {
                  setPaginaVendidos(numero);
                  requestAnimationFrame(() => {
                    const titulo = document.querySelector('#t-vendidos');
                    const encabezado = document.querySelector('.encabezado');
                    const margen = encabezado?.offsetHeight || 76;
                    const posicion = titulo ? titulo.getBoundingClientRect().top + window.scrollY - margen : 0;
                    window.scrollTo({ top: Math.max(0, posicion), behavior: 'smooth' });
                  });
                }} />
      </section>

      {/* Galería */}
      {fotos.length > 0 && (
        <section className="contenedor seccion-tienda" aria-labelledby="t-galeria">
          <div className="bloque-ofertas__cabeza">
            <h2 id="t-galeria">Diseños favoritos de nuestras clientas</h2>
            <Link to="/galeria" className="enlace-flecha">Ver galería <Flecha /></Link>
          </div>
          <ul className="mosaico inicio-rejilla inicio-rejilla--galeria" aria-label="Diseños favoritos">
            {fotos.slice(0, 5).map((foto) => (
              <li key={foto.id}>
                <Link to={`/galeria/${foto.id}`} className="mosaico__boton">
                  <Foto archivo={foto.archivo} alt={foto.titulo} />
                  <span className="mosaico__titulo">{foto.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
