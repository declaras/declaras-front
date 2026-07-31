import { useMemo, useState } from "react";
import { AlertTriangle, Calculator } from "lucide-react";

import CampoNumero from "../comun/CampoNumero";
import Pagina, { Relacionadas } from "./Pagina";
import { otras, pesos, PUBLICADO, UVT_2025, UVT_2026 } from "./datos";

/**
 * Sancion por no declarar renta.
 *
 * QUE TIENE QUE NO TIENEN LOS DEMAS: la primera pagina de Google para esta consulta la ocupan
 * Mesfix (809 palabras), Siempre al Dia, Contadia, Siigo y dos paginas de bancos espanoles que
 * hablan de la Agencia Tributaria y no aplican en Colombia. Todos explican el 5% mensual del
 * articulo 641 y ahi paran.
 *
 * Lo que ninguno explica es el resto del articulo 641, que es justamente el caso de la mayoria de
 * las personas naturales: CUANDO NO HAY IMPUESTO A CARGO la sancion no es 5% de cero, es 0,5% de los
 * ingresos brutos por mes, con tres topes que compiten entre si. Alguien que no debia un peso de
 * impuesto puede terminar debiendo millones por presentar tarde, y eso no aparece en ninguno de los
 * resultados de la primera pagina.
 *
 * Tambien falta en todos la diferencia entre presentar tarde (art. 641, la liquida uno mismo) y no
 * presentar (art. 643, la impone la DIAN sobre el 20% de las consignaciones), que es una diferencia
 * de orden de magnitud.
 */

const RUTA = "/sancion-por-no-declarar-renta";
const MINIMA = 10 * UVT_2026;

const SECCIONES = [
  ["cuanto", "Cuánto es la sanción"],
  ["calculadora", "Calcula la tuya"],
  ["sin-impuesto", "Si no te resultaba impuesto"],
  ["no-declarar", "Si la DIAN te descubre primero"],
  ["intereses", "Los intereses de mora"],
  ["reduccion", "Cómo se reduce"],
  ["preguntas", "Preguntas frecuentes"],
];

export const PREGUNTAS = [
  ["¿Cuánto es la multa por no declarar renta en Colombia?",
   `Si presentas tarde por tu cuenta, la sanción es del 5% del impuesto a cargo por cada mes o fracción de mes de retraso, sin pasar del 100% del impuesto. Si no te resultaba impuesto a cargo, es el 0,5% de tus ingresos brutos por mes. Ninguna sanción puede quedar por debajo de la mínima, que en 2026 es ${pesos(MINIMA)}.`],
  ["¿Qué pasa si no declaro renta y la DIAN se da cuenta?",
   "Cambia el artículo que aplica y el monto sube mucho. La sanción por no declarar del artículo 643 es del 20% de tus consignaciones bancarias o de tus ingresos brutos del año, o el 20% de los ingresos de tu última declaración, el que sea mayor. La calcula la DIAN, no tú."],
  ["¿Hay sanción si no me resultaba impuesto a pagar?",
   `Sí, y es el error más costoso. Cuando no hay impuesto a cargo la sanción se calcula sobre los ingresos brutos, no sobre el impuesto, así que no es cero. El artículo 641 fija 0,5% de los ingresos brutos por mes de retraso, con un techo que es el menor entre el 5% de esos ingresos, el doble del saldo a favor o 2.500 UVT (${pesos(2500 * UVT_2025)}).`],
  ["¿Cuál es la sanción mínima en 2026?",
   `10 UVT, o sea ${pesos(MINIMA)}. Se calcula con la UVT del año en que se paga y aplica incluso a las sanciones ya reducidas. Es el piso de cualquier sanción, así que aunque el cálculo dé menos, se paga esa suma.`],
  ["¿Los intereses de mora se suman a la sanción?",
   "Sí, son cosas distintas y se acumulan. La sanción castiga la presentación tardía y los intereses castigan el pago tardío del impuesto. Los intereses se liquidan día por día a la tasa de usura de crédito de consumo menos dos puntos, según el artículo 635."],
  ["¿Se puede reducir la sanción?",
   "Sí. El artículo 640 permite bajarla al 50% cuando no has tenido sanciones por la misma conducta en los dos años anteriores y aceptas y pagas, y al 75% cuando el antecedente limpio es de un año. La mínima de 10 UVT sigue siendo el piso."],
  ["¿Hasta cuándo puede cobrarme la DIAN?",
   "La DIAN tiene tres años desde el vencimiento del plazo para revisar una declaración presentada. Si nunca presentaste, ese reloj no empieza a correr, así que la obligación no se vence con el tiempo. Presentar tarde, aunque sea muy tarde, cierra el asunto; no presentar lo deja abierto."],
];

