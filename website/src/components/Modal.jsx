import { useEffect, useRef } from 'react';

// Ventana emergente accesible con <dialog>: cierra con Escape, con la X o tocando afuera
// Nombre: Modal
// Descripción: Muestra una ventana encima de la página.
// Entrada: Título, contenido y tamaño.
// Salida: La ventana.
// Objetivo: Mostrar avisos y formularios.
export default function Modal({ titulo, onCerrar, children, ancho = false, ocultarTitulo = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d.open) d.showModal();
    document.body.classList.add('con-modal');
    return () => document.body.classList.remove('con-modal');
  }, []);
  return (
    <dialog ref={ref} className={`modal ${ancho ? 'modal--ancho' : ''}`} aria-label={titulo} onClose={onCerrar}
            onClick={(evento) => { if (evento.target === ref.current) onCerrar(); }}>
      <div className="modal__cuerpo">
        <div className="modal__cabeza">
          <h2 className={ocultarTitulo ? 'solo-lector' : ''}>{titulo}</h2>
          <button type="button" className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
