import { useEffect, useState } from 'react';
import { api, sesionAdmin } from '../lib/api.js';
import { useTitulo } from '../lib/hooks.js';
import { dinero } from '../config.js';
import Foto from '../components/Foto.jsx';
import Modal from '../components/Modal.jsx';
import AgendaAdmin from './admin/AgendaAdmin.jsx';
import ProductosAdmin from './admin/ProductosAdmin.jsx';
import EquipoAdmin from './admin/EquipoAdmin.jsx';
import PedidosAdmin from './admin/PedidosAdmin.jsx';
import ContrasenaAdmin from './admin/ContrasenaAdmin.jsx';
import ServiciosAdmin from './admin/ServiciosAdmin.jsx';
import PagosEquipo from './admin/PagosEquipo.jsx';
import ReportesAdmin from './admin/ReportesAdmin.jsx';
import Campanita from './admin/Campanita.jsx';
import { ZonaFotos, BotonFoto, formData } from './admin/piezasPanel.jsx';

const CATEGORIAS = ['Manicure', 'Acrílicas', 'Polygel', 'Gel', 'Pedicure', 'Nail art'];
const FORMAS = ['Almendra', 'Ovalada', 'Cuadrada', 'Coffin', 'Stiletto'];
const COLORES = ['Nude', 'Rosa', 'Rojo', 'Vino', 'Morado', 'Azul', 'Verde', 'Negro', 'Blanco', 'Dorado', 'Multicolor'];
const ACABADOS = ['Brillante', 'Mate', 'Chrome', 'Glitter'];

// Nombre: Entrar
// Descripción: Muestra la entrada al panel.
// Entrada: Qué hacer al entrar.
// Salida: El formulario.
// Objetivo: Pedir la contraseña.
function Entrar({ onEntrar }) {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [ver, setVer] = useState(false);
  // Nombre: entrar
  // Descripción: Envía la contraseña.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Entrar al panel.
  const entrar = async (e) => {
    e.preventDefault();
    try {
      const r = await api.admin.entrar(clave);
      sesionAdmin.guardar(r.token);
      onEntrar(r.contrasenaInicial);
    } catch (err) { setError(err.message); }
  };
  return (
    <form className="caja admin-entrar" onSubmit={entrar}>
      <h1>Acceso del salón</h1>
      <div className="campo">
        <label htmlFor="clave">Contraseña del salón</label>
        <div className="acceso__clave">
          <input id="clave" type={ver ? 'text' : 'password'} autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} />
          <button type="button" onClick={() => setVer(!ver)} aria-pressed={ver}>{ver ? 'Ocultar' : 'Ver'}</button>
        </div>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      <button type="submit" className="boton">Entrar</button>
    </form>
  );
}

// Nombre: Elegir
// Descripción: Muestra una lista para elegir.
// Entrada: Etiqueta, opciones y valor.
// Salida: La lista.
// Objetivo: Formularios del panel.
const Elegir = ({ id, etiqueta, opciones, valor, onCambio, vacio = true }) => (
  <div className="campo">
    <label htmlFor={id}>{etiqueta}</label>
    <select id={id} value={valor || ''} onChange={(e) => onCambio(e.target.value)}>
      {vacio && <option value="">Sin especificar</option>}
      {opciones.map((o) => <option key={o}>{o}</option>)}
    </select>
  </div>
);

