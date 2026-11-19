// Gráfica de barras del panel: se puede pasar el dedo o el ratón por cada barra para ver el número,
// cambiar a tabla y descargarla como imagen (PNG) o como hoja para Excel (CSV).
import { useEffect, useId, useRef, useState } from 'react';

const corto = new Intl.NumberFormat('es-CR', { notation: 'compact', maximumFractionDigits: 1 });

// Barra con las puntas de arriba redondeadas (4 px) y la base recta sobre el eje
// Nombre: barraVertical
// Descripción: Dibuja una barra vertical con punta redonda.
// Entrada: Posición y medidas.
// Salida: El trazo.
// Objetivo: Gráficos bonitos.
function barraVertical(x, y, ancho, alto) {
  if (alto <= 0) return '';
  const radio = Math.min(4, ancho / 2, alto);
  return `M${x},${y + alto}V${y + radio}Q${x},${y} ${x + radio},${y}H${x + ancho - radio}Q${x + ancho},${y} ${x + ancho},${y + radio}V${y + alto}Z`;
}
// Nombre: barraHorizontal
// Descripción: Dibuja una barra horizontal con punta redonda.
// Entrada: Posición y medidas.
// Salida: El trazo.
// Objetivo: Gráficos bonitos.
function barraHorizontal(x, y, largo, grosor) {
  if (largo <= 0) return '';
  const radio = Math.min(4, grosor / 2, largo);
  return `M${x},${y}H${x + largo - radio}Q${x + largo},${y} ${x + largo},${y + radio}V${y + grosor - radio}Q${x + largo},${y + grosor} ${x + largo - radio},${y + grosor}H${x}Z`;
}

// Escala "bonita": 0, 25 000, 50 000…
// Nombre: escala
// Descripción: Calcula las marcas del eje.
// Entrada: El valor más alto.
// Salida: Las marcas.
// Objetivo: Gráficos fáciles de leer.
function escala(max) {
  if (max <= 0) return { tope: 1, marcas: [0, 1] };
  const paso0 = max / 4;
  const magnitud = 10 ** Math.floor(Math.log10(paso0));
  const paso = [1, 2, 2.5, 5, 10].map((multiplo) => multiplo * magnitud).find((candidato) => candidato >= paso0);
  const tope = Math.ceil(max / paso) * paso;
  return { tope, marcas: Array.from({ length: Math.round(tope / paso) + 1 }, (_, i) => i * paso) };
}

// Mide cuánto ocupa un texto en pantalla, para que los nombres nunca se salgan de la gráfica
let lienzoMedidas = null;
// Nombre: medirTexto
// Descripción: Calcula el ancho de un texto.
// Entrada: El texto y tamaño.
// Salida: El ancho.
// Objetivo: Que los textos no se salgan.
function medirTexto(texto, tam = 12.5) {
  try {
    lienzoMedidas ||= document.createElement('canvas').getContext('2d');
    lienzoMedidas.font = `600 ${tam}px ${getComputedStyle(document.body).fontFamily}`;
    return lienzoMedidas.measureText(texto).width;
  } catch { return texto.length * 7; }
}
// Nombre: recortar
// Descripción: Corta un texto largo.
// Entrada: El texto y el máximo.
// Salida: El texto corto.
// Objetivo: Que quepa en el gráfico.
function recortar(texto, maximo) {
  if (medirTexto(texto) <= maximo) return texto;
  let recortado = texto;
  while (recortado.length > 3 && medirTexto(`${recortado}…`) > maximo) recortado = recortado.slice(0, -1);
  return `${recortado.trim()}…`;
}

// Nombre: usarAncho
// Descripción: Mide el ancho disponible.
// Entrada: Nada.
// Salida: El ancho y la caja.
// Objetivo: Ajustar el gráfico a la pantalla.
function usarAncho() {
  const ref = useRef(null);
  const [ancho, setAncho] = useState(640);
  useEffect(() => {
    if (!ref.current) return undefined;
    const observador = new ResizeObserver(([e]) => setAncho(Math.max(260, Math.floor(e.contentRect.width))));
    observador.observe(ref.current);
    return () => observador.disconnect();
  }, []);
  return [ref, ancho];
}

