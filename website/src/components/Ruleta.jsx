// Ruleta de premios: un botón flotante con un regalo abre la ruleta; el premio lo elige el servidor
// (así nadie puede hacer trampa) y cada premio es un cupón real que se usa al pagar.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Modal from './Modal.jsx';

const CLAVE = 'ahnails-ruleta';
const ESPERA = 12 * 3600000;
const COLORES = ['#8C1D4B', '#FBE3EA', '#E0245E', '#FFF8F5', '#6E1539', '#F1DCD7', '#B8174A', '#FFFFFF'];
const TEXTO = ['#fff', '#8C1D4B', '#fff', '#8C1D4B', '#fff', '#8C1D4B', '#fff', '#8C1D4B'];
const PAGINAS_SIN_RULETA = ['/admin', '/finalizar-compra'];

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
  const [cerradaBurbuja, setCerradaBurbuja] = useState(false);
  const temporizador = useRef(null);
  const oculta = PAGINAS_SIN_RULETA.some((p) => pathname.startsWith(p));

  useEffect(() => { api.ruleta().then(setPremios).catch(() => setPremios([])); }, []);

  // La primera vez que alguien visita el sitio, la ruleta se abre sola a los pocos segundos
  useEffect(() => {
    if (oculta || leer().vista) return;
    temporizador.current = setTimeout(() => { if (!document.querySelector('dialog[open]')) { setAbierta(true); guardar({ vista: true }); } }, 9000);
    return () => clearTimeout(temporizador.current);
  }, [oculta]);

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
      <div className={`regalo-flotante ${cerradaBurbuja ? 'regalo-flotante--sin-burbuja' : ''}`}>
        <button type="button" className="regalo-flotante__boton" onClick={() => setAbierta(true)} aria-label="Abrir la ruleta de premios">
          <span className="regalo-flotante__caja" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 48 48"><rect x="7" y="20" width="34" height="22" rx="3" fill="#C2185B" /><rect x="4" y="13" width="40" height="9" rx="2.5" fill="#E8417A" /><rect x="21" y="13" width="6" height="29" fill="#E8B04B" /><path d="M24 13c-3-6-11-8-11-3 0 3 6 3 11 3zm0 0c3-6 11-8 11-3 0 3-6 3-11 3z" fill="none" stroke="#E8B04B" strokeWidth="3" strokeLinejoin="round" /></svg>
          </span>
          {!cerradaBurbuja && <span className="regalo-flotante__burbuja">{ganado ? `Tu premio: ${resultado.etiqueta}` : '¡Gira y gana!'}</span>}
        </button>
        {!cerradaBurbuja && <button type="button" className="regalo-flotante__cerrar" onClick={() => setCerradaBurbuja(true)} aria-label="Ocultar mensaje de la ruleta">×</button>}
      </div>

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
