// Cliente mínimo de la API de Unsplash, compartido por los comandos de fotos.
export const UTM = 'utm_source=naile&utm_medium=referral';

// Nombre: claveUnsplash
// Descripción: Busca la clave de Unsplash.
// Entrada: Nada.
// Salida: La clave o un aviso.
// Objetivo: Usar Unsplash sin poner la clave en el código.
export function claveUnsplash() {
  const clave = process.env.UNSPLASH_KEY;
  if (!clave) {
    console.error('Falta la clave. Define UNSPLASH_KEY con tu Access Key de https://unsplash.com/developers');
    process.exit(1);
  }
  return clave;
}

// Nombre: buscarUnsplash
// Descripción: Pide fotos a Unsplash.
// Entrada: La clave, lo que se busca y la página.
// Salida: La lista de fotos.
// Objetivo: Conseguir fotos reales.
export async function buscarUnsplash(clave, query, page = 1, perPage = 30) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&content_filter=high`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${clave}`, 'Accept-Version': 'v1' } });
  if (res.status === 401) throw new Error('La clave de Unsplash no es válida.');
  if (res.status === 403) throw new Error('Se alcanzó el límite de Unsplash (50 consultas por hora). Espera una hora y vuelve a correr el comando: sigue donde quedó.');
  if (!res.ok) throw new Error(`Unsplash respondió ${res.status}.`);
  const datos = await res.json();
  // Solo fotos gratuitas
  datos.results = (datos.results || []).filter((f) => !f.premium && !f.plus);
  return datos;
}

// Nombre: urlFotoUnsplash
// Descripción: Arma el enlace de una foto de Unsplash.
// Entrada: La foto.
// Salida: El enlace con tamaño ajustado.
// Objetivo: Que las fotos carguen rápido.
export const urlFotoUnsplash = (f) => `${f.urls.raw.split('?')[0]}?auto=format&fit=crop&w=1000&q=70`;
// Nombre: autorUnsplash
// Descripción: Arma los datos del autor de una foto.
// Entrada: La foto.
// Salida: Nombre y enlace del autor.
// Objetivo: Dar crédito al fotógrafo.
export const autorUnsplash = (f) => ({
  autor: f.user?.name || 'Unsplash',
  autor_url: `${f.user?.links?.html || 'https://unsplash.com'}?${UTM}`
});
