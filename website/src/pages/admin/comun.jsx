// Piezas compartidas del panel del salón
import { useState } from 'react';
import { api } from '../../lib/api.js';

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const nombreMes = (mes) => { const [a, m] = mes.split('-').map(Number); return `${MESES[m - 1]} ${a}`; };
export const fechaLarga = (f) => { const d = new Date(`${f}T12:00:00`); return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`; };
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const hoyISO = () => iso(new Date());

export const IconoWhatsApp = ({ tam = 18 }) => (
  <svg aria-hidden="true" width={tam} height={tam} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z" /></svg>
);

// Burbuja tipo WhatsApp con el mensaje y el botón para abrirlo en WhatsApp
export function BurbujaWhatsApp({ mensaje, id, nombre, onEnviado }) {
  const [enviado, setEnviado] = useState(false);
  if (!mensaje) return null;
  return (
    <div className={`wa ${enviado ? 'wa--enviado' : ''}`}>
      <div className="wa__cabeza"><span className="wa__avatar" aria-hidden="true">{(nombre || '?')[0]}</span><div><strong>{nombre}</strong><small>{mensaje.telefono}</small></div></div>
      <div className="wa__fondo"><p className="wa__burbuja">{mensaje.texto}<span className="wa__hora">{enviado ? '✓✓' : '✓'}</span></p></div>
      <a className="wa__boton" href={mensaje.enlace} target="_blank" rel="noreferrer"
         onClick={() => { setEnviado(true); if (id) api.admin.mensajeEnviado(id); onEnviado?.(); }}>
        <IconoWhatsApp /> {enviado ? 'Abierto en WhatsApp ✓' : 'Enviar por WhatsApp'}
      </a>
    </div>
  );
}

// Zona para soltar o elegir imágenes, con vista previa
export function ZonaImagen({ archivos, onCambio, multiple = false, texto = 'Arrastra las fotos aquí', actual = null }) {
  const [encima, setEncima] = useState(false);
  const tomar = (lista) => {
    const ok = [...lista].filter((f) => /image\/(jpeg|png|webp)/.test(f.type));
    if (ok.length) onCambio(multiple ? [...archivos, ...ok] : ok.slice(0, 1));
  };
  const vistas = archivos.map((f) => ({ f, url: URL.createObjectURL(f) }));
  return (
    <div className={`zona ${encima ? 'zona--encima' : ''} ${archivos.length ? 'zona--llena' : ''}`}
         onDragOver={(e) => { e.preventDefault(); setEncima(true); }} onDragLeave={() => setEncima(false)}
         onDrop={(e) => { e.preventDefault(); setEncima(false); tomar(e.dataTransfer.files); }}>
      {archivos.length === 0 ? (
        <label className="zona__vacia">
          {actual ? <img src={actual} alt="" className="zona__actual" /> : (
            <span className="zona__icono" aria-hidden="true"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /><path d="M17 2v5M14.5 4.5h5" /></svg></span>
          )}
          <strong>{actual ? 'Toca para cambiar la foto' : texto}</strong>
          <span>{actual ? 'o arrastra una nueva aquí' : 'o toca para elegir · JPG, PNG o WebP, hasta 8 MB'}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} onChange={(e) => tomar(e.target.files)} />
        </label>
      ) : (
        <ul className="zona__lista">
          {vistas.map(({ f, url }, i) => (
            <li key={`${f.name}-${i}`} style={{ '--n': i }}>
              <img src={url} alt="" onLoad={() => URL.revokeObjectURL(url)} />
              <button type="button" aria-label={`Quitar ${f.name}`} onClick={() => onCambio(archivos.filter((_, k) => k !== i))}>×</button>
              <span>{f.name}</span>
            </li>
          ))}
          {multiple && (
            <li className="zona__mas"><label>+<span>Agregar</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => tomar(e.target.files)} /></label></li>
          )}
        </ul>
      )}
    </div>
  );
}

export function Tarjetas({ datos }) {
  return (
    <ul className="admin-stats">
      {datos.map(([titulo, valor, nota, tono], i) => (
        <li key={titulo} className={`admin-stats__item admin-stats__item--${tono || 'vino'}`} style={{ '--n': i }}>
          <span>{titulo}</span><strong>{valor}</strong>{nota && <small>{nota}</small>}
        </li>
      ))}
    </ul>
  );
}
