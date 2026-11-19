// Servicios del salón: ver, buscar, agregar, modificar precio/oferta/duración, cambiar foto, ocultar y eliminar.
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero } from '../../config.js';
import Modal from '../../components/Modal.jsx';
import Foto from '../../components/Foto.jsx';
import VerMas from '../../components/VerMas.jsx';
import { BotonFoto, ZonaFotos, formData } from './piezasPanel.jsx';

const POR_PAGINA = 8;
const ETIQUETAS = ['', 'Más pedido', 'Nuevo', 'Oferta', 'Especial'];
const VACIO = { nombre: '', descripcion: '', categoria: 'Manos', duracion_min: 60, precio: '', precio_oferta: '', incluye: '', etiqueta: '', es_combo: 0, destacado: 0, activo: 1 };
// Nombre: horas
// Descripción: Escribe minutos como horas.
// Entrada: Los minutos.
// Salida: El texto (1 h 30 min).
// Objetivo: Leer fácil.
const horas = (min) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`);

// Nombre: Editor
// Descripción: Muestra el formulario de un servicio.
// Entrada: Servicio y categorías.
// Salida: El formulario.
// Objetivo: Editar servicios.
function Editor({ servicio, categorias, onCerrar, onGuardado }) {
  const nuevo = !servicio.id;
  const [d, setD] = useState({ ...VACIO, ...servicio, descripcion: servicio.descripcion ?? '', precio_oferta: servicio.precio_oferta ?? '', etiqueta: servicio.etiqueta ?? '', incluye: (servicio.incluye || '').split('|').filter(Boolean).join('\n') });
  const [archivo, setArchivo] = useState([]);
  const [estado, setEstado] = useState({ guardando: false, error: '' });
  // Nombre: set
  // Descripción: Guarda lo que se escribe en un campo.
  // Entrada: El nombre del campo.
  // Salida: Una función para el campo.
  // Objetivo: Llenar el formulario.
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
  // Nombre: marcar
  // Descripción: Marca o desmarca una casilla.
  // Entrada: El nombre del campo.
  // Salida: Una función para la casilla.
  // Objetivo: Llenar el formulario.
  const marcar = (k) => (e) => setD({ ...d, [k]: e.target.checked ? 1 : 0 });
  const oferta = Number(d.precio_oferta) > 0 && Number(d.precio_oferta) < Number(d.precio);
  const pct = oferta ? Math.round((1 - d.precio_oferta / d.precio) * 100) : 0;
  const incluye = d.incluye.split('\n').map((x) => x.trim()).filter(Boolean);

  // Nombre: guardar
  // Descripción: Guarda el servicio.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Crear o editar.
  async function guardar(e) {
    e.preventDefault();
    setEstado({ guardando: true, error: '' });
    try {
      const s = nuevo ? await api.admin.crearServicio(d) : await api.admin.editarServicio(d.id, d);
      if (archivo[0]) await api.admin.imagenServicio(s.id, formData(archivo[0]));
      onGuardado(nuevo ? `«${s.nombre}» se agregó a los servicios.` : 'Cambios guardados.'); onCerrar();
    } catch (err) { setEstado({ guardando: false, error: err.message }); }
  }

  const previa = archivo[0] ? URL.createObjectURL(archivo[0]) : null;
  return (
    <Modal titulo={nuevo ? 'Nuevo servicio' : `Editar «${servicio.nombre}»`} onCerrar={onCerrar} ancho>
      <form className="editor-admin" onSubmit={guardar}>
        <div className="editor-admin__previa">
          <div className="editor-admin__foto">
            {previa ? <img src={previa} alt="" /> : d.imagen ? <Foto archivo={d.imagen} alt="" /> : <div className="servicio-admin__sinfoto" aria-hidden="true">Sin foto</div>}
            {pct > 0 && <span className="editor-admin__pct">-{pct}%</span>}
          </div>
          {nuevo || !d.imagen ? <ZonaFotos archivos={archivo} onCambio={setArchivo} multiple={false} id="s-foto" texto="Foto del servicio" />
            : <BotonFoto texto={archivo[0] ? 'Elegir otra foto' : 'Cambiar foto'} etiqueta={`de ${d.nombre}`} onArchivo={(f) => setArchivo([f])} />}
          <div className="editor-admin__tarjeta">
            {d.etiqueta && <span className="servicio-admin__etiqueta">{d.etiqueta}</span>}
            <p className="editor-admin__nombre">{d.nombre || 'Nombre del servicio'}</p>
            <p><strong className="editor-admin__precio">{dinero(oferta ? d.precio_oferta : d.precio || 0)}</strong>{oferta && <s>{dinero(d.precio)}</s>}</p>
            <p className="tenue">{d.categoria} · {horas(Number(d.duracion_min) || 0)}</p>
            {incluye.length > 0 && <ul className="servicio-admin__incluye">{incluye.slice(0, 4).map((x) => <li key={x}>{x}</li>)}</ul>}
          </div>
        </div>
        <div className="editor-admin__campos">
          <div className="campo"><label htmlFor="s-nombre">Nombre</label><input id="s-nombre" value={d.nombre} onChange={set('nombre')} required /></div>
          <div className="campos-dos">
            <div className="campo"><label htmlFor="s-cat">Categoría</label>
              <input id="s-cat" list="s-cats" value={d.categoria} onChange={set('categoria')} required placeholder="Elige o escribe una nueva" />
              <datalist id="s-cats">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="campo"><label htmlFor="s-dur">Duración (minutos)</label><input id="s-dur" type="number" min="15" max="360" step="5" value={d.duracion_min} onChange={set('duracion_min')} required /></div>
          </div>
          <div className="campos-tres">
            <div className="campo"><label htmlFor="s-precio">Precio (₡)</label><input id="s-precio" type="number" min="1" step="500" value={d.precio} onChange={set('precio')} required /></div>
            <div className="campo"><label htmlFor="s-oferta">Precio de oferta <span className="tenue">(opcional)</span></label><input id="s-oferta" type="number" min="0" step="500" value={d.precio_oferta} onChange={set('precio_oferta')} placeholder="Vacío = sin oferta" /></div>
            <div className="campo"><label htmlFor="s-etq">Etiqueta</label><select id="s-etq" value={d.etiqueta} onChange={set('etiqueta')}>{ETIQUETAS.map((x) => <option key={x} value={x}>{x || 'Ninguna'}</option>)}</select></div>
          </div>
          <div className="campo"><label htmlFor="s-desc">Descripción <span className="tenue">(la ven las clientas)</span></label><textarea id="s-desc" rows="2" value={d.descripcion} onChange={set('descripcion')} /></div>
          <div className="campo"><label htmlFor="s-inc">¿Qué incluye? <span className="tenue">(una cosa por línea)</span></label><textarea id="s-inc" rows="3" value={d.incluye} onChange={set('incluye')} placeholder={'Limado y forma\nCutícula\nEsmaltado'} /></div>
          <div className="casillas-fila">
            <label className="casilla"><input type="checkbox" checked={Boolean(Number(d.activo))} onChange={marcar('activo')} /><span>Visible para reservar</span></label>
            <label className="casilla"><input type="checkbox" checked={Boolean(Number(d.destacado))} onChange={marcar('destacado')} /><span>Destacado en la portada</span></label>
            <label className="casilla"><input type="checkbox" checked={Boolean(Number(d.es_combo))} onChange={marcar('es_combo')} /><span>Es un combo</span></label>
          </div>
          {estado.error && <p role="alert" className="error">{estado.error}</p>}
          <div className="botones">
            <button type="submit" className="boton" disabled={estado.guardando}>{estado.guardando ? 'Guardando…' : nuevo ? 'Agregar servicio' : 'Guardar cambios'}</button>
            <button type="button" className="boton boton--contorno" onClick={onCerrar}>Cancelar</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// Nombre: ServiciosAdmin
// Descripción: Muestra los servicios en el panel.
// Entrada: Nada.
// Salida: La sección.
// Objetivo: Administrar la carta.
export default function ServiciosAdmin() {
  const [datos, setDatos] = useState({ servicios: [], categorias: [] });
  const [buscar, setBuscar] = useState('');
  const [cat, setCat] = useState('');
  const [ver, setVer] = useState('');
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState({ texto: '', error: false });
  // Nombre: cargar
  // Descripción: Carga los servicios.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrar la lista.
  const cargar = () => api.admin.servicios().then(setDatos).catch((e) => setAviso({ texto: e.message, error: true }));
  useEffect(() => { cargar(); }, []);

  const lista = useMemo(() => datos.servicios.filter((s) => (!cat || s.categoria === cat)
    && (!ver || (ver === 'ocultos' ? !s.activo : ver === 'oferta' ? s.precio_oferta : s.activo))
    && (!buscar || `${s.nombre} ${s.descripcion || ''}`.toLowerCase().includes(buscar.toLowerCase()))), [datos, cat, ver, buscar]);
  const paginas = Math.ceil(lista.length / POR_PAGINA);
  const serviciosPagina = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  useEffect(() => { if (pagina > paginas) setPagina(Math.max(paginas, 1)); }, [pagina, paginas]);
  const cifras = useMemo(() => ({
    activos: datos.servicios.filter((s) => s.activo).length,
    ofertas: datos.servicios.filter((s) => s.activo && s.precio_oferta).length,
    citas: datos.servicios.reduce((n, s) => n + s.citas, 0),
    top: [...datos.servicios].sort((a, b) => b.citas - a.citas)[0]
  }), [datos]);

  // Nombre: foto
  // Descripción: Cambia la foto de un servicio.
  // Entrada: El servicio y la foto.
  // Salida: Nada.
  // Objetivo: Actualizarla.
  const foto = async (s, archivo) => {
    try { await api.admin.imagenServicio(s.id, formData(archivo)); setAviso({ texto: `Foto de «${s.nombre}» actualizada.` }); cargar(); } catch (e) { setAviso({ texto: e.message, error: true }); }
  };
  // Nombre: alternar
  // Descripción: Muestra u oculta un servicio.
  // Entrada: El servicio.
  // Salida: Nada.
  // Objetivo: Pausar servicios.
  const alternar = async (s) => {
    try { await api.admin.editarServicio(s.id, { ...s, activo: s.activo ? 0 : 1 }); setAviso({ texto: s.activo ? `«${s.nombre}» quedó oculto: ya no aparece para reservar.` : `«${s.nombre}» vuelve a aparecer para reservar.` }); cargar(); } catch (e) { setAviso({ texto: e.message, error: true }); }
  };
  // Nombre: borrar
  // Descripción: Borra un servicio.
  // Entrada: El servicio.
  // Salida: Nada.
  // Objetivo: Quitarlo.
  const borrar = async (s) => {
    if (!window.confirm(`¿Eliminar el servicio «${s.nombre}»?`)) return;
    try {
      const r = await api.admin.borrarServicio(s.id);
      setAviso({ texto: r.resultado === 'oculto' ? `«${s.nombre}» tiene citas en el historial: quedó oculto en vez de borrarse.` : `«${s.nombre}» se eliminó.` });
      cargar();
    } catch (e) { setAviso({ texto: e.message, error: true }); }
  };

  return (
    <section aria-labelledby="t-serv" className="seccion-admin">
      <div className="admin__cabeza">
        <div><h2 id="t-serv">Servicios</h2><p className="tenue">Lo que las clientas ven en «Servicios» y al reservar.</p></div>
        <button type="button" className="boton" onClick={() => setEditando({})}>+ Nuevo servicio</button>
      </div>
      <ul className="cifras-admin">
        <li><strong>{cifras.activos}</strong>servicios visibles</li>
        <li className="cifras-admin--ambar"><strong>{cifras.ofertas}</strong>con oferta</li>
        <li><strong>{cifras.citas}</strong>citas en total</li>
        <li className="cifras-admin--verde"><strong className="cifras-admin__texto">{cifras.top?.nombre || '—'}</strong>el más pedido</li>
      </ul>
      <div className="filtros-admin">
        <label className="filtros-admin__buscar"><span className="solo-lector">Buscar servicio</span><input type="search" value={buscar} onChange={(e) => { setBuscar(e.target.value); setPagina(1); }} placeholder="Buscar servicio" /></label>
        <label><span className="solo-lector">Categoría</span><select value={cat} onChange={(e) => { setCat(e.target.value); setPagina(1); }}><option value="">Todas las categorías</option>{datos.categorias.map((c) => <option key={c}>{c}</option>)}</select></label>
        <div className="barra-chips barra-chips--compacta" role="group" aria-label="Mostrar">
          {[['', 'Todos'], ['visibles', 'Visibles'], ['oferta', 'Con oferta'], ['ocultos', 'Ocultos']].map(([k, t]) => <button key={k} type="button" className={`chip-filtro ${ver === k ? 'chip-filtro--activo' : ''}`} onClick={() => { setVer(k); setPagina(1); }}>{t}</button>)}
        </div>
      </div>
      {aviso.texto && <p role={aviso.error ? 'alert' : 'status'} className={aviso.error ? 'error' : 'aviso-ok'}>{aviso.texto}</p>}
      <p className="tenue">{lista.length} servicios</p>
      <ul className="admin-tarjetas admin-tarjetas--servicios">
        {serviciosPagina.map((s, i) => {
          const pct = s.precio_oferta ? Math.round((1 - s.precio_oferta / s.precio) * 100) : 0;
          return (
            <li key={s.id} className={`admin-tarjeta servicio-admin ${s.activo ? '' : 'admin-tarjeta--inactiva'}`} style={{ '--n': i % 24 }}>
              <div className="admin-tarjeta__foto">
                {s.imagen ? <Foto archivo={s.imagen} alt={s.nombre} /> : <div className="servicio-admin__sinfoto" aria-hidden="true">Sin foto</div>}
                {!s.activo && <span className="admin-tarjeta__sello">Oculto</span>}
                {s.activo && s.etiqueta ? <span className="admin-tarjeta__sello admin-tarjeta__sello--oro">{s.etiqueta}</span> : null}
                {pct > 0 && <span className="servicio-admin__pct">-{pct}%</span>}
              </div>
              <div className="admin-tarjeta__info">
                <p className="servicio-admin__cat">{s.categoria} · {horas(s.duracion_min)}</p>
                <p className="admin-tarjeta__nombre">{s.nombre}</p>
                <p className="servicio-admin__precio"><strong>{dinero(s.precio_oferta || s.precio)}</strong>{s.precio_oferta ? <s>{dinero(s.precio)}</s> : null}</p>
                <p className="tenue">{s.citas} citas · {dinero(s.vendido)} vendido</p>
              </div>
              <div className="admin-tarjeta__botones">
                <button type="button" className="boton boton--chico" onClick={() => setEditando(s)}>Editar<span className="solo-lector"> {s.nombre}</span></button>
                <BotonFoto etiqueta={`de ${s.nombre}`} texto="Foto" onArchivo={(f) => foto(s, f)} />
                <button type="button" className="boton boton--chico boton--contorno" onClick={() => alternar(s)}>{s.activo ? 'Ocultar' : 'Mostrar'}<span className="solo-lector"> {s.nombre}</span></button>
                <button type="button" className="boton boton--chico boton--peligro" onClick={() => borrar(s)} aria-label={`Eliminar ${s.nombre}`}>Eliminar</button>
              </div>
            </li>
          );
        })}
      </ul>
      <VerMas pagina={pagina} paginas={paginas} onCambiar={(n) => { setPagina(n); document.getElementById('t-serv')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} />
      {editando && <Editor servicio={editando} categorias={datos.categorias} onCerrar={() => setEditando(null)} onGuardado={(t) => { setAviso({ texto: t }); cargar(); }} />}
    </section>
  );
}
