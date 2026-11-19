// Patrón Strategy: cómo se le paga a cada especialista.
// · Comisión: un porcentaje de lo que vendió en sus citas atendidas.
// · Base + comisión: un monto fijo por quincena más un porcentaje de lo vendido.
// Todas tienen el mismo método calcular(); crearEsquemaPago() (Factory) elige la correcta.
class PagoPorComision {
  nombre = 'Comisión';
  // Nombre: calcular
  // Descripción: Calcula el pago solo por comisión.
  // Entrada: Lo vendido y el porcentaje.
  // Salida: El pago.
  // Objetivo: Pagar a la especialista.
  calcular({ vendido, comision }) {
    // Ej.: vendió ₡100 000 con 65 % → se le pagan ₡65 000 y el salón se queda ₡35 000
    const porComision = Math.round(vendido * (comision / 100));
    return { base: 0, porComision, total: porComision };
  }
}

class PagoBaseMasComision {
  nombre = 'Base + comisión';
  // Nombre: calcular
  // Descripción: Calcula el pago con salario y comisión.
  // Entrada: Lo vendido, porcentaje y salario.
  // Salida: El pago.
  // Objetivo: Pagar a la especialista.
  calcular({ vendido, comision, salarioBase }) {
    // Monto fijo de la quincena + su porcentaje de lo que vendió
    const porComision = Math.round(vendido * (comision / 100));
    return { base: salarioBase, porComision, total: salarioBase + porComision };
  }
}

const ESQUEMAS = { comision: PagoPorComision, base_comision: PagoBaseMasComision };
export const NOMBRES_ESQUEMA = { comision: 'Comisión', base_comision: 'Base + comisión' };

// Nombre: crearEsquemaPago
// Descripción: Elige la forma de pago de la especialista.
// Entrada: El tipo.
// Salida: El cálculo correcto.
// Objetivo: Pagar según el acuerdo (Strategy).
export function crearEsquemaPago(tipo) {
  const Clase = ESQUEMAS[tipo] || PagoPorComision;
  return new Clase();
}
