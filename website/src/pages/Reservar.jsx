import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useReserva } from '../context/ReservaContext.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import { dinero } from '../config.js';
import { describir } from '../patrones/constructorDiseno.js';
import { useTitulo } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import MuestraUnas from '../components/DibujoUnas.jsx';
import Decoracion from '../components/Decoracion.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import VerMas from '../components/VerMas.jsx';
import Migas from '../components/Migas.jsx';

const DIA = new Intl.DateTimeFormat('es-CR', { weekday: 'short' });
const MES = new Intl.DateTimeFormat('es-CR', { month: 'short' });
const LARGA = new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long' });
const CORTA = new Intl.DateTimeFormat('es-CR', { weekday: 'short', day: 'numeric', month: 'short' });
const NOMBRES_DIA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const aISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const deISO = (iso) => new Date(`${iso}T12:00:00`);
const sinPunto = (t) => t.replace(/\./g, '');
const trabaja = (e, iso) => !e || String(e.dias || '').split(',').map(Number).includes(deISO(iso).getDay() || 7);

// Próximos 14 días en que abre el salón (domingo cerrado)
function proximosDias() {
  const dias = []; const d = new Date();
  while (dias.length < 14) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) dias.push(new Date(d)); }
  return dias;
}

// Especialista recomendada según el tipo de servicio (por su especialidad)
function recomendada(e, s) {
  if (!s) return false;
  const esp = e.especialidad.toLowerCase();
  const ser = `${s.categoria} ${s.nombre}`.toLowerCase();
  return (/acr[ií]l|polygel/.test(ser) && /acr[ií]l|polygel/.test(esp)) || (/pie|pedicure/.test(ser) && /pedicure|pie/.test(esp))
    || (/diseño|art/.test(ser) && /art|diseñ/.test(esp)) || (/rusa/.test(ser) && /rusa/.test(esp)) || (/francesa|boomer/.test(ser) && /francesa/.test(esp))
    || (/spa|hidrata|parafina/.test(ser) && /spa|hidrata/.test(esp)) || (/builder|fortalec/.test(ser) && /builder/.test(esp));
}

const COLORES = ['#C2507C', '#8C1D4B', '#E0245E', '#B07A8C', '#9C4A6A'];
const Retrato = ({ e, i = 0, grande = false }) => (
  <span className={`retrato ${grande ? 'retrato--grande' : ''}`} style={{ '--color': COLORES[i % COLORES.length] }} aria-hidden="true">
    {e.foto ? <Foto archivo={e.foto} alt="" /> : e.nombre[0]}
  </span>
);

