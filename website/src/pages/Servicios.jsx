import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero, enlaceWhatsApp } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import Decoracion from '../components/Decoracion.jsx';
import Contador from '../components/Contador.jsx';

const ORDEN_CATEGORIAS = ['Combos', 'Manos', 'Uñas acrílicas', 'Gel y polygel', 'Pies', 'Tratamientos', 'Diseños y extras', 'Retiros y reparaciones'];
const FECHA = new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'long' });

const Icono = {
  reloj: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  check: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>,
  tijera: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="7" r="3" /><circle cx="6" cy="17" r="3" /><path d="M8.5 8.5 20 18M8.5 15.5 20 6" /></svg>
};

const duracion = (min) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`);
const ahorro = (s) => (s.precio_oferta != null ? s.precio - s.precio_oferta : 0);
const porcentaje = (s) => Math.round((ahorro(s) / s.precio) * 100);

function Precio({ s, grande = false }) {
  return (
    <p className={`precio-servicio ${grande ? 'precio-servicio--grande' : ''}`}>
      {s.precio_oferta != null && (
        <span className="precio-servicio__antes"><span className="solo-lector">Antes </span>{dinero(s.precio)}</span>
      )}
      <span className="precio-servicio__ahora">
        {s.precio_oferta != null && <span className="solo-lector">Ahora </span>}
        {dinero(s.precio_oferta ?? s.precio)}
      </span>
    </p>
  );
}

function TarjetaServicio({ s }) {
  const incluye = (s.incluye || '').split('|').filter(Boolean);
  return (
    <li className={`servicio ${s.es_combo ? 'servicio--combo' : ''}`}>
      <div className="servicio__foto">
        <Foto archivo={s.imagen} alt="" />
        <div className="servicio__insignias">
          {s.etiqueta && <span className={`insignia-servicio insignia-servicio--${s.etiqueta.toLowerCase().replace(/\s/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '')}`}>{s.etiqueta}</span>}
          {ahorro(s) > 0 && <span className="insignia-servicio insignia-servicio--descuento">-{porcentaje(s)}{'\u00a0'}%</span>}
        </div>
      </div>
      <div className="servicio__cuerpo">
        <p className="servicio__categoria">{s.categoria}</p>
        <h3 className="servicio__nombre">{s.nombre}</h3>
        <p className="servicio__descripcion">{s.descripcion}</p>
        {incluye.length > 0 && (
          <ul className="servicio__incluye" aria-label="Incluye">
            {incluye.map((i) => <li key={i}>{Icono.check}{i}</li>)}
          </ul>
        )}
        <div className="servicio__pie">
          <div>
            <Precio s={s} />
            <p className="servicio__duracion">{Icono.reloj}{duracion(s.duracion_min)}</p>
          </div>
          <Link to={`/reservar?servicio=${s.id}`} className="boton boton--chico">Reservar<span className="solo-lector"> {s.nombre}</span></Link>
        </div>
        {ahorro(s) > 0 && <p className="servicio__ahorro">Ahorras {dinero(ahorro(s))}</p>}
      </div>
    </li>
  );
}

function Cupon({ c }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(c.codigo); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sin portapapeles */ }
  };
  const condiciones = [
    c.minimo > 0 && `Desde ${dinero(c.minimo)}`,
    c.solo_combos && 'Solo combos',
    c.vence && `Vence el ${FECHA.format(new Date(`${c.vence}T12:00:00`))}`
  ].filter(Boolean).join(' · ');
  return (
    <li className="cupon">
      <div className="cupon__valor">{c.tipo === 'porcentaje' ? `${c.valor}\u00a0%` : dinero(c.valor)}<span>de descuento</span></div>
      <div className="cupon__info">
        <p className="cupon__descripcion">{c.descripcion}</p>
        <p className="cupon__condiciones">{condiciones}</p>
        <div className="cupon__acciones">
          <code className="cupon__codigo">{c.codigo}</code>
          <button type="button" className="boton boton--contorno boton--chico" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button>
          <Link to={`/reservar?cupon=${c.codigo}`} className="enlace">Usar ahora</Link>
        </div>
        <span className="solo-lector" aria-live="polite">{copiado ? `Código ${c.codigo} copiado` : ''}</span>
      </div>
    </li>
  );
}

export default function Servicios() {
  useTitulo('Servicios y precios');
  const [params, setParams] = useSearchParams();
  const [servicios, setServicios] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [error, setError] = useState('');
  const [texto, setTexto] = useState('');
  const categoria = params.get('categoria') || 'Todos';
  const soloOfertas = params.get('ofertas') === '1';

  useEffect(() => {
    api.servicios().then(setServicios).catch((e) => setError(e.message));
    api.cupones().then(setCupones).catch(() => {});
  }, []);

  const fijar = (k, v) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };

  const categorias = useMemo(() => ORDEN_CATEGORIAS.filter((c) => servicios.some((s) => s.categoria === c))
    .concat([...new Set(servicios.map((s) => s.categoria))].filter((c) => !ORDEN_CATEGORIAS.includes(c))), [servicios]);

  const filtrados = servicios.filter((s) => (categoria === 'Todos' || s.categoria === categoria)
    && (!soloOfertas || s.precio_oferta != null)
    && `${s.nombre} ${s.descripcion} ${s.incluye}`.toLowerCase().includes(texto.trim().toLowerCase()));

  const grupos = categorias.map((c) => [c, filtrados.filter((s) => s.categoria === c)]).filter(([, l]) => l.length);
  const ofertas = servicios.filter((s) => s.precio_oferta != null);
  const mayorAhorro = Math.max(0, ...ofertas.map(porcentaje));
  const comboMinimo = Math.min(...servicios.filter((s) => s.es_combo).map((s) => s.precio_oferta ?? s.precio));

  return (
    <div className="servicios-pagina">
      <section className="servicios-hero">
        <Decoracion />
        <div className="contenedor servicios-hero__rejilla">
          <div>
            <p className="servicios-hero__antetitulo">Carta de servicios</p>
            <h1>Servicios y precios</h1>
            <p className="servicios-hero__texto">Manicure, uñas acrílicas, gel, pedicure y tratamientos para tus manos. Combina servicios en un combo y ahorra hasta {mayorAhorro}{'\u00a0'}%.</p>
            <div className="botones">
              <a href="#lista-servicios" className="boton boton--claro">Ver todos los servicios</a>
              <button type="button" className="boton boton--borde-claro" onClick={() => { fijar('ofertas', '1'); document.getElementById('lista-servicios')?.scrollIntoView(); }}>Ver ofertas</button>
            </div>
          </div>
          <ul className="servicios-hero__datos">
            <li>
              <span className="dato__icono" aria-hidden="true">💅</span>
              <strong><Contador valor={servicios.length} /></strong><span>servicios para manos y pies</span>
            </li>
            <li>
              <span className="dato__icono" aria-hidden="true">🏷️</span>
              <strong><Contador valor={ofertas.length} /></strong><span>servicios en oferta</span>
            </li>
            <li>
              <span className="dato__icono" aria-hidden="true">✨</span>
              <strong>{Number.isFinite(comboMinimo) ? <Contador valor={comboMinimo} formato={dinero} /> : '—'}</strong><span>combos desde</span>
            </li>
          </ul>
        </div>
        <svg className="onda" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30 C 240 70 480 0 720 26 S 1200 60 1440 20 V60 H0 Z" /></svg>
      </section>

      {cupones.length > 0 && (
        <section className="contenedor cupones-seccion" aria-labelledby="t-cupones">
          <div className="seccion__cabeza">
            <h2 id="t-cupones">Cupones disponibles</h2>
            <p className="tenue">Escribe el código al reservar y el descuento se aplica solo.</p>
          </div>
          <ul className="cupones">{cupones.map((c) => <Cupon key={c.codigo} c={c} />)}</ul>
        </section>
      )}

      <div id="lista-servicios" className="contenedor servicios-lista-nueva">
        <div className="servicios-filtros">
          <div className="pestanas" role="group" aria-label="Categorías">
            {['Todos', ...categorias].map((c) => (
              <button key={c} type="button" className="pestana" aria-pressed={categoria === c} onClick={() => fijar('categoria', c === 'Todos' ? '' : c)}>{c}</button>
            ))}
          </div>
          <div className="servicios-filtros__fila">
            <label className="buscador buscador--chico">
              <span className="solo-lector">Buscar servicio</span>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Busca: pedicure, francesa, parafina…" />
            </label>
            <label className="casilla">
              <input type="checkbox" checked={soloOfertas} onChange={(e) => fijar('ofertas', e.target.checked ? '1' : '')} />
              <span>Solo ofertas</span>
            </label>
          </div>
        </div>

        {error && <p role="alert" className="error">{error}</p>}
        <p className="tenue" aria-live="polite">{filtrados.length} {filtrados.length === 1 ? 'servicio' : 'servicios'}</p>
        {servicios.length > 0 && filtrados.length === 0 && (
          <div className="vacio"><p>No hay servicios con esos filtros.</p><button type="button" className="boton boton--contorno" onClick={() => { setTexto(''); setParams({}, { replace: true }); }}>Ver todos</button></div>
        )}

        {grupos.map(([cat, lista]) => (
          <section key={cat} className="servicios-grupo" aria-labelledby={`g-${cat}`}>
            <div className="servicios-grupo__cabeza">
              <h2 id={`g-${cat}`}>{cat === 'Combos' ? 'Combos y paquetes' : cat}</h2>
              {cat === 'Combos' && <p className="tenue">Varios servicios en una sola cita, a mejor precio.</p>}
            </div>
            <ul className={`servicios-rejilla ${cat === 'Combos' ? 'servicios-rejilla--combos' : ''}`}>
              {lista.map((s) => <TarjetaServicio key={s.id} s={s} />)}
            </ul>
          </section>
        ))}
      </div>

      <section className="contenedor servicios-ayuda">
        <div>
          <h2>¿No sabes cuál elegir?</h2>
          <p>Diseña tus uñas y te recomendamos el servicio, o escríbenos y te asesoramos sin compromiso.</p>
        </div>
        <div className="botones">
          <Link to="/disena" className="boton">Diseñar mis uñas</Link>
          <a href={enlaceWhatsApp('Hola, quiero que me ayuden a elegir un servicio.')} target="_blank" rel="noreferrer" className="boton boton--contorno">Escribir por WhatsApp</a>
        </div>
      </section>
    </div>
  );
}
