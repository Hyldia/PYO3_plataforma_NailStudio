// Portal del equipo: cada especialista entra con el usuario y la contraseña que le da el salón
// y ve sus citas con los datos de cada clienta, sus clientas, sus días libres, su estación y lo que lleva ganado.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, sesionEquipo } from '../lib/api.js';
import { useTitulo, usePorPagina } from '../lib/hooks.js';
import { SALON, dinero, urlFoto } from '../config.js';
import Foto from '../components/Foto.jsx';
import Modal from '../components/Modal.jsx';
import VentanaNoAsistio from '../components/VentanaNoAsistio.jsx';
import AvatarClienta from '../components/AvatarClienta.jsx';
import VerMas from '../components/VerMas.jsx';
import { fechaLarga, isoLocal, DIAS_SEMANA } from './admin/piezasPanel.jsx';

const CITAS_POR_PAGINA = 4;
const CLIENTAS_POR_PAGINA_BASE = 10;
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ESTADO = { pendiente: 'Por confirmar', confirmada: 'Confirmada', completada: 'Atendida', cancelada: 'Cancelada', no_asistio: 'No llegó' };
const TIPO = { libre: 'Día libre', vacaciones: 'Vacaciones', incapacidad: 'Incapacidad', permiso: 'Permiso' };
// Nombre: sumar
// Descripción: Suma días a una fecha.
// Entrada: La fecha y cuántos días.
// Salida: La fecha nueva.
// Objetivo: Calcular fechas.
const sumar = (f, n) => { const d = new Date(`${f}T12:00:00`); d.setDate(d.getDate() + n); return isoLocal(d); };
// Nombre: faltan
// Descripción: Cuenta los días que faltan.
// Entrada: La fecha y hoy.
// Salida: Los días.
// Objetivo: Mostrar "faltan X días".
const faltan = (f, hoy) => Math.round((new Date(`${f}T12:00:00`) - new Date(`${hoy}T12:00:00`)) / 86400000);
// Nombre: wa
// Descripción: Arma el enlace de WhatsApp a una clienta.
// Entrada: El teléfono y el texto.
// Salida: El enlace.
// Objetivo: Escribirle.
const wa = (tel, texto) => `https://wa.me/506${String(tel).replace(/\D/g, '').slice(-8)}?text=${encodeURIComponent(texto)}`;
// Nombre: hora12
// Descripción: Escribe la hora en formato 12 horas.
// Entrada: La hora.
// Salida: El texto.
// Objetivo: Leer fácil.
const hora12 = (h) => { const [a, m] = h.split(':').map(Number); return `${a % 12 || 12}:${String(m).padStart(2, '0')} ${a < 12 ? 'a. m.' : 'p. m.'}`; };

