// Patrón Strategy: convierte lo que la clienta escribe ("quiero almendra rosadas con perlas en el anular")
// en un diseño uña por uña que el diseñador dibuja en la mano.
//   - DisenoConClaude: le pregunta a Claude (IA de Anthropic). Solo funciona si en la computadora del servidor
//     existe la variable ANTHROPIC_API_KEY (se paga por uso; la clave nunca va en el código ni en GitHub).
//   - DisenoPorPalabras: gratis, busca palabras conocidas (formas, colores, perlas, anular...) en el texto.
// Si Claude no está configurado o falla, se usa DisenoPorPalabras.
import { ESMALTES, esmalte, OPCIONES_DISENO, EXTRAS, POSICIONES, DEDOS, limpiarExtras } from '../db/esmaltes.js';

const TECNICAS = OPCIONES_DISENO.decoracion.filter((t) => !['Pedrería', 'Foil dorado'].includes(t));
const TODAS = [0, 1, 2, 3, 4];
const sinTildes = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Nombre: normalizarDiseno
// Descripción: Revisa el diseño que llega (de la IA o de las palabras) y corrige lo que no exista.
// Entrada: El diseño sin revisar.
// Salida: Un diseño válido con forma, largo, cinco uñas, decoraciones, notas y resumen.
// Objetivo: Nunca guardar ni dibujar opciones inventadas.
export function normalizarDiseno(d = {}) {
  const porNombre = (v) => esmalte(v) || ESMALTES.find((e) => sinTildes(e.nombre) === sinTildes(v));
  const unas = TODAS.map((i) => {
    const u = (Array.isArray(d.unas) ? d.unas[i] : null) || d.unas?.[0] || {};
    return {
      esmalte: porNombre(u.esmalte)?.codigo || 'AH-038',
      tecnica: TECNICAS.includes(u.tecnica) ? u.tecnica : 'Ninguna',
      acabado: OPCIONES_DISENO.acabado.includes(u.acabado) ? u.acabado : 'Brillante'
    };
  });
  const extras = (Array.isArray(d.extras) ? d.extras : []).flatMap((x) => { try { return limpiarExtras([x]); } catch { return []; } });
  return {
    forma: OPCIONES_DISENO.forma.includes(d.forma) ? d.forma : 'Almendra',
    largo: OPCIONES_DISENO.largo.includes(d.largo) ? d.largo : 'Medio',
    unas,
    extras,
    notas: String(d.notas || '').trim().slice(0, 300),
    resumen: String(d.resumen || '').trim().slice(0, 300)
  };
}

// ---------------------------------------------------------------------------
// Estrategia 1: Claude (IA)
export class DisenoConClaude {
  constructor(clave, modelo = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5') { this.clave = clave; this.modelo = modelo; this.nombre = 'ia'; }

  // Nombre: instrucciones
  // Descripción: Arma las instrucciones para Claude con todas las opciones del salón.
  // Entrada: Nada.
  // Salida: El texto de instrucciones.
  // Objetivo: Que la IA solo use colores y decoraciones que el salón tiene.
  instrucciones() {
    return [
      'Eres la asistente de diseño de uñas del salón AH Nails (Costa Rica). La clienta describe en español cómo quiere sus uñas.',
      'Convierte su pedido en un diseño usando SOLO estas opciones. Responde ÚNICAMENTE con un objeto JSON, sin texto antes ni después.',
      `Formas: ${OPCIONES_DISENO.forma.join(', ')}.`,
      `Largos: ${OPCIONES_DISENO.largo.join(', ')}.`,
      `Técnicas (por uña): ${TECNICAS.join(', ')} ("Ninguna" = color liso).`,
      `Acabados (por uña): ${OPCIONES_DISENO.acabado.join(', ')}.`,
      `Decoraciones: ${Object.entries(EXTRAS).map(([t, x]) => `${t} [${x.variantes.join(' / ')}]`).join('; ')}.`,
      `Partes de la uña: ${POSICIONES.join(', ')}.`,
      `Uñas (índice 0 a 4): ${DEDOS.map((d, i) => `${i}=${d}`).join(', ')}.`,
      `Esmaltes (código nombre): ${ESMALTES.map((e) => `${e.codigo} ${e.nombre}`).join('; ')}.`,
      'Formato: {"forma":"Almendra","largo":"Medio","unas":[{"esmalte":"AH-038","tecnica":"Ninguna","acabado":"Brillante"}, ... 5 uñas en orden pulgar a meñique],',
      '"extras":[{"tipo":"Perlas","variante":"Blancas","posicion":"Base","dedos":[3]}],"notas":"detalles que no caben en las opciones","resumen":"1 o 2 frases sencillas explicando el diseño"}.',
      'Si la clienta no dice algo, elige lo más bonito y común. Si dice "solo el anular" u otra uña, cambia solo esa uña. El diseño es igual en las dos manos.',
      'Si te mandan un diseño actual, modifícalo según el pedido en vez de empezar de cero.'
    ].join('\n');
  }

  // Nombre: interpretar
  // Descripción: Le pregunta a Claude cómo quedaría el diseño.
  // Entrada: El texto de la clienta y el diseño actual.
  // Salida: El diseño revisado.
  // Objetivo: Crear el diseño con inteligencia artificial.
  async interpretar(texto, actual) {
    const control = new AbortController();
    const espera = setTimeout(() => control.abort(), 25000);
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: control.signal,
        headers: { 'content-type': 'application/json', 'x-api-key': this.clave, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: this.modelo,
          max_tokens: 1200,
          system: this.instrucciones(),
          messages: [{ role: 'user', content: `${actual ? `Diseño actual: ${JSON.stringify(actual)}\n` : ''}Pedido de la clienta: ${texto}` }]
        })
      });
      if (!r.ok) throw new Error(`La IA respondió ${r.status}`);
      const datos = await r.json();
      const respuesta = (datos.content || []).map((c) => c.text || '').join('');
      const json = respuesta.slice(respuesta.indexOf('{'), respuesta.lastIndexOf('}') + 1);
      return normalizarDiseno(JSON.parse(json));
    } finally {
      clearTimeout(espera);
    }
  }
}