// Nombre: Galeria
// Descripción: Muestra la administración de la galería.
// Entrada: Nada.
// Salida: La sección.
// Objetivo: Subir y editar diseños.
function Galeria() {
  const VACIO = { titulo: '', descripcion: '', categoria: 'Manicure', forma: '', color: '', acabado: '', etiquetas: '', destacada: false, precio: '' };
  const [datos, setDatos] = useState(VACIO);
  const [archivos, setArchivos] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [estado, setEstado] = useState({ subiendo: false, mensaje: '', error: '' });
  const [editando, setEditando] = useState(null);
  const [nuevaFoto, setNuevaFoto] = useState(null);
  const [buscar, setBuscar] = useState('');
  const [cat, setCat] = useState('');
  const [visibles, setVisibles] = useState(24);
  const [subiendoAbierto, setSubiendoAbierto] = useState(false);

  // Trae todas las fotos (el servidor entrega de a 100)
  // Nombre: cargar
  // Descripción: Carga los diseños.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrar la lista.
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

  // Nombre: subir
  // Descripción: Sube diseños nuevos.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Agregar a la galería.
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
      setArchivos([]); setDatos(VACIO); setSubiendoAbierto(false); cargar();
    } catch (err) { setEstado({ subiendo: false, mensaje: '', error: err.message }); }
  }

  // Nombre: guardarEdicion
  // Descripción: Guarda cambios de un diseño.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Editar la galería.
  async function guardarEdicion(e) {
    e.preventDefault();
    await api.admin.editarFoto(editando.id, editando);
    if (nuevaFoto) await api.admin.cambiarFotoDiseno(editando.id, formData(nuevaFoto));
    setEditando(null); setNuevaFoto(null); cargar();
  }

  // Nombre: borrar
  // Descripción: Borra un diseño.
  // Entrada: El diseño.
  // Salida: Nada.
  // Objetivo: Quitar de la galería.
  async function borrar(f) {
    if (!window.confirm(`¿Borrar la foto «${f.titulo}»? No se puede deshacer.`)) return;
    await api.admin.borrarFoto(f.id); cargar();
  }

  // Nombre: camposFoto
  // Descripción: Muestra los campos de un diseño.
  // Entrada: Datos, función y prefijo.
  // Salida: Los campos.
  // Objetivo: Repetir el formulario.
  const camposFoto = (d, set, prefijo) => (
    <>
      <div className="campo"><label htmlFor={`${prefijo}-titulo`}>Título</label><input id={`${prefijo}-titulo`} value={d.titulo} onChange={(e) => set({ ...d, titulo: e.target.value })} placeholder="Ej.: Francesa almendra con brillo" /></div>
      <div className="campos-cuatro">
        <Elegir id={`${prefijo}-cat`} etiqueta="Servicio" opciones={CATEGORIAS} valor={d.categoria} vacio={false} onCambio={(v) => set({ ...d, categoria: v })} />
        <Elegir id={`${prefijo}-forma`} etiqueta="Forma" opciones={FORMAS} valor={d.forma} onCambio={(v) => set({ ...d, forma: v })} />
        <Elegir id={`${prefijo}-color`} etiqueta="Color" opciones={COLORES} valor={d.color} onCambio={(v) => set({ ...d, color: v })} />
        <Elegir id={`${prefijo}-acab`} etiqueta="Acabado" opciones={ACABADOS} valor={d.acabado} onCambio={(v) => set({ ...d, acabado: v })} />
      </div>
      <div className="campo campo--precio">
        <label htmlFor={`${prefijo}-precio`}>Precio de este diseño (₡) <span className="tenue">(opcional: cualquier monto; vacío = precio normal del servicio)</span></label>
        <input id={`${prefijo}-precio`} type="number" min="0" step="any" inputMode="numeric" value={d.precio ?? ''} onChange={(e) => set({ ...d, precio: e.target.value })} placeholder="Ej.: 18500" />
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
      <div className="admin__cabeza">
        <div><h2 id="t-galeria-admin">Galería</h2><p className="tenue">Las fotos de diseños que ven las clientas.</p></div>
        {!subiendoAbierto && <button type="button" className="boton" onClick={() => setSubiendoAbierto(true)}>+ Agregar nueva imagen</button>}
      </div>
      {estado.mensaje && !subiendoAbierto && <p role="status" className="aviso-ok">{estado.mensaje}</p>}
      {subiendoAbierto && (
      <form className="subida" onSubmit={subir}>
        <button type="button" className="subida__cerrar" onClick={() => { setSubiendoAbierto(false); setArchivos([]); setEstado({ subiendo: false, mensaje: '', error: '' }); }} aria-label="Cerrar sin subir">×</button>
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
      )}

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
              <p className="tenue">{f.precio ? <strong className="galeria-admin__precio">{dinero(f.precio)}</strong> : 'Precio del servicio'} · {f.vistas} vistas</p>
            </div>
            <div className="admin-tarjeta__botones">
              <button type="button" className="boton boton--chico" onClick={() => setEditando({ ...f, destacada: !!f.destacada, precio: f.precio ?? '' })}>Editar<span className="solo-lector"> {f.titulo}</span></button>
              <button type="button" className="boton boton--chico boton--peligro" onClick={() => borrar(f)}>Borrar<span className="solo-lector"> {f.titulo}</span></button>
            </div>
          </li>
        ))}
      </ul>
      {visibles < lista.length && <button type="button" className="boton boton--contorno boton--centro" onClick={() => setVisibles(visibles + 24)}>Ver más ({lista.length - visibles})</button>}
    </section>
  );
}


