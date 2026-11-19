// Ventana de cada especialista: dónde trabaja y cómo se le paga, sus días libres y su usuario para el portal del equipo.
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { dinero } from '../../config.js';
import Modal from '../../components/Modal.jsx';
import { fechaLarga, isoLocal } from './piezasPanel.jsx';

const TIPOS = { libre: 'Día libre', vacaciones: 'Vacaciones', incapacidad: 'Incapacidad', permiso: 'Permiso' };

// Nombre: Pago
// Descripción: Muestra la forma de pago de una especialista.
// Entrada: La persona.
// Salida: El formulario.
// Objetivo: Configurar su pago.
function Pago({ persona, onGuardado }) {
  const [datos, setDatos] = useState({ estacion: persona.estacion || '', esquema_pago: persona.esquema_pago || 'comision', comision: persona.comision ?? 65, salario_base: persona.salario_base || '' });
  const [estado, setEstado] = useState({ texto: '', error: false });
  // Nombre: set
  // Descripción: Guarda lo que se escribe en un campo.
  // Entrada: El nombre del campo.
  // Salida: Una función para el campo.
  // Objetivo: Llenar el formulario.
  const set = (campo) => (evento) => setDatos({ ...datos, [campo]: evento.target.value });
  const ejemplo = 100000;
  const ganaria = Math.round(ejemplo * (Number(datos.comision) || 0) / 100) + (datos.esquema_pago === 'base_comision' ? Number(datos.salario_base) || 0 : 0);
  // Nombre: guardar
  // Descripción: Guarda la forma de pago.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Calcular su pago.
  const guardar = async (evento) => {
    evento.preventDefault();
    try { await api.admin.pagoEspecialista(persona.id, datos); setEstado({ texto: 'Guardado.' }); onGuardado(); } catch (err) { setEstado({ texto: err.message, error: true }); }
  };
  return (
    <form className="ajustes-esp__form" onSubmit={guardar}>
      <div className="campo"><label htmlFor="a-est">¿Dónde se ubica? <span className="tenue">(estación o mesa)</span></label><input id="a-est" value={datos.estacion} onChange={set('estacion')} placeholder="Ej.: Estación 2, junto a la ventana" maxLength={60} /></div>
      <fieldset className="grupo">
        <legend className="grupo__titulo grupo__titulo--chico">¿Cómo se le paga?</legend>
        <div className="opciones-pago-esp">
          <label className={datos.esquema_pago === 'comision' ? 'activo' : ''}><input type="radio" name="esquema" value="comision" checked={datos.esquema_pago === 'comision'} onChange={set('esquema_pago')} /><b>Comisión</b><span>Un porcentaje de lo que cobra en sus citas</span></label>
          <label className={datos.esquema_pago === 'base_comision' ? 'activo' : ''}><input type="radio" name="esquema" value="base_comision" checked={datos.esquema_pago === 'base_comision'} onChange={set('esquema_pago')} /><b>Base + comisión</b><span>Un monto fijo por quincena más un porcentaje</span></label>
        </div>
      </fieldset>
      <div className="campos-dos">
        <div className="campo"><label htmlFor="a-com">Comisión (%)</label><input id="a-com" type="number" min="0" max="100" step="1" value={datos.comision} onChange={set('comision')} required /></div>
        {datos.esquema_pago === 'base_comision' && <div className="campo"><label htmlFor="a-base">Monto base por quincena (₡)</label><input id="a-base" type="number" min="1" step="1" value={datos.salario_base} onChange={set('salario_base')} required /></div>}
      </div>
      <p className="ajustes-esp__ejemplo">Ejemplo: si en la quincena atiende citas por <b>{dinero(ejemplo)}</b>, se le pagan <b>{dinero(ganaria)}</b>.</p>
      {estado.texto && <p role={estado.error ? 'alert' : 'status'} className={estado.error ? 'error' : 'aviso-ok'}>{estado.texto}</p>}
      <button type="submit" className="boton">Guardar</button>
    </form>
  );
}

