import { AlertTriangle, Check, X } from "lucide-react";

import Pagina, { Relacionadas } from "./Pagina";
import { otras, pesos, PUBLICADO, UVT_2025 } from "./datos";

/**
 * Como declarar renta paso a paso.
 *
 * QUE TIENE QUE NO TIENEN LOS DEMAS: para esta consulta la primera pagina la ocupan la DIAN misma
 * (tres resultados), Muisca, un video de YouTube, Tributi y TaxDown, que es espanola y explica la
 * Agencia Tributaria. Contra la DIAN no se compite explicando el portal mejor que ella.
 *
 * Donde si hay espacio es en lo que la DIAN no puede escribir: QUE SALE MAL en cada paso. Las
 * recomendaciones tecnologicas de la propia DIAN de junio de 2026 dan pistas (limpiar cache, una
 * sola sesion, sesion de 60 minutos, descargar exogena ANTES que factura electronica), y el resto
 * sale de haber cruzado declaraciones reales: la exogena que se suma dos veces, el borrador que
 * parece liquidado, el promedio de cesantias que no aparece.
 */

const RUTA = "/como-declarar-renta-paso-a-paso";

const SECCIONES = [
  ["antes", "Antes de entrar al portal"],
  ["pasos", "Los siete pasos"],
  ["errores", "Lo que sale mal en cada paso"],
  ["borrador", "El borrador de la DIAN"],
  ["pagar", "Cómo se paga"],
  ["despues", "Después de presentar"],
  ["preguntas", "Preguntas frecuentes"],
];

const PASOS = [
  ["Reúne lo que no está en la DIAN",
   "El portal ya tiene tus ingresos reportados y tus retenciones. Lo que no tiene son los soportes de tus beneficios ni los ingresos que nadie reportó, y eso es justamente lo que cambia el resultado.",
   ["Certificado de ingresos y retenciones de cada empleador",
    "Certificado de cesantías, con el promedio salarial de los últimos seis meses",
    "Certificados de bancos, prepagada y crédito de vivienda",
    "Registro civil de los dependientes"]],
  ["Entra al portal con tu clave",
   "Necesitas el RUT y la clave del portal transaccional. Si no tienes firma electrónica activa, generarla es parte del proceso y conviene hacerlo antes, no el día del vencimiento.",
   ["La sesión dura 60 minutos, así que ten los papeles a mano antes de entrar",
    "Mantén una sola sesión abierta en un solo navegador"]],
  ["Descarga la información exógena",
   "Es el reporte de lo que terceros informaron a tu nombre. La DIAN recomienda descargarla ANTES del reporte de facturas electrónicas, en ese orden, porque hacerlo al revés genera errores.",
   ["Descárgala completa, no la leas en pantalla",
    "Fíjate en la columna de uso sugerido: es la que dice a qué casilla va cada fila"]],
  ["Cruza la exógena con tus papeles",
   "Acá se decide casi todo el resultado. La exógena trae filas repetidas del mismo pago, porque cada una responde a un concepto distinto, y sumarlas todas infla la base.",
   ["Compara cada ingreso reportado contra tu certificado",
    "Revisa que los aportes obligatorios aparezcan y estén completos",
    "Agrega los ingresos que nadie reportó, como un arriendo en efectivo"]],
  ["Diligencia el formulario 210",
   "Cada valor tiene su casilla. Los beneficios van sujetos al límite del 40% del artículo 336, así que aplicarlos en desorden puede dejar por fuera justo el que más valía.",
   ["Calcula primero cuánto cupo te queda libre",
    "Aplica primero lo que no consume cupo"]],
  ["Revisa antes de firmar",
   "El formulario liquidado es una afirmación tuya sobre tus propios números. Vale la pena revisar de dónde salió cada cifra grande antes de poner la firma.",
   ["Verifica el total de ingresos contra la suma de tus certificados",
    "Confirma que cada beneficio tiene su soporte guardado"]],
  ["Firma, presenta y paga",
   "La firma electrónica es lo que convierte el borrador en declaración presentada. Si te queda saldo a pagar, el plazo para pagar es el mismo de la declaración, no uno posterior.",
   ["Guarda el acuse con el número de formulario",
    "Si te queda saldo a favor, tienes que solicitarlo, no llega solo"]],
];

