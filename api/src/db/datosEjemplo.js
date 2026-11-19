// Datos de ejemplo realistas: unas 200 citas y 50 pedidos de clientas ficticias,
// repartidos en los últimos dos meses y las próximas dos semanas.
// Sirven para la demo y para que el panel y la base de datos no se vean vacíos.
// Los nombres y teléfonos son inventados.
import { HORARIOS, PORCENTAJE_ADELANTO } from '../models/CitaModel.js';
import { DisenoBuilder, OPCIONES } from '../patrones/constructorDiseno.js';

const NOMBRES = ['María', 'Ana', 'Valeria', 'Daniela', 'Sofía', 'Camila', 'Fernanda', 'Gabriela', 'Andrea', 'Paola',
  'Natalia', 'Carolina', 'Mariana', 'Laura', 'Melissa', 'Karla', 'Tatiana', 'Priscilla', 'Yesenia', 'Rebeca',
  'Jimena', 'Raquel', 'Silvia', 'Hellen', 'Katherine', 'Nicole', 'Fiorella', 'Adriana', 'Stephanie', 'Lucía'];
const APELLIDOS = ['Rodríguez', 'Jiménez', 'Mora', 'Vargas', 'Rojas', 'Solís', 'Araya', 'Castro', 'Quesada', 'Chaves',
  'Alfaro', 'Ramírez', 'Salazar', 'Brenes', 'Calderón', 'Villalobos', 'Monge', 'Arias', 'Cordero', 'Fallas'];
const NOTAS = [null, null, null, null, 'Tengo una uña quebrada en la mano derecha.', 'Prefiero la francesa delgada.',
  'Es para una boda el sábado.', 'Alérgica al acetona fuerte, por favor usar removedor suave.', 'Quiero algo discreto para el trabajo.',
  'Traigo foto de referencia en el celular.', 'Es mi cumpleaños, quiero algo especial.'];

// Generador pseudoaleatorio con semilla: siempre produce los mismos datos
// Nombre: crearAzar
// Descripción: Crea un generador de azar con semilla.
// Entrada: Una semilla.
// Salida: Funciones para elegir al azar.
// Objetivo: Datos de ejemplo repetibles.
function crearAzar(semilla) {
  let s = semilla;
  // Nombre: r
  // Descripción: Da un número al azar (siempre la misma serie).
  // Entrada: Nada.
  // Salida: Un número entre 0 y 1.
  // Objetivo: Crear datos de ejemplo iguales cada vez.
  const r = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  // Nombre: entero
  // Descripción: Da un número entero al azar entre dos valores.
  // Entrada: El mínimo y el máximo.
  // Salida: Un número.
  // Objetivo: Variar los datos de ejemplo.
  // Nombre: elegir
  // Descripción: Elige un elemento al azar de una lista.
  // Entrada: La lista.
  // Salida: Un elemento.
  // Objetivo: Variar los datos de ejemplo.
  // Nombre: prob
  // Descripción: Decide al azar si algo pasa.
  // Entrada: La probabilidad (0 a 1).
  // Salida: Sí o no.
  // Objetivo: Variar los datos de ejemplo.
  return { r, entero: (a, b) => a + Math.floor(r() * (b - a + 1)), elegir: (l) => l[Math.floor(r() * l.length)], prob: (p) => r() < p };
}

// Nombre: aISO
// Descripción: Convierte una fecha a texto año-mes-día.
// Entrada: La fecha.
// Salida: El texto de la fecha.
// Objetivo: Guardar fechas en la base de datos.
const aISO = (d) => d.toISOString().slice(0, 10);
// Nombre: fechaHora
// Descripción: Convierte una fecha a texto con hora.
// Entrada: La fecha.
// Salida: El texto con fecha y hora.
// Objetivo: Guardar fechas en la base de datos.
const fechaHora = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

