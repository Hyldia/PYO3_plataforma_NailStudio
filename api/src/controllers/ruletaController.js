// CONTROLADOR: ruleta de premios. El premio se elige en el servidor (no en el navegador)
// y cada premio es un cupón real que se valida al pagar.
import { randomInt } from 'node:crypto';

export const PREMIOS = [
  { etiqueta: '5 %', codigo: 'RULETA5', peso: 30 },
  { etiqueta: '₡1 000', codigo: 'RULETA1000', peso: 18 },
  { etiqueta: '10 %', codigo: 'RULETA10', peso: 16 },
  { etiqueta: 'Otra vez', codigo: null, peso: 14 },
  { etiqueta: '15 %', codigo: 'RULETA15', peso: 8 },
  { etiqueta: '₡3 000', codigo: 'RULETA3000', peso: 6 },
  { etiqueta: '20 %', codigo: 'RULETA20', peso: 3 },
  { etiqueta: '8 %', codigo: 'RULETA8', peso: 5 }
];

export const CUPONES_RULETA = [
  { codigo: 'RULETA5', descripcion: '5 % ganado en la ruleta', tipo: 'porcentaje', valor: 5, minimo: 0 },
  { codigo: 'RULETA8', descripcion: '8 % ganado en la ruleta', tipo: 'porcentaje', valor: 8, minimo: 5000 },
  { codigo: 'RULETA10', descripcion: '10 % ganado en la ruleta', tipo: 'porcentaje', valor: 10, minimo: 8000 },
  { codigo: 'RULETA15', descripcion: '15 % ganado en la ruleta', tipo: 'porcentaje', valor: 15, minimo: 12000 },
  { codigo: 'RULETA20', descripcion: '20 % ganado en la ruleta', tipo: 'porcentaje', valor: 20, minimo: 15000 },
  { codigo: 'RULETA1000', descripcion: '₡1 000 ganados en la ruleta', tipo: 'monto', valor: 1000, minimo: 6000 },
  { codigo: 'RULETA3000', descripcion: '₡3 000 ganados en la ruleta', tipo: 'monto', valor: 3000, minimo: 15000 }
];

const ESPERA = 12 * 3600000;
const giros = new Map();

export const ruletaController = {
  premios: (req, res) => res.json(PREMIOS.map(({ etiqueta }) => etiqueta)),
  // Un giro por persona cada 12 horas (se recuerda por dirección IP mientras el servidor esté encendido)
  girar(req, res) {
    const ip = req.ip || 'x';
    const ultimo = giros.get(ip);
    if (ultimo && Date.now() - ultimo < ESPERA) {
      const horas = Math.ceil((ESPERA - (Date.now() - ultimo)) / 3600000);
      return res.status(429).json({ error: `Ya giraste la ruleta. Vuelve a intentarlo en ${horas} ${horas === 1 ? 'hora' : 'horas'}.` });
    }
    giros.set(ip, Date.now());
    const total = PREMIOS.reduce((s, p) => s + p.peso, 0);
    let n = randomInt(total);
    const indice = PREMIOS.findIndex((p) => (n -= p.peso) < 0);
    const p = PREMIOS[indice];
    if (!p.codigo) giros.delete(ip); // "Otra vez": puede volver a girar
    res.json({ indice, etiqueta: p.etiqueta, codigo: p.codigo, descripcion: CUPONES_RULETA.find((c) => c.codigo === p.codigo)?.descripcion || null });
  }
};
