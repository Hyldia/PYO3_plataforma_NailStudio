// MODELO: productos de la tienda, con búsqueda, filtros y orden.
import { getDb } from '../db/conexion.js';
import { AjustesModel } from './AjustesModel.js';

const ORDEN = {
  relevancia: 'stock > 0 DESC, id',
  vendidos: 'stock > 0 DESC, vendidos DESC',
  descuento: 'stock > 0 DESC, (precio_anterior IS NOT NULL) DESC, (precio_anterior - precio) * 1.0 / COALESCE(precio_anterior, precio) DESC',
  calificacion: 'calificacion DESC, resenas DESC',
  'precio-asc': 'precio ASC',
  'precio-desc': 'precio DESC',
  nuevos: 'creado_en DESC, id DESC'
};

export const ProductoModel = {
  // Nombre: buscar
  // Descripción: Busca productos con filtros.
  // Entrada: Búsqueda, categoría, precio y orden.
  // Salida: Los productos.
  // Objetivo: Mostrar la tienda.
  buscar({ q, categoria, min, max, disponibles, ofertas, orden, limite, ids } = {}) {
    const where = ['oculto = 0'];
    const parametros = {};
    // ids=1,2,3: el carrito pide el stock y precio actuales de lo que tiene guardado
    if (ids) {
      const lista = String(ids).split(',').map(Number).filter((id) => id > 0).slice(0, 100);
      where.push(`id IN (${lista.length ? lista.join(',') : 0})`);
    }
    if (categoria && categoria !== 'Todas') { where.push('categoria = @categoria'); parametros.categoria = categoria; }
    if (q && q.trim()) { where.push('(lower(nombre) LIKE @q OR lower(descripcion) LIKE @q OR lower(marca) LIKE @q)'); parametros.q = `%${q.trim().toLowerCase()}%`; }
    if (min) { where.push('precio >= @min'); parametros.min = Number(min); }
    if (max) { where.push('precio <= @max'); parametros.max = Number(max); }
    if (disponibles === '1') where.push('stock > 0');
    if (ofertas === '1') where.push('precio_anterior IS NOT NULL');
    const sql = `SELECT * FROM productos ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${ORDEN[orden] || ORDEN.relevancia}${Number(limite) > 0 ? ` LIMIT ${Math.min(Number(limite), 100)}` : ''}`;
    return getDb().prepare(sql).all(parametros);
  },
  // Nombre: categorias
  // Descripción: Cuenta productos por categoría.
  // Entrada: Nada.
  // Salida: Las categorías.
  // Objetivo: Llenar filtros.
  categorias: () => getDb().prepare('SELECT categoria AS valor, COUNT(*) AS cantidad FROM productos WHERE oculto = 0 GROUP BY categoria ORDER BY categoria').all(),
  // Nombre: buscarPorId
  // Descripción: Busca un producto.
  // Entrada: El número.
  // Salida: El producto o nada.
  // Objetivo: Ver un producto.
  buscarPorId: (id) => getDb().prepare('SELECT * FROM productos WHERE id = ?').get(id),
  // Nombre: buscarPorNombre
  // Descripción: Busca un producto por nombre.
  // Entrada: El nombre.
  // Salida: El producto o nada.
  // Objetivo: Evitar productos repetidos.
  buscarPorNombre: (nombre) => getDb().prepare('SELECT * FROM productos WHERE nombre = ?').get(nombre),

  // Productos de la misma categoría, primero los del mismo tipo y los más vendidos
  // Nombre: relacionados
  // Descripción: Busca productos parecidos.
  // Entrada: El número y cuántos.
  // Salida: Una lista.
  // Objetivo: Sugerir compras.
  relacionados(id, limite = 12) {
    const producto = this.buscarPorId(id);
    if (!producto) return [];
    return getDb().prepare(`SELECT * FROM productos WHERE id != @id AND oculto = 0 AND categoria = @categoria
      ORDER BY (tipo IS @tipo) DESC, vendidos DESC LIMIT @limite`).all({ id: producto.id, categoria: producto.categoria, tipo: producto.tipo, limite: Math.min(Number(limite) || 12, 40) });
  },

  // Variantes: el mismo producto en otros colores o tonos ("Esmalte gel Rojo", "Esmalte gel Nude"...)
  // Nombre: variantes
  // Descripción: Busca otros tonos o tamaños del producto.
  // Entrada: El número.
  // Salida: Las variantes.
  // Objetivo: Elegir color o tamaño.
  variantes(id) {
    const producto = this.buscarPorId(id);
    if (!producto) return [];
    const prefijo = producto.nombre.split(' ').slice(0, 2).join(' ');
    const lista = getDb().prepare(`SELECT id, nombre, color, imagen, tipo, precio, stock FROM productos
      WHERE oculto = 0 AND categoria = ? AND tipo IS ? AND nombre LIKE ? ORDER BY id LIMIT 90`).all(producto.categoria, producto.tipo, `${prefijo} %`);
    if (lista.length < 2) return [];
    // La parte del nombre que comparten todas ("Aceite de cutícula") no se repite en cada opción
    const palabras = lista.map((elemento) => elemento.nombre.split(' '));
    let comun = 0;
    while (palabras.every((palabra) => palabra.length > comun + 1 && palabra[comun] === palabras[0][comun])) comun++;
    return lista.map((elemento, i) => ({ ...elemento, variante: palabras[i].slice(comun).join(' ') }));
  },
  // ----- Panel del salón -----
  // Nombre: validar
  // Descripción: Revisa los datos de un producto.
  // Entrada: Los datos.
  // Salida: Un error o nada.
  // Objetivo: Evitar datos inválidos.
  validar(datos) {
    if (!datos.nombre || String(datos.nombre).trim().length < 2) return 'Escribe el nombre del producto.';
    if (!datos.categoria) return 'Elige la categoría.';
    if (!(Number(datos.precio) > 0)) return 'El precio debe ser mayor que 0.';
    if (datos.precio_anterior && Number(datos.precio_anterior) <= Number(datos.precio)) return 'El precio anterior debe ser mayor que el precio actual (o déjalo vacío si no hay oferta).';
    if (!(Number(datos.stock) >= 0)) return 'El stock no puede ser negativo.';
    return null;
  },
  // Nombre: normalizar
  // Descripción: Ordena los datos de un producto.
  // Entrada: Los datos.
  // Salida: Los datos limpios.
  // Objetivo: Guardar siempre igual.
  normalizar: (datos) => ({
    nombre: String(datos.nombre).trim().slice(0, 120), descripcion: datos.descripcion ? String(datos.descripcion).trim().slice(0, 500) : null,
    categoria: String(datos.categoria).trim(), marca: datos.marca ? String(datos.marca).trim().slice(0, 60) : null,
    precio: Math.round(Number(datos.precio)), precio_anterior: datos.precio_anterior ? Math.round(Number(datos.precio_anterior)) : null,
    stock: Math.floor(Number(datos.stock) || 0), color: datos.color || null, tipo: datos.tipo || null
  }),
  // Nombre: crear
  // Descripción: Crea un producto.
  // Entrada: Los datos.
  // Salida: El producto.
  // Objetivo: Agregar a la tienda.
  crear(datos) {
    const resultado = getDb().prepare(`INSERT INTO productos (nombre, descripcion, categoria, marca, precio, precio_anterior, stock, color, tipo)
      VALUES (@nombre, @descripcion, @categoria, @marca, @precio, @precio_anterior, @stock, @color, @tipo)`).run(datos);
    return this.buscarPorId(resultado.lastInsertRowid);
  },
  // Nombre: actualizar
  // Descripción: Actualiza un producto.
  // Entrada: El número y los datos.
  // Salida: El producto.
  // Objetivo: Editar la tienda.
  actualizar(id, datos) {
    getDb().prepare(`UPDATE productos SET nombre = @nombre, descripcion = @descripcion, categoria = @categoria, marca = @marca,
      precio = @precio, precio_anterior = @precio_anterior, stock = @stock, color = COALESCE(@color, color), tipo = COALESCE(@tipo, tipo) WHERE id = @id`).run({ ...datos, id });
    return this.buscarPorId(id);
  },
  // Si el producto ya está en pedidos, no se borra (se perdería el historial): se oculta de la tienda
  // Nombre: eliminar
  // Descripción: Elimina un producto.
  // Entrada: El número.
  // Salida: Nada.
  // Objetivo: Quitar de la tienda.
  eliminar(id) {
    const db = getDb();
    const usado = db.prepare('SELECT 1 FROM pedido_items WHERE producto_id = ? LIMIT 1').get(id);
    if (usado) { db.prepare('UPDATE productos SET oculto = 1 WHERE id = ?').run(id); return 'oculto'; }
    db.prepare('DELETE FROM productos WHERE id = ?').run(id);
    return 'borrado';
  },
  // Nombre: cambiarImagen
  // Descripción: Cambia la foto de un producto.
  // Entrada: El número y la foto.
  // Salida: Nada.
  // Objetivo: Actualizar la foto.
  cambiarImagen: (id, imagen) => getDb().prepare('UPDATE productos SET imagen = ?, imagen_autor = NULL, imagen_autor_url = NULL WHERE id = ?').run(imagen, id),

  // Nombre: puestoEnCategoria
  // Descripción: Dice en qué lugar de ventas está un producto dentro de su categoría.
  // Entrada: El producto.
  // Salida: El puesto (1 = el más vendido).
  // Objetivo: Mostrar «#1 más vendido en …».
  puestoEnCategoria: (producto) => getDb().prepare('SELECT COUNT(*) + 1 AS n FROM productos WHERE categoria = ? AND vendidos > ?').get(producto.categoria, producto.vendidos).n,

  // Nombre: portadas
  // Descripción: Da una foto por categoría: la que eligió la dueña o la del más vendido con foto.
  // Entrada: Nada.
  // Salida: Un objeto categoría → foto.
  // Objetivo: Decorar los círculos de «Compra por categoría».
  portadas() {
    const db = getDb();
    const foto = (where, ...p) => db.prepare(`SELECT imagen FROM productos WHERE imagen LIKE 'http%' AND ${where} ORDER BY stock > 0 DESC, vendidos DESC LIMIT 1`).get(...p)?.imagen ?? null;
    const mapa = {};
    db.prepare('SELECT DISTINCT categoria FROM productos').all().forEach(({ categoria }) => { mapa[categoria] = foto('categoria = ?', categoria); });
    mapa.rubber = foto("nombre LIKE '%rubber%'");
    mapa.aceite = foto("nombre LIKE 'Aceite%'");
    mapa.Equipos = foto("categoria = 'Equipos' AND nombre LIKE 'Lámpara%'") || mapa.Equipos;
    // La foto que el salón eligió en el panel tiene prioridad
    return { ...mapa, ...AjustesModel.conPrefijo('portada:') };
  }
};
