import { useMemo, useState } from "react";
import { AlertTriangle, Calculator, Check, X } from "lucide-react";

import CampoNumero from "../comun/CampoNumero";
import Pagina, { Relacionadas } from "./Pagina";
import { otras, pesos, PUBLICADO, UVT_2025 } from "./datos";

/**
 * Deducciones y beneficios, con el limite del articulo 336.
 *
 * QUE TIENE QUE NO TIENEN LOS DEMAS: para esta consulta rankean Gerencie, Siempre al Dia (4.066
 * palabras), Actualicese, el INCP y Cijuf. Todos son medios contables escribiendo para contadores:
 * listan los beneficios uno por uno, en UVT, con la cita del articulo.
 *
 * Ninguno responde la pregunta que de verdad importa, que es CUANTO BAJA EL IMPUESTO. Y la respuesta
 * casi nunca es la suma de los beneficios, porque compiten por un mismo cupo del 40% en el que el
 * 25% de renta exenta ya ocupa la mayor parte. Sin eso, un lector junta soportes de beneficios que
 * no le van a servir. Aca ese limite es el eje de la pagina y hay una calculadora que lo muestra.
 */

const RUTA = "/deducciones-declaracion-de-renta";

const SECCIONES = [
  ["limite", "El límite que manda"],
  ["calculadora", "Cuánto cupo te queda"],
  ["cuales", "Los beneficios, en pesos"],
  ["fuera", "Los que van por fuera del cupo"],
  ["soporte", "Cada beneficio necesita soporte"],
  ["orden", "En qué orden conviene usarlo"],
  ["preguntas", "Preguntas frecuentes"],
];

/** Los beneficios que caben DENTRO del cupo del 40%, con su tope y su norma. */
const DENTRO = [
  ["Renta exenta laboral, el 25%", "790 UVT", 790, "Art. 206 num. 10",
   "Se calcula sobre el ingreso ya descontados los aportes. Es automática, no hay que pedirla, y por eso mismo es la que se come el cupo."],
  ["Medicina prepagada", "192 UVT al año", 192, "Art. 387",
   "Tu plan y el de tu familia. Necesitas el certificado del año que emite la aseguradora."],
  ["Intereses de crédito de vivienda", "1.200 UVT", 1200, "Art. 119",
   "Solo los intereses, no la cuota entera. El banco emite el certificado."],
  ["Crédito del Icetex", "100 UVT", 100, "Art. 119",
   "Solo intereses de crédito para educación superior propia."],
  ["AFC y pensión voluntaria", "3.800 UVT y 30% del ingreso", 3800, "Arts. 126-1 y 126-4",
   "El tope real casi siempre es el 30% del ingreso, no las 3.800 UVT."],
  ["Deducción del art. 387", "32 UVT al mes", 32, "Art. 387",
   "El 10% del ingreso por dependientes, en su versión mensual de retención."],
];

/** Los que NO entran en el cupo, y por eso son los unicos que suman de verdad cuando ya esta lleno. */
const FUERA = [
  ["Por cada dependiente, hasta cuatro", "72 UVT cada uno", 72,
   "Art. 336 num. 3, excepción expresa",
   "Cuatro dependientes suman 288 UVT. Necesitas registro civil, o el certificado que pruebe la dependencia."],
  ["1% de las compras con factura electrónica", "240 UVT", 240,
   "Art. 336 num. 3, excepción expresa",
   "Sale del reporte de factura electrónica de la DIAN, así que no hay que juntar papeles."],
];

