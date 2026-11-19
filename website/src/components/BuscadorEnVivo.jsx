// Buscador del encabezado: mientras escribes van apareciendo servicios, productos y diseños.
// Con las flechas se recorre la lista, Enter abre lo elegido y Esc la cierra.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import Foto from './Foto.jsx';
import ProductoImagen from './ProductoImagen.jsx';

const POPULARES = ['Rubber base', 'Pedicure', 'Francesa', 'Acrílicas', 'Lámpara', 'Press-on'];
// Nombre: sinTildes
// Descripción: Quita tildes y pasa a minúscula.
// Entrada: El texto.
// Salida: El texto limpio.
// Objetivo: Buscar sin importar tildes.
const sinTildes = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let serviciosCache = null;

// Resalta en negrita la parte que coincide con lo escrito
// Nombre: Resaltado
// Descripción: Resalta lo que se escribió.
// Entrada: El texto y lo buscado.
// Salida: El texto resaltado.
// Objetivo: Ver por qué salió el resultado.
function Resaltado({ texto, q }) {
  const i = sinTildes(texto).indexOf(sinTildes(q));
  if (!q || i < 0) return texto;
  return <>{texto.slice(0, i)}<mark>{texto.slice(i, i + q.length)}</mark>{texto.slice(i + q.length)}</>;
}

