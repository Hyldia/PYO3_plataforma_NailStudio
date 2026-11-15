import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const Estrellas = ({ valor, grande = false }) => (
  <span className={`puntos ${grande ? 'puntos--grande' : ''}`} aria-hidden="true">
    {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= Math.round(valor) ? 'llena' : ''}>★</span>)}
  </span>
);

const fecha = (iso) => new Date(iso.replace(' ', 'T') + 'Z').toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });

// Reseñas del producto: resumen con barras, tarjetas y formulario para dejar una
export default function Resenas({ productoId, nombreProducto, onCambio }) {
  const [datos, setDatos] = useState(null);
  const [limite, setLimite] = useState(6);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ nombre: '', estrellas: 5, comentario: '', pedido: '', telefono: '' });
  const [estado, setEstado] = useState({ enviando: false, error: '', ok: '' });

  const cargar = () => api.resenas(productoId, limite).then(setDatos).catch(() => setDatos({ total: 0, distribucion: [], resenas: [] }));
  useEffect(() => { cargar(); }, [productoId, limite]);
  useEffect(() => { setLimite(6); setAbierto(false); setEstado({ enviando: false, error: '', ok: '' }); }, [productoId]);

  async function enviar(e) {
    e.preventDefault();
    setEstado({ enviando: true, error: '', ok: '' });
    try {
      const r = await api.crearResena(productoId, form);
      setEstado({ enviando: false, error: '', ok: r.verificada ? '¡Gracias! Tu reseña se publicó como compra verificada.' : '¡Gracias! Tu reseña se publicó.' });
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

  return (
    <section className="resenas" id="resenas" aria-labelledby="t-resenas">
      <div className="resenas__cabeza">
        <h2 id="t-resenas">
          {total} {total === 1 ? 'reseña' : 'reseñas'}
          {promedio && <><span className="resenas__sep" aria-hidden="true">|</span>{promedio} <Estrellas valor={promedio} grande /><span className="solo-lector"> de 5 estrellas</span></>}
        </h2>
        {verificadas > 0 && <p className="resenas__sello">✓ Las reseñas con sello son de compras verificadas</p>}
      </div>

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
          <ul className="resenas__lista">
            {resenas.map((r) => (
              <li key={r.id} className="resena">
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
        <p className="tenue">Todavía no hay reseñas de {nombreProducto}. ¡Sé la primera en contarnos qué te pareció!</p>
      )}

      <div className="resenas__acciones">
        {resenas.length < total && <button type="button" className="boton-ver-mas" onClick={() => setLimite((l) => l + 12)}>Ver más reseñas <span aria-hidden="true">⌄</span></button>}
        <button type="button" className="boton boton--contorno" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>Escribir una reseña</button>
      </div>
      {estado.ok && <p role="status" className="resenas__ok">{estado.ok}</p>}

      {abierto && (
        <form className="resenas__form" onSubmit={enviar} noValidate>
          <fieldset className="campo">
            <legend>Tu calificación</legend>
            <div className="elegir-estrellas">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className={n <= form.estrellas ? 'activa' : ''}>
                  <input type="radio" name="estrellas" value={n} checked={form.estrellas === n} onChange={() => setForm({ ...form, estrellas: n })} />
                  <span aria-hidden="true">★</span><span className="solo-lector">{n} {n === 1 ? 'estrella' : 'estrellas'}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="campo">
            <label htmlFor="r-nombre">Nombre</label>
            <input id="r-nombre" required maxLength={60} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="r-comentario">Comentario</label>
            <textarea id="r-comentario" required rows={4} maxLength={800} value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })} />
          </div>
          <p className="tenue">Opcional: si lo compraste aquí, escribe tu número de pedido y teléfono para que salga como <strong>compra verificada</strong>.</p>
          <div className="resenas__form-fila">
            <div className="campo">
              <label htmlFor="r-pedido">N.º de pedido</label>
              <input id="r-pedido" inputMode="numeric" value={form.pedido} onChange={(e) => setForm({ ...form, pedido: e.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="r-tel">Teléfono del pedido</label>
              <input id="r-tel" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
          </div>
          {estado.error && <p role="alert" className="error">{estado.error}</p>}
          <button type="submit" className="boton" disabled={estado.enviando}>{estado.enviando ? 'Publicando…' : 'Publicar reseña'}</button>
        </form>
      )}
    </section>
  );
}
