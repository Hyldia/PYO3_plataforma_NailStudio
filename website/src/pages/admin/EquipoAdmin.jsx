// Equipo: agregar, editar, cambiar foto y quitar especialistas, con sus días y horas de trabajo.
// Cada una tiene además su estación, forma de pago, días libres y usuario para el portal (AjustesEspecialista.jsx).
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import Foto from '../../components/Foto.jsx';
import Modal from '../../components/Modal.jsx';
import { BotonFoto, ZonaFotos, DIAS_SEMANA, HORAS, formData } from './piezasPanel.jsx';
import { AvatarSofi, avisarFotoAsistente } from '../../components/ChatAsistente.jsx';
import AjustesEspecialista from './AjustesEspecialista.jsx';

// Foto de la asistente del chat (Sofi)
function FotoAsistente({ onAviso }) {
  const subir = async (archivo) => {
    try { const r = await api.admin.fotoAsistente(formData(archivo)); avisarFotoAsistente(r.foto); onAviso({ texto: 'Listo: la foto nueva ya sale en el chat.' }); }
    catch (e) { onAviso({ texto: e.message, error: true }); }
  };
  const quitar = async () => {
    try { await api.admin.quitarFotoAsistente(); avisarFotoAsistente(null); onAviso({ texto: 'Se quitó la foto subida; el chat vuelve a la foto de config.js.' }); }
    catch (e) { onAviso({ texto: e.message, error: true }); }
  };
  return (
    <div className="asistente-admin">
      <span className="asistente-admin__foto"><AvatarSofi tam={96} /></span>
      <div>
        <p className="admin-tarjeta__nombre">Foto de Sofi, la asistente del chat</p>
        <p className="tenue">Es la que ven las clientas en el botón del chat (abajo a la derecha). Usen una foto de una sola persona, de frente; se recorta en círculo.</p>
        <div className="botones">
          <BotonFoto texto="Subir foto" etiqueta="de la asistente del chat" clase="boton boton--chico" onArchivo={subir} />
          <button type="button" className="boton boton--chico boton--contorno" onClick={quitar}>Quitar foto subida</button>
        </div>
      </div>
    </div>
  );
}

const VACIA = { nombre: '', especialidad: '', bio: '', experiencia: '', dias: '1,2,3,4,5', hora_inicio: '09:00', hora_fin: '17:30', activa: 1 };
const textoDias = (dias = '') => DIAS_SEMANA.filter(([k]) => dias.split(',').includes(k)).map(([, t]) => t).join(' · ');