const PREGUNTAS = [
  ["¿Qué deducciones puedo aplicar en la declaración de renta?",
   `Las principales son la medicina prepagada (${pesos(192 * UVT_2025)} al año), los intereses del crédito de vivienda, los aportes a AFC y pensión voluntaria, el crédito del Icetex, 72 UVT por cada dependiente hasta cuatro y el 1% de las compras con factura electrónica. Casi todas compiten por un mismo cupo del 40% del ingreso, así que sumarlas no siempre baja más el impuesto.`],
  ["¿Cuánto puedo descontar como máximo?",
   `El artículo 336 fija un cupo del 40% de tu ingreso neto, con un techo de 1.340 UVT, es decir ${pesos(1340 * UVT_2025)} al año. Dentro de ese cupo entran las deducciones y las rentas exentas juntas. Solo quedan por fuera los 72 UVT por dependiente y el 1% de las facturas electrónicas.`],
  ["¿El 25% de renta exenta cuenta dentro del límite?",
   "Sí, y es lo que más sorprende. El 25% del artículo 206 numeral 10 ocupa el mismo cupo del 40%, y como es automático suele llenar más de la mitad. Lo que queda libre para prepagada, vivienda y AFC es bastante menos de lo que la gente supone."],
  ["¿Sirve juntar más soportes de los que caben en el cupo?",
   "Para bajar el impuesto de ese año, no. Un beneficio que no cabe en el cupo no reduce nada. Lo que sí conviene es saber cuánto cupo tienes libre antes de decidir, por ejemplo, cuánto aportar a una AFC."],
  ["¿Puedo deducir los aportes obligatorios a salud y pensión?",
   "No son una deducción, son algo mejor. Los aportes obligatorios son ingreso no constitutivo de renta según los artículos 55 y 56, así que salen del ingreso antes de calcular el cupo del 40%. Al no consumir cupo, bajan la base y además agrandan el espacio disponible."],
  ["¿Qué pasa si pido un beneficio sin el soporte?",
   "Queda como una diferencia que la DIAN puede revisar durante tres años. Si la desconoce, hay que pagar el impuesto que se dejó de pagar más sanción e intereses. Un dependiente sin registro civil o una prepagada sin certificado no son beneficios, son riesgo."],
];

function Cupo() {
  const [ingreso, setIngreso] = useState("");
  const [aportes, setAportes] = useState("");

  const r = useMemo(() => {
    const ing = Number(ingreso) || 0;
    if (!ing) return null;
    const ap = Number(aportes) || 0;
    const neto = Math.max(0, ing - ap);
    const cupo = Math.min(neto * 0.4, 1340 * UVT_2025);
    const exenta = Math.min(neto * 0.25, 790 * UVT_2025);
    const libre = Math.max(0, cupo - exenta);
    return { neto, cupo, exenta, libre, porTope: neto * 0.4 > 1340 * UVT_2025 };
  }, [ingreso, aportes]);

  return (
    <div className="vence cupo-sim">
      <label htmlFor="cupo-ing">
        <Calculator size={17} aria-hidden="true" />
        Cuánto cupo te queda para deducciones
      </label>
      <div className="sancion-campos">
        <span>
          <CampoNumero
            id="cupo-ing"
            etiqueta="Ingresos laborales del año"
            placeholder="$80.000.000"
            valor={ingreso}
            alCambiar={setIngreso}
          />
        </span>
        <span>
          <CampoNumero
            etiqueta="Aportes obligatorios a salud y pensión"
            placeholder="$6.400.000"
            valor={aportes}
            alCambiar={setAportes}
          />
        </span>
      </div>

      {r ? (
        <div className="sancion-r">
          <p className="sancion-total">
            Te queda <b>{pesos(r.libre)}</b> de cupo libre
          </p>
          <ul>
            <li>
              Ingreso neto después de aportes: <b>{pesos(r.neto)}</b>.
            </li>
            <li>
              Cupo del artículo 336: <b>{pesos(r.cupo)}</b>
              {r.porTope
                ? ` (manda el techo de 1.340 UVT, porque el 40% daría más)`
                : ` (el 40% del ingreso neto)`}
              .
            </li>
            <li>
              El 25% de renta exenta ocupa <b>{pesos(r.exenta)}</b>, o sea el{" "}
              {Math.round((r.exenta / r.cupo) * 100)}% del cupo.
            </li>
            <li>
              Eso deja <b>{pesos(r.libre)}</b> para prepagada, vivienda, AFC e Icetex, todo junto.
              Por encima de esa cifra, un beneficio más no baja el impuesto.
            </li>
          </ul>
        </div>
      ) : (
        <p className="vence-r vence-vacia">
          <small>
            Escribe tu ingreso laboral del año. Los aportes obligatorios son opcionales, pero cambian
            el resultado: al no ser ingreso, agrandan el cupo disponible.
          </small>
        </p>
      )}
    </div>
  );
}

