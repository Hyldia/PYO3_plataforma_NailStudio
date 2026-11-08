import { una, pielDegradado } from '../lib/pintura.js';
import { describir } from '../lib/disenoBuilder.js';

// Meñique, anular, medio, índice (ancho y alto en px)
const DEDOS = [[34, 120], [40, 168], [42, 188], [40, 166]];

function Dedo({ ancho, alto, piel, estiloUna, pliegues = 2 }) {
  return (
    <div className="dedo" style={{
      width: ancho, height: alto, background: pielDegradado(piel),
      borderRadius: `${ancho / 2}px ${ancho / 2}px 0 0 / ${Math.round(ancho * 0.55)}px ${Math.round(ancho * 0.55)}px 0 0`
    }}>
      <span className="pliegue" style={{ top: Math.round(alto * 0.45) }} />
      {pliegues > 1 && <span className="pliegue pliegue--bajo" style={{ top: Math.round(alto * 0.7) }} />}
      <span className="una" style={{ position: 'absolute', ...estiloUna }} />
    </div>
  );
}

export default function Mano({ diseno, piel }) {
  const nudillo = (x) => `radial-gradient(ellipse 15px 9px at ${x}px 16px, ${piel.luz}, transparent)`;
  const dorso = [25, 65, 109, 153].map(nudillo).concat(`linear-gradient(180deg, ${piel.hex}, ${piel.sombra})`).join(', ');

  return (
    <div className="mano-escena" role="img" aria-label={`Vista previa: ${describir(diseno)}`}>
      <div className="mano" aria-hidden="true">
        <div className="mano__dedos">
          {DEDOS.map(([w, h], i) => (
            <Dedo key={i} ancho={w} alto={h} piel={piel} estiloUna={una(diseno, w, diseno.acento && i === 1)} />
          ))}
        </div>
        <div className="mano__dorso" style={{ background: dorso }} />
        <div className="mano__pulgar">
          <Dedo ancho={46} alto={112} piel={piel} estiloUna={una(diseno, 46)} pliegues={1} />
        </div>
      </div>
    </div>
  );
}