export function Editor({ persona, onCerrar, onGuardado, embebido = false }) {
  const nueva = !persona.id;
  const [d, setD] = useState({ ...VACIA, ...persona, bio: persona.bio ?? '', experiencia: persona.experiencia ?? '' });
  const [archivo, setArchivo] = useState([]);
  const [estado, setEstado] = useState({ guardando: false, error: '' });
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
  const dias = d.dias.split(',').filter(Boolean);
  const alternarDia = (k) => setD({ ...d, dias: (dias.includes(k) ? dias.filter((x) => x !== k) : [...dias, k]).sort().join(',') });

  async function guardar(e) {
    e.preventDefault();
    setEstado({ guardando: true, error: '' });
    try {
      const r = nueva ? await api.admin.crearEspecialista(d) : await api.admin.editarEspecialista(d.id, d);
      const conFoto = archivo[0] ? await api.admin.fotoEspecialista(r.id, formData(archivo[0])) : null;
      onGuardado(nueva ? `${r.nombre} se agregó al equipo.` : 'Cambios guardados.');
      if (embebido) { if (conFoto?.foto) setD((x) => ({ ...x, foto: conFoto.foto })); setArchivo([]); setEstado({ guardando: false, error: '', ok: 'Cambios guardados.' }); } else onCerrar();
    } catch (err) { setEstado({ guardando: false, error: err.message }); }
  }

  const previa = archivo[0] ? URL.createObjectURL(archivo[0]) : null;
  const formulario = (
      <form className="editor-admin" onSubmit={guardar}>
        <div className="editor-admin__previa">
          {(previa || d.foto) && (
            <div className="editor-admin__foto editor-admin__foto--persona">
              {previa ? <img src={previa} alt="" /> : <Foto archivo={d.foto} alt="" />}
            </div>
          )}
          {nueva || !d.foto ? <ZonaFotos archivos={archivo} onCambio={setArchivo} multiple={false} id="e-foto" texto="Foto de la especialista" />
            : <BotonFoto texto={archivo[0] ? 'Elegir otra foto' : 'Cambiar foto'} onArchivo={(f) => setArchivo([f])} />}
          <div className="editor-admin__tarjeta">
            <p className="editor-admin__nombre">{d.nombre || 'Nombre'}</p>
            <p className="tenue">{d.especialidad || 'Especialidad'}</p>
            <p className="tenue">{textoDias(d.dias)} · {d.hora_inicio}–{d.hora_fin}</p>
          </div>
        </div>
        <div className="editor-admin__campos">
          <div className="campos-dos">
            <div className="campo"><label htmlFor="e-nombre">Nombre</label><input id="e-nombre" value={d.nombre} onChange={set('nombre')} required /></div>
            <div className="campo"><label htmlFor="e-exp">Años de experiencia</label><input id="e-exp" type="number" min="0" max="50" value={d.experiencia} onChange={set('experiencia')} /></div>
          </div>
          <div className="campo"><label htmlFor="e-esp">Especialidad</label><input id="e-esp" value={d.especialidad} onChange={set('especialidad')} placeholder="Ej.: Nail art y diseños a mano" required /></div>
          <div className="campo"><label htmlFor="e-bio">Presentación <span className="tenue">(la ven las clientas al reservar)</span></label><textarea id="e-bio" rows="3" value={d.bio} onChange={set('bio')} /></div>
          <fieldset className="grupo">
            <legend className="grupo__titulo grupo__titulo--chico">Días de trabajo</legend>
            <div className="dias-chips">
              {DIAS_SEMANA.map(([k, t]) => (
                <label key={k} className={dias.includes(k) ? 'activo' : ''}><input type="checkbox" checked={dias.includes(k)} onChange={() => alternarDia(k)} />{t}</label>
              ))}
            </div>
          </fieldset>
          <div className="campos-dos">
            <div className="campo"><label htmlFor="e-ini">Entra a las</label><select id="e-ini" value={d.hora_inicio} onChange={set('hora_inicio')}>{HORAS.map((h) => <option key={h}>{h}</option>)}</select></div>
            <div className="campo"><label htmlFor="e-fin">Última cita a las</label><select id="e-fin" value={d.hora_fin} onChange={set('hora_fin')}>{HORAS.map((h) => <option key={h}>{h}</option>)}</select></div>
          </div>
          <label className="casilla"><input type="checkbox" checked={Boolean(Number(d.activa))} onChange={(e) => setD({ ...d, activa: e.target.checked ? 1 : 0 })} /><span>Activa (aparece al reservar)</span></label>
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

export default function EquipoAdmin() {
  const [lista, setLista] = useState([]);
  const [editando, setEditando] = useState(null);
  const [ajustes, setAjustes] = useState(null);
  const [aviso, setAviso] = useState({ texto: '', error: false });
  const cargar = () => api.admin.equipo().then(setLista).catch((e) => setAviso({ texto: e.message, error: true }));
  useEffect(() => { cargar(); }, []);

  const quitar = async (e) => {
    if (!window.confirm(`¿Quitar a ${e.nombre} del equipo?`)) return;
    try {
      const r = await api.admin.borrarEspecialista(e.id);
      setAviso({ texto: r.resultado === 'desactivada' ? `${e.nombre} tiene citas en el historial: quedó desactivada (ya no aparece al reservar).` : `${e.nombre} se quitó del equipo.` });
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
      <ul className="admin-tarjetas admin-tarjetas--equipo">
        {lista.map((e, i) => (
          <li key={e.id} className={`admin-tarjeta ${e.activa ? '' : 'admin-tarjeta--inactiva'}`} style={{ '--n': i }}>
            <div className="admin-tarjeta__foto admin-tarjeta__foto--persona">
              {e.foto ? <Foto archivo={e.foto} alt={e.nombre} /> : <div className="admin-foto__inicial" aria-hidden="true">{e.nombre[0]}</div>}
              <span className={`admin-tarjeta__sello ${e.activa ? 'admin-tarjeta__sello--verde' : ''}`}>{e.activa ? 'Activa' : 'Inactiva'}</span>
            </div>
            <div className="admin-tarjeta__info">
              <p className="admin-tarjeta__nombre">{e.nombre}{e.experiencia ? <span className="tenue"> · {e.experiencia} años</span> : null}</p>
              <p className="tenue">{e.especialidad}</p>
              <p className="dias-mini">{DIAS_SEMANA.map(([k, t]) => <span key={k} className={(e.dias || '').split(',').includes(k) ? 'si' : ''}>{t[0]}</span>)}</p>
              <p className="tenue">{e.hora_inicio} – {e.hora_fin} · {e.citas} citas</p>
              <p className="equipo-admin__datos">
                <span>{e.estacion || 'Sin estación'}</span>
                <span>{e.esquema_pago === 'base_comision' ? 'Base + ' : ''}{e.comision} %</span>
                {e.ausencias_proximas > 0 && <span className="equipo-admin__libres">{e.ausencias_proximas} {e.ausencias_proximas === 1 ? 'día libre' : 'días libres'}</span>}
                <span className={e.tiene_acceso ? 'equipo-admin__acceso' : 'equipo-admin__sin'}>{e.tiene_acceso ? `Usuario: ${e.usuario}` : 'Sin usuario'}</span>
              </p>
            </div>
            <div className="admin-tarjeta__botones equipo-admin__botones">
              <button type="button" className="boton boton--chico equipo-admin__ficha" onClick={() => setAjustes({ id: e.id, inicio: 'datos' })}>
                <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13 7 4 4" /></svg>
                Abrir ficha<span className="solo-lector"> de {e.nombre}</span>
              </button>
              <button type="button" className="enlace enlace--boton enlace--chico equipo-admin__quitar" onClick={() => quitar(e)}>Quitar del equipo<span className="solo-lector">: {e.nombre}</span></button>
            </div>
          </li>
        ))}
      </ul>
      <details className="ajuste-chat">
        <summary><span><b>Foto de Sofi, la asistente del chat</b><small>La que ven las clientas en el botón del chat</small></span></summary>
        <FotoAsistente onAviso={setAviso} />
      </details>
      {ajustes && lista.find((x) => x.id === ajustes.id) && (
        <AjustesEspecialista persona={lista.find((x) => x.id === ajustes.id)} inicio={ajustes.inicio} onCerrar={() => setAjustes(null)} onGuardado={cargar}
          datos={<Editor key={ajustes.id} persona={lista.find((x) => x.id === ajustes.id)} embebido onCerrar={() => setAjustes(null)} onGuardado={(t) => { setAviso({ texto: t }); cargar(); }} />} />
      )}
      {editando && <Editor persona={editando} onCerrar={() => setEditando(null)} onGuardado={(t) => { setAviso({ texto: t }); cargar(); }} />}
    </section>
  );
}
