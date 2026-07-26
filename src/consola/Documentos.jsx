/** Documentos del expediente y lo que se leyó de cada uno. */

import { useState } from "react";
import { ChevronDown, ChevronRight, Download, FileText, MessageCircle } from "lucide-react";

import { campoLabel, docLabel, formatDateTime, formatMoney } from "./formato";
import { Vacio } from "./componentes";

/** Campos cuyo valor es un monto en pesos: se formatean como plata. */
const CAMPOS_MONTO = new Set([
  "total_net_amount",
  "total_benefit_eligible_amount",
]);
const PREFIJOS_MONTO = ["tope_"];

const esMonto = (nombre) =>
  CAMPOS_MONTO.has(nombre) || PREFIJOS_MONTO.some((p) => nombre.startsWith(p));

/** El texto completo del documento se guarda para auditoría, no para mostrarlo en tabla. */
const CAMPOS_OCULTOS = new Set(["raw_text"]);

export default function Documentos({ documentos }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <FileText size={15} style={{ color: "var(--muted)" }} />
        <h2>Documentos</h2>
        <span className="count">{documentos.length}</span>
      </div>

      {documentos.length === 0 ? (
        <Vacio>
          Sin documentos todavía. Consulta la DIAN o pídele al cliente que suba lo que falte.
        </Vacio>
      ) : (
        documentos.map((doc) => <Documento key={doc.id} doc={doc} />)
      )}
    </div>
  );
}

function Documento({ doc }) {
  const [abierto, setAbierto] = useState(false);
  const tieneLectura = Boolean(doc.reading);
  const campos = (doc.reading?.fields ?? []).filter((f) => !CAMPOS_OCULTOS.has(f.name));

  return (
    <div style={{ borderBottom: "1px solid var(--line)" }}>
      <div className="doc-fila">
        {/* Toda la franja del documento abre y cierra su lectura: apuntarle a un chevron
            de 16 pixeles es innecesariamente dificil cuando se revisan muchos casos. */}
        <button
          className={`doc-toggle ${tieneLectura ? "" : "sin-lectura"}`}
          onClick={() => tieneLectura && setAbierto((v) => !v)}
          disabled={!tieneLectura}
          aria-expanded={abierto}
        >
          <span className="doc-chevron">
            {tieneLectura ? (
              abierto ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )
            ) : null}
          </span>
          <span>
            <span className="doc-nombre">{docLabel(doc.doc_type)}</span>
            <span className="doc-archivo">
              {doc.filename} · {formatDateTime(doc.added_at)}
            </span>
          </span>
        </button>

        {doc.source === "CLIENT_UPLOAD" ? (
          <span className="chip chip-neutral">
            <MessageCircle size={11} /> lo subió el cliente
          </span>
        ) : (
          <span className="chip chip-forest">portal DIAN</span>
        )}

        {tieneLectura ? (
          <span className="chip chip-green">leído</span>
        ) : (
          <span className="chip chip-amber">sin lector</span>
        )}

        <a className="btn-mini" href={`/api${doc.download_url}`} target="_blank" rel="noreferrer">
          <Download size={12} />
          Descargar
        </a>
      </div>

      {abierto && tieneLectura ? (
        <div className="lectura">
          <div className="lectura-grid">
            {campos.map((campo) => (
              <div className="lectura-item" key={campo.name}>
                <span className="lectura-nombre">{campoLabel(campo.name)}</span>
                <span className="lectura-valor">
                  {esMonto(campo.name) ? formatMoney(campo.value) : String(campo.value ?? "—")}
                  {campo.source ? <div className="lectura-origen">{campo.source}</div> : null}
                </span>
              </div>
            ))}
          </div>

          {(doc.reading.rows ?? []).length > 0 ? (
            <FilasReportadas filas={doc.reading.rows} parser={doc.reading.parser} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Las filas de detalle (terceros que reportaron, o facturas). */
function FilasReportadas({ filas, parser }) {
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const visibles = mostrarTodas ? filas : filas.slice(0, 8);
  const esExogena = parser?.startsWith("exogena");

  return (
    <div style={{ borderTop: "1px solid var(--line)" }}>
      <table className="tabla">
        <thead>
          <tr>
            <th>{esExogena ? "Quién reportó" : "Emisor"}</th>
            <th>{esExogena ? "Concepto" : "Fecha"}</th>
            <th className="num">Valor</th>
            {esExogena ? <th>Renglones 210</th> : <th>Medio de pago</th>}
          </tr>
        </thead>
        <tbody>
          {visibles.map((fila, indice) => (
            <tr key={indice}>
              <td>{fila.values.reporter_name ?? fila.values.issuer_name ?? "—"}</td>
              <td style={{ color: "var(--muted)", fontSize: 13 }}>
                {fila.values.concept ?? fila.values.issue_date ?? "—"}
              </td>
              <td className="num strong">
                {formatMoney(fila.values.amount ?? fila.values.net_amount)}
              </td>
              <td>
                {esExogena ? (
                  (fila.values.form_lines ?? []).map((linea) => (
                    <span key={linea} className="chip chip-neutral" style={{ marginRight: 4 }}>
                      R{linea}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>
                    {fila.values.payment_method ?? "—"}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filas.length > 8 ? (
        <div style={{ padding: "10px 20px" }}>
          <button className="btn-mini" onClick={() => setMostrarTodas((v) => !v)}>
            {mostrarTodas ? "Mostrar menos" : `Ver las ${filas.length} filas`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
