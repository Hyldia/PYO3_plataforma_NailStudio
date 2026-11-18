// Datos del salón: cámbialos por los reales. Todo el sitio los lee de aquí.
export const SALON = {
  nombre: 'AH Nails',
  descripcion: 'Salón de uñas',
  lema: 'Diseñamos lo que imaginas, en la punta de tus dedos.',
  descripcionPortada: 'Manicure, uñas acrílicas, polygel y pedicure. Mira nuestros trabajos, elige tu diseño y reserva en línea.',
  telefono: '+506 0000 0000',
  whatsapp: '50600000000',          // solo números, con código de país
  correo: 'hola@naile.cr',
  direccion: '[Dirección del local], Cartago, Costa Rica',
  // Google Maps → Compartir → Insertar un mapa → copia solo la URL del src
  mapaEmbed: '',
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
  sinpe: { numero: '0000 0000', nombre: '[Nombre del titular]' },
  // Asistente virtual del chat. Cambien la foto por una de su recepcionista (con su permiso) cuando la tengan.
  asistente: {
    nombre: 'Sofi',
    foto: 'https://images.unsplash.com/photo-1758518727888-ffa196002e59?w=240&h=240&fit=crop&crop=faces&q=80',
    credito: { autor: 'Vitaly Gariev', url: 'https://unsplash.com/@silverkblack' }
  }
};

const formato = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });
export const dinero = (monto) => formato.format(monto ?? 0);

// Las fotos subidas desde el panel viven en /uploads; las de bancos gratuitos son URL completas
export const urlFoto = (archivo) => (!archivo ? null : archivo.startsWith('http') ? archivo : `/uploads/${archivo}`);
export const enlaceWhatsApp = (texto = '') => `https://wa.me/${SALON.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;

// Campaña del banner principal según el mes (cámbienla cuando quieran)
export function campanaActual(fecha = new Date()) {
  const mes = fecha.getMonth() + 1;
  if (mes === 11) return { antes: 'Ofertas de', titulo: 'BLACK FRIDAY', tema: 'oscuro' };
  if (mes === 12) return { antes: 'Ofertas de', titulo: 'NAVIDAD', tema: 'navidad' };
  if (mes === 2) return { antes: 'Ofertas de', titulo: 'SAN VALENTÍN', tema: 'rosa' };
  if (mes === 8) return { antes: 'Ofertas del', titulo: 'DÍA DE LA MADRE', tema: 'rosa' };
  return { antes: 'Ofertas de', titulo: 'TEMPORADA', tema: 'rosa' };
}
