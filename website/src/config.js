// Datos del salón: cámbialos por los reales. Todo el sitio los lee de aquí.
export const SALON = {
  nombre: 'Nailé',
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
  sinpe: { numero: '0000 0000', nombre: '[Nombre del titular]' }
};

const formato = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });
export const dinero = (monto) => formato.format(monto ?? 0);

export const urlFoto = (archivo) => (archivo ? `/uploads/${archivo}` : null);
export const enlaceWhatsApp = (texto = '') => `https://wa.me/${SALON.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
