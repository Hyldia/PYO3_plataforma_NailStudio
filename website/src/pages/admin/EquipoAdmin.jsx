// Equipo: agregar, editar, cambiar foto y quitar especialistas, con sus días y horas de trabajo.
// Cada una tiene además su estación, forma de pago, días libres y usuario para el portal (AjustesEspecialista.jsx).
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import Foto from '../../components/Foto.jsx';
import Modal from '../../components/Modal.jsx';
import { BotonFoto, ZonaFotos, DIAS_SEMANA, HORAS, formData } from './piezasPanel.jsx';
import AjustesEspecialista from './AjustesEspecialista.jsx';
import VerMas from '../../components/VerMas.jsx';
import { usePorPagina } from '../../lib/hooks.js';

const VACIA = { nombre: '', especialidad: '', bio: '', experiencia: '', dias: '1,2,3,4,5', hora_inicio: '09:00', hora_fin: '17:30', activa: 1 };
const POR_PAGINA_BASE = 8;
// Nombre: textoDias
// Descripción: Escribe los días de trabajo.
// Entrada: Los días.
// Salida: El texto.
// Objetivo: Leer fácil.
const textoDias = (dias = '') => DIAS_SEMANA.filter(([k]) => dias.split(',').includes(k)).map(([, t]) => t).join(' · ');

// Nombre: Editor
// Descripción: Muestra el formulario de una especialista.
// Entrada: La persona y opciones.
// Salida: El formulario.
// Objetivo: Editar sus datos.
export function Editor({ persona, onCerrar, onGuardado, embebido = false }) {
  const nueva = !persona.id;
  const [datos, setDatos] = useState({ ...VACIA, ...persona, bio: persona.bio ?? '', experiencia: persona.experiencia ?? '' });
  const [archivo, setArchivo] = useState([]);
  const [estado, setEstado] = useState({ guardando: false, error: '' });
  // Nombre: set
  // Descripción: Guarda lo que se escribe en un campo.
  // Entrada: El nombre del campo.
  // Salida: Una función para el campo.
  // Objetivo: Llenar el formulario.
  const set = (campo) => (evento) => setDatos({ ...datos, [campo]: evento.target.value });
  const dias = datos.dias.split(',').filter(Boolean);
  // Nombre: alternarDia
  // Descripción: Marca o desmarca un día de trabajo.
  // Entrada: El día.
  // Salida: Nada.
  // Objetivo: Elegir sus días.
  const alternarDia = (campo) => setDatos({ ...datos, dias: (dias.includes(campo) ? dias.filter((dia) => dia !== campo) : [...dias, campo]).sort().join(',') });

  // Nombre: guardar
  // Descripción: Guarda la especialista.
  // Entrada: El envío.
  // Salida: Nada.
  // Objetivo: Crear o editar.
  async function guardar(evento) {
    evento.preventDefault();
    setEstado({ guardando: true, error: '' });
    try {
      const guardada = nueva ? await api.admin.crearEspecialista(datos) : await api.admin.editarEspecialista(datos.id, datos);
      const conFoto = archivo[0] ? await api.admin.fotoEspecialista(guardada.id, formData(archivo[0])) : null;
      onGuardado(nueva ? `${guardada.nombre} se agregó al equipo.` : 'Cambios guardados.');
      if (embebido) { if (conFoto?.foto) setDatos((anterior) => ({ ...anterior, foto: conFoto.foto })); setArchivo([]); setEstado({ guardando: false, error: '', ok: 'Cambios guardados.' }); } else onCerrar();
    } catch (err) { setEstado({ guardando: false, error: err.message }); }
  }

  const previa = archivo[0] ? URL.createObjectURL(archivo[0]) : null;
  const formulario = (
      <form className="editor-admin" onSubmit={guardar}>
        <div className="editor-admin__previa">
          {(previa || datos.foto) && (
            <div className="editor-admin__foto editor-admin__foto--persona">
              {previa ? <img src={previa} alt="" /> : <Foto archivo={datos.foto} alt="" />}
            </div>
          )}
          {nueva || !datos.foto ? <ZonaFotos archivos={archivo} onCambio={setArchivo} multiple={false} id="e-foto" texto="Foto de la especialista" />
            : <BotonFoto texto={archivo[0] ? 'Elegir otra foto' : 'Cambiar foto'} onArchivo={(archivo) => setArchivo([archivo])} />}
          <div className="editor-admin__tarjeta">
            <p className="editor-admin__nombre">{datos.nombre || 'Nombre'}</p>
            <p className="tenue">{datos.especialidad || 'Especialidad'}</p>
            <p className="tenue">{textoDias(datos.dias)} · {datos.hora_inicio}–{datos.hora_fin}</p>
          </div>
        </div>
        <div className="editor-admin__campos">
          <div className="campos-dos">
            <div className="campo"><label htmlFor="e-nombre">Nombre</label><input id="e-nombre" value={datos.nombre} onChange={set('nombre')} required /></div>
            <div className="campo"><label htmlFor="e-exp">Años de experiencia</label><input id="e-exp" type="number" min="0" max="50" value={datos.experiencia} onChange={set('experiencia')} /></div>
          </div>
          <div className="campo"><label htmlFor="e-esp">Especialidad</label><input id="e-esp" value={datos.especialidad} onChange={set('especialidad')} placeholder="Ej.: Nail art y diseños a mano" required /></div>
          <div className="campo"><label htmlFor="e-bio">Presentación <span className="tenue">(la ven las clientas al reservar)</span></label><textarea id="e-bio" rows="3" value={datos.bio} onChange={set('bio')} /></div>
          <fieldset className="grupo">
            <legend className="grupo__titulo grupo__titulo--chico">Días de trabajo</legend>
            <div className="dias-chips">
              {DIAS_SEMANA.map(([k, t]) => (
                <label key={k} className={dias.includes(k) ? 'activo' : ''}><input type="checkbox" checked={dias.includes(k)} onChange={() => alternarDia(k)} />{t}</label>
              ))}
            </div>
          </fieldset>
          <div className="campos-dos">
            <div className="campo"><label htmlFor="e-ini">Entra a las</label><select id="e-ini" value={datos.hora_inicio} onChange={set('hora_inicio')}>{HORAS.map((hora) => <option key={hora}>{hora}</option>)}</select></div>
            <div className="campo"><label htmlFor="e-fin">Última cita a las</label><select id="e-fin" value={datos.hora_fin} onChange={set('hora_fin')}>{HORAS.map((hora) => <option key={hora}>{hora}</option>)}</select></div>
          </div>
          <label className="casilla"><input type="checkbox" checked={Boolean(Number(datos.activa))} onChange={(evento) => setDatos({ ...datos, activa: evento.target.checked ? 1 : 0 })} /><span>Activa (aparece al reservar)</span></label>
          {estado.error && <p role="alert" className="error">{estado.error}</p>}
          {estado.ok && <p role="status" className="aviso-ok">{estado.ok}</p>}
          <div className="botones">
            <button type="submit" className="boton" disabled={estado.guardando}>{estado.guardando ? 'Guardando…' : nueva ? 'Agregar al equipo' : 'Guardar cambios'}</button>
            {!embebido && <button type="button" className="boton boton--contorno" onClick={onCerrar}>Cancelar</button>}
          </div>
        </div>
      </form>
  );
  if (embebido) return formulario;
  return <Modal titulo={nueva ? 'Agregar especialista' : `Editar a ${persona.nombre}`} onCerrar={onCerrar} ancho>{formulario}</Modal>;
}

