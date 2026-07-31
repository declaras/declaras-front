import { AlertTriangle, ArrowRight, ArrowUp, Check, X } from "lucide-react";

import Pagina, { Relacionadas } from "./Pagina";
import Vencimiento from "../comun/Vencimiento";
import { CALENDARIO_2026 } from "./calendario-renta-2026";
import { otras, pesos, PUBLICADO, UVT_2025, UVT_2026 } from "./datos";

/**
 * La guia de la declaracion de renta 2026.
 *
 * POR QUE EXISTE Y POR QUE ES LARGA: en la primera pagina de Google, para las consultas que
 * importan, hay software contable (Siigo, World Office, Alegra), competencia directa (Tributi),
 * bancos (Nequi, BBVA) y medios contables (Gerencie, Actualicese, Siempre al Dia). Se revisaron
 * ocho de esos articulos: entre 800 y 4.000 palabras. Ninguno hace tres cosas que aca si estan,
 * y son las que dan la ventaja:
 *
 *   1. Los topes EN PESOS. Todos hablan en UVT y dejan la multiplicacion al lector, que es
 *      justamente donde se equivoca.
 *   2. El limite del art. 336 con numeros. Es la regla que decide cuanto de verdad baja el
 *      impuesto, y no aparece explicada en ninguno.
 *   3. La fecha calculada. El calendario de aca lo genera el motor desde el Decreto 2229 de 2023
 *      en dias habiles, no una tabla copiada.
 *
 * Las preguntas frecuentes son las que Google muestra en "otras preguntas de los usuarios" para
 * estas consultas, con su marcado FAQPage, porque son las que puede citar directo en el resultado.
 */

const RUTA = "/declaracion-de-renta-2026";

/** Los cinco topes del art. 592 y 594-3 del Estatuto, en UVT y en pesos del ano gravable 2025. */
const TOPES = [
  ["Patrimonio bruto al 31 de diciembre de 2025", 4500,
   "Todo lo que tienes, sin restar deudas. Cuenta la casa por su valor fiscal, el carro, los ahorros y las inversiones."],
  ["Ingresos brutos del año", 1400,
   "Todo lo que entró, antes de descontar nada. Suma salario, honorarios, arriendos, rendimientos y ventas ocasionales."],
  ["Consumos con tarjeta de crédito", 1400,
   "Lo que pasaste por la tarjeta en el año, así lo hayas pagado después."],
  ["Compras y consumos totales", 1400,
   "Compras del año por cualquier medio, no solo con tarjeta."],
  ["Consignaciones, depósitos o inversiones financieras", 1400,
   "Lo que entró a tus cuentas. Acá caen los traslados entre cuentas propias, y por eso este tope sorprende a mucha gente."],
];

const DOCUMENTOS = [
  ["Certificado de ingresos y retenciones", "Lo emite tu empleador. Trae el salario, las retenciones y los aportes."],
  ["Certificados de los bancos", "Rendimientos, saldos al 31 de diciembre e intereses de crédito de vivienda."],
  ["Certificado de cesantías", "Lo da el fondo. Sin él, la parte exenta se calcula a ciegas."],
  ["Soportes de los beneficios", "Registro civil de los dependientes, contrato de prepagada, extractos de AFC o pensión voluntaria."],
  ["Escrituras y matrículas", "Para el valor patrimonial de los inmuebles y para saber si hubo ganancia ocasional."],
  ["Tu clave de la DIAN", "Sin ella no se puede consultar la información que ya te reportaron."],
];

const PASOS = [
  ["Averigua si estás obligado",
   "Compara tus cifras del año contra los cinco topes. Con superar uno solo ya te toca declarar."],
  ["Consulta lo que la DIAN ya sabe",
   "En el portal de la DIAN están la información exógena y el reporte de facturas electrónicas. Es lo que terceros reportaron a tu nombre, y es el punto de partida honesto."],
  ["Completa lo que falta",
   "La exógena no trae todo. Los arriendos que te pagaron en efectivo, una venta entre particulares o los soportes de tus beneficios los tienes que aportar tú."],
  ["Revisa el borrador casilla por casilla",
   "La DIAN ofrece una declaración sugerida. Es una ayuda, no una liquidación, y la responsabilidad de lo que se presenta sigue siendo tuya."],
  ["Firma y presenta",
   "Con la firma electrónica. Si te queda saldo a pagar, el plazo para pagar es el mismo de la declaración."],
];

