/** El resumen del expediente: lo que el sistema derivó de lo que leyó. */

import { AlertTriangle, CheckCircle2, FileSpreadsheet, Receipt } from "lucide-react";
import { formatMoney, formatNumber } from "./formato";
import { Vacio } from "./componentes";

export default function Resumen({ resumen }) {
  if (!resumen?.obligation && !(resumen?.form_lines ?? []).length) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2>Resumen</h2>
        </div>
        <Vacio>
          Todavía no hay nada leído. Consulta la DIAN para que el expediente se llene.
        </Vacio>
      </div>
    );
  }

  // La tabla de renglones es la mas alta, asi que va sola en una columna y las otras dos
  // tarjetas se apilan en la otra: sin eso queda un hueco grande en la columna corta.
  return (
    <div className="grid-resumen">
      <div>
        <Obligacion obligacion={resumen.obligation} />
        <Facturas facturas={resumen.einvoices} />
      </div>
      <Renglones lineas={resumen.form_lines} />
    </div>
  );
}

function Obligacion({ obligacion }) {
  if (!obligacion) return null;
  const superados = obligacion.thresholds.filter((t) => t.exceeded);
  const obligado = superados.length > 0;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>¿Está obligado a declarar?</h2>
        <span className="spacer" />
        <span className="count">UVT {formatNumber(obligacion.uvt)}</span>
      </div>

      <div className="veredicto">
        <div className={`veredicto-icono ${obligado ? "veredicto-si" : "veredicto-no"}`}>
          {obligado ? <AlertTriangle size={21} /> : <CheckCircle2 size={21} />}
        </div>
        <div>
          <p className="veredicto-titulo">
            {obligado ? "Sí, está obligado" : "No está obligado"}
          </p>
          <p className="veredicto-detalle">
            {obligado
              ? `Supera ${superados.length} de 5 topes: ${superados
                  .map((t) => t.label.toLowerCase())
                  .join(" y ")}.`
              : "No supera ninguno de los cinco topes del año gravable."}
          </p>
        </div>
      </div>

      <div>
        {obligacion.thresholds.map((tope) => {
          const porcentaje = Math.min(
            100,
            Math.round((tope.reported_amount / tope.limit_amount) * 100),
          );
          return (
            <div className="tope" key={tope.code}>
              <div className="tope-fila">
                <span className="tope-nombre">{tope.label}</span>
                <span className="tope-valor">{formatMoney(tope.reported_amount)}</span>
              </div>
              <div className={`tope-barra ${tope.exceeded ? "excedido" : ""}`}>
                <span style={{ width: `${Math.max(porcentaje, 1)}%` }} />
              </div>
              <div className="tope-fila" style={{ marginTop: 5 }}>
                <span className="tope-limite">
                  límite {formatMoney(tope.limit_amount)} ({formatNumber(tope.limit_in_uvt)} UVT)
                </span>
                <span className="tope-limite" style={{ marginLeft: "auto" }}>
                  {tope.exceeded ? (
                    <span className="chip chip-amber">supera el tope</span>
                  ) : (
                    `${porcentaje}%`
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Renglones({ lineas }) {
  if (!lineas?.length) return null;
  return (
    <div className="panel">
      <div className="panel-head">
        <FileSpreadsheet size={15} style={{ color: "var(--muted)" }} />
        <h2>Renglones del formulario 210</h2>
        <span className="count">{lineas.length}</span>
      </div>
      <p className="panel-note">
        La DIAN indica a qué renglón va cada valor que un tercero le reportó. Esto es la suma
        de esa asignación, no un cálculo del impuesto.
      </p>
      <table className="tabla">
        <thead>
          <tr>
            <th>Renglón</th>
            <th className="num">Valor</th>
            <th className="num">Conceptos</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((linea) => (
            <tr key={linea.line}>
              <td className="strong">R{linea.line}</td>
              <td className="num strong">{formatMoney(linea.amount)}</td>
              <td className="num" style={{ color: "var(--muted)" }}>
                {linea.concept_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Facturas({ facturas }) {
  if (!facturas) return null;
  const deduccion = Math.round(facturas.benefit_eligible_amount * 0.01);
  return (
    <div className="panel">
      <div className="panel-head">
        <Receipt size={15} style={{ color: "var(--muted)" }} />
        <h2>Facturas electrónicas</h2>
        <span className="count">{formatNumber(facturas.invoice_count)}</span>
      </div>
      <div className="panel-body" style={{ display: "grid", gap: 10 }}>
        <Fila etiqueta="Total facturado" valor={formatMoney(facturas.total_amount)} />
        <Fila
          etiqueta="Base para la deducción del 1%"
          valor={formatMoney(facturas.benefit_eligible_amount)}
          nota="la DIAN ya excluyó los pagos en efectivo"
        />
        <Fila etiqueta="Deducción del 1%" valor={formatMoney(deduccion)} destacado />
      </div>
    </div>
  );
}

function Fila({ etiqueta, valor, nota, destacado }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: 13.5, color: destacado ? "var(--ink)" : "var(--muted)" }}>
          {etiqueta}
        </span>
        <span
          className="money"
          style={{
            marginLeft: "auto",
            fontWeight: 600,
            fontSize: destacado ? 17 : 14,
            color: destacado ? "var(--brand)" : "var(--ink)",
          }}
        >
          {valor}
        </span>
      </div>
      {nota ? (
        <div style={{ color: "var(--muted)", fontSize: 11.5, marginTop: 2 }}>{nota}</div>
      ) : null}
    </div>
  );
}