/** El diagrama del cupo. Es SVG en el marcado, asi que pesa nada y se puede leer y traducir. */
function Diagrama() {
  const ancho = 620;
  const alto = 168;
  const exenta = 0.625; // el 25% sobre el 40% del mismo ingreso
  return (
    <figure className="cupo-figura">
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        width="100%"
        role="img"
        aria-label="El cupo del 40% se reparte entre el 25% de renta exenta, que ocupa cerca de dos terceras partes, y el resto disponible para las demás deducciones."
      >
        <text x="0" y="16" className="cupo-t">
          Tu cupo del artículo 336, el 40% del ingreso neto
        </text>
        <rect x="0" y="30" width={ancho} height="52" rx="9" className="cupo-fondo" />
        <rect x="0" y="30" width={ancho * exenta} height="52" rx="9" className="cupo-usado" />
        <text x="14" y="61" className="cupo-et">
          25% de renta exenta
        </text>
        <text x={ancho * exenta + 14} y="61" className="cupo-et cupo-et-libre">
          Lo que queda
        </text>
        <line x1={ancho * exenta} y1="88" x2={ancho * exenta} y2="104" className="cupo-guia" />
        <text x={ancho} y="122" textAnchor="end" className="cupo-t">
          Acá caben prepagada, vivienda, AFC e Icetex, todo junto
        </text>
        <text x="0" y="152" className="cupo-t cupo-t-suave">
          Los 72 UVT por dependiente y el 1% de facturas electrónicas van por fuera de esta barra
        </text>
      </svg>
      <figcaption>
        El 25% de renta exenta es automático y ocupa cerca de dos terceras partes del cupo. Lo que
        queda es lo único que pueden usar los demás beneficios.
      </figcaption>
    </figure>
  );
}

