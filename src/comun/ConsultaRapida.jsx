/**
 * La consulta de dos toques: se contesta con lo que la persona SI sabe.
 *
 * ═══ QUE PROBLEMA RESUELVE, MEDIDO ═══
 *
 * El flujo anterior pedia cuatro datos (nombre, correo, WhatsApp y aceptar terminos) ANTES de
 * decirle nada a nadie, y despues hacia cinco preguntas. De 186 personas que lo tuvieron al
 * frente, 11 llenaron el formulario y UNA sola obtuvo su respuesta.
 *
 * Y las preguntas eran peores que el formulario. Tres de los cinco topes son de $69.718.600 y
 * preguntan cuanto te consignaron, cuanto paso por tus tarjetas y cuanto compraste en el año.
 * Nadie sabe eso de memoria. Se vio en los datos: una persona toco "No estoy seguro" en la
 * primera pregunta y salio doce segundos despues; otra contesto "No" cinco veces en un minuto
 * (lo que casi seguro fue adivinar) y le dijimos que no le tocaba declarar.
 *
 * ═══ EL GIRO ═══
 *
 * De los cinco topes solo dos se contestan de memoria: los ingresos (todo el mundo sabe cuanto
 * le pagan al mes) y el patrimonio. Esos dos se preguntan.
 *
 * Los otros tres DEJAN DE SER PREGUNTAS y se vuelven el argumento: "eso no se sabe de memoria,
 * pero la DIAN si lo sabe, porque los bancos y los comercios se lo reportan". Es verdad, y es
 * exactamente lo que hace el producto. La duda honesta pasa a ser la razon para seguir en vez
 * del castigo por no saber.
 *
 * ═══ DONDE SE PIDEN LOS DATOS ═══
 *
 * Ya no de entrada. Solo en el camino de la clave de la DIAN, o sea despues de haber recibido
 * una respuesta y habiendo decidido ir mas a fondo. Quien no tiene clave no llena nada: va
 * derecho a WhatsApp, donde el numero llega verificado y con la conversacion abierta.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, MessageCircle, ShieldCheck } from "lucide-react";

import { BANDAS_INGRESO, TOPES, topeEnPesos } from "../contenido/datos";
import { vencimientoDe } from "../contenido/calendario-renta-2026";
import { abrirWhatsApp } from "../App";
import { registrar } from "./medicion";
import { MENSAJES } from "./mensajes";
import Promo from "./Promo";
import { enDias } from "./Vencimiento";
import { ConsultaDian, Datos, useIrAlComienzo } from "./Consulta";

const PATRIMONIO = TOPES.find((t) => t.id === "patrimonio");
const INGRESOS = TOPES.find((t) => t.id === "ingresos");

export default function ConsultaRapida() {
  const [paso, setPaso] = useState("preguntas");
  // UNA PREGUNTA A LA VEZ. Las dos juntas eran seis botones en el primer pantallazo, y el primer
  // pantallazo es todo lo que hay: la mediana de permanencia del trafico pagado es de 12 segundos
  // y el 85% no toca nada. Seis opciones para elegir no es informacion, es paralisis.
  const [indice, setIndice] = useState(0);
  const [banda, setBanda] = useState(null);
  const [datos, setDatos] = useState({ nombre: "", correo: "", whatsapp: "", acepta: false });
  const [veredicto, setVeredicto] = useState(null);
  const caja = useRef(null);
  // Se mueve entre PASOS, no entre preguntas: la pregunta nueva ocupa el mismo lugar que la
  // anterior, asi que el ojo no tiene que ir a buscarla y mover la pagina seria un estorbo.
  useIrAlComienzo(caja, paso);

  useEffect(() => registrar("consulta_vista", { version: "rapida" }), []);

  const aWhatsApp = (mensaje, motivo) => {
    registrar("consulta_salida", { destino: "whatsapp", motivo });
    abrirWhatsApp(mensaje);
  };

  const cerrar = (resultado, detalle) => {
    setVeredicto(resultado);
    setPaso("veredicto");
    registrar("consulta_veredicto", { via: "rapida", resultado, ...detalle });
  };

  // EL CORTE: con un solo motivo que obligue, la consulta termina. Seguir preguntando no cambia
  // el resultado y hace larga una consulta que podia ser de un toque.
  const responderIngresos = (b) => {
    setBanda(b);
    if (b.veredicto === "si") return cerrar("OBLIGADO", { banda: b.id, preguntas: 1 });
    setIndice(1);
  };

  const responderPatrimonio = (valor) => {
    const detalle = { banda: banda?.id, patrimonio: valor, preguntas: 2 };
    if (valor === "si") return cerrar("OBLIGADO", detalle);
    if (valor === "no-se" || banda?.veredicto === "filo") return cerrar("FILO", detalle);
    return cerrar("FALTAN_TRES", detalle);
  };

  const reiniciar = () => {
    setBanda(null);
    setVeredicto(null);
    setIndice(0);
    setPaso("preguntas");
  };

  return (
    <div className="consulta consulta-rapida" ref={caja}>
      {paso === "preguntas" ? (
        <Pregunta
          indice={indice}
          onIngresos={responderIngresos}
          onPatrimonio={responderPatrimonio}
          onAtras={() => setIndice(0)}
          onYaSe={() => aWhatsApp(MENSAJES.meToca, "ya_sabe_al_entrar")}
        />
      ) : null}

      {paso === "veredicto" ? (
        <Veredicto
          veredicto={veredicto}
          onReiniciar={reiniciar}
          onConClave={() => {
            registrar("consulta_via_elegida", { via: "dian", version: "rapida" });
            setPaso("datos");
          }}
          onSinClave={() => aWhatsApp(MENSAJES.sinClave, "sin_clave_en_el_veredicto")}
          onHazla={() => aWhatsApp(MENSAJES.meToca, "obligado")}
        />
      ) : null}

      {paso === "datos" ? (
        <Datos
          titulo="¿A dónde te mandamos tu resultado?"
          nota="Consultamos con la DIAN y te llega la respuesta con tus cifras reales."
          datos={datos}
          setDatos={setDatos}
          onSeguir={() => {
            registrar("consulta_datos_dejados", { version: "rapida" });
            setPaso("dian");
          }}
        />
      ) : null}

      {paso === "dian" ? (
        <ConsultaDian
          contacto={{ nombre: datos.nombre, correo: datos.correo, whatsapp: datos.whatsapp }}
          onVolver={() => setPaso("veredicto")}
          onSinClave={() => aWhatsApp(MENSAJES.sinClave, "sin_clave_en_el_formulario")}
        />
      ) : null}
    </div>
  );
}

/**
 * Una pregunta, con sus opciones. Solo se contesta con lo que se sabe de memoria.
 *
 * ═══ POR QUE UNA A LA VEZ, Y COMO SE EVITA QUE PASE DESAPERCIBIDA ═══
 *
 * Las dos juntas ponian seis botones en el primer pantallazo. Con una mediana de 12 segundos en
 * pagina, seis opciones no informan: paralizan.
 *
 * El riesgo de partirlas es que la persona conteste y no note que aparecio otra. Se cubre con
 * tres cosas: el contador de arriba anuncia que puede venir una segunda ANTES de contestar; la
 * pregunta nueva ocupa el MISMO lugar que la anterior, asi que el ojo no se mueve; y la tarjeta
 * tiene alto minimo, para que el cambio no sea un brinco.
 *
 * "DE HASTA" Y NO "DE": con un solo motivo que obligue la consulta termina en la primera, y
 * prometer dos cuando puede ser una hace la consulta mas larga de lo que se siente.
 */
