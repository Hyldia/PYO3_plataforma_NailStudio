import { useId } from 'react';
import { hexDe } from '../lib/disenoBuilder.js';
import { esmalte } from '../lib/esmaltes.js';

// Muestra del diseño. Cada uña se dibuja en SVG con su forma, largo, color, acabado y decoración.
// <MuestraUnas> son tres uñas sueltas (para resúmenes); <ManoPrevia> pone las cinco uñas sobre una mano.
const LARGO = { Corto: 0, Medio: 14, Largo: 28, 'Extra largo': 40 };
export const TONOS_PIEL = [
  { nombre: 'Clara', hex: '#F3D3C0' }, { nombre: 'Media clara', hex: '#E2B69A' }, { nombre: 'Media', hex: '#C98E6B' },
  { nombre: 'Morena', hex: '#9A6447' }, { nombre: 'Oscura', hex: '#6B402B' }
];

function contorno(forma, t) {
  const base = 'V100 C52 112 8 112 8 100Z';
  switch (forma) {
    case 'Almendra': return `M8 100 V${t + 30} C8 ${t + 12} 22 ${t} 30 ${t - 6} C38 ${t} 52 ${t + 12} 52 ${t + 30} ${base}`;
    case 'Cuadrada': return `M8 100 V${t + 4} Q8 ${t} 12 ${t} H48 Q52 ${t} 52 ${t + 4} ${base}`;
    case 'Squoval': return `M8 100 V${t + 10} Q8 ${t} 18 ${t} H42 Q52 ${t} 52 ${t + 10} ${base}`;
    case 'Redonda': return `M8 100 V${t + 18} C8 ${t + 2} 52 ${t + 2} 52 ${t + 18} ${base}`;
    case 'Coffin': return `M8 100 V${t + 30} L18 ${t} H42 L52 ${t + 30} ${base}`;
    case 'Ballerina': return `M8 100 V${t + 34} C8 ${t + 22} 18 ${t + 6} 22 ${t} H38 C42 ${t + 6} 52 ${t + 22} 52 ${t + 34} ${base}`;
    case 'Stiletto': return `M8 100 V${t + 36} C8 ${t + 20} 26 ${t + 4} 30 ${t - 12} C34 ${t + 4} 52 ${t + 20} 52 ${t + 36} ${base}`;
    default: return `M8 100 V${t + 22} C8 ${t - 4} 52 ${t - 4} 52 ${t + 22} ${base}`;
  }
}

// Un color que contraste con el elegido, para puntas, puntos y flores
const claro = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) > 170; };

