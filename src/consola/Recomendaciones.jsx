/**
 * Cuánta plata hay en juego, beneficio por beneficio.
 *
 * LA CIFRA ES IMPUESTO QUE SE DEJA DE PAGAR, no reducción de la base gravable. Son dos números muy
 * distintos y el que le importa a una persona es el primero: un dependiente baja la base en 72 UVT,
 * pero cuánto baja el impuesto depende de la tarifa marginal de ESE contribuyente y puede ser cero.
 * Por eso no se habla en UVT en ningún lado de esta pantalla: la UVT es la unidad en que está
 * escrita la ley, no la unidad en que la gente piensa su plata.
 *
 * "HASTA" NO ES ADORNO. Cuánto pagó de prepagada o de intereses de vivienda lo sabe el cliente, no
 * nosotros, así que el backend estima sobre el TECHO legal del beneficio y lo marca
 * (`ahorro_es_techo`). Escribir "$3.098.900" a secas sería prometerle una cifra que nadie sostiene.
 *
 * TRES CONCLUSIONES DISTINTAS, Y NO SE PUEDEN CONFUNDIR:
 *
 *   hay plata en juego        → vale la pena buscar los certificados
 *   ninguno baja nada         → NO vale la pena; ya no queda impuesto que bajar
 *   no se pudo calcular       → no se sabe; primero hay que resolver lo que bloquea el cálculo
 *
 * Las tres se veían como "$ 0" antes de que el backend las separara. La segunda y la tercera llevan
 * a acciones opuestas, así que colapsarlas es peor que no mostrar nada.
 */

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { formatMoney } from "./formato";
import { useVista } from "./vista";

/** Lo aplicado va al final: es lo que ya está dentro de la cifra, no una recomendación. */
const ORDEN_DE_ESTADO = { DISPONIBLE: 0, DESCARTADO: 1, APLICADO: 2 };

export default function Recomendaciones({ recomendaciones }) {
  const { profunda } = useVista();
  const items = recomendaciones?.items ?? [];
  if (!items.length) return null;

  const enJuego = recomendaciones.ahorro_disponible;
  const todoSinMedir = recomendaciones.sin_medir === items.length;
  const ordenados = [...items].sort(
    (a, b) =>
      ORDEN_DE_ESTADO[a.estado] - ORDEN_DE_ESTADO[b.estado] ||
      b.ahorro - a.ahorro ||
      a.etiqueta.localeCompare(b.etiqueta),
  );

  return (
    <section className="reco">
      <Titular
        enJuego={enJuego}
        ningunoAhorra={recomendaciones.ninguno_ahorra}
        todoSinMedir={todoSinMedir}
        profunda={profunda}
      />
      <ul className="reco-lista">
        {ordenados.map((r) => (
          <Fila key={r.pregunta} r={r} profunda={profunda} />
        ))}
      </ul>
    </section>
  );
}

/**
 * La conclusión, arriba y una sola vez.
 *
 * Con el impuesto en cero los siete beneficios dicen lo mismo ("no queda impuesto que bajar"), y
 * repetir esa frase siete veces la vuelve ruido. Se dice una vez y las filas quedan atenuadas.
 */
function Titular({ enJuego, ningunoAhorra, todoSinMedir, profunda }) {
  if (todoSinMedir) {
    return (
      <header className="reco-top">
        <h3 className="reco-titulo">Todavía no podemos calcular esto</h3>
        <p className="reco-nota">
          {profunda
            ? "El optimizador no corre sobre una base incompleta: hay que resolver los avisos bloqueantes primero."
            : "Falta resolver algo antes de poder decirte cuánto te ahorraría cada uno. Está señalado en el último paso."}
        </p>
      </header>
    );
  }
  if (ningunoAhorra) {
    return (
      <header className="reco-top">
        <h3 className="reco-titulo">
          {profunda ? "Ningún beneficio baja el impuesto" : "No te falta ningún papel"}
        </h3>
        <p className="reco-nota">
          {profunda
            ? "El impuesto ya es cero, así que ninguna deducción adicional lo mueve. No vale la pena pedirle certificados al cliente."
            : "Con lo que ya tienes registrado no te queda impuesto por pagar, así que ninguna deducción te baja nada. No tienes que salir a buscar certificados."}
        </p>
      </header>
    );
  }
  return (
    <header className="reco-top">
      <h3 className="reco-titulo">
        {profunda ? "Lo que falta puede valer" : "Podrías pagar hasta"}{" "}
        <span className="reco-cifra money">{formatMoney(enJuego)}</span>{" "}
        {profunda ? "de impuesto" : "menos"}
      </h3>
      <p className="reco-nota">
        {profunda
          ? "Suma de techos legales, no de mediciones: cuánto pagó de cada cosa lo sabe el cliente."
          : "Es un máximo: depende de cuánto hayas pagado de cada cosa. Abajo está el detalle de cada una."}
      </p>
    </header>
  );
}

function Fila({ r, profunda }) {
  const [abierto, setAbierto] = useState(false);
  const aplicado = r.estado === "APLICADO";
  const descartado = r.estado === "DESCARTADO";
  const mueve = r.ahorro > 0 && !aplicado;

  return (
    <li className={mueve ? "reco-item" : "reco-item reco-item-quieto"}>
      <div className="reco-linea">
        <span className="reco-que">
          {/* Primera en mayúscula: la etiqueta está escrita para ir dentro de una frase. */}
          {r.etiqueta.charAt(0).toUpperCase() + r.etiqueta.slice(1)}
          {aplicado ? <span className="reco-marca">ya está aplicado</span> : null}
          {descartado ? (
            <span className="reco-marca">
              {profunda ? "el cliente dijo que no" : "dijiste que no lo tienes"}
            </span>
          ) : null}
        </span>
        <span className="reco-monto money">
          {mueve ? `${r.ahorro_es_techo ? "hasta " : ""}${formatMoney(r.ahorro)}` : "—"}
        </span>
      </div>

      {/* El porqué de un cero es la información: distingue "no sirve" de "no se pudo calcular". */}
      {r.ahorro_por_que ? <p className="reco-porque">{r.ahorro_por_que}</p> : null}

      <button className="doc-plegable" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {abierto ? "qué es" : "qué es esto"}
      </button>
      {abierto ? <p className="reco-razon">{r.razon}</p> : null}
    </li>
  );
}
