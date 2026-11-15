import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COLORES, OPCIONES, PRECIO, BUSQUEDA_GALERIA, DisenoBuilder, DISENO_INICIAL, describir, normalizar } from '../lib/disenoBuilder.js';
import { useReserva } from '../context/ReservaContext.jsx';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';
import { Una, ManoPrevia, TONOS_PIEL } from '../components/MuestraUnas.jsx';
import Foto from '../components/Foto.jsx';

// Color del diseñador → color con el que están clasificadas las fotos de la galería
function colorGaleria(nombre) {
  if (/nude|beige|milky/i.test(nombre)) return 'Nude';
  if (/rosa|fucsia|coral|durazno/i.test(nombre)) return 'Rosa';
  if (/rojo|vino|borgo/i.test(nombre)) return 'Rojo';
  if (/lila|lavanda/i.test(nombre)) return 'Morado';
  if (/celeste|azul/i.test(nombre)) return 'Azul';
  if (/verde/i.test(nombre)) return 'Verde';
  if (/dorado|mostaza/i.test(nombre)) return 'Dorado';
  return nombre;
}

const extra = (n) => (n ? `+${dinero(n)}` : 'Incluido');

// Grupo de opciones con muestra visual de cada una (una uña dibujada con esa opción)
function Opciones({ titulo, campo, opciones, diseno, cambiar, precios, ayuda }) {
  return (
    <fieldset className="disena-grupo">
      <legend className="disena-grupo__titulo">{titulo} <span className="tenue">{diseno[campo]}</span></legend>
      {ayuda && <p className="tenue disena-grupo__ayuda">{ayuda}</p>}
      <div className="disena-tarjetas">
        {opciones.map((o) => (
          <label key={o} className="disena-tarjeta">
            <input type="radio" name={campo} className="solo-lector" checked={diseno[campo] === o} onChange={() => cambiar(campo, o)} />
            <span className="disena-tarjeta__una"><Una d={{ ...diseno, [campo]: o, acento: false }} /></span>
            <span className="disena-tarjeta__nombre">{o}</span>
            {precios && <span className="disena-tarjeta__precio">{extra(precios[o])}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function Disena() {
  useTitulo('Diseña tus uñas');
  const { reserva, actualizar } = useReserva();
  const [diseno, setDiseno] = useState(() => new DisenoBuilder(normalizar(reserva.diseno || DISENO_INICIAL)).build());
  const [piel, setPiel] = useState(TONOS_PIEL[1].hex);
  const [vista, setVista] = useState('mano');
  const [reales, setReales] = useState([]);
  const navegar = useNavigate();

  const cambiar = (campo, valor) => setDiseno((d) => new DisenoBuilder(d).con(campo, valor).build());
  const continuar = () => { actualizar({ diseno: { ...diseno, id: null } }); navegar('/reservar'); };
  const grupos = useMemo(() => [...new Set(COLORES.map((c) => c.grupo))], []);

  // Fotos reales parecidas: primero por decoración, si no por color
  useEffect(() => {
    const q = BUSQUEDA_GALERIA.decoracion[diseno.decoracion];
    const params = q ? { q, limite: 4 } : { color: colorGaleria(diseno.color), limite: 4 };
    const t = setTimeout(() => {
      api.fotos(params).then((r) => (r.fotos.length ? r : api.fotos({ orden: 'populares', limite: 4 }))).then((r) => setReales(r.fotos)).catch(() => setReales([]));
    }, 250);
    return () => clearTimeout(t);
  }, [diseno.color, diseno.decoracion]);

  const desglose = [
    ['Largo ' + diseno.largo.toLowerCase(), PRECIO.largo[diseno.largo]],
    ['Acabado ' + diseno.acabado.toLowerCase(), PRECIO.acabado[diseno.acabado]],
    [diseno.decoracion === 'Ninguna' ? 'Sin decoración' : diseno.decoracion, PRECIO.decoracion[diseno.decoracion]],
    diseno.acento && ['Uña de acento', PRECIO.acento]
  ].filter(Boolean);

  return (
    <>
      <section className="disena-portada">
        <div className="contenedor">
          <p className="reserva-portada__ante">Probador virtual</p>
          <h1>Diseña tus uñas</h1>
          <p>Elige forma, color y acabado y míralo al instante en una mano. Tu especialista lo revisa contigo antes de empezar.</p>
        </div>
      </section>

      <div className="contenedor pagina disena-pagina">
        <div className="disena">
          <div className="disena__opciones">
            <Opciones titulo="Forma" campo="forma" opciones={OPCIONES.forma} diseno={diseno} cambiar={cambiar} />
            <Opciones titulo="Largo" campo="largo" opciones={OPCIONES.largo} diseno={diseno} cambiar={cambiar} precios={PRECIO.largo}
                      ayuda="Medio y largo llevan extensión (acrílico, polygel o soft gel)." />

            <fieldset className="disena-grupo">
              <legend className="disena-grupo__titulo">Color <span className="tenue">{diseno.color}</span></legend>
              {grupos.map((g) => (
                <div key={g} className="muestrario">
                  <p className="muestrario__grupo">{g}</p>
                  <div className="muestrario__colores">
                    {COLORES.filter((c) => c.grupo === g).map((c) => (
                      <label key={c.nombre} className="frasco" title={c.nombre}>
                        <input type="radio" name="color" className="solo-lector" checked={diseno.color === c.nombre} onChange={() => cambiar('color', c.nombre)} />
                        <span className="frasco__tapa" aria-hidden="true" />
                        <span className="frasco__cuerpo" style={{ '--c': c.hex }} aria-hidden="true" />
                        <span className="frasco__nombre">{c.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </fieldset>

            <Opciones titulo="Acabado" campo="acabado" opciones={OPCIONES.acabado} diseno={diseno} cambiar={cambiar} precios={PRECIO.acabado} />
            <Opciones titulo="Decoración" campo="decoracion" opciones={OPCIONES.decoracion} diseno={diseno} cambiar={cambiar} precios={PRECIO.decoracion} />

            <label className="disena-acento">
              <input type="checkbox" className="marca" checked={diseno.acento} onChange={(e) => cambiar('acento', e.target.checked)} />
              <span className="disena-tarjeta__una"><Una d={{ ...diseno, acento: true }} acento /></span>
              <span><strong>Uña de acento en el anular</strong><span className="tenue">Glitter y pedrería en una sola uña · +{dinero(PRECIO.acento)}</span></span>
            </label>

            <div className="campo">
              <label htmlFor="notas">Notas para tu especialista <span className="tenue">(opcional)</span></label>
              <textarea id="notas" rows="3" maxLength="500" value={diseno.notas || ''} onChange={(e) => cambiar('notas', e.target.value)}
                        placeholder="Por ejemplo: quiero la francesa más delgada, o tengo una uña quebrada." />
            </div>
          </div>

          <aside className="disena__resumen disena-previa" aria-labelledby="resumen-diseno">
            <div className="disena-previa__cabeza">
              <h2 id="resumen-diseno">Vista previa</h2>
              <div className="disena-previa__vista" role="group" aria-label="Tipo de vista">
                <button type="button" aria-pressed={vista === 'mano'} onClick={() => setVista('mano')}>En la mano</button>
                <button type="button" aria-pressed={vista === 'cerca'} onClick={() => setVista('cerca')}>De cerca</button>
              </div>
            </div>
            <div className="disena-previa__lienzo" key={`${vista}-${diseno.forma}-${diseno.largo}`}>
              {vista === 'mano' ? <ManoPrevia diseno={diseno} piel={piel} /> : (
                <div className="disena-previa__cerca">
                  <Una d={diseno} /><Una d={diseno} acento={diseno.acento} /><Una d={diseno} />
                </div>
              )}
            </div>
            {vista === 'mano' && (
              <div className="tonos" role="radiogroup" aria-label="Tono de piel">
                {TONOS_PIEL.map((t) => (
                  <label key={t.hex} className="tono" title={t.nombre}>
                    <input type="radio" name="piel" className="solo-lector" checked={piel === t.hex} onChange={() => setPiel(t.hex)} />
                    <span style={{ background: t.hex }} aria-hidden="true" /><span className="solo-lector">{t.nombre}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="disena__descripcion" aria-live="polite">{describir(diseno)}</p>

            <dl className="resumen disena-previa__precios">
              {desglose.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{extra(v)}</dd></Fragment>)}
              <dt className="resumen__total">Recargo por diseño</dt><dd className="resumen__total">{diseno.precio ? `+${dinero(diseno.precio)}` : 'Sin recargo'}</dd>
            </dl>
            <p className="tenue">Se suma al precio del servicio que elijas al reservar.</p>
            <button type="button" className="resumen-pedido__boton" onClick={continuar}><strong>Reservar con este diseño</strong></button>
            <button type="button" className="enlace-boton" onClick={() => setDiseno(new DisenoBuilder(DISENO_INICIAL).build())}>Empezar de nuevo</button>

            {reserva.fotoRef && (
              <div className="referencia">
                <Foto archivo={reserva.fotoRef.archivo} alt={reserva.fotoRef.titulo} className="referencia__foto" />
                <div>
                  <p className="tenue">Foto de referencia</p>
                  <p>{reserva.fotoRef.titulo}</p>
                  <button type="button" className="enlace-boton" onClick={() => actualizar({ fotoRef: null })}>Quitar</button>
                </div>
              </div>
            )}
          </aside>
        </div>

        {reales.length > 0 && (
          <section className="relacionados" aria-labelledby="t-reales">
            <div className="compra__cabeza">
              <h2 id="t-reales">Así se ve en uñas reales</h2>
              <Link to="/galeria" className="enlace-flecha">Ver toda la galería ›</Link>
            </div>
            <ul className="reales">
              {reales.map((f) => (
                <li key={f.id}>
                  <Link to={`/galeria/${f.id}`} className="reales__foto"><Foto archivo={f.archivo} alt={f.descripcion || f.titulo} /></Link>
                  <p>{f.titulo}</p>
                  <button type="button" className="chip-filtro chip-filtro--borde" onClick={() => { actualizar({ fotoRef: f }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Usar como referencia</button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
