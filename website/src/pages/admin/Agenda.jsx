// Agenda del panel: calendario del mes con los días llenos, citas del día elegido
// y avisos por WhatsApp a las clientas (cancelación por emergencia o cambio de horario).
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero } from '../../config.js';
import Modal from '../../components/Modal.jsx';
import Foto from '../../components/Foto.jsx';
import { BurbujaWhatsApp, DIAS_SEMANA, IconoWhatsApp, Tarjetas, fechaLarga, hoyISO, iso, nombreMes } from './comun.jsx';

const ACCIONES = { pendiente: ['confirmar'], confirmada: ['completar'], completada: [], cancelada: [] };
const TEXTO_ACCION = { confirmar: 'Confirmar', completar: 'Marcar atendida' };
const NIVEL = { libre: 'Con espacio', medio: 'Con espacio', casi: 'Casi lleno', lleno: 'Lleno', cerrado: 'Cerrado' };
const MOTIVOS = ['una emergencia familiar', 'enfermedad de la especialista', 'un corte de luz o de agua', 'un cierre imprevisto del salón'];
const activa = (c) => ['pendiente', 'confirmada'].includes(c.estado);

function Calendario({ mes, dias, elegido, onElegir, onMes }) {
  const primero = new Date(`${mes}-01T12:00:00`);
  const hueco = (primero.getDay() + 6) % 7; // la semana empieza el lunes
  const cambiar = (n) => { const d = new Date(primero); d.setMonth(d.getMonth() + n); onMes(iso(d).slice(0, 7)); };
  const hoy = hoyISO();
  return (
    <section className="calendario" aria-labelledby="t-cal">
      <div className="calendario__cabeza">
        <button type="button" onClick={() => cambiar(-1)} aria-label="Mes anterior">‹</button>
        <h3 id="t-cal">{nombreMes(mes)}</h3>
        <button type="button" onClick={() => cambiar(1)} aria-label="Mes siguiente">›</button>
        <button type="button" className="calendario__hoy" onClick={() => { onMes(hoy.slice(0, 7)); onElegir(hoy); }}>Hoy</button>
      </div>
      <div className="calendario__rejilla" role="grid" aria-label={`Ocupación de ${nombreMes(mes)}`}>
        {DIAS_SEMANA.map((d) => <span key={d} className="calendario__dia-semana" role="columnheader">{d}</span>)}
        {Array.from({ length: hueco }, (_, i) => <span key={`h${i}`} aria-hidden="true" />)}
        {dias.map((d, i) => {
          const pct = d.capacidad ? Math.min(100, Math.round((d.ocupadas / d.capacidad) * 100)) : 0;
          return (
            <button key={d.fecha} type="button" role="gridcell" style={{ '--n': i, '--p': `${pct}%` }}
                    className={`calendario__celda calendario__celda--${d.nivel} ${d.fecha === elegido ? 'calendario__celda--elegida' : ''} ${d.fecha === hoy ? 'calendario__celda--hoy' : ''} ${d.fecha < hoy ? 'calendario__celda--pasada' : ''}`}
                    aria-pressed={d.fecha === elegido} onClick={() => onElegir(d.fecha)}
                    aria-label={`${fechaLarga(d.fecha)}: ${d.nivel === 'cerrado' ? 'cerrado' : `${d.ocupadas} de ${d.capacidad} espacios ocupados, ${NIVEL[d.nivel].toLowerCase()}`}`}>
              <span className="calendario__num">{Number(d.fecha.slice(8))}</span>
              {d.nivel !== 'cerrado' && <>
                <span className="calendario__citas">{d.ocupadas} {d.ocupadas === 1 ? 'cita' : 'citas'}</span>
                <span className="calendario__barra"><span /></span>
                {['lleno', 'casi'].includes(d.nivel) && <span className="calendario__sello">{NIVEL[d.nivel]}</span>}
                {d.pendientes > 0 && <span className="calendario__pend" title="Por confirmar">{d.pendientes}</span>}
              </>}
            </button>
          );
        })}
      </div>
      <ul className="calendario__leyenda">
        <li><i className="l-libre" />Con espacio</li><li><i className="l-casi" />Casi lleno (60 % o más)</li><li><i className="l-lleno" />Lleno</li><li><i className="l-cerrado" />Cerrado</li><li><i className="l-pend">2</i>Por confirmar</li>
      </ul>
    </section>
  );
}

