import { useEffect, useState } from 'react';
import { api, sesionAdmin } from '../lib/api.js';
import { useTitulo } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import Modal from '../components/Modal.jsx';
import AgendaAdmin from './admin/AgendaAdmin.jsx';
import ProductosAdmin from './admin/ProductosAdmin.jsx';
import EquipoAdmin from './admin/EquipoAdmin.jsx';
import PedidosAdmin from './admin/PedidosAdmin.jsx';
import { ZonaFotos, BotonFoto, formData } from './admin/comunes.jsx';

const CATEGORIAS = ['Manicure', 'Acrílicas', 'Polygel', 'Gel', 'Pedicure', 'Nail art'];
const FORMAS = ['Almendra', 'Ovalada', 'Cuadrada', 'Coffin', 'Stiletto'];
const COLORES = ['Nude', 'Rosa', 'Rojo', 'Vino', 'Morado', 'Azul', 'Verde', 'Negro', 'Blanco', 'Dorado', 'Multicolor'];
const ACABADOS = ['Brillante', 'Mate', 'Chrome', 'Glitter'];

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
  const [nuevaFoto, setNuevaFoto] = useState(null);
  const [buscar, setBuscar] = useState('');
  const [cat, setCat] = useState('');
  const [visibles, setVisibles] = useState(24);

  // Trae todas las fotos (el servidor entrega de a 100)
  const cargar = async () => {
    const todas = [];
    for (let pagina = 1; pagina < 30; pagina++) {
      const r = await api.fotos({ limite: 100, pagina });
      todas.push(...r.fotos);
      if (r.fotos.length < 100) break;
    }
    setFotos(todas);
  };
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
      setArchivos([]); setDatos(VACIO); cargar();
    } catch (err) { setEstado({ subiendo: false, mensaje: '', error: err.message }); }
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    await api.admin.editarFoto(editando.id, editando);
    if (nuevaFoto) await api.admin.cambiarFotoDiseno(editando.id, formData(nuevaFoto));
    setEditando(null); setNuevaFoto(null); cargar();
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

  const lista = fotos.filter((f) => (!cat || f.categoria === cat) && (!buscar || [f.titulo, f.color, f.forma, f.acabado, f.descripcion].join(' ').toLowerCase().includes(buscar.toLowerCase())));

  const modal = editando && (
    <Modal titulo="Editar diseño" onCerrar={() => { setEditando(null); setNuevaFoto(null); }} ancho>
      <form onSubmit={guardarEdicion} className="editar-foto">
        <div className="editar-foto__previa">
          <div className="editar-foto__imagen">
            {nuevaFoto ? <img src={URL.createObjectURL(nuevaFoto)} alt="Foto nueva" /> : <Foto archivo={editando.archivo} alt={editando.descripcion || editando.titulo} />}
            {nuevaFoto && <span className="editar-foto__nueva">Foto nueva · se guarda al tocar «Guardar cambios»</span>}
          </div>
          <BotonFoto texto={nuevaFoto ? 'Elegir otra foto' : 'Cambiar foto'} etiqueta={`de ${editando.titulo}`} onArchivo={setNuevaFoto} />
          <p className="tenue">Así se verá en la galería:</p>
          <div className="editar-foto__tarjeta">
            <p><strong>{editando.titulo || 'Sin título'}</strong></p>
            <p className="editar-foto__chips">{[editando.categoria, editando.forma, editando.color, editando.acabado].filter(Boolean).map((x) => <span key={x}>{x}</span>)}</p>
            {editando.destacada && <span className="tarjeta-diseno__marca editar-foto__dest">Destacado</span>}
          </div>
        </div>
        <div className="editar-foto__campos">
          {camposFoto(editando, setEditando, `e${editando.id}`)}
          <div className="botones"><button type="submit" className="boton">Guardar cambios</button><button type="button" className="boton boton--contorno" onClick={() => { setEditando(null); setNuevaFoto(null); }}>Cancelar</button></div>
        </div>
      </form>
    </Modal>
  );

  return (
    <section aria-labelledby="t-galeria-admin">
      {modal}
      <h2 id="t-galeria-admin">Galería</h2>
      <form className="subida" onSubmit={subir}>
        <div className="subida__cabeza">
          <span className="subida__icono" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></svg></span>
          <div><h3>Subir fotos nuevas</h3><p className="tenue">Arrastra varias a la vez: se guardan con los mismos datos y títulos numerados.</p></div>
        </div>
        <div className="subida__cuerpo">
          <ZonaFotos archivos={archivos} onCambio={setArchivos} id="g-archivos" />
          <div className="subida__campos">{camposFoto(datos, setDatos, 'g')}</div>
        </div>
        {estado.error && <p role="alert" className="error">{estado.error}</p>}
        {estado.mensaje && <p role="status" className="aviso-ok">{estado.mensaje}</p>}
        <button type="submit" className="boton subida__boton" disabled={estado.subiendo || !archivos.length}>{estado.subiendo ? 'Subiendo…' : archivos.length ? `Subir ${archivos.length} ${archivos.length === 1 ? 'foto' : 'fotos'} a la galería` : 'Elige fotos para subir'}</button>
      </form>

      <div className="filtros-admin">
        <label className="filtros-admin__buscar"><span className="solo-lector">Buscar diseño</span><input type="search" value={buscar} onChange={(e) => { setBuscar(e.target.value); setVisibles(24); }} placeholder="Buscar por título, color o forma" /></label>
        <label><span className="solo-lector">Servicio</span><select value={cat} onChange={(e) => { setCat(e.target.value); setVisibles(24); }}><option value="">Todos los servicios</option>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <p className="tenue">{lista.length} diseños</p>
      <ul className="admin-tarjetas">
        {lista.slice(0, visibles).map((f, i) => (
          <li key={f.id} className="admin-tarjeta" style={{ '--n': i % 24 }}>
            <div className="admin-tarjeta__foto">
              <Foto archivo={f.archivo} alt={f.titulo} />
              {f.destacada ? <span className="admin-tarjeta__sello admin-tarjeta__sello--oro">Destacado</span> : null}
            </div>
            <div className="admin-tarjeta__info">
              <p className="admin-tarjeta__nombre">{f.titulo}</p>
              <p className="editar-foto__chips">{[f.categoria, f.forma, f.color, f.acabado].filter(Boolean).map((x) => <span key={x}>{x}</span>)}</p>
              <p className="tenue">{f.vistas} vistas</p>
            </div>
            <div className="admin-tarjeta__botones">
              <button type="button" className="boton boton--chico" onClick={() => setEditando({ ...f, destacada: !!f.destacada })}>Editar<span className="solo-lector"> {f.titulo}</span></button>
              <button type="button" className="boton boton--chico boton--peligro" onClick={() => borrar(f)}>Borrar<span className="solo-lector"> {f.titulo}</span></button>
            </div>
          </li>
        ))}
      </ul>
      {visibles < lista.length && <button type="button" className="boton boton--contorno boton--centro" onClick={() => setVisibles(visibles + 24)}>Ver más ({lista.length - visibles})</button>}
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

const SECCIONES = { agenda: ['Agenda', AgendaAdmin], galeria: ['Galería', Galeria], productos: ['Productos', ProductosAdmin], equipo: ['Equipo', EquipoAdmin], pedidos: ['Pedidos', PedidosAdmin], bd: ['Base de datos', BaseDeDatos] };

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