export default function Deducciones() {
  const ejemplo = useMemo(() => {
    const ing = 80_000_000;
    const ap = 6_400_000;
    const neto = ing - ap;
    const cupo = Math.min(neto * 0.4, 1340 * UVT_2025);
    const exenta = Math.min(neto * 0.25, 790 * UVT_2025);
    const dep = 4 * 72 * UVT_2025;
    const prep = 192 * UVT_2025;
    return { ing, ap, neto, cupo, exenta, libre: cupo - exenta, dep, prep,
             exceso: Math.max(0, dep + prep - (cupo - exenta)) };
  }, []);

  return (
    <Pagina
      titulo="Deducciones de renta 2026: topes en pesos y el límite | Clara"
      descripcion="Los topes de cada deducción en pesos y el límite del 40% del artículo 336, que decide cuánto baja de verdad tu impuesto. Con calculadora de cupo."
      ruta={RUTA}
      imagen="/clara-og-deducciones.jpg"
      migaja="Deducciones y beneficios"
      publicado={PUBLICADO}
      secciones={SECCIONES}
      preguntas={PREGUNTAS}
      h1="Deducciones en la declaración de renta de personas naturales: los topes y el límite que manda"
      bajada="Casi todas las listas de deducciones que hay por ahí están completas y son inútiles al mismo tiempo, porque no dicen lo único que importa: cuánto de eso baja tu impuesto de verdad."
    >
      <aside className="post-resumen">
        <h2>La respuesta corta</h2>
        <ul>
          <li>
            <b>Las deducciones no se suman libremente.</b> Compiten por un cupo del 40% de tu ingreso
            neto, con techo de {pesos(1340 * UVT_2025)} al año.
          </li>
          <li>
            <b>El 25% de renta exenta ocupa ese mismo cupo</b> y suele llenar cerca de dos terceras
            partes. Es automático, no hay que pedirlo.
          </li>
          <li>
            <b>Solo dos beneficios van por fuera</b>: los 72 UVT por cada dependiente y el 1% de las
            compras con factura electrónica.
          </li>
          <li>
            <b>Un beneficio que no cabe en el cupo no baja nada.</b> Juntar más soportes de los que
            caben es trabajo perdido.
          </li>
        </ul>
      </aside>

      <section id="limite" className="post-seccion">
        <h2>El límite que manda</h2>
        <p>
          El artículo 336 numeral 3 del Estatuto dice que la suma de todas las deducciones y rentas
          exentas de la cédula general no puede pasar del <b>40% del ingreso neto</b>, y en ningún caso
          de <b>1.340 UVT</b>, o sea {pesos(1340 * UVT_2025)} al año. Ingreso neto quiere decir después
          de restar los aportes obligatorios a salud y pensión, que no son ingreso.
        </p>
        <p>
          Hasta acá lo dice cualquier página. Lo que casi ninguna dice es que la{" "}
          <b>renta exenta del 25%</b> del artículo 206 numeral 10 entra en ese mismo cupo. Y como se
          aplica sola, sin que haya que pedirla ni soportarla, ya está ocupando el espacio antes de que
          empieces a juntar certificados.
        </p>
        <Diagrama />
      </section>

      <section id="calculadora" className="post-seccion">
        <h2>Cuánto cupo te queda</h2>
        <p>
          Antes de buscar soportes, conviene saber cuánto espacio hay. Con dos datos alcanza.
        </p>
        <Cupo />
        <h3>Un ejemplo con números</h3>
        <div className="post-tabla-marco">
          <table className="post-tabla post-tabla-calculo">
            <caption>
              Alguien con {pesos(ejemplo.ing)} de ingreso laboral y {pesos(ejemplo.ap)} de aportes
              obligatorios.
            </caption>
            <tbody>
              <tr>
                <th scope="row">Ingreso laboral bruto</th>
                <td className="post-cifra">{pesos(ejemplo.ing)}</td>
              </tr>
              <tr>
                <th scope="row">Aportes obligatorios, que no son ingreso</th>
                <td className="post-cifra">−{pesos(ejemplo.ap)}</td>
              </tr>
              <tr className="post-fila-total">
                <th scope="row">Ingreso neto</th>
                <td className="post-cifra">{pesos(ejemplo.neto)}</td>
              </tr>
              <tr>
                <th scope="row">Cupo del 40%</th>
                <td className="post-cifra">{pesos(ejemplo.cupo)}</td>
              </tr>
              <tr>
                <th scope="row">Menos el 25% de renta exenta, que ocupa el mismo cupo</th>
                <td className="post-cifra">−{pesos(ejemplo.exenta)}</td>
              </tr>
              <tr className="post-fila-total">
                <th scope="row">Cupo libre para todo lo demás</th>
                <td className="post-cifra">{pesos(ejemplo.libre)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Con ese cupo libre de {pesos(ejemplo.libre)}, alguien que tenga cuatro dependientes
          ({pesos(ejemplo.dep)}) y prepagada al tope ({pesos(ejemplo.prep)}) ya suma{" "}
          {pesos(ejemplo.dep + ejemplo.prep)}. Los dependientes van por fuera del cupo, así que esos
          sí entran completos; pero si en lugar de dependientes tuviera intereses de vivienda y AFC por
          la misma cifra, {pesos(ejemplo.exceso)} no le bajarían el impuesto ni un peso.
        </p>
        <p className="post-nota">
          <AlertTriangle size={16} aria-hidden="true" />
          Por eso un consejo del tipo "mete todo lo que puedas" no sirve. Lo que sirve es saber cuánto
          cupo te queda libre antes de decidir cuánto aportar a una AFC o si vale la pena pedir un
          certificado.
        </p>
      </section>

      <section id="cuales" className="post-seccion">
        <h2>Los beneficios que van dentro del cupo</h2>
        <p>
          Todos estos compiten entre sí por el mismo espacio. Los topes están en pesos del año gravable
          2025, con la UVT de {pesos(UVT_2025)}.
        </p>
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
              {DENTRO.map(([nombre, tope, uvt, norma, nota]) => (
                <tr key={nombre}>
                  <th scope="row">
                    {nombre}
                    <small>
                      {norma}. {nota}
                    </small>
                  </th>
                  <td>{tope}</td>
                  <td className="post-cifra">{pesos(uvt * UVT_2025)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="fuera" className="post-seccion">
        <h2>Los dos que van por fuera del cupo</h2>
        <p>
          Estos son los únicos que el artículo 336 deja explícitamente afuera del límite del 40%. Eso
          los vuelve especialmente valiosos cuando el cupo ya está lleno, porque son los únicos que
          todavía bajan el impuesto.
        </p>
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
              {FUERA.map(([nombre, tope, uvt, norma, nota]) => (
                <tr key={nombre}>
                  <th scope="row">
                    {nombre}
                    <small>
                      {norma}. {nota}
                    </small>
                  </th>
                  <td>{tope}</td>
                  <td className="post-cifra">{pesos(uvt * UVT_2025)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Y algo que no es deducción pero rinde más</h3>
        <p>
          Los <b>aportes obligatorios a salud y pensión</b> no son una deducción. Los artículos 55 y 56
          los tratan como ingreso no constitutivo de renta, así que se restan del ingreso{" "}
          <b>antes</b> de calcular el cupo. No consumen espacio y además hacen el cupo más pequeño en
          términos absolutos, pero bajan la base, que es lo que se grava. Si en tu certificado de
          ingresos no aparecen, ese es el primer error que hay que corregir.
        </p>
      </section>

      <section id="soporte" className="post-seccion">
        <h2>Cada beneficio necesita soporte</h2>
        <div className="post-dos-columnas">
          <div>
            <h3>
              <Check size={17} aria-hidden="true" /> Con esto sí se sostiene
            </h3>
            <ul>
              <li>Dependientes: registro civil, o prueba de la dependencia económica</li>
              <li>Prepagada: certificado anual de la aseguradora</li>
              <li>Vivienda: certificado de intereses del banco</li>
              <li>AFC o voluntarias: extracto del fondo</li>
              <li>Facturas electrónicas: el reporte que ya tiene la DIAN</li>
            </ul>
          </div>
          <div>
            <h3>
              <X size={17} aria-hidden="true" /> Con esto no
            </h3>
            <ul>
              <li>Un dependiente que nadie puede probar</li>
              <li>Recibos de pago sueltos en vez del certificado del año</li>
              <li>La cuota completa del crédito en vez de solo los intereses</li>
              <li>Gastos médicos que no son prepagada ni seguro de salud</li>
            </ul>
          </div>
        </div>
        <p>
          La DIAN tiene tres años para revisar. Un beneficio sin soporte no es un ahorro, es una
          diferencia esperando un requerimiento, y cuando llega hay que devolver el impuesto más
          sanción e intereses.
        </p>
      </section>

      <section id="orden" className="post-seccion">
        <h2>En qué orden conviene usar el cupo</h2>
        <p>
          Como el espacio es limitado, el orden importa. Primero van las cosas que no consumen cupo,
          porque son gratis en términos de espacio.
        </p>
        <ol className="post-pasos">
          {[
            ["Los aportes obligatorios", "Salen del ingreso antes del cupo. Verifica que estén completos en tu certificado."],
            ["Los dependientes y el 1% de facturas", "Van por fuera del límite del 40%, así que suman siempre."],
            ["Lo que ya tienes soportado", "Prepagada, intereses de vivienda e Icetex, hasta donde alcance el cupo libre."],
            ["Los aportes voluntarios, al final", "Son los únicos que puedes decidir. Si el cupo ya está lleno, aportar más no baja el impuesto de este año."],
          ].map(([titulo, cuerpo], i) => (
            <li key={titulo}>
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{titulo}</h3>
                <p>{cuerpo}</p>
              </div>
            </li>
          ))}
        </ol>
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
        <h2>Clara calcula tu cupo y solo aplica lo que tiene soporte</h2>
        <p>
          Consulta tu información en la DIAN, calcula cuánto cupo te queda libre y te dice cuáles
          beneficios valen la pena en tu caso y cuáles no cambian nada. Por $50.000, todo por WhatsApp.
        </p>
        <a className="button" href="/">
          Averigua gratis si debes declarar
        </a>
      </aside>

      <section className="post-fuentes" aria-label="Fuentes">
        <h2>Fuentes</h2>
        <ul>
          <li>
            Estatuto Tributario:{" "}
            <a href="https://estatuto.co/336" rel="noopener">art. 336</a> (el límite del 40% y las
            1.340 UVT),{" "}
            <a href="https://estatuto.co/206" rel="noopener">art. 206</a> (rentas exentas de
            trabajo),{" "}
            <a href="https://estatuto.co/387" rel="noopener">art. 387</a> (dependientes y
            prepagada),{" "}
            <a href="https://estatuto.co/119" rel="noopener">art. 119</a> (intereses de vivienda),{" "}
            <a href="https://estatuto.co/126-1" rel="noopener">art. 126-1</a> y{" "}
            <a href="https://estatuto.co/126-4" rel="noopener">art. 126-4</a> (voluntarias y AFC),{" "}
            <a href="https://estatuto.co/55" rel="noopener">art. 55</a> y{" "}
            <a href="https://estatuto.co/56" rel="noopener">art. 56</a> (aportes obligatorios).
          </li>
          <li>UVT de {pesos(UVT_2025)} para el año gravable 2025.</li>
        </ul>
      </section>
    </Pagina>
  );
}
