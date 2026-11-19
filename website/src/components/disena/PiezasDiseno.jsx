// Piezas visuales del diseñador de uñas: íconos, contorno de cada forma, caja de paso numerado,
// botones de opciones y muestrario de esmaltes. Cada pieza hace una sola cosa (Responsabilidad única).
import { useState } from 'react';
import { ESMALTES, FAMILIAS_ESMALTE, esmalte } from '../../lib/esmaltes.js';
import { dinero } from '../../config.js';

// Los 16 colores que se ven primero (los favoritos del salón)
const COLORES_DESTACADOS = ['AH-038', 'AH-190', 'AH-005', 'AH-028', 'AH-037', 'AH-068', 'AH-042', 'AH-174', 'AH-004', 'AH-227', 'AH-148', 'AH-043', 'AH-123', 'AH-091', 'AH-081', 'AH-241'];

// Nombre: masPrecio
// Descripción: Escribe el costo extra de una opción.
// Entrada: El monto.
// Salida: "+₡500" o "Incluido".
// Objetivo: Mostrar precios claros.
export const masPrecio = (monto) => (monto ? `+${dinero(monto)}` : 'Incluido');

// Nombre: IconoDecoracion
// Descripción: Dibuja el ícono de una decoración.
// Entrada: El tipo de decoración.
// Salida: El dibujo.
// Objetivo: Reconocer cada decoración rápido.
export function IconoDecoracion({ tipo }) {
  const trazo = { 'aria-hidden': true, width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (tipo === 'Perlas') return <svg {...trazo}><circle cx="8" cy="9" r="4" /><circle cx="16.5" cy="14.5" r="3.5" /><circle cx="9" cy="18" r="2" /><path d="M6.5 7.5a2 2 0 0 1 2-1" /></svg>;
  if (tipo === 'Cristales') return <svg {...trazo}><path d="M7 4h10l4 5-9 11L3 9z" /><path d="M3 9h18M9 4l3 16M15 4l-3 16" /></svg>;
  if (tipo === 'Stickers') return <svg {...trazo}><path d="M5 4h10l4 4v12H5z" /><path d="M15 4v4h4" /><path d="m12 10 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" /></svg>;
  if (tipo === 'Polvo') return <svg {...trazo}><path d="M12 3c.5 3.5 2 5 5.5 5.5C14 9 12.5 10.5 12 14c-.5-3.5-2-5-5.5-5.5C10 8 11.5 6.5 12 3z" /><circle cx="18" cy="17" r="1" /><circle cx="6" cy="17" r="1.3" /><circle cx="12" cy="20" r=".8" /></svg>;
  if (tipo === 'Flores 3D') return <svg {...trazo}><circle cx="12" cy="12" r="2.4" /><path d="M12 9.6C10 6 13.5 3.5 12 3.5S10 6 12 9.6zM14.4 12c3.6-2 6.1 1.5 6.1 0s-2.5-2-6.1 0zM12 14.4c2 3.6-1.5 6.1 0 6.1s2-2.5 0-6.1zM9.6 12c-3.6 2-6.1-1.5-6.1 0s2.5 2 6.1 0z" /></svg>;
  if (tipo === 'Foil') return <svg {...trazo}><path d="M4 16 9 5l5 7 3-4 3 8z" /><path d="M4 19h16" /></svg>;
  if (tipo === 'Charms') return <svg {...trazo}><path d="M12 11c-3-4-8-4-8 0s5 4 8 0zM12 11c3-4 8-4 8 0s-5 4-8 0z" /><path d="m11 12-2 7M13 12l2 7" /><circle cx="12" cy="11" r="1.2" /></svg>;
  return <svg {...trazo}><path d="M5 6c4 3 10-3 14 0M5 12c4 3 10-3 14 0M5 18c4 3 10-3 14 0" /></svg>;
}

// Nombre: FormaUna
// Descripción: Dibuja el contorno de una forma de uña.
// Entrada: La forma.
// Salida: El dibujo.
// Objetivo: Ver la forma antes de elegirla.
export function FormaUna({ forma }) {
  const contornos = {
    Almendra: 'M6 30V14c0-7 3-11 6-12 3 1 6 5 6 12v16', Ovalada: 'M6 30V12c0-6 3-9 6-9s6 3 6 9v18', Redonda: 'M6 30V9c0-4 3-6 6-6s6 2 6 6v21',
    Cuadrada: 'M6 30V4h12v26', Squoval: 'M6 30V6c0-1.6 1-2.5 2.5-2.5h7C17 3.5 18 4.4 18 6v24', Coffin: 'M6 30 7.5 4h9L18 30', Stiletto: 'M6 30V15C6 9 10 3 12 1c2 2 6 8 6 14v15',
    Ballerina: 'M6 30 7 6c0-1 .6-2 1.6-2h6.8c1 0 1.6 1 1.6 2l1 24'
  };
  return <svg aria-hidden="true" width="22" height="30" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d={contornos[forma] || contornos.Almendra} /></svg>;
}

// Nombre: Paso
// Descripción: Caja numerada de un paso del diseño.
// Entrada: Número, título, ayuda y contenido.
// Salida: La sección.
// Objetivo: Que el formulario se vea ordenado.
export function Paso({ numero, titulo, ayuda, children }) {
  return (
    <section className="dp-paso" aria-labelledby={`dp-t${numero}`}>
      <header className="dp-paso__cabeza">
        <span className="dp-paso__n" aria-hidden="true">{numero}</span>
        <div><h2 id={`dp-t${numero}`}>{titulo}</h2>{ayuda && <p>{ayuda}</p>}</div>
      </header>
      {children}
    </section>
  );
}

// Nombre: Opciones
// Descripción: Lista de opciones para elegir una.
// Entrada: Opciones, la elegida y qué hacer al elegir.
// Salida: Los botones.
// Objetivo: Elegir rápido y ordenado.
export function Opciones({ opciones, valor, onElegir, precio, etiqueta, nombre = (opcion) => opcion }) {
  return (
    <div className="dp-chips" role="radiogroup" aria-label={etiqueta} style={{ '--cols': opciones.length <= 7 ? opciones.length : Math.ceil(opciones.length / 2) }}>
      {opciones.map((opcion) => (
        <button key={opcion} type="button" role="radio" aria-checked={valor === opcion} onClick={() => onElegir(opcion)}>
          <span>{nombre(opcion)}</span>{precio && <small>{masPrecio(precio(opcion))}</small>}
        </button>
      ))}
    </div>
  );
}

// Nombre: Muestrario
// Descripción: Muestra los esmaltes para elegir uno.
// Entrada: El esmalte elegido y qué hacer al elegir.
// Salida: El muestrario.
// Objetivo: Elegir el color.
export function Muestrario({ valor, onElegir, etiqueta }) {
  const [verTodos, setVerTodos] = useState(false);
  const [familia, setFamilia] = useState('Todos');
  const [texto, setTexto] = useState('');
  const lista = verTodos
    ? ESMALTES.filter((color) => (familia === 'Todos' || color.familia === familia) && `${color.nombre} ${color.codigo}`.toLowerCase().includes(texto.trim().toLowerCase()))
    : COLORES_DESTACADOS.map(esmalte).filter(Boolean);
  return (
    <div className="dp-muestrario">
      {verTodos && (
        <div className="dp-muestrario__filtros">
          <input type="search" value={texto} onChange={(evento) => setTexto(evento.target.value)} placeholder="Buscar: rojo, nude, AH-120" aria-label="Buscar esmalte" />
          <select value={familia} onChange={(evento) => setFamilia(evento.target.value)} aria-label="Familia de color">
            {['Todos', ...FAMILIAS_ESMALTE].map((nombreFamilia) => <option key={nombreFamilia}>{nombreFamilia}</option>)}
          </select>
        </div>
      )}
      <div className={`dp-colores ${verTodos ? 'dp-colores--todos' : ''}`} role="radiogroup" aria-label={etiqueta}>
        {lista.map((color) => (
          <button key={color.codigo} type="button" role="radio" aria-checked={valor === color.codigo} title={`${color.nombre} · ${color.codigo}`} onClick={() => onElegir(color.codigo)}>
            <span className={`dp-colores__punto dp-colores__punto--${color.tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} style={{ '--c': color.hex }} />
            <span className="dp-colores__nombre">{color.nombre}</span>
          </button>
        ))}
      </div>
      <button type="button" className="dp-link" onClick={() => setVerTodos(!verTodos)}>{verTodos ? 'Ver menos colores' : `Ver los ${ESMALTES.length} colores del salón`}</button>
    </div>
  );
}
