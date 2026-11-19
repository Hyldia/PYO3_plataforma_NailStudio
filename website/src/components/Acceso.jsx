// Entrar o crear la cuenta: con Google, con Facebook o con el formulario (correo y contraseña).
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useUsuario } from '../context/UsuarioContext.jsx';

let configPromesa = null;
// Nombre: cargarScript
// Descripción: Carga un programa externo (Google o Facebook).
// Entrada: La dirección y un nombre.
// Salida: Una promesa que avisa al cargar.
// Objetivo: Usar el botón de Google.
const cargarScript = (src, id) => new Promise((ok, mal) => {
  if (document.getElementById(id)) return ok();
  const s = Object.assign(document.createElement('script'), { src, id, async: true, defer: true, onload: ok, onerror: mal });
  document.head.appendChild(s);
});

// Nombre: LogoGoogle
// Descripción: Dibuja el logo de Google.
// Entrada: Nada.
// Salida: El logo.
// Objetivo: Botón de Google.
const LogoGoogle = () => <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>;
// Nombre: LogoFacebook
// Descripción: Dibuja el logo de Facebook.
// Entrada: Nada.
// Salida: El logo.
// Objetivo: Botón de Facebook.
const LogoFacebook = () => <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z" /></svg>;

// Nombre: Acceso
// Descripción: Muestra el formulario para entrar o registrarse.
// Entrada: Título, texto y qué hacer al terminar.
// Salida: El formulario.
// Objetivo: Que la clienta entre a su cuenta.
export default function Acceso({ titulo = 'Entra a tu cuenta', bajada, onListo }) {
  const sesion = useUsuario();
  const [modo, setModo] = useState('entrar');
  const [d, setD] = useState({ nombre: '', correo: '', telefono: '', contrasena: '' });
  const [verClave, setVerClave] = useState(false);
  const [config, setConfig] = useState({ google: null, facebook: null });
  const [estado, setEstado] = useState({ enviando: false, error: '' });
  const botonGoogle = useRef(null);

  // Nombre: listo
  // Descripción: Guarda la sesión al entrar.
  // Entrada: La respuesta del servidor.
  // Salida: Nada.
  // Objetivo: Dejarla conectada.
  const listo = async (r) => { await sesion.entrar(r); onListo?.(); };
  // Nombre: fallo
  // Descripción: Muestra el error al entrar.
  // Entrada: El error.
  // Salida: Nada.
  // Objetivo: Avisar qué salió mal.
  const fallo = (e) => setEstado({ enviando: false, error: e.message });

  useEffect(() => { configPromesa ||= api.auth.config().catch(() => ({})); configPromesa.then(setConfig); }, []);

  // Google Identity Services dibuja su propio botón oficial
  useEffect(() => {
    if (!config.google || !botonGoogle.current) return;
    cargarScript('https://accounts.google.com/gsi/client', 'gsi').then(() => {
      window.google.accounts.id.initialize({
        client_id: config.google,
        // Nombre: callback
        // Descripción: Recibe la respuesta de Google.
        // Entrada: El dato de Google.
        // Salida: Nada.
        // Objetivo: Entrar con Google.
        callback: ({ credential }) => { setEstado({ enviando: true, error: '' }); api.auth.google(credential).then(listo).catch(fallo); }
      });
      window.google.accounts.id.renderButton(botonGoogle.current, { theme: 'outline', size: 'large', shape: 'pill', text: modo === 'crear' ? 'signup_with' : 'signin_with', locale: 'es', width: 320 });
    }).catch(() => {});
  }, [config.google, modo]);

  // Nombre: conFacebook
  // Descripción: Entra con Facebook.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Iniciar sesión con Facebook.
  async function conFacebook() {
    setEstado({ enviando: true, error: '' });
    try {
      await cargarScript('https://connect.facebook.net/es_LA/sdk.js', 'fb-sdk');
      window.FB.init({ appId: config.facebook, version: 'v19.0', cookie: false, xfbml: false });
      window.FB.login((r) => {
        if (!r.authResponse) return setEstado({ enviando: false, error: 'Cancelaste el inicio con Facebook.' });
        api.auth.facebook(r.authResponse.accessToken).then(listo).catch(fallo);
      }, { scope: 'public_profile,email' });
    } catch { fallo(new Error('No se pudo abrir Facebook. Revisa tu conexión.')); }
  }

  // Nombre: enviar
  // Descripción: Envía el formulario de entrada o registro.
  // Entrada: El envío del formulario.
  // Salida: Nada.
  // Objetivo: Entrar o crear la cuenta.
  async function enviar(e) {
    e.preventDefault();
    setEstado({ enviando: true, error: '' });
    try { await listo(modo === 'crear' ? await api.auth.registro(d) : await api.auth.entrar(d)); } catch (error) { fallo(error); }
  }
  // Nombre: set
  // Descripción: Guarda lo que se escribe en un campo.
  // Entrada: El nombre del campo.
  // Salida: Una función para el campo.
  // Objetivo: Llenar el formulario.
  const set = (k) => (evento) => setD({ ...d, [k]: evento.target.value });

  return (
    <div className="acceso">
      <div className="acceso__cabeza">
        <span className="acceso__icono" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg></span>
        <h2>{modo === 'crear' ? 'Crea tu cuenta' : titulo}</h2>
        {bajada && <p className="tenue">{bajada}</p>}
      </div>

      <div className="acceso__pestanas" role="tablist" aria-label="Entrar o crear cuenta" style={{ '--i': modo === 'crear' ? 1 : 0 }}>
        <span className="acceso__pildora" aria-hidden="true" />
        <button type="button" role="tab" aria-selected={modo === 'entrar'} onClick={() => { setModo('entrar'); setEstado({ enviando: false, error: '' }); }}>Ya tengo cuenta</button>
        <button type="button" role="tab" aria-selected={modo === 'crear'} onClick={() => { setModo('crear'); setEstado({ enviando: false, error: '' }); }}>Soy nueva</button>
      </div>

      <div className="acceso__redes">
        {config.google ? <div ref={botonGoogle} className="acceso__google" /> : (
          <button type="button" className="boton-red boton-red--google" disabled title="El salón todavía no activó el inicio con Google"><LogoGoogle /> Continuar con Google</button>
        )}
        <button type="button" className="boton-red boton-red--facebook" onClick={conFacebook} disabled={!config.facebook || estado.enviando}
                title={config.facebook ? undefined : 'El salón todavía no activó el inicio con Facebook'}><LogoFacebook /> Continuar con Facebook</button>
        {(!config.google || !config.facebook) && <p className="acceso__nota">Pronto podrás entrar con {!config.google && !config.facebook ? 'Google y Facebook' : !config.google ? 'Google' : 'Facebook'}. Por ahora usa tu correo.</p>}
      </div>
      <p className="acceso__o"><span>o con tu correo</span></p>

      <form className="acceso__form" onSubmit={enviar} noValidate>
        {modo === 'crear' && (
          <div className="campo"><label htmlFor="ac-nombre">Nombre completo</label><input id="ac-nombre" autoComplete="name" value={d.nombre} onChange={set('nombre')} required /></div>
        )}
        <div className="campo"><label htmlFor="ac-correo">Correo</label><input id="ac-correo" type="email" autoComplete="email" value={d.correo} onChange={set('correo')} required /></div>
        {modo === 'crear' && (
          <div className="campo"><label htmlFor="ac-tel">Teléfono (WhatsApp)</label><input id="ac-tel" type="tel" inputMode="tel" autoComplete="tel" value={d.telefono} onChange={set('telefono')} placeholder="8888 8888" required /></div>
        )}
        <div className="campo">
          <label htmlFor="ac-clave">Contraseña{modo === 'crear' && <span className="tenue"> (mínimo 8, con letras y números)</span>}</label>
          <div className="acceso__clave">
            <input id="ac-clave" type={verClave ? 'text' : 'password'} autoComplete={modo === 'crear' ? 'new-password' : 'current-password'} value={d.contrasena} onChange={set('contrasena')} required />
            <button type="button" onClick={() => setVerClave(!verClave)} aria-pressed={verClave}>{verClave ? 'Ocultar' : 'Ver'}</button>
          </div>
        </div>
        {estado.error && <p role="alert" className="error">{estado.error}</p>}
        <button type="submit" className="boton-gigante" disabled={estado.enviando}>{estado.enviando ? 'Un momento…' : modo === 'crear' ? 'Crear mi cuenta' : 'Entrar'}</button>
        <p className="acceso__legal">Usamos tus datos solo para tus pedidos y citas. Nunca los vendemos.</p>
      </form>
    </div>
  );
}