const SECCIONES = {
  agenda: ['Agenda', AgendaAdmin], servicios: ['Servicios', ServiciosAdmin], galeria: ['Galería', Galeria], productos: ['Productos', ProductosAdmin],
  equipo: ['Equipo', EquipoAdmin], pagos: ['Pagos al equipo', PagosEquipo], pedidos: ['Pedidos', PedidosAdmin], graficas: ['Gráficas', ReportesAdmin],
  contrasena: ['Contraseña', ContrasenaAdmin]
};
// Menú del panel ordenado por grupos, cada opción con su ícono
const GRUPOS = [
  ['Salón', ['agenda', 'servicios', 'galeria']],
  ['Tienda', ['productos', 'pedidos']],
  ['Equipo', ['equipo', 'pagos']],
  ['Números', ['graficas']],
  ['Seguridad', ['contrasena']]
];
const ICONOS = {
  agenda: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  servicios: <><path d="M9 3h6v6l3 3v9H6v-9l3-3z" /><path d="M9 14h6" /></>,
  galeria: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 17-5-5-9 8" /></>,
  productos: <><path d="M4 7l8-4 8 4v10l-8 4-8-4z" /><path d="M4 7l8 4 8-4M12 11v10" /></>,
  pedidos: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  equipo: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><circle cx="17.5" cy="9" r="2.5" /><path d="M16 14.6c2.6.2 4.6 2 5.3 4.9" /></>,
  pagos: <><rect x="2.5" y="6" width="19" height="13" rx="2.5" /><circle cx="12" cy="12.5" r="2.5" /><path d="M6 9.5v6M18 9.5v6" /></>,
  graficas: <><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></>,
  contrasena: <><rect x="4" y="10.5" width="16" height="10.5" rx="2.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /><circle cx="12" cy="15.5" r="1.4" /></>
};

// Nombre: Admin
// Descripción: Muestra el panel de la dueña.
// Entrada: Nada.
// Salida: El panel.
// Objetivo: Administrar el salón.
export default function Admin() {
  useTitulo('Panel del salón');
  const [dentro, setDentro] = useState(false);
  const [seccion, setSeccion] = useState('agenda');
  const [inicial, setInicial] = useState(false);

  useEffect(() => { if (sesionAdmin.obtener()) api.admin.verificar().then((r) => { setDentro(true); setInicial(r.contrasenaInicial); }).catch(() => sesionAdmin.cerrar()); }, []);

  if (!dentro) return <div className="contenedor pagina"><Entrar onEntrar={(ini) => { setDentro(true); setInicial(ini); }} /></div>;
  const Seccion = SECCIONES[seccion][1];
  // Nombre: salir
  // Descripción: Cierra la sesión del panel.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Salir.
  const salir = async () => { await api.admin.salir().catch(() => {}); sesionAdmin.cerrar(); setDentro(false); };

  return (
    <div className="contenedor pagina admin">
      <div className="admin__cabeza">
        <h1>Panel del salón</h1>
        <div className="admin__arriba">
          <Campanita seccion={seccion} onIr={(s) => { setSeccion(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          <button type="button" className="enlace enlace--boton" onClick={salir}>Salir</button>
        </div>
      </div>
      {inicial && seccion !== 'contrasena' && (
        <p className="aviso-alerta" role="alert">
          Están usando la contraseña inicial del panel. <button type="button" className="enlace enlace--boton" onClick={() => setSeccion('contrasena')}>Cámbienla aquí</button> para que nadie más pueda entrar.
        </p>
      )}
      <div className="panel-marco">
        <nav className="panel-menu" aria-label="Secciones del panel">
          {GRUPOS.map(([grupo, claves]) => (
            <div key={grupo} className="panel-menu__grupo">
              <p className="panel-menu__titulo">{grupo}</p>
              {claves.map((clave) => (
                <button key={clave} type="button" className="panel-menu__opcion" aria-current={seccion === clave ? 'page' : undefined} onClick={() => { setSeccion(clave); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONOS[clave]}</svg>
                  {SECCIONES[clave][0]}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="panel-contenido" key={seccion}>
          <Seccion onCambiada={() => setInicial(false)} />
        </div>
      </div>
    </div>
  );
}
