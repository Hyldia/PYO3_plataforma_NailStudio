// Dibujo en SVG de las uñas: forma, largo, color, acabado y decoraciones de cada una.
import { useId } from 'react';
import { hexDe } from '../patrones/constructorDiseno.js';
import { esmalte } from '../lib/esmaltes.js';

// Muestra del diseño. Cada uña se dibuja en SVG con su forma, largo, color, acabado y decoración.
// <MuestraUnas> (dibujo de tres uñas) son tres uñas sueltas (para resúmenes); <ManoPrevia> pone las cinco uñas sobre una mano.
const LARGO = { Corto: 0, Medio: 14, Largo: 28, 'Extra largo': 40 };
export const TONOS_PIEL = [
  { nombre: 'Clara', hex: '#F3D3C0' }, { nombre: 'Media clara', hex: '#E2B69A' }, { nombre: 'Media', hex: '#C98E6B' },
  { nombre: 'Morena', hex: '#9A6447' }, { nombre: 'Oscura', hex: '#6B402B' }
];

// Nombre: contorno
// Descripción: Dibuja el contorno de una uña.
// Entrada: La forma y el largo.
// Salida: El trazo.
// Objetivo: Dibujar cada forma de uña.
function contorno(forma, texto) {
  const base = 'V100 C52 112 42 116 30 116 C18 116 8 112 8 100Z';
  switch (forma) {
    case 'Almendra': return `M8 100 V${texto + 34} C8 ${texto + 18} 20 ${texto + 7} 30 ${texto + 2} C40 ${texto + 7} 52 ${texto + 18} 52 ${texto + 34} ${base}`;
    case 'Ovalada': return `M8 100 V${texto + 22} C8 ${texto + 4} 20 ${texto - 2} 30 ${texto - 2} C40 ${texto - 2} 52 ${texto + 4} 52 ${texto + 22} ${base}`;
    case 'Cuadrada': return `M8 100 V${texto + 8} Q8 ${texto + 3} 13 ${texto + 3} H47 Q52 ${texto + 3} 52 ${texto + 8} ${base}`;
    case 'Squoval': return `M8 100 V${texto + 12} Q8 ${texto + 3} 17 ${texto + 3} H43 Q52 ${texto + 3} 52 ${texto + 12} ${base}`;
    case 'Redonda': return `M8 100 V${texto + 20} C8 ${texto + 4} 52 ${texto + 4} 52 ${texto + 20} ${base}`;
    case 'Coffin': return `M8 100 V${texto + 30} Q8 ${texto + 20} 16 ${texto + 8} L20 ${texto + 5} H40 L44 ${texto + 8} Q52 ${texto + 20} 52 ${texto + 30} ${base}`;
    case 'Ballerina': return `M8 100 V${texto + 32} C8 ${texto + 20} 17 ${texto + 8} 21 ${texto + 4} H39 C43 ${texto + 8} 52 ${texto + 20} 52 ${texto + 32} ${base}`;
    case 'Stiletto': return `M8 100 V${texto + 36} C8 ${texto + 22} 23 ${texto + 8} 30 ${texto} C37 ${texto + 8} 52 ${texto + 22} 52 ${texto + 36} ${base}`;
    default: return `M8 100 V${texto + 22} C8 ${texto + 2} 52 ${texto + 2} 52 ${texto + 22} ${base}`;
  }
}

// Un color que contraste con el elegido, para puntas, puntos y flores
// Nombre: claro
// Descripción: Revisa si un color es claro.
// Entrada: El color.
// Salida: Sí o no.
// Objetivo: Elegir brillos que se noten.
const claro = (hex) => { const numero = parseInt(hex.slice(1), 16); return ((numero >> 16) * 0.3 + ((numero >> 8) & 255) * 0.59 + (numero & 255) * 0.11) > 170; };

