/** Piezas compartidas de la aplicacion. */

import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

import { api } from "./api";
import { useAction } from "./hooks";

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
  // DIAN_DOCUMENT_UNAVAILABLE NO SE TRADUCE, y es a proposito. El backend lo lanza desde media
  // docena de sitios con mensajes escritos y especificos ("la DIAN no tiene la declaracion del
  // 2024; si la tiene de 2023, 2022..."), y una traduccion generica los tapaba todos con la
  // misma frase. Al escribir el borrador quedaba peor que inutil: decia "la DIAN todavia no
  // tiene ese documento publicado" cuando lo que fallo fue crear el borrador, o sea que
  // apuntaba al lado contrario. Cuando el backend escribe mejor que la tabla, gana el backend.
  NETWORK_ERROR: "No se pudo contactar el servicio.",
  CASE_ALREADY_EXISTS: "Ya existe una declaración de esa persona para ese año.",
};

export function ErrorApi({ error, children }) {
  if (!error) return null;
  const conocido = QUE_SIGNIFICA[error.code];
  const texto =
    typeof conocido === "function" ? conocido(error.details ?? {}) : (conocido ?? error.message);
  // LO QUE RESPONDIO LA DIAN, CUANDO LO DIJO. Es la unica evidencia que distingue "no hay" de
  // "la consulta fallo", y el backend se toma el trabajo de arrastrarla hasta aca; tirarla en
  // la pantalla dejaba a quien opera adivinando con una frase generica.
  const motivo = error.details?.motivo;

  return (
    <div className="estado-error">
      <AlertTriangle size={15} style={{ verticalAlign: "-2px", marginRight: 7 }} />
      {texto}
      {motivo ? <small className="estado-error-motivo">La DIAN respondió: {motivo}</small> : null}
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

/**
 * Vuelve a cruzar el reporte de la DIAN con los documentos del expediente.
 *
 * POR QUE HACE FALTA UN BOTON: el cruce ya se dispara solo despues de consultar la DIAN, que es
 * cuando entran documentos nuevos. Pero un certificado puede llegar despues, subido a mano, y
 * entonces los renglones dejan de corresponder y la liquidacion se bloquea con un mensaje que
 * dice que hay que conciliar — sin ninguna forma de hacerlo desde la pantalla. Eso paso: el
 * metodo existia en el cliente del API y no lo llamaba nadie.
 *
 * ES SEGURO PULSARLO VARIAS VECES. El endpoint reconstruye el cruce completo, preserva las
 * decisiones del contador y repone las provisionales; reemplaza en vez de acumular.
 */
export function Cruzar({ caseId, onCambio }) {
  const accion = useAction(async () => {
    await api.runConciliacion(caseId);
    onCambio?.();
  });

  return (
    <div className="cruce-accion">
      <button className="btn-mini" onClick={() => accion.run()} disabled={accion.running}>
        <RefreshCw size={15} />
        {accion.running ? "Cruzando…" : "Cruzar el reporte de la DIAN"}
      </button>
      {accion.error ? <ErrorApi error={accion.error} /> : null}
    </div>
  );
}

