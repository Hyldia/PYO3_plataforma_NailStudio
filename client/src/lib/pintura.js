// Convierte un diseño en estilos CSS para dibujar dedos y uñas realistas.
import { hexDe } from './disenoBuilder.js';

const CURVA = 'linear-gradient(90deg, rgba(0,0,0,0.16), rgba(0,0,0,0) 24%, rgba(0,0,0,0) 76%, rgba(0,0,0,0.16))';
const CURVA_MATE = 'linear-gradient(90deg, rgba(0,0,0,0.09), rgba(0,0,0,0) 24%, rgba(0,0,0,0) 76%, rgba(0,0,0,0.09))';
const BRILLO = 'linear-gradient(90deg, rgba(255,255,255,0) 17%, rgba(255,255,255,0.62) 26%, rgba(255,255,255,0.14) 34%, rgba(255,255,255,0) 41%)';
const ACABADOS = {
  Brillante: [BRILLO],
  Mate: [],
  Chrome: ['linear-gradient(90deg, rgba(0,0,0,0.28), rgba(255,255,255,0.9) 30%, rgba(255,255,255,0) 52%, rgba(255,255,255,0.55) 78%, rgba(0,0,0,0.22))'],
  Glitter: [BRILLO,
    'radial-gradient(rgba(255,255,255,0.95) 0.8px, transparent 1.4px) 0 0 / 5px 5px',
    'radial-gradient(rgba(255,226,170,0.9) 0.8px, transparent 1.4px) 2px 3px / 7px 7px']
};
const LIBRE = { Corto: 3, Medio: 15, Largo: 30 };

export const SOMBRA_UNA = 'inset 2px 0 3px rgba(0,0,0,0.16), inset -2px 0 3px rgba(0,0,0,0.16), inset 0 -2px 2px rgba(0,0,0,0.12), 0 1px 1.5px rgba(40,20,20,0.3)';

function decoracion(tipo, libre, punta) {
  if (tipo === 'Francesa') { const x = Math.max(libre, 6) + 5; return `linear-gradient(180deg, ${punta} 0 ${x}px, transparent ${x}px)`; }
  if (tipo === 'Puntos') return `radial-gradient(circle, ${punta} 0 2.2px, transparent 2.7px) 3px 4px / 11px 11px`;
  if (tipo === 'Flor') return `radial-gradient(circle at 50% 58%, #F2C14E 0 2.5px, ${punta} 2.5px 7px, transparent 7.5px)`;
  if (tipo === 'Piedras') return 'radial-gradient(circle at 50% 70%, #FFFFFF 0 2.6px, #BFD4EE 2.6px 3.6px, transparent 4px), radial-gradient(circle at 50% 52%, #FFFFFF 0 1.8px, transparent 2.3px)';
  return '';
}

function pintura(d, acabado, deco, libre) {
  const hex = hexDe(d.color);
  const punta = d.color === 'Blanco' ? '#F7C6D9' : '#FFFFFF';
  return [...ACABADOS[acabado], decoracion(deco, libre, punta), acabado === 'Mate' ? CURVA_MATE : CURVA]
    .filter(Boolean).concat(hex).join(', ');
}

// Devuelve las medidas y estilos de una uña para un dedo de ancho `ancho`
export function una(d, ancho, esAcento = false) {
  const nw = ancho - 12;
  const libre = Math.round(LIBRE[d.largo] * ancho / 40);
  const lecho = Math.round(nw * 1.18);
  const h = Math.round(nw / 2);
  const tv = {
    Almendra: libre + Math.round(nw * 0.62),
    Ovalada: Math.round(nw * 0.5) + Math.round(libre * 0.4),
    Stiletto: libre + nw,
    Cuadrada: 5
  }[d.forma];
  const th = d.forma === 'Cuadrada' ? 5 : h;
  const bv = Math.round(nw * 0.45);
  return {
    left: 6, top: 5 - libre, width: nw, height: libre + lecho,
    borderRadius: `${th}px ${th}px ${h}px ${h}px / ${tv}px ${tv}px ${bv}px ${bv}px`,
    background: esAcento ? pintura(d, 'Glitter', 'Piedras', libre) : pintura(d, d.acabado, d.decoracion, libre),
    boxShadow: SOMBRA_UNA
  };
}

export function pielDegradado(p) {
  return `linear-gradient(90deg, ${p.sombra} 0%, ${p.hex} 22%, ${p.luz} 50%, ${p.hex} 78%, ${p.sombra} 100%)`;
}
