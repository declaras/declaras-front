/**
 * La pantalla de una declaracion.
 *
 * ORDEN: la respuesta primero, la explicacion despues, la maquinaria al final. Quien entra
 * quiere saber si le toca declarar; no quiere ver un panel de "Acciones" antes de eso.
 *
 * Por eso no hay panel de acciones. Traer la informacion de la DIAN es lo unico que hay que
 * hacer cuando todavia no hay nada, y entonces ocupa toda la pantalla; cuando ya hay datos
 * pasa a ser un enlace discreto arriba, porque volver a consultar es raro y no compite con la
 * respuesta.
 *
 * DOS NATURALEZAS: lo que hay en esta pantalla no es todo del mismo tipo. La respuesta y su
 * explicacion (veredicto, topes, lo que falta) se leen de arriba abajo una vez; los documentos
 * y lo que ha pasado se consultan cuando hace falta. Apilados, el material pesa lo mismo que la
 * respuesta y la pagina se vuelve larguisima.
 *
 * En una pantalla ancha van en dos columnas: la narrativa en ancho de lectura y el material en
 * una columna lateral que acompania. En una angosta se apilan en el mismo orden, que es lo
 * correcto en el telefono: ahi no hay dos columnas que valga la pena separar.
 */

import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Upload } from "lucide-react";

import { api } from "./api";
import { useAction, useApi } from "./hooks";
import { formatDate } from "./formato";
import { Cargando, ErrorApi } from "./componentes";
import Documentos from "./Documentos";
import Resumen from "./Resumen";
import Pendientes from "./Pendientes";
import Actividad from "./Actividad";
import Progreso from "./Progreso";
import { useVista } from "./vista";

export default function DetalleExpediente() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { profunda } = useVista();

  const expediente = useApi(() => api.getCase(caseId), [caseId]);
  const resumen = useApi(() => api.getCaseSummary(caseId), [caseId]);
  const [ultimaConsulta, setUltimaConsulta] = useState(null);

  const recargar = useCallback(() => {
    expediente.reload();
    resumen.reload();
  }, [expediente, resumen]);

  if (expediente.loading) return <Cargando texto="Cargando…" />;
  if (expediente.error) {
    return (
      <>
        <Volver onClick={() => navigate("/consola")} />
        <ErrorApi error={expediente.error} />
      </>
    );
  }

  const caso = expediente.data;
  const tieneDatos = caso.documents.length > 0;
  // Solo lo que le pide algo a alguien. Las constancias (`info`) no son pendientes: existen
  // para que quede registro, y contarlas aqui haria que la cifra no signifique nada.
  const porRevisar = caso.flags.filter((f) => !f.resolved_at && f.severity !== "info").length;

  return (
    <>
      {profunda ? <Volver onClick={() => navigate("/consola")} /> : null}

      <header className="declaracion-top">
        <div>
          <p className="declaracion-quien">
            {caso.client.full_name ?? `${caso.client.id_kind} ${caso.client.id_number}`}
          </p>
          <h1 className="declaracion-anio">Declaración de renta {caso.tax_year}</h1>
        </div>
        {tieneDatos ? (
          <ConsultarDian
            caso={caso}
            discreto
            onListo={(mensaje) => {
              setUltimaConsulta(mensaje);
              recargar();
            }}
          />
        ) : null}
      </header>

      {ultimaConsulta ? (
        <p className="resultado-consulta" role="status">
          {ultimaConsulta}
        </p>
      ) : null}

      {!tieneDatos ? (
        <Empezar caso={caso} onListo={(mensaje) => { setUltimaConsulta(mensaje); recargar(); }} />
      ) : (
        <div className="declaracion">
          <div className="declaracion-narrativa">
            {/* La respuesta va primero. Antes los pendientes estaban arriba, y quien entraba a
                saber si le tocaba declarar se encontraba con una lista de problemas. */}
            {resumen.loading ? (
              <Cargando filas={4} />
            ) : (
              <Resumen
                resumen={resumen.data}
                porRevisar={porRevisar}
                // Lo que hay que confirmar va pegado a los topes que puede mover, no al final
                // de la pantalla: es lo que le da sentido a la salvedad del veredicto.
                antesDeFacturas={<Pendientes caso={caso} onCambio={recargar} />}
              />
            )}
          </div>

          <aside className="declaracion-material">
            <Documentos documentos={caso.documents} />
            <SubirDocumento caso={caso} onListo={recargar} />
            <Actividad eventos={caso.events} />
          </aside>
        </div>
      )}
    </>
  );
}

function Volver({ onClick }) {
  return (
    <button className="volver" onClick={onClick}>
      <ArrowLeft size={14} /> Todos los clientes
    </button>
  );
}

/** Cuando no hay nada, hay una sola cosa que hacer y ocupa toda la pantalla. */
function Empezar({ caso, onListo }) {
  return (
    <section className="empezar">
      <h2 className="empezar-titulo">Traigamos tu información de la DIAN</h2>
      <p className="empezar-texto">
        Con tu clave del portal traemos tu RUT, lo que los bancos y tus empleadores reportaron a
        tu nombre, tus facturas electrónicas y tu declaración del año pasado. Con eso te
        decimos si te toca declarar y cuánto.
      </p>
      <ConsultarDian caso={caso} onListo={onListo} />
    </section>
  );
}

