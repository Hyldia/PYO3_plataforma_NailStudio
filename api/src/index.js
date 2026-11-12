import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed } from './db/seed.js';
import { UPLOADS_DIR } from './db/connection.js';
import api from './routes/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

if (seed()) console.log('Base de datos vacía: se cargaron los datos iniciales.');

app.use(cors());
app.use(express.json());

// Fotos subidas desde el panel (galería y productos)
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

// MVC: rutas → controladores → modelos. La vista es el sitio React (website/).
app.use('/api', api);

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use('/api', (err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 400).json({ error: err.message || 'Algo salió mal.' });
});

// En producción el mismo servidor entrega el sitio React compilado
const dist = join(__dirname, '..', '..', 'website', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/(api|uploads)).*/, (req, res) => res.sendFile(join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`Nailé escuchando en http://localhost:${PORT}`));