// Nombre: EquipoAdmin
// Descripción: Muestra el equipo en el panel.
// Entrada: Nada.
// Salida: La sección.
// Objetivo: Administrar el equipo.
export default function EquipoAdmin() {
  const [rejilla, POR_PAGINA] = usePorPagina(2, POR_PAGINA_BASE); // filas completas, sin huecos
  const [lista, setLista] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState(null);
  const [ajustes, setAjustes] = useState(null);
  const [aviso, setAviso] = useState({ texto: '', error: false });
  // Nombre: cargar
  // Descripción: Carga el equipo.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Mostrar la lista.
  const cargar = () => api.admin.equipo().then(setLista).catch((fallo) => setAviso({ texto: fallo.message, error: true }));
  useEffect(() => { cargar(); }, []);
  const paginas = Math.ceil(lista.length / POR_PAGINA);
  const equipoVisible = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  useEffect(() => {
    if (pagina > Math.max(1, paginas)) setPagina(Math.max(1, paginas));
  }, [pagina, paginas]);

  // Nombre: quitar
  // Descripción: Quita una especialista.
  // Entrada: La especialista.
  // Salida: Nada.
  // Objetivo: Sacarla del equipo.
  const quitar = async (especialista) => {
    if (!window.confirm(`¿Quitar a ${especialista.nombre} del equipo?`)) return;
    try {
      const respuesta = await api.admin.borrarEspecialista(especialista.id);
      setAviso({ texto: respuesta.resultado === 'desactivada' ? `${especialista.nombre} tiene citas en el historial: quedó desactivada (ya no aparece al reservar).` : `${especialista.nombre} se quitó del equipo.` });
      cargar();
    } catch (err) { setAviso({ texto: err.message, error: true }); }
  };

  return (
    <section aria-labelledby="t-equipo" className="seccion-admin">
      <div className="admin__cabeza">
        <div><h2 id="t-equipo">Equipo</h2><p className="tenue">Toca <b>«Abrir ficha»</b> para cambiar los datos, el horario, el pago, los días libres o el usuario de cada una.</p></div>
        <button type="button" className="boton" onClick={() => setEditando({})}>+ Agregar especialista</button>
      </div>

      {aviso.texto && <p role={aviso.error ? 'alert' : 'status'} className={aviso.error ? 'error' : 'aviso-ok'}>{aviso.texto}</p>}
      <ul ref={rejilla} className="admin-tarjetas admin-tarjetas--equipo">
        {equipoVisible.map((especialista, i) => (
          <li key={especialista.id} className={`admin-tarjeta ${especialista.activa ? '' : 'admin-tarjeta--inactiva'}`} style={{ '--n': i }}>
            <div className="admin-tarjeta__foto admin-tarjeta__foto--persona">
              {especialista.foto ? <Foto archivo={especialista.foto} alt={especialista.nombre} /> : <div className="admin-foto__inicial" aria-hidden="true">{especialista.nombre[0]}</div>}
              <span className={`admin-tarjeta__sello ${especialista.activa ? 'admin-tarjeta__sello--verde' : ''}`}>{especialista.activa ? 'Activa' : 'Inactiva'}</span>
            </div>
            <div className="admin-tarjeta__info">
              <p className="admin-tarjeta__nombre">{especialista.nombre}{especialista.experiencia ? <span className="tenue"> · {especialista.experiencia} años</span> : null}</p>
              <p className="tenue">{especialista.especialidad}</p>
              <p className="dias-mini">{DIAS_SEMANA.map(([k, t]) => <span key={k} className={(especialista.dias || '').split(',').includes(k) ? 'si' : ''}>{t[0]}</span>)}</p>
              <p className="tenue">{especialista.hora_inicio} – {especialista.hora_fin} · {especialista.citas} citas</p>
              <p className="equipo-admin__datos">
                <span>{especialista.estacion || 'Sin estación'}</span>
                <span>{especialista.esquema_pago === 'base_comision' ? 'Base + ' : ''}{especialista.comision} %</span>
                {especialista.ausencias_proximas > 0 && <span className="equipo-admin__libres">{especialista.ausencias_proximas} {especialista.ausencias_proximas === 1 ? 'día libre' : 'días libres'}</span>}
                <span className={especialista.tiene_acceso ? 'equipo-admin__acceso' : 'equipo-admin__sin'}>{especialista.tiene_acceso ? `Usuario: ${especialista.usuario}` : 'Sin usuario'}</span>
              </p>
            </div>
            <div className="admin-tarjeta__botones equipo-admin__botones">
              <button type="button" className="boton boton--chico equipo-admin__ficha" onClick={() => setAjustes({ id: especialista.id, inicio: 'datos' })}>
                <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13 7 4 4" /></svg>
                Abrir ficha<span className="solo-lector"> de {especialista.nombre}</span>
              </button>
              <button type="button" className="enlace enlace--boton enlace--chico equipo-admin__quitar" onClick={() => quitar(especialista)}>Quitar del equipo<span className="solo-lector">: {especialista.nombre}</span></button>
            </div>
          </li>
        ))}
      </ul>
      <VerMas pagina={pagina} paginas={paginas} onCambiar={(numero) => {
        setPagina(numero);
        requestAnimationFrame(() => document.getElementById('t-equipo')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
      }} />
      {ajustes && lista.find((elemento) => elemento.id === ajustes.id) && (
        <AjustesEspecialista persona={lista.find((elemento) => elemento.id === ajustes.id)} inicio={ajustes.inicio} onCerrar={() => setAjustes(null)} onGuardado={cargar}
          datos={<Editor key={ajustes.id} persona={lista.find((elemento) => elemento.id === ajustes.id)} embebido onCerrar={() => setAjustes(null)} onGuardado={(texto) => { setAviso({ texto: texto }); cargar(); }} />} />
      )}
      {editando && <Editor persona={editando} onCerrar={() => setEditando(null)} onGuardado={(texto) => { setAviso({ texto: texto }); cargar(); }} />}
    </section>
  );
}
