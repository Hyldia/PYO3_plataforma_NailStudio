// La ruleta aparece una vez al inicio y puede ofrecerse de nuevo al finalizar la compra.
// El premio lo elige el servidor (así nadie puede hacer trampa) y cada premio es un cupón real.
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Modal from './Modal.jsx';

const CLAVE = 'ahnails-ruleta';
const ESPERA = 12 * 3600000;
const COLORES = ['#8C1D4B', '#FBE3EA', '#E0245E', '#FFF8F5', '#6E1539', '#F1DCD7', '#B8174A', '#FFFFFF'];
const TEXTO = ['#fff', '#8C1D4B', '#fff', '#8C1D4B', '#fff', '#8C1D4B', '#fff', '#8C1D4B'];
const INICIO = 'ahnails-ruleta-inicio';
const COMPRA = 'ahnails-ruleta-compra';
const PAGINAS_SIN_RULETA = ['/equipo', '/admin'];
const sesionMarcada = (clave) => { try { return sessionStorage.getItem(clave) === '1'; } catch { return false; } };
const marcarSesion = (clave) => { try { sessionStorage.setItem(clave, '1'); } catch { /* sin almacenamiento */ } };
// Nombre: leer
// Descripción: Lee lo guardado de la ruleta.
// Entrada: Nada.
// Salida: Los datos.
// Objetivo: Recordar el premio.
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { return {}; } };
// Nombre: guardar
// Descripción: Guarda datos de la ruleta.
// Entrada: Los datos nuevos.
// Salida: Nada.
// Objetivo: Recordar el premio.
const guardar = (valor) => { try { localStorage.setItem(CLAVE, JSON.stringify({ ...leer(), ...valor })); } catch { /* sin almacenamiento */ } };
// El último premio ganado (para ofrecerlo en el pago)
// Nombre: premioGuardado
// Descripción: Da el premio ganado si sigue vigente.
// Entrada: Nada.
// Salida: El premio o nada.
// Objetivo: Mostrarlo de nuevo.
export const premioGuardado = () => { const guardado = leer(); return guardado.premio && Date.now() - guardado.cuando < 7 * 86400000 ? guardado.premio : null; };

// Nombre: punto
// Descripción: Calcula un punto en el círculo.
// Entrada: El ángulo y el radio.
// Salida: La posición.
// Objetivo: Dibujar la ruleta.
function punto(angulo, respuesta) {
  const radianes = ((angulo - 90) * Math.PI) / 180;
  return [200 + respuesta * Math.cos(radianes), 200 + respuesta * Math.sin(radianes)];
}

