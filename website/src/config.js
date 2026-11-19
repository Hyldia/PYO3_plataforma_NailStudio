// Datos del salón. Todo el sitio los lee de aquí (si cambian, se cambian solo en este archivo).
export const SALON = {
  nombre: 'AH Nails',
  descripcion: 'Salón de uñas',
  lema: 'Uñas cuidadas, diseños hechos a tu medida.',
  telefono: '+506 8532 6297',
  whatsapp: '50685326297',          // solo números, con código de país (Costa Rica = 506)
  direccion: 'Limón, Limón, Costa Rica',
  horario: [
    { dias: 'Lunes a viernes', horas: '9:00 a. m. – 7:00 p. m.' },
    { dias: 'Sábado', horas: '9:00 a. m. – 5:00 p. m.' },
    { dias: 'Domingo', horas: 'Cerrado' }
  ],
  redes: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    tiktok: ''
  },
  sinpe: { numero: '8532 6297', nombre: 'AH Nails' },
  // Asistente virtual del chat. Cambien la foto por una de su recepcionista (con su permiso) cuando la tengan.
  asistente: {
    nombre: 'Sofi',
    foto: 'https://images.unsplash.com/photo-1758518727888-ffa196002e59?w=240&h=240&fit=crop&crop=faces&q=80',
    credito: { autor: 'Vitaly Gariev', url: 'https://unsplash.com/@silverkblack' }
  }
};

const formato = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });
// Nombre: dinero
// Descripción: Escribe un monto en colones.
// Entrada: El monto.
// Salida: El texto (₡5 000).
// Objetivo: Mostrar precios.
export const dinero = (monto) => formato.format(monto ?? 0);

// Las fotos subidas desde el panel viven en /uploads; las de bancos gratuitos son URL completas
// Nombre: urlFoto
// Descripción: Da la dirección completa de una foto.
// Entrada: El archivo.
// Salida: La dirección.
// Objetivo: Mostrar fotos.
export const urlFoto = (archivo) => (!archivo ? null : archivo.startsWith('http') ? archivo : `/uploads/${archivo}`);
// Nombre: enlaceWhatsApp
// Descripción: Arma el enlace de WhatsApp del salón.
// Entrada: El texto.
// Salida: El enlace.
// Objetivo: Escribirle al salón.
export const enlaceWhatsApp = (texto = '') => `https://wa.me/${SALON.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;

// Campaña del banner principal según el mes (cámbienla cuando quieran)
// Nombre: campanaActual
// Descripción: Dice qué campaña hay según la fecha.
// Entrada: La fecha.
// Salida: La campaña.
// Objetivo: Cambiar anuncios solos.
export function campanaActual(fecha = new Date()) {
  const mes = fecha.getMonth() + 1;
  if (mes === 11) return { antes: 'Ofertas de', titulo: 'BLACK FRIDAY', tema: 'oscuro' };
  if (mes === 12) return { antes: 'Ofertas de', titulo: 'NAVIDAD', tema: 'navidad' };
  if (mes === 2) return { antes: 'Ofertas de', titulo: 'SAN VALENTÍN', tema: 'rosa' };
  if (mes === 8) return { antes: 'Ofertas del', titulo: 'DÍA DE LA MADRE', tema: 'rosa' };
  return { antes: 'Ofertas de', titulo: 'TEMPORADA', tema: 'rosa' };
}
