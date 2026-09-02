import { renderToString } from "react-dom/server";
// StaticRouter sale del paquete principal, no de un subcamino /server.
import { StaticRouter } from "react-router";

import App, { FAQS_PORTADA } from "./App";
import Consola from "./consola/Consola";
import { construirDatos } from "./contenido/Pagina";
import GuiaRenta2026, { FAQ } from "./contenido/GuiaRenta2026";
import SancionRenta, { PREGUNTAS as SANCION } from "./contenido/SancionRenta";
import Deducciones, { PREGUNTAS as DEDUCCIONES } from "./contenido/Deducciones";
import PasoAPaso, { PREGUNTAS as PASOS } from "./contenido/PasoAPaso";
import Legal from "./contenido/Legal";
import { cabezaDe, PAGINAS, SITIO } from "./seo/paginas";

/**
 * Renderiza una ruta a HTML, sin navegador.
 *
 * POR QUE NO SE USA UN NAVEGADOR: el prerenderizado abria Chromium y guardaba el DOM. Funcionaba en
 * un portatil y no en el servidor de construccion: la imagen de Vercel no trae las librerias de
 * sistema que Chromium necesita, y fallaba con "libnspr4.so: cannot open shared object file". No se
 * pueden instalar sin permisos de administrador, asi que la via era quitar el navegador de en medio.
 *
 * Ademas de funcionar en cualquier parte, es mucho mas rapido y quita 95 MB de descarga por build.
 *
 * NO SE HIDRATA en el cliente. El navegador vuelve a montar la aplicacion desde cero sobre este
 * HTML, igual que hacia con el prerenderizado anterior. Eso evita toda la clase de errores por
 * diferencias entre lo que pinto el servidor y lo que pinta el cliente, al precio de un repintado
 * que no se nota. Lo que importa para un buscador es que el contenido venga en la respuesta.
 */

const RUTAS = {
  "/declaracion-de-renta-2026": [GuiaRenta2026, FAQ],
  "/sancion-por-no-declarar-renta": [SancionRenta, SANCION],
  "/deducciones-declaracion-de-renta": [Deducciones, DEDUCCIONES],
  "/como-declarar-renta-paso-a-paso": [PasoAPaso, PASOS],
  // Sin preguntas frecuentes: un documento legal no es una pagina de contenido.
  "/terminos": [Legal, []],
};

/** Los datos estructurados de la ruta, armados sin renderizar: los efectos no corren en el servidor. */
function datosDe(ruta) {
  if (ruta === "/") {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITIO}/#preguntas`,
      mainEntity: FAQS_PORTADA.map(([pregunta, respuesta]) => ({
        "@type": "Question",
        name: pregunta,
        acceptedAnswer: { "@type": "Answer", text: respuesta },
      })),
    };
  }
  const p = PAGINAS[ruta];
  const preguntas = RUTAS[ruta]?.[1] ?? [];
  return p ? construirDatos({ ruta, ...p, preguntas }) : null;
}

export function render(ruta) {
  const Elegida = RUTAS[ruta]?.[0] ?? (ruta.startsWith("/consola") ? Consola : App);
  const cuerpo = renderToString(
    <StaticRouter location={ruta}>
      <Elegida />
    </StaticRouter>,
  );
  return { cuerpo, cabeza: cabezaDe(ruta, datosDe(ruta)) };
}
