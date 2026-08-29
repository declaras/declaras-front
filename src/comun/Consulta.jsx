/**
 * "¿Me toca declarar?" contestado en el sitio, en vez de por WhatsApp.
 *
 * ═══ EL PROBLEMA QUE RESUELVE ═══
 *
 * Casi todo el que escribia al chat preguntaba lo mismo: si le toca declarar este año. Eso tapa el
 * canal con una pregunta que el sitio puede responder solo, y ademas confunde el embudo: quien
 * viene a comprar y quien viene a preguntar entran por la misma puerta. Ahora el boton grande es
 * empezar la declaracion, y esto es la puerta de al lado.
 *
 * ═══ UNA RESPUESTA AFIRMATIVA TERMINA LA CONSULTA ═══
 *
 * Basta cumplir UNO de los cinco topes del art. 592 para quedar obligado, asi que preguntar los
 * cinco cuando el primero ya dijo que si es pedirle a alguien cuatro datos que no cambian nada. Se
 * pregunta de a uno y se corta en el primer "si". Para la mayoria la consulta termina en una
 * pregunta, porque el tope de ingresos va de primero justamente por eso.
 *
 * ═══ TRES DESENLACES, NO DOS ═══
 *
 * Si, no, y NO CONCLUYENTE. El tercero existe porque "no estoy seguro" es una respuesta legitima y
 * frecuente —poca gente sabe cuanto le consignaron en el año— y tratarla como un "no" seria
 * decirle a alguien que no declare sin saberlo. Ahi es donde tiene sentido cobrar por una revision.
 */

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, Check, Loader2, MessageCircle, ShieldCheck } from "lucide-react";

import { TOPES, topeEnPesos, pesos, UVT_2025 } from "../contenido/datos";
import { abrirWhatsApp } from "../App";
import { identificar, registrar } from "./medicion";

const VALOR_EXPERTO = 30_000;

/**
 * Deja la tarjeta al comienzo cuando cambia de paso.
 *
 * ═══ POR QUE HACE FALTA ═══
 *
 * Cada paso mide un alto muy distinto: el formulario es largo, el progreso es corto, el resultado
 * vuelve a ser largo. Al cambiar, el navegador conserva la posicion del scroll, asi que la
 * tarjeta se encoge o se estira DEBAJO de donde estas mirando y la pantalla pega un brinco. En
 * movil es peor, porque la tarjeta ocupa mas que la pantalla: tocas un boton abajo y el paso
 * nuevo empieza fuera de vista, hacia arriba.
 *
 * NO CORRE EN EL PRIMER PINTADO. Si lo hiciera, abrir la portada arrastraria la pagina hasta la
 * consulta sin que nadie lo pidiera.
 *
 * Y respeta a quien pidio menos animacion en su sistema: para esa persona el salto es instantaneo
 * en vez de un desplazamiento, que es lo que la preferencia significa.
 */
function useIrAlComienzo(ref, dependencia) {
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    const nodo = ref.current;
    if (!nodo || typeof window === "undefined") return;
    const quietito = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    nodo.scrollIntoView({ behavior: quietito ? "auto" : "smooth", block: "start" });
  }, [ref, dependencia]);
}
const ANIO_GRAVABLE = 2025;

/** Lo que pasa mientras se consulta. El primero es el que responde "¿mi clave sirvió?". */
const PASOS_DIAN = [
  "Entrando al portal de la DIAN",
  "Buscando lo que terceros reportaron a tu nombre",
  "Comparando con los cinco topes del año",
];

/**
 * Manda la consulta al servidor. NUNCA bloquea lo que la persona ve.
 *
 * El veredicto se pinta con la regla local —basta un "si" para quedar obligado, y eso no
 * depende de la red— y el envio corre aparte. Si el backend esta caido, la persona igual recibe
 * su respuesta; lo que se pierde es el registro, que es problema nuestro y no suyo. Al reves
 * seria dejar a alguien mirando un spinner por una peticion que a el no le sirve de nada.
 *
 * El SERVIDOR recalcula el veredicto sobre las respuestas: lo que se manda son los hechos, no
 * la conclusion.
 */
