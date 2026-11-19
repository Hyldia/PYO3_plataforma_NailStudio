// CONTROLADOR: administración de productos y pedidos desde el panel.
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { UPLOADS_DIR } from '../db/conexion.js';
import { ProductoModel } from '../models/ProductoModel.js';
import { PedidoModel } from '../models/PedidoModel.js';
import { EspecialistaModel } from '../models/EspecialistaModel.js';
import { getDb } from '../db/conexion.js';

export const productoAdminController = {
  // Nombre: cambiarImagen
  // Descripción: Cambia la foto de un producto.
  // Entrada: El producto y la foto.
  // Salida: El producto actualizado.
  // Objetivo: Mostrar fotos reales.
  cambiarImagen(req, res) {
    const producto = ProductoModel.buscarPorId(req.params.id);
    if (!producto || !req.file) return res.status(400).json({ error: 'Producto o imagen no válidos.' });
    if (producto.imagen && !producto.imagen.startsWith('http')) unlink(join(UPLOADS_DIR, producto.imagen)).catch(() => {});
    ProductoModel.cambiarImagen(producto.id, req.file.filename);
    res.json(ProductoModel.buscarPorId(producto.id));
  },

  // Foto real de una especialista (subida desde el panel)
  // Nombre: fotoEspecialista
  // Descripción: Cambia la foto de una especialista.
  // Entrada: La especialista y la foto.
  // Salida: La especialista actualizada.
  // Objetivo: Poner su cara en el sitio.
  fotoEspecialista(req, res) {
    const e = EspecialistaModel.buscarPorId(req.params.id);
    if (!e || !req.file) return res.status(400).json({ error: 'Especialista o imagen no válidas.' });
    if (e.foto && !e.foto.startsWith('http')) unlink(join(UPLOADS_DIR, e.foto)).catch(() => {});
    getDb().prepare('UPDATE especialistas SET foto = ?, foto_autor = NULL, foto_autor_url = NULL WHERE id = ?').run(req.file.filename, e.id);
    res.json(EspecialistaModel.buscarPorId(e.id));
  },

  // Foto del círculo de una categoría en la portada (se guarda en ajustes como «portada:<categoría>»)
  // Nombre: fotoPortada
  // Descripción: Cambia la foto de portada de una categoría.
  // Entrada: La categoría y la foto.
  // Salida: La foto guardada.
  // Objetivo: Elegir la foto de cada categoría.
  fotoPortada(req, res) {
    const clave = String(req.params.clave || '').slice(0, 60);
    if (!clave || !req.file) return res.status(400).json({ error: 'Elige una imagen.' });
    const anterior = getDb().prepare('SELECT valor FROM ajustes WHERE clave = ?').get(`portada:${clave}`)?.valor;
    if (anterior && !anterior.startsWith('http')) unlink(join(UPLOADS_DIR, anterior)).catch(() => {});
    getDb().prepare('INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor').run(`portada:${clave}`, req.file.filename);
    res.json({ clave, imagen: req.file.filename });
  },
  // Nombre: quitarFotoPortada
  // Descripción: Quita la foto de portada de una categoría.
  // Entrada: La categoría.
  // Salida: Nada.
  // Objetivo: Volver a la foto automática.
  quitarFotoPortada(req, res) {
    const clave = `portada:${String(req.params.clave || '').slice(0, 60)}`;
    const anterior = getDb().prepare('SELECT valor FROM ajustes WHERE clave = ?').get(clave)?.valor;
    if (anterior && !anterior.startsWith('http')) unlink(join(UPLOADS_DIR, anterior)).catch(() => {});
    getDb().prepare('DELETE FROM ajustes WHERE clave = ?').run(clave);
    res.status(204).end();
  },

  // Nombre: listarPedidos
  // Descripción: Lista los pedidos recientes.
  // Entrada: Nada.
  // Salida: La lista de pedidos.
  // Objetivo: Ver lo último vendido.
  listarPedidos: (req, res) => res.json(PedidoModel.listarRecientes())
};
