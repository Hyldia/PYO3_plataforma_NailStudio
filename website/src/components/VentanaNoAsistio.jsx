// Ventana "La clienta no llegó": la dueña (en el panel) o la especialista (en su portal) decide
// si la cita se REPROGRAMA (sin costo, con el mismo adelanto) o se COBRA (el adelanto, la mitad, el total u otro monto).
// Al terminar muestra el mensaje de WhatsApp listo para avisarle a la clienta.
import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import Modal from './Modal.jsx';
import { TarjetaMensaje } from '../pages/admin/piezasPanel.jsx';

// Nombre: mananaIso
// Descripción: Da la fecha de mañana en formato AAAA-MM-DD.
// Entrada: Nada.
// Salida: La fecha.
// Objetivo: Que la nueva cita no pueda ser en el pasado.
const mananaIso = () => { const fecha = new Date(); fecha.setDate(fecha.getDate() + 1); return fecha.toLocaleDateString('en-CA'); };
// Nombre: horaBonita
// Descripción: Escribe la hora en formato de 12 horas.
// Entrada: "14:30".
// Salida: "2:30 p. m.".
// Objetivo: Horas fáciles de leer.
const horaBonita = (hora) => { const [h, m] = hora.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`; };

// Nombre: VentanaNoAsistio
// Descripción: Pide la decisión para una cita a la que la clienta no llegó.
// Entrada: La cita, la función que guarda (enviar), y qué hacer al cerrar o al terminar.
// Salida: La ventana.
// Objetivo: Reprogramar o cobrar las citas perdidas.
export default function VentanaNoAsistio({ cita, enviar, onCerrar, onListo }) {
  const [decision, setDecision] = useState('reprogramar');
  const [nuevaFecha, setNuevaFecha] = useState(mananaIso());
  const [horasLibres, setHorasLibres] = useState([]);
  const [nuevaHora, setNuevaHora] = useState('');
  const [opcionCobro, setOpcionCobro] = useState(cita.anticipo > 0 ? 'adelanto' : 'mitad');
  const [otroMonto, setOtroMonto] = useState('');
  const [estado, setEstado] = useState({ enviando: false, error: '' });
  const [resultado, setResultado] = useState(null);

  // Al abrir, busca el primer día (en las próximas dos semanas) en que la especialista tiene horas libres
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const dia = new Date(); dia.setHours(12, 0, 0, 0);
      for (let intento = 0; intento < 14 && !cancelado; intento++) {
        dia.setDate(dia.getDate() + 1);
        const fechaIso = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}-${String(dia.getDate()).padStart(2, '0')}`;
        const horas = await api.disponibilidad(cita.especialista_id, fechaIso).catch(() => []);
        if (horas.some((hora) => hora.disponible)) { if (!cancelado) setNuevaFecha(fechaIso); return; }
      }
    })();
    return () => { cancelado = true; };
  }, [cita.especialista_id]);

  // Horas libres de la misma especialista para el día elegido
  useEffect(() => {
    if (decision !== 'reprogramar' || !nuevaFecha) return;
    api.disponibilidad(cita.especialista_id, nuevaFecha)
      .then((horas) => { const libres = horas.filter((hora) => hora.disponible).map((hora) => hora.hora); setHorasLibres(libres); setNuevaHora(libres[0] || ''); })
      .catch(() => setHorasLibres([]));
  }, [decision, nuevaFecha, cita.especialista_id]);

  const montos = { adelanto: cita.anticipo, mitad: Math.round(cita.total / 2), total: cita.total, otro: Number(otroMonto) || 0 };
  const opcionesCobro = [
    cita.anticipo > 0 && ['adelanto', `Solo el adelanto · ${dinero(cita.anticipo)}`],
    ['mitad', `La mitad · ${dinero(montos.mitad)}`],
    ['total', `El total · ${dinero(cita.total)}`],
    ['otro', 'Otro monto']
  ].filter(Boolean);

  // Nombre: guardar
  // Descripción: Manda la decisión al servidor.
  // Entrada: El evento del formulario.
  // Salida: Nada.
  // Objetivo: Registrar la cita perdida y preparar el mensaje.
  async function guardar(evento) {
    evento.preventDefault();
    if (decision === 'reprogramar' && !nuevaHora) return setEstado({ enviando: false, error: 'Elige un día con horas libres.' });
    setEstado({ enviando: true, error: '' });
    try {
      const datos = decision === 'reprogramar' ? { decision, fecha: nuevaFecha, hora: nuevaHora } : { decision, monto: montos[opcionCobro] };
      setResultado(await enviar(cita.id, datos));
      onListo?.();
    } catch (error) { setEstado({ enviando: false, error: error.message }); }
  }

  return (
    <Modal titulo={`${cita.cliente_nombre} no llegó a su cita`} onCerrar={onCerrar} ancho>
      {resultado ? (
        <div className="aviso-lista">
          <p className="aviso-ok">{resultado.nueva ? `Listo: la cita quedó para el ${resultado.nueva.fecha} a las ${horaBonita(resultado.nueva.hora)}.` : `Listo: se registró el cobro de ${dinero(resultado.cita.monto_cobrado)}.`} Avísale a la clienta:</p>
          <TarjetaMensaje mensaje={resultado.mensaje} nombre={cita.cliente_nombre} />
        </div>
      ) : (
        <form onSubmit={guardar} className="no-asistio">
          <p className="tenue">{cita.servicio} · {cita.hora} · {dinero(cita.total)}{cita.anticipo > 0 ? ` (pagó ${dinero(cita.anticipo)} de adelanto)` : ''}</p>
          <fieldset className="no-asistio__opciones">
            <legend>¿Qué hacemos con esta cita?</legend>
            <label className={decision === 'reprogramar' ? 'activa' : ''}>
              <input type="radio" name="decision" value="reprogramar" checked={decision === 'reprogramar'} onChange={() => setDecision('reprogramar')} />
              <strong>Reprogramar</strong><span>Se le da otra fecha, sin costo. Su adelanto se mantiene.</span>
            </label>
            <label className={decision === 'cobrar' ? 'activa' : ''}>
              <input type="radio" name="decision" value="cobrar" checked={decision === 'cobrar'} onChange={() => setDecision('cobrar')} />
              <strong>Cobrar</strong><span>Se cobra la cita perdida. Cuenta como ingreso del día.</span>
            </label>
          </fieldset>

          {decision === 'reprogramar' ? (
            <div className="no-asistio__campos">
              <label className="campo"><span>Nuevo día</span><input type="date" value={nuevaFecha} min={mananaIso()} onChange={(evento) => setNuevaFecha(evento.target.value)} required /></label>
              <label className="campo"><span>Hora</span>
                <select value={nuevaHora} onChange={(evento) => setNuevaHora(evento.target.value)} disabled={!horasLibres.length}>
                  {horasLibres.length ? horasLibres.map((hora) => <option key={hora} value={hora}>{horaBonita(hora)}</option>) : <option value="">Sin horas libres ese día</option>}
                </select>
              </label>
            </div>
          ) : (
            <div className="no-asistio__cobro" role="radiogroup" aria-label="Cuánto se cobra">
              {opcionesCobro.map(([clave, texto]) => (
                <button key={clave} type="button" role="radio" aria-checked={opcionCobro === clave} onClick={() => setOpcionCobro(clave)}>{texto}</button>
              ))}
              {opcionCobro === 'otro' && (
                <label className="campo"><span>Monto a cobrar (₡)</span><input type="number" min="0" max={cita.total} step="1" value={otroMonto} onChange={(evento) => setOtroMonto(evento.target.value)} required /></label>
              )}
            </div>
          )}
          {estado.error && <p className="error" role="alert">{estado.error}</p>}
          <div className="botones">
            <button type="submit" className="boton" disabled={estado.enviando}>{estado.enviando ? 'Guardando…' : decision === 'reprogramar' ? 'Reprogramar y preparar aviso' : 'Registrar cobro y preparar aviso'}</button>
            <button type="button" className="boton boton--borde" onClick={onCerrar}>Volver</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
