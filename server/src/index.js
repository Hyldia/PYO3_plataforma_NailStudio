import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed } from './db/seed.js';
import { UPLOADS_DIR } from './db/connection.js';
import catalogo from './routes/catalogo.js';
import fotos from './routes/fotos.js';
import disenos from './routes/disenos.js';
import citas from './routes/citas.js';
import pedidos from './routes/pedidos.js';
import admin from './routes/admin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

if (seed()) console.log('Base de datos vacía: se cargaron los datos iniciales.');

app.use(cors());
app.use(express.json());

// Fotos subidas desde el panel (galería y productos)
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

app.use('/api', catalogo);
app.use('/api/fotos', fotos);
app.use('/api/disenos', disenos);
app.use('/api/citas', citas);
app.use('/api/pedidos', pedidos);
app.use('/api/admin', admin);

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use('/api', (err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 400).json({ error: err.message || 'Algo salió mal.' });
});

// En producción el mismo servidor entrega el sitio React compilado
const dist = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/(api|uploads)).*/, (req, res) => res.sendFile(join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`Nailé escuchando en http://localhost:${PORT}`));
