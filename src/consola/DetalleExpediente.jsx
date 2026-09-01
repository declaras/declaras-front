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
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, RefreshCw, Upload } from "lucide-react";

import { api } from "./api";
import { useAction, useApi } from "./hooks";
import { Cargando, ErrorApi } from "./componentes";
import Actividad from "./Actividad";
import Documentos from "./Documentos";
import Historial from "./Historial";
import Dialogo from "./Dialogo";
import Etapas, { ETAPAS } from "./Etapas";
import Plazo from "./Plazo";
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
  // Los tres del cruce fallan mientras nadie haya conciliado, y eso es normal, no un error.
  //
  // PERO EL MOTIVO SI SE MUESTRA. Antes se guardaba y no se pintaba, asi que una liquidacion que
  // el backend rechazaba con 409 y un mensaje concreto ("quedan 3 partidas sin resolver") llegaba
  // a la pantalla como "Todavia no hay borrador que mostrar". Desde afuera no se distingue un caso
  // vacio de uno que no se pudo calcular, y son cosas opuestas: una no requiere nada y la otra
  // dice exactamente que falta hacer.
  const conciliacion = useApi(() => api.getConciliacion(caseId), [caseId]);
  const peticiones = useApi(() => api.listPeticiones(caseId), [caseId]);
  const respuestas = useApi(() => api.listRespuestas(caseId), [caseId]);
  const patrimonio = useApi(() => api.getPatrimonio(caseId), [caseId]);
  const liquidacion = useApi(() => api.getLiquidacion(caseId), [caseId]);
  const recomendaciones = useApi(() => api.getRecomendaciones(caseId), [caseId]);
  const comparaciones = {
    dian: useApi(() => api.getComparacionDian(caseId), [caseId]),
    presentada: useApi(() => api.getComparacionPresentada(caseId), [caseId]),
  };
  const [ultimaConsulta, setUltimaConsulta] = useState(null);

  const recargar = useCallback(() => {
    expediente.reload();
    resumen.reload();
    conciliacion.reload();
    peticiones.reload();
    respuestas.reload();
    patrimonio.reload();
    liquidacion.reload();
    recomendaciones.reload();
    comparaciones.dian.reload();
    comparaciones.presentada.reload();
    // `comparaciones` se reconstruye en cada render (es un objeto literal), así que se listan sus
    // dos miembros: ponerlo entero haría que el callback cambie siempre y recargue en bucle.
  }, [
    expediente,
    resumen,
    conciliacion,
    peticiones,
    respuestas,
    patrimonio,
    liquidacion,
    recomendaciones,
    comparaciones.dian,
    comparaciones.presentada,
  ]);

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

  return (
    <>
      {profunda ? <Volver onClick={() => navigate("/consola")} /> : null}

      <header className="declaracion-top">
        <div>
          <p className="declaracion-quien">
            {caso.client.full_name ?? `${caso.client.id_kind} ${caso.client.id_number}`}
          </p>
          <h1 className="declaracion-anio">Declaración de renta {caso.tax_year}</h1>
          {/* El plazo va en el encabezado y no dentro de una etapa: aplica a todo el expediente y
              es lo primero que hay que saber, así que se ve desde cualquier paso. */}
          <Plazo plazo={caso.plazo} />
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
          patrimonio={patrimonio.data}
          liquidacion={liquidacion.data}
          liquidacionError={liquidacion.error}
          recomendaciones={recomendaciones.data}
          comparaciones={comparaciones}
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
function Flujo({ caseId, caso, conciliacion, peticiones, respuestas, patrimonio, liquidacion, liquidacionError, recomendaciones, comparaciones, resumen, profunda, onCambio }) {
  const sinDecidir = (conciliacion?.partidas ?? []).filter((p) => !p.resolucion).length;
  const porConfirmar = caso.flags.filter((f) => !f.resolved_at && f.severity !== "info").length;
  const porPedir = (peticiones ?? []).length;
  // El patrimonio cuenta como algo que falta, y por eso no basta con mostrar la pantalla: hasta
  // que esté contestado, el backend se niega a dar el borrador por bueno. Si la etapa dejara
  // seguir igual, el cliente llegaría a "Presentar" para encontrarse un 409 sin haber visto
  // nunca la pregunta que lo produce.
  const faltaPatrimonio = patrimonio && !patrimonio.completo ? 1 : 0;
  const faltan = sinDecidir + porConfirmar + porPedir + faltaPatrimonio;
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
            patrimonio={patrimonio}
            profunda={profunda}
            onCambio={onCambio}
            onSeguir={() => setEtapa("borrador")}
          />
        ) : null}
        {actual === "borrador" ? (
          <EtapaBorrador
            caseId={caseId}
            resumen={resumen}
            liquidacion={liquidacion}
            liquidacionError={liquidacionError}
            onCambio={onCambio}
            recomendaciones={recomendaciones}
            comparaciones={comparaciones}
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
        {/* LOS DOCUMENTOS SE VEN DESDE CUALQUIER ETAPA. Vivieron un tiempo dentro de la etapa
            Borrador, en una pestaña "Soportes", y eso los hacia inalcanzables justo cuando mas
            se consultan: un cliente con decisiones pendientes no puede entrar a Borrador, asi
            que "la consulta trajo 3 documentos" era un anuncio sin puerta. Son material de
            referencia, no parte del proceso, y por eso van aqui: en el carril que acompaña a
            todas las etapas, como ya lo dice el encabezado de este archivo. */}
        <Documentos documentos={caso.documents} />
        {/* El historial va DESPUES de los documentos del año en curso: primero el trabajo, y
            despues los antecedentes, que se consultan menos. */}
        <Historial caseId={caseId} documentos={caso.documents} onCambio={onCambio} />
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

    // ENLAZAR NO ES CRUZAR, y esa era la cadena rota: la consulta dejaba los documentos en el
    // expediente y nadie los cruzaba, asi que no habia renglones, sin renglones no hay caso que
    // liquidar, y el borrador salia vacio diciendo "hay que conciliar antes de calcular". El
    // endpoint es idempotente y preserva las decisiones del contador, asi que llamarlo aca es
    // seguro incluso si el caso ya estaba cruzado.
    //
    // Si el cruce falla NO se pierde la consulta: los documentos ya quedaron guardados. Se avisa y
    // queda el boton para reintentar, en vez de que toda la consulta parezca haber fallado.
    try {
      await api.runConciliacion(caso.id);
    } catch (error) {
      setPasos(null);
      return `${detalle.events.filter((e) => e.kind === "DIAN_QUERY").at(-1)?.message ?? "Listo."} Los documentos quedaron guardados, pero el cruce no se pudo hacer: ${error.message}`;
    }

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
        <div className="subir-campos">
          <label className="campo">
            <span>Qué es</span>
            {/*
              FALTABAN LOS CERTIFICADOS DE INGRESO, y por eso un 220 subido aca quedaba como
              "otro documento" sin leer: el backend TIENE extractor para los seis, pero esta lista
              solo ofrecia los de beneficios. El tipo que se elige aqui es el que decide que lector
              corre, asi que un tipo ausente equivale a un lector que no existe.

              Y SOBRABAN CUATRO. `registro_civil`, `planilla_pila`, `predial` y `otro` no existen
              en el registro de lectores del backend, asi que lo subido con esos tipos se guardaba
              sin leer y la lista de documentos lo marcaba en rojo como "no se pudo leer": la
              interfaz ofrecia doce opciones de las que ocho funcionaban. Los soportes que no
              tienen lector se piden donde tienen sentido —el predial vive ahora en el bloque de
              patrimonio, con su cifra al lado— y no en una lista que promete una lectura que no
              va a ocurrir.
            */}
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="CERT_INGRESOS_220">
                Certificado de ingresos y retenciones (220)
              </option>
              <option value="CERT_PENSION">Certificado de pensión</option>
              <option value="CERT_BANCARIO">Certificado bancario (rendimientos, GMF)</option>
              <option value="CERT_DIVIDENDOS">Certificado de dividendos</option>
              <option value="CERT_ARRIENDO">Certificado de arrendamiento</option>
              <option value="CERT_INTERESES_VIVIENDA">
                Certificado de intereses de vivienda
              </option>
              <option value="CERT_ICETEX">Certificado de intereses del ICETEX</option>
              <option value="CERT_PREPAGADA">Certificado de medicina prepagada</option>
              <option value="CERT_AFC_FVP">Certificado de AFC o pensión voluntaria</option>
              <option value="CERT_DONACION_ESAL">Certificado de una donación</option>
            </select>
          </label>

          <div className="campo">
            <span>El archivo o la foto</span>
            <div className="subir-archivo">
              {/* El `<input>` va DENTRO del label: asi el label es el area clickeable y no hace
                  falta un `htmlFor` con un id inventado. */}
              <label className="subir-archivo-boton">
                <input
                  type="file"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  required
                />
                <Upload size={14} />
                {archivo ? "Cambiar archivo" : "Elegir archivo"}
              </label>
              <span className="subir-archivo-nombre">
                {archivo ? archivo.name : "Sirve una foto del papel"}
              </span>
            </div>
          </div>
        </div>

        <div className="clave-botones">
          <button className="btn-grande" disabled={accion.running || !archivo}>
            {accion.running ? "Subiendo…" : "Agregar"}
          </button>
          <button type="button" className="enlace-suave" onClick={() => setAbierto(false)}>
            Cancelar
          </button>
        </div>
        {/* Por que el boton esta apagado. Un gris sin explicacion se lee como un boton roto. */}
        {!archivo ? <p className="subir-falta">Falta elegir el archivo.</p> : null}
      </form>
    </section>
  );
}
