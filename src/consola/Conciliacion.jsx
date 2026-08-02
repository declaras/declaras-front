/**
 * La mesa: lo que la DIAN sabe frente a lo que el cliente aporta, renglon por renglon.
 *
 * Es el trabajo del contador hecho visible. Cada renglon es un tercero y un concepto, con sus
 * dos versiones al lado y las dos diferencias que importan (el monto y la retencion, que se
 * mueven por separado).
 *
 * LAS DECISIONES NO SE DECIDEN AQUI. El backend manda `decisiones_posibles` por renglon —
 * decision -> motivos validos— y esta pantalla pinta lo que venga. Copiar esa tabla seria
 * duplicar cuatro dimensiones (estado x decision x concepto x motivo) que ya cambiaron tres
 * veces: ofrecer una decision donde no aplica es un 409, y esconderla donde si aplica deja el
 * renglon sin salida.
 *
 * `reportado_a` NO ES DECORACION. Significa "esta plata es de otra persona": el tercero la
 * reporto a otra cedula, o a la del titular pero a nombre de alguien mas. Un renglon asi que se
 * pinte igual que los demas vuelve a meter el ingreso de un tercero en la declaracion del
 * cliente, que es el error que el sistema mas trabajo tuvo en cerrar.
 *
 * Y NO SE CONSTRUYE LOGICA SOBRE `nota`: es texto libre y el backend lo reescribe cuando los
 * valores cambian. Lo que es estructural viaja en campos propios.
 */

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, UserX } from "lucide-react";

import { api } from "./api";
import { useAction } from "./hooks";
import { formatMoney } from "./formato";
import { ErrorApi, Vacio } from "./componentes";

/** Como se llama cada desenlace del cruce, dicho sin jerga. */
const ESTADO = {
  COINCIDE: { texto: "Cuadra", tono: "ok" },
  DISCREPANCIA: { texto: "No cuadra", tono: "alerta" },
  SOLO_DIAN: { texto: "Solo la DIAN", tono: "falta" },
  SOLO_DOCUMENTO: { texto: "Solo el documento", tono: "falta" },
  CONCEPTO_DESCONOCIDO: { texto: "Sin clasificar", tono: "falta" },
};

/** Que hace cada decision, en una linea. */
const DECISION = {
  USAR_DIAN: "Usar la cifra de la DIAN",
  USAR_DOCUMENTO: "Usar la cifra del documento",
  USAR_OTRO: "Poner otra cifra",
  MARCAR_AJENO: "No es del cliente",
  CERRAR_SIN_SOPORTE: "Cerrar sin documento",
  LLEVAR_A_MANO: "Llevarlo a mano (el motor no lo liquida)",
};

/** Como se nombra cada decision cuando cabe en una sola linea de la fila cerrada. */
const DECISION_CORTA = {
  USAR_DIAN: "Se usa la DIAN",
  USAR_DOCUMENTO: "Se usa el documento",
  USAR_OTRO: "Cifra propia",
  MARCAR_AJENO: "No es del cliente",
  CERRAR_SIN_SOPORTE: "Sin documento",
  LLEVAR_A_MANO: "Va a mano",
};

/** Decisiones que ponen una cifra en la declaracion; en las demas el valor es cero y no dice nada. */
const PONE_CIFRA = new Set(["USAR_DIAN", "USAR_DOCUMENTO", "USAR_OTRO"]);

const MOTIVO = {
  COINCIDEN: "las dos cifras coinciden",
  ERROR_DEL_TERCERO: "el tercero reportó mal",
  ERROR_DEL_CERTIFICADO: "el certificado está mal",
  NO_ES_MIO: "no es del cliente",
  FALTA_DOCUMENTO: "falta el documento",
  DECISION_DEL_CONTADOR: "criterio del contador",
  FUERA_DEL_MOTOR: "fuera del alcance del cálculo",
  SIN_CONTRAPARTE_DIAN: "la DIAN no reporta nada que comparar",
};

