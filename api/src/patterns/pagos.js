// Patrón Strategy: cada método de pago implementa la misma interfaz `cobrar`.
// Patrón Factory: `crearMetodoPago` devuelve la estrategia según el tipo.
// Los cobros son simulados; aquí se conectaría la pasarela real del banco.

class PagoTarjeta {
  nombre = 'Tarjeta';
  cobrar(monto, datos = {}) {
    const numero = String(datos.numero || '').replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(numero)) return { ok: false, mensaje: 'Revisa el número de tarjeta: debe tener entre 13 y 19 dígitos.' };
    if (numero.endsWith('0000')) return { ok: false, mensaje: 'El banco rechazó la tarjeta. Prueba con otra o elige SINPE Móvil.' };
    return { ok: true, referencia: `TAR-${Date.now()}`, cobrado: monto };
  }
}

class PagoSinpe {
  nombre = 'SINPE Móvil';
  cobrar(monto, datos = {}) {
    const comprobante = String(datos.comprobante || '').trim();
    if (!/^\d{6,25}$/.test(comprobante)) return { ok: false, mensaje: 'Escribe el número de comprobante de SINPE Móvil (solo números).' };
    // El salón verifica el comprobante; la cita queda pendiente hasta confirmarlo
    return { ok: true, referencia: `SINPE-${comprobante}`, cobrado: monto, requiereVerificacion: true };
  }
}

class PagoEnSalon {
  nombre = 'Pago en el salón';
  cobrar() { return { ok: true, referencia: 'EN-SALON', cobrado: 0, requiereVerificacion: true }; }
}

const METODOS = { tarjeta: PagoTarjeta, sinpe: PagoSinpe, salon: PagoEnSalon };

export function crearMetodoPago(tipo) {
  const Clase = METODOS[tipo];
  if (!Clase) throw new Error(`Método de pago no soportado: ${tipo}`);
  return new Clase();
}
