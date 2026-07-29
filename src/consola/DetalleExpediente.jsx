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
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, RefreshCw, Upload } from "lucide-react";

import { api } from "./api";
import { useAction, useApi } from "./hooks";
import { formatDate } from "./formato";
import { Cargando, ErrorApi } from "./componentes";
import Conciliacion from "./Conciliacion";
import Documentos from "./Documentos";
import Ganancia from "./Ganancia";
import MesaDeTrabajo from "./MesaDeTrabajo";
import Peticiones from "./Peticiones";
import Resumen from "./Resumen";
import Pendientes from "./Pendientes";
import Actividad from "./Actividad";
import Dialogo from "./Dialogo";
import Etapas, { ETAPAS } from "./Etapas";
import EtapaBorrador from "./EtapaBorrador";
import EtapaDecisiones from "./EtapaDecisiones";
import EtapaPresentar from "./EtapaPresentar";
import EtapaResultado from "./EtapaResultado";
import Progreso from "./Progreso";
import { useVista } from "./vista";

export default function DetalleExpediente() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { profunda } = useVista();

  const expediente = useApi(() => api.getCase(caseId), [caseId]);
  const resumen = useApi(() => api.getCaseSummary(caseId), [caseId]);
  // Los tres del cruce fallan mientras nadie haya conciliado, y eso es normal, no un error:
  // `useApi` guarda el error y estas vistas simplemente no se pintan. Por eso no se muestra
  // `ErrorApi` de estos tres — un 409 "hay que conciliar" no es algo que el contador tenga
  // que leer como falla.
  const conciliacion = useApi(() => api.getConciliacion(caseId), [caseId]);
  const peticiones = useApi(() => api.listPeticiones(caseId), [caseId]);
  const respuestas = useApi(() => api.listRespuestas(caseId), [caseId]);
  const liquidacion = useApi(() => api.getLiquidacion(caseId), [caseId]);
  const [ultimaConsulta, setUltimaConsulta] = useState(null);

  const recargar = useCallback(() => {
    expediente.reload();
    resumen.reload();
    conciliacion.reload();
    peticiones.reload();
    respuestas.reload();
    liquidacion.reload();
  }, [expediente, resumen, conciliacion, peticiones, respuestas, liquidacion]);

  // Solo mientras no haya NADA que mostrar. Un refresco posterior no borra la pantalla: además
  // del parpadeo, desmontar el árbol se llevaba el estado de todo lo que hay dentro.
  if (expediente.loading && !expediente.data) return <Cargando texto="Cargando…" />;
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
        <Flujo
          caseId={caseId}
          caso={caso}
          conciliacion={conciliacion.data}
          peticiones={peticiones.data}
          respuestas={respuestas.data}
          liquidacion={liquidacion.data}
          resumen={resumen.data}
          profunda={profunda}
          onCambio={recargar}
        />
      )}
    </>
  );
}

/**
 * El flujo de cuatro etapas, que es la misma historia para las dos personas.
 *
 * El cliente y el contador recorren lo mismo —resultado, decisiones, borrador, presentar— porque
 * el trabajo es el mismo: un cliente autogestionado no "se entera", decide. Lo que cambia es el
 * vocabulario, cuanto detalle se ofrece, y que las decisiones tecnicas no se le presentan al
 * titular como preguntas suyas.
 *
 * LA ETAPA SE PROPONE, NO SE IMPONE. Se abre en la que toca segun el estado, y desde ahi se puede
 * ir a cualquiera ya alcanzada. Lo que no se puede es adelantarse a una que todavia no aplica:
 * leer el borrador antes de decidir los renglones es leer una cifra que va a cambiar.
 */
