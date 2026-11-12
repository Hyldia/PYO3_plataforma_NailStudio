// Grupo de casillas para filtrar (permite elegir varios valores)
export default function FiltroCasillas({ titulo, opciones = [], seleccion = [], onCambio }) {
  if (!opciones.length) return null;
  const alternar = (valor) =>
    onCambio(seleccion.includes(valor) ? seleccion.filter((v) => v !== valor) : [...seleccion, valor]);
  return (
    <fieldset className="filtro">
      <legend className="filtro__titulo">{titulo}</legend>
      {opciones.map((o) => (
        <label key={o.valor} className="casilla">
          <input type="checkbox" checked={seleccion.includes(o.valor)} onChange={() => alternar(o.valor)} />
          <span>{o.valor}</span>
          <span className="casilla__cantidad" aria-label={`${o.cantidad} fotos`}>{o.cantidad}</span>
        </label>
      ))}
    </fieldset>
  );
}
