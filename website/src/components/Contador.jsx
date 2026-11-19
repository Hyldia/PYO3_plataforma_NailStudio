import { useEffect, useRef, useState } from 'react';

// Número que cuenta desde 0 hasta su valor cuando aparece en pantalla
// Nombre: Contador
// Descripción: Muestra un número que sube contando.
// Entrada: El valor y el formato.
// Salida: El número animado.
// Objetivo: Que los datos llamen la atención.
export default function Contador({ valor, formato = (n) => n, duracion = 1200 }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!valor) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(valor); return undefined; }
    let raf; let inicio;
    // Nombre: animar
    // Descripción: Avanza la animación del número.
    // Entrada: El tiempo.
    // Salida: Nada.
    // Objetivo: Contar poco a poco.
    const animar = (t) => {
      inicio ??= t;
      const p = Math.min((t - inicio) / duracion, 1);
      setN(Math.round(valor * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(animar);
    };
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { raf = requestAnimationFrame(animar); obs.disconnect(); } });
    if (ref.current) obs.observe(ref.current);
    return () => { cancelAnimationFrame(raf); obs.disconnect(); };
  }, [valor, duracion]);
  return (
    <span ref={ref}>
      <span aria-hidden="true">{formato(n)}</span>
      <span className="solo-lector">{formato(valor)}</span>
    </span>
  );
}
