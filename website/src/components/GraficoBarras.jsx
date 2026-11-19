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
  const r = Math.min(4, ancho / 2, alto);
  return `M${x},${y + alto}V${y + r}Q${x},${y} ${x + r},${y}H${x + ancho - r}Q${x + ancho},${y} ${x + ancho},${y + r}V${y + alto}Z`;
}
// Nombre: barraHorizontal
// Descripción: Dibuja una barra horizontal con punta redonda.
// Entrada: Posición y medidas.
// Salida: El trazo.
// Objetivo: Gráficos bonitos.
function barraHorizontal(x, y, largo, grosor) {
  if (largo <= 0) return '';
  const r = Math.min(4, grosor / 2, largo);
  return `M${x},${y}H${x + largo - r}Q${x + largo},${y} ${x + largo},${y + r}V${y + grosor - r}Q${x + largo},${y + grosor} ${x + largo - r},${y + grosor}H${x}Z`;
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
  const mag = 10 ** Math.floor(Math.log10(paso0));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= paso0);
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
  let t = texto;
  while (t.length > 3 && medirTexto(`${t}…`) > maximo) t = t.slice(0, -1);
  return `${t.trim()}…`;
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
    const o = new ResizeObserver(([e]) => setAncho(Math.max(260, Math.floor(e.contentRect.width))));
    o.observe(ref.current);
    return () => o.disconnect();
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
    const cs = getComputedStyle(originales[i]);
    ['fill', 'stroke', 'font-family', 'font-size', 'font-weight', 'opacity'].forEach((p) => el.setAttribute(p, cs.getPropertyValue(p)));
  });
  const fondo = getComputedStyle(svg.closest('.grafico') || document.body).backgroundColor;
  const tinta = getComputedStyle(svg.closest('.grafico') || document.body).color;
  const { width, height } = svg.viewBox.baseVal;
  const escalaPx = 2;
  const margen = 24;
  const cabeza = 44;
  const lienzo = Object.assign(document.createElement('canvas'), { width: (width + margen * 2) * escalaPx, height: (height + cabeza + margen) * escalaPx });
  const ctx = lienzo.getContext('2d');
  ctx.scale(escalaPx, escalaPx);
  ctx.fillStyle = fondo && fondo !== 'rgba(0, 0, 0, 0)' ? fondo : '#fff';
  ctx.fillRect(0, 0, width + margen * 2, height + cabeza + margen);
  ctx.fillStyle = tinta;
  ctx.font = '600 16px Poppins, system-ui, sans-serif';
  ctx.fillText(titulo, margen, 30);
  // Leyenda de colores a la derecha del título
  if (series) {
    const raiz = getComputedStyle(document.documentElement);
    // Nombre: real
    // Descripción: Convierte un color variable en color real.
    // Entrada: El color.
    // Salida: El color.
    // Objetivo: Que la imagen salga con color.
    const real = (c) => (c.startsWith('var(') ? raiz.getPropertyValue(c.slice(4, -1)).trim() : c);
    ctx.font = '600 12px Poppins, system-ui, sans-serif';
    let x = width + margen;
    [...series].reverse().forEach((sr) => {
      x -= ctx.measureText(sr.nombre).width;
      ctx.fillStyle = tinta; ctx.fillText(sr.nombre, x, 29);
      x -= 18; ctx.fillStyle = real(sr.color); ctx.fillRect(x, 19, 12, 12);
      x -= 16;
    });
  }
  const datos = new XMLSerializer().serializeToString(copia);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(datos)}`;
  await img.decode();
  ctx.drawImage(img, margen, cabeza, width, height);
  const a = Object.assign(document.createElement('a'), { href: lienzo.toDataURL('image/png'), download: `${archivo}.png` });
  a.click();
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
  const celda = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const texto = [columnas.map((c) => celda(c.titulo)).join(';'), ...filas.map((f) => columnas.map((c) => celda(c.valor(f))).join(';'))].join('\r\n');
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
export const colorSerie = (n) => `var(--serie-${(((n - 1) % 8) + 8) % 8 + 1})`;

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
export default function GraficoBarras({ titulo, descripcion, datos, tipo = 'columnas', formato = (v) => String(v), nombreValor = 'Valor', archivo = 'grafica', etiquetaCorta, series = null }) {
  const [contenedor, ancho] = usarAncho();
  const svgRef = useRef(null);
  const [activa, setActiva] = useState(null);
  const [verTabla, setVerTabla] = useState(false);
  const id = useId();
  const max = Math.max(0, ...datos.map((d) => d.valor));
  const vacio = !datos.length || max === 0;

  // Nombre: valor
  // Descripción: Da la etiqueta de una fila.
  // Entrada: La fila.
  // Salida: El texto.
  // Objetivo: Armar el CSV.
  const columnasCsv = [{ titulo: tipo === 'columnas' ? 'Día' : 'Nombre', valor: (d) => d.etiqueta },
    // Nombre: valor
    // Descripción: Da el valor de una serie.
    // Entrada: La fila.
    // Salida: El valor.
    // Objetivo: Armar el CSV.
    ...(series || []).map((sr) => ({ titulo: sr.nombre, valor: (d) => d.partes?.[sr.clave] ?? 0 })),
    // Nombre: valor
    // Descripción: Da el valor de una fila.
    // Entrada: La fila.
    // Salida: El valor.
    // Objetivo: Armar el CSV.
    { titulo: nombreValor, valor: (d) => d.valor }];

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
    const y = (v) => arriba + (alto - arriba - abajo) * (1 - v / tope);
    const cada = Math.ceil(datos.length / Math.max(1, Math.floor(area / 46)));
    contenido = (
      <>
        {marcas.map((m) => (
          <g key={m}>
            <line x1={izq} x2={ancho - der} y1={y(m)} y2={y(m)} className={m === 0 ? 'grafico__base' : 'grafico__guia'} />
            <text x={izq - 8} y={y(m) + 4} textAnchor="end" className="grafico__eje">{corto.format(m)}</text>
          </g>
        ))}
        {datos.map((d, i) => {
          const x = izq + hueco * i + (hueco - grosor) / 2;
          // Columnas apiladas: cada parte con su color y 2 px de separación; solo la de arriba lleva punta redondeada
          let base = 0;
          const partes = series ? series.map((sr) => ({ ...sr, v: d.partes?.[sr.clave] || 0 })).filter((x) => x.v > 0) : [{ v: d.valor, color: d.color }];
          return (
            <g key={d.etiqueta}>
              {partes.map((pt, k) => {
                const y0 = y(base); base += pt.v; const y1 = y(base);
                const gap = k > 0 ? 2 : 0;
                const altoP = Math.max(0, y0 - y1 - gap);
                const forma = k === partes.length - 1 ? barraVertical(x, y1, grosor, altoP) : `M${x},${y1}h${grosor}v${altoP}h${-grosor}Z`;
                return <path key={pt.clave || k} d={forma} className={`grafico__barra ${activa === i ? 'grafico__barra--activa' : ''}`} style={{ '--n': i, ...(pt.color ? { fill: pt.color } : {}) }} />;
              })}
              {i % cada === 0 && <text x={x + grosor / 2} y={alto - 10} textAnchor="middle" className="grafico__eje">{etiquetaCorta ? etiquetaCorta(d.etiqueta) : d.etiqueta}</text>}
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
    const masLargo = Math.max(...datos.map((d) => medirTexto(d.etiqueta)));
    const izq = Math.min(ancho * 0.42, Math.max(70, masLargo + 18));
    const der = Math.max(...datos.map((d) => medirTexto(formato(d.valor), 12))) + 18;
    // Nombre: largo
    // Descripción: Calcula el largo de una barra.
    // Entrada: El valor.
    // Salida: El largo.
    // Objetivo: Dibujar barras.
    const largo = (v) => ((ancho - izq - der) * v) / max;
    contenido = datos.map((d, i) => {
      const y = 4 + i * fila;
      return (
        <g key={d.etiqueta} onPointerEnter={() => setActiva(i)} onPointerLeave={() => setActiva(null)} onClick={() => setActiva(i)}>
          <rect x="0" y={y} width={ancho} height={fila} className="grafico__toque" />
          <text x={izq - 10} y={y + fila / 2 + 4} textAnchor="end" className="grafico__nombre">{recortar(d.etiqueta, izq - 16)}<title>{d.etiqueta}</title></text>
          <path d={barraHorizontal(izq, y + 9, largo(d.valor), fila - 18)} className={`grafico__barra ${activa === i ? 'grafico__barra--activa' : ''}`} style={{ '--n': i, ...(d.color ? { fill: d.color } : {}) }} />
          <text x={izq + largo(d.valor) + 8} y={y + fila / 2 + 4} className="grafico__valor">{formato(d.valor)}</text>
        </g>
      );
    });
  }

  const punto = activa != null ? datos[activa] : null;
  let posTip = null;
  if (punto && tipo === 'columnas') posTip = { left: `${((52 + ((ancho - 60) / datos.length) * (activa + 0.5)) / ancho) * 100}%`, top: 0 };
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
              <thead><tr><th scope="col">{columnasCsv[0].titulo}</th>{(series || []).map((sr) => <th key={sr.clave} scope="col">{sr.nombre}</th>)}<th scope="col">{nombreValor}</th>{!series && datos.some((d) => d.detalle) && <th scope="col">Detalle</th>}</tr></thead>
              <tbody>{datos.map((d) => <tr key={d.etiqueta}><td>{d.color && <i className="grafico__punto" style={{ background: d.color }} aria-hidden="true" />}{d.etiquetaLarga || d.etiqueta}</td>{(series || []).map((sr) => <td key={sr.clave}>{formato(d.partes?.[sr.clave] || 0)}</td>)}<td><b>{formato(d.valor)}</b></td>{!series && datos.some((x) => x.detalle) && <td>{d.detalle}</td>}</tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </figure>
  );
}