function Simulador() {
  const [impuesto, setImpuesto] = useState("");
  const [ingresos, setIngresos] = useState("");
  const [meses, setMeses] = useState("1");

  const r = useMemo(() => {
    const imp = Number(impuesto) || 0;
    const ing = Number(ingresos) || 0;
    const m = Math.max(1, Math.min(120, Number(meses) || 1));
    if (!imp && !ing) return null;

    if (imp > 0) {
      // Art. 641: 5% del impuesto por mes, sin pasar del 100% del impuesto.
      const bruta = imp * 0.05 * m;
      const conTope = Math.min(bruta, imp);
      return {
        base: "el impuesto a cargo",
        regla: "5% del impuesto por cada mes o fracción",
        bruta,
        tope: imp,
        topeTexto: "el 100% del impuesto",
        final: Math.max(conTope, MINIMA),
        minimaManda: conTope < MINIMA,
      };
    }
    // Art. 641 cuando NO hay impuesto a cargo: 0,5% de los ingresos brutos por mes. El techo es la
    // cifra MENOR entre el 5% de los ingresos y 2.500 UVT (el otro techo, el doble del saldo a
    // favor, no se puede calcular sin conocerlo, y siempre es el mayor de los tres si hay saldo).
    const bruta = ing * 0.005 * m;
    const topeIngresos = ing * 0.05;
    const topeUvt = 2500 * UVT_2025;
    const tope = Math.min(topeIngresos, topeUvt);
    const conTope = Math.min(bruta, tope);
    return {
      base: "tus ingresos brutos",
      regla: "0,5% de los ingresos brutos por cada mes o fracción",
      bruta,
      tope,
      topeTexto:
        topeIngresos < topeUvt
          ? "el 5% de tus ingresos brutos"
          : `2.500 UVT (${pesos(topeUvt)})`,
      final: Math.max(conTope, MINIMA),
      minimaManda: conTope < MINIMA,
    };
  }, [impuesto, ingresos, meses]);

  return (
    <div className="vence sancion-sim">
      <label htmlFor="sim-imp">
        <Calculator size={17} aria-hidden="true" />
        Calcula tu sanción por presentar tarde
      </label>

      <div className="sancion-campos">
        <span>
          <CampoNumero
            id="sim-imp"
            etiqueta="Impuesto a cargo"
            placeholder="$0"
            valor={impuesto}
            alCambiar={setImpuesto}
          />
        </span>
        <span>
          <CampoNumero
            etiqueta="Ingresos brutos del año"
            placeholder="$0"
            valor={ingresos}
            alCambiar={setIngresos}
          />
        </span>
        <span className="corto">
          <label htmlFor="sim-meses">Meses de retraso</label>
          <input
            id="sim-meses"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={meses}
            onChange={(e) => setMeses(e.target.value.replace(/\D/g, ""))}
          />
        </span>
      </div>

      {r ? (
        <div className="sancion-r">
          <p className="sancion-total">
            Sanción estimada <b>{pesos(r.final)}</b>
          </p>
          <ul>
            <li>
              La base es <b>{r.base}</b>, con la regla del {r.regla}.
            </li>
            <li>
              El cálculo da {pesos(r.bruta)} y el techo es {r.topeTexto}, {pesos(r.tope)}.
            </li>
            {r.minimaManda ? (
              <li>
                Queda por debajo de la sanción mínima, así que <b>manda la mínima</b> de{" "}
                {pesos(MINIMA)}.
              </li>
            ) : null}
            <li>
              A esto se le suman los intereses de mora, que se calculan aparte y día por día.
            </li>
          </ul>
        </div>
      ) : (
        <p className="vence-r vence-vacia">
          <small>
            Si te resultaba impuesto a cargo, escribe ese valor. Si no te resultaba impuesto, deja el
            primer campo en cero y escribe tus ingresos brutos del año: la sanción se calcula sobre
            ellos.
          </small>
        </p>
      )}
    </div>
  );
}