export default function Conciliacion({ caseId, conciliacion, onCambio }) {
  if (!conciliacion) return null;
  const { partidas, resoluciones_sin_partida: huerfanas } = conciliacion;

  if (!partidas.length) {
    return (
      <section className="bloque">
        <header className="bloque-top">
          <h2 className="bloque-titulo">El cruce</h2>
        </header>
        <Vacio>Todavía no hay renglones. Hay que cruzar el reporte de la DIAN.</Vacio>
      </section>
    );
  }

  const pendientes = partidas.filter((p) => !p.resolucion);

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">El cruce</h2>
        <p className="bloque-nota">
          {pendientes.length
            ? `Faltan ${pendientes.length} de ${partidas.length} por decidir. Los de arriba mueven más plata.`
            : `${partidas.length} renglones, todos decididos.`}
        </p>
      </header>

      {conciliacion.falta_para_liquidar ? (
        <p className="ganancia-rancia" role="status">
          <AlertTriangle size={15} style={{ verticalAlign: "-2px", marginRight: 7 }} />
          {conciliacion.falta_para_liquidar}
        </p>
      ) : null}

      <ul className="partidas">
        {partidas.map((p) => (
          <Partida key={p.id} caseId={caseId} partida={p} onCambio={onCambio} />
        ))}
      </ul>

      {huerfanas?.length ? <Huerfanas huerfanas={huerfanas} /> : null}
    </section>
  );
}

/**
 * Un renglon del cruce.
 *
 * COLAPSADO POR DEFECTO CUANDO YA ESTA DECIDIDO, y esa es la decision de diseno que ordena todo
 * lo demas. Antes cada renglon era una tarjeta de 240 pixeles con dos sub-tarjetas, y como en la
 * mayoria de los casos el cliente todavia no ha aportado nada, se pintaban veintiseis cajas
 * vacias con borde punteado para decir que no hay nada. Veintiseis renglones ocupaban seis mil
 * pixeles y la cifra de la DIAN iba en tamano de titular las veintiseis veces: cuando todo
 * grita, no se oye nada.
 *
 * Ahora la fila dice lo minimo para decidir si hay que abrirla —quien reporto, cuanto, y en que
 * quedo— y lo que falta esta a un clic. Lo que sigue abierto de entrada es lo que pide trabajo:
 * un renglon sin decidir.
 */
function Partida({ caseId, partida, onCambio }) {
  const estado = ESTADO[partida.estado] ?? { texto: partida.estado, tono: "falta" };
  const ajena = Boolean(partida.reportado_a);
  const resuelta = Boolean(partida.resolucion);
  const [abierta, setAbierta] = useState(!resuelta);

  const cifra = partida.version_dian?.monto ?? partida.version_documento?.monto;

  return (
    <li className={`partida partida-${estado.tono} ${ajena ? "partida-ajena" : ""}`}>
      <button className="partida-fila" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta}>
        <span className="partida-chevron">
          {abierta ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
        <span className="partida-quien">
          <span className="partida-tercero">{partida.nombre_tercero || partida.nit_tercero}</span>
          <span className="partida-concepto">
            {partida.concepto ?? partida.codigos_crudos.join(", ") ?? "sin clasificar"}
          </span>
        </span>
        {cifra !== undefined && cifra !== null ? (
          <span className="partida-cifra money">{formatMoney(cifra)}</span>
        ) : null}
        <span className="partida-desenlace">
          {resuelta ? (
            <ResumenResolucion resolucion={partida.resolucion} />
          ) : (
            <span className={`chip chip-${estado.tono}`}>{estado.texto}</span>
          )}
        </span>
      </button>

      {ajena ? (
        <p className="partida-aviso-ajena">
          <UserX size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          El tercero reportó esta plata a <strong>{partida.reportado_a}</strong>, no al cliente.
          Si de verdad no es suya, hay que marcarla y no entra a la declaración.
        </p>
      ) : null}

      {abierta ? (
        <div className="partida-detalle">
          <div className="partida-versiones">
            <Version titulo="La DIAN" valor={partida.version_dian} />
            {/* La columna del documento solo existe si hay documento. Una caja vacia repetida
                en cada renglon no informa: dice lo mismo que su ausencia, ocupando el doble. */}
            {partida.version_documento ? (
              <Version
                titulo="El documento"
                valor={partida.version_documento}
                versiones={partida.versiones_documento}
                rige={partida.version_que_rige}
              />
            ) : (
              <p className="partida-sin-documento">El cliente todavía no ha aportado nada.</p>
            )}
          </div>

          {partida.diferencia_monto || partida.diferencia_retencion ? (
            <p className="partida-diferencias">
              {partida.diferencia_monto ? (
                <span>Diferencia en el monto: {formatMoney(partida.diferencia_monto)}</span>
              ) : null}
              {partida.diferencia_retencion ? (
                <span>Diferencia en la retención: {formatMoney(partida.diferencia_retencion)}</span>
              ) : null}
            </p>
          ) : null}

          {partida.documentos_por_cruzar?.length ? (
            <p className="bloque-nota">
              Llegó un certificado que podría corresponder a este renglón y hay que cruzarlo a
              mano.
            </p>
          ) : null}

          {resuelta ? (
            <Resuelta resolucion={partida.resolucion} />
          ) : (
            <Decidir caseId={caseId} partida={partida} onCambio={onCambio} />
          )}
        </div>
      ) : null}
    </li>
  );
}

