/** Piezas compartidas de la aplicacion. */

import { AlertTriangle, Loader2 } from "lucide-react";

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

export function Avatar({ nombre, size = "md" }) {
  const inicial = (nombre ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={`avatar avatar-${size}`} aria-hidden="true">
      {inicial}
    </div>
  );
}
