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
import { Cruzar, ErrorApi, Vacio } from "./componentes";
import Clasificar from "./Clasificar";
import { COMO_CONTADOR, QUE_HACE, nombreDeMotivo } from "./decisiones";

/** Como se llama cada desenlace del cruce, dicho sin jerga. */
const ESTADO = {
  COINCIDE: { texto: "Cuadra", tono: "ok" },
  DISCREPANCIA: { texto: "No cuadra", tono: "alerta" },
  SOLO_DIAN: { texto: "Solo la DIAN", tono: "falta" },
  SOLO_DOCUMENTO: { texto: "Solo el documento", tono: "falta" },
  CONCEPTO_DESCONOCIDO: { texto: "Sin clasificar", tono: "falta" },
};

/**
 * El concepto, dicho en espanol.
 *
 * Salia crudo del backend: SALARIOS, APORTES_PENSION, RENDIMIENTOS, OTROS. Con guion bajo y sin
 * tildes es texto de maquina, y "OTROS" no le dice nada a nadie. El backend ya tiene vocabulario
 * en espanol para los nodos del motor y las casillas del 210; esto se habia quedado por fuera.
 *
 * Lo que no este en la tabla se muestra tal como llega: es preferible un nombre feo a esconder un
 * concepto que el sistema si conoce.
 */
const CONCEPTO = {
  SALARIOS: "Salario",
  HONORARIOS: "Honorarios",
  SERVICIOS: "Servicios",
  ARRENDAMIENTOS: "Arriendos",
  RENDIMIENTOS: "Rendimientos financieros",
  DIVIDENDOS: "Dividendos",
  PENSIONES: "Pensión",
  APORTES_SALUD: "Aportes a salud",
  APORTES_PENSION: "Aportes a pensión",
  CESANTIAS: "Cesantías",
  PROMEDIO_SALARIAL: "Promedio salarial",
  RETENCION: "Retención",
  PATRIMONIO: "Patrimonio",
  DEUDA: "Deuda",
  OTROS: "Sin clasificar",
};

