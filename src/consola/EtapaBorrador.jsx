/**
 * ETAPA 3. El borrador, por categorias.
 *
 * ACA SI VAN PESTANAS, y es el unico sitio donde tienen sentido: el contenido es homogeneo
 * (cuatro vistas del mismo borrador) y se navega libre, sin orden. Como estructura de la pantalla
 * completa serian una trampa, porque permitirian saltarse el proceso.
 *
 * Cada categoria muestra su total y se abre para ver las cifras con su fuente. El detalle no se
 * niega: se revela cuando alguien lo pide. La tabla completa con formula y norma vive un paso mas
 * adentro, en la memoria de calculo, que es un documento de auditoria y no una pantalla.
 */

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

import { formatMoney } from "./formato";
import Documentos from "./Documentos";

const PESTANAS = [
  { id: "resumen", nombre: "Resumen" },
  { id: "ingresos", nombre: "Ingresos" },
  { id: "beneficios", nombre: "Beneficios" },
  { id: "soportes", nombre: "Soportes" },
];

export default function EtapaBorrador({ caseId, caso, resumen, liquidacion }) {
  const [pestana, setPestana] = useState("resumen");

  return (
    <section className="etapa-cuerpo">
      <h1 className="etapa-titulo">Tu borrador</h1>

      <div className="pestanas" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={pestana === p.id}
            className={pestana === p.id ? "pestana pestana-activa" : "pestana"}
            onClick={() => setPestana(p.id)}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {pestana === "resumen" ? <Resumen liquidacion={liquidacion} resumen={resumen} /> : null}
      {pestana === "ingresos" ? <Renglones lineas={resumen?.form_lines} /> : null}
      {pestana === "beneficios" ? <Facturas facturas={resumen?.einvoices} /> : null}
      {pestana === "soportes" ? <Documentos documentos={caso.documents} /> : null}

      <a
        className="enlace-suave memoria"
        href={`/api/v1/cases/${caseId}/memoria`}
        target="_blank"
        rel="noreferrer"
      >
        Ver la memoria de cálculo <ExternalLink size={13} />
      </a>
    </section>
  );
}

/** Las categorias del 210 con su total, abribles. */
function Resumen({ liquidacion, resumen }) {
  const actual = liquidacion?.actual;
  if (!actual) return <p className="estado">Todavía no hay borrador que mostrar.</p>;

  return (
    <div className="categorias">
      <Categoria nombre="Impuesto" total={actual.impuesto}>
        <p className="bloque-nota">
          Lo que resulta de aplicar la tabla del artículo 241 a tu renta gravable.
        </p>
      </Categoria>
      <Categoria nombre={actual.saldo >= 0 ? "Saldo a pagar" : "Saldo a favor"} total={Math.abs(actual.saldo)}>
        <p className="bloque-nota">
          El impuesto menos lo que ya te retuvieron durante el año, más el anticipo del año
          siguiente si aplica.
        </p>
      </Categoria>
      {resumen?.obligation ? (
        <Categoria nombre="Topes de obligación" total={null}>
          <ul className="topes-simples">
            {resumen.obligation.thresholds.map((t) => (
              <li key={t.code} className={t.exceeded ? "tope-si" : ""}>
                <span>{t.label}</span>
                <span className="money">{formatMoney(t.reported_amount)}</span>
                <span className="tope-veredicto">
                  {t.exceeded ? "supera el tope" : `${Math.round((t.reported_amount / t.limit_amount) * 100)}%`}
                </span>
              </li>
            ))}
          </ul>
        </Categoria>
      ) : null}
    </div>
  );
}

function Categoria({ nombre, total, children }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className="categoria">
      <button onClick={() => setAbierta((v) => !v)} aria-expanded={abierta}>
        {abierta ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        <span className="categoria-nombre">{nombre}</span>
        {total !== null ? <span className="categoria-total money">{formatMoney(total)}</span> : null}
      </button>
      {abierta ? <div className="categoria-cuerpo">{children}</div> : null}
    </div>
  );
}

function Renglones({ lineas }) {
  if (!lineas?.length) return <p className="estado">Sin renglones que mostrar.</p>;
  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>Renglón del 210</th>
          <th className="num">Valor</th>
        </tr>
      </thead>
      <tbody>
        {lineas.map((l) => (
          <tr key={l.line}>
            <td className="strong">R{l.line}</td>
            <td className="num strong money">{formatMoney(l.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Facturas({ facturas }) {
  if (!facturas?.invoice_count) return <p className="estado">Sin beneficios registrados.</p>;
  const deduccion = Math.round(facturas.benefit_eligible_amount * 0.01);
  return (
    <div className="cifra-grande">
      <span className="cifra-valor money">{formatMoney(deduccion)}</span>
      <span className="cifra-nombre">
        del 1% por tus facturas electrónicas, sobre{" "}
        {formatMoney(facturas.benefit_eligible_amount)}
      </span>
    </div>
  );
}
