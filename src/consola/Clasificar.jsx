/**
 * Decirle al sistema que fue ese ingreso, para que entre a la declaracion.
 *
 * VIVE EN SU PROPIO ARCHIVO porque lo necesitan las dos pantallas que resuelven renglones: la mesa
 * del cruce y la tarjeta con la que se corrige lo ya decidido. Estaba solo en la segunda, asi que
 * desde la mesa CLASIFICAR salia con el nombre del enum en crudo y abria un formulario que ni
 * siquiera pedia la cedula: la peticion habria salido incompleta.
 */

import { useState } from "react";

import { api } from "./api";
import { useAction } from "./hooks";
import { ErrorApi } from "./componentes";
import {
  CLASES_DE_INGRESO,
  HECHOS_DE_CLASIFICACION,
  claseEnFrase,
  nombreDeClase,
} from "./decisiones";

/**
 * Decirle al sistema qué fue ese ingreso, para que entre a la declaración.
 *
 * POR QUE NO ES UN SELECT LIBRE DE CEDULAS. La cedula cambia el impuesto: rentas de trabajo da
 * acceso al 25% exento del art. 206 num. 10 y rentas de capital no. Un desplegable con las tres
 * opciones seria, literalmente, un boton para bajar el impuesto. Lo que se pregunta es el HECHO
 * (que fue ese pago, y si restaste costos o tuviste empleados) y el backend deriva la cedula: la
 * tabla motivo→clases la manda `clases_posibles`, no una copia en el front.
 *
 * LA SUGERENCIA VIENE PRESELECCIONADA pero hay que confirmarla. `clase_sugerida` sale del concepto
 * de la exogena — servicios y honorarios son, en la practica, el ingreso del independiente — y eso
 * ahorra el trabajo en el caso mayoritario. Aplicarla sola no se puede: depende de un hecho que no
 * esta en ningun documento, y regalarle el 25% exento a quien no tiene derecho es inexactitud,
 * sancion del 100% del mayor impuesto mas mora.
 */
function Clasificar({ caseId, partida, profunda, motivos, onListo }) {
  const porMotivo = partida.clases_posibles ?? {};
  const sugerida = partida.clase_sugerida;

  // El motivo que contiene la clase sugerida arranca elegido; si no hay sugerencia, ninguno.
  const motivoInicial = sugerida
    ? Object.keys(porMotivo).find((m) => porMotivo[m].includes(sugerida))
    : null;
  const [motivo, setMotivo] = useState(motivoInicial ?? "");
  const [clase, setClase] = useState(sugerida ?? "");
  const resolver = useAction((payload) => api.resolverPartida(caseId, partida.id, payload));

  const clasesDelMotivo = porMotivo[motivo] ?? [];
  // Con un solo destino posible, elegirlo aparte es un paso vacío.
  const claseEfectiva = clasesDelMotivo.length === 1 ? clasesDelMotivo[0] : clase;
  const listo = Boolean(motivo && claseEfectiva && clasesDelMotivo.includes(claseEfectiva));

  const aplicar = async () => {
    const ok = await resolver.run({
      decision: "CLASIFICAR",
      motivo,
      clase: claseEfectiva,
      quien: profunda ? "contador" : "cliente",
    });
    if (ok) onListo();
  };

  return (
    <div className="clasificar">
      <ul className="clasificar-opciones">
        {motivos.map((m) => (
          <li key={m}>
            <label className="clasificar-opcion">
              <input
                type="radio"
                name={`clase-${partida.id}`}
                checked={motivo === m}
                onChange={() => {
                  setMotivo(m);
                  const unica = porMotivo[m] ?? [];
                  setClase(unica.length === 1 ? unica[0] : "");
                }}
              />
              <span>
                {HECHOS_DE_CLASIFICACION[m]?.[profunda ? "contador" : "titular"] ?? m}
                {/* Con un solo destino se dice acá mismo: es la consecuencia de elegir esto. */}
                {(porMotivo[m] ?? []).length === 1 ? (
                  <span className="clasificar-destino">
                    {profunda ? "va a " : "entra como "}
                    {claseEnFrase(porMotivo[m][0], profunda)}
                  </span>
                ) : null}
              </span>
            </label>
            {/* La nota legal, solo donde hay condición que cumplir. */}
            {motivo === m && (porMotivo[m] ?? []).length === 1
              ? (() => {
                  const nota = CLASES_DE_INGRESO[porMotivo[m][0]]?.nota;
                  return nota ? <p className="clasificar-nota">{nota}</p> : null;
                })()
              : null}
          </li>
        ))}
      </ul>

      {/* Cuando el hecho admite más de un destino ("en realidad fue otra cosa"), hay que decir cuál. */}
      {motivo && clasesDelMotivo.length > 1 ? (
        <label className="campo">
          <span>{profunda ? "A qué cédula" : "¿Qué fue entonces?"}</span>
          <select value={clase} onChange={(e) => setClase(e.target.value)}>
            <option value="">Elegir…</option>
            {clasesDelMotivo.map((c) => (
              <option key={c} value={c}>
                {nombreDeClase(c, profunda)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <button className="btn-grande" disabled={!listo || resolver.running} onClick={aplicar}>
        {resolver.running ? "Guardando…" : profunda ? "Clasificar" : "Confirmar"}
      </button>
      <ErrorApi error={resolver.error} />
    </div>
  );
}

export default Clasificar;
