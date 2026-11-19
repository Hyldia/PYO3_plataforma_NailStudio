// Agenda del salón: calendario del mes con los días llenos, citas del día y avisos por WhatsApp.
// Las cancelaciones usan el patrón State en el servidor y los mensajes usan Template Method + Factory + Adapter.
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero } from '../../config.js';
import Foto from '../../components/Foto.jsx';
import Modal from '../../components/Modal.jsx';
import VentanaNoAsistio from '../../components/VentanaNoAsistio.jsx';
import VerMas from '../../components/VerMas.jsx';
import { TarjetaMensaje, Whats, fechaLarga, nombreMes, isoLocal } from './piezasPanel.jsx';

const POR_PAGINA = 4;
const ACCIONES = { pendiente: ['confirmar'], confirmada: ['completar'], completada: [], cancelada: [], no_asistio: [] };
const NOMBRE_ESTADO = { pendiente: 'Por confirmar', confirmada: 'Confirmada', completada: 'Atendida', cancelada: 'Cancelada', no_asistio: 'No llegó' };
// Nombre: yaPasoLaHora
// Descripción: Dice si ya pasó la hora de una cita (hora de Costa Rica).
// Entrada: La cita.
// Salida: Verdadero o falso.
// Objetivo: Mostrar el botón "No llegó" solo cuando corresponde.
const yaPasoLaHora = (cita) => new Date(`${cita.fecha}T${cita.hora}:00-06:00`).getTime() <= Date.now();
const TEXTO_ACCION = { confirmar: 'Confirmar', completar: 'Marcar atendida' };
const NIVEL = { libre: 'Libre', medio: 'Con citas', casi: 'Casi lleno', lleno: 'Lleno', cerrado: 'Cerrado' };
const CABECERA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HORAS_SALON = ['09:00', '10:00', '11:00', '12:00', '13:30', '14:30', '15:30', '16:30', '17:30'];

// Nombre: Calendario
// Descripción: Muestra el calendario del mes.
// Entrada: Mes, días y elegido.
// Salida: El calendario.
// Objetivo: Elegir un día.
function Calendario({ mes, dias, elegido, onElegir, onMes }) {
  const [anio, numeroMes] = mes.split('-').map(Number);
  const vacios = (new Date(anio, numeroMes - 1, 1).getDay() + 6) % 7;
  const hoy = isoLocal(new Date());
  // Nombre: mover
  // Descripción: Cambia de mes.
  // Entrada: Cuántos meses.
  // Salida: Nada.
  // Objetivo: Ver otro mes.
  const mover = (datos) => { const fecha = new Date(anio, numeroMes - 1 + datos, 1); onMes(`${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`); };
  return (
    <div className="cal">
      <div className="cal__cabeza">
        <button type="button" className="cal__flecha" onClick={() => mover(-1)} aria-label="Mes anterior">‹</button>
        <h3 aria-live="polite">{nombreMes(mes)}</h3>
        <button type="button" className="cal__flecha" onClick={() => mover(1)} aria-label="Mes siguiente">›</button>
      </div>
      <div className="cal__rejilla" role="grid" aria-label={`Calendario de ${nombreMes(mes)}`}>
        {CABECERA.map((diaSemana) => <span key={diaSemana} className="cal__dia-semana" role="columnheader">{diaSemana}</span>)}
        {Array.from({ length: vacios }, (_, i) => <span key={`v${i}`} aria-hidden="true" />)}
        {dias.map((dia, i) => {
          const pct = dia.capacidad ? Math.min(100, Math.round((dia.ocupadas / dia.capacidad) * 100)) : 0;
          return (
            <button key={dia.fecha} type="button" role="gridcell" style={{ '--n': i, '--p': `${pct}%` }}
                    className={`cal__dia cal__dia--${dia.nivel} ${dia.fecha === elegido ? 'cal__dia--elegido' : ''} ${dia.fecha === hoy ? 'cal__dia--hoy' : ''}`}
                    aria-pressed={dia.fecha === elegido} onClick={() => onElegir(dia.fecha)}
                    aria-label={`${fechaLarga(dia.fecha)}: ${NIVEL[dia.nivel]}, ${dia.ocupadas} de ${dia.capacidad} espacios ocupados`}>
              <span className="cal__num">{Number(dia.fecha.slice(8))}</span>
              {dia.capacidad > 0 && <span className="cal__cuenta">{dia.ocupadas}/{dia.capacidad}</span>}
              {dia.canceladas > 0 && <span className="cal__cancel" title={`${dia.canceladas} canceladas`}>{dia.canceladas}</span>}
              {dia.capacidad > 0 && <span className="cal__barra" aria-hidden="true"><i /></span>}
            </button>
          );
        })}
      </div>
      <ul className="cal__leyenda">
        {['libre', 'medio', 'casi', 'lleno', 'cerrado'].map((nivel) => <li key={nivel}><i className={`cal__punto cal__punto--${nivel}`} />{NIVEL[nivel]}</li>)}
      </ul>
    </div>
  );
}