/**
 * La consulta al portal.
 *
 * La clave se pide en el momento y no se guarda en ninguna parte: viaja al backend, se usa y
 * se destruye. Decirlo aqui no es un detalle legal, es lo que hace que alguien la escriba.
 */
function ConsultarDian({ caso, onListo, discreto = false }) {
  const [abierto, setAbierto] = useState(false);
  const [clave, setClave] = useState("");
  // El backend publica en que va el trabajo; aqui solo se refleja. Antes esto era una cadena de
  // texto inventada en el navegador ("Trayendo tus documentos…") que no correspondia con lo que
  // estaba pasando de verdad.
  const [pasos, setPasos] = useState(null);

  const accion = useAction(async () => {
    const job = await api.runExtraction({
      id_kind: caso.client.id_kind,
      id_number: caso.client.id_number,
      dian_password: clave,
      tax_year: caso.tax_year,
    });
    setPasos(job.progress ?? []);

    let estado = job;
    for (let intento = 0; intento < 90; intento += 1) {
      await new Promise((listo) => setTimeout(listo, 1000));
      estado = await api.getExtraction(job.job_id);
      setPasos(estado.progress ?? []);
      if (["SUCCEEDED", "FAILED", "AWAITING_CHALLENGE"].includes(estado.status)) break;
    }

    if (estado.status === "AWAITING_CHALLENGE") {
      throw Object.assign(new Error("La DIAN pidió una verificación de identidad."), {
        code: "DIAN_IDENTITY_CHALLENGE",
      });
    }
    if (estado.status !== "SUCCEEDED") {
      throw Object.assign(new Error(estado.error?.message ?? "No se pudo consultar."), {
        code: estado.error?.code ?? "EXTRACTION_FAILED",
        details: estado.error?.details ?? {},
      });
    }

    const detalle = await api.linkExtraction(caso.id, job.job_id);
    setPasos(null);
    // El backend ya comparo esta consulta con la anterior y lo dejo escrito en la actividad;
    // se usa ese mismo texto para no decir dos cosas distintas del mismo hecho.
    return detalle.events.filter((e) => e.kind === "DIAN_QUERY").at(-1)?.message ?? "Listo.";
  });

  const enviar = async (evento) => {
    evento.preventDefault();
    const mensaje = await accion.run();
    if (mensaje) {
      setClave("");
      setAbierto(false);
      onListo(mensaje);
    }
  };

  if (discreto && !abierto) {
    return (
      <button className="btn-mini" onClick={() => setAbierto(true)}>
        <RefreshCw size={13} />
        Volver a consultar la DIAN
      </button>
    );
  }

  // Mientras corre, la pantalla es el progreso: el formulario ya cumplio su papel y dejarlo
  // ahi invita a volver a darle al boton.
  if (accion.running) {
    return (
      <div className="clave-forma">
        <Progreso pasos={pasos} />
      </div>
    );
  }

  return (
    <form className="clave-forma" onSubmit={enviar}>
      <ErrorApi error={accion.error} />
      {accion.error && pasos ? <Progreso pasos={pasos} /> : null}
      <label className="campo">
        <span>Tu clave del portal de la DIAN</span>
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          required
          autoComplete="off"
          autoFocus={discreto}
        />
      </label>
      <p className="clave-nota">
        La usamos para esta consulta y la borramos al terminar. No queda guardada en ninguna
        parte.
      </p>
      <div className="clave-botones">
        <button className="btn-grande" disabled={!clave}>
          Consultar la DIAN
        </button>
        {discreto ? (
          <button type="button" className="enlace-suave" onClick={() => setAbierto(false)}>
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}

/** Documentos que el sistema no puede traer del portal y tiene que dar la persona. */
function SubirDocumento({ caso, onListo }) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState("certificado_intereses_vivienda");
  const [archivo, setArchivo] = useState(null);
  const accion = useAction((docType, file) => api.uploadDocument(caso.id, docType, file));

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!archivo) return;
    if (await accion.run(tipo, archivo)) {
      setArchivo(null);
      setAbierto(false);
      onListo();
    }
  };

  if (!abierto) {
    return (
      <div className="agregar">
        <button className="btn-mini" onClick={() => setAbierto(true)}>
          <Upload size={13} />
          Agregar un certificado
        </button>
        <span className="agregar-nota">
          Los certificados de intereses de vivienda, medicina prepagada o AFC no están en el
          portal: los da tu banco o tu aseguradora.
        </span>
      </div>
    );
  }

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">Agregar un certificado</h2>
      </header>
      <form className="bloque-cuerpo" onSubmit={enviar}>
        <ErrorApi error={accion.error} />
        <div className="fila-campos">
          <label className="campo">
            <span>Qué es</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="certificado_intereses_vivienda">
                Certificado de intereses de vivienda
              </option>
              <option value="certificado_prepagada">Certificado de medicina prepagada</option>
              <option value="certificado_afc">Certificado de AFC o pensión voluntaria</option>
              <option value="registro_civil">Registro civil de un dependiente</option>
              <option value="planilla_pila">Planilla de aportes (PILA)</option>
              <option value="predial">Impuesto predial</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label className="campo">
            <span>El archivo o la foto</span>
            <input type="file" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} required />
          </label>
        </div>
        <div className="clave-botones">
          <button className="btn-grande" disabled={accion.running || !archivo}>
            {accion.running ? "Subiendo…" : "Agregar"}
          </button>
          <button type="button" className="enlace-suave" onClick={() => setAbierto(false)}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
