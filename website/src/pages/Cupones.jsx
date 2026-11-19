// Página de cupones: todos los cupones vigentes a la vista, con su código para copiar.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { dinero } from '../config.js';
import { useTitulo } from '../lib/hooks.js';

const valor = (c) => (c.tipo === 'porcentaje' ? `${c.valor} %` : dinero(c.valor));
const fecha = (f) => new Date(`${f}T12:00:00`).toLocaleDateString('es-CR', { day: 'numeric', month: 'long' });

export function TarjetaCupon({ c }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(c.codigo); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* sin portapapeles */ }
  };
  return (
    <li className="cupon-ticket">
      <div className="cupon-ticket__talon"><strong>{valor(c)}</strong><span>de descuento</span></div>
      <div className="cupon-ticket__cuerpo">
        <p className="cupon-ticket__desc">{c.descripcion}</p>
        <p className="cupon-ticket__reglas">
          {c.minimo > 0 ? `Compras desde ${dinero(c.minimo)}` : 'Sin compra mínima'}
          {c.solo_combos ? ' · solo combos' : ''}
          {c.vence ? ` · hasta el ${fecha(c.vence)}` : ''}
        </p>
        <div className="cupon-ticket__fila">
          <code>{c.codigo}</code>
          <button type="button" className="cupon-ticket__copiar" onClick={copiar}>{copiado ? '¡Copiado!' : 'Copiar código'}</button>
          <Link to={c.solo_combos ? '/servicios?categoria=Combos' : '/servicios'} className="cupon-ticket__usar">Usar ›</Link>
        </div>
      </div>
    </li>
  );
}

// Tira con algunos cupones (en la página de Ofertas)
export function CintaCupones() {
  const [cupones, setCupones] = useState([]);
  useEffect(() => { api.cupones().then(setCupones).catch(() => {}); }, []);
  if (!cupones.length) return null;
  return (
    <section className="cinta-cupones" aria-labelledby="t-cinta-cupones">
      <div className="cinta-cupones__cabeza">
        <h2 id="t-cinta-cupones" className="fila-titulo">Cupones para ahorrar más</h2>
        <Link to="/cupones" className="cinta-cupones__todos">Ver todos los cupones ›</Link>
      </div>
      <ul className="cupones-lista">{cupones.slice(0, 3).map((c) => <TarjetaCupon key={c.codigo} c={c} />)}</ul>
    </section>
  );
}

export default function Cupones() {
  useTitulo('Cupones de descuento');
  const [cupones, setCupones] = useState(null);
  useEffect(() => { api.cupones().then(setCupones).catch(() => setCupones([])); }, []);
  const mejor = cupones?.length ? cupones.reduce((m, c) => (c.tipo === 'porcentaje' && c.valor > (m?.valor || 0) ? c : m), null) : null;

  return (
    <div className="contenedor pagina pagina--resultados">
      <section className="vitrina vitrina--oferta cupones-portada" aria-labelledby="t-cupones">
        <span className="vitrina__burbujas" aria-hidden="true">{Array.from({ length: 8 }, (_, n) => <i key={n} style={{ '--n': n }} />)}</span>
        <div className="vitrina__texto">
          <p className="vitrina__ante">Cupones AH Nails</p>
          <h1 id="t-cupones">Ahorra en tu <em>próxima cita</em></h1>
          <p>Copia el código y pégalo al pagar, en el campo «Código de cupón». Se aplica a servicios y a productos de la tienda.</p>
          {mejor && <p className="cupones-portada__dato">Hasta <strong>{mejor.valor} %</strong> de descuento</p>}
        </div>
        <ol className="cupones-pasos" aria-label="Cómo usar un cupón">
          <li><b>1</b>Copia el código</li>
          <li><b>2</b>Elige tu servicio o producto</li>
          <li><b>3</b>Pégalo al pagar</li>
        </ol>
      </section>

      <h2 className="fila-titulo">Cupones disponibles</h2>
      {cupones === null && <p className="tenue">Cargando cupones…</p>}
      {cupones?.length === 0 && <div className="vacio"><p>Por ahora no hay cupones activos. Vuelve pronto.</p></div>}
      {cupones?.length > 0 && <ul className="cupones-lista">{cupones.map((c) => <TarjetaCupon key={c.codigo} c={c} />)}</ul>}
    </div>
  );
}
