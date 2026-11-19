// AYUDANTE (Fabricación pura): cuentas con fechas que usan varios modelos (quincenas, días entre dos fechas).
// Nombre: iso
// Descripción: Convierte una fecha a texto año-mes-día.
// Entrada: La fecha.
// Salida: El texto.
// Objetivo: Trabajar con fechas.
export const iso = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
// Nombre: deIso
// Descripción: Convierte un texto a fecha.
// Entrada: El texto año-mes-día.
// Salida: La fecha.
// Objetivo: Trabajar con fechas.
// Se usa el mediodía para que el cambio de zona horaria nunca mueva la fecha al día anterior
export const deIso = (fecha) => new Date(`${fecha}T12:00:00`);
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
  const dia = deIso(fecha);
  const anio = dia.getFullYear();
  const mesIndice = dia.getMonth();
  // El "día 0" del mes siguiente es el último día de este mes (28, 29, 30 o 31)
  const ultimo = new Date(anio, mesIndice + 1, 0).getDate();
  const primera = dia.getDate() <= 15;
  const desde = iso(new Date(anio, mesIndice, primera ? 1 : 16));
  const hasta = iso(new Date(anio, mesIndice, primera ? 15 : ultimo));
  const pago = deIso(hasta);
  if (pago.getDay() === 0) pago.setDate(pago.getDate() - 1); // domingo → se paga el sábado
  return { desde, hasta, diaPago: iso(pago) };
}
// Nombre: quincenaAnterior
// Descripción: Calcula la quincena anterior.
// Entrada: La fecha.
// Salida: Inicio y fin.
// Objetivo: Ver el pago pasado.
// Un día antes del inicio de esta quincena siempre cae en la quincena anterior
export const quincenaAnterior = (fecha = hoyIso()) => { const dia = deIso(quincenaDe(fecha).desde); dia.setDate(dia.getDate() - 1); return quincenaDe(iso(dia)); };

// Nombre: diasEntre
// Descripción: Lista los días entre dos fechas.
// Entrada: Desde y hasta.
// Salida: La lista de días.
// Objetivo: Contar días trabajados.
export function diasEntre(desde, hasta) {
  const lista = [];
  for (const dia = deIso(desde); iso(dia) <= hasta; dia.setDate(dia.getDate() + 1)) lista.push(iso(dia));
  return lista;
}
// Nombre: trabajaPorHorario
// Descripción: Revisa si una especialista trabaja ese día.
// Entrada: La especialista y la fecha.
// Salida: Sí o no.
// Objetivo: Saber sus días de trabajo.
export const trabajaPorHorario = (especialista, fecha) => String(especialista.dias || '').split(',').map(Number).includes(deIso(fecha).getDay() || 7);
