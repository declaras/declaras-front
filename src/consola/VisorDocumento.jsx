/**
 * Ver un documento sin bajarlo al disco.
 *
 * DECISION DE DISENO: lo que importa no es mostrar el archivo, es mostrar su CONTENIDO.
 *
 * Para un PDF las dos cosas coinciden y el navegador ya sabe hacerlo, asi que se le entrega
 * el archivo y se quita del medio. Para una hoja de calculo no: el navegador no la sabe
 * mostrar, y ofrecer "descargar para ver" seria devolverle al usuario el problema que este
 * boton venia a resolver. Pero de esos documentos ya se tiene algo mejor que la hoja cruda:
 * la lectura estructurada, que es exactamente lo que el sistema entendio. Mostrar eso es mas
 * util que mostrar el original, porque es lo que va a usar el calculo.
 *
 * El original queda a un clic para quien quiera confirmarlo.
 */

import { Download } from "lucide-react";

import Cajon from "./Cajon";
import { useVista } from "./vista";
import { urlDeApi } from "./api";
import {
  campoLabel,
  docLabel,
  esFechaIso,
  formatIso,
  formatMoney,
  sinCaracterIlegible,
  tieneCaracterIlegible,
} from "./formato";

const esImagen = (nombre = "") => /\.(png|jpe?g|gif|webp|heic)$/i.test(nombre);
const esPdf = (nombre = "") => /\.pdf$/i.test(nombre);

/** El texto completo se guarda para auditoria; mostrarlo en una tabla no ayuda a nadie. */
const CAMPOS_TECNICOS = new Set(["raw_text"]);

export default function VisorDocumento({ doc, onCerrar }) {
  const { profunda } = useVista();
  if (!doc) return null;

  // `/api` era la ruta del proxy que se borró. Sin esto el navegador pedía al servidor del
  // FRONT, que no tiene esa ruta y responde el index.html de la SPA — por eso el visor
  // mostraba la landing dentro del marco en vez del PDF.
  const urlDescarga = urlDeApi(doc.download_url);
  const urlVista = `${urlDescarga}&inline=true`;

  return (
    <Cajon
      titulo={docLabel(doc.doc_type)}
      /* Con un PDF el visor del navegador ya muestra el nombre del archivo justo debajo, asi que
         repetirlo aqui es ruido. En los demas casos no aparece en ningun lado, y en la vista de
         contador se muestra siempre porque ahi sirve para rastrear. */
      subtitulo={!esPdf(doc.filename) || profunda ? doc.filename : null}
      mono
      ancho={880}
      accion={
        <a className="btn-mini" href={urlDescarga} target="_blank" rel="noreferrer">
          <Download size={13} />
          Descargar
        </a>
      }
      onCerrar={onCerrar}
    >
      {esPdf(doc.filename) ? (
        <iframe className="visor-marco" src={urlVista} title={docLabel(doc.doc_type)} />
      ) : esImagen(doc.filename) ? (
        <img className="visor-imagen" src={urlVista} alt={docLabel(doc.doc_type)} />
      ) : doc.reading ? (
        <ContenidoLeido lectura={doc.reading} />
      ) : (
        <p className="estado">
          Este archivo no se puede mostrar en el navegador. Descárgalo para verlo.
        </p>
      )}
    </Cajon>
  );
}

/** El contenido de una hoja de calculo, tal como lo entendio el sistema. */
function ContenidoLeido({ lectura }) {
  const campos = lectura.fields.filter((c) => !CAMPOS_TECNICOS.has(c.name));

  return (
    <div className="visor-leido">
      <p className="visor-nota">
        Así entendimos este documento. Es lo que se usa para revisar tu declaración.
      </p>

      <dl className="datos">
        {campos.map((campo) => (
          <div className="dato" key={campo.name}>
            <dt>{campoLabel(campo.name)}</dt>
            <dd>
              {valorLegible(campo)}
              {tieneCaracterIlegible(campo.value) ? (
                <span className="marca-duda">la DIAN envió un carácter ilegible</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      {lectura.rows?.length ? <Filas filas={lectura.rows} /> : null}
    </div>
  );
}

function Filas({ filas }) {
  return (
    <table className="tabla" style={{ marginTop: 4 }}>
      <thead>
        <tr>
          <th>Quién reportó</th>
          <th>Concepto</th>
          <th className="num">Valor</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila, indice) => (
          <tr key={indice}>
            <td>{fila.values.reporter_name ?? fila.values.issuer_name ?? "—"}</td>
            <td className="celda-suave">
              {fila.values.concept ?? fila.values.issue_date ?? "—"}
              {fila.values.reported_to_titular === false ? (
                <span className="marca-duda">
                  a nombre de {fila.values.reported_name}
                </span>
              ) : null}
            </td>
            <td className="num strong">
              {formatMoney(fila.values.amount ?? fila.values.net_amount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const ES_MONTO = /^(tope_|total_|casilla_)/;

function valorLegible(campo) {
  if (campo.value === null || campo.value === undefined) return "—";
  if (campo.unit === "COP" || ES_MONTO.test(campo.name)) return formatMoney(campo.value);
  if (esFechaIso(campo.value)) return formatIso(campo.value);
  return sinCaracterIlegible(campo.value);
}
