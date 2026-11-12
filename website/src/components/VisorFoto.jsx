import { useEffect, useRef } from 'react';
import { urlFoto } from '../config.js';
import { api } from '../lib/api.js';

// Visor a pantalla completa: Esc cierra, flechas cambian de foto
export default function VisorFoto({ fotos, indice, onCambiar, onCerrar, onReservar }) {
  const dialogo = useRef(null);
  const foto = fotos[indice];

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
    return () => d?.open && d.close();
  }, []);

  useEffect(() => { if (foto) api.vistaFoto(foto.id); }, [foto?.id]);

  const teclas = (e) => {
    if (e.key === 'ArrowRight') onCambiar((indice + 1) % fotos.length);
    if (e.key === 'ArrowLeft') onCambiar((indice - 1 + fotos.length) % fotos.length);
  };

  if (!foto) return null;
  const detalles = [foto.categoria, foto.forma, foto.color, foto.acabado].filter(Boolean);

  return (
    <dialog ref={dialogo} className="visor" onClose={onCerrar} onKeyDown={teclas} aria-labelledby="visor-titulo"
            onClick={(e) => { if (e.target === dialogo.current) dialogo.current.close(); }}>
      <div className="visor__cuerpo">
        <div className="visor__imagen">
          <img src={urlFoto(foto.archivo)} alt={foto.descripcion || foto.titulo} />
          {fotos.length > 1 && (
            <>
              <button type="button" className="visor__flecha visor__flecha--izq" onClick={() => onCambiar((indice - 1 + fotos.length) % fotos.length)} aria-label="Foto anterior">
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button type="button" className="visor__flecha visor__flecha--der" onClick={() => onCambiar((indice + 1) % fotos.length)} aria-label="Foto siguiente">
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </>
          )}
        </div>
        <div className="visor__info">
          <p className="tenue">{indice + 1} de {fotos.length}</p>
          <h2 id="visor-titulo">{foto.titulo}</h2>
          {foto.descripcion && <p>{foto.descripcion}</p>}
          <ul className="etiquetas">{detalles.map((d) => <li key={d}>{d}</li>)}</ul>
          <button type="button" className="boton" onClick={() => onReservar(foto)}>Quiero este diseño</button>
          <button type="button" className="enlace enlace--boton" onClick={() => onReservar(foto, '/disena')}>Personalizarlo antes de reservar</button>
        </div>
        <button type="button" className="visor__cerrar" onClick={() => dialogo.current.close()} aria-label="Cerrar">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>
    </dialog>
  );
}
