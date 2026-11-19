// Adornos flotantes para las portadas de color: frascos de esmalte, destellos y corazones.
// Son decorativos (aria-hidden) y se quedan quietos si la persona pidió reducir movimiento.
// Nombre: Frasco
// Descripción: Dibuja un frasco de esmalte.
// Entrada: El color.
// Salida: El dibujo.
// Objetivo: Decorar las portadas.
const Frasco = ({ color }) => (
  <svg viewBox="0 0 40 60" width="100%" height="100%">
    <rect x="15" y="2" width="10" height="20" rx="3" fill="#2A1720" />
    <rect x="6" y="22" width="28" height="34" rx="9" fill={color} />
    <rect x="10" y="27" width="5" height="22" rx="2.5" fill="#fff" opacity=".45" />
  </svg>
);
// Nombre: Destello
// Descripción: Dibuja un destello.
// Entrada: Nada.
// Salida: El dibujo.
// Objetivo: Decorar las portadas.
const Destello = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 0c.8 6.4 2.8 9.6 12 12-9.2 2.4-11.2 5.6-12 12-.8-6.4-2.8-9.6-12-12C9.2 9.6 11.2 6.4 12 0z" fill="#FFE3EC" /></svg>
);
// Nombre: Corazon
// Descripción: Dibuja un corazón.
// Entrada: Nada.
// Salida: El dibujo.
// Objetivo: Decorar las portadas.
const Corazon = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z" fill="#F7A8C4" /></svg>
);

const ADORNOS = [
  { tipo: 'frasco', color: '#F7A8C4', x: '58%', y: '12%', t: 46, d: 0 },
  { tipo: 'destello', x: '48%', y: '70%', t: 22, d: 1.2 },
  { tipo: 'corazon', x: '92%', y: '14%', t: 26, d: 0.6 },
  { tipo: 'destello', x: '86%', y: '78%', t: 16, d: 2 },
  { tipo: 'frasco', color: '#FFD6E4', x: '96%', y: '52%', t: 34, d: 1.6 },
  { tipo: 'destello', x: '66%', y: '86%', t: 12, d: 0.3 },
  { tipo: 'corazon', x: '40%', y: '18%', t: 16, d: 2.4 }
];

// Nombre: Decoracion
// Descripción: Pone adornos animados de fondo.
// Entrada: Nada.
// Salida: Los adornos.
// Objetivo: Que las portadas se vean bonitas.
export default function Decoracion() {
  return (
    <div className="adornos" aria-hidden="true">
      {ADORNOS.map((adorno, i) => (
        <span key={i} className={`adorno adorno--${adorno.tipo}`} style={{ left: adorno.x, top: adorno.y, width: adorno.t, height: adorno.tipo === 'frasco' ? adorno.t * 1.5 : adorno.t, '--d': `${adorno.d}s` }}>
          {adorno.tipo === 'frasco' ? <Frasco color={adorno.color} /> : adorno.tipo === 'destello' ? <Destello /> : <Corazon />}
        </span>
      ))}
    </div>
  );
}
