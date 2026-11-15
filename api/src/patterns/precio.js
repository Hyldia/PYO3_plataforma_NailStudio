// Patrón Decorator: el precio de una cita se arma envolviendo el precio base
// con "decoradores" que suman o restan: recargo por diseño, cupón de porcentaje o de monto.
// Cada decorador agrega su línea al detalle, así la vista puede mostrar el desglose.

export class PrecioServicio {
  constructor(servicio) { this.servicio = servicio; }
  total() { return this.servicio.precio_oferta ?? this.servicio.precio; }
  detalle() {
    const lineas = [{ concepto: this.servicio.nombre, monto: this.servicio.precio }];
    if (this.servicio.precio_oferta != null) lineas.push({ concepto: 'Oferta', monto: this.servicio.precio_oferta - this.servicio.precio });
    return lineas;
  }
}

class DecoradorPrecio {
  constructor(componente) { this.componente = componente; }
  total() { return this.componente.total(); }
  detalle() { return this.componente.detalle(); }
}

export class RecargoDiseno extends DecoradorPrecio {
  constructor(componente, recargo) { super(componente); this.recargo = recargo || 0; }
  total() { return super.total() + this.recargo; }
  detalle() { return this.recargo ? [...super.detalle(), { concepto: 'Diseño personalizado', monto: this.recargo }] : super.detalle(); }
}

export class CuponPorcentaje extends DecoradorPrecio {
  constructor(componente, cupon) { super(componente); this.cupon = cupon; }
  descuento() { return Math.round(super.total() * this.cupon.valor / 100); }
  total() { return super.total() - this.descuento(); }
  detalle() { return [...super.detalle(), { concepto: `Cupón ${this.cupon.codigo} (${this.cupon.valor} %)`, monto: -this.descuento() }]; }
}

export class CuponMonto extends DecoradorPrecio {
  constructor(componente, cupon) { super(componente); this.cupon = cupon; }
  descuento() { return Math.min(this.cupon.valor, super.total()); }
  total() { return super.total() - this.descuento(); }
  detalle() { return [...super.detalle(), { concepto: `Cupón ${this.cupon.codigo}`, monto: -this.descuento() }]; }
}

// Arma la cadena de decoradores para una cita
export function calcularPrecio(servicio, recargoDiseno = 0, cupon = null) {
  let precio = new PrecioServicio(servicio);
  precio = new RecargoDiseno(precio, recargoDiseno);
  const antesDeCupon = precio.total();
  if (cupon) precio = cupon.tipo === 'porcentaje' ? new CuponPorcentaje(precio, cupon) : new CuponMonto(precio, cupon);
  return { total: precio.total(), descuento: cupon ? antesDeCupon - precio.total() : 0, detalle: precio.detalle() };
}