function Pregunta({ indice, onIngresos, onPatrimonio, onAtras, onYaSe }) {
  const primera = indice === 0;

  return (
    <div className="consulta-paso">
      {primera ? null : (
        <button className="consulta-volver" type="button" onClick={onAtras}>
          <ArrowLeft size={15} /> Atrás
        </button>
      )}
      <p className="consulta-progreso">Pregunta {indice + 1} de hasta 2</p>

      <h3>
        {primera
          ? "¿Cuánto te pagan al mes, antes de descuentos?"
          : `¿Tus bienes suman más de ${topeEnPesos(PATRIMONIO)}?`}
      </h3>
      <p className="consulta-nota">
        {primera
          ? "Cuenta sueldo, honorarios, arriendos y todo lo que recibas."
          : "Vivienda, carro, ahorros e inversiones. Sin restar deudas."}
      </p>

      <div className="rapida-opciones">
        {primera
          ? BANDAS_INGRESO.map((b) => (
              <button key={b.id} type="button" className="rapida-opcion" onClick={() => onIngresos(b)}>
                {b.etiqueta}
              </button>
            ))
          : [
              ["si", "Sí"],
              ["no", "No"],
              /* "NO ESTOY SEGURO" LLEVA ADELANTE, no a un callejon. El tope se mide SIN restar
                 deudas, asi que un apartamento hipotecado cuenta completo: dudar es la respuesta
                 correcta para mucha gente. Cuando no llevaba a ningun lado, quien la daba se iba. */
              ["no-se", "No estoy seguro"],
            ].map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                className={valor === "no-se" ? "rapida-opcion rapida-opcion-duda" : "rapida-opcion"}
                onClick={() => onPatrimonio(valor)}
              >
                {texto}
              </button>
            ))}
      </div>

      {/* El comprador decidido que cae en la pagina de la pregunta necesita su atajo: hacerle
          contestar un cuestionario para poder comprar es cobrarle peaje. Solo en la primera,
          porque quien ya contesto algo esta en la consulta, no comparando. */}
      {primera ? (
        <button type="button" className="rapida-atajo" onClick={onYaSe}>
          <span>¿Ya sabes que te toca declarar?</span>
          <b>Empieza por WhatsApp <ArrowRight size={14} /></b>
        </button>
      ) : null}
    </div>
  );
}

