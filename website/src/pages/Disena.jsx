// PÁGINA "Diseña tus uñas".
// La clienta arma su diseño paso a paso. En el centro ve su diseño
// en una mano real; a la derecha, fotos reales parecidas de la galería, la tabla uña por uña y el precio.
// Regla principal: si toca una uña, SOLO esa uña cambia. Para cambiar las cinco debe elegir "Todas las uñas".
// La lógica (sin pantallas) está en lib/disenoUnas.js y las piezas visuales en components/disena/PiezasDiseno.jsx.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { describir } from '../patrones/constructorDiseno.js';
import { OPCIONES_DISENO, PRECIO_DISENO, EXTRAS, POSICIONES, DEDOS, esmalte, calcularDiseno } from '../lib/esmaltes.js';
import {
  TODAS_LAS_UNAS, leerConfiguracion, armarDiseno, cambiarUnas, decoracionesDe, ponerDecoracion, datosNuevaDecoracion,
  palabrasParaFotos, textoDeUna, mensajeWhatsApp
} from '../lib/disenoUnas.js';
import { useReserva } from '../context/ReservaContext.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import { api } from '../lib/api.js';
import { dinero, enlaceWhatsApp } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import ManoFoto, { TONOS_FOTO } from '../components/ManoFoto.jsx';
import { Una, datosUna } from '../components/DibujoUnas.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import Migas from '../components/Migas.jsx';
import { IconoDecoracion, FormaUna, Paso, Opciones, Muestrario, masPrecio } from '../components/disena/PiezasDiseno.jsx';

