import { useId, useLayoutEffect, useRef } from "react";

/**
 * Un campo numerico que se va agrupando con puntos mientras se escribe.
 *
 * POR QUE UN COMPONENTE Y NO UN `onChange` en cada sitio: formatear al escribir tiene una trampa que
 * no se ve hasta que alguien corrige algo en la mitad del numero. Al reescribir el valor, el
 * navegador manda el cursor al final, asi que si escribiste 80.000.000 y quieres arreglar el primer
 * digito, el cursor se te va y terminas escribiendo al reves. Aca el cursor se repone contando
 * DIGITOS, no caracteres, porque los puntos se mueven solos cuando el numero crece.
 *
 * El estado que ve quien lo usa son digitos limpios (un numero), no el texto con puntos. Asi ningun
 * calculo tiene que acordarse de limpiar la cadena antes de operar, que es donde aparecen los ceros
 * fantasma.
 *
 * `moneda` decide si lleva el signo. Va con signo el dinero y sin signo un documento: en Colombia
 * una cedula si se escribe con puntos, pero ponerle "$" seria decir que es plata.
 *
 * LA ETIQUETA LA PONE EL COMPONENTE. Cuando cada pantalla la escribia por su cuenta, uno de los
 * campos quedo con un `<small>` en vez de un `<label>`, asi que no tenia nombre accesible: un lector
 * de pantalla lo anunciaba como "campo de texto" y tocarlo no enfocaba nada. Rendirla desde aca,
 * con un `id` propio, hace que eso no pueda repetirse.
 */

const soloDigitos = (texto) => String(texto ?? "").replace(/\D/g, "");

/** 80000000 -> "$80.000.000" o "80.000.000". Vacio si no hay nada, para que se vea el marcador. */
export const conFormato = (digitos, moneda = true) => {
  const limpio = soloDigitos(digitos);
  if (!limpio) return "";
  return (moneda ? "$" : "") + Number(limpio).toLocaleString("es-CO");
};

export default function CampoNumero({
  id,
  etiqueta,
  valor,
  alCambiar,
  placeholder,
  moneda = true,
  ...resto
}) {
  const propio = useId();
  const suyo = id ?? propio;
  const campo = useRef(null);
  // Cuantos digitos habia a la izquierda del cursor cuando se escribio. Se guarda entre el evento y
  // el repintado, que es cuando hay que reponerlo.
  const digitosAntes = useRef(null);

  useLayoutEffect(() => {
    const nodo = campo.current;
    if (!nodo || digitosAntes.current === null) return;
    const objetivo = digitosAntes.current;
    digitosAntes.current = null;

    // Avanzar por el texto ya formateado hasta haber pasado esa cantidad de digitos.
    const texto = nodo.value;
    let vistos = 0;
    let posicion = texto.length;
    for (let i = 0; i < texto.length; i += 1) {
      if (/\d/.test(texto[i])) vistos += 1;
      if (vistos === objetivo) {
        posicion = i + 1;
        break;
      }
    }
    if (objetivo === 0) posicion = texto.startsWith("$") ? 1 : 0;
    nodo.setSelectionRange(posicion, posicion);
  });

  const control = (
    <input
      {...resto}
      id={suyo}
      ref={campo}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={conFormato(valor, moneda)}
      onChange={(evento) => {
        const nodo = evento.target;
        const hasta = nodo.selectionStart ?? nodo.value.length;
        digitosAntes.current = soloDigitos(nodo.value.slice(0, hasta)).length;
        alCambiar(soloDigitos(nodo.value));
      }}
    />
  );

  if (!etiqueta) return control;
  return (
    <>
      <label htmlFor={suyo}>{etiqueta}</label>
      {control}
    </>
  );
}
