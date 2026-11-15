import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero, enlaceWhatsApp } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import Decoracion from '../components/Decoracion.jsx';
import Contador from '../components/Contador.jsx';
import Modal from '../components/Modal.jsx';
import Resenas from '../components/Resenas.jsx';
import { olvidarResumenes, useResumenes } from '../lib/resumenes.js';

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

function TarjetaServicio({ s, opinion, onOpiniones }) {
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
        {opinion && (
          <button type="button" className="servicio__opiniones" onClick={() => onOpiniones(s)}>
            <span className="estrellas-mini" aria-hidden="true" style={{ '--p': `${(opinion.promedio / 5) * 100}%` }}>★★★★★</span>
            <b>{opinion.promedio}</b> <span>({opinion.total} opiniones)</span>
            <span className="solo-lector">: {opinion.promedio} de 5 estrellas. Ver opiniones de {s.nombre}</span>
          </button>
        )}
        <p className="servicio__descripcion">{s.descripcion}</p>
        {incluye.length > 0 && (
          <ul className="servicio__incluye" aria-label="Incluye">
            {incluye.map((i) => <li key={i}>{Icono.check}{i}</li>)}
          </ul>
        )}
        <div className="servicio__pie">
          <Precio s={s} />
          <p className="servicio__duracion">{Icono.reloj}{duracion(s.duracion_min)}</p>
        </div>
        {ahorro(s) > 0 && <p className="servicio__ahorro">Ahorras {dinero(ahorro(s))}</p>}
        <Link to={`/reservar?servicio=${s.id}`} className="servicio__reservar">Reservar<span className="solo-lector"> {s.nombre}</span></Link>
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
  const resumenes = useResumenes('servicio');
  const [opiniones, setOpiniones] = useState(null);

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
      <section className="campana servicios-campana" aria-labelledby="t-servicios">
        <Decoracion />
        <div className="contenedor campana__rejilla">
          <div className="servicios-campana__texto">
            <p className="servicios-hero__antetitulo">Carta de servicios</p>
            <h1 id="t-servicios" className="servicios-campana__titulo">Servicios y precios</h1>
            <p className="servicios-hero__texto">Manicure, uñas acrílicas, gel, pedicure y tratamientos para tus manos. Combina servicios en un combo y ahorra hasta {mayorAhorro}{'\u00a0'}%.</p>
            <ul className="servicios-campana__datos">
              <li><strong><Contador valor={servicios.length} /></strong> servicios</li>
              <li><strong><Contador valor={ofertas.length} /></strong> en oferta</li>
              <li><strong>{Number.isFinite(comboMinimo) ? <Contador valor={comboMinimo} formato={dinero} /> : '—'}</strong> combos desde</li>
            </ul>
            <div className="botones">
              <a href="#lista-servicios" className="campana__boton servicios-campana__boton">Ver servicios</a>
              <button type="button" className="boton boton--borde-claro" onClick={() => { fijar('ofertas', '1'); document.getElementById('lista-servicios')?.scrollIntoView({ behavior: 'smooth' }); }}>Ver ofertas</button>
            </div>
          </div>
          <ul className="campana__productos servicios-campana__fotos" aria-label="Servicios en oferta">
            {ofertas.slice(0, 3).map((s) => (
              <li key={s.id}>
                <Link to={`/reservar?servicio=${s.id}`} className="campana__producto">
                  <span className="campana__etiqueta">-{porcentaje(s)}%</span>
                  <Foto archivo={s.imagen} alt="" />
                  <span className="servicios-campana__nombre">{s.nombre}</span>
                  <span className="campana__precio">{dinero(s.precio_oferta)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
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
        <div className="servicios-filtros servicios-filtros--nuevo">
          <div className="filtro-fotos" role="group" aria-label="Categorías">
            {['Todos', ...categorias].map((c) => {
              const foto = c === 'Todos' ? servicios[0]?.imagen : servicios.find((s) => s.categoria === c)?.imagen;
              const n = c === 'Todos' ? servicios.length : servicios.filter((s) => s.categoria === c).length;
              return (
                <button key={c} type="button" className="filtro-foto" aria-pressed={categoria === c} onClick={() => fijar('categoria', c === 'Todos' ? '' : c)}>
                  <span className="filtro-foto__img"><Foto archivo={foto} alt="" /></span>
                  <span className="filtro-foto__nombre">{c}</span>
                  <span className="filtro-foto__n">{n}</span>
                </button>
              );
            })}
          </div>
          <div className="servicios-filtros__fila">
            <label className="buscador buscador--chico">
              <span className="solo-lector">Buscar servicio</span>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Busca: pedicure, francesa, parafina…" />
            </label>
            <label className="interruptor">
              <input type="checkbox" role="switch" checked={soloOfertas} onChange={(e) => fijar('ofertas', e.target.checked ? '1' : '')} />
              <span className="interruptor__pista" aria-hidden="true"><span /></span>
              <span>Solo ofertas</span>
            </label>
            <p className="tenue servicios-filtros__cuenta" aria-live="polite">{filtrados.length} {filtrados.length === 1 ? 'servicio' : 'servicios'}</p>
          </div>
        </div>

        {error && <p role="alert" className="error">{error}</p>}
        {servicios.length > 0 && filtrados.length === 0 && (
          <div className="vacio"><p>No hay servicios con esos filtros.</p><button type="button" className="boton boton--contorno" onClick={() => { setTexto(''); setParams({}, { replace: true }); }}>Ver todos</button></div>
        )}

        {grupos.map(([cat, lista]) => (
          <section key={cat} className="servicios-grupo" aria-labelledby={`g-${cat}`}>
            <div className="servicios-grupo__cabeza">
              <h2 id={`g-${cat}`}>{cat === 'Combos' ? 'Combos y paquetes' : cat}</h2>
              {cat === 'Combos' && <p className="tenue">Varios servicios en una sola cita, a mejor precio.</p>}
            </div>
            <ul key={`${categoria}-${soloOfertas}-${texto}`} className={`servicios-rejilla servicios-rejilla--nueva ${cat === 'Combos' ? 'servicios-rejilla--combos' : ''}`}>
              {lista.map((s) => <TarjetaServicio key={s.id} s={s} opinion={resumenes.get(s.id)} onOpiniones={setOpiniones} />)}
            </ul>
          </section>
        ))}
      </div>

      <section className="contenedor servicios-ayuda servicios-ayuda--foto">
        <Foto archivo={servicios.find((x) => x.categoria === 'Manos')?.imagen} alt="" className="servicios-ayuda__foto" />
        <div>
          <h2>¿No sabes cuál elegir?</h2>
          <p>Diseña tus uñas y te recomendamos el servicio, o escríbenos y te asesoramos sin compromiso.</p>
        </div>
        <div className="botones">
          <Link to="/disena" className="boton">Diseñar mis uñas</Link>
          <a href={enlaceWhatsApp('Hola, quiero que me ayuden a elegir un servicio.')} target="_blank" rel="noreferrer" className="boton boton--contorno">Escribir por WhatsApp</a>
        </div>
      </section>

      {opiniones && (
        <Modal titulo={`Opiniones de ${opiniones.nombre}`} onCerrar={() => setOpiniones(null)} ancho>
          <div className="opiniones-servicio">
            <div className="opiniones-servicio__cabeza">
              <Foto archivo={opiniones.imagen} alt="" />
              <div>
                <p className="servicio__categoria">{opiniones.categoria}</p>
                <p className="opiniones-servicio__nombre">{opiniones.nombre}</p>
                <p className="tenue">{dinero(opiniones.precio_oferta ?? opiniones.precio)} · {duracion(opiniones.duracion_min)}</p>
              </div>
              <Link to={`/reservar?servicio=${opiniones.id}`} className="boton">Reservar</Link>
            </div>
            <Resenas tipo="servicio" refId={opiniones.id} compacto onCambio={() => olvidarResumenes('servicio')} />
          </div>
        </Modal>
      )}
    </div>
  );
}
