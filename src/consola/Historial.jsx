/**
 * Las declaraciones de años anteriores, año por año.
 *
 * ═══ POR QUE ES UNA SECCION PROPIA Y NO UNA FILA MAS EN "TUS DOCUMENTOS" ═══
 *
 * En la lista general, cinco declaraciones de cinco años seguidos son cinco filas que se
 * llaman casi igual y hay que leer entera cada una para saber de qué año es. Como serie, en
 * cambio, se recorre de un vistazo: es una tabla de años, no una lista de archivos.
 *
 * ═══ EL AÑO QUE FALTA ES EL DATO MAS VALIOSO DE ESTA PANTALLA ═══
 *
 * Un hueco en la mitad de la serie (2023 sí, 2024 no, 2022 sí) es una declaración que no se
 * presentó. Puede ser legítimo —quizá no superó ningún tope ese año— o puede ser un atraso con
 * sanción corriendo. En los dos casos es algo de lo que hay que hablar con el cliente, así que
 * se marca en vez de dejarlo como un vacío que nadie nota.
 *
 * ═══ "NO SE HA PREGUNTADO" NO ES "NO DECLARO" ═══
 *
 * Mientras nadie consulte el portal, los años sin documento salen apagados y sin veredicto.
 * Pintarlos como "no declaró" sería afirmar algo sobre la vida tributaria de una persona a
 * partir de no haber mirado, que es exactamente la clase de error silencioso que este
 * expediente existe para evitar.
 */

import { useState } from "react";
import { Download, Eye, RefreshCw } from "lucide-react";

import { api } from "./api";
import { useAction, useApi } from "./hooks";
import { ErrorApi } from "./componentes";
import Dialogo from "./Dialogo";
import VisorDocumento from "./VisorDocumento";
import { descargarArchivo } from "./archivos";

/** El tipo con el que el historial guarda cada año en el expediente. */
export const esDelHistorial = (docType = "") => docType.startsWith("DECLARACION_");

const LEYENDA = {
  guardada: null,
  en_la_dian: "sin traer",
  sin_declaracion: "no declaró",
  sin_revisar: "sin revisar",
};

export default function Historial({ caseId, documentos, onCambio }) {
  const historial = useApi(() => api.getHistorial(caseId), [caseId]);
  const [viendo, setViendo] = useState(null);
  const [pidiendoClave, setPidiendoClave] = useState(false);

  const filas = historial.data ?? [];
  // El estado viene del backend; la URL de descarga vive en el documento del expediente. Se
  // cruzan por año, que es lo unico que los dos lados comparten.
  const documentoDe = (fila) =>
    documentos.find(
      (d) => d.doc_type === `DECLARACION_${fila.anio}` || (d.doc_type === "PRIOR_RETURN" && fila.estado === "guardada" && d.filename?.includes(String(fila.anio))),
    ) ?? null;

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">Declaraciones anteriores</h2>
        <p className="bloque-nota">Lo que la DIAN tiene presentado a tu nombre.</p>
      </header>

      <ErrorApi error={historial.error} />

      {filas.length ? (
        <ul className="historial">
          {filas.map((fila) => {
            const doc = fila.estado === "guardada" ? documentoDe(fila) : null;
            return (
              <Anio
                key={fila.anio}
                fila={fila}
                doc={doc}
                onVer={doc ? () => setViendo(doc) : null}
              />
            );
          })}
        </ul>
      ) : null}

      <button className="btn-mini" onClick={() => setPidiendoClave(true)}>
        <RefreshCw size={13} />
        Revisar en la DIAN
      </button>

      {pidiendoClave ? (
        <PedirClave
          caseId={caseId}
          onListo={() => {
            setPidiendoClave(false);
            historial.reload();
            // El expediente tambien cambio: llegaron documentos nuevos.
            onCambio?.();
          }}
          onCerrar={() => setPidiendoClave(false)}
        />
      ) : null}

      {viendo ? <VisorDocumento doc={viendo} onCerrar={() => setViendo(null)} /> : null}
    </section>
  );
}

function Anio({ fila, doc, onVer }) {
  const bajar = useAction(() => descargarArchivo(doc.download_url, doc.filename));
  const leyenda = LEYENDA[fila.estado];

  return (
    <li className={`historial-anio historial-${fila.estado}`}>
      {onVer ? (
        <button className="historial-abrir" onClick={onVer} title="Ver la declaración">
          <b>{fila.anio}</b>
          <Eye size={14} />
        </button>
      ) : (
        <span className="historial-abrir">
          <b>{fila.anio}</b>
          {leyenda ? <em>{leyenda}</em> : null}
        </span>
      )}
      {doc ? (
        <button
          className="btn-icono"
          onClick={() => bajar.run()}
          disabled={bajar.running}
          title={bajar.error ? bajar.error.message : "Descargar"}
        >
          <Download size={14} />
        </button>
      ) : null}
    </li>
  );
}

/**
 * La clave, para abrir UNA sesion y traer todo el historial de una vez.
 *
 * Abrir sesion es lo caro y es lo que la DIAN cuenta para bloquear la cuenta, asi que no se
 * pide una clave por año: se pide una vez y adentro se baja lo que falte.
 */
function PedirClave({ caseId, onListo, onCerrar }) {
  const [clave, setClave] = useState("");
  const accion = useAction(() => api.traerHistorial(caseId, clave));

  const enviar = async (evento) => {
    evento.preventDefault();
    if (await accion.run()) onListo();
  };

  return (
    <Dialogo
      titulo="Revisar el historial en la DIAN"
      descripcion={
        accion.running
          ? null
          : "Pregunta qué años tiene declarados el contribuyente y trae los que falten."
      }
      onCerrar={onCerrar}
      bloqueado={accion.running}
    >
      {accion.running ? (
        <p className="estado">Consultando el portal y bajando las declaraciones…</p>
      ) : (
        <form className="clave-forma" onSubmit={enviar}>
          <ErrorApi error={accion.error} />
          <label className="campo">
            <span>Tu clave del portal de la DIAN</span>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              autoComplete="off"
              autoFocus
            />
          </label>
          <p className="clave-nota">
            La usamos para esta consulta y la borramos al terminar. No queda guardada en ninguna
            parte.
          </p>
          <div className="clave-botones">
            <button className="btn-grande" disabled={!clave}>
              Revisar
            </button>
          </div>
        </form>
      )}
    </Dialogo>
  );
}
