/**
 * Lo que hay que pedirle al cliente, en orden de cuanta plata mueve.
 *
 * `ahorro_es_techo` MANDA EL COPY, y no es un detalle. El tope legal de la deduccion de
 * vivienda son 3.098.900; el ahorro medido de un certificado que ya llego puede ser 996.360.
 * Las dos cifras viven en la misma lista ordenada y significan cosas distintas: una es "hasta",
 * la otra es "son". Presentarlas igual hace que el contador le prometa al cliente una cifra que
 * nadie sostiene.
 *
 * LAS PREGUNTAS VAN ANTES DE LOS DOCUMENTOS. Pedirle a alguien el certificado de una prepagada
 * que no tiene quema la confianza; primero se pregunta si la tiene. Un "no" apaga la peticion —
 * el backend lo guarda como respuesta, no como estado de la interfaz.
 *
 * LO YA CONTESTADO NO VIVE AQUI. Vive en `YaContestado`, junto con las decisiones de renglon:
 * cuando cada uno llevaba su propio registro salian dos enlaces uno debajo del otro diciendo lo
 * mismo con el mismo numero. Por dentro son cosas distintas; para quien contesto, no.
 */

import { useRef, useState } from "react";
import { Check, Copy, Upload, X } from "lucide-react";

import { api } from "./api";
import { useAction } from "./hooks";
import { formatMoney } from "./formato";
import { ErrorApi } from "./componentes";
import { useVista } from "./vista";

/**
 * DOS VOCABULARIOS, UNA IMPLEMENTACION. El titular es quien contesta y quien manda los
 * documentos, asi que la pantalla le habla a el; el contador ve lo mismo dicho en tercera
 * persona, porque el va a pedirselo a alguien mas. Antes solo existia el segundo, y al cliente
 * le salia "Que pedirle al cliente".
 */
export default function Peticiones({ caseId, peticiones, onCambio }) {
  const { profunda } = useVista();
  if (!peticiones?.length) return null;

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">
          {profunda ? "Qué pedirle al cliente" : "Lo que falta que mandes"}
        </h2>
        <p className="bloque-nota">
          {profunda
            ? "Ordenado por lo que cada documento le puede ahorrar. Lo de arriba primero."
            : "Ordenado por lo que cada uno te puede ahorrar. Empieza por el de arriba."}
        </p>
      </header>
      <ul className="peticiones">
        {peticiones.map((p) => (
          <Peticion key={p.id} caseId={caseId} peticion={p} onCambio={onCambio} />
        ))}
      </ul>
    </section>
  );
}

