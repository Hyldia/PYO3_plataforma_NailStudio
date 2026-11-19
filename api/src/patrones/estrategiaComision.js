// Patrón Strategy: cómo se le paga a cada especialista.
// · Comisión: un porcentaje de lo que vendió en sus citas atendidas.
// · Base + comisión: un monto fijo por quincena más un porcentaje de lo vendido.
// Todas tienen el mismo método calcular(); crearEsquemaPago() (Factory) elige la correcta.
class PagoPorComision {
  nombre = 'Comisión';
  calcular({ vendido, comision }) {
    const porComision = Math.round(vendido * (comision / 100));
    return { base: 0, porComision, total: porComision };
  }
}

class PagoBaseMasComision {
  nombre = 'Base + comisión';
  calcular({ vendido, comision, salarioBase }) {
    const porComision = Math.round(vendido * (comision / 100));
    return { base: salarioBase, porComision, total: salarioBase + porComision };
  }
}

const ESQUEMAS = { comision: PagoPorComision, base_comision: PagoBaseMasComision };
export const NOMBRES_ESQUEMA = { comision: 'Comisión', base_comision: 'Base + comisión' };

export function crearEsquemaPago(tipo) {
  const Clase = ESQUEMAS[tipo] || PagoPorComision;
  return new Clase();
}
