import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DisenoBuilder, DISENO_INICIAL, describir, normalizar } from '../patrones/constructorDiseno.js';
import { ESMALTES, FAMILIAS_ESMALTE, OPCIONES_DISENO, PRECIO_DISENO, EXTRA_TIPO, DEDOS, esmalte, calcularDiseno } from '../lib/esmaltes.js';
import { useReserva } from '../context/ReservaContext.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import { Una, datosUna } from '../components/DibujoUnas.jsx';
import ManoFoto, { TONOS_FOTO } from '../components/ManoFoto.jsx';
import Foto from '../components/Foto.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import Migas from '../components/Migas.jsx';

// Nombre: mas
// Descripción: Escribe el costo extra.
// Entrada: El monto.
// Salida: El texto (+₡500 o Incluido).
// Objetivo: Mostrar precios.
const mas = (n) => (n ? `+${dinero(n)}` : 'Incluido');
const BUSCAR_DECO = { Francesa: 'francesa', 'Francesa de color': 'francesa', 'Baby boomer': 'degradado', 'Ombré': 'degradado', 'Mármol': 'mármol', Corazones: 'corazones',
  'Flores a mano': 'flores', 'Animal print': 'leopardo', 'Pedrería': 'pedrería', 'Foil dorado': 'dorado' };
// Servicio con el que se hace el diseño según el largo
const SERVICIOS_DISENO = ['Manicure semipermanente', 'Manicure rusa', 'Builder gel (nivelación)', 'Soft gel (tips de gel)', 'Polygel', 'Uñas acrílicas'];
// Nombre: servicioPorLargo
// Descripción: Elige el servicio según el largo.
// Entrada: El largo.
// Salida: El nombre del servicio.
// Objetivo: Reservar el servicio correcto.
const servicioPorLargo = (largo) => (largo === 'Corto' ? 'Manicure semipermanente' : largo === 'Medio' ? 'Polygel' : 'Uñas acrílicas');
// Los 15 colores que se ven primero (los favoritos del salón)
const DESTACADOS = ['AH-038', 'AH-005', 'AH-028', 'AH-037', 'AH-068', 'AH-042', 'AH-174', 'AH-004', 'AH-227', 'AH-148', 'AH-043', 'AH-123', 'AH-091', 'AH-081', 'AH-241'];

const ICONOS = {
  color: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-2s-1-1.6-1-2.6 1-1.4 2-1.4h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z" /><circle cx="7.5" cy="11" r="1.2" fill="currentColor" /><circle cx="10" cy="7" r="1.2" fill="currentColor" /><circle cx="15" cy="7.5" r="1.2" fill="currentColor" /></svg>,
  acabado: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3c.6 4.2 2.4 6 6.6 6.6C14.4 10.2 12.6 12 12 16.2 11.4 12 9.6 10.2 5.4 9.6 9.6 9 11.4 7.2 12 3z" /><path d="M18.5 15c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5z" /></svg>,
  decoracion: <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M6 3h12l3 6-9 12L3 9z" /><path d="M3 9h18M9 3l3 18M15 3l-3 18" /></svg>,
  corazon: <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z" /></svg>,
  corazonVacio: <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z" /></svg>
};

// Nombre: leerFavorito
// Descripción: Lee el diseño favorito guardado.
// Entrada: Nada.
// Salida: El diseño o nada.
// Objetivo: Recuperarlo al volver.
const leerFavorito = () => { try { return JSON.parse(localStorage.getItem('naile-diseno-favorito')); } catch { return null; } };

// Muestra de color: cuadrito con brillo, como en un muestrario de salón
// Nombre: Muestra
// Descripción: Muestra un color para elegir.
// Entrada: El color, si está elegido y qué hacer.
// Salida: El botón.
// Objetivo: Elegir esmalte.
function Muestra({ e, elegido, onElegir }) {
  return (
    <button type="button" role="radio" aria-checked={elegido} className="muestra" onClick={() => onElegir(e.codigo)} title={`${e.nombre} · ${e.codigo}`}>
      <span className={`muestra__color muestra__color--${e.tipo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}`} style={{ '--c': e.hex }} aria-hidden="true" />
      <span className="muestra__nombre">{e.nombre}</span>
    </button>
  );
}

