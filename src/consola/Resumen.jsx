/**
 * La respuesta: si te toca declarar, y por que.
 *
 * JERARQUIA: una sola pantalla, una sola respuesta. El veredicto va grande y solo, porque es
 * lo unico que la persona vino a saber. Todo lo demas esta debajo y explica esa respuesta, en
 * orden de "y por que?": los topes que la sustentan, y dentro de cada tope quien reporto cada
 * peso. Nada de eso compite con el veredicto por atencion.
 *
 * Lo unico que lleva color es el tope que se supera. Cuando todo lleva color, nada resalta.
 */

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { formatMoney, formatNumber } from "./formato";
import { SoloContador, useVista } from "./vista";

export default function Resumen({ resumen, porRevisar = 0, antesDeFacturas = null }) {
  if (!resumen?.obligation) return null;

  return (
    <>
      <Veredicto obligacion={resumen.obligation} porRevisar={porRevisar} />
      <Topes obligacion={resumen.obligation} procedencia={resumen.threshold_provenance ?? []} />
      {antesDeFacturas}
      {resumen.einvoices ? <Facturas facturas={resumen.einvoices} /> : null}
      <SoloContador>
        <Renglones lineas={resumen.form_lines} />
      </SoloContador>
    </>
  );
}

/** La respuesta, sin nada al lado. */
function Veredicto({ obligacion, porRevisar }) {
  const superados = obligacion.thresholds.filter((t) => t.exceeded);
  const obligado = superados.length > 0;
  const nombres = superados.map((t) => t.label.toLowerCase());

  return (
    <section className={`veredicto ${obligado ? "veredicto-obligado" : ""}`}>
      <h1 className="veredicto-frase">
        {obligado ? "Sí, este año te toca declarar" : "Este año no te toca declarar"}
      </h1>
      <p className="veredicto-razon">
        {obligado
          ? `Porque superas ${superados.length === 1 ? "uno" : superados.length} de los cinco topes que obligan a declarar: ${unirCon(nombres)}.`
          : "No superas ninguno de los cinco topes que obligan a declarar. Aun así puede convenirte declarar si te devuelven retenciones."}
      </p>
      {/* La respuesta se da, y en la misma respiración se dice que puede cambiarla. Es más
          honesto que dar la cifra como definitiva, y menos alarmante que abrir con una lista
          de problemas antes de haber contestado la pregunta. */}
      {porRevisar > 0 ? (
        <p className="veredicto-salvedad">
          {porRevisar === 1
            ? "Hay una cosa por confirmar que podría cambiar esto."
            : `Hay ${porRevisar} cosas por confirmar que podrían cambiar esto.`}
        </p>
      ) : null}
    </section>
  );
}

/** Los cinco topes, cada uno abrible a de donde sale. */
function Topes({ obligacion, procedencia }) {
  const porCodigo = new Map(procedencia.map((p) => [p.code, p]));

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">Los cinco topes</h2>
        <p className="bloque-nota">
          Basta superar uno para quedar obligado. Los valores son los que la DIAN tiene
          reportados a tu nombre.
        </p>
      </header>
      <ul className="topes">
        {obligacion.thresholds.map((tope) => (
          <Tope key={tope.code} tope={tope} fuentes={porCodigo.get(tope.code)} />
        ))}
      </ul>
      <SoloContador>
        <p className="bloque-pie">
          UVT del año gravable {obligacion.tax_year}: {formatMoney(uvtEnPesos(obligacion))} (
          {formatNumber(obligacion.uvt)}).
        </p>
      </SoloContador>
    </section>
  );
}

function Tope({ tope, fuentes }) {
  const [abierto, setAbierto] = useState(false);
  const porcentaje = Math.min(100, Math.round((tope.reported_amount / tope.limit_amount) * 100));
  const puedeAbrir = Boolean(fuentes?.sources?.length);

  return (
    <li className={`tope ${tope.exceeded ? "tope-excedido" : ""}`}>
      <button
        className="tope-cabeza"
        onClick={() => puedeAbrir && setAbierto((v) => !v)}
        disabled={!puedeAbrir}
        aria-expanded={abierto}
      >
        <span className="tope-chevron">
          {puedeAbrir ? abierto ? <ChevronDown size={15} /> : <ChevronRight size={15} /> : null}
        </span>
        <span className="tope-nombre">{tope.label}</span>
        <span className="tope-valor money">{formatMoney(tope.reported_amount)}</span>
      </button>

      <div className="tope-barra">
        <span style={{ width: `${Math.max(porcentaje, 1)}%` }} />
      </div>

      <p className="tope-pie">
        {tope.exceeded
          ? `Supera el tope de ${formatMoney(tope.limit_amount)}`
          : `${porcentaje}% del tope de ${formatMoney(tope.limit_amount)}`}
        {fuentes?.amount_not_from_titular ? (
          <span className="tope-duda">
            {formatMoney(fuentes.amount_not_from_titular)} lo reportó un tercero a nombre de
            otra persona
          </span>
        ) : null}
      </p>

      {abierto && fuentes ? <DeDondeSale fuentes={fuentes} /> : null}
    </li>
  );
}