/** En la fila cerrada cabe la decision, no su justificacion. */
function ResumenResolucion({ resolucion }) {
  const delSistema = resolucion.origen === "SISTEMA";
  return (
    <span className={`partida-decidida ${delSistema ? "por-sistema" : ""}`}>
      {DECISION_CORTA[resolucion.decision] ?? resolucion.decision}
      {delSistema ? " · provisional" : ""}
    </span>
  );
}

function Version({ titulo, valor, versiones, rige }) {
  if (!valor) {
    return (
      <div className="version version-vacia">
        <p className="version-titulo">{titulo}</p>
        <p className="version-monto">—</p>
        <p className="version-detalle">no reporta nada</p>
      </div>
    );
  }
  return (
    <div className="version">
      <p className="version-titulo">{titulo}</p>
      <p className="version-monto">{formatMoney(valor.monto)}</p>
      <p className="version-detalle">
        {/* `retencion` puede ser null y eso NO es cero: significa que esa fuente no la reporta.
            Confundirlos marcaba discrepancias falsas del tamaño de toda la retención. */}
        {valor.retencion === null || valor.retencion === undefined
          ? "no dice la retención"
          : `retención ${formatMoney(valor.retencion)}`}
        {valor.celda ? ` · ${valor.celda}` : ""}
      </p>
      {versiones > 1 ? (
        <p className="version-rivales">
          Llegaron {versiones} certificados distintos; rige {rige ?? "el último"}.
        </p>
      ) : null}
    </div>
  );
}

/**
 * La justificacion de una decision ya tomada.
 *
 * NO REPITE LA DECISION: esa ya se leyo en la fila. Antes la linea decia
 * "No es del cliente · $ 0 · no es del cliente · contador" — la decision y el motivo son la
 * misma frase dos veces, y el "$ 0" es el valor que esa decision pone en el 210, que para una
 * exclusion es cero por definicion y no informa nada.
 */
function Resuelta({ resolucion }) {
  const delSistema = resolucion.origen === "SISTEMA";
  return (
    <p className={`partida-resuelta ${delSistema ? "por-sistema" : ""}`}>
      {MOTIVO[resolucion.motivo] ?? resolucion.motivo}
      {PONE_CIFRA.has(resolucion.decision) ? ` · queda en ${formatMoney(resolucion.valor)}` : ""}
      {delSistema ? " · lo puso el sistema y se puede cambiar" : ` · ${resolucion.quien}`}
      {resolucion.nota ? ` · “${resolucion.nota}”` : ""}
    </p>
  );
}

