import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Hace aparecer suavemente tarjetas y secciones cuando entran en la pantalla.
// Usa IntersectionObserver (para saber cuándo se ven) y MutationObserver (para el contenido
// que llega después desde la API). Si la persona pidió "reducir movimiento", no anima nada.
const SELECTOR = '.tarjeta-producto, .servicio, .cupon, .mosaico > li, .bloque-ofertas__cabeza, .confianza, .categoria-circulo, .pasos li, .servicios-ayuda, .caja';

export default function Animaciones() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return undefined;

    const visto = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('aparece--visible'); visto.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });

    const preparar = (raiz) => {
      raiz.querySelectorAll?.(SELECTOR).forEach((el) => {
        if (el.classList.contains('aparece')) return;
        // Retraso escalonado según la posición dentro de su lista
        const i = el.parentElement ? [...el.parentElement.children].indexOf(el) % 6 : 0;
        el.style.setProperty('--retraso', `${i * 70}ms`);
        el.classList.add('aparece');
        visto.observe(el);
      });
    };

    const main = document.getElementById('contenido');
    preparar(main);
    const cambios = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && preparar(n.parentElement || n))));
    cambios.observe(main, { childList: true, subtree: true });
    return () => { visto.disconnect(); cambios.disconnect(); };
  }, [pathname]);

  return null;
}