/**
 * El veredicto, y la bifurcacion que decide el precio.
 *
 * ═══ EL TITULO TIENE QUE CARGAR TODO EL MENSAJE ═══
 *
 * La gente no lee, ojea titulos y decide con eso. La primera version decia "Por ingresos y
 * bienes, no", y quien leyera solo eso concluia QUE NO LE TOCA DECLARAR y se iba. Es falso:
 * le faltan tres de los cinco topes. El titulo estaba llevando al que no lee a la conclusion
 * contraria a la verdad, que ademas es la que nos deja sin cliente.
 *
 * "Puede que sí te toque" funciona leido solo. Dice que la respuesta esta abierta (que es lo
 * cierto), que hay algo que hacer, y no promete nada que no podamos sostener.
 *
 * Los dos casos que no son OBLIGADO terminan en el mismo lugar (hace falta mirar la DIAN) asi
 * que comparten titulo y solo cambia la linea que lo explica.
 */
function Veredicto({ veredicto, onReiniciar, onConClave, onSinClave, onHazla }) {
  const obligado = veredicto === "OBLIGADO";

  return (
    <div className="consulta-paso consulta-resultado">
      {obligado ? (
        <ObligadoPorLosDos onHazla={onHazla} />
      ) : (
        <>
          <p className="consulta-veredicto consulta-quiza">Puede que sí te toque</p>
          <p className="rapida-porque">
            {veredicto === "FILO"
              ? "Tu sueldo queda justo en el límite. Y aparte faltan tres motivos más."
              : "Por sueldo y bienes no llegas. Pero esos son dos de los cinco motivos."}
          </p>

          {/* ═══ LAS TRES QUE NO SE PREGUNTAN ═══

              Antes iban como tres frases largas con su cifra repetida debajo de cada una: seis
              renglones de texto que el que ojea no lee. La cifra es la MISMA en las tres, asi
              que se dice una sola vez al final. Quedan tres lineas de tres palabras. */}
          <div className="rapida-faltan">
            <b><ShieldCheck size={15} aria-hidden="true" /> Lo que la DIAN ya sabe de ti</b>
            <ul>
              <li>Cuánto te consignaron</li>
              <li>Cuánto pasó por tus tarjetas</li>
              <li>Cuánto compraste en el año</li>
            </ul>
            <p>Con que una pase de {topeEnPesos(INGRESOS)}, te toca declarar.</p>
          </div>

          {/* ═══ UNA PREGUNTA CON DOS RESPUESTAS, no dos botones sueltos ═══

              Antes decia "Averígualo gratis" y "No sé mi clave de la DIAN". Quien ojea leia el
              primero y no sabia si le aplicaba, porque el titulo no nombraba la condicion: hay
              que llegar al renglon chico para enterarse de que hace falta la clave.

              Preguntando primero, la persona se auto-clasifica con un dato que sabe al
              instante, y las dos respuestas dicen que pasa en cada caso. Ademas es la misma
              forma que el resto del flujo (pregunta arriba, opciones abajo), asi que no hay
              que aprender una interaccion nueva a esta altura.

              LAS DOS PESAN IGUAL. Pintar una de verde y la otra de blanco haria ver la de pago
              como el plan B, y para quien no tiene clave NO hay plan A: el camino gratis le
              exige algo que no tiene. */}
          <div className="rapida-bifurcacion">
            <p className="rapida-pregunta">¿Tienes cuenta en el portal de la DIAN?</p>
            <button type="button" className="rapida-salida" onClick={onConClave}>
              <b>Sí, tengo mi clave</b>
              <span>Averígualo gratis acá, en 30 segundos <ArrowRight size={14} /></span>
            </button>
            {/* El precio NO va aca, va en la conversacion: en una pantalla fria invita a
                comparar antes de que nadie haya explicado que incluye el tramite. */}
            <button type="button" className="rapida-salida" onClick={onSinClave}>
              <b>No tengo, o no la recuerdo</b>
              <span>Te la creamos nosotros y lo averiguamos <ArrowRight size={14} /></span>
            </button>
          </div>
        </>
      )}

      <button type="button" className="consulta-volver rapida-volver" onClick={onReiniciar}>
        Volver a empezar
      </button>
    </div>
  );
}

