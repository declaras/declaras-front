/**
 * Archivos protegidos: verlos sin bajarlos, y bajarlos con su nombre real.
 *
 * Todo lo que el backend entrega como bytes (un PDF, una hoja de calculo, la memoria de calculo)
 * exige token, y el navegador no lo manda cuando resuelve una URL por su cuenta. Asi que los bytes
 * se piden con `fetch`, que si lleva la sesion, y se publican como una URL local `blob:` que el
 * `<iframe>` y el `<img>` si pueden usar. `api.archivo` hace la parte de red; esto hace la parte de
 * navegador, que es la que tiene ciclo de vida.
 */

import { useEffect, useState } from "react";

import { archivo } from "./api";

/**
 * Un recurso protegido publicado como URL local, listo para un `<iframe>` o un `<img>`.
 *
 * HAY QUE REVOCAR LA URL. Cada `createObjectURL` retiene el archivo entero en memoria hasta que
 * alguien lo suelta, y el visor se abre y se cierra muchas veces en un mismo expediente: sin
 * revocar, una sesion de trabajo va acumulando cada documento que se miro. Se suelta al desmontar
 * y al cambiar de documento.
 *
 * `ruta` en `null` significa "este documento no se muestra en el navegador" (una hoja de calculo,
 * por ejemplo, de la que ya se tiene algo mejor que el original). Ahi no se pide nada: bajar un
 * XLSX entero para no mostrarlo seria gastar la red del cliente en nada.
 */
export function useArchivo(ruta) {
  // Se guarda DE QUE RUTA es lo que hay, no un booleano de "cargando". Asi el estado de carga se
  // deriva comparando ("lo que tengo no es de lo que pedi") en vez de setearse al entrar al efecto,
  // que es un render de mas y una combinacion imposible menos. Es el mismo patron de `useApi`.
  const [traido, setTraido] = useState({ ruta: null, url: null, error: null });

  useEffect(() => {
    if (!ruta) return undefined;

    let vigente = true;
    let creada = null;

    archivo(ruta)
      .then((blob) => {
        // Si ya no esta vigente NO se crea la URL, en vez de crearla y revocarla: el efecto de
        // limpieza ya corrio, asi que nadie la soltaria.
        if (!vigente) return;
        creada = URL.createObjectURL(blob);
        setTraido({ ruta, url: creada, error: null });
      })
      .catch((error) => {
        if (vigente) setTraido({ ruta, url: null, error });
      });

    return () => {
      vigente = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [ruta]);

  // Lo traido solo vale para la ruta que lo produjo: al cambiar de documento la URL anterior ya
  // fue revocada, y devolverla pintaria un marco roto durante un render.
  const alDia = traido.ruta === ruta;
  return {
    url: alDia ? traido.url : null,
    error: alDia ? traido.error : null,
    cargando: Boolean(ruta) && !alDia,
  };
}

/**
 * Baja un archivo protegido al disco con el nombre que le corresponde.
 *
 * EL `setTimeout` NO ES SUPERSTICION. Revocar la URL en la linea siguiente al `click()` cancela la
 * descarga en los navegadores que la arrancan en otro hilo: el enlace queda apuntando a algo que
 * ya no existe. Se suelta un momento despues, cuando el navegador ya tomo los bytes.
 */
export async function descargarArchivo(ruta, nombre) {
  const blob = await archivo(ruta);
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre || "documento";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
