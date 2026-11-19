// Ruleta de premios: ya no hay un botón fijo. Se abre sola mientras la persona navega:
// · a los 8 segundos de entrar,
// · después de 2 minutos más, luego de 4 minutos más, luego de 6… (cada vez espera 2 minutos más),
// · y además sale el aviso del regalo la primera vez que pone algo en el carrito.
// Cuenta el tiempo aunque cambie de página. Si ya giró, la ventana muestra el premio que ganó.
// El premio lo elige el servidor (así nadie puede hacer trampa) y cada premio es un cupón real.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import Modal from './Modal.jsx';

const CLAVE = 'ahnails-ruleta';
const ESPERA = 12 * 3600000;
const COLORES = ['#8C1D4B', '#FBE3EA', '#E0245E', '#FFF8F5', '#6E1539', '#F1DCD7', '#B8174A', '#FFFFFF'];
const TEXTO = ['#fff', '#8C1D4B', '#fff', '#8C1D4B', '#fff', '#8C1D4B', '#fff', '#8C1D4B'];
const PAGINAS_SIN_RULETA = ['/equipo', '/admin', '/finalizar-compra'];

const SESION = 'ahnails-ruleta-sesion';
const LLEGADA = 'ahnails-llegada';
const VECES = 'ahnails-ruleta-veces';
const PRIMERA = 8000;      // la primera vez: a los 8 segundos de entrar
const PASO = 2 * 60000;    // luego espera 2 min, después 4, después 6…
const llegada = () => {
  try {
    let t = Number(sessionStorage.getItem(LLEGADA));
    if (!t) { t = Date.now(); sessionStorage.setItem(LLEGADA, String(t)); }
    return t;
  } catch { return Date.now(); }
};
const vecesVista = () => { try { return Number(sessionStorage.getItem(VECES)) || 0; } catch { return 0; } };
const sumarVista = () => { try { sessionStorage.setItem(VECES, String(vecesVista() + 1)); } catch { /* sin almacenamiento */ } };
// Momento (desde que entró) en que toca abrirla por vez número n: 8 s, 8 s + 2 min, 8 s + 2 + 4 min…
const momento = (n) => PRIMERA + PASO * (n * (n + 1)) / 2;
const vecesSesion = () => { try { return Number(sessionStorage.getItem(SESION)) || 0; } catch { return 0; } };
const sumarSesion = () => { try { sessionStorage.setItem(SESION, String(vecesSesion() + 1)); } catch { /* sin almacenamiento */ } };
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { return {}; } };
const guardar = (v) => { try { localStorage.setItem(CLAVE, JSON.stringify({ ...leer(), ...v })); } catch { /* sin almacenamiento */ } };
// El último premio ganado (para ofrecerlo en el pago)
export const premioGuardado = () => { const v = leer(); return v.premio && Date.now() - v.cuando < 7 * 86400000 ? v.premio : null; };

function punto(angulo, r) {
  const a = ((angulo - 90) * Math.PI) / 180;
  return [200 + r * Math.cos(a), 200 + r * Math.sin(a)];
}

