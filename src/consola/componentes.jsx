/** Piezas compartidas de la consola. */

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { statusLabel } from "./formato";

/** Estado de carga con la forma aproximada del contenido que viene. */
export function Cargando({ filas = 3, texto }) {
  if (texto) {
    return (
      <p className="estado">
        <Loader2 size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} className="spin" />
        {texto}
      </p>
    );
  }
  return (
    <div className="panel-body">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="skeleton" style={{ marginBottom: 10, width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}

/** Error de la API, mostrando el codigo estable para poder reportarlo. */
export function ErrorApi({ error, children }) {
  if (!error) return null;
  return (
    <div className="estado-error">
      <AlertTriangle size={15} style={{ verticalAlign: "-2px", marginRight: 7 }} />
      {error.message} <code>{error.code}</code>
      {children ? <div style={{ marginTop: 10 }}>{children}</div> : null}
    </div>
  );
}

export function Vacio({ children }) {
  return <p className="estado">{children}</p>;
}

/** Etiqueta del estado del expediente, con el color que corresponde a su avance. */
export function ChipEstado({ status }) {
  const tono =
    {
      OPEN: "chip-neutral",
      EXTRACTING: "chip-amber",
      READY_FOR_REVIEW: "chip-forest",
      DRAFT_READY: "chip-green",
      SUBMITTED: "chip-green",
      CLOSED: "chip-neutral",
    }[status] ?? "chip-neutral";

  return (
    <span className={`chip ${tono}`}>
      <span className="chip-dot" />
      {statusLabel(status)}
    </span>
  );
}

/** Contador de pendientes: en verde cuando no hay nada por revisar. */
export function ChipFlags({ count }) {
  if (!count) {
    return (
      <span className="chip chip-green">
        <CheckCircle2 size={12} />
        sin pendientes
      </span>
    );
  }
  return (
    <span className="chip chip-red">
      <AlertTriangle size={12} />
      {count} {count === 1 ? "pendiente" : "pendientes"}
    </span>
  );
}

export function Avatar({ nombre, size = "md" }) {
  const inicial = (nombre ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={`avatar avatar-${size}`} aria-hidden="true">
      {inicial}
    </div>
  );
}
