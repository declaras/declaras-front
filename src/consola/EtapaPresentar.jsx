/**
 * ETAPA 4. El checklist final.
 *
 * Antes de dar algo por listo hay que poder ver POR QUE esta listo. Un boton solo, sin nada que
 * lo respalde, obliga a confiar; un checklist muestra que cada cosa se reviso y quien la reviso.
 *
 * Y cada linea que NO esta lista es un enlace a donde se arregla, no un reproche.
 */

import { AlertCircle, Check, ExternalLink, Eye } from "lucide-react";

import { useState, useSyncExternalStore } from "react";

import { api } from "./api";
import { useAction, useApi } from "./hooks";
import { ErrorApi } from "./componentes";
import { formatDate, formatMoney } from "./formato";
import Comparacion from "./Comparacion";
import VisorDocumento from "./VisorDocumento";
import Progreso from "./Progreso";
import { useVista } from "./vista";

export default function EtapaPresentar({ caseId, caso, conciliacion, peticiones, liquidacion, onIr, onCambio }) {
  const { profunda } = useVista();
  const cerrar = useAction(() => api.cerrarLiquidacion(caseId));
  const formulario = useApi(() => api.getFormulario(caseId), [caseId]);
  const comparacion = useApi(() => api.getComparacionDian(caseId), [caseId]);
  const yaLista = caso.status === "DRAFT_READY" || caso.status === "SUBMITTED";
  // LA DECLARACION FIRMADA, si la DIAN ya la tiene. Es el unico hecho de esta pantalla que no
  // sale de nuestro sistema sino del portal, y manda sobre todo lo demas: si esta, el trabajo
  // termino. Las de años anteriores llegan con el año en el tipo (`DECLARACION_2024`), asi que
  // un `FILED_RETURN` a secas es siempre la de este año.
  const presentada = (caso.documents ?? []).find((d) => d.doc_type === "FILED_RETURN") ?? null;

  const sinDecidir = (conciliacion?.partidas ?? []).filter((p) => !p.resolucion).length;
  const porConfirmar = caso.flags.filter((f) => !f.resolved_at && f.severity !== "info").length;
  const porPedir = (peticiones ?? []).length;
  const bloqueo = conciliacion?.falta_para_liquidar;
  const actual = liquidacion?.actual;
  // Los avisos que impiden dar la declaración por buena. `cerrar_borrador` se niega si hay uno
  // solo, así que sin mirarlos esta pantalla decía "todo listo", ofrecía el botón, y el backend
  // devolvía un error: la pantalla que existe para responder "¿está todo?" contestaba mal.
  const bloqueantes = actual?.bloqueantes ?? [];
  // Las advertencias no impiden presentar, pero este es su único momento útil: dicen sobre qué
  // supuesto se calculó una cifra (un ingreso clasificado a mano, unos dividendos sin desagregar) y
  // si el supuesto no se cumple, el impuesto es otro. Enterrarlas en la memoria de cálculo es
  // enterrarlas: nadie las abre justo antes de firmar.
  const porRevisar = (actual?.flags ?? []).filter((f) => f.severidad === "advertencia");

  // Es la última pantalla antes de dar la declaración por lista, así que es la que menos puede
  // hablar en lenguaje de contador: "Todos los renglones decididos" y "Soportes completos" son
  // frases que solo confirman algo a quien ya sabe qué es un renglón y qué es un soporte.
  const puntos = [
    {
      listo: !porConfirmar,
      texto: porConfirmar
        ? profunda
          ? `Falta confirmar ${porConfirmar} ${porConfirmar === 1 ? "cosa" : "cosas"} del reporte`
          : `Falta que confirmes ${porConfirmar} ${porConfirmar === 1 ? "cosa" : "cosas"}`
        : profunda
          ? "Información del reporte confirmada"
          : "Revisamos lo que la DIAN tiene de ti",
      ir: "decisiones",
    },
    {
      listo: !sinDecidir,
      texto: sinDecidir
        ? profunda
          ? `Faltan ${sinDecidir} ${sinDecidir === 1 ? "renglón" : "renglones"} por decidir`
          : `Faltan ${sinDecidir} ${sinDecidir === 1 ? "pregunta" : "preguntas"} por contestar`
        : profunda
          ? "Todos los renglones decididos"
          : "Contestaste todo lo que te preguntamos",
      ir: "decisiones",
    },
    {
      listo: !porPedir,
      texto: porPedir
        ? profunda
          ? `${porPedir} ${porPedir === 1 ? "documento" : "documentos"} por pedirle al cliente`
          : `Falta que mandes ${porPedir} ${porPedir === 1 ? "documento" : "documentos"}`
        : profunda
          ? "Soportes completos"
          : "Están todos los documentos que hacen falta",
      ir: "decisiones",
    },
    {
      // Que la declaración se pueda calcular y que esté completa son dos cosas distintas: con un
      // ingreso por fuera el cálculo SÍ sale (se publica la liquidación con las elecciones por
      // defecto), y justamente por eso hace falta un punto aparte que diga que no está completa.
      listo: !bloqueantes.length,
      texto: bloqueantes.length
        ? profunda
          ? `${bloqueantes.length} ${bloqueantes.length === 1 ? "ingreso quedó" : "ingresos quedaron"} por fuera de la liquidación`
          : `Hay ${bloqueantes.length} ${bloqueantes.length === 1 ? "ingreso" : "ingresos"} que todavía no ${bloqueantes.length === 1 ? "está" : "están"} en tu declaración`
        : profunda
          ? "Ningún ingreso quedó por fuera"
          : "Todos tus ingresos están en la declaración",
      ir: "decisiones",
      detalles: bloqueantes.map((f) => f.mensaje),
    },
    {
      listo: Boolean(actual) && !bloqueo,
      texto:
        bloqueo ||
        (actual
          ? profunda
            ? "Borrador calculado"
            : "Tu declaración está calculada"
          : profunda
            ? "El borrador todavía no se puede calcular"
            : "Todavía no podemos calcular tu declaración"),
      ir: "borrador",
    },
  ];

  const todoListo = puntos.every((p) => p.listo);

  return (
    <section className="etapa-cuerpo">
      <h1 className="etapa-titulo">
        {presentada
          ? "Declaración presentada"
          : yaLista
            ? "Declaración dada por lista"
            : "Antes de presentar"}
      </h1>

      {actual ? (
        <p className="presentar-cifra">
          <span className="money">{formatMoney(Math.abs(actual.saldo ?? 0))}</span>
          <span>{(actual.saldo ?? 0) >= 0 ? "a pagar" : "a favor"}</span>
        </p>
      ) : null}

      <ul className="checklist">
        {puntos.map((p) => (
          <li key={p.texto} className={p.listo ? "check-listo" : "check-falta"}>
            <span className="check-marca">
              {p.listo ? <Check size={13} /> : <AlertCircle size={13} />}
            </span>
            <span>
              {p.texto}
              {/* Cuál ingreso quedó por fuera, no solo cuántos: "2 ingresos" no le dice a nadie
                  qué tiene que ir a resolver. */}
              {!p.listo && p.detalles?.length ? (
                <span className="check-detalles">
                  {p.detalles.map((d) => (
                    <span className="check-detalle" key={d}>
                      {d}
                    </span>
                  ))}
                </span>
              ) : null}
            </span>
            {p.listo ? null : (
              <button className="enlace-suave" onClick={() => onIr(p.ir)}>
                resolver
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Antes del formulario: la pregunta "¿en qué difiere de lo que la DIAN espera?" se contesta
          antes de mirar las casillas una por una. */}
      <Comparacion comparacion={comparacion.data} error={comparacion.error} />

      {porRevisar.length ? (
        <section className="revisar">
          <h3 className="revisar-titulo">
            {porRevisar.length === 1
              ? "Una cosa para revisar antes de presentar"
              : `${porRevisar.length} cosas para revisar antes de presentar`}
          </h3>
          <p className="revisar-nota">
            {profunda
              ? "No bloquean el cierre, pero cada una dice sobre qué supuesto se calculó una cifra."
              : "No impiden presentar. Léelas: si algo de esto no es como dice, tu impuesto cambia."}
          </p>
          <ul className="revisar-lista">
            {porRevisar.map((f) => (
              <li key={f.codigo + f.mensaje.slice(0, 24)}>{f.mensaje}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* EL FORMULARIO QUE SE VA A RADICAR, y no los renglones que la exógena sugiere: eso es lo
          que la DIAN pondría con lo que ella sabe, y esto es lo que queda tras decidir. En un caso
          real la misma casilla traía cifras con millones de diferencia y nada lo decía. */}
      {formulario.data?.length ? <Formulario casillas={formulario.data} /> : null}

      {todoListo && !yaLista ? (
        <div className="presentar-cerrar">
          <button
            className="btn-grande"
            disabled={cerrar.running}
            onClick={async () => {
              if (await cerrar.run()) onCambio();
            }}
          >
            {cerrar.running ? "Guardando…" : "Dar la declaración por lista"}
          </button>
          <ErrorApi error={cerrar.error} />
          {/* ESTE TEXTO PROMETIA MAL, y se noto al usarlo: decia que despues de cerrar quedaba
              "el paso que no podemos hacer nosotros", como si al dar por lista hubiera que ir a
              llenar el formulario a mano. Es de antes de que Clara escribiera el borrador en el
              portal, y desde entonces omite justamente el paso que sigue. Ahora dice los dos:
              el que hacemos y el unico que no. */}
          <p className="presentar-nota">
            {profunda
              ? "Después Clara escribe el 210 en el portal y baja el PDF para revisarlo. Lo único que no podemos hacer es firmar y presentar: la firma electrónica es personal e intransferible."
              : "Después Clara llena tu formulario en el portal de la DIAN y te lo deja listo. Lo único que falta es que entres a firmarlo con tu firma electrónica."}
          </p>
        </div>
      ) : null}

      {presentada ? (
        <YaPresentada doc={presentada} profunda={profunda} caseId={caseId} />
      ) : yaLista ? (
        <EscribirAlPortal
          caseId={caseId}
          profunda={profunda}
          documentos={caso.documents}
          cambiadoEl={caso.updated_at}
          onEscrito={onCambio}
        />
      ) : null}
    </section>
  );
}


/**
 * Escribir el borrador en el portal de la DIAN, que era lo que se hacia a mano.
 *
 * Aparece solo con la declaracion dada por lista: lo que sale de Clara hacia la cuenta real
 * del contribuyente tiene que haber pasado por el "dar por buena" del contador, y el backend
 * lo exige igual (409 si no).
 *
 * LA CLAVE SE PIDE AQUI Y NO SE GUARDA EN NINGUN LADO. Viaja en esta peticion, abre la
 * sesion y se suelta; el campo se limpia al terminar. Es el mismo trato que le da la
 * extraccion.
 *
 * EL RESULTADO MUESTRA LA VERIFICACION, no un "listo" a secas. Despues de guardar, el
 * backend relee el borrador completo y compara casilla por casilla: en el primer ensayo
 * real el portal respondio 201 habiendo corrompido una letra, asi que un 201 sin relectura
 * no prueba nada. Si algo volvio distinto, se muestra en rojo con lo enviado y lo leido.
 */
/**
 * Los pasos que el backend hace por dentro al escribir, en el orden real.
 *
 * La escritura es UNA petición síncrona que hace cinco llamadas al portal, así que el frente no
 * recibe el avance real: lo muestra por TIEMPO, que es una promesa de ritmo, no una medición.
 * Es lo mismo que hace el flujo público de "consultar la DIAN", y por la misma razón: medio
 * minuto de pantalla quieta no dice si sigue vivo. El último paso no avanza solo — se queda
 * girando hasta que llega la respuesta de verdad.
 */
const PASOS_ESCRITURA = [
  "Entrando al portal de la DIAN",
  "Abriendo tu borrador del año",
  "Llenando las casillas del 210",
  "Verificando lo que quedó guardado",
];

/** Un tick cada segundo, sin estado propio: `useSyncExternalStore` recalcula en el snapshot. */
function cadaSegundo(avisar) {
  const reloj = setInterval(avisar, 1000);
  return () => clearInterval(reloj);
}

function useProgresoPorTiempo(corriendo, desde) {
  // El reloj no vive en estado de este componente —eso obligaría a un setState dentro de un
  // efecto, que dispara renders en cascada—: `useSyncExternalStore` suscribe al tick y devuelve
  // la hora actual, de la que se DERIVA el paso. En el servidor no hay reloj (snapshot fijo).
  const ahora = useSyncExternalStore(cadaSegundo, () => Date.now(), () => 0);
  const transcurrido = corriendo && desde ? ahora - desde : 0;
  const indice = Math.min(Math.floor(transcurrido / 4000), PASOS_ESCRITURA.length - 1);
  // Con la forma que espera <Progreso/>: los anteriores hechos, el actual corriendo, el resto
  // pendiente. El último se queda en RUNNING hasta que la petición real termine.
  return PASOS_ESCRITURA.map((label, i) => ({
    key: label,
    label,
    state: i < indice ? "DONE" : i === indice ? "RUNNING" : "PENDING",
  }));
}

/**
 * El borrador que YA quedo en el portal, si lo hay.
 *
 * ═══ EL ESTADO VIVIA SOLO EN LA PANTALLA ═══
 *
 * El resultado de escribir se guardaba en `useState`, asi que al recargar la pagina se perdia y
 * el formulario volvia a pedir la clave como si nunca se hubiera escrito. Quien entraba al dia
 * siguiente no tenia forma de saber si ya lo habia llevado al portal, y la unica salida era
 * escribirlo otra vez — una sesion mas contra la DIAN para averiguar algo que el expediente ya
 * sabia.
 *
 * El dato SI es persistente: al escribir queda el PDF del borrador como documento del
 * expediente. De ahi se deriva, que ademas es la fuente correcta —el hecho es que el documento
 * existe, no que esta pantalla se acuerde—.
 */
function borradorYaEscrito(documentos, cambiadoEl) {
  const doc = documentos?.find((d) => d.doc_type === "BORRADOR_ESCRITO") ?? null;
  if (!doc) return null;
  // ¿El expediente cambio DESPUES de escribirlo? Entonces lo que esta en el portal ya no es lo
  // que dice la pantalla, y firmarlo seria firmar cifras viejas.
  const desactualizado =
    Boolean(cambiadoEl) && new Date(cambiadoEl).getTime() > new Date(doc.added_at).getTime();
  return { doc, desactualizado };
}

function EscribirAlPortal({ caseId, profunda, documentos, cambiadoEl, onEscrito }) {
  const [clave, setClave] = useState("");
  const [resultado, setResultado] = useState(null);
  const [desde, setDesde] = useState(null);
  const [reescribiendo, setReescribiendo] = useState(false);
  const escribir = useAction((password) => api.escribirAlPortal(caseId, password));
  const pasos = useProgresoPorTiempo(escribir.running, desde);
  const anterior = borradorYaEscrito(documentos, cambiadoEl);
  // SI YA HAY CLAVE GUARDADA, NO SE PIDE. Preparar una declaración son varias visitas al
  // portal repartidas en días, y quien opera la consola no tiene la clave del cliente: pedirla
  // en cada paso significaba una llamada al cliente por paso.
  const claveGuardada = useApi(() => api.getClave(caseId), [caseId]);
  const hayGuardada = claveGuardada.data?.guardada === true;
  const olvidar = useAction(() => api.olvidarClave(caseId));

  const enviar = async (evento) => {
    evento.preventDefault();
    setDesde(Date.now());
    const r = await escribir.run(clave);
    if (r) {
      setResultado(r);
      setClave("");
      // El expediente cambió: el PDF del borrador acaba de entrar como documento. Sin esto
      // habría que refrescar la página para poder abrirlo.
      onEscrito?.();
    }
  };

  // YA ESTA ESCRITO: se muestra eso, no un formulario que invita a repetir una operacion
  // contra la DIAN que ya se hizo. `resultado` gana cuando se acaba de escribir en esta visita,
  // porque trae la verificacion casilla por casilla que el documento solo no cuenta.
  if (anterior && !resultado && !reescribiendo && !escribir.running) {
    return (
      <YaEnElPortal
        anterior={anterior}
        profunda={profunda}
        onReescribir={() => setReescribiendo(true)}
      />
    );
  }

  if (escribir.running) {
    return (
      <div className="portal-escribir">
        <h3 className="revisar-titulo">Llevando el borrador al portal de la DIAN</h3>
        <p className="presentar-nota">
          Tarda cerca de medio minuto. No cierres esta pantalla.
        </p>
        <Progreso pasos={pasos} />
      </div>
    );
  }

  return (
    <div className="portal-escribir">
      {!resultado ? (
        <form onSubmit={enviar}>
          <h3 className="revisar-titulo">Llevar el borrador al portal de la DIAN</h3>
          <p className="presentar-nota">
            {profunda
              ? "Clara crea el borrador del 210 en la cuenta del cliente si no existe, lo llena casilla por casilla y verifica releyendo lo que quedó guardado. Después solo falta que él entre a firmar."
              : "Dejamos tu declaración lista en el portal de la DIAN y verificamos que quede igual a esto. Después solo entras a firmarla."}
          </p>
          {hayGuardada ? (
            <p className="clave-guardada">
              {profunda ? "Se usa la clave guardada del cliente." : "Usamos tu clave guardada."}{" "}
              <button
                type="button"
                className="enlace-suave"
                disabled={olvidar.running}
                onClick={async () => {
                  if (await olvidar.run()) claveGuardada.reload();
                }}
              >
                {olvidar.running ? "borrando…" : "borrarla"}
              </button>
            </p>
          ) : (
            <label className="campo portal-clave">
              <span>
                {profunda ? "Clave del portal del cliente" : "Tu clave del portal de la DIAN"}
              </span>
              <input
                type="password"
                autoComplete="off"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
              />
            </label>
          )}
          <button
            className="btn-grande"
            disabled={escribir.running || (!clave && !hayGuardada)}
          >
            Escribir el borrador
          </button>
          <ErrorApi error={escribir.error} />
          <ErrorApi error={olvidar.error} />
        </form>
      ) : (
        <ResultadoEscritura
          resultado={resultado}
          profunda={profunda}
          documentos={documentos}
        />
      )}
    </div>
  );
}

/**
 * QUE FIRMO, comparado con lo que le preparamos.
 *
 * La declaracion presentada es el unico dato de esta pantalla que no sale de nuestro sistema: la
 * baja la consulta a la DIAN. Y por eso puede contradecirnos. Que exista NO prueba que haya
 * firmado nuestro borrador: pudo firmar la sugerida de la DIAN, un borrador viejo nuestro de
 * antes del ultimo cambio, o lo que le armo otro contador. Los tres casos se ven identicos si uno
 * se limita a decir "ya esta presentada", y los tres significan cosas distintas para quien
 * responde por ese expediente.
 *
 * La comparacion NO se hace aca: la hace el backend (`comparacion-con-lo-presentado`), que ya
 * empareja casilla por casilla y sabe distinguir "la trae solo uno de los dos" de "las dos en
 * cero". Rehacerla en JavaScript era tener dos reglas para la misma pregunta.
 */
function YaPresentada({ doc, profunda, caseId }) {
  const [viendo, setViendo] = useState(false);
  const comparacion = useApi(() => api.getComparacionPresentada(caseId), [caseId]);

  return (
    <div className="portal-escribir portal-presentada">
      <h3 className="revisar-titulo">
        <Check size={15} /> Ya está presentada
      </h3>
      <p className="presentar-nota">
        {profunda
          ? `La DIAN ya tiene la declaración firmada de este año. La bajamos el ${formatDate(doc.added_at)}.`
          : `Tu declaración ya quedó presentada ante la DIAN. La bajamos el ${formatDate(doc.added_at)} y la puedes ver acá cuando quieras.`}
      </p>

      <div className="portal-acciones">
        <button className="btn-mini" onClick={() => setViendo(true)}>
          <Eye size={13} />
          Ver la declaración presentada
        </button>
        <a className="btn-mini" href={doc.download_url} download={doc.filename}>
          Descargarla
        </a>
      </div>

      {viendo ? <VisorDocumento doc={doc} onCerrar={() => setViendo(false)} /> : null}

      {/* EN QUE SE PARECE A LO QUE PREPARAMOS. Nadie va a cotejar cien casillas a mano en el PDF,
          y la diferencia importa: si lo que firmo no es lo nuestro, el impuesto que pago no es el
          que calculamos. */}
      <Comparacion
        comparacion={comparacion.data}
        error={comparacion.error}
        cargando={comparacion.loading}
      />
    </div>
  );
}

/**
 * El borrador que ya esta en el portal, al volver a entrar.
 *
 * Contesta de una la pregunta con la que alguien abre esta pantalla al dia siguiente: ¿ya lo
 * llevamos? Antes habia que escribirlo otra vez para saberlo, o sea gastar una sesion contra la
 * DIAN para averiguar algo que el expediente ya sabia.
 *
 * Y si el expediente cambio DESPUES de escribirlo, lo dice: lo que esta en el portal ya no es lo
 * que muestra la pantalla, y firmarlo seria firmar cifras viejas.
 */
function YaEnElPortal({ anterior, profunda, onReescribir }) {
  const [viendo, setViendo] = useState(false);
  const { doc, desactualizado } = anterior;

  return (
    <div className={desactualizado ? "portal-escribir portal-viejo" : "portal-escribir"}>
      <h3 className="revisar-titulo">
        {desactualizado ? "El borrador del portal quedó desactualizado" : "Ya está en el portal"}
      </h3>
      <p className="presentar-nota">
        {desactualizado
          ? `Se escribió el ${formatDate(doc.added_at)} y el expediente cambió después. Lo que está en la DIAN ya no es lo que ves acá: hay que volver a escribirlo antes de firmar.`
          : `Lo llevamos el ${formatDate(doc.added_at)}. ${
              profunda
                ? "Falta que el cliente entre a firmarlo."
                : "Solo falta que entres a firmarlo."
            }`}
      </p>

      <div className="portal-acciones">
        <button className="btn-mini" onClick={() => setViendo(true)}>
          <Eye size={13} />
          Ver el borrador que quedó
        </button>
        <button className="btn-mini" onClick={onReescribir}>
          {desactualizado ? "Volver a escribirlo" : "Escribirlo de nuevo"}
        </button>
      </div>

      {viendo ? <VisorDocumento doc={doc} onCerrar={() => setViendo(false)} /> : null}

      {!desactualizado ? (
        <a
          className="btn-grande"
          href="https://muisca.dian.gov.co/WebDilIngresoFormRenta210/#/ingreso/borradores"
          target="_blank"
          rel="noreferrer"
        >
          Entrar a la DIAN a firmar
          <ExternalLink size={15} />
        </a>
      ) : null}
    </div>
  );
}

/**
 * Lo que quedo en el portal.
 *
 * ═══ EL PDF ES LA PRUEBA, Y ANTES NO ESTABA ═══
 *
 * La verificacion casilla por casilla dice que el portal guardo lo que se envio, pero eso es
 * el sistema dandose la razon a si mismo. El documento que genera la DIAN es lo que un
 * contador puede abrir, archivar y mostrarle al cliente. Hasta ahora el proceso terminaba sin
 * el: quedaba un enlace al portal, o sea "vaya a verlo usted".
 *
 * Se baja en la misma sesion de la escritura y entra al expediente como un documento mas, asi
 * que ademas de este boton queda en la lista de documentos, que es donde alguien lo va a
 * buscar la semana entrante.
 */
function ResultadoEscritura({ resultado, profunda, documentos }) {
  const {
    verificado,
    escritas,
    form_id: formId,
    diferencias,
    ajenas,
    documento_id: documentoId,
  } = resultado;
  const numerosAjenos = Object.keys(ajenas ?? {});
  const [viendo, setViendo] = useState(false);
  // La escritura devuelve el id; la URL de descarga vive en el documento del expediente, que
  // se recargo al terminar. Si todavia no llego, el boton no se pinta en vez de fallar.
  const borrador = documentos?.find((d) => d.id === documentoId) ?? null;

  return (
    <div className={verificado ? "portal-resultado" : "portal-resultado portal-fallo"}>
      <p className="portal-veredicto">
        {verificado ? <Check size={15} /> : <AlertCircle size={15} />}
        {verificado
          ? `Borrador ${formId} escrito y verificado: las ${escritas} casillas quedaron como se enviaron.`
          : `El borrador ${formId} quedó DISTINTO de lo enviado. No lo firmes sin revisar esto:`}
      </p>

      {diferencias?.length ? (
        <ul className="portal-diferencias">
          {diferencias.map((d) => (
            <li key={d.casilla}>
              Casilla {d.casilla}: se envió {String(d.enviado)} y el portal guardó {String(d.leido)}
            </li>
          ))}
        </ul>
      ) : null}

      {numerosAjenos.length ? (
        <p className="presentar-nota">
          {profunda
            ? `El borrador además trae cifras que Clara no calcula (casillas ${numerosAjenos.join(", ")}): estaban en el portal y se conservaron. Revisarlas antes de firmar.`
            : "El borrador trae además unas cifras que ya estaban en el portal. Tu contador las revisa antes de la firma."}
        </p>
      ) : null}

      {borrador ? (
        <div className="portal-acciones">
          <button className="btn-mini" onClick={() => setViendo(true)}>
            <Eye size={13} />
            Ver el borrador que quedó
          </button>
        </div>
      ) : null}

      {viendo && borrador ? (
        <VisorDocumento doc={borrador} onCerrar={() => setViendo(false)} />
      ) : null}

      {verificado ? (
        <a
          className="btn-grande"
          href="https://muisca.dian.gov.co/WebDilIngresoFormRenta210/#/ingreso/borradores"
          target="_blank"
          rel="noreferrer"
        >
          {/* Al listado de borradores, no a la portada: es donde esta el que Clara acaba de
              dejar listo. Mandar a la raiz obligaba a navegar tres pantallas para llegar. */}
          Entrar a la DIAN a firmar
          <ExternalLink size={15} />
        </a>
      ) : null}
    </div>
  );
}


/**
 * El 210 casilla por casilla, plegado.
 *
 * Plegado porque es la evidencia, no la respuesta: quien presenta ya vio la cifra arriba. Y con
 * los nombres oficiales, porque nadie deberia tener que saber que es "la casilla 97".
 *
 * Solo se muestran las casillas con cifra. Un formulario con treinta ceros esconde las seis que
 * importan, y las vacias no se declaran.
 */
function Formulario({ casillas }) {
  const { profunda } = useVista();
  const [abierto, setAbierto] = useState(false);
  const conCifra = casillas.filter((c) => c.valor);

  return (
    <div className="formulario">
      <button className="enlace-suave" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        {abierto
          ? "Ocultar el formulario"
          : profunda
            ? `Ver el formulario 210 que se va a radicar (${conCifra.length} casillas con cifra)`
            : "Ver el formulario que se va a radicar"}
      </button>
      {abierto ? (
        <table className="tabla formulario-tabla">
          <thead>
            <tr>
              <th>Casilla</th>
              <th>Concepto</th>
              <th className="num">Valor</th>
            </tr>
          </thead>
          <tbody>
            {conCifra.map((c) => (
              <tr key={c.numero}>
                <td className="strong">{c.numero}</td>
                <td>{c.nombre}</td>
                <td className="num strong money">{formatMoney(c.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
