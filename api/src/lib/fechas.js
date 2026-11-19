// AYUDANTE (Fabricación pura): cuentas con fechas que usan varios modelos (quincenas, días entre dos fechas).
// Nombre: iso
// Descripción: Convierte una fecha a texto año-mes-día.
// Entrada: La fecha.
// Salida: El texto.
// Objetivo: Trabajar con fechas.
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Nombre: deIso
// Descripción: Convierte un texto a fecha.
// Entrada: El texto año-mes-día.
// Salida: La fecha.
// Objetivo: Trabajar con fechas.
export const deIso = (f) => new Date(`${f}T12:00:00`);
// Nombre: hoyIso
// Descripción: Da la fecha de hoy en texto.
// Entrada: Nada.
// Salida: La fecha.
// Objetivo: Usar el día actual.
export const hoyIso = () => iso(new Date());

// Quincenas: del 1 al 15 (se paga el 15) y del 16 al último día (se paga ese último día).
// Si el día de pago cae domingo, se paga el sábado anterior.
// Nombre: quincenaDe
// Descripción: Calcula la quincena de una fecha.
// Entrada: La fecha.
// Salida: Inicio y fin de la quincena.
// Objetivo: Pagar al equipo cada 15 días.
export function quincenaDe(fecha = hoyIso()) {
  const d = deIso(fecha);
  const a = d.getFullYear();
  const m = d.getMonth();
  const ultimo = new Date(a, m + 1, 0).getDate();
  const primera = d.getDate() <= 15;
  const desde = iso(new Date(a, m, primera ? 1 : 16));
  const hasta = iso(new Date(a, m, primera ? 15 : ultimo));
  const pago = deIso(hasta);
  if (pago.getDay() === 0) pago.setDate(pago.getDate() - 1);
  return { desde, hasta, diaPago: iso(pago) };
}
// Nombre: quincenaAnterior
// Descripción: Calcula la quincena anterior.
// Entrada: La fecha.
// Salida: Inicio y fin.
// Objetivo: Ver el pago pasado.
export const quincenaAnterior = (fecha = hoyIso()) => { const d = deIso(quincenaDe(fecha).desde); d.setDate(d.getDate() - 1); return quincenaDe(iso(d)); };

// Nombre: diasEntre
// Descripción: Lista los días entre dos fechas.
// Entrada: Desde y hasta.
// Salida: La lista de días.
// Objetivo: Contar días trabajados.
export function diasEntre(desde, hasta) {
  const lista = [];
  for (const d = deIso(desde); iso(d) <= hasta; d.setDate(d.getDate() + 1)) lista.push(iso(d));
  return lista;
}
// Nombre: trabajaPorHorario
// Descripción: Revisa si una especialista trabaja ese día.
// Entrada: La especialista y la fecha.
// Salida: Sí o no.
// Objetivo: Saber sus días de trabajo.
export const trabajaPorHorario = (e, fecha) => String(e.dias || '').split(',').map(Number).includes(deIso(fecha).getDay() || 7);
