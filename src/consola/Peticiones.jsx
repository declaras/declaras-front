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
 * que no tiene quema la confianza; primero se pregunta si la tiene. Un "no" apaga la peticion
 * para siempre — el backend lo guarda como respuesta, no como estado de la interfaz.
 */

import { useRef, useState } from "react";
import { Check, Copy, Upload, X } from "lucide-react";

import { api } from "./api";
import { useAction } from "./hooks";
import { formatMoney } from "./formato";
import { ErrorApi, Vacio } from "./componentes";

export default function Peticiones({ caseId, peticiones, onCambio }) {
  if (!peticiones) return null;
  if (!peticiones.length) {
    return (
      <section className="bloque">
        <header className="bloque-top">
          <h2 className="bloque-titulo">No falta ningún documento</h2>
        </header>
        <Vacio>Ya está todo lo que mueve la declaración.</Vacio>
      </section>
    );
  }

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">Qué pedirle al cliente</h2>
        <p className="bloque-nota">
          Ordenado por lo que cada documento le puede ahorrar. Lo de arriba primero.
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

  return (
    <li className="peticion">
      <div className="peticion-top">
        <p className="peticion-razon">{peticion.razon}</p>
        <p className="peticion-ahorro">
          {/* "Hasta" cuando es un techo legal; la cifra sola cuando esta medida. */}
          {peticion.ahorro_es_techo ? "hasta " : ""}
          {formatMoney(peticion.ahorro_estimado)}
        </p>
      </div>

      {peticion.tercero?.nombre ? (
        <p className="peticion-tercero">{peticion.tercero.nombre}</p>
      ) : null}

      {peticion.pregunta_previa ? (
        <div className="peticion-pregunta">
          <p>{peticion.pregunta_previa}</p>
          <div className="peticion-botones">
            <button
              className="btn-mini"
              disabled={responder.running}
              onClick={async () => {
                if (await responder.run(true)) onCambio();
              }}
            >
              <Check size={14} /> Sí tiene
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
              <X size={14} /> No tiene
            </button>
          </div>
          <ErrorApi error={responder.error} />
        </div>
      ) : (
        <>
          <div className="peticion-copy">
            <p>{peticion.copy_sugerido}</p>
            <button className="btn-mini" onClick={copiar}>
              {copiado ? <Check size={14} /> : <Copy size={14} />}
              {copiado ? "Copiado" : "Copiar mensaje"}
            </button>
          </div>
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
            No lo va a conseguir, seguir sin este documento
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
