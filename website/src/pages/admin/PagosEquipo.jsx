// Pagos al equipo por quincena: cuánto se le paga a cada especialista, sus días trabajados y libres,
// marcar como pagado y descargar en Excel. El cálculo usa el patrón Strategy (patrones/estrategiaComision.js en la API).
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero } from '../../config.js';
import Foto from '../../components/Foto.jsx';
import { fechaLarga, isoLocal } from './piezasPanel.jsx';

// Nombre: diasFaltan
// Descripción: Cuenta cuántos días faltan.
// Entrada: La fecha.
// Salida: Los días.
// Objetivo: Avisar el próximo pago.
const diasFaltan = (fecha) => Math.round((new Date(`${fecha}T12:00:00`) - new Date(`${isoLocal(new Date())}T12:00:00`)) / 86400000);
const TIPO = { libre: 'Día libre', vacaciones: 'Vacaciones', incapacidad: 'Incapacidad', permiso: 'Permiso' };

// Nombre: PagosEquipo
// Descripción: Muestra los pagos del equipo.
// Entrada: Nada.
// Salida: La sección.
// Objetivo: Hacer la planilla.
export default function PagosEquipo() {
  const [datos, setDatos] = useState(null);
  const [periodo, setPeriodo] = useState({});
  const [error, setError] = useState('');
  const [bajando, setBajando] = useState(false);
  const [abierta, setAbierta] = useState(null);

  // Nombre: cargar
  // Descripción: Carga los pagos.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrar la tabla.
  const cargar = () => api.admin.nomina(periodo).then((respuesta) => { setDatos(respuesta); setError(''); }).catch((fallo) => setError(fallo.message));
  useEffect(() => { cargar(); }, [periodo]);

  const periodoActual = datos?.periodo;
  const totales = useMemo(() => (datos ? {
    pagar: datos.equipo.reduce((suma, especialista) => suma + especialista.total, 0),
    pagado: datos.equipo.filter((especialista) => especialista.pagado).reduce((suma, especialista) => suma + especialista.total, 0),
    vendido: datos.equipo.reduce((suma, especialista) => suma + especialista.vendido, 0),
    pendientes: datos.equipo.filter((especialista) => !especialista.pagado && especialista.total > 0).length,
    porMarcar: datos.equipo.reduce((suma, especialista) => suma + especialista.porMarcar, 0)
  } : null), [datos]);

  // Nombre: marcarAtendidas
  // Descripción: Marca citas pasadas como atendidas.
  // Entrada: La especialista o todas.
  // Salida: Nada.
  // Objetivo: Que cuenten para el pago.
  const marcarAtendidas = async (e = null) => {
    const porMarcar = e ? e.porMarcar : totales.porMarcar;
    if (!window.confirm(`¿Marcar como atendidas ${porMarcar} ${porMarcar === 1 ? 'cita' : 'citas'} de días que ya pasaron${e ? ` de ${e.nombre}` : ''}? Hazlo solo si de verdad se atendieron.`)) return;
    try { await api.admin.marcarAtendidas({ desde: periodoActual.desde, hasta: periodoActual.hasta, especialistaId: e?.id }); cargar(); } catch (error) { setError(error.message); }
  };

  // Nombre: pagar
  // Descripción: Marca un pago como hecho.
  // Entrada: La especialista.
  // Salida: Nada.
  // Objetivo: Registrar.
  const pagar = async (especialista) => {
    try { await api.admin.marcarPagado(especialista.id, { desde: periodoActual.desde, hasta: periodoActual.hasta }); cargar(); } catch (error) { setError(error.message); }
  };
  // Nombre: deshacer
  // Descripción: Deshace un pago.
  // Entrada: La especialista.
  // Salida: Nada.
  // Objetivo: Corregir.
  const deshacer = async (especialista) => {
    if (!window.confirm(`¿Quitar la marca de pagado a ${especialista.nombre}?`)) return;
    try { await api.admin.quitarPagado(especialista.id, { desde: periodoActual.desde, hasta: periodoActual.hasta }); cargar(); } catch (error) { setError(error.message); }
  };
  // Nombre: descargar
  // Descripción: Descarga la planilla.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Guardarla en Excel.
  const descargar = async () => { setBajando(true); try { await api.admin.descargarNomina({ desde: periodoActual.desde, hasta: periodoActual.hasta }); } catch (error) { setError(error.message); } setBajando(false); };
  const esActual = periodoActual && datos.actual.desde === periodoActual.desde && datos.actual.hasta === periodoActual.hasta;
  const esAnterior = periodoActual && datos.anterior.desde === periodoActual.desde && datos.anterior.hasta === periodoActual.hasta;
  const faltan = periodoActual ? diasFaltan(periodoActual.diaPago) : 0;

  return (
    <section aria-labelledby="t-nom" className="seccion-admin">
      <div className="admin__cabeza">
        <div><h2 id="t-nom">Pagos al equipo</h2><p className="tenue">Se paga cada quincena: el día 15 y el último día del mes (si cae domingo, el sábado antes).</p></div>
        <button type="button" className="boton boton--excel" onClick={descargar} disabled={bajando || !datos?.equipo.length}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M9 13l4 5M13 13l-4 5" /></svg>
          {bajando ? 'Generando…' : 'Descargar Excel'}
        </button>
      </div>

      {datos && (
        <>
          <div className="filtros-admin nomina-periodo">
            <div className="barra-chips barra-chips--compacta" role="group" aria-label="Quincena">
              <button type="button" className={`chip-filtro ${esActual ? 'chip-filtro--activo' : ''}`} onClick={() => setPeriodo({ desde: datos.actual.desde, hasta: datos.actual.hasta })}>Esta quincena</button>
              <button type="button" className={`chip-filtro ${esAnterior ? 'chip-filtro--activo' : ''}`} onClick={() => setPeriodo({ desde: datos.anterior.desde, hasta: datos.anterior.hasta })}>Quincena pasada</button>
            </div>
            <label className="filtros-admin__fecha"><span>Desde</span><input type="date" value={periodoActual.desde} onChange={(evento) => setPeriodo({ desde: evento.target.value, hasta: periodoActual.hasta })} /></label>
            <label className="filtros-admin__fecha"><span>Hasta</span><input type="date" value={periodoActual.hasta} onChange={(evento) => setPeriodo({ desde: periodoActual.desde, hasta: evento.target.value })} /></label>
          </div>

          <div className="nomina-resumen">
            <div className="nomina-resumen__pago">
              <span className="nomina-resumen__icono" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
              </span>
              <div>
                <p className="tenue">Día de pago</p>
                <p className="nomina-resumen__fecha">{fechaLarga(periodoActual.diaPago)}</p>
                <p className={`nomina-resumen__faltan ${faltan < 0 ? 'nomina-resumen__faltan--paso' : faltan <= 2 ? 'nomina-resumen__faltan--pronto' : ''}`}>
                  {faltan > 1 ? `Faltan ${faltan} días` : faltan === 1 ? 'Es mañana' : faltan === 0 ? 'Es hoy' : 'Ya pasó'}
                </p>
              </div>
            </div>
            <ul className="cifras-admin">
              <li><strong>{dinero(totales.pagar)}</strong>total a pagar</li>
              <li className="cifras-admin--verde"><strong>{dinero(totales.pagado)}</strong>ya pagado</li>
              <li className="cifras-admin--ambar"><strong>{totales.pendientes}</strong>por pagar</li>
              <li><strong>{dinero(totales.vendido)}</strong>vendido por el equipo</li>
            </ul>
          </div>
          <p className="tenue">Del {fechaLarga(periodoActual.desde)} al {fechaLarga(periodoActual.hasta)}. Solo cuentan las citas marcadas como <b>atendidas</b>.</p>
          {totales.porMarcar > 0 && (
            <div className="nomina-aviso" role="status">
              <span className="nomina-aviso__icono" aria-hidden="true">!</span>
              <div>
                <p><b>¿Por qué sale menos o ₡0?</b> Hay <b>{totales.porMarcar} citas</b> de días que ya pasaron que nadie marcó como atendidas. Las citas sin marcar no se pagan.</p>
                <p className="tenue">Se marcan una por una en <b>Agenda → «Marcar atendida»</b>, o todas de una vez con este botón.</p>
              </div>
              <button type="button" className="boton boton--chico" onClick={() => marcarAtendidas()}>Marcar todas como atendidas</button>
            </div>
          )}
          {totales.porMarcar === 0 && totales.pagar === 0 && (
            <div className="nomina-aviso nomina-aviso--info" role="status">
              <span className="nomina-aviso__icono" aria-hidden="true">i</span>
              <p><b>¿Por qué sale ₡0?</b> Todavía no hay citas atendidas en esta quincena. El total va subiendo cada vez que en <b>Agenda</b> tocas «Marcar atendida».</p>
            </div>
          )}
        </>
      )}
      {error && <p role="alert" className="error">{error}</p>}

      {datos && (
        <div className="nomina-tabla" role="table" aria-label="Pago de cada especialista">
          <div className="nomina-fila nomina-fila--cabeza" role="row">
            <span role="columnheader">Especialista</span>
            <span role="columnheader" className="nomina-num">Citas atendidas</span>
            <span role="columnheader" className="nomina-num">Cobró a clientas</span>
            <span role="columnheader" className="nomina-num">Se le paga</span>
            <span role="columnheader">Estado</span>
          </div>
          {datos.equipo.map((especialista, i) => {
            const abiertaFila = abierta === especialista.id;
            return (
              <div key={especialista.id} className={`nomina-grupo ${especialista.pagado ? 'nomina-grupo--pagada' : ''} ${abiertaFila ? 'nomina-grupo--abierta' : ''}`} style={{ '--n': i }} role="rowgroup">
                <div className="nomina-fila" role="row">
                  <span role="cell" className="nomina-persona">
                    <span className="nomina-tarjeta__foto">{especialista.foto ? <Foto archivo={especialista.foto} alt="" /> : <span aria-hidden="true">{especialista.nombre[0]}</span>}</span>
                    <span><b>{especialista.nombre}</b><small>{especialista.estacion || 'Sin estación'} · {especialista.esquema_pago === 'base_comision' ? `Base + ${especialista.comision} %` : `${especialista.comision} % de comisión`}</small></span>
                  </span>
                  <span role="cell" className="nomina-num" data-titulo="Citas atendidas">{especialista.citas}{especialista.porMarcar > 0 && <small className="nomina-falta">+{especialista.porMarcar} sin marcar</small>}</span>
                  <span role="cell" className="nomina-num" data-titulo="Cobró a clientas">{dinero(especialista.vendido)}</span>
                  <span role="cell" className="nomina-num nomina-total" data-titulo="Se le paga">{dinero(especialista.total)}</span>
                  <span role="cell" className="nomina-estado">
                    {especialista.pagado
                      ? <span className="nomina-tarjeta__sello">✓ Pagado</span>
                      : <button type="button" className="boton boton--chico" disabled={especialista.total <= 0} onClick={() => pagar(especialista)}>Marcar pagado</button>}
                    <button type="button" className="nomina-ver" aria-expanded={abiertaFila} onClick={() => setAbierta(abiertaFila ? null : especialista.id)}>
                      {abiertaFila ? 'Cerrar' : 'Detalle'}
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                  </span>
                </div>
                {abiertaFila && (
                  <div className="nomina-detalle" role="row">
                    <div role="cell">
                      <p className="nomina-detalle__cuenta">
                        Atendió <b>{especialista.citas} {especialista.citas === 1 ? 'cita' : 'citas'}</b> y les cobró <b>{dinero(especialista.vendido)}</b> a las clientas.<br />
                        {especialista.base > 0 ? <>Se le paga la base de <b>{dinero(especialista.base)}</b> + el {especialista.comision} % de lo cobrado (<b>{dinero(especialista.porComision)}</b>) = <b>{dinero(especialista.total)}</b>.</>
                          : <>Se le paga el {especialista.comision} % de lo cobrado: <b>{dinero(especialista.total)}</b>.</>}
                      </p>
                      {especialista.porMarcar > 0 && (
                        <p className="nomina-tarjeta__falta">Tiene {especialista.porMarcar} {especialista.porMarcar === 1 ? 'cita de un día pasado que no se marcó' : 'citas de días pasados que no se marcaron'} como atendidas (no se pagan).
                          <button type="button" className="enlace enlace--boton enlace--chico" onClick={() => marcarAtendidas(especialista)}>Marcarlas atendidas</button></p>
                      )}
                      {especialista.pagado && <p className="tenue">Se marcó como pagado el {String(especialista.pagado.pagado_en).slice(0, 10)}. <button type="button" className="enlace enlace--boton enlace--chico" onClick={() => deshacer(especialista)}>Deshacer</button></p>}
                    </div>
                    <ul className="nomina-detalle__dias" role="cell">
                      <li><b>{especialista.diasProgramados}</b>días que le tocaba trabajar</li>
                      <li><b>{especialista.diasTrabajados}</b>días que tuvo citas</li>
                      <li><b>{especialista.diasLibres}</b>días libres por horario</li>
                      <li><b>{especialista.ausencias}</b>ausencias{especialista.detalleAusencias.length > 0 && <small>{especialista.detalleAusencias.map((ausencia) => `${fechaLarga(ausencia.fecha)} (${(TIPO[ausencia.tipo] || ausencia.tipo).toLowerCase()})`).join(', ')}</small>}</li>
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
          <div className="nomina-fila nomina-fila--total" role="row">
            <span role="cell"><b>Total del equipo</b></span>
            <span role="cell" className="nomina-num" data-titulo="Citas atendidas">{datos.equipo.reduce((suma, especialista) => suma + especialista.citas, 0)}</span>
            <span role="cell" className="nomina-num" data-titulo="Cobró a clientas">{dinero(totales.vendido)}</span>
            <span role="cell" className="nomina-num nomina-total" data-titulo="Se le paga">{dinero(totales.pagar)}</span>
            <span role="cell" />
          </div>
        </div>
      )}

      <details className="nomina-ayuda">
        <summary>¿Cómo se calcula el pago?</summary>
        <p><b>Comisión:</b> se le paga un porcentaje de lo que cobró en sus citas atendidas. Ej.: vendió ₡100 000 con 40 % → ₡40 000.</p>
        <p><b>Base + comisión:</b> un monto fijo por quincena más el porcentaje. Ej.: ₡60 000 + 20 % de ₡100 000 → ₡80 000.</p>
        <p>La forma de pago, el porcentaje, la estación y los días libres de cada una se cambian en <b>Equipo</b> → «Pago, días libres y acceso».</p>
      </details>
    </section>
  );
}