// Nombre: DiasLibres
// Descripción: Muestra los días libres de una especialista.
// Entrada: La persona.
// Salida: La sección.
// Objetivo: Manejar sus libres.
function DiasLibres({ persona, onGuardado }) {
  const hoy = isoLocal(new Date());
  const [lista, setLista] = useState([]);
  const [datos, setDatos] = useState({ desde: hoy, hasta: hoy, tipo: 'libre', motivo: '' });
  const [estado, setEstado] = useState({ texto: '', error: false });
  // Nombre: cargar
  // Descripción: Carga los libres.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrar la lista.
  const cargar = () => api.admin.ausencias(persona.id).then((respuesta) => setLista(respuesta.ausencias.filter((ausencia) => ausencia.fecha >= hoy))).catch(() => {});
  useEffect(() => { cargar(); }, []);
  // Nombre: set
  // Descripción: Guarda lo que se escribe en un campo.
  // Entrada: El nombre del campo.
  // Salida: Una función para el campo.
  // Objetivo: Llenar el formulario.
  const set = (campo) => (evento) => setDatos({ ...datos, [campo]: evento.target.value, ...(campo === 'desde' && evento.target.value > datos.hasta ? { hasta: evento.target.value } : {}) });

  // Nombre: agregar
  // Descripción: Agrega días libres.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Registrar libres.
  const agregar = async (evento) => {
    evento.preventDefault();
    try {
      const respuesta = await api.admin.agregarAusencias(persona.id, datos);
      setEstado({ texto: respuesta.citasAfectadas ? `Guardado. Ojo: ${persona.nombre} tiene ${respuesta.citasAfectadas} ${respuesta.citasAfectadas === 1 ? 'cita' : 'citas'} en esos días. Avísales a las clientas desde Agenda → «Emergencia».` : `Guardado. Esos días ya no se pueden reservar con ${persona.nombre}.`, error: false, alerta: respuesta.citasAfectadas > 0 });
      cargar(); onGuardado();
    } catch (err) { setEstado({ texto: err.message, error: true }); }
  };
  // Nombre: borrar
  // Descripción: Borra un día libre.
  // Entrada: La ausencia.
  // Salida: Nada.
  // Objetivo: Corregir.
  const borrar = async (a) => { await api.admin.borrarAusencia(persona.id, a.id).catch(() => {}); cargar(); onGuardado(); };

  return (
    <div className="ajustes-esp__dias">
      <form className="ajustes-esp__form" onSubmit={agregar}>
        <p className="tenue">Los días que no trabaja por horario ya están en «Editar» (días de trabajo). Aquí se agregan días sueltos: libres, vacaciones, incapacidad o permisos.</p>
        <div className="campos-dos">
          <div className="campo"><label htmlFor="d-desde">Desde</label><input id="d-desde" type="date" min={hoy} value={datos.desde} onChange={set('desde')} required /></div>
          <div className="campo"><label htmlFor="d-hasta">Hasta</label><input id="d-hasta" type="date" min={datos.desde} value={datos.hasta} onChange={set('hasta')} /></div>
        </div>
        <div className="tipos-ausencia" role="radiogroup" aria-label="Tipo">
          {Object.entries(TIPOS).map(([clave, valor]) => <label key={clave} className={`tipo-ausencia tipo-ausencia--${clave} ${datos.tipo === clave ? 'activo' : ''}`}><input type="radio" name="tipo" value={clave} checked={datos.tipo === clave} onChange={set('tipo')} />{valor}</label>)}
        </div>
        <div className="campo"><label htmlFor="d-mot">Nota <span className="tenue">(opcional)</span></label><input id="d-mot" value={datos.motivo} onChange={set('motivo')} maxLength={120} placeholder="Ej.: cita médica" /></div>
        {estado.texto && <p role={estado.error || estado.alerta ? 'alert' : 'status'} className={estado.error ? 'error' : estado.alerta ? 'aviso-alerta' : 'aviso-ok'}>{estado.texto}</p>}
        <button type="submit" className="boton">Agregar</button>
      </form>
      <div>
        <h3 className="ajustes-esp__sub">Próximos días que no trabaja</h3>
        {lista.length === 0 ? <p className="tenue">No tiene días libres agendados.</p> : (
          <ul className="ausencias-lista">
            {lista.map((elemento) => (
              <li key={elemento.id} className={`tipo-ausencia--${elemento.tipo}`}>
                <span className="ausencias-lista__fecha">{fechaLarga(elemento.fecha)}</span>
                <span className="ausencias-lista__tipo">{TIPOS[elemento.tipo]}{elemento.motivo ? ` · ${elemento.motivo}` : ''}</span>
                <button type="button" onClick={() => borrar(elemento)} aria-label={`Quitar ${fechaLarga(elemento.fecha)}`}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Nombre: Acceso
// Descripción: Muestra el acceso al portal de una especialista.
// Entrada: La persona.
// Salida: El formulario.
// Objetivo: Darle usuario y contraseña.
function Acceso({ persona, onGuardado }) {
  const [usuario, setUsuario] = useState(persona.usuario || persona.nombre.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, ''));
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [estado, setEstado] = useState({ texto: '', error: false });
  const tiene = Boolean(persona.usuario);
  // Nombre: guardar
  // Descripción: Guarda el acceso.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Darle entrada.
  const guardar = async (evento) => {
    evento.preventDefault();
    try {
      const respuesta = await api.admin.accesoEspecialista(persona.id, { usuario, contrasena: clave });
      setEstado({ texto: clave ? `Listo. ${persona.nombre} entra en «Acceso del equipo» con el usuario «${respuesta.usuario}» y la contraseña que escribiste. Dásela en persona.` : 'Usuario actualizado.' });
      setClave(''); onGuardado();
    } catch (err) { setEstado({ texto: err.message, error: true }); }
  };
  // Nombre: quitar
  // Descripción: Quita el acceso.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Bloquear.
  const quitar = async () => {
    if (!window.confirm(`¿Quitarle el acceso a ${persona.nombre}? Ya no podrá entrar al portal.`)) return;
    await api.admin.quitarAcceso(persona.id).catch(() => {});
    setEstado({ texto: 'Acceso quitado.' }); onGuardado();
  };
  // Nombre: sugerir
  // Descripción: Sugiere un usuario.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Ahorrar tiempo.
  const sugerir = () => {
    const letras = 'abcdefghjkmnpqrstuvwxyz';
    const aleatorios = crypto.getRandomValues(new Uint32Array(10));
    setClave(`${[...aleatorios.slice(0, 6)].map((aleatorio) => letras[aleatorio % letras.length]).join('')}${[...aleatorios.slice(6)].map((aleatorio) => aleatorio % 10).join('')}`); setVer(true);
  };
  return (
    <form className="ajustes-esp__form" onSubmit={guardar}>
      <p className="tenue">Con esto {persona.nombre} entra en <b>Acceso del equipo</b> (enlace al pie de la página o en <b>/equipo</b>) y ve sus citas, sus clientas, sus días libres y cuánto lleva ganado. No ve nada de las demás.</p>
      <p className={`acceso-esp__estado ${tiene ? 'acceso-esp__estado--si' : ''}`}>{tiene ? `Tiene acceso con el usuario «${persona.usuario}».` : 'Todavía no tiene acceso.'}</p>
      <div className="campo"><label htmlFor="ac-usu">Usuario</label><input id="ac-usu" value={usuario} onChange={(evento) => setUsuario(evento.target.value.toLowerCase().replace(/\s/g, ''))} autoComplete="off" required /></div>
      <div className="campo">
        <label htmlFor="ac-cla">{tiene ? 'Contraseña nueva (vacío = dejar la que tiene)' : 'Contraseña'}</label>
        <div className="acceso__clave">
          <input id="ac-cla" type={ver ? 'text' : 'password'} value={clave} onChange={(evento) => setClave(evento.target.value)} autoComplete="new-password" required={!tiene} minLength={8} />
          <button type="button" onClick={() => setVer(!ver)} aria-pressed={ver}>{ver ? 'Ocultar' : 'Ver'}</button>
        </div>
        <button type="button" className="enlace enlace--boton enlace--chico" onClick={sugerir}>Inventar una contraseña segura</button>
        <span className="tenue">Al menos 8 caracteres, con letras y números.</span>
      </div>
      {estado.texto && <p role={estado.error ? 'alert' : 'status'} className={estado.error ? 'error' : 'aviso-ok'}>{estado.texto}</p>}
      <div className="botones">
        <button type="submit" className="boton">{tiene ? 'Guardar' : 'Dar acceso'}</button>
        {tiene && <button type="button" className="boton boton--contorno boton--peligro" onClick={quitar}>Quitar acceso</button>}
      </div>
    </form>
  );
}

const PESTANAS = { datos: ['Datos, foto y horario', 'Nombre, especialidad, foto y días que trabaja'], pago: ['Pago y estación', 'Dónde se ubica y cuánto gana'], dias: ['Días libres', 'Vacaciones, permisos e incapacidades'], acceso: ['Usuario y contraseña', 'Para que entre a ver sus citas'] };

// Nombre: AjustesEspecialista
// Descripción: Muestra la ficha completa de una especialista.
// Entrada: La persona y la pestaña.
// Salida: La ficha.
// Objetivo: Todo de ella en un lugar.
export default function AjustesEspecialista({ persona, inicio = 'datos', onCerrar, onGuardado, datos }) {
  const [pestana, setPestana] = useState(inicio);
  return (
    <Modal titulo={`Ficha de ${persona.nombre}`} onCerrar={onCerrar} ancho>
      <div className="ajustes-esp">
        <div className="ajustes-esp__pestanas" role="tablist">
          {Object.entries(PESTANAS).map(([clave, [t, ayuda]], i) => (
            <button key={clave} type="button" role="tab" aria-selected={pestana === clave} onClick={() => setPestana(clave)}>
              <span className="ajustes-esp__num" aria-hidden="true">{i + 1}</span>
              <span><b>{t}</b><small>{ayuda}</small></span>
            </button>
          ))}
        </div>
        <div role="tabpanel">
          {pestana === 'datos' && datos}
          {pestana === 'pago' && <Pago persona={persona} onGuardado={onGuardado} />}
          {pestana === 'dias' && <DiasLibres persona={persona} onGuardado={onGuardado} />}
          {pestana === 'acceso' && <Acceso persona={persona} onGuardado={onGuardado} />}
        </div>
      </div>
    </Modal>
  );
}
