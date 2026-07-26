/**
 * Los documentos del expediente.
 *
 * QUE SE QUITO Y POR QUE: cada fila tenia tres etiquetas de color ("portal DIAN", "leído",
 * "sin lector") compitiendo con el nombre del documento. Ninguna de las tres le sirve a quien
 * lo va a mirar: que el archivo se pudo leer es el caso normal, y de donde vino se sabe por
 * el nombre. Solo se marca lo excepcional, que es que algo no se haya podido leer, porque eso
 * si obliga a hacer algo.
 *
 * Las acciones (ver y descargar) van al final de la fila y aparecen al pasar por encima: en
 * reposo la lista es solo la lista.
 */

import { useState } from "react";
import { Download, Eye } from "lucide-react";

import {
  campoLabel,
  docLabel,
  esFechaIso,
  formatDate,
  formatIso,
  formatMoney,
  sinCaracterIlegible,
} from "./formato";
import { SoloContador } from "./vista";
import VisorDocumento from "./VisorDocumento";

const CAMPOS_TECNICOS = new Set(["raw_text"]);

export default function Documentos({ documentos }) {
  const [viendo, setViendo] = useState(null);
  if (!documentos.length) return null;

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">Tus documentos</h2>
        <p className="bloque-nota">
          Los trajimos del portal de la DIAN con tu clave. Puedes verlos aquí mismo.
        </p>
      </header>

      <ul className="docs">
        {documentos.map((doc) => (
          <Documento key={doc.id} doc={doc} onVer={() => setViendo(doc)} />
        ))}
      </ul>

      {viendo ? <VisorDocumento doc={viendo} onCerrar={() => setViendo(null)} /> : null}
    </section>
  );
}

function Documento({ doc, onVer }) {
  const noSePudoLeer = !doc.reading && doc.doc_type !== "CLIENT_DOCUMENT";

  return (
    <li className="doc">
      <button className="doc-principal" onClick={onVer}>
        <span className="doc-nombre">{docLabel(doc.doc_type)}</span>
        <span className="doc-meta">
          {formatDate(doc.added_at)}
          {noSePudoLeer ? <span className="doc-alerta">no se pudo leer</span> : null}
        </span>
      </button>

      <div className="doc-acciones">
        <button className="btn-icono" onClick={onVer} title="Ver el documento">
          <Eye size={15} />
        </button>
        <a
          className="btn-icono"
          href={`/api${doc.download_url}`}
          target="_blank"
          rel="noreferrer"
          title="Descargar"
        >
          <Download size={15} />
        </a>
      </div>

      <SoloContador>
        <CamposLeidos doc={doc} />
      </SoloContador>
    </li>
  );
}

/** Profundidad de contador: los campos exactos que se leyeron y de donde salio cada uno. */
function CamposLeidos({ doc }) {
  const [abierto, setAbierto] = useState(false);
  const campos = (doc.reading?.fields ?? []).filter((c) => !CAMPOS_TECNICOS.has(c.name));
  if (!campos.length) return null;

  return (
    <div className="doc-tecnico">
      <button className="enlace-suave" onClick={() => setAbierto((v) => !v)}>
        {abierto ? "Ocultar" : `Ver los ${campos.length} campos leídos`}
      </button>
      {abierto ? (
        <dl className="datos datos-densos">
          {campos.map((campo) => (
            <div className="dato" key={campo.name}>
              <dt>{campoLabel(campo.name)}</dt>
              <dd>
                {valorDelCampo(campo)}
                {campo.source ? <span className="dato-origen">{campo.source}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="doc-parser">
        Leído con {doc.reading.parser} · {doc.filename}
      </p>
    </div>
  );
}

function valorDelCampo(campo) {
  if (campo.value === null || campo.value === undefined) return "—";
  if (campo.unit === "COP") return formatMoney(campo.value);
  if (esFechaIso(campo.value)) return formatIso(campo.value);
  return sinCaracterIlegible(campo.value);
}
