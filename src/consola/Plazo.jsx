/**
 * Cuándo vence esta declaración.
 *
 * POR QUE ES LO PRIMERO Y NO UN DATO MAS. Antes de cuanto se paga, cuando. Una declaracion
 * presentada un dia tarde cuesta la sancion minima por extemporaneidad: 10 UVT, $524.000 en 2026,
 * entre siete y nueve veces lo que cuesta el producto. Y a diferencia del impuesto, esa plata no
 * depende de la situacion de nadie: se pierde por no saber la fecha.
 *
 * LA FECHA NO ES LA MISMA PARA TODOS, y por eso se dice de donde sale. Depende de los dos ultimos
 * digitos de la cedula (Decreto 2229 de 2023), asi que quien la compara con la de un amigo cree que
 * una de las dos esta mal. Con el "porque" a la vista, esa llamada no ocurre.
 *
 * TRES ESTADOS, y el tercero no se disimula:
 *
 *   con tiempo    la fecha y los dias que faltan, en tono neutro
 *   cerca         los mismos datos, destacados: quedan quince dias o menos
 *   vencido       el plazo paso y hay sancion corriendo; decirlo es lo unico util
 */

import { AlertCircle, CalendarClock } from "lucide-react";

import { formatIso } from "./formato";
import { useVista } from "./vista";

/** Desde cuántos días restantes se destaca. Dos semanas alcanzan para conseguir un certificado. */
const CERCA = 15;

export default function Plazo({ plazo }) {
  const { profunda } = useVista();
  // `null` cuando el documento no permite calcularlo (un pasaporte). No se inventa una fecha.
  if (!plazo) return null;

  const { vence, dias_restantes: dias, vencido, digitos } = plazo;
  const cerca = !vencido && dias <= CERCA;
  const clase = vencido ? "plazo plazo-vencido" : cerca ? "plazo plazo-cerca" : "plazo";

  return (
    <div className={clase}>
      <span className="plazo-icono">
        {vencido || cerca ? <AlertCircle size={15} /> : <CalendarClock size={15} />}
      </span>
      <span className="plazo-texto">
        <span className="plazo-cuando">
          {vencido ? "Se venció el " : "Vence el "}
          <strong>{formatIso(vence)}</strong>
        </span>
        <span className="plazo-cuanto">{dichoEnDias(dias, vencido, profunda)}</span>
      </span>
      {/* De dónde sale la fecha. Al titular se le dice en su idioma; el número de decreto solo le
          sirve al contador, que es quien puede tener que citarlo. */}
      <span className="plazo-porque">
        {profunda
          ? `dígitos ${String(digitos).padStart(2, "0")} · Decreto 2229 de 2023`
          : `por los dos últimos dígitos de tu cédula (${String(digitos).padStart(2, "0")})`}
      </span>
    </div>
  );
}

/**
 * Los dias que faltan, dichos como los diria una persona.
 *
 * Cuando ya se vencio se dice la SANCION y no los dias de atraso: cuantos dias pasaron no le sirve
 * a nadie, y lo que hay que saber es que cada mes cuesta y que hay un minimo.
 */
function dichoEnDias(dias, vencido, profunda) {
  if (vencido) {
    return profunda
      ? "en mora: sanción por extemporaneidad del 5% del impuesto por mes de retardo (art. 641), mínimo 10 UVT"
      : "Ya hay una sanción corriendo. Presentar cuanto antes la reduce.";
  }
  if (dias === 0) return "Es hoy.";
  if (dias === 1) return "Es mañana.";
  return `faltan ${dias} días`;
}