// Puntos de la uña donde se ponen las decoraciones pegadas, según la parte elegida
// Nombre: puntosDe
// Descripción: Calcula dónde van las piedras o stickers en la uña.
// Entrada: La parte de la uña, la punta (t) y cuántos.
// Salida: Lista de puntos [x, y].
// Objetivo: Dibujar cada decoración en su lugar.
function puntosDe(posicion, texto, varios = true) {
  const centro = Math.round((texto + 114) / 2);
  if (!varios) return [{ Base: [30, 90], Punta: [30, texto + 22], Centro: [30, centro], 'Un lado': [17, centro], 'Toda la uña': [30, centro] }[posicion] || [30, centro]];
  return {
    Base: [[21, 93], [30, 96], [39, 93]],
    Punta: [[22, texto + 21], [30, texto + 17], [38, texto + 21]],
    Centro: [[30, centro - 10], [30, centro], [30, centro + 10]],
    'Un lado': [[15, texto + 30], [15, texto + 44], [15, texto + 58], [15, texto + 72], [15, texto + 86]],
    'Toda la uña': [[20, texto + 24], [38, texto + 32], [27, texto + 46], [41, texto + 58], [19, texto + 68], [33, texto + 80], [24, 94], [40, 90]]
  }[posicion] || [[30, centro]];
}
// Zona de la uña para polvos (glitter, cromo...)
// Nombre: zonaDe
// Descripción: Da el rectángulo de la parte de la uña.
// Entrada: La parte y la punta (t).
// Salida: x, y, ancho y alto.
// Objetivo: Pintar polvo solo donde va.
function zonaDe(posicion, texto) {
  const centro = Math.round((texto + 114) / 2);
  return { Base: [0, 80, 60, 50], Punta: [0, -20, 60, texto + 50], Centro: [0, centro - 15, 60, 30], 'Un lado': [0, -20, 22, 150] }[posicion] || [0, -20, 60, 150];
}
const COLOR_PIEDRA = { Blancas: '#FFFFFF', Doradas: '#E9C46A', Transparentes: '#F4FAFF', Tornasol: '#E6D9FF', Dorados: '#E9C46A', Dorado: '#D4AF37', Plateado: '#C9CED6',
  Doradas_l: '#D4AF37', Blancas_l: '#FFFFFF', Negras: '#1E1A1C' };
const COLORES_VARIOS = ['#F49AC1', '#8FC9F0', '#B9E3A8', '#F7D27A', '#C8A8F0'];
// Las piedras y figuras se dibujan un poco más grandes para que se vean bien en la mano
// Nombre: crecer
// Descripción: Agranda una figura sin moverla de su lugar.
// Entrada: El punto (x, y) y cuánto crece.
// Salida: El texto de transformación.
// Objetivo: Que las decoraciones se noten.
const crecer = (x, y, k = 1.45) => `translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`;

