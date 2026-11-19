// Productos de la tienda: buscar, crear, editar, cambiar foto y eliminar.
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero } from '../../config.js';
import Modal from '../../components/Modal.jsx';
import ProductoImagen from '../../components/ProductoImagen.jsx';
import VerMas from '../../components/VerMas.jsx';
import { BotonFoto, ZonaFotos, formData } from './piezasPanel.jsx';
import { CATEGORIAS, claveCategoria, circuloDeTienda } from '../../lib/categoriasPortada.js';
import { usePorPagina } from '../../lib/hooks.js';

// Fotos de los círculos de categorías que salen en la portada
// Nombre: FotosCategorias
// Descripción: Muestra las fotos de cada categoría.
// Entrada: Nada.
// Salida: La sección.
// Objetivo: Elegir portadas.
function FotosCategorias() {
  const [portadas, setPortadas] = useState({});
  const [aviso, setAviso] = useState('');
  const [tienda, setTienda] = useState([]);
  // Nombre: (efecto) categorías de la tienda
  // Descripción: Trae las categorías que tienen productos.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrar también los círculos de la tienda.
  useEffect(() => { api.categoriasProductos().then((l) => setTienda(l.map((c) => c.categoria || c.valor || c.nombre || c))).catch(() => {}); }, []);
  const [circulos, setCirculos] = useState({ ocultos: [], inicioExtra: [] });
  const [paraAgregar, setParaAgregar] = useState('');
  useEffect(() => { api.circulos().then(setCirculos).catch(() => {}); }, []);
  // Juntamos los círculos del Inicio (fijos + agregados) y los de la Tienda; los que comparten categoría usan la misma foto
  const delInicio = [...CATEGORIAS, ...circulos.inicioExtra.filter((n) => !CATEGORIAS.some((c) => claveCategoria(c) === n)).map(circuloDeTienda)]
    .map((c) => ({ ...c, clave: claveCategoria(c), agregado: circulos.inicioExtra.includes(claveCategoria(c)) }));
  const lista = [
    ...delInicio.map((c) => ({ ...c, donde: tienda.includes(c.clave) ? 'Inicio y Tienda' : 'Inicio' })),
    ...tienda.filter((n) => typeof n === 'string' && !delInicio.some((c) => c.clave === n)).map((n) => ({ ...circuloDeTienda(n), donde: 'Tienda' }))
  ];
  const sePuedenAgregar = tienda.filter((n) => typeof n === 'string' && !delInicio.some((c) => c.clave === n));
  // Nombre: guardarCirculos
  // Descripción: Guarda los cambios de círculos (ocultos o agregados al Inicio).
  // Entrada: La configuración nueva y el aviso a mostrar.
  // Salida: Nada.
  // Objetivo: Agregar o eliminar círculos sin tocar el código.
  const guardarCirculos = async (nueva, texto) => {
    try { setCirculos(await api.admin.guardarCirculos(nueva)); setAviso(texto); } catch (error) { setAviso(error.message); }
  };
  // Nombre: alternarOculto
  // Descripción: Oculta o vuelve a mostrar un círculo.
  // Entrada: El círculo.
  // Salida: Nada.
  // Objetivo: Eliminar un círculo de la vista sin borrar los productos.
  const alternarOculto = (c) => {
    const oculto = circulos.ocultos.includes(c.clave);
    guardarCirculos({ ...circulos, ocultos: oculto ? circulos.ocultos.filter((n) => n !== c.clave) : [...circulos.ocultos, c.clave] },
      oculto ? `«${c.nombre}» se vuelve a mostrar.` : `«${c.nombre}» ya no se muestra en ${c.donde}. Sus productos siguen en la tienda.`);
  };
  // Nombre: agregarAlInicio
  // Descripción: Agrega al Inicio el círculo de una categoría de la tienda.
  // Entrada: Nada (usa la categoría elegida en la lista).
  // Salida: Nada.
  // Objetivo: Agregar círculos nuevos.
  const agregarAlInicio = () => {
    if (!paraAgregar) return;
    guardarCirculos({ ...circulos, inicioExtra: [...circulos.inicioExtra, paraAgregar] }, `«${paraAgregar}» ahora también sale en el Inicio.`);
    setParaAgregar('');
  };
  // Nombre: quitarDelInicio
  // Descripción: Quita del Inicio un círculo que se había agregado.
  // Entrada: El círculo.
  // Salida: Nada.
  // Objetivo: Deshacer un círculo agregado.
  const quitarDelInicio = (c) => guardarCirculos({ ...circulos, inicioExtra: circulos.inicioExtra.filter((n) => n !== c.clave) }, `«${c.nombre}» ya no sale en el Inicio.`);
  // Nombre: cargar
  // Descripción: Carga las portadas.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrarlas.
  const cargar = () => api.portadas().then(setPortadas).catch(() => {});
  useEffect(() => { cargar(); }, []);
  // Nombre: subir
  // Descripción: Sube una portada.
  // Entrada: La categoría y la foto.
  // Salida: Nada.
  // Objetivo: Cambiarla.
  const subir = async (c, archivo) => {
    try { await api.admin.fotoPortada(c.clave, formData(archivo)); setAviso(`Listo: «${c.nombre}» tiene foto nueva en la portada.`); cargar(); } catch (error) { setAviso(error.message); }
  };
  // Nombre: quitar
  // Descripción: Quita una portada.
  // Entrada: La categoría.
  // Salida: Nada.
  // Objetivo: Volver a la automática.
  const quitar = async (c) => { await api.admin.quitarFotoPortada(c.clave).catch(() => {}); setAviso(`«${c.nombre}» vuelve a usar la foto de su producto más vendido.`); cargar(); };
  return (
    <details className="portadas-admin">
      <summary>
        <span><b>Fotos de los círculos de categorías</b><small>Los círculos de «Compra por categoría» del Inicio y de la Tienda. Cambia la foto, oculta un círculo o agrega uno nuevo.</small></span>
      </summary>
      {aviso && <p role="status" className="aviso-ok">{aviso}</p>}
      <div className="portadas-admin__agregar">
        <label htmlFor="circulo-nuevo"><b>Agregar un círculo al Inicio</b><small>Elige una categoría de la tienda que todavía no sale en el Inicio.</small></label>
        <select id="circulo-nuevo" value={paraAgregar} onChange={(evento) => setParaAgregar(evento.target.value)} disabled={!sePuedenAgregar.length}>
          <option value="">{sePuedenAgregar.length ? 'Elegir categoría' : 'Ya están todas en el Inicio'}</option>
          {sePuedenAgregar.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <button type="button" className="boton boton--chico" onClick={agregarAlInicio} disabled={!paraAgregar}>+ Agregar</button>
        <p className="portadas-admin__nota">¿Una categoría nueva? Crea un producto abajo con el nombre de la categoría nueva: su círculo aparece solo en la Tienda.</p>
      </div>
      <ul style={{ '--tarjetas': [5, 4, 6, 3].find((columnas) => lista.length % columnas === 0) || 5 }}>
        {lista.map((c) => (
          <li key={c.clave} className={`portada-tarjeta ${circulos.ocultos.includes(c.clave) ? 'portada-tarjeta--oculta' : ''}`}>
            <span className={`portada-tarjeta__lugar portada-tarjeta__lugar--${circulos.ocultos.includes(c.clave) ? 'oculto' : c.donde === 'Tienda' ? 'tienda' : 'inicio'}`}>
              {circulos.ocultos.includes(c.clave) ? 'Oculto' : c.donde}
            </span>
            <span className="portadas-admin__circulo"><ProductoImagen producto={{ nombre: '', tipo: c.tipo, color: c.color, imagen: portadas[c.clave] || null }} /></span>
            <p className="portada-tarjeta__nombre">{c.nombre}</p>
            <div className="portada-tarjeta__acciones">
              <BotonFoto texto="Cambiar foto" etiqueta={`del círculo ${c.nombre}`} clase="portada-tarjeta__boton portada-tarjeta__boton--principal" onArchivo={(f) => subir(c, f)} />
              <div className="portada-tarjeta__fila">
                <button type="button" className="portada-tarjeta__boton" onClick={() => quitar(c)} title="Volver a la foto del producto más vendido">Automática</button>
                <button type="button" className={`portada-tarjeta__boton ${circulos.ocultos.includes(c.clave) ? 'portada-tarjeta__boton--mostrar' : 'portada-tarjeta__boton--ocultar'}`}
                        onClick={() => (c.agregado ? quitarDelInicio(c) : alternarOculto(c))}>
                  {c.agregado ? 'Quitar' : circulos.ocultos.includes(c.clave) ? 'Mostrar' : 'Ocultar'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

const VACIO = { nombre: '', categoria: '', marca: 'AH Nails', precio: '', precio_anterior: '', stock: '10', descripcion: '' };
const POR_PAGINA_BASE = 8;

// Nombre: Editor
// Descripción: Muestra el formulario de un producto.
// Entrada: Producto y categorías.
// Salida: El formulario.
// Objetivo: Editar productos.
function Editor({ producto, categorias, onCerrar, onGuardado }) {
  const nuevo = !producto.id;
  const [d, setD] = useState({ ...VACIO, ...producto, precio_anterior: producto.precio_anterior ?? '', descripcion: producto.descripcion ?? '' });
  const [archivo, setArchivo] = useState([]);
  const [estado, setEstado] = useState({ guardando: false, error: '' });
  // Nombre: set
  // Descripción: Guarda lo que se escribe en un campo.
  // Entrada: El nombre del campo.
  // Salida: Una función para el campo.
  // Objetivo: Llenar el formulario.
  const set = (k) => (evento) => setD({ ...d, [k]: evento.target.value });
  const descuento = d.precio_anterior && Number(d.precio_anterior) > Number(d.precio) ? Math.round((1 - d.precio / d.precio_anterior) * 100) : 0;

  // Nombre: guardar
  // Descripción: Guarda el producto.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Crear o editar.
  async function guardar(e) {
    e.preventDefault();
    setEstado({ guardando: true, error: '' });
    try {
      let p = nuevo ? await api.admin.crearProducto(d) : await api.admin.editarProducto(d.id, d);
      if (archivo[0]) p = await api.admin.imagenProducto(p.id, formData(archivo[0])).then(() => p);
      onGuardado(); onCerrar();
    } catch (err) { setEstado({ guardando: false, error: err.message }); }
  }

  const previa = archivo[0] ? URL.createObjectURL(archivo[0]) : null;
  return (
    <Modal titulo={nuevo ? 'Nuevo producto' : `Editar «${producto.nombre}»`} onCerrar={onCerrar} ancho>
      <form className="editor-admin" onSubmit={guardar}>
        <div className="editor-admin__previa">
          <div className="editor-admin__foto">
            {previa ? <img src={previa} alt="" /> : <ProductoImagen producto={{ ...producto, ...d }} />}
            {descuento > 0 && <span className="editor-admin__pct">-{descuento}%</span>}
          </div>
          {nuevo ? <ZonaFotos archivos={archivo} onCambio={setArchivo} multiple={false} id="p-foto" texto="Foto del producto" />
            : <BotonFoto texto={archivo[0] ? 'Elegir otra foto' : 'Cambiar foto'} onArchivo={(f) => setArchivo([f])} />}
          <div className="editor-admin__tarjeta">
            <p className="editor-admin__nombre">{d.nombre || 'Nombre del producto'}</p>
            <p><strong className="editor-admin__precio">{d.precio ? dinero(d.precio) : '₡0'}</strong>{descuento > 0 && <s>{dinero(d.precio_anterior)}</s>}</p>
            <p className="tenue">{Number(d.stock) === 0 ? 'Agotado' : Number(d.stock) < 10 ? `Solo quedan ${d.stock}` : `${d.stock} en stock`}</p>
          </div>
        </div>
        <div className="editor-admin__campos">
          <div className="campo"><label htmlFor="p-nombre">Nombre</label><input id="p-nombre" value={d.nombre} onChange={set('nombre')} required /></div>
          <div className="campos-dos">
            <div className="campo"><label htmlFor="p-cat">Categoría</label>
              <input id="p-cat" list="p-cats" value={d.categoria} onChange={set('categoria')} required placeholder="Elige o escribe una nueva" />
              <datalist id="p-cats">{categorias.map((c) => <option key={c.valor} value={c.valor} />)}</datalist>
            </div>
            <div className="campo"><label htmlFor="p-marca">Marca</label><input id="p-marca" value={d.marca || ''} onChange={set('marca')} /></div>
          </div>
          <div className="campos-tres">
            <div className="campo"><label htmlFor="p-precio">Precio (₡)</label><input id="p-precio" type="number" min="1" step="1" value={d.precio} onChange={set('precio')} required /></div>
            <div className="campo"><label htmlFor="p-ant">Precio antes <span className="tenue">(oferta)</span></label><input id="p-ant" type="number" min="0" step="1" value={d.precio_anterior} onChange={set('precio_anterior')} placeholder="Vacío = sin oferta" /></div>
            <div className="campo"><label htmlFor="p-stock">Stock <span className="tenue">(0 = agotado)</span></label><input id="p-stock" type="number" min="0" value={d.stock} onChange={set('stock')} required />
              <button type="button" className="enlace enlace--boton enlace--chico" onClick={() => setD({ ...d, stock: '0' })}>Marcar agotado</button></div>
          </div>
          <div className="campo"><label htmlFor="p-desc">Descripción</label><textarea id="p-desc" rows="3" value={d.descripcion} onChange={set('descripcion')} /></div>
          {estado.error && <p role="alert" className="error">{estado.error}</p>}
          <div className="botones">
            <button type="submit" className="boton" disabled={estado.guardando}>{estado.guardando ? 'Guardando…' : nuevo ? 'Crear producto' : 'Guardar cambios'}</button>
            <button type="button" className="boton boton--contorno" onClick={onCerrar}>Cancelar</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// Nombre: ProductosAdmin
// Descripción: Muestra los productos en el panel.
// Entrada: Nada.
// Salida: La sección.
// Objetivo: Administrar la tienda.
export default function ProductosAdmin() {
  const [rejilla, POR_PAGINA] = usePorPagina(2, POR_PAGINA_BASE); // filas completas, sin huecos
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [stock, setStock] = useState('');
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState({ texto: '', error: false });

  // Nombre: cargar
  // Descripción: Carga los productos.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrar la lista.
  const cargar = () => api.admin.productos().then(setProductos).catch((e) => setAviso({ texto: e.message, error: true }));
  useEffect(() => { cargar(); api.categoriasProductos().then(setCategorias).catch(() => {}); }, []);
  const lista = useMemo(() => productos.filter((p) =>
    (!cat || p.categoria === cat) &&
    (!stock || (stock === 'agotado' ? p.stock === 0 : stock === 'poco' ? p.stock > 0 && p.stock < 10 : stock === 'sinfoto' ? !p.imagen : stock === 'hombres' ? p.categoria === 'Para hombres' : p.precio_anterior)) &&
    (!q || `${p.nombre} ${p.marca || ''} ${p.id}`.toLowerCase().includes(q.toLowerCase()))), [productos, q, cat, stock]);
  const paginas = Math.ceil(lista.length / POR_PAGINA);
  const productosPagina = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  useEffect(() => { if (pagina > paginas) setPagina(Math.max(paginas, 1)); }, [pagina, paginas]);

  // Nombre: fotoNueva
  // Descripción: Cambia la foto de un producto.
  // Entrada: El producto y la foto.
  // Salida: Nada.
  // Objetivo: Actualizarla.
  const fotoNueva = async (p, archivo) => {
    try { await api.admin.imagenProducto(p.id, formData(archivo)); setAviso({ texto: `Foto de «${p.nombre}» actualizada.` }); cargar(); } catch (e) { setAviso({ texto: e.message, error: true }); }
  };
  // Marcar agotado (stock 0) o reponer unidades sin abrir el editor
  // Nombre: fijarStock
  // Descripción: Cambia el stock.
  // Entrada: El producto y la cantidad.
  // Salida: Nada.
  // Objetivo: Llevar inventario.
  const fijarStock = async (p, stock) => {
    try {
      await api.admin.editarProducto(p.id, { ...p, stock, precio_anterior: p.precio_anterior ?? '' });
      setAviso({ texto: stock === 0 ? `«${p.nombre}» quedó agotado: en la tienda sale con el sello «Agotado» y no se puede comprar.` : `«${p.nombre}» ahora tiene ${stock} en stock.` });
      cargar();
    } catch (e) { setAviso({ texto: e.message, error: true }); }
  };
  // Nombre: reponer
  // Descripción: Repone el stock.
  // Entrada: El producto.
  // Salida: Nada.
  // Objetivo: Volver a tener.
  const reponer = (p) => {
    const n = window.prompt(`¿Cuántas unidades de «${p.nombre}» hay ahora?`, '10');
    if (n !== null && Number(n) > 0) fijarStock(p, Math.floor(Number(n)));
  };
  // Nombre: borrar
  // Descripción: Borra un producto.
  // Entrada: El producto.
  // Salida: Nada.
  // Objetivo: Quitarlo.
  const borrar = async (p) => {
    if (!window.confirm(`¿Eliminar «${p.nombre}» de la tienda?`)) return;
    try {
      const r = await api.admin.borrarProducto(p.id);
      setAviso({ texto: r.resultado === 'oculto' ? `«${p.nombre}» ya tenía pedidos: se ocultó de la tienda para no perder el historial.` : `«${p.nombre}» se eliminó.` });
      cargar();
    } catch (e) { setAviso({ texto: e.message, error: true }); }
  };

  const agotados = productos.filter((p) => p.stock === 0).length;
  const pocos = productos.filter((p) => p.stock > 0 && p.stock < 10).length;

  return (
    <section aria-labelledby="t-prod" className="seccion-admin">
      <div className="admin__cabeza">
        <h2 id="t-prod">Productos</h2>
        <button type="button" className="boton" onClick={() => setEditando({})}>+ Nuevo producto</button>
      </div>
      <ul className="cifras-admin">
        <li><strong>{productos.length}</strong>productos</li>
        <li className="cifras-admin--rojo"><strong>{agotados}</strong>agotados</li>
        <li className="cifras-admin--ambar"><strong>{pocos}</strong>con poco stock</li>
        <li><strong>{productos.filter((p) => p.precio_anterior).length}</strong>en oferta</li>
      </ul>
      <FotosCategorias />
      <div className="filtros-admin">
        <label className="filtros-admin__buscar"><span className="solo-lector">Buscar producto</span><input type="search" value={q} onChange={(evento) => { setQ(evento.target.value); setPagina(1); }} placeholder="Buscar por nombre, marca o N.º" /></label>
        <label><span className="solo-lector">Categoría</span><select value={cat} onChange={(evento) => { setCat(evento.target.value); setPagina(1); }}><option value="">Todas las categorías</option>{categorias.map((c) => <option key={c.valor} value={c.valor}>{c.valor} ({c.cantidad})</option>)}</select></label>
        <label><span className="solo-lector">Mostrar</span><select value={stock} onChange={(evento) => { setStock(evento.target.value); setPagina(1); }}><option value="">Mostrar todos</option><option value="agotado">Agotados</option><option value="poco">Poco stock</option><option value="oferta">En oferta</option><option value="sinfoto">Sin foto</option><option value="hombres">Para hombres</option></select></label>
      </div>
      {aviso.texto && <p role={aviso.error ? 'alert' : 'status'} className={aviso.error ? 'error' : 'aviso-ok'}>{aviso.texto}</p>}
      <p className="tenue">{lista.length} {lista.length === 1 ? 'producto' : 'productos'}</p>
      <ul ref={rejilla} className="admin-tarjetas">
        {productosPagina.map((p, i) => (
          <li key={p.id} className="admin-tarjeta" style={{ '--n': i % POR_PAGINA }}>
            <div className="admin-tarjeta__foto">
              <ProductoImagen producto={p} />
              {p.stock === 0 ? <span className="admin-tarjeta__sello admin-tarjeta__sello--rojo">Agotado</span>
                : p.stock < 10 ? <span className="admin-tarjeta__sello admin-tarjeta__sello--ambar">Quedan {p.stock}</span> : null}
              {p.precio_anterior && <span className="admin-tarjeta__oferta">-{Math.round((1 - p.precio / p.precio_anterior) * 100)}%</span>}
            </div>
            <div className="admin-tarjeta__info">
              <p className="admin-tarjeta__nombre">{p.nombre}</p>
              <p className="tenue">{p.categoria} · N.º {p.id}</p>
              <p><strong>{dinero(p.precio)}</strong>{p.precio_anterior && <s className="tenue"> {dinero(p.precio_anterior)}</s>} · {p.stock} en stock</p>
            </div>
            <div className="admin-tarjeta__botones">
              <button type="button" className="boton boton--chico" onClick={() => setEditando(p)}>Editar<span className="solo-lector"> {p.nombre}</span></button>
              <BotonFoto etiqueta={`de ${p.nombre}`} texto="Foto" onArchivo={(f) => fotoNueva(p, f)} />
              {p.stock === 0
                ? <button type="button" className="boton boton--chico boton--verde" onClick={() => reponer(p)}>Reponer<span className="solo-lector"> {p.nombre}</span></button>
                : <button type="button" className="boton boton--chico boton--ambar" onClick={() => fijarStock(p, 0)}>Agotado<span className="solo-lector">: marcar {p.nombre} como agotado</span></button>}
              <button type="button" className="boton boton--chico boton--peligro" onClick={() => borrar(p)} aria-label={`Eliminar ${p.nombre}`}>Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
      <VerMas pagina={pagina} paginas={paginas} onCambiar={(n) => { setPagina(n); document.getElementById('t-prod')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} />
      {editando && <Editor producto={editando} categorias={categorias} onCerrar={() => setEditando(null)} onGuardado={() => { cargar(); setAviso({ texto: 'Producto guardado.' }); }} />}
    </section>
  );
}
