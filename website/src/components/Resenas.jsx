import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// Nombre: Estrellas
// Descripción: Dibuja estrellas.
// Entrada: El valor y el tamaño.
// Salida: Las estrellas.
// Objetivo: Mostrar calificaciones.
export const Estrellas = ({ valor, grande = false }) => (
  <span className={`puntos ${grande ? 'puntos--grande' : ''}`} aria-hidden="true">
    {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= Math.round(valor) ? 'llena' : ''}>★</span>)}
  </span>
);

// Nombre: fecha
// Descripción: Escribe una fecha corta.
// Entrada: La fecha.
// Salida: El texto.
// Objetivo: Fechar reseñas.
const fecha = (iso) => new Date(iso.replace(' ', 'T') + 'Z').toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });

const FILTROS = [['', 'Todas'], ['buenas', 'Buenas'], ['regulares', 'Regulares'], ['malas', 'Malas']];
// Nombre: buenas
// Descripción: Revisa si son 4 o 5 estrellas.
// Entrada: Las estrellas.
// Salida: Sí o no.
// Objetivo: Filtrar buenas.
// Nombre: regulares
// Descripción: Revisa si son 3 estrellas.
// Entrada: Las estrellas.
// Salida: Sí o no.
// Objetivo: Filtrar regulares.
// Nombre: malas
// Descripción: Revisa si son 1 o 2 estrellas.
// Entrada: Las estrellas.
// Salida: Sí o no.
// Objetivo: Filtrar malas.
const CUENTA = { '': () => true, buenas: (e) => e >= 4, regulares: (e) => e === 3, malas: (e) => e <= 2 };

// Fuente de las opiniones: reseñas de productos o comentarios de la galería y de los servicios
// Nombre: fuenteDe
// Descripción: Elige de dónde leer opiniones.
// Entrada: Tipo y número.
// Salida: Funciones para listar y crear.
// Objetivo: Usar la misma lista para todo.
const fuenteDe = (tipo, id) => tipo === 'producto'
  // Nombre: listar
  // Descripción: Lista reseñas de producto.
  // Entrada: Cuántas y filtro.
  // Salida: Las reseñas.
  // Objetivo: Mostrar opiniones.
  // Nombre: crear
  // Descripción: Guarda una reseña de producto.
  // Entrada: Los datos.
  // Salida: La reseña.
  // Objetivo: Que opinen.
  ? { listar: (l, f) => api.resenas(id, l, f), crear: (d) => api.crearResena(id, d) }
  // Nombre: listar
  // Descripción: Lista comentarios.
  // Entrada: Cuántos y filtro.
  // Salida: Los comentarios.
  // Objetivo: Mostrar opiniones.
  // Nombre: crear
  // Descripción: Guarda un comentario.
  // Entrada: Los datos.
  // Salida: El comentario.
  // Objetivo: Que opinen.
  : { listar: (l, f) => api.comentarios(tipo, id, l, f), crear: (d) => api.crearComentario(tipo, id, d) };

