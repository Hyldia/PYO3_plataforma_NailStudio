import { useEffect, useState } from 'react';
import { api, sesionAdmin } from '../lib/api.js';
import { SALON, dinero, enlaceWhatsApp } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import Modal from '../components/Modal.jsx';
import ProductoImagen from '../components/ProductoImagen.jsx';

const CATEGORIAS = ['Manicure', 'Acrílicas', 'Polygel', 'Gel', 'Pedicure', 'Nail art'];
const FORMAS = ['Almendra', 'Ovalada', 'Cuadrada', 'Coffin', 'Stiletto'];
const COLORES = ['Nude', 'Rosa', 'Rojo', 'Vino', 'Morado', 'Azul', 'Verde', 'Negro', 'Blanco', 'Dorado', 'Multicolor'];
const ACABADOS = ['Brillante', 'Mate', 'Chrome', 'Glitter'];
const ACCIONES = { pendiente: ['confirmar', 'cancelar'], confirmada: ['completar', 'cancelar'], completada: [], cancelada: [] };
const TEXTO_ACCION = { confirmar: 'Confirmar', completar: 'Marcar atendida', cancelar: 'Cancelar' };
const hoy = () => new Date().toISOString().slice(0, 10);

function Entrar({ onEntrar }) {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const entrar = async (e) => {
    e.preventDefault();
    sesionAdmin.guardar(clave);
    try { await api.admin.verificar(); onEntrar(); } catch (err) { sesionAdmin.cerrar(); setError(err.message); }
  };
  return (
    <form className="caja admin-entrar" onSubmit={entrar}>
      <h1>Acceso del salón</h1>
      <div className="campo">
        <label htmlFor="clave">Clave de administración</label>
        <input id="clave" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} />
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      <button type="submit" className="boton">Entrar</button>
    </form>
  );
}