// Nombre: Rueda
// Descripción: Dibuja la rueda de premios.
// Entrada: Premios, giro y si está girando.
// Salida: La rueda.
// Objetivo: Ver la ruleta.
function Rueda({ premios, giro, girando }) {
  const cantidad = premios.length;
  const paso = 360 / cantidad;
  return (
    <svg viewBox="0 0 400 400" className="ruleta__rueda" role="img" aria-label={`Ruleta con ${cantidad} premios: ${premios.join(', ')}`}>
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
        {premios.map((premio, i) => {
          const [x1, y1] = punto(i * paso, 176);
          const [x2, y2] = punto((i + 1) * paso, 176);
          const medio = i * paso + paso / 2;
          return (
            <g key={i}>
              <path d={`M200 200 L${x1} ${y1} A176 176 0 0 1 ${x2} ${y2} Z`} fill={COLORES[i % COLORES.length]} stroke="#E8B04B" strokeWidth="1.5" />
              <g transform={`rotate(${medio} 200 200)`}>
                <text x="200" y="70" textAnchor="middle" fill={TEXTO[i % TEXTO.length]} className="ruleta__texto">{premio}</text>
                <text x="200" y="92" textAnchor="middle" fill={TEXTO[i % TEXTO.length]} className="ruleta__sub">{premio === 'Otra vez' ? 'gira de nuevo' : 'de descuento'}</text>
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

// Nombre: Confeti
// Descripción: Dibuja confeti.
// Entrada: Nada.
// Salida: El confeti.
// Objetivo: Celebrar el premio.
function Confeti() {
  return (
    <div className="confeti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <i key={i} style={{ '--x': `${(i * 37) % 100}%`, '--d': `${(i % 7) * 0.08}s`, '--c': ['#C2185B', '#E8B04B', '#F7C6D4', '#7A1F3D'][i % 4], '--r': `${(i * 47) % 360}deg` }} />
      ))}
    </div>
  );
}

// Nombre: Ruleta
// Descripción: Muestra la ruleta de premios.
// Entrada: Nada.
// Salida: La ventana de la ruleta.
// Objetivo: Regalar premios a las clientas.
export default function Ruleta() {
  const { pathname } = useLocation();
  const irA = useNavigate();
  const enCompra = pathname.startsWith('/finalizar-compra');
  const oculta = PAGINAS_SIN_RULETA.some((ruta) => pathname.startsWith(ruta));
  const [abierta, setAbierta] = useState(false);
  const [premios, setPremios] = useState([]);
  const [giro, setGiro] = useState(0);
  const [girando, setGirando] = useState(false);
  const [resultado, setResultado] = useState(() => {
    const guardado = leer();
    return guardado.premio && Date.now() - guardado.cuando < ESPERA ? guardado.premio : null;
  });
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [inicioMostrado, setInicioMostrado] = useState(() => sesionMarcada(INICIO));
  const [compraMostrada, setCompraMostrada] = useState(() => sesionMarcada(COMPRA));

  useEffect(() => { api.ruleta().then(setPremios).catch(() => setPremios([])); }, []);

  useEffect(() => {
    if (!premios.length || oculta) return undefined;

    if (enCompra) {
      if (!inicioMostrado) {
        marcarSesion(INICIO);
        setInicioMostrado(true);
      }
      if (compraMostrada || premioGuardado()?.codigo) return undefined;
      marcarSesion(COMPRA);
      setCompraMostrada(true);
      setAbierta(true);
      return undefined;
    }

    if (inicioMostrado) return undefined;
    if (premioGuardado()?.codigo) {
      marcarSesion(INICIO);
      setInicioMostrado(true);
      return undefined;
    }

    const temporizador = setTimeout(() => {
      marcarSesion(INICIO);
      setInicioMostrado(true);
      setAbierta(true);
    }, 8000);
    return () => clearTimeout(temporizador);
  }, [premios.length, pathname, enCompra, oculta, inicioMostrado, compraMostrada]);

  if (!premios.length || oculta) return null;

  // Nombre: girar
  // Descripción: Gira la ruleta.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Dar el premio.
  async function girar() {
    if (girando) return;
    setError(''); setCopiado(false);
    let respuesta;
    try { respuesta = await api.girarRuleta(); } catch (error) { setError(error.message); return; }
    const paso = 360 / premios.length;
    const ajuste = (Math.random() - 0.5) * paso * 0.6;
    // Vueltas completas y luego el segmento ganador queda debajo del indicador de arriba
    const destino = giro - (giro % 360) + 360 * 6 + (360 - (respuesta.indice * paso + paso / 2)) + ajuste;
    setResultado(null);
    setGirando(true);
    setGiro(destino);
    setTimeout(() => {
      setGirando(false);
      setResultado(respuesta);
      if (respuesta.codigo) guardar({ premio: respuesta, cuando: Date.now(), vista: true });
    }, 5600);
  }

  // Nombre: copiar
  // Descripción: Copia el código del premio.
  // Entrada: Nada.
  // Salida: Nada.
  // Objetivo: Pegarlo al pagar.
  const copiar = async () => {
    try { await navigator.clipboard.writeText(resultado.codigo); setCopiado(true); } catch { /* sin portapapeles */ }
  };
  const ganado = resultado?.codigo;

  return (
    <>
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
