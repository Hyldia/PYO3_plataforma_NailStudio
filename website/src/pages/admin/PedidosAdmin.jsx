// Pedidos de la tienda: filtros por fecha, nombre, estado y pago; estados con aviso por WhatsApp; descarga en Excel.
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { SALON, dinero } from '../../config.js';
import Modal from '../../components/Modal.jsx';
import { TarjetaMensaje, isoLocal } from './comunes.jsx';

const ESTADOS = { recibido: 'Recibido', listo: 'Listo para retirar', completado: 'Completado', cancelado: 'Cancelado' };
const SIGUIENTE = { recibido: ['listo', 'completado', 'cancelado'], listo: ['completado', 'recibido', 'cancelado'], completado: ['listo'], cancelado: [] };
const TEXTO = { listo: 'Marcar listo', completado: 'Marcar retirado', recibido: 'Volver a recibido', cancelado: 'Cancelar' };

function rango(tipo) {
  const hoy = new Date();
  const d = new Date(hoy);
  if (tipo === 'hoy') return { desde: isoLocal(hoy), hasta: isoLocal(hoy) };
  if (tipo === 'semana') { d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return { desde: isoLocal(d), hasta: isoLocal(hoy) }; }
  if (tipo === 'mes') return { desde: `${isoLocal(hoy).slice(0, 7)}-01`, hasta: isoLocal(hoy) };
  return { desde: '', hasta: '' };
}

function VentanaCompletar({ pedido, onCerrar, onListo }) {
  const [retiradoPor, setRetiradoPor] = useState(pedido.cliente_nombre);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const guardar = async (e) => {
    e.preventDefault();
    try { await api.admin.estadoPedido(pedido.id, { estado: 'completado', retiradoPor, notas }); onListo(); onCerrar(); } catch (err) { setError(err.message); }
  };
  return (
    <Modal titulo={`Entregar el pedido #${pedido.id}`} onCerrar={onCerrar}>
      <form className="form-cancelar" onSubmit={guardar}>
        <p className="tenue">{pedido.detalle}</p>
        <p>Total: <strong>{dinero(pedido.total)}</strong> · {pedido.metodo_pago}</p>
        <div className="campo"><label htmlFor="pc-quien">¿Quién lo retiró?</label><input id="pc-quien" value={retiradoPor} onChange={(e) => setRetiradoPor(e.target.value)} required /></div>
        <div className="campo"><label htmlFor="pc-notas">Nota (opcional)</label><input id="pc-notas" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej.: pagó en efectivo" /></div>
        {error && <p role="alert" className="error">{error}</p>}
        <div className="botones"><button type="submit" className="boton">Marcar como retirado</button><button type="button" className="boton boton--contorno" onClick={onCerrar}>Volver</button></div>
      </form>
    </Modal>
  );
}