export function Una({ d, acento = false, ...pos }) {
  const id = useId().replace(/:/g, '');
  const t = 40 - LARGO[d.largo];
  const color = d.hex || hexDe(d.color);
  const acabado = acento ? 'Glitter' : d.tipo === 'Glitter' && d.acabado === 'Brillante' ? 'Glitter' : d.tipo === 'Metálico' && d.acabado === 'Brillante' ? 'Chrome' : d.acabado;
  const deco = acento ? 'Pedrería' : d.decoracion;
  const contraste = claro(color) ? '#C2187A' : '#FFFFFF';
  const punta = d.color === 'Blanco' || d.color === 'Milky white' ? '#E8B4BC' : '#FFFFFF';
  const R = (props) => <rect x="0" y="-20" width="60" height="140" {...props} />;

  return (
    <svg viewBox="0 -14 60 130" className="muestra-una" aria-hidden="true" {...pos}>
      <defs>
        <clipPath id={`c${id}`}><path d={contorno(d.forma, t)} /></clipPath>
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
        <pattern id={`gl${id}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.8" fill="#fff" opacity="0.9" /><circle cx="4.5" cy="4" r="0.6" fill="#F3DCA8" opacity="0.9" />
        </pattern>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <R fill={deco === 'Mármol' ? '#F5F2F0' : deco === 'Francesa de color' ? '#F1D5C8' : color} />
        {deco === 'Francesa' && <rect x="0" y="-20" width="60" height={t + 34} fill={punta} />}
        {deco === 'Francesa de color' && <path d={`M0 -20 H60 V${t + 30} Q30 ${t + 46} 0 ${t + 30}Z`} fill={color} />}
        {deco === 'Baby boomer' && <R fill={`url(#baby${id})`} />}
        {deco === 'Ombré' && <R fill={`url(#ombre${id})`} />}
        {deco === 'Mármol' && (
          <g fill="none" stroke={color} strokeLinecap="round">
            <path d={`M4 ${t + 20} C20 ${t + 34} 18 ${t + 48} 40 ${t + 60} S52 96 58 104`} strokeWidth="2.2" opacity="0.8" />
            <path d={`M30 ${t + 10} C34 ${t + 30} 22 ${t + 40} 26 ${t + 58}`} strokeWidth="1" opacity="0.6" />
            <path d={`M48 ${t + 26} C40 ${t + 40} 46 ${t + 52} 38 ${t + 70}`} strokeWidth="0.8" opacity="0.5" />
          </g>
        )}
        {deco === 'Líneas' && <path d={`M14 ${t + 30} L46 ${t + 18} M14 ${t + 44} L46 ${t + 32}`} stroke="#D4AF37" strokeWidth="1.6" />}
        {deco === 'Puntos' && [[20, t + 30], [36, t + 40], [24, t + 54], [40, t + 64], [28, t + 78]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.4" fill={contraste} />)}
        {deco === 'Corazones' && [[30, t + 46, 1], [19, t + 70, 0.7], [41, t + 78, 0.6]].map(([x, y, k]) => (
          <path key={y} transform={`translate(${x} ${y}) scale(${k})`} d="M0 6 C-10 -2 -6 -10 0 -5 C6 -10 10 -2 0 6Z" fill={contraste} />
        ))}
        {deco === 'Flores a mano' && [[22, t + 34], [38, t + 56]].map(([x, y]) => (
          <g key={x}>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={x + 4 * Math.cos(a * Math.PI / 180)} cy={y + 4 * Math.sin(a * Math.PI / 180)} r="3" fill={contraste} opacity="0.95" />)}<circle cx={x} cy={y} r="2" fill="#E9B949" /></g>
        ))}
        {deco === 'Animal print' && [[16, t + 28], [36, t + 36], [24, t + 52], [44, t + 58], [16, t + 74], [34, t + 82]].map(([x, y]) => (
          <g key={`${x}${y}`}><ellipse cx={x} cy={y} rx="5" ry="4" fill="none" stroke="#2A1A12" strokeWidth="1.8" strokeDasharray="9 3" /><ellipse cx={x} cy={y} rx="2.6" ry="2" fill="#B4793A" /></g>
        ))}
        {deco === 'Foil dorado' && [[14, t + 26, 8], [38, t + 44, 10], [22, t + 66, 7], [44, t + 80, 6]].map(([x, y, r]) => (
          <path key={y} d={`M${x} ${y} l${r} ${r * 0.3} l-${r * 0.4} ${r} l-${r * 0.8} -${r * 0.4}Z`} fill="#D4AF37" opacity="0.9" />
        ))}
        {deco === 'Pedrería' && [[30, 80, 3.4], [30, 70, 2.4], [30, 62, 1.8]].map(([x, y, r]) => <circle key={y} cx={x} cy={y} r={r} fill="#fff" stroke="#C9D7EA" strokeWidth="0.8" />)}
        {acabado === 'Glitter' && <R fill={`url(#gl${id})`} />}
        {acabado === 'Chrome' && <R fill={`url(#cromo${id})`} />}
        {acabado === 'Ojo de gato' && <R fill={`url(#gato${id})`} />}
        {acabado === 'Aurora' && <R fill={`url(#aurora${id})`} />}
        {acabado === 'Perlado' && <R fill={`url(#perla${id})`} />}
        <R fill={`url(#curva${id})`} opacity={acabado === 'Mate' ? 0.5 : 1} />
        {acabado !== 'Mate' && acabado !== 'Chrome' && <R fill={`url(#brillo${id})`} />}
      </g>
      <path d={contorno(d.forma, t)} fill="none" stroke="rgba(34,22,28,0.22)" strokeWidth="1" />
    </svg>
  );
}

// Datos para dibujar una uña concreta del diseño (uña por uña)
export const datosUna = (diseno, i) => {
  const u = diseno.unas?.[i];
  if (!u) return diseno;
  const e = esmalte(u.esmalte);
  return { forma: diseno.forma, largo: diseno.largo, hex: e?.hex, tipo: e?.tipo, color: e?.nombre, acabado: u.acabado, decoracion: u.decoracion };
};

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

function Dedo({ dedo, d, piel, acento }) {
  const { x, top, w, largo } = dedo;
  const H = w * 130 / 60;
  return (
    <g>
      <rect x={x - w / 2} y={top} width={w} height={largo} rx={w / 2} fill={piel} />
      <rect x={x - w / 2} y={top} width={w} height={largo} rx={w / 2} fill="url(#luzDedo)" />
      {/* Pliegues de los nudillos */}
      <path d={`M${x - w * 0.28} ${top + w * 2.05} q${w * 0.28} ${w * 0.1} ${w * 0.56} 0`} stroke="rgba(80,40,30,0.18)" strokeWidth="1.6" fill="none" />
      <path d={`M${x - w * 0.22} ${top + w * 2.2} q${w * 0.22} ${w * 0.08} ${w * 0.44} 0`} stroke="rgba(80,40,30,0.12)" strokeWidth="1.2" fill="none" />
      <Una d={d} acento={acento} x={x - w * 0.56} y={top - 0.385 * H * 1.12} width={w * 1.12} height={H * 1.12} />
    </g>
  );
}

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