// ---------------------------------------------------------------------------
// Estrategia 2: palabras clave (gratis, sin internet)
const PALABRAS_DEDO = [[/pulgar/, 0], [/indice/, 1], [/dedo (del )?medio|(?:el|y) medio\b(?! de la)/, 2], [/anular/, 3], [/menique/, 4]];
const PALABRAS_POSICION = [[/base|cuticula/, 'Base'], [/punta|borde/, 'Punta'], [/centro|en medio de la/, 'Centro'], [/lado|costado|esquina/, 'Un lado'], [/toda la una|completa|entera/, 'Toda la uña']];
const PALABRAS_FORMA = [[/almendra/, 'Almendra'], [/cuadrad/, 'Cuadrada'], [/redond/, 'Redonda'], [/stiletto|puntiagud/, 'Stiletto'], [/coffin|ataud/, 'Coffin'], [/ovalad|ovalo/, 'Ovalada'], [/squoval/, 'Squoval'], [/ballerina|bailarina/, 'Ballerina']];
const PALABRAS_LARGO = [[/largo medio|medi(o|as|anas?) (de )?larg|medianas?/, 'Medio'], [/extra ?larg|muy larg/, 'Extra largo'], [/larg/, 'Largo'], [/cort/, 'Corto']];
const PALABRAS_TECNICA = [[/francesa de color/, 'Francesa de color'], [/francesa/, 'Francesa'], [/baby ?boomer/, 'Baby boomer'], [/ombre|degradad/, 'Ombré'], [/marmol/, 'Mármol'],
  [/lineas(?! finas)|rayas/, 'Líneas'], [/puntos|lunares/, 'Puntos'], [/corazones/, 'Corazones'], [/flores (a mano|pintadas)/, 'Flores a mano'], [/animal|leopardo|cebra|vaca/, 'Animal print'], [/aura/, 'Aura']];
const PALABRAS_ACABADO = [[/mate/, 'Mate'], [/ojo de gato/, 'Ojo de gato'], [/aurora/, 'Aurora'], [/perlad/, 'Perlado'], [/chrome|cromad/, 'Chrome']];
const PALABRAS_EXTRA = [[/perla/, 'Perlas'], [/cristal|piedr|pedreria|strass|brillantes/, 'Cristales'], [/sticker|calcomania/, 'Stickers'], [/polvo|escarcha|glitter/, 'Polvo'],
  [/flor(es)? (3d|en relieve|de relieve)/, 'Flores 3D'], [/foil|pan de oro|hoja de oro/, 'Foil'], [/charm|mono|lazo/, 'Charms'], [/lineas finas|hilos/, 'Líneas finas']];
const COLOR_FAMILIA = [[/vino|borgona|burdeos/, 'Vino tinto'], [/rosad|rosa|rosita/, 'Rosa ballet'], [/fucsia/, 'Fucsia'], [/roj/, 'Rojo clásico'], [/nude|piel|natural/, 'Nude rosado'],
  [/blanc|milky|lechos/, 'Milky white'], [/negr/, 'Negro'], [/celeste|azul claro|azul cielo/, 'Cielo'], [/azul/, 'Azul rey'], [/verde/, 'Salvia'], [/lila|lavanda/, 'Lavanda'],
  [/morad/, 'Morado'], [/amarill/, 'Girasol'], [/coral/, 'Coral'], [/naranja/, 'Naranja'], [/durazno/, 'Durazno'], [/cafe|marron|chocolate/, 'Chocolate'], [/dorad|oro/, 'Oro'], [/platead|plata/, 'Plata'], [/gris/, 'Gris piedra']];

// Nombre: buscar
// Descripción: Devuelve el valor de la primera regla que aparece en el texto.
// Entrada: El texto y la lista de reglas.
// Salida: El valor o nada.
// Objetivo: Reconocer palabras de uñas.
const buscar = (t, reglas) => reglas.find(([re]) => re.test(t))?.[1];

export class DisenoPorPalabras {
  constructor() { this.nombre = 'basico'; }