function Peticion({ caseId, peticion, onCambio }) {
  // Del contexto y no por props: encadenar `profunda` por cada componente hijo la convierte en
  // ruido en todas las firmas, y es exactamente para lo que existe el contexto de la vista.
  const { profunda } = useVista();
  const [copiado, setCopiado] = useState(false);
  // `peticion.id` ES la clave de la respuesta: "PREPAGADA" para un beneficio, `partida:{id}`
  // para un renglon del cruce. Apagar una peticion es un solo mecanismo, la escriba el cliente
  // (`/respuestas`) o el contador (`/cerrar-peticion`).
  const responder = useAction((tiene) =>
    api.postRespuesta(caseId, { pregunta: peticion.id, tiene }),
  );
  const cerrar = useAction(() => api.cerrarPeticion(caseId, peticion.id));

  const copiar = async () => {
    await navigator.clipboard.writeText(peticion.copy_sugerido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // EL AHORRO SON PESOS DE IMPUESTO, NO REDUCCION DE LA BASE. Son dos numeros muy distintos: un
  // dependiente baja la base en 72 UVT, pero lo que baja el impuesto depende de la tarifa
  // marginal de ese contribuyente y puede ser cero.
  //
  // Y "$ 0" no es una cifra, son tres situaciones que llevan a decisiones opuestas: no baja nada
  // (no vale la pena molestar al cliente), no se puede calcular todavia (hay que desbloquear el
  // caso), o es el techo legal y no una medicion. El backend manda cual es en `ahorro_por_que`.
  const ahorro = peticion.ahorro_estimado
    ? `${peticion.ahorro_es_techo ? "hasta " : ""}${formatMoney(peticion.ahorro_estimado)} menos de impuesto`
    : null;

  return (
    <li className="peticion">
      {/* LA PREGUNTA VA DE TITULAR, no la norma. Es lo que el contador le va a decir al cliente;
          la norma es el respaldo de por que la pregunta existe, y se lee despues o no se lee. */}
      <div className="peticion-top">
        <p className="peticion-que">{peticion.pregunta_previa ?? peticion.copy_sugerido}</p>
        {ahorro ? <p className="peticion-ahorro">{ahorro}</p> : null}
      </div>

      {/* Cuando no hay cifra, lo que importa es por qué no la hay: dice si vale la pena pedir
          el documento o no. Sin esto era un silencio que se leía como un cero. */}
      {!ahorro && peticion.ahorro_por_que ? (
        <p className="peticion-sin-ahorro">{peticion.ahorro_por_que}</p>
      ) : null}

      <p className="peticion-razon">{peticion.razon}</p>

      {peticion.tercero?.nombre ? (
        <p className="peticion-tercero">{peticion.tercero.nombre}</p>
      ) : null}

      {peticion.pregunta_previa ? (
        <div className="peticion-pregunta">
          <div className="peticion-botones">
            <button
              className="btn-mini"
              disabled={responder.running}
              onClick={async () => {
                if (await responder.run(true)) onCambio();
              }}
            >
              <Check size={14} /> Sí
            </button>
            <button
              className="btn-mini"
              disabled={responder.running}
              onClick={async () => {
                // Un "no" es definitivo: queda guardado como respuesta y la peticion no
                // vuelve a aparecer. No es un "ocultar" de la interfaz.
                if (await responder.run(false)) onCambio();
              }}
            >
              <X size={14} /> No
            </button>
          </div>
          <ErrorApi error={responder.error} />
        </div>
      ) : (
        <>
          {/* Copiar el mensaje solo sirve a quien se lo va a mandar a alguien mas. El titular
              no se escribe a si mismo. */}
          {profunda ? (
            <div className="peticion-copy">
              <button className="btn-mini" onClick={copiar}>
                {copiado ? <Check size={14} /> : <Copy size={14} />}
                {copiado ? "Copiado" : "Copiar mensaje"}
              </button>
            </div>
          ) : null}
          <SoltarArchivos
            caseId={caseId}
            docType={peticion.tipo_documento}
            onCambio={onCambio}
          />
          <button
            className="btn-texto"
            disabled={cerrar.running}
            onClick={async () => {
              if (await cerrar.run()) onCambio();
            }}
          >
            {profunda
              ? "No lo va a conseguir, seguir sin este documento"
              : "No lo tengo, seguir sin este documento"}
          </button>
          <ErrorApi error={cerrar.error} />
        </>
      )}
    </li>
  );
}

/**
 * Zona de arrastrar y soltar VARIOS archivos, con el desenlace de cada uno.
 *
 * El backend responde por archivo, y eso se muestra: un certificado que no cruzo contra lo que
 * la DIAN reporta no es un error, es un hecho que el contador tiene que ver. Antes esto era una
 * sola subida sin desenlace y quien subia tres archivos no sabia cual de los tres entro.
 */
function SoltarArchivos({ caseId, docType, onCambio }) {
  const input = useRef(null);
  const [encima, setEncima] = useState(false);
  const [resultados, setResultados] = useState(null);
  const subir = useAction(async (archivos) => {
    const entradas = Array.from(archivos).map((file) => ({ docType, file }));
    return api.uploadDocuments(caseId, entradas);
  });

  const manejar = async (archivos) => {
    if (!archivos?.length) return;
    const respuesta = await subir.run(archivos);
    if (respuesta) {
      setResultados(respuesta.resultados ?? null);
      onCambio();
    }
  };

  return (
    <div className="peticion-subir">
      <div
        className={`soltar ${encima ? "soltar-encima" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => {
          e.preventDefault();
          setEncima(false);
          manejar(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
      >
        <Upload size={15} />
        <span>
          {subir.running ? "Leyendo…" : "Arrastra el archivo aquí, o haz clic para buscarlo"}
        </span>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          onChange={(e) => manejar(e.target.files)}
        />
      </div>
      <ErrorApi error={subir.error} />
      {resultados ? (
        <ul className="resultados-subida">
          {resultados.map((r) => (
            <li key={r.archivo} className={`resultado-${r.estado}`}>
              <strong>{r.archivo}</strong> — {DESENLACE[r.estado] ?? r.estado}
              {r.motivo ? `: ${r.motivo}` : ""}
              {r.peticion_cerrada ? " · se cerró la solicitud" : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Que significa cada desenlace, dicho para quien subio el archivo. */
const DESENLACE = {
  emparejado: "cruzó con lo que la DIAN reporta",
  sin_emparejar: "entró, pero la DIAN no reporta este hecho",
  a_bandeja: "quedó guardado sin leer",
};