// Copia la gráfica con sus colores reales y la dibuja en un lienzo para guardarla como PNG
// Nombre: descargarPng
// Descripción: Descarga el gráfico como imagen.
// Entrada: El gráfico, título y archivo.
// Salida: Nada.
// Objetivo: Guardar el gráfico.
async function descargarPng(svg, titulo, archivo, series = null) {
  const copia = svg.cloneNode(true);
  const originales = svg.querySelectorAll('*');
  copia.querySelectorAll('*').forEach((el, i) => {
    const estilos = getComputedStyle(originales[i]);
    ['fill', 'stroke', 'font-family', 'font-size', 'font-weight', 'opacity'].forEach((propiedad) => el.setAttribute(propiedad, estilos.getPropertyValue(propiedad)));
  });
  const fondo = getComputedStyle(svg.closest('.grafico') || document.body).backgroundColor;
  const tinta = getComputedStyle(svg.closest('.grafico') || document.body).color;
  const { width, height } = svg.viewBox.baseVal;
  const escalaPx = 2;
  const margen = 24;
  const cabeza = 44;
  const lienzo = Object.assign(document.createElement('canvas'), { width: (width + margen * 2) * escalaPx, height: (height + cabeza + margen) * escalaPx });
  const pincel = lienzo.getContext('2d');
  pincel.scale(escalaPx, escalaPx);
  pincel.fillStyle = fondo && fondo !== 'rgba(0, 0, 0, 0)' ? fondo : '#fff';
  pincel.fillRect(0, 0, width + margen * 2, height + cabeza + margen);
  pincel.fillStyle = tinta;
  pincel.font = '600 16px Poppins, system-ui, sans-serif';
  pincel.fillText(titulo, margen, 30);
  // Leyenda de colores a la derecha del título
  if (series) {
    const raiz = getComputedStyle(document.documentElement);
    // Nombre: real
    // Descripción: Convierte un color variable en color real.
    // Entrada: El color.
    // Salida: El color.
    // Objetivo: Que la imagen salga con color.
    const real = (color) => (color.startsWith('var(') ? raiz.getPropertyValue(color.slice(4, -1)).trim() : color);
    pincel.font = '600 12px Poppins, system-ui, sans-serif';
    let x = width + margen;
    [...series].reverse().forEach((sr) => {
      x -= pincel.measureText(sr.nombre).width;
      pincel.fillStyle = tinta; pincel.fillText(sr.nombre, x, 29);
      x -= 18; pincel.fillStyle = real(sr.color); pincel.fillRect(x, 19, 12, 12);
      x -= 16;
    });
  }
  const datos = new XMLSerializer().serializeToString(copia);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(datos)}`;
  await img.decode();
  pincel.drawImage(img, margen, cabeza, width, height);
  const enlace = Object.assign(document.createElement('a'), { href: lienzo.toDataURL('image/png'), download: `${archivo}.png` });
  enlace.click();
}

// Nombre: descargarCsv
// Descripción: Descarga los datos en una hoja CSV.
// Entrada: Filas, columnas y archivo.
// Salida: Nada.
// Objetivo: Abrir los datos en Excel.
function descargarCsv(filas, columnas, archivo) {
  // Nombre: celda
  // Descripción: Prepara una celda para el CSV.
  // Entrada: El valor.
  // Salida: El texto.
  // Objetivo: Que el archivo no se dañe.
  const celda = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
  const texto = [columnas.map((columna) => celda(columna.titulo)).join(';'), ...filas.map((fila) => columnas.map((columna) => celda(columna.valor(fila))).join(';'))].join('\r\n');
  // El BOM y el punto y coma hacen que Excel en español lo abra bien
  const url = URL.createObjectURL(new Blob([`﻿${texto}`], { type: 'text/csv;charset=utf-8' }));
  Object.assign(document.createElement('a'), { href: url, download: `${archivo}.csv` }).click();
  URL.revokeObjectURL(url);
}

// Colores de las series (definidos en estilos/panel-graficas.css, con su versión para modo oscuro).
// Revisados para que se distingan también con daltonismo. El color sigue a cada persona o cosa, no a su puesto.
// Nombre: colorSerie
// Descripción: Da el color de una serie.
// Entrada: El número de serie.
// Salida: El color.
// Objetivo: Usar varios colores.
export const colorSerie = (numero) => `var(--serie-${(((numero - 1) % 8) + 8) % 8 + 1})`;

/**
 * datos: [{ etiqueta, valor, detalle?, color?, partes? }]
 * tipo: 'columnas' (por día) o 'horizontal' (ranking con nombres)
 * series: [{ clave, nombre, color }] para apilar varias partes en cada columna (ej.: servicios + tienda)
 */
// Nombre: GraficoBarras
// Descripción: Muestra un gráfico de barras.
// Entrada: Título, datos y tipo.
// Salida: El gráfico.
// Objetivo: Ver números de forma clara.
export default function GraficoBarras({ titulo, descripcion, datos, tipo = 'columnas', formato = (valor) => String(valor), nombreValor = 'Valor', archivo = 'grafica', etiquetaCorta, series = null }) {
  const [contenedor, ancho] = usarAncho();
  const svgRef = useRef(null);
  const [activa, setActiva] = useState(null);
  const [verTabla, setVerTabla] = useState(false);
  const id = useId();
  const max = Math.max(0, ...datos.map((dato) => dato.valor));
  const vacio = !datos.length || max === 0;

  // Nombre: valor
  // Descripción: Da la etiqueta de una fila.
  // Entrada: La fila.
  // Salida: El texto.
  // Objetivo: Armar el CSV.
  const columnasCsv = [{ titulo: tipo === 'columnas' ? 'Día' : 'Nombre', valor: (datos) => datos.etiqueta },
    // Nombre: valor
    // Descripción: Da el valor de una serie.
    // Entrada: La fila.
    // Salida: El valor.
    // Objetivo: Armar el CSV.
    ...(series || []).map((sr) => ({ titulo: sr.nombre, valor: (datos) => datos.partes?.[sr.clave] ?? 0 })),
    // Nombre: valor
    // Descripción: Da el valor de una fila.
    // Entrada: La fila.
    // Salida: El valor.
    // Objetivo: Armar el CSV.
    { titulo: nombreValor, valor: (datos) => datos.valor }];

  let contenido = null;
  let alto = 0;
  if (!vacio && tipo === 'columnas') {
    alto = 240;
    const izq = 52; const der = 8; const arriba = 12; const abajo = 30;
    const { tope, marcas } = escala(max);
    const area = ancho - izq - der;
    const hueco = area / datos.length;
    const grosor = Math.max(3, Math.min(28, hueco * 0.62));
    // Nombre: y
    // Descripción: Calcula la altura de un valor.
    // Entrada: El valor.
    // Salida: La posición.
    // Objetivo: Dibujar columnas.
    const y = (valor) => arriba + (alto - arriba - abajo) * (1 - valor / tope);
    const cada = Math.ceil(datos.length / Math.max(1, Math.floor(area / 46)));
    contenido = (
      <>
        {marcas.map((marca) => (
          <g key={marca}>
            <line x1={izq} x2={ancho - der} y1={y(marca)} y2={y(marca)} className={marca === 0 ? 'grafico__base' : 'grafico__guia'} />
            <text x={izq - 8} y={y(marca) + 4} textAnchor="end" className="grafico__eje">{corto.format(marca)}</text>
          </g>
        ))}
        {datos.map((dato, i) => {
          const x = izq + hueco * i + (hueco - grosor) / 2;
          // Columnas apiladas: cada parte con su color y 2 px de separación; solo la de arriba lleva punta redondeada
          let base = 0;
          const partes = series ? series.map((sr) => ({ ...sr, v: dato.partes?.[sr.clave] || 0 })).filter((parte) => parte.v > 0) : [{ v: dato.valor, color: dato.color }];
          return (
            <g key={dato.etiqueta}>
              {partes.map((pt, campo) => {
                const y0 = y(base); base += pt.v; const y1 = y(base);
                const gap = campo > 0 ? 2 : 0;
                const altoP = Math.max(0, y0 - y1 - gap);
                const forma = campo === partes.length - 1 ? barraVertical(x, y1, grosor, altoP) : `M${x},${y1}h${grosor}v${altoP}h${-grosor}Z`;
                return <path key={pt.clave || campo} d={forma} className={`grafico__barra ${activa === i ? 'grafico__barra--activa' : ''}`} style={{ '--n': i, ...(pt.color ? { fill: pt.color } : {}) }} />;
              })}
              {i % cada === 0 && <text x={x + grosor / 2} y={alto - 10} textAnchor="middle" className="grafico__eje">{etiquetaCorta ? etiquetaCorta(dato.etiqueta) : dato.etiqueta}</text>}
              {/* zona para tocar, más grande que la barra */}
              <rect x={izq + hueco * i} y={arriba} width={hueco} height={alto - arriba - abajo} className="grafico__toque"
                    onPointerEnter={() => setActiva(i)} onPointerLeave={() => setActiva(null)} onClick={() => setActiva(i)} />
            </g>
          );
        })}
      </>
    );
  } else if (!vacio) {
    const fila = 34;
    alto = datos.length * fila + 8;
    // El espacio para los nombres se ajusta al más largo, sin pasar del 42 % del ancho
    const masLargo = Math.max(...datos.map((dato) => medirTexto(dato.etiqueta)));
    const izq = Math.min(ancho * 0.42, Math.max(70, masLargo + 18));
    const der = Math.max(...datos.map((dato) => medirTexto(formato(dato.valor), 12))) + 18;
    // Nombre: largo
    // Descripción: Calcula el largo de una barra.
    // Entrada: El valor.
    // Salida: El largo.
    // Objetivo: Dibujar barras.
    const largo = (valor) => ((ancho - izq - der) * valor) / max;
    contenido = datos.map((dato, i) => {
      const y = 4 + i * fila;
      return (
        <g key={dato.etiqueta} onPointerEnter={() => setActiva(i)} onPointerLeave={() => setActiva(null)} onClick={() => setActiva(i)}>
          <rect x="0" y={y} width={ancho} height={fila} className="grafico__toque" />
          <text x={izq - 10} y={y + fila / 2 + 4} textAnchor="end" className="grafico__nombre">{recortar(dato.etiqueta, izq - 16)}<title>{dato.etiqueta}</title></text>
          <path d={barraHorizontal(izq, y + 9, largo(dato.valor), fila - 18)} className={`grafico__barra ${activa === i ? 'grafico__barra--activa' : ''}`} style={{ '--n': i, ...(dato.color ? { fill: dato.color } : {}) }} />
          <text x={izq + largo(dato.valor) + 8} y={y + fila / 2 + 4} className="grafico__valor">{formato(dato.valor)}</text>
        </g>
      );
    });
  }

  const punto = activa != null ? datos[activa] : null;
  let posTip = null;
  if (punto && tipo === 'columnas') {
    // El globo sale al lado de la barra (a la derecha, o a la izquierda si la barra está al final), a la altura de su punta
    const centro = 52 + ((ancho - 60) / datos.length) * (activa + 0.5);
    const punta = 12 + 198 * (1 - punto.valor / escala(max).tope);
    const izquierda = centro > ancho * 0.6;
    posTip = { left: `${centro}px`, top: `${Math.max(0, Math.min(punta - 8, 110))}px`, transform: izquierda ? 'translateX(calc(-100% - 14px))' : 'translateX(14px)' };
  }
  if (punto && tipo === 'horizontal') posTip = { left: '50%', top: `${4 + activa * 34 - 6}px` };

  return (
    <figure className={`grafico grafico--${tipo}`} aria-labelledby={`${id}-t`}>
      <figcaption className="grafico__cabeza">
        <div>
          <h3 id={`${id}-t`} className="grafico__titulo">{titulo}</h3>
          {descripcion && <p className="tenue">{descripcion}</p>}
        </div>
        <div className="grafico__botones">
          <button type="button" className="grafico__boton" onClick={() => setVerTabla(!verTabla)} aria-pressed={verTabla}>{verTabla ? 'Ver gráfica' : 'Ver tabla'}</button>
          <button type="button" className="grafico__boton" disabled={vacio || verTabla} onClick={() => svgRef.current && descargarPng(svgRef.current, titulo, archivo, series)}>
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>Imagen
          </button>
          <button type="button" className="grafico__boton" disabled={!datos.length} onClick={() => descargarCsv(datos, columnasCsv, archivo)}>
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>Excel
          </button>
        </div>
      </figcaption>

      {series && (
        <ul className="grafico__leyenda" aria-label="Qué significa cada color">
          {series.map((sr) => <li key={sr.clave}><i style={{ background: sr.color }} aria-hidden="true" />{sr.nombre}</li>)}
        </ul>
      )}
      <div className="grafico__cuerpo" ref={contenedor}>
        {vacio && !verTabla && <p className="grafico__vacio">Todavía no hay datos en estas fechas.</p>}
        {!vacio && !verTabla && (
          <>
            <svg ref={svgRef} width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={`${titulo}. Toca «Ver tabla» para leer cada número.`}>
              {contenido}
            </svg>
            {punto && (
              <div className={`grafico__tip grafico__tip--${tipo}`} style={posTip} role="status">
                <strong>{formato(punto.valor)}</strong>
                <span>{punto.etiquetaLarga || punto.etiqueta}</span>
                {series && series.map((sr) => <span key={sr.clave} className="grafico__tip-parte"><i style={{ background: sr.color }} />{sr.nombre}: {formato(punto.partes?.[sr.clave] || 0)}</span>)}
                {punto.detalle && <span className="grafico__tip-extra">{punto.detalle}</span>}
              </div>
            )}
          </>
        )}
        {verTabla && (
          <div className="tabla-envoltura">
            <table className="tabla grafico__tabla">
              <thead><tr><th scope="col">{columnasCsv[0].titulo}</th>{(series || []).map((sr) => <th key={sr.clave} scope="col">{sr.nombre}</th>)}<th scope="col">{nombreValor}</th>{!series && datos.some((dato) => dato.detalle) && <th scope="col">Detalle</th>}</tr></thead>
              <tbody>{datos.map((dato) => <tr key={dato.etiqueta}><td>{dato.color && <i className="grafico__punto" style={{ background: dato.color }} aria-hidden="true" />}{dato.etiquetaLarga || dato.etiqueta}</td>{(series || []).map((sr) => <td key={sr.clave}>{formato(dato.partes?.[sr.clave] || 0)}</td>)}<td><b>{formato(dato.valor)}</b></td>{!series && datos.some((dato) => dato.detalle) && <td>{dato.detalle}</td>}</tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </figure>
  );
}
