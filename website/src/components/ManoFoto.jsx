import { Una, datosUna } from './MuestraUnas.jsx';
import { DEDOS } from '../lib/esmaltes.js';

// Probador sobre una foto real de una mano: las uñas originales se borraron de la foto
// y encima se dibuja cada uña del diseño en su dedo, con su forma, largo, color y acabado.
// Medidas en píxeles de la foto (750 x 937): base de la uña (cutícula), ancho y giro.
const ANCHO = 750;
const ALTO = 937;
const UNAS = [
  { x: 146, y: 516, w: 53, giro: -32 }, // pulgar
  { x: 272, y: 198, w: 52, giro: -4.5 }, // índice
  { x: 378, y: 129, w: 51, giro: 0 }, // medio
  { x: 506, y: 194, w: 51, giro: 0.6 }, // anular
  { x: 633, y: 326, w: 42, giro: 3.6 } // meñique
];

// Tonos de piel: se tiñe solo la mano (con una máscara), no el fondo
export const TONOS_FOTO = [
  { nombre: 'Clara', color: '#FFE9DE', modo: 'soft-light', fuerza: 0.6 },
  { nombre: 'Media clara', color: null },
  { nombre: 'Media', color: '#B9774F', modo: 'multiply', fuerza: 0.45 },
  { nombre: 'Morena', color: '#8A5232', modo: 'multiply', fuerza: 0.7 },
  { nombre: 'Oscura', color: '#5A321F', modo: 'multiply', fuerza: 0.85 }
];

export default function ManoFoto({ diseno, tono = TONOS_FOTO[1], seleccionada = null, onElegir }) {
  return (
    <div className="mano-foto">
      <img src="/img/mano.jpg" alt="" className="mano-foto__img" />
      {tono.color && <span className="mano-foto__tono" style={{ background: tono.color, mixBlendMode: tono.modo, opacity: tono.fuerza }} aria-hidden="true" />}
      {UNAS.map((u, i) => {
        const s = u.w / 44;
        const estilo = {
          left: `${((u.x - 30 * s) / ANCHO) * 100}%`,
          top: `${((u.y - 120 * s) / ALTO) * 100}%`,
          width: `${((60 * s) / ANCHO) * 100}%`,
          transform: `rotate(${u.giro}deg)`
        };
        const contenido = <Una d={datosUna(diseno, i)} />;
        return onElegir ? (
          <button key={DEDOS[i]} type="button" className={`mano-foto__una ${seleccionada === i ? 'mano-foto__una--activa' : ''}`} style={estilo}
                  onClick={() => onElegir(i)} aria-pressed={seleccionada === i} aria-label={`Uña del ${DEDOS[i].toLowerCase()}`}>
            {contenido}
          </button>
        ) : <span key={DEDOS[i]} className="mano-foto__una" style={estilo} aria-hidden="true">{contenido}</span>;
      })}
    </div>
  );
}
