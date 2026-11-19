// Gráficas del salón: ventas, citas, equipo, servicios y productos. Cada gráfica se descarga como imagen o Excel.
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero } from '../../config.js';
import GraficoBarras, { colorSerie } from '../../components/GraficoBarras.jsx';
import { isoLocal, fechaLarga } from './piezasPanel.jsx';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
const ESTADOS = { pendiente: 'Por confirmar', confirmada: 'Confirmadas', completada: 'Atendidas', cancelada: 'Canceladas', no_asistio: 'No llegaron' };
// Colores de estado: verde = bien, ámbar = falta algo, rojo = se perdió (siempre con su nombre al lado)
const COLOR_ESTADO = { completada: 'var(--estado-bien)', confirmada: 'var(--serie-2)', pendiente: 'var(--estado-aviso)', cancelada: 'var(--estado-mal)', no_asistio: 'var(--estado-serio)' };
const SERIES_VENTAS = [{ clave: 'servicios', nombre: 'Servicios del salón', color: colorSerie(1) }, { clave: 'tienda', nombre: 'Tienda', color: colorSerie(2) }];

// Nombre: periodo
// Descripción: Calcula fechas rápidas del reporte.
// Entrada: El tipo.
// Salida: Desde y hasta.
// Objetivo: Filtrar rápido.
function periodo(tipo) {
  const hoy = new Date();
  const hasta = isoLocal(hoy);
  const fecha = new Date(hoy);
  if (tipo === '7') { fecha.setDate(fecha.getDate() - 6); return { desde: isoLocal(fecha), hasta }; }
  if (tipo === '30') { fecha.setDate(fecha.getDate() - 29); return { desde: isoLocal(fecha), hasta }; }
  if (tipo === 'mes') return { desde: `${hasta.slice(0, 7)}-01`, hasta };
  if (tipo === 'pasado') { const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1); const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0); return { desde: isoLocal(ini), hasta: isoLocal(fin) }; }
  if (tipo === 'anio') return { desde: `${hoy.getFullYear()}-01-01`, hasta };
  return null;
}
const RAPIDOS = [['7', 'Últimos 7 días'], ['30', 'Últimos 30 días'], ['mes', 'Este mes'], ['pasado', 'Mes pasado'], ['anio', 'Este año']];

