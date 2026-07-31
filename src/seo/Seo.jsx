import { useEffect } from "react";

import { SITIO } from "./paginas";

export { SITIO };

/**
 * Los metadatos de cada pagina.
 *
 * POR QUE EXISTE: el sitio es una sola pagina de React, asi que el `<head>` del index.html es el
 * mismo para todas las rutas. Sin esto, el articulo del blog heredaba el titulo de la portada y
 * competia contra ella por la misma consulta, que es la forma mas rapida de que ninguna de las dos
 * aparezca. Cada ruta declara su titulo, su descripcion, su canonica y sus datos estructurados.
 *
 * OJO CON EL TITULO: el conmutador de pantallas del prototipo escribe `document.title` en cada
 * cambio de pantalla. Esta pieza lo vuelve a poner cuando la ruta se monta, y por eso la portada
 * paso a NO reescribirlo.
 */


export const MARCA = "Clara";
const IMAGEN_POR_DEFECTO = `${SITIO}/clara-og.jpg`;

/** Pone o actualiza una etiqueta del head sin duplicarla. */
function etiqueta(selector, crear) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = crear();
    document.head.appendChild(el);
  }
  return el;
}

function meta(nombre, contenido, porPropiedad = false) {
  if (!contenido) return;
  const atributo = porPropiedad ? "property" : "name";
  const el = etiqueta(`meta[${atributo}="${nombre}"]`, () => {
    const nuevo = document.createElement("meta");
    nuevo.setAttribute(atributo, nombre);
    return nuevo;
  });
  el.setAttribute("content", contenido);
}

export default function Seo({
  titulo,
  descripcion,
  ruta = "/",
  imagen = IMAGEN_POR_DEFECTO,
  tipo = "website",
  datos = null,
  publicado = null,
  modificado = null,
}) {
  useEffect(() => {
    const url = `${SITIO}${ruta}`;
    document.title = titulo;
    meta("description", descripcion);
    meta("robots", "index, follow, max-image-preview:large, max-snippet:-1");

    const canonica = etiqueta('link[rel="canonical"]', () => {
      const el = document.createElement("link");
      el.rel = "canonical";
      return el;
    });
    canonica.href = url;

    meta("og:title", titulo, true);
    meta("og:description", descripcion, true);
    meta("og:url", url, true);
    meta("og:type", tipo, true);
    meta("og:image", imagen, true);
    meta("og:site_name", MARCA, true);
    meta("og:locale", "es_CO", true);
    meta("twitter:card", "summary_large_image");
    meta("twitter:title", titulo);
    meta("twitter:description", descripcion);
    meta("twitter:image", imagen);
    if (publicado) meta("article:published_time", publicado, true);
    if (modificado) meta("article:modified_time", modificado, true);

    // Los datos estructurados de la ruta van en su propia etiqueta, marcada, para no pisar los del
    // index.html (que describen la organizacion y el sitio, y valen para todas las paginas).
    const previo = document.head.querySelector('script[data-seo="ruta"]');
    if (previo) previo.remove();
    if (datos) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seo = "ruta";
      script.textContent = JSON.stringify(datos);
      document.head.appendChild(script);
    }
  }, [titulo, descripcion, ruta, imagen, tipo, datos, publicado, modificado]);

  return null;
}
