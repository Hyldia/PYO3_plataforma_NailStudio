// Servicios del salón: ver, buscar, agregar, modificar precio/oferta/duración, cambiar foto, ocultar y eliminar.
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero } from '../../config.js';
import Modal from '../../components/Modal.jsx';
import Foto from '../../components/Foto.jsx';
import VerMas from '../../components/VerMas.jsx';
import { BotonFoto, ZonaFotos, formData } from './piezasPanel.jsx';
import { usePorPagina } from '../../lib/hooks.js';

const POR_PAGINA_BASE = 8;
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
  const [datos, setDatos] = useState({ ...VACIO, ...servicio, descripcion: servicio.descripcion ?? '', precio_oferta: servicio.precio_oferta ?? '', etiqueta: servicio.etiqueta ?? '', incluye: (servicio.incluye || '').split('|').filter(Boolean).join('\n') });
  const [archivo, setArchivo] = useState([]);
  const [estado, setEstado] = useState({ guardando: false, error: '' });
  // Nombre: set
  // Descripción: Guarda lo que se escribe en un campo.
  // Entrada: El nombre del campo.
  // Salida: Una función para el campo.
  // Objetivo: Llenar el formulario.
  const set = (campo) => (evento) => setDatos({ ...datos, [campo]: evento.target.value });
  // Nombre: marcar
  // Descripción: Marca o desmarca una casilla.
  // Entrada: El nombre del campo.
  // Salida: Una función para la casilla.
  // Objetivo: Llenar el formulario.
  const marcar = (campo) => (evento) => setDatos({ ...datos, [campo]: evento.target.checked ? 1 : 0 });
  const oferta = Number(datos.precio_oferta) > 0 && Number(datos.precio_oferta) < Number(datos.precio);
  const pct = oferta ? Math.round((1 - datos.precio_oferta / datos.precio) * 100) : 0;
  const incluye = datos.incluye.split('\n').map((parte) => parte.trim()).filter(Boolean);

  // Nombre: guardar
  // Descripción: Guarda el servicio.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Crear o editar.
  async function guardar(evento) {
    evento.preventDefault();
    setEstado({ guardando: true, error: '' });
    try {
      const servicioGuardado = nuevo ? await api.admin.crearServicio(datos) : await api.admin.editarServicio(datos.id, datos);
      if (archivo[0]) await api.admin.imagenServicio(servicioGuardado.id, formData(archivo[0]));
      onGuardado(nuevo ? `«${servicioGuardado.nombre}» se agregó a los servicios.` : 'Cambios guardados.'); onCerrar();
    } catch (err) { setEstado({ guardando: false, error: err.message }); }
  }

  const previa = archivo[0] ? URL.createObjectURL(archivo[0]) : null;
  return (
    <Modal titulo={nuevo ? 'Nuevo servicio' : `Editar «${servicio.nombre}»`} onCerrar={onCerrar} ancho>
      <form className="editor-admin" onSubmit={guardar}>
        <div className="editor-admin__previa">
          <div className="editor-admin__foto">
            {previa ? <img src={previa} alt="" /> : datos.imagen ? <Foto archivo={datos.imagen} alt="" /> : <div className="servicio-admin__sinfoto" aria-hidden="true">Sin foto</div>}
            {pct > 0 && <span className="editor-admin__pct">-{pct}%</span>}
          </div>
          {nuevo || !datos.imagen ? <ZonaFotos archivos={archivo} onCambio={setArchivo} multiple={false} id="s-foto" texto="Foto del servicio" />
            : <BotonFoto texto={archivo[0] ? 'Elegir otra foto' : 'Cambiar foto'} etiqueta={`de ${datos.nombre}`} onArchivo={(archivo) => setArchivo([archivo])} />}
          <div className="editor-admin__tarjeta">
            {datos.etiqueta && <span className="servicio-admin__etiqueta">{datos.etiqueta}</span>}
            <p className="editor-admin__nombre">{datos.nombre || 'Nombre del servicio'}</p>
            <p><strong className="editor-admin__precio">{dinero(oferta ? datos.precio_oferta : datos.precio || 0)}</strong>{oferta && <s>{dinero(datos.precio)}</s>}</p>
            <p className="tenue">{datos.categoria} · {horas(Number(datos.duracion_min) || 0)}</p>
            {incluye.length > 0 && <ul className="servicio-admin__incluye">{incluye.slice(0, 4).map((detalle) => <li key={detalle}>{detalle}</li>)}</ul>}
          </div>
        </div>
        <div className="editor-admin__campos">
          <div className="campo"><label htmlFor="s-nombre">Nombre</label><input id="s-nombre" value={datos.nombre} onChange={set('nombre')} required /></div>
          <div className="campos-dos">
            <div className="campo"><label htmlFor="s-cat">Categoría</label>
              <input id="s-cat" list="s-cats" value={datos.categoria} onChange={set('categoria')} required placeholder="Elige o escribe una nueva" />
              <datalist id="s-cats">{categorias.map((categoria) => <option key={categoria} value={categoria} />)}</datalist>
            </div>
            <div className="campo"><label htmlFor="s-dur">Duración (minutos)</label><input id="s-dur" type="number" min="15" max="360" step="5" value={datos.duracion_min} onChange={set('duracion_min')} required /></div>
          </div>
          <div className="campos-tres">
            <div className="campo"><label htmlFor="s-precio">Precio (₡)</label><input id="s-precio" type="number" min="1" step="1" value={datos.precio} onChange={set('precio')} required /></div>
            <div className="campo"><label htmlFor="s-oferta">Precio de oferta <span className="tenue">(opcional)</span></label><input id="s-oferta" type="number" min="0" step="1" value={datos.precio_oferta} onChange={set('precio_oferta')} placeholder="Vacío = sin oferta" /></div>
            <div className="campo"><label htmlFor="s-etq">Etiqueta</label><select id="s-etq" value={datos.etiqueta} onChange={set('etiqueta')}>{ETIQUETAS.map((etiqueta) => <option key={etiqueta} value={etiqueta}>{etiqueta || 'Ninguna'}</option>)}</select></div>
          </div>
          <div className="campo"><label htmlFor="s-desc">Descripción <span className="tenue">(la ven las clientas)</span></label><textarea id="s-desc" rows="2" value={datos.descripcion} onChange={set('descripcion')} /></div>
          <div className="campo"><label htmlFor="s-inc">¿Qué incluye? <span className="tenue">(una cosa por línea)</span></label><textarea id="s-inc" rows="3" value={datos.incluye} onChange={set('incluye')} placeholder={'Limado y forma\nCutícula\nEsmaltado'} /></div>
          <div className="casillas-fila">
            <label className="casilla"><input type="checkbox" checked={Boolean(Number(datos.activo))} onChange={marcar('activo')} /><span>Visible para reservar</span></label>
            <label className="casilla"><input type="checkbox" checked={Boolean(Number(datos.destacado))} onChange={marcar('destacado')} /><span>Destacado en la portada</span></label>
            <label className="casilla"><input type="checkbox" checked={Boolean(Number(datos.es_combo))} onChange={marcar('es_combo')} /><span>Es un combo</span></label>
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
  const [rejilla, POR_PAGINA] = usePorPagina(2, POR_PAGINA_BASE); // filas completas, sin huecos
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
  const cargar = () => api.admin.servicios().then(setDatos).catch((fallo) => setAviso({ texto: fallo.message, error: true }));
  useEffect(() => { cargar(); }, []);

  const lista = useMemo(() => datos.servicios.filter((servicio) => (!cat || servicio.categoria === cat)
    && (!ver || (ver === 'ocultos' ? !servicio.activo : ver === 'oferta' ? servicio.precio_oferta : ver === 'sinfoto' ? !servicio.imagen : ver === 'hombres' ? servicio.categoria === 'Hombres' : servicio.activo))
    && (!buscar || `${servicio.nombre} ${servicio.descripcion || ''}`.toLowerCase().includes(buscar.toLowerCase()))), [datos, cat, ver, buscar]);
  const paginas = Math.ceil(lista.length / POR_PAGINA);
  const serviciosPagina = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  useEffect(() => { if (pagina > paginas) setPagina(Math.max(paginas, 1)); }, [pagina, paginas]);
  const cifras = useMemo(() => ({
    activos: datos.servicios.filter((servicio) => servicio.activo).length,
    ofertas: datos.servicios.filter((servicio) => servicio.activo && servicio.precio_oferta).length,
    citas: datos.servicios.reduce((suma, servicio) => suma + servicio.citas, 0),
    top: [...datos.servicios].sort((a, b) => b.citas - a.citas)[0]
  }), [datos]);

  // Nombre: foto
  // Descripción: Cambia la foto de un servicio.
  // Entrada: El servicio y la foto.
  // Salida: Nada.
  // Objetivo: Actualizarla.
  const foto = async (servicio, archivo) => {
    try { await api.admin.imagenServicio(servicio.id, formData(archivo)); setAviso({ texto: `Foto de «${servicio.nombre}» actualizada.` }); cargar(); } catch (fallo) { setAviso({ texto: fallo.message, error: true }); }
  };
  // Nombre: alternar
  // Descripción: Muestra u oculta un servicio.
  // Entrada: El servicio.
  // Salida: Nada.
  // Objetivo: Pausar servicios.
  const alternar = async (servicio) => {
    try { await api.admin.editarServicio(servicio.id, { ...servicio, activo: servicio.activo ? 0 : 1 }); setAviso({ texto: servicio.activo ? `«${servicio.nombre}» quedó oculto: ya no aparece para reservar.` : `«${servicio.nombre}» vuelve a aparecer para reservar.` }); cargar(); } catch (fallo) { setAviso({ texto: fallo.message, error: true }); }
  };
  // Nombre: borrar
  // Descripción: Borra un servicio.
  // Entrada: El servicio.
  // Salida: Nada.
  // Objetivo: Quitarlo.
  const borrar = async (servicio) => {
    if (!window.confirm(`¿Eliminar el servicio «${servicio.nombre}»?`)) return;
    try {
      const respuesta = await api.admin.borrarServicio(servicio.id);
      setAviso({ texto: respuesta.resultado === 'oculto' ? `«${servicio.nombre}» tiene citas en el historial: quedó oculto en vez de borrarse.` : `«${servicio.nombre}» se eliminó.` });
      cargar();
    } catch (fallo) { setAviso({ texto: fallo.message, error: true }); }
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
        <label className="filtros-admin__buscar"><span className="solo-lector">Buscar servicio</span><input type="search" value={buscar} onChange={(evento) => { setBuscar(evento.target.value); setPagina(1); }} placeholder="Buscar servicio" /></label>
        <label><span className="solo-lector">Categoría</span><select value={cat} onChange={(evento) => { setCat(evento.target.value); setPagina(1); }}><option value="">Todas las categorías</option>{datos.categorias.map((categoria) => <option key={categoria}>{categoria}</option>)}</select></label>
        <div className="barra-chips barra-chips--compacta" role="group" aria-label="Mostrar">
          {[['', 'Todos'], ['visibles', 'Visibles'], ['oferta', 'Con oferta'], ['ocultos', 'Ocultos'], ['sinfoto', 'Sin foto'], ['hombres', 'Para hombres']].map(([k, t]) => <button key={k} type="button" className={`chip-filtro ${ver === k ? 'chip-filtro--activo' : ''}`} onClick={() => { setVer(k); setPagina(1); }}>{t}</button>)}
        </div>
      </div>
      {aviso.texto && <p role={aviso.error ? 'alert' : 'status'} className={aviso.error ? 'error' : 'aviso-ok'}>{aviso.texto}</p>}
      <p className="tenue">{lista.length} servicios</p>
      <ul ref={rejilla} className="admin-tarjetas admin-tarjetas--servicios">
        {serviciosPagina.map((servicio, i) => {
          const pct = servicio.precio_oferta ? Math.round((1 - servicio.precio_oferta / servicio.precio) * 100) : 0;
          return (
            <li key={servicio.id} className={`admin-tarjeta servicio-admin ${servicio.activo ? '' : 'admin-tarjeta--inactiva'}`} style={{ '--n': i % 24 }}>
              <div className="admin-tarjeta__foto">
                {servicio.imagen ? <Foto archivo={servicio.imagen} alt={servicio.nombre} /> : <div className="servicio-admin__sinfoto" aria-hidden="true">Sin foto</div>}
                {!servicio.activo && <span className="admin-tarjeta__sello">Oculto</span>}
                {servicio.activo && servicio.etiqueta ? <span className="admin-tarjeta__sello admin-tarjeta__sello--oro">{servicio.etiqueta}</span> : null}
                {pct > 0 && <span className="servicio-admin__pct">-{pct}%</span>}
              </div>
              <div className="admin-tarjeta__info">
                <p className="servicio-admin__cat">{servicio.categoria} · {horas(servicio.duracion_min)}</p>
                <p className="admin-tarjeta__nombre">{servicio.nombre}</p>
                <p className="servicio-admin__precio"><strong>{dinero(servicio.precio_oferta || servicio.precio)}</strong>{servicio.precio_oferta ? <s>{dinero(servicio.precio)}</s> : null}</p>
                <p className="tenue">{servicio.citas} citas · {dinero(servicio.vendido)} vendido</p>
              </div>
              <div className="admin-tarjeta__botones">
                <button type="button" className="boton boton--chico" onClick={() => setEditando(servicio)}>Editar<span className="solo-lector"> {servicio.nombre}</span></button>
                <BotonFoto etiqueta={`de ${servicio.nombre}`} texto="Foto" onArchivo={(archivo) => foto(servicio, archivo)} />
                <button type="button" className="boton boton--chico boton--contorno" onClick={() => alternar(servicio)}>{servicio.activo ? 'Ocultar' : 'Mostrar'}<span className="solo-lector"> {servicio.nombre}</span></button>
                <button type="button" className="boton boton--chico boton--peligro" onClick={() => borrar(servicio)} aria-label={`Eliminar ${servicio.nombre}`}>Eliminar</button>
              </div>
            </li>
          );
        })}
      </ul>
      <VerMas pagina={pagina} paginas={paginas} onCambiar={(numero) => { setPagina(numero); document.getElementById('t-serv')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} />
      {editando && <Editor servicio={editando} categorias={datos.categorias} onCerrar={() => setEditando(null)} onGuardado={(texto) => { setAviso({ texto: texto }); cargar(); }} />}
    </section>
  );
}
