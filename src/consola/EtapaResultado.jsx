/**
 * ETAPA 1. El resultado, y nada mas.
 *
 * Es la unica pantalla que alguien tiene que entender para saber en que va: cuanto paga, cuanto
 * se ahorro, y si falta algo. Dos alertas como maximo y un solo camino adelante.
 *
 * NADA DE TABLAS NI DE FORMULAS ACA. La tabla completa con concepto, valor, formula y norma
 * existe y sirve, pero es un documento de auditoria: vive en la memoria de calculo, a un clic
 * desde la etapa del borrador. Ponerla aqui convierte la respuesta en un informe.
 */

import { ArrowRight } from "lucide-react";

import { formatMoney } from "./formato";

export default function EtapaResultado({ liquidacion, resumen, pendientes, onSeguir }) {
  const actual = liquidacion?.actual;
  const obligado = resumen?.obligation
    ? resumen.obligation.thresholds.some((t) => t.exceeded)
    : null;

  // Máximo dos, y las más graves primero: una lista de alertas deja de leerse en la tercera.
  const alertas = (pendientes ?? []).slice(0, 2);

  return (
    <section className="etapa-cuerpo">
      <h1 className="resultado-titulo">
        {actual
          ? pendientes?.length
            ? "Tu declaración está casi lista"
            : "Tu declaración está lista"
          : obligado === false
            ? "Este año no te toca declarar"
            : "Estamos armando tu declaración"}
      </h1>

      {actual ? (
        <div className="resultado-cifras">
          <div className="resultado-cifra">
            <span className="resultado-valor money">
              {formatMoney(Math.abs(actual.saldo ?? 0))}
            </span>
            <span className="resultado-nombre">
              {(actual.saldo ?? 0) >= 0 ? "te toca pagar" : "te devuelven"}
            </span>
          </div>
          {liquidacion.ganancia_saldo ? (
            <div className="resultado-cifra resultado-ahorro">
              <span className="resultado-valor money">
                {formatMoney(Math.abs(liquidacion.ganancia_saldo))}
              </span>
              <span className="resultado-nombre">
                {liquidacion.ganancia_saldo >= 0 ? "te ahorraste" : "de más que la DIAN sugería"}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {alertas.length ? (
        <ul className="resultado-alertas">
          {alertas.map((a) => (
            <li key={a.id ?? a.que}>{a.que ?? a.message}</li>
          ))}
        </ul>
      ) : null}

      <button className="btn-grande" onClick={onSeguir}>
        {pendientes?.length ? "Revisar lo que falta" : "Ver el borrador"}
        <ArrowRight size={16} />
      </button>
    </section>
  );
}
