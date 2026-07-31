/**
 * Convierte cada ruta publica en HTML estatico despues de construir.
 *
 * POR QUE HACE FALTA: el sitio es una sola pagina de React. El HTML que sale del build trae un
 * <div id="root"> vacio, y todo el contenido aparece solo cuando el navegador ejecuta JavaScript.
 * Google suele renderizar, pero en una segunda pasada, con retraso y sin garantia; y los rastreadores
 * de WhatsApp, X o LinkedIn, que son los que arman la tarjeta al compartir un enlace, no ejecutan
 * nada. Sin este paso, compartir la guia por WhatsApp mostraba el titulo de la portada.
 *
 * ANTES ESTO ABRIA UN NAVEGADOR y guardaba el DOM. Funcionaba en un portatil y no en el servidor de
 * construccion: la imagen de Vercel no trae las librerias de sistema de Chromium y fallaba con
 * "libnspr4.so: cannot open shared object file". El despliegue salia en verde y las cuatro guias
 * devolvian 404, sin que nada avisara. Ahora se renderiza con React directamente, que funciona en
 * cualquier parte, es mas rapido y ahorra 95 MB de descarga en cada build.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { RUTAS } from "./rutas.mjs";

const DIST = "dist";
const SERVIDOR = "dist-ssr/entrada-servidor.js";

const { render } = await import(pathToFileURL(SERVIDOR).href);

const plantilla = readFileSync(join(DIST, "index.html"), "utf8");
const problemas = [];

for (const { ruta } of RUTAS) {
  const { cuerpo, cabeza } = render(ruta);

  // La cabeza de la ruta reemplaza la del index.html, que es la de la portada. Sin esto, las cinco
  // paginas saldrian con el mismo titulo y la misma canonica.
  let html = plantilla.replace(
    /<title>[\s\S]*?<\/title>/,
    () => cabeza.split("\n")[0],
  );
  const resto = cabeza.split("\n").slice(1).join("\n");
  html = html
    // Fuera las etiquetas de la portada que la ruta vuelve a declarar, para no duplicarlas.
    .replace(/\s*<meta name="description"[^>]*>/g, "")
    .replace(/\s*<meta name="robots"[^>]*>/g, "")
    .replace(/\s*<link rel="canonical"[^>]*>/g, "")
    .replace(/\s*<meta property="og:[^>]*>/g, "")
    .replace(/\s*<meta name="twitter:[^>]*>/g, "")
    .replace("</head>", `${resto}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${cuerpo}</div>`);

  const destinos =
    ruta === "/"
      ? [join(DIST, "index.html")]
      : [join(DIST, ruta, "index.html"), join(DIST, `${ruta}.html`)];
  for (const salida of destinos) {
    mkdirSync(join(salida, ".."), { recursive: true });
    writeFileSync(salida, html);
  }

  const encabezados = (html.match(/<h1[ >]/g) ?? []).length;
  if (encabezados !== 1) problemas.push(`${ruta}: ${encabezados} etiquetas h1 (debe haber una)`);
  console.log(
    `  ${ruta.padEnd(34)} ${String(Math.round(html.length / 1024)).padStart(4)} kB   h1=${encabezados}`,
  );
}

// La consola del contador: cascara vacia, no prerenderizada y fuera del indice. Necesita archivo
// propio porque es una ruta de cliente; sin el, el alojamiento devolvia 404. Mandarla al HTML de la
// portada tampoco servia: se veria la portada un instante antes de que React la reemplace.
{
  const cascara = plantilla
    .replace(/<title>[\s\S]*?<\/title>/, "<title>Consola | Clara</title>")
    .replace(/\s*<meta name="robots"[^>]*>/g, "")
    .replace(/\s*<link rel="canonical"[^>]*>/g, "")
    .replace("</head>", '  <meta name="robots" content="noindex, nofollow" />\n  </head>');
  for (const salida of [join(DIST, "consola", "index.html"), join(DIST, "consola.html")]) {
    mkdirSync(join(salida, ".."), { recursive: true });
    writeFileSync(salida, cascara);
  }
  console.log("  /consola                           cascara sin indexar");
}

if (problemas.length) {
  console.error("\nprerender: problemas encontrados");
  for (const p of problemas.slice(0, 6)) console.error("  " + p);
  process.exit(1);
}
console.log(`prerender: ${RUTAS.length} rutas convertidas a HTML estatico`);
