// Patrón Strategy: cada método de pago implementa la misma interfaz `cobrar`.
// Patrón Factory: `crearMetodoPago` devuelve la estrategia según el tipo.
// Los cobros son simulados; aquí se conectaría la pasarela real del banco.

// Algoritmo de Luhn: el dígito verificador que traen todas las tarjetas
// Nombre: luhnValido
// Descripción: Revisa si un número de tarjeta es válido.
// Entrada: El número.
// Salida: Sí o no.
// Objetivo: Evitar tarjetas mal escritas.
export function luhnValido(numero) {
  let suma = 0;
  [...numero].reverse().forEach((c, i) => {
    let d = Number(c);
    if (i % 2) { d *= 2; if (d > 9) d -= 9; }
    suma += d;
  });
  return suma % 10 === 0;
}
// Nombre: marcaTarjeta
// Descripción: Dice la marca de la tarjeta.
// Entrada: El número.
// Salida: Visa, Mastercard u otra.
// Objetivo: Mostrar la marca.
export const marcaTarjeta = (n) => (/^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'American Express' : 'Tarjeta');

class PagoTarjeta {
  nombre = 'Tarjeta';
  // Simulación de pasarela: no se guarda el número ni el CVV, solo la marca y los últimos 4 dígitos.
  // Para cobrar de verdad, aquí se llama a la pasarela del banco (la página nunca debe guardar tarjetas).
  // Nombre: cobrar
  // Descripción: Cobra con tarjeta.
  // Entrada: El monto y la tarjeta.
  // Salida: El resultado del cobro.
  // Objetivo: Pagar con tarjeta.
  cobrar(monto, datos = {}) {
    const numero = String(datos.numero || '').replace(/\D/g, '');
    if (!/^\d{13,19}$/.test(numero) || !luhnValido(numero)) return { ok: false, mensaje: 'Revisa el número de tarjeta: no es válido.' };
    const [mes, anio] = [Number(datos.mes), Number(datos.anio)];
    const ahora = new Date();
    if (!mes || !anio || anio < ahora.getFullYear() || (anio === ahora.getFullYear() && mes < ahora.getMonth() + 1)) {
      return { ok: false, mensaje: 'La tarjeta está vencida o falta la fecha de vencimiento.' };
    }
    if (numero.endsWith('0002')) return { ok: false, mensaje: 'El banco rechazó la tarjeta. Prueba con otra o elige SINPE Móvil.' };
    return { ok: true, referencia: `${marcaTarjeta(numero)} •••• ${numero.slice(-4)}`, cobrado: monto };
  }
}

class PagoSinpe {
  nombre = 'SINPE Móvil';
  // Nombre: cobrar
  // Descripción: Registra un pago por SINPE.
  // Entrada: El monto y el comprobante.
  // Salida: El resultado.
  // Objetivo: Pagar con SINPE.
  cobrar(monto, datos = {}) {
    const comprobante = String(datos.comprobante || '').trim();
    if (!/^\d{6,25}$/.test(comprobante)) return { ok: false, mensaje: 'Escribe el número de comprobante de SINPE Móvil (solo números).' };
    // El salón verifica el comprobante; la cita queda pendiente hasta confirmarlo
    return { ok: true, referencia: `SINPE-${comprobante}`, cobrado: monto, requiereVerificacion: true };
  }
}

class PagoEnSalon {
  nombre = 'Pago en el salón';
  // Nombre: cobrar
  // Descripción: Deja el pago para el salón.
  // Entrada: Nada.
  // Salida: El resultado.
  // Objetivo: Pagar en efectivo al llegar.
  cobrar() { return { ok: true, referencia: 'EN-SALON', cobrado: 0, requiereVerificacion: true }; }
}

const METODOS = { tarjeta: PagoTarjeta, sinpe: PagoSinpe, salon: PagoEnSalon };

// Nombre: crearMetodoPago
// Descripción: Elige la forma de pago.
// Entrada: El tipo de pago.
// Salida: El método correcto.
// Objetivo: Cobrar de varias formas (Strategy).
export function crearMetodoPago(tipo) {
  const Clase = METODOS[tipo];
  if (!Clase) throw new Error(`Método de pago no soportado: ${tipo}`);
  return new Clase();
}
