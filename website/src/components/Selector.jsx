// Grupo de opciones de una sola elección, con radios reales (teclado y lector de pantalla)
export default function Selector({ titulo, nombre, opciones, valor, onCambio, ayuda }) {
  return (
    <fieldset className="selector">
      <legend className="selector__titulo">{titulo}</legend>
      {ayuda && <p className="tenue selector__ayuda">{ayuda}</p>}
      <div className="selector__opciones">
        {opciones.map((op) => (
          <label key={op} className="chip">
            <input type="radio" name={nombre} value={op} checked={valor === op} onChange={() => onCambio(op)} />
            <span>{op}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
