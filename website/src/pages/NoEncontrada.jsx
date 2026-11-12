import { Link } from 'react-router-dom';
import { useTitulo } from '../lib/hooks.js';

export default function NoEncontrada() {
  useTitulo('Página no encontrada');
  return (
    <div className="contenedor pagina confirmacion">
      <h1>Esta página no existe</h1>
      <p className="tenue">Revisa la dirección o vuelve al inicio.</p>
      <Link to="/" className="boton">Ir al inicio</Link>
    </div>
  );
}
