/**
 * Todo lo que ya se contesto, en UN solo lugar, y como cambiarlo.
 *
 * EL BUG QUE ARREGLA. Contestar sacaba la pregunta de la lista y no dejaba rastro: quien marcaba
 * "no es mio" por error no tenia forma de volver, y quien revisara despues no podia distinguir un
 * renglon que nadie miro de uno que alguien decidio. Son dos situaciones distintas y llevan a
 * decisiones distintas. El dominio siempre permitio re-resolver (`resolver()` reemplaza la
 * resolucion anterior, el contador puede corregirse); lo que faltaba era la puerta.
 *
 * POR QUE UNA LISTA Y NO DOS. El primer intento puso las decisiones de renglon en un bloque y las
 * respuestas de documentos en otro, y salieron dos enlaces uno debajo del otro que decian
 * "Ver 8 preguntas que ya contestaste" y "Ver 8 preguntas ya contestadas (8 en no)". Por dentro son
 * cosas distintas (una resuelve una partida del cruce, la otra apaga una peticion) pero para quien
 * las contesto son lo mismo: preguntas que ya respondio. Que la implementacion tenga dos caminos no
 * es razon para que la pantalla tenga dos listas.
 *
 * VA PLEGADO Y EN GRIS. Es registro, no trabajo pendiente. Pero tiene que estar, porque es la unica
 * forma de corregir un si o un no dado por error.
 *
 * EL PLEGADO VIVE EN LA URL, NO EN UN `useState`. Medido: con el estado adentro, cambiar una
 * respuesta cerraba la lista. La etapa cambia de rama cuando aparece un pendiente (de "no falta
 * nada" a "esto falta"), y en la otra rama este componente esta en otra posicion del arbol, asi que
 * React lo desmonta y lo vuelve a montar sin el estado. Justo en el flujo de corregir varias
 * seguidas, que es para lo que existe.
 *
 * Es el mismo bug que hacia saltar a la primera etapa al contestar, y se arregla igual: lo que tiene
 * que sobrevivir a un remonte no puede vivir dentro del componente que se remonta.
 */

import { useState } from "react";
import { useSearchParams } from "react-router";

import { api } from "./api";
import { useAction } from "./hooks";
import { formatDate, formatMoney } from "./formato";
import { ErrorApi } from "./componentes";
import { nombreDeDecision } from "./decisiones";

