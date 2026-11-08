// Grupo de botones donde se elige una opción (accesible con teclado y lector de pantalla)
export default function Opciones({ titulo, opciones, valor, onCambio }) {
  return (
    <fieldset className="grupo">
      <legend className="grupo__titulo">{titulo}</legend>
      <div className="pildoras">
        {opciones.map((op) => (
          <button key={op} type="button" className="pildora" aria-pressed={valor === op} onClick={() => onCambio(op)}>
            {op}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
