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
  const d = new Date(hoy);
  if (tipo === '7') { d.setDate(d.getDate() - 6); return { desde: isoLocal(d), hasta }; }
  if (tipo === '30') { d.setDate(d.getDate() - 29); return { desde: isoLocal(d), hasta }; }
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
  const [r, setR] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.admin.reportes(rango).then((x) => { setR(x); setError(''); }).catch((e) => setError(e.message)); }, [rango]);
  // Nombre: elegir
  // Descripción: Elige un periodo rápido.
  // Entrada: El tipo.
  // Salida: Nada.
  // Objetivo: Cambiar el reporte.
  const elegir = (t) => { setRapido(t); setRango(periodo(t)); };
  // Nombre: cambiarFecha
  // Descripción: Cambia una fecha del reporte.
  // Entrada: El campo.
  // Salida: Una función para el campo.
  // Objetivo: Elegir fechas.
  const cambiarFecha = (k) => (evento) => { setRapido(''); setRango({ ...rango, [k]: evento.target.value }); };

  // Si son más de 2 meses, la gráfica de ventas se agrupa por mes
  const ventas = useMemo(() => {
    if (!r) return { datos: [], porMes: false };
    if (r.porDia.length <= 62) {
      return { porMes: false, datos: r.porDia.map((d) => ({ etiqueta: d.dia, etiquetaLarga: fechaLarga(d.dia), valor: d.total, partes: { servicios: d.servicios, tienda: d.tienda }, detalle: `${d.citas} citas · ${d.pedidos} pedidos` })) };
    }
    const meses = new Map();
    r.porDia.forEach((d) => {
      const k = d.dia.slice(0, 7);
      const m = meses.get(k) || { total: 0, servicios: 0, tienda: 0, citas: 0 };
      meses.set(k, { total: m.total + d.total, servicios: m.servicios + d.servicios, tienda: m.tienda + d.tienda, citas: m.citas + d.citas });
    });
    return { porMes: true, datos: [...meses].map(([k, m]) => ({ etiqueta: k, etiquetaLarga: `${MESES_LARGOS[Number(k.slice(5)) - 1]} ${k.slice(0, 4)}`, valor: m.total, partes: { servicios: m.servicios, tienda: m.tienda }, detalle: `${m.citas} citas` })) };
  }, [r]);

  const t = r?.totales;
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

      {t && (
        <>
          <ul className="cifras-graficas">
            <li className="cifras-graficas--grande"><span>Ventas totales</span><strong>{dinero(t.ventas)}</strong><small>Servicios {dinero(t.servicios)} · Tienda {dinero(t.tienda)}</small></li>
            <li><span>Citas</span><strong>{t.citas}</strong><small>{t.canceladas} canceladas</small></li>
            <li><span>Pedidos de la tienda</span><strong>{t.pedidos}</strong><small>sin contar cancelados</small></li>
            <li><span>Clientas nuevas</span><strong>{t.clientasNuevas}</strong><small>primera cita en estas fechas</small></li>
          </ul>

          <GraficoBarras titulo={ventas.porMes ? 'Ventas por mes' : 'Ventas por día'} descripcion="Lo que entró por citas atendidas y por la tienda." datos={ventas.datos} series={SERIES_VENTAS} formato={dinero} nombreValor="Ventas (₡)" archivo={archivo('ventas')}
                         etiquetaCorta={(e) => (ventas.porMes ? MESES[Number(e.slice(5)) - 1] : `${Number(e.slice(8))} ${MESES[Number(e.slice(5, 7)) - 1]}`)} />

          <div className="graficas-dos">
            <GraficoBarras tipo="horizontal" titulo="Citas por especialista" descripcion="Citas no canceladas en estas fechas." archivo={archivo('citas-por-especialista')} nombreValor="Citas"
                           datos={r.porEspecialista.map((e, i) => ({ etiqueta: e.nombre, valor: e.citas, color: colorSerie(i + 1), detalle: `Vendió ${dinero(e.vendido)}` }))} formato={(v) => `${v} citas`} />
            <GraficoBarras tipo="horizontal" titulo="Servicios más pedidos" archivo={archivo('servicios-mas-pedidos')} nombreValor="Citas"
                           datos={r.servicios.map((s, i) => ({ etiqueta: s.nombre, valor: s.citas, color: colorSerie(i + 1), detalle: `Vendido ${dinero(s.vendido)}` }))} formato={(v) => `${v} citas`} />
            <GraficoBarras tipo="horizontal" titulo="Productos más vendidos" archivo={archivo('productos-mas-vendidos')} nombreValor="Unidades"
                           datos={r.productos.map((p, i) => ({ etiqueta: p.nombre, valor: p.unidades, color: colorSerie(i + 1), detalle: dinero(p.vendido) }))} formato={(v) => `${v} u.`} />
            <GraficoBarras tipo="horizontal" titulo="Formas de pago en la tienda" archivo={archivo('formas-de-pago')} nombreValor="Total (₡)"
                           datos={r.pagos.map((p, i) => ({ etiqueta: p.metodo, valor: p.total, color: colorSerie(i + 2), detalle: `${p.pedidos} pedidos` }))} formato={dinero} />
            <GraficoBarras tipo="horizontal" titulo="Cómo terminaron las citas" archivo={archivo('estado-de-citas')} nombreValor="Citas"
                           datos={r.estados.map((e) => ({ etiqueta: ESTADOS[e.estado] || e.estado, valor: e.n, color: COLOR_ESTADO[e.estado] }))} formato={(v) => `${v}`} />
            <GraficoBarras tipo="horizontal" titulo="Horas con más citas" descripcion="Sirve para saber a qué horas hace falta más personal." archivo={archivo('horas-con-mas-citas')} nombreValor="Citas"
                           datos={(r.porHora || []).map((h, i) => ({ etiqueta: `${h.hora % 12 || 12}:00 ${h.hora < 12 ? 'a. m.' : 'p. m.'}`, valor: h.citas, color: colorSerie(i + 1) }))} formato={(v) => `${v} citas`} />
          </div>
        </>
      )}
    </section>
  );
}