function Rueda({ premios, giro, girando }) {
  const n = premios.length;
  const paso = 360 / n;
  return (
    <svg viewBox="0 0 400 400" className="ruleta__rueda" role="img" aria-label={`Ruleta con ${n} premios: ${premios.join(', ')}`}>
      <defs>
        <radialGradient id="ruleta-brillo" cx="50%" cy="35%" r="65%"><stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id="ruleta-aro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E8B04B" /><stop offset=".5" stopColor="#FFE7A3" /><stop offset="1" stopColor="#B7832A" /></linearGradient>
      </defs>
      <circle cx="200" cy="200" r="196" fill="url(#ruleta-aro)" />
      <circle cx="200" cy="200" r="182" fill="#4A0F27" />
      {/* Focos del aro */}
      {Array.from({ length: 24 }, (_, i) => {
        const [x, y] = punto(i * 15, 189);
        return <circle key={i} cx={x} cy={y} r="4.2" className={`ruleta__foco ${i % 2 ? 'ruleta__foco--b' : ''} ${girando ? 'ruleta__foco--rapido' : ''}`} />;
      })}
      <g className="ruleta__giro" style={{ transform: `rotate(${giro}deg)` }}>
        {premios.map((t, i) => {
          const [x1, y1] = punto(i * paso, 176);
          const [x2, y2] = punto((i + 1) * paso, 176);
          const medio = i * paso + paso / 2;
          return (
            <g key={i}>
              <path d={`M200 200 L${x1} ${y1} A176 176 0 0 1 ${x2} ${y2} Z`} fill={COLORES[i % COLORES.length]} stroke="#E8B04B" strokeWidth="1.5" />
              <g transform={`rotate(${medio} 200 200)`}>
                <text x="200" y="70" textAnchor="middle" fill={TEXTO[i % TEXTO.length]} className="ruleta__texto">{t}</text>
                <text x="200" y="92" textAnchor="middle" fill={TEXTO[i % TEXTO.length]} className="ruleta__sub">{t === 'Otra vez' ? 'gira de nuevo' : 'de descuento'}</text>
              </g>
            </g>
          );
        })}
        <circle cx="200" cy="200" r="176" fill="url(#ruleta-brillo)" />
      </g>
      <circle cx="200" cy="200" r="44" fill="url(#ruleta-aro)" />
      <circle cx="200" cy="200" r="36" fill="#8C1D4B" />
    </svg>
  );
}

function Confeti() {
  return (
    <div className="confeti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <i key={i} style={{ '--x': `${(i * 37) % 100}%`, '--d': `${(i % 7) * 0.08}s`, '--c': ['#C2185B', '#E8B04B', '#F7C6D4', '#7A1F3D'][i % 4], '--r': `${(i * 47) % 360}deg` }} />
      ))}
    </div>
  );
}

