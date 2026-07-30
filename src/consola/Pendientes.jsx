/**
 * Lo que hay que resolver antes de presentar.
 *
 * LENGUAJE: aqui no aparece la palabra "flag" ni un codigo interno. Cada aviso dice que pasa y
 * que hacer, en ese orden, porque quien lo lee puede ser la persona que va a firmar la
 * declaracion y no un contador. El codigo sigue existiendo en el sistema y se puede ver en la
 * vista de contador, que es donde sirve para reportar un problema.
 */

import { useState } from "react";

import { api } from "./api";
import { useAction } from "./hooks";
import { formatDate } from "./formato";
import { ErrorApi } from "./componentes";
import { useVista } from "./vista";

/** Que hacer con cada aviso, en lenguaje de quien lo tiene que resolver. */
const QUE_HACER = {
  REPORTED_TO_ANOTHER_PERSON:
    "Confirma si ese valor es tuyo. Si no lo es, quien lo reportó tiene que corregirlo ante la DIAN y no debe entrar a tu declaración.",
  DOCUMENT_IDENTITY_MISMATCH:
    "Este documento es de otra persona. Si entra al cálculo, la declaración queda mal.",
  ANSWER_RECORDED: "Queda registrado. Se puede cambiar si hace falta.",
  DOCUMENT_UNREADABLE: "El archivo llegó dañado. Hay que volver a traerlo del portal.",
  NO_REPORTED_ITEMS: "La DIAN no tiene valores reportados por terceros para este año.",
  RUT_ID_MISMATCH: "El NIT y la cédula del RUT no coinciden. Hay que revisar el documento.",
  DIAN_DOCUMENT_UNAVAILABLE:
    "La DIAN todavía no publica ese documento. Se puede volver a consultar más adelante.",
  DIAN_PORTAL_UNAVAILABLE: "El portal de la DIAN estaba caído. Se puede volver a intentar.",
  FORM_ARITHMETIC_MISMATCH:
    "Las cifras de la declaración no cuadran entre ellas. Hay que revisarla antes de usarla.",
  FORM_LAYOUT_NOT_RECOGNIZED:
    "El formulario no tiene la forma que esperábamos. Puede ser una versión nueva.",
};

export default function Pendientes({ caso, onCambio }) {
  const { profunda } = useVista();
  // El titular confirma cosas SUYAS; el contador confirma cosas de otra persona. La misma lista,
  // dos voces.
  const deQuien = profunda ? "del cliente" : "tuyas";
  // Una constancia (`info`) no le pide nada a nadie: es registro de un defecto conocido que no
  // cambia ninguna cifra. Aparece en la vista de contador, que es donde sirve para reportar un
  // problema, y no en la lista de lo que hay que hacer.
  const porHacer = caso.flags.filter((f) => f.severity !== "info");
  const abiertos = porHacer.filter((f) => !f.resolved_at);
  const resueltos = porHacer.filter((f) => f.resolved_at);
  // Las constancias no son cosas por hacer, asi que no se cuentan con ellas: si estuvieran en
  // la misma lista, el numero de pendientes no significaria nada.
  const constancias = profunda ? caso.flags.filter((f) => f.severity === "info") : [];
  const [verResueltos, setVerResueltos] = useState(false);

  if (!abiertos.length && !resueltos.length && !constancias.length) return null;

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">
          {abiertos.length ? "Falta revisar esto" : "Nada por revisar"}
        </h2>
        {abiertos.length ? (
          <p className="bloque-nota">
            {abiertos.length === 1
              ? `Hay una cosa ${deQuien} que confirmar antes de presentar.`
              : `Hay ${abiertos.length} cosas ${deQuien} que confirmar antes de presentar.`}
          </p>
        ) : (
          <p className="bloque-nota">Todo lo que había que confirmar ya se revisó.</p>
        )}
      </header>

      <ul className="avisos">
        {abiertos.map((flag) => (
          <Aviso key={flag.id} flag={flag} caseId={caso.id} onCambio={onCambio} />
        ))}
        {verResueltos
          ? resueltos.map((flag) => (
              <Aviso key={flag.id} flag={flag} caseId={caso.id} onCambio={onCambio} />
            ))
          : null}
      </ul>

      {resueltos.length > 0 ? (
        <div className="bloque-pie">
          <button className="enlace-suave" onClick={() => setVerResueltos((v) => !v)}>
            {verResueltos
              ? "Ocultar lo ya revisado"
              : `Ver ${resueltos.length} ${resueltos.length === 1 ? "cosa" : "cosas"} ya revisadas`}
          </button>
        </div>
      ) : null}

      {constancias.length > 0 ? <Constancias constancias={constancias} /> : null}
    </section>
  );
}

function Aviso({ flag, caseId, onCambio }) {
  const [nota, setNota] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const accion = useAction(() => api.resolveFlag(caseId, flag.id, nota.trim() || null));
  const resuelto = Boolean(flag.resolved_at);

  const resolver = async () => {
    if (await accion.run()) {
      setConfirmando(false);
      onCambio();
    }
  };

  return (
    <li className={`aviso ${resuelto ? "aviso-resuelto" : ""} aviso-${flag.severity}`}>
      <div className="aviso-cuerpo">
        <p className="aviso-que">{flag.message}</p>
        {QUE_HACER[flag.code] ? <p className="aviso-hacer">{QUE_HACER[flag.code]}</p> : null}
        <p className="aviso-cuando">
          {resuelto
            ? `Revisado el ${formatDate(flag.resolved_at)}${flag.resolution_note ? `: ${flag.resolution_note}` : ""}`
            : formatDate(flag.raised_at)}
          {/* El código NO se muestra ni en la vista de contador: acá se está trabajando, y lo
              que sirve para reportar un problema es la memoria de cálculo, no la cola. */}
        </p>
        <ErrorApi error={accion.error} />

        {confirmando ? (
          <div className="aviso-confirmar">
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Qué averiguaste (opcional)"
            />
            <button className="btn-mini primario" onClick={resolver} disabled={accion.running}>
              {accion.running ? "Guardando…" : "Confirmar"}
            </button>
          </div>
        ) : null}
      </div>

      {!resuelto && !confirmando ? (
        <button className="btn-mini" onClick={() => setConfirmando(true)}>
          Ya lo revisé
        </button>
      ) : null}
    </li>
  );
}


/**
 * Defectos conocidos que no le piden nada a nadie.
 *
 * Solo se muestran en la vista de contador, y aparte de los pendientes: son la respuesta a "por
 * que este nombre sale raro", no una tarea. Mezclarlas con lo que si hay que hacer haria que el
 * contador dejara de mirar la lista.
 */
function Constancias({ constancias }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="bloque-pie">
      <button className="enlace-suave" onClick={() => setAbierto((v) => !v)}>
        {abierto
          ? "Ocultar las constancias"
          : `Ver ${constancias.length} ${constancias.length === 1 ? "constancia" : "constancias"} de defectos conocidos`}
      </button>
      {abierto ? (
        <ul className="constancias">
          {constancias.map((flag) => (
            <li key={flag.id}>
              {flag.message}
              <span className="codigo">{flag.code}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
