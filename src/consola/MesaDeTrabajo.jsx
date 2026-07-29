/**
 * La mesa de trabajo del contador: en qué va esta declaración y qué falta para cerrarla.
 *
 * POR QUE EXISTE, Y ES UN ERROR DE DISENO QUE HABIA QUE CORREGIR
 *
 * La pantalla se construyo pensando que la del cliente le servia al contador con mas
 * profundidad. Eso es cierto para el lenguaje y la jerarquia, y falso para la TAREA: el cliente
 * viene a enterarse, el contador viene a trabajar. Y un trabajo tiene cola y estado de
 * terminado; enterarse no.
 *
 * El resultado medido eran diez secciones al mismo nivel, seis pantallas y media de alto, cinco
 * cifras grandes compitiendo, y lo que el contador tiene que hacer repartido en TRES listas
 * separadas por mil quinientos pixeles: los avisos por revisar, los renglones del cruce sin
 * decidir y los documentos por pedir. Para quien hace el trabajo, esas tres son una sola cola.
 *
 * Encima le salia "Lo que te ahorras", que es la respuesta a una pregunta que el contador no
 * hizo: esa cifra es del cliente.
 *
 * ESTO NO DUPLICA LA INTERACCION. Cada renglon de la cola dice qué falta y lleva a donde se
 * resuelve; resolver sigue viviendo en su seccion, con una sola implementacion. La cola es un
 * indice del trabajo, no otro sitio donde hacerlo.
 */

import { ArrowRight, Check } from "lucide-react";

import { api } from "./api";
import { useAction } from "./hooks";
import { formatMoney } from "./formato";
import { ErrorApi } from "./componentes";

/** Lleva a la sección donde se resuelve, y la deja resaltada un momento. */
function irA(id) {
  const destino = document.getElementById(id);
  if (!destino) return;
  destino.scrollIntoView({ behavior: "smooth", block: "start" });
  destino.classList.add("recien-llegado");
  setTimeout(() => destino.classList.remove("recien-llegado"), 1400);
}

export default function MesaDeTrabajo({ caso, conciliacion, peticiones, liquidacion, onCambio }) {
  const cerrar = useAction(() => api.cerrarLiquidacion(caso.id));

  // Las tres fuentes de trabajo, contadas donde viven.
  const avisos = caso.flags.filter((f) => !f.resolved_at && f.severity !== "info");
  const sinDecidir = (conciliacion?.partidas ?? []).filter((p) => !p.resolucion);
  const porPedir = peticiones ?? [];
  const bloqueo = conciliacion?.falta_para_liquidar ?? null;

  const cola = [
    avisos.length && {
      id: "avisos",
      que: avisos.length === 1 ? "Confirmar 1 cosa del reporte" : `Confirmar ${avisos.length} cosas del reporte`,
      detalle: avisos[0].message,
      cuanto: null,
    },
    sinDecidir.length && {
      id: "cruce",
      que: `Decidir ${sinDecidir.length} ${sinDecidir.length === 1 ? "renglón" : "renglones"} del cruce`,
      detalle: "Sin todos decididos la declaración no se puede armar.",
      cuanto: sinDecidir.reduce((suma, p) => suma + (p.plata_en_juego ?? 0), 0),
    },
    porPedir.length && {
      id: "peticiones",
      que: `Pedirle ${porPedir.length} ${porPedir.length === 1 ? "documento" : "documentos"} al cliente`,
      detalle: porPedir[0].pregunta_previa ?? porPedir[0].razon,
      cuanto: porPedir.reduce((suma, p) => suma + (p.ahorro_estimado ?? 0), 0) || null,
    },
  ].filter(Boolean);

  const puedeCerrar = !bloqueo && !avisos.length && !sinDecidir.length;
  const yaCerrada = caso.status === "DRAFT_READY" || caso.status === "SUBMITTED";
  const impuesto = liquidacion?.actual?.impuesto;

  return (
    <section className="mesa">
      <p className="mesa-estado">
        {yaCerrada
          ? "Declaración dada por lista"
          : puedeCerrar
            ? "Lista para cerrar"
            : `${cola.length === 1 ? "Falta una cosa" : `Faltan ${cola.length} cosas`} para poder cerrar`}
      </p>

      {impuesto !== undefined && impuesto !== null ? (
        <p className="mesa-cifra">
          <span className="money">{formatMoney(impuesto)}</span>
          <span className="mesa-cifra-nota">de impuesto con lo que hay hoy</span>
        </p>
      ) : null}

      {bloqueo ? <p className="mesa-bloqueo">{bloqueo}</p> : null}

      {cola.length ? (
        <ol className="mesa-cola">
          {cola.map((paso) => (
            <li key={paso.id}>
              <button onClick={() => irA(paso.id)}>
                <span className="mesa-que">{paso.que}</span>
                <span className="mesa-detalle">{paso.detalle}</span>
                {paso.cuanto ? (
                  <span className="mesa-cuanto money">{formatMoney(paso.cuanto)} en juego</span>
                ) : null}
                <ArrowRight size={15} className="mesa-flecha" />
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      {puedeCerrar && !yaCerrada ? (
        <div className="mesa-cerrar">
          <button
            className="btn-grande"
            disabled={cerrar.running}
            onClick={async () => {
              if (await cerrar.run()) onCambio();
            }}
          >
            <Check size={16} />
            {cerrar.running ? "Cerrando…" : "Dar la declaración por lista"}
          </button>
          <ErrorApi error={cerrar.error} />
        </div>
      ) : null}
    </section>
  );
}
