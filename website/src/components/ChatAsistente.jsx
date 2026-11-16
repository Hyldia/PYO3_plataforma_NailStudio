// Chat de ayuda en la esquina inferior derecha (siempre visible).
// Sofi es una asistente virtual: responde las preguntas frecuentes con el patrón Chain of Responsibility (lib/asistente.js)
// y, si no sabe, ofrece pasar con una persona del salón por WhatsApp.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api.js';
import { crearCadena, normalizar, PREGUNTAS_RAPIDAS } from '../lib/asistente.js';
import { SALON, urlFoto } from '../config.js';

// La foto que el salón sube en el panel tiene prioridad sobre la de config.js
let fotoSubida = undefined;
const oyentes = new Set();
export function usarFotoAsistente() {
  const [foto, setFoto] = useState(fotoSubida);
  useEffect(() => {
    oyentes.add(setFoto);
    if (fotoSubida === undefined) api.asistente().then((r) => { fotoSubida = r.foto ? urlFoto(r.foto) : null; oyentes.forEach((f) => f(fotoSubida)); }).catch(() => { fotoSubida = null; });
    return () => oyentes.delete(setFoto);
  }, []);
  return foto;
}
export const avisarFotoAsistente = (foto) => { fotoSubida = foto ? urlFoto(foto) : null; oyentes.forEach((f) => f(fotoSubida)); };

const CLAVE = 'ahnails-chat';
const leer = () => { try { return JSON.parse(sessionStorage.getItem(CLAVE)) || null; } catch { return null; } };
const guardar = (m) => { try { sessionStorage.setItem(CLAVE, JSON.stringify(m.slice(-40))); } catch { /* sin almacenamiento */ } };
const hora = () => new Date().toLocaleTimeString('es-CR', { hour: 'numeric', minute: '2-digit' });

// Foto de la recepcionista (config.js → SALON.asistente.foto). Si no carga, se usa el dibujo.
export function AvatarSofi({ tam = 56 }) {
  const [fallo, setFallo] = useState(false);
  const subida = usarFotoAsistente();
  const foto = subida || SALON.asistente?.foto;
  useEffect(() => setFallo(false), [foto]);
  if (foto && !fallo) {
    return <img src={foto} alt="" width={tam} height={tam} className="sofi sofi--foto" onError={() => setFallo(true)} />;
  }
  return <DibujoSofi tam={tam} />;
}

// Dibujo de respaldo (por si la foto no carga)
function DibujoSofi({ tam }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 120 120" aria-hidden="true" className="sofi">
      <defs>
        <linearGradient id="sofi-fondo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBE3EA" /><stop offset="1" stopColor="#F4B9CB" /></linearGradient>
        <linearGradient id="sofi-pelo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A2418" /><stop offset="1" stopColor="#2E140C" /></linearGradient>
      </defs>
      <circle cx="60" cy="60" r="60" fill="url(#sofi-fondo)" />
      {/* pelo de atrás */}
      <path d="M26 64c0-26 14-42 34-42s34 16 34 42c0 14-4 26-8 34H34c-4-8-8-20-8-34z" fill="url(#sofi-pelo)" />
      {/* cuello y blusa */}
      <path d="M50 82h20v12H50z" fill="#E9B193" />
      <path d="M24 120c2-18 16-28 36-28s34 10 36 28z" fill="#8C1D4B" />
      <path d="M50 92l10 12 10-12" fill="#fff" />
      <circle cx="60" cy="108" r="2" fill="#E8B04B" />
      {/* cara */}
      <ellipse cx="60" cy="62" rx="22" ry="25" fill="#F2C2A2" />
      {/* flequillo */}
      <path d="M36 58c2-18 12-28 26-28 12 0 22 8 24 22-8-2-16-8-20-14-6 10-18 18-30 20z" fill="url(#sofi-pelo)" />
      {/* ojos, cejas, mejillas y sonrisa */}
      <path d="M46 59q5-4 10 0M64 59q5-4 10 0" stroke="#2E140C" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="51" cy="64" rx="2.4" ry="3" fill="#2E140C" className="sofi__ojo" />
      <ellipse cx="69" cy="64" rx="2.4" ry="3" fill="#2E140C" className="sofi__ojo" />
      <circle cx="46" cy="72" r="4" fill="#F29BB2" opacity=".55" />
      <circle cx="74" cy="72" r="4" fill="#F29BB2" opacity=".55" />
      <path d="M53 76q7 6 14 0" stroke="#B8174A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {/* audífonos de recepción */}
      <path d="M34 62c0-18 11-30 26-30s26 12 26 30" stroke="#22161C" strokeWidth="3.5" fill="none" />
      <rect x="29" y="58" width="9" height="14" rx="4" fill="#22161C" />
      <rect x="82" y="58" width="9" height="14" rx="4" fill="#22161C" />
      <path d="M34 72c0 8 6 12 14 12" stroke="#22161C" strokeWidth="2.5" fill="none" />
      <circle cx="50" cy="84" r="3" fill="#E0245E" />
    </svg>
  );
}

function Burbuja({ m, onOpcion }) {
  return (
    <li className={`chat__msj chat__msj--${m.de}`}>
      {m.de === 'sofi' && <span className="chat__mini"><AvatarSofi tam={28} /></span>}
      <div className="chat__globo">
        <p>{m.texto}</p>
        {m.enlaces?.length > 0 && (
          <div className="chat__enlaces">
            {m.enlaces.map((e) => (e.to
              ? <Link key={e.texto} to={e.to} className="chat__enlace">{e.texto} ›</Link>
              : <a key={e.texto} href={e.href} target="_blank" rel="noreferrer" className="chat__enlace chat__enlace--wa">{e.texto} ›</a>))}
          </div>
        )}
        <span className="chat__hora">{m.hora}{m.de === 'yo' && ' ✓✓'}</span>
      </div>
      {m.opciones?.length > 0 && (
        <div className="chat__opciones">
          {m.opciones.map((o) => <button key={o} type="button" onClick={() => onOpcion(o)}>{o}</button>)}
        </div>
      )}
    </li>
  );
}

