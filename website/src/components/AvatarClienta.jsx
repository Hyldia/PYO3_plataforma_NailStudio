// Foto de la clienta: la de su cuenta (por ejemplo, la de Google) o, en los datos de ejemplo,
// una foto de Unsplash (npm run fotos-clientas). Si no tiene foto, se muestran sus iniciales
// sobre un color suave que siempre es el mismo para esa clienta.
import { useState } from 'react';
import { urlFoto } from '../config.js';

const FONDOS = [['#FDE2EA', '#8C1D4B'], ['#E5ECFB', '#1F4F8A'], ['#FFF0D6', '#7A4B00'], ['#DDF4EA', '#1F6B45'], ['#F1E4FF', '#5A3A9A'], ['#FFE3DA', '#9A3B1F']];

// Nombre: numero
// Descripción: Convierte un nombre en un número.
// Entrada: El texto.
// Salida: Un número.
// Objetivo: Dar siempre el mismo color a cada clienta.
function numero(texto) {
  let hash = 2166136261;
  for (const letra of String(texto)) hash = Math.imul(hash ^ letra.charCodeAt(0), 16777619);
  return Math.abs(hash);
}
// Nombre: iniciales
// Descripción: Saca las iniciales de un nombre.
// Entrada: El nombre.
// Salida: Las iniciales.
// Objetivo: Mostrarlas si no hay foto.
const iniciales = (nombre) => String(nombre).trim().split(/\s+/).slice(0, 2).map((parte) => parte[0] || '').join('').toUpperCase();

// Nombre: AvatarClienta
// Descripción: Muestra la foto o las iniciales de una clienta.
// Entrada: Nombre, foto y tamaño.
// Salida: El círculo con la foto.
// Objetivo: Reconocer a cada clienta.
export default function AvatarClienta({ nombre = '', foto = null, tam = 48 }) {
  const [fallo, setFallo] = useState(false);
  const src = foto && !fallo ? (String(foto).startsWith('http') ? foto : urlFoto(foto)) : null;
  const [fondo, tinta] = FONDOS[numero(nombre) % FONDOS.length];
  return (
    <span className="avatar-clienta" style={{ width: tam, height: tam, background: fondo, color: tinta, fontSize: tam * 0.38 }}>
      {src ? <img src={src} alt="" width={tam} height={tam} loading="lazy" onError={() => setFallo(true)} referrerPolicy="no-referrer" /> : <span aria-hidden="true">{iniciales(nombre)}</span>}
    </span>
  );
}
