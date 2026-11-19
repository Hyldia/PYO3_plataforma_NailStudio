// Animaciones al bajar por la página: las piezas aparecen suavemente cuando entran a la pantalla.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Hace aparecer suavemente tarjetas y secciones cuando entran en la pantalla.
// Usa IntersectionObserver (para saber cuándo se ven) y MutationObserver (para el contenido
// que llega después desde la API). Si la persona pidió "reducir movimiento", no anima nada.
//
// Importante: nada se queda escondido. Antes, al cambiar de página, React reutilizaba
// tarjetas que ya estaban marcadas para animarse pero nadie las observaba, y se quedaban
// invisibles hasta recargar. Ahora: se vuelven a observar, al salir de la página se muestran
// todas, y por si acaso a los 2 segundos se muestra cualquier cosa que siga escondida.
const SELECTOR = '.tarjeta-producto, .servicio, .cupon, .mosaico > li, .bloque-ofertas__cabeza, .confianza, .categoria-circulo, .pasos li, .servicios-ayuda, .caja, .tarjeta-diseno';
// Nombre: mostrar
// Descripción: Hace aparecer un elemento.
// Entrada: El elemento.
// Salida: Nada.
// Objetivo: Animar al bajar en la página.
const mostrar = (el) => el.classList.add('aparece--visible');
// Nombre: mostrarTodo
// Descripción: Muestra todo lo que falta aparecer.
// Entrada: Nada.
// Salida: Nada.
// Objetivo: No dejar cosas escondidas.
const mostrarTodo = () => document.querySelectorAll('.aparece:not(.aparece--visible)').forEach(mostrar);

// Nombre: Animaciones
// Descripción: Activa las animaciones al bajar.
// Entrada: Nada.
// Salida: Nada.
// Objetivo: Que la página se vea viva.
export default function Animaciones() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return undefined;

    const visto = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) { mostrar(entrada.target); visto.unobserve(entrada.target); }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.01 });

    // Nombre: preparar
    // Descripción: Prepara los elementos para animarlos.
    // Entrada: La parte de la página.
    // Salida: Nada.
    // Objetivo: Animar lo nuevo.
    const preparar = (raiz) => {
      raiz.querySelectorAll?.(SELECTOR).forEach((el) => {
        if (el.classList.contains('aparece--visible')) return;
        if (!el.classList.contains('aparece')) {
          // Retraso escalonado según la posición dentro de su lista
          const i = el.parentElement ? [...el.parentElement.children].indexOf(el) % 6 : 0;
          el.style.setProperty('--retraso', `${i * 70}ms`);
          el.classList.add('aparece');
        }
        visto.observe(el);
      });
    };

    const main = document.getElementById('contenido');
    preparar(main);
    const cambios = new MutationObserver((ms) => ms.forEach((cambio) => cambio.addedNodes.forEach((nodo) => nodo.nodeType === 1 && preparar(nodo.parentElement || nodo))));
    cambios.observe(main, { childList: true, subtree: true });

    // Red de seguridad: lo que esté en pantalla y siga escondido se muestra igual
    const reloj = setInterval(() => {
      document.querySelectorAll('.aparece:not(.aparece--visible)').forEach((el) => {
        const caja = el.getBoundingClientRect();
        if (caja.top < innerHeight && caja.bottom > 0) mostrar(el);
      });
    }, 1500);

    return () => { visto.disconnect(); cambios.disconnect(); clearInterval(reloj); mostrarTodo(); };
  }, [pathname]);

  return null;
}
