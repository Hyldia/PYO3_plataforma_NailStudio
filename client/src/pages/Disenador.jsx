import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { COLORES, PIELES, OPCIONES, DisenoBuilder } from '../lib/disenoBuilder.js';
import { useReserva } from '../context/ReservaContext.jsx';
import Mano from '../components/Mano.jsx';
import Opciones from '../components/Opciones.jsx';

export default function Disenador() {
  const { reserva, actualizar } = useReserva();
  const [diseno, setDiseno] = useState(() => new DisenoBuilder(reserva.diseno).build());
  const [piel, setPiel] = useState(PIELES[1]);
  const [estado, setEstado] = useState({ guardando: false, mensaje: '', error: '' });
  const navegar = useNavigate();

  const cambiar = (campo, valor) =>
    setDiseno((d) => ({ ...new DisenoBuilder(d).con(campo, valor).build(), id: null }));

  async function guardar() {
    setEstado({ guardando: true, mensaje: '', error: '' });
    try {
      const guardado = await api.guardarDiseno(diseno);
      setDiseno(guardado);
      actualizar({ diseno: guardado });
      setEstado({ guardando: false, mensaje: 'Diseño guardado.', error: '' });
      return guardado;
    } catch (e) {
      setEstado({ guardando: false, mensaje: '', error: e.message });
      return null;
    }
  }

  async function reservar() {
    const guardado = diseno.id ? diseno : await guardar();
    if (guardado) navegar('/reservar');
  }

  return (
    <div className="pagina pagina--con-barra">
      <header className="encabezado">
        <h1>Crea tu diseño</h1>
      </header>

      <Mano diseno={diseno} piel={piel} />

      <Opciones titulo="Forma" opciones={OPCIONES.forma} valor={diseno.forma} onCambio={(v) => cambiar('forma', v)} />
      <Opciones titulo="Largo" opciones={OPCIONES.largo} valor={diseno.largo} onCambio={(v) => cambiar('largo', v)} />

      <fieldset className="grupo">
        <legend className="grupo__titulo">Color: <span className="tenue">{diseno.color}</span></legend>
        <div className="muestras">
          {COLORES.map((c) => (
            <button key={c.nombre} type="button" className="muestra" style={{ background: c.hex }}
                    aria-pressed={diseno.color === c.nombre} aria-label={c.nombre} onClick={() => cambiar('color', c.nombre)} />
          ))}
        </div>
      </fieldset>

      <Opciones titulo="Acabado" opciones={OPCIONES.acabado} valor={diseno.acabado} onCambio={(v) => cambiar('acabado', v)} />
      <Opciones titulo="Decoración" opciones={OPCIONES.decoracion} valor={diseno.decoracion} onCambio={(v) => cambiar('decoracion', v)} />

      <div className="interruptor-fila">
        <div>
          <p className="interruptor-fila__titulo" id="acento-titulo">Uña de acento</p>
          <p className="tenue">Anular con glitter y piedras</p>
        </div>
        <button type="button" role="switch" className="interruptor" aria-checked={diseno.acento}
                aria-labelledby="acento-titulo" onClick={() => cambiar('acento', !diseno.acento)}>
          <span className="interruptor__bola" />
        </button>
      </div>

      <fieldset className="grupo">
        <legend className="grupo__titulo">Tono de piel de la vista previa</legend>
        <div className="muestras muestras--cuatro">
          {PIELES.map((p) => (
            <button key={p.nombre} type="button" className="muestra" style={{ background: p.hex }}
                    aria-pressed={piel.nombre === p.nombre} aria-label={p.nombre} onClick={() => setPiel(p)} />
          ))}
        </div>
      </fieldset>

      <div className="barra-accion">
        <div className="barra-accion__fila">
          <span className="tenue">{diseno.forma}, {diseno.largo.toLowerCase()}, {diseno.acabado.toLowerCase()}</span>
          <span className="precio" aria-live="polite">Desde ${diseno.precio}</span>
        </div>
        {estado.error && <p role="alert" className="error">{estado.error}</p>}
        {estado.mensaje && <p role="status" className="exito">{estado.mensaje}</p>}
        <div className="barra-accion__botones">
          <button type="button" className="boton boton--contorno" onClick={guardar} disabled={estado.guardando}>
            {estado.guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" className="boton" onClick={reservar} disabled={estado.guardando}>Reservar con este diseño</button>
        </div>
      </div>
    </div>
  );
}
