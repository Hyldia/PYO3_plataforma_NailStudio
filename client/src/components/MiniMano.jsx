import { una, pielDegradado } from '../lib/pintura.js';
import { PIELES } from '../lib/disenoBuilder.js';

const ALTOS = [62, 82, 92, 80];

export default function MiniMano({ diseno }) {
  const piel = PIELES[1];
  return (
    <div className="mini-mano" aria-hidden="true">
      {ALTOS.map((alto, i) => {
        const u = una({ ...diseno, largo: diseno.largo === 'Largo' ? 'Medio' : diseno.largo }, 24, diseno.acento && i === 1);
        return (
          <div key={i} className="dedo" style={{ width: 24, height: alto, background: pielDegradado(piel), borderRadius: '12px 12px 0 0 / 13px 13px 0 0' }}>
            <span className="una" style={{ position: 'absolute', ...u }} />
          </div>
        );
      })}
    </div>
  );
}
