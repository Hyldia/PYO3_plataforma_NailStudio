// Detalle de un diseño de la Galería: foto grande, datos, diseños parecidos y botón para reservarlo.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import { useReserva } from '../context/ReservaContext.jsx';
import Foto from '../components/Foto.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import Resenas from '../components/Resenas.jsx';
import BotonFavorito from '../components/BotonFavorito.jsx';
import { olvidarResumenes, useResumenes } from '../lib/resumenesOpiniones.js';
import TarjetaDiseno, { miles, positivo, useAgregarPresson } from '../components/TarjetaDiseno.jsx';
import Icono from '../components/Icono.jsx';

const FORMAS = ['Almendra', 'Ovalada', 'Cuadrada', 'Coffin', 'Stiletto'];
const LARGOS = ['Corto', 'Medio', 'Largo'];

// Nombre: DisenoDetalle
// Descripción: Muestra la página de un diseño.
// Entrada: Nada.
// Salida: La página.
// Objetivo: Ver el diseño en grande.
export default function DisenoDetalle() {
  const { id } = useParams();
  const [foto, setFoto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const resumenes = useResumenes('foto');
  const [error, setError] = useState('');
  const [modo, setModo] = useState('salon');
  const [forma, setForma] = useState('Almendra');
  const [largo, setLargo] = useState('Medio');
  const agregarPresson = useAgregarPresson();
  const { actualizar } = useReserva();
  const navegar = useNavigate();
  useTitulo(foto?.titulo || 'Diseño');

  useEffect(() => {
    setFoto(null); setError(''); window.scrollTo(0, 0);
    api.foto(id).then((respuesta) => { setFoto(respuesta); setForma(respuesta.forma || 'Almendra'); api.vistaFoto(respuesta.id); }).catch((fallo) => setError(fallo.message));
    api.fotosRelacionadas(id, 15).then(setRelacionados).catch(() => setRelacionados([]));
  }, [id]);

  if (error) return <div className="contenedor pagina"><p role="alert" className="error">{error}</p><Link to="/galeria" className="enlace">Volver a la galería</Link></div>;
  if (!foto) return <div className="contenedor pagina"><p className="tenue" role="status">Cargando diseño…</p></div>;

  const presson = foto.presson;
  // Nombre: reservar
  // Descripción: Reserva el diseño.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ir a reservar.
  const reservar = () => { actualizar({ fotoRef: foto, diseno: null }); navegar(foto.servicio ? `/reservar?servicio=${foto.servicio.id}` : '/reservar'); };
  // Nombre: personalizar
  // Descripción: Abre el diseño en el diseñador.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Personalizarlo.
  const personalizar = () => { actualizar({ fotoRef: foto, diseno: null }); navegar('/disena'); };
  // Nombre: agregar
  // Descripción: Agrega el press-on al carrito.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Comprarlo.
  const agregar = () => agregarPresson(foto, { forma, largo, presson: presson });
  const opinion = resumenes.get(foto.id);
  const descuentoPresson = presson?.precio_anterior ? Math.round((1 - presson.precio / presson.precio_anterior) * 100) : 0;

  return (
    <div className="contenedor pagina detalle-pagina">
      <nav aria-label="Ruta" className="migas">
        <ol>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/galeria">Galería</Link></li>
          <li><Link to={`/galeria?categoria=${encodeURIComponent(foto.categoria)}`}>{foto.categoria}</Link></li>
          <li aria-current="page">{foto.titulo}</li>
        </ol>
      </nav>

      <div className="detalle">
        <div className="detalle__galeria">
          <div className="detalle__imagen"><Foto archivo={foto.archivo} alt={foto.descripcion || foto.titulo} prioridad />
            <BotonFavorito tipo="diseno" nombre={foto.titulo} clase="corazon--grande"
                           datos={{ id: foto.id, titulo: foto.titulo, archivo: foto.archivo, descripcion: foto.descripcion, categoria: foto.categoria, forma: foto.forma, color: foto.color, acabado: foto.acabado, vistas: foto.vistas, precio_salon: foto.servicio?.precio, servicio_id: foto.servicio?.id }} />
          </div>
          {foto.autor && <p className="tenue detalle__credito">Foto de <a className="enlace" href={foto.autor_url} target="_blank" rel="noreferrer">{foto.autor}</a> en Unsplash</p>}
        </div>

        <div className="detalle__info">
          <div className="franja-promo">
            <b>AH NAILS</b>
            <span>✓ Retiro gratis en el salón</span>
            <span>✓ Cupón BIENVENIDA15</span>
          </div>
          <h1 className="detalle__titulo">{foto.titulo}</h1>
          {foto.descripcion && foto.descripcion !== foto.titulo && <p className="detalle__descripcion">{foto.descripcion}</p>}
          <p className="detalle__datos">
            <span>{miles(foto.vistas)} vistas</span>
            <span aria-hidden="true">|</span>
            <span>{foto.categoria}</span>
            {opinion ? <a href="#resenas" className="detalle__estrellas" aria-label={`${opinion.promedio} de 5 estrellas, ${opinion.total} opiniones`}><span aria-hidden="true">{'★'.repeat(Math.round(opinion.promedio))}</span> {opinion.promedio} ({opinion.total})</a>
              : <span className="detalle__estrellas" aria-label={`${positivo(foto.id)} % de opiniones positivas`}><span aria-hidden="true">★★★★★</span> {positivo(foto.id)} %</span>}
          </p>
          {foto.puesto <= 10 && <p className="insignia-ranking"><Icono nombre="trofeo" tam={16} /> #{foto.puesto} MÁS POPULAR <span>en {foto.categoria}</span></p>}

          <div className="detalle__precio">
            {modo === 'salon' ? (
              <>
                <p><span className="detalle__precio-grande">{dinero(foto.servicio?.precio)}</span> <span className="tenue">en el salón · {foto.servicio?.nombre}, {foto.servicio?.duracion_min} min</span></p>
                <p className="tenue">Con el cupón BIENVENIDA15 pagas {dinero(Math.round((foto.servicio?.precio || 0) * 0.85))} en tu primera cita.</p>
              </>
            ) : (
              <>
                <p>
                  {presson?.precio_anterior && <s className="detalle__antes">{dinero(presson.precio_anterior)}</s>}
                  <span className="detalle__precio-grande">{dinero(presson?.precio)}</span>
                </p>
                {descuentoPresson > 0 && <p className="etiquetas-oferta"><span>{descuentoPresson} % DE DESCUENTO por tiempo limitado</span>{presson.stock < 10 && <span>CASI AGOTADO</span>}</p>}
              </>
            )}
          </div>

          <section className="caja-venta" aria-labelledby="t-opciones">
            <div className="caja-venta__cabeza">
              <span id="t-opciones">GRAN VENTA</span>
              <CuentaRegresiva claro />
            </div>
            <div className="caja-venta__cuerpo">
              <fieldset className="grupo">
                <legend className="grupo__titulo grupo__titulo--chico">¿Cómo lo quieres?</legend>
                <div className="opciones-modo">
                  <label className="opcion-modo">
                    <input type="radio" name="modo" checked={modo === 'salon'} onChange={() => setModo('salon')} />
                    <span className="opcion-modo__foto"><Foto archivo={foto.archivo} alt="" /></span>
                    <span><b>En el salón</b><small>Te lo hacemos con cita</small></span>
                  </label>
                  <label className="opcion-modo">
                    <input type="radio" name="modo" checked={modo === 'presson'} onChange={() => setModo('presson')} disabled={!presson} />
                    <span className="opcion-modo__foto"><Foto archivo={foto.archivo} alt="" /><em>HOT</em></span>
                    <span><b>Press-on</b><small>24 uñas para llevar</small></span>
                  </label>
                </div>
              </fieldset>
              {modo === 'presson' && (
                <>
                  <fieldset className="grupo">
                    <legend className="grupo__titulo grupo__titulo--chico">Forma: <span className="tenue">{forma}</span></legend>
                    <div className="selector__opciones">
                      {FORMAS.map((formaActual) => <label key={formaActual} className="chip"><input type="radio" name="forma" checked={forma === formaActual} onChange={() => setForma(formaActual)} /><span>{formaActual}</span></label>)}
                    </div>
                  </fieldset>
                  <fieldset className="grupo">
                    <legend className="grupo__titulo grupo__titulo--chico">Largo: <span className="tenue">{largo}</span></legend>
                    <div className="selector__opciones">
                      {LARGOS.map((largoActual) => <label key={largoActual} className="chip"><input type="radio" name="largo" checked={largo === largoActual} onChange={() => setLargo(largoActual)} /><span>{largoActual}</span></label>)}
                    </div>
                  </fieldset>
                  <p className="tenue">Un set de 24 uñas con este diseño, para una persona.</p>
                </>
              )}
            </div>
          </section>

          {modo === 'salon' ? (
            <button type="button" className="boton-gigante" onClick={reservar}>¡Reserva este diseño! Quedan pocos espacios</button>
          ) : (
            <button type="button" className="boton-gigante" onClick={agregar}>¡Agrégalo ahora! ¡Los últimos!</button>
          )}
          <button type="button" className="enlace enlace--boton" onClick={personalizar}>Personalizar colores y forma antes de reservar</button>

          <ul className="detalle__garantias">
            <li>✓ Productos profesionales</li>
            <li>✓ Pago con SINPE o tarjeta</li>
            <li>✓ Cambios de cita sin costo hasta 24 h antes</li>
          </ul>
          {foto.etiquetas && <p className="tenue">Etiquetas: {foto.etiquetas.split(',').filter((parte) => !parte.includes('archivo:')).join(', ')}</p>}
        </div>
      </div>

      <Resenas tipo="foto" refId={foto.id} nombreProducto={`«${foto.titulo}»`} titulo="Opiniones de quienes se lo hicieron" onCambio={() => olvidarResumenes('foto')} />

      {relacionados.length > 0 && (
        <section className="relacionados" aria-labelledby="t-rel">
          <h2 id="t-rel">Diseños relacionados</h2>
          <ul className="disenos-rejilla">{relacionados.map((relacionado, i) => <TarjetaDiseno key={relacionado.id} foto={relacionado} indice={i} presson={presson} />)}</ul>
        </section>
      )}
    </div>
  );
}
