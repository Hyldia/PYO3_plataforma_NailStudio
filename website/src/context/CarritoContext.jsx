// Patrón Observer: los componentes que usan useCarrito() se actualizan
// automáticamente cuando el carrito cambia (por ejemplo, la insignia del menú).
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

const CarritoContext = createContext(null);
const CLAVE = 'naile-carrito';

// Nombre: reducer
// Descripción: Cambia el carrito según la acción.
// Entrada: Los artículos y la acción.
// Salida: Los artículos nuevos.
// Objetivo: Manejar el carrito en un solo lugar.
function reducer(items, accion) {
  switch (accion.tipo) {
    case 'agregar': {
      // La clave junta producto y variante: el mismo press-on con dos diseños son dos líneas
      const { producto, opciones = {} } = accion;
      const clave = `${producto.id}|${opciones.detalle || ''}`;
      const cantidad = Math.max(1, Number(opciones.cantidad) || 1);
      const existe = items.find((item) => item.clave === clave);
      // Lo que es para una sola persona (un press-on con un diseño) no se suma: se queda en 1
      if (existe) return items.map((item) => (item.clave === clave ? { ...item, cantidad: item.unico ? 1 : item.cantidad + cantidad } : item));
      return [...items, { ...producto, ...opciones, imagen: opciones.imagen ?? producto.imagen, clave, productoId: producto.id, cantidad, seleccionado: true }];
    }
    case 'agregarCitas':
      // Cada cita es una persona con un diseño: cantidad 1, nunca se suman
      return [...items, ...accion.citas.map((cita, numero) => ({ ...cita, tipo: 'cita', clave: `cita|${Date.now()}|${numero}`, cantidad: 1, unico: true, seleccionado: true }))];
    case 'cambiar':
      return items
        .map((item) => {
          if (item.clave !== accion.clave) return item;
          const nueva = accion.fijar ?? item.cantidad + accion.delta;
          return { ...item, cantidad: item.unico ? Math.min(1, nueva) : nueva };
        })
        .filter((item) => item.cantidad > 0);
    case 'seleccionar':
      return items.map((item) => (accion.clave === undefined || item.clave === accion.clave ? { ...item, seleccionado: accion.valor } : item));
    case 'quitar':
      return items.filter((item) => item.clave !== accion.clave);
    case 'quitarSeleccionados':
      return items.filter((item) => item.seleccionado === false || item.stock === 0);
    case 'refrescar': {
      // Stock y precio actuales desde el servidor (lo guardado en el navegador puede estar viejo)
      const porId = new Map(accion.productos.map((producto) => [producto.id, producto]));
      return items.map((item) => {
        if (item.tipo === 'cita') return item;
        const productoGuardado = porId.get(item.productoId ?? item.id);
        return productoGuardado ? { ...item, stock: productoGuardado.stock, precio: productoGuardado.precio, precio_anterior: productoGuardado.precio_anterior } : item;
      });
    }
    case 'vaciar':
      return [];
    default:
      return items;
  }
}

// Nombre: cargar
// Descripción: Lee el carrito guardado.
// Entrada: Nada.
// Salida: Los artículos.
// Objetivo: No perder el carrito.
function cargar() {
  try {
    // Carritos guardados con la versión anterior no tenían "clave"
    return (JSON.parse(localStorage.getItem(CLAVE)) || []).map((item) => ({ productoId: item.id, clave: `${item.id}|`, seleccionado: true, ...item }));
  } catch { return []; }
}

