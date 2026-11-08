import { useState } from 'react';
import { urlFoto } from '../config.js';

// Imagen con carga diferida y un fondo neutro mientras carga o si falta el archivo
export default function Foto({ archivo, alt, className = '', prioridad = false }) {
  const [error, setError] = useState(false);
  const src = urlFoto(archivo);
  return (
    <div className={`foto ${className}`}>
      {src && !error ? (
        <img src={src} alt={alt} loading={prioridad ? 'eager' : 'lazy'} decoding="async" onError={() => setError(true)} />
      ) : (
        <div className="foto__vacia" role="img" aria-label={alt || 'Imagen no disponible'}>
          <svg aria-hidden="true" width="28" height="36" viewBox="0 0 40 52"><path d="M10 48V24c0-9 5-17 10-21 5 4 10 12 10 21v24c0 4-20 4-20 0z" fill="currentColor" /></svg>
        </div>
      )}
    </div>
  );
}