// Formulario de aviso: cancelar o proponer otro horario, con vista previa del WhatsApp
function Aviso({ cita, citas, onListo, onCerrar }) {
  const emergencia = !cita;
  const [tipo, setTipo] = useState('cancelacion');
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [nota, setNota] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [horas, setHoras] = useState([]);
  const [especialista, setEspecialista] = useState('');
  const [vista, setVista] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const afectadas = emergencia ? citas.filter((c) => activa(c) && (!especialista || String(c.especialista_id) === especialista)) : [cita];
  const especialistas = [...new Map(citas.filter(activa).map((c) => [c.especialista_id, c.especialista])).entries()];
  const muestra = afectadas[0];

  useEffect(() => {
    if (tipo !== 'reprogramacion' || !nuevaFecha || !muestra) { setHoras([]); return; }
    api.disponibilidad(muestra.especialista_id, nuevaFecha).then((l) => setHoras(l.filter((h) => h.disponible).map((h) => h.hora))).catch(() => setHoras([]));
  }, [tipo, nuevaFecha, muestra?.especialista_id]);

  useEffect(() => {
    if (!muestra) { setVista(null); return; }
    const t = setTimeout(() => api.admin.mensajeCita(muestra.id, { tipo, motivo, nota, nuevaFecha, nuevaHora, soloVista: true }).then(setVista).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [tipo, motivo, nota, nuevaFecha, nuevaHora, muestra?.id]);

  async function enviar() {
    setEnviando(true); setError('');
    try {
      const datos = { tipo, motivo, nota, nuevaFecha, nuevaHora };
      const r = emergencia ? await api.admin.emergencia({ ...datos, fecha: citas[0]?.fecha, especialistaId: especialista || null }) : [await api.admin.cancelarCita(cita.id, datos)];
      const historial = await api.admin.mensajes().catch(() => []);
      setResultado(r.map((x) => ({ ...x, mensajeId: historial.find((m) => m.cita_id === x.cita.id)?.id })));
      onListo();
    } catch (e) { setError(e.message); }
    setEnviando(false);
  }

  if (resultado) {
    return (
      <div className="aviso-hecho">
        <p className="aviso-hecho__ok"><span aria-hidden="true">✓</span> {resultado.length === 1 ? 'Cita cancelada.' : `${resultado.length} citas canceladas.`} Ahora envía el aviso a {resultado.length === 1 ? 'la clienta' : 'cada clienta'}:</p>
        <ul className="aviso-hecho__lista">
          {resultado.map((r) => (
            <li key={r.cita.id}>
              <p className="tenue">{r.cita.hora} · {r.cita.servicio} con {r.cita.especialista}</p>
              <BurbujaWhatsApp mensaje={r.mensaje} id={r.mensajeId} nombre={r.cita.cliente_nombre} />
            </li>
          ))}
        </ul>
        <button type="button" className="boton boton--contorno" onClick={onCerrar}>Listo</button>
      </div>
    );
  }

  return (
    <div className="aviso">
      <div className="aviso__form">
        {emergencia ? (
          <div className="aviso__alerta">
            <strong>Emergencia del {fechaLarga(citas[0]?.fecha || hoyISO())}</strong>
            <span>Se cancelan {afectadas.length} {afectadas.length === 1 ? 'cita' : 'citas'} y se prepara un WhatsApp para cada clienta.</span>
          </div>
        ) : (
          <div className="aviso__cita"><strong>{cita.cliente_nombre}</strong><span>{fechaLarga(cita.fecha)}, {cita.hora} · {cita.servicio} con {cita.especialista}</span></div>
        )}
        {emergencia && (
          <div className="campo">
            <label htmlFor="av-esp">¿A quién afecta?</label>
            <select id="av-esp" value={especialista} onChange={(e) => setEspecialista(e.target.value)}>
              <option value="">Todo el salón ({citas.filter(activa).length} citas)</option>
              {especialistas.map(([id, nombre]) => <option key={id} value={id}>Solo {nombre} ({citas.filter((c) => activa(c) && c.especialista_id === id).length})</option>)}
            </select>
          </div>
        )}
        <fieldset className="aviso__tipos">
          <legend>¿Qué le ofrecemos a la clienta?</legend>
          {[['cancelacion', 'Cancelar y que nos escriba', 'Le pedimos disculpas y que responda para buscar otro espacio.'],
            ['reprogramacion', 'Proponer otro horario', 'Le sugerimos un día y hora nuevos para que solo confirme.']].map(([k, t, d]) => (
            <label key={k} className={`aviso__tipo ${tipo === k ? 'aviso__tipo--activo' : ''}`}>
              <input type="radio" name="av-tipo" checked={tipo === k} onChange={() => setTipo(k)} /><strong>{t}</strong><span>{d}</span>
            </label>
          ))}
        </fieldset>
        <div className="campo">
          <span className="campo__etiqueta" id="av-mot">Motivo</span>
          <div className="aviso__chips" role="group" aria-labelledby="av-mot">
            {MOTIVOS.map((m) => <button key={m} type="button" aria-pressed={motivo === m} onClick={() => setMotivo(m)}>{m[0].toUpperCase() + m.slice(1)}</button>)}
          </div>
          <input aria-label="Motivo (puedes escribir otro)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        {tipo === 'reprogramacion' && !emergencia && (
          <div className="campos-dos">
            <div className="campo"><label htmlFor="av-f">Nueva fecha</label><input id="av-f" type="date" min={hoyISO()} value={nuevaFecha} onChange={(e) => { setNuevaFecha(e.target.value); setNuevaHora(''); }} /></div>
            <div className="campo">
              <label htmlFor="av-h">Hora libre de {cita.especialista}</label>
              <select id="av-h" value={nuevaHora} onChange={(e) => setNuevaHora(e.target.value)} disabled={!horas.length}>
                <option value="">{nuevaFecha ? (horas.length ? 'Elige la hora' : 'Sin espacios ese día') : 'Primero elige la fecha'}</option>
                {horas.map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>
        )}
        <div className="campo"><label htmlFor="av-nota">Nota extra (opcional)</label><textarea id="av-nota" rows={2} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej.: Te regalamos la decoración en tu próxima cita." /></div>
        {error && <p role="alert" className="error">{error}</p>}
        <button type="button" className="boton boton--peligro-lleno" disabled={enviando || !afectadas.length} onClick={enviar}>
          {enviando ? 'Cancelando…' : emergencia ? `Cancelar ${afectadas.length} ${afectadas.length === 1 ? 'cita' : 'citas'} y preparar avisos` : 'Cancelar la cita y preparar el aviso'}
        </button>
      </div>
      <div className="aviso__vista">
        <p className="tenue">Así le llegará{emergencia && afectadas.length > 1 ? ' a cada clienta (con su nombre y su hora)' : ''}:</p>
        {vista ? <div className="wa"><div className="wa__cabeza"><span className="wa__avatar" aria-hidden="true">{muestra.cliente_nombre[0]}</span><div><strong>{muestra.cliente_nombre}</strong><small>{muestra.cliente_telefono}</small></div></div><div className="wa__fondo"><p className="wa__burbuja">{vista.texto}</p></div></div> : <p className="tenue">Cargando vista previa…</p>}
      </div>
    </div>
  );
}

function TarjetaCita({ c, onAccion, onCancelar, onMensaje }) {
  return (
    <li className={`cita-admin cita-admin--${c.estado}`}>
      <span className="cita-admin__hora">{c.hora}</span>
      <div className="cita-admin__info">
        <div className="cita-admin__fila">
          <strong>{c.cliente_nombre}</strong>
          <span className={`estado estado--${c.estado}`}>{c.estado}</span>
        </div>
        <p>{c.servicio} <span className="tenue">con {c.especialista} · {c.duracion_min} min</span></p>
        {c.forma && <p className="tenue">Diseño: {[c.forma, c.largo, c.color, c.acabado, c.decoracion !== 'Ninguna' && c.decoracion].filter(Boolean).join(', ')}</p>}
        {c.notas && <p className="cita-admin__nota">“{c.notas}”</p>}
        {c.motivo_cancelacion && c.estado === 'cancelada' && <p className="cita-admin__nota">Cancelada por {c.motivo_cancelacion}</p>}
        <p className="tenue">{dinero(c.total)} · adelanto {dinero(c.anticipo)} ({c.metodo_pago}) · {c.cliente_telefono}</p>
        <div className="cita-admin__acciones">
          {ACCIONES[c.estado].map((a) => <button key={a} type="button" className="boton boton--chico" onClick={() => onAccion(c.id, a)}>{TEXTO_ACCION[a]}</button>)}
          {activa(c) && <button type="button" className="boton boton--chico boton--wa" onClick={() => onMensaje(c, c.estado === 'pendiente' ? 'confirmacion' : 'recordatorio')}><IconoWhatsApp tam={15} /> {c.estado === 'pendiente' ? 'Confirmarle' : 'Recordarle'}</button>}
          {activa(c) && <button type="button" className="boton boton--chico boton--peligro" onClick={() => onCancelar(c)}>Cancelar y avisar</button>}
        </div>
      </div>
      {c.foto_ref && <Foto archivo={c.foto_ref} alt="Foto de referencia" className="cita-admin__foto" />}
    </li>
  );
}

export default function Agenda() {
  const [mes, setMes] = useState(hoyISO().slice(0, 7));
  const [dias, setDias] = useState([]);
  const [fecha, setFecha] = useState(hoyISO());
  const [citas, setCitas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [verCanceladas, setVerCanceladas] = useState(false);
  const [modal, setModal] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [verHistorial, setVerHistorial] = useState(false);
  const [error, setError] = useState('');

  const cargarMes = () => api.admin.calendario(mes).then((r) => setDias(r.dias)).catch((e) => setError(e.message));
  const cargarDia = () => api.admin.citas(fecha).then(setCitas).catch((e) => setError(e.message));
  useEffect(() => { cargarMes(); }, [mes]);
  useEffect(() => { cargarDia(); }, [fecha]);
  useEffect(() => { if (verHistorial) api.admin.mensajes().then(setHistorial).catch(() => {}); }, [verHistorial, modal]);
  const recargar = () => { cargarMes(); cargarDia(); };

  const cambiar = async (id, accion) => { try { await api.admin.estadoCita(id, accion); recargar(); } catch (e) { setError(e.message); } };
  const mensaje = async (c, tipo) => {
    try { const m = await api.admin.mensajeCita(c.id, { tipo }); setModal({ tipo: 'mensaje', cita: c, mensaje: m }); } catch (e) { setError(e.message); }
  };

  const dia = dias.find((d) => d.fecha === fecha);
  const lista = citas.filter((c) => (verCanceladas || c.estado !== 'cancelada') && (!filtro || String(c.especialista_id) === filtro));
  const equipo = [...new Map(citas.map((c) => [c.especialista_id, c.especialista])).entries()];
  const stats = useMemo(() => {
    const hoy = hoyISO();
    const futuros = dias.filter((d) => d.fecha >= hoy);
    return [
      ['Citas hoy', dias.find((d) => d.fecha === hoy)?.ocupadas ?? '—', 'en la agenda', 'vino'],
      ['Por confirmar', futuros.reduce((s, d) => s + d.pendientes, 0), 'desde hoy', 'naranja'],
      ['Días llenos', dias.filter((d) => d.nivel === 'lleno').length, `en ${nombreMes(mes).split(' ')[0]}`, 'rojo'],
      ['Citas del mes', dias.reduce((s, d) => s + d.ocupadas, 0), `${dias.reduce((s, d) => s + d.canceladas, 0)} canceladas`, 'verde']
    ];
  }, [dias, mes]);

  return (
    <section aria-labelledby="t-agenda" className="agenda-admin">
      <h2 id="t-agenda" className="solo-lector">Agenda</h2>
      {error && <p role="alert" className="error">{error}</p>}
      <Tarjetas datos={stats} />
      <div className="agenda-admin__grid">
        <Calendario mes={mes} dias={dias} elegido={fecha} onElegir={(f) => { setFecha(f); setFiltro(''); }} onMes={setMes} />

        <section className="dia-admin" aria-labelledby="t-dia" key={fecha}>
          <div className="dia-admin__cabeza">
            <div>
              <h3 id="t-dia">{fechaLarga(fecha)}</h3>
              {dia && dia.nivel !== 'cerrado' ? (
                <div className={`dia-admin__ocupacion dia-admin__ocupacion--${dia.nivel}`}>
                  <span className="dia-admin__barra"><span style={{ width: `${Math.min(100, (dia.ocupadas / dia.capacidad) * 100)}%` }} /></span>
                  <small>{dia.ocupadas} de {dia.capacidad} espacios · {NIVEL[dia.nivel]}</small>
                </div>
              ) : <p className="tenue">El salón está cerrado este día.</p>}
            </div>
            {citas.some(activa) && fecha >= hoyISO() && (
              <button type="button" className="boton boton--chico boton--emergencia" onClick={() => setModal({ tipo: 'emergencia' })}>
                <span aria-hidden="true">⚠</span> Emergencia: cancelar el día
              </button>
            )}
          </div>
          {citas.length > 0 && (
            <div className="dia-admin__filtros">
              <select aria-label="Filtrar por especialista" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                <option value="">Todo el equipo ({citas.filter((c) => c.estado !== 'cancelada').length})</option>
                {equipo.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
              </select>
              <label className="casilla"><input type="checkbox" checked={verCanceladas} onChange={(e) => setVerCanceladas(e.target.checked)} /><span>Ver canceladas</span></label>
            </div>
          )}
          {lista.length === 0 ? <p className="dia-admin__vacio">No hay citas {citas.length ? 'con ese filtro' : 'este día'}.</p> : (
            <ul className="dia-admin__lista">
              {lista.map((c) => <TarjetaCita key={c.id} c={c} onAccion={cambiar} onCancelar={(x) => setModal({ tipo: 'cancelar', cita: x })} onMensaje={mensaje} />)}
            </ul>
          )}
        </section>
      </div>

      <section className="historial-wa">
        <button type="button" className="historial-wa__abrir" aria-expanded={verHistorial} onClick={() => setVerHistorial(!verHistorial)}>
          <IconoWhatsApp /> Historial de mensajes a clientas <span aria-hidden="true">{verHistorial ? '⌃' : '⌄'}</span>
        </button>
        {verHistorial && (historial.length === 0 ? <p className="tenue">Todavía no se ha enviado ningún aviso.</p> : (
          <ul className="historial-wa__lista">
            {historial.map((m) => (
              <li key={m.id}>
                <span className={`historial-wa__tipo historial-wa__tipo--${m.tipo}`}>{m.tipo.replace('-', ' ')}</span>
                <strong>{m.cliente}</strong><span className="tenue">{m.creado_en.slice(0, 16)}</span>
                <span className={m.enviado ? 'historial-wa__ok' : 'tenue'}>{m.enviado ? '✓ Enviado' : 'Sin abrir'}</span>
                <a className="enlace" href={m.enlace} target="_blank" rel="noreferrer" onClick={() => api.admin.mensajeEnviado(m.id)}>Abrir</a>
              </li>
            ))}
          </ul>
        ))}
      </section>

      {modal?.tipo === 'cancelar' && <Modal titulo="Cancelar cita y avisar por WhatsApp" onCerrar={() => setModal(null)} ancho><Aviso cita={modal.cita} citas={citas} onListo={recargar} onCerrar={() => setModal(null)} /></Modal>}
      {modal?.tipo === 'emergencia' && <Modal titulo="Emergencia: cancelar las citas del día" onCerrar={() => setModal(null)} ancho><Aviso citas={citas} onListo={recargar} onCerrar={() => setModal(null)} /></Modal>}
      {modal?.tipo === 'mensaje' && (
        <Modal titulo={modal.mensaje.titulo} onCerrar={() => setModal(null)}>
          <BurbujaWhatsApp mensaje={modal.mensaje} nombre={modal.cita.cliente_nombre} />
        </Modal>
      )}
    </section>
  );
}