// Nombre: Entrar
// Descripción: Muestra la entrada al portal.
// Entrada: Qué hacer al entrar.
// Salida: El formulario.
// Objetivo: Iniciar sesión.
function Entrar({ onEntrar }) {
  const [d, setD] = useState({ usuario: '', contrasena: '' });
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  // Nombre: entrar
  // Descripción: Envía usuario y contraseña.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Entrar al portal.
  const entrar = async (evento) => {
    evento.preventDefault();
    setCargando(true); setError('');
    try { const r = await api.equipo.entrar(d); sesionEquipo.guardar(r.token); onEntrar(); } catch (error) { setError(error.message); setCargando(false); }
  };
  return (
    <div className="portal-entrar">
      <div className="portal-entrar__lado" aria-hidden="true">
        <span className="portal-entrar__burbuja portal-entrar__burbuja--1" />
        <span className="portal-entrar__burbuja portal-entrar__burbuja--2" />
        <p className="portal-entrar__marca">{SALON.nombre}</p>
        <p className="portal-entrar__lema">Tu agenda, tus clientas y tu pago, en un solo lugar.</p>
        <ul>
          <li>Citas del día con los datos de cada clienta</li>
          <li>Días libres y tu estación de trabajo</li>
          <li>Lo que llevas ganado y tu próximo día de pago</li>
        </ul>
      </div>
      <form className="portal-entrar__form" onSubmit={entrar}>
        <h1>Acceso del equipo</h1>
        <p className="tenue">Entra con el usuario y la contraseña que te dio el salón.</p>
        <div className="campo"><label htmlFor="pe-usu">Usuario</label><input id="pe-usu" value={d.usuario} onChange={(evento) => setD({ ...d, usuario: evento.target.value })} autoComplete="username" autoCapitalize="none" required /></div>
        <div className="campo">
          <label htmlFor="pe-cla">Contraseña</label>
          <div className="acceso__clave">
            <input id="pe-cla" type={ver ? 'text' : 'password'} value={d.contrasena} onChange={(evento) => setD({ ...d, contrasena: evento.target.value })} autoComplete="current-password" required />
            <button type="button" onClick={() => setVer(!ver)} aria-pressed={ver}>{ver ? 'Ocultar' : 'Ver'}</button>
          </div>
        </div>
        {error && <p role="alert" className="error">{error}</p>}
        <button type="submit" className="boton" disabled={cargando}>{cargando ? 'Entrando…' : 'Entrar'}</button>
        <p className="tenue portal-entrar__ayuda">¿No tienes usuario o lo olvidaste? Pídeselo a la administradora del salón.</p>
      </form>
    </div>
  );
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
// Nombre: fechaCorta
// Descripción: Escribe una fecha corta.
// Entrada: La fecha.
// Salida: El texto.
// Objetivo: Leer fácil.
const fechaCorta = (f) => (f ? `${Number(f.slice(8, 10))} ${MESES_CORTOS[Number(f.slice(5, 7)) - 1]}` : '');

// Pedir días libres en un calendario: se toca el primer día y, si son varios, el último.
// En el mismo calendario se ven los días que no trabaja, los aprobados y los que esperan respuesta.
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
// Nombre: PedirLibre
// Descripción: Muestra el calendario para pedir libres.
// Entrada: Datos del calendario.
// Salida: La sección.
// Objetivo: Pedir días libres.
function PedirLibre({ hoy, dias, ausencias, solicitudes, onListo }) {
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const [sel, setSel] = useState({ desde: null, hasta: null });
  const [tipo, setTipo] = useState('libre');
  const [motivo, setMotivo] = useState('');
  const [estado, setEstado] = useState({ enviando: false, error: '', ok: '' });
  const ausentes = useMemo(() => Object.fromEntries(ausencias.map((a) => [a.fecha, a.tipo])), [ausencias]);
  // Nombre: pendiente
  // Descripción: Revisa si un día tiene solicitud pendiente.
  // Entrada: La fecha.
  // Salida: Sí o no.
  // Objetivo: Pintarlo en el calendario.
  const pendiente = (f) => solicitudes.some((s) => s.estado === 'pendiente' && f >= s.desde && f <= s.hasta);
  // Nombre: trabaja
  // Descripción: Revisa si trabaja ese día.
  // Entrada: La fecha.
  // Salida: Sí o no.
  // Objetivo: Pintar el calendario.
  const trabaja = (f) => dias.split(',').includes(String(new Date(`${f}T12:00:00`).getDay() || 7));

  const [a, m] = mes.split('-').map(Number);
  const primero = new Date(a, m - 1, 1);
  const total = new Date(a, m, 0).getDate();
  const huecos = (primero.getDay() + 6) % 7;
  const celdas = [...Array(huecos).fill(null), ...Array.from({ length: total }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`)];
  // Nombre: moverMes
  // Descripción: Cambia de mes.
  // Entrada: Cuántos meses.
  // Salida: Nada.
  // Objetivo: Ver otro mes.
  const moverMes = (n) => { const d = new Date(a, m - 1 + n, 1); setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };

  // Nombre: tocar
  // Descripción: Elige un día en el calendario.
  // Entrada: La fecha.
  // Salida: Nada.
  // Objetivo: Marcar el rango.
  const tocar = (f) => {
    setEstado({ enviando: false, error: '', ok: '' });
    if (!sel.desde || sel.hasta || f < sel.desde) return setSel({ desde: f, hasta: null });
    setSel({ desde: sel.desde, hasta: f });
  };
  const hasta = sel.hasta || sel.desde;
  // Nombre: enRango
  // Descripción: Revisa si un día está en el rango.
  // Entrada: La fecha.
  // Salida: Sí o no.
  // Objetivo: Pintar el rango.
  const enRango = (f) => sel.desde && f >= sel.desde && f <= hasta && !ausentes[f];
  const cuantos = sel.desde ? Math.round((new Date(`${hasta}T12:00:00`) - new Date(`${sel.desde}T12:00:00`)) / 86400000) + 1 : 0;

  // Nombre: enviar
  // Descripción: Envía la solicitud.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Pedir el libre.
  const enviar = async () => {
    setEstado({ enviando: true, error: '', ok: '' });
    try {
      const r = await api.equipo.pedirLibre({ desde: sel.desde, hasta, tipo, motivo });
      setEstado({ enviando: false, error: '', ok: `¡Listo! Tu solicitud le llegó a la administradora.${r.citas ? ` Ojo: tienes ${r.citas} ${r.citas === 1 ? 'cita' : 'citas'} esos días; si te lo aprueban, el salón les avisa.` : ''}` });
      setSel({ desde: null, hasta: null }); setMotivo('');
      onListo();
    } catch (err) { setEstado({ enviando: false, error: err.message, ok: '' }); }
  };

  return (
    <article className="libres-cal">
      <header className="libres-cal__cabeza">
        <div><h2>Pedir días libres</h2><p className="tenue">Toca el día que necesitas. Si son varios, toca también el último.</p></div>
        <div className="libres-cal__nav">
          <button type="button" onClick={() => moverMes(-1)} disabled={mes <= hoy.slice(0, 7)} aria-label="Mes anterior">‹</button>
          <b>{MESES_LARGOS[m - 1]} {a}</b>
          <button type="button" onClick={() => moverMes(1)} aria-label="Mes siguiente">›</button>
        </div>
      </header>
      <div className="libres-cal__semana" aria-hidden="true">{['L', 'K', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}</span>)}</div>
      <div className="libres-cal__dias" role="grid">
        {celdas.map((f, i) => {
          if (!f) return <span key={`h${i}`} />;
          const pasado = f < hoy;
          const clase = ausentes[f] ? `libres-cal__dia--${ausentes[f]}` : pendiente(f) ? 'libres-cal__dia--pendiente' : !trabaja(f) ? 'libres-cal__dia--descanso' : '';
          return (
            <button key={f} type="button" disabled={pasado || Boolean(ausentes[f])} onClick={() => tocar(f)}
                    className={`libres-cal__dia ${clase} ${enRango(f) ? 'libres-cal__dia--elegido' : ''} ${f === sel.desde || f === hasta ? 'libres-cal__dia--borde' : ''} ${f === hoy ? 'libres-cal__dia--hoy' : ''}`}
                    aria-pressed={enRango(f)} aria-label={`${fechaLarga(f)}${ausentes[f] ? `, ${TIPO[ausentes[f]]}` : pendiente(f) ? ', pedido y esperando respuesta' : !trabaja(f) ? ', no trabajas' : ''}`}>
              {Number(f.slice(8))}
            </button>
          );
        })}
      </div>
      <ul className="libres-cal__leyenda" aria-label="Qué significa cada color">
        <li><i className="libres-cal__dia--descanso" />No trabajas</li>
        <li><i className="libres-cal__dia--vacaciones" />Aprobado</li>
        <li><i className="libres-cal__dia--pendiente" />Esperando respuesta</li>
        <li><i className="libres-cal__dia--elegido" />Lo que elegiste</li>
      </ul>

      {sel.desde && (
        <div className="libres-cal__pedido">
          <p className="libres-cal__resumen">
            <b>{sel.hasta && sel.hasta !== sel.desde ? `Del ${fechaLarga(sel.desde)} al ${fechaLarga(sel.hasta)}` : fechaLarga(sel.desde)}</b>
            <span>{cuantos} {cuantos === 1 ? 'día' : 'días'}</span>
          </p>
          <div className="tipos-ausencia" role="radiogroup" aria-label="Tipo">
            {Object.entries(TIPO).map(([k, t]) => <label key={k} className={`tipo-ausencia ${tipo === k ? 'activo' : ''}`}><input type="radio" name="pl-tipo" value={k} checked={tipo === k} onChange={() => setTipo(k)} />{t}</label>)}
          </div>
          <label className="libres-cal__motivo"><span className="solo-lector">Motivo (opcional)</span><input value={motivo} onChange={(evento) => setMotivo(evento.target.value)} maxLength={160} placeholder="¿Por qué? (opcional) Ej.: cita médica" /></label>
          <div className="botones">
            <button type="button" className="boton" disabled={estado.enviando} onClick={enviar}>{estado.enviando ? 'Enviando…' : 'Enviar solicitud'}</button>
            <button type="button" className="enlace enlace--boton" onClick={() => setSel({ desde: null, hasta: null })}>Borrar selección</button>
          </div>
        </div>
      )}
      {estado.error && <p role="alert" className="error">{estado.error}</p>}
      {estado.ok && <p role="status" className="aviso-ok">{estado.ok}</p>}
    </article>
  );
}

// La especialista cancela una cita suya: se escribe el motivo y queda listo el aviso de WhatsApp para la clienta
const MOTIVOS = ['Una enfermedad', 'Una emergencia familiar', 'Un imprevisto', 'Un problema de transporte'];
// Nombre: CancelarCita
// Descripción: Muestra la ventana para cancelar una cita.
// Entrada: La cita y opciones.
// Salida: La ventana.
// Objetivo: Cancelar con aviso.
function CancelarCita({ c, onCerrar, onListo }) {
  const [motivo, setMotivo] = useState('');
  const [otro, setOtro] = useState('');
  const [tipo, setTipo] = useState('reprogramacion');
  const [estado, setEstado] = useState({ enviando: false, error: '', aviso: null });
  const texto = motivo === 'otro' ? otro : motivo;
  // Nombre: enviar
  // Descripción: Confirma la cancelación.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Cancelar la cita.
  const enviar = async (evento) => {
    evento.preventDefault();
    setEstado({ enviando: true, error: '', aviso: null });
    try {
      const r = await api.equipo.cancelarCita(c.id, { motivo: texto, tipo });
      setEstado({ enviando: false, error: '', aviso: r.mensaje });
      onListo();
    } catch (err) { setEstado({ enviando: false, error: err.message, aviso: null }); }
  };
  return (
    <Modal titulo={estado.aviso ? 'Cita cancelada' : `Cancelar la cita de ${c.cliente_nombre}`} onCerrar={onCerrar}>
      {estado.aviso ? (
        <div className="portal-cancelar">
          <p className="aviso-ok">✓ La cita se canceló y la administradora ya la ve en la agenda.</p>
          <p><b>Ahora avísale a {c.cliente_nombre.split(' ')[0]}.</b> El mensaje ya está escrito; solo toca el botón y luego «Enviar» en WhatsApp:</p>
          <pre className="portal-cancelar__texto">{estado.aviso.texto}</pre>
          <a className="portal-cancelar__wa" href={estado.aviso.enlace} target="_blank" rel="noreferrer">Enviar el aviso por WhatsApp</a>
          <button type="button" className="enlace enlace--boton" onClick={onCerrar}>Cerrar</button>
        </div>
      ) : (
        <form className="portal-cancelar" onSubmit={enviar}>
          <p className="tenue">{fechaLarga(c.fecha)} · {hora12(c.hora)} · {c.servicio}</p>
          <fieldset className="grupo">
            <legend className="grupo__titulo grupo__titulo--chico">¿Por qué no puedes atenderla?</legend>
            <div className="portal-cancelar__motivos">
              {[...MOTIVOS, 'otro'].map((m) => (
                <label key={m} className={motivo === m ? 'activo' : ''}><input type="radio" name="motivo" value={m} checked={motivo === m} onChange={() => setMotivo(m)} />{m === 'otro' ? 'Otro motivo' : m}</label>
              ))}
            </div>
            {motivo === 'otro' && <input className="portal-cancelar__otro" value={otro} onChange={(evento) => setOtro(evento.target.value)} maxLength={160} placeholder="Ej.: una cita médica" aria-label="Otro motivo" autoFocus />}
          </fieldset>
          <fieldset className="grupo">
            <legend className="grupo__titulo grupo__titulo--chico">¿Qué le decimos a la clienta?</legend>
            <div className="portal-cancelar__motivos portal-cancelar__motivos--dos">
              <label className={tipo === 'reprogramacion' ? 'activo' : ''}><input type="radio" name="tipo" checked={tipo === 'reprogramacion'} onChange={() => setTipo('reprogramacion')} /><b>Ofrecerle otro día</b><small>Le pedimos que responda con el día y la hora que le sirvan</small></label>
              <label className={tipo === 'cancelacion' ? 'activo' : ''}><input type="radio" name="tipo" checked={tipo === 'cancelacion'} onChange={() => setTipo('cancelacion')} /><b>Solo cancelar</b><small>Le avisamos y le pedimos disculpas</small></label>
            </div>
          </fieldset>
          {estado.error && <p role="alert" className="error">{estado.error}</p>}
          <div className="botones">
            <button type="submit" className="boton boton--rojo" disabled={estado.enviando || texto.trim().length < 3}>{estado.enviando ? 'Cancelando…' : 'Cancelar la cita'}</button>
            <button type="button" className="boton boton--contorno" onClick={onCerrar}>Volver</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// Nombre: TarjetaCita
// Descripción: Muestra una cita.
// Entrada: La cita y opciones.
// Salida: La tarjeta.
// Objetivo: Ver la agenda.
function TarjetaCita({ c, hoy, onCancelar, onNoAsistio }) {
  const minutosQueFaltan = (new Date(`${c.fecha}T${c.hora}:00-06:00`).getTime() - Date.now()) / 60000;
  const activa = ['pendiente', 'confirmada'].includes(c.estado);
  let extras = [];
  try { extras = JSON.parse(c.extras || '[]'); } catch { extras = []; }
  const diseno = [c.forma, c.largo, c.color, c.acabado, c.decoracion !== 'Ninguna' ? c.decoracion : null,
    ...extras.map((x) => `${x.tipo} ${String(x.variante).toLowerCase()} en ${x.dedos.length === 5 ? 'todas' : x.dedos.map((i) => ['pulgar', 'índice', 'medio', 'anular', 'meñique'][i]).join(', ')} (${String(x.posicion).toLowerCase()})`)].filter(Boolean);
  return (
    <li className={`portal-cita portal-cita--${c.estado}`}>
      <div className="portal-cita__hora"><strong>{hora12(c.hora)}</strong><span>{c.duracion_min} min</span></div>
      <div className="portal-cita__info">
        <p className="portal-cita__clienta">
          <AvatarClienta nombre={c.cliente_nombre} foto={c.foto_clienta} tam={34} />
          {c.cliente_nombre}
          {c.visitas >= 3 && <span className="portal-cita__frecuente">Clienta frecuente · {c.visitas} visitas</span>}
          {c.visitas === 0 && <span className="portal-cita__nueva">Primera vez contigo</span>}
        </p>
        <p className="portal-cita__servicio">{c.servicio} · {dinero(c.total)}{c.anticipo ? ` (adelantó ${dinero(c.anticipo)})` : ''}</p>
        {diseno.length > 0 && <p className="portal-cita__diseno">{diseno.map((x) => <span key={x}>{x}</span>)}</p>}
        {c.notas && <p className="portal-cita__nota">“{c.notas}”</p>}
        {c.estado === 'no_asistio' && <p className="portal-cita__nota">No llegó · {c.decision_inasistencia === 'cobrada' ? `se cobró ${dinero(c.monto_cobrado)}` : 'se reprogramó'}</p>}
        <span className={`portal-cita__estado portal-cita__estado--${c.estado}`}>{ESTADO[c.estado] || c.estado}</span>
      </div>
      <div className="portal-cita__acciones">
        {c.foto_ref && <a href={urlFoto(c.foto_ref)} target="_blank" rel="noreferrer" className="portal-cita__ref" title="Foto de referencia"><Foto archivo={c.foto_ref} alt="Foto de referencia que eligió la clienta" /></a>}
        <a className="portal-cita__tel" href={`tel:${c.cliente_telefono.replace(/\s/g, '')}`}>{c.cliente_telefono}</a>
        <a className="portal-cita__wa" href={wa(c.cliente_telefono, `Hola ${c.cliente_nombre.split(' ')[0]}, te escribe tu especialista de ${SALON.nombre}.`)} target="_blank" rel="noreferrer">WhatsApp</a>
        {activa && minutosQueFaltan <= 0 && <button type="button" className="portal-cita__cancelar" onClick={() => onNoAsistio(c)}>No llegó</button>}
        {activa && minutosQueFaltan >= 120 && <button type="button" className="portal-cita__cancelar" onClick={() => onCancelar(c)}>Cancelar cita</button>}
        {activa && minutosQueFaltan > 0 && minutosQueFaltan < 120 && <span className="portal-cita__nota-corta">Faltan menos de 2 horas: ya no se puede cancelar</span>}
      </div>
    </li>
  );
}

// Nombre: Panel
// Descripción: Muestra el portal de la especialista.
// Entrada: Sus datos y opciones.
// Salida: El portal.
// Objetivo: Ver solo lo suyo.
function Panel({ d, onSalir, onRecargar }) {
  const [rejilla, CLIENTAS_POR_PAGINA] = usePorPagina(2, CLIENTAS_POR_PAGINA_BASE); // filas completas, sin huecos
  const [pestana, setPestana] = useState('citas');
  const [cancelando, setCancelando] = useState(null);
  const [sinLlegar, setSinLlegar] = useState(null);
  const [dia, setDia] = useState(d.hoy);
  const [paginaCitas, setPaginaCitas] = useState(1);
  const [paginaClientas, setPaginaClientas] = useState(1);
  const [buscar, setBuscar] = useState('');
  const p = d.perfil;
  const ausencias = useMemo(() => Object.fromEntries(d.ausencias.map((a) => [a.fecha, a])), [d]);
  const porDia = useMemo(() => d.proximas.reduce((m, c) => ({ ...m, [c.fecha]: [...(m[c.fecha] || []), c] }), {}), [d]);
  // Nombre: trabaja
  // Descripción: Revisa si trabaja ese día.
  // Entrada: La fecha.
  // Salida: Sí o no.
  // Objetivo: Mostrar su semana.
  const trabaja = (f) => p.dias.split(',').includes(String(new Date(`${f}T12:00:00`).getDay() || 7));
  const dias14 = Array.from({ length: 14 }, (_, i) => sumar(d.hoy, i));
  // La agenda muestra 14 días a la vez y se puede avanzar hasta 2 meses
  const [desde, setDesde] = useState(0);
  const diasVista = Array.from({ length: 14 }, (_, i) => sumar(d.hoy, desde + i));
  const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mesesVista = [...new Set([diasVista[0], diasVista[13]].map((f) => MESES_LARGOS[Number(f.slice(5, 7)) - 1]))].join(' – ');
  const deHoy = porDia[d.hoy] || [];
  const citasDia = porDia[dia] || [];
  const paginasCitas = Math.ceil(citasDia.length / CITAS_POR_PAGINA);
  const citasDiaPagina = citasDia.slice((paginaCitas - 1) * CITAS_POR_PAGINA, paginaCitas * CITAS_POR_PAGINA);
  useEffect(() => { if (paginaCitas > paginasCitas) setPaginaCitas(Math.max(paginasCitas, 1)); }, [paginaCitas, paginasCitas]);
  const semana = dias14.slice(0, 7).reduce((n, f) => n + (porDia[f]?.length || 0), 0);
  const q = d.quincena;
  const clientas = d.clientas.filter((c) => !buscar || `${c.nombre} ${c.telefono}`.toLowerCase().includes(buscar.toLowerCase()));
  const paginasClientas = Math.ceil(clientas.length / CLIENTAS_POR_PAGINA);
  const clientasPagina = clientas.slice((paginaClientas - 1) * CLIENTAS_POR_PAGINA, paginaClientas * CLIENTAS_POR_PAGINA);
  useEffect(() => { if (paginaClientas > paginasClientas) setPaginaClientas(Math.max(paginasClientas, 1)); }, [paginaClientas, paginasClientas]);
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  // Cuántos días de la quincena ya pasaron (para la barra de avance)
  const avance = { total: Math.max(1, faltan(q.hasta, q.desde) + 1), hechos: Math.min(Math.max(1, faltan(d.hoy, q.desde) + 1), faltan(q.hasta, q.desde) + 1) };

  return (
    <div className="portal">
      {cancelando && <CancelarCita c={cancelando} onCerrar={() => setCancelando(null)} onListo={onRecargar} />}
      {sinLlegar && <VentanaNoAsistio cita={sinLlegar} enviar={api.equipo.noAsistio} onCerrar={() => setSinLlegar(null)} onListo={onRecargar} />}
      <header className="portal-hero">
        <span className="portal-hero__foto">{p.foto ? <Foto archivo={p.foto} alt="" /> : <span aria-hidden="true">{p.nombre[0]}</span>}</span>
        <div className="portal-hero__texto">
          <p className="portal-hero__saludo">{saludo},</p>
          <h1>{p.nombre}</h1>
          <p className="portal-hero__chips">
            <span className="portal-chip portal-chip--lugar">
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
              {p.estacion || 'Estación por asignar'}
            </span>
            <span className="portal-chip">{p.especialidad}</span>
            <span className="portal-chip">{DIAS_SEMANA.filter(([k]) => p.dias.split(',').includes(k)).map(([, t]) => t).join(' · ')} · {p.hora_inicio}–{p.hora_fin}</span>
          </p>
        </div>
        <button type="button" className="portal-hero__salir" onClick={onSalir}>Salir</button>
      </header>

      <ul className="portal-cifras">
        <li style={{ '--n': 0 }}><span>Citas hoy</span><strong>{trabaja(d.hoy) && !ausencias[d.hoy] ? deHoy.length : '—'}</strong><small>{ausencias[d.hoy] ? TIPO[ausencias[d.hoy].tipo] : trabaja(d.hoy) ? fechaLarga(d.hoy) : 'Hoy no trabajas'}</small></li>
        <li style={{ '--n': 1 }}><span>Próximos 7 días</span><strong>{semana}</strong><small>citas agendadas</small></li>
        <li style={{ '--n': 2 }} className="portal-cifras--vino"><span>Llevas ganado</span><strong>{dinero(q.total)}</strong><small>esta quincena · {q.citas} citas atendidas</small></li>
        <li style={{ '--n': 3 }}><span>Día de pago</span><strong>{faltan(q.diaPago, d.hoy) <= 0 ? 'Hoy' : `${faltan(q.diaPago, d.hoy)} ${faltan(q.diaPago, d.hoy) === 1 ? 'día' : 'días'}`}</strong><small>{fechaLarga(q.diaPago)}</small></li>
      </ul>

      <nav className="portal-pestanas" aria-label="Secciones">
        {[['citas', 'Mis citas'], ['clientas', `Mis clientas (${d.clientas.length})`], ['pago', 'Mi pago'], ['libres', 'Días libres']].map(([k, t]) => (
          <button key={k} type="button" aria-current={pestana === k ? 'page' : undefined} onClick={() => setPestana(k)}>{t}</button>
        ))}
      </nav>

      {pestana === 'citas' && (
        <section aria-label="Mis citas">
          <div className="portal-agenda__cabeza">
            <div className="portal-agenda__mes">
              <button type="button" className="portal-agenda__flecha" onClick={() => setDesde((n) => Math.max(0, n - 7))} disabled={desde === 0} aria-label="Días anteriores">‹</button>
              <p><b>{mesesVista[0].toUpperCase() + mesesVista.slice(1)}</b><span>{fechaCorta(diasVista[0])} al {fechaCorta(diasVista[13])}</span></p>
              <button type="button" className="portal-agenda__flecha" onClick={() => setDesde((n) => Math.min(46, n + 7))} disabled={desde >= 46} aria-label="Días siguientes">›</button>
              {desde > 0 && <button type="button" className="portal-agenda__hoy" onClick={() => { setDesde(0); setDia(d.hoy); setPaginaCitas(1); }}>Hoy</button>}
            </div>
            <Link to={`/reservar?especialista=${p.id}`} className="boton portal-agenda__agendar">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4M12 13v4M10 15h4" /></svg>
              Agendar una cita
            </Link>
          </div>
          <ol className="portal-dias">
            {diasVista.map((f) => {
              const n = porDia[f]?.length || 0;
              const fuera = !trabaja(f) || ausencias[f];
              const dt = new Date(`${f}T12:00:00`);
              return (
                <li key={f}>
                  <button type="button" className={`portal-dia ${dia === f ? 'portal-dia--activo' : ''} ${fuera ? 'portal-dia--libre' : ''} ${f === d.hoy ? 'portal-dia--hoy' : ''}`} onClick={() => { setDia(f); setPaginaCitas(1); }} aria-pressed={dia === f}>
                    <span>{DIAS_CORTOS[dt.getDay()]}</span><strong>{dt.getDate()}</strong>
                    <small>{ausencias[f] ? TIPO[ausencias[f].tipo] : !trabaja(f) ? 'Libre' : n ? `${n} ${n === 1 ? 'cita' : 'citas'}` : 'Sin citas'}</small>
                  </button>
                </li>
              );
            })}
          </ol>
          <h2 id="portal-citas-fecha" className="portal-sub">{dia === d.hoy ? 'Hoy, ' : ''}{fechaLarga(dia)}</h2>
          {ausencias[dia] ? <p className="portal-vacio">Este día lo tienes como <b>{TIPO[ausencias[dia].tipo].toLowerCase()}</b>. Nadie puede reservar contigo.</p>
            : !trabaja(dia) ? <p className="portal-vacio">Este día no trabajas por horario. ¡A descansar!</p>
            : !citasDia.length ? <p className="portal-vacio">No tienes citas este día todavía.</p>
            : <ul className="portal-citas">{citasDiaPagina.map((c) => <TarjetaCita key={c.id} c={c} hoy={d.hoy} onCancelar={setCancelando} onNoAsistio={setSinLlegar} />)}</ul>}
          <VerMas pagina={paginaCitas} paginas={paginasCitas} onCambiar={(n) => { setPaginaCitas(n); document.getElementById('portal-citas-fecha')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} />
          {d.recientes.length > 0 && (
            <details className="portal-historial">
              <summary>Citas de los últimos 30 días ({d.recientes.length})</summary>
              <ul className="portal-citas portal-citas--compacta">{d.recientes.map((c) => <li key={c.id}><span>{fechaLarga(c.fecha)} · {hora12(c.hora)}</span><b>{c.cliente_nombre}</b><span>{c.servicio}</span><span className={`portal-cita__estado portal-cita__estado--${c.estado}`}>{ESTADO[c.estado]}</span></li>)}</ul>
            </details>
          )}
        </section>
      )}

      {pestana === 'clientas' && (
        <section aria-label="Mis clientas">
          <label id="portal-clientas-buscar" className="portal-buscar" style={{ scrollMarginTop: '64px' }}><span className="solo-lector">Buscar clienta</span><input type="search" value={buscar} onChange={(evento) => { setBuscar(evento.target.value); setPaginaClientas(1); }} placeholder="Buscar por nombre o teléfono" /></label>
          {clientas.length === 0 ? <p className="portal-vacio">Aquí aparecen las clientas que ya atendiste.</p> : (
            <>
              <ul ref={rejilla} className="portal-clientas">
                {clientasPagina.map((c, i) => (
                  <li key={c.telefono} style={{ '--n': i % CLIENTAS_POR_PAGINA }} className="clienta-tarjeta">
                    {c.visitas >= 3 && <span className="clienta-tarjeta__sello">Frecuente</span>}
                    <AvatarClienta nombre={c.nombre} foto={c.foto} tam={72} />
                    <p className="clienta-tarjeta__nombre">{c.nombre}</p>
                    <p className="clienta-tarjeta__servicio">{c.servicio}</p>
                    <dl className="clienta-tarjeta__datos">
                      <div><dt>Visitas</dt><dd>{c.visitas}</dd></div>
                      <div><dt>Última</dt><dd>{fechaCorta(c.ultima)}</dd></div>
                    </dl>
                    <a className="portal-cita__wa clienta-tarjeta__wa" href={wa(c.telefono, `Hola ${c.nombre.split(' ')[0]}, te escribe tu especialista de ${SALON.nombre}.`)} target="_blank" rel="noreferrer">WhatsApp<span className="solo-lector"> a {c.nombre}</span></a>
                  </li>
                ))}
              </ul>
              <VerMas pagina={paginaClientas} paginas={paginasClientas} onCambiar={(n) => { setPaginaClientas(n); document.getElementById('portal-clientas-buscar')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} />
            </>
          )}
          <p className="tenue portal-nota">La foto es la de su cuenta del sitio (por ejemplo, la de Google). Si no tiene, sale un dibujo que siempre es el mismo para esa clienta.</p>
        </section>
      )}

      {pestana === 'pago' && (
        <section aria-label="Mi pago" className="mi-pago">
          <article className="mi-pago__principal">
            <div className="mi-pago__ganado">
              <p className="mi-pago__etiqueta">Llevas ganado esta quincena</p>
              <p className="mi-pago__monto">{dinero(q.total)}</p>
              <p className="mi-pago__periodo">Del {fechaLarga(q.desde)} al {fechaLarga(q.hasta)}</p>
              <div className="mi-pago__avance" aria-label={`Día ${avance.hechos} de ${avance.total} de la quincena`}>
                <span style={{ width: `${(avance.hechos / avance.total) * 100}%` }} />
              </div>
              <p className="mi-pago__cuando">{faltan(q.diaPago, d.hoy) <= 0 ? <b>¡Hoy es día de pago!</b> : <>Se paga el <b>{fechaLarga(q.diaPago)}</b> · faltan {faltan(q.diaPago, d.hoy)} {faltan(q.diaPago, d.hoy) === 1 ? 'día' : 'días'}</>}</p>
            </div>
            <div className="mi-pago__cuenta">
              <p className="mi-pago__etiqueta">Así se calcula</p>
              <ol className="mi-pago__pasos">
                <li><span>Atendiste</span><b>{q.citas} {q.citas === 1 ? 'cita' : 'citas'}</b></li>
                <li><span>Les cobraste a las clientas</span><b>{dinero(q.vendido)}</b></li>
                {q.base > 0 && <li><span>Monto base</span><b>+ {dinero(q.base)}</b></li>}
                <li><span>Tu comisión ({p.comision} %)</span><b>+ {dinero(q.porComision)}</b></li>
                <li className="mi-pago__igual"><span>Te toca</span><b>{dinero(q.total)}</b></li>
              </ol>
              <p className="mi-pago__chips"><span><b>{q.diasProgramados}</b> días de trabajo</span><span><b>{q.diasTrabajados}</b> con citas</span><span><b>{q.ausencias}</b> ausencias</span></p>
            </div>
          </article>

          <div className="mi-pago__fila">
            <article className="mi-pago__caja">
              <h2>Quincena pasada</h2>
              <p className="tenue">Del {fechaLarga(d.anterior.desde)} al {fechaLarga(d.anterior.hasta)}</p>
              <p className="mi-pago__pasada"><b>{dinero(d.anterior.total)}</b>{d.anterior.pagado ? <span className="portal-pago__sello">✓ Pagado</span> : <span className="portal-pago__sello portal-pago__sello--pend">Por pagar</span>}</p>
              <p className="tenue">{d.anterior.citas} citas atendidas · cobraste {dinero(d.anterior.vendido)}</p>
            </article>
            <article className="mi-pago__caja">
              <h2>Pagos recibidos</h2>
              {d.pagos.length === 0 ? <p className="tenue">Todavía no hay pagos registrados.</p> : (
                <ul className="mi-pago__historial">
                  {d.pagos.map((x) => (
                    <li key={x.id}>
                      <span className="mi-pago__check" aria-hidden="true">✓</span>
                      <span><b>{fechaCorta(x.desde)} – {fechaCorta(x.hasta)}</b><small>{x.citas} citas</small></span>
                      <strong>{dinero(x.monto)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
          <p className="tenue portal-nota">Forma de pago: {p.esquema}. Si ves algo raro, habla con la administradora.</p>
        </section>
      )}

      {pestana === 'libres' && (
        <section aria-label="Días libres" className="portal-libres">
          <PedirLibre hoy={d.hoy} dias={p.dias} ausencias={d.ausencias} solicitudes={d.solicitudes} onListo={onRecargar} />
          <div className="portal-libres__lado">
            <article className="portal-pago__tarjeta">
              <h2>Mis solicitudes</h2>
              {d.solicitudes.length === 0 ? <p className="tenue">Todavía no has pedido días libres.</p> : (
                <ul className="solicitudes-lista">
                  {d.solicitudes.map((x) => (
                    <li key={x.id} className={`solicitud solicitud--${x.estado}`}>
                      <div>
                        <p className="solicitud__fechas">{x.desde === x.hasta ? fechaLarga(x.desde) : `${fechaCorta(x.desde)} al ${fechaCorta(x.hasta)}`}</p>
                        <p className="tenue">{TIPO[x.tipo] || x.tipo}{x.motivo ? ` · ${x.motivo}` : ''}</p>
                        {x.respuesta && <p className="solicitud__respuesta">«{x.respuesta}»</p>}
                      </div>
                      <div className="solicitud__lado">
                        <span className={`solicitud__estado solicitud__estado--${x.estado}`}>{{ pendiente: 'Esperando', aprobada: 'Aprobado', rechazada: 'No aprobado' }[x.estado]}</span>
                        {x.estado === 'pendiente' && <button type="button" className="enlace enlace--boton enlace--chico" onClick={() => api.equipo.quitarSolicitud(x.id).then(onRecargar).catch(() => {})}>Retirar</button>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
            <article className="portal-pago__tarjeta">
              <h2>Tu horario</h2>
              <ul className="horario-lista">
                {DIAS_SEMANA.map(([k, t]) => {
                  const si = p.dias.split(',').includes(k);
                  return <li key={k} className={si ? 'si' : ''}><b>{t}</b><span>{si ? `${p.hora_inicio} a ${p.hora_fin}` : 'Descansas'}</span></li>;
                })}
              </ul>
              <p className="horario-lugar">Te ubicas en <b>{p.estacion || 'una estación por asignar'}</b></p>
            </article>
          </div>
        </section>
      )}
    </div>
  );
}

// Nombre: PortalEquipo
// Descripción: Muestra el portal del equipo.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Que cada especialista vea lo suyo.
export default function PortalEquipo() {
  useTitulo('Acceso del equipo');
  const [datos, setDatos] = useState(null);
  const [estado, setEstado] = useState(sesionEquipo.obtener() ? 'cargando' : 'fuera');
  // Nombre: cargar
  // Descripción: Carga los datos.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Llenar el portal.
  const cargar = () => api.equipo.yo().then((respuesta) => { setDatos(respuesta); setEstado('dentro'); }).catch(() => { sesionEquipo.cerrar(); setEstado('fuera'); });
  useEffect(() => { if (estado === 'cargando') cargar(); }, []);
  // Nombre: salir
  // Descripción: Sale del portal.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Cerrar sesión.
  const salir = async () => { await api.equipo.salir(); sesionEquipo.cerrar(); setDatos(null); setEstado('fuera'); };

  return (
    <div className="contenedor pagina">
      {estado === 'fuera' && <Entrar onEntrar={() => { setEstado('cargando'); cargar(); }} />}
      {estado === 'cargando' && <p className="tenue portal-cargando">Cargando tu agenda…</p>}
      {estado === 'dentro' && datos && <Panel d={datos} onSalir={salir} onRecargar={cargar} />}
      {estado === 'fuera' && <p className="portal-volver"><Link to="/" className="enlace">← Volver a la página principal</Link></p>}
    </div>
  );
}
