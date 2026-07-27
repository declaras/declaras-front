/**
 * Una tarea que toma el control un momento y lo devuelve.
 *
 * CUANDO USARLO: algo con principio y fin claro, que necesita atencion completa mientras dura.
 * Consultar la DIAN es el caso: pide un secreto, tarda unos quince segundos y durante esos
 * segundos lo unico que importa es el progreso.
 *
 * CUANDO NO: para mostrar informacion. Ver un documento usa el cajon lateral, que deja la
 * pagina a la vista porque ahi si se esta comparando contra ella.
 *
 * Se cierra con Escape o clicando afuera, pero no mientras la tarea corre: cerrar a media
 * ejecucion dejaria el trabajo andando sin nada que reporte como termino.
 */

import { useEffect } from "react";
import { X } from "lucide-react";

export default function Dialogo({ titulo, descripcion, onCerrar, bloqueado = false, children }) {
  useEffect(() => {
    const alTeclear = (evento) => {
      if (evento.key === "Escape" && !bloqueado) onCerrar();
    };
    globalThis.addEventListener("keydown", alTeclear);
    return () => globalThis.removeEventListener("keydown", alTeclear);
  }, [onCerrar, bloqueado]);

  return (
    <div className="dialogo-fondo" onClick={() => !bloqueado && onCerrar()}>
      <div
        className="dialogo"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="dialogo-top">
          <div>
            <h2 className="dialogo-titulo">{titulo}</h2>
            {descripcion ? <p className="dialogo-descripcion">{descripcion}</p> : null}
          </div>
          {bloqueado ? null : (
            <button className="dialogo-cerrar" onClick={onCerrar} aria-label="Cerrar">
              <X size={17} />
            </button>
          )}
        </header>
        <div className="dialogo-cuerpo">{children}</div>
      </div>
    </div>
  );
}
