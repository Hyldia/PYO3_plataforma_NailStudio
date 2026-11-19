// Número que sube poco a poco hasta su valor cuando se ve en pantalla.
import { useEffect, useRef, useState } from 'react';

// Número que cuenta desde 0 hasta su valor cuando aparece en pantalla
// Nombre: Contador
// Descripción: Muestra un número que sube contando.
// Entrada: El valor y el formato.
// Salida: El número animado.
// Objetivo: Que los datos llamen la atención.
export default function Contador({ valor, formato = (numero) => numero, duracion = 1200 }) {
  const [mostrado, setMostrado] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!valor) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setMostrado(valor); return undefined; }
    let raf; let inicio;
    // Nombre: animar
    // Descripción: Avanza la animación del número.
    // Entrada: El tiempo.
    // Salida: Nada.
    // Objetivo: Contar poco a poco.
    const animar = (texto) => {
      inicio ??= texto;
      const progreso = Math.min((texto - inicio) / duracion, 1);
      setMostrado(Math.round(valor * (1 - Math.pow(1 - progreso, 3))));
      if (progreso < 1) raf = requestAnimationFrame(animar);
    };
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { raf = requestAnimationFrame(animar); obs.disconnect(); } });
    if (ref.current) obs.observe(ref.current);
    return () => { cancelAnimationFrame(raf); obs.disconnect(); };
  }, [valor, duracion]);
  return (
    <span ref={ref}>
      <span aria-hidden="true">{formato(mostrado)}</span>
      <span className="solo-lector">{formato(valor)}</span>
    </span>
  );
}
