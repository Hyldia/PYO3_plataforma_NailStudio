import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { SALON, dinero, enlaceWhatsApp } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import ProductoImagen from '../components/ProductoImagen.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import Decoracion from '../components/Decoracion.jsx';

const CATEGORIAS = [
  { nombre: 'Esmaltes y geles', tipo: 'frasco-gel', color: '#E0245E', to: '/tienda?categoria=Esmaltes y geles' },
  { nombre: 'Rubber base', tipo: 'frasco-gel', color: '#F2C8CF', to: '/tienda?q=rubber' },
  { nombre: 'Lámparas', tipo: 'lampara', color: '#fff', to: '/tienda?categoria=Equipos' },
  { nombre: 'Herramientas', tipo: 'alicate', color: '#C0C4C8', to: '/tienda?categoria=Herramientas' },
  { nombre: 'Limas', tipo: 'lima', color: '#1E1A1C', to: '/tienda?categoria=Limas y pulidores' },
  { nombre: 'Cuidado de manos', tipo: 'crema', color: '#F2D4CB', to: '/tienda?categoria=Cuidado de manos' },
  { nombre: 'Pedicure', tipo: 'crema', color: '#A8E0C8', to: '/tienda?categoria=Pedicure' },
  { nombre: 'Manicure pro', tipo: 'caja', color: '#D9B79A', to: '/tienda?categoria=Manicure profesional' },
  { nombre: 'Aceites', tipo: 'gotero', color: '#E8B65C', to: '/tienda?q=aceite' },
  { nombre: 'Decoración', tipo: 'tarro', color: '#D4AF37', to: '/tienda?categoria=Decoración' },
  { nombre: 'Press-on', tipo: 'tips', color: '#E9A3BC', to: '/tienda?categoria=Tips y press-on' },
  { nombre: 'Kits', tipo: 'kit', color: '#8C1D4B', to: '/tienda?categoria=Kits' }
];

const Flecha = () => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>;

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

