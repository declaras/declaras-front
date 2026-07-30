/**
 * NOTA DE NOMBRE: en `consola.css`, `.panel` ya era una tarjeta con borde y sombra. Este cajon usa
 * el prefijo `.cajon-` para no pisarla: dos componentes distintos no pueden compartir prefijo,
 * aunque los sufijos de hoy no choquen.
 */

/**
 * El cajon que entra por la derecha. Uno solo, para todo lo que se abre encima.
 *
 * POR QUE EXISTE: el visor de documentos ya era un panel asi, y la memoria de calculo necesitaba
 * otro igual. Dos implementaciones del mismo cajon significan dos animaciones que se desincronizan,
 * dos manejos de Escape y dos bloques de CSS que alguien va a tocar solo en uno. El cajon es el
 * mismo; lo que cambia es el contenido.
 *
 * TRES COSAS QUE NO SON DECORACION:
 *
 * `createPortal` al body y no un div anidado. `position: sticky` crea contexto de apilamiento, asi
 * que un encabezado sticky con `z-index: 20` se pinta encima de un cajon con `z-index: 60` si el
 * cajon vive dentro de el. Subir el numero no lo arregla; salir del arbol si.
 *
 * Escape cierra. Cuando se revisan varios documentos seguidos, buscar la X con el mouse cada vez
 * es un paso de mas.
 *
 * El clic en el fondo cierra y el clic adentro no propaga. Sin el `stopPropagation`, seleccionar
 * texto dentro del cajon lo cierra.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Cajon({ titulo, subtitulo, mono, accion, ancho, children, onCerrar }) {
  useEffect(() => {
    const alTeclear = (evento) => evento.key === "Escape" && onCerrar();
    globalThis.addEventListener("keydown", alTeclear);
    return () => globalThis.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  return createPortal(
    <div className="cajon-fondo" onClick={onCerrar}>
      <aside
        className="cajon"
        style={ancho ? { width: `min(${ancho}px, 100%)` } : undefined}
        role="dialog"
        aria-label={titulo}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="cajon-top">
          <div className="cajon-identidad">
            <h2 className="cajon-titulo">{titulo}</h2>
            {subtitulo ? (
            <p className={mono ? "cajon-sub cajon-sub-archivo" : "cajon-sub"}>{subtitulo}</p>
          ) : null}
          </div>
          {accion}
          <button className="cajon-cerrar" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <div className="cajon-cuerpo">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