/** Que hace cada decision, en una linea. */
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
        <Cruzar caseId={caseId} onCambio={onCambio} />
      </section>
    );
  }

  const pendientes = partidas.filter((p) => !p.resolucion);
  // El motivo por el que todavia no se puede liquidar, tal como lo manda el backend. Solo interesa
  // el que se arregla cruzando: los otros ("quedan N partidas sin resolver") se resuelven decidiendo
  // y ofrecer un boton de cruzar ahi seria mandar a la persona por el camino equivocado.
  const falta = conciliacion.falta_para_liquidar;
  const hayQueCruzar = Boolean(falta) && /conciliar|cruzad/i.test(falta);

  return (
    <section className="bloque">
      {hayQueCruzar ? (
        <div className="cruce-desactualizado" role="status">
          <p>{falta}</p>
          <Cruzar caseId={caseId} onCambio={onCambio} />
        </div>
      ) : null}

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

  // LA DECISION VIVE AQUI porque las cifras se pintan aqui, y elegir una cifra ES la decision.
  // Con el estado dentro del bloque de botones, la tarjeta no tenia como resolver.
  const [otra, setOtra] = useState(null);
  const directa = useAction((decision, motivo) =>
    api.resolverPartida(caseId, partida.id, { decision, motivo }),
  );

  const posibles = partida.decisiones_posibles ?? {};
  /** Un clic en la cifra la elige. Si el backend admite varios motivos, se pregunta cual. */
  const alElegir = (decision) => {
    const motivos = posibles[decision];
    if (resuelta || !motivos?.length) return null;
    if (motivos.length > 1) return () => setOtra(decision);
    return async () => {
      if (await directa.run(decision, motivos[0])) onCambio();
    };
  };

  const cifra = partida.version_dian?.monto ?? partida.version_documento?.monto;

  // Un renglon decidido deja de estar en alarma: la barra roja decia "no cuadra" sobre algo que el
  // contador ya resolvio, y la mesa seguia pareciendo llena de problemas despues de trabajarla.
  const tono = resuelta ? "ok" : estado.tono;

  return (
    <li className={`partida partida-${tono} ${ajena ? "partida-ajena" : ""}`}>
      <button className="partida-fila" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta}>
        <span className="partida-chevron">
          {abierta ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </span>
        <span className="partida-quien">
          <span className="partida-tercero">{partida.nombre_tercero || partida.nit_tercero}</span>
          <span className="partida-concepto">
            {CONCEPTO[partida.concepto] ??
              partida.concepto ??
              partida.codigos_crudos.join(", ") ??
              "sin clasificar"}
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
            <Version
              titulo="La DIAN"
              valor={partida.version_dian}
              alElegir={alElegir("USAR_DIAN")}
              eligiendo={directa.running}
            />
            {/* La columna del documento solo existe si hay documento. Una caja vacia repetida
                en cada renglon no informa: dice lo mismo que su ausencia, ocupando el doble. */}
            {partida.version_documento ? (
              <Version
                titulo="El documento"
                valor={partida.version_documento}
                versiones={partida.versiones_documento}
                rige={partida.version_que_rige}
                alElegir={alElegir("USAR_DOCUMENTO")}
                eligiendo={directa.running}
              />
            ) : (
              <p className="partida-sin-documento">El cliente todavía no ha aportado nada.</p>
            )}
          </div>

          {partida.diferencia_monto || partida.diferencia_retencion ? (
            <ul className="partida-diferencias">
              {partida.diferencia_monto ? (
                <li>
                  Diferencia en el monto <b>{formatMoney(partida.diferencia_monto)}</b>
                </li>
              ) : null}
              {partida.diferencia_retencion ? (
                <li>
                  Diferencia en la retención <b>{formatMoney(partida.diferencia_retencion)}</b>
                </li>
              ) : null}
            </ul>
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
            <Decidir
              caseId={caseId}
              partida={partida}
              onCambio={onCambio}
              otra={otra}
              setOtra={setOtra}
              error={directa.error}
            />
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

/**
 * Una de las dos cifras en juego. Si se puede elegir, la tarjeta ES el boton.
 *
 * POR QUE: antes las cifras se mostraban arriba y debajo habia cinco botones de texto, uno de
 * ellos "Usar la cifra de la DIAN". Para decidir habia que leer la cifra, leer la etiqueta, y
 * hacer la correspondencia entre las dos en la cabeza — veinte veces por declaracion. La cifra
 * correcta ya estaba en pantalla; lo unico que faltaba era poder tocarla.
 */
function Version({ titulo, valor, versiones, rige, alElegir, eligiendo = false }) {
  if (!valor) {
    return (
      <div className="version version-vacia">
        <p className="version-titulo">{titulo}</p>
        <p className="version-monto">—</p>
        <p className="version-detalle">no reporta nada</p>
      </div>
    );
  }
  const cuerpo = (
    <>
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
    </>
  );

  if (!alElegir) return <div className="version">{cuerpo}</div>;

  return (
    <button
      type="button"
      className="version version-elegible"
      onClick={alElegir}
      disabled={eligiendo}
    >
      {cuerpo}
      <span className="version-elegir">{eligiendo ? "Guardando…" : "Usar esta cifra"}</span>
    </button>
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
      {nombreDeMotivo(resolucion.motivo)}
      {PONE_CIFRA.has(resolucion.decision) ? ` · queda en ${formatMoney(resolucion.valor)}` : ""}
      {delSistema ? " · lo puso el sistema y se puede cambiar" : ` · ${resolucion.quien}`}
      {resolucion.nota ? ` · “${resolucion.nota}”` : ""}
    </p>
  );
}

/**
 * Como se decide un renglon.
 *
 * ANTES: cinco botones de texto con el mismo peso, envueltos en dos filas. "Usar la cifra de la
 * DIAN", "Usar la cifra del documento", "Poner otra cifra", "No es del cliente", "Llevarlo a mano".
 * Ninguno destacaba, asi que habia que leer los cinco cada vez. Con veinte renglones son cien
 * lecturas para tomar veinte decisiones que casi siempre son la misma.
 *
 * AHORA hay una sola idea: LA DECISION ES ELEGIR UNA CIFRA, y las dos cifras ya estan en pantalla.
 * Se toca la que rige y listo. Las demas salidas —poner otra cifra, marcarla ajena, llevarla a
 * mano— existen para el caso raro, asi que viven detras de un enlace discreto en vez de competir
 * por la atencion en cada renglon.
 *
 * Y SI SOLO HAY UN MOTIVO VALIDO, NO SE PREGUNTA. El formulario pedia motivo incluso cuando la
 * lista tenia un solo elemento: un desplegable de una opcion no es una decision, es un tramite. El
 * backend ya dice que motivos admite cada decision; cuando manda uno, el clic resuelve.
 *
 * Lo que NO cambia: que decisiones existen y con que motivos lo sigue diciendo el backend. Esta
 * pantalla decide como se ven, no cuales hay.
 */
function Decidir({ caseId, partida, onCambio, otra, setOtra, error }) {
  // Cuantas cifras se ofrecen arriba decide como se llama la salida: con dos, "ninguna de las dos";
  // con una, esa frase seria falsa.
  const cifras =
    (partida.version_dian ? 1 : 0) + (partida.version_documento ? 1 : 0);
  const [verOtras, setVerOtras] = useState(false);
  const posibles = partida.decisiones_posibles ?? {};
  const decisiones = Object.keys(posibles);

  if (!decisiones.length) {
    return <p className="bloque-nota">Este renglón no admite ninguna decisión todavía.</p>;
  }

  // Las que ya tienen su tarjeta arriba no se repiten como boton. CLASIFICAR tampoco: no es una
  // salida alternativa sino LA pregunta de ese renglon, y va desplegada, no detras de un enlace.
  const enTarjeta = new Set(["USAR_DIAN", "USAR_DOCUMENTO", "CLASIFICAR"]);
  const otras = decisiones.filter((d) => !enTarjeta.has(d));
  const clasificar = decisiones.includes("CLASIFICAR") && partida.clases_posibles;

  return (
    <div className="partida-decidir">
      {error ? <ErrorApi error={error} /> : null}

      {clasificar ? (
        <div className="partida-clasificar">
          <p className="partida-clasificar-pregunta">¿A qué cédula del 210 va este ingreso?</p>
          <p className="bloque-nota">
            La exógena lo reportó con un concepto que el motor no sabe ubicar. Sin clasificarlo, el
            ingreso queda por fuera de la liquidación.
          </p>
          <Clasificar
            caseId={caseId}
            partida={partida}
            profunda
            motivos={posibles.CLASIFICAR}
            onListo={onCambio}
          />
        </div>
      ) : null}

      {otras.length ? (
        <div className="partida-otras">
          <button
            type="button"
            className="enlace-suave"
            onClick={() => setVerOtras((v) => !v)}
            aria-expanded={verOtras}
          >
            {verOtras
              ? "Ocultar las otras opciones"
              : cifras > 1
                ? "Ninguna de las dos"
                : "Otra opción"}
          </button>

          {verOtras ? (
            <div className="decision-opciones">
              {/* Cada salida dice QUE HACE, igual que en la tarjeta: "No es del cliente" saca la
                  plata de la declaracion y "Lo pongo yo en el 210" la deja adentro pero fuera del
                  calculo, y con solo el nombre se veian equivalentes. */}
              {otras.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`salida ${otra === d ? "salida-abierta" : ""}`}
                  onClick={() => setOtra(otra === d ? null : d)}
                >
                  <span className="salida-nombre">{COMO_CONTADOR[d] ?? d}</span>
                  {QUE_HACE[d] ? <span className="salida-que">{QUE_HACE[d]}</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {otra ? (
        <FormularioDecision
          caseId={caseId}
          partida={partida}
          decision={otra}
          motivos={posibles[otra]}
          onListo={() => {
            setOtra(null);
            setVerOtras(false);
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
              {nombreDeMotivo(m)}
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
