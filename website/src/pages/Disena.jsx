import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COLORES, OPCIONES, DisenoBuilder, DISENO_INICIAL, describir } from '../lib/disenoBuilder.js';
import { useReserva } from '../context/ReservaContext.jsx';
import { dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import Selector from '../components/Selector.jsx';
import MuestraUnas from '../components/MuestraUnas.jsx';
import Foto from '../components/Foto.jsx';

export default function Disena() {
  useTitulo('Diseña tus uñas');
  const { reserva, actualizar } = useReserva();
  const [diseno, setDiseno] = useState(() => new DisenoBuilder(reserva.diseno || DISENO_INICIAL).build());
  const navegar = useNavigate();

  const cambiar = (campo, valor) => setDiseno((d) => new DisenoBuilder(d).con(campo, valor).build());
  const continuar = () => { actualizar({ diseno: { ...diseno, id: null } }); navegar('/reservar'); };

  return (
    <div className="contenedor pagina">
      <header className="pagina__cabeza">
        <h1>Diseña tus uñas</h1>
        <p className="tenue">Elige cada detalle y lo verás en la muestra. Tu especialista lo revisa contigo antes de empezar.</p>
      </header>

      <div className="disena">
        <div className="disena__opciones">
          <Selector titulo="Forma" nombre="forma" opciones={OPCIONES.forma} valor={diseno.forma} onCambio={(v) => cambiar('forma', v)} />
          <Selector titulo="Largo" nombre="largo" opciones={OPCIONES.largo} valor={diseno.largo} onCambio={(v) => cambiar('largo', v)}
                    ayuda="Medio y largo requieren extensión (acrílico o polygel)." />

          <fieldset className="selector">
            <legend className="selector__titulo">Color</legend>
            <div className="colores">
              {COLORES.map((c) => (
                <label key={c.nombre} className="color">
                  <input type="radio" name="color" checked={diseno.color === c.nombre} onChange={() => cambiar('color', c.nombre)} />
                  <span className="color__muestra" style={{ background: c.hex }} aria-hidden="true" />
                  <span className="color__nombre">{c.nombre}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Selector titulo="Acabado" nombre="acabado" opciones={OPCIONES.acabado} valor={diseno.acabado} onCambio={(v) => cambiar('acabado', v)} />
          <Selector titulo="Decoración" nombre="decoracion" opciones={OPCIONES.decoracion} valor={diseno.decoracion} onCambio={(v) => cambiar('decoracion', v)} />

          <label className="casilla casilla--grande">
            <input type="checkbox" checked={diseno.acento} onChange={(e) => cambiar('acento', e.target.checked)} />
            <span>Uña de acento con glitter y pedrería en el anular</span>
          </label>

          <div className="campo">
            <label htmlFor="notas">Notas para tu especialista <span className="tenue">(opcional)</span></label>
            <textarea id="notas" rows="3" maxLength="500" value={diseno.notas || ''} onChange={(e) => cambiar('notas', e.target.value)}
                      placeholder="Por ejemplo: quiero la francesa más delgada, o tengo una uña quebrada." />
          </div>
        </div>

        <aside className="disena__resumen" aria-labelledby="resumen-diseno">
          <h2 id="resumen-diseno">Tu diseño</h2>
          <MuestraUnas diseno={diseno} />
          <p className="tenue">Muestra orientativa.</p>
          <p className="disena__descripcion" aria-live="polite">{describir(diseno)}</p>

          {reserva.fotoRef ? (
            <div className="referencia">
              <Foto archivo={reserva.fotoRef.archivo} alt={reserva.fotoRef.titulo} className="referencia__foto" />
              <div>
                <p className="tenue">Foto de referencia</p>
                <p>{reserva.fotoRef.titulo}</p>
                <button type="button" className="enlace enlace--boton" onClick={() => actualizar({ fotoRef: null })}>Quitar</button>
              </div>
            </div>
          ) : (
            <Link to="/galeria" className="enlace">Agregar una foto de referencia de la galería</Link>
          )}

          <dl className="resumen">
            <dt>Recargo por diseño</dt><dd aria-live="polite">{diseno.precio ? `+ ${dinero(diseno.precio)}` : 'Sin recargo'}</dd>
          </dl>
          <p className="tenue">Se suma al precio del servicio que elijas al reservar.</p>
          <button type="button" className="boton boton--ancho" onClick={continuar}>Continuar a reservar</button>
          <button type="button" className="enlace enlace--boton" onClick={() => setDiseno(new DisenoBuilder(DISENO_INICIAL).build())}>Empezar de nuevo</button>
        </aside>
      </div>
    </div>
  );
}