function Flujo({ caseId, caso, conciliacion, peticiones, respuestas, liquidacion, resumen, profunda, onCambio }) {
  const sinDecidir = (conciliacion?.partidas ?? []).filter((p) => !p.resolucion).length;
  const porConfirmar = caso.flags.filter((f) => !f.resolved_at && f.severity !== "info").length;
  const porPedir = (peticiones ?? []).length;
  const faltan = sinDecidir + porConfirmar + porPedir;
  const hayBorrador = Boolean(liquidacion?.actual);

  // Hasta donde se puede llegar hoy. No es una restricción de permisos: es que una etapa sin
  // insumos no tiene nada que mostrar.
  const hasta = faltan ? "decisiones" : hayBorrador ? "presentar" : "decisiones";

  // LA ETAPA VIVE EN LA DIRECCION, no en el estado de este componente. Dos razones: sobrevive a
  // un refresco de pagina y a cualquier remontaje del arbol (que es lo que rompio esto antes:
  // guardar una respuesta devolvia al usuario a la primera etapa), y se puede compartir el enlace
  // de una etapa concreta.
  const [parametros, setParametros] = useSearchParams();
  const pedida = parametros.get("paso");
  const actual = ETAPAS.some((e) => e.id === pedida) ? pedida : "resultado";
  const setEtapa = (id) => {
    const siguientes = new URLSearchParams(parametros);
    siguientes.set("paso", id);
    // `replace` para que el botón de atrás del navegador salga de la declaración en vez de
    // recorrer las cuatro etapas al revés.
    setParametros(siguientes, { replace: true });
  };

  const pendientes = [
    ...caso.flags.filter((f) => !f.resolved_at && f.severity !== "info").map((f) => ({
      id: f.id,
      que: f.message,
    })),
    ...(sinDecidir
      ? [{ id: "cruce", que: `Quedan ${sinDecidir} renglones por decidir` }]
      : []),
  ];

  return (
    <div className="flujo">
      <aside className="flujo-etapas">
        <Etapas actual={actual} hasta={hasta} onIr={setEtapa} />
      </aside>

      <div className="flujo-cuerpo">
        {actual === "resultado" ? (
          <EtapaResultado
            liquidacion={liquidacion}
            resumen={resumen}
            pendientes={pendientes}
            onSeguir={() => setEtapa(faltan ? "decisiones" : "borrador")}
          />
        ) : null}
        {actual === "decisiones" ? (
          <EtapaDecisiones
            caseId={caseId}
            caso={caso}
            conciliacion={conciliacion}
            peticiones={peticiones}
            respuestas={respuestas}
            profunda={profunda}
            onCambio={onCambio}
            onSeguir={() => setEtapa("borrador")}
          />
        ) : null}
        {actual === "borrador" ? (
          <EtapaBorrador
            caseId={caseId}
            caso={caso}
            resumen={resumen}
            liquidacion={liquidacion}
          />
        ) : null}
        {actual === "presentar" ? (
          <EtapaPresentar
            caseId={caseId}
            caso={caso}
            conciliacion={conciliacion}
            peticiones={peticiones}
            liquidacion={liquidacion}
            onIr={setEtapa}
            onCambio={onCambio}
          />
        ) : null}

        {actual === "borrador" && hayBorrador ? (
          <button className="btn-grande" onClick={() => setEtapa("presentar")}>
            Continuar <ArrowRight size={16} />
          </button>
        ) : null}
      </div>

      <aside className="flujo-lateral">
        <SubirDocumento caso={caso} onListo={onCambio} />
        <Actividad eventos={caso.events} />
      </aside>
    </div>
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
 * La clave se pide en el momento y no se guarda en ninguna parte: viaja al backend, se usa y se
 * destruye. Decirlo aqui no es un detalle legal, es lo que hace que alguien la escriba.
 *
 * DONDE VIVE ESTE FORMULARIO, QUE NO ES OBVIO
 *
 * La primera vez ocupa la pantalla completa, porque no hay nada mas que mirar y meter un clic
 * extra en el momento de arranque es el peor sitio para meterlo.
 *
 * Volver a consultar es otra cosa: es una tarea con principio y fin sobre una pagina que ya
 * tiene contenido. Antes se abria en el sitio del boton, dentro de la fila del titulo, y el
 * formulario quedaba flotando ahi sin pertenecer ni al encabezado ni al cuerpo. Ahora abre un
 * dialogo, que es donde se hace algo que necesita atencion completa y la devuelve al terminar.
 *
 * Es el mismo formulario en los dos casos; lo unico que cambia es el contenedor.
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

  // Mientras corre, el progreso reemplaza al formulario: ya cumplio su papel, y dejarlo ahi
  // invita a volver a darle al boton, que cuenta como otro intento contra el bloqueo.
  const formulario = accion.running ? (
    <div className="clave-forma">
      <Progreso pasos={pasos} />
    </div>
  ) : (
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
      </div>
    </form>
  );

  if (!discreto) return formulario;

  return (
    <>
      <button className="btn-mini" onClick={() => setAbierto(true)}>
        <RefreshCw size={13} />
        Volver a consultar la DIAN
      </button>
      {abierto ? (
        <Dialogo
          titulo="Consultar la DIAN otra vez"
          descripcion={
            accion.running
              ? null
              : "Trae de nuevo tu información del portal y te dice si algo cambió desde la última vez."
          }
          onCerrar={() => setAbierto(false)}
          bloqueado={accion.running}
        >
          {formulario}
        </Dialogo>
      ) : null}
    </>
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

/**
 * Lo que sostiene la cifra: se abre cuando hay que defenderla.
 *
 * Los topes, los renglones del 210 y la comparacion con lo que la DIAN sugeria son la evidencia
 * de la declaracion, no el trabajo del dia. Plegados dejan de competir con la cola; a un clic
 * siguen estando completos.
 */
function Respaldo({ children }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <section className="bloque">
      <button className="respaldo-abrir" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        {abierto ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        En qué se sostiene esta cifra
      </button>
      {abierto ? <div className="respaldo">{children}</div> : null}
    </section>
  );
}
