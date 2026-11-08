import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useReserva } from '../context/ReservaContext.jsx';

const METODOS = [
  { id: 'tarjeta', texto: 'Tarjeta' },
  { id: 'paypal', texto: 'PayPal' },
  { id: 'salon', texto: 'Pagar en el salón' }
];

function Interruptor({ campo, titulo, detalle, rec, setRec }) {
  return (
    <div className="interruptor-fila">
      <div>
        <p className="interruptor-fila__titulo" id={`rec-${campo}`}>{titulo}</p>
        <p className="tenue">{detalle}</p>
      </div>
      <button type="button" role="switch" className="interruptor" aria-checked={rec[campo]} aria-labelledby={`rec-${campo}`}
              onClick={() => setRec((r) => ({ ...r, [campo]: !r[campo] }))}>
        <span className="interruptor__bola" />
      </button>
    </div>
  );
}

export default function Pago() {
  const { reserva, reiniciar } = useReserva();
  const [metodo, setMetodo] = useState('tarjeta');
  const [tarjeta, setTarjeta] = useState({ numero: '', vence: '', cvv: '' });
  const [rec, setRec] = useState({ h24: true, h2: true, sms: false });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [cita, setCita] = useState(null);

  if (!cita && (!reserva.servicio || !reserva.especialista || !reserva.hora)) return <Navigate to="/reservar" replace />;

  const total = Math.max(reserva.servicio?.precio ?? 0, reserva.diseno?.id ? reserva.diseno.precio : 0);
  const anticipo = metodo === 'salon' ? 0 : Math.round(total * 0.3 * 100) / 100;

  async function confirmar(e) {
    e.preventDefault();
    setEnviando(true); setError('');
    try {
      const nueva = await api.crearCita({
        servicioId: reserva.servicio.id, especialistaId: reserva.especialista.id,
        disenoId: reserva.diseno.id, fecha: reserva.fecha, hora: reserva.hora,
        metodoPago: metodo, tarjeta: metodo === 'tarjeta' ? tarjeta : undefined, recordatorios: rec
      });
      setCita(nueva);
      reiniciar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (cita) {
    return (
      <div className="pagina confirmacion" role="status">
        <h1>Cita confirmada</h1>
        <p>{cita.servicio} con {cita.especialista}, el {cita.fecha} a las {cita.hora}.</p>
        <p className="tenue">
          {cita.recordatorios.length
            ? `Te enviaremos ${cita.recordatorios.length} recordatorio${cita.recordatorios.length > 1 ? 's' : ''}.`
            : 'No activaste recordatorios.'}
        </p>
        <Link to="/tienda" className="boton">Ver productos de cuidado</Link>
        <Link to="/" className="enlace">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <form className="pagina pagina--con-barra" onSubmit={confirmar} noValidate>
      <header className="encabezado">
        <h1>Pago</h1>
        <p className="tenue">Paso 2 de 2</p>
      </header>

      <section className="caja" aria-labelledby="resumen-titulo">
        <h2 id="resumen-titulo">Resumen de tu cita</h2>
        <dl className="resumen">
          <dt>Servicio</dt><dd>{reserva.servicio.nombre}</dd>
          <dt>Especialista</dt><dd>{reserva.especialista.nombre}</dd>
          <dt>Fecha</dt><dd>{reserva.fecha}, {reserva.hora}</dd>
          <dt>Diseño</dt><dd>{reserva.diseno.id ? reserva.diseno.nombre : 'Lo decides en el salón'}</dd>
          <dt>Total</dt><dd>${total}</dd>
          <dt className="fuerte">Pagas hoy</dt><dd className="fuerte">${anticipo.toFixed(2)}</dd>
        </dl>
      </section>

      <fieldset className="grupo">
        <legend className="grupo__titulo">Método de pago</legend>
        <div className="lista-opciones">
          {METODOS.map((m) => (
            <label key={m.id} className="opcion-radio">
              <input type="radio" name="metodo" checked={metodo === m.id} onChange={() => setMetodo(m.id)} />
              <span className="opcion-radio__titulo">{m.texto}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {metodo === 'tarjeta' && (
        <div className="campos">
          <div className="campo">
            <label htmlFor="numero">Número de tarjeta</label>
            <input id="numero" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242"
                   value={tarjeta.numero} onChange={(e) => setTarjeta({ ...tarjeta, numero: e.target.value })} />
          </div>
          <div className="campos__fila">
            <div className="campo">
              <label htmlFor="vence">Vence</label>
              <input id="vence" autoComplete="cc-exp" placeholder="MM/AA"
                     value={tarjeta.vence} onChange={(e) => setTarjeta({ ...tarjeta, vence: e.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="cvv">CVV</label>
              <input id="cvv" inputMode="numeric" autoComplete="cc-csc" placeholder="123"
                     value={tarjeta.cvv} onChange={(e) => setTarjeta({ ...tarjeta, cvv: e.target.value })} />
            </div>
          </div>
          <p className="tenue">Pago de prueba: cualquier número de 16 dígitos funciona, y los que terminan en 0000 se rechazan.</p>
        </div>
      )}

      <section aria-labelledby="rec-titulo" className="grupo">
        <h2 id="rec-titulo" className="grupo__titulo">Recordatorios</h2>
        <Interruptor rec={rec} setRec={setRec} campo="h24" titulo="24 horas antes" detalle="Notificación en la app" />
        <Interruptor rec={rec} setRec={setRec} campo="h2" titulo="2 horas antes" detalle="Notificación en la app" />
        <Interruptor rec={rec} setRec={setRec} campo="sms" titulo="También por SMS" detalle="Al número de tu perfil" />
      </section>

      <div className="barra-accion">
        {error && <p role="alert" className="error">{error}</p>}
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? 'Confirmando…' : metodo === 'salon' ? 'Confirmar cita' : `Confirmar y pagar $${anticipo.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}
