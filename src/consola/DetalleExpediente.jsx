/** Detalle del expediente: todo lo que el contador necesita ver de un cliente. */

import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CloudDownload, History, Upload } from "lucide-react";

import { api } from "./api";
import { useAction, useApi } from "./hooks";
import { formatDateTime } from "./formato";
import { Avatar, Cargando, ChipEstado, ChipFlags, ErrorApi, Vacio } from "./componentes";
import Documentos from "./Documentos";
import Resumen from "./Resumen";
import Pendientes from "./Pendientes";

export default function DetalleExpediente() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const expediente = useApi(() => api.getCase(caseId), [caseId]);
  const resumen = useApi(() => api.getCaseSummary(caseId), [caseId]);

  const recargar = useCallback(() => {
    expediente.reload();
    resumen.reload();
  }, [expediente, resumen]);

  if (expediente.loading) return <Cargando texto="Cargando el expediente…" />;

  if (expediente.error) {
    return (
      <>
        <Volver onClick={() => navigate("/consola")} />
        <ErrorApi error={expediente.error} />
      </>
    );
  }

  const caso = expediente.data;

  return (
    <>
      <Volver onClick={() => navigate("/consola")} />

      <div className="expediente-head">
        <Avatar nombre={caso.client.full_name ?? caso.client.id_number} size="lg" />
        <div style={{ flex: 1 }}>
          <h1 className="expediente-titulo">{caso.client.full_name ?? "Cliente sin nombre"}</h1>
          <div className="expediente-meta">
            <span>
              {caso.client.id_kind} <b>{caso.client.id_number}</b>
            </span>
            <span>
              Año gravable <b>{caso.tax_year}</b>
            </span>
            {caso.client.phone_number ? <span>{caso.client.phone_number}</span> : null}
            <span>Actualizado {formatDateTime(caso.updated_at)}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: "flex-end" }}>
          <ChipEstado status={caso.status} />
          <ChipFlags count={caso.open_flags_count} />
        </div>
      </div>

      <Acciones caso={caso} onCambio={recargar} />

      <Pendientes caso={caso} onCambio={recargar} />

      {resumen.loading ? <Cargando filas={5} /> : <Resumen resumen={resumen.data} />}

      <Documentos documentos={caso.documents} />

      <Bitacora eventos={caso.events} />
    </>
  );
}

function Volver({ onClick }) {
  return (
    <button className="volver" onClick={onClick}>
      <ArrowLeft size={14} /> Volver a expedientes
    </button>
  );
}

/**
 * Las dos acciones que arrancan trabajo: consultar la DIAN y subir un documento.
 *
 * La consulta a la DIAN pide la clave del contribuyente en el momento y no la guarda en
 * ninguna parte: viaja al backend, que la usa y la destruye.
 */
function Acciones({ caso, onCambio }) {
  const [modo, setModo] = useState(null);

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Acciones</h2>
        <span className="spacer" />
        <button
          className="btn-mini primario"
          onClick={() => setModo(modo === "dian" ? null : "dian")}
        >
          <CloudDownload size={13} />
          Consultar la DIAN
        </button>
        <button
          className="btn-mini"
          style={{ marginLeft: 8 }}
          onClick={() => setModo(modo === "subir" ? null : "subir")}
        >
          <Upload size={13} />
          Subir documento
        </button>
      </div>

      {modo === "dian" ? (
        <ConsultarDian caso={caso} onListo={() => { setModo(null); onCambio(); }} />
      ) : null}
      {modo === "subir" ? (
        <SubirDocumento caso={caso} onListo={() => { setModo(null); onCambio(); }} />
      ) : null}
      {modo === null ? (
        <p className="panel-note">
          Consultar la DIAN trae el RUT, la exógena, las facturas electrónicas y las
          declaraciones, y los deja leídos en el expediente.
        </p>
      ) : null}
    </div>
  );
}