export default function Reservar() {
  useTitulo('Reservar cita');
  const [params] = useSearchParams();
  const irA = useNavigate();
  const carrito = useCarrito();
  const { reserva, reiniciar } = useReserva();
  const [paso, setPaso] = useState(0);
  const [servicios, setServicios] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [categoria, setCategoria] = useState('Todos');
  const [paginaServicios, setPaginaServicios] = useState(1);
  const POR_PAGINA_SERVICIOS = 9;
  const dias = useMemo(proximosDias, []);
  const [sel, setSel] = useState({ servicioId: Number(params.get('servicio')) || null, especialistaId: null, fecha: aISO(dias[0]), hora: null });
  const [notas, setNotas] = useState(reserva.diseno?.notas || '');
  // Acompañante: otra persona, otra cita aparte (con su propio diseño en el salón)
  const [acompana, setAcompana] = useState({ activo: false, nombre: '', servicioId: null, modo: 'otra', especialistaId: null });
  const [libresMismaHora, setLibresMismaHora] = useState([]);
  const [error, setError] = useState('');
  const [agregando, setAgregando] = useState(false);
  const refEspecialistas = useRef(null);

  useEffect(() => {
    Promise.all([api.servicios(), api.especialistas()])
      .then(([s, e]) => { setServicios(s); setEspecialistas(e); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!sel.especialistaId) return;
    api.disponibilidad(sel.especialistaId, sel.fecha).then(setHorarios).catch(() => setHorarios([]));
  }, [sel.especialistaId, sel.fecha]);

  useEffect(() => {
    if (!sel.especialistaId) { setAgenda([]); return; }
    api.agenda(sel.especialistaId, 8).then(setAgenda).catch(() => setAgenda([]));
  }, [sel.especialistaId]);

  useEffect(() => {
    if (!acompana.activo || !sel.hora) return;
    api.libres(sel.fecha, sel.hora).then((ids) => setLibresMismaHora(ids.filter((id) => id !== sel.especialistaId))).catch(() => setLibresMismaHora([]));
  }, [acompana.activo, sel.fecha, sel.hora, sel.especialistaId]);

  const categorias = useMemo(() => ['Todos', ...new Set(servicios.map((s) => s.categoria))], [servicios]);
  const visibles = categoria === 'Todos' ? servicios : servicios.filter((s) => s.categoria === categoria);
  const serviciosPagina = visibles.slice((paginaServicios - 1) * POR_PAGINA_SERVICIOS, paginaServicios * POR_PAGINA_SERVICIOS);
  const servicio = servicios.find((s) => s.id === sel.servicioId);
  const especialista = especialistas.find((e) => e.id === sel.especialistaId);
  const indiceEsp = especialistas.findIndex((e) => e.id === sel.especialistaId);
  const recargo = reserva.diseno?.precio || 0;
  const precio = (s) => (s ? (s.precio_oferta ?? s.precio) : 0);
  const servicioAcomp = servicios.find((s) => s.id === acompana.servicioId);
  // Con la misma especialista, la acompañante va en la siguiente hora libre del mismo día
  const siguienteHora = horarios.find((h) => h.disponible && sel.hora && h.hora > sel.hora)?.hora;
  const espAcomp = acompana.modo === 'misma' ? especialista : especialistas.find((e) => e.id === acompana.especialistaId);
  const horaAcomp = acompana.modo === 'misma' ? siguienteHora : sel.hora;
  const acompanaLista = acompana.activo && servicioAcomp && espAcomp && horaAcomp;
  const total = precio(servicio) + recargo + (acompanaLista ? precio(servicioAcomp) : 0);
  const libres = horarios.filter((h) => h.disponible).length;
  const grupos = [
    ['Mañana', horarios.filter((h) => Number(h.hora.slice(0, 2)) < 12)],
    ['Tarde', horarios.filter((h) => Number(h.hora.slice(0, 2)) >= 12 && Number(h.hora.slice(0, 2)) < 17)],
    ['Noche', horarios.filter((h) => Number(h.hora.slice(0, 2)) >= 17)]
  ].filter(([, l]) => l.length);

  const puedeSeguir = [servicio && especialista, sel.hora, !acompana.activo || acompanaLista][paso];
  const textoBoton = paso === 0 ? (!servicio ? 'Elige un servicio' : !especialista ? 'Elige a tu especialista' : 'Continuar: fecha y hora')
    : paso === 1 ? (sel.hora ? 'Continuar' : 'Elige una hora')
      : agregando ? 'Agregando…' : acompana.activo && !acompanaLista ? 'Completa la cita de tu acompañante' : `Agregar al carrito (${acompana.activo ? 2 : 1} ${acompana.activo ? 'citas' : 'cita'})`;

  function elegirServicio(id) {
    setSel({ ...sel, servicioId: id });
    if (!sel.especialistaId) setTimeout(() => refEspecialistas.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }

  function elegirEspecialista(e) {
    const primerDia = dias.find((d) => trabaja(e, aISO(d)));
    setSel({ ...sel, especialistaId: e.id, hora: null, fecha: trabaja(e, sel.fecha) ? sel.fecha : aISO(primerDia || dias[0]) });
  }

  // Desde la ficha: tocar una hora libre la elige y pasa a fecha y hora
  function elegirDeAgenda(fecha, hora) {
    setSel((s) => ({ ...s, fecha, hora }));
    if (servicio) { setPaso(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  async function agregarAlCarrito() {
    setAgregando(true);
    setError('');
    try {
      // Un diseño por persona: el de la clienta se guarda ahora y viaja en su cita
      let disenoId = null;
      if (reserva.diseno) disenoId = (await api.guardarDiseno({ ...reserva.diseno, notas, fotoRefId: reserva.fotoRef?.id })).id;
      const disenoTexto = reserva.diseno ? describir(reserva.diseno) : reserva.fotoRef?.titulo || null;
      const base = (s, e, hora, extra) => ({
        id: `cita-${s.id}`, nombre: s.nombre, precio: precio(s) + (extra.recargo || 0), precio_anterior: s.precio_oferta != null ? s.precio + (extra.recargo || 0) : null,
        imagen: extra.imagen || s.imagen, servicioId: s.id, especialistaId: e.id, especialistaNombre: e.nombre,
        fecha: sel.fecha, fechaTexto: CORTA.format(deISO(sel.fecha)), hora, duracion_min: s.duracion_min, ...extra,
        imagen: extra.imagen || s.imagen
      });
      const citas = [base(servicio, especialista, sel.hora, {
        recargo, disenoId, fotoRefId: reserva.fotoRef?.id || null, disenoTexto, imagen: reserva.fotoRef?.archivo, notas
      })];
      if (acompana.activo) {
        citas.push(base(servicioAcomp, espAcomp, horaAcomp, { persona: acompana.nombre.trim() || 'Acompañante', disenoTexto: null }));
      }
      carrito.agregarCitas(citas);
      reiniciar();
      irA('/carrito');
    } catch (e) {
      setError(e.message);
      setAgregando(false);
    }
  }

  function enviar(e) {
    e.preventDefault();
    if (!puedeSeguir) return;
    if (paso === 2) { agregarAlCarrito(); return; }
    setPaso(paso + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Pasos con imágenes: la foto del servicio, la especialista y el día elegidos
  const pasos = [
    { nombre: 'Servicio', imagen: servicio ? <Foto archivo={reserva.fotoRef?.archivo || servicio.imagen} alt="" /> : null },
    { nombre: 'Fecha y hora', imagen: sel.hora ? <span className="pasos-reserva__dia">{deISO(sel.fecha).getDate()}<small>{sel.hora}</small></span> : especialista ? <Retrato e={especialista} i={indiceEsp} /> : null },
    { nombre: 'Revisar y agregar', imagen: null }
  ];

  return (
    <>
      <div className="contenedor migas-arriba"><Migas pasos={[['Servicios', '/servicios'], ['Reservar cita']]} /></div>
      <section className="reserva-portada" aria-labelledby="t-reservar">
        <Decoracion />
        <div className="contenedor reserva-portada__rejilla">
          <div>
            <p className="reserva-portada__ante">Reserva en 2 minutos</p>
            <h1 id="t-reservar">Reserva tu cita</h1>
            <ul className="reserva-portada__beneficios">
              <li>✓ Confirmación por WhatsApp</li>
              <li>✓ Recordatorio un día antes</li>
              <li>✓ Apartas con solo el 30 %</li>
            </ul>
          </div>
          <div className="reserva-portada__equipo" aria-label={`${especialistas.length} especialistas`}>
            <div className="reserva-portada__caras">
              {especialistas.slice(0, 6).map((e, i) => <Retrato key={e.id} e={e} i={i} />)}
            </div>
            <p><strong>{especialistas.length} especialistas</strong> listas para atenderte</p>
            <p className="reserva-portada__reloj">-15% con BIENVENIDA15 · termina en <CuentaRegresiva compacta /></p>
          </div>
        </div>
      </section>

      <div className="contenedor pagina reservar-pagina">
        <ol className="pasos-reserva" aria-label="Pasos de la reserva" style={{ '--avance': `${(paso / 2) * 100}%` }}>
          {pasos.map((p, i) => (
            <li key={p.nombre} className={i === paso ? 'actual' : i < paso ? 'hecho' : ''} aria-current={i === paso ? 'step' : undefined}>
              <button type="button" disabled={i > paso} onClick={() => setPaso(i)}>
                <span className="pasos-reserva__icono">{p.imagen || <b>{i + 1}</b>}</span>
                <span>{p.nombre}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="reservar">
          <form id="form-reserva" className="reservar__form" onSubmit={enviar} noValidate>
            {paso === 0 && (
              <div className="paso-anim" key="p0">
                {reserva.fotoRef && (
                  <div className="diseno-elegido">
                    <Foto archivo={reserva.fotoRef.archivo} alt={reserva.fotoRef.titulo} />
                    <div>
                      <p className="diseno-elegido__ante">Tu diseño</p>
                      <p className="diseno-elegido__titulo">{reserva.fotoRef.titulo}</p>
                      <p className="tenue">Un diseño por persona. Ahora elige el servicio con el que lo hacemos.</p>
                    </div>
                    <Link to="/galeria" className="chip-filtro chip-filtro--borde">Cambiar</Link>
                  </div>
                )}
                <fieldset className="grupo">
                  <legend className="grupo__titulo">¿Qué te quieres hacer?</legend>
                  <div className="barra-chips barra-chips--quieta" role="group" aria-label="Filtrar por tipo">
                    {categorias.map((c) => (
                      <button key={c} type="button" className={`chip-filtro ${categoria === c ? 'chip-filtro--activo' : ''}`} aria-pressed={categoria === c} onClick={() => { setCategoria(c); setPaginaServicios(1); }}>
                        {c} <span className="chip-filtro__n">{c === 'Todos' ? servicios.length : servicios.filter((s) => s.categoria === c).length}</span>
                      </button>
                    ))}
                  </div>
                  <div className="servicios-elegir">
                    {serviciosPagina.map((s, n) => {
                      const desc = s.precio_oferta != null ? Math.round((1 - s.precio_oferta / s.precio) * 100) : 0;
                      return (
                        <label key={s.id} className="servicio-elegir" style={{ '--retraso': `${Math.min(n, 12) * 40}ms` }}>
                          <input type="radio" name="servicio" className="solo-lector" checked={sel.servicioId === s.id} onChange={() => elegirServicio(s.id)} />
                          <span className="servicio-elegir__foto">
                            <Foto archivo={s.imagen} alt="" />
                            {s.etiqueta && <span className={`servicio-elegir__etiqueta servicio-elegir__etiqueta--${s.etiqueta === 'Más pedido' ? 'top' : 'oferta'}`}>{s.etiqueta}</span>}
                            {desc > 0 && <span className="servicio-elegir__pct">-{desc}%</span>}
                            <span className="servicio-elegir__check" aria-hidden="true">✓</span>
                          </span>
                          <span className="servicio-elegir__cuerpo">
                            <strong>{s.nombre}</strong>
                            <span className="servicio-elegir__datos">{s.duracion_min} min · {s.categoria}</span>
                            {s.incluye && <span className="servicio-elegir__incluye">{s.incluye.split('|').slice(0, 3).join(' · ')}</span>}
                            <span className="servicio-elegir__precio">
                              <b className={desc ? 'linea-carrito__oferta' : ''}>{dinero(s.precio_oferta ?? s.precio)}</b>
                              {desc > 0 && <s>{dinero(s.precio)}</s>}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <VerMas pagina={paginaServicios} paginas={Math.ceil(visibles.length / POR_PAGINA_SERVICIOS)}
                          onCambiar={(n) => {
                            setPaginaServicios(n);
                            requestAnimationFrame(() => document.querySelector('.servicios-elegir')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
                          }} />
                </fieldset>

                <fieldset className="grupo" ref={refEspecialistas}>
                  <legend className="grupo__titulo">¿Con quién? <span className="tenue">Toca una para ver su horario</span></legend>
                  <div className="especialistas-elegir">
                    {especialistas.map((e, i) => (
                      <label key={e.id} className="especialista-elegir">
                        <input type="radio" name="especialista" className="solo-lector" checked={sel.especialistaId === e.id} onChange={() => elegirEspecialista(e)} />
                        <span className="especialista-elegir__foto">
                          <Retrato e={e} i={i} />
                          {recomendada(e, servicio) && <span className="especialista-elegir__reco">Recomendada</span>}
                          <span className="servicio-elegir__check" aria-hidden="true">✓</span>
                        </span>
                        <span className="especialista-elegir__cuerpo">
                          <strong>{e.nombre}</strong>
                          <span className="tenue">{e.especialidad}</span>
                          <span className="especialista-elegir__datos">{e.experiencia ? `${e.experiencia} años` : ''}{e.citas > 0 ? ` · ${e.citas} citas` : ''}</span>
                          <span className="especialista-elegir__horario">{String(e.dias).split(',').map((d) => NOMBRES_DIA[d]?.slice(0, 3)).join(' ')} · {e.hora_inicio}–{e.hora_fin}</span>
                        </span>
                      </label>
                    ))}
                  </div>

                  {especialista && (
                    <section className="ficha-especialista" aria-labelledby="t-ficha-esp" key={especialista.id}>
                      <Retrato e={especialista} i={indiceEsp} grande />
                      <div className="ficha-especialista__info">
                        <h3 id="t-ficha-esp">{especialista.nombre}</h3>
                        <p className="ficha-especialista__esp">{especialista.especialidad}{especialista.experiencia ? ` · ${especialista.experiencia} años de experiencia` : ''}</p>
                        {especialista.bio && <p>{especialista.bio}</p>}
                        {especialista.foto_autor && <p className="tenue detalle__credito">Foto de muestra: {especialista.foto_autor} en Unsplash</p>}
                        <h4>Horario</h4>
                        <ul className="ficha-especialista__horario">
                          {[1, 2, 3, 4, 5, 6].map((d) => {
                            const si = String(especialista.dias).split(',').map(Number).includes(d);
                            return <li key={d} className={si ? '' : 'libre-no'}><span>{NOMBRES_DIA[d]}</span><span>{si ? `${especialista.hora_inicio} – ${especialista.hora_fin}` : 'No trabaja'}</span></li>;
                          })}
                        </ul>
                      </div>
                      <div className="ficha-especialista__agenda">
                        <h4>Próximos espacios libres</h4>
                        <ul>
                          {agenda.filter((a) => a.trabaja).slice(0, 5).map((a) => (
                            <li key={a.fecha}>
                              <span className="ficha-especialista__fecha">{sinPunto(CORTA.format(deISO(a.fecha)))}</span>
                              {a.libres.length ? (
                                <span className="ficha-especialista__horas">
                                  {a.libres.slice(0, 4).map((h) => (
                                    <button key={h} type="button" className="hora-mini" onClick={() => elegirDeAgenda(a.fecha, h)}>{h}</button>
                                  ))}
                                  {a.libres.length > 4 && <span className="tenue">+{a.libres.length - 4}</span>}
                                </span>
                              ) : <span className="tenue">Lleno</span>}
                            </li>
                          ))}
                        </ul>
                        {!servicio && <p className="tenue">Elige un servicio arriba para reservar una de estas horas.</p>}
                      </div>
                    </section>
                  )}
                </fieldset>
              </div>
            )}

            {paso === 1 && (
              <div className="paso-anim" key="p1">
                <fieldset className="grupo">
                  <legend className="grupo__titulo">Elige el día <span className="tenue">({especialista?.nombre} trabaja {String(especialista?.dias || '').split(',').map((d) => NOMBRES_DIA[d]?.toLowerCase()).join(', ')})</span></legend>
                  <div className="dias-carrusel">
                    {dias.map((d, i) => {
                      const iso = aISO(d);
                      const no = !trabaja(especialista, iso);
                      return (
                        <label key={iso} className={`dia-chip ${no ? 'dia-chip--no' : ''}`}>
                          <input type="radio" name="fecha" disabled={no} checked={sel.fecha === iso} onChange={() => setSel({ ...sel, fecha: iso, hora: null })} aria-label={`${LARGA.format(d)}${no ? ' (no trabaja)' : ''}`} />
                          <span aria-hidden="true" className="dia-chip__semana">{i === 0 ? 'Mañana' : sinPunto(DIA.format(d))}</span>
                          <span aria-hidden="true" className="dia-chip__numero">{d.getDate()}</span>
                          <span aria-hidden="true" className="dia-chip__mes">{no ? 'Libre' : sinPunto(MES.format(d))}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset className="grupo">
                  <legend className="grupo__titulo">Hora con {especialista?.nombre}</legend>
                  {horarios.length > 0 && libres > 0 && libres <= 4 && <p className="aviso-pocos">¡Solo quedan {libres} {libres === 1 ? 'espacio' : 'espacios'} este día!</p>}
                  {grupos.map(([titulo, lista]) => (
                    <div key={titulo} className="horas-grupo">
                      <p className="horas-grupo__titulo">{titulo} <span className="tenue">({lista.filter((h) => h.disponible).length} libres)</span></p>
                      <div className="horas">
                        {lista.map((h) => (
                          <label key={h.hora} className="hora">
                            <input type="radio" name="hora" disabled={!h.disponible} checked={sel.hora === h.hora} onChange={() => setSel({ ...sel, hora: h.hora })} />
                            <span>{h.hora}{!h.disponible && <span className="solo-lector"> (ocupada)</span>}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {horarios.length > 0 && libres === 0 && <p className="tenue">No quedan horas este día. Prueba con otro día u otra especialista.</p>}
                  {horarios.length === 0 && <p className="tenue">{especialista?.nombre} no trabaja este día. Elige otro.</p>}
                </fieldset>
              </div>
            )}

            {paso === 2 && (
              <div className="paso-anim" key="p2">
                <section className="grupo" aria-labelledby="t-tu-cita">
                  <h2 id="t-tu-cita" className="grupo__titulo">Tu cita</h2>
                  <div className="cita-tarjeta">
                    <Foto archivo={reserva.fotoRef?.archivo || servicio?.imagen} alt="" />
                    <div>
                      <p className="cita-tarjeta__persona">Para ti</p>
                      <p className="cita-tarjeta__nombre">{servicio?.nombre}</p>
                      <p>{LARGA.format(deISO(sel.fecha))}, {sel.hora} con {especialista?.nombre}</p>
                      <p className="tenue">Diseño: {reserva.diseno ? describir(reserva.diseno) : reserva.fotoRef ? reserva.fotoRef.titulo : 'lo eliges en el salón'}</p>
                    </div>
                    <strong>{dinero(precio(servicio) + recargo)}</strong>
                  </div>
                  <div className="campo">
                    <label htmlFor="r-notas">Notas para tu especialista <span className="tenue">(opcional)</span></label>
                    <textarea id="r-notas" rows="2" maxLength="500" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Alergias, una uña quebrada, o cualquier detalle que debamos saber." />
                  </div>
                </section>

                <section className="grupo acompanante" aria-labelledby="t-acomp">
                  <h2 id="t-acomp" className="grupo__titulo">¿Vas con alguien más?</h2>
                  <p className="tenue">Cada persona es una cita aparte, con su propio servicio y su propio diseño.</p>
                  {!acompana.activo ? (
                    <button type="button" className="acompanante__agregar" onClick={() => setAcompana({ ...acompana, activo: true })}>
                      <span aria-hidden="true">+</span> Agregar cita para otra persona
                    </button>
                  ) : (
                    <div className="acompanante__caja">
                      <div className="acompanante__cabeza">
                        <p className="cita-tarjeta__persona">Segunda persona</p>
                        <button type="button" className="enlace-boton" onClick={() => setAcompana({ activo: false, nombre: '', servicioId: null, modo: 'otra', especialistaId: null })}>Quitar</button>
                      </div>
                      <div className="campo">
                        <label htmlFor="a-nombre">Nombre de tu acompañante</label>
                        <input id="a-nombre" value={acompana.nombre} maxLength={60} onChange={(e) => setAcompana({ ...acompana, nombre: e.target.value })} placeholder="Por ejemplo, Ana" />
                      </div>
                      <fieldset className="campo">
                        <legend>Su servicio</legend>
                        <div className="servicios-mini">
                          {servicios.filter((s) => !s.es_combo).map((s) => (
                            <label key={s.id} className="servicio-mini">
                              <input type="radio" name="acomp-servicio" className="solo-lector" checked={acompana.servicioId === s.id} onChange={() => setAcompana({ ...acompana, servicioId: s.id })} />
                              <Foto archivo={s.imagen} alt="" />
                              <span>{s.nombre}</span>
                              <b>{dinero(precio(s))}</b>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <fieldset className="campo">
                        <legend>¿Con quién la atendemos?</legend>
                        <div className="opciones-acomp">
                          <label className={`opcion-acomp ${!siguienteHora ? 'opcion-acomp--no' : ''}`}>
                            <input type="radio" name="acomp-modo" className="marca" disabled={!siguienteHora} checked={acompana.modo === 'misma'} onChange={() => setAcompana({ ...acompana, modo: 'misma' })} />
                            <Retrato e={especialista} i={indiceEsp} />
                            <span><strong>Con la misma ({especialista?.nombre})</strong><span className="tenue">{siguienteHora ? `Después de ti, a las ${siguienteHora}` : 'No le quedan horas después de la tuya ese día'}</span></span>
                          </label>
                          <label className="opcion-acomp">
                            <input type="radio" name="acomp-modo" className="marca" checked={acompana.modo === 'otra'} onChange={() => setAcompana({ ...acompana, modo: 'otra' })} />
                            <span className="retrato retrato--doble" aria-hidden="true">+</span>
                            <span><strong>Con otra especialista</strong><span className="tenue">Al mismo tiempo que tú, a las {sel.hora}</span></span>
                          </label>
                        </div>
                        {acompana.modo === 'otra' && (
                          libresMismaHora.length ? (
                            <div className="especialistas-mini">
                              {especialistas.filter((e) => libresMismaHora.includes(e.id)).map((e) => (
                                <label key={e.id} className="especialista-mini">
                                  <input type="radio" name="acomp-esp" className="solo-lector" checked={acompana.especialistaId === e.id} onChange={() => setAcompana({ ...acompana, especialistaId: e.id })} />
                                  <Retrato e={e} i={especialistas.indexOf(e)} />
                                  <strong>{e.nombre}</strong>
                                  <span className="tenue">{e.especialidad}</span>
                                </label>
                              ))}
                            </div>
                          ) : <p className="tenue">No hay otra especialista libre a las {sel.hora}. Prueba con la misma o cambia la hora.</p>
                        )}
                      </fieldset>
                    </div>
                  )}
                </section>
              </div>
            )}

            {error && <p role="alert" className="error">{error}</p>}
            <div className="reservar__botones">
              {paso > 0 && <button type="button" className="boton boton--contorno" onClick={() => setPaso(paso - 1)}>← Atrás</button>}
            </div>
          </form>

          <aside className="reservar__resumen resumen-cita" aria-labelledby="resumen-reserva">
            <div className="resumen-cita__foto">
              {servicio || reserva.fotoRef ? <Foto key={reserva.fotoRef?.archivo || servicio.id} archivo={reserva.fotoRef?.archivo || servicio.imagen} alt="" /> : <span className="resumen-cita__vacio">Elige tu servicio</span>}
            </div>
            <div className="resumen-cita__cuerpo">
              <h2 id="resumen-reserva">Tu cita</h2>
              {reserva.diseno && (
                <div className="resumen-diseno">
                  <MuestraUnas diseno={reserva.diseno} />
                  <p>{describir(reserva.diseno)}</p>
                  <Link to="/disena" className="enlace">Cambiar diseño</Link>
                </div>
              )}
              {!reserva.diseno && !reserva.fotoRef && (
                <p className="tenue resumen-cita__ayuda">¿Ya tienes diseño? <Link to="/disena" className="enlace">Diséñalo aquí</Link> o <Link to="/galeria" className="enlace">elige uno de la galería</Link>.</p>
              )}
              <ul className="resumen-cita__lineas">
                <li className={servicio ? 'listo' : ''}>
                  <span className="resumen-cita__mini">{servicio ? <Foto archivo={servicio.imagen} alt="" /> : '1'}</span>
                  <span>{servicio ? servicio.nombre : 'Elige un servicio'}</span>
                </li>
                <li className={especialista ? 'listo' : ''}>
                  <span className="resumen-cita__mini">{especialista ? <Retrato e={especialista} i={indiceEsp} /> : '2'}</span>
                  <span>{especialista ? especialista.nombre : 'Elige especialista'}</span>
                </li>
                <li className={sel.hora ? 'listo' : ''}>
                  <span className="resumen-cita__mini resumen-cita__mini--dia">{sel.hora ? deISO(sel.fecha).getDate() : '3'}</span>
                  <span>{sel.hora ? `${LARGA.format(deISO(sel.fecha))}, ${sel.hora}` : 'Elige fecha y hora'}</span>
                </li>
                {acompanaLista && (
                  <li className="listo">
                    <span className="resumen-cita__mini"><Retrato e={espAcomp} i={especialistas.indexOf(espAcomp)} /></span>
                    <span>{acompana.nombre || 'Acompañante'}: {servicioAcomp.nombre}, {horaAcomp} con {espAcomp.nombre}</span>
                  </li>
                )}
              </ul>
              <dl className="resumen">
                {servicio?.precio_oferta != null && <><dt>Precio regular</dt><dd>{dinero(servicio.precio)}</dd><dt>Oferta</dt><dd className="resumen__descuento">-{dinero(servicio.precio - servicio.precio_oferta)}</dd></>}
                {recargo > 0 && <><dt>Diseño personalizado</dt><dd>{dinero(recargo)}</dd></>}
                {acompanaLista && <><dt>Cita de {acompana.nombre || 'tu acompañante'}</dt><dd>{dinero(precio(servicioAcomp))}</dd></>}
                <dt className="resumen__total">Total</dt><dd className="resumen__total"><span key={total} className="resumen-cita__monto">{servicio ? dinero(total) : '—'}</span></dd>
                {servicio && <><dt>Apartas con</dt><dd>{dinero(Math.round(total * 0.3))}</dd></>}
              </dl>
              <button type="submit" form="form-reserva" className="resumen-pedido__boton resumen-cita__boton" disabled={!puedeSeguir || agregando}>
                <strong>{textoBoton}</strong>
              </button>
              <p className="tenue resumen-cita__nota">Pagas en el carrito, junto con tus productos.</p>
            </div>
          </aside>
        </div>
      </div>

      <div className="compra__barra-movil reservar__barra-movil">
        <p><span className="tenue">Total</span><strong>{servicio ? dinero(total) : '—'}</strong></p>
        <button type="submit" form="form-reserva" className="resumen-pedido__boton" disabled={!puedeSeguir || agregando}><strong>{textoBoton}</strong></button>
      </div>
    </>
  );
}