// Nombre: BuscadorEnVivo
// Descripción: Muestra el buscador que sugiere al escribir.
// Entrada: El dibujo de la lupa.
// Salida: El buscador.
// Objetivo: Encontrar cosas rápido.
export default function BuscadorEnVivo({ Lupa }) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [res, setRes] = useState({ servicios: [], productos: [], fotos: [], cargando: false });
  const [activo, setActivo] = useState(-1);
  const caja = useRef(null);
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const q = texto.trim();

  useEffect(() => { setAbierto(false); }, [pathname]);
  useEffect(() => {
    // Nombre: fuera
    // Descripción: Cierra la lista al tocar afuera.
    // Entrada: El clic.
    // Salida: Nada.
    // Objetivo: No estorbar.
    const fuera = (evento) => { if (caja.current && !caja.current.contains(evento.target)) setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, []);

  // Busca 200 ms después de la última tecla
  useEffect(() => {
    setActivo(-1);
    if (q.length < 2) { setRes({ servicios: [], productos: [], fotos: [], cargando: false }); return undefined; }
    setRes((r) => ({ ...r, cargando: true }));
    let vigente = true;
    const t = setTimeout(async () => {
      serviciosCache ||= api.servicios().then((s) => s.servicios || s).catch(() => []);
      const [servicios, productos, fotos] = await Promise.all([
        serviciosCache,
        api.productos({ q }).catch(() => []),
        api.fotos({ q, limite: 4 }).then((f) => f.fotos || []).catch(() => [])
      ]);
      if (!vigente) return;
      const nq = sinTildes(q);
      setRes({
        servicios: servicios.filter((s) => sinTildes(`${s.nombre} ${s.categoria} ${s.descripcion || ''}`).includes(nq)).slice(0, 3),
        productos: (Array.isArray(productos) ? productos : productos.productos || []).slice(0, 5),
        fotos: fotos.slice(0, 4),
        cargando: false
      });
    }, 200);
    return () => { vigente = false; clearTimeout(t); };
  }, [q]);

  // Todos los resultados en una sola lista para moverse con las flechas
  const opciones = useMemo(() => [
    ...res.servicios.map((s) => ({ clave: `s${s.id}`, to: `/reservar?servicio=${s.id}` })),
    ...res.productos.map((p) => ({ clave: `p${p.id}`, to: `/tienda/${p.id}` })),
    ...res.fotos.map((f) => ({ clave: `f${f.id}`, to: `/galeria/${f.id}` })),
    ...(q.length >= 2 ? [{ clave: 'todo', to: `/buscar?q=${encodeURIComponent(q)}` }] : [])
  ], [res, q]);
  // Nombre: idx
  // Descripción: Busca la posición de una opción.
  // Entrada: La clave.
  // Salida: La posición.
  // Objetivo: Moverse con flechas.
  const idx = (clave) => opciones.findIndex((o) => o.clave === clave);
  // Nombre: ir
  // Descripción: Va a la página elegida.
  // Entrada: La dirección.
  // Salida: Nada.
  // Objetivo: Abrir el resultado.
  const ir = (to) => { setAbierto(false); setTexto(''); navegar(to); };

  // Nombre: teclas
  // Descripción: Maneja las flechas y Escape.
  // Entrada: La tecla.
  // Salida: Nada.
  // Objetivo: Usar el buscador con teclado.
  const teclas = (evento) => {
    if (!abierto) setAbierto(true);
    if (evento.key === 'ArrowDown') { evento.preventDefault(); setActivo((a) => Math.min(opciones.length - 1, a + 1)); }
    if (evento.key === 'ArrowUp') { evento.preventDefault(); setActivo((a) => Math.max(-1, a - 1)); }
    if (evento.key === 'Escape') setAbierto(false);
  };
  // Nombre: enviar
  // Descripción: Busca al presionar Enter.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Ver todos los resultados.
  const enviar = (evento) => {
    evento.preventDefault();
    if (activo >= 0 && opciones[activo]) return ir(opciones[activo].to);
    if (q) ir(`/buscar?q=${encodeURIComponent(q)}`);
  };

  const nada = q.length >= 2 && !res.cargando && !res.servicios.length && !res.productos.length && !res.fotos.length;
  // Nombre: opcion
  // Descripción: Dibuja una opción de la lista.
  // Entrada: Clave, destino y contenido.
  // Salida: La opción.
  // Objetivo: Mostrar resultados.
  const opcion = (clave, to, contenido) => (
    <li key={clave} role="option" aria-selected={activo === idx(clave)} id={`bv-${clave}`}>
      <button type="button" className={`bv__opcion ${activo === idx(clave) ? 'bv__opcion--activa' : ''}`} onMouseEnter={() => setActivo(idx(clave))} onClick={() => ir(to)}>{contenido}</button>
    </li>
  );

  return (
    <div className="bv" ref={caja}>
      <form className="encabezado__buscador" role="search" onSubmit={enviar}>
        <label htmlFor="buscar-sitio" className="solo-lector">Buscar en el sitio</label>
        <input id="buscar-sitio" type="search" value={texto} autoComplete="off" placeholder="Busca: rubber base, pedicure, francesa…"
               onChange={(evento) => { setTexto(evento.target.value); setAbierto(true); }} onFocus={() => setAbierto(true)} onKeyDown={teclas}
               role="combobox" aria-expanded={abierto} aria-controls="bv-lista" aria-autocomplete="list" aria-activedescendant={activo >= 0 && opciones[activo] ? `bv-${opciones[activo].clave}` : undefined} />
        <button type="submit" aria-label="Buscar"><Lupa /></button>
      </form>

      {abierto && (
        <div className="bv__panel" id="bv-lista" role="listbox" aria-label="Sugerencias">
          {q.length < 2 ? (
            <div className="bv__populares">
              <p className="bv__titulo">Lo más buscado</p>
              <div>{POPULARES.map((p) => <button key={p} type="button" onClick={() => setTexto(p)}>{p}</button>)}</div>
            </div>
          ) : (
            <>
              {res.cargando && !res.productos.length && <p className="bv__cargando">Buscando…</p>}
              {nada && <p className="bv__nada">No encontramos «{q}». Prueba con otra palabra.</p>}
              {res.servicios.length > 0 && (
                <ul className="bv__grupo" aria-label="Servicios">
                  <li className="bv__titulo" role="presentation">Servicios</li>
                  {res.servicios.map((s) => (
                    opcion(`s${s.id}`, `/reservar?servicio=${s.id}`, <>
                      <span className="bv__foto"><Foto archivo={s.imagen} alt="" /></span>
                      <span className="bv__texto"><b><Resaltado texto={s.nombre} q={q} /></b><small>{s.categoria} · {s.duracion_min} min</small></span>
                      <span className="bv__precio">{dinero(s.precio_oferta ?? s.precio)}</span>
                    </>)
                  ))}
                </ul>
              )}
              {res.productos.length > 0 && (
                <ul className="bv__grupo" aria-label="Productos">
                  <li className="bv__titulo" role="presentation">Productos</li>
                  {res.productos.map((p) => (
                    opcion(`p${p.id}`, `/tienda/${p.id}`, <>
                      <span className="bv__foto"><ProductoImagen producto={p} /></span>
                      <span className="bv__texto"><b><Resaltado texto={p.nombre} q={q} /></b><small>{p.categoria}{p.stock === 0 ? ' · Agotado' : ''}</small></span>
                      <span className="bv__precio">{dinero(p.precio)}</span>
                    </>)
                  ))}
                </ul>
              )}
              {res.fotos.length > 0 && (
                <ul className="bv__grupo bv__grupo--fotos" aria-label="Diseños">
                  <li className="bv__titulo" role="presentation">Diseños de la galería</li>
                  {res.fotos.map((f) => (
                    opcion(`f${f.id}`, `/galeria/${f.id}`, <>
                      <span className="bv__miniatura"><Foto archivo={f.archivo} alt="" /></span>
                      <small>{f.titulo}</small>
                    </>)
                  ))}
                </ul>
              )}
              {!nada && (
                <ul className="bv__grupo">{opcion('todo', `/buscar?q=${encodeURIComponent(q)}`, <span className="bv__todo">Ver todos los resultados de «{q}» ›</span>)}</ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
