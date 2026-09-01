/**
 * La oferta: el precio con su ancla y la cuenta regresiva.
 *
 * ═══ A QUE HORA TERMINA, Y POR QUE ═══
 *
 * El reloj cuenta hasta la medianoche de Bogota. No es un plazo inventado por visita (esos
 * relojes que "reinician" si abres en incognito): es el mismo para todo el mundo y se renueva
 * cada dia, que es como funciona un precio de temporada que se decide dia a dia. El texto dice
 * "hoy", que es exactamente lo que el reloj mide.
 *
 * ═══ EN EL SERVIDOR NO HAY RELOJ ═══
 *
 * El prerenderizado congelaria una hora vieja en el HTML ("termina en 04:32:10" servido a las
 * tres de la tarde del dia siguiente). Por eso el tiempo solo se pinta cuando el efecto corre,
 * o sea en el navegador; el HTML estatico dice "solo por hoy", que es verdad a cualquier hora.
 *
 * ═══ TRES PRESENTACIONES, UNA HISTORIA ═══
 *
 * completa   la tarjeta con el descuento, el "de 150 a 50" con flecha y el reloj. Para donde la
 *            oferta es la protagonista: el hero de la consulta y el cierre del veredicto.
 * ancla      una linea con la insignia, el "antes $150.000" y el reloj, SIN el precio nuevo:
 *            va pegada a un titular que ya lo dice en grande, y repetirlo era la razon de que
 *            el hero se sintiera amontonado.
 * soloReloj  el reloj solo, para la tarjeta de precio, que ya pinta las dos cifras en grande.
 */

import { useSyncExternalStore } from "react";
import { Clock3, MoveRight } from "lucide-react";

import { PRECIO, pesos } from "../contenido/datos";

/** Cuanto falta para la medianoche de Bogota, como HH:MM:SS. Bogota es UTC-5 todo el año. */
function cuentaRegresiva() {
  const bogota = new Date(Date.now() - 5 * 3600_000);
  const faltan =
    86_400 -
    (bogota.getUTCHours() * 3600 + bogota.getUTCMinutes() * 60 + bogota.getUTCSeconds());
  const dos = (n) => String(n).padStart(2, "0");
  return `${dos(Math.floor(faltan / 3600))}:${dos(Math.floor((faltan % 3600) / 60))}:${dos(faltan % 60)}`;
}

/** Avisa cada segundo. La resta se recalcula en el snapshot, asi que no hay estado que arrastrar. */
function cadaSegundo(avisar) {
  const reloj = setInterval(avisar, 1000);
  return () => clearInterval(reloj);
}

function useReloj() {
  // El tercer argumento es el snapshot del SERVIDOR: null, que pinta "solo por hoy". Asi el HTML
  // prerenderizado nunca trae una hora congelada.
  return useSyncExternalStore(cadaSegundo, cuentaRegresiva, () => null);
}

/** Sin descuento configurado (LISTA igual a AHORA) nada de esto se pinta: quitar la promocion
 *  es cambiar una cifra en datos.js, no buscar tachados por todo el sitio. */
export default function Promo({ clara = false, soloReloj = false, ancla = false }) {
  const resta = useReloj();
  if (PRECIO.LISTA <= PRECIO.AHORA) return null;

  // El porcentaje se calcula, no se escribe: si el precio cambia, la insignia no puede
  // quedarse diciendo un descuento que ya no es.
  const descuento = Math.round((1 - PRECIO.AHORA / PRECIO.LISTA) * 100);
  const reloj = (
    <span className="promo-resta">
      <Clock3 size={13} aria-hidden="true" />
      {resta ? <>termina hoy en <b className="promo-reloj">{resta}</b></> : "solo por hoy"}
    </span>
  );

  if (soloReloj) return <p className="promo-chip">{reloj}</p>;

  if (ancla) {
    return (
      <p className={clara ? "promo-ancla promo-ancla-clara" : "promo-ancla"}>
        <b className="promo-insignia">{descuento}% de descuento</b>
        <span className="promo-antes">
          antes <s className="money">{pesos(PRECIO.LISTA)}</s>
        </span>
        {reloj}
      </p>
    );
  }

  return (
    <div className={clara ? "promo promo-clara" : "promo"}>
      <div className="promo-cabeza">
        <b className="promo-insignia">{descuento}% de descuento</b>
        {reloj}
      </div>
      {/* La flecha hace la historia: DE un precio A otro. Sueltas, las dos cifras eran un
          acertijo que en movil ademas se amontonaba en dos filas sin orden. */}
      <p className="promo-precios">
        <s className="money">{pesos(PRECIO.LISTA)}</s>
        <MoveRight size={20} aria-hidden="true" />
        <b className="money">{pesos(PRECIO.AHORA)}</b>
      </p>
    </div>
  );
}
