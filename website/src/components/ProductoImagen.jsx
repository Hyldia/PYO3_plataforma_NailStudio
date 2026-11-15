import Foto from './Foto.jsx';

// Ilustración del producto cuando todavía no tiene foto: se dibuja según su tipo y color.
// Así la tienda se ve completa y ordenada mientras el salón sube las fotos reales.
const M = '#9AA0A6';   // metal
const MO = '#6E747A';  // metal oscuro
const T = '#22161C';   // tinta

function Dibujo({ tipo, c }) {
  switch (tipo) {
    case 'frasco':
    case 'frasco-gel':
      return (<g>
        <rect x="88" y="34" width="24" height={tipo === 'frasco' ? 44 : 50} rx="5" fill={T} />
        <rect x="64" y="84" width="72" height="76" rx="16" fill={c} stroke="rgba(0,0,0,.12)" />
        <rect x="72" y="94" width="10" height="52" rx="5" fill="#fff" opacity=".35" />
        {tipo === 'frasco-gel' && <rect x="76" y="118" width="48" height="16" rx="3" fill="#fff" opacity=".8" />}
      </g>);
    case 'tubo':
      return (<g>
        <rect x="84" y="150" width="32" height="18" rx="3" fill={T} />
        <path d="M74 40 h52 l-8 110 h-36 z" fill={c} stroke="rgba(0,0,0,.12)" />
        <rect x="70" y="34" width="60" height="10" rx="2" fill="#d9cfcc" />
        <rect x="88" y="80" width="24" height="40" rx="3" fill="#fff" opacity=".7" />
      </g>);
    case 'tarro':
      return (<g>
        <rect x="58" y="70" width="84" height="18" rx="5" fill={T} />
        <rect x="62" y="88" width="76" height="66" rx="10" fill={c} stroke="rgba(0,0,0,.12)" />
        <rect x="70" y="96" width="9" height="48" rx="4" fill="#fff" opacity=".35" />
      </g>);
    case 'botella':
      return (<g>
        <rect x="90" y="30" width="20" height="26" rx="3" fill={T} />
        <path d="M84 56 h32 v14 q22 8 22 30 v54 q0 10 -10 10 h-56 q-10 0 -10 -10 v-54 q0 -22 22 -30 z" fill={c} opacity=".85" stroke="rgba(0,0,0,.12)" />
        <rect x="78" y="110" width="44" height="30" rx="3" fill="#fff" opacity=".75" />
      </g>);
    case 'gotero':
      return (<g>
        <ellipse cx="100" cy="34" rx="12" ry="10" fill={T} />
        <rect x="90" y="40" width="20" height="26" rx="3" fill="#b9a19a" />
        <rect x="76" y="66" width="48" height="90" rx="12" fill={c} opacity=".9" stroke="rgba(0,0,0,.12)" />
        <rect x="84" y="100" width="32" height="28" rx="3" fill="#fff" opacity=".7" />
      </g>);
    case 'crema':
      return (<g>
        <rect x="80" y="150" width="40" height="16" rx="4" fill={T} />
        <path d="M70 36 h60 l-6 114 h-48 z" fill={c} stroke="rgba(0,0,0,.12)" />
        <rect x="68" y="30" width="64" height="8" rx="2" fill="#d9cfcc" />
        <path d="M84 84 h32 M84 96 h24" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".85" />
      </g>);
    case 'lampara':
      return (<g>
        <path d="M40 140 q0 -70 60 -76 q60 6 60 76 z" fill="#F7F5F2" stroke="rgba(0,0,0,.15)" strokeWidth="2" />
        <path d="M62 140 q0 -46 38 -50 q38 4 38 50 z" fill="#E8E0F7" />
        <rect x="80" y="76" width="40" height="6" rx="3" fill="#B98CF0" />
        <rect x="36" y="140" width="128" height="10" rx="5" fill="#d9cfcc" />
        <circle cx="100" cy="104" r="4" fill="#8C1D4B" />
      </g>);
    case 'torno':
      return (<g>
        <rect x="36" y="110" width="70" height="46" rx="8" fill={c} stroke="rgba(0,0,0,.15)" />
        <circle cx="71" cy="133" r="12" fill={T} /><circle cx="71" cy="133" r="4" fill="#fff" />
        <rect x="110" y="56" width="14" height="70" rx="7" transform="rotate(35 117 91)" fill={M} />
        <rect x="143" y="34" width="4" height="22" transform="rotate(35 145 45)" fill={MO} />
        <path d="M106 128 q12 0 20 -16" fill="none" stroke={T} strokeWidth="3" />
      </g>);
    case 'broca':
      return (<g>
        {[70, 100, 130].map((x, i) => (<g key={x}>
          <rect x={x - 4} y="60" width="8" height="70" rx="2" fill={M} />
          <rect x={x - 9} y={36 + i * 4} width="18" height={26 - i * 4} rx="4" fill={i === 1 ? '#D4AF37' : MO} />
        </g>))}
        <rect x="52" y="128" width="96" height="26" rx="5" fill={T} />
      </g>);
    case 'alicate':
      return (<g fill="none" strokeLinecap="round">
        <path d="M100 96 L72 160 M100 96 L128 160" stroke={M} strokeWidth="10" />
        <path d="M100 96 q-14 -26 -6 -56 M100 96 q14 -26 6 -56" stroke={MO} strokeWidth="9" />
        <circle cx="100" cy="96" r="7" fill={T} />
        <path d="M80 128 q20 14 40 0" stroke={MO} strokeWidth="3" />
      </g>);
    case 'tijera':
      return (<g fill="none">
        <circle cx="76" cy="148" r="14" stroke={M} strokeWidth="7" /><circle cx="124" cy="148" r="14" stroke={M} strokeWidth="7" />
        <path d="M84 136 L114 44 M116 136 L86 44" stroke={MO} strokeWidth="7" strokeLinecap="round" />
        <circle cx="100" cy="90" r="5" fill={T} />
      </g>);
    case 'empujador':
      return (<g>
        <rect x="94" y="54" width="12" height="92" rx="6" fill={M} />
        <path d="M94 54 q6 -22 12 0 z" fill={MO} />
        <path d="M94 146 l6 20 l6 -20 z" fill={MO} />
        <rect x="94" y="84" width="12" height="32" fill="#c9cdd1" />
      </g>);
    case 'pincel':
      return (<g>
        {[[74, -12], [100, 0], [126, 12]].map(([x, r]) => (
          <g key={x} transform={`rotate(${r} ${x} 110)`}>
            <rect x={x - 4} y="70" width="8" height="90" rx="4" fill={c} />
            <rect x={x - 5} y="56" width="10" height="16" fill={M} />
            <path d={`M${x - 5} 56 q5 -26 10 0 z`} fill={T} />
          </g>))}
      </g>);
    case 'lima':
      return (<g>
        <rect x="92" y="30" width="16" height="140" rx="8" fill={c} transform="rotate(-20 100 100)" />
        <rect x="96" y="34" width="8" height="132" rx="4" fill="#fff" opacity=".18" transform="rotate(-20 100 100)" />
        <rect x="70" y="40" width="16" height="130" rx="8" fill="#E8B4BC" transform="rotate(14 78 105)" />
      </g>);
    case 'bloque':
      return (<g>
        <rect x="56" y="80" width="88" height="44" rx="6" fill={c} />
        <path d="M56 80 l14 -14 h88 l-14 14 z" fill="#fff" opacity=".7" />
        <path d="M144 80 l14 -14 v44 l-14 14 z" fill="rgba(0,0,0,.12)" />
      </g>);
    case 'tips':
      return (<g>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${58 + i * 18} 150 v-48 q0 -${28 + (i % 3) * 6} 8 -${36 + (i % 3) * 6} q8 ${8} 8 ${36 + (i % 3) * 6} v48 z`}
            fill={c} stroke="rgba(0,0,0,.15)" />))}
        <rect x="52" y="150" width="96" height="10" rx="3" fill="#d9cfcc" />
      </g>);
    case 'kit':
      return (<g>
        <rect x="44" y="76" width="112" height="78" rx="8" fill={c} />
        <rect x="44" y="64" width="112" height="20" rx="6" fill="#6E1539" />
        <path d="M100 64 v90" stroke="#D4AF37" strokeWidth="6" />
        <path d="M100 64 q-22 -26 -30 -6 q14 10 30 6 q16 4 30 -6 q-8 -20 -30 6" fill="#D4AF37" />
      </g>);
    case 'caja':
    default:
      return (<g>
        <rect x="52" y="70" width="96" height="84" rx="6" fill={c} />
        <path d="M52 70 l16 -16 h96 l-16 16 z" fill="#fff" opacity=".55" />
        <path d="M148 70 l16 -16 v84 l-16 16 z" fill="rgba(0,0,0,.12)" />
        <rect x="66" y="98" width="68" height="26" rx="3" fill="#fff" opacity=".8" />
      </g>);
  }
}

export default function ProductoImagen({ producto, className = '' }) {
  if (producto.imagen) return <Foto archivo={producto.imagen} alt={producto.nombre} className={className} />;
  return (
    <div className={`foto producto-ilustracion ${className}`} role="img" aria-label={producto.nombre}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <ellipse cx="100" cy="168" rx="62" ry="8" fill="rgba(34,22,28,.08)" />
        <Dibujo tipo={producto.tipo} c={producto.color || '#E8B4BC'} />
      </svg>
    </div>
  );
}
