/**
 * Un formulario 210 contra otro, casilla por casilla.
 *
 * SIRVE PARA DOS PREGUNTAS DISTINTAS, y el backend dice cual con `contra`:
 *
 *   el borrador de la DIAN     ¿en que difiere de lo que ella precargo con lo que sabe? Las
 *                              diferencias son lo que aporto el trabajo con documentos. Se ve
 *                              justo antes de presentar, que es cuando importa.
 *   la declaracion presentada  ¿en que difiere de lo que se declaro de verdad ese anio? En un anio
 *                              viejo eso es casi siempre el trabajo de un contador, asi que la
 *                              diferencia es una segunda opinion sobre su trabajo.
 *
 * NO SE MEZCLAN EN UNA SOLA TABLA, aunque el calculo sea el mismo. Frente al borrador de la DIAN,
 * declarar mas suele ser una mejora nuestra; frente a lo que un contador presento, es una
 * discrepancia que hay que resolver antes de afirmar quien tiene razon. Juntarlas haria que la
 * misma fila signifique cosas opuestas segun de donde venga.
 *
 * LO QUE DECLARAMOS DE MENOS VA APARTE. Contra la DIAN significa que ella tiene un dato que no
 * estamos declarando, y eso lo cruza sola. Contra lo presentado significa que el contador declaro
 * mas, y ahi la pregunta es al reves: o el tenia razon, o nosotros encontramos algo.
 */

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { formatMoney } from "./formato";
import { useVista } from "./vista";

/**
 * Las frases de cada contraparte, ESCRITAS COMPLETAS y no compuestas.
 *
 * Interpolar un nombre en una plantilla no funciona en español: "difieren de ${nombre}" con
 * "el borrador sugerido" da "difieren de el borrador", y "no dice lo mismo que ${nombre}" con
 * "lo que la DIAN tenía" da "que lo que la DIAN tenía". Las contracciones y los relativos hay que
 * escribirlos, así que cada frase vive entera.
 */
const CONTRA = {
  BORRADOR_DE_LA_DIAN: {
    difieren: (n, profunda) =>
      profunda
        ? `${n} casillas difieren del borrador sugerido por la DIAN`
        : `En ${n} ${n === 1 ? "cosa" : "cosas"} tu declaración no dice lo mismo que la DIAN`,
    coinciden: (profunda) =>
      profunda
        ? "Todas las casillas coinciden con el borrador sugerido por la DIAN."
        : "Tu declaración coincide en todo con lo que la DIAN tenía precargado.",
    ausente: (profunda) =>
      profunda
        ? "No hay borrador sugerido en el expediente, o no se pudo leer el PDF."
        : "La DIAN no tiene un borrador precargado para ti este año.",
  },
  DECLARACION_PRESENTADA: {
    difieren: (n, profunda) =>
      profunda
        ? `${n} casillas difieren de la declaración presentada`
        : `En ${n} ${n === 1 ? "cosa" : "cosas"} nuestro cálculo no dice lo mismo que lo que declaraste`,
    coinciden: (profunda) =>
      profunda
        ? "Todas las casillas coinciden con la declaración presentada de ese año."
        : "Nuestro cálculo coincide en todo con lo que se declaró ese año.",
    ausente: (profunda) =>
      profunda
        ? "No hay declaración presentada de este año gravable en el expediente. En el año en curso es lo normal."
        : "Todavía no hay una declaración presentada de este año, así que no hay con qué comparar.",
  },
};

export default function Comparacion({ comparacion }) {
  const { profunda } = useVista();
  const [abierto, setAbierto] = useState(false);
  if (!comparacion) return null;

  const quien = CONTRA[comparacion.contra] ?? CONTRA.BORRADOR_DE_LA_DIAN;

  // Sin nada con que comparar se dice POR QUE. "Coinciden" ahi seria afirmar que alguien verificó.
  if (!comparacion.disponible) {
    return <p className="comparacion-igual">{quien.ausente(profunda)}</p>;
  }

  const menores = comparacion.menores_que_la_dian ?? [];
  const todas = comparacion.con_diferencia ?? [];

  if (comparacion.coinciden) {
    return <p className="comparacion-igual">{quien.coinciden(profunda)}</p>;
  }

  const presentada = comparacion.contra === "DECLARACION_PRESENTADA";

  return (
    <section className="comparacion">
      <button className="doc-plegable" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {quien.difieren(todas.length, profunda)}
      </button>

      {/* El resumen de lo que declaramos de menos se ve SIN abrir: es lo que hay que poder
          explicar, y esconderlo detrás de un clic lo vuelve opcional. */}
      {menores.length ? (
        <p className="comparacion-menores">
          {presentada
            ? profunda
              ? `En ${menores.length} el cálculo declara MENOS que lo presentado: o el contador tenía un dato que no tenemos, o declaró de más.`
              : `En ${menores.length} nuestro cálculo declara menos que lo que se presentó. Vale la pena mirar cuál de los dos tiene razón.`
            : profunda
              ? `${menores.length} de ellas declaran MENOS que la DIAN: cada una necesita una razón registrada o es un ingreso que falta.`
              : `En ${menores.length} declaras menos de lo que la DIAN tiene. Si es porque algo no era tuyo, ya quedó anotado; si no, hay que revisarlo.`}
        </p>
      ) : null}

      {abierto ? (
        <table className="tabla comparacion-tabla">
          <thead>
            <tr>
              <th>Concepto</th>
              <th className="num">{profunda ? "El cálculo" : "Nuestro cálculo"}</th>
              <th className="num">{presentada ? "Lo presentado" : "La DIAN"}</th>
              <th className="num">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {todas.map((c) => (
              <tr key={c.numero} className={c.delta < 0 ? "comparacion-menor" : undefined}>
                <td>
                  {profunda ? c.nombre : c.en_palabras}
                  {profunda ? <span className="renglon-numero">R{c.numero}</span> : null}
                </td>
                {/* `null` es "esta casilla no existe en ese formulario", que no es cero. */}
                <td className="num money">{c.nuestra === null ? "—" : formatMoney(c.nuestra)}</td>
                <td className="num money">
                  {c.de_la_dian === null ? "—" : formatMoney(c.de_la_dian)}
                </td>
                <td className="num money strong">
                  {c.delta > 0 ? "+" : ""}
                  {formatMoney(c.delta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