// Nombre: VentanaCancelar
// Descripción: Muestra la ventana para cancelar o mover una cita.
// Entrada: La cita y opciones.
// Salida: La ventana.
// Objetivo: Cancelar con aviso.
function VentanaCancelar({ cita, especialistas, fecha, onCerrar, onListo }) {
  const emergencia = !cita;
  const [datos, setDatos] = useState({ motivo: '', tipo: 'cancelacion', nuevaFecha: '', nuevaHora: '', nota: '', especialistaId: '' });
  const [estado, setEstado] = useState({ enviando: false, error: '' });
  const [mensajes, setMensajes] = useState(null);
  // Nombre: set
  // Descripción: Guarda lo que se escribe en un campo.
  // Entrada: El nombre del campo.
  // Salida: Una función para el campo.
  // Objetivo: Llenar el formulario.
  const set = (campo) => (evento) => setDatos({ ...datos, [campo]: evento.target.value });

  // Nombre: confirmar
  // Descripción: Confirma la cancelación.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Cancelar la cita.
  async function confirmar(evento) {
    evento.preventDefault();
    if (datos.motivo.trim().length < 3) return setEstado({ enviando: false, error: 'Escribe el motivo: se le explica a la clienta en el mensaje.' });
    setEstado({ enviando: true, error: '' });
    try {
      const guardada = emergencia ? await api.admin.emergencia({ ...datos, fecha }) : [await api.admin.cancelarCita(cita.id, datos)];
      setMensajes(guardada); onListo();
    } catch (err) { setEstado({ enviando: false, error: err.message }); }
  }

  return (
    <Modal titulo={emergencia ? `Emergencia: cancelar citas del ${fechaLarga(fecha)}` : `Cancelar la cita de ${cita.cliente_nombre}`} onCerrar={onCerrar} ancho>
      {mensajes ? (
        <div className="aviso-lista">
          <p className="aviso-lista__ok">✓ {mensajes.length === 1 ? 'Se canceló la cita.' : `Se cancelaron ${mensajes.length} citas.`} Ahora envía el aviso a {mensajes.length === 1 ? 'la clienta' : 'cada clienta'} por WhatsApp:</p>
          {mensajes.map(({ cita: c, mensaje }) => (
            <TarjetaMensaje key={c.id} mensaje={mensaje} nombre={`${c.cliente_nombre} · ${c.hora}`} />
          ))}
          <button type="button" className="boton boton--contorno" onClick={onCerrar}>Listo</button>
        </div>
      ) : (
        <form className="form-cancelar" onSubmit={confirmar}>
          {emergencia ? (
            <p className="aviso-alerta">Se cancelarán <strong>todas las citas activas</strong> de ese día{datos.especialistaId ? ' de la especialista elegida' : ''} y se prepara un mensaje de WhatsApp para cada clienta.</p>
          ) : (
            <p className="tenue">{cita.servicio} con {cita.especialista} · {fechaLarga(cita.fecha)}, {cita.hora}</p>
          )}
          <fieldset className="grupo">
            <legend className="grupo__titulo grupo__titulo--chico">¿Qué le ofrecemos a la clienta?</legend>
            <div className="opciones-aviso">
              <label className={datos.tipo === 'cancelacion' ? 'activa' : ''}><input type="radio" name="tipo" value="cancelacion" checked={datos.tipo === 'cancelacion'} onChange={set('tipo')} /><strong>Cancelar</strong><span>Le pedimos que responda para buscar otro espacio</span></label>
              <label className={datos.tipo === 'reprogramacion' ? 'activa' : ''}><input type="radio" name="tipo" value="reprogramacion" checked={datos.tipo === 'reprogramacion'} onChange={set('tipo')} /><strong>Reprogramar</strong><span>Le proponemos otro día y hora</span></label>
            </div>
          </fieldset>
          <div className="campo"><label htmlFor="c-motivo">Motivo (se incluye en el mensaje)</label>
            <input id="c-motivo" value={datos.motivo} onChange={set('motivo')} placeholder="Ej.: una emergencia familiar de la especialista" list="motivos" />
            <datalist id="motivos"><option value="Una emergencia de salud de la especialista" /><option value="Un corte de luz en el salón" /><option value="Una emergencia familiar" /><option value="Un problema con el agua en el local" /></datalist>
          </div>
          {emergencia && (
            <div className="campo"><label htmlFor="c-esp">Solo las citas de</label>
              <select id="c-esp" value={datos.especialistaId} onChange={set('especialistaId')}>
                <option value="">Todas las especialistas</option>
                {especialistas.map((especialista) => <option key={especialista.id} value={especialista.id}>{especialista.nombre}</option>)}
              </select>
            </div>
          )}
          {datos.tipo === 'reprogramacion' && !emergencia && (
            <div className="campos-dos">
              <div className="campo"><label htmlFor="c-fecha">Nueva fecha propuesta</label><input id="c-fecha" type="date" min={isoLocal(new Date())} value={datos.nuevaFecha} onChange={set('nuevaFecha')} /></div>
              <div className="campo"><label htmlFor="c-hora">Hora</label><select id="c-hora" value={datos.nuevaHora} onChange={set('nuevaHora')}><option value="">Elegir</option>{HORAS_SALON.map((hora) => <option key={hora}>{hora}</option>)}</select></div>
            </div>
          )}
          <div className="campo"><label htmlFor="c-nota">Nota extra (opcional)</label><input id="c-nota" value={datos.nota} onChange={set('nota')} placeholder="Ej.: Te regalamos un 10 % en tu próxima cita." /></div>
          {estado.error && <p role="alert" className="error">{estado.error}</p>}
          <div className="botones">
            <button type="submit" className="boton boton--rojo" disabled={estado.enviando}>{estado.enviando ? 'Cancelando…' : emergencia ? 'Cancelar citas y preparar avisos' : 'Cancelar y preparar aviso'}</button>
            <button type="button" className="boton boton--contorno" onClick={onCerrar}>Volver</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// Nombre: VentanaMensaje
// Descripción: Muestra la ventana para enviar un mensaje.
// Entrada: La cita y los tipos.
// Salida: La ventana.
// Objetivo: Avisar a la clienta.
function VentanaMensaje({ cita, tipos, onCerrar }) {
  const [tipo, setTipo] = useState('recordatorio');
  const [mensaje, setMensaje] = useState(null);
  useEffect(() => { setMensaje(null); api.admin.mensajeCita(cita.id, { tipo }).then(setMensaje).catch(() => {}); }, [tipo]);
  return (
    <Modal titulo={`Mensaje para ${cita.cliente_nombre}`} onCerrar={onCerrar} ancho>
      <div className="aviso-lista">
        <div className="chips-tipo" role="group" aria-label="Tipo de mensaje">
          {['recordatorio', 'confirmacion'].map((tipoActual) => (
            <button key={tipoActual} type="button" className={`chip-filtro ${tipo === tipoActual ? 'chip-filtro--activo' : ''}`} aria-pressed={tipo === tipoActual} onClick={() => setTipo(tipoActual)}>{tipos[tipoActual] || tipoActual}</button>
          ))}
        </div>
        {mensaje ? <TarjetaMensaje key={tipo} mensaje={mensaje} nombre={cita.cliente_nombre} /> : <p className="tenue">Preparando…</p>}
      </div>
    </Modal>
  );
}

// Nombre: AgendaAdmin
// Descripción: Muestra la agenda del panel.
// Entrada: Nada.
// Salida: La agenda.
// Objetivo: Ver y manejar citas.
export default function AgendaAdmin() {
  const [mes, setMes] = useState(isoLocal(new Date()).slice(0, 7));
  const [dias, setDias] = useState([]);
  const [fecha, setFecha] = useState(isoLocal(new Date()));
  const [citas, setCitas] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [tipos, setTipos] = useState({});
  const [filtro, setFiltro] = useState('');
  const [verEstado, setVerEstado] = useState('');
  const [buscarClienta, setBuscarClienta] = useState('');
  const [pagina, setPagina] = useState(1);
  const [ventana, setVentana] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState('');

  // Nombre: cargarMes
  // Descripción: Carga el mes.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Pintar el calendario.
  const cargarMes = () => api.admin.calendario(mes).then((respuesta) => setDias(respuesta.dias)).catch((fallo) => setError(fallo.message));
  // Nombre: cargarDia
  // Descripción: Carga las citas del día.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ver la lista.
  const cargarDia = () => api.admin.citas(fecha).then(setCitas).catch((fallo) => setError(fallo.message));
  // Nombre: cargarHistorial
  // Descripción: Carga los mensajes.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ver el historial.
  const cargarHistorial = () => api.admin.mensajes().then(setHistorial).catch(() => {});
  useEffect(() => { cargarMes(); }, [mes]);
  useEffect(() => { cargarDia(); }, [fecha]);
  useEffect(() => { api.especialistas().then(setEspecialistas).catch(() => {}); api.admin.tiposMensaje().then(setTipos).catch(() => {}); cargarHistorial(); }, []);

  // Nombre: recargar
  // Descripción: Vuelve a cargar todo.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Tener datos al día.
  const recargar = () => { cargarMes(); cargarDia(); cargarHistorial(); };
  // Nombre: cambiar
  // Descripción: Cambia el estado de una cita.
  // Entrada: Número y acción.
  // Salida: Nada.
  // Objetivo: Confirmar o completar.
  const cambiar = async (id, accion) => { try { await api.admin.estadoCita(id, accion); recargar(); } catch (error) { setError(error.message); } };
  // Nombre: elegirDia
  // Descripción: Elige un día.
  // Entrada: La fecha.
  // Salida: Nada.
  // Objetivo: Ver sus citas.
  const elegirDia = (f) => { setFecha(f); setPagina(1); if (f.slice(0, 7) !== mes) setMes(f.slice(0, 7)); };

  const dia = dias.find((dia) => dia.fecha === fecha);
  const ESTADOS_FILTRO = { activas: ['pendiente', 'confirmada'], completada: ['completada'], cancelada: ['cancelada'], no_asistio: ['no_asistio'] };
  const visibles = citas.filter((cita) => (!filtro || String(cita.especialista_id) === filtro)
    && (!verEstado || ESTADOS_FILTRO[verEstado].includes(cita.estado))
    && (!buscarClienta || `${cita.cliente_nombre} ${cita.cliente_telefono} ${cita.servicio}`.toLowerCase().includes(buscarClienta.toLowerCase())));
  const paginas = Math.ceil(visibles.length / POR_PAGINA);
  const citasPagina = visibles.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  useEffect(() => { if (pagina > paginas) setPagina(Math.max(paginas, 1)); }, [pagina, paginas]);
  const activas = citas.filter((cita) => ['pendiente', 'confirmada'].includes(cita.estado));
  const cobrar = activas.reduce((suma, activa) => suma + (activa.total - activa.anticipo), 0);

  return (
    <section aria-labelledby="t-agenda" className="agenda-admin">
      <div className="admin__cabeza"><h2 id="t-agenda">Agenda</h2>
        <button type="button" className="boton boton--chico boton--contorno" onClick={() => elegirDia(isoLocal(new Date()))}>Ir a hoy</button>
      </div>
      {error && <p role="alert" className="error">{error}</p>}

      <div className="agenda-admin__grid">
        <Calendario mes={mes} dias={dias} elegido={fecha} onElegir={elegirDia} onMes={setMes} />

        <div className="dia-panel">
          <div className="dia-panel__cabeza">
            <div>
              <p className="dia-panel__ante">Día elegido</p>
              <h3>{fechaLarga(fecha)}</h3>
              {dia && <span className={`chip-nivel chip-nivel--${dia.nivel}`}>{NIVEL[dia.nivel]}{dia.capacidad ? ` · ${dia.ocupadas} de ${dia.capacidad} espacios` : ''}</span>}
            </div>
            {activas.length > 0 && <button type="button" className="boton boton--rojo boton--chico" onClick={() => setVentana({ tipo: 'emergencia' })}>Emergencia: cancelar el día</button>}
          </div>
          <ul className="dia-panel__cifras">
            <li><strong>{activas.length}</strong>por atender</li>
            <li><strong>{citas.filter((cita) => cita.estado === 'completada').length}</strong>atendidas</li>
            <li><strong>{citas.filter((cita) => cita.estado === 'cancelada').length}</strong>canceladas</li>
            <li><strong>{dinero(cobrar)}</strong>por cobrar</li>
          </ul>
          {citas.length > 0 && (
            <div className="filtros-admin filtros-admin--agenda">
              <label className="filtros-admin__buscar"><span className="solo-lector">Buscar clienta</span><input type="search" value={buscarClienta} onChange={(evento) => { setBuscarClienta(evento.target.value); setPagina(1); }} placeholder="Buscar clienta o servicio" /></label>
              <label><span className="solo-lector">Especialista</span>
                <select value={filtro} onChange={(evento) => { setFiltro(evento.target.value); setPagina(1); }}>
                  <option value="">Todas las especialistas ({citas.length})</option>
                  {especialistas.filter((especialista) => citas.some((cita) => cita.especialista_id === especialista.id)).map((especialista) => <option key={especialista.id} value={especialista.id}>{especialista.nombre} ({citas.filter((cita) => cita.especialista_id === especialista.id).length})</option>)}
                </select>
              </label>
              <div className="barra-chips barra-chips--compacta" role="group" aria-label="Mostrar">
                {[['', 'Todas'], ['activas', 'Por atender'], ['completada', 'Atendidas'], ['cancelada', 'Canceladas'], ['no_asistio', 'No llegaron']].map(([k, t]) => (
                  <button key={k} type="button" className={`chip-filtro ${verEstado === k ? 'chip-filtro--activo' : ''}`} aria-pressed={verEstado === k} onClick={() => { setVerEstado(k); setPagina(1); }}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {visibles.length === 0 ? (
            <div className="dia-panel__vacio"><svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg><p>{dia?.nivel === 'cerrado' ? 'El salón está cerrado este día.' : citas.length ? 'Ninguna cita coincide con los filtros.' : 'No hay citas este día.'}</p></div>
          ) : (
            <ol className="citas-dia">
              {citasPagina.map((cita, i) => (
                <li key={cita.id} className={`cita-admin cita-admin--${cita.estado}`} style={{ '--n': i }}>
                  <div className="cita-admin__hora"><strong>{cita.hora}</strong><span>{cita.duracion_min} min</span></div>
                  <div className="cita-admin__info">
                    <p className="cita-admin__nombre">{cita.cliente_nombre} <span className={`estado estado--${cita.estado}`}>{NOMBRE_ESTADO[cita.estado] || cita.estado}</span></p>
                    <p>{cita.servicio} · con <b>{cita.especialista}</b></p>
                    <p className="tenue">{cita.forma ? `${cita.forma}, ${cita.largo}, ${cita.color}, ${cita.acabado}` : 'Diseño: lo elige en el salón'} · {dinero(cita.total)} (adelanto {dinero(cita.anticipo)})</p>
                    {cita.notas && <p className="cita-admin__nota">“{cita.notas}”</p>}
                    {cita.estado === 'cancelada' && cita.motivo_cancelacion && <p className="cita-admin__motivo">Cancelada: {cita.motivo_cancelacion}</p>}
                    {cita.estado === 'no_asistio' && <p className="cita-admin__motivo">No llegó · {cita.decision_inasistencia === 'cobrada' ? `se cobró ${dinero(cita.monto_cobrado)}` : `reprogramada (cita #${cita.reprogramada_a})`}{cita.decidido_por ? ` · decidió ${cita.decidido_por}` : ''}</p>}
                  </div>
                  {cita.foto_ref && <Foto archivo={cita.foto_ref} alt="Diseño de referencia" className="cita-admin__foto" />}
                  <div className="cita-admin__acciones">
                    {ACCIONES[cita.estado].map((accion) => <button key={accion} type="button" className="boton boton--chico" onClick={() => cambiar(cita.id, accion)}>{TEXTO_ACCION[accion]}</button>)}
                    {['pendiente', 'confirmada'].includes(cita.estado) && yaPasoLaHora(cita) && <button type="button" className="boton boton--chico boton--borde" onClick={() => setVentana({ tipo: 'no-asistio', cita: cita })}>No llegó</button>}
                    {['pendiente', 'confirmada'].includes(cita.estado) && <button type="button" className="boton boton--chico boton--peligro" onClick={() => setVentana({ tipo: 'cancelar', cita: cita })}>Cancelar</button>}
                    <button type="button" className="boton-whatsapp boton-whatsapp--chico" onClick={() => setVentana({ tipo: 'mensaje', cita: cita })}><Whats /> Mensaje</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <VerMas pagina={pagina} paginas={paginas} onCambiar={setPagina} />
        </div>
      </div>

      {historial.length > 0 && (
        <details className="historial-msj">
          <summary>Mensajes de WhatsApp preparados ({historial.length})</summary>
          <ul>
            {historial.slice(0, 30).map((mensaje) => (
              <li key={mensaje.id}>
                <span className={`historial-msj__tipo historial-msj__tipo--${mensaje.tipo}`}>{tipos[mensaje.tipo] || mensaje.tipo}</span>
                <span><strong>{mensaje.cliente}</strong> <span className="tenue">{mensaje.telefono} · {mensaje.creado_en.slice(0, 16)}</span></span>
                <a href={mensaje.enlace} target="_blank" rel="noreferrer" className="enlace" onClick={() => api.admin.mensajeEnviado(mensaje.id)}>{mensaje.enviado ? 'Reenviar' : 'Enviar'}</a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {ventana?.tipo === 'cancelar' && <VentanaCancelar cita={ventana.cita} onCerrar={() => setVentana(null)} onListo={recargar} />}
      {ventana?.tipo === 'emergencia' && <VentanaCancelar fecha={fecha} especialistas={especialistas} onCerrar={() => setVentana(null)} onListo={recargar} />}
      {ventana?.tipo === 'no-asistio' && <VentanaNoAsistio cita={ventana.cita} enviar={api.admin.noAsistio} onCerrar={() => setVentana(null)} onListo={recargar} />}
      {ventana?.tipo === 'mensaje' && <VentanaMensaje cita={ventana.cita} tipos={tipos} onCerrar={() => { setVentana(null); cargarHistorial(); }} />}
    </section>
  );
}
