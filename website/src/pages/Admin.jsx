import { useEffect, useRef, useState } from 'react';
import { api, sesionAdmin } from '../lib/api.js';
import { dinero, enlaceWhatsApp } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';


const CATEGORIAS = ['Manicure', 'Acrílicas', 'Polygel', 'Gel', 'Pedicure', 'Nail art'];
const FORMAS = ['Almendra', 'Ovalada', 'Cuadrada', 'Coffin', 'Stiletto'];
const COLORES = ['Nude', 'Rosa', 'Rojo', 'Vino', 'Morado', 'Azul', 'Verde', 'Negro', 'Blanco', 'Multicolor'];
const ACABADOS = ['Brillante', 'Mate', 'Chrome', 'Glitter'];
const ACCIONES = { pendiente: ['confirmar', 'cancelar'], confirmada: ['completar', 'cancelar'], completada: [], cancelada: [] };
const TEXTO_ACCION = { confirmar: 'Confirmar', completar: 'Marcar atendida', cancelar: 'Cancelar' };
const VACIO_PRODUCTO = {nombre: '', descripcion: '', categoria: '', marca: '', precio: '', stock: '0'};
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
                  <td>{c.cliente_nombre}<br /><a className="enlace" href={enlaceWhatsApp(`Hola ${c.cliente_nombre}, te escribimos de Nailé sobre tu cita del ${c.fecha} a las ${c.hora}.`)} target="_blank" rel="noreferrer">{c.cliente_telefono}</a></td>
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
  const [subirAbierto, setSubirAbierto] = useState(false);

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
      setArchivos([]); setDatos(VACIO); e.target.reset(); setSubirAbierto(false); cargar();
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

  return (
    <section aria-labelledby="t-galeria-admin">
      <h2 id="t-galeria-admin">Galería</h2>
      
            {estado.error && <p role="alert" className="error">{estado.error}</p>}
      {estado.mensaje && <p role="status" className="exito">{estado.mensaje}</p>}

      {!subirAbierto ? (
        <button
          type="button"
          className="boton"
          onClick={() => {
            setSubirAbierto(true);
            setEstado({ subiendo: false, mensaje: '', error: '' });
          }}
        >
          Agregar diseño
        </button>
      ) : (
        <form className="caja" onSubmit={subir}>
          <h3>Subir fotos</h3>
          <div className="campo">
            <label htmlFor="g-archivos">Imágenes (JPG, PNG o WebP, máximo 8 MB cada una)</label>
            <input
              id="g-archivos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setArchivos([...e.target.files])}
            />
            {archivos.length > 1 && (
              <p className="tenue">
                Las {archivos.length} fotos se guardan con los mismos datos y títulos numerados.
              </p>
            )}
          </div>

          {camposFoto(datos, setDatos, 'g')}

          <div className="botones">
            <button type="submit" className="boton" disabled={estado.subiendo}>
              {estado.subiendo ? 'Subiendo…' : 'Subir a la galería'}
            </button>
            <button
              type="button"
              className="boton boton--contorno"
              onClick={() => {
                setSubirAbierto(false);
                setArchivos([]);
                setDatos(VACIO);
                setEstado({ subiendo: false, mensaje: '', error: '' });
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ul className="admin-fotos">
        {fotos.map((f) => (
          <li key={f.id} className="admin-foto">
            <Foto archivo={f.archivo} alt={f.titulo} />
            {editando?.id === f.id ? (
              <form onSubmit={guardarEdicion} className="admin-foto__form">
                {camposFoto(editando, setEditando, `e${f.id}`)}
                <div className="botones"><button type="submit" className="boton boton--chico">Guardar</button><button type="button" className="boton boton--contorno boton--chico" onClick={() => setEditando(null)}>Cancelar</button></div>
              </form>
            ) : (
              <div className="admin-foto__info">
                <p><strong>{f.titulo}</strong>{f.destacada ? ' (destacada)' : ''}</p>
                <p className="tenue">{[f.categoria, f.forma, f.color, f.acabado].filter(Boolean).join(', ')}. {f.vistas} vistas</p>
                <div className="botones">
                  <button type="button" className="boton boton--contorno boton--chico" onClick={() => setEditando({ ...f, destacada: !!f.destacada })}>Editar<span className="solo-lector"> {f.titulo}</span></button>
                  <button type="button" className="boton boton--peligro boton--chico" onClick={() => borrar(f)}>Borrar<span className="solo-lector"> {f.titulo}</span></button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function  CamposProducto({datos, onChange, prefijo}){
  const cambiar = (campo) => (e) => onChange({ ...datos, [campo]: e.target.value });
  return (
    <>
      <div className="campo">
        <label htmlFor={`${prefijo}-nombre`}>Nombre</label>
        <input id={`${prefijo}-nombre`} value={datos.nombre}
          onChange={cambiar('nombre')} required />
      </div>
      <div className="campo">
        <label htmlFor={`${prefijo}-descripcion`}>Descripción</label>
        <textarea id={`${prefijo}-descripcion`} value={datos.descripcion}
          onChange={cambiar('descripcion')} />
      </div>
      <div className="campo">
        <label htmlFor={`${prefijo}-categoria`}>Categoría</label>
        <input id={`${prefijo}-categoria`} value={datos.categoria}
          onChange={cambiar('categoria')} required />
      </div>
      <div className="campo">
        <label htmlFor={`${prefijo}-marca`}>Marca</label>
        <input id={`${prefijo}-marca`} value={datos.marca}
          onChange={cambiar('marca')} />
      </div>
      <div className="campo">
        <label htmlFor={`${prefijo}-precio`}>Precio</label>
        <input id={`${prefijo}-precio`} type="number" min="0" step="1"
          value={datos.precio} onChange={cambiar('precio')} required />
      </div>
      <div className="campo">
        <label htmlFor={`${prefijo}-stock`}>Unidades en stock</label>
        <input id={`${prefijo}-stock`} type="number" min="0" step="1"
          value={datos.stock} onChange={cambiar('stock')} required />
      </div>
    </>
  );
}

function datosProducto(formulario){
  return {
    nombre: formulario.nombre.trim(),
    descripcion: formulario.descripcion.trim(),
    categoria: formulario.categoria.trim(),
    marca: formulario.marca.trim(),
    precio: Number(formulario.precio),
    stock: Number(formulario.stock)
  };
}

function Productos() {
  const [productos, setProductos] = useState([]);
  const [nuevo, setNuevo] = useState(VACIO_PRODUCTO);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [crearAbierto, setCrearAbierto] = useState(false);
  const creando = useRef(false);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    const lista = await api.productos();
    setProductos(lista);
    setError('');
  }

  useEffect(() => {
    cargar().catch((e) => setError(e.message));
  }, []);

  async function crear(e) {
    e.preventDefault();
    if (creando.current) return;
    creando.current = true;
    setGuardando(true);
    setError('');
    setMensaje('');

    try {
      await api.admin.crearProducto(datosProducto(nuevo));
      setNuevo(VACIO_PRODUCTO);
      setCrearAbierto(false);
      setMensaje('Producto creado.');
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally{
      creando.current = false;
      setGuardando(false);
    }
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    setError('');
    setMensaje('');

    try {
      await api.admin.actualizarProducto(
        editando.id,
        datosProducto(editando)
      );
      setEditando(null);
      setMensaje('Producto actualizado.');
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function eliminar(p) {
    if (!window.confirm(`¿Eliminar «${p.nombre}»? Esta acción no se puede deshacer.`)) {
      return;
    }

    setError('');
    setMensaje('');

    try {
      await api.admin.borrarProducto(p.id);
      setMensaje('Producto eliminado.');
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function subir(id, archivo) {
    const fd = new FormData();
    fd.append('imagen', archivo);

    try {
      await api.admin.imagenProducto(id, fd);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section aria-labelledby="t-prod">
      <h2 id="t-prod">Productos</h2>

      {error && <p role="alert" className="error">{error}</p>}
      {mensaje && <p role="status" className="exito">{mensaje}</p>}

      <div className="caja">
        {!crearAbierto ? (
          <button
            type="button"
            className="boton admin__agregar-producto"
            onClick={() => {
              setCrearAbierto(true);
              setError('');
              setMensaje('');
            }}
          >
            Agregar producto
          </button>
        ) : (
          <form className="caja" onSubmit={crear}>
            <h3>Nuevo producto</h3>

            <CamposProducto
              datos={nuevo}
              onChange={setNuevo}
              prefijo="nuevo-producto"
            />

            <div className="admin-producto__acciones">
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar producto'}
              </button>
              <button
                type="button"
                className="boton boton--contorno"
                onClick={() => {
                  setCrearAbierto(false);
                  setNuevo(VACIO_PRODUCTO);
                  setError('');
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      <ul className="admin-fotos">
        {productos.map((p) => (
          <li key={p.id} className="admin-foto">
            <Foto archivo={p.imagen} alt={p.nombre} />

            {editando?.id === p.id ? (
              <form className="admin-foto__form" onSubmit={guardarEdicion}>
                <CamposProducto
                  datos={editando}
                  onChange={setEditando}
                  prefijo={`editar-${p.id}`}
                />
                <div className="admin-producto__acciones">
                  <button type="submit" className="boton boton--chico">
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="boton boton--contorno boton--chico"
                    onClick={() => setEditando(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="admin-foto__info">
                <p><strong>{p.nombre}</strong></p>
                <p>{p.descripcion}</p>
                <p className="tenue">
                  {p.categoria} · {p.marca || 'Sin marca'} · {dinero(p.precio)} · {p.stock} en stock
                </p>

                <div className="admin-producto__acciones">
                  <button
                    type="button"
                    className="boton boton--contorno boton--chico admin-producto__editar"
                    onClick={() => setEditando({
                      ...p,
                      descripcion: p.descripcion || '',
                      marca: p.marca || '',
                      precio: String(p.precio),
                      stock: String(p.stock)
                    })}
                  >
                    Editar
                  </button>

                  <label className="boton boton--contorno boton--chico subir admin-producto__foto">
                    {p.imagen ? 'Cambiar foto' : 'Subir foto'}
                    <span className="solo-lector"> de {p.nombre}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const archivo = e.target.files[0];
                        if (archivo) subir(p.id, archivo);
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    className="boton boton--peligro boton--chico admin-producto__eliminar"
                    onClick={() => eliminar(p)}
                  >
                    Eliminar
                    <span className="solo-lector"> {p.nombre}</span>
                  </button>
                </div>
              </div>
            )}
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

const SECCIONES = { agenda: ['Agenda', Agenda], galeria: ['Galería', Galeria], productos: ['Productos', Productos], pedidos: ['Pedidos', Pedidos] };

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
