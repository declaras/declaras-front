/**
 * Las tres cifras: lo que la DIAN le cobraria, lo que va a pagar, y lo que se ahorro.
 *
 * DOS GANANCIAS, Y LA QUE IMPORTA ES LA DEL SALDO. El impuesto es lo que se debe; el saldo es
 * lo que le toca girar (o lo que le devuelven), y ahi entran las retenciones que ya le
 * descontaron. En un caso medido el impuesto bajo 1.311.000 y el saldo se movio 10.226.282,
 * porque el certificado del empleador traia 8 millones de retencion que la exogena no tenia.
 * Mostrar solo la primera subestima el trabajo por ocho veces.
 *
 * NO SE PINTA UNA CIFRA VIEJA COMO SI FUERA LA DE HOY. Cuando llega un documento y quedan
 * decisiones pendientes, la liquidacion guardada deja de corresponder al expediente. El backend
 * lo dice con `actual_vigente`, y aqui se dice tambien: la alternativa es que el contador le
 * prometa al cliente una cifra que ya no es.
 */

import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

import { formatMoney } from "./formato";

export default function Ganancia({ liquidacion }) {
  if (!liquidacion) return null;

  const { preliminar, actual, ganancia, ganancia_saldo: gananciaSaldo } = liquidacion;
  const vigente = liquidacion.actual_vigente;
  // La ganancia puede ser NEGATIVA y no se esconde: un certificado que muestra un ingreso que
  // la exogena no tenia sube el impuesto, y taparlo seria mentirle al cliente sobre lo que va
  // a pagar. El texto cambia; la cifra se muestra igual.
  const ahorra = ganancia >= 0;

  return (
    <section className="bloque ganancia">
      <header className="bloque-top">
        <h2 className="bloque-titulo">{ahorra ? "Lo que te ahorras" : "Lo que sube"}</h2>
        <p className="bloque-nota">
          Comparado con la declaración sugerida que la DIAN calcula con lo que otros
          reportaron a tu nombre.
        </p>
      </header>

      {vigente ? null : (
        <p className="ganancia-rancia" role="status">
          <AlertTriangle size={15} style={{ verticalAlign: "-2px", marginRight: 7 }} />
          Estas cifras son de antes del último documento.{" "}
          {liquidacion.falta_para_liquidar ?? "Falta resolver algo para volver a calcular."}
        </p>
      )}

      <div className="ganancia-cifras">
        <Cifra
          etiqueta="Según la DIAN"
          impuesto={preliminar.impuesto}
          saldo={preliminar.saldo}
          tono="neutra"
        />
        <Cifra
          etiqueta="Con tus documentos"
          impuesto={actual.impuesto}
          saldo={actual.saldo}
          tono="buena"
        />
        <div className={`ganancia-cifra ganancia-total ${ahorra ? "gana" : "pierde"}`}>
          <p className="ganancia-etiqueta">
            {ahorra ? (
              <TrendingDown size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            ) : (
              <TrendingUp size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            )}
            {ahorra ? "Te ahorras" : "Te sube"}
          </p>
          {/* La del saldo primero y grande: es la que el cliente siente en la cuenta. */}
          <p className="ganancia-monto">{formatMoney(Math.abs(gananciaSaldo))}</p>
          <p className="ganancia-detalle">
            en lo que te toca girar · {formatMoney(Math.abs(ganancia))} menos de impuesto
          </p>
        </div>
      </div>

      {liquidacion.preliminar_sin_documentos ? null : (
        <p className="bloque-nota ganancia-salvedad">
          El punto de partida ya incluía documentos tuyos, así que el ahorro real es mayor que
          el que muestra esta comparación.
        </p>
      )}
    </section>
  );
}

function Cifra({ etiqueta, impuesto, saldo, tono }) {
  // Un saldo negativo es plata a favor: se dice, no se muestra un menos y ya.
  const aFavor = saldo < 0;
  return (
    <div className={`ganancia-cifra ganancia-${tono}`}>
      <p className="ganancia-etiqueta">{etiqueta}</p>
      <p className="ganancia-monto">{formatMoney(impuesto)}</p>
      <p className="ganancia-detalle">
        de impuesto ·{" "}
        {aFavor
          ? `${formatMoney(Math.abs(saldo))} a favor`
          : `${formatMoney(saldo)} por pagar`}
      </p>
    </div>
  );
}