/**
 * Los botones que este renglon admite, tal como los manda el backend.
 *
 * `decisiones_posibles` es un mapa decision -> motivos validos. Se recorre; no se filtra ni se
 * completa desde aqui.
 */
function Decidir({ caseId, partida, onCambio }) {
  const [abierta, setAbierta] = useState(null);
  const posibles = partida.decisiones_posibles ?? {};
  const decisiones = Object.keys(posibles);

  if (!decisiones.length) {
    return <p className="bloque-nota">Este renglón no admite ninguna decisión todavía.</p>;
  }

  return (
    <div className="partida-decidir">
      <div className="partida-botones">
        {decisiones.map((d) => (
          <button
            key={d}
            className={`btn-mini ${abierta === d ? "btn-mini-activo" : ""}`}
            onClick={() => setAbierta(abierta === d ? null : d)}
          >
            {DECISION[d] ?? d}
          </button>
        ))}
      </div>
      {abierta ? (
        <FormularioDecision
          caseId={caseId}
          partida={partida}
          decision={abierta}
          motivos={posibles[abierta]}
          onListo={() => {
            setAbierta(null);
            onCambio();
          }}
        />
      ) : null}
    </div>
  );
}

function FormularioDecision({ caseId, partida, decision, motivos, onListo }) {
  const [motivo, setMotivo] = useState(motivos[0]);
  const [valor, setValor] = useState("");
  const [nota, setNota] = useState("");
  const resolver = useAction((payload) => api.resolverPartida(caseId, partida.id, payload));

  const pideValor = decision === "USAR_OTRO";

  return (
    <form
      className="decision-form"
      onSubmit={async (e) => {
        e.preventDefault();
        // Sin `quien`: el actor lo pone el backend con la credencial verificada. Mandarlo desde
        // aca era la mentira —el navegador declaraba quien habia decidido, y siempre decia
        // "contador" sin importar quien estuviera del otro lado.
        const payload = { decision, motivo };
        if (pideValor) payload.valor = Number(valor);
        if (nota.trim()) payload.nota = nota.trim();
        if (await resolver.run(payload)) onListo();
      }}
    >
      <label>
        Por qué
        <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
          {motivos.map((m) => (
            <option key={m} value={m}>
              {MOTIVO[m] ?? m}
            </option>
          ))}
        </select>
      </label>
      {pideValor ? (
        <label>
          Cifra
          <input
            type="number"
            min="0"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </label>
      ) : null}
      <label>
        Nota (opcional)
        <input value={nota} onChange={(e) => setNota(e.target.value)} />
      </label>
      <button className="btn-grande" disabled={resolver.running}>
        {resolver.running ? "Guardando…" : "Guardar"}
      </button>
      <ErrorApi error={resolver.error} />
    </form>
  );
}

/**
 * Decisiones cuyo renglon desaparecio del reporte.
 *
 * Pasa cuando la DIAN republica la exogena y una fila cambia de sitio o de nombre: el id del
 * renglon cambia con ella y la resolucion queda huerfana. Se pintan porque son trabajo hecho
 * por una persona: botarlas en silencio es perder una decision que alguien ya tomo.
 */
function Huerfanas({ huerfanas }) {
  return (
    <div className="huerfanas">
      <h3 className="bloque-subtitulo">Decisiones sin renglón</h3>
      <p className="bloque-nota">
        El reporte de la DIAN cambió y estos renglones ya no están. Las decisiones se
        conservan: si el renglón vuelve con las mismas cifras, se recuperan solas.
      </p>
      <ul className="partidas">
        {huerfanas.map((p) => (
          <li key={p.id} className="partida partida-falta">
            <p className="partida-tercero">{p.nombre_tercero || p.nit_tercero}</p>
            {p.resolucion ? <Resuelta resolucion={p.resolucion} /> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