export default function Ruleta() {
  const { pathname } = useLocation();
  const irA = useNavigate();
  const [abierta, setAbierta] = useState(false);
  const [premios, setPremios] = useState([]);
  const [giro, setGiro] = useState(0);
  const [girando, setGirando] = useState(false);
  const [resultado, setResultado] = useState(() => {
    const v = leer();
    return v.premio && Date.now() - v.cuando < ESPERA ? v.premio : null;
  });
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [aviso, setAviso] = useState(false);
  const temporizador = useRef(null);
  const carrito = useCarrito();
  const cantidadAntes = useRef(null);
  const oculta = PAGINAS_SIN_RULETA.some((p) => pathname.startsWith(p));
  const yaGiro = () => { const v = leer(); return v.premio && Date.now() - v.cuando < ESPERA; };

  // Saca el regalo a la vista unos segundos (máximo dos veces por visita y nunca encima de otra ventana)
  const ofrecer = () => {
    if (oculta || yaGiro() || vecesSesion() >= 2 || document.querySelector('dialog[open]')) return;
    sumarSesion(); setAviso(true);
  };
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(false), 14000);
    return () => clearTimeout(t);
  }, [aviso]);

  // La primera vez que pone algo en el carrito en esta visita
  useEffect(() => {
    const n = carrito.items.length;
    if (cantidadAntes.current !== null && n > cantidadAntes.current) setTimeout(ofrecer, 1500);
    cantidadAntes.current = n;
  }, [carrito.items.length]);

  useEffect(() => { api.ruleta().then(setPremios).catch(() => setPremios([])); }, []);

  // Se abre sola: a los 8 segundos, luego tras 2 min más, 4 min más, 6 min más…
  const [turno, setTurno] = useState(vecesVista);
  useEffect(() => {
    if (oculta || !premios.length) return undefined;
    const falta = Math.max(1500, momento(turno) - (Date.now() - llegada()));
    const abrir = (intento = 0) => {
      // Si hay otra ventana abierta, espera a que la cierren
      if (document.querySelector('dialog[open]')) { if (intento < 30) temporizador.current = setTimeout(() => abrir(intento + 1), 4000); return; }
      setAviso(false); setAbierta(true); guardar({ vista: true }); sumarVista(); setTurno(vecesVista());
    };
    temporizador.current = setTimeout(abrir, falta);
    return () => clearTimeout(temporizador.current);
  }, [oculta, premios.length, turno]);

  if (!premios.length || oculta) return null;

  async function girar() {
    if (girando) return;
    setError(''); setCopiado(false);
    let r;
    try { r = await api.girarRuleta(); } catch (e) { setError(e.message); return; }
    const paso = 360 / premios.length;
    const ajuste = (Math.random() - 0.5) * paso * 0.6;
    // Vueltas completas y luego el segmento ganador queda debajo del indicador de arriba
    const destino = giro - (giro % 360) + 360 * 6 + (360 - (r.indice * paso + paso / 2)) + ajuste;
    setResultado(null);
    setGirando(true);
    setGiro(destino);
    setTimeout(() => {
      setGirando(false);
      setResultado(r);
      if (r.codigo) guardar({ premio: r, cuando: Date.now(), vista: true });
    }, 5600);
  }

  const copiar = async () => {
    try { await navigator.clipboard.writeText(resultado.codigo); setCopiado(true); } catch { /* sin portapapeles */ }
  };
  const ganado = resultado?.codigo;

  return (
    <>
      {aviso && !abierta && (
        <div className="regalo-flotante regalo-flotante--aparece">
          <button type="button" className="regalo-flotante__boton" onClick={() => { setAviso(false); setAbierta(true); }} aria-label="Abrir la ruleta de premios">
            <span className="regalo-flotante__caja" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 48 48"><rect x="7" y="20" width="34" height="22" rx="3" fill="#C2185B" /><rect x="4" y="13" width="40" height="9" rx="2.5" fill="#E8417A" /><rect x="21" y="13" width="6" height="29" fill="#E8B04B" /><path d="M24 13c-3-6-11-8-11-3 0 3 6 3 11 3zm0 0c3-6 11-8 11-3 0 3-6 3-11 3z" fill="none" stroke="#E8B04B" strokeWidth="3" strokeLinejoin="round" /></svg>
            </span>
            <span className="regalo-flotante__burbuja">¡Tienes un regalo! Gira la ruleta</span>
          </button>
          <button type="button" className="regalo-flotante__cerrar" onClick={() => setAviso(false)} aria-label="Cerrar">×</button>
        </div>
      )}

      {abierta && (
        <Modal titulo="Ruleta de premios" onCerrar={() => { if (!girando) setAbierta(false); }} ocultarTitulo>
          <div className="ruleta">
            {ganado && !girando && <Confeti />}
            <p className="ruleta__antetitulo">AH Nails te regala</p>
            <p className="ruleta__titulo">¡Gira la ruleta!</p>
            <p className="ruleta__bajada">Gana un cupón para tu compra o tu cita. Un giro cada 12 horas.</p>
            <div className={`ruleta__marco ${girando ? 'ruleta__marco--girando' : ''}`}>
              <span className="ruleta__indicador" aria-hidden="true" />
              <Rueda premios={premios} giro={giro} girando={girando} />
              <button type="button" className="ruleta__centro" onClick={girar} disabled={girando || Boolean(ganado)}>
                {girando ? '…' : 'GIRAR'}
              </button>
            </div>
            <div aria-live="polite" className="ruleta__resultado">
              {error && <p className="error">{error}</p>}
              {resultado && !resultado.codigo && !girando && <p className="ruleta__otra">¡Casi! Te salió <b>Otra vez</b>: gira de nuevo.</p>}
              {ganado && !girando && (
                <div className="ruleta__premio">
                  <p>¡Felicidades! Ganaste <b>{resultado.etiqueta}</b> de descuento</p>
                  <div className="ruleta__cupon">
                    <span>{resultado.descripcion}</span>
                    <strong>{resultado.codigo}</strong>
                    <button type="button" className="chip-filtro chip-filtro--borde" onClick={copiar}>{copiado ? '¡Copiado!' : 'Copiar'}</button>
                  </div>
                  <button type="button" className="boton-gigante" onClick={() => { setAbierta(false); irA('/tienda?orden=vendidos'); }}>Usarlo ahora</button>
                  <p className="tenue">Se aplica solo al pagar: lo verás en el resumen del pedido.</p>
                </div>
              )}
              {!ganado && !girando && !error && <button type="button" className="boton-gigante boton-gigante--naranja" onClick={girar}>{resultado ? 'Girar otra vez' : 'Girar la ruleta'}</button>}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
