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
 *
 * EL METADATO VA ARRIBA, JUNTO AL NOMBRE. Antes la linea "Leido con rut.pdf.v1 ·
 * 141070249282.pdf" iba DESPUES de la tabla de campos, o sea a seiscientos pixeles del documento
 * al que pertenece: con los campos abiertos nadie la asociaba, y con los campos cerrados quedaba
 * justo debajo del enlace y hacia parecer que el enlace era de esa linea. Es metadato del archivo,
 * no de los campos, asi que va donde esta el nombre del archivo.
 */

import { useState } from "react";
import { ChevronDown, ChevronRight, Download, Eye } from "lucide-react";

import {
  CAMPOS_QUE_NO_SON_PESOS,
  anioDelDocumento,
  campoLabel,
  docLabel,
  docLabelContador,
  esFechaIso,
  formatDate,
  formatIso,
  formatMoney,
  sinCaracterIlegible,
} from "./formato";
import { SoloContador, useVista } from "./vista";
import VisorDocumento from "./VisorDocumento";
import { descargarArchivo } from "./archivos";
import { esDelHistorial } from "./Historial";
import { useAction } from "./hooks";

const CAMPOS_TECNICOS = new Set(["raw_text"]);

export default function Documentos({ documentos }) {
  const [viendo, setViendo] = useState(null);
  // Las declaraciones de años anteriores salen de esta lista y viven en su propia seccion: como
  // serie de años se recorren de un vistazo, y aca serian cinco filas que se llaman casi igual.
  const delAnio = documentos.filter((d) => !esDelHistorial(d.doc_type));
  if (!delAnio.length) return null;

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">Tus documentos</h2>
        <p className="bloque-nota">
          Los trajimos del portal de la DIAN con tu clave. Puedes verlos aquí mismo.
        </p>
      </header>

      <ul className="docs">
        {delAnio.map((doc) => (
          <Documento key={doc.id} doc={doc} onVer={() => setViendo(doc)} />
        ))}
      </ul>

      {viendo ? <VisorDocumento doc={viendo} onCerrar={() => setViendo(null)} /> : null}
    </section>
  );
}

function Documento({ doc, onVer }) {
  const { profunda } = useVista();
  const noSePudoLeer = !doc.reading && doc.doc_type !== "CLIENT_DOCUMENT";
  const anio = anioDelDocumento(doc);
  const bajar = useAction(() => descargarArchivo(doc.download_url, doc.filename));

  return (
    <li className="doc">
      <button className="doc-principal" onClick={onVer}>
        {/* EL AÑO DEL DOCUMENTO, A LA VISTA. Un expediente de 2025 contiene por necesidad la
            declaración de 2024, porque es insumo del cálculo. Sin el año en la lista, y con el
            borrador sugerido de la DIAN todavía sin publicar, ese PDF de 2024 es el único 210
            completo que se puede abrir: quien lo abra concluye que se preparó el año equivocado.
            Fue exactamente lo que reportó el contador. */}
        <span className="doc-nombre">
          {profunda ? docLabelContador(doc.doc_type) : docLabel(doc.doc_type)}
          {anio ? <span className="doc-anio">{anio}</span> : null}
        </span>
        <span className="doc-meta">
          {formatDate(doc.added_at)}
          {/* Al contador le sirve saber con qué lector se leyó y cómo se llama el archivo, porque
              es lo que necesita para rastrear una cifra rara hasta su origen. Al titular, no. */}
          {profunda && doc.reading ? (
            <span className="doc-origen">
              {doc.filename} · leído con {doc.reading.parser}
            </span>
          ) : null}
          {noSePudoLeer ? <span className="doc-alerta">no se pudo leer</span> : null}
        </span>
      </button>

      <div className="doc-acciones">
        <button className="btn-icono" onClick={onVer} title="Ver el documento">
          <Eye size={15} />
        </button>
        {/* Era un `<a href>`, y por eso bajaba el JSON del 401 con nombre de PDF: el navegador
            resuelve el enlace por su cuenta y sin la cabecera de sesion. */}
        <button
          className="btn-icono"
          onClick={() => bajar.run()}
          disabled={bajar.running}
          title={bajar.error ? bajar.error.message : "Descargar"}
        >
          <Download size={15} />
        </button>
      </div>

      <SoloContador>
        <CamposLeidos doc={doc} />
      </SoloContador>
    </li>
  );
}

/**
 * Profundidad de contador: los campos exactos que se leyeron y de donde salio cada uno.
 *
 * UN SOLO CONTROL QUE NO SE MUEVE. Antes el boton decia "Ver los 14 campos leidos" cerrado y
 * "Ocultar" abierto: dos textos de largo muy distinto en un enlace subrayado sin nada que indique
 * que algo se despliega. El resultado era que abierto parecia otro elemento, huerfano encima de la
 * tabla. Ahora el texto es el mismo en los dos estados y lo unico que cambia es el chevron, que es
 * lo que dice "esto se abre" sin tener que leerlo.
 */
function CamposLeidos({ doc }) {
  const [abierto, setAbierto] = useState(false);
  const campos = (doc.reading?.fields ?? []).filter((c) => !CAMPOS_TECNICOS.has(c.name));
  if (!campos.length) return null;

  return (
    <div className="doc-tecnico">
      <button className="doc-plegable" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {campos.length} campos leídos
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
    </div>
  );
}

function valorDelCampo(campo) {
  if (campo.value === null || campo.value === undefined) return "—";
  // TODA CIFRA SE ASUME EN PESOS. El panel existe para que el contador pueda CREERLE al valor
  // comparandolo con el papel, y un `84000000` crudo no se verifica: obliga a contar ceros y se
  // aprueba de afan. Los extractores del modelo no declaran `unit`, asi que esperar a que lo
  // hagan era dejar el panel ilegible mientras tanto.
  if (typeof campo.value === "number" && !CAMPOS_QUE_NO_SON_PESOS.has(campo.name)) {
    return formatMoney(campo.value);
  }
  if (campo.unit === "COP") return formatMoney(campo.value);
  if (esFechaIso(campo.value)) return formatIso(campo.value);
  return sinCaracterIlegible(campo.value);
}
