// Cambiar la contraseña del panel del salón.
// Al cambiarla se cierran las demás sesiones abiertas (por ejemplo, en otra computadora).
import { useState } from 'react';
import { api } from '../../lib/api.js';

function nivel(clave) {
  let n = 0;
  if (clave.length >= 8) n++;
  if (clave.length >= 12) n++;
  if (/\d/.test(clave) && /[a-z]/i.test(clave)) n++;
  if (/[A-Z]/.test(clave) && /[a-z]/.test(clave)) n++;
  if (/[^a-z0-9]/i.test(clave)) n++;
  return Math.min(4, n);
}
const NIVELES = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Muy segura'];

export default function ContrasenaAdmin({ onCambiada }) {
  const [d, setD] = useState({ actual: '', nueva: '', confirmar: '' });
  const [ver, setVer] = useState(false);
  const [estado, setEstado] = useState({ guardando: false, error: '', ok: '' });
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
  const fuerza = nivel(d.nueva);

  async function guardar(e) {
    e.preventDefault();
    setEstado({ guardando: true, error: '', ok: '' });
    try {
      await api.admin.cambiarContrasena(d);
      setD({ actual: '', nueva: '', confirmar: '' });
      setEstado({ guardando: false, error: '', ok: 'Listo: la contraseña se cambió. Las demás sesiones abiertas se cerraron.' });
      onCambiada?.();
    } catch (err) { setEstado({ guardando: false, error: err.message, ok: '' }); }
  }

  const reglas = [
    ['Al menos 8 caracteres', d.nueva.length >= 8],
    ['Tiene letras', /[a-záéíóúñ]/i.test(d.nueva)],
    ['Tiene números', /\d/.test(d.nueva)],
    ['Las dos nuevas son iguales', d.confirmar !== '' && d.confirmar === d.nueva]
  ];
  const ojo = () => (
    <button type="button" className="clave-ojo" onClick={() => setVer(!ver)} aria-pressed={ver} aria-label={ver ? 'Ocultar las contraseñas' : 'Mostrar las contraseñas'}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{ver && <path d="M3 3l18 18" />}
      </svg>
    </button>
  );

  return (
    <section aria-labelledby="t-contrasena" className="seccion-admin contrasena-admin">
      <div className="clave-tarjeta">
        <div className="clave-tarjeta__lado">
          <span className="clave-tarjeta__candado" aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10.5" width="16" height="10.5" rx="2.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /><circle cx="12" cy="15.5" r="1.4" /></svg>
          </span>
          <h2 id="t-contrasena">Contraseña del panel</h2>
          <p>Es la que se usa en «Acceso del salón». Compártela solo con quien administra el salón.</p>
          <ul className="clave-reglas" aria-label="Lo que necesita la contraseña nueva">
            {reglas.map(([t, ok]) => <li key={t} className={ok ? 'ok' : ''}><span aria-hidden="true">{ok ? '✓' : '•'}</span>{t}</li>)}
          </ul>
          <p className="clave-tarjeta__nota">Al cambiarla se cierran las sesiones abiertas en otras computadoras.</p>
        </div>
        <form className="clave-tarjeta__form" onSubmit={guardar}>
          <div className="campo"><label htmlFor="ca-actual">Contraseña actual</label>
            <div className="clave-campo"><input id="ca-actual" type={ver ? 'text' : 'password'} autoComplete="current-password" value={d.actual} onChange={set('actual')} required />{ojo()}</div></div>
          <div className="campo"><label htmlFor="ca-nueva">Contraseña nueva</label>
            <div className="clave-campo"><input id="ca-nueva" type={ver ? 'text' : 'password'} autoComplete="new-password" value={d.nueva} onChange={set('nueva')} required aria-describedby="ca-fuerza" />{ojo()}</div>
            <div className={`fuerza fuerza--${d.nueva ? fuerza : 0}`} id="ca-fuerza" aria-live="polite">
              <span className="fuerza__barra" aria-hidden="true"><i style={{ width: d.nueva ? undefined : 0 }} /></span>
              <span>{d.nueva ? NIVELES[fuerza] : 'Escribe la nueva'}</span>
            </div>
          </div>
          <div className="campo"><label htmlFor="ca-confirmar">Repite la contraseña nueva</label>
            <div className="clave-campo"><input id="ca-confirmar" type={ver ? 'text' : 'password'} autoComplete="new-password" value={d.confirmar} onChange={set('confirmar')} required
                   aria-invalid={d.confirmar && d.confirmar !== d.nueva ? 'true' : undefined} />{ojo()}</div>
            {d.confirmar && d.confirmar !== d.nueva && <p className="error-campo">No coincide con la contraseña nueva.</p>}
          </div>
          {estado.error && <p role="alert" className="error">{estado.error}</p>}
          {estado.ok && <p role="status" className="aviso-ok">{estado.ok}</p>}
          <button type="submit" className="boton clave-tarjeta__boton" disabled={estado.guardando}>{estado.guardando ? 'Guardando…' : 'Cambiar contraseña'}</button>
        </form>
      </div>
    </section>
  );
}
