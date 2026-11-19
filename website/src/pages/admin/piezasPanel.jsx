// Piezas compartidas del panel: ventana del mensaje de WhatsApp, subir foto y campos.
import { useState } from 'react';

export const DIAS_SEMANA = [['1', 'Lun'], ['2', 'Mar'], ['3', 'Mié'], ['4', 'Jue'], ['5', 'Vie'], ['6', 'Sáb'], ['7', 'Dom']];
export const HORAS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:30', '14:30', '15:30', '16:30', '17:30', '18:30'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
// Nombre: fechaLarga
// Descripción: Escribe una fecha larga.
// Entrada: La fecha.
// Salida: El texto.
// Objetivo: Leer fácil.
export const fechaLarga = (f) => { const fecha = new Date(`${f}T12:00:00`); return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`; };
// Nombre: nombreMes
// Descripción: Escribe el nombre del mes.
// Entrada: El mes.
// Salida: El texto.
// Objetivo: Leer fácil.
export const nombreMes = (mes) => { const [anio, numeroMes] = mes.split('-').map(Number); return `${MESES[numeroMes - 1]} ${anio}`; };
// Nombre: isoLocal
// Descripción: Convierte una fecha a texto año-mes-día.
// Entrada: La fecha.
// Salida: El texto.
// Objetivo: Trabajar con fechas.
export const isoLocal = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

// Nombre: Whats
// Descripción: Dibuja el ícono de WhatsApp.
// Entrada: Nada.
// Salida: El ícono.
// Objetivo: Botones de mensaje.
const Whats = () => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3z" /></svg>;
export { Whats };

// Un mensaje listo para enviar: se puede retocar el texto antes de abrir WhatsApp
// Nombre: TarjetaMensaje
// Descripción: Muestra un mensaje listo para WhatsApp.
// Entrada: El mensaje y qué hacer al enviar.
// Salida: La tarjeta.
// Objetivo: Enviar avisos.
export function TarjetaMensaje({ mensaje, nombre, onEnviado }) {
  const [texto, setTexto] = useState(mensaje.texto);
  const [enviado, setEnviado] = useState(false);
  const numero = (mensaje.enlace.match(/wa\.me\/(\d+)/) || [])[1] || '';
  const enlace = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  return (
    <div className={`msj ${enviado ? 'msj--enviado' : ''}`}>
      <div className="msj__cabeza">
        <span className="msj__avatar" aria-hidden="true">{(nombre || '?')[0]}</span>
        <div><strong>{nombre}</strong><span className="tenue">{mensaje.telefono} · {mensaje.titulo}</span></div>
        {enviado && <span className="msj__ok">✓ Abierto en WhatsApp</span>}
      </div>
      <label className="solo-lector" htmlFor={`msj-${mensaje.telefono}-${mensaje.tipo}`}>Texto del mensaje para {nombre}</label>
      <textarea id={`msj-${mensaje.telefono}-${mensaje.tipo}`} className="msj__texto" rows={Math.min(12, texto.split('\n').length + 2)} value={texto} onChange={(evento) => setTexto(evento.target.value)} />
      <a className="boton-whatsapp" href={enlace} target="_blank" rel="noreferrer" onClick={() => { setEnviado(true); onEnviado?.(); }}>
        <Whats /> {enviado ? 'Abrir de nuevo' : 'Enviar por WhatsApp'}
      </a>
    </div>
  );
}

// Zona para elegir o arrastrar imágenes, con vista previa
// Nombre: ZonaFotos
// Descripción: Muestra la zona para soltar fotos.
// Entrada: Archivos y opciones.
// Salida: La zona.
// Objetivo: Subir fotos fácil.
export function ZonaFotos({ archivos, onCambio, multiple = true, id = 'zona-fotos', texto }) {
  const [encima, setEncima] = useState(false);
  // Nombre: tomar
  // Descripción: Toma solo las imágenes válidas.
  // Entrada: La lista de archivos.
  // Salida: Nada.
  // Objetivo: No subir otros archivos.
  const tomar = (lista) => onCambio([...lista].filter((elemento) => /^image\/(jpeg|png|webp)$/.test(elemento.type)).slice(0, multiple ? 20 : 1));
  return (
    <div className={`zona-fotos ${encima ? 'zona-fotos--encima' : ''} ${archivos.length ? 'zona-fotos--llena' : ''}`}
         onDragOver={(evento) => { evento.preventDefault(); setEncima(true); }} onDragLeave={() => setEncima(false)}
         onDrop={(evento) => { evento.preventDefault(); setEncima(false); tomar(evento.dataTransfer.files); }}>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} className="solo-lector" onChange={(evento) => tomar(evento.target.files)} />
      {archivos.length === 0 ? (
        <label htmlFor={id} className="zona-fotos__vacia">
          <span className="zona-fotos__icono" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-8 8" /></svg>
          </span>
          <strong>{texto || 'Arrastra tus fotos aquí'}</strong>
          <span>o <u>búscalas en tu computadora</u> · JPG, PNG o WebP, hasta 8 MB</span>
        </label>
      ) : (
        <div className="zona-fotos__previas">
          {archivos.map((archivo, i) => (
            <figure key={`${archivo.name}-${i}`} style={{ '--n': i }}>
              <img src={URL.createObjectURL(archivo)} alt="" />
              <button type="button" onClick={() => onCambio(archivos.filter((_, campo) => campo !== i))} aria-label={`Quitar ${archivo.name}`}>×</button>
            </figure>
          ))}
          {multiple && <label htmlFor={id} className="zona-fotos__mas"><span aria-hidden="true">+</span>Agregar</label>}
        </div>
      )}
    </div>
  );
}

// Botón "Cambiar foto" que abre el selector de archivos
// Nombre: BotonFoto
// Descripción: Muestra un botón para elegir foto.
// Entrada: Qué hacer y el texto.
// Salida: El botón.
// Objetivo: Cambiar fotos.
export function BotonFoto({ onArchivo, texto = 'Cambiar foto', etiqueta, clase = 'boton boton--contorno boton--chico' }) {
  return (
    <label className={`${clase} subir`}>
      {texto}{etiqueta && <span className="solo-lector"> {etiqueta}</span>}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(evento) => { if (evento.target.files[0]) onArchivo(evento.target.files[0]); evento.target.value = ''; }} />
    </label>
  );
}

// Nombre: formData
// Descripción: Prepara una foto para enviarla.
// Entrada: El archivo.
// Salida: El paquete para enviar.
// Objetivo: Subir fotos.
export const formData = (archivo) => { const fd = new FormData(); fd.append('imagen', archivo); return fd; };
