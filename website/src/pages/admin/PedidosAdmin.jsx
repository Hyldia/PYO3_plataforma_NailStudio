// Pedidos de la tienda: filtros por fecha, nombre, estado y pago; estados con aviso por WhatsApp; descarga en Excel.
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero } from '../../config.js';
import Modal from '../../components/Modal.jsx';
import VerMas from '../../components/VerMas.jsx';
import { TarjetaMensaje, isoLocal } from './piezasPanel.jsx';

const POR_PAGINA = 4;
const ESTADOS = { recibido: 'Recibido', listo: 'Listo para retirar', completado: 'Completado', cancelado: 'Cancelado' };
const SIGUIENTE = { recibido: ['listo', 'completado', 'cancelado'], listo: ['completado', 'recibido', 'cancelado'], completado: ['listo'], cancelado: [] };
const TEXTO = { listo: 'Listo para retirar', completado: 'Ya lo retiró', recibido: 'Volver a recibido', cancelado: 'Cancelar' };

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
// «2026-11-15 15:51» → «15 nov 2026 · 3:51 p. m.»
// Nombre: fechaPedido
// Descripción: Escribe la fecha de un pedido.
// Entrada: El texto de la fecha.
// Salida: La fecha bonita.
// Objetivo: Leer fácil.
function fechaPedido(texto = '') {
  const [fechaTexto, horaTexto = ''] = String(texto).replace('T', ' ').split(' ');
  const [anio, numeroMes, numeroDia] = fechaTexto.split('-').map(Number);
  if (!numeroDia) return texto;
  const [hh, mm] = horaTexto.split(':').map(Number);
  const hora = Number.isFinite(hh) ? ` · ${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'a. m.' : 'p. m.'}` : '';
  return `${numeroDia} ${MESES[numeroMes - 1]} ${anio}${hora}`;
}

// Nombre: rango
// Descripción: Calcula fechas rápidas (hoy, semana, mes).
// Entrada: El tipo.
// Salida: Desde y hasta.
// Objetivo: Filtrar rápido.
function rango(tipo) {
  const hoy = new Date();
  const fecha = new Date(hoy);
  if (tipo === 'hoy') return { desde: isoLocal(hoy), hasta: isoLocal(hoy) };
  if (tipo === 'semana') { fecha.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7)); return { desde: isoLocal(fecha), hasta: isoLocal(hoy) }; }
  if (tipo === 'mes') return { desde: `${isoLocal(hoy).slice(0, 7)}-01`, hasta: isoLocal(hoy) };
  return { desde: '', hasta: '' };
}

// Nombre: VentanaCompletar
// Descripción: Muestra la ventana para entregar un pedido.
// Entrada: El pedido.
// Salida: La ventana.
// Objetivo: Registrar quién lo retiró.
function VentanaCompletar({ pedido, onCerrar, onListo }) {
  const [retiradoPor, setRetiradoPor] = useState(pedido.cliente_nombre);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  // Nombre: guardar
  // Descripción: Guarda la entrega.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Completar el pedido.
  const guardar = async (evento) => {
    evento.preventDefault();
    try { await api.admin.estadoPedido(pedido.id, { estado: 'completado', retiradoPor, notas }); onListo(); onCerrar(); } catch (error) { setError(error.message); }
  };
  return (
    <Modal titulo={`Entregar el pedido #${pedido.id}`} onCerrar={onCerrar}>
      <form className="form-cancelar" onSubmit={guardar}>
        <p className="tenue">{pedido.detalle}</p>
        <p>Total: <strong>{dinero(pedido.total)}</strong> · {pedido.metodo_pago}</p>
        <div className="campo"><label htmlFor="pc-quien">¿Quién lo retiró?</label><input id="pc-quien" value={retiradoPor} onChange={(evento) => setRetiradoPor(evento.target.value)} required /></div>
        <div className="campo"><label htmlFor="pc-notas">Nota (opcional)</label><input id="pc-notas" value={notas} onChange={(evento) => setNotas(evento.target.value)} placeholder="Ej.: pagó en efectivo" /></div>
        {error && <p role="alert" className="error">{error}</p>}
        <div className="botones"><button type="submit" className="boton">Marcar como retirado</button><button type="button" className="boton boton--contorno" onClick={onCerrar}>Volver</button></div>
      </form>
    </Modal>
  );
}

