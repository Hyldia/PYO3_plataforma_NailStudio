import { SALON } from '../config.js';

export default function Logo({ claro = false }) {
  return (
    <img
      className={`logo__imagen ${claro ? 'logo__imagen--claro' : ''}`}
      src="/logo.png"
      alt={SALON.nombre}
    />
  );
}