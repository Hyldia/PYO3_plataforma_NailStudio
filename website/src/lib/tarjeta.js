// Ayudas para el formulario de tarjeta (el servidor vuelve a validar todo)
export const soloNumeros = (v) => String(v).replace(/\D/g, '');
export const formatoTarjeta = (v) => soloNumeros(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
export const marcaTarjeta = (n) => (/^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'American Express' : '');
export function luhn(n) {
  let suma = 0;
  [...n].reverse().forEach((c, i) => { let d = Number(c); if (i % 2) { d *= 2; if (d > 9) d -= 9; } suma += d; });
  return n.length >= 13 && suma % 10 === 0;
}