function ConsultarDian({ caso, onListo }) {
  const [clave, setClave] = useState("");
  const [paso, setPaso] = useState(null);

  const accion = useAction(async () => {
    setPaso("Autenticando en el portal…");
    const job = await api.runExtraction({
      id_kind: caso.client.id_kind,
      id_number: caso.client.id_number,
      dian_password: clave,
      tax_year: caso.tax_year,
    });

    // La extraccion es asincrona: el backend responde un job y hay que esperarlo.
    let estado = job;
    for (let intento = 0; intento < 60; intento += 1) {
      await new Promise((listo) => setTimeout(listo, 1500));
      estado = await api.getExtraction(job.job_id);
      if (estado.status === "SUCCEEDED" || estado.status === "FAILED") break;
      if (estado.status === "AWAITING_CHALLENGE") break;
      setPaso(`Descargando documentos… (${estado.status.toLowerCase()})`);
    }

    if (estado.status === "AWAITING_CHALLENGE") {
      setPaso(null);
      throw Object.assign(new Error("La DIAN pidió una verificación de identidad al cliente."), {
        code: "DIAN_IDENTITY_CHALLENGE",
      });
    }
    if (estado.status !== "SUCCEEDED") {
      setPaso(null);
      throw Object.assign(new Error(estado.error?.message ?? "La extracción falló."), {
        code: estado.error?.code ?? "EXTRACTION_FAILED",
      });
    }

    setPaso("Vinculando al expediente…");
    await api.linkExtraction(caso.id, job.job_id);
    setPaso(null);
    return true;
  });

  const enviar = async (evento) => {
    evento.preventDefault();
    const listo = await accion.run();
    if (listo) {
      setClave("");
      onListo();
    }
  };

  return (
    <form className="panel-body" onSubmit={enviar}>
      <ErrorApi error={accion.error} />
      <label className="campo" style={{ maxWidth: 380 }}>
        <span>Clave del portal de la DIAN del cliente</span>
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder="La clave no se guarda"
          required
          autoComplete="off"
        />
      </label>
      <p style={{ color: "var(--muted)", fontSize: 12.5, marginTop: -6, marginBottom: 14 }}>
        La clave se usa para esta consulta y se destruye al terminar. No queda almacenada.
      </p>
      <button className="btn-mini primario" disabled={accion.running || !clave}>
        {accion.running ? (paso ?? "Consultando…") : "Consultar y vincular"}
      </button>
    </form>
  );
}

function SubirDocumento({ caso, onListo }) {
  const [tipo, setTipo] = useState("certificado_intereses_vivienda");
  const [archivo, setArchivo] = useState(null);
  const accion = useAction((docType, file) => api.uploadDocument(caso.id, docType, file));

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!archivo) return;
    const resultado = await accion.run(tipo, archivo);
    if (resultado) {
      setArchivo(null);
      onListo();
    }
  };

  return (
    <form className="panel-body" onSubmit={enviar}>
      <ErrorApi error={accion.error} />
      <div className="fila-campos">
        <label className="campo">
          <span>Tipo de documento</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="certificado_intereses_vivienda">Certificado de intereses de vivienda</option>
            <option value="certificado_prepagada">Certificado de medicina prepagada</option>
            <option value="certificado_afc">Certificado de AFC o pensión voluntaria</option>
            <option value="registro_civil">Registro civil (dependiente)</option>
            <option value="planilla_pila">Planilla PILA</option>
            <option value="predial">Impuesto predial</option>
            <option value="otro">Otro</option>
          </select>
        </label>
        <label className="campo">
          <span>Archivo</span>
          <input type="file" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} required />
        </label>
      </div>
      <button className="btn-mini primario" disabled={accion.running || !archivo}>
        {accion.running ? "Subiendo…" : "Subir al expediente"}
      </button>
    </form>
  );
}

function Bitacora({ eventos }) {
  if (!eventos?.length) return null;
  return (
    <div className="panel">
      <div className="panel-head">
        <History size={15} style={{ color: "var(--muted)" }} />
        <h2>Bitácora</h2>
        <span className="count">{eventos.length}</span>
      </div>
      <p className="panel-note">
        Registro de todo lo que pasó en el expediente. No se edita ni se borra: es lo que
        respalda la garantía si la DIAN pregunta.
      </p>
      <table className="tabla">
        <tbody>
          {[...eventos].reverse().map((evento) => (
            <tr key={evento.id}>
              <td style={{ width: 170, color: "var(--muted)", fontSize: 12.5 }}>
                {formatDateTime(evento.occurred_at)}
              </td>
              <td>{evento.message}</td>
              <td style={{ width: 190 }}>
                <span className="chip chip-neutral flag-codigo">{evento.kind}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
