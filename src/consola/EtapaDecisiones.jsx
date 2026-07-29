/**
 * ETAPA 2. Las decisiones, UNA A LA VEZ.
 *
 * POR QUE UNA Y NO LA LISTA: el trabajo real es decidir renglon por renglon, y una pared de
 * veintiseis tarjetas no se lee, se sufre. Medido antes de esto: 1.999 pixeles de lista para
 * veintiseis decisiones, con la cifra en tamano de titular veintiseis veces. Cuando todo grita,
 * no se oye nada.
 *
 * Con una a la vez y el progreso a la vista ("7 de 26") la misma tarea se vuelve un ritmo. Y hay
 * un "ver todas" para quien las revisa en bloque, porque a veces se necesita comparar.
 *
 * TRES CLASES DE PREGUNTA, y solo la primera la puede contestar el titular:
 *
 *   ¿esta plata es tuya?      la sabe el titular y nadie mas
 *   ¿que cifra rige?          hay dos versiones y hay que elegir: es tecnica
 *   falta el documento        no es una decision, es un pedido
 *
 * En la vista del cliente se le muestran las primeras; las tecnicas quedan marcadas y pasan a la
 * cola del contador, porque pedirle a alguien que elija entre dos cifras que no entiende es
 * pedirle que firme algo que no puede sostener.
 */

import { useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";

import { api } from "./api";
import { useAction } from "./hooks";
import { formatMoney } from "./formato";
import { ErrorApi } from "./componentes";
import Conciliacion from "./Conciliacion";
import Peticiones from "./Peticiones";
import Pendientes from "./Pendientes";

/** Las decisiones que solo dependen de algo que el titular sabe: si esa plata es suya. */
const DEL_TITULAR = new Set(["MARCAR_AJENO", "USAR_DIAN"]);

export default function EtapaDecisiones({
  caseId,
  caso,
  conciliacion,
  peticiones,
  respuestas,
  profunda,
  onCambio,
  onSeguir,
}) {
  const [verTodas, setVerTodas] = useState(false);
  const partidas = conciliacion?.partidas ?? [];
  const sinDecidir = partidas.filter((p) => !p.resolucion);
  const porConfirmar = caso.flags.filter((f) => !f.resolved_at && f.severity !== "info");

  // Cuando no queda nada por decidir, la etapa se cierra sola y ofrece seguir.
  if (!sinDecidir.length && !porConfirmar.length && !(peticiones ?? []).length) {
    return (
      <section className="etapa-cuerpo">
        <h1 className="etapa-titulo">No falta ninguna decisión</h1>
        <p className="etapa-nota">
          Todos los renglones están decididos y no hay documentos pendientes.
        </p>
        <button className="btn-grande" onClick={onSeguir}>
          Ver el borrador <ArrowRight size={16} />
        </button>
      </section>
    );
  }

  return (
    <section className="etapa-cuerpo">
      <h1 className="etapa-titulo">Lo que hay que decidir</h1>

      {sinDecidir.length ? (
        <div className="decision-marco">
          <p className="decision-progreso">
            <span>
              Renglón {partidas.length - sinDecidir.length + 1} de {partidas.length}
            </span>
            <button className="enlace-suave" onClick={() => setVerTodas((v) => !v)}>
              {verTodas ? "volver a una por una" : `ver las ${sinDecidir.length} de una vez`}
            </button>
          </p>

          {verTodas ? (
            <Conciliacion caseId={caseId} conciliacion={conciliacion} onCambio={onCambio} />
          ) : (
            <Decision
              caseId={caseId}
              partida={sinDecidir[0]}
              profunda={profunda}
              onCambio={onCambio}
            />
          )}
        </div>
      ) : null}

      {porConfirmar.length ? <Pendientes caso={caso} onCambio={onCambio} /> : null}

      {(peticiones ?? []).length ? (
        <Peticiones
          caseId={caseId}
          peticiones={peticiones}
          respuestas={respuestas}
          onCambio={onCambio}
        />
      ) : null}
    </section>
  );
}

/**
 * Una decision, con lo minimo para tomarla.
 *
 * Las opciones las manda el backend en `decisiones_posibles`: no se filtran ni se completan aca,
 * porque ofrecer una donde no aplica es un 409 y esconderla donde si aplica deja el renglon sin
 * salida. Lo que si cambia es COMO se presentan segun quien mira.
 */
function Decision({ caseId, partida, profunda, onCambio }) {
  const posibles = partida.decisiones_posibles ?? {};
  const claves = Object.keys(posibles);
  const [abierta, setAbierta] = useState(null);

  const dian = partida.version_dian;
  const doc = partida.version_documento;
  const ajena = Boolean(partida.reportado_a);

  // Para el cliente, una decisión técnica no es una pregunta: es algo que otro tiene que mirar.
  const soloTecnicas = claves.length > 0 && !claves.some((d) => DEL_TITULAR.has(d));
  if (!profunda && soloTecnicas) {
    return (
      <div className="decision">
        <p className="decision-tercero">{partida.nombre_tercero || partida.nit_tercero}</p>
        <p className="decision-pregunta">Estamos revisando esta cifra</p>
        <p className="decision-nota">
          Hay dos versiones de este valor y elegir entre ellas es una decisión técnica. Un
          contador la revisa; no necesitas hacer nada.
        </p>
      </div>
    );
  }

  return (
    <div className="decision">
      <p className="decision-tercero">{partida.nombre_tercero || partida.nit_tercero}</p>

      <p className="decision-pregunta">
        {ajena
          ? `¿Este dinero es tuyo?`
          : doc
            ? "¿Cuál cifra es la correcta?"
            : `¿Reconoces este ingreso?`}
      </p>

      <div className="decision-cifras">
        {dian ? (
          <p>
            <span className="decision-quien">La DIAN reporta</span>
            <span className="decision-monto money">{formatMoney(dian.monto)}</span>
          </p>
        ) : null}
        {doc ? (
          <p>
            <span className="decision-quien">Tu documento dice</span>
            <span className="decision-monto money">{formatMoney(doc.monto)}</span>
          </p>
        ) : null}
      </div>

      {ajena ? (
        <p className="decision-nota">
          El tercero lo reportó a nombre de <strong>{partida.reportado_a}</strong>, no al tuyo.
        </p>
      ) : null}

      {profunda ? (
        <p className="decision-tecnico">
          {partida.concepto ?? "sin clasificar"} · {partida.estado}
          {dian?.celda ? ` · ${dian.celda}` : ""}
        </p>
      ) : null}

      <div className="decision-opciones">
        {/* Al titular, sobre una fila ajena, se le ofrecen las dos caras de SU pregunta y no las
            técnicas: "poner otra cifra" y "llevarlo a mano" son decisiones de contador, y
            mezclarlas con "¿es tuyo?" convierte una pregunta de sí o no en un formulario. */}
        {(ajena && !profunda ? claves.filter((d) => DEL_TITULAR.has(d)) : claves).map((d) => (
          <Opcion
            key={d}
            caseId={caseId}
            partida={partida}
            decision={d}
            motivos={posibles[d]}
            ajena={ajena}
            abierta={abierta === d}
            onAbrir={() => setAbierta(abierta === d ? null : d)}
            onListo={onCambio}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Como se llama cada decision cuando la pregunta es "es tuyo": si o no, sin jerga.
 *
 * El par lo da el backend y no hay que inventarlo: sobre una fila ajena ofrece `USAR_DIAN` (que
 * es aceptar la cifra reportada, o sea "si es mio") y `MARCAR_AJENO` ("no es mio"). Las otras dos
 * que ofrece son tecnicas y no se le muestran al titular como si fueran la misma pregunta.
 */
const COMO_TITULAR = { USAR_DIAN: "Sí, es mío", MARCAR_AJENO: "No, no es mío" };
const COMO_CONTADOR = {
  USAR_DIAN: "Usar la de la DIAN",
  USAR_DOCUMENTO: "Usar la del documento",
  USAR_OTRO: "Poner otra cifra",
  MARCAR_AJENO: "No es del cliente",
  CERRAR_SIN_SOPORTE: "Cerrar sin documento",
  LLEVAR_A_MANO: "Llevarlo a mano",
};

function Opcion({ caseId, partida, decision, motivos, ajena, abierta, onAbrir, onListo }) {
  const [valor, setValor] = useState("");
  const resolver = useAction((payload) => api.resolverPartida(caseId, partida.id, payload));
  const pideCifra = decision === "USAR_OTRO";
  const esDelTitular = DEL_TITULAR.has(decision);

  const texto = (ajena && COMO_TITULAR[decision]) || COMO_CONTADOR[decision] || decision;

  // Una decisión con un solo motivo válido y sin cifra no necesita formulario: se aplica directo.
  const directa = motivos.length === 1 && !pideCifra;

  const aplicar = async (motivo) => {
    const payload = { decision, motivo, quien: "contador" };
    if (pideCifra) payload.valor = Number(valor);
    if (await resolver.run(payload)) onListo();
  };

  if (directa) {
    return (
      <button
        className={esDelTitular ? "btn-grande btn-secundario" : "btn-mini"}
        disabled={resolver.running}
        onClick={() => aplicar(motivos[0])}
      >
        {esDelTitular ? <X size={15} /> : null}
        {resolver.running ? "Guardando…" : texto}
      </button>
    );
  }

  return (
    <div className="opcion">
      <button className="btn-mini" onClick={onAbrir} aria-expanded={abierta}>
        {texto}
      </button>
      {abierta ? (
        <form
          className="opcion-forma"
          onSubmit={(e) => {
            e.preventDefault();
            aplicar(e.target.motivo.value);
          }}
        >
          <label className="campo">
            <span>Por qué</span>
            <select name="motivo">
              {motivos.map((m) => (
                <option key={m} value={m}>
                  {m.replaceAll("_", " ").toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          {pideCifra ? (
            <label className="campo">
              <span>Cifra</span>
              <input
                type="number"
                min="0"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </label>
          ) : null}
          <button className="btn-mini primario" disabled={resolver.running}>
            {resolver.running ? "Guardando…" : "Aplicar"}
          </button>
          <ErrorApi error={resolver.error} />
        </form>
      ) : null}
    </div>
  );
}
