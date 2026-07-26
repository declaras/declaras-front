/** Lo que un contador debe revisar antes de dar el expediente por bueno. */

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";

import { api } from "./api";
import { useAction } from "./hooks";
import { formatDateTime } from "./formato";
import { ErrorApi } from "./componentes";

/** Explicación en lenguaje llano de los códigos que produce el backend. */
const EXPLICACIONES = {
  DOCUMENT_IDENTITY_MISMATCH:
    "El documento está a nombre de otra persona. Si entra al cálculo, la declaración queda mal.",
  DOCUMENT_UNREADABLE: "El archivo no se pudo leer. Hay que volver a pedirlo.",
  TEXT_ENCODING_DAMAGED:
    "El portal entregó el archivo con caracteres dañados. Es un defecto conocido de la DIAN, no del documento.",
  NO_REPORTED_ITEMS: "La DIAN no tiene conceptos reportados por terceros para este año.",
  RUT_ID_MISMATCH:
    "El NIT y la cédula del RUT no coinciden: la lectura del PDF pudo desincronizarse.",
  DIAN_DOCUMENT_UNAVAILABLE: "La DIAN todavía no publica ese documento.",
  DIAN_PORTAL_UNAVAILABLE: "El portal estaba caído. Se puede volver a intentar.",
};

export default function Pendientes({ caso, onCambio }) {
  const abiertos = caso.flags.filter((f) => !f.resolved_at);
  const resueltos = caso.flags.filter((f) => f.resolved_at);
  const [verResueltos, setVerResueltos] = useState(false);

  if (caso.flags.length === 0) return null;

  return (
    <div className="panel">
      <div className="panel-head">
        <AlertTriangle size={15} style={{ color: abiertos.length ? "var(--red)" : "var(--muted)" }} />
        <h2>Por revisar</h2>
        <span className="count">{abiertos.length}</span>
        <span className="spacer" />
        {resueltos.length > 0 ? (
          <button className="btn-mini" onClick={() => setVerResueltos((v) => !v)}>
            {verResueltos ? "Ocultar" : `Ver ${resueltos.length} resueltos`}
          </button>
        ) : null}
      </div>

      {abiertos.length === 0 ? (
        <p className="panel-note">No queda nada por revisar en este expediente.</p>
      ) : null}

      {abiertos.map((flag) => (
        <Flag key={flag.id} flag={flag} caseId={caso.id} onCambio={onCambio} />
      ))}

      {verResueltos
        ? resueltos.map((flag) => (
            <Flag key={flag.id} flag={flag} caseId={caso.id} onCambio={onCambio} />
          ))
        : null}
    </div>
  );
}

function Flag({ flag, caseId, onCambio }) {
  const [nota, setNota] = useState("");
  const [abriendoNota, setAbriendoNota] = useState(false);
  const accion = useAction(() => api.resolveFlag(caseId, flag.id, nota.trim() || null));

  const resolver = async () => {
    const listo = await accion.run();
    if (listo) {
      setAbriendoNota(false);
      onCambio();
    }
  };

  return (
    <div className={`flag ${flag.resolved_at ? "resuelto" : ""}`}>
      <div className={`flag-marca flag-${flag.severity}`} />
      <div className="flag-cuerpo">
        <p className="flag-mensaje">{flag.message}</p>
        {EXPLICACIONES[flag.code] ? (
          <p className="flag-meta" style={{ marginBottom: 4 }}>
            {EXPLICACIONES[flag.code]}
          </p>
        ) : null}
        <p className="flag-meta">
          <span className="flag-codigo">{flag.code}</span> · {formatDateTime(flag.raised_at)}
          {flag.resolved_at ? ` · resuelto ${formatDateTime(flag.resolved_at)}` : ""}
          {flag.resolution_note ? ` · "${flag.resolution_note}"` : ""}
        </p>
        <ErrorApi error={accion.error} />

        {abriendoNota && !flag.resolved_at ? (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              className="campo"
              style={{ margin: 0, flex: 1 }}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Qué se revisó (opcional)"
            />
            <button className="btn-mini primario" onClick={resolver} disabled={accion.running}>
              {accion.running ? "Guardando…" : "Confirmar"}
            </button>
          </div>
        ) : null}
      </div>

      {!flag.resolved_at && !abriendoNota ? (
        <button className="btn-mini" onClick={() => setAbriendoNota(true)}>
          <Check size={12} />
          Marcar revisado
        </button>
      ) : null}
    </div>
  );
}
