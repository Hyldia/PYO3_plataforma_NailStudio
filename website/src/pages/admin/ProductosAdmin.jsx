// Productos de la tienda: buscar, crear, editar, cambiar foto y eliminar.
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero } from '../../config.js';
import Modal from '../../components/Modal.jsx';
import ProductoImagen from '../../components/ProductoImagen.jsx';
import { BotonFoto, ZonaFotos, formData } from './comunes.jsx';

const VACIO = { nombre: '', categoria: '', marca: 'AH Nails', precio: '', precio_anterior: '', stock: '10', descripcion: '' };
const POR_PAGINA = 24;

function Editor({ producto, categorias, onCerrar, onGuardado }) {
  const nuevo = !producto.id;
  const [d, setD] = useState({ ...VACIO, ...producto, precio_anterior: producto.precio_anterior ?? '', descripcion: producto.descripcion ?? '' });
  const [archivo, setArchivo] = useState([]);
  const [estado, setEstado] = useState({ guardando: false, error: '' });
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
  const descuento = d.precio_anterior && Number(d.precio_anterior) > Number(d.precio) ? Math.round((1 - d.precio / d.precio_anterior) * 100) : 0;

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
            <div className="campo"><label htmlFor="p-precio">Precio (₡)</label><input id="p-precio" type="number" min="1" step="50" value={d.precio} onChange={set('precio')} required /></div>
            <div className="campo"><label htmlFor="p-ant">Precio antes <span className="tenue">(oferta)</span></label><input id="p-ant" type="number" min="0" step="50" value={d.precio_anterior} onChange={set('precio_anterior')} placeholder="Vacío = sin oferta" /></div>
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

export default function ProductosAdmin() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [stock, setStock] = useState('');
  const [visibles, setVisibles] = useState(POR_PAGINA);
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState({ texto: '', error: false });

  const cargar = () => api.admin.productos().then(setProductos).catch((e) => setAviso({ texto: e.message, error: true }));
  useEffect(() => { cargar(); api.categoriasProductos().then(setCategorias).catch(() => {}); }, []);
  useEffect(() => setVisibles(POR_PAGINA), [q, cat, stock]);

  const lista = useMemo(() => productos.filter((p) =>
    (!cat || p.categoria === cat) &&
    (!stock || (stock === 'agotado' ? p.stock === 0 : stock === 'poco' ? p.stock > 0 && p.stock < 10 : p.precio_anterior)) &&
    (!q || `${p.nombre} ${p.marca || ''} ${p.id}`.toLowerCase().includes(q.toLowerCase()))), [productos, q, cat, stock]);

  const fotoNueva = async (p, archivo) => {
    try { await api.admin.imagenProducto(p.id, formData(archivo)); setAviso({ texto: `Foto de «${p.nombre}» actualizada.` }); cargar(); } catch (e) { setAviso({ texto: e.message, error: true }); }
  };
  // Marcar agotado (stock 0) o reponer unidades sin abrir el editor
  const fijarStock = async (p, stock) => {
    try {
      await api.admin.editarProducto(p.id, { ...p, stock, precio_anterior: p.precio_anterior ?? '' });
      setAviso({ texto: stock === 0 ? `«${p.nombre}» quedó agotado: en la tienda sale con el sello «Agotado» y no se puede comprar.` : `«${p.nombre}» ahora tiene ${stock} en stock.` });
      cargar();
    } catch (e) { setAviso({ texto: e.message, error: true }); }
  };
  const reponer = (p) => {
    const n = window.prompt(`¿Cuántas unidades de «${p.nombre}» hay ahora?`, '10');
    if (n !== null && Number(n) > 0) fijarStock(p, Math.floor(Number(n)));
  };
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
      <div className="filtros-admin">
        <label className="filtros-admin__buscar"><span className="solo-lector">Buscar producto</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, marca o N.º" /></label>
        <label><span className="solo-lector">Categoría</span><select value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Todas las categorías</option>{categorias.map((c) => <option key={c.valor} value={c.valor}>{c.valor} ({c.cantidad})</option>)}</select></label>
        <label><span className="solo-lector">Stock</span><select value={stock} onChange={(e) => setStock(e.target.value)}><option value="">Todo el stock</option><option value="agotado">Agotados</option><option value="poco">Poco stock</option><option value="oferta">En oferta</option></select></label>
      </div>
      {aviso.texto && <p role={aviso.error ? 'alert' : 'status'} className={aviso.error ? 'error' : 'aviso-ok'}>{aviso.texto}</p>}
      <p className="tenue">{lista.length} {lista.length === 1 ? 'producto' : 'productos'}</p>
      <ul className="admin-tarjetas">
        {lista.slice(0, visibles).map((p, i) => (
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
      {visibles < lista.length && <button type="button" className="boton boton--contorno boton--centro" onClick={() => setVisibles(visibles + POR_PAGINA)}>Ver más ({lista.length - visibles})</button>}
      {editando && <Editor producto={editando} categorias={categorias} onCerrar={() => setEditando(null)} onGuardado={() => { cargar(); setAviso({ texto: 'Producto guardado.' }); }} />}
    </section>
  );
}