// Nombre: Disena
// Descripción: Muestra el diseñador de uñas.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Crear un diseño propio.
export default function Disena() {
  useTitulo('Diseña tus uñas');
  const { reserva, actualizar } = useReserva();
  const carrito = useCarrito();
  const navegar = useNavigate();
  const [diseno, setDiseno] = useState(() => new DisenoBuilder(normalizar(reserva.diseno || DISENO_INICIAL)).build());
  const [modo, setModo] = useState('todas');
  const [dedo, setDedo] = useState(1);
  const [tono, setTono] = useState(TONOS_FOTO[1]);
  const [panel, setPanel] = useState('color');
  const [verTodos, setVerTodos] = useState(false);
  const [familia, setFamilia] = useState('Todos');
  const [texto, setTexto] = useState('');
  const [vista, setVista] = useState('mano');
  const [reales, setReales] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [servicioNombre, setServicioNombre] = useState(null);
  const [presson, setPresson] = useState(null);
  const [verDesglose, setVerDesglose] = useState(false);
  const [favorito, setFavorito] = useState(() => Boolean(leerFavorito()));
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    api.servicios().then(setServicios).catch(() => {});
    api.productos({ q: 'Press-on personalizado', limite: 1 }).then((r) => { const l = r.productos || r; setPresson(l[0] || null); }).catch(() => {});
  }, []);

  const actual = diseno.unas[dedo];
  const recargo = useMemo(() => calcularDiseno(diseno), [diseno]);
  const servicio = servicios.find((s) => s.nombre === (servicioNombre || servicioPorLargo(diseno.largo)));
  const base = servicio ? (servicio.precio_oferta ?? servicio.precio) : 0;
  const total = base + recargo.total;
  const conCupon = Math.round(total * 0.85);
  const esmaltes = ESMALTES.filter((e) => (familia === 'Todos' || e.familia === familia)
    && `${e.nombre} ${e.codigo} ${e.familia}`.toLowerCase().includes(texto.trim().toLowerCase()));

  // Nombre: general
  // Descripción: Cambia algo para todas las uñas.
  // Entrada: El campo y el valor.
  // Salida: Nada.
  // Objetivo: Diseñar rápido.
  const general = (campo, valor) => setDiseno((d) => new DisenoBuilder(d).con(campo, valor).build());
  // Con "Todas" el cambio va a las cinco uñas; con "Una por una", solo a la uña elegida
  // Nombre: cambiarUna
  // Descripción: Cambia algo de una sola uña.
  // Entrada: El campo y el valor.
  // Salida: Nada.
  // Objetivo: Diseñar uña por uña.
  const cambiarUna = (campo, valor) => setDiseno((d) => {
    const unas = d.unas.map((u, i) => (modo === 'todas' || i === dedo ? { ...u, [campo]: valor } : u));
    const generales = campo === 'forma' ? { forma: valor } : campo === 'largo' ? { largo: valor } : {};
    return new DisenoBuilder({ ...d, ...generales, unas, color: esmalte(unas[1].esmalte).nombre, acabado: unas[1].acabado, decoracion: unas[1].decoracion }).build();
  });
  // Nombre: elegirDedo
  // Descripción: Elige un dedo.
  // Entrada: El número del dedo.
  // Salida: Nada.
  // Objetivo: Editar esa uña.
  const elegirDedo = (i) => { setDedo(i); setModo('una'); setVista('mano'); };

  // Nombre: guardarFavorito
  // Descripción: Guarda el diseño como favorito.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: No perderlo.
  const guardarFavorito = () => {
    try {
      if (favorito) localStorage.removeItem('naile-diseno-favorito');
      else localStorage.setItem('naile-diseno-favorito', JSON.stringify(diseno));
    } catch { /* sin almacenamiento */ }
    setFavorito(!favorito);
  };
  // Nombre: reservar
  // Descripción: Reserva el diseño.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ir a reservar.
  const reservar = () => { actualizar({ diseno: { ...diseno, id: null } }); navegar(servicio ? `/reservar?servicio=${servicio.id}` : '/reservar'); };
  // Nombre: pedirPresson
  // Descripción: Pide el diseño en press-on.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Comprarlo para casa.
  const pedirPresson = () => {
    if (!presson) return;
    carrito.agregar(
      { id: presson.id, nombre: 'Press-on con tu diseño', precio: presson.precio, precio_anterior: presson.precio_anterior, stock: presson.stock, tipo: 'tips', color: esmalte(actual.esmalte)?.hex },
      { detalle: `${describir(diseno)}`, cantidad: 1, unico: true }
    );
    setAviso('Agregamos el press-on con tu diseño al carrito.');
  };

  // Fotos reales parecidas: se muestran como miniaturas debajo de la mano
  useEffect(() => {
    const q = BUSCAR_DECO[actual.decoracion];
    const t = setTimeout(() => {
      api.fotos(q ? { q, limite: 4 } : { orden: 'populares', limite: 4 }).then((r) => setReales(r.fotos)).catch(() => setReales([]));
    }, 300);
    return () => clearTimeout(t);
  }, [actual.decoracion]);

  const vistas = [{ id: 'mano', titulo: 'Tu diseño en la mano' }, { id: 'cerca', titulo: 'Tu diseño de cerca' },
    ...reales.map((f) => ({ id: `foto-${f.id}`, titulo: f.titulo, foto: f }))];
  const vistaFoto = vistas.find((v) => v.id === vista)?.foto;
  // Nombre: moverVista
  // Descripción: Cambia la vista (mano, foto...).
  // Entrada: El paso.
  // Salida: Nada.
  // Objetivo: Ver el diseño de varias formas.
  const moverVista = (paso) => { const i = vistas.findIndex((v) => v.id === vista); setVista(vistas[(i + paso + vistas.length) % vistas.length].id); };

  // Nombre: Opcion
  // Descripción: Muestra una opción con su precio.
  // Entrada: Campo, valor y precio.
  // Salida: El botón.
  // Objetivo: Elegir opciones.
  const Opcion = ({ campo, valor, precio, una = false }) => {
    const elegido = una ? (actual[campo] || diseno[campo]) === valor : diseno[campo] === valor;
    return (
      <button type="button" className="tile" aria-pressed={elegido} onClick={() => (una ? cambiarUna(campo, valor) : general(campo, valor))}>
        <span className="tile__una"><Una d={{ ...datosUna(diseno, dedo), [campo]: valor }} /></span>
        <span className="tile__nombre">{valor}</span>
        {precio !== undefined && <span className="tile__precio">{mas(precio)}</span>}
      </button>
    );
  };

  return (
    <div className="estudio-pagina">
      <div className="contenedor migas-arriba"><Migas pasos={[['Diseña tus uñas']]} /></div>
      <span className="estudio-brillo estudio-brillo--1" aria-hidden="true" />
      <span className="estudio-brillo estudio-brillo--2" aria-hidden="true" />
      <div className="estudio">
        <h1 className="solo-lector">Diseña tus uñas</h1>

        {/* Izquierda */}
        <div className="estudio__col">
          <section className="estudio-panel" aria-labelledby="t-tono">
            <h2 id="t-tono">Tono de piel</h2>
            <div className="estudio-tonos" role="radiogroup" aria-labelledby="t-tono">
              {TONOS_FOTO.map((t) => (
                <button key={t.nombre} type="button" role="radio" aria-checked={tono.nombre === t.nombre} aria-label={t.nombre} className="estudio-tono"
                        style={{ '--piel': t.nombre === 'Clara' ? '#F3D3C0' : t.color || '#E2B69A' }} onClick={() => setTono(t)} />
              ))}
            </div>
          </section>
          <section className="estudio-panel" aria-labelledby="t-forma">
            <h2 id="t-forma">Forma de uñas</h2>
            <div className="tiles tiles--4">{OPCIONES_DISENO.forma.map((f) => <Opcion key={f} campo="forma" valor={f} una />)}</div>
          </section>
          <section className="estudio-panel" aria-labelledby="t-largo">
            <h2 id="t-largo">Largo</h2>
            <div className="tiles tiles--4">{OPCIONES_DISENO.largo.map((l) => <Opcion key={l} campo="largo" valor={l} precio={PRECIO_DISENO.largo[l]} una />)}</div>
          </section>
        </div>

        {/* Centro */}
        <div className="estudio__centro">
          <div className="estudio-foto">
            {vista === 'mano' && <ManoFoto diseno={diseno} tono={tono} seleccionada={modo === 'una' ? dedo : null} onElegir={elegirDedo} />}
            {vista === 'cerca' && (
              <div className="estudio-cerca">{[0, 1, 2, 3, 4].map((i) => <Una key={i} d={datosUna(diseno, i)} />)}</div>
            )}
            {vistaFoto && <Foto archivo={vistaFoto.archivo} alt={vistaFoto.descripcion || vistaFoto.titulo} className="estudio-foto__real" />}

            <div className="estudio-modo" role="group" aria-label="Aplicar cambios a">
              <button type="button" aria-pressed={modo === 'todas'} onClick={() => setModo('todas')}>Todas</button>
              <button type="button" aria-pressed={modo === 'una'} onClick={() => setModo('una')}>Una por una</button>
            </div>
            <button type="button" className="estudio-fav" aria-pressed={favorito} onClick={guardarFavorito} aria-label={favorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}>
              {favorito ? ICONOS.corazon : ICONOS.corazonVacio}
            </button>
            {vista === 'mano' && (
              <p className="estudio-chip">{modo === 'todas' ? 'Toca una uña para cambiarla sola' : `Editando: ${DEDOS[dedo].toLowerCase()}`}</p>
            )}
            {vistaFoto && (
              <button type="button" className="estudio-chip estudio-chip--boton" onClick={() => actualizar({ fotoRef: vistaFoto })}>
                {reserva.fotoRef?.id === vistaFoto.id ? '✓ Es tu foto de referencia' : 'Usar como referencia'}
              </button>
            )}
          </div>

          {modo === 'una' && vista === 'mano' && (
            <div className="estudio-dedos" role="group" aria-label="Elegir uña">
              {DEDOS.map((n, i) => (
                <button key={n} type="button" aria-pressed={dedo === i} onClick={() => elegirDedo(i)}>
                  <span className="estudio-dedos__una"><Una d={datosUna(diseno, i)} /></span>{n}
                </button>
              ))}
              <button type="button" className="estudio-dedos__copiar" onClick={() => setDiseno((d) => new DisenoBuilder({ ...d, unas: d.unas.map(() => ({ ...d.unas[dedo] })) }).build())}>Copiar a todas</button>
            </div>
          )}

          <div className="estudio-miniaturas">
            <button type="button" className="estudio-flecha" onClick={() => moverVista(-1)} aria-label="Vista anterior">‹</button>
            <ul>
              {vistas.map((v) => (
                <li key={v.id}>
                  <button type="button" className="estudio-mini" aria-pressed={vista === v.id} onClick={() => setVista(v.id)} aria-label={v.titulo}>
                    {v.foto ? <Foto archivo={v.foto.archivo} alt="" /> : v.id === 'mano'
                      ? <img src="/img/mano.jpg" alt="" /> : <span className="estudio-mini__cerca"><Una d={datosUna(diseno, 1)} /><Una d={datosUna(diseno, 2)} /></span>}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="estudio-flecha" onClick={() => moverVista(1)} aria-label="Vista siguiente">›</button>
          </div>
        </div>

        {/* Derecha */}
        <div className="estudio__col">
          <section className="estudio-panel" aria-label="Color, acabado y decoración">
            <div className="estudio-tabs" role="tablist">
              {[['color', 'Colores'], ['acabado', 'Acabados'], ['decoracion', 'Decoración']].map(([k, t]) => (
                <button key={k} type="button" role="tab" aria-selected={panel === k} onClick={() => setPanel(k)}>{ICONOS[k]}{t}</button>
              ))}
            </div>

            {panel === 'color' && (
              <div className="estudio-colores">
                {verTodos && (
                  <>
                    <label className="buscador buscador--chico">
                      <span className="solo-lector">Buscar esmalte</span>
                      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                      <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Busca: rojo, nude, AH-120…" />
                    </label>
                    <div className="estudio-familias">
                      {['Todos', ...FAMILIAS_ESMALTE].map((f) => <button key={f} type="button" aria-pressed={familia === f} onClick={() => setFamilia(f)}>{f}</button>)}
                    </div>
                  </>
                )}
                <div className={`muestras ${verTodos ? 'muestras--todas' : ''}`} role="radiogroup" aria-label="Esmaltes">
                  {(verTodos ? esmaltes : DESTACADOS.map(esmalte).filter(Boolean)).map((e) => (
                    <Muestra key={e.codigo} e={e} elegido={actual.esmalte === e.codigo} onElegir={(c) => cambiarUna('esmalte', c)} />
                  ))}
                </div>
                <button type="button" className="estudio-ver-mas" onClick={() => setVerTodos(!verTodos)}>
                  {verTodos ? 'Ver menos colores ⌃' : `Ver los ${ESMALTES.length} colores ⌄`}
                </button>
                <p className="tenue estudio-nota">Elegido: <strong>{esmalte(actual.esmalte)?.nombre}</strong> ({actual.esmalte}) · Especiales por dedo: glitter +{dinero(EXTRA_TIPO.Glitter)}, metálico +{dinero(EXTRA_TIPO['Metálico'])}</p>
              </div>
            )}
            {panel === 'acabado' && <div className="tiles tiles--4">{OPCIONES_DISENO.acabado.map((a) => <Opcion key={a} campo="acabado" valor={a} precio={PRECIO_DISENO.acabado[a]} una />)}</div>}
            {panel === 'decoracion' && <div className="tiles tiles--4">{OPCIONES_DISENO.decoracion.map((d) => <Opcion key={d} campo="decoracion" valor={d} precio={PRECIO_DISENO.decoracion[d]} una />)}</div>}
          </section>

          <section className="estudio-oferta" aria-labelledby="t-oferta">
            <div className="estudio-oferta__cabeza">
              <span id="t-oferta" className="estudio-oferta__etiqueta">Oferta especial</span>
              <CuentaRegresiva />
            </div>
            <p className="estudio-oferta__precio">
              <strong key={conCupon}>{dinero(conCupon)}</strong>
              <s>{dinero(total)}</s>
              <span className="estudio-oferta__pct">-15%</span>
            </p>
            <p className="estudio-oferta__nota">✓ Con BIENVENIDA15 en tu primera cita</p>
            <label className="estudio-servicio">
              <span>Servicio</span>
              <select value={servicio?.nombre || ''} onChange={(e) => setServicioNombre(e.target.value)}>
                {servicios.filter((s) => SERVICIOS_DISENO.includes(s.nombre)).map((s) => <option key={s.id} value={s.nombre}>{s.nombre} · {dinero(s.precio_oferta ?? s.precio)}</option>)}
              </select>
            </label>
            <button type="button" className="estudio-desglose-boton" aria-expanded={verDesglose} onClick={() => setVerDesglose(!verDesglose)}>
              {dinero(base)} servicio + {dinero(recargo.total)} diseño {verDesglose ? '⌃' : '⌄'}
            </button>
            {verDesglose && (
              <dl className="estudio-desglose">
                <div><dt>{servicio?.nombre}</dt><dd>{dinero(base)}</dd></div>
                {recargo.lineas.map((l) => <div key={l.concepto}><dt>{l.concepto}</dt><dd>{mas(l.monto)}</dd></div>)}
                <div className="estudio-desglose__total"><dt>Total sin cupón</dt><dd>{dinero(total)}</dd></div>
              </dl>
            )}
            <div className="estudio-oferta__botones">
              <button type="button" className="estudio-boton" onClick={reservar}>Reservar con este diseño</button>
              <button type="button" className="estudio-fav estudio-fav--chico" aria-pressed={favorito} onClick={guardarFavorito} aria-label="Guardar en favoritos">{favorito ? ICONOS.corazon : ICONOS.corazonVacio}</button>
            </div>
            {presson && <button type="button" className="estudio-presson" onClick={pedirPresson}>o llévalo en press-on · {dinero(presson.precio)}</button>}
            {aviso && <p role="status" className="anadido__ok">{aviso} <Link to="/carrito" className="enlace">Ver carrito</Link></p>}
          </section>
        </div>
      </div>

      <ul className="estudio-confianza">
        <li>Pago protegido</li><li>Retiro gratis en el salón</li><li>Tu especialista revisa el diseño contigo</li><li>Atención por WhatsApp</li>
      </ul>

      <div className="contenedor estudio-notas">
        <label htmlFor="notas">Notas para tu especialista <span className="tenue">(opcional)</span></label>
        <textarea id="notas" rows="2" maxLength="500" value={diseno.notas || ''} onChange={(e) => general('notas', e.target.value)}
                  placeholder="Por ejemplo: quiero la francesa más delgada, o tengo una uña quebrada." />
      </div>
    </div>
  );
}