// Reseñas/opiniones: resumen con barras, filtro (buenas, regulares, malas), tarjetas y formulario
// Nombre: Resenas
// Descripción: Muestra las opiniones y el formulario.
// Entrada: Qué se comenta y opciones.
// Salida: La sección de reseñas.
// Objetivo: Generar confianza.
export default function Resenas({ productoId, tipo = 'producto', refId, nombreProducto, onCambio, titulo, compacto = false }) {
  const id = refId ?? productoId;
  const fuente = fuenteDe(tipo, id);
  const esProducto = tipo === 'producto';
  const [datos, setDatos] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [limite, setLimite] = useState(6);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ nombre: '', estrellas: 5, comentario: '', pedido: '', telefono: '' });
  const [estado, setEstado] = useState({ enviando: false, error: '', ok: '' });

  // Nombre: cargar
  // Descripción: Carga las opiniones.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrar la lista.
  const cargar = () => fuente.listar(limite, filtro).then(setDatos).catch(() => setDatos({ total: 0, distribucion: [], resenas: [] }));
  useEffect(() => { cargar(); }, [tipo, id, limite, filtro]);
  useEffect(() => { setLimite(6); setFiltro(''); setAbierto(false); setEstado({ enviando: false, error: '', ok: '' }); }, [tipo, id]);

  // Nombre: enviar
  // Descripción: Envía una opinión nueva.
  // Entrada: El envío del formulario.
  // Salida: Nada.
  // Objetivo: Guardar la opinión.
  async function enviar(e) {
    e.preventDefault();
    setEstado({ enviando: true, error: '', ok: '' });
    try {
      const r = await fuente.crear(form);
      setEstado({ enviando: false, error: '', ok: r.verificada ? '¡Gracias! Tu reseña se publicó como compra verificada.' : (esProducto ? '¡Gracias! Tu reseña se publicó.' : '¡Gracias! Tu opinión se publicó.') });
      setForm({ nombre: '', estrellas: 5, comentario: '', pedido: '', telefono: '' });
      setAbierto(false);
      cargar();
      onCambio?.();
    } catch (err) {
      setEstado({ enviando: false, error: err.message, ok: '' });
    }
  }

  if (!datos) return null;
  const { total, promedio, distribucion, resenas } = datos;
  const verificadas = resenas.filter((r) => r.verificada).length;
  // Nombre: cuantas
  // Descripción: Cuenta opiniones por grupo.
  // Entrada: El filtro.
  // Salida: La cantidad.
  // Objetivo: Mostrar cuántas hay.
  const cuantas = (f) => distribucion.filter((d) => CUENTA[f](d.estrellas)).reduce((n, d) => n + d.cantidad, 0);
  const totalFiltro = cuantas(filtro);
  const nombreH = `t-resenas-${tipo}-${id}`;

  return (
    <section className={`resenas ${compacto ? 'resenas--compacto' : ''}`} id="resenas" aria-labelledby={nombreH}>
      <div className="resenas__cabeza">
        <h2 id={nombreH}>
          {titulo && <span className="resenas__titulo">{titulo}</span>}
          {total} {esProducto ? (total === 1 ? 'reseña' : 'reseñas') : (total === 1 ? 'opinión' : 'opiniones')}
          {promedio && <><span className="resenas__sep" aria-hidden="true">|</span>{promedio} <Estrellas valor={promedio} grande /><span className="solo-lector"> de 5 estrellas</span></>}
        </h2>
        {verificadas > 0 && <p className="resenas__sello">✓ Las reseñas con sello son de compras verificadas</p>}
      </div>

      {total > 0 && (
        <div className="resenas__filtros" role="group" aria-label="Filtrar opiniones">
          {FILTROS.map(([k, t]) => (
            <button key={k} type="button" className={`chip-resena chip-resena--${k || 'todas'}`} aria-pressed={filtro === k}
                    onClick={() => { setFiltro(k); setLimite(6); }}>
              {t} <span>{cuantas(k)}</span>
            </button>
          ))}
        </div>
      )}

      {total > 0 ? (
        <div className="resenas__rejilla">
          <ul className="resenas__barras" aria-label="Reseñas por estrellas">
            {distribucion.map((d) => (
              <li key={d.estrellas}>
                <span>{d.estrellas} ★</span>
                <span className="barra" aria-hidden="true"><span style={{ width: `${total ? (d.cantidad / total) * 100 : 0}%` }} /></span>
                <span className="tenue">{d.cantidad}</span>
              </li>
            ))}
          </ul>
          <ul className="resenas__lista" key={filtro}>
            {resenas.length === 0 && <li className="tenue resenas__nada">No hay opiniones de este tipo todavía.</li>}
            {resenas.map((r, i) => (
              <li key={r.id} className={`resena resena--${r.estrellas >= 4 ? 'buena' : r.estrellas === 3 ? 'regular' : 'mala'}`} style={{ '--i': i % 12 }}>
                <div className="resena__autora">
                  <span className="resena__avatar" aria-hidden="true">{r.nombre[0]}</span>
                  <div>
                    <strong>{r.nombre}</strong>
                    <p className="tenue">{fecha(r.creada_en)}</p>
                  </div>
                </div>
                <p><Estrellas valor={r.estrellas} /><span className="solo-lector">{r.estrellas} de 5 estrellas</span></p>
                {r.opcion && <p className="tenue resena__opcion">Opción: {r.opcion}</p>}
                <p className="resena__texto">{r.comentario}</p>
                {r.verificada ? <p className="resena__verificada">✓ Compra verificada</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="tenue">Todavía no hay opiniones{nombreProducto ? ` de ${nombreProducto}` : ''}. ¡Sé la primera en contarnos qué te pareció!</p>
      )}

      <div className="resenas__acciones">
        {resenas.length < totalFiltro && <button type="button" className="boton-ver-mas" onClick={() => setLimite((l) => l + 12)}>Ver más reseñas <span aria-hidden="true">⌄</span></button>}
        <button type="button" className="boton boton--contorno" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>{esProducto ? 'Escribir una reseña' : 'Dejar mi opinión'}</button>
      </div>
      {estado.ok && <p role="status" className="resenas__ok">{estado.ok}</p>}

      {abierto && (
        <form className="resenas__form" onSubmit={enviar} noValidate>
          <fieldset className="campo">
            <legend>Tu calificación</legend>
            <div className="elegir-estrellas">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className={n <= form.estrellas ? 'activa' : ''}>
                  <input type="radio" name={`${nombreH}-e`} value={n} checked={form.estrellas === n} onChange={() => setForm({ ...form, estrellas: n })} />
                  <span aria-hidden="true">★</span><span className="solo-lector">{n} {n === 1 ? 'estrella' : 'estrellas'}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="campo">
            <label htmlFor={`${nombreH}-n`}>Nombre</label>
            <input id={`${nombreH}-n`} required maxLength={60} value={form.nombre} onChange={(evento) => setForm({ ...form, nombre: evento.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor={`${nombreH}-c`}>Comentario</label>
            <textarea id={`${nombreH}-c`} required rows={4} maxLength={800} value={form.comentario} onChange={(evento) => setForm({ ...form, comentario: evento.target.value })} />
          </div>
          {esProducto && <>
          <p className="tenue">Opcional: si lo compraste aquí, escribe tu número de pedido y teléfono para que salga como <strong>compra verificada</strong>.</p>
          <div className="resenas__form-fila">
            <div className="campo">
              <label htmlFor="r-pedido">N.º de pedido</label>
              <input id="r-pedido" inputMode="numeric" value={form.pedido} onChange={(evento) => setForm({ ...form, pedido: evento.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="r-tel">Teléfono del pedido</label>
              <input id="r-tel" type="tel" value={form.telefono} onChange={(evento) => setForm({ ...form, telefono: evento.target.value })} />
            </div>
          </div>
          </>}
          {estado.error && <p role="alert" className="error">{estado.error}</p>}
          <button type="submit" className="boton" disabled={estado.enviando}>{estado.enviando ? 'Publicando…' : esProducto ? 'Publicar reseña' : 'Publicar opinión'}</button>
        </form>
      )}
    </section>
  );
}
