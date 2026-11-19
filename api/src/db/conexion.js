// Patrón Singleton: toda la app comparte una única conexión a SQLite.
import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, '..', '..', 'naile.db');

// Carpeta de fotos subidas (en Railway: /data/uploads dentro del volumen)
export const UPLOADS_DIR = process.env.UPLOADS_DIR || join(dirname(DB_PATH), 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

let instancia = null;

// Nombre: getDb
// Descripción: Abre la base de datos una sola vez.
// Entrada: Nada.
// Salida: La conexión a la base de datos.
// Objetivo: Que todo use la misma conexión.
export function getDb() {
  if (!instancia) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    instancia = new Database(DB_PATH);
    instancia.pragma('journal_mode = WAL');
    instancia.pragma('foreign_keys = ON');
    instancia.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));
    migrar(instancia);
  }
  return instancia;
}

// Agrega columnas nuevas a bases de datos creadas con una versión anterior
// Nombre: migrar
// Descripción: Actualiza la base de datos a la versión nueva.
// Entrada: La base de datos.
// Salida: Nada.
// Objetivo: Agregar tablas y columnas sin perder datos.
function migrar(db) {
  const columnas = db.prepare('PRAGMA table_info(fotos)').all().map((fila) => fila.name);
  if (!columnas.includes('autor')) db.exec('ALTER TABLE fotos ADD COLUMN autor TEXT');
  if (!columnas.includes('autor_url')) db.exec('ALTER TABLE fotos ADD COLUMN autor_url TEXT');
  const colProd = db.prepare('PRAGMA table_info(productos)').all().map((fila) => fila.name);
  if (!colProd.includes('color')) db.exec('ALTER TABLE productos ADD COLUMN color TEXT');
  if (!colProd.includes('tipo')) db.exec('ALTER TABLE productos ADD COLUMN tipo TEXT');
  if (!colProd.includes('imagen_autor')) db.exec('ALTER TABLE productos ADD COLUMN imagen_autor TEXT');
  // Nombre: agregar
  // Descripción: Agrega una columna si falta.
  // Entrada: La tabla, la columna y su tipo.
  // Salida: Nada.
  // Objetivo: Actualizar sin errores.
  const agregar = (tabla, col, tipo) => {
    if (!db.prepare(`PRAGMA table_info(${tabla})`).all().some((fila) => fila.name === col)) db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${col} ${tipo}`);
  };
  [['precio_oferta', 'REAL'], ['incluye', 'TEXT'], ['etiqueta', 'TEXT'], ['imagen', 'TEXT'],
   ['es_combo', 'INTEGER NOT NULL DEFAULT 0'], ['destacado', 'INTEGER NOT NULL DEFAULT 0']].forEach(([c, t]) => agregar('servicios', c, t));
  agregar('citas', 'cupon_codigo', 'TEXT');
  agregar('pedido_items', 'detalle', 'TEXT');
  [['bio', 'TEXT'], ['experiencia', 'INTEGER'], ['dias', "TEXT NOT NULL DEFAULT '1,2,3,4,5,6'"], ['hora_inicio', "TEXT NOT NULL DEFAULT '09:00'"],
   ['hora_fin', "TEXT NOT NULL DEFAULT '17:30'"], ['foto_autor', 'TEXT'], ['foto_autor_url', 'TEXT']].forEach(([c, t]) => agregar('especialistas', c, t));
  agregar('citas', 'pedido_id', 'INTEGER');
  agregar('disenos', 'unas', 'TEXT');
  agregar('disenos', 'extras', 'TEXT');
  // Citas a las que la clienta no llegó: qué se decidió (reprogramada o cobrada), cuánto se cobró y quién decidió
  [['decision_inasistencia', 'TEXT'], ['monto_cobrado', 'REAL NOT NULL DEFAULT 0'], ['reprogramada_a', 'INTEGER'], ['decidido_por', 'TEXT']]
    .forEach(([columna, tipo]) => agregar('citas', columna, tipo));
  [['cupon_codigo', 'TEXT'], ['descuento', 'REAL NOT NULL DEFAULT 0'], ['notas', 'TEXT'], ['referencia_pago', 'TEXT']].forEach(([c, t]) => agregar('pedidos', c, t));
  [['precio_anterior', 'REAL'], ['calificacion', 'REAL'], ['resenas', 'INTEGER NOT NULL DEFAULT 0'],
   ['vendidos', 'INTEGER NOT NULL DEFAULT 0']].forEach(([c, t]) => agregar('productos', c, t));
  agregar('citas', 'descuento', 'REAL NOT NULL DEFAULT 0');
  agregar('citas', 'motivo_cancelacion', 'TEXT');
  agregar('productos', 'oculto', 'INTEGER NOT NULL DEFAULT 0');
  agregar('especialistas', 'activa', 'INTEGER NOT NULL DEFAULT 1');
  [['completado_en', 'TEXT'], ['retirado_por', 'TEXT'], ['notas_admin', 'TEXT']].forEach(([c, t]) => agregar('pedidos', c, t));
  [['usuario_id', 'INTEGER'], ['direccion', 'TEXT'], ['costo_envio', 'REAL NOT NULL DEFAULT 0']].forEach(([c, t]) => agregar('pedidos', c, t));
  agregar('citas', 'usuario_id', 'INTEGER');
  // Equipo: estación, forma de pago y acceso al portal de cada especialista
  [['estacion', 'TEXT'], ['esquema_pago', "TEXT NOT NULL DEFAULT 'comision'"], ['comision', 'REAL NOT NULL DEFAULT 65'],
   ['salario_base', 'REAL NOT NULL DEFAULT 0'], ['usuario', 'TEXT'], ['contrasena_hash', 'TEXT']].forEach(([c, t]) => agregar('especialistas', c, t));
  agregar('fotos', 'precio', 'REAL');
  // Citas de muestra: se marcan para que solo ellas usen fotos de muestra de clientas
  if (!db.prepare('PRAGMA table_info(citas)').all().some((fila) => fila.name === 'ejemplo')) {
    db.exec('ALTER TABLE citas ADD COLUMN ejemplo INTEGER NOT NULL DEFAULT 0');
    if (db.prepare("SELECT 1 FROM ajustes WHERE clave = 'datos_ejemplo'").get()) db.exec('UPDATE citas SET ejemplo = 1');
  }
  // Una sola vez: todas las especialistas ganan el 65 % de lo que atienden (el 35 % es del salón)
  if (!db.prepare("SELECT 1 FROM ajustes WHERE clave = 'comision_65'").get()) {
    db.exec("UPDATE especialistas SET esquema_pago = 'comision', comision = 65, salario_base = 0");
    db.prepare("INSERT INTO ajustes (clave, valor) VALUES ('comision_65', '1')").run();
  }
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS especialistas_usuario ON especialistas (usuario) WHERE usuario IS NOT NULL");
  db.exec("UPDATE especialistas SET estacion = 'Estación ' || id WHERE estacion IS NULL");
  // Estados viejos de los pedidos → los del patrón State (recibido, listo, completado, cancelado)
  db.exec(`UPDATE pedidos SET estado = 'completado', completado_en = COALESCE(completado_en, creado_en) WHERE estado = 'entregado';
           UPDATE pedidos SET estado = 'listo' WHERE estado = 'listo para retirar';`);
  if (!colProd.includes('imagen_autor_url')) db.exec('ALTER TABLE productos ADD COLUMN imagen_autor_url TEXT');
}

// Nombre: enTransaccion
// Descripción: Hace varios pasos en la base de datos como uno solo: o se guardan todos o ninguno.
// Entrada: Una función con los pasos.
// Salida: Lo que devuelva esa función.
// Objetivo: Que un pedido con citas nunca quede a medias (los controladores no tocan SQL).
export const enTransaccion = (pasos) => getDb().transaction(pasos)();
