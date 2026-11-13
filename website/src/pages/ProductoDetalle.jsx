import {useEffect, useState} from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import { useTitulo } from '../lib/hooks.js';
import Foto from '../components/Foto.jsx';

export default function ProductoDetalle() {
    const {id} = useParams();
    const carrito = useCarrito();
    const [producto, setProducto] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    useTitulo(producto?.nombre || 'Producto');

    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setError('');
        setProducto(null);

        api.producto(id)
            .then((p) => { if (vigente) setProducto(p); })
            .catch((e) => { if (vigente) setError(e.message); })
            .finally(() => { if (vigente) setCargando(false); });
        return () => {vigente = false};
    }, [id]);

    if (cargando) return <div className="contenedor pagina">Cargando producto…</div>;
    if(error){
        return(
            <div className="contenedor pagina">
                <p role="alert" className="error">{error}</p>
                <Link to="/tienda">Volver a la tienda</Link>
            </div>
        );
    }
    return(
        <div className="contenedor pagina producto-detalle">
            <Foto
                archivo={producto.imagen}
                alt={producto.nombre}
                className="producto-detalle-foto"
                prioridad
            />
            <section>
                <p className="producto-marca">{producto.marca}</p>
                <h1>{producto.nombre}</h1>
                <p>{producto.descripcion}</p>
                <p className="producto-precio">{dinero(producto.precio)}</p>
                {producto.stock > 0 ? (
                    <button
                        type="button"
                        className="boton"
                        onClick={() => {
                        carrito.agregar(producto);
                        setAviso(`${producto.nombre} se agregó al carrito.`);
                        }}
                    >
                        Agregar al carrito
                    </button>
                    ) : (
                    <p className="agotado">Agotado</p>
                    )}

                    <p role="status" className="aviso">{aviso}</p>
                    <Link to="/tienda">Volver a la tienda</Link>
            </section>
        </div>
    );
}