export default function YaContestado({ caseId, partidas, respuestas, profunda, onCambio, Decision }) {
  const [parametros, setParametros] = useSearchParams();
  const abierto = parametros.get("contestado") === "1";

  const alternar = () => {
    const siguiente = new URLSearchParams(parametros);
    if (abierto) siguiente.delete("contestado");
    else siguiente.set("contestado", "1");
    // `replace` para no llenar el historial: abrir y cerrar un plegado no son pasos atrás.
    setParametros(siguiente, { replace: true });
  };

  // Las dos fuentes se mezclan y se ordenan por cuándo: quien busca lo que acabó de contestar lo
  // encuentra arriba, sin tener que saber en qué parte del sistema vive.
  const filas = [
    ...partidas.map((p) => ({
      clave: `partida:${p.id}`,
      cuando: p.resolucion.cuando,
      partida: p,
    })),
    ...respuestas.map((r) => ({
      clave: `respuesta:${r.pregunta}`,
      cuando: r.cuando,
      respuesta: r,
    })),
  ].sort((a, b) => String(b.cuando).localeCompare(String(a.cuando)));

  if (!filas.length) return null;

  const noes =
    respuestas.filter((r) => !r.tiene).length +
    partidas.filter((p) => p.resolucion.decision === "MARCAR_AJENO").length;

  return (
    <div className="ya-contestado">
      <button className="enlace-suave" onClick={alternar}>
        {abierto
          ? "Ocultar lo ya contestado"
          : `Ver ${filas.length} pregunta${filas.length === 1 ? "" : "s"} que ya ${
              profunda ? "contestó" : "contestaste"
            }${noes ? ` (${noes} en no)` : ""}`}
      </button>

      {abierto ? (
        <ul className="contestadas">
          {filas.map((fila) =>
            fila.partida ? (
              <PartidaContestada
                key={fila.clave}
                caseId={caseId}
                partida={fila.partida}
                profunda={profunda}
                onCambio={onCambio}
                Decision={Decision}
              />
            ) : (
              <RespuestaContestada
                key={fila.clave}
                caseId={caseId}
                respuesta={fila.respuesta}
                profunda={profunda}
                onCambio={onCambio}
              />
            ),
          )}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Una decision sobre un renglon del cruce.
 *
 * Cambiarla reabre la misma tarjeta de decision que se uso para tomarla, y no un formulario aparte:
 * las opciones validas las manda el backend por partida (`decisiones_posibles`) y ofrecer una que
 * no aplica es un 409. `Decision` llega por props para no importar en circulo con `EtapaDecisiones`.
 */
function PartidaContestada({ caseId, partida, profunda, onCambio, Decision }) {
  const [cambiando, setCambiando] = useState(false);
  const r = partida.resolucion;
  const ajena = Boolean(partida.reportado_a);
  const dicho = nombreDeDecision(r.decision, { ajena, profunda });

  return (
    <li className="contestada">
      <div className="contestada-linea">
        <span className="contestada-que">
          {partida.nombre_tercero || partida.nit_tercero}
          <span className="contestada-dicho">{dicho}</span>
        </span>
        <span className="contestada-monto money">{formatMoney(r.valor)}</span>
        <button className="enlace-suave" onClick={() => setCambiando((v) => !v)}>
          {cambiando ? "dejar así" : "cambiar"}
        </button>
      </div>
      {profunda ? (
        <p className="contestada-quien">
          {r.quien} · {r.motivo.replaceAll("_", " ").toLowerCase()} · {formatDate(r.cuando)}
        </p>
      ) : null}
      {cambiando ? (
        <Decision
          caseId={caseId}
          partida={partida}
          profunda={profunda}
          onCambio={() => {
            setCambiando(false);
            onCambio();
          }}
        />
      ) : null}
    </li>
  );
}

/**
 * Una respuesta a "tienes tal documento".
 *
 * Aca cambiar es un solo clic porque la pregunta es binaria: se manda la respuesta contraria. Un
 * "no" dado por error apagaba la peticion para siempre, y con ella la deduccion que ese documento
 * habria soportado.
 *
 * Y AL LADO, DESHACER, que no es lo mismo y hacia falta. Cambiar sirve cuando se sabe la
 * respuesta correcta ("dije que no y si tengo prepagada"). Deshacer sirve cuando NO se sabe:
 * alguien contesto por error, probando, y lo que hace falta es que la pregunta vuelva a la cola
 * en vez de afirmar en nombre del cliente lo contrario de lo que ya se afirmo mal.
 */
function RespuestaContestada({ caseId, respuesta, profunda, onCambio }) {
  const cambiar = useAction(() =>
    api.postRespuesta(caseId, { pregunta: respuesta.pregunta, tiene: !respuesta.tiene }),
  );
  const deshacer = useAction(() => api.deshacerRespuesta(caseId, respuesta.pregunta));

  // La etiqueta viene escrita para ir DENTRO de una oración ("el soporte de salarios"), así que se
  // usa así y no como título: partida en dos líneas quedaba "el soporte de salarios / No lo tienes",
  // con la primera en minúscula y sin verbo. La frase completa dice lo mismo y se lee.
  const frase = profunda
    ? `${respuesta.tiene ? "Sí tiene" : "No tiene"} ${respuesta.etiqueta}`
    : `${respuesta.tiene ? "Sí tienes" : "No tienes"} ${respuesta.etiqueta}`;

  return (
    <li className="contestada">
      <div className="contestada-linea">
        <span className="contestada-que contestada-frase">{frase}</span>
        <button
          className="enlace-suave"
          disabled={cambiar.running}
          onClick={async () => {
            if (await cambiar.run()) onCambio();
          }}
        >
          {cambiar.running ? "cambiando…" : respuesta.tiene ? "marcar que no" : "marcar que sí"}
        </button>
        <button
          className="enlace-suave"
          disabled={deshacer.running}
          onClick={async () => {
            if (await deshacer.run()) onCambio();
          }}
        >
          {deshacer.running ? "deshaciendo…" : "deshacer"}
        </button>
      </div>
      {profunda ? (
        <p className="contestada-quien">
          {respuesta.quien} · {formatDate(respuesta.cuando)}
        </p>
      ) : null}
      <ErrorApi error={cambiar.error} />
      <ErrorApi error={deshacer.error} />
    </li>
  );
}
