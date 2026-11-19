// Cuenta regresiva (horas, minutos y segundos) hasta la medianoche, para las ofertas del día.
import { useEffect, useState } from 'react';

// Cuenta regresiva hasta la medianoche: las "ofertas del día" se renuevan cada día
// Nombre: restante
// Descripción: Calcula cuánto falta para la medianoche.
// Entrada: Nada.
// Salida: Horas, minutos y segundos.
// Objetivo: Cuenta de ofertas del día.
function restante() {
  const ahora = new Date();
  const fin = new Date(ahora); fin.setHours(24, 0, 0, 0);
  const segundos = Math.max(0, Math.floor((fin - ahora) / 1000));
  return [Math.floor(segundos / 3600), Math.floor((segundos % 3600) / 60), segundos % 60];
}

// Nombre: CuentaRegresiva
// Descripción: Muestra la cuenta regresiva.
// Entrada: Estilo claro o compacto.
// Salida: El reloj.
// Objetivo: Dar urgencia a las ofertas.
export default function CuentaRegresiva({ claro = false, compacta = false }) {
  const [restantes, setRestantes] = useState(restante);
  useEffect(() => { const id = setInterval(() => setRestantes(restante()), 1000); return () => clearInterval(id); }, []);
  // Nombre: dos
  // Descripción: Pone dos dígitos.
  // Entrada: El número.
  // Salida: El texto (05).
  // Objetivo: Que el reloj se vea parejo.
  const dos = (numero) => String(numero).padStart(2, '0');
  if (compacta) return <span className="cuenta-compacta" aria-hidden="true">{dos(restantes[0])}:{dos(restantes[1])}:{dos(restantes[2])}</span>;
  return (
    <p className={`cuenta-regresiva ${claro ? 'cuenta-regresiva--claro' : ''}`}>
      <span>Termina en</span>
      {/* Para lectores de pantalla se anuncia una vez, no cada segundo */}
      <span aria-hidden="true" className="cuenta-regresiva__digitos">
        <b>{dos(restantes[0])}</b>:<b>{dos(restantes[1])}</b>:<b key={restantes[2]} className="tic">{dos(restantes[2])}</b>
      </span>
      <span className="solo-lector">{restantes[0]} horas y {restantes[1]} minutos</span>
    </p>
  );
}
