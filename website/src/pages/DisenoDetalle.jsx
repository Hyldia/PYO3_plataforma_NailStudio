import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero, urlFoto } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import { useReserva } from '../context/ReservaContext.jsx';
import Foto from '../components/Foto.jsx';
import CuentaRegresiva from '../components/CuentaRegresiva.jsx';
import TarjetaDiseno, { miles, positivo, useAgregarPresson } from '../components/TarjetaDiseno.jsx';

const FORMAS = ['Almendra', 'Ovalada', 'Cuadrada', 'Coffin', 'Stiletto'];
const LARGOS = ['Corto', 'Medio', 'Largo'];

export default function DisenoDetalle() {
  const { id } = useParams();
  const [foto, setFoto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
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
    api.foto(id).then((f) => { setFoto(f); setForma(f.forma || 'Almendra'); api.vistaFoto(f.id); }).catch((e) => setError(e.message));
    api.fotosRelacionadas(id, 15).then(setRelacionados).catch(() => setRelacionados([]));
  }, [id]);

  if (error) return <div className="contenedor pagina"><p role="alert" className="error">{error}</p><Link to="/galeria" className="enlace">Volver a la galería</Link></div>;
  if (!foto) return <div className="contenedor pagina"><p className="tenue" role="status">Cargando diseño…</p></div>;

  const p = foto.presson;
  const reservar = () => { actualizar({ fotoRef: foto, diseno: null }); navegar(foto.servicio ? `/reservar?servicio=${foto.servicio.id}` : '/reservar'); };
  const personalizar = () => { actualizar({ fotoRef: foto, diseno: null }); navegar('/disena'); };
  const agregar = () => agregarPresson(foto, { forma, largo, presson: p });
  const descuentoPresson = p?.precio_anterior ? Math.round((1 - p.precio / p.precio_anterior) * 100) : 0;

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
          <div className="detalle__imagen"><Foto archivo={foto.archivo} alt={foto.descripcion || foto.titulo} prioridad /></div>
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
            <span className="detalle__estrellas" aria-label={`${positivo(foto.id)} % de opiniones positivas`}><span aria-hidden="true">★★★★★</span> {positivo(foto.id)} %</span>
          </p>
          {foto.puesto <= 10 && <p className="insignia-ranking">🏆 #{foto.puesto} MÁS POPULAR <span>en {foto.categoria}</span></p>}

          <div className="detalle__precio">
            {modo === 'salon' ? (
              <>
                <p><span className="detalle__precio-grande">{dinero(foto.servicio?.precio)}</span> <span className="tenue">en el salón · {foto.servicio?.nombre}, {foto.servicio?.duracion_min} min</span></p>
                <p className="tenue">Con el cupón BIENVENIDA15 pagas {dinero(Math.round((foto.servicio?.precio || 0) * 0.85))} en tu primera cita.</p>
              </>
            ) : (
              <>
                <p>
                  {p?.precio_anterior && <s className="detalle__antes">{dinero(p.precio_anterior)}</s>}
                  <span className="detalle__precio-grande">{dinero(p?.precio)}</span>
                </p>
                {descuentoPresson > 0 && <p className="etiquetas-oferta"><span>{descuentoPresson} % DE DESCUENTO por tiempo limitado</span>{p.stock < 10 && <span>CASI AGOTADO</span>}</p>}
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
                    <input type="radio" name="modo" checked={modo === 'presson'} onChange={() => setModo('presson')} disabled={!p} />
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
                      {FORMAS.map((f) => <label key={f} className="chip"><input type="radio" name="forma" checked={forma === f} onChange={() => setForma(f)} /><span>{f}</span></label>)}
                    </div>
                  </fieldset>
                  <fieldset className="grupo">
                    <legend className="grupo__titulo grupo__titulo--chico">Largo: <span className="tenue">{largo}</span></legend>
                    <div className="selector__opciones">
                      {LARGOS.map((l) => <label key={l} className="chip"><input type="radio" name="largo" checked={largo === l} onChange={() => setLargo(l)} /><span>{l}</span></label>)}
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
          {foto.etiquetas && <p className="tenue">Etiquetas: {foto.etiquetas.split(',').filter((t) => !t.includes('archivo:')).join(', ')}</p>}
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="relacionados" aria-labelledby="t-rel">
          <h2 id="t-rel">Diseños relacionados</h2>
          <ul className="disenos-rejilla">{relacionados.map((f, i) => <TarjetaDiseno key={f.id} foto={f} indice={i} presson={p} />)}</ul>
        </section>
      )}
    </div>
  );
}
