// Agenda del salón: calendario del mes con los días llenos, citas del día y avisos por WhatsApp.
// Las cancelaciones usan el patrón State en el servidor y los mensajes usan Template Method + Factory + Adapter.
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero } from '../../config.js';
import Foto from '../../components/Foto.jsx';
import Modal from '../../components/Modal.jsx';
import { TarjetaMensaje, Whats, fechaLarga, nombreMes, isoLocal } from './piezasPanel.jsx';

const ACCIONES = { pendiente: ['confirmar'], confirmada: ['completar'], completada: [], cancelada: [] };
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
  const [a, m] = mes.split('-').map(Number);
  const vacios = (new Date(a, m - 1, 1).getDay() + 6) % 7;
  const hoy = isoLocal(new Date());
  // Nombre: mover
  // Descripción: Cambia de mes.
  // Entrada: Cuántos meses.
  // Salida: Nada.
  // Objetivo: Ver otro mes.
  const mover = (d) => { const f = new Date(a, m - 1 + d, 1); onMes(`${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`); };
  return (
    <div className="cal">
      <div className="cal__cabeza">
        <button type="button" className="cal__flecha" onClick={() => mover(-1)} aria-label="Mes anterior">‹</button>
        <h3 aria-live="polite">{nombreMes(mes)}</h3>
        <button type="button" className="cal__flecha" onClick={() => mover(1)} aria-label="Mes siguiente">›</button>
      </div>
      <div className="cal__rejilla" role="grid" aria-label={`Calendario de ${nombreMes(mes)}`}>
        {CABECERA.map((d) => <span key={d} className="cal__dia-semana" role="columnheader">{d}</span>)}
        {Array.from({ length: vacios }, (_, i) => <span key={`v${i}`} aria-hidden="true" />)}
        {dias.map((d, i) => {
          const pct = d.capacidad ? Math.min(100, Math.round((d.ocupadas / d.capacidad) * 100)) : 0;
          return (
            <button key={d.fecha} type="button" role="gridcell" style={{ '--n': i, '--p': `${pct}%` }}
                    className={`cal__dia cal__dia--${d.nivel} ${d.fecha === elegido ? 'cal__dia--elegido' : ''} ${d.fecha === hoy ? 'cal__dia--hoy' : ''}`}
                    aria-pressed={d.fecha === elegido} onClick={() => onElegir(d.fecha)}
                    aria-label={`${fechaLarga(d.fecha)}: ${NIVEL[d.nivel]}, ${d.ocupadas} de ${d.capacidad} espacios ocupados`}>
              <span className="cal__num">{Number(d.fecha.slice(8))}</span>
              {d.capacidad > 0 && <span className="cal__cuenta">{d.ocupadas}/{d.capacidad}</span>}
              {d.canceladas > 0 && <span className="cal__cancel" title={`${d.canceladas} canceladas`}>{d.canceladas}</span>}
              {d.capacidad > 0 && <span className="cal__barra" aria-hidden="true"><i /></span>}
            </button>
          );
        })}
      </div>
      <ul className="cal__leyenda">
        {['libre', 'medio', 'casi', 'lleno', 'cerrado'].map((n) => <li key={n}><i className={`cal__punto cal__punto--${n}`} />{NIVEL[n]}</li>)}
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
  const set = (k) => (e) => setDatos({ ...datos, [k]: e.target.value });

  // Nombre: confirmar
  // Descripción: Confirma la cancelación.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Cancelar la cita.
  async function confirmar(e) {
    e.preventDefault();
    if (datos.motivo.trim().length < 3) return setEstado({ enviando: false, error: 'Escribe el motivo: se le explica a la clienta en el mensaje.' });
    setEstado({ enviando: true, error: '' });
    try {
      const r = emergencia ? await api.admin.emergencia({ ...datos, fecha }) : [await api.admin.cancelarCita(cita.id, datos)];
      setMensajes(r); onListo();
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
                {especialistas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          )}
          {datos.tipo === 'reprogramacion' && !emergencia && (
            <div className="campos-dos">
              <div className="campo"><label htmlFor="c-fecha">Nueva fecha propuesta</label><input id="c-fecha" type="date" min={isoLocal(new Date())} value={datos.nuevaFecha} onChange={set('nuevaFecha')} /></div>
              <div className="campo"><label htmlFor="c-hora">Hora</label><select id="c-hora" value={datos.nuevaHora} onChange={set('nuevaHora')}><option value="">Elegir</option>{HORAS_SALON.map((h) => <option key={h}>{h}</option>)}</select></div>
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
          {['recordatorio', 'confirmacion'].map((t) => (
            <button key={t} type="button" className={`chip-filtro ${tipo === t ? 'chip-filtro--activo' : ''}`} aria-pressed={tipo === t} onClick={() => setTipo(t)}>{tipos[t] || t}</button>
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
  const [ventana, setVentana] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState('');

  // Nombre: cargarMes
  // Descripción: Carga el mes.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Pintar el calendario.
  const cargarMes = () => api.admin.calendario(mes).then((r) => setDias(r.dias)).catch((e) => setError(e.message));
  // Nombre: cargarDia
  // Descripción: Carga las citas del día.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ver la lista.
  const cargarDia = () => api.admin.citas(fecha).then(setCitas).catch((e) => setError(e.message));
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
  const cambiar = async (id, accion) => { try { await api.admin.estadoCita(id, accion); recargar(); } catch (e) { setError(e.message); } };
  // Nombre: elegirDia
  // Descripción: Elige un día.
  // Entrada: La fecha.
  // Salida: Nada.
  // Objetivo: Ver sus citas.
  const elegirDia = (f) => { setFecha(f); if (f.slice(0, 7) !== mes) setMes(f.slice(0, 7)); };

  const dia = dias.find((d) => d.fecha === fecha);
  const ESTADOS_FILTRO = { activas: ['pendiente', 'confirmada'], completada: ['completada'], cancelada: ['cancelada'] };
  const visibles = citas.filter((c) => (!filtro || String(c.especialista_id) === filtro)
    && (!verEstado || ESTADOS_FILTRO[verEstado].includes(c.estado))
    && (!buscarClienta || `${c.cliente_nombre} ${c.cliente_telefono} ${c.servicio}`.toLowerCase().includes(buscarClienta.toLowerCase())));
  const activas = citas.filter((c) => ['pendiente', 'confirmada'].includes(c.estado));
  const cobrar = activas.reduce((s, c) => s + (c.total - c.anticipo), 0);

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
            <li><strong>{citas.filter((c) => c.estado === 'completada').length}</strong>atendidas</li>
            <li><strong>{citas.filter((c) => c.estado === 'cancelada').length}</strong>canceladas</li>
            <li><strong>{dinero(cobrar)}</strong>por cobrar</li>
          </ul>
          {citas.length > 0 && (
            <div className="filtros-admin filtros-admin--agenda">
              <label className="filtros-admin__buscar"><span className="solo-lector">Buscar clienta</span><input type="search" value={buscarClienta} onChange={(e) => setBuscarClienta(e.target.value)} placeholder="Buscar clienta o servicio" /></label>
              <label><span className="solo-lector">Especialista</span>
                <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                  <option value="">Todas las especialistas ({citas.length})</option>
                  {especialistas.filter((e) => citas.some((c) => c.especialista_id === e.id)).map((e) => <option key={e.id} value={e.id}>{e.nombre} ({citas.filter((c) => c.especialista_id === e.id).length})</option>)}
                </select>
              </label>
              <div className="barra-chips barra-chips--compacta" role="group" aria-label="Mostrar">
                {[['', 'Todas'], ['activas', 'Por atender'], ['completada', 'Atendidas'], ['cancelada', 'Canceladas']].map(([k, t]) => (
                  <button key={k} type="button" className={`chip-filtro ${verEstado === k ? 'chip-filtro--activo' : ''}`} aria-pressed={verEstado === k} onClick={() => setVerEstado(k)}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {visibles.length === 0 ? (
            <div className="dia-panel__vacio"><svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg><p>{dia?.nivel === 'cerrado' ? 'El salón está cerrado este día.' : citas.length ? 'Ninguna cita coincide con los filtros.' : 'No hay citas este día.'}</p></div>
          ) : (
            <ol className="citas-dia">
              {visibles.map((c, i) => (
                <li key={c.id} className={`cita-admin cita-admin--${c.estado}`} style={{ '--n': i }}>
                  <div className="cita-admin__hora"><strong>{c.hora}</strong><span>{c.duracion_min} min</span></div>
                  <div className="cita-admin__info">
                    <p className="cita-admin__nombre">{c.cliente_nombre} <span className={`estado estado--${c.estado}`}>{{ pendiente: 'Por confirmar', confirmada: 'Confirmada', completada: 'Atendida', cancelada: 'Cancelada' }[c.estado] || c.estado}</span></p>
                    <p>{c.servicio} · con <b>{c.especialista}</b></p>
                    <p className="tenue">{c.forma ? `${c.forma}, ${c.largo}, ${c.color}, ${c.acabado}` : 'Diseño: lo elige en el salón'} · {dinero(c.total)} (adelanto {dinero(c.anticipo)})</p>
                    {c.notas && <p className="cita-admin__nota">“{c.notas}”</p>}
                    {c.estado === 'cancelada' && c.motivo_cancelacion && <p className="cita-admin__motivo">Cancelada: {c.motivo_cancelacion}</p>}
                  </div>
                  {c.foto_ref && <Foto archivo={c.foto_ref} alt="Diseño de referencia" className="cita-admin__foto" />}
                  <div className="cita-admin__acciones">
                    {ACCIONES[c.estado].map((a) => <button key={a} type="button" className="boton boton--chico" onClick={() => cambiar(c.id, a)}>{TEXTO_ACCION[a]}</button>)}
                    {c.estado !== 'cancelada' && c.estado !== 'completada' && <button type="button" className="boton boton--chico boton--peligro" onClick={() => setVentana({ tipo: 'cancelar', cita: c })}>Cancelar</button>}
                    <button type="button" className="boton-whatsapp boton-whatsapp--chico" onClick={() => setVentana({ tipo: 'mensaje', cita: c })}><Whats /> Mensaje</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {historial.length > 0 && (
        <details className="historial-msj">
          <summary>Mensajes de WhatsApp preparados ({historial.length})</summary>
          <ul>
            {historial.slice(0, 30).map((m) => (
              <li key={m.id}>
                <span className={`historial-msj__tipo historial-msj__tipo--${m.tipo}`}>{tipos[m.tipo] || m.tipo}</span>
                <span><strong>{m.cliente}</strong> <span className="tenue">{m.telefono} · {m.creado_en.slice(0, 16)}</span></span>
                <a href={m.enlace} target="_blank" rel="noreferrer" className="enlace" onClick={() => api.admin.mensajeEnviado(m.id)}>{m.enviado ? 'Reenviar' : 'Enviar'}</a>
              </li>
            ))}
          </ul>
        </details>
      )}

      {ventana?.tipo === 'cancelar' && <VentanaCancelar cita={ventana.cita} onCerrar={() => setVentana(null)} onListo={recargar} />}
      {ventana?.tipo === 'emergencia' && <VentanaCancelar fecha={fecha} especialistas={especialistas} onCerrar={() => setVentana(null)} onListo={recargar} />}
      {ventana?.tipo === 'mensaje' && <VentanaMensaje cita={ventana.cita} tipos={tipos} onCerrar={() => { setVentana(null); cargarHistorial(); }} />}
    </section>
  );
}