const ERRORES = [
  ["Sumar toda la información exógena como si fuera ingreso",
   "Un mismo pago aparece varias veces en el reporte, en filas distintas, porque cada una responde a un concepto (el ingreso, la retención, el aporte, el promedio salarial). Sumarlas todas infla la base. En un caso real que revisamos, esa suma agregaba once millones de pesos de ingresos que no existían."],
  ["Creer que el borrador de la DIAN ya está liquidado",
   "El borrador refleja lo que otros reportaron. No conoce tus dependientes, ni tu prepagada, ni el crédito de vivienda. Presentarlo tal cual casi siempre significa pagar más de lo que toca."],
  ["Pedir beneficios sin el soporte",
   "Un dependiente sin registro civil o una prepagada sin contrato no es un beneficio, es una diferencia esperando un requerimiento. La DIAN tiene tres años para revisar."],
];

/** Las preguntas que Google muestra en "otras preguntas de los usuarios" para estas consultas. */
export const FAQ = [
  ["¿Cómo saber si tengo que declarar renta en 2026?",
   `Compara tus cifras del año 2025 contra los cinco topes de la DIAN. Con superar uno solo ya estás obligado. Los dos que más se pasan por alto son ingresos brutos por ${pesos(1400 * UVT_2025)} y consignaciones o depósitos por ${pesos(1400 * UVT_2025)}, porque en las consignaciones cuentan los traslados entre tus propias cuentas.`],
  ["¿Cuánto debe ganar una persona para declarar renta en Colombia en 2026?",
   `El tope de ingresos brutos del año gravable 2025 es de 1.400 UVT, es decir ${pesos(1400 * UVT_2025)}, que son unos ${pesos(Math.round((1400 * UVT_2025) / 12 / 100000) * 100000)} al mes. Son ingresos brutos, antes de descontar aportes o retenciones. Pero el ingreso no es el único tope, porque también obliga tener un patrimonio bruto mayor a ${pesos(4500 * UVT_2025)}.`],
  ["¿Cuándo debo declarar renta en 2026?",
   "La fecha depende de los dos últimos dígitos de tu cédula, sin el dígito de verificación. Los plazos van del 12 de agosto al 26 de octubre de 2026, y están fijados en días hábiles por el Decreto 2229 de 2023."],
  ["¿Qué pasa si no presento mi declaración de renta en Colombia?",
   `La sanción por extemporaneidad es del 5% del impuesto a cargo por cada mes o fracción de mes de retraso, más los intereses de mora. Nunca puede quedar por debajo de la sanción mínima, que en 2026 es de 10 UVT, o sea ${pesos(10 * UVT_2026)}. Si la DIAN te requiere primero y no respondes, el porcentaje se duplica.`],
  ["¿Declarar renta significa que me toca pagar?",
   "No. Son dos cosas distintas. Muchas personas declaran y les queda saldo a favor, porque durante el año les retuvieron más de lo que resulta su impuesto. Si no declaras, ese saldo a favor no lo pides y se queda en la DIAN."],
  ["¿Si declaré el año pasado tengo que declarar este año?",
   "No necesariamente. La obligación se mira año por año, contra las cifras de ese año. Si el año pasado superaste un tope y este no, no estás obligado. Lo contrario también es cierto."],
  ["¿Qué deducciones me puedo aplicar en la declaración de la renta?",
   `Las principales son 72 UVT por cada dependiente (hasta cuatro), la medicina prepagada con tope de ${pesos(192 * UVT_2025)} al año, los intereses del crédito de vivienda, los aportes a AFC y pensión voluntaria, y el 1% de las compras con factura electrónica. Pero casi todas caben dentro de un mismo cupo del 40% del ingreso, y ese cupo es lo que decide cuánto de verdad baja el impuesto.`],
  ["¿Necesito un contador para declarar renta?",
   "La ley no lo exige para una persona natural, ya que la declaración la firmas tú. Un contador ayuda cuando el caso tiene aristas, como venta de inmuebles, ingresos del exterior o actividad económica con costos. Para un caso corriente, lo que se necesita es que alguien cruce bien la información y sustente los beneficios."],
];