// Nombre: CarritoProvider
// Descripción: Comparte el carrito con todo el sitio.
// Entrada: Las páginas.
// Salida: El proveedor del carrito.
// Objetivo: Usar el carrito en todas partes.
export function CarritoProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, [], cargar);

  useEffect(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch { /* sin almacenamiento */ }
  }, [items]);

  const [abierto, setAbierto] = useState(false);
  const [ultimo, setUltimo] = useState(null);

  const valor = useMemo(() => {
    const elegidos = items.filter((item) => item.seleccionado !== false && item.stock !== 0);
    return {
    // Nombre: abrir
    // Descripción: Abre el carrito.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Mostrarlo.
    // Nombre: cerrar
    // Descripción: Cierra el carrito.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Ocultarlo.
    items, elegidos, abierto, abrir: () => setAbierto(true), cerrar: () => setAbierto(false),
    cantidad: items.reduce((suma, item) => suma + item.cantidad, 0),
    total: items.reduce((suma, item) => suma + item.cantidad * item.precio, 0),
    // Lo que se va a pedir: solo los artículos marcados (como en las tiendas grandes)
    cantidadElegida: elegidos.reduce((suma, elegido) => suma + elegido.cantidad, 0),
    totalElegido: elegidos.reduce((suma, elegido) => suma + elegido.cantidad * elegido.precio, 0),
    totalSinDescuento: elegidos.reduce((suma, elegido) => suma + elegido.cantidad * (elegido.precio_anterior || elegido.precio), 0),
    ultimo,
    // Nombre: agregar
    // Descripción: Agrega algo al carrito.
    // Entrada: El producto y sus opciones.
    // Salida: Nada.
    // Objetivo: Comprar.
    agregar: (producto, opciones) => {
      dispatch({ tipo: 'agregar', producto, opciones });
      setUltimo({ nombre: producto.nombre, detalle: opciones?.detalle, marca: Date.now() });
    },
    // Nombre: cambiar
    // Descripción: Suma o resta cantidad.
    // Entrada: El artículo y cuánto.
    // Salida: Nada.
    // Objetivo: Cambiar cantidades.
    cambiar: (clave, delta) => dispatch({ tipo: 'cambiar', clave, delta }),
    // Nombre: fijar
    // Descripción: Pone una cantidad exacta.
    // Entrada: El artículo y la cantidad.
    // Salida: Nada.
    // Objetivo: Cambiar cantidades.
    fijar: (clave, cantidad) => dispatch({ tipo: 'cambiar', clave, fijar: Number(cantidad) }),
    // Nombre: seleccionar
    // Descripción: Marca o desmarca un artículo.
    // Entrada: El artículo y sí o no.
    // Salida: Nada.
    // Objetivo: Elegir qué pagar.
    seleccionar: (clave, valor) => dispatch({ tipo: 'seleccionar', clave, valor }),
    // Nombre: seleccionarTodo
    // Descripción: Marca o desmarca todo.
    // Entrada: Sí o no.
    // Salida: Nada.
    // Objetivo: Elegir todo de una vez.
    seleccionarTodo: (valor) => dispatch({ tipo: 'seleccionar', valor }),
    // Nombre: quitar
    // Descripción: Quita un artículo.
    // Entrada: El artículo.
    // Salida: Nada.
    // Objetivo: Sacarlo del carrito.
    quitar: (clave) => dispatch({ tipo: 'quitar', clave }),
    // Nombre: quitarSeleccionados
    // Descripción: Quita los marcados.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Limpiar varios a la vez.
    quitarSeleccionados: () => dispatch({ tipo: 'quitarSeleccionados' }),
    // Nombre: refrescar
    // Descripción: Actualiza precios y stock.
    // Entrada: Los productos.
    // Salida: Nada.
    // Objetivo: Tener datos al día.
    refrescar: (productos) => dispatch({ tipo: 'refrescar', productos }),
    // Nombre: agregarCitas
    // Descripción: Agrega citas al carrito.
    // Entrada: Las citas.
    // Salida: Nada.
    // Objetivo: Pagar citas con productos.
    agregarCitas: (citas) => {
      dispatch({ tipo: 'agregarCitas', citas });
      setUltimo({ nombre: citas.length > 1 ? `${citas.length} citas` : `Cita: ${citas[0].nombre}`, detalle: `${citas[0].fechaTexto}, ${citas[0].hora}`, marca: Date.now() });
    },
    productosElegidos: elegidos.filter((elegido) => elegido.tipo !== 'cita'),
    citasElegidas: elegidos.filter((elegido) => elegido.tipo === 'cita'),
    // Nombre: vaciar
    // Descripción: Vacía el carrito.
    // Entrada: Nada.
    // Salida: Nada.
    // Objetivo: Empezar de cero.
    vaciar: () => dispatch({ tipo: 'vaciar' })
  };
  }, [items, abierto, ultimo]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

// Nombre: useCarrito
// Descripción: Usa el carrito en una página.
// Entrada: Nada.
// Salida: El carrito.
// Objetivo: Leer o cambiar el carrito.
export const useCarrito = () => useContext(CarritoContext);
