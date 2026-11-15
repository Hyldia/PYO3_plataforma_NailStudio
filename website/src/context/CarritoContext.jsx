// Patrón Observer: los componentes que usan useCarrito() se actualizan
// automáticamente cuando el carrito cambia (por ejemplo, la insignia del menú).
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

const CarritoContext = createContext(null);
const CLAVE = 'naile-carrito';

function reducer(items, accion) {
  switch (accion.tipo) {
    case 'agregar': {
      // La clave junta producto y variante: el mismo press-on con dos diseños son dos líneas
      const { producto, opciones = {} } = accion;
      const clave = `${producto.id}|${opciones.detalle || ''}`;
      const cantidad = Math.max(1, Number(opciones.cantidad) || 1);
      const existe = items.find((i) => i.clave === clave);
      // Lo que es para una sola persona (un press-on con un diseño) no se suma: se queda en 1
      if (existe) return items.map((i) => (i.clave === clave ? { ...i, cantidad: i.unico ? 1 : i.cantidad + cantidad } : i));
      return [...items, { ...producto, ...opciones, imagen: opciones.imagen ?? producto.imagen, clave, productoId: producto.id, cantidad, seleccionado: true }];
    }
    case 'agregarCitas':
      // Cada cita es una persona con un diseño: cantidad 1, nunca se suman
      return [...items, ...accion.citas.map((c, n) => ({ ...c, tipo: 'cita', clave: `cita|${Date.now()}|${n}`, cantidad: 1, unico: true, seleccionado: true }))];
    case 'cambiar':
      return items
        .map((i) => {
          if (i.clave !== accion.clave) return i;
          const nueva = accion.fijar ?? i.cantidad + accion.delta;
          return { ...i, cantidad: i.unico ? Math.min(1, nueva) : nueva };
        })
        .filter((i) => i.cantidad > 0);
    case 'seleccionar':
      return items.map((i) => (accion.clave === undefined || i.clave === accion.clave ? { ...i, seleccionado: accion.valor } : i));
    case 'quitar':
      return items.filter((i) => i.clave !== accion.clave);
    case 'quitarSeleccionados':
      return items.filter((i) => i.seleccionado === false || i.stock === 0);
    case 'refrescar': {
      // Stock y precio actuales desde el servidor (lo guardado en el navegador puede estar viejo)
      const porId = new Map(accion.productos.map((p) => [p.id, p]));
      return items.map((i) => {
        if (i.tipo === 'cita') return i;
        const p = porId.get(i.productoId ?? i.id);
        return p ? { ...i, stock: p.stock, precio: p.precio, precio_anterior: p.precio_anterior } : i;
      });
    }
    case 'vaciar':
      return [];
    default:
      return items;
  }
}

function cargar() {
  try {
    // Carritos guardados con la versión anterior no tenían "clave"
    return (JSON.parse(localStorage.getItem(CLAVE)) || []).map((i) => ({ productoId: i.id, clave: `${i.id}|`, seleccionado: true, ...i }));
  } catch { return []; }
}

export function CarritoProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, [], cargar);

  useEffect(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch { /* sin almacenamiento */ }
  }, [items]);

  const [abierto, setAbierto] = useState(false);
  const [ultimo, setUltimo] = useState(null);

  const valor = useMemo(() => {
    const elegidos = items.filter((i) => i.seleccionado !== false && i.stock !== 0);
    return {
    items, elegidos, abierto, abrir: () => setAbierto(true), cerrar: () => setAbierto(false),
    cantidad: items.reduce((s, i) => s + i.cantidad, 0),
    total: items.reduce((s, i) => s + i.cantidad * i.precio, 0),
    // Lo que se va a pedir: solo los artículos marcados (como en las tiendas grandes)
    cantidadElegida: elegidos.reduce((s, i) => s + i.cantidad, 0),
    totalElegido: elegidos.reduce((s, i) => s + i.cantidad * i.precio, 0),
    totalSinDescuento: elegidos.reduce((s, i) => s + i.cantidad * (i.precio_anterior || i.precio), 0),
    ultimo,
    agregar: (producto, opciones) => {
      dispatch({ tipo: 'agregar', producto, opciones });
      setUltimo({ nombre: producto.nombre, detalle: opciones?.detalle, marca: Date.now() });
    },
    cambiar: (clave, delta) => dispatch({ tipo: 'cambiar', clave, delta }),
    fijar: (clave, cantidad) => dispatch({ tipo: 'cambiar', clave, fijar: Number(cantidad) }),
    seleccionar: (clave, valor) => dispatch({ tipo: 'seleccionar', clave, valor }),
    seleccionarTodo: (valor) => dispatch({ tipo: 'seleccionar', valor }),
    quitar: (clave) => dispatch({ tipo: 'quitar', clave }),
    quitarSeleccionados: () => dispatch({ tipo: 'quitarSeleccionados' }),
    refrescar: (productos) => dispatch({ tipo: 'refrescar', productos }),
    agregarCitas: (citas) => {
      dispatch({ tipo: 'agregarCitas', citas });
      setUltimo({ nombre: citas.length > 1 ? `${citas.length} citas` : `Cita: ${citas[0].nombre}`, detalle: `${citas[0].fechaTexto}, ${citas[0].hora}`, marca: Date.now() });
    },
    productosElegidos: elegidos.filter((i) => i.tipo !== 'cita'),
    citasElegidas: elegidos.filter((i) => i.tipo === 'cita'),
    vaciar: () => dispatch({ tipo: 'vaciar' })
  };
  }, [items, abierto, ultimo]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export const useCarrito = () => useContext(CarritoContext);