async function registrarConsulta(cuerpo) {
  const base = import.meta.env.VITE_API_URL;
  if (!base) return null;
  try {
    const r = await fetch(`${base.replace(/\/$/, "")}/v1/consultas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** El salario mensual equivalente al tope de ingresos, que es como la gente piensa su plata. */
const mensualDe = (tope) => pesos((tope.uvt * UVT_2025) / 12);

export default function Consulta({ alCerrar = null }) {
  const [paso, setPaso] = useState("datos");
  // El embudo entero era ciego: solo se medía abrir WhatsApp, que es el ultimo paso. Sin los de
  // antes no hay forma de saber DONDE se cae la gente, que es la unica pregunta que sirve para
  // arreglar algo.
  useEffect(() => registrar("consulta_vista"), []);
  const caja = useRef(null);
  useIrAlComienzo(caja, paso);
  const [datos, setDatos] = useState({ nombre: "", correo: "", whatsapp: "", acepta: false });
  // Lo que viaja al servidor: el `acepta` es del formulario, no un dato de la persona.
  const contacto = { nombre: datos.nombre, correo: datos.correo, whatsapp: datos.whatsapp };
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [veredicto, setVeredicto] = useState(null);

  const cerrar = (nuevas, veredictoLocal) => {
    setVeredicto(veredictoLocal);
    setPaso("resultado");
    registrarConsulta({ ...contacto, via: "preguntas", respuestas: nuevas });
    // CUANTAS PREGUNTAS HIZO FALTA es la metrica que dice si el corte sirve: si casi todas
    // terminan en una, el orden de los topes esta bien puesto.
    registrar("consulta_veredicto", {
      via: "preguntas",
      resultado: veredictoLocal.tipo,
      preguntas: Object.keys(nuevas).length,
    });
  };

  const responder = (tope, valor) => {
    const nuevas = { ...respuestas, [tope.id]: valor };
    setRespuestas(nuevas);

    // EL CORTE. Un solo "si" ya obliga: seguir preguntando no cambia el resultado.
    if (valor === "si") {
      cerrar(nuevas, { tipo: "OBLIGADO", porQue: tope });
      return;
    }
    if (indice + 1 < TOPES.length) {
      setIndice(indice + 1);
      return;
    }
    // Se acabaron las preguntas sin un solo "si".
    const dudas = TOPES.filter((t) => nuevas[t.id] === "no-se");
    cerrar(nuevas, dudas.length ? { tipo: "NO_CONCLUYENTE", dudas } : { tipo: "NO_OBLIGADO" });
  };

  const reiniciar = () => {
    setIndice(0);
    setRespuestas({});
    setVeredicto(null);
    setPaso("camino");
  };

  return (
    <div className="consulta" ref={caja}>
      {paso === "datos" ? (
        <Datos
          datos={datos}
          setDatos={setDatos}
          onSeguir={() => {
            identificar(datos);
            registrar("consulta_datos_dejados");
            setPaso("camino");
          }}
        />
      ) : null}

      {paso === "camino" ? (
        <Camino
          nombre={datos.nombre}
          onPreguntas={() => {
            registrar("consulta_via_elegida", { via: "preguntas" });
            setPaso("preguntas");
          }}
          onDian={() => {
            registrarConsulta({ ...contacto, via: "dian" });
            registrar("consulta_via_elegida", { via: "dian" });
            setPaso("dian");
          }}
          onExperto={() => {
            registrarConsulta({ ...contacto, via: "experto" });
            registrar("consulta_via_elegida", { via: "experto" });
            setPaso("experto");
          }}
        />
      ) : null}

      {paso === "preguntas" ? (
        <Pregunta
          tope={TOPES[indice]}
          numero={indice + 1}
          total={TOPES.length}
          onResponder={responder}
          onVolver={() => (indice ? setIndice(indice - 1) : setPaso("camino"))}
        />
      ) : null}

      {paso === "dian" ? <ConsultaDian contacto={contacto} onVolver={() => setPaso("camino")} /> : null}
      {paso === "experto" ? <Experto onVolver={() => setPaso("camino")} /> : null}

      {paso === "resultado" ? (
        <Resultado veredicto={veredicto} onReiniciar={reiniciar} onExperto={() => setPaso("experto")} />
      ) : null}

      {alCerrar ? (
        <button className="consulta-cerrar" type="button" onClick={alCerrar}>
          Cerrar
        </button>
      ) : null}
    </div>
  );
}

/**
 * Los datos de contacto, que son la unica razon por la que esto vale la pena para el negocio.
 *
 * Se piden ANTES y no despues: quien ya vio su resultado no tiene ningun motivo para dejarlos.
 */
function Datos({ datos, setDatos, onSeguir }) {
  // `useId` y no un id fijo: la consulta puede aparecer dos veces en una pagina, y con ids
  // repetidos la etiqueta de la segunda enfoca el campo de la primera.
  const idNombre = useId();
  const idCorreo = useId();
  const idWhatsapp = useId();
  // Que campos ya perdieron el foco. UN ERROR NO SE MUESTRA MIENTRAS SE ESCRIBE: quien empieza a
  // teclear su correo ve "esto no es un correo" en la primera letra, y eso regana a alguien que
  // esta haciendo las cosas bien. Se muestra al salir del campo, o al intentar enviar.
  const [tocados, setTocados] = useState({});
  const [intento, setIntento] = useState(false);

  const errores = revisarDatos(datos);
  const puede = Object.keys(errores).length === 0;
  const verError = (campo) => (tocados[campo] || intento) && errores[campo];

  const poner = (campo) => (e) =>
    setDatos({ ...datos, [campo]: campo === "acepta" ? e.target.checked : e.target.value });
  const salir = (campo) => () => setTocados({ ...tocados, [campo]: true });

  return (
    <form
      className="consulta-paso"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        // EL BOTON YA NO SE DESHABILITA. Deshabilitado no explica nada: la persona lo ve gris,
        // no sabe cual de los cuatro campos esta mal y se va. Ahora deja enviar, y al enviar
        // senala exactamente que falta.
        setIntento(true);
        if (puede) onSeguir();
      }}
    >
      <h3>¿No sabes si te toca declarar?</h3>
      <p className="consulta-nota">Te lo decimos gratis en un minuto. Sin claves ni papeles.</p>

      <div className="consulta-campo">
        <label htmlFor={idNombre}>Tu nombre</label>
        <input
          id={idNombre}
          value={datos.nombre}
          onChange={poner("nombre")}
          onBlur={salir("nombre")}
          autoComplete="given-name"
          aria-invalid={Boolean(verError("nombre"))}
        />
        {verError("nombre") ? <p className="consulta-error">{errores.nombre}</p> : null}
      </div>

      <div className="consulta-fila">
        <div className="consulta-campo">
          <label htmlFor={idCorreo}>Correo</label>
          <input
            id={idCorreo}
            type="email"
            value={datos.correo}
            onChange={poner("correo")}
            onBlur={salir("correo")}
            autoComplete="email"
            aria-invalid={Boolean(verError("correo"))}
          />
          {verError("correo") ? <p className="consulta-error">{errores.correo}</p> : null}
        </div>
        <div className="consulta-campo">
          <label htmlFor={idWhatsapp}>WhatsApp</label>
          <input
            id={idWhatsapp}
            type="tel"
            inputMode="numeric"
            placeholder="300 123 4567"
            value={datos.whatsapp}
            onChange={poner("whatsapp")}
            onBlur={salir("whatsapp")}
            autoComplete="tel"
            aria-invalid={Boolean(verError("whatsapp"))}
          />
          {verError("whatsapp") ? <p className="consulta-error">{errores.whatsapp}</p> : null}
        </div>
      </div>

      <label className="consulta-check">
        <input type="checkbox" checked={datos.acepta} onChange={poner("acepta")} />
        <span>
          Acepto los <a href="/terminos">términos y la política de datos</a>.
        </span>
      </label>
      {verError("acepta") ? <p className="consulta-error">{errores.acepta}</p> : null}

      <button className="consulta-boton">Continuar</button>
    </form>
  );
}

/**
 * Que le falta a cada campo, dicho como se le dice a una persona.
 *
 * Los mensajes nombran el arreglo, no el defecto: "faltan dígitos" en vez de "número inválido".
 * El segundo describe el estado y deja al lector adivinando que hacer.
 */
function revisarDatos(datos) {
  const errores = {};
  if (!datos.nombre.trim()) errores.nombre = "Escribe tu nombre.";
  if (!datos.correo.trim()) errores.correo = "Escribe tu correo.";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(datos.correo.trim()))
    errores.correo = "Revisa el correo: le falta el @ o lo que va después.";

  const digitos = datos.whatsapp.replace(/\D/g, "");
  if (!digitos) errores.whatsapp = "Escribe tu número de WhatsApp.";
  // Un celular colombiano son 10 digitos. Se aceptan 12 por si escriben el 57 adelante.
  else if (digitos.length < 10) errores.whatsapp = `Faltan dígitos: van 10 y escribiste ${digitos.length}.`;
  else if (digitos.length > 12) errores.whatsapp = "Sobran dígitos para un número de celular.";

  if (!datos.acepta) errores.acepta = "Falta aceptar los términos para continuar.";
  return errores;
}

/**
 * Por donde consultar. Tres caminos con costos muy distintos para quien pregunta.
 *
 * LA PREGUNTA NO ES "¿TIENES RUT?" Y ESA ES LA CORRECCION QUE IMPORTA. Tener RUT es estar
 * inscrito ante la DIAN; entrar al portal necesita ademas una cuenta habilitada con su clave, que
 * se saca aparte. Mucha gente saco el RUT para un tramite y nunca entro al portal. Como lo que
 * este camino necesita es la CLAVE (sin ella no se puede consultar nada), preguntar por el RUT
 * mandaria al camino equivocado a quien tiene RUT y no tiene clave.
 */
function Camino({ nombre, onPreguntas, onDian, onExperto }) {
  const saludo = nombre.trim().split(" ")[0];
  return (
    <div className="consulta-paso">
      <h3>{saludo ? `Listo, ${saludo}.` : "Listo."} ¿Cómo quieres saberlo?</h3>
      <p className="consulta-nota">No te volvemos a pedir tus datos.</p>

      <ul className="consulta-caminos">
        <li>
          <div>
            <b>Contestando cinco preguntas</b>
            <p>Sobre cuánto ganaste y cuánto moviste. No necesitas saber de impuestos ni tener nada a la mano.</p>
          </div>
          <button className="consulta-boton" type="button" onClick={onPreguntas}>
            Empezar
          </button>
        </li>
        <li>
          <div>
            <b>Con tu clave de la DIAN</b>
            <p>Miramos lo que la DIAN ya tiene reportado a tu nombre. Es la respuesta más exacta, con las cifras reales.</p>
          </div>
          <button className="consulta-boton consulta-boton-suave" type="button" onClick={onDian}>
            Consultar
          </button>
        </li>
        <li>
          <div>
            <b>Que lo revise un contador</b>
            {/* El precio va en su propia linea y no dentro del parrafo: interpolado, el <b> partia
                la frase en tres pedazos y el punto final quedaba colgando solo. */}
            <p>
              Un experto mira tu caso, te dice con certeza si te toca y qué hacer. Si no tienes RUT
              o clave, te ayuda a sacarlos.
            </p>
            <p className="consulta-precio">{pesos(VALOR_EXPERTO)}</p>
          </div>
          <button className="consulta-boton consulta-boton-suave" type="button" onClick={onExperto}>
            Hablar con un contador
          </button>
        </li>
      </ul>
    </div>
  );
}

/** Una pregunta por pantalla. Con cinco a la vez, la persona las lee en diagonal y adivina. */
function Pregunta({ tope, numero, total, onResponder, onVolver }) {
  const valor = topeEnPesos(tope);
  return (
    <div className="consulta-paso">
      <button className="consulta-volver" type="button" onClick={onVolver}>
        <ArrowLeft size={15} /> Atrás
      </button>
      {/* El contador dice "hasta 5", no "de 5": con un solo si la consulta termina antes, y
          prometer cinco cuando pueden ser una hace la consulta mas larga de lo que se siente. */}
      <p className="consulta-progreso">Pregunta {numero} de hasta {total}</p>

      <h3>{tope.pregunta(valor)}</h3>
      <p className="consulta-nota">{tope.ayuda(mensualDe(tope))}</p>

      <div className="consulta-opciones">
        <button className="consulta-opcion" type="button" onClick={() => onResponder(tope, "si")}>
          Sí
        </button>
        <button className="consulta-opcion" type="button" onClick={() => onResponder(tope, "no")}>
          No
        </button>
        <button
          className="consulta-opcion consulta-opcion-duda"
          type="button"
          onClick={() => onResponder(tope, "no-se")}
        >
          No estoy seguro
        </button>
      </div>
    </div>
  );
}

/** El veredicto. Tres desenlaces con tres siguientes pasos distintos. */
function Resultado({ veredicto, onReiniciar, onExperto }) {
  if (veredicto.tipo === "OBLIGADO") {
    const tope = veredicto.porQue;
    return (
      <div className="consulta-paso consulta-resultado">
        <p className="consulta-veredicto consulta-si">
          <Check size={18} /> Sí te toca declarar
        </p>
        <p>
          Con eso basta: superaste el tope de <b>{topeEnPesos(tope)}</b> y con uno solo ya quedas
          obligado. No hace falta seguir preguntando.
        </p>
        <p className="consulta-nota">
          Declarar no es lo mismo que pagar. Mucha gente declara y le devuelven plata.
        </p>
        <button className="consulta-boton consulta-boton-grande" type="button" onClick={abrirWhatsApp}>
          <MessageCircle size={17} /> Empezar mi declaración por WhatsApp
        </button>
        <button className="consulta-volver" type="button" onClick={onReiniciar}>
          Volver a empezar
        </button>
      </div>
    );
  }

  if (veredicto.tipo === "NO_OBLIGADO") {
    return (
      <div className="consulta-paso consulta-resultado">
        <p className="consulta-veredicto">Por lo que contestaste, no te toca declarar</p>
        <p>No superaste ninguno de los cinco topes del año gravable 2025.</p>
        {/* NO SE CIERRA CON UN "LISTO, CHAO". Este resultado depende enteramente de cifras que la
            persona estimo de memoria, y quien se equivoca por debajo no se entera hasta que le
            llega la sancion. Decirlo es honesto y ademas es donde esta el servicio que se cobra. */}
        <p className="consulta-nota">
          Ojo con una cosa: esto sale de lo que recordaste, no de tus cifras reales. La DIAN mira lo
          que le reportaron tus bancos y quien te pagó, y esos números suelen ser más altos de lo
          que uno cree.
        </p>
        <button className="consulta-boton" type="button" onClick={onExperto}>
          <ShieldCheck size={16} /> Que un contador lo confirme por {pesos(VALOR_EXPERTO)}
        </button>
        <button className="consulta-volver" type="button" onClick={onReiniciar}>
          Volver a empezar
        </button>
      </div>
    );
  }

  return (
    <div className="consulta-paso consulta-resultado">
      <p className="consulta-veredicto">Con esto no se puede saber</p>
      <p>
        Quedaron {veredicto.dudas.length}{" "}
        {veredicto.dudas.length === 1 ? "pregunta sin respuesta" : "preguntas sin respuesta"}, y
        cualquiera de ellas cambia el resultado.
      </p>
      <p className="consulta-nota">
        Es normal: casi nadie sabe de memoria cuánto le consignaron en un año. Con tu clave de la
        DIAN se ve exacto, o un contador lo revisa por ti.
      </p>
      <button className="consulta-boton" type="button" onClick={onExperto}>
        <ShieldCheck size={16} /> Que un contador lo revise por {pesos(VALOR_EXPERTO)}
      </button>
      <button className="consulta-volver" type="button" onClick={onReiniciar}>
        Volver a empezar
      </button>
    </div>
  );
}

/**
 * El camino de la clave: se consulta ACA, no se manda a WhatsApp.
 *
 * Mandarlo al chat era devolverle a la persona el trabajo que este componente existe para
 * quitarle. Y es el unico camino que puede responder con las cifras REALES —las que los bancos y
 * los empleadores ya le reportaron a la DIAN— en vez de con lo que la persona recuerda.
 *
 * LOS TRES ESTADOS SE VEN. Contra el portal real la consulta tarda cerca de medio minuto, y una
 * pantalla quieta con "Consultando…" deja a quien espera sin saber si la clave sirvio o si se
 * colgo. Los pasos se muestran todos desde el principio y se van marcando.
 */
function ConsultaDian({ contacto, onVolver }) {
  // Este camino cambia de estado (formulario, corriendo, resultado) sin que cambie el `paso` de
  // arriba, asi que lleva su propio aviso: si no, el unico salto que no se corrige es justo el
  // que mas se nota, el de la espera al resultado.
  const caja = useRef(null);
  const idDoc = useId();
  const idClave = useId();
  const [documento, setDocumento] = useState("");
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState("forma");
  const [paso, setPaso] = useState(0);
  const [salida, setSalida] = useState(null);
  const [error, setError] = useState(null);
  useIrAlComienzo(caja, estado);

  const puede = documento.replace(/\D/g, "").length >= 5 && clave.length >= 4;

  const consultar = async (e) => {
    e.preventDefault();
    if (!puede) return;
    setEstado("corriendo");
    setError(null);
    // Los pasos avanzan por tiempo porque el backend no los transmite: es una promesa de ritmo,
    // no una medicion, y por eso se detiene en el ultimo hasta que llegue la respuesta de verdad.
    setPaso(0);
    const reloj = setInterval(() => setPaso((n) => Math.min(n + 1, PASOS_DIAN.length - 1)), 4000);
    try {
      const base = import.meta.env.VITE_API_URL;
      const r = await fetch(`${(base ?? "").replace(/\/$/, "")}/v1/consultas/dian`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contacto,
          id_number: documento.replace(/\D/g, ""),
          dian_password: clave,
          tax_year: ANIO_GRAVABLE,
        }),
      });
      const cuerpo = await r.json().catch(() => null);
      if (!r.ok) {
        setError(cuerpo?.message ?? "No se pudo consultar. Intenta de nuevo.");
        setEstado("forma");
        // Un fallo es tan informativo como un exito: si la mayoria falla por la clave, el
        // problema es que la gente no la tiene, y eso cambia que producto hay que hacer.
        registrar("consulta_dian_fallo", { motivo: cuerpo?.code ?? "desconocido" });
        return;
      }
      setSalida(cuerpo);
      setEstado("resultado");
      registrar("consulta_veredicto", {
        via: "dian",
        resultado: cuerpo?.resultado,
        // Cuantos topes supero, no cuales ni por cuanto: la cifra de la plata de una persona
        // no tiene por que salir del backend hacia un proveedor de analitica.
        topes_superados: (cuerpo?.topes ?? []).filter((t) => t.supera).length,
      });
    } catch {
      setError("No se pudo contactar el servicio. Revisa tu conexión.");
      setEstado("forma");
    } finally {
      clearInterval(reloj);
      setClave("");
    }
  };

  if (estado === "corriendo") {
    return (
      <div className="consulta-paso" ref={caja}>
        <h3>Consultando con la DIAN</h3>
        <p className="consulta-nota">Tarda menos de un minuto. No cierres esta página.</p>
        <ol className="consulta-pasos">
          {PASOS_DIAN.map((texto, i) => (
            <li key={texto} className={i < paso ? "hecho" : i === paso ? "activo" : ""}>
              <span className="consulta-punto">
                {i < paso ? <Check size={13} /> : <Loader2 size={13} className={i === paso ? "gira" : ""} />}
              </span>
              {texto}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (estado === "resultado" && salida) return <ResultadoDian salida={salida} caja={caja} />;

  return (
    <form className="consulta-paso" noValidate onSubmit={consultar} ref={caja}>
      <button className="consulta-volver" type="button" onClick={onVolver}>
        <ArrowLeft size={15} /> Atrás
      </button>
      <h3>Consultar con la DIAN</h3>
      <p className="consulta-nota">
        Miramos lo que ya está reportado a tu nombre y te damos la respuesta con cifras reales,
        no estimadas.
      </p>

      <div className="consulta-campo">
        <label htmlFor={idDoc}>Número de documento</label>
        <input
          id={idDoc}
          inputMode="numeric"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="consulta-campo">
        <label htmlFor={idClave}>Clave del portal de la DIAN</label>
        <input
          id={idClave}
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoComplete="off"
        />
      </div>

      {error ? <p className="consulta-error">{error}</p> : null}

      <button className="consulta-boton consulta-boton-grande" disabled={!puede}>
        Consultar gratis
      </button>
      <p className="consulta-nota consulta-fina">
        Tu clave viaja cifrada y se usa solo para esta consulta. No firmamos ni presentamos nada.
      </p>
    </form>
  );
}

/** El veredicto con las cifras: cuanto reporta la DIAN en cada tope y cual es el limite. */
function ResultadoDian({ salida, caja }) {
  const obligado = salida.resultado === "OBLIGADO";
  const superados = (salida.topes ?? []).filter((t) => t.supera);

  return (
    <div className="consulta-paso consulta-resultado" ref={caja}>
      <p className={obligado ? "consulta-veredicto consulta-si" : "consulta-veredicto"}>
        {obligado ? <Check size={18} /> : null}
        {obligado ? "Sí te toca declarar" : "No te toca declarar"}
      </p>
      <p>
        {obligado
          ? `Según lo que la DIAN ya tiene reportado a tu nombre, superaste ${superados.length === 1 ? "un tope" : `${superados.length} topes`} del año gravable ${salida.anio}.`
          : `Según lo que la DIAN ya tiene reportado a tu nombre, no superaste ninguno de los cinco topes del año gravable ${salida.anio}.`}
      </p>

      {/* LOS CINCO, NO SOLO EL QUE OBLIGA. Ver que tan cerca quedo de los otros es lo que
          convierte un veredicto en algo que la persona puede entender y verificar. */}
      <ul className="consulta-topes">
        {(salida.topes ?? []).map((t) => (
          <li key={t.codigo} className={t.supera ? "supera" : ""}>
            <span>{t.nombre}</span>
            <span className="consulta-cifras">
              <b>{pesos(t.reportado)}</b>
              <small>de {pesos(t.limite)}</small>
            </span>
          </li>
        ))}
      </ul>

      {obligado ? (
        <button className="consulta-boton consulta-boton-grande" type="button" onClick={abrirWhatsApp}>
          <MessageCircle size={17} /> Empezar mi declaración por WhatsApp
        </button>
      ) : (
        <p className="consulta-nota">
          La DIAN puede recibir reportes nuevos durante el año. Si tu situación cambia, vuelve a
          consultar antes de la fecha límite.
        </p>
      )}
    </div>
  );
}

/** El servicio que se cobra. Es el desenlace natural de "no se puede saber". */
function Experto({ onVolver }) {
  return (
    <div className="consulta-paso">
      <button className="consulta-volver" type="button" onClick={onVolver}>
        <ArrowLeft size={15} /> Atrás
      </button>
      <h3>Que un contador revise tu caso</h3>
      <p>
        Por <b>{pesos(VALOR_EXPERTO)}</b> un contador mira tus cifras reales y te dice con certeza
        si te toca declarar y qué hacer. Si no tienes RUT o clave de la DIAN, te ayuda a sacarlos.
      </p>
      <button className="consulta-boton consulta-boton-grande" type="button" onClick={abrirWhatsApp}>
        <MessageCircle size={17} /> Hablar con un contador
      </button>
    </div>
  );
}