/**
 * De donde sale la cifra de un tope.
 *
 * Es la diferencia entre auditar un numero y tener que creerlo. Las filas que la DIAN compara
 * en vez de sumar van aparte y dicen por que: si estuvieran en la misma lista, la suma no
 * cuadraria y parecerian un error nuestro.
 */
function DeDondeSale({ fuentes }) {
  const suman = fuentes.sources.filter((f) => !f.compared_not_added);
  const comparadas = fuentes.sources.filter((f) => f.compared_not_added);

  return (
    <div className="fuentes">
      {suman.map((fuente, indice) => (
        <Fuente key={indice} fuente={fuente} />
      ))}

      <div className="fuentes-total">
        <span>Suma de lo reportado</span>
        <span className="money">{formatMoney(fuentes.added_total)}</span>
      </div>

      {comparadas.length > 0 ? (
        <div className="fuentes-aparte">
          <p className="fuentes-aparte-nota">
            La DIAN compara estos valores contra el total de arriba y toma el mayor. No los suma.
          </p>
          {comparadas.map((fuente, indice) => (
            <Fuente key={indice} fuente={fuente} />
          ))}
        </div>
      ) : null}

      {!fuentes.reconciles ? (
        <p className="fuentes-diferencia">
          La DIAN reporta {formatMoney(fuentes.official_amount)} para este tope, y el detalle
          que ella misma entrega suma {formatMoney(fuentes.added_total)}. Los{" "}
          {formatMoney(Math.abs(fuentes.unexplained_difference))} de diferencia no están
          explicados en el reporte. El valor que cuenta es el de la DIAN.
        </p>
      ) : null}
    </div>
  );
}

function Fuente({ fuente }) {
  return (
    <div className={`fuente ${fuente.reported_to_titular ? "" : "fuente-en-duda"}`}>
      <span className="fuente-quien">{fuente.reporter_name ?? "Sin identificar"}</span>
      <span className="fuente-concepto">
        {fuente.concept}
        {fuente.reported_to_titular === false ? (
          <span className="marca-duda">a nombre de {fuente.reported_name}</span>
        ) : null}
      </span>
      <span className="fuente-monto money">{formatMoney(fuente.amount)}</span>
    </div>
  );
}

/** La deduccion del 1% por facturas electronicas: plata que la mayoria deja sobre la mesa. */
function Facturas({ facturas }) {
  const { profunda } = useVista();
  const deduccion = Math.round(facturas.benefit_eligible_amount * 0.01);
  if (!facturas.invoice_count) return null;

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">Tus facturas electrónicas</h2>
        <p className="bloque-nota">
          Puedes descontar el 1% de lo que compraste con factura electrónica, sin necesidad de
          guardar los recibos.
        </p>
      </header>
      <div className="cifra-grande">
        <span className="cifra-valor money">{formatMoney(deduccion)}</span>
        <span className="cifra-nombre">
          es lo que puedes descontar, sobre {formatMoney(facturas.benefit_eligible_amount)} en{" "}
          {formatNumber(facturas.invoice_count)} facturas
        </span>
      </div>
      {profunda ? (
        <p className="bloque-pie">
          Total facturado {formatMoney(facturas.total_amount)}; la base del beneficio excluye
          los pagos en efectivo, que la DIAN ya filtró.
        </p>
      ) : null}
    </section>
  );
}

/** Profundidad de contador: a que renglon del formulario va cada valor reportado. */
function Renglones({ lineas }) {
  if (!lineas?.length) return null;
  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">Renglones del formulario 210</h2>
        <p className="bloque-nota">
          La DIAN indica a qué renglón va cada valor reportado por un tercero. Esto es la suma
          de esa asignación, no un cálculo del impuesto.
        </p>
      </header>
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
              <td className="num strong money">{formatMoney(linea.amount)}</td>
              <td className="num celda-suave">{linea.concept_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const unirCon = (partes) =>
  partes.length <= 1 ? (partes[0] ?? "") : `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;

// El limite del tope de ingresos son 1400 UVT, asi que de ahi se despeja el valor de la UVT.
const uvtEnPesos = (obligacion) => {
  const tope = obligacion.thresholds.find((t) => t.limit_in_uvt);
  return tope ? Math.round(tope.limit_amount / tope.limit_in_uvt) : 0;
};