// Nombre: adornos
// Descripción: Dibuja las decoraciones pegadas de una uña (perlas, cristales, stickers, polvo, flores 3D, foil, charms, líneas).
// Entrada: Las decoraciones, la punta (t), el id y el color de contraste.
// Salida: Dos grupos: lo que va dentro de la uña y lo que sobresale (3D).
// Objetivo: Que la clienta vea en la mano lo que va eligiendo.
function adornos(extras, texto, id, contraste) {
  const dentro = []; const encima = [];
  (extras || []).forEach((extra, numero) => {
    const clave = `${extra.tipo}${numero}`;
    const varios = extra.variante === 'De colores';
    if (extra.tipo === 'Polvo') {
      const [zx, zy, zw, zh] = zonaDe(extra.posicion, texto);
      const relleno = { Glitter: `url(#gl${id})`, 'Cromo espejo': `url(#cromo${id})`, Aurora: `url(#aurora${id})`, Terciopelo: `url(#gato${id})`, Perlado: `url(#perla${id})` }[extra.variante];
      dentro.push(<rect key={clave} x={zx} y={zy} width={zw} height={zh} fill={relleno} />);
      if (extra.variante === 'Glitter') dentro.push(<rect key={`${clave}b`} x={zx} y={zy} width={zw} height={zh} fill={`url(#gl${id})`} transform="translate(3 2)" />);
    }
    if (extra.tipo === 'Foil') {
      const color = COLOR_PIEDRA[extra.variante] || '#D4AF37';
      puntosDe(extra.posicion, texto).forEach(([px, py], i) => dentro.push(
        <path key={`${clave}${i}`} d={`M${px - 4} ${py - 2} l7 -2 l2 6 l-6 3z`} fill={extra.variante === 'Tornasol' ? `url(#aurora${id})` : color} stroke={color} strokeWidth="0.4" opacity="0.95" />));
    }
    if (extra.tipo === 'Líneas finas') {
      const color = { Doradas: '#D4AF37', Blancas: '#FFFFFF', Negras: '#1E1A1C' }[extra.variante];
      const [, zy, , zh] = zonaDe(extra.posicion, texto);
      const y0 = Math.max(zy, texto + 8); const y1 = Math.min(zy + zh, 104);
      dentro.push(<path key={clave} d={`M10 ${y0 + 6} C24 ${y0 + 14} 34 ${y0 + 2} 52 ${y0 + 12} M8 ${(y0 + y1) / 2} C22 ${(y0 + y1) / 2 + 8} 36 ${(y0 + y1) / 2 - 6} 52 ${(y0 + y1) / 2 + 4}`} fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" />);
    }
    if (extra.tipo === 'Stickers') {
      puntosDe(extra.posicion, texto).forEach(([px, py], i) => {
        const col = contraste;
        const forma = {
          Flores: <g>{[0, 72, 144, 216, 288].map((angulo) => <circle key={angulo} cx={px + 2.6 * Math.cos(angulo * Math.PI / 180)} cy={py + 2.6 * Math.sin(angulo * Math.PI / 180)} r="1.9" fill={col} />)}<circle cx={px} cy={py} r="1.3" fill="#E9B949" /></g>,
          Mariposas: <g fill={col}><ellipse cx={px - 2.4} cy={py - 1} rx="2.4" ry="3" /><ellipse cx={px + 2.4} cy={py - 1} rx="2.4" ry="3" /><ellipse cx={px - 1.8} cy={py + 2.4} rx="1.6" ry="1.8" /><ellipse cx={px + 1.8} cy={py + 2.4} rx="1.6" ry="1.8" /><rect x={px - 0.4} y={py - 3} width="0.8" height="6.5" fill="#2A1A12" /></g>,
          Corazones: <path d={`M${px} ${py + 3.4} C${px - 6} ${py - 1} ${px - 3} ${py - 6} ${px} ${py - 2.6} C${px + 3} ${py - 6} ${px + 6} ${py - 1} ${px} ${py + 3.4}Z`} fill={col} />,
          Estrellas: <path d={`M${px} ${py - 4} l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z`} fill={col} />,
          Letras: <text x={px} y={py + 2.5} fontSize="7" fontFamily="serif" fontStyle="italic" fontWeight="700" textAnchor="middle" fill={col}>{'AH'[i % 2]}</text>
        }[extra.variante];
        dentro.push(<g key={`${clave}${i}`} transform={crecer(px, py, 1.35)}>{forma}</g>);
      });
    }
    if (extra.tipo === 'Perlas') {
      puntosDe(extra.posicion, texto).forEach(([px, py], i) => {
        const col = varios ? COLORES_VARIOS[i % 5] : COLOR_PIEDRA[extra.variante];
        encima.push(<g key={`${clave}${i}`} transform={crecer(px, py)}><circle cx={px} cy={py + 0.6} r="3.3" fill="rgba(60,30,30,0.25)" /><circle cx={px} cy={py} r="3.2" fill={col} /><circle cx={px} cy={py} r="3.2" fill={`url(#perla3d${id})`} /></g>);
      });
    }
    if (extra.tipo === 'Cristales') {
      puntosDe(extra.posicion, texto).forEach(([px, py], i) => {
        const col = varios ? COLORES_VARIOS[i % 5] : COLOR_PIEDRA[extra.variante];
        encima.push(<g key={`${clave}${i}`} transform={crecer(px, py)}>
          <path d={`M${px} ${py - 3.6} L${px + 3.4} ${py} L${px} ${py + 3.6} L${px - 3.4} ${py}Z`} fill={extra.variante === 'Tornasol' ? `url(#aurora${id})` : col} stroke="rgba(120,140,170,0.8)" strokeWidth="0.5" />
          <path d={`M${px} ${py - 3.6} L${px + 1} ${py} L${px} ${py + 3.6} M${px - 3.4} ${py} H${px + 3.4}`} stroke="rgba(255,255,255,0.9)" strokeWidth="0.4" fill="none" />
          <circle cx={px - 1} cy={py - 1.2} r="0.7" fill="#fff" />
        </g>);
      });
    }
    if (extra.tipo === 'Flores 3D') {
      const grande = extra.posicion === 'Toda la uña' ? 1.35 : 1;
      const lista = extra.variante === 'Florecitas' ? puntosDe(extra.posicion, texto).slice(0, 3) : puntosDe(extra.posicion, texto, false);
      lista.forEach(([px, py], i) => {
        const radio = (extra.variante === 'Florecitas' ? 2.6 : 4.4) * grande;
        const petalo = extra.variante === 'Rosas' ? '#F2A7BC' : '#FFFFFF';
        encima.push(<g key={`${clave}${i}`} filter={`url(#sombra${id})`} transform={crecer(px, py, 1.3)}>
          {[0, 72, 144, 216, 288].map((angulo) => <ellipse key={angulo} cx={px + radio * 0.8 * Math.cos((angulo - 90) * Math.PI / 180)} cy={py + radio * 0.8 * Math.sin((angulo - 90) * Math.PI / 180)} rx={radio * 0.62} ry={radio * 0.62} fill={petalo} stroke="rgba(180,120,140,0.5)" strokeWidth="0.3" />)}
          {extra.variante === 'Rosas'
            ? <><circle cx={px} cy={py} r={radio * 0.55} fill="#E57E9B" /><path d={`M${px - radio * 0.3} ${py} a${radio * 0.3} ${radio * 0.3} 0 1 1 ${radio * 0.4} ${radio * 0.1}`} fill="none" stroke="#C45A79" strokeWidth="0.5" /></>
            : <circle cx={px} cy={py} r={radio * 0.38} fill="#F2C94C" />}
        </g>);
      });
    }
    if (extra.tipo === 'Charms') {
      const [px, py] = puntosDe(extra.posicion, texto, false)[0];
      const oro = '#D9AE48';
      const forma = {
        'Moños': <g><path d={`M${px} ${py} C${px - 6} ${py - 5} ${px - 7} ${py + 4} ${px} ${py}Z M${px} ${py} C${px + 6} ${py - 5} ${px + 7} ${py + 4} ${px} ${py}Z`} fill={oro} /><path d={`M${px - 1} ${py} l-2 5 M${px + 1} ${py} l2 5`} stroke={oro} strokeWidth="1.2" /><circle cx={px} cy={py} r="1.4" fill="#F4D98A" /></g>,
        Corazones: <path d={`M${px} ${py + 5} C${px - 8} ${py - 1} ${px - 4} ${py - 8} ${px} ${py - 3.5} C${px + 4} ${py - 8} ${px + 8} ${py - 1} ${px} ${py + 5}Z`} fill={oro} stroke="#B38A2E" strokeWidth="0.5" />,
        Estrellas: <path d={`M${px} ${py - 6} l1.8 3.9 4.2.5-3.1 2.9.8 4.2-3.7-2.1-3.7 2.1.8-4.2-3.1-2.9 4.2-.5z`} fill={oro} stroke="#B38A2E" strokeWidth="0.5" />,
        Mariposas: <g fill={oro} stroke="#B38A2E" strokeWidth="0.4"><ellipse cx={px - 3.4} cy={py - 1.5} rx="3.4" ry="4" /><ellipse cx={px + 3.4} cy={py - 1.5} rx="3.4" ry="4" /><ellipse cx={px - 2.4} cy={py + 3} rx="2.2" ry="2.4" /><ellipse cx={px + 2.4} cy={py + 3} rx="2.2" ry="2.4" /></g>
      }[extra.variante];
      encima.push(<g key={clave} filter={`url(#sombra${id})`} transform={crecer(px, py, 1.3)}>{forma}<circle cx={px - 1.5} cy={py - 2} r="0.9" fill="#FFF6D6" /></g>);
    }
  });
  return { dentro, encima };
}

// Nombre: Una
// Descripción: Dibuja una sola uña con su color, forma, acabado y decoraciones.
// Entrada: El diseño de la uña (d), si va resaltada y su posición.
// Salida: El dibujo SVG de la uña.
// Objetivo: Mostrar cada uña del diseño por separado.
export function Una({ d, acento = false, ...pos }) {
  const id = useId().replace(/:/g, '');
  const puntaY = 40 - LARGO[d.largo];
  const color = d.hex || hexDe(d.color);
  const acabado = acento ? 'Glitter' : d.tipo === 'Glitter' && d.acabado === 'Brillante' ? 'Glitter' : d.tipo === 'Metálico' && d.acabado === 'Brillante' ? 'Chrome' : d.acabado;
  const deco = acento ? 'Pedrería' : d.decoracion;
  const contraste = claro(color) ? '#C2187A' : '#FFFFFF';
  const punta = d.color === 'Blanco' || d.color === 'Milky white' ? '#E8B4BC' : '#FFFFFF';
  // Nombre: Fondo
  // Descripción: Dibuja un rectángulo de fondo.
  // Entrada: Sus medidas.
  // Salida: El rectángulo.
  // Objetivo: Pintar la uña.
  const Fondo = (props) => <rect x="0" y="-20" width="60" height="140" {...props} />;
  const { dentro, encima } = adornos(d.extras, puntaY, id, contraste);

  return (
    <svg viewBox="0 -14 60 130" className="muestra-una" aria-hidden="true" {...pos}>
      <defs>
        <clipPath id={`c${id}`}><path d={contorno(d.forma, puntaY)} /></clipPath>
        <linearGradient id={`curva${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.2" /><stop offset="0.25" stopColor="#000" stopOpacity="0" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`brillo${id}`} x1="0" x2="1">
          <stop offset="0.15" stopColor="#fff" stopOpacity="0" /><stop offset="0.27" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.36" stopColor="#fff" stopOpacity="0.1" /><stop offset="0.42" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`cromo${id}`} x1="0" x2="1" y1="0" y2="0.4">
          <stop offset="0" stopColor="#000" stopOpacity="0.3" /><stop offset="0.32" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" /><stop offset="0.8" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id={`gato${id}`} x1="0" x2="1" y1="1" y2="0">
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.75" /><stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`aurora${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#9FE7F5" stopOpacity="0.55" /><stop offset="0.35" stopColor="#F5A3E0" stopOpacity="0.45" />
          <stop offset="0.7" stopColor="#C9B8F5" stopOpacity="0.5" /><stop offset="1" stopColor="#FFF2B3" stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id={`perla${id}`} cx="0.35" cy="0.4" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" /><stop offset="1" stopColor="#F3E6EF" stopOpacity="0.1" />
        </radialGradient>
        <linearGradient id={`baby${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={punta} /><stop offset="0.55" stopColor={punta} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`ombre${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0.1" stopColor={color} stopOpacity="0" /><stop offset="0.8" stopColor="#F3D9CF" />
        </linearGradient>
        <radialGradient id={`perla3d${id}`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" /><stop offset="0.45" stopColor="#fff" stopOpacity="0.15" /><stop offset="1" stopColor="#6B5A60" stopOpacity="0.35" />
        </radialGradient>
        <filter id={`sombra${id}`} x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0.8" stdDeviation="0.7" floodColor="#3A1F28" floodOpacity="0.45" /></filter>
        <pattern id={`gl${id}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.8" fill="#fff" opacity="0.9" /><circle cx="4.5" cy="4" r="0.6" fill="#F3DCA8" opacity="0.9" />
        </pattern>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <Fondo fill={deco === 'Mármol' ? '#F5F2F0' : deco === 'Francesa de color' ? '#F1D5C8' : color} />
        {deco === 'Francesa' && <rect x="0" y="-20" width="60" height={puntaY + 34} fill={punta} />}
        {deco === 'Francesa de color' && <path d={`M0 -20 H60 V${puntaY + 30} Q30 ${puntaY + 46} 0 ${puntaY + 30}Z`} fill={color} />}
        {deco === 'Baby boomer' && <Fondo fill={`url(#baby${id})`} />}
        {deco === 'Ombré' && <Fondo fill={`url(#ombre${id})`} />}
        {deco === 'Mármol' && (
          <g fill="none" stroke={color} strokeLinecap="round">
            <path d={`M4 ${puntaY + 20} C20 ${puntaY + 34} 18 ${puntaY + 48} 40 ${puntaY + 60} S52 96 58 104`} strokeWidth="2.2" opacity="0.8" />
            <path d={`M30 ${puntaY + 10} C34 ${puntaY + 30} 22 ${puntaY + 40} 26 ${puntaY + 58}`} strokeWidth="1" opacity="0.6" />
            <path d={`M48 ${puntaY + 26} C40 ${puntaY + 40} 46 ${puntaY + 52} 38 ${puntaY + 70}`} strokeWidth="0.8" opacity="0.5" />
          </g>
        )}
        {deco === 'Líneas' && <path d={`M14 ${puntaY + 30} L46 ${puntaY + 18} M14 ${puntaY + 44} L46 ${puntaY + 32}`} stroke="#D4AF37" strokeWidth="1.6" />}
        {deco === 'Puntos' && [[20, puntaY + 30], [36, puntaY + 40], [24, puntaY + 54], [40, puntaY + 64], [28, puntaY + 78]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.4" fill={contraste} />)}
        {deco === 'Corazones' && [[30, puntaY + 46, 1], [19, puntaY + 70, 0.7], [41, puntaY + 78, 0.6]].map(([x, y, k]) => (
          <path key={y} transform={`translate(${x} ${y}) scale(${k})`} d="M0 6 C-10 -2 -6 -10 0 -5 C6 -10 10 -2 0 6Z" fill={contraste} />
        ))}
        {deco === 'Flores a mano' && [[22, puntaY + 34], [38, puntaY + 56]].map(([x, y]) => (
          <g key={x}>{[0, 72, 144, 216, 288].map((angulo) => <circle key={angulo} cx={x + 4 * Math.cos(angulo * Math.PI / 180)} cy={y + 4 * Math.sin(angulo * Math.PI / 180)} r="3" fill={contraste} opacity="0.95" />)}<circle cx={x} cy={y} r="2" fill="#E9B949" /></g>
        ))}
        {deco === 'Animal print' && [[16, puntaY + 28], [36, puntaY + 36], [24, puntaY + 52], [44, puntaY + 58], [16, puntaY + 74], [34, puntaY + 82]].map(([x, y]) => (
          <g key={`${x}${y}`}><ellipse cx={x} cy={y} rx="5" ry="4" fill="none" stroke="#2A1A12" strokeWidth="1.8" strokeDasharray="9 3" /><ellipse cx={x} cy={y} rx="2.6" ry="2" fill="#B4793A" /></g>
        ))}
        {deco === 'Foil dorado' && [[14, puntaY + 26, 8], [38, puntaY + 44, 10], [22, puntaY + 66, 7], [44, puntaY + 80, 6]].map(([x, y, r]) => (
          <path key={y} d={`M${x} ${y} l${r} ${r * 0.3} l-${r * 0.4} ${r} l-${r * 0.8} -${r * 0.4}Z`} fill="#D4AF37" opacity="0.9" />
        ))}
        {deco === 'Pedrería' && [[30, 80, 3.4], [30, 70, 2.4], [30, 62, 1.8]].map(([x, y, r]) => <circle key={y} cx={x} cy={y} r={r} fill="#fff" stroke="#C9D7EA" strokeWidth="0.8" />)}
        {acabado === 'Glitter' && <Fondo fill={`url(#gl${id})`} />}
        {acabado === 'Chrome' && <Fondo fill={`url(#cromo${id})`} />}
        {acabado === 'Ojo de gato' && <Fondo fill={`url(#gato${id})`} />}
        {acabado === 'Aurora' && <Fondo fill={`url(#aurora${id})`} />}
        {acabado === 'Perlado' && <Fondo fill={`url(#perla${id})`} />}
        {dentro}
        <Fondo fill={`url(#curva${id})`} opacity={acabado === 'Mate' ? 0.5 : 1} />
        {acabado !== 'Mate' && acabado !== 'Chrome' && <Fondo fill={`url(#brillo${id})`} />}
      </g>
      <path d={contorno(d.forma, puntaY)} fill="none" stroke="rgba(34,22,28,0.22)" strokeWidth="1" />
      {encima}
    </svg>
  );
}

// Datos para dibujar una uña concreta del diseño (uña por uña)
// Nombre: datosUna
// Descripción: Da el diseño de una uña.
// Entrada: El diseño y el número de uña.
// Salida: Los datos de esa uña.
// Objetivo: Diseñar uña por uña.
export const datosUna = (diseno, i) => {
  const una = diseno.unas?.[i];
  if (!una) return diseno;
  const colorEsmalte = esmalte(una.esmalte);
  return {
    forma: una.forma || diseno.forma,
    largo: una.largo || diseno.largo,
    hex: colorEsmalte?.hex,
    tipo: colorEsmalte?.tipo,
    color: colorEsmalte?.nombre,
    acabado: una.acabado,
    decoracion: una.decoracion,
    extras: (diseno.extras || []).filter((extra) => extra.dedos?.includes(i))
  };
};

// Nombre: MuestraUnas
// Descripción: Muestra cinco uñas con el diseño.
// Entrada: El diseño.
// Salida: El dibujo.
// Objetivo: Vista previa rápida.
export default function MuestraUnas({ diseno }) {
  return (
    <div className="muestra-unas">
      {diseno.unas ? [1, 2, 3].map((i) => <Una key={i} d={datosUna(diseno, i)} />) : (
        <><Una d={diseno} /><Una d={diseno} acento={diseno.acento} /><Una d={diseno} /></>
      )}
    </div>
  );
}

// Mano vista desde arriba con las cinco uñas. La uña de acento va en el anular.
const DEDOS = [
  { nombre: 'meñique', x: 92, top: 150, w: 44, largo: 170 },
  { nombre: 'anular', x: 158, top: 88, w: 50, largo: 220 },
  { nombre: 'medio', x: 228, top: 62, w: 52, largo: 240 },
  { nombre: 'índice', x: 296, top: 96, w: 50, largo: 215 }
];

// Nombre: Dedo
// Descripción: Dibuja un dedo con su uña.
// Entrada: Dedo, diseño, piel y acento.
// Salida: El dedo.
// Objetivo: Armar la mano.
function Dedo({ dedo, d, piel, acento }) {
  const { x, top, w, largo } = dedo;
  const alto = w * 130 / 60;
  return (
    <g>
      <rect x={x - w / 2} y={top} width={w} height={largo} rx={w / 2} fill={piel} />
      <rect x={x - w / 2} y={top} width={w} height={largo} rx={w / 2} fill="url(#luzDedo)" />
      {/* Pliegues de los nudillos */}
      <path d={`M${x - w * 0.28} ${top + w * 2.05} q${w * 0.28} ${w * 0.1} ${w * 0.56} 0`} stroke="rgba(80,40,30,0.18)" strokeWidth="1.6" fill="none" />
      <path d={`M${x - w * 0.22} ${top + w * 2.2} q${w * 0.22} ${w * 0.08} ${w * 0.44} 0`} stroke="rgba(80,40,30,0.12)" strokeWidth="1.2" fill="none" />
      <Una d={d} acento={acento} x={x - w * 0.56} y={top - 0.385 * alto * 1.12} width={w * 1.12} height={alto * 1.12} />
    </g>
  );
}

// Nombre: ManoPrevia
// Descripción: Dibuja una mano completa.
// Entrada: El diseño y el tono de piel.
// Salida: La mano.
// Objetivo: Ver cómo queda.
export function ManoPrevia({ diseno, piel = TONOS_PIEL[1].hex }) {
  return (
    <svg viewBox="0 -40 420 470" className="mano-previa" role="img" aria-label="Vista previa del diseño en una mano">
      <defs>
        <linearGradient id="luzDedo" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.16" /><stop offset="0.3" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.7" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id="luzPalma" cx="0.45" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" /><stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </radialGradient>
      </defs>
      {/* Sombra sobre la mesa */}
      <ellipse cx="215" cy="420" rx="190" ry="18" fill="rgba(34,22,28,0.12)" />
      {/* Palma */}
      <path d="M66 300 C60 250 80 230 120 228 L330 236 C350 240 356 270 350 310 L340 430 H80 Z" fill={piel} />
      <path d="M66 300 C60 250 80 230 120 228 L330 236 C350 240 356 270 350 310 L340 430 H80 Z" fill="url(#luzPalma)" />
      {DEDOS.map((dedo) => <Dedo key={dedo.nombre} dedo={dedo} d={diseno} piel={piel} acento={dedo.nombre === 'anular' && diseno.acento} />)}
      {/* Pulgar, inclinado hacia afuera */}
      <g transform="rotate(38 360 330)">
        <Dedo dedo={{ nombre: 'pulgar', x: 360, top: 200, w: 56, largo: 190 }} d={diseno} piel={piel} />
      </g>
    </svg>
  );
}
