PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS servicios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  descripcion   TEXT,
  categoria     TEXT NOT NULL,             -- Manos, Pies, Extensiones
  duracion_min  INTEGER NOT NULL,
  precio        REAL NOT NULL,
  precio_oferta REAL,                     -- precio rebajado (NULL si no hay oferta)
  incluye       TEXT,                     -- lista separada por |
  etiqueta      TEXT,                     -- Más pedido, Nuevo, Oferta, Especial
  imagen        TEXT,
  es_combo      INTEGER NOT NULL DEFAULT 0,
  destacado     INTEGER NOT NULL DEFAULT 0,
  activo        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cupones (
  codigo       TEXT PRIMARY KEY,
  descripcion  TEXT NOT NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('porcentaje', 'monto')),
  valor        REAL NOT NULL,
  minimo       REAL NOT NULL DEFAULT 0,      -- compra mínima
  vence        TEXT,                         -- AAAA-MM-DD
  solo_combos  INTEGER NOT NULL DEFAULT 0,
  publico      INTEGER NOT NULL DEFAULT 1,   -- se muestra en la página de servicios
  activo       INTEGER NOT NULL DEFAULT 1,
  usos         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS especialistas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  especialidad  TEXT NOT NULL,
  foto          TEXT
);

-- Galería: fotos reales de trabajos del salón
CREATE TABLE IF NOT EXISTS fotos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  archivo     TEXT NOT NULL,               -- nombre del archivo en /uploads
  titulo      TEXT NOT NULL,
  descripcion TEXT,
  categoria   TEXT NOT NULL,               -- Manicure, Acrílicas, Gel, Pedicure, Nail art
  forma       TEXT,                        -- Almendra, Ovalada, Cuadrada, Stiletto, Coffin
  color       TEXT,                        -- Nude, Rosa, Rojo, ...
  acabado     TEXT,                        -- Brillante, Mate, Chrome, Glitter
  etiquetas   TEXT,                        -- texto libre separado por comas
  destacada   INTEGER NOT NULL DEFAULT 0,
  autor       TEXT,                        -- crédito de la foto (bancos gratuitos)
  autor_url   TEXT,
  vistas      INTEGER NOT NULL DEFAULT 0,
  creado_en   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_fotos_categoria ON fotos (categoria);

CREATE TABLE IF NOT EXISTS disenos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  forma         TEXT NOT NULL,
  largo         TEXT NOT NULL,
  color         TEXT NOT NULL,
  acabado       TEXT NOT NULL,
  decoracion    TEXT NOT NULL,
  acento        INTEGER NOT NULL DEFAULT 0,
  notas         TEXT,
  foto_ref_id   INTEGER REFERENCES fotos(id) ON DELETE SET NULL,
  precio        REAL NOT NULL,
  creado_en     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Las clientas reservan como invitadas: nombre, teléfono y correo
CREATE TABLE IF NOT EXISTS citas (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  servicio_id      INTEGER NOT NULL REFERENCES servicios(id),
  especialista_id  INTEGER NOT NULL REFERENCES especialistas(id),
  diseno_id        INTEGER REFERENCES disenos(id),
  foto_ref_id      INTEGER REFERENCES fotos(id) ON DELETE SET NULL,
  cliente_nombre   TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  cliente_email    TEXT,
  notas            TEXT,
  fecha            TEXT NOT NULL,          -- AAAA-MM-DD
  hora             TEXT NOT NULL,          -- HH:MM
  estado           TEXT NOT NULL DEFAULT 'pendiente',
  total            REAL NOT NULL,
  anticipo         REAL NOT NULL,
  cupon_codigo     TEXT,
  descuento        REAL NOT NULL DEFAULT 0,
  metodo_pago      TEXT NOT NULL,
  creado_en        TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Evita dobles reservas, pero deja reutilizar el horario de una cita cancelada
CREATE UNIQUE INDEX IF NOT EXISTS ux_citas_horario
  ON citas (especialista_id, fecha, hora) WHERE estado != 'cancelada';

CREATE TABLE IF NOT EXISTS recordatorios (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cita_id    INTEGER NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
  canal      TEXT NOT NULL CHECK (canal IN ('correo', 'whatsapp')),
  enviar_en  TEXT NOT NULL,
  enviado    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS productos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  categoria    TEXT NOT NULL,
  marca        TEXT,
  precio       REAL NOT NULL,
  precio_anterior REAL,                 -- precio antes del descuento (NULL si no hay oferta)
  calificacion REAL,                    -- promedio de estrellas (1 a 5)
  resenas      INTEGER NOT NULL DEFAULT 0,
  vendidos     INTEGER NOT NULL DEFAULT 0,
  stock        INTEGER NOT NULL DEFAULT 0,
  imagen       TEXT,
  imagen_autor     TEXT,                -- crédito si la foto es de Unsplash
  imagen_autor_url TEXT,
  color        TEXT,                    -- color de la ilustración cuando no hay foto
  tipo         TEXT,                    -- frasco, lampara, alicate, lima, crema... (ilustración)
  creado_en    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pedidos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_nombre   TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  cliente_email    TEXT,
  entrega          TEXT NOT NULL DEFAULT 'retiro',   -- retiro en el salón
  total            REAL NOT NULL,
  estado           TEXT NOT NULL DEFAULT 'recibido',
  metodo_pago      TEXT NOT NULL,
  creado_en        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pedido_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id        INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id      INTEGER NOT NULL REFERENCES productos(id),
  cantidad         INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario  REAL NOT NULL,
  detalle          TEXT                 -- variante elegida, por ejemplo el diseño del press-on
);

-- Ajustes internos (por ejemplo, qué versión de las fotos de muestra ya se cargó)
CREATE TABLE IF NOT EXISTS ajustes (
  clave  TEXT PRIMARY KEY,
  valor  TEXT
);
