import { useId, useMemo, useState } from "react";
import { ArrowRight, Calculator, MessageCircle } from "lucide-react";

import CampoNumero from "./CampoNumero";
import { vencimientoDe } from "../contenido/calendario-renta-2026";

/**
 * Averigua la fecha limite para declarar a partir de los dos ultimos digitos del documento.
 *
 * POR QUE ES COMPARTIDA Y NO VIVE SOLO EN LA GUIA: es lo mas concreto que el producto puede dar
 * antes de pedir nada. No necesita clave de la DIAN, ni correo, ni cuenta, y responde con un dato
 * que la persona vino a buscar. Enterrada en la mitad de un articulo la usaba poca gente, asi que
 * va arriba en la guia y tambien en la portada.
 *
 * EL `id` SALE DE `useId`. Con dos instancias en la misma pagina, un `id` fijo hace que la etiqueta
 * de la segunda apunte al campo de la primera, y al tocar el texto se enfoca el campo equivocado.
 *
 * Dos variantes:
 *   bloque    la caja completa, para una pagina de lectura
 *   compacta  una linea, para el hero, donde compite con el titular y el boton principal
 */
export default function Vencimiento({ variante = "bloque", alResolver = null }) {
  const campo = useId();
  const [documento, setDocumento] = useState("");
  const fila = useMemo(() => {
    const digitos = documento.replace(/\D/g, "");
    return digitos.length >= 2 ? vencimientoDe(digitos) : null;
  }, [documento]);

  const compacta = variante === "compacta";

  return (
    <div className={compacta ? "vence vence-compacta" : "vence"}>
      <label htmlFor={campo}>
        <Calculator size={compacta ? 15 : 17} aria-hidden="true" />
        {compacta
          ? "¿Cuándo vence tu declaración?"
          : "Escribe tu cédula o NIT y te digo tu fecha límite"}
      </label>
      <div className="vence-fila">
        <CampoNumero
          id={campo}
          moneda={false}
          placeholder={compacta ? "Escribe tu cédula" : "Por ejemplo, 1.020.304.050"}
          valor={documento}
          alCambiar={setDocumento}
        />
        {compacta && fila ? (
          <p className="vence-r">
            Vence el <b>{fila[3]}</b>
          </p>
        ) : null}
      </div>

      {!compacta && fila ? (
        <p className="vence-r">
          Tu declaración de renta vence el <b>{fila[3]}</b>.
          <small>
            Por los dos últimos dígitos ({fila[0]} y {fila[1]}). Si tienes NIT, no cuentes el dígito
            de verificación, ese que va después del guion.
          </small>
        </p>
      ) : null}

      {!compacta && !fila ? (
        <p className="vence-r vence-vacia">
          <small>La fecha depende de los dos últimos dígitos, no del año de nacimiento.</small>
        </p>
      ) : null}

      {compacta && !fila ? (
        <p className="vence-pie">
          <small>Gratis y sin dar ningún dato más.</small>
        </p>
      ) : null}

      {/* EL PASO SIGUIENTE DICE A DONDE VA, y antes no. El boton decia "Averigua gratis si te toca
          declarar" con una flecha: prometia una respuesta y no decia como llegaba, asi que quien lo
          tocaba caia en WhatsApp sin esperarlo — y quien NO lo tocaba se quedaba con la fecha y sin
          saber que hacer con ella ("¿y como les escribo?").

          Nombrar el canal en el boton hace las dos cosas: quien quiere escribir sabe que ahi es, y
          quien no quiere WhatsApp no se lleva la sorpresa. El icono es el mismo que el sitio ya usa
          para la conversacion, en la cabecera y en el pie. */}
      {fila && alResolver ? (
        <button type="button" className="vence-siguiente" onClick={alResolver}>
          <MessageCircle size={16} aria-hidden="true" />
          Escríbenos por WhatsApp y te decimos si te toca declarar
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