// Nombre: ReportesAdmin
// Descripción: Muestra los reportes con gráficos.
// Entrada: Nada.
// Salida: La sección.
// Objetivo: Ver cómo va el salón.
export default function ReportesAdmin() {
  const [rapido, setRapido] = useState('30');
  const [rango, setRango] = useState(periodo('30'));
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.admin.reportes(rango).then((respuesta) => { setReporte(respuesta); setError(''); }).catch((fallo) => setError(fallo.message)); }, [rango]);
  // Nombre: elegir
  // Descripción: Elige un periodo rápido.
  // Entrada: El tipo.
  // Salida: Nada.
  // Objetivo: Cambiar el reporte.
  const elegir = (texto) => { setRapido(texto); setRango(periodo(texto)); };
  // Nombre: cambiarFecha
  // Descripción: Cambia una fecha del reporte.
  // Entrada: El campo.
  // Salida: Una función para el campo.
  // Objetivo: Elegir fechas.
  const cambiarFecha = (campo) => (evento) => { setRapido(''); setRango({ ...rango, [campo]: evento.target.value }); };

  // Si son más de 2 meses, la gráfica de ventas se agrupa por mes
  const ventas = useMemo(() => {
    if (!reporte) return { datos: [], porMes: false };
    if (reporte.porDia.length <= 62) {
      return { porMes: false, datos: reporte.porDia.map((diaReporte) => ({ etiqueta: diaReporte.dia, etiquetaLarga: fechaLarga(diaReporte.dia), valor: diaReporte.total, partes: { servicios: diaReporte.servicios, tienda: diaReporte.tienda }, detalle: `${diaReporte.citas} citas · ${diaReporte.pedidos} pedidos` })) };
    }
    const meses = new Map();
    reporte.porDia.forEach((diaReporte) => {
      const claveMes = diaReporte.dia.slice(0, 7);
      const resumenMes = meses.get(claveMes) || { total: 0, servicios: 0, tienda: 0, citas: 0 };
      meses.set(claveMes, { total: resumenMes.total + diaReporte.total, servicios: resumenMes.servicios + diaReporte.servicios, tienda: resumenMes.tienda + diaReporte.tienda, citas: resumenMes.citas + diaReporte.citas });
    });
    return { porMes: true, datos: [...meses].map(([claveMes, resumen]) => ({ etiqueta: claveMes, etiquetaLarga: `${MESES_LARGOS[Number(claveMes.slice(5)) - 1]} ${claveMes.slice(0, 4)}`, valor: resumen.total, partes: { servicios: resumen.servicios, tienda: resumen.tienda }, detalle: `${resumen.citas} citas` })) };
  }, [reporte]);

  const totales = reporte?.totales;
  // Nombre: archivo
  // Descripción: Arma el nombre del archivo.
  // Entrada: El nombre.
  // Salida: El texto.
  // Objetivo: Descargas ordenadas.
  const archivo = (nombre) => `${nombre}-${rango.desde}-al-${rango.hasta}`;

  return (
    <section aria-labelledby="t-rep" className="seccion-admin">
      <div className="admin__cabeza">
        <div><h2 id="t-rep">Gráficas del salón</h2><p className="tenue">Toca una barra para ver el número. Cada gráfica se descarga como imagen o para Excel.</p></div>
      </div>

      <div className="filtros-admin filtros-admin--pedidos">
        <div className="barra-chips barra-chips--compacta" role="group" aria-label="Periodo">
          {RAPIDOS.map(([k, txt]) => <button key={k} type="button" className={`chip-filtro ${rapido === k ? 'chip-filtro--activo' : ''}`} onClick={() => elegir(k)}>{txt}</button>)}
        </div>
        <label className="filtros-admin__fecha"><span>Desde</span><input type="date" value={rango.desde} max={rango.hasta} onChange={cambiarFecha('desde')} /></label>
        <label className="filtros-admin__fecha"><span>Hasta</span><input type="date" value={rango.hasta} min={rango.desde} onChange={cambiarFecha('hasta')} /></label>
      </div>
      {error && <p role="alert" className="error">{error}</p>}

      {totales && (
        <>
          <ul className="cifras-graficas">
            <li className="cifras-graficas--grande"><span>Ventas totales</span><strong>{dinero(totales.ventas)}</strong><small>Servicios {dinero(totales.servicios)} · Tienda {dinero(totales.tienda)}</small></li>
            <li><span>Citas</span><strong>{totales.citas}</strong><small>{totales.canceladas} canceladas</small></li>
            <li><span>Pedidos de la tienda</span><strong>{totales.pedidos}</strong><small>sin contar cancelados</small></li>
            <li><span>Clientas nuevas</span><strong>{totales.clientasNuevas}</strong><small>primera cita en estas fechas</small></li>
          </ul>

          <GraficoBarras titulo={ventas.porMes ? 'Ventas por mes' : 'Ventas por día'} descripcion="Lo que entró por citas atendidas y por la tienda." datos={ventas.datos} series={SERIES_VENTAS} formato={dinero} nombreValor="Ventas (₡)" archivo={archivo('ventas')}
                         etiquetaCorta={(e) => (ventas.porMes ? MESES[Number(e.slice(5)) - 1] : `${Number(e.slice(8))} ${MESES[Number(e.slice(5, 7)) - 1]}`)} />

          <div className="graficas-dos">
            <GraficoBarras tipo="horizontal" titulo="Citas por especialista" descripcion="Citas no canceladas en estas fechas." archivo={archivo('citas-por-especialista')} nombreValor="Citas"
                           datos={reporte.porEspecialista.map((fila, i) => ({ etiqueta: fila.nombre, valor: fila.citas, color: colorSerie(i + 1), detalle: `Vendió ${dinero(fila.vendido)}` }))} formato={(valor) => `${valor} citas`} />
            <GraficoBarras tipo="horizontal" titulo="Servicios más pedidos" archivo={archivo('servicios-mas-pedidos')} nombreValor="Citas"
                           datos={reporte.servicios.map((servicio, i) => ({ etiqueta: servicio.nombre, valor: servicio.citas, color: colorSerie(i + 1), detalle: `Vendido ${dinero(servicio.vendido)}` }))} formato={(valor) => `${valor} citas`} />
            <GraficoBarras tipo="horizontal" titulo="Productos más vendidos" archivo={archivo('productos-mas-vendidos')} nombreValor="Unidades"
                           datos={reporte.productos.map((producto, i) => ({ etiqueta: producto.nombre, valor: producto.unidades, color: colorSerie(i + 1), detalle: dinero(producto.vendido) }))} formato={(valor) => `${valor} u.`} />
            <GraficoBarras tipo="horizontal" titulo="Formas de pago en la tienda" archivo={archivo('formas-de-pago')} nombreValor="Total (₡)"
                           datos={reporte.pagos.map((pago, i) => ({ etiqueta: pago.metodo, valor: pago.total, color: colorSerie(i + 2), detalle: `${pago.pedidos} pedidos` }))} formato={dinero} />
            <GraficoBarras tipo="horizontal" titulo="Cómo terminaron las citas" archivo={archivo('estado-de-citas')} nombreValor="Citas"
                           datos={reporte.estados.map((estado) => ({ etiqueta: ESTADOS[estado.estado] || estado.estado, valor: estado.n, color: COLOR_ESTADO[estado.estado] }))} formato={(valor) => `${valor}`} />
            <GraficoBarras tipo="horizontal" titulo="Horas con más citas" descripcion="Sirve para saber a qué horas hace falta más personal." archivo={archivo('horas-con-mas-citas')} nombreValor="Citas"
                           datos={(reporte.porHora || []).map((fila, i) => ({ etiqueta: `${fila.hora % 12 || 12}:00 ${fila.hora < 12 ? 'a. m.' : 'p. m.'}`, valor: fila.citas, color: colorSerie(i + 1) }))} formato={(valor) => `${valor} citas`} />
          </div>
        </>
      )}
    </section>
  );
}
