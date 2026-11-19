// Lista de servicios del salón con precio, duración y botón para reservar.
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
import Desplegable from '../components/Desplegable.jsx';
import { olvidarResumenes, useResumenes } from '../lib/resumenesOpiniones.js';
import Migas from '../components/Migas.jsx';
import CarruselAuto from '../components/CarruselAuto.jsx';

const ORDEN_CATEGORIAS = ['Combos', 'Manos', 'Uñas acrílicas', 'Gel y polygel', 'Pies', 'Tratamientos', 'Hombres', 'Diseños y extras', 'Retiros y reparaciones'];

const Icono = {
  reloj: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  check: <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>,
  tijera: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="7" r="3" /><circle cx="6" cy="17" r="3" /><path d="M8.5 8.5 20 18M8.5 15.5 20 6" /></svg>
};

const ORDENES = { relevancia: 'Recomendados', calificacion: 'Mejor calificados', descuento: 'Mayor descuento', 'precio-asc': 'Precio: menor a mayor', 'precio-desc': 'Precio: mayor a menor', rapidos: 'Más rápidos' };
const PRECIOS = [['', 'Cualquier precio', () => true], ['15000', 'Hasta ₡15 000', (precio) => precio <= 15000], ['25000', '₡15 000 a ₡25 000', (precio) => precio > 15000 && precio <= 25000], ['mas', 'Más de ₡25 000', (p) => p > 25000]];
const DURACIONES = [['', 'Cualquier duración', () => true], ['1h', 'Hasta 1 hora', (minutos) => minutos <= 60], ['2h', '1 a 2 horas', (minutos) => minutos > 60 && minutos <= 120], ['mas', 'Más de 2 horas', (m) => m > 120]];

