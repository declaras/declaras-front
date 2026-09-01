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
 * ═══ "NO SE SABE" NO ES "NO DECLARO" ═══
 *
 * Más atrás de lo que trae la consulta, los años salen apagados y sin veredicto. Pintarlos
 * como "no declaró" sería afirmar algo sobre la vida tributaria de una persona sin poder
 * saberlo, que es exactamente la clase de error silencioso que este expediente existe para
 * evitar.
 *
 * ═══ NO HAY BOTON, Y ESO ES EL ARREGLO ═══
 *
 * Hubo uno ("Revisar en la DIAN") de cuando la consulta no traía el historial. En cuanto
 * empezó a traerlo, ese botón quedó pidiendo la clave por segunda vez para un trabajo que ya
 * estaba hecho. Lo que falta se trae volviendo a consultar la DIAN, que es el botón que ya
 * existe arriba: un solo sitio donde se escribe la clave.
 */

import { useState } from "react";
import { Download, Eye } from "lucide-react";

import { api } from "./api";
import { useAction, useApi } from "./hooks";
import { ErrorApi } from "./componentes";
import VisorDocumento from "./VisorDocumento";
import { descargarArchivo } from "./archivos";

/** El tipo con el que el historial guarda cada año en el expediente. */
export const esDelHistorial = (docType = "") => docType.startsWith("DECLARACION_");

const LEYENDA = {
  guardada: null,
  sin_declaracion: "no declaró",
  sin_revisar: "sin revisar",
};

export default function Historial({ caseId, documentos }) {
  const historial = useApi(() => api.getHistorial(caseId), [caseId]);
  const [viendo, setViendo] = useState(null);

  const filas = historial.data ?? [];
  // SIN NINGUNA GUARDADA NO HAY SERIE QUE MOSTRAR. Cinco filas diciendo "sin revisar" es una
  // tabla vacia de significado: ocupa el mismo espacio que la informacion y no dice ni que
  // hay, ni que falta, ni que hacer. Lo que corresponde ahi es una frase.
  const hayAlguna = filas.some((f) => f.estado === "guardada");
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
        <p className="bloque-nota">
          Lo que la DIAN tiene presentado a tu nombre en años anteriores.
        </p>
      </header>

      <ErrorApi error={historial.error} />

      {hayAlguna ? (
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
      ) : (
        <p className="estado">
          Llegan al consultar la DIAN. Si este expediente se consultó antes, vuelve a
          consultarlo y quedan aquí.
        </p>
      )}

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
