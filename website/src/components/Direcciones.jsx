// Libreta de direcciones (máximo 3): elegir, agregar, editar, borrar y marcar la principal.
import { useState } from 'react';
import { api } from '../lib/api.js';
import { useUsuario } from '../context/UsuarioContext.jsx';
import Modal from './Modal.jsx';

export const PROVINCIAS = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
export const MAX_DIRECCIONES = 3;
const ETIQUETAS = ['Casa', 'Trabajo', 'Otra'];

// Nombre: FormularioDireccion
// Descripción: Muestra el formulario de dirección.
// Entrada: La dirección y qué hacer al terminar.
// Salida: El formulario.
// Objetivo: Agregar o editar direcciones.
export function FormularioDireccion({ inicial, onCerrar, onGuardada }) {
  const { usuario, setDirecciones, direcciones } = useUsuario();
  const nueva = !inicial?.id;
  const [datos, setDatos] = useState({ etiqueta: 'Casa', destinatario: usuario?.nombre || '', telefono: usuario?.telefono || '', provincia: '', canton: '', distrito: '', senas: '', principal: false, ...inicial });
  const [estado, setEstado] = useState({ guardando: false, error: '' });
  // Nombre: set
  // Descripción: Guarda lo que se escribe en un campo.
  // Entrada: El nombre del campo.
  // Salida: Una función para el campo.
  // Objetivo: Llenar el formulario.
  const set = (campo) => (evento) => setDatos({ ...datos, [campo]: evento.target.value });

  // Nombre: guardar
  // Descripción: Guarda la dirección.
  // Entrada: El envío del formulario.
  // Salida: Nada.
  // Objetivo: Tenerla para envíos.
  async function guardar(evento) {
    evento.preventDefault();
    setEstado({ guardando: true, error: '' });
    try {
      const guardada = nueva ? await api.cuenta.crearDireccion(datos) : await api.cuenta.editarDireccion(datos.id, datos);
      const lista = await api.cuenta.yo();
      setDirecciones(lista.direcciones);
      onGuardada?.(guardada); onCerrar();
    } catch (err) { setEstado({ guardando: false, error: err.message }); }
  }

  return (
    <Modal titulo={nueva ? 'Agregar dirección' : `Editar «${inicial.etiqueta}»`} onCerrar={onCerrar}>
      <form className="form-direccion" onSubmit={guardar}>
        <fieldset className="grupo">
          <legend className="grupo__titulo grupo__titulo--chico">Nombre de la dirección</legend>
          <div className="dias-chips">
            {ETIQUETAS.map((etiqueta) => <label key={etiqueta} className={datos.etiqueta === etiqueta ? 'activo' : ''}><input type="radio" name="etq" checked={datos.etiqueta === etiqueta} onChange={() => setDatos({ ...datos, etiqueta: etiqueta })} />{etiqueta}</label>)}
          </div>
        </fieldset>
        <div className="campos-dos">
          <div className="campo"><label htmlFor="dir-dest">Quién recibe</label><input id="dir-dest" autoComplete="name" value={datos.destinatario} onChange={set('destinatario')} required /></div>
          <div className="campo"><label htmlFor="dir-tel">Teléfono</label><input id="dir-tel" type="tel" inputMode="tel" autoComplete="tel" value={datos.telefono} onChange={set('telefono')} required /></div>
        </div>
        <div className="campos-tres">
          <div className="campo"><label htmlFor="dir-prov">Provincia</label>
            <select id="dir-prov" value={datos.provincia} onChange={set('provincia')} required><option value="">Elegir</option>{PROVINCIAS.map((provincia) => <option key={provincia}>{provincia}</option>)}</select></div>
          <div className="campo"><label htmlFor="dir-can">Cantón</label><input id="dir-can" value={datos.canton} onChange={set('canton')} required /></div>
          <div className="campo"><label htmlFor="dir-dis">Distrito</label><input id="dir-dis" value={datos.distrito} onChange={set('distrito')} required /></div>
        </div>
        <div className="campo"><label htmlFor="dir-senas">Otras señas</label>
          <textarea id="dir-senas" rows="3" value={datos.senas} onChange={set('senas')} placeholder="Ej.: 100 m norte de la iglesia, casa blanca con portón negro" required /></div>
        {(direcciones.length > 0 || !nueva) && !inicial?.principal && (
          <label className="casilla"><input type="checkbox" checked={Boolean(datos.principal)} onChange={(evento) => setDatos({ ...datos, principal: evento.target.checked })} /><span>Usar como dirección principal</span></label>
        )}
        {estado.error && <p role="alert" className="error">{estado.error}</p>}
        <div className="botones">
          <button type="submit" className="boton" disabled={estado.guardando}>{estado.guardando ? 'Guardando…' : 'Guardar dirección'}</button>
          <button type="button" className="boton boton--contorno" onClick={onCerrar}>Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}

// Tarjetas de direcciones. Con "elegida" + "onElegir" sirven para escoger a dónde enviar.
// Nombre: ListaDirecciones
// Descripción: Muestra las direcciones guardadas.
// Entrada: La elegida y qué hacer al elegir.
// Salida: La lista.
// Objetivo: Elegir dónde enviar.
export function ListaDirecciones({ elegida, onElegir }) {
  const { direcciones, setDirecciones } = useUsuario();
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState('');

  // Nombre: borrar
  // Descripción: Borra una dirección.
  // Entrada: La dirección.
  // Salida: Nada.
  // Objetivo: Quitarla.
  const borrar = async (dir) => {
    if (!window.confirm(`¿Borrar la dirección «${dir.etiqueta}»?`)) return;
    try { setDirecciones(await api.cuenta.borrarDireccion(dir.id)); if (elegida === dir.id) onElegir?.(null); } catch (error) { setError(error.message); }
  };
  // Nombre: principal
  // Descripción: Marca la dirección principal.
  // Entrada: La dirección.
  // Salida: Nada.
  // Objetivo: Usarla por defecto.
  const principal = async (dir) => { try { setDirecciones(await api.cuenta.principal(dir.id)); } catch (error) { setError(error.message); } };

  return (
    <div className="direcciones">
      <ul className="direcciones__lista" role={onElegir ? 'radiogroup' : undefined} aria-label={onElegir ? 'Dirección de envío' : undefined}>
        {direcciones.map((dir, i) => (
          <li key={dir.id} className={`direccion ${elegida === dir.id ? 'direccion--elegida' : ''}`} style={{ '--n': i }}>
            {onElegir && (
              <label className="direccion__elegir">
                <input type="radio" className="marca" name="direccion" checked={elegida === dir.id} onChange={() => onElegir(dir.id)} />
                <span className="solo-lector">Enviar a {dir.etiqueta}</span>
              </label>
            )}
            <div className="direccion__info" onClick={() => onElegir?.(dir.id)}>
              <p className="direccion__titulo"><span className="direccion__etiqueta">{dir.etiqueta}</span>{dir.principal ? <span className="direccion__principal">Principal</span> : null}</p>
              <p><strong>{dir.destinatario}</strong> · {dir.telefono}</p>
              <p className="tenue">{dir.provincia}, {dir.canton}, {dir.distrito}</p>
              <p className="tenue">{dir.senas}</p>
            </div>
            <div className="direccion__botones">
              <button type="button" className="enlace-boton" onClick={() => setEditando(dir)}>Editar<span className="solo-lector"> {dir.etiqueta}</span></button>
              {!dir.principal && <button type="button" className="enlace-boton" onClick={() => principal(dir)}>Hacer principal</button>}
              <button type="button" className="enlace-boton enlace-boton--peligro" onClick={() => borrar(dir)}>Borrar<span className="solo-lector"> {dir.etiqueta}</span></button>
            </div>
          </li>
        ))}
        {direcciones.length < MAX_DIRECCIONES && (
          <li>
            <button type="button" className="direccion direccion--nueva" onClick={() => setEditando({})}>
              <span aria-hidden="true">+</span>
              <strong>Agregar dirección</strong>
              <small>{MAX_DIRECCIONES - direcciones.length} de {MAX_DIRECCIONES} disponibles</small>
            </button>
          </li>
        )}
      </ul>
      {direcciones.length >= MAX_DIRECCIONES && <p className="tenue">Tienes el máximo de {MAX_DIRECCIONES} direcciones. Edita o borra una para agregar otra.</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {editando && <FormularioDireccion inicial={editando.id ? editando : null} onCerrar={() => setEditando(null)} onGuardada={(datos) => { if (!editando.id) onElegir?.(datos.id); }} />}
    </div>
  );
}