const FALLOS = [
  ["Sumar toda la exógena como si fuera ingreso",
   "Un mismo pago aparece en varias filas, porque una informa el ingreso, otra la retención, otra el aporte y otra el promedio salarial. En un caso real que revisamos, sumar todo agregaba once millones de pesos de ingresos que no existían, y con eso el impuesto subía sin razón."],
  ["Presentar el borrador de la DIAN tal cual",
   "El borrador refleja lo que otros reportaron. No conoce tus dependientes, ni tu prepagada, ni el crédito de vivienda, porque nadie se los reporta. Aceptarlo sin tocar casi siempre significa pagar más de lo que toca."],
  ["Dejar las cesantías sin su promedio salarial",
   "La parte exenta de las cesantías depende de tu ingreso mensual promedio de los últimos seis meses. Sin ese dato no se puede calcular el porcentaje exento, y lo que suele pasar es que se declara como gravada una parte que no lo era."],
  ["Confundir el NIT con el NIT más el dígito de verificación",
   "La fecha de vencimiento depende de los dos últimos dígitos sin el dígito de verificación. Usar el dígito de más corre la fecha varias semanas, y en la dirección equivocada."],
  ["Dejar la firma electrónica para el último día",
   "Generar o recuperar la firma toma su tiempo y depende de que el portal responda. El día del vencimiento es cuando más carga tiene."],
  ["Olvidar el anticipo del año siguiente",
   "El formulario liquida un anticipo del impuesto del año siguiente. Es una casilla que sorprende a quien esperaba pagar solo lo del año declarado."],
];

const PREGUNTAS = [
  ["¿Qué se necesita para hacer la declaración de renta por internet?",
   "El RUT, la clave del portal transaccional de la DIAN y la firma electrónica activa. Además, los certificados de ingresos y retenciones de tus empleadores, los certificados de bancos y de cesantías, y los soportes de los beneficios que vayas a pedir."],
  ["¿Cómo hago la declaración en la página de la DIAN?",
   "Entras al portal transaccional con tu clave, descargas la información exógena y luego el reporte de facturas electrónicas, la comparas con tus certificados, diligencias el formulario 210, revisas cada casilla y firmas con la firma electrónica. Si te queda saldo a pagar, pagas dentro del mismo plazo."],
  ["¿Puedo declarar desde el celular?",
   "El portal de la DIAN funciona en el navegador del teléfono, pero descargar y cruzar la exógena en una pantalla pequeña es incómodo y es donde más errores se cometen. Con Clara la parte de contestar sí es por WhatsApp, y el cruce lo hacemos nosotros."],
  ["¿La declaración sugerida de la DIAN ya está lista para presentar?",
   "No. Es una ayuda construida con lo que terceros reportaron y no incluye tus beneficios, porque nadie los reporta. Quien firma responde por lo que presenta, así que conviene revisarla casilla por casilla."],
  ["¿Cuánto tarda hacer la declaración?",
   "Reunir los papeles suele ser lo más largo. El diligenciamiento en sí toma menos de una hora si la información ya está cruzada, y hay que tener en cuenta que la sesión del portal se cierra a los 60 minutos."],
  ["¿Qué pasa si me equivoco después de presentar?",
   "Se puede corregir. Si la corrección aumenta el impuesto, hay sanción por corrección; si lo disminuye, hay un procedimiento distinto. En ambos casos es mejor corregir por cuenta propia que esperar a que la DIAN lo note."],
];

