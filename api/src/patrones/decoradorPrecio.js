// Patrón Decorator: el precio de una cita se arma envolviendo el precio base
// con "decoradores" que suman o restan: recargo por diseño, cupón de porcentaje o de monto.
// Cada decorador agrega su línea al detalle, así la vista puede mostrar el desglose.

export class PrecioServicio {
  // Nombre: constructor
  // Descripción: Guarda el servicio base.
  // Entrada: El servicio.
  // Salida: Nada.
  // Objetivo: Empezar el cálculo del precio.
  constructor(servicio) { this.servicio = servicio; }
  // Nombre: total
  // Descripción: Da el precio del servicio.
  // Entrada: Nada.
  // Salida: El precio.
  // Objetivo: Base del total.
  total() { return this.servicio.precio_oferta ?? this.servicio.precio; }
  // Nombre: detalle
  // Descripción: Da el detalle del precio.
  // Entrada: Nada.
  // Salida: La lista de cobros.
  // Objetivo: Mostrar el desglose.
  detalle() {
    const lineas = [{ concepto: this.servicio.nombre, monto: this.servicio.precio }];
    if (this.servicio.precio_oferta != null) lineas.push({ concepto: 'Oferta', monto: this.servicio.precio_oferta - this.servicio.precio });
    return lineas;
  }
}

class DecoradorPrecio {
  // Nombre: constructor
  // Descripción: Envuelve otro cálculo de precio.
  // Entrada: El cálculo anterior.
  // Salida: Nada.
  // Objetivo: Sumar extras (Decorator).
  constructor(componente) { this.componente = componente; }
  // Nombre: total
  // Descripción: Da el total del cálculo envuelto.
  // Entrada: Nada.
  // Salida: El total.
  // Objetivo: Pasar el total al siguiente.
  total() { return this.componente.total(); }
  // Nombre: detalle
  // Descripción: Da el detalle del cálculo envuelto.
  // Entrada: Nada.
  // Salida: La lista de cobros.
  // Objetivo: Pasar el detalle al siguiente.
  detalle() { return this.componente.detalle(); }
}

export class RecargoDiseno extends DecoradorPrecio {
  // Nombre: constructor
  // Descripción: Agrega el recargo por diseño.
  // Entrada: El cálculo y el recargo.
  // Salida: Nada.
  // Objetivo: Cobrar el diseño.
  constructor(componente, recargo) { super(componente); this.recargo = recargo || 0; }
  // Nombre: total
  // Descripción: Suma el recargo al total.
  // Entrada: Nada.
  // Salida: El total.
  // Objetivo: Cobrar el diseño.
  total() { return super.total() + this.recargo; }
  // Nombre: detalle
  // Descripción: Agrega el recargo al detalle.
  // Entrada: Nada.
  // Salida: La lista de cobros.
  // Objetivo: Mostrar el recargo.
  detalle() { return this.recargo ? [...super.detalle(), { concepto: 'Diseño personalizado', monto: this.recargo }] : super.detalle(); }
}

export class CuponPorcentaje extends DecoradorPrecio {
  // Nombre: constructor
  // Descripción: Agrega un cupón de porcentaje.
  // Entrada: El cálculo y el cupón.
  // Salida: Nada.
  // Objetivo: Aplicar descuentos.
  constructor(componente, cupon) { super(componente); this.cupon = cupon; }
  // Nombre: descuento
  // Descripción: Calcula el descuento en porcentaje.
  // Entrada: Nada.
  // Salida: El monto a descontar.
  // Objetivo: Aplicar el cupón.
  descuento() { return Math.round(super.total() * this.cupon.valor / 100); }
  // Nombre: total
  // Descripción: Resta el descuento.
  // Entrada: Nada.
  // Salida: El total.
  // Objetivo: Cobrar con descuento.
  total() { return super.total() - this.descuento(); }
  // Nombre: detalle
  // Descripción: Agrega el cupón al detalle.
  // Entrada: Nada.
  // Salida: La lista de cobros.
  // Objetivo: Mostrar el descuento.
  detalle() { return [...super.detalle(), { concepto: `Cupón ${this.cupon.codigo} (${this.cupon.valor} %)`, monto: -this.descuento() }]; }
}