// Nombre: cargarDatosEjemplo
// Descripción: Llena pedidos y ventas de ejemplo.
// Entrada: La base de datos.
// Salida: Nada.
// Objetivo: Que el panel tenga datos para probar.
export function cargarDatosEjemplo(db) {
  const hecho = db.prepare("SELECT valor FROM ajustes WHERE clave = 'datos_ejemplo'").get();
  if (hecho || db.prepare('SELECT COUNT(*) AS n FROM citas').get().n > 0) return false;

  const az = crearAzar(20261114);
  const servicios = db.prepare('SELECT * FROM servicios WHERE activo = 1').all();
  const especialistas = db.prepare('SELECT * FROM especialistas').all();
  const productos = db.prepare('SELECT * FROM productos').all();
  const fotos = db.prepare('SELECT id FROM fotos').all().map((f) => f.id);
  if (!servicios.length || !especialistas.length || !productos.length) return false;

  // 60 clientas que vuelven varias veces, como en un salón real
  const clientas = Array.from({ length: 60 }, () => {
    const nombre = `${az.elegir(NOMBRES)} ${az.elegir(APELLIDOS)} ${az.elegir(APELLIDOS)}`;
    const telefono = `${az.elegir(['6', '7', '8'])}${az.entero(100, 999)} ${az.entero(1000, 9999)}`;
    const usuario = nombre.split(' ').slice(0, 2).join('.').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return { nombre, telefono, email: az.prob(0.6) ? `${usuario}${az.entero(1, 99)}@${az.elegir(['gmail.com', 'hotmail.com', 'yahoo.com'])}` : null };
  });

  const insDiseno = db.prepare(`INSERT INTO disenos (forma, largo, color, acabado, decoracion, acento, notas, foto_ref_id, precio, creado_en)
    VALUES (@forma, @largo, @color, @acabado, @decoracion, @acento, @notas, @fotoRefId, @precio, @creado)`);
  const insCita = db.prepare(`INSERT INTO citas (servicio_id, especialista_id, diseno_id, foto_ref_id, cliente_nombre, cliente_telefono,
    cliente_email, notas, fecha, hora, estado, total, anticipo, metodo_pago, creado_en)
    VALUES (@servicio, @especialista, @diseno, @fotoRef, @nombre, @telefono, @email, @notas, @fecha, @hora, @estado, @total, @anticipo, @metodo, @creado)`);
  const insRec = db.prepare('INSERT INTO recordatorios (cita_id, canal, enviar_en, enviado) VALUES (?, ?, ?, ?)');
  const insPedido = db.prepare(`INSERT INTO pedidos (cliente_nombre, cliente_telefono, cliente_email, total, estado, metodo_pago, creado_en)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insItem = db.prepare('INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)');

  const ocupado = new Set();
  const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
  const METODOS = [['SINPE Móvil', 0.55], ['Tarjeta', 0.25], ['Pago en el salón', 0.2]];
  // Nombre: metodoAzar
  // Descripción: Elige al azar una forma de pago.
  // Entrada: Nada.
  // Salida: La forma de pago.
  // Objetivo: Variar los pedidos de ejemplo.
  const metodoAzar = () => { let x = az.r(); for (const [m, p] of METODOS) { if ((x -= p) < 0) return m; } return 'SINPE Móvil'; };

  db.transaction(() => {
    // ---- Citas ----
    let citas = 0;
    while (citas < 200) {
      const dia = new Date(hoy); dia.setDate(dia.getDate() + az.entero(-60, 14));
      if (dia.getDay() === 0) continue; // domingo cerrado
      const fecha = aISO(dia);
      const hora = az.elegir(dia.getDay() === 6 ? HORARIOS.slice(0, 6) : HORARIOS);
      const esp = az.elegir(especialistas);
      if (ocupado.has(`${esp.id}|${fecha}|${hora}`)) continue;

      const servicio = az.elegir(servicios);
      const clienta = az.elegir(clientas);
      const pasada = dia < hoy;
      const creado = new Date(dia); creado.setDate(creado.getDate() - az.entero(1, 12));

      // 45 % de las citas traen un diseño armado en la web
      let disenoId = null; let recargo = 0;
      if (servicio.categoria !== 'Pies' && az.prob(0.45)) {
        const d = new DisenoBuilder()
          .forma(az.elegir(OPCIONES.formas)).largo(az.elegir(OPCIONES.largos)).color(az.elegir(OPCIONES.colores))
          .acabado(az.elegir(OPCIONES.acabados)).decoracion(az.elegir(OPCIONES.decoraciones)).acento(az.prob(0.25))
          .referencia(fotos.length && az.prob(0.3) ? az.elegir(fotos) : null).build();
        disenoId = insDiseno.run({ ...d, acento: d.acento ? 1 : 0, creado: fechaHora(creado) }).lastInsertRowid;
        recargo = d.precio;
      }

      const metodo = metodoAzar();
      const total = servicio.precio + recargo;
      const anticipo = metodo === 'Pago en el salón' ? 0 : Math.round(total * PORCENTAJE_ADELANTO);
      let estado;
      if (pasada) estado = az.prob(0.1) ? 'cancelada' : 'completada';
      else estado = metodo === 'Pago en el salón' || az.prob(0.15) ? 'pendiente' : 'confirmada';
      if (estado !== 'cancelada') ocupado.add(`${esp.id}|${fecha}|${hora}`);

      const id = insCita.run({
        servicio: servicio.id, especialista: esp.id, diseno: disenoId, fotoRef: !disenoId && fotos.length && az.prob(0.15) ? az.elegir(fotos) : null,
        nombre: clienta.nombre, telefono: clienta.telefono, email: clienta.email, notas: az.elegir(NOTAS),
        fecha, hora, estado, total, anticipo, metodo, creado: fechaHora(creado)
      }).lastInsertRowid;

      if (estado !== 'cancelada') {
        const cita = new Date(`${fecha}T${hora}:00`);
        for (const horas of [24, 2]) {
          const envio = new Date(cita.getTime() - horas * 3600 * 1000);
          insRec.run(id, 'whatsapp', envio.toISOString(), envio < new Date() ? 1 : 0);
        }
      }
      citas++;
    }

    // ---- Pedidos de la tienda ----
    for (let i = 0; i < 50; i++) {
      const clienta = az.elegir(clientas);
      const fecha = new Date(hoy); fecha.setDate(fecha.getDate() - az.entero(0, 60)); fecha.setHours(az.entero(8, 20), az.entero(0, 59));
      const dias = (hoy - fecha) / 86400000;
      const lineas = [];
      for (let k = az.entero(1, 3); k > 0; k--) {
        const p = az.elegir(productos);
        if (!lineas.some((l) => l.p.id === p.id)) lineas.push({ p, cantidad: az.entero(1, 2) });
      }
      const total = lineas.reduce((s, l) => s + l.p.precio * l.cantidad, 0);
      const estado = dias > 5 ? 'completado' : dias > 1 ? 'listo' : 'recibido';
      const pedidoId = insPedido.run(clienta.nombre, clienta.telefono, clienta.email, total, estado,
        az.prob(0.7) ? 'SINPE Móvil' : 'Pago en el salón', fechaHora(fecha)).lastInsertRowid;
      lineas.forEach((l) => insItem.run(pedidoId, l.p.id, l.cantidad, l.p.precio));
    }

    // Visitas a las fotos, para que «Más vistos» tenga sentido
    const vista = db.prepare('UPDATE fotos SET vistas = ? WHERE id = ?');
    fotos.forEach((id) => vista.run(az.entero(5, 320), id));

    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('datos_ejemplo', '1') ON CONFLICT(clave) DO UPDATE SET valor = '1'").run();
  })();
  return true;
}