export default function PedidosAdmin() {
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', q: '', estado: '', pago: '' });
  const [texto, setTexto] = useState('');
  const [rapido, setRapido] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [ventana, setVentana] = useState(null);
  const [error, setError] = useState('');
  const [bajando, setBajando] = useState(false);

  const cargar = () => api.admin.pedidos(filtros).then(setPedidos).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, [filtros]);
  useEffect(() => { api.admin.pedidos().then((l) => setPagos([...new Set(l.map((p) => p.metodo_pago))])).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(() => setFiltros((f) => ({ ...f, q: texto })), 300); return () => clearTimeout(t); }, [texto]);

  const set = (k) => (e) => { setFiltros({ ...filtros, [k]: e.target.value }); if (k === 'desde' || k === 'hasta') setRapido(''); };
  const elegirRapido = (t) => { setRapido(t); setFiltros({ ...filtros, ...rango(t) }); };
  const limpiar = () => { setTexto(''); setRapido(''); setFiltros({ desde: '', hasta: '', q: '', estado: '', pago: '' }); };

  const resumen = useMemo(() => {
    const validos = pedidos.filter((p) => p.estado !== 'cancelado');
    return { total: validos.reduce((s, p) => s + p.total, 0), porRetirar: pedidos.filter((p) => ['recibido', 'listo'].includes(p.estado)).length, completados: pedidos.filter((p) => p.estado === 'completado').length };
  }, [pedidos]);

  async function cambiar(p, estado) {
    if (estado === 'completado') return setVentana({ tipo: 'completar', pedido: p });
    if (estado === 'cancelado' && !window.confirm(`¿Cancelar el pedido #${p.id}? El stock vuelve a la tienda.`)) return;
    try {
      const r = await api.admin.estadoPedido(p.id, { estado });
      cargar();
      if (r.mensaje) setVentana({ tipo: 'mensaje', pedido: r.pedido, mensaje: r.mensaje });
    } catch (e) { setError(e.message); }
  }
  const descargar = async () => { setBajando(true); try { await api.admin.descargarExcelPedidos(filtros); } catch (e) { setError(e.message); } setBajando(false); };
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
        <label className="filtros-admin__buscar"><span className="solo-lector">Buscar</span><input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nombre, teléfono o N.º de pedido" /></label>
        <label className="filtros-admin__fecha"><span>Desde</span><input type="date" value={filtros.desde} onChange={set('desde')} /></label>
        <label className="filtros-admin__fecha"><span>Hasta</span><input type="date" value={filtros.hasta} onChange={set('hasta')} /></label>
        <label><span className="solo-lector">Estado</span><select value={filtros.estado} onChange={set('estado')}><option value="">Todos los estados</option>{Object.entries(ESTADOS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></label>
        <label><span className="solo-lector">Forma de pago</span><select value={filtros.pago} onChange={set('pago')}><option value="">Todas las formas de pago</option>{pagos.map((p) => <option key={p}>{p}</option>)}</select></label>
        {hayFiltros && <button type="button" className="enlace enlace--boton" onClick={limpiar}>Quitar filtros</button>}
      </div>
      {error && <p role="alert" className="error">{error}</p>}

      {pedidos.length === 0 ? <p className="tenue">No hay pedidos con esos filtros.</p> : (
        <div className="tabla-envoltura">
          <table className="tabla tabla--pedidos">
            <thead><tr><th scope="col">N.º</th><th scope="col">Fecha</th><th scope="col">Clienta</th><th scope="col">Productos</th><th scope="col">Total</th><th scope="col">Pago</th><th scope="col">Estado y retiro</th><th scope="col"><span className="solo-lector">Acciones</span></th></tr></thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className={`fila-pedido fila-pedido--${p.estado}`}>
                  <td><strong>#{p.id}</strong></td>
                  <td>{(p.fecha_local || p.creado_en).slice(0, 16)}</td>
                  <td>{p.cliente_nombre}<br /><span className="tenue">{p.cliente_telefono}</span></td>
                  <td className="tabla-pedidos__detalle">{p.detalle}{p.cupon_codigo && <span className="chip-cupon">{p.cupon_codigo} −{dinero(p.descuento)}</span>}{p.citas > 0 && <span className="chip-cupon chip-cupon--cita">+ {p.citas} {p.citas === 1 ? 'cita' : 'citas'}</span>}</td>
                  <td><strong>{dinero(p.total)}</strong></td>
                  <td>{p.metodo_pago}</td>
                  <td>
                    <span className={`estado-pedido estado-pedido--${p.estado}`}>{ESTADOS[p.estado] || p.estado}</span>
                    <p className="tabla-pedidos__retiro">{p.entrega === 'envio' ? <>Envío ({dinero(p.costo_envio)}) a <b>{p.direccion}</b></> : `Retiro en el salón ${SALON.nombre}`}</p>
                    {p.estado === 'completado' && <p className="tenue">Retiró {p.retirado_por || 'la clienta'}{p.completado_en ? ` · ${p.completado_en.slice(0, 16)}` : ''}</p>}
                    {p.notas_admin && <p className="tenue">“{p.notas_admin}”</p>}
                  </td>
                  <td className="tabla__acciones">
                    {(SIGUIENTE[p.estado] || []).map((e) => (
                      <button key={e} type="button" className={`boton boton--chico ${e === 'cancelado' ? 'boton--peligro' : e === 'recibido' ? 'boton--contorno' : ''}`} onClick={() => cambiar(p, e)}>{TEXTO[e]}</button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
