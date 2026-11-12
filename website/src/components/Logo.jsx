import { SALON } from '../config.js';

// Logo provisional: si el salón tiene su logo, reemplaza este componente por
// <img src="/logo.svg" alt={SALON.nombre} /> con el archivo real en website/public.
export default function Logo({ claro = false }) {
  return (
    <span className={`logo ${claro ? 'logo--claro' : ''}`}>
      <svg aria-hidden="true" viewBox="0 0 40 52" className="logo__marca">
        <path d="M10 48V24c0-9 5-17 10-21 5 4 10 12 10 21v24c0 4-20 4-20 0z" fill="currentColor" />
        <path d="M15 23c0-5 2-9 4-12" stroke="var(--logo-brillo)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
      <span className="logo__texto">{SALON.nombre}</span>
    </span>
  );
}
