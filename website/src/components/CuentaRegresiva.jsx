import { useEffect, useState } from 'react';

// Cuenta regresiva hasta la medianoche: las "ofertas del día" se renuevan cada día
function restante() {
  const ahora = new Date();
  const fin = new Date(ahora); fin.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((fin - ahora) / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
}

export default function CuentaRegresiva({ claro = false, compacta = false }) {
  const [t, setT] = useState(restante);
  useEffect(() => { const id = setInterval(() => setT(restante()), 1000); return () => clearInterval(id); }, []);
  const dos = (n) => String(n).padStart(2, '0');
  if (compacta) return <span className="cuenta-compacta" aria-hidden="true">{dos(t[0])}:{dos(t[1])}:{dos(t[2])}</span>;
  return (
    <p className={`cuenta-regresiva ${claro ? 'cuenta-regresiva--claro' : ''}`}>
      <span>Termina en</span>
      {/* Para lectores de pantalla se anuncia una vez, no cada segundo */}
      <span aria-hidden="true" className="cuenta-regresiva__digitos">
        <b>{dos(t[0])}</b>:<b>{dos(t[1])}</b>:<b key={t[2]} className="tic">{dos(t[2])}</b>
      </span>
      <span className="solo-lector">{t[0]} horas y {t[1]} minutos</span>
    </p>
  );
}
