import { Logo } from "./Marco";
import phoneArtwork from "../assets/clara-phone-cutout.png";
import phoneArtworkWebp from "../assets/clara-phone-cutout.webp";

/**
 * Las piezas sueltas que comparten la portada y las pantallas del prototipo.
 *
 * Estaban dentro del archivo de la portada. Al mover el prototipo a su propio modulo habrian
 * quedado duplicadas o el modulo del prototipo habria tenido que importar la portada entera, que es
 * justo lo que se queria evitar: que una visita normal descargue la maqueta.
 */

/** Un numero de dinero con cifras tabulares, para que las columnas queden alineadas. */
export const money = (valor) => <span className="money">{valor}</span>;

export function Avatar({ size = "md" }) {
  return (
    <div className={`avatar avatar-${size}`} role="presentation">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="3.3" strokeLinecap="round">
          <path d="M16 3.5v5" /><path d="M16 23.5v5" />
          <path d="M3.5 16h5" /><path d="M23.5 16h5" />
          <path d="m7.2 7.2 3.5 3.5" /><path d="m21.3 21.3 3.5 3.5" />
          <path d="m24.8 7.2-3.5 3.5" /><path d="m10.7 21.3-3.5 3.5" />
        </g>
      </svg>
      <span className="online-dot" />
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", onClick, type = "button" }) {
  return (
    <button type={type} className={`button button-${variant} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function RecorteTelefono({ alt, className = "" }) {
  return (
    <picture>
      <source srcSet={phoneArtworkWebp} type="image/webp" />
      <img
        className={className}
        src={phoneArtwork}
        alt={alt}
        width="776"
        height="1000"
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

export { Logo };
