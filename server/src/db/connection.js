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
  }
  return instancia;
}
