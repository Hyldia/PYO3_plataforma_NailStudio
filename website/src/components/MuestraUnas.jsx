import { useId } from 'react';
import { hexDe } from '../lib/disenoBuilder.js';

// Muestra orientativa del diseño: tres uñas dibujadas en SVG
const LARGO = { Corto: 0, Medio: 14, Largo: 28 };

function contorno(forma, t) {
  const base = 'V100 C52 112 8 112 8 100Z';
  switch (forma) {
    case 'Almendra': return `M8 100 V${t + 30} C8 ${t + 12} 22 ${t} 30 ${t - 6} C38 ${t} 52 ${t + 12} 52 ${t + 30} ${base}`;
    case 'Cuadrada': return `M8 100 V${t + 4} Q8 ${t} 12 ${t} H48 Q52 ${t} 52 ${t + 4} ${base}`;
    case 'Coffin': return `M8 100 V${t + 30} L18 ${t} H42 L52 ${t + 30} ${base}`;
    case 'Stiletto': return `M8 100 V${t + 36} C8 ${t + 20} 26 ${t + 4} 30 ${t - 12} C34 ${t + 4} 52 ${t + 20} 52 ${t + 36} ${base}`;
    default: return `M8 100 V${t + 22} C8 ${t - 4} 52 ${t - 4} 52 ${t + 22} ${base}`;
  }
}

function Una({ d, acento }) {
  const id = useId().replace(/:/g, '');
  const t = 40 - LARGO[d.largo];
  const color = hexDe(d.color);
  const acabado = acento ? 'Glitter' : d.acabado;
  const deco = acento ? 'Pedrería' : d.decoracion;
  const punta = d.color === 'Blanco' ? '#E8B4BC' : '#FFFFFF';

  return (
    <svg viewBox="0 -14 60 130" className="muestra-una" aria-hidden="true">
      <defs>
        <clipPath id={`c${id}`}><path d={contorno(d.forma, t)} /></clipPath>
        <linearGradient id={`curva${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.18" /><stop offset="0.25" stopColor="#000" stopOpacity="0" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.18" />
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
        <linearGradient id={`baby${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={punta} /><stop offset="0.55" stopColor={punta} stopOpacity="0" />
        </linearGradient>
        <pattern id={`gl${id}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.8" fill="#fff" opacity="0.9" /><circle cx="4.5" cy="4" r="0.6" fill="#F3DCA8" opacity="0.9" />
        </pattern>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <rect x="0" y="-20" width="60" height="140" fill={color} />
        {deco === 'Francesa' && <rect x="0" y="-20" width="60" height={t + 34} fill={punta} />}
        {deco === 'Baby boomer' && <rect x="0" y="-20" width="60" height="140" fill={`url(#baby${id})`} />}
        {deco === 'Líneas' && <path d={`M14 ${t + 30} L46 ${t + 18} M14 ${t + 44} L46 ${t + 32}`} stroke="#D4AF37" strokeWidth="1.6" />}
        {deco === 'Flores a mano' && [[22, t + 34], [38, t + 52]].map(([x, y]) => (
          <g key={x}>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={x + 4 * Math.cos(a * Math.PI / 180)} cy={y + 4 * Math.sin(a * Math.PI / 180)} r="3" fill={punta} />)}<circle cx={x} cy={y} r="2" fill="#E9B949" /></g>
        ))}
        {deco === 'Pedrería' && [[30, 80, 3.4], [30, 70, 2.4], [30, 62, 1.8]].map(([x, y, r]) => <circle key={y} cx={x} cy={y} r={r} fill="#fff" stroke="#C9D7EA" strokeWidth="0.8" />)}
        {acabado === 'Glitter' && <rect x="0" y="-20" width="60" height="140" fill={`url(#gl${id})`} />}
        {acabado === 'Chrome' && <rect x="0" y="-20" width="60" height="140" fill={`url(#cromo${id})`} />}
        <rect x="0" y="-20" width="60" height="140" fill={`url(#curva${id})`} opacity={acabado === 'Mate' ? 0.5 : 1} />
        {(acabado === 'Brillante' || acabado === 'Glitter') && <rect x="0" y="-20" width="60" height="140" fill={`url(#brillo${id})`} />}
      </g>
      <path d={contorno(d.forma, t)} fill="none" stroke="rgba(34,22,28,0.18)" strokeWidth="1" />
    </svg>
  );
}

export default function MuestraUnas({ diseno }) {
  return (
    <div className="muestra-unas">
      <Una d={diseno} />
      <Una d={diseno} acento={diseno.acento} />
      <Una d={diseno} />
    </div>
  );
}