export default function Inicio() {
  useTitulo('');
  const [ofertas, setOfertas] = useState([]);
  const [vendidos, setVendidos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    api.productos({ ofertas: '1', orden: 'descuento', limite: 12 }).then(setOfertas).catch(() => {});
    api.productos({ orden: 'vendidos', limite: 12 }).then(setVendidos).catch(() => {});
    api.servicios().then(setServicios).catch(() => {});
    api.fotos({ limite: 10, orden: 'populares' }).then((r) => setFotos(r.fotos)).catch(() => {});
  }, []);

  const serviciosOferta = servicios.filter((s) => s.precio_oferta != null);
  const combos = servicios.filter((s) => s.es_combo);
  const agregado = (p) => setAviso(`${p.nombre} se agregó al carrito.`);
  const maxDescuento = Math.max(0, ...ofertas.map((p) => Math.round((1 - p.precio / p.precio_anterior) * 100)));

  return (
    <>
      <p role="status" className="solo-lector">{aviso}</p>

      {/* Banner principal */}
      <section className="banner" aria-labelledby="t-banner">
        <Decoracion />
        <div className="contenedor banner__rejilla">
          <div className="banner__texto">
            <p className="banner__antetitulo">Ofertas de temporada</p>
            <h1 id="t-banner"><span>Hasta</span> {maxDescuento || 40}{' '}% <span>de descuento</span></h1>
            <p className="banner__bajada">En productos para tus uñas y en combos de manicure y pedicure.</p>
            <CuentaRegresiva claro />
            <div className="botones">
              <Link to="/tienda?ofertas=1&orden=descuento" className="boton boton--claro boton--grande">Comprar ya <Flecha /></Link>
              <Link to="/reservar" className="boton boton--borde-claro boton--grande">Reservar cita</Link>
            </div>
          </div>
          <ul className="banner__productos" aria-label="Ofertas destacadas">
            {ofertas.slice(0, 3).map((p) => (
              <li key={p.id}>
                <Link to={`/tienda?q=${encodeURIComponent(p.nombre)}`} className="banner__producto">
                  <ProductoImagen producto={p} />
                  <span className="banner__precio">{dinero(p.precio)}<s>{dinero(p.precio_anterior)}</s></span>
                  <span className="solo-lector">{p.nombre}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <svg className="onda" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30 C 240 70 480 0 720 26 S 1200 60 1440 20 V60 H0 Z" /></svg>
      </section>

      {/* Compra por categoría */}
      <section className="contenedor categorias" aria-labelledby="t-categorias">
        <h2 id="t-categorias" className="solo-lector">Compra por categoría</h2>
        <ul className="categorias__lista">
          {CATEGORIAS.map((c) => (
            <li key={c.nombre} className="categoria-circulo">
              <Link to={c.to}>
                <span className="categoria-circulo__imagen" aria-hidden="true"><ProductoImagen producto={{ nombre: '', tipo: c.tipo, color: c.color }} /></span>
                <span className="categoria-circulo__nombre">{c.nombre}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Franja de confianza */}
      <div className="contenedor">
        <section className="confianza" aria-label={`Por qué elegir ${SALON.nombre}`}>
          <p className="confianza__titulo">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4z" /></svg>
            ¿Por qué elegir {SALON.nombre}?
          </p>
          <ul className="confianza__lista">
            <li>Productos profesionales</li>
            <li>Pago seguro con SINPE o tarjeta</li>
            <li>Retiro gratis en el salón</li>
            <li>Especialistas certificadas</li>
          </ul>
        </section>
      </div>

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
            {ofertas.slice(3, 6).map((p) => <TarjetaProducto key={p.id} p={p} onAgregar={agregado} />)}
          </ul>
        </section>
        <section className="bloque-ofertas" aria-labelledby="t-serv-oferta">
          <div className="bloque-ofertas__cabeza">
            <h2 id="t-serv-oferta" className="titulo-oferta">
              <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a4 4 0 0 0-4 4v9a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" /></svg>
              Servicios en oferta
            </h2>
            <Link to="/servicios?ofertas=1" className="enlace-flecha">Ver todos <Flecha /></Link>
          </div>
          <ul className="productos-rejilla productos-rejilla--tres">
            {serviciosOferta.slice(0, 3).map((s) => <TarjetaServicioMini key={s.id} s={s} />)}
          </ul>
        </section>
      </div>

      {/* Combos */}
      {combos.length > 0 && (
        <section className="contenedor seccion-tienda" aria-labelledby="t-combos">
          <div className="bloque-ofertas__cabeza">
            <h2 id="t-combos">Combos para consentirte</h2>
            <Link to="/servicios?categoria=Combos" className="enlace-flecha">Ver combos <Flecha /></Link>
          </div>
          <ul className="productos-rejilla">
            {combos.slice(0, 6).map((s) => <TarjetaServicioMini key={s.id} s={s} />)}
          </ul>
        </section>
      )}

      {/* Más vendidos */}
      <section className="contenedor seccion-tienda" aria-labelledby="t-vendidos">
        <div className="bloque-ofertas__cabeza">
          <h2 id="t-vendidos">Lo más vendido en la tienda</h2>
          <Link to="/tienda?orden=vendidos" className="enlace-flecha">Ver la tienda <Flecha /></Link>
        </div>
        <ul className="productos-rejilla">
          {vendidos.map((p) => <TarjetaProducto key={p.id} p={p} onAgregar={agregado} />)}
        </ul>
      </section>

      {/* Galería */}
      {fotos.length > 0 && (
        <section className="contenedor seccion-tienda" aria-labelledby="t-galeria">
          <div className="bloque-ofertas__cabeza">
            <h2 id="t-galeria">Diseños favoritos de nuestras clientas</h2>
            <Link to="/galeria" className="enlace-flecha">Ver galería <Flecha /></Link>
          </div>
          <ul className="mosaico">
            {fotos.map((f, i) => (
              <li key={f.id}>
                <Link to={`/galeria/${f.id}`} className="mosaico__boton">
                  <Foto archivo={f.archivo} alt={f.titulo} />
                  <span className="mosaico__titulo">{f.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Visítanos */}
      <section className="seccion seccion--oscura" aria-labelledby="t-visita">
        <div className="contenedor visita">
          <div>
            <h2 id="t-visita">Visítanos</h2>
            <p>{SALON.direccion}</p>
            <dl className="horario horario--claro">
              {SALON.horario.map((h) => (<div key={h.dias}><dt>{h.dias}</dt><dd>{h.horas}</dd></div>))}
            </dl>
            <a className="boton boton--claro" href={enlaceWhatsApp('Hola, quisiera hacer una consulta.')} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
          </div>
          {SALON.mapaEmbed && (
            <iframe className="mapa" title={`Mapa de ubicación de ${SALON.nombre}`} src={SALON.mapaEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          )}
        </div>
      </section>

    </>
  );
}
