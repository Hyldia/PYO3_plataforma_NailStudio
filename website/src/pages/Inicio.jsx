import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { SALON, dinero, enlaceWhatsApp } from '../config.js';
import { useTitulo, useUsarFoto } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';
import VisorFoto from '../components/VisorFoto.jsx';

export default function Inicio() {
  useTitulo('');
  const [fotos, setFotos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [visor, setVisor] = useState(null);
  const usarFoto = useUsarFoto();

  useEffect(() => {
    api.fotos({ limite: 9 }).then((r) => setFotos(r.fotos)).catch(() => {});
    api.servicios().then(setServicios).catch(() => {});
  }, []);

  const [principal, ...resto] = fotos;
  const destacados = servicios.slice(0, 4);

  return (
    <>
      <section className="portada">
        <div className="contenedor portada__rejilla">
          <div className="portada__texto">
            <h1>{SALON.lema}</h1>
            <p className="portada__bajada">Manicure, uñas acrílicas, polygel y pedicure. Mira nuestros trabajos, elige tu diseño y reserva en línea.</p>
            <div className="botones">
              <Link to="/reservar" className="boton">Reservar cita</Link>
              <Link to="/galeria" className="boton boton--contorno">Ver galería</Link>
            </div>
          </div>
          <Foto archivo={principal?.archivo} alt={principal?.titulo || 'Trabajo del salón'} className="portada__foto" prioridad />
        </div>
      </section>

      <section className="seccion" aria-labelledby="t-servicios">
        <div className="contenedor">
          <div className="seccion__cabeza">
            <h2 id="t-servicios">Servicios</h2>
            <Link to="/servicios" className="enlace">Ver todos los servicios y precios</Link>
          </div>
          <ul className="servicios-lista">
            {destacados.map((s) => (
              <li key={s.id}>
                <div>
                  <h3>{s.nombre}</h3>
                  <p className="tenue">{s.descripcion}</p>
                </div>
                <p className="servicios-lista__precio">{dinero(s.precio)}<span className="tenue">{s.duracion_min} min</span></p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="seccion seccion--rubor" aria-labelledby="t-galeria">
        <div className="contenedor">
          <div className="seccion__cabeza">
            <h2 id="t-galeria">Trabajos recientes</h2>
            <Link to="/galeria" className="enlace">Ver la galería completa</Link>
          </div>
          {resto.length === 0 ? (
            <p className="tenue">Pronto verás aquí los trabajos del salón.</p>
          ) : (
            <ul className="mosaico">
              {resto.map((f, i) => (
                <li key={f.id}>
                  <button type="button" className="mosaico__boton" onClick={() => setVisor(i)}>
                    <Foto archivo={f.archivo} alt={f.titulo} />
                    <span className="mosaico__titulo">{f.titulo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="seccion" aria-labelledby="t-pasos">
        <div className="contenedor">
          <h2 id="t-pasos">Reserva en tres pasos</h2>
          <ol className="pasos">
            <li><h3>Elige tu diseño</h3><p>Toma uno de la galería o personaliza forma, largo, color y acabado.</p></li>
            <li><h3>Escoge día y hora</h3><p>Ves en tiempo real los horarios libres de cada especialista.</p></li>
            <li><h3>Confirma</h3><p>Paga el adelanto por SINPE Móvil o tarjeta, o paga en el salón. Te recordamos la cita por WhatsApp.</p></li>
          </ol>
          <Link to="/reservar" className="boton">Reservar cita</Link>
        </div>
      </section>

      <section className="seccion seccion--oscura" aria-labelledby="t-visita">
        <div className="contenedor visita">
          <div>
            <h2 id="t-visita">Visítanos</h2>
            <p>{SALON.direccion}</p>
            <dl className="horario horario--claro">
              {SALON.horario.map((h) => (<div key={h.dias}><dt>{h.dias}</dt><dd>{h.horas}</dd></div>))}
            </dl>
            <a className="boton boton--claro" href={enlaceWhatsApp('Hola, quisiera hacer una consulta.')} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
          </div>
          {SALON.mapaEmbed && (
            <iframe className="mapa" title={`Mapa de ubicación de ${SALON.nombre}`} src={SALON.mapaEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          )}
        </div>
      </section>

      {visor !== null && (
        <VisorFoto fotos={resto} indice={visor} onCambiar={setVisor} onCerrar={() => setVisor(null)} onReservar={usarFoto} />
      )}
    </>
  );
}