export class CuponMonto extends DecoradorPrecio {
  // Nombre: constructor
  // Descripción: Agrega un cupón de monto fijo.
  // Entrada: El cálculo y el cupón.
  // Salida: Nada.
  // Objetivo: Aplicar descuentos.
  constructor(componente, cupon) { super(componente); this.cupon = cupon; }
  // Nombre: descuento
  // Descripción: Calcula el descuento fijo.
  // Entrada: Nada.
  // Salida: El monto a descontar.
  // Objetivo: Aplicar el cupón.
  descuento() { return Math.min(this.cupon.valor, super.total()); }
  // Nombre: total
  // Descripción: Resta el descuento.
  // Entrada: Nada.
  // Salida: El total.
  // Objetivo: Cobrar con descuento.
  total() { return super.total() - this.descuento(); }
  // Nombre: detalle
  // Descripción: Agrega el cupón al detalle.
  // Entrada: Nada.
  // Salida: La lista de cobros.
  // Objetivo: Mostrar el descuento.
  detalle() { return [...super.detalle(), { concepto: `Cupón ${this.cupon.codigo}`, monto: -this.descuento() }]; }
}

// Arma la cadena de decoradores para una cita
// Nombre: calcularPrecio
// Descripción: Calcula el precio de una cita.
// Entrada: Servicio, recargo y cupón.
// Salida: Total y detalle.
// Objetivo: Cobrar lo justo.
export function calcularPrecio(servicio, recargoDiseno = 0, cupon = null) {
  let precio = new PrecioServicio(servicio);
  precio = new RecargoDiseno(precio, recargoDiseno);
  const antesDeCupon = precio.total();
  if (cupon) precio = cupon.tipo === 'porcentaje' ? new CuponPorcentaje(precio, cupon) : new CuponMonto(precio, cupon);
  return { total: precio.total(), descuento: cupon ? antesDeCupon - precio.total() : 0, detalle: precio.detalle() };
}

// Precio base de un pedido de la tienda: la suma de sus líneas.
// Usa los mismos decoradores de cupón que las citas.
export class PrecioPedido {
  // Nombre: constructor
  // Descripción: Guarda los productos del pedido.
  // Entrada: Las líneas del pedido.
  // Salida: Nada.
  // Objetivo: Empezar el cálculo.
  constructor(lineas) { this.lineas = lineas; }
  // Nombre: total
  // Descripción: Suma los productos.
  // Entrada: Nada.
  // Salida: El total.
  // Objetivo: Base del pedido.
  total() { return this.lineas.reduce((s, l) => s + l.precio * l.cantidad, 0); }
  // Nombre: detalle
  // Descripción: Da el detalle de los productos.
  // Entrada: Nada.
  // Salida: La lista de cobros.
  // Objetivo: Mostrar el desglose.
  detalle() { return [{ concepto: `Artículos (${this.lineas.reduce((s, l) => s + l.cantidad, 0)})`, monto: this.total() }]; }
}

// Nombre: calcularPrecioPedido
// Descripción: Calcula el precio de un pedido.
// Entrada: Los productos y el cupón.
// Salida: Total y detalle.
// Objetivo: Cobrar lo justo.
export function calcularPrecioPedido(lineas, cupon = null) {
  let precio = new PrecioPedido(lineas);
  const subtotal = precio.total();
  if (cupon) precio = cupon.tipo === 'porcentaje' ? new CuponPorcentaje(precio, cupon) : new CuponMonto(precio, cupon);
  return { subtotal, total: precio.total(), descuento: subtotal - precio.total(), detalle: precio.detalle() };
}