// Nombre: duracion
// Descripción: Escribe minutos como horas.
// Entrada: Los minutos.
// Salida: El texto.
// Objetivo: Leer fácil.
const duracion = (min) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`);
// Nombre: ahorro
// Descripción: Calcula cuánto se ahorra.
// Entrada: El servicio.
// Salida: El monto.
// Objetivo: Mostrar ahorro.
const ahorro = (servicio) => (servicio.precio_oferta != null ? servicio.precio - servicio.precio_oferta : 0);
// Nombre: porcentaje
// Descripción: Calcula el porcentaje de descuento.
// Entrada: El servicio.
// Salida: El porcentaje.
// Objetivo: Mostrar ahorro.
const porcentaje = (servicio) => Math.round((ahorro(servicio) / servicio.precio) * 100);

// Nombre: Precio
// Descripción: Muestra el precio con oferta.
// Entrada: El servicio y el tamaño.
// Salida: El precio.
// Objetivo: Ver cuánto cuesta.
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

// Nombre: TarjetaServicio
// Descripción: Muestra la tarjeta de un servicio.
// Entrada: El servicio y opiniones.
// Salida: La tarjeta.
// Objetivo: Ver la carta.
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
            {incluye.map((detalle) => <li key={detalle}>{Icono.check}{detalle}</li>)}
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

// Nombre: Servicios
// Descripción: Muestra la página de servicios.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Ver la carta y precios.
export default function Servicios() {
  useTitulo('Servicios y precios');
  const [params, setParams] = useSearchParams();
  const [servicios, setServicios] = useState([]);
  const [error, setError] = useState('');
  const [texto, setTexto] = useState('');
  const categoria = params.get('categoria') || 'Todos';
  const soloOfertas = params.get('ofertas') === '1';
  const orden = ORDENES[params.get('orden')] ? params.get('orden') : 'relevancia';
  const precio = PRECIOS.find((rango) => rango[0] === (params.get('precio') || '')) || PRECIOS[0];
  const tiempo = DURACIONES.find((rango) => rango[0] === (params.get('duracion') || '')) || DURACIONES[0];
  const resumenes = useResumenes('servicio');
  const [opiniones, setOpiniones] = useState(null);

  useEffect(() => {
    api.servicios().then(setServicios).catch((fallo) => setError(fallo.message));
  }, []);

  // Nombre: fijar
  // Descripción: Cambia un filtro.
  // Entrada: El filtro y el valor.
  // Salida: Nada.
  // Objetivo: Filtrar servicios.
  const fijar = (campo, valor) => { const parametros = new URLSearchParams(params); valor ? parametros.set(campo, valor) : parametros.delete(campo); setParams(parametros, { replace: true }); };
  // Nombre: limpiar
  // Descripción: Quita los filtros.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ver todo.
  const limpiar = () => { setTexto(''); setParams({}, { replace: true }); };
  const hayFiltros = categoria !== 'Todos' || soloOfertas || orden !== 'relevancia' || precio !== PRECIOS[0] || tiempo !== DURACIONES[0] || texto;

  const categorias = useMemo(() => ORDEN_CATEGORIAS.filter((categoria) => servicios.some((servicio) => servicio.categoria === categoria))
    .concat([...new Set(servicios.map((servicio) => servicio.categoria))].filter((categoria) => !ORDEN_CATEGORIAS.includes(categoria))), [servicios]);

  // Nombre: nota
  // Descripción: Da las estrellas de un servicio.
  // Entrada: El servicio.
  // Salida: El promedio.
  // Objetivo: Ordenar por calificación.
  const nota = (servicio) => resumenes.get(servicio.id)?.promedio || 0;
  const comparar = {
    // Nombre: relevancia
    // Descripción: Deja el orden normal.
    // Entrada: Nada.
    // Salida: Cero.
    // Objetivo: Orden recomendado.
    relevancia: () => 0,
    // Nombre: calificacion
    // Descripción: Ordena por estrellas.
    // Entrada: Dos servicios.
    // Salida: Cuál va primero.
    // Objetivo: Ver los mejores.
    calificacion: (a, b) => nota(b) - nota(a),
    // Nombre: descuento
    // Descripción: Ordena por descuento.
    // Entrada: Dos servicios.
    // Salida: Cuál va primero.
    // Objetivo: Ver las mejores ofertas.
    descuento: (a, b) => porcentaje(b) - porcentaje(a),
    // Nombre: precio-asc
    // Descripción: Ordena de menor a mayor precio.
    // Entrada: Dos servicios.
    // Salida: Cuál va primero.
    // Objetivo: Ver los más baratos.
    'precio-asc': (a, b) => (a.precio_oferta ?? a.precio) - (b.precio_oferta ?? b.precio),
    // Nombre: precio-desc
    // Descripción: Ordena de mayor a menor precio.
    // Entrada: Dos servicios.
    // Salida: Cuál va primero.
    // Objetivo: Ver los más completos.
    'precio-desc': (a, b) => (b.precio_oferta ?? b.precio) - (a.precio_oferta ?? a.precio),
    // Nombre: rapidos
    // Descripción: Ordena por duración.
    // Entrada: Dos servicios.
    // Salida: Cuál va primero.
    // Objetivo: Ver los más rápidos.
    rapidos: (a, b) => a.duracion_min - b.duracion_min
  }[orden];
  const filtrados = servicios.filter((servicio) => (categoria === 'Todos' || servicio.categoria === categoria)
    && (!soloOfertas || servicio.precio_oferta != null)
    && precio[2](servicio.precio_oferta ?? servicio.precio) && tiempo[2](servicio.duracion_min)
    && `${servicio.nombre} ${servicio.descripcion} ${servicio.incluye}`.toLowerCase().includes(texto.trim().toLowerCase()))
    .sort(comparar);

  const grupos = categorias.map((categoria) => [categoria, filtrados.filter((filtrado) => filtrado.categoria === categoria)]).filter(([, l]) => l.length);
  const ofertas = servicios.filter((servicio) => servicio.precio_oferta != null);
  const mayorAhorro = Math.max(0, ...ofertas.map(porcentaje));
  const comboMinimo = Math.min(...servicios.filter((servicio) => servicio.es_combo).map((servicio) => servicio.precio_oferta ?? servicio.precio));

  return (
    <div className="servicios-pagina">
      <div className="contenedor migas-arriba"><Migas pasos={[['Servicios']]} /></div>
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
            {ofertas.slice(0, 3).map((oferta) => (
              <li key={oferta.id}>
                <Link to={`/reservar?servicio=${oferta.id}`} className="campana__producto">
                  <span className="campana__etiqueta">-{porcentaje(oferta)}%</span>
                  <Foto archivo={oferta.imagen} alt="" />
                  <span className="servicios-campana__nombre">{oferta.nombre}</span>
                  <span className="campana__precio">{dinero(oferta.precio_oferta)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div id="lista-servicios" className="contenedor servicios-lista-nueva">
        <div className="barra-chips barra-filtros servicios-barra" role="group" aria-label="Filtros y orden">
          <button type="button" className={`chip-filtro chip-filtro--rayo ${soloOfertas ? 'chip-filtro--activo' : ''}`} aria-pressed={soloOfertas} onClick={() => fijar('ofertas', soloOfertas ? '' : '1')}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
            Solo ofertas
          </button>
          <Desplegable etiqueta={<span>Ordenar por: <b>{ORDENES[orden]}</b></span>}>
            {(cerrar) => (
              <div className="desplegable__opciones" role="radiogroup" aria-label="Ordenar por">
                {Object.entries(ORDENES).map(([clave, valor]) => (
                  <label key={clave} className="casilla"><input type="radio" name="orden-servicios" checked={orden === clave} onChange={() => { fijar('orden', clave === 'relevancia' ? '' : clave); cerrar(); }} /><span>{valor}</span></label>
                ))}
              </div>
            )}
          </Desplegable>
          <Desplegable etiqueta={categoria !== 'Todos' ? `Categoría: ${categoria}` : 'Categoría'} activo={categoria !== 'Todos'}>
            {(cerrar) => (
              <div className="desplegable__opciones" role="radiogroup" aria-label="Categoría">
                <label className="casilla"><input type="radio" name="cat-servicios" checked={categoria === 'Todos'} onChange={() => { fijar('categoria', ''); cerrar(); }} /><span>Todas</span><span className="casilla__cantidad">{servicios.length}</span></label>
                {categorias.map((categoriaActual) => (
                  <label key={categoriaActual} className="casilla">
                    <input type="radio" name="cat-servicios" checked={categoria === categoriaActual} onChange={() => { fijar('categoria', categoriaActual); cerrar(); }} />
                    <span>{categoriaActual}</span><span className="casilla__cantidad">{servicios.filter((servicio) => servicio.categoria === categoriaActual).length}</span>
                  </label>
                ))}
              </div>
            )}
          </Desplegable>
          <Desplegable etiqueta={precio === PRECIOS[0] ? 'Precio' : precio[1]} activo={precio !== PRECIOS[0]}>
            {(cerrar) => (
              <div className="desplegable__opciones" role="radiogroup" aria-label="Precio">
                {PRECIOS.map((rango) => (
                  <label key={rango[1]} className="casilla"><input type="radio" name="precio-servicios" checked={precio === rango} onChange={() => { fijar('precio', rango[0]); cerrar(); }} /><span>{rango[1]}</span></label>
                ))}
              </div>
            )}
          </Desplegable>
          <Desplegable etiqueta={tiempo === DURACIONES[0] ? 'Duración' : tiempo[1]} activo={tiempo !== DURACIONES[0]}>
            {(cerrar) => (
              <div className="desplegable__opciones" role="radiogroup" aria-label="Duración">
                {DURACIONES.map((rango) => (
                  <label key={rango[1]} className="casilla"><input type="radio" name="duracion-servicios" checked={tiempo === rango} onChange={() => { fijar('duracion', rango[0]); cerrar(); }} /><span>{rango[1]}</span></label>
                ))}
              </div>
            )}
          </Desplegable>
          {hayFiltros && <button type="button" className="chip-filtro chip-filtro--limpiar" onClick={limpiar} title="Quitar todos los filtros"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>Quitar</button>}
          <label className="buscador buscador--chico barra-filtros__buscar">
            <span className="solo-lector">Buscar servicio</span>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input type="search" value={texto} onChange={(evento) => setTexto(evento.target.value)} placeholder="Buscar servicio…" />
          </label>
          <p className="barra-filtros__cuenta" aria-live="polite">{filtrados.length} {filtrados.length === 1 ? 'servicio' : 'servicios'}</p>
        </div>

        {error && <p role="alert" className="error">{error}</p>}
        {servicios.length > 0 && filtrados.length === 0 && (
          <div className="vacio"><p>No hay servicios con esos filtros.</p><button type="button" className="boton boton--contorno" onClick={limpiar}>Ver todos</button></div>
        )}

        {grupos.map(([cat, lista]) => (
          <section key={cat} className="servicios-grupo" aria-labelledby={`g-${cat}`}>
            <div className="servicios-grupo__cabeza">
              <h2 id={`g-${cat}`}>{cat === 'Combos' ? 'Combos y paquetes' : cat === 'Hombres' ? 'Para hombres' : cat}</h2>
              {cat === 'Combos' && <p className="tenue">Varios servicios en una sola cita, a mejor precio.</p>}
              {cat === 'Hombres' && <p className="tenue">Cuidado de uñas, manos y pies para caballeros, con acabado natural.</p>}
            </div>
            <CarruselAuto key={`${categoria}-${soloOfertas}-${texto}-${orden}-${precio[0]}-${tiempo[0]}`} etiqueta={cat}
                          className={`servicios-rejilla servicios-rejilla--nueva ${cat === 'Combos' ? 'servicios-rejilla--combos' : ''}`}>
              {lista.map((elemento) => <TarjetaServicio key={elemento.id} s={elemento} opinion={resumenes.get(elemento.id)} onOpiniones={setOpiniones} />)}
            </CarruselAuto>
          </section>
        ))}
      </div>

      <section className="contenedor servicios-ayuda servicios-ayuda--foto">
        <Foto archivo={servicios.find((servicio) => servicio.categoria === 'Manos')?.imagen} alt="" className="servicios-ayuda__foto" />
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
