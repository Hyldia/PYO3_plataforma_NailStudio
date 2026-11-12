import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useReserva } from '../context/ReservaContext.jsx';
import { SALON, dinero } from '../config.js';
import { describir } from '../lib/disenoBuilder.js';
import { useTitulo } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import MuestraUnas from '../components/MuestraUnas.jsx';

const PASOS = ['Servicio', 'Fecha y hora', 'Tus datos y pago'];
const DIA = new Intl.DateTimeFormat('es-CR', { weekday: 'short' });
const LARGA = new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long' });
const aISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const deISO = (iso) => new Date(`${iso}T12:00:00`);

// Próximos 14 días en que abre el salón (domingo cerrado)
function proximosDias() {
  const dias = []; const d = new Date();
  while (dias.length < 14) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) dias.push(new Date(d)); }
  return dias;
}

export default function Reservar() {
  useTitulo('Reservar cita');
  const [params] = useSearchParams();
  const { reserva, actualizar, reiniciar } = useReserva();
  const [paso, setPaso] = useState(0);
  const [servicios, setServicios] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const dias = useMemo(proximosDias, []);
  const [sel, setSel] = useState({ servicioId: Number(params.get('servicio')) || null, especialistaId: null, fecha: aISO(dias[0]), hora: null });
  const [cliente, setCliente] = useState({ nombre: '', telefono: '', email: '' });
  const [notas, setNotas] = useState(reserva.diseno?.notas || '');
  const [metodo, setMetodo] = useState('sinpe');
  const [pago, setPago] = useState({ comprobante: '', numero: '' });
  const [rec, setRec] = useState({ whatsapp: true, correo: false });
  const [estado, setEstado] = useState({ enviando: false, error: '', cita: null });

  useEffect(() => {
    Promise.all([api.servicios(), api.especialistas()])
      .then(([s, e]) => { setServicios(s); setEspecialistas(e); })
      .catch((e) => setEstado((x) => ({ ...x, error: e.message })));
  }, []);

  useEffect(() => {
    if (!sel.especialistaId) return;
    api.disponibilidad(sel.especialistaId, sel.fecha).then(setHorarios).catch(() => setHorarios([]));
  }, [sel.especialistaId, sel.fecha]);

  const servicio = servicios.find((s) => s.id === sel.servicioId);
  const especialista = especialistas.find((e) => e.id === sel.especialistaId);
  const recargo = reserva.diseno?.precio || 0;
  const total = (servicio?.precio || 0) + recargo;
  const anticipo = metodo === 'salon' ? 0 : Math.round(total * 0.3);
  const puedeSeguir = [servicio && especialista, sel.hora, true][paso];

  async function confirmar(e) {
    e.preventDefault();
    setEstado({ enviando: true, error: '', cita: null });
    try {
      let disenoId = null;
      if (reserva.diseno) disenoId = (await api.guardarDiseno({ ...reserva.diseno, notas, fotoRefId: reserva.fotoRef?.id })).id;
      const cita = await api.crearCita({
        servicioId: sel.servicioId, especialistaId: sel.especialistaId, fecha: sel.fecha, hora: sel.hora,
        disenoId, fotoRefId: reserva.fotoRef?.id, notas, cliente, metodoPago: metodo, pago, recordatorios: rec
      });
      setEstado({ enviando: false, error: '', cita });
      reiniciar();
      window.scrollTo(0, 0);
    } catch (err) {
      setEstado({ enviando: false, error: err.message, cita: null });
    }
  }

  if (estado.cita) {
    const c = estado.cita;
    return (
      <div className="contenedor pagina confirmacion" role="status">
        <h1>{c.estado === 'confirmada' ? 'Tu cita está confirmada' : 'Recibimos tu reserva'}</h1>
        <p>{c.servicio} con {c.especialista}, {LARGA.format(deISO(c.fecha))} a las {c.hora}.</p>
        {c.estado !== 'confirmada' && <p className="tenue">Te escribiremos por WhatsApp al {c.cliente_telefono} en cuanto verifiquemos el pago.</p>}
        <p className="tenue">Número de reserva: {c.id}</p>
        <div className="botones">
          <Link to="/" className="boton">Volver al inicio</Link>
          <Link to="/tienda" className="boton boton--contorno">Ver productos de cuidado</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor pagina">
      <header className="pagina__cabeza">
        <h1>Reservar cita</h1>
        <ol className="progreso" aria-label="Pasos de la reserva">
          {PASOS.map((p, i) => (
            <li key={p} className={i === paso ? 'actual' : i < paso ? 'hecho' : ''} aria-current={i === paso ? 'step' : undefined}>
              <span className="progreso__numero">{i + 1}</span>{p}
            </li>
          ))}
        </ol>
      </header>

      <div className="reservar">
        <form className="reservar__form" onSubmit={paso === 2 ? confirmar : (e) => { e.preventDefault(); setPaso(paso + 1); window.scrollTo(0, 0); }} noValidate>
          {paso === 0 && (
            <>
              <fieldset className="grupo">
                <legend className="grupo__titulo">¿Qué servicio quieres?</legend>
                <div className="opciones-lista">
                  {servicios.map((s) => (
                    <label key={s.id} className="opcion">
                      <input type="radio" name="servicio" checked={sel.servicioId === s.id} onChange={() => setSel({ ...sel, servicioId: s.id })} />
                      <span className="opcion__texto"><strong>{s.nombre}</strong><span className="tenue">{s.duracion_min} min, {s.categoria.toLowerCase()}</span></span>
                      <span className="opcion__precio">{dinero(s.precio)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="grupo">
                <legend className="grupo__titulo">¿Con quién?</legend>
                <div className="opciones-rejilla">
                  {especialistas.map((e) => (
                    <label key={e.id} className="opcion opcion--persona">
                      <input type="radio" name="especialista" checked={sel.especialistaId === e.id} onChange={() => setSel({ ...sel, especialistaId: e.id, hora: null })} />
                      <span className="avatar" aria-hidden="true">{e.nombre[0]}</span>
                      <span className="opcion__texto"><strong>{e.nombre}</strong><span className="tenue">{e.especialidad}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {paso === 1 && (
            <>
              <fieldset className="grupo">
                <legend className="grupo__titulo">Día</legend>
                <div className="dias">
                  {dias.map((d) => {
                    const iso = aISO(d);
                    return (
                      <label key={iso} className="dia">
                        <input type="radio" name="fecha" checked={sel.fecha === iso} onChange={() => setSel({ ...sel, fecha: iso, hora: null })} aria-label={LARGA.format(d)} />
                        <span aria-hidden="true" className="dia__semana">{DIA.format(d).replace('.', '')}</span>
                        <span aria-hidden="true" className="dia__numero">{d.getDate()}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <fieldset className="grupo">
                <legend className="grupo__titulo">Hora disponible con {especialista?.nombre}</legend>
                <div className="horas">
                  {horarios.map((h) => (
                    <label key={h.hora} className="hora">
                      <input type="radio" name="hora" disabled={!h.disponible} checked={sel.hora === h.hora} onChange={() => setSel({ ...sel, hora: h.hora })} />
                      <span>{h.hora}{!h.disponible && <span className="solo-lector"> (ocupada)</span>}</span>
                    </label>
                  ))}
                </div>
                {horarios.length > 0 && horarios.every((h) => !h.disponible) && <p className="tenue">No quedan horas este día. Prueba con otro día u otra especialista.</p>}
              </fieldset>
            </>
          )}

          {paso === 2 && (
            <>
              <fieldset className="grupo">
                <legend className="grupo__titulo">Tus datos</legend>
                <div className="campos-dos">
                  <div className="campo">
                    <label htmlFor="r-nombre">Nombre completo</label>
                    <input id="r-nombre" autoComplete="name" required value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
                  </div>
                  <div className="campo">
                    <label htmlFor="r-tel">Teléfono (WhatsApp)</label>
                    <input id="r-tel" type="tel" autoComplete="tel" required placeholder="8888 8888" value={cliente.telefono} onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })} />
                  </div>
                </div>
                <div className="campo">
                  <label htmlFor="r-correo">Correo electrónico <span className="tenue">(opcional)</span></label>
                  <input id="r-correo" type="email" autoComplete="email" value={cliente.email} onChange={(e) => setCliente({ ...cliente, email: e.target.value })} />
                </div>
                <div className="campo">
                  <label htmlFor="r-notas">Notas <span className="tenue">(opcional)</span></label>
                  <textarea id="r-notas" rows="3" maxLength="500" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Alergias, una uña quebrada, o cualquier detalle que debamos saber." />
                </div>
              </fieldset>

              <fieldset className="grupo">
                <legend className="grupo__titulo">Recordatorios</legend>
                <label className="casilla"><input type="checkbox" checked={rec.whatsapp} onChange={(e) => setRec({ ...rec, whatsapp: e.target.checked })} /><span>Por WhatsApp, un día antes y dos horas antes</span></label>
                <label className="casilla"><input type="checkbox" checked={rec.correo} disabled={!cliente.email} onChange={(e) => setRec({ ...rec, correo: e.target.checked })} /><span>Por correo, un día antes{!cliente.email && ' (escribe tu correo arriba)'}</span></label>
              </fieldset>

              <fieldset className="grupo">
                <legend className="grupo__titulo">Adelanto</legend>
                <p className="tenue">Para apartar tu espacio pedimos el 30 % del total. El resto se paga en el salón.</p>
                <div className="opciones-lista">
                  {[['sinpe', 'SINPE Móvil'], ['tarjeta', 'Tarjeta de crédito o débito'], ['salon', 'Pagar todo en el salón']].map(([id, texto]) => (
                    <label key={id} className="opcion">
                      <input type="radio" name="metodo" checked={metodo === id} onChange={() => setMetodo(id)} />
                      <span className="opcion__texto"><strong>{texto}</strong>{id === 'salon' && <span className="tenue">La cita queda pendiente hasta que la confirmemos.</span>}</span>
                    </label>
                  ))}
                </div>
                {metodo === 'sinpe' && (
                  <div className="campo">
                    <label htmlFor="r-comp">Número de comprobante</label>
                    <p className="tenue" id="r-comp-ayuda">Envía {dinero(anticipo)} al {SALON.sinpe.numero} a nombre de {SALON.sinpe.nombre} y escribe aquí el comprobante.</p>
                    <input id="r-comp" inputMode="numeric" aria-describedby="r-comp-ayuda" value={pago.comprobante} onChange={(e) => setPago({ ...pago, comprobante: e.target.value })} />
                  </div>
                )}
                {metodo === 'tarjeta' && (
                  <div className="campo">
                    <label htmlFor="r-tarjeta">Número de tarjeta</label>
                    <input id="r-tarjeta" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={pago.numero} onChange={(e) => setPago({ ...pago, numero: e.target.value })} />
                    <p className="tenue">Pago de prueba: cualquier número de 16 dígitos funciona; los que terminan en 0000 se rechazan.</p>
                  </div>
                )}
              </fieldset>
            </>
          )}

          {estado.error && <p role="alert" className="error">{estado.error}</p>}
          <div className="reservar__botones">
            {paso > 0 && <button type="button" className="boton boton--contorno" onClick={() => setPaso(paso - 1)}>Atrás</button>}
            <button type="submit" className="boton" disabled={!puedeSeguir || estado.enviando}>
              {paso < 2 ? 'Continuar' : estado.enviando ? 'Confirmando…' : anticipo ? `Confirmar y pagar ${dinero(anticipo)}` : 'Confirmar reserva'}
            </button>
          </div>
        </form>

        <aside className="reservar__resumen" aria-labelledby="resumen-reserva">
          <h2 id="resumen-reserva">Resumen</h2>
          {reserva.diseno && (
            <div className="resumen-diseno">
              <MuestraUnas diseno={reserva.diseno} />
              <p>{describir(reserva.diseno)}</p>
              <Link to="/disena" className="enlace">Cambiar diseño</Link>
            </div>
          )}
          {reserva.fotoRef && (
            <div className="referencia">
              <Foto archivo={reserva.fotoRef.archivo} alt={reserva.fotoRef.titulo} className="referencia__foto" />
              <div><p className="tenue">Foto de referencia</p><p>{reserva.fotoRef.titulo}</p></div>
            </div>
          )}
          {!reserva.diseno && !reserva.fotoRef && (
            <p className="tenue">Sin diseño elegido. Puedes <Link to="/disena" className="enlace">diseñar el tuyo</Link> o <Link to="/galeria" className="enlace">elegir uno de la galería</Link>, o decidirlo en el salón.</p>
          )}
          <dl className="resumen">
            <dt>Servicio</dt><dd>{servicio ? servicio.nombre : '—'}</dd>
            <dt>Especialista</dt><dd>{especialista ? especialista.nombre : '—'}</dd>
            <dt>Fecha</dt><dd>{sel.hora ? `${LARGA.format(deISO(sel.fecha))}, ${sel.hora}` : '—'}</dd>
            {recargo > 0 && <><dt>Recargo por diseño</dt><dd>{dinero(recargo)}</dd></>}
            <dt className="resumen__total">Total</dt><dd className="resumen__total">{servicio ? dinero(total) : '—'}</dd>
            {paso === 2 && <><dt>Pagas hoy</dt><dd>{dinero(anticipo)}</dd></>}
          </dl>
        </aside>
      </div>
    </div>
  );
}