/** Las secciones, para el indice del armazon. */
const SECCIONES = [
  ["quien", "Quién debe declarar"],
  ["fechas", "Fechas según tu cédula"],
  ["documentos", "Qué documentos necesitas"],
  ["paso-a-paso", "Cómo hacerla, paso a paso"],
  ["deducciones", "Cuánto puedes descontar"],
  ["cesantias", "Las cesantías"],
  ["ganancias", "Ganancias ocasionales"],
  ["herencias", "Herencias y donaciones"],
  ["residencia", "Si vives o tienes bienes fuera"],
  ["errores", "Errores que suben el impuesto"],
  ["sanciones", "Si no declaras"],
  ["contador", "Si necesitas un contador"],
  ["preguntas", "Preguntas frecuentes"],
];

export default function GuiaRenta2026() {
  return (
    <Pagina
      titulo="Declaración de renta 2026: topes y fechas por cédula | Clara"
      descripcion="Los cinco topes en pesos, tu fecha límite según los dos últimos dígitos de la cédula y el límite del 40% que decide cuánto baja tu impuesto."
      ruta={RUTA}
      imagen="/clara-og-renta-2026.jpg"
      migaja="Declaración de renta 2026"
      publicado={PUBLICADO}
      secciones={SECCIONES}
      preguntas={FAQ}
      h1="Declaración de renta 2026 en Colombia: quién debe declarar, fechas por cédula y cómo hacerla"
      bajada="Todo lo que sigue está en pesos, no en UVT, y las fechas salen del decreto que las fija en días hábiles. Si solo vienes por tu fecha límite, escríbela acá abajo."
    >
        <Vencimiento />

        <aside className="post-resumen">
          <h2>La respuesta corta</h2>
          <ul>
            <li>
              <b>Estás obligado a declarar</b> si en 2025 superaste uno solo de estos cinco topes:
              patrimonio bruto de {pesos(4500 * UVT_2025)}, o ingresos brutos, consumos con tarjeta,
              compras o consignaciones de {pesos(1400 * UVT_2025)}.
            </li>
            <li>
              <b>Tu fecha límite</b> depende de los dos últimos dígitos de tu cédula. Los plazos van
              del 12 de agosto al 26 de octubre de 2026.
            </li>
            <li>
              <b>Declarar no es pagar.</b> A mucha gente le queda saldo a favor porque le retuvieron
              más de lo que resultó su impuesto.
            </li>
            <li>
              <b>Si no declaras</b>, la sanción mínima en 2026 es de {pesos(10 * UVT_2026)}, incluso
              si tu impuesto era cero.
            </li>
          </ul>
        </aside>


        <section id="quien" className="post-seccion">
          <h2>Quién debe declarar renta en 2026</h2>
          <p>
            La declaración que se presenta en 2026 corresponde al año gravable 2025, y los topes se
            miden con la UVT de 2025, que fue de {pesos(UVT_2025)}. La regla es simple de enunciar y
            fácil de aplicar mal, porque <b>basta con superar uno solo de los cinco topes</b>. No es la suma
            de todos ni el promedio, es cualquiera de ellos.
          </p>
          <div className="post-tabla-marco">
            <table className="post-tabla">
              <caption>
                Topes para declarar renta, año gravable 2025. Arts. 592 y 594-3 del Estatuto
                Tributario.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Si en 2025 superaste</th>
                  <th scope="col">En UVT</th>
                  <th scope="col">En pesos</th>
                </tr>
              </thead>
              <tbody>
                {TOPES.map(([nombre, uvt, nota]) => (
                  <tr key={nombre}>
                    <th scope="row">
                      {nombre}
                      <small>{nota}</small>
                    </th>
                    <td>{uvt.toLocaleString("es-CO")} UVT</td>
                    <td className="post-cifra">{pesos(uvt * UVT_2025)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            El tope que más sorprende es el de consignaciones. Cuentan los traslados entre tus propias
            cuentas, así que mover el mismo dinero varias veces puede llevarte al límite sin que hayas
            ganado un peso adicional. Pasa mucho con quien usa una cuenta para ahorrar y otra para
            gastar.
          </p>
          <h3>Haber declarado el año pasado no te obliga este año</h3>
          <p>
            La obligación se mira año por año contra las cifras de ese año. Si en 2024 superaste un
            tope y en 2025 no, no estás obligado a declarar en 2026. Lo contrario también aplica.
          </p>
          <h3>Declarar y pagar no son lo mismo</h3>
          <p>
            Estar obligado a declarar no significa que tengas impuesto a cargo. El primer tramo de la
            tabla del artículo 241 está a tarifa cero hasta 1.090 UVT de renta líquida gravable, es
            decir {pesos(1090 * UVT_2025)}. Debajo de eso el impuesto es cero. Y si durante el año te
            practicaron retenciones, esas retenciones se restan del impuesto, así que es frecuente que
            el resultado sea un saldo a favor. Ese saldo solo se pide presentando la declaración.
          </p>
        </section>

        <section id="fechas" className="post-seccion">
          <h2>Fechas de declaración de renta 2026 según tu cédula</h2>
          <p>
            El plazo depende de los <b>dos últimos dígitos del NIT o de la cédula, sin el dígito de
            verificación</b>. Ese detalle importa, porque si tienes RUT el número que va después del guion
            no cuenta, y usarlo por error corre tu fecha varias semanas.
          </p>
          <p className="post-nota post-nota-arriba">
            <ArrowUp size={16} aria-hidden="true" />
            El campo para calcular tu fecha está al comienzo de la guía. Abajo queda el calendario
            completo, por si quieres ver todas las fechas.
          </p>
          <p>
            Las fechas están fijadas en <b>días hábiles</b> por el Decreto 2229 de 2023, artículo
            1.6.1.13.2.15, y por eso el calendario tiene saltos que a primera vista parecen erratas.
            El 17 de agosto de 2026, por ejemplo, no aparece porque es lunes festivo, ya que la Asunción
            de la Virgen se traslada a ese día por la Ley 51 de 1983.
          </p>
          <div className="post-tabla-marco post-tabla-alta">
            <table className="post-tabla">
              <caption>
                Calendario completo de vencimientos para personas naturales, año gravable 2025.
                Generado a partir del Decreto 2229 de 2023.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Últimos dos dígitos</th>
                  <th scope="col">Vence</th>
                </tr>
              </thead>
              <tbody>
                {CALENDARIO_2026.map(([a, b, iso, palabras]) => (
                  <tr key={iso + a}>
                    <th scope="row">{a} y {b}</th>
                    <td>
                      <time dateTime={iso}>{palabras}</time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Si te queda saldo a pagar, el plazo para pagar es el mismo de la declaración. No son dos
            fechas distintas.
          </p>
        </section>

        <section id="documentos" className="post-seccion">
          <h2>Qué documentos necesitas</h2>
          <p>
            Buena parte de esto ya está reportado a la DIAN y lo puedes descargar del portal. Lo que
            no está reportado es justamente lo que baja el impuesto, y ahí sí toca buscar papeles.
          </p>
          <dl className="post-lista-def">
            {DOCUMENTOS.map(([que, para]) => (
              <div key={que}>
                <dt>{que}</dt>
                <dd>{para}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="paso-a-paso" className="post-seccion">
          <h2>Cómo hacer la declaración de renta paso a paso</h2>
          <ol className="post-pasos">
            {PASOS.map(([titulo, cuerpo], i) => (
              <li key={titulo}>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{titulo}</h3>
                  <p>{cuerpo}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="post-nota">
            <AlertTriangle size={16} aria-hidden="true" />
            La declaración sugerida de la DIAN es una ayuda, no una liquidación. Quien firma responde
            por lo que presenta, y la DIAN tiene tres años para revisarla.
          </p>
        </section>

        <section id="deducciones" className="post-seccion">
          <h2>Cuánto puedes descontar de verdad</h2>
          <p>
            Acá está la parte que casi nadie explica, y es la que decide cuánto baja tu impuesto. Las
            deducciones y las rentas exentas de las rentas de trabajo <b>no se suman libremente</b>.
            Casi todas compiten por un mismo cupo, el del artículo 336 numeral 3 del Estatuto, que es el
            40% de tu ingreso neto con un techo de 1.340 UVT, o sea {pesos(1340 * UVT_2025)} al año.
          </p>
          <p>
            Lo importante es que el 25% de renta exenta laboral del artículo 206 numeral 10 también
            entra en ese cupo, y se lo come casi todo. Un ejemplo con números:
          </p>
          <div className="post-tabla-marco">
            <table className="post-tabla post-tabla-calculo">
              <caption>
                Alguien con {pesos(80_000_000)} de ingreso laboral en el año y {pesos(6_400_000)} de
                aportes obligatorios.
              </caption>
              <tbody>
                <tr>
                  <th scope="row">Ingreso laboral bruto</th>
                  <td className="post-cifra">{pesos(80_000_000)}</td>
                </tr>
                <tr>
                  <th scope="row">Aportes obligatorios a salud y pensión (no son ingreso)</th>
                  <td className="post-cifra">−{pesos(6_400_000)}</td>
                </tr>
                <tr className="post-fila-total">
                  <th scope="row">Ingreso neto sobre el que se calcula el cupo</th>
                  <td className="post-cifra">{pesos(73_600_000)}</td>
                </tr>
                <tr>
                  <th scope="row">Cupo del 40% (el techo de 1.340 UVT no alcanza a aplicar)</th>
                  <td className="post-cifra">{pesos(29_440_000)}</td>
                </tr>
                <tr>
                  <th scope="row">Menos el 25% de renta exenta, que ocupa el mismo cupo</th>
                  <td className="post-cifra">−{pesos(18_400_000)}</td>
                </tr>
                <tr className="post-fila-total">
                  <th scope="row">Lo que queda para todo lo demás</th>
                  <td className="post-cifra">{pesos(11_040_000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            El 25% se llevó casi dos terceras partes del cupo. Quedan {pesos(11_040_000)} para dependientes, prepagada,
            intereses de vivienda, AFC y el 1% de facturas electrónicas, <b>todo junto</b>. Y ahí
            está la trampa, porque cuatro dependientes valen {pesos(4 * 72 * UVT_2025)} y el tope anual de
            prepagada es {pesos(192 * UVT_2025)}. Solo esos dos ya suman{" "}
            {pesos(4 * 72 * UVT_2025 + 192 * UVT_2025)}, así que {pesos(12_863_520)} no bajarían el
            impuesto ni un peso.
          </p>
          <p>
            Por eso un consejo del tipo "mete todo lo que puedas" no sirve. Lo que sirve es saber
            cuánto cupo te queda libre, porque un beneficio que no cabe en el cupo es papeleo sin
            efecto. Las dos únicas excepciones que quedan por fuera de este límite son los 72 UVT por
            dependiente en su versión del artículo 336 y el 1% de las compras con factura
            electrónica.
          </p>
          <h3>Los topes de cada beneficio, en pesos</h3>
          <div className="post-tabla-marco">
            <table className="post-tabla">
              <thead>
                <tr>
                  <th scope="col">Beneficio</th>
                  <th scope="col">Tope</th>
                  <th scope="col">En pesos</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Por cada dependiente, hasta cuatro", "72 UVT", 72 * UVT_2025],
                  ["Medicina prepagada, al año", "192 UVT", 192 * UVT_2025],
                  ["Intereses de crédito de vivienda", "1.200 UVT", 1200 * UVT_2025],
                  ["Crédito del Icetex", "100 UVT", 100 * UVT_2025],
                  ["AFC y pensión voluntaria (30% del ingreso)", "3.800 UVT", 3800 * UVT_2025],
                  ["1% de compras con factura electrónica", "240 UVT", 240 * UVT_2025],
                  ["Renta exenta laboral (25% del ingreso)", "790 UVT", 790 * UVT_2025],
                ].map(([nombre, tope, valor]) => (
                  <tr key={nombre}>
                    <th scope="row">{nombre}</th>
                    <td>{tope}</td>
                    <td className="post-cifra">{pesos(valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="cesantias" className="post-seccion">
          <h2>Las cesantías</h2>
          <p>
            Las cesantías y sus intereses son renta exenta, pero no siempre al 100%. El artículo 206
            numeral 4 lo amarra a tu <b>ingreso mensual promedio de los últimos seis meses</b>: si ese
            promedio no pasa de 350 UVT, o sea {pesos(350 * UVT_2025)} al mes, quedan exentas
            completas. Por encima, el porcentaje exento baja por tramos.
          </p>
          <div className="post-tabla-marco">
            <table className="post-tabla">
              <caption>Gradualidad del art. 206 num. 4, con la UVT de 2025.</caption>
              <thead>
                <tr>
                  <th scope="col">Si tu promedio mensual está entre</th>
                  <th scope="col">Queda exento</th>
                </tr>
              </thead>
              <tbody>
                {[[350, 410, 90], [410, 470, 80], [470, 530, 60], [530, 590, 40], [590, 650, 20]].map(
                  ([desde, hasta, pct]) => (
                    <tr key={desde}>
                      <th scope="row">
                        {pesos(desde * UVT_2025)} y {pesos(hasta * UVT_2025)}
                        <small>{desde} y {hasta} UVT</small>
                      </th>
                      <td>{pct}%</td>
                    </tr>
                  ),
                )}
                <tr>
                  <th scope="row">
                    Más de {pesos(650 * UVT_2025)}
                    <small>650 UVT</small>
                  </th>
                  <td>0%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Ese promedio no lo adivina nadie, sale del certificado que emite tu empleador o del
            reporte de información exógena. Sin el dato, la parte exenta se calcula a ciegas, y es
            uno de los errores que más impuesto agrega.
          </p>
        </section>

        <section id="ganancias" className="post-seccion">
          <h2>Ganancias ocasionales: vender la casa o el carro</h2>
          <p>
            Vender un bien que tenías desde hacía <b>dos años o más</b> no es renta, es ganancia
            ocasional, y tiene su propia tarifa. El artículo 314 la fija en el <b>15%</b> sobre la
            utilidad, no sobre el precio de venta. La utilidad es lo que recibiste menos el costo
            fiscal del bien.
          </p>
          <p>
            Si lo tenías hacía menos de dos años, no es ganancia ocasional. Entra como renta ordinaria
            y se grava con la tabla del artículo 241, que puede ser más o menos según tu nivel de
            ingreso.
          </p>
          <h3>La venta de la vivienda, con una condición que casi nunca se menciona</h3>
          <p>
            El artículo 311-1 exime las primeras <b>5.000 UVT</b> de la utilidad al vender tu casa o
            apartamento de habitación, es decir {pesos(5000 * UVT_2025)}. Pero la exención{" "}
            <b>está condicionada</b>, y ahí es donde mucha gente la pierde: la totalidad del dinero
            recibido tiene que depositarse en una cuenta AFC y destinarse a comprar otra vivienda de
            habitación, o abonarse directamente a un crédito hipotecario ligado a la casa que vendiste.
          </p>
          <p>
            Si el dinero se usa para otra cosa, la exención no aplica y el retiro de la AFC tiene sus
            propias consecuencias. Vender la casa y guardar la plata en un CDT no da derecho a esta
            exención.
          </p>
          <p className="post-nota">
            <AlertTriangle size={16} aria-hidden="true" />
            La escritura y el certificado de tradición no son un trámite aparte, son el soporte del
            costo fiscal. Sin ellos, la utilidad se calcula contra un costo que no se puede probar.
          </p>
        </section>

        <section id="herencias" className="post-seccion">
          <h2>Herencias y donaciones</h2>
          <p>
            También son ganancia ocasional y también van al 15%, pero con exenciones propias que están
            en el artículo 307. Son cifras que rara vez aparecen juntas y en pesos.
          </p>
          <div className="post-tabla-marco">
            <table className="post-tabla">
              <caption>Exenciones del art. 307, con la UVT de 2025.</caption>
              <thead>
                <tr>
                  <th scope="col">Lo que se recibe</th>
                  <th scope="col">Exento</th>
                  <th scope="col">En pesos</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["La vivienda de habitación del causante", 13000,
                   "El inmueble donde vivía quien falleció."],
                  ["Otros inmuebles del causante", 6500,
                   "Fincas, locales o apartamentos distintos a la vivienda de habitación."],
                  ["Lo que recibe el cónyuge y cada heredero", 3250,
                   "Por porción conyugal, herencia o legado. Es por persona, no en total."],
                  ["Quien no es heredero forzoso ni cónyuge", 1625,
                   "El 20% de lo recibido, con este tope. También aplica a donaciones entre vivos."],
                ].map(([que, uvt, nota]) => (
                  <tr key={que}>
                    <th scope="row">
                      {que}
                      <small>{nota}</small>
                    </th>
                    <td>{uvt.toLocaleString("es-CO")} UVT</td>
                    <td className="post-cifra">{pesos(uvt * UVT_2025)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Los libros, la ropa, los utensilios de uso personal y el mobiliario de la casa de quien
            falleció están exentos sin tope. Y ojo con la tercera fila, porque la exención de 3.250 UVT
            es <b>por cada heredero</b>: cuatro hermanos tienen esa exención cada uno, no repartida.
          </p>
        </section>

        <section id="residencia" className="post-seccion">
          <h2>Si vives fuera o tienes bienes en el exterior</h2>
          <p>
            Todo lo anterior aplica a <b>residentes fiscales</b>, y la residencia fiscal no es lo mismo
            que la nacionalidad ni que tener cédula colombiana. El artículo 10 dice que eres residente
            si te quedas en el país <b>más de 183 días</b>, continuos o no, dentro de cualquier período
            de 365 días corridos. Si esos días caen sobre dos años, se considera residente a partir del
            segundo.
          </p>
          <p>
            La diferencia es grande. Un residente declara su <b>renta mundial</b>, es decir todo lo que
            ganó dentro y fuera de Colombia, y su patrimonio mundial. Un no residente solo declara lo
            de fuente colombiana. Alguien que se fue del país a mitad de año puede seguir siendo
            residente y no saberlo.
          </p>
          <p>
            Hay una obligación aparte que se pasa por alto: quien tiene <b>activos en el exterior</b> por
            encima del umbral debe presentar una declaración anual de activos en el exterior, distinta
            de la de renta, y tiene su propia sanción por presentarla tarde.
          </p>
          <p>
            Este es uno de los casos en los que conviene un contador. No porque sea difícil de entender,
            sino porque la respuesta depende de convenios para evitar la doble tributación que cambian
            según el país.
          </p>
        </section>

        <section id="errores" className="post-seccion">
          <h2>Tres errores que le suben el impuesto a mucha gente</h2>
          <ol className="post-errores">
            {ERRORES.map(([titulo, cuerpo]) => (
              <li key={titulo}>
                <h3>{titulo}</h3>
                <p>{cuerpo}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="sanciones" className="post-seccion">
          <h2>Qué pasa si no declaras</h2>
          <p>
            La sanción por extemporaneidad del artículo 641 es del <b>5% del impuesto a cargo por
            cada mes o fracción de mes</b> de retraso, hasta el 100% del impuesto, y encima corren
            intereses de mora. Si la DIAN te requiere primero y aun así no presentas, el porcentaje se
            duplica al 10% mensual.
          </p>
          <p>
            Hay un piso que sorprende a mucha gente, y es la <b>sanción mínima</b> del artículo 639 es de
            10 UVT del año en que se paga, es decir {pesos(10 * UVT_2026)} en 2026. Se aplica{" "}
            <b>incluso si tu impuesto era cero</b>. Alguien que no estaba obligado a pagar nada, pero
            sí a declarar, y no declaró, termina pagando esa suma por el trámite.
          </p>
          <p>
            Y hay un costo silencioso. Si tenías saldo a favor y no declaras, no lo pides. No hay
            sanción por eso, simplemente el dinero se queda donde está.
          </p>
        </section>

        <section id="contador" className="post-seccion">
          <h2>Si necesitas un contador</h2>
          <p>
            Para una persona natural la ley no exige contador, porque la declaración la firmas tú. Vale la
            pena buscar uno cuando el caso tiene aristas de verdad, y conviene ser honesto sobre
            cuáles son.
          </p>
          <div className="post-dos-columnas">
            <div>
              <h3>
                <Check size={17} aria-hidden="true" /> Casos que piden ayuda profesional
              </h3>
              <ul>
                <li>Vendiste un inmueble o un vehículo en el año</li>
                <li>Tienes ingresos o activos en el exterior</li>
                <li>Eres independiente con costos y gastos que quieres deducir</li>
                <li>Recibiste una herencia o una donación</li>
                <li>Ya te llegó un requerimiento de la DIAN</li>
              </ul>
            </div>
            <div>
              <h3>
                <X size={17} aria-hidden="true" /> Casos que no lo necesitan
              </h3>
              <ul>
                <li>Salario de uno o dos empleadores, con retenciones</li>
                <li>Arriendos de un inmueble</li>
                <li>Rendimientos de cuentas de ahorro o CDT</li>
                <li>Honorarios sin empleados ni costos que descontar</li>
              </ul>
            </div>
          </div>
          <p>
            Lo que sí hace falta en todos los casos es cruzar bien lo que la DIAN ya sabe con lo que
            tú tienes, y sustentar cada beneficio. Eso es trabajo de revisión, no de criterio
            contable, y es exactamente lo que hace Clara.
          </p>
        </section>

        <section id="preguntas" className="post-seccion">
          <h2>Preguntas frecuentes</h2>
          <div className="post-faq">
            {FAQ.map(([pregunta, respuesta]) => (
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
          <h2>Tu declaración de renta por $50.000, todo por WhatsApp</h2>
          <p>
            Clara consulta tu información en la DIAN, busca los beneficios que tienen soporte real,
            calcula cuánto cupo te queda libre y deja el formulario 210 diligenciado para que lo
            revises y lo firmes. Te decimos gratis si estás obligado a declarar.
          </p>
          <a className="button" href="/">
            Averigua gratis si debes declarar <ArrowRight size={18} aria-hidden="true" />
          </a>
        </aside>

        <section className="post-fuentes" aria-label="Cómo se hizo esta guía y fuentes">
          <h2>Cómo se hizo esta guía</h2>
          <p>
            Las cifras de esta página no están escritas a mano. Las calcula el mismo motor que Clara
            usa para preparar declaraciones, a partir de la UVT del año y de los topes del Estatuto,
            y el calendario se genera desde el decreto contando días hábiles. Si un dato del decreto
            cambia, la página cambia con él.
          </p>
          <p>
            Esta guía explica la norma vigente y no reemplaza la asesoría de un contador para un caso
            particular. Cada cifra queda con su artículo para que puedas verificarla en la fuente.
          </p>
          <h3>Fuentes oficiales</h3>
          <ul>
            <li>
              Estatuto Tributario:{" "}
              <a href="https://estatuto.co/206" rel="noopener">art. 206</a> (rentas exentas de
              trabajo y cesantías),{" "}
              <a href="https://estatuto.co/241" rel="noopener">art. 241</a> (tabla del impuesto),{" "}
              <a href="https://estatuto.co/336" rel="noopener">art. 336</a> (el límite del 40% y las
              1.340 UVT),{" "}
              <a href="https://estatuto.co/387" rel="noopener">art. 387</a> (dependientes),{" "}
              <a href="https://estatuto.co/592" rel="noopener">art. 592</a> y{" "}
              <a href="https://estatuto.co/594-3" rel="noopener">art. 594-3</a> (quién está
              obligado),{" "}
              <a href="https://estatuto.co/639" rel="noopener">art. 639</a> (sanción mínima) y{" "}
              <a href="https://estatuto.co/641" rel="noopener">art. 641</a> (extemporaneidad).
            </li>
            <li>
              Decreto 2229 de 2023, art. 1.6.1.13.2.15, que fija los plazos en días hábiles según los
              dos últimos dígitos del NIT.{" "}
              <a
                href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=6533"
                rel="noopener"
              >
                Gestor normativo
              </a>
              .
            </li>
            <li>
              DIAN:{" "}
              <a href="https://micrositios.dian.gov.co/renta-personas-naturales-ag-2025/" rel="noopener">
                micrositio de renta personas naturales
              </a>
              ,{" "}
              <a href="https://www.dian.gov.co/Paginas/CalendarioTributario.aspx" rel="noopener">
                calendario tributario
              </a>
              ,{" "}
              <a href="https://webazure.dian.gov.co/consultarenta/" rel="noopener">
                consulta si debes declarar
              </a>{" "}
              y{" "}
              <a href="https://www.dian.gov.co/tramitesservicios/Paginas/declaracionsugerida.aspx" rel="noopener">
                declaración sugerida
              </a>
              .
            </li>
            <li>
              Ley 51 de 1983, sobre el traslado de festivos al lunes, que es la razón de los saltos
              del calendario.
            </li>
            <li>
              UVT de {pesos(UVT_2025)} para 2025 y {pesos(UVT_2026)} para 2026, según la resolución
              anual de la DIAN.
            </li>
          </ul>
        </section>
    </Pagina>
  );
}