// Servicios con los que se puede hacer un diseño (el sugerido depende del largo)
const SERVICIOS_PARA_DISENO = ['Manicure semipermanente', 'Manicure rusa', 'Builder gel (nivelación)', 'Soft gel (tips de gel)', 'Polygel', 'Uñas acrílicas'];
// Nombre: servicioSegunLargo
// Descripción: Sugiere el servicio según el largo de las uñas.
// Entrada: El largo.
// Salida: El nombre del servicio.
// Objetivo: Reservar el servicio correcto.
const servicioSegunLargo = (largo) => (largo === 'Corto' ? 'Manicure semipermanente' : largo === 'Medio' ? 'Polygel' : 'Uñas acrílicas');
// Técnicas que se pintan sobre el color (las piedras y el foil están en Decoraciones)
const TECNICAS = OPCIONES_DISENO.decoracion.filter((tecnica) => !['Pedrería', 'Foil dorado'].includes(tecnica));
const NOMBRE_VISIBLE_TECNICA = { Ninguna: 'Lisa' };
const DESCUENTO_PRIMERA_CITA = 0.15;
// Nombre: Disena
// Descripción: Página para armar el diseño de uñas.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Que la clienta pida exactamente lo que quiere y vea cómo se verá.
export default function Disena() {
  useTitulo('Diseña tus uñas');
  const { reserva, actualizar: actualizarReserva } = useReserva();
  const carrito = useCarrito();
  const navegar = useNavigate();

  // Lo que la clienta va eligiendo
  const [configuracion, setConfiguracion] = useState(() => leerConfiguracion(reserva.diseno?.config));
  const [modoEdicion, setModoEdicion] = useState('todas'); // 'todas' o 'una'
  const [unaElegida, setUnaElegida] = useState(3); // 0 pulgar … 4 meñique
  // Lo que se muestra
  const [tonoPiel, setTonoPiel] = useState(TONOS_FOTO[1]);
  const [vistaMano, setVistaMano] = useState('mano'); // 'mano' o 'cerca'
  const [fotosParecidas, setFotosParecidas] = useState([]);
  const [fotoGrande, setFotoGrande] = useState(0);
  const [verDetallePrecio, setVerDetallePrecio] = useState(false);
  const [avisoCarrito, setAvisoCarrito] = useState('');
  // Datos del salón
  const [servicios, setServicios] = useState([]);
  const [servicioElegido, setServicioElegido] = useState(null);
  const [productoPresson, setProductoPresson] = useState(null);

  useEffect(() => {
    api.servicios().then(setServicios).catch(() => {});
    api.productos({ q: 'Press-on personalizado', limite: 1 })
      .then((respuesta) => setProductoPresson((respuesta.productos || respuesta)[0] || null))
      .catch(() => {});
  }, []);

  const unasEnEdicion = modoEdicion === 'todas' ? TODAS_LAS_UNAS : [unaElegida];
  const unaDeReferencia = configuracion.unas[modoEdicion === 'todas' ? 1 : unaElegida];
  const nombreUnaElegida = DEDOS[unaElegida].toLowerCase();
  const vecesQueSeCobra = unasEnEdicion.length * 2; // cada uña elegida, en las dos manos

  // Nombre: cambiarGeneral
  // Descripción: Cambia lo que es igual en todas las uñas (forma, largo, notas).
  // Entrada: El campo y el valor.
  // Salida: Nada.
  // Objetivo: Actualizar el diseño.
  const cambiarGeneral = (campo, valor) => setConfiguracion((actual) => ({ ...actual, [campo]: valor }));
  // Nombre: cambiarUnasEnEdicion
  // Descripción: Cambia color, técnica o acabado solo en las uñas que se están editando.
  // Entrada: El campo y el valor.
  // Salida: Nada.
  // Objetivo: Que tocar una uña no cambie las demás.
  const cambiarUnasEnEdicion = (campo, valor) => setConfiguracion((actual) => cambiarUnas(actual, unasEnEdicion, campo, valor));
  // Nombre: decorar
  // Descripción: Pone, cambia o quita una decoración solo en las uñas que se están editando.
  // Entrada: El tipo y sus datos (o null para quitarla).
  // Salida: Nada.
  // Objetivo: Decorar uña por uña.
  const decorar = (tipo, datos) => setConfiguracion((actual) => ponerDecoracion(actual, unasEnEdicion, tipo, datos));
  // Nombre: tieneDecoracion
  // Descripción: Dice si todas las uñas en edición tienen esa decoración.
  // Entrada: El tipo de decoración.
  // Salida: Verdadero o falso.
  // Objetivo: Marcar el botón como elegido.
  const tieneDecoracion = (tipo) => unasEnEdicion.every((indice) => decoracionesDe(configuracion, indice).some((decoracion) => decoracion.tipo === tipo));
  // Nombre: elegirUna
  // Descripción: Elige una uña para cambiarla sola.
  // Entrada: El número de la uña.
  // Salida: Nada.
  // Objetivo: Editar uña por uña desde la mano.
  const elegirUna = (indice) => { setUnaElegida(indice); setModoEdicion('una'); };
  // Nombre: copiarUnaATodas
  // Descripción: Repite la uña elegida (color, técnica, acabado y decoraciones) en las cinco.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Repetir un diseño rápido.
  const copiarUnaATodas = () => setConfiguracion((actual) => {
    const modelo = actual.unas[unaElegida];
    let copia = { ...actual, unas: actual.unas.map(() => ({ ...modelo })) };
    copia.decoraciones.forEach((decoracion) => { copia = ponerDecoracion(copia, TODAS_LAS_UNAS, decoracion.tipo, null); });
    decoracionesDe(actual, unaElegida).forEach((decoracion) => { copia = ponerDecoracion(copia, TODAS_LAS_UNAS, decoracion.tipo, decoracion); });
    return copia;
  });

  // Diseño y precio
  const diseno = useMemo(() => armarDiseno(configuracion), [configuracion]);
  const recargo = useMemo(() => calcularDiseno(diseno), [diseno]);
  const servicio = servicios.find((s) => s.nombre === (servicioElegido || servicioSegunLargo(configuracion.largo)));
  const precioServicio = servicio ? (servicio.precio_oferta ?? servicio.precio) : 0;
  const precioTotal = precioServicio + recargo.total;
  const precioConCupon = Math.round(precioTotal * (1 - DESCUENTO_PRIMERA_CITA));

  // Fotos reales parecidas (se buscan de nuevo cuando cambia lo elegido)
  const palabrasDeBusqueda = useMemo(() => palabrasParaFotos(configuracion), [configuracion]);
  useEffect(() => {
    const espera = setTimeout(() => api.fotosParecidas(palabrasDeBusqueda, 7)
      .then((lista) => { setFotosParecidas(lista); setFotoGrande(0); })
      .catch(() => setFotosParecidas([])), 250);
    return () => clearTimeout(espera);
  }, [palabrasDeBusqueda.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const fotoPrincipal = fotosParecidas[fotoGrande];

  // Nombre: reservarConDiseno
  // Descripción: Lleva el diseño a la reserva.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Agendar la cita con este diseño.
  const reservarConDiseno = () => {
    actualizarReserva({ diseno: { ...diseno, id: null }, ...(fotoPrincipal ? { fotoRef: fotoPrincipal } : {}) });
    navegar(servicio ? `/reservar?servicio=${servicio.id}` : '/reservar');
  };
  // Nombre: pedirEnPresson
  // Descripción: Agrega el diseño en press-on al carrito.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Comprarlo para ponérselo en casa.
  const pedirEnPresson = () => {
    if (!productoPresson) return;
    carrito.agregar(
      { id: productoPresson.id, nombre: 'Press-on con tu diseño', precio: productoPresson.precio, precio_anterior: productoPresson.precio_anterior, stock: productoPresson.stock, tipo: 'tips', color: esmalte(configuracion.unas[1].esmalte)?.hex },
      { detalle: describir(diseno), cantidad: 1, unico: true }
    );
    setAvisoCarrito('Agregamos el press-on con tu diseño al carrito.');
  };

  const decoracionesVisibles = decoracionesDe(configuracion, modoEdicion === 'todas' ? 1 : unaElegida);

  return (
    <div className="dp">
      <div className="contenedor migas-arriba"><Migas pasos={[['Diseña tus uñas']]} /></div>
      <header className="contenedor dp-cabeza">
        <p className="dp-cabeza__ante">Diseño a tu medida</p>
        <h1>Diseña tus uñas</h1>
        <p>Elige paso a paso cómo las quieres. Mientras eliges ves tu diseño en la mano, fotos reales parecidas y el precio. Tu especialista lo revisa contigo antes de empezar.</p>
      </header>

      <div className="contenedor dp-rejilla">
        {/* Columna 1: pasos */}
        <div className="dp-pasos">
          <section className="dp-modo" aria-labelledby="dp-t-modo">
            <div className="dp-modo__cabeza">
              <h2 id="dp-t-modo">¿Qué uñas quieres cambiar?</h2>
              <div className="dp-modo__selector" role="radiogroup" aria-label="Uñas que cambian">
                <button type="button" role="radio" aria-checked={modoEdicion === 'todas'} onClick={() => setModoEdicion('todas')}>Las 5 uñas</button>
                <button type="button" role="radio" aria-checked={modoEdicion === 'una'} onClick={() => setModoEdicion('una')}>Una sola uña</button>
              </div>
            </div>
            <div className="dp-modo__unas" role="group" aria-label="Elegir uña">
              {DEDOS.map((nombreDedo, indice) => {
                const activa = modoEdicion === 'todas' || unaElegida === indice;
                return (
                  <button key={nombreDedo} type="button" aria-pressed={modoEdicion === 'una' && unaElegida === indice} className={activa ? 'dp-modo__una--activa' : ''}
                          onClick={() => elegirUna(indice)}>
                    <span className="dp-modo__dibujo"><Una d={datosUna(diseno, indice)} /></span>
                    {nombreDedo}
                  </button>
                );
              })}
            </div>
            <p className="dp-modo__ayuda">
              {modoEdicion === 'todas'
                ? 'Lo que elijas abajo se pone en las 5 uñas. Toca una uña para cambiarla sola.'
                : <>Lo que elijas abajo va <strong>solo en el {nombreUnaElegida}</strong>. <button type="button" className="dp-link" onClick={copiarUnaATodas}>Copiar el {nombreUnaElegida} a las 5 uñas</button></>}
            </p>
          </section>

          <Paso numero="1" titulo="Forma y largo" ayuda="Son iguales en todas las uñas.">
            <div className="dp-formas" role="radiogroup" aria-label="Forma de uñas">
              {OPCIONES_DISENO.forma.map((forma) => (
                <button key={forma} type="button" role="radio" aria-checked={configuracion.forma === forma} onClick={() => cambiarGeneral('forma', forma)}><FormaUna forma={forma} />{forma}</button>
              ))}
            </div>
            <h3 className="dp-sub">Largo</h3>
            <Opciones etiqueta="Largo" opciones={OPCIONES_DISENO.largo} valor={configuracion.largo} onElegir={(largo) => cambiarGeneral('largo', largo)} precio={(largo) => PRECIO_DISENO.largo[largo]} />
          </Paso>

          <Paso numero="2" titulo={modoEdicion === 'todas' ? 'Color' : `Color del ${nombreUnaElegida}`}
                ayuda={modoEdicion === 'todas' ? 'Para un color distinto en una uña, tócala en la mano.' : 'Este color va solo en esta uña.'}>
            <Muestrario etiqueta="Color" valor={unaDeReferencia.esmalte} onElegir={(codigo) => cambiarUnasEnEdicion('esmalte', codigo)} />
          </Paso>

          <Paso numero="3" titulo={modoEdicion === 'todas' ? 'Técnica' : `Técnica del ${nombreUnaElegida}`} ayuda="Cómo se pinta el color.">
            <Opciones etiqueta="Técnica" opciones={TECNICAS} valor={unaDeReferencia.tecnica} onElegir={(tecnica) => cambiarUnasEnEdicion('tecnica', tecnica)}
                      nombre={(tecnica) => NOMBRE_VISIBLE_TECNICA[tecnica] || tecnica} precio={(tecnica) => PRECIO_DISENO.decoracion[tecnica] * vecesQueSeCobra} />
          </Paso>

          <Paso numero="4" titulo={modoEdicion === 'todas' ? 'Acabado' : `Acabado del ${nombreUnaElegida}`}>
            <Opciones etiqueta="Acabado" opciones={OPCIONES_DISENO.acabado} valor={unaDeReferencia.acabado} onElegir={(acabado) => cambiarUnasEnEdicion('acabado', acabado)}
                      precio={(acabado) => PRECIO_DISENO.acabado[acabado] * vecesQueSeCobra} />
          </Paso>

          <Paso numero="5" titulo={modoEdicion === 'todas' ? 'Decoraciones' : `Decoraciones del ${nombreUnaElegida}`}
                ayuda={modoEdicion === 'todas' ? 'Se ponen en las 5 uñas. Para una sola, tócala en la mano.' : 'Solo en esta uña. Las demás no cambian.'}>
            <div className="dp-extras">
              {Object.entries(EXTRAS).map(([tipo, datosTipo]) => {
                const puesta = tieneDecoracion(tipo);
                return (
                  <button key={tipo} type="button" aria-pressed={puesta} onClick={() => decorar(tipo, puesta ? null : datosNuevaDecoracion(tipo))}>
                    <IconoDecoracion tipo={tipo} /><span>{tipo}</span><small>+{dinero(datosTipo.precio * vecesQueSeCobra)}</small>
                  </button>
                );
              })}
            </div>
            {decoracionesVisibles.map((decoracion) => (
              <div key={decoracion.tipo} className="dp-caja dp-extra">
                <div className="dp-extra__cabeza">
                  <h3><IconoDecoracion tipo={decoracion.tipo} />{decoracion.tipo}</h3>
                  <button type="button" className="dp-link" onClick={() => decorar(decoracion.tipo, null)}>Quitar</button>
                </div>
                <h4 className="dp-sub">Tipo</h4>
                <Opciones etiqueta={`Tipo de ${decoracion.tipo}`} opciones={EXTRAS[decoracion.tipo].variantes} valor={decoracion.variante}
                          onElegir={(variante) => decorar(decoracion.tipo, { variante, posicion: decoracion.posicion })} />
                <h4 className="dp-sub">¿En qué parte de la uña?</h4>
                <Opciones etiqueta="Parte de la uña" opciones={POSICIONES} valor={decoracion.posicion}
                          onElegir={(posicion) => decorar(decoracion.tipo, { variante: decoracion.variante, posicion })} />
              </div>
            ))}
          </Paso>

          <Paso numero="6" titulo="Notas para tu especialista" ayuda="Cuéntanos cualquier detalle. Si tienes una foto de lo que quieres, mándala por WhatsApp con tu pedido.">
            <textarea className="dp-notas" rows="3" maxLength="500" value={configuracion.notas} onChange={(evento) => cambiarGeneral('notas', evento.target.value)}
                      placeholder="Por ejemplo: la francesa más delgada, perlas pequeñas, tengo una uña quebrada." />
          </Paso>
        </div>

        {/* Columna 2: la mano */}
        <div className="dp-mano">
          <section className="dp-tarjeta" aria-labelledby="dp-t-mano">
            <div className="dp-tarjeta__cabeza">
              <h2 id="dp-t-mano">Tu diseño en la mano</h2>
              <p>Toca una uña para cambiarla sola. Lo que elijas se ve aquí al instante.</p>
            </div>
            <div className="dp-vista" role="tablist" aria-label="Cómo ver el diseño">
              <button type="button" role="tab" aria-selected={vistaMano === 'mano'} onClick={() => setVistaMano('mano')}>En la mano</button>
              <button type="button" role="tab" aria-selected={vistaMano === 'cerca'} onClick={() => setVistaMano('cerca')}>De cerca</button>
            </div>
            {vistaMano === 'mano'
              ? <ManoFoto diseno={diseno} tono={tonoPiel} seleccionada={modoEdicion === 'una' ? unaElegida : null} onElegir={elegirUna} />
              : (
                <div className="dp-cerca">
                  <div className="dp-cerca__grande"><Una d={datosUna(diseno, unaElegida)} /><span>{DEDOS[unaElegida]}</span></div>
                  <div className="dp-cerca__fila" role="group" aria-label="Elegir uña">
                    {DEDOS.map((nombreDedo, indice) => (
                      <button key={nombreDedo} type="button" aria-pressed={modoEdicion === 'una' && unaElegida === indice} onClick={() => elegirUna(indice)}>
                        <Una d={datosUna(diseno, indice)} /><span>{nombreDedo}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            <div className="dp-tonos" role="radiogroup" aria-label="Tono de piel">
              <span>Tono de piel</span>
              {TONOS_FOTO.map((tono) => (
                <button key={tono.nombre} type="button" role="radio" aria-checked={tonoPiel.nombre === tono.nombre} aria-label={tono.nombre} title={tono.nombre}
                        style={{ '--piel': tono.nombre === 'Clara' ? '#F3D3C0' : tono.color || '#E2B69A' }} onClick={() => setTonoPiel(tono)} />
              ))}
            </div>
          </section>
        </div>

        {/* Columna 3: fotos reales, tabla y precio */}
        <aside className="dp-lado" aria-label="Fotos reales y precio">
          <section className="dp-tarjeta" aria-labelledby="dp-reales">
            <div className="dp-tarjeta__cabeza">
              <h2 id="dp-reales">Así se ve en uñas reales</h2>
              <p>Fotos de nuestra galería parecidas a tu diseño.</p>
            </div>
            {fotoPrincipal ? (
              <>
                <div className="dp-real">
                  <Foto archivo={fotoPrincipal.archivo} alt={fotoPrincipal.descripcion || fotoPrincipal.titulo} />
                  <p className="dp-real__titulo">{fotoPrincipal.titulo}</p>
                </div>
                {fotoPrincipal.coinciden?.length > 0 && (
                  <p className="dp-coinciden">Se parece en: {fotoPrincipal.coinciden.map((palabra) => <span key={palabra}>{palabra}</span>)}</p>
                )}
                <ul className="dp-miniaturas">
                  {fotosParecidas.map((foto, indice) => (
                    <li key={foto.id}><button type="button" aria-pressed={indice === fotoGrande} aria-label={foto.titulo} onClick={() => setFotoGrande(indice)}><Foto archivo={foto.archivo} alt="" /></button></li>
                  ))}
                </ul>
              </>
            ) : <p className="tenue">Cargando fotos…</p>}
          </section>

          <section className="dp-tarjeta" aria-labelledby="dp-hoja">
            <h2 id="dp-hoja" className="dp-tarjeta__titulo">Tu diseño uña por uña</h2>
            <table className="dp-hoja">
              <thead><tr><th scope="col">Uña</th><th scope="col">Color</th><th scope="col">Detalles</th></tr></thead>
              <tbody>
                {configuracion.unas.map((una, indice) => {
                  const color = esmalte(una.esmalte);
                  return (
                    <tr key={DEDOS[indice]} className={modoEdicion === 'una' && unaElegida === indice ? 'dp-hoja__activa' : ''} onClick={() => elegirUna(indice)}>
                      <th scope="row">{DEDOS[indice]}</th>
                      <td><span className="dp-hoja__color" style={{ '--c': color.hex }} />{color.nombre}</td>
                      <td>{textoDeUna(configuracion, indice) || <span className="tenue">Liso</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="dp-hoja__pie">{configuracion.forma} · {configuracion.largo.toLowerCase()}. Igual en las dos manos.</p>
          </section>

          <section className="dp-tarjeta dp-precio" aria-labelledby="dp-t-precio">
            <div className="dp-precio__cabeza">
              <span id="dp-t-precio" className="dp-precio__etiqueta">Precio estimado</span>
              <CuentaRegresiva compacta />
            </div>
            <p className="dp-precio__monto"><strong>{dinero(precioConCupon)}</strong><s>{dinero(precioTotal)}</s><span>-15%</span></p>
            <p className="dp-precio__nota">Con el cupón BIENVENIDA15 en tu primera cita.</p>
            <label className="dp-precio__servicio">
              <span>Servicio</span>
              <select value={servicio?.nombre || ''} onChange={(evento) => setServicioElegido(evento.target.value)}>
                {servicios.filter((s) => SERVICIOS_PARA_DISENO.includes(s.nombre)).map((s) => <option key={s.id} value={s.nombre}>{s.nombre} · {dinero(s.precio_oferta ?? s.precio)}</option>)}
              </select>
            </label>
            <button type="button" className="dp-link" aria-expanded={verDetallePrecio} onClick={() => setVerDetallePrecio(!verDetallePrecio)}>
              {verDetallePrecio ? 'Ocultar detalle del precio' : `Servicio ${dinero(precioServicio)} + diseño ${dinero(recargo.total)} · ver detalle`}
            </button>
            {verDetallePrecio && (
              <dl className="dp-desglose">
                <div><dt>{servicio?.nombre}</dt><dd>{dinero(precioServicio)}</dd></div>
                {recargo.lineas.map((linea) => <div key={linea.concepto}><dt>{linea.concepto}</dt><dd>{masPrecio(linea.monto)}</dd></div>)}
                <div className="dp-desglose__total"><dt>Total sin cupón</dt><dd>{dinero(precioTotal)}</dd></div>
              </dl>
            )}
            <button type="button" className="boton dp-precio__reservar" onClick={reservarConDiseno}>Reservar con este diseño</button>
            <a className="boton boton--borde dp-precio__wa" href={enlaceWhatsApp(mensajeWhatsApp(configuracion, precioTotal))} target="_blank" rel="noreferrer">Enviar pedido por WhatsApp para cotizar</a>
            {productoPresson && <button type="button" className="dp-link dp-precio__presson" onClick={pedirEnPresson}>O pídelo en press-on para ponértelo en casa · {dinero(productoPresson.precio)}</button>}
            {avisoCarrito && <p role="status" className="anadido__ok">{avisoCarrito} <Link to="/carrito" className="enlace">Ver carrito</Link></p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
