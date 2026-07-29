/**
 * El indicador guiado: en que etapa va la declaracion.
 *
 * NO SON PESTANAS, y la diferencia importa. Unas pestanas invitan a pasear entre iguales; esto
 * es el progreso de un proceso que tiene orden. Se puede volver atras (una etapa terminada se
 * puede revisar), pero no saltar a una que todavia no aplica: revisar el borrador antes de
 * decidir los renglones es leer una cifra que va a cambiar.
 *
 * Las pestanas si tienen su sitio, DENTRO del borrador, donde el contenido es homogeneo y se
 * navega libre (resumen, ingresos, beneficios, soportes).
 *
 * En pantalla ancha va al lado, porque acompana sin gastar altura. En el telefono va arriba como
 * una barra, porque ahi el ancho es lo escaso.
 */

import { Check } from "lucide-react";

export const ETAPAS = [
  { id: "resultado", nombre: "Resultado" },
  { id: "decisiones", nombre: "Decisiones" },
  { id: "borrador", nombre: "Borrador" },
  { id: "presentar", nombre: "Presentar" },
];

export default function Etapas({ actual, hasta, onIr }) {
  const indiceActual = ETAPAS.findIndex((e) => e.id === actual);
  const indiceMaximo = ETAPAS.findIndex((e) => e.id === hasta);

  return (
    <nav className="etapas" aria-label="En qué va la declaración">
      <ol>
        {ETAPAS.map((etapa, indice) => {
          const hecha = indice < indiceActual;
          const es = indice === indiceActual;
          const alcanzable = indice <= indiceMaximo;
          // La lista de clases se arma en un array y no con ternarios dentro de la plantilla:
          // se lee mejor, y así cada clase aparece como un literal que se puede buscar.
          const clases = ["etapa"];
          if (es) clases.push("etapa-actual");
          if (hecha) clases.push("etapa-hecha");
          if (!alcanzable) clases.push("etapa-lejos");
          return (
            <li key={etapa.id} className={clases.join(" ")}>
              <button onClick={() => alcanzable && onIr(etapa.id)} disabled={!alcanzable}>
                <span className="etapa-marca">
                  {hecha ? <Check size={12} /> : <span className="etapa-punto" />}
                </span>
                <span className="etapa-nombre">{etapa.nombre}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
