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
function migrar(db) {
  const columnas = db.prepare('PRAGMA table_info(fotos)').all().map((c) => c.name);
  if (!columnas.includes('autor')) db.exec('ALTER TABLE fotos ADD COLUMN autor TEXT');
  if (!columnas.includes('autor_url')) db.exec('ALTER TABLE fotos ADD COLUMN autor_url TEXT');
  const colProd = db.prepare('PRAGMA table_info(productos)').all().map((c) => c.name);
  if (!colProd.includes('color')) db.exec('ALTER TABLE productos ADD COLUMN color TEXT');
  if (!colProd.includes('tipo')) db.exec('ALTER TABLE productos ADD COLUMN tipo TEXT');
  if (!colProd.includes('imagen_autor')) db.exec('ALTER TABLE productos ADD COLUMN imagen_autor TEXT');
  const agregar = (tabla, col, tipo) => {
    if (!db.prepare(`PRAGMA table_info(${tabla})`).all().some((c) => c.name === col)) db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${col} ${tipo}`);
  };
  [['precio_oferta', 'REAL'], ['incluye', 'TEXT'], ['etiqueta', 'TEXT'], ['imagen', 'TEXT'],
   ['es_combo', 'INTEGER NOT NULL DEFAULT 0'], ['destacado', 'INTEGER NOT NULL DEFAULT 0']].forEach(([c, t]) => agregar('servicios', c, t));
  agregar('citas', 'cupon_codigo', 'TEXT');
  agregar('pedido_items', 'detalle', 'TEXT');
  [['bio', 'TEXT'], ['experiencia', 'INTEGER'], ['dias', "TEXT NOT NULL DEFAULT '1,2,3,4,5,6'"], ['hora_inicio', "TEXT NOT NULL DEFAULT '09:00'"],
   ['hora_fin', "TEXT NOT NULL DEFAULT '17:30'"], ['foto_autor', 'TEXT'], ['foto_autor_url', 'TEXT']].forEach(([c, t]) => agregar('especialistas', c, t));
  agregar('citas', 'pedido_id', 'INTEGER');
  [['cupon_codigo', 'TEXT'], ['descuento', 'REAL NOT NULL DEFAULT 0'], ['notas', 'TEXT'], ['referencia_pago', 'TEXT']].forEach(([c, t]) => agregar('pedidos', c, t));
  [['precio_anterior', 'REAL'], ['calificacion', 'REAL'], ['resenas', 'INTEGER NOT NULL DEFAULT 0'],
   ['vendidos', 'INTEGER NOT NULL DEFAULT 0']].forEach(([c, t]) => agregar('productos', c, t));
  agregar('citas', 'descuento', 'REAL NOT NULL DEFAULT 0');
  if (!colProd.includes('imagen_autor_url')) db.exec('ALTER TABLE productos ADD COLUMN imagen_autor_url TEXT');
}