  // Nombre: colorDe
  // Descripción: Encuentra un esmalte en una frase (por nombre exacto o por familia).
  // Entrada: La frase.
  // Salida: El código del esmalte o nada.
  // Objetivo: Elegir el color que pidió la clienta.
  colorDe(frase) {
    const exacto = [...ESMALTES].sort((a, b) => b.nombre.length - a.nombre.length).find((e) => frase.includes(sinTildes(e.nombre)));
    if (exacto) return exacto.codigo;
    const nombre = buscar(frase, COLOR_FAMILIA);
    return nombre ? ESMALTES.find((e) => e.nombre === nombre)?.codigo : undefined;
  }

  // Nombre: interpretar
  // Descripción: Arma el diseño buscando palabras conocidas en el texto.
  // Entrada: El texto de la clienta y el diseño actual.
  // Salida: El diseño revisado.
  // Objetivo: Tener diseño automático gratis, sin IA.
  async interpretar(texto, actual) {
    const t = sinTildes(texto);
    const base = normalizarDiseno(actual || {});
    const frases = t.split(/[.,;]| y (?=en |el |la |los |las |solo )|\n/).map((f) => f.trim()).filter(Boolean);
    const d = { ...base, unas: base.unas.map((u) => ({ ...u })), extras: [...base.extras] };
    d.forma = buscar(t, PALABRAS_FORMA) || d.forma;
    d.largo = buscar(t, PALABRAS_LARGO) || d.largo;
    const usadas = [];
    frases.forEach((f) => {
      // Se parte la frase: lo de antes de la primera decoración es el color o la técnica; cada decoración tiene su pedazo
      const marcas = PALABRAS_EXTRA.map(([re, tipo]) => { const m = f.match(re); return m ? { tipo, i: m.index } : null; }).filter(Boolean).sort((x, y) => x.i - y.i);
      const inicio = marcas.length ? f.slice(0, marcas[0].i) : f;
      const dedosDe = (txt) => PALABRAS_DEDO.filter(([re]) => re.test(txt)).map(([, i]) => i);
      const dedosFrase = dedosDe(f);
      const destino = dedosDe(inicio).length ? dedosDe(inicio) : (!marcas.length && dedosFrase.length ? dedosFrase : TODAS);
      const tecnica = buscar(inicio, PALABRAS_TECNICA);
      const acabado = buscar(inicio, PALABRAS_ACABADO);
      // En "francesa blanca" el blanco es la punta, no el color de la uña
      const color = this.colorDe(tecnica ? inicio.replace(/francesa( de color)? \w+/, '') : inicio);
      if (color) destino.forEach((i) => { d.unas[i].esmalte = color; });
      if (tecnica) destino.forEach((i) => { d.unas[i].tecnica = tecnica; });
      if (acabado) destino.forEach((i) => { d.unas[i].acabado = acabado; });
      marcas.forEach((m, n) => {
        const pedazo = f.slice(m.i, marcas[n + 1]?.i ?? f.length);
        const resto = f.slice(m.i);
        const extra = m.tipo;
        const variantes = EXTRAS[extra].variantes;
        const variante = variantes.find((v) => pedazo.includes(sinTildes(v).slice(0, -1))) || (extra === 'Polvo' && /cromo/.test(pedazo) ? 'Cromo espejo' : variantes[0]);
        const posicion = buscar(pedazo, PALABRAS_POSICION) || buscar(resto, PALABRAS_POSICION) || (extra === 'Polvo' || extra === 'Foil' ? 'Toda la uña' : 'Base');
        const propios = [dedosDe(pedazo), dedosDe(inicio), n === marcas.length - 1 ? dedosFrase : []].find((l) => l.length) || [];
        const lugar = /todas/.test(pedazo) ? TODAS : propios.length ? propios : ['Perlas', 'Cristales', 'Flores 3D', 'Charms'].includes(extra) ? [3] : TODAS;
        d.extras = d.extras.filter((x) => x.tipo !== extra).concat({ tipo: extra, variante, posicion, dedos: lugar });
        usadas.push(`${extra.toLowerCase()} en ${lugar.length === 5 ? 'todas' : lugar.map((i) => DEDOS[i].toLowerCase()).join(' y ')}`);
      });
    });
    const n = normalizarDiseno(d);
    const colores = [...new Set(n.unas.map((u) => esmalte(u.esmalte).nombre))];
    n.resumen = `Uñas ${n.forma.toLowerCase()} ${{ Corto: 'cortas', Medio: 'de largo medio', Largo: 'largas', 'Extra largo': 'extra largas' }[n.largo]} en ${colores.join(' y ').toLowerCase()}${usadas.length ? `, con ${usadas.join(', ')}` : ''}. Revisa cada uña en la mano y ajusta lo que quieras.`;
    return n;
  }
}

// Nombre: elegirEstrategia
// Descripción: Usa Claude si hay clave; si no, las palabras clave.
// Entrada: Nada.
// Salida: La estrategia a usar.
// Objetivo: Que funcione siempre, con o sin IA.
export const elegirEstrategia = () => (process.env.ANTHROPIC_API_KEY ? new DisenoConClaude(process.env.ANTHROPIC_API_KEY) : new DisenoPorPalabras());
