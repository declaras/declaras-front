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

/**
 * Un error, dicho de forma que se pueda hacer algo con el.
 *
 * El backend manda un codigo estable y un mensaje. El codigo es lo confiable, asi que cuando se
 * conoce se usa un texto escrito para la persona; el mensaje del backend queda como respaldo
 * para los que no se conocen todavia. Antes se mostraba siempre el mensaje crudo, y en una falla
 * inesperada eso llego a ser el texto de la libreria HTTP con una URL de la DIAN adentro: quien
 * lo leia no sabia ni si la clave era correcta.
 */
const QUE_SIGNIFICA = {
  DIAN_INVALID_CREDENTIALS: (d) =>
    "La clave del portal de la DIAN no es correcta." +
    (d.attempts_remaining
      ? ` Queda${d.attempts_remaining === 1 ? "" : "n"} ${d.attempts_remaining} intento${d.attempts_remaining === 1 ? "" : "s"} antes de que la DIAN bloquee la cuenta.`
      : ""),
  DIAN_LOGIN_ATTEMPTS_EXHAUSTED:
    "Se agotaron los intentos. Espera un momento antes de volver a probar, para que la DIAN no bloquee la cuenta.",
  DIAN_ACCOUNT_LOCKED:
    "La DIAN bloqueó la cuenta por intentos fallidos. Hay que desbloquearla en el portal antes de seguir.",
  DIAN_IDENTITY_CHALLENGE:
    "La DIAN pidió verificar la identidad del titular antes de dar acceso.",
  DIAN_PORTAL_UNAVAILABLE:
    "El portal de la DIAN no está respondiendo. No es algo de tu lado: se puede volver a intentar en un rato.",
  DIAN_PORTAL_TIMEOUT: "El portal de la DIAN se demoró demasiado. Se puede volver a intentar.",
  DIAN_RATE_LIMITED: "La DIAN está limitando las consultas. Hay que esperar unos minutos.",
  DIAN_SESSION_EXPIRED: "La sesión con la DIAN se venció. Hay que volver a empezar la consulta.",
  DIAN_DOCUMENT_UNAVAILABLE: "La DIAN todavía no tiene ese documento publicado.",
  NETWORK_ERROR: "No se pudo contactar el servicio.",
  CASE_ALREADY_EXISTS: "Ya existe una declaración de esa persona para ese año.",
};

export function ErrorApi({ error, children }) {
  if (!error) return null;
  const conocido = QUE_SIGNIFICA[error.code];
  const texto =
    typeof conocido === "function" ? conocido(error.details ?? {}) : (conocido ?? error.message);

  return (
    <div className="estado-error">
      <AlertTriangle size={15} style={{ verticalAlign: "-2px", marginRight: 7 }} />
      {texto}
      {/* El codigo solo aparece cuando no hay una explicacion escrita: ahi si sirve, porque es
          lo que permite reportar el problema. Cuando la hay, es ruido. */}
      {conocido ? null : <code>{error.code}</code>}
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
