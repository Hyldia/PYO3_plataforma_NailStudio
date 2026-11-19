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
const diasFaltan = (f) => Math.round((new Date(`${f}T12:00:00`) - new Date(`${isoLocal(new Date())}T12:00:00`)) / 86400000);
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
  const cargar = () => api.admin.nomina(periodo).then((respuesta) => { setDatos(respuesta); setError(''); }).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, [periodo]);

  const p = datos?.periodo;
  const totales = useMemo(() => (datos ? {
    pagar: datos.equipo.reduce((s, e) => s + e.total, 0),
    pagado: datos.equipo.filter((e) => e.pagado).reduce((s, e) => s + e.total, 0),
    vendido: datos.equipo.reduce((s, e) => s + e.vendido, 0),
    pendientes: datos.equipo.filter((e) => !e.pagado && e.total > 0).length,
    porMarcar: datos.equipo.reduce((s, e) => s + e.porMarcar, 0)
  } : null), [datos]);

  // Nombre: marcarAtendidas
  // Descripción: Marca citas pasadas como atendidas.
  // Entrada: La especialista o todas.
  // Salida: Nada.
  // Objetivo: Que cuenten para el pago.
  const marcarAtendidas = async (e = null) => {
    const n = e ? e.porMarcar : totales.porMarcar;
    if (!window.confirm(`¿Marcar como atendidas ${n} ${n === 1 ? 'cita' : 'citas'} de días que ya pasaron${e ? ` de ${e.nombre}` : ''}? Hazlo solo si de verdad se atendieron.`)) return;
    try { await api.admin.marcarAtendidas({ desde: p.desde, hasta: p.hasta, especialistaId: e?.id }); cargar(); } catch (error) { setError(error.message); }
  };

  // Nombre: pagar
  // Descripción: Marca un pago como hecho.
  // Entrada: La especialista.
  // Salida: Nada.
  // Objetivo: Registrar.
  const pagar = async (e) => {
    try { await api.admin.marcarPagado(e.id, { desde: p.desde, hasta: p.hasta }); cargar(); } catch (error) { setError(error.message); }
  };
  // Nombre: deshacer
  // Descripción: Deshace un pago.
  // Entrada: La especialista.
  // Salida: Nada.
  // Objetivo: Corregir.
  const deshacer = async (e) => {
    if (!window.confirm(`¿Quitar la marca de pagado a ${e.nombre}?`)) return;
    try { await api.admin.quitarPagado(e.id, { desde: p.desde, hasta: p.hasta }); cargar(); } catch (error) { setError(error.message); }
  };
  // Nombre: descargar
  // Descripción: Descarga la planilla.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Guardarla en Excel.
  const descargar = async () => { setBajando(true); try { await api.admin.descargarNomina({ desde: p.desde, hasta: p.hasta }); } catch (error) { setError(error.message); } setBajando(false); };
  const esActual = p && datos.actual.desde === p.desde && datos.actual.hasta === p.hasta;
  const esAnterior = p && datos.anterior.desde === p.desde && datos.anterior.hasta === p.hasta;
  const faltan = p ? diasFaltan(p.diaPago) : 0;

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
            <label className="filtros-admin__fecha"><span>Desde</span><input type="date" value={p.desde} onChange={(evento) => setPeriodo({ desde: evento.target.value, hasta: p.hasta })} /></label>
            <label className="filtros-admin__fecha"><span>Hasta</span><input type="date" value={p.hasta} onChange={(evento) => setPeriodo({ desde: p.desde, hasta: evento.target.value })} /></label>
          </div>

          <div className="nomina-resumen">
            <div className="nomina-resumen__pago">
              <span className="nomina-resumen__icono" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
              </span>
              <div>
                <p className="tenue">Día de pago</p>
                <p className="nomina-resumen__fecha">{fechaLarga(p.diaPago)}</p>
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
          <p className="tenue">Del {fechaLarga(p.desde)} al {fechaLarga(p.hasta)}. Solo cuentan las citas marcadas como <b>atendidas</b>.</p>
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
          {datos.equipo.map((e, i) => {
            const abiertaFila = abierta === e.id;
            return (
              <div key={e.id} className={`nomina-grupo ${e.pagado ? 'nomina-grupo--pagada' : ''} ${abiertaFila ? 'nomina-grupo--abierta' : ''}`} style={{ '--n': i }} role="rowgroup">
                <div className="nomina-fila" role="row">
                  <span role="cell" className="nomina-persona">
                    <span className="nomina-tarjeta__foto">{e.foto ? <Foto archivo={e.foto} alt="" /> : <span aria-hidden="true">{e.nombre[0]}</span>}</span>
                    <span><b>{e.nombre}</b><small>{e.estacion || 'Sin estación'} · {e.esquema_pago === 'base_comision' ? `Base + ${e.comision} %` : `${e.comision} % de comisión`}</small></span>
                  </span>
                  <span role="cell" className="nomina-num" data-titulo="Citas atendidas">{e.citas}{e.porMarcar > 0 && <small className="nomina-falta">+{e.porMarcar} sin marcar</small>}</span>
                  <span role="cell" className="nomina-num" data-titulo="Cobró a clientas">{dinero(e.vendido)}</span>
                  <span role="cell" className="nomina-num nomina-total" data-titulo="Se le paga">{dinero(e.total)}</span>
                  <span role="cell" className="nomina-estado">
                    {e.pagado
                      ? <span className="nomina-tarjeta__sello">✓ Pagado</span>
                      : <button type="button" className="boton boton--chico" disabled={e.total <= 0} onClick={() => pagar(e)}>Marcar pagado</button>}
                    <button type="button" className="nomina-ver" aria-expanded={abiertaFila} onClick={() => setAbierta(abiertaFila ? null : e.id)}>
                      {abiertaFila ? 'Cerrar' : 'Detalle'}
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                  </span>
                </div>
                {abiertaFila && (
                  <div className="nomina-detalle" role="row">
                    <div role="cell">
                      <p className="nomina-detalle__cuenta">
                        Atendió <b>{e.citas} {e.citas === 1 ? 'cita' : 'citas'}</b> y les cobró <b>{dinero(e.vendido)}</b> a las clientas.<br />
                        {e.base > 0 ? <>Se le paga la base de <b>{dinero(e.base)}</b> + el {e.comision} % de lo cobrado (<b>{dinero(e.porComision)}</b>) = <b>{dinero(e.total)}</b>.</>
                          : <>Se le paga el {e.comision} % de lo cobrado: <b>{dinero(e.total)}</b>.</>}
                      </p>
                      {e.porMarcar > 0 && (
                        <p className="nomina-tarjeta__falta">Tiene {e.porMarcar} {e.porMarcar === 1 ? 'cita de un día pasado que no se marcó' : 'citas de días pasados que no se marcaron'} como atendidas (no se pagan).
                          <button type="button" className="enlace enlace--boton enlace--chico" onClick={() => marcarAtendidas(e)}>Marcarlas atendidas</button></p>
                      )}
                      {e.pagado && <p className="tenue">Se marcó como pagado el {String(e.pagado.pagado_en).slice(0, 10)}. <button type="button" className="enlace enlace--boton enlace--chico" onClick={() => deshacer(e)}>Deshacer</button></p>}
                    </div>
                    <ul className="nomina-detalle__dias" role="cell">
                      <li><b>{e.diasProgramados}</b>días que le tocaba trabajar</li>
                      <li><b>{e.diasTrabajados}</b>días que tuvo citas</li>
                      <li><b>{e.diasLibres}</b>días libres por horario</li>
                      <li><b>{e.ausencias}</b>ausencias{e.detalleAusencias.length > 0 && <small>{e.detalleAusencias.map((a) => `${fechaLarga(a.fecha)} (${(TIPO[a.tipo] || a.tipo).toLowerCase()})`).join(', ')}</small>}</li>
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
          <div className="nomina-fila nomina-fila--total" role="row">
            <span role="cell"><b>Total del equipo</b></span>
            <span role="cell" className="nomina-num" data-titulo="Citas atendidas">{datos.equipo.reduce((s, e) => s + e.citas, 0)}</span>
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