export default function PasoAPaso() {
  return (
    <Pagina
      titulo="Cómo declarar renta paso a paso en 2026 | Clara"
      descripcion="Los siete pasos para declarar renta por internet en el portal de la DIAN, y lo que suele salir mal en cada uno. Con lo que hay que tener listo antes de entrar."
      ruta={RUTA}
      imagen="/clara-og-paso-a-paso.jpg"
      migaja="Cómo declarar paso a paso"
      publicado={PUBLICADO}
      secciones={SECCIONES}
      preguntas={PREGUNTAS}
      h1="Cómo declarar renta paso a paso en 2026, y lo que sale mal en cada paso"
      bajada="La DIAN explica muy bien cómo usar su portal. Lo que no puede explicar es en qué parte del proceso se pierde plata, y casi siempre es la misma."
    >
      <aside className="post-resumen">
        <h2>La respuesta corta</h2>
        <ul>
          <li>
            <b>Son siete pasos</b>, y el que decide el resultado es el cuarto, cruzar la información
            exógena con tus propios papeles.
          </li>
          <li>
            <b>Descarga primero la exógena</b> y después el reporte de facturas electrónicas. La DIAN
            recomienda ese orden expresamente.
          </li>
          <li>
            <b>La sesión del portal dura 60 minutos</b>, así que ten los certificados listos antes de
            entrar.
          </li>
          <li>
            <b>El borrador de la DIAN no está liquidado.</b> No conoce tus dependientes ni tu
            prepagada, porque nadie los reporta.
          </li>
        </ul>
      </aside>

      <section id="antes" className="post-seccion">
        <h2>Antes de entrar al portal</h2>
        <p>
          La mayor parte del tiempo se va en buscar papeles, no en llenar el formulario. Y como la
          sesión del portal se cierra a los 60 minutos, entrar sin los documentos suele terminar en
          empezar de nuevo.
        </p>
        <div className="post-dos-columnas">
          <div>
            <h3>
              <Check size={17} aria-hidden="true" /> Lo que la DIAN ya tiene
            </h3>
            <ul>
              <li>Tus ingresos reportados por empleadores y clientes</li>
              <li>Las retenciones que te practicaron</li>
              <li>Saldos y rendimientos de tus cuentas</li>
              <li>Tus compras con factura electrónica</li>
            </ul>
          </div>
          <div>
            <h3>
              <X size={17} aria-hidden="true" /> Lo que tienes que aportar tú
            </h3>
            <ul>
              <li>El promedio salarial para calcular las cesantías exentas</li>
              <li>Los soportes de dependientes, prepagada y vivienda</li>
              <li>Los ingresos que nadie reportó, como un arriendo en efectivo</li>
              <li>El valor patrimonial de inmuebles y vehículos</li>
            </ul>
          </div>
        </div>
        <p className="post-nota">
          <AlertTriangle size={16} aria-hidden="true" />
          Todo lo de la derecha es justamente lo que baja el impuesto o lo que evita un requerimiento.
          Por eso el borrador que la DIAN construye sola casi nunca es el resultado correcto.
        </p>
      </section>

      <section id="pasos" className="post-seccion">
        <h2>Los siete pasos</h2>
        <ol className="post-pasos post-pasos-largos">
          {PASOS.map(([titulo, cuerpo, puntos], i) => (
            <li key={titulo}>
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{titulo}</h3>
                <p>{cuerpo}</p>
                <ul>
                  {puntos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="errores" className="post-seccion">
        <h2>Lo que sale mal, y cuánto cuesta</h2>
        <p>
          Estos son los fallos que aparecen una y otra vez al revisar declaraciones reales. Ninguno es
          exótico y todos se pueden evitar sabiendo que existen.
        </p>
        <ol className="post-errores">
          {FALLOS.map(([titulo, cuerpo]) => (
            <li key={titulo}>
              <h3>{titulo}</h3>
              <p>{cuerpo}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="borrador" className="post-seccion">
        <h2>El borrador de la DIAN, en su justa medida</h2>
        <p>
          La declaración sugerida es una ayuda de verdad y conviene usarla, pero hay que entender qué
          es. La DIAN la construye con lo que <b>terceros</b> le reportaron sobre ti. Eso significa que
          los ingresos y las retenciones suelen estar bien, porque los reportó quien te pagó.
        </p>
        <p>
          Lo que no puede tener son tus beneficios, porque nadie tiene la obligación de reportarlos.
          Ni el registro civil de tus hijos, ni cuánto pagaste de prepagada, ni el promedio de tus
          últimos seis meses para las cesantías. Presentarla sin tocar equivale a renunciar a todo eso.
        </p>
        <p>
          Y hay una cosa que conviene tener clara: la responsabilidad de lo que se presenta es de quien
          firma. Que el borrador viniera de la DIAN no cambia eso, y la DIAN tiene tres años para
          revisarlo.
        </p>
      </section>

      <section id="pagar" className="post-seccion">
        <h2>Cómo se paga</h2>
        <p>
          Si te queda saldo a pagar, el plazo para pagar es <b>el mismo</b> de la declaración. No son
          dos fechas distintas, y esa confusión es una de las formas más comunes de acabar con
          intereses de mora sobre una declaración presentada a tiempo.
        </p>
        <p>
          El pago se hace con el recibo oficial que genera el portal, por los canales del banco o en
          línea. Si el saldo a pagar es alto, se puede pedir un acuerdo de pago, pero eso no suspende
          los intereses.
        </p>
        <p>
          Y si te queda saldo a favor, no llega solo. Hay que solicitar la devolución o dejarlo para
          imputarlo al año siguiente. Mucha gente declara, ve el saldo a favor y no hace nada más.
        </p>
      </section>

      <section id="despues" className="post-seccion">
        <h2>Después de presentar</h2>
        <p>
          Guarda el acuse con el número de formulario y, sobre todo,{" "}
          <b>guarda los soportes</b>. La declaración queda en firme a los tres años del vencimiento, y
          durante ese tiempo la DIAN puede pedir que pruebes cualquier beneficio que aplicaste.
        </p>
        <p>
          Si después de presentar te das cuenta de un error, se puede corregir. Cuando la corrección
          aumenta el impuesto hay una sanción por corrección, que es bastante menor que la sanción por
          no declarar o por presentar tarde. Corregir por cuenta propia siempre sale mejor que esperar a
          que la DIAN lo note.
        </p>
        <p>
          Vale recordar el orden de magnitud: la sanción mínima en 2026 es {pesos(10 * 52_374)}, y la
          sanción por no declarar del artículo 643 es el 20% de tus consignaciones bancarias. Están
          explicadas en detalle en la página de sanciones.
        </p>
      </section>

      <section id="preguntas" className="post-seccion">
        <h2>Preguntas frecuentes</h2>
        <div className="post-faq">
          {PREGUNTAS.map(([pregunta, respuesta]) => (
            <details key={pregunta}>
              <summary>
                <h3>{pregunta}</h3>
              </summary>
              <p>{respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      <Relacionadas items={otras(RUTA)} />

      <aside className="post-cierre">
        <h2>O te lo hacemos nosotros por $50.000</h2>
        <p>
          Clara consulta tu información en la DIAN, hace el cruce que es donde se pierde la plata, y
          deja el formulario 210 listo para que lo revises y lo firmes. Todo por WhatsApp, sin portales
          ni contraseñas nuevas.
        </p>
        <a className="button" href="/">
          Averigua gratis si debes declarar
        </a>
      </aside>

      <section className="post-fuentes" aria-label="Fuentes">
        <h2>Fuentes</h2>
        <ul>
          <li>
            DIAN:{" "}
            <a href="https://micrositios.dian.gov.co/renta-personas-naturales-ag-2025/" rel="noopener">
              micrositio de renta personas naturales
            </a>
            ,{" "}
            <a href="https://www.dian.gov.co/tramitesservicios/Paginas/declaracionsugerida.aspx" rel="noopener">
              declaración sugerida
            </a>{" "}
            y{" "}
            <a href="https://muisca.dian.gov.co/WebDilIngresoFormRenta210/" rel="noopener">
              formulario 210
            </a>
            .
          </li>
          <li>
            Recomendaciones tecnológicas de la DIAN de junio de 2026, de donde salen el orden de
            descarga y la duración de 60 minutos de la sesión.
          </li>
          <li>
            Estatuto Tributario:{" "}
            <a href="https://estatuto.co/336" rel="noopener">art. 336</a> (el límite de las
            deducciones),{" "}
            <a href="https://estatuto.co/206" rel="noopener">art. 206</a> (cesantías y rentas
            exentas) y{" "}
            <a href="https://estatuto.co/714" rel="noopener">art. 714</a> (los tres años de firmeza).
          </li>
          <li>UVT de {pesos(UVT_2025)} para el año gravable 2025.</li>
        </ul>
      </section>
    </Pagina>
  );
}