export default function SancionRenta() {
  return (
    <Pagina
      titulo="Sanción por no declarar renta en 2026: cuánto es | Clara"
      descripcion="Cuánto cuesta presentar tarde, qué pasa si no presentas y por qué hay sanción incluso cuando no te resultaba impuesto a pagar. Con la mínima de 2026 en pesos."
      ruta={RUTA}
      imagen="/clara-og-sancion.jpg"
      migaja="Sanción por no declarar"
      publicado={PUBLICADO}
      secciones={SECCIONES}
      preguntas={PREGUNTAS}
      h1="Sanción por no declarar renta en Colombia: cuánto es y cómo se calcula"
      bajada="Hay dos sanciones distintas y se confunden todo el tiempo. Una la liquidas tú por presentar tarde; la otra la impone la DIAN por no presentar, y es de otro orden de magnitud."
    >
      <aside className="post-resumen">
        <h2>La respuesta corta</h2>
        <ul>
          <li>
            <b>Si presentas tarde por tu cuenta</b>, la sanción es del 5% del impuesto a cargo por
            cada mes o fracción de mes, hasta el 100% del impuesto.
          </li>
          <li>
            <b>Si no te resultaba impuesto</b>, la sanción no es cero. Se calcula sobre tus ingresos
            brutos, al 0,5% por mes.
          </li>
          <li>
            <b>Si la DIAN te descubre primero</b>, aplica otra norma: el 20% de tus consignaciones
            bancarias o de tus ingresos brutos del año.
          </li>
          <li>
            <b>La sanción mínima en 2026</b> es {pesos(MINIMA)} y es el piso de todo, incluso de las
            sanciones ya reducidas.
          </li>
        </ul>
      </aside>

      <section id="cuanto" className="post-seccion">
        <h2>Cuánto es la sanción</h2>
        <p>
          Todo depende de una sola cosa, y es <b>quién da el primer paso</b>. Si presentas la
          declaración tarde pero por tu propia cuenta, la sanción la liquidas tú y es la del artículo
          641. Si la DIAN te manda un emplazamiento y presentas después, se duplica. Y si nunca
          presentas y la DIAN te determina el impuesto, la sanción es otra y se calcula sobre una base
          mucho más grande.
        </p>
        <div className="post-tabla-marco">
          <table className="post-tabla">
            <caption>Las tres situaciones, con la norma que aplica en cada una.</caption>
            <thead>
              <tr>
                <th scope="col">Situación</th>
                <th scope="col">Sanción</th>
                <th scope="col">Techo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  Presentas tarde, por tu cuenta
                  <small>Art. 641. La liquidas tú en la declaración.</small>
                </th>
                <td>5% del impuesto por mes o fracción</td>
                <td>100% del impuesto</td>
              </tr>
              <tr>
                <th scope="row">
                  Presentas después de un emplazamiento
                  <small>Art. 642. La DIAN ya te escribió.</small>
                </th>
                <td>10% del impuesto por mes o fracción</td>
                <td>200% del impuesto</td>
              </tr>
              <tr className="post-fila-total">
                <th scope="row">
                  No presentas y la DIAN te liquida
                  <small>Art. 643. La impone la DIAN.</small>
                </th>
                <td>20% de las consignaciones o de los ingresos brutos</td>
                <td>Sin techo porcentual</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="post-nota">
          <AlertTriangle size={16} aria-hidden="true" />
          Presentar tarde siempre sale más barato que esperar. La diferencia entre el 5% del impuesto
          y el 20% de las consignaciones no es de grado, es de otro orden de magnitud.
        </p>
      </section>

      <section id="calculadora" className="post-seccion">
        <h2>Calcula la tuya</h2>
        <p>
          Escribe lo que tengas. Si te resultaba impuesto a cargo, el cálculo va sobre el impuesto. Si
          no te resultaba, va sobre tus ingresos brutos, que es la parte que sorprende.
        </p>
        <Simulador />
        <p>
          Es una estimación de la sanción, no del total a pagar. Los intereses de mora van aparte y se
          liquidan día por día, así que crecen mientras no pagues.
        </p>
      </section>

      <section id="sin-impuesto" className="post-seccion">
        <h2>Si no te resultaba impuesto, la sanción no es cero</h2>
        <p>
          Acá está el punto que casi ninguna página explica, y es el caso más común entre asalariados.
          Mucha gente está obligada a declarar y termina con impuesto en cero, o incluso con saldo a
          favor porque le retuvieron de más. Suena a que una declaración tardía no costaría nada,
          porque el 5% de cero es cero.
        </p>
        <p>
          No funciona así. El artículo 641 tiene un segundo párrafo para ese caso:{" "}
          <b>cuando no resulta impuesto a cargo, la sanción es el 0,5% de los ingresos brutos</b> del
          período por cada mes o fracción de mes de retraso. La base deja de ser el impuesto y pasa a
          ser todo lo que te entró en el año.
        </p>
        <div className="post-tabla-marco">
          <table className="post-tabla post-tabla-calculo">
            <caption>
              Alguien con {pesos(80_000_000)} de ingresos, sin impuesto a cargo, que presenta con seis
              meses de retraso.
            </caption>
            <tbody>
              <tr>
                <th scope="row">0,5% de {pesos(80_000_000)}, por seis meses</th>
                <td className="post-cifra">{pesos(80_000_000 * 0.005 * 6)}</td>
              </tr>
              <tr>
                <th scope="row">Techo: el 5% de los ingresos brutos</th>
                <td className="post-cifra">{pesos(80_000_000 * 0.05)}</td>
              </tr>
              <tr>
                <th scope="row">Techo alterno: 2.500 UVT</th>
                <td className="post-cifra">{pesos(2500 * UVT_2025)}</td>
              </tr>
              <tr className="post-fila-total">
                <th scope="row">Sanción, tomando el techo menor</th>
                <td className="post-cifra">
                  {pesos(Math.min(80_000_000 * 0.005 * 6, 80_000_000 * 0.05, 2500 * UVT_2025))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Los techos compiten entre sí y manda el menor de los tres, que son el 5% de los ingresos, el
          doble del saldo a favor si lo hay, y 2.500 UVT ({pesos(2500 * UVT_2025)}). Si en el año no
          hubo ingresos, la base pasa a ser el 1% del patrimonio líquido del año anterior.
        </p>
        <p>
          Dicho de otro modo, alguien a quien no le tocaba pagar un peso de impuesto puede acabar
          debiendo millones por no haber presentado un formulario a tiempo. Y si tenía saldo a favor,
          además nunca lo pidió.
        </p>
      </section>

      <section id="no-declarar" className="post-seccion">
        <h2>Si la DIAN te descubre primero</h2>
        <p>
          Mientras presentes por tu cuenta, sigues en el artículo 641. Cuando la DIAN actúa primero, la
          situación cambia dos veces. Primero te manda un <b>emplazamiento</b> para que declares, y si
          presentas después de eso la sanción del artículo 642 sube al 10% mensual, con techo del 200%.
        </p>
        <p>
          Si aun así no presentas, la DIAN puede determinar el impuesto por su cuenta e imponer la{" "}
          <b>sanción por no declarar</b> del artículo 643, que para renta es el 20% del valor de tus
          consignaciones bancarias o de tus ingresos brutos del período, o el 20% de los ingresos
          brutos de tu última declaración presentada, <b>el que sea superior</b>.
        </p>
        <p>
          Vale detenerse en la palabra consignaciones. No es lo que ganaste, es lo que pasó por tus
          cuentas, incluidos los traslados entre cuentas propias. Alguien que movió el mismo dinero
          varias veces puede tener consignaciones muy por encima de sus ingresos reales, y esa es la
          base sobre la que se calcula el 20%.
        </p>
      </section>

      <section id="intereses" className="post-seccion">
        <h2>Los intereses de mora van aparte</h2>
        <p>
          La sanción castiga haber presentado tarde. Los intereses castigan haber pagado tarde. Son
          dos cosas distintas y se suman.
        </p>
        <p>
          El artículo 635 fija la tasa: los intereses se liquidan <b>día por día</b> a la tasa
          equivalente a la <b>tasa de usura para crédito de consumo menos dos puntos</b>, según la
          certifica la Superintendencia Financiera. La DIAN publica el valor vigente en su página, y
          cambia mes a mes, así que cualquier cifra fija que veas escrita en un artículo está
          desactualizada.
        </p>
        <p>
          Lo importante en la práctica es que los intereses no tienen techo y crecen todos los días.
          La sanción, en cambio, se congela cuando llega a su tope.
        </p>
      </section>

      <section id="reduccion" className="post-seccion">
        <h2>Cómo se reduce</h2>
        <p>
          El artículo 640 permite bajar la sanción cuando el contribuyente tiene el historial limpio y
          acepta. Se reduce <b>al 50%</b> si en los dos años anteriores no te sancionaron por la misma
          conducta y aceptas y pagas, y <b>al 75%</b> si el antecedente limpio es de un año.
        </p>
        <p>
          Hay un límite que no se mueve. El artículo 639 dice que la sanción mínima de 10 UVT aplica{" "}
          <b>incluidas las sanciones reducidas</b>, así que por más reducción que corresponda, el piso
          en 2026 sigue siendo {pesos(MINIMA)}.
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
        <h2>Antes de que se venza, averigua si te toca</h2>
        <p>
          Clara te dice gratis si estás obligado a declarar. Si lo estás, consulta tu información en la
          DIAN y deja el formulario listo por $50.000, todo por WhatsApp.
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
            <a href="https://estatuto.co/635" rel="noopener">art. 635</a> (tasa de interés
            moratorio),{" "}
            <a href="https://estatuto.co/639" rel="noopener">art. 639</a> (sanción mínima),{" "}
            <a href="https://estatuto.co/640" rel="noopener">art. 640</a> (reducción),{" "}
            <a href="https://estatuto.co/641" rel="noopener">art. 641</a> (extemporaneidad),{" "}
            <a href="https://estatuto.co/642" rel="noopener">art. 642</a> (después del
            emplazamiento) y{" "}
            <a href="https://estatuto.co/643" rel="noopener">art. 643</a> (sanción por no
            declarar).
          </li>
          <li>
            UVT de {pesos(UVT_2026)} para 2026, que es la que se usa para la sanción mínima porque se
            calcula con la del año en que se paga.
          </li>
        </ul>
      </section>
    </Pagina>
  );
}
