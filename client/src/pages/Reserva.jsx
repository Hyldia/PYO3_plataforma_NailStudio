import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useReserva } from '../context/ReservaContext.jsx';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const aISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Los próximos 6 días hábiles (el salón no abre domingo)
function proximosDias() {
  const dias = [];
  const d = new Date();
  while (dias.length < 6) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) dias.push(new Date(d));
  }
  return dias;
}

export default function Reserva() {
  const { reserva, actualizar } = useReserva();
  const [servicios, setServicios] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [error, setError] = useState('');
  const dias = useMemo(proximosDias, []);
  const navegar = useNavigate();

  const sel = {
    servicio: reserva.servicio ?? null,
    especialista: reserva.especialista ?? null,
    fecha: reserva.fecha ?? aISO(dias[0]),
    hora: reserva.hora ?? null
  };

  useEffect(() => {
    Promise.all([api.servicios(), api.especialistas()])
      .then(([s, e]) => { setServicios(s); setEspecialistas(e); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!sel.especialista) return;
    api.disponibilidad(sel.especialista.id, sel.fecha).then(setHorarios).catch((e) => setError(e.message));
  }, [sel.especialista?.id, sel.fecha]);

  const listo = sel.servicio && sel.especialista && sel.hora;
  const fechaLegible = (iso) => {
    const d = new Date(`${iso}T12:00:00`);
    return `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
  };

  return (
    <div className="pagina pagina--con-barra">
      <header className="encabezado">
        <h1>Reserva tu cita</h1>
        <p className="tenue">Paso 1 de 2</p>
      </header>
      {error && <p role="alert" className="error">{error}</p>}

      <Link to="/disenar" className="resumen-diseno">
        <span className="tenue">Tu diseño</span>
        <span className="resumen-diseno__nombre">{reserva.diseno.nombre}: {reserva.diseno.forma}, {reserva.diseno.color.toLowerCase()}</span>
        <span className="enlace">Cambiar</span>
      </Link>

      <fieldset className="grupo">
        <legend className="grupo__titulo">Servicio</legend>
        <div className="lista-opciones">
          {servicios.map((s) => (
            <label key={s.id} className="opcion-radio">
              <input type="radio" name="servicio" checked={sel.servicio?.id === s.id} onChange={() => actualizar({ servicio: s })} />
              <span className="opcion-radio__texto">
                <span className="opcion-radio__titulo">{s.nombre}</span>
                <span className="tenue">{s.duracion_min} min</span>
              </span>
              <span className="opcion-radio__precio">${s.precio}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grupo">
        <legend className="grupo__titulo">Especialista</legend>
        <div className="lista-opciones lista-opciones--tres">
          {especialistas.map((e) => (
            <label key={e.id} className="opcion-radio opcion-radio--tarjeta">
              <input type="radio" name="especialista" checked={sel.especialista?.id === e.id}
                     onChange={() => actualizar({ especialista: e, hora: null })} />
              <span className="avatar" aria-hidden="true">{e.nombre.slice(0, 2).toUpperCase()}</span>
              <span className="opcion-radio__titulo">{e.nombre}</span>
              <span className="tenue">{e.especialidad}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grupo">
        <legend className="grupo__titulo">Fecha</legend>
        <div className="dias">
          {dias.map((d) => {
            const iso = aISO(d);
            return (
              <label key={iso} className="dia">
                <input type="radio" name="fecha" checked={sel.fecha === iso} onChange={() => actualizar({ fecha: iso, hora: null })}
                       aria-label={fechaLegible(iso)} />
                <span aria-hidden="true" className="dia__semana">{DIAS[d.getDay()]}</span>
                <span aria-hidden="true" className="dia__numero">{d.getDate()}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="grupo" disabled={!sel.especialista}>
        <legend className="grupo__titulo">Hora</legend>
        {!sel.especialista ? (
          <p className="tenue">Elige una especialista para ver sus horarios libres.</p>
        ) : (
          <div className="horas">
            {horarios.map((h) => (
              <label key={h.hora} className="hora">
                <input type="radio" name="hora" disabled={!h.disponible} checked={sel.hora === h.hora}
                       onChange={() => actualizar({ hora: h.hora })} />
                <span>{h.hora}{!h.disponible && <span className="solo-lector"> (ocupado)</span>}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="barra-accion">
        <p aria-live="polite" className="barra-accion__resumen">
          {listo
            ? `${sel.servicio.nombre} con ${sel.especialista.nombre}, ${fechaLegible(sel.fecha)} a las ${sel.hora}`
            : 'Elige servicio, especialista y hora para continuar.'}
        </p>
        <button type="button" className="boton" disabled={!listo}
                onClick={() => { actualizar({ fecha: sel.fecha }); navegar('/pago'); }}>
          Continuar al pago
        </button>
      </div>
    </div>
  );
}