export default function ChatAsistente() {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState(() => leer() || [{
    de: 'sofi', hora: hora(),
    texto: `¡Hola! 👋 Soy Sofi, la asistente virtual de ${SALON.nombre}. Te ayudo con citas, precios, horarios, pagos y envíos. ¿Qué necesitas?`,
    opciones: PREGUNTAS_RAPIDAS
  }]);
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [saludo, setSaludo] = useState(false);
  const [noLeidos, setNoLeidos] = useState(1);
  const ctx = useRef({ servicios: [], cupones: [], especialistas: [] });
  const lista = useRef(null);
  const entrada = useRef(null);
  const cadena = useMemo(() => crearCadena(), []);
  const subida = usarFotoAsistente();

  useEffect(() => {
    api.servicios().then((r) => { ctx.current.servicios = r.servicios || r; }).catch(() => {});
    api.cupones().then((r) => { ctx.current.cupones = r; }).catch(() => {});
    api.especialistas().then((r) => { ctx.current.especialistas = r; }).catch(() => {});
    // Saludo flotante una vez por visita
    const t = setTimeout(() => setSaludo(true), 4000);
    const t2 = setTimeout(() => setSaludo(false), 14000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);
  useEffect(() => { guardar(mensajes); lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: 'smooth' }); }, [mensajes, escribiendo]);
  useEffect(() => { if (abierto) { setNoLeidos(0); setSaludo(false); setTimeout(() => entrada.current?.focus(), 250); } }, [abierto]);

  async function enviar(pregunta) {
    const q = String(pregunta || '').trim();
    if (!q || escribiendo) return;
    setTexto('');
    setMensajes((m) => [...m.map((x) => ({ ...x, opciones: undefined })), { de: 'yo', texto: q, hora: hora() }]);
    setEscribiendo(true);
    const respuesta = await cadena.atender(normalizar(q), ctx.current);
    // Pausa como si escribiera (más larga si la respuesta es larga)
    const espera = Math.min(2200, 650 + respuesta.texto.length * 9);
    setTimeout(() => {
      setEscribiendo(false);
      setMensajes((m) => [...m, { de: 'sofi', hora: hora(), ...respuesta }]);
      if (!abierto) setNoLeidos((n) => n + 1);
    }, espera);
  }

  const reiniciar = () => { setMensajes([{ de: 'sofi', hora: hora(), texto: '¡Empecemos de nuevo! ¿En qué te ayudo?', opciones: PREGUNTAS_RAPIDAS }]); };
  if (pathname.startsWith('/admin')) return null;

  return (
    <div className={`chat ${abierto ? 'chat--abierto' : ''}`}>
      {abierto && (
        <section className="chat__panel" role="dialog" aria-label="Chat con Sofi, asistente virtual">
          <header className="chat__cabeza">
            <span className="chat__avatar"><AvatarSofi tam={44} /><i className="chat__enlinea" aria-hidden="true" /></span>
            <div>
              <p className="chat__nombre">Sofi</p>
              <p className="chat__estado">Asistente virtual · responde al instante</p>
            </div>
            <button type="button" className="chat__icono" onClick={reiniciar} aria-label="Empezar de nuevo" title="Empezar de nuevo">↺</button>
            <button type="button" className="chat__icono" onClick={() => setAbierto(false)} aria-label="Cerrar el chat">×</button>
          </header>
          <ol className="chat__lista" ref={lista} aria-live="polite">
            {mensajes.map((m, i) => <Burbuja key={i} m={m} onOpcion={enviar} />)}
            {escribiendo && (
              <li className="chat__msj chat__msj--sofi">
                <span className="chat__mini"><AvatarSofi tam={28} /></span>
                <div className="chat__globo chat__escribiendo" aria-label="Sofi está escribiendo"><i /><i /><i /></div>
              </li>
            )}
          </ol>
          {SALON.asistente?.credito && !subida && <p className="chat__credito">Foto: <a href={SALON.asistente.credito.url} target="_blank" rel="noreferrer">{SALON.asistente.credito.autor}</a> / Unsplash</p>}
          <form className="chat__form" onSubmit={(e) => { e.preventDefault(); enviar(texto); }}>
            <label htmlFor="chat-texto" className="solo-lector">Escribe tu pregunta</label>
            <input id="chat-texto" ref={entrada} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe tu pregunta…" autoComplete="off" maxLength={300} />
            <button type="submit" aria-label="Enviar" disabled={!texto.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 20.5 21 12 3 3.5v6.6L15 12 3 13.9z" /></svg>
            </button>
          </form>
        </section>
      )}

      {!abierto && saludo && (
        <button type="button" className="chat__saludo" onClick={() => setAbierto(true)}>
          <b>¡Hola! Soy Sofi 👋</b> ¿Te ayudo a reservar o con alguna duda?
        </button>
      )}
      <button type="button" className="chat__boton" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-label={abierto ? 'Cerrar el chat' : 'Abrir el chat de ayuda con Sofi'}>
        <AvatarSofi tam={64} />
        {!abierto && noLeidos > 0 && <span className="chat__badge">{noLeidos}</span>}
        <i className="chat__enlinea" aria-hidden="true" />
      </button>
    </div>
  );
}
