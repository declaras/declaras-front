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
import { ArrowRight, X } from "lucide-react";

import { api } from "./api";
import { useAction } from "./hooks";
import { formatMoney } from "./formato";
import { Cruzar, ErrorApi } from "./componentes";
import {
  CLASES_DE_INGRESO,
  HECHOS_DE_CLASIFICACION,
  claseEnFrase,
  nombreDeClase,
  nombreDeDecision,
} from "./decisiones";
import Conciliacion from "./Conciliacion";
import Peticiones from "./Peticiones";
import Pendientes from "./Pendientes";
import YaContestado from "./YaContestado";

/**
 * Las decisiones que dependen de algo que solo el titular sabe.
 *
 * `CLASIFICAR` está acá y no es obvio: parece técnica (elegir una cédula del 210 lo es) pero lo que
 * la determina es un hecho de la vida del titular — si ese pago fue por un trabajo suyo, un arriendo
 * o un rendimiento, y si restó costos o tuvo empleados. El contador no lo puede saber solo. Así que
 * la pregunta se le hace a él en su idioma y el sistema deriva la cédula.
 */
const DEL_TITULAR = new Set(["MARCAR_AJENO", "USAR_DIAN", "CLASIFICAR"]);

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
  // Las que decidió una persona. Las que resolvió el sistema no van aquí: nadie las contestó,
  // así que presentarlas como "tu respuesta" sería atribuirle al titular algo que no dijo.
  // `origen` viaja como el valor del enum del backend, en mayúsculas.
  const decididas = partidas.filter((p) => p.resolucion?.origen === "CONTADOR");
  const porConfirmar = caso.flags.filter((f) => !f.resolved_at && f.severity !== "info");

  // Cuando no queda nada por decidir, la etapa se cierra sola y ofrece seguir.
  const nadaPendiente = !sinDecidir.length && !porConfirmar.length && !(peticiones ?? []).length;
  // Si el backend dice que hay que conciliar, no es que no falte nada: es que nunca se cruzo.
  const faltaCruzar = /conciliar|cruzad/i.test(conciliacion?.falta_para_liquidar ?? "");

  if (nadaPendiente) {
    return (
      <section className="etapa-cuerpo">
        <h1 className="etapa-titulo">
          {profunda ? "No falta ninguna decisión" : "No falta nada por confirmar"}
        </h1>
        <p className="etapa-nota">
          {profunda
            ? "Todos los renglones están decididos y no hay documentos pendientes."
            : "Ya confirmaste todo y no falta ningún documento por mandar."}
        </p>
        {faltaCruzar ? (
          // "No falta nada" es falso cuando no se ha cruzado: no hay renglones porque nadie los
          // creo, no porque esten todos decididos. Se dice, y se ofrece la accion.
          <div className="cruce-desactualizado" role="status">
            <p>{conciliacion?.falta_para_liquidar}</p>
            <Cruzar caseId={caseId} onCambio={onCambio} />
          </div>
        ) : (
          <button className="btn-grande" onClick={onSeguir}>
            Ver el borrador <ArrowRight size={16} />
          </button>
        )}

        {/* Aunque no quede nada pendiente, lo contestado sigue accesible: es la única forma de
            corregir un sí o un no dado por error. */}
        <YaContestado
          caseId={caseId}
          partidas={decididas}
          respuestas={respuestas ?? []}
          profunda={profunda}
          onCambio={onCambio}
          Decision={Decision}
        />
      </section>
    );
  }

  return (
    <section className="etapa-cuerpo">
      <h1 className="etapa-titulo">
        {profunda ? "Lo que hay que decidir" : "Lo que necesitamos que confirmes"}
      </h1>

      {sinDecidir.length ? (
        <div className="decision-marco">
          <p className="decision-progreso">
            <span>
              {verTodas
                ? ""
                : `${profunda ? "Renglón" : "Pregunta"} ${
                    partidas.length - sinDecidir.length + 1
                  } de ${partidas.length}`}
            </span>
            <button className="enlace-suave" onClick={() => setVerTodas((v) => !v)}>
              {verTodas
                ? "volver a una por una"
                : `ver ${profunda ? "los" : "las"} ${sinDecidir.length} de una vez`}
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
        <Peticiones caseId={caseId} peticiones={peticiones} onCambio={onCambio} />
      ) : null}

      <YaContestado
        caseId={caseId}
        partidas={decididas}
        respuestas={respuestas ?? []}
        profunda={profunda}
        onCambio={onCambio}
        Decision={Decision}
      />
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
  // Un renglón que el motor no sabe ubicar. La pregunta acá no es "¿es tuyo?" ni "¿cuál cifra?":
  // es "¿qué fue esto?", y sin contestarla el ingreso no entra a la declaración.
  const porClasificar = Boolean(partida.clases_posibles && claves.includes("CLASIFICAR"));

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
        {porClasificar
          ? profunda
            ? "¿A qué cédula del 210 va este ingreso?"
            : "¿Qué fue este pago?"
          : ajena
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

      {porClasificar ? (
        <p className="decision-nota">
          {profunda
            ? "La exógena lo reportó con un concepto que el motor no sabe ubicar. Sin clasificarlo, el ingreso queda por fuera de la liquidación."
            : "Quien te lo pagó no dijo de qué se trataba. Si no lo dices, este ingreso no entra a tu declaración."}
        </p>
      ) : null}

      {profunda ? (
        <p className="decision-tecnico">
          {partida.concepto ?? "sin clasificar"} · {partida.estado}
          {dian?.celda ? ` · ${dian.celda}` : ""}
        </p>
      ) : null}

      {porClasificar ? (
        <Clasificar
          caseId={caseId}
          partida={partida}
          profunda={profunda}
          motivos={posibles.CLASIFICAR ?? []}
          onListo={onCambio}
        />
      ) : null}

      <div className="decision-opciones">
        {/* Al titular, sobre una fila ajena, se le ofrecen las dos caras de SU pregunta y no las
            técnicas: "poner otra cifra" y "llevarlo a mano" son decisiones de contador, y
            mezclarlas con "¿es tuyo?" convierte una pregunta de sí o no en un formulario. */}
        {(ajena && !profunda ? claves.filter((d) => DEL_TITULAR.has(d)) : claves)
          .filter((d) => d !== "CLASIFICAR")
          .map((d) => (
          <Opcion
            key={d}
            caseId={caseId}
            partida={partida}
            decision={d}
            motivos={posibles[d]}
            ajena={ajena}
            profunda={profunda}
            abierta={abierta === d}
            onAbrir={() => setAbierta(abierta === d ? null : d)}
            onListo={onCambio}
          />
        ))}
      </div>
    </div>
  );
}

function Opcion({ caseId, partida, decision, motivos, ajena, profunda, abierta, onAbrir, onListo }) {
  const [valor, setValor] = useState("");
  const resolver = useAction((payload) => api.resolverPartida(caseId, partida.id, payload));
  const pideCifra = decision === "USAR_OTRO";
  const esDelTitular = DEL_TITULAR.has(decision);

  const texto = nombreDeDecision(decision, { ajena, profunda });

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
