import multer from 'multer';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { UPLOADS_DIR } from '../db/connection.js';

const TIPOS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export const subirImagen = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, `${randomUUID()}${TIPOS[file.mimetype] || extname(file.originalname)}`)
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (TIPOS[file.mimetype]) cb(null, true);
    else cb(new Error('Solo se aceptan imágenes JPG, PNG o WebP.'));
  }
});
