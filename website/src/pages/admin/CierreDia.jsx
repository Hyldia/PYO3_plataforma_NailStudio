// PÁGINA DEL PANEL: "Cierre del día".
// Al final de cada día la dueña ve cuánto entró, cuánto se le paga al equipo, la ganancia del salón,
// lo que se perdió (citas canceladas o que no llegaron) y la lista de citas perdidas.
// Se puede imprimir o mandar por WhatsApp. Los números los calcula el servidor (ReporteModel.cierreDelDia).
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero, enlaceWhatsApp } from '../../config.js';
import { isoLocal, fechaLarga } from './piezasPanel.jsx';

// Nombre: horaBonita
// Descripción: Escribe la hora en formato de 12 horas.
// Entrada: La hora "HH:MM".
// Salida: El texto (por ejemplo "2:30 p. m.").
// Objetivo: Que la hora se lea fácil.
const horaBonita = (hora) => {
  const [horas, minutos] = hora.split(':').map(Number);
  return `${horas % 12 || 12}:${String(minutos).padStart(2, '0')} ${horas < 12 ? 'a. m.' : 'p. m.'}`;
};

// Nombre: textoPerdida
// Descripción: Explica qué pasó con una cita perdida.
// Entrada: La cita perdida.
// Salida: El texto.
// Objetivo: Que la dueña entienda cada pérdida de un vistazo.
const textoPerdida = (cita) => {
  if (cita.estado === 'cancelada') return `Cancelada${cita.motivo ? ` · ${cita.motivo}` : ''}`;
  if (cita.decision === 'cobrada') return `No llegó · se cobró ${dinero(cita.cobrado)}`;
  return `No llegó · reprogramada${cita.reprogramadaA ? ` (cita #${cita.reprogramadaA})` : ''}`;
};

// Nombre: CierreDia
// Descripción: Muestra el reporte de fin de día.
// Entrada: Nada.
// Salida: La sección del panel.
// Objetivo: Saber cada día las ganancias, las pérdidas y las citas perdidas.
export default function CierreDia() {
  const hoy = isoLocal(new Date());
  const [fecha, setFecha] = useState(hoy);
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setReporte(null);
    api.admin.cierreDelDia(fecha).then((datos) => { setReporte(datos); setError(''); }).catch((e) => setError(e.message));
  }, [fecha]);

  // Nombre: moverDia
  // Descripción: Pasa al día anterior o al siguiente.
  // Entrada: -1 o +1.
  // Salida: Nada.
  // Objetivo: Revisar cierres de otros días.
  const moverDia = (paso) => { const dia = new Date(`${fecha}T12:00:00`); dia.setDate(dia.getDate() + paso); setFecha(isoLocal(dia)); };

  const totales = reporte?.totales;
  // Las citas de hoy que todavía no llegan a su hora no cuentan como "sin marcar"
  const horaActual = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
  const pendientes = reporte?.sinMarcar || [];
  const porAtenderHoy = fecha === hoy ? pendientes.filter((cita) => cita.hora > horaActual).length : 0;
  const sinMarcarPasadas = pendientes.length - porAtenderHoy;
  const mensajeWhatsApp = totales && [
    `Cierre del día · ${fechaLarga(fecha)}`,
    `Ingresos: ${dinero(totales.ingresos)} (citas ${dinero(totales.ingresosCitas)} · tienda ${dinero(totales.ingresosTienda)})`,
    `Pago al equipo: ${dinero(totales.pagoEquipo)}`,
    `Ganancia del salón: ${dinero(totales.gananciaSalon)}`,
    `Pérdidas: ${dinero(totales.perdidas)}`,
    `Citas: ${totales.atendidas} atendidas · ${totales.canceladas} canceladas · ${totales.noLlegaron} no llegaron (${totales.cobradas} cobradas, ${totales.reprogramadas} reprogramadas)`
  ].join('\n');

  return (
    <section aria-labelledby="t-cierre" className="seccion-admin cierre">
      <div className="admin__cabeza">
        <div>
          <h2 id="t-cierre">Cierre del día</h2>
          <p className="tenue">Ganancias, pérdidas y citas perdidas de un día. Revísalo al cerrar el salón.</p>
        </div>
        {totales && (
          <div className="cierre__acciones">
            <button type="button" className="boton boton--borde boton--chico" onClick={() => window.print()}>Imprimir</button>
            <a className="boton boton--chico" href={enlaceWhatsApp(mensajeWhatsApp)} target="_blank" rel="noreferrer">Enviar por WhatsApp</a>
          </div>
        )}
      </div>

      <div className="cierre__dia" role="group" aria-label="Elegir día">
        <button type="button" className="cierre__flecha" onClick={() => moverDia(-1)} aria-label="Día anterior">‹</button>
        <label><span className="solo-lector">Fecha</span><input type="date" value={fecha} max={hoy} onChange={(evento) => evento.target.value && setFecha(evento.target.value)} /></label>
        <button type="button" className="cierre__flecha" onClick={() => moverDia(1)} disabled={fecha >= hoy} aria-label="Día siguiente">›</button>
        <strong>{fecha === hoy ? `Hoy, ${fechaLarga(fecha)}` : fechaLarga(fecha).replace(/^./, (letra) => letra.toUpperCase())}</strong>
      </div>

      {error && <p role="alert" className="error">{error}</p>}
      {!reporte && !error && <p className="tenue">Calculando el cierre…</p>}

      {totales && (
        <>
          {sinMarcarPasadas > 0 && (
            <p className="aviso-alerta">
              Hay <strong>{sinMarcarPasadas}</strong> {sinMarcarPasadas === 1 ? 'cita que ya pasó y está sin marcar' : 'citas que ya pasaron y están sin marcar'}. En la Agenda márcalas como «Atendida» o «No llegó» para que el cierre quede completo.
            </p>
          )}
          {porAtenderHoy > 0 && <p className="tenue cierre__nota">Todavía quedan {porAtenderHoy} {porAtenderHoy === 1 ? 'cita por atender' : 'citas por atender'} hoy; el cierre se completa al final del día.</p>}

          <ul className="cierre__cifras">
            <li className="cierre__cifra cierre__cifra--ingreso"><span>Ingresos</span><strong>{dinero(totales.ingresos)}</strong><small>Citas {dinero(totales.ingresosCitas)} · Tienda {dinero(totales.ingresosTienda)}</small></li>
            <li className="cierre__cifra"><span>Pago al equipo</span><strong>{dinero(totales.pagoEquipo)}</strong><small>Su comisión de lo que atendieron</small></li>
            <li className="cierre__cifra cierre__cifra--ganancia"><span>Ganancia del salón</span><strong>{dinero(totales.gananciaSalon)}</strong><small>Ingresos menos pago al equipo</small></li>
            <li className="cierre__cifra cierre__cifra--perdida"><span>Pérdidas</span><strong>{dinero(totales.perdidas)}</strong><small>Canceladas {dinero(totales.perdidoCanceladas)} · No llegaron {dinero(totales.perdidoNoLlegaron)}</small></li>
          </ul>

          <ul className="cierre__conteo">
            <li><strong>{totales.citas}</strong><span>Citas del día</span></li>
            <li><strong>{totales.atendidas}</strong><span>Atendidas</span></li>
            <li><strong>{totales.canceladas}</strong><span>Canceladas</span></li>
            <li><strong>{totales.noLlegaron}</strong><span>No llegaron</span></li>
            <li><strong>{totales.pedidos}</strong><span>Pedidos de la tienda</span></li>
          </ul>

          <div className="cierre__dos">
            <section className="cierre__caja" aria-labelledby="t-cierre-equipo">
              <h3 id="t-cierre-equipo">Por especialista</h3>
              {reporte.porEspecialista.length ? (
                <table className="cierre__tabla">
                  <thead><tr><th scope="col">Especialista</th><th scope="col">Atendidas</th><th scope="col">Perdidas</th><th scope="col">Entró</th><th scope="col">Su pago</th><th scope="col">Salón</th></tr></thead>
                  <tbody>
                    {reporte.porEspecialista.map((fila) => (
                      <tr key={fila.id}>
                        <th scope="row">{fila.nombre} <small>{fila.comision} %</small></th>
                        <td>{fila.atendidas}</td><td>{fila.perdidas}</td><td>{dinero(fila.ingresos)}</td><td>{dinero(fila.pago)}</td><td>{dinero(fila.salon)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="tenue">No hubo citas este día.</p>}
            </section>

            <section className="cierre__caja" aria-labelledby="t-cierre-perdidas">
              <h3 id="t-cierre-perdidas">Citas perdidas</h3>
              {reporte.citasPerdidas.length ? (
                <ul className="cierre__perdidas">
                  {reporte.citasPerdidas.map((cita) => (
                    <li key={cita.id} className={`cierre__perdida cierre__perdida--${cita.estado}`}>
                      <span className="cierre__hora">{horaBonita(cita.hora)}</span>
                      <div>
                        <strong>{cita.cliente}</strong> · {cita.servicio} con {cita.especialista}
                        <small>{textoPerdida(cita)}</small>
                      </div>
                      <span className="cierre__valor">{dinero(cita.valor)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="tenue">Ninguna cita perdida. ¡Buen día!</p>}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