/** Obligado por lo que ya contesto: no hace falta consultar nada para decirselo. */
function ObligadoPorLosDos({ onHazla }) {
  const [cedula, setCedula] = useState("");
  const digitos = cedula.replace(/\D/g, "");
  // `vencimientoDe` resuelve la fila del calendario con los dos ultimos digitos. Dos digitos no
  // identifican a nadie, se contestan sin pensar, y devuelven algo cierto y personal: es
  // urgencia real, a diferencia de un reloj de descuento.
  const fila = digitos.length >= 2 ? vencimientoDe(digitos) : null;

  return (
    <>
      <p className="consulta-veredicto consulta-si">
        <Check size={18} /> Sí te toca declarar
      </p>
      <p>Con lo que me dices ya pasas uno de los topes, así que este año estás obligado.</p>

      <div className="rapida-fecha">
        <label htmlFor="rapida-cedula">
          <CalendarDays size={15} aria-hidden="true" /> ¿Los dos últimos dígitos de tu cédula?
        </label>
        <input
          id="rapida-cedula"
          inputMode="numeric"
          maxLength={2}
          placeholder="00"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
        />
        {fila ? (
          <p className="rapida-vence">
            Tu plazo vence el <b>{fila[3]}</b>. <b>{enDias(fila[2])}</b>
          </p>
        ) : (
          <p className="rapida-ayuda">Con eso te decimos tu fecha límite exacta.</p>
        )}
      </div>

      <Promo />
      <button type="button" className="consulta-boton consulta-boton-grande" onClick={onHazla}>
        <MessageCircle size={17} /> Que Clara la haga por mí
      </button>
    </>
  );
}