function Agenda() {
  const [fecha, setFecha] = useState(hoy());
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState('');
  const cargar = () => api.admin.citas(fecha).then(setCitas).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, [fecha]);

  const cambiar = async (id, accion) => {
    try { await api.admin.estadoCita(id, accion); cargar(); } catch (e) { setError(e.message); }
  };

  return (
    <section aria-labelledby="t-agenda">
      <div className="admin__cabeza">
        <h2 id="t-agenda">Agenda</h2>
        <label className="campo campo--linea"><span>Día</span><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      {citas.length === 0 ? <p className="tenue">No hay citas este día.</p> : (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead><tr><th scope="col">Hora</th><th scope="col">Clienta</th><th scope="col">Servicio</th><th scope="col">Diseño</th><th scope="col">Pago</th><th scope="col">Estado</th><th scope="col"><span className="solo-lector">Acciones</span></th></tr></thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id}>
                  <td>{c.hora}</td>
                  <td>{c.cliente_nombre}<br /><a className="enlace" href={enlaceWhatsApp(`Hola ${c.cliente_nombre}, te escribimos de ${SALON.nombre} sobre tu cita del ${c.fecha} a las ${c.hora}.`)} target="_blank" rel="noreferrer">{c.cliente_telefono}</a></td>
                  <td>{c.servicio}<br /><span className="tenue">con {c.especialista}</span></td>
                  <td>
                    {c.forma ? `${c.forma}, ${c.largo}, ${c.color}, ${c.acabado}${c.decoracion !== 'Ninguna' ? `, ${c.decoracion}` : ''}` : <span className="tenue">En el salón</span>}
                    {c.foto_ref && <Foto archivo={c.foto_ref} alt="Foto de referencia" className="tabla__miniatura" />}
                    {c.notas && <p className="tenue">{c.notas}</p>}
                  </td>
                  <td>{dinero(c.total)}<br /><span className="tenue">Adelanto {dinero(c.anticipo)}, {c.metodo_pago}</span></td>
                  <td><span className={`estado estado--${c.estado}`}>{c.estado}</span></td>
                  <td className="tabla__acciones">
                    {ACCIONES[c.estado].map((a) => (
                      <button key={a} type="button" className={`boton boton--chico ${a === 'cancelar' ? 'boton--contorno' : ''}`} onClick={() => cambiar(c.id, a)}>{TEXTO_ACCION[a]}</button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const Elegir = ({ id, etiqueta, opciones, valor, onCambio, vacio = true }) => (
  <div className="campo">
    <label htmlFor={id}>{etiqueta}</label>
    <select id={id} value={valor || ''} onChange={(e) => onCambio(e.target.value)}>
      {vacio && <option value="">Sin especificar</option>}
      {opciones.map((o) => <option key={o}>{o}</option>)}
    </select>
  </div>
);

function Galeria() {
  const VACIO = { titulo: '', descripcion: '', categoria: 'Manicure', forma: '', color: '', acabado: '', etiquetas: '', destacada: false };
  const [datos, setDatos] = useState(VACIO);
  const [archivos, setArchivos] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [estado, setEstado] = useState({ subiendo: false, mensaje: '', error: '' });
  const [editando, setEditando] = useState(null);

  const cargar = () => api.fotos({ limite: 100 }).then((r) => setFotos(r.fotos));
  useEffect(() => { cargar(); }, []);

  async function subir(e) {
    e.preventDefault();
    if (!archivos.length) return setEstado({ subiendo: false, mensaje: '', error: 'Elige al menos una imagen.' });
    setEstado({ subiendo: true, mensaje: '', error: '' });
    try {
      for (const [i, archivo] of archivos.entries()) {
        const fd = new FormData();
        fd.append('imagen', archivo);
        Object.entries(datos).forEach(([k, v]) => fd.append(k, k === 'titulo' && archivos.length > 1 ? `${v || 'Diseño'} ${i + 1}` : v));
        await api.admin.subirFoto(fd);
      }
      setEstado({ subiendo: false, mensaje: `${archivos.length} ${archivos.length === 1 ? 'foto subida' : 'fotos subidas'}.`, error: '' });
      setArchivos([]); setDatos(VACIO); e.target.reset(); cargar();
    } catch (err) { setEstado({ subiendo: false, mensaje: '', error: err.message }); }
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    await api.admin.editarFoto(editando.id, editando); setEditando(null); cargar();
  }

  async function borrar(f) {
    if (!window.confirm(`¿Borrar la foto «${f.titulo}»? No se puede deshacer.`)) return;
    await api.admin.borrarFoto(f.id); cargar();
  }

  const camposFoto = (d, set, prefijo) => (
    <>
      <div className="campo"><label htmlFor={`${prefijo}-titulo`}>Título</label><input id={`${prefijo}-titulo`} value={d.titulo} onChange={(e) => set({ ...d, titulo: e.target.value })} placeholder="Ej.: Francesa almendra con brillo" /></div>
      <div className="campos-cuatro">
        <Elegir id={`${prefijo}-cat`} etiqueta="Servicio" opciones={CATEGORIAS} valor={d.categoria} vacio={false} onCambio={(v) => set({ ...d, categoria: v })} />
        <Elegir id={`${prefijo}-forma`} etiqueta="Forma" opciones={FORMAS} valor={d.forma} onCambio={(v) => set({ ...d, forma: v })} />
        <Elegir id={`${prefijo}-color`} etiqueta="Color" opciones={COLORES} valor={d.color} onCambio={(v) => set({ ...d, color: v })} />
        <Elegir id={`${prefijo}-acab`} etiqueta="Acabado" opciones={ACABADOS} valor={d.acabado} onCambio={(v) => set({ ...d, acabado: v })} />
      </div>
      <div className="campo"><label htmlFor={`${prefijo}-desc`}>Descripción <span className="tenue">(se lee en voz alta para personas ciegas)</span></label><input id={`${prefijo}-desc`} value={d.descripcion || ''} onChange={(e) => set({ ...d, descripcion: e.target.value })} placeholder="Ej.: Uñas largas almendradas, base nude con punta blanca" /></div>
      <div className="campo"><label htmlFor={`${prefijo}-tags`}>Palabras clave para el buscador</label><input id={`${prefijo}-tags`} value={d.etiquetas || ''} onChange={(e) => set({ ...d, etiquetas: e.target.value })} placeholder="boda, elegante, verano" /></div>
      <label className="casilla"><input type="checkbox" checked={!!d.destacada} onChange={(e) => set({ ...d, destacada: e.target.checked })} /><span>Destacar (aparece primero y en la portada)</span></label>
    </>
  );

  const modal = editando && (
    <Modal titulo="Editar diseño" onCerrar={() => setEditando(null)} ancho>
      <form onSubmit={guardarEdicion} className="editar-foto">
        <div className="editar-foto__previa">
          <Foto archivo={editando.archivo} alt={editando.descripcion || editando.titulo} />
          <p className="tenue">Así se verá en la galería:</p>
          <div className="editar-foto__tarjeta">
            <p><strong>{editando.titulo || 'Sin título'}</strong></p>
            <p className="editar-foto__chips">{[editando.categoria, editando.forma, editando.color, editando.acabado].filter(Boolean).map((x) => <span key={x}>{x}</span>)}</p>
            {editando.destacada && <span className="tarjeta-diseno__marca editar-foto__dest">Destacado</span>}
          </div>
        </div>
        <div className="editar-foto__campos">
          {camposFoto(editando, setEditando, `e${editando.id}`)}
          <div className="botones"><button type="submit" className="boton">Guardar cambios</button><button type="button" className="boton boton--contorno" onClick={() => setEditando(null)}>Cancelar</button></div>
        </div>
      </form>
    </Modal>
  );

  return (
    <section aria-labelledby="t-galeria-admin">
      {modal}
      <h2 id="t-galeria-admin">Galería</h2>
      <form className="caja" onSubmit={subir}>
        <h3>Subir fotos</h3>
        <div className="campo">
          <label htmlFor="g-archivos">Imágenes (JPG, PNG o WebP, máximo 8 MB cada una)</label>
          <input id="g-archivos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setArchivos([...e.target.files])} />
          {archivos.length > 1 && <p className="tenue">Las {archivos.length} fotos se guardan con los mismos datos y títulos numerados.</p>}
        </div>
        {camposFoto(datos, setDatos, 'g')}
        {estado.error && <p role="alert" className="error">{estado.error}</p>}
        {estado.mensaje && <p role="status" className="exito">{estado.mensaje}</p>}
        <button type="submit" className="boton" disabled={estado.subiendo}>{estado.subiendo ? 'Subiendo…' : 'Subir a la galería'}</button>
      </form>

      <ul className="admin-fotos">
        {fotos.map((f) => (
          <li key={f.id} className="admin-foto">
            <Foto archivo={f.archivo} alt={f.titulo} />
            <div className="admin-foto__info">
              <p><strong>{f.titulo}</strong>{f.destacada ? ' (destacada)' : ''}</p>
              <p className="tenue">{[f.categoria, f.forma, f.color, f.acabado].filter(Boolean).join(', ')}. {f.vistas} vistas</p>
              <div className="botones">
                <button type="button" className="boton boton--contorno boton--chico" onClick={() => setEditando({ ...f, destacada: !!f.destacada })}>Editar<span className="solo-lector"> {f.titulo}</span></button>
                <button type="button" className="boton boton--peligro boton--chico" onClick={() => borrar(f)}>Borrar<span className="solo-lector"> {f.titulo}</span></button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Equipo() {
  const [lista, setLista] = useState([]);
  const [error, setError] = useState('');
  const cargar = () => api.especialistas().then(setLista);
  useEffect(() => { cargar(); }, []);
  const subir = async (id, archivo) => {
    const fd = new FormData(); fd.append('imagen', archivo);
    try { await api.admin.fotoEspecialista(id, fd); cargar(); } catch (e) { setError(e.message); }
  };
  return (
    <section aria-labelledby="t-equipo">
      <h2 id="t-equipo">Fotos del equipo</h2>
      <p className="tenue">Suban una foto real de cada especialista: es la que ven las clientas al reservar.</p>
      {error && <p role="alert" className="error">{error}</p>}
      <ul className="admin-fotos">
        {lista.map((e) => (
          <li key={e.id} className="admin-foto">
            {e.foto ? <Foto archivo={e.foto} alt={e.nombre} /> : <div className="admin-foto__inicial" aria-hidden="true">{e.nombre[0]}</div>}
            <div className="admin-foto__info">
              <p><strong>{e.nombre}</strong></p>
              <p className="tenue">{e.especialidad}</p>
              <label className="boton boton--contorno boton--chico subir">
                {e.foto ? 'Cambiar foto' : 'Subir foto'}<span className="solo-lector"> de {e.nombre}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(ev) => ev.target.files[0] && subir(e.id, ev.target.files[0])} />
              </label>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Productos() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const cargar = () => api.productos().then(setProductos);
  useEffect(() => { cargar(); }, []);
  const subir = async (id, archivo) => {
    const fd = new FormData(); fd.append('imagen', archivo);
    try { await api.admin.imagenProducto(id, fd); cargar(); } catch (e) { setError(e.message); }
  };
  return (
    <section aria-labelledby="t-prod">
      <h2 id="t-prod">Fotos de productos</h2>
      {error && <p role="alert" className="error">{error}</p>}
      <ul className="admin-fotos">
        {productos.map((p) => (
          <li key={p.id} className="admin-foto">
            <ProductoImagen producto={p} />
            <div className="admin-foto__info">
              <p><strong>{p.nombre}</strong></p>
              <p className="tenue">{dinero(p.precio)}, {p.stock} en stock</p>
              <label className="boton boton--contorno boton--chico subir">
                {p.imagen ? 'Cambiar foto' : 'Subir foto'}<span className="solo-lector"> de {p.nombre}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files[0] && subir(p.id, e.target.files[0])} />
              </label>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  useEffect(() => { api.admin.pedidos().then(setPedidos).catch(() => {}); }, []);
  return (
    <section aria-labelledby="t-ped">
      <h2 id="t-ped">Pedidos de la tienda</h2>
      {pedidos.length === 0 ? <p className="tenue">Todavía no hay pedidos.</p> : (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead><tr><th scope="col">N.º</th><th scope="col">Fecha</th><th scope="col">Clienta</th><th scope="col">Productos</th><th scope="col">Total</th><th scope="col">Pago</th></tr></thead>
            <tbody>{pedidos.map((p) => (
              <tr key={p.id}><td>{p.id}</td><td>{p.creado_en.slice(0, 16)}</td><td>{p.cliente_nombre}<br /><span className="tenue">{p.cliente_telefono}</span></td><td>{p.detalle}</td><td>{dinero(p.total)}</td><td>{p.metodo_pago}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}


// Nombres legibles de las tablas para el panel
const NOMBRE_TABLA = {
  citas: 'Citas', disenos: 'Diseños', recordatorios: 'Recordatorios', pedidos: 'Pedidos', pedido_items: 'Productos de cada pedido',
  productos: 'Productos', servicios: 'Servicios', especialistas: 'Especialistas', fotos: 'Fotos de la galería', ajustes: 'Ajustes internos'
};

function BaseDeDatos() {
  const [tablas, setTablas] = useState([]);
  const [tabla, setTabla] = useState('citas');
  const [datos, setDatos] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [q, setQ] = useState('');
  const [verSql, setVerSql] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.admin.tablas().then(setTablas).catch((e) => setError(e.message)); }, []);
  useEffect(() => { const t = setTimeout(() => { setQ(texto); setPagina(1); }, 300); return () => clearTimeout(t); }, [texto]);
  useEffect(() => {
    api.admin.tabla(tabla, { pagina, porPagina: 25, q }).then((d) => { setDatos(d); setError(''); }).catch((e) => setError(e.message));
  }, [tabla, pagina, q]);

  const elegir = (t) => { setTabla(t); setPagina(1); setTexto(''); setQ(''); };
  const info = tablas.find((t) => t.nombre === tabla);
  const paginas = datos ? Math.max(1, Math.ceil(datos.total / datos.porPagina)) : 1;
  const celda = (v) => (v === null || v === undefined ? <span className="tenue">vacío</span>
    : typeof v === 'string' && v.startsWith('http') ? <a className="enlace" href={v} target="_blank" rel="noreferrer">ver</a>
    : String(v));

  return (
    <section aria-labelledby="t-bd">
      <div className="admin__cabeza">
        <h2 id="t-bd">Base de datos</h2>
        <p className="tenue">Solo lectura. Así se ve lo que el sitio guarda en SQLite.</p>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="bd">
        <nav className="bd__tablas" aria-label="Tablas">
          {tablas.map((t) => (
            <button key={t.nombre} type="button" aria-current={tabla === t.nombre ? 'true' : undefined} onClick={() => elegir(t.nombre)}>
              <span>{NOMBRE_TABLA[t.nombre] || t.nombre}<span className="bd__tecnico">{t.nombre}</span></span>
              <span className="bd__cuenta">{t.filas}</span>
            </button>
          ))}
        </nav>
        <div className="bd__contenido">
          <div className="barra-busqueda">
            <label className="buscador">
              <span className="solo-lector">Buscar en la tabla</span>
              <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={`Buscar en ${NOMBRE_TABLA[tabla] || tabla}`} />
            </label>
            <button type="button" className="boton boton--contorno boton--chico" onClick={() => setVerSql(!verSql)} aria-expanded={verSql}>
              {verSql ? 'Ocultar estructura' : 'Ver estructura (SQL)'}
            </button>
            <button type="button" className="boton boton--chico" onClick={() => api.admin.descargarCsv(tabla).catch((e) => setError(e.message))}>Descargar CSV</button>
          </div>
          {verSql && info && <pre className="bd__sql">{info.sql}</pre>}
          {datos && (
            <>
              <p aria-live="polite"><strong>{datos.total}</strong> {datos.total === 1 ? 'fila' : 'filas'}{q && ` que contienen «${q}»`}</p>
              <div className="tabla-envoltura">
                <table className="tabla tabla--datos">
                  <caption className="solo-lector">Tabla {tabla}, página {pagina} de {paginas}</caption>
                  <thead><tr>{datos.columnas.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
                  <tbody>
                    {datos.filas.map((f, i) => (
                      <tr key={f.id ?? i}>{datos.columnas.map((c) => <td key={c}>{celda(f[c])}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="paginacion">
                <button type="button" className="boton boton--contorno boton--chico" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
                <span>Página {pagina} de {paginas}</span>
                <button type="button" className="boton boton--contorno boton--chico" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

const SECCIONES = { agenda: ['Agenda', Agenda], galeria: ['Galería', Galeria], productos: ['Productos', Productos], equipo: ['Equipo', Equipo], pedidos: ['Pedidos', Pedidos], bd: ['Base de datos', BaseDeDatos] };

export default function Admin() {
  useTitulo('Panel del salón');
  const [dentro, setDentro] = useState(false);
  const [seccion, setSeccion] = useState('agenda');

  useEffect(() => { if (sesionAdmin.obtener()) api.admin.verificar().then(() => setDentro(true)).catch(() => sesionAdmin.cerrar()); }, []);

  if (!dentro) return <div className="contenedor pagina"><Entrar onEntrar={() => setDentro(true)} /></div>;
  const Seccion = SECCIONES[seccion][1];

  return (
    <div className="contenedor pagina admin">
      <div className="admin__cabeza">
        <h1>Panel del salón</h1>
        <button type="button" className="enlace enlace--boton" onClick={() => { sesionAdmin.cerrar(); setDentro(false); }}>Salir</button>
      </div>
      <nav className="admin__nav" aria-label="Secciones del panel">
        {Object.entries(SECCIONES).map(([clave, [texto]]) => (
          <button key={clave} type="button" aria-current={seccion === clave ? 'page' : undefined} onClick={() => setSeccion(clave)}>{texto}</button>
        ))}
      </nav>
      <Seccion />
    </div>
  );
}