// Nombre: PedidosAdmin
// Descripción: Muestra los pedidos en el panel.
// Entrada: Nada.
// Salida: La sección.
// Objetivo: Atender ventas.
export default function PedidosAdmin() {
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', q: '', estado: '', pago: '' });
  const [texto, setTexto] = useState('');
  const [rapido, setRapido] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [pagos, setPagos] = useState([]);
  const [ventana, setVentana] = useState(null);
  const [error, setError] = useState('');
  const [bajando, setBajando] = useState(false);

  // Nombre: cargar
  // Descripción: Carga los pedidos.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrar la lista.
  const cargar = () => api.admin.pedidos(filtros).then(setPedidos).catch((fallo) => setError(fallo.message));
  useEffect(() => { cargar(); }, [filtros]);
  useEffect(() => { api.admin.pedidos().then((pedidos) => setPagos([...new Set(pedidos.map((pedido) => pedido.metodo_pago))])).catch(() => {}); }, []);
  useEffect(() => { const temporizador = setTimeout(() => setFiltros((anteriores) => ({ ...anteriores, q: texto })), 300); return () => clearTimeout(temporizador); }, [texto]);
  const paginas = Math.ceil(pedidos.length / POR_PAGINA);
  const pedidosPagina = pedidos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  useEffect(() => { if (pagina > paginas) setPagina(Math.max(paginas, 1)); }, [pagina, paginas]);

  // Nombre: set
  // Descripción: Cambia un filtro.
  // Entrada: El nombre del filtro.
  // Salida: Una función para el campo.
  // Objetivo: Filtrar pedidos.
  const set = (campo) => (evento) => { setFiltros({ ...filtros, [campo]: evento.target.value }); setPagina(1); if (campo === 'desde' || campo === 'hasta') setRapido(''); };
  // Nombre: elegirRapido
  // Descripción: Elige un rango rápido.
  // Entrada: El tipo.
  // Salida: Nada.
  // Objetivo: Filtrar rápido.
  const elegirRapido = (texto) => { setRapido(texto); setFiltros({ ...filtros, ...rango(texto) }); setPagina(1); };
  // Nombre: limpiar
  // Descripción: Quita los filtros.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ver todo.
  const limpiar = () => { setTexto(''); setRapido(''); setFiltros({ desde: '', hasta: '', q: '', estado: '', pago: '' }); setPagina(1); };

  const resumen = useMemo(() => {
    const validos = pedidos.filter((pedido) => pedido.estado !== 'cancelado');
    return { total: validos.reduce((suma, valido) => suma + valido.total, 0), porRetirar: pedidos.filter((pedido) => ['recibido', 'listo'].includes(pedido.estado)).length, completados: pedidos.filter((pedido) => pedido.estado === 'completado').length };
  }, [pedidos]);

  // Nombre: cambiar
  // Descripción: Cambia el estado de un pedido.
  // Entrada: El pedido y el estado.
  // Salida: Nada.
  // Objetivo: Seguir su avance.
  async function cambiar(producto, estado) {
    if (estado === 'completado') return setVentana({ tipo: 'completar', pedido: producto });
    if (estado === 'cancelado' && !window.confirm(`¿Cancelar el pedido #${producto.id}? El stock vuelve a la tienda.`)) return;
    try {
      const respuesta = await api.admin.estadoPedido(producto.id, { estado });
      cargar();
      if (respuesta.mensaje) setVentana({ tipo: 'mensaje', pedido: respuesta.pedido, mensaje: respuesta.mensaje });
    } catch (error) { setError(error.message); }
  }
  // Nombre: descargar
  // Descripción: Descarga los pedidos.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Guardarlos en Excel.
  const descargar = async () => { setBajando(true); try { await api.admin.descargarExcelPedidos(filtros); } catch (error) { setError(error.message); } setBajando(false); };
  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <section aria-labelledby="t-ped" className="seccion-admin">
      <div className="admin__cabeza">
        <h2 id="t-ped">Pedidos de la tienda</h2>
        <button type="button" className="boton boton--excel" onClick={descargar} disabled={bajando || !pedidos.length}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M9 13l4 5M13 13l-4 5" /></svg>
          {bajando ? 'Generando…' : 'Descargar Excel'}
        </button>
      </div>

      <ul className="cifras-admin">
        <li><strong>{pedidos.length}</strong>pedidos</li>
        <li className="cifras-admin--verde"><strong>{dinero(resumen.total)}</strong>vendido</li>
        <li className="cifras-admin--ambar"><strong>{resumen.porRetirar}</strong>por retirar</li>
        <li><strong>{resumen.completados}</strong>completados</li>
      </ul>

      <div className="filtros-admin filtros-admin--pedidos">
        <div className="barra-chips barra-chips--compacta" role="group" aria-label="Periodo">
          {[['', 'Todo'], ['hoy', 'Hoy'], ['semana', 'Esta semana'], ['mes', 'Este mes']].map(([k, t]) => (
            <button key={k} type="button" className={`chip-filtro ${rapido === k && (k || !filtros.desde) ? 'chip-filtro--activo' : ''}`} onClick={() => elegirRapido(k)}>{t}</button>
          ))}
        </div>
        <label className="filtros-admin__buscar"><span className="solo-lector">Buscar</span><input type="search" value={texto} onChange={(evento) => { setTexto(evento.target.value); setPagina(1); }} placeholder="Nombre, teléfono o N.º de pedido" /></label>
        <label className="filtros-admin__fecha"><span>Desde</span><input type="date" value={filtros.desde} onChange={set('desde')} /></label>
        <label className="filtros-admin__fecha"><span>Hasta</span><input type="date" value={filtros.hasta} onChange={set('hasta')} /></label>
        <label><span className="solo-lector">Estado</span><select value={filtros.estado} onChange={set('estado')}><option value="">Todos los estados</option>{Object.entries(ESTADOS).map(([clave, valor]) => <option key={clave} value={clave}>{valor}</option>)}</select></label>
        <label><span className="solo-lector">Forma de pago</span><select value={filtros.pago} onChange={set('pago')}><option value="">Todas las formas de pago</option>{pagos.map((pago) => <option key={pago}>{pago}</option>)}</select></label>
        {hayFiltros && <button type="button" className="enlace enlace--boton" onClick={limpiar}>Quitar filtros</button>}
      </div>
      {error && <p role="alert" className="error">{error}</p>}

      {pedidos.length === 0 ? <p className="tenue">No hay pedidos con esos filtros.</p> : (
        <ul className="pedidos-lista">
          {pedidosPagina.map((pedido, numero) => {
            const pasos = ['recibido', 'listo', 'completado'];
            const paso = pasos.indexOf(pedido.estado);
            const siguientes = pedido.estado === 'completado' ? [] : (SIGUIENTE[pedido.estado] || []).filter((estado) => estado === 'listo' || estado === 'completado');
            return (
              <li key={pedido.id} className={`pedido-card pedido-card--${pedido.estado}`} style={{ '--n': numero % 20 }}>
                <header className="pedido-card__cabeza">
                  <div className="pedido-card__numero"><strong>Pedido #{pedido.id}</strong><span>{fechaPedido(pedido.fecha_local || pedido.creado_en)}</span></div>
                  <span className={`estado-pedido estado-pedido--${pedido.estado}`}>{ESTADOS[pedido.estado] || pedido.estado}</span>
                  <div className="pedido-card__total"><strong>{dinero(pedido.total)}</strong><span>{pedido.metodo_pago}</span></div>
                </header>

                <div className="pedido-card__cuerpo">
                  <div>
                    <p className="pedido-card__etiqueta">Clienta</p>
                    <p className="pedido-card__clienta">{pedido.cliente_nombre}</p>
                    <a className="pedido-card__tel" href={`tel:${String(pedido.cliente_telefono).replace(/\s/g, '')}`}>{pedido.cliente_telefono}</a>
                  </div>
                  <div>
                    <p className="pedido-card__etiqueta">Productos</p>
                    <ul className="pedido-card__productos">{String(pedido.detalle || '').split(/, (?=\d+ ×)/).map((parte, campo) => { const [cant, ...resto] = parte.split(' × '); return <li key={campo}><b>{cant}</b><span>{resto.join(' × ') || parte}</span></li>; })}</ul>
                    {(pedido.cupon_codigo || pedido.citas > 0) && (
                      <p className="pedido-card__extras">
                        {pedido.cupon_codigo && <span className="chip-cupon">Cupón {pedido.cupon_codigo} −{dinero(pedido.descuento)}</span>}
                        {pedido.citas > 0 && <span className="chip-cupon chip-cupon--cita">+ {pedido.citas} {pedido.citas === 1 ? 'cita' : 'citas'}</span>}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="pedido-card__etiqueta">Entrega</p>
                    <p>{pedido.entrega === 'envio' ? <>Envío a domicilio ({dinero(pedido.costo_envio)})</> : 'La retira en el salón'}</p>
                    {pedido.entrega === 'envio' && <p className="tenue">{pedido.direccion}</p>}
                    {pedido.estado === 'completado' && <p className="tenue">Retiró {pedido.retirado_por || 'la clienta'}{pedido.completado_en ? ` · ${fechaPedido(pedido.completado_en)}` : ''}</p>}
                    {pedido.notas_admin && <p className="tenue">“{pedido.notas_admin}”</p>}
                  </div>
                </div>

                <footer className="pedido-card__pie">
                  {pedido.estado === 'cancelado' ? <p className="pedido-card__cancelado">Pedido cancelado</p> : (
                    <ol className="pedido-pasos" aria-label="Avance del pedido">
                      {['Recibido', 'Listo para retirar', 'Entregado'].map((etapa, campo) => <li key={etapa} className={campo <= paso ? 'hecho' : ''} aria-current={campo === paso ? 'step' : undefined}><span>{campo < paso ? '✓' : campo + 1}</span>{etapa}</li>)}
                    </ol>
                  )}
                  <div className="pedido-card__acciones">
                    {(SIGUIENTE[pedido.estado] || []).includes('cancelado') && <button type="button" className="enlace enlace--boton enlace--chico pedido-card__cancelar" onClick={() => cambiar(pedido, 'cancelado')}>Cancelar pedido</button>}
                    {pedido.estado === 'completado' && <button type="button" className="enlace enlace--boton enlace--chico" onClick={() => cambiar(pedido, 'listo')}>Deshacer entrega</button>}
                    {(SIGUIENTE[pedido.estado] || []).includes('recibido') && <button type="button" className="enlace enlace--boton enlace--chico" onClick={() => cambiar(pedido, 'recibido')}>Volver a recibido</button>}
                    {siguientes.map((siguiente) => <button key={siguiente} type="button" className={`boton boton--chico ${siguiente === 'listo' && siguientes.length > 1 ? 'boton--contorno' : ''}`} onClick={() => cambiar(pedido, siguiente)}>{TEXTO[siguiente]}</button>)}
                  </div>
                </footer>
              </li>
            );
          })}
        </ul>
      )}
      <VerMas pagina={pagina} paginas={paginas} onCambiar={(numero) => { setPagina(numero); document.getElementById('t-ped')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} />

      {ventana?.tipo === 'completar' && <VentanaCompletar pedido={ventana.pedido} onCerrar={() => setVentana(null)} onListo={cargar} />}
      {ventana?.tipo === 'mensaje' && (
        <Modal titulo={`Avisar a ${ventana.pedido.cliente_nombre}`} onCerrar={() => setVentana(null)}>
          <div className="aviso-lista">
            <p className="aviso-lista__ok">✓ El pedido #{ventana.pedido.id} quedó listo para retirar. Avísale por WhatsApp:</p>
            <TarjetaMensaje mensaje={ventana.mensaje} nombre={ventana.pedido.cliente_nombre} />
          </div>
        </Modal>
      )}
    </section>
  );
}
